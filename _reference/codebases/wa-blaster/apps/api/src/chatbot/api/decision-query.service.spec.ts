import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { DecisionQueryService } from './decision-query.service';

/**
 * UNIT tests. `stats()` shaping/rate math is deterministic against a fully mocked PrismaService so
 * it can't be perturbed by rows other suites write to the shared `chatbot_decisions` table.
 * `list()` likewise mocks `$transaction` + `findMany`/`count` so we assert the exact where/include
 * we build rather than fighting concurrency.
 */
function makePrisma() {
  const chatbotDecision = {
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  };
  const $queryRaw = jest.fn();
  const $transaction = jest.fn(async (ops: Promise<unknown>[]) => Promise.all(ops));
  const prisma = { chatbotDecision, $queryRaw, $transaction } as unknown as PrismaService;
  return { prisma, chatbotDecision, $queryRaw, $transaction };
}

describe('DecisionQueryService', () => {
  describe('list', () => {
    it('applies defaults (page 1, limit 50), orders desc, includes contact name, returns paged shape', async () => {
      const { prisma, chatbotDecision, $transaction } = makePrisma();
      const rows = [{ id: 'd1' }, { id: 'd2' }];
      chatbotDecision.findMany.mockResolvedValue(rows);
      chatbotDecision.count.mockResolvedValue(2);
      const svc = new DecisionQueryService(prisma);

      const res = await svc.list({});

      expect(res).toEqual({ items: rows, total: 2, page: 1, limit: 50 });
      expect($transaction).toHaveBeenCalledTimes(1);
      const findArgs = chatbotDecision.findMany.mock.calls[0][0];
      expect(findArgs.where).toEqual({});
      expect(findArgs.orderBy).toEqual({ createdAt: 'desc' });
      expect(findArgs.skip).toBe(0);
      expect(findArgs.take).toBe(50);
      expect(findArgs.include).toEqual({
        conversation: { include: { contact: { select: { name: true } } } },
      });
      // count uses the same where
      expect(chatbotDecision.count.mock.calls[0][0]).toEqual({ where: {} });
    });

    it('builds where from kind, conversationId and only the provided date bounds', async () => {
      const { prisma, chatbotDecision } = makePrisma();
      chatbotDecision.findMany.mockResolvedValue([]);
      chatbotDecision.count.mockResolvedValue(0);
      const svc = new DecisionQueryService(prisma);

      await svc.list({
        kind: 'ESCALATE' as never,
        conversationId: 'conv-1',
        from: '2026-01-01T00:00:00.000Z',
        to: '2026-02-01T00:00:00.000Z',
      });

      const where = chatbotDecision.findMany.mock.calls[0][0].where;
      expect(where.kind).toBe('ESCALATE');
      expect(where.conversationId).toBe('conv-1');
      expect(where.createdAt).toEqual({
        gte: new Date('2026-01-01T00:00:00.000Z'),
        lte: new Date('2026-02-01T00:00:00.000Z'),
      });
    });

    it('omits createdAt entirely when no bounds, and includes only the bound provided', async () => {
      const { prisma, chatbotDecision } = makePrisma();
      chatbotDecision.findMany.mockResolvedValue([]);
      chatbotDecision.count.mockResolvedValue(0);
      const svc = new DecisionQueryService(prisma);

      await svc.list({ from: '2026-03-01T00:00:00.000Z' });
      const where = chatbotDecision.findMany.mock.calls[0][0].where;
      expect(where.createdAt).toEqual({ gte: new Date('2026-03-01T00:00:00.000Z') });
      expect('lte' in where.createdAt).toBe(false);
    });

    it('honours page/limit and clamps limit to 200', async () => {
      const { prisma, chatbotDecision } = makePrisma();
      chatbotDecision.findMany.mockResolvedValue([]);
      chatbotDecision.count.mockResolvedValue(0);
      const svc = new DecisionQueryService(prisma);

      const res = await svc.list({ page: 3, limit: 500 });

      const findArgs = chatbotDecision.findMany.mock.calls[0][0];
      expect(findArgs.take).toBe(200);
      expect(findArgs.skip).toBe(400); // (3 - 1) * 200
      expect(res.page).toBe(3);
      expect(res.limit).toBe(200);
    });
  });

  describe('stats', () => {
    function wireStats(
      { prisma, chatbotDecision, $queryRaw }: ReturnType<typeof makePrisma>,
      opts: {
        groupBy: Array<{ kind: string; _count: { _all: number } }>;
        total: number;
        avgTotal: number | null;
        avgRetrieval: number | null;
        guardrail: number;
        series: Array<{ date: string; count: number }>;
      },
    ) {
      chatbotDecision.groupBy.mockResolvedValue(opts.groupBy);
      chatbotDecision.aggregate.mockResolvedValue({
        _avg: { totalLatencyMs: opts.avgTotal, retrievalLatencyMs: opts.avgRetrieval },
      });
      // total count + guardrail count share the same mock; resolve by call order.
      chatbotDecision.count
        .mockResolvedValueOnce(opts.total)
        .mockResolvedValueOnce(opts.guardrail);
      $queryRaw.mockResolvedValue(opts.series);
    }

    it('computes rates, rounded averages, guardrail count and series for the default 7-day window', async () => {
      const ctx = makePrisma();
      const series = [
        { date: '2026-06-08', count: 4 },
        { date: '2026-06-09', count: 6 },
      ];
      wireStats(ctx, {
        groupBy: [
          { kind: 'AUTO_SEND', _count: { _all: 8 } },
          { kind: 'ESCALATE', _count: { _all: 2 } },
        ],
        total: 10,
        avgTotal: 123.4,
        avgRetrieval: 45.6,
        guardrail: 3,
        series,
      });
      const svc = new DecisionQueryService(ctx.prisma);

      const res = await svc.stats(7);

      expect(res).toEqual({
        days: 7,
        total: 10,
        byKind: { AUTO_SEND: 8, ESCALATE: 2, IGNORE: 0 },
        autoSendRate: 0.8,
        escalationRate: 0.2,
        avgTotalLatencyMs: 123,
        avgRetrievalLatencyMs: 46,
        guardrailFailureCount: 3,
        dailySeries: series,
      });
    });

    it('rounds rates to 3 decimals', async () => {
      const ctx = makePrisma();
      wireStats(ctx, {
        groupBy: [
          { kind: 'AUTO_SEND', _count: { _all: 1 } },
          { kind: 'ESCALATE', _count: { _all: 2 } },
        ],
        total: 3,
        avgTotal: 10,
        avgRetrieval: 0,
        guardrail: 0,
        series: [],
      });
      const svc = new DecisionQueryService(ctx.prisma);

      const res = await svc.stats(7);

      expect(res.autoSendRate).toBe(0.333);
      expect(res.escalationRate).toBe(0.667);
    });

    it('returns zeroed rates and averages when the window is empty', async () => {
      const ctx = makePrisma();
      wireStats(ctx, {
        groupBy: [],
        total: 0,
        avgTotal: null,
        avgRetrieval: null,
        guardrail: 0,
        series: [],
      });
      const svc = new DecisionQueryService(ctx.prisma);

      const res = await svc.stats(7);

      expect(res.total).toBe(0);
      expect(res.byKind).toEqual({ AUTO_SEND: 0, ESCALATE: 0, IGNORE: 0 });
      expect(res.autoSendRate).toBe(0);
      expect(res.escalationRate).toBe(0);
      expect(res.avgTotalLatencyMs).toBe(0);
      expect(res.avgRetrievalLatencyMs).toBe(0);
      expect(res.guardrailFailureCount).toBe(0);
      expect(res.dailySeries).toEqual([]);
    });

    it('passes a single gte cutoff (now - days) to every query and only counts non-empty guardrails', async () => {
      const ctx = makePrisma();
      wireStats(ctx, {
        groupBy: [{ kind: 'IGNORE', _count: { _all: 5 } }],
        total: 5,
        avgTotal: 1,
        avgRetrieval: 1,
        guardrail: 1,
        series: [],
      });
      const before = Date.now();
      const svc = new DecisionQueryService(ctx.prisma);

      await svc.stats(2);

      const after = Date.now();
      const expectedFloor = before - 2 * 86_400_000;
      const expectedCeil = after - 2 * 86_400_000;

      const gteOf = (w: { createdAt: { gte: Date } }) => w.createdAt.gte.getTime();
      const groupByWhere = ctx.chatbotDecision.groupBy.mock.calls[0][0].where;
      const aggregateWhere = ctx.chatbotDecision.aggregate.mock.calls[0][0].where;
      const totalCountWhere = ctx.chatbotDecision.count.mock.calls[0][0].where;
      const guardrailWhere = ctx.chatbotDecision.count.mock.calls[1][0].where;

      for (const w of [groupByWhere, aggregateWhere, totalCountWhere, guardrailWhere]) {
        expect(gteOf(w)).toBeGreaterThanOrEqual(expectedFloor);
        expect(gteOf(w)).toBeLessThanOrEqual(expectedCeil);
      }
      // groupBy/aggregate args shape
      expect(ctx.chatbotDecision.groupBy.mock.calls[0][0].by).toEqual(['kind']);
      expect(ctx.chatbotDecision.aggregate.mock.calls[0][0]._avg).toEqual({
        totalLatencyMs: true,
        retrievalLatencyMs: true,
      });
      // guardrail filter is the scalar-list isEmpty:false
      expect(guardrailWhere.guardrailFailures).toEqual({ isEmpty: false });
      // raw daily-series query was issued as a parameterised Prisma.sql template carrying the gte cutoff.
      expect(ctx.$queryRaw).toHaveBeenCalledTimes(1);
      const sql = ctx.$queryRaw.mock.calls[0][0] as Prisma.Sql;
      expect(Array.isArray(sql.values)).toBe(true);
      expect(sql.values).toEqual([groupByWhere.createdAt.gte]); // same Date instance bound as $1
      expect(sql.strings.join(' ')).toContain('chatbot_decisions');
    });
  });
});
