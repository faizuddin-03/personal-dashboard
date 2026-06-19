import { api } from './client';

export type KnowledgeSource = 'SYNCED' | 'FROM_ESCALATION';
export type KnowledgeStatus = 'PUBLISHED' | 'CANDIDATE' | 'DISMISSED';

export interface KnowledgeDoc {
  id: string;
  slug: string;
  question: string;
  answer: string;
  category: string;
  source: KnowledgeSource;
  status: KnowledgeStatus;
  uses: number;
  ticketId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListKnowledgeParams {
  source?: KnowledgeSource;
  category?: string;
  q?: string;
}

export interface UpdateKnowledgeDto {
  question?: string;
  answer?: string;
  category?: string;
  slug?: string;
}

export async function listKnowledge(params?: ListKnowledgeParams): Promise<KnowledgeDoc[]> {
  const { data } = await api.get<KnowledgeDoc[]>('/knowledge', { params });
  return data;
}

export async function listCandidates(): Promise<KnowledgeDoc[]> {
  const { data } = await api.get<KnowledgeDoc[]>('/knowledge/candidates');
  return data;
}

export async function updateKnowledge(id: string, dto: UpdateKnowledgeDto): Promise<KnowledgeDoc> {
  const { data } = await api.patch<KnowledgeDoc>('/knowledge/' + id, dto);
  return data;
}

export async function publishKnowledge(id: string): Promise<KnowledgeDoc> {
  const { data } = await api.post<KnowledgeDoc>('/knowledge/' + id + '/publish');
  return data;
}

export async function dismissKnowledge(id: string): Promise<KnowledgeDoc> {
  const { data } = await api.post<KnowledgeDoc>('/knowledge/' + id + '/dismiss');
  return data;
}

export async function reindexKnowledge(id: string): Promise<KnowledgeDoc> {
  const { data } = await api.post<KnowledgeDoc>('/knowledge/' + id + '/reindex');
  return data;
}
