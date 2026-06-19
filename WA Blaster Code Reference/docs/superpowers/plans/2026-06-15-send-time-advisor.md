# Send-Time Advisor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Best time to resend" card to the completed-campaign detail page that recommends when to resend, based on the audience's real read/reply habits, with an LLM narrating the advice.

**Architecture:** A deterministic pure function buckets the audience's `Message.readAt`/`repliedAt` timestamps by KL hour-of-day and day-of-week to pick a peak window + confidence. A new `SendTimeAdvisorService` (analytics module) loads the data, runs that function, and asks `LlmService` to phrase the result — the LLM only writes prose; the recommended time and all numbers come from the stats. A new `GET /api/analytics/send-time-advice/:blastId` endpoint serves it (with a short in-memory cache); a React card renders it on `CampaignDetail.tsx`.

**Tech Stack:** NestJS 10 + Prisma (Postgres), Jest + nock; React 18 + React Query; Ollama (native `/api/chat`, structured output) for the real narrator, `MockLlmService` as the deterministic fallback.

**Spec:** `docs/superpowers/specs/2026-06-15-send-time-advisor-design.md`

---

## File Structure

**API — new files**
- `apps/api/src/analytics/send-time-advisor.types.ts` — response/recommendation types (one place, imported by service + tests).
- `apps/api/src/analytics/send-time-stats.ts` — **pure** statistics: bucketing, window selection, confidence. No NestJS, no Prisma.
- `apps/api/src/analytics/send-time-advisor.service.ts` — NestJS service: Prisma I/O + LLM call + cache + label formatting.
- `apps/api/src/analytics/__tests__/send-time-stats.spec.ts` — unit tests for the pure function.
- `apps/api/src/analytics/__tests__/send-time-advisor.service.spec.ts` — unit tests for the service (stubbed Prisma/LLM/Config).

**API — modified files**
- `apps/api/src/analytics/analytics.util.ts` — add `klWeekdayHour`.
- `apps/api/src/analytics/__tests__/analytics.util.spec.ts` — test `klWeekdayHour`.
- `apps/api/src/llm/llm.types.ts` — add `SendTimeAdviceInput` / `SendTimeAdvice`.
- `apps/api/src/llm/llm.service.ts` — add abstract `generateSendTimeAdvice`.
- `apps/api/src/llm/mock-llm.service.ts` — deterministic narrator.
- `apps/api/src/llm/__tests__/mock-llm.service.spec.ts` — test the mock narrator.
- `apps/api/src/llm/ollama-llm.service.ts` — real narrator (delegates to mock on failure).
- `apps/api/src/llm/__tests__/ollama-llm.service.spec.ts` — nock tests for the real narrator.
- `apps/api/src/analytics/analytics.controller.ts` — add the route.
- `apps/api/src/analytics/analytics.module.ts` — provide the service.
- `apps/api/.env.example` — new env vars.

**Web — modified files**
- `apps/web/src/api/analytics.ts` — `getSendTimeAdvice` + types.
- `apps/web/src/pages/CampaignDetail.tsx` — the card (COMPLETED-only).

**Conventions for every commit:** append the trailer with a second `-m`:
`-m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"`

---

### Task 1: `klWeekdayHour` KL-timezone helper

**Files:**
- Modify: `apps/api/src/analytics/analytics.util.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.util.spec.ts`

- [ ] **Step 1: Write the failing test**

Add this import line change + test to `apps/api/src/analytics/__tests__/analytics.util.spec.ts`. Change line 1 to include the new helper:

```ts
import { rangeDays, klDayKey, klWeekdayHour, lastNDayKeys, pctDelta, rate } from '../analytics.util';
```

Then add this test inside the `describe('analytics.util', …)` block (e.g. after the `klDayKey` test):

```ts
  it('klWeekdayHour returns KL (UTC+8) weekday and hour', () => {
    // 2026-06-07T20:00Z → 2026-06-08T04:00 KL → Monday(1), hour 4
    expect(klWeekdayHour(new Date('2026-06-07T20:00:00Z'))).toEqual({ weekday: 1, hour: 4 });
    // 2026-06-07T10:00Z → 2026-06-07T18:00 KL → Sunday(0), hour 18
    expect(klWeekdayHour(new Date('2026-06-07T10:00:00Z'))).toEqual({ weekday: 0, hour: 18 });
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- analytics.util.spec`
Expected: FAIL — `klWeekdayHour is not a function` (or a TS compile error: no exported member `klWeekdayHour`).

- [ ] **Step 3: Implement the helper**

Add to `apps/api/src/analytics/analytics.util.ts` (after `klDayKey`):

```ts
/** Day-of-week (0=Sun..6=Sat) and hour (0..23) of the date in Asia/Kuala_Lumpur. */
export function klWeekdayHour(d: Date): { weekday: number; hour: number } {
  const kl = new Date(d.getTime() + KL_OFFSET_MS);
  return { weekday: kl.getUTCDay(), hour: kl.getUTCHours() };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter api test -- analytics.util.spec`
Expected: PASS (all `analytics.util` tests green).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/analytics/analytics.util.ts apps/api/src/analytics/__tests__/analytics.util.spec.ts
git commit -m "feat(analytics): add klWeekdayHour KL-timezone helper" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Pure send-time statistics engine

**Files:**
- Create: `apps/api/src/analytics/send-time-advisor.types.ts`
- Create: `apps/api/src/analytics/send-time-stats.ts`
- Test: `apps/api/src/analytics/__tests__/send-time-stats.spec.ts`

- [ ] **Step 1: Create the shared types**

Create `apps/api/src/analytics/send-time-advisor.types.ts`:

```ts
export type SendTimeConfidence = 'INSUFFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface SendTimeRecommendation {
  hourStart: number; // 0..23 KL, inclusive
  hourEnd: number; // 0..23 KL, inclusive
  days: number[] | null; // 0..6 KL; null = any day
  share: number; // % of weighted engagement inside the band (1-decimal)
}

export interface SendTimeThisRun {
  sentAt: string | null; // ISO
  sentWeekday: number | null; // 0..6 KL
  sentHour: number | null; // 0..23 KL
  sent: number;
  read: number;
  replied: number;
  readRate: number; // 1-decimal %
  replyRate: number; // 1-decimal %
}

export interface SendTimeAdvice {
  headline: string;
  body: string;
}

export interface SendTimeAdviceResponse {
  blastId: string;
  campaignName: string;
  audienceSize: number;
  totalEvents: number;
  confidence: SendTimeConfidence;
  recommendation: SendTimeRecommendation | null;
  hourHistogram: number[]; // length 24, weighted
  thisRun: SendTimeThisRun;
  advice: SendTimeAdvice;
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/analytics/__tests__/send-time-stats.spec.ts`:

```ts
import { computeSendTimeStats } from '../send-time-stats';

// 2026-06-08 is a Monday (weekday 1). KL = UTC+8.
// KL hour H on that day → UTC = (H-8):00Z.
const readKL = (hourUtcIso: string) => ({ readAt: new Date(hourUtcIso), repliedAt: null });
const replyKL = (hourUtcIso: string) => ({ readAt: null, repliedAt: new Date(hourUtcIso) });
const HOUR20_MON = '2026-06-08T12:00:00Z'; // 20:00 KL Monday
const HOUR09_MON = '2026-06-08T01:00:00Z'; // 09:00 KL Monday
const HOUR20_SUN = '2026-06-07T12:00:00Z'; // 20:00 KL Sunday

describe('computeSendTimeStats', () => {
  it('returns INSUFFICIENT with no recommendation below the minimum', () => {
    const events = Array.from({ length: 5 }, () => readKL(HOUR20_MON));
    const r = computeSendTimeStats({ events, minEvents: 30 });
    expect(r.confidence).toBe('INSUFFICIENT');
    expect(r.recommendation).toBeNull();
    expect(r.totalEvents).toBe(5);
  });

  it('picks the peak hour band and reports the share', () => {
    const events = Array.from({ length: 40 }, () => readKL(HOUR20_MON));
    const r = computeSendTimeStats({ events, minEvents: 30 });
    expect(r.confidence).toBe('LOW'); // 40 < 100
    expect(r.recommendation).toEqual({ hourStart: 19, hourEnd: 21, days: [1, 2, 3, 4, 5], share: 100 });
  });

  it('weights replies above reads (replies can win a quieter hour)', () => {
    const events = [
      ...Array.from({ length: 10 }, () => readKL(HOUR09_MON)), // hour 9: weight 10
      ...Array.from({ length: 4 }, () => replyKL(HOUR20_MON)), // hour 20: weight 12
    ];
    const r = computeSendTimeStats({ events, minEvents: 5 });
    expect(r.totalEvents).toBe(14);
    expect(r.recommendation!.hourStart).toBe(19);
    expect(r.recommendation!.hourEnd).toBe(21);
  });

  it('omits the day qualifier when engagement is spread across the week', () => {
    const events = [
      ...Array.from({ length: 20 }, () => readKL(HOUR20_MON)), // weekday
      ...Array.from({ length: 20 }, () => readKL(HOUR20_SUN)), // weekend
    ];
    const r = computeSendTimeStats({ events, minEvents: 30 });
    expect(r.recommendation!.days).toBeNull();
  });

  it('escalates confidence with sample size', () => {
    const at = (n: number) => Array.from({ length: n }, () => readKL(HOUR20_MON));
    expect(computeSendTimeStats({ events: at(29), minEvents: 30 }).confidence).toBe('INSUFFICIENT');
    expect(computeSendTimeStats({ events: at(30), minEvents: 30 }).confidence).toBe('LOW');
    expect(computeSendTimeStats({ events: at(100), minEvents: 30 }).confidence).toBe('MEDIUM');
    expect(computeSendTimeStats({ events: at(400), minEvents: 30 }).confidence).toBe('HIGH');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `pnpm --filter api test -- send-time-stats.spec`
Expected: FAIL — cannot find module `../send-time-stats`.

- [ ] **Step 4: Implement the pure function**

Create `apps/api/src/analytics/send-time-stats.ts`:

```ts
import { klWeekdayHour, rate } from './analytics.util';
import { SendTimeConfidence, SendTimeRecommendation } from './send-time-advisor.types';

/** Replies are rarer and a stronger signal than reads, so they count for more. */
export const REPLY_WEIGHT = 3;
/** Attach a "weekdays" qualifier only when this share of engagement is Mon–Fri. */
export const WEEKDAY_CONCENTRATION = 0.7;

export interface EngagementEvent {
  readAt: Date | null;
  repliedAt: Date | null;
}

export interface ComputeSendTimeInput {
  events: EngagementEvent[];
  minEvents: number;
}

export interface SendTimeStats {
  totalEvents: number;
  confidence: SendTimeConfidence;
  recommendation: SendTimeRecommendation | null;
  hourHistogram: number[]; // length 24, weighted
}

function confidenceFor(events: number, min: number): SendTimeConfidence {
  if (events < min) return 'INSUFFICIENT';
  if (events < 100) return 'LOW';
  if (events < 400) return 'MEDIUM';
  return 'HIGH';
}

export function computeSendTimeStats(input: ComputeSendTimeInput): SendTimeStats {
  const hourHistogram = new Array<number>(24).fill(0);
  const dayHistogram = new Array<number>(7).fill(0);
  let totalEvents = 0;

  for (const e of input.events) {
    if (e.readAt) {
      const { weekday, hour } = klWeekdayHour(e.readAt);
      hourHistogram[hour] += 1;
      dayHistogram[weekday] += 1;
      totalEvents += 1;
    }
    if (e.repliedAt) {
      const { weekday, hour } = klWeekdayHour(e.repliedAt);
      hourHistogram[hour] += REPLY_WEIGHT;
      dayHistogram[weekday] += REPLY_WEIGHT;
      totalEvents += 1;
    }
  }

  const confidence = confidenceFor(totalEvents, input.minEvents);
  if (confidence === 'INSUFFICIENT') {
    return { totalEvents, confidence, recommendation: null, hourHistogram };
  }

  let peakHour = 0;
  for (let h = 1; h < 24; h++) {
    if (hourHistogram[h] > hourHistogram[peakHour]) peakHour = h;
  }
  const hourStart = Math.max(0, peakHour - 1);
  const hourEnd = Math.min(23, peakHour + 1);

  const totalWeight = hourHistogram.reduce((s, x) => s + x, 0);
  let bandWeight = 0;
  for (let h = hourStart; h <= hourEnd; h++) bandWeight += hourHistogram[h];
  const share = rate(bandWeight, totalWeight);

  const weekdayWeight = dayHistogram[1] + dayHistogram[2] + dayHistogram[3] + dayHistogram[4] + dayHistogram[5];
  const totalDayWeight = dayHistogram.reduce((s, x) => s + x, 0);
  const days =
    totalDayWeight > 0 && weekdayWeight / totalDayWeight >= WEEKDAY_CONCENTRATION
      ? [1, 2, 3, 4, 5]
      : null;

  return { totalEvents, confidence, recommendation: { hourStart, hourEnd, days, share }, hourHistogram };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `pnpm --filter api test -- send-time-stats.spec`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/analytics/send-time-advisor.types.ts apps/api/src/analytics/send-time-stats.ts apps/api/src/analytics/__tests__/send-time-stats.spec.ts
git commit -m "feat(analytics): pure send-time statistics engine" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: LLM contract + mock narrator

Adds `generateSendTimeAdvice` to the `LlmService` contract and implements it in both providers. The Ollama implementation here is a **temporary delegate to the mock** (so the build compiles); Task 4 replaces it with the real call.

**Files:**
- Modify: `apps/api/src/llm/llm.types.ts`
- Modify: `apps/api/src/llm/llm.service.ts`
- Modify: `apps/api/src/llm/mock-llm.service.ts`
- Modify: `apps/api/src/llm/ollama-llm.service.ts`
- Test: `apps/api/src/llm/__tests__/mock-llm.service.spec.ts`

- [ ] **Step 1: Add the LLM types**

Append to `apps/api/src/llm/llm.types.ts`:

```ts
export interface SendTimeAdviceInput {
  campaignName: string;
  thisRun: { sentLabel: string | null; readRate: number; replyRate: number };
  recommendation: { windowLabel: string; share: number; confidence: 'LOW' | 'MEDIUM' | 'HIGH' };
}

export interface SendTimeAdvice {
  headline: string;
  body: string;
}
```

- [ ] **Step 2: Add the abstract method**

In `apps/api/src/llm/llm.service.ts`, add `SendTimeAdviceInput, SendTimeAdvice` to the import from `./llm.types`, then add to the class body:

```ts
  abstract generateSendTimeAdvice(input: SendTimeAdviceInput): Promise<SendTimeAdvice>;
```

- [ ] **Step 3: Write the failing test (mock narrator)**

Append this test inside the `describe('MockLlmService', …)` block in `apps/api/src/llm/__tests__/mock-llm.service.spec.ts`:

```ts
  it('narrates send-time advice deterministically from the given figures', async () => {
    const r = await svc.generateSendTimeAdvice({
      campaignName: 'Roadtax June',
      thisRun: { sentLabel: 'Tue 2 PM', readRate: 34, replyRate: 6 },
      recommendation: { windowLabel: 'Mon–Fri, 7 PM–9 PM', share: 41, confidence: 'MEDIUM' },
    });
    expect(r.headline).toBeTruthy();
    expect(r.body).toContain('Mon–Fri, 7 PM–9 PM');
    expect(r.body).toContain('41%');
    expect(r.body).toContain('Tue 2 PM');
  });
```

- [ ] **Step 4: Run test to verify it fails**

Run: `pnpm --filter api test -- mock-llm.service.spec`
Expected: FAIL — `generateSendTimeAdvice is not a function` (and TS errors that both providers don't implement the abstract method).

- [ ] **Step 5: Implement the mock narrator**

In `apps/api/src/llm/mock-llm.service.ts`, add `SendTimeAdviceInput, SendTimeAdvice` to the import from `./llm.types`, then add this method to the class:

```ts
  async generateSendTimeAdvice(input: SendTimeAdviceInput): Promise<SendTimeAdvice> {
    const prefix = input.thisRun.sentLabel
      ? `You sent ${input.campaignName} ${input.thisRun.sentLabel} and ${input.thisRun.readRate}% was read. `
      : '';
    return {
      headline: 'Best time to resend',
      body:
        `${prefix}This audience is most active ${input.recommendation.windowLabel} — ` +
        `about ${input.recommendation.share}% of their reads land then, so resending around that window should lift opens.`,
    };
  }
```

- [ ] **Step 6: Implement the temporary Ollama delegate**

In `apps/api/src/llm/ollama-llm.service.ts`, add `SendTimeAdviceInput, SendTimeAdvice` to the import from `./llm.types`, then add this method to the class (next to the other `this.mock` delegations near `generateReply`):

```ts
  generateSendTimeAdvice(input: SendTimeAdviceInput): Promise<SendTimeAdvice> {
    // Real implementation added in Task 4; delegate to the deterministic mock for now.
    return this.mock.generateSendTimeAdvice(input);
  }
```

- [ ] **Step 7: Run test to verify it passes**

Run: `pnpm --filter api test -- mock-llm.service.spec`
Expected: PASS.

- [ ] **Step 8: Verify the whole API still type-checks**

Run: `pnpm --filter api build`
Expected: build succeeds (no abstract-method errors).

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/llm/llm.types.ts apps/api/src/llm/llm.service.ts apps/api/src/llm/mock-llm.service.ts apps/api/src/llm/ollama-llm.service.ts apps/api/src/llm/__tests__/mock-llm.service.spec.ts
git commit -m "feat(llm): add generateSendTimeAdvice contract + mock narrator" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Real Ollama narrator

Replaces the Task 3 delegate with a real `/api/chat` call using structured output; on any failure it falls back to the mock (same pattern as `generateReply`).

**Files:**
- Modify: `apps/api/src/llm/ollama-llm.service.ts`
- Test: `apps/api/src/llm/__tests__/ollama-llm.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

Append a new `describe` block to `apps/api/src/llm/__tests__/ollama-llm.service.spec.ts` (the file already imports `nock`, `makeService`, and `BASE`):

```ts
  describe('generateSendTimeAdvice', () => {
    const input = {
      campaignName: 'Roadtax June',
      thisRun: { sentLabel: 'Tue 2 PM', readRate: 34, replyRate: 6 },
      recommendation: { windowLabel: 'Mon–Fri, 7 PM–9 PM', share: 41, confidence: 'MEDIUM' as const },
    };

    it('returns the model headline/body on a valid response', async () => {
      const service = makeService();
      nock(BASE)
        .post('/api/chat')
        .reply(200, {
          message: { role: 'assistant', content: JSON.stringify({ headline: 'Resend in the evening', body: 'Send around 7–9 PM.' }) },
          done: true,
        });
      const r = await service.generateSendTimeAdvice(input);
      expect(r.headline).toBe('Resend in the evening');
      expect(r.body).toBe('Send around 7–9 PM.');
    });

    it('uses OLLAMA_INSIGHT_MODEL when set', async () => {
      const service = makeService({ OLLAMA_INSIGHT_MODEL: 'qwen2.5:14b' });
      let sentModel = '';
      nock(BASE)
        .post('/api/chat', (b: any) => { sentModel = b.model; return true; })
        .reply(200, { message: { content: JSON.stringify({ headline: 'h', body: 'b' }) }, done: true });
      await service.generateSendTimeAdvice(input);
      expect(sentModel).toBe('qwen2.5:14b');
    });

    it('falls back to the deterministic mock when Ollama fails', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').reply(500, 'boom');
      const r = await service.generateSendTimeAdvice(input);
      // Mock narrator phrasing references the passed window + share.
      expect(r.body).toContain('Mon–Fri, 7 PM–9 PM');
      expect(r.body).toContain('41%');
    });

    it('falls back to the mock when the model emits unparseable JSON', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').reply(200, { message: { content: 'not json {{' }, done: true });
      const r = await service.generateSendTimeAdvice(input);
      expect(r.body).toContain('Mon–Fri, 7 PM–9 PM');
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm --filter api test -- ollama-llm.service.spec`
Expected: FAIL — the "valid response" test gets the mock body (`…most active Mon–Fri…`) instead of `Send around 7–9 PM.`, because the method still delegates to the mock.

- [ ] **Step 3: Implement the real narrator**

In `apps/api/src/llm/ollama-llm.service.ts`:

(a) Add a module-level schema + prompt near the other top-level consts (e.g. after `SYSTEM_PROMPT`):

```ts
const SEND_TIME_ADVICE_SCHEMA = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['headline', 'body'],
};

const SEND_TIME_SYSTEM_PROMPT = [
  'You write a short send-time recommendation shown on a WhatsApp campaign dashboard.',
  'You are given pre-computed figures. Use ONLY those figures.',
  'NEVER invent or change a day, a time, or a percentage — copy the window label and numbers exactly as given.',
  'Write 2–3 short sentences in a helpful advisor tone: what happened on the last send (if provided), the recommended window, and a one-line reason.',
  'The window reflects when the audience READS, so phrase it as "send around then" — never promise a guaranteed result.',
  'Return JSON only: { "headline": string, "body": string }. Keep the headline under 5 words.',
].join('\n');
```

(b) In the constructor, add an insight-model field. After the line `this.model = this.config.get<string>('OLLAMA_TEMPLATE_MODEL', 'qwen3:14b');` add:

```ts
    this.insightModel = this.config.get<string>('OLLAMA_INSIGHT_MODEL') || this.model;
```

and declare the field next to `private readonly model: string;`:

```ts
  private readonly insightModel: string;
```

(c) Replace the temporary `generateSendTimeAdvice` delegate from Task 3 with:

```ts
  async generateSendTimeAdvice(input: SendTimeAdviceInput): Promise<SendTimeAdvice> {
    try {
      const { data } = await this.http.post('/api/chat', {
        model: this.insightModel,
        stream: false,
        think: false,
        format: SEND_TIME_ADVICE_SCHEMA,
        options: { temperature: 0.3 },
        messages: [
          { role: 'system', content: SEND_TIME_SYSTEM_PROMPT },
          { role: 'user', content: this.buildSendTimePrompt(input) },
        ],
      });
      const content = data?.message?.content;
      if (typeof content !== 'string') throw new Error('Ollama response missing message.content');
      const cleaned = content
        .replace(/<think>[\s\S]*?<\/think>/gi, '')
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const parsed = JSON.parse(cleaned) as { headline?: unknown; body?: unknown };
      const body = String(parsed?.body ?? '').trim();
      if (!body) throw new Error('Ollama send-time advice had an empty body');
      const headline = String(parsed?.headline ?? '').trim() || 'Best time to resend';
      return { headline, body };
    } catch (err) {
      this.logger.warn(
        `Ollama send-time advice failed, using mock: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      return this.mock.generateSendTimeAdvice(input);
    }
  }

  private buildSendTimePrompt(input: SendTimeAdviceInput): string {
    return [
      `Campaign: ${input.campaignName}`,
      input.thisRun.sentLabel
        ? `Last sent: ${input.thisRun.sentLabel} (${input.thisRun.readRate}% read, ${input.thisRun.replyRate}% replied)`
        : 'Last send time: unknown',
      `Recommended window: ${input.recommendation.windowLabel}`,
      `Share of engagement in the window: ${input.recommendation.share}%`,
      `Confidence: ${input.recommendation.confidence}`,
    ].join('\n');
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api test -- ollama-llm.service.spec`
Expected: PASS (existing template tests + 4 new send-time tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/llm/ollama-llm.service.ts apps/api/src/llm/__tests__/ollama-llm.service.spec.ts
git commit -m "feat(llm): real Ollama send-time narrator with mock fallback" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: SendTimeAdvisorService

**Files:**
- Create: `apps/api/src/analytics/send-time-advisor.service.ts`
- Test: `apps/api/src/analytics/__tests__/send-time-advisor.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/analytics/__tests__/send-time-advisor.service.spec.ts`:

```ts
import { SendTimeAdvisorService } from '../send-time-advisor.service';

const HOUR20_MON = '2026-06-08T12:00:00Z'; // 20:00 KL Monday

function makeConfig(overrides: Record<string, string> = {}) {
  const merged: Record<string, string> = {
    SEND_TIME_MIN_EVENTS: '30',
    SEND_TIME_LOOKBACK_DAYS: '90',
    ...overrides,
  };
  return { get: (k: string) => merged[k] } as any;
}

function makePrisma(opts: {
  blast: any;
  sent?: number; read?: number; replied?: number;
  events?: { readAt: Date | null; repliedAt: Date | null }[];
}) {
  return {
    blast: { findUnique: jest.fn().mockResolvedValue(opts.blast) },
    message: {
      count: jest.fn(({ where }: any) => {
        if (where.readAt) return Promise.resolve(opts.read ?? 0);
        if (where.repliedAt) return Promise.resolve(opts.replied ?? 0);
        return Promise.resolve(opts.sent ?? 0);
      }),
      findMany: jest.fn().mockResolvedValue(opts.events ?? []),
    },
  } as any;
}

const baseBlast = {
  id: 'b1',
  name: 'Roadtax June',
  recipientSnapshot: ['c1', 'c2'],
  startedAt: new Date(HOUR20_MON),
  scheduledAt: new Date(HOUR20_MON),
};

describe('SendTimeAdvisorService', () => {
  const now = new Date('2026-06-15T00:00:00Z');

  it('throws when the blast is missing', async () => {
    const prisma = makePrisma({ blast: null });
    const llm = { generateSendTimeAdvice: jest.fn() } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    await expect(svc.getAdvice('missing', now)).rejects.toThrow();
  });

  it('cold-starts without calling the LLM when there is too little history', async () => {
    const events = Array.from({ length: 5 }, () => ({ readAt: new Date(HOUR20_MON), repliedAt: null }));
    const prisma = makePrisma({ blast: baseBlast, sent: 100, read: 5, replied: 0, events });
    const llm = { generateSendTimeAdvice: jest.fn() } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    const r = await svc.getAdvice('b1', now);
    expect(r.confidence).toBe('INSUFFICIENT');
    expect(r.recommendation).toBeNull();
    expect(r.advice.headline).toBe('Not enough history yet');
    expect(llm.generateSendTimeAdvice).not.toHaveBeenCalled();
  });

  it('keeps the stats-derived recommendation even if the LLM names a different time', async () => {
    const events = Array.from({ length: 40 }, () => ({ readAt: new Date(HOUR20_MON), repliedAt: null }));
    const prisma = makePrisma({ blast: baseBlast, sent: 200, read: 68, replied: 12, events });
    const llm = {
      generateSendTimeAdvice: jest.fn().mockResolvedValue({ headline: 'x', body: 'Send at 3 AM.' }),
    } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    const r = await svc.getAdvice('b1', now);
    expect(r.recommendation).toEqual({ hourStart: 19, hourEnd: 21, days: [1, 2, 3, 4, 5], share: 100 });
    expect(r.thisRun.readRate).toBe(34); // 68/200
    expect(llm.generateSendTimeAdvice).toHaveBeenCalledTimes(1);
    // The LLM body is passed through; the authoritative recommendation is independent.
    expect(r.advice.body).toBe('Send at 3 AM.');
  });

  it('caches the result within the TTL (no second DB load)', async () => {
    const events = Array.from({ length: 40 }, () => ({ readAt: new Date(HOUR20_MON), repliedAt: null }));
    const prisma = makePrisma({ blast: baseBlast, sent: 200, read: 68, replied: 12, events });
    const llm = { generateSendTimeAdvice: jest.fn().mockResolvedValue({ headline: 'h', body: 'b' }) } as any;
    const svc = new SendTimeAdvisorService(prisma, llm, makeConfig());
    await svc.getAdvice('b1', now);
    await svc.getAdvice('b1', now);
    expect(prisma.blast.findUnique).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- send-time-advisor.service.spec`
Expected: FAIL — cannot find module `../send-time-advisor.service`.

- [ ] **Step 3: Implement the service**

Create `apps/api/src/analytics/send-time-advisor.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { klWeekdayHour, rate } from './analytics.util';
import { computeSendTimeStats } from './send-time-stats';
import {
  SendTimeAdvice,
  SendTimeAdviceResponse,
  SendTimeRecommendation,
  SendTimeThisRun,
} from './send-time-advisor.types';

const DEFAULT_LOOKBACK_DAYS = 90;
const DEFAULT_MIN_EVENTS = 30;
const CACHE_TTL_MS = 60 * 60 * 1000;
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

@Injectable()
export class SendTimeAdvisorService {
  private readonly cache = new Map<string, { at: number; value: SendTimeAdviceResponse }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  private num(key: string, dflt: number): number {
    const v = Number(this.config.get<string>(key));
    return Number.isFinite(v) && v > 0 ? v : dflt;
  }

  async getAdvice(blastId: string, now = new Date()): Promise<SendTimeAdviceResponse> {
    const cached = this.cache.get(blastId);
    if (cached && now.getTime() - cached.at < CACHE_TTL_MS) return cached.value;

    const blast = await this.prisma.blast.findUnique({
      where: { id: blastId },
      select: { id: true, name: true, recipientSnapshot: true, startedAt: true, scheduledAt: true },
    });
    if (!blast) throw new NotFoundException('Blast not found');

    const audience = Array.isArray(blast.recipientSnapshot) ? (blast.recipientSnapshot as string[]) : [];
    const thisRun = await this.buildThisRun(blastId, blast.startedAt ?? blast.scheduledAt ?? null);

    const minEvents = this.num('SEND_TIME_MIN_EVENTS', DEFAULT_MIN_EVENTS);
    const lookbackDays = this.num('SEND_TIME_LOOKBACK_DAYS', DEFAULT_LOOKBACK_DAYS);
    const since = new Date(now.getTime() - lookbackDays * 86_400_000);

    const events =
      audience.length === 0
        ? []
        : await this.prisma.message.findMany({
            where: {
              contactId: { in: audience },
              source: 'BLAST',
              OR: [{ readAt: { gte: since } }, { repliedAt: { gte: since } }],
            },
            select: { readAt: true, repliedAt: true },
          });

    const stats = computeSendTimeStats({ events, minEvents });
    const advice = await this.buildAdvice(blast.name, thisRun, stats.recommendation, stats.confidence);

    const value: SendTimeAdviceResponse = {
      blastId: blast.id,
      campaignName: blast.name,
      audienceSize: audience.length,
      totalEvents: stats.totalEvents,
      confidence: stats.confidence,
      recommendation: stats.recommendation,
      hourHistogram: stats.hourHistogram,
      thisRun,
      advice,
    };
    this.cache.set(blastId, { at: now.getTime(), value });
    return value;
  }

  private async buildThisRun(blastId: string, sentAt: Date | null): Promise<SendTimeThisRun> {
    const [sent, read, replied] = await Promise.all([
      this.prisma.message.count({ where: { blastId, sentAt: { not: null } } }),
      this.prisma.message.count({ where: { blastId, readAt: { not: null } } }),
      this.prisma.message.count({ where: { blastId, repliedAt: { not: null } } }),
    ]);
    const parts = sentAt ? klWeekdayHour(sentAt) : null;
    return {
      sentAt: sentAt ? sentAt.toISOString() : null,
      sentWeekday: parts ? parts.weekday : null,
      sentHour: parts ? parts.hour : null,
      sent,
      read,
      replied,
      readRate: rate(read, sent),
      replyRate: rate(replied, sent),
    };
  }

  private async buildAdvice(
    campaignName: string,
    thisRun: SendTimeThisRun,
    rec: SendTimeRecommendation | null,
    confidence: SendTimeAdviceResponse['confidence'],
  ): Promise<SendTimeAdvice> {
    if (!rec || confidence === 'INSUFFICIENT') {
      return {
        headline: 'Not enough history yet',
        body:
          "We'll recommend a better send time once this audience has received more campaigns and " +
          'we can see when they tend to read and reply.',
      };
    }
    const sentLabel =
      thisRun.sentWeekday != null && thisRun.sentHour != null
        ? `${WEEKDAY_NAMES[thisRun.sentWeekday]} ${this.formatHour(thisRun.sentHour)}`
        : null;
    return this.llm.generateSendTimeAdvice({
      campaignName,
      thisRun: { sentLabel, readRate: thisRun.readRate, replyRate: thisRun.replyRate },
      recommendation: {
        windowLabel: this.formatWindow(rec),
        share: rec.share,
        confidence: confidence as 'LOW' | 'MEDIUM' | 'HIGH',
      },
    });
  }

  private formatWindow(rec: SendTimeRecommendation): string {
    const dayPart = rec.days
      ? `${WEEKDAY_NAMES[rec.days[0]]}–${WEEKDAY_NAMES[rec.days[rec.days.length - 1]]}, `
      : '';
    return `${dayPart}${this.formatHour(rec.hourStart)}–${this.formatHour(rec.hourEnd)}`;
  }

  private formatHour(h: number): string {
    const period = h < 12 ? 'AM' : 'PM';
    const hr = h % 12 === 0 ? 12 : h % 12;
    return `${hr} ${period}`;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter api test -- send-time-advisor.service.spec`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/analytics/send-time-advisor.service.ts apps/api/src/analytics/__tests__/send-time-advisor.service.spec.ts
git commit -m "feat(analytics): SendTimeAdvisorService (stats + narration + cache)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Wire the endpoint and module

**Files:**
- Modify: `apps/api/src/analytics/analytics.controller.ts`
- Modify: `apps/api/src/analytics/analytics.module.ts`

- [ ] **Step 1: Register the provider**

Edit `apps/api/src/analytics/analytics.module.ts` to import and provide the service:

```ts
import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { SendTimeAdvisorService } from './send-time-advisor.service';
import { AnalyticsController } from './analytics.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // JwtAuthGuard; PrismaService, ConfigService, and LlmService are @Global
  controllers: [AnalyticsController],
  providers: [AnalyticsService, SendTimeAdvisorService],
})
export class AnalyticsModule {}
```

- [ ] **Step 2: Add the route**

Edit `apps/api/src/analytics/analytics.controller.ts`:

(a) Update the imports line to add `Param`:

```ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
```

(b) Add `SendTimeAdvisorService` to the imports and constructor:

```ts
import { SendTimeAdvisorService } from './send-time-advisor.service';
```

```ts
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly sendTime: SendTimeAdvisorService,
  ) {}
```

(c) Add the route method (e.g. after `kpis`):

```ts
  @Get('send-time-advice/:blastId')
  sendTimeAdvice(@Param('blastId') blastId: string) {
    return this.sendTime.getAdvice(blastId);
  }
```

- [ ] **Step 3: Verify the API builds and all API tests pass**

Run: `pnpm --filter api build`
Expected: build succeeds.

Run: `pnpm --filter api test`
Expected: PASS (full suite, including the new specs).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/analytics/analytics.controller.ts apps/api/src/analytics/analytics.module.ts
git commit -m "feat(analytics): expose GET /analytics/send-time-advice/:blastId" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Environment variables

**Files:**
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Add the new vars**

Append to `apps/api/.env.example` (near the existing `OLLAMA_*` block):

```
# Send-time advisor (Best time to resend on completed campaigns)
SEND_TIME_LOOKBACK_DAYS=90        # how far back to gather read/reply history
SEND_TIME_MIN_EVENTS=30           # below this many engagement events → cold-start, no recommendation
OLLAMA_INSIGHT_MODEL=             # optional; defaults to OLLAMA_TEMPLATE_MODEL
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/.env.example
git commit -m "chore(api): document send-time advisor env vars" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: Frontend API client

**Files:**
- Modify: `apps/web/src/api/analytics.ts`

- [ ] **Step 1: Add the type + client function**

Append to `apps/web/src/api/analytics.ts`:

```ts
export interface SendTimeAdviceResponse {
  blastId: string;
  campaignName: string;
  audienceSize: number;
  totalEvents: number;
  confidence: 'INSUFFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: { hourStart: number; hourEnd: number; days: number[] | null; share: number } | null;
  hourHistogram: number[];
  thisRun: {
    sentAt: string | null; sentWeekday: number | null; sentHour: number | null;
    sent: number; read: number; replied: number; readRate: number; replyRate: number;
  };
  advice: { headline: string; body: string };
}

export const getSendTimeAdvice = (blastId: string) =>
  api.get<SendTimeAdviceResponse>(`/analytics/send-time-advice/${blastId}`).then((r) => r.data);
```

- [ ] **Step 2: Verify the web app type-checks**

Run: `pnpm --filter web build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/analytics.ts
git commit -m "feat(web): send-time advice API client" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 9: "Best time to resend" card on the campaign detail page

**Files:**
- Modify: `apps/web/src/pages/CampaignDetail.tsx`

- [ ] **Step 1: Add the import**

In `apps/web/src/pages/CampaignDetail.tsx`, add near the top with the other imports:

```ts
import { getSendTimeAdvice, type SendTimeAdviceResponse } from '../api/analytics';
```

- [ ] **Step 2: Add the card component**

Add this component above `export default function CampaignDetail()` (e.g. after the `Timeline` component, around line 187). It owns its own query, so it only fetches when rendered:

```tsx
/* ── send-time advisor ───────────────────────────────────────── */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function fmtHour12(h: number): string {
  const period = h < 12 ? 'AM' : 'PM';
  const hr = h % 12 === 0 ? 12 : h % 12;
  return `${hr} ${period}`;
}

function windowLabel(rec: NonNullable<SendTimeAdviceResponse['recommendation']>): string {
  const dayPart = rec.days ? `${WD[rec.days[0]]}–${WD[rec.days[rec.days.length - 1]]} · ` : '';
  return `${dayPart}${fmtHour12(rec.hourStart)}–${fmtHour12(rec.hourEnd)}`;
}

function confidenceDots(c: SendTimeAdviceResponse['confidence']): string {
  if (c === 'HIGH') return '●●●';
  if (c === 'MEDIUM') return '●●○';
  return '●○○';
}

function SendTimeCard({ blastId }: { blastId: string }) {
  const q = useQuery({
    queryKey: ['send-time-advice', blastId],
    queryFn: () => getSendTimeAdvice(blastId),
  });

  return (
    <div className="v-card" style={{ padding: '20px 22px', marginBottom: 18 }} data-testid="send-time-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Best time to resend</h2>
        <Badge tone="brand">AI</Badge>
      </div>

      {q.isLoading && (
        <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 13 }}>Analysing engagement…</div>
      )}

      {q.isError && (
        <div style={{ padding: '8px 0', color: 'var(--text-muted)', fontSize: 13 }}>
          Couldn’t load the timing insight.
        </div>
      )}

      {q.data && (
        <>
          {q.data.recommendation ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>
                {windowLabel(q.data.recommendation)}
              </span>
              <span
                title={`Confidence: ${q.data.confidence.toLowerCase()}`}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: 'var(--text-muted)' }}
              >
                {confidenceDots(q.data.confidence)}
              </span>
            </div>
          ) : null}

          <p style={{ margin: '0 0 12px', fontSize: 13.5, lineHeight: 1.5, color: 'var(--text)' }}>
            {q.data.advice.body}
          </p>

          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            This run: <b style={{ color: 'var(--text)' }}>{q.data.thisRun.sent.toLocaleString()}</b> sent ·{' '}
            {q.data.thisRun.readRate}% read · {q.data.thisRun.replyRate}% replied
          </div>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Render the card (COMPLETED only)**

In `CampaignDetail`'s returned JSX, insert the card right after the funnel/details grid's closing `</div>` and before the `{/* ── recipients ── */}` block (around line 364):

```tsx
      {/* ── send-time advisor (completed only) ── */}
      {blast.status === 'COMPLETED' && <SendTimeCard blastId={blast.id} />}
```

- [ ] **Step 4: Verify the web app type-checks**

Run: `pnpm --filter web build`
Expected: build succeeds.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/CampaignDetail.tsx
git commit -m "feat(web): Best time to resend card on completed campaigns" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 10: Full verification

- [ ] **Step 1: API suite**

Run: `pnpm --filter api test`
Expected: PASS (full suite).

- [ ] **Step 2: API build**

Run: `pnpm --filter api build`
Expected: succeeds.

- [ ] **Step 3: Web build (typecheck)**

Run: `pnpm --filter web build`
Expected: succeeds.

- [ ] **Step 4: Manual smoke (optional, on the Mac Studio after merge + pull)**

1. Ensure seeded history exists: `pnpm db:seed && pnpm db:seed:analytics` (the demo generator gives completed blasts with read/reply timestamps).
2. Start API + worker + web; open a **COMPLETED** campaign → confirm the "Best time to resend" card shows a window + narrative + the this-run line. (With a fresh/empty audience it should show "Not enough history yet" — that is correct, not a bug.)
3. With `LLM_PROVIDER=ollama`, confirm the narrative reads naturally; point `OLLAMA_BASE_URL` at a dead port and confirm the card still renders the recommendation with the templated (mock) sentence.

---

## Self-Review

**Spec coverage:**
- §2.1 stats engine → Tasks 1–2, 5. ✅
- §2.2 LLM narrator (mock + Ollama, prose-only, schema) → Tasks 3–4. ✅
- §2.3 endpoint + in-memory TTL cache → Tasks 5–6. ✅
- §2.4 frontend card (COMPLETED-only, loading/cold-start/error) → Tasks 8–9. ✅
- §2.5 tests (stats, mock narrator, Ollama nock incl. "never overrides the time", web typecheck) → Tasks 2, 3, 4, 5 (the "stats own the time" assertion lives in the service spec), 10. ✅
- "Stats own the time" guardrail → enforced structurally (response.recommendation comes from `computeSendTimeStats`, never from the LLM) and asserted in Task 5 Step 1. ✅
- Cold-start "no LLM call / no fabricated time" → Task 5 (`buildAdvice` short-circuits; asserted `llm not called`). ✅
- Graceful degradation (Ollama down → templated narrative) → Task 4 (delegates to mock on failure) + Task 5 (recommendation independent of LLM). ✅
- Env vars (`SEND_TIME_LOOKBACK_DAYS`, `SEND_TIME_MIN_EVENTS`, `OLLAMA_INSIGHT_MODEL`) → Task 7. ✅
- `klWeekdayHour` helper → Task 1. ✅

**Placeholder scan:** No TBD/TODO; every code step shows complete code; every run step shows the exact command + expected result.

**Type consistency:** `SendTimeAdviceInput`/`SendTimeAdvice` (llm.types) are used identically in mock (T3), Ollama (T3/T4), and service (T5). `SendTimeRecommendation`/`SendTimeThisRun`/`SendTimeAdviceResponse` (send-time-advisor.types) are produced by the service (T5) and mirrored in the web client (T8). `computeSendTimeStats` signature (`{ events, minEvents }` → `{ totalEvents, confidence, recommendation, hourHistogram }`) is consistent across T2 (def), T2 tests, and T5 (caller). `getAdvice(blastId, now?)` matches its callers in T5 tests and T6 controller. Window/hour formatting (`days[0]..days[last]`, 12-hour clock) is identical in the service `formatWindow` (T5) and the web `windowLabel` (T9).

**Open risks (from the spec, carried forward):** the demo `seed-analytics` generator may concentrate reads at one time-of-day, so the card could look flat; tune if the demo needs variety (spec open question #1). Thresholds (30/100/400, ±1h, REPLY_WEIGHT=3, 0.7 weekday concentration) are starting values — adjust against real/seeded data.
