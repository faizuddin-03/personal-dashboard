# Phase 1 — Knowledge Base (backend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Knowledge Base backend for the eAuto pivot — a `KnowledgeDoc` model, an admin-only CRUD + candidate-review API, and a keyword `retrieve()` function — so the Phase 2 Autopilot bot has grounded answers to draw from and Super Admins can manage the KB.

**Architecture:** A NestJS `knowledge` module (service + controller + DTOs) backed by a new `KnowledgeDoc` Prisma model. Retrieval is a pure, unit-tested scoring function (`scoreDoc`) consumed by `KnowledgeService.retrieve()`; no embeddings infra (keyword overlap, upgradeable later). The service is exported so Phase 2's `AutopilotModule` can inject it. All HTTP routes are Super-Admin-gated, matching the existing `state-language-mapping` / `users` modules.

**Tech Stack:** NestJS 10, Prisma 5 (PostgreSQL), class-validator, Jest, pnpm.

**Source spec:** `docs/superpowers/specs/2026-06-04-eauto-dealer-ai-pivot-design.md` (§5, §11).

**Branch:** Create `feat/eauto-knowledge-base` off `master` once PR #10 (Phase 0A) merges. If #10 is not yet merged and you need the dealer model present, stack this branch on `feat/eauto-dealer-ai-pivot` instead. (Phase 1 backend does not depend on the dealer fields, only on the base schema + Prisma client.)

**Scope note (why backend-only):** This plan deliberately excludes the Knowledge *UI* (Library / "Learned from escalations" tabs). That screen should be built on the new design system established by Plan 0B (frontend shell port); building it now against the old components would mean building it twice. The backend here is the part that unblocks the Phase 2 bot and is fully testable on its own. The KB UI becomes a task after 0B lands.

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/prisma/schema.prisma` | Add `KnowledgeSource` + `KnowledgeStatus` enums and the `KnowledgeDoc` model. |
| `apps/api/prisma/migrations/*` | Generated additive migration. |
| `apps/api/src/knowledge/knowledge.retrieval.ts` | Pure `tokenize()` + `scoreDoc()` ranking logic (no DB). |
| `apps/api/src/knowledge/__tests__/knowledge.retrieval.spec.ts` | Unit tests for scoring. |
| `apps/api/src/knowledge/knowledge.service.ts` | CRUD + candidates + publish/dismiss/reindex + `retrieve()`. |
| `apps/api/src/knowledge/__tests__/knowledge.service.spec.ts` | Service unit tests (mocked Prisma). |
| `apps/api/src/knowledge/dto/create-knowledge.dto.ts` | Create payload validation. |
| `apps/api/src/knowledge/dto/update-knowledge.dto.ts` | Update payload validation. |
| `apps/api/src/knowledge/dto/list-knowledge.dto.ts` | List query-filter validation. |
| `apps/api/src/knowledge/knowledge.controller.ts` | Admin-gated HTTP routes. |
| `apps/api/src/knowledge/knowledge.module.ts` | Wires service + controller; exports service. |
| `apps/api/src/app.module.ts` | Register `KnowledgeModule`. |
| `apps/api/prisma/seed.ts` | Seed 8 published + 3 candidate KB docs (idempotent). |

---

## Task 1: KnowledgeDoc model + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create (generated): `apps/api/prisma/migrations/<timestamp>_add_knowledge_doc/`

- [ ] **Step 1: Add enums + model.** At the END of `apps/api/prisma/schema.prisma`, append:

```prisma
enum KnowledgeSource {
  SYNCED
  FROM_ESCALATION
}

enum KnowledgeStatus {
  PUBLISHED
  CANDIDATE
  DISMISSED
}

model KnowledgeDoc {
  id        String          @id @default(uuid()) @db.Uuid
  slug      String
  question  String
  answer    String
  category  String
  source    KnowledgeSource @default(SYNCED)
  status    KnowledgeStatus @default(PUBLISHED)
  uses      Int             @default(0)
  ticketId  String?         @map("ticket_id") @db.Uuid
  createdAt DateTime        @default(now()) @map("created_at")
  updatedAt DateTime        @updatedAt @map("updated_at")

  @@index([status])
  @@index([source])
  @@index([category])
  @@map("knowledge_docs")
}
```

- [ ] **Step 2: Validate the schema.**

Run: `pnpm --filter api exec prisma validate`
Expected: `The schema ... is valid 🚀`

- [ ] **Step 3: Create + apply the migration (Postgres must be running — `docker compose up -d` from repo root if needed).**

Run: `pnpm --filter api exec prisma migrate dev --name add_knowledge_doc`
Expected: a new folder under `apps/api/prisma/migrations/`, output ending with `Your database is now in sync with your schema.` and `Generated Prisma Client`.

- [ ] **Step 4: Commit.**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): add KnowledgeDoc model"
```

---

## Task 2: Retrieval scoring (pure, TDD)

**Files:**
- Create: `apps/api/src/knowledge/knowledge.retrieval.ts`
- Test: `apps/api/src/knowledge/__tests__/knowledge.retrieval.spec.ts`

- [ ] **Step 1: Write the FAILING test.** Create `apps/api/src/knowledge/__tests__/knowledge.retrieval.spec.ts`:

```ts
import { tokenize, scoreDoc } from '../knowledge.retrieval';

describe('tokenize', () => {
  it('lowercases, splits on non-alphanumerics, and drops stopwords + 1-char tokens', () => {
    expect(tokenize('How do I transfer ownership?')).toEqual(['transfer', 'ownership']);
  });
});

describe('scoreDoc', () => {
  const doc = {
    question: 'How do I do an ownership transfer online?',
    answer: 'Use the eAuto portal under Transfers.',
    category: 'Transfer',
  };

  it('scores question-token matches highest', () => {
    expect(scoreDoc('ownership transfer', doc)).toBe(6); // two question hits @ 3 each
  });

  it('scores a category match above an answer-only match', () => {
    const catScore = scoreDoc('transfer', { question: 'x', answer: 'y', category: 'Transfer' });
    const ansScore = scoreDoc('portal', { question: 'x', answer: 'eauto portal', category: 'z' });
    expect(catScore).toBe(2);
    expect(ansScore).toBe(1);
  });

  it('returns 0 when nothing overlaps or the query is empty', () => {
    expect(scoreDoc('insurance roadtax', doc)).toBe(0);
    expect(scoreDoc('', doc)).toBe(0);
  });
});
```

- [ ] **Step 2: Run it, verify it FAILS.**

Run: `pnpm --filter api exec jest src/knowledge/__tests__/knowledge.retrieval --silent`
Expected: FAIL — cannot find module '../knowledge.retrieval'.

- [ ] **Step 3: Implement the scorer.** Create `apps/api/src/knowledge/knowledge.retrieval.ts`:

```ts
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'to', 'of', 'in', 'on', 'for', 'is', 'are',
  'do', 'does', 'how', 'what', 'can', 'i', 'my', 'you', 'your', 'with', 'it',
  'this', 'that', 'me', 'we', 'be', 'as', 'at', 'by', 'an', 'online',
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .split(' ')
    .filter((t) => t.length >= 2 && !STOPWORDS.has(t));
}

export interface ScorableDoc {
  question: string;
  answer: string;
  category: string;
}

/**
 * Keyword-overlap relevance score. Question matches weigh most, then category,
 * then answer body. Deterministic; no external calls. Upgradeable to embeddings
 * later behind the same signature.
 */
export function scoreDoc(query: string, doc: ScorableDoc): number {
  const queryTokens = new Set(tokenize(query));
  if (queryTokens.size === 0) return 0;

  const questionTokens = new Set(tokenize(doc.question));
  const categoryTokens = new Set(tokenize(doc.category));
  const answerTokens = new Set(tokenize(doc.answer));

  let score = 0;
  for (const t of queryTokens) {
    if (questionTokens.has(t)) score += 3;
    else if (categoryTokens.has(t)) score += 2;
    else if (answerTokens.has(t)) score += 1;
  }
  return score;
}
```

- [ ] **Step 4: Run it, verify it PASSES (5 assertions across 4 tests).**

Run: `pnpm --filter api exec jest src/knowledge/__tests__/knowledge.retrieval --silent`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/knowledge/knowledge.retrieval.ts apps/api/src/knowledge/__tests__/knowledge.retrieval.spec.ts
git commit -m "feat(api): add keyword KB retrieval scoring"
```

---

## Task 3: KnowledgeService (CRUD + retrieve, TDD)

**Files:**
- Create: `apps/api/src/knowledge/knowledge.service.ts`
- Test: `apps/api/src/knowledge/__tests__/knowledge.service.spec.ts`

- [ ] **Step 1: Write the FAILING test.** Create `apps/api/src/knowledge/__tests__/knowledge.service.spec.ts`:

```ts
import { NotFoundException } from '@nestjs/common';
import { KnowledgeService } from '../knowledge.service';

function makePrisma() {
  return {
    knowledgeDoc: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
}

describe('KnowledgeService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let service: KnowledgeService;

  beforeEach(() => {
    prisma = makePrisma();
    service = new KnowledgeService(prisma as any);
  });

  it('list() defaults to PUBLISHED and applies source/category filters', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([]);
    await service.list({ source: 'SYNCED', category: 'Transfer' });
    expect(prisma.knowledgeDoc.findMany).toHaveBeenCalledWith({
      where: { status: 'PUBLISHED', source: 'SYNCED', category: 'Transfer' },
      orderBy: { uses: 'desc' },
    });
  });

  it('list() with q re-ranks by relevance and drops non-matches', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([
      { id: '1', question: 'insurance renewal', answer: '', category: 'Insurance', uses: 10 },
      { id: '2', question: 'ownership transfer', answer: '', category: 'Transfer', uses: 5 },
    ]);
    const result = await service.list({ q: 'transfer' });
    expect(result.map((d: any) => d.id)).toEqual(['2']); // only the matching doc, ranked
  });

  it('candidates() returns CANDIDATE docs newest-first', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([]);
    await service.candidates();
    expect(prisma.knowledgeDoc.findMany).toHaveBeenCalledWith({
      where: { status: 'CANDIDATE' },
      orderBy: { createdAt: 'desc' },
    });
  });

  it('create() defaults source SYNCED + status PUBLISHED', async () => {
    prisma.knowledgeDoc.create.mockResolvedValue({ id: 'x' });
    await service.create({ slug: 'a.md', question: 'q', answer: 'a', category: 'General' });
    expect(prisma.knowledgeDoc.create).toHaveBeenCalledWith({
      data: { slug: 'a.md', question: 'q', answer: 'a', category: 'General', source: 'SYNCED', status: 'PUBLISHED' },
    });
  });

  it('update() throws NotFound when the doc is missing', async () => {
    prisma.knowledgeDoc.findUnique.mockResolvedValue(null);
    await expect(service.update('missing', { answer: 'b' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('setStatus() updates the status field', async () => {
    prisma.knowledgeDoc.findUnique.mockResolvedValue({ id: '1' });
    prisma.knowledgeDoc.update.mockResolvedValue({ id: '1', status: 'PUBLISHED' });
    await service.setStatus('1', 'PUBLISHED');
    expect(prisma.knowledgeDoc.update).toHaveBeenCalledWith({ where: { id: '1' }, data: { status: 'PUBLISHED' } });
  });

  it('retrieve() returns published docs ranked by score then uses, limited', async () => {
    prisma.knowledgeDoc.findMany.mockResolvedValue([
      { id: 'a', question: 'ownership transfer tukar milik', answer: '', category: 'Transfer', uses: 1 },
      { id: 'b', question: 'transfer', answer: '', category: 'General', uses: 99 },
      { id: 'c', question: 'insurance', answer: '', category: 'Insurance', uses: 50 },
    ]);
    const result = await service.retrieve('how do I transfer ownership', { limit: 2 });
    expect(prisma.knowledgeDoc.findMany).toHaveBeenCalledWith({ where: { status: 'PUBLISHED' } });
    expect(result.map((r) => r.doc.id)).toEqual(['a', 'b']); // 'a' scores 6, 'b' scores 3; 'c' filtered out
    expect(result[0].score).toBe(6);
  });
});
```

- [ ] **Step 2: Run it, verify it FAILS.**

Run: `pnpm --filter api exec jest src/knowledge/__tests__/knowledge.service --silent`
Expected: FAIL — cannot find module '../knowledge.service'.

- [ ] **Step 3: Implement the service.** Create `apps/api/src/knowledge/knowledge.service.ts`:

```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { KnowledgeDoc, KnowledgeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { scoreDoc } from './knowledge.retrieval';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { ListKnowledgeDto } from './dto/list-knowledge.dto';

const DEFAULT_RETRIEVE_LIMIT = 3;

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  async list(filter: ListKnowledgeDto): Promise<KnowledgeDoc[]> {
    const where: Record<string, unknown> = { status: filter.status ?? 'PUBLISHED' };
    if (filter.source) where.source = filter.source;
    if (filter.category) where.category = filter.category;

    const docs = await this.prisma.knowledgeDoc.findMany({ where, orderBy: { uses: 'desc' } });

    const q = filter.q?.trim();
    if (!q) return docs;
    return docs
      .map((doc) => ({ doc, score: scoreDoc(q, doc) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.doc.uses - a.doc.uses)
      .map((r) => r.doc);
  }

  candidates(): Promise<KnowledgeDoc[]> {
    return this.prisma.knowledgeDoc.findMany({
      where: { status: 'CANDIDATE' },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(dto: CreateKnowledgeDto): Promise<KnowledgeDoc> {
    return this.prisma.knowledgeDoc.create({
      data: {
        slug: dto.slug,
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
        source: dto.source ?? 'SYNCED',
        status: dto.status ?? 'PUBLISHED',
      },
    });
  }

  async update(id: string, dto: UpdateKnowledgeDto): Promise<KnowledgeDoc> {
    await this.getOrThrow(id);
    return this.prisma.knowledgeDoc.update({
      where: { id },
      data: {
        slug: dto.slug,
        question: dto.question,
        answer: dto.answer,
        category: dto.category,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.getOrThrow(id);
    await this.prisma.knowledgeDoc.delete({ where: { id } });
  }

  async setStatus(id: string, status: KnowledgeStatus): Promise<KnowledgeDoc> {
    await this.getOrThrow(id);
    return this.prisma.knowledgeDoc.update({ where: { id }, data: { status } });
  }

  async reindex(id: string): Promise<KnowledgeDoc> {
    // No-op placeholder for keyword retrieval; seam for future embedding refresh.
    return this.getOrThrow(id);
  }

  /**
   * Rank PUBLISHED docs against a query (and optional intent). Consumed by the
   * Phase 2 Autopilot bot to ground replies. Returns highest-scoring first.
   */
  async retrieve(
    query: string,
    opts: { intent?: string; limit?: number } = {},
  ): Promise<{ doc: KnowledgeDoc; score: number }[]> {
    const limit = opts.limit ?? DEFAULT_RETRIEVE_LIMIT;
    const effectiveQuery = opts.intent ? `${query} ${opts.intent}` : query;
    const docs = await this.prisma.knowledgeDoc.findMany({ where: { status: 'PUBLISHED' } });
    return docs
      .map((doc) => ({ doc, score: scoreDoc(effectiveQuery, doc) }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score || b.doc.uses - a.doc.uses)
      .slice(0, limit);
  }

  private async getOrThrow(id: string): Promise<KnowledgeDoc> {
    const doc = await this.prisma.knowledgeDoc.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Knowledge doc not found');
    return doc;
  }
}
```

- [ ] **Step 4: Run it, verify it PASSES (7 tests).**

Run: `pnpm --filter api exec jest src/knowledge/__tests__/knowledge.service --silent`
Expected: PASS.

- [ ] **Step 5: Commit.**

```bash
git add apps/api/src/knowledge/knowledge.service.ts apps/api/src/knowledge/__tests__/knowledge.service.spec.ts
git commit -m "feat(api): add KnowledgeService (CRUD, candidates, retrieve)"
```

---

## Task 4: DTOs, controller, module, wiring (admin-only)

**Files:**
- Create: `apps/api/src/knowledge/dto/create-knowledge.dto.ts`
- Create: `apps/api/src/knowledge/dto/update-knowledge.dto.ts`
- Create: `apps/api/src/knowledge/dto/list-knowledge.dto.ts`
- Create: `apps/api/src/knowledge/knowledge.controller.ts`
- Create: `apps/api/src/knowledge/knowledge.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create `create-knowledge.dto.ts`:**

```ts
import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateKnowledgeDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question!: string;

  @IsString()
  @MinLength(1)
  answer!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category!: string;

  @IsOptional()
  @IsEnum(['SYNCED', 'FROM_ESCALATION'])
  source?: 'SYNCED' | 'FROM_ESCALATION';

  @IsOptional()
  @IsEnum(['PUBLISHED', 'CANDIDATE', 'DISMISSED'])
  status?: 'PUBLISHED' | 'CANDIDATE' | 'DISMISSED';
}
```

- [ ] **Step 2: Create `update-knowledge.dto.ts`:**

```ts
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateKnowledgeDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  answer?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category?: string;
}
```

- [ ] **Step 3: Create `list-knowledge.dto.ts`:**

```ts
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class ListKnowledgeDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsEnum(['SYNCED', 'FROM_ESCALATION'])
  source?: 'SYNCED' | 'FROM_ESCALATION';

  @IsOptional()
  @IsEnum(['PUBLISHED', 'CANDIDATE', 'DISMISSED'])
  status?: 'PUBLISHED' | 'CANDIDATE' | 'DISMISSED';
}
```

- [ ] **Step 4: Create `knowledge.controller.ts`** (admin-only, mirrors `state-language-mapping.controller.ts`):

```ts
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { KnowledgeService } from './knowledge.service';
import { CreateKnowledgeDto } from './dto/create-knowledge.dto';
import { UpdateKnowledgeDto } from './dto/update-knowledge.dto';
import { ListKnowledgeDto } from './dto/list-knowledge.dto';

@Controller('knowledge')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class KnowledgeController {
  constructor(private readonly knowledge: KnowledgeService) {}

  @Get()
  list(@Query() query: ListKnowledgeDto) {
    return this.knowledge.list(query);
  }

  @Get('candidates')
  candidates() {
    return this.knowledge.candidates();
  }

  @Post()
  create(@Body() dto: CreateKnowledgeDto) {
    return this.knowledge.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateKnowledgeDto) {
    return this.knowledge.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.knowledge.remove(id);
  }

  @Post(':id/publish')
  publish(@Param('id') id: string) {
    return this.knowledge.setStatus(id, 'PUBLISHED');
  }

  @Post(':id/dismiss')
  dismiss(@Param('id') id: string) {
    return this.knowledge.setStatus(id, 'DISMISSED');
  }

  @Post(':id/reindex')
  reindex(@Param('id') id: string) {
    return this.knowledge.reindex(id);
  }
}
```

- [ ] **Step 5: Create `knowledge.module.ts`** (mirrors `state-language-mapping.module.ts`; exports the service so Phase 2 can inject it):

```ts
import { Module } from '@nestjs/common';
import { KnowledgeService } from './knowledge.service';
import { KnowledgeController } from './knowledge.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
```

- [ ] **Step 6: Register `KnowledgeModule` in `apps/api/src/app.module.ts`.** Add the import after the other module imports:

```ts
import { KnowledgeModule } from './knowledge/knowledge.module';
```

and add `KnowledgeModule,` to the `imports` array (e.g. after `LlmModule,`).

- [ ] **Step 7: Verify build + the new tests still pass together.**

Run: `pnpm --filter api exec jest src/knowledge --silent && pnpm --filter api build`
Expected: all knowledge tests pass; `nest build` completes with no TypeScript errors.

- [ ] **Step 8: Commit.**

```bash
git add apps/api/src/knowledge apps/api/src/app.module.ts
git commit -m "feat(api): add admin-only Knowledge HTTP API"
```

---

## Task 5: Seed the knowledge base

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Add the KB dataset.** In `apps/api/prisma/seed.ts`, after the `SEED_DEALERS` constant (and its trailing `NOTE:` comment), add:

```ts
type SeedKnowledge = {
  slug: string; question: string; answer: string; category: string;
  uses: number; source: 'SYNCED' | 'FROM_ESCALATION'; status: 'PUBLISHED' | 'CANDIDATE';
};

const SEED_KNOWLEDGE: SeedKnowledge[] = [
  { slug: 'ownership_transfer.md', question: 'How do I do an ownership transfer (tukar milik) online?', answer: 'Transfers → New transfer, enter vehicle & buyer, both parties e-sign, book Puspakom B5. JPJ issues the new geran in 2–5 working days via e-STMS.', category: 'Transfer', uses: 842, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'credits_pricing.md', question: 'How does credit top-up and pricing work?', answer: 'Credits power vehicle-history checks & e-STMS. Bundles: 50 = RM 250, 200 = RM 900 (10% off). Credits never expire. Top up under Billing.', category: 'Billing', uses: 735, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'history_check.md', question: "What's the turnaround for a JPJ vehicle-history check?", answer: 'Instant in most cases. If the JPJ source is slow, results arrive within minutes and any failed check is auto-refunded.', category: 'Checks', uses: 610, source: 'FROM_ESCALATION', status: 'PUBLISHED' },
  { slug: 'roadtax_renewal.md', question: 'How do road-tax renewals & refunds work?', answer: 'Renew road tax + insurance together for instant issuance. JPJ refunds unused, pro-rated road tax on transfer/deregistration — submit under Renewals → Refunds.', category: 'Road tax', uses: 455, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'insurance_guide.md', question: 'How do I issue motor insurance via eAuto?', answer: 'Get instant quotes from multiple panels in the dealer app, pick coverage, and issue cover in seconds — road tax follows automatically.', category: 'Insurance', uses: 498, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'subscription_plans.md', question: 'What\'s included in each dealer plan tier?', answer: 'Bronze: pay-as-you-go basics. Silver: priority queue + monthly transfer allowance. Gold: unlimited + bulk e-STMS pricing & dedicated support.', category: 'Billing', uses: 512, source: 'SYNCED', status: 'PUBLISHED' },
  { slug: 'compliance_jpj.md', question: 'What documents does JPJ require for a transfer?', answer: "Both parties' MyKad, valid Puspakom B5, active insurance, and a settled road tax. Company-registered vehicles need SSM docs + authorised-signatory letter.", category: 'Compliance', uses: 333, source: 'FROM_ESCALATION', status: 'PUBLISHED' },
  { slug: 'portal_how_to.md', question: 'How do I add a staff login to the dealer portal?', answer: 'Settings → Team → Invite. Owners can add sales/admin seats; access is controlled per role. Locked out? Reset via the login page or contact us.', category: 'General', uses: 271, source: 'SYNCED', status: 'PUBLISHED' },
  // candidates awaiting review (Phase 5 "Learned from escalations") — seeded so the candidates endpoint has data
  { slug: 'ownership_transfer.md', question: 'Can eAuto handle transfer for a company-registered vehicle?', answer: "Yes — company-registered (Sdn Bhd) vehicles can be transferred via eAuto. You'll need the SSM business docs + an authorised-signatory letter on top of the standard transfer documents.", category: 'Transfer', uses: 9, source: 'FROM_ESCALATION', status: 'CANDIDATE' },
  { slug: 'credits_pricing.md', question: "What's the price per history-check credit in a bundle?", answer: 'In the 200-check bundle it works out to about RM 4.50 per check (RM 900 total — 10% off pay-as-you-go). Credits never expire.', category: 'Billing', uses: 14, source: 'FROM_ESCALATION', status: 'CANDIDATE' },
  { slug: 'subscription_plans.md', question: 'Does my plan include unlimited road-tax renewals?', answer: "Road-tax renewals aren't capped by tier — renew as many vehicles as you like; you only pay the JPJ road tax + insurance. Gold just adds priority processing.", category: 'Billing', uses: 6, source: 'FROM_ESCALATION', status: 'CANDIDATE' },
];
```

- [ ] **Step 2: Add the seeding loop.** In `apps/api/prisma/seed.ts`, after the autopilot-defaults loop (and before `main`'s closing brace), add (idempotent by slug+question, since slugs repeat across published doc + candidate):

```ts
  let createdKb = 0;
  for (const k of SEED_KNOWLEDGE) {
    const existing = await prisma.knowledgeDoc.findFirst({ where: { slug: k.slug, question: k.question } });
    if (existing) continue;
    await prisma.knowledgeDoc.create({
      data: {
        slug: k.slug,
        question: k.question,
        answer: k.answer,
        category: k.category,
        uses: k.uses,
        source: k.source as any,
        status: k.status as any,
      },
    });
    createdKb++;
  }
  if (createdKb > 0) console.log(`Seeded ${createdKb} knowledge doc(s).`);
  else console.log('Knowledge docs already exist — skipping.');
```

- [ ] **Step 3: Run the seed.**

Run: `pnpm --filter api db:seed`
Expected: output includes `Seeded 11 knowledge doc(s).`

- [ ] **Step 4: Verify idempotency + retrieval-relevant data.**

Run again: `pnpm --filter api db:seed`
Expected: `Knowledge docs already exist — skipping.`

Then from `apps/api`:
`node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();Promise.all([p.knowledgeDoc.count({where:{status:'PUBLISHED'}}),p.knowledgeDoc.count({where:{status:'CANDIDATE'}})]).then(([pub,cand])=>{console.log({published:pub,candidates:cand});return p.$disconnect()})"`
Expected: `{ published: 8, candidates: 3 }`.

- [ ] **Step 5: Commit.**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed knowledge base (8 published + 3 candidates)"
```

---

## Self-Review

**Spec coverage (§5, §11):**
- `KnowledgeDoc` model with slug/question/answer/category/source/status/uses/ticketId → Task 1 ✅
- GET /knowledge (filters: source, category, q; published by default) → Task 3 `list` + Task 4 route ✅
- POST / PATCH / DELETE /knowledge → Task 3 + Task 4 ✅
- GET /knowledge/candidates, POST publish, POST dismiss → Task 3 `candidates`/`setStatus` + Task 4 ✅
- POST /knowledge/:id/reindex (no-op placeholder) → Task 3 `reindex` + Task 4 ✅
- `retrieve(query, {intent?, limit})` keyword ranking — the seam the Phase 2 bot calls → Task 2 + Task 3 ✅
- Seed 8 published docs (+ 3 candidates so the candidates endpoint has data) → Task 5 ✅
- Super-Admin-only access → Task 4 (`@Roles('ADMIN')` on the controller) ✅
- Service exported for Phase 2 injection → Task 4 module `exports: [KnowledgeService]` ✅

**Deferred (stated, not silently dropped):** the Knowledge **UI** (Library / Learned tabs, edit modal, source/category filters) — built after Plan 0B on the new design system. Ticket linkage on `FROM_ESCALATION` docs (`ticketId`) stays null until Phase 3 creates the `Ticket` model.

**Placeholder scan:** none — every step has concrete code/commands. The candidate seed is explicitly labelled, not hidden. `reindex` is an intentional documented no-op, not a stub gap.

**Type consistency:** `scoreDoc(query, doc)` / `tokenize` signatures match across the retrieval module, its test, and `KnowledgeService`. `KnowledgeService` method names (`list`, `candidates`, `create`, `update`, `remove`, `setStatus`, `reindex`, `retrieve`) match the controller call sites and the service test. DTO field names (`slug`, `question`, `answer`, `category`, `source`, `status`, `q`) match the service usage and the Prisma model. Enum string literals (`'PUBLISHED'`, `'CANDIDATE'`, `'DISMISSED'`, `'SYNCED'`, `'FROM_ESCALATION'`) match the schema enums from Task 1.

---

## Next plans (not in this document)
1. **Plan 0B — Frontend shell port** (prerequisite for all new UI, incl. the Knowledge screen).
2. **Knowledge UI** (after 0B): `api/knowledge.ts` client + react-query hooks; Knowledge screen Library tab (cards, source/category filters, search, edit modal, re-index) and a "Learned from escalations" tab placeholder; Super-Admin gate (Support sees the "Admin only" empty state).
3. **Plan 2 — Autopilot bot:** injects `KnowledgeService.retrieve()` to ground replies; routes inbound messages by confidence; escalates below threshold.
