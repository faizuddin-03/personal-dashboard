// Types for scripts/pipeline/lib/brief.mjs (ticket brief, 2026-10-27).
import type { TicketBrief } from "../../../lib/pipeline/types";

export declare function briefRel(key: string): string;
export declare function briefSchemaText(key: string): string;
export declare function briefTaskText(key: string): string;
export declare function briefChatNote(key: string): string;
export declare function checkBrief(b: unknown, key?: string): { ok: boolean; missing: string[] };
export declare function readBrief(key: string): {
  rel: string;
  exists: boolean;
  brief: TicketBrief | null;
  ok: boolean;
  missing: string[];
};
export declare function linkBrief(store: unknown, key: string): ReturnType<typeof readBrief>;
export declare function briefCoverageBlock(key: string): string;
