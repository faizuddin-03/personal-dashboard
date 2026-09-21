import { ConfigService } from '@nestjs/config';
import { LlmRouterService } from '../llm/llm-router.service';
import { RetrievedChunk } from './retrieval.service';
import { RerankerService } from './reranker.service';
import { LlmExhaustedException } from '../llm/llm-exhausted.exception';

function makeLlm(complete: jest.Mock): LlmRouterService {
  return { complete } as unknown as LlmRouterService;
}

function completion(text: string) {
  return { text, modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' as const };
}

/** ConfigService stub: returns the override for a key, else the caller's default. */
function makeConfig(values: Record<string, string | number> = {}): ConfigService {
  return {
    get: (key: string, def?: unknown) => (key in values ? values[key] : def),
  } as unknown as ConfigService;
}

function chunk(id: string, rank: number, text = `text-${id}`, score = 0.9): RetrievedChunk {
  return {
    chunkId: id,
    text,
    tokenCount: 10,
    similarityScore: score,
    rank,
    document: { id: 'd1', name: 'doc.md', title: 'Doc', category: 'General' },
  };
}

describe('RerankerService', () => {
  describe('config surface', () => {
    it('fetchTopK returns undefined when disabled, candidateK when enabled', () => {
      const off = new RerankerService(makeLlm(jest.fn()), makeConfig());
      expect(off.enabled).toBe(false);
      expect(off.fetchTopK()).toBeUndefined();

      const on = new RerankerService(
        makeLlm(jest.fn()),
        makeConfig({ CHATBOT_RERANK_ENABLED: 'true', CHATBOT_RERANK_CANDIDATE_K: 20 }),
      );
      expect(on.enabled).toBe(true);
      expect(on.fetchTopK()).toBe(20);
    });
  });

  describe('disabled / short-circuit', () => {
    it('returns the dense top-N unchanged and never calls the LLM when disabled', async () => {
      const complete = jest.fn();
      const svc = new RerankerService(makeLlm(complete), makeConfig());
      const chunks = [chunk('c1', 1), chunk('c2', 2), chunk('c3', 3)];

      const out = await svc.rerank('any question', chunks);

      expect(out.map((c) => c.chunkId)).toEqual(['c1', 'c2', 'c3']);
      expect(out.map((c) => c.rank)).toEqual([1, 2, 3]);
      expect(complete).not.toHaveBeenCalled();
    });

    it('passes through (no LLM call) when there is 0 or 1 candidate even if enabled', async () => {
      const complete = jest.fn();
      const svc = new RerankerService(makeLlm(complete), makeConfig({ CHATBOT_RERANK_ENABLED: 'true' }));

      expect(await svc.rerank('q', [])).toEqual([]);
      const one = await svc.rerank('q', [chunk('only', 1)]);
      expect(one.map((c) => c.chunkId)).toEqual(['only']);
      expect(complete).not.toHaveBeenCalled();
    });
  });

  describe('enabled — LLM-judge reordering', () => {
    const candidates = [
      chunk('c1', 1, 'NCD accrual: after 1 year 25%', 0.75),
      chunk('c2', 2, 'NCD accrual: after 2 years 30%', 0.74),
      chunk('c3', 3, 'NCD accrual: after 3 years 38.33%', 0.73),
      chunk('c4', 4, 'One claim and your NCD becomes zero; accumulation restarts.', 0.65),
      chunk('c5', 5, 'How to renew your policy online', 0.6),
    ];

    function enabledSvc(complete: jest.Mock) {
      return new RerankerService(
        makeLlm(complete),
        makeConfig({ CHATBOT_RERANK_ENABLED: 'true', CHATBOT_RERANK_CANDIDATE_K: 20, CHATBOT_RERANK_TOP_N: 5 }),
      );
    }

    it('promotes the answer chunk to rank 1 with contiguous ranks, losing no candidates', async () => {
      // Judge picks the real answer (c4) first, then c1; the rest fill in dense order.
      const complete = jest.fn().mockResolvedValue(completion('{"ranking": [4, 1]}'));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('what happens to my NCD if I claim?', candidates);

      expect(out[0].chunkId).toBe('c4');
      expect(out[0].rank).toBe(1);
      expect(out.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5]);
      // No candidate dropped; the second pick is honoured, remainder appended in dense order.
      expect(out.map((c) => c.chunkId)).toEqual(['c4', 'c1', 'c2', 'c3', 'c5']);
      // Judge ran on the fast classify chain at temperature 0.
      expect(complete).toHaveBeenCalledWith('classify', expect.any(Array), expect.objectContaining({ temperature: 0, jsonMode: true }));
      // similarityScore is left as the dense score (not fabricated).
      expect(out[0].similarityScore).toBe(0.65);
    });

    it('falls back to dense top-N when the LLM chain is exhausted (no throw)', async () => {
      const complete = jest.fn().mockRejectedValue(new LlmExhaustedException('down'));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('q', candidates);

      expect(out.map((c) => c.chunkId)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
      expect(out.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5]);
    });

    it('falls back to dense top-N when the judge returns non-JSON', async () => {
      const complete = jest.fn().mockResolvedValue(completion('the most relevant is chunk 4'));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('q', candidates);

      expect(out.map((c) => c.chunkId)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
    });

    it('falls back to dense top-N when the judge selects nothing', async () => {
      const complete = jest.fn().mockResolvedValue(completion('{"ranking": []}'));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('q', candidates);

      expect(out.map((c) => c.chunkId)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
    });

    it('falls back to dense top-N when the judge returns an empty response', async () => {
      // Ollama returns text:'' when content is null; JSON.parse('') would throw — guard yields fallback.
      const complete = jest.fn().mockResolvedValue(completion(''));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('q', candidates);

      expect(out.map((c) => c.chunkId)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5']);
    });

    it('delivers fewer than topN (gracefully) when there are fewer candidates than topN', async () => {
      // candidateK < topN misconfig, or a sparse KB: only what was retrieved can be returned.
      const three = [chunk('a', 1, 'text a', 0.7), chunk('b', 2, 'text b', 0.69), chunk('c', 3, 'text c', 0.68)];
      const complete = jest.fn().mockResolvedValue(completion('{"ranking": [2]}'));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('q', three);

      // b promoted, a and c fill in dense order; ranks contiguous 1..3, nothing lost.
      expect(out.map((c) => c.chunkId)).toEqual(['b', 'a', 'c']);
      expect(out.map((c) => c.rank)).toEqual([1, 2, 3]);
    });

    it('sanitizes out-of-range and duplicate indices, then fills in dense order', async () => {
      // 99 out of range, -1 invalid, 2 duplicated; valid distinct = [2, 3] → c2, c3 first.
      const complete = jest.fn().mockResolvedValue(completion('{"ranking": [99, 2, 2, -1, 3]}'));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('q', candidates);

      expect(out.map((c) => c.chunkId)).toEqual(['c2', 'c3', 'c1', 'c4', 'c5']);
      expect(out.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5]);
    });
  });
});
