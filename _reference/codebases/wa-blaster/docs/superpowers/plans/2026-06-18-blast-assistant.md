# Blast Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A "plan, then confirm" in-app assistant that turns a natural-language prompt ("blast dealers about car A on Monday morning") into a drafted/selected template and a scheduled campaign, executed only after the operator approves.

**Architecture:** A new HTTP-side NestJS `assistant/` module runs an Ollama native tool-calling loop. During chat the model may only call **read tools** (`search_templates`, `search_audience`, `resolve_datetime`, `get_template_variables`); it finishes by calling the terminal tool `propose_plan`, whose argument is a structured plan. The backend validates + persists the plan (`AssistantPlan` row) and returns it for confirmation cards. On **approve**, the backend executes deterministically by calling the existing `TemplatesService` / `BlastsService` — the model never performs writes. Two small enabling edits let a campaign be scheduled against a not-yet-approved (PENDING) template: relax blast-creation validation for future-dated sends, and add a fire-time approval guard in the blast worker.

**Tech Stack:** NestJS 10, Prisma/Postgres, BullMQ/Redis, Ollama (`qwen3:14b`, `/api/chat` with `tools`), React 18 + React Query + Tailwind, Jest (`nock` for HTTP), `class-validator`.

---

## Conventions for the implementer

- **Run from repo root.** Target packages with `pnpm --filter api ...` / `pnpm --filter web ...`.
- **Backend tests** follow the repo pattern: instantiate the service directly with hand-rolled stubs (no full `TestingModule`); see `apps/api/src/blasts/__tests__`, `apps/api/src/whatsapp/__tests__`. Run a single suite with `pnpm --filter api test -- <filename-regex>`.
- **The web app has no unit-test runner / ESLint.** Verify frontend work with `pnpm --filter web build` (tsc + vite typecheck). Do not invent a web test command.
- **After editing `schema.prisma`:** run `pnpm db:migrate` (DB up) **and** `pnpm --filter api db:generate` (regenerate client) or you'll get `TS2305: Module '@prisma/client' has no exported member 'AssistantPlan'`.
- **Commit after every task** with the message shown in that task's final step.

## File Structure

**Backend — create:**
- `apps/api/src/blasts/select-usable-template-rows.ts` — pure helper: choose APPROVED (or PENDING when future-dated) rows of the latest usable version.
- `apps/api/src/blasts/__tests__/select-usable-template-rows.spec.ts`
- `apps/api/src/blasts/__tests__/blast.processor.guard.spec.ts` — fire-time approval guard tests.
- `apps/api/src/assistant/assistant.types.ts` — the plan contract + tool/LLM types.
- `apps/api/src/assistant/resolve-datetime.ts` — pure NL→KL-ISO datetime parser.
- `apps/api/src/assistant/__tests__/resolve-datetime.spec.ts`
- `apps/api/src/assistant/assistant-tools.service.ts` — read-tool implementations + dispatch.
- `apps/api/src/assistant/assistant-plan.service.ts` — validate / stage / get / cancel / approve.
- `apps/api/src/assistant/__tests__/assistant-plan.service.spec.ts`
- `apps/api/src/assistant/assistant-llm.ts` — `AssistantLlm` abstract token + `OllamaAssistantLlm`.
- `apps/api/src/assistant/tool-defs.ts` — JSON-schema tool definitions + system prompt.
- `apps/api/src/assistant/assistant.service.ts` — the tool-calling loop orchestrator.
- `apps/api/src/assistant/__tests__/assistant.service.spec.ts`
- `apps/api/src/assistant/dto/chat.dto.ts` — request DTOs.
- `apps/api/src/assistant/assistant.controller.ts`
- `apps/api/src/assistant/assistant.module.ts`
- `apps/api/src/assistant/__tests__/assistant.e2e-ish.spec.ts` — chat→propose→approve integration (mock WhatsApp + fake LLM).

**Backend — modify:**
- `apps/api/prisma/schema.prisma` — add `AssistantPlan` model + `AssistantPlanStatus` enum.
- `apps/api/src/blasts/blasts.service.ts:192` — `validateTemplate` calls the pure helper, takes `scheduledAt`.
- `apps/api/src/blasts/blasts.service.ts:231` — `createAndSchedule` uses `usableRows`.
- `apps/api/src/blasts/blast.processor.ts` — inject `ConfigService`; add fire-time approval guard.
- `apps/api/src/app.module.ts:26` — register `AssistantModule`.
- `apps/api/.env.example` — new env vars.
- Confirm `TemplatesModule` exports `TemplatesService` and `SegmentsModule` exports `SegmentsService` (add to `exports` if missing).

**Frontend — create:**
- `apps/web/src/api/assistant.ts` — API client + types.
- `apps/web/src/components/assistant/AssistantPanel.tsx` — slide-over chat + cards.
- `apps/web/src/components/assistant/PlanCards.tsx` — template/audience/schedule confirmation cards.

**Frontend — modify:**
- `apps/web/src/components/Layout.tsx` — mount the panel; AIOrb trigger button; open/close state.

---

# Phase 1 — Campaign enablement (schedule against a PENDING template)

This phase is independently valuable and ships on its own.

## Task 1: Pure helper `selectUsableTemplateRows`

**Files:**
- Create: `apps/api/src/blasts/select-usable-template-rows.ts`
- Test: `apps/api/src/blasts/__tests__/select-usable-template-rows.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/blasts/__tests__/select-usable-template-rows.spec.ts
import { selectUsableTemplateRows } from '../select-usable-template-rows';

type Row = { version: number; language: string; status: string };
const rows = (rs: Row[]) => rs;

describe('selectUsableTemplateRows', () => {
  it('returns the latest APPROVED version regardless of scheduledAt', () => {
    const r = rows([
      { version: 1, language: 'EN', status: 'APPROVED' },
      { version: 2, language: 'EN', status: 'APPROVED' },
      { version: 2, language: 'MS', status: 'APPROVED' },
    ]);
    const out = selectUsableTemplateRows(r, 'EN', false);
    expect(out.latestVersion).toBe(2);
    expect(out.usableRows).toHaveLength(2);
  });

  it('allows PENDING rows when the send is in the future', () => {
    const r = rows([{ version: 1, language: 'EN', status: 'PENDING' }]);
    const out = selectUsableTemplateRows(r, 'EN', true);
    expect(out.latestVersion).toBe(1);
    expect(out.usableRows[0].status).toBe('PENDING');
  });

  it('rejects PENDING-only templates for immediate sends', () => {
    const r = rows([{ version: 1, language: 'EN', status: 'PENDING' }]);
    expect(() => selectUsableTemplateRows(r, 'EN', false)).toThrow(/immediate sends require approval/i);
  });

  it('prefers APPROVED over PENDING even when future-dated', () => {
    const r = rows([
      { version: 1, language: 'EN', status: 'APPROVED' },
      { version: 2, language: 'EN', status: 'PENDING' },
    ]);
    const out = selectUsableTemplateRows(r, 'EN', true);
    expect(out.latestVersion).toBe(1); // latest APPROVED, not the pending v2
  });

  it('throws when no rows exist', () => {
    expect(() => selectUsableTemplateRows([], 'EN', true)).toThrow(/not found/i);
  });

  it('throws when the default language is missing from the usable version', () => {
    const r = rows([{ version: 1, language: 'MS', status: 'APPROVED' }]);
    expect(() => selectUsableTemplateRows(r, 'EN', true)).toThrow(/EN/);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test -- select-usable-template-rows`
Expected: FAIL — `Cannot find module '../select-usable-template-rows'`.

- [ ] **Step 3: Implement the helper**

```typescript
// apps/api/src/blasts/select-usable-template-rows.ts
import { BadRequestException } from '@nestjs/common';

/**
 * Choose the template rows a blast may send with.
 *
 * Normally only APPROVED rows are usable. When the send is scheduled in the
 * FUTURE we also allow a PENDING template (latest pending version) — the bet is
 * that Meta approves it before fire time; the blast worker re-checks approval at
 * send time (see BlastProcessor fire-time guard). APPROVED always wins over PENDING.
 */
export function selectUsableTemplateRows<T extends { version: number; language: string; status: string }>(
  rows: T[],
  defaultLanguage: string,
  isFuture: boolean,
): { latestVersion: number; usableRows: T[] } {
  if (rows.length === 0) throw new BadRequestException('Template not found');

  const approved = rows.filter((r) => r.status === 'APPROVED');
  let pool = approved;
  if (approved.length === 0) {
    if (!isFuture) {
      throw new BadRequestException('No APPROVED variant (immediate sends require approval)');
    }
    const pending = rows.filter((r) => r.status === 'PENDING');
    if (pending.length === 0) throw new BadRequestException('No APPROVED or PENDING variant');
    pool = pending;
  }

  const latestVersion = Math.max(...pool.map((r) => r.version));
  const usableRows = pool.filter((r) => r.version === latestVersion);
  if (!usableRows.find((r) => r.language === defaultLanguage)) {
    throw new BadRequestException(`Default language ${defaultLanguage} not available for this template`);
  }
  return { latestVersion, usableRows };
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm --filter api test -- select-usable-template-rows`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/blasts/select-usable-template-rows.ts apps/api/src/blasts/__tests__/select-usable-template-rows.spec.ts
git commit -m "feat(blasts): pure helper to allow scheduling against PENDING templates"
```

## Task 2: Wire the helper into `validateTemplate` / `createAndSchedule`

**Files:**
- Modify: `apps/api/src/blasts/blasts.service.ts:192` (`validateTemplate`) and `:231` (`createAndSchedule`)

- [ ] **Step 1: Add the import** at the top of `blasts.service.ts` (next to the other `./` imports):

```typescript
import { selectUsableTemplateRows } from './select-usable-template-rows';
```

- [ ] **Step 2: Replace `validateTemplate`** (currently lines 192–207) with:

```typescript
  /**
   * Resolve the rows a blast may send with. APPROVED normally; PENDING is allowed
   * only when scheduledAt is in the future (the worker re-checks approval at send time).
   */
  private async validateTemplate(templateName: string, defaultLanguage: string, scheduledAt: Date) {
    const rows = await this.prisma.template.findMany({ where: { name: templateName } });
    if (rows.length === 0) throw new BadRequestException(`Template "${templateName}" not found`);
    return selectUsableTemplateRows(rows, defaultLanguage, scheduledAt.getTime() > Date.now());
  }
```

- [ ] **Step 3: Update the caller in `createAndSchedule`.** Change the destructure (currently line ~235):

```typescript
    // BEFORE: const { approvedRows } = await this.validateTemplate(dto.templateName, dto.defaultLanguage);
    const { usableRows } = await this.validateTemplate(dto.templateName, dto.defaultLanguage, scheduledAt);
```

And the map that consumed it (currently line ~239):

```typescript
    // BEFORE: const approvedByLang = new Map(approvedRows.map((r) => [r.language, r]));
    const approvedByLang = new Map(usableRows.map((r) => [r.language, r]));
```

(Leave the rest of `createAndSchedule` unchanged — `approvedByLang` is still the correct variable name everywhere it is used downstream.)

- [ ] **Step 4: Typecheck/build**

Run: `pnpm --filter api build`
Expected: builds clean (no TS errors).

- [ ] **Step 5: Run the existing blast tests to confirm no regression**

Run: `pnpm --filter api test -- blasts`
Expected: PASS (existing suites still green).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/blasts/blasts.service.ts
git commit -m "feat(blasts): validateTemplate accepts PENDING for future-dated sends"
```

## Task 3: Fire-time approval guard in `BlastProcessor`

**Files:**
- Modify: `apps/api/src/blasts/blast.processor.ts`
- Test: `apps/api/src/blasts/__tests__/blast.processor.guard.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/blasts/__tests__/blast.processor.guard.spec.ts
import { BlastProcessor } from '../blast.processor';

function makeProcessor(overrides: {
  template: { status: string; name: string; language: string; variables: string[] };
  blastScheduledAt: Date;
  graceMs?: number;
  recheckMs?: number;
}) {
  const messageUpdate = jest.fn().mockResolvedValue({});
  const blastUpdate = jest.fn().mockResolvedValue({});
  const prisma: any = {
    message: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'm1', status: 'QUEUED', blastId: 'b1', templateId: 't1', contactId: 'c1',
      }),
      update: messageUpdate,
      count: jest.fn().mockResolvedValue(0),
    },
    contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', phoneE164: '+60123', languagePreference: 'EN' }) },
    template: { findUnique: jest.fn().mockResolvedValue({ id: 't1', ...overrides.template }) },
    blast: { findUnique: jest.fn().mockResolvedValue({ id: 'b1', status: 'RUNNING', scheduledAt: overrides.blastScheduledAt, variableMapping: {} }), update: blastUpdate },
  };
  const whatsapp: any = { sendMessage: jest.fn().mockResolvedValue({ metaMessageId: 'meta1' }) };
  const limiter: any = { consume: jest.fn().mockResolvedValue({ ok: true }) };
  const settings: any = { get: jest.fn().mockResolvedValue('UNLIMITED') };
  const config: any = {
    get: (k: string) => (k === 'ASSISTANT_TEMPLATE_GRACE_MS' ? String(overrides.graceMs ?? 86400000)
      : k === 'ASSISTANT_TEMPLATE_RECHECK_MS' ? String(overrides.recheckMs ?? 300000) : undefined),
  };
  const proc = new BlastProcessor(prisma, whatsapp, limiter, settings, config);
  return { proc, whatsapp, messageUpdate, blastUpdate };
}

const job = () => ({ data: { messageId: 'm1' }, moveToDelayed: jest.fn().mockResolvedValue(undefined) } as any);

describe('BlastProcessor fire-time template guard', () => {
  it('sends when the template is APPROVED', async () => {
    const { proc, whatsapp } = makeProcessor({
      template: { status: 'APPROVED', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 1000),
    });
    await proc.process(job());
    expect(whatsapp.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('holds (moveToDelayed, no send) when PENDING and inside the grace window', async () => {
    const j = job();
    const { proc, whatsapp } = makeProcessor({
      template: { status: 'PENDING', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 1000),
      graceMs: 86400000,
    });
    await proc.process(j);
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
    expect(j.moveToDelayed).toHaveBeenCalledTimes(1);
  });

  it('fails the message when PENDING past the grace window', async () => {
    const { proc, whatsapp, messageUpdate } = makeProcessor({
      template: { status: 'PENDING', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 100000),
      graceMs: 1, // already exceeded
    });
    await proc.process(job());
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
    expect(messageUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', errorCode: 'TEMPLATE_NOT_APPROVED' }),
    }));
  });

  it('fails immediately when the template is REJECTED', async () => {
    const { proc, whatsapp, messageUpdate } = makeProcessor({
      template: { status: 'REJECTED', name: 'car_a', language: 'EN', variables: [] },
      blastScheduledAt: new Date(Date.now() - 1000),
    });
    await proc.process(job());
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
    expect(messageUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: 'FAILED', errorCode: 'TEMPLATE_NOT_APPROVED' }),
    }));
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test -- blast.processor.guard`
Expected: FAIL — `BlastProcessor` constructor takes 4 args, test passes 5 (`config` undefined) and there is no guard, so the PENDING cases call `sendMessage`.

- [ ] **Step 3: Inject `ConfigService` + add the guard.** In `blast.processor.ts`:

Add the import:

```typescript
import { ConfigService } from '@nestjs/config';
```

Add `config` to the constructor:

```typescript
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
    private readonly limiter: RateLimiterService,
    private readonly settings: SystemSettingsService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  private numEnv(key: string, fallback: number): number {
    const raw = Number(this.config.get<string>(key));
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }
```

Insert the guard **immediately after** the `if (!contact || !template || !blast) { ... throw ... }` block and **before** the `// Transition blast to RUNNING` block:

```typescript
    // Fire-time template-approval guard. A campaign may have been scheduled against a
    // still-PENDING template (assistant flow). Re-check at send time.
    if (template.status !== 'APPROVED') {
      const graceMs = this.numEnv('ASSISTANT_TEMPLATE_GRACE_MS', 24 * 60 * 60 * 1000);
      const recheckMs = this.numEnv('ASSISTANT_TEMPLATE_RECHECK_MS', 5 * 60 * 1000);
      const deadline = (blast.scheduledAt?.getTime() ?? Date.now()) + graceMs;

      if (template.status === 'REJECTED' || Date.now() > deadline) {
        await this.prisma.message.update({
          where: { id: messageId },
          data: {
            status: 'FAILED',
            errorCode: 'TEMPLATE_NOT_APPROVED',
            errorMessage: `Template ${template.name} is ${template.status} at send time`,
          },
        });
        this.logger.warn(`Message ${messageId} failed: template ${template.name} ${template.status}`);
        const remaining = await this.prisma.message.count({ where: { blastId: blast.id, status: 'QUEUED' } });
        if (remaining === 0) {
          await this.prisma.blast
            .update({ where: { id: blast.id }, data: { status: 'FAILED' } })
            .catch(() => undefined);
        }
        return;
      }

      // Within the grace window — hold and re-check later (does not consume a BullMQ attempt).
      this.logger.log(`Template ${template.name} ${template.status}; holding ${messageId} for ${recheckMs}ms`);
      await job.moveToDelayed(Date.now() + recheckMs);
      return;
    }
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm --filter api test -- blast.processor.guard`
Expected: PASS (4 tests).

- [ ] **Step 5: Update the worker DI — add `ConfigService`.** `BlastWorkerModule` already imports the global `ConfigModule` indirectly via `BullModule.forRootAsync({ imports: [ConfigModule] })`, but `ConfigService` must be resolvable for `BlastProcessor`. Confirm by building the worker:

Run: `pnpm --filter api build`
Expected: clean build. If Nest complains it can't resolve `ConfigService` for `BlastProcessor`, add `ConfigModule` to the `imports` array of `apps/api/src/blasts/blast-worker.module.ts` (and `blasts.module.ts`):

```typescript
import { ConfigModule } from '@nestjs/config';
// ...imports: [ ConfigModule, PrismaModule, /* ...existing... */ ]
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/blasts/blast.processor.ts apps/api/src/blasts/blast-worker.module.ts apps/api/src/blasts/blasts.module.ts
git commit -m "feat(blasts): fire-time template-approval guard (hold within grace window, else fail)"
```

---

# Phase 2 — AssistantPlan persistence + contract types

## Task 4: Add the `AssistantPlan` Prisma model

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Append the enum + model** to `schema.prisma` (after the existing models; mirror the repo's uuid/`@db.Uuid`/`@map` conventions):

```prisma
enum AssistantPlanStatus {
  PENDING_APPROVAL
  EXECUTED
  CANCELLED
  EXPIRED
}

model AssistantPlan {
  id              String              @id @default(uuid()) @db.Uuid
  status          AssistantPlanStatus @default(PENDING_APPROVAL)
  plan            Json
  createdById     String?             @map("created_by") @db.Uuid
  blastId         String?             @map("blast_id") @db.Uuid
  templateName    String?             @map("template_name")
  templateVersion Int?                @map("template_version")
  error           String?
  expiresAt       DateTime            @map("expires_at")
  createdAt       DateTime            @default(now()) @map("created_at")
  updatedAt       DateTime            @updatedAt       @map("updated_at")

  @@index([status])
  @@map("assistant_plans")
}
```

- [ ] **Step 2: Create the migration** (DB must be up: `docker compose up -d`):

Run: `pnpm db:migrate`
When prompted for a name, enter: `add_assistant_plan`
Expected: a new folder under `apps/api/prisma/migrations/<timestamp>_add_assistant_plan/`.

- [ ] **Step 3: Regenerate the Prisma client**

Run: `pnpm --filter api db:generate`
Expected: success; `@prisma/client` now exports `AssistantPlan` / `AssistantPlanStatus`.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(assistant): AssistantPlan model + migration"
```

## Task 5: Contract + tool/LLM types

**Files:**
- Create: `apps/api/src/assistant/assistant.types.ts`

- [ ] **Step 1: Write the types** (no test — pure declarations; consumed by later typed tasks):

```typescript
// apps/api/src/assistant/assistant.types.ts

export type PlanIntent = 'reuse_and_schedule' | 'create_and_schedule';
export type PlanLanguage = 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

export interface ReuseTemplateSpec {
  mode: 'reuse';
  name: string;
}
export interface CreateTemplateSpec {
  mode: 'create';
  name: string; // lowercase letters/digits/underscores, starts with a letter
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  languages: PlanLanguage[];
  bodyText: string;
  variables: string[];
}
export type TemplateSpec = ReuseTemplateSpec | CreateTemplateSpec;

/** The structured object the model emits via the propose_plan tool. */
export interface AssistantPlanInput {
  intent: PlanIntent;
  campaignName: string;
  template: TemplateSpec;
  audience: { segmentId: string };
  defaultLanguage: PlanLanguage;
  variableMapping: Record<string, string>;
  schedule: { sendAt: string }; // ISO 8601
}

/** What the API returns to the frontend for the confirmation cards. */
export interface StagedPlan {
  id: string;
  status: 'PENDING_APPROVAL' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED';
  plan: AssistantPlanInput;
  expiresAt: string;
}

// ---- tool-calling seam ----
export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema
}
export interface AssistantToolCall {
  name: string;
  arguments: Record<string, unknown>;
}
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}
/** One model turn: free-text content + any tool calls + the raw message to append back. */
export interface AssistantLlmTurn {
  content: string;
  toolCalls: AssistantToolCall[];
  raw: unknown;
}

export interface ChatResult {
  reply: string;
  plan?: StagedPlan;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter api build`
Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/assistant/assistant.types.ts
git commit -m "feat(assistant): plan contract + tool/LLM seam types"
```

---

# Phase 3 — Read tools

## Task 6: Pure `resolveDatetime` parser (KL timezone)

**Files:**
- Create: `apps/api/src/assistant/resolve-datetime.ts`
- Test: `apps/api/src/assistant/__tests__/resolve-datetime.spec.ts`

Kuala Lumpur is fixed UTC+8 (no DST), so a KL wall-clock time maps directly to an ISO string with a `+08:00` offset.

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/assistant/__tests__/resolve-datetime.spec.ts
import { resolveDatetime } from '../resolve-datetime';

// Wed 2026-06-17 03:00 UTC === Wed 2026-06-17 11:00 KL.
const NOW = new Date('2026-06-17T03:00:00.000Z');

describe('resolveDatetime (KL timezone)', () => {
  it('resolves "Monday morning" to the next Monday at 09:00 +08:00', () => {
    const out = resolveDatetime('Monday morning', NOW) as { sendAt: string };
    // Next Monday after Wed 2026-06-17 is 2026-06-22.
    expect(out.sendAt).toBe('2026-06-22T09:00:00+08:00');
  });

  it('resolves "tomorrow afternoon" to next day 14:00 +08:00', () => {
    const out = resolveDatetime('tomorrow afternoon', NOW) as { sendAt: string };
    expect(out.sendAt).toBe('2026-06-18T14:00:00+08:00');
  });

  it('resolves an explicit time "friday 8am"', () => {
    const out = resolveDatetime('friday 8am', NOW) as { sendAt: string };
    expect(out.sendAt).toBe('2026-06-19T08:00:00+08:00');
  });

  it('defaults a bare weekday to 09:00', () => {
    const out = resolveDatetime('next monday', NOW) as { sendAt: string };
    expect(out.sendAt).toBe('2026-06-22T09:00:00+08:00');
  });

  it('returns an error for an unparseable phrase', () => {
    const out = resolveDatetime('whenever you feel like it', NOW);
    expect(out).toHaveProperty('error');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test -- resolve-datetime`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the parser**

```typescript
// apps/api/src/assistant/resolve-datetime.ts

const KL_OFFSET_MIN = 8 * 60; // UTC+8, no DST
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PART_HOURS: Record<string, number> = { morning: 9, afternoon: 14, evening: 19, night: 20, noon: 12 };

interface KlParts { y: number; m: number; d: number; weekday: number }

/** Civil date/time fields in KL for a given instant. */
function klParts(now: Date): KlParts {
  const kl = new Date(now.getTime() + KL_OFFSET_MIN * 60_000);
  return { y: kl.getUTCFullYear(), m: kl.getUTCMonth(), d: kl.getUTCDate(), weekday: kl.getUTCDay() };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Build an ISO string for a KL civil date at the given hour. */
function klIso(y: number, m: number, d: number, hour: number): string {
  // Normalize the calendar (handles month/day rollover) via a UTC date.
  const base = new Date(Date.UTC(y, m, d));
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}T${pad(hour)}:00:00+08:00`;
}

/**
 * Turn a natural-language phrase into a concrete KL ISO timestamp.
 * Handles: weekday names (optionally "next"), today/tomorrow, parts of day
 * (morning/afternoon/evening/night/noon), and explicit "8am"/"2 pm" times.
 * Returns { error } when it can't confidently parse — the caller re-asks.
 */
export function resolveDatetime(phrase: string, now: Date): { sendAt: string } | { error: string } {
  const text = phrase.toLowerCase().trim();
  const { y, m, d, weekday } = klParts(now);

  // ---- hour ----
  let hour: number | null = null;
  const explicit = text.match(/(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?/);
  for (const [part, h] of Object.entries(PART_HOURS)) {
    if (text.includes(part)) hour = h;
  }
  if (explicit && explicit[1] && (explicit[3] || !hour)) {
    let h = parseInt(explicit[1], 10);
    const mer = explicit[3];
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    if (h >= 0 && h <= 23) hour = h;
  }
  if (hour === null) hour = 9; // sensible default: morning

  // ---- day ----
  let addDays: number | null = null;
  if (text.includes('today')) addDays = 0;
  else if (text.includes('tomorrow')) addDays = 1;
  else {
    const wdIndex = WEEKDAYS.findIndex((w) => text.includes(w));
    if (wdIndex >= 0) {
      let delta = (wdIndex - weekday + 7) % 7;
      if (delta === 0) delta = 7; // "monday" on a Monday means next Monday
      if (text.includes('next')) delta = ((wdIndex - weekday + 7) % 7) || 7;
      addDays = delta;
    }
  }

  if (addDays === null) return { error: `Could not parse a date/time from "${phrase}"` };
  return { sendAt: klIso(y, m, d + addDays, hour) };
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm --filter api test -- resolve-datetime`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/assistant/resolve-datetime.ts apps/api/src/assistant/__tests__/resolve-datetime.spec.ts
git commit -m "feat(assistant): pure NL→KL-ISO datetime parser"
```

## Task 7: `AssistantToolsService` (read-tool implementations + dispatch)

**Files:**
- Create: `apps/api/src/assistant/assistant-tools.service.ts`
- Test: `apps/api/src/assistant/__tests__/assistant-tools.service.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// apps/api/src/assistant/__tests__/assistant-tools.service.spec.ts
import { AssistantToolsService } from '../assistant-tools.service';

function make() {
  const prisma: any = {
    template: {
      findMany: jest.fn().mockResolvedValue([
        { name: 'car_a_promo', language: 'EN', variables: ['1'], status: 'APPROVED' },
        { name: 'car_a_promo', language: 'MS', variables: ['1'], status: 'APPROVED' },
        { name: 'old_draft', language: 'EN', variables: [], status: 'DRAFT' },
      ]),
    },
  };
  const segments: any = {
    list: jest.fn().mockResolvedValue([
      { id: 's1', name: 'Dealers' },
      { id: 's2', name: 'Lapsed customers' },
    ]),
    preview: jest.fn().mockResolvedValue({ count: 42, sample: [] }),
  };
  return { svc: new AssistantToolsService(prisma, segments), prisma, segments };
}

describe('AssistantToolsService', () => {
  it('search_templates returns only APPROVED families grouped by name', async () => {
    const { svc } = make();
    const out: any = await svc.run('search_templates', { query: 'car' });
    expect(out.templates).toHaveLength(1);
    expect(out.templates[0]).toMatchObject({ name: 'car_a_promo', languages: expect.arrayContaining(['EN', 'MS']) });
  });

  it('search_audience returns matching segments with counts', async () => {
    const { svc } = make();
    const out: any = await svc.run('search_audience', { query: 'dealer' });
    expect(out.segments).toEqual([{ segmentId: 's1', name: 'Dealers', count: 42 }]);
  });

  it('resolve_datetime delegates to the parser', async () => {
    const { svc } = make();
    const out: any = await svc.run('resolve_datetime', { phrase: 'tomorrow morning' });
    expect(out).toHaveProperty('sendAt');
  });

  it('returns an error object for an unknown tool', async () => {
    const { svc } = make();
    const out: any = await svc.run('delete_everything', {});
    expect(out).toHaveProperty('error');
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test -- assistant-tools`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

```typescript
// apps/api/src/assistant/assistant-tools.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SegmentsService } from '../segments/segments.service';
import { resolveDatetime } from './resolve-datetime';

@Injectable()
export class AssistantToolsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly segments: SegmentsService,
  ) {}

  /** Dispatch a read tool by name. Always resolves (errors are returned, not thrown). */
  async run(name: string, args: Record<string, unknown>): Promise<unknown> {
    try {
      switch (name) {
        case 'search_templates':
          return await this.searchTemplates(String(args.query ?? ''));
        case 'search_audience':
          return await this.searchAudience(String(args.query ?? ''));
        case 'resolve_datetime':
          return resolveDatetime(String(args.phrase ?? ''), new Date());
        case 'get_template_variables':
          return await this.getTemplateVariables(String(args.name ?? ''));
        default:
          return { error: `unknown tool ${name}` };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'tool failed' };
    }
  }

  private async searchTemplates(query: string) {
    const q = query.toLowerCase();
    const rows = await this.prisma.template.findMany({ where: { status: 'APPROVED' } });
    const byName = new Map<string, { name: string; languages: string[]; variables: string[] }>();
    for (const r of rows) {
      if (q && !r.name.toLowerCase().includes(q)) continue;
      const entry = byName.get(r.name) ?? { name: r.name, languages: [], variables: r.variables ?? [] };
      if (!entry.languages.includes(r.language)) entry.languages.push(r.language);
      byName.set(r.name, entry);
    }
    return { templates: [...byName.values()] };
  }

  private async searchAudience(query: string) {
    const q = query.toLowerCase();
    const all = await this.segments.list();
    const matches = q ? all.filter((s) => s.name.toLowerCase().includes(q)) : all;
    const segments = [];
    for (const s of matches) {
      const { count } = await this.segments.preview(s.id);
      segments.push({ segmentId: s.id, name: s.name, count });
    }
    return { segments };
  }

  private async getTemplateVariables(name: string) {
    const rows = await this.prisma.template.findMany({ where: { name } });
    if (rows.length === 0) return { error: `template ${name} not found` };
    return { name, variables: rows[0].variables ?? [] };
  }
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm --filter api test -- assistant-tools`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/assistant/assistant-tools.service.ts apps/api/src/assistant/__tests__/assistant-tools.service.spec.ts
git commit -m "feat(assistant): read-tool implementations + dispatch"
```

---

# Phase 4 — Plan validation + execution

## Task 8: `AssistantPlanService` — validate / stage / get / cancel

**Files:**
- Create: `apps/api/src/assistant/assistant-plan.service.ts`
- Test: `apps/api/src/assistant/__tests__/assistant-plan.service.spec.ts`

- [ ] **Step 1: Write the failing test** (validation + staging; `approve` is covered in Task 9)

```typescript
// apps/api/src/assistant/__tests__/assistant-plan.service.spec.ts
import { AssistantPlanService } from '../assistant-plan.service';
import type { AssistantPlanInput } from '../assistant.types';

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

function reusePlan(over: Partial<AssistantPlanInput> = {}): AssistantPlanInput {
  return {
    intent: 'reuse_and_schedule',
    campaignName: 'Car A — June',
    template: { mode: 'reuse', name: 'car_a_promo' },
    audience: { segmentId: 's1' },
    defaultLanguage: 'EN',
    variableMapping: { '1': 'contact.name' },
    schedule: { sendAt: FUTURE },
    ...over,
  };
}

function make() {
  const created: any = { id: 'plan1', status: 'PENDING_APPROVAL', plan: null, expiresAt: new Date() };
  const prisma: any = {
    contactSegment: { findUnique: jest.fn().mockResolvedValue({ id: 's1', name: 'Dealers' }) },
    template: { findMany: jest.fn().mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'APPROVED' }]) },
    assistantPlan: {
      create: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...created, ...data })),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const templates: any = {};
  const blasts: any = {};
  const config: any = { get: () => undefined };
  return { svc: new AssistantPlanService(prisma, templates, blasts, config), prisma };
}

describe('AssistantPlanService.stage validation', () => {
  it('stages a valid reuse plan', async () => {
    const { svc } = make();
    const staged = await svc.stage(reusePlan(), 'u1');
    expect(staged.status).toBe('PENDING_APPROVAL');
    expect(staged.plan.campaignName).toBe('Car A — June');
  });

  it('rejects an unknown segment', async () => {
    const { svc, prisma } = make();
    prisma.contactSegment.findUnique.mockResolvedValue(null);
    await expect(svc.stage(reusePlan(), 'u1')).rejects.toThrow(/segment/i);
  });

  it('rejects a past sendAt', async () => {
    const { svc } = make();
    await expect(svc.stage(reusePlan({ schedule: { sendAt: '2000-01-01T00:00:00+08:00' } }), 'u1'))
      .rejects.toThrow(/future/i);
  });

  it('rejects a reuse template that is not APPROVED', async () => {
    const { svc, prisma } = make();
    prisma.template.findMany.mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'PENDING' }]);
    await expect(svc.stage(reusePlan(), 'u1')).rejects.toThrow(/APPROVED/);
  });

  it('rejects a create plan whose name is not Meta-safe', async () => {
    const { svc } = make();
    const bad = reusePlan({
      intent: 'create_and_schedule',
      template: { mode: 'create', name: 'Car A!', category: 'MARKETING', languages: ['EN'], bodyText: 'hi {{1}}', variables: ['1'] },
    });
    await expect(svc.stage(bad, 'u1')).rejects.toThrow(/name/i);
  });

  it('rejects when defaultLanguage is not in a create plan languages', async () => {
    const { svc } = make();
    const bad = reusePlan({
      intent: 'create_and_schedule',
      defaultLanguage: 'ZH',
      template: { mode: 'create', name: 'car_a_promo', category: 'MARKETING', languages: ['EN', 'MS'], bodyText: 'hi {{1}}', variables: ['1'] },
    });
    await expect(svc.stage(bad, 'u1')).rejects.toThrow(/language/i);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test -- assistant-plan.service`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement validate + stage + get + cancel** (the `approve` method is added in Task 9):

```typescript
// apps/api/src/assistant/assistant-plan.service.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { TemplatesService } from '../templates/templates.service';
import { BlastsService } from '../blasts/blasts.service';
import type { AssistantPlanInput, StagedPlan } from './assistant.types';

const NAME_RE = /^[a-z][a-z0-9_]*$/;
const LANGS = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];

@Injectable()
export class AssistantPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly templates: TemplatesService,
    private readonly blasts: BlastsService,
    private readonly config: ConfigService,
  ) {}

  private ttlMs(): number {
    const raw = Number(this.config.get<string>('ASSISTANT_PLAN_TTL_MS'));
    return Number.isFinite(raw) && raw > 0 ? raw : 30 * 60 * 1000;
  }

  /** Throw BadRequestException if the plan is malformed or references things that don't exist. */
  async validate(plan: AssistantPlanInput): Promise<void> {
    if (!plan || typeof plan !== 'object') throw new BadRequestException('plan missing');
    if (!plan.campaignName?.trim()) throw new BadRequestException('campaignName required');
    if (!LANGS.includes(plan.defaultLanguage)) throw new BadRequestException('invalid defaultLanguage');

    // schedule
    const sendAt = new Date(plan.schedule?.sendAt ?? '');
    if (Number.isNaN(sendAt.getTime())) throw new BadRequestException('invalid sendAt');
    if (sendAt.getTime() <= Date.now()) throw new BadRequestException('sendAt must be in the future');

    // variableMapping keys must be numeric strings
    for (const k of Object.keys(plan.variableMapping ?? {})) {
      if (!/^\d+$/.test(k)) throw new BadRequestException(`variableMapping key "${k}" must be a number`);
    }

    // audience — must be a real segment
    const segment = await this.prisma.contactSegment.findUnique({ where: { id: plan.audience?.segmentId ?? '' } });
    if (!segment) throw new BadRequestException('audience.segmentId does not match any segment');

    // template
    const t = plan.template;
    if (t?.mode === 'reuse') {
      const rows = await this.prisma.template.findMany({ where: { name: t.name } });
      if (rows.length === 0) throw new BadRequestException(`template "${t.name}" not found`);
      const approved = rows.filter((r) => r.status === 'APPROVED');
      if (approved.length === 0) throw new BadRequestException(`template "${t.name}" has no APPROVED variant`);
      if (!approved.find((r) => r.language === plan.defaultLanguage)) {
        throw new BadRequestException(`template "${t.name}" not APPROVED in ${plan.defaultLanguage}`);
      }
    } else if (t?.mode === 'create') {
      if (!NAME_RE.test(t.name)) throw new BadRequestException('template name must be lowercase letters/digits/underscores');
      if (!t.languages?.length) throw new BadRequestException('create template needs at least one language');
      if (!t.bodyText?.trim()) throw new BadRequestException('create template needs bodyText');
      if (!t.languages.includes(plan.defaultLanguage)) {
        throw new BadRequestException('defaultLanguage must be one of the created languages');
      }
    } else {
      throw new BadRequestException('template.mode must be "reuse" or "create"');
    }
  }

  async stage(plan: AssistantPlanInput, userId: string): Promise<StagedPlan> {
    await this.validate(plan);
    const row = await this.prisma.assistantPlan.create({
      data: {
        status: 'PENDING_APPROVAL',
        plan: plan as unknown as object,
        createdById: userId,
        expiresAt: new Date(Date.now() + this.ttlMs()),
      },
    });
    return this.toStaged(row);
  }

  async get(id: string): Promise<StagedPlan> {
    const row = await this.prisma.assistantPlan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('plan not found');
    return this.toStaged(row);
  }

  async cancel(id: string): Promise<StagedPlan> {
    const row = await this.prisma.assistantPlan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('plan not found');
    const updated = await this.prisma.assistantPlan.update({ where: { id }, data: { status: 'CANCELLED' } });
    return this.toStaged(updated);
  }

  private toStaged(row: { id: string; status: string; plan: unknown; expiresAt: Date }): StagedPlan {
    return {
      id: row.id,
      status: row.status as StagedPlan['status'],
      plan: row.plan as AssistantPlanInput,
      expiresAt: row.expiresAt.toISOString(),
    };
  }
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm --filter api test -- assistant-plan.service`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/assistant/assistant-plan.service.ts apps/api/src/assistant/__tests__/assistant-plan.service.spec.ts
git commit -m "feat(assistant): plan validation + staging (rejects hallucinated refs)"
```

## Task 9: `approve` — deterministic execution

**Files:**
- Modify: `apps/api/src/assistant/assistant-plan.service.ts`
- Modify: `apps/api/src/assistant/__tests__/assistant-plan.service.spec.ts` (add a describe block)

- [ ] **Step 1: Add the failing test** (append to the existing spec file):

```typescript
describe('AssistantPlanService.approve execution', () => {
  function makeApprove(planRow: any) {
    const prisma: any = {
      contactSegment: { findUnique: jest.fn().mockResolvedValue({ id: 's1' }) },
      template: { findMany: jest.fn().mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'APPROVED' }]) },
      assistantPlan: {
        findUnique: jest.fn().mockResolvedValue(planRow),
        update: jest.fn().mockImplementation(({ data }: any) => Promise.resolve({ ...planRow, ...data })),
      },
    };
    const templates: any = {
      createDraft: jest.fn().mockResolvedValue([{ name: 'car_a_promo', version: 3 }]),
      submitGroup: jest.fn().mockResolvedValue([]),
    };
    const blasts: any = { createAndSchedule: jest.fn().mockResolvedValue({ id: 'blast1' }) };
    const config: any = { get: () => undefined };
    return {
      svc: new AssistantPlanService(prisma, templates, blasts, config),
      templates, blasts, prisma,
    };
  }

  const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  const baseRow = (plan: any) => ({
    id: 'plan1', status: 'PENDING_APPROVAL', plan, expiresAt: new Date(Date.now() + 60000),
  });

  it('reuse plan: schedules a blast without creating a template', async () => {
    const plan = {
      intent: 'reuse_and_schedule', campaignName: 'X',
      template: { mode: 'reuse', name: 'car_a_promo' }, audience: { segmentId: 's1' },
      defaultLanguage: 'EN', variableMapping: { '1': 'contact.name' }, schedule: { sendAt: FUTURE },
    };
    const { svc, templates, blasts } = makeApprove(baseRow(plan));
    const out = await svc.approve('plan1', 'u1');
    expect(templates.createDraft).not.toHaveBeenCalled();
    expect(blasts.createAndSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ templateName: 'car_a_promo', segmentId: 's1', scheduledAt: FUTURE }), 'u1',
    );
    expect(out.blastId).toBe('blast1');
  });

  it('create plan: drafts + submits the template, then schedules', async () => {
    const plan = {
      intent: 'create_and_schedule', campaignName: 'X',
      template: { mode: 'create', name: 'car_a_promo', category: 'MARKETING', languages: ['EN'], bodyText: 'hi {{1}}', variables: ['1'] },
      audience: { segmentId: 's1' }, defaultLanguage: 'EN', variableMapping: { '1': 'contact.name' }, schedule: { sendAt: FUTURE },
    };
    const { svc, templates, blasts } = makeApprove(baseRow(plan));
    await svc.approve('plan1', 'u1');
    expect(templates.createDraft).toHaveBeenCalledTimes(1);
    expect(templates.submitGroup).toHaveBeenCalledWith('car_a_promo', 3);
    expect(blasts.createAndSchedule).toHaveBeenCalledTimes(1);
  });

  it('rejects an already-executed plan', async () => {
    const { svc } = makeApprove({ ...baseRow({}), status: 'EXECUTED' });
    await expect(svc.approve('plan1', 'u1')).rejects.toThrow(/already|not pending/i);
  });

  it('rejects an expired plan', async () => {
    const plan = { intent: 'reuse_and_schedule', template: { mode: 'reuse', name: 'x' } };
    const { svc } = makeApprove({ ...baseRow(plan), expiresAt: new Date(Date.now() - 1000) });
    await expect(svc.approve('plan1', 'u1')).rejects.toThrow(/expired/i);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test -- assistant-plan.service`
Expected: FAIL — `svc.approve is not a function`.

- [ ] **Step 3: Implement `approve`** (add this method to `AssistantPlanService`):

```typescript
  /** Execute a staged plan deterministically: (create→submit template) then schedule the blast. */
  async approve(id: string, userId: string): Promise<{ blastId: string; templateName: string }> {
    const row = await this.prisma.assistantPlan.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('plan not found');
    if (row.status !== 'PENDING_APPROVAL') throw new BadRequestException('plan is not pending approval');
    if (row.expiresAt.getTime() < Date.now()) {
      await this.prisma.assistantPlan.update({ where: { id }, data: { status: 'EXPIRED' } });
      throw new BadRequestException('plan has expired — please ask again');
    }

    const plan = row.plan as unknown as AssistantPlanInput;
    await this.validate(plan); // re-validate at execution time (segment/time may have changed)

    let templateName = plan.template.name;
    let templateVersion: number | null = null;
    try {
      if (plan.template.mode === 'create') {
        const spec = plan.template; // const local: narrowed to CreateTemplateSpec, preserved inside the closure
        const created = await this.templates.createDraft(
          {
            name: spec.name,
            category: spec.category,
            variants: spec.languages.map((language) => ({
              language,
              bodyText: spec.bodyText,
              variables: spec.variables,
            })),
          },
          userId,
        );
        templateVersion = created[0]?.version ?? null;
        templateName = created[0]?.name ?? spec.name;
        if (templateVersion != null) await this.templates.submitGroup(templateName, templateVersion);
      }

      const blast = await this.blasts.createAndSchedule(
        {
          name: plan.campaignName,
          templateName,
          defaultLanguage: plan.defaultLanguage,
          segmentId: plan.audience.segmentId,
          variableMapping: plan.variableMapping,
          scheduledAt: plan.schedule.sendAt,
        },
        userId,
      );

      await this.prisma.assistantPlan.update({
        where: { id },
        data: { status: 'EXECUTED', blastId: blast.id, templateName, templateVersion },
      });
      return { blastId: blast.id, templateName };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'execution failed';
      await this.prisma.assistantPlan.update({ where: { id }, data: { error: message } }).catch(() => undefined);
      throw err;
    }
  }
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm --filter api test -- assistant-plan.service`
Expected: PASS (10 tests total).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/assistant/assistant-plan.service.ts apps/api/src/assistant/__tests__/assistant-plan.service.spec.ts
git commit -m "feat(assistant): deterministic plan execution (create→submit→schedule)"
```

---

# Phase 5 — The tool-calling loop + HTTP surface

## Task 10: Tool definitions + system prompt

**Files:**
- Create: `apps/api/src/assistant/tool-defs.ts`

- [ ] **Step 1: Write the definitions** (no test — static data, exercised by Task 12):

```typescript
// apps/api/src/assistant/tool-defs.ts
import type { ToolDef } from './assistant.types';

export const SYSTEM_PROMPT = `You are the campaign assistant for a single-tenant WhatsApp marketing system for a Malaysian car-dealer business. Time zone is Asia/Kuala_Lumpur.

Your job: turn the operator's request into ONE call to propose_plan. You may first call the read tools to gather facts. You MUST NOT invent template names, segment ids, or dates — get them from the tools.

Rules:
- Reuse vs create: if the operator wants an existing template, use search_templates and set template.mode="reuse". If they want a new message, set template.mode="create" and write a concise marketing body using {{1}}, {{2}} placeholders.
- Always resolve relative dates ("Monday morning") with resolve_datetime; never guess an ISO string yourself.
- Always pick the audience via search_audience; use the returned segmentId.
- variableMapping maps each "{{n}}" to a contact field (e.g. {"1":"contact.name"}).
- If you cannot determine the audience or date, ask the operator a short clarifying question instead of calling propose_plan.
- Call propose_plan exactly once when you have everything.`;

export const TOOL_DEFS: ToolDef[] = [
  {
    name: 'search_templates',
    description: 'Find APPROVED WhatsApp templates whose name matches the query. Use for the reuse path.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'keywords, e.g. a car model' } },
      required: ['query'],
    },
  },
  {
    name: 'search_audience',
    description: 'Find contact segments (audiences) by name, with recipient counts.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'e.g. "dealers"' } },
      required: ['query'],
    },
  },
  {
    name: 'resolve_datetime',
    description: 'Convert a natural-language date/time phrase into a concrete Kuala Lumpur ISO timestamp.',
    parameters: {
      type: 'object',
      properties: { phrase: { type: 'string', description: 'e.g. "Monday morning"' } },
      required: ['phrase'],
    },
  },
  {
    name: 'get_template_variables',
    description: 'List the {{n}} variables a named template expects.',
    parameters: {
      type: 'object',
      properties: { name: { type: 'string' } },
      required: ['name'],
    },
  },
  {
    name: 'propose_plan',
    description: 'Submit the final campaign plan for human approval. Call this exactly once when ready.',
    parameters: {
      type: 'object',
      properties: {
        intent: { type: 'string', enum: ['reuse_and_schedule', 'create_and_schedule'] },
        campaignName: { type: 'string' },
        template: {
          type: 'object',
          properties: {
            mode: { type: 'string', enum: ['reuse', 'create'] },
            name: { type: 'string' },
            category: { type: 'string', enum: ['MARKETING', 'UTILITY', 'AUTHENTICATION'] },
            languages: { type: 'array', items: { type: 'string' } },
            bodyText: { type: 'string' },
            variables: { type: 'array', items: { type: 'string' } },
          },
          required: ['mode', 'name'],
        },
        audience: { type: 'object', properties: { segmentId: { type: 'string' } }, required: ['segmentId'] },
        defaultLanguage: { type: 'string', enum: ['EN', 'MS', 'ZH', 'TA', 'OTHER'] },
        variableMapping: { type: 'object', additionalProperties: { type: 'string' } },
        schedule: { type: 'object', properties: { sendAt: { type: 'string' } }, required: ['sendAt'] },
      },
      required: ['intent', 'campaignName', 'template', 'audience', 'defaultLanguage', 'schedule'],
    },
  },
];

export const PROPOSE_PLAN = 'propose_plan';
export const MAX_ITERATIONS = 5;
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter api build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/assistant/tool-defs.ts
git commit -m "feat(assistant): tool definitions + system prompt"
```

## Task 11: `AssistantLlm` seam + `OllamaAssistantLlm`

**Files:**
- Create: `apps/api/src/assistant/assistant-llm.ts`

The abstract token is the seam stubbed in tests; the Ollama impl mirrors `OllamaLlmService`'s axios setup.

- [ ] **Step 1: Implement** (no unit test — covered by Task 12's fake; the real HTTP path is exercised manually/integration):

```typescript
// apps/api/src/assistant/assistant-llm.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import type { AssistantLlmTurn, ChatMessage, ToolDef } from './assistant.types';

/** Injection token + seam. Tests provide a fake; prod binds OllamaAssistantLlm. */
export abstract class AssistantLlm {
  abstract chat(messages: ChatMessage[], tools: ToolDef[]): Promise<AssistantLlmTurn>;
}

@Injectable()
export class OllamaAssistantLlm extends AssistantLlm {
  private readonly logger = new Logger(OllamaAssistantLlm.name);
  private readonly http: AxiosInstance;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    super();
    const baseURL = this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    const rawTimeout = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS', '60000'));
    const timeout = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 60000;
    this.model = this.config.get<string>('OLLAMA_ASSISTANT_MODEL') || this.config.get<string>('OLLAMA_TEMPLATE_MODEL', 'qwen3:14b');
    this.http = axios.create({ baseURL, timeout });
  }

  async chat(messages: ChatMessage[], tools: ToolDef[]): Promise<AssistantLlmTurn> {
    const { data } = await this.http.post('/api/chat', {
      model: this.model,
      stream: false,
      think: false,
      options: { temperature: 0.2 },
      tools: tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
      messages,
    });
    const msg = data?.message ?? {};
    const toolCalls = (msg.tool_calls ?? []).map((tc: any) => {
      const raw = tc.function?.arguments;
      const args = typeof raw === 'string' ? safeJson(raw) : (raw ?? {});
      return { name: tc.function?.name, arguments: args };
    });
    return {
      content: typeof msg.content === 'string' ? msg.content : '',
      toolCalls,
      raw: msg,
    };
  }
}

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter api build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/assistant/assistant-llm.ts
git commit -m "feat(assistant): AssistantLlm seam + Ollama tool-calling client"
```

## Task 12: `AssistantService` — the loop

**Files:**
- Create: `apps/api/src/assistant/assistant.service.ts`
- Test: `apps/api/src/assistant/__tests__/assistant.service.spec.ts`

- [ ] **Step 1: Write the failing test** (a scripted fake LLM drives the loop)

```typescript
// apps/api/src/assistant/__tests__/assistant.service.spec.ts
import { AssistantService } from '../assistant.service';
import type { AssistantLlmTurn } from '../assistant.types';

function turn(toolCalls: { name: string; arguments: any }[], content = ''): AssistantLlmTurn {
  return { content, toolCalls, raw: { role: 'assistant', content, tool_calls: toolCalls } };
}

function make(script: AssistantLlmTurn[]) {
  let i = 0;
  const llm: any = { chat: jest.fn().mockImplementation(() => Promise.resolve(script[i++])) };
  const tools: any = { run: jest.fn().mockResolvedValue({ ok: true, templates: [{ name: 'car_a_promo' }] }) };
  const plans: any = {
    stage: jest.fn().mockResolvedValue({ id: 'plan1', status: 'PENDING_APPROVAL', plan: {}, expiresAt: 'x' }),
  };
  return { svc: new AssistantService(llm, tools, plans), llm, tools, plans };
}

describe('AssistantService loop', () => {
  it('runs a read tool, then stages a proposed plan', async () => {
    const { svc, tools, plans } = make([
      turn([{ name: 'search_templates', arguments: { query: 'car a' } }]),
      turn([{ name: 'propose_plan', arguments: { campaignName: 'X' } }], 'Here is your campaign.'),
    ]);
    const out = await svc.handleMessage({ message: 'blast dealers about car a monday', history: [], userId: 'u1' });
    expect(tools.run).toHaveBeenCalledWith('search_templates', { query: 'car a' });
    expect(plans.stage).toHaveBeenCalledTimes(1);
    expect(out.plan?.id).toBe('plan1');
  });

  it('returns a clarifying question when the model produces no tool calls', async () => {
    const { svc, plans } = make([turn([], 'Which audience did you mean?')]);
    const out = await svc.handleMessage({ message: 'send a blast', history: [], userId: 'u1' });
    expect(out.reply).toMatch(/which audience/i);
    expect(plans.stage).not.toHaveBeenCalled();
  });

  it('feeds a validation error back and lets the model repair', async () => {
    const { svc, plans } = make([
      turn([{ name: 'propose_plan', arguments: { bad: true } }]),
      turn([{ name: 'propose_plan', arguments: { campaignName: 'fixed' } }], 'Fixed.'),
    ]);
    plans.stage
      .mockRejectedValueOnce(new Error('sendAt must be in the future'))
      .mockResolvedValueOnce({ id: 'plan2', status: 'PENDING_APPROVAL', plan: {}, expiresAt: 'x' });
    const out = await svc.handleMessage({ message: 'x', history: [], userId: 'u1' });
    expect(plans.stage).toHaveBeenCalledTimes(2);
    expect(out.plan?.id).toBe('plan2');
  });

  it('gives up gracefully after MAX_ITERATIONS of only read tools', async () => {
    const loopTurn = turn([{ name: 'search_templates', arguments: { query: 'x' } }]);
    const { svc } = make([loopTurn, loopTurn, loopTurn, loopTurn, loopTurn, loopTurn]);
    const out = await svc.handleMessage({ message: 'x', history: [], userId: 'u1' });
    expect(out.reply).toMatch(/couldn'?t/i);
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `pnpm --filter api test -- assistant.service`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the loop**

```typescript
// apps/api/src/assistant/assistant.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { AssistantLlm } from './assistant-llm';
import { AssistantToolsService } from './assistant-tools.service';
import { AssistantPlanService } from './assistant-plan.service';
import { MAX_ITERATIONS, PROPOSE_PLAN, SYSTEM_PROMPT, TOOL_DEFS } from './tool-defs';
import type { AssistantPlanInput, ChatMessage, ChatResult } from './assistant.types';

interface HandleInput {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  userId: string;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly llm: AssistantLlm,
    private readonly tools: AssistantToolsService,
    private readonly plans: AssistantPlanService,
  ) {}

  async handleMessage({ message, history, userId }: HandleInput): Promise<ChatResult> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content }) as ChatMessage),
      { role: 'user', content: message },
    ];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const turn = await this.llm.chat(messages, TOOL_DEFS);
      messages.push(turn.raw as ChatMessage);

      if (turn.toolCalls.length === 0) {
        return { reply: turn.content || 'Could you clarify the audience and when to send?' };
      }

      const propose = turn.toolCalls.find((tc) => tc.name === PROPOSE_PLAN);
      if (propose) {
        try {
          const staged = await this.plans.stage(propose.arguments as unknown as AssistantPlanInput, userId);
          return { reply: turn.content || 'Here is the campaign — review and approve.', plan: staged };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'invalid plan';
          this.logger.warn(`propose_plan rejected, asking model to repair: ${error}`);
          messages.push({ role: 'tool', content: JSON.stringify({ error }) });
          continue;
        }
      }

      for (const tc of turn.toolCalls) {
        const result = await this.tools.run(tc.name, tc.arguments);
        messages.push({ role: 'tool', content: JSON.stringify(result) });
      }
    }

    return { reply: "I couldn't complete that — try again with the audience and a clear send time (e.g. \"Monday morning\")." };
  }
}
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `pnpm --filter api test -- assistant.service`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/assistant/assistant.service.ts apps/api/src/assistant/__tests__/assistant.service.spec.ts
git commit -m "feat(assistant): tool-calling loop with repair + iteration cap"
```

## Task 13: DTOs, controller, module wiring

**Files:**
- Create: `apps/api/src/assistant/dto/chat.dto.ts`, `apps/api/src/assistant/assistant.controller.ts`, `apps/api/src/assistant/assistant.module.ts`
- Modify: `apps/api/src/app.module.ts:26`; confirm `TemplatesModule` / `SegmentsModule` export their services.

- [ ] **Step 1: Write the DTOs**

```typescript
// apps/api/src/assistant/dto/chat.dto.ts
import { Type } from 'class-transformer';
import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export class ChatHistoryItemDto {
  @IsIn(['user', 'assistant'])
  role!: 'user' | 'assistant';

  @IsString()
  @MaxLength(4000)
  content!: string;
}

export class ChatRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItemDto)
  history?: ChatHistoryItemDto[];
}
```

- [ ] **Step 2: Write the controller**

```typescript
// apps/api/src/assistant/assistant.controller.ts
import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import { AssistantPlanService } from './assistant-plan.service';
import { ChatRequestDto } from './dto/chat.dto';

@Controller('assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly plans: AssistantPlanService,
  ) {}

  @Post('chat')
  chat(@Body() dto: ChatRequestDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.assistant.handleMessage({ message: dto.message, history: dto.history ?? [], userId });
  }

  @Post('plans/:id/approve')
  approve(@Param('id') id: string, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.plans.approve(id, userId);
  }

  @Post('plans/:id/cancel')
  cancel(@Param('id') id: string) {
    return this.plans.cancel(id);
  }
}
```

> Note: confirm the guard import path matches the repo (it's `JwtAuthGuard` used by `SegmentsController` — copy that exact import path if it differs).

- [ ] **Step 3: Write the module**

```typescript
// apps/api/src/assistant/assistant.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TemplatesModule } from '../templates/templates.module';
import { BlastsModule } from '../blasts/blasts.module';
import { SegmentsModule } from '../segments/segments.module';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AssistantPlanService } from './assistant-plan.service';
import { AssistantToolsService } from './assistant-tools.service';
import { AssistantLlm, OllamaAssistantLlm } from './assistant-llm';

@Module({
  imports: [AuthModule, PrismaModule, TemplatesModule, BlastsModule, SegmentsModule],
  controllers: [AssistantController],
  providers: [
    AssistantService,
    AssistantPlanService,
    AssistantToolsService,
    { provide: AssistantLlm, useClass: OllamaAssistantLlm },
  ],
})
export class AssistantModule {}
```

- [ ] **Step 4: Confirm service exports.** Open `apps/api/src/templates/templates.module.ts` and `apps/api/src/segments/segments.module.ts`. Each must list its service in `exports`. If `TemplatesService` / `SegmentsService` is missing from `exports`, add it (BlastsModule already exports `BlastsService`). Example for segments:

```typescript
  exports: [SegmentsService],
```

- [ ] **Step 5: Register the module** in `apps/api/src/app.module.ts` — add `AssistantModule` to the `imports` array (after `CannedRepliesModule` is fine):

```typescript
import { AssistantModule } from './assistant/assistant.module';
// ...
    CannedRepliesModule,
    AssistantModule,
    ChatbotKnowledgeModule,
```

- [ ] **Step 6: Build to verify DI resolves**

Run: `pnpm --filter api build`
Expected: clean build (Nest can resolve `AssistantLlm`, `TemplatesService`, `BlastsService`, `SegmentsService`). If it reports an unresolved dependency, the missing module isn't exporting its service — fix Step 4.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/assistant/dto apps/api/src/assistant/assistant.controller.ts apps/api/src/assistant/assistant.module.ts apps/api/src/app.module.ts apps/api/src/templates/templates.module.ts apps/api/src/segments/segments.module.ts
git commit -m "feat(assistant): HTTP controller + module wiring"
```

## Task 14: End-to-end-ish integration test (chat → propose → approve)

**Files:**
- Create: `apps/api/src/assistant/__tests__/assistant.e2e-ish.spec.ts`

This wires the real `AssistantService` + `AssistantPlanService` together with a fake LLM and stubbed `TemplatesService`/`BlastsService`, proving the full path produces a scheduled blast.

- [ ] **Step 1: Write the test**

```typescript
// apps/api/src/assistant/__tests__/assistant.e2e-ish.spec.ts
import { AssistantService } from '../assistant.service';
import { AssistantPlanService } from '../assistant-plan.service';
import { AssistantToolsService } from '../assistant-tools.service';
import type { AssistantLlmTurn } from '../assistant.types';

const FUTURE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const turn = (toolCalls: any[], content = ''): AssistantLlmTurn => ({ content, toolCalls, raw: { role: 'assistant', content, tool_calls: toolCalls } });

describe('assistant chat → propose → approve (integration)', () => {
  it('stages then executes a reuse plan into a scheduled blast', async () => {
    // shared prisma stub
    const planRows: any = {};
    const prisma: any = {
      template: { findMany: jest.fn().mockResolvedValue([{ name: 'car_a_promo', language: 'EN', status: 'APPROVED', variables: ['1'] }]) },
      contactSegment: { findUnique: jest.fn().mockResolvedValue({ id: 's1', name: 'Dealers' }) },
      assistantPlan: {
        create: jest.fn().mockImplementation(({ data }: any) => {
          planRows['plan1'] = { id: 'plan1', ...data, expiresAt: data.expiresAt };
          return Promise.resolve(planRows['plan1']);
        }),
        findUnique: jest.fn().mockImplementation(({ where }: any) => Promise.resolve(planRows[where.id])),
        update: jest.fn().mockImplementation(({ where, data }: any) => {
          planRows[where.id] = { ...planRows[where.id], ...data };
          return Promise.resolve(planRows[where.id]);
        }),
      },
    };
    const segments: any = { list: jest.fn(), preview: jest.fn() };
    const templates: any = { createDraft: jest.fn(), submitGroup: jest.fn() };
    const blasts: any = { createAndSchedule: jest.fn().mockResolvedValue({ id: 'blast1' }) };
    const config: any = { get: () => undefined };

    const planService = new AssistantPlanService(prisma, templates, blasts, config);
    const toolsService = new AssistantToolsService(prisma, segments);

    const llm: any = {
      chat: jest.fn().mockResolvedValueOnce(
        turn([{ name: 'propose_plan', arguments: {
          intent: 'reuse_and_schedule', campaignName: 'Car A — June',
          template: { mode: 'reuse', name: 'car_a_promo' }, audience: { segmentId: 's1' },
          defaultLanguage: 'EN', variableMapping: { '1': 'contact.name' }, schedule: { sendAt: FUTURE },
        } }], 'Ready to send.'),
      ),
    };

    const assistant = new AssistantService(llm, toolsService, planService);

    const chat = await assistant.handleMessage({ message: 'blast dealers about car A on monday morning', history: [], userId: 'u1' });
    expect(chat.plan?.id).toBe('plan1');

    const result = await planService.approve(chat.plan!.id, 'u1');
    expect(result.blastId).toBe('blast1');
    expect(blasts.createAndSchedule).toHaveBeenCalledWith(
      expect.objectContaining({ templateName: 'car_a_promo', segmentId: 's1', scheduledAt: FUTURE }), 'u1',
    );
    expect(planRows['plan1'].status).toBe('EXECUTED');
  });
});
```

- [ ] **Step 2: Run it and confirm it passes**

Run: `pnpm --filter api test -- assistant.e2e-ish`
Expected: PASS (1 test).

- [ ] **Step 3: Run the full API suite to confirm no regressions**

Run: `pnpm --filter api test`
Expected: all suites PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/assistant/__tests__/assistant.e2e-ish.spec.ts
git commit -m "test(assistant): integration chat→propose→approve produces a scheduled blast"
```

---

# Phase 6 — Frontend (slide-over panel)

> No web unit-test runner exists. Verify every frontend task with `pnpm --filter web build`.

## Task 15: API client `api/assistant.ts`

**Files:**
- Create: `apps/web/src/api/assistant.ts`

- [ ] **Step 1: Write the client** (mirrors `api/analytics.ts`):

```typescript
// apps/web/src/api/assistant.ts
import { api } from './client';

export type PlanLanguage = 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

export interface TemplateSpecReuse { mode: 'reuse'; name: string }
export interface TemplateSpecCreate {
  mode: 'create'; name: string; category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  languages: PlanLanguage[]; bodyText: string; variables: string[];
}
export interface AssistantPlanInput {
  intent: 'reuse_and_schedule' | 'create_and_schedule';
  campaignName: string;
  template: TemplateSpecReuse | TemplateSpecCreate;
  audience: { segmentId: string };
  defaultLanguage: PlanLanguage;
  variableMapping: Record<string, string>;
  schedule: { sendAt: string };
}
export interface StagedPlan {
  id: string;
  status: 'PENDING_APPROVAL' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED';
  plan: AssistantPlanInput;
  expiresAt: string;
}
export interface ChatHistoryItem { role: 'user' | 'assistant'; content: string }
export interface ChatResult { reply: string; plan?: StagedPlan }
export interface ApproveResult { blastId: string; templateName: string }

export const sendAssistantMessage = (body: { message: string; history: ChatHistoryItem[] }) =>
  api.post<ChatResult>('/assistant/chat', body).then((r) => r.data);

export const approvePlan = (id: string) =>
  api.post<ApproveResult>(`/assistant/plans/${id}/approve`).then((r) => r.data);

export const cancelPlan = (id: string) =>
  api.post<StagedPlan>(`/assistant/plans/${id}/cancel`).then((r) => r.data);
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/assistant.ts
git commit -m "feat(web): assistant API client + types"
```

## Task 16: `PlanCards` confirmation component

**Files:**
- Create: `apps/web/src/components/assistant/PlanCards.tsx`

- [ ] **Step 1: Write the component** (uses `Card`/`Button` per the repo):

```tsx
// apps/web/src/components/assistant/PlanCards.tsx
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { StagedPlan } from '../../api/assistant';

export function PlanCards({
  staged, onApprove, onCancel, pending,
}: {
  staged: StagedPlan;
  onApprove: () => void;
  onCancel: () => void;
  pending: boolean;
}) {
  const { plan } = staged;
  const t = plan.template;
  const sendAt = new Date(plan.schedule.sendAt);
  return (
    <div className="space-y-3">
      <Card title="Template" subtitle={t.mode === 'reuse' ? 'Reusing approved template' : 'New template (submits to Meta)'}>
        <div className="text-sm font-medium text-foreground">{t.name}</div>
        {t.mode === 'create' && (
          <>
            <div className="mt-1 text-xs text-foreground-muted">{t.category} · {t.languages.join(', ')}</div>
            <div className="mt-2 whitespace-pre-wrap rounded-md bg-background-muted p-3 text-[13px] text-foreground">{t.bodyText}</div>
          </>
        )}
      </Card>

      <Card title="Audience">
        <div className="text-sm text-foreground">Segment: <span className="font-mono">{plan.audience.segmentId}</span></div>
      </Card>

      <Card title="Schedule">
        <div className="text-sm text-foreground">{sendAt.toLocaleString('en-MY', { timeZone: 'Asia/Kuala_Lumpur' })} (KL)</div>
        <div className="mt-1 text-xs text-foreground-muted">Campaign: {plan.campaignName}</div>
      </Card>

      <div className="flex gap-2">
        <Button variant="primary" onClick={onApprove} disabled={pending}>
          {pending ? 'Scheduling…' : 'Approve & schedule'}
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={pending}>Cancel</Button>
      </div>
    </div>
  );
}
```

> If `bg-background-muted` / `text-foreground-muted` aren't in the Tailwind theme, substitute the nearest token used elsewhere (grep `text-foreground-muted` in `apps/web/src` — `Card.tsx` already uses it, so it exists).

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/assistant/PlanCards.tsx
git commit -m "feat(web): plan confirmation cards"
```

## Task 17: `AssistantPanel` slide-over

**Files:**
- Create: `apps/web/src/components/assistant/AssistantPanel.tsx`

- [ ] **Step 1: Write the component** (mutation pattern mirrors `AddDealerModal`):

```tsx
// apps/web/src/components/assistant/AssistantPanel.tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sendAssistantMessage, approvePlan, cancelPlan, type ChatHistoryItem, type StagedPlan } from '../../api/assistant';
import { useToast } from '../toast/ToastProvider';
import { Button } from '../ui/Button';
import { AIOrb } from '../ui/AIOrb';
import { PlanCards } from './PlanCards';

const inputCls =
  'h-10 w-full rounded-md border border-border-strong bg-background px-3 text-[13px] text-foreground outline-none focus:border-accent focus:ring-2 focus:ring-accent';

export function AssistantPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { showToast } = useToast();
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [input, setInput] = useState('');
  const [plan, setPlan] = useState<StagedPlan | null>(null);

  const chat = useMutation({
    mutationFn: sendAssistantMessage,
    onSuccess: (res) => {
      setHistory((h) => [...h, { role: 'assistant', content: res.reply }]);
      if (res.plan) setPlan(res.plan);
    },
    onError: () => showToast('Assistant request failed'),
  });

  const approve = useMutation({
    mutationFn: (id: string) => approvePlan(id),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['blasts'] });
      showToast(`Campaign scheduled (${res.templateName})`);
      setPlan(null);
      setHistory((h) => [...h, { role: 'assistant', content: 'Done — campaign scheduled.' }]);
    },
    onError: () => showToast('Could not schedule the campaign'),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const msg = input.trim();
    if (!msg || chat.isPending) return;
    const nextHistory = [...history, { role: 'user' as const, content: msg }];
    setHistory(nextHistory);
    setInput('');
    chat.mutate({ message: msg, history });
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-label="Campaign assistant">
      <div className="flex-1 bg-black/30" onClick={onClose} />
      <aside className="flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl">
        <header className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <AIOrb size={22} breathe />
            <span className="text-sm font-medium text-foreground">Campaign assistant</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {history.length === 0 && (
            <p className="text-[13px] text-foreground-muted">
              Try: “blast dealers about car A on Monday morning”.
            </p>
          )}
          {history.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'text-right' : ''}>
              <span className={`inline-block rounded-lg px-3 py-2 text-[13px] ${m.role === 'user' ? 'bg-accent text-white' : 'bg-background-muted text-foreground'}`}>
                {m.content}
              </span>
            </div>
          ))}
          {chat.isPending && <p className="text-[13px] text-foreground-muted">Thinking…</p>}
          {plan && (
            <PlanCards
              staged={plan}
              pending={approve.isPending}
              onApprove={() => approve.mutate(plan.id)}
              onCancel={() => { cancelPlan(plan.id).catch(() => undefined); setPlan(null); }}
            />
          )}
        </div>

        <form onSubmit={submit} className="border-t border-border p-3">
          <input
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the campaign…"
            className={inputCls}
          />
        </form>
      </aside>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: clean. (If a Tailwind token name doesn't exist, grep an existing component for the right one and adjust.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/assistant/AssistantPanel.tsx
git commit -m "feat(web): assistant slide-over panel"
```

## Task 18: Mount the panel + AIOrb trigger in `Layout`

**Files:**
- Modify: `apps/web/src/components/Layout.tsx`

- [ ] **Step 1: Add imports** at the top of `Layout.tsx`:

```typescript
import { AssistantPanel } from './assistant/AssistantPanel';
import { AIOrb } from './ui/AIOrb';
```

- [ ] **Step 2: Add open state** next to the existing `paletteOpen` state:

```typescript
const [assistantOpen, setAssistantOpen] = useState(false);
```

- [ ] **Step 3: Add a floating trigger button** (place near the end of the layout JSX, before the `<CommandPalette ... />` mount). The `AIOrb` is passive, so wrap it in a button:

```tsx
<button
  type="button"
  onClick={() => setAssistantOpen(true)}
  aria-label="Open campaign assistant"
  className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-lg hover:opacity-90"
>
  <AIOrb size={26} breathe />
</button>
```

- [ ] **Step 4: Mount the panel** right next to the command palette mount (the lines that render `<CommandPalette ... />` and `<KeyboardShortcutsOverlay ... />`):

```tsx
<AssistantPanel open={assistantOpen} onClose={() => setAssistantOpen(false)} />
```

- [ ] **Step 5: (Optional) keyboard shortcut.** In the existing `onKey` handler in `Layout.tsx`, add an opener (choose a key not already bound — e.g. Cmd/Ctrl+J):

```typescript
if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') { e.preventDefault(); setAssistantOpen((v) => !v); }
```

- [ ] **Step 6: Typecheck/build**

Run: `pnpm --filter web build`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/components/Layout.tsx
git commit -m "feat(web): mount assistant panel + AIOrb trigger in Layout"
```

---

# Phase 7 — Config & docs

## Task 19: Document env vars

**Files:**
- Modify: `apps/api/.env.example`

- [ ] **Step 1: Append** the new variables (with comments) to `apps/api/.env.example`:

```bash
# --- Blast assistant ---
# Reuses the LLM Ollama base/timeout from the template generator; optionally a distinct model:
OLLAMA_ASSISTANT_MODEL=qwen3:14b
# Staged-plan time-to-live before it expires and must be re-proposed (ms; default 30 min):
ASSISTANT_PLAN_TTL_MS=1800000
# Fire-time guard for campaigns scheduled against a not-yet-approved template:
#   how often the worker re-checks approval while holding (ms; default 5 min):
ASSISTANT_TEMPLATE_RECHECK_MS=300000
#   how long to keep holding before failing the blast (ms; default 24 h):
ASSISTANT_TEMPLATE_GRACE_MS=86400000
```

> The assistant uses Ollama native tool-calling, so it requires `LLM_PROVIDER=ollama` and a reachable Ollama with a tool-capable model (`qwen3:14b`). In `WHATSAPP_MOCK_MODE=true`, template submission is instant, so create-and-schedule works without real Meta approval.

- [ ] **Step 2: Commit**

```bash
git add apps/api/.env.example
git commit -m "docs(api): document blast-assistant env vars"
```

## Task 20: Final verification sweep

- [ ] **Step 1: Full backend test suite**

Run: `pnpm --filter api test`
Expected: all PASS.

- [ ] **Step 2: Backend build**

Run: `pnpm --filter api build`
Expected: clean.

- [ ] **Step 3: Web build (typecheck)**

Run: `pnpm --filter web build`
Expected: clean.

- [ ] **Step 4: Manual smoke (optional, needs the Mac/Ollama + DB/Redis up).** Start API + worker + web, set `LLM_PROVIDER=ollama` and `WHATSAPP_MOCK_MODE=true`, open the assistant, type "blast dealers about car A on Monday morning", confirm a plan appears, approve it, and check the new campaign under `/blasts`.

- [ ] **Step 5: Final commit (if any uncommitted verification tweaks)**

```bash
git add -A
git commit -m "chore(assistant): final verification fixes"
```

---

## Notes on the reliability fallback (from the spec's "Open questions")

This plan implements **native Ollama tool-calling** (`tools` array). If, during Task 20's manual smoke, `qwen3:14b` proves unreliable at emitting `propose_plan` (e.g. it narrates instead of calling the tool), the fallback is to add a constrained-JSON terminal turn in `OllamaAssistantLlm.chat`: when the running transcript already contains the facts, issue a final `/api/chat` call with `format: <propose_plan JSON schema>` (no `tools`) and synthesize a single `propose_plan` tool call from the parsed object. The `AssistantService` loop and the `propose_plan` contract are unchanged — only `OllamaAssistantLlm` changes. Decide this only if the smoke test shows it's needed.
