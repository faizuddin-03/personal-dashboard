import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ChunkerService } from './chunker.service';
import { IngestionService } from './ingestion.service';
import { RetrievalService } from './retrieval.service';

/**
 * Integration tests: retrieval runs a real pgvector cosine search against Postgres.
 * Embeddings run in mock mode (deterministic, hash-derived 1024-dim vectors) so the
 * same text always maps to the same vector — identical text scores ~1.0, unrelated
 * text scores ~0. That determinism lets us assert ordering and score thresholds
 * without a live embedding backend.
 */
function mockConfig(overrides: Record<string, string | number> = {}): ConfigService {
  const base: Record<string, string | number> = {
    EMBEDDINGS_MOCK_MODE: 'true',
    CHATBOT_RETRIEVAL_TOP_K: 5,
    CHATBOT_RETRIEVAL_MIN_SCORE: 0,
  };
  const merged = { ...base, ...overrides };
  return {
    get: (key: string, fallback?: unknown) => (merged[key] !== undefined ? merged[key] : fallback),
  } as unknown as ConfigService;
}

describe('RetrievalService (pgvector integration)', () => {
  const prisma = new PrismaClient() as unknown as PrismaService;
  const embeddings = new EmbeddingsService(mockConfig());
  const createdDocIds: string[] = [];

  /** Insert a document and its chunks (with embeddings) directly via raw SQL. */
  async function seedDoc(opts: {
    title: string;
    status: 'LIVE' | 'DRAFT' | 'ARCHIVED';
    texts: string[];
    category?: string;
    name?: string;
  }): Promise<string> {
    const docId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_documents
         (id, name, title, category, content_md, word_count, status, embedding_model, created_by, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7::"KnowledgeDocumentStatus", $8, $9::uuid, NOW())`,
      docId,
      opts.name ?? `retrieval-${docId}.md`,
      opts.title,
      opts.category ?? 'General',
      opts.texts.join('\n\n'),
      10,
      opts.status,
      'mock-embed',
      randomUUID(),
    );
    const batch = await embeddings.embed(opts.texts);
    for (let i = 0; i < opts.texts.length; i++) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
         VALUES (gen_random_uuid(), $1::uuid, $2, $3, $4, $5::vector)`,
        docId,
        i,
        opts.texts[i],
        5,
        `[${batch.vectors[i].join(',')}]`,
      );
    }
    createdDocIds.push(docId);
    return docId;
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    for (const id of createdDocIds) {
      await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
    }
    await prisma.$disconnect();
  });

  it('returns matching chunks ordered by similarity DESC with 1-indexed ranks', async () => {
    const tag = randomUUID();
    const match = `How much is shipping to Penang ${tag}?`;
    const unrelated = `Totally unrelated text ${tag}`;
    // Unique category isolates this test from chunks seeded concurrently by other suites.
    const category = `cat-${tag}`;
    await seedDoc({ title: 'Shipping rates', status: 'LIVE', category, texts: [match, unrelated] });
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(match, { minScore: -1, category });

    expect(res.chunks.length).toBe(2);
    expect(res.chunks[0].text).toBe(match);
    expect(res.chunks[0].rank).toBe(1);
    expect(res.chunks[1].rank).toBe(2);
    expect(res.chunks[0].similarityScore).toBeCloseTo(1, 4);
    expect(res.chunks[0].similarityScore).toBeGreaterThanOrEqual(res.chunks[1].similarityScore);
  });

  it('excludes chunks scoring below minScore', async () => {
    const tag = randomUUID();
    const match = `What are your billing terms ${tag}?`;
    await seedDoc({ title: 'Billing', status: 'LIVE', texts: [match, `Unrelated noise ${tag}`] });
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(match, { topK: 5, minScore: 0.9 });

    expect(res.chunks).toHaveLength(1);
    expect(res.chunks[0].text).toBe(match);
  });

  it('never returns chunks from DRAFT documents', async () => {
    const match = `Do you offer refunds ${randomUUID()}?`;
    await seedDoc({ title: 'Draft refunds', status: 'DRAFT', texts: [match] });
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(match, { topK: 5, minScore: 0.5 });

    expect(res.chunks.find((c) => c.text === match)).toBeUndefined();
  });

  it('never returns chunks from ARCHIVED documents', async () => {
    const match = `What time do you close ${randomUUID()}?`;
    await seedDoc({ title: 'Archived hours', status: 'ARCHIVED', texts: [match] });
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(match, { topK: 5, minScore: 0.5 });

    expect(res.chunks.find((c) => c.text === match)).toBeUndefined();
  });

  it('only returns chunks from the requested category when opts.category is set', async () => {
    const tag = randomUUID();
    const query = `Where is my parcel ${tag}?`;
    // Identical text → identical mock vectors → both score ~1.0; only the category differs.
    await seedDoc({ title: 'Logistics doc', status: 'LIVE', category: 'Logistics', texts: [query] });
    await seedDoc({ title: 'Billing doc', status: 'LIVE', category: 'Billing', texts: [query] });
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(query, { topK: 5, minScore: 0.5, category: 'Logistics' });

    expect(res.chunks.length).toBeGreaterThan(0);
    expect(res.chunks.every((c) => c.document.category === 'Logistics')).toBe(true);
  });

  it('returns an empty list when nothing in the knowledge base is similar enough', async () => {
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(`a query with no matching chunks ${randomUUID()}`, { minScore: 0.99 });

    expect(res.chunks).toEqual([]);
  });

  it('defaults topK to env CHATBOT_RETRIEVAL_TOP_K when opts.topK is omitted', async () => {
    const tag = randomUUID();
    const query = `repeated question ${tag}`;
    // Five identical chunks all score ~1.0; the env-driven default cap must apply.
    await seedDoc({ title: 'TopK default doc', status: 'LIVE', texts: Array(5).fill(query) });
    const svc = new RetrievalService(prisma, embeddings, mockConfig({ CHATBOT_RETRIEVAL_TOP_K: 3 }));

    const res = await svc.retrieve(query);

    expect(res.chunks).toHaveLength(3);
  });

  it('includes parent document metadata (id, name, title, category) in each result', async () => {
    const match = `What is your return window ${randomUUID()}?`;
    const docId = await seedDoc({
      title: 'Return policy',
      status: 'LIVE',
      category: 'Billing',
      name: 'returns_policy.md',
      texts: [match],
    });
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(match, { minScore: 0.5 });

    expect(res.chunks.length).toBeGreaterThan(0);
    expect(res.chunks[0].document).toEqual({
      id: docId,
      name: 'returns_policy.md',
      title: 'Return policy',
      category: 'Billing',
    });
  });

  it('reports embedding/search/total latencies and the query embedding model', async () => {
    const match = `Latency probe ${randomUUID()}`;
    await seedDoc({ title: 'Latency doc', status: 'LIVE', texts: [match] });
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve(match, { minScore: 0.5 });

    expect(res.embeddingLatencyMs).toBeGreaterThanOrEqual(0);
    expect(res.searchLatencyMs).toBeGreaterThanOrEqual(0);
    expect(res.totalLatencyMs).toBe(res.embeddingLatencyMs + res.searchLatencyMs);
    expect(res.queryEmbeddingModel).toBe('mock-embed');
  });
});

/**
 * End-to-end: documents seeded and ingested through the REAL chunker before retrieval,
 * mirroring how the bot indexes knowledge. With mock embeddings ordering is pseudorandom,
 * so we only assert result structure; the semantic-ordering assertion is gated behind
 * EMBEDDINGS_MOCK_MODE=false (real bge-m3/OpenAI embeddings).
 */
describe('RetrievalService — end-to-end over ingested documents', () => {
  const realMode = process.env.EMBEDDINGS_MOCK_MODE === 'false';
  const prisma = new PrismaClient() as unknown as PrismaService;
  const embeddings = new EmbeddingsService(mockConfig({ EMBEDDINGS_MOCK_MODE: realMode ? 'false' : 'true' }));
  const chunker = new ChunkerService(
    mockConfig({ CHATBOT_CHUNK_SIZE_TOKENS: 500, CHATBOT_CHUNK_OVERLAP_TOKENS: 50 }),
  );
  const createdDocIds: string[] = [];
  // Unique per-run suffix so document names never collide with leftovers from prior runs.
  const runTag = randomUUID().slice(0, 8);
  const shippingName = `shipping_table-${runTag}.md`;

  async function seedAndIngest(opts: { name: string; title: string; category: string; contentMd: string }): Promise<string> {
    const docId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_documents
         (id, name, title, category, content_md, word_count, status, embedding_model, created_by, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, 'LIVE'::"KnowledgeDocumentStatus", $7, $8::uuid, NOW())`,
      docId,
      opts.name,
      opts.title,
      opts.category,
      opts.contentMd,
      opts.contentMd.split(/\s+/).filter(Boolean).length,
      '',
      randomUUID(),
    );
    createdDocIds.push(docId);
    await new IngestionService(prisma, chunker, embeddings).ingest(docId);
    return docId;
  }

  beforeAll(async () => {
    await prisma.$connect();
    await seedAndIngest({
      name: shippingName,
      title: 'Shipping rates',
      category: 'Logistics',
      contentMd: 'Shipping to Kuala Lumpur costs RM8 and takes 2 working days. Shipping to East Malaysia costs RM15.',
    });
    await seedAndIngest({
      name: `refunds-${runTag}.md`,
      title: 'Refund policy',
      category: 'Billing',
      contentMd: 'Refunds are processed within 7 working days once the returned item is received in original condition.',
    });
    await seedAndIngest({
      name: `hours-${runTag}.md`,
      title: 'Business hours',
      category: 'General',
      contentMd: 'Our store is open Monday to Friday from 9am to 6pm and closed on public holidays.',
    });
  });

  afterAll(async () => {
    for (const id of createdDocIds) {
      await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
    }
    await prisma.$disconnect();
  });

  it('returns well-structured results for an ingested knowledge base', async () => {
    const svc = new RetrievalService(prisma, embeddings, mockConfig());

    const res = await svc.retrieve('How much is shipping to KL?', { minScore: -1 });

    expect(Array.isArray(res.chunks)).toBe(true);
    expect(res.chunks.length).toBeGreaterThan(0);
    const c = res.chunks[0];
    expect(typeof c.chunkId).toBe('string');
    expect(typeof c.text).toBe('string');
    expect(typeof c.tokenCount).toBe('number');
    expect(typeof c.similarityScore).toBe('number');
    expect(c.rank).toBe(1);
    expect(typeof c.document.id).toBe('string');
    expect(typeof c.document.name).toBe('string');
    expect(typeof c.document.title).toBe('string');
    expect(typeof c.document.category).toBe('string');
  });

  (realMode ? it : it.skip)('ranks the shipping document first for a shipping question (real embeddings)', async () => {
    const svc = new RetrievalService(prisma, embeddings, mockConfig({ EMBEDDINGS_MOCK_MODE: 'false' }));

    const res = await svc.retrieve('How much is shipping to KL?', { minScore: 0 });

    expect(res.chunks.length).toBeGreaterThan(0);
    expect(res.chunks[0].document.name).toBe(shippingName);
  });
});
