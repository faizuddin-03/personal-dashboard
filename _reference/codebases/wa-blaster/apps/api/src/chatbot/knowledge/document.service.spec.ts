import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChunkerService } from './chunker.service';
import { IngestionService } from './ingestion.service';
import { DocumentService } from './document.service';

/** A no-op ingestion collaborator for the pure-CRUD tests (ingestion has its own suite). */
function noopIngestion(): IngestionService {
  return { ingest: jest.fn().mockResolvedValue({ chunksCreated: 0, embeddingModel: '', latencyMs: 0 }) } as unknown as IngestionService;
}

/**
 * Integration test: DocumentService is straight Prisma over Postgres. We exercise real
 * unique constraints and cascade deletes rather than mocking them, since those DB
 * behaviours are the whole point of the service.
 */
describe('DocumentService (integration)', () => {
  const prisma = new PrismaClient() as unknown as PrismaService;
  const userId = randomUUID();
  const docIds = new Set<string>();
  const contactIds = new Set<string>();

  const svc = new DocumentService(prisma, noopIngestion());

  function uniqueName() {
    return `doc-${randomUUID()}.md`;
  }

  /** Insert a chunk (with a placeholder embedding) so publish/get/cascade tests have data. */
  async function addChunk(documentId: string, text = 'chunk text'): Promise<string> {
    const id = randomUUID();
    const vec = `[${new Array(1024).fill(0.1).join(',')}]`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
       VALUES ($1::uuid, $2::uuid, 0, $3, 3, $4::vector)`,
      id,
      documentId,
      text,
      vec,
    );
    return id;
  }

  async function track<T extends { id: string }>(p: Promise<T>): Promise<T> {
    const doc = await p;
    docIds.add(doc.id);
    return doc;
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    for (const id of docIds) await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
    for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
    await prisma.$disconnect();
  });

  it('creates a DRAFT document with computed wordCount and empty embeddingModel', async () => {
    const doc = await track(
      svc.create({ name: uniqueName(), title: 'Shipping', category: 'Logistics', contentMd: 'one two three four', userId }),
    );

    expect(doc.status).toBe('DRAFT');
    expect(doc.wordCount).toBe(4);
    expect(doc.embeddingModel).toBe('');
    expect(doc.createdById).toBe(userId);
  });

  it('throws when creating a document with a duplicate name', async () => {
    const name = uniqueName();
    await track(svc.create({ name, title: 'A', category: 'General', contentMd: 'hi', userId }));

    await expect(
      svc.create({ name, title: 'B', category: 'General', contentMd: 'hi again', userId }),
    ).rejects.toThrow();
  });

  it('flags contentChanged and recomputes wordCount when contentMd changes', async () => {
    const doc = await track(svc.create({ name: uniqueName(), title: 'T', category: 'General', contentMd: 'a b', userId }));

    const changed = await svc.update({ id: doc.id, contentMd: 'a b c d e' });
    expect(changed.contentChanged).toBe(true);
    expect(changed.document.wordCount).toBe(5);

    const unchanged = await svc.update({ id: doc.id, title: 'New title only' });
    expect(unchanged.contentChanged).toBe(false);
    expect(unchanged.document.title).toBe('New title only');
  });

  it('deletes a document and cascades to its chunks', async () => {
    const doc = await svc.create({ name: uniqueName(), title: 'D', category: 'General', contentMd: 'body', userId });
    await addChunk(doc.id);

    await svc.delete(doc.id);

    const remaining = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT count(*)::int AS count FROM knowledge_chunks WHERE document_id = $1::uuid`,
      doc.id,
    );
    expect(Number(remaining[0].count)).toBe(0);
    const docRow = await prisma.knowledgeDocument.findUnique({ where: { id: doc.id } });
    expect(docRow).toBeNull();
  });

  it('cascade-deletes citations when a document (and its chunks) is removed', async () => {
    // Build the chain a citation needs: contact → conversation → inbound → bot draft → citation.
    const contactId = randomUUID();
    contactIds.add(contactId);
    await prisma.$executeRawUnsafe(
      `INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid, $2, NOW())`,
      contactId,
      `+1${Math.abs(hash(contactId)).toString().padStart(10, '0').slice(0, 10)}`,
    );
    const conversationId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO conversations (id, contact_id, updated_at) VALUES ($1::uuid, $2::uuid, NOW())`,
      conversationId,
      contactId,
    );
    const inboundId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO conversation_inbound_messages (id, conversation_id, meta_message_id, body, received_at, raw_json)
       VALUES ($1::uuid, $2::uuid, $3, 'q', NOW(), '{}'::jsonb)`,
      inboundId,
      conversationId,
      `meta-${inboundId}`,
    );
    const botDraftId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO bot_drafts
         (id, conversation_id, inbound_message_id, body, intent, intent_confidence, draft_confidence,
          model_used, embedding_model_used, latency_ms, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 'draft', 'other', 0.9, 0.9, 'mock', 'mock-embed', 5, NOW())`,
      botDraftId,
      conversationId,
      inboundId,
    );

    const doc = await svc.create({ name: uniqueName(), title: 'C', category: 'General', contentMd: 'body', userId });
    const chunkId = await addChunk(doc.id);
    const citationId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO bot_draft_citations (id, bot_draft_id, chunk_id, similarity_score, rank)
       VALUES ($1::uuid, $2::uuid, $3::uuid, 0.95, 1)`,
      citationId,
      botDraftId,
      chunkId,
    );

    await svc.delete(doc.id);

    const citation = await prisma.botDraftCitation.findUnique({ where: { id: citationId } });
    expect(citation).toBeNull();
  });

  it('publishes a DRAFT with chunks to LIVE, and refuses to publish one without chunks', async () => {
    const withChunks = await track(svc.create({ name: uniqueName(), title: 'P', category: 'General', contentMd: 'x', userId }));
    await addChunk(withChunks.id);
    const published = await svc.publish(withChunks.id);
    expect(published.status).toBe('LIVE');

    const noChunks = await track(svc.create({ name: uniqueName(), title: 'P2', category: 'General', contentMd: 'x', userId }));
    await expect(svc.publish(noChunks.id)).rejects.toThrow(/no chunks/i);
  });

  it('unpublishes a LIVE document back to DRAFT', async () => {
    const doc = await track(svc.create({ name: uniqueName(), title: 'U', category: 'General', contentMd: 'x', userId }));
    await addChunk(doc.id);
    await svc.publish(doc.id);

    const result = await svc.unpublish(doc.id);
    expect(result.status).toBe('DRAFT');
  });

  it('lists documents filtered by category, status, and search with pagination', async () => {
    const tag = randomUUID().slice(0, 8);
    const a = await track(svc.create({ name: uniqueName(), title: `Pricing ${tag}`, category: `Cat-${tag}`, contentMd: 'p', userId }));
    await track(svc.create({ name: uniqueName(), title: `Refunds ${tag}`, category: `Cat-${tag}`, contentMd: 'r', userId }));
    await addChunk(a.id);
    await svc.publish(a.id); // a is LIVE, the other stays DRAFT

    const byCategory = await svc.list({ category: `Cat-${tag}` });
    expect(byCategory.total).toBe(2);

    const liveOnly = await svc.list({ category: `Cat-${tag}`, status: 'LIVE' });
    expect(liveOnly.total).toBe(1);
    expect(liveOnly.items[0].id).toBe(a.id);

    const searched = await svc.list({ category: `Cat-${tag}`, search: 'Pricing' });
    expect(searched.total).toBe(1);
    expect(searched.items[0].title).toContain('Pricing');

    const paged = await svc.list({ category: `Cat-${tag}`, page: 1, limit: 1 });
    expect(paged.items).toHaveLength(1);
    expect(paged.total).toBe(2);
  });

  it('gets a document with its chunk count and embedding model', async () => {
    const doc = await track(svc.create({ name: uniqueName(), title: 'G', category: 'General', contentMd: 'x', userId }));
    await addChunk(doc.id);
    await addChunk(doc.id, 'second');

    const detail = await svc.get(doc.id);
    expect(detail.id).toBe(doc.id);
    expect(detail.chunkCount).toBe(2);
    expect(detail.embeddingModel).toBe('');
  });
});

describe('DocumentService auto-ingest (integration)', () => {
  const prisma = new PrismaClient() as unknown as PrismaService;
  const userId = randomUUID();
  const docIds = new Set<string>();

  const chunkerConfig = { get: (k: string, fb?: unknown) => fb } as unknown as ConfigService;
  const mockEmbeddings = new EmbeddingsService({
    get: (k: string, fb?: unknown) => (k === 'EMBEDDINGS_MOCK_MODE' ? 'true' : fb),
  } as unknown as ConfigService);
  const ingestion = new IngestionService(prisma, new ChunkerService(chunkerConfig), mockEmbeddings);
  const svc = new DocumentService(prisma, ingestion);

  function name() {
    return `autoingest-${randomUUID()}.md`;
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

  it('ingests immediately on create by default', async () => {
    const doc = await svc.create({ name: name(), title: 'Auto', category: 'General', contentMd: 'How much is shipping?', userId });
    docIds.add(doc.id);

    expect(await chunkCount(doc.id)).toBeGreaterThan(0);
    expect(doc.embeddingModel).toBe('mock-embed');
  });

  it('skips ingestion on create when autoIngest=false', async () => {
    const doc = await svc.create({ name: name(), title: 'Manual', category: 'General', contentMd: 'No chunks yet.', userId, autoIngest: false });
    docIds.add(doc.id);

    expect(await chunkCount(doc.id)).toBe(0);
    expect(doc.embeddingModel).toBe('');
  });

  it('re-ingests on update when contentMd changes', async () => {
    const doc = await svc.create({ name: name(), title: 'Re', category: 'General', contentMd: 'Original question.', userId, autoIngest: false });
    docIds.add(doc.id);
    expect(await chunkCount(doc.id)).toBe(0);

    const result = await svc.update({ id: doc.id, contentMd: 'A completely new question about delivery.' });

    expect(result.contentChanged).toBe(true);
    expect(await chunkCount(doc.id)).toBeGreaterThan(0);
    expect(result.document.embeddingModel).toBe('mock-embed');
  });

  it('does not re-ingest on update when only metadata changes', async () => {
    const doc = await svc.create({ name: name(), title: 'Meta', category: 'General', contentMd: 'Body stays.', userId, autoIngest: false });
    docIds.add(doc.id);
    const spy = jest.spyOn(ingestion, 'ingest');

    await svc.update({ id: doc.id, title: 'Renamed only' });

    expect(spy).not.toHaveBeenCalled();
    expect(await chunkCount(doc.id)).toBe(0);
    spy.mockRestore();
  });

  it('still creates and returns the DRAFT document when auto-ingest fails', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const failing = { ingest: jest.fn().mockRejectedValue(new Error('embeddings exhausted')) } as unknown as IngestionService;
    const fsvc = new DocumentService(prisma, failing);

    const doc = await fsvc.create({ name: name(), title: 'Resilient', category: 'General', contentMd: 'A question?', userId });
    docIds.add(doc.id);

    expect(doc.status).toBe('DRAFT');
    expect(doc.embeddingModel).toBe('');
    expect(await chunkCount(doc.id)).toBe(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('does not throw and reports reingested=false when re-ingest fails on update', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
    const doc = await svc.create({ name: name(), title: 'U2', category: 'General', contentMd: 'orig', userId, autoIngest: false });
    docIds.add(doc.id);
    const failing = { ingest: jest.fn().mockRejectedValue(new Error('ollama down')) } as unknown as IngestionService;
    const fsvc = new DocumentService(prisma, failing);

    const result = await fsvc.update({ id: doc.id, contentMd: 'changed content here' });

    expect(result.contentChanged).toBe(true);
    expect(result.reingested).toBe(false);
    expect(result.document.contentMd).toBe('changed content here');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}
