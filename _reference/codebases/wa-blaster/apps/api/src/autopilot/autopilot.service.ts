import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { WhatsappCloudApiService } from '../whatsapp/whatsapp-cloud-api.service';
import { TicketsService } from '../tickets/tickets.service';
import {
  INTENTS,
  isOptOut,
  escalationReasonForIntent,
  meetsThreshold,
} from './autopilot.policy';

/** Records which model produced the reply (the mock today; a real provider later). */
const AUTOPILOT_MODEL = 'mock';
const KB_RETRIEVE_LIMIT = 3;

export interface InboundForBot {
  contactId: string;
  inboundMessageId: string;
  body: string;
}

@Injectable()
export class AutopilotService {
  private readonly logger = new Logger(AutopilotService.name);

  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly llm: LlmService,
    private readonly settings: SystemSettingsService,
    @Inject(forwardRef(() => WhatsappCloudApiService))
    private readonly whatsapp: WhatsappCloudApiService,
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
  ) {}

  async handleInbound(inbound: InboundForBot): Promise<void> {
    const [enabled, threshold, honourStop] = await Promise.all([
      this.settings.get('autopilot_enabled', 'true'),
      this.settings.get('autopilot_escalation_threshold', '70'),
      this.settings.get('autopilot_honour_stop', 'true'),
    ]);

    // 1. Opt-out (STOP / BERHENTI)
    if (honourStop === 'true' && isOptOut(inbound.body)) {
      await this.prisma.contact.update({
        where: { id: inbound.contactId },
        data: { optInStatus: 'OPTED_OUT', optOutAt: new Date() },
      });
      await this.log(inbound, { action: 'OPTED_OUT' });
      return;
    }

    // 2. Autopilot off -> leave it for a human (visible as an unresolved inbox conversation)
    if (enabled !== 'true') {
      await this.log(inbound, { action: 'SKIPPED' });
      return;
    }

    // The bot is now handling this inbound.
    await this.prisma.inboundMessage.update({
      where: { id: inbound.inboundMessageId },
      data: { routedTo: 'CHATBOT' },
    });

    // 3. Intent + sensitive-intent guardrail
    const { intent } = await this.llm.classifyIntent({ message: inbound.body, intents: [...INTENTS] });
    const guardReason = escalationReasonForIntent(intent);
    if (guardReason) {
      await this.escalate(inbound, { reason: guardReason, intent });
      return;
    }

    // 4. Ground on the knowledge base
    const hits = await this.knowledge.retrieve(inbound.body, { intent, limit: KB_RETRIEVE_LIMIT });
    if (hits.length === 0) {
      await this.escalate(inbound, { reason: 'KNOWLEDGE_GAP', intent });
      return;
    }

    // 5. Generate a grounded reply + confidence
    const contact = await this.prisma.contact.findUnique({ where: { id: inbound.contactId } });
    const reply = await this.llm.generateReply({
      message: inbound.body,
      intent,
      knowledge: hits.map((h) => ({ question: h.doc.question, answer: h.doc.answer })),
      dealerName: contact?.picName ?? contact?.name ?? undefined,
    });

    // 6. Confidence routing
    if (!meetsThreshold(reply.confidence, Number(threshold))) {
      await this.escalate(inbound, { reason: 'LOW_CONFIDENCE', intent, confidence: reply.confidence });
      return;
    }

    // 7. Auto-reply: send, record the outbound message, resolve the conversation, bump KB usage
    if (!contact) return; // defensive — contact was resolved upstream
    const { metaMessageId } = await this.whatsapp.sendFreeFormText(contact.phoneE164, reply.text);
    const now = new Date();
    const matchedKbDocId = hits[0].doc.id;
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          contactId: inbound.contactId,
          blastId: null,
          body: reply.text,
          source: 'INBOX',
          status: 'SENT',
          metaMessageId,
          sentAt: now,
        },
      }),
      this.prisma.inboxConversationState.update({
        where: { contactId: inbound.contactId },
        data: { lastOutboundAt: now, resolvedAt: now },
      }),
      this.prisma.knowledgeDoc.update({ where: { id: matchedKbDocId }, data: { uses: { increment: 1 } } }),
    ]);
    await this.log(inbound, {
      action: 'AUTO_REPLIED',
      intent,
      confidence: reply.confidence,
      matchedKbDocId,
      replyText: reply.text,
    });
  }

  async listEvents(opts: { action?: 'AUTO_REPLIED' | 'ESCALATED' | 'OPTED_OUT' | 'SKIPPED'; contactId?: string; limit?: number }) {
    const where: any = {};
    if (opts.action) where.action = opts.action;
    if (opts.contactId) where.contactId = opts.contactId;
    const events = await this.prisma.autopilotEvent.findMany({
      where, orderBy: { createdAt: 'desc' }, take: Math.min(opts.limit ?? 50, 200),
    });
    // enrich with contact name + matched KB slug (bare ids on the event)
    const contactIds = [...new Set(events.map(e => e.contactId))];
    const kbIds = [...new Set(events.map(e => e.matchedKbDocId).filter(Boolean) as string[])];
    const [contacts, kbDocs] = await Promise.all([
      contactIds.length ? this.prisma.contact.findMany({ where: { id: { in: contactIds } }, select: { id: true, name: true, phoneE164: true } }) : Promise.resolve([]),
      kbIds.length ? this.prisma.knowledgeDoc.findMany({ where: { id: { in: kbIds } }, select: { id: true, slug: true } }) : Promise.resolve([]),
    ]);
    const cMap = new Map(contacts.map(c => [c.id, c]));
    const kMap = new Map(kbDocs.map(k => [k.id, k]));
    return events.map(e => ({
      ...e,
      contact: cMap.get(e.contactId) ?? null,
      matchedKbSlug: e.matchedKbDocId ? (kMap.get(e.matchedKbDocId)?.slug ?? null) : null,
    }));
  }

  private async escalate(
    inbound: InboundForBot,
    fields: { reason: 'COMPLAINT' | 'LOW_CONFIDENCE' | 'KNOWLEDGE_GAP' | 'SENSITIVE'; intent?: string; confidence?: number },
  ): Promise<void> {
    const event = await this.log(inbound, {
      action: 'ESCALATED',
      reason: fields.reason,
      intent: fields.intent,
      confidence: fields.confidence,
    });
    await this.tickets.createFromEscalation({
      contactId: inbound.contactId,
      reason: fields.reason,
      intent: fields.intent ?? null,
      autopilotEventId: event.id,
    });
  }

  private async log(
    inbound: InboundForBot,
    fields: {
      action: 'AUTO_REPLIED' | 'ESCALATED' | 'OPTED_OUT' | 'SKIPPED';
      intent?: string;
      confidence?: number;
      reason?: 'COMPLAINT' | 'LOW_CONFIDENCE' | 'KNOWLEDGE_GAP' | 'SENSITIVE';
      matchedKbDocId?: string;
      replyText?: string;
    },
  ) {
    return this.prisma.autopilotEvent.create({
      data: {
        contactId: inbound.contactId,
        inboundMessageId: inbound.inboundMessageId,
        action: fields.action,
        intent: fields.intent ?? null,
        confidence: fields.confidence ?? null,
        reason: fields.reason ?? null,
        matchedKbDocId: fields.matchedKbDocId ?? null,
        replyText: fields.replyText ?? null,
        model: fields.action === 'AUTO_REPLIED' ? AUTOPILOT_MODEL : null,
      },
    });
  }
}
