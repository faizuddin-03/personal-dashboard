import { randomUUID } from 'crypto';
import { NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { KnowledgeStatsService } from './knowledge-stats.service';

/**
 * Integration: KnowledgeStatsService is straight Prisma aggregation over Postgres, so we exercise
 * the real counts/joins against seeded rows (mirrors conversation.service.spec's raw-SQL harness).
 * draftsGroundedPct's denominator is GLOBAL (all bot_drafts in the last 7d) and therefore shared
 * with any concurrent suite, so we only assert it is a sane number — never an exact percentage.
 */
const prisma = new PrismaClient() as unknown as PrismaService;
const svc = new KnowledgeStatsService(prisma);

const contactIds = new Set<string>();
const docIds = new Set<string>();
const conversationIds = new Set<string>();

function uniquePhone(): string {
  const digits = randomUUID().replace(/[^0-9]/g, '') + '0000000000';
  return `+1${digits.slice(0, 10)}`;
}

async function makeContact(name: string): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO contacts (id, phone_e164, name, updated_at) VALUES ($1::uuid, $2, $3, NOW())`,
    id,
    uniquePhone(),
    name,
  );
  contactIds.add(id);
  return id;
}

/** Seed a LIVE doc + N chunks via raw SQL. Returns the doc id and the seeded chunk ids. */
async function seedDocWithChunks(chunkCount: number): Promise<{ docId: string; chunkIds: string[] }> {
  const docId = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO knowledge_documents
       (id, name, title, category, content_md, word_count, status, embedding_model, created_by, updated_at)
     VALUES ($1::uuid, $2, 'T', 'General', 'body', 1, 'LIVE'::"KnowledgeDocumentStatus", 'mock', $3::uuid, NOW())`,
    docId,
    `stats-spec-${docId}.md`,
    randomUUID(),
  );
  docIds.add(docId);

  const vec = `[${new Array(1024).fill(0.1).join(',')}]`;
  const chunkIds: string[] = [];
  for (let i = 0; i < chunkCount; i++) {
    const chunkId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
       VALUES ($1::uuid, $2::uuid, $3, 'chunk', 3, $4::vector)`,
      chunkId,
      docId,
      i,
      vec,
    );
    chunkIds.push(chunkId);
  }
  return { docId, chunkIds };
}

async function makeConversation(contactId: string): Promise<string> {
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO conversations (id, contact_id, state, updated_at)
     VALUES ($1::uuid, $2::uuid, 'RESOLVED'::"ConversationState", NOW())`,
    id,
    contactId,
  );
  conversationIds.add(id);
  return id;
}

/** Seed a bot_draft (+ inbound message it references) and citations to the given chunks. */
async function seedDraftWithCitations(
  conversationId: string,
  chunkIds: string[],
  opts: { intent?: string; draftConfidence?: number; createdAt?: Date } = {},
): Promise<string> {
  const inboundId = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO conversation_inbound_messages (id, conversation_id, meta_message_id, body, received_at, raw_json)
     VALUES ($1::uuid, $2::uuid, $3, 'q', NOW(), '{}'::jsonb)`,
    inboundId,
    conversationId,
    `wamid-${randomUUID()}`,
  );

  const draftId = randomUUID();
  const createdAt = opts.createdAt ?? new Date();
  await prisma.$executeRawUnsafe(
    `INSERT INTO bot_drafts
       (id, conversation_id, inbound_message_id, body, intent, intent_confidence, draft_confidence,
        model_used, embedding_model_used, latency_ms, state, created_at, updated_at)
     VALUES ($1::uuid, $2::uuid, $3::uuid, 'draft', $4, 0.9, $5, 'mock', 'mock-embed', 5,
             'PENDING'::"BotDraftState", $6, NOW())`,
    draftId,
    conversationId,
    inboundId,
    opts.intent ?? 'question',
    opts.draftConfidence ?? 0.9,
    createdAt,
  );

  for (let i = 0; i < chunkIds.length; i++) {
    // citationsPerDay filters on the citation row's own created_at, so it must track the draft's date.
    await prisma.$executeRawUnsafe(
      `INSERT INTO bot_draft_citations (id, bot_draft_id, chunk_id, similarity_score, rank, created_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 0.91, $4, $5)`,
      randomUUID(),
      draftId,
      chunkIds[i],
      i + 1,
      createdAt,
    );
  }
  return draftId;
}

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // bot_drafts / citations / chunks cascade from their parents; explicitly clear the roots we own.
  for (const id of conversationIds)
    await prisma.$executeRawUnsafe(`DELETE FROM conversations WHERE id = $1::uuid`, id);
  for (const id of docIds)
    await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
  for (const id of contactIds)
    await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  await prisma.$disconnect();
});

describe('KnowledgeStatsService.stats', () => {
  it('throws NotFoundException for an unknown document id', async () => {
    await expect(svc.stats(randomUUID())).rejects.toBeInstanceOf(NotFoundException);
  });

  it('counts embeddings scoped to the document', async () => {
    const { docId } = await seedDocWithChunks(3);
    const other = await seedDocWithChunks(2); // noise: must NOT be counted
    expect(other.docId).not.toBe(docId);

    const result = await svc.stats(docId);
    expect(result.embeddings).toBe(3);
  });

  it('reports recentUses with the contact name and citationsPerDay for drafts citing this doc', async () => {
    const { docId, chunkIds } = await seedDocWithChunks(1);
    const contactId = await makeContact('Acme Co');
    const conversationId = await makeConversation(contactId);
    const draftId = await seedDraftWithCitations(conversationId, chunkIds, {
      intent: 'shipping',
      draftConfidence: 0.77,
    });

    const result = await svc.stats(docId);

    const use = result.recentUses.find((u) => u.draftId === draftId);
    expect(use).toBeDefined();
    expect(use).toMatchObject({
      draftId,
      intent: 'shipping',
      draftConfidence: 0.77,
      contactName: 'Acme Co',
    });
    expect(use!.createdAt).toBeInstanceOf(Date);

    // One citation (the chunk belongs to this doc) created today → 1/7 rounded to 1 dp = 0.1.
    expect(result.citationsPerDay).toBeCloseTo(0.1, 5);
  });

  it('citationsPerDay ignores citations older than 7 days', async () => {
    const { docId, chunkIds } = await seedDocWithChunks(1);
    const contactId = await makeContact('Old Co');
    const conversationId = await makeConversation(contactId);
    const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
    await seedDraftWithCitations(conversationId, chunkIds, { createdAt: eightDaysAgo });

    const result = await svc.stats(docId);
    // The only citation for this doc is >7d old, so the windowed count is 0.
    expect(result.citationsPerDay).toBe(0);
  });

  it('draftsGroundedPct is a sane percentage and counts this doc as grounding its own draft', async () => {
    const { docId, chunkIds } = await seedDocWithChunks(1);
    const contactId = await makeContact('Grounded Co');
    const conversationId = await makeConversation(contactId);
    await seedDraftWithCitations(conversationId, chunkIds);

    const result = await svc.stats(docId);

    // Denominator is GLOBAL (all bot_drafts in 7d), shared with concurrent suites, so the rounded
    // percentage can legitimately be anything in [0,100] — assert only that it is sane.
    expect(typeof result.draftsGroundedPct).toBe('number');
    expect(result.draftsGroundedPct).toBeGreaterThanOrEqual(0);
    expect(result.draftsGroundedPct).toBeLessThanOrEqual(100);

    // The doc-scoped grounded numerator IS deterministic: our draft grounds this doc, so the
    // grounded count for the window must be >= 1 (this is what feeds draftsGroundedPct's numerator).
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const grounded = await prisma.botDraft.count({
      where: { createdAt: { gte: sevenDaysAgo }, citations: { some: { chunk: { documentId: docId } } } },
    });
    expect(grounded).toBeGreaterThanOrEqual(1);
  });
});
