import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { EmbeddingsService } from './embeddings.service';
import { EMBEDDING_DIM } from './adapters/embedding-adapter.interface';

/**
 * End-to-end pgvector round-trip: embed text → store the 1024-dim vector in
 * knowledge_chunks.embedding (vector(1024)) via raw SQL → read it back with the `<=>`
 * cosine-distance operator. Uses the mock embedding adapter so the test needs Postgres+pgvector
 * but not a running Ollama. Proves the dimension survives the round trip and that the same
 * vector compares at distance 0.
 */
describe('Embeddings ↔ pgvector round-trip (integration)', () => {
  const prisma = new PrismaClient();
  // Mock mode → deterministic 1024-dim vectors, no network dependency.
  const config = {
    get: (key: string, fallback?: unknown) => (key === 'EMBEDDINGS_MOCK_MODE' ? 'true' : fallback),
    getOrThrow: (key: string) => {
      throw new Error(`missing: ${key}`);
    },
  } as unknown as ConfigService;
  const service = new EmbeddingsService(config);

  const documentId = randomUUID();
  const chunkId = randomUUID();

  beforeAll(async () => {
    await prisma.$connect();
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_documents
         (id, name, title, category, content_md, word_count, embedding_model, created_by, updated_at)
       VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8::uuid, NOW())`,
      documentId,
      `pgvector-roundtrip-${documentId}.md`,
      'pgvector round-trip fixture',
      'General',
      'How much is shipping to KL?',
      5,
      'mock-embed',
      randomUUID(),
    );
  });

  afterAll(async () => {
    // Cascades to the chunk via the FK on document_id.
    await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, documentId);
    await prisma.$disconnect();
  });

  it('stores a 1024-dim vector and reads it back at distance 0', async () => {
    const { vectors } = await service.embed(['How much is shipping to KL?']);
    const embedding = vectors[0];
    expect(embedding).toHaveLength(EMBEDDING_DIM);

    const literal = `[${embedding.join(',')}]`;

    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6::vector)`,
      chunkId,
      documentId,
      0,
      'How much is shipping to KL?',
      6,
      literal,
    );

    const rows = await prisma.$queryRawUnsafe<Array<{ id: string; distance: number; dims: number }>>(
      `SELECT id,
              embedding <=> $1::vector AS distance,
              vector_dims(embedding) AS dims
       FROM knowledge_chunks
       WHERE id = $2::uuid`,
      literal,
      chunkId,
    );

    expect(rows).toHaveLength(1);
    expect(Number(rows[0].dims)).toBe(EMBEDDING_DIM);
    expect(Number(rows[0].distance)).toBeCloseTo(0, 6);
  });
});
