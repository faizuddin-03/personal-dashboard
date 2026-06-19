# Send-Time Advisor — "Best time to resend" on completed campaigns — Design Spec

**Date:** 2026-06-15
**Author:** Soon Zhen Yang (with Claude)
**Branch:** `feat/send-time-advisor`
**Status:** Draft — awaiting spec review
**Builds on:** `2026-06-07-real-analytics-design.md` (the analytics module + KL-timezone helpers this reuses) and `2026-06-12-llm-template-generation-design.md` (the `LlmService` provider pattern this extends).

---

## 1. Purpose

When an operator opens a **completed** campaign, give them forward-looking advice: *"You sent this Tue 2 PM and 34% was read. This audience reads most Tue–Thu 8–9 PM — resend then for an estimated lift."*

The recommendation is keyed on the **audience's own engagement habits** — when the recipients of this blast actually read and reply, aggregated by hour-of-day and day-of-week (Asia/Kuala_Lumpur). It is *not* a generic best-practice rule and *not* an attempt to model send-hour→read-rate causally (see §3.1 for why).

This adds an LLM-powered, genuinely useful feature on top of data the system **already records** (`Message.readAt` / `repliedAt`), with no new write paths and no schema migration.

### Decisions taken into this spec (from brainstorming)

- **Timing basis:** *audience engagement-time distribution* — when these recipients read/reply across all blasts they've received — not send-hour→read-rate (confounded) and not category/global patterns.
- **Surface (v1):** a **"Best time to resend" card on the completed campaign detail page** (`/blasts/:id`). The blast-wizard scheduling suggestion is a deliberate v2 (see §9).
- **Approach:** *on-demand compute + LLM narration*. Stats are computed when the page is opened; no precompute on blast completion, no stored column, no worker changes.
- **Division of labour (non-negotiable for trust):** **statistics own the recommended time and every number; the LLM only phrases them.** The LLM cannot invent or change a time. The authoritative recommendation chip is rendered from the stats, independent of the narrative text.
- **Optimise for:** **read rate primarily, reply rate secondarily.** Buckets are scored `reads + REPLY_WEIGHT·replies` (replies weighted higher because they are rarer and a stronger signal), so reads keep the recommendation stable while replies nudge and get mentioned.
- **Cold-start:** under a minimum sample threshold, **no fabricated time** — the card shows an honest "not enough history yet" state.
- **Graceful degradation:** if the LLM is mock/off/times out, the stats and recommendation still render; the narrative falls back to a deterministic templated sentence.

---

## 2. Scope

### In scope

1. **Stats engine** — a new `SendTimeAdvisorService` in the analytics module that, given a `blastId`, computes the audience's weekday/hour engagement distribution, a recommended send window, a confidence tier, and this-run anchor figures.
2. **LLM narrator** — a new `generateSendTimeAdvice` method on the `LlmService` contract, implemented by both `MockLlmService` (deterministic template) and `OllamaLlmService` (real, native `/api/chat` + JSON-schema structured output). The narrator receives the computed stats and returns prose only.
3. **API endpoint** — `GET /api/analytics/send-time-advice/:blastId` (`JwtAuthGuard`), returning `{ recommendation, thisRun, distribution, advice }`. Small in-memory TTL cache so the LLM call isn't repeated on every page open.
4. **Frontend card** — a "Best time to resend" card on `CampaignDetail.tsx`, shown only for `COMPLETED` blasts, with loading / cold-start / error states, via a new client fn in `apps/web/src/api/analytics.ts`.
5. **Tests** — unit tests for the stats engine (KL bucketing, read/reply weighting, window selection, confidence tiers, cold-start), the mock narrator, and the Ollama narrator (`nock`, asserting it never overrides the time + handles bad JSON); web typecheck via `pnpm --filter web build`.

### Out of scope (deferred)

- **Blast-wizard send-time suggestion** (v2) — surfacing the recommended window at *schedule* time, keyed on the chosen audience rather than a past blast.
- **Send-hour→read-rate causal modelling** — rejected as confounded (§3.1).
- **Auto-scheduling / one-click "schedule resend"** — the feature is advisory only.
- **A compact weekday×hour heatmap visual** — the v1 card is recommendation + narrative + this-run anchor + an optional simple hour-of-day bar; a full heatmap is a later polish.
- **Per-segment precompute / materialised engagement profiles** — premature for a single-tenant, low-volume box (YAGNI).
- Any change to existing analytics endpoints or the blast pipeline.

---

## 3. Architecture

Three units, each independently understandable and testable:

```
┌──────────────────────────────────────────────┐
│ Frontend — CampaignDetail.tsx (/blasts/:id)   │
│ api/analytics.ts → getSendTimeAdvice(blastId) │
│ react-query, renders only when COMPLETED      │
└───────────────────────┬──────────────────────┘
                        │ GET /api/analytics/send-time-advice/:blastId
┌───────────────────────▼──────────────────────┐
│ SendTimeAdvisorService  (analytics module)    │
│  ┌─ stats engine ─────────────────────────┐   │
│  │ Blast.recipientSnapshot → audience ids  │   │
│  │ Message.readAt/repliedAt (source=BLAST) │   │
│  │ → KL weekday/hour buckets → window +    │   │
│  │   confidence + this-run anchor          │   │
│  └─────────────────────────────────────────┘   │
│         │ structured SendTimeStats              │
│         ▼                                       │
│  LlmService.generateSendTimeAdvice(stats)       │
│   → { headline, body }  (prose only)            │
│  + in-memory TTL cache keyed by blastId         │
└───────────────────────────────────────────────┘
```

### 3.1 Why engagement-time distribution, not send-hour→read-rate

"Send at 8 PM next time" could be derived two ways:

- **Send-hour → read-rate** ("of messages *sent* at hour H, what % were read?") is the causal quantity, but it is **badly confounded**: blasts are only ever sent at the handful of times operators historically chose. If past blasts all went out around 2 PM, there is *no evidence* about 8 PM, and the data is biased by the very habit we're trying to improve.
- **Engagement-time distribution** ("when do this audience's reads/replies actually *land*, by weekday × hour?") is robust: reads happen organically throughout the day regardless of when the message was sent, so every read is a sample of when the recipient is attentive. More history simply sharpens the peak. The recommended window is the audience's peak attentive band — send then so the message is near the top of their chat list when they look.

We use the second. It directly matches the chosen basis ("audience engagement habits") and degrades gracefully.

### 3.2 Stats engine

`SendTimeAdvisorService.computeStats(blastId)` (analytics module — same conventions as `AnalyticsService`: `JwtAuthGuard` at the controller, `PrismaService` is `@Global`, reuse `analytics.util.ts`).

Steps:

1. **Load the blast.** Read `recipientSnapshot` (a `Json` `string[]` of contact ids), `name`, `startedAt`/`scheduledAt` (actual send time = `startedAt ?? scheduledAt`), `status`, `completedAt`. 404 if not found.
2. **This-run anchor.** Count this blast's own messages by outcome (`sent`, `read`, `replied`) — reuse the same counting shape as `BlastsService.stats`. Compute `readRate`/`replyRate` via `rate()`. Derive the send weekday/hour in KL from the actual send time.
3. **Gather audience engagement.** Query `Message` where `contactId IN (recipientSnapshot)` **AND `source = 'BLAST'`** with a non-null `readAt` **or** `repliedAt`, within a lookback window (`SEND_TIME_LOOKBACK_DAYS`, default 90). This spans *all* blasts those contacts received, not just this one. (No Prisma `Message→Contact` relation is needed; we filter by the id list from the snapshot. Use `prisma.message.findMany` selecting only `readAt`/`repliedAt`, or `$queryRaw` if the id list is large — finalised in the plan.)
4. **Bucket in KL time.** For each engagement event, add a new helper `klWeekdayHour(d): { weekday: 0–6; hour: 0–23 }` to `analytics.util.ts` (same `KL_OFFSET_MS` approach as `klDayKey`). Maintain two histograms:
   - **hour-of-day** (24 buckets) — weighted `reads + REPLY_WEIGHT·replies` (default `REPLY_WEIGHT = 3`).
   - **day-of-week** (7 buckets) — same weighting.
   We deliberately keep these as two 1-D distributions rather than one 168-cell grid, so the signal isn't shattered by sparsity.
5. **Pick the window.**
   - **Hour band:** find the peak hour, then expand to a contiguous band (default ±1 hour → a 2–3 hour window) and compute its `share` (% of weighted engagement in the band).
   - **Day qualifier:** only attach one if a day grouping is clearly concentrated (e.g. weekday share ≥ a threshold, or a single dominant day) — otherwise omit it rather than over-claim.
6. **Confidence** from total engagement events `E` (reads + replies counted):
   - `E < SEND_TIME_MIN_EVENTS` (default 30) → `INSUFFICIENT` → cold-start, **no recommended time**.
   - else `LOW` / `MEDIUM` / `HIGH` by tier thresholds (illustrative: `<100` / `<400` / `≥400`; finalised in the plan).

Output (`SendTimeStats`, illustrative — finalised in the plan):

```ts
{
  blastId: string;
  campaignName: string;
  thisRun: {
    sentAt: string | null;           // ISO of actual send
    sentWeekday: number | null;      // 0–6 KL
    sentHour: number | null;         // 0–23 KL
    sent: number; read: number; replied: number;
    readRate: number; replyRate: number;   // 1-decimal %
  };
  audienceSize: number;              // recipientSnapshot length
  totalEvents: number;               // reads + replies used
  confidence: 'INSUFFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: {
    hourStart: number; hourEnd: number;     // 0–23 KL, inclusive band
    days: number[] | null;                  // 0–6 KL, or null = "any day"
    share: number;                          // % of weighted engagement in band
  } | null;                                 // null when INSUFFICIENT
  hourHistogram: number[];           // length 24, weighted (for an optional bar)
}
```

### 3.3 LLM narrator

Extend the `LlmService` abstract contract (`apps/api/src/llm/llm.service.ts`) with:

```ts
abstract generateSendTimeAdvice(input: SendTimeAdviceInput): Promise<SendTimeAdvice>;
```

with new types in `llm.types.ts`:

```ts
export interface SendTimeAdviceInput {
  campaignName: string;
  thisRun: { sentLabel: string | null; readRate: number; replyRate: number };
  recommendation: {                 // omitted when cold-start (caller handles that path)
    windowLabel: string;            // pre-formatted by the service, e.g. "Tue–Thu, 8–9 PM"
    share: number;
    confidence: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}
export interface SendTimeAdvice { headline: string; body: string; } // 2–3 sentences
```

- The **service pre-formats** `windowLabel` and all figures from the stats and passes them in. The LLM is told, explicitly, to use **only** the provided numbers/labels and never to invent or alter a time. Its job is phrasing, not computation.
- **Guardrail:** regardless of what the LLM returns, the API response's `recommendation` block (the authoritative time chip) comes straight from the stats. The narrative is supplementary prose. So a drifting narrative can never change the displayed recommendation.
- **`MockLlmService`** (default): returns a deterministic templated `{ headline, body }` built from the input (no network) — keeps CI, Windows dev, and the demo working with no config, exactly like the existing mock methods.
- **`OllamaLlmService`** (`LLM_PROVIDER=ollama`): one non-streaming POST to `{OLLAMA_BASE_URL}/api/chat` with `think:false`, low temperature, and `format` = a JSON schema for `{ headline, body }` (same structured-output technique as `generateTemplateDrafts`). On timeout / non-200 / unparseable output it **throws**, and the *caller* (the advisor service) catches it and substitutes the mock/templated narrative — i.e. LLM failure degrades to templated text rather than failing the endpoint (this differs from template generation, where failure surfaces a 503, because here the recommendation is still fully useful without prose).

**Model env:** reuse `OLLAMA_TEMPLATE_MODEL` by default; add an optional `OLLAMA_INSIGHT_MODEL` override (a smaller/faster model is fine — this is a short phrasing task). Reuses the existing `OLLAMA_BASE_URL` / `OLLAMA_TIMEOUT_MS`.

### 3.4 API endpoint + caching

New route on `AnalyticsController`:

```ts
@Get('send-time-advice/:blastId')
sendTimeAdvice(@Param('blastId') blastId: string) {
  return this.advisor.getAdvice(blastId);
}
```

`SendTimeAdvisorService.getAdvice(blastId)`:
1. Compute stats (§3.2).
2. If `INSUFFICIENT` → return `{ recommendation: null, thisRun, confidence: 'INSUFFICIENT', advice: <fixed cold-start copy> }` (no LLM call — avoids any chance of fabricated specifics).
3. Else format `windowLabel`, call `generateSendTimeAdvice`; on throw, fall back to the mock/templated narrative.
4. Return `{ recommendation, thisRun, hourHistogram, advice }`.

**Cache:** a small in-memory TTL map keyed by `blastId` (default TTL ~1 h) wrapping the `{ stats, advice }` result — the stats are cheap but the LLM call is the slow part, and a completed blast's history changes slowly. The HTTP API is a single process, so an in-process cache is sufficient (revisit only if the API is ever horizontally scaled — noted, YAGNI). React Query also caches client-side.

New env (added to `apps/api/.env.example` and the Mac Studio `.env`):

```
SEND_TIME_LOOKBACK_DAYS=90        # how far back to gather engagement
SEND_TIME_MIN_EVENTS=30           # below this → cold-start, no recommendation
OLLAMA_INSIGHT_MODEL=             # optional; defaults to OLLAMA_TEMPLATE_MODEL
```

### 3.5 Frontend card

`apps/web/src/api/analytics.ts` — add `getSendTimeAdvice(blastId)` returning the typed response (mirrors the existing client fns).

`CampaignDetail.tsx` — add a "Best time to resend" section, rendered **only when `blast.status === 'COMPLETED'`**, via `useQuery(['send-time-advice', id], …)` (reuses the existing inline `v-card` styling, `Badge`, and icon set). States:

```
┌─ Best time to resend ────────────────── ● AI ─┐
│  🕗  Tue–Thu · 8–9 PM        confidence ●●○   │   ← recommendation (stats-owned)
│                                                │
│  You sent this Tue 2 PM and 34% was read.      │
│  This audience reads most between 8–9 PM on    │   ← narrative (LLM or templated)
│  weekdays — resending then should lift opens.  │
│                                                │
│  This run: 1,240 sent · 34% read · 6% replied  │   ← anchor (stats-owned)
└────────────────────────────────────────────────┘
```

- **Cold-start** (`confidence === 'INSUFFICIENT'`): show "Not enough history for this audience yet — we'll have a recommendation once they've received more campaigns," plus the this-run line. No time chip.
- **Loading:** lightweight skeleton consistent with the page's other cards.
- **Error** (`isError`): small inline "Couldn't load timing insight" with the card frame intact; never blocks the rest of the page.
- An optional thin 24-hour bar from `hourHistogram` may be added if cheap; not required for v1.

---

## 4. Data flow

1. Operator opens a completed campaign → `CampaignDetail` fires `GET /api/analytics/send-time-advice/:blastId`.
2. `SendTimeAdvisorService` loads the blast, reads the audience's `Message.readAt/repliedAt` (source=BLAST, within lookback), buckets them in KL time, picks the window + confidence, and computes this-run anchor figures.
3. If enough data, it formats the window label and asks `LlmService` to phrase it; on LLM failure it uses the templated narrative.
4. Result (cached briefly) returns as JSON; the card renders the stats-owned recommendation chip + the narrative + the anchor.

---

## 5. Error / cold-start / degradation handling

| Case | Handling |
|---|---|
| Blast id not found | 404 from the service |
| Blast not `COMPLETED` | Card not rendered (frontend gate); endpoint still computes if called directly |
| Audience has `< SEND_TIME_MIN_EVENTS` engagement events | `confidence: INSUFFICIENT`, `recommendation: null`, fixed cold-start copy, **no LLM call** |
| Empty `recipientSnapshot` / no reads ever | Same cold-start path |
| LLM off / mock | Templated deterministic narrative (mock path) |
| LLM (Ollama) timeout / non-200 / bad JSON | Caught in the service → templated narrative; recommendation still rendered |
| Query failure on the client | react-query `isError` → inline "Couldn't load", page intact |
| Auth | Endpoint behind `JwtAuthGuard`; axios client already handles 401→refresh |

The guiding rule: **the recommendation must never depend on the LLM being up**, and the system must **never fabricate a time** it can't support with data.

---

## 6. Testing strategy

- **Stats engine** (`apps/api/src/analytics/__tests__/send-time-advisor.service.spec.ts`, Jest, stubbed `PrismaService` returning fixture `Message` rows):
  - KL bucketing: a read at a known UTC instant lands in the expected KL hour/weekday (incl. the UTC→KL day-boundary case).
  - Read-vs-reply weighting: replies count `REPLY_WEIGHT×`; a bucket with replies can outrank a higher-read bucket appropriately.
  - Window selection: peak hour + band expansion + `share` math.
  - Day qualifier attached only when concentration exceeds threshold.
  - Confidence tiers at the boundaries; cold-start (`< MIN`) returns `INSUFFICIENT` and `recommendation: null`.
  - This-run anchor counts/rates.
- **Mock narrator** (`mock-llm.service.spec.ts` additions): `generateSendTimeAdvice` returns deterministic, non-empty `{ headline, body }` referencing the passed window/figures.
- **Ollama narrator** (`ollama-llm.service.spec.ts` additions, `nock`): correct request shape (model from env, `think:false`, `format` present); valid JSON → `{headline, body}`; **asserts the service still returns the stats-derived recommendation even if the model text names a different time**; malformed output → caller falls back to templated narrative.
- **Endpoint** (controller test or service integration): cold-start vs populated; cache returns the same object within TTL.
- **Web:** typecheck via `pnpm --filter web build` (no ESLint in the web package).

---

## 7. File-by-file change list

**API (new):**
- `apps/api/src/analytics/send-time-advisor.service.ts`
- `apps/api/src/analytics/__tests__/send-time-advisor.service.spec.ts`

**API (edit):**
- `apps/api/src/analytics/analytics.util.ts` — add `klWeekdayHour(d)`.
- `apps/api/src/analytics/analytics.controller.ts` — add `GET send-time-advice/:blastId`.
- `apps/api/src/analytics/analytics.module.ts` — provide `SendTimeAdvisorService`; ensure `LlmModule` is available (it is `@Global`, so import not strictly required — confirm in the plan).
- `apps/api/src/llm/llm.service.ts` — add `generateSendTimeAdvice` to the abstract contract.
- `apps/api/src/llm/llm.types.ts` — add `SendTimeAdviceInput` / `SendTimeAdvice`.
- `apps/api/src/llm/mock-llm.service.ts` — implement the deterministic narrator.
- `apps/api/src/llm/ollama-llm.service.ts` — implement the real narrator (native `/api/chat` + `format` schema, throw-on-failure).
- `apps/api/.env.example` — `SEND_TIME_LOOKBACK_DAYS`, `SEND_TIME_MIN_EVENTS`, `OLLAMA_INSIGHT_MODEL`.

**Web (edit):**
- `apps/web/src/api/analytics.ts` — `getSendTimeAdvice(blastId)` + types.
- `apps/web/src/pages/CampaignDetail.tsx` — the "Best time to resend" card (COMPLETED-only) with loading/cold-start/error states.

**Docs:**
- (this spec)

---

## 8. Sequencing (for the implementation plan)

1. **`klWeekdayHour` helper + stats engine** with unit tests against fixtures — the deterministic core, no LLM, no HTTP. De-risks the statistics first.
2. **LLM contract + mock narrator** — extend `LlmService`, implement the mock, wire `SendTimeAdvisorService.getAdvice` end-to-end with the templated fallback (works fully offline).
3. **Endpoint + cache** on `AnalyticsController`; service/controller tests.
4. **Ollama narrator** with `nock` tests (incl. the "never overrides the time" guarantee).
5. **Frontend** client fn + the card on `CampaignDetail.tsx`; `pnpm --filter web build` typecheck.

Each step is independently verifiable; the feature is useful and demoable after step 3 (mock narrative), with steps 4–5 adding real prose and the UI.

---

## 9. Open questions / risks

1. **Sparsity on a fresh box.** A new deployment (or the demo DB) may have little real read/reply history, so most audiences hit the cold-start path. Mitigation: the existing `db:seed:analytics` generator already produces ~90 days of `Message` rows with `readAt`/`repliedAt` — confirm it spreads engagement across hours/weekdays realistically (it may need a small tweak to vary read *times-of-day*, since it currently targets daily funnels). Decide in the plan whether to extend the generator.
2. **Send-time vs read-time framing in copy.** The recommendation is derived from *read* times; the advice says *send* "around" that window. The narrative must phrase this honestly ("they're most active 8–9 PM; send around then") and not over-promise a causal lift. The LLM prompt + the templated fallback both encode this.
3. **`share`/confidence thresholds** (the 30 / 100 / 400 tiers, the ±1-hour band, `REPLY_WEIGHT=3`, day-concentration threshold) are illustrative starting values; finalise against the seeded data so the card reads sensibly. All env- or constant-configurable.
4. **Large `recipientSnapshot`.** Very large audiences make the `contactId IN (...)` query big; if needed, switch to `$queryRaw` with the id array, or join via `messages.blast_id` for blasts targeting the same audience. Bound in the plan.
5. **Day-of-week confidence.** With limited data the weekday signal is weaker than hour-of-day; defaulting `days: null` ("any day") when not concentrated keeps the advice honest.
