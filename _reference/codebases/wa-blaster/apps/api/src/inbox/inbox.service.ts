import { BadGatewayException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from '../chatbot/conversations/conversation.service';
import { ChatbotWhatsappService } from '../chatbot/whatsapp/chatbot-whatsapp.service';
import { ChatbotInboxBridge } from '../chatbot/bridge/chatbot-inbox-bridge.service';
import { ChatbotWhatsappError } from '../chatbot/whatsapp/chatbot-whatsapp.error';

const WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationService,
    private readonly whatsapp: ChatbotWhatsappService,
    private readonly bridge: ChatbotInboxBridge,
  ) {}

  async handleInbound(contactId: string, receivedAt: Date): Promise<void> {
    await this.prisma.inboxConversationState.upsert({
      where: { contactId },
      create: { contactId, lastInboundAt: receivedAt, resolvedAt: null },
      update: { lastInboundAt: receivedAt, resolvedAt: null },
    });
  }

  async listConversations(opts: {
    tab: 'all' | 'awaiting' | 'replied' | 'resolved';
    cursor?: string;
    limit: number;
    search?: string;
  }) {
    const limit = Math.min(opts.limit, 100);

    let whereClause: string;
    switch (opts.tab) {
      case 'awaiting':
        whereClause = `s.resolved_at IS NULL AND (s.last_outbound_at IS NULL OR s.last_inbound_at > s.last_outbound_at)`;
        break;
      case 'replied':
        whereClause = `s.resolved_at IS NULL AND s.last_outbound_at > s.last_inbound_at`;
        break;
      case 'resolved':
        whereClause = `s.resolved_at IS NOT NULL`;
        break;
      case 'all':
      default:
        whereClause = `s.resolved_at IS NULL`;
    }

    const searchClause = opts.search
      ? ` AND (c.name ILIKE $2 OR c.phone_e164 ILIKE $2)`
      : '';

    const sql = `
      SELECT
        s.contact_id,
        c.name AS contact_name,
        c.phone_e164 AS contact_phone,
        s.last_inbound_at,
        s.last_outbound_at,
        s.resolved_at,
        -- last message preview: most recent of inbound vs outbound
        (
          SELECT LEFT(body, 100) FROM (
            SELECT received_at AS at, body FROM inbound_messages WHERE contact_id = s.contact_id
            UNION ALL
            SELECT sent_at AS at, COALESCE(body, '') AS body FROM messages WHERE contact_id = s.contact_id AND sent_at IS NOT NULL
          ) merged ORDER BY at DESC LIMIT 1
        ) AS last_preview,
        (
          SELECT CASE WHEN inb.at > COALESCE(outb.at, '1970-01-01'::timestamp) THEN 'inbound' ELSE 'outbound' END
          FROM (SELECT MAX(received_at) AS at FROM inbound_messages WHERE contact_id = s.contact_id) inb,
               (SELECT MAX(sent_at) AS at FROM messages WHERE contact_id = s.contact_id) outb
        ) AS last_direction,
        -- attribution: most recent blast for an outbound message to this contact
        (
          SELECT json_build_object('blastId', b.id, 'blastName', b.name)
          FROM messages m JOIN blasts b ON b.id = m.blast_id
          WHERE m.contact_id = s.contact_id AND m.blast_id IS NOT NULL
          ORDER BY m.sent_at DESC LIMIT 1
        ) AS attribution
      FROM inbox_conversation_state s
      JOIN contacts c ON c.id = s.contact_id
      WHERE ${whereClause}${searchClause}
      ORDER BY GREATEST(COALESCE(s.last_inbound_at, '1970-01-01'::timestamp),
                        COALESCE(s.last_outbound_at, '1970-01-01'::timestamp)) DESC
      LIMIT $1
    `;

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      sql,
      limit,
      ...(opts.search ? [`%${opts.search}%`] : []),
    );

    return {
      items: rows.map((r) => {
        const windowExpiresAt = r.last_inbound_at
          ? new Date(new Date(r.last_inbound_at).getTime() + WINDOW_MS)
          : null;
        return {
          contact: { id: r.contact_id, name: r.contact_name, phone: r.contact_phone },
          lastInboundAt: r.last_inbound_at,
          lastOutboundAt: r.last_outbound_at,
          resolvedAt: r.resolved_at,
          lastPreview: r.last_preview ?? '',
          lastDirection: r.last_direction ?? 'inbound',
          windowExpiresAt,
          windowOpen: windowExpiresAt ? windowExpiresAt.getTime() > Date.now() : false,
          attribution: r.attribution ?? null,
        };
      }),
      nextCursor: null,
    };
  }

  async getConversation(contactId: string) {
    const state = await this.prisma.inboxConversationState.findUnique({ where: { contactId } });
    if (!state) throw new NotFoundException('Inbox conversation not found for this contact');

    const [contact, inbound, outbound] = await Promise.all([
      this.prisma.contact.findUnique({ where: { id: contactId } }),
      this.prisma.inboundMessage.findMany({
        where: { contactId },
        orderBy: { receivedAt: 'asc' },
      }),
      this.prisma.message.findMany({
        where: { contactId },
        orderBy: { sentAt: 'asc' },
        include: { blast: { select: { id: true, name: true } } },
      }),
    ]);

    const messages = [
      ...inbound.map((m: any) => ({
        id: m.id,
        direction: 'inbound' as const,
        body: m.body,
        timestamp: m.receivedAt,
      })),
      ...outbound
        .filter((m: any) => m.sentAt !== null)
        .map((m: any) => ({
          id: m.id,
          direction: 'outbound' as const,
          body: m.body,
          timestamp: m.sentAt,
          status: m.status,
          source: m.source,
          blastName: m.blast?.name,
          failureReason: m.errorMessage ?? undefined,
        })),
    ].sort(
      (a, b) => new Date(a.timestamp as any).getTime() - new Date(b.timestamp as any).getTime(),
    );

    const windowExpiresAt = state.lastInboundAt
      ? new Date(new Date(state.lastInboundAt).getTime() + WINDOW_MS)
      : null;

    return {
      contact: {
        id: contact!.id,
        name: contact!.name,
        phone: contact!.phoneE164,
      },
      messages,
      windowExpiresAt,
      windowOpen: windowExpiresAt ? windowExpiresAt.getTime() > Date.now() : false,
      resolvedAt: state.resolvedAt,
    };
  }

  async sendReply(contactId: string, body: string, userId: string) {
    // Requires the RAG chatbot to be enabled — an open chatbot Conversation must exist (no legacy blast-client fallback). See spec §8.
    const conversation = await this.prisma.conversation.findFirst({
      where: { contactId, closedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { contact: true },
    });
    if (!conversation) {
      throw new ConflictException({ error: 'no_active_conversation', message: 'No open conversation for this contact.' });
    }
    const windowOpen = conversation.lastInboundAt
      ? Date.now() - conversation.lastInboundAt.getTime() < WINDOW_MS
      : false;
    if (!windowOpen) {
      const windowExpiresAt = conversation.lastInboundAt
        ? new Date(conversation.lastInboundAt.getTime() + WINDOW_MS)
        : null;
      throw new ConflictException({
        error: 'window_closed',
        message: '24h customer-service window has expired. Use a template via Campaigns to re-engage.',
        windowExpiredAt: windowExpiresAt?.toISOString() ?? null,
      });
    }
    let metaMessageId: string;
    try {
      ({ metaMessageId } = await this.whatsapp.sendTextMessage(conversation.contact.phoneE164, body));
    } catch (err) {
      if (err instanceof ChatbotWhatsappError) throw new BadGatewayException(err.message);
      throw err;
    }
    const out = await this.conversations.recordOperatorReply(conversation.id, body, userId, metaMessageId);
    await this.bridge.mirrorOperatorReply({ contactId, body, metaMessageId });
    // Keep the legacy inbox_conversation_state projection in sync (the /inbox thread + list and the
    // e2e contract read lastOutboundAt/resolvedAt). Best-effort: the reply is already sent + recorded.
    const sentAt = out.sentAt ?? new Date();
    try {
      await this.prisma.inboxConversationState.upsert({
        where: { contactId },
        create: { contactId, lastOutboundAt: sentAt, resolvedAt: sentAt },
        update: { lastOutboundAt: sentAt, resolvedAt: sentAt },
      });
    } catch (err) {
      this.logger.warn(`inbox_conversation_state sync failed contactId=${contactId}: ${(err as Error).message}`);
    }
    return {
      message: {
        id: out.id,
        direction: 'outbound' as const,
        body,
        timestamp: out.sentAt ?? new Date(), // recordOperatorReply always sets sentAt; ?? new Date() is a defensive fallback for the nullable column
        status: 'SENT' as const,
        source: 'INBOX' as const,
      },
    };
  }

  async markResolved(contactId: string) {
    return this.prisma.inboxConversationState.update({
      where: { contactId },
      data: { resolvedAt: new Date() },
    });
  }

  async reopen(contactId: string) {
    return this.prisma.inboxConversationState.update({
      where: { contactId },
      data: { resolvedAt: null },
    });
  }

  async unreadCount(): Promise<number> {
    return this.prisma.inboxConversationState.count({ where: { resolvedAt: null } });
  }
}
