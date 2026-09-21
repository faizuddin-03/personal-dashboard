# BM drafter confidence calibration — design

**Date:** 2026-06-16
**Branch:** feat/ai-chatbot
**Status:** approved (design), pending spec review

## Problem

The chatbot answers Bahasa Malaysia (BM) questions against the (mostly English) insurance KB correctly in most cases — verified live on 2026-06-16 via the sim harness (real `qwen2.5:14b` + `bge-m3`, WhatsApp mocked) with a 23-message paired EN/BM/Manglish eval across 10 topics (`apps/api/src/chatbot/sim/bm-eval.json`).

Cross-lingual retrieval via `bge-m3` is solid: BM queries hit the correct English chunks, often at similarity ≥ the English control. The drafter then answers in fluent BM. Of the 8 topics English could answer, BM also answered 7.

**The one genuine BM-specific gap:** the drafter's self-reported `confidence` is **mis-calibrated for cross-lingual answers**. When it composes a BM answer from English sources, it sometimes rates lower than for the identical English question, even though the sources fully contain the answer. That trips the `confidence_threshold = 0.85` gate in the decision engine and falls back to a `consent_offer` ("shall I connect you to support?") instead of answering.

Cleanest evidence — **NCD-on-claim**, identical topic, identical retrieval quality:

| Variant | Decision | draftConfidence | topChunkScore |
|---|---|---|---|
| EN | `rag_answer` (answered) | 1.0 | 0.786 |
| BM | `consent_offer` (punted) | 0.5 | 0.744 |

So BM has a **higher false-escalation rate than English purely from confidence scoring** — not from retrieval and not from missing knowledge.

**Out of scope (deliberately):** roadside-limit and flood/comprehensive failed in BM *and* in English (flood: all variants stuck at draftConfidence 0.80 < 0.85). Those are KB-coverage/threshold limits, language-neutral, and are not what this change targets.

## Root cause

In `buildDrafterSystemPrompt` (`apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts`) the confidence instruction reads:

> `- confidence: how well the SOURCES answer the question. 1.0 = perfect, 0.5 = partial, 0.0 = no relevant info found.`

This is *intended* to be source-coverage-based, but the model conflates "how well the sources answer" with "how confident am I phrasing this in the reply language." For an English source + a BM reply, that conflation drags the score below 0.85.

## Approach

**Chosen: A — sharpen the confidence instruction.** Reword the `confidence` line to explicitly decouple it from output-language difficulty: confidence measures whether the SOURCES contain the facts to answer, NOT how hard it is to phrase the reply. Pure prompt change; no logic, threshold, or guardrail changes.

Rejected alternatives:
- **B — two-pass (answer, then a separate confidence call).** Doubles LLM round-trips on a model already hitting 15s timeouts. Not worth the latency.
- **C — language-aware threshold (lower `confidence_threshold` for `ms`).** Treats the symptom: it also lets genuinely weak BM answers (thin coverage, e.g. flood) leak through, and leaves confidence mis-calibrated for operator review and metrics.

## The change

In `drafter.prompt.ts`, both `confidenceLine` variants (the `usesCampaign` true and false branches) become:

> `- confidence: how well the SOURCES contain the facts needed to answer — NOT how hard it is to phrase the reply. If the facts are present, stay confident even when you must translate them into ${lang}. 1.0 = fully answered, 0.5 = partial, 0.0 = no relevant info.`

(The campaign variant keeps its `SOURCES/CAMPAIGN` phrasing.)

Nothing else changes. The `Use ONLY the facts in the SOURCES` / no-invention instruction and all six guardrails (`no_unknown_promises`, length, `no_ai_self_reference`, etc.) are untouched, so hallucination protection is unaffected — a model that has no facts still scores 0.0 and still must say "let me check."

Applied directly (no env-flag gate) per decision on 2026-06-16; the change is prompt-only and improves calibration generally, and the live eval re-run is the safety net.

## Testing

**Unit (`drafter.prompt.spec.ts`, TDD):**
- The built prompt contains the decoupling clause ("NOT how hard it is to phrase the reply").
- The clause interpolates the language: `Bahasa Malaysia` when `language: 'ms'`, `English` when `language: 'en'`.
- Both campaign and non-campaign paths include it.

**Integration (live eval re-run):**
Re-run `apps/api/src/chatbot/sim/bm-eval.json` with `WHATSAPP_MOCK_MODE=true` against the live models. Acceptance bar:
1. BM NCD-on-claim (T04) flips `consent_offer → rag_answer` with a correct BM answer.
2. **No EN control regresses** — every topic English currently answers still answers.
3. Thin-coverage cases (flood, roadside) MAY stay `consent_offer`; what must NOT happen is them starting to answer with invented figures.
4. Ideally: full BM/EN parity — every topic EN answers, BM also answers.

The eval writes synthetic `+60139…` contacts to the LIVE DB; clean them up after (delete contacts by exact phone → cascades children).

## Risk & rollback

- **Risk:** the decoupling clause could over-encourage answering from thin sources. Mitigation: the score is still anchored to "do the SOURCES contain the facts"; the no-invention instruction + `no_unknown_promises` guard remain. The eval re-run explicitly checks flood stays cautious rather than hallucinating.
- **Rollback:** single prompt string in one file; revert the commit.

## Files touched

- `apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts` — reword both `confidenceLine` variants.
- `apps/api/src/chatbot/drafter/prompts/drafter.prompt.spec.ts` — add calibration-instruction assertions.
- (verification only, no source change) `apps/api/src/chatbot/sim/bm-eval.json`.
