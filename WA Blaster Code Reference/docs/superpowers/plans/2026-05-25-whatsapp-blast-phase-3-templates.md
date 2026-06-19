# WhatsApp Blast — Phase 3: Templates & Meta Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add WhatsApp message template management — author multi-language templates locally, submit them to Meta's Cloud API for approval, receive status updates via webhook, and track lifecycle (DRAFT → PENDING → APPROVED/REJECTED/DISABLED).

**Architecture:** A new `Template` model where one logical template (a `name`) can have N language rows. Each row goes through Meta's review independently and stores its own `meta_template_id` + status. A dedicated `WhatsappCloudApiService` wraps every Meta REST call; it supports a `WHATSAPP_MOCK_MODE` env flag that returns canned responses (so Phase 3 ships before Meta credentials are obtained). A separate `WebhookController` validates Meta's HMAC-SHA256 signatures and applies status updates from `message_template_status_update` events. An hourly `@nestjs/schedule` cron polls Meta for any template stuck in PENDING > 1 hour as a webhook-loss fallback.

**Tech Stack:** NestJS 10 + `@nestjs/schedule` (new dep for cron) + `axios` (already installed for web; add to api). Pure Node `crypto` for HMAC. Prisma 5 (existing). React 18 + React Query (existing). `nock` (already a Phase 1 devDep) for HTTP mocking in tests.

**Spec reference:** `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md` — sections 2 (scope), 5 (data model `templates`), 6 (template lifecycle), 9 (admin UI), 13 (config & webhook URL).

**Branch:** `feat/phase-3-templates` off the merged `master` (includes Phases 1 + 2).

---

## File Structure

```
apps/api/
  prisma/
    schema.prisma                            # MODIFIED: add Template model + enums
    migrations/<ts>_templates/               # NEW
  src/
    templates/
      templates.module.ts                    # NEW
      templates.controller.ts                # NEW
      templates.service.ts                   # NEW
      templates.poller.ts                    # NEW — hourly cron, fallback for missed webhooks
      dto/
        create-template.dto.ts               # NEW
        list-templates.dto.ts                # NEW
        template-component.dto.ts            # NEW — Body/Header/Footer/Buttons shapes
      __tests__/
        templates.controller.spec.ts         # NEW
        templates.service.spec.ts            # NEW (lightweight — version-assignment logic)
        templates.poller.spec.ts             # NEW
    whatsapp/
      whatsapp.module.ts                     # NEW — exports WhatsappCloudApiService
      whatsapp-cloud-api.service.ts          # NEW — wraps Meta /v20.0 endpoints
      webhook.controller.ts                  # NEW — GET verify + POST event
      webhook-signature.util.ts              # NEW — HMAC-SHA256 verify
      dto/
        meta-template-event.dto.ts           # NEW — typed Meta event payload
      __tests__/
        whatsapp-cloud-api.service.spec.ts   # NEW
        webhook.controller.spec.ts           # NEW
        webhook-signature.util.spec.ts       # NEW
    app.module.ts                            # MODIFIED — register two new modules + ScheduleModule
    main.ts                                  # MODIFIED — raw body capture for webhook signature
  .env.example                               # MODIFIED — add 6 WHATSAPP_* keys

apps/web/
  src/
    api/templates.ts                         # NEW
    pages/
      Templates.tsx                          # NEW — list page
      TemplateForm.tsx                       # NEW — multi-language editor
    components/
      TemplateStatusBadge.tsx                # NEW — colored badge per status
      LanguageTabs.tsx                       # NEW — tab strip used inside TemplateForm
    App.tsx                                  # MODIFIED — add /templates routes
    components/Layout.tsx                    # MODIFIED — add Templates nav link

e2e/
  tests/templates.spec.ts                    # NEW — smoke test
```

**Responsibility per key file:**

- `whatsapp-cloud-api.service.ts` — single point of contact with Meta. Honors `WHATSAPP_MOCK_MODE` env var.
- `webhook-signature.util.ts` — pure function: given raw body bytes + signature header + app secret → boolean. Fully unit-testable.
- `webhook.controller.ts` — receives Meta events, verifies signature, hands off to TemplatesService.
- `templates.service.ts` — owns template CRUD + version assignment + Meta submission orchestration.
- `templates.poller.ts` — `@Cron('0 * * * *')` job that catches missed webhooks.
- `TemplateForm.tsx` — one form, multiple language tabs. Submits all languages in one API call.

---

## Task 1: Branch Setup

- [ ] **Step 1: Update local master and create the Phase 3 branch**

```bash
git checkout master
git pull origin master
git checkout -b feat/phase-3-templates
git status
```

Expected: `On branch feat/phase-3-templates`, clean tree (untracked files OK).

No commit yet.

---

## Task 2: Prisma Schema — Template model + enums + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: new migration directory (auto-generated)

- [ ] **Step 1: Append to `apps/api/prisma/schema.prisma`**

Append AFTER existing models (User, Contact, ContactSegment):

```prisma
enum TemplateCategory {
  MARKETING
  UTILITY
  AUTHENTICATION
}

enum TemplateStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
  DISABLED
}

model Template {
  id              String           @id @default(uuid()) @db.Uuid
  name            String
  version         Int              @default(1)
  language        LanguagePreference
  category        TemplateCategory @default(MARKETING)
  bodyText        String           @map("body_text")
  headerJson      Json?            @map("header_json")
  footerText      String?          @map("footer_text")
  buttonsJson     Json?            @map("buttons_json")
  variables       String[]         @default([])
  metaTemplateId  String?          @map("meta_template_id")
  status          TemplateStatus   @default(DRAFT)
  rejectionReason String?          @map("rejection_reason")
  submittedAt     DateTime?        @map("submitted_at")
  approvedAt      DateTime?        @map("approved_at")
  createdById     String           @map("created_by") @db.Uuid
  createdAt       DateTime         @default(now()) @map("created_at")
  updatedAt       DateTime         @updatedAt @map("updated_at")

  @@unique([name, version, language])
  @@index([name])
  @@index([status])
  @@index([metaTemplateId])
  @@map("templates")
}
```

NOTE: `LanguagePreference` already exists from Phase 2 — we're reusing it.

- [ ] **Step 2: Generate migration**

```bash
pnpm --filter api db:migrate -- --name templates
```

Expected: new directory under `apps/api/prisma/migrations/<ts>_templates/`. Prisma client regenerates with the Template type.

- [ ] **Step 3: Verify schema in Postgres**

```bash
docker exec wbs_postgres psql -U wbs -d wbs -c "\d templates"
```

Expected: 18 columns. Unique index on (name, version, language). Indexes on name, status, meta_template_id.

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(db): add templates table with status and category enums"
```

---

## Task 3: Webhook Signature Utility (TDD)

**Files:**
- Create: `apps/api/src/whatsapp/webhook-signature.util.ts`, `apps/api/src/whatsapp/__tests__/webhook-signature.util.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/whatsapp/__tests__/webhook-signature.util.spec.ts`:

```typescript
import * as crypto from 'crypto';
import { verifyMetaSignature } from '../webhook-signature.util';

const APP_SECRET = 'test-secret-12345';

function signBody(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${hmac}`;
}

describe('verifyMetaSignature', () => {
  it('returns true for a correctly signed body', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const sig = signBody(body.toString('utf8'), APP_SECRET);
    expect(verifyMetaSignature(body, sig, APP_SECRET)).toBe(true);
  });

  it('returns false when the signature does not match', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    expect(verifyMetaSignature(body, 'sha256=deadbeef', APP_SECRET)).toBe(false);
  });

  it('returns false when the signature header is empty', () => {
    const body = Buffer.from('{}');
    expect(verifyMetaSignature(body, '', APP_SECRET)).toBe(false);
  });

  it('returns false when the prefix is missing', () => {
    const body = Buffer.from('{}');
    const hmac = crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');
    expect(verifyMetaSignature(body, hmac, APP_SECRET)).toBe(false); // no "sha256=" prefix
  });

  it('returns false when the secret is wrong', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const sig = signBody(body.toString('utf8'), 'wrong-secret');
    expect(verifyMetaSignature(body, sig, APP_SECRET)).toBe(false);
  });

  it('uses constant-time comparison (timingSafeEqual)', () => {
    // Both signatures wrong but different lengths -> must not throw, must return false
    const body = Buffer.from('{}');
    expect(verifyMetaSignature(body, 'sha256=short', APP_SECRET)).toBe(false);
    expect(verifyMetaSignature(body, 'sha256=' + 'a'.repeat(64), APP_SECRET)).toBe(false);
  });
});
```

- [ ] **Step 2: Implement `apps/api/src/whatsapp/webhook-signature.util.ts`**

```typescript
import * as crypto from 'crypto';

const PREFIX = 'sha256=';

export function verifyMetaSignature(rawBody: Buffer, headerValue: string, appSecret: string): boolean {
  if (!headerValue || !headerValue.startsWith(PREFIX)) return false;

  const provided = headerValue.slice(PREFIX.length);
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  const providedBuf = Buffer.from(provided, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/whatsapp/webhook-signature.util.ts apps/api/src/whatsapp/__tests__/webhook-signature.util.spec.ts
git commit -m "feat(whatsapp): add HMAC-SHA256 webhook signature verification utility"
```

---

## Task 4: WhatsApp Cloud API Service (with Mock Mode)

**Files:**
- Create: `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`, `apps/api/src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts`
- Modify: `apps/api/package.json` — add `axios`
- Modify: `apps/api/.env.example` — add 6 WHATSAPP_* keys

- [ ] **Step 1: Install axios + nock**

```bash
pnpm --filter api add axios
pnpm --filter api add -D nock
```

(`nock` is used in the unit tests to mock the Meta HTTP API without hitting the network.)

- [ ] **Step 2: Update `apps/api/.env.example`** — add these keys at the bottom:

```
# WhatsApp Cloud API (Meta) - leave WHATSAPP_MOCK_MODE=true until you have real credentials
WHATSAPP_MOCK_MODE=true
WHATSAPP_API_VERSION=v20.0
WHATSAPP_WABA_ID=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_APP_SECRET=
WHATSAPP_WEBHOOK_VERIFY_TOKEN=
```

Then also `cp apps/api/.env.example apps/api/.env` IF the local .env doesn't have these keys (or manually add them with `WHATSAPP_MOCK_MODE=true` to the existing .env).

- [ ] **Step 3: Write the failing test**

`apps/api/src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts`:

```typescript
import * as nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { WhatsappCloudApiService } from '../whatsapp-cloud-api.service';

const CONFIG: Record<string, string> = {
  WHATSAPP_MOCK_MODE: 'false',
  WHATSAPP_API_VERSION: 'v20.0',
  WHATSAPP_WABA_ID: '999000111',
  WHATSAPP_ACCESS_TOKEN: 'test-token',
};

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const merged = { ...CONFIG, ...overrides };
  return {
    get: (key: string, fallback?: string) => merged[key] ?? fallback,
    getOrThrow: (key: string) => {
      const v = merged[key];
      if (!v) throw new Error(`missing: ${key}`);
      return v;
    },
  } as unknown as ConfigService;
}

describe('WhatsappCloudApiService', () => {
  afterEach(() => nock.cleanAll());

  describe('mock mode', () => {
    it('returns canned PENDING response without hitting network', async () => {
      const service = new WhatsappCloudApiService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));

      const result = await service.submitTemplate({
        name: 'raya_promo_2026',
        language: 'MS',
        category: 'MARKETING',
        components: [{ type: 'BODY', text: 'Salam {{1}}!' }],
      });

      expect(result.id).toMatch(/^mock-/);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('live mode', () => {
    it('POSTs to /v20.0/{waba}/message_templates with auth header', async () => {
      const service = new WhatsappCloudApiService(makeConfig());

      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/999000111/message_templates', (body) => {
          return body.name === 'raya_promo_2026' && body.language === 'MS';
        })
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { id: '1234567890', status: 'PENDING', category: 'MARKETING' });

      const result = await service.submitTemplate({
        name: 'raya_promo_2026',
        language: 'MS',
        category: 'MARKETING',
        components: [{ type: 'BODY', text: 'Salam {{1}}!' }],
      });

      expect(result.id).toBe('1234567890');
      expect(result.status).toBe('PENDING');
      expect(scope.isDone()).toBe(true);
    });

    it('throws a helpful error on 4xx from Meta', async () => {
      const service = new WhatsappCloudApiService(makeConfig());

      nock('https://graph.facebook.com')
        .post('/v20.0/999000111/message_templates')
        .reply(400, { error: { message: 'Invalid component', code: 100 } });

      await expect(
        service.submitTemplate({
          name: 'bad',
          language: 'EN',
          category: 'MARKETING',
          components: [{ type: 'BODY', text: 'x' }],
        }),
      ).rejects.toThrow(/Invalid component/);
    });

    it('getTemplateStatus fetches by meta id', async () => {
      const service = new WhatsappCloudApiService(makeConfig());

      nock('https://graph.facebook.com')
        .get('/v20.0/1234567890')
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { id: '1234567890', status: 'APPROVED', category: 'MARKETING' });

      const result = await service.getTemplateStatus('1234567890');
      expect(result.status).toBe('APPROVED');
    });
  });
});
```

- [ ] **Step 4: Implement `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

export type MetaTemplateStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';

export interface MetaComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  example?: { body_text?: string[][]; header_text?: string[] };
  buttons?: Array<{
    type: 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface SubmitTemplateInput {
  name: string;
  language: string; // Meta's locale code, e.g. "en", "ms", "zh_CN"
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: MetaComponent[];
}

export interface MetaTemplateResponse {
  id: string;
  status: MetaTemplateStatus;
  category: string;
}

const BASE_URL = 'https://graph.facebook.com';

@Injectable()
export class WhatsappCloudApiService {
  private readonly logger = new Logger(WhatsappCloudApiService.name);
  private readonly mockMode: boolean;
  private readonly apiVersion: string;
  private readonly http: AxiosInstance;

  constructor(private readonly config: ConfigService) {
    this.mockMode = this.config.get<string>('WHATSAPP_MOCK_MODE', 'true') === 'true';
    this.apiVersion = this.config.get<string>('WHATSAPP_API_VERSION', 'v20.0');
    this.http = axios.create({ baseURL: BASE_URL, timeout: 15000 });
  }

  private authHeader() {
    return { Authorization: `Bearer ${this.config.getOrThrow<string>('WHATSAPP_ACCESS_TOKEN')}` };
  }

  async submitTemplate(input: SubmitTemplateInput): Promise<MetaTemplateResponse> {
    if (this.mockMode) {
      return {
        id: `mock-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: 'PENDING',
        category: input.category,
      };
    }

    const wabaId = this.config.getOrThrow<string>('WHATSAPP_WABA_ID');
    try {
      const { data } = await this.http.post(
        `/${this.apiVersion}/${wabaId}/message_templates`,
        input,
        { headers: this.authHeader() },
      );
      return { id: data.id, status: data.status, category: data.category };
    } catch (err) {
      throw this.transformError(err);
    }
  }

  async getTemplateStatus(metaTemplateId: string): Promise<MetaTemplateResponse> {
    if (this.mockMode) {
      return { id: metaTemplateId, status: 'PENDING', category: 'MARKETING' };
    }
    try {
      const { data } = await this.http.get(
        `/${this.apiVersion}/${metaTemplateId}`,
        { headers: this.authHeader() },
      );
      return { id: data.id, status: data.status, category: data.category };
    } catch (err) {
      throw this.transformError(err);
    }
  }

  private transformError(err: unknown): Error {
    const axiosErr = err as AxiosError<{ error?: { message?: string; code?: number } }>;
    const metaMsg = axiosErr.response?.data?.error?.message;
    if (metaMsg) {
      this.logger.warn(`Meta API error: ${metaMsg}`);
      return new Error(metaMsg);
    }
    if (axiosErr.message) return new Error(`Meta API call failed: ${axiosErr.message}`);
    return new Error('Meta API call failed');
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/whatsapp apps/api/package.json apps/api/.env.example pnpm-lock.yaml
git commit -m "feat(whatsapp): add Cloud API service with mock mode + tests"
```

---

## Task 5: Webhook Controller + Module + Wire-up

**Files:**
- Create: `apps/api/src/whatsapp/whatsapp.module.ts`, `apps/api/src/whatsapp/webhook.controller.ts`, `apps/api/src/whatsapp/dto/meta-template-event.dto.ts`, `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts`
- Modify: `apps/api/src/main.ts` — capture raw body for signature verification
- Modify: `apps/api/src/app.module.ts` — register WhatsappModule

NOTE: We register the webhook controller now even though the handler delegates to `TemplatesService.applyMetaTemplateUpdate(...)` which lands in Task 7. We define the method signature here and stub it; Task 7 implements the body. To keep the dispatch independent, this task creates `TemplatesService` with ONLY that method and a stub.

- [ ] **Step 1: Create event payload type**

`apps/api/src/whatsapp/dto/meta-template-event.dto.ts`:

```typescript
export interface MetaWebhookEntry {
  id: string;
  changes: MetaWebhookChange[];
}

export interface MetaWebhookChange {
  field: string; // e.g. "message_template_status_update"
  value: MetaTemplateStatusUpdateValue;
}

export interface MetaTemplateStatusUpdateValue {
  event: 'APPROVED' | 'REJECTED' | 'PENDING_DELETION' | 'FLAGGED' | 'DISABLED';
  message_template_id: string | number;
  message_template_name: string;
  message_template_language: string;
  reason?: string; // populated on REJECTED
}

export interface MetaWebhookPayload {
  object: 'whatsapp_business_account';
  entry: MetaWebhookEntry[];
}
```

- [ ] **Step 2: Create a minimal `TemplatesService` skeleton (just for the webhook handler dependency)**

`apps/api/src/templates/templates.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappCloudApiService } from '../whatsapp/whatsapp-cloud-api.service';
import { MetaTemplateStatusUpdateValue } from '../whatsapp/dto/meta-template-event.dto';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
  ) {}

  /** Apply a Meta `message_template_status_update` event to our templates table. */
  async applyMetaTemplateUpdate(event: MetaTemplateStatusUpdateValue): Promise<void> {
    const metaId = String(event.message_template_id);
    const row = await this.prisma.template.findFirst({ where: { metaTemplateId: metaId } });
    if (!row) {
      this.logger.warn(`Webhook for unknown meta_template_id=${metaId} (name=${event.message_template_name})`);
      return;
    }
    const map: Record<string, 'APPROVED' | 'REJECTED' | 'DISABLED'> = {
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      DISABLED: 'DISABLED',
      FLAGGED: 'DISABLED',
    };
    const newStatus = map[event.event];
    if (!newStatus) {
      this.logger.log(`Ignoring template event=${event.event} for ${metaId}`);
      return;
    }
    await this.prisma.template.update({
      where: { id: row.id },
      data: {
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? (event.reason ?? null) : null,
        approvedAt: newStatus === 'APPROVED' ? new Date() : row.approvedAt,
      },
    });
  }
}
```

(The rest of the service — CRUD, submit, version assignment — lands in Task 7.)

- [ ] **Step 3: Create the webhook controller**

`apps/api/src/whatsapp/webhook.controller.ts`:

```typescript
import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Logger,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { verifyMetaSignature } from './webhook-signature.util';
import { MetaWebhookPayload } from './dto/meta-template-event.dto';
import { TemplatesService } from '../templates/templates.service';

@Controller('webhooks/meta')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly config: ConfigService,
    private readonly templates: TemplatesService,
  ) {}

  /** Meta sends this once when configuring the webhook URL. We echo `hub.challenge`. */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ) {
    const expected = this.config.getOrThrow<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === expected) {
      return challenge;
    }
    throw new ForbiddenException('verification failed');
  }

  @Post()
  async receive(
    @Headers('x-hub-signature-256') signature: string,
    @Body() body: MetaWebhookPayload,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    const appSecret = this.config.getOrThrow<string>('WHATSAPP_APP_SECRET');
    if (!req.rawBody) {
      throw new BadRequestException('raw body unavailable');
    }
    if (!verifyMetaSignature(req.rawBody, signature ?? '', appSecret)) {
      this.logger.warn('Rejected webhook with invalid signature');
      throw new ForbiddenException('invalid signature');
    }

    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === 'message_template_status_update') {
          await this.templates.applyMetaTemplateUpdate(change.value);
        } else {
          this.logger.log(`Ignoring webhook field=${change.field}`);
        }
      }
    }
    return { received: true };
  }
}
```

- [ ] **Step 4: Capture raw body in `apps/api/src/main.ts`**

Read the existing file. Inside `bootstrap()`, BEFORE `app.useGlobalPipes(...)`, add:

```typescript
import * as bodyParser from 'body-parser';
// ...
app.use(
  bodyParser.json({
    verify: (req: any, _res, buf) => {
      // Save raw body so the webhook controller can HMAC-verify it
      req.rawBody = buf;
    },
  }),
);
```

NOTE: `body-parser` ships transitively with `@nestjs/platform-express`. If TS complains about the import, install `@types/body-parser` as a devDep:
```bash
pnpm --filter api add -D @types/body-parser
```

- [ ] **Step 5: Create the WhatsApp module**

`apps/api/src/whatsapp/whatsapp.module.ts`:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappCloudApiService } from './whatsapp-cloud-api.service';
import { WebhookController } from './webhook.controller';
import { TemplatesModule } from '../templates/templates.module';

@Module({
  imports: [ConfigModule, forwardRef(() => TemplatesModule)],
  controllers: [WebhookController],
  providers: [WhatsappCloudApiService],
  exports: [WhatsappCloudApiService],
})
export class WhatsappModule {}
```

- [ ] **Step 6: Create a minimal templates module**

`apps/api/src/templates/templates.module.ts`:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [forwardRef(() => WhatsappModule)],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
```

(Controller comes in Task 8.)

- [ ] **Step 7: Wire into `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { SegmentsModule } from './segments/segments.module';
import { TemplatesModule } from './templates/templates.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    SegmentsModule,
    TemplatesModule,
    WhatsappModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 8: Write webhook controller tests**

`apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts`:

```typescript
import * as crypto from 'crypto';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ForbiddenException, BadRequestException } from '@nestjs/common';
import { WebhookController } from '../webhook.controller';
import { TemplatesService } from '../../templates/templates.service';

const APP_SECRET = 'app-secret';
const VERIFY_TOKEN = 'verify-token';

function makeConfig(): ConfigService {
  const values: Record<string, string> = {
    WHATSAPP_APP_SECRET: APP_SECRET,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: VERIFY_TOKEN,
  };
  return {
    get: (k: string, fallback?: string) => values[k] ?? fallback,
    getOrThrow: (k: string) => {
      const v = values[k];
      if (!v) throw new Error(`missing: ${k}`);
      return v;
    },
  } as unknown as ConfigService;
}

function sign(body: string): string {
  return 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');
}

describe('WebhookController', () => {
  let controller: WebhookController;
  let templates: { applyMetaTemplateUpdate: jest.Mock };

  beforeEach(async () => {
    templates = { applyMetaTemplateUpdate: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: ConfigService, useValue: makeConfig() },
        { provide: TemplatesService, useValue: templates },
      ],
    }).compile();
    controller = module.get(WebhookController);
  });

  describe('GET /webhooks/meta (verification)', () => {
    it('echoes hub.challenge when token matches', () => {
      const result = controller.verify('subscribe', VERIFY_TOKEN, 'challenge-123');
      expect(result).toBe('challenge-123');
    });

    it('throws ForbiddenException when token mismatches', () => {
      expect(() => controller.verify('subscribe', 'wrong', 'x')).toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when mode is not subscribe', () => {
      expect(() => controller.verify('unsubscribe', VERIFY_TOKEN, 'x')).toThrow(ForbiddenException);
    });
  });

  describe('POST /webhooks/meta (event)', () => {
    const buildBody = () => ({
      object: 'whatsapp_business_account' as const,
      entry: [
        {
          id: 'waba-1',
          changes: [
            {
              field: 'message_template_status_update',
              value: {
                event: 'APPROVED' as const,
                message_template_id: '111',
                message_template_name: 'raya',
                message_template_language: 'MS',
              },
            },
          ],
        },
      ],
    });

    it('rejects when raw body is missing', async () => {
      const body = buildBody();
      await expect(
        controller.receive('sha256=foo', body, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects when signature is invalid', async () => {
      const body = buildBody();
      const raw = Buffer.from(JSON.stringify(body));
      await expect(
        controller.receive('sha256=bad', body, { rawBody: raw } as any),
      ).rejects.toThrow(ForbiddenException);
    });

    it('processes valid event and delegates to TemplatesService', async () => {
      const body = buildBody();
      const raw = Buffer.from(JSON.stringify(body));
      const signature = sign(raw.toString('utf8'));

      await controller.receive(signature, body, { rawBody: raw } as any);

      expect(templates.applyMetaTemplateUpdate).toHaveBeenCalledWith(body.entry[0].changes[0].value);
    });

    it('ignores non-template events without error', async () => {
      const body = {
        object: 'whatsapp_business_account' as const,
        entry: [
          {
            id: 'waba-1',
            changes: [{ field: 'messages', value: {} as any }],
          },
        ],
      };
      const raw = Buffer.from(JSON.stringify(body));
      const signature = sign(raw.toString('utf8'));

      const result = await controller.receive(signature, body as any, { rawBody: raw } as any);
      expect(result).toEqual({ received: true });
      expect(templates.applyMetaTemplateUpdate).not.toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/whatsapp apps/api/src/templates apps/api/src/app.module.ts apps/api/src/main.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(whatsapp): add webhook controller with signature verification + module wiring"
```

---

## Task 6: Templates DTOs

**Files:**
- Create: `apps/api/src/templates/dto/template-component.dto.ts`, `apps/api/src/templates/dto/create-template.dto.ts`, `apps/api/src/templates/dto/list-templates.dto.ts`

- [ ] **Step 1: Create `apps/api/src/templates/dto/template-component.dto.ts`**

```typescript
import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';

export type ButtonType = 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';

export class TemplateButtonDto {
  @IsEnum(['URL', 'QUICK_REPLY', 'PHONE_NUMBER'])
  type!: ButtonType;

  @IsString()
  @MinLength(1)
  @MaxLength(25)
  text!: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  url?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  phoneNumber?: string;
}

export class TemplateHeaderDto {
  @IsEnum(['TEXT'])
  type!: 'TEXT';

  @IsString()
  @MinLength(1)
  @MaxLength(60)
  text!: string;
}

export class TemplateLanguageVariantDto {
  @IsEnum(['EN', 'MS', 'ZH', 'TA', 'OTHER'])
  language!: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

  @IsString()
  @MinLength(1)
  @MaxLength(1024)
  bodyText!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => TemplateHeaderDto)
  header?: TemplateHeaderDto;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  footerText?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TemplateButtonDto)
  buttons?: TemplateButtonDto[];
}
```

- [ ] **Step 2: Create `apps/api/src/templates/dto/create-template.dto.ts`**

```typescript
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEnum, IsString, Matches, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { TemplateLanguageVariantDto } from './template-component.dto';

export class CreateTemplateDto {
  // Meta requires lowercase letters, digits, and underscores
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  @Matches(/^[a-z][a-z0-9_]*$/, { message: 'name must be lowercase letters, digits, underscores; start with a letter' })
  name!: string;

  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'])
  category!: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => TemplateLanguageVariantDto)
  variants!: TemplateLanguageVariantDto[];

  @IsArray()
  @IsString({ each: true })
  variables!: string[]; // friendly names for {{1}}, {{2}}, etc.
}
```

- [ ] **Step 3: Create `apps/api/src/templates/dto/list-templates.dto.ts`**

```typescript
import { Transform, Type } from 'class-transformer';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class ListTemplatesDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED'], { each: true })
  status?: ('DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED')[];

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['MARKETING', 'UTILITY', 'AUTHENTICATION'], { each: true })
  category?: ('MARKETING' | 'UTILITY' | 'AUTHENTICATION')[];
}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/templates/dto
git commit -m "feat(templates): add DTOs for create + list with class-validator"
```

---

## Task 7: Templates Service (Full — CRUD + Submit + Version Logic)

**Files:**
- Modify: `apps/api/src/templates/templates.service.ts` (extend the skeleton from Task 5)
- Create: `apps/api/src/templates/__tests__/templates.service.spec.ts`

- [ ] **Step 1: Write the failing test for version assignment**

`apps/api/src/templates/__tests__/templates.service.spec.ts`:

```typescript
import { TemplatesService } from '../templates.service';
import { ConflictException } from '@nestjs/common';

describe('TemplatesService.nextVersionFor', () => {
  let service: TemplatesService;
  let prisma: { template: { findFirst: jest.Mock; findMany: jest.Mock } };

  beforeEach(() => {
    prisma = {
      template: { findFirst: jest.fn(), findMany: jest.fn() },
    };
    service = new TemplatesService(prisma as any, {} as any);
  });

  it('returns 1 for a name with no existing rows', async () => {
    prisma.template.findMany.mockResolvedValue([]);
    expect(await service.nextVersionFor('raya_promo_2026')).toBe(1);
  });

  it('returns max(version)+1 when all existing rows are REJECTED or DISABLED', async () => {
    prisma.template.findMany.mockResolvedValue([
      { version: 1, status: 'REJECTED' },
      { version: 2, status: 'REJECTED' },
    ]);
    expect(await service.nextVersionFor('raya_promo_2026')).toBe(3);
  });

  it('throws ConflictException when an active row exists (DRAFT/PENDING/APPROVED)', async () => {
    prisma.template.findMany.mockResolvedValue([{ version: 1, status: 'APPROVED' }]);
    await expect(service.nextVersionFor('raya_promo_2026')).rejects.toThrow(ConflictException);
  });
});
```

- [ ] **Step 2: Replace `apps/api/src/templates/templates.service.ts` with the full version**

```typescript
import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma, TemplateStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappCloudApiService, MetaComponent } from '../whatsapp/whatsapp-cloud-api.service';
import { MetaTemplateStatusUpdateValue } from '../whatsapp/dto/meta-template-event.dto';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';
import { TemplateLanguageVariantDto } from './dto/template-component.dto';

const ACTIVE_STATUSES: TemplateStatus[] = ['DRAFT', 'PENDING', 'APPROVED'];

// Map our local language code to Meta's locale code
function toMetaLocale(language: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER'): string {
  const map: Record<string, string> = { EN: 'en', MS: 'ms', ZH: 'zh_CN', TA: 'ta', OTHER: 'en' };
  return map[language] ?? 'en';
}

function buildMetaComponents(variant: TemplateLanguageVariantDto): MetaComponent[] {
  const components: MetaComponent[] = [];
  if (variant.header) {
    components.push({ type: 'HEADER', format: 'TEXT', text: variant.header.text });
  }
  components.push({ type: 'BODY', text: variant.bodyText });
  if (variant.footerText) {
    components.push({ type: 'FOOTER', text: variant.footerText });
  }
  if (variant.buttons?.length) {
    components.push({
      type: 'BUTTONS',
      buttons: variant.buttons.map((b) => ({
        type: b.type,
        text: b.text,
        url: b.url,
        phone_number: b.phoneNumber,
      })),
    });
  }
  return components;
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
  ) {}

  /** List the latest version of each named template, optionally filtered. */
  async list(q: ListTemplatesDto) {
    const where: Prisma.TemplateWhereInput = {};
    if (q.status?.length) where.status = { in: q.status };
    if (q.category?.length) where.category = { in: q.category };
    if (q.search) where.name = { contains: q.search, mode: 'insensitive' };

    return this.prisma.template.findMany({
      where,
      orderBy: [{ name: 'asc' }, { version: 'desc' }, { language: 'asc' }],
    });
  }

  async findOne(id: string) {
    const t = await this.prisma.template.findUnique({ where: { id } });
    if (!t) throw new NotFoundException();
    return t;
  }

  /** All rows sharing a logical name (latest version), grouped for the editor view. */
  async findGroup(name: string) {
    const rows = await this.prisma.template.findMany({ where: { name }, orderBy: { version: 'desc' } });
    if (rows.length === 0) throw new NotFoundException();
    const maxVersion = rows[0].version;
    return rows.filter((r) => r.version === maxVersion);
  }

  async nextVersionFor(name: string): Promise<number> {
    const existing = await this.prisma.template.findMany({
      where: { name },
      select: { version: true, status: true },
    });
    if (existing.length === 0) return 1;

    const active = existing.find((r) => ACTIVE_STATUSES.includes(r.status));
    if (active) {
      throw new ConflictException(
        `Template "${name}" has an active version. Delete or wait for it to finish before creating a new one.`,
      );
    }
    return Math.max(...existing.map((r) => r.version)) + 1;
  }

  /** Create draft rows for all variants in one logical template. */
  async createDraft(dto: CreateTemplateDto, actorUserId: string) {
    const version = await this.nextVersionFor(dto.name);

    const created = await this.prisma.$transaction(
      dto.variants.map((variant) =>
        this.prisma.template.create({
          data: {
            name: dto.name,
            version,
            language: variant.language,
            category: dto.category,
            bodyText: variant.bodyText,
            headerJson: variant.header ? (variant.header as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
            footerText: variant.footerText,
            buttonsJson: variant.buttons?.length ? (variant.buttons as unknown as Prisma.InputJsonValue) : Prisma.DbNull,
            variables: dto.variables,
            status: 'DRAFT',
            createdById: actorUserId,
          },
        }),
      ),
    );

    return created;
  }

  /** Submit every DRAFT row in a logical template group to Meta. */
  async submitGroup(name: string, version: number) {
    const drafts = await this.prisma.template.findMany({ where: { name, version, status: 'DRAFT' } });
    if (drafts.length === 0) throw new NotFoundException('No DRAFT variants to submit');

    const results = [];
    for (const draft of drafts) {
      const variant: TemplateLanguageVariantDto = {
        language: draft.language as TemplateLanguageVariantDto['language'],
        bodyText: draft.bodyText,
        header: draft.headerJson as TemplateLanguageVariantDto['header'],
        footerText: draft.footerText ?? undefined,
        buttons: draft.buttonsJson as TemplateLanguageVariantDto['buttons'],
      };

      const submission = await this.whatsapp.submitTemplate({
        name: draft.name,
        language: toMetaLocale(draft.language as 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER'),
        category: draft.category,
        components: buildMetaComponents(variant),
      });

      const updated = await this.prisma.template.update({
        where: { id: draft.id },
        data: {
          status: 'PENDING',
          metaTemplateId: submission.id,
          submittedAt: new Date(),
        },
      });
      results.push(updated);
    }
    return results;
  }

  async remove(id: string) {
    const existing = await this.prisma.template.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException();
    if (existing.status === 'APPROVED' || existing.status === 'PENDING') {
      throw new ConflictException('Cannot delete a PENDING or APPROVED template — it must be disabled via Meta first.');
    }
    await this.prisma.template.delete({ where: { id } });
  }

  /** Webhook handler entry point — unchanged from the Task 5 stub but now lives in the real service. */
  async applyMetaTemplateUpdate(event: MetaTemplateStatusUpdateValue): Promise<void> {
    const metaId = String(event.message_template_id);
    const row = await this.prisma.template.findFirst({ where: { metaTemplateId: metaId } });
    if (!row) {
      this.logger.warn(`Webhook for unknown meta_template_id=${metaId} (name=${event.message_template_name})`);
      return;
    }
    const map: Record<string, TemplateStatus> = {
      APPROVED: 'APPROVED',
      REJECTED: 'REJECTED',
      DISABLED: 'DISABLED',
      FLAGGED: 'DISABLED',
    };
    const newStatus = map[event.event];
    if (!newStatus) {
      this.logger.log(`Ignoring template event=${event.event} for ${metaId}`);
      return;
    }
    await this.prisma.template.update({
      where: { id: row.id },
      data: {
        status: newStatus,
        rejectionReason: newStatus === 'REJECTED' ? (event.reason ?? null) : null,
        approvedAt: newStatus === 'APPROVED' ? new Date() : row.approvedAt,
      },
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/templates/templates.service.ts apps/api/src/templates/__tests__/templates.service.spec.ts
git commit -m "feat(templates): implement CRUD + Meta submission + version assignment"
```

---

## Task 8: Templates Controller + Module Update

**Files:**
- Create: `apps/api/src/templates/templates.controller.ts`, `apps/api/src/templates/__tests__/templates.controller.spec.ts`
- Modify: `apps/api/src/templates/templates.module.ts`

- [ ] **Step 1: Write the failing controller test**

`apps/api/src/templates/__tests__/templates.controller.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { TemplatesController } from '../templates.controller';
import { TemplatesService } from '../templates.service';

describe('TemplatesController', () => {
  let controller: TemplatesController;
  let service: {
    list: jest.Mock;
    findOne: jest.Mock;
    findGroup: jest.Mock;
    createDraft: jest.Mock;
    submitGroup: jest.Mock;
    remove: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      findOne: jest.fn(),
      findGroup: jest.fn(),
      createDraft: jest.fn(),
      submitGroup: jest.fn(),
      remove: jest.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [TemplatesController],
      providers: [{ provide: TemplatesService, useValue: service }],
    }).compile();
    controller = module.get(TemplatesController);
  });

  it('GET /templates lists', async () => {
    service.list.mockResolvedValue([{ id: 't1' }]);
    const result = await controller.list({} as any);
    expect(result).toEqual([{ id: 't1' }]);
  });

  it('GET /templates/group/:name returns latest version group', async () => {
    service.findGroup.mockResolvedValue([{ id: 't1', language: 'EN' }, { id: 't2', language: 'MS' }]);
    const result = await controller.findGroup('raya_promo');
    expect(result).toHaveLength(2);
  });

  it('POST /templates creates draft variants', async () => {
    service.createDraft.mockResolvedValue([{ id: 't1' }]);
    const dto = { name: 'x', category: 'MARKETING', variants: [], variables: [] } as any;
    const req = { user: { id: 'u1' } } as any;
    await controller.create(dto, req);
    expect(service.createDraft).toHaveBeenCalledWith(dto, 'u1');
  });

  it('POST /templates/:name/:version/submit submits to Meta', async () => {
    service.submitGroup.mockResolvedValue([{ id: 't1', status: 'PENDING' }]);
    const result = await controller.submit('raya_promo', '1');
    expect(service.submitGroup).toHaveBeenCalledWith('raya_promo', 1);
    expect(result[0].status).toBe('PENDING');
  });

  it('DELETE /templates/:id removes', async () => {
    service.remove.mockResolvedValue(undefined);
    await controller.remove('t1');
    expect(service.remove).toHaveBeenCalledWith('t1');
  });
});
```

- [ ] **Step 2: Implement `apps/api/src/templates/templates.controller.ts`**

```typescript
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { ListTemplatesDto } from './dto/list-templates.dto';

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(@Query() q: ListTemplatesDto) {
    return this.templates.list(q);
  }

  @Get('group/:name')
  findGroup(@Param('name') name: string) {
    return this.templates.findGroup(name);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.templates.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateTemplateDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.templates.createDraft(dto, userId);
  }

  @Post(':name/:version/submit')
  @HttpCode(202)
  submit(@Param('name') name: string, @Param('version') versionParam: string) {
    return this.templates.submitGroup(name, Number(versionParam));
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string) {
    return this.templates.remove(id);
  }
}
```

- [ ] **Step 3: Update `apps/api/src/templates/templates.module.ts`**

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, forwardRef(() => WhatsappModule)],
  controllers: [TemplatesController],
  providers: [TemplatesService],
  exports: [TemplatesService],
})
export class TemplatesModule {}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/templates
git commit -m "feat(templates): add controller with CRUD + submit-to-Meta endpoints"
```

---

## Task 9: Templates Poller (Hourly Cron)

**Files:**
- Create: `apps/api/src/templates/templates.poller.ts`, `apps/api/src/templates/__tests__/templates.poller.spec.ts`
- Modify: `apps/api/package.json` — add `@nestjs/schedule`
- Modify: `apps/api/src/app.module.ts` — register ScheduleModule
- Modify: `apps/api/src/templates/templates.module.ts` — register the poller

- [ ] **Step 1: Install `@nestjs/schedule`**

```bash
pnpm --filter api add @nestjs/schedule
```

- [ ] **Step 2: Write the failing test**

`apps/api/src/templates/__tests__/templates.poller.spec.ts`:

```typescript
import { TemplatesPoller } from '../templates.poller';

describe('TemplatesPoller', () => {
  let poller: TemplatesPoller;
  let prisma: {
    template: { findMany: jest.Mock; update: jest.Mock };
  };
  let whatsapp: { getTemplateStatus: jest.Mock };

  beforeEach(() => {
    prisma = {
      template: {
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };
    whatsapp = { getTemplateStatus: jest.fn() };
    poller = new TemplatesPoller(prisma as any, whatsapp as any);
  });

  it('does nothing when no PENDING templates exist', async () => {
    prisma.template.findMany.mockResolvedValue([]);
    await poller.pollPending();
    expect(whatsapp.getTemplateStatus).not.toHaveBeenCalled();
  });

  it('updates a template whose Meta status changed to APPROVED', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', metaTemplateId: 'meta-1', status: 'PENDING' },
    ]);
    whatsapp.getTemplateStatus.mockResolvedValue({ id: 'meta-1', status: 'APPROVED', category: 'MARKETING' });

    await poller.pollPending();

    expect(prisma.template.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: expect.objectContaining({ status: 'APPROVED', approvedAt: expect.any(Date) }),
    });
  });

  it('does not update when status is still PENDING', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', metaTemplateId: 'meta-1', status: 'PENDING' },
    ]);
    whatsapp.getTemplateStatus.mockResolvedValue({ id: 'meta-1', status: 'PENDING', category: 'MARKETING' });

    await poller.pollPending();

    expect(prisma.template.update).not.toHaveBeenCalled();
  });

  it('continues processing other rows if one Meta call throws', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', metaTemplateId: 'meta-1', status: 'PENDING' },
      { id: 't2', metaTemplateId: 'meta-2', status: 'PENDING' },
    ]);
    whatsapp.getTemplateStatus
      .mockRejectedValueOnce(new Error('rate limit'))
      .mockResolvedValueOnce({ id: 'meta-2', status: 'APPROVED', category: 'MARKETING' });

    await poller.pollPending();

    expect(prisma.template.update).toHaveBeenCalledTimes(1);
    expect(prisma.template.update).toHaveBeenCalledWith({
      where: { id: 't2' },
      data: expect.objectContaining({ status: 'APPROVED' }),
    });
  });
});
```

- [ ] **Step 3: Implement `apps/api/src/templates/templates.poller.ts`**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TemplateStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappCloudApiService } from '../whatsapp/whatsapp-cloud-api.service';

const STALE_AFTER_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class TemplatesPoller {
  private readonly logger = new Logger(TemplatesPoller.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async pollPending(): Promise<void> {
    const cutoff = new Date(Date.now() - STALE_AFTER_MS);
    const stale = await this.prisma.template.findMany({
      where: {
        status: 'PENDING',
        submittedAt: { lt: cutoff },
        metaTemplateId: { not: null },
      },
    });

    if (stale.length === 0) return;
    this.logger.log(`Polling ${stale.length} stale PENDING template(s)`);

    for (const row of stale) {
      try {
        const remote = await this.whatsapp.getTemplateStatus(row.metaTemplateId!);
        if (remote.status === 'PENDING') continue;

        const map: Record<string, TemplateStatus> = {
          APPROVED: 'APPROVED',
          REJECTED: 'REJECTED',
          DISABLED: 'DISABLED',
        };
        const newStatus = map[remote.status];
        if (!newStatus) continue;

        await this.prisma.template.update({
          where: { id: row.id },
          data: {
            status: newStatus,
            approvedAt: newStatus === 'APPROVED' ? new Date() : row.approvedAt,
          },
        });
        this.logger.log(`Template ${row.name}/${row.language} v${row.version} -> ${newStatus} (via poll)`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        this.logger.warn(`Poll failed for ${row.id} (${row.metaTemplateId}): ${msg}`);
      }
    }
  }
}
```

- [ ] **Step 4: Register ScheduleModule in `apps/api/src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { SegmentsModule } from './segments/segments.module';
import { TemplatesModule } from './templates/templates.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    SegmentsModule,
    TemplatesModule,
    WhatsappModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 5: Register poller in `apps/api/src/templates/templates.module.ts`**

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { TemplatesService } from './templates.service';
import { TemplatesController } from './templates.controller';
import { TemplatesPoller } from './templates.poller';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, forwardRef(() => WhatsappModule)],
  controllers: [TemplatesController],
  providers: [TemplatesService, TemplatesPoller],
  exports: [TemplatesService],
})
export class TemplatesModule {}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/templates apps/api/src/app.module.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(templates): add hourly poller as webhook fallback"
```

---

## Task 10: Frontend Templates API Client

**Files:**
- Create: `apps/web/src/api/templates.ts`

- [ ] **Step 1: Create `apps/web/src/api/templates.ts`**

```typescript
import { api } from './client';
import type { LanguagePreference } from './contacts';

export type TemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type TemplateStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'DISABLED';
export type ButtonType = 'URL' | 'QUICK_REPLY' | 'PHONE_NUMBER';

export interface TemplateHeader {
  type: 'TEXT';
  text: string;
}

export interface TemplateButton {
  type: ButtonType;
  text: string;
  url?: string;
  phoneNumber?: string;
}

export interface TemplateVariant {
  language: LanguagePreference;
  bodyText: string;
  header?: TemplateHeader;
  footerText?: string;
  buttons?: TemplateButton[];
}

export interface Template {
  id: string;
  name: string;
  version: number;
  language: LanguagePreference;
  category: TemplateCategory;
  bodyText: string;
  headerJson: TemplateHeader | null;
  footerText: string | null;
  buttonsJson: TemplateButton[] | null;
  variables: string[];
  metaTemplateId: string | null;
  status: TemplateStatus;
  rejectionReason: string | null;
  submittedAt: string | null;
  approvedAt: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  variants: TemplateVariant[];
  variables: string[];
}

export interface ListTemplatesFilter {
  search?: string;
  status?: TemplateStatus[];
  category?: TemplateCategory[];
}

export async function listTemplates(filter: ListTemplatesFilter): Promise<Template[]> {
  const params: Record<string, unknown> = {};
  if (filter.search) params.search = filter.search;
  if (filter.status?.length) params.status = filter.status;
  if (filter.category?.length) params.category = filter.category;
  const { data } = await api.get<Template[]>('/templates', {
    params,
    paramsSerializer: { indexes: null },
  });
  return data;
}

export async function getTemplateGroup(name: string): Promise<Template[]> {
  const { data } = await api.get<Template[]>(`/templates/group/${encodeURIComponent(name)}`);
  return data;
}

export async function createTemplate(input: CreateTemplateInput): Promise<Template[]> {
  const { data } = await api.post<Template[]>('/templates', input);
  return data;
}

export async function submitTemplate(name: string, version: number): Promise<Template[]> {
  const { data } = await api.post<Template[]>(
    `/templates/${encodeURIComponent(name)}/${version}/submit`,
  );
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await api.delete(`/templates/${id}`);
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/api/templates.ts
git commit -m "feat(web): add templates API client with full type definitions"
```

---

## Task 11: TemplateStatusBadge + Templates List Page

**Files:**
- Create: `apps/web/src/components/TemplateStatusBadge.tsx`, `apps/web/src/pages/Templates.tsx`
- Modify: `apps/web/src/App.tsx` (add `/templates` route), `apps/web/src/components/Layout.tsx` (add nav link)

- [ ] **Step 1: Create `apps/web/src/components/TemplateStatusBadge.tsx`**

```tsx
import type { TemplateStatus } from '../api/templates';

const STYLES: Record<TemplateStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  DISABLED: 'bg-gray-200 text-gray-500',
};

const ICONS: Record<TemplateStatus, string> = {
  DRAFT: '✎',
  PENDING: '⏳',
  APPROVED: '✓',
  REJECTED: '✗',
  DISABLED: '⊘',
};

export default function TemplateStatusBadge({ status }: { status: TemplateStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status]}`}
      data-testid={`status-badge-${status}`}
    >
      <span>{ICONS[status]}</span>
      <span>{status}</span>
    </span>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/pages/Templates.tsx`**

```tsx
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listTemplates, type Template, type TemplateCategory, type TemplateStatus } from '../api/templates';
import TemplateStatusBadge from '../components/TemplateStatusBadge';

const STATUS_OPTIONS: TemplateStatus[] = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'DISABLED'];
const CATEGORY_OPTIONS: TemplateCategory[] = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

interface Group {
  name: string;
  category: TemplateCategory;
  version: number;
  rows: Template[];
}

function groupByName(templates: Template[]): Group[] {
  const map = new Map<string, Group>();
  for (const t of templates) {
    const key = `${t.name}:${t.version}`;
    const existing = map.get(key);
    if (existing) existing.rows.push(t);
    else map.set(key, { name: t.name, category: t.category, version: t.version, rows: [t] });
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function Templates() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<TemplateStatus[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<TemplateCategory[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['templates', search, statusFilter, categoryFilter],
    queryFn: () =>
      listTemplates({
        search: search || undefined,
        status: statusFilter.length ? statusFilter : undefined,
        category: categoryFilter.length ? categoryFilter : undefined,
      }),
  });

  const groups = useMemo(() => (data ? groupByName(data) : []), [data]);

  function toggleStatus(s: TemplateStatus) {
    setStatusFilter((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
  }

  function toggleCategory(c: TemplateCategory) {
    setCategoryFilter((cur) => (cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]));
  }

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
        <Link
          to="/templates/new"
          className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-medium"
          data-testid="add-template"
        >
          + New Template
        </Link>
      </section>

      <section className="bg-white p-4 rounded shadow-sm space-y-3">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2 w-full max-w-md"
          data-testid="templates-search"
        />
        <div className="flex flex-wrap gap-3">
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase mb-1">Status</div>
            <div className="flex flex-wrap gap-1.5">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleStatus(s)}
                  className={
                    statusFilter.includes(s)
                      ? 'px-2.5 py-1 rounded-full text-xs bg-indigo-600 text-white'
                      : 'px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 text-gray-700'
                  }
                  data-testid={`filter-status-${s}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs font-medium text-gray-600 uppercase mb-1">Category</div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleCategory(c)}
                  className={
                    categoryFilter.includes(c)
                      ? 'px-2.5 py-1 rounded-full text-xs bg-indigo-600 text-white'
                      : 'px-2.5 py-1 rounded-full text-xs bg-white border border-gray-300 text-gray-700'
                  }
                  data-testid={`filter-category-${c}`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load templates.</p>}
        {groups.length === 0 && !isLoading && (
          <p className="text-gray-500">No templates yet. Create one above.</p>
        )}
        {groups.map((g) => (
          <Link
            key={`${g.name}:${g.version}`}
            to={`/templates/${encodeURIComponent(g.name)}`}
            className="block bg-white p-4 rounded shadow-sm hover:bg-gray-50"
            data-testid={`template-group-${g.name}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{g.name} <span className="text-xs text-gray-500">v{g.version}</span></div>
                <div className="text-xs text-gray-500 mt-1">
                  {g.category} · {g.rows.length} language{g.rows.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {g.rows.map((r) => (
                  <div key={r.id} className="flex items-center gap-1 text-xs">
                    <span className="text-gray-500">{r.language}</span>
                    <TemplateStatusBadge status={r.status} />
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Modify `apps/web/src/App.tsx`** — add the `/templates` route alongside the others (place near `/contacts`):

```tsx
import Templates from './pages/Templates';

// Add inside <Routes>:
<Route
  path="/templates"
  element={
    <ProtectedRoute>
      <Layout><Templates /></Layout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Modify `apps/web/src/components/Layout.tsx`** — add a Templates link between Segments and Settings:

```tsx
<Link to="/segments" className="text-sm text-gray-700">Segments</Link>
<Link to="/templates" className="text-sm text-gray-700">Templates</Link>
{user?.role === 'ADMIN' && (
  <Link to="/settings" className="text-sm text-gray-700">Settings</Link>
)}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/TemplateStatusBadge.tsx apps/web/src/pages/Templates.tsx apps/web/src/App.tsx apps/web/src/components/Layout.tsx
git commit -m "feat(web): add templates list page with status badges and filters"
```

---

## Task 12: TemplateForm — Multi-language Editor

**Files:**
- Create: `apps/web/src/pages/TemplateForm.tsx`
- Modify: `apps/web/src/App.tsx` — add `/templates/new` and `/templates/:name` routes

- [ ] **Step 1: Create `apps/web/src/pages/TemplateForm.tsx`**

```tsx
import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createTemplate,
  deleteTemplate,
  getTemplateGroup,
  submitTemplate,
  type CreateTemplateInput,
  type LanguagePreference,
  type Template,
  type TemplateCategory,
  type TemplateVariant,
} from '../api/templates';
import TemplateStatusBadge from '../components/TemplateStatusBadge';

const LANGUAGE_OPTIONS: LanguagePreference[] = ['EN', 'MS', 'ZH', 'TA', 'OTHER'];
const CATEGORY_OPTIONS: TemplateCategory[] = ['MARKETING', 'UTILITY', 'AUTHENTICATION'];

function emptyVariant(language: LanguagePreference): TemplateVariant {
  return { language, bodyText: '', footerText: '', buttons: [] };
}

function rowToVariant(row: Template): TemplateVariant {
  return {
    language: row.language,
    bodyText: row.bodyText,
    header: row.headerJson ?? undefined,
    footerText: row.footerText ?? undefined,
    buttons: row.buttonsJson ?? [],
  };
}

export default function TemplateForm() {
  const { name: paramName } = useParams<{ name?: string }>();
  const isEdit = Boolean(paramName);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('MARKETING');
  const [variants, setVariants] = useState<TemplateVariant[]>([emptyVariant('EN')]);
  const [variables, setVariables] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const { data: group } = useQuery({
    queryKey: ['template-group', paramName],
    queryFn: () => getTemplateGroup(paramName!),
    enabled: isEdit,
  });

  useEffect(() => {
    if (group && group.length > 0) {
      setName(group[0].name);
      setCategory(group[0].category);
      setVariants(group.map(rowToVariant));
      setVariables(group[0].variables);
    }
  }, [group]);

  const groupStatus = useMemo(() => {
    if (!group || group.length === 0) return null;
    const statuses = new Set(group.map((r) => r.status));
    if (statuses.size === 1) return Array.from(statuses)[0];
    return null; // mixed
  }, [group]);

  const create = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const submit = useMutation({
    mutationFn: () => submitTemplate(group![0].name, group![0].version),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      qc.invalidateQueries({ queryKey: ['template-group', paramName] });
    },
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteTemplate(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      navigate('/templates');
    },
  });

  function setVariant(idx: number, patch: Partial<TemplateVariant>) {
    setVariants((cur) => cur.map((v, i) => (i === idx ? { ...v, ...patch } : v)));
  }

  function addLanguage(language: LanguagePreference) {
    if (variants.some((v) => v.language === language)) return;
    setVariants((cur) => [...cur, emptyVariant(language)]);
    setActiveTab(variants.length);
  }

  function removeLanguage(idx: number) {
    if (variants.length <= 1) return;
    setVariants((cur) => cur.filter((_, i) => i !== idx));
    setActiveTab(0);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CreateTemplateInput = { name, category, variants, variables };
    create.mutate(input);
  }

  const isAllDraft = group?.every((r) => r.status === 'DRAFT') ?? false;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {isEdit ? `Template: ${name}` : 'New Template'}
        </h1>
        {isEdit && groupStatus && <TemplateStatusBadge status={groupStatus} />}
      </div>

      {group && group[0]?.rejectionReason && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800" data-testid="rejection-reason">
          <strong>Rejection reason:</strong> {group[0].rejectionReason}
        </div>
      )}

      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow-sm space-y-4" data-testid="template-form">
        <Field label="Template name (lowercase, digits, underscores)">
          <input
            type="text"
            required
            pattern="^[a-z][a-z0-9_]*$"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isEdit}
            className="w-full border rounded px-3 py-2 font-mono"
            data-testid="template-name"
          />
        </Field>

        <Field label="Category">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TemplateCategory)}
            disabled={isEdit}
            className="w-full border rounded px-3 py-2"
            data-testid="template-category"
          >
            {CATEGORY_OPTIONS.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </Field>

        <Field label="Variable names (one per {{n}} placeholder, comma-separated)">
          <input
            type="text"
            value={variables.join(', ')}
            onChange={(e) => setVariables(e.target.value.split(',').map((s) => s.trim()).filter(Boolean))}
            placeholder="customer_name, order_id"
            className="w-full border rounded px-3 py-2"
            data-testid="template-variables"
          />
        </Field>

        <section className="space-y-3">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex gap-1" data-testid="language-tabs">
              {variants.map((v, idx) => (
                <button
                  key={v.language}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={
                    activeTab === idx
                      ? 'px-3 py-1.5 rounded-t bg-indigo-600 text-white text-sm font-medium'
                      : 'px-3 py-1.5 rounded-t bg-gray-200 text-gray-700 text-sm'
                  }
                  data-testid={`language-tab-${v.language}`}
                >
                  {v.language}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <select
                className="border rounded px-2 py-1 text-sm"
                value=""
                onChange={(e) => { if (e.target.value) addLanguage(e.target.value as LanguagePreference); }}
                disabled={isEdit}
                data-testid="add-language-select"
              >
                <option value="">+ Add language</option>
                {LANGUAGE_OPTIONS.filter((l) => !variants.some((v) => v.language === l)).map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {variants.length > 1 && !isEdit && (
                <button
                  type="button"
                  onClick={() => removeLanguage(activeTab)}
                  className="text-red-600 text-xs"
                  data-testid="remove-language"
                >
                  Remove current
                </button>
              )}
            </div>
          </div>

          <VariantEditor
            variant={variants[activeTab]}
            disabled={isEdit}
            onChange={(patch) => setVariant(activeTab, patch)}
          />
        </section>

        {error && <p className="text-sm text-red-600" data-testid="template-form-error">{error}</p>}

        {!isEdit && (
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => navigate('/templates')} className="text-gray-600 px-3 py-1.5">
              Cancel
            </button>
            <button
              type="submit"
              disabled={create.isPending}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium disabled:opacity-50"
              data-testid="template-submit-draft"
            >
              {create.isPending ? 'Saving…' : 'Save as draft'}
            </button>
          </div>
        )}
      </form>

      {isEdit && group && (
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => { if (window.confirm('Delete all variants of this template?')) group.forEach((r) => remove.mutate(r.id)); }}
            disabled={!isAllDraft && groupStatus !== 'REJECTED' && groupStatus !== 'DISABLED'}
            className="text-red-600 border border-red-300 px-3 py-1.5 rounded disabled:opacity-40"
            data-testid="template-delete"
          >
            Delete
          </button>
          {isAllDraft && (
            <button
              type="button"
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium disabled:opacity-50"
              data-testid="template-submit-meta"
            >
              {submit.isPending ? 'Submitting…' : 'Submit to Meta'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function VariantEditor({
  variant, disabled, onChange,
}: {
  variant: TemplateVariant;
  disabled: boolean;
  onChange: (patch: Partial<TemplateVariant>) => void;
}) {
  return (
    <div className="space-y-3">
      <Field label="Header text (optional, max 60 chars)">
        <input
          type="text"
          maxLength={60}
          value={variant.header?.text ?? ''}
          onChange={(e) => onChange({ header: e.target.value ? { type: 'TEXT', text: e.target.value } : undefined })}
          disabled={disabled}
          className="w-full border rounded px-3 py-2"
          data-testid="variant-header"
        />
      </Field>
      <Field label="Body text (required, use {{1}}, {{2}} for variables)">
        <textarea
          required
          rows={4}
          value={variant.bodyText}
          onChange={(e) => onChange({ bodyText: e.target.value })}
          disabled={disabled}
          className="w-full border rounded px-3 py-2 font-mono text-sm"
          data-testid="variant-body"
        />
      </Field>
      <Field label="Footer text (optional, max 60 chars)">
        <input
          type="text"
          maxLength={60}
          value={variant.footerText ?? ''}
          onChange={(e) => onChange({ footerText: e.target.value || undefined })}
          disabled={disabled}
          className="w-full border rounded px-3 py-2"
          data-testid="variant-footer"
        />
      </Field>
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

function extractMessage(e: unknown): string {
  const m = (e as { response?: { data?: { message?: string | string[] } } }).response?.data?.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Operation failed';
}
```

- [ ] **Step 2: Add routes in `apps/web/src/App.tsx`**

```tsx
import TemplateForm from './pages/TemplateForm';

// Add inside <Routes>, near the /templates route:
<Route
  path="/templates/new"
  element={
    <ProtectedRoute>
      <Layout><TemplateForm /></Layout>
    </ProtectedRoute>
  }
/>
<Route
  path="/templates/:name"
  element={
    <ProtectedRoute>
      <Layout><TemplateForm /></Layout>
    </ProtectedRoute>
  }
/>
```

**IMPORTANT**: place `/templates/new` BEFORE `/templates/:name` so it doesn't get caught by the dynamic route.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/TemplateForm.tsx apps/web/src/App.tsx
git commit -m "feat(web): add template form with multi-language editor and submit-to-Meta action"
```

---

## Task 13: E2E Smoke Test

**Files:**
- Create: `e2e/tests/templates.spec.ts`

NOTE: This test runs against `WHATSAPP_MOCK_MODE=true` — submission to Meta returns a canned mock-* ID and the template's status moves from DRAFT to PENDING locally. Since there's no real webhook in dev, the PENDING template stays PENDING; that's expected and what the test asserts.

- [ ] **Step 1: Create `e2e/tests/templates.spec.ts`**

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

test.describe('Templates smoke', () => {
  test('admin creates a multi-language draft, submits to Meta (mock), sees PENDING', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();

    const uniqueSuffix = Date.now().toString().slice(-8);
    const templateName = `e2e_promo_${uniqueSuffix}`;

    // Create draft
    await page.getByTestId('add-template').click();
    await page.getByTestId('template-name').fill(templateName);
    await page.getByTestId('template-category').selectOption('MARKETING');
    await page.getByTestId('variant-body').fill('Hello {{1}}!');
    await page.getByTestId('variant-footer').fill('Reply STOP to unsubscribe');
    // Add a second language (MS)
    await page.getByTestId('add-language-select').selectOption('MS');
    await page.getByTestId('language-tab-MS').click();
    await page.getByTestId('variant-body').fill('Salam {{1}}!');

    await page.getByTestId('template-submit-draft').click();
    await expect(page).toHaveURL(/\/templates$/);
    await expect(page.getByTestId(`template-group-${templateName}`)).toBeVisible();

    // Open it
    await page.getByTestId(`template-group-${templateName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();

    // Submit to Meta (mock mode returns PENDING)
    await page.getByTestId('template-submit-meta').click();
    await expect(page.getByTestId('status-badge-PENDING').first()).toBeVisible({ timeout: 5000 });

    // Clean up: deletion of PENDING is blocked by the API, so just leave it for the next run.
    // The next run will create a different name (unique by timestamp) and won't conflict.
  });

  test('template list shows status filter', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();
    await page.getByTestId('filter-status-PENDING').click();
    // Just verify the filter chip is now active (selected styling)
    await expect(page.getByTestId('filter-status-PENDING')).toHaveClass(/bg-indigo-600/);
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add e2e/tests/templates.spec.ts
git commit -m "test(e2e): add templates smoke tests"
```

---

## Task 14: Docs Sweep + Final Verification

**Files:**
- Modify: `README.md` — add Phase 3 section, mention WHATSAPP_MOCK_MODE
- Tag: `phase-3-complete`

- [ ] **Step 1: Update `README.md`**

Find the existing "Phase 2 — what's done" section. Insert a new "Phase 3 — what's done" section after it (before "Coming in later phases"):

```markdown
## Phase 3 — what's done

- Templates table: multi-language, versioned, with status (DRAFT/PENDING/APPROVED/REJECTED/DISABLED)
- Meta Cloud API client (`WhatsappCloudApiService`) with mock mode toggle via `WHATSAPP_MOCK_MODE=true`
- Webhook endpoint at `POST /api/webhooks/meta` with HMAC-SHA256 signature verification
- Webhook GET verification endpoint at `GET /api/webhooks/meta` for Meta's initial setup
- Hourly cron poller (`TemplatesPoller`) as fallback for missed webhooks
- React pages: `/templates` (list with status badges + filters), `/templates/new`, `/templates/:name` (multi-language editor with submit-to-Meta action)
- E2E smoke test for full draft → submit flow (uses mock mode)
```

Also remove "Phase 3: templates" from the "Coming in later phases" line. It should now read:

```markdown
Phase 4: blast engine · Phase 5: analytics + replies · Phase 6: polish.
```

Add a new "WhatsApp Cloud API setup" section after the "Tests" section:

```markdown
## WhatsApp Cloud API setup

This project ships with `WHATSAPP_MOCK_MODE=true` so Phase 3 works without real Meta credentials. To go live:

1. Create a Meta Business Manager account at https://business.facebook.com
2. Add a WhatsApp Business Account (WABA)
3. Register a phone number to the WABA
4. Generate a System User access token with `whatsapp_business_management` and `whatsapp_business_messaging` scopes
5. Get your WABA ID and Phone Number ID from the WhatsApp Business Manager dashboard
6. Generate an app secret in Meta Developer Console
7. Choose any random string for your webhook verify token

Then update `apps/api/.env` (or your hosted env):

```env
WHATSAPP_MOCK_MODE=false
WHATSAPP_API_VERSION=v20.0
WHATSAPP_WABA_ID=<your-waba-id>
WHATSAPP_PHONE_NUMBER_ID=<your-phone-number-id>
WHATSAPP_ACCESS_TOKEN=<your-access-token>
WHATSAPP_APP_SECRET=<your-app-secret>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<any-random-string>
```

For local development you also need a public HTTPS tunnel so Meta can POST webhooks to your machine. Easiest option:
```bash
ngrok http 3000
# then in Meta Developer Console, set webhook URL to:
# https://<your-ngrok-subdomain>.ngrok.io/api/webhooks/meta
```
```

- [ ] **Step 2: Commit the README**

```bash
git add README.md
git commit -m "docs: add Phase 3 README section and WhatsApp Cloud API setup guide"
```

- [ ] **Step 3: Final verification — restart everything from scratch**

```bash
docker compose down
docker compose up -d
sleep 8
pnpm install
pnpm db:migrate
pnpm db:seed
```

Expected: all clean. Phase 3 migration applies on top of Phase 1 + 2.

- [ ] **Step 4: Run all unit tests**

```bash
pnpm --filter api test
```

Expected: ~50-55 tests pass (Phase 1: 9, Phase 2: 33, Phase 3: ~12-14 new: webhook signature 6, whatsapp service 4, webhook controller 6, templates service 3, templates controller 5, templates poller 4).

If any fail, capture and fix.

- [ ] **Step 5: Build the web**

```bash
pnpm --filter web build
```

Expected: clean tsc + vite build.

- [ ] **Step 6: Run E2E tests**

```bash
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
nohup pnpm --filter web dev > /tmp/web.log 2>&1 &
WEB_PID=$!
sleep 15
pnpm --filter e2e test
kill $API_PID $WEB_PID 2>/dev/null
```

Expected: 8 tests pass (3 Phase 1 + 3 Phase 2 + 2 Phase 3).

- [ ] **Step 7: Tag the milestone (only if all green)**

```bash
git tag -a phase-3-complete -m "Phase 3 complete: templates + Meta API integration + webhooks"
```

- [ ] **Step 8: Final state report**

```bash
git log --oneline
git tag --list
git status
```

Report final state: number of commits, tag exists, working tree clean.

---

## What this plan does NOT do (intentionally — comes later)

- Real Meta API integration testing — requires real credentials (separate user activity)
- Template HEADER image/video/document — only TEXT headers supported in Phase 3; media headers add file upload complexity
- Template message preview / variable substitution preview — UI shows the raw template text only
- Webhook event handling for messages, statuses (delivery/read) — Phase 4
- Template analytics (which templates got read most) — Phase 5
- Refresh-token rotation + auth persistence — Phase 6 (still affects E2E tests using `page.goto` for templates routes)
- Self-deletion guard on users — still deferred to Phase 6
- Cursor pagination — offset is fine at this scale
- Template editing workflow for REJECTED templates (clone-into-new-version) — Phase 6 (current model supports it via `nextVersionFor` but no UI to clone yet)
