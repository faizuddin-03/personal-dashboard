import { Test } from '@nestjs/testing';
import { InboxController } from '../inbox.controller';
import { InboxService } from '../inbox.service';

describe('InboxController', () => {
  let controller: InboxController;
  let service: {
    listConversations: jest.Mock;
    getConversation: jest.Mock;
    sendReply: jest.Mock;
    markResolved: jest.Mock;
    reopen: jest.Mock;
    unreadCount: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      listConversations: jest.fn(),
      getConversation: jest.fn(),
      sendReply: jest.fn(),
      markResolved: jest.fn(),
      reopen: jest.fn(),
      unreadCount: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [InboxController],
      providers: [{ provide: InboxService, useValue: service }],
    }).compile();
    controller = mod.get(InboxController);
  });

  it('GET /inbox/conversations passes query through to service', async () => {
    service.listConversations.mockResolvedValue({ items: [], nextCursor: null });
    await controller.list({ tab: 'all', limit: 50 } as any);
    expect(service.listConversations).toHaveBeenCalledWith({
      tab: 'all',
      cursor: undefined,
      limit: 50,
      search: undefined,
    });
  });

  it('GET /inbox/conversations defaults limit to 50 when omitted', async () => {
    service.listConversations.mockResolvedValue({ items: [], nextCursor: null });
    await controller.list({ tab: 'awaiting' } as any);
    expect(service.listConversations).toHaveBeenCalledWith({
      tab: 'awaiting',
      cursor: undefined,
      limit: 50,
      search: undefined,
    });
  });

  it('GET /inbox/conversations/:contactId returns one', async () => {
    service.getConversation.mockResolvedValue({ contact: { id: 'c1' } });
    const r = await controller.getOne('c1');
    expect(r.contact.id).toBe('c1');
    expect(service.getConversation).toHaveBeenCalledWith('c1');
  });

  it('POST /inbox/conversations/:contactId/messages calls sendReply with body', async () => {
    service.sendReply.mockResolvedValue({ message: { id: 'm1' } });
    await controller.send('c1', { body: 'hi' } as any);
    expect(service.sendReply).toHaveBeenCalledWith('c1', 'hi');
  });

  it('POST /inbox/conversations/:contactId/resolve calls markResolved', async () => {
    service.markResolved.mockResolvedValue({ contactId: 'c1' });
    await controller.resolve('c1');
    expect(service.markResolved).toHaveBeenCalledWith('c1');
  });

  it('POST /inbox/conversations/:contactId/reopen calls reopen', async () => {
    service.reopen.mockResolvedValue({ contactId: 'c1' });
    await controller.reopen('c1');
    expect(service.reopen).toHaveBeenCalledWith('c1');
  });

  it('GET /inbox/unread-count returns count as { count }', async () => {
    service.unreadCount.mockResolvedValue(5);
    const r = await controller.unreadCount();
    expect(r).toEqual({ count: 5 });
  });
});
