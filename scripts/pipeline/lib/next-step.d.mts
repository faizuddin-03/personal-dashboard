// Types for scripts/pipeline/lib/next-step.mjs (night enhancement round 7).
import type { Finding, PipelineTicket } from "../../../lib/pipeline/types";
import type { SavedRun, StoredJob } from "../store.mjs";
import type { readBrief } from "./brief.mjs";
import type { OpenQuestion } from "./open-questions.mjs";
import type { DeferredQuestion } from "./deferred-questions.mjs";

export interface NextStep {
  who: "faizuddin" | "scout" | "scribe" | "elf" | "dwarf" | "sage" | "none";
  waitingOn: "faizuddin" | "work" | "none";
  action: string;
  also: string[];
  stage: PipelineTicket["stage"] | null;
  /** For a stalled automatic step: the character whose step stalled. */
  character?: "scout" | "scribe" | "elf" | "dwarf" | "sage";
}
export declare function nextStep(
  ticketOrKey: PipelineTicket | string,
  parts?: { jobs?: StoredJob[]; findings?: Finding[]; runs?: SavedRun[]; brief?: ReturnType<typeof readBrief>; questions?: OpenQuestion[]; parked?: DeferredQuestion[] },
): NextStep;
export declare function nextLine(t: PipelineTicket): string;
