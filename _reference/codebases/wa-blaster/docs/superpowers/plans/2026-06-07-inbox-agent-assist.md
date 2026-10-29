# Inbox Agent-Assist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an agent context card + AI-suggested draft + a canned-replies library around the Needs-Human inbox composer.

**Architecture:** Two clusters. **Agent-assist** adds two methods to `TicketsService` (`agentContext`, `suggestReply`) reusing the existing `KnowledgeService.retrieve` + `LlmService.generateReply` (LLM stays mock) — no new model. **Canned replies** is a new self-contained module (`CannedReply` Prisma model + CRUD) with a Settings management tab + a composer picker. Frontend wires both into `NeedsHumanMode.tsx` and `Settings.tsx`.

**Tech Stack:** NestJS 10, Prisma 5 (Postgres), Jest (mocked Prisma/Knowledge/LLM), Vite + React + TS, @tanstack/react-query v5, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-07-inbox-agent-assist-design.md`

---

## Conventions (read once)

- **Backend unit tests mock collaborators** and construct services directly. See `apps/api/src/tickets/__tests__/tickets.service.spec.ts` and `segments` for the CRUD module shape.
- `LlmModule` is `@Global` and `KnowledgeModule` is imported by `TicketsModule` — so injecting `LlmService` into `TicketsService` needs NO module change.
- `KnowledgeService.retrieve(query, { intent?, limit? })` → `{ doc: KnowledgeDoc; score: number }[]` (`doc` has `id/slug/question/answer/category`). `LlmService.generateReply({ message, intent?, knowledge: {question,answer}[], dealerName? })` → `{ text, confidence }`.
- `prisma.cannedReply` only exists after the schema model is added AND `prisma generate` runs — so **run `pnpm --filter api db:generate` before building/testing code that references it** (no DB needed for generate).
- Run a single backend test path: `pnpm --filter api test -- <substr>`. Build: `pnpm --filter api build` / `pnpm --filter web build`.
- All new routes are under `/api`, behind `JwtAuthGuard`.
- Branch: `feat/inbox-agent-assist` (already created from master). Do NOT branch. Commit after each task.
- **Postgres is down:** `prisma generate` works; **`pnpm db:migrate` (apply), the canned-reply seed run, and all e2e are DEFERRED.** Everything else (unit tests + builds) runs headlessly.

---

## Task 1: `CannedReply` model + `CannedRepliesService`

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/canned-replies/canned-replies.service.ts`
- Test: `apps/api/src/canned-replies/__tests__/canned-replies.service.spec.ts`

- [ ] **Step 1: Add the model** to `apps/api/prisma/schema.prisma` (after the `ContactSegment` model, or anywhere among the models):
```prisma
model CannedReply {
  id          String   @id @default(uuid()) @db.Uuid
  title       String
  body        String
  category    String?
  createdById String?  @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt       @map("updated_at")

  @@map("canned_replies")
}
```

- [ ] **Step 2: Regenerate the Prisma client** (no DB needed):

Run: `pnpm --filter api db:generate`
Expected: "Generated Prisma Client" — now `prisma.cannedReply` exists.

- [ ] **Step 3: Write the failing service test** — `apps/api/src/canned-replies/__tests__/canned-replies.service.spec.ts`:
```ts
import { NotFoundException } from '@nestjs/common';
import { CannedRepliesService } from '../canned-replies.service';

function makePrisma() {
  return {
    cannedReply: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('CannedRepliesService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: CannedRepliesService;
  beforeEach(() => { prisma = makePrisma(); service = new CannedRepliesService(prisma as any); });

  it('list orders by title asc', async () => {
    prisma.cannedReply.findMany.mockResolvedValue([{ id: 'r1', title: 'Alpha' }]);
    const res = await service.list();
    expect(prisma.cannedReply.findMany).toHaveBeenCalledWith({ orderBy: { title: 'asc' } });
    expect(res).toEqual([{ id: 'r1', title: 'Alpha' }]);
  });

  it('create persists fields + createdById', async () => {
    prisma.cannedReply.create.mockImplementation((a: any) => Promise.resolve({ id: 'r1', ...a.data }));
    await service.create({ title: 'T', body: 'B', category: 'Transfer' }, 'u1');
    expect(prisma.cannedReply.create).toHaveBeenCalledWith({
      data: { title: 'T', body: 'B', category: 'Transfer', createdById: 'u1' },
    });
  });

  it('create defaults missing category to null', async () => {
    prisma.cannedReply.create.mockResolvedValue({ id: 'r1' });
    await service.create({ title: 'T', body: 'B' }, 'u1');
    expect(prisma.cannedReply.create.mock.calls[0][0].data.category).toBeNull();
  });

  it('update throws NotFound when missing', async () => {
    prisma.cannedReply.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { title: 'X' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update writes provided fields', async () => {
    prisma.cannedReply.findUnique.mockResolvedValue({ id: 'r1' });
    prisma.cannedReply.update.mockResolvedValue({ id: 'r1', title: 'X' });
    await service.update('r1', { title: 'X' });
    expect(prisma.cannedReply.update).toHaveBeenCalledWith({
      where: { id: 'r1' },
      data: { title: 'X', body: undefined, category: undefined },
    });
  });

  it('remove throws NotFound when missing, else deletes', async () => {
    prisma.cannedReply.findUnique.mockResolvedValueOnce(null);
    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
    prisma.cannedReply.findUnique.mockResolvedValueOnce({ id: 'r1' });
    await service.remove('r1');
    expect(prisma.cannedReply.delete).toHaveBeenCalledWith({ where: { id: 'r1' } });
  });
});
```

- [ ] **Step 4: Run, verify it fails**

Run: `pnpm --filter api test -- canned-replies`
Expected: FAIL — "Cannot find module '../canned-replies.service'".

- [ ] **Step 5: Implement `apps/api/src/canned-replies/canned-replies.service.ts`**
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { CannedReply } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface CreateInput { title: string; body: string; category?: string | null }
interface UpdateInput { title?: string; body?: string; category?: string | null }

@Injectable()
export class CannedRepliesService {
  constructor(private readonly prisma: PrismaService) {}

  list(): Promise<CannedReply[]> {
    return this.prisma.cannedReply.findMany({ orderBy: { title: 'asc' } });
  }

  create(input: CreateInput, userId: string): Promise<CannedReply> {
    return this.prisma.cannedReply.create({
      data: {
        title: input.title,
        body: input.body,
        category: input.category ?? null,
        createdById: userId,
      },
    });
  }

  async update(id: string, input: UpdateInput): Promise<CannedReply> {
    await this.getOrThrow(id);
    return this.prisma.cannedReply.update({
      where: { id },
      data: { title: input.title, body: input.body, category: input.category },
    });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.cannedReply.delete({ where: { id } });
  }

  private async getOrThrow(id: string): Promise<CannedReply> {
    const row = await this.prisma.cannedReply.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Canned reply not found');
    return row;
  }
}
```

- [ ] **Step 6: Run, verify pass**

Run: `pnpm --filter api test -- canned-replies`
Expected: PASS (6 cases).

- [ ] **Step 7: Commit**
```bash
git add apps/api/prisma/schema.prisma apps/api/src/canned-replies
git commit -m "feat(api): CannedReply model + CannedRepliesService (CRUD)"
```

---

## Task 2: Canned-replies controller + module + seed

**Files:**
- Create: `apps/api/src/canned-replies/dto/create-canned-reply.dto.ts`, `dto/update-canned-reply.dto.ts`, `canned-replies.controller.ts`, `canned-replies.module.ts`
- Modify: `apps/api/src/app.module.ts`, `apps/api/prisma/seed.ts`, `README.md`

- [ ] **Step 1: Create the DTOs**

`dto/create-canned-reply.dto.ts`:
```ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCannedReplyDto {
  @IsString() @MinLength(1) @MaxLength(120)
  title!: string;

  @IsString() @MinLength(1) @MaxLength(4000)
  body!: string;

  @IsOptional() @IsString() @MaxLength(60)
  category?: string;
}
```
`dto/update-canned-reply.dto.ts`:
```ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateCannedReplyDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120)
  title?: string;

  @IsOptional() @IsString() @MinLength(1) @MaxLength(4000)
  body?: string;

  @IsOptional() @IsString() @MaxLength(60)
  category?: string;
}
```

- [ ] **Step 2: Create the controller** `canned-replies.controller.ts` (mirrors `segments.controller.ts`):
```ts
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CannedRepliesService } from './canned-replies.service';
import { CreateCannedReplyDto } from './dto/create-canned-reply.dto';
import { UpdateCannedReplyDto } from './dto/update-canned-reply.dto';

@Controller('canned-replies')
@UseGuards(JwtAuthGuard)
export class CannedRepliesController {
  constructor(private readonly cannedReplies: CannedRepliesService) {}

  @Get()
  list() {
    return this.cannedReplies.list();
  }

  @Post()
  create(@Body() dto: CreateCannedReplyDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.cannedReplies.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCannedReplyDto) {
    return this.cannedReplies.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.cannedReplies.remove(id);
  }
}
```

- [ ] **Step 3: Create the module** `canned-replies.module.ts`:
```ts
import { Module } from '@nestjs/common';
import { CannedRepliesService } from './canned-replies.service';
import { CannedRepliesController } from './canned-replies.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule], // PrismaService is @Global
  controllers: [CannedRepliesController],
  providers: [CannedRepliesService],
})
export class CannedRepliesModule {}
```

- [ ] **Step 4: Register in `app.module.ts`** — add the import and add `CannedRepliesModule` to the `imports` array:
```ts
import { CannedRepliesModule } from './canned-replies/canned-replies.module';
```
```ts
    CannedRepliesModule,
```

- [ ] **Step 5: Seed a starter set** in `apps/api/prisma/seed.ts` (add near the other idempotent seed blocks, e.g. after the tickets seed):
```ts
  if ((await prisma.cannedReply.count()) === 0) {
    const cannedReplies = [
      { title: 'Transfer — how to start', body: 'To start an ownership transfer: Transfers → New transfer, enter the vehicle & buyer, both parties e-sign, then book Puspakom B5. JPJ issues the new geran in 2–5 working days.', category: 'Transfer' },
      { title: 'Credit top-up', body: 'You can top up credits under Billing. Bundles: 50 = RM 250, 200 = RM 900 (10% off). Credits never expire.', category: 'Billing' },
      { title: 'Road-tax renewal', body: 'Renew road tax + insurance together for instant issuance. Unused road tax is refunded pro-rata on transfer.', category: 'Road tax' },
      { title: 'Looking into it', body: 'Thanks for reaching out — I’m looking into this now and will get back to you shortly.', category: 'General' },
      { title: 'Need more details', body: 'Could you share the vehicle registration number and the dealer account name so I can check this for you?', category: 'General' },
      { title: 'Resolved — anything else?', body: 'Glad that’s sorted! Is there anything else I can help you with?', category: 'General' },
    ];
    for (const c of cannedReplies) {
      await prisma.cannedReply.create({ data: c });
    }
    console.log(`Seeded ${cannedReplies.length} canned replies.`);
  }
```

- [ ] **Step 6: Note the migration in `README.md`** — under the setup/migration steps, add a line:
```
# Note: the CannedReply table requires a migration — run `pnpm db:migrate` after pulling this branch.
```

- [ ] **Step 7: Build** (migration apply + seed run are DEFERRED — no Postgres)

Run: `pnpm --filter api build`
Expected: success (the controller/module compile against the generated `prisma.cannedReply`).

- [ ] **Step 8: Commit**
```bash
git add apps/api/src/canned-replies apps/api/src/app.module.ts apps/api/prisma/seed.ts README.md
git commit -m "feat(api): canned-replies CRUD endpoints + module + seed"
```

---

## Task 3: `TicketsService.agentContext` (+ inject LlmService)

**Files:**
- Modify: `apps/api/src/tickets/tickets.service.ts`, `apps/api/src/tickets/tickets.controller.ts`
- Test: `apps/api/src/tickets/__tests__/tickets.service.spec.ts`

- [ ] **Step 1: Inject `LlmService` into `TicketsService`** — add the import + constructor param in `tickets.service.ts`:
```ts
import { LlmService } from '../llm/llm.service';
```
Change the constructor to:
```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
    private readonly llm: LlmService,
  ) {}
```
(`LlmModule` is `@Global`, so no `tickets.module.ts` change is needed.)

- [ ] **Step 2: Fix the existing spec's construction** — in `tickets.service.spec.ts`, the existing `describe('TicketsService')` constructs `new TicketsService(prisma as any, knowledge as any)`. Add a third arg so it still compiles:
```ts
    service = new TicketsService(prisma as any, knowledge as any, {} as any);
```
(The existing tests don't exercise the LLM, so a bare `{} as any` is fine there.)

- [ ] **Step 3: Write the failing `agentContext` test** — append a new describe to `tickets.service.spec.ts`:
```ts
describe('TicketsService.agentContext', () => {
  let prisma: any; let knowledge: any; let llm: any; let service: TicketsService;
  beforeEach(() => {
    prisma = {
      ticket: { findUnique: jest.fn() },
      autopilotEvent: { findUnique: jest.fn() },
      inboundMessage: { findFirst: jest.fn() },
    };
    knowledge = { retrieve: jest.fn().mockResolvedValue([]) };
    llm = { generateReply: jest.fn() };
    service = new TicketsService(prisma, knowledge, llm);
  });

  it('throws NotFound when the ticket is missing', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    await expect(service.agentContext('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns intent/reason/confidence + suggested knowledge from a fresh retrieve', async () => {
    prisma.ticket.findUnique.mockResolvedValue({
      id: 't1', contactId: 'c1', intent: 'transfer_support', reason: 'LOW_CONFIDENCE',
      autopilotEventId: 'e1', openedAt: new Date('2026-06-01T00:00:00Z'),
    });
    prisma.autopilotEvent.findUnique.mockResolvedValue({ id: 'e1', confidence: 0.42, createdAt: new Date('2026-06-01T01:00:00Z') });
    prisma.inboundMessage.findFirst.mockResolvedValue({ body: 'how do I transfer?' });
    knowledge.retrieve.mockResolvedValue([
      { doc: { id: 'k1', slug: 'transfer.md', question: 'How to transfer?', answer: 'Use the portal.', category: 'Transfer' }, score: 5 },
    ]);
    const res = await service.agentContext('t1');
    expect(knowledge.retrieve).toHaveBeenCalledWith('how do I transfer?', { intent: 'transfer_support', limit: 3 });
    expect(res).toEqual({
      intent: 'transfer_support', reason: 'LOW_CONFIDENCE', confidence: 0.42,
      escalatedAt: new Date('2026-06-01T01:00:00Z'),
      suggestedKnowledge: [{ id: 'k1', slug: 'transfer.md', question: 'How to transfer?', answer: 'Use the portal.', category: 'Transfer' }],
    });
  });

  it('returns empty knowledge + null confidence when no inbound and no event', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1', intent: null, reason: 'COMPLAINT', autopilotEventId: null, openedAt: new Date('2026-06-01T00:00:00Z') });
    prisma.inboundMessage.findFirst.mockResolvedValue(null);
    const res = await service.agentContext('t1');
    expect(knowledge.retrieve).not.toHaveBeenCalled();
    expect(res.suggestedKnowledge).toEqual([]);
    expect(res.confidence).toBeNull();
    expect(res.escalatedAt).toEqual(new Date('2026-06-01T00:00:00Z'));
  });
});
```

- [ ] **Step 4: Run, verify it fails**

Run: `pnpm --filter api test -- tickets.service`
Expected: FAIL — `service.agentContext is not a function` (and the existing tests still pass with the `{} as any` third arg).

- [ ] **Step 5: Implement `agentContext`** — add to `TicketsService` (after `get`):
```ts
  async agentContext(id: string) {
    const ticket = await this.getOrThrow(id);
    const event = ticket.autopilotEventId
      ? await this.prisma.autopilotEvent.findUnique({ where: { id: ticket.autopilotEventId } })
      : null;
    const inbound = await this.prisma.inboundMessage.findFirst({
      where: { contactId: ticket.contactId },
      orderBy: { receivedAt: 'desc' },
    });
    const hits = inbound?.body
      ? await this.knowledge.retrieve(inbound.body, { intent: ticket.intent ?? undefined, limit: 3 })
      : [];
    return {
      intent: ticket.intent,
      reason: ticket.reason,
      confidence: event?.confidence ?? null,
      escalatedAt: event?.createdAt ?? ticket.openedAt,
      suggestedKnowledge: hits.map((h) => ({
        id: h.doc.id, slug: h.doc.slug, question: h.doc.question, answer: h.doc.answer, category: h.doc.category,
      })),
    };
  }
```

- [ ] **Step 6: Run, verify pass**

Run: `pnpm --filter api test -- tickets.service`
Expected: PASS (existing + 3 new agentContext cases).

- [ ] **Step 7: Add the controller route** — in `tickets.controller.ts`, after the `get(':id')` route:
```ts
  @Get(':id/agent-context')
  agentContext(@Param('id') id: string) {
    return this.tickets.agentContext(id);
  }
```

- [ ] **Step 8: Build + commit**

Run: `pnpm --filter api build`.
```bash
git add apps/api/src/tickets
git commit -m "feat(api): GET /tickets/:id/agent-context (escalation context + suggested KB)"
```

---

## Task 4: `TicketsService.suggestReply`

**Files:**
- Modify: `apps/api/src/tickets/tickets.service.ts`, `apps/api/src/tickets/tickets.controller.ts`
- Test: `apps/api/src/tickets/__tests__/tickets.service.spec.ts`

- [ ] **Step 1: Write the failing test** — append to `tickets.service.spec.ts`:
```ts
describe('TicketsService.suggestReply', () => {
  let prisma: any; let knowledge: any; let llm: any; let service: TicketsService;
  beforeEach(() => {
    prisma = {
      ticket: { findUnique: jest.fn() },
      inboundMessage: { findFirst: jest.fn() },
      contact: { findUnique: jest.fn() },
    };
    knowledge = { retrieve: jest.fn().mockResolvedValue([]) };
    llm = { generateReply: jest.fn() };
    service = new TicketsService(prisma, knowledge, llm);
  });

  it('throws NotFound when the ticket is missing', async () => {
    prisma.ticket.findUnique.mockResolvedValue(null);
    await expect(service.suggestReply('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns an empty draft when there is no inbound message', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1', intent: 'x' });
    prisma.inboundMessage.findFirst.mockResolvedValue(null);
    const res = await service.suggestReply('t1');
    expect(res).toEqual({ text: '', confidence: 0 });
    expect(llm.generateReply).not.toHaveBeenCalled();
  });

  it('drafts a KB-grounded reply via the LLM', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1', intent: 'transfer_support' });
    prisma.inboundMessage.findFirst.mockResolvedValue({ body: 'how do I transfer?' });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', picName: 'Rahman', name: 'Auto Bestari' });
    knowledge.retrieve.mockResolvedValue([{ doc: { question: 'How to transfer?', answer: 'Use the portal.' }, score: 5 }]);
    llm.generateReply.mockResolvedValue({ text: 'Hi Rahman, to transfer use the portal.', confidence: 0.83 });

    const res = await service.suggestReply('t1');
    expect(knowledge.retrieve).toHaveBeenCalledWith('how do I transfer?', { intent: 'transfer_support', limit: 3 });
    expect(llm.generateReply).toHaveBeenCalledWith({
      message: 'how do I transfer?',
      intent: 'transfer_support',
      knowledge: [{ question: 'How to transfer?', answer: 'Use the portal.' }],
      dealerName: 'Rahman',
    });
    expect(res).toEqual({ text: 'Hi Rahman, to transfer use the portal.', confidence: 0.83 });
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- tickets.service`
Expected: FAIL — `service.suggestReply is not a function`.

- [ ] **Step 3: Implement `suggestReply`** — add to `TicketsService` (after `agentContext`):
```ts
  async suggestReply(id: string): Promise<{ text: string; confidence: number }> {
    const ticket = await this.getOrThrow(id);
    const inbound = await this.prisma.inboundMessage.findFirst({
      where: { contactId: ticket.contactId },
      orderBy: { receivedAt: 'desc' },
    });
    if (!inbound?.body) return { text: '', confidence: 0 };
    const contact = await this.prisma.contact.findUnique({ where: { id: ticket.contactId } });
    const hits = await this.knowledge.retrieve(inbound.body, { intent: ticket.intent ?? undefined, limit: 3 });
    const reply = await this.llm.generateReply({
      message: inbound.body,
      intent: ticket.intent ?? undefined,
      knowledge: hits.map((h) => ({ question: h.doc.question, answer: h.doc.answer })),
      dealerName: contact?.picName ?? contact?.name ?? undefined,
    });
    return { text: reply.text, confidence: reply.confidence };
  }
```

- [ ] **Step 4: Run, verify pass + full suite**

Run: `pnpm --filter api test -- tickets.service` (PASS), then `pnpm --filter api test` (full suite green).

- [ ] **Step 5: Add the controller route** — in `tickets.controller.ts`, after `agentContext`:
```ts
  @Post(':id/suggest-reply')
  suggestReply(@Param('id') id: string) {
    return this.tickets.suggestReply(id);
  }
```

- [ ] **Step 6: Build + commit**

Run: `pnpm --filter api build`.
```bash
git add apps/api/src/tickets
git commit -m "feat(api): POST /tickets/:id/suggest-reply (KB-grounded mock-LLM draft)"
```

---

## Task 5: Web client functions

**Files:**
- Create: `apps/web/src/api/cannedReplies.ts`
- Modify: `apps/web/src/api/tickets.ts`

- [ ] **Step 1: Create `apps/web/src/api/cannedReplies.ts`**
```ts
import { api } from './client';

export interface CannedReply {
  id: string;
  title: string;
  body: string;
  category: string | null;
  createdById: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function listCannedReplies(): Promise<CannedReply[]> {
  const { data } = await api.get<CannedReply[]>('/canned-replies');
  return data;
}

export async function createCannedReply(input: { title: string; body: string; category?: string }): Promise<CannedReply> {
  const { data } = await api.post<CannedReply>('/canned-replies', input);
  return data;
}

export async function updateCannedReply(id: string, input: { title?: string; body?: string; category?: string }): Promise<CannedReply> {
  const { data } = await api.patch<CannedReply>(`/canned-replies/${id}`, input);
  return data;
}

export async function deleteCannedReply(id: string): Promise<void> {
  await api.delete(`/canned-replies/${id}`);
}
```

- [ ] **Step 2: Add agent-assist fns to `apps/web/src/api/tickets.ts`** (append):
```ts
export interface SuggestedKnowledge {
  id: string;
  slug: string;
  question: string;
  answer: string;
  category: string;
}

export interface AgentContext {
  intent: string | null;
  reason: TicketReason;
  confidence: number | null;
  escalatedAt: string;
  suggestedKnowledge: SuggestedKnowledge[];
}

export interface SuggestedReply {
  text: string;
  confidence: number;
}

export async function getAgentContext(id: string): Promise<AgentContext> {
  const { data } = await api.get<AgentContext>(`/tickets/${id}/agent-context`);
  return data;
}

export async function suggestReply(id: string): Promise<SuggestedReply> {
  const { data } = await api.post<SuggestedReply>(`/tickets/${id}/suggest-reply`);
  return data;
}
```

- [ ] **Step 3: Typecheck + commit**

Run: `pnpm --filter web build`.
```bash
git add apps/web/src/api/cannedReplies.ts apps/web/src/api/tickets.ts
git commit -m "feat(web): agent-context/suggest-reply + canned-replies API clients"
```

---

## Task 6: NeedsHumanMode — context card + Suggest-draft + Saved-replies + reasonTone fix

**Files:**
- Modify: `apps/web/src/pages/inbox/NeedsHumanMode.tsx`

> Read the file first. The composer lives in `TicketDetail`; `draft`/`setDraft` are its state. Build must be clean after.

- [ ] **Step 1: Update imports** — extend the tickets-api import and add the canned-replies import:
```ts
import {
  listTickets, getTicket, assignTicket, resolveTicket, closeTicket, reopenTicket,
  getAgentContext, suggestReply,
  type Ticket, type TicketStatus,
} from '../../api/tickets';
import { listCannedReplies } from '../../api/cannedReplies';
```

- [ ] **Step 2: Fix `reasonTone`** — replace the current always-`'human'` function (lines ~61-63) with a map:
```ts
const REASON_TONE: Record<string, BadgeTone> = {
  KNOWLEDGE_GAP: 'blue',
  LOW_CONFIDENCE: 'human',
  COMPLAINT: 'red',
  SENSITIVE: 'brand',
};
function reasonTone(r: string): BadgeTone {
  return REASON_TONE[r] ?? 'human';
}
```

- [ ] **Step 3: Add queries/mutation + an insert helper in `TicketDetail`** — after the existing `conv` query (and before the early returns), add:
```ts
  const { data: agentCtx } = useQuery({
    queryKey: ['tickets', ticketId, 'agent-context'],
    queryFn: () => getAgentContext(ticketId),
    enabled: !!ticket && ticket.status !== 'CLOSED',
  });

  const { data: cannedReplies = [] } = useQuery({
    queryKey: ['canned-replies'],
    queryFn: () => listCannedReplies(),
  });

  const suggestMut = useMutation({
    mutationFn: () => suggestReply(ticketId),
    onSuccess: (r) => { if (r.text) setDraft(r.text); },
  });

  const insertText = (text: string) =>
    setDraft((prev) => (prev.trim() ? `${prev.trimEnd()}\n${text}` : text));
```
> These are hooks — keep them above the `if (loadingTicket)` / `if (!ticket)` early returns. `ticketId` and `setDraft` are already in scope.

- [ ] **Step 4: Replace the open-composer branch** — the final `) : ( … )` block that renders the textarea + Send (the one gated by window-open). Replace its inner content so the context card + toolbar sit above the textarea row:
```tsx
        <div
          style={{
            flex: 'none',
            padding: '12px 20px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--background)',
          }}
        >
          {/* Agent context card */}
          {agentCtx && (
            <div
              data-testid="agent-context-card"
              style={{ marginBottom: 10, padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background-subtle, #f8fafc)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: agentCtx.suggestedKnowledge.length ? 8 : 0 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Why escalated</span>
                <Badge tone={reasonTone(agentCtx.reason)} style={{ height: 19, fontSize: 10 }}>{reasonLabel(agentCtx.reason)}</Badge>
                {agentCtx.intent && <Badge tone="neutral" style={{ height: 19, fontSize: 10 }}>{agentCtx.intent}</Badge>}
                {agentCtx.confidence != null && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{Math.round(agentCtx.confidence * 100)}% confident</span>
                )}
              </div>
              {agentCtx.suggestedKnowledge.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>Suggested knowledge</span>
                  {agentCtx.suggestedKnowledge.map((k) => (
                    <div key={k.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 500 }}>{k.question}</div>
                        <div style={{ color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{k.answer}</div>
                      </div>
                      <Button variant="ghost" size="sm" data-testid="insert-kb" onClick={() => insertText(k.answer)}>Insert</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assist toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
            <Button
              variant="secondary" size="sm" data-testid="suggest-draft"
              disabled={suggestMut.isPending}
              onClick={() => suggestMut.mutate()}
            >
              {suggestMut.isPending ? 'Drafting…' : '✨ Suggest draft'}
            </Button>
            {cannedReplies.length > 0 && (
              <select
                data-testid="saved-replies"
                value=""
                onChange={(e) => {
                  const r = cannedReplies.find((c) => c.id === e.target.value);
                  if (r) insertText(r.body);
                  e.currentTarget.value = '';
                }}
                style={{ height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', fontSize: 12.5, color: 'var(--text-muted)', padding: '0 8px' }}
              >
                <option value="">Saved replies…</option>
                {cannedReplies.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
            {suggestMut.data?.text && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>draft · {Math.round(suggestMut.data.confidence * 100)}% conf</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <textarea
              rows={2}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  if (canSend) handleSend();
                }
              }}
              placeholder="Write your reply…  (⌘/Ctrl+Enter to send)"
              style={{
                flex: 1, resize: 'none', minHeight: 44, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--background)',
                padding: '8px 10px', fontSize: 13, color: 'var(--foreground)', outline: 'none',
              }}
            />
            <Button
              variant="primary" size="md" disabled={!canSend} onClick={handleSend}
              icon={<IcSend size={15} />} style={{ height: 44 }}
            >
              {sendMut.isPending ? 'Sending…' : 'Send'}
            </Button>
          </div>
          {sendMut.isError && (
            <div style={{ marginTop: 6, fontSize: 11.5, color: 'var(--red-500, #ef4444)' }}>
              {(sendMut.error as Error).message || 'Failed to send'}
            </div>
          )}
        </div>
```
> This preserves the existing textarea + Send + error markup verbatim; it only prepends the context card + toolbar inside the same wrapper `<div>`.

- [ ] **Step 5: Typecheck**

Run: `pnpm --filter web build`
Expected: success. (`Badge`, `Button`, `IcSend`, `reasonLabel`, `canSend`, `handleSend`, `sendMut`, `draft`, `setDraft` are all already in scope in `TicketDetail`.)

- [ ] **Step 6: Commit**
```bash
git add apps/web/src/pages/inbox/NeedsHumanMode.tsx
git commit -m "feat(web): inbox agent context card + Suggest-draft + Saved-replies + reasonTone fix"
```

---

## Task 7: Settings — Canned replies management tab

**Files:**
- Modify: `apps/web/src/pages/Settings.tsx`

> Read the file first: it has `type TabId = 'channel' | 'autopilot' | 'team' | 'languages'`, a `tabs: { value, label }[]` array (~line 578), a `<Tabs value={tab} onChange={setTab} tabs={tabs} />`, and `{tab === '…' && <…>}` render blocks. It already imports `Toast` and the `Modal` default export may need importing.

- [ ] **Step 1: Add imports** (only those not already present) at the top of `Settings.tsx`:
```ts
import Modal from '../components/Modal';
import {
  listCannedReplies, createCannedReply, updateCannedReply, deleteCannedReply,
  type CannedReply,
} from '../api/cannedReplies';
```
(`useState`, `useQuery`, `useMutation`, `useQueryClient`, `Toast`, `Button`, and the `Tabs` component are already imported by Settings.tsx — confirm and only add what's missing.)

- [ ] **Step 2: Add the tab to the union + list** — change:
```ts
type TabId = 'channel' | 'autopilot' | 'team' | 'languages';
```
to:
```ts
type TabId = 'channel' | 'autopilot' | 'team' | 'languages' | 'canned';
```
and add to the `tabs` array:
```ts
    { value: 'canned', label: 'Canned replies' },
```
and add a render block alongside the others:
```tsx
        {tab === 'canned' && <CannedRepliesTab />}
```

- [ ] **Step 3: Add the `CannedRepliesTab` component** — define it in `Settings.tsx` (near the other tab components like `AutopilotTab`):
```tsx
function CannedRepliesTab() {
  const qc = useQueryClient();
  const [toast, setToast] = useState<{ message: string; variant: 'success' | 'error' } | null>(null);
  const [editing, setEditing] = useState<CannedReply | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: '' });

  const { data: replies = [], isLoading } = useQuery({
    queryKey: ['canned-replies'],
    queryFn: () => listCannedReplies(),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['canned-replies'] });

  const createMut = useMutation({
    mutationFn: () => createCannedReply({ title: form.title, body: form.body, category: form.category || undefined }),
    onSuccess: () => { invalidate(); setCreating(false); setToast({ message: 'Canned reply added', variant: 'success' }); },
    onError: () => setToast({ message: 'Failed to add', variant: 'error' }),
  });
  const updateMut = useMutation({
    mutationFn: () => updateCannedReply(editing!.id, { title: form.title, body: form.body, category: form.category || undefined }),
    onSuccess: () => { invalidate(); setEditing(null); setToast({ message: 'Canned reply updated', variant: 'success' }); },
    onError: () => setToast({ message: 'Failed to update', variant: 'error' }),
  });
  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteCannedReply(id),
    onSuccess: () => { invalidate(); setToast({ message: 'Canned reply deleted', variant: 'success' }); },
    onError: () => setToast({ message: 'Failed to delete', variant: 'error' }),
  });

  const openCreate = () => { setForm({ title: '', body: '', category: '' }); setCreating(true); };
  const openEdit = (r: CannedReply) => { setForm({ title: r.title, body: r.body, category: r.category ?? '' }); setEditing(r); };
  const closeModal = () => { setCreating(false); setEditing(null); };
  const formValid = form.title.trim().length > 0 && form.body.trim().length > 0;

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>Reusable replies agents can insert in the inbox.</p>
        <Button variant="primary" size="sm" data-testid="add-canned-reply" onClick={openCreate}>Add reply</Button>
      </div>

      {isLoading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading…</p>}
      {!isLoading && replies.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No canned replies yet.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} data-testid="canned-replies-list">
        {replies.map((r) => (
          <div key={r.id} style={{ border: '1px solid var(--border)', borderRadius: 10, padding: '12px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{r.title}</span>
                {r.category && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.category}</span>}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{r.body}</div>
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Button variant="secondary" size="sm" onClick={() => openEdit(r)}>Edit</Button>
              <Button variant="secondary" size="sm" disabled={deleteMut.isPending} onClick={() => { if (window.confirm(`Delete "${r.title}"?`)) deleteMut.mutate(r.id); }}>Delete</Button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={creating || !!editing} title={editing ? 'Edit canned reply' : 'New canned reply'} onClose={closeModal}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '0 10px', fontSize: 13, color: 'var(--foreground)' }}
          />
          <input
            placeholder="Category (optional)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            style={{ height: 36, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '0 10px', fontSize: 13, color: 'var(--foreground)' }}
          />
          <textarea
            placeholder="Reply body"
            rows={5}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            style={{ resize: 'vertical', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '8px 10px', fontSize: 13, color: 'var(--foreground)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" size="sm" onClick={closeModal}>Cancel</Button>
            <Button
              variant="primary" size="sm"
              disabled={!formValid || createMut.isPending || updateMut.isPending}
              onClick={() => (editing ? updateMut.mutate() : createMut.mutate())}
            >
              {editing ? 'Save' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>

      <Toast message={toast?.message ?? null} variant={toast?.variant} onDismiss={() => setToast(null)} />
    </div>
  );
}
```

- [ ] **Step 4: Typecheck**

Run: `pnpm --filter web build`
Expected: success. If `Modal`, `useQueryClient`, `useMutation`, or `useState` were already imported, don't duplicate; if any were missing, the compiler will flag — add them.

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/pages/Settings.tsx
git commit -m "feat(web): Settings → Canned replies management tab"
```

---

## Task 8: E2E spec + verification

**Files:**
- Create: `e2e/tests/inbox-agent-assist.spec.ts`

> Run is DEFERRED (no Postgres/servers/browsers; the `canned_replies` table also needs `pnpm db:migrate`). Write a well-formed spec mirroring `e2e/tests/blasts.spec.ts` (local `loginAsAdmin`). Do NOT run `pnpm --filter e2e test`.

- [ ] **Step 1: Create `e2e/tests/inbox-agent-assist.spec.ts`**
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

test.describe('Inbox agent-assist', () => {
  test('settings lists seeded canned replies', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Settings' }).click();
    await expect(page).toHaveURL(/\/settings$/);
    await page.getByRole('button', { name: 'Canned replies' }).click();
    await expect(page.getByTestId('canned-replies-list')).toBeVisible();
    await expect(page.getByTestId('add-canned-reply')).toBeVisible();
  });

  test('needs-human composer shows the agent context card + assist controls', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/inbox');
    // Switch to the Needs-Human view if the inbox defaults to auto-replied mode.
    const needsHuman = page.getByRole('button', { name: /needs[ -]?human/i });
    if (await needsHuman.count()) await needsHuman.first().click();
    // With a seeded open ticket selected, the assist toolbar renders.
    await expect(page.getByTestId('suggest-draft')).toBeVisible();
    await expect(page.getByTestId('agent-context-card')).toBeVisible();
  });
});
```
> Adapt the Needs-Human mode toggle selector to the real control in `Inbox.tsx`/the mode switcher if `/needs-human/i` doesn't match. The assertions (testids) are the stable part.

- [ ] **Step 2: Commit**
```bash
git add e2e/tests/inbox-agent-assist.spec.ts
git commit -m "test(e2e): inbox agent-assist + canned replies (run deferred)"
```

---

## Final verification

- [ ] `pnpm --filter api test` — all green (existing + canned-replies + agentContext + suggestReply).
- [ ] `pnpm --filter api build` and `pnpm --filter web build` — compile.
- [ ] Live-DB verification (deferred — needs Postgres + servers): `docker compose up -d && pnpm db:migrate && pnpm db:seed`; open an escalated ticket → context card + Suggest-draft + Saved-replies render; Settings → Canned replies CRUD works; `pnpm --filter e2e test -- inbox-agent-assist`.

---

## Self-review notes (author)

- **Spec coverage:** §3.1 agent-context → Task 3; suggest-reply → Task 4; §3.2 CannedReply model+CRUD → Tasks 1-2; §3.3 frontend (clients → Task 5; context card + Suggest-draft + Saved-replies + reasonTone → Task 6; Settings tab → Task 7); §3.4 migration deferral (prisma generate; db:migrate deferred) → Task 1 Step 2 + Task 2 Steps 6-7; §6 tests → unit in Tasks 1,3,4 + e2e in Task 8. Deferred items (real LLM, ticket-history grouping) untouched.
- **Type consistency:** `AgentContext`/`SuggestedKnowledge`/`SuggestedReply` (web, Task 5) match the service returns (Tasks 3-4); `CannedReply` web type (Task 5) matches the Prisma model (Task 1); `generateReply` input `{message,intent?,knowledge,dealerName?}` + result `{text,confidence}` match `llm.types.ts`; `knowledge.retrieve` returns `{doc,score}[]` used consistently. The `reasonTone` map is keyed by the same reason strings used in `reasonLabel`.
- **Constructor change handled:** Task 3 Step 2 updates the one existing manual `new TicketsService(...)` construction (in the spec) to pass the new third arg; NestJS DI wires the real `LlmService` (global) — no other construction sites.
- **No placeholders:** every code step is complete; the only deferrals (db:migrate, seed run, e2e run) are explicit + environmental.
- **Hooks ordering (Task 6):** the new `useQuery`/`useMutation`/`insertText` are added above `TicketDetail`'s early returns; the composer-branch replacement preserves the existing textarea/Send/error markup verbatim.
