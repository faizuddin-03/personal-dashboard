// Types for scripts/pipeline/store.mjs (QA pipeline shared store, 2026-10-27).
import type {
  Character, ChatEntry, Finding, JobAction, PipelineJob, PipelineStage, PipelineTicket,
  SageEvent, KnowledgeReview, PipelineImprovement, SavedAnswer, LearningRecord,
} from "../../lib/pipeline/types";

export declare const ROOT: string;
export declare const PIPE_DIR: string;
export declare const KEY_RE: RegExp;
/** Holder key for system jobs with no pipeline ticket ("KNOWLEDGE-0"); never has a ticket file. */
export declare const SYSTEM_KEY: string;
export declare const SYSTEM_ACTIONS: JobAction[];
export declare const CHARACTERS: Character[];
export declare const ACTIONS: JobAction[];

export declare function repoPath(rel: string): string;
export declare function relPath(abs: string): string;
/** Only data/pipeline, _reference/tickets, public/qa-artifacts; throws otherwise. */
export declare function safeResolve(rel: string): string;
export declare function nowIso(): string;

export declare function readTicket(key: string): PipelineTicket | null;
export declare function writeTicket(t: PipelineTicket): PipelineTicket;
export declare function updateTicket(
  key: string,
  fn: (t: PipelineTicket) => PipelineTicket | void,
): PipelineTicket | null;
export declare function listTickets(): PipelineTicket[];
export declare function ensureTicket(opts: {
  key: string;
  title?: string;
  addedBy?: PipelineTicket["addedBy"];
  jiraStatus?: string;
}): PipelineTicket;
export declare function removeTicket(key: string): boolean;
export declare function addEvent(key: string, text: string): PipelineTicket | null;

export declare function appendChat(
  key: string,
  character: Character,
  entry: Omit<ChatEntry, "at"> & { at?: string },
): ChatEntry;
export declare function readChat(key: string, character: Character): ChatEntry[];

export type StoredJob = PipelineJob & { input?: unknown };
export declare function createJob(opts: { key: string; action: JobAction; input?: unknown; system?: boolean }): StoredJob;
export declare function readJob(id: string): StoredJob | null;
export declare function updateJob(
  id: string,
  patch: Partial<StoredJob> | ((j: StoredJob) => Partial<StoredJob> | void),
): StoredJob | null;
export declare function listJobs(opts?: { key?: string; active?: boolean; limit?: number }): StoredJob[];
export declare function isTestKey(key: string): boolean;
export declare function spawnJob(id: string, extraArgs?: string[]): number | undefined;
export declare function queueJob(opts: { key: string; action: JobAction; input?: unknown; system?: boolean }): StoredJob;

/** sage:apply batches (sage-batch-apply): most changes one job holds. */
export declare const APPLY_BATCH_MAX: number;
/** Review ids a sage:apply job holds (input.reviewIds, or the older input.reviewId). */
export declare function applyIds(input: unknown): string[];
/** Queued/running with a live process (or only just made). */
export declare function jobIsLive(j: StoredJob | null | undefined): boolean;
/** The live sage:apply job holding this review item, or null. */
export declare function applyJobFor(reviewId: string): StoredJob | null;
/** Joins a queued sage:apply job for the same holder key (room permitting) or queues a new one. */
export declare function queueApply(opts: { reviewId: string; reviewKey: string; system?: boolean }): { job: StoredJob; joined: boolean };
/** Ended sage:apply job: its still-"approved" changes go to "error" (Approve again). Returns how many. */
export declare function releaseApply(jobId: string, reason?: string): number;
/** "approved" changes no live job holds (older than minAgeMs) go to "error". Returns how many. */
export declare function releaseStuckApprovals(opts?: { minAgeMs?: number }): number;

export declare function readFinding(key: string, id: string): Finding | null;
export declare function writeFinding(f: Finding): Finding;
export declare function listFindings(key: string): Finding[];

export declare const STAGE_ORDER: PipelineStage[];
export declare function raiseStage(t: PipelineTicket, stage: PipelineStage): PipelineTicket;
export declare function lockPath(key: string, character: Character): string;
export declare function lockHolder(key: string, character: Character): { pid: number; jobId: string; at: string } | null;
export declare const SLOTS_PER_CHARACTER: number;
/** Slots for one character (the Sage: 1). */
export declare function slotsFor(character: Character): number;
export declare function slotPath(character: Character, n: number): string;
export declare function takeSlot(character: Character, jobId: string): number | null;
export declare function dropSlot(character: Character, jobId: string): void;
export declare function busySlots(character: Character): number;
export declare function killPidTree(pid: number | undefined): void;
export declare function stopJob(id: string, by?: string): StoredJob | null;

/** One check of a saved run, as the runner page returned it. */
export interface SavedRunCheck {
  title: string;
  status?: string;
  tsLabel?: string;
  error?: string;
  friendlyError?: string;
  steps?: unknown[];
  evidence?: { label?: string; url?: string; kind?: string }[];
  video?: string;
  details?: unknown[];
  durationMs?: number;
}
/** data/pipeline/runs/<KEY>/<runId>.json — full result of one runner-page run. */
export interface SavedRun {
  key: string;
  runKey?: string;
  runId: string;              // client runId (useBackgroundRuns)
  serverRunId?: string;       // runId returned by the run route (artifact folder)
  runLabel?: string;
  startedAt?: string;
  finishedAt?: string;
  savedAt?: string;
  error?: string;
  meta?: Record<string, unknown>;
  checks: SavedRunCheck[];
  passed?: number;
  failed?: number;
  total?: number;
  video?: string;
  evidence?: { label?: string; url?: string; kind?: string }[];
  details?: unknown[];
  log?: string;               // tail of the run's raw output
}
export declare function isRunId(id: unknown): boolean;
export declare function writeRun(rec: SavedRun): SavedRun;
export declare function readRun(key: string, runId: string): SavedRun | null;
export declare function listRuns(key: string): SavedRun[];
export declare function findRun(key: string, id: string): SavedRun | null;

export interface JiraCreds { baseUrl: string; email: string; apiToken: string; accountId?: string }
export declare function jiraCreds(): JiraCreds | null;
export declare function jiraFetch(pathname: string, init?: RequestInit): Promise<Response>;

export declare function setupInfo(): { sharepointDir?: string | null; checkedAt?: string; [k: string]: unknown };
export declare function hashFile(p: string): string | null;

// ── Sage: knowledge keeper (2026-10-27, README §8) ──
export declare const SAGE_FILES: { review: string; improvements: string; learnings: string; answers: string };
export declare function newSageId(prefix: string): string;
export declare function readSageInbox(key: string): SageEvent[];
export declare function clearSageInbox(key: string, ids: string[]): number;
export declare function queueSage(key: string, opts?: { exceptJobId?: string }): StoredJob | null;
export declare function noteForSage(
  key: string,
  event: Partial<Omit<SageEvent, "id" | "at">> & { from?: string },
  opts?: { queue?: boolean },
): SageEvent | null;
type SageLists = { review: KnowledgeReview; improvements: PipelineImprovement; answers: SavedAnswer };
export declare function readSageList<K extends keyof SageLists>(which: K): SageLists[K][];
export declare function updateSageList<K extends keyof SageLists>(
  which: K,
  fn: (list: SageLists[K][]) => SageLists[K][] | void,
): SageLists[K][];
export declare function appendLearning(rec: Omit<LearningRecord, "at"> & { at?: string }): LearningRecord;
export declare function readLearnings(limit?: number): LearningRecord[];
