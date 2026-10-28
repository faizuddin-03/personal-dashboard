// Types for scripts/pipeline/lib/official-ts.mjs (official TS status writer, 2026-10-27).

export type TsStatus = "In Progress" | "Pass" | "Fail";
export declare const TS_STATUSES: TsStatus[];
export declare const LOCKED_ERROR: string;

export declare function canonTs(id: string, key?: string): string | null;
export declare function tsIdsIn(text: string): string[];
export declare function keysInName(name: string): string[];
export declare function isTestPath(p: string): boolean;

export declare function findOfficialWorkbook(
  key: string,
  opts?: { dir?: string },
): { file: string | null; candidates: string[]; error?: string };

export interface StatusRow { ts: string; canon: string; row: number; address: string; status: string; formula: boolean }
export interface StatusSheet { name: string; headerRow: number; tsCol: number; statusCol: number; statusHeader: string; rows: StatusRow[] }

export declare function readStatusMap(file: string, key?: string): Promise<
  | { ok: true; file: string; sheets: StatusSheet[]; map: Record<string, string>; warnings: string[] }
  | { ok: false; file: string; error: string; locked?: boolean }
>;

export interface StatusChange { ts: string; sheet: string; cell: string; from: string; to: string }
export interface WriteResult {
  ok: boolean;
  file?: string;
  changed?: StatusChange[];
  unchanged?: string[];
  missing?: string[];
  warnings?: string[];
  backup?: string;
  dryRun?: boolean;
  locked?: boolean;
  queued?: boolean;
  restored?: boolean;
  candidates?: string[];
  error?: string;
  /** Set when the same status for the same run was already written (repeat post). */
  skipped?: "duplicate";
  /** TS left out because they were repeats. */
  skippedTs?: string[];
}

export declare function writeStatus(
  file: string,
  opts: { ts: string[]; status: TsStatus; key?: string; runId?: string; dryRun?: boolean },
): Promise<WriteResult>;

export declare function syncStatus(opts: {
  key: string;
  ts: string[] | string;
  status: TsStatus;
  runId?: string;
  targetPath?: string;
  dryRun?: boolean;
  retry?: boolean;
}): Promise<WriteResult>;

export interface SyncLogEntry {
  at: string;
  key: string;
  ts: string[];
  status: TsStatus;
  runId: string | null;
  file?: string;
  test?: boolean;
  dryRun?: boolean;
  retry?: boolean;
  ok: boolean;
  changed?: StatusChange[];
  unchanged?: string[];
  missing?: string[];
  backup?: string;
  error?: string;
  skipped?: "duplicate";
}
export declare function readSyncLog(key?: string, limit?: number): SyncLogEntry[];

export interface PendingWrite {
  key: string; ts: string[]; status: TsStatus; runId: string | null; targetPath: string | null;
  queuedAt: string; attempts: number; lastError?: string; lastTriedAt?: string;
}
export declare function readPending(): PendingWrite[];
export declare function retryPending(opts?: { key?: string }): Promise<{ key: string; ts: string[]; status: TsStatus; ok: boolean; error?: string }[]>;
