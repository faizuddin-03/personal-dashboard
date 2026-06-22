# Inbox ↔ AI-Chatbot Bridge — Phase 1 (Inbound Bridge + AI-assist reuse) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the RAG chatbot's outcomes appear in the existing dashboard inbox by mirroring each decision into the legacy `AutopilotEvent` / `Ticket` / `Message` tables, and feed ticket AI-assist from the chatbot's `BotDraft` — without changing the dashboard UI.

**Architecture:** A new `ChatbotInboxBridge` (provided in `ChatbotModule`, depends only on the global `PrismaService`) is called from `ChatbotService.handleInbound` after each decision: auto-replies → `AutopilotEvent(AUTO_REPLIED)` + mirrored `Message(source=CHATBOT)`; escalations → `AutopilotEvent(ESCALATED)` + `Ticket(conversationId=…)`. The legacy `autopilot.handleInbound` brain is bypassed when `CHATBOT_ENABLED`. `TicketsService.suggestReply`/`agentContext` reuse the linked conversation's `BotDraft.suggestedReply` + citations when present. Writing legacy rows directly via Prisma avoids importing API-only modules into the worker process.

**Tech Stack:** NestJS, Prisma (PostgreSQL + pgvector), BullMQ, Jest (integration tests against the live dev DB, mirroring the existing chatbot specs).

**Scope note:** This is Phase 1 of the spec `docs/superpowers/specs/2026-06-19-inbox-chatbot-integration-design.md`. It delivers the *inbound* bridge (dashboard reflects chatbot activity) + AI-assist reuse. **Operator write-back** (composer send → `manualReply`, ticket assign → take-over, resolve/close → `close`→resolution-capture, decision §3.5/§3.7) is **Phase 1b** (separate plan). Frontend touches are Phase 2; e2e + live testing are Phase 3.

---

## File Structure

- **Modify** `apps/api/prisma/schema.prisma` — add `Ticket.conversationId`, `MessageSource.CHATBOT`.
- **Create** `apps/api/prisma/migrations/<ts>_inbox_chatbot_bridge/migration.sql` — additive ALTERs (hand-authored; applied via `migrate deploy`).
- **Create** `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.ts` — the bridge (Prisma-only, best-effort).
- **Create** `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.spec.ts` — integration tests.
- **Modify** `apps/api/src/chatbot/chatbot.module.ts` — provide+export `ChatbotInboxBridge`.
- **Modify** `apps/api/src/chatbot/chatbot.service.ts` — inject the bridge; call it at the rag_answer / escalation / dispatch-failure seams.
- **Modify** `apps/api/src/whatsapp/webhook.controller.ts:84-94` — gate the legacy autopilot path behind `!chatbotEnabled`.
- **Modify** `apps/api/src/tickets/tickets.service.ts` — `suggestReply`/`agentContext` reuse `BotDraft` when `ticket.conversationId` is set.
- **Modify** `apps/api/src/tickets/tickets.service.spec.ts` (or create if absent) — tests for the BotDraft-reuse path.

---

## Task 1: Schema — `Ticket.conversationId` + `MessageSource.CHATBOT`

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (model `Ticket`; enum `MessageSource`)
- Create: `apps/api/prisma/migrations/<timestamp>_inbox_chatbot_bridge/migration.sql`

- [ ] **Step 1: Add the field + enum value to the schema**

In `model Ticket` (after the `autopilotEventId` line), add:
```prisma
  conversationId   String?          @map("conversation_id") @db.Uuid       // FK → chatbot Conversation (bridge link)
```
And add the relation line in `model Ticket` (with the other relations):
```prisma
  conversation     Conversation?    @relation(fields: [conversationId], references: [id], onDelete: SetNull)
```
Add an index near the other `@@index` lines:
```prisma
  @@index([conversationId])
```
In `model Conversation`, add the back-relation (near its other relations like `botDrafts`):
```prisma
  tickets                     Ticket[]
```
In `enum MessageSource`, add the value:
```prisma
enum MessageSource {
  BLAST
  INBOX
  CHATBOT
}
```

- [ ] **Step 2: Hand-author the migration** (do NOT run `prisma migrate dev` — it tries to drop the raw-SQL `embedding` pgvector column; see prior migrations on this branch)

Create `apps/api/prisma/migrations/<timestamp>_inbox_chatbot_bridge/migration.sql` where `<timestamp>` is `date +%Y%m%d%H%M%S` (must sort after the latest existing migration):
```sql
-- AlterEnum
ALTER TYPE "MessageSource" ADD VALUE 'CHATBOT';

-- AlterTable
ALTER TABLE "tickets" ADD COLUMN "conversation_id" UUID;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_conversation_id_fkey"
  FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "tickets_conversation_id_idx" ON "tickets"("conversation_id");
```

- [ ] **Step 3: Apply the migration + regenerate the client**

Run:
```bash
cd apps/api && pnpm exec prisma migrate deploy && pnpm exec prisma generate
```
Expected: `All migrations have been successfully applied.` and a clean `prisma generate`. Note: `ALTER TYPE ... ADD VALUE` cannot run inside a transaction with other statements in some Postgres versions; if `migrate deploy` errors on the enum add, split it into its own migration directory (enum-add first, then the table/FK/index migration).

- [ ] **Step 4: Verify the column + enum exist**

Run:
```bash
cd apps/api && node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRawUnsafe(\"SELECT count(*)::int c FROM information_schema.columns WHERE table_name='tickets' AND column_name='conversation_id'\").then(r=>console.log(JSON.stringify(r[0]))).finally(()=>p.\$disconnect())"
```
Expected: `{"c":1}`

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(chatbot): add Ticket.conversationId + MessageSource.CHATBOT for the inbox bridge"
```

---

## Task 2: `ChatbotInboxBridge` service

**Files:**
- Create: `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.ts`
- Test: `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.spec.ts`

- [ ] **Step 1: Write the failing integration test**

Mirrors `apps/api/src/chatbot/api/inbox.service.spec.ts` (real `PrismaClient`, raw-SQL contact seeding, scoped cleanup).

```typescript
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { ChatbotInboxBridge } from './chatbot-inbox-bridge.service';

const prisma = new PrismaClient() as unknown as PrismaService;
const bridge = new ChatbotInboxBridge(prisma);

const contactIds = new Set<string>();

async function makeContact(): Promise<string> {
  const id = randomUUID();
  const digits = id.replace(/\D/g, '').slice(0, 9).padEnd(9, '0');
  await prisma.$executeRawUnsafe(
    `INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid, $2, NOW())`,
    id,
    `+19${digits}`,
  );
  contactIds.add(id);
  return id;
}

async function makeConversation(contactId: string): Promise<string> {
  const conv = await prisma.conversation.create({
    data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() },
  });
  return conv.id;
}

beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => {
  for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id = $1::uuid`, id);
  await prisma.$disconnect();
});

describe('ChatbotInboxBridge.recordAutoReply', () => {
  it('writes an AUTO_REPLIED AutopilotEvent and mirrors a CHATBOT Message', async () => {
    const contactId = await makeContact();

    await bridge.recordAutoReply({
      contactId,
      intent: 'vehicle_history',
      confidence: 0.92,
      replyText: 'We open at 9am daily.',
      metaMessageId: `wamid-${randomUUID()}`,
      model: 'qwen3',
    });

    const event = await prisma.autopilotEvent.findFirst({
      where: { contactId, action: 'AUTO_REPLIED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(event).not.toBeNull();
    expect(event!.replyText).toBe('We open at 9am daily.');
    expect(event!.confidence).toBeCloseTo(0.92);

    const message = await prisma.message.findFirst({ where: { contactId, source: 'CHATBOT' } });
    expect(message).not.toBeNull();
    expect(message!.body).toBe('We open at 9am daily.');
    expect(message!.status).toBe('SENT');
  });
});

describe('ChatbotInboxBridge.recordEscalation', () => {
  it('writes an ESCALATED AutopilotEvent and a Ticket linked to the conversation', async () => {
    const contactId = await makeContact();
    const conversationId = await makeConversation(contactId);

    await bridge.recordEscalation({
      contactId,
      conversationId,
      reason: 'complaint',
      intent: 'complaint',
    });

    const event = await prisma.autopilotEvent.findFirst({
      where: { contactId, action: 'ESCALATED' },
      orderBy: { createdAt: 'desc' },
    });
    expect(event).not.toBeNull();
    expect(event!.reason).toBe('COMPLAINT');

    const ticket = await prisma.ticket.findFirst({ where: { conversationId } });
    expect(ticket).not.toBeNull();
    expect(ticket!.reason).toBe('COMPLAINT');
    expect(ticket!.autopilotEventId).toBe(event!.id);
    expect(ticket!.status).toBe('OPEN');
  });

  it('maps an unknown chatbot reason to the SENSITIVE catch-all', async () => {
    const contactId = await makeContact();
    const conversationId = await makeConversation(contactId);

    await bridge.recordEscalation({ contactId, conversationId, reason: 'out_of_hours' });

    const ticket = await prisma.ticket.findFirst({ where: { conversationId } });
    expect(ticket!.reason).toBe('SENSITIVE');
  });

  it('never throws on a DB error (best-effort)', async () => {
    await expect(
      bridge.recordEscalation({ contactId: randomUUID(), conversationId: randomUUID(), reason: 'complaint' }),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter api exec jest chatbot-inbox-bridge -t recordAutoReply`
Expected: FAIL — `Cannot find module './chatbot-inbox-bridge.service'`.

- [ ] **Step 3: Implement the bridge**

Create `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.ts`:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EscalationReason } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Best-effort writer that mirrors the RAG chatbot's outcomes into the legacy Autopilot/Tickets/Message
 * tables the dashboard inbox reads. Depends only on the global PrismaService so it runs in the worker
 * process without importing API-only modules. Every method swallows errors (logs only) — a bridge
 * failure must never break the chatbot reply/escalation pipeline.
 */
@Injectable()
export class ChatbotInboxBridge {
  private readonly logger = new Logger(ChatbotInboxBridge.name);

  constructor(private readonly prisma: PrismaService) {}

  /** Mirror a confident chatbot auto-reply → AutopilotEvent(AUTO_REPLIED) + Message(source=CHATBOT). */
  async recordAutoReply(input: {
    contactId: string;
    intent?: string;
    confidence?: number;
    replyText: string;
    metaMessageId?: string;
    model?: string;
  }): Promise<void> {
    try {
      const sentAt = new Date();
      await this.prisma.$transaction([
        this.prisma.autopilotEvent.create({
          data: {
            contactId: input.contactId,
            inboundMessageId: null, // chatbot has no legacy InboundMessage id; column is nullable
            action: 'AUTO_REPLIED',
            intent: input.intent ?? null,
            confidence: input.confidence ?? null,
            replyText: input.replyText,
            model: input.model ?? null,
          },
        }),
        this.prisma.message.create({
          data: {
            contactId: input.contactId,
            blastId: null,
            body: input.replyText,
            source: 'CHATBOT',
            status: 'SENT',
            metaMessageId: input.metaMessageId ?? null,
            sentAt,
          },
        }),
      ]);
    } catch (err) {
      this.logger.error(`bridge recordAutoReply failed contactId=${input.contactId}: ${(err as Error).message}`);
    }
  }

  /** Mirror a chatbot escalation → AutopilotEvent(ESCALATED) + Ticket linked to the conversation. */
  async recordEscalation(input: {
    contactId: string;
    conversationId: string;
    reason: string;
    intent?: string;
    confidence?: number;
  }): Promise<void> {
    try {
      const reason = mapEscalationReason(input.reason);
      const event = await this.prisma.autopilotEvent.create({
        data: {
          contactId: input.contactId,
          inboundMessageId: null,
          action: 'ESCALATED',
          reason,
          intent: input.intent ?? null,
          confidence: input.confidence ?? null,
        },
      });
      await this.prisma.ticket.create({
        data: {
          contactId: input.contactId,
          conversationId: input.conversationId,
          reason,
          intent: input.intent ?? null,
          autopilotEventId: event.id,
          status: 'OPEN',
        },
      });
    } catch (err) {
      this.logger.error(`bridge recordEscalation failed contactId=${input.contactId}: ${(err as Error).message}`);
    }
  }
}

/**
 * Map a chatbot decision `reason` string onto the legacy EscalationReason enum.
 * Unknown reasons fall back to SENSITIVE so no escalation is ever dropped for lack of a mapping.
 */
export function mapEscalationReason(reason: string): EscalationReason {
  if (reason === 'complaint') return 'COMPLAINT';
  if (reason === 'low_intent_confidence' || reason.startsWith('low')) return 'LOW_CONFIDENCE';
  if (reason.includes('no_kb') || reason.includes('knowledge')) return 'KNOWLEDGE_GAP';
  return 'SENSITIVE';
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter api exec jest chatbot-inbox-bridge`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/chatbot/bridge
git commit -m "feat(chatbot): ChatbotInboxBridge — mirror chatbot outcomes into Autopilot/Ticket/Message"
```

---

## Task 3: Provide the bridge + wire it into `ChatbotService`

**Files:**
- Modify: `apps/api/src/chatbot/chatbot.module.ts`
- Modify: `apps/api/src/chatbot/chatbot.service.ts`

- [ ] **Step 1: Provide the bridge in `ChatbotModule`**

In `apps/api/src/chatbot/chatbot.module.ts`, import the bridge and add it to providers + exports:
```typescript
import { ChatbotInboxBridge } from './bridge/chatbot-inbox-bridge.service';
```
In the `@Module({ ... })`:
```typescript
  providers: [ChatbotService, chatbotLogger, ChatbotInboxBridge],
  exports: [ChatbotService, ChatbotInboxBridge],
```

- [ ] **Step 2: Inject the bridge into `ChatbotService`**

In `apps/api/src/chatbot/chatbot.service.ts`, add the import:
```typescript
import { ChatbotInboxBridge } from './bridge/chatbot-inbox-bridge.service';
```
Add to the constructor parameter list (after `private readonly campaign: CampaignContextService,`):
```typescript
    private readonly inboxBridge: ChatbotInboxBridge,
```

- [ ] **Step 3: Call the bridge at the `rag_answer` seam**

In the `case 'rag_answer':` block, immediately after the `await this.conversations.recordAutoReply({...})` call and before `void this.whatsapp.markAsRead(...)`, add:
```typescript
          await this.inboxBridge.recordAutoReply({
            contactId: contact.id,
            intent: decision.intent,
            confidence: decision.draftConfidence,
            replyText: decision.draftBody!,
            metaMessageId,
            model: decision.modelUsed,
          });
```

- [ ] **Step 4: Call the bridge at the escalation seams**

In `case 'safety_escalate':`, after the existing `await this.conversations.recordEscalation({...})`, add:
```typescript
          await this.inboxBridge.recordEscalation({
            contactId: contact.id,
            conversationId,
            reason: decision.reason,
            intent: decision.intent,
            confidence: decision.intentConfidence,
          });
```
In `case 'escalation_accepted_ack': case 'consent_accepted_escalate':`, after its `await this.conversations.recordEscalation({...})`, add the same call (using `decision.reason` = `'escalation_accepted'` → maps to SENSITIVE):
```typescript
          await this.inboxBridge.recordEscalation({
            contactId: contact.id,
            conversationId,
            reason: decision.reason,
            intent: decision.intent,
            confidence: decision.intentConfidence,
          });
```
In the `catch (err)` dispatch-failure block, inside the `if (decision.subKind === 'rag_answer') { ... }` after its `recordEscalation`, add:
```typescript
          await this.inboxBridge.recordEscalation({
            contactId: contact.id,
            conversationId,
            reason: 'dispatch_failure',
            intent: decision.intent,
            confidence: decision.draftConfidence,
          });
```

- [ ] **Step 5: Update the chatbot.service unit spec's collaborator mock**

In `apps/api/src/chatbot/chatbot.service.spec.ts`, the test builds `ChatbotService` with mocked collaborators. Add an `inboxBridge` mock and pass it as the new constructor arg:
```typescript
  const inboxBridge = { recordAutoReply: jest.fn().mockResolvedValue(undefined), recordEscalation: jest.fn().mockResolvedValue(undefined) };
```
Append `inboxBridge as never` to the `new ChatbotService(...)` argument list (last position, matching the constructor order). Then add assertions to the existing `rag_answer` and `safety_escalate` tests:
```typescript
  expect(inboxBridge.recordAutoReply).toHaveBeenCalled();   // in the rag_answer happy-path test
  expect(inboxBridge.recordEscalation).toHaveBeenCalled();  // in the safety_escalate test
```

- [ ] **Step 6: Run the chatbot service spec + bridge spec**

Run: `pnpm --filter api exec jest chatbot.service.spec chatbot-inbox-bridge`
Expected: PASS.

- [ ] **Step 7: Typecheck**

Run: `cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json`
Expected: clean (no errors).

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/chatbot/chatbot.module.ts apps/api/src/chatbot/chatbot.service.ts apps/api/src/chatbot/chatbot.service.spec.ts
git commit -m "feat(chatbot): feed Autopilot/Tickets from the chatbot via ChatbotInboxBridge"
```

---

## Task 4: Bypass the legacy autopilot brain when `CHATBOT_ENABLED`

**Files:**
- Modify: `apps/api/src/whatsapp/webhook.controller.ts:84-94`

- [ ] **Step 1: Hoist the `chatbotEnabled` flag and gate the autopilot loop**

In `apps/api/src/whatsapp/webhook.controller.ts`, move the `const chatbotEnabled = ...` computation (currently at line 104) to **above** the autopilot loop (before line 84), then wrap the autopilot call so it only runs when the chatbot is OFF. Replace lines 84-94:
```typescript
          const chatbotEnabled = this.config.get<string>('CHATBOT_ENABLED', 'false') === 'true';
          for (const inbound of value.messages ?? []) {
            const stored = await this.blasts.applyInboundMessage(inbound);
            // When the RAG chatbot is enabled it is the single brain (it feeds Autopilot/Tickets via
            // ChatbotInboxBridge), so skip the legacy autopilot to avoid double-handling each inbound.
            if (stored && !chatbotEnabled) {
              try {
                await this.autopilot.handleInbound(stored);
              } catch (err) {
                this.logger.error('Autopilot handleInbound failed', err as Error);
              }
            }
          }
```
Then remove the now-duplicate `const chatbotEnabled = ...` line that was at ~line 104 (the chatbot block below now uses the hoisted const).

- [ ] **Step 2: Verify the webhook spec still passes**

Run: `pnpm --filter api exec jest webhook.controller`
Expected: PASS. If a test asserts autopilot is called on inbound, add/adjust a case: with `CHATBOT_ENABLED=true` the autopilot is NOT called and the chatbot queue IS used; with it unset/false the autopilot IS called. (Set the flag via the mocked `ConfigService.get` in the spec.)

- [ ] **Step 3: Typecheck + commit**

Run: `cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json` (expect clean), then:
```bash
git add apps/api/src/whatsapp/webhook.controller.ts apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts
git commit -m "feat(chatbot): bypass legacy autopilot when CHATBOT_ENABLED (chatbot is the single brain)"
```

---

## Task 5: `TicketsService.suggestReply` + `agentContext` reuse the chatbot `BotDraft`

**Files:**
- Modify: `apps/api/src/tickets/tickets.service.ts:67-88` (`agentContext`), `:130-146` (`suggestReply`)
- Test: `apps/api/src/tickets/tickets.service.spec.ts` (create if it does not exist)

- [ ] **Step 1: Write the failing test**

Integration test (live DB, raw-SQL seeding). Create/extend `apps/api/src/tickets/tickets.service.spec.ts`:
```typescript
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TicketsService } from './tickets.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { LlmService } from '../llm/llm.service';

const prisma = new PrismaClient() as unknown as PrismaService;
const knowledge = { retrieve: jest.fn().mockResolvedValue([]) } as unknown as KnowledgeService;
const llm = { generateReply: jest.fn().mockResolvedValue({ text: 'legacy reply', confidence: 0.5 }) } as unknown as LlmService;
const svc = new TicketsService(prisma, knowledge, llm);

const contactIds = new Set<string>();
async function makeContact(): Promise<string> {
  const id = randomUUID();
  const digits = id.replace(/\D/g, '').slice(0, 9).padEnd(9, '0');
  await prisma.$executeRawUnsafe(`INSERT INTO contacts (id, phone_e164, updated_at) VALUES ($1::uuid,$2,NOW())`, id, `+19${digits}`);
  contactIds.add(id);
  return id;
}

beforeAll(async () => { await prisma.$connect(); });
afterAll(async () => {
  for (const id of contactIds) await prisma.$executeRawUnsafe(`DELETE FROM contacts WHERE id=$1::uuid`, id);
  await prisma.$disconnect();
});
beforeEach(() => { (llm.generateReply as jest.Mock).mockClear(); });

describe('TicketsService.suggestReply with a linked chatbot conversation', () => {
  it('returns the BotDraft.suggestedReply and does NOT call the legacy LLM', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const inbound = await prisma.conversationInboundMessage.create({
      data: { conversationId: conv.id, metaMessageId: `wamid-${randomUUID()}`, body: 'How do I top up?', receivedAt: new Date(), rawJson: {} },
    });
    await prisma.botDraft.create({
      data: {
        conversationId: conv.id, inboundMessageId: inbound.id, body: 'How do I top up?',
        suggestedReply: 'Top up via the app under Wallet → Add credit.',
        intent: 'credit_topup', intentConfidence: 0.9, draftConfidence: 0.9,
        modelUsed: 'mock', embeddingModelUsed: 'mock', latencyMs: 5, state: 'PENDING',
      },
    });
    const ticket = await prisma.ticket.create({
      data: { contactId, conversationId: conv.id, reason: 'LOW_CONFIDENCE', status: 'OPEN' },
    });

    const res = await svc.suggestReply(ticket.id);

    expect(res.text).toBe('Top up via the app under Wallet → Add credit.');
    expect(llm.generateReply).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm --filter api exec jest tickets.service -t "linked chatbot conversation"`
Expected: FAIL — current `suggestReply` ignores `conversationId` and calls `llm.generateReply` (returns 'legacy reply'), so the assertion on the BotDraft text fails and the not-called assertion fails.

- [ ] **Step 3: Implement BotDraft reuse in `suggestReply`**

In `apps/api/src/tickets/tickets.service.ts`, at the top of `suggestReply(id)` (after `const ticket = await this.getOrThrow(id);`), add the reuse branch:
```typescript
    if (ticket.conversationId) {
      const draft = await this.prisma.botDraft.findFirst({
        where: { conversationId: ticket.conversationId, suggestedReply: { not: null } },
        orderBy: { createdAt: 'desc' },
      });
      if (draft?.suggestedReply) {
        return { text: draft.suggestedReply, confidence: draft.draftConfidence };
      }
    }
```
(Leave the existing legacy `inbound`/`knowledge.retrieve`/`llm.generateReply` flow below as the fallback.)

- [ ] **Step 4: Add BotDraft-backed citations to `agentContext`**

In `agentContext(id)`, after `const ticket = await this.getOrThrow(id);`, add a branch that surfaces the chatbot draft's cited chunks (their document titles) when a conversation is linked, falling back to the legacy KB hits otherwise:
```typescript
    if (ticket.conversationId) {
      const draft = await this.prisma.botDraft.findFirst({
        where: { conversationId: ticket.conversationId },
        orderBy: { createdAt: 'desc' },
        include: { citations: { include: { chunk: { include: { document: true } } }, orderBy: { rank: 'asc' } } },
      });
      if (draft) {
        return {
          intent: ticket.intent,
          reason: ticket.reason,
          confidence: draft.draftConfidence,
          escalatedAt: ticket.openedAt,
          suggestedKnowledge: draft.citations.map((c) => ({
            id: c.chunk.document.id,
            slug: c.chunk.document.name,
            question: c.chunk.document.title,
            answer: c.chunk.text,
            category: c.chunk.document.category,
          })),
        };
      }
    }
```
(Confirm the relation names `citations` → `chunk` → `document` against the Prisma schema before writing; adjust `include` to match. The existing legacy body below stays as the fallback.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `pnpm --filter api exec jest tickets.service`
Expected: PASS (new reuse test + any existing tests).

- [ ] **Step 6: Typecheck + commit**

Run: `cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json` (expect clean), then:
```bash
git add apps/api/src/tickets/tickets.service.ts apps/api/src/tickets/tickets.service.spec.ts
git commit -m "feat(tickets): reuse chatbot BotDraft suggestion + citations for linked-conversation tickets"
```

---

## Task 6: Full regression + lint

- [ ] **Step 1: Run the chatbot + tickets + webhook suites**

Run: `pnpm --filter api exec jest src/chatbot tickets.service webhook.controller`
Expected: all PASS (re-run once if a known cross-file flake appears in an unrelated suite; this branch's `retrieval.service` real-embeddings tests need a live Ollama and may fail in a mock-only environment — unrelated to this work).

- [ ] **Step 2: Typecheck**

Run: `cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json`
Expected: clean.

- [ ] **Step 3: Lint (if available)**

Run: `pnpm --filter api lint`
Note: `eslint` may be absent in this environment (it is on this branch) — if so, `tsc --noEmit` is the substitute gate; record that lint could not run.

---

## Self-review checklist (done while writing)
- **Spec coverage:** §3.1 (Task 3), §3.2 reason map (Task 2), §3.3 Ticket link (Task 1), §3.4 suggest/agentContext reuse (Task 5), §3.6 message mirror (Task 2/3), §3.8 autopilot bypass (Task 4), §3.9 best-effort + Prisma-only worker-safe wiring (Task 2). **Deferred to Phase 1b:** §3.5 operator write-back (composer→manualReply, assign→take-over, resolve/close→close) and §3.7 save-to-KB routing — noted in the scope banner.
- **Placeholders:** none — every code step shows full code. The two "confirm relation names" notes (Task 5 Step 4) are verification instructions, not placeholders; the include shape is given.
- **Type consistency:** bridge methods `recordAutoReply`/`recordEscalation` and the `mapEscalationReason` helper are used with the same signatures in Tasks 2 and 3; `Ticket.conversationId` defined in Task 1 is consumed in Tasks 2 and 5.
