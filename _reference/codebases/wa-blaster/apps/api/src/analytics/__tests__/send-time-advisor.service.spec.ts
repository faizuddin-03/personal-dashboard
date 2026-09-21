import { SendTimeAdvisorService } from '../send-time-advisor.service';

const HOUR20_MON = '2026-06-08T12:00:00Z'; // 20:00 KL Monday

function makeConfig(overrides: Record<string, string> = {}) {
  const merged: Record<string, string> = {
    SEND_TIME_MIN_EVENTS: '30',
    SEND_TIME_LOOKBACK_DAYS: '90',
    ...overrides,
  };
  return { get: (k: string) => merged[k] } as any;
}

function makePrisma(opts: {
  blast: any;
  sent?: number; read?: number; replied?: number;
  events?: { readAt: Date | null; repliedAt: Date | null }[];
}) {
  return {
    blast: { findUnique: jest.fn().mockResolvedValue(opts.blast) },
    message: {
      count: jest.fn(({ where }: any) => {
        if (where.readAt) return Promise.resolve(opts.read ?? 0);
        if (where.repliedAt) return Promise.resolve(opts.replied ?? 0);
        return Promise.resolve(opts.sent ?? 0);
      }),
      findMany: jest.fn().mockResolvedValue(opts.events ?? []),
    },
  } as any;
}

const baseBlast = {
  id: 'b1',
  name: 'Roadtax June',
  recipientSnapshot: ['c1', 'c2'],
  startedAt: new Date(HOUR20_MON),
  scheduledAt: new Date(HOUR20_MON),
};

describe('SendTimeAdvisorService', () => {
  const now = new Date('2026-06-15T00:00:00Z');

  it('throws when the blast is missing', async () => {
    const prisma = makePrisma({ blast: null });
    const llm = { generateSendTimeAdvice: jest.fn() } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    await expect(svc.getAdvice('missing', now)).rejects.toThrow();
  });

  it('cold-starts without calling the LLM when there is too little history', async () => {
    const events = Array.from({ length: 5 }, () => ({ readAt: new Date(HOUR20_MON), repliedAt: null }));
    const prisma = makePrisma({ blast: baseBlast, sent: 100, read: 5, replied: 0, events });
    const llm = { generateSendTimeAdvice: jest.fn() } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    const r = await svc.getAdvice('b1', now);
    expect(r.confidence).toBe('INSUFFICIENT');
    expect(r.recommendation).toBeNull();
    expect(r.advice.headline).toBe('Not enough history yet');
    expect(llm.generateSendTimeAdvice).not.toHaveBeenCalled();
  });

  it('keeps the stats-derived recommendation even if the LLM names a different time', async () => {
    const events = Array.from({ length: 40 }, () => ({ readAt: new Date(HOUR20_MON), repliedAt: null }));
    const prisma = makePrisma({ blast: baseBlast, sent: 200, read: 68, replied: 12, events });
    const llm = {
      generateSendTimeAdvice: jest.fn().mockResolvedValue({ headline: 'x', body: 'Send at 3 AM.' }),
    } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    const r = await svc.getAdvice('b1', now);
    expect(r.recommendation).toEqual({ hourStart: 19, hourEnd: 21, days: [1, 2, 3, 4, 5], share: 100 });
    expect(r.thisRun.readRate).toBe(34); // 68/200
    expect(llm.generateSendTimeAdvice).toHaveBeenCalledTimes(1);
    // The LLM body is passed through; the authoritative recommendation is independent.
    expect(r.advice.body).toBe('Send at 3 AM.');
  });

  it('caches the result within the TTL (no second DB load)', async () => {
    const events = Array.from({ length: 40 }, () => ({ readAt: new Date(HOUR20_MON), repliedAt: null }));
    const prisma = makePrisma({ blast: baseBlast, sent: 200, read: 68, replied: 12, events });
    const llm = { generateSendTimeAdvice: jest.fn().mockResolvedValue({ headline: 'h', body: 'b' }) } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    await svc.getAdvice('b1', now);
    await svc.getAdvice('b1', now);
    expect(prisma.blast.findUnique).toHaveBeenCalledTimes(1);
  });
});
