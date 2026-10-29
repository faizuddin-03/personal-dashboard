import { api } from './client';

export interface SystemSettings {
  currentMessagingTier: number;
  replyAttributionWindowDays: number;
  autopilot: {
    enabled: boolean;
    escalationThreshold: number;
    honourStop: boolean;
    afterHours: 'AWAY_THEN_ESCALATE' | 'ESCALATE_ONLY';
  };
}

export interface UpdateSystemSettingsInput {
  currentMessagingTier?: number;
  replyAttributionWindowDays?: number;
  autopilotEnabled?: boolean;
  autopilotEscalationThreshold?: number;
  autopilotHonourStop?: boolean;
  autopilotAfterHours?: 'AWAY_THEN_ESCALATE' | 'ESCALATE_ONLY';
}

export async function getSystemSettings(): Promise<SystemSettings> {
  const { data } = await api.get<SystemSettings>('/system-settings');
  return data;
}

export async function updateSystemSettings(
  patch: UpdateSystemSettingsInput,
): Promise<SystemSettings> {
  const { data } = await api.patch<SystemSettings>('/system-settings', patch);
  return data;
}
