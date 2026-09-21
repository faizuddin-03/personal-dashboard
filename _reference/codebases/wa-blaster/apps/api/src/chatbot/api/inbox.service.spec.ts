import { randomUUID } from 'crypto';
import { BadGatewayException, ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationState, PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from '../conversations/conversation.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChunkerService } from '../knowledge/chunker.service';
import { RetrievalService } from '../knowledge/retrieval.service';
import { IngestionService } from '../knowledge/ingestion.service';
import { TitleGeneratorService } from '../knowledge/title-generator.service';
import { ResolutionCaptureService } from '../knowledge/resolution-capture.service';
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

// Real knowledge pipeline for the close → KB ingestion loop test. Embeddings run in mock mode
// (deterministic, network-free) so the loop is provable without the bge-m3 tunnel — mirrors
// resolution-capture.service.spec. The worker is out of process in tests, so the test invokes
// ResolutionCaptureService.capture() directly after closing the conversation.
const captureConfig = {
  get: (k: string, fb?: unknown) =>
    (({ CHATBOT_CAPTURE_DEDUP_THRESHOLD: 0.85, EMBEDDINGS_MOCK_MODE: 'true' } as Record<string, unknown>)[k] ?? fb),
} as unknown as ConfigService;
const embeddings = new EmbeddingsService(captureConfig);
const chunker = new ChunkerService(captureConfig);
const ingestion = new IngestionService(prisma, chunker, embeddings);
const titleGen = { generate: jest.fn().mockResolvedValue('Resolved: same-day delivery in KL') } as unknown as TitleGeneratorService;
const captureService = new ResolutionCaptureService(
  prisma,
  embeddings,
  chunker,
  new RetrievalService(prisma, embeddings, captureConfig),
  ingestion,
  titleGen,
  captureConfig,
);

const contactIds = new Set<string>();
const docIds = new Set<string>();

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

/** Seed a conversation, then force it into a target state (and optionally assign an operator). */
async function seedInState(
  state: ConversationState,
  opts: { name?: string; assignedToId?: string | null } = {},
): Promise<string> {
  const { conversation } = await seedConversation(opts.name);
  await prisma.conversation.update({
    where: { id: conversation.id },
    data: { state, assignedToId: opts.assignedToId ?? null },
  });
  return conversation.id;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // Contacts first: cascades conversations → messages → resolution_captures (clearing the FK that
  // references a captured doc). Then delete the orphaned captured KnowledgeDocuments by id.
  for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  for (const id of docIds) await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
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

  it('annotates each listed row with a computed csWindowOpen flag', async () => {
    const { conversation, contact } = await seedConversation();

    const res = await svc.listConversations({ search: contact.phone });

    const found = res.items.find((c) => c.id === conversation.id);
    expect(found?.csWindowOpen).toBe(true);
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

  it('exposes suggestedReply on bot drafts (set by the send-failure-fallback escalation)', async () => {
    const { conversation, inboundMessage } = await seedConversation();
    await conversations.recordEscalation({
      conversationId: conversation.id,
      inboundMessageId: inboundMessage.id,
      draftData: {
        body: 'When does my order ship?', // operator context = the customer's question
        intent: 'q',
        intentConfidence: 0.9,
        draftConfidence: 0.9,
        modelUsed: 'mock',
        embeddingModelUsed: 'mock',
        latencyMs: 5,
      },
      citations: [],
      suggestedReply: 'Your order ships within 3 business days.',
    });

    const full = await svc.getConversation(conversation.id);

    expect(full.botDrafts).toHaveLength(1);
    expect(full.botDrafts[0].body).toBe('When does my order ship?');
    expect(full.botDrafts[0].suggestedReply).toBe('Your order ships within 3 business days.');
  });

  it('leaves suggestedReply null for a safety escalation (body keeps the customer question)', async () => {
    const { conversation, inboundMessage } = await seedConversation(undefined, 'This is terrible, I am furious');
    await conversations.recordEscalation({
      conversationId: conversation.id,
      inboundMessageId: inboundMessage.id,
      draftData: {
        body: 'This is terrible, I am furious',
        intent: 'complaint',
        intentConfidence: 0.95,
        draftConfidence: 0,
        modelUsed: 'mock',
        embeddingModelUsed: 'mock',
        latencyMs: 5,
      },
      citations: [],
      // no suggestedReply — safety escalation
    });

    const full = await svc.getConversation(conversation.id);

    expect(full.botDrafts).toHaveLength(1);
    expect(full.botDrafts[0].suggestedReply).toBeNull();
  });

  it('computes csWindowOpen=true for a fresh conversation and keeps csWindowExpiresAt', async () => {
    const { conversation } = await seedConversation();

    const full = await svc.getConversation(conversation.id);

    expect(full.csWindowOpen).toBe(true);
    expect(full.csWindowExpiresAt).not.toBeNull();
  });

  it('computes csWindowOpen=false once the window has lapsed (~25h in the past)', async () => {
    const { conversation } = await seedConversation();
    const lastInboundAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastInboundAt, csWindowExpiresAt: new Date(lastInboundAt.getTime() + 24 * 60 * 60 * 1000) },
    });

    const full = await svc.getConversation(conversation.id);

    expect(full.csWindowOpen).toBe(false);
    expect(full.csWindowExpiresAt).not.toBeNull();
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

  it('throws ConflictException(CS_WINDOW_CLOSED) and does not send when the CS window has closed', async () => {
    const { conversation } = await seedConversation();
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000) },
    });

    await expect(svc.manualReply(conversation.id, 'hello', randomUUID())).rejects.toBeInstanceOf(ConflictException);
    await expect(svc.manualReply(conversation.id, 'hello', randomUUID())).rejects.toMatchObject({
      response: { code: 'CS_WINDOW_CLOSED' },
    });
    expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
  });
});

describe('InboxService.takeOver', () => {
  it('assigns the conversation to the operator and clears the escalation-offer fields', async () => {
    const { conversation, inboundMessage } = await seedConversation();
    // Put it into an offered state so we can prove the offer fields are cleared on take-over.
    await conversations.recordEscalationOffer(conversation.id, inboundMessage.id);
    const userId = randomUUID();

    const updated = await svc.takeOver(conversation.id, userId);

    expect(updated.assignedToId).toBe(userId);
    expect(updated.escalationOfferedAt).toBeNull();
    expect(updated.escalationOfferInboundId).toBeNull();

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
    expect(after.assignedToId).toBe(userId);
    expect(after.escalationOfferedAt).toBeNull();
    expect(after.escalationOfferInboundId).toBeNull();
  });

  it('throws NotFoundException for an unknown conversation', async () => {
    await expect(svc.takeOver(randomUUID(), randomUUID())).rejects.toBeInstanceOf(NotFoundException);
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

describe('InboxService.listConversations tabs', () => {
  it('?tab=escalated returns only ESCALATED (excludes AWAITING_REPLY)', async () => {
    const token = `tab-esc-${randomUUID().slice(0, 8)}`;
    const esc = await seedInState('ESCALATED', { name: token });
    const awaiting = await seedInState('AWAITING_REPLY', { name: token });

    const res = await svc.listConversations({ tab: 'escalated', search: token });

    expect(res.items.map((c) => c.id)).toEqual([esc]);
    expect(res.items.every((c) => c.state === 'ESCALATED')).toBe(true);
    expect(res.items.some((c) => c.id === awaiting)).toBe(false);
  });

  it('?tab=awaiting_reply returns ESCALATED and AWAITING_REPLY (excludes REPLIED)', async () => {
    const token = `tab-await-${randomUUID().slice(0, 8)}`;
    const esc = await seedInState('ESCALATED', { name: token });
    const awaiting = await seedInState('AWAITING_REPLY', { name: token });
    const replied = await seedInState('REPLIED', { name: token });

    const res = await svc.listConversations({ tab: 'awaiting_reply', search: token });

    const ids = res.items.map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining([esc, awaiting]));
    expect(ids).not.toContain(replied);
    expect(res.items.every((c) => ['ESCALATED', 'AWAITING_REPLY'].includes(c.state))).toBe(true);
  });

  it('?tab=all applies no state filter (returns NEW/ESCALATED/RESOLVED alike)', async () => {
    const token = `tab-all-${randomUUID().slice(0, 8)}`;
    const escalated = await seedInState('ESCALATED', { name: token });
    const fresh = await seedInState('NEW', { name: token });
    const resolved = await seedInState('RESOLVED', { name: token });

    const res = await svc.listConversations({ tab: 'all', search: token });

    expect(res.items.map((c) => c.id)).toEqual(expect.arrayContaining([escalated, fresh, resolved]));
  });
});

describe('InboxService close → knowledge-base ingestion loop', () => {
  it('IMPORT_LIVE close + capture() produces a LIVE "Resolved tickets" doc with chunks, linked to the conversation', async () => {
    // Unique question avoids a dedup hit against any pre-existing LIVE doc.
    const question = `Do you offer same-day delivery in KL ${randomUUID()}?`;
    const { conversation } = await seedConversation(undefined, question);
    const userId = randomUUID();
    await conversations.recordOperatorReply(conversation.id, 'Yes — order before 12pm for same-day delivery in KL.', userId);

    // Close with IMPORT_LIVE: creates the pending ResolutionCapture row and enqueues the job (queue mocked).
    const closeRes = await svc.closeConversation(conversation.id, userId, { disposition: 'IMPORT_LIVE' });
    expect(closeRes.conversation.state).toBe('RESOLVED');
    expect(queue.add).toHaveBeenCalledTimes(1);

    // The worker is out of process in tests — run the capture step the worker would have run.
    const row = await captureService.capture({ conversationId: conversation.id, closedByUserId: userId, disposition: 'IMPORT_LIVE' });
    expect(row.status).toBe('captured_live');
    expect(row.documentId).not.toBeNull();
    docIds.add(row.documentId!);

    const doc = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: row.documentId! } });
    expect(doc.status).toBe('LIVE');
    expect(doc.category).toBe('Resolved tickets');
    expect(doc.capturedFromConversationId).toBe(conversation.id);

    const chunkCount = await prisma.knowledgeChunk.count({ where: { documentId: doc.id } });
    expect(chunkCount).toBeGreaterThanOrEqual(1);
  });
});

describe('InboxService.summary', () => {
  it('folds each seeded conversation into its tab bucket', async () => {
    // summary() is a global aggregate over a shared DB; sibling suites add/remove rows concurrently,
    // so brittle absolute totals (or before/after deltas) race. Our own contacts are never touched by
    // other specs and concurrent rows only ever ADD to a bucket, so asserting each bucket reflects AT
    // LEAST our fixtures is exact for the routing we care about and immune to that concurrency.
    await seedInState('AUTO_REPLIED');
    await seedInState('ESCALATED', { assignedToId: null });
    await seedInState('ESCALATED', { assignedToId: randomUUID() });
    await seedInState('AWAITING_REPLY', { assignedToId: null });
    await seedInState('REPLIED');
    await seedInState('RESOLVED');

    const s = await svc.summary();

    expect(s.auto_replied).toBeGreaterThanOrEqual(1); // AUTO_REPLIED → auto_replied
    expect(s.escalated).toBeGreaterThanOrEqual(2); // 2 × ESCALATED → escalated
    expect(s.awaiting_reply).toBeGreaterThanOrEqual(3); // 2 × ESCALATED + 1 × AWAITING_REPLY
    expect(s.in_progress).toBeGreaterThanOrEqual(1); // REPLIED → in_progress
    expect(s.resolved).toBeGreaterThanOrEqual(1); // RESOLVED → resolved
    expect(s.unassigned).toBeGreaterThanOrEqual(2); // 2 unassigned rows in the awaiting set (assigned one excluded)
    expect(s.all).toBeGreaterThanOrEqual(6);

    // Single-snapshot invariants — true of any summary() regardless of concurrent rows.
    expect(s.awaiting_reply).toBeGreaterThanOrEqual(s.escalated); // awaiting set ⊇ escalated set
    expect(s.all).toBeGreaterThanOrEqual(s.auto_replied + s.in_progress + s.resolved); // disjoint subsets
  });
});
