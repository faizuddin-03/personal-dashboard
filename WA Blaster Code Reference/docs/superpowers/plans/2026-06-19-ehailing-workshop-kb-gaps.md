# E-hailing Recall + Panel-Workshop Count KB Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the bot correctly answer "can I use my car for Grab/e-hailing?" and "how many RHB panel workshops are there?" by adding two customer-phrased KB chunks and re-ingesting.

**Architecture:** Content-only fix — author explicit, heading-scoped markdown sections (one chunk each) in the KB source, then re-ingest + publish per plan so the chatbot's pgvector KB gains strongly-matching chunks. No code/flag change; the reranker + confidence-decouple flags stay ON.

**Tech Stack:** Markdown KB docs under `apps/api/knowledge/`, `scripts/ingest-plan-kb.ts` + `scripts/publish-plan-kb.ts` (chunk → bge-m3 embed → pgvector), `scripts/grade-bm-eval.ts` for validation.

**Spec:** `docs/superpowers/specs/2026-06-19-ehailing-workshop-kb-gaps-design.md`

**Deploy reality:** Production = Mac Studio (`ollama-gpu`, team05) running `master`. Local `feat/ai-chatbot` work must fast-forward `master`; the box can't fetch GitHub, so ship via git bundle. Re-ingest runs ON the box (real `bge-m3`).

---

## File Structure

- **Modify** `apps/api/knowledge/rhb/rhb-private-car-en.md` — add e-hailing FAQ **and** workshop summary (both as new `##` sections, immediately before the `## RHB Panel Workshop Listing` header).
- **Modify** `apps/api/knowledge/zurich/private-car-policy-wording-en.md` — append e-hailing FAQ.
- **Modify** `apps/api/knowledge/chubb/chubb-en.md` — append e-hailing FAQ.
- **Modify** `apps/api/knowledge/takaful/takaful-mymotor-private-car-en.md` — append e-hailing FAQ.
- **Modify** `apps/api/knowledge/takaful/takaful-myclick-private-car-en.md` — append e-hailing FAQ.
- **Modify** `apps/api/src/chatbot/sim/bm-eval.json` — add 2 graded cases.

The **e-hailing FAQ block** (identical, insurer-neutral) — call this `EHAILING_BLOCK`:

```markdown
## Using your car for e-hailing (Grab / ride-hailing)

**Can I use my private car for e-hailing or ride-hailing such as Grab?** A standard private car policy covers **social, domestic and pleasure** use plus **the policyholder's business** only. Carrying passengers for **hire or reward** — including e-hailing / ride-hailing such as **Grab** — is **not covered** under a standard private car policy. To drive for Grab or other e-hailing platforms you need an **e-hailing add-on / extension** (where the insurer offers one) or a separate **commercial / e-hailing policy**. Confirm availability and exact terms with your insurer before driving for hire or reward.
```

The **workshop summary block** (RHB only) — `WORKSHOP_BLOCK`:

```markdown
## RHB Panel Workshops — Summary

**How many panel workshops does RHB have, and where?** RHB has a nationwide panel of **approximately 650 approved repair workshops** across all states of Malaysia (as at January 2019; the full state-by-state listing is below). The panel changes over time — please confirm the current panel workshops, addresses and contact numbers with RHB Insurance before sending your car for repair.
```

---

### Task 1: Add the KB content (5 docs)

**Files:** the 5 markdown docs above.

- [ ] **Step 1: RHB — insert both blocks before the listing**

In `apps/api/knowledge/rhb/rhb-private-car-en.md`, find the unique line:

```
## RHB Panel Workshop Listing (as at January 2019)
```

Replace it with `EHAILING_BLOCK` + `WORKSHOP_BLOCK` + that same line, i.e. prepend the two new sections (separated by blank lines) immediately above the listing header. (Both new sections + the original header line, in that order.)

- [ ] **Step 2: Append the e-hailing FAQ to the other 4 docs**

Append `EHAILING_BLOCK` (preceded by a blank line) as the final section of each of:
- `apps/api/knowledge/zurich/private-car-policy-wording-en.md`
- `apps/api/knowledge/chubb/chubb-en.md`
- `apps/api/knowledge/takaful/takaful-mymotor-private-car-en.md`
- `apps/api/knowledge/takaful/takaful-myclick-private-car-en.md`

(EOF append is fine — chunks are heading-scoped, so position doesn't affect retrieval.)

- [ ] **Step 3: Verify the markdown (headings present, files parse)**

Run:
```bash
cd /Users/modefair/whatsapp-blasting/apps/api
grep -c "## Using your car for e-hailing" knowledge/rhb/rhb-private-car-en.md knowledge/zurich/private-car-policy-wording-en.md knowledge/chubb/chubb-en.md knowledge/takaful/takaful-mymotor-private-car-en.md knowledge/takaful/takaful-myclick-private-car-en.md
grep -c "## RHB Panel Workshops — Summary" knowledge/rhb/rhb-private-car-en.md
```
Expected: each of the 5 files reports `1` for the e-hailing heading; RHB reports `1` for the workshop summary.

- [ ] **Step 4: Commit**

```bash
cd /Users/modefair/whatsapp-blasting
git add apps/api/knowledge/rhb/rhb-private-car-en.md apps/api/knowledge/zurich/private-car-policy-wording-en.md apps/api/knowledge/chubb/chubb-en.md apps/api/knowledge/takaful/takaful-mymotor-private-car-en.md apps/api/knowledge/takaful/takaful-myclick-private-car-en.md
git commit -m "feat(chatbot-kb): add e-hailing/Grab FAQ (4 plans) + RHB panel-workshop count summary

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Add graded eval cases

**Files:** `apps/api/src/chatbot/sim/bm-eval.json`

- [ ] **Step 1: Add two entries**

Append these two objects to the JSON array in `apps/api/src/chatbot/sim/bm-eval.json` (before the closing `]`, with a comma after the current last entry):

```json
  { "phone": "60139111", "label": "T11 e-hailing (Manglish) | KB:added", "message": "i drive grab part time, my normal car insurance can cover ah?", "expect": { "fact": "A standard private car policy does not cover using the car for e-hailing/ride-hailing such as Grab (carriage of passengers for hire or reward); an e-hailing add-on/extension or commercial policy is needed." } },
  { "phone": "60139112", "label": "T12 panel workshops count | KB:added", "message": "how many panel workshops does RHB insurance have?", "expect": { "fact": "RHB has a nationwide panel of approximately 650 approved workshops across Malaysia (as at January 2019); confirm the current panel with RHB." } }
```

- [ ] **Step 2: Validate JSON parses**

Run: `cd /Users/modefair/whatsapp-blasting/apps/api && node -e "JSON.parse(require('fs').readFileSync('src/chatbot/sim/bm-eval.json','utf8')); console.log('ok')"`
Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/chatbot/sim/bm-eval.json
git commit -m "test(chatbot): graded eval cases for e-hailing + panel-workshop count

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Validate locally (re-ingest RHB + grade) before prod

**Files:** none (local DB + GPU-box Ollama via the tunnel). Requires `curl -s localhost:11434/api/tags` to list `bge-m3`.

RHB carries **both** new chunks, and the eval's e-hailing query matches RHB's FAQ chunk, so re-ingesting only RHB locally validates both cases.

- [ ] **Step 1: Confirm Ollama reachable**

Run: `curl -s --max-time 8 localhost:11434/api/tags | grep -o bge-m3`
Expected: `bge-m3`. If empty, bring up the tunnel before continuing.

- [ ] **Step 2: Re-ingest + publish RHB locally (real embeddings)**

Run:
```bash
cd /Users/modefair/whatsapp-blasting/apps/api
EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "RHB"
pnpm --filter api exec ts-node scripts/publish-plan-kb.ts "RHB"
```
Expected: ingest re-embeds the RHB docs (DRAFT), publish flips them LIVE; no errors.

- [ ] **Step 3: Grade — both new cases must PASS**

Run: `cd /Users/modefair/whatsapp-blasting/apps/api && WHATSAPP_MOCK_MODE=true CHATBOT_RERANK_ENABLED=true CHATBOT_CONFIDENCE_DECOUPLE_LANG=true npx ts-node scripts/grade-bm-eval.ts`
Expected: `T11 e-hailing` and `T12 panel workshops count` both `[PASS]`; no regressions on the other graded cases; runner exits 0. If T11/T12 still FAIL, stop — inspect the retrieved chunks (the diagnostic trace pattern) before deploying.

---

### Task 4: Deploy to the box + verify live

**Files:** none (git bundle + SSH to `ollama-gpu`). Re-ingest runs on the box.

- [ ] **Step 1: Fast-forward master + bundle**

```bash
cd /Users/modefair/whatsapp-blasting
git push origin feat/ai-chatbot:master                      # FF master to the new commits
git bundle create /tmp/kbfix.bundle feat/ai-chatbot --not f721e90
scp /tmp/kbfix.bundle ollama-gpu:/tmp/kbfix.bundle
```
Expected: master fast-forwards; bundle scp'd.

- [ ] **Step 2: Apply on the box (FF, clean tree expected)**

```bash
ssh ollama-gpu 'cd ~/whatsapp-blasting && git fetch /tmp/kbfix.bundle feat/ai-chatbot && git merge --ff-only FETCH_HEAD && git log --oneline -1 && git status --porcelain | wc -l'
```
Expected: HEAD advances to the new top commit; `0` modified (clean). If the tree is dirty, stop and `git stash -u` first (back up).

- [ ] **Step 3: Re-ingest + publish all 4 plans on the box (real embeddings)**

Run ingest→publish back-to-back per plan (minimizes the DRAFT window). On the box:
```bash
ssh ollama-gpu 'cd ~/whatsapp-blasting/apps/api && . ~/.nvm/nvm.sh && for P in RHB Zurich Chubb Takaful; do echo "=== $P ==="; EMBEDDINGS_MOCK_MODE=false corepack pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "$P" && corepack pnpm --filter api exec ts-node scripts/publish-plan-kb.ts "$P"; done'
```
Expected: each plan ingests (DRAFT, embedded) then publishes LIVE, no errors. (No API/worker restart needed — retrieval reads the DB live.)

- [ ] **Step 4: Box retrieval trace — confirm the new chunks surface**

Use the diagnostic trace (the script pattern from this session): for the two queries, the e-hailing FAQ chunk and the RHB workshop-summary chunk must now appear at the **top** with a clearly higher score than the prior 0.59–0.66 wall. (Recreate the temp trace script on the box, run with `WHATSAPP_MOCK_MODE=true`, then delete it.)
Expected: query 1 top chunk = the e-hailing FAQ; query 2 top chunk = the RHB workshop summary.

- [ ] **Step 5: Live re-test**

Fire both questions on WhatsApp. Expected: e-hailing → "not covered under a standard private car policy; needs an e-hailing add-on/extension"; workshops → "~650 nationwide as at Jan 2019, confirm current with RHB" (a real number, not hallucinated). Pull the worker log to confirm `subKind=rag_answer` for both.

- [ ] **Step 6: Update memory**

Record in a memory file (and `MEMORY.md` index): the e-hailing recall gap + workshop-count gap were KB-content gaps (not retrieval/flag bugs); fixed by adding customer-phrased FAQ chunks (e-hailing → 4 plans; RHB workshop count ~650) + re-ingest; the reranker/confidence flags are now ON in prod. Note the deploy mechanism (FF master + git bundle, box can't fetch GitHub).

---

## Self-Review

**Spec coverage:**
- E-hailing FAQ → 5 private-car EN files (Task 1 Steps 1–2). ✓
- Workshop summary → RHB EN doc, ~650 + caveat (Task 1 Step 1). ✓
- Re-ingest per plan (RHB/Zurich/Chubb/Takaful), ingest→publish, on the box (Task 4 Step 3). ✓
- Validation: local grade (Task 3), box retrieval trace + live re-test (Task 4 Steps 4–5), 2 graded cases (Task 2). ✓
- No code/flag change; flags stay ON (architecture note; Task 3/4 run with both flags true). ✓
- Deploy via FF master + bundle (Task 4 Steps 1–2). ✓

**Placeholder scan:** Exact file paths, exact markdown blocks, exact commands + expected output throughout. The only deferred detail is the Task 4 Step 4 trace script body — it reuses the established `_tmp-retrieval-trace.ts` pattern (RetrievalService.retrieve top-20 with minScore 0); acceptable as it's a throwaway diagnostic, not shipped code.

**Consistency:** Plan names (RHB/Zurich/Chubb/Takaful) map to slugs (rhb/zurich/chubb/takaful) → `knowledge/<slug>/`, matching `ingest-plan-kb.ts` slugify. The `EHAILING_BLOCK`/`WORKSHOP_BLOCK` headings (`## Using your car for e-hailing`, `## RHB Panel Workshops — Summary`) match the grep checks in Task 1 Step 3 and the eval `expect.fact` wording in Task 2.
