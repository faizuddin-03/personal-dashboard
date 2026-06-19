import { Injectable, Logger } from '@nestjs/common';
import { LlmRouterService } from '../llm/llm-router.service';
import { LlmExhaustedException } from '../llm/llm-exhausted.exception';
import { FollowUpDetector } from './follow-up.detector';

type HistoryTurn = { role: 'customer' | 'bot' | 'operator'; body: string };

export type QueryStrategy = 'raw' | 'concat' | 'rewrite';

export interface ContextualizedQuery {
  searchQuery: string;
  strategy: QueryStrategy;
}

/** Cap the history rendered into the rewrite prompt — bounds tokens on the fast chain. */
const MAX_HISTORY_TURNS = 4;
const REWRITE_MAX_TOKENS = 80;

/**
 * Turns a customer's latest message into the best search query for RAG retrieval.
 *
 * Layer 1 (cheap gate, {@link FollowUpDetector}) decides whether to spend an LLM call. Layer 2 (the
 * LLM, on the fast `classify` chain) resolves references for genuine follow-ups and is told to
 * leave self-contained questions unchanged. Any failure degrades to concatenating the prior
 * customer message; this method NEVER throws — a bad rewrite must not break the answering path.
 */
@Injectable()
export class QueryContextualizerService {
  private readonly logger = new Logger(QueryContextualizerService.name);

  constructor(
    private readonly llm: LlmRouterService,
    private readonly detector: FollowUpDetector,
  ) {}

  async contextualize(message: string, history?: HistoryTurn[]): Promise<ContextualizedQuery> {
    const text = (message ?? '').trim();
    const turns = history ?? [];

    if (!this.detector.isFollowUp(text, turns)) {
      return this.log({ searchQuery: text, strategy: 'raw' });
    }

    try {
      const rewritten = await this.rewrite(text, turns);
      if (this.isValidRewrite(rewritten, text)) {
        return this.log({ searchQuery: rewritten, strategy: 'rewrite' });
      }
    } catch (e) {
      if (!(e instanceof LlmExhaustedException)) {
        this.logger.warn(`query_rewrite_failed: ${(e as Error).message}`);
      }
    }
    return this.log({ searchQuery: this.concat(text, turns), strategy: 'concat' });
  }

  private async rewrite(message: string, history: HistoryTurn[]): Promise<string> {
    const convo = history
      .slice(-MAX_HISTORY_TURNS)
      .map((t) => `${t.role === 'customer' ? 'Customer' : t.role === 'operator' ? 'Agent' : 'You'}: ${t.body}`)
      .join('\n');
    const system =
      "You rewrite a customer's latest WhatsApp message into ONE standalone search query for an insurance knowledge base.\n" +
      '- Use the recent conversation to resolve references (pronouns like "she/it", or omitted subjects like "what about if she is 18?").\n' +
      '- If the latest message is ALREADY a complete, self-contained question, output it unchanged.\n' +
      '- Output ONLY the search query text — no quotes, no explanation.';
    const user = `${convo}\nLatest message: ${message}`;
    const res = await this.llm.complete(
      'classify',
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0, maxTokens: REWRITE_MAX_TOKENS },
    );
    return (res.text ?? '').trim();
  }

  /** A real search query is non-empty and short; reject empties and rambling prompt-echoes. */
  private isValidRewrite(rewritten: string, original: string): boolean {
    if (!rewritten) return false;
    return rewritten.length <= Math.max(original.length, 40) + 200;
  }

  /** Prior customer question carries the topic; current message carries the changed parameter. */
  private concat(message: string, history: HistoryTurn[]): string {
    const priorCustomer = [...history].reverse().find((t) => t.role === 'customer');
    return priorCustomer ? `${priorCustomer.body} ${message}`.trim() : message;
  }

  private log(result: ContextualizedQuery): ContextualizedQuery {
    this.logger.log(
      `retrieval_query strategy=${result.strategy} query=${JSON.stringify(result.searchQuery.slice(0, 120))}`,
    );
    return result;
  }
}
