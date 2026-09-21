import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from '../knowledge/retrieval.service';
import { GuardResult } from './length.guard';

/**
 * Catches hallucinated prices/timelines: any numeric token in the draft that the model did not
 * see in a retrieved chunk is suspect. A small safelist covers numbers that legitimately appear
 * in phrasing rather than facts — counts ("3 days"), clock hours ("9am", "open till 12"), and the
 * ubiquitous "24 hours". Prices (RM50, RM99) and uncommon timelines fall outside it and fail.
 */
@Injectable()
export class NoUnknownPromisesGuard {
  // 0–12 (counts, list items, clock hours) plus 24 (the "24 hours" idiom).
  private readonly safelist = new Set(
    [...Array.from({ length: 13 }, (_, i) => String(i)), '24'],
  );

  check(body: string, chunks: RetrievedChunk[], extraGroundingText?: string): GuardResult {
    const chunkNumbers = new Set([
      ...chunks.flatMap((c) => this.extractNumbers(c.text)),
      ...this.extractNumbers(extraGroundingText ?? ''),
    ]);

    for (const num of this.extractNumbers(body)) {
      if (this.safelist.has(num)) continue;
      if (!chunkNumbers.has(num)) {
        return { ok: false, reason: `unknown_promise:${num}` };
      }
    }
    return { ok: true, reason: '' };
  }

  private extractNumbers(text: string): string[] {
    return (text ?? '').match(/\d+/g) ?? [];
  }
}
