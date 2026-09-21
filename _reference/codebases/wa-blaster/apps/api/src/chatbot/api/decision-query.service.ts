import { Injectable } from '@nestjs/common';
import { ChatbotDecisionKind, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ListDecisionsDto } from '../dto/decisions.dto';

const DAY_MS = 86_400_000;
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/** Per-kind counts in a stats window; every kind is always present (defaulted to 0). */
export interface DecisionKindCounts {
  AUTO_SEND: number;
  ESCALATE: number;
  IGNORE: number;
}

export interface DecisionStats {
  days: number;
  total: number;
  byKind: DecisionKindCounts;
  autoSendRate: number;
  escalationRate: number;
  avgTotalLatencyMs: number;
  avgRetrievalLatencyMs: number;
  guardrailFailureCount: number;
  dailySeries: Array<{ date: string; count: number }>;
}

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Read-only audit + analytics over `chatbot_decisions`. Pure Prisma; no writes. `stats()` derives a
 * single `gte` cutoff (now - days) and reuses it across every aggregate so the numbers are internally
 * consistent, and casts the daily series counts with `::int` in SQL to keep them JS numbers (not BigInt).
 */
@Injectable()
export class DecisionQueryService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ListDecisionsDto) {
    const page = filter.page ?? 1;
    const limit = Math.min(filter.limit ?? DEFAULT_LIMIT, MAX_LIMIT);

    const where: Prisma.ChatbotDecisionWhereInput = {};
    if (filter.kind) where.kind = filter.kind;
    if (filter.conversationId) where.conversationId = filter.conversationId;
    if (filter.from || filter.to) {
      const createdAt: Prisma.DateTimeFilter = {};
      if (filter.from) createdAt.gte = new Date(filter.from);
      if (filter.to) createdAt.lte = new Date(filter.to);
      where.createdAt = createdAt;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.chatbotDecision.findMany({
        where,
        include: { conversation: { include: { contact: { select: { name: true } } } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chatbotDecision.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async stats(days = 7): Promise<DecisionStats> {
    const gte = new Date(Date.now() - days * DAY_MS);

    const [grouped, total, agg, guardrailFailureCount, rawSeries] = await Promise.all([
      this.prisma.chatbotDecision.groupBy({
        by: ['kind'],
        _count: { _all: true },
        where: { createdAt: { gte } },
      }),
      this.prisma.chatbotDecision.count({ where: { createdAt: { gte } } }),
      this.prisma.chatbotDecision.aggregate({
        _avg: { totalLatencyMs: true, retrievalLatencyMs: true },
        where: { createdAt: { gte } },
      }),
      this.prisma.chatbotDecision.count({
        where: { createdAt: { gte }, guardrailFailures: { isEmpty: false } },
      }),
      this.prisma.$queryRaw<Array<{ date: string; count: number }>>(Prisma.sql`
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
               COUNT(*)::int AS count
        FROM chatbot_decisions
        WHERE created_at >= ${gte}
        GROUP BY 1
        ORDER BY 1
      `),
    ]);

    const byKind: DecisionKindCounts = {
      [ChatbotDecisionKind.AUTO_SEND]: 0,
      [ChatbotDecisionKind.ESCALATE]: 0,
      [ChatbotDecisionKind.IGNORE]: 0,
    };
    for (const g of grouped) byKind[g.kind] = g._count._all;

    const autoSendRate = total === 0 ? 0 : round3(byKind.AUTO_SEND / total);
    const escalationRate = total === 0 ? 0 : round3(byKind.ESCALATE / total);

    return {
      days,
      total,
      byKind,
      autoSendRate,
      escalationRate,
      avgTotalLatencyMs: Math.round(agg._avg.totalLatencyMs ?? 0),
      avgRetrievalLatencyMs: Math.round(agg._avg.retrievalLatencyMs ?? 0),
      guardrailFailureCount,
      dailySeries: rawSeries,
    };
  }
}
