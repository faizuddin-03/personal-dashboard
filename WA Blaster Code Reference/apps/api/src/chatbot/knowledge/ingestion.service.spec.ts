import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChunkerService } from './chunker.service';
import { IngestionService } from './ingestion.service';
import { EnrichmentService } from './enrichment.service';
import { LlmRouterService } from '../llm/llm-router.service';

function chunkerConfig(overrides: Record<string, string | number> = {}): ConfigService {
  const base: Record<string, string | number> = {
    CHATBOT_CHUNK_SIZE_TOKENS: 500,
    CHATBOT_CHUNK_OVERLAP_TOKENS: 50,
  };
  const merged = { ...base, ...overrides };
  return { get: (k: string, fb?: unknown) => (merged[k] !== undefined ? merged[k] : fb) } as unknown as ConfigService;
}

const mockEmbeddings = new EmbeddingsService({
  get: (k: string, fb?: unknown) => (k === 'EMBEDDINGS_MOCK_MODE' ? 'true' : fb),
} as unknown as ConfigService);

// Enrichment disabled for these integration tests (chunkerConfig() returns the 'false' default for
// CHATBOT_ENRICH_TABLE_ROWS), so behaviour matches pre-enrichment ingestion.
const noEnrich = new EnrichmentService({ complete: jest.fn() } as unknown as LlmRouterService);

describe('IngestionService (integration)', () => {
  const prisma = new PrismaClient() as unknown as PrismaService;
  const userId = randomUUID();
  const docIds = new Set<string>();

  async function makeDoc(contentMd: string, embeddingModel = ''): Promise<string> {
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_documents
         (id, name, title, category, content_md, word_count, embedding_model, created_by, updated_at)
       VALUES ($1::uuid, $2, $3, 'General', $4, $5, $6, $7::uuid, NOW())`,
      id,
      `ingest-${id}.md`,
      'Ingest fixture',
      contentMd,
      contentMd.split(/\s+/).filter(Boolean).length,
      embeddingModel,
      userId,
    );
    docIds.add(id);
    return id;
  }

  async function chunkCount(documentId: string): Promise<number> {
    const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
      `SELECT count(*)::int AS count FROM knowledge_chunks WHERE document_id = $1::uuid`,
      documentId,
    );
    return Number(rows[0].count);
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    for (const id of docIds) await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
    await prisma.$disconnect();
  });

  it('chunks, embeds, and inserts chunks with 1024-dim vectors via raw SQL', async () => {
    const docId = await makeDoc('How much is shipping to Kuala Lumpur and how long does delivery take?');
    const svc = new IngestionService(prisma, new ChunkerService(chunkerConfig()), mockEmbeddings, noEnrich, chunkerConfig());

    const result = await svc.ingest(docId);

    expect(result.chunksCreated).toBeGreaterThan(0);
    expect(await chunkCount(docId)).toBe(result.chunksCreated);
    const dims = await prisma.$queryRawUnsafe<Array<{ dims: number }>>(
      `SELECT vector_dims(embedding) AS dims FROM knowledge_chunks WHERE document_id = $1::uuid LIMIT 1`,
      docId,
    );
    expect(Number(dims[0].dims)).toBe(1024);
  });

  it('sets the document embeddingModel to the model actually used', async () => {
    const docId = await makeDoc('A simple question about refund policy and timelines.');
    const svc = new IngestionService(prisma, new ChunkerService(chunkerConfig()), mockEmbeddings, noEnrich, chunkerConfig());

    const result = await svc.ingest(docId);

    const doc = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: docId } });
    expect(doc.embeddingModel).toBe('mock-embed');
    expect(result.embeddingModel).toBe('mock-embed');
  });

  it('replaces old chunks on re-ingest instead of accumulating them', async () => {
    const docId = await makeDoc('Paragraph one about pricing.\n\nParagraph two about delivery.\n\nParagraph three about returns.');
    // Tiny chunk budget so the doc produces several chunks.
    const svc = new IngestionService(prisma, new ChunkerService(chunkerConfig({ CHATBOT_CHUNK_SIZE_TOKENS: 12, CHATBOT_CHUNK_OVERLAP_TOKENS: 2 })), mockEmbeddings, noEnrich, chunkerConfig());

    const first = await svc.ingest(docId);
    const second = await svc.ingest(docId);

    expect(first.chunksCreated).toBeGreaterThan(1);
    expect(await chunkCount(docId)).toBe(second.chunksCreated);
  });

  it('throws on an empty document', async () => {
    const docId = await makeDoc('   ');
    const svc = new IngestionService(prisma, new ChunkerService(chunkerConfig()), mockEmbeddings, noEnrich, chunkerConfig());

    await expect(svc.ingest(docId)).rejects.toThrow(/empty document/i);
  });

  it('leaves existing chunks and embeddingModel untouched when embedding fails', async () => {
    const docId = await makeDoc('Question about something that will fail to embed.', 'previous-model');
    // Seed a pre-existing chunk so we can confirm it survives a failed re-ingest.
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
       VALUES (gen_random_uuid(), $1::uuid, 0, 'old chunk', 2, $2::vector)`,
      docId,
      `[${new Array(1024).fill(0.1).join(',')}]`,
    );
    const failingEmbeddings = {
      embed: jest.fn().mockRejectedValue(new Error('embeddings exhausted')),
    } as unknown as EmbeddingsService;
    const svc = new IngestionService(prisma, new ChunkerService(chunkerConfig()), failingEmbeddings, noEnrich, chunkerConfig());

    await expect(svc.ingest(docId)).rejects.toThrow();

    expect(await chunkCount(docId)).toBe(1); // old chunk preserved
    const doc = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: docId } });
    expect(doc.embeddingModel).toBe('previous-model'); // unchanged
  });

  it('enriches a consequence prose chunk when enrichment is enabled', async () => {
    const complete = jest
      .fn()
      .mockResolvedValue({ text: 'RESTATED: if you claim, NCD becomes zero.', modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' });
    const enrich = new EnrichmentService({ complete } as unknown as LlmRouterService);
    const cfg = chunkerConfig({ CHATBOT_ENRICH_TABLE_ROWS: 'true', CHATBOT_ENRICH_PROSE_MIN_TOKENS: 5 });
    const svc = new IngestionService(prisma, new ChunkerService(chunkerConfig()), mockEmbeddings, enrich, cfg);
    const md =
      '## NCD\n\nJika Anda membuat tuntutan, kelayakan Diskaun Tanpa Tuntutan Anda akan menjadi sifar ' +
      'pada pembaharuan seterusnya dan pengumpulan dimulakan semula.\n';
    const docId = await makeDoc(md);

    await svc.ingest(docId);

    expect(complete).toHaveBeenCalled();
    const rows = await prisma.$queryRawUnsafe<Array<{ text: string }>>(
      `SELECT text FROM knowledge_chunks WHERE document_id = $1::uuid`,
      docId,
    );
    // Enrichment must be its OWN short chunk (appending to the long prose dilutes its embedding),
    // and the source prose chunk must stay un-appended.
    const enrichmentChunk = rows.find((r) => r.text === 'RESTATED: if you claim, NCD becomes zero.');
    expect(enrichmentChunk).toBeDefined();
    const sourceChunk = rows.find((r) => r.text.includes('menjadi sifar'));
    expect(sourceChunk?.text).not.toContain('RESTATED');
  });
});
