import { Injectable, NotFoundException } from '@nestjs/common';
import { KnowledgeDoc, KnowledgeSource, KnowledgeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { scoreDoc } from './knowledge.retrieval';

const DEFAULT_RETRIEVE_LIMIT = 3;

interface ListFilter {
  q?: string;
  category?: string;
  source?: KnowledgeSource;
  status?: KnowledgeStatus;
}

interface CreateInput {
  slug: string;
  question: string;
  answer: string;
  category: string;
  source?: KnowledgeSource;
  status?: KnowledgeStatus;
  ticketId?: string | null;
}

interface UpdateInput {
  slug?: string;
  question?: string;
  answer?: string;
  category?: string;
}

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ListFilter): Promise<KnowledgeDoc[]> {
    const where: Record<string, unknown> = { status: filter.status ?? 'PUBLISHED' };
    if (filter.source) where.source = filter.source;
    if (filter.category) where.category = filter.category;

    const docs = await this.prisma.knowledgeDoc.findMany({ where, orderBy: { uses: 'desc' } });

    const q = filter.q?.trim();
    if (!q) return docs;
    return docs
      .map((doc) => ({ doc, score: scoreDoc(q, doc) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.doc.uses - a.doc.uses)
      .map((r) => r.doc);
  }

  candidates(): Promise<KnowledgeDoc[]> {
    return this.prisma.knowledgeDoc.findMany({
      where: { status: 'CANDIDATE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(input: CreateInput): Promise<KnowledgeDoc> {
    return this.prisma.knowledgeDoc.create({
      data: {
        slug: input.slug,
        question: input.question,
        answer: input.answer,
        category: input.category,
        source: input.source ?? 'SYNCED',
        status: input.status ?? 'PUBLISHED',
        ticketId: input.ticketId ?? null,
      },
    });
  }

  async update(id: string, input: UpdateInput): Promise<KnowledgeDoc> {
    await this.getOrThrow(id);
    return this.prisma.knowledgeDoc.update({
      where: { id },
      data: {
        slug: input.slug,
        question: input.question,
        answer: input.answer,
        category: input.category,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.knowledgeDoc.delete({ where: { id } });
  }

  async setStatus(id: string, status: KnowledgeStatus): Promise<KnowledgeDoc> {
    await this.getOrThrow(id);
    return this.prisma.knowledgeDoc.update({ where: { id }, data: { status } });
  }

  async reindex(id: string): Promise<KnowledgeDoc> {
    // No-op placeholder for keyword retrieval; seam for a future embedding refresh.
    return this.getOrThrow(id);
  }

  /**
   * Rank PUBLISHED docs against a query (and optional intent). Consumed by the
   * Phase 2 Autopilot bot to ground replies. Highest-scoring first.
   */
  async retrieve(
    query: string,
    opts: { intent?: string; limit?: number } = {},
  ): Promise<{ doc: KnowledgeDoc; score: number }[]> {
    const limit = opts.limit ?? DEFAULT_RETRIEVE_LIMIT;
    const effectiveQuery = opts.intent ? `${query} ${opts.intent}` : query;
    const docs = await this.prisma.knowledgeDoc.findMany({ where: { status: 'PUBLISHED' } });
    return docs
      .map((doc) => ({ doc, score: scoreDoc(effectiveQuery, doc) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.doc.uses - a.doc.uses)
      .slice(0, limit);
  }

  private async getOrThrow(id: string): Promise<KnowledgeDoc> {
    const doc = await this.prisma.knowledgeDoc.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Knowledge doc not found');
    return doc;
  }
}
