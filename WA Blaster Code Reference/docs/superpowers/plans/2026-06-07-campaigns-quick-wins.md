# Campaigns Quick Wins Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the always-0 "Replied" KPI, give RUNNING campaigns a real progress bar, and add a status filter to the campaigns list — all frontend-only.

**Architecture:** Three small edits to `apps/web` (no API/DB change): add the already-returned `replied` field to the `BlastStats` type and read it in `CampaignDetail`; add a status-filter chip row + re-keyed list query in `Campaigns`; and a per-RUNNING-card `getBlastStats` query driving a real progress bar. Plus a deferred Playwright spec.

**Tech Stack:** Vite + React + TS, @tanstack/react-query v5, Playwright (e2e). No backend changes.

---

## Conventions (read once)

- **Frontend-only slice.** No backend, no new endpoints. The campaigns list route is `/blasts` (App.tsx maps `/blasts` → `Campaigns`); the nav link is labelled "Campaigns".
- The codebase has **no frontend component unit tests** — each task is verified by `pnpm --filter web build` (tsc typecheck + vite). Task 4 adds a Playwright spec whose **run is deferred** (needs Postgres + dev servers).
- `BlastStats` (web) is in `apps/web/src/api/blasts.ts`; the API (`blasts.service.ts:stats`) already returns a top-level `replied: number` — the type just omits it.
- `MessageStatus` stays imported in `CampaignDetail.tsx` (used by the recipients table at lines ~38/47/216) — removing the Replied cast does NOT orphan it.
- Branch: `feat/campaigns-quick-wins` (already created from master). Do NOT run `git checkout`/`switch`/`branch` — only `git add` + `git commit`.

---

## Task 1: Replied-KPI fix

**Files:**
- Modify: `apps/web/src/api/blasts.ts`
- Modify: `apps/web/src/pages/CampaignDetail.tsx`

- [ ] **Step 1: Add `replied` to the `BlastStats` interface** in `apps/web/src/api/blasts.ts`. Change:
```ts
export interface BlastStats {
  id: string;
  status: BlastStatus;
  totalRecipients: number;
  counts: Record<MessageStatus, number>;
  startedAt: string | null;
  completedAt: string | null;
}
```
to:
```ts
export interface BlastStats {
  id: string;
  status: BlastStatus;
  totalRecipients: number;
  counts: Record<MessageStatus, number>;
  replied: number;
  startedAt: string | null;
  completedAt: string | null;
}
```

- [ ] **Step 2: Read `stats.replied` in `CampaignDetail.tsx`.** Replace these two lines (~269-270):
```ts
  // API doesn't expose a REPLIED bucket — show 0 gracefully
  const repliedCount   = (counts as Record<MessageStatus | 'REPLIED', number>).REPLIED ?? 0;
```
with:
```ts
  const repliedCount   = stats.replied ?? 0;
```
(The funnel row and the `counter-replied` KPI already consume `repliedCount`, so both now show the real reply count. Do NOT remove the `MessageStatus` import — it's still used by the recipients table elsewhere in the file.)

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter web build`
Expected: success (the `stats.replied` read now typechecks against the extended `BlastStats`).

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/api/blasts.ts apps/web/src/pages/CampaignDetail.tsx
git commit -m "fix(web): campaign 'Replied' KPI read top-level stats.replied (was always 0)"
```

---

## Task 2: Status filter on the campaigns list

**Files:**
- Modify: `apps/web/src/pages/Campaigns.tsx`

- [ ] **Step 1: Add `useState` to the React import** — change line 1:
```ts
import type { ReactElement } from 'react';
```
to:
```ts
import { useState, type ReactElement } from 'react';
```

- [ ] **Step 2: Add filter state + re-key the list query** — in the `Campaigns` component, replace:
```ts
  const { data, isLoading, error } = useQuery({
    queryKey: ['blasts'],
    queryFn: () => listBlasts(),
  });
```
with:
```ts
  const [statusFilter, setStatusFilter] = useState<BlastStatus | 'ALL'>('ALL');
  const { data, isLoading, error } = useQuery({
    queryKey: ['blasts', statusFilter],
    queryFn: () => listBlasts(statusFilter === 'ALL' ? undefined : [statusFilter]),
  });
```

- [ ] **Step 3: Render the filter chips** — directly after the `<PageHead … />` block and before the `{isLoading && …}` line, add:
```tsx
      <div data-testid="status-filter" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {(['ALL', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELED', 'DRAFT'] as const).map((s) => {
          const active = statusFilter === s;
          const label = s === 'ALL' ? 'All' : (STATUS_CFG[s]?.label ?? s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '4px 12px', borderRadius: 999, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'var(--accent-fill)' : 'var(--bg)',
                color: active ? 'var(--accent-text)' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>
```
(In the non-`'ALL'` branch TypeScript narrows `s` to `BlastStatus`, so `STATUS_CFG[s]` — a `Partial<Record<BlastStatus, …>>` — typechecks; `?? s` covers any unmapped status.)

- [ ] **Step 4: Handle the filtered-empty case** — replace the existing zero-state block:
```tsx
      {data && data.length === 0 && (
        <Empty
          icon={<IcSend size={20} />}
          title="No campaigns yet"
          body="Create your first campaign to start sending outbound WhatsApp messages."
          cta={
            <Link to="/blasts/new">
              <Button variant="primary" icon={<IcPlus size={14} />}>New campaign</Button>
            </Link>
          }
        />
      )}
```
with (only show the create-CTA Empty when the unfiltered list is truly empty; otherwise a short no-match line):
```tsx
      {data && data.length === 0 && statusFilter === 'ALL' && (
        <Empty
          icon={<IcSend size={20} />}
          title="No campaigns yet"
          body="Create your first campaign to start sending outbound WhatsApp messages."
          cta={
            <Link to="/blasts/new">
              <Button variant="primary" icon={<IcPlus size={14} />}>New campaign</Button>
            </Link>
          }
        />
      )}
      {data && data.length === 0 && statusFilter !== 'ALL' && (
        <p className="text-sm text-foreground-muted">No campaigns match this filter.</p>
      )}
```

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter web build`
Expected: success.

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/pages/Campaigns.tsx
git commit -m "feat(web): status filter on the campaigns list"
```

---

## Task 3: Real RUNNING progress bar

**Files:**
- Modify: `apps/web/src/pages/Campaigns.tsx`

- [ ] **Step 1: Import `getBlastStats`** — change the blasts-api import:
```ts
import { listBlasts, type Blast, type BlastStatus } from '../api/blasts';
```
to:
```ts
import { listBlasts, getBlastStats, type Blast, type BlastStatus } from '../api/blasts';
```

- [ ] **Step 2: Fetch per-RUNNING-card stats + compute progress** — in the `CampaignCard` component, after `const cfg = getStatusCfg(blast.status);`, add:
```ts
  const { data: stats } = useQuery({
    queryKey: ['blast-stats', blast.id],
    queryFn: () => getBlastStats(blast.id),
    enabled: blast.status === 'RUNNING',
    refetchInterval: blast.status === 'RUNNING' ? 5000 : false,
  });
  const progressPct = stats && stats.totalRecipients > 0
    ? Math.round(((stats.totalRecipients - (stats.counts.QUEUED ?? 0)) / stats.totalRecipients) * 100)
    : 0;
```
(`useQuery` is already imported in this file. The `enabled` gate means non-RUNNING cards make no request.)

- [ ] **Step 3: Use the real value in the progress bar** — replace:
```tsx
      {hasProgress && (
        <div style={{ marginTop: 2 }}>
          <Progress value={50} />
        </div>
      )}
```
with:
```tsx
      {hasProgress && (
        <div style={{ marginTop: 2 }}>
          <Progress value={progressPct} />
        </div>
      )}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter web build`
Expected: success.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/pages/Campaigns.tsx
git commit -m "feat(web): real RUNNING progress bar from per-campaign stats (was hardcoded 50%)"
```

---

## Task 4: E2E spec (run deferred)

**Files:**
- Create: `e2e/tests/campaigns-filter.spec.ts`

> Run is DEFERRED (no Postgres/servers/browsers). Mirror `e2e/tests/blasts.spec.ts` (local `loginAsAdmin`, no shared import). Do NOT run `pnpm --filter e2e test`.

- [ ] **Step 1: Inspect `e2e/tests/blasts.spec.ts`** for the login helper and how it reaches the Campaigns list (clicks the `Campaigns` nav link; the list is at `/blasts`).

- [ ] **Step 2: Create `e2e/tests/campaigns-filter.spec.ts`**
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

test.describe('Campaigns status filter', () => {
  test('list has a status filter that stays functional when clicked', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();
    await expect(page).toHaveURL(/\/blasts$/);

    await expect(page.getByTestId('status-filter')).toBeVisible();
    // Filtering by a status keeps the page functional (rows OR the no-match line).
    await page.getByTestId('status-filter').getByRole('button', { name: 'Running' }).click();
    await expect(page.getByRole('heading', { name: 'Campaigns' })).toBeVisible();
  });
});
```
> If the Campaigns nav/route differs from what `blasts.spec.ts` uses, adapt the navigation + URL assertion to match; keep the `status-filter` testid assertion.

- [ ] **Step 3: Commit**
```bash
git add e2e/tests/campaigns-filter.spec.ts
git commit -m "test(e2e): campaigns status filter (run deferred)"
```

---

## Final verification

- [ ] `pnpm --filter web build` — clean.
- [ ] `pnpm --filter api test` — still green (no backend change, but confirm nothing was disturbed): expect the existing suite to pass unchanged.
- [ ] Live verification (deferred — needs Postgres + servers): open a COMPLETED campaign with replies → "Replied" shows a real non-zero count; a RUNNING campaign's card shows a real progress %; the status filter narrows the list; `pnpm --filter e2e test -- campaigns-filter`.

---

## Self-review notes (author)

- **Spec coverage:** §3.1 Replied fix → Task 1; §3.3 status filter → Task 2; §3.2 progress bar → Task 3; §6 e2e → Task 4. Date picker correctly NOT touched (deferred). No backend change, as specified.
- **Type consistency:** `BlastStats.replied: number` (Task 1) is what `CampaignDetail` reads (Task 1) and what the RUNNING progress bar's `getBlastStats` returns (Task 3, via the same `BlastStats` type — `counts.QUEUED` is a `MessageStatus` key, present). `statusFilter: BlastStatus | 'ALL'` (Task 2) is passed to `listBlasts(status?: BlastStatus[])` as `[statusFilter]` only in the non-ALL branch. The progress query key `['blast-stats', id]` matches the one `CampaignDetail` already uses — harmless cache sharing.
- **No placeholders:** every step shows the exact before/after code; the only deferral (e2e run + live check) is explicit and environmental.
- **Frontend-only / no unit tests:** consistent with the codebase (no component test framework); verification is typecheck + deferred e2e, stated up front.
