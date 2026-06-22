import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  forwardRef,
  Get,
  Headers,
  Inject,
  Logger,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifyMetaSignature } from './webhook-signature.util';
import { MetaWebhookPayload } from './dto/meta-template-event.dto';
import { TemplatesService } from '../templates/templates.service';
import { BlastsService } from '../blasts/blasts.service';
import { MetaMessagesValue } from './dto/meta-message-event.dto';
import { AutopilotService } from '../autopilot/autopilot.service';
import { CHATBOT_INBOUND_QUEUE, ChatbotInboundJobPayload } from '../chatbot/inbound/chatbot-inbound.queue';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from '../chatbot/conversations/conversation.service';

@Controller('webhooks/meta')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly templates: TemplatesService,
    private readonly blasts: BlastsService,
    @Inject(forwardRef(() => AutopilotService))
    private readonly autopilot: AutopilotService,
    @InjectQueue(CHATBOT_INBOUND_QUEUE)
    private readonly chatbotInboundQueue: Queue<ChatbotInboundJobPayload>,
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationService,
  ) {}

  /** Meta sends this once when configuring the webhook URL. We echo `hub.challenge`. */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expected = this.config.getOrThrow<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) {
      return challenge;
    }
    throw new ForbiddenException('verification failed');
  }

  @Post()
  async receive(
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: MetaWebhookPayload,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const appSecret = this.config.getOrThrow<string>('WHATSAPP_APP_SECRET');
    if (!req.rawBody) {
      throw new BadRequestException('raw body unavailable');
    }
    if (!verifyMetaSignature(req.rawBody, signature ?? '', appSecret)) {
      this.logger.warn('Rejected webhook with invalid signature');
      throw new ForbiddenException('invalid signature');
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === 'message_template_status_update') {
          await this.templates.applyMetaTemplateUpdate(change.value as any);
        } else if (change.field === 'messages') {
          const value = change.value as unknown as MetaMessagesValue;
          for (const status of value.statuses ?? []) {
            await this.blasts.applyMetaMessageEvent(status);
          }
          const chatbotEnabled = this.config.get<string>('CHATBOT_ENABLED', 'false') === 'true';
          for (const inbound of value.messages ?? []) {
            const stored = await this.blasts.applyInboundMessage(inbound);
            // When the RAG chatbot is enabled it is the single brain (it feeds Autopilot/Tickets via
            // ChatbotInboxBridge), so skip the legacy autopilot to avoid double-handling each inbound.
            if (stored && !chatbotEnabled) {
              try {
                await this.autopilot.handleInbound(stored);
              } catch (err) {
                this.logger.error('Autopilot handleInbound failed', err as Error);
              }
            }
          }

          // RAG chatbot (feature-flagged, default off). Independent of the autopilot path above.
          // PERSIST-AT-RECEIPT then FAST-ACK: do the fast synchronous DB work (resolve contact +
          // idempotently record the inbound, so its createdAt reflects arrival order — the worker's
          // reply-quote check, hasActivityAfterInbound by createdAt, needs sibling rows to exist when
          // an earlier message is answered), THEN enqueue the slow classify→RAG→draft→send pipeline
          // and return immediately. The persist is a single indexed insert (no LLM), so the ack stays
          // fast. jobId=wamid + the idempotent handleInbound + the receivedAt staleness guard keep
          // redeliveries safe.
          if (chatbotEnabled && value.messages?.length) {
            for (const msg of value.messages) {
              try {
                if (msg.type !== 'text' || !msg.text?.body) {
                  this.logger.log(`chatbot ignored_non_text type=${msg.type} wamid=${msg.id}`);
                  continue;
                }
                const phoneE164 = '+' + msg.from;
                const contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
                if (!contact) {
                  this.logger.warn(`chatbot unknown_contact phone=${phoneE164} wamid=${msg.id} — skipping`);
                  continue;
                }
                await this.conversations.handleInbound({
                  contactId: contact.id,
                  metaMessageId: msg.id,
                  body: msg.text.body,
                  receivedAt: new Date(parseInt(msg.timestamp, 10) * 1000),
                  // Meta DTO types aren't structurally assignable to Prisma's recursive JsonValue;
                  // the object is plain JSON at runtime, so widen it explicitly.
                  rawJson: { contacts: value.contacts ?? [], message: msg } as unknown as Prisma.InputJsonValue,
                });
                await this.chatbotInboundQueue.add(
                  CHATBOT_INBOUND_QUEUE,
                  { contacts: value.contacts ?? [], message: msg },
                  {
                    jobId: msg.id,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: { age: 3600, count: 1000 },
                    removeOnFail: { age: 86400, count: 5000 },
                  },
                );
              } catch (err) {
                // Persist OR enqueue failure must never fail the webhook (fast-ack contract). Meta
                // redelivers; the idempotent persist + staleness guard keep the retry safe.
                this.logger.error(`Chatbot persist/enqueue failed for wamid=${msg.id}: ${(err as Error).message}`);
              }
            }
          }
        } else {
          this.logger.log(`Ignoring webhook field=${change.field}`);
        }
      }
    }
    return { received: true };
  }
}
