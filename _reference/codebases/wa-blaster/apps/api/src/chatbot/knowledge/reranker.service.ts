import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmRouterService } from '../llm/llm-router.service';
import { LlmExhaustedException } from '../llm/llm-exhausted.exception';
import { RetrievedChunk } from './retrieval.service';

/** Cap candidate text fed to the judge — bounds tokens on the fast classify chain. */
const MAX_CHARS_PER_CHUNK = 600;
const JUDGE_MAX_TOKENS = 128;

/**
 * Reorders dense-retrieval candidates by ACTUAL relevance to the question (does this passage
 * answer it?) rather than keyword density, so the answer chunk reaches the top-N the drafter sees.
 *
 * Best-effort, like {@link QueryContextualizerService}: gated by CHATBOT_RERANK_ENABLED and NEVER
 * throws. Any failure (disabled, LLM exhaustion, bad JSON, no valid indices) degrades to the
 * original dense order. similarityScore is left as the dense cosine score (reranking reorders; it
 * does not fabricate scores); only `rank` is reassigned to a contiguous 1..N so the drafter's
 * rank → chunkId citation mapping stays valid.
 */
@Injectable()
export class RerankerService {
  private readonly logger = new Logger(RerankerService.name);
  private readonly enabledFlag: boolean;
  private readonly candidateK: number;
  private readonly topN: number;

  constructor(
    private readonly llm: LlmRouterService,
    config: ConfigService,
  ) {
    this.enabledFlag = config.get<string>('CHATBOT_RERANK_ENABLED', 'false') === 'true';
    this.candidateK = Number(config.get('CHATBOT_RERANK_CANDIDATE_K', 20));
    this.topN = Number(config.get('CHATBOT_RERANK_TOP_N', 5));
    if (this.enabledFlag && this.candidateK < this.topN) {
      this.logger.warn(
        `CHATBOT_RERANK_CANDIDATE_K (${this.candidateK}) < CHATBOT_RERANK_TOP_N (${this.topN}); ` +
          'the reranker can only hand the drafter as many chunks as were retrieved.',
      );
    }
  }

  get enabled(): boolean {
    return this.enabledFlag;
  }

  /**
   * How wide the caller should retrieve before reranking: candidateK when enabled, else undefined
   * (so RetrievalService keeps its own default top-K — zero behavior change when off).
   */
  fetchTopK(): number | undefined {
    return this.enabledFlag ? this.candidateK : undefined;
  }

  async rerank(query: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
    if (!this.enabledFlag || chunks.length <= 1) return this.denseTopN(chunks);

    try {
      const order = await this.judge(query, chunks);
      const reordered = this.applyOrder(chunks, order);
      this.logger.log(
        `rerank applied: ${chunks.length} candidates → top ${reordered.length} (judge picked ${order.length})`,
      );
      return reordered;
    } catch (e) {
      if (!(e instanceof LlmExhaustedException)) {
        this.logger.warn(`rerank_failed (dense fallback): ${(e as Error).message}`);
      }
      return this.denseTopN(chunks);
    }
  }

  /**
   * Ask the judge for the helpful candidate indices, most-helpful first. Returns 0-based indices
   * into `chunks`, in the judge's ranked order (NOT deduped — applyOrder dedupes). Throws
   * (→ dense fallback) on bad/empty JSON or when no valid index survives.
   */
  private async judge(query: string, chunks: RetrievedChunk[]): Promise<number[]> {
    const candidates = chunks
      .map((c, i) => `[${i + 1}] ${c.text.slice(0, MAX_CHARS_PER_CHUNK).replace(/\s+/g, ' ').trim()}`)
      .join('\n\n');
    const system =
      'You are a relevance judge for an insurance knowledge base. Given a customer QUESTION and a ' +
      'numbered list of CANDIDATE passages, decide which passages actually help ANSWER the question — ' +
      'judge by whether a passage CONTAINS the answer or directly relevant facts, NOT by whether it ' +
      'shares words with the question. Output ONLY a JSON object {"ranking": [n, ...]} listing the ' +
      'candidate numbers from MOST to LEAST helpful, best first. Include only genuinely helpful ' +
      `passages, at most ${this.topN}. If none help, output {"ranking": []}.`;
    const user = `QUESTION: ${query}\n\nCANDIDATES:\n${candidates}`;

    const res = await this.llm.complete(
      'classify',
      [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      { temperature: 0, jsonMode: true, maxTokens: JUDGE_MAX_TOKENS },
    );

    // `|| '{}'` guards an empty Ollama response (text:'') — yields no valid indices → dense
    // fallback with a clear "no valid indices" warn, not a cryptic JSON SyntaxError.
    const parsed = JSON.parse(res.text || '{}');
    const ranking: unknown[] = Array.isArray(parsed?.ranking) ? parsed.ranking : [];
    const order = ranking
      .filter((n): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= chunks.length)
      .map((n) => n - 1); // → 0-based
    if (order.length === 0) throw new Error('judge returned no valid indices');
    return order;
  }

  /**
   * Apply the judge's order (deduped), then fill any shortfall with the remaining chunks in their
   * original dense order so the drafter still receives up to topN chunks. Ranks reassigned 1..N.
   */
  private applyOrder(chunks: RetrievedChunk[], order: number[]): RetrievedChunk[] {
    const seen = new Set<number>();
    const picked: RetrievedChunk[] = [];
    for (const idx of order) {
      if (seen.has(idx)) continue;
      seen.add(idx);
      picked.push(chunks[idx]);
      if (picked.length >= this.topN) break;
    }
    for (let i = 0; i < chunks.length && picked.length < this.topN; i++) {
      if (!seen.has(i)) {
        seen.add(i);
        picked.push(chunks[i]);
      }
    }
    return this.renumber(picked);
  }

  /** Dense top-N, ranks reassigned. */
  private denseTopN(chunks: RetrievedChunk[]): RetrievedChunk[] {
    return this.renumber(chunks.slice(0, this.topN));
  }

  /** Reassign contiguous 1..N ranks so the drafter's rank → chunkId mapping stays valid. */
  private renumber(chunks: RetrievedChunk[]): RetrievedChunk[] {
    return chunks.map((c, i) => ({ ...c, rank: i + 1 }));
  }
}
