# Phase 0A — Backend Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Lay the backend foundation for the eAuto dealer + AI pivot: evolve the `Contact` model into a dealer model, add a swappable `LlmService` (mock-first so the demo runs offline), and seed a realistic dealer base + autopilot settings — unblocking Phase 1 (Knowledge Base) and the Autopilot bot.

**Architecture:** Additive Prisma migration (all new dealer columns nullable/defaulted so existing rows survive; demographic columns left untouched). A NestJS `LlmModule` exposes an abstract `LlmService` bound to a deterministic `MockLlmService` for now; a real provider is swapped in later behind the same interface. Seed script extended idempotently.

**Tech Stack:** NestJS 10, Prisma 5 (PostgreSQL), Jest, pnpm workspaces, ts-node.

**Source spec:** `docs/superpowers/specs/2026-06-04-eauto-dealer-ai-pivot-design.md` (§5, §10).

**Branch:** `feat/eauto-dealer-ai-pivot` (already checked out).

---

## File Structure

| File | Responsibility |
|---|---|
| `apps/api/prisma/schema.prisma` | Add dealer enums + dealer fields on `Contact`; add `PAUSED` to `BlastStatus` + `pausedAt` on `Blast`. |
| `apps/api/prisma/migrations/*` | Generated migration (additive). |
| `apps/api/src/llm/llm.types.ts` | Pure TypeScript interfaces for LLM I/O. |
| `apps/api/src/llm/llm.service.ts` | Abstract `LlmService` (DI token + contract). |
| `apps/api/src/llm/mock-llm.service.ts` | Deterministic mock implementation. |
| `apps/api/src/llm/llm.module.ts` | `@Global` module binding `LlmService` → `MockLlmService`. |
| `apps/api/src/llm/__tests__/mock-llm.service.spec.ts` | Unit tests for the mock. |
| `apps/api/src/app.module.ts` | Register `LlmModule`. |
| `apps/api/prisma/seed.ts` | Append idempotent dealer seed + autopilot setting defaults. |

---

## Task 1: Dealer data model (Prisma migration)

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create (generated): `apps/api/prisma/migrations/<timestamp>_add_dealer_model/`

- [ ] **Step 1: Add dealer enums.** In `apps/api/prisma/schema.prisma`, immediately after the `OptInStatus` enum (currently ends at line ~98), add:

```prisma
enum DealerTier {
  BRONZE
  SILVER
  GOLD
}

enum SubscriptionStatus {
  ACTIVE
  EXPIRING
  LAPSED
}

enum VehicleSpecialization {
  NATIONAL
  CONTINENTAL_LUXURY
  SUV_MPV
  COMMERCIAL_PICKUP
  EV_HYBRID
  MOTORCYCLE
  MULTI_BRAND
}

enum NumberType {
  PHONE
  LANE
}

enum PicRole {
  OWNER
  SALES_MANAGER
  ADMIN
}
```

- [ ] **Step 2: Add dealer fields to `Contact`.** Inside the `Contact` model, after the `attributes Json @default("{}")` line, add:

```prisma
  // dealer (eAuto) attributes — pivot from B2C demographics (demographic columns kept nullable, unused)
  picName               String?                @map("pic_name")
  picRole               PicRole?               @map("pic_role")
  numberType            NumberType             @default(PHONE) @map("number_type")
  tier                  DealerTier?            @map("tier")
  subscriptionStatus    SubscriptionStatus?    @map("subscription_status")
  vehicleSpecialization VehicleSpecialization? @map("vehicle_specialization")
  historyCheckCredits   Int                    @default(0) @map("history_check_credits")
  transfers30d          Int                    @default(0) @map("transfers_30d")
  lifetimeSpend         Decimal                @default(0) @map("lifetime_spend") @db.Decimal(12, 2)
  joinedAt              DateTime?              @map("joined_at")
  lastSeenAt            DateTime?              @map("last_seen_at")
```

And add three indexes alongside the existing `@@index` lines in `Contact`:

```prisma
  @@index([tier])
  @@index([subscriptionStatus])
  @@index([vehicleSpecialization])
```

- [ ] **Step 3: Add `PAUSED` campaign status now (cheap, avoids a later migration).** In the `BlastStatus` enum add `PAUSED` after `RUNNING`:

```prisma
enum BlastStatus {
  DRAFT
  SCHEDULED
  RUNNING
  PAUSED
  COMPLETED
  CANCELED
  FAILED
}
```

In the `Blast` model, after `completedAt DateTime? @map("completed_at")`, add:

```prisma
  pausedAt            DateTime?    @map("paused_at")
```

- [ ] **Step 4: Validate the schema.**

Run: `pnpm --filter api exec prisma validate`
Expected: `The schema at prisma\schema.prisma is valid 🚀`

- [ ] **Step 5: Create + apply the migration (non-interactive).**

Run: `pnpm --filter api exec prisma migrate dev --name add_dealer_model`
Expected: a new folder under `apps/api/prisma/migrations/`, output ending with `Your database is now in sync with your schema.` and `Generated Prisma Client`.
(Requires Postgres running: `docker compose up -d` from repo root if not already up.)

- [ ] **Step 6: Commit.**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(api): add dealer model fields + PAUSED campaign status"
```

---

## Task 2: Swappable LlmService (mock-first)

**Files:**
- Create: `apps/api/src/llm/llm.types.ts`
- Create: `apps/api/src/llm/llm.service.ts`
- Create: `apps/api/src/llm/mock-llm.service.ts`
- Create: `apps/api/src/llm/llm.module.ts`
- Test: `apps/api/src/llm/__tests__/mock-llm.service.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Define the LLM I/O types.** Create `apps/api/src/llm/llm.types.ts`:

```ts
export interface KnowledgeSnippet {
  question: string;
  answer: string;
}

export interface GenerateReplyInput {
  message: string;
  intent?: string;
  knowledge: KnowledgeSnippet[];
  dealerName?: string;
}

export interface GenerateReplyResult {
  text: string;
  confidence: number; // 0..1
}

export interface ClassifyIntentInput {
  message: string;
  intents: string[];
}

export interface ClassifyIntentResult {
  intent: string;
  confidence: number; // 0..1
}

export type ApprovalLikelihood = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GenerateTemplateDraftsInput {
  brief: string;
  languages: string[]; // e.g. ['EN','MS','ZH']
  tone: 'friendly' | 'formal';
}

export interface TemplateDraft {
  language: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  approvalLikelihood: ApprovalLikelihood;
  rationale: string;
}
```

- [ ] **Step 2: Define the abstract `LlmService` (DI token + contract).** Create `apps/api/src/llm/llm.service.ts`:

```ts
import {
  GenerateReplyInput,
  GenerateReplyResult,
  ClassifyIntentInput,
  ClassifyIntentResult,
  GenerateTemplateDraftsInput,
  TemplateDraft,
} from './llm.types';

/**
 * Abstract contract for all LLM-backed features. Used as the NestJS injection
 * token so the concrete provider (mock vs. real) is swappable without touching
 * call sites. See llm.module.ts for binding.
 */
export abstract class LlmService {
  abstract generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult>;
  abstract classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentResult>;
  abstract generateTemplateDrafts(input: GenerateTemplateDraftsInput): Promise<TemplateDraft[]>;
}
```

- [ ] **Step 3: Write the failing test for the mock.** Create `apps/api/src/llm/__tests__/mock-llm.service.spec.ts`:

```ts
import { MockLlmService } from '../mock-llm.service';

describe('MockLlmService', () => {
  const svc = new MockLlmService();

  it('returns the top KB answer with high confidence when knowledge is present', async () => {
    const r = await svc.generateReply({
      message: 'how do I transfer ownership?',
      knowledge: [{ question: 'transfer?', answer: 'Use the eAuto portal.' }],
    });
    expect(r.text).toBe('Use the eAuto portal.');
    expect(r.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('returns low confidence when no knowledge is available', async () => {
    const r = await svc.generateReply({ message: 'anything', knowledge: [] });
    expect(r.confidence).toBeLessThan(0.5);
  });

  it('classifies intent by keyword and falls back to general', async () => {
    const hit = await svc.classifyIntent({
      message: 'I need a credit topup please',
      intents: ['credit_topup', 'complaint'],
    });
    expect(hit.intent).toBe('credit_topup');

    const miss = await svc.classifyIntent({ message: 'hello there', intents: ['credit_topup'] });
    expect(miss.intent).toBe('general');
  });

  it('generates exactly one draft per requested language', async () => {
    const drafts = await svc.generateTemplateDrafts({
      brief: 'subscription renewal reminder',
      languages: ['EN', 'MS'],
      tone: 'friendly',
    });
    expect(drafts).toHaveLength(2);
    expect(drafts.map((d) => d.language)).toEqual(['EN', 'MS']);
    expect(drafts[0].variables.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 4: Run the test to verify it fails.**

Run: `pnpm --filter api exec jest src/llm --silent`
Expected: FAIL — `Cannot find module '../mock-llm.service'`.

- [ ] **Step 5: Implement `MockLlmService`.** Create `apps/api/src/llm/mock-llm.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { LlmService } from './llm.service';
import {
  GenerateReplyInput,
  GenerateReplyResult,
  ClassifyIntentInput,
  ClassifyIntentResult,
  GenerateTemplateDraftsInput,
  TemplateDraft,
} from './llm.types';

/**
 * Deterministic, offline LLM stub. Default provider so the demo and CI run
 * without an API key. Behavior is intentionally simple and predictable.
 */
@Injectable()
export class MockLlmService extends LlmService {
  async generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    const top = input.knowledge[0];
    if (!top) {
      return { text: "I'm not certain about that — I'll pass you to a teammate.", confidence: 0.2 };
    }
    const who = input.dealerName ? `${input.dealerName}, ` : '';
    return { text: `${who}${top.answer}`, confidence: 0.9 };
  }

  async classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentResult> {
    const lower = input.message.toLowerCase();
    const match = input.intents.find((i) => lower.includes(i.replace(/_/g, ' ')));
    return match ? { intent: match, confidence: 0.8 } : { intent: 'general', confidence: 0.4 };
  }

  async generateTemplateDrafts(input: GenerateTemplateDraftsInput): Promise<TemplateDraft[]> {
    return input.languages.map((lang) => ({
      language: lang,
      name: 'generated_template',
      category: 'UTILITY',
      body: `[${lang}] ${input.brief} — {{1}}`,
      variables: ['name'],
      approvalLikelihood: 'HIGH',
      rationale: 'Transactional wording, no promotional language — fits the Utility category.',
    }));
  }
}
```

- [ ] **Step 6: Run the test to verify it passes.**

Run: `pnpm --filter api exec jest src/llm --silent`
Expected: PASS — 4 tests green.

- [ ] **Step 7: Create the module.** Create `apps/api/src/llm/llm.module.ts`:

```ts
import { Global, Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { MockLlmService } from './mock-llm.service';

/**
 * Binds the LlmService token to a concrete provider. Mock-first: swap
 * `useClass` (or use a `useFactory` keyed on ConfigService.get('LLM_PROVIDER'))
 * when a real provider lands — no call site changes.
 */
@Global()
@Module({
  providers: [{ provide: LlmService, useClass: MockLlmService }],
  exports: [LlmService],
})
export class LlmModule {}
```

- [ ] **Step 8: Register `LlmModule` in `AppModule`.** In `apps/api/src/app.module.ts`, add the import near the other module imports (after line 15):

```ts
import { LlmModule } from './llm/llm.module';
```

and add `LlmModule,` to the `imports` array (e.g. after `StateLanguageMappingModule,`).

- [ ] **Step 9: Verify the app boots (DI wiring).**

Run: `pnpm --filter api exec jest src/llm --silent && pnpm --filter api build`
Expected: tests PASS and `nest build` completes with no TypeScript errors.

- [ ] **Step 10: Commit.**

```bash
git add apps/api/src/llm apps/api/src/app.module.ts
git commit -m "feat(api): add swappable LlmService with deterministic mock provider"
```

---

## Task 3: Seed dealer base + autopilot defaults

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Add dealer mapping helpers + data.** In `apps/api/prisma/seed.ts`, after the existing `import * as bcrypt from 'bcrypt';` line, add the dealer dataset and field-mapping helpers (these mirror `docs/design/data.jsx`; phones become E.164 by stripping separators and prefixing `+60`):

```ts
type SeedDealer = {
  name: string; pic: string; picRole: 'OWNER' | 'SALES_MANAGER' | 'ADMIN';
  numberType: 'PHONE' | 'LANE'; phone: string; state: string; vehicle: string;
  lang: 'EN' | 'MS' | 'ZH'; optIn: boolean; tier: 'BRONZE' | 'SILVER' | 'GOLD';
  sub: 'ACTIVE' | 'EXPIRING' | 'LAPSED'; credits: number; transfers: number;
  joined: string; spend: number;
};

// E.164 for Malaysia: strip non-digits, prefix +60 (design phones omit +60 and the leading 0)
const toE164 = (raw: string) => '+60' + raw.replace(/\D/g, '');

const STATE_ENUM: Record<string, string> = {
  Selangor: 'SELANGOR', 'Kuala Lumpur': 'KUALA_LUMPUR', Penang: 'PENANG', Johor: 'JOHOR',
  Perak: 'PERAK', 'Negeri Sembilan': 'NEGERI_SEMBILAN', Melaka: 'MELAKA', Kedah: 'KEDAH',
  Pahang: 'PAHANG', Terengganu: 'TERENGGANU', Kelantan: 'KELANTAN', Perlis: 'PERLIS',
  Sabah: 'SABAH', Sarawak: 'SARAWAK', Labuan: 'LABUAN', Putrajaya: 'PUTRAJAYA',
};

const VEHICLE_ENUM: Record<string, string> = {
  National: 'NATIONAL', 'Continental/Luxury': 'CONTINENTAL_LUXURY', 'SUV/MPV': 'SUV_MPV',
  'Commercial/Pickup': 'COMMERCIAL_PICKUP', 'EV/Hybrid': 'EV_HYBRID', Motorcycle: 'MOTORCYCLE',
  'Multi-brand': 'MULTI_BRAND',
};

const SEED_DEALERS: SeedDealer[] = [
  { name: 'Auto Bestari Sdn Bhd', pic: 'Rahman Abdullah', picRole: 'OWNER', numberType: 'PHONE', phone: '12-345 6789', state: 'Selangor', vehicle: 'National', lang: 'MS', optIn: true, tier: 'GOLD', sub: 'EXPIRING', credits: 142, transfers: 84, joined: 'Jan 2024', spend: 48900 },
  { name: 'KL Premium Motors', pic: 'Tan Wei Ming', picRole: 'SALES_MANAGER', numberType: 'PHONE', phone: '16-228 7741', state: 'Kuala Lumpur', vehicle: 'Continental/Luxury', lang: 'ZH', optIn: true, tier: 'GOLD', sub: 'ACTIVE', credits: 880, transfers: 112, joined: 'Mar 2023', spend: 124300 },
  { name: 'Penang Auto Mart', pic: 'Rajesh Kumar', picRole: 'ADMIN', numberType: 'PHONE', phone: '19-770 2210', state: 'Penang', vehicle: 'Multi-brand', lang: 'EN', optIn: true, tier: 'SILVER', sub: 'ACTIVE', credits: 36, transfers: 41, joined: 'Aug 2024', spend: 38750 },
  { name: 'JB Used Cars', pic: 'Siti Khadijah Yusof', picRole: 'OWNER', numberType: 'PHONE', phone: '13-554 9082', state: 'Johor', vehicle: 'SUV/MPV', lang: 'MS', optIn: true, tier: 'BRONZE', sub: 'EXPIRING', credits: 8, transfers: 12, joined: 'Feb 2025', spend: 15600 },
  { name: 'EV Hub Motors', pic: 'Lim Chee Keong', picRole: 'OWNER', numberType: 'PHONE', phone: '12-908 4453', state: 'Selangor', vehicle: 'EV/Hybrid', lang: 'EN', optIn: true, tier: 'GOLD', sub: 'ACTIVE', credits: 1240, transfers: 96, joined: 'Nov 2023', spend: 189000 },
  { name: 'Cahaya Auto Trading', pic: 'Farah Diana Ismail', picRole: 'SALES_MANAGER', numberType: 'PHONE', phone: '17-665 1190', state: 'Kuala Lumpur', vehicle: 'SUV/MPV', lang: 'MS', optIn: true, tier: 'SILVER', sub: 'ACTIVE', credits: 210, transfers: 38, joined: 'Jun 2024', spend: 42400 },
  { name: 'Ipoh Motor Sdn Bhd', pic: 'Arumugam Ganesan', picRole: 'OWNER', numberType: 'PHONE', phone: '11-2876 5540', state: 'Perak', vehicle: 'Commercial/Pickup', lang: 'EN', optIn: false, tier: 'BRONZE', sub: 'LAPSED', credits: 0, transfers: 0, joined: 'May 2024', spend: 21100 },
  { name: 'Northern Auto Gallery', pic: 'Wong Mei Ling', picRole: 'ADMIN', numberType: 'LANE', phone: '4-228 9001', state: 'Penang', vehicle: 'National', lang: 'ZH', optIn: true, tier: 'BRONZE', sub: 'ACTIVE', credits: 54, transfers: 9, joined: 'Oct 2024', spend: 9900 },
  { name: 'Seremban Auto Niaga', pic: 'Muhammad Hafiz', picRole: 'OWNER', numberType: 'PHONE', phone: '14-552 0098', state: 'Negeri Sembilan', vehicle: 'Motorcycle', lang: 'MS', optIn: true, tier: 'BRONZE', sub: 'ACTIVE', credits: 120, transfers: 6, joined: 'Jan 2024', spend: 1200 },
  { name: 'Klang Valley Cars', pic: 'Chong Li Wei', picRole: 'SALES_MANAGER', numberType: 'PHONE', phone: '12-447 8821', state: 'Selangor', vehicle: 'Multi-brand', lang: 'ZH', optIn: true, tier: 'SILVER', sub: 'EXPIRING', credits: 18, transfers: 33, joined: 'Dec 2023', spend: 44200 },
  { name: 'Melaka Motorworld', pic: 'Aisha Kamal', picRole: 'OWNER', numberType: 'PHONE', phone: '19-118 3360', state: 'Melaka', vehicle: 'SUV/MPV', lang: 'MS', optIn: true, tier: 'SILVER', sub: 'ACTIVE', credits: 305, transfers: 44, joined: 'Sep 2024', spend: 27800 },
  { name: 'Southern Auto Hub', pic: 'Devraj Manickam', picRole: 'ADMIN', numberType: 'LANE', phone: '7-558 2233', state: 'Johor', vehicle: 'National', lang: 'EN', optIn: true, tier: 'BRONZE', sub: 'ACTIVE', credits: 62, transfers: 14, joined: 'Jul 2024', spend: 6400 },
];
// NOTE: representative 12-dealer subset spanning every tier/subscription/specialization/
// language/number-type. Extend from docs/design/data.jsx (c13–c21) if a larger base is wanted.
```

- [ ] **Step 2: Insert the dealer seeding block.** In `apps/api/prisma/seed.ts`, replace the existing `sampleContacts` block (the `const sampleContacts = [...]` array through its `for` loop and the two `if (createdSample...)` log lines, currently lines ~26–54) with the dealer seeding loop:

```ts
  let createdDealers = 0;
  for (const d of SEED_DEALERS) {
    const phoneE164 = toE164(d.phone);
    const existing = await prisma.contact.findUnique({ where: { phoneE164 } });
    if (existing) continue;
    await prisma.contact.create({
      data: {
        phoneE164,
        name: d.name,
        languagePreference: d.lang,
        state: STATE_ENUM[d.state] as any,
        optInStatus: d.optIn ? 'OPTED_IN' : 'OPTED_OUT',
        optInSource: 'seed',
        optInAt: d.optIn ? new Date() : null,
        picName: d.pic,
        picRole: d.picRole as any,
        numberType: d.numberType as any,
        tier: d.tier as any,
        subscriptionStatus: d.sub as any,
        vehicleSpecialization: VEHICLE_ENUM[d.vehicle] as any,
        historyCheckCredits: d.credits,
        transfers30d: d.transfers,
        lifetimeSpend: d.spend,
        joinedAt: new Date(d.joined),
        lastSeenAt: new Date(),
      },
    });
    createdDealers++;
  }
  if (createdDealers > 0) console.log(`Seeded ${createdDealers} dealer(s).`);
  else console.log('Dealers already exist — skipping.');
```

- [ ] **Step 3: Add autopilot setting defaults.** In `apps/api/prisma/seed.ts`, after the existing `current_messaging_tier` seed block (ends ~line 101, before the closing `}` of `main`), add:

```ts
  const autopilotDefaults: Record<string, string> = {
    autopilot_enabled: 'true',
    autopilot_escalation_threshold: '70',
    autopilot_honour_stop: 'true',
    autopilot_after_hours: 'AWAY_THEN_ESCALATE',
  };
  for (const [key, value] of Object.entries(autopilotDefaults)) {
    const existing = await prisma.systemSetting.findUnique({ where: { key } });
    if (!existing) {
      await prisma.systemSetting.create({ data: { key, value } });
      console.log(`Seeded ${key} = ${value}.`);
    }
  }
```

- [ ] **Step 4: Run the seed.**

Run: `pnpm --filter api db:seed`
Expected: output includes `Seeded 12 dealer(s).` and four `Seeded autopilot_* = ...` lines (admin/template/tier lines may say "already exists").

- [ ] **Step 5: Verify idempotency + data shape.**

Run: `pnpm --filter api db:seed`
Expected: `Dealers already exist — skipping.` (no duplicates created).

Run: `pnpm --filter api exec prisma studio` is optional; instead verify via a one-off query —
Run: `node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.contact.findMany({where:{tier:'GOLD'},select:{name:true,tier:true,vehicleSpecialization:true,phoneE164:true}}).then(r=>{console.log(r);return p.$disconnect()})"` (run from `apps/api`).
Expected: ~3 Gold dealers printed with `phoneE164` like `+60123456789` and a `vehicleSpecialization` enum value.

- [ ] **Step 6: Commit.**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed dealer base + autopilot setting defaults"
```

---

## Self-Review

**Spec coverage (§5, §10 of the spec):**
- Dealer model fields (tier/sub/credits/vehicle/pic/picRole/numberType/transfers/spend/joined/lastSeen) → Task 1 ✅
- `PAUSED` campaign status added early → Task 1 ✅
- Demographic columns kept nullable, untouched → Task 1 (no removals) ✅
- `LlmService` abstraction + `MockLlmService` + offline-default binding → Task 2 ✅
- Provider swappable behind interface → Task 2 (Step 7 note) ✅
- Dealer seed (~dozen, full attribute spread) → Task 3 ✅
- Autopilot setting defaults (threshold/honour-stop/after-hours/enabled) → Task 3 ✅

**Out of this plan (tracked for follow-on plans):** role relabel + RBAC (frontend-led, Plan 0B), frontend shell port (Plan 0B), Knowledge Base model/module/UI (Phase 1 plan). These are intentionally separate so each plan ships working, testable software.

**Placeholder scan:** none — every step has concrete code/commands. The 12-dealer subset is explicitly called out (not a silent cap).

**Type consistency:** `LlmService` method names (`generateReply`, `classifyIntent`, `generateTemplateDrafts`) and `llm.types.ts` shapes are used identically in the abstract class, the mock, the tests, and the module binding. Prisma enum string literals used in the seed (`'GOLD'`, `'SUV_MPV'`, `'AWAY_THEN_ESCALATE'`, etc.) match the enums defined in Task 1.

---

## Next plans (not in this document)
1. **Plan 0B — Frontend shell port:** `styles.css` tokens, shared components (AIOrb/Badge/Pill/Modal/SchedulePicker), Sidebar (AI ambient + badges), Topbar (AI widget + notifications + user menu), command palette, mobile drawer + bottom tabs, login restyle, route wiring with seeded placeholders, and the role relabel (ADMIN→"Super Admin" / OPERATOR→"Customer Support") + Support view-only gating.
2. **Plan 1 — Knowledge Base:** `KnowledgeDoc` model, `knowledge` module (CRUD + candidates + publish/dismiss), keyword `retrieve()` (unit-tested — the seam the bot calls), 8-doc seed, Library UI tab, Super-Admin gate.
