import { api } from './client';

export interface CannedReply {
  id: string;
  title: string;
  body: string;
  category: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listCannedReplies(): Promise<CannedReply[]> {
  const { data } = await api.get<CannedReply[]>('/canned-replies');
  return data;
}

export async function createCannedReply(input: { title: string; body: string; category?: string }): Promise<CannedReply> {
  const { data } = await api.post<CannedReply>('/canned-replies', input);
  return data;
}

export async function updateCannedReply(id: string, input: { title?: string; body?: string; category?: string }): Promise<CannedReply> {
  const { data } = await api.patch<CannedReply>(`/canned-replies/${id}`, input);
  return data;
}

export async function deleteCannedReply(id: string): Promise<void> {
  await api.delete(`/canned-replies/${id}`);
}
