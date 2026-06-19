import { api } from './client';

export type PlanLanguage = 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

export interface TemplateSpecReuse { mode: 'reuse'; name: string }
export interface TemplateSpecCreate {
  mode: 'create'; name: string; category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  languages: PlanLanguage[]; bodyText: string; variables: string[];
}
export interface AssistantPlanInput {
  intent: 'reuse_and_schedule' | 'create_and_schedule';
  campaignName: string;
  template: TemplateSpecReuse | TemplateSpecCreate;
  audience: { segmentId: string };
  defaultLanguage: PlanLanguage;
  variableMapping: Record<string, string>;
  schedule: { sendAt: string };
}
export interface StagedPlan {
  id: string;
  status: 'PENDING_APPROVAL' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED';
  plan: AssistantPlanInput;
  expiresAt: string;
}
export interface ChatHistoryItem { role: 'user' | 'assistant'; content: string }
export interface ChatResult { reply: string; plan?: StagedPlan }
export interface ApproveResult { blastId: string; templateName: string }

export const sendAssistantMessage = (body: { message: string; history: ChatHistoryItem[] }) =>
  api.post<ChatResult>('/assistant/chat', body).then((r) => r.data);

export const approvePlan = (id: string) =>
  api.post<ApproveResult>(`/assistant/plans/${id}/approve`).then((r) => r.data);

export const cancelPlan = (id: string) =>
  api.post<StagedPlan>(`/assistant/plans/${id}/cancel`).then((r) => r.data);
