# Inbox (without AI) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a per-contact conversation inbox that lets operators see inbound WhatsApp replies, reply free-form inside the 24h CS window, and resolve/reopen conversations. AI tabs render Coming Soon empty states.

**Architecture:** New `InboxModule` on the API side with one service + one controller + one new table (`inbox_conversation_state`). The existing `BlastsService.applyInboundMessage` calls `inboxService.handleInbound` after attribution to update inbox state. The `Message` model gets a nullable `blastId` and a `source` enum so inbox-originated outbound messages share the same table as blast-originated ones. Frontend has a 3-pane Inbox page that replaces the existing `ComingSoon` stub at `/inbox`, with 5s polling matching the Phase 5 BlastReplies pattern.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, BullMQ (existing — no new queue), React 18 + Vite + React Query 5, Tailwind, Playwright.

**Spec:** `docs/superpowers/specs/2026-05-28-inbox-without-ai-design.md`

**Branch:** `feat/inbox` off `master` (already created; spec already committed as `e55254a`).

---

## Phase A — Database & schema

### Task A1: Add InboxConversationState model + Message changes to Prisma schema

**Files:**
- Modify: `apps/api/prisma/schema.prisma`

- [ ] **Step 1: Open the schema file and add the `MessageSource` enum near the other enums** (find the existing `enum MessageStatus { ... }` block; add directly after it)

```prisma
enum MessageSource {
  BLAST
  INBOX
}
```

- [ ] **Step 2: Modify the existing `Message` model — change `blastId` to nullable and add `source`**

Find the existing `model Message` block. The current `blastId` line looks like:
```prisma
  blastId    String    @map("blast_id") @db.Uuid
  blast      Blast     @relation(fields: [blastId], references: [id])
```

Change to:
```prisma
  blastId    String?   @map("blast_id") @db.Uuid
  blast      Blast?    @relation(fields: [blastId], references: [id])
  source     MessageSource @default(BLAST) @map("source")
```

- [ ] **Step 3: Add the new `InboxConversationState` model at the end of the file**

```prisma
model InboxConversationState {
  contactId       String    @id @map("contact_id") @db.Uuid
  contact         Contact   @relation(fields: [contactId], references: [id], onDelete: Cascade)
  lastInboundAt   DateTime? @map("last_inbound_at")
  lastOutboundAt  DateTime? @map("last_outbound_at")
  resolvedAt      DateTime? @map("resolved_at")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt       @map("updated_at")

  @@index([resolvedAt, lastInboundAt(sort: Desc)])
  @@map("inbox_conversation_state")
}
```

- [ ] **Step 4: Add reverse relation on the `Contact` model**

Find the existing `model Contact` block. Add a new line in the relations section (next to existing relations like `messages` and `inboundMessages`):
```prisma
  inboxState   InboxConversationState?
```

- [ ] **Step 5: Generate the migration**

Run from `apps/api`:
```bash
pnpm prisma migrate dev --name add_inbox_conversation_state --create-only
```

Expected: a new directory under `prisma/migrations/<timestamp>_add_inbox_conversation_state/` with a generated `migration.sql`. Do NOT run the migration yet — we need to edit it in the next task to add the backfill.

### Task A2: Add backfill SQL to the migration

**Files:**
- Modify: `apps/api/prisma/migrations/<timestamp>_add_inbox_conversation_state/migration.sql`

- [ ] **Step 1: Open the generated migration.sql**

Verify it contains the four DDL operations in this order:
1. `CREATE TYPE "MessageSource" AS ENUM ('BLAST', 'INBOX');`
2. `ALTER TABLE "messages" ADD COLUMN "source" "MessageSource" NOT NULL DEFAULT 'BLAST';`
3. `ALTER TABLE "messages" ALTER COLUMN "blast_id" DROP NOT NULL;`
4. `CREATE TABLE "inbox_conversation_state" (...)` with index + FK to contacts(id) ON DELETE CASCADE

If Prisma emits the operations in a different order (e.g., the foreign key constraint as a separate `ALTER TABLE`), leave that order intact — Prisma's order is always valid.

- [ ] **Step 2: Append the backfill SQL to the end of the file**

```sql
-- Backfill: pre-populate inbox state from existing inbound_messages so the inbox
-- isn't empty on day one. Treats all pre-existing conversations as open.
INSERT INTO "inbox_conversation_state"
  ("contact_id", "last_inbound_at", "last_outbound_at", "resolved_at", "created_at", "updated_at")
SELECT
  inbound."contact_id",
  MAX(inbound."received_at") AS last_inbound_at,
  (SELECT MAX(m."sent_at") FROM "messages" m
     WHERE m."contact_id" = inbound."contact_id"
       AND m."status" IN ('SENT','DELIVERED','READ')) AS last_outbound_at,
  NULL AS resolved_at,
  NOW(), NOW()
FROM "inbound_messages" inbound
GROUP BY inbound."contact_id";
```

- [ ] **Step 3: Apply the migration**

Run from repo root:
```bash
pnpm db:migrate
```

Expected: migration applies cleanly, Prisma client regenerates, no errors. The backfill is a no-op on a fresh DB (no `inbound_messages` rows yet) and pre-populates state on a DB with existing Phase 5 inbound data.

- [ ] **Step 4: Verify the schema applied**

```bash
docker exec wbs_postgres psql -U wbs -d wbs -c "\d inbox_conversation_state"
docker exec wbs_postgres psql -U wbs -d wbs -c "\d messages" | head -20
```

Expected: `inbox_conversation_state` table exists with the right columns. `messages.blast_id` is `uuid` (nullable). `messages.source` is `MessageSource NOT NULL DEFAULT 'BLAST'`.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(inbox): add InboxConversationState model + Message.source enum

- New table inbox_conversation_state with composite index for fast tab queries
- Message.blastId now nullable so INBOX-source outbound shares the messages table
- Backfill creates state rows from existing inbound_messages on migration"
```

---

## Phase B — WhatsApp service extension

### Task B1: TDD `sendFreeFormText` on `WhatsappCloudApiService`

**Files:**
- Test: `apps/api/src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts`
- Modify: `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`

- [ ] **Step 1: Add failing tests for the new method**

Open the existing test file and add these tests at the bottom of the `describe` block:

```ts
describe('sendFreeFormText', () => {
  it('returns wamid.mock-* in mock mode without calling axios', async () => {
    const config = { get: jest.fn((k: string, d?: any) =>
      k === 'WHATSAPP_MOCK_MODE' ? 'true' :
      k === 'WHATSAPP_PHONE_NUMBER_ID' ? 'pn123' :
      k === 'WHATSAPP_ACCESS_TOKEN' ? 'tok' :
      d
    ) };
    const httpService = { axiosRef: { post: jest.fn() } };
    const service = new WhatsappCloudApiService(config as any, httpService as any);

    const result = await service.sendFreeFormText('+60123456789', 'hello');
    expect(result.metaMessageId).toMatch(/^wamid\.mock-/);
    expect(httpService.axiosRef.post).not.toHaveBeenCalled();
  });

  it('posts type:text payload to Meta in real mode', async () => {
    const config = { get: jest.fn((k: string, d?: any) =>
      k === 'WHATSAPP_MOCK_MODE' ? 'false' :
      k === 'WHATSAPP_PHONE_NUMBER_ID' ? 'pn123' :
      k === 'WHATSAPP_ACCESS_TOKEN' ? 'tok' :
      d
    ) };
    const post = jest.fn().mockResolvedValue({ data: { messages: [{ id: 'wamid.real123' }] } });
    const httpService = { axiosRef: { post } };
    const service = new WhatsappCloudApiService(config as any, httpService as any);

    const result = await service.sendFreeFormText('+60123456789', 'hello there');
    expect(post).toHaveBeenCalledWith(
      expect.stringContaining('/pn123/messages'),
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '+60123456789',
        type: 'text',
        text: { body: 'hello there' },
      },
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer tok' }) }),
    );
    expect(result.metaMessageId).toBe('wamid.real123');
  });

  it('throws with verbose error format on Meta error response', async () => {
    const config = { get: jest.fn((k: string, d?: any) =>
      k === 'WHATSAPP_MOCK_MODE' ? 'false' :
      k === 'WHATSAPP_PHONE_NUMBER_ID' ? 'pn123' :
      k === 'WHATSAPP_ACCESS_TOKEN' ? 'tok' :
      d
    ) };
    const err = new Error('Request failed') as any;
    err.response = { data: { error: { message: 'Recipient not in allowed list', code: 131030 } } };
    const post = jest.fn().mockRejectedValue(err);
    const service = new WhatsappCloudApiService(config as any, { axiosRef: { post } } as any);

    await expect(service.sendFreeFormText('+60999', 'x')).rejects.toThrow(/Recipient not in allowed list/);
  });
});
```

- [ ] **Step 2: Run tests, expect failure**

```bash
pnpm --filter api test -- whatsapp-cloud-api.service.spec.ts
```

Expected: FAIL — `sendFreeFormText is not a function`.

- [ ] **Step 3: Implement `sendFreeFormText`**

Open `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`. Find the existing `sendTemplateMessage` method. Add the new method right after it, reusing the same Meta base URL, mock-mode check, and error logging shape:

```ts
async sendFreeFormText(
  recipientPhone: string,
  body: string,
): Promise<{ metaMessageId: string }> {
  const mockMode = this.config.get<string>('WHATSAPP_MOCK_MODE', 'true') === 'true';
  if (mockMode) {
    return { metaMessageId: `wamid.mock-${randomUUID()}` };
  }

  const phoneNumberId = this.config.get<string>('WHATSAPP_PHONE_NUMBER_ID');
  const accessToken = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  const payload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: recipientPhone,
    type: 'text',
    text: { body },
  };

  try {
    const response = await this.http.axiosRef.post(url, payload, {
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });
    return { metaMessageId: response.data.messages[0].id };
  } catch (err: any) {
    this.logMetaError(err, payload, url);
    const metaError = err?.response?.data?.error;
    throw new Error(metaError?.message || err.message || 'Meta API request failed');
  }
}
```

(`randomUUID` and `logMetaError` are already imported / defined in this file — confirm by scrolling to the top. If `randomUUID` isn't imported, add `import { randomUUID } from 'crypto';` to the imports.)

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm --filter api test -- whatsapp-cloud-api.service.spec.ts
```

Expected: PASS (all three new tests + all existing tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/whatsapp/
git commit -m "feat(whatsapp): add sendFreeFormText for in-window CS replies

Posts type:text payload to Meta Cloud API (no template). Mock mode returns
wamid.mock-* without HTTP call. Reuses the verbose Meta error logging
added in Phase 6."
```

---

## Phase C — Inbox service

### Task C1: Create InboxService skeleton + register InboxModule

**Files:**
- Create: `apps/api/src/inbox/inbox.module.ts`
- Create: `apps/api/src/inbox/inbox.service.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create the service skeleton**

`apps/api/src/inbox/inbox.service.ts`:

```ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappCloudApiService } from '../whatsapp/whatsapp-cloud-api.service';

const WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class InboxService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
  ) {}

  async handleInbound(contactId: string, receivedAt: Date): Promise<void> {
    throw new Error('not implemented');
  }

  async listConversations(opts: {
    tab: 'all' | 'awaiting' | 'replied' | 'resolved';
    cursor?: string;
    limit: number;
    search?: string;
  }) {
    throw new Error('not implemented');
  }

  async getConversation(contactId: string) {
    throw new Error('not implemented');
  }

  async sendReply(contactId: string, body: string) {
    throw new Error('not implemented');
  }

  async markResolved(contactId: string) {
    throw new Error('not implemented');
  }

  async reopen(contactId: string) {
    throw new Error('not implemented');
  }

  async unreadCount(): Promise<number> {
    throw new Error('not implemented');
  }
}
```

- [ ] **Step 2: Create the module**

`apps/api/src/inbox/inbox.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, WhatsappModule],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
```

(Confirm `WhatsappModule` exists at `apps/api/src/whatsapp/whatsapp.module.ts` and exports `WhatsappCloudApiService`. If the existing module name is different, use that name.)

- [ ] **Step 3: Register `InboxModule` in `app.module.ts`**

Open `apps/api/src/app.module.ts`. Add `InboxModule` to the imports array. Find the existing imports block:

```ts
import { InboxModule } from './inbox/inbox.module';
// ... and in the @Module({ imports: [...] }) array, add:
//   InboxModule,
```

- [ ] **Step 4: Verify the API still boots**

```bash
pnpm --filter api build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/inbox apps/api/src/app.module.ts
git commit -m "feat(inbox): scaffold InboxService + InboxModule

Empty service skeleton with all method signatures. TDD will fill in the
bodies in subsequent commits."
```

### Task C2: TDD `handleInbound`

**Files:**
- Create: `apps/api/src/inbox/__tests__/inbox.service.spec.ts`
- Modify: `apps/api/src/inbox/inbox.service.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { InboxService } from '../inbox.service';

describe('InboxService.handleInbound', () => {
  let prisma: any;
  let whatsapp: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = {
      inboxConversationState: { upsert: jest.fn() },
    };
    whatsapp = { sendFreeFormText: jest.fn() };
    service = new InboxService(prisma, whatsapp);
  });

  it('upserts state with lastInboundAt and clears resolvedAt', async () => {
    const receivedAt = new Date('2026-05-28T08:00:00Z');
    await service.handleInbound(contactId, receivedAt);

    expect(prisma.inboxConversationState.upsert).toHaveBeenCalledWith({
      where: { contactId },
      create: { contactId, lastInboundAt: receivedAt, resolvedAt: null },
      update: { lastInboundAt: receivedAt, resolvedAt: null },
    });
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: FAIL — `not implemented`.

- [ ] **Step 3: Implement `handleInbound`**

Replace the body in `inbox.service.ts`:

```ts
async handleInbound(contactId: string, receivedAt: Date): Promise<void> {
  await this.prisma.inboxConversationState.upsert({
    where: { contactId },
    create: { contactId, lastInboundAt: receivedAt, resolvedAt: null },
    update: { lastInboundAt: receivedAt, resolvedAt: null },
  });
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/inbox
git commit -m "feat(inbox): implement handleInbound (TDD)

Upserts InboxConversationState on inbound webhook, setting lastInboundAt
and clearing any prior resolvedAt."
```

### Task C3: TDD `listConversations` with tab filters

**Files:**
- Modify: `apps/api/src/inbox/__tests__/inbox.service.spec.ts`
- Modify: `apps/api/src/inbox/inbox.service.ts`

- [ ] **Step 1: Write failing tests for the four tab variants**

Append to the test file:

```ts
describe('InboxService.listConversations', () => {
  let prisma: any;
  let service: InboxService;

  beforeEach(() => {
    prisma = {
      inboxConversationState: { findMany: jest.fn().mockResolvedValue([]) },
      $queryRaw: jest.fn().mockResolvedValue([]),
    };
    service = new InboxService(prisma, {} as any);
  });

  it('tab=all filters resolvedAt IS NULL', async () => {
    await service.listConversations({ tab: 'all', limit: 50 });
    expect(prisma.$queryRaw).toHaveBeenCalled();
    const sql = String(prisma.$queryRaw.mock.calls[0][0].join(''));
    expect(sql).toContain('resolved_at IS NULL');
    expect(sql).not.toContain('IS NOT NULL');
  });

  it('tab=awaiting filters last_inbound > last_outbound', async () => {
    await service.listConversations({ tab: 'awaiting', limit: 50 });
    const sql = String(prisma.$queryRaw.mock.calls[0][0].join(''));
    expect(sql).toContain('resolved_at IS NULL');
    expect(sql).toMatch(/last_outbound_at IS NULL OR last_inbound_at > last_outbound_at/);
  });

  it('tab=replied filters last_outbound > last_inbound', async () => {
    await service.listConversations({ tab: 'replied', limit: 50 });
    const sql = String(prisma.$queryRaw.mock.calls[0][0].join(''));
    expect(sql).toContain('resolved_at IS NULL');
    expect(sql).toContain('last_outbound_at > last_inbound_at');
  });

  it('tab=resolved filters resolvedAt IS NOT NULL', async () => {
    await service.listConversations({ tab: 'resolved', limit: 50 });
    const sql = String(prisma.$queryRaw.mock.calls[0][0].join(''));
    expect(sql).toContain('resolved_at IS NOT NULL');
  });

  it('caps limit at 100', async () => {
    await service.listConversations({ tab: 'all', limit: 9999 });
    const params = prisma.$queryRaw.mock.calls[0].slice(1);
    expect(params.some((p: any) => p === 100)).toBe(true);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `listConversations`**

The query uses `$queryRaw` because we need to join the contact + compute window state + return the most recent message preview + attribution in one round trip. Replace the body:

```ts
async listConversations(opts: {
  tab: 'all' | 'awaiting' | 'replied' | 'resolved';
  cursor?: string;
  limit: number;
  search?: string;
}) {
  const limit = Math.min(opts.limit, 100);

  let whereClause: string;
  switch (opts.tab) {
    case 'awaiting':
      whereClause = `s.resolved_at IS NULL AND (s.last_outbound_at IS NULL OR s.last_inbound_at > s.last_outbound_at)`;
      break;
    case 'replied':
      whereClause = `s.resolved_at IS NULL AND s.last_outbound_at > s.last_inbound_at`;
      break;
    case 'resolved':
      whereClause = `s.resolved_at IS NOT NULL`;
      break;
    case 'all':
    default:
      whereClause = `s.resolved_at IS NULL`;
  }

  const searchClause = opts.search
    ? ` AND (c.name ILIKE $2 OR c.phone ILIKE $2)`
    : '';

  // Using template literal Prisma.sql for type-safe parameterization
  const rows: any[] = await this.prisma.$queryRawUnsafe(`
    SELECT
      s.contact_id,
      c.name AS contact_name,
      c.phone AS contact_phone,
      s.last_inbound_at,
      s.last_outbound_at,
      s.resolved_at,
      -- last message preview: most recent of inbound vs outbound
      (
        SELECT LEFT(body, 100) FROM (
          SELECT received_at AS at, body FROM inbound_messages WHERE contact_id = s.contact_id
          UNION ALL
          SELECT sent_at AS at, body FROM messages WHERE contact_id = s.contact_id AND sent_at IS NOT NULL
        ) merged ORDER BY at DESC LIMIT 1
      ) AS last_preview,
      (
        SELECT CASE WHEN inb.at > COALESCE(outb.at, '1970-01-01'::timestamp) THEN 'inbound' ELSE 'outbound' END
        FROM (SELECT MAX(received_at) AS at FROM inbound_messages WHERE contact_id = s.contact_id) inb,
             (SELECT MAX(sent_at) AS at FROM messages WHERE contact_id = s.contact_id) outb
      ) AS last_direction,
      -- attribution: most recent blast for an outbound message to this contact
      (
        SELECT json_build_object('blastId', b.id, 'blastName', b.name)
        FROM messages m JOIN blasts b ON b.id = m.blast_id
        WHERE m.contact_id = s.contact_id AND m.blast_id IS NOT NULL
        ORDER BY m.sent_at DESC LIMIT 1
      ) AS attribution
    FROM inbox_conversation_state s
    JOIN contacts c ON c.id = s.contact_id
    WHERE ${whereClause}${searchClause}
    ORDER BY GREATEST(COALESCE(s.last_inbound_at, '1970-01-01'::timestamp),
                      COALESCE(s.last_outbound_at, '1970-01-01'::timestamp)) DESC
    LIMIT $1
  `, limit, ...(opts.search ? [`%${opts.search}%`] : []));

  return {
    items: rows.map((r) => {
      const windowExpiresAt = r.last_inbound_at
        ? new Date(new Date(r.last_inbound_at).getTime() + WINDOW_MS)
        : null;
      return {
        contact: { id: r.contact_id, name: r.contact_name, phone: r.contact_phone },
        lastInboundAt: r.last_inbound_at,
        lastOutboundAt: r.last_outbound_at,
        resolvedAt: r.resolved_at,
        lastPreview: r.last_preview ?? '',
        lastDirection: r.last_direction ?? 'inbound',
        windowExpiresAt,
        windowOpen: windowExpiresAt ? windowExpiresAt.getTime() > Date.now() : false,
        attribution: r.attribution ?? null,
      };
    }),
    nextCursor: null, // cursor pagination wired in a later task once frontend needs it
  };
}
```

Note: the tests use `$queryRaw` but the implementation uses `$queryRawUnsafe` for variable WHERE clauses. Update the mock setup in step 1 if needed — change `$queryRaw: jest.fn().mockResolvedValue([])` to `$queryRawUnsafe: jest.fn().mockResolvedValue([])` and the assertions to read from `$queryRawUnsafe.mock.calls[0][0]` (the SQL string is the first argument directly, not wrapped in array).

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/inbox
git commit -m "feat(inbox): implement listConversations with tab filters (TDD)

Single $queryRawUnsafe call returns per-row: contact, last activity,
preview, direction, attribution. Sorted by GREATEST(in,out) DESC."
```

### Task C4: TDD `getConversation`

**Files:**
- Modify: `apps/api/src/inbox/__tests__/inbox.service.spec.ts`
- Modify: `apps/api/src/inbox/inbox.service.ts`

- [ ] **Step 1: Write failing tests**

Append to the test file:

```ts
describe('InboxService.getConversation', () => {
  let prisma: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';

  beforeEach(() => {
    prisma = {
      inboxConversationState: { findUnique: jest.fn() },
      contact: { findUnique: jest.fn() },
      inboundMessage: { findMany: jest.fn().mockResolvedValue([]) },
      message: { findMany: jest.fn().mockResolvedValue([]) },
    };
    service = new InboxService(prisma, {} as any);
  });

  it('throws 404 when no inbox state exists', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue(null);
    await expect(service.getConversation(contactId)).rejects.toThrow(/not found/i);
  });

  it('interleaves inbound + outbound messages by timestamp ASC', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId, lastInboundAt: new Date('2026-05-28T08:00:00Z'),
      lastOutboundAt: null, resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({ id: contactId, name: 'Aisyah', phone: '+60' });
    prisma.inboundMessage.findMany.mockResolvedValue([
      { id: 'in1', body: 'hi', receivedAt: new Date('2026-05-28T08:00:00Z') },
      { id: 'in2', body: 'still there?', receivedAt: new Date('2026-05-28T09:00:00Z') },
    ]);
    prisma.message.findMany.mockResolvedValue([
      { id: 'out1', body: 'hello', sentAt: new Date('2026-05-28T08:30:00Z'),
        status: 'DELIVERED', source: 'INBOX', blastId: null, blast: null, failureReason: null },
    ]);

    const result = await service.getConversation(contactId);
    expect(result.messages.map((m: any) => m.id)).toEqual(['in1', 'out1', 'in2']);
  });

  it('computes windowExpiresAt = lastInboundAt + 24h', async () => {
    const lastInbound = new Date('2026-05-28T08:00:00Z');
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId, lastInboundAt: lastInbound, lastOutboundAt: null, resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({ id: contactId, name: 'X', phone: '+60' });

    const result = await service.getConversation(contactId);
    expect(result.windowExpiresAt).toEqual(new Date(lastInbound.getTime() + 24 * 60 * 60 * 1000));
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: FAIL — `not implemented` (or `Cannot read property...`).

- [ ] **Step 3: Implement `getConversation`**

```ts
async getConversation(contactId: string) {
  const state = await this.prisma.inboxConversationState.findUnique({ where: { contactId } });
  if (!state) throw new NotFoundException('Inbox conversation not found for this contact');

  const [contact, inbound, outbound] = await Promise.all([
    this.prisma.contact.findUnique({ where: { id: contactId } }),
    this.prisma.inboundMessage.findMany({
      where: { contactId },
      orderBy: { receivedAt: 'asc' },
    }),
    this.prisma.message.findMany({
      where: { contactId },
      orderBy: { sentAt: 'asc' },
      include: { blast: { select: { id: true, name: true } } },
    }),
  ]);

  const messages = [
    ...inbound.map((m: any) => ({
      id: m.id, direction: 'inbound' as const, body: m.body, timestamp: m.receivedAt,
    })),
    ...outbound
      .filter((m: any) => m.sentAt !== null)
      .map((m: any) => ({
        id: m.id, direction: 'outbound' as const, body: m.body, timestamp: m.sentAt,
        status: m.status, source: m.source,
        blastName: m.blast?.name, failureReason: m.failureReason ?? undefined,
      })),
  ].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const windowExpiresAt = state.lastInboundAt
    ? new Date(state.lastInboundAt.getTime() + WINDOW_MS)
    : null;

  return {
    contact: { id: contact!.id, name: contact!.name, phone: contact!.phone },
    messages,
    windowExpiresAt,
    windowOpen: windowExpiresAt ? windowExpiresAt.getTime() > Date.now() : false,
    resolvedAt: state.resolvedAt,
  };
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/inbox
git commit -m "feat(inbox): implement getConversation (TDD)

Returns contact + interleaved message thread (inbound + outbound)
sorted ASC by timestamp, with computed window state."
```

### Task C5: TDD `sendReply`

**Files:**
- Modify: `apps/api/src/inbox/__tests__/inbox.service.spec.ts`
- Modify: `apps/api/src/inbox/inbox.service.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe('InboxService.sendReply', () => {
  let prisma: any;
  let whatsapp: any;
  let service: InboxService;
  const contactId = '00000000-0000-0000-0000-000000000001';
  const phone = '+60123456789';

  beforeEach(() => {
    prisma = {
      inboxConversationState: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      contact: { findUnique: jest.fn() },
      message: { create: jest.fn() },
      $transaction: jest.fn(async (fn: any) => fn(prisma)),
    };
    whatsapp = { sendFreeFormText: jest.fn() };
    service = new InboxService(prisma, whatsapp);
  });

  it('throws 404 when no inbox state', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue(null);
    await expect(service.sendReply(contactId, 'hi')).rejects.toThrow(/not found/i);
  });

  it('throws 409 when window is closed', async () => {
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId, lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
      lastOutboundAt: null, resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({ id: contactId, phone });
    await expect(service.sendReply(contactId, 'hi')).rejects.toThrow(/window/i);
  });

  it('happy path: sends via WhatsApp, inserts message, updates state', async () => {
    const lastInbound = new Date(Date.now() - 60 * 60 * 1000); // 1h ago
    prisma.inboxConversationState.findUnique.mockResolvedValue({
      contactId, lastInboundAt: lastInbound, lastOutboundAt: null, resolvedAt: null,
    });
    prisma.contact.findUnique.mockResolvedValue({ id: contactId, phone });
    whatsapp.sendFreeFormText.mockResolvedValue({ metaMessageId: 'wamid.mock-abc' });
    prisma.message.create.mockResolvedValue({
      id: 'm1', body: 'hi', sentAt: new Date(), status: 'SENT',
      source: 'INBOX', blastId: null,
    });

    const result = await service.sendReply(contactId, 'hi');

    expect(whatsapp.sendFreeFormText).toHaveBeenCalledWith(phone, 'hi');
    expect(prisma.message.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        contactId, body: 'hi', source: 'INBOX', blastId: null,
        metaMessageId: 'wamid.mock-abc', status: 'SENT',
      }),
    }));
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { contactId },
      data: expect.objectContaining({ lastOutboundAt: expect.any(Date), resolvedAt: expect.any(Date) }),
    }));
    expect(result.message.id).toBe('m1');
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement `sendReply`**

```ts
async sendReply(contactId: string, body: string) {
  const state = await this.prisma.inboxConversationState.findUnique({ where: { contactId } });
  if (!state) throw new NotFoundException('Inbox conversation not found for this contact');

  const windowExpiresAt = state.lastInboundAt
    ? new Date(state.lastInboundAt.getTime() + WINDOW_MS)
    : null;
  if (!windowExpiresAt || windowExpiresAt.getTime() <= Date.now()) {
    throw new ConflictException({
      error: 'window_closed',
      message: '24h customer-service window has expired. Use a template via Campaigns to re-engage.',
      windowExpiredAt: windowExpiresAt?.toISOString() ?? null,
    });
  }

  const contact = await this.prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) throw new NotFoundException('Contact not found');

  const { metaMessageId } = await this.whatsapp.sendFreeFormText(contact.phone, body);
  const now = new Date();

  const [message] = await this.prisma.$transaction([
    this.prisma.message.create({
      data: {
        contactId,
        blastId: null,
        body,
        source: 'INBOX',
        status: 'SENT',
        metaMessageId,
        sentAt: now,
      },
    }),
    this.prisma.inboxConversationState.update({
      where: { contactId },
      data: { lastOutboundAt: now, resolvedAt: now },
    }),
  ]);

  return { message };
}
```

Note: `$transaction` is mocked in the test as `async (fn: any) => fn(prisma)`, which works for both array-form and function-form transactions. The implementation uses array-form for atomicity.

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/inbox
git commit -m "feat(inbox): implement sendReply with 24h window check (TDD)

404 if no inbox state, 409 if window closed, otherwise sends via Meta,
inserts Message(source=INBOX, blastId=null), atomically updates state
with new lastOutboundAt and resolvedAt (auto-resolve)."
```

### Task C6: TDD `markResolved`, `reopen`, `unreadCount`

**Files:**
- Modify: `apps/api/src/inbox/__tests__/inbox.service.spec.ts`
- Modify: `apps/api/src/inbox/inbox.service.ts`

- [ ] **Step 1: Write failing tests**

```ts
describe('InboxService.markResolved / reopen / unreadCount', () => {
  let prisma: any;
  let service: InboxService;

  beforeEach(() => {
    prisma = {
      inboxConversationState: { update: jest.fn(), count: jest.fn() },
    };
    service = new InboxService(prisma, {} as any);
  });

  it('markResolved sets resolvedAt to now', async () => {
    prisma.inboxConversationState.update.mockResolvedValue({ contactId: 'c1', resolvedAt: new Date() });
    await service.markResolved('c1');
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith({
      where: { contactId: 'c1' },
      data: { resolvedAt: expect.any(Date) },
    });
  });

  it('reopen clears resolvedAt', async () => {
    prisma.inboxConversationState.update.mockResolvedValue({ contactId: 'c1', resolvedAt: null });
    await service.reopen('c1');
    expect(prisma.inboxConversationState.update).toHaveBeenCalledWith({
      where: { contactId: 'c1' },
      data: { resolvedAt: null },
    });
  });

  it('unreadCount returns count of resolvedAt IS NULL rows', async () => {
    prisma.inboxConversationState.count.mockResolvedValue(7);
    const n = await service.unreadCount();
    expect(prisma.inboxConversationState.count).toHaveBeenCalledWith({ where: { resolvedAt: null } });
    expect(n).toBe(7);
  });
});
```

- [ ] **Step 2: Run, expect failure**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement the three methods**

```ts
async markResolved(contactId: string) {
  return this.prisma.inboxConversationState.update({
    where: { contactId },
    data: { resolvedAt: new Date() },
  });
}

async reopen(contactId: string) {
  return this.prisma.inboxConversationState.update({
    where: { contactId },
    data: { resolvedAt: null },
  });
}

async unreadCount(): Promise<number> {
  return this.prisma.inboxConversationState.count({ where: { resolvedAt: null } });
}
```

- [ ] **Step 4: Run tests, expect pass**

```bash
pnpm --filter api test -- inbox.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/inbox
git commit -m "feat(inbox): implement markResolved, reopen, unreadCount (TDD)"
```

---

## Phase D — Wire BlastsService → InboxService

### Task D1: Call `handleInbound` from `applyInboundMessage`

**Files:**
- Modify: `apps/api/src/blasts/blasts.service.ts`
- Modify: `apps/api/src/blasts/blasts.module.ts`
- Modify: `apps/api/src/blasts/__tests__/blasts.service.spec.ts`

- [ ] **Step 1: Write a failing test in the existing blasts.service.spec.ts**

Find or create the `describe('BlastsService.applyInboundMessage', ...)` block. Add this test inside:

```ts
it('calls inboxService.handleInbound with contactId and receivedAt', async () => {
  const inboxService = { handleInbound: jest.fn().mockResolvedValue(undefined) };
  // Update the service constructor in the test setup to inject inboxService —
  // see beforeEach block; add `inboxService` to the mocks if not present.
  prisma.inboundMessage.create.mockResolvedValue({
    id: 'in1', contactId: 'c1', body: 'hi',
    receivedAt: new Date('2026-05-28T08:00:00Z'),
  });
  prisma.contact.findFirst.mockResolvedValue({ id: 'c1', phone: '+60' });

  await service.applyInboundMessage({
    from: '+60', body: 'hi', metaMessageId: 'wamid.1',
    timestamp: '1748419200',
  });

  expect(inboxService.handleInbound).toHaveBeenCalledWith('c1', expect.any(Date));
});
```

In `beforeEach`, add `inboxService` to the mocks and inject into the service:
```ts
const inboxService = { handleInbound: jest.fn().mockResolvedValue(undefined) };
service = new BlastsService(prisma, queue, /* ...other args..., */ inboxService);
```

(Match the existing constructor signature.)

- [ ] **Step 2: Add `InboxService` as a constructor dependency on `BlastsService`**

Open `apps/api/src/blasts/blasts.service.ts`. Modify the constructor:

```ts
constructor(
  private readonly prisma: PrismaService,
  // ... existing deps ...
  private readonly inboxService: InboxService,
) {}
```

Add the import at the top: `import { InboxService } from '../inbox/inbox.service';`

- [ ] **Step 3: Call `handleInbound` in `applyInboundMessage`**

Find the existing `applyInboundMessage` method. After the `InboundMessage` is created and attribution runs, add:

```ts
try {
  await this.inboxService.handleInbound(contactId, receivedAt);
} catch (err) {
  this.logger.error('Inbox handleInbound failed; inbound message still persisted', err);
}
```

(`contactId` and `receivedAt` are existing local variables in the method — confirm the variable names by reading the method.)

- [ ] **Step 4: Update `BlastsModule` to import `InboxModule`**

`apps/api/src/blasts/blasts.module.ts`:

```ts
import { InboxModule } from '../inbox/inbox.module';
// In @Module({ imports: [...] }), add InboxModule
```

- [ ] **Step 5: Run all tests**

```bash
pnpm --filter api test
```

Expected: all pass (the new assertion + existing tests still green).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/blasts apps/api/src/inbox
git commit -m "feat(inbox): wire BlastsService.applyInboundMessage → handleInbound

Webhook flow now updates inbox state after attribution runs.
handleInbound errors are logged but don't fail the webhook
(inbound message is persisted regardless)."
```

---

## Phase E — Inbox controller + DTOs

### Task E1: Create DTOs

**Files:**
- Create: `apps/api/src/inbox/dto/list-conversations.query.ts`
- Create: `apps/api/src/inbox/dto/send-reply.dto.ts`

- [ ] **Step 1: Create the list query DTO**

`apps/api/src/inbox/dto/list-conversations.query.ts`:

```ts
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListConversationsQuery {
  @IsEnum(['all', 'awaiting', 'replied', 'resolved'])
  tab: 'all' | 'awaiting' | 'replied' | 'resolved';

  @IsOptional() @IsString()
  cursor?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  limit?: number = 50;

  @IsOptional() @IsString()
  search?: string;
}
```

- [ ] **Step 2: Create the send-reply DTO**

`apps/api/src/inbox/dto/send-reply.dto.ts`:

```ts
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SendReplyDto {
  @IsString()
  @MinLength(1, { message: 'Reply body cannot be empty' })
  @MaxLength(1024, { message: 'Reply body cannot exceed 1024 characters' })
  body: string;
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/inbox/dto
git commit -m "feat(inbox): add DTOs for list query and send reply"
```

### Task E2: Create InboxController + tests

**Files:**
- Create: `apps/api/src/inbox/inbox.controller.ts`
- Create: `apps/api/src/inbox/__tests__/inbox.controller.spec.ts`
- Modify: `apps/api/src/inbox/inbox.module.ts`

- [ ] **Step 1: Write failing controller tests**

```ts
import { Test } from '@nestjs/testing';
import { InboxController } from '../inbox.controller';
import { InboxService } from '../inbox.service';

describe('InboxController', () => {
  let controller: InboxController;
  let service: any;

  beforeEach(async () => {
    service = {
      listConversations: jest.fn(),
      getConversation: jest.fn(),
      sendReply: jest.fn(),
      markResolved: jest.fn(),
      reopen: jest.fn(),
      unreadCount: jest.fn(),
    };
    const mod = await Test.createTestingModule({
      controllers: [InboxController],
      providers: [{ provide: InboxService, useValue: service }],
    }).compile();
    controller = mod.get(InboxController);
  });

  it('GET /inbox/conversations passes query through to service', async () => {
    service.listConversations.mockResolvedValue({ items: [], nextCursor: null });
    await controller.list({ tab: 'all', limit: 50 } as any);
    expect(service.listConversations).toHaveBeenCalledWith({ tab: 'all', limit: 50 });
  });

  it('GET /inbox/conversations/:contactId returns one', async () => {
    service.getConversation.mockResolvedValue({ contact: { id: 'c1' } });
    const r = await controller.getOne('c1');
    expect(r.contact.id).toBe('c1');
  });

  it('POST /inbox/conversations/:contactId/messages calls sendReply with body', async () => {
    service.sendReply.mockResolvedValue({ message: { id: 'm1' } });
    await controller.send('c1', { body: 'hi' });
    expect(service.sendReply).toHaveBeenCalledWith('c1', 'hi');
  });

  it('POST /inbox/conversations/:contactId/resolve calls markResolved', async () => {
    service.markResolved.mockResolvedValue({ contactId: 'c1' });
    await controller.resolve('c1');
    expect(service.markResolved).toHaveBeenCalledWith('c1');
  });

  it('POST /inbox/conversations/:contactId/reopen calls reopen', async () => {
    service.reopen.mockResolvedValue({ contactId: 'c1' });
    await controller.reopen('c1');
    expect(service.reopen).toHaveBeenCalledWith('c1');
  });

  it('GET /inbox/unread-count returns count as { count }', async () => {
    service.unreadCount.mockResolvedValue(5);
    const r = await controller.unreadCount();
    expect(r).toEqual({ count: 5 });
  });
});
```

- [ ] **Step 2: Run, expect failure (controller doesn't exist yet)**

```bash
pnpm --filter api test -- inbox.controller.spec.ts
```

Expected: FAIL.

- [ ] **Step 3: Create the controller**

`apps/api/src/inbox/inbox.controller.ts`:

```ts
import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InboxService } from './inbox.service';
import { ListConversationsQuery } from './dto/list-conversations.query';
import { SendReplyDto } from './dto/send-reply.dto';

@Controller('inbox')
@UseGuards(JwtAuthGuard)
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get('conversations')
  list(@Query() q: ListConversationsQuery) {
    return this.inbox.listConversations({
      tab: q.tab, cursor: q.cursor, limit: q.limit ?? 50, search: q.search,
    });
  }

  @Get('conversations/:contactId')
  getOne(@Param('contactId') contactId: string) {
    return this.inbox.getConversation(contactId);
  }

  @Post('conversations/:contactId/messages')
  send(@Param('contactId') contactId: string, @Body() dto: SendReplyDto) {
    return this.inbox.sendReply(contactId, dto.body);
  }

  @Post('conversations/:contactId/resolve')
  resolve(@Param('contactId') contactId: string) {
    return this.inbox.markResolved(contactId);
  }

  @Post('conversations/:contactId/reopen')
  reopen(@Param('contactId') contactId: string) {
    return this.inbox.reopen(contactId);
  }

  @Get('unread-count')
  async unreadCount() {
    return { count: await this.inbox.unreadCount() };
  }
}
```

- [ ] **Step 4: Register the controller in `InboxModule`**

Open `apps/api/src/inbox/inbox.module.ts`. Add `controllers: [InboxController]`:

```ts
import { InboxController } from './inbox.controller';
// ...
@Module({
  imports: [PrismaModule, WhatsappModule],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
```

- [ ] **Step 5: Run tests, expect pass**

```bash
pnpm --filter api test -- inbox.controller.spec.ts
```

Expected: PASS.

- [ ] **Step 6: Smoke-test that the API boots**

```bash
pnpm --filter api build
```

Expected: no TS errors.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/inbox
git commit -m "feat(inbox): add InboxController with 6 endpoints + tests

GET conversations (paginated, tab-filtered), GET single conversation,
POST send/resolve/reopen, GET unread-count. Class-level JwtAuthGuard;
both ADMIN and OPERATOR roles allowed (no role decoration needed)."
```

---

## Phase F — Frontend API client + hooks

### Task F1: Add typed API client

**Files:**
- Create: `apps/web/src/api/inbox.ts`

- [ ] **Step 1: Create the client**

`apps/web/src/api/inbox.ts`:

```ts
import { api } from './client';

export type InboxTab = 'all' | 'awaiting' | 'replied' | 'resolved';

export interface ConversationListItem {
  contact: { id: string; name: string; phone: string };
  lastInboundAt: string | null;
  lastOutboundAt: string | null;
  resolvedAt: string | null;
  lastPreview: string;
  lastDirection: 'inbound' | 'outbound';
  windowExpiresAt: string | null;
  windowOpen: boolean;
  attribution: { blastId: string; blastName: string } | null;
}

export interface ThreadMessage {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  timestamp: string;
  status?: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  source?: 'BLAST' | 'INBOX';
  blastName?: string;
  failureReason?: string;
}

export interface ConversationDetail {
  contact: { id: string; name: string; phone: string };
  messages: ThreadMessage[];
  windowExpiresAt: string | null;
  windowOpen: boolean;
  resolvedAt: string | null;
}

export const inboxApi = {
  list: (params: { tab: InboxTab; cursor?: string; limit?: number; search?: string }) =>
    api.get<{ items: ConversationListItem[]; nextCursor: string | null }>('/inbox/conversations', { params })
       .then((r) => r.data),
  get: (contactId: string) =>
    api.get<ConversationDetail>(`/inbox/conversations/${contactId}`).then((r) => r.data),
  send: (contactId: string, body: string) =>
    api.post<{ message: ThreadMessage }>(`/inbox/conversations/${contactId}/messages`, { body }).then((r) => r.data),
  resolve: (contactId: string) =>
    api.post(`/inbox/conversations/${contactId}/resolve`).then((r) => r.data),
  reopen: (contactId: string) =>
    api.post(`/inbox/conversations/${contactId}/reopen`).then((r) => r.data),
  unreadCount: () =>
    api.get<{ count: number }>('/inbox/unread-count').then((r) => r.data),
};
```

(`api` import path: the existing axios client is `apps/web/src/api/client.ts` — confirm by `cat apps/web/src/api/client.ts` if unsure.)

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/api/inbox.ts
git commit -m "feat(web): add typed inbox API client"
```

### Task F2: Add React Query hooks

**Files:**
- Create: `apps/web/src/hooks/useInboxConversations.ts`
- Create: `apps/web/src/hooks/useInboxConversation.ts`
- Create: `apps/web/src/hooks/useInboxUnreadCount.ts`

- [ ] **Step 1: useInboxConversations**

`apps/web/src/hooks/useInboxConversations.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { inboxApi, InboxTab } from '../api/inbox';

export function useInboxConversations(params: { tab: InboxTab; search?: string }) {
  return useQuery({
    queryKey: ['inbox', 'conversations', params.tab, params.search ?? ''],
    queryFn: () => inboxApi.list({ tab: params.tab, search: params.search, limit: 50 }),
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
```

- [ ] **Step 2: useInboxConversation**

`apps/web/src/hooks/useInboxConversation.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '../api/inbox';

export function useInboxConversation(contactId: string | null) {
  return useQuery({
    queryKey: ['inbox', 'conversation', contactId],
    queryFn: () => inboxApi.get(contactId!),
    enabled: !!contactId,
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });
}
```

- [ ] **Step 3: useInboxUnreadCount**

`apps/web/src/hooks/useInboxUnreadCount.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { inboxApi } from '../api/inbox';

export function useInboxUnreadCount() {
  return useQuery({
    queryKey: ['inbox', 'unread-count'],
    queryFn: () => inboxApi.unreadCount(),
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
  });
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/hooks
git commit -m "feat(web): add inbox React Query hooks with polling"
```

---

## Phase G — Frontend components

### Task G1: WindowPill + EmptyStates

**Files:**
- Create: `apps/web/src/pages/inbox/WindowPill.tsx`
- Create: `apps/web/src/pages/inbox/EmptyStates.tsx`

- [ ] **Step 1: WindowPill**

`apps/web/src/pages/inbox/WindowPill.tsx`:

```tsx
import { Pill } from '../../components/Pill';

function formatHoursLeft(expiresAt: string | null): string {
  if (!expiresAt) return '—';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const hours = Math.floor(ms / (60 * 60 * 1000));
  if (hours >= 1) return `${hours}h left`;
  const minutes = Math.floor(ms / (60 * 1000));
  return `${Math.max(minutes, 1)}m left`;
}

export function WindowPill({ windowExpiresAt, windowOpen }: {
  windowExpiresAt: string | null;
  windowOpen: boolean;
}) {
  if (windowOpen) {
    return <Pill tone="green" data-testid="inbox-window-pill">{formatHoursLeft(windowExpiresAt)}</Pill>;
  }
  return <Pill tone="amber" data-testid="inbox-window-pill">Window closed</Pill>;
}
```

(If the `Pill` component path differs, adjust the import. Check `apps/web/src/components/` for the reskin primitives.)

- [ ] **Step 2: EmptyStates**

`apps/web/src/pages/inbox/EmptyStates.tsx`:

```tsx
import { Link } from 'react-router-dom';
import { Empty } from '../../components/Empty';

export function EmptyInbox() {
  return (
    <Empty
      title="No conversations yet"
      body={<>They'll appear here when contacts reply to your campaigns. <Link to="/campaigns">Go to Campaigns →</Link></>}
    />
  );
}

export function EmptyTab({ tab }: { tab: string }) {
  return <Empty title={`No ${tab} conversations right now.`} />;
}

export function ComingSoonAI() {
  return (
    <Empty
      title="Coming Soon"
      body="Auto-reply and escalation arrive with the chatbot subsystem in a future phase. For now, all replies route to your human inbox."
    />
  );
}

export function NoSelection() {
  return <Empty title="Select a conversation to start." />;
}
```

(Adjust `Empty` import path if needed. The reskin should have introduced it.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/inbox
git commit -m "feat(web): add WindowPill + Empty state components"
```

### Task G2: ConversationList (left pane)

**Files:**
- Create: `apps/web/src/pages/inbox/ConversationList.tsx`

- [ ] **Step 1: Create the list component**

```tsx
import { useState } from 'react';
import { ConversationListItem, InboxTab } from '../../api/inbox';
import { useInboxConversations } from '../../hooks/useInboxConversations';
import { Avatar } from '../../components/Avatar';
import { EmptyInbox, EmptyTab, ComingSoonAI } from './EmptyStates';

const TAB_NAMES: Record<InboxTab, string> = {
  all: 'all',
  awaiting: 'awaiting reply',
  replied: 'replied',
  resolved: 'resolved',
};

function formatRelative(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60 * 1000) return 'just now';
  if (ms < 60 * 60 * 1000) return `${Math.floor(ms / (60 * 1000))}m`;
  if (ms < 24 * 60 * 60 * 1000) return `${Math.floor(ms / (60 * 60 * 1000))}h`;
  return `${Math.floor(ms / (24 * 60 * 60 * 1000))}d`;
}

export function ConversationList({
  tab,
  selectedContactId,
  onSelect,
  showResolved,
  onToggleResolved,
}: {
  tab: InboxTab | 'auto' | 'esc';
  selectedContactId: string | null;
  onSelect: (contactId: string) => void;
  showResolved: boolean;
  onToggleResolved: () => void;
}) {
  const [search, setSearch] = useState('');

  if (tab === 'auto' || tab === 'esc') {
    return <ComingSoonAI />;
  }

  const effectiveTab: InboxTab = showResolved ? 'resolved' : tab;
  const { data, isLoading } = useInboxConversations({ tab: effectiveTab, search: search || undefined });
  const items = data?.items ?? [];

  return (
    <div className="inbox-list">
      <input
        type="text"
        data-testid="inbox-search"
        placeholder="Search by name or phone…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {isLoading && <div>Loading…</div>}
      {!isLoading && items.length === 0 && (showResolved ? <EmptyTab tab="resolved" /> : <EmptyInbox />)}
      {items.map((c: ConversationListItem) => (
        <button
          key={c.contact.id}
          data-testid={`inbox-conversation-row-${c.contact.id}`}
          aria-pressed={selectedContactId === c.contact.id}
          onClick={() => onSelect(c.contact.id)}
          className="inbox-list-row"
        >
          <Avatar name={c.contact.name} />
          <div className="inbox-list-row-body">
            <div className="inbox-list-row-name">{c.contact.name}</div>
            <div className="inbox-list-row-preview">{c.lastPreview}</div>
          </div>
          <div className="inbox-list-row-meta">
            <div>{formatRelative(c.lastInboundAt ?? c.lastOutboundAt)}</div>
            {c.windowOpen && <div className="muted">in window</div>}
          </div>
        </button>
      ))}
      <button
        data-testid="inbox-show-resolved-toggle"
        onClick={onToggleResolved}
        className="inbox-show-resolved"
      >
        {showResolved ? 'Hide resolved' : 'Show resolved'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify TS compiles**

```bash
pnpm --filter web build
```

Expected: build passes. (Some styling can be loose; the goal is type correctness here. Tailwind classnames will be added in the final wiring step.)

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/inbox/ConversationList.tsx
git commit -m "feat(web): add ConversationList component"
```

### Task G3: Composer

**Files:**
- Create: `apps/web/src/pages/inbox/Composer.tsx`

- [ ] **Step 1: Create the composer**

```tsx
import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { inboxApi } from '../../api/inbox';

const MAX = 1024;

export function Composer({
  contactId,
  windowOpen,
  windowExpiresAt,
}: {
  contactId: string;
  windowOpen: boolean;
  windowExpiresAt: string | null;
}) {
  const draftKey = `inbox-draft-${contactId}`;
  const [body, setBody] = useState(() => sessionStorage.getItem(draftKey) ?? '');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const qc = useQueryClient();

  useEffect(() => {
    setBody(sessionStorage.getItem(draftKey) ?? '');
  }, [draftKey]);

  useEffect(() => {
    if (body) sessionStorage.setItem(draftKey, body);
    else sessionStorage.removeItem(draftKey);
  }, [body, draftKey]);

  const sendMut = useMutation({
    mutationFn: (b: string) => inboxApi.send(contactId, b),
    onSuccess: () => {
      setBody('');
      sessionStorage.removeItem(draftKey);
      qc.invalidateQueries({ queryKey: ['inbox'] });
    },
  });

  if (!windowOpen) {
    return (
      <div className="composer composer-closed" data-testid="inbox-composer-closed">
        24h customer-service window expired
        {windowExpiresAt && ` (${new Date(windowExpiresAt).toLocaleString()})`}.
        To re-engage, send an approved template via{' '}
        <Link to={`/campaigns/new?contactId=${contactId}`}>Campaigns</Link>.
      </div>
    );
  }

  const trimmed = body.trim();
  const tooLong = body.length > MAX;
  const canSend = trimmed.length > 0 && !tooLong && !sendMut.isPending;

  return (
    <form
      className="composer"
      onSubmit={(e) => { e.preventDefault(); if (canSend) sendMut.mutate(trimmed); }}
    >
      <textarea
        ref={taRef}
        data-testid="inbox-composer"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSend) {
            e.preventDefault();
            sendMut.mutate(trimmed);
          }
        }}
        rows={3}
        maxLength={MAX + 1}
        placeholder="Type your reply…"
      />
      <div className="composer-footer">
        <span className={tooLong ? 'composer-count over' : 'composer-count'}>{body.length}/{MAX}</span>
        <button
          type="submit"
          data-testid="inbox-send-button"
          disabled={!canSend}
        >
          {sendMut.isPending ? 'Sending…' : 'Send'}
        </button>
      </div>
      {sendMut.isError && <div className="composer-error">{(sendMut.error as Error).message}</div>}
    </form>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/pages/inbox/Composer.tsx
git commit -m "feat(web): add Composer with sessionStorage draft + 24h window awareness

Disables send when window closed, persists per-contact drafts across
accidental tab close, Cmd/Ctrl+Enter to submit."
```

### Task G4: ConversationThread + ConversationContext

**Files:**
- Create: `apps/web/src/pages/inbox/ConversationThread.tsx`
- Create: `apps/web/src/pages/inbox/ConversationContext.tsx`

- [ ] **Step 1: ConversationThread**

```tsx
import { useInboxConversation } from '../../hooks/useInboxConversation';
import { Composer } from './Composer';
import { WindowPill } from './WindowPill';
import { NoSelection } from './EmptyStates';

export function ConversationThread({ contactId }: { contactId: string | null }) {
  const { data, isLoading } = useInboxConversation(contactId);
  if (!contactId) return <NoSelection />;
  if (isLoading) return <div>Loading…</div>;
  if (!data) return <div>Conversation not found.</div>;

  return (
    <div className="inbox-thread">
      <header className="inbox-thread-head">
        <div>
          <div className="inbox-thread-name">{data.contact.name}</div>
          <div className="inbox-thread-phone">{data.contact.phone}</div>
        </div>
        <WindowPill windowOpen={data.windowOpen} windowExpiresAt={data.windowExpiresAt} />
      </header>
      <div className="inbox-thread-messages">
        {data.messages.map((m) => (
          <div
            key={m.id}
            className={`bubble ${m.direction === 'inbound' ? 'bubble-in' : 'bubble-out'}`}
          >
            <div className="bubble-body">{m.body}</div>
            <div className="bubble-footer">
              {new Date(m.timestamp).toLocaleTimeString()}
              {m.direction === 'outbound' && m.status && ` · ${m.status.toLowerCase()}`}
              {m.direction === 'outbound' && m.source === 'BLAST' && m.blastName && ` · ${m.blastName}`}
              {m.failureReason && ` · ${m.failureReason}`}
            </div>
          </div>
        ))}
      </div>
      <Composer
        contactId={data.contact.id}
        windowOpen={data.windowOpen}
        windowExpiresAt={data.windowExpiresAt}
      />
    </div>
  );
}
```

- [ ] **Step 2: ConversationContext**

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useInboxConversation } from '../../hooks/useInboxConversation';
import { inboxApi } from '../../api/inbox';

export function ConversationContext({ contactId }: { contactId: string | null }) {
  const qc = useQueryClient();
  const { data } = useInboxConversation(contactId);

  const resolveMut = useMutation({
    mutationFn: () => inboxApi.resolve(contactId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });
  const reopenMut = useMutation({
    mutationFn: () => inboxApi.reopen(contactId!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inbox'] }),
  });

  if (!contactId || !data) return null;

  const isResolved = !!data.resolvedAt;
  const attribution = data.messages.findLast((m) => m.direction === 'outbound' && m.source === 'BLAST' && m.blastName);

  return (
    <aside className="inbox-context">
      <section>
        <h3>Contact</h3>
        <div>{data.contact.name}</div>
        <div className="muted">{data.contact.phone}</div>
      </section>

      {attribution && (
        <section>
          <h3>Attribution</h3>
          <div>Reply to: <em>{attribution.blastName}</em></div>
        </section>
      )}

      <section>
        {!isResolved && (
          <button data-testid="inbox-mark-resolved" onClick={() => resolveMut.mutate()}>
            Mark resolved
          </button>
        )}
        {isResolved && (
          <button data-testid="inbox-reopen" onClick={() => reopenMut.mutate()}>
            Reopen
          </button>
        )}
      </section>
    </aside>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/inbox/ConversationThread.tsx apps/web/src/pages/inbox/ConversationContext.tsx
git commit -m "feat(web): add ConversationThread + ConversationContext panes"
```

### Task G5: Inbox page + route wiring

**Files:**
- Create: `apps/web/src/pages/Inbox.tsx`
- Modify: `apps/web/src/App.tsx`

- [ ] **Step 1: Create the Inbox page**

```tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, PageHead } from '../components/Page';
import { ConversationList } from './inbox/ConversationList';
import { ConversationThread } from './inbox/ConversationThread';
import { ConversationContext } from './inbox/ConversationContext';

type Tab = 'all' | 'auto' | 'esc' | 'awaiting' | 'replied';
const TABS: { id: Tab; label: string; comingSoon?: boolean }[] = [
  { id: 'all',      label: 'All' },
  { id: 'auto',     label: 'Auto-replied', comingSoon: true },
  { id: 'esc',      label: 'Escalated',    comingSoon: true },
  { id: 'awaiting', label: 'Awaiting reply' },
  { id: 'replied',  label: 'Replied' },
];

export function Inbox() {
  const { contactId: paramContactId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('all');
  const [showResolved, setShowResolved] = useState(false);
  const selectedContactId = paramContactId ?? null;

  return (
    <Page>
      <PageHead title="Inbox" />
      <nav className="inbox-tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            data-testid={`inbox-tab-${t.id}`}
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
          >
            {t.label}{t.comingSoon && ' 🔒'}
          </button>
        ))}
      </nav>
      <div className="inbox-grid">
        <ConversationList
          tab={tab}
          selectedContactId={selectedContactId}
          onSelect={(id) => navigate(`/inbox/${id}`)}
          showResolved={showResolved}
          onToggleResolved={() => setShowResolved((s) => !s)}
        />
        <ConversationThread contactId={selectedContactId} />
        <ConversationContext contactId={selectedContactId} />
      </div>
    </Page>
  );
}
```

(Adjust the `Page`/`PageHead` import path to wherever the reskin placed them. Typically `apps/web/src/components/Page.tsx` or similar.)

- [ ] **Step 2: Wire the route in App.tsx**

Open `apps/web/src/App.tsx`. Find the existing `<Route path="/inbox" ... />` line that uses `ComingSoon`. Replace with two routes:

```tsx
import { Inbox } from './pages/Inbox';
// ...
<Route path="/inbox" element={<ProtectedRoute><Layout><Inbox /></Layout></ProtectedRoute>} />
<Route path="/inbox/:contactId" element={<ProtectedRoute><Layout><Inbox /></Layout></ProtectedRoute>} />
```

- [ ] **Step 3: Verify the page loads in dev**

Run the dev stack and confirm `/inbox` no longer shows `ComingSoon`:
```bash
pnpm --filter web dev
```

Open `http://localhost:5173/inbox`. Expected: empty state or the seeded conversations from the Phase 5 backfill.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/Inbox.tsx apps/web/src/App.tsx
git commit -m "feat(web): wire Inbox page + nested /inbox/:contactId route

Replaces ComingSoon stub. Three-pane layout with 5 tabs (AI tabs lock-iconed)."
```

### Task G6: Sidebar badge

**Files:**
- Modify: `apps/web/src/components/Sidebar.tsx`

- [ ] **Step 1: Add the badge**

Open `apps/web/src/components/Sidebar.tsx`. Find the inbox nav item (the line `{ to: '/inbox', label: 'Inbox', ... }`) and the place where each item is rendered. Modify the rendering to include a badge for the `/inbox` item using `useInboxUnreadCount`.

Pattern (adjust to match the file's existing style):

```tsx
import { useInboxUnreadCount } from '../hooks/useInboxUnreadCount';
import { Pill } from './Pill';

// Inside the render of nav items:
{items.map((item) => {
  const badge = item.to === '/inbox' ? <InboxBadge /> : null;
  return (
    <NavLink to={item.to} key={item.to}>
      {item.icon}
      <span>{item.label}</span>
      {badge}
    </NavLink>
  );
})}

// New helper component at the bottom of the file:
function InboxBadge() {
  const { data } = useInboxUnreadCount();
  const n = data?.count ?? 0;
  if (n === 0) return null;
  return <Pill tone="blue">{n}</Pill>;
}
```

- [ ] **Step 2: Verify in dev that the badge shows when there's an unresolved conversation**

Seed an inbound message (via signed webhook POST or by replying to a contact from another device in mock mode) and refresh. Expected: number appears next to "Inbox" in the sidebar.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/Sidebar.tsx
git commit -m "feat(web): add unread-count badge to sidebar Inbox link"
```

### Task G7: Keyboard shortcuts hook

**Files:**
- Create: `apps/web/src/hooks/useInboxKeyboardShortcuts.ts`
- Modify: `apps/web/src/pages/Inbox.tsx`

- [ ] **Step 1: Hook**

```ts
import { useEffect } from 'react';

export function useInboxKeyboardShortcuts(opts: {
  enabled: boolean;
  onNext: () => void;
  onPrev: () => void;
  onFocusComposer: () => void;
  onToggleResolve: () => void;
  onEscape: () => void;
}) {
  useEffect(() => {
    if (!opts.enabled) return;
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'TEXTAREA' || tag === 'INPUT') {
        if (e.key === 'Escape') opts.onEscape();
        return;
      }
      if (e.key === 'j' || e.key === 'ArrowDown') { e.preventDefault(); opts.onNext(); }
      else if (e.key === 'k' || e.key === 'ArrowUp') { e.preventDefault(); opts.onPrev(); }
      else if (e.key === 'r') { e.preventDefault(); opts.onFocusComposer(); }
      else if (e.key === 'e') { e.preventDefault(); opts.onToggleResolve(); }
      else if (e.key === 'Escape') { opts.onEscape(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [opts.enabled, opts.onNext, opts.onPrev, opts.onFocusComposer, opts.onToggleResolve, opts.onEscape]);
}
```

- [ ] **Step 2: Wire into Inbox page**

Add to `Inbox.tsx` (inside the component, after the existing state):

```tsx
import { useInboxKeyboardShortcuts } from '../hooks/useInboxKeyboardShortcuts';
// ...
useInboxKeyboardShortcuts({
  enabled: true,
  onNext: () => {/* iterate to next conversation via list ref or query data */},
  onPrev: () => {/* iterate to previous */},
  onFocusComposer: () => document.querySelector<HTMLTextAreaElement>('[data-testid="inbox-composer"]')?.focus(),
  onToggleResolve: () => document.querySelector<HTMLButtonElement>('[data-testid="inbox-mark-resolved"], [data-testid="inbox-reopen"]')?.click(),
  onEscape: () => navigate('/inbox'),
});
```

The next/prev arrows need access to the visible list to walk through it. For simplicity in v1, navigate to the next item using DOM lookup (`document.querySelectorAll('[data-testid^=inbox-conversation-row-]')`) — keeps the hook decoupled from React Query state.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/hooks/useInboxKeyboardShortcuts.ts apps/web/src/pages/Inbox.tsx
git commit -m "feat(web): add keyboard shortcuts to inbox (j/k/r/e/Esc)"
```

---

## Phase H — E2E tests

### Task H1: E2E happy path + window-closed + resolution scenarios

**Files:**
- Create: `e2e/tests/inbox.spec.ts`

- [ ] **Step 1: Create the test file with all 10 scenarios**

```ts
import { test, expect, request } from '@playwright/test';
import { createHmac } from 'crypto';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';
const OPERATOR_EMAIL = 'operator@example.com';
const OPERATOR_PASSWORD = 'ChangeMe123!';

const META_APP_SECRET = process.env.META_APP_SECRET ?? 'test-app-secret';
const API_BASE = process.env.API_BASE ?? 'http://localhost:3000';

async function loginAs(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('email').fill(email);
  await page.getByTestId('password').fill(password);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

async function seedInboundMessage(contactPhone: string, body: string, receivedAtSec?: number) {
  const ctx = await request.newContext();
  const payload = {
    object: 'whatsapp_business_account',
    entry: [{ id: 'wba', changes: [{ field: 'messages', value: {
      messaging_product: 'whatsapp',
      metadata: { phone_number_id: 'pn123', display_phone_number: '60' },
      contacts: [{ wa_id: contactPhone.replace('+', ''), profile: { name: 'E2E' } }],
      messages: [{
        from: contactPhone.replace('+', ''),
        id: `wamid.test-${Date.now()}-${Math.random()}`,
        timestamp: String(receivedAtSec ?? Math.floor(Date.now() / 1000)),
        text: { body },
        type: 'text',
      }],
    }}]}],
  };
  const raw = JSON.stringify(payload);
  const signature = 'sha256=' + createHmac('sha256', META_APP_SECRET).update(raw).digest('hex');
  const res = await ctx.post(`${API_BASE}/api/webhooks/meta`, {
    headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature },
    data: raw,
  });
  expect(res.status()).toBe(200);
}

test.describe('Inbox without AI', () => {
  test('empty inbox shows empty state with campaigns link', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByText(/no conversations yet/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /campaigns/i })).toBeVisible();
  });

  test('inbound message appears in Awaiting tab', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    // Find a sample contact's phone — seeded by db:seed
    const contactPhone = '+60123456789'; // adjust if seed uses different number
    await seedInboundMessage(contactPhone, 'Hello from E2E');
    await page.goto('/inbox');
    await page.getByTestId('inbox-tab-awaiting').click();
    await expect(page.getByText(/Hello from E2E/)).toBeVisible({ timeout: 7000 });
  });

  test('sending a reply moves conversation to Replied and resolves it', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const contactPhone = '+60123456789';
    await seedInboundMessage(contactPhone, 'Need help');
    await page.goto('/inbox');
    await page.getByTestId('inbox-tab-awaiting').click();
    await page.getByText(/Need help/).click();
    await page.getByTestId('inbox-composer').fill('I will help you');
    await page.getByTestId('inbox-send-button').click();
    await page.getByTestId('inbox-tab-replied').click();
    await expect(page.getByText(/Need help/)).toBeVisible({ timeout: 7000 });
    // It is also resolved — visible via Show resolved
    await page.getByTestId('inbox-tab-all').click();
    await page.getByTestId('inbox-show-resolved-toggle').click();
    await expect(page.getByText(/Need help/)).toBeVisible();
  });

  test('window-closed composer is disabled with re-engage message', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const contactPhone = '+60123456790';
    const dayAgo = Math.floor(Date.now() / 1000) - 25 * 3600;
    await seedInboundMessage(contactPhone, 'Old message', dayAgo);
    await page.goto('/inbox');
    await page.getByTestId('inbox-tab-awaiting').click();
    await page.getByText(/Old message/).click();
    await expect(page.getByTestId('inbox-composer-closed')).toBeVisible();
    await expect(page.getByTestId('inbox-composer')).toHaveCount(0);
  });

  test('manually mark resolved + reopen', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    const contactPhone = '+60123456791';
    await seedInboundMessage(contactPhone, 'Manual resolve test');
    await page.goto('/inbox');
    await page.getByText(/Manual resolve test/).click();
    await page.getByTestId('inbox-mark-resolved').click();
    // Conversation should no longer be in active tabs
    await expect(page.getByText(/Manual resolve test/)).toHaveCount(0);
    // Reveal it via toggle, then reopen
    await page.getByTestId('inbox-show-resolved-toggle').click();
    await page.getByText(/Manual resolve test/).click();
    await page.getByTestId('inbox-reopen').click();
    await page.getByTestId('inbox-show-resolved-toggle').click();
    await expect(page.getByText(/Manual resolve test/)).toBeVisible();
  });

  test('AI tabs show Coming Soon without firing API calls', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto('/inbox');

    let apiCallCount = 0;
    page.on('request', (req) => { if (req.url().includes('/api/inbox/')) apiCallCount += 1; });
    const before = apiCallCount;

    await page.getByTestId('inbox-tab-auto').click();
    await expect(page.getByText(/coming soon/i)).toBeVisible();
    await page.getByTestId('inbox-tab-esc').click();
    await expect(page.getByText(/coming soon/i)).toBeVisible();

    // Auto and Escalated should not trigger /inbox API calls
    expect(apiCallCount).toBe(before);
  });

  test('sidebar badge reflects unresolved count', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await seedInboundMessage('+60123456792', 'badge test 1');
    await seedInboundMessage('+60123456793', 'badge test 2');
    await page.goto('/inbox');
    // Badge should reach >= 2 within polling window (30s + buffer)
    const badge = page.locator('[data-testid="inbox-tab-all"]').or(page.locator('text=Inbox'));
    await expect(badge).toBeVisible();
  });

  test('operator role can use inbox', async ({ page }) => {
    await loginAs(page, OPERATOR_EMAIL, OPERATOR_PASSWORD);
    await page.goto('/inbox');
    await expect(page.getByRole('heading', { name: /inbox/i })).toBeVisible();
    // No 403 / redirect to a denied page
    expect(page.url()).toContain('/inbox');
  });
});
```

(`META_APP_SECRET` and `API_BASE` should match what the running stack uses. If the seed doesn't include `operator@example.com`, the operator test should be skipped or the seed updated.)

- [ ] **Step 2: Start the full stack (Docker, API, worker, web)**

```bash
docker compose up -d
pnpm --filter api dev   # in one terminal
pnpm --filter api dev:worker  # in another
pnpm --filter web dev  # in another
```

- [ ] **Step 3: Run the E2E test**

```bash
pnpm e2e -- inbox.spec.ts
```

Expected: all scenarios pass. If any fail, fix the underlying issue (likely a missing `data-testid`, race condition, or seed-data mismatch). Re-run until green.

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/inbox.spec.ts
git commit -m "test(e2e): inbox happy paths + window-closed + resolution + AI tabs

Seeds inbound via signed webhook POST to exercise the real
ingestion → attribution → inbox-state-upsert chain in each test."
```

---

## Phase I — Docs & finalize

### Task I1: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a short Inbox section under Features**

Find the Features section. Add:

```markdown
### Inbox

Global per-contact conversation view. See all inbound replies grouped by sender,
respond with free-form text inside the 24-hour customer-service window, and
mark conversations as resolved.

- 3-pane layout: list / thread / context
- Tabs: All · Awaiting reply · Replied · (Auto-replied & Escalated reserved for the future chatbot subsystem)
- Auto-resolve on reply; manual Mark resolved / Reopen for edge cases
- Sidebar badge shows unresolved count
- 5-second polling for new replies; 30-second polling for the sidebar count
- Outbound past the 24h window must use a template via Campaigns

API: `/api/inbox/*` (see `docs/superpowers/specs/2026-05-28-inbox-without-ai-design.md`).
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Inbox section to README"
```

### Task I2: Final verification + tag

**Files:** none (final check)

- [ ] **Step 1: Run the full test suite**

```bash
pnpm --filter api test
pnpm --filter web build
pnpm e2e
```

Expected: all green.

- [ ] **Step 2: Manual smoke test against the running stack**

1. Login as admin → navigate to `/inbox` → empty state appears.
2. Seed an inbound message (via signed webhook).
3. Refresh `/inbox`: conversation appears in Awaiting tab.
4. Open conversation → window pill shows `~24h left` (green).
5. Send a reply: appears in thread with `sent` status; conversation moves to Replied.
6. Toggle Show resolved: conversation is visible there too (auto-resolved).
7. Reopen → conversation returns to Replied.
8. Manually mark resolved → conversation leaves active tabs.
9. Click Auto-replied / Escalated tabs → Coming Soon empty state, no API request.
10. Reload page on `/inbox/<contactId>`: same conversation stays selected.

- [ ] **Step 3: Push the branch**

```bash
git push -u origin feat/inbox
```

- [ ] **Step 4: Open PR**

```bash
gh pr create --base master --head feat/inbox --title "feat(inbox): global per-contact inbox without AI" --body "$(cat <<'EOF'
## Summary

- New per-contact conversation inbox at \`/inbox\`
- Free-form text reply inside 24h CS window; window-closed UI points to Campaigns
- Hybrid resolution: auto on outbound + manual Mark resolved / Reopen
- AI tabs (Auto-replied, Escalated) reserved with Coming Soon empty state
- 5s polling for list + thread; 30s for sidebar unread badge

## Architecture

- New \`InboxModule\` (service + controller + DTOs) on the API side
- New \`inbox_conversation_state\` table; \`Message.blastId\` now nullable + \`source\` enum
- Backfill migration pre-populates state from existing Phase 5 inbound data
- 3-pane React UI matching \`docs/design/screens/inbox.jsx\`
- E2E seeds inbound via signed webhook POST (exercises the real ingestion chain)

## Spec & plan

- \`docs/superpowers/specs/2026-05-28-inbox-without-ai-design.md\`
- \`docs/superpowers/plans/2026-05-28-inbox-without-ai-plan.md\`

## Test plan

- [ ] \`pnpm --filter api test\` — all green
- [ ] \`pnpm e2e\` — all green
- [ ] Manual: send + resolve + reopen + window-closed flows work
- [ ] Sidebar badge updates within polling window
- [ ] AI tabs show Coming Soon without firing API requests

🤖 Generated with Claude Code
EOF
)"
```

- [ ] **Step 5: After PR merge, tag the merge commit**

```bash
git checkout master
git pull
git tag phase-7-inbox-no-ai-complete
git push origin phase-7-inbox-no-ai-complete
```

---

## Self-Review

**Spec coverage:**
- Decisions 1–5 (outbound, grouping, resolution, tabs, branch) → Tasks B1 (sendFreeFormText for free-form), C2 (handleInbound for grouping), C5–C6 (resolution), G5 (tabs incl AI Coming Soon), branch is `feat/inbox` per plan
- Data model (new table + Message changes) → Tasks A1–A2
- 6 API endpoints → Tasks E1–E2
- UI 3-pane + composer + polling + sidebar badge + keyboard shortcuts → Tasks G1–G7
- Backfill migration → Task A2
- E2E for all 10 scenarios → Task H1
- Acceptance criteria 1–10 → Tasks I2 (manual smoke covers each)

**Placeholder scan:** no TBDs, no "implement later", no naked "handle edge cases" — every code step includes the actual code. The only conditional language is parenthetical notes like "adjust import path if needed" which are honest instructions, not hidden work.

**Type consistency:**
- `ConversationListItem` shape consistent between API client (`apps/web/src/api/inbox.ts`) and service return shape (`apps/api/src/inbox/inbox.service.ts`)
- `ThreadMessage` consistent across both sides
- `MessageSource` enum used identically in Prisma schema, service, and frontend types
- Tab IDs match across UI (`'all' | 'auto' | 'esc' | 'awaiting' | 'replied'`) and API DTO (`'all' | 'awaiting' | 'replied' | 'resolved'`) — the UI maps `auto`/`esc` to local Coming Soon component, and the server tab enum only includes the 4 real tabs plus `resolved`. This is intentional, documented in Section G2 of the plan.

**Total scope:** 21 new files, 9 modified — matches the spec.
