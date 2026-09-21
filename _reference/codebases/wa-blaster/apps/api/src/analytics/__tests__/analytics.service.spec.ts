import { AnalyticsService } from '../analytics.service';

function makePrisma() {
  return {
    contact: { groupBy: jest.fn(), findMany: jest.fn() },
    message: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    template: { findMany: jest.fn() },
    autopilotEvent: { findMany: jest.fn() },
    ticket: { findMany: jest.fn(), count: jest.fn() },
    systemSetting: { findUnique: jest.fn() },
  };
}

describe('AnalyticsService.audience', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => {
    prisma = makePrisma();
    service = new AnalyticsService(prisma as any);
  });

  it('groups contacts by state and vehicle, sorted desc', async () => {
    prisma.contact.groupBy
      .mockResolvedValueOnce([
        { state: 'JOHOR', _count: { _all: 3 } },
        { state: 'SELANGOR', _count: { _all: 5 } },
      ])
      .mockResolvedValueOnce([
        { vehicleSpecialization: 'EV_HYBRID', _count: { _all: 1 } },
        { vehicleSpecialization: 'NATIONAL', _count: { _all: 4 } },
      ]);
    const res = await service.audience();
    expect(res.byState).toEqual([
      { state: 'SELANGOR', count: 5 },
      { state: 'JOHOR', count: 3 },
    ]);
    expect(res.byVehicle).toEqual([
      { vehicle: 'NATIONAL', count: 4 },
      { vehicle: 'EV_HYBRID', count: 1 },
    ]);
    expect(prisma.contact.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ['state'], where: { state: { not: null } } }),
    );
    expect(prisma.contact.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['vehicleSpecialization'],
        where: { vehicleSpecialization: { not: null } },
      }),
    );
  });
});

describe('AnalyticsService.delivery', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('builds the funnel from status counts and computes by-state rate + top templates', async () => {
    // count() called 4x: sent, delivered, read, replied
    prisma.message.count
      .mockResolvedValueOnce(100) // sent
      .mockResolvedValueOnce(96)  // delivered
      .mockResolvedValueOnce(70)  // read
      .mockResolvedValueOnce(26); // replied
    // findMany of messages (for by-audience)
    prisma.message.findMany.mockResolvedValue([
      { contactId: 'a', deliveredAt: new Date() },
      { contactId: 'a', deliveredAt: null },
      { contactId: 'b', deliveredAt: new Date() },
    ]);
    prisma.contact.findMany.mockResolvedValue([
      { id: 'a', state: 'SELANGOR', vehicleSpecialization: 'NATIONAL' },
      { id: 'b', state: 'JOHOR', vehicleSpecialization: 'EV_HYBRID' },
    ]);
    // groupBy by templateId: sent, then replied
    prisma.message.groupBy
      .mockResolvedValueOnce([{ templateId: 't1', _count: { _all: 10 } }, { templateId: 't2', _count: { _all: 10 } }])
      .mockResolvedValueOnce([{ templateId: 't1', _count: { _all: 4 } }, { templateId: 't2', _count: { _all: 2 } }]);
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', name: 'alpha', language: 'EN' },
      { id: 't2', name: 'beta', language: 'MS' },
    ]);

    const res = await service.delivery('30d');
    expect(res.funnel).toEqual({ sent: 100, delivered: 96, read: 70, replied: 26 });
    expect(res.byState[0]).toEqual({ state: 'JOHOR', rate: 100 });
    expect(res.byState[1]).toEqual({ state: 'SELANGOR', rate: 50 });
    expect(res.topTemplates[0]).toEqual({ templateId: 't1', name: 'alpha', language: 'EN', sent: 10, replied: 4, replyRate: 40 });
    expect(res.topTemplates[1].replyRate).toBe(20);
  });
});

describe('AnalyticsService.volume', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('buckets messages by KL send-day, zero-filling the window', async () => {
    const now = new Date('2026-06-07T10:00:00Z'); // KL 2026-06-07
    prisma.message.findMany.mockResolvedValue([
      { sentAt: new Date('2026-06-07T03:00:00Z'), deliveredAt: new Date(), repliedAt: new Date() }, // 2026-06-07
      { sentAt: new Date('2026-06-06T05:00:00Z'), deliveredAt: new Date(), repliedAt: null },        // 2026-06-06
      { sentAt: new Date('2026-06-06T06:00:00Z'), deliveredAt: null, repliedAt: null },              // 2026-06-06
    ]);
    const res = await service.volume('7d', now);
    expect(res.byDay).toHaveLength(7);
    const last = res.byDay[res.byDay.length - 1];
    expect(last).toEqual({ date: '2026-06-07', sent: 1, delivered: 1, replied: 1 });
    const prev = res.byDay[res.byDay.length - 2];
    expect(prev).toEqual({ date: '2026-06-06', sent: 2, delivered: 1, replied: 0 });
    expect(res.byDay[0]).toEqual(expect.objectContaining({ sent: 0, delivered: 0, replied: 0 }));
  });
});

describe('AnalyticsService.autopilot', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('computes auto-handle rate, handling breakdown, and top intents', async () => {
    const now = new Date('2026-06-07T10:00:00Z');
    prisma.autopilotEvent.findMany.mockResolvedValue([
      { action: 'AUTO_REPLIED', intent: 'transfer_support', createdAt: new Date('2026-06-07T03:00:00Z') },
      { action: 'AUTO_REPLIED', intent: 'transfer_support', createdAt: new Date('2026-06-07T04:00:00Z') },
      { action: 'ESCALATED', intent: 'credit_topup', createdAt: new Date('2026-06-07T05:00:00Z') },
      { action: 'OPTED_OUT', intent: null, createdAt: new Date('2026-06-06T05:00:00Z') },
    ]);
    prisma.ticket.count.mockResolvedValue(7); // resolvedByTeam
    const res = await service.autopilot('30d', now);
    expect(res.autoHandleRate).toBe(50); // 2 auto of 4
    expect(res.handling).toEqual({ autoReplied: 2, escalated: 1, resolvedByTeam: 7 });
    expect(res.topIntents[0]).toEqual({ intent: 'transfer_support', count: 2 });
    const today = res.trend[res.trend.length - 1];
    expect(today).toEqual({ date: '2026-06-07', rate: 66.7 }); // 2 auto of 3 that day
  });
});

describe('AnalyticsService.escalation', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('computes resolution rate, by-reason, avg close, and response-time by day', async () => {
    const now = new Date('2026-06-07T10:00:00Z');
    const openedToday = new Date('2026-06-07T01:00:00Z'); // KL 2026-06-07 09:00
    // current-window tickets (findMany #1)
    prisma.ticket.findMany
      .mockResolvedValueOnce([
        { status: 'CLOSED', reason: 'KNOWLEDGE_GAP', openedAt: openedToday,
          assignedAt: new Date(openedToday.getTime() + 10 * 60000), resolvedAt: new Date(openedToday.getTime() + 60 * 60000), closedAt: new Date(openedToday.getTime() + 60 * 60000) },
        { status: 'OPEN', reason: 'COMPLAINT', openedAt: openedToday, assignedAt: null, resolvedAt: null, closedAt: null },
      ])
      // previous-window tickets (findMany #2)
      .mockResolvedValueOnce([{ status: 'CLOSED' }, { status: 'OPEN' }]);
    const res = await service.escalation('30d', now);
    expect(res.opened).toBe(2);
    expect(res.closed).toBe(1);
    expect(res.openRemaining).toBe(1);
    expect(res.rate).toBe(50);          // 1 closed of 2
    expect(res.deltaPct).toBe(0);       // prev rate also 50
    expect(res.avgCloseMs).toBe(60 * 60 * 1000);
    expect(res.byReason).toEqual([{ reason: 'KNOWLEDGE_GAP', count: 1 }]);
    const todayResp = res.responseTimeByDay[res.responseTimeByDay.length - 1];
    expect(todayResp).toEqual({ date: '2026-06-07', avgMinutes: 10 });
  });
});

describe('AnalyticsService.kpis', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('computes range totals, deltas, today figures, sparklines, and est. cost', async () => {
    const now = new Date('2026-06-07T10:00:00Z');
    // count() order: cur sent/delivered/read/replied, then prev sent/delivered/read/replied
    prisma.message.count
      .mockResolvedValueOnce(100).mockResolvedValueOnce(96).mockResolvedValueOnce(70).mockResolvedValueOnce(26)
      .mockResolvedValueOnce(80).mockResolvedValueOnce(76).mockResolvedValueOnce(55).mockResolvedValueOnce(18);
    // autopilotEvent.findMany: cur then prev
    prisma.autopilotEvent.findMany
      .mockResolvedValueOnce([{ action: 'AUTO_REPLIED' }, { action: 'AUTO_REPLIED' }, { action: 'ESCALATED' }])
      .mockResolvedValueOnce([{ action: 'AUTO_REPLIED' }, { action: 'ESCALATED' }]);
    // spark messages (last 12 days). One delivered+read today.
    prisma.message.findMany.mockResolvedValue([
      { sentAt: new Date('2026-06-07T03:00:00Z'), deliveredAt: new Date(), readAt: new Date() },
    ]);
    prisma.systemSetting.findUnique.mockResolvedValue({ key: 'cost_per_message_rm', value: '0.10' });

    const res = await service.kpis('30d', now);
    expect(res.delivered.value).toBe(96);
    expect(res.delivered.deltaPct).toBe(pctOf(96, 76));
    expect(res.deliveryRate.value).toBe(96);  // 96/100
    expect(res.autoHandleRate.value).toBe(66.7); // 2 of 3
    expect(res.sentToday.value).toBe(1);
    expect(res.costToday.value).toBe(0.1); // 1 delivered today * 0.10
    expect(res.costToday.estimated).toBe(true);
    expect(res.delivered.spark).toHaveLength(12);
    expect(res.delivered.spark[11]).toBe(1); // index 11 = today; mock has 1 delivered today
  });
});

function pctOf(cur: number, prev: number) { return Math.round(((cur - prev) / prev) * 1000) / 10; }
