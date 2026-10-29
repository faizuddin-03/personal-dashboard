import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { InboxService } from './inbox.service';
import { ConversationsController } from './conversations.controller';

describe('ConversationsController', () => {
  let controller: ConversationsController;
  let inbox: {
    listConversations: jest.Mock;
    getConversation: jest.Mock;
    updateConversation: jest.Mock;
    manualReply: jest.Mock;
    closeConversation: jest.Mock;
  };
  const req = { user: { id: 'u1', email: 'op@x.com', role: 'OPERATOR' } } as never;

  beforeEach(async () => {
    inbox = {
      listConversations: jest.fn(),
      getConversation: jest.fn(),
      updateConversation: jest.fn(),
      manualReply: jest.fn(),
      closeConversation: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [ConversationsController],
      providers: [{ provide: InboxService, useValue: inbox }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = mod.get(ConversationsController);
  });

  it('GET / delegates to listConversations with the query', async () => {
    const out = { items: [], total: 0, page: 1, limit: 20 };
    inbox.listConversations.mockResolvedValue(out);
    const q = { state: 'NEW' } as never;

    expect(await controller.list(q)).toBe(out);
    expect(inbox.listConversations).toHaveBeenCalledWith(q);
  });

  it('GET /:id delegates to getConversation with the id', async () => {
    const out = { id: 'c1' };
    inbox.getConversation.mockResolvedValue(out);

    expect(await controller.get('c1')).toBe(out);
    expect(inbox.getConversation).toHaveBeenCalledWith('c1');
  });

  it('PATCH /:id delegates to updateConversation with id + dto', async () => {
    const out = { id: 'c1', pinned: true };
    inbox.updateConversation.mockResolvedValue(out);
    const dto = { pinned: true } as never;

    expect(await controller.update('c1', dto)).toBe(out);
    expect(inbox.updateConversation).toHaveBeenCalledWith('c1', dto);
  });

  it('POST /:id/manual-reply passes dto.body and the req.user id', async () => {
    const out = { outboundMessage: {}, conversationId: 'c1' };
    inbox.manualReply.mockResolvedValue(out);
    const dto = { body: 'hello' } as never;

    expect(await controller.manualReply('c1', dto, req)).toBe(out);
    expect(inbox.manualReply).toHaveBeenCalledWith('c1', 'hello', 'u1');
  });

  it('POST /:id/close passes id, req.user id and the dto', async () => {
    const out = { conversation: {}, captureId: 'cap1' };
    inbox.closeConversation.mockResolvedValue(out);
    const dto = { disposition: 'SKIP' } as never;

    expect(await controller.close('c1', dto, req)).toBe(out);
    expect(inbox.closeConversation).toHaveBeenCalledWith('c1', 'u1', dto);
  });
});
