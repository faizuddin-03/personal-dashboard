import { Injectable, NotFoundException } from '@nestjs/common';
import { CannedReply } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateInput { title: string; body: string; category?: string | null }
interface UpdateInput { title?: string; body?: string; category?: string | null }

@Injectable()
export class CannedRepliesService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<CannedReply[]> {
    return this.prisma.cannedReply.findMany({ orderBy: { title: 'asc' } });
  }

  create(input: CreateInput, userId: string): Promise<CannedReply> {
    return this.prisma.cannedReply.create({
      data: {
        title: input.title,
        body: input.body,
        category: input.category ?? null,
        createdById: userId,
      },
    });
  }

  async update(id: string, input: UpdateInput): Promise<CannedReply> {
    await this.getOrThrow(id);
    return this.prisma.cannedReply.update({
      where: { id },
      data: { title: input.title, body: input.body, category: input.category },
    });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.cannedReply.delete({ where: { id } });
  }

  private async getOrThrow(id: string): Promise<CannedReply> {
    const row = await this.prisma.cannedReply.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Canned reply not found');
    return row;
  }
}
