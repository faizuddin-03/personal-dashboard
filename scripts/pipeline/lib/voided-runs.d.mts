// Types for scripts/pipeline/lib/voided-runs.mjs (night enhancement round 12).
export interface VoidedRun { key: string; runId: string; ts?: string; reason: string; voidedBy: string; voidedOn: string }
export declare function readVoided(): VoidedRun[];
export declare function voidedFor(key: string, runId: string | undefined, ts?: string): VoidedRun | null;
export declare function isRunVoided(key: string, runId: string): boolean;
export declare function voidRun(opts: { key: string; runId: string; ts?: string; reason: string; by: string }): VoidedRun;
export declare function unvoidRun(opts: { key: string; runId: string; ts?: string; by?: string }): boolean;
