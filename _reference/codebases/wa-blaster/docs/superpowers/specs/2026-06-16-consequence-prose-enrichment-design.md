# Consequence-prose enrichment + content-grading eval — design

**Date:** 2026-06-16
**Branch:** feat/ai-chatbot
**Status:** approved (design), pending spec review
**Follows:** `2026-06-16-bm-confidence-calibration-design.md` (the confidence fix that unmasked this bug)

## Problem

The BM confidence-calibration change exposed a retrieval defect, confirmed live: the question *"Apakah yang berlaku kepada NCD saya jika saya membuat tuntutan?"* (what happens to my NCD if I claim?) retrieves only NCD **accrual** chunks ("Selepas N tahun → X%") and the drafter confabulates a wrong, money-related answer ("NCD kembali ke peratusan asal dan tidak lagi meningkat") that **contradicts the KB**. The KB is correct — `apps/api/knowledge/rhb/rhb-private-car-bm.md:364` says a claim makes NCD **become zero** and accumulation **restarts**.

**Root cause (measured):** the correct chunk exists and is relevant (similarity **0.649** to the query) but is crowded out of the top-5 by ~15 near-duplicate accrual rows scoring **0.728–0.744**. The accrual rows are `kind:'table_row'` chunks that were **enriched** at ingest (customer-phrasing restatements appended), boosting their similarity; the consequence prose ("menjadi sifar") is a paragraph chunk that enrichment **never touches** (enrichment is gated to figure-bearing table rows in `IngestionService`). So consequence/scenario prose loses retrieval to enriched figure-rows on the same topic. **This generalizes** beyond NCD to any "what happens if…" question whose answer lives in prose.

A second, compounding finding: the same EN query retrieves the concise generic "No Claim Discount" explainer (which *does* say "resets to 0%"), so EN answers correctly while BM does not — the two diverge because they hit different docs.

## Goals

1. Make consequence/scenario prose competitive in retrieval so NCD-class BM (and EN) questions get the correct chunk.
2. Build a **content-grading** eval (not just routing-label) that catches confabulation/contradiction automatically — this class of bug was invisible to the prior eval.

## Non-goals

- Hybrid/keyword retrieval (considered, rejected for scope this round).
- Changing the confidence gate or guardrails (the prior change stands).
- Reconciling whether RHB's NCD truly resets to 0% vs a tier — both cited docs agree it goes to zero, so no KB correction is needed here.

## Approach

**Eval-first (red → green).** Harden the eval to assert answer *content* and confirm NCD-BM **FAILS** on the current KB before changing retrieval. Then the enrichment fix turns it green.

### Component 1 — Content-grading eval (built and confirmed red first)

- **`bm-eval.json`** entries gain an optional field:
  ```json
  { "phone": "...", "message": "...", "label": "...",
    "expect": { "fact": "<ground truth the reply must convey>", "mustNotSay": ["<forbidden substring>", ...] } }
  ```
  Populate `expect` for the factual cases (NCD EN+BM, flood EN+BM, under-21 excess EN+BM, windscreen EN+BM). Cases without `expect` are graded on routing only (as today).
- **`scripts/grade-bm-eval.ts`** (new, separate from the live pipeline): boots the sim context, and for each entry calls `ChatbotSimulator.simulate(phone, message)` (per-entry, guaranteeing alignment with `expect`). For entries with `expect`:
  - `answer = customerReply ?? operatorDraft ?? ''`.
  - **PASS** iff the decision answered (`subKind === 'rag_answer'`) **and** an LLM-judge confirms `answer` faithfully conveys `expect.fact` without contradicting it, **and** none of `expect.mustNotSay` appears (case-insensitive).
  - The LLM-judge uses the fast `classify` chain (temp 0, JSON `{correct: boolean, reason: string}`), prompt: "Does the REPLY correctly and faithfully convey FACT, without stating the opposite? Ignore phrasing/language differences."
  - Prints a per-case PASS/FAIL table + counts; exits non-zero if any graded case fails (so it can gate).
  - Cleans up synthetic `+60139…` contacts at the end (same as the manual eval).
- **Acceptance for this component:** on the current LIVE KB, the NCD-BM case = **FAIL** (proves the harness detects the bug); the EN/grounded cases (flood, under-21, windscreen) = PASS.

### Component 2 — Consequence-prose enrichment

- **`EnrichmentService.enrichProse(text, docTitle): Promise<string>`** — new method, sibling to `enrichTableRow`. System prompt: *"Given a passage of an insurance policy that states a rule, condition, or consequence, write 2-3 plain sentences that restate the rule/outcome and include the everyday phrasings and scenarios a customer would use to ask about it (e.g. 'what happens to my NCD if I claim'). Preserve every fact and figure exactly. Do NOT invent conditions or numbers. Output only the text."* Same best-effort contract as `enrichTableRow`: never throws, empty on failure, length-guarded (`<= text.length + 800`).
- **Selection gate** — enrich a chunk's prose when it is **not** a `table_row`, has **no** figure (figures already covered by the table-row path), is of substantive length (`>= CHATBOT_ENRICH_PROSE_MIN_TOKENS`, default 30 — skips heading-only / overlap-only fragments), **and** matches a bilingual consequence cue. Cue regex (case-insensitive), requiring a scenario reference and/or an outcome term:
  - scenario: `claim|tuntutan|accident|kemalangan|kejadian|breakdown|rosak`
  - outcome: `zero|sifar|reset|forfeit|hilang|terjejas|reject|ditolak|tolak|not covered|tidak dilindungi|excess|ekses|no longer|tidak lagi|kecuali|unless|except`
  The NCD "menjadi sifar" chunk matches (`tuntutan` + `sifar`). The cue gate keeps enrichment focused on "what-happens-if" content and bounds cost; if the eval later shows the gate misses real cases, widen it (documented fallback: enrich all prose `>= min tokens`).
- **`IngestionService`** loop: when enrichment is enabled, for `kind==='table_row'` call `enrichTableRow` (unchanged); else if the prose gate passes, call `enrichProse` and append. Reuses the existing `CHATBOT_ENRICH_TABLE_ROWS` flag (name retained for compatibility; now gates both kinds).
- **Selection lives in the chunker/ingestion boundary**, exposed as a small pure predicate (e.g. `EnrichmentService.shouldEnrichProse(text)`) so it is unit-testable without the LLM.

### Component 3 — Staged re-ingest & validation

- Re-ingest the affected docs first: **RHB Private Car BM, RHB Private Car EN, Zurich Perkataan Polisi BM** — via the existing `scripts/ingest-plan-kb.ts` → `scripts/publish-plan-kb.ts` flow, with `CHATBOT_ENRICH_TABLE_ROWS=true`.
- Validate: re-run `grade-bm-eval.ts` → NCD-BM flips **FAIL → PASS**; the full 23-case routing eval shows **no regressions** (routing or content).
- Roll out to the remaining LIVE docs only after the affected-doc validation passes.

## Testing

- **Unit:** `EnrichmentService.shouldEnrichProse` — true for the NCD consequence text, false for a heading-only fragment, a figure row, and a short boilerplate line. `enrichProse` returns '' on LLM failure / runaway output (mock the router).
- **Unit:** `IngestionService` enriches a prose chunk that passes the gate and skips one that doesn't (mock EnrichmentService; assert call/no-call).
- **Integration (live, red→green):** `grade-bm-eval.ts` — NCD-BM FAIL on current KB; PASS after re-ingest of the affected docs; no regressions across the 23 cases.

## Risk & rollback

- **Broad prose enrichment could shift other rankings.** Mitigation: the cue gate keeps it targeted; the full 23-case content+routing eval guards against regressions before rollout.
- **One-time ingest cost / 14b latency.** Mitigation: staged re-ingest (affected docs first); enrichment is ingest-time only, zero per-query.
- **Enrichment inventing facts.** Same discipline as `enrichTableRow`: explicit "do not invent" prompt + length guard + best-effort empty-on-failure. The content-eval would catch a fabrication.
- **Rollback:** the enrichment is additive at ingest. Reverting the code + re-ingesting the affected docs (or restoring the prior chunks) returns to the old state; the confidence-calibration change is independent and stays.

## Files touched

- `apps/api/src/chatbot/knowledge/enrichment.service.ts` — add `enrichProse` + `shouldEnrichProse`.
- `apps/api/src/chatbot/knowledge/enrichment.service.spec.ts` (new or extended) — gate + enrichProse unit tests.
- `apps/api/src/chatbot/knowledge/ingestion.service.ts` — enrich prose chunks via the gate.
- `apps/api/src/chatbot/knowledge/ingestion.service.spec.ts` — prose enrichment call/skip tests.
- `apps/api/src/chatbot/sim/bm-eval.json` — add `expect` to factual cases.
- `apps/api/scripts/grade-bm-eval.ts` (new) — content-grading runner.
- `apps/api/.env.example` — document `CHATBOT_ENRICH_PROSE_MIN_TOKENS` (local-only; not committed per project convention).
