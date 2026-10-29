# Phase 3 — Escalation / Ticketing (backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the Autopilot bot's escalations into a real "Needs Human" work queue: a `Ticket` model (`TCK-####`), a lifecycle API (assign → resolve → close → reopen), and wiring so every bot escalation creates a ticket. Tickets carry the escalation reason, intent, and assignee so support agents can work them.

**Architecture:** A `tickets` NestJS module (service + controller + DTOs) backed by a new `Ticket` model (status, reason reusing the Phase 2 `EscalationReason`, intent, assignee FK → User, contact FK → Contact, lifecycle timestamps, `seq` autoincrement formatted as `TCK-####`). `AutopilotService` (Phase 2) gains a private `escalate()` that logs the `AutopilotEvent` **and** creates a `Ticket` via `TicketsService`. Ticket routes are available to both roles (Support works tickets; Super Admin too) — `JwtAuthGuard` only, like the inbox.

**Tech Stack:** NestJS 10, Prisma 5, class-validator, Jest, pnpm.

**Source spec:** `docs/superpowers/specs/2026-06-04-eauto-dealer-ai-pivot-design.md` (§2 pillar 2, §5).

**Branch:** Create `feat/eauto-ticketing` off `feat/eauto-autopilot-bot` (Phase 2) — or off `master` after PRs #10/#11/#12 merge. Depends on Phase 2 (`EscalationReason` enum, `AutopilotEvent`, `AutopilotService`).

**Depends on (already built):**
- `EscalationReason` enum (COMPLAINT/LOW_CONFIDENCE/KNOWLEDGE_GAP/SENSITIVE) and `AutopilotEvent` model (Phase 2).
- `AutopilotService.handleInbound` (Phase 2) — its three `ESCALATED` branches currently call `this.log(...)`; this plan routes them through a new `escalate()` that also creates a ticket. `log()` will return the created event so the ticket can link to it.
- `Contact` model (id, name, phoneE164, dealer fields) and `User` model (id, name, email).
- RBAC: controller-level `@UseGuards(JwtAuthGuard)` (both roles) — mirrors `inbox`/`segments`/`blasts` controllers.

**Scope note:** Backend only. The inbox "Needs Human" UI (ticket list, ticket detail, escalation divider, agent composer, status timeline), the dealer-context panel, and the escalation badges/counts are built after Plan 0B (frontend shell). Ticket lifecycle is kept decoupled from `InboxConversationState` resolution — the agent replies via the existing inbox (which resolves the conversation) and resolves the ticket separately; the UI coordinates the two. Manual ticket creation (no escalation) is out of scope — tickets originate from bot escalations + the seed.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/prisma/schema.prisma` | `TicketStatus` enum + `Ticket` model + back-relations on `Contact`/`User`. |
| `apps/api/prisma/migrations/*` | Generated additive migration. |
| `apps/api/src/tickets/tickets.service.ts` | Lifecycle + queries + `createFromEscalation` + `formatTicketNum`. |
| `apps/api/src/tickets/__tests__/tickets.service.spec.ts` | Service unit tests (mocked Prisma). |
| `apps/api/src/tickets/dto/list-tickets.dto.ts` | List query filters. |
| `apps/api/src/tickets/dto/assign-ticket.dto.ts` | Assign payload. |
| `apps/api/src/tickets/tickets.controller.ts` | HTTP routes (both roles). |
| `apps/api/src/tickets/tickets.module.ts` | Wires service + controller; exports service. |
| `apps/api/src/autopilot/autopilot.service.ts` | `log()` returns the event; new `escalate()` logs + creates a ticket. |
| `apps/api/src/autopilot/autopilot.module.ts` | Import `TicketsModule`. |
| `apps/api/src/autopilot/__tests__/autopilot.service.spec.ts` | Add tickets mock; assert ticket creation on escalation. |
| `apps/api/src/app.module.ts` | Register `TicketsModule`. |
| `apps/api/prisma/seed.ts` | Seed a few escalation tickets for the demo queue. |

---

## Task 1: Ticket model + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create (generated): `apps/api/prisma/migrations/<timestamp>_add_ticket/`

- [ ] **Step 1: Append the enum + model** at the END of `apps/api/prisma/schema.prisma`:

```prisma
enum TicketStatus {
  OPEN
  IN_PROGRESS
  RESOLVED
  CLOSED
}

model Ticket {
  id               String           @id @default(uuid()) @db.Uuid
  seq              Int              @unique @default(autoincrement())
  contactId        String           @map("contact_id") @db.Uuid
  status           TicketStatus     @default(OPEN)
  reason           EscalationReason
  intent           String?
  assigneeId       String?          @map("assignee_id") @db.Uuid
  autopilotEventId String?          @map("autopilot_event_id") @db.Uuid
  openedAt         DateTime         @default(now()) @map("opened_at")
  assignedAt       DateTime?        @map("assigned_at")
  resolvedAt       DateTime?        @map("resolved_at")
  closedAt         DateTime?        @map("closed_at")
  createdAt        DateTime         @default(now()) @map("created_at")
  updatedAt        DateTime         @updatedAt @map("updated_at")

  contact          Contact          @relation(fields: [contactId], references: [id], onDelete: Cascade)
  assignee         User?            @relation(fields: [assigneeId], references: [id], onDelete: SetNull)

  @@index([status])
  @@index([contactId])
  @@index([assigneeId])
  @@map("tickets")
}
```

- [ ] **Step 2: Add the back-relations** (additive virtual fields — no new columns on these tables).
In the `Contact` model, add (e.g. after the `inboxState InboxConversationState?` line):
```prisma
  tickets             Ticket[]
```
In the `User` model, add (e.g. after the `updatedAt` line):
```prisma
  assignedTickets Ticket[]
```

- [ ] **Step 3: Validate.** Run: `pnpm --filter api exec prisma validate` → expect valid.

- [ ] **Step 4: Migrate** (Postgres up; `docker compose up -d` from repo root if needed). Run: `pnpm --filter api exec prisma migrate dev --name add_ticket` → expect "Your database is now in sync" + "Generated Prisma Client". The SQL should be additive: `CREATE TYPE "TicketStatus"`, `CREATE TABLE "tickets"` with two FK constraints, indexes — no DROP/ALTER of existing tables.

- [ ] **Step 5: Commit.**
```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): add Ticket model"
```

---

## Task 2: TicketsService (lifecycle + queries, TDD)

**Files:**
- Create: `apps/api/src/tickets/tickets.service.ts`
- Test: `apps/api/src/tickets/__tests__/tickets.service.spec.ts`

- [ ] **Step 1: Write the FAILING test.** Create `apps/api/src/tickets/__tests__/tickets.service.spec.ts`:

```ts
import { NotFoundException } from '@nestjs/common';
import { TicketsService, formatTicketNum } from '../tickets.service';

function makePrisma() {
  return {
    ticket: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
}

describe('formatTicketNum', () => {
  it('formats seq as TCK-#### offset by 1000', () => {
    expect(formatTicketNum(1)).toBe('TCK-1001');
    expect(formatTicketNum(48)).toBe('TCK-1048');
  });
});

describe('TicketsService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: TicketsService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new TicketsService(prisma as any);
  });

  it('createFromEscalation creates an OPEN ticket with reason + intent + event link', async () => {
    prisma.ticket.create.mockResolvedValue({ id: 't1' });
    await service.createFromEscalation({ contactId: 'c1', reason: 'LOW_CONFIDENCE', intent: 'transfer_support', autopilotEventId: 'e1' });
    expect(prisma.ticket.create).toHaveBeenCalledWith({
      data: { contactId: 'c1', reason: 'LOW_CONFIDENCE', intent: 'transfer_support', autopilotEventId: 'e1', status: 'OPEN' },
    });
  });

  it('list active filters to non-closed statuses, newest-first, enriched with num', async () => {
    prisma.ticket.findMany.mockResolvedValue([{ id: 't1', seq: 2, status: 'OPEN', contact: { name: 'X' }, assignee: null }]);
    const result = await service.list({ tab: 'active' });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { status: { in: ['OPEN', 'IN_PROGRESS', 'RESOLVED'] } },
      orderBy: { openedAt: 'desc' },
    }));
    expect(result[0].num).toBe('TCK-1002');
  });

  it('list closed filters to CLOSED', async () => {
    prisma.ticket.findMany.mockResolvedValue([]);
    await service.list({ tab: 'closed' });
    expect(prisma.ticket.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'CLOSED' } }));
  });

  it('assign sets IN_PROGRESS + assignee + assignedAt', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', seq: 1, assigneeId: 'u1', status: 'IN_PROGRESS', contact: {}, assignee: {} });
    await service.assign('t1', 'u1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 't1' },
      data: expect.objectContaining({ status: 'IN_PROGRESS', assigneeId: 'u1', assignedAt: expect.any(Date) }),
    }));
  });

  it('resolve sets RESOLVED + resolvedAt; close sets CLOSED + closedAt', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', seq: 1, status: 'RESOLVED', contact: {}, assignee: null });
    await service.resolve('t1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'RESOLVED', resolvedAt: expect.any(Date) }) }));
    await service.close('t1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'CLOSED', closedAt: expect.any(Date) }) }));
  });

  it('reopen sets OPEN and clears resolved/closed timestamps', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1' });
    prisma.ticket.update.mockResolvedValue({ id: 't1', seq: 1, status: 'OPEN', contact: {}, assignee: null });
    await service.reopen('t1');
    expect(prisma.ticket.update).toHaveBeenCalledWith(expect.objectContaining({ data: { status: 'OPEN', resolvedAt: null, closedAt: null } }));
  });

  it('get throws NotFound when the ticket is missing', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    await expect(service.get('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
```

- [ ] **Step 2: Run it, verify it FAILS.**
Run: `pnpm --filter api exec jest src/tickets/__tests__/tickets.service --silent`
Expected: FAIL — cannot find module '../tickets.service'.

- [ ] **Step 3: Implement.** Create `apps/api/src/tickets/tickets.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { EscalationReason, Prisma, Ticket, TicketStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/** Display id for a ticket, e.g. seq 48 -> "TCK-1048". */
export function formatTicketNum(seq: number): string {
  return `TCK-${1000 + seq}`;
}

const TICKET_INCLUDE = {
  contact: true,
  assignee: { select: { id: true, name: true, email: true } },
} satisfies Prisma.TicketInclude;

const ACTIVE_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED'];

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Called by the Autopilot bot when it escalates an inbound message. */
  createFromEscalation(input: {
    contactId: string;
    reason: EscalationReason;
    intent?: string | null;
    autopilotEventId?: string | null;
  }): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: {
        contactId: input.contactId,
        reason: input.reason,
        intent: input.intent ?? null,
        autopilotEventId: input.autopilotEventId ?? null,
        status: 'OPEN',
      },
    });
  }

  async list(opts: { tab?: 'active' | 'closed'; status?: TicketStatus[]; assigneeId?: string }) {
    const where: Prisma.TicketWhereInput = {};
    if (opts.status?.length) where.status = { in: opts.status };
    else if (opts.tab === 'closed') where.status = 'CLOSED';
    else if (opts.tab === 'active') where.status = { in: ACTIVE_STATUSES };
    if (opts.assigneeId) where.assigneeId = opts.assigneeId;

    const tickets = await this.prisma.ticket.findMany({
      where,
      orderBy: { openedAt: 'desc' },
      include: TICKET_INCLUDE,
    });
    return tickets.map((t) => this.enrich(t));
  }

  async get(id: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: TICKET_INCLUDE });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return this.enrich(ticket);
  }

  async assign(id: string, assigneeId: string) {
    await this.getOrThrow(id);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'IN_PROGRESS', assigneeId, assignedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  async resolve(id: string) {
    await this.getOrThrow(id);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  async close(id: string) {
    await this.getOrThrow(id);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  async reopen(id: string) {
    await this.getOrThrow(id);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'OPEN', resolvedAt: null, closedAt: null },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  private enrich<T extends { seq: number }>(ticket: T): T & { num: string } {
    return { ...ticket, num: formatTicketNum(ticket.seq) };
  }

  private async getOrThrow(id: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }
}
```

- [ ] **Step 4: Run it, verify it PASSES (8 tests).**
Run: `pnpm --filter api exec jest src/tickets/__tests__/tickets.service --silent`

- [ ] **Step 5: Commit.**
```bash
git add apps/api/src/tickets/tickets.service.ts apps/api/src/tickets/__tests__/tickets.service.spec.ts
git commit -m "feat(api): add TicketsService (lifecycle, queries, createFromEscalation)"
```

---

## Task 3: DTOs, controller, module, wiring

**Files:**
- Create: `apps/api/src/tickets/dto/list-tickets.dto.ts`
- Create: `apps/api/src/tickets/dto/assign-ticket.dto.ts`
- Create: `apps/api/src/tickets/tickets.controller.ts`
- Create: `apps/api/src/tickets/tickets.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create `dto/list-tickets.dto.ts`:**
```ts
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';

export class ListTicketsDto {
  @IsOptional()
  @IsEnum(['active', 'closed'])
  tab?: 'active' | 'closed';

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'], { each: true })
  status?: ('OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED')[];

  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
```

- [ ] **Step 2: Create `dto/assign-ticket.dto.ts`:**
```ts
import { IsOptional, IsUUID } from 'class-validator';

export class AssignTicketDto {
  /** Optional — defaults to the requesting user (self-assign). */
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
```

- [ ] **Step 3: Create `tickets.controller.ts`** (both roles — `JwtAuthGuard` only, mirrors the inbox controller):
```ts
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TicketsService } from './tickets.service';
import { ListTicketsDto } from './dto/list-tickets.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  list(@Query() query: ListTicketsDto) {
    return this.tickets.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.tickets.get(id);
  }

  @Post(':id/assign')
  assign(@Param('id') id: string, @Body() dto: AssignTicketDto, @Req() req: Request) {
    const assigneeId = dto.assigneeId ?? (req.user as { id: string }).id;
    return this.tickets.assign(id, assigneeId);
  }

  @Post(':id/resolve')
  resolve(@Param('id') id: string) {
    return this.tickets.resolve(id);
  }

  @Post(':id/close')
  close(@Param('id') id: string) {
    return this.tickets.close(id);
  }

  @Post(':id/reopen')
  reopen(@Param('id') id: string) {
    return this.tickets.reopen(id);
  }
}
```

- [ ] **Step 4: Create `tickets.module.ts`:**
```ts
import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
```

- [ ] **Step 5: Register in `apps/api/src/app.module.ts`** — add `import { TicketsModule } from './tickets/tickets.module';` and add `TicketsModule,` to the `imports` array (after `AutopilotModule,`).

- [ ] **Step 6: Verify build + tickets tests.**
Run: `pnpm --filter api exec jest src/tickets --silent && pnpm --filter api build`
Expected: tickets tests pass; build clean.

- [ ] **Step 7: Commit.**
```bash
git add apps/api/src/tickets apps/api/src/app.module.ts
git commit -m "feat(api): add tickets HTTP API (assign/resolve/close/reopen)"
```

---

## Task 4: Wire bot escalations to create tickets

**Files:**
- Modify: `apps/api/src/autopilot/autopilot.service.ts`
- Modify: `apps/api/src/autopilot/autopilot.module.ts`
- Modify: `apps/api/src/autopilot/__tests__/autopilot.service.spec.ts`

- [ ] **Step 1: Update the test first (TDD).** In `apps/api/src/autopilot/__tests__/autopilot.service.spec.ts`:
(a) In `makeDeps`, add a tickets mock and pass it to the constructor as the LAST argument:
```ts
  const tickets = { createFromEscalation: jest.fn().mockResolvedValue({ id: 't1' }) };
  const service = new AutopilotService(knowledge as any, llm as any, settings as any, whatsapp as any, prisma as any, tickets as any);
  return { service, prisma, settings, llm, knowledge, whatsapp, tickets };
```
(b) In each of the three escalation tests (COMPLAINT, KNOWLEDGE_GAP, LOW_CONFIDENCE), destructure `tickets` and add an assertion that a ticket was created with the matching reason. For the COMPLAINT test:
```ts
    const { service, prisma, knowledge, whatsapp, tickets } = makeDeps({ llm: { classifyIntent: jest.fn().mockResolvedValue({ intent: 'complaint', confidence: 0.9 }) } });
    await service.handleInbound(INBOUND);
    // ...existing assertions...
    expect(tickets.createFromEscalation).toHaveBeenCalledWith(expect.objectContaining({ contactId: 'c1', reason: 'COMPLAINT' }));
```
Do the same for KNOWLEDGE_GAP (reason 'KNOWLEDGE_GAP') and LOW_CONFIDENCE (reason 'LOW_CONFIDENCE').
(c) In the AUTO_REPLIED and OPTED_OUT/SKIPPED tests, assert NO ticket was created:
```ts
    expect(tickets.createFromEscalation).not.toHaveBeenCalled();
```

- [ ] **Step 2: Run the autopilot tests, verify they FAIL** (constructor arity + missing ticket calls).
Run: `pnpm --filter api exec jest src/autopilot/__tests__/autopilot.service --silent`
Expected: FAIL.

- [ ] **Step 3: Update `apps/api/src/autopilot/autopilot.service.ts`:**
(a) Add the import:
```ts
import { TicketsService } from '../tickets/tickets.service';
```
(b) Add `TicketsService` as the LAST constructor parameter:
```ts
    private readonly prisma: PrismaService,
    private readonly tickets: TicketsService,
  ) {}
```
(c) Replace the three `await this.log(inbound, { action: 'ESCALATED', ... });` calls with `await this.escalate(...)`:
- sensitive guardrail branch → `await this.escalate(inbound, { reason: guardReason, intent });`
- knowledge-gap branch → `await this.escalate(inbound, { reason: 'KNOWLEDGE_GAP', intent });`
- low-confidence branch → `await this.escalate(inbound, { reason: 'LOW_CONFIDENCE', intent, confidence: reply.confidence });`
(d) Change `log()` to RETURN the created event (so the ticket can link to it). Change its signature/return:
```ts
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
  ) {
    return this.prisma.autopilotEvent.create({
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
```
(e) Add the new private `escalate()` method (logs the event, then creates a linked ticket):
```ts
  private async escalate(
    inbound: InboundForBot,
    fields: { reason: 'COMPLAINT' | 'LOW_CONFIDENCE' | 'KNOWLEDGE_GAP' | 'SENSITIVE'; intent?: string; confidence?: number },
  ): Promise<void> {
    const event = await this.log(inbound, {
      action: 'ESCALATED',
      reason: fields.reason,
      intent: fields.intent,
      confidence: fields.confidence,
    });
    await this.tickets.createFromEscalation({
      contactId: inbound.contactId,
      reason: fields.reason,
      intent: fields.intent ?? null,
      autopilotEventId: event.id,
    });
  }
```

- [ ] **Step 4: Import `TicketsModule` in `apps/api/src/autopilot/autopilot.module.ts`.** Add `import { TicketsModule } from '../tickets/tickets.module';` and add `TicketsModule,` to the `imports` array (alongside `KnowledgeModule` and `forwardRef(() => WhatsappModule)`). No new cycle — `TicketsModule` does not import `AutopilotModule`.

- [ ] **Step 5: Run the autopilot tests, verify they PASS.**
Run: `pnpm --filter api exec jest src/autopilot --silent`
Expected: PASS (6 service tests + policy tests).

- [ ] **Step 6: Full build + suite + DI boot.**
Run: `pnpm --filter api build` → no TS errors.
Run: `pnpm --filter api test` → all suites pass.
DI boot (confirm no wiring regression): from `apps/api`, after build, run the boot check against the compiled `app.module` (the path is `dist/src/app.module` in this project):
`node -e "require('reflect-metadata');const{NestFactory}=require('@nestjs/core');const{AppModule}=require('./dist/src/app.module');NestFactory.create(AppModule,{logger:false}).then(a=>a.close()).then(()=>console.log('DI boot OK')).catch(e=>{console.error('DI BOOT FAILED:',e.message);process.exit(1)})"`
Expected: `DI boot OK` (Redis connection noise is fine if Docker isn't running).

- [ ] **Step 7: Commit.**
```bash
git add apps/api/src/autopilot
git commit -m "feat(api): create a ticket on every Autopilot escalation"
```

---

## Task 5: Seed demo tickets

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Add a ticket seed block.** In `apps/api/prisma/seed.ts`, after the knowledge-base seed loop (and before `main`'s closing brace), add (idempotent — only seeds when the table is empty; links to seeded dealers by phone and optionally assigns to the admin user):

```ts
  if ((await prisma.ticket.count()) === 0) {
    const adminUser = await prisma.user.findUnique({ where: { email } });
    const dealerByPhone = async (raw: string) =>
      prisma.contact.findUnique({ where: { phoneE164: toE164(raw) } });

    const seedTickets: { phone: string; reason: 'COMPLAINT' | 'LOW_CONFIDENCE' | 'KNOWLEDGE_GAP' | 'SENSITIVE'; intent: string; assign: boolean; status: 'OPEN' | 'IN_PROGRESS' }[] = [
      { phone: '13-554 9082', reason: 'KNOWLEDGE_GAP', intent: 'transfer_support', assign: false, status: 'OPEN' },        // JB Used Cars
      { phone: '12-345 6789', reason: 'COMPLAINT', intent: 'complaint', assign: true, status: 'IN_PROGRESS' },             // Auto Bestari
      { phone: '19-770 2210', reason: 'LOW_CONFIDENCE', intent: 'credit_topup', assign: false, status: 'OPEN' },           // Penang Auto Mart
    ];

    let createdTickets = 0;
    for (const t of seedTickets) {
      const dealer = await dealerByPhone(t.phone);
      if (!dealer) continue;
      await prisma.ticket.create({
        data: {
          contactId: dealer.id,
          reason: t.reason,
          intent: t.intent,
          status: t.status,
          assigneeId: t.assign ? adminUser?.id ?? null : null,
          assignedAt: t.assign ? new Date() : null,
        },
      });
      createdTickets++;
    }
    console.log(`Seeded ${createdTickets} ticket(s).`);
  } else {
    console.log('Tickets already exist — skipping.');
  }
```

- [ ] **Step 2: Run the seed.** Run: `pnpm --filter api db:seed` → expect `Seeded 3 ticket(s).`

- [ ] **Step 3: Verify idempotency + counts.** Run again: `pnpm --filter api db:seed` → expect `Tickets already exist — skipping.`
Then from `apps/api`:
`node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.ticket.findMany({select:{seq:true,status:true,reason:true,assigneeId:true}}).then(r=>{console.log(r);return p.$disconnect()})"`
Expected: 3 tickets — two OPEN (unassigned), one IN_PROGRESS (assigned), with seq values present (→ TCK-1001/1002/1003).

- [ ] **Step 4: Commit.**
```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed demo escalation tickets"
```

---

## Self-Review

**Spec coverage (§2 pillar 2, §5):**
- `Ticket` model: num (`seq`→`TCK-####`), contactId, status (OPEN/IN_PROGRESS/RESOLVED/CLOSED), reason (reuses `EscalationReason`), intent, assigneeId, lifecycle timestamps, `autopilotEventId` link → Task 1 + Task 2 ✅
- Lifecycle API: assign / resolve / close / reopen → Task 2 + Task 3 ✅
- Create-on-escalation (the bot) → Task 4 (`escalate()` → `createFromEscalation`) ✅
- "Needs Human" queue (Active/Closed) → Task 2 `list` tab filter + Task 3 `GET /tickets` ✅
- Both roles work tickets (Support + Super Admin) → Task 3 (`JwtAuthGuard` only, no `@Roles`) ✅
- Demo queue data → Task 5 seed ✅

**Deferred (stated, not dropped):** the inbox dual-mode UI, ticket detail/thread view, escalation divider, agent composer + saved replies, status timeline, dealer-context panel, and escalation badges/counts (Phase 3 frontend, after Plan 0B). Ticket↔conversation resolution coupling (UI coordinates; reply via existing inbox). Manual ticket creation (tickets originate from escalations + seed).

**Placeholder scan:** none — every step has concrete code/commands. The seed's "empty-table" idempotency guard is explicit.

**Type consistency:** `createFromEscalation` input shape matches `AutopilotService.escalate`'s call (contactId, reason, intent, autopilotEventId). `EscalationReason` literals match the Phase 2 enum. `TicketStatus` literals match the Task 1 enum and the DTO. `formatTicketNum` is used by `enrich` and asserted in tests. Service method names (`createFromEscalation`/`list`/`get`/`assign`/`resolve`/`close`/`reopen`) match the controller call sites and the service test. The autopilot constructor's new `tickets` param (last position) matches the updated test instantiation. `log()` now returns the created `AutopilotEvent` so `escalate()` can read `event.id`.

---

## Next plans (not in this document)
1. **Plan 5 — Learning loop:** on ticket resolve/close, capture the agent's Q&A → `KnowledgeDoc`(CANDIDATE) → publish via the existing `KnowledgeService.setStatus`, closing the bot↔KB loop.
2. **Frontend (after 0B):** inbox "Needs Human" queue + ticket detail (status timeline from the lifecycle timestamps, escalation divider from `AutopilotEvent`, agent composer reusing inbox send), dealer-context panel from the `Contact` dealer fields, escalation badges from `GET /tickets?tab=active`.
