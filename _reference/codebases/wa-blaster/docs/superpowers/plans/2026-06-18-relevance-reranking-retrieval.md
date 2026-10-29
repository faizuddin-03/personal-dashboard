# Relevance-Reranking Stage for RAG Retrieval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Insert a best-effort LLM-judge reranking stage between dense retrieval and the drafter so the chunk that actually *answers* a question reaches the top-N the drafter sees, even when term-dense chunks outrank it.

**Architecture:** A new `RerankerService` in `apps/api/src/chatbot/knowledge/` (mirroring the best-effort `QueryContextualizerService`) reorders a wide candidate set by an LLM relevance judgment. The `DecisionEngine` fetches a wide set then reranks to the normal top-N at both of its retrieve sites via one shared private helper. Gated by `CHATBOT_RERANK_ENABLED` (default off); when off, retrieval is byte-for-byte unchanged.

**Tech Stack:** NestJS, TypeScript, Jest, pgvector retrieval, Ollama via `LlmRouterService` (`classify` chain), `ConfigService` for env flags.

**Spec:** `docs/superpowers/specs/2026-06-18-relevance-reranking-retrieval-design.md`

**Branch:** `feat/ai-chatbot` — commit per task; push to the feature branch (do **not** open a PR).

---

## File Structure

- **Create** `apps/api/src/chatbot/knowledge/reranker.service.ts` — the reranker (config surface, `fetchTopK()`, `rerank()`, inline judge prompt). Single responsibility: relevance reordering. Best-effort, never throws.
- **Create** `apps/api/src/chatbot/knowledge/reranker.service.spec.ts` — unit tests with a mocked `LlmRouterService` + `ConfigService` stub (pattern from `query-contextualizer.service.spec.ts`).
- **Modify** `apps/api/src/chatbot/knowledge/knowledge.module.ts` — register + export `RerankerService`.
- **Modify** `apps/api/src/chatbot/decision/decision-engine.service.ts` — inject `RerankerService`; add `retrieveReranked()` helper; route both retrieve sites through it.
- **Modify** `apps/api/src/chatbot/decision/decision-engine.service.spec.ts` — add a reranker mock to `buildEngine()`, fix the one args assertion, add a rerank-enabled integration test.
- **Modify** `apps/api/.env.example` and `docs/README-chatbot.md` — document the three new flags.

No change needed to `decision.module.ts` (already imports `KnowledgeModule`) or `sim-app.module.ts` (imports `ChatbotModule` → the whole graph).

---

### Task 1: `RerankerService` scaffold — config surface, `fetchTopK()`, disabled passthrough

**Files:**
- Create: `apps/api/src/chatbot/knowledge/reranker.service.ts`
- Test: `apps/api/src/chatbot/knowledge/reranker.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/chatbot/knowledge/reranker.service.spec.ts`:

```typescript
import { ConfigService } from '@nestjs/config';
import { LlmRouterService } from '../llm/llm-router.service';
import { RetrievedChunk } from './retrieval.service';
import { RerankerService } from './reranker.service';

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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/api && npx jest src/chatbot/knowledge/reranker.service.spec.ts -t "config surface"`
Expected: FAIL — "Cannot find module './reranker.service'".

- [ ] **Step 3: Write the minimal implementation**

Create `apps/api/src/chatbot/knowledge/reranker.service.ts`:

```typescript
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
  }

  get enabled(): boolean {
    return this.enabledFlag;
  }

  /**
   * Width the caller should retrieve before reranking: candidateK when enabled, else undefined
   * (so RetrievalService keeps its own default top-K — zero behavior change when off).
   */
  fetchTopK(): number | undefined {
    return this.enabledFlag ? this.candidateK : undefined;
  }

  async rerank(query: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
    if (!this.enabledFlag || chunks.length <= 1) return this.take(chunks);
    // Enabled LLM-judge path is implemented in Task 2.
    return this.take(chunks);
  }

  /** Dense top-N, ranks reassigned. */
  private take(chunks: RetrievedChunk[]): RetrievedChunk[] {
    return this.reRank(chunks.slice(0, this.topN));
  }

  /** Reassign contiguous 1..N ranks so the drafter's rank → chunkId mapping stays valid. */
  private reRank(chunks: RetrievedChunk[]): RetrievedChunk[] {
    return chunks.map((c, i) => ({ ...c, rank: i + 1 }));
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/api && npx jest src/chatbot/knowledge/reranker.service.spec.ts`
Expected: PASS (both describe blocks).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/chatbot/knowledge/reranker.service.ts apps/api/src/chatbot/knowledge/reranker.service.spec.ts
git commit -m "feat(chatbot): RerankerService scaffold (config, fetchTopK, disabled passthrough)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Enabled LLM-judge reordering + best-effort degradation

**Files:**
- Modify: `apps/api/src/chatbot/knowledge/reranker.service.ts`
- Test: `apps/api/src/chatbot/knowledge/reranker.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append these `describe` blocks inside the top-level `describe('RerankerService', ...)` in `reranker.service.spec.ts` (after the existing blocks). They reuse the `makeLlm`/`makeConfig`/`completion`/`chunk` helpers already in the file:

```typescript
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
      const complete = jest.fn().mockRejectedValue(new (require('../llm/llm-exhausted.exception').LlmExhaustedException)('down'));
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

    it('sanitizes out-of-range and duplicate indices, then fills in dense order', async () => {
      // 99 out of range, -1 invalid, 2 duplicated; valid distinct = [2, 3] → c2, c3 first.
      const complete = jest.fn().mockResolvedValue(completion('{"ranking": [99, 2, 2, -1, 3]}'));
      const svc = enabledSvc(complete);

      const out = await svc.rerank('q', candidates);

      expect(out.map((c) => c.chunkId)).toEqual(['c2', 'c3', 'c1', 'c4', 'c5']);
      expect(out.map((c) => c.rank)).toEqual([1, 2, 3, 4, 5]);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/api && npx jest src/chatbot/knowledge/reranker.service.spec.ts -t "LLM-judge reordering"`
Expected: FAIL — the "promotes the answer chunk" case fails (current `rerank` returns dense order `c1..c5`, so `out[0].chunkId` is `c1`, not `c4`).

- [ ] **Step 3: Implement the enabled judge path**

In `reranker.service.ts`, replace the `rerank` method body and add the `judge` + `applyOrder` private methods:

```typescript
  async rerank(query: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]> {
    if (!this.enabledFlag || chunks.length <= 1) return this.take(chunks);

    try {
      const order = await this.judge(query, chunks);
      const reordered = this.applyOrder(chunks, order);
      this.logger.log(`rerank applied: ${chunks.length} candidates → top ${reordered.length}`);
      return reordered;
    } catch (e) {
      if (!(e instanceof LlmExhaustedException)) {
        this.logger.warn(`rerank_failed (dense fallback): ${(e as Error).message}`);
      }
      return this.take(chunks);
    }
  }

  /**
   * Ask the judge for the helpful candidate indices, most-helpful first. Returns 0-based indices
   * into `chunks`. Throws (→ dense fallback) on bad JSON or when no valid index survives.
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

    const parsed = JSON.parse(res.text);
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
    return this.reRank(picked);
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/api && npx jest src/chatbot/knowledge/reranker.service.spec.ts`
Expected: PASS (all blocks — config, disabled, LLM-judge reordering).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/chatbot/knowledge/reranker.service.ts apps/api/src/chatbot/knowledge/reranker.service.spec.ts
git commit -m "feat(chatbot): RerankerService LLM-judge reordering + best-effort degradation

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Register `RerankerService` in `KnowledgeModule`

**Files:**
- Modify: `apps/api/src/chatbot/knowledge/knowledge.module.ts`

- [ ] **Step 1: Add the import and register the provider/export**

In `knowledge.module.ts`, add the import line near the other service imports:

```typescript
import { RerankerService } from './reranker.service';
```

Add `RerankerService` to **both** the `providers` array and the `exports` array (place it next to `QueryContextualizerService` in each list). Final arrays:

```typescript
  providers: [
    ChunkerService,
    RetrievalService,
    IngestionService,
    DocumentService,
    TitleGeneratorService,
    ResolutionCaptureService,
    FollowUpDetector,
    QueryContextualizerService,
    RerankerService,
    EnrichmentService,
  ],
  exports: [
    ChunkerService,
    RetrievalService,
    IngestionService,
    DocumentService,
    TitleGeneratorService,
    ResolutionCaptureService,
    FollowUpDetector,
    QueryContextualizerService,
    RerankerService,
    EnrichmentService,
  ],
```

- [ ] **Step 2: Verify the module compiles and existing knowledge tests pass**

Run: `cd apps/api && npx tsc --noEmit -p tsconfig.json && npx jest src/chatbot/knowledge`
Expected: PASS — type-check clean, all knowledge specs green.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/chatbot/knowledge/knowledge.module.ts
git commit -m "feat(chatbot): register RerankerService in KnowledgeModule

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Wire the reranker into `DecisionEngine` (both retrieve sites)

**Files:**
- Modify: `apps/api/src/chatbot/decision/decision-engine.service.ts`
- Test: `apps/api/src/chatbot/decision/decision-engine.service.spec.ts`

- [ ] **Step 1: Update the spec — add reranker mock, fix the args assertion, add the enabled integration test**

In `decision-engine.service.spec.ts`:

(a) Add the import near the other knowledge imports:

```typescript
import { RerankerService } from '../knowledge/reranker.service';
```

(b) Inside `buildEngine()`, add a reranker mock (place it next to the `contextualizer` mock). Default is **disabled** so every existing test keeps its current behavior:

```typescript
  const reranker = {
    enabled: false,
    fetchTopK: jest.fn(() => undefined as number | undefined),
    rerank: jest.fn(async (_q: string, chunks: RetrievedChunk[]) => chunks),
  };
```

(c) Pass it as the **last** constructor argument and add it to the returned object:

```typescript
  const engine = new DecisionEngine(
    classifier as unknown as ClassifierService,
    retrieval as unknown as RetrievalService,
    drafter as unknown as DrafterService,
    guardrails as unknown as GuardrailsService,
    optOut,
    complaint,
    yesNo,
    canned,
    conversations as unknown as ConversationService,
    settings as unknown as ChatbotSettingsService,
    contextualizer as unknown as QueryContextualizerService,
    reranker as unknown as RerankerService,
  );

  return { engine, settings, settingsValues, classifier, retrieval, drafter, guardrails, conversations, contextualizer, reranker };
```

(d) Fix the existing history-aware assertion (currently the engine will call `retrieve` with a second arg). Change the line that reads:

```typescript
      expect(retrieval.retrieve).toHaveBeenCalledWith('additional compulsory excess for driver under 21');
```

to:

```typescript
      expect(retrieval.retrieve).toHaveBeenCalledWith('additional compulsory excess for driver under 21', { topK: undefined });
```

(e) Add a new `describe` block (e.g. after the `'history-aware retrieval'` block):

```typescript
  describe('relevance reranking', () => {
    it('fetches a wide candidate set and hands the reranked chunks to the drafter when enabled', async () => {
      const { engine, reranker, retrieval, drafter } = buildEngine();
      reranker.enabled = true;
      reranker.fetchTopK.mockReturnValue(20);

      const noise = chunk({ chunkId: 'noise', rank: 1, similarityScore: 0.75 });
      const answer = chunk({ chunkId: 'answer', rank: 2, similarityScore: 0.65, text: 'One claim and your NCD becomes zero.' });
      retrieval.retrieve.mockResolvedValue(retrievalResult([noise, answer]));
      // Judge promotes the real answer to rank 1.
      reranker.rerank.mockResolvedValue([
        { ...answer, rank: 1 },
        { ...noise, rank: 2 },
      ]);

      const d = await engine.decide(input());

      // Wide fetch driven by fetchTopK().
      expect(retrieval.retrieve).toHaveBeenCalledWith('What time do you open?', { topK: 20 });
      // Reranker received the dense candidates for the (raw) query.
      expect(reranker.rerank).toHaveBeenCalledWith('What time do you open?', [noise, answer]);
      // Drafter sees the reranked order (answer first).
      const draftArg = drafter.draft.mock.calls[0][0];
      expect(draftArg.chunks[0].chunkId).toBe('answer');
      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
    });

    it('does not rerank or widen the fetch when disabled (zero behavior change)', async () => {
      const { engine, reranker, retrieval } = buildEngine();

      await engine.decide(input());

      expect(retrieval.retrieve).toHaveBeenCalledWith('What time do you open?', { topK: undefined });
      expect(reranker.rerank).not.toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run the spec to verify the new/updated assertions fail**

Run: `cd apps/api && npx jest src/chatbot/decision/decision-engine.service.spec.ts`
Expected: FAIL — the `DecisionEngine` constructor does not yet accept a 12th argument and does not call `retrieve` with `{ topK }`; the new `relevance reranking` block fails.

- [ ] **Step 3: Implement the wiring in `decision-engine.service.ts`**

(a) Add the import near the other knowledge imports:

```typescript
import { RerankerService } from '../knowledge/reranker.service';
```

(b) Add the constructor parameter (last, after `contextualizer`):

```typescript
    private readonly contextualizer: QueryContextualizerService,
    private readonly reranker: RerankerService,
  ) {}
```

(c) In `decide()`, replace the main-pipeline retrieve block. Find:

```typescript
    let retrieval: RetrievalResult;
    try {
      retrieval = await this.retrieval.retrieve(searchQuery);
    } catch (e) {
      if (e instanceof EmbeddingsExhaustedException)
        return this.finalize({ kind: 'IGNORE', subKind: 'ignore_embeddings_unavailable', reason: 'embeddings_unavailable' }, acc, t0);
      throw e;
    }
```

Replace with:

```typescript
    let retrieval: RetrievalResult;
    try {
      retrieval = await this.retrieveReranked(searchQuery);
    } catch (e) {
      if (e instanceof EmbeddingsExhaustedException)
        return this.finalize({ kind: 'IGNORE', subKind: 'ignore_embeddings_unavailable', reason: 'embeddings_unavailable' }, acc, t0);
      throw e;
    }
```

(d) In `tryRagAnswer()`, find:

```typescript
      const retrieval = await this.retrieval.retrieve(searchQuery);
```

Replace with:

```typescript
      const retrieval = await this.retrieveReranked(searchQuery);
```

(e) Add the private helper. Place it directly above `tryRagAnswer()`:

```typescript
  /**
   * Dense-retrieve then (when enabled) rerank by relevance, returning a RetrievalResult whose
   * `chunks` are the top-N the drafter should see. When the reranker is disabled, retrieval is
   * byte-for-byte unchanged: `fetchTopK()` is undefined (RetrievalService keeps its own default
   * top-K) and the reranker is never invoked. The reranker never throws; only `retrieve` can
   * surface an EmbeddingsExhaustedException, which callers handle.
   */
  private async retrieveReranked(searchQuery: string): Promise<RetrievalResult> {
    const retrieval = await this.retrieval.retrieve(searchQuery, { topK: this.reranker.fetchTopK() });
    if (!this.reranker.enabled) return retrieval;
    const chunks = await this.reranker.rerank(searchQuery, retrieval.chunks);
    return { ...retrieval, chunks };
  }
```

- [ ] **Step 4: Run the spec to verify it passes**

Run: `cd apps/api && npx jest src/chatbot/decision/decision-engine.service.spec.ts`
Expected: PASS — all existing tests plus the new `relevance reranking` block.

- [ ] **Step 5: Type-check the whole API and run the chatbot suite**

Run: `cd apps/api && npx tsc --noEmit -p tsconfig.json && npx jest src/chatbot`
Expected: PASS — no type errors; all chatbot unit tests green (confirms `ChatbotModule` DI still resolves with the new dependency).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/chatbot/decision/decision-engine.service.ts apps/api/src/chatbot/decision/decision-engine.service.spec.ts
git commit -m "feat(chatbot): wire RerankerService into DecisionEngine at both retrieve sites

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Document the flags (`.env.example` + README)

**Files:**
- Modify: `apps/api/.env.example`
- Modify: `docs/README-chatbot.md`

- [ ] **Step 1: Add the flags to `.env.example`**

In `apps/api/.env.example`, the "Retrieval tuning" block currently ends at `CHATBOT_CHUNK_OVERLAP_TOKENS=50 ...`. Replace:

```
CHATBOT_CHUNK_OVERLAP_TOKENS=50      # token overlap between adjacent chunks

# Resolution capture (close-ticket flow)
```

with:

```
CHATBOT_CHUNK_OVERLAP_TOKENS=50      # token overlap between adjacent chunks

# Relevance reranking (LLM-judge between retrieval and the drafter). OFF by default.
# When ON, retrieval fetches CHATBOT_RERANK_CANDIDATE_K candidates and an LLM-judge reorders them by
# which actually ANSWER the question, handing the top CHATBOT_RERANK_TOP_N to the drafter. Surfaces
# the answer chunk past term-dense walls (e.g. NCD-on-claim) and is the prerequisite for safely
# enabling CHATBOT_CONFIDENCE_DECOUPLE_LANG. Adds one fast LLM call per answered query.
CHATBOT_RERANK_ENABLED=false
CHATBOT_RERANK_CANDIDATE_K=20        # candidates fetched before reranking
CHATBOT_RERANK_TOP_N=5               # chunks handed to the drafter after reranking

# Resolution capture (close-ticket flow)
```

- [ ] **Step 2: Add the flags to the README boot-time knobs list**

In `docs/README-chatbot.md`, find the boot-time knobs sentence:

```
Boot-time knobs live in `.env` (`apps/api`): `CHATBOT_ENABLED`, `CHATBOT_LOG_BODIES`,
`CHATBOT_RETRIEVAL_TOP_K`, `CHATBOT_RETRIEVAL_MIN_SCORE`, `CHATBOT_CHUNK_SIZE_TOKENS`,
`CHATBOT_CHUNK_OVERLAP_TOKENS`, `CHATBOT_CAPTURE_DEDUP_THRESHOLD`, `LLM_OLLAMA_*`, `EMBEDDINGS_*`.
```

Replace with:

```
Boot-time knobs live in `.env` (`apps/api`): `CHATBOT_ENABLED`, `CHATBOT_LOG_BODIES`,
`CHATBOT_RETRIEVAL_TOP_K`, `CHATBOT_RETRIEVAL_MIN_SCORE`, `CHATBOT_CHUNK_SIZE_TOKENS`,
`CHATBOT_CHUNK_OVERLAP_TOKENS`, `CHATBOT_CAPTURE_DEDUP_THRESHOLD`,
`CHATBOT_RERANK_ENABLED` / `CHATBOT_RERANK_CANDIDATE_K` / `CHATBOT_RERANK_TOP_N` (relevance reranker;
off by default — prerequisite for `CHATBOT_CONFIDENCE_DECOUPLE_LANG`), `LLM_OLLAMA_*`, `EMBEDDINGS_*`.
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/.env.example docs/README-chatbot.md
git commit -m "docs(chatbot): document CHATBOT_RERANK_* flags

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Validate against the BM eval (the real proof) + record outcome

**Files:** none (validation + memory note). Requires real Ollama (bge-m3 + qwen2.5:14b) at `localhost:11434`.

- [ ] **Step 1: Verify Ollama is reachable**

Run: `curl -s localhost:11434/api/tags | grep -o 'bge-m3'`
Expected: prints `bge-m3`. If empty/connection refused, the GPU-box ssh tunnel is down — bring it up (see `chatbot-transient-failure-and-tunnel.md`: use `autossh`) before continuing. The unit tests (Tasks 1–4) pass without Ollama, but this FAIL→PASS proof cannot be produced without it.

- [ ] **Step 2: Baseline (flag off) — confirm NCD-BM still FAILs (red)**

Run: `cd apps/api && WHATSAPP_MOCK_MODE=true npx ts-node scripts/grade-bm-eval.ts`
Expected: the `T04 NCD-on-claim | BM pure` line (phone `60139042`) shows `[FAIL]`; the runner exits non-zero. (Confirms the reranker is genuinely the fix, not a spurious pass.) Note the FAIL count.

- [ ] **Step 3: Reranker on — NCD-BM flips to PASS, no regressions**

Run: `cd apps/api && WHATSAPP_MOCK_MODE=true CHATBOT_RERANK_ENABLED=true npx ts-node scripts/grade-bm-eval.ts`
Expected: `T04 NCD-on-claim | BM pure` now `[PASS]`; **every other graded case that passed at baseline still passes** (compare against the Step 2 output line-by-line). Runner exits 0. If a previously-green case regressed, stop and debug (do not proceed to Step 4).

- [ ] **Step 4: Bonus unblock — both flags on, re-confirm green**

Run: `cd apps/api && WHATSAPP_MOCK_MODE=true CHATBOT_RERANK_ENABLED=true CHATBOT_CONFIDENCE_DECOUPLE_LANG=true npx ts-node scripts/grade-bm-eval.ts`
Expected: runner exits 0 (all graded cases pass) — confirms enabling `CHATBOT_CONFIDENCE_DECOUPLE_LANG` no longer auto-sends the NCD-class wrong answer now that the reranker surfaces the correct chunk.

- [ ] **Step 5: Final full chatbot suite + push**

Run: `cd apps/api && npx jest src/chatbot && cd /Users/modefair/whatsapp-blasting && git push origin feat/ai-chatbot`
Expected: green suite; branch pushed. (Flags remain default-OFF in code — the user flips them in `.env` at deploy.)

- [ ] **Step 6: Update memory**

Update `chatbot-bm-cross-lingual.md` (the reranker is now SHIPPED, not deferred) and add/refresh a `chatbot-reranker.md` memory: the reranker exists, its flags, that it's gated default-off, that it flips the NCD-BM eval case, and that it unblocks `CHATBOT_CONFIDENCE_DECOUPLE_LANG`. Add an index line in `MEMORY.md`.

---

## Self-Review

**Spec coverage:**
- Component 1 (`RerankerService`: config, `fetchTopK`, `rerank`, judge prompt, fill, rank reassign, best-effort) → Tasks 1–2. ✓
- Component 2 (`DecisionEngine` helper + both sites) → Task 4. ✓
- Component 3 (`KnowledgeModule`) → Task 3. ✓
- Component 4 (env docs) → Task 5. ✓
- Testing (unit cases + decision-engine integration) → Tasks 1, 2, 4. ✓
- Validation (Ollama check, baseline red, rerank green, both-flags green) → Task 6. ✓
- Rollout (both flags default-OFF; not flipped in code) → defaults in Task 1 (`'false'`) + Task 5 docs + Task 6 Step 5 note. ✓
- Degradation / never-throws → Task 2 fallback cases. ✓

**Placeholder scan:** No TBD/TODO; every code/test step shows full code; every command has expected output. ✓

**Type consistency:** `RerankerService` surface — `enabled` (getter), `fetchTopK(): number | undefined`, `rerank(query, chunks): Promise<RetrievedChunk[]>` — used identically in the service, its spec, the decision-engine mock, and the decision-engine wiring. `RetrievedChunk` shape matches `retrieval.service.ts`. The decision-engine helper returns `RetrievalResult` (`{ ...retrieval, chunks }`), consistent with the existing `retrieval` variable type. ✓
