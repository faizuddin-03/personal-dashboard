# Phase 2 — Autopilot Bot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a dealer sends an inbound WhatsApp message, the Autopilot bot classifies intent, retrieves grounding from the Knowledge Base, and — if confident and the message is safe — auto-replies; otherwise it escalates to a human. Every decision is logged for audit.

**Architecture:** A pure policy module (`autopilot.policy.ts`) holds the intent list, sensitive-intent guardrail, opt-out detection, and threshold check. `AutopilotService` orchestrates the existing seams — `LlmService` (Phase 0A), `KnowledgeService.retrieve()` (Phase 1), `SystemSettingsService` (autopilot config seeded in Phase 0A), and `WhatsappCloudApiService` — and persists an `AutopilotEvent` per decision. It's invoked from the existing webhook flow after the inbound message is stored. Auto-replies become real outbound `Message` rows (so they appear in the inbox thread) and resolve the conversation; escalations leave the conversation unresolved so it surfaces in the human inbox.

**Tech Stack:** NestJS 10, Prisma 5, Jest, pnpm.

**Source spec:** `docs/superpowers/specs/2026-06-04-eauto-dealer-ai-pivot-design.md` (§2 pillar 1, §4 data flow, §5).

**Branch:** Create `feat/eauto-autopilot-bot` off `feat/eauto-knowledge-base` (Phase 1) — or off `master` after PRs #10 + #11 merge. Depends on Phase 0A (`LlmService`, autopilot settings, dealer `Contact` fields) and Phase 1 (`KnowledgeService.retrieve`).

**Depends on (already built):**
- `LlmService` (`apps/api/src/llm/llm.service.ts`): `classifyIntent({message, intents})` → `{intent, confidence}`; `generateReply({message, intent, knowledge: {question,answer}[], dealerName?})` → `{text, confidence}` (confidence 0..1). Bound to `MockLlmService` (offline-safe), `@Global`.
- `KnowledgeService.retrieve(query, {intent?, limit?})` → `{doc, score}[]` (exported by `KnowledgeModule`).
- `SystemSettingsService.get(key, fallback)` (`@Global`). Seeded keys: `autopilot_enabled='true'`, `autopilot_escalation_threshold='70'`, `autopilot_honour_stop='true'`, `autopilot_after_hours='AWAY_THEN_ESCALATE'`.
- `WhatsappCloudApiService.sendFreeFormText(toPhoneE164, body)` → `{metaMessageId}` (`WhatsappModule`, offline in `WHATSAPP_MOCK_MODE`).
- Inbound flow: `WebhookController.receive()` → `BlastsService.applyInboundMessage(inbound)` creates the `InboundMessage` (routedTo `ANALYTICS`) then calls `inboxService.handleInbound(contactId, receivedAt)` (sets conversation `resolvedAt: null`).

**Scope note:** This slice covers the bot *engine* + inbound integration. Surfacing decisions in the UI (the inbox "Auto-replied" audit card and the "Needs Human" escalation queue) is Phase 3 + the frontend; the `AutopilotEvent` log and the existing unresolved-conversation inbox already make decisions observable. **After-hours behaviour** (`autopilot_after_hours`) is read-ready but its time-of-day branching is deferred to a follow-up (noted in Task 3).

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/prisma/schema.prisma` | Add `AutopilotAction` + `EscalationReason` enums + `AutopilotEvent` model. |
| `apps/api/prisma/migrations/*` | Generated additive migration. |
| `apps/api/src/autopilot/autopilot.policy.ts` | Pure: intents, sensitive set, opt-out detection, escalation-reason mapping, threshold check. |
| `apps/api/src/autopilot/__tests__/autopilot.policy.spec.ts` | Unit tests for the policy. |
| `apps/api/src/autopilot/autopilot.service.ts` | Orchestration: config → guardrails → KB retrieve → LLM reply → send/escalate → log. |
| `apps/api/src/autopilot/__tests__/autopilot.service.spec.ts` | Service unit tests (all branches, mocked deps). |
| `apps/api/src/autopilot/autopilot.module.ts` | Wires the service; imports KnowledgeModule + forwardRef(WhatsappModule); exports the service. |
| `apps/api/src/blasts/blasts.service.ts` | `applyInboundMessage` returns the persisted inbound info (so the webhook can hand it to the bot). |
| `apps/api/src/whatsapp/webhook.controller.ts` | After storing inbound, invoke `AutopilotService.handleInbound(...)`. |
| `apps/api/src/whatsapp/whatsapp.module.ts` | Add `forwardRef(() => AutopilotModule)`. |
| `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts` | Provide a mock `AutopilotService`. |
| `apps/api/src/app.module.ts` | Register `AutopilotModule`. |

---

## Task 1: AutopilotEvent model + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create (generated): `apps/api/prisma/migrations/<timestamp>_add_autopilot_event/`

- [ ] **Step 1: Append enums + model** at the END of `apps/api/prisma/schema.prisma`:

```prisma
enum AutopilotAction {
  AUTO_REPLIED
  ESCALATED
  OPTED_OUT
  SKIPPED
}

enum EscalationReason {
  COMPLAINT
  LOW_CONFIDENCE
  KNOWLEDGE_GAP
  SENSITIVE
}

model AutopilotEvent {
  id               String            @id @default(uuid()) @db.Uuid
  contactId        String            @map("contact_id") @db.Uuid
  inboundMessageId String?           @map("inbound_message_id") @db.Uuid
  action           AutopilotAction
  intent           String?
  confidence       Float?
  reason           EscalationReason?
  matchedKbDocId   String?           @map("matched_kb_doc_id") @db.Uuid
  model            String?
  replyText        String?           @map("reply_text")
  createdAt        DateTime          @default(now()) @map("created_at")

  @@index([contactId])
  @@index([action])
  @@index([createdAt])
  @@map("autopilot_events")
}
```

- [ ] **Step 2: Validate.** Run: `pnpm --filter api exec prisma validate` → expect valid.

- [ ] **Step 3: Migrate** (Postgres up; `docker compose up -d` if needed). Run: `pnpm --filter api exec prisma migrate dev --name add_autopilot_event` → expect "Your database is now in sync" + "Generated Prisma Client".

- [ ] **Step 4: Commit.**
```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): add AutopilotEvent model"
```

---

## Task 2: Pure policy module (TDD)

**Files:**
- Create: `apps/api/src/autopilot/autopilot.policy.ts`
- Test: `apps/api/src/autopilot/__tests__/autopilot.policy.spec.ts`

- [ ] **Step 1: Write the FAILING test.** Create `apps/api/src/autopilot/__tests__/autopilot.policy.spec.ts`:

```ts
import {
  INTENTS,
  SENSITIVE_INTENTS,
  isOptOut,
  escalationReasonForIntent,
  meetsThreshold,
} from '../autopilot.policy';

describe('autopilot.policy', () => {
  it('exposes the 9 known intents including general', () => {
    expect(INTENTS).toContain('general');
    expect(INTENTS).toContain('complaint');
    expect(INTENTS.length).toBe(9);
  });

  it('isOptOut matches STOP / BERHENTI case- and space-insensitively, nothing else', () => {
    expect(isOptOut('STOP')).toBe(true);
    expect(isOptOut('  stop  ')).toBe(true);
    expect(isOptOut('Berhenti')).toBe(true);
    expect(isOptOut('please stop sending')).toBe(false);
    expect(isOptOut('how do I transfer?')).toBe(false);
  });

  it('escalationReasonForIntent maps sensitive intents, null otherwise', () => {
    expect(escalationReasonForIntent('complaint')).toBe('COMPLAINT');
    expect(escalationReasonForIntent('account_access')).toBe('SENSITIVE');
    expect(escalationReasonForIntent('transfer_support')).toBeNull();
    expect(SENSITIVE_INTENTS.has('complaint')).toBe(true);
  });

  it('meetsThreshold compares 0..1 confidence against a 0..100 threshold', () => {
    expect(meetsThreshold(0.9, 70)).toBe(true);
    expect(meetsThreshold(0.7, 70)).toBe(true);
    expect(meetsThreshold(0.69, 70)).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, verify it FAILS.**
Run: `pnpm --filter api exec jest src/autopilot/__tests__/autopilot.policy --silent`
Expected: FAIL — cannot find module '../autopilot.policy'.

- [ ] **Step 3: Implement.** Create `apps/api/src/autopilot/autopilot.policy.ts`:

```ts
import { EscalationReason } from '@prisma/client';

/** The intents the classifier chooses from. `general` is the catch-all. */
export const INTENTS = [
  'transfer_support',
  'credit_topup',
  'vehicle_history',
  'roadtax_insurance',
  'subscription',
  'account_access',
  'feature_howto',
  'complaint',
  'general',
] as const;

/** Intents the bot must NEVER auto-answer — always route to a human. */
export const SENSITIVE_INTENTS = new Set<string>(['complaint', 'account_access']);

const OPT_OUT_KEYWORDS = new Set(['stop', 'berhenti']);

/** True if the whole message is an opt-out keyword (STOP / BERHENTI), case/space-insensitive. */
export function isOptOut(message: string): boolean {
  return OPT_OUT_KEYWORDS.has(message.trim().toLowerCase());
}

/** Escalation reason for a guarded intent, or null if the intent is auto-answerable. */
export function escalationReasonForIntent(intent: string): EscalationReason | null {
  if (intent === 'complaint') return 'COMPLAINT';
  if (SENSITIVE_INTENTS.has(intent)) return 'SENSITIVE';
  return null;
}

/** Confidence (0..1) meets the configured escalation threshold (0..100). */
export function meetsThreshold(confidence: number, thresholdPct: number): boolean {
  return confidence * 100 >= thresholdPct;
}
```

- [ ] **Step 4: Run it, verify it PASSES.**
Run: `pnpm --filter api exec jest src/autopilot/__tests__/autopilot.policy --silent`
Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
git add apps/api/src/autopilot/autopilot.policy.ts apps/api/src/autopilot/__tests__/autopilot.policy.spec.ts
git commit -m "feat(api): add autopilot policy (intents, guardrails, opt-out)"
```

---

## Task 3: AutopilotService (orchestration, TDD)

**Files:**
- Create: `apps/api/src/autopilot/autopilot.service.ts`
- Test: `apps/api/src/autopilot/__tests__/autopilot.service.spec.ts`

- [ ] **Step 1: Write the FAILING test.** Create `apps/api/src/autopilot/__tests__/autopilot.service.spec.ts`:

```ts
import { AutopilotService } from '../autopilot.service';

function makeDeps(overrides: any = {}) {
  const prisma = {
    contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'Auto Bestari', picName: 'Rahman' }), update: jest.fn().mockResolvedValue({}) },
    inboundMessage: { update: jest.fn().mockResolvedValue({}) },
    message: { create: jest.fn().mockResolvedValue({ id: 'm1' }) },
    inboxConversationState: { update: jest.fn().mockResolvedValue({}) },
    knowledgeDoc: { update: jest.fn().mockResolvedValue({}) },
    autopilotEvent: { create: jest.fn().mockResolvedValue({ id: 'e1' }) },
    $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
  };
  const settings = {
    get: jest.fn(async (key: string, fallback: string) => {
      const map: Record<string, string> = {
        autopilot_enabled: 'true',
        autopilot_escalation_threshold: '70',
        autopilot_honour_stop: 'true',
        ...overrides.settings,
      };
      return map[key] ?? fallback;
    }),
  };
  const llm = {
    classifyIntent: jest.fn().mockResolvedValue({ intent: 'transfer_support', confidence: 0.8 }),
    generateReply: jest.fn().mockResolvedValue({ text: 'Use the eAuto portal.', confidence: 0.9 }),
    ...overrides.llm,
  };
  const knowledge = {
    retrieve: jest.fn().mockResolvedValue([{ doc: { id: 'k1', question: 'transfer?', answer: 'Use the eAuto portal.' }, score: 6 }]),
    ...overrides.knowledge,
  };
  const whatsapp = { sendFreeFormText: jest.fn().mockResolvedValue({ metaMessageId: 'wamid.1' }) };
  const service = new AutopilotService(knowledge as any, llm as any, settings as any, whatsapp as any, prisma as any);
  return { service, prisma, settings, llm, knowledge, whatsapp };
}

const INBOUND = { contactId: 'c1', inboundMessageId: 'in1', body: 'how do I transfer ownership?' };

describe('AutopilotService.handleInbound', () => {
  it('opts the dealer out and logs OPTED_OUT on STOP (no reply)', async () => {
    const { service, prisma, whatsapp } = makeDeps();
    await service.handleInbound({ ...INBOUND, body: 'STOP' });
    expect(prisma.contact.update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'c1' } }));
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'OPTED_OUT' }) }));
  });

  it('logs SKIPPED and does nothing when autopilot is disabled', async () => {
    const { service, prisma, llm, whatsapp } = makeDeps({ settings: { autopilot_enabled: 'false' } });
    await service.handleInbound(INBOUND);
    expect(llm.classifyIntent).not.toHaveBeenCalled();
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'SKIPPED' }) }));
  });

  it('escalates (COMPLAINT) without replying when intent is a complaint', async () => {
    const { service, prisma, knowledge, whatsapp } = makeDeps({ llm: { classifyIntent: jest.fn().mockResolvedValue({ intent: 'complaint', confidence: 0.9 }) } });
    await service.handleInbound(INBOUND);
    expect(knowledge.retrieve).not.toHaveBeenCalled();
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ESCALATED', reason: 'COMPLAINT' }) }));
  });

  it('escalates (KNOWLEDGE_GAP) when no KB docs match', async () => {
    const { service, prisma, llm, whatsapp } = makeDeps({ knowledge: { retrieve: jest.fn().mockResolvedValue([]) } });
    await service.handleInbound(INBOUND);
    expect(llm.generateReply).not.toHaveBeenCalled();
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ESCALATED', reason: 'KNOWLEDGE_GAP' }) }));
  });

  it('escalates (LOW_CONFIDENCE) when the reply confidence is below threshold', async () => {
    const { service, prisma, whatsapp } = makeDeps({ llm: { classifyIntent: jest.fn().mockResolvedValue({ intent: 'transfer_support', confidence: 0.8 }), generateReply: jest.fn().mockResolvedValue({ text: 'maybe', confidence: 0.5 }) } });
    await service.handleInbound(INBOUND);
    expect(whatsapp.sendFreeFormText).not.toHaveBeenCalled();
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'ESCALATED', reason: 'LOW_CONFIDENCE' }) }));
  });

  it('auto-replies on high confidence: sends, records the message, resolves the conversation, logs AUTO_REPLIED', async () => {
    const { service, prisma, whatsapp } = makeDeps();
    await service.handleInbound(INBOUND);
    expect(whatsapp.sendFreeFormText).toHaveBeenCalledWith('+60123', 'Use the eAuto portal.');
    expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ contactId: 'c1', source: 'INBOX', status: 'SENT', metaMessageId: 'wamid.1' }) }));
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith(expect.objectContaining({ where: { contactId: 'c1' }, data: expect.objectContaining({ resolvedAt: expect.any(Date) }) }));
    expect(prisma.autopilotEvent.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ action: 'AUTO_REPLIED', intent: 'transfer_support', matchedKbDocId: 'k1' }) }));
  });
});
```

- [ ] **Step 2: Run it, verify it FAILS.**
Run: `pnpm --filter api exec jest src/autopilot/__tests__/autopilot.service --silent`
Expected: FAIL — cannot find module '../autopilot.service'.

- [ ] **Step 3: Implement.** Create `apps/api/src/autopilot/autopilot.service.ts`:

```ts
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LlmService } from '../llm/llm.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { WhatsappCloudApiService } from '../whatsapp/whatsapp-cloud-api.service';
import {
  INTENTS,
  isOptOut,
  escalationReasonForIntent,
  meetsThreshold,
} from './autopilot.policy';

/** Records which model produced the reply (the mock today; a real provider later). */
const AUTOPILOT_MODEL = 'mock';
const KB_RETRIEVE_LIMIT = 3;

export interface InboundForBot {
  contactId: string;
  inboundMessageId: string;
  body: string;
}

@Injectable()
export class AutopilotService {
  private readonly logger = new Logger(AutopilotService.name);

  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly llm: LlmService,
    private readonly settings: SystemSettingsService,
    @Inject(forwardRef(() => WhatsappCloudApiService))
    private readonly whatsapp: WhatsappCloudApiService,
    private readonly prisma: PrismaService,
  ) {}

  async handleInbound(inbound: InboundForBot): Promise<void> {
    const [enabled, threshold, honourStop] = await Promise.all([
      this.settings.get('autopilot_enabled', 'true'),
      this.settings.get('autopilot_escalation_threshold', '70'),
      this.settings.get('autopilot_honour_stop', 'true'),
    ]);

    // 1. Opt-out (STOP / BERHENTI)
    if (honourStop === 'true' && isOptOut(inbound.body)) {
      await this.prisma.contact.update({
        where: { id: inbound.contactId },
        data: { optInStatus: 'OPTED_OUT', optOutAt: new Date() },
      });
      await this.log(inbound, { action: 'OPTED_OUT' });
      return;
    }

    // 2. Autopilot off → leave it for a human (visible as an unresolved inbox conversation)
    if (enabled !== 'true') {
      await this.log(inbound, { action: 'SKIPPED' });
      return;
    }

    // The bot is now handling this inbound.
    await this.prisma.inboundMessage.update({
      where: { id: inbound.inboundMessageId },
      data: { routedTo: 'CHATBOT' },
    });

    // 3. Intent + sensitive-intent guardrail
    const { intent } = await this.llm.classifyIntent({ message: inbound.body, intents: [...INTENTS] });
    const guardReason = escalationReasonForIntent(intent);
    if (guardReason) {
      await this.log(inbound, { action: 'ESCALATED', reason: guardReason, intent });
      return;
    }

    // 4. Ground on the knowledge base
    const hits = await this.knowledge.retrieve(inbound.body, { intent, limit: KB_RETRIEVE_LIMIT });
    if (hits.length === 0) {
      await this.log(inbound, { action: 'ESCALATED', reason: 'KNOWLEDGE_GAP', intent });
      return;
    }

    // 5. Generate a grounded reply + confidence
    const contact = await this.prisma.contact.findUnique({ where: { id: inbound.contactId } });
    const reply = await this.llm.generateReply({
      message: inbound.body,
      intent,
      knowledge: hits.map((h) => ({ question: h.doc.question, answer: h.doc.answer })),
      dealerName: contact?.picName ?? contact?.name ?? undefined,
    });

    // 6. Confidence routing
    if (!meetsThreshold(reply.confidence, Number(threshold))) {
      await this.log(inbound, { action: 'ESCALATED', reason: 'LOW_CONFIDENCE', intent, confidence: reply.confidence });
      return;
    }

    // 7. Auto-reply: send, record the outbound message, resolve the conversation, bump KB usage
    if (!contact) return; // defensive — contact was resolved upstream
    const { metaMessageId } = await this.whatsapp.sendFreeFormText(contact.phoneE164, reply.text);
    const now = new Date();
    const matchedKbDocId = hits[0].doc.id;
    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          contactId: inbound.contactId,
          blastId: null,
          body: reply.text,
          source: 'INBOX',
          status: 'SENT',
          metaMessageId,
          sentAt: now,
        },
      }),
      this.prisma.inboxConversationState.update({
        where: { contactId: inbound.contactId },
        data: { lastOutboundAt: now, resolvedAt: now },
      }),
      this.prisma.knowledgeDoc.update({ where: { id: matchedKbDocId }, data: { uses: { increment: 1 } } }),
    ]);
    await this.log(inbound, {
      action: 'AUTO_REPLIED',
      intent,
      confidence: reply.confidence,
      matchedKbDocId,
      replyText: reply.text,
    });
  }

  private async log(
    inbound: InboundForBot,
    fields: {
      action: 'AUTO_REPLIED' | 'ESCALATED' | 'OPTED_OUT' | 'SKIPPED';
      intent?: string;
      confidence?: number;
      reason?: 'COMPLAINT' | 'LOW_CONFIDENCE' | 'KNOWLEDGE_GAP' | 'SENSITIVE';
      matchedKbDocId?: string;
      replyText?: string;
    },
  ): Promise<void> {
    await this.prisma.autopilotEvent.create({
      data: {
        contactId: inbound.contactId,
        inboundMessageId: inbound.inboundMessageId,
        action: fields.action,
        intent: fields.intent ?? null,
        confidence: fields.confidence ?? null,
        reason: fields.reason ?? null,
        matchedKbDocId: fields.matchedKbDocId ?? null,
        replyText: fields.replyText ?? null,
        model: fields.action === 'AUTO_REPLIED' ? AUTOPILOT_MODEL : null,
      },
    });
  }
}
```

- [ ] **Step 4: Run it, verify it PASSES (6 tests).**
Run: `pnpm --filter api exec jest src/autopilot/__tests__/autopilot.service --silent`
Expected: PASS.

- [ ] **Step 5: Commit.**
```bash
git add apps/api/src/autopilot/autopilot.service.ts apps/api/src/autopilot/__tests__/autopilot.service.spec.ts
git commit -m "feat(api): add AutopilotService (intent routing, KB grounding, escalation, auto-reply)"
```

---

## Task 4: Wire the bot into the inbound flow

**Files:**
- Modify: `apps/api/src/blasts/blasts.service.ts` (return inbound info)
- Create: `apps/api/src/autopilot/autopilot.module.ts`
- Modify: `apps/api/src/whatsapp/webhook.controller.ts` (invoke the bot)
- Modify: `apps/api/src/whatsapp/whatsapp.module.ts` (forwardRef AutopilotModule)
- Modify: `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts` (mock AutopilotService)
- Modify: `apps/api/src/app.module.ts` (register AutopilotModule)

- [ ] **Step 1: Make `applyInboundMessage` return the persisted inbound info.** In `apps/api/src/blasts/blasts.service.ts`:

Change the signature line:
```ts
  async applyInboundMessage(inbound: MetaInboundMessage): Promise<void> {
```
to:
```ts
  async applyInboundMessage(
    inbound: MetaInboundMessage,
  ): Promise<{ contactId: string; inboundMessageId: string; body: string } | null> {
```

Change the de-dupe early return from `return;` to `return null;` (the block that logs "already stored — skipping").

Capture the created inbound row — change:
```ts
    await this.prisma.inboundMessage.create({
      data: {
        contactId: contact.id,
        metaMessageId: inbound.id,
        body,
        attributedBlastId: attribution?.blastId ?? null,
        routedTo: 'ANALYTICS',
      },
    });
```
to:
```ts
    const inboundMessage = await this.prisma.inboundMessage.create({
      data: {
        contactId: contact.id,
        metaMessageId: inbound.id,
        body,
        attributedBlastId: attribution?.blastId ?? null,
        routedTo: 'ANALYTICS',
      },
    });
```

At the very end of the method (after the `inboxService.handleInbound` try/catch block), add:
```ts
    return { contactId: contact.id, inboundMessageId: inboundMessage.id, body };
```

- [ ] **Step 2: Create `apps/api/src/autopilot/autopilot.module.ts`:**
```ts
import { Module, forwardRef } from '@nestjs/common';
import { AutopilotService } from './autopilot.service';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    KnowledgeModule, // exports KnowledgeService
    forwardRef(() => WhatsappModule), // WhatsappCloudApiService (mutual dep with the webhook controller)
    // LlmModule, SystemSettingsModule, PrismaModule are @Global
  ],
  providers: [AutopilotService],
  exports: [AutopilotService],
})
export class AutopilotModule {}
```

- [ ] **Step 3: Invoke the bot from the webhook.** In `apps/api/src/whatsapp/webhook.controller.ts`:

Add imports:
```ts
import { Inject, forwardRef } from '@nestjs/common';
import { AutopilotService } from '../autopilot/autopilot.service';
```
Add the dependency to the constructor (alongside the existing `blasts` injection):
```ts
    @Inject(forwardRef(() => AutopilotService))
    private readonly autopilot: AutopilotService,
```
In the inbound dispatch loop, replace the existing call:
```ts
        await this.blasts.applyInboundMessage(inbound);
```
with:
```ts
        const stored = await this.blasts.applyInboundMessage(inbound);
        if (stored) {
          try {
            await this.autopilot.handleInbound(stored);
          } catch (err) {
            // Bot failure must never fail the webhook; the inbound is already persisted.
            this.logger?.error?.('Autopilot handleInbound failed', err as Error);
          }
        }
```
(If the controller has no `logger`, omit the `this.logger?.error?.(...)` line or add a `private readonly logger = new Logger(WebhookController.name);` — match the file's existing logging style.)

- [ ] **Step 4: Add the forwardRef in `apps/api/src/whatsapp/whatsapp.module.ts`.** Add the import:
```ts
import { AutopilotModule } from '../autopilot/autopilot.module';
```
and add `forwardRef(() => AutopilotModule),` to the `imports` array (alongside the existing `forwardRef(() => TemplatesModule)` / `forwardRef(() => BlastsModule)`).

- [ ] **Step 5: Provide a mock in the webhook controller spec.** In `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts`, add `AutopilotService` to the testing module providers with a mock, e.g.:
```ts
        { provide: AutopilotService, useValue: { handleInbound: jest.fn() } },
```
(Import `AutopilotService` at the top. If the existing `applyInboundMessage` mock returns `undefined`, update it to return `null` or a `{contactId, inboundMessageId, body}` object so the new `if (stored)` branch is exercised at least once.)

- [ ] **Step 6: Register `AutopilotModule` in `apps/api/src/app.module.ts`.** Add the import and add `AutopilotModule,` to the `imports` array (after `KnowledgeModule,`).

- [ ] **Step 7: Verify build + full test suite + DI boot (catches circular-dep wiring errors).**
Run: `pnpm --filter api build`
Then: `pnpm --filter api test`
Expected: build clean; all suites pass (including the updated webhook spec). If a pre-existing test asserted `applyInboundMessage` resolves to `undefined`, update it to the new return shape.
Then boot the full DI graph to confirm no circular-dependency error at runtime:
Run: `node -e "require('reflect-metadata');const{NestFactory}=require('@nestjs/core');const{AppModule}=require('./dist/src/app.module');NestFactory.create(AppModule,{logger:false}).then(a=>a.close()).then(()=>console.log('DI boot OK')).catch(e=>{console.error('DI BOOT FAILED:',e.message);process.exit(1)})"` (from `apps/api`).
Expected: `DI boot OK`. If it prints `DI BOOT FAILED: ... circular dependency`, the forwardRef wiring between `WhatsappModule` and `AutopilotModule` needs adjusting — confirm both module imports use `forwardRef(() => ...)` and the `WhatsappCloudApiService` injection in `AutopilotService` uses `@Inject(forwardRef(() => WhatsappCloudApiService))`.
(Note: the `dist` path may be `./dist/src/app.module` or `./dist/app.module` depending on the build layout — check `apps/api/dist` after building and use the correct path.)

- [ ] **Step 8: Commit.**
```bash
git add apps/api/src/autopilot/autopilot.module.ts apps/api/src/blasts/blasts.service.ts apps/api/src/whatsapp apps/api/src/app.module.ts
git commit -m "feat(api): route inbound messages through the Autopilot bot"
```

---

## Self-Review

**Spec coverage (§2 pillar 1, §4, §5):**
- Route inbound into the bot (not just ANALYTICS) → Task 4 (webhook invokes bot; routedTo set to CHATBOT when engaged) ✅
- Intent detection (9 intents) → Task 2 `INTENTS` + Task 3 `classifyIntent` ✅
- KB-grounded reply + confidence → Task 3 (`knowledge.retrieve` → `llm.generateReply`) ✅
- Confidence routing (≥ threshold auto-send, else escalate) → Task 3 + `meetsThreshold` ✅
- Guardrails (never auto-answer sensitive/complaints) → Task 2 `SENSITIVE_INTENTS` + Task 3 escalate-before-KB ✅
- Auto-send via existing WhatsApp path + record as a message → Task 3 (`sendFreeFormText` + `Message` create, source INBOX) ✅
- Audit record per decision (confidence, intent, matched KB doc, model) → Task 1 `AutopilotEvent` + Task 3 `log()` ✅
- STOP/BERHENTI opt-out → Task 2 `isOptOut` + Task 3 (opt-out + log) ✅
- Escalations surface for humans → auto-replies resolve the conversation; escalations leave it unresolved (existing inbox "awaiting") ✅

**Deferred (stated, not dropped):** after-hours behaviour branching (setting is read-ready); the inbox audit-card UI + escalation-queue UI (Phase 3 + frontend); a real LLM provider (mock today — `AUTOPILOT_MODEL='mock'`).

**Placeholder scan:** none — all steps have concrete code/commands. The DI-boot check has a real fallback procedure. `model='mock'` is an intentional, documented constant.

**Type consistency:** `handleInbound(InboundForBot)` shape (`{contactId, inboundMessageId, body}`) matches the object `applyInboundMessage` now returns and what the webhook passes. `AutopilotEvent` field names in `log()` match the Task 1 model. Policy exports (`INTENTS`, `SENSITIVE_INTENTS`, `isOptOut`, `escalationReasonForIntent`, `meetsThreshold`) match their usage in the service and tests. `EscalationReason` literals (`COMPLAINT`/`SENSITIVE`/`KNOWLEDGE_GAP`/`LOW_CONFIDENCE`) match the Task 1 enum. Reused signatures verified against the codebase: `sendFreeFormText(phoneE164, body) → {metaMessageId}`, `Message.create` shape (source INBOX), `inboxConversationState.update`, `SystemSettingsService.get(key, fallback)`, `KnowledgeService.retrieve(query, {intent?, limit?})`, `LlmService.classifyIntent`/`generateReply`.

---

## Next plans (not in this document)
1. **Plan 3 — Escalation / ticketing:** turn `AutopilotEvent`(ESCALATED) + unresolved conversations into assignable `Ticket`s (assign → resolve → close); the inbox "Needs Human" queue + dealer context panel.
2. **Plan 5 — Learning loop:** on ticket resolve/close, capture Q&A → `KnowledgeDoc`(CANDIDATE) → publish (already-built `setStatus`), closing the KB↔bot loop.
3. **Frontend (after 0B):** inbox "Auto-replied" audit card reads `AutopilotEvent` (confidence ring, intent, matched KB doc, model); Settings → Autopilot tab edits the `autopilot_*` settings this bot reads.
