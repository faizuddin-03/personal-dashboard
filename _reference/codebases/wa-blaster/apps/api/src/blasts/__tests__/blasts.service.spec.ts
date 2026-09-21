import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BlastsService } from '../blasts.service';

describe('BlastsService.stats', () => {
  let prisma: any;
  let queue: any;
  let service: BlastsService;

  beforeEach(() => {
    prisma = {
      blast: { findUnique: jest.fn() },
      message: { groupBy: jest.fn(), count: jest.fn() },
    };
    queue = { add: jest.fn(), getJobs: jest.fn() };
    const settings = { get: jest.fn().mockResolvedValue('7') };
    service = new BlastsService(prisma, queue, settings as any);
  });

  it('returns counts including zeroes for statuses with no rows', async () => {
    prisma.blast.findUnique.mockResolvedValue({
      id: 'b1', status: 'RUNNING', totalRecipients: 5, startedAt: null, completedAt: null,
    });
    prisma.message.groupBy.mockResolvedValue([
      { status: 'SENT', _count: { status: 3 } },
      { status: 'DELIVERED', _count: { status: 1 } },
    ]);

    const result = await service.stats('b1');
    expect(result.counts).toEqual({
      QUEUED: 0, SENT: 3, DELIVERED: 1, READ: 0, FAILED: 0, CANCELED: 0,
    });
    expect(result.totalRecipients).toBe(5);
  });
});

describe('BlastsService.stats with replies', () => {
  let prisma: any;
  let queue: any;
  let settings: any;
  let service: BlastsService;

  beforeEach(() => {
    prisma = {
      blast: { findUnique: jest.fn() },
      message: { groupBy: jest.fn(), count: jest.fn() },
    };
    queue = { add: jest.fn(), getJobs: jest.fn() };
    settings = { get: jest.fn().mockResolvedValue('7') };
    service = new BlastsService(prisma, queue, settings as any);
  });

  it('includes replied count from messages.repliedAt', async () => {
    prisma.blast.findUnique.mockResolvedValue({
      id: 'b1', status: 'COMPLETED', totalRecipients: 100, startedAt: new Date(), completedAt: new Date(),
    });
    prisma.message.groupBy.mockResolvedValue([
      { status: 'DELIVERED', _count: { status: 90 } },
      { status: 'READ', _count: { status: 60 } },
    ]);
    prisma.message.count.mockResolvedValue(12);

    const result = await service.stats('b1');
    expect(result.replied).toBe(12);
    expect(result.counts.DELIVERED).toBe(90);
  });
});

describe('BlastsService.applyInboundMessage', () => {
  let prisma: any;
  let queue: any;
  let settings: any;
  let inboxService: { handleInbound: jest.Mock };
  let service: BlastsService;

  beforeEach(() => {
    prisma = {
      contact: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      inboundMessage: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'in1' }),
      },
      message: {
        findMany: jest.fn().mockResolvedValue([]),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      messageEvent: {
        create: jest.fn().mockResolvedValue({ id: 'evt1' }),
      },
    };
    queue = { add: jest.fn(), getJobs: jest.fn() };
    settings = { get: jest.fn().mockResolvedValue('7') };
    inboxService = { handleInbound: jest.fn().mockResolvedValue(undefined) };
    service = new BlastsService(prisma, queue, settings as any, inboxService as any);
  });

  it('calls inboxService.handleInbound with contactId and a Date when an existing contact replies', async () => {
    prisma.contact.findUnique.mockResolvedValue({
      id: 'c1',
      phoneE164: '+60198765432',
      name: 'Aisyah',
    });

    await service.applyInboundMessage({
      from: '60198765432',
      id: 'wamid.in1',
      timestamp: '1748419200',
      type: 'text',
      text: { body: 'hi' },
    } as any);

    expect(inboxService.handleInbound).toHaveBeenCalledTimes(1);
    expect(inboxService.handleInbound).toHaveBeenCalledWith('c1', expect.any(Date));
  });
});

describe('BlastsService.createAndSchedule — STATE mode', () => {
  let prisma: any;
  let queue: any;
  let settings: any;
  let inboxService: any;
  let mappings: any;
  let service: BlastsService;

  const approvedRows = [
    { id: 't-en', language: 'EN', status: 'APPROVED', version: 1 },
    { id: 't-zh', language: 'ZH', status: 'APPROVED', version: 1 },
    { id: 't-ms', language: 'MS', status: 'APPROVED', version: 1 },
  ];

  beforeEach(() => {
    prisma = {
      template: { findMany: jest.fn().mockResolvedValue(approvedRows) },
      contact: { findMany: jest.fn() },
      contactSegment: { findUnique: jest.fn() },
      blast: { create: jest.fn().mockResolvedValue({ id: 'blast-1' }) },
      message: {
        create: jest.fn((args) => Promise.resolve({ id: `m-${Math.random()}`, ...args.data })),
        findMany: jest.fn().mockResolvedValue([]),
      },
      $transaction: jest.fn((ops) => Promise.all(ops)),
    };
    queue = { add: jest.fn() };
    settings = { get: jest.fn() };
    inboxService = { handleInbound: jest.fn() };
    mappings = { asMap: jest.fn() };
    service = new BlastsService(prisma, queue, settings, inboxService, mappings);
  });

  it('fans out one message per mapped language (Penang → ZH + EN = 2 messages)', async () => {
    mappings.asMap.mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]]));
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c1' }])                       // resolveRecipients (no segment → opted-in)
      .mockResolvedValueOnce([{ id: 'c1', state: 'PENANG' }]);     // state load
    const dto: any = {
      name: 'X', templateName: 'promo', defaultLanguage: 'EN',
      variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z', languageMode: 'STATE',
    };
    await service.createAndSchedule(dto, 'u1');
    expect(prisma.message.create).toHaveBeenCalledTimes(2);
    const templateIds = prisma.message.create.mock.calls.map((c) => c[0].data.templateId).sort();
    expect(templateIds).toEqual(['t-en', 't-zh']);
    expect(prisma.blast.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ languageMode: 'STATE', uniqueContacts: 1, totalRecipients: 2 }),
    }));
  });

  it('falls back to default language for unmapped/null state (1 message)', async () => {
    mappings.asMap.mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]]));
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c2' }])
      .mockResolvedValueOnce([{ id: 'c2', state: null }]);
    const dto: any = {
      name: 'X', templateName: 'promo', defaultLanguage: 'MS',
      variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z', languageMode: 'STATE',
    };
    await service.createAndSchedule(dto, 'u1');
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
    expect(prisma.message.create.mock.calls[0][0].data.templateId).toBe('t-ms');
  });

  it('blocks creation when a required language has no approved variant', async () => {
    prisma.template.findMany.mockResolvedValue([{ id: 't-en', language: 'EN', status: 'APPROVED', version: 1 }]);
    mappings.asMap.mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]]));
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c1' }])
      .mockResolvedValueOnce([{ id: 'c1', state: 'PENANG' }]);
    const dto: any = {
      name: 'X', templateName: 'promo', defaultLanguage: 'EN',
      variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z', languageMode: 'STATE',
    };
    await expect(service.createAndSchedule(dto, 'u1')).rejects.toThrow(/ZH/);
    expect(prisma.blast.create).not.toHaveBeenCalled();
  });
});

describe('BlastsService.previewStateLanguages', () => {
  let prisma: any; let service: BlastsService; let mappings: any;
  beforeEach(() => {
    prisma = {
      template: { findMany: jest.fn().mockResolvedValue([
        { id: 't-en', language: 'EN', status: 'APPROVED', version: 1 },
        { id: 't-zh', language: 'ZH', status: 'APPROVED', version: 1 },
      ]) },
      contact: { findMany: jest.fn() },
      contactSegment: { findUnique: jest.fn() },
    };
    mappings = { asMap: jest.fn().mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]])) };
    service = new BlastsService(prisma, { add: jest.fn() } as any, { get: jest.fn() } as any, { handleInbound: jest.fn() } as any, mappings);
  });

  it('summarizes messages, contacts, by-language, by-state, and gaps', async () => {
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }])                               // resolveRecipients
      .mockResolvedValueOnce([{ id: 'c1', state: 'PENANG' }, { id: 'c2', state: null }]); // state load
    const result = await service.previewStateLanguages({ templateName: 'promo', defaultLanguage: 'EN' } as any);
    expect(result.uniqueContacts).toBe(2);
    expect(result.totalMessages).toBe(3); // Penang→2 (ZH,EN), null→1 (EN)
    expect(result.byLanguage).toEqual({ ZH: 1, EN: 2 });
    expect(result.gaps).toEqual([]);
  });
});

describe('BlastsService.resolveRecipients — audienceFilter path', () => {
  let prisma: any;
  let service: BlastsService;

  beforeEach(() => {
    prisma = {
      contact: { findMany: jest.fn() },
      contactSegment: { findUnique: jest.fn() },
    };
    service = new BlastsService(
      prisma,
      { add: jest.fn() } as any,
      { get: jest.fn() } as any,
      { handleInbound: jest.fn() } as any,
      { asMap: jest.fn() } as any,
    );
  });

  it('resolves contacts using audienceFilter when no segmentId is provided', async () => {
    prisma.contact.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);

    const audienceFilter = { state: ['SELANGOR'], vehicleSpecialization: ['EV_HYBRID'] };
    const ids = await service.resolveRecipients(undefined, audienceFilter as any);

    expect(ids).toEqual(['c1', 'c2']);

    // Must have called findMany once
    expect(prisma.contact.findMany).toHaveBeenCalledTimes(1);
    const callArgs = prisma.contact.findMany.mock.calls[0][0];

    // Filter clauses from audienceFilter are forwarded
    expect(callArgs.where).toMatchObject({
      state: { in: ['SELANGOR'] },
      vehicleSpecialization: { in: ['EV_HYBRID'] },
    });

    // Blast-eligibility always enforced regardless of audienceFilter content
    expect(callArgs.where.optInStatus).toEqual('OPTED_IN');
    expect(callArgs.where.numberType).toEqual('PHONE');
  });

  it('audienceFilter eligibility enforcement overrides any optInStatus/numberType in the filter', async () => {
    prisma.contact.findMany.mockResolvedValue([{ id: 'c3' }]);

    // Caller passes a filter that tries to include OPTED_OUT — the service must still enforce OPTED_IN + PHONE
    const audienceFilter = { state: ['PENANG'], optInStatus: ['OPTED_OUT'], numberType: ['FAX'] };
    await service.resolveRecipients(undefined, audienceFilter as any);

    const callArgs = prisma.contact.findMany.mock.calls[0][0];
    expect(callArgs.where.optInStatus).toEqual('OPTED_IN');
    expect(callArgs.where.numberType).toEqual('PHONE');
  });

  it('segmentId path still works and audienceFilter is ignored when segmentId is provided', async () => {
    const segment = { id: 'seg-1', filterJson: { state: ['KEDAH'] } };
    prisma.contactSegment.findUnique.mockResolvedValue(segment);
    prisma.contact.findMany.mockResolvedValue([{ id: 'c4' }]);

    const ids = await service.resolveRecipients('seg-1', { state: ['SELANGOR'] } as any);
    expect(ids).toEqual(['c4']);
    // segment path: optInStatus added as where clause (merged into findMany)
    const callArgs = prisma.contact.findMany.mock.calls[0][0];
    expect(callArgs.where.state).toEqual({ in: ['KEDAH'] }); // from segment, not audienceFilter
  });

  it('falls back to all opted-in when neither segmentId nor audienceFilter is provided', async () => {
    prisma.contact.findMany.mockResolvedValue([{ id: 'c5' }]);

    const ids = await service.resolveRecipients(undefined, undefined);
    expect(ids).toEqual(['c5']);
    const callArgs = prisma.contact.findMany.mock.calls[0][0];
    expect(callArgs.where).toEqual({ optInStatus: 'OPTED_IN' });
  });

  it('resolves hand-picked dealers via audienceFilter.contactIds, still enforcing eligibility', async () => {
    prisma.contact.findMany.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }]);

    const ids = await service.resolveRecipients(undefined, { contactIds: ['c1', 'c2', 'c3'] } as any);

    // Only eligible (opted-in PHONE) hand-picked dealers come back.
    expect(ids).toEqual(['c1', 'c2']);
    const callArgs = prisma.contact.findMany.mock.calls[0][0];
    expect(callArgs.where.id).toEqual({ in: ['c1', 'c2', 'c3'] });
    expect(callArgs.where.optInStatus).toEqual('OPTED_IN');
    expect(callArgs.where.numberType).toEqual('PHONE');
  });
});

describe('BlastsService.listMessages', () => {
  let prisma: any; let queue: any; let service: BlastsService;
  beforeEach(() => {
    prisma = {
      blast: { findUnique: jest.fn().mockResolvedValue({ id: 'b1' }) },
      message: { count: jest.fn(), findMany: jest.fn() },
      contact: { findMany: jest.fn() },
    };
    queue = { add: jest.fn(), getJobs: jest.fn() };
    service = new BlastsService(prisma, queue, {} as any, {} as any, {} as any);
  });

  it('paginates, filters by status, and merges contact name/phone', async () => {
    prisma.message.count.mockResolvedValue(2);
    prisma.message.findMany.mockResolvedValue([
      { id: 'm1', contactId: 'c1', status: 'FAILED', errorCode: '131026', errorMessage: 'undeliverable', sentAt: new Date(), deliveredAt: null, readAt: null, repliedAt: null },
      { id: 'm2', contactId: 'c2', status: 'DELIVERED', errorCode: null, errorMessage: null, sentAt: new Date(), deliveredAt: new Date(), readAt: null, repliedAt: null },
    ]);
    prisma.contact.findMany.mockResolvedValue([
      { id: 'c1', name: 'Auto Bestari', phoneE164: '+60123456789' },
      { id: 'c2', name: null, phoneE164: '+60198887777' },
    ]);

    const res = await service.listMessages('b1', { status: 'FAILED' as any, page: 2, pageSize: 25 });

    expect(prisma.message.count).toHaveBeenCalledWith({ where: { blastId: 'b1', status: 'FAILED' } });
    const findArgs = prisma.message.findMany.mock.calls[0][0];
    expect(findArgs.where).toEqual({ blastId: 'b1', status: 'FAILED' });
    expect(findArgs.skip).toBe(25);
    expect(findArgs.take).toBe(25);
    expect(res.total).toBe(2);
    expect(res.items[0]).toEqual(expect.objectContaining({
      id: 'm1', contactName: 'Auto Bestari', contactPhone: '+60123456789', status: 'FAILED', errorCode: '131026',
    }));
    expect(res.items[1].contactName).toBeNull();
  });

  it('omits the status filter when not provided and defaults page/pageSize', async () => {
    prisma.message.count.mockResolvedValue(0);
    prisma.message.findMany.mockResolvedValue([]);
    prisma.contact.findMany.mockResolvedValue([]);
    const res = await service.listMessages('b1', {});
    expect(prisma.message.count).toHaveBeenCalledWith({ where: { blastId: 'b1' } });
    expect(res).toEqual({ items: [], total: 0, page: 1, pageSize: 25 });
  });

  it('throws NotFound when the blast does not exist', async () => {
    prisma.blast.findUnique.mockResolvedValue(null);
    await expect(service.listMessages('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('BlastsService.retryMessage', () => {
  let prisma: any; let queue: any; let service: BlastsService;
  beforeEach(() => {
    prisma = {
      message: {
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation((a) => Promise.resolve({ id: a.where.id, ...a.data })),
      },
    };
    queue = { add: jest.fn() };
    service = new BlastsService(prisma, queue, {} as any, {} as any, {} as any);
  });

  it('rejects a non-FAILED message with BadRequest and enqueues nothing', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'b1', status: 'SENT' });
    await expect(service.retryMessage('b1', 'm1')).rejects.toBeInstanceOf(BadRequestException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('rejects a message belonging to another blast with NotFound', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'other', status: 'FAILED' });
    await expect(service.retryMessage('b1', 'm1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a missing message with NotFound', async () => {
    prisma.message.findUnique.mockResolvedValue(null);
    await expect(service.retryMessage('b1', 'm1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resets a FAILED message to QUEUED, clears error + metaMessageId, enqueues one job', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'b1', status: 'FAILED' });
    const res = await service.retryMessage('b1', 'm1');
    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add.mock.calls[0][1]).toEqual({ messageId: 'm1' });
    expect(res.status).toBe('QUEUED');
  });
});

describe('BlastsService.retryFailed', () => {
  let prisma: any; let queue: any; let service: BlastsService;
  beforeEach(() => {
    prisma = {
      blast: { findUnique: jest.fn().mockResolvedValue({ id: 'b1' }) },
      message: { findMany: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    queue = { add: jest.fn() };
    service = new BlastsService(prisma, queue, {} as any, {} as any, {} as any);
  });

  it('returns { retried: 0 } and enqueues nothing when there are no failures', async () => {
    prisma.message.findMany.mockResolvedValue([]);
    const res = await service.retryFailed('b1');
    expect(res).toEqual({ retried: 0 });
    expect(prisma.message.updateMany).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('resets all FAILED to QUEUED and enqueues one job each', async () => {
    prisma.message.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }]);
    const res = await service.retryFailed('b1');
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: { blastId: 'b1', status: 'FAILED' },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    expect(queue.add).toHaveBeenCalledTimes(3);
    expect(res).toEqual({ retried: 3 });
  });

  it('throws NotFound when the blast does not exist', async () => {
    prisma.blast.findUnique.mockResolvedValue(null);
    await expect(service.retryFailed('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
