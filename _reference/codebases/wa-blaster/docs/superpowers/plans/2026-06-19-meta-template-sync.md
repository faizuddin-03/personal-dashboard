# Meta Template Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the Templates module pull every message template from the WhatsApp Business Account into the app — importing Meta-only templates fully (usable in blasts) and overwriting status/category/content for templates the app already knows about, so Meta category reclassification (UTILITY↔MARKETING) is reflected.

**Architecture:** Add a paginated `listMessageTemplates()` read to `WhatsappCloudApiService`; add pure Meta→local mapping helpers in a new `meta-template-mapping.ts`; add `TemplatesService.syncFromMeta(actorUserId)` that lists → maps → matches → upserts inside a transaction; repoint the existing `POST /templates/sync` endpoint and the web Sync button at it. The hourly cron and webhook handler are unchanged.

**Tech Stack:** NestJS 10, Prisma/Postgres, axios, Jest, `nock` (HTTP mocking), React 18 + React Query (web).

## Global Constraints

- pnpm 9 workspace. Run API tests with `pnpm --filter api test -- <pattern>` (the arg after `--` is a path/filename regex). Typecheck the web app with `pnpm --filter web build` (there is no web lint).
- Service unit tests instantiate the service directly with a hand-rolled `ConfigService`/Prisma stub and use `nock` for HTTP — do **not** spin up a full Nest `TestingModule` (except the controller spec, which already uses one). Follow `whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts` and `templates/__tests__/templates.service.spec.ts`.
- Nullable Prisma JSON columns must be written as `Prisma.DbNull` (never `null`) — see existing `createDraft`.
- `WHATSAPP_MOCK_MODE` defaults to `'true'`; every new Meta call must return a usable canned value in mock mode.
- Do **not** change `syncPending`, `TemplatesPoller`, or `applyMetaTemplateUpdate` (the webhook handler).
- Meta locale codes: `en`/`ms`/`zh_CN`/`ta`; local enum `LanguagePreference` = `EN`/`MS`/`ZH`/`TA`/`OTHER`.
- Commit message trailer for every commit:
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

### Task 1: Meta list API — `listMessageTemplates()` + mock fixture

**Files:**
- Modify: `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`
- Test: `apps/api/src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts`

**Interfaces:**
- Consumes: existing `this.mockMode`, `this.apiVersion`, `this.http`, `this.authHeader()`, `this.transformError()`, `config.getOrThrow('WHATSAPP_WABA_ID')`, and the existing `MetaComponent` interface.
- Produces:
  - `interface MetaTemplateListItem { id: string; name: string; language: string; status: string; category: string; components: MetaComponent[] }`
  - `listMessageTemplates(): Promise<MetaTemplateListItem[]>`

- [ ] **Step 1: Write the failing tests**

Add this `describe` block at the end of `whatsapp-cloud-api.service.spec.ts`, inside the top-level `describe('WhatsappCloudApiService', …)` (before its closing `});`):

```ts
  describe('listMessageTemplates', () => {
    it('returns a canned fixture in mock mode without hitting network', async () => {
      const service = new WhatsappCloudApiService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));
      const result = await service.listMessageTemplates();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          language: expect.any(String),
          status: expect.any(String),
          category: expect.any(String),
        }),
      );
      expect(Array.isArray(result[0].components)).toBe(true);
    });

    it('GETs the WABA message_templates endpoint and follows pagination', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      const scope = nock('https://graph.facebook.com')
        .get('/v20.0/999000111/message_templates')
        .query((q) => q.limit === '100' && !q.after)
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, {
          data: [{ id: 'a1', name: 'one', language: 'en', status: 'APPROVED', category: 'UTILITY', components: [] }],
          paging: { cursors: { after: 'CUR2' }, next: 'https://graph.facebook.com/more' },
        })
        .get('/v20.0/999000111/message_templates')
        .query((q) => q.after === 'CUR2')
        .reply(200, {
          data: [{ id: 'b2', name: 'two', language: 'ms', status: 'REJECTED', category: 'MARKETING', components: [] }],
          paging: { cursors: { after: 'CUR3' } }, // no `next` → stop
        });

      const result = await service.listMessageTemplates();
      expect(result.map((t) => t.id)).toEqual(['a1', 'b2']);
      expect(scope.isDone()).toBe(true);
    });

    it('throws a helpful error on 4xx from Meta', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      nock('https://graph.facebook.com')
        .get('/v20.0/999000111/message_templates')
        .query(true)
        .reply(400, { error: { message: 'Invalid WABA', code: 100 } });
      await expect(service.listMessageTemplates()).rejects.toThrow(/Invalid WABA/);
    });
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter api test -- whatsapp-cloud-api.service.spec`
Expected: FAIL — `service.listMessageTemplates is not a function`.

- [ ] **Step 3: Implement the interface, fixture, and method**

In `whatsapp-cloud-api.service.ts`, add the interface next to the other exported interfaces (e.g. just after `MetaTemplateResponse`):

```ts
export interface MetaTemplateListItem {
  id: string;
  name: string;
  language: string;   // Meta locale, e.g. "en", "ms", "zh_CN"
  status: string;     // APPROVED | PENDING | REJECTED | PAUSED | DISABLED | ...
  category: string;   // MARKETING | UTILITY | AUTHENTICATION
  components: MetaComponent[];
}
```

Add the mock fixture as a module-level const (after `const BASE_URL = 'https://graph.facebook.com';`):

```ts
const MOCK_TEMPLATE_LIST: MetaTemplateListItem[] = [
  {
    id: 'mock-meta-1',
    name: 'insurance_renewal',
    language: 'en',
    status: 'APPROVED',
    category: 'UTILITY',
    components: [
      { type: 'BODY', text: 'Hi {{1}}, your policy {{2}} expires soon.', example: { body_text: [['Ahmad', 'POL123']] } },
      { type: 'FOOTER', text: 'eAuto' },
    ],
  },
  {
    id: 'mock-meta-2',
    name: 'raya_promo_2026',
    language: 'ms',
    status: 'APPROVED',
    category: 'MARKETING',
    components: [
      { type: 'HEADER', format: 'TEXT', text: 'Promosi Raya' },
      { type: 'BODY', text: 'Salam {{1}}!' },
      { type: 'BUTTONS', buttons: [{ type: 'URL', text: 'Lihat', url: 'https://eauto.my' }] },
    ],
  },
  {
    id: 'mock-meta-3',
    name: 'old_announcement',
    language: 'zh_CN',
    status: 'REJECTED',
    category: 'MARKETING',
    components: [{ type: 'BODY', text: '通知' }],
  },
];
```

Add the method to the class (e.g. just after `getTemplateStatus`):

```ts
  /** List every message template on the WABA (paginated). Mock mode returns a fixture. */
  async listMessageTemplates(): Promise<MetaTemplateListItem[]> {
    if (this.mockMode) {
      return MOCK_TEMPLATE_LIST;
    }
    const wabaId = this.config.getOrThrow<string>('WHATSAPP_WABA_ID');
    const collected: MetaTemplateListItem[] = [];
    let after: string | undefined;
    let pages = 0;
    try {
      do {
        const { data } = await this.http.get(`/${this.apiVersion}/${wabaId}/message_templates`, {
          headers: this.authHeader(),
          params: {
            fields: 'id,name,language,status,category,components',
            limit: 100,
            ...(after ? { after } : {}),
          },
        });
        for (const t of data?.data ?? []) {
          collected.push({
            id: String(t.id),
            name: String(t.name),
            language: String(t.language),
            status: String(t.status),
            category: String(t.category),
            components: Array.isArray(t.components) ? t.components : [],
          });
        }
        // Continue only while Meta reports another page; cap pages as a runaway guard.
        after = data?.paging?.next ? data?.paging?.cursors?.after : undefined;
        pages += 1;
      } while (after && pages < 50);
      return collected;
    } catch (err) {
      throw this.transformError(err);
    }
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter api test -- whatsapp-cloud-api.service.spec`
Expected: PASS (all tests, including the three new ones).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/whatsapp/whatsapp-cloud-api.service.ts apps/api/src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts
git commit -m "feat(whatsapp): add paginated listMessageTemplates + mock fixture

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Pure Meta→local mapping helpers

**Files:**
- Create: `apps/api/src/templates/meta-template-mapping.ts`
- Test: `apps/api/src/templates/__tests__/meta-template-mapping.spec.ts`

**Interfaces:**
- Consumes: `MetaComponent` (type) from `../whatsapp/whatsapp-cloud-api.service`; `TemplateStatus`, `TemplateCategory`, `LanguagePreference` (types) from `@prisma/client`.
- Produces:
  - `fromMetaLocale(locale: string): LanguagePreference`
  - `fromMetaStatus(status: string): TemplateStatus | null`
  - `fromMetaCategory(category: string): TemplateCategory`
  - `interface ParsedMetaContent { bodyText: string; headerJson: { type: 'TEXT'; text: string } | null; footerText: string | null; buttonsJson: Array<{ type: string; text: string; url?: string; phoneNumber?: string }> | null; variables: string[] }`
  - `parseMetaComponents(components: MetaComponent[]): ParsedMetaContent`

- [ ] **Step 1: Write the failing tests**

Create `apps/api/src/templates/__tests__/meta-template-mapping.spec.ts`:

```ts
import {
  fromMetaLocale,
  fromMetaStatus,
  fromMetaCategory,
  parseMetaComponents,
} from '../meta-template-mapping';

describe('fromMetaLocale', () => {
  it('maps known Meta locales to local language codes', () => {
    expect(fromMetaLocale('en')).toBe('EN');
    expect(fromMetaLocale('en_US')).toBe('EN');
    expect(fromMetaLocale('ms')).toBe('MS');
    expect(fromMetaLocale('zh_CN')).toBe('ZH');
    expect(fromMetaLocale('ta')).toBe('TA');
  });
  it('falls back to OTHER for unknown/empty locales', () => {
    expect(fromMetaLocale('fr')).toBe('OTHER');
    expect(fromMetaLocale('')).toBe('OTHER');
  });
});

describe('fromMetaStatus', () => {
  it('maps Meta statuses to the local enum', () => {
    expect(fromMetaStatus('APPROVED')).toBe('APPROVED');
    expect(fromMetaStatus('PENDING')).toBe('PENDING');
    expect(fromMetaStatus('IN_APPEAL')).toBe('PENDING');
    expect(fromMetaStatus('REJECTED')).toBe('REJECTED');
    expect(fromMetaStatus('PAUSED')).toBe('DISABLED');
    expect(fromMetaStatus('DISABLED')).toBe('DISABLED');
  });
  it('returns null for an unknown status', () => {
    expect(fromMetaStatus('SOMETHING_NEW')).toBeNull();
  });
});

describe('fromMetaCategory', () => {
  it('passes through known categories and defaults unknown to UTILITY', () => {
    expect(fromMetaCategory('MARKETING')).toBe('MARKETING');
    expect(fromMetaCategory('UTILITY')).toBe('UTILITY');
    expect(fromMetaCategory('AUTHENTICATION')).toBe('AUTHENTICATION');
    expect(fromMetaCategory('OTP')).toBe('UTILITY');
  });
});

describe('parseMetaComponents', () => {
  it('extracts body, text header, footer, buttons and example variables', () => {
    const parsed = parseMetaComponents([
      { type: 'HEADER', format: 'TEXT', text: 'Promo' },
      { type: 'BODY', text: 'Hi {{1}}, code {{2}}', example: { body_text: [['Ahmad', '1234']] } },
      { type: 'FOOTER', text: 'eAuto' },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Open', url: 'https://x' },
          { type: 'PHONE_NUMBER', text: 'Call', phone_number: '+60123' },
        ],
      },
    ] as any);
    expect(parsed.bodyText).toBe('Hi {{1}}, code {{2}}');
    expect(parsed.headerJson).toEqual({ type: 'TEXT', text: 'Promo' });
    expect(parsed.footerText).toBe('eAuto');
    expect(parsed.variables).toEqual(['Ahmad', '1234']);
    expect(parsed.buttonsJson).toEqual([
      { type: 'URL', text: 'Open', url: 'https://x' },
      { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+60123' },
    ]);
  });

  it('drops non-text headers and sizes variables to placeholder count when no example is given', () => {
    const parsed = parseMetaComponents([
      { type: 'HEADER', format: 'IMAGE' },
      { type: 'BODY', text: 'Hi {{1}} and {{2}}' },
    ] as any);
    expect(parsed.headerJson).toBeNull();
    expect(parsed.footerText).toBeNull();
    expect(parsed.buttonsJson).toBeNull();
    expect(parsed.variables).toEqual(['', '']);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter api test -- meta-template-mapping.spec`
Expected: FAIL — cannot find module `../meta-template-mapping`.

- [ ] **Step 3: Implement the mapping module**

Create `apps/api/src/templates/meta-template-mapping.ts`:

```ts
import { TemplateStatus, TemplateCategory, LanguagePreference } from '@prisma/client';
import type { MetaComponent } from '../whatsapp/whatsapp-cloud-api.service';

const LOCALE_TO_LANG: Record<string, LanguagePreference> = {
  en: 'EN', en_us: 'EN', en_gb: 'EN',
  ms: 'MS',
  zh: 'ZH', zh_cn: 'ZH', zh_hk: 'ZH', zh_tw: 'ZH',
  ta: 'TA',
};

/** Reverse of templates.service `toMetaLocale`. Unknown/empty → OTHER. */
export function fromMetaLocale(locale: string): LanguagePreference {
  return LOCALE_TO_LANG[String(locale ?? '').trim().toLowerCase()] ?? 'OTHER';
}

const STATUS_MAP: Record<string, TemplateStatus> = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  IN_APPEAL: 'PENDING',
  REJECTED: 'REJECTED',
  PAUSED: 'DISABLED',
  DISABLED: 'DISABLED',
  FLAGGED: 'DISABLED',
  LIMIT_EXCEEDED: 'DISABLED',
  PENDING_DELETION: 'DISABLED',
  DELETED: 'DISABLED',
};

/** Map a Meta status to the local enum; null means "unknown → skip this template". */
export function fromMetaStatus(status: string): TemplateStatus | null {
  return STATUS_MAP[String(status ?? '').trim().toUpperCase()] ?? null;
}

const CATEGORIES: TemplateCategory[] = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

/** Pass through a known Meta category; default unknown to UTILITY (matches coerceCategory). */
export function fromMetaCategory(category: string): TemplateCategory {
  const up = String(category ?? '').trim().toUpperCase() as TemplateCategory;
  return CATEGORIES.includes(up) ? up : 'UTILITY';
}

export interface ParsedMetaContent {
  bodyText: string;
  headerJson: { type: 'TEXT'; text: string } | null;
  footerText: string | null;
  buttonsJson: Array<{ type: string; text: string; url?: string; phoneNumber?: string }> | null;
  variables: string[];
}

/** Count distinct {{n}} placeholders in a body string. */
function countPlaceholders(body: string): number {
  const nums = new Set<string>();
  for (const m of body.matchAll(/\{\{(\d+)\}\}/g)) nums.add(m[1]);
  return nums.size;
}

/**
 * Convert Meta's components[] back into our column shape.
 * Variable NAMES cannot be recovered from Meta (it stores only positional example
 * values), so `variables` is the example body_text row when present, otherwise an
 * array of empty strings sized to the placeholder count.
 */
export function parseMetaComponents(components: MetaComponent[]): ParsedMetaContent {
  let bodyText = '';
  let headerJson: ParsedMetaContent['headerJson'] = null;
  let footerText: string | null = null;
  let buttonsJson: ParsedMetaContent['buttonsJson'] = null;
  let variables: string[] = [];

  for (const c of components ?? []) {
    switch (c.type) {
      case 'BODY':
        bodyText = c.text ?? '';
        if (Array.isArray(c.example?.body_text) && Array.isArray(c.example?.body_text?.[0])) {
          variables = c.example!.body_text![0].map((v) => String(v));
        }
        break;
      case 'HEADER':
        if (c.format === 'TEXT' && c.text) headerJson = { type: 'TEXT', text: c.text };
        break;
      case 'FOOTER':
        footerText = c.text ?? null;
        break;
      case 'BUTTONS':
        if (c.buttons?.length) {
          buttonsJson = c.buttons.map((b) => ({
            type: b.type,
            text: b.text,
            ...(b.url ? { url: b.url } : {}),
            ...(b.phone_number ? { phoneNumber: b.phone_number } : {}),
          }));
        }
        break;
    }
  }

  if (variables.length === 0) {
    const count = countPlaceholders(bodyText);
    if (count > 0) variables = Array.from({ length: count }, () => '');
  }
  return { bodyText, headerJson, footerText, buttonsJson, variables };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter api test -- meta-template-mapping.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/templates/meta-template-mapping.ts apps/api/src/templates/__tests__/meta-template-mapping.spec.ts
git commit -m "feat(templates): pure Meta->local template mapping helpers

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: `syncFromMeta()` on `TemplatesService`

**Files:**
- Modify: `apps/api/src/templates/templates.service.ts`
- Test: `apps/api/src/templates/__tests__/templates.service.spec.ts`

**Interfaces:**
- Consumes: `this.whatsapp.listMessageTemplates()` (Task 1); `fromMetaLocale`/`fromMetaStatus`/`fromMetaCategory`/`parseMetaComponents` (Task 2); `this.prisma.template.{findMany,update,create}`, `this.prisma.$transaction`, `Prisma.DbNull`/`Prisma.InputJsonValue`, `this.logger`.
- Produces:
  - `interface SyncFromMetaResult { checked: number; imported: number; updated: number; categoryChanged: number; skipped: number }`
  - `syncFromMeta(actorUserId: string): Promise<SyncFromMetaResult>`

- [ ] **Step 1: Write the failing tests**

Append this `describe` block to `templates.service.spec.ts`:

```ts
describe('TemplatesService.syncFromMeta', () => {
  let prisma: any; let whatsapp: any; let service: TemplatesService;
  beforeEach(() => {
    prisma = {
      template: {
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn((a: any) => Promise.resolve(a)),
        create: jest.fn((a: any) => Promise.resolve(a)),
      },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    whatsapp = { listMessageTemplates: jest.fn().mockResolvedValue([]) };
    service = new TemplatesService(prisma, whatsapp, {} as any);
  });

  const metaItem = (over: any = {}) => ({
    id: 'm1',
    name: 'insurance_renewal',
    language: 'en',
    status: 'APPROVED',
    category: 'UTILITY',
    components: [{ type: 'BODY', text: 'Hi {{1}}', example: { body_text: [['Ahmad']] } }],
    ...over,
  });

  it('imports a Meta-only template as a new row at version 1, attributed to the actor', async () => {
    whatsapp.listMessageTemplates.mockResolvedValue([metaItem()]);
    const res = await service.syncFromMeta('admin-1');
    expect(prisma.template.create).toHaveBeenCalledTimes(1);
    const data = prisma.template.create.mock.calls[0][0].data;
    expect(data).toEqual(expect.objectContaining({
      name: 'insurance_renewal', version: 1, language: 'EN', category: 'UTILITY',
      bodyText: 'Hi {{1}}', status: 'APPROVED', metaTemplateId: 'm1', createdById: 'admin-1',
    }));
    expect(data.variables).toEqual(['Ahmad']);
    expect(data.approvedAt).toBeInstanceOf(Date);
    expect(res).toEqual({ checked: 1, imported: 1, updated: 0, categoryChanged: 0, skipped: 0 });
  });

  it('matches by metaTemplateId and overwrites status + category + content, counting category drift', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', name: 'insurance_renewal', version: 1, language: 'EN', status: 'PENDING', category: 'UTILITY', metaTemplateId: 'm1', approvedAt: null },
    ]);
    whatsapp.listMessageTemplates.mockResolvedValue([metaItem({ category: 'MARKETING' })]);
    const res = await service.syncFromMeta('admin-1');
    expect(prisma.template.create).not.toHaveBeenCalled();
    const data = prisma.template.update.mock.calls[0][0].data;
    expect(data.category).toBe('MARKETING');
    expect(data.status).toBe('APPROVED');
    expect(res).toEqual({ checked: 1, imported: 0, updated: 1, categoryChanged: 1, skipped: 0 });
  });

  it('falls back to (name, language) for a submitted row missing metaTemplateId and backfills it', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', name: 'insurance_renewal', version: 1, language: 'EN', status: 'APPROVED', category: 'UTILITY', metaTemplateId: null, approvedAt: new Date() },
    ]);
    whatsapp.listMessageTemplates.mockResolvedValue([metaItem({ id: 'm-new' })]);
    await service.syncFromMeta('admin-1');
    expect(prisma.template.update).toHaveBeenCalledTimes(1);
    expect(prisma.template.update.mock.calls[0][0].data.metaTemplateId).toBe('m-new');
  });

  it('leaves a pristine never-submitted DRAFT untouched and imports the Meta row above it', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 'd1', name: 'insurance_renewal', version: 1, language: 'EN', status: 'DRAFT', category: 'UTILITY', metaTemplateId: null, approvedAt: null },
    ]);
    whatsapp.listMessageTemplates.mockResolvedValue([metaItem()]);
    const res = await service.syncFromMeta('admin-1');
    expect(prisma.template.update).not.toHaveBeenCalled();
    expect(prisma.template.create).toHaveBeenCalledTimes(1);
    expect(prisma.template.create.mock.calls[0][0].data.version).toBe(2);
    expect(res.imported).toBe(1);
  });

  it('skips templates whose Meta status is unknown', async () => {
    whatsapp.listMessageTemplates.mockResolvedValue([metaItem({ status: 'WEIRD_STATUS' })]);
    const res = await service.syncFromMeta('admin-1');
    expect(prisma.template.create).not.toHaveBeenCalled();
    expect(prisma.template.update).not.toHaveBeenCalled();
    expect(res).toEqual({ checked: 1, imported: 0, updated: 0, categoryChanged: 0, skipped: 1 });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter api test -- templates.service.spec`
Expected: FAIL — `service.syncFromMeta is not a function`.

- [ ] **Step 3: Implement `syncFromMeta` + result type**

In `templates.service.ts`, add the mapping import near the other local imports:

```ts
import { fromMetaLocale, fromMetaStatus, fromMetaCategory, parseMetaComponents } from './meta-template-mapping';
```

Add the result interface above the `@Injectable()` class:

```ts
export interface SyncFromMetaResult {
  checked: number;
  imported: number;
  updated: number;
  categoryChanged: number;
  skipped: number;
}
```

Add this method to the `TemplatesService` class (e.g. just after `syncPending`):

```ts
  /**
   * Pull EVERY template from the WABA into the app. Imports Meta-only templates
   * fully (usable in blasts) and overwrites status + category + content for rows
   * the app already has. Pristine never-submitted DRAFTs are left untouched.
   * Triggered by the manual Sync button; the hourly cron stays pending-only.
   */
  async syncFromMeta(actorUserId: string): Promise<SyncFromMetaResult> {
    const items = await this.whatsapp.listMessageTemplates();
    const locals = await this.prisma.template.findMany();

    type LocalRow = (typeof locals)[number];
    const byMetaId = new Map<string, LocalRow>();
    const submittedByNameLang = new Map<string, LocalRow>();
    const submittedVersionByName = new Map<string, number>();
    const maxVersionByName = new Map<string, number>();

    for (const row of locals) {
      if (row.metaTemplateId) byMetaId.set(row.metaTemplateId, row);
      maxVersionByName.set(row.name, Math.max(maxVersionByName.get(row.name) ?? 0, row.version));
      const submitted = row.metaTemplateId != null || row.status !== 'DRAFT';
      if (submitted) {
        submittedVersionByName.set(row.name, Math.max(submittedVersionByName.get(row.name) ?? 0, row.version));
        const key = `${row.name}::${row.language}`;
        const prev = submittedByNameLang.get(key);
        if (!prev || row.version > prev.version) submittedByNameLang.set(key, row);
      }
    }

    let imported = 0;
    let updated = 0;
    let categoryChanged = 0;
    let skipped = 0;
    const plannedInsertKeys = new Set<string>();
    const ops: Prisma.PrismaPromise<unknown>[] = [];

    for (const item of items) {
      const status = fromMetaStatus(item.status);
      if (!status) {
        skipped++;
        this.logger.warn(`Skipping ${item.name}/${item.language}: unknown Meta status "${item.status}"`);
        continue;
      }
      const language = fromMetaLocale(item.language);
      const category = fromMetaCategory(item.category);
      const content = parseMetaComponents(item.components);
      const headerJson = content.headerJson
        ? (content.headerJson as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull;
      const buttonsJson = content.buttonsJson
        ? (content.buttonsJson as unknown as Prisma.InputJsonValue)
        : Prisma.DbNull;

      const match = byMetaId.get(item.id) ?? submittedByNameLang.get(`${item.name}::${language}`);

      if (match) {
        if (match.category !== category) categoryChanged++;
        ops.push(
          this.prisma.template.update({
            where: { id: match.id },
            data: {
              status,
              category,
              bodyText: content.bodyText,
              headerJson,
              footerText: content.footerText,
              buttonsJson,
              variables: content.variables,
              metaTemplateId: item.id,
              approvedAt: status === 'APPROVED' && match.status !== 'APPROVED' ? new Date() : match.approvedAt,
            },
          }),
        );
        updated++;
        continue;
      }

      // No match → insert. Join an existing submitted family for this name if one
      // exists; otherwise sit above any pristine drafts (max+1), else start at 1.
      const version =
        submittedVersionByName.get(item.name) ??
        (maxVersionByName.has(item.name) ? maxVersionByName.get(item.name)! + 1 : 1);
      const insertKey = `${item.name}::${version}::${language}`;
      if (plannedInsertKeys.has(insertKey)) {
        // Two Meta locales collapsed to the same local language this run — keep the first.
        skipped++;
        this.logger.warn(`Skipping duplicate ${item.name}/${language} (Meta locale ${item.language})`);
        continue;
      }
      plannedInsertKeys.add(insertKey);
      ops.push(
        this.prisma.template.create({
          data: {
            name: item.name,
            version,
            language,
            category,
            bodyText: content.bodyText,
            headerJson,
            footerText: content.footerText,
            buttonsJson,
            variables: content.variables,
            status,
            metaTemplateId: item.id,
            submittedAt: status === 'DRAFT' ? null : new Date(),
            approvedAt: status === 'APPROVED' ? new Date() : null,
            createdById: actorUserId,
          },
        }),
      );
      imported++;
    }

    await this.prisma.$transaction(ops);
    return { checked: items.length, imported, updated, categoryChanged, skipped };
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm --filter api test -- templates.service.spec`
Expected: PASS (all blocks, including the five new `syncFromMeta` tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/templates/templates.service.ts apps/api/src/templates/__tests__/templates.service.spec.ts
git commit -m "feat(templates): syncFromMeta — import/reconcile all WABA templates

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Repoint `POST /templates/sync` at the full sync

**Files:**
- Modify: `apps/api/src/templates/templates.controller.ts`
- Test: `apps/api/src/templates/__tests__/templates.controller.spec.ts`

**Interfaces:**
- Consumes: `TemplatesService.syncFromMeta(actorUserId)` (Task 3); `Req`/`Request` (already imported in the controller).
- Produces: `POST /templates/sync` now calls `syncFromMeta(req.user.id)` instead of `syncPending(false)`.

- [ ] **Step 1: Write the failing test**

In `templates.controller.spec.ts`, add `syncFromMeta: jest.fn();` to the `service` type and `syncFromMeta: jest.fn(),` to the `service` object in `beforeEach`. Then add this test:

```ts
  it('POST /templates/sync triggers a full Meta sync as the acting user', async () => {
    service.syncFromMeta.mockResolvedValue({ checked: 3, imported: 1, updated: 2, categoryChanged: 1, skipped: 0 });
    const req = { user: { id: 'u1' } } as any;
    const result = await controller.sync(req);
    expect(service.syncFromMeta).toHaveBeenCalledWith('u1');
    expect(result.imported).toBe(1);
  });
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm --filter api test -- templates.controller.spec`
Expected: FAIL — `controller.sync` is called with a request arg the current signature ignores, and `service.syncFromMeta` is never called (assertion fails).

- [ ] **Step 3: Repoint the endpoint**

In `templates.controller.ts`, replace the existing `sync` handler:

```ts
  @Post('sync')
  sync() {
    return this.templates.syncPending(false);
  }
```

with:

```ts
  @Post('sync')
  sync(@Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.templates.syncFromMeta(userId);
  }
```

(`@Req`, `Request`, and `Post` are already imported.)

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm --filter api test -- templates.controller.spec`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/templates/templates.controller.ts apps/api/src/templates/__tests__/templates.controller.spec.ts
git commit -m "feat(templates): POST /templates/sync runs full Meta sync as acting user

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Web — sync result type + summary toast

**Files:**
- Modify: `apps/web/src/api/templates.ts`
- Modify: `apps/web/src/pages/Templates.tsx`

**Interfaces:**
- Consumes: the JSON shape returned by `POST /templates/sync` (Task 3's `SyncFromMetaResult`).
- Produces: `SyncFromMetaResult` (web type) and an updated `syncTemplates()` return type; the Sync button reports a summary.

> No web unit-test harness exists; verification is a successful typecheck/build.

- [ ] **Step 1: Update the API client type**

In `apps/web/src/api/templates.ts`, replace:

```ts
export async function syncTemplates(): Promise<{ checked: number; updated: number }> {
  const { data } = await api.post<{ checked: number; updated: number }>('/templates/sync');
  return data;
}
```

with:

```ts
export interface SyncFromMetaResult {
  checked: number;
  imported: number;
  updated: number;
  categoryChanged: number;
  skipped: number;
}

export async function syncTemplates(): Promise<SyncFromMetaResult> {
  const { data } = await api.post<SyncFromMetaResult>('/templates/sync');
  return data;
}
```

- [ ] **Step 2: Update the Sync button toast**

In `apps/web/src/pages/Templates.tsx`, replace the `syncMut` `onSuccess` body:

```ts
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      showToast(r.checked === 0
        ? 'No pending templates to sync'
        : `Synced with Meta — checked ${r.checked}, ${r.updated} updated`);
    },
```

with:

```ts
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      showToast(
        r.checked === 0
          ? 'No templates found on Meta to sync'
          : `Synced ${r.checked} from Meta — ${r.imported} imported, ${r.updated} updated` +
              (r.categoryChanged > 0
                ? `, ${r.categoryChanged} category change${r.categoryChanged > 1 ? 's' : ''}`
                : ''),
      );
    },
```

- [ ] **Step 3: Typecheck the web app**

Run: `pnpm --filter web build`
Expected: PASS (no TypeScript errors). The build fails if any `r.imported`/`r.categoryChanged` reference is mistyped.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api/templates.ts apps/web/src/pages/Templates.tsx
git commit -m "feat(web): full Meta sync — report imported/updated/category changes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Full-suite verification

**Files:** none (verification only).

- [ ] **Step 1: Run the whole API test suite**

Run: `pnpm --filter api test`
Expected: PASS — all suites green, including the unchanged `syncPending` / poller / webhook tests (confirms nothing regressed).

- [ ] **Step 2: Typecheck the web app**

Run: `pnpm --filter web build`
Expected: PASS.

- [ ] **Step 3: Lint the API**

Run: `pnpm --filter api lint`
Expected: PASS (no new lint errors in the touched files).

---

## Self-Review

**Spec coverage:**
- §1 Meta list API (paginated + mock) → Task 1. ✓
- §2 Mapping (locale/status/category/components + variables caveat) → Task 2. ✓
- §3 Matching & upsert (metaId → name+language → insert; per-name versioning; draft protection; same-run dedupe) → Task 3. ✓
- §4 Category drift (counted) → Task 3 (`categoryChanged`). ✓
- §5 Trigger & wiring (repoint `POST /templates/sync`; cron untouched) → Task 4 + Global Constraints. ✓
- §6 Result shape + frontend toast → Task 3 (`SyncFromMetaResult`) + Task 5. ✓
- §7 Testing (mapping, matching, list pagination, controller) → Tasks 1–4 + Task 6. ✓
- Non-goals (no webhook/cron change, no deletion, no name recovery) → respected; Global Constraints forbid touching `syncPending`/poller/webhook. ✓

**Placeholder scan:** none — every step has concrete code/commands.

**Type consistency:** `MetaTemplateListItem` (Task 1) is consumed by `listMessageTemplates` (Task 3) and `parseMetaComponents` takes `MetaComponent` (Task 2, the existing interface). `SyncFromMetaResult` fields (`checked/imported/updated/categoryChanged/skipped`) are identical in Task 3 (API), Task 4 (controller test), and Task 5 (web). `fromMetaLocale/fromMetaStatus/fromMetaCategory/parseMetaComponents` names match between Task 2 definition and Task 3 import. ✓
