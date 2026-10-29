import { Injectable } from '@nestjs/common';
import { GuardResult } from './length.guard';

/**
 * Fails if the draft outs itself as an AI/bot/automated system. The bot must read as a human
 * support agent (EN + common BM phrasings covered).
 */
@Injectable()
export class NoAiSelfReferenceGuard {
  private readonly pattern =
    /\b(I am an? (AI|bot|assistant|chatbot)|automated (system|response|reply)|I'm an? (AI|bot)|saya bot|saya AI)\b/i;

  check(body: string): GuardResult {
    if (this.pattern.test(body ?? '')) {
      return { ok: false, reason: 'ai_self_reference' };
    }
    return { ok: true, reason: '' };
  }
}
