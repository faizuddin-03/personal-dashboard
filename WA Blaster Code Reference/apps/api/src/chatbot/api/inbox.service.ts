import { BadGatewayException, Injectable, NotFoundException } from '@nestjs/common';
import { Conversation, ConversationOutboundMessage, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CloseConversationDto, ListConversationsDto, UpdateConversationDto } from '../dto/conversations.dto';
import { ConversationService } from '../conversations/conversation.service';
import { ChatbotWhatsappError } from '../whatsapp/chatbot-whatsapp.error';
import { ChatbotWhatsappService } from '../whatsapp/chatbot-whatsapp.service';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

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
    if (filter.state !== undefined) where.state = filter.state;
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

    return { items, total, page, limit };
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
    return conversation;
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
