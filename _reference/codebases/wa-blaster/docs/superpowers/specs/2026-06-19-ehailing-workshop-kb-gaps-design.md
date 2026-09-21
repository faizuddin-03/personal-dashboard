# KB-Content Fixes: E-hailing Recall + Panel-Workshop Count — Design

**Date:** 2026-06-19
**Branch:** work on `feat/ai-chatbot`, then fast-forward `master` (production tracks master); deploy to the Mac Studio.
**Status:** Approved — proceeding to implementation plan

## Problem (proven via live logs + KB trace)

Two KB-covered questions fail on the live bot with `consent_offer` / `reason=escalation_offer_sent:low_conf`,
even with the reranker + confidence-decouple flags ON (both confirmed engaged in the worker log):

1. **E-hailing / Grab** — *"i drive grab part time, my normal car insurance can cover ah?"*
   - Live: `low_conf`, `topChunkScore=0.590`; reranker fetched 20 candidates, judge picked 3 — but the
     answer chunk never made the candidate set. Top-12 retrieved are generic policy boilerplate (0.59–0.61).
   - Root cause: a **retrieval recall gap**. The answer exists only as legalese — RHB
     `rhb-private-car-en.md:547` "Limitations as to Use" ("Social, domestic and pleasure … and for the
     policyholder's business"; "does not cover use for hire or reward"). **No private-car doc contains
     customer-facing "e-hailing / Grab / ride-hailing" wording**, so the colloquial query embeds far from the
     answer and the reranker (which only reorders what dense retrieval *found*) can't surface it.

2. **Panel workshops** — *"how many panel workshops does RHB insurance have?"*
   - Live: `low_conf`, `topChunkScore=0.657`.
   - Root cause: a **content/aggregation gap**. The RHB doc has the full listing — **650 workshop rows
     across 25 state tables** (`rhb-private-car-en.md:1165` "RHB Panel Workshop Listing (as at January
     2019)") — but **no chunk states a count**. RAG can't count across hundreds of chunks from a top-5 view,
     so the drafter correctly won't fabricate a number.

The reranker + confidence flags work and are eval-proven; these two failures are a different class
(recall + missing content) the flags cannot fix. Keep both flags ON.

## Goal

Both questions answer correctly: e-hailing → "not covered under a standard private car policy; needs an
e-hailing extension"; workshop count → "~650 nationwide as at Jan 2019, confirm current with RHB."

## Non-goals

- No code change (no flag flip, no reranker/retrieval-tuning, no query-rewrite extension). Content-only.
- No change to the workshop *listing* itself (kept as-is, including its Jan-2019 staleness banner).

## Approach

**Author explicit, customer-phrased chunks in the KB markdown and re-ingest** — the same workflow the KB
was built with ([[insurance-kb-pdf-extraction]]). Rejected: (a) auto-enrichment (less reliable for this
specific gap, more code); (b) query-rewriting colloquial standalone queries (changes retrieval globally,
riskier, doesn't add the missing clarity/content).

## Components

### 1. E-hailing / Grab FAQ — added to all 4 private-car plans (5 EN files)

A discrete, clearly-headed subsection (own `###` heading → the chunker emits it as one focused chunk) added
to each private-car EN doc. Consistent, insurer-neutral wording grounded in the standard "Limitations as to
Use" clause, rich in the terms a customer uses (e-hailing, Grab, ride-hailing, private car insurance, cover,
hire or reward, add-on/extension):

> `### Using your car for e-hailing (Grab / ride-hailing)`
> *Can I use my private car for e-hailing or ride-hailing such as Grab? A standard private car policy covers
> social, domestic and pleasure use plus the policyholder's business **only**. Carrying passengers for hire
> or reward — including e-hailing/ride-hailing such as Grab — is **not covered** under a standard private
> car policy. To drive for Grab/e-hailing you need an e-hailing add-on/extension (where the insurer offers
> one) or a commercial/e-hailing policy. Confirm availability and terms with your insurer.*

Files (confirmed):
- `apps/api/knowledge/rhb/rhb-private-car-en.md`
- `apps/api/knowledge/zurich/private-car-policy-wording-en.md`
- `apps/api/knowledge/chubb/chubb-en.md`
- `apps/api/knowledge/takaful/takaful-mymotor-private-car-en.md`
- `apps/api/knowledge/takaful/takaful-myclick-private-car-en.md`

### 2. Panel-workshop summary — added to the RHB EN doc

A short, headed summary chunk placed immediately **above** the listing (`rhb-private-car-en.md:1165`), so
"how many / where are the workshops" retrieves a count-bearing chunk instead of individual rows:

> `### RHB Panel Workshops — Summary`
> *How many panel workshops does RHB have, and where? RHB has a nationwide panel of approximately **650
> approved repair workshops** across all states of Malaysia (as at January 2019; see the full listing
> below). The panel changes over time — confirm the current panel workshops, addresses and contact numbers
> with RHB Insurance before sending your car for repair.*

Count derived from the source: 650 workshop table-rows across 25 state/region tables.

### 3. Re-ingestion (the "deploy" for content)

Per-plan, on the Mac Studio (real embeddings — `bge-m3`):
- `EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "<Plan>"` then
  `... scripts/publish-plan-kb.ts "<Plan>"` for each edited plan: **RHB, Zurich, Chubb, Takaful**.
- `ingest-plan-kb.ts` is idempotent/self-replacing per plan (deletes the plan's prior docs, re-chunks +
  re-embeds **every** `*.md` in `knowledge/<plan-slug>/`). Run ingest **immediately followed by** publish per
  plan to minimize the window where that plan's docs are DRAFT (invisible to the bot).
- Source markdown reaches the box the same way as the code: edit in the repo → fast-forward `master` →
  ship to the box via git bundle (the box can't fetch from GitHub).

## Validation

- **Retrieval trace** (the diagnostic script pattern used to find this): after re-ingest, the two queries
  must surface the new FAQ/summary chunks at a high score (expect clearly > the 0.59–0.66 wall), and the
  bot's decision should flip `consent_offer` → `rag_answer`.
- **Graded eval:** add two cases to `apps/api/src/chatbot/sim/bm-eval.json` with `expect.fact`
  (e-hailing: "not covered under a standard private car policy; needs an e-hailing add-on/extension";
  workshops: "RHB has a nationwide panel of ~650 workshops as at January 2019; confirm current with RHB").
  Run `grade-bm-eval.ts` — both must PASS, no regressions.
- **Live re-test:** fire both questions on WhatsApp; confirm correct answers (and the workshop answer states
  ~650 with the staleness caveat, not a hallucinated number).

## Rollout / risk

- Content-only; no code or flag change. The reranker + confidence-decouple flags stay ON.
- Brief per-plan DRAFT window during re-ingest (mitigated by ingest→publish back-to-back). Other plans stay
  LIVE throughout.
- The e-hailing wording is insurer-neutral and regulatory-grounded (the hire-or-reward limitation is
  standard across Malaysian private-car policies), so it's accurate in every doc.
