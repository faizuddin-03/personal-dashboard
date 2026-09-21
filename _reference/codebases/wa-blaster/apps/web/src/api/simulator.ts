import { api } from './client';

export interface SimCitation {
  documentTitle: string;
  category: string;
  similarityScore: number;
  rank: number;
}

export interface SimResult {
  phoneE164: string;
  text: string;
  kind: string;
  subKind: string;
  reason: string;
  intent: string | null;
  intentConfidence: number | null;
  draftConfidence: number | null;
  modelUsed: string | null;
  embeddingModelUsed: string | null;
  chunksRetrieved: number;
  topChunkScore: number | null;
  totalLatencyMs: number;
  retrievalLatencyMs: number | null;
  customerReply: string | null;
  operatorDraft: string | null;
  citations: SimCitation[];
}

export interface ThreadItem {
  id: string;
  at: string;
  direction: 'incoming' | 'outgoing';
  kind: 'chat_inbound' | 'bot_reply' | 'operator_reply' | 'blast';
  body: string;
  meta?: { subKind?: string; status?: string; templateName?: string; language?: string };
}

export interface ThreadResponse {
  phone: string;
  contactId: string | null;
  items: ThreadItem[];
}

export interface SimStatus {
  simulatorEnabled: boolean;
  whatsappMock: boolean;
  llmMock: boolean;
  embeddingsMock: boolean;
  chatbotEnabled: boolean;
}

export async function simulateInbound(phone: string, text: string): Promise<SimResult> {
  const { data } = await api.post<SimResult>('/sim/inbound', { phone, text });
  return data;
}

export async function getSimThread(phone: string): Promise<ThreadResponse> {
  const { data } = await api.get<ThreadResponse>(`/sim/thread/${encodeURIComponent(phone)}`);
  return data;
}

export async function resetSim(phone: string): Promise<{ deletedConversations: number }> {
  const { data } = await api.post<{ deletedConversations: number }>(`/sim/reset/${encodeURIComponent(phone)}`);
  return data;
}

export async function getSimStatus(): Promise<SimStatus> {
  const { data } = await api.get<SimStatus>('/sim/status');
  return data;
}
