import { Injectable } from '@nestjs/common';

/**
 * Detects whether a CUSTOMER message reads as a complaint, so the decision engine can route it to
 * a human rather than auto-answering. Hardcoded defaults for now (Session 9 settings can override).
 */
@Injectable()
export class ComplaintDetector {
  private readonly patterns = [
    // English
    /\b(complaint|complain|terrible|awful|worst|refund|scam|cheat|fraud|angry|furious|disappointed|unacceptable|useless|rubbish)\b/i,
    // Bahasa Malaysia
    /\b(komplen|aduan|teruk|tipu|menipu|penipu|marah|kecewa|tak ?puas ?hati|lambat ?sangat|hampeh)\b/i,
  ];

  detect(message: string): boolean {
    const text = (message ?? '').trim();
    if (!text) return false;
    return this.patterns.some((r) => r.test(text));
  }
}
