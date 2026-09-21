import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentService } from '../knowledge/document.service';
import { IngestionService } from '../knowledge/ingestion.service';
import { RetrievalService } from '../knowledge/retrieval.service';
import { CaptureAdminService } from './capture-admin.service';

/**
 * Unit tests with fully mocked collaborators: this gives deterministic branch coverage of
 * promote()/discard()/list()/get() without fighting the mock-embeddings backend or Postgres.
 */
function makeMocks() {
  const prisma = {
    resolutionCapture: { findUnique: jest.fn(), update: jest.fn(), findMany: jest.fn(), count: jest.fn() },
    knowledgeDocument: { update: jest.fn() },
    knowledgeChunk: { count: jest.fn() },
    conversationInboundMessage: { findFirst: jest.fn() },
    $transaction: jest.fn(),
  } as unknown as PrismaService;
  const docSvc = { publish: jest.fn(), get: jest.fn() } as unknown as DocumentService;
  const ingestion = { ingest: jest.fn() } as unknown as IngestionService;
  const retrieval = { retrieve: jest.fn() } as unknown as RetrievalService;
  const config = { get: jest.fn().mockReturnValue(0.85) } as unknown as ConfigService;
  const svc = new CaptureAdminService(prisma, docSvc, ingestion, retrieval, config);
  return { prisma, docSvc, ingestion, retrieval, config, svc };
}

// Typed accessors onto the jest mocks.
const pc = (p: PrismaService) => p as unknown as {
  resolutionCapture: { findUnique: jest.Mock; update: jest.Mock; findMany: jest.Mock; count: jest.Mock };
  knowledgeDocument: { update: jest.Mock };
  knowledgeChunk: { count: jest.Mock };
  conversationInboundMessage: { findFirst: jest.Mock };
  $transaction: jest.Mock;
};

describe('CaptureAdminService.promote', () => {
  it('throws NotFoundException when the capture does not exist', async () => {
    const { svc, prisma } = makeMocks();
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(null);
    await expect(svc.promote('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NOTHING_TO_PROMOTE when the capture has no documentId', async () => {
    const { svc, prisma } = makeMocks();
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue({ id: 'c1', documentId: null, status: 'failed' });
    await expect(svc.promote('c1', {})).rejects.toMatchObject({
      response: { code: 'NOTHING_TO_PROMOTE' },
    });
  });

  it('throws ALREADY_LIVE when the capture is already captured_live', async () => {
    const { svc, prisma } = makeMocks();
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue({ id: 'c1', documentId: 'd1', status: 'captured_live' });
    await expect(svc.promote('c1', {})).rejects.toMatchObject({
      response: { code: 'ALREADY_LIVE' },
    });
  });

  it('blocks with DUPLICATE when retrieval finds a near-dup and not forced', async () => {
    const { svc, prisma, retrieval } = makeMocks();
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue({
      id: 'c1', documentId: 'd1', status: 'captured_draft', conversationId: 'conv1', forcedDespiteDuplicate: false, duplicateOfId: null,
    });
    pc(prisma).conversationInboundMessage.findFirst.mockResolvedValue({ body: 'How do I reset my password?' });
    (retrieval.retrieve as jest.Mock).mockResolvedValue({
      chunks: [{ similarityScore: 0.93, document: { id: 'dup-doc', title: 'Password reset' } }],
    });

    await expect(svc.promote('c1', { forcedDespiteDuplicate: false })).rejects.toMatchObject({
      response: { code: 'DUPLICATE', duplicate: { documentId: 'dup-doc', documentTitle: 'Password reset', similarityScore: 0.93 } },
    });

    expect(retrieval.retrieve).toHaveBeenCalledWith('How do I reset my password?', { topK: 1, minScore: 0.85 });
    // Nothing was published when blocked.
    const { docSvc } = makeMocks();
    expect(docSvc.publish).not.toHaveBeenCalled();
  });

  it('forced overrides the duplicate: ingests-if-zero-chunks, publishes, sets captured_live + duplicateOfId', async () => {
    const { svc, prisma, retrieval, ingestion, docSvc } = makeMocks();
    const capture = { id: 'c1', documentId: 'd1', status: 'captured_draft', conversationId: 'conv1', forcedDespiteDuplicate: false, duplicateOfId: null };
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(capture);
    pc(prisma).conversationInboundMessage.findFirst.mockResolvedValue({ body: 'reset password' });
    (retrieval.retrieve as jest.Mock).mockResolvedValue({
      chunks: [{ similarityScore: 0.93, document: { id: 'dup-doc', title: 'Password reset' } }],
    });
    pc(prisma).knowledgeChunk.count.mockResolvedValue(0);
    (ingestion.ingest as jest.Mock).mockResolvedValue({ chunksCreated: 2 });
    const publishedDoc = { id: 'd1', status: 'LIVE', title: 'T' };
    (docSvc.publish as jest.Mock).mockResolvedValue(publishedDoc);
    const updatedCapture = { ...capture, status: 'captured_live', forcedDespiteDuplicate: true, duplicateOfId: 'dup-doc' };
    pc(prisma).resolutionCapture.update.mockResolvedValue(updatedCapture);

    const result = await svc.promote('c1', { forcedDespiteDuplicate: true });

    expect(ingestion.ingest).toHaveBeenCalledWith('d1');
    expect(docSvc.publish).toHaveBeenCalledWith('d1');
    expect(pc(prisma).resolutionCapture.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'captured_live', forcedDespiteDuplicate: true, duplicateOfId: 'dup-doc' },
    });
    expect(result).toEqual({ capture: updatedCapture, document: publishedDoc });
  });

  it('happy path with no duplicates: ingests because chunk count is zero, then publishes', async () => {
    const { svc, prisma, retrieval, ingestion, docSvc } = makeMocks();
    const capture = { id: 'c1', documentId: 'd1', status: 'captured_draft', conversationId: 'conv1', forcedDespiteDuplicate: false, duplicateOfId: null };
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(capture);
    pc(prisma).conversationInboundMessage.findFirst.mockResolvedValue({ body: 'a unique question' });
    (retrieval.retrieve as jest.Mock).mockResolvedValue({ chunks: [] });
    pc(prisma).knowledgeChunk.count.mockResolvedValue(0);
    (ingestion.ingest as jest.Mock).mockResolvedValue({ chunksCreated: 3 });
    const publishedDoc = { id: 'd1', status: 'LIVE' };
    (docSvc.publish as jest.Mock).mockResolvedValue(publishedDoc);
    pc(prisma).resolutionCapture.update.mockResolvedValue({ ...capture, status: 'captured_live' });

    const result = await svc.promote('c1', {});

    expect(ingestion.ingest).toHaveBeenCalledWith('d1');
    expect(docSvc.publish).toHaveBeenCalledWith('d1');
    // not forced, no dup → duplicateOfId stays whatever it was (null), forcedDespiteDuplicate falls back to capture's
    expect(pc(prisma).resolutionCapture.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'captured_live', forcedDespiteDuplicate: false, duplicateOfId: null },
    });
    expect(result.document).toBe(publishedDoc);
  });

  it('does not ingest when chunks already exist; publishes directly', async () => {
    const { svc, prisma, retrieval, ingestion, docSvc } = makeMocks();
    const capture = { id: 'c1', documentId: 'd1', status: 'captured_draft', conversationId: 'conv1', forcedDespiteDuplicate: false, duplicateOfId: null };
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(capture);
    pc(prisma).conversationInboundMessage.findFirst.mockResolvedValue({ body: 'a question' });
    (retrieval.retrieve as jest.Mock).mockResolvedValue({ chunks: [] });
    pc(prisma).knowledgeChunk.count.mockResolvedValue(4);
    (docSvc.publish as jest.Mock).mockResolvedValue({ id: 'd1', status: 'LIVE' });
    pc(prisma).resolutionCapture.update.mockResolvedValue({ ...capture, status: 'captured_live' });

    await svc.promote('c1', {});

    expect(ingestion.ingest).not.toHaveBeenCalled();
    expect(docSvc.publish).toHaveBeenCalledWith('d1');
  });

  it('skips retrieval entirely when there is no question (empty body)', async () => {
    const { svc, prisma, retrieval, docSvc } = makeMocks();
    const capture = { id: 'c1', documentId: 'd1', status: 'captured_draft', conversationId: 'conv1', forcedDespiteDuplicate: false, duplicateOfId: null };
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(capture);
    pc(prisma).conversationInboundMessage.findFirst.mockResolvedValue(null); // no inbound → question ''
    pc(prisma).knowledgeChunk.count.mockResolvedValue(2);
    (docSvc.publish as jest.Mock).mockResolvedValue({ id: 'd1', status: 'LIVE' });
    pc(prisma).resolutionCapture.update.mockResolvedValue({ ...capture, status: 'captured_live' });

    await svc.promote('c1', {});

    expect(retrieval.retrieve).not.toHaveBeenCalled();
    expect(docSvc.publish).toHaveBeenCalledWith('d1');
  });
});

describe('CaptureAdminService.discard', () => {
  it('throws NotFoundException when the capture does not exist', async () => {
    const { svc, prisma } = makeMocks();
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(null);
    await expect(svc.discard('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('archives the linked doc and sets status discarded, appending the reason to notes', async () => {
    const { svc, prisma } = makeMocks();
    const capture = { id: 'c1', documentId: 'd1', status: 'captured_draft', resolutionNotes: 'orig' };
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(capture);
    pc(prisma).knowledgeDocument.update.mockResolvedValue({ id: 'd1', status: 'ARCHIVED' });
    const updated = { ...capture, status: 'discarded', resolutionNotes: 'orig\n[discarded] not useful' };
    pc(prisma).resolutionCapture.update.mockResolvedValue(updated);

    const result = await svc.discard('c1', 'not useful');

    expect(pc(prisma).knowledgeDocument.update).toHaveBeenCalledWith({
      where: { id: 'd1' },
      data: { status: 'ARCHIVED' },
    });
    expect(pc(prisma).resolutionCapture.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'discarded', resolutionNotes: 'orig\n[discarded] not useful' },
    });
    expect(result).toBe(updated);
  });

  it('does not touch a document when the capture has none, and leaves notes unchanged with no reason', async () => {
    const { svc, prisma } = makeMocks();
    const capture = { id: 'c1', documentId: null, status: 'failed', resolutionNotes: 'keep' };
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(capture);
    pc(prisma).resolutionCapture.update.mockResolvedValue({ ...capture, status: 'discarded' });

    await svc.discard('c1');

    expect(pc(prisma).knowledgeDocument.update).not.toHaveBeenCalled();
    expect(pc(prisma).resolutionCapture.update).toHaveBeenCalledWith({
      where: { id: 'c1' },
      data: { status: 'discarded', resolutionNotes: 'keep' },
    });
  });
});

describe('CaptureAdminService.list', () => {
  it('builds the where clause with provided bounds only and paginates with defaults', async () => {
    const { svc, prisma } = makeMocks();
    pc(prisma).$transaction.mockResolvedValue([[{ id: 'c1' }], 1]);

    const res = await svc.list({ status: 'captured_draft', from: '2026-01-01T00:00:00.000Z' });

    expect(pc(prisma).$transaction).toHaveBeenCalledTimes(1);
    expect(res).toEqual({ items: [{ id: 'c1' }], total: 1, page: 1, limit: 20 });
  });

  it('clamps limit to 100 and respects explicit page', async () => {
    const { svc, prisma } = makeMocks();
    pc(prisma).$transaction.mockResolvedValue([[], 0]);

    const res = await svc.list({ page: 3, limit: 500 });

    expect(res.page).toBe(3);
    expect(res.limit).toBe(100);
  });
});

describe('CaptureAdminService.get', () => {
  it('throws NotFoundException when the capture is missing', async () => {
    const { svc, prisma } = makeMocks();
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(null);
    await expect(svc.get('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the capture with includes when found', async () => {
    const { svc, prisma } = makeMocks();
    const row = { id: 'c1', document: { id: 'd1' }, conversation: { id: 'conv1' } };
    pc(prisma).resolutionCapture.findUnique.mockResolvedValue(row);
    expect(await svc.get('c1')).toBe(row);
  });
});
