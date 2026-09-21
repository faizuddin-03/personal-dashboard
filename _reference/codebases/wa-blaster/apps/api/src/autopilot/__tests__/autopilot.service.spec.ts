import { AutopilotService } from '../autopilot.service';

function makeDeps(overrides: any = {}) {
  const prisma = {
    contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'Auto Bestari', picName: 'Rahman' }), update: jest.fn().mockResolvedValue({}) },
    inboundMessage: { update: jest.fn().mockResolvedValue({}) },
    message: { create: jest.fn().mockResolvedValue({ id: 'm1' }) },
    inboxConversationState: { update: jest.fn().mockResolvedValue({}) },
    knowledgeDoc: { update: jest.fn().mockResolvedValue({}) },
    autopilotEvent: { create: jest.fn().mockResolvedValue({ id: 'e1' }) },
    $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
  };
  const settings = {
    get: jest.fn(async (key: string, fallback: string) => {
      const map: Record<string, string> = {
        autopilot_enabled: 'true',
        autopilot_escalation_threshold: '70',
        autopilot_honour_stop: 'true',
        ...overrides.settings,
      };
      return map[key] ?? fallback;
    }),
  };
  const llm = {
    classifyIntent: jest.fn().mockResolvedValue({ intent: 'transfer_support', confidence: 0.8 }),
    generateReply: jest.fn().mockResolvedValue({ text: 'Use the eAuto portal.', confidence: 0.9 }),
    ...overrides.llm,
  };
  const knowledge = {
    retrieve: jest.fn().mockResolvedValue([{ doc: { id: 'k1', question: 'transfer?', answer: 'Use the eAuto portal.' }, score: 6 }]),
    ...overrides.knowledge,
  };
  const whatsapp = { sendFreeFormText: jest.fn().mockResolvedValue({ metaMessageId: 'wamid.1' }) };
  const tickets = { createFromEscalation: jest.fn().mockResolvedValue({ id: 't1' }) };
  const service = new AutopilotService(knowledge as any, llm as any, settings as any, whatsapp as any, prisma as any, tickets as any);
  return { service, prisma, settings, llm, knowledge, whatsapp, tickets };
}

const INBOUND = { contactId: 'c1', inboundMessageId: 'in1', body: 'how do I transfer ownership?' };

describe('AutopilotService.handleInbound', () => {
  it('opts the dealer out and logs OPTED_OUT on STOP (no reply)', async () => {
    const { service, prisma, whatsapp, tickets } = makeDeps();
    await service.handleInbound({ ...INBOUND, body: 'STOP' });
    expect(prisma.contact.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'c1' } }));
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'OPTED_OUT' }) }));
    expect(tickets.createFromEscalation).not.toHaveBeenCalled();
  });

  it('logs SKIPPED and does nothing when autopilot is disabled', async () => {
    const { service, prisma, llm, whatsapp, tickets } = makeDeps({ settings: { autopilot_enabled: 'false' } });
    await service.handleInbound(INBOUND);
    expect(llm.classifyIntent).not.toHaveBeenCalled();
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'SKIPPED' }) }));
    expect(tickets.createFromEscalation).not.toHaveBeenCalled();
  });

  it('escalates (COMPLAINT) without replying when intent is a complaint', async () => {
    const { service, prisma, knowledge, whatsapp, tickets } = makeDeps({ llm: { classifyIntent: jest.fn().mockResolvedValue({ intent: 'complaint', confidence: 0.9 }) } });
    await service.handleInbound(INBOUND);
    expect(knowledge.retrieve).not.toHaveBeenCalled();
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ESCALATED', reason: 'COMPLAINT' }) }));
    expect(tickets.createFromEscalation).toHaveBeenCalledWith(expect.objectContaining({ contactId: 'c1', reason: 'COMPLAINT' }));
  });

  it('escalates (KNOWLEDGE_GAP) when no KB docs match', async () => {
    const { service, prisma, llm, whatsapp, tickets } = makeDeps({ knowledge: { retrieve: jest.fn().mockResolvedValue([]) } });
    await service.handleInbound(INBOUND);
    expect(llm.generateReply).not.toHaveBeenCalled();
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ESCALATED', reason: 'KNOWLEDGE_GAP' }) }));
    expect(tickets.createFromEscalation).toHaveBeenCalledWith(expect.objectContaining({ contactId: 'c1', reason: 'KNOWLEDGE_GAP' }));
  });

  it('escalates (LOW_CONFIDENCE) when the reply confidence is below threshold', async () => {
    const { service, prisma, whatsapp, tickets } = makeDeps({ llm: { classifyIntent: jest.fn().mockResolvedValue({ intent: 'transfer_support', confidence: 0.8 }), generateReply: jest.fn().mockResolvedValue({ text: 'maybe', confidence: 0.5 }) } });
    await service.handleInbound(INBOUND);
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ESCALATED', reason: 'LOW_CONFIDENCE' }) }));
    expect(tickets.createFromEscalation).toHaveBeenCalledWith(expect.objectContaining({ contactId: 'c1', reason: 'LOW_CONFIDENCE' }));
  });

  it('auto-replies on high confidence: sends, records the message, resolves the conversation, logs AUTO_REPLIED', async () => {
    const { service, prisma, whatsapp, tickets } = makeDeps();
    await service.handleInbound(INBOUND);
    expect(whatsapp.sendFreeFormText).toHaveBeenCalledWith('+60123', 'Use the eAuto portal.');
    expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ contactId: 'c1', source: 'INBOX', status: 'SENT', metaMessageId: 'wamid.1' }) }));
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith(expect.objectContaining({ where: { contactId: 'c1' }, data: expect.objectContaining({ resolvedAt: expect.any(Date) }) }));
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'AUTO_REPLIED', intent: 'transfer_support', matchedKbDocId: 'k1' }) }));
    expect(tickets.createFromEscalation).not.toHaveBeenCalled();
  });
});

// ── listEvents ────────────────────────────────────────────────────────────────

function makeListDeps() {
  const events = [
    { id: 'e1', contactId: 'c1', matchedKbDocId: 'k1', action: 'AUTO_REPLIED', createdAt: new Date('2025-01-02') },
    { id: 'e2', contactId: 'c2', matchedKbDocId: null,  action: 'ESCALATED',   createdAt: new Date('2025-01-01') },
  ];
  const prisma = {
    autopilotEvent: { findMany: jest.fn().mockResolvedValue(events) },
    contact: {
      findMany: jest.fn().mockResolvedValue([
        { id: 'c1', name: 'Ahmad', phoneE164: '+601' },
        { id: 'c2', name: 'Budi',  phoneE164: '+602' },
      ]),
    },
    knowledgeDoc: {
      findMany: jest.fn().mockResolvedValue([{ id: 'k1', slug: 'ownership-transfer' }]),
    },
  };
  const noop = jest.fn();
  const service = new AutopilotService(
    noop as any, noop as any, noop as any, noop as any, prisma as any, noop as any,
  );
  return { service, prisma };
}

describe('AutopilotService.listEvents', () => {
  it('queries autopilotEvent with correct where/orderBy/take when action filter supplied', async () => {
    const { service, prisma } = makeListDeps();
    await service.listEvents({ action: 'AUTO_REPLIED', limit: 10 });
    expect(prisma.autopilotEvent.findMany).toHaveBeenCalledWith({
      where: { action: 'AUTO_REPLIED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  });

  it('caps take at 200 regardless of caller limit', async () => {
    const { service, prisma } = makeListDeps();
    await service.listEvents({ limit: 9999 });
    expect(prisma.autopilotEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 200 }),
    );
  });

  it('defaults take to 50 when limit is not supplied', async () => {
    const { service, prisma } = makeListDeps();
    await service.listEvents({});
    expect(prisma.autopilotEvent.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 }),
    );
  });

  it('enriches events with contact object and matchedKbSlug', async () => {
    const { service, prisma } = makeListDeps();
    const result = await service.listEvents({ action: 'AUTO_REPLIED' });

    // contact lookup called with the unique contactIds from the events
    expect(prisma.contact.findMany).toHaveBeenCalledWith({
      where: { id: { in: expect.arrayContaining(['c1', 'c2']) } },
      select: { id: true, name: true, phoneE164: true },
    });

    // kb lookup called only for non-null matchedKbDocIds
    expect(prisma.knowledgeDoc.findMany).toHaveBeenCalledWith({
      where: { id: { in: ['k1'] } },
      select: { id: true, slug: true },
    });

    // first event: has contact + matchedKbSlug
    expect(result[0]).toMatchObject({
      id: 'e1',
      contact: { id: 'c1', name: 'Ahmad', phoneE164: '+601' },
      matchedKbSlug: 'ownership-transfer',
    });

    // second event: has contact but matchedKbSlug is null (no kbDocId)
    expect(result[1]).toMatchObject({
      id: 'e2',
      contact: { id: 'c2', name: 'Budi', phoneE164: '+602' },
      matchedKbSlug: null,
    });
  });

  it('skips contact and kb lookups when events array is empty', async () => {
    const { service, prisma } = makeListDeps();
    prisma.autopilotEvent.findMany.mockResolvedValueOnce([]);
    const result = await service.listEvents({});
    expect(prisma.contact.findMany).not.toHaveBeenCalled();
    expect(prisma.knowledgeDoc.findMany).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });
});
