// Types for scripts/pipeline/lib/deferred-questions.mjs (night enhancement round 17).
import type { Character } from "../../../lib/pipeline/types";

export interface DeferredQuestion { askedBy: Character; question: string; deferredAt: string; reply: string; to: Character[] }
export declare function isDeferral(text: string): boolean;
export declare function deferredQuestions(key: string, opts?: { since?: string }): DeferredQuestion[];
export declare function deferredBlock(key: string, character: Character): string;
