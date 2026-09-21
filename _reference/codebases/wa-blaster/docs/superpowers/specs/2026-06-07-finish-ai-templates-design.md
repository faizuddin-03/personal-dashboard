# Finish AI Templates — Multi-draft + Per-language Variables + Real Sync — Design Spec

**Date:** 2026-06-07
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft (autonomous slice — scope decided per the user's standing "continue without asking" delegation)
**Context:** Hackathon. eAuto dealer + AI console (`apps/web` + `apps/api`). Slice F of the remaining-work roadmap (after #16–19).

---

## 1. Purpose

The AI template-generation flow is wired end-to-end, but three "finish" gaps remain (per the 2026-06-07 audit):

1. **Single draft per language** — `MockLlmService.generateTemplateDrafts` returns exactly **one** draft per language, so the wizard's step-2 "pick a draft" selection (which already loops `draftsForLang`) has nothing to choose among.
2. **Global variables** — `variables` is a single array applied to every language variant; the schema stores `variables` per-row, but the create path collapses to one shared list (`CreateTemplateDto.variables` → `createDraft` writes it to every variant).
3. **Toast-only "Sync with Meta"** — the header button (`Templates.tsx:596`) only fires a toast; there is no endpoint, even though the hourly poller already has the reconcile logic.

LLM stays **mock** (the user's standing decision); this slice makes the mock produce multiple drafts, not a real provider.

### Decisions (autonomous)

- **Multi-draft:** mock returns **2 distinct drafts per language** (varied body + variables + approval-likelihood) so the selection UI is meaningful. Contract (`TemplateDraft[]`) unchanged; just more entries.
- **Per-language variables:** move `variables` from the top-level `CreateTemplateDto` onto each `TemplateLanguageVariantDto`; `createDraft` writes `variant.variables`. Update the wizard payload (send each draft's own `variables`) and `TemplateForm` (a variables input per language tab) and the `CreateTemplateInput` web type.
- **Real Sync:** extract the poller's reconcile loop into `TemplatesService.syncPending(staleOnly)`; the cron calls it `staleOnly:true`, a new `POST /templates/sync` calls it `staleOnly:false` and returns `{ checked, updated }`; wire the button. **In `WHATSAPP_MOCK_MODE` (dev default), `getTemplateStatus` always returns PENDING**, so sync legitimately reports `updated: 0` — the value is the real on-demand call + honest counts, not faked status changes.

---

## 2. Scope

### In scope
1. `MockLlmService.generateTemplateDrafts` → 2 drafts/language.
2. Per-language `variables`: DTO (`template-component.dto.ts` + `create-template.dto.ts`), `createDraft`, web `CreateTemplateInput`/`TemplateVariant`, the wizard payload, `TemplateForm` variables input.
3. `TemplatesService.syncPending(staleOnly)` + poller refactor + `POST /templates/sync` + web `syncTemplates()` + wire the `Templates.tsx` button.
4. Tests: API unit (mocked prisma/whatsapp/llm) for `syncPending`, `createDraft` per-variant variables, and the multi-draft mock; web build; a Playwright assertion that Sync triggers a real call (run deferred).

### Out of scope (deferred)
- A real LLM provider.
- Editing an existing template's content (the form is read-only on edit; a new-version flow is separate).
- "View Meta details" on rejected templates (toast stub) — separate.
- Real Meta transport (stays `WHATSAPP_MOCK_MODE`).

---

## 3. Architecture

### 3.1 Multi-draft (mock only)
`apps/api/src/llm/mock-llm.service.ts` — `generateTemplateDrafts` returns 2 drafts per language with distinct content, e.g. a concise "A" variant and a warmer "B" variant, different `variables` and `approvalLikelihood`. The wizard already renders all drafts for the active language (`draftsForLang`), so no frontend change is needed for multi-draft. Update `mock-llm.service.spec.ts` accordingly.

### 3.2 Per-language variables
- **`template-component.dto.ts`** — add to `TemplateLanguageVariantDto`:
  ```ts
  @IsArray() @IsString({ each: true })
  variables!: string[];
  ```
- **`create-template.dto.ts`** — remove the top-level `variables` field.
- **`templates.service.ts` `createDraft`** — write `variables: variant.variables` (was `dto.variables`). `submitGroup` already uses `draft.variables` (per-row), so it's unaffected.
- **web `api/templates.ts`** — add `variables: string[]` to `TemplateVariant`; remove `variables` from `CreateTemplateInput`.
- **`TemplatesAIWizard.tsx`** — when building the create payload, set each variant's `variables` from that draft's own `variables` (the `DraftSuggestion.variables` already exist per draft); drop the unioned `allVars`/top-level `variables`.
- **`TemplateForm.tsx`** — replace the single shared variables input with a per-language-tab variables input (each variant carries its own `variables`).

### 3.3 Real Sync with Meta
- **`templates.service.ts`** — new method:
  ```ts
  async syncPending(staleOnly: boolean): Promise<{ checked: number; updated: number }> { … }
  ```
  Query `PENDING` templates with `metaTemplateId != null` (and `submittedAt < now-1h` when `staleOnly`); for each, `whatsapp.getTemplateStatus`, map APPROVED/REJECTED/DISABLED → update (set `approvedAt`/`rejectionReason` like the webhook), skip PENDING/unknown; return counts. (Reuses `WhatsappCloudApiService` already injected into `TemplatesService`.)
- **`templates.poller.ts`** — refactor `pollPending` to call `this.templates.syncPending(true)` (inject `TemplatesService`; both already in `TemplatesModule` — one-way dep, no cycle). The reconcile logic now lives in one place.
- **`templates.controller.ts`** — `@Post('sync') sync() { return this.templates.syncPending(false); }`.
- **web `api/templates.ts`** — `syncTemplates(): Promise<{ checked: number; updated: number }>` → `POST /templates/sync`.
- **`Templates.tsx`** — replace the toast-only `onClick` with a `useMutation` calling `syncTemplates`; on success show a count toast ("Checked N, updated M" / "No pending templates to sync") and invalidate the templates list query; show a pending state on the button.

---

## 4. Data flow
- Generate: wizard → `POST /templates/generate` → mock returns 2 drafts/language → step-2 shows multiple cards per language.
- Create: wizard/form → `POST /templates` with per-variant `variables` → `createDraft` stores them per row.
- Sync: button → `POST /templates/sync` → `syncPending(false)` reconciles all PENDING via Meta status → returns counts → toast + list refresh.

## 5. Error / empty / loading
- All routes JWT-guarded. `sync` with no PENDING → `{ checked: 0, updated: 0 }` → "No pending templates to sync." A per-template Meta error is caught/logged (as the poller already does) and skipped — sync never throws on one bad row.
- Wizard/form: per-language variables default to `[]`; a variant with `{{N}}` placeholders but no friendly names still submits (Meta example falls back to `sampleN`, per existing `buildMetaComponents`).

## 6. Testing strategy
- **API unit** (mocked prisma + whatsapp + llm, mirroring existing `templates/__tests__`):
  - `syncPending`: builds the right `where` (staleOnly toggles the `submittedAt` filter); maps APPROVED/REJECTED/DISABLED; skips PENDING; returns `{checked, updated}`; one failing row doesn't abort the rest.
  - `createDraft`: writes each variant's own `variables` (two variants with different variable lists → two rows with the respective arrays).
  - `mock-llm.service.spec`: `generateTemplateDrafts` returns 2 drafts per requested language.
- **Web:** `pnpm --filter web build`.
- **E2E** (`e2e/tests/templates-sync.spec.ts`, deferred): the Templates header "Sync with Meta" button triggers a request and shows a result toast (not the old static one).

## 7. File-by-file change list
**API (edit):** `llm/mock-llm.service.ts`, `llm/__tests__/mock-llm.service.spec.ts`, `templates/dto/template-component.dto.ts`, `templates/dto/create-template.dto.ts`, `templates/templates.service.ts`, `templates/templates.poller.ts`, `templates/templates.controller.ts`, `templates/__tests__/templates.service.spec.ts`.
**Web (edit):** `api/templates.ts`, `pages/TemplatesAIWizard.tsx` (it's `components/TemplatesAIWizard.tsx`), `pages/TemplateForm.tsx`, `pages/Templates.tsx`.
**E2E (new):** `e2e/tests/templates-sync.spec.ts`.

## 8. Sequencing (for the plan)
1. Multi-draft mock + its spec.
2. `syncPending` service + poller refactor + `POST /templates/sync` + tests.
3. Per-language variables: DTO + `createDraft` + tests (backend).
4. web client: `api/templates.ts` (per-variant `variables`, `syncTemplates`).
5. Wizard payload (per-variant variables) + `TemplateForm` per-language variables input.
6. `Templates.tsx` Sync button wiring.
7. E2E spec.

Backend-first (1–3) then web (4–6); each ends with the relevant build/test. Tasks 1–3 are independent backend changes; 3 must precede 4–5 (the web type/UI follow the DTO).

## 9. Open questions / risks
1. **Mock sync reports `updated: 0`** in `WHATSAPP_MOCK_MODE` (status always PENDING). Honest + the endpoint genuinely runs; documented in the toast copy ("No status changes from Meta yet"). A live token would make it reconcile for real.
2. **Per-language variables touches both create surfaces** (wizard + form). The wizard change is a simplification (stop unioning); the form gains per-tab inputs — the larger UI piece. If `TemplateForm`'s variables UI proves heavy, the wizard path (the headline) still delivers the feature; the form follows the same per-variant shape.
3. **Poller→Service dependency:** moving reconcile into `TemplatesService` and having the poller call it is one-way (no cycle); both are declared in `TemplatesModule`.
