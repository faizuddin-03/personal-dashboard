# State-Based Language Blasting — Design Spec

**Date:** 2026-06-02
**Status:** Draft
**Author:** zhenyang@modefair.com
**Branch:** `feat/state-language-blast` off `master` → PR to `master`
**Tag on merge:** `phase-8-state-language-blast-complete`

## Summary

Add a per-blast option to select template language(s) by the contact's **state** rather than their individual language preference. A configurable, ADMIN-managed mapping assigns one or more languages to each Malaysian state (e.g. Penang → Mandarin + English, Kelantan → Malay). When a blast runs in state-based mode, each contact receives one message per language mapped to their state — so a Penang contact gets two messages (one ZH, one EN). Contacts whose state has no mapping (or whose state is null) fall back to the blast's default language.

## Goals

- Let marketing target message language by geography, not just per-contact preference.
- Support multiple languages per state (one contact → multiple messages).
- Keep the mapping editable by admins without code changes.
- Preserve the existing preference-based behavior for blasts that don't opt in.
- Fail fast: block a state-based blast if a required language has no approved template variant.

## Non-Goals

- Per-blast ad-hoc mapping (the mapping is global config, not re-entered per blast).
- Language selection by city, postcode, or any geography finer than state.
- Automatic template translation or variant generation.
- Changing how the worker sends individual messages (fan-out happens at blast-creation time; the worker still processes one message per job).
- Deduplicating messages to the same contact (sending ZH + EN to one number is intended).

## Decisions

| # | Decision | Choice |
|---|----------|--------|
| 1 | Mapping storage & multiplicity | Configurable table; multiple languages per state → one contact may receive multiple messages |
| 2 | Interaction with `languagePreference` | Per-blast mode toggle (`PREFERENCE` \| `STATE`). In STATE mode, state fully drives language; `languagePreference` ignored. Unmapped/null state → blast default language |
| 3 | Missing template variant | Block blast creation with a precise error listing each (language → states) gap |
| 4 | State matching | Canonical `MalaysianState` enum (16 states/territories) + normalization of existing free-text `state` values |
| 5 | Recipient counting | Count messages; display "X messages to Y contacts"; add `Blast.uniqueContacts`. `recipientSnapshot` stays contact-IDs (language recoverable from each Message's `templateId`) |
| 6 | Mapping management UI | New section in the ADMIN-only Settings page |
| 7 | Storage approach | Dedicated `StateLanguageMapping` table (not a JSON SystemSetting blob) |

## Data Model

### New enums

```prisma
enum MalaysianState {
  JOHOR
  KEDAH
  KELANTAN
  MELAKA
  NEGERI_SEMBILAN
  PAHANG
  PENANG
  PERAK
  PERLIS
  SABAH
  SARAWAK
  SELANGOR
  TERENGGANU
  KUALA_LUMPUR
  LABUAN
  PUTRAJAYA
}

enum BlastLanguageMode {
  PREFERENCE   // existing behavior: contact.languagePreference → default
  STATE        // new: contact.state → mapping table → languages
}
```

### New table

```prisma
model StateLanguageMapping {
  state      MalaysianState        @id
  languages  LanguagePreference[]
  updatedAt  DateTime              @updatedAt @map("updated_at")

  @@map("state_language_mapping")
}
```

One row per configured state. A state with no row (or an empty `languages` array) means "no mapping → fall back to blast default language."

### Contact change

`Contact.state` changes from free-text `String?` to `MalaysianState?`. The migration normalizes existing values through an alias map (see Migration section). Unrecognized values become `NULL` (logged).

Affected by the type change (all switch to the enum):
- `Contact.state` column + its existing index
- `ContactFilter.state` (segment filter): `string[]` → `MalaysianState[]`
- `CreateContactDto` / `UpdateContactDto` `state` field
- CSV import (maps incoming free-text through `normalizeState`)

### Blast changes

```prisma
model Blast {
  // ... existing fields
  languageMode    BlastLanguageMode @default(PREFERENCE) @map("language_mode")
  uniqueContacts  Int               @default(0)          @map("unique_contacts")
  // totalRecipients now means "total messages" (may exceed uniqueContacts)
}
```

`recipientSnapshot` remains a contact-ID list. Per-message language is recoverable from each Message's `templateId`.

## Fan-out & Message Generation

All changes are isolated to `BlastsService.createAndSchedule` plus one new pure helper. Existing `PREFERENCE`-mode blasts are untouched.

### Pure helper — `resolveContactLanguages`

```ts
function resolveContactLanguages(
  contactState: MalaysianState | null,
  mapping: Map<MalaysianState, LanguagePreference[]>,
  defaultLanguage: LanguagePreference,
): LanguagePreference[] {
  if (!contactState) return [defaultLanguage];
  const langs = mapping.get(contactState);
  if (!langs || langs.length === 0) return [defaultLanguage];
  return langs;
}
```

### `createAndSchedule` — STATE mode flow

1. Load the full `StateLanguageMapping` into a `Map<MalaysianState, LanguagePreference[]>`.
2. Load in-segment contacts with `{ id, state }`.
3. Compute the required-language set = union of `resolveContactLanguages(...)` across all contacts.
4. **Validation gate:** for each required language, assert the template family has an APPROVED variant. If any missing, throw `BadRequestException` with structured `gaps` (see Validation).
5. Create the `Blast` row with `languageMode: STATE`, `uniqueContacts = contacts.length`.
6. **Fan-out:** for each contact, for each language in `resolveContactLanguages(...)`, create one `Message` with the matching `templateId`. (Penang contact → 2 Message rows.)
7. `totalRecipients` = total Message count.
8. Enqueue one BullMQ job per Message (unchanged worker contract).

### PREFERENCE mode

Keeps the existing `selectTemplateRow` path verbatim — one message per contact. The two modes branch early in `createAndSchedule`; the shared tail (blast-row creation, job enqueue) is factored so both feed into it.

`languagePreference` is ignored entirely in STATE mode (Decision 2). Messages for the same contact in different languages are independent jobs — no dedup. The worker's existing per-message guard (blastId/templateId non-null for blast messages) is unaffected.

## Validation & Error Surface

All validation runs **before any message is queued** (fail-fast, consistent with the irreversible-launch philosophy).

### 1. Template variant coverage (main gate)

Compute required languages = union across all in-segment contacts. For each, check the template family has an APPROVED variant. On failure, `400`:

```json
{
  "error": "missing_template_variants",
  "message": "State-based blast needs languages with no approved template variant.",
  "gaps": [
    { "language": "ZH", "requiredByStates": ["PENANG", "PERAK"], "templateName": "eid_promo" }
  ]
}
```

### 2. Empty-segment guard

Unchanged from existing behavior: reject if the segment resolves to 0 contacts.

### 3. Mapping-table sanity (admin CRUD side)

- `languages` array must be non-empty (`@ArrayMinSize(1)`) and contain only valid `LanguagePreference` values (`@IsEnum`).
- Saving a mapping does NOT validate against any template — mappings are template-independent. Variant coverage is checked only at blast-creation time.

### Not errors

- State with no mapping row → default-language fallback.
- Contact with `state = NULL` → default-language fallback.
- The default language must be APPROVED — already enforced by the existing `validateTemplate` for both modes.

### Preview endpoint (pre-submit, non-blocking)

```
POST /api/blasts/preview-state-languages
  body: { templateName, defaultLanguage, segmentId }
  → {
      uniqueContacts: 180,
      totalMessages: 240,
      byLanguage: { EN: 180, ZH: 60 },
      byState: [{ state: "PENANG", contacts: 60, languages: ["ZH","EN"] }, ...],
      gaps: []   // same shape as the error payload; empty = good to launch
    }
```

The wizard review step calls this to show "240 messages to 180 contacts" and surface gaps before launch.

## API Surface

### New module — `StateLanguageMappingModule` (ADMIN-only)

```
GET    /api/state-language-mappings           → all 16 states with languages (unmapped = empty array)
PUT    /api/state-language-mappings/:state     → upsert one state's languages  { languages: LanguagePreference[] }
DELETE /api/state-language-mappings/:state     → clear a state's mapping (revert to default fallback)
```

- `GET` returns all 16 enum states (left-joined to the mapping table) so the admin UI is a fill-in grid, not an add/remove list.
- `PUT` upserts; an empty array via PUT is rejected (use DELETE to clear).
- Guarded by `JwtAuthGuard` + ADMIN role check, matching the existing `system-settings.controller.ts` admin-guard pattern.

### Blast endpoints

```
POST /api/blasts/preview-state-languages   → the read-only resolution preview above
POST /api/blasts                            → existing; CreateBlastDto gains languageMode
```

`CreateBlastDto` addition:
```ts
@IsOptional() @IsEnum(BlastLanguageMode)
languageMode?: BlastLanguageMode = BlastLanguageMode.PREFERENCE;
```

When `STATE`, the service runs the fan-out path; otherwise the existing path. `defaultLanguage` becomes the fallback in STATE mode. No other DTO fields change meaning.

### Contact import/edit

- `CreateContactDto`/`UpdateContactDto` `state`: `string` → `MalaysianState` (`@IsOptional @IsEnum`).
- CSV import maps incoming free-text through `normalizeState(raw): MalaysianState | null`; unmapped → `null` + a per-row warning in the import summary.
- `ContactFilter.state`: `string[]` → `MalaysianState[]`.

### Shared helper — `normalizeState`

Lives in `apps/api/src/contacts/state-normalizer.ts`. Pure function used by (a) the data migration, (b) CSV import, (c) any other free-text state entry point. Unit-tested with the alias table.

## Frontend / UI

### 1. Settings — "State language mapping" section (ADMIN-only)

A new `Card` alongside the Phase 5 tier + attribution-window cards. A 16-row table: state name + its language `Pill`s (or "— (default)" when unmapped) + an edit control. Edit opens an inline multi-select of `LanguagePreference` values; save → `PUT`, clear-all → `DELETE`. Uses existing reskin primitives. Test IDs: `state-lang-row-{STATE}`, `state-lang-save`, `state-lang-multiselect`. Hook `useStateLanguageMappings` (no polling; refetch on mutation).

### 2. Blast wizard — language mode toggle + state-aware review

- **Template step:** toggle `Language by: (•) Contact preference  ( ) Contact state` (`data-testid="blast-language-mode"`), defaults to preference. Helper text under "Contact state": "Each contact receives a message in every language mapped to their state. Unmapped states use the default language."
- **Review step (state mode):** calls `POST /blasts/preview-state-languages`, renders "X messages to Y contacts", by-language counts, and a by-state breakdown. If `gaps` non-empty, shows a red blocker listing each missing (language → states) and disables Launch. Test IDs: `blast-state-preview`, `blast-state-gaps`.
- **Launch dialog:** existing heavy-friction confirm reads "Send 240 messages to 180 contacts?" in state mode.

### 3. Blast detail — message-vs-contact display

- Header KPI: "X messages · Y contacts" (`totalRecipients` + new `uniqueContacts`).
- Recipients table (Phase 5) gains a "Language" column (from each message's template variant), so a Penang contact appears twice.

### 4. Contact form / import — enum dropdown

- Contact create/edit `state` becomes a dropdown of the 16 states.
- CSV import UX unchanged; result summary reports "N rows had an unrecognized state and were imported without one."

## Testing Strategy

### Unit (TDD, Jest)

- **`state-normalizer.spec.ts`** — aliases (`"Pulau Pinang"`/`"penang"`/`"PNG"` → `PENANG`; `"KL"`/`"W.P. Kuala Lumpur"` → `KUALA_LUMPUR`), canonical round-trip, unknown → `null`, case/whitespace-insensitive.
- **`resolve-contact-languages.spec.ts`** — null → `[default]`; unmapped → `[default]`; `PENANG` → `[ZH,EN]`; empty array → `[default]`.
- **`blasts.service.spec.ts`** (extend) — STATE mode: Penang contact → 2 messages; mixed segment → correct `totalRecipients` vs `uniqueContacts`; PREFERENCE unchanged (regression); validation throws structured `gaps`; default-fallback path → 1 message.
- **`state-language-mapping.service.spec.ts`** — upsert, GET-returns-16, DELETE clears, empty-array PUT rejected, non-enum rejected.
- **`state-language-mapping.controller.spec.ts`** — ADMIN passes, OPERATOR 403, DTO validation.
- **Preview endpoint test** — `byLanguage`/`byState`/`gaps` shape correct.

### E2E (Playwright) — `e2e/tests/state-language-blast.spec.ts`

1. Admin sets Penang → [ZH, EN], Kelantan → [MS] in Settings; reload shows persistence.
2. Operator builds a STATE-mode blast; review shows "X messages to Y contacts" + by-state breakdown.
3. Gap case: template missing ZH variant → red blocker, Launch disabled.
4. Happy path: all variants present → launch → detail shows messages > contacts, recipients table shows a Penang contact twice (ZH + EN).
5. PREFERENCE-mode blast still works (regression).
6. Operator cannot access the mapping Settings section (hidden/403).

### Migration testing

- Fresh DB: enums + table + Blast columns apply; mapping empty.
- DB with existing free-text `state`: normalization converts known aliases, nulls unknowns, prints a conversion summary. Test with seeded `"Penang"`, `"Pulau Pinang"`, `"Selangor"`, `"Atlantis"`.
- Backfill `Blast.uniqueContacts = totalRecipients` for existing blasts (pre-feature blasts were 1:1).

## Rollout & Migration

### Migrations (3, bundled)

1. Add `MalaysianState` + `BlastLanguageMode` enums + `state_language_mapping` table.
2. Add `Blast.languageMode` (default `PREFERENCE`) + `Blast.uniqueContacts` (backfill = `totalRecipients`).
3. Normalize + convert `Contact.state` (free-text → enum) via the alias map; unrecognized → `NULL`; print a conversion summary.

`ContactFilter.state` values stored in existing segment `filterJson` are free-text. We deliberately do NOT rewrite them in the migration (YAGNI for the current small segment set): a stored free-text state like `"Selangor"` no longer matches the enum column at query time, so such a segment simply resolves to fewer/zero contacts — a safe, visible degradation rather than a silent wrong-send. Admins re-save any important state-based segment through the UI (which now uses the enum dropdown) after the migration. If the segment set grows, a one-off `filterJson` normalization step can be added later.

### Deployment sequence

1. Merge → `pnpm install` (no new deps) → `pnpm db:migrate` (3 migrations + normalization).
2. Review the normalization summary; spot-fix nulled states via the Settings dropdown / contact edit.
3. Admin populates the mapping table before the first state-based blast.
4. Restart api + worker + web.
5. Tag `phase-8-state-language-blast-complete`.

### Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Fan-out multiplies sends (= WhatsApp charges) | Review preview shows the message count prominently before the friction-heavy launch confirm |
| Unmapped/null states silently use default language | Migration conversion summary + CSV import warnings surface gaps; not silent |
| Enum rigidity (new state needs a migration) | Acceptable — Malaysia's 16 states/territories are stable |
| Existing segment filters store free-text states | Stored `filterJson` values are NOT rewritten (YAGNI); a free-text state no longer matches the enum column, so such a segment resolves to fewer/zero contacts — safe, visible degradation. Re-save important state-based segments via the UI after migration |

## Open Questions

None — all scope decisions are recorded in the Decisions table.

## Acceptance Criteria

1. All unit tests pass (`pnpm --filter api test`).
2. All E2E scenarios pass (`pnpm e2e`).
3. Admin can set/clear per-state language mappings in Settings; changes persist.
4. A STATE-mode blast generates one message per (contact × mapped language); a Penang contact mapped to [ZH, EN] receives 2 messages.
5. Contacts with unmapped or null state receive 1 message in the blast default language.
6. Creating a STATE-mode blast whose template lacks a required approved variant is blocked with a precise `gaps` error; the wizard preview shows the same gaps and disables Launch.
7. Blast detail and wizard show "X messages to Y contacts"; the recipients table shows per-message language.
8. PREFERENCE-mode blasts behave exactly as before (regression).
9. Migration converts existing free-text `state` to the enum, nulls unrecognized values, and prints a conversion summary.
10. The mapping Settings section is inaccessible to OPERATOR.
