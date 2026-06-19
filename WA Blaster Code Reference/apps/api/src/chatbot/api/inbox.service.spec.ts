import { randomUUID } from 'crypto';
import { BadGatewayException, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from '../conversations/conversation.service';
import { ChatbotWhatsappError } from '../whatsapp/chatbot-whatsapp.error';
import { InboxService } from './inbox.service';

/**
 * Integration tests: InboxService is straight Prisma over Postgres plus delegation to the real
 * ConversationService, so we exercise the real queries/state machine against the live DB. The only
 * mocked collaborators are the BullMQ queue (capture worker is out of scope) and the WhatsApp
 * client (no live Meta calls). Every assertion is scoped to entities this spec creates.
 */
const prisma = new PrismaClient() as unknown as PrismaService;
const queue = { add: jest.fn().mockResolvedValue(undefined) };
const conversations = new ConversationService(prisma, queue as unknown as Queue);
const whatsapp = { sendTextMessage: jest.fn().mockResolvedValue({ metaMessageId: 'wamid.mock' }) };
const svc = new InboxService(prisma, conversations, whatsapp as never);

const contactIds = new Set<string>();

function uniquePhone(): string {
  const digits = randomUUID().replace(/[^0-9]/g, '') + '0000000000';
  return `+1${digits.slice(0, 10)}`;
}

async function makeContact(name?: string): Promise<{ id: string; phone: string }> {
  const id = randomUUID();
  const phone = uniquePhone();
  await prisma.$executeRawUnsafe(
    `INSERT INTO contacts (id, phone_e164, name, updated_at) VALUES ($1::uuid, $2, $3, NOW())`,
    id,
    phone,
    name ?? null,
  );
  contactIds.add(id);
  return { id, phone };
}

async function seedConversation(name?: string, body = 'hello there') {
  const contact = await makeContact(name);
  const { conversation, inboundMessage } = await conversations.handleInbound({
    contactId: contact.id,
    metaMessageId: `wamid-${randomUUID()}`,
    body,
  });
  return { contact, conversation, inboundMessage };
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  await prisma.$disconnect();
});

afterEach(() => {
  queue.add.mockClear();
  whatsapp.sendTextMessage.mockClear();
});

describe('InboxService.listConversations', () => {
  it('returns the seeded conversation with its contact and pagination envelope', async () => {
    const { conversation, contact } = await seedConversation('Alice Seed');

    const res = await svc.listConversations({});

    expect(res.page).toBe(1);
    expect(res.limit).toBe(20);
    expect(res.total).toBeGreaterThanOrEqual(1);
    const found = res.items.find((c) => c.id === conversation.id);
    expect(found).toBeDefined();
    expect(found?.contact).toMatchObject({ id: contact.id, name: 'Alice Seed', phoneE164: contact.phone });
  });

  it('filters by state', async () => {
    const { conversation } = await seedConversation();
    await conversations.recordOperatorReply(conversation.id, 'handled', randomUUID()); // → REPLIED

    const res = await svc.listConversations({ state: 'REPLIED' });
    expect(res.items.every((c) => c.state === 'REPLIED')).toBe(true);
    expect(res.items.some((c) => c.id === conversation.id)).toBe(true);
  });

  it('filters by assignedToId', async () => {
    const { conversation } = await seedConversation();
    const operator = randomUUID();
    await prisma.conversation.update({ where: { id: conversation.id }, data: { assignedToId: operator } });

    const res = await svc.listConversations({ assignedToId: operator });
    expect(res.items).toHaveLength(1);
    expect(res.items[0].id).toBe(conversation.id);
  });

  it('filters by pinned', async () => {
    const { conversation } = await seedConversation();
    await prisma.conversation.update({ where: { id: conversation.id }, data: { pinned: true } });

    const res = await svc.listConversations({ pinned: true });
    expect(res.items.every((c) => c.pinned === true)).toBe(true);
    expect(res.items.some((c) => c.id === conversation.id)).toBe(true);
  });

  it('search matches the contact name (case-insensitive)', async () => {
    const token = randomUUID().slice(0, 8);
    const { conversation } = await seedConversation(`Zephyr ${token}`);

    const res = await svc.listConversations({ search: token.toUpperCase() });
    expect(res.items.map((c) => c.id)).toContain(conversation.id);
  });

  it('search matches the contact phone', async () => {
    const { conversation, contact } = await seedConversation();

    const res = await svc.listConversations({ search: contact.phone });
    expect(res.items.map((c) => c.id)).toContain(conversation.id);
  });

  it('search matches an inbound message body', async () => {
    const token = randomUUID().slice(0, 8);
    const { conversation } = await seedConversation(undefined, `please tell me about ${token}`);

    const res = await svc.listConversations({ search: token });
    expect(res.items.map((c) => c.id)).toContain(conversation.id);
  });

  it('clamps limit to <= 100', async () => {
    const res = await svc.listConversations({ limit: 500 });
    expect(res.limit).toBe(100);
  });

  it('honours page/limit', async () => {
    const res = await svc.listConversations({ page: 2, limit: 5 });
    expect(res.page).toBe(2);
    expect(res.limit).toBe(5);
    expect(res.items.length).toBeLessThanOrEqual(5);
  });
});

describe('InboxService.getConversation', () => {
  it('includes contact, ordered messages, and bot drafts', async () => {
    const { conversation } = await seedConversation('Bob Detail', 'first inbound');
    await conversations.recordAutoReply({ conversationId: conversation.id, body: 'auto answer', subKind: 'rag_answer' });
    await conversations.recordOperatorReply(conversation.id, 'operator answer', randomUUID());

    const full = await svc.getConversation(conversation.id);

    expect(full.id).toBe(conversation.id);
    expect(full.contact.name).toBe('Bob Detail');
    expect(full.inboundMessages).toHaveLength(1);
    expect(full.inboundMessages[0].body).toBe('first inbound');
    expect(full.outboundMessages).toHaveLength(2);
    expect(full.outboundMessages.map((m) => m.body)).toEqual(['auto answer', 'operator answer']);
    expect(Array.isArray(full.botDrafts)).toBe(true);
  });

  it('throws NotFoundException for an unknown id', async () => {
    await expect(svc.getConversation(randomUUID())).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('InboxService.updateConversation', () => {
  it('sets pinned and tags', async () => {
    const { conversation } = await seedConversation();

    const updated = await svc.updateConversation(conversation.id, { pinned: true, tags: ['vip', 'urgent'] });

    expect(updated.pinned).toBe(true);
    expect(updated.tags).toEqual(['vip', 'urgent']);
  });

  it('assigns and unassigns an operator', async () => {
    const { conversation } = await seedConversation();
    const operator = randomUUID();

    const assigned = await svc.updateConversation(conversation.id, { assignedToId: operator });
    expect(assigned.assignedToId).toBe(operator);

    const unassigned = await svc.updateConversation(conversation.id, { assignedToId: null });
    expect(unassigned.assignedToId).toBeNull();
  });

  it('throws NotFoundException for an unknown id', async () => {
    await expect(svc.updateConversation(randomUUID(), { pinned: true })).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('InboxService.manualReply', () => {
  it('sends via WhatsApp and records an OPERATOR_REPLY, moving state to REPLIED', async () => {
    const { conversation, contact } = await seedConversation();
    const userId = randomUUID();

    const res = await svc.manualReply(conversation.id, 'Here is your answer', userId);

    expect(whatsapp.sendTextMessage).toHaveBeenCalledWith(contact.phone, 'Here is your answer');
    expect(res.conversationId).toBe(conversation.id);
    expect(res.outboundMessage.kind).toBe('OPERATOR_REPLY');
    expect(res.outboundMessage.sentByUserId).toBe(userId);
    expect(res.outboundMessage.metaMessageId).toBe('wamid.mock');

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.state).toBe('REPLIED');
  });

  it('throws NotFoundException for an unknown conversation', async () => {
    await expect(svc.manualReply(randomUUID(), 'hi', randomUUID())).rejects.toBeInstanceOf(NotFoundException);
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });

  it('rethrows a ChatbotWhatsappError as a BadGatewayException and records nothing', async () => {
    const { conversation } = await seedConversation();
    whatsapp.sendTextMessage.mockRejectedValueOnce(new ChatbotWhatsappError('meta is down'));

    await expect(svc.manualReply(conversation.id, 'hi', randomUUID())).rejects.toBeInstanceOf(BadGatewayException);

    const count = await prisma.conversationOutboundMessage.count({
      where: { conversationId: conversation.id, kind: 'OPERATOR_REPLY' },
    });
    expect(count).toBe(0);
  });
});

describe('InboxService.closeConversation', () => {
  it('delegates to ConversationService.close for a REPLIED conversation', async () => {
    const { conversation } = await seedConversation();
    await conversations.recordOperatorReply(conversation.id, 'sorted', randomUUID());
    const userId = randomUUID();

    const res = await svc.closeConversation(conversation.id, userId, {
      disposition: 'SAVE_DRAFT',
      resolutionNotes: 'done',
    });

    expect(res.conversation.state).toBe('RESOLVED');
    expect(res.captureId).toBeDefined();
    expect(queue.add).toHaveBeenCalledTimes(1);
  });

  it('lets a ConflictException propagate when closing a NEW conversation', async () => {
    const { conversation } = await seedConversation();

    await expect(
      svc.closeConversation(conversation.id, randomUUID(), { disposition: 'SKIP' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
