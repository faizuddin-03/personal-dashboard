import { api } from './client';
import type { Contact } from './contacts';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
export type TicketReason = 'COMPLAINT' | 'LOW_CONFIDENCE' | 'KNOWLEDGE_GAP' | 'SENSITIVE';

export interface TicketAssignee {
  id: string;
  name: string;
  email: string;
}

export interface Ticket {
  id: string;
  seq: number;
  num: string;
  contactId: string;
  status: TicketStatus;
  reason: TicketReason;
  intent: string;
  assigneeId: string | null;
  openedAt: string;
  assignedAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  contact: Contact;
  assignee: TicketAssignee | null;
}

export interface KnowledgeSuggestion {
  ticketId: string;
  question: string;
  answer: string;
  suggestedSlug: string;
  category: string;
}

export interface CreateKnowledgeCandidateDto {
  question: string;
  answer: string;
  slug: string;
  category: string;
}

export type CloseDisposition = 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP';

export interface ResolveTicketOptions {
  disposition?: CloseDisposition;
  resolutionNotes?: string;
  editedAnswer?: string;
}

export async function listTickets(params: {
  tab?: 'active' | 'closed';
  status?: string[];
  assigneeId?: string;
}): Promise<Ticket[]> {
  const { tab, status, assigneeId } = params;
  const p: Record<string, unknown> = {};
  if (tab) p.tab = tab;
  if (status?.length) p.status = status;
  if (assigneeId) p.assigneeId = assigneeId;
  const { data } = await api.get<Ticket[]>('/tickets', {
    params: p,
    paramsSerializer: { indexes: null },
  });
  return data;
}

export async function getTicket(id: string): Promise<Ticket> {
  const { data } = await api.get<Ticket>(`/tickets/${id}`);
  return data;
}

export async function assignTicket(id: string, assigneeId?: string): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/tickets/${id}/assign`, { assigneeId });
  return data;
}

export async function resolveTicket(id: string, opts: ResolveTicketOptions = {}): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/tickets/${id}/resolve`, opts);
  return data;
}

export async function closeTicket(id: string, opts: ResolveTicketOptions = {}): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/tickets/${id}/close`, opts);
  return data;
}

export async function reopenTicket(id: string): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/tickets/${id}/reopen`);
  return data;
}

export async function getKnowledgeSuggestion(id: string): Promise<KnowledgeSuggestion> {
  const { data } = await api.get<KnowledgeSuggestion>(`/tickets/${id}/knowledge-suggestion`);
  return data;
}

export async function createKnowledgeCandidate(
  id: string,
  dto: CreateKnowledgeCandidateDto,
): Promise<void> {
  await api.post(`/tickets/${id}/knowledge-candidate`, dto);
}

export interface SuggestedKnowledge {
  id: string;
  slug: string;
  question: string;
  answer: string;
  category: string;
}

export interface AgentContext {
  intent: string | null;
  reason: TicketReason;
  confidence: number | null;
  escalatedAt: string;
  suggestedKnowledge: SuggestedKnowledge[];
}

export interface SuggestedReply {
  text: string;
  confidence: number;
}

export async function getAgentContext(id: string): Promise<AgentContext> {
  const { data } = await api.get<AgentContext>(`/tickets/${id}/agent-context`);
  return data;
}

export async function suggestReply(id: string): Promise<SuggestedReply> {
  const { data } = await api.post<SuggestedReply>(`/tickets/${id}/suggest-reply`);
  return data;
}
