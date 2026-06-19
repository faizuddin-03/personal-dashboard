import { ConflictException, Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { BotDraft, Conversation, ConversationInboundMessage, ConversationOutboundMessage, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { DecisionSubKind } from '../decision/decision.types';

export const CHATBOT_RESOLUTION_CAPTURE_QUEUE = 'chatbot-resolution-capture';

/** WhatsApp customer-service window: the bot may only message a contact within 24h of their last inbound. */
const CS_WINDOW_MS = 24 * 60 * 60 * 1000;
/** A consent offer that goes unanswered for 24h is treated as expired. */
const OFFER_TTL_MS = 24 * 60 * 60 * 1000;
/** States from which a conversation may be closed/resolved by an operator. */
const CLOSEABLE_STATES = ['REPLIED', 'ESCALATED', 'AWAITING_REPLY'];

export interface HandleInboundInput {
  contactId: string;
  metaMessageId: string;
  body: string;
  receivedAt?: Date;
  rawJson?: Prisma.InputJsonValue;
}

export interface RecordAutoReplyInput {
  conversationId: string;
  body: string;
  metaMessageId?: string;
  botDraftId?: string;
  subKind: DecisionSubKind;
}

export interface RecordEscalationInput {
  conversationId: string;
  inboundMessageId: string;
  draftData: {
    body: string;
    intent: string;
    intentConfidence: number;
    draftConfidence: number;
    modelUsed: string;
    embeddingModelUsed: string;
    latencyMs: number;
  };
  citations: Array<{ chunkId: string; similarityScore: number; rank: number }>;
}

export interface CloseInput {
  conversationId: string;
  userId: string;
  disposition: 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP';
  resolutionNotes?: string;
  editedAnswer?: string;
  forcedDespiteDuplicate?: boolean;
}

export type ConversationHistoryTurn = { role: 'customer' | 'bot' | 'operator'; body: string };

/**
 * Owns the conversation lifecycle: find-or-create on inbound, message appends, the consent +
 * escalation state machine, CS-window/offer-expiry computation, and close-with-disposition.
 *
 * Pure Prisma + a BullMQ enqueue — no LLM. Crucially, `handleInbound` NEVER auto-transitions
 * state on a follow-up message; only the decision engine's outputs (recorded via the record*
 * methods) move a conversation through its states.
 */
@Injectable()
export class ConversationService {
  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(CHATBOT_RESOLUTION_CAPTURE_QUEUE) private readonly captureQueue: Queue,
  ) {}

  async handleInbound(
    input: HandleInboundInput,
  ): Promise<{ conversation: Conversation; inboundMessage: ConversationInboundMessage }> {
    // Idempotency on metaMessageId. The webhook now persists the inbound at RECEIPT (fast-ack) and
    // the worker re-derives the same row when it processes the job; Meta also redelivers webhooks.
    // If this exact message was already recorded, return it as-is — no duplicate insert, no second
    // window refresh, and crucially its original (receipt-time) createdAt is preserved, which the
    // reply-quote logic (hasActivityAfterInbound, ordered by createdAt) depends on.
    // jobId=wamid (BullMQ) makes concurrent processing of the same wamid rare; the residual
    // find-then-create race is tolerated — the loser hits the metaMessageId @unique (P2002), which
    // the webhook catches and the worker retries (find now hits this guard).
    const existingInbound = await this.prisma.conversationInboundMessage.findUnique({
      where: { metaMessageId: input.metaMessageId },
      include: { conversation: true },
    });
    if (existingInbound) {
      const { conversation, ...inboundMessage } = existingInbound;
      return { conversation, inboundMessage };
    }

    const receivedAt = input.receivedAt ?? new Date();
    const csWindowExpiresAt = new Date(receivedAt.getTime() + CS_WINDOW_MS);
    const rawJson = input.rawJson ?? {};

    const existing = await this.prisma.conversation.findFirst({
      where: { contactId: input.contactId, closedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      // Append + refresh the window; deliberately leave `state` to the decision engine.
      const [inboundMessage, conversation] = await this.prisma.$transaction([
        this.prisma.conversationInboundMessage.create({
          data: { conversationId: existing.id, metaMessageId: input.metaMessageId, body: input.body, receivedAt, rawJson },
        }),
        this.prisma.conversation.update({
          where: { id: existing.id },
          data: { lastInboundAt: receivedAt, csWindowExpiresAt },
        }),
      ]);
      return { conversation, inboundMessage };
    }

    const created = await this.prisma.conversation.create({
      data: {
        contactId: input.contactId,
        state: 'NEW',
        lastInboundAt: receivedAt,
        csWindowExpiresAt,
        inboundMessages: { create: { metaMessageId: input.metaMessageId, body: input.body, receivedAt, rawJson } },
      },
      include: { inboundMessages: true },
    });
    const { inboundMessages, ...conversation } = created;
    return { conversation, inboundMessage: inboundMessages[0] };
  }

  /**
   * True when something happened in the conversation after this inbound was created — another
   * inbound, or one of the bot's own replies. The orchestrator uses this to decide whether a reply
   * should quote the question: if nothing intervened, the reply directly follows its question (so no
   * quote is needed); if it did, the reply is "out of order" and a quote disambiguates it.
   * Ordering uses createdAt (DB insert order — monotonic and unaffected by Meta-timestamp backdating).
   */
  async hasActivityAfterInbound(conversationId: string, inboundMessageId: string): Promise<boolean> {
    const current = await this.prisma.conversationInboundMessage.findUnique({
      where: { id: inboundMessageId },
      select: { createdAt: true },
    });
    if (!current) return false;
    const [newerInbound, newerOutbound] = await Promise.all([
      this.prisma.conversationInboundMessage.count({
        where: { conversationId, createdAt: { gt: current.createdAt } },
      }),
      this.prisma.conversationOutboundMessage.count({
        where: { conversationId, createdAt: { gt: current.createdAt } },
      }),
    ]);
    return newerInbound > 0 || newerOutbound > 0;
  }

  async recordAutoReply(input: RecordAutoReplyInput): Promise<ConversationOutboundMessage> {
    const sentAt = new Date();
    const updateData: Prisma.ConversationUpdateInput = { lastOutboundAt: sentAt };
    // Only a confident RAG reply advances the conversation; the other auto-send sub-kinds are
    // bookkept by the caller (recordEscalationOffer / clearOfferState / recordEscalation).
    if (input.subKind === 'rag_answer') updateData.state = 'AUTO_REPLIED';

    const [message] = await this.prisma.$transaction([
      this.prisma.conversationOutboundMessage.create({
        data: {
          conversationId: input.conversationId,
          body: input.body,
          kind: 'AUTO_REPLY',
          metaMessageId: input.metaMessageId ?? null,
          botDraftId: input.botDraftId ?? null,
          sentAt,
        },
      }),
      this.prisma.conversation.update({ where: { id: input.conversationId }, data: updateData }),
    ]);
    return message;
  }

  async recordEscalation(input: RecordEscalationInput): Promise<BotDraft> {
    return this.prisma.$transaction(async (tx) => {
      const botDraft = await tx.botDraft.create({
        data: {
          conversationId: input.conversationId,
          inboundMessageId: input.inboundMessageId,
          ...input.draftData,
          state: 'PENDING',
        },
      });
      if (input.citations.length > 0) {
        await tx.botDraftCitation.createMany({
          data: input.citations.map((c) => ({
            botDraftId: botDraft.id,
            chunkId: c.chunkId,
            similarityScore: c.similarityScore,
            rank: c.rank,
          })),
        });
      }
      await tx.conversation.update({ where: { id: input.conversationId }, data: { state: 'ESCALATED' } });
      return botDraft;
    });
  }

  async recordEscalationOffer(conversationId: string, inboundMessageId: string): Promise<Conversation> {
    return this.prisma.conversation.update({
      where: { id: conversationId },
      data: { state: 'ESCALATION_OFFERED', escalationOfferedAt: new Date(), escalationOfferInboundId: inboundMessageId },
    });
  }

  async recordOperatorReply(
    conversationId: string,
    body: string,
    userId: string,
    metaMessageId?: string,
  ): Promise<ConversationOutboundMessage> {
    const sentAt = new Date();
    const [message] = await this.prisma.$transaction([
      this.prisma.conversationOutboundMessage.create({
        data: { conversationId, body, kind: 'OPERATOR_REPLY', sentByUserId: userId, metaMessageId: metaMessageId ?? null, sentAt },
      }),
      this.prisma.conversation.update({ where: { id: conversationId }, data: { lastOutboundAt: sentAt, state: 'REPLIED' } }),
    ]);
    return message;
  }

  async clearOfferState(conversationId: string): Promise<void> {
    const conv = await this.prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });

    // Restore the conversation's pre-offer resting state. A *substantive* bot reply is one sent
    // before the offer-triggering inbound — which excludes the consent offer and the decline ack
    // themselves (both sent in response to that inbound).
    let priorSubstantiveReply = false;
    if (conv.escalationOfferInboundId) {
      const trigger = await this.prisma.conversationInboundMessage.findUnique({
        where: { id: conv.escalationOfferInboundId },
      });
      if (trigger) {
        const prior = await this.prisma.conversationOutboundMessage.findFirst({
          where: { conversationId, kind: 'AUTO_REPLY', sentAt: { lt: trigger.receivedAt } },
        });
        priorSubstantiveReply = prior !== null;
      }
    }

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        state: priorSubstantiveReply ? 'AUTO_REPLIED' : 'NEW',
        escalationOfferedAt: null,
        escalationOfferInboundId: null,
      },
    });
  }

  async hasPendingEscalation(conversationId: string): Promise<boolean> {
    const count = await this.prisma.botDraft.count({ where: { conversationId, state: 'PENDING' } });
    return count > 0;
  }

  async isOfferingEscalation(conversationId: string): Promise<boolean> {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv || conv.state !== 'ESCALATION_OFFERED' || !conv.escalationOfferedAt) return false;
    return Date.now() - conv.escalationOfferedAt.getTime() < OFFER_TTL_MS;
  }

  async getEscalationOfferOriginalInboundId(conversationId: string): Promise<string> {
    const conv = await this.prisma.conversation.findUniqueOrThrow({ where: { id: conversationId } });
    return conv.escalationOfferInboundId ?? '';
  }

  async getCsWindowOpen(conversationId: string): Promise<boolean> {
    const conv = await this.prisma.conversation.findUnique({ where: { id: conversationId } });
    if (!conv?.lastInboundAt) return false;
    return Date.now() - conv.lastInboundAt.getTime() < CS_WINDOW_MS;
  }

  async getConversationHistory(conversationId: string, limit = 10): Promise<ConversationHistoryTurn[]> {
    const [inbound, outbound] = await Promise.all([
      this.prisma.conversationInboundMessage.findMany({
        where: { conversationId },
        select: { body: true, receivedAt: true },
      }),
      this.prisma.conversationOutboundMessage.findMany({
        where: { conversationId },
        select: { body: true, kind: true, sentAt: true, createdAt: true },
      }),
    ]);

    const turns = [
      ...inbound.map((m) => ({ role: 'customer' as const, body: m.body, at: m.receivedAt })),
      ...outbound.map((m) => ({
        role: m.kind === 'OPERATOR_REPLY' ? ('operator' as const) : ('bot' as const),
        body: m.body,
        at: m.sentAt ?? m.createdAt,
      })),
    ];
    turns.sort((a, b) => a.at.getTime() - b.at.getTime());
    return turns.slice(-limit).map(({ role, body }) => ({ role, body }));
  }

  async close(input: CloseInput): Promise<{ conversation: Conversation; captureId: string }> {
    const conv = await this.prisma.conversation.findUniqueOrThrow({ where: { id: input.conversationId } });

    if (!CLOSEABLE_STATES.includes(conv.state)) {
      throw new ConflictException({
        code: 'INVALID_STATE',
        message: `Cannot close a conversation in state ${conv.state}`,
      });
    }

    if (input.disposition !== 'SKIP') {
      const operatorReplies = await this.prisma.conversationOutboundMessage.count({
        where: { conversationId: input.conversationId, kind: 'OPERATOR_REPLY' },
      });
      if (operatorReplies === 0) {
        throw new ConflictException({
          code: 'NO_OPERATOR_REPLY',
          message: 'Cannot capture a resolution without an operator reply',
        });
      }
    }

    const closedAt = new Date();
    const { conversation, capture } = await this.prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.update({
        where: { id: input.conversationId },
        data: { state: 'RESOLVED', closedAt, closedByUserId: input.userId },
      });
      const capture = await tx.resolutionCapture.create({
        data: {
          conversationId: input.conversationId,
          closedByUserId: input.userId,
          closedAt,
          disposition: input.disposition,
          resolutionNotes: input.resolutionNotes ?? null,
          editedAnswer: input.editedAnswer ?? null,
          forcedDespiteDuplicate: input.forcedDespiteDuplicate ?? false,
          status: 'pending',
        },
      });
      return { conversation, capture };
    });

    // Enqueue after the commit so the worker never sees a row that rolled back.
    await this.captureQueue.add(
      CHATBOT_RESOLUTION_CAPTURE_QUEUE,
      { captureId: capture.id, conversationId: input.conversationId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    return { conversation, captureId: capture.id };
  }
}
