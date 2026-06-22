import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EscalationReason, Prisma, Ticket, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { LlmService } from '../llm/llm.service';
import { ConversationService } from '../chatbot/conversations/conversation.service';
import type { CloseDisposition } from '../chatbot/dto/conversations.dto';
import { suggestSlug } from './tickets.suggest';

/** Display id for a ticket, e.g. seq 48 -> "TCK-1048". */
export function formatTicketNum(seq: number): string {
  return `TCK-${1000 + seq}`;
}

export interface ResolveOptions {
  disposition?: CloseDisposition;
  resolutionNotes?: string;
  editedAnswer?: string;
}

const TICKET_INCLUDE = {
  contact: true,
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TicketInclude;

const ACTIVE_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
    private readonly llm: LlmService,
    private readonly conversations: ConversationService,
  ) {}

  /** Called by the Autopilot bot when it escalates an inbound message. */
  createFromEscalation(input: {
    contactId: string;
    reason: EscalationReason;
    intent?: string | null;
    autopilotEventId?: string | null;
  }): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: {
        contactId: input.contactId,
        reason: input.reason,
        intent: input.intent ?? null,
        autopilotEventId: input.autopilotEventId ?? null,
        status: 'OPEN',
      },
    });
  }

  async list(opts: { tab?: 'active' | 'closed'; status?: TicketStatus[]; assigneeId?: string }) {
    const where: Prisma.TicketWhereInput = {};
    if (opts.status?.length) where.status = { in: opts.status };
    else if (opts.tab === 'closed') where.status = 'CLOSED';
    else if (opts.tab === 'active') where.status = { in: ACTIVE_STATUSES };
    if (opts.assigneeId) where.assigneeId = opts.assigneeId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      include: TICKET_INCLUDE,
    });
    return tickets.map((t) => this.enrich(t));
  }

  async get(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.enrich(ticket);
  }

  async agentContext(id: string) {
    const ticket = await this.getOrThrow(id);
    if (ticket.conversationId) {
      const draft = await this.prisma.botDraft.findFirst({
        where: { conversationId: ticket.conversationId },
        orderBy: { createdAt: 'desc' },
        include: { citations: { include: { chunk: { include: { document: true } } }, orderBy: { rank: 'asc' } } },
      });
      if (draft) {
        return {
          intent: ticket.intent,
          reason: ticket.reason,
          confidence: draft.draftConfidence,
          escalatedAt: ticket.openedAt,
          suggestedKnowledge: draft.citations.map((c) => ({
            id: c.chunk.document.id,
            slug: c.chunk.document.name, // KnowledgeDocument has no slug field; name (filename) fills the slug key
            question: c.chunk.document.title,
            answer: c.chunk.text,
            category: c.chunk.document.category,
          })),
        };
      }
    }
    const event = ticket.autopilotEventId
      ? await this.prisma.autopilotEvent.findUnique({ where: { id: ticket.autopilotEventId } })
      : null;
    const inbound = await this.prisma.inboundMessage.findFirst({
      where: { contactId: ticket.contactId },
      orderBy: { receivedAt: 'desc' },
    });
    const hits = inbound?.body
      ? await this.knowledge.retrieve(inbound.body, { intent: ticket.intent ?? undefined, limit: 3 })
      : [];
    return {
      intent: ticket.intent,
      reason: ticket.reason,
      confidence: event?.confidence ?? null,
      escalatedAt: event?.createdAt ?? ticket.openedAt,
      suggestedKnowledge: hits.map((h) => ({
        id: h.doc.id, slug: h.doc.slug, question: h.doc.question, answer: h.doc.answer, category: h.doc.category,
      })),
    };
  }

  async assign(id: string, assigneeId: string) {
    await this.getOrThrow(id);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'IN_PROGRESS', assigneeId, assignedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    if (ticket.conversationId) {
      // Take over the linked chatbot conversation so the decision engine's human-handling guard
      // stands the bot down (it never replies over an assigned operator).
      await this.prisma.conversation.update({
        where: { id: ticket.conversationId },
        data: { assignedToId: assigneeId },
      });
    }
    return this.enrich(ticket);
  }

  async resolve(id: string, userId: string, opts: ResolveOptions = {}) {
    const existing = await this.getOrThrow(id);
    // Close-first: for a non-SKIP disposition the capture must succeed (or surface) BEFORE we mark the
    // ticket resolved, so a NO_OPERATOR_REPLY/INVALID_STATE error never leaves a resolved ticket with no
    // capture. SKIP stays best-effort (swallows a non-closeable conversation; see closeLinkedConversation).
    await this.closeLinkedConversation(existing.conversationId, userId, opts);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  async close(id: string, userId: string, opts: ResolveOptions = {}) {
    const existing = await this.getOrThrow(id);
    await this.closeLinkedConversation(existing.conversationId, userId, opts);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  async reopen(id: string) {
    await this.getOrThrow(id);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'OPEN', resolvedAt: null, closedAt: null },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  async suggestReply(id: string): Promise<{ text: string; confidence: number }> {
    const ticket = await this.getOrThrow(id);
    if (ticket.conversationId) {
      const draft = await this.prisma.botDraft.findFirst({
        where: { conversationId: ticket.conversationId, suggestedReply: { not: null } },
        orderBy: { createdAt: 'desc' },
      });
      if (draft?.suggestedReply) {
        return { text: draft.suggestedReply, confidence: draft.draftConfidence };
      }
    }
    const inbound = await this.prisma.inboundMessage.findFirst({
      where: { contactId: ticket.contactId },
      orderBy: { receivedAt: 'desc' },
    });
    if (!inbound?.body) return { text: '', confidence: 0 };
    const contact = await this.prisma.contact.findUnique({ where: { id: ticket.contactId } });
    const hits = await this.knowledge.retrieve(inbound.body, { intent: ticket.intent ?? undefined, limit: 3 });
    const reply = await this.llm.generateReply({
      message: inbound.body,
      intent: ticket.intent ?? undefined,
      knowledge: hits.map((h) => ({ question: h.doc.question, answer: h.doc.answer })),
      dealerName: contact?.picName ?? contact?.name ?? undefined,
    });
    return { text: reply.text, confidence: reply.confidence };
  }

  /** Propose a Q&A for the KB from this ticket's conversation (latest inbound + latest agent reply). */
  async suggestKnowledge(id: string) {
    const ticket = await this.getOrThrow(id);
    const [inbound, outbound] = await Promise.all([
      this.prisma.inboundMessage.findFirst({
        where: { contactId: ticket.contactId },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.message.findFirst({
        where: { contactId: ticket.contactId, source: 'INBOX', body: { not: null } },
        orderBy: { sentAt: 'desc' },
      }),
    ]);
    const question = inbound?.body ?? '';
    const answer = outbound?.body ?? '';
    return { ticketId: id, question, answer, suggestedSlug: suggestSlug(question), category: 'General' };
  }

  /** Save an agent-curated Q&A as a CANDIDATE knowledge doc linked to this ticket. */
  async createKnowledgeCandidate(
    id: string,
    input: { question: string; answer: string; slug: string; category: string },
  ) {
    await this.getOrThrow(id);
    return this.knowledge.create({
      slug: input.slug,
      question: input.question,
      answer: input.answer,
      category: input.category,
      source: 'FROM_ESCALATION',
      status: 'CANDIDATE',
      ticketId: id,
    });
  }

  private async closeLinkedConversation(
    conversationId: string | null,
    userId: string,
    opts: ResolveOptions,
  ): Promise<void> {
    if (!conversationId) return;
    const disposition = opts.disposition ?? 'SKIP';
    try {
      await this.conversations.close({
        conversationId,
        userId,
        disposition,
        resolutionNotes: opts.resolutionNotes,
        editedAnswer: opts.editedAnswer,
      });
    } catch (err) {
      // SKIP: a non-closeable conversation (ConflictException) is expected and swallow-worthy — the
      // ticket is the operator's primary object and take-over already stood the bot down. Re-throw
      // anything else (DB/Redis down, programming error).
      // Non-SKIP: the operator explicitly asked to capture, so surface the conflict
      // (NO_OPERATOR_REPLY / INVALID_STATE) rather than silently dropping the capture.
      if (err instanceof ConflictException && disposition === 'SKIP') {
        this.logger.warn(`closeLinkedConversation skipped conv=${conversationId}: ${err.message}`);
        return;
      }
      throw err;
    }
  }

  private enrich<T extends { seq: number }>(ticket: T): T & { num: string } {
    return { ...ticket, num: formatTicketNum(ticket.seq) };
  }

  private async getOrThrow(id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}
