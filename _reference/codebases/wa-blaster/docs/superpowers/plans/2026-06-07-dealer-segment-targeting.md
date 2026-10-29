# Dealer Segment Targeting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make dealer audience-building work end to end: fix the web/Prisma dealer-enum drift, add dealer columns to the segment builder, and let an operator multi-select dealers and save them as a (blastable) segment.

**Architecture:** Frontend-led. Align `apps/web` dealer enums to the canonical Prisma values; add the six already-backend-wired dealer fields to `FilterBuilder`; add a one-field `contactIds` filter to the shared `filterToWhere` (the single chokepoint for contacts-list, segment-preview, and blast recipient resolution) so a selection persists as a segment with **no new model/migration**.

**Tech Stack:** NestJS 10, Prisma 5, Jest (pure-fn + mocked deps), Vite + React + TS, @tanstack/react-query v5, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-07-dealer-segment-targeting-design.md`

---

## Conventions (read once)

- **GIT GUARD (every implementer):** you are on branch `feat/dealers-bulk-segments` — do NOT run `git checkout`/`switch`/`branch`; only `git add` + `git commit`.
- Canonical Prisma dealer enums (source of truth): `DealerTier = BRONZE|SILVER|GOLD`; `SubscriptionStatus = ACTIVE|EXPIRING|LAPSED`; `VehicleSpecialization = NATIONAL|CONTINENTAL_LUXURY|SUV_MPV|COMMERCIAL_PICKUP|EV_HYBRID|MOTORCYCLE|MULTI_BRAND`; `NumberType = PHONE|LANE`.
- Web: `pnpm --filter web build` (tsc + vite) is the typecheck gate. API: `pnpm --filter api test` + `pnpm --filter api build`.
- The repo has no frontend unit tests; web correctness = build + (deferred) e2e.
- `filterToWhere` is pure: `(filter, now?) => Prisma.ContactWhereInput`. Segment `filter` is freeform (`CreateSegmentDto.filter` is `@IsObject()`), so no segment-DTO change is needed for `contactIds`.

---

## Task 1: Align web dealer enums to Prisma (foundation)

**Files:**
- Modify: `apps/web/src/api/contacts.ts`, `apps/web/src/pages/Dealers.tsx`

- [ ] **Step 1: Fix the enum unions** in `apps/web/src/api/contacts.ts` — replace the four drifted types (lines ~12–21) with:
```ts
// Dealer-specific enums (canonical — match Prisma)
export type DealerTier = 'GOLD' | 'SILVER' | 'BRONZE';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRING' | 'LAPSED';
export type VehicleSpecialization =
  | 'NATIONAL'
  | 'CONTINENTAL_LUXURY'
  | 'SUV_MPV'
  | 'COMMERCIAL_PICKUP'
  | 'EV_HYBRID'
  | 'MOTORCYCLE'
  | 'MULTI_BRAND';
export type NumberType = 'PHONE' | 'LANE';
```

- [ ] **Step 2: Tighten + extend `ContactFilter`** in `contacts.ts` — change `state?: string[]` → `state?: MalaysianState[]`, `numberType?: string[]` → `numberType?: NumberType[]`, and add `contactIds?: string[];` (used by Task 4). `MalaysianState` is already imported at the top of the file.

- [ ] **Step 3: Fix the label/icon/option maps** in `apps/web/src/pages/Dealers.tsx`:
  - `TIER_LABELS` → `{ GOLD: 'Gold', SILVER: 'Silver', BRONZE: 'Bronze' }` (drop `STANDARD`).
  - `VEHICLE_LABELS`:
    ```ts
    const VEHICLE_LABELS: Record<VehicleSpecialization, string> = {
      NATIONAL: 'National',
      CONTINENTAL_LUXURY: 'Continental/Luxury',
      SUV_MPV: 'SUV/MPV',
      COMMERCIAL_PICKUP: 'Commercial/Pickup',
      EV_HYBRID: 'EV/Hybrid',
      MOTORCYCLE: 'Motorcycle',
      MULTI_BRAND: 'Multi-brand',
    };
    ```
  - `VEHICLE_ICONS`:
    ```ts
    const VEHICLE_ICONS: Record<VehicleSpecialization, string> = {
      NATIONAL: '🇲🇾',
      CONTINENTAL_LUXURY: '🌍',
      SUV_MPV: '🚙',
      COMMERCIAL_PICKUP: '🚛',
      EV_HYBRID: '⚡',
      MOTORCYCLE: '🏍️',
      MULTI_BRAND: '🏪',
    };
    ```
  - `ALL_VEHICLE_SPECS` → `['NATIONAL','CONTINENTAL_LUXURY','SUV_MPV','COMMERCIAL_PICKUP','EV_HYBRID','MOTORCYCLE','MULTI_BRAND']`.

- [ ] **Step 4: Fix the toolbar tier select + subscription badge** in `Dealers.tsx`:
  - Remove the `<option value="STANDARD">Standard</option>` from the tier `<select>`.
  - Replace the `subStatus === 'TRIAL'` badge block with `EXPIRING`:
    ```tsx
    {subStatus === 'EXPIRING' && (
      <Badge tone="human" style={{ height: 17, fontSize: 10 }}>
        Expiring
      </Badge>
    )}
    ```
    (Keep the `subStatus === 'LAPSED'` red "Lapsed" badge as-is.)

- [ ] **Step 5: Hunt remaining drifted usages** — grep `apps/web/src` for the old literals to catch any other consumer: `STANDARD`, `'CONTINENTAL'`, `'COMMERCIAL'`, `TRIAL`, `CANCELLED`, `'PERSONAL'`, `'BUSINESS'`. Fix any that reference the dealer enums. (Note: `'OTHER'` and `'UNKNOWN'` are still valid for the B2C enums — do NOT touch those.)

- [ ] **Step 6: Typecheck** — `pnpm --filter web build` → must succeed (the retype surfaces every drifted usage as a compile error). Fix until green.

- [ ] **Step 7: Commit**
```bash
git add apps/web/src/api/contacts.ts apps/web/src/pages/Dealers.tsx
git commit -m "fix(web): align dealer enums to Prisma (tier/subscription/spec/numberType)"
```

---

## Task 2: `contactIds` filter (backend)

**Files:**
- Modify: `apps/api/src/segments/dto/contact-filter.dto.ts`, `apps/api/src/segments/filter-to-where.ts`
- Test: `apps/api/src/segments/__tests__/filter-to-where.spec.ts`

- [ ] **Step 1: Write the failing test** — append to `filter-to-where.spec.ts` (match the file's existing import of `filterToWhere` and its assertion style):
```ts
describe('filterToWhere — contactIds', () => {
  it('maps contactIds to an id "in" clause', () => {
    expect(filterToWhere({ contactIds: ['a', 'b'] })).toEqual({ id: { in: ['a', 'b'] } });
  });

  it('omits the id clause when contactIds is empty or absent', () => {
    expect(filterToWhere({ contactIds: [] }).id).toBeUndefined();
    expect(filterToWhere({}).id).toBeUndefined();
  });

  it('combines contactIds with other filters', () => {
    const where = filterToWhere({ contactIds: ['a'], tier: ['GOLD'] });
    expect(where.id).toEqual({ in: ['a'] });
    expect(where.tier).toEqual({ in: ['GOLD'] });
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- filter-to-where`
Expected: FAIL — `contactIds` not yet typed / `id` clause not produced.

- [ ] **Step 3: Add the field to the interface** — in `apps/api/src/segments/dto/contact-filter.dto.ts`, add to the `ContactFilter` interface:
```ts
  contactIds?: string[];
```

- [ ] **Step 4: Map it in `filterToWhere`** — in `apps/api/src/segments/filter-to-where.ts`, add as the FIRST field mapping (right after `const where ... = {};`):
```ts
  if (filter.contactIds?.length) where.id = { in: filter.contactIds };
```

- [ ] **Step 5: Run, verify pass + full suite**

Run: `pnpm --filter api test -- filter-to-where` (PASS), then `pnpm --filter api test` (full suite green), then `pnpm --filter api build`.

- [ ] **Step 6: Commit**
```bash
git add apps/api/src/segments
git commit -m "feat(api): contactIds filter (id IN) — enables selection-based segments"
```

---

## Task 3: Dealer columns in the segment FilterBuilder

**Files:**
- Modify: `apps/web/src/components/FilterBuilder.tsx`

> Depends on Task 1 (canonical web enums + tightened `ContactFilter`).

- [ ] **Step 1: Extend `MultiSelectChips`** to accept optional display labels — add a `labels?` prop and use it for the chip text (keeps existing B2C chips unchanged, since `labels` is optional):
```tsx
function MultiSelectChips<T extends string>({
  label, options, selected, onChange, testIdPrefix, labels,
}: {
  label: string;
  options: readonly T[];
  selected: T[] | undefined;
  onChange: (next: T[]) => void;
  testIdPrefix: string;
  labels?: Partial<Record<T, string>>;
}) {
  // ...unchanged body, except the chip text node becomes:
  //   {labels?.[opt] ?? opt}
}
```
(Only two edits: the destructured props + the `{opt}` text → `{labels?.[opt] ?? opt}`.)

- [ ] **Step 2: Add imports + option/label constants** at the top of `FilterBuilder.tsx`:
```ts
import type {
  // ...existing imports...
  DealerTier,
  SubscriptionStatus,
  VehicleSpecialization,
  NumberType,
} from '../api/contacts';
import { ALL_STATES, stateLabel, type MalaysianState } from '../api/stateLanguageMappings';

const TIER_OPTIONS: DealerTier[] = ['BRONZE', 'SILVER', 'GOLD'];
const TIER_LABELS: Record<DealerTier, string> = { BRONZE: 'Bronze', SILVER: 'Silver', GOLD: 'Gold' };
const SUBSCRIPTION_OPTIONS: SubscriptionStatus[] = ['ACTIVE', 'EXPIRING', 'LAPSED'];
const SUBSCRIPTION_LABELS: Record<SubscriptionStatus, string> = { ACTIVE: 'Active', EXPIRING: 'Expiring', LAPSED: 'Lapsed' };
const VEHICLE_OPTIONS: VehicleSpecialization[] = ['NATIONAL', 'CONTINENTAL_LUXURY', 'SUV_MPV', 'COMMERCIAL_PICKUP', 'EV_HYBRID', 'MOTORCYCLE', 'MULTI_BRAND'];
const VEHICLE_LABELS: Record<VehicleSpecialization, string> = { NATIONAL: 'National', CONTINENTAL_LUXURY: 'Continental/Luxury', SUV_MPV: 'SUV/MPV', COMMERCIAL_PICKUP: 'Commercial/Pickup', EV_HYBRID: 'EV/Hybrid', MOTORCYCLE: 'Motorcycle', MULTI_BRAND: 'Multi-brand' };
const NUMBER_TYPE_OPTIONS: NumberType[] = ['PHONE', 'LANE'];
const NUMBER_TYPE_LABELS: Record<NumberType, string> = { PHONE: 'Phone', LANE: 'Lane' };
const STATE_LABELS: Record<MalaysianState, string> = Object.fromEntries(
  ALL_STATES.map((s) => [s, stateLabel(s)]),
) as Record<MalaysianState, string>;
```

- [ ] **Step 3: Render the new controls** in the grid (after the existing "Opt-in" chips, before the Age-range block):
```tsx
      <MultiSelectChips label="Tier" options={TIER_OPTIONS} labels={TIER_LABELS}
        selected={value.tier}
        onChange={(next) => onChange({ ...value, tier: next.length ? next : undefined })}
        testIdPrefix="tier" />
      <MultiSelectChips label="Subscription" options={SUBSCRIPTION_OPTIONS} labels={SUBSCRIPTION_LABELS}
        selected={value.subscriptionStatus}
        onChange={(next) => onChange({ ...value, subscriptionStatus: next.length ? next : undefined })}
        testIdPrefix="subscription" />
      <MultiSelectChips label="Specialization" options={VEHICLE_OPTIONS} labels={VEHICLE_LABELS}
        selected={value.vehicleSpecialization}
        onChange={(next) => onChange({ ...value, vehicleSpecialization: next.length ? next : undefined })}
        testIdPrefix="specialization" />
      <MultiSelectChips label="Number type" options={NUMBER_TYPE_OPTIONS} labels={NUMBER_TYPE_LABELS}
        selected={value.numberType}
        onChange={(next) => onChange({ ...value, numberType: next.length ? next : undefined })}
        testIdPrefix="numbertype" />
      <MultiSelectChips label="State" options={ALL_STATES} labels={STATE_LABELS}
        selected={value.state}
        onChange={(next) => onChange({ ...value, state: next.length ? next : undefined })}
        testIdPrefix="state" />
      <div>
        <div className="text-xs font-medium uppercase text-foreground-muted mb-1">City</div>
        <input
          type="text"
          placeholder="Kuala Lumpur, Penang"
          value={value.city?.join(', ') ?? ''}
          onChange={(e) => {
            const cities = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
            onChange({ ...value, city: cities.length ? cities : undefined });
          }}
          className="w-full rounded-md border border-border-strong bg-background px-2 py-1 text-sm text-foreground outline-none focus:border-accent"
          data-testid="filter-city"
        />
      </div>
```
> The web `ContactFilter` already has `tier`/`subscriptionStatus`/`vehicleSpecialization` typed; Task 1 tightened `numberType`/`state`. If `MalaysianState` is `string`-keyed and `Object.fromEntries` types loosely, the `as Record<MalaysianState,string>` cast handles it.

- [ ] **Step 4: Typecheck** — `pnpm --filter web build` → success.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/components/FilterBuilder.tsx
git commit -m "feat(web): dealer columns in segment FilterBuilder (tier/subscription/spec/numberType/state/city)"
```

---

## Task 4: Dealers bulk-select → "Save as segment"

**Files:**
- Modify: `apps/web/src/pages/Dealers.tsx`

> Depends on Task 1 (enums + `contactIds` on web `ContactFilter`). READ `apps/web/src/components/Toast.tsx` and `apps/web/src/components/ui/Button.tsx` first to confirm the `Toast` props (`message`/`variant`/`onDismiss`) and that `Button` forwards `type`/`disabled` via rest props.

- [ ] **Step 1: Imports + helpers** — in `Dealers.tsx`:
  - Add `useEffect, useCallback` to the `react` import; add `useMutation, useQueryClient` to the `@tanstack/react-query` import.
  - Import `createSegment` from `../api/segments` and `Toast` from `../components/Toast`.
  - Add an `extractMessage` helper (copy the shape used in `Segments.tsx`):
    ```ts
    function extractMessage(e: unknown): string {
      const err = e as { response?: { data?: { message?: string | string[] } } };
      const m = err?.response?.data?.message;
      if (Array.isArray(m)) return m[0] ?? 'Something went wrong';
      return m ?? 'Something went wrong';
    }
    ```

- [ ] **Step 2: Selection + form + toast state** — inside the component:
```ts
  const qc = useQueryClient();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [segName, setSegName] = useState('');
  const [segDesc, setSegDesc] = useState('');
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const showToast = useCallback(
    (message: string, variant: 'success' | 'error' = 'success') => setToast({ message, variant }),
    [],
  );

  // selection is page-scoped: clear whenever the result set changes (filter/page/tab)
  useEffect(() => { setSelected(new Set()); setShowSaveForm(false); }, [queryParams, tab]);
```

- [ ] **Step 3: Selection helpers** — after `data` is available:
```ts
  const pageIds = data?.items.map((c) => c.id) ?? [];
  const allSelected = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  function toggleAll() {
    setSelected(() => (allSelected ? new Set() : new Set(pageIds)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
```

- [ ] **Step 4: Save mutation**:
```ts
  const saveSegMut = useMutation({
    mutationFn: () =>
      createSegment({
        name: segName.trim(),
        description: segDesc.trim() || undefined,
        filter: { contactIds: [...selected] },
      }),
    onSuccess: (seg) => {
      qc.invalidateQueries({ queryKey: ['segments'] });
      showToast(`Segment "${seg.name}" saved with ${selected.size} dealers`);
      setSelected(new Set());
      setShowSaveForm(false);
      setSegName('');
      setSegDesc('');
    },
    onError: (e) => showToast(extractMessage(e), 'error'),
  });
```

- [ ] **Step 5: Selection action bar** — render just above the table's row-count header (inside the `{data && (...)}` block, before the row-count `<div>`):
```tsx
              {selected.size > 0 && (
                <div
                  className="m-3 flex flex-wrap items-center gap-3 rounded-lg border border-accent/40 bg-accent/5 px-4 py-2.5"
                  data-testid="selection-bar"
                >
                  <span className="text-[13px] font-semibold text-foreground">
                    {selected.size} selected
                  </span>
                  {!showSaveForm ? (
                    <>
                      <Button size="sm" onClick={() => setShowSaveForm(true)} data-testid="save-as-segment">
                        Save as segment
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>
                        Clear
                      </Button>
                    </>
                  ) : (
                    <form
                      className="flex flex-wrap items-center gap-2"
                      onSubmit={(e) => { e.preventDefault(); if (segName.trim()) saveSegMut.mutate(); }}
                    >
                      <input
                        autoFocus
                        required
                        value={segName}
                        onChange={(e) => setSegName(e.target.value)}
                        placeholder="Segment name"
                        className="h-8 rounded-md border border-border-strong bg-background px-2 text-[13px] text-foreground outline-none focus:border-accent"
                        data-testid="segment-name-input"
                      />
                      <input
                        value={segDesc}
                        onChange={(e) => setSegDesc(e.target.value)}
                        placeholder="Description (optional)"
                        className="h-8 w-48 rounded-md border border-border-strong bg-background px-2 text-[13px] text-foreground outline-none focus:border-accent"
                      />
                      <Button size="sm" type="submit" disabled={!segName.trim() || saveSegMut.isPending}>
                        {saveSegMut.isPending ? 'Saving…' : 'Save'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => { setShowSaveForm(false); setSegName(''); setSegDesc(''); }}
                      >
                        Cancel
                      </Button>
                    </form>
                  )}
                </div>
              )}
```

- [ ] **Step 6: Checkbox column** — add a leading header cell + per-row cell in the dealers table:
  - In `<thead><tr>`, BEFORE the "Dealership" `<th>`:
    ```tsx
    <th className="w-10 px-4 py-3">
      <input
        type="checkbox"
        aria-label="Select all on page"
        checked={allSelected}
        onChange={toggleAll}
        data-testid="select-all"
      />
    </th>
    ```
  - In each row `<tr>`, BEFORE the Dealership `<td>`:
    ```tsx
    <td className="px-4 py-3.5">
      <input
        type="checkbox"
        aria-label={`Select ${c.name ?? c.phoneE164}`}
        checked={selected.has(c.id)}
        onChange={() => toggleOne(c.id)}
        data-testid={`select-${c.id}`}
      />
    </td>
    ```

- [ ] **Step 7: Render the Toast** — at the very end of the returned JSX (just before the closing `</Page>`):
```tsx
      <Toast
        message={toast?.message ?? null}
        variant={toast?.variant}
        onDismiss={() => setToast(null)}
      />
```
(Confirm prop names against `Toast.tsx`; adapt if its API differs.)

- [ ] **Step 8: Typecheck** — `pnpm --filter web build` → success. Verify no unused-import/var errors.

- [ ] **Step 9: Commit**
```bash
git add apps/web/src/pages/Dealers.tsx
git commit -m "feat(web): bulk-select dealers and save selection as a segment"
```

---

## Task 5: E2E spec (run deferred)

**Files:**
- Create: `e2e/tests/dealers-segment.spec.ts`

> Run is DEFERRED (no Postgres/servers/browsers). Mirror `e2e/tests/blasts.spec.ts` (`loginAsAdmin`). Do NOT run `pnpm --filter e2e test`.

- [ ] **Step 1: Inspect** `e2e/tests/blasts.spec.ts` (copy its `loginAsAdmin` verbatim — constants + testids + post-login URL), and confirm how `/segments` and `/contacts` are reached (nav link names / routes). Confirm the new testids exist: `filter-tier-GOLD` (FilterBuilder tier chip), `select-all`, `select-<id>`, `selection-bar`, `save-as-segment`, `segment-name-input`.

- [ ] **Step 2: Create `e2e/tests/dealers-segment.spec.ts`** (adapt selectors to the real login helper / nav):
```ts
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Dealer segment targeting', () => {
  test('segment builder shows dealer columns', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Segments' }).click();
    await expect(page).toHaveURL(/\/segments$/);
    await expect(page.getByTestId('filter-tier-GOLD')).toBeVisible();
  });

  test('selecting dealers and saving as a segment shows a result toast', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Dealers' }).click();
    await expect(page).toHaveURL(/\/contacts$/);

    // select all on the page, open the save form, name it, save
    await page.getByTestId('select-all').check();
    await expect(page.getByTestId('selection-bar')).toBeVisible();
    await page.getByTestId('save-as-segment').click();
    await page.getByTestId('segment-name-input').fill('E2E picked dealers');
    await page.getByRole('button', { name: /^save$/i }).click();

    await expect(page.getByText(/saved with \d+ dealers/i)).toBeVisible();
  });
});
```
> Adapt the nav link names/routes if the sidebar differs (Dealers is mounted at `/contacts`; Segments at `/segments`). Keep the two assertions: a dealer chip in the builder, and the save-as-segment result toast.

- [ ] **Step 3: Commit**
```bash
git add e2e/tests/dealers-segment.spec.ts
git commit -m "test(e2e): dealer segment targeting — builder columns + save-selection-as-segment (run deferred)"
```

---

## Final verification

- [ ] `pnpm --filter api test` — green (existing + new `filter-to-where` contactIds cases).
- [ ] `pnpm --filter api build` + `pnpm --filter web build` — compile.
- [ ] Live (deferred — needs Postgres + servers): on `/segments` the builder shows dealer chips and creating a rule segment works; on `/contacts` dealer filters (tier/spec) now return rows and the specialization column labels correctly; selecting dealers → "Save as segment" → toast; the new segment appears and can be Used in a blast; `pnpm --filter e2e test -- dealers-segment`.

---

## Self-review notes (author)

- **Spec coverage:** §3.1 enum fix → Task 1; §3.3 `contactIds` → Task 2; §3.2 builder columns → Task 3; §3.4 bulk-select→segment → Task 4; §5 e2e → Task 5. Deferred items (membership model, filter-as-segment, dealer bulk *mutations*) untouched.
- **Type consistency:** web `DealerTier|SubscriptionStatus|VehicleSpecialization|NumberType` (Task 1) ↔ FilterBuilder option/label maps (Task 3) ↔ Prisma enums; web `ContactFilter.contactIds` (Task 1) ↔ backend `ContactFilter.contactIds` (Task 2) ↔ `createSegment({ filter: { contactIds } })` (Task 4). `filterToWhere` `contactIds → id IN` is the same field name end-to-end.
- **Sequencing/atomicity:** Task 1 is the foundation (retype is breaking; build is the backstop). Task 2 is backend-independent (full API suite gate). Tasks 3–4 build on Task 1's enums; Task 4 is the largest UI piece, last. Each task ends green.
- **No placeholders:** complete code per step; the only deferral (live DB/e2e) is explicit/environmental.
- **No new endpoint/model/migration:** `contactIds` rides the freeform segment `filter` and the shared `filterToWhere`; blasts resolve it automatically.
