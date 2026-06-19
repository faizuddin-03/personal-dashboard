import * as crypto from 'crypto';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bullmq';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { WebhookController } from '../webhook.controller';
import { TemplatesService } from '../../templates/templates.service';
import { BlastsService } from '../../blasts/blasts.service';
import { AutopilotService } from '../../autopilot/autopilot.service';
import { CHATBOT_INBOUND_QUEUE } from '../../chatbot/inbound/chatbot-inbound.queue';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from '../../chatbot/conversations/conversation.service';

const APP_SECRET = 'app-secret';
const VERIFY_TOKEN = 'verify-token';

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const values: Record<string, string> = {
    WHATSAPP_APP_SECRET: APP_SECRET,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
    ...overrides,
  };
  return {
    get: (k: string, fallback?: string) => values[k] ?? fallback,
    getOrThrow: (k: string) => {
      const v = values[k];
      if (!v) throw new Error(`missing: ${k}`);
      return v;
    },
  } as unknown as ConfigService;
}

function sign(body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');
}

describe('WebhookController', () => {
  let controller: WebhookController;
  let templates: { applyMetaTemplateUpdate: jest.Mock };
  let blasts: { applyMetaMessageEvent: jest.Mock; applyInboundMessage: jest.Mock };
  let autopilot: { handleInbound: jest.Mock };
  let chatbotQueue: { add: jest.Mock };

  beforeEach(async () => {
    templates = { applyMetaTemplateUpdate: jest.fn() };
    blasts = { applyMetaMessageEvent: jest.fn(), applyInboundMessage: jest.fn() };
    autopilot = { handleInbound: jest.fn() };
    chatbotQueue = { add: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: ConfigService, useValue: makeConfig() },
        { provide: TemplatesService, useValue: templates },
        { provide: BlastsService, useValue: blasts },
        { provide: AutopilotService, useValue: autopilot },
        { provide: getQueueToken(CHATBOT_INBOUND_QUEUE), useValue: chatbotQueue },
        { provide: PrismaService, useValue: { contact: { findUnique: jest.fn() } } },
        { provide: ConversationService, useValue: { handleInbound: jest.fn() } },
      ],
    }).compile();
    controller = module.get(WebhookController);
  });

  describe('GET /webhooks/meta (verification)', () => {
    it('echoes hub.challenge when token matches', () => {
      const result = controller.verify('subscribe', VERIFY_TOKEN, 'challenge-123');
      expect(result).toBe('challenge-123');
    });

    it('throws ForbiddenException when token mismatches', () => {
      expect(() => controller.verify('subscribe', 'wrong', 'x')).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when mode is not subscribe', () => {
      expect(() => controller.verify('unsubscribe', VERIFY_TOKEN, 'x')).toThrow(ForbiddenException);
    });
  });

  describe('POST /webhooks/meta (event)', () => {
    const buildBody = () => ({
      object: 'whatsapp_business_account' as const,
      entry: [
        {
          id: 'waba-1',
          changes: [
            {
              field: 'message_template_status_update',
              value: {
                event: 'APPROVED' as const,
                message_template_id: '111',
                message_template_name: 'raya',
                message_template_language: 'MS',
              },
            },
          ],
        },
      ],
    });

    it('rejects when raw body is missing', async () => {
      const body = buildBody();
      await expect(
        controller.receive('sha256=foo', body, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when signature is invalid', async () => {
      const body = buildBody();
      const raw = Buffer.from(JSON.stringify(body));
      await expect(
        controller.receive('sha256=bad', body, { rawBody: raw } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('processes valid event and delegates to TemplatesService', async () => {
      const body = buildBody();
      const raw = Buffer.from(JSON.stringify(body));
      const signature = sign(raw.toString('utf8'));

      await controller.receive(signature, body, { rawBody: raw } as any);

      expect(templates.applyMetaTemplateUpdate).toHaveBeenCalledWith(body.entry[0].changes[0].value);
    });

    it('ignores non-template events without error', async () => {
      const body = {
        object: 'whatsapp_business_account' as const,
        entry: [
          {
            id: 'waba-1',
            changes: [{ field: 'messages', value: {} as any }],
          },
        ],
      };
      const raw = Buffer.from(JSON.stringify(body));
      const signature = sign(raw.toString('utf8'));

      const result = await controller.receive(signature, body as any, { rawBody: raw } as any);
      expect(result).toEqual({ received: true });
      expect(templates.applyMetaTemplateUpdate).not.toHaveBeenCalled();
    });

    it('routes messages.status events to BlastsService', async () => {
      const body = {
        object: 'whatsapp_business_account' as const,
        entry: [{
          id: 'waba-1',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp' as const,
              metadata: { display_phone_number: '+60123456789', phone_number_id: 'pnid' },
              statuses: [{
                id: 'wamid.abc',
                status: 'delivered' as const,
                timestamp: '1234567890',
                recipient_id: '60198765432',
              }],
            },
          }],
        }],
      };
      const raw = Buffer.from(JSON.stringify(body));
      const signature = sign(raw.toString('utf8'));

      await controller.receive(signature, body as any, { rawBody: raw } as any);

      expect(blasts.applyMetaMessageEvent).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'wamid.abc', status: 'delivered' }),
      );
    });

    it('routes inbound messages (replies) to BlastsService.applyInboundMessage', async () => {
      const body = {
        object: 'whatsapp_business_account' as const,
        entry: [{
          id: 'waba-1',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp' as const,
              metadata: { display_phone_number: '+60123456789', phone_number_id: 'pnid' },
              messages: [{
                from: '60198765432',
                id: 'wamid.reply123',
                timestamp: '1234567890',
                type: 'text' as const,
                text: { body: 'Yes please!' },
              }],
            },
          }],
        }],
      };
      const raw = Buffer.from(JSON.stringify(body));
      const signature = sign(raw.toString('utf8'));

      blasts.applyInboundMessage.mockResolvedValue({ contactId: 'c1', inboundMessageId: 'in1', body: 'Yes please!' });

      await controller.receive(signature, body as any, { rawBody: raw } as any);

      expect(blasts.applyInboundMessage).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'wamid.reply123', text: { body: 'Yes please!' } }),
      );
      expect(autopilot.handleInbound).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 'c1', inboundMessageId: 'in1' }),
      );
    });

    it('does NOT enqueue the chatbot when CHATBOT_ENABLED is unset (default off)', async () => {
      const body = {
        object: 'whatsapp_business_account' as const,
        entry: [{
          id: 'waba-1',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp' as const,
              metadata: { display_phone_number: '+60123456789', phone_number_id: 'pnid' },
              messages: [{
                from: '60198765432', id: 'wamid.x', timestamp: '1234567890',
                type: 'text' as const, text: { body: 'hi' },
              }],
            },
          }],
        }],
      };
      const raw = Buffer.from(JSON.stringify(body));
      await controller.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(chatbotQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('chatbot bridge (CHATBOT_ENABLED=true)', () => {
    let cbController: WebhookController;
    let cbChatbotQueue: { add: jest.Mock };
    let cbConversations: { handleInbound: jest.Mock };
    let cbPrisma: { contact: { findUnique: jest.Mock } };

    const inboundBody = () => ({
      object: 'whatsapp_business_account' as const,
      entry: [{
        id: 'waba-1',
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp' as const,
            metadata: { display_phone_number: '+60123456789', phone_number_id: 'pnid' },
            contacts: [{ wa_id: '60198765432', profile: { name: 'Tan' } }],
            messages: [{
              from: '60198765432', id: 'wamid.cb1', timestamp: '1234567890',
              type: 'text' as const, text: { body: 'hello' },
            }],
          },
        }],
      }],
    });

    beforeEach(async () => {
      cbChatbotQueue = { add: jest.fn() };
      cbConversations = {
        handleInbound: jest.fn().mockResolvedValue({ conversation: { id: 'conv1' }, inboundMessage: { id: 'in1' } }),
      };
      cbPrisma = {
        contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', phoneE164: '+60198765432' }) },
      };
      const module = await Test.createTestingModule({
        controllers: [WebhookController],
        providers: [
          { provide: ConfigService, useValue: makeConfig({ CHATBOT_ENABLED: 'true' }) },
          { provide: TemplatesService, useValue: { applyMetaTemplateUpdate: jest.fn() } },
          // applyInboundMessage → null so the autopilot path is a no-op; we're testing the chatbot bridge.
          { provide: BlastsService, useValue: { applyMetaMessageEvent: jest.fn(), applyInboundMessage: jest.fn().mockResolvedValue(null) } },
          { provide: AutopilotService, useValue: { handleInbound: jest.fn() } },
          { provide: getQueueToken(CHATBOT_INBOUND_QUEUE), useValue: cbChatbotQueue },
          { provide: ConversationService, useValue: cbConversations },
          { provide: PrismaService, useValue: cbPrisma },
        ],
      }).compile();
      cbController = module.get(WebhookController);
    });

    it('enqueues each inbound message (with contacts) on the chatbot-inbound queue, keyed by wamid', async () => {
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));
      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbChatbotQueue.add).toHaveBeenCalledWith(
        CHATBOT_INBOUND_QUEUE,
        expect.objectContaining({
          contacts: [{ wa_id: '60198765432', profile: { name: 'Tan' } }],
          message: expect.objectContaining({ id: 'wamid.cb1', text: { body: 'hello' } }),
        }),
        // jobId = wamid is the redelivery-dedup gate: a re-add while the job exists is a no-op.
        expect.objectContaining({ jobId: 'wamid.cb1' }),
      );
    });

    it('carries quote-reply context into the enqueued payload', async () => {
      const body = {
        object: 'whatsapp_business_account' as const,
        entry: [{
          id: 'waba-1',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp' as const,
              metadata: { display_phone_number: '+60123456789', phone_number_id: 'pnid' },
              contacts: [{ wa_id: '60198765432', profile: { name: 'Tan' } }],
              messages: [{
                from: '60198765432', id: 'wamid.cb2', timestamp: '1234567890',
                type: 'text' as const, text: { body: 'quoting you' },
                context: { id: 'wamid.original', from: '60123456789' },
              }],
            },
          }],
        }],
      };
      const raw = Buffer.from(JSON.stringify(body));
      await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(cbChatbotQueue.add).toHaveBeenCalledWith(
        CHATBOT_INBOUND_QUEUE,
        expect.objectContaining({
          message: expect.objectContaining({ context: { id: 'wamid.original', from: '60123456789' } }),
        }),
        expect.objectContaining({ jobId: 'wamid.cb2' }),
      );
    });

    it('swallows an enqueue failure — the webhook still returns received:true', async () => {
      cbChatbotQueue.add.mockRejectedValueOnce(new Error('redis down'));
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));

      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbChatbotQueue.add).toHaveBeenCalled();
    });

    it('persists the inbound at receipt (idempotent) BEFORE enqueuing — restores quote ordering', async () => {
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));
      await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(cbPrisma.contact.findUnique).toHaveBeenCalledWith({ where: { phoneE164: '+60198765432' } });
      expect(cbConversations.handleInbound).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 'c1', metaMessageId: 'wamid.cb1', body: 'hello' }),
      );
      expect(cbChatbotQueue.add).toHaveBeenCalledWith(
        CHATBOT_INBOUND_QUEUE,
        expect.objectContaining({ message: expect.objectContaining({ id: 'wamid.cb1' }) }),
        expect.objectContaining({ jobId: 'wamid.cb1' }),
      );
      // Order matters: the row must exist (receipt-time createdAt) before the worker can run.
      expect(cbConversations.handleInbound.mock.invocationCallOrder[0]).toBeLessThan(
        cbChatbotQueue.add.mock.invocationCallOrder[0],
      );
    });

    it('skips a non-text message — no persist, no enqueue', async () => {
      const body = inboundBody();
      (body.entry[0].changes[0].value as any).messages[0] = {
        from: '60198765432', id: 'wamid.img', timestamp: '1234567890', type: 'image',
      };
      const raw = Buffer.from(JSON.stringify(body));
      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbConversations.handleInbound).not.toHaveBeenCalled();
      expect(cbChatbotQueue.add).not.toHaveBeenCalled();
    });

    it('skips an unknown contact — no persist, no enqueue', async () => {
      cbPrisma.contact.findUnique.mockResolvedValueOnce(null);
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));
      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbConversations.handleInbound).not.toHaveBeenCalled();
      expect(cbChatbotQueue.add).not.toHaveBeenCalled();
    });

    it('swallows a persist failure — webhook still returns received:true, no enqueue', async () => {
      cbConversations.handleInbound.mockRejectedValueOnce(new Error('db down'));
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));
      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbChatbotQueue.add).not.toHaveBeenCalled();
    });
  });
});
