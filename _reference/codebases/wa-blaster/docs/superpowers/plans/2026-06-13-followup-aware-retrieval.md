# Follow-up–aware Retrieval Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the chatbot answer elliptical follow-up questions ("what about if she is 18?") by contextualizing the RAG search query against conversation history, without touching the drafter, guardrails, or embedding search.

**Architecture:** A pure `FollowUpDetector` (cheap recall gate: prior history exists AND message is short or matches a cue) decides whether to spend an LLM call. A `QueryContextualizerService` then asks the LLM (fast `classify` chain) to rewrite the message into a standalone query — instructed to leave self-contained questions unchanged, so the LLM is the real new-vs-follow-up judge. On empty/invalid output or `LlmExhaustedException`, it falls back to concatenating the prior customer message; it never throws. The `DecisionEngine` calls the contextualizer immediately before each of its two `retrieve()` sites (which are mutually exclusive per `decide()`).

**Tech Stack:** NestJS (DI, `@Injectable`), TypeScript, Jest. Reuses `LlmRouterService.complete('classify', …)` and the existing pure-detector pattern (`YesNoDetector`).

**Run all commands from `apps/api/`.** (`cd /Users/modefair/whatsapp-blasting/apps/api`)

**Pre-req for live runs (not needed for jest):** local Ollama up (`ollama serve`, models `bge-m3` + `qwen2.5:14b`).

---

### Task 1: `FollowUpDetector` (pure, deterministic)

**Files:**
- Create: `apps/api/src/chatbot/knowledge/follow-up.detector.ts`
- Test: `apps/api/src/chatbot/knowledge/follow-up.detector.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/chatbot/knowledge/follow-up.detector.spec.ts`:

```typescript
import { FollowUpDetector } from './follow-up.detector';

type Turn = { role: 'customer' | 'bot' | 'operator'; body: string };

const priorThread: Turn[] = [
  { role: 'customer', body: 'my daughter is 23, if she drives my car and we claim, got extra excess?' },
  { role: 'bot', body: 'No additional Compulsory Excess applies since your daughter is over 21 years old.' },
];

describe('FollowUpDetector', () => {
  const detector = new FollowUpDetector();

  it('flags a short elliptical message when prior customer history exists', () => {
    expect(detector.isFollowUp('what about if she is 18?', priorThread)).toBe(true);
    expect(detector.isFollowUp('and for a motorcycle?', priorThread)).toBe(true);
    expect(detector.isFollowUp('she 18?', priorThread)).toBe(true);
  });

  it('flags a longer message that carries a follow-up cue word', () => {
    expect(
      detector.isFollowUp('how about if my second driver is nineteen and drives occasionally?', priorThread),
    ).toBe(true);
  });

  it('treats a short question as a follow-up CANDIDATE when history exists — the LLM makes the final call', () => {
    // Recall-tuned: over-flagging is harmless (the rewrite leaves self-contained questions unchanged).
    expect(detector.isFollowUp('what does comprehensive cover?', priorThread)).toBe(true);
  });

  it('does NOT flag when there is no prior customer turn (nothing to contextualize)', () => {
    expect(detector.isFollowUp('what about if she is 18?', [])).toBe(false);
    expect(detector.isFollowUp('what about if she is 18?', undefined)).toBe(false);
    expect(detector.isFollowUp('and for a motorcycle?', [{ role: 'bot', body: 'Hi!' }])).toBe(false);
  });

  it('does NOT flag a long, self-contained question with no cue', () => {
    expect(
      detector.isFollowUp(
        'my daughter is 18, if she drives my car and we claim, got extra excess for this?',
        priorThread,
      ),
    ).toBe(false);
  });

  it('does NOT flag empty input', () => {
    expect(detector.isFollowUp('', priorThread)).toBe(false);
    expect(detector.isFollowUp('   ', priorThread)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/chatbot/knowledge/follow-up.detector.spec.ts`
Expected: FAIL — `Cannot find module './follow-up.detector'`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/api/src/chatbot/knowledge/follow-up.detector.ts`:

```typescript
import { Injectable } from '@nestjs/common';

type HistoryTurn = { role: 'customer' | 'bot' | 'operator'; body: string };

/** Messages with <= this many words are treated as possible ellipses. A code constant, not a setting. */
const MAX_FOLLOW_UP_WORDS = 8;

/**
 * Cue phrases that lean on prior context: a leading conjunction ("and night towing?", "but for a
 * lorry?") or a comparison opener ("what about…", "how about if…", "and if…"). Catches follow-ups
 * that are longer than the word threshold.
 */
const CUE =
  /(^\s*(and|but|or|so|also|then)\b)|\b(what about|how about|and if|what if|and for|but if|how about if|what about if)\b/i;

/**
 * Cheap, deterministic recall gate (Layer 1): decides only whether a message is worth an LLM
 * rewrite call, NOT whether it is definitively a follow-up. Over-flagging is intentional and
 * harmless — the rewrite step (Layer 2) leaves self-contained questions unchanged. Mirrors the
 * pure-detector pattern of YesNoDetector / OptOutDetector.
 */
@Injectable()
export class FollowUpDetector {
  isFollowUp(message: string, history?: HistoryTurn[]): boolean {
    const text = (message ?? '').trim();
    if (!text) return false;
    // Nothing to contextualize against without a prior customer turn.
    if (!(history ?? []).some((t) => t.role === 'customer')) return false;
    const wordCount = text.split(/\s+/).length;
    return wordCount <= MAX_FOLLOW_UP_WORDS || CUE.test(text);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/chatbot/knowledge/follow-up.detector.spec.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/modefair/whatsapp-blasting
git add apps/api/src/chatbot/knowledge/follow-up.detector.ts apps/api/src/chatbot/knowledge/follow-up.detector.spec.ts
git commit -m "feat(chatbot): add FollowUpDetector — cheap recall gate for query contextualization"
```

---

### Task 2: `QueryContextualizerService` (LLM rewrite + concat fallback)

**Files:**
- Create: `apps/api/src/chatbot/knowledge/query-contextualizer.service.ts`
- Test: `apps/api/src/chatbot/knowledge/query-contextualizer.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/chatbot/knowledge/query-contextualizer.service.spec.ts`:

```typescript
import { LlmRouterService } from '../llm/llm-router.service';
import { LlmExhaustedException } from '../llm/llm-exhausted.exception';
import { FollowUpDetector } from './follow-up.detector';
import { QueryContextualizerService } from './query-contextualizer.service';

type Turn = { role: 'customer' | 'bot' | 'operator'; body: string };

function makeLlm(complete: jest.Mock): LlmRouterService {
  return { complete } as unknown as LlmRouterService;
}
function completion(text: string) {
  return { text, modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' as const };
}

const thread: Turn[] = [
  { role: 'customer', body: 'my daughter is 23, if she drives my car and we claim, got extra excess?' },
  { role: 'bot', body: 'No additional Compulsory Excess applies since your daughter is over 21 years old.' },
];
const FOLLOW_UP = 'what about if she is 18?';
const EXPECTED_CONCAT =
  'my daughter is 23, if she drives my car and we claim, got extra excess? what about if she is 18?';

describe('QueryContextualizerService', () => {
  it('returns the raw message and does NOT call the LLM for a non-follow-up (no history)', async () => {
    const complete = jest.fn();
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize('what does comprehensive cover?', []);

    expect(result).toEqual({ searchQuery: 'what does comprehensive cover?', strategy: 'raw' });
    expect(complete).not.toHaveBeenCalled();
  });

  it('uses the LLM-rewritten standalone query for a follow-up', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('additional compulsory excess if 18 year old daughter drives insured car and claims'),
    );
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result.strategy).toBe('rewrite');
    expect(result.searchQuery).toBe(
      'additional compulsory excess if 18 year old daughter drives insured car and claims',
    );
    expect(complete).toHaveBeenCalledWith('classify', expect.any(Array), expect.objectContaining({ temperature: 0 }));
  });

  it('falls back to concat when the LLM chain is exhausted', async () => {
    const complete = jest.fn().mockRejectedValue(new LlmExhaustedException('down'));
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result).toEqual({ searchQuery: EXPECTED_CONCAT, strategy: 'concat' });
  });

  it('falls back to concat when the LLM returns an empty rewrite', async () => {
    const complete = jest.fn().mockResolvedValue(completion('   '));
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result).toEqual({ searchQuery: EXPECTED_CONCAT, strategy: 'concat' });
  });

  it('falls back to concat when the LLM rambles (likely prompt echo, not a query)', async () => {
    const complete = jest.fn().mockResolvedValue(completion('x'.repeat(500)));
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result.strategy).toBe('concat');
    expect(result.searchQuery).toBe(EXPECTED_CONCAT);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/chatbot/knowledge/query-contextualizer.service.spec.ts`
Expected: FAIL — `Cannot find module './query-contextualizer.service'`.

- [ ] **Step 3: Write minimal implementation**

Create `apps/api/src/chatbot/knowledge/query-contextualizer.service.ts`:

```typescript
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
    this.logger.log(`retrieval_query strategy=${result.strategy} query=${JSON.stringify(result.searchQuery.slice(0, 120))}`);
    return result;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/chatbot/knowledge/query-contextualizer.service.spec.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
cd /Users/modefair/whatsapp-blasting
git add apps/api/src/chatbot/knowledge/query-contextualizer.service.ts apps/api/src/chatbot/knowledge/query-contextualizer.service.spec.ts
git commit -m "feat(chatbot): add QueryContextualizerService — LLM query rewrite with concat fallback"
```

---

### Task 3: Wire the two units into `KnowledgeModule`

**Files:**
- Modify: `apps/api/src/chatbot/knowledge/knowledge.module.ts`

`KnowledgeModule` already imports `LlmModule` (which exports `LlmRouterService`) and is imported by `DecisionModule`, so exporting `QueryContextualizerService` here makes it injectable into `DecisionEngine`.

- [ ] **Step 1: Add providers and exports**

Edit `apps/api/src/chatbot/knowledge/knowledge.module.ts`. Add the two imports after the existing `ResolutionCaptureService` import line:

```typescript
import { FollowUpDetector } from './follow-up.detector';
import { QueryContextualizerService } from './query-contextualizer.service';
```

Add `FollowUpDetector` and `QueryContextualizerService` to BOTH the `providers` array and the `exports` array (append after `ResolutionCaptureService` in each).

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
cd /Users/modefair/whatsapp-blasting
git add apps/api/src/chatbot/knowledge/knowledge.module.ts
git commit -m "feat(chatbot): provide+export FollowUpDetector and QueryContextualizerService"
```

---

### Task 4: Use the contextualized query in `DecisionEngine` at both retrieve sites

**Files:**
- Modify: `apps/api/src/chatbot/decision/decision-engine.service.ts`
- Modify: `apps/api/src/chatbot/decision/decision-engine.service.spec.ts`
- Modify: `apps/api/src/chatbot/decision/__tests__/decision-engine.campaign.spec.ts`

- [ ] **Step 1: Write the failing test**

In `apps/api/src/chatbot/decision/decision-engine.service.spec.ts`:

(a) Add the import after the existing `EmbeddingsExhaustedException` import (line ~12):

```typescript
import { QueryContextualizerService } from '../knowledge/query-contextualizer.service';
```

(b) Inside `buildEngine()`, add a default contextualizer mock (raw passthrough so existing tests are unaffected). Add it right after the `conversations` mock object (before `const optOut = ...`):

```typescript
  const contextualizer = {
    contextualize: jest.fn(async (msg: string) => ({ searchQuery: msg, strategy: 'raw' as const })),
  };
```

(c) Append `contextualizer` to the `new DecisionEngine(...)` call as the LAST argument:

```typescript
    settings as unknown as ChatbotSettingsService,
    contextualizer as unknown as QueryContextualizerService,
  );
```

(d) Add `contextualizer` to the returned object:

```typescript
  return { engine, settings, settingsValues, classifier, retrieval, drafter, guardrails, conversations, contextualizer };
```

(e) Add this test inside the top-level `describe('DecisionEngine', …)` (e.g. just before the final closing `});` of the file, as its own `describe`):

```typescript
  describe('history-aware retrieval', () => {
    it('retrieves with the contextualized query, not the raw follow-up text', async () => {
      const { engine, contextualizer, retrieval } = buildEngine();
      contextualizer.contextualize.mockResolvedValue({
        searchQuery: 'additional compulsory excess for driver under 21',
        strategy: 'rewrite',
      });

      await engine.decide(
        input({
          inboundMessageBody: 'what about if she is 18?',
          conversationHistory: [
            { role: 'customer', body: 'my daughter is 23, if she drives my car and we claim, got extra excess?' },
            { role: 'bot', body: 'No additional Compulsory Excess applies since your daughter is over 21 years old.' },
          ],
        }),
      );

      expect(contextualizer.contextualize).toHaveBeenCalledWith('what about if she is 18?', expect.any(Array));
      expect(retrieval.retrieve).toHaveBeenCalledWith('additional compulsory excess for driver under 21');
    });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/chatbot/decision/decision-engine.service.spec.ts -t "history-aware retrieval"`
Expected: FAIL — `DecisionEngine` constructor takes 10 args / `retrieval.retrieve` was called with `'what about if she is 18?'` (raw body), not the rewritten query.

- [ ] **Step 3: Update the engine implementation**

In `apps/api/src/chatbot/decision/decision-engine.service.ts`:

(a) Add the import after the existing `EmbeddingsExhaustedException` import:

```typescript
import { QueryContextualizerService } from '../knowledge/query-contextualizer.service';
```

(b) Add the constructor parameter as the LAST one (after `settings`):

```typescript
    private readonly settings: ChatbotSettingsService,
    private readonly contextualizer: QueryContextualizerService,
  ) {}
```

(c) Main-pipeline retrieve — replace:

```typescript
    // Retrieve
    let retrieval: RetrievalResult;
    try {
      retrieval = await this.retrieval.retrieve(input.inboundMessageBody);
    } catch (e) {
```

with:

```typescript
    // Retrieve (history-aware: resolve elliptical follow-ups before embedding the query)
    const { searchQuery } = await this.contextualizer.contextualize(
      input.inboundMessageBody,
      input.conversationHistory,
    );
    let retrieval: RetrievalResult;
    try {
      retrieval = await this.retrieval.retrieve(searchQuery);
    } catch (e) {
```

(d) `tryRagAnswer` retrieve — replace:

```typescript
    try {
      const retrieval = await this.retrieval.retrieve(input.inboundMessageBody);
```

with:

```typescript
    try {
      const { searchQuery } = await this.contextualizer.contextualize(
        input.inboundMessageBody,
        input.conversationHistory,
      );
      const retrieval = await this.retrieval.retrieve(searchQuery);
```

- [ ] **Step 4: Update the campaign spec harness so it compiles**

In `apps/api/src/chatbot/decision/__tests__/decision-engine.campaign.spec.ts`:

(a) Add a contextualizer stub inside `buildEngine()` (after the `settings` mock, before `const engine = new DecisionEngine(`):

```typescript
  const contextualizer = {
    contextualize: jest.fn(async (msg: string) => ({ searchQuery: msg, strategy: 'raw' as const })),
  };
```

(b) Append it as the LAST argument to `new DecisionEngine(`:

```typescript
    settings as any,
    contextualizer as any,
  );
```

- [ ] **Step 5: Run the new test + both engine specs to verify they pass**

Run: `npx jest src/chatbot/decision`
Expected: PASS (all decision-engine + campaign tests, including the new "history-aware retrieval" test).

- [ ] **Step 6: Run the full chatbot suite + typecheck (no regressions)**

Run: `npx jest src/chatbot`
Expected: all suites pass.

Run: `npx tsc --noEmit`
Expected: exit 0, no output.

- [ ] **Step 7: Commit**

```bash
cd /Users/modefair/whatsapp-blasting
git add apps/api/src/chatbot/decision/decision-engine.service.ts apps/api/src/chatbot/decision/decision-engine.service.spec.ts apps/api/src/chatbot/decision/__tests__/decision-engine.campaign.spec.ts
git commit -m "feat(chatbot): contextualize the RAG query with conversation history at both retrieve sites"
```

---

### Task 5: Live verification (real WhatsApp, optional but recommended)

**Pre-req:** Ollama up (`bge-m3` + `qwen2.5:14b`), API running in real mode, cloudflared tunnel registered to Meta (see memory `chatbot-whatsapp-live`). The dev API runs under watch and will pick up the rebuilt `dist`.

- [ ] **Step 1: Reproduce the original thread from +60183825227**

From WhatsApp, send: "my daughter is 23, if she drives my car and we claim, got extra excess for this?"
Expected reply: no additional excess (over 21).

- [ ] **Step 2: Send the follow-up**

Send: "what about if she is 18?"
Expected reply: an additional Compulsory Excess (RM400) applies since under 21 — NOT "I'm not sure / connect to support" and NOT "still being processed".

- [ ] **Step 3: Confirm the strategy in the API log**

Run: `grep "retrieval_query" /tmp/wbs-api.log | tail -5`
Expected: a line with `strategy=rewrite` (or `concat` if the LLM was briefly down) for the follow-up turn.

- [ ] **Step 4: Confirm a NEW question is not polluted**

Send: "Does comprehensive cover flood damage?"
Expected: a fresh flood/Special-Perils answer, not anything about daughters/excess. Log shows `strategy=rewrite` with a flood-focused query, or `raw`.

---

## Notes for the implementer

- **DI propagation:** Because `KnowledgeModule` exports `QueryContextualizerService` and every consumer of `DecisionEngine` imports `DecisionModule` → `KnowledgeModule`, no other module wiring is needed (orchestrator, worker, sim all resolve it via DI).
- **Why both retrieve sites:** `tryRagAnswer` runs only under the pending-escalation guard and returns early; the main pipeline runs otherwise. They are mutually exclusive within one `decide()`, so at most one rewrite happens per message, and never on short-circuit paths (opt-out, complaint, disabled, out-of-hours) that escalate before retrieval.
- **No schema/settings changes.** Telemetry is logger-only (`retrieval_query strategy=… query=…`).
