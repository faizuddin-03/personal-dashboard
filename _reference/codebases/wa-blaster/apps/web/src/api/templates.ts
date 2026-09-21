import { api } from './client';
import type { LanguagePreference } from './contacts';

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
export type ButtonType = 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';

export interface TemplateHeader {
  type: 'TEXT';
  text: string;
}

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface TemplateVariant {
  language: LanguagePreference;
  bodyText: string;
  header?: TemplateHeader;
  footerText?: string;
  buttons?: TemplateButton[];
  variables: string[];
}

export interface Template {
  id: string;
  name: string;
  version: number;
  language: LanguagePreference;
  category: TemplateCategory;
  bodyText: string;
  headerJson: TemplateHeader | null;
  footerText: string | null;
  buttonsJson: TemplateButton[] | null;
  variables: string[];
  metaTemplateId: string | null;
  status: TemplateStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  variants: TemplateVariant[];
}

export interface ListTemplatesFilter {
  search?: string;
  status?: TemplateStatus[];
  category?: TemplateCategory[];
}

export async function listTemplates(filter: ListTemplatesFilter): Promise<Template[]> {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.status?.length) params.status = filter.status;
  if (filter.category?.length) params.category = filter.category;
  const { data } = await api.get<Template[]>('/templates', {
    params,
    paramsSerializer: { indexes: null },
  });
  return data;
}

export async function getTemplateGroup(name: string): Promise<Template[]> {
  const { data } = await api.get<Template[]>(`/templates/group/${encodeURIComponent(name)}`);
  return data;
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template[]> {
  const { data } = await api.post<Template[]>('/templates', input);
  return data;
}

export interface UpdateTemplateInput {
  category: TemplateCategory;
  variants: TemplateVariant[];
}

export async function updateTemplateGroup(name: string, input: UpdateTemplateInput): Promise<Template[]> {
  const { data } = await api.patch<Template[]>(`/templates/group/${encodeURIComponent(name)}`, input);
  return data;
}

export async function submitTemplate(name: string, version: number): Promise<Template[]> {
  const { data } = await api.post<Template[]>(
    `/templates/${encodeURIComponent(name)}/${version}/submit`,
  );
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}

// ─── AI generation ────────────────────────────────────────────────────────────

export interface DraftSuggestion {
  language: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  approvalLikelihood: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}

export async function generateTemplates(input: {
  brief: string;
  languages: string[];
  tone: 'friendly' | 'formal';
}): Promise<DraftSuggestion[]> {
  const { data } = await api.post<DraftSuggestion[]>('/templates/generate', input);
  return data;
}

export interface SyncFromMetaResult {
  checked: number;
  imported: number;
  updated: number;
  categoryChanged: number;
  skipped: number;
}

export async function syncTemplates(): Promise<SyncFromMetaResult> {
  const { data } = await api.post<SyncFromMetaResult>('/templates/sync');
  return data;
}
