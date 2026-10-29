# Real Analytics — Performance + Dashboard Data Layer — Design Spec

**Date:** 2026-06-07
**Author:** Soon Zhen Yang (with Claude)
**Status:** Draft — awaiting spec review
**Context:** Hackathon (days). eAuto dealer + AI console (`apps/web` + `apps/api`).
**Builds on:** `2026-06-04-eauto-dealer-ai-pivot-design.md` (line 44: "Performance analytics — real aggregation where cheap; seeded where not"). This spec delivers that line.

---

## 1. Purpose

`Performance.tsx` and `Dashboard.tsx` render a full analytics surface, but **every chart is fed from hardcoded `SEED_*` constants** ported from `docs/design/data.jsx`. There is no analytics/metrics endpoint anywhere in the API. The screens even self-label their fakeness (`demo` KPI badges, a `(demo data)` Top-intents sub-label, and a footnote on Performance).

This was the #1-ranked remaining gap. This spec replaces the seed constants with **real aggregation over data that already exists** in Prisma (`Message`, `AutopilotEvent`, `Ticket`, `Contact`), plus a **demo-data generator** so those aggregations return realistic curves on a fresh database — because without historical rows, real endpoints render empty.

### Decisions taken into this spec (from brainstorming)

- **Goal:** *Hybrid* — real aggregation where the data already exists (the common case here); estimate/keep-seeded only where there is genuinely no data source (cost).
- **Start here:** This is the first slice; analytics is the only hard dependency in the broader roadmap (endpoints must precede chart-wiring), so endpoints + wiring ship together as one coherent feature.
- **LLM stays mock** — out of scope for this slice; autopilot events carry `model = 'mock'`, which is fine for counting.
- **Demo data:** Build a **time-distributed demo-data generator** so charts populate now, **and** graceful empty/loading states for the zero-data case.
- **Cost today:** No cost column exists. Compute an **estimate** = delivered messages × a configurable per-message rate stored in `SystemSetting`, labelled "est.".
- **Deferred (net-new features, not "make seed data real"):** Export-report, Compare-periods, chart drill-down/click-through.

---

## 2. Scope

### In scope

1. **Analytics API module** (`apps/api/src/analytics/`) — `JwtAuthGuard`-protected aggregation endpoints over existing columns, date-range aware.
2. **Demo-data generator** — idempotent seed of ~90 days of historical `Message`, `AutopilotEvent`, and `Ticket` rows (plus a few extra `Template` + completed `Blast` rows so "top templates" is interesting), distributed across the existing 12 dealers, producing realistic funnels/trends.
3. **Frontend wiring** — replace `SEED_*` on `Performance.tsx` + `Dashboard.tsx` with `react-query` calls against a new `apps/web/src/api/analytics.ts`; wire the dead `7d/30d/90d` range chips; fix the Dashboard donut `78%` literal to use the live value; remove `demo` badges + the footnote; add loading + empty states.
4. **Tests** — API aggregation unit/integration tests (Jest), and Playwright e2e asserting charts render real values after the generator runs.

### Out of scope (deferred)

- **Export report** (Performance button) — net-new export feature; remains inert (or hidden) this slice.
- **Compare periods** — net-new view; not built.
- **Chart drill-down / click-through** — charts stay display-only (SVG `<title>` tooltips remain).
- **Real LLM** — autopilot stays mock.
- Any change to the live, already-real surfaces (Dashboard "Needs your attention", "AI activity", "Active campaigns"; Performance escalation opened/closed counts) beyond pointing them at the new endpoint where it improves them.

---

## 3. Architecture

Three units, each independently understandable and testable:

```
┌─────────────────────────────┐     ┌──────────────────────────────┐
│ Demo-data generator         │     │ Analytics module (API)        │
│ prisma/seed-analytics.ts    │────▶│ analytics.controller.ts       │
│ writes Message/Event/Ticket │ DB  │ analytics.service.ts          │
│ rows spread over ~90 days   │     │ groupBy + count + raw SQL     │
└─────────────────────────────┘     └───────────────┬──────────────┘
                                                     │ JSON over /analytics/*
                                     ┌───────────────▼──────────────┐
                                     │ Frontend                      │
                                     │ api/analytics.ts (client)     │
                                     │ Performance.tsx, Dashboard.tsx│
                                     │ react-query, range state      │
                                     └───────────────────────────────┘
```

### 3.1 Backend — Analytics module

New NestJS module mirroring the existing convention (`autopilot.module.ts`): controller + service, `@UseGuards(JwtAuthGuard)`, imports `AuthModule` only (`PrismaService` is `@Global`). Registered in `app.module.ts`.

**Query strategy:**
- **Categorical counts** (status, intent, reason, state, vehicle) → Prisma `groupBy` + `_count`, exactly like `BlastsService.stats` (`blasts.service.ts:49-72`).
- **Time-bucketed series** (daily trends, volume-by-day, response-time-by-day) → `prisma.$queryRaw` with Postgres `date_trunc('day', <ts>)` + `generate_series` to fill empty days with zero. Raw SQL is already an established pattern (`inbox.service.ts`).
- **Cross-entity joins** (delivery-rate by dealer state/vehicle) → `prisma.$queryRaw` joining `messages.contact_id = contacts.id`. **No Prisma relation `Message→Contact` exists**, so this *must* be raw SQL (or a two-step fetch-then-group; raw SQL preferred).

**Date-range convention:** every range-aware endpoint accepts `?range=7d|30d|90d` (validated by a DTO with an enum default `30d`). The service maps it to `since = now − N days`. Deltas (where a chart shows "▲ x%") compare the current window to the immediately preceding equal-length window.

**Endpoints (6), all `GET /analytics/*`, JWT-guarded:**

| Endpoint | Range? | Backs | Source |
|----------|:--:|-------|--------|
| `/analytics/kpis` | ✅ | Dashboard KPI strip (Sent today, Delivery rate, Read rate, Cost today) + sparklines; Performance KPI strip (Delivered, Delivery rate, Avg reply rate, Auto-handle rate) + deltas | `Message` counts; cost = delivered × rate |
| `/analytics/delivery` | ✅ | Performance: Delivery funnel; Delivery-by-state; Delivery-by-vehicle; Top templates by reply rate | `Message` groupBy status; raw-SQL joins to `Contact`; groupBy `templateId` |
| `/analytics/volume` | ✅ (def 7d) | Dashboard: Message volume (sent/delivered/replied by day) | raw SQL `date_trunc` over `Message.sentAt` |
| `/analytics/autopilot` | ✅ | Dashboard: Reply-handling donut, Top intents; Performance: Auto-handle rate trend + headline | `AutopilotEvent` groupBy action/intent; raw-SQL daily trend |
| `/analytics/escalation` | ✅ | Performance: Escalation rate/delta/trend, closed-by-reason, opened/closed/open, avg-time-to-close, Human response time by day | `Ticket` counts/groupBy; raw-SQL daily trend + avg `(closedAt−openedAt)`, `(assignedAt−openedAt)` |
| `/analytics/audience` | — | Performance: Dealers by state, Specialization mix donut | `Contact` groupBy `state` / `vehicleSpecialization` (current dealer base, no range) |

**Representative response shapes** (finalized in the plan; illustrative):

```ts
// GET /analytics/kpis?range=30d
{
  delivered:   { value: number; deltaPct: number; spark: number[] }, // last 12 buckets
  deliveryRate:{ value: number; deltaPct: number; spark: number[] },
  readRate:    { value: number; deltaPct: number; spark: number[] },
  replyRate:   { value: number; deltaPct: number },
  autoHandleRate:{ value: number; deltaPct: number },
  sentToday:   { value: number; deltaPct: number; spark: number[] },
  costToday:   { value: number; deltaPct: number; spark: number[]; estimated: true },
}

// GET /analytics/delivery?range=30d
{
  funnel: { sent: number; delivered: number; read: number; replied: number },
  byState:   Array<{ state: MalaysianState; rate: number }>,   // sorted desc
  byVehicle: Array<{ vehicle: VehicleSpecialization; rate: number }>,
  topTemplates: Array<{ templateId: string; name: string; language: string; sent: number; replied: number; replyRate: number }>,
}

// GET /analytics/autopilot?range=30d
{
  autoHandleRate: number,
  trend: Array<{ date: string; rate: number }>,                 // daily, zero-filled
  handling: { autoReplied: number; escalated: number; resolvedByTeam: number },
  topIntents: Array<{ intent: string; count: number }>,
}

// GET /analytics/escalation?range=30d
{
  rate: number; deltaPct: number;
  opened: number; closed: number; openRemaining: number; avgCloseMs: number | null;
  trend: Array<{ date: string; rate: number }>,
  byReason: Array<{ reason: EscalationReason; count: number }>,
  responseTimeByDay: Array<{ date: string; avgMinutes: number | null }>,
}

// GET /analytics/audience
{
  byState:   Array<{ state: MalaysianState; count: number }>,
  byVehicle: Array<{ vehicle: VehicleSpecialization; count: number }>,
}
```

**Enum→label mapping** stays on the **frontend** (the API returns raw enums; the UI already owns display formatting). e.g. `KUALA_LUMPUR → "Kuala Lumpur"`, `EV_HYBRID → "EV/Hybrid"`, intent slugs → title-case.

**Cost rate:** new `SystemSetting` key `cost_per_message_rm` (default e.g. `0.08`); `costToday = deliveredToday × rate`. Surfaced with an "est." marker so it is never mistaken for billed cost.

### 3.2 Demo-data generator

New script `apps/api/prisma/seed-analytics.ts`, runnable via a `pnpm db:seed:analytics` script (and optionally invoked from the main seed behind a flag). **Deterministic** (seeded PRNG — a small local LCG, no `Math.random`) so runs are reproducible; **idempotent** (guard: skip if `Message` count > 0, or tag generated `Blast` rows by name prefix and skip if present).

Generates, spread across the last **90 days**, across the existing 12 dealers:

- **Extra templates + completed blasts:** ~5 APPROVED templates (EN/MS) and several `COMPLETED` `Blast` rows so "Top templates by reply rate" has multiple rows to rank.
- **`Message` rows:** per blast/day, statuses distributed to a realistic funnel (~96% delivered, ~68% read of delivered, ~26% replied of delivered), with `sentAt/deliveredAt/readAt/repliedAt` timestamps on the bucket day, `templateId` set, `contactId` spread across dealers, a gentle upward weekly volume trend, and weekend dips (matches the design's `SEED_WEEK` shape).
- **`AutopilotEvent` rows:** ~78% `AUTO_REPLIED`, ~17% `ESCALATED`, rest `OPTED_OUT/SKIPPED`; `intent` drawn from the design's intent set (`transfer_support`, `credit_topup`, `roadtax_insurance`, `subscription`, `vehicle_history`, `feature_howto`); `confidence` plausible; `createdAt` spread daily with a slowly rising auto-handle ratio (so the 14-day trend climbs, matching `SEED_AUTO_TREND`).
- **`Ticket` rows:** mix of `OPEN/IN_PROGRESS/RESOLVED/CLOSED` with `openedAt/assignedAt/resolvedAt/closedAt` spread across days; reasons distributed (`KNOWLEDGE_GAP` highest, then `COMPLAINT`, `LOW_CONFIDENCE`, `SENSITIVE` — matching the design's by-reason order); `assignedAt−openedAt` gaps mostly under the 15-min target with a few over, so response-time bars and avg-close populate. The 3 existing open seed tickets are preserved.

The generator’s targets are tuned so the **real** endpoints return curves close to the original design seed — i.e. the demo looks the same, but every number is now computed from rows.

### 3.3 Frontend wiring

`apps/web/src/api/analytics.ts` — six typed client functions mirroring `api/autopilot.ts` (axios `api.get`, typed return).

`Performance.tsx`:
- Lift `range` into the query keys; each card uses `useQuery(['analytics', <domain>, range], ...)`.
- Replace every `SEED_*` with mapped endpoint data, reusing the existing chart components (`LineChart`, `BarChart`, `HBar`, `DonutChart`, `Funnel`, `DBar`, `MiniStat`) unchanged — only their `data` props change.
- KPI strip deltas from `/analytics/kpis`. Escalation section fully from `/analytics/escalation` (replacing the partial real/seed mix at `Performance.tsx:399-405`).
- Remove the seed footnote (`:622-624`).

`Dashboard.tsx`:
- KPI strip from `/analytics/kpis` (drop the `seedNote`/`demo` badge).
- Message volume from `/analytics/volume`; reply-handling donut from `/analytics/autopilot.handling` with `centerLabel` = live `autoHandleRate` (fixes the hardcoded `78%` at `:463`); Top intents from `/analytics/autopilot.topIntents` (drop `(demo data)` label).
- Replace the client-side `autoRatePct` fallback calc (`:310-315`) with the endpoint value; hero "Avg. reply 22s" sourced from `/analytics/kpis` (or dropped if not derivable cheaply — see open questions).

**Loading & empty states:** each card shows a lightweight "Loading…" while fetching and a friendly "No data yet" when its array/total is empty (consistent with existing patterns in `Dashboard.tsx`). No layout shift; charts that receive empty arrays render their axes/empty frame, not a crash.

---

## 4. Data flow

1. `pnpm db:seed && pnpm db:seed:analytics` populates dealers (existing) + historical messages/events/tickets (new).
2. User opens Performance/Dashboard → react-query fires `GET /analytics/*?range=…`.
3. `AnalyticsService` runs `groupBy`/`count`/`$queryRaw` over Postgres, maps to the response shapes, returns JSON.
4. Components map enums→labels and feed existing chart components.
5. Changing a range chip re-keys the query → refetch.

---

## 5. Error / empty / loading handling

- **Auth:** endpoints behind `JwtAuthGuard`; the axios client already handles 401→refresh.
- **Empty data:** services always return zero-filled arrays/zeros (never `null` arrays); the UI shows "No data yet" per card. The page never errors on an empty DB.
- **Query failure:** react-query `isError` → a small inline "Couldn't load" with the card frame intact (no white screen).
- **Range validation:** invalid `range` → DTO rejects with 400; UI only ever sends the three valid chips.

---

## 6. Testing strategy

- **API unit/integration** (`apps/api/src/analytics/__tests__/`, Jest, following each module's `__tests__` convention): seed a known fixture set in a test DB/transaction, assert each endpoint's aggregation (funnel counts, daily-trend zero-fill, delivery-rate-by-state math, escalation rate/avg-close, top-intents ordering, cost = delivered×rate). Date-range boundary tests (a row just inside/outside the window).
- **Generator test:** running `seed-analytics` twice is idempotent (no duplicate rows); produced data yields non-empty results from every endpoint.
- **E2E** (`e2e/tests/performance.spec.ts`, `dashboard.spec.ts`, Playwright; follow existing specs): after seeding, the Performance KPI strip + funnel + escalation render numeric (non-zero) values and **no** `demo`/`(demo data)`/footnote text remains; the range chips change values; Dashboard donut center shows the live auto-handle %. Preserve the existing `dashboard-title` testid behaviour.

---

## 7. File-by-file change list

**API (new):**
- `apps/api/src/analytics/analytics.module.ts`
- `apps/api/src/analytics/analytics.controller.ts`
- `apps/api/src/analytics/analytics.service.ts`
- `apps/api/src/analytics/dto/range.dto.ts`
- `apps/api/src/analytics/__tests__/analytics.service.spec.ts`
- `apps/api/prisma/seed-analytics.ts`

**API (edit):**
- `apps/api/src/app.module.ts` — register `AnalyticsModule`.
- `apps/api/package.json` — `db:seed:analytics` script (+ root `package.json` passthrough if used).
- `apps/api/prisma/seed.ts` — seed default `cost_per_message_rm` setting (alongside existing system-setting seeds).

**Web (new):**
- `apps/web/src/api/analytics.ts`

**Web (edit):**
- `apps/web/src/pages/Performance.tsx` — replace `SEED_*` with queries; wire `range`; remove footnote.
- `apps/web/src/pages/Dashboard.tsx` — replace `SEED_KPIS/SEED_WEEK/SEED_HANDLING/SEED_TOP_INTENTS`; fix donut label; drop `demo` badges; source auto-handle from endpoint.

**E2E (new):**
- `e2e/tests/performance.spec.ts`, `e2e/tests/dashboard.spec.ts`.

**Docs:**
- `README.md` — note the `db:seed:analytics` step.

---

## 8. Sequencing (for the implementation plan)

1. **Range DTO + module skeleton** registered and returning stub `/analytics/audience` (cheapest, already has data) → proves the wiring end-to-end against the live dealer base.
2. **Demo-data generator** → so every subsequent endpoint has data to aggregate and to eyeball.
3. **Remaining endpoints** (`delivery`, `volume`, `autopilot`, `escalation`, `kpis`) with unit tests, one domain at a time.
4. **Frontend client** (`api/analytics.ts`).
5. **Wire Performance**, then **Dashboard** (per-card swap, keeping components intact).
6. **E2E specs** + README note.

Audience-first (step 1) de-risks the module/auth wiring against data that already exists; the generator (step 2) unblocks visual verification of everything after.

---

## 9. Open questions / risks

1. **"Avg. reply 22s" (Dashboard hero) & sparkline windows** — reply *latency* (inbound→auto-reply time) isn't directly stored; `AutopilotEvent.createdAt` vs the triggering inbound time is the closest proxy. If not cheaply derivable, drop the hero stat or show a coarse proxy. *Proposed: derive from `AutopilotEvent.createdAt − InboundMessage.receivedAt` where linkable; else omit.*
2. **Raw-SQL portability** — `date_trunc`/`generate_series` are Postgres-specific (fine; the stack is Postgres). Tests must run against Postgres, not SQLite.
3. **Generator volume** — 90 days × 12 dealers × multiple blasts can be thousands of `Message` rows; keep it bounded (target a few thousand, not tens of thousands) for fast seeding.
4. **Cost rate realism** — the flat per-message estimate ignores WhatsApp's per-conversation-category pricing. Acceptable for a demo; clearly "est.".
5. **Timezone** — "today"/daily buckets computed in server local time; ensure consistent with how the UI labels days (the design uses Mon–Sun). Pin a timezone (e.g. Asia/Kuala_Lumpur) for bucketing.
