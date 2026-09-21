import { api } from './client';

export type AutopilotAction = 'AUTO_REPLIED' | 'ESCALATED' | 'OPTED_OUT' | 'SKIPPED';

export interface AutopilotEventContact {
  id: string;
  name: string | null;
  phoneE164: string;
}

export interface AutopilotEvent {
  id: string;
  contactId: string;
  inboundMessageId: string;
  action: AutopilotAction;
  intent: string | null;
  confidence: number | null;
  reason: string | null;
  matchedKbDocId: string | null;
  model: string | null;
  replyText: string | null;
  createdAt: string;
  contact: AutopilotEventContact | null;
  matchedKbSlug: string | null;
}

export async function listAutopilotEvents(params?: {
  action?: string;
  contactId?: string;
}): Promise<AutopilotEvent[]> {
  const { data } = await api.get<AutopilotEvent[]>('/autopilot/events', { params });
  return data;
}
