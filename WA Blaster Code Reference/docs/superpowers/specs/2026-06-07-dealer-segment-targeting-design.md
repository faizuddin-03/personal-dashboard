# Dealer Segment Targeting — Enum Fix + Builder Columns + Bulk-Select-to-Segment — Design Spec

**Date:** 2026-06-07
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft (autonomous slice — scope decided per the user's standing "continue without asking" delegation)
**Context:** Hackathon. eAuto dealer + AI console (`apps/web` + `apps/api`). Slice **G** of the remaining-work roadmap (after #16–20). Branch `feat/dealers-bulk-segments`, based on `master`.

---

## 1. Purpose

The Dealers area should let an operator **build a target audience and act on it**. Today (per the 2026-06-07 audit):

1. **Enum drift breaks dealer filtering.** The web client (`apps/web/src/api/contacts.ts`) declares dealer enums that don't match Prisma: `DealerTier` has a non-existent `STANDARD`; `VehicleSpecialization` uses `CONTINENTAL`/`COMMERCIAL`/`OTHER` instead of the real `CONTINENTAL_LUXURY`/`COMMERCIAL_PICKUP`/`SUV_MPV`/`MOTORCYCLE`; `SubscriptionStatus` has `TRIAL`/`CANCELLED` instead of `EXPIRING`. The Dealers toolbar filters and the "Specialization" table column are wired to these wrong values — so filtering by tier `STANDARD` or spec `CONTINENTAL` sends an invalid enum (rejected by `ListContactsDto`'s `@IsEnum`), and a seeded `CONTINENTAL_LUXURY` dealer renders a blank/mislabeled specialization.
2. **The segment builder exposes no dealer columns.** `FilterBuilder.tsx` only has B2C chips (ethnicity, gender, religion, occupation, language, opt-in, age). The six dealer fields (`tier`, `subscriptionStatus`, `vehicleSpecialization`, `numberType`, `state`, `city`) are already fully wired in the backend (`ContactFilter` → `filterToWhere` → `ListContactsDto`) but have **no UI** in the builder.
3. **No dealer bulk actions / no "add to segment".** The Dealers table is fully read-only — no multi-select, no row actions. There is no way to take a set of dealers and turn it into a reusable, blastable audience.

### Key architectural findings (drive the scope)

- **Segments are dynamic, not membership-based.** `ContactSegment` stores a freeform `filterJson` (`CreateSegmentDto.filter` is `@IsObject()` with no per-field validation). There is **no** membership join table.
- **`filterToWhere` is the single chokepoint** used by `ContactsService.list`, `SegmentsService.preview`, **and** `BlastsService.resolveRecipients` (segment path: `filterToWhere(segment.filterJson)` then enforce `optInStatus: 'OPTED_IN'`).

**Consequence:** a hand-picked dealer selection can be persisted as a segment whose filter is simply `{ contactIds: [...] }`. Adding `contactIds → where.id IN (...)` to `filterToWhere` makes such a segment resolve correctly **everywhere** (preview count, and — at send time — blast recipients), with **no new model, no migration**. This deliberately replaces the roadmap's "add-to-segment needs a new membership model" assumption with a lighter, architecture-aligned design.

LLM/transport are untouched; this slice is dealer/segment UX + one tiny backend filter field.

---

## 2. Scope

### In scope
1. **Align web dealer enums to Prisma** (`contacts.ts` types + `Dealers.tsx` label/icon/option maps). Bug fix + foundation for the rest.
2. **Dealer columns in the segment `FilterBuilder`**: `tier`, `subscriptionStatus`, `vehicleSpecialization`, `numberType` (chips), `state` (chips), `city` (comma-separated text). Frontend only (backend already supports them).
3. **Backend `contactIds` filter field**: add `contactIds?: string[]` to the `ContactFilter` interface + `filterToWhere` (`where.id = { in }`) + a unit test. No segment-DTO change.
4. **Dealers bulk-select → "Save as segment"**: row checkboxes + select-all (current page) + a selection action bar; "Save as segment" opens a small name/description form and calls `createSegment({ filter: { contactIds } })`; toast + clear selection. The selection is the "bulk action"; the saved segment is reusable and blastable.
5. **Tests:** API unit (`filter-to-where.spec.ts`) for `contactIds`; web builds; a deferred Playwright spec (`dealers-segment.spec.ts`).

### Out of scope (deferred)
- A static `SegmentMembership` model (the `contactIds` filter supersedes the need for this slice).
- "Save the active *filter* as a segment" (only selection→segment here). A clean follow-up, noted in §9.
- Bulk **mutation** of dealers (opt-in/opt-out edits, attribute edits). The page stays read-only for dealer data; "Save as segment" creates a *new segment object*, it does not modify any dealer. No role-gating needed (segment create is already JWT-only).
- Inline `city` autocomplete (free-text comma-separated only).
- A shared `<DataTable>` refactor.

---

## 3. Architecture

### 3.1 Enum alignment (Task 1)
Canonical Prisma values (source of truth):

| Enum | Canonical values |
|------|------------------|
| `DealerTier` | `BRONZE`, `SILVER`, `GOLD` |
| `SubscriptionStatus` | `ACTIVE`, `EXPIRING`, `LAPSED` |
| `VehicleSpecialization` | `NATIONAL`, `CONTINENTAL_LUXURY`, `SUV_MPV`, `COMMERCIAL_PICKUP`, `EV_HYBRID`, `MOTORCYCLE`, `MULTI_BRAND` |
| `NumberType` | `PHONE`, `LANE` |

- **`apps/web/src/api/contacts.ts`** — redefine the four union types to exactly the canonical values. Add `contactIds?: string[]` to the web `ContactFilter` interface (for Task 4). Tighten `ContactFilter.numberType` to `NumberType[]` and `state` to `MalaysianState[]` (currently loose `string[]`).
- **`apps/web/src/pages/Dealers.tsx`** — update the label/icon maps and toolbar options to canonical values:
  - `TIER_LABELS`: `{ GOLD:'Gold', SILVER:'Silver', BRONZE:'Bronze' }` (drop `STANDARD`); tier `<select>` drops the "Standard" option.
  - `VEHICLE_LABELS` / `VEHICLE_ICONS` / `ALL_VEHICLE_SPECS`: the 7 canonical specs with readable labels/emoji (see §3.2 label table).
  - Subscription badges: keep `LAPSED` (red "Lapsed"); replace the `TRIAL` badge with `EXPIRING` ("Expiring", `human`/amber tone).
  This makes existing dealer filtering and the specialization column correct.

### 3.2 FilterBuilder dealer columns (Task 2)
`apps/web/src/components/FilterBuilder.tsx` already has a generic `MultiSelectChips<T>`. Add option lists + label maps and render six more controls (in the existing 2-col grid), each wired with the same `onChange({ ...value, X: next.length ? next : undefined })` pattern:

| Builder control | `ContactFilter` key | Options (canonical) | Display labels |
|---|---|---|---|
| Tier | `tier` | BRONZE, SILVER, GOLD | Bronze / Silver / Gold |
| Subscription | `subscriptionStatus` | ACTIVE, EXPIRING, LAPSED | Active / Expiring / Lapsed |
| Specialization | `vehicleSpecialization` | (7 above) | National, Continental/Luxury, SUV/MPV, Commercial/Pickup, EV/Hybrid, Motorcycle, Multi-brand |
| Number type | `numberType` | PHONE, LANE | Phone / Lane |
| State | `state` | `ALL_STATES` (from `stateLanguageMappings`) | `stateLabel(s)` |
| City | `city` | — (text input) | comma-separated → `string[]` |

The chips render the **display label** but select the **canonical value** (extend `MultiSelectChips` to accept an optional `labels?: Record<string,string>`, falling back to the raw value — keeps existing B2C chips unchanged). `city` mirrors the template-variables pattern: `value.city?.join(', ')` ↔ `split(',').map(trim).filter(Boolean)`. All six already pass straight through `filterToWhere` and segment preview — **no backend change for this task**.

### 3.3 `contactIds` filter (Task 3)
- **`apps/api/src/segments/dto/contact-filter.dto.ts`** — add `contactIds?: string[];` to the `ContactFilter` interface.
- **`apps/api/src/segments/filter-to-where.ts`** — add near the top of the field mappings:
  ```ts
  if (filter.contactIds?.length) where.id = { in: filter.contactIds };
  ```
- No `CreateSegmentDto` change — `filter` is `@IsObject()` (freeform). No migration. `BlastsService.resolveRecipients` and `SegmentsService.preview` pick it up automatically (a `contactIds` segment resolves to exactly those rows; the blast path additionally enforces `optInStatus: 'OPTED_IN'`, so opted-out picks are silently excluded from a blast — correct).

### 3.4 Bulk-select → Save as segment (Task 4)
`apps/web/src/pages/Dealers.tsx`, dealers tab only:
- **Selection state:** `const [selected, setSelected] = useState<Set<string>>(new Set())`. A leading checkbox column (`<th>`/`<td>`) per row; a header checkbox toggles all **current-page** rows (indeterminate when partial). Selecting persists across the page only (cleared on filter/page change to avoid hidden-selection surprises — clear `selected` in the same handlers that `setPage(1)`).
- **Action bar:** when `selected.size > 0`, render a bar above the table: "`N` selected", a **Save as segment** button, and **Clear**.
- **Save dialog:** clicking Save as segment reveals a small inline form (name required, description optional) — a lightweight panel within the bar (no new modal component). Submit calls a `useMutation`:
  ```ts
  createSegment({ name, description: description || undefined, filter: { contactIds: [...selected] } })
  ```
  on success: `qc.invalidateQueries({ queryKey: ['segments'] })`, `showToast('Segment "<name>" saved with N dealers')`, clear selection + form. on error: `showToast(extractMessage(e), 'error')` (handles 409 name-taken).
- **Toast:** the page currently has none; add the standard `Toast` + `showToast` pattern used elsewhere (`useState<{message,variant}|null>` + `<Toast …/>`).
- **No role gate:** creating a segment doesn't mutate dealers; available to all authenticated users. (The "View-only" pill for operators reflects dealer-data read-only-ness, which is unchanged.)

### 3.5 Data flow
- Build segment (rule-based): Segments page → `FilterBuilder` (now incl. dealer columns) → `createSegment({ filter })` → preview/blast via `filterToWhere`.
- Build segment (selection-based): Dealers table → check rows → "Save as segment" → `createSegment({ filter: { contactIds } })` → appears in Segments list + Dealers→Segments tab → "Use" in a blast → `resolveRecipients` runs `filterToWhere({ contactIds })` + opted-in enforcement.

---

## 4. Error / empty / loading
- **Save as segment:** empty name disables Save (client-side `required`); 409 (duplicate name) → error toast, form stays open. Network error → error toast.
- **Selection:** clearing filters/changing page/tab clears the selection (documented behavior; avoids acting on rows no longer visible). Header checkbox reflects only current-page rows.
- **FilterBuilder city:** blank → `city` omitted (`undefined`), not `[""]`.
- **`contactIds` segment with 0 opted-in members:** blast already throws `BadRequestException('Segment resolved to 0 contacts')` — unchanged, surfaced by the existing blast UI.
- All routes JWT-guarded (unchanged). No new endpoints.

## 5. Testing strategy
- **API unit** (`apps/api/src/segments/__tests__/filter-to-where.spec.ts`): `contactIds` → `{ id: { in: [...] } }`; empty array / absent → no `id` clause; coexists with other filters (e.g. `contactIds` + `tier`).
- **Web:** `pnpm --filter web build` (typecheck) after each web task — the enum retype (Task 1) will surface every drifted usage as a compile error to fix.
- **E2E** (`e2e/tests/dealers-segment.spec.ts`, Playwright, **run deferred** — needs Postgres + servers + browsers): on `/segments`, the builder shows dealer chips (e.g. a "Gold" tier chip) and creating a segment works; on `/contacts`, selecting dealer rows reveals the "Save as segment" bar and saving shows a result toast. Mirror `e2e/tests/blasts.spec.ts` `loginAsAdmin`.

## 6. File-by-file change list
**API (edit):** `segments/dto/contact-filter.dto.ts`, `segments/filter-to-where.ts`, `segments/__tests__/filter-to-where.spec.ts`.
**Web (edit):** `api/contacts.ts`, `pages/Dealers.tsx`, `components/FilterBuilder.tsx`.
**E2E (new):** `e2e/tests/dealers-segment.spec.ts`.

## 7. Sequencing (for the plan)
1. **Enum alignment** (`contacts.ts` + `Dealers.tsx`) — foundation; build must stay green. Add `contactIds` to web `ContactFilter` here too.
2. **`contactIds` backend** (interface + `filterToWhere` + unit test) — independent of web; do early so the full API suite stays green.
3. **FilterBuilder dealer columns** — depends on Task 1's canonical web enums.
4. **Bulk-select → Save as segment** — depends on Task 1 (enums) + Task 2's `contactIds` web type; the largest UI piece, done last.
5. **E2E spec** (deferred run).

Each web task ends with `pnpm --filter web build`; each API task with `pnpm --filter api test` + `pnpm --filter api build`.

## 8. Open questions / risks
1. **Selection is page-scoped & cleared on navigation.** Cross-page multi-select (accumulating across pages) is more powerful but error-prone (acting on unseen rows). Page-scoped + clear-on-change is the safe, legible choice; documented in the toast/empty copy.
2. **`contactIds` segments are static snapshots** (a fixed id list), unlike rule-based segments that "update as dealers sync." Acceptable and arguably the intent of "save these specific dealers." The Segments tab copy ("Sizes update automatically…") is rule-segment framing; not changing copy this slice, but a `contactIds` segment's preview count simply reflects the current matching rows.
3. **Enum retype is a breaking type change** that will produce compile errors anywhere the drifted values were used (Dealers toolbar/table, possibly elsewhere). Task 1 must `grep` for all usages of the old values (`STANDARD`, `CONTINENTAL`, `COMMERCIAL`, `TRIAL`, `CANCELLED`, `PERSONAL`, `BUSINESS`, `'OTHER'` as a vehicle spec) and fix each; `pnpm --filter web build` is the backstop.
4. **No deep validation of `contactIds`** (segment `filter` is freeform). A malformed id list just resolves to fewer/zero rows — no crash. Acceptable for a hackathon; a future `@ValidateNested` ContactFilter DTO would harden it (out of scope).
