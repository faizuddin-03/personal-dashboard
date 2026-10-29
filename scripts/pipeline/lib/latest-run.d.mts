// Types for scripts/pipeline/lib/latest-run.mjs (night enhancement round 5).
import type { Finding } from "../../../lib/pipeline/types";
import type { SavedRun, SavedRunCheck } from "../store.mjs";

export interface NewerResult { runId: string; runLabel?: string; at: string; status: "passed" | "failed" | "partial" | "skipped" | "unknown" }

export declare function canonTs(s: string): string;
export declare function checkTsIds(check: Pick<SavedRunCheck, "title" | "tsLabel">): string[];
export declare function newerResult(key: string, finding: Finding): NewerResult | null;
export declare function markFindingsAfterRun(key: string, run: SavedRun): { marked: string[]; cleared: string[] };
export declare function newerPassLine(finding: Finding, r: NewerResult): string;
