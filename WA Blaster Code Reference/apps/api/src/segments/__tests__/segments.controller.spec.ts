import { Test } from '@nestjs/testing';
import { SegmentsController } from '../segments.controller';
import { SegmentsService } from '../segments.service';

describe('SegmentsController', () => {
  let controller: SegmentsController;
  let service: {
    list: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    preview: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      preview: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [SegmentsController],
      providers: [{ provide: SegmentsService, useValue: service }],
    }).compile();

    controller = module.get(SegmentsController);
  });

  it('GET /segments returns list', async () => {
    service.list.mockResolvedValue([{ id: 's1', name: 'KL Malays' }]);
    const result = await controller.list();
    expect(result).toEqual([{ id: 's1', name: 'KL Malays' }]);
  });

  it('GET /segments/:id returns one', async () => {
    service.findOne.mockResolvedValue({ id: 's1', name: 'KL Malays' });
    const result = await controller.findOne('s1');
    expect(result.id).toBe('s1');
  });

  it('POST /segments creates and uses requester id', async () => {
    service.create.mockResolvedValue({ id: 's2', name: 'New' });
    const dto = { name: 'New', filter: { ethnicity: ['MALAY'] } } as any;
    const req = { user: { id: 'u1' } } as any;
    await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'u1');
  });

  it('PATCH /segments/:id updates', async () => {
    service.update.mockResolvedValue({ id: 's1', name: 'Renamed' });
    const result = await controller.update('s1', { name: 'Renamed' } as any);
    expect(service.update).toHaveBeenCalledWith('s1', { name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });

  it('DELETE /segments/:id removes', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('s1');
    expect(service.remove).toHaveBeenCalledWith('s1');
  });

  it('GET /segments/:id/preview returns count and sample', async () => {
    service.preview.mockResolvedValue({ count: 42, sample: [{ id: 'c1' }] });
    const result = await controller.preview('s1');
    expect(result.count).toBe(42);
  });
});
