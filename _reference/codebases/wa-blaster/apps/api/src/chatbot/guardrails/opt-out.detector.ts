import { Injectable } from '@nestjs/common';

/**
 * Detects whether a CUSTOMER message is an opt-out request. Used by the decision engine (not as a
 * draft guardrail). Defaults below are hardcoded; Session 9's ChatbotSettingsService will be able
 * to override the keyword list per business.
 */
@Injectable()
export class OptOutDetector {
  private readonly patterns = [
    // English
    /\b(stop|unsubscribe|opt[- ]?out|remove me|leave me alone|no more messages|don't (text|message|contact) me)\b/i,
    // Bahasa Malaysia
    /\b(berhenti|jangan hantar|jangan ?msg|buang nombor|tak ?nak ?lagi|berhenti ?langgan)\b/i,
  ];

  detect(message: string): boolean {
    const text = (message ?? '').trim();
    if (!text) return false;
    return this.patterns.some((r) => r.test(text));
  }
}
