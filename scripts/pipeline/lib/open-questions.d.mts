// Types for scripts/pipeline/lib/open-questions.mjs (night enhancement round 9).
import type { Character, PipelineTicket, SavedAnswer } from "../../../lib/pipeline/types";

export interface OpenQuestion {
  character: Character; question: string; askedAt: string; jobId?: string;
  /** Who can answer (round 15): Faizuddin, or a question he forwards. */
  for?: "faizuddin" | "the BA" | "the developer" | "the team";
}
export declare function extractTeamQuestions(text: string): string[];
export declare function openQuestions(key: string, opts?: { ticket?: PipelineTicket | null; answers?: SavedAnswer[] }): OpenQuestion[];
