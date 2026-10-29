import { Test } from '@nestjs/testing';
import { UsersController } from '../users.controller';
import { UsersService } from '../users.service';

describe('UsersController', () => {
  let controller: UsersController;
  let service: { list: jest.Mock; create: jest.Mock; update: jest.Mock; remove: jest.Mock };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get(UsersController);
  });

  it('GET /users returns user list', async () => {
    service.list.mockResolvedValue([{ id: 'u1', email: 'a@x', role: 'ADMIN' }]);
    const result = await controller.list();
    expect(result).toEqual([{ id: 'u1', email: 'a@x', role: 'ADMIN' }]);
    expect(service.list).toHaveBeenCalled();
  });

  it('POST /users creates user', async () => {
    service.create.mockResolvedValue({ id: 'u2', email: 'b@x', role: 'OPERATOR' });
    const dto = { email: 'b@x', password: 'password123', role: 'OPERATOR' as const };
    const result = await controller.create(dto);
    expect(result).toEqual({ id: 'u2', email: 'b@x', role: 'OPERATOR' });
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('PATCH /users/:id updates user', async () => {
    service.update.mockResolvedValue({ id: 'u1', email: 'a@x', name: 'New', role: 'OPERATOR' });
    const result = await controller.update('u1', { name: 'New', role: 'OPERATOR' });
    expect(service.update).toHaveBeenCalledWith('u1', { name: 'New', role: 'OPERATOR' });
    expect(result.name).toBe('New');
  });

  it('DELETE /users/:id removes user', async () => {
    service.remove.mockResolvedValue(undefined);
    const req = { user: { id: 'u-admin' } } as any;
    await controller.remove('u1', req);
    expect(service.remove).toHaveBeenCalledWith('u1', 'u-admin');
  });

  it('DELETE /users/:id rejects when admin tries to delete themselves', async () => {
    const { ForbiddenException } = require('@nestjs/common');
    service.remove.mockRejectedValue(new ForbiddenException('cannot delete yourself'));
    const req = { user: { id: 'u-admin' } } as any;
    await expect(controller.remove('u-admin', req)).rejects.toThrow(/cannot delete yourself/i);
  });
});
