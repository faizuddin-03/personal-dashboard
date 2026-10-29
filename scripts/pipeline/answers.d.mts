// Types for scripts/pipeline/answers.mjs (answer registry, 2026-10-27).
import type { PipelineTicket, SavedAnswer } from "../../lib/pipeline/types";

export declare const MATCH_AT: number;
export declare const NEAR_AT: number;
export declare const MIN_SHARED: number;
export declare function sharedWords(a: string, b: string): number;
export declare function normQuestion(q: string): string;
export declare function similarity(a: string, b: string): number;
export declare function extractQuestions(text: string): string[];
export declare function scopeApplies(scope: string, ticket: Pick<PipelineTicket, "key" | "title"> | null): boolean;
export declare function bestAnswer(
  question: string,
  ticket: Pick<PipelineTicket, "key" | "title"> | null,
  answers: SavedAnswer[],
): { entry: SavedAnswer; score: number; shared: number; match: boolean } | null;
/** Night round 17: a reply that only parks the question ("later", "ignore first"). */
export declare const DEFER_RE: RegExp;
export declare function isDeferral(text: string): boolean;
/** Night round 16: best full match in any scope (for "answered on another ticket" hints). */
export declare function bestAnswerAnyScope(
  question: string,
  answers: SavedAnswer[],
  skipId?: string,
): { entry: SavedAnswer; score: number; shared: number } | null;
export declare function autoAnswer(opts: { store: unknown; job: unknown; text: string }): {
  answered: { question: string; entry: SavedAnswer; score: number }[];
  remaining: string[];
  continued: unknown;
};
