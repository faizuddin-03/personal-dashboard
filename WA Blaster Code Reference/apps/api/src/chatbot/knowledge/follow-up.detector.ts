import { Injectable } from '@nestjs/common';

type HistoryTurn = { role: 'customer' | 'bot' | 'operator'; body: string };

/** Messages with <= this many words are treated as possible ellipses. A code constant, not a setting. */
const MAX_FOLLOW_UP_WORDS = 8;

/**
 * Cue phrases that lean on prior context: a leading conjunction ("and night towing?", "but for a
 * lorry?") or a comparison opener ("what about…", "how about if…", "and if…"). Catches follow-ups
 * that are longer than the word threshold.
 */
const CUE =
  /(^\s*(and|but|or|so|also|then)\b)|\b(what about|how about|and if|what if|and for|but if|how about if|what about if)\b/i;

/**
 * Cheap, deterministic recall gate (Layer 1): decides only whether a message is worth an LLM
 * rewrite call, NOT whether it is definitively a follow-up. Over-flagging is intentional and
 * harmless — the rewrite step (Layer 2) leaves self-contained questions unchanged. Mirrors the
 * pure-detector pattern of YesNoDetector / OptOutDetector.
 */
@Injectable()
export class FollowUpDetector {
  isFollowUp(message: string, history?: HistoryTurn[]): boolean {
    const text = (message ?? '').trim();
    if (!text) return false;
    // Nothing to contextualize against without a prior customer turn.
    if (!(history ?? []).some((t) => t.role === 'customer')) return false;
    const wordCount = text.split(/\s+/).length;
    return wordCount <= MAX_FOLLOW_UP_WORDS || CUE.test(text);
  }
}
