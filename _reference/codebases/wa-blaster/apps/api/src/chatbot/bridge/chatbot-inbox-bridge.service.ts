import { Injectable, Logger } from '@nestjs/common';
import { EscalationReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Best-effort writer that mirrors the RAG chatbot's outcomes into the legacy Autopilot/Tickets/Message
 * tables the dashboard inbox reads. Depends only on the global PrismaService so it runs in the worker
 * process without importing API-only modules. Every method swallows errors (logs only) — a bridge
 * failure must never break the chatbot reply/escalation pipeline.
 */
@Injectable()
export class ChatbotInboxBridge {
  private readonly logger = new Logger(ChatbotInboxBridge.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Mirror a confident chatbot auto-reply → AutopilotEvent(AUTO_REPLIED) + Message(source=CHATBOT). */
  async recordAutoReply(input: {
    contactId: string;
    intent?: string;
    confidence?: number;
    replyText: string;
    metaMessageId?: string;
    model?: string;
  }): Promise<void> {
    try {
      const sentAt = new Date();
      await this.prisma.$transaction([
        this.prisma.autopilotEvent.create({
          data: {
            contactId: input.contactId,
            inboundMessageId: null, // chatbot has no legacy InboundMessage id; column is nullable
            action: 'AUTO_REPLIED',
            intent: input.intent ?? null,
            confidence: input.confidence ?? null,
            replyText: input.replyText,
            model: input.model ?? null,
          },
        }),
        this.prisma.message.create({
          data: {
            contactId: input.contactId,
            blastId: null,
            body: input.replyText,
            source: 'CHATBOT',
            status: 'SENT',
            metaMessageId: input.metaMessageId ?? null,
            sentAt,
          },
        }),
      ]);
    } catch (err) {
      this.logger.error(`bridge recordAutoReply failed contactId=${input.contactId}: ${(err as Error).message}`);
    }
  }

  /** Mirror a chatbot escalation → AutopilotEvent(ESCALATED) + Ticket linked to the conversation. */
  async recordEscalation(input: {
    contactId: string;
    conversationId: string;
    reason: string;
    intent?: string;
    confidence?: number;
  }): Promise<void> {
    try {
      const reason = mapEscalationReason(input.reason);
      await this.prisma.$transaction(async (tx) => {
        const event = await tx.autopilotEvent.create({
          data: {
            contactId: input.contactId,
            inboundMessageId: null,
            action: 'ESCALATED',
            reason,
            intent: input.intent ?? null,
            confidence: input.confidence ?? null,
          },
        });
        await tx.ticket.create({
          data: {
            contactId: input.contactId,
            conversationId: input.conversationId,
            reason,
            intent: input.intent ?? null,
            autopilotEventId: event.id,
            status: 'OPEN',
          },
        });
      });
    } catch (err) {
      this.logger.error(`bridge recordEscalation failed contactId=${input.contactId}: ${(err as Error).message}`);
    }
  }

  /** Mirror an operator reply (sent via the chatbot client) into the legacy Message table for the thread view. */
  async mirrorOperatorReply(input: { contactId: string; body: string; metaMessageId?: string }): Promise<void> {
    try {
      await this.prisma.message.create({
        data: {
          contactId: input.contactId,
          blastId: null,
          body: input.body,
          source: 'INBOX',
          status: 'SENT',
          metaMessageId: input.metaMessageId ?? null,
          sentAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(`bridge mirrorOperatorReply failed contactId=${input.contactId}: ${(err as Error).message}`);
    }
  }
}

/**
 * Map a chatbot decision `reason` string onto the legacy EscalationReason enum.
 * Unknown reasons fall back to SENSITIVE so no escalation is ever dropped for lack of a mapping.
 */
export function mapEscalationReason(reason: string): EscalationReason {
  if (reason === 'complaint') return 'COMPLAINT';
  if (reason === 'low_intent_confidence') return 'LOW_CONFIDENCE';
  if (reason.includes('no_kb') || reason.includes('knowledge')) return 'KNOWLEDGE_GAP';
  return 'SENSITIVE';
}
