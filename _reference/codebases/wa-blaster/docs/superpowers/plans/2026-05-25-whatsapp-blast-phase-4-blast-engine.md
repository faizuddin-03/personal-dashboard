# WhatsApp Blast — Phase 4: Blast Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send WhatsApp messages to selected contact segments via Meta's Cloud API — schedule a blast against an approved template + audience, throttle per Meta's tier limits, track per-recipient delivery, and support mid-flight cancellation.

**Architecture:** A new `Blast` row groups a campaign; one `Message` row per recipient tracks individual send/delivery/read/failed status. A BullMQ queue (Redis) holds one job per recipient. A **separate worker process** (`apps/api/src/worker.ts`) consumes jobs at a throttled rate, selects the right template language per contact, renders variables, calls Meta's API (mock-aware), and updates the message row. The existing `WebhookController` is extended to handle `messages` events (status updates from Meta) in addition to template events from Phase 3. The frontend polls a `GET /blasts/:id/stats` endpoint every 5 seconds to show live progress.

**Tech Stack:** BullMQ 5 + ioredis (queue), `@nestjs/bullmq` (Nest wrapper). Existing NestJS 10 + Prisma 5 + React + React Query. No new frontend deps.

**Spec reference:** `docs/superpowers/specs/2026-05-24-whatsapp-blasting-system-design.md` — sections 5 (data model `blasts`, `messages`, `message_events`, `system_settings`), 7 (blast lifecycle), 8 (reply tracking — DEFERRED to Phase 5), 9 (admin UI: blast list/wizard/detail).

**Branch:** `feat/phase-4-blast-engine` off the merged `master` (includes Phases 1-3).

---

## File Structure

```
apps/api/
  prisma/
    schema.prisma                            # MODIFIED: add 3 models + 4 enums + SystemSetting
    migrations/<ts>_blast_engine/            # NEW
    seed.ts                                  # MODIFIED: seed APPROVED test template + system settings
  src/
    main.ts                                  # unchanged
    worker.ts                                # NEW — worker process entry point
    blasts/
      blasts.module.ts                       # NEW
      blasts.controller.ts                   # NEW
      blasts.service.ts                      # NEW
      blast.processor.ts                     # NEW — BullMQ job consumer
      variable-renderer.ts                   # NEW — pure: ({1:"name"}, {1:"Ahmad"}) => "Hello Ahmad"
      language-selector.ts                   # NEW — pure: pick best template row for contact's lang
      rate-limiter.service.ts                # NEW — Redis sliding-window for 24h tier
      dto/
        create-blast.dto.ts                  # NEW
        list-blasts.dto.ts                   # NEW
      __tests__/
        variable-renderer.spec.ts            # NEW
        language-selector.spec.ts            # NEW
        rate-limiter.service.spec.ts         # NEW
        blasts.controller.spec.ts            # NEW
        blast.processor.spec.ts              # NEW
    whatsapp/
      whatsapp-cloud-api.service.ts          # MODIFIED: add sendMessage()
      webhook.controller.ts                  # MODIFIED: handle "messages" events
      dto/meta-message-event.dto.ts          # NEW — typed message-status webhook payload
      __tests__/
        whatsapp-cloud-api.service.spec.ts   # MODIFIED — add sendMessage tests
        webhook.controller.spec.ts           # MODIFIED — add message-event tests
    system-settings/
      system-settings.module.ts              # NEW — exposes SystemSettingsService
      system-settings.service.ts             # NEW — read/write key-value pairs
      __tests__/
        system-settings.service.spec.ts      # NEW
    app.module.ts                            # MODIFIED — register BullMQ + new modules
  package.json                               # MODIFIED — add bullmq + dev:worker script
  .env.example                               # MODIFIED — add MESSAGES_PER_SECOND, REPLY_ATTRIBUTION_WINDOW_DAYS

apps/web/
  src/
    api/blasts.ts                            # NEW
    pages/
      Blasts.tsx                             # NEW — list page
      BlastDetail.tsx                        # NEW — detail with live polling
      BlastWizard.tsx                        # NEW — 4-step create flow
    App.tsx                                  # MODIFIED — add /blasts routes
    components/Layout.tsx                    # MODIFIED — add nav link

e2e/
  tests/blasts.spec.ts                       # NEW

docker-compose.yml                            # unchanged (Redis already provisioned in Phase 1)
README.md                                    # MODIFIED — Phase 4 section + 2-terminal note
```

**Responsibility per key file:**

- `worker.ts` — bootstraps a NestJS app with `WorkerModule` (no HTTP, no controllers). Loads BullMQ workers. Runs forever.
- `variable-renderer.ts` — pure function `renderTemplate(bodyText, variableMapping, contact)` returning the final message text. Zero dependencies.
- `language-selector.ts` — pure function `selectTemplateRow(group: Template[], contactLanguage, defaultLanguage)` returning the best Template row to send. Zero dependencies.
- `rate-limiter.service.ts` — Redis sliding-window counter for the 24h tier limit. Exposes `consume(): Promise<{ ok: true } | { ok: false; retryAfterMs }>`.
- `blast.processor.ts` — one `@Process('blast-send')` handler. Picks message → resolves template + contact → renders → sends via WhatsappCloudApiService → updates message row.
- `blasts.service.ts` — CRUD + recipient snapshotting + job enqueueing + cancellation.
- `webhook.controller.ts` (extended) — now routes both `message_template_status_update` (Phase 3) and `messages` (Phase 4) events.

---

## Task 1: Branch Setup

- [ ] **Step 1: Update master and create branch**

```bash
git checkout master
git pull origin master
git checkout -b feat/phase-4-blast-engine
git status
```

Expected: `On branch feat/phase-4-blast-engine`, clean tree.

No commit yet.

---

## Task 2: Prisma Schema — Blast, Message, MessageEvent, SystemSetting + 4 enums

**Files:**
- Modify: `apps/api/prisma/schema.prisma`
- Create: new migration directory

- [ ] **Step 1: Append to `apps/api/prisma/schema.prisma`**

Append AFTER all existing models (User, Contact, ContactSegment, Template) and AFTER existing enums:

```prisma
enum BlastStatus {
  DRAFT
  SCHEDULED
  RUNNING
  COMPLETED
  CANCELED
  FAILED
}

enum MessageStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
  CANCELED
}

model Blast {
  id                  String       @id @default(uuid()) @db.Uuid
  name                String
  templateName        String       @map("template_name")
  defaultLanguage     LanguagePreference @default(EN) @map("default_language")
  segmentId           String?      @map("segment_id") @db.Uuid
  recipientSnapshot   Json         @default("[]") @map("recipient_snapshot")
  variableMapping     Json         @default("{}") @map("variable_mapping")
  scheduledAt         DateTime     @map("scheduled_at")
  status              BlastStatus  @default(DRAFT)
  totalRecipients     Int          @default(0) @map("total_recipients")
  createdById         String       @map("created_by") @db.Uuid
  createdAt           DateTime     @default(now()) @map("created_at")
  startedAt           DateTime?    @map("started_at")
  completedAt         DateTime?    @map("completed_at")

  messages            Message[]

  @@index([status])
  @@index([scheduledAt])
  @@map("blasts")
}

model Message {
  id              String        @id @default(uuid()) @db.Uuid
  blastId         String        @map("blast_id") @db.Uuid
  contactId       String        @map("contact_id") @db.Uuid
  templateId      String        @map("template_id") @db.Uuid
  metaMessageId   String?       @unique @map("meta_message_id")
  status          MessageStatus @default(QUEUED)
  errorCode       String?       @map("error_code")
  errorMessage    String?       @map("error_message")
  sentAt          DateTime?     @map("sent_at")
  deliveredAt     DateTime?     @map("delivered_at")
  readAt          DateTime?     @map("read_at")

  blast           Blast         @relation(fields: [blastId], references: [id], onDelete: Cascade)

  @@index([blastId])
  @@index([contactId])
  @@index([status])
  @@map("messages")
}

model MessageEvent {
  id            String   @id @default(uuid()) @db.Uuid
  messageId     String?  @map("message_id") @db.Uuid
  metaEventType String   @map("meta_event_type")
  payloadJson   Json     @map("payload_json")
  receivedAt    DateTime @default(now()) @map("received_at")

  @@index([messageId])
  @@index([receivedAt])
  @@map("message_events")
}

model SystemSetting {
  key       String   @id
  value     String
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("system_settings")
}
```

- [ ] **Step 2: Run migration**

```bash
pnpm --filter api db:migrate -- --name blast_engine
```

Expected: migration directory created. Prisma client regenerates with new types.

- [ ] **Step 3: Verify tables**

```bash
docker exec wbs_postgres psql -U wbs -d wbs -c "\dt"
```

Expected: `blasts`, `messages`, `message_events`, `system_settings` in the list (along with all previous tables).

- [ ] **Step 4: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(db): add blasts, messages, message_events, and system_settings tables"
```

---

## Task 3: Install BullMQ + Extend WhatsApp Service with sendMessage

**Files:**
- Modify: `apps/api/package.json` — add `@nestjs/bullmq` and `bullmq`
- Modify: `apps/api/.env.example` — add 2 new keys
- Modify: `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts` — add `sendMessage()`
- Modify: `apps/api/src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts` — add tests for sendMessage

- [ ] **Step 1: Install BullMQ deps**

```bash
pnpm --filter api add @nestjs/bullmq bullmq
```

`bullmq` is the queue library; `@nestjs/bullmq` is the Nest wrapper.

- [ ] **Step 2: Add env keys to `apps/api/.env.example`**

Append:

```
# Phase 4: Blast engine
MESSAGES_PER_SECOND=80
REPLY_ATTRIBUTION_WINDOW_DAYS=7
```

Also append to local `apps/api/.env` (not committed).

- [ ] **Step 3: Extend `apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`**

Add the `sendMessage` method. Place it after `getTemplateStatus`. Also add the input/output interfaces near the top of the file (after existing interfaces):

```typescript
export interface SendTemplateMessageInput {
  toPhoneE164: string;             // recipient, e.g. "+60123456789"
  templateName: string;
  templateLanguage: string;        // Meta locale, e.g. "en", "ms"
  components?: MetaSendComponent[];
}

export interface MetaSendComponent {
  type: 'header' | 'body' | 'button';
  parameters: Array<{ type: 'text'; text: string }>;
  sub_type?: 'url' | 'quick_reply';
  index?: number;
}

export interface SendMessageResponse {
  metaMessageId: string;
}
```

Add the method on the class (after `getTemplateStatus`):

```typescript
  async sendMessage(input: SendTemplateMessageInput): Promise<SendMessageResponse> {
    if (this.mockMode) {
      return {
        metaMessageId: `wamid.mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
      };
    }

    const phoneNumberId = this.config.getOrThrow<string>('WHATSAPP_PHONE_NUMBER_ID');
    const body = {
      messaging_product: 'whatsapp',
      to: input.toPhoneE164.replace(/^\+/, ''),
      type: 'template',
      template: {
        name: input.templateName,
        language: { code: input.templateLanguage },
        components: input.components ?? [],
      },
    };
    try {
      const { data } = await this.http.post(
        `/${this.apiVersion}/${phoneNumberId}/messages`,
        body,
        { headers: this.authHeader() },
      );
      const id = data?.messages?.[0]?.id;
      if (!id) throw new Error('Meta response missing message id');
      return { metaMessageId: id };
    } catch (err) {
      throw this.transformError(err);
    }
  }
```

- [ ] **Step 4: Add tests for sendMessage**

Append to `apps/api/src/whatsapp/__tests__/whatsapp-cloud-api.service.spec.ts` inside the existing top-level `describe('WhatsappCloudApiService', ...)` block:

```typescript
  describe('sendMessage', () => {
    it('returns a fake wamid in mock mode', async () => {
      const service = new WhatsappCloudApiService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));
      const result = await service.sendMessage({
        toPhoneE164: '+60123456789',
        templateName: 'raya_promo',
        templateLanguage: 'ms',
      });
      expect(result.metaMessageId).toMatch(/^wamid\.mock-/);
    });

    it('POSTs to /v20.0/{phoneId}/messages and returns wamid', async () => {
      const service = new WhatsappCloudApiService(
        makeConfig({ WHATSAPP_PHONE_NUMBER_ID: '555000111' }),
      );
      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages', (b: any) => {
          return b.messaging_product === 'whatsapp' && b.to === '60123456789' && b.template?.name === 'raya_promo';
        })
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { messages: [{ id: 'wamid.HBgM...' }] });

      const result = await service.sendMessage({
        toPhoneE164: '+60123456789',
        templateName: 'raya_promo',
        templateLanguage: 'ms',
      });
      expect(result.metaMessageId).toBe('wamid.HBgM...');
      expect(scope.isDone()).toBe(true);
    });

    it('throws on 4xx from Meta', async () => {
      const service = new WhatsappCloudApiService(
        makeConfig({ WHATSAPP_PHONE_NUMBER_ID: '555000111' }),
      );
      nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages')
        .reply(400, { error: { message: 'Recipient is not a WhatsApp user', code: 131026 } });
      await expect(
        service.sendMessage({ toPhoneE164: '+60123456789', templateName: 'x', templateLanguage: 'en' }),
      ).rejects.toThrow(/Recipient is not a WhatsApp user/);
    });
  });
```

NOTE: `makeConfig` helper from Phase 3 has `WHATSAPP_PHONE_NUMBER_ID` missing from defaults. You may need to add it. The existing helper looks like:
```typescript
const CONFIG: Record<string, string> = {
  WHATSAPP_MOCK_MODE: 'false',
  WHATSAPP_API_VERSION: 'v20.0',
  WHATSAPP_WABA_ID: '999000111',
  WHATSAPP_ACCESS_TOKEN: 'test-token',
};
```

Add `WHATSAPP_PHONE_NUMBER_ID: '555000111'` to that default block, so all existing tests pass.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/whatsapp apps/api/package.json apps/api/.env.example pnpm-lock.yaml
git commit -m "feat(whatsapp): add sendMessage endpoint + install BullMQ deps"
```

---

## Task 4: Variable Renderer Utility (TDD)

**Files:**
- Create: `apps/api/src/blasts/variable-renderer.ts`, `apps/api/src/blasts/__tests__/variable-renderer.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/blasts/__tests__/variable-renderer.spec.ts`:

```typescript
import { renderTemplate, resolveValue } from '../variable-renderer';

const contact = {
  id: 'c1',
  phoneE164: '+60123456789',
  name: 'Ahmad',
  state: 'Selangor',
  attributes: { tier: 'gold', orderId: '12345' } as Record<string, unknown>,
} as any;

describe('resolveValue', () => {
  it('reads contact.name', () => {
    expect(resolveValue('contact.name', contact)).toBe('Ahmad');
  });

  it('reads contact.state', () => {
    expect(resolveValue('contact.state', contact)).toBe('Selangor');
  });

  it('reads nested attribute via contact.attributes.X', () => {
    expect(resolveValue('contact.attributes.tier', contact)).toBe('gold');
  });

  it('returns empty string for unknown contact.field', () => {
    expect(resolveValue('contact.unknown', contact)).toBe('');
  });

  it('returns the literal value when source starts with literal:', () => {
    expect(resolveValue('literal:Hello', contact)).toBe('Hello');
  });

  it('returns empty string for a name with no value (null)', () => {
    expect(resolveValue('contact.name', { ...contact, name: null })).toBe('');
  });
});

describe('renderTemplate', () => {
  it('substitutes a single {{1}} placeholder', () => {
    const result = renderTemplate('Hello {{1}}!', { '1': 'contact.name' }, contact);
    expect(result).toBe('Hello Ahmad!');
  });

  it('substitutes multiple placeholders', () => {
    const result = renderTemplate('Hi {{1}}, your order is {{2}}', { '1': 'contact.name', '2': 'contact.attributes.orderId' }, contact);
    expect(result).toBe('Hi Ahmad, your order is 12345');
  });

  it('leaves placeholders empty when source is missing', () => {
    const result = renderTemplate('Hi {{1}}', { '1': 'contact.missing' }, contact);
    expect(result).toBe('Hi ');
  });

  it('returns body unchanged when no placeholders', () => {
    expect(renderTemplate('Hi there', {}, contact)).toBe('Hi there');
  });

  it('returns an ordered components array matching the template variables', () => {
    // helper that returns the Meta-API components payload
    const components = renderTemplate.toComponents(['1', '2'], { '1': 'contact.name', '2': 'literal:Premium' }, contact);
    expect(components).toEqual([
      { type: 'body', parameters: [
        { type: 'text', text: 'Ahmad' },
        { type: 'text', text: 'Premium' },
      ]},
    ]);
  });
});
```

- [ ] **Step 2: Implement `apps/api/src/blasts/variable-renderer.ts`**

```typescript
type ContactLike = {
  id: string;
  phoneE164: string;
  name: string | null;
  city?: string | null;
  state?: string | null;
  ethnicity?: string;
  gender?: string;
  attributes?: Record<string, unknown>;
};

export type VariableMapping = Record<string, string>; // { "1": "contact.name", "2": "literal:Premium" }

export function resolveValue(source: string, contact: ContactLike): string {
  if (source.startsWith('literal:')) return source.slice('literal:'.length);

  if (source.startsWith('contact.attributes.')) {
    const key = source.slice('contact.attributes.'.length);
    const raw = contact.attributes?.[key];
    return raw == null ? '' : String(raw);
  }

  if (source.startsWith('contact.')) {
    const key = source.slice('contact.'.length);
    const raw = (contact as Record<string, unknown>)[key];
    return raw == null ? '' : String(raw);
  }

  return '';
}

interface RenderTemplateFn {
  (body: string, mapping: VariableMapping, contact: ContactLike): string;
  toComponents(
    variableNumbers: string[],
    mapping: VariableMapping,
    contact: ContactLike,
  ): Array<{ type: 'body'; parameters: Array<{ type: 'text'; text: string }> }>;
}

export const renderTemplate: RenderTemplateFn = ((body: string, mapping: VariableMapping, contact: ContactLike): string => {
  return body.replace(/\{\{(\d+)\}\}/g, (_, num: string) => {
    const source = mapping[num];
    if (!source) return '';
    return resolveValue(source, contact);
  });
}) as RenderTemplateFn;

renderTemplate.toComponents = function (variableNumbers, mapping, contact) {
  if (variableNumbers.length === 0) return [];
  return [
    {
      type: 'body',
      parameters: variableNumbers.map((num) => ({
        type: 'text' as const,
        text: resolveValue(mapping[num] ?? '', contact),
      })),
    },
  ];
};
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/blasts/variable-renderer.ts apps/api/src/blasts/__tests__/variable-renderer.spec.ts
git commit -m "feat(blasts): add variable renderer utility (TDD)"
```

---

## Task 5: Language Selector Utility (TDD)

**Files:**
- Create: `apps/api/src/blasts/language-selector.ts`, `apps/api/src/blasts/__tests__/language-selector.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/blasts/__tests__/language-selector.spec.ts`:

```typescript
import { selectTemplateRow } from '../language-selector';

const enRow = { id: 'r1', language: 'EN', status: 'APPROVED' } as any;
const msRow = { id: 'r2', language: 'MS', status: 'APPROVED' } as any;
const zhPendingRow = { id: 'r3', language: 'ZH', status: 'PENDING' } as any;

describe('selectTemplateRow', () => {
  it('returns the matching language when contact prefers MS', () => {
    expect(selectTemplateRow([enRow, msRow], 'MS', 'EN')).toEqual(msRow);
  });

  it('falls back to default language when contact lang not in group', () => {
    expect(selectTemplateRow([enRow, msRow], 'ZH', 'EN')).toEqual(enRow);
  });

  it('returns null when neither contact lang nor default lang is APPROVED', () => {
    expect(selectTemplateRow([zhPendingRow], 'ZH', 'EN')).toBeNull();
  });

  it('skips non-APPROVED rows even if language matches', () => {
    expect(selectTemplateRow([zhPendingRow, enRow], 'ZH', 'EN')).toEqual(enRow);
  });

  it('returns null on empty group', () => {
    expect(selectTemplateRow([], 'EN', 'EN')).toBeNull();
  });
});
```

- [ ] **Step 2: Implement `apps/api/src/blasts/language-selector.ts`**

```typescript
type TemplateRow = {
  id: string;
  language: string;
  status: string;
};

/**
 * Pick the best Template row to send to a contact.
 * Priority: contact's preferred language (if APPROVED) -> default language (if APPROVED) -> null.
 */
export function selectTemplateRow<T extends TemplateRow>(
  group: T[],
  contactLanguage: string,
  defaultLanguage: string,
): T | null {
  const approved = group.filter((r) => r.status === 'APPROVED');
  return (
    approved.find((r) => r.language === contactLanguage) ??
    approved.find((r) => r.language === defaultLanguage) ??
    null
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/blasts/language-selector.ts apps/api/src/blasts/__tests__/language-selector.spec.ts
git commit -m "feat(blasts): add language selector utility (TDD)"
```

---

## Task 6: Rate Limiter Service (Redis sliding window)

**Files:**
- Create: `apps/api/src/blasts/rate-limiter.service.ts`, `apps/api/src/blasts/__tests__/rate-limiter.service.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/blasts/__tests__/rate-limiter.service.spec.ts`:

```typescript
import { RateLimiterService } from '../rate-limiter.service';

describe('RateLimiterService', () => {
  let redis: {
    zremrangebyscore: jest.Mock;
    zadd: jest.Mock;
    zcard: jest.Mock;
    zrange: jest.Mock;
    expire: jest.Mock;
  };
  let service: RateLimiterService;

  beforeEach(() => {
    redis = {
      zremrangebyscore: jest.fn().mockResolvedValue(0),
      zadd: jest.fn().mockResolvedValue(1),
      zcard: jest.fn().mockResolvedValue(0),
      zrange: jest.fn().mockResolvedValue([]),
      expire: jest.fn().mockResolvedValue(1),
    };
    service = new RateLimiterService(redis as any);
  });

  it('admits a send when under the cap', async () => {
    redis.zcard.mockResolvedValue(0);
    const result = await service.consume(1000);
    expect(result.ok).toBe(true);
  });

  it('admits a send right at the limit minus one', async () => {
    redis.zcard.mockResolvedValue(999);
    const result = await service.consume(1000);
    expect(result.ok).toBe(true);
  });

  it('rejects when at the cap', async () => {
    redis.zcard.mockResolvedValue(1000);
    redis.zrange.mockResolvedValue(['ts1', String(Date.now() - 60_000)]);
    const result = await service.consume(1000);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it('does not increment when rejected', async () => {
    redis.zcard.mockResolvedValue(1000);
    redis.zrange.mockResolvedValue(['ts1', String(Date.now() - 60_000)]);
    await service.consume(1000);
    expect(redis.zadd).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Implement `apps/api/src/blasts/rate-limiter.service.ts`**

```typescript
import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

const KEY = 'rate:tier:24h';
const WINDOW_MS = 24 * 60 * 60 * 1000;

export type ConsumeResult =
  | { ok: true }
  | { ok: false; retryAfterMs: number };

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  constructor(@Inject('REDIS_CLIENT') private readonly redis: Redis) {}

  /** Attempt to record one send within the 24h window. */
  async consume(cap: number): Promise<ConsumeResult> {
    const now = Date.now();
    const cutoff = now - WINDOW_MS;
    await this.redis.zremrangebyscore(KEY, '-inf', cutoff);
    const count = await this.redis.zcard(KEY);
    if (count >= cap) {
      // Find the oldest entry to compute retry time
      const oldest = await this.redis.zrange(KEY, 0, 0, 'WITHSCORES');
      const oldestScore = oldest.length >= 2 ? Number(oldest[1]) : now;
      const retryAfterMs = Math.max(1000, oldestScore + WINDOW_MS - now);
      return { ok: false, retryAfterMs };
    }
    await this.redis.zadd(KEY, now, `${now}:${Math.random()}`);
    await this.redis.expire(KEY, Math.ceil(WINDOW_MS / 1000));
    return { ok: true };
  }

  /** Convert tier name to numeric cap. */
  static capFor(tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNLIMITED'): number {
    switch (tier) {
      case 'TIER_1': return 1_000;
      case 'TIER_2': return 10_000;
      case 'TIER_3': return 100_000;
      case 'UNLIMITED': return Number.MAX_SAFE_INTEGER;
    }
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/blasts/rate-limiter.service.ts apps/api/src/blasts/__tests__/rate-limiter.service.spec.ts
git commit -m "feat(blasts): add Redis sliding-window rate limiter for 24h tier"
```

---

## Task 7: System Settings Module

**Files:**
- Create: `apps/api/src/system-settings/system-settings.module.ts`, `apps/api/src/system-settings/system-settings.service.ts`, `apps/api/src/system-settings/__tests__/system-settings.service.spec.ts`

- [ ] **Step 1: Write the failing test**

`apps/api/src/system-settings/__tests__/system-settings.service.spec.ts`:

```typescript
import { SystemSettingsService } from '../system-settings.service';

describe('SystemSettingsService', () => {
  let prisma: { systemSetting: { upsert: jest.Mock; findUnique: jest.Mock } };
  let service: SystemSettingsService;

  beforeEach(() => {
    prisma = { systemSetting: { upsert: jest.fn(), findUnique: jest.fn() } };
    service = new SystemSettingsService(prisma as any);
  });

  it('returns the stored value when present', async () => {
    prisma.systemSetting.findUnique.mockResolvedValue({ key: 'current_messaging_tier', value: 'TIER_2' });
    expect(await service.get('current_messaging_tier', 'TIER_1')).toBe('TIER_2');
  });

  it('returns default when not present', async () => {
    prisma.systemSetting.findUnique.mockResolvedValue(null);
    expect(await service.get('current_messaging_tier', 'TIER_1')).toBe('TIER_1');
  });

  it('upserts when set is called', async () => {
    prisma.systemSetting.upsert.mockResolvedValue({});
    await service.set('current_messaging_tier', 'TIER_3');
    expect(prisma.systemSetting.upsert).toHaveBeenCalledWith({
      where: { key: 'current_messaging_tier' },
      create: { key: 'current_messaging_tier', value: 'TIER_3' },
      update: { value: 'TIER_3' },
    });
  });
});
```

- [ ] **Step 2: Implement `apps/api/src/system-settings/system-settings.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SystemSettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(key: string, fallback: string): Promise<string> {
    const row = await this.prisma.systemSetting.findUnique({ where: { key } });
    return row?.value ?? fallback;
  }

  async set(key: string, value: string): Promise<void> {
    await this.prisma.systemSetting.upsert({
      where: { key },
      create: { key, value },
      update: { value },
    });
  }
}
```

- [ ] **Step 3: Create `apps/api/src/system-settings/system-settings.module.ts`**

```typescript
import { Global, Module } from '@nestjs/common';
import { SystemSettingsService } from './system-settings.service';

@Global()
@Module({
  providers: [SystemSettingsService],
  exports: [SystemSettingsService],
})
export class SystemSettingsModule {}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/system-settings
git commit -m "feat(settings): add global key-value SystemSettingsService"
```

---

## Task 8: Blasts DTOs + Service

**Files:**
- Create: `apps/api/src/blasts/dto/create-blast.dto.ts`, `apps/api/src/blasts/dto/list-blasts.dto.ts`
- Create: `apps/api/src/blasts/blasts.service.ts`
- Create: `apps/api/src/blasts/__tests__/blasts.service.spec.ts` (light tests for stats query)

- [ ] **Step 1: Create `apps/api/src/blasts/dto/create-blast.dto.ts`**

```typescript
import { IsDateString, IsEnum, IsObject, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateBlastDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(64)
  templateName!: string;

  @IsEnum(['EN', 'MS', 'ZH', 'TA', 'OTHER'])
  defaultLanguage!: 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

  @IsOptional()
  @IsUUID()
  segmentId?: string;

  @IsObject()
  variableMapping!: Record<string, string>; // { "1": "contact.name" }

  @IsDateString()
  scheduledAt!: string; // ISO string
}
```

- [ ] **Step 2: Create `apps/api/src/blasts/dto/list-blasts.dto.ts`**

```typescript
import { Transform } from 'class-transformer';
import { IsArray, IsEnum, IsOptional } from 'class-validator';

export class ListBlastsDto {
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  @IsArray()
  @IsEnum(['DRAFT', 'SCHEDULED', 'RUNNING', 'COMPLETED', 'CANCELED', 'FAILED'], { each: true })
  status?: ('DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELED' | 'FAILED')[];
}
```

- [ ] **Step 3: Create `apps/api/src/blasts/blasts.service.ts`**

```typescript
import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { filterToWhere } from '../segments/filter-to-where';
import { ContactFilter } from '../segments/dto/contact-filter.dto';
import { CreateBlastDto } from './dto/create-blast.dto';
import { ListBlastsDto } from './dto/list-blasts.dto';

export const BLAST_QUEUE = 'blast-send';

export interface BlastJobData {
  messageId: string;
}

@Injectable()
export class BlastsService {
  private readonly logger = new Logger(BlastsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(BLAST_QUEUE) private readonly queue: Queue<BlastJobData>,
  ) {}

  list(q: ListBlastsDto) {
    const where: Prisma.BlastWhereInput = {};
    if (q.status?.length) where.status = { in: q.status };
    return this.prisma.blast.findMany({ where, orderBy: { createdAt: 'desc' } });
  }

  async findOne(id: string) {
    const blast = await this.prisma.blast.findUnique({ where: { id } });
    if (!blast) throw new NotFoundException();
    return blast;
  }

  /** Per-status counts for live polling. */
  async stats(id: string) {
    const blast = await this.findOne(id);
    const grouped = await this.prisma.message.groupBy({
      by: ['status'],
      where: { blastId: id },
      _count: { status: true },
    });
    const counts: Record<string, number> = { QUEUED: 0, SENT: 0, DELIVERED: 0, READ: 0, FAILED: 0, CANCELED: 0 };
    for (const g of grouped) counts[g.status] = g._count.status;
    return {
      id: blast.id,
      status: blast.status,
      totalRecipients: blast.totalRecipients,
      counts,
      startedAt: blast.startedAt,
      completedAt: blast.completedAt,
    };
  }

  async resolveRecipients(segmentId: string | undefined): Promise<string[]> {
    if (!segmentId) {
      const all = await this.prisma.contact.findMany({
        where: { optInStatus: 'OPTED_IN' },
        select: { id: true },
      });
      return all.map((c) => c.id);
    }
    const segment = await this.prisma.contactSegment.findUnique({ where: { id: segmentId } });
    if (!segment) throw new BadRequestException('Unknown segment');
    const filter = segment.filterJson as unknown as ContactFilter;
    const where = filterToWhere(filter);
    const rows = await this.prisma.contact.findMany({
      where: { ...where, optInStatus: 'OPTED_IN' },
      select: { id: true },
    });
    return rows.map((r) => r.id);
  }

  /** Validate that at least one APPROVED row exists for the named template, and return the latest APPROVED version. */
  private async validateTemplate(templateName: string, defaultLanguage: string) {
    const rows = await this.prisma.template.findMany({ where: { name: templateName } });
    if (rows.length === 0) throw new BadRequestException(`Template "${templateName}" not found`);
    const approvedRows = rows.filter((r) => r.status === 'APPROVED');
    if (approvedRows.length === 0) {
      throw new BadRequestException(`No APPROVED variant for "${templateName}"`);
    }
    // Use the latest APPROVED version (so an in-progress v2 doesn't block sending v1).
    const latestApprovedVersion = Math.max(...approvedRows.map((r) => r.version));
    const usable = approvedRows.filter((r) => r.version === latestApprovedVersion);
    if (!usable.find((r) => r.language === defaultLanguage)) {
      throw new BadRequestException(`Default language ${defaultLanguage} not APPROVED for this template`);
    }
    return { latestVersion: latestApprovedVersion, approvedRows: usable };
  }

  async createAndSchedule(dto: CreateBlastDto, actorUserId: string) {
    const scheduledAt = new Date(dto.scheduledAt);
    if (Number.isNaN(scheduledAt.getTime())) throw new BadRequestException('Invalid scheduledAt');

    const { latestVersion, approvedRows } = await this.validateTemplate(dto.templateName, dto.defaultLanguage);

    const contactIds = await this.resolveRecipients(dto.segmentId);
    if (contactIds.length === 0) throw new BadRequestException('Segment resolved to 0 contacts');

    // Pre-pick a template row per contact and create message rows in a transaction
    const contacts = await this.prisma.contact.findMany({
      where: { id: { in: contactIds } },
      select: { id: true, languagePreference: true },
    });

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
        totalRecipients: contactIds.length,
        createdById: actorUserId,
      },
    });

    // Pick template row per contact and create messages
    const approvedByLang = new Map(approvedRows.map((r) => [r.language, r]));
    const fallback = approvedByLang.get(dto.defaultLanguage)!;
    await this.prisma.$transaction(
      contacts.map((c) => {
        const picked = approvedByLang.get(c.languagePreference) ?? fallback;
        return this.prisma.message.create({
          data: {
            blastId: blast.id,
            contactId: c.id,
            templateId: picked.id,
            status: 'QUEUED',
          },
        });
      }),
    );

    // Enqueue jobs
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
    this.logger.log(`Blast ${blast.id} scheduled with ${newMessages.length} jobs, delay=${delayMs}ms`);
    return blast;
  }

  async cancel(id: string) {
    const blast = await this.findOne(id);
    if (!['SCHEDULED', 'RUNNING'].includes(blast.status)) {
      throw new BadRequestException(`Cannot cancel a ${blast.status} blast`);
    }

    // Remove delayed/waiting jobs for this blast
    const jobs = await this.queue.getJobs(['delayed', 'waiting']);
    for (const job of jobs) {
      const data = job.data as BlastJobData;
      const msg = await this.prisma.message.findUnique({ where: { id: data.messageId } });
      if (msg?.blastId === id) {
        await job.remove();
      }
    }

    // Mark all still-QUEUED messages as CANCELED
    await this.prisma.message.updateMany({
      where: { blastId: id, status: 'QUEUED' },
      data: { status: 'CANCELED' },
    });
    return this.prisma.blast.update({
      where: { id },
      data: { status: 'CANCELED', completedAt: new Date() },
    });
  }
}
```

- [ ] **Step 4: Create the service test (lightweight)**

`apps/api/src/blasts/__tests__/blasts.service.spec.ts`:

```typescript
import { BlastsService } from '../blasts.service';

describe('BlastsService.stats', () => {
  let prisma: any;
  let queue: any;
  let service: BlastsService;

  beforeEach(() => {
    prisma = {
      blast: { findUnique: jest.fn() },
      message: { groupBy: jest.fn() },
    };
    queue = { add: jest.fn(), getJobs: jest.fn() };
    service = new BlastsService(prisma, queue);
  });

  it('returns counts including zeroes for statuses with no rows', async () => {
    prisma.blast.findUnique.mockResolvedValue({
      id: 'b1', status: 'RUNNING', totalRecipients: 5, startedAt: null, completedAt: null,
    });
    prisma.message.groupBy.mockResolvedValue([
      { status: 'SENT', _count: { status: 3 } },
      { status: 'DELIVERED', _count: { status: 1 } },
    ]);

    const result = await service.stats('b1');
    expect(result.counts).toEqual({
      QUEUED: 0, SENT: 3, DELIVERED: 1, READ: 0, FAILED: 0, CANCELED: 0,
    });
    expect(result.totalRecipients).toBe(5);
  });
});
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/blasts
git commit -m "feat(blasts): add BlastsService with create/list/stats/cancel + DTOs"
```

---

## Task 9: Blasts Controller + Module

**Files:**
- Create: `apps/api/src/blasts/blasts.controller.ts`, `apps/api/src/blasts/blasts.module.ts`, `apps/api/src/blasts/__tests__/blasts.controller.spec.ts`
- Modify: `apps/api/src/app.module.ts` — register BullMQ + new modules

- [ ] **Step 1: Create `apps/api/src/blasts/__tests__/blasts.controller.spec.ts`**

```typescript
import { Test } from '@nestjs/testing';
import { BlastsController } from '../blasts.controller';
import { BlastsService } from '../blasts.service';

describe('BlastsController', () => {
  let controller: BlastsController;
  let service: {
    list: jest.Mock;
    findOne: jest.Mock;
    stats: jest.Mock;
    createAndSchedule: jest.Mock;
    cancel: jest.Mock;
  };

  beforeEach(async () => {
    service = {
      list: jest.fn(),
      findOne: jest.fn(),
      stats: jest.fn(),
      createAndSchedule: jest.fn(),
      cancel: jest.fn(),
    };
    const module = await Test.createTestingModule({
      controllers: [BlastsController],
      providers: [{ provide: BlastsService, useValue: service }],
    }).compile();
    controller = module.get(BlastsController);
  });

  it('GET /blasts lists', async () => {
    service.list.mockResolvedValue([{ id: 'b1' }]);
    expect(await controller.list({} as any)).toEqual([{ id: 'b1' }]);
  });

  it('GET /blasts/:id returns one', async () => {
    service.findOne.mockResolvedValue({ id: 'b1' });
    expect(await controller.findOne('b1')).toEqual({ id: 'b1' });
  });

  it('GET /blasts/:id/stats returns stats', async () => {
    service.stats.mockResolvedValue({ id: 'b1', counts: { SENT: 5 } });
    const result = await controller.stats('b1');
    expect(result.counts.SENT).toBe(5);
  });

  it('POST /blasts creates and schedules', async () => {
    service.createAndSchedule.mockResolvedValue({ id: 'b2' });
    const dto = { name: 'x', templateName: 't', defaultLanguage: 'EN', variableMapping: {}, scheduledAt: '2026-12-01T00:00:00Z' } as any;
    const req = { user: { id: 'u1' } } as any;
    await controller.create(dto, req);
    expect(service.createAndSchedule).toHaveBeenCalledWith(dto, 'u1');
  });

  it('POST /blasts/:id/cancel cancels', async () => {
    service.cancel.mockResolvedValue({ id: 'b1', status: 'CANCELED' });
    const result = await controller.cancel('b1');
    expect(result.status).toBe('CANCELED');
  });
});
```

- [ ] **Step 2: Create `apps/api/src/blasts/blasts.controller.ts`**

```typescript
import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BlastsService } from './blasts.service';
import { CreateBlastDto } from './dto/create-blast.dto';
import { ListBlastsDto } from './dto/list-blasts.dto';

@Controller('blasts')
@UseGuards(JwtAuthGuard)
export class BlastsController {
  constructor(private readonly blasts: BlastsService) {}

  @Get()
  list(@Query() q: ListBlastsDto) {
    return this.blasts.list(q);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.blasts.findOne(id);
  }

  @Get(':id/stats')
  stats(@Param('id') id: string) {
    return this.blasts.stats(id);
  }

  @Post()
  create(@Body() dto: CreateBlastDto, @Req() req: Request) {
    const userId = (req.user as { id: string }).id;
    return this.blasts.createAndSchedule(dto, userId);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.blasts.cancel(id);
  }
}
```

- [ ] **Step 3: Create `apps/api/src/blasts/blasts.module.ts`**

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BlastsController } from './blasts.controller';
import { BlastsService, BLAST_QUEUE } from './blasts.service';
import { RateLimiterService } from './rate-limiter.service';
import { AuthModule } from '../auth/auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => WhatsappModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          // BullMQ accepts a URL via host/port or an ioredis instance
          url: config.getOrThrow<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue({ name: BLAST_QUEUE }),
  ],
  controllers: [BlastsController],
  providers: [
    BlastsService,
    RateLimiterService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
  ],
  exports: [BlastsService, RateLimiterService, 'REDIS_CLIENT', BullModule],
})
export class BlastsModule {}
```

- [ ] **Step 4: Wire into `apps/api/src/app.module.ts`**

Read the existing file. Add imports for BlastsModule and SystemSettingsModule. Final state:

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
import { BlastsModule } from './blasts/blasts.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';

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
    SystemSettingsModule,
    BlastsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/blasts apps/api/src/app.module.ts
git commit -m "feat(blasts): add controller + module with BullMQ queue registration"
```

---

## Task 10: BlastProcessor — BullMQ Worker

**Files:**
- Create: `apps/api/src/blasts/blast.processor.ts`, `apps/api/src/blasts/__tests__/blast.processor.spec.ts`
- Modify: `apps/api/src/blasts/blasts.module.ts` — register processor (only in worker process, but Nest registers it whenever the module loads — see worker.ts later)

- [ ] **Step 1: Create the processor test**

`apps/api/src/blasts/__tests__/blast.processor.spec.ts`:

```typescript
import { BlastProcessor } from '../blast.processor';

describe('BlastProcessor', () => {
  let prisma: any;
  let whatsapp: { sendMessage: jest.Mock };
  let limiter: { consume: jest.Mock };
  let settings: { get: jest.Mock };
  let processor: BlastProcessor;

  beforeEach(() => {
    prisma = {
      message: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      blast: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      template: {
        findUnique: jest.fn(),
      },
      contact: {
        findUnique: jest.fn(),
      },
    };
    whatsapp = { sendMessage: jest.fn() };
    limiter = { consume: jest.fn().mockResolvedValue({ ok: true }) };
    settings = { get: jest.fn().mockResolvedValue('TIER_1') };
    processor = new BlastProcessor(prisma, whatsapp as any, limiter as any, settings as any);
  });

  it('marks message SENT after successful send', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1', blastId: 'b1', contactId: 'c1', templateId: 't1', status: 'QUEUED',
    });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'A', languagePreference: 'EN' });
    prisma.template.findUnique.mockResolvedValue({
      id: 't1', name: 'promo', language: 'EN', bodyText: 'Hi {{1}}', variables: ['name'],
    });
    prisma.blast.findUnique.mockResolvedValue({ id: 'b1', variableMapping: { '1': 'contact.name' }, status: 'SCHEDULED' });
    prisma.message.count.mockResolvedValue(1); // still has queued messages
    whatsapp.sendMessage.mockResolvedValue({ metaMessageId: 'wamid.xyz' });

    await processor.process({ data: { messageId: 'm1' } } as any);

    expect(prisma.message.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'm1' },
      data: expect.objectContaining({ status: 'SENT', metaMessageId: 'wamid.xyz' }),
    }));
  });

  it('marks message FAILED when Meta returns 4xx', async () => {
    prisma.message.findUnique.mockResolvedValue({
      id: 'm1', blastId: 'b1', contactId: 'c1', templateId: 't1', status: 'QUEUED',
    });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'A', languagePreference: 'EN' });
    prisma.template.findUnique.mockResolvedValue({ id: 't1', name: 'p', language: 'EN', bodyText: 'x', variables: [] });
    prisma.blast.findUnique.mockResolvedValue({ id: 'b1', variableMapping: {}, status: 'RUNNING' });
    whatsapp.sendMessage.mockRejectedValue(new Error('Recipient is not a WhatsApp user'));

    await expect(processor.process({ data: { messageId: 'm1' } } as any)).rejects.toThrow();

    expect(prisma.message.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'm1' },
      data: expect.objectContaining({ status: 'FAILED' }),
    }));
  });

  it('skips already-CANCELED messages', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', status: 'CANCELED' });
    await processor.process({ data: { messageId: 'm1' } } as any);
    expect(whatsapp.sendMessage).not.toHaveBeenCalled();
  });

  it('transitions blast to RUNNING on first send', async () => {
    prisma.message.findUnique.mockResolvedValue({ id: 'm1', blastId: 'b1', contactId: 'c1', templateId: 't1', status: 'QUEUED' });
    prisma.contact.findUnique.mockResolvedValue({ id: 'c1', phoneE164: '+60123', name: 'A', languagePreference: 'EN' });
    prisma.template.findUnique.mockResolvedValue({ id: 't1', name: 'p', language: 'EN', bodyText: 'x', variables: [] });
    prisma.blast.findUnique.mockResolvedValue({ id: 'b1', variableMapping: {}, status: 'SCHEDULED' });
    prisma.message.count.mockResolvedValue(2);
    whatsapp.sendMessage.mockResolvedValue({ metaMessageId: 'wamid.xyz' });

    await processor.process({ data: { messageId: 'm1' } } as any);

    expect(prisma.blast.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'b1' },
      data: expect.objectContaining({ status: 'RUNNING', startedAt: expect.any(Date) }),
    }));
  });
});
```

- [ ] **Step 2: Implement `apps/api/src/blasts/blast.processor.ts`**

```typescript
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappCloudApiService } from '../whatsapp/whatsapp-cloud-api.service';
import { RateLimiterService } from './rate-limiter.service';
import { SystemSettingsService } from '../system-settings/system-settings.service';
import { renderTemplate } from './variable-renderer';
import { BLAST_QUEUE, BlastJobData } from './blasts.service';

function toMetaLocale(lang: string): string {
  const map: Record<string, string> = { EN: 'en', MS: 'ms', ZH: 'zh_CN', TA: 'ta', OTHER: 'en' };
  return map[lang] ?? 'en';
}

@Processor(BLAST_QUEUE, { concurrency: 80 })
@Injectable()
export class BlastProcessor extends WorkerHost {
  private readonly logger = new Logger(BlastProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
    private readonly limiter: RateLimiterService,
    private readonly settings: SystemSettingsService,
  ) {
    super();
  }

  async process(job: Job<BlastJobData>): Promise<void> {
    const { messageId } = job.data;
    const message = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!message) {
      this.logger.warn(`Message ${messageId} not found — skipping`);
      return;
    }
    if (message.status !== 'QUEUED') {
      this.logger.log(`Message ${messageId} status=${message.status} — skipping`);
      return;
    }

    // 24h tier check
    const tier = (await this.settings.get('current_messaging_tier', 'TIER_1')) as
      | 'TIER_1' | 'TIER_2' | 'TIER_3' | 'UNLIMITED';
    const cap = RateLimiterService.capFor(tier);
    const consume = await this.limiter.consume(cap);
    if (!consume.ok) {
      this.logger.warn(`Tier cap hit (${tier}=${cap}), delaying ${consume.retryAfterMs}ms`);
      await job.moveToDelayed(Date.now() + consume.retryAfterMs);
      return;
    }

    const [contact, template, blast] = await Promise.all([
      this.prisma.contact.findUnique({ where: { id: message.contactId } }),
      this.prisma.template.findUnique({ where: { id: message.templateId } }),
      this.prisma.blast.findUnique({ where: { id: message.blastId } }),
    ]);
    if (!contact || !template || !blast) {
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'FAILED', errorCode: 'MISSING_REFERENCE', errorMessage: 'Contact/template/blast not found' },
      });
      throw new Error('missing reference');
    }

    // Transition blast to RUNNING on first job (idempotent — only one update happens)
    if (blast.status === 'SCHEDULED') {
      await this.prisma.blast.update({
        where: { id: blast.id, status: 'SCHEDULED' },
        data: { status: 'RUNNING', startedAt: new Date() },
      }).catch(() => undefined);
    }

    const variableNumbers = template.variables.map((_, i) => String(i + 1));
    const components = renderTemplate.toComponents(
      variableNumbers,
      blast.variableMapping as Record<string, string>,
      contact as any,
    );

    try {
      const send = await this.whatsapp.sendMessage({
        toPhoneE164: contact.phoneE164,
        templateName: template.name,
        templateLanguage: toMetaLocale(template.language),
        components,
      });

      await this.prisma.message.update({
        where: { id: messageId },
        data: {
          status: 'SENT',
          metaMessageId: send.metaMessageId,
          sentAt: new Date(),
        },
      });

      // Check if any QUEUED remain; if not, mark blast COMPLETED.
      const stillQueued = await this.prisma.message.count({
        where: { blastId: blast.id, status: 'QUEUED' },
      });
      if (stillQueued === 0) {
        await this.prisma.blast.update({
          where: { id: blast.id },
          data: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'unknown';
      await this.prisma.message.update({
        where: { id: messageId },
        data: { status: 'FAILED', errorCode: 'SEND_FAILED', errorMessage: msg },
      });
      throw err; // re-throw so BullMQ records the failure (won't retry by default since attempts: 5 in service, but this throw causes the retry logic to engage)
    }
  }
}
```

- [ ] **Step 3: Register the processor in `apps/api/src/blasts/blasts.module.ts`**

Add `BlastProcessor` to the providers list. The full updated module:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BlastsController } from './blasts.controller';
import { BlastsService, BLAST_QUEUE } from './blasts.service';
import { BlastProcessor } from './blast.processor';
import { RateLimiterService } from './rate-limiter.service';
import { AuthModule } from '../auth/auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => WhatsappModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: BLAST_QUEUE }),
  ],
  controllers: [BlastsController],
  providers: [
    BlastsService,
    BlastProcessor,
    RateLimiterService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
  ],
  exports: [BlastsService, RateLimiterService, 'REDIS_CLIENT', BullModule],
})
export class BlastsModule {}
```

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/blasts
git commit -m "feat(blasts): add BullMQ worker processor with throttling + send logic"
```

---

## Task 11: Worker Process Entry Point

**Files:**
- Create: `apps/api/src/worker.ts`
- Modify: `apps/api/package.json` — add `dev:worker` and `start:worker` scripts

The worker shares the AppModule but runs without HTTP. NestJS's `NestFactory.createApplicationContext()` boots the DI graph but doesn't listen on a port. The `@Processor` decorator on BlastProcessor auto-registers it with BullMQ when the module loads — so the same code runs in both processes, but only the worker process consumes jobs (the API process registers them but normally a separate worker process consumes).

ARCHITECTURAL NOTE: With this setup, both the API process AND the worker process technically consume jobs. To make ONLY the worker process consume, we use an env flag.

- [ ] **Step 1: Add `WORKER_MODE` env var to `apps/api/.env.example`** (append):

```
WORKER_MODE=false
```

Then for local dev, the worker process is launched with `WORKER_MODE=true`.

- [ ] **Step 2: Modify `apps/api/src/blasts/blast.processor.ts`** — conditionally skip processing in non-worker mode

Add this guard at the top of the `process()` method, right after destructuring:

```typescript
    if (process.env.WORKER_MODE !== 'true') {
      // API process should not consume jobs — let the dedicated worker process handle them
      throw new Error('processor disabled in API mode');
    }
```

Wait — that throws on every job which retries forever. Better approach: don't even register the processor in non-worker mode.

REVISED APPROACH — let the processor self-disable cleanly. Replace the guard with a constructor-time check:

```typescript
  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappCloudApiService,
    private readonly limiter: RateLimiterService,
    private readonly settings: SystemSettingsService,
  ) {
    super();
    if (process.env.WORKER_MODE !== 'true') {
      // We're in the API process — don't actually attach to the queue
      this.logger.log('BlastProcessor instantiated in API mode — no-op');
    }
  }
```

And then in the `process()` method, top:

```typescript
    if (process.env.WORKER_MODE !== 'true') return;
```

(Cleaner — the API process accepts jobs without errors but doesn't act on them. The worker process actually processes them. BullMQ's queue rebalancing means jobs eventually land on workers that complete them, so even if API briefly grabs one and no-ops, BullMQ retries it on the next available consumer.)

Actually this is racy. The cleanest answer is: register the processor ONLY in the worker module, not in the API module. Let me design a separate WorkerModule.

REVISED ARCHITECTURE (final):

- `apps/api/src/app.module.ts` — registers `BlastsModule` WITHOUT the processor (BlastsModule provides controller + service + Bull queue for enqueueing, but NOT the processor).
- `apps/api/src/worker.module.ts` — separate module that imports just what's needed (PrismaModule, WhatsappModule, SystemSettingsModule) and registers `BlastProcessor`.
- `apps/api/src/worker.ts` — bootstraps `WorkerModule` via `createApplicationContext`.

This means I need to split BlastsModule slightly. Let me restructure:

In `blasts.module.ts`, REMOVE `BlastProcessor` from providers (so the API process doesn't register it).

Create a new file `apps/api/src/blasts/blast-worker.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { PrismaModule } from '../prisma/prisma.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SystemSettingsModule } from '../system-settings/system-settings.module';
import { BLAST_QUEUE } from './blasts.service';
import { BlastProcessor } from './blast.processor';
import { RateLimiterService } from './rate-limiter.service';

@Module({
  imports: [
    PrismaModule,
    WhatsappModule,
    SystemSettingsModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: BLAST_QUEUE }),
  ],
  providers: [
    BlastProcessor,
    RateLimiterService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
  ],
})
export class BlastWorkerModule {}
```

Also create `apps/api/src/worker-app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BlastWorkerModule } from './blasts/blast-worker.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BlastWorkerModule,
  ],
})
export class WorkerAppModule {}
```

And `apps/api/src/worker.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerAppModule } from './worker-app.module';

async function bootstrap() {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerAppModule, {
    bufferLogs: false,
  });
  logger.log('Worker process started — listening for blast jobs');
  // Keep the process alive
  await new Promise<never>(() => {});
  await app.close();
}
bootstrap();
```

- [ ] **Step 3: REVISE Task 10's `apps/api/src/blasts/blasts.module.ts` to NOT include BlastProcessor**

Remove `BlastProcessor` from providers (and its import). The clean `blasts.module.ts`:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { BlastsController } from './blasts.controller';
import { BlastsService, BLAST_QUEUE } from './blasts.service';
import { RateLimiterService } from './rate-limiter.service';
import { AuthModule } from '../auth/auth.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [
    AuthModule,
    forwardRef(() => WhatsappModule),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: { url: config.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    BullModule.registerQueue({ name: BLAST_QUEUE }),
  ],
  controllers: [BlastsController],
  providers: [
    BlastsService,
    RateLimiterService,
    {
      provide: 'REDIS_CLIENT',
      inject: [ConfigService],
      useFactory: (config: ConfigService) => new Redis(config.getOrThrow<string>('REDIS_URL')),
    },
  ],
  exports: [BlastsService, RateLimiterService, 'REDIS_CLIENT', BullModule],
})
export class BlastsModule {}
```

Also remove the `WORKER_MODE` env check from `blast.processor.ts` (we don't need it anymore — the processor only exists in the worker process).

- [ ] **Step 4: Create the three files mentioned above (`blast-worker.module.ts`, `worker-app.module.ts`, `worker.ts`)** using the code shown in Step 2.

- [ ] **Step 5: Modify `apps/api/package.json` — add scripts**

Find the existing `scripts` block. Add:

```json
"dev:worker": "nest start worker --watch --entryFile worker",
"start:worker": "node dist/worker"
```

Wait — `nest start` is designed for one entry. The simpler approach with `nest-cli.json` supporting multiple entry points:

REVISED — just use `ts-node` directly for the worker:

```json
"dev:worker": "ts-node-dev --respawn --transpile-only src/worker.ts",
"start:worker": "node dist/worker"
```

Install `ts-node-dev` for fast dev reloads:

```bash
pnpm --filter api add -D ts-node-dev
```

The final scripts block:

```json
"scripts": {
  "dev": "nest start --watch",
  "dev:worker": "ts-node-dev --respawn --transpile-only src/worker.ts",
  "build": "nest build",
  "start": "node dist/main",
  "start:worker": "node dist/worker",
  "test": "jest",
  "test:watch": "jest --watch",
  "lint": "eslint \"src/**/*.ts\"",
  "db:migrate": "prisma migrate dev",
  "db:seed": "ts-node prisma/seed.ts",
  "db:generate": "prisma generate"
}
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src apps/api/package.json pnpm-lock.yaml
git commit -m "feat(blasts): add separate worker process entry point with BlastWorkerModule"
```

---

## Task 12: Webhook Controller — Handle `messages` Events

**Files:**
- Create: `apps/api/src/whatsapp/dto/meta-message-event.dto.ts`
- Modify: `apps/api/src/whatsapp/webhook.controller.ts` — route `messages` field events
- Create: a new method on `TemplatesService`? No — message events are blast concerns. Add `applyMetaMessageEvent` to `BlastsService`.
- Modify: `apps/api/src/blasts/blasts.service.ts` — add `applyMetaMessageEvent` method
- Modify: `apps/api/src/whatsapp/whatsapp.module.ts` — `forwardRef(() => BlastsModule)`
- Modify: `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts` — add tests for messages event handling

- [ ] **Step 1: Create `apps/api/src/whatsapp/dto/meta-message-event.dto.ts`**

```typescript
export interface MetaMessageStatusEvent {
  id: string;                                // wamid of the message
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;                         // unix epoch seconds, as string
  recipient_id: string;                      // phone number
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export interface MetaMessagesValue {
  messaging_product: 'whatsapp';
  metadata: { display_phone_number: string; phone_number_id: string };
  statuses?: MetaMessageStatusEvent[];
  messages?: Array<{
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
  }>;
}
```

- [ ] **Step 2: Add `applyMetaMessageEvent` to `BlastsService`**

First, add this import at the top of `apps/api/src/blasts/blasts.service.ts` (alongside existing imports):

```typescript
import { MetaMessageStatusEvent } from '../whatsapp/dto/meta-message-event.dto';
```

(`Prisma` is already imported in Task 8.)

Append this method to the existing `BlastsService` class:

```typescript
  async applyMetaMessageEvent(status: MetaMessageStatusEvent): Promise<void> {
    const message = await this.prisma.message.findUnique({ where: { metaMessageId: status.id } });
    if (!message) {
      this.logger.warn(`Webhook for unknown meta_message_id=${status.id}`);
      return;
    }

    const map: Record<string, 'DELIVERED' | 'READ' | 'FAILED'> = {
      delivered: 'DELIVERED',
      read: 'READ',
      failed: 'FAILED',
    };
    const newStatus = map[status.status];
    if (!newStatus) return; // ignore "sent" (we already set SENT locally)

    const data: Prisma.MessageUpdateInput = { status: newStatus };
    if (newStatus === 'DELIVERED') data.deliveredAt = new Date();
    if (newStatus === 'READ') data.readAt = new Date();
    if (newStatus === 'FAILED' && status.errors?.length) {
      data.errorCode = String(status.errors[0].code);
      data.errorMessage = status.errors[0].title;
    }

    await this.prisma.message.update({ where: { id: message.id }, data });

    // Persist raw event for the audit trail
    await this.prisma.messageEvent.create({
      data: {
        messageId: message.id,
        metaEventType: status.status,
        payloadJson: status as unknown as Prisma.InputJsonValue,
      },
    });
  }
```

- [ ] **Step 3: Modify `apps/api/src/whatsapp/webhook.controller.ts` — route `messages` field**

Change the constructor to inject `BlastsService` as well:

```typescript
import { BlastsService } from '../blasts/blasts.service';
import { MetaMessagesValue } from './dto/meta-message-event.dto';

// inside the class:
  constructor(
    private readonly config: ConfigService,
    private readonly templates: TemplatesService,
    private readonly blasts: BlastsService,
  ) {}
```

Change the loop body in `receive()` to handle the new field:

```typescript
    for (const entry of body.entry ?? []) {
      for (const change of entry.changes ?? []) {
        if (change.field === 'message_template_status_update') {
          await this.templates.applyMetaTemplateUpdate(change.value as any);
        } else if (change.field === 'messages') {
          const value = change.value as unknown as MetaMessagesValue;
          for (const status of value.statuses ?? []) {
            await this.blasts.applyMetaMessageEvent(status);
          }
        } else {
          this.logger.log(`Ignoring webhook field=${change.field}`);
        }
      }
    }
```

- [ ] **Step 4: Modify `apps/api/src/whatsapp/whatsapp.module.ts` to import BlastsModule with forwardRef**

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappCloudApiService } from './whatsapp-cloud-api.service';
import { WebhookController } from './webhook.controller';
import { TemplatesModule } from '../templates/templates.module';
import { BlastsModule } from '../blasts/blasts.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => TemplatesModule),
    forwardRef(() => BlastsModule),
  ],
  controllers: [WebhookController],
  providers: [WhatsappCloudApiService],
  exports: [WhatsappCloudApiService],
})
export class WhatsappModule {}
```

- [ ] **Step 5: Add tests to `apps/api/src/whatsapp/__tests__/webhook.controller.spec.ts`**

Add `BlastsService` to the imports + providers. In the mock setup, add `blasts: { applyMetaMessageEvent: jest.fn() }`. Add this test inside the existing `POST /webhooks/meta (event)` describe block:

```typescript
    it('routes messages.status events to BlastsService', async () => {
      const body = {
        object: 'whatsapp_business_account' as const,
        entry: [{
          id: 'waba-1',
          changes: [{
            field: 'messages',
            value: {
              messaging_product: 'whatsapp' as const,
              metadata: { display_phone_number: '+60123456789', phone_number_id: 'pnid' },
              statuses: [{
                id: 'wamid.abc',
                status: 'delivered' as const,
                timestamp: '1234567890',
                recipient_id: '60198765432',
              }],
            },
          }],
        }],
      };
      const raw = Buffer.from(JSON.stringify(body));
      const signature = sign(raw.toString('utf8'));

      await controller.receive(signature, body as any, { rawBody: raw } as any);

      expect(blasts.applyMetaMessageEvent).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'wamid.abc', status: 'delivered' }),
      );
    });
```

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/whatsapp apps/api/src/blasts/blasts.service.ts
git commit -m "feat(blasts): handle Meta message status webhooks (delivered/read/failed)"
```

---

## Task 13: Seed Updates — APPROVED Test Template + System Settings

**Files:**
- Modify: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Update `apps/api/prisma/seed.ts`**

Append, INSIDE the existing `main()` function, AFTER sample contacts seeding:

```typescript
  // Seed an APPROVED test template so Phase 4 E2E can blast against it
  const existingTemplate = await prisma.template.findFirst({ where: { name: 'sample_promo_2026' } });
  if (!existingTemplate) {
    await prisma.template.create({
      data: {
        name: 'sample_promo_2026',
        version: 1,
        language: 'EN',
        category: 'MARKETING',
        bodyText: 'Hello {{1}}! Check out our promo.',
        footerText: 'Reply STOP to unsubscribe',
        variables: ['customer_name'],
        status: 'APPROVED',
        metaTemplateId: 'seed-fake-meta-id-en',
        submittedAt: new Date(),
        approvedAt: new Date(),
        createdById: admin!.id,
      },
    });
    await prisma.template.create({
      data: {
        name: 'sample_promo_2026',
        version: 1,
        language: 'MS',
        category: 'MARKETING',
        bodyText: 'Salam {{1}}! Lihat promosi kami.',
        footerText: 'Balas STOP untuk berhenti',
        variables: ['customer_name'],
        status: 'APPROVED',
        metaTemplateId: 'seed-fake-meta-id-ms',
        submittedAt: new Date(),
        approvedAt: new Date(),
        createdById: admin!.id,
      },
    });
    console.log('Seeded sample APPROVED template "sample_promo_2026" (EN + MS).');
  } else {
    console.log('Sample template already exists — skipping.');
  }

  // Seed default system settings
  const tier = await prisma.systemSetting.findUnique({ where: { key: 'current_messaging_tier' } });
  if (!tier) {
    await prisma.systemSetting.create({ data: { key: 'current_messaging_tier', value: 'TIER_1' } });
    console.log('Seeded current_messaging_tier = TIER_1.');
  }
```

NOTE: The existing seed code stored the admin user in a `let admin = ...` variable. Confirm that the new code reuses that variable correctly. If admin was assigned only inside the IF branch, refactor to ensure `admin` is in scope after the `if` block (the existing seed already does this).

- [ ] **Step 2: Run the seed locally to verify (this is the only verification we run for this task)**

```bash
pnpm --filter api db:seed
```

Expected: "Sample template already exists — skipping" OR "Seeded sample APPROVED template" on first run. Also "Seeded current_messaging_tier" on first run.

- [ ] **Step 3: Commit**

```bash
git add apps/api/prisma/seed.ts
git commit -m "feat(seed): add APPROVED sample template + default system settings"
```

---

## Task 14: Frontend Blasts API Client

**Files:**
- Create: `apps/web/src/api/blasts.ts`

- [ ] **Step 1: Create `apps/web/src/api/blasts.ts`**

```typescript
import { api } from './client';
import type { LanguagePreference } from './contacts';

export type BlastStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'COMPLETED' | 'CANCELED' | 'FAILED';
export type MessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED' | 'CANCELED';

export interface Blast {
  id: string;
  name: string;
  templateName: string;
  defaultLanguage: LanguagePreference;
  segmentId: string | null;
  recipientSnapshot: string[];
  variableMapping: Record<string, string>;
  scheduledAt: string;
  status: BlastStatus;
  totalRecipients: number;
  createdById: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface BlastStats {
  id: string;
  status: BlastStatus;
  totalRecipients: number;
  counts: Record<MessageStatus, number>;
  startedAt: string | null;
  completedAt: string | null;
}

export interface CreateBlastInput {
  name: string;
  templateName: string;
  defaultLanguage: LanguagePreference;
  segmentId?: string;
  variableMapping: Record<string, string>;
  scheduledAt: string; // ISO
}

export async function listBlasts(status?: BlastStatus[]): Promise<Blast[]> {
  const { data } = await api.get<Blast[]>('/blasts', {
    params: status?.length ? { status } : undefined,
    paramsSerializer: { indexes: null },
  });
  return data;
}

export async function getBlast(id: string): Promise<Blast> {
  const { data } = await api.get<Blast>(`/blasts/${id}`);
  return data;
}

export async function getBlastStats(id: string): Promise<BlastStats> {
  const { data } = await api.get<BlastStats>(`/blasts/${id}/stats`);
  return data;
}

export async function createBlast(input: CreateBlastInput): Promise<Blast> {
  const { data } = await api.post<Blast>('/blasts', input);
  return data;
}

export async function cancelBlast(id: string): Promise<Blast> {
  const { data } = await api.post<Blast>(`/blasts/${id}/cancel`);
  return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web/src/api/blasts.ts
git commit -m "feat(web): add blasts API client"
```

---

## Task 15: Frontend Blasts List Page

**Files:**
- Create: `apps/web/src/pages/Blasts.tsx`, `apps/web/src/components/BlastStatusBadge.tsx`
- Modify: `apps/web/src/App.tsx` — add /blasts route
- Modify: `apps/web/src/components/Layout.tsx` — add Blasts nav link

- [ ] **Step 1: Create `apps/web/src/components/BlastStatusBadge.tsx`**

```tsx
import type { BlastStatus } from '../api/blasts';

const STYLES: Record<BlastStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SCHEDULED: 'bg-blue-100 text-blue-800',
  RUNNING: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELED: 'bg-gray-200 text-gray-500',
  FAILED: 'bg-red-100 text-red-800',
};

export default function BlastStatusBadge({ status }: { status: BlastStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${STYLES[status]}`}
      data-testid={`blast-status-${status}`}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 2: Create `apps/web/src/pages/Blasts.tsx`**

```tsx
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { listBlasts, type Blast } from '../api/blasts';
import BlastStatusBadge from '../components/BlastStatusBadge';

export default function Blasts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['blasts'],
    queryFn: () => listBlasts(),
  });

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Blasts</h1>
        <Link to="/blasts/new" className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm font-medium" data-testid="new-blast">
          + New Blast
        </Link>
      </section>

      <section>
        {isLoading && <p>Loading…</p>}
        {error && <p className="text-red-600">Failed to load blasts.</p>}
        {data && data.length === 0 && (
          <p className="text-gray-500">No blasts yet. Create your first one to start sending.</p>
        )}
        {data && data.length > 0 && (
          <div className="space-y-2" data-testid="blasts-list">
            {data.map((b: Blast) => (
              <Link
                key={b.id}
                to={`/blasts/${b.id}`}
                className="block bg-white p-4 rounded shadow-sm hover:bg-gray-50"
                data-testid={`blast-row-${b.id}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{b.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {b.templateName} · {b.totalRecipients} recipients · scheduled {new Date(b.scheduledAt).toLocaleString()}
                    </div>
                  </div>
                  <BlastStatusBadge status={b.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
```

- [ ] **Step 3: Modify `apps/web/src/App.tsx`** — add `import Blasts` and a `/blasts` route alongside the others (place after `/templates/:name`).

```tsx
<Route
  path="/blasts"
  element={
    <ProtectedRoute>
      <Layout><Blasts /></Layout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 4: Modify `apps/web/src/components/Layout.tsx`** — add a Blasts nav link after Templates:

```tsx
<Link to="/templates" className="text-sm text-gray-700">Templates</Link>
<Link to="/blasts" className="text-sm text-gray-700">Blasts</Link>
{user?.role === 'ADMIN' && (
  <Link to="/settings" className="text-sm text-gray-700">Settings</Link>
)}
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/components/BlastStatusBadge.tsx apps/web/src/pages/Blasts.tsx apps/web/src/App.tsx apps/web/src/components/Layout.tsx
git commit -m "feat(web): add blasts list page with status badges"
```

---

## Task 16: Frontend Blast Wizard (Create Flow)

**Files:**
- Create: `apps/web/src/pages/BlastWizard.tsx`
- Modify: `apps/web/src/App.tsx` — add `/blasts/new` route

- [ ] **Step 1: Create `apps/web/src/pages/BlastWizard.tsx`**

This is a single-page form (not a true multi-step wizard with separate URLs). It has 4 sections shown in sequence, with a top-of-page step indicator. Keeping it on one page simplifies state management.

```tsx
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { listTemplates, type Template } from '../api/templates';
import { listSegments, type Segment } from '../api/segments';
import { createBlast, type CreateBlastInput } from '../api/blasts';
import type { LanguagePreference } from '../api/contacts';

export default function BlastWizard() {
  const navigate = useNavigate();

  const { data: templates } = useQuery({
    queryKey: ['templates', 'approved'],
    queryFn: () => listTemplates({ status: ['APPROVED'] }),
  });
  const { data: segments } = useQuery({ queryKey: ['segments'], queryFn: listSegments });

  const [name, setName] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [defaultLanguage, setDefaultLanguage] = useState<LanguagePreference>('EN');
  const [segmentId, setSegmentId] = useState<string>('');
  const [variableMapping, setVariableMapping] = useState<Record<string, string>>({});
  const [scheduledAt, setScheduledAt] = useState<string>(new Date(Date.now() + 60 * 1000).toISOString().slice(0, 16));
  const [error, setError] = useState<string | null>(null);

  // Group approved templates by name
  const templateGroups: Record<string, Template[]> = {};
  for (const t of templates ?? []) {
    (templateGroups[t.name] ??= []).push(t);
  }
  const selectedGroup = templateName ? templateGroups[templateName] : undefined;
  const availableLanguages = selectedGroup?.map((t) => t.language) ?? [];
  const variables = selectedGroup?.[0]?.variables ?? [];

  const create = useMutation({
    mutationFn: createBlast,
    onSuccess: (blast) => navigate(`/blasts/${blast.id}`),
    onError: (e: unknown) => setError(extractMessage(e)),
  });

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const input: CreateBlastInput = {
      name,
      templateName,
      defaultLanguage,
      segmentId: segmentId || undefined,
      variableMapping,
      scheduledAt: new Date(scheduledAt).toISOString(),
    };
    create.mutate(input);
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">New Blast</h1>

      <form onSubmit={onSubmit} className="bg-white p-6 rounded shadow-sm space-y-6" data-testid="blast-wizard">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. Name your blast</h2>
          <input
            type="text" required value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Hari Raya 2026 promo"
            className="w-full border rounded px-3 py-2"
            data-testid="blast-name"
          />
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Pick an approved template</h2>
          <select
            required value={templateName}
            onChange={(e) => { setTemplateName(e.target.value); setVariableMapping({}); }}
            className="w-full border rounded px-3 py-2"
            data-testid="blast-template"
          >
            <option value="">— select a template —</option>
            {Object.keys(templateGroups).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {availableLanguages.length > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              Languages available: {availableLanguages.join(', ')}
            </div>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Default language for contacts without preference</h2>
          <select
            value={defaultLanguage}
            onChange={(e) => setDefaultLanguage(e.target.value as LanguagePreference)}
            className="w-full border rounded px-3 py-2"
            data-testid="blast-default-language"
          >
            {availableLanguages.length > 0
              ? availableLanguages.map((l) => (<option key={l} value={l}>{l}</option>))
              : ['EN','MS','ZH','TA','OTHER'].map((l) => (<option key={l} value={l}>{l}</option>))}
          </select>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Audience</h2>
          <select
            value={segmentId}
            onChange={(e) => setSegmentId(e.target.value)}
            className="w-full border rounded px-3 py-2"
            data-testid="blast-segment"
          >
            <option value="">All opted-in contacts</option>
            {segments?.map((s: Segment) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </section>

        {variables.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-2">5. Variable mapping</h2>
            <div className="space-y-2">
              {variables.map((v, idx) => {
                const num = String(idx + 1);
                return (
                  <div key={num} className="flex items-center gap-2 text-sm">
                    <code className="bg-gray-100 px-2 py-0.5 rounded">{'{{'}{num}{'}}'} ({v})</code>
                    <select
                      value={variableMapping[num] ?? ''}
                      onChange={(e) => setVariableMapping({ ...variableMapping, [num]: e.target.value })}
                      className="border rounded px-2 py-1.5 flex-1"
                      data-testid={`variable-${num}`}
                    >
                      <option value="">— pick a source —</option>
                      <option value="contact.name">contact.name</option>
                      <option value="contact.city">contact.city</option>
                      <option value="contact.state">contact.state</option>
                      <option value="literal:Customer">literal: "Customer"</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-lg font-semibold mb-2">6. Schedule</h2>
          <input
            type="datetime-local" required value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="border rounded px-3 py-2"
            data-testid="blast-scheduled-at"
          />
          <p className="text-xs text-gray-500 mt-1">Set in the past or now to send immediately.</p>
        </section>

        {error && <p className="text-sm text-red-600" data-testid="blast-form-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => navigate('/blasts')} className="text-gray-600 px-3 py-1.5">
            Cancel
          </button>
          <button
            type="submit"
            disabled={create.isPending || !name || !templateName}
            className="bg-indigo-600 text-white px-4 py-1.5 rounded font-medium disabled:opacity-50"
            data-testid="blast-create"
          >
            {create.isPending ? 'Creating…' : 'Schedule blast'}
          </button>
        </div>
      </form>
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

- [ ] **Step 2: Modify `apps/web/src/App.tsx`** — add `import BlastWizard` and the route `/blasts/new` BEFORE `/blasts/:id`:

```tsx
<Route
  path="/blasts/new"
  element={
    <ProtectedRoute>
      <Layout><BlastWizard /></Layout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/BlastWizard.tsx apps/web/src/App.tsx
git commit -m "feat(web): add blast wizard for scheduling new blasts"
```

---

## Task 17: Frontend Blast Detail Page with Live Polling

**Files:**
- Create: `apps/web/src/pages/BlastDetail.tsx`
- Modify: `apps/web/src/App.tsx` — add `/blasts/:id` route

- [ ] **Step 1: Create `apps/web/src/pages/BlastDetail.tsx`**

```tsx
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cancelBlast, getBlast, getBlastStats, type BlastStatus } from '../api/blasts';
import BlastStatusBadge from '../components/BlastStatusBadge';

const ACTIVE_STATUSES: BlastStatus[] = ['SCHEDULED', 'RUNNING'];

export default function BlastDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: blast } = useQuery({
    queryKey: ['blast', id],
    queryFn: () => getBlast(id!),
    refetchInterval: (q) => (q.state.data && ACTIVE_STATUSES.includes(q.state.data.status) ? 5000 : false),
  });

  const { data: stats } = useQuery({
    queryKey: ['blast-stats', id],
    queryFn: () => getBlastStats(id!),
    refetchInterval: (q) => (q.state.data && ACTIVE_STATUSES.includes(q.state.data.status) ? 5000 : false),
  });

  const cancel = useMutation({
    mutationFn: () => cancelBlast(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['blast', id] });
      qc.invalidateQueries({ queryKey: ['blast-stats', id] });
      qc.invalidateQueries({ queryKey: ['blasts'] });
    },
  });

  if (!blast || !stats) return <p>Loading…</p>;

  const counts = stats.counts;
  const delivered = counts.DELIVERED + counts.READ;
  const sent = counts.SENT + counts.DELIVERED + counts.READ;
  const failed = counts.FAILED;
  const pct = (n: number) => Math.round((n / Math.max(1, stats.totalRecipients)) * 100);

  return (
    <div className="space-y-6">
      <section className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{blast.name}</h1>
          <div className="text-sm text-gray-500 mt-1">
            Template: <code>{blast.templateName}</code> · Scheduled: {new Date(blast.scheduledAt).toLocaleString()}
          </div>
        </div>
        <BlastStatusBadge status={blast.status} />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-3" data-testid="blast-counters">
        <Counter label="Total" value={stats.totalRecipients} tone="indigo" />
        <Counter label="Sent" value={sent} pct={pct(sent)} tone="blue" testId="counter-sent" />
        <Counter label="Delivered" value={delivered} pct={pct(delivered)} tone="green" testId="counter-delivered" />
        <Counter label="Read" value={counts.READ} pct={pct(counts.READ)} tone="purple" testId="counter-read" />
        <Counter label="Failed" value={failed} pct={pct(failed)} tone="red" testId="counter-failed" />
      </section>

      {ACTIVE_STATUSES.includes(blast.status) && (
        <section className="bg-white p-4 rounded shadow-sm">
          <h2 className="text-sm font-medium text-gray-600 mb-2">Live progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all"
              style={{ width: `${pct(sent + counts.CANCELED + failed)}%` }}
              data-testid="progress-bar"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Polling every 5 seconds. The page will stop polling once the blast completes.</p>
        </section>
      )}

      <section className="flex justify-end gap-2">
        <button type="button" onClick={() => navigate('/blasts')} className="text-gray-600 px-3 py-1.5">
          Back
        </button>
        {ACTIVE_STATUSES.includes(blast.status) && (
          <button
            type="button"
            onClick={() => { if (window.confirm('Cancel this blast? Already-sent messages cannot be unsent.')) cancel.mutate(); }}
            disabled={cancel.isPending}
            className="text-red-600 border border-red-300 px-3 py-1.5 rounded disabled:opacity-50"
            data-testid="blast-cancel"
          >
            {cancel.isPending ? 'Canceling…' : 'Cancel blast'}
          </button>
        )}
      </section>
    </div>
  );
}

function Counter({
  label, value, pct, tone, testId,
}: {
  label: string; value: number; pct?: number; tone: 'indigo' | 'blue' | 'green' | 'purple' | 'red';
  testId?: string;
}) {
  const styles: Record<typeof tone, string> = {
    indigo: 'bg-indigo-50 text-indigo-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`p-3 rounded text-center ${styles[tone]}`} data-testid={testId}>
      <div className="text-2xl font-bold">{value.toLocaleString()}</div>
      <div className="text-xs">{label}{pct !== undefined ? ` (${pct}%)` : ''}</div>
    </div>
  );
}
```

- [ ] **Step 2: Modify `apps/web/src/App.tsx`** — add `import BlastDetail` and the route `/blasts/:id` AFTER `/blasts/new`:

```tsx
<Route
  path="/blasts/:id"
  element={
    <ProtectedRoute>
      <Layout><BlastDetail /></Layout>
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/BlastDetail.tsx apps/web/src/App.tsx
git commit -m "feat(web): add blast detail page with live polling stats and cancel"
```

---

## Task 18: E2E Smoke Test

**Files:**
- Create: `e2e/tests/blasts.spec.ts`

- [ ] **Step 1: Create `e2e/tests/blasts.spec.ts`**

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

test.describe('Blasts smoke', () => {
  test('admin schedules a blast and sees progress in detail page', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Blasts' }).click();
    await page.getByTestId('new-blast').click();

    const blastName = `E2E Blast ${Date.now()}`;
    await page.getByTestId('blast-name').fill(blastName);
    // The seeded sample_promo_2026 template (APPROVED) is the only option
    await page.getByTestId('blast-template').selectOption('sample_promo_2026');
    // Variable mapping for the single variable
    await page.getByTestId('variable-1').selectOption('contact.name');
    // Audience defaults to "all opted-in contacts"
    // Schedule is pre-filled with now+1min
    await page.getByTestId('blast-create').click();

    // Land on detail page
    await expect(page.getByText(blastName)).toBeVisible();
    await expect(page.getByTestId('blast-counters')).toBeVisible();

    // Wait up to 30s for the blast to progress past SCHEDULED (worker should pick it up after the 1min delay — but with mock mode, sending is instant once delay elapses)
    // For the test, we just verify the counter UI renders. Full status check is unreliable due to scheduling jitter.
    await expect(page.getByTestId('counter-sent')).toBeVisible();
  });

  test('blasts list shows recent blasts', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Blasts' }).click();
    // Either empty state or list — both are valid; just check the heading
    await expect(page.getByRole('heading', { name: 'Blasts' })).toBeVisible();
  });
});
```

NOTE: This test schedules a blast for `now + 1 minute`. By the time the test queries the detail page, the blast may still be SCHEDULED (not yet running). That's fine — the test just verifies the UI loads and counters render. The full status progression is exercised manually.

- [ ] **Step 2: Commit**

```bash
git add e2e/tests/blasts.spec.ts
git commit -m "test(e2e): add blasts smoke tests"
```

---

## Task 19: Documentation + Final Verification

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update `README.md` — Add Phase 4 section + Update "Run dev" to mention worker**

Find the "Phase 3 — what's done" section. Insert "Phase 4 — what's done" after it:

```markdown
## Phase 4 — what's done

- Blast scheduling: `Blast` row + one `Message` per recipient per blast
- BullMQ queue + separate worker process (`apps/api/src/worker.ts`)
- Throttling: per-second rate via BullMQ concurrency + 24h tier via Redis sliding window
- Language selection per recipient (uses contact.languagePreference, falls back to blast default)
- Variable rendering (`{{1}}` etc.) from contact fields or literal values
- Webhook handler now also processes `messages.statuses` events (delivered/read/failed)
- Mid-flight cancellation: drains BullMQ delayed/waiting jobs + marks QUEUED messages CANCELED
- React pages: `/blasts` list, `/blasts/new` wizard, `/blasts/:id` detail with 5-second live polling and cancel button
- Seeded APPROVED test template (`sample_promo_2026` EN + MS) so blasts work in mock mode
```

Remove "Phase 4: blast engine" from the "Coming in later phases" line.

Find the "Run dev" section and replace with:

```markdown
## Run dev

You need 3 terminals (API + worker + web):

```bash
# Terminal 1 — API on http://localhost:3000
pnpm --filter api dev

# Terminal 2 — Worker (processes blast jobs)
pnpm --filter api dev:worker

# Terminal 3 — Web on http://localhost:5173
pnpm --filter web dev
```

Visit `http://localhost:5173` and log in with the seeded admin credentials.
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add Phase 4 README section and worker process instructions"
```

- [ ] **Step 3: FINAL VERIFICATION — full end-to-end check**

This is the only verification step for Phase 4. Run everything together:

```bash
# Reset to clean state
docker compose down -v
docker compose up -d
sleep 10

# Install + migrate + seed
pnpm install
pnpm db:migrate
pnpm db:seed
```

Expected: docker is up, migrations apply cleanly, seed creates admin + 4 contacts + 2 template variants + tier setting.

```bash
# Run all API unit tests
pnpm --filter api test
```

Expected: ~85-90 tests pass across all suites (Phase 1: 9, Phase 2: 33, Phase 3: 29, Phase 4 new: ~15-20 — variable-renderer 11, language-selector 5, rate-limiter 4, system-settings 3, blasts.controller 5, blasts.service 1, blast.processor 4, whatsapp.service 3 new for sendMessage).

```bash
# Build the web
pnpm --filter web build
```

Expected: clean tsc + vite build.

```bash
# Start all 3 dev servers in background
nohup pnpm --filter api dev > /tmp/api.log 2>&1 &
API_PID=$!
nohup pnpm --filter api dev:worker > /tmp/worker.log 2>&1 &
WORKER_PID=$!
nohup pnpm --filter web dev > /tmp/web.log 2>&1 &
WEB_PID=$!
sleep 20  # workers take a bit longer to start
```

Verify all 3 are up:
```bash
curl -s -o /dev/null -w "API: %{http_code}\n" http://localhost:3000/api/health
curl -s -o /dev/null -w "Web: %{http_code}\n" http://localhost:5173/
grep "Worker process started" /tmp/worker.log
```

Expected: API 200, Web 200, worker log shows "Worker process started — listening for blast jobs".

```bash
# Run all E2E tests
pnpm --filter e2e test

# Clean up
kill $API_PID $WORKER_PID $WEB_PID 2>/dev/null
```

Expected: 10 E2E tests pass (3 Phase 1 + 3 Phase 2 + 2 Phase 3 + 2 Phase 4).

```bash
# Manual smoke: login, schedule a blast, watch progress

# Then tag the milestone
git tag -a phase-4-complete -m "Phase 4 complete: blast engine with throttled delivery + live progress"

# Push (optional — handled by user via PR)
```

Expected: tag created. No errors.

---

## What this plan does NOT do (intentionally — comes later)

- **Reply tracking and attribution** — Phase 5 (Analytics + Replies). This phase only handles outbound + status events, not inbound replies.
- **Time-series charts** of delivery over time — Phase 5
- **Recipient CSV export** from a completed blast — Phase 5
- **Real Meta integration testing** — requires WABA registration (handled by user separately)
- **Refresh-token rotation** — Phase 6. Page reloads still drop auth state; the polling on the detail page continues to work because the access token is held in memory and the polling fetch reuses it.
- **Rate limiting on /auth/login** — Phase 6
- **Operator-role E2E coverage** — Phase 6
- **Test-send to admin phones** before firing the full blast — out of scope per spec section 16
- **Bulk-edit blasts** or **clone blast** — out of scope
- **WebSocket / SSE** for real-time updates — polling at 5s is sufficient at this scale (per spec)
- **Image/video/document template headers** — Phase 3 only supports TEXT headers; Phase 4 inherits this. Media headers add file upload complexity.

---

## Notes on Operating This in Production

When real Meta credentials land (after WABA registration), Phase 4 works against real Meta with no code changes:

1. Set `WHATSAPP_MOCK_MODE=false` in `.env`
2. Set the other 6 WHATSAPP_* keys
3. Subscribe to the `messages` webhook field in Meta Developer Console (the `message_template_status_update` subscription from Phase 3 stays)
4. Update `current_messaging_tier` in system_settings as Meta promotes your number through the tier ladder

In production deployment (Phase 6 polish or AWS migration):

- Run the **API process** and the **worker process** as two separate ECS services / Render workers / etc.
- They share the same Docker image but run different commands: `node dist/main` vs `node dist/worker`
- Both connect to the same Postgres and Redis
- Scale workers horizontally if blast volume grows (BullMQ supports multiple concurrent consumers — concurrency is set per-process via the `@Processor` decorator's `concurrency: 80`)
