# Chatbot knowledge base — per-plan source content

Markdown source-of-truth for the chatbot RAG knowledge base, one folder per insurance
plan. Each `*.md` here becomes one `KnowledgeDocument` (chunked → embedded → pgvector)
via [`scripts/ingest-plan-kb.ts`](../scripts/ingest-plan-kb.ts).

Design / rationale: [`docs/superpowers/specs/2026-06-10-insurance-pdf-knowledge-base-design.md`](../../../docs/superpowers/specs/2026-06-10-insurance-pdf-knowledge-base-design.md).

## Layout

```
apps/api/knowledge/
  <plan-slug>/            # committed markdown — one file per source PDF
    <doc>.md
  _sources/<plan-slug>/   # original PDFs — gitignored, kept locally for re-extraction
```

`plan-slug` = lowercase, non-alphanumeric runs → `-` (e.g. `Zurich` → `zurich`,
`AIA Premier Health` → `aia-premier-health`).

## Conventions

- **`category`** (in the DB) = the plan name exactly as passed to the script (e.g. `Zurich`).
- **`title`** = the document's first H1.
- **`name`** = `<plan-slug>__<filename>.md` — unique key. The `<plan-slug>__` prefix lets a
  re-run replace exactly that plan's documents (idempotent self-replace).

## Workflow (per plan)

1. **Extract.** Claude reads the plan's PDF(s) and writes one markdown file per PDF here,
   with strong topical headings. Body text + tables only (tables rebuilt as markdown
   tables); charts/decorative images are skipped — anything important trapped in a chart is
   flagged, not dropped.
2. **Import** the plan's documents as DRAFT. Importing and embedding are decoupled, so you
   can import every plan first and embed them all once at the end:
   ```bash
   # Import only — create DRAFT rows, defer embedding (no backend needed, writes no chunks):
   pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "Zurich" --no-embed
   ```
3. **Embed** — once, with a real backend up (Ollama + bge-m3, or OpenAI; the model here must
   match the one the chatbot uses at query time):
   ```bash
   # Embed EVERY DRAFT document in one pass:
   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-seeded-docs.ts

   # …or import + embed a single plan in one step (omit --no-embed):
   EMBEDDINGS_MOCK_MODE=false pnpm --filter api exec ts-node scripts/ingest-plan-kb.ts "Zurich"
   ```
4. **Review → publish.** Documents stay **DRAFT** (not retrievable by the bot) until you
   publish each LIVE: `POST /chatbot/knowledge/documents/:id/publish` (admin) — or via the
   Knowledge UI. Do not publish before the real embed pass.
5. **Verify retrieval** (real embeddings only): `POST /chatbot/knowledge/search` with a
   representative question and `category` set to the plan name; confirm the right chunks
   come back.

## Notes

- Genuine retrieval requires the embedding backend up: Ollama + `bge-m3`,
  `EMBEDDINGS_MOCK_MODE=false`. Under mock embeddings the vectors are not semantically
  meaningful — re-ingest with real embeddings before publishing LIVE.
- Re-running the script for a plan deletes that plan's previous documents (and their
  chunks) before re-creating the current set, so the folder is always the source of truth.
