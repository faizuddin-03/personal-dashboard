import { Injectable } from '@nestjs/common';
import { LlmRouterService } from '../llm/llm-router.service';
import { applyLanguagePolicy } from './language-policy';

export interface Classification {
  intent: string;
  confidence: number;
  language: 'en' | 'ms';
}

@Injectable()
export class ClassifierService {
  constructor(private readonly llm: LlmRouterService) {}

  async classify(message: string): Promise<Classification> {
    if (!message?.trim()) return { intent: 'unknown', confidence: 0, language: 'en' };

    // No knowledge-base-derived intent list now; RAG handles topic matching.
    // We just need a coarse signal of language + whether the message is meaningful.
    const system = `You classify customer messages for a Malaysian WhatsApp business.
Detect the language ("en" for English, "ms" for Bahasa Malaysia) and the broad intent.
Language rule: return "ms" ONLY when the message is written entirely in Bahasa Malaysia. If it mixes English and Malay (Manglish) or is mostly English with a few Malay words (e.g. "kena", "boleh", "tak"), return "en". When unsure, return "en".
Intent should be one of: question, greeting, opt_out, complaint, compliment, gibberish, unknown.

Respond ONLY with valid JSON: {"intent": "...", "confidence": 0.0-1.0, "language": "en"|"ms"}.
Confidence reflects how sure you are about the language + intent classification, NOT whether you can answer.`;

    const res = await this.llm.complete(
      'classify',
      [
        { role: 'system', content: system },
        { role: 'user', content: message },
      ],
      { jsonMode: true, maxTokens: 100, temperature: 0 },
    );

    try {
      const parsed = JSON.parse(res.text);
      return {
        intent: typeof parsed.intent === 'string' ? parsed.intent : 'unknown',
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0,
        language: applyLanguagePolicy(message, parsed.language === 'ms' ? 'ms' : 'en'),
      };
    } catch {
      return { intent: 'unknown', confidence: 0, language: 'en' };
    }
  }
}
