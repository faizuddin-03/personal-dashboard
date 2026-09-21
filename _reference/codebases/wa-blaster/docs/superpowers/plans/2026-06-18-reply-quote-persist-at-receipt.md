# Reply-Quote Regression Fix (Persist Inbound at Receipt) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore conditional reply-quoting (single question → clean reply; rapid multi-question burst → each reply quotes its question) by persisting the chatbot inbound row at webhook *receipt* again, so its `createdAt` reflects arrival order when the worker composes the reply.

**Architecture:** Make `ConversationService.handleInbound` idempotent on `metaMessageId`; have the webhook persist the inbound at receipt (fast, before enqueue) so sibling rows exist when an earlier message is answered; the worker's existing `handleInbound` call then *finds* that row (no new processing-time row) — so the quote logic (`hasActivityAfterInbound`, ordered by `createdAt`) works unchanged, with no edits to the worker, the job payload, or the queue.

**Tech Stack:** NestJS, TypeScript, Jest, Prisma/Postgres, BullMQ. `PrismaModule` is `@Global` (PrismaService injectable anywhere).

**Spec:** `docs/superpowers/specs/2026-06-18-reply-quote-persist-at-receipt-design.md`

**Branch:** `feat/ai-chatbot` — commit per task; push to the feature branch (no PR).

**Root cause (for context):** `5dcece8` added the quote logic (ordering by `createdAt`, which then reflected receipt time). The later `ce5558f` (fast-ack) changed the webhook from `await chatbot.handleInbound(...)` (persist at receipt) to enqueue-only, moving the inbound `create` into the sequential worker — so `createdAt` became processing time and the message being answered is always the newest row → quote never fires.

---

## File Structure

- **Modify** `apps/api/src/chatbot/conversations/conversation.service.ts` — add an idempotency guard at the top of `handleInbound`.
- **Modify** `apps/api/src/chatbot/conversations/conversation.service.spec.ts` — add the idempotency integration test.
- **Modify** `apps/api/src/whatsapp/webhook.controller.ts` — persist at receipt (resolve contact, skip non-text/unknown, call `conversations.handleInbound`) before enqueuing; inject `PrismaService` + `ConversationService`.
- **Modify** `apps/api/src/whatsapp/whatsapp.module.ts` — import `ConversationsModule`.
- **Modify** `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts` — add the two new deps to the chatbot-block test module; assert persist-at-receipt (the regression test) + non-text/unknown skips.

No change to `chatbot.service.ts`, `chatbot-inbound.queue.ts`, `chatbot-inbound.processor.ts`, the worker module, or the sim.

---

### Task 1: Make `ConversationService.handleInbound` idempotent on `metaMessageId`

**Files:**
- Modify: `apps/api/src/chatbot/conversations/conversation.service.ts`
- Test: `apps/api/src/chatbot/conversations/conversation.service.spec.ts`

This is an integration spec (real `PrismaClient` against Postgres). Postgres must be reachable (same DB the app/grader use).

- [ ] **Step 1: Write the failing test**

In `conversation.service.spec.ts`, inside `describe('ConversationService.handleInbound', ...)` (starts ~line 89), add:

```typescript
  it('is idempotent on metaMessageId — a redelivery returns the same row (no duplicate, no throw)', async () => {
    const contactId = await makeContact();
    const metaMessageId = `wamid-idem-${randomUUID()}`;

    const first = await svc.handleInbound({ contactId, metaMessageId, body: 'first' });
    const second = await svc.handleInbound({ contactId, metaMessageId, body: 'second (redelivery)' });

    expect(second.inboundMessage.id).toBe(first.inboundMessage.id);
    expect(second.inboundMessage.body).toBe('first'); // original preserved, not overwritten
    expect(second.conversation.id).toBe(first.conversation.id);

    const count = await prisma.conversationInboundMessage.count({ where: { metaMessageId } });
    expect(count).toBe(1);
  });
```

(`makeContact`, `prisma`, `svc`, `randomUUID` already exist in this file.)

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd apps/api && npx jest src/chatbot/conversations/conversation.service.spec.ts -t "idempotent on metaMessageId" --runInBand`
Expected: FAIL — the second `handleInbound` hits `conversationInboundMessage.create` with a duplicate `metaMessageId` and Prisma throws a unique-constraint error (P2002).

- [ ] **Step 3: Add the idempotency guard**

In `conversation.service.ts`, at the very top of `handleInbound` (before `const receivedAt = ...`), insert:

```typescript
    // Idempotency on metaMessageId. The webhook now persists the inbound at RECEIPT (fast-ack) and
    // the worker re-derives the same row when it processes the job; Meta also redelivers webhooks.
    // If this exact message was already recorded, return it as-is — no duplicate insert, no second
    // window refresh, and crucially its original (receipt-time) createdAt is preserved, which the
    // reply-quote logic (hasActivityAfterInbound, ordered by createdAt) depends on.
    const existing = await this.prisma.conversationInboundMessage.findUnique({
      where: { metaMessageId: input.metaMessageId },
      include: { conversation: true },
    });
    if (existing) {
      const { conversation, ...inboundMessage } = existing;
      return { conversation, inboundMessage };
    }
```

(`Conversation` and `ConversationInboundMessage` are already imported from `@prisma/client`; the method's return type is `{ conversation: Conversation; inboundMessage: ConversationInboundMessage }`, which the destructure satisfies.)

- [ ] **Step 4: Run the new test + the whole conversation spec**

Run: `cd apps/api && npx jest src/chatbot/conversations/conversation.service.spec.ts --runInBand`
Expected: PASS — the new idempotency test passes and all pre-existing `handleInbound` tests still pass (they use unique wamids per call, so the guard's `findUnique` returns null and they create as before).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/chatbot/conversations/conversation.service.ts apps/api/src/chatbot/conversations/conversation.service.spec.ts
git commit -m "fix(chatbot): make ConversationService.handleInbound idempotent on metaMessageId

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Persist the inbound at webhook receipt (before enqueue)

**Files:**
- Modify: `apps/api/src/whatsapp/webhook.controller.ts`
- Modify: `apps/api/src/whatsapp/whatsapp.module.ts`
- Test: `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts`

- [ ] **Step 1: Update the chatbot-block test (regression test + skips)**

In `webhook.controller.spec.ts`, in the `describe('chatbot bridge (CHATBOT_ENABLED=true)', ...)` block:

(a) Add imports at the top of the file (with the other imports):

```typescript
import { PrismaService } from '../../prisma/prisma.service';
import { ConversationService } from '../../chatbot/conversations/conversation.service';
```

(b) In that describe, add two mock holders next to `cbChatbotQueue`:

```typescript
    let cbConversations: { handleInbound: jest.Mock };
    let cbPrisma: { contact: { findUnique: jest.Mock } };
```

(c) In its `beforeEach`, initialize them and add them as providers (place alongside the existing providers):

```typescript
      cbConversations = {
        handleInbound: jest.fn().mockResolvedValue({ conversation: { id: 'conv1' }, inboundMessage: { id: 'in1' } }),
      };
      cbPrisma = {
        contact: { findUnique: jest.fn().mockResolvedValue({ id: 'c1', phoneE164: '+60198765432' }) },
      };
```

and in the `providers: [...]` array add:

```typescript
          { provide: ConversationService, useValue: cbConversations },
          { provide: PrismaService, useValue: cbPrisma },
```

(d) Add these tests inside the same describe:

```typescript
    it('persists the inbound at receipt (idempotent) BEFORE enqueuing — restores quote ordering', async () => {
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));
      await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(cbPrisma.contact.findUnique).toHaveBeenCalledWith({ where: { phoneE164: '+60198765432' } });
      expect(cbConversations.handleInbound).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 'c1', metaMessageId: 'wamid.cb1', body: 'hello' }),
      );
      // and it still enqueues the pipeline (unchanged payload)
      expect(cbChatbotQueue.add).toHaveBeenCalledWith(
        CHATBOT_INBOUND_QUEUE,
        expect.objectContaining({ message: expect.objectContaining({ id: 'wamid.cb1' }) }),
        expect.objectContaining({ jobId: 'wamid.cb1' }),
      );
    });

    it('skips a non-text message — no persist, no enqueue', async () => {
      const body = inboundBody();
      (body.entry[0].changes[0].value as any).messages[0] = {
        from: '60198765432', id: 'wamid.img', timestamp: '1234567890', type: 'image',
      };
      const raw = Buffer.from(JSON.stringify(body));
      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbConversations.handleInbound).not.toHaveBeenCalled();
      expect(cbChatbotQueue.add).not.toHaveBeenCalled();
    });

    it('skips an unknown contact — no persist, no enqueue', async () => {
      cbPrisma.contact.findUnique.mockResolvedValueOnce(null);
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));
      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbConversations.handleInbound).not.toHaveBeenCalled();
      expect(cbChatbotQueue.add).not.toHaveBeenCalled();
    });

    it('swallows a persist failure — webhook still returns received:true, no enqueue', async () => {
      cbConversations.handleInbound.mockRejectedValueOnce(new Error('db down'));
      const body = inboundBody();
      const raw = Buffer.from(JSON.stringify(body));
      const result = await cbController.receive(sign(raw.toString('utf8')), body as any, { rawBody: raw } as any);

      expect(result).toEqual({ received: true });
      expect(cbChatbotQueue.add).not.toHaveBeenCalled();
    });
```

- [ ] **Step 2: Run the chatbot-bridge tests to verify they fail**

Run: `cd apps/api && npx jest src/whatsapp/__tests__/webhook.controller.spec.ts -t "chatbot bridge"`
Expected: FAIL — the controller doesn't yet resolve a contact or call `conversations.handleInbound` (and its constructor has no such deps), so the persist/skip assertions fail.

- [ ] **Step 3: Implement the controller change**

In `webhook.controller.ts`:

(a) Add imports (with the others):

```typescript
import { PrismaService } from '../prisma/prisma.service';
import { ConversationService } from '../chatbot/conversations/conversation.service';
```

(b) Add two constructor params (after `chatbotInboundQueue`):

```typescript
    @InjectQueue(CHATBOT_INBOUND_QUEUE)
    private readonly chatbotInboundQueue: Queue<ChatbotInboundJobPayload>,
    private readonly prisma: PrismaService,
    private readonly conversations: ConversationService,
  ) {}
```

(c) Replace the entire chatbot block (the `const chatbotEnabled = ...` `if` block, currently the `for (const msg of value.messages)` that only enqueues) with:

```typescript
          // RAG chatbot (feature-flagged, default off). Independent of the autopilot path above.
          // PERSIST-AT-RECEIPT then FAST-ACK: do the fast synchronous DB work (resolve contact +
          // idempotently record the inbound, so its createdAt reflects arrival order — the worker's
          // reply-quote check, hasActivityAfterInbound by createdAt, needs sibling rows to exist when
          // an earlier message is answered), THEN enqueue the slow classify→RAG→draft→send pipeline
          // and return immediately. The persist is a single indexed insert (no LLM), so the ack stays
          // fast. jobId=wamid + the idempotent handleInbound + the receivedAt staleness guard keep
          // redeliveries safe.
          const chatbotEnabled = this.config.get<string>('CHATBOT_ENABLED', 'false') === 'true';
          if (chatbotEnabled && value.messages?.length) {
            for (const msg of value.messages) {
              try {
                if (msg.type !== 'text' || !msg.text?.body) {
                  this.logger.log(`chatbot ignored_non_text type=${msg.type} wamid=${msg.id}`);
                  continue;
                }
                const phoneE164 = '+' + msg.from;
                const contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
                if (!contact) {
                  this.logger.warn(`chatbot unknown_contact phone=${phoneE164} wamid=${msg.id} — skipping`);
                  continue;
                }
                await this.conversations.handleInbound({
                  contactId: contact.id,
                  metaMessageId: msg.id,
                  body: msg.text.body,
                  receivedAt: new Date(parseInt(msg.timestamp, 10) * 1000),
                  rawJson: { contacts: value.contacts ?? [], message: msg },
                });
                await this.chatbotInboundQueue.add(
                  CHATBOT_INBOUND_QUEUE,
                  { contacts: value.contacts ?? [], message: msg },
                  {
                    jobId: msg.id,
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 5000 },
                    removeOnComplete: { age: 3600, count: 1000 },
                    removeOnFail: { age: 86400, count: 5000 },
                  },
                );
              } catch (err) {
                // Persist OR enqueue failure must never fail the webhook (fast-ack contract). Meta
                // redelivers; the idempotent persist + staleness guard keep the retry safe.
                this.logger.error(`Chatbot persist/enqueue failed for wamid=${msg.id}: ${(err as Error).message}`);
              }
            }
          }
```

- [ ] **Step 4: Wire the module**

In `whatsapp.module.ts`, add the import:

```typescript
import { ConversationsModule } from '../chatbot/conversations/conversations.module';
```

and add `ConversationsModule` to the `imports` array (e.g. after the `BullModule.registerQueue(...)` line):

```typescript
    BullModule.registerQueue({ name: CHATBOT_INBOUND_QUEUE }),
    // ConversationService persists the chatbot inbound at receipt (in the controller) so reply-quote
    // ordering works; PrismaService (for the contact lookup) is @Global.
    ConversationsModule,
```

- [ ] **Step 5: Run the webhook tests + type-check + boot-resolve check**

Run: `cd apps/api && npx jest src/whatsapp/__tests__/webhook.controller.spec.ts && npx tsc --noEmit -p tsconfig.json`
Expected: PASS — all chatbot-bridge tests (incl. the new persist/skip ones) and the pre-existing webhook tests; tsc clean. (tsc + the existing app/module specs confirm the new `ConversationsModule` import resolves in the DI graph without a cycle.)

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/whatsapp/webhook.controller.ts apps/api/src/whatsapp/whatsapp.module.ts apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts
git commit -m "fix(chatbot): persist inbound at webhook receipt so reply-quoting works again

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Full-suite regression check, eval sanity, push, memory

**Files:** none (verification + memory).

- [ ] **Step 1: Full chatbot suite (worker/sim/processor unaffected)**

Run: `cd apps/api && npx jest src/chatbot src/whatsapp --runInBand`
Expected: PASS, all suites. Confirms the worker (`chatbot.service`), processor, and sim are unaffected — the worker's `conversations.handleInbound` now hits the idempotency guard (creates on the sim path where nothing persisted first; finds the row on the webhook path).

- [ ] **Step 2: Full API type-check**

Run: `cd apps/api && npx tsc --noEmit -p tsconfig.json`
Expected: exit 0.

- [ ] **Step 3: Eval sanity (sim answering path still works — needs Ollama tunnel up)**

Verify Ollama: `curl -s localhost:11434/api/tags | grep -o bge-m3` (expect `bge-m3`).
Run: `cd apps/api && WHATSAPP_MOCK_MODE=true CHATBOT_RERANK_ENABLED=true npx ts-node scripts/grade-bm-eval.ts`
Expected: same result as the reranker work (NCD-BM PASS, no new failures) — confirms the idempotency guard didn't disturb the sim/answering path. (If the tunnel is down, skip and note it; this step doesn't gate the fix, the unit/integration tests do.)

- [ ] **Step 4: Push**

Run: `cd /Users/modefair/whatsapp-blasting && git push origin feat/ai-chatbot`
Expected: branch pushed.

- [ ] **Step 5: Update memory**

Update `chatbot-stale-redelivery.md` (and/or `chatbot-fast-ack-webhook.md`): the conditional reply-quoting (`hasActivityAfterInbound`) was silently regressed by the fast-ack refactor (inbound persisted in the sequential worker → `createdAt` = processing time → quote never fired); fixed by persisting at webhook receipt + idempotent `handleInbound` (the worker re-derives the same row). Add an `MEMORY.md` index pointer if a new file is created.

- [ ] **Step 6: Live confirmation (post-deploy, user-driven)**

The full end-to-end quote (two-question burst → first reply quotes) only manifests through the real webhook→worker split across processes, so it's confirmed on the live Mac Studio build after deploy: fire two quick questions and confirm the answers quote. (In-repo, the regression is pinned by the Task-2 persist-at-receipt assertion + the Task-1 idempotency test + the pre-existing `hasActivityAfterInbound` unit test.)

---

## Self-Review

**Spec coverage:**
- Component 1 (idempotent `handleInbound`) → Task 1. ✓
- Component 2 (webhook persists at receipt; resolve contact + skip non-text/unknown; `WhatsappModule` imports `ConversationsModule`; narrow dep, no LLM) → Task 2. ✓
- Component 3 (worker/payload/processor unchanged; sim self-persists) → verified in Task 3 Step 1; no code change by design. ✓
- Error handling/idempotency (jobId + idempotent handleInbound + staleness guard; webhook never fails) → Task 2 Step 3 catch + Task 1. ✓
- Testing (regression = persist-at-receipt assertion; idempotency test; non-text/unknown skips; full suite; eval sanity; live confirm) → Tasks 1–3. ✓

**Placeholder scan:** No TBD/TODO; every code/test step shows the actual code; commands have expected output. ✓

**Type consistency:** `ConversationService.handleInbound(input: HandleInboundInput): Promise<{ conversation: Conversation; inboundMessage: ConversationInboundMessage }>` — the idempotency guard returns that exact shape (destructured from `findUnique({ include: { conversation: true } })`). Webhook calls it with `{ contactId, metaMessageId, body, receivedAt, rawJson }` (all fields of `HandleInboundInput`). Queue payload (`{ contacts, message }`) and `jobId` options are unchanged from the current controller. ✓
