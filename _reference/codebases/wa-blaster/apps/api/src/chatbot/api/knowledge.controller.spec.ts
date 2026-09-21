import { BadRequestException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { DocumentService } from '../knowledge/document.service';
import { IngestionService } from '../knowledge/ingestion.service';
import { RetrievalService } from '../knowledge/retrieval.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeStatsService } from './knowledge-stats.service';

describe('KnowledgeController', () => {
  let controller: KnowledgeController;
  let documents: {
    list: jest.Mock;
    get: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    publish: jest.Mock;
    unpublish: jest.Mock;
  };
  let ingestion: { ingest: jest.Mock };
  let retrieval: { retrieve: jest.Mock };
  let stats: { stats: jest.Mock };

  const req = { user: { id: 'user-1' } } as unknown as Request;

  beforeEach(async () => {
    documents = {
      list: jest.fn(),
      get: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      publish: jest.fn(),
      unpublish: jest.fn(),
    };
    ingestion = { ingest: jest.fn() };
    retrieval = { retrieve: jest.fn() };
    stats = { stats: jest.fn() };

    const mod = await Test.createTestingModule({
      controllers: [KnowledgeController],
      providers: [
        { provide: DocumentService, useValue: documents },
        { provide: IngestionService, useValue: ingestion },
        { provide: RetrievalService, useValue: retrieval },
        { provide: KnowledgeStatsService, useValue: stats },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = mod.get(KnowledgeController);
  });

  it('GET documents delegates to documentService.list', async () => {
    const result = { items: [], total: 0, page: 1, limit: 20 };
    documents.list.mockResolvedValue(result);
    const q = { category: 'Logistics' } as never;
    expect(await controller.list(q)).toBe(result);
    expect(documents.list).toHaveBeenCalledWith(q);
  });

  it('GET documents/:id delegates to documentService.get', async () => {
    const doc = { id: 'd1' };
    documents.get.mockResolvedValue(doc);
    expect(await controller.get('d1')).toBe(doc);
    expect(documents.get).toHaveBeenCalledWith('d1');
  });

  it('GET documents/:id/stats delegates to knowledgeStats.stats', async () => {
    const s = { embeddings: 3, citationsPerDay: 0, draftsGroundedPct: 0, recentUses: [] };
    stats.stats.mockResolvedValue(s);
    expect(await controller.stats('d1')).toBe(s);
    expect(stats.stats).toHaveBeenCalledWith('d1');
  });

  it('POST documents injects the operator id from req.user', async () => {
    const created = { id: 'd2' };
    documents.create.mockResolvedValue(created);
    const dto = { name: 'a.md', title: 'A', category: 'General', contentMd: '# A' } as never;
    expect(await controller.create(dto, req)).toBe(created);
    expect(documents.create).toHaveBeenCalledWith({ ...(dto as object), userId: 'user-1' });
  });

  it('POST documents/upload derives the title from the first H1 and defaults the category', async () => {
    const created = { id: 'd3' };
    documents.create.mockResolvedValue(created);
    const file = {
      originalname: 'faq.md',
      buffer: Buffer.from('# FAQ\n\nbody'),
      mimetype: 'text/markdown',
    } as Express.Multer.File;

    expect(await controller.upload(file, {}, req)).toBe(created);
    expect(documents.create).toHaveBeenCalledWith({
      name: 'faq.md',
      title: 'FAQ',
      category: 'General',
      contentMd: '# FAQ\n\nbody',
      userId: 'user-1',
    });
  });

  it('POST documents/upload accepts a .markdown extension', async () => {
    documents.create.mockResolvedValue({ id: 'd3b' });
    const file = {
      originalname: 'guide.markdown',
      buffer: Buffer.from('# Guide\n\nhow to'),
      mimetype: 'text/markdown',
    } as Express.Multer.File;

    await controller.upload(file, {}, req);
    expect(documents.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'guide.markdown', title: 'Guide' }),
    );
  });

  it('POST documents/upload falls back to the filename (no H1) and takes the category from the form field', async () => {
    documents.create.mockResolvedValue({ id: 'd4' });
    const file = {
      originalname: 'shipping.md',
      buffer: Buffer.from('no heading here'),
      mimetype: 'application/octet-stream',
    } as Express.Multer.File;

    await controller.upload(file, { category: 'Logistics' }, req);
    expect(documents.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'shipping.md', title: 'shipping', category: 'Logistics' }),
    );
  });

  it('POST documents/upload rejects a file >= 1MB', () => {
    const file = {
      originalname: 'big.md',
      buffer: Buffer.alloc(1024 * 1024),
      mimetype: 'text/markdown',
    } as Express.Multer.File;
    expect(() => controller.upload(file, {}, req)).toThrow(BadRequestException);
    expect(documents.create).not.toHaveBeenCalled();
  });

  it('POST documents/upload rejects content that is not valid UTF-8', () => {
    const file = {
      originalname: 'bad.md',
      buffer: Buffer.from([0xff, 0xfe, 0xff]),
      mimetype: 'text/markdown',
    } as Express.Multer.File;
    expect(() => controller.upload(file, {}, req)).toThrow(BadRequestException);
    expect(documents.create).not.toHaveBeenCalled();
  });

  it('POST documents/upload rejects a non-.md/.markdown file', () => {
    const file = {
      originalname: 'data.csv',
      buffer: Buffer.from('a,b'),
      mimetype: 'text/csv',
    } as Express.Multer.File;
    expect(() => controller.upload(file, {}, req)).toThrow(BadRequestException);
    expect(documents.create).not.toHaveBeenCalled();
  });

  it('POST documents/upload rejects when no file is uploaded', () => {
    expect(() => controller.upload(undefined as unknown as Express.Multer.File, {}, req)).toThrow(
      BadRequestException,
    );
    expect(documents.create).not.toHaveBeenCalled();
  });

  it('PATCH documents/:id delegates to documentService.update with merged id', async () => {
    const result = { document: { id: 'd1' }, contentChanged: false, reingested: false };
    documents.update.mockResolvedValue(result);
    const dto = { title: 'New' } as never;
    expect(await controller.update('d1', dto)).toBe(result);
    expect(documents.update).toHaveBeenCalledWith({ id: 'd1', title: 'New' });
  });

  it('DELETE documents/:id delegates to documentService.delete', async () => {
    documents.delete.mockResolvedValue(undefined);
    await controller.remove('d1');
    expect(documents.delete).toHaveBeenCalledWith('d1');
  });

  it('POST documents/:id/publish delegates to documentService.publish', async () => {
    const doc = { id: 'd1', status: 'LIVE' };
    documents.publish.mockResolvedValue(doc);
    expect(await controller.publish('d1')).toBe(doc);
    expect(documents.publish).toHaveBeenCalledWith('d1');
  });

  it('POST documents/:id/unpublish delegates to documentService.unpublish', async () => {
    const doc = { id: 'd1', status: 'DRAFT' };
    documents.unpublish.mockResolvedValue(doc);
    expect(await controller.unpublish('d1')).toBe(doc);
    expect(documents.unpublish).toHaveBeenCalledWith('d1');
  });

  it('POST documents/:id/reembed delegates to ingestionService.ingest', async () => {
    const r = { chunksCreated: 2, embeddingModel: 'mock', latencyMs: 1 };
    ingestion.ingest.mockResolvedValue(r);
    expect(await controller.reembed('d1')).toBe(r);
    expect(ingestion.ingest).toHaveBeenCalledWith('d1');
  });

  it('POST search delegates query + options to retrievalService.retrieve', async () => {
    const r = { chunks: [], embeddingLatencyMs: 1, searchLatencyMs: 1, totalLatencyMs: 2, queryEmbeddingModel: 'mock' };
    retrieval.retrieve.mockResolvedValue(r);
    const dto = { query: 'ship to penang', topK: 3, minScore: 0.6, category: 'Logistics' } as never;
    expect(await controller.search(dto)).toBe(r);
    expect(retrieval.retrieve).toHaveBeenCalledWith('ship to penang', {
      topK: 3,
      minScore: 0.6,
      category: 'Logistics',
    });
  });
});
