import { NotFoundException } from '@nestjs/common';
import { KnowledgeService } from '../knowledge.service';

function makePrisma() {
  return {
    knowledgeDoc: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('KnowledgeService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: KnowledgeService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new KnowledgeService(prisma as any);
  });

  it('list() defaults to PUBLISHED and applies source/category filters', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([]);
    await service.list({ source: 'SYNCED', category: 'Transfer' });
    expect(prisma.knowledgeDoc.findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', source: 'SYNCED', category: 'Transfer' },
      orderBy: { uses: 'desc' },
    });
  });

  it('list() with q re-ranks by relevance and drops non-matches', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([
      { id: '1', question: 'insurance renewal', answer: '', category: 'Insurance', uses: 10 },
      { id: '2', question: 'ownership transfer', answer: '', category: 'Transfer', uses: 5 },
    ]);
    const result = await service.list({ q: 'transfer' });
    expect(result.map((d: any) => d.id)).toEqual(['2']);
  });

  it('candidates() returns CANDIDATE docs newest-first', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([]);
    await service.candidates();
    expect(prisma.knowledgeDoc.findMany).toHaveBeenCalledWith({
      where: { status: 'CANDIDATE' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create() defaults source SYNCED + status PUBLISHED', async () => {
    prisma.knowledgeDoc.create.mockResolvedValue({ id: 'x' });
    await service.create({ slug: 'a.md', question: 'q', answer: 'a', category: 'General' });
    expect(prisma.knowledgeDoc.create).toHaveBeenCalledWith({
      data: { slug: 'a.md', question: 'q', answer: 'a', category: 'General', source: 'SYNCED', status: 'PUBLISHED', ticketId: null },
    });
  });

  it('create() persists source/status/ticketId when provided', async () => {
    prisma.knowledgeDoc.create.mockResolvedValue({ id: 'x' });
    await service.create({ slug: 'a.md', question: 'q', answer: 'a', category: 'Transfer', source: 'FROM_ESCALATION', status: 'CANDIDATE', ticketId: 't1' });
    expect(prisma.knowledgeDoc.create).toHaveBeenCalledWith({
      data: { slug: 'a.md', question: 'q', answer: 'a', category: 'Transfer', source: 'FROM_ESCALATION', status: 'CANDIDATE', ticketId: 't1' },
    });
  });

  it('update() throws NotFound when the doc is missing', async () => {
    prisma.knowledgeDoc.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { answer: 'b' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('setStatus() updates the status field', async () => {
    prisma.knowledgeDoc.findUnique.mockResolvedValue({ id: '1' });
    prisma.knowledgeDoc.update.mockResolvedValue({ id: '1', status: 'PUBLISHED' });
    await service.setStatus('1', 'PUBLISHED');
    expect(prisma.knowledgeDoc.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { status: 'PUBLISHED' } });
  });

  it('retrieve() returns published docs ranked by score then uses, limited', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([
      { id: 'a', question: 'ownership transfer tukar milik', answer: '', category: 'Transfer', uses: 1 },
      { id: 'b', question: 'transfer', answer: '', category: 'General', uses: 99 },
      { id: 'c', question: 'insurance', answer: '', category: 'Insurance', uses: 50 },
    ]);
    const result = await service.retrieve('how do I transfer ownership', { limit: 2 });
    expect(prisma.knowledgeDoc.findMany).toHaveBeenCalledWith({ where: { status: 'PUBLISHED' } });
    expect(result.map((r) => r.doc.id)).toEqual(['a', 'b']);
    expect(result[0].score).toBe(6);
  });

  it('update() partial — only provided fields are sent to Prisma', async () => {
    prisma.knowledgeDoc.findUnique.mockResolvedValue({ id: '1' });
    prisma.knowledgeDoc.update.mockResolvedValue({ id: '1' });
    await service.update('1', { answer: 'new answer' });
    expect(prisma.knowledgeDoc.update).toHaveBeenCalledWith({
      where: { id: '1' },
      data: { slug: undefined, question: undefined, answer: 'new answer', category: undefined },
    });
  });

  it('remove() throws NotFound when the doc is missing', async () => {
    prisma.knowledgeDoc.findUnique.mockResolvedValue(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('retrieve() folds intent into the query', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([
      { id: 'x', question: 'roadtax renewal', answer: '', category: 'Roadtax', uses: 0 },
    ]);
    const result = await service.retrieve('when does my insurance expire', { intent: 'roadtax' });
    expect(result.length).toBe(1);
    expect(result[0].doc.id).toBe('x');
  });
});
