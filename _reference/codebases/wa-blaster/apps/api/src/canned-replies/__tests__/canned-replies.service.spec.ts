import { NotFoundException } from '@nestjs/common';
import { CannedRepliesService } from '../canned-replies.service';

function makePrisma() {
  return {
    cannedReply: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('CannedRepliesService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: CannedRepliesService;
  beforeEach(() => { prisma = makePrisma(); service = new CannedRepliesService(prisma as any); });

  it('list orders by title asc', async () => {
    prisma.cannedReply.findMany.mockResolvedValue([{ id: 'r1', title: 'Alpha' }]);
    const res = await service.list();
    expect(prisma.cannedReply.findMany).toHaveBeenCalledWith({ orderBy: { title: 'asc' } });
    expect(res).toEqual([{ id: 'r1', title: 'Alpha' }]);
  });

  it('create persists fields + createdById', async () => {
    prisma.cannedReply.create.mockImplementation((a: any) => Promise.resolve({ id: 'r1', ...a.data }));
    await service.create({ title: 'T', body: 'B', category: 'Transfer' }, 'u1');
    expect(prisma.cannedReply.create).toHaveBeenCalledWith({
      data: { title: 'T', body: 'B', category: 'Transfer', createdById: 'u1' },
    });
  });

  it('create defaults missing category to null', async () => {
    prisma.cannedReply.create.mockResolvedValue({ id: 'r1' });
    await service.create({ title: 'T', body: 'B' }, 'u1');
    expect(prisma.cannedReply.create.mock.calls[0][0].data.category).toBeNull();
  });

  it('update throws NotFound when missing', async () => {
    prisma.cannedReply.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { title: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update writes provided fields', async () => {
    prisma.cannedReply.findUnique.mockResolvedValue({ id: 'r1' });
    prisma.cannedReply.update.mockResolvedValue({ id: 'r1', title: 'X' });
    await service.update('r1', { title: 'X' });
    expect(prisma.cannedReply.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { title: 'X', body: undefined, category: undefined },
    });
  });

  it('remove throws NotFound when missing, else deletes', async () => {
    prisma.cannedReply.findUnique.mockResolvedValueOnce(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    prisma.cannedReply.findUnique.mockResolvedValueOnce({ id: 'r1' });
    await service.remove('r1');
    expect(prisma.cannedReply.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });
});
