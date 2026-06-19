import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface KnowledgeRecentUse {
  draftId: string;
  intent: string;
  draftConfidence: number;
  createdAt: Date;
  contactName: string | null;
}

export interface KnowledgeStats {
  /** Number of LIVE-or-DRAFT chunks (embeddings) belonging to this document. */
  embeddings: number;
  /** Citations to this doc's chunks over the last 7 days, divided by 7, rounded to 1 dp. */
  citationsPerDay: number;
  /** % of bot drafts in the last 7 days that cite at least one chunk in THIS doc (global denominator). */
  draftsGroundedPct: number;
  /** Last 10 bot drafts that cited this doc, newest first. */
  recentUses: KnowledgeRecentUse[];
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Per-document knowledge analytics for the admin UI. All metrics are derived live from Prisma
 * aggregates; only PrismaService (a global provider) is injected, so no module wiring is needed
 * beyond registering this service.
 */
@Injectable()
export class KnowledgeStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async stats(documentId: string): Promise<KnowledgeStats> {
    const document = await this.prisma.knowledgeDocument.findUnique({ where: { id: documentId } });
    if (!document) throw new NotFoundException(`Document ${documentId} not found`);

    const sevenDaysAgo = new Date(Date.now() - SEVEN_DAYS_MS);

    const [embeddings, citations7d, totalDrafts7d, groundedDrafts7d, recent] = await Promise.all([
      this.prisma.knowledgeChunk.count({ where: { documentId } }),
      this.prisma.botDraftCitation.count({
        where: { createdAt: { gte: sevenDaysAgo }, chunk: { documentId } },
      }),
      this.prisma.botDraft.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.botDraft.count({
        where: { createdAt: { gte: sevenDaysAgo }, citations: { some: { chunk: { documentId } } } },
      }),
      this.prisma.botDraft.findMany({
        where: { citations: { some: { chunk: { documentId } } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          intent: true,
          draftConfidence: true,
          createdAt: true,
          conversation: { select: { contact: { select: { name: true } } } },
        },
      }),
    ]);

    const citationsPerDay = Math.round((citations7d / 7) * 10) / 10;
    const draftsGroundedPct = totalDrafts7d > 0 ? Math.round((groundedDrafts7d / totalDrafts7d) * 100) : 0;

    const recentUses: KnowledgeRecentUse[] = recent.map((d) => ({
      draftId: d.id,
      intent: d.intent,
      draftConfidence: d.draftConfidence,
      createdAt: d.createdAt,
      contactName: d.conversation?.contact?.name ?? null,
    }));

    return { embeddings, citationsPerDay, draftsGroundedPct, recentUses };
  }
}
