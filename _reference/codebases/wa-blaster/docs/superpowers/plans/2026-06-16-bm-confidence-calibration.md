# BM Drafter Confidence Calibration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop the drafter from under-rating BM answers composed from English sources, which trips the 0.85 confidence gate and false-escalates to a consent_offer.

**Architecture:** Prompt-only change in `buildDrafterSystemPrompt` — reword the `confidence` instruction so the score is anchored to whether the SOURCES contain the facts, explicitly decoupled from how hard the answer is to phrase in the reply language. No logic, threshold, or guardrail changes. Verified by a live eval re-run.

**Tech Stack:** NestJS, TypeScript, Jest, Ollama (`qwen2.5:14b` chat + `bge-m3` embeddings) over an SSH tunnel.

---

## File Structure

- `apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts` — `buildDrafterSystemPrompt`; the two `confidenceLine` variants (campaign + non-campaign) get reworded. Single responsibility: build the drafter system prompt. (~58 lines, stays small.)
- `apps/api/src/chatbot/drafter/prompts/drafter.prompt.spec.ts` — add assertions for the new calibration clause. Pure string-content tests, no LLM.
- `apps/api/src/chatbot/sim/bm-eval.json` — verification fixture (already created). No source change; committed as the regression artifact.

---

## Task 1: Reword the confidence instruction (TDD)

**Files:**
- Modify: `apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts:38-40`
- Test: `apps/api/src/chatbot/drafter/prompts/drafter.prompt.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `drafter.prompt.spec.ts` inside the `describe('buildDrafterSystemPrompt', …)` block:

```typescript
  it('anchors confidence to source coverage, not output-language difficulty (ms)', () => {
    const p = buildDrafterSystemPrompt({ businessName: 'X', language: 'ms', chunks: [] });
    expect(p).toContain('NOT how hard it is to phrase the reply');
    expect(p).toContain('translate them into Bahasa Malaysia');
  });

  it('interpolates the reply language into the confidence instruction (en)', () => {
    const p = buildDrafterSystemPrompt({ businessName: 'X', language: 'en', chunks: [] });
    expect(p).toContain('NOT how hard it is to phrase the reply');
    expect(p).toContain('translate them into English');
  });

  it('keeps the calibration clause on the campaign path', () => {
    const p = buildDrafterSystemPrompt({
      businessName: 'X',
      language: 'ms',
      chunks: [],
      campaignText: 'Promo',
    });
    expect(p).toContain('NOT how hard it is to phrase the reply');
    expect(p).toContain('CAMPAIGN/SOURCES contain the facts');
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd apps/api && npx jest src/chatbot/drafter/prompts/drafter.prompt.spec.ts --runInBand`
Expected: the 3 new tests FAIL (`Expected substring: "NOT how hard it is to phrase the reply"`); the 4 existing tests still PASS.

- [ ] **Step 3: Reword both `confidenceLine` variants**

In `drafter.prompt.ts`, replace lines 38-40:

```typescript
  const confidenceLine = usesCampaign
    ? '- confidence: how well the CAMPAIGN/SOURCES answer the question. 1.0 = perfect, 0.5 = partial, 0.0 = no relevant info found.'
    : '- confidence: how well the SOURCES answer the question. 1.0 = perfect, 0.5 = partial, 0.0 = no relevant info found.';
```

with (note: backticks — these now interpolate `${lang}`):

```typescript
  const confidenceLine = usesCampaign
    ? `- confidence: how well the CAMPAIGN/SOURCES contain the facts needed to answer — NOT how hard it is to phrase the reply. If the facts are present, stay confident even when you must translate them into ${lang}. 1.0 = fully answered, 0.5 = partial, 0.0 = no relevant info.`
    : `- confidence: how well the SOURCES contain the facts needed to answer — NOT how hard it is to phrase the reply. If the facts are present, stay confident even when you must translate them into ${lang}. 1.0 = fully answered, 0.5 = partial, 0.0 = no relevant info.`;
```

(`lang` is already in scope at the top of the function: `'Bahasa Malaysia'` for `ms`, `'English'` for `en`.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd apps/api && npx jest src/chatbot/drafter/prompts/drafter.prompt.spec.ts --runInBand`
Expected: all 7 tests PASS.

- [ ] **Step 5: Run the full drafter suite for regressions**

Run: `cd apps/api && npx jest src/chatbot/drafter --runInBand`
Expected: all drafter specs PASS (drafter.service.spec, canned-replies, prompt spec).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts \
        apps/api/src/chatbot/drafter/prompts/drafter.prompt.spec.ts
git commit -F - <<'MSG'
fix(chatbot): anchor drafter confidence to source coverage, not reply-language difficulty

BM answers composed from English sources were self-rated below the 0.85
gate (NCD: EN 1.0 vs BM 0.5), causing false consent_offer escalations.
Reword the confidence instruction to decouple it from phrasing/translation
difficulty. Prompt-only; no-invention guardrails unchanged.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
```

---

## Task 2: Live integration verification (eval re-run)

**Files:**
- Use: `apps/api/src/chatbot/sim/bm-eval.json` (no change)

**Pre-req:** Ollama tunnel up — verify `curl -s http://localhost:11434/api/tags` lists `bge-m3` + `qwen2.5:14b`. If down: `ssh -fN -L 11434:localhost:11434 team05@10.20.50.22` (or the `ollama-tunnel` zsh helper).

- [ ] **Step 1: Re-run the eval against live models (WhatsApp mocked)**

Run: `cd apps/api && WHATSAPP_MOCK_MODE=true npx ts-node src/chatbot/sim/sim.cli.ts --file=src/chatbot/sim/bm-eval.json`
Expected: a per-message decision dump + a `Summary by subKind`.

- [ ] **Step 2: Check the acceptance bar against the dump**

Compare to the 2026-06-16 baseline (17 rag_answer / 6 consent_offer):
1. BM NCD-on-claim (`60139042`) flips `consent_offer → rag_answer` with a correct BM answer (NCD resets to 0% at renewal).
2. **No EN control regresses** — every `…1` (EN) topic that answered before still answers.
3. Flood (`…32/…33`) and roadside (`…12`) MAY stay `consent_offer`; they must NOT answer with invented figures.

If the bar isn't met, STOP and diagnose (do not loosen the threshold to force a pass).

- [ ] **Step 3: Clean up synthetic test data from the LIVE DB**

The sim writes `+60139…` contacts. Remove them (cascades conversations/decisions/drafts/messages):

```bash
cd apps/api && npx ts-node -e "import 'dotenv/config'; import {PrismaClient} from '@prisma/client'; const p=new PrismaClient(); const phones=['011','012','013','021','022','023','031','032','033','041','042','051','052','061','062','071','072','081','082','091','092','101','102'].map(s=>'+60139'+s); p.contact.deleteMany({where:{phoneE164:{in:phones}}}).then(r=>{console.log('deleted',r.count);return p.\$disconnect();});"
```

Expected: `deleted 23`.

- [ ] **Step 4: Commit the eval fixture**

```bash
git add apps/api/src/chatbot/sim/bm-eval.json
git commit -F - <<'MSG'
test(chatbot): add BM/EN/Manglish cross-lingual eval fixture

23-message paired eval across 10 insurance topics for re-running the
language regression check through the sim harness.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
```

---

## Task 3: Adversarial review of the change (ultracode)

**Files:** none (review only)

- [ ] **Step 1: Dispatch independent reviewers (Workflow)**

Run a small workflow with reviewers each holding a distinct lens:
- **Hallucination lens:** does the new wording weaken the "ONLY the facts in SOURCES" / `no_unknown_promises` protection, or encourage answering from thin sources?
- **Regression lens:** could the reword lower EN confidence anywhere, or change the campaign path's behavior?
- **Eval lens:** scrutinize the Step-2 dump for any regression the acceptance bar missed (e.g. a topic that flipped the wrong way, a fluency degradation).

Each returns a verdict (real concern / not). Only act on concerns confirmed by the majority.

- [ ] **Step 2: Apply confirmed fixes (if any) and re-run Task 1 Steps 4-5**

If reviewers surface a real issue, fix the prompt wording, re-run the unit suite, and re-run the eval (Task 2 Step 1-2). Otherwise record "no concerns confirmed."

---

## Self-Review

- **Spec coverage:** Approach A (reword confidence line) → Task 1. Unit tests (clause present + language interpolation + campaign path) → Task 1 Step 1. Live eval acceptance bar → Task 2 Step 2. Risk/rollback (no-invention intact) → Task 3 hallucination lens. Cleanup of synthetic data → Task 2 Step 3. All spec sections covered.
- **Placeholder scan:** none — every step has exact code/commands.
- **Type consistency:** no new types; `confidenceLine` stays a `string`, now built with template literals; `lang` is the existing in-scope variable.
