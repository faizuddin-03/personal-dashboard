import { BadGatewayException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, ConversationOutboundMessage, ConversationState, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloseConversationDto, ListConversationsDto, UpdateConversationDto } from '../dto/conversations.dto';
import { ConversationService } from '../conversations/conversation.service';
import { ChatbotWhatsappError } from '../whatsapp/chatbot-whatsapp.error';
import { ChatbotWhatsappService } from '../whatsapp/chatbot-whatsapp.service';
import { INBOX_TABS, InboxTab } from './inbox.constants';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** ConflictException payload returned when an operator tries to message a lapsed CS window. */
const CS_WINDOW_CLOSED_ERROR = {
  code: 'CS_WINDOW_CLOSED',
  message: 'The 24h customer-service window has closed. Start a new template conversation to re-engage.',
} as const;

/** Whether a conversation's 24h WhatsApp customer-service window is still open, from its expiry. */
function isCsWindowOpen(csWindowExpiresAt: Date | null): boolean {
  return csWindowExpiresAt != null && csWindowExpiresAt.getTime() > Date.now();
}

/**
 * Operator-facing inbox: read/list/triage queries over conversations plus the manual-reply and
 * close flows. Listing/reads are straight Prisma here; the side-effecting reply/close flows delegate
 * to the canonical ConversationService so the state machine and capture pipeline stay in one place.
 */
@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationService,
    private readonly whatsapp: ChatbotWhatsappService,
  ) {}

  async listConversations(filter: ListConversationsDto) {
    const page = filter.page ?? DEFAULT_PAGE;
    const limit = Math.min(filter.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: Prisma.ConversationWhereInput = {};
    // `tab` is the dashboard's named-tab filter and takes precedence over the legacy single `state`
    // param. When a tab is given it fully governs the state filter: 'all' carries an empty set, so it
    // applies no state filter at all; every other tab narrows to its INBOX_TABS state set.
    if (filter.tab !== undefined) {
      const states = INBOX_TABS[filter.tab];
      if (states.length > 0) where.state = { in: states };
    } else if (filter.state !== undefined) {
      where.state = filter.state;
    }
    if (filter.assignedToId !== undefined) where.assignedToId = filter.assignedToId;
    if (filter.pinned !== undefined) where.pinned = filter.pinned;
    if (filter.search) {
      const contains = { contains: filter.search, mode: 'insensitive' as const };
      where.OR = [
        { contact: { name: contains } },
        { contact: { phoneE164: contains } },
        { inboundMessages: { some: { body: contains } } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.conversation.findMany({
        where,
        include: { contact: { select: { id: true, name: true, phoneE164: true } } },
        orderBy: [{ pinned: 'desc' }, { lastInboundAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.conversation.count({ where }),
    ]);

    return {
      items: items.map((c) => ({ ...c, csWindowOpen: isCsWindowOpen(c.csWindowExpiresAt) })),
      total,
      page,
      limit,
    };
  }

  /**
   * Badge counts for the inbox tabs, derived from a single grouped scan plus one targeted count.
   * Each per-tab number folds the grouped state totals through INBOX_TABS, so the badges always
   * match what the corresponding `?tab=` listing would return (`all` = every conversation).
   */
  async summary(): Promise<Record<InboxTab, number> & { unassigned: number }> {
    const grouped = await this.prisma.conversation.groupBy({ by: ['state'], _count: true });
    const countOf = (state: ConversationState) => grouped.find((g) => g.state === state)?._count ?? 0;
    const sum = (states: ConversationState[]) => states.reduce((n, s) => n + countOf(s), 0);

    // `unassigned` is the operator's "needs me" queue: open work nobody owns yet. We scope it to the
    // awaiting set (ESCALATED + AWAITING_REPLY) — the states a human is actually being waited on — and
    // require assignedToId IS NULL. It needs its own count() because groupBy(['state']) can't also
    // filter on assignedToId.
    const unassigned = await this.prisma.conversation.count({
      where: { assignedToId: null, state: { in: INBOX_TABS.awaiting_reply } },
    });

    return {
      all: grouped.reduce((n, g) => n + g._count, 0),
      auto_replied: sum(INBOX_TABS.auto_replied),
      escalated: sum(INBOX_TABS.escalated),
      awaiting_reply: sum(INBOX_TABS.awaiting_reply),
      in_progress: sum(INBOX_TABS.in_progress),
      resolved: sum(INBOX_TABS.resolved),
      unassigned,
    };
  }

  async getConversation(id: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: {
        contact: true,
        inboundMessages: { orderBy: { receivedAt: 'asc' } },
        outboundMessages: { orderBy: { createdAt: 'asc' } },
        botDrafts: { orderBy: { createdAt: 'desc' }, include: { citations: true } },
      },
    });
    if (!conversation) throw new NotFoundException(`Conversation ${id} not found`);
    return { ...conversation, csWindowOpen: isCsWindowOpen(conversation.csWindowExpiresAt) };
  }

  async updateConversation(id: string, dto: UpdateConversationDto): Promise<Conversation> {
    const existing = await this.prisma.conversation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Conversation ${id} not found`);

    const data: Prisma.ConversationUpdateInput = {};
    if (dto.pinned !== undefined) data.pinned = dto.pinned;
    if (dto.tags !== undefined) data.tags = dto.tags;
    if (dto.assignedToId !== undefined) data.assignedToId = dto.assignedToId;

    return this.prisma.conversation.update({ where: { id }, data });
  }

  async manualReply(
    id: string,
    body: string,
    userId: string,
  ): Promise<{ outboundMessage: ConversationOutboundMessage; conversationId: string }> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id },
      include: { contact: true },
    });
    if (!conversation) throw new NotFoundException(`Conversation ${id} not found`);

    // The bot may only message a contact within 24h of their last inbound; sending into a lapsed
    // window fails at Meta with an opaque 502, so reject it up front with an actionable error.
    if (!(await this.conversations.getCsWindowOpen(id))) throw new ConflictException(CS_WINDOW_CLOSED_ERROR);

    let metaMessageId: string;
    try {
      ({ metaMessageId } = await this.whatsapp.sendTextMessage(conversation.contact.phoneE164, body));
    } catch (err) {
      if (err instanceof ChatbotWhatsappError) throw new BadGatewayException(err.message);
      throw err;
    }

    const outboundMessage = await this.conversations.recordOperatorReply(id, body, userId, metaMessageId);
    return { outboundMessage, conversationId: id };
  }

  /**
   * Take ownership of a conversation: assign it to the operator and clear any outstanding
   * escalation-offer state. Once assigned, the decision engine's human-handling guard keeps the
   * autopilot from replying over the operator.
   */
  async takeOver(id: string, userId: string): Promise<Conversation> {
    const existing = await this.prisma.conversation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException(`Conversation ${id} not found`);

    return this.prisma.conversation.update({
      where: { id },
      data: { assignedToId: userId, escalationOfferedAt: null, escalationOfferInboundId: null },
    });
  }

  closeConversation(id: string, userId: string, dto: CloseConversationDto) {
    return this.conversations.close({
      conversationId: id,
      userId,
      disposition: dto.disposition,
      resolutionNotes: dto.resolutionNotes,
      editedAnswer: dto.editedAnswer,
      forcedDespiteDuplicate: dto.forcedDespiteDuplicate,
    });
  }
}
