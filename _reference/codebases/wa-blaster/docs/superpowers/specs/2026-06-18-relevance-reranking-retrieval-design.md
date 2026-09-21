# Relevance-Reranking Stage for RAG Retrieval — Design

**Date:** 2026-06-18
**Branch:** `feat/ai-chatbot` (feature work; push, do not open a PR)
**Status:** Approved — proceeding to implementation plan

## Problem (proven, measured)

The chatbot's dense retrieval has a *precision* problem: chunks that are **term-dense**
for a query's keywords outrank the chunk that actually **answers** it.

Proven case — the BM question
"Apakah yang berlaku kepada NCD saya jika saya membuat tuntutan?"
(what happens to my No-Claim-Discount if I claim?):

- Dense retrieval returns the NCD **accrual-rate** rows
  ("Selepas N tahun tanpa tuntutan → X%"), which score **0.72–0.75** because they are
  dense with "Diskaun Tanpa Tuntutan / NCD" terms. There are ~15 such near-duplicate rows
  across the RHB-BM and Zurich-BM docs, plus the English NCD chunks pulled in cross-lingually.
- The chunk that actually answers it — "Satu Tuntutan dan Diskaun Tanpa Tuntutan Anda
  Menjadi Sifar" (one claim → NCD becomes ZERO, accumulation restarts), in
  `apps/api/knowledge/rhb/rhb-private-car-bm.md` ~line 364 — scores only **0.649**
  (it is about the *outcome*, not dense in "NCD" terms) and never reaches the top-5 the
  drafter sees. So the drafter confabulates a wrong, money-related answer.

### What has already been tried and does NOT work (do not redo)

- **Consequence-prose enrichment** (standalone question-form chunks): the enrichment chunk
  scores 0.65–0.79 depending on LLM phrasing — too fragile / thin margin to reliably beat the
  0.73–0.75 wall. (This enrichment is shipped and helps other consequence questions — **keep it**.)
- **Chunker "collapse scale tables"**: conflicts with the tested per-row splitting of legitimate
  lookup tables (`chunker.service.spec.ts` ~line 74, the Zone/price table) — homogeneous-by-template
  can't distinguish an accrual scale from a price lookup.
- **Retrieval text-dedup by template**: per-row enrichment makes the accrual rows non-identical, so
  they don't dedup.
- **Collapsing the accrual rows**: a broader wall of other NCD-heading chunks remains above the answer.

**Conclusion (recorded in `chatbot-bm-cross-lingual.md`):** the only robust fix is a relevance
reranker. This is that fix.

## Goal

Add a reranking stage between dense retrieval and the drafter that reorders candidates by
**actual relevance to the question** (does this passage *answer* it?) rather than dense keyword
similarity, surfacing the correct chunk into the top-5 the drafter sees.

## Non-goals

- No cross-encoder model / new infra (LLM-judge is the chosen mechanism).
- No change to the chunker, enrichment, or dense-retrieval SQL.
- No change to `RetrievalService`'s other consumers (dedup checks, REST preview).
- Not flipping any flag's default to ON in code (see Rollout).

## Approach

**Separate `RerankerService` wired at the decision engine's two retrieve sites** (chosen over
reranking inside `RetrievalService`, which would couple retrieval to the LLM and leak into every
consumer). The service mirrors `QueryContextualizerService`: a thin, best-effort LLM step in the
retrieval path that **never throws** and degrades to the original dense order on any failure.

Mechanism: **LLM-judge** on the existing fast `classify` chain (the pragmatic choice; a cross-encoder
is the rejected alternative — needs a new served model + infra).

## Components

### 1. `RerankerService` — new (`apps/api/src/chatbot/knowledge/reranker.service.ts`)

Config-derived values (read once in constructor via `ConfigService`):

| Value         | Env / source                  | Default | Meaning                                      |
|---------------|-------------------------------|---------|----------------------------------------------|
| `enabled`     | `CHATBOT_RERANK_ENABLED`      | `false` | Master gate.                                 |
| `candidateK`  | `CHATBOT_RERANK_CANDIDATE_K`  | `20`    | How wide to fetch before reranking.          |
| `topN`        | `CHATBOT_RERANK_TOP_N`        | `5`     | Final count handed to the drafter.           |
| `maxCharsPerChunk` | (constant)               | `600`   | Per-candidate truncation to bound judge tokens. |

Public surface:

- `fetchTopK(): number | undefined` — returns `candidateK` when `enabled`, else `undefined`
  (so `RetrievalService` keeps its own default top-K → **zero behavior change when the flag is off**).
- `rerank(query: string, chunks: RetrievedChunk[]): Promise<RetrievedChunk[]>`:
  - **Disabled, or `chunks.length <= 1`** → return `chunks.slice(0, topN)` untouched.
  - **Enabled** → one LLM-judge call on the `classify` chain
    (`{ temperature: 0, jsonMode: true, maxTokens: ~128 }`). The judge is prompted to select/order
    candidates by **whether the passage helps answer the question, NOT by shared keywords**.
    Candidate text is truncated to `maxCharsPerChunk`.
  - Parse `{"ranking": [n, ...]}` (1-based candidate indices). Sanitize: keep in-range, dedupe,
    preserve order. Take the first `topN`. **Fill any shortfall with the remaining chunks in
    original dense order** so the drafter always receives `topN` chunks (recall preserved; the
    answer chunk sits at rank 1, noise demoted below it).
  - **Reassign `rank` to a contiguous 1..N** on the returned chunks so the drafter's
    `rank → chunkId` citation mapping stays valid. Leave `similarityScore` as the original dense
    score (telemetry honesty — reranking reorders, it does not fabricate scores).
  - **Best-effort:** any failure (LLM exhaustion, parse error, empty/garbage JSON, no valid
    indices) → fall back to the dense top-N (`chunks.slice(0, topN)`, ranks reassigned). Never
    throws. Logs its action/strategy like `QueryContextualizerService` (quiet on
    `LlmExhaustedException`, `warn` on unexpected errors).

Judge prompt (inline, mirroring `QueryContextualizerService`'s inline prompt):

- **System:** relevance judge for an insurance KB; given a customer QUESTION and a numbered list of
  CANDIDATE passages, select which passages actually help answer the question — judge by whether the
  passage **contains the answer / directly relevant facts**, not by keyword overlap; return ONLY
  `{"ranking":[n,...]}` listing candidate numbers most→least helpful, best first; include only
  genuinely helpful passages (up to N).
- **User:** the question + numbered, truncated candidates.

### 2. `DecisionEngine` (`apps/api/src/chatbot/decision/decision-engine.service.ts`)

- Inject `RerankerService`.
- Add one private helper `retrieveReranked(searchQuery): Promise<RetrievalResult>`:
  1. `const retrieval = await this.retrieval.retrieve(searchQuery, { topK: this.reranker.fetchTopK() })`
  2. `const chunks = await this.reranker.rerank(searchQuery, retrieval.chunks)`
  3. return `{ ...retrieval, chunks }` (telemetry fields — latencies, model — unchanged).
- Replace **both** `this.retrieval.retrieve(searchQuery)` calls with `this.retrieveReranked(searchQuery)`:
  - the main pipeline in `decide()` (currently ~line 169),
  - `tryRagAnswer()` (currently ~line 302).
- Telemetry (`acc.topChunks`, `acc.topChunkScore`, `acc.chunksRetrieved`, etc.) continues to read from
  the returned result; `acc.topChunkScore` becomes the dense score of the reranked-best chunk (used for
  telemetry only — no gate depends on it; the confidence gate uses `draft.draftConfidence`).

### 3. `KnowledgeModule` (`apps/api/src/chatbot/knowledge/knowledge.module.ts`)

- Add `RerankerService` to `providers` and `exports`. The decision module already imports
  `KnowledgeModule` (it injects `RetrievalService` + `QueryContextualizerService`), so no further wiring.

### 4. Env documentation

Document `CHATBOT_RERANK_ENABLED`, `CHATBOT_RERANK_CANDIDATE_K`, `CHATBOT_RERANK_TOP_N` following the
existing `CHATBOT_*` flag pattern (e.g. wherever `CHATBOT_ENRICH_TABLE_ROWS` /
`CHATBOT_CONFIDENCE_DECOUPLE_LANG` are documented — `docs/chatbot-runbook.md` / `docs/README-chatbot.md`).
Confirm at execute time whether `.env.example` is the right place (a prior note flags that some env
edits stay local); default to documenting in the runbook + README which already reference reranking.

## Data flow

```
inbound message
  → QueryContextualizerService.contextualize()      (existing: resolve follow-ups)
  → DecisionEngine.retrieveReranked(searchQuery)     (NEW seam)
      → RetrievalService.retrieve({ topK: 20 })      (wide candidate set when enabled; 5 when off)
      → RerankerService.rerank(query, chunks)        (LLM-judge → reorder → top-5, ranks 1..5)
  → DrafterService.draft({ chunks })                 (existing: sees reranked top-5)
  → GuardrailsService.evaluate()                     (existing: over reranked top-5)
```

## Error handling / degradation

- Reranker never throws. On any LLM/parse failure → dense top-N (identical to flag-off behavior for
  that query). A reranker blip therefore can never poison the answering path
  (consistent with the transient-failure policy in `chatbot-transient-failure-and-tunnel.md`).
- `EmbeddingsExhaustedException` / `LlmExhaustedException` thrown by `retrieve()` itself are caught by
  the decision engine exactly as today (the new helper does not swallow them).

## Testing

**Unit — `reranker.service.spec.ts`** (mock `LlmRouterService`, pattern from
`query-contextualizer.service.spec.ts`):

1. Disabled → returns dense top-N unchanged; LLM **not** called.
2. Enabled + ranking that promotes the answer chunk → answer chunk is `rank: 1`; ranks contiguous 1..N.
3. Enabled + `LlmExhaustedException` → dense top-N fallback; no throw.
4. Enabled + empty/garbage JSON → dense top-N fallback.
5. Enabled + out-of-range / duplicate indices → sanitized; shortfall filled in dense order to N.
6. Citation integrity: returned `rank` values are contiguous 1..N and map 1:1 to `chunkId`s.

**Integration — extend `decision-engine.service.spec.ts`:** when the flag is enabled, the engine
fetches with the wide `topK` and the drafter receives the reranked chunks (at both retrieve sites).

## Validation (the real proof — requires real Ollama)

Real models required (bge-m3 + qwen2.5:14b) at `localhost:11434` (team uses an ssh tunnel to a GPU box).
**Verify first:** `curl -s localhost:11434/api/tags` lists `bge-m3`. If unreachable, report and stop —
the unit tests still pass in mock mode, but the FAIL→PASS proof cannot be produced.

1. Baseline (flag off) — confirm NCD-BM still FAILs (red):
   `cd apps/api && WHATSAPP_MOCK_MODE=true npx ts-node scripts/grade-bm-eval.ts`
2. Reranker on — NCD-BM (phone `60139042`) flips **FAIL→PASS**, **no regressions** on the other graded cases:
   `cd apps/api && WHATSAPP_MOCK_MODE=true CHATBOT_RERANK_ENABLED=true npx ts-node scripts/grade-bm-eval.ts`
3. Bonus unblock — both flags on, re-confirm green:
   `cd apps/api && WHATSAPP_MOCK_MODE=true CHATBOT_RERANK_ENABLED=true CHATBOT_CONFIDENCE_DECOUPLE_LANG=true npx ts-node scripts/grade-bm-eval.ts`

Graded fixture: `apps/api/src/chatbot/sim/bm-eval.json` (`expect.fact` / `mustNotSay`).
RHB-BM is already re-ingested with enrichment.

## Cost / latency

One extra `classify` call per **answered** query (skipped for the pre-RAG IGNORE/ESCALATE branches and
the consent-offer/KB-miss paths, which never reach the drafter). Bounded by `candidateK=20` candidates,
each truncated to ~600 chars, with a tiny output (`maxTokens ~128`, just index numbers).

## Rollout

Both flags ship **default-OFF**:

- `CHATBOT_RERANK_ENABLED` default `false` — new.
- `CHATBOT_CONFIDENCE_DECOUPLE_LANG` default `false` — unchanged (already committed-but-undeployed
  on purpose; the reranker is its prerequisite). This task proves it is safe to enable; the user flips
  both in `.env` at deploy time.

## Out-of-scope follow-ups (noted, not done here)

- NCD-class retrieval beyond this case (other term-dense walls) — the reranker should generalize, but
  broader coverage is its own evaluation.
- Promoting the reranker to other retrieval consumers (REST preview) — intentionally not wired.
