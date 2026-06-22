import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { BadGatewayException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InboxService } from '../inbox.service';
import { ConversationService } from '../../chatbot/conversations/conversation.service';
import { ChatbotWhatsappService } from '../../chatbot/whatsapp/chatbot-whatsapp.service';
import { ChatbotWhatsappError } from '../../chatbot/whatsapp/chatbot-whatsapp.error';
import { ChatbotInboxBridge } from '../../chatbot/bridge/chatbot-inbox-bridge.service';
import { Queue } from 'bullmq';

// ---------------------------------------------------------------------------
// Real-DB setup (used only by the sendReply integration describe block)
// ---------------------------------------------------------------------------
const prismaReal = new PrismaClient() as unknown as PrismaService;
const queue = { add: jest.fn().mockResolvedValue(undefined) };
const conversations = new ConversationService(prismaReal, queue as unknown as Queue);
const chatbotWa = { sendTextMessage: jest.fn().mockResolvedValue({ metaMessageId: 'wamid.mock' }) };
const bridge = new ChatbotInboxBridge(prismaReal);
const svcReal = new InboxService(prismaReal, conversations, chatbotWa as never, bridge);

const createdContactIds = new Set<string>();

async function makeContact(): Promise<string> {
  const id = randomUUID();
  const digits = id.replace(/\D/g, '').slice(0, 9).padEnd(9, '0');
  await prismaReal.$executeRawUnsafe(
    `INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid, $2, NOW())`,
    id,
    `+19${digits}`,
  );
  createdContactIds.add(id);
  return id;
}

beforeAll(async () => {
  await prismaReal.$connect();
});

afterAll(async () => {
  for (const id of createdContactIds) {
    await prismaReal.$executeRawUnsafe(
      `DELETE FROM conversation_outbound_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE contact_id = $1::uuid)`,
      id,
    );
    await prismaReal.$executeRawUnsafe(
      `DELETE FROM conversation_inbound_messages WHERE conversation_id IN (SELECT id FROM conversations WHERE contact_id = $1::uuid)`,
      id,
    );
    await prismaReal.$executeRawUnsafe(`DELETE FROM messages WHERE contact_id = $1::uuid`, id);
    await prismaReal.$executeRawUnsafe(`DELETE FROM conversations WHERE contact_id = $1::uuid`, id);
    await prismaReal.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  }
  await prismaReal.$disconnect();
});

// ---------------------------------------------------------------------------
// Mock-DB helpers (used by all other describe blocks)
// ---------------------------------------------------------------------------
function makeInboxService(prisma: any): InboxService {
  return new InboxService(prisma, {} as any, {} as any, {} as any);
}

// ---------------------------------------------------------------------------

describe('InboxService.handleInbound', () => {
  let prisma: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = {
      inboxConversationState: { upsert: jest.fn() },
    };
    service = makeInboxService(prisma);
  });

  it('upserts state with lastInboundAt and clears resolvedAt', async () => {
    const receivedAt = new Date('2026-05-28T08:00:00Z');
    await service.handleInbound(contactId, receivedAt);

    expect(prisma.inboxConversationState.upsert).toHaveBeenCalledWith({
      where: { contactId },
      create: { contactId, lastInboundAt: receivedAt, resolvedAt: null },
      update: { lastInboundAt: receivedAt, resolvedAt: null },
    });
  });
});

describe('InboxService.listConversations', () => {
  let prisma: any;
  let service: InboxService;

  beforeEach(() => {
    prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    };
    service = makeInboxService(prisma);
  });

  it('tab=all filters resolvedAt IS NULL', async () => {
    await service.listConversations({ tab: 'all', limit: 50 });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('s.resolved_at IS NULL');
    expect(sql).not.toContain('resolved_at IS NOT NULL');
  });

  it('tab=awaiting filters last_inbound > last_outbound', async () => {
    await service.listConversations({ tab: 'awaiting', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('resolved_at IS NULL');
    expect(sql).toMatch(/last_outbound_at IS NULL OR .*last_inbound_at > .*last_outbound_at/);
  });

  it('tab=replied filters last_outbound > last_inbound', async () => {
    await service.listConversations({ tab: 'replied', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('resolved_at IS NULL');
    expect(sql).toMatch(/last_outbound_at > .*last_inbound_at/);
  });

  it('tab=resolved filters resolvedAt IS NOT NULL', async () => {
    await service.listConversations({ tab: 'resolved', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('resolved_at IS NOT NULL');
  });

  it('uses phone_e164 column for contact phone', async () => {
    await service.listConversations({ tab: 'all', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('phone_e164');
  });

  it('caps limit at 100', async () => {
    await service.listConversations({ tab: 'all', limit: 9999 });
    const params = prisma.$queryRawUnsafe.mock.calls[0].slice(1);
    expect(params.some((p: any) => p === 100)).toBe(true);
  });

  it('applies search clause using name and phone_e164 when search provided', async () => {
    await service.listConversations({ tab: 'all', limit: 50, search: 'Aisyah' });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toMatch(/c\.name ILIKE \$2 OR c\.phone_e164 ILIKE \$2/);
    const params = prisma.$queryRawUnsafe.mock.calls[0].slice(1);
    expect(params).toContain('%Aisyah%');
  });

  it('maps result rows to API shape with windowOpen computed', async () => {
    const recentInbound = new Date(Date.now() - 60 * 60 * 1000); // 1h ago -> open
    prisma.$queryRawUnsafe.mockResolvedValue([
      {
        contact_id: 'c1',
        contact_name: 'Aisyah',
        contact_phone: '+60123',
        last_inbound_at: recentInbound,
        last_outbound_at: null,
        resolved_at: null,
        last_preview: 'hi',
        last_direction: 'inbound',
        attribution: null,
      },
    ]);
    const result = await service.listConversations({ tab: 'all', limit: 50 });
    expect(result.items[0].contact.phone).toBe('+60123');
    expect(result.items[0].windowOpen).toBe(true);
    expect(result.items[0].windowExpiresAt).toBeInstanceOf(Date);
  });
});

describe('InboxService.getConversation', () => {
  let prisma: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = {
      inboxConversationState: { findUnique: jest.fn() },
      contact: { findUnique: jest.fn() },
      inboundMessage: { findMany: jest.fn().mockResolvedValue([]) },
      message: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = makeInboxService(prisma);
  });

  it('throws 404 when no inbox state exists', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue(null);
    await expect(service.getConversation(contactId)).rejects.toThrow(/not found/i);
  });

  it('interleaves inbound + outbound messages by timestamp ASC', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: new Date('2026-05-28T08:00:00Z'),
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      name: 'Aisyah',
      phoneE164: '+60123',
    });
    prisma.inboundMessage.findMany.mockResolvedValue([
      { id: 'in1', body: 'hi', receivedAt: new Date('2026-05-28T08:00:00Z') },
      { id: 'in2', body: 'still there?', receivedAt: new Date('2026-05-28T09:00:00Z') },
    ]);
    prisma.message.findMany.mockResolvedValue([
      {
        id: 'out1',
        body: 'hello',
        sentAt: new Date('2026-05-28T08:30:00Z'),
        status: 'DELIVERED',
        source: 'INBOX',
        blastId: null,
        blast: null,
        errorMessage: null,
      },
    ]);

    const result = await service.getConversation(contactId);
    expect(result.messages.map((m: any) => m.id)).toEqual(['in1', 'out1', 'in2']);
  });

  it('computes windowExpiresAt = lastInboundAt + 24h', async () => {
    const lastInbound = new Date('2026-05-28T08:00:00Z');
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: lastInbound,
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      name: 'X',
      phoneE164: '+60',
    });

    const result = await service.getConversation(contactId);
    expect(result.windowExpiresAt).toEqual(new Date(lastInbound.getTime() + 24 * 60 * 60 * 1000));
  });

  it('returns contact phone from phoneE164 field as phone key', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: null,
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      name: 'Z',
      phoneE164: '+60999',
    });
    const result = await service.getConversation(contactId);
    expect(result.contact.phone).toBe('+60999');
  });
});

describe('InboxService.sendReply', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    chatbotWa.sendTextMessage.mockResolvedValue({ metaMessageId: 'wamid.mock' });
  });

  it('sends via the chatbot client, records an OPERATOR_REPLY, mirrors a Message, and moves the conversation to REPLIED', async () => {
    const contactId = await makeContact();
    const { conversation } = await conversations.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'hi' });
    const userId = randomUUID();
    const res = await svcReal.sendReply(contactId, 'Here is your answer', userId);
    expect(chatbotWa.sendTextMessage).toHaveBeenCalled();
    const conv = await prismaReal.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(conv.state).toBe('REPLIED');
    const out = await prismaReal.conversationOutboundMessage.findFirst({ where: { conversationId: conversation.id, kind: 'OPERATOR_REPLY' } });
    expect(out).not.toBeNull();
    const mirrored = await prismaReal.message.findFirst({ where: { contactId, source: 'INBOX', body: 'Here is your answer' } });
    expect(mirrored).not.toBeNull();
    expect(res.message.body).toBe('Here is your answer');
    // inbox_conversation_state projection must be synced (the /inbox thread + list and e2e contract read these)
    const prisma = prismaReal as unknown as PrismaClient;
    const state = await prisma.inboxConversationState.findUnique({ where: { contactId } });
    expect(state).not.toBeNull();
    expect(state!.lastOutboundAt).not.toBeNull();
    expect(state!.resolvedAt).not.toBeNull();
  });

  it('throws window_closed when the CS window has lapsed', async () => {
    const contactId = await makeContact();
    const { conversation } = await conversations.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'hi' });
    await prismaReal.conversation.update({ where: { id: conversation.id }, data: { lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
    await expect(svcReal.sendReply(contactId, 'x', randomUUID())).rejects.toMatchObject({ response: { error: 'window_closed' } });
    expect(chatbotWa.sendTextMessage).not.toHaveBeenCalled();
  });

  it('throws when the contact has no open conversation', async () => {
    const contactId = await makeContact();
    await expect(svcReal.sendReply(contactId, 'x', randomUUID())).rejects.toMatchObject({ response: { error: 'no_active_conversation' } });
  });

  it('maps a ChatbotWhatsappError to a BadGatewayException', async () => {
    const contactId = await makeContact();
    await conversations.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'hi' });
    (chatbotWa.sendTextMessage as jest.Mock).mockRejectedValueOnce(new ChatbotWhatsappError('meta down'));
    await expect(svcReal.sendReply(contactId, 'x', randomUUID())).rejects.toBeInstanceOf(BadGatewayException);
  });
});

describe('InboxService.markResolved / reopen / unreadCount', () => {
  let prisma: any;
  let service: InboxService;

  beforeEach(() => {
    prisma = {
      inboxConversationState: { update: jest.fn(), count: jest.fn() },
    };
    service = makeInboxService(prisma);
  });

  it('markResolved sets resolvedAt to now', async () => {
    prisma.inboxConversationState.update.mockResolvedValue({
      contactId: 'c1',
      resolvedAt: new Date(),
    });
    await service.markResolved('c1');
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith({
      where: { contactId: 'c1' },
      data: { resolvedAt: expect.any(Date) },
    });
  });

  it('reopen clears resolvedAt', async () => {
    prisma.inboxConversationState.update.mockResolvedValue({
      contactId: 'c1',
      resolvedAt: null,
    });
    await service.reopen('c1');
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith({
      where: { contactId: 'c1' },
      data: { resolvedAt: null },
    });
  });

  it('unreadCount returns count of resolvedAt IS NULL rows', async () => {
    prisma.inboxConversationState.count.mockResolvedValue(7);
    const n = await service.unreadCount();
    expect(prisma.inboxConversationState.count).toHaveBeenCalledWith({
      where: { resolvedAt: null },
    });
    expect(n).toBe(7);
  });
});
