# WhatsApp Simulator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give QA a browser "fake WhatsApp phone" to chat with the chatbot and watch blasts arrive — plus an HTTP scenario runner — all offline, no real phone, no Meta call.

**Architecture:** A dev-only NestJS `SimulatorModule` exposes `POST /api/sim/inbound` (runs the existing `ChatbotService.handleInbound` synchronously in the API process and returns the existing `SimResult`), `GET /api/sim/thread/:phone` (a unified phone timeline merging chatbot in/out messages + blasts targeting the number, rendered on read), `POST /api/sim/reset/:phone`, and `GET /api/sim/status`. A web `/simulator` page drives these. The shared invocation/read-back logic is extracted from the existing CLI simulator so the CLI and the HTTP path can't drift.

**Tech Stack:** NestJS 10 (Nest controllers/guards, `@nestjs/config`), Prisma 5 / Postgres, React 18 + Vite + React Query + axios, Jest (`nock` for HTTP, hand-rolled stubs for services), Playwright.

## Global Constraints

- **pnpm 9 workspace.** Target packages with `pnpm --filter <api|web|e2e>`. Run from repo root unless noted.
- **API tests:** Jest. The arg after `--` is a **path/filename regex**, not a test name: `pnpm --filter api test -- simulator`. Follow the repo convention — instantiate services directly with hand-rolled stubs (no full `TestingModule`); use `nock` only for outbound HTTP.
- **Web has no lint/standalone typecheck** — typecheck the web app with `pnpm --filter web build`.
- **Prisma:** after any `schema.prisma` change run `pnpm --filter api db:generate`. **This plan makes no schema changes.**
- **Safety rule (verbatim, non-negotiable):** the simulator must be **off by default** and must **refuse to run unless `WHATSAPP_MOCK_MODE=true`**. Server-enforced at request time.
- **Env flags (exact names):** API `SIMULATOR_ENABLED` (default `false`); web `VITE_SIMULATOR_ENABLED` (default `false`).
- **Routes (exact):** API under global prefix `api` → `/api/sim/inbound`, `/api/sim/thread/:phone`, `/api/sim/reset/:phone`, `/api/sim/status`. Web route `/simulator`.
- **Seeded admin for tests/runner:** `admin@example.com` / `ChangeMe123!`.
- **`Message` has NO `createdAt`/`updatedAt`** — only `sentAt`/`deliveredAt`/`readAt`/`repliedAt`. For ordering a not-yet-sent (`QUEUED`) blast message, fall back to its `Blast.scheduledAt`.
- **`Message.templateId` already encodes the per-recipient language** — to render a blast on read, fetch that exact `Template`, the `Blast` (for `variableMapping`), and the `Contact`, then call `renderTemplate(template.bodyText, blast.variableMapping, contact)`. Do **not** re-derive language.

---

## File Structure

**Backend (`apps/api`):**
- `src/chatbot/sim/sim-readback.ts` (NEW) — pure, module-free helpers shared by CLI + HTTP: `SimResult`, `DerivedSubKind`, `deriveSubKind`, `normalizeToE164`, `ensureSimContact`, `buildSimPayload`, `readBackSimResult`.
- `src/chatbot/sim/sim.command.ts` (MODIFY) — delegate to `sim-readback.ts`; re-export `SimResult`/`DerivedSubKind`/`deriveSubKind` so existing importers (`chatbot-soak.ts`) keep working.
- `src/simulator/simulator.guard.ts` (NEW) — `SimulatorGuard`: 404 when disabled, 412 when not mock.
- `src/simulator/dto/simulate-inbound.dto.ts` (NEW) — request DTO.
- `src/simulator/simulator.service.ts` (NEW) — `simulateInbound`, `getThread`, `reset`, `status`; owns `ThreadItem`/`ThreadResponse`/`SimStatus` types.
- `src/simulator/simulator.controller.ts` (NEW) — the four routes, guarded.
- `src/simulator/simulator.module.ts` (NEW) — imports `ChatbotModule` + `ChatbotSettingsModule`.
- `src/app.module.ts` (MODIFY) — always register `SimulatorModule` (gating is runtime, in the guard).
- `scripts/sim-scenarios.ts` (NEW) + `scripts/sim-scenarios.json` (NEW) — HTTP flow-assertion runner + corpus.
- `package.json` (MODIFY) — add `chatbot:scenarios` script.
- `.env.example` (MODIFY) — document `SIMULATOR_ENABLED`.

**Frontend (`apps/web`):**
- `src/api/simulator.ts` (NEW) — typed client functions.
- `src/pages/Simulator.tsx` (NEW) — the phone UI.
- `src/App.tsx` (MODIFY) — add `/simulator` route.
- `src/lib/roles.ts` (MODIFY) — add a gated nav item.
- `.env.example` (MODIFY) — document `VITE_SIMULATOR_ENABLED`.

**E2E (`e2e`):**
- `tests/simulator.spec.ts` (NEW) — login + send "stop" + assert the thread shows it.

---

## Task 1: Extract shared `sim-readback.ts` (refactor; keep CLI green)

**Files:**
- Create: `apps/api/src/chatbot/sim/sim-readback.ts`
- Create: `apps/api/src/chatbot/sim/__tests__/sim-readback.spec.ts`
- Modify: `apps/api/src/chatbot/sim/sim.command.ts`

**Interfaces:**
- Consumes: `PrismaService`, `ChatbotSettingsService`, `ChatbotInboundPayload` (from `../chatbot.service`).
- Produces:
  - `export type DerivedSubKind` and `export function deriveSubKind(kind: string, reason: string): DerivedSubKind`
  - `export interface SimResult { phoneE164; text; kind; subKind; reason; intent; intentConfidence; draftConfidence; modelUsed; embeddingModelUsed; chunksRetrieved; topChunkScore; totalLatencyMs; retrievalLatencyMs; customerReply; operatorDraft; citations }` (identical to today's shape)
  - `export function normalizeToE164(phoneInput: string): string`
  - `export async function ensureSimContact(prisma: PrismaService, settings: ChatbotSettingsService, phoneE164: string): Promise<void>`
  - `export function buildSimPayload(phoneE164: string, text: string, seq: number): ChatbotInboundPayload`
  - `export async function readBackSimResult(prisma: PrismaService, phoneE164: string, text: string): Promise<SimResult>`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/chatbot/sim/__tests__/sim-readback.spec.ts`:

```ts
import { deriveSubKind, normalizeToE164, buildSimPayload } from '../sim-readback';

describe('sim-readback pure helpers', () => {
  it('deriveSubKind maps opt-out to safety_escalate', () => {
    expect(deriveSubKind('ESCALATE', 'opt_out_requested')).toBe('safety_escalate');
    expect(deriveSubKind('AUTO_SEND', 'approved')).toBe('rag_answer');
    expect(deriveSubKind('IGNORE', 'opted_out')).toBe('ignore_opted_out');
  });

  it('normalizeToE164 strips non-digits and prefixes +', () => {
    expect(normalizeToE164('60 12-345 6789')).toBe('+60123456789');
  });

  it('buildSimPayload produces a text Meta payload with a unique wamid', () => {
    const p = buildSimPayload('+60123456789', 'hello', 7);
    expect(p.message.from).toBe('60123456789');
    expect(p.message.type).toBe('text');
    expect(p.message.text?.body).toBe('hello');
    expect(p.message.id).toMatch(/^wamid\.sim-\d+-7$/);
    expect(p.contacts[0].wa_id).toBe('60123456789');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- sim-readback`
Expected: FAIL — `Cannot find module '../sim-readback'`.

- [ ] **Step 3: Create `sim-readback.ts`**

Create `apps/api/src/chatbot/sim/sim-readback.ts`. Move `DerivedSubKind`, `deriveSubKind`, and `SimResult` **verbatim** out of `sim.command.ts`, and add the new helpers. The `readBackSimResult` body is the exact contents of today's `ChatbotSimulator.readBack`, parameterized on `prisma`:

```ts
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotSettingsService } from '../settings/chatbot-settings.service';
import type { ChatbotInboundPayload } from '../chatbot.service';

export type DerivedSubKind =
  | 'rag_answer'
  | 'consent_offer'
  | 'still_being_processed'
  | 'escalation_declined_ack'
  | 'consent_accepted_escalate'
  | 'safety_escalate'
  | 'ignore_disabled'
  | 'ignore_opted_out'
  | 'ignore_stale'
  | 'ignore_llm_unavailable'
  | 'ignore_embeddings_unavailable'
  | 'unknown';

export function deriveSubKind(kind: string, reason: string): DerivedSubKind {
  if (kind === 'IGNORE') {
    if (reason === 'opted_out') return 'ignore_opted_out';
    if (reason === 'stale_redelivery') return 'ignore_stale';
    if (reason === 'llm_unavailable') return 'ignore_llm_unavailable';
    if (reason === 'embeddings_unavailable') return 'ignore_embeddings_unavailable';
    return 'ignore_disabled';
  }
  if (kind === 'AUTO_SEND') {
    if (reason === 'approved') return 'rag_answer';
    if (reason.startsWith('escalation_offer_sent')) return 'consent_offer';
    if (reason.startsWith('pending_escalation_still_processing')) return 'still_being_processed';
    if (reason === 'escalation_declined') return 'escalation_declined_ack';
    return 'unknown';
  }
  if (reason === 'escalation_accepted') return 'consent_accepted_escalate';
  return 'safety_escalate';
}

export interface SimResult {
  phoneE164: string;
  text: string;
  kind: string;
  subKind: DerivedSubKind;
  reason: string;
  intent: string | null;
  intentConfidence: number | null;
  draftConfidence: number | null;
  modelUsed: string | null;
  embeddingModelUsed: string | null;
  chunksRetrieved: number;
  topChunkScore: number | null;
  totalLatencyMs: number;
  retrievalLatencyMs: number | null;
  customerReply: string | null;
  operatorDraft: string | null;
  citations: Array<{ documentTitle: string; category: string; similarityScore: number; rank: number }>;
}

export function normalizeToE164(phoneInput: string): string {
  return '+' + phoneInput.replace(/\D/g, '');
}

/** Make sure the engine will actually run: chatbot enabled, kill switch off, contact opted in.
 *  optInSource is set only on CREATE so pointing the sim at a real seeded dealer never overwrites theirs. */
export async function ensureSimContact(
  prisma: PrismaService,
  settings: ChatbotSettingsService,
  phoneE164: string,
): Promise<void> {
  await settings.patch('enabled', true);
  await settings.patch('disable_auto_reply', false);
  await settings.reload();
  const last4 = phoneE164.replace(/\D/g, '').slice(-4);
  await prisma.contact.upsert({
    where: { phoneE164 },
    update: { optInStatus: 'OPTED_IN' },
    create: { phoneE164, name: `Sim ${last4}`, optInStatus: 'OPTED_IN', optInSource: 'simulator' },
  });
}

export function buildSimPayload(phoneE164: string, text: string, seq: number): ChatbotInboundPayload {
  const digits = phoneE164.replace(/\D/g, '');
  return {
    contacts: [{ wa_id: digits, profile: { name: `Sim ${digits.slice(-4)}` } }],
    message: {
      from: digits,
      id: `wamid.sim-${Date.now()}-${seq}`,
      timestamp: String(Math.floor(Date.now() / 1000)),
      type: 'text',
      text: { body: text },
    },
  };
}

/** Reconstruct the decision view from the rows handleInbound just wrote for this contact. */
export async function readBackSimResult(
  prisma: PrismaService,
  phoneE164: string,
  text: string,
): Promise<SimResult> {
  const contact = await prisma.contact.findUniqueOrThrow({ where: { phoneE164 } });
  const conversation = await prisma.conversation.findFirst({
    where: { contactId: contact.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!conversation) {
    throw new Error(`No conversation found for ${phoneE164} after handleInbound`);
  }

  const decision = await prisma.chatbotDecision.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
  });
  if (!decision) {
    throw new Error(`No decision recorded for ${phoneE164} — was the inbound ignored before the engine ran?`);
  }

  const lastOutbound = await prisma.conversationOutboundMessage.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
  });
  const lastDraft = await prisma.botDraft.findFirst({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: 'desc' },
    include: { citations: { include: { chunk: { include: { document: true } } } } },
  });

  return {
    phoneE164,
    text,
    kind: decision.kind,
    subKind: deriveSubKind(decision.kind, decision.reason),
    reason: decision.reason,
    intent: decision.intent,
    intentConfidence: decision.intentConfidence,
    draftConfidence: decision.draftConfidence,
    modelUsed: decision.modelUsed,
    embeddingModelUsed: decision.embeddingModelUsed,
    chunksRetrieved: decision.chunksRetrieved,
    topChunkScore: decision.topChunkScore,
    totalLatencyMs: decision.totalLatencyMs,
    retrievalLatencyMs: decision.retrievalLatencyMs,
    customerReply: lastOutbound?.body ?? null,
    operatorDraft: lastDraft && lastDraft.state === 'PENDING' ? lastDraft.body : null,
    citations: (lastDraft?.citations ?? [])
      .map((c) => ({
        documentTitle: c.chunk.document.title,
        category: c.chunk.document.category,
        similarityScore: c.similarityScore,
        rank: c.rank,
      }))
      .sort((a, b) => a.rank - b.rank),
  };
}
```

- [ ] **Step 4: Rewire `sim.command.ts` to delegate**

In `apps/api/src/chatbot/sim/sim.command.ts`:
1. **Delete** the local `DerivedSubKind`, `deriveSubKind`, and `SimResult` definitions.
2. Add at the top (after existing imports):

```ts
import {
  SimResult,
  DerivedSubKind,
  deriveSubKind,
  normalizeToE164,
  ensureSimContact,
  buildSimPayload,
  readBackSimResult,
} from './sim-readback';

// Re-export so existing importers (scripts/chatbot-soak.ts) keep resolving these from sim.command.
export { SimResult, DerivedSubKind, deriveSubKind };
```

3. Replace the class methods `ensureReady`, `simulate`, and `readBack` with delegating versions (keep `printResult`, `runInteractive`, `runBatch` unchanged):

```ts
  async ensureReady(phoneE164: string): Promise<void> {
    await ensureSimContact(this.prisma, this.settings, phoneE164);
  }

  async simulate(phoneInput: string, text: string): Promise<SimResult> {
    const phoneE164 = normalizeToE164(phoneInput);
    await ensureSimContact(this.prisma, this.settings, phoneE164);
    await this.chatbot.handleInbound(buildSimPayload(phoneE164, text, this.wamidSeq++));
    return readBackSimResult(this.prisma, phoneE164, text);
  }

  private async readBack(phoneE164: string, text: string): Promise<SimResult> {
    return readBackSimResult(this.prisma, phoneE164, text);
  }
```

(If `readBack` is now unused after the edit, delete it rather than leave a dead private method.)

- [ ] **Step 5: Run tests to verify they pass**

Run: `pnpm --filter api test -- sim-readback`
Expected: PASS (3 tests).

- [ ] **Step 6: Verify the CLI/soak still typecheck (importers unbroken)**

Run: `pnpm --filter api build`
Expected: `nest build` succeeds with no TS errors (confirms `chatbot-soak.ts`'s `import { deriveSubKind } from '../src/chatbot/sim/sim.command'` and `grade-bm-eval.ts`'s `import { ChatbotSimulator } from '../src/chatbot/sim/sim.command'` still resolve).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/chatbot/sim/sim-readback.ts apps/api/src/chatbot/sim/__tests__/sim-readback.spec.ts apps/api/src/chatbot/sim/sim.command.ts
git commit -m "refactor(chatbot-sim): extract shared sim-readback helpers for reuse by HTTP simulator"
```

---

## Task 2: `SimulatorGuard` (off by default; mock-mode required)

**Files:**
- Create: `apps/api/src/simulator/simulator.guard.ts`
- Create: `apps/api/src/simulator/__tests__/simulator.guard.spec.ts`

**Interfaces:**
- Consumes: `ConfigService` (global).
- Produces: `export class SimulatorGuard implements CanActivate` — throws `NotFoundException` when `SIMULATOR_ENABLED !== 'true'`, throws `PreconditionFailedException` when `WHATSAPP_MOCK_MODE !== 'true'`, else returns `true`.

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/simulator/__tests__/simulator.guard.spec.ts`:

```ts
import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SimulatorGuard } from '../simulator.guard';

function guardWith(env: Record<string, string>): SimulatorGuard {
  const config = { get: (k: string, d?: string) => env[k] ?? d } as unknown as ConfigService;
  return new SimulatorGuard(config);
}
const ctx = {} as any; // guard ignores the execution context

describe('SimulatorGuard', () => {
  it('throws 404 when SIMULATOR_ENABLED is not "true"', () => {
    expect(() => guardWith({ WHATSAPP_MOCK_MODE: 'true' }).canActivate(ctx)).toThrow(NotFoundException);
  });

  it('throws 412 when enabled but WHATSAPP_MOCK_MODE is not "true"', () => {
    const g = guardWith({ SIMULATOR_ENABLED: 'true', WHATSAPP_MOCK_MODE: 'false' });
    expect(() => g.canActivate(ctx)).toThrow(PreconditionFailedException);
  });

  it('returns true when enabled and in mock mode', () => {
    const g = guardWith({ SIMULATOR_ENABLED: 'true', WHATSAPP_MOCK_MODE: 'true' });
    expect(g.canActivate(ctx)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- simulator.guard`
Expected: FAIL — `Cannot find module '../simulator.guard'`.

- [ ] **Step 3: Implement the guard**

Create `apps/api/src/simulator/simulator.guard.ts`:

```ts
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  PreconditionFailedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Gates every /api/sim/* route. Two independent server-side checks, evaluated at request time
 * (not boot) so flipping env can never silently arm a live send:
 *   - SIMULATOR_ENABLED !== 'true'  → 404 (route looks absent in production).
 *   - WHATSAPP_MOCK_MODE !== 'true' → 412 (the chatbot's send would otherwise hit real Meta).
 */
@Injectable()
export class SimulatorGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(_context: ExecutionContext): boolean {
    if (this.config.get<string>('SIMULATOR_ENABLED', 'false') !== 'true') {
      throw new NotFoundException('Simulator is disabled');
    }
    if (this.config.get<string>('WHATSAPP_MOCK_MODE', 'true') !== 'true') {
      throw new PreconditionFailedException('Simulator requires WHATSAPP_MOCK_MODE=true');
    }
    return true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter api test -- simulator.guard`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/simulator/simulator.guard.ts apps/api/src/simulator/__tests__/simulator.guard.spec.ts
git commit -m "feat(simulator): add SimulatorGuard (off by default, requires mock mode)"
```

---

## Task 3: `SimulatorService` — `simulateInbound`, `reset`, `status`

**Files:**
- Create: `apps/api/src/simulator/simulator.service.ts`
- Create: `apps/api/src/simulator/__tests__/simulator.service.spec.ts`

**Interfaces:**
- Consumes: `PrismaService`, `ChatbotService` (`handleInbound`), `ChatbotSettingsService` (`patch`/`reload`/`get`), `ConfigService`; helpers from `sim-readback`.
- Produces (used by Task 4 which extends this file, and Task 5's controller):
  - `simulateInbound(phone: string, text: string): Promise<SimResult>`
  - `reset(phone: string): Promise<{ deletedConversations: number }>`
  - `status(): Promise<SimStatus>` where `interface SimStatus { simulatorEnabled: boolean; whatsappMock: boolean; llmMock: boolean; embeddingsMock: boolean; chatbotEnabled: boolean }`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/simulator/__tests__/simulator.service.spec.ts`:

```ts
import { ConfigService } from '@nestjs/config';
import { SimulatorService } from '../simulator.service';

function makeService(over: { prisma?: any; chatbot?: any; settings?: any; env?: Record<string, string> } = {}) {
  const handleInbound = jest.fn().mockResolvedValue(undefined);
  const prisma = {
    contact: {
      upsert: jest.fn().mockResolvedValue({ id: 'c1' }),
      findUnique: jest.fn().mockResolvedValue({ id: 'c1' }),
      findUniqueOrThrow: jest.fn().mockResolvedValue({ id: 'c1' }),
    },
    conversation: {
      findFirst: jest.fn().mockResolvedValue({ id: 'conv1' }),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    chatbotDecision: {
      findFirst: jest.fn().mockResolvedValue({
        kind: 'ESCALATE', reason: 'opt_out_requested', intent: null, intentConfidence: null,
        draftConfidence: null, modelUsed: null, embeddingModelUsed: null, chunksRetrieved: 0,
        topChunkScore: null, totalLatencyMs: 1, retrievalLatencyMs: null,
      }),
    },
    conversationOutboundMessage: { findFirst: jest.fn().mockResolvedValue(null) },
    botDraft: { findFirst: jest.fn().mockResolvedValue(null) },
    ...over.prisma,
  };
  const settings = { patch: jest.fn().mockResolvedValue(undefined), reload: jest.fn().mockResolvedValue(undefined), get: jest.fn().mockResolvedValue(true), ...over.settings };
  const chatbot = { handleInbound, ...over.chatbot };
  const config = { get: (k: string, d?: string) => (over.env ?? {})[k] ?? d } as unknown as ConfigService;
  return { svc: new SimulatorService(prisma, chatbot, settings, config), handleInbound, prisma, settings };
}

describe('SimulatorService.simulateInbound', () => {
  it('ensures the sandbox contact, calls handleInbound once with a text payload, returns a SimResult', async () => {
    const { svc, handleInbound, prisma } = makeService();
    const res = await svc.simulateInbound('60123456789', 'stop');

    expect(prisma.contact.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phoneE164: '+60123456789' } }),
    );
    expect(handleInbound).toHaveBeenCalledTimes(1);
    const payload = handleInbound.mock.calls[0][0];
    expect(payload.message.text.body).toBe('stop');
    expect(payload.message.from).toBe('60123456789');
    expect(res.subKind).toBe('safety_escalate');
    expect(res.customerReply).toBeNull();
  });
});

describe('SimulatorService.reset', () => {
  it('deletes the contact conversations and reports the count', async () => {
    const { svc, prisma } = makeService();
    const out = await svc.reset('+60123456789');
    expect(prisma.conversation.deleteMany).toHaveBeenCalledWith({ where: { contactId: 'c1' } });
    expect(out).toEqual({ deletedConversations: 2 });
  });

  it('is a no-op when the contact does not exist', async () => {
    const { svc } = makeService({ prisma: { contact: { findUnique: jest.fn().mockResolvedValue(null), upsert: jest.fn(), findUniqueOrThrow: jest.fn() } } });
    expect(await svc.reset('+60111')).toEqual({ deletedConversations: 0 });
  });
});

describe('SimulatorService.status', () => {
  it('reports flags from config and the chatbot enabled setting', async () => {
    const { svc } = makeService({ env: { SIMULATOR_ENABLED: 'true', WHATSAPP_MOCK_MODE: 'true', LLM_MOCK_MODE: 'false', EMBEDDINGS_MOCK_MODE: 'true' } });
    const s = await svc.status();
    expect(s).toEqual({ simulatorEnabled: true, whatsappMock: true, llmMock: false, embeddingsMock: true, chatbotEnabled: true });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- simulator.service`
Expected: FAIL — `Cannot find module '../simulator.service'`.

- [ ] **Step 3: Implement the service (core methods only)**

Create `apps/api/src/simulator/simulator.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatbotService } from '../chatbot/chatbot.service';
import { ChatbotSettingsService } from '../chatbot/settings/chatbot-settings.service';
import {
  SimResult,
  normalizeToE164,
  ensureSimContact,
  buildSimPayload,
  readBackSimResult,
} from '../chatbot/sim/sim-readback';

export interface SimStatus {
  simulatorEnabled: boolean;
  whatsappMock: boolean;
  llmMock: boolean;
  embeddingsMock: boolean;
  chatbotEnabled: boolean;
}

/**
 * Dev-only QA harness. Drives the real ChatbotService.handleInbound synchronously in the API
 * process (no worker/queue) and reads the decision back into a SimResult. Always gated by
 * SimulatorGuard at the controller — never expose these methods on an unguarded route.
 */
@Injectable()
export class SimulatorService {
  private seq = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly chatbot: ChatbotService,
    private readonly settings: ChatbotSettingsService,
    private readonly config: ConfigService,
  ) {}

  async simulateInbound(phone: string, text: string): Promise<SimResult> {
    const phoneE164 = normalizeToE164(phone);
    await ensureSimContact(this.prisma, this.settings, phoneE164);
    await this.chatbot.handleInbound(buildSimPayload(phoneE164, text, this.seq++));
    return readBackSimResult(this.prisma, phoneE164, text);
  }

  async reset(phone: string): Promise<{ deletedConversations: number }> {
    const phoneE164 = normalizeToE164(phone);
    const contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (!contact) return { deletedConversations: 0 };
    // Conversation children (inbound/outbound/botDraft/decision/capture) cascade on FK delete.
    const res = await this.prisma.conversation.deleteMany({ where: { contactId: contact.id } });
    return { deletedConversations: res.count };
  }

  async status(): Promise<SimStatus> {
    return {
      simulatorEnabled: this.config.get<string>('SIMULATOR_ENABLED', 'false') === 'true',
      whatsappMock: this.config.get<string>('WHATSAPP_MOCK_MODE', 'true') === 'true',
      llmMock: this.config.get<string>('LLM_MOCK_MODE', 'true') === 'true',
      embeddingsMock: this.config.get<string>('EMBEDDINGS_MOCK_MODE', 'true') === 'true',
      chatbotEnabled: await this.settings.get<boolean>('enabled', false),
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api test -- simulator.service`
Expected: PASS (4 tests). (Task 4 adds `getThread` tests to this same file.)

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/simulator/simulator.service.ts apps/api/src/simulator/__tests__/simulator.service.spec.ts
git commit -m "feat(simulator): SimulatorService simulateInbound/reset/status"
```

---

## Task 4: `SimulatorService.getThread` — timeline + blast render-on-read

**Files:**
- Modify: `apps/api/src/simulator/simulator.service.ts`
- Modify: `apps/api/src/simulator/__tests__/simulator.service.spec.ts`

**Interfaces:**
- Consumes: `renderTemplate`, `VariableMapping` from `../blasts/variable-renderer`; the same Prisma client.
- Produces:
  - `interface ThreadItem { id: string; at: string; direction: 'incoming' | 'outgoing'; kind: 'chat_inbound' | 'bot_reply' | 'operator_reply' | 'blast'; body: string; meta?: { subKind?: string; status?: string; templateName?: string; language?: string } }`
  - `interface ThreadResponse { phone: string; contactId: string | null; items: ThreadItem[] }`
  - `getThread(phone: string): Promise<ThreadResponse>`

- [ ] **Step 1: Write the failing test**

Append to `apps/api/src/simulator/__tests__/simulator.service.spec.ts`:

```ts
describe('SimulatorService.getThread', () => {
  it('merges chat in/out + a rendered blast, ordered by time, with phone-POV direction', async () => {
    const prisma = {
      contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', name: 'Sim 6789', phoneE164: '+60123456789' }) },
      conversation: { findMany: jest.fn().mockResolvedValue([{ id: 'conv1' }]) },
      conversationInboundMessage: {
        findMany: jest.fn().mockResolvedValue([{ id: 'in1', body: 'hello', receivedAt: new Date('2026-06-21T10:00:02Z') }]),
      },
      conversationOutboundMessage: {
        findMany: jest.fn().mockResolvedValue([{ id: 'out1', body: 'hi there', kind: 'AUTO_REPLY', sentAt: new Date('2026-06-21T10:00:03Z'), createdAt: new Date('2026-06-21T10:00:03Z') }]),
      },
      message: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'm1', source: 'BLAST', status: 'SENT', templateId: 't1', blastId: 'b1', body: null, sentAt: new Date('2026-06-21T10:00:01Z') },
        ]),
      },
      template: { findMany: jest.fn().mockResolvedValue([{ id: 't1', name: 'promo', language: 'EN', bodyText: 'Hi {{1}}!' }]) },
      blast: { findMany: jest.fn().mockResolvedValue([{ id: 'b1', variableMapping: { '1': 'contact.name' }, scheduledAt: new Date('2026-06-21T09:59:00Z') }]) },
    };
    const settings = { patch: jest.fn(), reload: jest.fn(), get: jest.fn() };
    const config = { get: (_k: string, d?: string) => d } as any;
    const { SimulatorService } = require('../simulator.service');
    const svc = new SimulatorService(prisma, { handleInbound: jest.fn() }, settings, config);

    const out = await svc.getThread('60123456789');

    expect(out.contactId).toBe('c1');
    expect(out.items.map((i: any) => i.id)).toEqual(['m1', 'in1', 'out1']); // time order
    const blast = out.items.find((i: any) => i.id === 'm1');
    expect(blast.direction).toBe('incoming');
    expect(blast.kind).toBe('blast');
    expect(blast.body).toBe('Hi Sim 6789!'); // rendered from template + mapping + contact
    expect(blast.meta).toEqual({ status: 'SENT', templateName: 'promo', language: 'EN' });
    expect(out.items.find((i: any) => i.id === 'in1').direction).toBe('outgoing'); // phone -> business
    expect(out.items.find((i: any) => i.id === 'out1').kind).toBe('bot_reply');
  });

  it('returns empty items when the contact does not exist', async () => {
    const prisma = { contact: { findUnique: jest.fn().mockResolvedValue(null) } };
    const { SimulatorService } = require('../simulator.service');
    const svc = new SimulatorService(prisma, { handleInbound: jest.fn() }, { patch: jest.fn(), reload: jest.fn(), get: jest.fn() }, { get: (_k: string, d?: string) => d } as any);
    expect(await svc.getThread('+60111')).toEqual({ phone: '+60111', contactId: null, items: [] });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- simulator.service`
Expected: FAIL — `svc.getThread is not a function`.

- [ ] **Step 3: Implement `getThread`**

In `apps/api/src/simulator/simulator.service.ts`, add the imports and types, then the method:

```ts
// add to imports
import { renderTemplate, VariableMapping } from '../blasts/variable-renderer';

// add near SimStatus
export interface ThreadItem {
  id: string;
  at: string;
  direction: 'incoming' | 'outgoing';
  kind: 'chat_inbound' | 'bot_reply' | 'operator_reply' | 'blast';
  body: string;
  meta?: { subKind?: string; status?: string; templateName?: string; language?: string };
}
export interface ThreadResponse {
  phone: string;
  contactId: string | null;
  items: ThreadItem[];
}
```

Add the method to the class:

```ts
  /** Unified phone timeline. direction is from the PHONE's POV:
   *  outgoing = phone→business (what QA typed); incoming = business→phone (bot/operator/blast). */
  async getThread(phone: string): Promise<ThreadResponse> {
    const phoneE164 = normalizeToE164(phone);
    const contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (!contact) return { phone: phoneE164, contactId: null, items: [] };

    const conversations = await this.prisma.conversation.findMany({
      where: { contactId: contact.id },
      select: { id: true },
    });
    const convIds = conversations.map((c) => c.id);

    const [inbound, outbound, messages] = await Promise.all([
      convIds.length
        ? this.prisma.conversationInboundMessage.findMany({ where: { conversationId: { in: convIds } } })
        : Promise.resolve([]),
      convIds.length
        ? this.prisma.conversationOutboundMessage.findMany({ where: { conversationId: { in: convIds } } })
        : Promise.resolve([]),
      this.prisma.message.findMany({ where: { contactId: contact.id } }),
    ]);

    const items: ThreadItem[] = [];

    for (const m of inbound) {
      items.push({ id: m.id, at: m.receivedAt.toISOString(), direction: 'outgoing', kind: 'chat_inbound', body: m.body });
    }
    for (const m of outbound) {
      items.push({
        id: m.id,
        at: (m.sentAt ?? m.createdAt).toISOString(),
        direction: 'incoming',
        kind: m.kind === 'OPERATOR_REPLY' ? 'operator_reply' : 'bot_reply',
        body: m.body,
      });
    }

    // Blast/inbox Message rows. Message has no createdAt; blast bodies are not persisted, so render
    // them on read from the language-specific Template (Message.templateId) + Blast.variableMapping.
    const templateIds = [...new Set(messages.map((m) => m.templateId).filter((x): x is string => !!x))];
    const blastIds = [...new Set(messages.map((m) => m.blastId).filter((x): x is string => !!x))];
    const [templates, blasts] = await Promise.all([
      templateIds.length ? this.prisma.template.findMany({ where: { id: { in: templateIds } } }) : Promise.resolve([]),
      blastIds.length ? this.prisma.blast.findMany({ where: { id: { in: blastIds } } }) : Promise.resolve([]),
    ]);
    const tplById = new Map(templates.map((t) => [t.id, t]));
    const blastById = new Map(blasts.map((b) => [b.id, b]));

    for (const m of messages) {
      if (m.source === 'INBOX') {
        items.push({
          id: m.id,
          at: (m.sentAt ?? new Date(0)).toISOString(),
          direction: 'incoming',
          kind: 'operator_reply',
          body: m.body ?? '',
          meta: { status: m.status },
        });
        continue;
      }
      // BLAST
      const tpl = m.templateId ? tplById.get(m.templateId) : undefined;
      const blast = m.blastId ? blastById.get(m.blastId) : undefined;
      const at = m.sentAt ?? blast?.scheduledAt ?? new Date(0);
      let body = m.body ?? '[blast template unavailable]';
      const meta: ThreadItem['meta'] = { status: m.status };
      if (tpl && blast) {
        body = renderTemplate(tpl.bodyText, blast.variableMapping as VariableMapping, contact as any);
        meta.templateName = tpl.name;
        meta.language = tpl.language;
      }
      items.push({ id: m.id, at: at.toISOString(), direction: 'incoming', kind: 'blast', body, meta });
    }

    items.sort((a, b) => a.at.localeCompare(b.at));
    return { phone: phoneE164, contactId: contact.id, items };
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter api test -- simulator.service`
Expected: PASS (6 tests total in the file).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/simulator/simulator.service.ts apps/api/src/simulator/__tests__/simulator.service.spec.ts
git commit -m "feat(simulator): getThread timeline with blast render-on-read"
```

---

## Task 5: Controller + DTO + module + app wiring

**Files:**
- Create: `apps/api/src/simulator/dto/simulate-inbound.dto.ts`
- Create: `apps/api/src/simulator/simulator.controller.ts`
- Create: `apps/api/src/simulator/__tests__/simulator.controller.spec.ts`
- Create: `apps/api/src/simulator/simulator.module.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/.env.example`

**Interfaces:**
- Consumes: `SimulatorService` (Tasks 3-4), `SimulatorGuard` (Task 2), `JwtAuthGuard`, `RolesGuard`, `Roles` (existing auth).
- Produces: routes `POST /api/sim/inbound`, `GET /api/sim/thread/:phone`, `POST /api/sim/reset/:phone`, `GET /api/sim/status`; `SimulatorModule`.

- [ ] **Step 1: Write the failing controller test**

Create `apps/api/src/simulator/__tests__/simulator.controller.spec.ts`:

```ts
import { SimulatorController } from '../simulator.controller';

describe('SimulatorController', () => {
  const sim = {
    simulateInbound: jest.fn().mockResolvedValue({ subKind: 'rag_answer' }),
    getThread: jest.fn().mockResolvedValue({ phone: '+60123456789', contactId: 'c1', items: [] }),
    reset: jest.fn().mockResolvedValue({ deletedConversations: 1 }),
    status: jest.fn().mockResolvedValue({ simulatorEnabled: true }),
  } as any;
  const ctrl = new SimulatorController(sim);

  it('inbound delegates to simulateInbound(phone, text)', async () => {
    await ctrl.inbound({ phone: '60123456789', text: 'hi' });
    expect(sim.simulateInbound).toHaveBeenCalledWith('60123456789', 'hi');
  });
  it('thread delegates to getThread(phone)', async () => {
    await ctrl.thread('60123456789');
    expect(sim.getThread).toHaveBeenCalledWith('60123456789');
  });
  it('reset delegates to reset(phone)', async () => {
    await ctrl.reset('60123456789');
    expect(sim.reset).toHaveBeenCalledWith('60123456789');
  });
  it('status delegates to status()', async () => {
    await ctrl.status();
    expect(sim.status).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter api test -- simulator.controller`
Expected: FAIL — `Cannot find module '../simulator.controller'`.

- [ ] **Step 3: Create the DTO**

Create `apps/api/src/simulator/dto/simulate-inbound.dto.ts`:

```ts
import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SimulateInboundDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4096)
  text!: string;
}
```

- [ ] **Step 4: Create the controller**

Create `apps/api/src/simulator/simulator.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { SimulatorGuard } from './simulator.guard';
import { SimulatorService } from './simulator.service';
import { SimulateInboundDto } from './dto/simulate-inbound.dto';

@ApiTags('simulator')
@ApiBearerAuth()
@Controller('sim')
@UseGuards(JwtAuthGuard, RolesGuard, SimulatorGuard)
@Roles('ADMIN')
export class SimulatorController {
  constructor(private readonly sim: SimulatorService) {}

  @Post('inbound')
  @ApiOperation({ summary: 'Inject an inbound message and run the chatbot synchronously.' })
  inbound(@Body() dto: SimulateInboundDto) {
    return this.sim.simulateInbound(dto.phone, dto.text);
  }

  @Get('thread/:phone')
  @ApiOperation({ summary: 'Unified phone timeline (chat + blasts), chronological.' })
  thread(@Param('phone') phone: string) {
    return this.sim.getThread(phone);
  }

  @Post('reset/:phone')
  @ApiOperation({ summary: 'Delete the simulated conversation for this number.' })
  reset(@Param('phone') phone: string) {
    return this.sim.reset(phone);
  }

  @Get('status')
  @ApiOperation({ summary: 'Report simulator + mock-mode flags.' })
  status() {
    return this.sim.status();
  }
}
```

- [ ] **Step 5: Create the module**

Create `apps/api/src/simulator/simulator.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { ChatbotSettingsModule } from '../chatbot/settings/chatbot-settings.module';
import { SimulatorController } from './simulator.controller';
import { SimulatorService } from './simulator.service';
import { SimulatorGuard } from './simulator.guard';

/**
 * Dev-only QA simulator. Always registered, but every route is gated at request time by
 * SimulatorGuard (SIMULATOR_ENABLED + WHATSAPP_MOCK_MODE), so it is inert in production.
 * Imports ChatbotModule (exports ChatbotService) and ChatbotSettingsModule (ChatbotSettingsService);
 * PrismaService is @Global and ConfigService comes from the global ConfigModule.
 */
@Module({
  imports: [ChatbotModule, ChatbotSettingsModule],
  controllers: [SimulatorController],
  providers: [SimulatorService, SimulatorGuard],
})
export class SimulatorModule {}
```

> **Verify at implementation time:** `ChatbotSettingsModule` (`apps/api/src/chatbot/settings/chatbot-settings.module.ts`) must `exports: [ChatbotSettingsService]`. It does today (the chatbot settings controller injects it). If a future change removes that export, DI will fail at boot — the boot check in Step 7 catches it.

- [ ] **Step 6: Wire into `app.module.ts`**

In `apps/api/src/app.module.ts`, add the import and register the module (always — gating is runtime, which avoids the dotenv-timing trap of a conditional `imports` entry):

```ts
import { SimulatorModule } from './simulator/simulator.module';
```

Add `SimulatorModule,` to the `imports` array (after `AssistantModule,`).

- [ ] **Step 7: Run controller test + boot check**

Run: `pnpm --filter api test -- simulator.controller`
Expected: PASS (4 tests).

Run: `pnpm --filter api build`
Expected: `nest build` succeeds — confirms the module graph compiles (DI for `SimulatorService` resolves `ChatbotService` + `ChatbotSettingsService`).

- [ ] **Step 8: Document the env flag**

In `apps/api/.env.example`, add:

```
# QA simulator (dev only). Off by default. Requires WHATSAPP_MOCK_MODE=true to operate.
SIMULATOR_ENABLED=false
```

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/simulator/simulator.controller.ts apps/api/src/simulator/dto/simulate-inbound.dto.ts apps/api/src/simulator/simulator.module.ts apps/api/src/simulator/__tests__/simulator.controller.spec.ts apps/api/src/app.module.ts apps/api/.env.example
git commit -m "feat(simulator): controller, module, app wiring, env flag"
```

---

## Task 6: Web API client (`api/simulator.ts`)

**Files:**
- Create: `apps/web/src/api/simulator.ts`

**Interfaces:**
- Consumes: `api` axios instance from `./client`.
- Produces: `SimResult`, `ThreadItem`, `ThreadResponse`, `SimStatus` types; `simulateInbound`, `getSimThread`, `resetSim`, `getSimStatus` functions.

- [ ] **Step 1: Create the client module**

Create `apps/web/src/api/simulator.ts` (mirror the existing `api/inbox.ts` style — plain async functions returning typed data; types match the API responses from Tasks 3-4):

```ts
import { api } from './client';

export interface SimCitation {
  documentTitle: string;
  category: string;
  similarityScore: number;
  rank: number;
}

export interface SimResult {
  phoneE164: string;
  text: string;
  kind: string;
  subKind: string;
  reason: string;
  intent: string | null;
  intentConfidence: number | null;
  draftConfidence: number | null;
  modelUsed: string | null;
  embeddingModelUsed: string | null;
  chunksRetrieved: number;
  topChunkScore: number | null;
  totalLatencyMs: number;
  retrievalLatencyMs: number | null;
  customerReply: string | null;
  operatorDraft: string | null;
  citations: SimCitation[];
}

export interface ThreadItem {
  id: string;
  at: string;
  direction: 'incoming' | 'outgoing';
  kind: 'chat_inbound' | 'bot_reply' | 'operator_reply' | 'blast';
  body: string;
  meta?: { subKind?: string; status?: string; templateName?: string; language?: string };
}

export interface ThreadResponse {
  phone: string;
  contactId: string | null;
  items: ThreadItem[];
}

export interface SimStatus {
  simulatorEnabled: boolean;
  whatsappMock: boolean;
  llmMock: boolean;
  embeddingsMock: boolean;
  chatbotEnabled: boolean;
}

export async function simulateInbound(phone: string, text: string): Promise<SimResult> {
  const { data } = await api.post<SimResult>('/sim/inbound', { phone, text });
  return data;
}

export async function getSimThread(phone: string): Promise<ThreadResponse> {
  const { data } = await api.get<ThreadResponse>(`/sim/thread/${encodeURIComponent(phone)}`);
  return data;
}

export async function resetSim(phone: string): Promise<{ deletedConversations: number }> {
  const { data } = await api.post<{ deletedConversations: number }>(`/sim/reset/${encodeURIComponent(phone)}`);
  return data;
}

export async function getSimStatus(): Promise<SimStatus> {
  const { data } = await api.get<SimStatus>('/sim/status');
  return data;
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web build`
Expected: build succeeds (no TS errors). (`Simulator.tsx` doesn't exist yet; this only typechecks the new client file against the rest.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/simulator.ts
git commit -m "feat(web): simulator API client"
```

---

## Task 7: Web `Simulator` page + route + gated nav

**Files:**
- Create: `apps/web/src/pages/Simulator.tsx`
- Modify: `apps/web/src/App.tsx`
- Modify: `apps/web/src/lib/roles.ts`
- Modify: `apps/web/.env.example`

**Interfaces:**
- Consumes: `simulateInbound`, `getSimThread`, `resetSim`, `getSimStatus`, `ThreadItem` from `../api/simulator`; React Query.
- Produces: the `/simulator` route; nav item (gated by `VITE_SIMULATOR_ENABLED`).

- [ ] **Step 1: Create the page**

Create `apps/web/src/pages/Simulator.tsx` (uses React Query polling like the inbox screens; data-testids are used by the e2e in Task 9):

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { simulateInbound, getSimThread, resetSim, getSimStatus } from '../api/simulator';

export default function Simulator() {
  const qc = useQueryClient();
  const [phone, setPhone] = useState('60123456789');
  const [draft, setDraft] = useState('');

  const status = useQuery({ queryKey: ['sim-status'], queryFn: getSimStatus });
  const thread = useQuery({
    queryKey: ['sim-thread', phone],
    queryFn: () => getSimThread(phone),
    refetchInterval: 2000,
  });

  const send = useMutation({
    mutationFn: (text: string) => simulateInbound(phone, text),
    onSuccess: () => {
      setDraft('');
      qc.invalidateQueries({ queryKey: ['sim-thread', phone] });
    },
  });

  const reset = useMutation({
    mutationFn: () => resetSim(phone),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sim-thread', phone] }),
  });

  const s = status.data;
  const modeBanner = s
    ? s.llmMock
      ? 'Mock LLM — replies are canned & deterministic'
      : 'Ollama — real RAG answers'
    : '…';

  return (
    <div className="sim-phone" data-testid="simulator-page">
      <header className="sim-phone-head">
        <input
          data-testid="sim-phone-input"
          value={phone}
          onChange={(e) => setPhone(e.target.value.trim())}
          aria-label="Phone number"
        />
        <span className="sim-mode" data-testid="sim-mode">{modeBanner}</span>
        <button data-testid="sim-reset" onClick={() => reset.mutate()} disabled={reset.isPending}>
          Reset
        </button>
      </header>

      <div className="sim-thread" data-testid="sim-thread">
        {(thread.data?.items ?? []).map((m) => (
          <div
            key={m.id}
            className={`sim-bubble sim-${m.direction}`}
            data-testid="sim-bubble"
            data-kind={m.kind}
            data-direction={m.direction}
          >
            <div className="sim-bubble-body">{m.body || <em>(no reply — escalated)</em>}</div>
            <div className="sim-bubble-meta">
              {m.kind === 'blast' && m.meta?.templateName ? `blast · ${m.meta.templateName} · ${m.meta.status}` : null}
              {m.kind === 'bot_reply' ? 'bot' : null}
              {m.kind === 'operator_reply' ? 'operator' : null}
            </div>
          </div>
        ))}
      </div>

      <form
        className="sim-composer"
        onSubmit={(e) => {
          e.preventDefault();
          if (draft.trim()) send.mutate(draft.trim());
        }}
      >
        <input
          data-testid="sim-message-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message as the customer…"
          aria-label="Message"
        />
        <button data-testid="sim-send" type="submit" disabled={send.isPending || !draft.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Add the route**

In `apps/web/src/App.tsx`:
1. Add the import after the other page imports (e.g. after `import Performance from './pages/Performance';`):

```tsx
import Simulator from './pages/Simulator';
```

2. Add the route alongside the other `ProtectedRoute requireRole="ADMIN"` routes (e.g. after the `/reports` route):

```tsx
      <Route path="/simulator" element={<ProtectedRoute requireRole="ADMIN"><Layout><Simulator /></Layout></ProtectedRoute>} />
```

- [ ] **Step 3: Add the gated nav item**

In `apps/web/src/lib/roles.ts`, append a simulator entry to the `NAV` array (reuse the existing `IcMessage` icon string so no icon-map change is needed). Gate it on the build-time env flag so it only shows when the simulator is on:

```ts
export const NAV: NavItem[] = [
  { label: 'Dashboard',   path: '/',          icon: 'IcBar' },
  { label: 'Campaigns',   path: '/blasts',    icon: 'IcSend' },
  { label: 'Inbox',       path: '/inbox',     icon: 'IcMessage', badge: 'escalations' },
  { label: 'Dealers',     path: '/contacts',  icon: 'IcUsers' },
  { label: 'Templates',   path: '/templates', icon: 'IcFile', badge: 'inReview' },
  { label: 'Performance', path: '/reports',   icon: 'IcActivity' },
  { label: 'Knowledge',   path: '/knowledge', icon: 'IcBook', adminOnly: true },
  { label: 'Settings',    path: '/settings',  icon: 'IcSettings', adminOnly: true },
  ...(import.meta.env.VITE_SIMULATOR_ENABLED === 'true'
    ? [{ label: 'Simulator', path: '/simulator', icon: 'IcMessage', adminOnly: true } as NavItem]
    : []),
];
```

> Note: the route itself is always registered (Step 2) and reachable by URL for ADMINs; the env flag only controls whether the nav *link* is shown. The API guard is the real protection.

- [ ] **Step 4: Document the web env flag**

In `apps/web/.env.example`, add:

```
# Show the QA Simulator nav link (the page is always reachable by URL for admins). Dev only.
VITE_SIMULATOR_ENABLED=false
```

- [ ] **Step 5: Typecheck the web app**

Run: `pnpm --filter web build`
Expected: build succeeds with no TS errors.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/Simulator.tsx apps/web/src/App.tsx apps/web/src/lib/roles.ts apps/web/.env.example
git commit -m "feat(web): /simulator phone UI, route, gated nav link"
```

---

## Task 8: HTTP scenario runner

**Files:**
- Create: `apps/api/scripts/sim-scenarios.ts`
- Create: `apps/api/scripts/sim-scenarios.json`
- Modify: `apps/api/package.json`

**Interfaces:**
- Consumes: a running API (`SIM_API_URL`, default `http://localhost:3000/api`), `POST /api/auth/login`, `POST /api/sim/inbound`, `POST /api/sim/reset/:phone`.
- Produces: `chatbot:scenarios` script; exits non-zero on any failed assertion.

This runner does **deterministic flow assertions** (`subKind`/`reason`) through the real HTTP endpoint, in mock-LLM mode. Factual answer-content grading stays the job of the existing in-process `scripts/grade-bm-eval.ts` (real Ollama) — the two are complementary; do not duplicate the LLM-judge here.

- [ ] **Step 1: Create the scenario corpus**

Create `apps/api/scripts/sim-scenarios.json` (field names mirror the soak corpus; `phone` is per-scenario so the runner can reset each in isolation):

```json
{
  "_readme": "HTTP flow-assertion corpus for sim-scenarios.ts. Asserted only in mock LLM mode (deterministic). Each scenario runs its turns in order on a fresh conversation (reset first); the LAST turn is characterized.",
  "scenarios": [
    { "id": "optout-01", "phone": "60190000001", "turns": ["stop"], "expectSubKind": "safety_escalate", "expectReason": "opt_out_requested" },
    { "id": "complaint-01", "phone": "60190000002", "turns": ["this is terrible service"], "expectSubKind": "safety_escalate", "expectReason": "complaint" },
    { "id": "consent-accept-01", "phone": "60190000003", "turns": ["how much does installation cost?", "yes please"], "expectSubKind": "consent_accepted_escalate" },
    { "id": "consent-decline-01", "phone": "60190000004", "turns": ["how much does a consultation cost?", "no thanks"], "expectSubKind": "escalation_declined_ack" }
  ]
}
```

- [ ] **Step 2: Create the runner**

Create `apps/api/scripts/sim-scenarios.ts`:

```ts
/**
 * HTTP scenario runner for the QA simulator. Logs in as admin, then POSTs each scenario's turns to
 * /api/sim/inbound (resetting each phone first) and asserts the returned decision subKind/reason.
 * Deterministic only in mock-LLM mode. Requires a running API with SIMULATOR_ENABLED=true and
 * WHATSAPP_MOCK_MODE=true.
 *
 *   pnpm --filter api chatbot:scenarios
 *   SIM_API_URL=http://host:3000/api SIM_ADMIN_EMAIL=... SIM_ADMIN_PASSWORD=... pnpm --filter api chatbot:scenarios
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

interface Scenario {
  id: string;
  phone: string;
  turns: string[];
  expectSubKind?: string;
  expectReason?: string;
}

const API = process.env.SIM_API_URL ?? 'http://localhost:3000/api';
const EMAIL = process.env.SIM_ADMIN_EMAIL ?? 'admin@example.com';
const PASSWORD = process.env.SIM_ADMIN_PASSWORD ?? 'ChangeMe123!';

async function login(): Promise<string> {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) throw new Error(`login failed: ${res.status} ${await res.text()}`);
  const body = (await res.json()) as { accessToken: string };
  return body.accessToken;
}

async function main(): Promise<void> {
  const raw = JSON.parse(readFileSync(join(__dirname, 'sim-scenarios.json'), 'utf-8')) as { scenarios: Scenario[] };
  const token = await login();
  const auth = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

  const failures: string[] = [];
  for (const s of raw.scenarios) {
    await fetch(`${API}/sim/reset/${encodeURIComponent(s.phone)}`, { method: 'POST', headers: auth });
    let last: { subKind: string; reason: string } | null = null;
    for (const text of s.turns) {
      const res = await fetch(`${API}/sim/inbound`, { method: 'POST', headers: auth, body: JSON.stringify({ phone: s.phone, text }) });
      if (!res.ok) { failures.push(`${s.id}: inbound failed ${res.status} ${await res.text()}`); last = null; break; }
      last = (await res.json()) as { subKind: string; reason: string };
    }
    if (!last) continue;
    if (s.expectSubKind && last.subKind !== s.expectSubKind) {
      failures.push(`${s.id}: expected subKind ${s.expectSubKind}, got ${last.subKind} (reason ${last.reason})`);
    } else if (s.expectReason && last.reason !== s.expectReason) {
      failures.push(`${s.id}: expected reason ${s.expectReason}, got ${last.reason}`);
    }
    console.log(`[${failures.some((f) => f.startsWith(s.id)) ? 'FAIL' : 'PASS'}] ${s.id.padEnd(22)} ${last.subKind}`);
  }

  console.log(`\n${failures.length === 0 ? '✅ SCENARIOS PASSED' : `❌ ${failures.length} FAILURE(S)`}`);
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(failures.length === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
```

- [ ] **Step 3: Add the package script**

In `apps/api/package.json`, add to `scripts` (after the `chatbot:soak` line):

```json
    "chatbot:scenarios": "ts-node scripts/sim-scenarios.ts",
```

- [ ] **Step 4: Manual run to verify (needs a running API)**

Preconditions (one-time, in one terminal): start Docker (`docker compose up -d`), then start the API with the simulator on and deterministic mock LLM:

```bash
SIMULATOR_ENABLED=true WHATSAPP_MOCK_MODE=true LLM_MOCK_MODE=true EMBEDDINGS_MOCK_MODE=true pnpm --filter api dev
```

In a second terminal:

```bash
pnpm --filter api chatbot:scenarios
```

Expected: `✅ SCENARIOS PASSED`, exit 0, with a PASS line per scenario (e.g. `[PASS] optout-01  safety_escalate`).

- [ ] **Step 5: Commit**

```bash
git add apps/api/scripts/sim-scenarios.ts apps/api/scripts/sim-scenarios.json apps/api/package.json
git commit -m "feat(simulator): HTTP scenario runner (chatbot:scenarios) + corpus"
```

---

## Task 9: E2E smoke

**Files:**
- Create: `e2e/tests/simulator.spec.ts`

**Interfaces:**
- Consumes: a running web+API (`E2E_BASE_URL`, default `http://localhost:5173`) with the API started under `SIMULATOR_ENABLED=true WHATSAPP_MOCK_MODE=true`; seeded admin.
- Produces: a Playwright smoke for `/simulator`.

- [ ] **Step 1: Write the smoke test**

Create `e2e/tests/simulator.spec.ts` (mirrors the existing login flow from `e2e/tests/login.spec.ts`; navigates by URL since the nav link is env-gated):

```ts
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

test.describe('Simulator smoke', () => {
  test('admin can send a message and see it in the thread', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('email').fill(ADMIN_EMAIL);
    await page.getByTestId('password').fill(ADMIN_PASSWORD);
    await page.getByTestId('submit').click();
    await expect(page).toHaveURL(/\/$/);

    await page.goto('/simulator');
    await expect(page.getByTestId('simulator-page')).toBeVisible();

    await page.getByTestId('sim-message-input').fill('stop');
    await page.getByTestId('sim-send').click();

    // The inbound (phone -> business) bubble should render our text.
    const outgoing = page.locator('[data-testid="sim-bubble"][data-direction="outgoing"]').filter({ hasText: 'stop' });
    await expect(outgoing.first()).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the smoke (needs web + API up with simulator enabled)**

Preconditions: Docker up; API running with `SIMULATOR_ENABLED=true WHATSAPP_MOCK_MODE=true LLM_MOCK_MODE=true EMBEDDINGS_MOCK_MODE=true pnpm --filter api dev`; web running with `pnpm --filter web dev`; browsers installed (`pnpm --filter e2e install-browsers` once).

Run: `pnpm --filter e2e test -- simulator`
Expected: PASS (1 test). The "stop" bubble appears in the thread; mock-LLM classifies it as opt-out (no bot reply bubble, which is expected).

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/simulator.spec.ts
git commit -m "test(e2e): simulator smoke — send message, see it in thread"
```

---

## Self-Review

**1. Spec coverage** (each spec section → task):
- Safety gating (SIMULATOR_ENABLED + WHATSAPP_MOCK_MODE + ADMIN) → Task 2 (guard) + Task 5 (guard applied with `JwtAuthGuard`/`RolesGuard`/`@Roles('ADMIN')`). ✔
- `POST /api/sim/inbound` synchronous, returns `SimResult` → Tasks 1 (helpers) + 3 (service) + 5 (route). ✔
- `GET /api/sim/thread/:phone` unified timeline + blast render-on-read → Task 4. ✔
- `POST /api/sim/reset/:phone` → Task 3. ✔
- `GET /api/sim/status` (mode banner) → Task 3 + Task 7 (banner). ✔
- Sandbox contact on the fly, tagged `optInSource='simulator'`, opt-in preserved for existing dealers → Task 1 (`ensureSimContact`). ✔
- Blast receive **+ reply** round-trip → Task 4 surfaces blasts; replying goes through `simulateInbound` (Task 3) which runs the real `handleInbound` (attribution included). ✔
- Shared read-back helper (no CLI/HTTP drift) → Task 1. ✔
- Web page + route + gated nav → Tasks 6-7. ✔
- HTTP scenario runner (mock-mode flow assertions; defers content grading to existing grader) → Task 8. ✔
- Playwright smoke → Task 9. ✔
- Env docs (`SIMULATOR_ENABLED`, `VITE_SIMULATOR_ENABLED`) → Tasks 5 + 7. ✔
- **Deviation from spec, intentional:** spec said "conditionally import `SimulatorModule` when `SIMULATOR_ENABLED`"; the plan **always imports** and gates at request time in `SimulatorGuard`. Reason: the `imports` array is evaluated at module-decoration time, before `ConfigModule` loads `.env`, so a `process.env`-based conditional import would misread a `.env`-only flag. Runtime gating gives identical "off by default / absent in prod (404)" behavior without the timing trap. Net safety is unchanged.
- **Out of scope (per spec, confirmed not built):** full webhook→queue→worker path; real Meta sends; media; persisting rendered blast bodies. ✔

**2. Placeholder scan:** No TBD/TODO; every code/test step has complete content; no "similar to Task N". ✔

**3. Type consistency:** `SimResult` defined in Task 1, re-exported via `sim.command.ts`, re-declared structurally in the web client (Task 6) — fields match. `ThreadItem`/`ThreadResponse`/`SimStatus` defined in Task 4/3 (API) and mirrored in Task 6 (web) with identical shapes. `simulateInbound(phone, text)`, `getThread(phone)`, `reset(phone)`, `status()` names are consistent across service (Tasks 3-4), controller (Task 5), and web client (Task 6, as `getSimThread`/`resetSim`/`getSimStatus` wrapping the same routes). Guard throws `NotFoundException`/`PreconditionFailedException` consistently (Task 2). ✔

## Execution

Implement task-by-task with TDD. After each task: run the task's tests/build, confirm green, commit. Tasks 1-5 are pure API (Jest, no running server). Tasks 8-9 need a running API/web with `SIMULATOR_ENABLED=true WHATSAPP_MOCK_MODE=true`.
