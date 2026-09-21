# Meta Template Sync — Pull All Templates From Meta Into the App

**Date:** 2026-06-19
**Branch:** `feat/meta-template-sync`
**Status:** Approved design — ready for implementation plan

## Goal

Make the Templates module able to **pull every message template that exists on the
WhatsApp Business Account (WABA) into this app**, not just reconcile the ones the
app itself submitted. Two concrete outcomes:

1. **Import** templates that live on Meta but have no local row yet (e.g. created
   directly in Meta Business Manager, or by another tool/team), fully and usably —
   body/header/footer/buttons included — so they appear in the list and can be used
   for blasts.
2. **Reflect category reclassification.** Meta frequently changes a submitted
   template's category (UTILITY ↔ MARKETING). The sync must overwrite the local
   `category` (and status, and content) for templates that already have a local row.

## Context

- A "logical template" is a set of `templates` rows sharing `(name, version)`, one
  per language. DB enforces `@@unique([name, version, language])`
  (`apps/api/prisma/schema.prisma:241`). Meta keys templates by `(name, language)` —
  one template per pair — and assigns each its own template id and status.
- Today's reconciliation is **one-directional and pending-only**:
  `TemplatesService.syncPending(staleOnly)` (`apps/api/src/templates/templates.service.ts:248`)
  queries **local** rows with `status = PENDING` and a `metaTemplateId`, then calls
  `WhatsappCloudApiService.getTemplateStatus(metaTemplateId)` for each. It updates
  **only `status` and `approvedAt`** — never `category`, never content, and it can
  never discover a template the app didn't submit.
- It is invoked two ways: `POST /templates/sync` → `syncPending(false)` (manual "Sync"
  button) and an hourly cron `TemplatesPoller.pollPending` → `syncPending(true)`
  (`apps/api/src/templates/templates.poller.ts`).
- `applyMetaTemplateUpdate` (webhook handler, `templates.service.ts:272`) also updates
  only status/`rejectionReason`/`approvedAt`, not category — out of scope here but noted.
- `WhatsappCloudApiService` (`apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`)
  centralizes all Meta access, gated by `WHATSAPP_MOCK_MODE` (default `true`). It
  exposes `submitTemplate` and `getTemplateStatus` but **no list endpoint** yet. It
  holds `mockMode`, `apiVersion` (`WHATSAPP_API_VERSION`, default `v20.0`), an axios
  `http` client (base `https://graph.facebook.com`), `authHeader()`, and
  `transformError()`. The WABA id comes from `config.getOrThrow('WHATSAPP_WABA_ID')`.
- `created_by` is a required FK on `templates`. The manual Sync button runs as an
  authenticated admin, so imported rows are attributed to that user (no system user
  needed).

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Meta-only templates (no local row) | **Import fully & usably** — pull content + metadata, create rows |
| Existing local rows that differ from Meta | **Overwrite status + category + content** from Meta (Meta authoritative for submitted templates) |
| Local DRAFTs never submitted | **Left untouched** (no Meta counterpart to match) |
| Trigger | **Manual button only** (repoint existing `POST /templates/sync`); hourly cron stays pending-only |
| Status filter | **Import all statuses** (APPROVED, PENDING, REJECTED, PAUSED, DISABLED, …) |
| Approach | Extend `WhatsappCloudApiService` + `TemplatesService`; no new service/endpoint |
| Ownership of imported rows | The admin who triggered the manual sync (`req.user.id`) |

## Architecture

Two additions, one rewire, no new module:

1. `WhatsappCloudApiService.listMessageTemplates()` — new paginated read of the WABA's
   templates (+ a mock fixture).
2. `TemplatesService.syncFromMeta(actorUserId)` — list → map → match → upsert; returns
   a summary. Pure mapping/matching helpers live alongside it and are unit-tested in
   isolation.
3. `POST /templates/sync` is repointed from `syncPending(false)` to `syncFromMeta(userId)`.
   `syncPending` and the hourly cron are **unchanged** (cheap automatic status updates
   for app-submitted PENDING rows, complementing the heavier manual full sync).

### 1. Meta list API — `listMessageTemplates()`

```ts
interface MetaTemplateListItem {
  id: string;
  name: string;
  language: string;        // Meta locale, e.g. "en", "ms", "zh_CN"
  status: string;          // APPROVED | PENDING | REJECTED | PAUSED | DISABLED | ...
  category: string;        // MARKETING | UTILITY | AUTHENTICATION
  components: MetaComponent[];
}

async listMessageTemplates(): Promise<MetaTemplateListItem[]>
```

- **Live:** `GET /{apiVersion}/{WHATSAPP_WABA_ID}/message_templates` with
  `fields=id,name,language,status,category,components` and `limit=100`, following
  `paging.next` (cursor `paging.cursors.after`) until exhausted. Aggregate `data[]`
  across pages into one array. Errors flow through `transformError()`.
  A safety cap (e.g. 50 pages) prevents an unbounded loop on a misbehaving cursor.
- **Mock (`WHATSAPP_MOCK_MODE=true`):** return a small canned fixture (3–4 items)
  exercising the interesting paths: an APPROVED template, one whose `category` differs
  from what a seeded local row would have (proves category-drift), a non-English
  (`ms`/`zh_CN`) variant, and a REJECTED/PAUSED item (proves status mapping). This
  keeps the whole feature working offline, like the rest of the service.

### 2. Mapping Meta → local

Pure functions (no I/O), unit-tested directly:

- **`fromMetaLocale(locale): LanguagePreference`** — reverse of the existing
  `toMetaLocale`: `en→EN`, `ms→MS`, `zh_CN`/`zh→ZH`, `ta→TA`; anything else → `OTHER`.
  (Asymmetry note: `toMetaLocale` maps both `EN` and `OTHER` to `en`, so `en→EN` on
  the way back is the chosen, lossy-but-correct default.)
- **`fromMetaStatus(status): TemplateStatus | null`**:
  `APPROVED→APPROVED`; `PENDING`/`IN_APPEAL`→`PENDING`;
  `REJECTED→REJECTED`; `PAUSED`/`DISABLED`/`FLAGGED`/`LIMIT_EXCEEDED`/`PENDING_DELETION`→`DISABLED`.
  Unknown → `null` ⇒ that item is **skipped** (counted + logged), never written with a
  bogus status.
- **`fromMetaCategory(category): TemplateCategory`** — direct passthrough of
  `MARKETING`/`UTILITY`/`AUTHENTICATION`; unknown defaults to `UTILITY` (matches the
  existing `coerceCategory` fallback in `ollama-llm.service.ts`).
- **`parseMetaComponents(components)`** → `{ bodyText, headerJson, footerText, buttonsJson, variables }`:
  - `BODY` → `bodyText`; its `example.body_text[0]` (if present) → `variables`.
  - `HEADER` with `format: TEXT` → `headerJson = { type: 'TEXT', text }`. Non-text
    headers (IMAGE/VIDEO/DOCUMENT) are dropped to `null` (the local model only models
    TEXT headers) and noted in the import log.
  - `FOOTER` → `footerText`.
  - `BUTTONS` → `buttonsJson` mapped to the local `{ type, text, url, phoneNumber }`
    shape (Meta uses `phone_number`).
  - **Variables caveat (documented):** Meta stores only *positional example values*,
    not variable *names*. So imported `variables` are the example strings when Meta
    provides them, otherwise an array sized to the number of distinct `{{n}}`
    placeholders in the body (filled with `''`). Locally authored variable *names*
    cannot be recovered from Meta — this is expected, not a bug.

### 3. Matching & upsert (the crux)

For each mapped Meta item, in order:

1. **By `metaTemplateId`** — find the local row whose `metaTemplateId === item.id`.
   This covers every template the app submitted. → **update** it.
2. **By `(name, language)` fallback** — among rows for that `(name, language)` at the
   **highest version**, match a row that was already submitted (`metaTemplateId != null`
   **or** `status != DRAFT`). → **update** it and backfill `metaTemplateId = item.id`.
   This catches a row whose `metaTemplateId` was somehow lost.
   **Draft protection:** a pristine never-submitted DRAFT (`metaTemplateId == null`
   **and** `status == DRAFT`) is **not** matched here — it represents a newer
   unsubmitted edit and is left untouched.
3. **Insert** — no match ⇒ create a new row.

**Update** writes `status`, `category`, `bodyText`, `headerJson`, `footerText`,
`buttonsJson`, `variables`, `metaTemplateId`, and sets `approvedAt = now()` when the
new status is APPROVED and it wasn't before. A row is flagged `categoryChanged` when
its stored `category` differs from the incoming one.

**Insert** — version is decided **per name** so all of a Meta name's languages land in
one local family: `version = max(existing local version for that name)` if the name
exists locally, else `1`. `status`/`category`/content from the mapping; `createdById =
actorUserId`; `metaTemplateId = item.id`; `submittedAt = now()` for non-DRAFT statuses;
`approvedAt = now()` when APPROVED.

Implementation note: load all local rows once up front (or the relevant subset) and
build in-memory indexes by `metaTemplateId` and by `name` → keyed by the items'
distinct names, to avoid an N+1 query storm. Writes run inside a `$transaction`.

### 4. Category drift

No dedicated code path — it falls out of §2–§3: every matched row has `category`
overwritten from Meta, so a UTILITY→MARKETING (or reverse) reclassification is
reflected on the next manual sync. The summary surfaces how many rows changed category.

### 5. Trigger & wiring

- `TemplatesController` `POST /templates/sync` → `templates.syncFromMeta(req.user.id)`
  (replaces `syncPending(false)`). Still `JwtAuthGuard`-protected.
- `syncPending` stays for the **hourly cron** (`TemplatesPoller`, unchanged). It also
  remains available internally; only the manual endpoint is repointed.
- Webhook `applyMetaTemplateUpdate` unchanged (out of scope).

### 6. Result shape & frontend

```ts
interface SyncFromMetaResult {
  checked: number;          // items returned by Meta
  imported: number;         // new rows created
  updated: number;          // existing rows updated
  categoryChanged: number;  // subset of updated whose category flipped
  skipped: number;          // unknown status / unmappable
}
```

- `apps/web/src/api/templates.ts`: `syncTemplates()` return type updated to
  `SyncFromMetaResult`.
- `apps/web/src/pages/Templates.tsx`: the existing Sync button's success toast reports
  the summary, e.g. *"Synced 14 from Meta — 3 imported, 5 updated, 2 category changes."*
  Then it invalidates the `['templates']` query so the list refreshes. No new UI surface.

### 7. Testing

- **Mapping unit tests:** `fromMetaLocale`, `fromMetaStatus` (incl. unknown→null),
  `fromMetaCategory`, `parseMetaComponents` (body+example→variables, text vs non-text
  header, footer, buttons `phone_number`→`phoneNumber`, placeholder-count fallback).
- **Matching/upsert tests** (`templates.service.spec.ts`, Prisma stubbed per repo
  convention): match-by-id update; name+language fallback with `metaTemplateId`
  backfill; **draft protection** (pristine DRAFT untouched); insert with per-name
  version grouping; category-drift counted; unknown-status skipped; `approvedAt` set on
  APPROVED transition.
- **`listMessageTemplates` tests** (`whatsapp-cloud-api.service.spec.ts`, `nock`):
  mock-mode fixture shape; live pagination following `paging.next`; page cap honored.
- **Controller test:** `POST /templates/sync` passes `req.user.id` through to
  `syncFromMeta`.

## Edge cases

- **Non-text headers / unsupported component types** — dropped (header→`null`), logged,
  body still imported. The row remains usable.
- **Unknown Meta status** — item skipped and counted in `skipped`; never written.
- **Locale not in our enum** — mapped to `OTHER`.
- **Name collision with a local in-progress DRAFT version** — draft protection (§3.2)
  leaves the unsubmitted DRAFT alone; the Meta reality updates the previously-submitted
  row it actually corresponds to.
- **Pagination loop / bad cursor** — hard page cap stops it; partial results are still
  returned/applied with a warning.
- **Mock mode** — fully functional via the canned fixture; no Meta credentials needed.

## Non-goals

- Two-way sync / pushing local edits to Meta (submission already exists via `submitGroup`).
- Recovering local variable *names* from Meta (not stored there).
- Changing the webhook handler or the hourly pending poll.
- Deleting local rows for templates that no longer exist on Meta (sync is additive +
  update only; deletion stays a manual, explicit action).

## Files to change

- `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts` — `MetaTemplateListItem`,
  `listMessageTemplates()`, mock fixture.
- `apps/api/src/templates/templates.service.ts` — mapping helpers, `syncFromMeta()`,
  `SyncFromMetaResult`.
- `apps/api/src/templates/templates.controller.ts` — repoint `POST /templates/sync`.
- `apps/web/src/api/templates.ts` — `syncTemplates()` return type.
- `apps/web/src/pages/Templates.tsx` — summary toast.
- Tests: `whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts`,
  `templates/__tests__/templates.service.spec.ts`,
  `templates/__tests__/templates.controller.spec.ts`.

## Open questions

None — all resolved in brainstorming.
