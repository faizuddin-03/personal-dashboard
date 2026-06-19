# Per-Recipient Delivery + Retry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "coming soon" Recipients placeholder on the campaign detail page with a real paginated, filterable per-recipient delivery table, plus per-row and bulk retry for failed messages.

**Architecture:** Extend the existing `blasts` module — three new `BlastsController` routes backed by `BlastsService` methods (`listMessages`, `retryMessage`, `retryFailed`) using Prisma `findMany`/`count`/`updateMany` + a JS merge for contact name/phone (no `Message→Contact` relation) + the existing BullMQ queue for re-enqueue. Frontend wires a recipients table into `CampaignDetail.tsx` via react-query. The demo-data generator gains a small share of FAILED messages so the flow is demoable.

**Tech Stack:** NestJS 10, Prisma 5 (Postgres), BullMQ, Jest + ts-jest (mocked Prisma + mocked queue), Vite + React + TS, @tanstack/react-query v5, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-07-per-recipient-delivery-design.md`

---

## Conventions (read once)

- **Backend unit tests mock Prisma and the queue.** Construct the service directly: `new BlastsService(prisma, queue, {} as any, {} as any, {} as any)` where `prisma`/`queue` are objects of `jest.fn()`s. No test DB. See `apps/api/src/blasts/__tests__/blasts.service.spec.ts`.
- Run a single backend test path: `pnpm --filter api test -- blasts.service`.
- `BlastsService.findOne(id)` already throws `NotFoundException` when a blast is missing (`blasts.service.ts:42-46`).
- `BLAST_QUEUE` and `BlastJobData` are exported from `blasts.service.ts`; `this.queue` is the injected BullMQ `Queue`.
- All `blasts` routes are under `/api` and behind `JwtAuthGuard` (controller-level).
- Frontend has no component unit tests — Tasks 5–6 are verified by `pnpm --filter web build`; Task 7 adds a Playwright spec whose **run is deferred** (needs Postgres + dev servers).
- Branch: `feat/per-recipient-delivery` (already created from master). Do NOT create another branch. Commit after each task.

---

## Shared shapes (defined in Task 1, mirrored by the web client in Task 5)

```ts
// GET /blasts/:id/messages
{ items: RecipientRow[]; total: number; page: number; pageSize: number }
// RecipientRow = {
//   id: string; contactName: string | null; contactPhone: string;
//   status: MessageStatus; errorCode: string | null; errorMessage: string | null;
//   sentAt: string|null; deliveredAt: string|null; readAt: string|null; repliedAt: string|null;
// }
// POST /blasts/:id/messages/:messageId/retry  -> the updated Message row (status QUEUED)
// POST /blasts/:id/retry-failed               -> { retried: number }
```

---

## Task 1: `GET /blasts/:id/messages` (paginated, filterable, contact-joined)

**Files:**
- Create: `apps/api/src/blasts/dto/list-blast-messages.dto.ts`
- Modify: `apps/api/src/blasts/blasts.service.ts`
- Modify: `apps/api/src/blasts/blasts.controller.ts`
- Test: `apps/api/src/blasts/__tests__/blasts.service.spec.ts`

- [ ] **Step 1: Write the failing test** — append to `blasts.service.spec.ts`:

```ts
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('BlastsService.listMessages', () => {
  let prisma: any; let queue: any; let service: BlastsService;
  beforeEach(() => {
    prisma = {
      blast: { findUnique: jest.fn().mockResolvedValue({ id: 'b1' }) },
      message: { count: jest.fn(), findMany: jest.fn() },
      contact: { findMany: jest.fn() },
    };
    queue = { add: jest.fn(), getJobs: jest.fn() };
    service = new BlastsService(prisma, queue, {} as any, {} as any, {} as any);
  });

  it('paginates, filters by status, and merges contact name/phone', async () => {
    prisma.message.count.mockResolvedValue(2);
    prisma.message.findMany.mockResolvedValue([
      { id: 'm1', contactId: 'c1', status: 'FAILED', errorCode: '131026', errorMessage: 'undeliverable', sentAt: new Date(), deliveredAt: null, readAt: null, repliedAt: null },
      { id: 'm2', contactId: 'c2', status: 'DELIVERED', errorCode: null, errorMessage: null, sentAt: new Date(), deliveredAt: new Date(), readAt: null, repliedAt: null },
    ]);
    prisma.contact.findMany.mockResolvedValue([
      { id: 'c1', name: 'Auto Bestari', phoneE164: '+60123456789' },
      { id: 'c2', name: null, phoneE164: '+60198887777' },
    ]);

    const res = await service.listMessages('b1', { status: 'FAILED' as any, page: 2, pageSize: 25 });

    expect(prisma.message.count).toHaveBeenCalledWith({ where: { blastId: 'b1', status: 'FAILED' } });
    const findArgs = prisma.message.findMany.mock.calls[0][0];
    expect(findArgs.where).toEqual({ blastId: 'b1', status: 'FAILED' });
    expect(findArgs.skip).toBe(25);
    expect(findArgs.take).toBe(25);
    expect(res.total).toBe(2);
    expect(res.items[0]).toEqual(expect.objectContaining({
      id: 'm1', contactName: 'Auto Bestari', contactPhone: '+60123456789', status: 'FAILED', errorCode: '131026',
    }));
    expect(res.items[1].contactName).toBeNull();
  });

  it('omits the status filter when not provided and defaults page/pageSize', async () => {
    prisma.message.count.mockResolvedValue(0);
    prisma.message.findMany.mockResolvedValue([]);
    prisma.contact.findMany.mockResolvedValue([]);
    const res = await service.listMessages('b1', {});
    expect(prisma.message.count).toHaveBeenCalledWith({ where: { blastId: 'b1' } });
    expect(res).toEqual({ items: [], total: 0, page: 1, pageSize: 25 });
  });

  it('throws NotFound when the blast does not exist', async () => {
    prisma.blast.findUnique.mockResolvedValue(null);
    await expect(service.listMessages('missing', {})).rejects.toBeInstanceOf(NotFoundException);
  });
});
```
> The `import { BadRequestException, NotFoundException }` line is used by Tasks 1–3; add it once at the top of the spec file if not already present.

- [ ] **Step 2: Run test, verify it fails**

Run: `pnpm --filter api test -- blasts.service`
Expected: FAIL — `service.listMessages is not a function`.

- [ ] **Step 3: Create the DTO** — `apps/api/src/blasts/dto/list-blast-messages.dto.ts`:

```ts
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { MessageStatus } from '@prisma/client';

export class ListBlastMessagesDto {
  @IsOptional() @IsEnum(MessageStatus)
  status?: MessageStatus;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  pageSize?: number = 25;
}
```

- [ ] **Step 4: Implement `listMessages`** — add to the `BlastsService` class in `blasts.service.ts`. Add the import near the other dto imports:

```ts
import { ListBlastMessagesDto } from './dto/list-blast-messages.dto';
```
Method (place after `stats`):

```ts
  async listMessages(id: string, dto: ListBlastMessagesDto) {
    await this.findOne(id); // 404 if missing
    const page = dto.page ?? 1;
    const pageSize = dto.pageSize ?? 25;
    const where: Prisma.MessageWhereInput = {
      blastId: id,
      ...(dto.status ? { status: dto.status } : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.message.count({ where }),
      this.prisma.message.findMany({
        where,
        orderBy: [{ sentAt: { sort: 'desc', nulls: 'last' } }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true, contactId: true, status: true, errorCode: true, errorMessage: true,
          sentAt: true, deliveredAt: true, readAt: true, repliedAt: true,
        },
      }),
    ]);
    const contactIds = [...new Set(rows.map((r) => r.contactId))];
    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, name: true, phoneE164: true },
    });
    const cmap = new Map(contacts.map((c) => [c.id, c]));
    const items = rows.map((r) => {
      const c = cmap.get(r.contactId);
      return {
        id: r.id,
        contactName: c?.name ?? null,
        contactPhone: c?.phoneE164 ?? '',
        status: r.status,
        errorCode: r.errorCode,
        errorMessage: r.errorMessage,
        sentAt: r.sentAt,
        deliveredAt: r.deliveredAt,
        readAt: r.readAt,
        repliedAt: r.repliedAt,
      };
    });
    return { items, total, page, pageSize };
  }
```
> `Prisma` is already imported in `blasts.service.ts` (`import { ..., Prisma } from '@prisma/client'`).

- [ ] **Step 5: Run test, verify it passes**

Run: `pnpm --filter api test -- blasts.service`
Expected: PASS (the 3 new listMessages cases + all pre-existing blasts.service cases).

- [ ] **Step 6: Add the controller route** — in `blasts.controller.ts`, add the import and a route after `stats()`:

```ts
import { ListBlastMessagesDto } from './dto/list-blast-messages.dto';
```
```ts
  @Get(':id/messages')
  messages(@Param('id') id: string, @Query() q: ListBlastMessagesDto) {
    return this.blasts.listMessages(id, q);
  }
```

- [ ] **Step 7: Build + commit**

Run: `pnpm --filter api build` (expect success).
```bash
git add apps/api/src/blasts
git commit -m "feat(api): GET /blasts/:id/messages (paginated per-recipient list)"
```

---

## Task 2: `POST /blasts/:id/messages/:messageId/retry`

**Files:**
- Modify: `apps/api/src/blasts/blasts.service.ts`
- Modify: `apps/api/src/blasts/blasts.controller.ts`
- Test: `apps/api/src/blasts/__tests__/blasts.service.spec.ts`

- [ ] **Step 1: Write the failing tests** — append to `blasts.service.spec.ts`:

```ts
describe('BlastsService.retryMessage', () => {
  let prisma: any; let queue: any; let service: BlastsService;
  beforeEach(() => {
    prisma = {
      message: {
        findUnique: jest.fn(),
        update: jest.fn().mockImplementation((a) => Promise.resolve({ id: a.where.id, ...a.data })),
      },
    };
    queue = { add: jest.fn() };
    service = new BlastsService(prisma, queue, {} as any, {} as any, {} as any);
  });

  it('rejects a non-FAILED message with BadRequest and enqueues nothing', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'b1', status: 'SENT' });
    await expect(service.retryMessage('b1', 'm1')).rejects.toBeInstanceOf(BadRequestException);
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('rejects a message belonging to another blast with NotFound', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'other', status: 'FAILED' });
    await expect(service.retryMessage('b1', 'm1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects a missing message with NotFound', async () => {
    prisma.message.findUnique.mockResolvedValue(null);
    await expect(service.retryMessage('b1', 'm1')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('resets a FAILED message to QUEUED, clears error + metaMessageId, enqueues one job', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'b1', status: 'FAILED' });
    const res = await service.retryMessage('b1', 'm1');
    expect(prisma.message.update).toHaveBeenCalledWith({
      where: { id: 'm1' },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    expect(queue.add).toHaveBeenCalledTimes(1);
    expect(queue.add.mock.calls[0][1]).toEqual({ messageId: 'm1' });
    expect(res.status).toBe('QUEUED');
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- blasts.service`
Expected: FAIL — `service.retryMessage is not a function`.

- [ ] **Step 3: Implement `retryMessage`** — add to `BlastsService` (after `listMessages`). `BadRequestException`/`NotFoundException` and `BLAST_QUEUE` are already imported/defined in this file:

```ts
  async retryMessage(blastId: string, messageId: string) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.blastId !== blastId) throw new NotFoundException();
    if (msg.status !== 'FAILED') throw new BadRequestException('Only failed messages can be retried');
    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    await this.queue.add(
      BLAST_QUEUE,
      { messageId },
      { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );
    return updated;
  }
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- blasts.service`
Expected: PASS.

- [ ] **Step 5: Add the controller route** — in `blasts.controller.ts`, after the `cancel()` route:

```ts
  @Post(':id/messages/:messageId/retry')
  retryMessage(@Param('id') id: string, @Param('messageId') messageId: string) {
    return this.blasts.retryMessage(id, messageId);
  }
```

- [ ] **Step 6: Build + commit**

Run: `pnpm --filter api build`.
```bash
git add apps/api/src/blasts
git commit -m "feat(api): POST /blasts/:id/messages/:messageId/retry (re-enqueue one failed)"
```

---

## Task 3: `POST /blasts/:id/retry-failed`

**Files:**
- Modify: `apps/api/src/blasts/blasts.service.ts`
- Modify: `apps/api/src/blasts/blasts.controller.ts`
- Test: `apps/api/src/blasts/__tests__/blasts.service.spec.ts`

- [ ] **Step 1: Write the failing tests** — append to `blasts.service.spec.ts`:

```ts
describe('BlastsService.retryFailed', () => {
  let prisma: any; let queue: any; let service: BlastsService;
  beforeEach(() => {
    prisma = {
      blast: { findUnique: jest.fn().mockResolvedValue({ id: 'b1' }) },
      message: { findMany: jest.fn(), updateMany: jest.fn().mockResolvedValue({ count: 0 }) },
    };
    queue = { add: jest.fn() };
    service = new BlastsService(prisma, queue, {} as any, {} as any, {} as any);
  });

  it('returns { retried: 0 } and enqueues nothing when there are no failures', async () => {
    prisma.message.findMany.mockResolvedValue([]);
    const res = await service.retryFailed('b1');
    expect(res).toEqual({ retried: 0 });
    expect(prisma.message.updateMany).not.toHaveBeenCalled();
    expect(queue.add).not.toHaveBeenCalled();
  });

  it('resets all FAILED to QUEUED and enqueues one job each', async () => {
    prisma.message.findMany.mockResolvedValue([{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }]);
    const res = await service.retryFailed('b1');
    expect(prisma.message.updateMany).toHaveBeenCalledWith({
      where: { blastId: 'b1', status: 'FAILED' },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    expect(queue.add).toHaveBeenCalledTimes(3);
    expect(res).toEqual({ retried: 3 });
  });

  it('throws NotFound when the blast does not exist', async () => {
    prisma.blast.findUnique.mockResolvedValue(null);
    await expect(service.retryFailed('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- blasts.service`
Expected: FAIL — `service.retryFailed is not a function`.

- [ ] **Step 3: Implement `retryFailed`** — add to `BlastsService` (after `retryMessage`):

```ts
  async retryFailed(blastId: string) {
    await this.findOne(blastId); // 404 if missing
    const failed = await this.prisma.message.findMany({
      where: { blastId, status: 'FAILED' },
      select: { id: true },
    });
    if (failed.length === 0) return { retried: 0 };
    await this.prisma.message.updateMany({
      where: { blastId, status: 'FAILED' },
      data: { status: 'QUEUED', errorCode: null, errorMessage: null, metaMessageId: null },
    });
    for (const m of failed) {
      await this.queue.add(
        BLAST_QUEUE,
        { messageId: m.id },
        { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );
    }
    return { retried: failed.length };
  }
```

- [ ] **Step 4: Run, verify pass + full suite**

Run: `pnpm --filter api test -- blasts.service` (expect PASS), then `pnpm --filter api test` (expect the full suite still green, e.g. 270+ tests).

- [ ] **Step 5: Add the controller route** — in `blasts.controller.ts`, after the retry-one route:

```ts
  @Post(':id/retry-failed')
  retryFailed(@Param('id') id: string) {
    return this.blasts.retryFailed(id);
  }
```

- [ ] **Step 6: Build + commit**

Run: `pnpm --filter api build`.
```bash
git add apps/api/src/blasts
git commit -m "feat(api): POST /blasts/:id/retry-failed (re-enqueue all failed)"
```

---

## Task 4: Demo-data generator — seed some FAILED messages

**Files:**
- Modify: `apps/api/prisma/seed-analytics.ts`

- [ ] **Step 1: Add a failure-codes constant** — near the existing `INTENTS`/`REASONS` constants at module scope:

```ts
const FAIL_CODES = [
  { code: '131026', message: 'Message undeliverable' },
  { code: '131047', message: 'Re-engagement message (24h window closed)' },
  { code: '132000', message: 'Template parameter count mismatch' },
  { code: '470', message: 'Message failed to send (re-engagement)' },
];
```

- [ ] **Step 2: Branch a small share of messages to FAILED** — in the per-day message loop, replace the body that currently builds each message:

```ts
    for (let i = 0; i < baseVolume; i++) {
      const b = pick(blasts);
      const sentAt = new Date(day.getTime() + intBetween(0, 10 * 3600) * 1000);
      const delivered = chance(0.96);
      const read = delivered && chance(0.71);
      const replied = read && chance(b.tpl.replyBias);
      msgData.push({
        blastId: b.id, contactId: pick(contacts).id, templateId: b.tpl.id,
        status: read ? 'READ' : delivered ? 'DELIVERED' : 'SENT',
        source: 'BLAST',
        sentAt,
        deliveredAt: delivered ? new Date(sentAt.getTime() + intBetween(20, 600) * 1000) : null,
        readAt: read ? new Date(sentAt.getTime() + intBetween(600, 5400) * 1000) : null,
        repliedAt: replied ? new Date(sentAt.getTime() + intBetween(5400, 14400) * 1000) : null,
      });
      msgCount++;
    }
```
with a version that fails ~3.5% of the time:

```ts
    for (let i = 0; i < baseVolume; i++) {
      const b = pick(blasts);
      const sentAt = new Date(day.getTime() + intBetween(0, 10 * 3600) * 1000);
      if (chance(0.035)) {
        const fc = pick(FAIL_CODES);
        msgData.push({
          blastId: b.id, contactId: pick(contacts).id, templateId: b.tpl.id,
          status: 'FAILED', source: 'BLAST', sentAt,
          deliveredAt: null, readAt: null, repliedAt: null,
          errorCode: fc.code, errorMessage: fc.message,
        });
        msgCount++;
        continue;
      }
      const delivered = chance(0.96);
      const read = delivered && chance(0.71);
      const replied = read && chance(b.tpl.replyBias);
      msgData.push({
        blastId: b.id, contactId: pick(contacts).id, templateId: b.tpl.id,
        status: read ? 'READ' : delivered ? 'DELIVERED' : 'SENT',
        source: 'BLAST',
        sentAt,
        deliveredAt: delivered ? new Date(sentAt.getTime() + intBetween(20, 600) * 1000) : null,
        readAt: read ? new Date(sentAt.getTime() + intBetween(600, 5400) * 1000) : null,
        repliedAt: replied ? new Date(sentAt.getTime() + intBetween(5400, 14400) * 1000) : null,
      });
      msgCount++;
    }
```
(`msgData` is typed `any[]`, so the extra `errorCode`/`errorMessage` fields typecheck fine.)

- [ ] **Step 3: Typecheck** (live seed run stays DEFERRED — no Postgres)

Run (from `apps/api`): `npx tsc --noEmit -p tsconfig.json`
Expected: no errors. (Do NOT run `pnpm db:seed:analytics` — needs Postgres.)

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/seed-analytics.ts
git commit -m "feat(api): seed ~3.5% FAILED messages so per-recipient retry is demoable"
```

---

## Task 5: Web client functions

**Files:**
- Modify: `apps/web/src/api/blasts.ts`

- [ ] **Step 1: Add types + client fns** — append to `apps/web/src/api/blasts.ts`:

```ts
export interface BlastMessage {
  id: string;
  contactName: string | null;
  contactPhone: string;
  status: MessageStatus;
  errorCode: string | null;
  errorMessage: string | null;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  repliedAt: string | null;
}

export interface BlastMessagesPage {
  items: BlastMessage[];
  total: number;
  page: number;
  pageSize: number;
}

export async function listBlastMessages(
  id: string,
  params: { status?: MessageStatus; page?: number; pageSize?: number } = {},
): Promise<BlastMessagesPage> {
  const { data } = await api.get<BlastMessagesPage>(`/blasts/${id}/messages`, { params });
  return data;
}

export async function retryBlastMessage(
  id: string,
  messageId: string,
): Promise<{ id: string; status: MessageStatus }> {
  const { data } = await api.post<{ id: string; status: MessageStatus }>(
    `/blasts/${id}/messages/${messageId}/retry`,
  );
  return data;
}

export async function retryFailedMessages(id: string): Promise<{ retried: number }> {
  const { data } = await api.post<{ retried: number }>(`/blasts/${id}/retry-failed`);
  return data;
}
```
(`MessageStatus` and `api` are already in this file.)

- [ ] **Step 2: Typecheck + commit**

Run: `pnpm --filter web build` (expect success).
```bash
git add apps/web/src/api/blasts.ts
git commit -m "feat(web): blast per-recipient + retry client fns"
```

---

## Task 6: Recipients table in `CampaignDetail.tsx`

**Files:**
- Modify: `apps/web/src/pages/CampaignDetail.tsx`

> Read the full current file first (the placeholder is the "Recipients" card around lines 311-325). Match structure, not exact line numbers.

- [ ] **Step 1: Update imports** — change the `react` import (line 1) and add three component/client imports:

```ts
import { useState, useCallback, type ReactElement } from 'react';
```
Extend the `api/blasts` import to add the new fns + `BlastMessage`:
```ts
import {
  cancelBlast, getBlast, getBlastStats,
  listBlastMessages, retryBlastMessage, retryFailedMessages,
  type BlastStatus, type MessageStatus, type BlastMessage,
} from '../api/blasts';
```
Add component imports (near the other `components/ui` imports):
```ts
import Pagination from '../components/Pagination';
import Toast from '../components/Toast';
```

- [ ] **Step 2: Add module-scope config** — near the top (e.g. after `STATUS_CFG`):

```ts
const MSG_STATUS_CFG: Record<MessageStatus, { tone: BadgeTone; label: string }> = {
  QUEUED:    { tone: 'neutral', label: 'Queued' },
  SENT:      { tone: 'blue',    label: 'Sent' },
  DELIVERED: { tone: 'brand',   label: 'Delivered' },
  READ:      { tone: 'success', label: 'Read' },
  FAILED:    { tone: 'red',     label: 'Failed' },
  CANCELED:  { tone: 'neutral', label: 'Canceled' },
};

const MSG_FILTERS: (MessageStatus | 'ALL')[] = ['ALL', 'FAILED', 'DELIVERED', 'READ', 'SENT', 'QUEUED'];
```
(`BadgeTone` is already imported in this file.)

- [ ] **Step 3: Add state, toast, queries, mutations** — inside `CampaignDetail()`, after the existing `cancel` mutation:

```ts
  const [statusFilter, setStatusFilter] = useState<MessageStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const showToast = useCallback(
    (message: string, variant: 'success' | 'error' = 'success') => setToast({ message, variant }),
    [],
  );

  const messagesQ = useQuery({
    queryKey: ['blast-messages', id, statusFilter, page],
    queryFn: () => listBlastMessages(id!, {
      status: statusFilter === 'ALL' ? undefined : statusFilter,
      page,
      pageSize: 25,
    }),
    refetchInterval: (q) => {
      const activeBlast = !!blast && ACTIVE_STATUSES.includes(blast.status);
      const hasQueued = (q.state.data?.items ?? []).some((m: BlastMessage) => m.status === 'QUEUED');
      return activeBlast || hasQueued ? 5000 : false;
    },
  });

  const retryOne = useMutation({
    mutationFn: (messageId: string) => retryBlastMessage(id!, messageId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blast-messages', id] });
      qc.invalidateQueries({ queryKey: ['blast-stats', id] });
      showToast('Retrying message…');
    },
    onError: () => showToast('Retry failed', 'error'),
  });

  const retryAll = useMutation({
    mutationFn: () => retryFailedMessages(id!),
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['blast-messages', id] });
      qc.invalidateQueries({ queryKey: ['blast-stats', id] });
      showToast(r.retried > 0
        ? `Retrying ${r.retried} failed message${r.retried === 1 ? '' : 's'}…`
        : 'No failed messages to retry');
    },
    onError: () => showToast('Retry failed', 'error'),
  });
```
> `blast` is referenced in `refetchInterval`; the early `if (!blast || !stats)` return is below these hooks (hooks must run unconditionally), so keep these declarations ABOVE that early return.

- [ ] **Step 4: Replace the Recipients card** — replace the whole placeholder block (the `<div className="v-card">…Per-recipient delivery status is not yet available…</div>`) with:

```tsx
      {/* ── recipients ── */}
      <div className="v-card" style={{ padding: '20px 22px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Recipients</h2>
          <Button
            variant="secondary" size="sm" data-testid="retry-all-failed"
            disabled={retryAll.isPending}
            onClick={() => retryAll.mutate()}
          >
            {retryAll.isPending ? 'Retrying…' : 'Retry all failed'}
          </Button>
        </div>

        <div data-testid="recipient-status-filter" style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {MSG_FILTERS.map((f) => {
            const active = statusFilter === f;
            return (
              <button
                key={f}
                onClick={() => { setStatusFilter(f); setPage(1); }}
                style={{
                  padding: '4px 12px', borderRadius: 99, fontSize: 12.5, fontWeight: 500, cursor: 'pointer',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'var(--accent-fill)' : 'var(--bg)',
                  color: active ? 'var(--accent-text)' : 'var(--text-muted)',
                }}
              >
                {f === 'ALL' ? 'All' : MSG_STATUS_CFG[f].label}
              </button>
            );
          })}
        </div>

        {messagesQ.isLoading && (
          <div style={{ padding: '18px 4px', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
        )}

        {!messagesQ.isLoading && (messagesQ.data?.items.length ?? 0) === 0 && (
          <div style={{ padding: '18px 4px', color: 'var(--text-muted)', fontSize: 13 }}>
            No recipients{statusFilter !== 'ALL' ? ` with status ${MSG_STATUS_CFG[statusFilter].label}` : ''} yet.
          </div>
        )}

        {!messagesQ.isLoading && (messagesQ.data?.items.length ?? 0) > 0 && (
          <table data-testid="recipients-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: 'var(--text-muted)', fontSize: 12 }}>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Recipient</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Status</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Detail</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }}>Sent</th>
                <th style={{ padding: '6px 8px', fontWeight: 500 }} aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {messagesQ.data!.items.map((m) => {
                const cfg = MSG_STATUS_CFG[m.status];
                const rowPending = retryOne.isPending && retryOne.variables === m.id;
                return (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '9px 8px' }}>
                      <div style={{ fontWeight: 500 }}>{m.contactName ?? '—'}</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5, color: 'var(--text-muted)' }}>{m.contactPhone}</div>
                    </td>
                    <td style={{ padding: '9px 8px' }}><Badge tone={cfg.tone}>{cfg.label}</Badge></td>
                    <td style={{ padding: '9px 8px', color: 'var(--text-muted)', maxWidth: 280 }}>
                      {m.status === 'FAILED' && m.errorMessage
                        ? <span><span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11.5 }}>{m.errorCode}</span> · {m.errorMessage}</span>
                        : '—'}
                    </td>
                    <td style={{ padding: '9px 8px', color: 'var(--text-muted)', fontSize: 12 }}>{fmtDateTime(m.sentAt)}</td>
                    <td style={{ padding: '9px 8px', textAlign: 'right' }}>
                      {m.status === 'FAILED' && (
                        <Button
                          variant="ghost" size="sm" data-testid="retry-message"
                          disabled={rowPending}
                          onClick={() => retryOne.mutate(m.id)}
                        >
                          {rowPending ? 'Retrying…' : 'Retry'}
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {(messagesQ.data?.total ?? 0) > 25 && (
          <Pagination page={page} pageSize={25} total={messagesQ.data!.total} onPageChange={setPage} />
        )}
      </div>
```

- [ ] **Step 5: Render the Toast** — just before the closing `</Page>` tag, add:

```tsx
      <Toast message={toast?.message ?? null} variant={toast?.variant} onDismiss={() => setToast(null)} />
```

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter web build`
Expected: success. Fix any type issues (e.g. confirm `IcCheckCircle` is still imported only if still used — the old completed-note block is inside the replaced card; if you removed its only use, drop the unused import the compiler flags).

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/pages/CampaignDetail.tsx
git commit -m "feat(web): per-recipient delivery table + per-row/bulk retry on CampaignDetail"
```

---

## Task 7: E2E spec (run deferred)

**Files:**
- Create: `e2e/tests/campaign-recipients.spec.ts`

> Run is DEFERRED (needs Postgres + dev servers + browsers). Write a well-formed spec mirroring `e2e/tests/blasts.spec.ts` (local `loginAsAdmin`, testids). Do NOT run `pnpm --filter e2e test`.

- [ ] **Step 1: Inspect** `e2e/tests/blasts.spec.ts` for the login helper + how it opens a campaign.

- [ ] **Step 2: Create `e2e/tests/campaign-recipients.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

test.describe('Campaign per-recipient delivery', () => {
  test('opens a campaign and shows the recipients table with a status filter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Campaigns' }).click();

    // Open the first campaign in the list (seeded "Historical ·" blasts exist after db:seed:analytics)
    await page.locator('a[href^="/blasts/"]').first().click();
    await expect(page).toHaveURL(/\/blasts\/[a-f0-9-]+/i);

    // Recipients section: status filter + table render
    await expect(page.getByTestId('recipient-status-filter')).toBeVisible();
    await expect(page.getByTestId('recipients-table')).toBeVisible();

    // Filtering to Failed surfaces failed rows (seeded ~3.5% failures) with a Retry button
    await page.getByTestId('recipient-status-filter').getByRole('button', { name: 'Failed' }).click();
    await expect(page.getByTestId('retry-message').first()).toBeVisible();
  });
});
```
> If the Campaigns list uses row click handlers (not `<a href>`), adapt the selector to click the first campaign card; the rest of the assertions stand.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/campaign-recipients.spec.ts
git commit -m "test(e2e): campaign per-recipient delivery table + retry (run deferred)"
```

---

## Final verification

- [ ] `pnpm --filter api test` — all green (existing + new blasts.service cases).
- [ ] `pnpm --filter api build` and `pnpm --filter web build` — both compile.
- [ ] Live-DB verification (deferred — needs Postgres + servers): `docker compose up -d && pnpm db:seed && pnpm db:seed:analytics`; open a campaign → recipients table populates, Failed filter shows failures, Retry / Retry-all move rows to Queued then resolve; `pnpm --filter e2e test -- campaign-recipients`.

---

## Self-review notes (author)

- **Spec coverage:** §3.1 list → Task 1; §3.2 retry-one → Task 2; §3.3 retry-all → Task 3; §3.5 demo failures → Task 4; §3.4 frontend (client + table + filter + pagination + per-row/bulk retry + polling + toast) → Tasks 5–6; §6 tests → unit in Tasks 1–3 + e2e in Task 7. Deferred items (pause/resume/etc., CSV export) correctly untouched.
- **Type consistency:** `RecipientRow`/`BlastMessage` fields match between the service (Task 1) and the client (Task 5); `BlastMessagesPage` shape (`items/total/page/pageSize`) is consistent; retry job payload is always `{ messageId }`; the queue option `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }` is identical across Tasks 2–3.
- **No placeholders:** every code step shows complete code; commands have expected output; the only deferral (live DB/e2e run) is explicit and environmental, not a TODO.
- **Hooks ordering:** Task 6 Step 3 explicitly notes the new hooks must sit above the `if (!blast || !stats) return` early return (React rules-of-hooks).
