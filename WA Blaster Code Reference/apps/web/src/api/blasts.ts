import { api } from './client';
import type { LanguagePreference, ContactFilter } from './contacts';

export type BlastStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELED';
export type BlastLanguageMode = 'PREFERENCE' | 'STATE';

export type { ContactFilter };

export interface StateLanguagePreview {
  uniqueContacts: number;
  totalMessages: number;
  byLanguage: Record<string, number>;
  byState: { state: string; contacts: number; languages: string[] }[];
  gaps: { language: string; requiredByStates: string[]; templateName: string }[];
}

export interface Blast {
  id: string;
  name: string;
  templateName: string;
  defaultLanguage: LanguagePreference;
  segmentId: string | null;
  recipientSnapshot: string[];
  variableMapping: Record<string, string>;
  scheduledAt: string;
  status: BlastStatus;
  totalRecipients: number;
  uniqueContacts: number;
  createdById: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface BlastStats {
  id: string;
  status: BlastStatus;
  totalRecipients: number;
  counts: Record<MessageStatus, number>;
  replied: number;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CreateBlastInput {
  name: string;
  templateName: string;
  defaultLanguage: LanguagePreference;
  segmentId?: string;
  audienceFilter?: ContactFilter;
  variableMapping: Record<string, string>;
  scheduledAt: string; // ISO
  languageMode?: BlastLanguageMode;
}

export async function listBlasts(status?: BlastStatus[]): Promise<Blast[]> {
  const { data } = await api.get<Blast[]>('/blasts', {
    params: status?.length ? { status } : undefined,
    paramsSerializer: { indexes: null },
  });
  return data;
}

export async function getBlast(id: string): Promise<Blast> {
  const { data } = await api.get<Blast>(`/blasts/${id}`);
  return data;
}

export async function getBlastStats(id: string): Promise<BlastStats> {
  const { data } = await api.get<BlastStats>(`/blasts/${id}/stats`);
  return data;
}

export async function createBlast(input: CreateBlastInput): Promise<Blast> {
  const { data } = await api.post<Blast>('/blasts', input);
  return data;
}

export async function previewStateLanguages(input: {
  templateName: string; defaultLanguage: string; segmentId?: string; audienceFilter?: ContactFilter;
}): Promise<StateLanguagePreview> {
  const { data } = await api.post<StateLanguagePreview>('/blasts/preview-state-languages', input);
  return data;
}

export async function cancelBlast(id: string): Promise<Blast> {
  const { data } = await api.post<Blast>(`/blasts/${id}/cancel`);
  return data;
}

export interface BlastMessage {
  id: string;
  contactName: string | null;
  contactPhone: string;
  status: MessageStatus;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  repliedAt: string | null;
}

export interface BlastMessagesPage {
  items: BlastMessage[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listBlastMessages(
  id: string,
  params: { status?: MessageStatus; page?: number; pageSize?: number } = {},
): Promise<BlastMessagesPage> {
  const { data } = await api.get<BlastMessagesPage>(`/blasts/${id}/messages`, { params });
  return data;
}

export async function retryBlastMessage(
  id: string,
  messageId: string,
): Promise<{ id: string; status: MessageStatus }> {
  const { data } = await api.post<{ id: string; status: MessageStatus }>(
    `/blasts/${id}/messages/${messageId}/retry`,
  );
  return data;
}

export async function retryFailedMessages(id: string): Promise<{ retried: number }> {
  const { data } = await api.post<{ retried: number }>(`/blasts/${id}/retry-failed`);
  return data;
}
