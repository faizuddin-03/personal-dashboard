import { Test } from '@nestjs/testing';
import { BlastsController } from '../blasts.controller';
import { BlastsService } from '../blasts.service';

describe('BlastsController', () => {
  let controller: BlastsController;
  let service: {
    list: jest.Mock;
    findOne: jest.Mock;
    stats: jest.Mock;
    createAndSchedule: jest.Mock;
    cancel: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      findOne: jest.fn(),
      stats: jest.fn(),
      createAndSchedule: jest.fn(),
      cancel: jest.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [BlastsController],
      providers: [{ provide: BlastsService, useValue: service }],
    }).compile();
    controller = module.get(BlastsController);
  });

  it('GET /blasts lists', async () => {
    service.list.mockResolvedValue([{ id: 'b1' }]);
    expect(await controller.list({} as any)).toEqual([{ id: 'b1' }]);
  });

  it('GET /blasts/:id returns one', async () => {
    service.findOne.mockResolvedValue({ id: 'b1' });
    expect(await controller.findOne('b1')).toEqual({ id: 'b1' });
  });

  it('GET /blasts/:id/stats returns stats', async () => {
    service.stats.mockResolvedValue({ id: 'b1', counts: { SENT: 5 } });
    const result = await controller.stats('b1');
    expect(result.counts.SENT).toBe(5);
  });

  it('POST /blasts creates and schedules', async () => {
    service.createAndSchedule.mockResolvedValue({ id: 'b2' });
    const dto = { name: 'x', templateName: 't', defaultLanguage: 'EN', variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z' } as any;
    const req = { user: { id: 'u1' } } as any;
    await controller.create(dto, req);
    expect(service.createAndSchedule).toHaveBeenCalledWith(dto, 'u1');
  });

  it('POST /blasts/:id/cancel cancels', async () => {
    service.cancel.mockResolvedValue({ id: 'b1', status: 'CANCELED' });
    const result = await controller.cancel('b1');
    expect(result.status).toBe('CANCELED');
  });
});
