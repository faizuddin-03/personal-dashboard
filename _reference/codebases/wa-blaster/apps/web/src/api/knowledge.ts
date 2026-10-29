import { api } from './client';

export type DocStatus = 'DRAFT' | 'LIVE' | 'ARCHIVED';

export interface KnowledgeDocument {
  id: string;
  name: string;
  title: string;
  category: string;
  contentMd: string;
  wordCount: number;
  status: DocStatus;
  embeddingModel: string;
  capturedFromConversationId: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends KnowledgeDocument {
  chunkCount: number;
}

export interface ListDocumentsParams {
  category?: string;
  status?: DocStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ListDocumentsResult {
  items: KnowledgeDocument[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateDocumentDto {
  name: string;
  title: string;
  category: string;
  contentMd: string;
  autoIngest?: boolean;
}

export interface UpdateDocumentDto {
  name?: string;
  title?: string;
  category?: string;
  contentMd?: string;
  autoIngest?: boolean;
}

export interface UpdateResult {
  document: KnowledgeDocument;
  contentChanged: boolean;
  reingested: boolean;
}

export interface IngestResult {
  chunksCreated: number;
  embeddingModel: string;
  latencyMs: number;
}

export interface KnowledgeRecentUse {
  draftId: string;
  intent: string;
  draftConfidence: number;
  createdAt: string;
  contactName: string | null;
}

export interface KnowledgeStats {
  embeddings: number;
  citationsPerDay: number;
  draftsGroundedPct: number;
  recentUses: KnowledgeRecentUse[];
}

export async function listDocuments(params: ListDocumentsParams = {}): Promise<ListDocumentsResult> {
  const { data } = await api.get<ListDocumentsResult>('/chatbot/knowledge/documents', { params });
  return data;
}

export async function getDocument(id: string): Promise<DocumentDetail> {
  const { data } = await api.get<DocumentDetail>(`/chatbot/knowledge/documents/${id}`);
  return data;
}

export async function getDocumentStats(id: string): Promise<KnowledgeStats> {
  const { data } = await api.get<KnowledgeStats>(`/chatbot/knowledge/documents/${id}/stats`);
  return data;
}

export async function createDocument(dto: CreateDocumentDto): Promise<KnowledgeDocument> {
  const { data } = await api.post<KnowledgeDocument>('/chatbot/knowledge/documents', dto);
  return data;
}

export async function uploadDocument(file: File, category?: string): Promise<KnowledgeDocument> {
  const form = new FormData();
  form.append('file', file);
  if (category) form.append('category', category);
  const { data } = await api.post<KnowledgeDocument>('/chatbot/knowledge/documents/upload', form);
  return data;
}

export async function updateDocument(id: string, dto: UpdateDocumentDto): Promise<UpdateResult> {
  const { data } = await api.patch<UpdateResult>(`/chatbot/knowledge/documents/${id}`, dto);
  return data;
}

export async function deleteDocument(id: string): Promise<void> {
  await api.delete(`/chatbot/knowledge/documents/${id}`);
}

export async function publishDocument(id: string): Promise<KnowledgeDocument> {
  const { data } = await api.post<KnowledgeDocument>(`/chatbot/knowledge/documents/${id}/publish`);
  return data;
}

export async function unpublishDocument(id: string): Promise<KnowledgeDocument> {
  const { data } = await api.post<KnowledgeDocument>(`/chatbot/knowledge/documents/${id}/unpublish`);
  return data;
}

export async function reembedDocument(id: string): Promise<IngestResult> {
  const { data } = await api.post<IngestResult>(`/chatbot/knowledge/documents/${id}/reembed`);
  return data;
}
