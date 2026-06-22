import { NotFoundException } from '@nestjs/common';
import { TicketsService, formatTicketNum } from '../tickets.service';

function makePrisma() {
  return {
    ticket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    inboundMessage: { findFirst: jest.fn() },
    message: { findFirst: jest.fn() },
  };
}

describe('formatTicketNum', () => {
  it('formats seq as TCK-#### offset by 1000', () => {
    expect(formatTicketNum(1)).toBe('TCK-1001');
    expect(formatTicketNum(48)).toBe('TCK-1048');
  });
});

describe('TicketsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TicketsService;
  let knowledge: { create: jest.Mock };

  beforeEach(() => {
    prisma = makePrisma();
    knowledge = { create: jest.fn().mockResolvedValue({ id: 'k1' }) };
    service = new TicketsService(prisma as any, knowledge as any, {} as any, { close: jest.fn().mockResolvedValue(undefined) } as any);
  });

  it('createFromEscalation creates an OPEN ticket with reason + intent + event link', async () => {
    prisma.ticket.create.mockResolvedValue({ id: 't1' });
    await service.createFromEscalation({ contactId: 'c1', reason: 'LOW_CONFIDENCE', intent: 'transfer_support', autopilotEventId: 'e1' });
    expect(prisma.ticket.create).toHaveBeenCalledWith({
      data: { contactId: 'c1', reason: 'LOW_CONFIDENCE', intent: 'transfer_support', autopilotEventId: 'e1', status: 'OPEN' },
    });
  });

  it('list active filters to non-closed statuses, newest-first, enriched with num', async () => {
    prisma.ticket.findMany.mockResolvedValue([{ id: 't1', seq: 2, status: 'OPEN', contact: { name: 'X' }, assignee: null }]);
    const result = await service.list({ tab: 'active' });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] } },
      orderBy: { openedAt: 'desc' },
    }));
    expect(result[0].num).toBe('TCK-1002');
  });

  it('list closed filters to CLOSED', async () => {
    prisma.ticket.findMany.mockResolvedValue([]);
    await service.list({ tab: 'closed' });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'CLOSED' } }));
  });

  it('assign sets IN_PROGRESS + assignee + assignedAt', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', seq: 1, assigneeId: 'u1', status: 'IN_PROGRESS', contact: {}, assignee: {} });
    await service.assign('t1', 'u1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({ status: 'IN_PROGRESS', assigneeId: 'u1', assignedAt: expect.any(Date) }),
    }));
  });

  it('resolve sets RESOLVED + resolvedAt; close sets CLOSED + closedAt', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', seq: 1, status: 'RESOLVED', contact: {}, assignee: null, conversationId: null });
    await service.resolve('t1', 'user-1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'RESOLVED', resolvedAt: expect.any(Date) }) }));
    await service.close('t1', 'user-1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED', closedAt: expect.any(Date) }) }));
  });

  it('reopen sets OPEN and clears resolved/closed timestamps', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', seq: 1, status: 'OPEN', contact: {}, assignee: null });
    await service.reopen('t1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'OPEN', resolvedAt: null, closedAt: null } }));
  });

  it('get throws NotFound when the ticket is missing', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('suggestKnowledge derives question/answer/slug from the ticket conversation', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1' });
    prisma.inboundMessage.findFirst.mockResolvedValue({ body: 'How do I transfer a vehicle?' });
    prisma.message.findFirst.mockResolvedValue({ body: 'Use the eAuto portal under Transfers.' });
    const s = await service.suggestKnowledge('t1');
    expect(s).toEqual({
      ticketId: 't1',
      question: 'How do I transfer a vehicle?',
      answer: 'Use the eAuto portal under Transfers.',
      suggestedSlug: 'how_do_transfer_vehicle.md',
      category: 'General',
    });
  });

  it('createKnowledgeCandidate creates a FROM_ESCALATION CANDIDATE linked to the ticket', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1' });
    await service.createKnowledgeCandidate('t1', { question: 'q', answer: 'a', slug: 'a.md', category: 'Transfer' });
    expect(knowledge.create).toHaveBeenCalledWith({
      slug: 'a.md', question: 'q', answer: 'a', category: 'Transfer',
      source: 'FROM_ESCALATION', status: 'CANDIDATE', ticketId: 't1',
    });
  });
});

describe('TicketsService.agentContext', () => {
  let prisma: any; let knowledge: any; let llm: any; let service: TicketsService;
  beforeEach(() => {
    prisma = {
      ticket: { findUnique: jest.fn() },
      autopilotEvent: { findUnique: jest.fn() },
      inboundMessage: { findFirst: jest.fn() },
    };
    knowledge = { retrieve: jest.fn().mockResolvedValue([]) };
    llm = { generateReply: jest.fn() };
    service = new TicketsService(prisma, knowledge, llm, { close: jest.fn().mockResolvedValue(undefined) } as any);
  });

  it('throws NotFound when the ticket is missing', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    await expect(service.agentContext('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns intent/reason/confidence + suggested knowledge from a fresh retrieve', async () => {
    prisma.ticket.findUnique.mockResolvedValue({
      id: 't1', contactId: 'c1', intent: 'transfer_support', reason: 'LOW_CONFIDENCE',
      autopilotEventId: 'e1', openedAt: new Date('2026-06-01T00:00:00Z'),
    });
    prisma.autopilotEvent.findUnique.mockResolvedValue({ id: 'e1', confidence: 0.42, createdAt: new Date('2026-06-01T01:00:00Z') });
    prisma.inboundMessage.findFirst.mockResolvedValue({ body: 'how do I transfer?' });
    knowledge.retrieve.mockResolvedValue([
      { doc: { id: 'k1', slug: 'transfer.md', question: 'How to transfer?', answer: 'Use the portal.', category: 'Transfer' }, score: 5 },
    ]);
    const res = await service.agentContext('t1');
    expect(knowledge.retrieve).toHaveBeenCalledWith('how do I transfer?', { intent: 'transfer_support', limit: 3 });
    expect(res).toEqual({
      intent: 'transfer_support', reason: 'LOW_CONFIDENCE', confidence: 0.42,
      escalatedAt: new Date('2026-06-01T01:00:00Z'),
      suggestedKnowledge: [{ id: 'k1', slug: 'transfer.md', question: 'How to transfer?', answer: 'Use the portal.', category: 'Transfer' }],
    });
  });

  it('returns empty knowledge + null confidence when no inbound and no event', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1', intent: null, reason: 'COMPLAINT', autopilotEventId: null, openedAt: new Date('2026-06-01T00:00:00Z') });
    prisma.inboundMessage.findFirst.mockResolvedValue(null);
    const res = await service.agentContext('t1');
    expect(knowledge.retrieve).not.toHaveBeenCalled();
    expect(res.suggestedKnowledge).toEqual([]);
    expect(res.confidence).toBeNull();
    expect(res.escalatedAt).toEqual(new Date('2026-06-01T00:00:00Z'));
  });
});

describe('TicketsService.suggestReply', () => {
  let prisma: any; let knowledge: any; let llm: any; let service: TicketsService;
  beforeEach(() => {
    prisma = {
      ticket: { findUnique: jest.fn() },
      inboundMessage: { findFirst: jest.fn() },
      contact: { findUnique: jest.fn() },
    };
    knowledge = { retrieve: jest.fn().mockResolvedValue([]) };
    llm = { generateReply: jest.fn() };
    service = new TicketsService(prisma, knowledge, llm, { close: jest.fn().mockResolvedValue(undefined) } as any);
  });

  it('throws NotFound when the ticket is missing', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    await expect(service.suggestReply('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an empty draft when there is no inbound message', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1', intent: 'x' });
    prisma.inboundMessage.findFirst.mockResolvedValue(null);
    const res = await service.suggestReply('t1');
    expect(res).toEqual({ text: '', confidence: 0 });
    expect(llm.generateReply).not.toHaveBeenCalled();
  });

  it('drafts a KB-grounded reply via the LLM', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1', intent: 'transfer_support' });
    prisma.inboundMessage.findFirst.mockResolvedValue({ body: 'how do I transfer?' });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', picName: 'Rahman', name: 'Auto Bestari' });
    knowledge.retrieve.mockResolvedValue([{ doc: { question: 'How to transfer?', answer: 'Use the portal.' }, score: 5 }]);
    llm.generateReply.mockResolvedValue({ text: 'Hi Rahman, to transfer use the portal.', confidence: 0.83 });

    const res = await service.suggestReply('t1');
    expect(knowledge.retrieve).toHaveBeenCalledWith('how do I transfer?', { intent: 'transfer_support', limit: 3 });
    expect(llm.generateReply).toHaveBeenCalledWith({
      message: 'how do I transfer?',
      intent: 'transfer_support',
      knowledge: [{ question: 'How to transfer?', answer: 'Use the portal.' }],
      dealerName: 'Rahman',
    });
    expect(res).toEqual({ text: 'Hi Rahman, to transfer use the portal.', confidence: 0.83 });
  });
});
