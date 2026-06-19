# Phase 5 — Learning Loop (backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the bot↔KB loop. When a support agent resolves a ticket, the system proposes a Q&A (the dealer's question + the agent's answer) and saves it as a `CANDIDATE` knowledge doc linked to the ticket. A Super Admin then publishes it (existing endpoint), after which the Autopilot bot can ground future replies on it.

**Architecture:** Almost entirely reuse. Phase 1 already provides the candidate queue (`GET /knowledge/candidates`), publish/dismiss (`POST /knowledge/:id/publish|dismiss`), and the bot's `retrieve()` (which already filters to `PUBLISHED`). This phase adds: (1) a `ticketId` link on KB creation, (2) a server-side **suggestion** that derives the proposed Q&A from a ticket's conversation, and (3) two ticket endpoints — get-suggestion and create-candidate. `TicketsService` injects `KnowledgeService` to create the candidate. **No migration** — `KnowledgeDoc.ticketId` already exists (Phase 1).

**Tech Stack:** NestJS 10, Prisma 5, class-validator, Jest, pnpm.

**Source spec:** `docs/superpowers/specs/2026-06-04-eauto-dealer-ai-pivot-design.md` (§2 pillar 3, §5 KnowledgeCandidate flow).

**Branch:** Create `feat/eauto-learning-loop` off `feat/eauto-ticketing` (Phase 3) — or off `master` after the stack merges. Depends on Phase 1 (`KnowledgeService.create`, candidate/publish/dismiss, `KnowledgeDoc.ticketId`), Phase 2 (`AutopilotEvent`), Phase 3 (`Ticket`, `TicketsService`).

**Already built (reused, not rebuilt):**
- `KnowledgeService.create(input)` accepts `source`/`status` (so a `CANDIDATE`/`FROM_ESCALATION` doc is creatable) — this phase adds `ticketId` passthrough.
- `KnowledgeService` candidates list + `setStatus` (publish/dismiss) + the admin `/knowledge/candidates`, `/knowledge/:id/publish`, `/knowledge/:id/dismiss` routes.
- `KnowledgeService.retrieve()` already returns only `PUBLISHED` docs → a published candidate is immediately usable by the bot.
- `TicketsService` (Phase 3) with `getOrThrow`, `prisma`, and the `Ticket`→`contact` relation; `KnowledgeDoc.ticketId` column.

**Scope note:** Backend only. The "Learned from escalations" UI tab, the resolve-time "Save this Q&A to the KB?" modal, and the publish/dismiss buttons are built after Plan 0B (frontend shell) — they consume the `GET /knowledge/candidates` + the two new ticket endpoints here. The seed already has 3 `CANDIDATE` docs (Phase 1), so the candidate queue is demoable today.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/src/knowledge/dto/create-knowledge.dto.ts` | Add optional `ticketId`. |
| `apps/api/src/knowledge/knowledge.service.ts` | `create()` accepts + persists `ticketId`. |
| `apps/api/src/knowledge/__tests__/knowledge.service.spec.ts` | Update create assertion; add `ticketId` passthrough test. |
| `apps/api/src/tickets/tickets.suggest.ts` | Pure `suggestSlug(question)`. |
| `apps/api/src/tickets/tickets.service.ts` | Inject `KnowledgeService`; `suggestKnowledge()` + `createKnowledgeCandidate()`. |
| `apps/api/src/tickets/__tests__/tickets.service.spec.ts` | Knowledge mock + new tests. |
| `apps/api/src/tickets/dto/create-knowledge-candidate.dto.ts` | Candidate payload. |
| `apps/api/src/tickets/tickets.controller.ts` | `GET /:id/knowledge-suggestion`, `POST /:id/knowledge-candidate`. |
| `apps/api/src/tickets/tickets.module.ts` | Import `KnowledgeModule`. |

---

## Task 1: Link KB docs to their originating ticket

**Files:**
- Modify: `apps/api/src/knowledge/dto/create-knowledge.dto.ts`
- Modify: `apps/api/src/knowledge/knowledge.service.ts`
- Modify: `apps/api/src/knowledge/__tests__/knowledge.service.spec.ts`

- [ ] **Step 1: Update the create test (TDD).** In `apps/api/src/knowledge/__tests__/knowledge.service.spec.ts`:
(a) The existing test `'create() defaults source SYNCED + status PUBLISHED'` asserts the exact `create` data — update its expectation to include `ticketId: null`:
```ts
    expect(prisma.knowledgeDoc.create).toHaveBeenCalledWith({
      data: { slug: 'a.md', question: 'q', answer: 'a', category: 'General', source: 'SYNCED', status: 'PUBLISHED', ticketId: null },
    });
```
(b) Add a new test:
```ts
  it('create() persists source/status/ticketId when provided', async () => {
    prisma.knowledgeDoc.create.mockResolvedValue({ id: 'x' });
    await service.create({ slug: 'a.md', question: 'q', answer: 'a', category: 'Transfer', source: 'FROM_ESCALATION', status: 'CANDIDATE', ticketId: 't1' });
    expect(prisma.knowledgeDoc.create).toHaveBeenCalledWith({
      data: { slug: 'a.md', question: 'q', answer: 'a', category: 'Transfer', source: 'FROM_ESCALATION', status: 'CANDIDATE', ticketId: 't1' },
    });
  });
```

- [ ] **Step 2: Run the knowledge service test, verify it FAILS** (the updated assertion expects `ticketId` the service doesn't yet send).
Run: `pnpm --filter api exec jest src/knowledge/__tests__/knowledge.service --silent`
Expected: FAIL.

- [ ] **Step 3: Add `ticketId` to the create path.** In `apps/api/src/knowledge/knowledge.service.ts`:
(a) In the `CreateInput` interface, add:
```ts
  ticketId?: string | null;
```
(b) In `create()`, add `ticketId` to the `data` object:
```ts
  create(input: CreateInput): Promise<KnowledgeDoc> {
    return this.prisma.knowledgeDoc.create({
      data: {
        slug: input.slug,
        question: input.question,
        answer: input.answer,
        category: input.category,
        source: input.source ?? 'SYNCED',
        status: input.status ?? 'PUBLISHED',
        ticketId: input.ticketId ?? null,
      },
    });
  }
```

- [ ] **Step 4: Add `ticketId` to the DTO.** In `apps/api/src/knowledge/dto/create-knowledge.dto.ts`, add the import `IsUUID` to the `class-validator` import and add the field:
```ts
  @IsOptional()
  @IsUUID()
  ticketId?: string;
```

- [ ] **Step 5: Run the knowledge tests, verify they PASS; build.**
Run: `pnpm --filter api exec jest src/knowledge --silent && pnpm --filter api build`
Expected: knowledge tests pass; build clean.

- [ ] **Step 6: Commit.**
```bash
git add apps/api/src/knowledge
git commit -m "feat(api): link knowledge docs to their originating ticket (ticketId)"
```

---

## Task 2: Suggestion + candidate-creation logic on TicketsService (TDD)

**Files:**
- Create: `apps/api/src/tickets/tickets.suggest.ts`
- Modify: `apps/api/src/tickets/tickets.service.ts`
- Modify: `apps/api/src/tickets/__tests__/tickets.service.spec.ts`

- [ ] **Step 1: Create the pure slug helper.** Create `apps/api/src/tickets/tickets.suggest.ts`:
```ts
/** Propose a KB doc filename from a question, e.g. "How do I transfer a vehicle?" -> "how_do_transfer_vehicle.md". */
export function suggestSlug(question: string): string {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((w) => w.length >= 2)
    .slice(0, 4);
  return (words.length ? words.join('_') : 'answer') + '.md';
}
```

- [ ] **Step 2: Update the tickets service test (TDD).** In `apps/api/src/tickets/__tests__/tickets.service.spec.ts`:
(a) Add `inboundMessage`/`message` to the prisma mock and a `knowledge` mock; update construction. Change `makePrisma` to also include:
```ts
      inboundMessage: { findFirst: jest.fn() },
      message: { findFirst: jest.fn() },
```
and in `beforeEach`, build a knowledge mock and pass it as the 2nd constructor arg:
```ts
  let knowledge: { create: jest.Mock };
  beforeEach(() => {
    prisma = makePrisma();
    knowledge = { create: jest.fn().mockResolvedValue({ id: 'k1' }) };
    service = new TicketsService(prisma as any, knowledge as any);
  });
```
(b) Add these tests inside `describe('TicketsService', ...)`:
```ts
  it('suggestKnowledge derives question/answer/slug from the ticket conversation', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1' });
    prisma.inboundMessage.findFirst.mockResolvedValue({ body: 'How do I transfer a vehicle?' });
    prisma.message.findFirst.mockResolvedValue({ body: 'Use the eAuto portal under Transfers.' });
    const s = await service.suggestKnowledge('t1');
    expect(s).toEqual({
      ticketId: 't1',
      question: 'How do I transfer a vehicle?',
      answer: 'Use the eAuto portal under Transfers.',
      suggestedSlug: 'how_do_transfer_vehicle.md',
      category: 'General',
    });
  });

  it('createKnowledgeCandidate creates a FROM_ESCALATION CANDIDATE linked to the ticket', async () => {
    prisma.ticket.findUnique.mockResolvedValue({ id: 't1', contactId: 'c1' });
    await service.createKnowledgeCandidate('t1', { question: 'q', answer: 'a', slug: 'a.md', category: 'Transfer' });
    expect(knowledge.create).toHaveBeenCalledWith({
      slug: 'a.md', question: 'q', answer: 'a', category: 'Transfer',
      source: 'FROM_ESCALATION', status: 'CANDIDATE', ticketId: 't1',
    });
  });
```
Also add the `import { suggestSlug } from '../tickets.suggest';` is NOT needed in the spec (we assert the slug string directly).

- [ ] **Step 3: Run the tickets service test, verify it FAILS** (constructor arity + missing methods).
Run: `pnpm --filter api exec jest src/tickets/__tests__/tickets.service --silent`
Expected: FAIL.

- [ ] **Step 4: Implement.** In `apps/api/src/tickets/tickets.service.ts`:
(a) Add imports:
```ts
import { KnowledgeService } from '../knowledge/knowledge.service';
import { suggestSlug } from './tickets.suggest';
```
(b) Add `KnowledgeService` as a 2nd constructor parameter:
```ts
  constructor(
    private readonly prisma: PrismaService,
    private readonly knowledge: KnowledgeService,
  ) {}
```
(c) Add these two public methods (e.g. after `reopen`):
```ts
  /** Propose a Q&A for the KB from this ticket's conversation (latest inbound + latest agent reply). */
  async suggestKnowledge(id: string) {
    const ticket = await this.getOrThrow(id);
    const [inbound, outbound] = await Promise.all([
      this.prisma.inboundMessage.findFirst({
        where: { contactId: ticket.contactId },
        orderBy: { receivedAt: 'desc' },
      }),
      this.prisma.message.findFirst({
        where: { contactId: ticket.contactId, source: 'INBOX', body: { not: null } },
        orderBy: { sentAt: 'desc' },
      }),
    ]);
    const question = inbound?.body ?? '';
    const answer = outbound?.body ?? '';
    return { ticketId: id, question, answer, suggestedSlug: suggestSlug(question), category: 'General' };
  }

  /** Save an agent-curated Q&A as a CANDIDATE knowledge doc linked to this ticket. */
  async createKnowledgeCandidate(
    id: string,
    input: { question: string; answer: string; slug: string; category: string },
  ) {
    await this.getOrThrow(id);
    return this.knowledge.create({
      slug: input.slug,
      question: input.question,
      answer: input.answer,
      category: input.category,
      source: 'FROM_ESCALATION',
      status: 'CANDIDATE',
      ticketId: id,
    });
  }
```

- [ ] **Step 5: Run the tickets tests, verify they PASS.**
Run: `pnpm --filter api exec jest src/tickets --silent`
Expected: PASS (the 8 prior + 2 new).

- [ ] **Step 6: Commit.**
```bash
git add apps/api/src/tickets/tickets.suggest.ts apps/api/src/tickets/tickets.service.ts apps/api/src/tickets/__tests__/tickets.service.spec.ts
git commit -m "feat(api): ticket->knowledge suggestion + candidate creation"
```

---

## Task 3: Endpoints + module wiring

**Files:**
- Create: `apps/api/src/tickets/dto/create-knowledge-candidate.dto.ts`
- Modify: `apps/api/src/tickets/tickets.controller.ts`
- Modify: `apps/api/src/tickets/tickets.module.ts`

- [ ] **Step 1: Create the DTO** `apps/api/src/tickets/dto/create-knowledge-candidate.dto.ts`:
```ts
import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateKnowledgeCandidateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  answer!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category!: string;
}
```

- [ ] **Step 2: Add the routes.** In `apps/api/src/tickets/tickets.controller.ts`:
(a) Add the import:
```ts
import { CreateKnowledgeCandidateDto } from './dto/create-knowledge-candidate.dto';
```
(b) Add two routes to the controller class (after `reopen`):
```ts
  @Get(':id/knowledge-suggestion')
  knowledgeSuggestion(@Param('id') id: string) {
    return this.tickets.suggestKnowledge(id);
  }

  @Post(':id/knowledge-candidate')
  createKnowledgeCandidate(@Param('id') id: string, @Body() dto: CreateKnowledgeCandidateDto) {
    return this.tickets.createKnowledgeCandidate(id, dto);
  }
```
(`Get`, `Post`, `Param`, `Body` are already imported in this controller.)

- [ ] **Step 3: Import `KnowledgeModule` in `apps/api/src/tickets/tickets.module.ts`.** Add `import { KnowledgeModule } from '../knowledge/knowledge.module';` and add `KnowledgeModule,` to the `imports` array (alongside `AuthModule`). No cycle — `KnowledgeModule` does not import `TicketsModule`.

- [ ] **Step 4: Build + full suite + DI boot.**
Run: `pnpm --filter api build` → no TS errors.
Run: `pnpm --filter api test` → all suites pass.
DI boot (from `apps/api`, after build; compiled module at `dist/src/app.module`):
`node -e "require('reflect-metadata');const{NestFactory}=require('@nestjs/core');const{AppModule}=require('./dist/src/app.module');NestFactory.create(AppModule,{logger:false}).then(a=>a.close()).then(()=>console.log('DI boot OK')).catch(e=>{console.error('DI BOOT FAILED:',e.message);process.exit(1)})"`
Expected: `DI boot OK`.

- [ ] **Step 5: Commit.**
```bash
git add apps/api/src/tickets
git commit -m "feat(api): ticket knowledge-suggestion + knowledge-candidate endpoints"
```

---

## Self-Review

**Spec coverage (§2 pillar 3, §5):**
- Capture Q&A from a resolved ticket → CANDIDATE doc → Task 2 `createKnowledgeCandidate` + Task 3 `POST /tickets/:id/knowledge-candidate` ✅
- Candidate linked to its ticket → Task 1 `ticketId` + Task 2 (passes `ticketId: id`) ✅
- Suggested Q&A (question = dealer's message, answer = agent's reply, suggested doc) → Task 2 `suggestKnowledge` + Task 3 `GET /tickets/:id/knowledge-suggestion` ✅
- Review → publish/dismiss → **reused** Phase 1 (`GET /knowledge/candidates`, `POST /knowledge/:id/publish|dismiss`) — no new code ✅
- Published candidate feeds the bot → **reused** `KnowledgeService.retrieve()` (PUBLISHED-only) ✅

**Deferred (stated, not dropped):** the "Learned from escalations" tab + resolve-time "Save to KB?" modal + publish/dismiss buttons (Phase 5 frontend, after Plan 0B). Auto-suggesting category from intent (kept simple: `'General'` default, agent edits in the modal). No migration (`ticketId` column pre-exists).

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `KnowledgeService.create` `CreateInput` now includes `ticketId?: string | null`, matching the `createKnowledgeCandidate` call (`ticketId: id`) and the DTO. `suggestSlug` signature matches its test assertion (`'how_do_transfer_vehicle.md'`). `TicketsService` new constructor arity (`prisma, knowledge`) matches the updated spec instantiation. `source: 'FROM_ESCALATION'` / `status: 'CANDIDATE'` are valid `KnowledgeSource`/`KnowledgeStatus` enum values. Reused signatures verified: `KnowledgeService.create`, `prisma.inboundMessage.findFirst`, `prisma.message.findFirst` (source INBOX).

---

## The closed loop (end to end, after this phase)
1. Dealer messages → bot can't answer confidently → **escalates** → `Ticket` (Phase 3).
2. Agent works the ticket, replies via the inbox, resolves it.
3. Agent saves the Q&A → `POST /tickets/:id/knowledge-candidate` → `KnowledgeDoc(CANDIDATE, FROM_ESCALATION, ticketId)` (this phase).
4. Super Admin reviews `GET /knowledge/candidates` → `POST /knowledge/:id/publish` (Phase 1).
5. Next time a dealer asks the same thing, `KnowledgeService.retrieve()` returns the now-`PUBLISHED` doc → the bot **auto-answers** (Phase 2). Loop closed.

## Next plans (not in this document)
- **Plan 0B — Frontend shell port**, then the per-screen UIs that consume all of this backend (inbox dual-mode + audit card + Needs-Human queue + Learned-from-escalations tab, Knowledge library, Campaigns + language-delivery, Performance, Dashboard, Settings/Autopilot).
