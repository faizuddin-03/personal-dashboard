# Insurance-plan PDFs → Chatbot Knowledge Base

- **Date:** 2026-06-10
- **Status:** Approved (design)
- **Owner:** desmond@modefair.com
- **Branch:** feat/ai-chatbot

## Problem & Goal

We need to populate the chatbot's RAG knowledge base with the content of insurance-plan
PDFs so the WhatsApp bot can retrieve and answer customer questions about each plan. The
PDFs contain body text, tables, and images; some tables are themselves rendered as images.

**Goal:** For each plan named by the operator, turn its PDF(s) into clean markdown
documents in the existing knowledge base (`apps/api/src/chatbot/knowledge/`), grouped by
plan, reviewed, and published LIVE for retrieval.

This is a **workflow + content** effort, not a new subsystem. The KB infrastructure
already exists (chunk → embed → pgvector → retrieval); we reuse it unchanged.

## Decisions (locked)

| # | Decision | Choice |
|---|----------|--------|
| 1 | Extraction method | **Claude extracts per upload** (multimodal PDF reading). No PDF-parser/OCR library. |
| 2 | Document structure | **One KB document per source PDF**, with strong internal topical headings. `category` = plan name. |
| 3 | Image handling | **Text + tables only.** Rebuild tables (incl. image-tables); skip charts/diagrams/decorative images; flag (don't drop) charts carrying unique critical data. |
| A | Content location | `apps/api/knowledge/<plan-slug>/*.md` (co-located with the ingest script). |
| B | Lifecycle | Documents land as **DRAFT → operator review → publish LIVE**. |
| C | Build timing | Build the ingest script **now**, before the first plan arrives. |

## Why these choices

- **Manual extraction** keeps fidelity high on the exact places library extraction fails
  on insurance PDFs — multi-column benefit tables, tables rendered as images, scanned
  pages — and adds no brittle parsing code to maintain.
- **One doc per PDF** is faithful to the source and auditable. Because the chunker
  prefixes every chunk with its parent heading
  ([chunker.service.ts](../../../apps/api/src/chatbot/knowledge/chunker.service.ts)),
  strong internal `##` headings already give topically-coherent chunks without
  reorganizing content across PDFs.
- **Text + tables only** keeps the KB clean: charts/logos add retrieval noise. The
  flag-don't-drop rule prevents silent loss of information that lives only in a chart.
- **DRAFT → LIVE** gives a human gate before customer-facing answers can cite the content.

## The repeatable workflow (per upload)

The operator provides a **plan name** + one or more **PDFs**.

1. **Extract (Claude).** Read each PDF page-by-page and produce one markdown file per PDF:
   - All body text in reading order.
   - A consistent topical heading skeleton: `# <Plan> — <Doc Title>` (H1), then only the
     `##` sections that apply (e.g. Benefits, Coverage, Exclusions & Limitations,
     Premiums & Eligibility, Claims, Contact).
   - Tables (including tables that are images) rebuilt as GitHub-flavored markdown tables,
     with all numbers transcribed exactly.
   - Charts/diagrams/decorative images skipped. A chart carrying **unique** critical data
     (a figure or rule found nowhere in the text/tables) is **flagged** in the extraction
     report, never silently dropped.
   - A short metadata header at the top: plan name, source filename, effective date if
     shown on the document.
2. **Self-check (Claude).** Re-read the PDF against the produced markdown: no dropped
   sections, table figures match the source, headings cover the content. Produce a short
   extraction report (page count, tables rebuilt, items flagged/skipped).
3. **Store.** Write the markdown to `apps/api/knowledge/<plan-slug>/<doc-slug>.md`. This is
   the version-controlled source of truth and is re-ingestable.
4. **Ingest.** Run `ingest-plan-kb.ts "<Plan Name>"`. For each `.md` in the plan folder it
   creates a `KnowledgeDocument` (status DRAFT) and runs the existing
   `IngestionService.ingest()` (chunk → embed → pgvector).
5. **Review → publish.** Documents are DRAFT and not retrievable by the bot. The operator
   reviews them (Knowledge UI or `GET /chatbot/knowledge/documents/:id`) and publishes LIVE
   via `POST /chatbot/knowledge/documents/:id/publish`.
6. **Verify.** Run a few category-filtered semantic searches
   (`POST /chatbot/knowledge/search`) to confirm representative customer questions retrieve
   the right chunks.

## Conventions

- **`category`** = the plan name exactly as given (e.g. `AIA Premier Health`). This groups
  a plan's documents and can scope retrieval.
- **`title`** = the document's H1 (human-readable; shown in citations).
- **`name`** = `<plan-slug>__<doc-slug>.md` — the unique key (DB unique constraint). The
  `<plan-slug>__` prefix lets a re-run replace exactly that plan's documents without
  touching other plans (mirrors the `kb-` prefix trick in
  [seed-chatbot-kb.ts](../../../apps/api/scripts/seed-chatbot-kb.ts)).
- **Markdown content:** `apps/api/knowledge/<plan-slug>/*.md` (committed).
- **Source PDFs:** `apps/api/knowledge/_sources/<plan-slug>/` — **gitignored**. Kept locally
  for re-extraction and audit; not committed, so binaries don't bloat the repo.
- **`plan-slug`** = lowercase, non-alphanumeric runs collapsed to `-`
  (e.g. `AIA Premier Health` → `aia-premier-health`).

## Components to build

1. **`apps/api/scripts/ingest-plan-kb.ts`** — modeled on `seed-chatbot-kb.ts`:
   - Takes the plan name as a CLI argument; derives the slug; reads every `.md` under
     `apps/api/knowledge/<plan-slug>/`.
   - Idempotent self-replace: deletes existing documents whose `name` starts with
     `<plan-slug>__` (cascades chunks) before recreating the current set.
   - Creates each document with `category` = plan name, `title` = first H1 (fallback:
     filename), `status` = DRAFT, then calls `ingestion.ingest(doc.id)`.
   - Owns documents as the first real user (or the same non-soak sentinel UUID the seeder
     uses) so soak cleanup won't purge them.
   - Logs per-document chunk counts and a final summary; exits non-zero if any file fails.
2. **`.gitignore` entry** for `apps/api/knowledge/_sources/`.
3. **`apps/api/knowledge/README.md`** — concise operational runbook: the per-upload steps,
   the extraction rules, naming conventions, and the exact ingest/publish/verify commands
   (real vs mock embeddings).

## Data flow

```
PDF (uploaded to Claude)
  → [Claude reads visually] → markdown file in apps/api/knowledge/<plan-slug>/
  → [ingest-plan-kb.ts → KnowledgeDocument.create (status DRAFT)]
  → [IngestionService.ingest: ChunkerService → EmbeddingsService → knowledge_chunks (pgvector)]
  → [operator review → POST .../publish → status LIVE]
  → retrievable by chatbot RAG (RetrievalService)
```

## Error & edge handling

- **Empty/garbled extraction:** Claude flags it and does not ingest that file.
- **Table > 1500 tokens:** the chunker keeps it whole and warns. Claude pre-empts this by
  splitting very large tables under sub-headings during extraction.
- **Chart with unique critical data:** flagged in the extraction report for an operator
  decision (consistent with "text + tables only").
- **Duplicate `name`:** the script self-replaces the plan's prior set first, so a re-run of
  the same plan updates rather than conflicts. Across plans, the slug prefix prevents
  collisions.
- **Scanned / low-quality pages:** Claude transcribes what is legible and flags illegible
  regions in the report.
- **Non-UTF-8 / odd glyphs:** normalized to UTF-8 in the produced markdown.

## Verification

- **Per document:** Claude's self-check (re-read vs markdown) plus the extraction report
  with counts.
- **After ingest:** `ingest-plan-kb.ts` logs chunk counts per document; zero chunks for a
  non-empty file is a failure signal.
- **Retrieval proof:** category-filtered `POST /chatbot/knowledge/search` queries for
  representative customer questions return the expected document/chunks. Requires real
  embeddings (Ollama + bge-m3, `EMBEDDINGS_MOCK_MODE=false`); under mock embeddings
  retrieval is only structurally exercised, not semantically meaningful.
- The committed markdown is itself the reviewable artifact.

## Out of scope (YAGNI)

- No automated PDF parser / OCR library pipeline (extraction is manual by choice).
- No image, chart, or diagram descriptions (text + tables only).
- No database schema changes or migrations — reuse `KnowledgeDocument` / `KnowledgeChunk`.
- No new API endpoints — reuse the existing knowledge controller, `IngestionService`, and
  `RetrievalService`.
- No automatic publishing — LIVE is a deliberate operator action.

## Operational notes

- Real retrieval requires the embedding backend up (Ollama + bge-m3) and
  `EMBEDDINGS_MOCK_MODE=false`. Mock mode is fine for plumbing/structure checks only.
- Ingest is run from the `apps/api` workspace, e.g.
  `EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "AIA Premier Health"`.
