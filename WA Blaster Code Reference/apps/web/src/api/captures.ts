import { api } from './client';
import type { DocStatus } from './knowledge';

export type CaptureStatus =
  | 'pending'
  | 'captured_live'
  | 'captured_draft'
  | 'skipped_by_operator'
  | 'skipped_duplicate'
  | 'failed'
  | 'discarded';

export type CaptureDisposition = 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP';

export type CaptureBucket = 'pending' | 'captured' | 'archived';

export const CAPTURE_STATUSES_BY_BUCKET: Record<CaptureBucket, CaptureStatus[]> = {
  pending: ['pending'],
  captured: ['captured_live', 'captured_draft'],
  archived: ['discarded', 'skipped_by_operator', 'skipped_duplicate', 'failed'],
};

export interface CaptureDocumentSummary {
  id: string;
  title: string;
  category: string;
  status: DocStatus;
}

export interface CaptureContactSummary {
  name: string | null;
}

export interface CaptureConversationSummary {
  id: string;
  contact: CaptureContactSummary | null;
}

export interface ResolutionCapture {
  id: string;
  status: CaptureStatus;
  disposition: CaptureDisposition;
  closedAt: string;
  conversationId: string;
  documentId: string | null;
  duplicateOfId: string | null;
  forcedDespiteDuplicate: boolean;
  failureReason: string | null;
  resolutionNotes: string | null;
  closedByUserId: string;
  editedAnswer: string | null;
  createdAt: string;
  updatedAt: string;
  document: CaptureDocumentSummary | null;
  conversation: CaptureConversationSummary | null;
}

export interface ListCapturesParams {
  status?: CaptureStatus;
  disposition?: CaptureDisposition;
  from?: string;   // ISO-8601
  to?: string;     // ISO-8601
  page?: number;
  limit?: number;
}

export interface ListCapturesResult {
  items: ResolutionCapture[];
  total: number;
  page: number;
  limit: number;
}

export interface CapturePreviewResult {
  proposedTitle: string;
  proposedContentMd: string;
  duplicates: Array<{ documentId: string; documentTitle: string; similarityScore: number }>;
}

export interface PromoteCaptureResult {
  capture: ResolutionCapture;
  document: import('./knowledge').KnowledgeDocument;
}

export interface DuplicateConflictBody {
  code: 'DUPLICATE';
  duplicate: {
    documentId: string;
    documentTitle: string;
    similarityScore: number;
  };
  message?: string;
}

export async function listCaptures(params: ListCapturesParams = {}): Promise<ListCapturesResult> {
  const { data } = await api.get<ListCapturesResult>('/chatbot/captures', { params });
  return data;
}

export async function getCapture(id: string): Promise<ResolutionCapture> {
  const { data } = await api.get<ResolutionCapture>(`/chatbot/captures/${id}`);
  return data;
}

export async function previewCapture(conversationId: string): Promise<CapturePreviewResult> {
  const { data } = await api.post<CapturePreviewResult>('/chatbot/captures/preview', { conversationId });
  return data;
}

export async function promoteCapture(
  id: string,
  opts: { forcedDespiteDuplicate?: boolean } = {},
): Promise<PromoteCaptureResult> {
  const { data } = await api.post<PromoteCaptureResult>(`/chatbot/captures/${id}/promote`, opts);
  return data;
}

export async function discardCapture(id: string, reason?: string): Promise<ResolutionCapture> {
  const { data } = await api.post<ResolutionCapture>(`/chatbot/captures/${id}/discard`, { reason });
  return data;
}
