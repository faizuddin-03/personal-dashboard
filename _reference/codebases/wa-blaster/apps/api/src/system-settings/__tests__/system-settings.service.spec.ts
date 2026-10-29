import { SystemSettingsService } from '../system-settings.service';

describe('SystemSettingsService', () => {
  let prisma: { systemSetting: { upsert: jest.Mock; findUnique: jest.Mock } };
  let service: SystemSettingsService;

  beforeEach(() => {
    prisma = { systemSetting: { upsert: jest.fn(), findUnique: jest.fn() } };
    service = new SystemSettingsService(prisma as any);
  });

  it('returns the stored value when present', async () => {
    prisma.systemSetting.findUnique.mockResolvedValue({ key: 'current_messaging_tier', value: 'TIER_2' });
    expect(await service.get('current_messaging_tier', 'TIER_1')).toBe('TIER_2');
  });

  it('returns default when not present', async () => {
    prisma.systemSetting.findUnique.mockResolvedValue(null);
    expect(await service.get('current_messaging_tier', 'TIER_1')).toBe('TIER_1');
  });

  it('upserts when set is called', async () => {
    prisma.systemSetting.upsert.mockResolvedValue({});
    await service.set('current_messaging_tier', 'TIER_3');
    expect(prisma.systemSetting.upsert).toHaveBeenCalledWith({
      where: { key: 'current_messaging_tier' },
      create: { key: 'current_messaging_tier', value: 'TIER_3' },
      update: { value: 'TIER_3' },
    });
  });
});
