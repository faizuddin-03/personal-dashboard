import { InboxService } from '../inbox.service';

describe('InboxService.handleInbound', () => {
  let prisma: any;
  let whatsapp: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = {
      inboxConversationState: { upsert: jest.fn() },
    };
    whatsapp = { sendFreeFormText: jest.fn() };
    service = new InboxService(prisma, whatsapp);
  });

  it('upserts state with lastInboundAt and clears resolvedAt', async () => {
    const receivedAt = new Date('2026-05-28T08:00:00Z');
    await service.handleInbound(contactId, receivedAt);

    expect(prisma.inboxConversationState.upsert).toHaveBeenCalledWith({
      where: { contactId },
      create: { contactId, lastInboundAt: receivedAt, resolvedAt: null },
      update: { lastInboundAt: receivedAt, resolvedAt: null },
    });
  });
});

describe('InboxService.listConversations', () => {
  let prisma: any;
  let service: InboxService;

  beforeEach(() => {
    prisma = {
      $queryRawUnsafe: jest.fn().mockResolvedValue([]),
    };
    service = new InboxService(prisma, {} as any);
  });

  it('tab=all filters resolvedAt IS NULL', async () => {
    await service.listConversations({ tab: 'all', limit: 50 });
    expect(prisma.$queryRawUnsafe).toHaveBeenCalled();
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('s.resolved_at IS NULL');
    expect(sql).not.toContain('resolved_at IS NOT NULL');
  });

  it('tab=awaiting filters last_inbound > last_outbound', async () => {
    await service.listConversations({ tab: 'awaiting', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('resolved_at IS NULL');
    expect(sql).toMatch(/last_outbound_at IS NULL OR .*last_inbound_at > .*last_outbound_at/);
  });

  it('tab=replied filters last_outbound > last_inbound', async () => {
    await service.listConversations({ tab: 'replied', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('resolved_at IS NULL');
    expect(sql).toMatch(/last_outbound_at > .*last_inbound_at/);
  });

  it('tab=resolved filters resolvedAt IS NOT NULL', async () => {
    await service.listConversations({ tab: 'resolved', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('resolved_at IS NOT NULL');
  });

  it('uses phone_e164 column for contact phone', async () => {
    await service.listConversations({ tab: 'all', limit: 50 });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toContain('phone_e164');
  });

  it('caps limit at 100', async () => {
    await service.listConversations({ tab: 'all', limit: 9999 });
    const params = prisma.$queryRawUnsafe.mock.calls[0].slice(1);
    expect(params.some((p: any) => p === 100)).toBe(true);
  });

  it('applies search clause using name and phone_e164 when search provided', async () => {
    await service.listConversations({ tab: 'all', limit: 50, search: 'Aisyah' });
    const sql = String(prisma.$queryRawUnsafe.mock.calls[0][0]);
    expect(sql).toMatch(/c\.name ILIKE \$2 OR c\.phone_e164 ILIKE \$2/);
    const params = prisma.$queryRawUnsafe.mock.calls[0].slice(1);
    expect(params).toContain('%Aisyah%');
  });

  it('maps result rows to API shape with windowOpen computed', async () => {
    const recentInbound = new Date(Date.now() - 60 * 60 * 1000); // 1h ago -> open
    prisma.$queryRawUnsafe.mockResolvedValue([
      {
        contact_id: 'c1',
        contact_name: 'Aisyah',
        contact_phone: '+60123',
        last_inbound_at: recentInbound,
        last_outbound_at: null,
        resolved_at: null,
        last_preview: 'hi',
        last_direction: 'inbound',
        attribution: null,
      },
    ]);
    const result = await service.listConversations({ tab: 'all', limit: 50 });
    expect(result.items[0].contact.phone).toBe('+60123');
    expect(result.items[0].windowOpen).toBe(true);
    expect(result.items[0].windowExpiresAt).toBeInstanceOf(Date);
  });
});

describe('InboxService.getConversation', () => {
  let prisma: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = {
      inboxConversationState: { findUnique: jest.fn() },
      contact: { findUnique: jest.fn() },
      inboundMessage: { findMany: jest.fn().mockResolvedValue([]) },
      message: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new InboxService(prisma, {} as any);
  });

  it('throws 404 when no inbox state exists', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue(null);
    await expect(service.getConversation(contactId)).rejects.toThrow(/not found/i);
  });

  it('interleaves inbound + outbound messages by timestamp ASC', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: new Date('2026-05-28T08:00:00Z'),
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      name: 'Aisyah',
      phoneE164: '+60123',
    });
    prisma.inboundMessage.findMany.mockResolvedValue([
      { id: 'in1', body: 'hi', receivedAt: new Date('2026-05-28T08:00:00Z') },
      { id: 'in2', body: 'still there?', receivedAt: new Date('2026-05-28T09:00:00Z') },
    ]);
    prisma.message.findMany.mockResolvedValue([
      {
        id: 'out1',
        body: 'hello',
        sentAt: new Date('2026-05-28T08:30:00Z'),
        status: 'DELIVERED',
        source: 'INBOX',
        blastId: null,
        blast: null,
        errorMessage: null,
      },
    ]);

    const result = await service.getConversation(contactId);
    expect(result.messages.map((m: any) => m.id)).toEqual(['in1', 'out1', 'in2']);
  });

  it('computes windowExpiresAt = lastInboundAt + 24h', async () => {
    const lastInbound = new Date('2026-05-28T08:00:00Z');
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: lastInbound,
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      name: 'X',
      phoneE164: '+60',
    });

    const result = await service.getConversation(contactId);
    expect(result.windowExpiresAt).toEqual(new Date(lastInbound.getTime() + 24 * 60 * 60 * 1000));
  });

  it('returns contact phone from phoneE164 field as phone key', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: null,
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({
      id: contactId,
      name: 'Z',
      phoneE164: '+60999',
    });
    const result = await service.getConversation(contactId);
    expect(result.contact.phone).toBe('+60999');
  });
});

describe('InboxService.sendReply', () => {
  let prisma: any;
  let whatsapp: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';
  const phone = '+60123456789';

  beforeEach(() => {
    prisma = {
      inboxConversationState: {
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
      contact: { findUnique: jest.fn() },
      message: { create: jest.fn() },
      $transaction: jest.fn(async (ops: any) => {
        if (Array.isArray(ops)) {
          return Promise.all(ops);
        }
        return ops(prisma);
      }),
    };
    whatsapp = { sendFreeFormText: jest.fn() };
    service = new InboxService(prisma, whatsapp);
  });

  it('throws 404 when no inbox state', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue(null);
    await expect(service.sendReply(contactId, 'hi')).rejects.toThrow(/not found/i);
  });

  it('throws 409 when window is closed', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({ id: contactId, phoneE164: phone });
    await expect(service.sendReply(contactId, 'hi')).rejects.toThrow(/window/i);
  });

  it('throws 409 when there is no inbound history at all', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: null,
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({ id: contactId, phoneE164: phone });
    await expect(service.sendReply(contactId, 'hi')).rejects.toThrow(/window/i);
  });

  it('happy path: sends via WhatsApp, inserts message, updates state', async () => {
    const lastInbound = new Date(Date.now() - 60 * 60 * 1000); // 1h ago
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId,
      lastInboundAt: lastInbound,
      lastOutboundAt: null,
      resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({ id: contactId, phoneE164: phone });
    whatsapp.sendFreeFormText.mockResolvedValue({ metaMessageId: 'wamid.mock-abc' });
    prisma.message.create.mockResolvedValue({
      id: 'm1',
      body: 'hi',
      sentAt: new Date(),
      status: 'SENT',
      source: 'INBOX',
      blastId: null,
    });

    const result = await service.sendReply(contactId, 'hi');

    expect(whatsapp.sendFreeFormText).toHaveBeenCalledWith(phone, 'hi');
    expect(prisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          contactId,
          body: 'hi',
          source: 'INBOX',
          blastId: null,
          metaMessageId: 'wamid.mock-abc',
          status: 'SENT',
        }),
      }),
    );
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { contactId },
        data: expect.objectContaining({
          lastOutboundAt: expect.any(Date),
          resolvedAt: expect.any(Date),
        }),
      }),
    );
    expect(result.message.id).toBe('m1');
  });
});

describe('InboxService.markResolved / reopen / unreadCount', () => {
  let prisma: any;
  let service: InboxService;

  beforeEach(() => {
    prisma = {
      inboxConversationState: { update: jest.fn(), count: jest.fn() },
    };
    service = new InboxService(prisma, {} as any);
  });

  it('markResolved sets resolvedAt to now', async () => {
    prisma.inboxConversationState.update.mockResolvedValue({
      contactId: 'c1',
      resolvedAt: new Date(),
    });
    await service.markResolved('c1');
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith({
      where: { contactId: 'c1' },
      data: { resolvedAt: expect.any(Date) },
    });
  });

  it('reopen clears resolvedAt', async () => {
    prisma.inboxConversationState.update.mockResolvedValue({
      contactId: 'c1',
      resolvedAt: null,
    });
    await service.reopen('c1');
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith({
      where: { contactId: 'c1' },
      data: { resolvedAt: null },
    });
  });

  it('unreadCount returns count of resolvedAt IS NULL rows', async () => {
    prisma.inboxConversationState.count.mockResolvedValue(7);
    const n = await service.unreadCount();
    expect(prisma.inboxConversationState.count).toHaveBeenCalledWith({
      where: { resolvedAt: null },
    });
    expect(n).toBe(7);
  });
});
