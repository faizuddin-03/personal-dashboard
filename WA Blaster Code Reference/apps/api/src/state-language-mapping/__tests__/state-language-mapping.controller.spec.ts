import { Test } from '@nestjs/testing';
import { StateLanguageMappingController } from '../state-language-mapping.controller';
import { StateLanguageMappingService } from '../state-language-mapping.service';

describe('StateLanguageMappingController', () => {
  let controller: StateLanguageMappingController;
  let service: any;

  beforeEach(async () => {
    service = { listAll: jest.fn(), upsert: jest.fn(), clear: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [StateLanguageMappingController],
      providers: [{ provide: StateLanguageMappingService, useValue: service }],
    }).compile();
    controller = mod.get(StateLanguageMappingController);
  });

  it('GET returns all mappings', async () => {
    service.listAll.mockResolvedValue([{ state: 'PENANG', languages: ['ZH', 'EN'] }]);
    expect(await controller.list()).toEqual([{ state: 'PENANG', languages: ['ZH', 'EN'] }]);
  });

  it('PUT upserts then returns the refreshed list', async () => {
    service.listAll.mockResolvedValue([{ state: 'PENANG', languages: ['ZH', 'EN'] }]);
    await controller.upsert('PENANG' as any, { languages: ['ZH', 'EN'] } as any);
    expect(service.upsert).toHaveBeenCalledWith('PENANG', ['ZH', 'EN']);
  });

  it('DELETE clears then returns the refreshed list', async () => {
    service.listAll.mockResolvedValue([]);
    await controller.remove('PENANG' as any);
    expect(service.clear).toHaveBeenCalledWith('PENANG');
  });
});
