// Types for scripts/pipeline/lib/qa-issue.mjs (QA pipeline, 2026-10-27).
import type { Finding, PipelineTicket, QaIssueDraft } from "../../../lib/pipeline/types";

export interface DuplicateIssue { key: string; summary: string; status?: string }

export declare function buildAdf(draft: QaIssueDraft & { browser?: string }, ticket?: PipelineTicket | null): Record<string, unknown>;
export declare function duplicateWords(title: string): string;
export declare function duplicateJql(parent: string, title: string): string;
export declare function findDuplicates(parent: string, title: string): Promise<{ jql: string; issues: DuplicateIssue[] }>;
/** Names of the missing required fields (empty when the draft can be raised). */
export declare function checkDraft(draft: QaIssueDraft | null | undefined): string[];
/** Night round 28: advisory draft checks (invented IDs, long Actual, missing marks / source). */
export declare function lintDraft(draft: QaIssueDraft | null | undefined, evidenceText?: string): string[];
export declare function buildCreate(draft: QaIssueDraft, ticket?: PipelineTicket | null): {
  payload: { fields: Record<string, unknown> };
  hold: boolean;
  qaAccountId?: string;
  transitions: { id: string; to: string; why: string }[];
  comment: string | null;
};

export interface QaIssueDryRun {
  dryRun: true;
  payload: { fields: Record<string, unknown> };
  attachments: { path: string; name: string; size: number; skip?: string }[];
  transitions: { id: string; to: string; why: string }[];
  comment: string | null;
  duplicates: DuplicateIssue[];
  duplicateJql: string;
  duplicateCheckError?: string;
  finding?: string;
}
export interface QaIssueCreated {
  issueKey: string;
  url: string;
  warnings: string[];
  attached: string[];
  status?: string;
  assignee?: string;
}

/** Errors carry .status (400 / 409 / 502) and, for 409, .duplicates. */
export declare function createQaIssue(opts: {
  draft: QaIssueDraft;
  finding?: Finding | null;
  ticket?: PipelineTicket | null;
  dryRun?: boolean;
  allowDuplicate?: boolean;
}): Promise<QaIssueDryRun | QaIssueCreated>;
