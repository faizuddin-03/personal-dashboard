import { Test } from '@nestjs/testing';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { DraftsController } from './drafts.controller';
import { DraftsService } from './drafts.service';

describe('DraftsController', () => {
  let controller: DraftsController;
  let service: { list: jest.Mock; approve: jest.Mock; edit: jest.Mock; reject: jest.Mock };
  const req = { user: { id: 'u1' } } as unknown as Request;

  beforeEach(async () => {
    service = { list: jest.fn(), approve: jest.fn(), edit: jest.fn(), reject: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [DraftsController],
      providers: [{ provide: DraftsService, useValue: service }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = mod.get(DraftsController);
  });

  it('GET /chatbot/drafts delegates the query to service.list', async () => {
    const out = { items: [], total: 0, page: 1, limit: 20 };
    service.list.mockResolvedValue(out);
    const query = { state: 'PENDING' as never, conversationId: 'c1' };

    expect(await controller.list(query)).toBe(out);
    expect(service.list).toHaveBeenCalledWith(query);
  });

  it('POST :id/approve passes the param id and the req.user id', async () => {
    const out = { draft: { id: 'd1' } };
    service.approve.mockResolvedValue(out);

    expect(await controller.approve('d1', req)).toBe(out);
    expect(service.approve).toHaveBeenCalledWith('d1', 'u1');
  });

  it('POST :id/edit passes the param id, the user id, and the dto body', async () => {
    const out = { draft: { id: 'd1' } };
    service.edit.mockResolvedValue(out);

    expect(await controller.edit('d1', { body: 'fixed reply' }, req)).toBe(out);
    expect(service.edit).toHaveBeenCalledWith('d1', 'u1', 'fixed reply');
  });

  it('POST :id/reject passes the param id, the user id, and the dto reason', async () => {
    const out = { draft: { id: 'd1' } };
    service.reject.mockResolvedValue(out);

    expect(await controller.reject('d1', { reason: 'tone' }, req)).toBe(out);
    expect(service.reject).toHaveBeenCalledWith('d1', 'u1', 'tone');
  });

  it('POST :id/reject forwards an undefined reason when the dto omits it', async () => {
    service.reject.mockResolvedValue({ draft: {} });

    await controller.reject('d1', {}, req);
    expect(service.reject).toHaveBeenCalledWith('d1', 'u1', undefined);
  });
});
