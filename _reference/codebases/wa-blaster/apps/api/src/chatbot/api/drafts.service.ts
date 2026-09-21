import {
  BadGatewayException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BotDraft, ConversationOutboundMessage, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListDraftsDto } from '../dto/drafts.dto';
import { ConversationService } from '../conversations/conversation.service';
import { ChatbotWhatsappError } from '../whatsapp/chatbot-whatsapp.error';
import { ChatbotWhatsappService } from '../whatsapp/chatbot-whatsapp.service';

/** Max page size — protects the DB from an operator asking for an unbounded list. */
const MAX_LIMIT = 100;

const INVALID_DRAFT_STATE = {
  code: 'INVALID_DRAFT_STATE',
  message: 'Draft is not pending and can no longer be actioned',
} as const;

const CS_WINDOW_CLOSED_ERROR = {
  code: 'CS_WINDOW_CLOSED',
  message: 'The 24h customer-service window has closed. Start a new template conversation to re-engage.',
} as const;

const NO_SUGGESTION_ERROR = {
  code: 'NO_SUGGESTION',
  message: 'No AI suggestion to approve — compose a reply.',
} as const;

/** A PENDING draft loaded with the contact phone we need to send to. */
type DraftWithContact = BotDraft & {
  conversation: { id: string; contact: { phoneE164: string } };
};

/**
 * Operator-facing actions over the bot's escalation drafts. When the bot escalates it leaves a
 * PENDING {@link BotDraft}; an operator then approves (send as-is), edits (send a revised body) or
 * rejects (discard, reply manually). Approving/editing performs the real WhatsApp send and records
 * an OPERATOR_REPLY outbound atomically with the state change; rejecting never touches WhatsApp.
 */
@Injectable()
export class DraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: ChatbotWhatsappService,
    private readonly conversations: ConversationService,
  ) {}

  async list(filter: ListDraftsDto): Promise<{
    items: BotDraft[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? 20, MAX_LIMIT);
    const state = filter.state ?? 'PENDING';
    const where: Prisma.BotDraftWhereInput = {
      state,
      ...(filter.conversationId ? { conversationId: filter.conversationId } : {}),
      // The default PENDING queue is the operator's action list: only show drafts whose conversation
      // is still ESCALATED and unowned. Once a human takes over (assigned, or REPLIED/AWAITING_REPLY),
      // the draft is stale and must drop out so the operator isn't prompted to send over themselves.
      ...(state === 'PENDING' ? { conversation: { is: { state: 'ESCALATED', assignedToId: null } } } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.botDraft.findMany({
        where,
        include: {
          conversation: { include: { contact: { select: { id: true, name: true, phoneE164: true } } } },
          citations: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.botDraft.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async approve(
    draftId: string,
    userId: string,
  ): Promise<{ draft: BotDraft; outbound: ConversationOutboundMessage }> {
    return this.send(draftId, userId, { kind: 'APPROVE' });
  }

  async edit(
    draftId: string,
    userId: string,
    editedBody: string,
  ): Promise<{ draft: BotDraft; outbound: ConversationOutboundMessage }> {
    return this.send(draftId, userId, { kind: 'EDIT', editedBody });
  }

  /**
   * Shared approve/edit path: load + guard, perform the (failure-isolated) WhatsApp send, then in a
   * single transaction flip the draft, write the operator-reply outbound, and advance the conversation.
   */
  private async send(
    draftId: string,
    userId: string,
    action: { kind: 'APPROVE' } | { kind: 'EDIT'; editedBody: string },
  ): Promise<{ draft: BotDraft; outbound: ConversationOutboundMessage }> {
    const draft = await this.loadPending(draftId);
    // Approve sends the AI suggestion — NOT draft.body, which for safety/consent escalations is the
    // customer's own question kept as operator context (echoing it back would reply with their words).
    // Edit always uses the operator-supplied body, so it needs no suggestion.
    let body: string;
    if (action.kind === 'EDIT') {
      body = action.editedBody;
    } else {
      if (draft.suggestedReply == null) throw new ConflictException(NO_SUGGESTION_ERROR);
      body = draft.suggestedReply;
    }

    // Sending into a lapsed 24h CS window fails at Meta with an opaque 502 — reject it up front so
    // the operator gets an actionable error instead and the draft stays PENDING for later re-engagement.
    if (!(await this.conversations.getCsWindowOpen(draft.conversation.id)))
      throw new ConflictException(CS_WINDOW_CLOSED_ERROR);

    let metaMessageId: string;
    try {
      ({ metaMessageId } = await this.whatsapp.sendTextMessage(draft.conversation.contact.phoneE164, body));
    } catch (err) {
      if (err instanceof ChatbotWhatsappError) {
        throw new BadGatewayException(`Failed to send WhatsApp message: ${err.message}`);
      }
      throw err;
    }

    const draftData: Prisma.BotDraftUpdateInput =
      action.kind === 'EDIT'
        ? { state: 'EDITED', editedBody: action.editedBody, approvedByUserId: userId }
        : { state: 'SENT', approvedByUserId: userId };

    const sentAt = new Date();
    const [updated, outbound] = await this.prisma.$transaction([
      this.prisma.botDraft.update({ where: { id: draftId }, data: draftData }),
      this.prisma.conversationOutboundMessage.create({
        data: {
          conversationId: draft.conversation.id,
          body,
          kind: 'OPERATOR_REPLY',
          sentByUserId: userId,
          botDraftId: draftId,
          metaMessageId,
          sentAt,
        },
      }),
      this.prisma.conversation.update({
        where: { id: draft.conversation.id },
        data: { state: 'REPLIED', lastOutboundAt: sentAt },
      }),
    ]);

    return { draft: updated, outbound };
  }

  async reject(draftId: string, userId: string, reason?: string): Promise<{ draft: BotDraft }> {
    const draft = await this.loadPending(draftId);

    const [updated] = await this.prisma.$transaction([
      this.prisma.botDraft.update({
        where: { id: draftId },
        data: { state: 'REJECTED', rejectionReason: reason ?? null },
      }),
      // No pending draft remains; the operator will reply manually, so the conversation awaits them.
      this.prisma.conversation.update({
        where: { id: draft.conversation.id },
        data: { state: 'AWAITING_REPLY' },
      }),
    ]);

    return { draft: updated };
  }

  /** Load a draft (with its contact) and guard that it is still actionable. */
  private async loadPending(draftId: string): Promise<DraftWithContact> {
    const draft = await this.prisma.botDraft.findUnique({
      where: { id: draftId },
      include: { conversation: { include: { contact: { select: { phoneE164: true } } } } },
    });
    if (!draft) throw new NotFoundException(`Draft ${draftId} not found`);
    if (draft.state !== 'PENDING') throw new ConflictException(INVALID_DRAFT_STATE);
    return draft as DraftWithContact;
  }
}
