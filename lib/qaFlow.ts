// ── QA Flow (auto-study) client state ─────────────────────
// Per-ticket workflow state for the AI-assisted QA flow:
// study result, user answers, approvals, and an audit trail.
// Persisted in localStorage under "qa_flow_state".

export interface StudyAffectedArea {
  portal: string;
  pages: string[];
  whatChanges: string;
}

export interface StudyOpenQuestion {
  question: string;
  why: string;
  blocking: boolean;
}

export interface StudyResult {
  overview: string;
  changes: string[];
  affectedAreas: StudyAffectedArea[];
  testFocus: string[];
  risks: string[];
  outOfScope: string[];
  openQuestions: StudyOpenQuestion[];
  readyToProceed: boolean;
  confidenceNote: string;
}

export interface StudyMeta {
  issueKey: string;
  summary: string;
  attachmentsUsed: string[];
  attachmentsSkipped: string[];
  model: string;
}

export interface AuditEntry {
  ts: string;
  event: string;
}

export interface QaFlowTicketState {
  issueKey: string;
  summary?: string;
  study?: StudyResult;
  meta?: StudyMeta;
  studiedAt?: string;
  /** Keyed by question text; the user's answers to open questions. */
  answers: Record<string, string>;
  extraNotes: string;
  approved: boolean;
  approvedAt?: string;
  audit: AuditEntry[];
}

export type QaFlowState = Record<string, QaFlowTicketState>;

const KEY = "qa_flow_state";

export function getQaFlowState(): QaFlowState {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { return {}; }
}

export function saveQaFlowState(state: QaFlowState) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function emptyTicketState(issueKey: string): QaFlowTicketState {
  return { issueKey, answers: {}, extraNotes: "", approved: false, audit: [] };
}

export function addAudit(t: QaFlowTicketState, event: string): QaFlowTicketState {
  return { ...t, audit: [...t.audit, { ts: new Date().toISOString(), event }] };
}
