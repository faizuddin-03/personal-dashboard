# Campaigns Quick Wins — Replied-KPI Fix + Real Progress + Status Filter — Design Spec

**Date:** 2026-06-07
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft — awaiting spec review
**Context:** Hackathon. eAuto dealer + AI console (`apps/web`). Slice A of the remaining-work roadmap (after Analytics #16, Per-recipient #17, Inbox agent-assist #18).

---

## 1. Purpose

Three small, high-confidence cleanups in the Campaigns area, all **frontend-only** (no API or DB changes):

1. **Fix a live bug:** the campaign detail "Replied" KPI + funnel always show **0**. `CampaignDetail.tsx` reads `counts.REPLIED`, but the API returns the reply count as a **top-level `replied` field** (`blasts.service.ts:59-69`) that the web `BlastStats` type omits.
2. **Real RUNNING progress bar:** the campaign list hardcodes `<Progress value={50} />` for every RUNNING campaign (`Campaigns.tsx:115`).
3. **Status filter:** the list never uses the status filter that both `listBlasts(status?)` and the backend `GET /blasts?status[]` already support.

### Decisions taken into this spec (from brainstorming)

- **Frontend-only.** No backend change — every needed endpoint/field already exists.
- **Progress bar = per-card stats fetch**, gated to RUNNING rows (usually few), polling while sending. Progress = `(totalRecipients − QUEUED) / totalRecipients`.
- **Date picker deferred** — the wizard keeps the working native `<input type="datetime-local">`; building the design's custom `SchedulePicker` is out of scope for a quick-wins slice.

---

## 2. Scope

### In scope
1. Add `replied: number` to the `BlastStats` type and read `stats.replied` in `CampaignDetail`.
2. Real RUNNING progress bar in `Campaigns.tsx` via a per-RUNNING-card `getBlastStats` query.
3. Status-filter chips on the campaigns list, re-keying the list query.
4. A Playwright spec for the filter + the (now-real) Replied counter (run deferred).

### Out of scope (deferred)
- Custom `SchedulePicker` / any wizard date-picker change.
- The campaign row ⋯ menu (pause/resume/duplicate/rename/archive/delete) — a separate, backend-heavy item.
- Any backend change.

---

## 3. Architecture

All changes are in three frontend files.

### 3.1 Replied-KPI fix
- `apps/web/src/api/blasts.ts` — `BlastStats` gains `replied: number`:
  ```ts
  export interface BlastStats {
    id: string;
    status: BlastStatus;
    totalRecipients: number;
    counts: Record<MessageStatus, number>;
    replied: number;        // ← added; API already returns it
    startedAt: string | null;
    completedAt: string | null;
  }
  ```
- `apps/web/src/pages/CampaignDetail.tsx` — replace the `counts.REPLIED` read with `stats.replied`:
  ```ts
  const repliedCount = stats.replied ?? 0;
  ```
  The KPI card (`counter-replied`) and the funnel's "Replied" row already consume `repliedCount`, so both become correct with no further change. Remove the now-stale `// API doesn't expose a REPLIED bucket` comment.

### 3.2 Real RUNNING progress bar
- `apps/web/src/pages/Campaigns.tsx` — import `getBlastStats`. In `CampaignCard`, add:
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
  Replace `<Progress value={50} />` with `<Progress value={progressPct} />`. (Hook runs unconditionally at the top of `CampaignCard`; `enabled` gates the actual fetch so non-RUNNING rows make no request.)

### 3.3 Status filter
- `apps/web/src/pages/Campaigns.tsx` — add filter state + chips; re-key the list query:
  ```ts
  const [statusFilter, setStatusFilter] = useState<BlastStatus | 'ALL'>('ALL');
  const { data, isLoading, error } = useQuery({
    queryKey: ['blasts', statusFilter],
    queryFn: () => listBlasts(statusFilter === 'ALL' ? undefined : [statusFilter]),
  });
  ```
  Render a chip row (reusing `STATUS_CFG` labels) above the list: `All`, `Scheduled`, `Running`, `Completed`, `Failed`, `Canceled`, `Draft`. The active chip drives `statusFilter`. Empty filtered result shows a short "No campaigns match this filter." message (distinct from the existing zero-campaigns `Empty`).

---

## 4. Data flow
- Detail page: `getBlast` + `getBlastStats` (existing queries) → `stats.replied` now populates the Replied KPI/funnel.
- List page: `listBlasts([status?])` re-keyed by the filter chip; each RUNNING card independently fetches `getBlastStats` (5s poll) for its progress bar.

## 5. Error / empty / loading
- Progress: `stats` undefined (loading or non-RUNNING) → `progressPct = 0`; divide-by-zero guarded by `totalRecipients > 0`.
- Filter: a filter with no matches renders a friendly empty line; the all-zero-campaigns case keeps the existing `Empty` CTA.
- No new failure modes (no new endpoints). Existing list `error` handling unchanged.

## 6. Testing strategy
- **Typecheck/build:** `pnpm --filter web build` must pass (adding `replied` to `BlastStats` + the new query/types).
- **E2E** (`e2e/tests/campaigns-filter.spec.ts`, Playwright; run **deferred** — needs Postgres + dev servers): the campaigns list renders a status-filter control; clicking a filter chip keeps the list functional; (optionally) a completed campaign's detail shows a non-"0"-typed Replied counter testid. Local `loginAsAdmin` convention.
- No backend unit tests (no backend change); the codebase has no frontend component unit tests.

## 7. File-by-file change list
**Web (edit):**
- `apps/web/src/api/blasts.ts` — `replied: number` on `BlastStats`.
- `apps/web/src/pages/CampaignDetail.tsx` — read `stats.replied`; drop the stale comment.
- `apps/web/src/pages/Campaigns.tsx` — status-filter state + chips; per-RUNNING-card `getBlastStats` progress.
**E2E (new):**
- `e2e/tests/campaigns-filter.spec.ts`.

## 8. Sequencing (for the implementation plan)
1. `BlastStats.replied` + `CampaignDetail` read (the bug fix) — smallest, highest value.
2. Status filter chips + re-keyed list query.
3. Real RUNNING progress bar (per-card stats).
4. E2E spec.

(1–3 are independent; order is by value. Each ends with a `pnpm --filter web build`.)

## 9. Open questions / risks
1. **Per-card stats requests:** one `getBlastStats` request per RUNNING card. RUNNING blasts are typically 0–few; acceptable. If many RUNNING campaigns ever coexist, a list-level aggregate endpoint would be the upgrade (not now).
2. **Progress semantics:** "processed = total − QUEUED" counts SENT/DELIVERED/READ/FAILED/CANCELED as done. That's the right "how far through sending" meaning for a progress bar (failures are processed, just unsuccessfully).
3. **Filter chip set:** all six `BlastStatus` values + All. DRAFT campaigns are rare (the wizard creates SCHEDULED), but the chip is harmless.
