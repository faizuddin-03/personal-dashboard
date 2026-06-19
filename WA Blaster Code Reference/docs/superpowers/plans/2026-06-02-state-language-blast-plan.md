# State-Based Language Blasting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-blast option to select template language(s) by the contact's Malaysian state via an admin-configurable mapping table, fanning out one message per mapped language (Penang → ZH + EN), with default-language fallback for unmapped/null states.

**Architecture:** A new `MalaysianState` enum + `StateLanguageMapping` table hold the config. `Contact.state` becomes the enum (migrated from free-text via a normalizer). `Blast` gains a `languageMode` toggle and a `uniqueContacts` count. The fan-out is a pure helper (`resolveContactLanguages`) consumed by a new STATE branch in `BlastsService.createAndSchedule`; PREFERENCE mode is untouched. An ADMIN-only CRUD module manages the mapping; a preview endpoint powers the wizard's "X messages to Y contacts" review.

**Tech Stack:** NestJS 10, Prisma 5, PostgreSQL 16, BullMQ, React 18 + Vite + React Query 5, Tailwind, Playwright, Jest.

**Spec:** `docs/superpowers/specs/2026-06-02-state-language-blast-design.md`

**Branch:** `feat/state-language-blast` off `master` (already created; spec already committed as `3d17a8d`).

**Environment notes for the implementer:**
- Working dir: `C:\Users\User\Desktop\modefairthon\untitled`. pnpm is on PATH.
- Docker (wbs_postgres + wbs_redis) is up and healthy.
- `pnpm prisma migrate dev` cannot run in this harness (no TTY). Generate migration SQL with `prisma migrate diff` against a throwaway shadow DB, then apply with `prisma migrate deploy`. The exact recipe is given in Task 1.
- After any schema change, run `cd apps/api && npx prisma generate` before building.
- Baseline: `pnpm --filter api test` is green at the start.

---

## Phase A — Schema & enums

### Task 1: Add MalaysianState + BlastLanguageMode enums, StateLanguageMapping table, Blast columns

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_state_language_mapping/migration.sql`

- [ ] **Step 1: Add the two enums to the schema**

In `apps/api/prisma/schema.prisma`, add after the existing `enum LanguagePreference { ... }` block:

```prisma
enum MalaysianState {
  JOHOR
  KEDAH
  KELANTAN
  MELAKA
  NEGERI_SEMBILAN
  PAHANG
  PENANG
  PERAK
  PERLIS
  SABAH
  SARAWAK
  SELANGOR
  TERENGGANU
  KUALA_LUMPUR
  LABUAN
  PUTRAJAYA
}

enum BlastLanguageMode {
  PREFERENCE
  STATE
}
```

- [ ] **Step 2: Add the StateLanguageMapping model**

Add at the end of the schema:

```prisma
model StateLanguageMapping {
  state      MalaysianState        @id
  languages  LanguagePreference[]
  updatedAt  DateTime              @updatedAt @map("updated_at")

  @@map("state_language_mapping")
}
```

- [ ] **Step 3: Add the two new Blast columns**

In `model Blast`, add these fields after `totalRecipients`:

```prisma
  languageMode    BlastLanguageMode @default(PREFERENCE) @map("language_mode")
  uniqueContacts  Int               @default(0)          @map("unique_contacts")
```

(Leave `Contact.state` as `String?` for now — its enum conversion is Task 2, kept separate so the data normalization is reviewable on its own.)

- [ ] **Step 4: Generate the migration SQL via shadow DB**

Run from `apps/api`:

```bash
cd apps/api
docker exec wbs_postgres psql -U wbs -d postgres -c "DROP DATABASE IF EXISTS wbs_shadow;"
docker exec wbs_postgres psql -U wbs -d postgres -c "CREATE DATABASE wbs_shadow OWNER wbs;"
TS=$(date +%Y%m%d%H%M%S)
DIR="prisma/migrations/${TS}_state_language_mapping"
mkdir -p "$DIR"
npx prisma migrate diff \
  --from-migrations prisma/migrations \
  --to-schema-datamodel prisma/schema.prisma \
  --shadow-database-url "postgresql://wbs:wbs_dev@localhost:5432/wbs_shadow" \
  --script > "$DIR/migration.sql"
docker exec wbs_postgres psql -U wbs -d postgres -c "DROP DATABASE wbs_shadow;"
cat "$DIR/migration.sql"
```

Expected: the SQL contains `CREATE TYPE "MalaysianState"`, `CREATE TYPE "BlastLanguageMode"`, `CREATE TABLE "state_language_mapping"`, and `ALTER TABLE "blasts" ADD COLUMN "language_mode" ... ADD COLUMN "unique_contacts" ...`.

- [ ] **Step 5: Backfill uniqueContacts for existing blasts**

Append to the migration SQL file:

```sql
-- Pre-feature blasts were 1 message per contact, so uniqueContacts == totalRecipients
UPDATE "blasts" SET "unique_contacts" = "total_recipients";
```

- [ ] **Step 6: Apply the migration and regenerate the client**

```bash
npx prisma migrate deploy
npx prisma generate
cd ../..
```

Expected: "All migrations have been successfully applied." No errors.

- [ ] **Step 7: Verify the schema in the DB**

```bash
docker exec wbs_postgres psql -U wbs -d wbs -c "\d state_language_mapping"
docker exec wbs_postgres psql -U wbs -d wbs -c "\d blasts" | grep -E "language_mode|unique_contacts"
```

Expected: the table exists with `state`, `languages`, `updated_at`; `blasts` shows both new columns.

- [ ] **Step 8: Confirm the API still builds**

```bash
pnpm --filter api build
```

Expected: no TS errors.

- [ ] **Step 9: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(blast): add MalaysianState/BlastLanguageMode enums + StateLanguageMapping table + Blast columns"
```

---

## Phase B — State normalizer

### Task 2: Create the state normalizer utility (TDD)

**Files:**
- Create: `apps/api/src/contacts/state-normalizer.ts`
- Create: `apps/api/src/contacts/__tests__/state-normalizer.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/contacts/__tests__/state-normalizer.spec.ts`:

```ts
import { normalizeState } from '../state-normalizer';

describe('normalizeState', () => {
  it('maps canonical names', () => {
    expect(normalizeState('Penang')).toBe('PENANG');
    expect(normalizeState('Selangor')).toBe('SELANGOR');
    expect(normalizeState('Kelantan')).toBe('KELANTAN');
  });

  it('maps common aliases', () => {
    expect(normalizeState('Pulau Pinang')).toBe('PENANG');
    expect(normalizeState('PNG')).toBe('PENANG');
    expect(normalizeState('KL')).toBe('KUALA_LUMPUR');
    expect(normalizeState('W.P. Kuala Lumpur')).toBe('KUALA_LUMPUR');
    expect(normalizeState('Wilayah Persekutuan Kuala Lumpur')).toBe('KUALA_LUMPUR');
    expect(normalizeState('Malacca')).toBe('MELAKA');
    expect(normalizeState('N. Sembilan')).toBe('NEGERI_SEMBILAN');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(normalizeState('  penang ')).toBe('PENANG');
    expect(normalizeState('SELANGOR')).toBe('SELANGOR');
    expect(normalizeState('kuala lumpur')).toBe('KUALA_LUMPUR');
  });

  it('accepts the enum value itself', () => {
    expect(normalizeState('NEGERI_SEMBILAN')).toBe('NEGERI_SEMBILAN');
    expect(normalizeState('KUALA_LUMPUR')).toBe('KUALA_LUMPUR');
  });

  it('returns null for unknown or empty', () => {
    expect(normalizeState('Atlantis')).toBeNull();
    expect(normalizeState('')).toBeNull();
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState(undefined)).toBeNull();
  });
});
```

- [ ] **Step 2: Run it, expect failure**

```bash
pnpm --filter api test -- state-normalizer.spec.ts
```

Expected: FAIL — cannot find module `../state-normalizer`.

- [ ] **Step 3: Implement the normalizer**

`apps/api/src/contacts/state-normalizer.ts`:

```ts
import { MalaysianState } from '@prisma/client';

// Canonical + alias lookup. Keys are normalized (lowercased, punctuation/space-collapsed).
const ALIASES: Record<string, MalaysianState> = {
  'johor': 'JOHOR',
  'kedah': 'KEDAH',
  'kelantan': 'KELANTAN',
  'melaka': 'MELAKA',
  'malacca': 'MELAKA',
  'negeri sembilan': 'NEGERI_SEMBILAN',
  'negeri_sembilan': 'NEGERI_SEMBILAN',
  'n sembilan': 'NEGERI_SEMBILAN',
  'pahang': 'PAHANG',
  'penang': 'PENANG',
  'pulau pinang': 'PENANG',
  'png': 'PENANG',
  'perak': 'PERAK',
  'perlis': 'PERLIS',
  'sabah': 'SABAH',
  'sarawak': 'SARAWAK',
  'selangor': 'SELANGOR',
  'terengganu': 'TERENGGANU',
  'kuala lumpur': 'KUALA_LUMPUR',
  'kuala_lumpur': 'KUALA_LUMPUR',
  'kl': 'KUALA_LUMPUR',
  'wp kuala lumpur': 'KUALA_LUMPUR',
  'w p kuala lumpur': 'KUALA_LUMPUR',
  'wilayah persekutuan kuala lumpur': 'KUALA_LUMPUR',
  'labuan': 'LABUAN',
  'wp labuan': 'LABUAN',
  'putrajaya': 'PUTRAJAYA',
  'wp putrajaya': 'PUTRAJAYA',
};

/** Collapse to a comparable key: lowercase, strip dots, collapse whitespace. */
function keyOf(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Normalize a free-text state string to a MalaysianState enum value, or null if unrecognized. */
export function normalizeState(raw: string | null | undefined): MalaysianState | null {
  if (!raw) return null;
  const key = keyOf(raw);
  if (!key) return null;
  return ALIASES[key] ?? null;
}
```

- [ ] **Step 4: Run the test, expect pass**

```bash
pnpm --filter api test -- state-normalizer.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/contacts/state-normalizer.ts apps/api/src/contacts/__tests__/state-normalizer.spec.ts
git commit -m "feat(contacts): add state-normalizer utility mapping free-text to MalaysianState (TDD)"
```

---

## Phase C — Convert Contact.state to the enum

### Task 3: Migrate Contact.state from String to MalaysianState

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_contact_state_enum/migration.sql`

- [ ] **Step 1: Change the schema field type**

In `model Contact`, change:

```prisma
  state               String?
```

to:

```prisma
  state               MalaysianState?
```

(The `@@index([state])` line stays as-is.)

- [ ] **Step 2: Hand-author the migration SQL (data-preserving)**

A direct `ALTER COLUMN ... TYPE` would fail on free-text values, so the migration adds a temp column, normalizes via a SQL CASE that mirrors the normalizer's alias map, drops the old column, and renames. Create `apps/api/prisma/migrations/<TS>_contact_state_enum/migration.sql` manually (generate the timestamp with `date +%Y%m%d%H%M%S`):

```sql
-- Convert contacts.state from free text to MalaysianState enum, normalizing known aliases.
ALTER TABLE "contacts" ADD COLUMN "state_enum" "MalaysianState";

UPDATE "contacts" SET "state_enum" = CASE lower(regexp_replace(trim("state"), '\.|\s+', ' ', 'g'))
  WHEN 'johor' THEN 'JOHOR'::"MalaysianState"
  WHEN 'kedah' THEN 'KEDAH'::"MalaysianState"
  WHEN 'kelantan' THEN 'KELANTAN'::"MalaysianState"
  WHEN 'melaka' THEN 'MELAKA'::"MalaysianState"
  WHEN 'malacca' THEN 'MELAKA'::"MalaysianState"
  WHEN 'negeri sembilan' THEN 'NEGERI_SEMBILAN'::"MalaysianState"
  WHEN 'negeri_sembilan' THEN 'NEGERI_SEMBILAN'::"MalaysianState"
  WHEN 'n sembilan' THEN 'NEGERI_SEMBILAN'::"MalaysianState"
  WHEN 'pahang' THEN 'PAHANG'::"MalaysianState"
  WHEN 'penang' THEN 'PENANG'::"MalaysianState"
  WHEN 'pulau pinang' THEN 'PENANG'::"MalaysianState"
  WHEN 'png' THEN 'PENANG'::"MalaysianState"
  WHEN 'perak' THEN 'PERAK'::"MalaysianState"
  WHEN 'perlis' THEN 'PERLIS'::"MalaysianState"
  WHEN 'sabah' THEN 'SABAH'::"MalaysianState"
  WHEN 'sarawak' THEN 'SARAWAK'::"MalaysianState"
  WHEN 'selangor' THEN 'SELANGOR'::"MalaysianState"
  WHEN 'terengganu' THEN 'TERENGGANU'::"MalaysianState"
  WHEN 'kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'kuala_lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'kl' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'wp kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'w p kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'wilayah persekutuan kuala lumpur' THEN 'KUALA_LUMPUR'::"MalaysianState"
  WHEN 'labuan' THEN 'LABUAN'::"MalaysianState"
  WHEN 'wp labuan' THEN 'LABUAN'::"MalaysianState"
  WHEN 'putrajaya' THEN 'PUTRAJAYA'::"MalaysianState"
  WHEN 'wp putrajaya' THEN 'PUTRAJAYA'::"MalaysianState"
  ELSE NULL
END
WHERE "state" IS NOT NULL;

-- Conversion summary (printed in migrate output via RAISE NOTICE)
DO $$
DECLARE total INT; converted INT; nulled INT;
BEGIN
  SELECT count(*) INTO total FROM "contacts" WHERE "state" IS NOT NULL;
  SELECT count(*) INTO converted FROM "contacts" WHERE "state" IS NOT NULL AND "state_enum" IS NOT NULL;
  nulled := total - converted;
  RAISE NOTICE 'Contact.state conversion: % had a value, % converted, % nulled (unrecognized)', total, converted, nulled;
END $$;

DROP INDEX IF EXISTS "contacts_state_idx";
ALTER TABLE "contacts" DROP COLUMN "state";
ALTER TABLE "contacts" RENAME COLUMN "state_enum" TO "state";
CREATE INDEX "contacts_state_idx" ON "contacts"("state");
```

- [ ] **Step 3: Apply the migration**

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
cd ../..
```

Expected: the `RAISE NOTICE` line prints the conversion summary; no errors.

- [ ] **Step 4: Verify the column type changed**

```bash
docker exec wbs_postgres psql -U wbs -d wbs -c "\d contacts" | grep -E "state"
```

Expected: `state | "MalaysianState"` (nullable), with the index present.

- [ ] **Step 5: Confirm build (will fail — that's expected, fixed in Task 4)**

```bash
pnpm --filter api build 2>&1 | grep -E "state|error TS" | head
```

Expected: TS errors in `contacts.service.ts`, DTOs, and `filter-to-where.ts` because `state` is now an enum but the code still types it as `string`. These are fixed in Task 4. Do NOT commit yet — bundle the schema + code fixes together.

- [ ] **Step 6: (deferred commit — see Task 4)**

---

### Task 4: Update contact DTOs, service, filter, and CSV import for the state enum

**Files:**
- Modify: `apps/api/src/segments/dto/contact-filter.dto.ts`
- Modify: `apps/api/src/segments/filter-to-where.ts`
- Modify: `apps/api/src/contacts/dto/create-contact.dto.ts`
- Modify: `apps/api/src/contacts/dto/update-contact.dto.ts`
- Modify: `apps/api/src/contacts/dto/list-contacts.dto.ts`
- Modify: `apps/api/src/contacts/csv-import.service.ts`
- Modify: `apps/api/src/contacts/__tests__/csv-import.service.spec.ts`

- [ ] **Step 1: Update ContactFilter type**

In `apps/api/src/segments/dto/contact-filter.dto.ts`, add `MalaysianState` to the imports and change `state`:

```ts
import {
  Ethnicity,
  Gender,
  LanguagePreference,
  MalaysianState,
  Occupation,
  OptInStatus,
  Religion,
} from '@prisma/client';

export interface ContactFilter {
  ethnicity?: Ethnicity[];
  gender?: Gender[];
  religion?: Religion[];
  occupation?: Occupation[];
  languagePreference?: LanguagePreference[];
  state?: MalaysianState[];
  city?: string[];
  ageMin?: number;
  ageMax?: number;
  optInStatus?: OptInStatus[];
}
```

`filter-to-where.ts` needs no logic change (the `{ in: filter.state }` line is type-compatible once the array is `MalaysianState[]`). Confirm it still compiles.

- [ ] **Step 2: Update the contact DTOs**

In `apps/api/src/contacts/dto/create-contact.dto.ts` and `update-contact.dto.ts`, add `MalaysianState` to the `@prisma/client` import and change the `state` field:

```ts
  @IsOptional()
  @IsEnum(MalaysianState)
  state?: MalaysianState;
```

(Remove the now-irrelevant `@IsString()` / `@MaxLength(60)` decorators on `state` only.)

In `apps/api/src/contacts/dto/list-contacts.dto.ts`, change `state?: string[]` to `state?: MalaysianState[]` (add the import). If the field has validation decorators, change them to `@IsEnum(MalaysianState, { each: true })`.

- [ ] **Step 3: Update CSV import to normalize state**

In `apps/api/src/contacts/csv-import.service.ts`:
- Add the import: `import { normalizeState } from './state-normalizer';`
- The row type's `state?: string` stays (CSV is raw text).
- Change the contact-build line (currently `state: row.state?.trim() || undefined,`) to:

```ts
          state: normalizeState(row.state) ?? undefined,
```

- [ ] **Step 4: Add a CSV import test for state normalization**

In `apps/api/src/contacts/__tests__/csv-import.service.spec.ts`, add a test asserting a row with `state: 'Pulau Pinang'` produces a contact with `state: 'PENANG'`, and a row with `state: 'Atlantis'` produces `state: undefined`. Follow the existing test structure in that file (read it first to match the harness — it likely parses a CSV buffer and inspects the created rows or the parsed output).

- [ ] **Step 5: Build + test**

```bash
cd apps/api && npx prisma generate && cd ../..
pnpm --filter api build
pnpm --filter api test -- csv-import.service.spec.ts
pnpm --filter api test -- filter-to-where.spec.ts
```

Expected: build clean; both test files pass. Note: `filter-to-where.spec.ts` currently uses string state values like `'Selangor'` — update those to enum values (`'SELANGOR'`) so they still type-check and pass. Read the file and fix the literals.

- [ ] **Step 6: Run the full API test suite**

```bash
pnpm --filter api test
```

Expected: all green. Fix any other spec that passed a string `state` literal to use the enum.

- [ ] **Step 7: Commit (bundles Task 3 + Task 4)**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/ apps/api/src/contacts apps/api/src/segments
git commit -m "feat(contacts): convert Contact.state to MalaysianState enum

Migration normalizes existing free-text state via alias map (prints
conversion summary), nulls unrecognized values. DTOs, segment filter,
and CSV import all switch to the enum; CSV import normalizes incoming
free text."
```

---

## Phase D — State→language mapping CRUD module

### Task 5: Create StateLanguageMappingService (TDD)

**Files:**
- Create: `apps/api/src/state-language-mapping/state-language-mapping.service.ts`
- Create: `apps/api/src/state-language-mapping/__tests__/state-language-mapping.service.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/state-language-mapping/__tests__/state-language-mapping.service.spec.ts`:

```ts
import { BadRequestException } from '@nestjs/common';
import { StateLanguageMappingService } from '../state-language-mapping.service';

describe('StateLanguageMappingService', () => {
  let prisma: any;
  let service: StateLanguageMappingService;

  beforeEach(() => {
    prisma = {
      stateLanguageMapping: {
        findMany: jest.fn(),
        upsert: jest.fn(),
        delete: jest.fn(),
      },
    };
    service = new StateLanguageMappingService(prisma);
  });

  it('listAll returns all 16 states, filling empty arrays for unmapped', async () => {
    prisma.stateLanguageMapping.findMany.mockResolvedValue([
      { state: 'PENANG', languages: ['ZH', 'EN'], updatedAt: new Date() },
    ]);
    const result = await service.listAll();
    expect(result).toHaveLength(16);
    expect(result.find((r) => r.state === 'PENANG')!.languages).toEqual(['ZH', 'EN']);
    expect(result.find((r) => r.state === 'JOHOR')!.languages).toEqual([]);
  });

  it('upsert sets languages for a state', async () => {
    prisma.stateLanguageMapping.upsert.mockResolvedValue({ state: 'PENANG', languages: ['ZH', 'EN'] });
    await service.upsert('PENANG', ['ZH', 'EN']);
    expect(prisma.stateLanguageMapping.upsert).toHaveBeenCalledWith({
      where: { state: 'PENANG' },
      create: { state: 'PENANG', languages: ['ZH', 'EN'] },
      update: { languages: ['ZH', 'EN'] },
    });
  });

  it('upsert rejects an empty languages array', async () => {
    await expect(service.upsert('PENANG', [])).rejects.toThrow(BadRequestException);
    expect(prisma.stateLanguageMapping.upsert).not.toHaveBeenCalled();
  });

  it('clear deletes the row (idempotent if absent)', async () => {
    prisma.stateLanguageMapping.delete.mockResolvedValue({});
    await service.clear('PENANG');
    expect(prisma.stateLanguageMapping.delete).toHaveBeenCalledWith({ where: { state: 'PENANG' } });
  });

  it('clear swallows a not-found delete', async () => {
    const err: any = new Error('not found');
    err.code = 'P2025';
    prisma.stateLanguageMapping.delete.mockRejectedValue(err);
    await expect(service.clear('PENANG')).resolves.toBeUndefined();
  });

  it('asMap returns a Map of state to languages for non-empty rows', async () => {
    prisma.stateLanguageMapping.findMany.mockResolvedValue([
      { state: 'PENANG', languages: ['ZH', 'EN'] },
      { state: 'KELANTAN', languages: ['MS'] },
    ]);
    const map = await service.asMap();
    expect(map.get('PENANG')).toEqual(['ZH', 'EN']);
    expect(map.get('KELANTAN')).toEqual(['MS']);
    expect(map.has('JOHOR')).toBe(false);
  });
});
```

- [ ] **Step 2: Run it, expect failure**

```bash
pnpm --filter api test -- state-language-mapping.service.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the service**

`apps/api/src/state-language-mapping/state-language-mapping.service.ts`:

```ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { LanguagePreference, MalaysianState } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const ALL_STATES: MalaysianState[] = [
  'JOHOR', 'KEDAH', 'KELANTAN', 'MELAKA', 'NEGERI_SEMBILAN', 'PAHANG',
  'PENANG', 'PERAK', 'PERLIS', 'SABAH', 'SARAWAK', 'SELANGOR',
  'TERENGGANU', 'KUALA_LUMPUR', 'LABUAN', 'PUTRAJAYA',
];

export interface StateMappingRow {
  state: MalaysianState;
  languages: LanguagePreference[];
}

@Injectable()
export class StateLanguageMappingService {
  constructor(private readonly prisma: PrismaService) {}

  /** All 16 states, each with its configured languages (empty array if unmapped). */
  async listAll(): Promise<StateMappingRow[]> {
    const rows = await this.prisma.stateLanguageMapping.findMany();
    const byState = new Map(rows.map((r) => [r.state, r.languages]));
    return ALL_STATES.map((state) => ({ state, languages: byState.get(state) ?? [] }));
  }

  async upsert(state: MalaysianState, languages: LanguagePreference[]): Promise<void> {
    if (!languages || languages.length === 0) {
      throw new BadRequestException('languages must be a non-empty array; use DELETE to clear a mapping');
    }
    await this.prisma.stateLanguageMapping.upsert({
      where: { state },
      create: { state, languages },
      update: { languages },
    });
  }

  async clear(state: MalaysianState): Promise<void> {
    try {
      await this.prisma.stateLanguageMapping.delete({ where: { state } });
    } catch (err: any) {
      if (err?.code === 'P2025') return; // already absent
      throw err;
    }
  }

  /** Map of state → languages, including only configured (non-empty) states. */
  async asMap(): Promise<Map<MalaysianState, LanguagePreference[]>> {
    const rows = await this.prisma.stateLanguageMapping.findMany();
    return new Map(rows.filter((r) => r.languages.length > 0).map((r) => [r.state, r.languages]));
  }
}
```

- [ ] **Step 4: Run the test, expect pass**

```bash
pnpm --filter api test -- state-language-mapping.service.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/state-language-mapping/state-language-mapping.service.ts apps/api/src/state-language-mapping/__tests__/state-language-mapping.service.spec.ts
git commit -m "feat(blast): add StateLanguageMappingService with listAll/upsert/clear/asMap (TDD)"
```

### Task 6: Create the controller + DTO + module (TDD)

**Files:**
- Create: `apps/api/src/state-language-mapping/dto/upsert-mapping.dto.ts`
- Create: `apps/api/src/state-language-mapping/state-language-mapping.controller.ts`
- Create: `apps/api/src/state-language-mapping/state-language-mapping.module.ts`
- Create: `apps/api/src/state-language-mapping/__tests__/state-language-mapping.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create the DTO**

`apps/api/src/state-language-mapping/dto/upsert-mapping.dto.ts`:

```ts
import { ArrayMinSize, IsArray, IsEnum } from 'class-validator';
import { LanguagePreference } from '@prisma/client';

export class UpsertMappingDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(LanguagePreference, { each: true })
  languages!: LanguagePreference[];
}
```

- [ ] **Step 2: Write the failing controller test**

`apps/api/src/state-language-mapping/__tests__/state-language-mapping.controller.spec.ts`:

```ts
import { Test } from '@nestjs/testing';
import { StateLanguageMappingController } from '../state-language-mapping.controller';
import { StateLanguageMappingService } from '../state-language-mapping.service';

describe('StateLanguageMappingController', () => {
  let controller: StateLanguageMappingController;
  let service: any;

  beforeEach(async () => {
    service = { listAll: jest.fn(), upsert: jest.fn(), clear: jest.fn() };
    const mod = await Test.createTestingModule({
      controllers: [StateLanguageMappingController],
      providers: [{ provide: StateLanguageMappingService, useValue: service }],
    }).compile();
    controller = mod.get(StateLanguageMappingController);
  });

  it('GET returns all mappings', async () => {
    service.listAll.mockResolvedValue([{ state: 'PENANG', languages: ['ZH', 'EN'] }]);
    expect(await controller.list()).toEqual([{ state: 'PENANG', languages: ['ZH', 'EN'] }]);
  });

  it('PUT upserts then returns the refreshed list', async () => {
    service.listAll.mockResolvedValue([{ state: 'PENANG', languages: ['ZH', 'EN'] }]);
    await controller.upsert('PENANG', { languages: ['ZH', 'EN'] });
    expect(service.upsert).toHaveBeenCalledWith('PENANG', ['ZH', 'EN']);
  });

  it('DELETE clears then returns the refreshed list', async () => {
    service.listAll.mockResolvedValue([]);
    await controller.remove('PENANG');
    expect(service.clear).toHaveBeenCalledWith('PENANG');
  });
});
```

- [ ] **Step 3: Run it, expect failure**

```bash
pnpm --filter api test -- state-language-mapping.controller.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 4: Create the controller**

`apps/api/src/state-language-mapping/state-language-mapping.controller.ts`:

```ts
import { Body, Controller, Delete, Get, Param, ParseEnumPipe, Put, UseGuards } from '@nestjs/common';
import { MalaysianState } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { StateLanguageMappingService } from './state-language-mapping.service';
import { UpsertMappingDto } from './dto/upsert-mapping.dto';

@Controller('state-language-mappings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class StateLanguageMappingController {
  constructor(private readonly mappings: StateLanguageMappingService) {}

  @Get()
  list() {
    return this.mappings.listAll();
  }

  @Put(':state')
  async upsert(
    @Param('state', new ParseEnumPipe(MalaysianState)) state: MalaysianState,
    @Body() dto: UpsertMappingDto,
  ) {
    await this.mappings.upsert(state, dto.languages);
    return this.mappings.listAll();
  }

  @Delete(':state')
  async remove(@Param('state', new ParseEnumPipe(MalaysianState)) state: MalaysianState) {
    await this.mappings.clear(state);
    return this.mappings.listAll();
  }
}
```

- [ ] **Step 5: Create the module**

`apps/api/src/state-language-mapping/state-language-mapping.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { StateLanguageMappingService } from './state-language-mapping.service';
import { StateLanguageMappingController } from './state-language-mapping.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [StateLanguageMappingController],
  providers: [StateLanguageMappingService],
  exports: [StateLanguageMappingService],
})
export class StateLanguageMappingModule {}
```

(`PrismaService` is global in this codebase — no PrismaModule import needed. Confirm by checking that other modules like `system-settings.module.ts` don't import PrismaModule; match whatever they do.)

- [ ] **Step 6: Register in app.module.ts**

In `apps/api/src/app.module.ts`, add `import { StateLanguageMappingModule } from './state-language-mapping/state-language-mapping.module';` and add `StateLanguageMappingModule` to the `imports` array.

- [ ] **Step 7: Build, test, boot**

```bash
pnpm --filter api build
pnpm --filter api test -- state-language-mapping.controller.spec.ts
cd apps/api && timeout 8 node dist/main.js 2>&1 | grep -E "StateLanguageMapping|successfully started|ERROR"; cd ../..
```

Expected: build clean, test passes, API boots and maps the new routes (look for `StateLanguageMappingController {/api/state-language-mappings}` in the boot log).

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/state-language-mapping apps/api/src/app.module.ts
git commit -m "feat(blast): add ADMIN-only state-language-mappings CRUD endpoints (TDD)"
```

---

## Phase E — Fan-out logic & blast integration

### Task 7: Create resolveContactLanguages helper (TDD)

**Files:**
- Create: `apps/api/src/blasts/resolve-contact-languages.ts`
- Create: `apps/api/src/blasts/__tests__/resolve-contact-languages.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/blasts/__tests__/resolve-contact-languages.spec.ts`:

```ts
import { resolveContactLanguages } from '../resolve-contact-languages';

describe('resolveContactLanguages', () => {
  const mapping = new Map<any, any>([
    ['PENANG', ['ZH', 'EN']],
    ['KELANTAN', ['MS']],
    ['SABAH', []], // explicitly empty → treated as unmapped
  ]);

  it('returns mapped languages for a mapped state', () => {
    expect(resolveContactLanguages('PENANG', mapping, 'EN')).toEqual(['ZH', 'EN']);
    expect(resolveContactLanguages('KELANTAN', mapping, 'EN')).toEqual(['MS']);
  });

  it('falls back to default for null state', () => {
    expect(resolveContactLanguages(null, mapping, 'EN')).toEqual(['EN']);
  });

  it('falls back to default for an unmapped state', () => {
    expect(resolveContactLanguages('JOHOR', mapping, 'MS')).toEqual(['MS']);
  });

  it('falls back to default for an explicitly empty mapping', () => {
    expect(resolveContactLanguages('SABAH', mapping, 'EN')).toEqual(['EN']);
  });
});
```

- [ ] **Step 2: Run it, expect failure**

```bash
pnpm --filter api test -- resolve-contact-languages.spec.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the helper**

`apps/api/src/blasts/resolve-contact-languages.ts`:

```ts
import { LanguagePreference, MalaysianState } from '@prisma/client';

/**
 * Languages to send to a contact in STATE mode.
 * Mapped state with non-empty languages → those languages.
 * Null state, unmapped state, or empty mapping → [defaultLanguage].
 */
export function resolveContactLanguages(
  contactState: MalaysianState | null,
  mapping: Map<MalaysianState, LanguagePreference[]>,
  defaultLanguage: LanguagePreference,
): LanguagePreference[] {
  if (!contactState) return [defaultLanguage];
  const langs = mapping.get(contactState);
  if (!langs || langs.length === 0) return [defaultLanguage];
  return langs;
}
```

- [ ] **Step 4: Run the test, expect pass**

```bash
pnpm --filter api test -- resolve-contact-languages.spec.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/blasts/resolve-contact-languages.ts apps/api/src/blasts/__tests__/resolve-contact-languages.spec.ts
git commit -m "feat(blast): add resolveContactLanguages pure helper (TDD)"
```

### Task 8: Add languageMode to CreateBlastDto + STATE-mode fan-out in createAndSchedule (TDD)

**Files:**
- Modify: `apps/api/src/blasts/dto/create-blast.dto.ts`
- Modify: `apps/api/src/blasts/blasts.service.ts`
- Modify: `apps/api/src/blasts/blasts.module.ts`
- Modify: `apps/api/src/blasts/__tests__/blasts.service.spec.ts`

- [ ] **Step 1: Add languageMode to the DTO**

In `apps/api/src/blasts/dto/create-blast.dto.ts`, add the import and field:

```ts
import { BlastLanguageMode } from '@prisma/client';
// ... inside the class, after scheduledAt:

  @IsOptional()
  @IsEnum(BlastLanguageMode)
  languageMode?: BlastLanguageMode;
```

- [ ] **Step 2: Write failing tests for STATE-mode fan-out**

Read the existing `apps/api/src/blasts/__tests__/blasts.service.spec.ts` first to match its mock style. Add a new describe block. The key behaviors:

```ts
import { BlastsService } from '../blasts.service';

describe('BlastsService.createAndSchedule — STATE mode', () => {
  let prisma: any;
  let queue: any;
  let settings: any;
  let mappings: any;
  let service: BlastsService;

  const approvedRows = [
    { id: 't-en', language: 'EN', status: 'APPROVED', version: 1 },
    { id: 't-zh', language: 'ZH', status: 'APPROVED', version: 1 },
    { id: 't-ms', language: 'MS', status: 'APPROVED', version: 1 },
  ];

  beforeEach(() => {
    prisma = {
      template: { findMany: jest.fn().mockResolvedValue(approvedRows) },
      contact: { findMany: jest.fn() },
      contactSegment: { findUnique: jest.fn() },
      blast: { create: jest.fn().mockResolvedValue({ id: 'blast-1' }) },
      message: { create: jest.fn((args: any) => Promise.resolve({ id: `m-${Math.random()}`, ...args.data })), findMany: jest.fn().mockResolvedValue([]) },
      $transaction: jest.fn((ops: any) => Promise.all(ops)),
    };
    queue = { add: jest.fn() };
    settings = { get: jest.fn() };
    mappings = { asMap: jest.fn() };
    // NOTE: match the real BlastsService constructor arg order — see the actual file.
    service = new BlastsService(prisma, queue, settings, mappings);
  });

  it('fans out one message per mapped language (Penang → ZH + EN = 2 messages)', async () => {
    mappings.asMap.mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]]));
    // segment-less blast → resolveRecipients reads opted-in contacts
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c1' }])                                   // resolveRecipients
      .mockResolvedValueOnce([{ id: 'c1', state: 'PENANG' }]);                 // state load
    const dto: any = {
      name: 'X', templateName: 'promo', defaultLanguage: 'EN',
      variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z', languageMode: 'STATE',
    };
    await service.createAndSchedule(dto, 'u1');

    // 2 messages created for the single Penang contact
    expect(prisma.message.create).toHaveBeenCalledTimes(2);
    const langsUsed = prisma.message.create.mock.calls.map((c: any) => c[0].data.templateId).sort();
    expect(langsUsed).toEqual(['t-en', 't-zh']);
    // blast row stores uniqueContacts = 1, totalRecipients = 2
    expect(prisma.blast.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ languageMode: 'STATE', uniqueContacts: 1, totalRecipients: 2 }),
    }));
  });

  it('falls back to default language for unmapped/null state (1 message)', async () => {
    mappings.asMap.mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]]));
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c2' }])
      .mockResolvedValueOnce([{ id: 'c2', state: null }]);
    const dto: any = {
      name: 'X', templateName: 'promo', defaultLanguage: 'MS',
      variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z', languageMode: 'STATE',
    };
    await service.createAndSchedule(dto, 'u1');
    expect(prisma.message.create).toHaveBeenCalledTimes(1);
    expect(prisma.message.create.mock.calls[0][0].data.templateId).toBe('t-ms');
  });

  it('blocks creation when a required language has no approved variant', async () => {
    // template has only EN approved
    prisma.template.findMany.mockResolvedValue([{ id: 't-en', language: 'EN', status: 'APPROVED', version: 1 }]);
    mappings.asMap.mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]]));
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c1' }])
      .mockResolvedValueOnce([{ id: 'c1', state: 'PENANG' }]);
    const dto: any = {
      name: 'X', templateName: 'promo', defaultLanguage: 'EN',
      variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z', languageMode: 'STATE',
    };
    await expect(service.createAndSchedule(dto, 'u1')).rejects.toThrow(/ZH/);
    expect(prisma.blast.create).not.toHaveBeenCalled();
  });
});
```

**Important:** the existing `BlastsService` constructor currently takes `(prisma, queue, ...others)`. You are adding `StateLanguageMappingService` as a new dependency. Add it as the LAST constructor arg and update the existing PREFERENCE-mode tests' instantiation if they construct the service directly. Read the file to confirm current arg order before writing.

- [ ] **Step 3: Run the tests, expect failure**

```bash
pnpm --filter api test -- blasts.service.spec.ts
```

Expected: FAIL (STATE branch not implemented; constructor arg mismatch).

- [ ] **Step 4: Inject StateLanguageMappingService and import the helper**

In `apps/api/src/blasts/blasts.service.ts`:
- Add imports:
  ```ts
  import { resolveContactLanguages } from './resolve-contact-languages';
  import { StateLanguageMappingService } from '../state-language-mapping/state-language-mapping.service';
  import { BlastLanguageMode, LanguagePreference, MalaysianState } from '@prisma/client';
  ```
- Add `private readonly stateMappings: StateLanguageMappingService` as the LAST constructor parameter.

- [ ] **Step 5: Refactor createAndSchedule to branch on languageMode**

Replace the body of `createAndSchedule` (from after `scheduledAt` validation) with a version that branches. Keep the existing PREFERENCE path identical; add the STATE path. Concretely:

```ts
async createAndSchedule(dto: CreateBlastDto, actorUserId: string) {
  const scheduledAt = new Date(dto.scheduledAt);
  if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid scheduledAt');

  const { approvedRows } = await this.validateTemplate(dto.templateName, dto.defaultLanguage);
  const approvedByLang = new Map(approvedRows.map((r) => [r.language, r]));

  const contactIds = await this.resolveRecipients(dto.segmentId);
  if (contactIds.length === 0) throw new BadRequestException('Segment resolved to 0 contacts');

  const mode = dto.languageMode ?? BlastLanguageMode.PREFERENCE;

  // Build the list of (contactId, templateId) message specs depending on mode.
  let messageSpecs: { contactId: string; templateId: string }[];

  if (mode === BlastLanguageMode.STATE) {
    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, state: true },
    });
    const mapping = await this.stateMappings.asMap();
    const defaultLanguage = dto.defaultLanguage as LanguagePreference;

    // Validate variant coverage: union of required languages across all contacts.
    const requiredByLang = new Map<string, Set<string>>(); // language -> set of states requiring it
    for (const c of contacts) {
      const langs = resolveContactLanguages(c.state as MalaysianState | null, mapping, defaultLanguage);
      for (const lang of langs) {
        if (!approvedByLang.has(lang)) {
          const key = c.state ?? 'DEFAULT';
          if (!requiredByLang.has(lang)) requiredByLang.set(lang, new Set());
          requiredByLang.get(lang)!.add(key);
        }
      }
    }
    if (requiredByLang.size > 0) {
      const gaps = [...requiredByLang.entries()].map(([language, states]) => ({
        language,
        requiredByStates: [...states],
        templateName: dto.templateName,
      }));
      throw new BadRequestException({
        error: 'missing_template_variants',
        message: 'State-based blast needs languages with no approved template variant.',
        gaps,
      });
    }

    messageSpecs = [];
    for (const c of contacts) {
      const langs = resolveContactLanguages(c.state as MalaysianState | null, mapping, defaultLanguage);
      for (const lang of langs) {
        messageSpecs.push({ contactId: c.id, templateId: approvedByLang.get(lang)!.id });
      }
    }
  } else {
    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, languagePreference: true },
    });
    const fallback = approvedByLang.get(dto.defaultLanguage)!;
    messageSpecs = contacts.map((c) => {
      const picked = approvedByLang.get(c.languagePreference) ?? fallback;
      return { contactId: c.id, templateId: picked.id };
    });
  }

  const blast = await this.prisma.blast.create({
    data: {
      name: dto.name,
      templateName: dto.templateName,
      defaultLanguage: dto.defaultLanguage,
      segmentId: dto.segmentId ?? null,
      recipientSnapshot: contactIds as unknown as Prisma.InputJsonValue,
      variableMapping: dto.variableMapping as Prisma.InputJsonValue,
      scheduledAt,
      status: 'SCHEDULED',
      languageMode: mode,
      uniqueContacts: contactIds.length,
      totalRecipients: messageSpecs.length,
      createdById: actorUserId,
    },
  });

  await this.prisma.$transaction(
    messageSpecs.map((spec) =>
      this.prisma.message.create({
        data: {
          blastId: blast.id,
          contactId: spec.contactId,
          templateId: spec.templateId,
          status: 'QUEUED',
        },
      }),
    ),
  );

  const newMessages = await this.prisma.message.findMany({
    where: { blastId: blast.id },
    select: { id: true },
  });
  const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
  for (const m of newMessages) {
    await this.queue.add(
      BLAST_QUEUE,
      { messageId: m.id },
      { delay: delayMs, attempts: 5, backoff: { type: 'exponential', delay: 5000 } },
    );
  }
  this.logger.log(`Blast ${blast.id} scheduled with ${newMessages.length} jobs (mode=${mode}), delay=${delayMs}ms`);
  return blast;
}
```

- [ ] **Step 6: Wire StateLanguageMappingModule into BlastsModule**

In `apps/api/src/blasts/blasts.module.ts`, add `import { StateLanguageMappingModule } from '../state-language-mapping/state-language-mapping.module';` and add it to the `imports` array. If a circular dependency error appears at boot (BlastsModule ↔ StateLanguageMappingModule should NOT cycle since the mapping module doesn't import blasts — but if it does), use `forwardRef`. Verify by booting.

- [ ] **Step 7: Build, test, boot**

```bash
cd apps/api && npx prisma generate && cd ../..
pnpm --filter api build
pnpm --filter api test -- blasts.service.spec.ts
cd apps/api && timeout 8 node dist/main.js 2>&1 | grep -E "successfully started|ERROR|Nest cannot"; cd ../..
```

Expected: build clean, STATE-mode + PREFERENCE-mode tests pass, API boots.

- [ ] **Step 8: Full API suite**

```bash
pnpm --filter api test
```

Expected: all green.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/blasts apps/api/src/app.module.ts
git commit -m "feat(blast): STATE language mode — fan out one message per mapped language

createAndSchedule branches on languageMode. STATE mode resolves each
contact's languages from the state mapping (default fallback), validates
variant coverage up front (structured gaps error), and fans out one
message per (contact × language). uniqueContacts vs totalRecipients
distinguishes contacts from messages. PREFERENCE mode unchanged."
```

### Task 9: Add the preview endpoint (TDD)

**Files:**
- Modify: `apps/api/src/blasts/blasts.service.ts`
- Modify: `apps/api/src/blasts/blasts.controller.ts`
- Modify: `apps/api/src/blasts/dto/preview-state-languages.dto.ts` (create)
- Modify: `apps/api/src/blasts/__tests__/blasts.service.spec.ts`

- [ ] **Step 1: Create the preview DTO**

`apps/api/src/blasts/dto/preview-state-languages.dto.ts`:

```ts
import { IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class PreviewStateLanguagesDto {
  @IsString() @MinLength(1) @MaxLength(64)
  templateName!: string;

  @IsEnum(['EN', 'MS', 'ZH', 'TA', 'OTHER'])
  defaultLanguage!: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

  @IsOptional() @IsUUID()
  segmentId?: string;
}
```

- [ ] **Step 2: Write the failing service test**

Add to `blasts.service.spec.ts`:

```ts
describe('BlastsService.previewStateLanguages', () => {
  let prisma: any; let service: BlastsService; let mappings: any;
  beforeEach(() => {
    prisma = {
      template: { findMany: jest.fn().mockResolvedValue([
        { id: 't-en', language: 'EN', status: 'APPROVED', version: 1 },
        { id: 't-zh', language: 'ZH', status: 'APPROVED', version: 1 },
      ]) },
      contact: { findMany: jest.fn() },
      contactSegment: { findUnique: jest.fn() },
    };
    mappings = { asMap: jest.fn().mockResolvedValue(new Map([['PENANG', ['ZH', 'EN']]])) };
    service = new BlastsService(prisma, { add: jest.fn() } as any, { get: jest.fn() } as any, mappings);
  });

  it('summarizes messages, contacts, by-language, by-state, and gaps', async () => {
    prisma.contact.findMany
      .mockResolvedValueOnce([{ id: 'c1' }, { id: 'c2' }])              // resolveRecipients
      .mockResolvedValueOnce([{ id: 'c1', state: 'PENANG' }, { id: 'c2', state: null }]); // state load
    const result = await service.previewStateLanguages({ templateName: 'promo', defaultLanguage: 'EN' } as any);
    expect(result.uniqueContacts).toBe(2);
    expect(result.totalMessages).toBe(3); // Penang→2, null→1(EN)
    expect(result.byLanguage).toEqual({ ZH: 1, EN: 2 });
    expect(result.gaps).toEqual([]);
  });
});
```

- [ ] **Step 3: Run it, expect failure**

```bash
pnpm --filter api test -- blasts.service.spec.ts
```

Expected: FAIL — `previewStateLanguages` not defined.

- [ ] **Step 4: Implement previewStateLanguages**

Add this method to `BlastsService` (it reuses `validateTemplate`, `resolveRecipients`, `resolveContactLanguages`, and `stateMappings.asMap`). Factor the gap-computation so it matches Task 8's logic:

```ts
async previewStateLanguages(dto: PreviewStateLanguagesDto) {
  const { approvedRows } = await this.validateTemplate(dto.templateName, dto.defaultLanguage);
  const approvedByLang = new Map(approvedRows.map((r) => [r.language, r]));
  const contactIds = await this.resolveRecipients(dto.segmentId);
  const contacts = await this.prisma.contact.findMany({
    where: { id: { in: contactIds } },
    select: { id: true, state: true },
  });
  const mapping = await this.stateMappings.asMap();
  const defaultLanguage = dto.defaultLanguage as LanguagePreference;

  const byLanguage: Record<string, number> = {};
  const byStateMap = new Map<string, { contacts: number; languages: Set<string> }>();
  const gapStates = new Map<string, Set<string>>();
  let totalMessages = 0;

  for (const c of contacts) {
    const langs = resolveContactLanguages(c.state as MalaysianState | null, mapping, defaultLanguage);
    const stateKey = c.state ?? 'UNMAPPED';
    if (!byStateMap.has(stateKey)) byStateMap.set(stateKey, { contacts: 0, languages: new Set() });
    const entry = byStateMap.get(stateKey)!;
    entry.contacts += 1;
    for (const lang of langs) {
      entry.languages.add(lang);
      byLanguage[lang] = (byLanguage[lang] ?? 0) + 1;
      totalMessages += 1;
      if (!approvedByLang.has(lang)) {
        if (!gapStates.has(lang)) gapStates.set(lang, new Set());
        gapStates.get(lang)!.add(stateKey);
      }
    }
  }

  return {
    uniqueContacts: contacts.length,
    totalMessages,
    byLanguage,
    byState: [...byStateMap.entries()].map(([state, v]) => ({
      state, contacts: v.contacts, languages: [...v.languages],
    })),
    gaps: [...gapStates.entries()].map(([language, states]) => ({
      language, requiredByStates: [...states], templateName: dto.templateName,
    })),
  };
}
```

- [ ] **Step 5: Add the controller route**

In `apps/api/src/blasts/blasts.controller.ts`, add the import and route:

```ts
import { PreviewStateLanguagesDto } from './dto/preview-state-languages.dto';
// ... inside the class:

  @Post('preview-state-languages')
  previewStateLanguages(@Body() dto: PreviewStateLanguagesDto) {
    return this.blasts.previewStateLanguages(dto);
  }
```

- [ ] **Step 6: Build, test, boot**

```bash
pnpm --filter api build
pnpm --filter api test -- blasts.service.spec.ts
cd apps/api && timeout 8 node dist/main.js 2>&1 | grep -E "preview-state-languages|successfully started"; cd ../..
```

Expected: build clean, test passes, route mapped.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/blasts
git commit -m "feat(blast): add preview-state-languages endpoint for the wizard review (TDD)"
```

---

## Phase F — Frontend

### Task 10: State-language-mapping API client + Settings UI

**Files:**
- Create: `apps/web/src/api/stateLanguageMappings.ts`
- Modify: `apps/web/src/pages/Settings.tsx`

- [ ] **Step 1: Create the API client**

`apps/web/src/api/stateLanguageMappings.ts`:

```ts
import { api } from './client';
import type { LanguagePreference } from './contacts';

export type MalaysianState =
  | 'JOHOR' | 'KEDAH' | 'KELANTAN' | 'MELAKA' | 'NEGERI_SEMBILAN' | 'PAHANG'
  | 'PENANG' | 'PERAK' | 'PERLIS' | 'SABAH' | 'SARAWAK' | 'SELANGOR'
  | 'TERENGGANU' | 'KUALA_LUMPUR' | 'LABUAN' | 'PUTRAJAYA';

export interface StateMappingRow {
  state: MalaysianState;
  languages: LanguagePreference[];
}

export async function listStateLanguageMappings(): Promise<StateMappingRow[]> {
  const { data } = await api.get<StateMappingRow[]>('/state-language-mappings');
  return data;
}

export async function upsertStateLanguageMapping(state: MalaysianState, languages: LanguagePreference[]): Promise<StateMappingRow[]> {
  const { data } = await api.put<StateMappingRow[]>(`/state-language-mappings/${state}`, { languages });
  return data;
}

export async function clearStateLanguageMapping(state: MalaysianState): Promise<StateMappingRow[]> {
  const { data } = await api.delete<StateMappingRow[]>(`/state-language-mappings/${state}`);
  return data;
}
```

(Confirm `LanguagePreference` is exported from `apps/web/src/api/contacts.ts`; if not, define it locally as `'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER'`.)

- [ ] **Step 2: Add a "State language mapping" Card to Settings**

Read `apps/web/src/pages/Settings.tsx` first to match its structure (it default-exports `Settings`, uses `Card` from `../components/ui/Card`, React Query, and is ADMIN-gated by the route). Add a new section below the existing cards. Implement a 16-row table: each row shows the state label (humanize the enum, e.g. `NEGERI_SEMBILAN` → "Negeri Sembilan"), the current language `Pill`s (or "— (default)"), and an Edit control that opens an inline multi-select of `['EN','MS','ZH','TA','OTHER']`. Save calls `upsertStateLanguageMapping`; if the user clears all selections, call `clearStateLanguageMapping`. Use a `useQuery(['state-language-mappings'], listStateLanguageMappings)` and `useMutation` that invalidates that key. Add `data-testid="state-lang-row-{STATE}"`, `data-testid="state-lang-save"`, `data-testid="state-lang-multiselect"`.

Keep this section in its own component `StateLanguageMappingCard` within the same file (or a new file `apps/web/src/pages/settings/StateLanguageMappingCard.tsx` imported by Settings) to keep `Settings.tsx` focused.

- [ ] **Step 3: Build**

```bash
pnpm --filter web build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api/stateLanguageMappings.ts apps/web/src/pages/Settings.tsx apps/web/src/pages/settings 2>/dev/null
git commit -m "feat(web): add state-language mapping management to Settings (ADMIN)"
```

### Task 11: Blast wizard — language mode toggle + state-aware review

**Files:**
- Modify: `apps/web/src/api/blasts.ts`
- Modify: `apps/web/src/pages/BlastWizard.tsx`

- [ ] **Step 1: Add the preview API call + types**

In `apps/web/src/api/blasts.ts`, add:

```ts
export type BlastLanguageMode = 'PREFERENCE' | 'STATE';

export interface StateLanguagePreview {
  uniqueContacts: number;
  totalMessages: number;
  byLanguage: Record<string, number>;
  byState: { state: string; contacts: number; languages: string[] }[];
  gaps: { language: string; requiredByStates: string[]; templateName: string }[];
}

export async function previewStateLanguages(input: {
  templateName: string; defaultLanguage: string; segmentId?: string;
}): Promise<StateLanguagePreview> {
  const { data } = await api.post<StateLanguagePreview>('/blasts/preview-state-languages', input);
  return data;
}
```

Also add `languageMode?: BlastLanguageMode` to the `CreateBlastInput` interface in this file (read it first to find the interface name).

- [ ] **Step 2: Add the mode toggle + review to the wizard**

Read `apps/web/src/pages/BlastWizard.tsx` first. Add:
- A toggle on the template step: `Language by: (•) Contact preference  ( ) Contact state`, `data-testid="blast-language-mode"`, stored in component state, default `'PREFERENCE'`. Include the helper text from the spec.
- When mode is `STATE`, on reaching the review step call `previewStateLanguages({ templateName, defaultLanguage, segmentId })` via `useQuery` (enabled only in state mode + when those fields are set). Render "{totalMessages} messages to {uniqueContacts} contacts", the `byLanguage` counts, and the `byState` breakdown. `data-testid="blast-state-preview"`.
- If `preview.gaps.length > 0`, render a red blocker listing each gap (`{language} required by {states}`) with `data-testid="blast-state-gaps"` and disable the Launch button.
- Include `languageMode` in the `createBlast` payload.

- [ ] **Step 3: Build**

```bash
pnpm --filter web build
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api/blasts.ts apps/web/src/pages/BlastWizard.tsx
git commit -m "feat(web): blast wizard language-mode toggle + state-aware review with gap blocker"
```

### Task 12: Contact form state dropdown + blast detail message/contact display

**Files:**
- Modify: `apps/web/src/api/contacts.ts`
- Modify: `apps/web/src/pages/ContactForm.tsx`
- Modify: `apps/web/src/pages/BlastDetail.tsx`

- [ ] **Step 1: Update the contacts API state type**

In `apps/web/src/api/contacts.ts`, change the `state` field type on the Contact interface and create/update inputs from `string`/`string | null` to the `MalaysianState` union (import or re-declare it). Reuse the `MalaysianState` type — export it from `stateLanguageMappings.ts` and import here, OR declare a shared type. Keep it DRY: declare `MalaysianState` once (in `contacts.ts`) and import it into `stateLanguageMappings.ts` instead of duplicating. Adjust Task 10's client import accordingly.

- [ ] **Step 2: Make the contact form state field a dropdown**

In `apps/web/src/pages/ContactForm.tsx`, replace the free-text `state` input with a `<select>` of the 16 states (humanized labels, enum values). Allow an empty option (no state). Match the existing form-field styling in that file.

- [ ] **Step 3: Blast detail — messages vs contacts + language column**

In `apps/web/src/pages/BlastDetail.tsx`:
- Read the blast's `uniqueContacts` and `totalRecipients` (add `uniqueContacts` to the `Blast` interface in `apps/web/src/api/blasts.ts`). Change the header KPI to show "{totalRecipients} messages · {uniqueContacts} contacts".
- The recipients table (from Phase 5) should display each message's language. If the recipients endpoint already returns the template language per message, surface it as a "Language" column; if not, derive from the data already present. (Read the recipients rendering to see what's available — do not add a new endpoint; the per-message template variant is already in the data model.)

- [ ] **Step 4: Build**

```bash
pnpm --filter web build
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/api/contacts.ts apps/web/src/api/blasts.ts apps/web/src/pages/ContactForm.tsx apps/web/src/pages/BlastDetail.tsx
git commit -m "feat(web): contact state dropdown + blast detail messages-vs-contacts display"
```

---

## Phase G — E2E & docs

### Task 13: E2E test for state-based blasting

**Files:**
- Create: `e2e/tests/state-language-blast.spec.ts`

- [ ] **Step 1: Write the E2E spec**

Read `e2e/tests/blasts.spec.ts` and `e2e/tests/inbox.spec.ts` first for the login helper + seeding conventions. Create `e2e/tests/state-language-blast.spec.ts` covering the 6 scenarios from the spec:

1. Admin sets Penang → [ZH, EN] and Kelantan → [MS] via the Settings UI; reload shows the pills persisted.
2. Operator builds a STATE-mode blast; review shows "X messages to Y contacts" + by-state breakdown.
3. Gap case: a template missing the ZH variant → review shows the red blocker and Launch is disabled.
4. Happy path: all variants present → launch → blast detail shows messages > contacts.
5. PREFERENCE-mode blast still works (regression — can reuse the existing blasts.spec flow).
6. Operator cannot see the mapping Settings section (it's ADMIN-only).

Use the same auth helpers as the existing specs (admin + operator credentials). Seed contacts with known states either via the contacts API or the seed script. For the template-variant scenarios, rely on the seeded sample template's approved languages (read `apps/api/prisma/seed.ts` to see which languages are approved; if it only has EN, scenario 3's "missing ZH" is automatically satisfied, and scenario 4 needs a template with EN+ZH+MS — note in the test whether you need to create one via the templates API or extend the seed).

If the full stack isn't runnable in the implementer's environment, commit the spec and report E2E execution as deferred (the user runs E2E on the Mac).

- [ ] **Step 2: Attempt to run (if stack available)**

```bash
cd e2e && npx playwright test tests/state-language-blast.spec.ts; cd ..
```

Expected: pass, or deferred-with-reason if the stack isn't up.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/state-language-blast.spec.ts
git commit -m "test(e2e): state-based language blasting scenarios"
```

### Task 14: README + final verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add a README subsection**

Under the Features section, add:

```markdown
### State-based language blasting

Blasts can target template language by the contact's Malaysian state instead of
their individual preference. Admins configure a per-state language mapping in
Settings (e.g. Penang → Mandarin + English, Kelantan → Malay). In state mode,
each contact receives one message per language mapped to their state; contacts
whose state is unmapped or unknown get the blast's default language.

- Per-blast toggle: "Language by contact preference / contact state"
- Multiple languages per state → a contact may receive multiple messages
- Wizard review shows "X messages to Y contacts" and blocks launch if a required
  language has no approved template variant
- State is a canonical enum (16 MY states/territories); CSV import normalizes
  common spellings (Pulau Pinang → Penang)
```

- [ ] **Step 2: Final verification**

```bash
pnpm --filter api test
pnpm --filter api build
pnpm --filter web build
git log --oneline master..HEAD
```

Expected: all green; the log shows the full task sequence.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: add state-based language blasting section to README"
```

- [ ] **Step 4: Push + open PR (only after user consent — do not push autonomously)**

Leave the branch local. Report completion to the controller; the user decides when to push and open the PR.

---

## Self-Review

**Spec coverage:**
- Decision 1 (configurable table, multiple langs) → Tasks 1, 5, 7, 8
- Decision 2 (mode toggle, state drives, default fallback) → Tasks 7, 8, 11
- Decision 3 (block with precise gaps) → Task 8 (validation gate) + Task 9 (preview gaps) + Task 11 (UI blocker)
- Decision 4 (state enum + normalization) → Tasks 1, 2, 3, 4
- Decision 5 (count messages, uniqueContacts, "X messages to Y contacts") → Task 8 (data), Task 12 (display)
- Decision 6 (mapping UI in ADMIN Settings) → Tasks 6, 10
- Decision 7 (dedicated table) → Task 1
- Preview endpoint → Task 9
- CSV import normalization → Task 4
- Segment filter enum + stored-filter normalization → Task 4 (DTO/filter) + Task 3 migration (the migration's CASE handles the contacts table; stored segment `filterJson` values are normalized by the same alias logic — **note:** the plan's Task 3 migration normalizes `contacts.state` but NOT stored `filterJson`. Stored filter values are free-text and will simply fail to match the enum at query time, matching no contacts. This is the safe degradation noted in the spec's risk table; an explicit filterJson rewrite is omitted as YAGNI for the current small segment set. If you have important state-based segments, re-save them via the UI after migration.)
- E2E (6 scenarios) → Task 13
- README → Task 14

**Placeholder scan:** No "TBD"/"implement later". Every code step has concrete code. UI tasks (10, 11, 12, 13) describe behavior + test IDs + which existing file patterns to match rather than full JSX — this is intentional because the reskin's exact styling primitives must be matched by reading the files; the data contracts, test IDs, and API calls are fully specified.

**Type consistency:**
- `resolveContactLanguages(contactState, mapping, defaultLanguage)` signature identical in Tasks 7, 8, 9.
- `StateLanguageMappingService.asMap()` returns `Map<MalaysianState, LanguagePreference[]>` — consumed identically in Tasks 8, 9.
- `gaps` shape `{ language, requiredByStates, templateName }` identical in Task 8 (error), Task 9 (preview), Task 11 (UI).
- `uniqueContacts` / `totalRecipients` semantics consistent across Tasks 1, 8, 12.
- `MalaysianState` union declared once on the frontend (Task 12 dedupes Task 10's copy).

**Correction applied during review:** The spec's migration section claimed migration 3 rewrites stored `filterJson` state values. The plan deliberately scopes that out as YAGNI (documented above and in the spec's risk table — unmatched free-text filter values safely match no contacts). If the user objects, add a Task 3b that loads each segment, runs its `filterJson.state` through `normalizeState`, and re-saves. Flagged for the user's spec review.
