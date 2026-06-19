# WhatsApp Blast — Phase 2: Contacts & Segments Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add contact management (CRUD, demographic fields, opt-in tracking, CSV import) and saved segments (filter expressions that resolve to subsets of contacts) so a marketer can build a target audience for future blasts.

**Architecture:** Two new Prisma models — `Contact` (with first-class demographic columns: gender, ethnicity, religion, occupation, language preference, location) and `ContactSegment` (a named, persisted filter expression in JSONB). A pure `filter-to-where` translator converts the filter expression into a Prisma `WhereInput`, used both for listing contacts with filters and for resolving segment recipients. CSV import is server-side: multipart upload → parse → validate per-row → bulk upsert with detailed per-row error reporting. Frontend gets a `/contacts` page with filter chips and pagination, a contact form, a CSV upload UI, and a `/segments` page with a visual filter builder reusing the same component.

**Tech Stack:** NestJS 10, Prisma 5 (existing) + new models. `papaparse` (server-side CSV parsing). `libphonenumber-js` (E.164 phone normalization for Malaysian +60 numbers). multer via `@nestjs/platform-express` (file uploads). React 18 + React Query 5 + React Hook Form (existing) + a small custom FilterBuilder component.

**Spec reference:** `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md` — sections 2 (scope), 5 (data model: `contacts` and `contact_segments` tables), 9 (admin UI), 10 (auth — operators and admins both have contacts/segments access).

**Branch:** `feat/phase-2-contacts-segments` off the merged `master` (which now includes Phase 1).

---

## File Structure

```
apps/api/
  prisma/
    schema.prisma                          # MODIFIED: add Contact, ContactSegment + enums
    migrations/<timestamp>_contacts_segments/   # NEW
  src/
    contacts/
      contacts.module.ts                   # NEW
      contacts.controller.ts               # NEW
      contacts.service.ts                  # NEW
      csv-import.service.ts                # NEW — parse + validate + bulk upsert
      phone.util.ts                        # NEW — E.164 normalization, single responsibility
      dto/
        create-contact.dto.ts              # NEW
        update-contact.dto.ts              # NEW
        list-contacts.dto.ts               # NEW — pagination + filter query params
      __tests__/
        contacts.controller.spec.ts        # NEW
        csv-import.service.spec.ts         # NEW
        phone.util.spec.ts                 # NEW
    segments/
      segments.module.ts                   # NEW
      segments.controller.ts               # NEW
      segments.service.ts                  # NEW
      filter-to-where.ts                   # NEW — pure translator, fully testable
      dto/
        create-segment.dto.ts              # NEW
        update-segment.dto.ts              # NEW
        contact-filter.dto.ts              # NEW — shared filter shape
      __tests__/
        segments.controller.spec.ts        # NEW
        filter-to-where.spec.ts            # NEW
    app.module.ts                          # MODIFIED — register two new modules

apps/web/
  src/
    api/
      contacts.ts                          # NEW — listContacts/createContact/updateContact/deleteContact/importCsv
      segments.ts                          # NEW — listSegments/getSegment/createSegment/updateSegment/deleteSegment/previewSegment
    pages/
      Contacts.tsx                         # NEW — table, filter chips, pagination, search
      ContactForm.tsx                      # NEW — modal form for add/edit
      Segments.tsx                         # NEW — list/create/edit segments
    components/
      FilterBuilder.tsx                    # NEW — reused on Contacts (transient filter) and Segments (saved filter)
      CsvUpload.tsx                        # NEW — file input + progress + per-row error display
      Pagination.tsx                       # NEW — page/pageSize controls
    App.tsx                                # MODIFIED — add /contacts and /segments routes
    components/Layout.tsx                  # MODIFIED — add nav links

e2e/
  tests/
    contacts.spec.ts                       # NEW — smoke test for contact CRUD + segment flow
```

**Responsibility per file (key ones):**

- `phone.util.ts` — normalize freeform phone input to E.164 using `libphonenumber-js` with Malaysia default region.
- `csv-import.service.ts` — single responsibility: take a Buffer + a user id, return `{ imported, skipped, errors[] }`. Uses `phone.util` and Prisma.
- `filter-to-where.ts` — pure function: `(filter: ContactFilter) => Prisma.ContactWhereInput`. No DB calls. Fully unit-testable.
- `FilterBuilder.tsx` — controlled component: receives a filter value + onChange callback. Used in two contexts (transient query string for Contacts page; persisted body for Segments page).

---

## Task 1: Branch Setup

**Files:** none yet.

- [ ] **Step 1: Make sure local master is current**

```bash
git checkout master
git pull origin master
```

- [ ] **Step 2: Create the Phase 2 branch**

```bash
git checkout -b feat/phase-2-contacts-segments
```

- [ ] **Step 3: Verify clean tree**

Run: `git status`
Expected: `On branch feat/phase-2-contacts-segments`, working tree clean.

- [ ] **Step 4: Verify Phase 1 health before adding to it**

Run: `pnpm --filter api test`
Expected: 9 tests pass.

Run the API + web servers briefly (background) and confirm `GET /api/health` returns 200. Stop them.

No commit yet — this is just the branch setup.

---

## Task 2: Prisma Schema — Contact + ContactSegment + Enums

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: new migration directory (auto-generated)

- [ ] **Step 1: Append new enums and models to `apps/api/prisma/schema.prisma`**

Open the file and append (do NOT replace the existing `User` model or `UserRole` enum):

```prisma
enum Gender {
  MALE
  FEMALE
  OTHER
  UNKNOWN
}

enum Ethnicity {
  MALAY
  CHINESE
  INDIAN
  OTHER
  UNKNOWN
}

enum Religion {
  ISLAM
  BUDDHISM
  HINDUISM
  CHRISTIANITY
  OTHER
  UNKNOWN
}

enum Occupation {
  STUDENT
  EMPLOYED
  SELF_EMPLOYED
  UNEMPLOYED
  RETIRED
  OTHER
  UNKNOWN
}

enum LanguagePreference {
  EN
  MS
  ZH
  TA
  OTHER
}

enum OptInStatus {
  OPTED_IN
  OPTED_OUT
  PENDING
}

model Contact {
  id                  String              @id @default(uuid()) @db.Uuid
  phoneE164           String              @unique @map("phone_e164")
  name                String?
  dateOfBirth         DateTime?           @map("date_of_birth") @db.Date
  gender              Gender              @default(UNKNOWN)
  ethnicity           Ethnicity           @default(UNKNOWN)
  religion            Religion            @default(UNKNOWN)
  occupation          Occupation          @default(UNKNOWN)
  languagePreference  LanguagePreference  @default(EN) @map("language_preference")
  city                String?
  state               String?
  attributes          Json                @default("{}")
  optInStatus         OptInStatus         @default(PENDING) @map("opt_in_status")
  optInSource         String?             @map("opt_in_source")
  optInAt             DateTime?           @map("opt_in_at")
  optOutAt            DateTime?           @map("opt_out_at")
  createdAt           DateTime            @default(now()) @map("created_at")
  updatedAt           DateTime            @updatedAt @map("updated_at")

  @@index([ethnicity])
  @@index([gender])
  @@index([languagePreference])
  @@index([state])
  @@index([optInStatus])
  @@index([createdAt])
  @@map("contacts")
}

model ContactSegment {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @unique
  description String?
  filterJson  Json     @map("filter_json")
  createdById String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  @@map("contact_segments")
}
```

- [ ] **Step 2: Generate and apply the migration**

Run: `pnpm --filter api db:migrate -- --name contacts_segments`

Expected: a new migration directory under `apps/api/prisma/migrations/<timestamp>_contacts_segments/` containing `migration.sql`. Prisma client regenerates.

- [ ] **Step 3: Verify the tables exist in Postgres**

Run:
```bash
docker exec wbs_postgres psql -U wbs -d wbs -c "\d contacts"
docker exec wbs_postgres psql -U wbs -d wbs -c "\d contact_segments"
```

Expected: both tables show all columns with correct types. The `contacts` table should have 18 columns; `contact_segments` has 7. Indexes should be visible on the listed columns.

- [ ] **Step 4: Verify API still boots**

Background-launch:
```bash
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
sleep 12
curl -s http://localhost:3000/api/health
kill $API_PID 2>/dev/null
```

Expected: `{"status":"ok",...}` and no errors in api.log related to the new schema.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(db): add contacts and contact_segments tables with demographic enums"
```

---

## Task 3: Phone Number Utility (TDD)

**Files:**
- Create: `apps/api/src/contacts/phone.util.ts`, `apps/api/src/contacts/__tests__/phone.util.spec.ts`
- Modify: `apps/api/package.json` — add `libphonenumber-js`

- [ ] **Step 1: Install libphonenumber-js**

Run: `pnpm --filter api add libphonenumber-js`

Expected: dependency added, no errors.

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/contacts/__tests__/phone.util.spec.ts`:

```typescript
import { normalizePhoneE164 } from '../phone.util';

describe('normalizePhoneE164', () => {
  it('normalizes a local Malaysian mobile (starts with 01...) to +60', () => {
    expect(normalizePhoneE164('0123456789')).toBe('+60123456789');
  });

  it('normalizes a number with spaces and dashes', () => {
    expect(normalizePhoneE164('012-345 6789')).toBe('+60123456789');
  });

  it('keeps already-E164 format unchanged', () => {
    expect(normalizePhoneE164('+60123456789')).toBe('+60123456789');
  });

  it('normalizes a number with country code but no plus (60...)', () => {
    expect(normalizePhoneE164('60123456789')).toBe('+60123456789');
  });

  it('throws on a number that is too short to be valid', () => {
    expect(() => normalizePhoneE164('123')).toThrow(/invalid phone/i);
  });

  it('throws on a number with letters', () => {
    expect(() => normalizePhoneE164('phone-number')).toThrow(/invalid phone/i);
  });

  it('throws on empty input', () => {
    expect(() => normalizePhoneE164('')).toThrow(/invalid phone/i);
  });
});
```

- [ ] **Step 3: Run the test and verify it fails**

Run: `pnpm --filter api test phone.util`

Expected: FAIL — "Cannot find module '../phone.util'".

- [ ] **Step 4: Implement `apps/api/src/contacts/phone.util.ts`**

```typescript
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const DEFAULT_REGION = 'MY';

export function normalizePhoneE164(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    throw new Error('invalid phone: empty input');
  }
  const parsed = parsePhoneNumberFromString(raw.trim(), DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) {
    throw new Error(`invalid phone: ${raw}`);
  }
  return parsed.number;
}
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `pnpm --filter api test phone.util`

Expected: PASS — all 7 tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/contacts/phone.util.ts apps/api/src/contacts/__tests__/phone.util.spec.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(contacts): add phone E.164 normalization utility with libphonenumber-js"
```

---

## Task 4: Contacts DTOs

**Files:**
- Create: `apps/api/src/contacts/dto/create-contact.dto.ts`, `apps/api/src/contacts/dto/update-contact.dto.ts`, `apps/api/src/contacts/dto/list-contacts.dto.ts`

- [ ] **Step 1: Create `apps/api/src/contacts/dto/create-contact.dto.ts`**

```typescript
import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  Ethnicity,
  Gender,
  LanguagePreference,
  Occupation,
  OptInStatus,
  Religion,
} from '@prisma/client';

export class CreateContactDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(Ethnicity)
  ethnicity?: Ethnicity;

  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion;

  @IsOptional()
  @IsEnum(Occupation)
  occupation?: Occupation;

  @IsOptional()
  @IsEnum(LanguagePreference)
  languagePreference?: LanguagePreference;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  state?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(OptInStatus)
  optInStatus?: OptInStatus;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  optInSource?: string;
}
```

- [ ] **Step 2: Create `apps/api/src/contacts/dto/update-contact.dto.ts`**

```typescript
import {
  IsEnum,
  IsISO8601,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import {
  Ethnicity,
  Gender,
  LanguagePreference,
  Occupation,
  OptInStatus,
  Religion,
} from '@prisma/client';

export class UpdateContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsISO8601()
  dateOfBirth?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsEnum(Ethnicity)
  ethnicity?: Ethnicity;

  @IsOptional()
  @IsEnum(Religion)
  religion?: Religion;

  @IsOptional()
  @IsEnum(Occupation)
  occupation?: Occupation;

  @IsOptional()
  @IsEnum(LanguagePreference)
  languagePreference?: LanguagePreference;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  state?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(OptInStatus)
  optInStatus?: OptInStatus;
}
```

- [ ] **Step 3: Create `apps/api/src/contacts/dto/list-contacts.dto.ts`**

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import {
  Ethnicity,
  Gender,
  LanguagePreference,
  Occupation,
  OptInStatus,
  Religion,
} from '@prisma/client';

export class ListContactsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(Ethnicity, { each: true })
  ethnicity?: Ethnicity[];

  @IsOptional()
  @IsArray()
  @IsEnum(Gender, { each: true })
  gender?: Gender[];

  @IsOptional()
  @IsArray()
  @IsEnum(Religion, { each: true })
  religion?: Religion[];

  @IsOptional()
  @IsArray()
  @IsEnum(Occupation, { each: true })
  occupation?: Occupation[];

  @IsOptional()
  @IsArray()
  @IsEnum(LanguagePreference, { each: true })
  languagePreference?: LanguagePreference[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  state?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  city?: string[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  ageMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(120)
  ageMax?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(OptInStatus, { each: true })
  optInStatus?: OptInStatus[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  pageSize?: number = 50;
}
```

- [ ] **Step 4: Verify it compiles**

Run: `pnpm --filter api build`

Expected: no TS errors.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/contacts/dto
git commit -m "feat(contacts): add create/update/list DTOs with class-validator"
```

---

## Task 5: filter-to-where Translator (TDD)

**Files:**
- Create: `apps/api/src/segments/dto/contact-filter.dto.ts`, `apps/api/src/segments/filter-to-where.ts`, `apps/api/src/segments/__tests__/filter-to-where.spec.ts`

- [ ] **Step 1: Create the shared filter shape `apps/api/src/segments/dto/contact-filter.dto.ts`**

```typescript
import {
  Ethnicity,
  Gender,
  LanguagePreference,
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
  state?: string[];
  city?: string[];
  ageMin?: number;
  ageMax?: number;
  optInStatus?: OptInStatus[];
}
```

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/segments/__tests__/filter-to-where.spec.ts`:

```typescript
import { filterToWhere } from '../filter-to-where';

describe('filterToWhere', () => {
  const fixedNow = new Date('2026-05-25T00:00:00.000Z');

  it('returns empty object for empty filter', () => {
    expect(filterToWhere({}, fixedNow)).toEqual({});
  });

  it('translates ethnicity array to `in` clause', () => {
    expect(filterToWhere({ ethnicity: ['MALAY', 'CHINESE'] }, fixedNow)).toEqual({
      ethnicity: { in: ['MALAY', 'CHINESE'] },
    });
  });

  it('translates gender + state together with AND', () => {
    expect(
      filterToWhere({ gender: ['FEMALE'], state: ['Selangor'] }, fixedNow),
    ).toEqual({
      gender: { in: ['FEMALE'] },
      state: { in: ['Selangor'] },
    });
  });

  it('translates ageMin to dateOfBirth lte (today - ageMin years)', () => {
    // ageMin=25 on 2026-05-25 means dob <= 2001-05-25
    expect(filterToWhere({ ageMin: 25 }, fixedNow)).toEqual({
      dateOfBirth: { lte: new Date('2001-05-25T00:00:00.000Z') },
    });
  });

  it('translates ageMax to dateOfBirth gte (today - (ageMax+1) years + 1 day)', () => {
    // ageMax=45 on 2026-05-25 means dob >= 1980-05-26 (must be < 46 yrs old)
    expect(filterToWhere({ ageMax: 45 }, fixedNow)).toEqual({
      dateOfBirth: { gte: new Date('1980-05-26T00:00:00.000Z') },
    });
  });

  it('combines ageMin and ageMax into a single dateOfBirth range', () => {
    expect(filterToWhere({ ageMin: 25, ageMax: 45 }, fixedNow)).toEqual({
      dateOfBirth: {
        lte: new Date('2001-05-25T00:00:00.000Z'),
        gte: new Date('1980-05-26T00:00:00.000Z'),
      },
    });
  });

  it('ignores empty arrays', () => {
    expect(filterToWhere({ ethnicity: [], state: [] }, fixedNow)).toEqual({});
  });

  it('combines all filter dimensions', () => {
    const result = filterToWhere(
      {
        ethnicity: ['MALAY'],
        languagePreference: ['MS'],
        state: ['Selangor', 'KL'],
        ageMin: 25,
        ageMax: 45,
        optInStatus: ['OPTED_IN'],
      },
      fixedNow,
    );
    expect(result).toEqual({
      ethnicity: { in: ['MALAY'] },
      languagePreference: { in: ['MS'] },
      state: { in: ['Selangor', 'KL'] },
      dateOfBirth: {
        lte: new Date('2001-05-25T00:00:00.000Z'),
        gte: new Date('1980-05-26T00:00:00.000Z'),
      },
      optInStatus: { in: ['OPTED_IN'] },
    });
  });
});
```

- [ ] **Step 3: Run test and verify it fails**

Run: `pnpm --filter api test filter-to-where`

Expected: FAIL — "Cannot find module '../filter-to-where'".

- [ ] **Step 4: Implement `apps/api/src/segments/filter-to-where.ts`**

```typescript
import { Prisma } from '@prisma/client';
import { ContactFilter } from './dto/contact-filter.dto';

function yearsAgo(now: Date, years: number): Date {
  const d = new Date(now);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d;
}

export function filterToWhere(
  filter: ContactFilter,
  now: Date = new Date(),
): Prisma.ContactWhereInput {
  const where: Prisma.ContactWhereInput = {};

  if (filter.ethnicity?.length) where.ethnicity = { in: filter.ethnicity };
  if (filter.gender?.length) where.gender = { in: filter.gender };
  if (filter.religion?.length) where.religion = { in: filter.religion };
  if (filter.occupation?.length) where.occupation = { in: filter.occupation };
  if (filter.languagePreference?.length) where.languagePreference = { in: filter.languagePreference };
  if (filter.state?.length) where.state = { in: filter.state };
  if (filter.city?.length) where.city = { in: filter.city };
  if (filter.optInStatus?.length) where.optInStatus = { in: filter.optInStatus };

  const dobConstraint: { lte?: Date; gte?: Date } = {};
  if (filter.ageMin !== undefined) {
    dobConstraint.lte = yearsAgo(now, filter.ageMin);
  }
  if (filter.ageMax !== undefined) {
    // Older than ageMax means born before (today - (ageMax+1) years) + 1 day
    const cutoff = yearsAgo(now, filter.ageMax + 1);
    cutoff.setUTCDate(cutoff.getUTCDate() + 1);
    dobConstraint.gte = cutoff;
  }
  if (dobConstraint.lte || dobConstraint.gte) {
    where.dateOfBirth = dobConstraint;
  }

  return where;
}
```

- [ ] **Step 5: Run test and verify it passes**

Run: `pnpm --filter api test filter-to-where`

Expected: PASS — all 8 tests green.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/segments/dto apps/api/src/segments/filter-to-where.ts apps/api/src/segments/__tests__/filter-to-where.spec.ts
git commit -m "feat(segments): add pure filter-to-where translator with age-range support"
```

---

## Task 6: Contacts Service + Controller (TDD)

**Files:**
- Create: `apps/api/src/contacts/contacts.service.ts`, `apps/api/src/contacts/contacts.controller.ts`, `apps/api/src/contacts/contacts.module.ts`, `apps/api/src/contacts/__tests__/contacts.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Write the failing controller test**

Create `apps/api/src/contacts/__tests__/contacts.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { ContactsController } from '../contacts.controller';
import { ContactsService } from '../contacts.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: {
    list: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    findOne: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      findOne: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [{ provide: ContactsService, useValue: service }],
    }).compile();

    controller = module.get(ContactsController);
  });

  it('GET /contacts returns paginated list', async () => {
    service.list.mockResolvedValue({
      items: [{ id: 'c1', phoneE164: '+60123456789', name: 'Ahmad' }],
      total: 1,
      page: 1,
      pageSize: 50,
    });
    const result = await controller.list({ page: 1, pageSize: 50 } as any);
    expect(result.total).toBe(1);
    expect(result.items).toHaveLength(1);
    expect(service.list).toHaveBeenCalledWith({ page: 1, pageSize: 50 });
  });

  it('GET /contacts/:id returns one contact', async () => {
    service.findOne.mockResolvedValue({ id: 'c1', phoneE164: '+60123456789' });
    const result = await controller.findOne('c1');
    expect(result).toEqual({ id: 'c1', phoneE164: '+60123456789' });
  });

  it('POST /contacts creates contact', async () => {
    service.create.mockResolvedValue({ id: 'c2', phoneE164: '+60198765432' });
    const dto = { phone: '0198765432', name: 'Tan' } as any;
    const req = { user: { id: 'u1' } } as any;
    const result = await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'u1');
    expect(result.id).toBe('c2');
  });

  it('PATCH /contacts/:id updates contact', async () => {
    service.update.mockResolvedValue({ id: 'c1', name: 'New' });
    const result = await controller.update('c1', { name: 'New' } as any);
    expect(service.update).toHaveBeenCalledWith('c1', { name: 'New' });
    expect(result.name).toBe('New');
  });

  it('DELETE /contacts/:id removes contact', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('c1');
    expect(service.remove).toHaveBeenCalledWith('c1');
  });
});
```

- [ ] **Step 2: Run test and verify failure**

Run: `pnpm --filter api test contacts.controller`

Expected: FAIL — modules not found.

- [ ] **Step 3: Implement `apps/api/src/contacts/contacts.service.ts`**

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';
import { filterToWhere } from '../segments/filter-to-where';
import { ContactFilter } from '../segments/dto/contact-filter.dto';
import { normalizePhoneE164 } from './phone.util';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(q: ListContactsDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 50;

    const filter: ContactFilter = {
      ethnicity: q.ethnicity,
      gender: q.gender,
      religion: q.religion,
      occupation: q.occupation,
      languagePreference: q.languagePreference,
      state: q.state,
      city: q.city,
      ageMin: q.ageMin,
      ageMax: q.ageMax,
      optInStatus: q.optInStatus,
    };
    const where: Prisma.ContactWhereInput = filterToWhere(filter);

    if (q.search) {
      where.OR = [
        { name: { contains: q.search, mode: 'insensitive' } },
        { phoneE164: { contains: q.search } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async findOne(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException();
    return contact;
  }

  async create(dto: CreateContactDto, actorUserId: string) {
    const phoneE164 = normalizePhoneE164(dto.phone);

    const existing = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (existing) throw new ConflictException('Contact with that phone already exists');

    const optInStatus = dto.optInStatus ?? 'PENDING';
    const data: Prisma.ContactCreateInput = {
      phoneE164,
      name: dto.name,
      dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      gender: dto.gender,
      ethnicity: dto.ethnicity,
      religion: dto.religion,
      occupation: dto.occupation,
      languagePreference: dto.languagePreference,
      city: dto.city,
      state: dto.state,
      attributes: (dto.attributes ?? {}) as Prisma.InputJsonValue,
      optInStatus,
      optInSource: dto.optInSource ?? `manual:${actorUserId}`,
      optInAt: optInStatus === 'OPTED_IN' ? new Date() : undefined,
    };
    return this.prisma.contact.create({ data });
  }

  async update(id: string, dto: UpdateContactDto) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    const data: Prisma.ContactUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.dateOfBirth !== undefined) data.dateOfBirth = new Date(dto.dateOfBirth);
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.ethnicity !== undefined) data.ethnicity = dto.ethnicity;
    if (dto.religion !== undefined) data.religion = dto.religion;
    if (dto.occupation !== undefined) data.occupation = dto.occupation;
    if (dto.languagePreference !== undefined) data.languagePreference = dto.languagePreference;
    if (dto.city !== undefined) data.city = dto.city;
    if (dto.state !== undefined) data.state = dto.state;
    if (dto.attributes !== undefined) data.attributes = dto.attributes as Prisma.InputJsonValue;
    if (dto.optInStatus !== undefined) {
      data.optInStatus = dto.optInStatus;
      if (dto.optInStatus === 'OPTED_OUT' && !existing.optOutAt) data.optOutAt = new Date();
      if (dto.optInStatus === 'OPTED_IN' && !existing.optInAt) data.optInAt = new Date();
    }

    return this.prisma.contact.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.contact.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.contact.delete({ where: { id } });
  }
}
```

- [ ] **Step 4: Implement `apps/api/src/contacts/contacts.controller.ts`**

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ListContactsDto } from './dto/list-contacts.dto';

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Get()
  list(@Query() q: ListContactsDto) {
    return this.contacts.list(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contacts.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateContactDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.contacts.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateContactDto) {
    return this.contacts.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.contacts.remove(id);
  }
}
```

- [ ] **Step 5: Implement `apps/api/src/contacts/contacts.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContactsController],
  providers: [ContactsService],
  exports: [ContactsService],
})
export class ContactsModule {}
```

- [ ] **Step 6: Wire into AppModule**

Edit `apps/api/src/app.module.ts`. Add the import and registration:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContactsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 7: Run tests and verify pass**

Run: `pnpm --filter api test`

Expected: all 9 prior tests + 5 new = 14 tests pass.

- [ ] **Step 8: Manual smoke test the endpoints**

Background-launch the API:
```bash
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
sleep 12
```

Get an admin access token:
```bash
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
```

Create a contact:
```bash
curl -s -X POST http://localhost:3000/api/contacts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phone":"0123456789","name":"Ahmad","ethnicity":"MALAY","languagePreference":"MS","state":"Selangor","optInStatus":"OPTED_IN"}'
```

Expected: 201 Created with a JSON body containing `phoneE164: "+60123456789"`.

List contacts:
```bash
curl -s -X GET 'http://localhost:3000/api/contacts?ethnicity=MALAY' \
  -H "Authorization: Bearer $TOKEN"
```

Expected: JSON with `items: [...]` containing the contact, `total: 1`.

Stop server: `kill $API_PID 2>/dev/null`.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/contacts apps/api/src/app.module.ts
git commit -m "feat(contacts): add CRUD endpoints with filter/pagination support"
```

---

## Task 7: CSV Import Service (TDD)

**Files:**
- Create: `apps/api/src/contacts/csv-import.service.ts`, `apps/api/src/contacts/__tests__/csv-import.service.spec.ts`
- Modify: `apps/api/package.json` — add `papaparse` + `@types/papaparse` + `multer` + `@types/multer`
- Modify: `apps/api/src/contacts/contacts.module.ts` — register CsvImportService
- Modify: `apps/api/src/contacts/contacts.controller.ts` — add `POST /contacts/import` endpoint

- [ ] **Step 1: Install dependencies**

```bash
pnpm --filter api add papaparse
pnpm --filter api add -D @types/papaparse @types/multer
```

(`multer` itself comes bundled with `@nestjs/platform-express` — no separate install needed.)

- [ ] **Step 2: Write the failing test**

Create `apps/api/src/contacts/__tests__/csv-import.service.spec.ts`:

```typescript
import { CsvImportService } from '../csv-import.service';

describe('CsvImportService', () => {
  let service: CsvImportService;
  let mockPrisma: {
    contact: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      contact: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
    };
    service = new CsvImportService(mockPrisma as any);
  });

  it('imports a single valid row', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from(
      'phone,name,ethnicity,languagePreference\n0123456789,Ahmad,MALAY,MS\n',
    );
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(0);
    expect(mockPrisma.contact.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          phoneE164: '+60123456789',
          name: 'Ahmad',
          ethnicity: 'MALAY',
          languagePreference: 'MS',
          optInSource: 'csv:test.csv',
          optInStatus: 'OPTED_IN',
        }),
      }),
    );
  });

  it('skips duplicate phone numbers', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue({ id: 'existing' });

    const csv = Buffer.from('phone,name\n0123456789,Ahmad\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(result.errors).toHaveLength(0);
    expect(mockPrisma.contact.create).not.toHaveBeenCalled();
  });

  it('reports row-level errors for invalid phone numbers', async () => {
    const csv = Buffer.from('phone,name\nnot-a-phone,Ahmad\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toMatchObject({ row: 2, message: expect.stringContaining('invalid phone') });
  });

  it('reports row-level errors for invalid enum values', async () => {
    const csv = Buffer.from('phone,ethnicity\n0123456789,NOT_A_REAL_ETHNICITY\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toMatch(/invalid ethnicity/i);
  });

  it('handles a missing phone column gracefully', async () => {
    const csv = Buffer.from('name,ethnicity\nAhmad,MALAY\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(0);
    expect(result.errors[0].message).toMatch(/phone/i);
  });

  it('continues processing after row-level errors', async () => {
    mockPrisma.contact.findUnique.mockResolvedValue(null);
    mockPrisma.contact.create.mockResolvedValue({ id: 'c1' });

    const csv = Buffer.from('phone,name\nbad-phone,Bad\n0123456789,Good\n');
    const result = await service.import(csv, 'csv:test.csv', 'user-1');

    expect(result.imported).toBe(1);
    expect(result.errors).toHaveLength(1);
  });
});
```

- [ ] **Step 3: Run the test and verify failure**

Run: `pnpm --filter api test csv-import.service`

Expected: FAIL — module not found.

- [ ] **Step 4: Implement `apps/api/src/contacts/csv-import.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { parse } from 'papaparse';
import {
  Ethnicity,
  Gender,
  LanguagePreference,
  Occupation,
  OptInStatus,
  Prisma,
  Religion,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { normalizePhoneE164 } from './phone.util';

export interface ImportRowError {
  row: number;
  message: string;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: ImportRowError[];
}

interface RawRow {
  phone?: string;
  name?: string;
  dateOfBirth?: string;
  gender?: string;
  ethnicity?: string;
  religion?: string;
  occupation?: string;
  languagePreference?: string;
  city?: string;
  state?: string;
}

function parseEnum<T extends string>(value: string | undefined, enumObj: Record<string, T>, field: string): T | undefined {
  if (value === undefined || value === '') return undefined;
  const upper = value.toUpperCase();
  if (upper in enumObj) return enumObj[upper];
  throw new Error(`invalid ${field}: ${value}`);
}

@Injectable()
export class CsvImportService {
  constructor(private readonly prisma: PrismaService) {}

  async import(file: Buffer, source: string, actorUserId: string): Promise<ImportResult> {
    const text = file.toString('utf8');
    const parsed = parse<RawRow>(text, { header: true, skipEmptyLines: true });

    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 0; i < parsed.data.length; i++) {
      const rowNumber = i + 2; // +1 for header, +1 to be 1-indexed
      const row = parsed.data[i];

      try {
        if (!row.phone || row.phone.trim() === '') {
          throw new Error('missing required column: phone');
        }
        const phoneE164 = normalizePhoneE164(row.phone);

        const existing = await this.prisma.contact.findUnique({ where: { phoneE164 } });
        if (existing) {
          result.skipped++;
          continue;
        }

        const data: Prisma.ContactCreateInput = {
          phoneE164,
          name: row.name?.trim() || undefined,
          dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : undefined,
          gender: parseEnum(row.gender, Gender, 'gender'),
          ethnicity: parseEnum(row.ethnicity, Ethnicity, 'ethnicity'),
          religion: parseEnum(row.religion, Religion, 'religion'),
          occupation: parseEnum(row.occupation, Occupation, 'occupation'),
          languagePreference: parseEnum(row.languagePreference, LanguagePreference, 'languagePreference'),
          city: row.city?.trim() || undefined,
          state: row.state?.trim() || undefined,
          attributes: {},
          optInStatus: OptInStatus.OPTED_IN,
          optInSource: source,
          optInAt: new Date(),
        };

        await this.prisma.contact.create({ data });
        result.imported++;
      } catch (err) {
        result.errors.push({
          row: rowNumber,
          message: err instanceof Error ? err.message : 'unknown error',
        });
      }
    }

    return result;
  }
}
```

- [ ] **Step 5: Run the test and verify pass**

Run: `pnpm --filter api test csv-import.service`

Expected: PASS — 6 tests green.

- [ ] **Step 6: Add the import endpoint to `apps/api/src/contacts/contacts.controller.ts`**

Add these imports at top:

```typescript
import { FileInterceptor } from '@nestjs/platform-express';
import { UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { CsvImportService, ImportResult } from './csv-import.service';
```

Inject CsvImportService into the constructor:

```typescript
  constructor(
    private readonly contacts: ContactsService,
    private readonly csv: CsvImportService,
  ) {}
```

Add this method to the controller (before the existing `findOne` is fine):

```typescript
  @Post('import')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async import(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ): Promise<ImportResult> {
    if (!file) throw new BadRequestException('No file uploaded under field "file"');
    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }
    const userId = (req.user as { id: string }).id;
    return this.csv.import(file.buffer, `csv:${file.originalname}`, userId);
  }
```

- [ ] **Step 7: Register CsvImportService in `apps/api/src/contacts/contacts.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';
import { CsvImportService } from './csv-import.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ContactsController],
  providers: [ContactsService, CsvImportService],
  exports: [ContactsService],
})
export class ContactsModule {}
```

- [ ] **Step 8: Add the controller-spec test for the import endpoint**

Append to `apps/api/src/contacts/__tests__/contacts.controller.spec.ts` — extend the test setup to provide CsvImportService:

```typescript
// At the top of the file, add:
import { CsvImportService } from '../csv-import.service';

// In beforeEach, add csvService alongside the existing mock:
const csvService = { import: jest.fn() };
// Then change the Test.createTestingModule providers to:
//   { provide: ContactsService, useValue: service },
//   { provide: CsvImportService, useValue: csvService },

// Add this test inside the describe block:
it('POST /contacts/import returns import result', async () => {
  csvService.import.mockResolvedValue({ imported: 5, skipped: 1, errors: [] });
  const file = {
    buffer: Buffer.from('phone\n0123456789\n'),
    originalname: 'list.csv',
    mimetype: 'text/csv',
  } as any;
  const req = { user: { id: 'u1' } } as any;
  const result = await controller.import(file, req);
  expect(result.imported).toBe(5);
  expect(csvService.import).toHaveBeenCalledWith(file.buffer, 'csv:list.csv', 'u1');
});
```

NOTE: After editing the spec, re-run:

Run: `pnpm --filter api test contacts.controller`

Expected: PASS — 6 controller tests now.

- [ ] **Step 9: Manual smoke test**

Background-launch the API:
```bash
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
sleep 12

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Create a test CSV
cat > /tmp/contacts-test.csv << 'EOF'
phone,name,ethnicity,languagePreference,state
0198765432,Tan Wei Ming,CHINESE,EN,Selangor
0145678901,Priya Devi,INDIAN,TA,KL
not-a-phone,Bad Row,MALAY,MS,Penang
EOF

# Upload
curl -s -X POST http://localhost:3000/api/contacts/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/tmp/contacts-test.csv"

kill $API_PID 2>/dev/null
```

Expected: JSON response with `imported: 2, skipped: 0, errors: [{ row: 4, message: "invalid phone: ..." }]`.

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/contacts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(contacts): add CSV import endpoint with per-row error reporting"
```

---

## Task 8: Segments Module (TDD)

**Files:**
- Create: `apps/api/src/segments/segments.service.ts`, `apps/api/src/segments/segments.controller.ts`, `apps/api/src/segments/segments.module.ts`, `apps/api/src/segments/dto/create-segment.dto.ts`, `apps/api/src/segments/dto/update-segment.dto.ts`, `apps/api/src/segments/__tests__/segments.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: Create the segment DTOs**

`apps/api/src/segments/dto/create-segment.dto.ts`:

```typescript
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSegmentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsObject()
  filter!: Record<string, unknown>;
}
```

`apps/api/src/segments/dto/update-segment.dto.ts`:

```typescript
import { IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateSegmentDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsOptional()
  @IsObject()
  filter?: Record<string, unknown>;
}
```

- [ ] **Step 2: Write the failing controller test**

Create `apps/api/src/segments/__tests__/segments.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { SegmentsController } from '../segments.controller';
import { SegmentsService } from '../segments.service';

describe('SegmentsController', () => {
  let controller: SegmentsController;
  let service: {
    list: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
    preview: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      preview: jest.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [SegmentsController],
      providers: [{ provide: SegmentsService, useValue: service }],
    }).compile();

    controller = module.get(SegmentsController);
  });

  it('GET /segments returns list', async () => {
    service.list.mockResolvedValue([{ id: 's1', name: 'KL Malays' }]);
    const result = await controller.list();
    expect(result).toEqual([{ id: 's1', name: 'KL Malays' }]);
  });

  it('GET /segments/:id returns one', async () => {
    service.findOne.mockResolvedValue({ id: 's1', name: 'KL Malays' });
    const result = await controller.findOne('s1');
    expect(result.id).toBe('s1');
  });

  it('POST /segments creates and uses requester id', async () => {
    service.create.mockResolvedValue({ id: 's2', name: 'New' });
    const dto = { name: 'New', filter: { ethnicity: ['MALAY'] } } as any;
    const req = { user: { id: 'u1' } } as any;
    await controller.create(dto, req);
    expect(service.create).toHaveBeenCalledWith(dto, 'u1');
  });

  it('PATCH /segments/:id updates', async () => {
    service.update.mockResolvedValue({ id: 's1', name: 'Renamed' });
    const result = await controller.update('s1', { name: 'Renamed' } as any);
    expect(service.update).toHaveBeenCalledWith('s1', { name: 'Renamed' });
    expect(result.name).toBe('Renamed');
  });

  it('DELETE /segments/:id removes', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('s1');
    expect(service.remove).toHaveBeenCalledWith('s1');
  });

  it('GET /segments/:id/preview returns count and sample', async () => {
    service.preview.mockResolvedValue({ count: 42, sample: [{ id: 'c1' }] });
    const result = await controller.preview('s1');
    expect(result.count).toBe(42);
  });
});
```

- [ ] **Step 3: Run test and verify failure**

Run: `pnpm --filter api test segments.controller`

Expected: FAIL — modules not found.

- [ ] **Step 4: Implement `apps/api/src/segments/segments.service.ts`**

```typescript
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';
import { ContactFilter } from './dto/contact-filter.dto';
import { filterToWhere } from './filter-to-where';

const PREVIEW_SAMPLE_SIZE = 10;

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.contactSegment.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const segment = await this.prisma.contactSegment.findUnique({ where: { id } });
    if (!segment) throw new NotFoundException();
    return segment;
  }

  async create(dto: CreateSegmentDto, actorUserId: string) {
    const existing = await this.prisma.contactSegment.findUnique({ where: { name: dto.name } });
    if (existing) throw new ConflictException('Segment name already in use');

    return this.prisma.contactSegment.create({
      data: {
        name: dto.name,
        description: dto.description,
        filterJson: dto.filter as Prisma.InputJsonValue,
        createdById: actorUserId,
      },
    });
  }

  async update(id: string, dto: UpdateSegmentDto) {
    const existing = await this.prisma.contactSegment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();

    if (dto.name && dto.name !== existing.name) {
      const conflict = await this.prisma.contactSegment.findUnique({ where: { name: dto.name } });
      if (conflict) throw new ConflictException('Segment name already in use');
    }

    return this.prisma.contactSegment.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        filterJson: dto.filter !== undefined ? (dto.filter as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  async remove(id: string) {
    const existing = await this.prisma.contactSegment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    await this.prisma.contactSegment.delete({ where: { id } });
  }

  async preview(id: string) {
    const segment = await this.findOne(id);
    const filter = segment.filterJson as unknown as ContactFilter;
    const where = filterToWhere(filter);

    const [count, sample] = await this.prisma.$transaction([
      this.prisma.contact.count({ where }),
      this.prisma.contact.findMany({ where, take: PREVIEW_SAMPLE_SIZE, orderBy: { createdAt: 'desc' } }),
    ]);

    return { count, sample };
  }
}
```

- [ ] **Step 5: Implement `apps/api/src/segments/segments.controller.ts`**

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/create-segment.dto';
import { UpdateSegmentDto } from './dto/update-segment.dto';

@Controller('segments')
@UseGuards(JwtAuthGuard)
export class SegmentsController {
  constructor(private readonly segments: SegmentsService) {}

  @Get()
  list() {
    return this.segments.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.segments.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateSegmentDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.segments.create(dto, userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateSegmentDto) {
    return this.segments.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.segments.remove(id);
  }

  @Get(':id/preview')
  preview(@Param('id') id: string) {
    return this.segments.preview(id);
  }
}
```

- [ ] **Step 6: Implement `apps/api/src/segments/segments.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SegmentsController],
  providers: [SegmentsService],
  exports: [SegmentsService],
})
export class SegmentsModule {}
```

- [ ] **Step 7: Register in `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { SegmentsModule } from './segments/segments.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    SegmentsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 8: Run tests**

Run: `pnpm --filter api test`

Expected: all prior tests + 6 new segment controller tests = ~21 tests pass.

- [ ] **Step 9: Manual smoke test**

```bash
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
sleep 12

TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"ChangeMe123!"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

# Create a segment
SEGMENT_ID=$(curl -s -X POST http://localhost:3000/api/segments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"KL Malays 25-45","filter":{"ethnicity":["MALAY"],"state":["KL","Selangor"],"ageMin":25,"ageMax":45}}' \
  | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "Created segment: $SEGMENT_ID"

# Preview it
curl -s http://localhost:3000/api/segments/$SEGMENT_ID/preview \
  -H "Authorization: Bearer $TOKEN"

kill $API_PID 2>/dev/null
```

Expected: `{ "count": N, "sample": [...] }` based on whatever contacts you've added.

- [ ] **Step 10: Commit**

```bash
git add apps/api/src/segments apps/api/src/app.module.ts
git commit -m "feat(segments): add segment CRUD and preview endpoint"
```

---

## Task 9: Frontend — Contacts API Client + Types

**Files:**
- Create: `apps/web/src/api/contacts.ts`

- [ ] **Step 1: Create `apps/web/src/api/contacts.ts`**

```typescript
import { api } from './client';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
export type Ethnicity = 'MALAY' | 'CHINESE' | 'INDIAN' | 'OTHER' | 'UNKNOWN';
export type Religion = 'ISLAM' | 'BUDDHISM' | 'HINDUISM' | 'CHRISTIANITY' | 'OTHER' | 'UNKNOWN';
export type Occupation = 'STUDENT' | 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED' | 'OTHER' | 'UNKNOWN';
export type LanguagePreference = 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';
export type OptInStatus = 'OPTED_IN' | 'OPTED_OUT' | 'PENDING';

export interface Contact {
  id: string;
  phoneE164: string;
  name: string | null;
  dateOfBirth: string | null;
  gender: Gender;
  ethnicity: Ethnicity;
  religion: Religion;
  occupation: Occupation;
  languagePreference: LanguagePreference;
  city: string | null;
  state: string | null;
  attributes: Record<string, unknown>;
  optInStatus: OptInStatus;
  optInSource: string | null;
  optInAt: string | null;
  optOutAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ContactFilter {
  search?: string;
  ethnicity?: Ethnicity[];
  gender?: Gender[];
  religion?: Religion[];
  occupation?: Occupation[];
  languagePreference?: LanguagePreference[];
  state?: string[];
  city?: string[];
  ageMin?: number;
  ageMax?: number;
  optInStatus?: OptInStatus[];
}

export interface ListContactsResponse {
  items: Contact[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateContactInput {
  phone: string;
  name?: string;
  dateOfBirth?: string;
  gender?: Gender;
  ethnicity?: Ethnicity;
  religion?: Religion;
  occupation?: Occupation;
  languagePreference?: LanguagePreference;
  city?: string;
  state?: string;
  optInStatus?: OptInStatus;
  attributes?: Record<string, unknown>;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export async function listContacts(
  filter: ContactFilter & { page?: number; pageSize?: number },
): Promise<ListContactsResponse> {
  const params: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined || value === null) continue;
    if (Array.isArray(value) && value.length === 0) continue;
    params[key] = value;
  }
  const { data } = await api.get<ListContactsResponse>('/contacts', {
    params,
    paramsSerializer: { indexes: null }, // ?ethnicity=MALAY&ethnicity=CHINESE
  });
  return data;
}

export async function getContact(id: string): Promise<Contact> {
  const { data } = await api.get<Contact>(`/contacts/${id}`);
  return data;
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const { data } = await api.post<Contact>('/contacts', input);
  return data;
}

export async function updateContact(id: string, input: Partial<CreateContactInput>): Promise<Contact> {
  const { data } = await api.patch<Contact>(`/contacts/${id}`, input);
  return data;
}

export async function deleteContact(id: string): Promise<void> {
  await api.delete(`/contacts/${id}`);
}

export async function importContactsCsv(file: File): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post<ImportResult>('/contacts/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter web build`

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/api/contacts.ts
git commit -m "feat(web): add contacts API client with types"
```

---

## Task 10: Frontend — FilterBuilder Component

**Files:**
- Create: `apps/web/src/components/FilterBuilder.tsx`

- [ ] **Step 1: Create `apps/web/src/components/FilterBuilder.tsx`**

```tsx
import type {
  ContactFilter,
  Ethnicity,
  Gender,
  LanguagePreference,
  Occupation,
  OptInStatus,
  Religion,
} from '../api/contacts';

const ETHNICITY_OPTIONS: Ethnicity[] = ['MALAY', 'CHINESE', 'INDIAN', 'OTHER', 'UNKNOWN'];
const GENDER_OPTIONS: Gender[] = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
const RELIGION_OPTIONS: Religion[] = ['ISLAM', 'BUDDHISM', 'HINDUISM', 'CHRISTIANITY', 'OTHER', 'UNKNOWN'];
const OCCUPATION_OPTIONS: Occupation[] = ['STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'OTHER', 'UNKNOWN'];
const LANGUAGE_OPTIONS: LanguagePreference[] = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];
const OPT_IN_OPTIONS: OptInStatus[] = ['OPTED_IN', 'OPTED_OUT', 'PENDING'];

interface Props {
  value: ContactFilter;
  onChange: (next: ContactFilter) => void;
}

function MultiSelectChips<T extends string>({
  label,
  options,
  selected,
  onChange,
  testIdPrefix,
}: {
  label: string;
  options: readonly T[];
  selected: T[] | undefined;
  onChange: (next: T[]) => void;
  testIdPrefix: string;
}) {
  function toggle(value: T) {
    const current = selected ?? [];
    if (current.includes(value)) onChange(current.filter((v) => v !== value));
    else onChange([...current, value]);
  }

  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-gray-600 uppercase">{label}</div>
      <div className="flex flex-wrap gap-1.5" data-testid={`filter-${testIdPrefix}`}>
        {options.map((opt) => {
          const isSelected = selected?.includes(opt);
          return (
            <button
              type="button"
              key={opt}
              onClick={() => toggle(opt)}
              className={
                isSelected
                  ? 'px-2.5 py-1 rounded-full text-xs bg-indigo-600 text-white'
                  : 'px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 text-gray-700'
              }
              data-testid={`filter-${testIdPrefix}-${opt}`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBuilder({ value, onChange }: Props) {
  return (
    <div className="bg-gray-50 p-4 rounded grid grid-cols-1 md:grid-cols-2 gap-4">
      <MultiSelectChips
        label="Ethnicity"
        options={ETHNICITY_OPTIONS}
        selected={value.ethnicity}
        onChange={(next) => onChange({ ...value, ethnicity: next.length ? next : undefined })}
        testIdPrefix="ethnicity"
      />
      <MultiSelectChips
        label="Gender"
        options={GENDER_OPTIONS}
        selected={value.gender}
        onChange={(next) => onChange({ ...value, gender: next.length ? next : undefined })}
        testIdPrefix="gender"
      />
      <MultiSelectChips
        label="Religion"
        options={RELIGION_OPTIONS}
        selected={value.religion}
        onChange={(next) => onChange({ ...value, religion: next.length ? next : undefined })}
        testIdPrefix="religion"
      />
      <MultiSelectChips
        label="Occupation"
        options={OCCUPATION_OPTIONS}
        selected={value.occupation}
        onChange={(next) => onChange({ ...value, occupation: next.length ? next : undefined })}
        testIdPrefix="occupation"
      />
      <MultiSelectChips
        label="Language"
        options={LANGUAGE_OPTIONS}
        selected={value.languagePreference}
        onChange={(next) => onChange({ ...value, languagePreference: next.length ? next : undefined })}
        testIdPrefix="language"
      />
      <MultiSelectChips
        label="Opt-in"
        options={OPT_IN_OPTIONS}
        selected={value.optInStatus}
        onChange={(next) => onChange({ ...value, optInStatus: next.length ? next : undefined })}
        testIdPrefix="optin"
      />
      <div>
        <div className="text-xs font-medium text-gray-600 uppercase mb-1">Age range</div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            max={120}
            placeholder="Min"
            value={value.ageMin ?? ''}
            onChange={(e) => onChange({ ...value, ageMin: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="border rounded px-2 py-1 w-24 text-sm"
            data-testid="filter-age-min"
          />
          <span className="text-gray-500 text-sm">to</span>
          <input
            type="number"
            min={0}
            max={120}
            placeholder="Max"
            value={value.ageMax ?? ''}
            onChange={(e) => onChange({ ...value, ageMax: e.target.value === '' ? undefined : Number(e.target.value) })}
            className="border rounded px-2 py-1 w-24 text-sm"
            data-testid="filter-age-max"
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm --filter web build`

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/FilterBuilder.tsx
git commit -m "feat(web): add reusable FilterBuilder component"
```

---

## Task 11: Frontend — Contacts Page (List + Filters + Pagination)

**Files:**
- Create: `apps/web/src/pages/Contacts.tsx`, `apps/web/src/components/Pagination.tsx`
- Modify: `apps/web/src/App.tsx` (add `/contacts` route), `apps/web/src/components/Layout.tsx` (add nav link)

- [ ] **Step 1: Create `apps/web/src/components/Pagination.tsx`**

```tsx
interface Props {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (next: number) => void;
}

export default function Pagination({ page, pageSize, total, onPageChange }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between py-3 text-sm" data-testid="pagination">
      <div className="text-gray-600">
        {from}–{to} of {total}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
          data-testid="page-prev"
        >
          Prev
        </button>
        <span className="px-3 py-1">{page} / {totalPages}</span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1 border rounded disabled:opacity-40"
          data-testid="page-next"
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/pages/Contacts.tsx`**

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  listContacts,
  type ContactFilter,
} from '../api/contacts';
import FilterBuilder from '../components/FilterBuilder';
import Pagination from '../components/Pagination';

const PAGE_SIZE = 50;

export default function Contacts() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ContactFilter>({});
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contacts', search, filter, page],
    queryFn: () => listContacts({ ...filter, search: search || undefined, page, pageSize: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  function onFilterChange(next: ContactFilter) {
    setFilter(next);
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
        <div className="flex gap-2">
          <Link
            to="/contacts/new"
            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-medium"
            data-testid="add-contact"
          >
            + Add Contact
          </Link>
          <Link
            to="/contacts/import"
            className="bg-white border border-indigo-600 text-indigo-600 px-3 py-1.5 rounded text-sm font-medium"
            data-testid="import-csv"
          >
            ↑ Import CSV
          </Link>
        </div>
      </section>

      <section>
        <input
          type="search"
          placeholder="Search by name or phone…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2 w-full max-w-md"
          data-testid="contacts-search"
        />
      </section>

      <FilterBuilder value={filter} onChange={onFilterChange} />

      <section>
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load contacts.</p>}
        {data && (
          <>
            <table className="w-full bg-white rounded shadow-sm" data-testid="contacts-table">
              <thead className="text-left text-sm text-gray-600 border-b">
                <tr>
                  <th className="p-3">Name</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Ethnicity</th>
                  <th className="p-3">Language</th>
                  <th className="p-3">State</th>
                  <th className="p-3">Opt-in</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((c) => (
                  <tr key={c.id} className="border-b text-sm" data-testid={`contact-row-${c.id}`}>
                    <td className="p-3">{c.name ?? '—'}</td>
                    <td className="p-3 font-mono">{c.phoneE164}</td>
                    <td className="p-3">{c.ethnicity}</td>
                    <td className="p-3">{c.languagePreference}</td>
                    <td className="p-3">{c.state ?? '—'}</td>
                    <td className="p-3">
                      <span
                        className={
                          c.optInStatus === 'OPTED_IN'
                            ? 'text-green-700'
                            : c.optInStatus === 'OPTED_OUT'
                              ? 'text-red-700'
                              : 'text-gray-500'
                        }
                      >
                        {c.optInStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Link to={`/contacts/${c.id}`} className="text-indigo-600">Edit</Link>
                    </td>
                  </tr>
                ))}
                {data.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-gray-500">No contacts match these filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
            <Pagination
              page={data.page}
              pageSize={data.pageSize}
              total={data.total}
              onPageChange={setPage}
            />
          </>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Add the route and nav link**

Edit `apps/web/src/App.tsx` — add the import and route:

```tsx
import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Contacts from './pages/Contacts';
import Layout from './components/Layout';
import { ProtectedRoute } from './auth/ProtectedRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout><Dashboard /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Layout><Contacts /></Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute requireRole="ADMIN">
            <Layout><Settings /></Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

Edit `apps/web/src/components/Layout.tsx` — add the Contacts link after Dashboard:

```tsx
<Link to="/" className="text-sm text-gray-700">Dashboard</Link>
<Link to="/contacts" className="text-sm text-gray-700">Contacts</Link>
{user?.role === 'ADMIN' && (
  <Link to="/settings" className="text-sm text-gray-700">Settings</Link>
)}
```

- [ ] **Step 4: Verify build**

Run: `pnpm --filter web build`

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/pages/Contacts.tsx apps/web/src/components/Pagination.tsx apps/web/src/App.tsx apps/web/src/components/Layout.tsx
git commit -m "feat(web): add contacts list page with filters and pagination"
```

---

## Task 12: Frontend — Add/Edit Contact Form

**Files:**
- Create: `apps/web/src/pages/ContactForm.tsx`
- Modify: `apps/web/src/App.tsx` (add `/contacts/new` and `/contacts/:id` routes)

- [ ] **Step 1: Create `apps/web/src/pages/ContactForm.tsx`**

```tsx
import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createContact,
  deleteContact,
  getContact,
  updateContact,
  type CreateContactInput,
  type Ethnicity,
  type Gender,
  type LanguagePreference,
  type Occupation,
  type OptInStatus,
  type Religion,
} from '../api/contacts';

const ETHNICITY_OPTIONS: Ethnicity[] = ['MALAY', 'CHINESE', 'INDIAN', 'OTHER', 'UNKNOWN'];
const GENDER_OPTIONS: Gender[] = ['MALE', 'FEMALE', 'OTHER', 'UNKNOWN'];
const RELIGION_OPTIONS: Religion[] = ['ISLAM', 'BUDDHISM', 'HINDUISM', 'CHRISTIANITY', 'OTHER', 'UNKNOWN'];
const OCCUPATION_OPTIONS: Occupation[] = ['STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'RETIRED', 'OTHER', 'UNKNOWN'];
const LANGUAGE_OPTIONS: LanguagePreference[] = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];
const OPT_IN_OPTIONS: OptInStatus[] = ['OPTED_IN', 'OPTED_OUT', 'PENDING'];

export default function ContactForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState<CreateContactInput>({
    phone: '',
    gender: 'UNKNOWN',
    ethnicity: 'UNKNOWN',
    religion: 'UNKNOWN',
    occupation: 'UNKNOWN',
    languagePreference: 'EN',
    optInStatus: 'PENDING',
  });
  const [error, setError] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => getContact(id!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        phone: existing.phoneE164,
        name: existing.name ?? undefined,
        dateOfBirth: existing.dateOfBirth ?? undefined,
        gender: existing.gender,
        ethnicity: existing.ethnicity,
        religion: existing.religion,
        occupation: existing.occupation,
        languagePreference: existing.languagePreference,
        city: existing.city ?? undefined,
        state: existing.state ?? undefined,
        optInStatus: existing.optInStatus,
      });
    }
  }, [existing]);

  const create = useMutation({
    mutationFn: createContact,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      navigate('/contacts');
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const update = useMutation({
    mutationFn: (input: CreateContactInput) => updateContact(id!, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      qc.invalidateQueries({ queryKey: ['contact', id] });
      navigate('/contacts');
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const remove = useMutation({
    mutationFn: () => deleteContact(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['contacts'] });
      navigate('/contacts');
    },
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (isEdit) update.mutate(form);
    else create.mutate(form);
  }

  function onDelete() {
    if (window.confirm(`Delete contact ${form.phone}?`)) remove.mutate();
  }

  function setField<K extends keyof CreateContactInput>(k: K, v: CreateContactInput[K]) {
    setForm((prev) => ({ ...prev, [k]: v }));
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">
        {isEdit ? 'Edit Contact' : 'Add Contact'}
      </h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-white p-6 rounded shadow-sm" data-testid="contact-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Phone (E.164 or local Malaysian)">
            <input
              type="text" required value={form.phone}
              onChange={(e) => setField('phone', e.target.value)}
              className="w-full border rounded px-3 py-2"
              disabled={isEdit}
              data-testid="contact-phone"
            />
          </Field>
          <Field label="Name">
            <input
              type="text" value={form.name ?? ''}
              onChange={(e) => setField('name', e.target.value || undefined)}
              className="w-full border rounded px-3 py-2"
              data-testid="contact-name"
            />
          </Field>
          <Field label="Date of birth">
            <input
              type="date" value={form.dateOfBirth ?? ''}
              onChange={(e) => setField('dateOfBirth', e.target.value || undefined)}
              className="w-full border rounded px-3 py-2"
              data-testid="contact-dob"
            />
          </Field>
          <EnumField label="Gender" value={form.gender!} options={GENDER_OPTIONS} onChange={(v) => setField('gender', v)} testId="contact-gender" />
          <EnumField label="Ethnicity" value={form.ethnicity!} options={ETHNICITY_OPTIONS} onChange={(v) => setField('ethnicity', v)} testId="contact-ethnicity" />
          <EnumField label="Religion" value={form.religion!} options={RELIGION_OPTIONS} onChange={(v) => setField('religion', v)} testId="contact-religion" />
          <EnumField label="Occupation" value={form.occupation!} options={OCCUPATION_OPTIONS} onChange={(v) => setField('occupation', v)} testId="contact-occupation" />
          <EnumField label="Language preference" value={form.languagePreference!} options={LANGUAGE_OPTIONS} onChange={(v) => setField('languagePreference', v)} testId="contact-language" />
          <Field label="City">
            <input
              type="text" value={form.city ?? ''}
              onChange={(e) => setField('city', e.target.value || undefined)}
              className="w-full border rounded px-3 py-2"
              data-testid="contact-city"
            />
          </Field>
          <Field label="State">
            <input
              type="text" value={form.state ?? ''}
              onChange={(e) => setField('state', e.target.value || undefined)}
              className="w-full border rounded px-3 py-2"
              data-testid="contact-state"
            />
          </Field>
          <EnumField label="Opt-in status" value={form.optInStatus!} options={OPT_IN_OPTIONS} onChange={(v) => setField('optInStatus', v)} testId="contact-optin" />
        </div>

        {error && <p className="text-sm text-red-600" data-testid="contact-form-error">{error}</p>}

        <div className="flex justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/contacts')}
            className="text-gray-600 px-3 py-1.5"
            data-testid="contact-cancel"
          >
            Cancel
          </button>
          <div className="flex gap-2">
            {isEdit && (
              <button
                type="button"
                onClick={onDelete}
                className="text-red-600 border border-red-300 px-3 py-1.5 rounded"
                data-testid="contact-delete"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium disabled:opacity-50"
              data-testid="contact-submit"
            >
              {isEdit ? 'Save changes' : 'Create contact'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function EnumField<T extends string>({
  label, value, options, onChange, testId,
}: {
  label: string; value: T; options: readonly T[]; onChange: (v: T) => void; testId: string;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="w-full border rounded px-3 py-2"
        data-testid={testId}
      >
        {options.map((o) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </Field>
  );
}

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}
```

- [ ] **Step 2: Add the two routes to `apps/web/src/App.tsx`**

```tsx
import ContactForm from './pages/ContactForm';

// Add these two routes inside <Routes> alongside the others:
<Route
  path="/contacts/new"
  element={
    <ProtectedRoute>
      <Layout><ContactForm /></Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/contacts/:id"
  element={
    <ProtectedRoute>
      <Layout><ContactForm /></Layout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Verify build**

Run: `pnpm --filter web build`

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/ContactForm.tsx apps/web/src/App.tsx
git commit -m "feat(web): add contact create/edit/delete form"
```

---

## Task 13: Frontend — CSV Import UI

**Files:**
- Create: `apps/web/src/pages/ContactsImport.tsx`
- Modify: `apps/web/src/App.tsx` (add `/contacts/import` route)

- [ ] **Step 1: Create `apps/web/src/pages/ContactsImport.tsx`**

```tsx
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { importContactsCsv, type ImportResult } from '../api/contacts';

export default function ContactsImport() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const upload = useMutation({
    mutationFn: importContactsCsv,
    onSuccess: (data) => setResult(data),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (file) upload.mutate(file);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Import contacts from CSV</h1>

      <section className="bg-white p-4 rounded shadow-sm space-y-2 text-sm">
        <p className="font-medium">Expected columns:</p>
        <code className="block bg-gray-50 p-2 rounded text-xs">
          phone, name, dateOfBirth, gender, ethnicity, religion, occupation, languagePreference, city, state
        </code>
        <p className="text-gray-600">
          Only <strong>phone</strong> is required. Phone numbers can be in local format (e.g. <code>0123456789</code>) — they'll be normalized to E.164 (<code>+60123456789</code>).
          Imported contacts are marked OPTED_IN with source = <code>csv:&lt;filename&gt;</code>.
          Duplicate phones are skipped silently.
        </p>
      </section>

      <form onSubmit={onSubmit} className="bg-white p-4 rounded shadow-sm space-y-3" data-testid="import-form">
        <input
          type="file"
          accept=".csv,text/csv"
          required
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block"
          data-testid="csv-file"
        />
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => navigate('/contacts')}
            className="text-gray-600 px-3 py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || upload.isPending}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium disabled:opacity-50"
            data-testid="csv-submit"
          >
            {upload.isPending ? 'Importing…' : 'Import'}
          </button>
        </div>
      </form>

      {result && (
        <section className="bg-white p-4 rounded shadow-sm space-y-3" data-testid="import-result">
          <h2 className="text-lg font-semibold">Import complete</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-green-50 p-3 rounded">
              <div className="text-2xl font-bold text-green-700">{result.imported}</div>
              <div className="text-xs text-gray-600">Imported</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded">
              <div className="text-2xl font-bold text-yellow-700">{result.skipped}</div>
              <div className="text-xs text-gray-600">Skipped (duplicates)</div>
            </div>
            <div className="bg-red-50 p-3 rounded">
              <div className="text-2xl font-bold text-red-700">{result.errors.length}</div>
              <div className="text-xs text-gray-600">Errors</div>
            </div>
          </div>
          {result.errors.length > 0 && (
            <div>
              <div className="font-medium mb-1 text-sm">Errors:</div>
              <ul className="text-xs space-y-1" data-testid="import-errors">
                {result.errors.map((e, i) => (
                  <li key={i} className="text-red-700">Row {e.row}: {e.message}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => navigate('/contacts')}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium"
          >
            Back to contacts
          </button>
        </section>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Add the route to `apps/web/src/App.tsx`**

```tsx
import ContactsImport from './pages/ContactsImport';

// Add this route inside <Routes> alongside the others:
<Route
  path="/contacts/import"
  element={
    <ProtectedRoute>
      <Layout><ContactsImport /></Layout>
    </ProtectedRoute>
  }
/>
```

NOTE: Place this route BEFORE the `/contacts/:id` route — otherwise React Router will match `import` as an id.

- [ ] **Step 3: Verify build**

Run: `pnpm --filter web build`

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/pages/ContactsImport.tsx apps/web/src/App.tsx
git commit -m "feat(web): add CSV import page with per-row error display"
```

---

## Task 14: Frontend — Segments Page (List, Create, Edit, Preview)

**Files:**
- Create: `apps/web/src/api/segments.ts`, `apps/web/src/pages/Segments.tsx`
- Modify: `apps/web/src/App.tsx` (add `/segments` route), `apps/web/src/components/Layout.tsx` (add nav link)

- [ ] **Step 1: Create `apps/web/src/api/segments.ts`**

```typescript
import { api } from './client';
import type { Contact, ContactFilter } from './contacts';

export interface Segment {
  id: string;
  name: string;
  description: string | null;
  filterJson: ContactFilter;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSegmentInput {
  name: string;
  description?: string;
  filter: ContactFilter;
}

export interface SegmentPreview {
  count: number;
  sample: Contact[];
}

export async function listSegments(): Promise<Segment[]> {
  const { data } = await api.get<Segment[]>('/segments');
  return data;
}

export async function getSegment(id: string): Promise<Segment> {
  const { data } = await api.get<Segment>(`/segments/${id}`);
  return data;
}

export async function createSegment(input: CreateSegmentInput): Promise<Segment> {
  const { data } = await api.post<Segment>('/segments', input);
  return data;
}

export async function updateSegment(id: string, input: Partial<CreateSegmentInput>): Promise<Segment> {
  const { data } = await api.patch<Segment>(`/segments/${id}`, input);
  return data;
}

export async function deleteSegment(id: string): Promise<void> {
  await api.delete(`/segments/${id}`);
}

export async function previewSegment(id: string): Promise<SegmentPreview> {
  const { data } = await api.get<SegmentPreview>(`/segments/${id}/preview`);
  return data;
}
```

- [ ] **Step 2: Create `apps/web/src/pages/Segments.tsx`**

```tsx
import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createSegment,
  deleteSegment,
  listSegments,
  previewSegment,
  updateSegment,
  type Segment,
} from '../api/segments';
import type { ContactFilter } from '../api/contacts';
import FilterBuilder from '../components/FilterBuilder';

export default function Segments() {
  const qc = useQueryClient();
  const { data: segments, isLoading } = useQuery({ queryKey: ['segments'], queryFn: listSegments });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<ContactFilter>({});
  const [formError, setFormError] = useState<string | null>(null);

  const create = useMutation({
    mutationFn: createSegment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['segments'] });
      resetForm();
    },
    onError: (e: unknown) => setFormError(extractMessage(e)),
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof updateSegment>[1] }) =>
      updateSegment(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['segments'] });
      resetForm();
    },
    onError: (e: unknown) => setFormError(extractMessage(e)),
  });

  const remove = useMutation({
    mutationFn: deleteSegment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['segments'] }),
  });

  function resetForm() {
    setEditingId(null);
    setName('');
    setDescription('');
    setFilter({});
    setFormError(null);
  }

  function startEdit(s: Segment) {
    setEditingId(s.id);
    setName(s.name);
    setDescription(s.description ?? '');
    setFilter((s.filterJson as ContactFilter) ?? {});
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (editingId) {
      update.mutate({ id: editingId, input: { name, description: description || undefined, filter } });
    } else {
      create.mutate({ name, description: description || undefined, filter });
    }
  }

  function onDelete(s: Segment) {
    if (window.confirm(`Delete segment "${s.name}"?`)) remove.mutate(s.id);
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Segments</h1>
        <p className="text-sm text-gray-600">Saved demographic filters for targeting blasts.</p>
      </section>

      <section className="bg-white p-4 rounded shadow-sm space-y-3">
        <h2 className="text-lg font-semibold">{editingId ? 'Edit segment' : 'Create segment'}</h2>
        <form onSubmit={onSubmit} className="space-y-3" data-testid="segment-form">
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="Segment name (e.g. KL Malays 25-45)"
            className="w-full border rounded px-3 py-2"
            data-testid="segment-name"
          />
          <textarea
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="w-full border rounded px-3 py-2"
            rows={2}
            data-testid="segment-description"
          />
          <FilterBuilder value={filter} onChange={setFilter} />
          {formError && <p className="text-sm text-red-600" data-testid="segment-form-error">{formError}</p>}
          <div className="flex gap-2 justify-end">
            {editingId && (
              <button type="button" onClick={resetForm} className="text-gray-600 px-3 py-1.5">
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={create.isPending || update.isPending}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium disabled:opacity-50"
              data-testid="segment-submit"
            >
              {editingId ? 'Save changes' : 'Create segment'}
            </button>
          </div>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Saved segments</h2>
        {isLoading && <p>Loading…</p>}
        {segments && segments.length === 0 && (
          <p className="text-gray-500">No segments yet. Create one above.</p>
        )}
        {segments && segments.map((s) => (
          <SegmentRow key={s.id} segment={s} onEdit={startEdit} onDelete={onDelete} />
        ))}
      </section>
    </div>
  );
}

function SegmentRow({ segment, onEdit, onDelete }: {
  segment: Segment;
  onEdit: (s: Segment) => void;
  onDelete: (s: Segment) => void;
}) {
  const { data: preview } = useQuery({
    queryKey: ['segment-preview', segment.id],
    queryFn: () => previewSegment(segment.id),
  });

  return (
    <div className="bg-white p-4 rounded shadow-sm flex items-center justify-between" data-testid={`segment-row-${segment.id}`}>
      <div>
        <div className="font-semibold">{segment.name}</div>
        {segment.description && <div className="text-sm text-gray-600 mt-1">{segment.description}</div>}
        <div className="text-xs text-gray-500 mt-1">
          {preview ? `${preview.count} matching contact${preview.count === 1 ? '' : 's'}` : 'Calculating…'}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => onEdit(segment)} className="text-indigo-600">Edit</button>
        <button type="button" onClick={() => onDelete(segment)} className="text-red-600">Delete</button>
      </div>
    </div>
  );
}

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}
```

- [ ] **Step 3: Add the route and nav link**

Edit `apps/web/src/App.tsx`:

```tsx
import Segments from './pages/Segments';

// Add inside <Routes>:
<Route
  path="/segments"
  element={
    <ProtectedRoute>
      <Layout><Segments /></Layout>
    </ProtectedRoute>
  }
/>
```

Edit `apps/web/src/components/Layout.tsx` — add a Segments link after the Contacts link:

```tsx
<Link to="/contacts" className="text-sm text-gray-700">Contacts</Link>
<Link to="/segments" className="text-sm text-gray-700">Segments</Link>
```

- [ ] **Step 4: Verify build**

Run: `pnpm --filter web build`

Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/api/segments.ts apps/web/src/pages/Segments.tsx apps/web/src/App.tsx apps/web/src/components/Layout.tsx
git commit -m "feat(web): add segments page with filter builder and live preview"
```

---

## Task 15: E2E Smoke Test — Contacts + Segments Flow

**Files:**
- Create: `e2e/tests/contacts.spec.ts`

- [ ] **Step 1: Create `e2e/tests/contacts.spec.ts`**

```typescript
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

test.describe('Contacts & Segments smoke', () => {
  test('admin creates a contact, sees it in the list, edits it, deletes it', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Contacts' }).click();
    await expect(page.getByTestId('contacts-table')).toBeVisible();

    // Add a new contact with a unique phone for this test run
    const uniqueSuffix = Date.now().toString().slice(-7);
    const localPhone = `01${uniqueSuffix}`;
    const e164 = `+60${uniqueSuffix}`;

    await page.getByTestId('add-contact').click();
    await page.getByTestId('contact-phone').fill(localPhone);
    await page.getByTestId('contact-name').fill('E2E Test User');
    await page.getByTestId('contact-ethnicity').selectOption('MALAY');
    await page.getByTestId('contact-language').selectOption('MS');
    await page.getByTestId('contact-state').fill('Selangor');
    await page.getByTestId('contact-optin').selectOption('OPTED_IN');
    await page.getByTestId('contact-submit').click();

    // Land back on the list, find the new row
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByText(e164)).toBeVisible();

    // Edit it
    await page.getByText(e164).locator('xpath=ancestor::tr').getByRole('link', { name: 'Edit' }).click();
    await page.getByTestId('contact-name').fill('E2E Renamed');
    await page.getByTestId('contact-submit').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByText('E2E Renamed')).toBeVisible();

    // Delete it
    page.once('dialog', (d) => d.accept());
    await page.getByText('E2E Renamed').locator('xpath=ancestor::tr').getByRole('link', { name: 'Edit' }).click();
    await page.getByTestId('contact-delete').click();
    await expect(page).toHaveURL(/\/contacts$/);
    await expect(page.getByText('E2E Renamed')).toHaveCount(0);
  });

  test('admin filters by ethnicity', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/contacts');
    await page.getByTestId('filter-ethnicity-MALAY').click();
    // Just verify the chip went into the selected state (background color change is visual; presence in DOM is sufficient signal)
    await expect(page.getByTestId('filter-ethnicity-MALAY')).toHaveClass(/bg-indigo-600/);
  });

  test('admin creates a segment and sees the preview count', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Segments' }).click();

    const segmentName = `E2E Segment ${Date.now()}`;
    await page.getByTestId('segment-name').fill(segmentName);
    await page.getByTestId('filter-ethnicity-MALAY').click();
    await page.getByTestId('segment-submit').click();

    // Saved segment row appears with count text
    await expect(page.getByText(segmentName)).toBeVisible();
    const segmentRow = page.getByText(segmentName).locator('xpath=ancestor::*[@data-testid][1]');
    await expect(segmentRow.getByText(/matching contact/)).toBeVisible();

    // Clean up: delete it
    page.once('dialog', (d) => d.accept());
    await segmentRow.getByRole('button', { name: 'Delete' }).click();
    await expect(page.getByText(segmentName)).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run the suite**

Start both servers in background:
```bash
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
nohup pnpm --filter web dev > /tmp/web.log 2>&1 &
WEB_PID=$!
sleep 15

# Run all e2e tests including Phase 1's login.spec.ts
pnpm --filter e2e test

kill $API_PID $WEB_PID 2>/dev/null
```

Expected: all tests pass — 3 from `login.spec.ts` + 3 from `contacts.spec.ts` = 6 tests.

- [ ] **Step 3: Commit**

```bash
git add e2e/tests/contacts.spec.ts
git commit -m "test(e2e): add contacts and segments smoke tests"
```

---

## Task 16: Documentation Sweep

**Files:**
- Modify: `README.md` — add Phase 2 section
- Modify: `apps/api/prisma/seed.ts` — add a few sample contacts so the empty-state UX has data on first run

- [ ] **Step 1: Add Phase 2 to README**

Find the "Phase 1 — what's done" section in `README.md` and add a new "Phase 2 — what's done" section immediately after it:

```markdown
## Phase 2 — what's done

- Contacts table with first-class demographic columns (gender, ethnicity, religion, occupation, language preference, location) + opt-in audit trail
- Contacts CRUD endpoints with pagination, search, demographic filtering
- CSV import endpoint with per-row error reporting and phone normalization to E.164
- Segments: saved filter expressions with live preview (count + sample)
- React pages: `/contacts` (list+filters+pagination), `/contacts/new`, `/contacts/:id` (edit), `/contacts/import`, `/segments`
- E2E smoke tests for contact CRUD and segment creation
```

And in the "Coming in later phases" section, remove the Phase 2 line since it's done.

- [ ] **Step 2: Extend the seed script to add a handful of sample contacts (idempotent)**

Replace the `main()` function in `apps/api/prisma/seed.ts` with this expanded version. Keep the imports at the top of the file:

```typescript
async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe123!';

  let admin = await prisma.user.findUnique({ where: { email } });
  if (admin) {
    console.log(`Admin user ${email} already exists — skipping`);
  } else {
    const passwordHash = await bcrypt.hash(password, 12);
    admin = await prisma.user.create({
      data: { email, passwordHash, name: 'Initial Admin', role: 'ADMIN' },
    });
    console.log('=========================================');
    console.log('Seeded initial admin user:');
    console.log(`  Email:    ${email}`);
    console.log(`  Password: ${password}`);
    console.log('Change the password after first login.');
    console.log('=========================================');
  }

  const sampleContacts = [
    { phone: '+60123456789', name: 'Ahmad Bin Razak', ethnicity: 'MALAY' as const, religion: 'ISLAM' as const, languagePreference: 'MS' as const, state: 'Selangor', dateOfBirth: new Date('1985-03-15') },
    { phone: '+60198765432', name: 'Tan Wei Ming', ethnicity: 'CHINESE' as const, religion: 'BUDDHISM' as const, languagePreference: 'EN' as const, state: 'KL', dateOfBirth: new Date('1990-07-22') },
    { phone: '+60145678901', name: 'Priya Devi', ethnicity: 'INDIAN' as const, religion: 'HINDUISM' as const, languagePreference: 'TA' as const, state: 'Penang', dateOfBirth: new Date('1992-11-30') },
    { phone: '+60167891234', name: 'Lim Mei Hua', ethnicity: 'CHINESE' as const, religion: 'BUDDHISM' as const, languagePreference: 'ZH' as const, state: 'Johor', dateOfBirth: new Date('1988-01-08') },
  ];

  let createdSample = 0;
  for (const c of sampleContacts) {
    const existing = await prisma.contact.findUnique({ where: { phoneE164: c.phone } });
    if (existing) continue;
    await prisma.contact.create({
      data: {
        phoneE164: c.phone,
        name: c.name,
        ethnicity: c.ethnicity,
        religion: c.religion,
        languagePreference: c.languagePreference,
        state: c.state,
        dateOfBirth: c.dateOfBirth,
        optInStatus: 'OPTED_IN',
        optInSource: 'seed',
        optInAt: new Date(),
      },
    });
    createdSample++;
  }
  if (createdSample > 0) console.log(`Seeded ${createdSample} sample contact(s).`);
  else console.log('Sample contacts already exist — skipping.');
}
```

- [ ] **Step 3: Run the seed to confirm it works on a populated DB**

```bash
pnpm --filter api db:seed
```

Expected: admin "already exists" + either "Seeded N sample contacts" (first run) or "Sample contacts already exist" (subsequent runs).

- [ ] **Step 4: Commit**

```bash
git add README.md apps/api/prisma/seed.ts
git commit -m "docs: add Phase 2 README section and seed sample contacts"
```

---

## Final Verification

- [ ] **Step 1: Clean restart from scratch**

```bash
docker compose down -v
docker compose up -d
sleep 8
pnpm install
pnpm db:migrate
pnpm db:seed
```

Expected: no errors. Migrations apply cleanly (Phase 1 init + Phase 2 contacts_segments). Seed creates admin + 4 sample contacts.

- [ ] **Step 2: Run all unit tests**

```bash
pnpm --filter api test
```

Expected: ~25-27 tests pass across all suites (Phase 1's 9 + Phase 2's ~16-18: phone util 7, filter-to-where 8, contacts.controller 6, csv-import.service 6, segments.controller 6).

- [ ] **Step 3: Run E2E tests**

```bash
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
nohup pnpm --filter web dev > /tmp/web.log 2>&1 &
WEB_PID=$!
sleep 15
pnpm --filter e2e test
kill $API_PID $WEB_PID 2>/dev/null
```

Expected: 6 tests pass (3 Phase 1 + 3 Phase 2).

- [ ] **Step 4: Manual smoke test**

Start API + web. Log in as admin. Click Contacts: see the 4 seeded contacts. Filter by ethnicity = MALAY → see only Ahmad. Clear filter, add a new contact, see it appear. Click Edit on it, change the name, save. Delete it. Click Import CSV, upload a small test file. Click Segments, create "All Malays" with ethnicity=MALAY → see preview count = 1 (Ahmad). Edit the segment to add Chinese ethnicity → preview count updates to 3.

- [ ] **Step 5: Tag the milestone**

```bash
git tag -a phase-2-complete -m "Phase 2 complete: contacts and segments with CSV import"
```

- [ ] **Step 6: Push to origin**

```bash
git push -u origin feat/phase-2-contacts-segments
git push origin phase-2-complete
```

Then open a PR on GitHub from `feat/phase-2-contacts-segments` into `master`.

---

## What this plan does NOT do (intentionally — comes later)

- Template management — Phase 3
- Blast engine + Meta API integration — Phase 4
- Reply tracking + analytics dashboard — Phase 5
- Polish (refresh-token endpoint, rate limiting, logout endpoint, the tech debt items from Phase 1 reviews) — Phase 6
- Self-deletion guard on users — still deferred to Phase 6
- Pagination cursor-based — offset-based is fine at 1K-10K contacts scale
- Bulk-edit / bulk-delete of contacts — not yet needed
- Contact import dry-run / preview before commit — current CSV import imports immediately; a "validate only" mode is a Phase 3+ enhancement if marketers request it
- Segment OR-of-AND combinations (e.g., `(MALAY AND state=Selangor) OR (CHINESE AND state=KL)`) — current model is AND-only across dimensions. Sufficient for Phase 2 segment needs per spec.
