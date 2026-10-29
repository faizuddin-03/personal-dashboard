import { randomUUID } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';
import { ChunkerService } from './chunker.service';
import { RetrievalService } from './retrieval.service';
import { IngestionService } from './ingestion.service';
import { TitleGeneratorService } from './title-generator.service';
import { ResolutionCaptureService } from './resolution-capture.service';

const cfg = (overrides: Record<string, string | number> = {}): ConfigService => {
  const base: Record<string, string | number> = { CHATBOT_CAPTURE_DEDUP_THRESHOLD: 0.85, EMBEDDINGS_MOCK_MODE: 'true' };
  const merged = { ...base, ...overrides };
  return { get: (k: string, fb?: unknown) => (merged[k] !== undefined ? merged[k] : fb) } as unknown as ConfigService;
};

describe('ResolutionCaptureService (integration)', () => {
  const prisma = new PrismaClient() as unknown as PrismaService;
  const embeddings = new EmbeddingsService(cfg());
  const chunker = new ChunkerService(cfg());
  const retrieval = new RetrievalService(prisma, embeddings, cfg());
  const ingestion = new IngestionService(prisma, chunker, embeddings);
  const titleGen = { generate: jest.fn().mockResolvedValue('Generated KB title') } as unknown as TitleGeneratorService;

  const userId = randomUUID();
  const contactIds = new Set<string>();
  const docIds = new Set<string>();

  function service(opts: { ingestion?: IngestionService } = {}) {
    return new ResolutionCaptureService(prisma, embeddings, chunker, retrieval, opts.ingestion ?? ingestion, titleGen, cfg());
  }

  async function seedContact(): Promise<string> {
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid, $2, NOW())`,
      id,
      `+19${id.replace(/\D/g, '').slice(0, 9).padEnd(9, '0')}`,
    );
    contactIds.add(id);
    return id;
  }

  async function seedConversation(opts: {
    question: string;
    operatorReply?: string;
    language?: 'EN' | 'MS';
    state?: string;
  }): Promise<string> {
    const contactId = await seedContact();
    const conversationId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO conversations (id, contact_id, state, detected_language, updated_at)
       VALUES ($1::uuid, $2::uuid, $3::"ConversationState", $4::"LanguagePreference", NOW())`,
      conversationId,
      contactId,
      opts.state ?? 'RESOLVED',
      opts.language ?? 'EN',
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO conversation_inbound_messages (id, conversation_id, meta_message_id, body, received_at, raw_json)
       VALUES (gen_random_uuid(), $1::uuid, $2, $3, NOW(), '{}'::jsonb)`,
      conversationId,
      `in-${conversationId}`,
      opts.question,
    );
    if (opts.operatorReply) {
      await prisma.$executeRawUnsafe(
        `INSERT INTO conversation_outbound_messages (id, conversation_id, meta_message_id, body, kind, sent_at)
         VALUES (gen_random_uuid(), $1::uuid, $2, $3, 'OPERATOR_REPLY', NOW())`,
        conversationId,
        `out-${conversationId}`,
        opts.operatorReply,
      );
    }
    return conversationId;
  }

  async function seedCaptureRow(conversationId: string, disposition: string): Promise<void> {
    await prisma.$executeRawUnsafe(
      `INSERT INTO resolution_captures (id, conversation_id, closed_by, closed_at, disposition, status, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, $2::uuid, NOW(), $3, 'pending', NOW())`,
      conversationId,
      userId,
      disposition,
    );
  }

  async function seedLiveDoc(question: string): Promise<string> {
    const docId = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_documents
         (id, name, title, category, content_md, word_count, status, embedding_model, created_by, updated_at)
       VALUES ($1::uuid, $2, $3, 'General', $4, 5, 'LIVE', 'mock-embed', $5::uuid, NOW())`,
      docId,
      `live-${docId}.md`,
      'Existing live doc',
      question,
      userId,
    );
    const batch = await embeddings.embed([question]);
    await prisma.$executeRawUnsafe(
      `INSERT INTO knowledge_chunks (id, document_id, chunk_index, text, token_count, embedding)
       VALUES (gen_random_uuid(), $1::uuid, 0, $2, 5, $3::vector)`,
      docId,
      question,
      `[${batch.vectors[0].join(',')}]`,
    );
    docIds.add(docId);
    return docId;
  }

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
    for (const id of docIds) await prisma.$executeRawUnsafe(`DELETE FROM knowledge_documents WHERE id = $1::uuid`, id);
    await prisma.$disconnect();
  });

  describe('preview', () => {
    it('builds a title + contentMd and lists LIVE duplicates without mutating anything', async () => {
      const question = `Do you ship to Sabah on weekends ${randomUUID()}?`;
      await seedLiveDoc(question); // an existing LIVE doc that answers the same question
      const conversationId = await seedConversation({ question, operatorReply: 'Yes, we ship daily including weekends.' });

      const preview = await service().preview({ conversationId });

      expect(preview.proposedTitle).toBe('Generated KB title');
      expect(preview.proposedContentMd).toContain('## Question');
      expect(preview.proposedContentMd).toContain(question);
      expect(preview.proposedContentMd).toContain('Yes, we ship daily including weekends.');
      expect(preview.duplicates.length).toBeGreaterThan(0);
      expect(preview.duplicates[0].similarityScore).toBeGreaterThanOrEqual(0.85);

      // No mutation: no capture row, no captured document.
      const cap = await prisma.resolutionCapture.findUnique({ where: { conversationId } });
      expect(cap).toBeNull();
      const doc = await prisma.knowledgeDocument.findUnique({ where: { capturedFromConversationId: conversationId } });
      expect(doc).toBeNull();
    });

    it('throws NO_OPERATOR_REPLY when the conversation has no operator reply', async () => {
      const conversationId = await seedConversation({ question: 'Any help?' });

      await expect(service().preview({ conversationId })).rejects.toMatchObject({
        response: expect.objectContaining({ code: 'NO_OPERATOR_REPLY' }),
      });
    });

    it('is allowed while the conversation is still REPLIED (not yet RESOLVED)', async () => {
      const question = `What are your opening hours ${randomUUID()}?`;
      const conversationId = await seedConversation({ question, operatorReply: '9am to 6pm.', state: 'REPLIED' });

      const preview = await service().preview({ conversationId });
      expect(preview.proposedContentMd).toContain('9am to 6pm.');
    });
  });

  describe('capture', () => {
    it('creates a LIVE document, ingests it, and marks the row captured_live for IMPORT_LIVE', async () => {
      const question = `Can I change my delivery address ${randomUUID()}?`;
      const conversationId = await seedConversation({ question, operatorReply: 'Yes, before it ships.' });
      await seedCaptureRow(conversationId, 'IMPORT_LIVE');

      const row = await service().capture({ conversationId, closedByUserId: userId, disposition: 'IMPORT_LIVE' });

      expect(row.status).toBe('captured_live');
      expect(row.documentId).not.toBeNull();
      docIds.add(row.documentId!);
      const doc = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: row.documentId! } });
      expect(doc.status).toBe('LIVE');
      expect(doc.capturedFromConversationId).toBe(conversationId);
      const chunkCount = await prisma.knowledgeChunk.count({ where: { documentId: doc.id } });
      expect(chunkCount).toBeGreaterThan(0);
      expect(doc.embeddingModel).toBe('mock-embed');
    });

    it('creates a DRAFT document and marks the row captured_draft for SAVE_DRAFT', async () => {
      const question = `Do you accept returns ${randomUUID()}?`;
      const conversationId = await seedConversation({ question, operatorReply: 'Within 30 days.' });
      await seedCaptureRow(conversationId, 'SAVE_DRAFT');

      const row = await service().capture({ conversationId, closedByUserId: userId, disposition: 'SAVE_DRAFT' });

      expect(row.status).toBe('captured_draft');
      docIds.add(row.documentId!);
      const doc = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: row.documentId! } });
      expect(doc.status).toBe('DRAFT');
    });

    it('uses editedAnswer over the literal operator reply when provided', async () => {
      const question = `Is there a warranty ${randomUUID()}?`;
      const conversationId = await seedConversation({ question, operatorReply: 'yeah 1 yr i think' });
      await seedCaptureRow(conversationId, 'SAVE_DRAFT');

      const row = await service().capture({
        conversationId,
        closedByUserId: userId,
        disposition: 'SAVE_DRAFT',
        editedAnswer: 'All products carry a 1-year manufacturer warranty.',
      });

      docIds.add(row.documentId!);
      const doc = await prisma.knowledgeDocument.findUniqueOrThrow({ where: { id: row.documentId! } });
      expect(doc.contentMd).toContain('All products carry a 1-year manufacturer warranty.');
      expect(doc.contentMd).not.toContain('yeah 1 yr i think');
    });

    it('marks the row skipped_by_operator for SKIP without creating a document', async () => {
      const conversationId = await seedConversation({ question: 'q', operatorReply: 'a' });
      await seedCaptureRow(conversationId, 'SKIP');

      const row = await service().capture({ conversationId, closedByUserId: userId, disposition: 'SKIP' });

      expect(row.status).toBe('skipped_by_operator');
      expect(row.documentId).toBeNull();
      const doc = await prisma.knowledgeDocument.findUnique({ where: { capturedFromConversationId: conversationId } });
      expect(doc).toBeNull();
    });

    it('marks skipped_duplicate (with duplicateOfId) when a dedup hit is not forced', async () => {
      const question = `What payment methods do you accept ${randomUUID()}?`;
      const dupDocId = await seedLiveDoc(question);
      const conversationId = await seedConversation({ question, operatorReply: 'Cards and FPX.' });
      await seedCaptureRow(conversationId, 'IMPORT_LIVE');

      const row = await service().capture({ conversationId, closedByUserId: userId, disposition: 'IMPORT_LIVE' });

      expect(row.status).toBe('skipped_duplicate');
      expect(row.duplicateOfId).toBe(dupDocId);
      expect(row.documentId).toBeNull();
    });

    it('proceeds despite a dedup hit when forcedDespiteDuplicate=true', async () => {
      const question = `How do I track my parcel ${randomUUID()}?`;
      await seedLiveDoc(question);
      const conversationId = await seedConversation({ question, operatorReply: 'Use the tracking link in your SMS.' });
      await seedCaptureRow(conversationId, 'IMPORT_LIVE');

      const row = await service().capture({
        conversationId,
        closedByUserId: userId,
        disposition: 'IMPORT_LIVE',
        forcedDespiteDuplicate: true,
      });

      expect(row.status).toBe('captured_live');
      expect(row.forcedDespiteDuplicate).toBe(true);
      docIds.add(row.documentId!);
    });

    it('marks the row failed (with failureReason) when ingestion throws, preserving it for retry', async () => {
      const question = `Why is my account locked ${randomUUID()}?`;
      const conversationId = await seedConversation({ question, operatorReply: 'Reset your password.' });
      await seedCaptureRow(conversationId, 'SAVE_DRAFT');
      const failingIngestion = { ingest: jest.fn().mockRejectedValue(new Error('embeddings exhausted')) } as unknown as IngestionService;

      const row = await service({ ingestion: failingIngestion }).capture({
        conversationId,
        closedByUserId: userId,
        disposition: 'SAVE_DRAFT',
      });

      expect(row.status).toBe('failed');
      expect(row.failureReason).toContain('embeddings exhausted');
      // Row preserved (still queryable) for a later retry.
      const persisted = await prisma.resolutionCapture.findUniqueOrThrow({ where: { conversationId } });
      expect(persisted.status).toBe('failed');
      // The orphaned document it created before ingest failed is tracked for cleanup.
      const orphan = await prisma.knowledgeDocument.findUnique({ where: { capturedFromConversationId: conversationId } });
      if (orphan) docIds.add(orphan.id);
    });
  });
});
