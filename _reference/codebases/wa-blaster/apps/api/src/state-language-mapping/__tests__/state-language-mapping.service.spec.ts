import { BadRequestException } from '@nestjs/common';
import { StateLanguageMappingService } from '../state-language-mapping.service';

describe('StateLanguageMappingService', () => {
  let prisma: any;
  let service: StateLanguageMappingService;

  beforeEach(() => {
    prisma = {
      stateLanguageMapping: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new StateLanguageMappingService(prisma);
  });

  it('listAll returns all 16 states, filling empty arrays for unmapped', async () => {
    prisma.stateLanguageMapping.findMany.mockResolvedValue([
      { state: 'PENANG', languages: ['ZH', 'EN'], updatedAt: new Date() },
    ]);
    const result = await service.listAll();
    expect(result).toHaveLength(16);
    expect(result.find((r) => r.state === 'PENANG')!.languages).toEqual(['ZH', 'EN']);
    expect(result.find((r) => r.state === 'JOHOR')!.languages).toEqual([]);
  });

  it('upsert sets languages for a state', async () => {
    prisma.stateLanguageMapping.upsert.mockResolvedValue({ state: 'PENANG', languages: ['ZH', 'EN'] });
    await service.upsert('PENANG', ['ZH', 'EN']);
    expect(prisma.stateLanguageMapping.upsert).toHaveBeenCalledWith({
      where: { state: 'PENANG' },
      create: { state: 'PENANG', languages: ['ZH', 'EN'] },
      update: { languages: ['ZH', 'EN'] },
    });
  });

  it('upsert rejects an empty languages array', async () => {
    await expect(service.upsert('PENANG', [])).rejects.toThrow(BadRequestException);
    expect(prisma.stateLanguageMapping.upsert).not.toHaveBeenCalled();
  });

  it('clear deletes the row (idempotent if absent)', async () => {
    prisma.stateLanguageMapping.delete.mockResolvedValue({});
    await service.clear('PENANG');
    expect(prisma.stateLanguageMapping.delete).toHaveBeenCalledWith({ where: { state: 'PENANG' } });
  });

  it('clear swallows a not-found delete', async () => {
    const err: any = new Error('not found');
    err.code = 'P2025';
    prisma.stateLanguageMapping.delete.mockRejectedValue(err);
    await expect(service.clear('PENANG')).resolves.toBeUndefined();
  });

  it('asMap returns a Map of state to languages for non-empty rows', async () => {
    prisma.stateLanguageMapping.findMany.mockResolvedValue([
      { state: 'PENANG', languages: ['ZH', 'EN'] },
      { state: 'KELANTAN', languages: ['MS'] },
    ]);
    const map = await service.asMap();
    expect(map.get('PENANG')).toEqual(['ZH', 'EN']);
    expect(map.get('KELANTAN')).toEqual(['MS']);
    expect(map.has('JOHOR')).toBe(false);
  });
});
