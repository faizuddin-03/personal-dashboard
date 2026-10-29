import { Test } from '@nestjs/testing';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { RolesGuard } from '../../auth/roles.guard';
import { ChatbotSettingsService } from '../settings/chatbot-settings.service';
import { SettingsController } from './settings.controller';

describe('SettingsController', () => {
  let controller: SettingsController;
  let settings: { getAll: jest.Mock; patch: jest.Mock };

  beforeEach(async () => {
    settings = { getAll: jest.fn(), patch: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: ChatbotSettingsService, useValue: settings }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();
    controller = mod.get(SettingsController);
  });

  it('GET /chatbot/settings returns all settings', async () => {
    const rows = [{ key: 'enabled', value: true, valueType: 'boolean', description: null, updatedAt: new Date() }];
    settings.getAll.mockResolvedValue(rows);
    expect(await controller.getAll()).toBe(rows);
  });

  it('PATCH writes each provided key, then returns the refreshed settings', async () => {
    settings.getAll.mockResolvedValue([]);
    await controller.update({ enabled: true, confidence_threshold: 0.9 } as never);
    expect(settings.patch).toHaveBeenCalledWith('enabled', true);
    expect(settings.patch).toHaveBeenCalledWith('confidence_threshold', 0.9);
    expect(settings.patch).toHaveBeenCalledTimes(2);
    expect(settings.getAll).toHaveBeenCalledTimes(1);
  });

  it('PATCH with an empty body writes nothing but still returns settings', async () => {
    settings.getAll.mockResolvedValue([]);
    await controller.update({} as never);
    expect(settings.patch).not.toHaveBeenCalled();
    expect(settings.getAll).toHaveBeenCalledTimes(1);
  });
});
