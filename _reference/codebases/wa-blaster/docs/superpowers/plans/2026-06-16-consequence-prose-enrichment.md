# Consequence-Prose Enrichment + Content-Grading Eval — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make consequence/scenario prose retrievable so NCD-class questions get the correct chunk instead of confabulating, and add a content-grading eval that catches such confabulation automatically.

**Architecture:** Eval-first (red→green): build a content-grading eval and confirm the NCD-BM case fails on the current KB, then extend ingest-time enrichment to consequence prose (a sibling to the existing figure-table-row enrichment), re-ingest the affected docs, and confirm the eval goes green with no regressions.

**Tech Stack:** NestJS, TypeScript, Jest, Ollama (`qwen2.5:14b` + `bge-m3`) over the SSH tunnel, pgvector.

---

## File Structure

- `apps/api/scripts/grade-bm-eval.ts` — NEW. Content-grading runner: runs the sim per eval entry, LLM-judges the reply against an expected fact. Separate from the live pipeline.
- `apps/api/src/chatbot/sim/bm-eval.json` — add optional `expect` to factual cases.
- `apps/api/src/chatbot/knowledge/enrichment.service.ts` — add `shouldEnrichProse` (pure predicate) + `enrichProse` (LLM).
- `apps/api/src/chatbot/knowledge/enrichment.service.spec.ts` — gate + enrichProse unit tests.
- `apps/api/src/chatbot/knowledge/ingestion.service.ts` — enrich prose chunks via the gate.
- `apps/api/src/chatbot/knowledge/ingestion.service.spec.ts` — prose enrich call/skip test.

---

## Task 1: Content-grading eval harness (build, confirm RED)

**Files:**
- Modify: `apps/api/src/chatbot/sim/bm-eval.json`
- Create: `apps/api/scripts/grade-bm-eval.ts`

- [ ] **Step 1: Add `expect` to the factual eval cases**

In `bm-eval.json`, add an `expect` field to the NCD, flood, under-21, and windscreen cases (both EN + BM). Example for the two NCD entries:

```json
  { "phone": "60139041", "label": "T04 NCD-on-claim | EN control | KB:english-only", "message": "What happens to my No Claim Discount (NCD) if I make a claim this year?", "expect": { "fact": "Making a claim causes the No Claim Discount to drop to 0% (zero) at the next renewal, and the customer must start accumulating NCD again from scratch.", "mustNotSay": ["no longer increase", "tidak lagi meningkat"] } },
  { "phone": "60139042", "label": "T04 NCD-on-claim | BM pure | KB:english-only", "message": "Apakah yang berlaku kepada Diskaun Tiada Tuntutan (NCD) saya jika saya membuat tuntutan tahun ini?", "expect": { "fact": "Membuat tuntutan menyebabkan NCD menjadi sifar (0%) pada pembaharuan berikutnya, dan pengumpulan NCD bermula semula.", "mustNotSay": ["tidak lagi meningkat", "kembali ke peratus"] } },
```

Use these `expect.fact` values for the other three topics (no `mustNotSay` needed):
- flood EN (`60139031`) / BM (`60139032`): `"Comprehensive insurance does not cover flood by default; flood (special perils) is an optional add-on for an extra premium."`
- under-21 EN (`60139061`) / BM (`60139062`): `"If a driver under 21 drives the car and a claim is made, an additional compulsory excess of RM400 applies."`
- windscreen EN (`60139021`) / BM (`60139022`): `"Windscreen damage is covered as an add-on; with the windscreen endorsement (Endorsement 89) a windscreen-only claim does not affect the NCD."`

Leave all other entries unchanged (graded on routing only).

- [ ] **Step 2: Create the grader**

Create `apps/api/scripts/grade-bm-eval.ts`:

```typescript
import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { SimAppModule } from '../src/chatbot/sim/sim-app.module';
import { ChatbotSimulator } from '../src/chatbot/sim/sim.command';
import { LlmRouterService } from '../src/chatbot/llm/llm-router.service';
import { PrismaService } from '../src/prisma/prisma.service';

interface Entry {
  phone: string;
  message: string;
  label?: string;
  expect?: { fact: string; mustNotSay?: string[] };
}

const JUDGE_SYSTEM =
  'You grade an insurance chatbot reply against a known FACT. Answer ONLY a JSON object ' +
  '{"correct": true|false, "reason": "..."}. correct=true ONLY if the REPLY conveys the FACT and ' +
  'does NOT state the opposite. Ignore language, phrasing, and extra detail; judge factual content only.';

async function judge(llm: LlmRouterService, fact: string, reply: string): Promise<{ correct: boolean; reason: string }> {
  if (!reply.trim()) return { correct: false, reason: 'empty reply' };
  try {
    const res = await llm.complete(
      'classify',
      [
        { role: 'system', content: JUDGE_SYSTEM },
        { role: 'user', content: `FACT: ${fact}\n\nREPLY: ${reply}` },
      ],
      { temperature: 0, maxTokens: 150, jsonMode: true },
    );
    const p = JSON.parse(res.text);
    return { correct: p.correct === true, reason: String(p.reason ?? '') };
  } catch (e) {
    return { correct: false, reason: `judge error: ${(e as Error).message}` };
  }
}

async function main(): Promise<void> {
  const file = process.argv[2] ?? resolve(__dirname, '../src/chatbot/sim/bm-eval.json');
  const entries = JSON.parse(readFileSync(file, 'utf-8')) as Entry[];
  const app = await NestFactory.createApplicationContext(SimAppModule, { logger: ['error'] });
  const sim = new ChatbotSimulator(app);
  const llm = app.get(LlmRouterService, { strict: false });
  const prisma = app.get(PrismaService, { strict: false });

  let fails = 0;
  for (const e of entries) {
    const r = await sim.simulate(e.phone, e.message);
    if (!e.expect) {
      console.log(`[ -- ] ${(e.label ?? e.phone).padEnd(42)} ${r.subKind}`);
      continue;
    }
    const answer = r.customerReply ?? r.operatorDraft ?? '';
    let grade = 'FAIL';
    let reason = '';
    if (r.subKind !== 'rag_answer') {
      reason = `not answered (${r.subKind})`;
    } else if (e.expect.mustNotSay?.some((s) => answer.toLowerCase().includes(s.toLowerCase()))) {
      reason = 'hit mustNotSay';
    } else {
      const v = await judge(llm, e.expect.fact, answer);
      grade = v.correct ? 'PASS' : 'FAIL';
      reason = v.reason;
    }
    if (grade === 'FAIL') fails++;
    console.log(`[${grade.padEnd(4)}] ${(e.label ?? e.phone).padEnd(42)} ${r.subKind.padEnd(14)} ${reason.slice(0, 80)}`);
  }

  const phones = entries.map((e) => '+' + e.phone.replace(/\D/g, ''));
  const del = await prisma.contact.deleteMany({ where: { phoneE164: { in: phones } } });
  console.log(`\nGraded FAILs: ${fails}   (cleaned ${del.count} synthetic contacts)`);
  await app.close();
  process.exit(fails > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

- [ ] **Step 3: Confirm the tunnel is up**

Run: `curl -s http://localhost:11434/api/tags | grep -o bge-m3`
Expected: prints `bge-m3`. If not: `ssh -fN -L 11434:localhost:11434 team05@10.20.50.22`.

- [ ] **Step 4: Run the grader against the current LIVE KB — confirm RED**

Run: `cd apps/api && WHATSAPP_MOCK_MODE=true npx ts-node scripts/grade-bm-eval.ts`
Expected: exit code 1. The **NCD-BM** case (`60139042`) = **FAIL** (`not answered` is acceptable too if it lands consent_offer, but on the current KB it auto-sends the wrong content → FAIL on the judge). The flood / under-21 / windscreen cases (EN+BM) = **PASS**. This proves the harness detects the confabulation.

- [ ] **Step 5: Commit**

```bash
git add apps/api/scripts/grade-bm-eval.ts apps/api/src/chatbot/sim/bm-eval.json
git commit -F - <<'MSG'
test(chatbot): content-grading eval (LLM-judge) for the BM cross-lingual fixture

Grades the actual reply against an expected fact, not just the rag_answer/
consent_offer routing label. Confirms NCD-BM ships a wrong answer on the
current KB (red); turns green after consequence-prose enrichment.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
MSG
```

---

## Task 2: EnrichmentService — prose gate + enrichment (TDD)

**Files:**
- Modify: `apps/api/src/chatbot/knowledge/enrichment.service.ts`
- Test: `apps/api/src/chatbot/knowledge/enrichment.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append to `enrichment.service.spec.ts` (a `LlmRouterService` mock already exists in this suite; mirror its pattern):

```typescript
  describe('shouldEnrichProse', () => {
    const svc = new EnrichmentService({ complete: jest.fn() } as any);

    it('enriches a consequence passage (claim + outcome cue, no figure)', () => {
      const text =
        'Satu Tuntutan dan Diskaun Tanpa Tuntutan Anda Menjadi Sifar. Jika Anda membuat tuntutan, ' +
        'kelayakan NCD akan menjadi sifar pada pembaharuan seterusnya.';
      expect(svc.shouldEnrichProse(text)).toBe(true);
    });

    it('skips a figure row (handled by the table-row path)', () => {
      expect(svc.shouldEnrichProse('Selepas 1 tahun tanpa tuntutan — Kelayakan: 25%')).toBe(false);
    });

    it('skips boilerplate with no scenario+outcome cue', () => {
      expect(svc.shouldEnrichProse('This policy is governed by the laws of Malaysia.')).toBe(false);
    });
  });

  describe('enrichProse', () => {
    it('returns "" without calling the LLM when the gate fails', async () => {
      const complete = jest.fn();
      const svc = new EnrichmentService({ complete } as any);
      expect(await svc.enrichProse('Governed by the laws of Malaysia.', 'Doc')).toBe('');
      expect(complete).not.toHaveBeenCalled();
    });

    it('returns the restatement for a passing passage', async () => {
      const complete = jest.fn().mockResolvedValue({ text: 'If you claim, your NCD resets to zero.' });
      const svc = new EnrichmentService({ complete } as any);
      const out = await svc.enrichProse('Jika Anda membuat tuntutan, NCD menjadi sifar.', 'RHB BM');
      expect(out).toBe('If you claim, your NCD resets to zero.');
      expect(complete).toHaveBeenCalled();
    });
  });
```

- [ ] **Step 2: Run to verify they fail**

Run: `cd apps/api && npx jest src/chatbot/knowledge/enrichment.service.spec.ts --runInBand`
Expected: FAIL (`shouldEnrichProse`/`enrichProse` are not functions).

- [ ] **Step 3: Implement the gate + enrichment**

In `enrichment.service.ts`, add the cue regexes (near the existing `FIGURE` const):

```typescript
/** A consequence/scenario passage worth enriching: a scenario reference AND an outcome term. */
const PROSE_SCENARIO = /\b(claim|tuntutan|accident|kemalangan|kejadian|breakdown|rosak)\b/i;
const PROSE_OUTCOME =
  /\b(zero|sifar|reset|forfeit|hilang|terjejas|reject(?:ed)?|ditolak|tolak|excess|ekses|kecuali|unless|except|void|batal|no longer)\b|tidak dilindungi|tidak lagi/i;

const ENRICH_PROSE_SYSTEM =
  'You enrich an insurance knowledge base for semantic search. Given a passage that states a rule, ' +
  'condition, or consequence (e.g. what happens when a customer makes a claim), write 2-3 plain ' +
  'sentences that restate the rule/outcome and include the everyday phrasings and scenarios a ' +
  'customer would use to ask about it. Preserve every fact and figure exactly. Do NOT invent ' +
  'conditions or numbers. Output only the text, no preamble.';
```

Add the methods to the class:

```typescript
  /** True for a non-figure consequence/scenario passage (figures go through enrichTableRow). */
  shouldEnrichProse(text: string): boolean {
    const t = text ?? '';
    if (this.hasFigure(t)) return false;
    return PROSE_SCENARIO.test(t) && PROSE_OUTCOME.test(t);
  }

  /** Enrichment text for a consequence prose chunk, or '' (no LLM call) when the gate fails / on error. */
  async enrichProse(text: string, docTitle: string): Promise<string> {
    if (!this.shouldEnrichProse(text)) return '';
    try {
      const res = await this.llm.complete(
        'draft',
        [
          { role: 'system', content: ENRICH_PROSE_SYSTEM },
          { role: 'user', content: `Document: ${docTitle}\nPassage: ${text}` },
        ],
        { temperature: 0.2, maxTokens: 200 },
      );
      const out = (res.text ?? '').trim();
      return out.length > 0 && out.length <= text.length + 800 ? out : '';
    } catch (e) {
      this.logger.warn(`enrich_prose_failed: ${(e as Error).message}`);
      return '';
    }
  }
```

- [ ] **Step 4: Run to verify they pass**

Run: `cd apps/api && npx jest src/chatbot/knowledge/enrichment.service.spec.ts --runInBand`
Expected: PASS (existing + 5 new).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/chatbot/knowledge/enrichment.service.ts apps/api/src/chatbot/knowledge/enrichment.service.spec.ts
git commit -m "feat(chatbot): enrich consequence prose chunks for retrieval"
```

---

## Task 3: IngestionService — enrich prose chunks (TDD)

**Files:**
- Modify: `apps/api/src/chatbot/knowledge/ingestion.service.ts:38-61`
- Test: `apps/api/src/chatbot/knowledge/ingestion.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Add a test that ingests markdown containing a consequence paragraph (no table) with enrichment ENABLED, and asserts the enrichment LLM was invoked and its text appended. Use a real `EnrichmentService` with a mocked `complete`, and a config that returns `'true'` for `CHATBOT_ENRICH_TABLE_ROWS`. Mirror the existing suite's harness (`noEnrich` / `chunkerConfig()`):

```typescript
  it('enriches a consequence prose chunk when enrichment is enabled', async () => {
    const complete = jest.fn().mockResolvedValue({ text: 'RESTATED: if you claim, NCD becomes zero.' });
    const enrich = new EnrichmentService({ complete } as unknown as LlmRouterService);
    const svc = makeIngestion({ enrich, enrichFlag: 'true' }); // helper that wires config flag=true + this enrichment
    const md =
      '## NCD\n\nJika Anda membuat tuntutan, kelayakan Diskaun Tanpa Tuntutan Anda akan menjadi sifar ' +
      'pada pembaharuan seterusnya dan pengumpulan dimulakan semula.\n';
    const docId = await seedDoc(md); // existing helper that creates a DRAFT doc with contentMd
    await svc.ingest(docId);
    expect(complete).toHaveBeenCalled();
    const chunk = await prisma.knowledgeChunk.findFirst({ where: { documentId: docId } });
    expect(chunk?.text).toContain('RESTATED: if you claim, NCD becomes zero.');
  });
```

If the suite has no `makeIngestion`/`seedDoc` helpers, follow the existing construction pattern in this file (it already builds an `IngestionService` and seeds docs for its integration tests) and pass a `ConfigService` stub whose `get('CHATBOT_ENRICH_TABLE_ROWS', ...)` returns `'true'` and whose `get('CHATBOT_ENRICH_PROSE_MIN_TOKENS', 30)` returns `30`.

- [ ] **Step 2: Run to verify it fails**

Run: `cd apps/api && npx jest src/chatbot/knowledge/ingestion.service.spec.ts --runInBand`
Expected: FAIL — `complete` not called (prose isn't enriched yet) / chunk lacks `RESTATED:`.

- [ ] **Step 3: Wire prose enrichment into the ingest loop**

In `ingestion.service.ts`, add to the constructor (next to `enrichEnabled`):

```typescript
    this.enrichProseMinTokens = Number(config?.get('CHATBOT_ENRICH_PROSE_MIN_TOKENS', 30));
```

and the field: `private readonly enrichProseMinTokens: number;`

Replace the enrichment loop (lines ~49-61) with:

```typescript
    if (this.enrichEnabled && this.enrichment) {
      let enriched = 0;
      for (const c of chunks) {
        let extra = '';
        if (c.kind === 'table_row') {
          extra = await this.enrichment.enrichTableRow(c.text, doc.title);
        } else if (c.tokenCount >= this.enrichProseMinTokens) {
          extra = await this.enrichment.enrichProse(c.text, doc.title); // self-gates via shouldEnrichProse
        }
        if (extra) {
          c.text = `${c.text}\n\n${extra}`;
          c.tokenCount = encode(c.text).length;
          enriched++;
        }
      }
      if (enriched > 0) this.logger.log(`Enriched ${enriched} chunk(s) for document ${documentId}`);
    }
```

- [ ] **Step 4: Run to verify it passes (and no regressions)**

Run: `cd apps/api && npx jest src/chatbot/knowledge --runInBand`
Expected: all knowledge specs PASS (the existing `noEnrich` integration tests keep the flag at default `'false'`, so their behaviour is unchanged).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/chatbot/knowledge/ingestion.service.ts apps/api/src/chatbot/knowledge/ingestion.service.spec.ts
git commit -m "feat(chatbot): ingestion enriches consequence prose chunks (gated)"
```

---

## Task 4: Staged re-ingest + GREEN validation

**Files:** none (operational)

**Pre-req:** tunnel up (`curl -s http://localhost:11434/api/tags | grep -o bge-m3`). Note: re-ingest sets the affected docs to DRAFT then publishes them back LIVE — there is a brief window where those docs are not retrievable, so run ingest→publish back-to-back.

- [ ] **Step 1: Re-ingest the RHB docs (enrichment ON)**

Run: `cd apps/api && EMBEDDINGS_MOCK_MODE=false LLM_MOCK_MODE=false CHATBOT_ENRICH_TABLE_ROWS=true pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "RHB"`
Expected: re-ingests all 4 RHB markdown files; logs `Enriched N chunk(s)` with N now larger than before (prose + table rows). This runs DRAFT.

- [ ] **Step 2: Publish RHB LIVE**

Run: `cd apps/api && pnpm --filter api exec ts-node scripts/publish-plan-kb.ts "RHB"`
Expected: DRAFT → LIVE for the RHB docs.

- [ ] **Step 3: Validate NCD-BM flips GREEN**

Run: `cd apps/api && WHATSAPP_MOCK_MODE=true npx ts-node scripts/grade-bm-eval.ts`
Expected: the **NCD-BM** case now = **PASS** (reply conveys "NCD → 0 / sifar / restart"). If still FAIL, STOP — inspect the retrieved chunks with the ad-hoc retrieval probe (see the spec's diagnosis method) before proceeding; do not widen scope blindly.

- [ ] **Step 4: Re-ingest + publish Zurich**

Run:
```bash
cd apps/api && EMBEDDINGS_MOCK_MODE=false LLM_MOCK_MODE=false CHATBOT_ENRICH_TABLE_ROWS=true pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "Zurich"
pnpm --filter api exec ts-node scripts/publish-plan-kb.ts "Zurich"
```
Expected: Zurich docs re-ingested with prose enrichment and published LIVE.

- [ ] **Step 5: Full regression eval (routing + content)**

Run: `cd apps/api && WHATSAPP_MOCK_MODE=true npx ts-node scripts/grade-bm-eval.ts`
Expected: exit code 0 — all graded cases PASS, and the routing distribution shows no topic that previously answered now regressing to consent_offer. Spot-check the printed replies for the NCD/flood/windscreen cases.

- [ ] **Step 6: Roll out the remaining LIVE docs (after validation)**

For each remaining plan with consequence prose (`Chubb`, `Takaful`, plus the generic seeded explainers), repeat ingest→publish with `CHATBOT_ENRICH_TABLE_ROWS=true`. Run the grader once more; confirm exit 0.

---

## Self-Review

- **Spec coverage:** Component 1 (content eval) → Task 1. Component 2 (`shouldEnrichProse`/`enrichProse`) → Task 2; ingestion wiring → Task 3. Component 3 (staged re-ingest + validation) → Task 4. Red→green: Task 1 Step 4 (red) → Task 4 Step 3 (green). Risk "no regressions" → Task 4 Step 5. All spec sections covered.
- **Placeholder scan:** Task 3 Step 1 references existing-suite helpers (`makeIngestion`/`seedDoc`) with an explicit fallback instruction to follow the file's existing construction pattern and a concrete `ConfigService` stub contract — no blind placeholder. All code steps show full code.
- **Type consistency:** `shouldEnrichProse(text: string): boolean` and `enrichProse(text, docTitle): Promise<string>` are used identically in Tasks 2-3; ingestion reads `c.kind`/`c.tokenCount` from the existing `Chunk` type; the grader's `Entry.expect` matches the `bm-eval.json` shape added in Task 1.
