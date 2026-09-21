# Inbox ↔ AI-Chatbot Bridge — Phase 1b (Operator write-back) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the dashboard's operator actions drive the chatbot conversation: composer send → chatbot `manualReply` (chatbot Meta client only), ticket assign → chatbot take-over, ticket resolve/close → close the linked chatbot conversation — all mirrored so the existing UI stays consistent.

**Architecture:** Extends Phase 1's `ChatbotInboxBridge` with `mirrorOperatorReply`. Repoints the blast `InboxService.sendReply` (the `/inbox` composer endpoint) onto the chatbot (`ConversationService` + `ChatbotWhatsappService` + bridge mirror), dropping the blasting client entirely. `TicketsService.assign` also sets `Conversation.assignedToId` (take-over → human-handling guard stands the bot down); `TicketsService.resolve`/`close` best-effort-close the linked conversation (disposition `SKIP`). All chatbot-side calls when a `Ticket.conversationId` / open conversation exists; legacy behavior is otherwise preserved.

**Tech Stack:** NestJS, Prisma (PostgreSQL + pgvector), Jest integration tests against the live dev DB.

**Scope note:** Phase 1b of `docs/superpowers/specs/2026-06-19-inbox-chatbot-integration-design.md` (§3.5, §3.7). KB-capture-on-resolve with operator-chosen disposition (IMPORT_LIVE/SAVE_DRAFT via `SaveToKnowledgeModal`) is **Phase 2** (frontend). Phase 1b uses `SKIP` for the implicit close. HARD CONSTRAINT: never import/modify the blasting `WhatsappCloudApiService`.

---

## File Structure
- **Modify** `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.ts` (+ spec) — add `mirrorOperatorReply`.
- **Modify** `apps/api/src/inbox/inbox.service.ts` — repoint `sendReply` to the chatbot; drop the blasting client.
- **Modify** `apps/api/src/inbox/inbox.controller.ts` — thread `req.user.id` into `send`.
- **Modify** `apps/api/src/inbox/inbox.module.ts` — swap `WhatsappModule` for the chatbot modules.
- **Modify** `apps/api/src/inbox/__tests__/inbox.service.spec.ts` — update `sendReply` tests for the new collaborators.
- **Modify** `apps/api/src/tickets/tickets.service.ts` (+ the integration spec) — `assign` take-over; `resolve`/`close` best-effort chatbot close.
- **Modify** `apps/api/src/tickets/tickets.controller.ts` — thread `req.user.id` into `resolve`/`close`.

---

## Task 1: `ChatbotInboxBridge.mirrorOperatorReply`

**Files:** Modify `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.ts`; Test `apps/api/src/chatbot/bridge/chatbot-inbox-bridge.service.spec.ts`.

- [ ] **Step 1: Add the failing test** (in the existing spec, new describe):
```typescript
describe('ChatbotInboxBridge.mirrorOperatorReply', () => {
  it('mirrors an operator reply into a Message with source INBOX', async () => {
    const contactId = await makeContact();
    await bridge.mirrorOperatorReply({ contactId, body: 'Operator here — sorted!', metaMessageId: `wamid-${randomUUID()}` });
    const message = await prisma.message.findFirst({ where: { contactId, source: 'INBOX', body: 'Operator here — sorted!' } });
    expect(message).not.toBeNull();
    expect(message!.status).toBe('SENT');
  });

  it('never throws on a DB error (best-effort)', async () => {
    await expect(bridge.mirrorOperatorReply({ contactId: randomUUID(), body: 'x' })).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter api exec jest chatbot-inbox-bridge -t mirrorOperatorReply` — FAIL (method missing).

- [ ] **Step 3: Implement** — add to `ChatbotInboxBridge`:
```typescript
  /** Mirror an operator reply (sent via the chatbot client) into the legacy Message table for the thread view. */
  async mirrorOperatorReply(input: { contactId: string; body: string; metaMessageId?: string }): Promise<void> {
    try {
      await this.prisma.message.create({
        data: {
          contactId: input.contactId,
          blastId: null,
          body: input.body,
          source: 'INBOX',
          status: 'SENT',
          metaMessageId: input.metaMessageId ?? null,
          sentAt: new Date(),
        },
      });
    } catch (err) {
      this.logger.error(`bridge mirrorOperatorReply failed contactId=${input.contactId}: ${(err as Error).message}`);
    }
  }
```

- [ ] **Step 4: Run to verify pass** — `pnpm --filter api exec jest chatbot-inbox-bridge` — PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(chatbot): bridge.mirrorOperatorReply — mirror operator replies into the legacy thread"` (after `git add`).

---

## Task 2: Repoint `/inbox` composer send to the chatbot

**Files:** Modify `apps/api/src/inbox/inbox.service.ts`, `inbox.controller.ts`, `inbox.module.ts`, `__tests__/inbox.service.spec.ts`.

- [ ] **Step 1: Update the failing test first.** In `apps/api/src/inbox/__tests__/inbox.service.spec.ts`, the `sendReply` tests currently construct `InboxService` with a mocked blasting `WhatsappCloudApiService`. Rewrite the construction + `sendReply` tests to the new collaborators. New construction (keep the other method tests as-is unless they break):
```typescript
import { ConversationService } from '../../chatbot/conversations/conversation.service';
import { ChatbotWhatsappService } from '../../chatbot/whatsapp/chatbot-whatsapp.service';
import { ChatbotInboxBridge } from '../../chatbot/bridge/chatbot-inbox-bridge.service';
// ...
const prisma = new PrismaClient() as unknown as PrismaService;
const queue = { add: jest.fn().mockResolvedValue(undefined) };
const conversations = new ConversationService(prisma, queue as never);
const chatbotWa = { sendTextMessage: jest.fn().mockResolvedValue({ metaMessageId: 'wamid.mock' }) };
const bridge = new ChatbotInboxBridge(prisma);
const svc = new InboxService(prisma, conversations, chatbotWa as never, bridge);
```
Add a `sendReply` test (integration; seed a contact + an OPEN chatbot conversation via `conversations.handleInbound({contactId, metaMessageId, body})`):
```typescript
it('sends via the chatbot client, records an OPERATOR_REPLY, mirrors a Message, and moves the conversation to REPLIED', async () => {
  const contactId = await makeContact();           // existing raw-SQL helper
  const { conversation } = await conversations.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'hi' });
  const userId = randomUUID();

  const res = await svc.sendReply(contactId, 'Here is your answer', userId);

  expect(chatbotWa.sendTextMessage).toHaveBeenCalled();
  const conv = await prisma.conversation.findUniqueOrThrow({ where: { id: conversation.id } });
  expect(conv.state).toBe('REPLIED');
  const out = await prisma.conversationOutboundMessage.findFirst({ where: { conversationId: conversation.id, kind: 'OPERATOR_REPLY' } });
  expect(out).not.toBeNull();
  const mirrored = await prisma.message.findFirst({ where: { contactId, source: 'INBOX', body: 'Here is your answer' } });
  expect(mirrored).not.toBeNull();
  expect(res.message.body).toBe('Here is your answer');
});

it('throws window_closed when the CS window has lapsed', async () => {
  const contactId = await makeContact();
  const { conversation } = await conversations.handleInbound({ contactId, metaMessageId: `wamid-${randomUUID()}`, body: 'hi' });
  await prisma.conversation.update({ where: { id: conversation.id }, data: { lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000) } });
  await expect(svc.sendReply(contactId, 'x', randomUUID())).rejects.toMatchObject({ response: { error: 'window_closed' } });
  expect(chatbotWa.sendTextMessage).not.toHaveBeenCalled();
});

it('throws when the contact has no open conversation', async () => {
  const contactId = await makeContact();
  await expect(svc.sendReply(contactId, 'x', randomUUID())).rejects.toMatchObject({ response: { error: 'no_active_conversation' } });
});
```
(Ensure the spec has a `makeContact` raw-SQL helper + scoped cleanup; mirror the existing one in this file. Add `conversation_outbound_messages`/`messages` cleanup by contactId in afterAll if not cascaded.)

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter api exec jest src/inbox/__tests__/inbox.service.spec.ts -t sendReply` — FAIL (constructor arity / behavior mismatch).

- [ ] **Step 3: Repoint `InboxService`.** In `apps/api/src/inbox/inbox.service.ts`:
  - Replace the `WhatsappCloudApiService` import/constructor param with: `ConversationService` (from `../chatbot/conversations/conversation.service`), `ChatbotWhatsappService` (from `../chatbot/whatsapp/chatbot-whatsapp.service`), `ChatbotInboxBridge` (from `../chatbot/bridge/chatbot-inbox-bridge.service`). Keep `PrismaService`.
  - Rewrite `sendReply(contactId, body, userId)`:
```typescript
  async sendReply(contactId: string, body: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { contactId, closedAt: null },
      orderBy: { createdAt: 'desc' },
      include: { contact: true },
    });
    if (!conversation) {
      throw new ConflictException({ error: 'no_active_conversation', message: 'No open conversation for this contact.' });
    }
    if (!(await this.conversations.getCsWindowOpen(conversation.id))) {
      const windowExpiresAt = conversation.lastInboundAt
        ? new Date(conversation.lastInboundAt.getTime() + WINDOW_MS) : null;
      throw new ConflictException({
        error: 'window_closed',
        message: '24h customer-service window has expired. Use a template via Campaigns to re-engage.',
        windowExpiredAt: windowExpiresAt?.toISOString() ?? null,
      });
    }
    let metaMessageId: string;
    try {
      ({ metaMessageId } = await this.whatsapp.sendTextMessage(conversation.contact.phoneE164, body));
    } catch (err) {
      if (err instanceof ChatbotWhatsappError) throw new BadGatewayException(err.message);
      throw err;
    }
    const out = await this.conversations.recordOperatorReply(conversation.id, body, userId, metaMessageId);
    await this.bridge.mirrorOperatorReply({ contactId, body, metaMessageId });
    return { message: { id: out.id, direction: 'outbound' as const, body, timestamp: out.sentAt ?? new Date(), status: 'SENT' as const, source: 'INBOX' as const } };
  }
```
  - Imports: add `ConflictException`, `BadGatewayException` from `@nestjs/common` (keep `NotFoundException`); add `ChatbotWhatsappError` from `../chatbot/whatsapp/chatbot-whatsapp.error`; rename the WhatsApp field to `whatsapp: ChatbotWhatsappService`. Keep `WINDOW_MS`.
  - The other methods (`listConversations`, `getConversation`, `markResolved`, `reopen`, `unreadCount`, `handleInbound`) are unchanged.

- [ ] **Step 4: Thread `userId` from the controller.** In `apps/api/src/inbox/inbox.controller.ts`, update `send` to read the user:
```typescript
import { Req } from '@nestjs/common';
import { Request } from 'express';
// ...
  @Post('conversations/:contactId/messages')
  send(@Param('contactId') contactId: string, @Body() dto: SendReplyDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.inbox.sendReply(contactId, dto.body, userId);
  }
```

- [ ] **Step 5: Rewire `InboxModule`.** In `apps/api/src/inbox/inbox.module.ts`, remove `forwardRef(() => WhatsappModule)` and import the chatbot modules instead:
```typescript
import { ConversationsModule } from '../chatbot/conversations/conversations.module';
import { ChatbotWhatsappModule } from '../chatbot/whatsapp/chatbot-whatsapp.module';
import { ChatbotModule } from '../chatbot/chatbot.module';
// imports: [ConversationsModule, ChatbotWhatsappModule, ChatbotModule, AuthModule]
```
(`ChatbotModule` exports `ChatbotInboxBridge` from Phase 1; `ConversationsModule` exports `ConversationService`; `ChatbotWhatsappModule` exports `ChatbotWhatsappService`.) Confirm nothing else in `InboxModule`'s consumers depended on it exporting the blasting client.

- [ ] **Step 6: Run tests + typecheck** — `pnpm --filter api exec jest src/inbox` then `cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json`. Both green. (Also run `pnpm --filter api exec jest inbox.controller` if a controller spec exists; update it to pass a `req` with `user.id` like the chatbot conversations controller spec.)

- [ ] **Step 7: Commit** — `git commit -m "feat(inbox): route operator composer send through the chatbot (manualReply + mirror), drop blasting client"`.

---

## Task 3: Ticket assign → chatbot take-over

**Files:** Modify `apps/api/src/tickets/tickets.service.ts`; Test in `apps/api/src/tickets/tickets.service.spec.ts` (the integration spec).

- [ ] **Step 1: Failing test** (integration; seed contact + chatbot conversation + ticket with conversationId):
```typescript
describe('TicketsService.assign take-over', () => {
  it('sets the linked conversation assignedToId when the ticket has a conversationId', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });
    const operator = randomUUID();
    await svc.assign(ticket.id, operator);
    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(after.assignedToId).toBe(operator);
  });
});
```

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter api exec jest tickets.service -t "take-over"` — FAIL (assignedToId not set).

- [ ] **Step 3: Implement.** In `apps/api/src/tickets/tickets.service.ts` `assign(id, assigneeId)`, after the existing `ticket = await this.prisma.ticket.update({...})`, add:
```typescript
    if (ticket.conversationId) {
      await this.prisma.conversation.update({
        where: { id: ticket.conversationId },
        data: { assignedToId: assigneeId },
      });
    }
```
(Uses the already-injected `prisma`; no new module import. `assignedToId` triggers the decision engine's human-handling guard so the bot stands down.)

- [ ] **Step 4: Run to verify pass** — `pnpm --filter api exec jest tickets.service` — PASS.

- [ ] **Step 5: Commit** — `git commit -am "feat(tickets): assign also takes over the linked chatbot conversation"`.

---

## Task 4: Ticket resolve/close → best-effort close the linked conversation

**Files:** Modify `apps/api/src/tickets/tickets.service.ts`, `tickets.controller.ts`; Test in the integration spec.

- [ ] **Step 1: Failing test** (integration; seed contact + ESCALATED conversation + ticket(conversationId), then an operator reply so close has a closeable state):
```typescript
describe('TicketsService.resolve closes the linked conversation', () => {
  it('best-effort closes the chatbot conversation (SKIP) when resolving a linked ticket', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });
    const userId = randomUUID();

    await svc.resolve(ticket.id, userId);

    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(after.state).toBe('RESOLVED');
    expect(after.closedAt).not.toBeNull();
  });

  it('still resolves the ticket even if the conversation is not closeable (best-effort)', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'NEW', lastInboundAt: new Date() } }); // not closeable
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });
    const result = await svc.resolve(ticket.id, randomUUID());
    expect(result.status).toBe('RESOLVED'); // ticket resolves regardless
  });
});
```
(Note: `ConversationService.close` with `SKIP` allows closing without an operator reply but requires a CLOSEABLE state — `REPLIED`/`ESCALATED`/`AWAITING_REPLY`. `ESCALATED` qualifies; `NEW` does not, exercising the best-effort path.)

- [ ] **Step 2: Run to verify it fails** — `pnpm --filter api exec jest tickets.service -t "closes the linked conversation"` — FAIL.

- [ ] **Step 3: Inject `ConversationService` into `TicketsService`.** Add constructor param `private readonly conversations: ConversationService` (import from `../chatbot/conversations/conversation.service`). In `apps/api/src/tickets/tickets.module.ts` add `ConversationsModule` (from `../chatbot/conversations/conversations.module`) to `imports`.

- [ ] **Step 4: Implement resolve/close.** Change `resolve(id)` → `resolve(id, userId: string)` and `close(id)` → `close(id, userId: string)`. After each method's existing ticket `update`, add a private helper call:
```typescript
  private async closeLinkedConversation(conversationId: string | null, userId: string): Promise<void> {
    if (!conversationId) return;
    try {
      await this.conversations.close({ conversationId, userId, disposition: 'SKIP' });
    } catch (err) {
      // Best-effort: the ticket is the operator's primary object; take-over already stood the bot down.
      // (e.g. conversation not in a closeable state) — log and move on.
    }
  }
```
Call `await this.closeLinkedConversation(ticket.conversationId, userId);` after the ticket update in both `resolve` and `close`. (Add a `Logger` to the service if not present, and log in the catch.)

- [ ] **Step 5: Thread `userId` in the controller.** In `apps/api/src/tickets/tickets.controller.ts`, update `resolve` and `close` to read `req.user.id` (mirror how `assign` reads it) and pass it through.

- [ ] **Step 6: Run tests + typecheck** — `pnpm --filter api exec jest tickets.service` + `cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json`. Both green. Update any tickets.controller spec to pass `req.user`.

- [ ] **Step 7: Commit** — `git commit -m "feat(tickets): resolve/close best-effort closes the linked chatbot conversation (SKIP)"`.

---

## Task 5: Regression + typecheck
- [ ] Run `pnpm --filter api exec jest src/inbox src/chatbot tickets.service webhook.controller 2>&1 | tail` — all green except the known environmental `retrieval.service` real-embeddings suite (needs live Ollama).
- [ ] `cd apps/api && pnpm exec tsc --noEmit -p tsconfig.build.json` — clean.
- [ ] `pnpm --filter api lint` — note if eslint is unavailable in this env (use tsc as the substitute gate).

## Self-review checklist (done while writing)
- **Spec coverage:** §3.5 composer→manualReply (T2), assign→take-over (T3), resolve/close→close (T4), operator-reply mirror (T1 + T2 use it). §3.7 KB-capture-on-close deferred to Phase 2 (uses SKIP here) — noted in scope banner.
- **Hard constraint:** the blasting `WhatsappCloudApiService` is removed from `InboxService` and never imported; sends go via `ChatbotWhatsappService`.
- **Placeholders:** none — full code shown for each production change; tests have concrete assertions.
- **Type consistency:** `mirrorOperatorReply` signature (T1) matches its T2 call; `resolve(id, userId)`/`close(id, userId)` signatures (T4) match the controller call sites; `sendReply(contactId, body, userId)` matches the controller (T2 Step 4).
- **Best-effort:** bridge mirror + linked-conversation close never break the operator action.
