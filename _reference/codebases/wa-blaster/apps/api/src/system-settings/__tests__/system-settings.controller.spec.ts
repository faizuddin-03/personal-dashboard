import { Test } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { SystemSettingsController } from '../system-settings.controller';
import { SystemSettingsService } from '../system-settings.service';

describe('SystemSettingsController', () => {
  let controller: SystemSettingsController;
  let service: { get: jest.Mock; set: jest.Mock };

  beforeEach(async () => {
    service = { get: jest.fn(), set: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [SystemSettingsController],
      providers: [{ provide: SystemSettingsService, useValue: service }],
    }).compile();
    controller = module.get(SystemSettingsController);
  });

  it('GET /system-settings returns the two known keys', async () => {
    service.get.mockImplementation((key: string, fallback: string) => {
      if (key === 'current_messaging_tier') return 'TIER_2';
      if (key === 'reply_attribution_window_days') return '14';
      return fallback;
    });
    const result = await controller.list();
    expect(result.currentMessagingTier).toBe('TIER_2');
    expect(result.replyAttributionWindowDays).toBe(14);
  });

  it('PATCH /system-settings updates supplied keys only', async () => {
    service.set.mockResolvedValue(undefined);
    service.get.mockImplementation((key: string, fallback: string) => fallback);
    await controller.update({ currentMessagingTier: 'TIER_3' });
    expect(service.set).toHaveBeenCalledWith('current_messaging_tier', 'TIER_3');
    expect(service.set).not.toHaveBeenCalledWith('reply_attribution_window_days', expect.anything());
  });

  it('PATCH /system-settings rejects invalid tier', async () => {
    await expect(controller.update({ currentMessagingTier: 'NOT_A_TIER' as any }))
      .rejects.toThrow(/invalid tier/i);
  });

  it('PATCH /system-settings rejects window <= 0 or > 30', async () => {
    await expect(controller.update({ replyAttributionWindowDays: 0 })).rejects.toThrow(/window/i);
    await expect(controller.update({ replyAttributionWindowDays: 31 })).rejects.toThrow(/window/i);
  });

  // --- Autopilot tests ---

  it('GET /system-settings returns parsed autopilot object', async () => {
    service.get.mockImplementation((key: string, fallback: string) => {
      const map: Record<string, string> = {
        current_messaging_tier: 'TIER_1',
        reply_attribution_window_days: '7',
        autopilot_enabled: 'false',
        autopilot_escalation_threshold: '80',
        autopilot_honour_stop: 'false',
        autopilot_after_hours: 'ESCALATE_ONLY',
      };
      return map[key] ?? fallback;
    });
    const result = await controller.list();
    expect(result.autopilot).toEqual({
      enabled: false,
      escalationThreshold: 80,
      honourStop: false,
      afterHours: 'ESCALATE_ONLY',
    });
  });

  it('GET /system-settings autopilot uses fallback defaults when keys absent', async () => {
    service.get.mockImplementation((_key: string, fallback: string) => fallback);
    const result = await controller.list();
    expect(result.autopilot).toEqual({
      enabled: true,
      escalationThreshold: 70,
      honourStop: true,
      afterHours: 'AWAY_THEN_ESCALATE',
    });
  });

  it('PATCH update({ autopilotEnabled: false }) calls set("autopilot_enabled","false")', async () => {
    service.set.mockResolvedValue(undefined);
    service.get.mockImplementation((_key: string, fallback: string) => fallback);
    await controller.update({ autopilotEnabled: false });
    expect(service.set).toHaveBeenCalledWith('autopilot_enabled', 'false');
  });

  it('PATCH update({ autopilotEnabled: true }) calls set("autopilot_enabled","true")', async () => {
    service.set.mockResolvedValue(undefined);
    service.get.mockImplementation((_key: string, fallback: string) => fallback);
    await controller.update({ autopilotEnabled: true });
    expect(service.set).toHaveBeenCalledWith('autopilot_enabled', 'true');
  });

  it('PATCH update({ autopilotHonourStop: false }) calls set("autopilot_honour_stop","false")', async () => {
    service.set.mockResolvedValue(undefined);
    service.get.mockImplementation((_key: string, fallback: string) => fallback);
    await controller.update({ autopilotHonourStop: false });
    expect(service.set).toHaveBeenCalledWith('autopilot_honour_stop', 'false');
  });

  it('PATCH update({ autopilotEscalationThreshold: 30 }) throws BadRequestException (< 40)', async () => {
    await expect(controller.update({ autopilotEscalationThreshold: 30 }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('PATCH update({ autopilotEscalationThreshold: 96 }) throws BadRequestException (> 95)', async () => {
    await expect(controller.update({ autopilotEscalationThreshold: 96 }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('PATCH update({ autopilotEscalationThreshold: 75 }) calls set with stringified value', async () => {
    service.set.mockResolvedValue(undefined);
    service.get.mockImplementation((_key: string, fallback: string) => fallback);
    await controller.update({ autopilotEscalationThreshold: 75 });
    expect(service.set).toHaveBeenCalledWith('autopilot_escalation_threshold', '75');
  });

  it('PATCH update({ autopilotAfterHours: "NOPE" }) throws BadRequestException', async () => {
    await expect(controller.update({ autopilotAfterHours: 'NOPE' as any }))
      .rejects.toBeInstanceOf(BadRequestException);
  });

  it('PATCH update({ autopilotAfterHours: "ESCALATE_ONLY" }) calls set correctly', async () => {
    service.set.mockResolvedValue(undefined);
    service.get.mockImplementation((_key: string, fallback: string) => fallback);
    await controller.update({ autopilotAfterHours: 'ESCALATE_ONLY' });
    expect(service.set).toHaveBeenCalledWith('autopilot_after_hours', 'ESCALATE_ONLY');
  });

  it('PATCH update({ autopilotAfterHours: "AWAY_THEN_ESCALATE" }) calls set correctly', async () => {
    service.set.mockResolvedValue(undefined);
    service.get.mockImplementation((_key: string, fallback: string) => fallback);
    await controller.update({ autopilotAfterHours: 'AWAY_THEN_ESCALATE' });
    expect(service.set).toHaveBeenCalledWith('autopilot_after_hours', 'AWAY_THEN_ESCALATE');
  });
});
