import { Injectable } from '@nestjs/common';
import { LlmRouterService } from '../llm/llm-router.service';

/**
 * Generates a short knowledge-base article title from a customer question. Best-effort:
 * any failure or malformed model output falls back to a truncated copy of the question,
 * so capture never blocks on the title.
 */
@Injectable()
export class TitleGeneratorService {
  constructor(private readonly llm: LlmRouterService) {}

  async generate(question: string, language: 'en' | 'ms'): Promise<string> {
    if (!question?.trim()) throw new Error('Empty question');

    const fallback = question.trim().substring(0, 60);

    try {
      const lang = language === 'ms' ? 'Bahasa Malaysia' : 'English';
      const res = await this.llm.complete(
        'classify',
        [
          {
            role: 'system',
            content: `Generate a concise 5-10 word title in ${lang} that describes this customer question, suitable as a knowledge base article title. Return ONLY the title, no quotes, no explanation.`,
          },
          { role: 'user', content: question },
        ],
        { maxTokens: 30, temperature: 0.2 },
      );
      // Trim first so surrounding whitespace doesn't hide the quotes we want to strip.
      const cleaned = res.text.trim().replace(/^["']|["']$/g, '').trim();
      return cleaned.length > 0 && cleaned.length <= 100 ? cleaned : fallback;
    } catch {
      return fallback;
    }
  }
}
