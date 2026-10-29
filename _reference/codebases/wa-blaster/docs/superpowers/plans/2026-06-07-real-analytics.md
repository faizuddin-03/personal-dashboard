# Real Analytics (Performance + Dashboard) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the seed-backed charts on `Performance.tsx` and `Dashboard.tsx` with real aggregation endpoints over existing Prisma data, plus a demo-data generator so the charts populate on a fresh DB.

**Architecture:** A new NestJS `AnalyticsModule` (`apps/api/src/analytics/`) exposes six JWT-guarded, date-ranged `GET /analytics/*` endpoints. **Implementation refinement vs spec:** the spec mentioned raw SQL for joins/time-series; this plan instead uses Prisma queries (`groupBy`/`count`/`findMany`) + small in-service JS aggregation. Same endpoints, same response shapes — but unit-testable with the codebase's mocked-Prisma pattern and free of Postgres-specific SQL/timezone pitfalls (day bucketing uses a fixed UTC+8 helper for Asia/Kuala_Lumpur). A deterministic, idempotent generator (`prisma/seed-analytics.ts`) seeds ~90 days of `Message`/`AutopilotEvent`/`Ticket` rows. The frontend gets a typed `api/analytics.ts` client and wires both pages via react-query, keeping all existing chart components untouched.

**Tech Stack:** NestJS 10, Prisma 5 (Postgres), Jest + ts-jest (unit, mocked Prisma), Vite + React + TypeScript, @tanstack/react-query, axios, Playwright (e2e).

**Spec:** `docs/superpowers/specs/2026-06-07-real-analytics-design.md`

---

## Conventions (read once before starting)

- **Backend unit tests mock Prisma.** Construct the service directly: `new AnalyticsService(prisma as any)` where `prisma` is an object of `jest.fn()`s. No test database. See `apps/api/src/tickets/__tests__/tickets.service.spec.ts`.
- **Run a single backend test:** `pnpm --filter api test -- analytics` (Jest `testRegex` is `.*\.spec\.ts$`; the arg filters by path).
- **All endpoints are under the global prefix `/api`** (`main.ts:26`) and behind `JwtAuthGuard`.
- **`PrismaService` is `@Global`** (`prisma.module.ts`), so `AnalyticsModule` only imports `AuthModule`.
- **Frontend has no component unit tests** — frontend tasks are verified by `pnpm --filter web build` (typecheck) and the Playwright e2e in Task 11.
- **Commit after every task.** We are on branch `feat/eauto-frontend-shell` (do not create a new branch unless asked).

---

## Shared types (defined in Task 1, referenced everywhere)

```ts
// apps/api/src/analytics/analytics.util.ts
export type Range = '7d' | '30d' | '90d';
```

Response shapes returned by the service (mirrored by the web client in Task 8):

```ts
// kpis
{ delivered: Metric; deliveryRate: Metric; readRate: Metric; replyRate: Metric;
  autoHandleRate: Metric; sentToday: Metric; costToday: Metric }
// where Metric = { value: number; deltaPct: number; spark?: number[]; estimated?: boolean }

// delivery
{ funnel: { sent; delivered; read; replied };
  byState: { state: string; rate: number }[];
  byVehicle: { vehicle: string; rate: number }[];
  topTemplates: { templateId: string; name: string; language: string; sent: number; replied: number; replyRate: number }[] }

// volume
{ byDay: { date: string; sent: number; delivered: number; replied: number }[] }

// autopilot
{ autoHandleRate: number; trend: { date: string; rate: number }[];
  handling: { autoReplied: number; escalated: number; resolvedByTeam: number };
  topIntents: { intent: string; count: number }[] }

// escalation
{ rate: number; deltaPct: number; opened: number; closed: number; openRemaining: number;
  avgCloseMs: number | null; trend: { date: string; rate: number }[];
  byReason: { reason: string; count: number }[];
  responseTimeByDay: { date: string; avgMinutes: number | null }[] }

// audience
{ byState: { state: string; count: number }[]; byVehicle: { vehicle: string; count: number }[] }
```

---

## Task 1: Module skeleton + date utils + `audience` endpoint

Proves module wiring + auth end-to-end against data that already exists (the 12 seeded dealers).

**Files:**
- Create: `apps/api/src/analytics/analytics.util.ts`
- Create: `apps/api/src/analytics/dto/range.dto.ts`
- Create: `apps/api/src/analytics/analytics.service.ts`
- Create: `apps/api/src/analytics/analytics.controller.ts`
- Create: `apps/api/src/analytics/analytics.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.util.spec.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.service.spec.ts`

- [ ] **Step 1: Write failing util tests**

```ts
// apps/api/src/analytics/__tests__/analytics.util.spec.ts
import { rangeDays, klDayKey, lastNDayKeys, pctDelta, rate } from '../analytics.util';

describe('analytics.util', () => {
  it('rangeDays maps the three ranges', () => {
    expect(rangeDays('7d')).toBe(7);
    expect(rangeDays('30d')).toBe(30);
    expect(rangeDays('90d')).toBe(90);
  });

  it('klDayKey buckets by Asia/Kuala_Lumpur (UTC+8) day', () => {
    // 2026-06-07T20:00Z is 2026-06-08 04:00 in KL → bucket 2026-06-08
    expect(klDayKey(new Date('2026-06-07T20:00:00Z'))).toBe('2026-06-08');
    // 2026-06-07T10:00Z is 2026-06-07 18:00 KL → bucket 2026-06-07
    expect(klDayKey(new Date('2026-06-07T10:00:00Z'))).toBe('2026-06-07');
  });

  it('lastNDayKeys returns N ascending KL day keys ending today', () => {
    const now = new Date('2026-06-07T10:00:00Z'); // KL 2026-06-07
    expect(lastNDayKeys(3, now)).toEqual(['2026-06-05', '2026-06-06', '2026-06-07']);
  });

  it('pctDelta computes rounded percent change, guarding divide-by-zero', () => {
    expect(pctDelta(110, 100)).toBe(10);
    expect(pctDelta(0, 0)).toBe(0);
    expect(pctDelta(5, 0)).toBe(100);
  });

  it('rate is part/whole as a 1-decimal percentage, 0 when whole is 0', () => {
    expect(rate(1, 4)).toBe(25);
    expect(rate(1, 3)).toBe(33.3);
    expect(rate(5, 0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter api test -- analytics.util`
Expected: FAIL — "Cannot find module '../analytics.util'".

- [ ] **Step 3: Implement the utils**

```ts
// apps/api/src/analytics/analytics.util.ts
export type Range = '7d' | '30d' | '90d';

const DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };
export const rangeDays = (r: Range): number => DAYS[r];

const KL_OFFSET_MS = 8 * 60 * 60 * 1000; // Asia/Kuala_Lumpur, no DST

/** YYYY-MM-DD of the date in Asia/Kuala_Lumpur. */
export function klDayKey(d: Date): string {
  return new Date(d.getTime() + KL_OFFSET_MS).toISOString().slice(0, 10);
}

/** N ascending KL day keys ending on `now`'s KL day. */
export function lastNDayKeys(n: number, now: Date): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(klDayKey(new Date(now.getTime() - i * 86_400_000)));
  }
  return keys;
}

/** Percent change cur vs prev, 1-decimal; 0 if both 0, 100 if prev 0. */
export function pctDelta(cur: number, prev: number): number {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

/** part/whole as a 1-decimal percentage; 0 when whole is 0. */
export function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}
```

- [ ] **Step 4: Run util test, verify pass**

Run: `pnpm --filter api test -- analytics.util`
Expected: PASS (5 tests).

- [ ] **Step 5: Write failing service test for `audience`**

```ts
// apps/api/src/analytics/__tests__/analytics.service.spec.ts
import { AnalyticsService } from '../analytics.service';

function makePrisma() {
  return {
    contact: { groupBy: jest.fn(), findMany: jest.fn() },
    message: { count: jest.fn(), findMany: jest.fn(), groupBy: jest.fn() },
    template: { findMany: jest.fn() },
    autopilotEvent: { findMany: jest.fn() },
    ticket: { findMany: jest.fn(), count: jest.fn() },
    systemSetting: { findUnique: jest.fn() },
  };
}

describe('AnalyticsService.audience', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => {
    prisma = makePrisma();
    service = new AnalyticsService(prisma as any);
  });

  it('groups contacts by state and vehicle, sorted desc', async () => {
    prisma.contact.groupBy
      .mockResolvedValueOnce([
        { state: 'JOHOR', _count: { _all: 3 } },
        { state: 'SELANGOR', _count: { _all: 5 } },
      ])
      .mockResolvedValueOnce([
        { vehicleSpecialization: 'NATIONAL', _count: { _all: 4 } },
        { vehicleSpecialization: 'EV_HYBRID', _count: { _all: 1 } },
      ]);
    const res = await service.audience();
    expect(res.byState).toEqual([
      { state: 'SELANGOR', count: 5 },
      { state: 'JOHOR', count: 3 },
    ]);
    expect(res.byVehicle[0]).toEqual({ vehicle: 'NATIONAL', count: 4 });
    expect(prisma.contact.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({ by: ['state'], where: { state: { not: null } } }),
    );
  });
});
```

- [ ] **Step 6: Run service test, verify it fails**

Run: `pnpm --filter api test -- analytics.service`
Expected: FAIL — "Cannot find module '../analytics.service'".

- [ ] **Step 7: Implement the service with `audience` only**

```ts
// apps/api/src/analytics/analytics.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Range } from './analytics.util';

const DEFAULT_COST_PER_MESSAGE_RM = 0.08;

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async audience() {
    const [byState, byVehicle] = await Promise.all([
      this.prisma.contact.groupBy({
        by: ['state'],
        where: { state: { not: null } },
        _count: { _all: true },
      }),
      this.prisma.contact.groupBy({
        by: ['vehicleSpecialization'],
        where: { vehicleSpecialization: { not: null } },
        _count: { _all: true },
      }),
    ]);
    return {
      byState: byState
        .map((g: any) => ({ state: g.state, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
      byVehicle: byVehicle
        .map((g: any) => ({ vehicle: g.vehicleSpecialization, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
    };
  }
}

// Exported for tasks 3-7
export { DEFAULT_COST_PER_MESSAGE_RM };
```

- [ ] **Step 8: Run service test, verify pass**

Run: `pnpm --filter api test -- analytics.service`
Expected: PASS.

- [ ] **Step 9: Create the DTO, controller, and module**

```ts
// apps/api/src/analytics/dto/range.dto.ts
import { IsEnum, IsOptional } from 'class-validator';

export class RangeDto {
  @IsOptional() @IsEnum(['7d', '30d', '90d'])
  range: '7d' | '30d' | '90d' = '30d';
}
```

```ts
// apps/api/src/analytics/analytics.controller.ts
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { RangeDto } from './dto/range.dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('audience')
  audience() {
    return this.analytics.audience();
  }
  // delivery/volume/autopilot/escalation/kpis routes added in tasks 3-7
}
```

```ts
// apps/api/src/analytics/analytics.module.ts
import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // JwtAuthGuard; PrismaService is @Global
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
```

- [ ] **Step 10: Register the module in `app.module.ts`**

In `apps/api/src/app.module.ts`, add the import near the other module imports (after line 19) and add `AnalyticsModule` to the `imports` array (after `TicketsModule,` at line 39):

```ts
import { AnalyticsModule } from './analytics/analytics.module';
```
```ts
    TicketsModule,
    AnalyticsModule,
```

- [ ] **Step 11: Verify the API compiles**

Run: `pnpm --filter api build`
Expected: Build succeeds (no TS errors).

- [ ] **Step 12: Commit**

```bash
git add apps/api/src/analytics apps/api/src/app.module.ts
git commit -m "feat(api): analytics module skeleton + audience endpoint + date utils"
```

---

## Task 2: Demo-data generator + cost setting + scripts

A deterministic, idempotent script that seeds ~90 days of historical messages, autopilot events, and tickets so every endpoint returns realistic data.

**Files:**
- Create: `apps/api/prisma/seed-analytics.ts`
- Modify: `apps/api/prisma/seed.ts` (seed the `cost_per_message_rm` setting)
- Modify: `apps/api/package.json` (add `db:seed:analytics`)
- Modify: `package.json` (root passthrough)

- [ ] **Step 1: Seed the cost setting in `seed.ts`**

In `apps/api/prisma/seed.ts`, inside the `autopilotDefaults` block area (after line 209, before the knowledge seeding at line 211), add:

```ts
  const costSetting = await prisma.systemSetting.findUnique({ where: { key: 'cost_per_message_rm' } });
  if (!costSetting) {
    await prisma.systemSetting.create({ data: { key: 'cost_per_message_rm', value: '0.08' } });
    console.log('Seeded cost_per_message_rm = 0.08.');
  }
```

- [ ] **Step 2: Write the generator**

```ts
// apps/api/prisma/seed-analytics.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── deterministic PRNG (LCG) so runs are reproducible ───────────────────────
let _seed = 1234567;
const rnd = () => { _seed = (_seed * 1103515245 + 12345) & 0x7fffffff; return _seed / 0x7fffffff; };
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const chance = (p: number) => rnd() < p;
const intBetween = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));

const DAYS = 90;
const INTENTS = ['transfer_support', 'credit_topup', 'roadtax_insurance', 'subscription', 'vehicle_history', 'feature_howto'];
const REASONS = ['KNOWLEDGE_GAP', 'KNOWLEDGE_GAP', 'COMPLAINT', 'COMPLAINT', 'LOW_CONFIDENCE', 'SENSITIVE'] as const;

// Extra APPROVED templates so "top templates by reply rate" has rows to rank.
// replyBias drives each template's reply probability so the leaderboard differs.
const EXTRA_TEMPLATES = [
  { name: 'insurance_renewal_reminder', replyBias: 0.43 },
  { name: 'subscription_renewal', replyBias: 0.41 },
  { name: 'estms_feature_launch', replyBias: 0.38 },
  { name: 'roadtax_batch_reminder', replyBias: 0.36 },
  { name: 'service_followup', replyBias: 0.30 },
];

function startOfDayUtcMinus(daysAgo: number): Date {
  const d = new Date();
  d.setUTCHours(2, 0, 0, 0); // ~10:00 Asia/Kuala_Lumpur
  d.setUTCDate(d.getUTCDate() - daysAgo);
  return d;
}

async function main() {
  // Idempotency guard: skip if analytics data already present.
  const existingMessages = await prisma.message.count();
  if (existingMessages > 0) {
    console.log(`Analytics seed skipped — ${existingMessages} messages already exist.`);
    return;
  }

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) throw new Error('No admin user — run `pnpm db:seed` first.');

  const contacts = await prisma.contact.findMany({ select: { id: true } });
  if (contacts.length === 0) throw new Error('No contacts — run `pnpm db:seed` first.');

  // 1. Ensure the extra APPROVED templates exist (EN), capture ids + bias.
  const templates: { id: string; replyBias: number }[] = [];
  for (const t of EXTRA_TEMPLATES) {
    let row = await prisma.template.findFirst({ where: { name: t.name, language: 'EN' } });
    if (!row) {
      row = await prisma.template.create({
        data: {
          name: t.name, version: 1, language: 'EN', category: 'MARKETING',
          bodyText: `Hello {{1}}, this is the ${t.name.replace(/_/g, ' ')} message.`,
          variables: ['name'], status: 'APPROVED',
          metaTemplateId: `seed-analytics-${t.name}`, submittedAt: new Date(), approvedAt: new Date(),
          createdById: admin.id,
        },
      });
    }
    templates.push({ id: row.id, replyBias: t.replyBias });
  }

  // 2. One COMPLETED blast per template to attach historical messages to.
  const blasts: { id: string; tpl: { id: string; replyBias: number } }[] = [];
  for (const tpl of templates) {
    const t = await prisma.template.findUnique({ where: { id: tpl.id } });
    const blast = await prisma.blast.create({
      data: {
        name: `Historical · ${t!.name}`, templateName: t!.name, defaultLanguage: 'EN',
        scheduledAt: startOfDayUtcMinus(DAYS), status: 'COMPLETED',
        startedAt: startOfDayUtcMinus(DAYS), completedAt: startOfDayUtcMinus(0),
        totalRecipients: 0, uniqueContacts: 0, createdById: admin.id,
      },
    });
    blasts.push({ id: blast.id, tpl });
  }

  // 3. Messages spread across the last 90 days with a realistic funnel.
  let msgCount = 0;
  const msgData: any[] = [];
  for (let d = DAYS - 1; d >= 0; d--) {
    const day = startOfDayUtcMinus(d);
    const dow = (day.getUTCDay() + 1) % 7; // rough day-of-week
    const weekendDip = dow === 0 || dow === 6 ? 0.45 : 1;
    const trend = 1 + (DAYS - d) / DAYS * 0.4; // gentle upward trend
    const baseVolume = Math.round(intBetween(28, 46) * weekendDip * trend);
    for (let i = 0; i < baseVolume; i++) {
      const b = pick(blasts);
      const sentAt = new Date(day.getTime() + intBetween(0, 10 * 3600) * 1000);
      const delivered = chance(0.96);
      const read = delivered && chance(0.71);
      const replied = read && chance(b.tpl.replyBias);
      msgData.push({
        blastId: b.id, contactId: pick(contacts).id, templateId: b.tpl.id,
        status: replied ? 'READ' : read ? 'READ' : delivered ? 'DELIVERED' : 'SENT',
        source: 'BLAST',
        sentAt,
        deliveredAt: delivered ? new Date(sentAt.getTime() + intBetween(20, 600) * 1000) : null,
        readAt: read ? new Date(sentAt.getTime() + intBetween(600, 5400) * 1000) : null,
        repliedAt: replied ? new Date(sentAt.getTime() + intBetween(5400, 14400) * 1000) : null,
      });
      msgCount++;
    }
  }
  // chunked insert
  for (let i = 0; i < msgData.length; i += 500) {
    await prisma.message.createMany({ data: msgData.slice(i, i + 500) });
  }

  // 4. Autopilot events: rising auto-handle ratio across days.
  const evData: any[] = [];
  let evCount = 0;
  for (let d = DAYS - 1; d >= 0; d--) {
    const day = startOfDayUtcMinus(d);
    const n = intBetween(10, 22);
    const autoRatio = 0.70 + (DAYS - d) / DAYS * 0.12; // 70% → 82%
    for (let i = 0; i < n; i++) {
      const isAuto = chance(autoRatio);
      const action = isAuto ? 'AUTO_REPLIED' : chance(0.8) ? 'ESCALATED' : chance(0.5) ? 'OPTED_OUT' : 'SKIPPED';
      evData.push({
        contactId: pick(contacts).id, action,
        intent: pick(INTENTS),
        confidence: isAuto ? 0.7 + rnd() * 0.29 : 0.3 + rnd() * 0.35,
        reason: action === 'ESCALATED' ? pick(REASONS as unknown as string[]) : null,
        model: 'mock',
        createdAt: new Date(day.getTime() + intBetween(0, 10 * 3600) * 1000),
      });
      evCount++;
    }
  }
  for (let i = 0; i < evData.length; i += 500) {
    await prisma.autopilotEvent.createMany({ data: evData.slice(i, i + 500) });
  }

  // 5. Tickets: a few per week, older ones mostly closed/resolved.
  let tkCount = 0;
  for (let d = DAYS - 1; d >= 0; d--) {
    if (!chance(0.5)) continue; // ~every other day
    const day = startOfDayUtcMinus(d);
    const n = intBetween(1, 3);
    for (let i = 0; i < n; i++) {
      const openedAt = new Date(day.getTime() + intBetween(0, 8 * 3600) * 1000);
      const recent = d < 4;
      const responded = chance(0.9);
      const assignedAt = responded ? new Date(openedAt.getTime() + intBetween(2, 35) * 60000) : null;
      const closeIt = !recent && chance(0.85);
      const resolvedAt = closeIt ? new Date(openedAt.getTime() + intBetween(30, 600) * 60000) : null;
      await prisma.ticket.create({
        data: {
          contactId: pick(contacts).id,
          reason: pick(REASONS as unknown as string[]) as any,
          intent: pick(INTENTS),
          status: closeIt ? (chance(0.5) ? 'CLOSED' : 'RESOLVED') : responded ? 'IN_PROGRESS' : 'OPEN',
          assigneeId: responded ? admin.id : null,
          openedAt, assignedAt,
          resolvedAt, closedAt: closeIt ? resolvedAt : null,
          createdAt: openedAt,
        },
      });
      tkCount++;
    }
  }

  console.log(`Analytics seed complete: ${msgCount} messages, ${evCount} autopilot events, ${tkCount} tickets, ${templates.length} templates, ${blasts.length} blasts.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
```

- [ ] **Step 3: Add package scripts**

In `apps/api/package.json` `scripts`, after the `db:seed` line add:

```json
    "db:seed:analytics": "ts-node prisma/seed-analytics.ts",
```

In root `package.json` `scripts`, after the `db:seed` line add:

```json
    "db:seed:analytics": "pnpm --filter api db:seed:analytics",
```

- [ ] **Step 4: Run base seed then analytics seed against the dev DB**

Run (Postgres must be up — `docker compose up -d`):
```
pnpm db:seed
pnpm db:seed:analytics
```
Expected: prints `Analytics seed complete: <N> messages, <M> autopilot events, <K> tickets, 5 templates, 5 blasts.` with N in the low thousands.

- [ ] **Step 5: Verify idempotency**

Run: `pnpm db:seed:analytics` again.
Expected: prints `Analytics seed skipped — <N> messages already exist.` and creates nothing.

- [ ] **Step 6: Commit**

```bash
git add apps/api/prisma/seed-analytics.ts apps/api/prisma/seed.ts apps/api/package.json package.json
git commit -m "feat(api): demo-data generator for analytics + cost_per_message_rm setting"
```

---

## Task 3: `delivery` endpoint (funnel + by-audience rates + top templates)

**Files:**
- Modify: `apps/api/src/analytics/analytics.service.ts`
- Modify: `apps/api/src/analytics/analytics.controller.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.service.spec.ts`

- [ ] **Step 1: Write failing test for `delivery`**

Append to `analytics.service.spec.ts`:

```ts
describe('AnalyticsService.delivery', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('builds the funnel from status counts and computes by-state rate + top templates', async () => {
    // count() called 4x: sent, delivered, read, replied
    prisma.message.count
      .mockResolvedValueOnce(100) // sent
      .mockResolvedValueOnce(96)  // delivered
      .mockResolvedValueOnce(70)  // read
      .mockResolvedValueOnce(26); // replied
    // findMany of messages (for by-audience)
    prisma.message.findMany.mockResolvedValue([
      { contactId: 'a', deliveredAt: new Date() },
      { contactId: 'a', deliveredAt: null },
      { contactId: 'b', deliveredAt: new Date() },
    ]);
    prisma.contact.findMany.mockResolvedValue([
      { id: 'a', state: 'SELANGOR', vehicleSpecialization: 'NATIONAL' },
      { id: 'b', state: 'JOHOR', vehicleSpecialization: 'EV_HYBRID' },
    ]);
    // groupBy by templateId: sent, then replied
    prisma.message.groupBy
      .mockResolvedValueOnce([{ templateId: 't1', _count: { _all: 10 } }, { templateId: 't2', _count: { _all: 10 } }])
      .mockResolvedValueOnce([{ templateId: 't1', _count: { _all: 4 } }, { templateId: 't2', _count: { _all: 2 } }]);
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', name: 'alpha', language: 'EN' },
      { id: 't2', name: 'beta', language: 'MS' },
    ]);

    const res = await service.delivery('30d');
    expect(res.funnel).toEqual({ sent: 100, delivered: 96, read: 70, replied: 26 });
    expect(res.byState).toEqual([
      { state: 'SELANGOR', rate: 50 },  // 1 delivered of 2
      { state: 'JOHOR', rate: 100 },
    ].sort((a, b) => b.rate - a.rate));
    expect(res.topTemplates[0]).toEqual({ templateId: 't1', name: 'alpha', language: 'EN', sent: 10, replied: 4, replyRate: 40 });
    expect(res.topTemplates[1].replyRate).toBe(20);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- analytics.service`
Expected: FAIL — `service.delivery is not a function`.

- [ ] **Step 3: Implement `delivery` in the service**

Extend the util import at the top of `analytics.service.ts` (it currently imports only `Range`):

```ts
import { Range, rate, rangeDays } from './analytics.util';
```

Add the shared `since()` helper and the method inside the class:

```ts
  private since(range: Range, now = new Date()): Date {
    return new Date(now.getTime() - rangeDays(range) * 86_400_000);
  }

  async delivery(range: Range) {
    const since = this.since(range);
    const [sent, delivered, read, replied] = await Promise.all([
      this.prisma.message.count({ where: { sentAt: { gte: since } } }),
      this.prisma.message.count({ where: { sentAt: { gte: since }, deliveredAt: { not: null } } }),
      this.prisma.message.count({ where: { sentAt: { gte: since }, readAt: { not: null } } }),
      this.prisma.message.count({ where: { sentAt: { gte: since }, repliedAt: { not: null } } }),
    ]);

    const [msgs, contacts] = await Promise.all([
      this.prisma.message.findMany({ where: { sentAt: { gte: since } }, select: { contactId: true, deliveredAt: true } }),
      this.prisma.contact.findMany({ select: { id: true, state: true, vehicleSpecialization: true } }),
    ]);
    const cmap = new Map(contacts.map((c: any) => [c.id, c]));
    const stateAgg = new Map<string, { sent: number; delivered: number }>();
    const vehAgg = new Map<string, { sent: number; delivered: number }>();
    for (const m of msgs as any[]) {
      const c: any = cmap.get(m.contactId);
      if (!c) continue;
      if (c.state) {
        const a = stateAgg.get(c.state) ?? { sent: 0, delivered: 0 };
        a.sent++; if (m.deliveredAt) a.delivered++; stateAgg.set(c.state, a);
      }
      if (c.vehicleSpecialization) {
        const a = vehAgg.get(c.vehicleSpecialization) ?? { sent: 0, delivered: 0 };
        a.sent++; if (m.deliveredAt) a.delivered++; vehAgg.set(c.vehicleSpecialization, a);
      }
    }
    const byState = [...stateAgg].map(([state, a]) => ({ state, rate: rate(a.delivered, a.sent) })).sort((x, y) => y.rate - x.rate);
    const byVehicle = [...vehAgg].map(([vehicle, a]) => ({ vehicle, rate: rate(a.delivered, a.sent) })).sort((x, y) => y.rate - x.rate);

    const [sentByTpl, repliedByTpl] = await Promise.all([
      this.prisma.message.groupBy({ by: ['templateId'], where: { sentAt: { gte: since }, templateId: { not: null } }, _count: { _all: true } }),
      this.prisma.message.groupBy({ by: ['templateId'], where: { sentAt: { gte: since }, templateId: { not: null }, repliedAt: { not: null } }, _count: { _all: true } }),
    ]);
    const repliedMap = new Map((repliedByTpl as any[]).map((g) => [g.templateId, g._count._all]));
    const tplIds = (sentByTpl as any[]).map((g) => g.templateId).filter(Boolean);
    const tpls = await this.prisma.template.findMany({ where: { id: { in: tplIds } }, select: { id: true, name: true, language: true } });
    const tmap = new Map((tpls as any[]).map((t) => [t.id, t]));
    const topTemplates = (sentByTpl as any[])
      .map((g) => {
        const sentN = g._count._all;
        const repliedN = repliedMap.get(g.templateId) ?? 0;
        const t: any = tmap.get(g.templateId);
        return { templateId: g.templateId, name: t?.name ?? 'unknown', language: t?.language ?? 'EN', sent: sentN, replied: repliedN, replyRate: rate(repliedN, sentN) };
      })
      .sort((a, b) => b.replyRate - a.replyRate)
      .slice(0, 5);

    return { funnel: { sent, delivered, read, replied }, byState, byVehicle, topTemplates };
  }
```

> Note: `since()` is shared by tasks 4-7; it is defined once here. Tasks 4-7 reuse it.

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- analytics.service`
Expected: PASS (audience + delivery).

- [ ] **Step 5: Add the controller route**

In `analytics.controller.ts`, add after the `audience()` method:

```ts
  @Get('delivery')
  delivery(@Query() q: RangeDto) {
    return this.analytics.delivery(q.range);
  }
```

- [ ] **Step 6: Build + commit**

Run: `pnpm --filter api build` (expect success).
```bash
git add apps/api/src/analytics
git commit -m "feat(api): GET /analytics/delivery (funnel, by-audience rates, top templates)"
```

---

## Task 4: `volume` endpoint (sent/delivered/replied by day)

**Files:**
- Modify: `apps/api/src/analytics/analytics.service.ts`
- Modify: `apps/api/src/analytics/analytics.controller.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.service.spec.ts`

- [ ] **Step 1: Write failing test for `volume`**

Append to `analytics.service.spec.ts`:

```ts
describe('AnalyticsService.volume', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('buckets messages by KL send-day, zero-filling the window', async () => {
    const now = new Date('2026-06-07T10:00:00Z'); // KL 2026-06-07
    prisma.message.findMany.mockResolvedValue([
      { sentAt: new Date('2026-06-07T03:00:00Z'), deliveredAt: new Date(), repliedAt: new Date() }, // 2026-06-07
      { sentAt: new Date('2026-06-06T05:00:00Z'), deliveredAt: new Date(), repliedAt: null },        // 2026-06-06
      { sentAt: new Date('2026-06-06T06:00:00Z'), deliveredAt: null, repliedAt: null },              // 2026-06-06
    ]);
    const res = await service.volume('7d', now);
    expect(res.byDay).toHaveLength(7);
    const last = res.byDay[res.byDay.length - 1];
    expect(last).toEqual({ date: '2026-06-07', sent: 1, delivered: 1, replied: 1 });
    const prev = res.byDay[res.byDay.length - 2];
    expect(prev).toEqual({ date: '2026-06-06', sent: 2, delivered: 1, replied: 0 });
    expect(res.byDay[0]).toEqual(expect.objectContaining({ sent: 0, delivered: 0, replied: 0 }));
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- analytics.service`
Expected: FAIL — `service.volume is not a function`.

- [ ] **Step 3: Implement `volume`**

Extend the util import at the top of `analytics.service.ts`:

```ts
import { Range, rate, rangeDays, klDayKey, lastNDayKeys } from './analytics.util';
```

Add the method:

```ts
  async volume(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const rows = await this.prisma.message.findMany({
      where: { sentAt: { gte: since } },
      select: { sentAt: true, deliveredAt: true, repliedAt: true },
    });
    const keys = lastNDayKeys(rangeDays(range), now);
    const map = new Map(keys.map((k) => [k, { date: k, sent: 0, delivered: 0, replied: 0 }]));
    for (const r of rows as any[]) {
      if (!r.sentAt) continue;
      const b = map.get(klDayKey(r.sentAt));
      if (!b) continue;
      b.sent++; if (r.deliveredAt) b.delivered++; if (r.repliedAt) b.replied++;
    }
    return { byDay: keys.map((k) => map.get(k)!) };
  }
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- analytics.service`
Expected: PASS.

- [ ] **Step 5: Add the controller route**

```ts
  @Get('volume')
  volume(@Query() q: RangeDto) {
    return this.analytics.volume(q.range);
  }
```

- [ ] **Step 6: Build + commit**

Run: `pnpm --filter api build`.
```bash
git add apps/api/src/analytics
git commit -m "feat(api): GET /analytics/volume (sent/delivered/replied by day)"
```

---

## Task 5: `autopilot` endpoint (auto-handle rate + trend + handling + top intents)

**Files:**
- Modify: `apps/api/src/analytics/analytics.service.ts`
- Modify: `apps/api/src/analytics/analytics.controller.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.service.spec.ts`

- [ ] **Step 1: Write failing test for `autopilot`**

Append to `analytics.service.spec.ts`:

```ts
describe('AnalyticsService.autopilot', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('computes auto-handle rate, handling breakdown, and top intents', async () => {
    const now = new Date('2026-06-07T10:00:00Z');
    prisma.autopilotEvent.findMany.mockResolvedValue([
      { action: 'AUTO_REPLIED', intent: 'transfer_support', createdAt: new Date('2026-06-07T03:00:00Z') },
      { action: 'AUTO_REPLIED', intent: 'transfer_support', createdAt: new Date('2026-06-07T04:00:00Z') },
      { action: 'ESCALATED', intent: 'credit_topup', createdAt: new Date('2026-06-07T05:00:00Z') },
      { action: 'OPTED_OUT', intent: null, createdAt: new Date('2026-06-06T05:00:00Z') },
    ]);
    prisma.ticket.count.mockResolvedValue(7); // resolvedByTeam
    const res = await service.autopilot('30d', now);
    expect(res.autoHandleRate).toBe(50); // 2 auto of 4
    expect(res.handling).toEqual({ autoReplied: 2, escalated: 1, resolvedByTeam: 7 });
    expect(res.topIntents[0]).toEqual({ intent: 'transfer_support', count: 2 });
    const today = res.trend[res.trend.length - 1];
    expect(today).toEqual({ date: '2026-06-07', rate: 66.7 }); // 2 auto of 3 that day
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- analytics.service`
Expected: FAIL — `service.autopilot is not a function`.

- [ ] **Step 3: Implement `autopilot`**

```ts
  async autopilot(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const events = await this.prisma.autopilotEvent.findMany({
      where: { createdAt: { gte: since } },
      select: { action: true, intent: true, createdAt: true },
    });
    let autoReplied = 0, escalated = 0;
    const intentCounts = new Map<string, number>();
    const keys = lastNDayKeys(rangeDays(range), now);
    const trendMap = new Map(keys.map((k) => [k, { auto: 0, total: 0 }]));
    for (const e of events as any[]) {
      if (e.action === 'AUTO_REPLIED') autoReplied++;
      if (e.action === 'ESCALATED') escalated++;
      if (e.intent) intentCounts.set(e.intent, (intentCounts.get(e.intent) ?? 0) + 1);
      const t = trendMap.get(klDayKey(e.createdAt));
      if (t) { t.total++; if (e.action === 'AUTO_REPLIED') t.auto++; }
    }
    const resolvedByTeam = await this.prisma.ticket.count({
      where: { status: { in: ['RESOLVED', 'CLOSED'] }, resolvedAt: { gte: since } },
    });
    return {
      autoHandleRate: rate(autoReplied, events.length),
      trend: keys.map((k) => { const t = trendMap.get(k)!; return { date: k, rate: rate(t.auto, t.total) }; }),
      handling: { autoReplied, escalated, resolvedByTeam },
      topIntents: [...intentCounts].map(([intent, count]) => ({ intent, count })).sort((a, b) => b.count - a.count).slice(0, 6),
    };
  }
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- analytics.service`
Expected: PASS.

- [ ] **Step 5: Add the controller route**

```ts
  @Get('autopilot')
  autopilot(@Query() q: RangeDto) {
    return this.analytics.autopilot(q.range);
  }
```

- [ ] **Step 6: Build + commit**

Run: `pnpm --filter api build`.
```bash
git add apps/api/src/analytics
git commit -m "feat(api): GET /analytics/autopilot (auto-handle rate, trend, handling, top intents)"
```

---

## Task 6: `escalation` endpoint (rate/delta/trend/by-reason/avg-close/response-time)

**Files:**
- Modify: `apps/api/src/analytics/analytics.service.ts`
- Modify: `apps/api/src/analytics/analytics.controller.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.service.spec.ts`

- [ ] **Step 1: Write failing test for `escalation`**

Append to `analytics.service.spec.ts`:

```ts
describe('AnalyticsService.escalation', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('computes resolution rate, by-reason, avg close, and response-time by day', async () => {
    const now = new Date('2026-06-07T10:00:00Z');
    const openedToday = new Date('2026-06-07T01:00:00Z'); // KL 2026-06-07 09:00
    // current-window tickets (findMany #1)
    prisma.ticket.findMany
      .mockResolvedValueOnce([
        { status: 'CLOSED', reason: 'KNOWLEDGE_GAP', openedAt: openedToday,
          assignedAt: new Date(openedToday.getTime() + 10 * 60000), resolvedAt: new Date(openedToday.getTime() + 60 * 60000), closedAt: new Date(openedToday.getTime() + 60 * 60000) },
        { status: 'OPEN', reason: 'COMPLAINT', openedAt: openedToday, assignedAt: null, resolvedAt: null, closedAt: null },
      ])
      // previous-window tickets (findMany #2)
      .mockResolvedValueOnce([{ status: 'CLOSED' }, { status: 'OPEN' }]);
    const res = await service.escalation('30d', now);
    expect(res.opened).toBe(2);
    expect(res.closed).toBe(1);
    expect(res.openRemaining).toBe(1);
    expect(res.rate).toBe(50);          // 1 closed of 2
    expect(res.deltaPct).toBe(0);       // prev rate also 50
    expect(res.avgCloseMs).toBe(60 * 60 * 1000);
    expect(res.byReason).toEqual([{ reason: 'KNOWLEDGE_GAP', count: 1 }]);
    const todayResp = res.responseTimeByDay[res.responseTimeByDay.length - 1];
    expect(todayResp).toEqual({ date: '2026-06-07', avgMinutes: 10 });
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- analytics.service`
Expected: FAIL — `service.escalation is not a function`.

- [ ] **Step 3: Implement `escalation`**

Add a `prevWindow` helper next to `since()`:

```ts
  private prevWindow(range: Range, now = new Date()): { start: Date; end: Date } {
    const days = rangeDays(range);
    const end = new Date(now.getTime() - days * 86_400_000);
    return { start: new Date(end.getTime() - days * 86_400_000), end };
  }
```

Add the method:

```ts
  async escalation(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const prev = this.prevWindow(range, now);
    const tickets = await this.prisma.ticket.findMany({
      where: { openedAt: { gte: since } },
      select: { status: true, reason: true, openedAt: true, assignedAt: true, resolvedAt: true, closedAt: true },
    });
    const isClosed = (s: string) => s === 'RESOLVED' || s === 'CLOSED';
    const opened = tickets.length;
    const closedList = (tickets as any[]).filter((t) => isClosed(t.status));
    const closed = closedList.length;
    const openRemaining = (tickets as any[]).filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
    const currentRate = rate(closed, opened);

    const prevTickets = await this.prisma.ticket.findMany({
      where: { openedAt: { gte: prev.start, lt: prev.end } },
      select: { status: true },
    });
    const prevClosed = (prevTickets as any[]).filter((t) => isClosed(t.status)).length;
    const deltaPct = Math.round((currentRate - rate(prevClosed, prevTickets.length)) * 10) / 10;

    const durations = closedList
      .map((t) => { const end = t.resolvedAt ?? t.closedAt; return end && t.openedAt ? new Date(end).getTime() - new Date(t.openedAt).getTime() : null; })
      .filter((x): x is number => x != null && x >= 0);
    const avgCloseMs = durations.length ? Math.round(durations.reduce((s, x) => s + x, 0) / durations.length) : null;

    const reasonCounts = new Map<string, number>();
    for (const t of closedList) reasonCounts.set(t.reason, (reasonCounts.get(t.reason) ?? 0) + 1);
    const byReason = [...reasonCounts].map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);

    const keys = lastNDayKeys(rangeDays(range), now);
    const trendMap = new Map(keys.map((k) => [k, { opened: 0, closed: 0 }]));
    const respMap = new Map<string, number[]>(keys.map((k) => [k, []]));
    for (const t of tickets as any[]) {
      const k = klDayKey(t.openedAt);
      const tr = trendMap.get(k);
      if (tr) { tr.opened++; if (isClosed(t.status)) tr.closed++; }
      if (t.assignedAt && t.openedAt) {
        const mins = (new Date(t.assignedAt).getTime() - new Date(t.openedAt).getTime()) / 60000;
        const arr = respMap.get(k);
        if (arr && mins >= 0) arr.push(mins);
      }
    }
    return {
      rate: currentRate, deltaPct, opened, closed, openRemaining, avgCloseMs,
      trend: keys.map((k) => { const tr = trendMap.get(k)!; return { date: k, rate: rate(tr.closed, tr.opened) }; }),
      byReason,
      responseTimeByDay: keys.map((k) => { const arr = respMap.get(k)!; return { date: k, avgMinutes: arr.length ? Math.round(arr.reduce((s, x) => s + x, 0) / arr.length) : null }; }),
    };
  }
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- analytics.service`
Expected: PASS.

- [ ] **Step 5: Add the controller route**

```ts
  @Get('escalation')
  escalation(@Query() q: RangeDto) {
    return this.analytics.escalation(q.range);
  }
```

- [ ] **Step 6: Build + commit**

Run: `pnpm --filter api build`.
```bash
git add apps/api/src/analytics
git commit -m "feat(api): GET /analytics/escalation (rate, trend, by-reason, avg-close, response-time)"
```

---

## Task 7: `kpis` endpoint (KPI strips + sparklines + cost estimate)

**Files:**
- Modify: `apps/api/src/analytics/analytics.service.ts`
- Modify: `apps/api/src/analytics/analytics.controller.ts`
- Test: `apps/api/src/analytics/__tests__/analytics.service.spec.ts`

- [ ] **Step 1: Write failing test for `kpis`**

Append to `analytics.service.spec.ts`:

```ts
describe('AnalyticsService.kpis', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: AnalyticsService;
  beforeEach(() => { prisma = makePrisma(); service = new AnalyticsService(prisma as any); });

  it('computes range totals, deltas, today figures, sparklines, and est. cost', async () => {
    const now = new Date('2026-06-07T10:00:00Z');
    // count() order: cur sent/delivered/read/replied, then prev sent/delivered/read/replied
    prisma.message.count
      .mockResolvedValueOnce(100).mockResolvedValueOnce(96).mockResolvedValueOnce(70).mockResolvedValueOnce(26)
      .mockResolvedValueOnce(80).mockResolvedValueOnce(76).mockResolvedValueOnce(55).mockResolvedValueOnce(18);
    // autopilotEvent.findMany: cur then prev
    prisma.autopilotEvent.findMany
      .mockResolvedValueOnce([{ action: 'AUTO_REPLIED' }, { action: 'AUTO_REPLIED' }, { action: 'ESCALATED' }])
      .mockResolvedValueOnce([{ action: 'AUTO_REPLIED' }, { action: 'ESCALATED' }]);
    // spark messages (last 12 days). One delivered+read today.
    prisma.message.findMany.mockResolvedValue([
      { sentAt: new Date('2026-06-07T03:00:00Z'), deliveredAt: new Date(), readAt: new Date() },
    ]);
    prisma.systemSetting.findUnique.mockResolvedValue({ key: 'cost_per_message_rm', value: '0.10' });

    const res = await service.kpis('30d', now);
    expect(res.delivered.value).toBe(96);
    expect(res.delivered.deltaPct).toBe(pctOf(96, 76));
    expect(res.deliveryRate.value).toBe(96);  // 96/100
    expect(res.autoHandleRate.value).toBe(66.7); // 2 of 3
    expect(res.sentToday.value).toBe(1);
    expect(res.costToday.value).toBe(0.1); // 1 delivered today * 0.10
    expect(res.costToday.estimated).toBe(true);
    expect(res.delivered.spark).toHaveLength(12);
  });
});

function pctOf(cur: number, prev: number) { return Math.round(((cur - prev) / prev) * 1000) / 10; }
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- analytics.service`
Expected: FAIL — `service.kpis is not a function`.

- [ ] **Step 3: Implement `kpis`**

Extend the util import with `pctDelta`:

```ts
import { Range, rate, rangeDays, klDayKey, lastNDayKeys, pctDelta } from './analytics.util';
```

Add the method (uses the module-level `DEFAULT_COST_PER_MESSAGE_RM` already defined in Task 1):

```ts
  async kpis(range: Range, now = new Date()) {
    const since = this.since(range, now);
    const prev = this.prevWindow(range, now);
    const cnt = (where: any) => this.prisma.message.count({ where });
    const [sc, dc, rc, pc] = await Promise.all([
      cnt({ sentAt: { gte: since } }),
      cnt({ sentAt: { gte: since }, deliveredAt: { not: null } }),
      cnt({ sentAt: { gte: since }, readAt: { not: null } }),
      cnt({ sentAt: { gte: since }, repliedAt: { not: null } }),
    ]);
    const [sp, dp, rp, pp] = await Promise.all([
      cnt({ sentAt: { gte: prev.start, lt: prev.end } }),
      cnt({ sentAt: { gte: prev.start, lt: prev.end }, deliveredAt: { not: null } }),
      cnt({ sentAt: { gte: prev.start, lt: prev.end }, readAt: { not: null } }),
      cnt({ sentAt: { gte: prev.start, lt: prev.end }, repliedAt: { not: null } }),
    ]);
    const [evCur, evPrev] = await Promise.all([
      this.prisma.autopilotEvent.findMany({ where: { createdAt: { gte: since } }, select: { action: true } }),
      this.prisma.autopilotEvent.findMany({ where: { createdAt: { gte: prev.start, lt: prev.end } }, select: { action: true } }),
    ]);
    const ahCur = rate((evCur as any[]).filter((e) => e.action === 'AUTO_REPLIED').length, evCur.length);
    const ahPrev = rate((evPrev as any[]).filter((e) => e.action === 'AUTO_REPLIED').length, evPrev.length);

    const sparkDays = 12;
    const since12 = new Date(now.getTime() - sparkDays * 86_400_000);
    const rows = await this.prisma.message.findMany({ where: { sentAt: { gte: since12 } }, select: { sentAt: true, deliveredAt: true, readAt: true } });
    const keys = lastNDayKeys(sparkDays, now);
    const sentS = new Map(keys.map((k) => [k, 0]));
    const delS = new Map(keys.map((k) => [k, 0]));
    const readS = new Map(keys.map((k) => [k, 0]));
    for (const r of rows as any[]) {
      if (!r.sentAt) continue;
      const k = klDayKey(r.sentAt);
      if (sentS.has(k)) sentS.set(k, sentS.get(k)! + 1);
      if (r.deliveredAt && delS.has(k)) delS.set(k, delS.get(k)! + 1);
      if (r.readAt && readS.has(k)) readS.set(k, readS.get(k)! + 1);
    }
    const todayK = klDayKey(now);
    const yK = klDayKey(new Date(now.getTime() - 86_400_000));
    const setting = await this.prisma.systemSetting.findUnique({ where: { key: 'cost_per_message_rm' } });
    const costRate = setting ? Number(setting.value) : DEFAULT_COST_PER_MESSAGE_RM;
    const costToday = Math.round((delS.get(todayK) ?? 0) * costRate * 100) / 100;
    const costY = Math.round((delS.get(yK) ?? 0) * costRate * 100) / 100;
    const spark = (m: Map<string, number>) => keys.map((k) => m.get(k) ?? 0);
    const rateDelta = (cn: number, cd: number, pn: number, pd: number) => Math.round((rate(cn, cd) - rate(pn, pd)) * 10) / 10;

    return {
      delivered: { value: dc, deltaPct: pctDelta(dc, dp), spark: spark(delS) },
      deliveryRate: { value: rate(dc, sc), deltaPct: rateDelta(dc, sc, dp, sp), spark: spark(delS) },
      readRate: { value: rate(rc, dc), deltaPct: rateDelta(rc, dc, rp, dp), spark: spark(readS) },
      replyRate: { value: rate(pc, dc), deltaPct: rateDelta(pc, dc, pp, dp) },
      autoHandleRate: { value: ahCur, deltaPct: Math.round((ahCur - ahPrev) * 10) / 10 },
      sentToday: { value: sentS.get(todayK) ?? 0, deltaPct: pctDelta(sentS.get(todayK) ?? 0, sentS.get(yK) ?? 0), spark: spark(sentS) },
      costToday: { value: costToday, deltaPct: pctDelta(costToday, costY), spark: spark(delS), estimated: true },
    };
  }
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- analytics.service`
Expected: PASS (all six describe blocks).

- [ ] **Step 5: Add the controller route**

```ts
  @Get('kpis')
  kpis(@Query() q: RangeDto) {
    return this.analytics.kpis(q.range);
  }
```

- [ ] **Step 6: Build, run full API test suite, commit**

Run: `pnpm --filter api build` then `pnpm --filter api test`
Expected: build succeeds; all tests pass (existing + new analytics).
```bash
git add apps/api/src/analytics
git commit -m "feat(api): GET /analytics/kpis (KPI strips, sparklines, est. cost)"
```

- [ ] **Step 7: Smoke-test the live endpoints (manual)**

With Postgres up, API running (`pnpm --filter api dev`) and seeded (`pnpm db:seed && pnpm db:seed:analytics`), log in to get a token then:
```
curl -s -H "Authorization: Bearer <token>" "http://localhost:3000/api/analytics/kpis?range=30d" | head
curl -s -H "Authorization: Bearer <token>" "http://localhost:3000/api/analytics/delivery?range=30d" | head
```
Expected: JSON with non-zero numbers (not all zeros). (Skippable if running the e2e in Task 11.)

---

## Task 8: Web analytics API client

**Files:**
- Create: `apps/web/src/api/analytics.ts`

- [ ] **Step 1: Implement the typed client**

```ts
// apps/web/src/api/analytics.ts
import { api } from './client';

export type Range = '7d' | '30d' | '90d';

export interface Metric { value: number; deltaPct: number; spark?: number[]; estimated?: boolean }

export interface KpisResponse {
  delivered: Metric; deliveryRate: Metric; readRate: Metric; replyRate: Metric;
  autoHandleRate: Metric; sentToday: Metric; costToday: Metric;
}
export interface DeliveryResponse {
  funnel: { sent: number; delivered: number; read: number; replied: number };
  byState: { state: string; rate: number }[];
  byVehicle: { vehicle: string; rate: number }[];
  topTemplates: { templateId: string; name: string; language: string; sent: number; replied: number; replyRate: number }[];
}
export interface VolumeResponse { byDay: { date: string; sent: number; delivered: number; replied: number }[] }
export interface AutopilotResponse {
  autoHandleRate: number;
  trend: { date: string; rate: number }[];
  handling: { autoReplied: number; escalated: number; resolvedByTeam: number };
  topIntents: { intent: string; count: number }[];
}
export interface EscalationResponse {
  rate: number; deltaPct: number; opened: number; closed: number; openRemaining: number;
  avgCloseMs: number | null;
  trend: { date: string; rate: number }[];
  byReason: { reason: string; count: number }[];
  responseTimeByDay: { date: string; avgMinutes: number | null }[];
}
export interface AudienceResponse {
  byState: { state: string; count: number }[];
  byVehicle: { vehicle: string; count: number }[];
}

export const getKpis = (range: Range) =>
  api.get<KpisResponse>('/analytics/kpis', { params: { range } }).then((r) => r.data);
export const getDelivery = (range: Range) =>
  api.get<DeliveryResponse>('/analytics/delivery', { params: { range } }).then((r) => r.data);
export const getVolume = (range: Range) =>
  api.get<VolumeResponse>('/analytics/volume', { params: { range } }).then((r) => r.data);
export const getAutopilot = (range: Range) =>
  api.get<AutopilotResponse>('/analytics/autopilot', { params: { range } }).then((r) => r.data);
export const getEscalation = (range: Range) =>
  api.get<EscalationResponse>('/analytics/escalation', { params: { range } }).then((r) => r.data);
export const getAudience = () =>
  api.get<AudienceResponse>('/analytics/audience').then((r) => r.data);
```

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter web build`
Expected: build succeeds.
```bash
git add apps/web/src/api/analytics.ts
git commit -m "feat(web): typed analytics API client"
```

---

## Task 9: Label helpers + wire `Performance.tsx`

**Files:**
- Create: `apps/web/src/lib/analyticsLabels.ts`
- Modify: `apps/web/src/pages/Performance.tsx`

> If `apps/web/src/pages/Dealers.tsx` already exports state/vehicle label maps, import those instead of duplicating; otherwise create the file below.

- [ ] **Step 1: Create label helpers**

```ts
// apps/web/src/lib/analyticsLabels.ts
export const STATE_LABEL: Record<string, string> = {
  JOHOR: 'Johor', KEDAH: 'Kedah', KELANTAN: 'Kelantan', MELAKA: 'Melaka',
  NEGERI_SEMBILAN: 'Negeri Sembilan', PAHANG: 'Pahang', PENANG: 'Penang',
  PERAK: 'Perak', PERLIS: 'Perlis', SABAH: 'Sabah', SARAWAK: 'Sarawak',
  SELANGOR: 'Selangor', TERENGGANU: 'Terengganu', KUALA_LUMPUR: 'Kuala Lumpur',
  LABUAN: 'Labuan', PUTRAJAYA: 'Putrajaya',
};
export const VEHICLE_LABEL: Record<string, string> = {
  NATIONAL: 'National', CONTINENTAL_LUXURY: 'Continental/Luxury', SUV_MPV: 'SUV/MPV',
  COMMERCIAL_PICKUP: 'Commercial/Pickup', EV_HYBRID: 'EV/Hybrid',
  MOTORCYCLE: 'Motorcycle', MULTI_BRAND: 'Multi-brand',
};
export const REASON_LABEL: Record<string, string> = {
  KNOWLEDGE_GAP: 'Knowledge gap', COMPLAINT: 'Complaint',
  LOW_CONFIDENCE: 'Low confidence', SENSITIVE: 'Sensitive',
};
export const stateLabel = (s: string) => STATE_LABEL[s] ?? s;
export const vehicleLabel = (v: string) => VEHICLE_LABEL[v] ?? v;
export const reasonLabel = (r: string) => REASON_LABEL[r] ?? r;
export const intentLabel = (i: string) => i.replace(/_/g, ' ');
export const fmtDuration = (ms: number | null): string => {
  if (ms == null) return '—';
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
```

- [ ] **Step 2: Add imports + queries at the top of `Performance.tsx`**

`useQuery` is already imported (line 6). Add these two imports alongside the existing ones, and **remove** the now-unused `import { listTickets } from '../api/tickets';` (line 7):

```ts
import { getKpis, getDelivery, getAutopilot, getEscalation, getAudience, type Range } from '../api/analytics';
import { stateLabel, vehicleLabel, reasonLabel, fmtDuration } from '../lib/analyticsLabels';
```

Inside `export default function Performance()`, replace the `const [range, setRange] = useState<'7d' | '30d' | '90d'>('30d');` line with:

```ts
  const [range, setRange] = useState<Range>('30d');

  const kpisQ = useQuery({ queryKey: ['analytics', 'kpis', range], queryFn: () => getKpis(range) });
  const deliveryQ = useQuery({ queryKey: ['analytics', 'delivery', range], queryFn: () => getDelivery(range) });
  const autopilotQ = useQuery({ queryKey: ['analytics', 'autopilot', range], queryFn: () => getAutopilot(range) });
  const escalationQ = useQuery({ queryKey: ['analytics', 'escalation', range], queryFn: () => getEscalation(range) });
  const audienceQ = useQuery({ queryKey: ['analytics', 'audience'], queryFn: () => getAudience() });
```

Then delete the now-unused `listTickets` import and the two ticket `useQuery` blocks (old lines 7, 390-397) and the seed-derived `ticketsOpened/ticketsClosed/ticketsOpen` lines (old 399-405).

- [ ] **Step 3: Replace each chart's data source**

Delete the `SEED_*` constants (old lines 46-112) and replace each render site:

**KPI strip** (old lines 450-455):
```tsx
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <MiniStat label="Messages delivered" value={(kpisQ.data?.delivered.value ?? 0).toLocaleString()} delta={kpisQ.data?.delivered.deltaPct} />
        <MiniStat label="Delivery rate" value={kpisQ.data?.deliveryRate.value ?? 0} suffix="%" delta={kpisQ.data?.deliveryRate.deltaPct} />
        <MiniStat label="Avg. reply rate" value={kpisQ.data?.replyRate.value ?? 0} suffix="%" delta={kpisQ.data?.replyRate.deltaPct} />
        <MiniStat label="Auto-handle rate" value={kpisQ.data?.autoHandleRate.value ?? 0} suffix="%" delta={kpisQ.data?.autoHandleRate.deltaPct} />
      </div>
```

**Delivery funnel** (old line 461) — map funnel object to the array shape `Funnel` expects:
```tsx
            <div style={{ marginTop:6 }}>
              <Funnel data={[
                { label: 'Sent',      value: deliveryQ.data?.funnel.sent ?? 0,      color: 'var(--green-600)' },
                { label: 'Delivered', value: deliveryQ.data?.funnel.delivered ?? 0, color: 'var(--green-500)' },
                { label: 'Read',      value: deliveryQ.data?.funnel.read ?? 0,      color: '#34D399' },
                { label: 'Replied',   value: deliveryQ.data?.funnel.replied ?? 0,   color: '#67E8F9' },
              ]} />
            </div>
```

**Auto-handle headline + trend** (old lines 468-472):
```tsx
          <div style={{ display:'flex', alignItems:'baseline', gap:8, margin:'4px 0 6px' }}>
            <span style={{ fontSize:30, fontWeight:700, letterSpacing:'-.02em' }}>{autopilotQ.data?.autoHandleRate ?? 0}%</span>
          </div>
          <LineChart data={(autopilotQ.data?.trend ?? []).map(t => t.rate)} color="var(--accent)" min={0} max={100} h={150} />
```

**Human response time** (old line 483) — map to `{ d, val }`, using KL weekday short labels:
```tsx
          <BarChart data={(escalationQ.data?.responseTimeByDay ?? []).map(r => ({ d: new Date(r.date).toLocaleDateString('en-MY', { weekday: 'short' }), val: r.avgMinutes ?? 0 }))} color="var(--accent)" target={15} h={170} />
```

**Dealers by state** (old line 487):
```tsx
          <div style={{ marginTop:6 }}><HBar data={(audienceQ.data?.byState ?? []).map(s => ({ label: stateLabel(s.state), value: s.count }))} color="var(--blue-500)" /></div>
```

**Specialization mix donut** — replace the `donutData` memo (old lines 408-413) and the `DonutChart` (old 496-499):
```ts
  const donutColors = ['var(--accent)','var(--blue-500)','#0891B2','var(--amber-500)','#DB2777','#65A30D','#6B7280'];
  const donutData = (audienceQ.data?.byVehicle ?? []).map((d, i) => ({
    label: vehicleLabel(d.vehicle),
    value: d.count,
    color: donutColors[i] ?? '#6B7280',
  }));
```
```tsx
            <DonutChart size={150} centerLabel={String(donutData.length)} centerSub="types" data={donutData} />
```

**Top templates** (old lines 505-520) — iterate live data:
```tsx
            {(deliveryQ.data?.topTemplates ?? []).map((t, i) => (
              <div key={t.templateId} style={{
                display:'grid', gridTemplateColumns:'24px 1fr 130px 56px',
                alignItems:'center', gap:12, padding:'9px 4px',
                borderTop: i ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{ fontSize:13, fontWeight:700, color:'var(--text-subtle)' }}>{i + 1}</span>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:12, color:'var(--text-muted)', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {t.name} · {t.language}
                  </div>
                </div>
                <div><ProgressBar value={t.replyRate} /></div>
                <span style={{ fontSize:13, fontWeight:600, textAlign:'right', fontFamily:'monospace' }}>{t.replyRate}%</span>
              </div>
            ))}
```

**Delivery by audience** (old lines 535, 541, 546, 552) — map to `DBar` `{ label, value }`:
```tsx
          <DBar data={(deliveryQ.data?.byState ?? []).map(s => ({ label: stateLabel(s.state), value: s.rate }))} />
```
…and for the "best" callout below it:
```tsx
            Best responsive state: {deliveryQ.data?.byState[0] ? `${stateLabel(deliveryQ.data.byState[0].state)} — ${deliveryQ.data.byState[0].rate}%` : '—'}
```
…and the by-vehicle DBar + callout:
```tsx
          <DBar data={(deliveryQ.data?.byVehicle ?? []).map(v => ({ label: vehicleLabel(v.vehicle), value: v.rate }))} />
```
```tsx
            Best responsive vehicle type: {deliveryQ.data?.byVehicle[0] ? `${vehicleLabel(deliveryQ.data.byVehicle[0].vehicle)} — ${deliveryQ.data.byVehicle[0].rate}%` : '—'}
```

**Escalation section** (old lines 568-617) — replace `const e = SEED_ESCALATION;` usage and the supporting-stats array. Use:
```ts
  const esc = escalationQ.data;
  const maxReason = Math.max(1, ...(esc?.byReason ?? []).map(r => r.count));
  const reasonColors: Record<string, string> = { KNOWLEDGE_GAP: 'var(--amber-500)', COMPLAINT: '#E0552E', LOW_CONFIDENCE: '#F4926A', SENSITIVE: '#C2410C' };
```
Rate headline:
```tsx
              <span style={{ fontSize:38, fontWeight:700, letterSpacing:'-.02em' }}>{esc?.rate ?? 0}%</span>
              <span style={{ fontSize:13, fontWeight:600, color:'var(--green-600)', display:'inline-flex', alignItems:'center', gap:2 }}>
                <IcArrowUp size={14} />{esc?.deltaPct ?? 0}pp
              </span>
```
Trend line:
```tsx
            <LineChart data={(esc?.trend ?? []).map(t => t.rate)} color="var(--green-500)" min={0} max={100} h={92} />
```
By-reason bars:
```tsx
              {(esc?.byReason ?? []).map(r => (
                <div key={r.reason} style={{ display:'grid', gridTemplateColumns:'120px 1fr 28px', alignItems:'center', gap:10 }}>
                  <span style={{ fontSize:12.5, color:'var(--text-muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{reasonLabel(r.reason)}</span>
                  <div style={{ height:9, borderRadius:5, background:'var(--bg-subtle)', overflow:'hidden' }}>
                    <div style={{ width:`${r.count / maxReason * 100}%`, height:'100%', borderRadius:5, background:reasonColors[r.reason] ?? 'var(--amber-500)' }} />
                  </div>
                  <span style={{ fontSize:12, fontWeight:600, textAlign:'right', fontFamily:'monospace' }}>{r.count}</span>
                </div>
              ))}
```
Supporting stats:
```tsx
            {([
              ['Tickets opened',  esc?.opened ?? 0, 'var(--text)'],
              ['Tickets closed',  esc?.closed ?? 0, 'var(--green-600)'],
              ['Avg. time to close', fmtDuration(esc?.avgCloseMs ?? null), 'var(--text)'],
              ['Open remaining',  esc?.openRemaining ?? 0, '#D97706'],
            ] as [string, string | number, string][]).map(([l, v, col], i) => (
```

- [ ] **Step 4: Remove the demo footnote**

Delete the footnote block (old lines 621-624).

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter web build`
Expected: build succeeds (no unused-import or type errors). Fix any leftover references to deleted `SEED_*` constants.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/Performance.tsx apps/web/src/lib/analyticsLabels.ts
git commit -m "feat(web): wire Performance.tsx to real analytics endpoints"
```

---

## Task 10: Wire `Dashboard.tsx`

**Files:**
- Modify: `apps/web/src/pages/Dashboard.tsx`

- [ ] **Step 1: Add imports + queries**

`useQuery` and the icons `IcSend/IcCheck/IcEye/IcActivity` are already imported (lines 3, 14-17) — do **not** re-import them. Add only:
```ts
import { getKpis, getVolume, getAutopilot } from '../api/analytics';
import { intentLabel } from '../lib/analyticsLabels';
```
Inside `Dashboard()`, after the existing `eventsQ` query, add:
```ts
  const kpisQ = useQuery({ queryKey: ['analytics', 'kpis', '7d'], queryFn: () => getKpis('7d') });
  const volumeQ = useQuery({ queryKey: ['analytics', 'volume', '7d'], queryFn: () => getVolume('7d') });
  const apQ = useQuery({ queryKey: ['analytics', 'autopilot', '30d'], queryFn: () => getAutopilot('30d') });
```

- [ ] **Step 2: Replace the auto-handle hero numbers with the endpoint value**

Replace the derived `aiHandled/aiTotal/autoRatePct` block (old lines 309-315) with:
```ts
  const events = eventsQ.data ?? [];
  const autoRatePct = apQ.data?.autoHandleRate ?? 0;
  const aiHandled = apQ.data?.handling.autoReplied ?? 0;
  const aiTotal = aiHandled + (apQ.data?.handling.escalated ?? 0);
```
(The hero JSX at old lines 362, 374 already reads `aiHandled`, `aiTotal`, `autoRatePct` — no change needed there.)

- [ ] **Step 3: Replace the KPI strip (old lines 412-435)** — delete `SEED_KPIS` (old 20-25) and render live data, dropping the `seedNote`:
```tsx
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16 }}>
        <KpiCard label="Sent today" value={(kpisQ.data?.sentToday.value ?? 0).toLocaleString()}
          delta={kpisQ.data?.sentToday.deltaPct ?? 0} spark={kpisQ.data?.sentToday.spark ?? []}
          icon={<IcSend size={15} />} />
        <KpiCard label="Delivery rate" value={kpisQ.data?.deliveryRate.value ?? 0} suffix="%"
          delta={kpisQ.data?.deliveryRate.deltaPct ?? 0} spark={kpisQ.data?.deliveryRate.spark ?? []}
          sparkColor="#10B981" icon={<IcCheck size={15} />} />
        <KpiCard label="Read rate" value={kpisQ.data?.readRate.value ?? 0} suffix="%"
          delta={kpisQ.data?.readRate.deltaPct ?? 0} spark={kpisQ.data?.readRate.spark ?? []}
          icon={<IcEye size={15} />} />
        <KpiCard label="Cost today" value={`RM ${(kpisQ.data?.costToday.value ?? 0).toLocaleString()}`}
          delta={kpisQ.data?.costToday.deltaPct ?? 0} deltaGood={false}
          spark={kpisQ.data?.costToday.spark ?? []} sparkColor="var(--text-muted)"
          icon={<IcActivity size={15} />} />
      </div>
```

- [ ] **Step 4: Replace Message volume (old line 456)** — delete `SEED_WEEK` (old 27-35); map days to short weekday labels:
```tsx
          <GroupedBar data={(volumeQ.data?.byDay ?? []).map(d => ({ d: new Date(d.date).toLocaleDateString('en-MY', { weekday: 'short' }), sent: d.sent, delivered: d.delivered, replied: d.replied }))} h={220} />
```

- [ ] **Step 5: Replace Reply-handling donut (old lines 462-464)** — delete `SEED_HANDLING` (old 37-41); use live counts and the **live** center label (fixes the hardcoded `78%`):
```tsx
          <div style={{ paddingTop:8 }}>
            <DonutChart
              data={[
                { label: 'Auto-handled by bot', value: apQ.data?.handling.autoReplied ?? 0, color: 'var(--accent)' },
                { label: 'Escalated → human',   value: apQ.data?.handling.escalated ?? 0,   color: '#F59E0B' },
                { label: 'Resolved by team',     value: apQ.data?.handling.resolvedByTeam ?? 0, color: '#10B981' },
              ]}
              centerLabel={`${autoRatePct}%`} centerSub="auto-handled"
            />
          </div>
```

- [ ] **Step 6: Replace Top intents (old lines 534-536)** — delete `SEED_TOP_INTENTS` (old 43-50); drop the `(demo data)` sub-label:
```tsx
        <div style={{ padding:'20px 22px', borderRadius:12, border:'1px solid var(--border)', background:'var(--bg)' }}>
          <SectionTitle sub="What dealers asked about recently">Top intents</SectionTitle>
          <HBar data={(apQ.data?.topIntents ?? []).map(t => ({ label: intentLabel(t.intent), value: t.count }))} />
        </div>
```

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter web build`
Expected: build succeeds; no references to deleted `SEED_*` remain. Remove any now-unused icon imports flagged by the compiler.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/Dashboard.tsx
git commit -m "feat(web): wire Dashboard.tsx to real analytics; fix hardcoded donut %"
```

---

## Task 11: E2E coverage + README

**Files:**
- Create: `e2e/tests/performance.spec.ts`
- Create: `e2e/tests/dashboard.spec.ts`
- Modify: `README.md`

> Follow the existing spec patterns in `e2e/tests/login.spec.ts` and `e2e/tests/blasts.spec.ts` for the login helper and selectors. These tests assume the dev API + web are running and the DB has been seeded with `pnpm db:seed && pnpm db:seed:analytics`.

- [ ] **Step 1: Inspect an existing e2e spec to reuse its login helper**

Run: `cat e2e/tests/blasts.spec.ts` (note how it authenticates and navigates).

- [ ] **Step 2: Write the Performance e2e spec**

```ts
// e2e/tests/performance.spec.ts
import { test, expect } from '@playwright/test';
import { login } from './login.spec'; // if login.spec exports a helper; otherwise inline the login steps used there

test.describe('Performance analytics', () => {
  test('renders real (non-demo) analytics', async ({ page }) => {
    await login(page); // adapt to the project's login helper
    await page.goto('/reports');

    // Demo labels must be gone
    await expect(page.getByText('Chart data is seeded demo analytics')).toHaveCount(0);

    // KPI strip shows a delivery rate value
    await expect(page.getByText('Delivery rate')).toBeVisible();

    // Range chips drive a refetch (smoke: clicking 7 days keeps the page functional)
    await page.getByRole('button', { name: '7 days' }).click();
    await expect(page.getByText('Delivery funnel')).toBeVisible();
  });
});
```

> If `login.spec.ts` does not export a reusable `login`, copy its login steps into a local `async function login(page)` at the top of this file (do not change `login.spec.ts`).

- [ ] **Step 3: Write the Dashboard e2e spec**

```ts
// e2e/tests/dashboard.spec.ts
import { test, expect } from '@playwright/test';
import { login } from './login.spec';

test.describe('Dashboard analytics', () => {
  test('KPI strip has no demo badge and donut shows a live %', async ({ page }) => {
    await login(page); // adapt to the project's login helper
    await page.goto('/');

    await expect(page.getByTestId('dashboard-title')).toBeVisible();
    // The 'demo' badge that used to mark seed KPIs must be gone
    await expect(page.getByText('demo', { exact: true })).toHaveCount(0);
    // Reply-handling donut center shows a percentage
    await expect(page.getByText(/\d+%/).first()).toBeVisible();
  });
});
```

- [ ] **Step 4: Run the e2e suite**

Start API (`pnpm --filter api dev`), worker, and web (`pnpm --filter web dev`); ensure seeded. Then:
Run: `pnpm --filter e2e test -- performance dashboard`
Expected: both new specs pass. Fix selectors against the project's actual login helper if they fail to authenticate.

- [ ] **Step 5: Update README**

In `README.md`, under the seeding steps (near `pnpm db:seed`), add:
```
# 6. (optional) Seed demo analytics history so Performance/Dashboard charts populate
pnpm db:seed:analytics
```

- [ ] **Step 6: Commit**

```bash
git add e2e/tests/performance.spec.ts e2e/tests/dashboard.spec.ts README.md
git commit -m "test(e2e): analytics on Performance + Dashboard; doc db:seed:analytics"
```

---

## Final verification

- [ ] Run `pnpm --filter api test` — all unit tests pass.
- [ ] Run `pnpm --filter api build` and `pnpm --filter web build` — both compile.
- [ ] With Postgres up and `pnpm db:seed && pnpm db:seed:analytics`, open `/reports` and `/` — every chart shows real, non-zero data; no `demo`/`(demo data)`/seed-footnote text remains; range chips change the numbers.
- [ ] Run `pnpm --filter e2e test -- performance dashboard` — green.

---

## Self-review notes (author)

- **Spec coverage:** §3.1 endpoints → Tasks 1,3–7 (all six). §3.2 generator → Task 2. §3.3 frontend wiring (Performance, Dashboard, range chips, donut fix, demo-label removal, empty states via `?? 0`/`?? []`) → Tasks 9–10. §6 testing → service tests in Tasks 1,3–7 + e2e in Task 11. Cost estimate (§1) → Task 2 (setting) + Task 7 (`kpis`). Deferred items (export/compare/drill-down) correctly untouched.
- **Empty states:** every binding uses `?? 0` / `?? []`, so charts render their frame with zeros while loading or when empty (the §5 "never crash on empty" requirement). A friendlier per-card "No data yet" can be layered later; the spec's hard requirement (no crash, graceful zero) is met.
- **Type consistency:** `Range`, `Metric`, and the six response interfaces are defined once (server: Task 1/3-7; client: Task 8) with matching field names (`funnel.sent/delivered/read/replied`, `byState[].rate`, `topTemplates[].replyRate`, `handling.autoReplied/escalated/resolvedByTeam`, `responseTimeByDay[].avgMinutes`). Frontend tasks reference exactly these names.
- **Open question (Avg reply 22s):** dropped from the Dashboard hero rather than faked — the hero now shows `aiHandled/aiTotal` (real) + `autoRatePct` (real) + needs-human (real); the standalone "Avg reply 22s" literal is not reintroduced. If desired later, derive from `AutopilotEvent.createdAt − InboundMessage.receivedAt` (noted in spec §9).
