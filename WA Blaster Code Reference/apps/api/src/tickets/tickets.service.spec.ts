// Integration tests (live DB) for the chatbot-bridge reuse paths. Unit tests for the rest of TicketsService live in __tests__/tickets.service.spec.ts.
import { randomUUID } from 'crypto';
import { ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { LlmService } from '../llm/llm.service';
import { ConversationService } from '../chatbot/conversations/conversation.service';

const prisma = new PrismaClient() as unknown as PrismaService;
const knowledge = { retrieve: jest.fn().mockResolvedValue([]) } as unknown as KnowledgeService;
const llm = { generateReply: jest.fn().mockResolvedValue({ text: 'legacy reply', confidence: 0.5 }) } as unknown as LlmService;
const queue = { add: jest.fn().mockResolvedValue(undefined) };
const conversations = new ConversationService(prisma, queue as unknown as Queue);
const svc = new TicketsService(prisma, knowledge, llm, conversations);

const contactIds = new Set<string>();
const docIds = new Set<string>();
const userIds = new Set<string>();

async function makeContact(): Promise<string> {
  const id = randomUUID();
  const digits = id.replace(/\D/g, '').slice(0, 9).padEnd(9, '0');
  await prisma.$executeRawUnsafe(`INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid,$2,NOW())`, id, `+19${digits}`);
  contactIds.add(id);
  return id;
}

async function makeOperator(): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO users (id, email, password_hash, role, updated_at) VALUES ($1::uuid, $2, 'x', 'OPERATOR'::"UserRole", NOW())`,
    id, `op-${id.slice(0, 8)}@test.local`,
  );
  userIds.add(id);
  return id;
}

beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => {
  for (const id of docIds) await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id=$1::uuid`, id);
  for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id=$1::uuid`, id);
  for (const id of userIds) await prisma.$executeRawUnsafe(`DELETE FROM users WHERE id=$1::uuid`, id);
  await prisma.$disconnect();
});
beforeEach(() => { (llm.generateReply as jest.Mock).mockClear(); });

describe('TicketsService.suggestReply with a linked chatbot conversation', () => {
  it('returns the BotDraft.suggestedReply and does NOT call the legacy LLM', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const inbound = await prisma.conversationInboundMessage.create({
      data: { conversationId: conv.id, metaMessageId: `wamid-${randomUUID()}`, body: 'How do I top up?', receivedAt: new Date(), rawJson: {} },
    });
    await prisma.botDraft.create({
      data: {
        conversationId: conv.id, inboundMessageId: inbound.id, body: 'How do I top up?',
        suggestedReply: 'Top up via the app under Wallet → Add credit.',
        intent: 'credit_topup', intentConfidence: 0.9, draftConfidence: 0.9,
        modelUsed: 'mock', embeddingModelUsed: 'mock', latencyMs: 5, state: 'PENDING',
      },
    });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'LOW_CONFIDENCE', status: 'OPEN' } });

    const res = await svc.suggestReply(ticket.id);

    expect(res.text).toBe('Top up via the app under Wallet → Add credit.');
    expect(llm.generateReply).not.toHaveBeenCalled();
  });
});

describe('TicketsService.agentContext with a linked chatbot conversation', () => {
  it('happy path — returns suggestedKnowledge from BotDraftCitation when a draft exists', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const inbound = await prisma.conversationInboundMessage.create({
      data: { conversationId: conv.id, metaMessageId: `wamid-${randomUUID()}`, body: 'How do I top up?', receivedAt: new Date(), rawJson: {} },
    });

    // Seed a LIVE KnowledgeDocument + KnowledgeChunk via raw SQL (pgvector column).
    const docId = randomUUID();
    const docTitle = `Wallet Top-Up Guide ${docId.slice(0, 8)}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_documents
         (id, name, title, category, content_md, word_count, status, embedding_model, created_by, updated_at)
       VALUES ($1::uuid, $2, $3, 'General', 'body', 1, 'LIVE'::"KnowledgeDocumentStatus", 'mock', $4::uuid, NOW())`,
      docId,
      `tickets-spec-${docId}.md`,
      docTitle,
      randomUUID(),
    );
    docIds.add(docId);

    const chunkId = randomUUID();
    const vec = `[${new Array(1024).fill(0.1).join(',')}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
       VALUES ($1::uuid, $2::uuid, 0, 'Top up under Wallet.', 3, $3::vector)`,
      chunkId,
      docId,
      vec,
    );

    const draft = await prisma.botDraft.create({
      data: {
        conversationId: conv.id, inboundMessageId: inbound.id, body: 'How do I top up?',
        suggestedReply: 'Top up via the app under Wallet.',
        intent: 'credit_topup', intentConfidence: 0.9, draftConfidence: 0.9,
        modelUsed: 'mock', embeddingModelUsed: 'mock', latencyMs: 5, state: 'PENDING',
      },
    });
    await prisma.botDraftCitation.create({
      data: { botDraftId: draft.id, chunkId, similarityScore: 0.9, rank: 1 },
    });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'LOW_CONFIDENCE', status: 'OPEN' } });

    const res = await svc.agentContext(ticket.id);

    expect(res.suggestedKnowledge).toHaveLength(1);
    expect(res.suggestedKnowledge[0].question).toBe(docTitle);
    expect(res.suggestedKnowledge[0].answer).toBe('Top up under Wallet.');
    expect(res.confidence).toBe(0.9);
  });

  it('fallthrough — falls back to legacy path (empty array) when no BotDraft exists', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'LOW_CONFIDENCE', status: 'OPEN' } });

    // knowledge.retrieve is already mocked to return [] at module level.
    const res = await svc.agentContext(ticket.id);

    expect(res.suggestedKnowledge).toEqual([]);
  });
});

describe('TicketsService.assign take-over', () => {
  it('sets the linked conversation assignedToId when the ticket has a conversationId', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });
    const operator = await makeOperator();

    await svc.assign(ticket.id, operator);

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(after.assignedToId).toBe(operator);
  });

  it('does not fail when the ticket has no conversationId (legacy ticket)', async () => {
    const contactId = await makeContact();
    const ticket = await prisma.ticket.create({ data: { contactId, reason: 'COMPLAINT', status: 'OPEN' } });
    const operator = await makeOperator();
    const res = await svc.assign(ticket.id, operator);
    expect(res.status).toBe('IN_PROGRESS');
  });
});

describe('TicketsService.resolve closes the linked conversation', () => {
  it('best-effort closes the chatbot conversation (SKIP) when resolving a linked ticket', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });

    await svc.resolve(ticket.id, randomUUID());

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(after.state).toBe('RESOLVED');
    expect(after.closedAt).not.toBeNull();
  });

  it('still resolves the ticket even when the conversation is not closeable (best-effort)', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'NEW', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });

    const result = await svc.resolve(ticket.id, randomUUID());

    expect(result.status).toBe('RESOLVED'); // ticket resolves regardless
  });
});

describe('TicketsService.resolve with a capture disposition', () => {
  it('SAVE_DRAFT — closes the conversation and records a pending ResolutionCapture with that disposition', async () => {
    const contactId = await makeContact();
    const operator = await makeOperator();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    // A capture disposition requires at least one operator reply on the conversation.
    await conversations.recordOperatorReply(conv.id, 'Top up via the app under Wallet → Add credit.', operator);
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'LOW_CONFIDENCE', status: 'OPEN' } });

    const result = await svc.resolve(ticket.id, operator, { disposition: 'SAVE_DRAFT', editedAnswer: 'Open Wallet → Add credit.' });

    expect(result.status).toBe('RESOLVED');
    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(after.state).toBe('RESOLVED');
    const capture = await prisma.resolutionCapture.findFirst({ where: { conversationId: conv.id }, orderBy: { closedAt: 'desc' } });
    expect(capture?.disposition).toBe('SAVE_DRAFT');
    expect(capture?.editedAnswer).toBe('Open Wallet → Add credit.');
  });

  it('non-SKIP without an operator reply — surfaces the conflict and leaves the ticket OPEN', async () => {
    const contactId = await makeContact();
    const operator = await makeOperator();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });

    await expect(svc.resolve(ticket.id, operator, { disposition: 'IMPORT_LIVE' })).rejects.toBeInstanceOf(ConflictException);

    const after = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    expect(after.status).toBe('OPEN'); // close-first ordering: a rejected capture must not resolve the ticket
  });

  it('default (no opts) still resolves with SKIP — best-effort even when not closeable', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'NEW', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });

    const result = await svc.resolve(ticket.id, randomUUID());

    expect(result.status).toBe('RESOLVED');
  });
});
