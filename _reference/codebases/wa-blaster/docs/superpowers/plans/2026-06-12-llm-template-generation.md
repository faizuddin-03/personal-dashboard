# LLM Template Generation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mocked `generateTemplateDrafts` with a real `qwen3:14b` call served by Ollama, selected at runtime by an `LLM_PROVIDER` factory, with a one-retry-then-fail backend and a frontend that routes to the manual template form on failure.

**Architecture:** A new `OllamaLlmService extends LlmService` calls Ollama's native `/api/chat` with a JSON-schema `format` and `think:false`, parses/normalizes the result, and retries once before throwing `ServiceUnavailableException`. It delegates `generateReply`/`classifyIntent` to the existing `MockLlmService`. `LlmModule` swaps its fixed `useClass` binding for a factory keyed on `LLM_PROVIDER` (default `mock`). The wizard's generate-failure handler routes the user to `/templates/new`.

**Tech Stack:** NestJS 10, TypeScript, axios, Jest + `nock` (backend); React 18 + React Query + React Router (frontend); Ollama (qwen3:14b).

---

## File Structure

**Backend (`apps/api/`)**
- Create `src/llm/ollama-llm.service.ts` — the real provider; Ollama call + parse/normalize/retry; delegates reply/intent to the mock.
- Create `src/llm/__tests__/ollama-llm.service.spec.ts` — unit tests (nock-mocked HTTP).
- Modify `src/llm/llm.module.ts` — export a `llmServiceFactory`; bind `LlmService` via `useFactory`.
- Create `src/llm/__tests__/llm.module.spec.ts` — factory selection test.
- Modify `.env.example` — document the four new env vars.

**Frontend (`apps/web/`)**
- Modify `src/components/TemplatesAIWizard.tsx` — add `onGenerateFailed` prop; call it from `generateMut.onError`.
- Modify `src/pages/Templates.tsx` — wire `onGenerateFailed` to close the wizard and navigate to `/templates/new`.

**Untouched:** `mock-llm.service.ts`, `templates.service.ts`, `templates.controller.ts` (the service already throws on LLM failure → controller returns the error → wizard `onError` fires).

---

## Task 1: `OllamaLlmService` (provider + drafting logic)

**Files:**
- Create: `apps/api/src/llm/ollama-llm.service.ts`
- Test: `apps/api/src/llm/__tests__/ollama-llm.service.spec.ts`

> Run all commands in this task from the `apps/api/` directory.

- [ ] **Step 1: Write the failing test file**

Create `apps/api/src/llm/__tests__/ollama-llm.service.spec.ts`:

```ts
import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { OllamaLlmService } from '../ollama-llm.service';
import { MockLlmService } from '../mock-llm.service';

const BASE = 'http://localhost:11434';

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const merged: Record<string, string> = {
    OLLAMA_BASE_URL: BASE,
    OLLAMA_TEMPLATE_MODEL: 'qwen3:14b',
    OLLAMA_TIMEOUT_MS: '60000',
    ...overrides,
  };
  return {
    get: (key: string, fallback?: string) => merged[key] ?? fallback,
  } as unknown as ConfigService;
}

function makeService(overrides: Record<string, string> = {}) {
  return new OllamaLlmService(makeConfig(overrides), new MockLlmService());
}

// Shapes an Ollama /api/chat reply whose message.content is the JSON string
// the model emits under the structured-output `format`.
function chatReply(drafts: unknown) {
  return {
    model: 'qwen3:14b',
    message: { role: 'assistant', content: JSON.stringify({ drafts }) },
    done: true,
  };
}

const GOOD_EN_DRAFTS = [
  {
    language: 'EN',
    name: 'insurance_renewal_a',
    category: 'UTILITY',
    body: 'Hi {{1}}, your insurance for {{2}} expires soon. Reply to renew.',
    variables: ['name', 'plate'],
    approvalLikelihood: 'HIGH',
    rationale: 'Transactional wording fits Utility.',
  },
  {
    language: 'EN',
    name: 'insurance_renewal_b',
    category: 'MARKETING',
    body: 'Hi {{1}}! Renew {{2}} with eAuto in minutes and save.',
    variables: ['name', 'plate'],
    approvalLikelihood: 'MEDIUM',
    rationale: 'Promotional framing, Marketing category.',
  },
];

describe('OllamaLlmService', () => {
  afterEach(() => nock.cleanAll());

  describe('generateTemplateDrafts', () => {
    it('sends a non-streaming, thinking-off, schema-constrained request', async () => {
      const service = makeService();
      const scope = nock(BASE)
        .post(
          '/api/chat',
          (body) =>
            body.model === 'qwen3:14b' &&
            body.stream === false &&
            body.think === false &&
            !!body.format &&
            Array.isArray(body.messages) &&
            body.messages.length === 2,
        )
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      const drafts = await service.generateTemplateDrafts({
        brief: 'insurance renewal reminder',
        languages: ['EN'],
        tone: 'friendly',
      });

      expect(scope.isDone()).toBe(true);
      expect(drafts).toHaveLength(2);
      expect(drafts[0].name).toBe('insurance_renewal_a');
      expect(drafts[0].category).toBe('UTILITY');
    });

    it('uses the model name from OLLAMA_TEMPLATE_MODEL', async () => {
      const service = makeService({ OLLAMA_TEMPLATE_MODEL: 'qwen2.5:14b' });
      const scope = nock(BASE)
        .post('/api/chat', (body) => body.model === 'qwen2.5:14b')
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      await service.generateTemplateDrafts({ brief: 'x', languages: ['EN'], tone: 'formal' });
      expect(scope.isDone()).toBe(true);
    });

    it('normalizes bad enums and slugs, and drops unrequested languages', async () => {
      const service = makeService();
      nock(BASE)
        .post('/api/chat')
        .reply(
          200,
          chatReply([
            {
              language: 'EN',
              name: 'Insurance Renewal!!', // not a valid slug
              category: 'promo', // not a valid enum
              body: 'Hi {{1}}',
              variables: ['name'],
              approvalLikelihood: 'pretty good', // not a valid enum
              rationale: 'r',
            },
            {
              language: 'FR', // not requested → dropped
              name: 'french_one',
              category: 'MARKETING',
              body: 'Bonjour {{1}}',
              variables: ['name'],
              approvalLikelihood: 'HIGH',
              rationale: 'r',
            },
          ]),
        );

      const drafts = await service.generateTemplateDrafts({
        brief: 'renewal',
        languages: ['EN'],
        tone: 'friendly',
      });

      expect(drafts).toHaveLength(1);
      expect(drafts[0].language).toBe('EN');
      expect(drafts[0].name).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(drafts[0].category).toBe('UTILITY'); // fallback
      expect(drafts[0].approvalLikelihood).toBe('MEDIUM'); // fallback
    });

    it('retries once on a transient failure, then succeeds', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').reply(500, 'boom'); // attempt 1
      const ok = nock(BASE).post('/api/chat').reply(200, chatReply(GOOD_EN_DRAFTS)); // attempt 2

      const drafts = await service.generateTemplateDrafts({
        brief: 'renewal',
        languages: ['EN'],
        tone: 'friendly',
      });

      expect(drafts).toHaveLength(2);
      expect(ok.isDone()).toBe(true);
    });

    it('throws ServiceUnavailableException after two failures', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').twice().reply(200, { message: { content: 'not json' } });

      await expect(
        service.generateTemplateDrafts({ brief: 'x', languages: ['EN'], tone: 'friendly' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('delegation to the mock', () => {
    it('classifyIntent matches MockLlmService', async () => {
      const service = makeService();
      const r = await service.classifyIntent({
        message: 'I need a credit topup please',
        intents: ['credit_topup', 'complaint'],
      });
      expect(r.intent).toBe('credit_topup');
    });

    it('generateReply matches MockLlmService', async () => {
      const service = makeService();
      const r = await service.generateReply({
        message: 'how do I renew?',
        knowledge: [{ question: 'renew?', answer: 'Use eAuto.' }],
      });
      expect(r.text).toBe('Use eAuto.');
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- ollama-llm.service.spec`
Expected: FAIL — `Cannot find module '../ollama-llm.service'`.

- [ ] **Step 3: Implement the service**

Create `apps/api/src/llm/ollama-llm.service.ts`:

```ts
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { LlmService } from './llm.service';
import { MockLlmService } from './mock-llm.service';
import {
  ApprovalLikelihood,
  ClassifyIntentInput,
  ClassifyIntentResult,
  GenerateReplyInput,
  GenerateReplyResult,
  GenerateTemplateDraftsInput,
  TemplateDraft,
} from './llm.types';

const LANG_NAMES: Record<string, string> = {
  EN: 'English',
  MS: 'Bahasa Malaysia',
  ZH: 'Chinese (Simplified)',
  TA: 'Tamil',
  OTHER: 'English',
};

const CATEGORIES = ['MARKETING', 'UTILITY', 'AUTHENTICATION'] as const;
const LIKELIHOODS: ApprovalLikelihood[] = ['HIGH', 'MEDIUM', 'LOW'];

// JSON schema handed to Ollama's `format` for structured output.
const TEMPLATE_DRAFTS_SCHEMA = {
  type: 'object',
  properties: {
    drafts: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          language: { type: 'string' },
          name: { type: 'string' },
          category: { type: 'string', enum: [...CATEGORIES] },
          body: { type: 'string' },
          variables: { type: 'array', items: { type: 'string' } },
          approvalLikelihood: { type: 'string', enum: [...LIKELIHOODS] },
          rationale: { type: 'string' },
        },
        required: ['language', 'name', 'category', 'body', 'variables', 'approvalLikelihood', 'rationale'],
      },
    },
  },
  required: ['drafts'],
};

const SYSTEM_PROMPT = [
  'You are a WhatsApp Business message-template copywriter for eAuto, a vehicle-insurance',
  'renewal platform used by car dealers in Malaysia.',
  'For the given brief you produce ready-to-submit WhatsApp template drafts.',
  'Rules:',
  '- Produce EXACTLY 2 drafts per requested language, with different approvalLikelihood',
  '  (e.g. one safe transactional UTILITY option and one warmer MARKETING option).',
  '- Localise each language naturally — never a word-for-word translation.',
  '- Honour the requested tone.',
  '- Use {{1}}, {{2}} … placeholders in the body; their order must match the variables array.',
  '- Keep each body at most 1024 characters.',
  '- Choose the Meta category by intent: transactional → UTILITY, promotional → MARKETING,',
  '  one-time codes → AUTHENTICATION.',
  '- name is a lowercase snake_case slug derived from the brief (letters, digits, underscores).',
  '- rationale is a single sentence explaining the approval-likelihood call.',
].join('\n');

function coerceCategory(raw: unknown): string {
  const up = String(raw ?? '').toUpperCase();
  return (CATEGORIES as readonly string[]).includes(up) ? up : 'UTILITY';
}

function coerceLikelihood(raw: unknown): ApprovalLikelihood {
  const up = String(raw ?? '').toUpperCase() as ApprovalLikelihood;
  return LIKELIHOODS.includes(up) ? up : 'MEDIUM';
}

function slugifyName(raw: unknown): string {
  const s = String(raw ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[^a-z]+/, '')
    .slice(0, 64);
  return /^[a-z][a-z0-9_]*$/.test(s) ? s : 'template';
}

@Injectable()
export class OllamaLlmService extends LlmService {
  private readonly logger = new Logger(OllamaLlmService.name);
  private readonly http: AxiosInstance;
  private readonly model: string;

  constructor(
    private readonly config: ConfigService,
    private readonly mock: MockLlmService,
  ) {
    super();
    const baseURL = this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    const timeout = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS', '60000'));
    this.model = this.config.get<string>('OLLAMA_TEMPLATE_MODEL', 'qwen3:14b');
    this.http = axios.create({ baseURL, timeout });
  }

  // Reply + intent stay on the deterministic mock until they are made real.
  generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    return this.mock.generateReply(input);
  }

  classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentResult> {
    return this.mock.classifyIntent(input);
  }

  async generateTemplateDrafts(input: GenerateTemplateDraftsInput): Promise<TemplateDraft[]> {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await this.attempt(input);
      } catch (err) {
        this.logger.warn(
          `Ollama template draft attempt ${attempt}/2 failed: ${err instanceof Error ? err.message : 'unknown'}`,
        );
      }
    }
    throw new ServiceUnavailableException('Template drafting is temporarily unavailable');
  }

  private async attempt(input: GenerateTemplateDraftsInput): Promise<TemplateDraft[]> {
    const { data } = await this.http.post('/api/chat', {
      model: this.model,
      stream: false,
      think: false,
      format: TEMPLATE_DRAFTS_SCHEMA,
      options: { temperature: 0.4 },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: this.buildUserPrompt(input) },
      ],
    });
    const content = data?.message?.content;
    if (typeof content !== 'string') {
      throw new Error('Ollama response missing message.content');
    }
    const drafts = this.parseAndNormalize(content, input.languages);
    if (drafts.length === 0) {
      throw new Error('Ollama returned no usable drafts');
    }
    return drafts;
  }

  private buildUserPrompt(input: GenerateTemplateDraftsInput): string {
    const langs = input.languages.map((l) => `${l} (${LANG_NAMES[l] ?? 'English'})`).join(', ');
    return [
      `Brief: ${input.brief}`,
      `Languages: ${langs}`,
      `Tone: ${input.tone}`,
      'Produce exactly 2 drafts for each language listed.',
    ].join('\n');
  }

  private parseAndNormalize(content: string, requestedLangs: string[]): TemplateDraft[] {
    const cleaned = content
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();
    let parsed: { drafts?: unknown };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      throw new Error('Ollama returned unparseable JSON');
    }
    const rawDrafts = Array.isArray(parsed?.drafts) ? parsed.drafts : [];
    const allowed = new Set(requestedLangs);
    return rawDrafts
      .filter((d): d is Record<string, unknown> => !!d && typeof d === 'object')
      .map((d) => ({
        language: String(d.language ?? ''),
        name: slugifyName(d.name),
        category: coerceCategory(d.category),
        body: String(d.body ?? ''),
        variables: Array.isArray(d.variables) ? d.variables.map((v) => String(v)) : [],
        approvalLikelihood: coerceLikelihood(d.approvalLikelihood),
        rationale: String(d.rationale ?? ''),
      }))
      .filter((d) => allowed.has(d.language) && d.body.length > 0);
  }
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- ollama-llm.service.spec`
Expected: PASS — all 7 tests green.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/llm/ollama-llm.service.ts apps/api/src/llm/__tests__/ollama-llm.service.spec.ts
git commit -m "feat(llm): add Ollama-backed template draft provider"
```

---

## Task 2: Wire `LlmModule` factory + env vars

**Files:**
- Modify: `apps/api/src/llm/llm.module.ts`
- Test: `apps/api/src/llm/__tests__/llm.module.spec.ts`
- Modify: `apps/api/.env.example`

> Run all commands in this task from the `apps/api/` directory.

- [ ] **Step 1: Write the failing factory test**

Create `apps/api/src/llm/__tests__/llm.module.spec.ts`:

```ts
import { ConfigService } from '@nestjs/config';
import { llmServiceFactory } from '../llm.module';
import { MockLlmService } from '../mock-llm.service';
import { OllamaLlmService } from '../ollama-llm.service';

function cfg(provider?: string): ConfigService {
  return {
    get: (key: string, fallback?: string) => (key === 'LLM_PROVIDER' ? provider : fallback),
  } as unknown as ConfigService;
}

describe('llmServiceFactory', () => {
  const mock = new MockLlmService();
  const ollama = new OllamaLlmService(cfg(undefined), mock);

  it('returns the mock provider when LLM_PROVIDER is unset', () => {
    expect(llmServiceFactory(cfg(undefined), mock, ollama)).toBe(mock);
  });

  it('returns the Ollama provider when LLM_PROVIDER=ollama', () => {
    expect(llmServiceFactory(cfg('ollama'), mock, ollama)).toBe(ollama);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- llm.module.spec`
Expected: FAIL — `llmServiceFactory` is not exported from `../llm.module`.

- [ ] **Step 3: Replace `llm.module.ts` with the factory binding**

Overwrite `apps/api/src/llm/llm.module.ts` with:

```ts
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { MockLlmService } from './mock-llm.service';
import { OllamaLlmService } from './ollama-llm.service';

/**
 * Selects the concrete LLM provider at runtime. Mock-first: default is the
 * deterministic offline stub; set LLM_PROVIDER=ollama to use the local model.
 */
export function llmServiceFactory(
  config: ConfigService,
  mock: MockLlmService,
  ollama: OllamaLlmService,
): LlmService {
  return config.get<string>('LLM_PROVIDER') === 'ollama' ? ollama : mock;
}

@Global()
@Module({
  providers: [
    MockLlmService,
    OllamaLlmService,
    {
      provide: LlmService,
      inject: [ConfigService, MockLlmService, OllamaLlmService],
      useFactory: llmServiceFactory,
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- llm.module.spec`
Expected: PASS — both tests green.

- [ ] **Step 5: Document the new env vars**

Edit `apps/api/.env.example`. After the WhatsApp block (the line `WHATSAPP_WEBHOOK_VERIFY_TOKEN=`), add:

```
# LLM provider: mock (default, deterministic offline stub) | ollama
LLM_PROVIDER=mock
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEMPLATE_MODEL=qwen3:14b
OLLAMA_TIMEOUT_MS=60000
```

- [ ] **Step 6: Run the full backend suite to confirm nothing regressed**

Run: `npm test`
Expected: PASS — the whole API suite is green (including the pre-existing `mock-llm.service.spec.ts`).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/llm/llm.module.ts apps/api/src/llm/__tests__/llm.module.spec.ts apps/api/.env.example
git commit -m "feat(llm): select provider via LLM_PROVIDER factory; document env"
```

---

## Task 3: Frontend — route to the manual form on AI failure

**Files:**
- Modify: `apps/web/src/components/TemplatesAIWizard.tsx`
- Modify: `apps/web/src/pages/Templates.tsx`

> Run all commands in this task from the `apps/web/` directory. The web app has no unit-test runner, so verification is `tsc` typecheck + lint + the manual check in Task 4.

- [ ] **Step 1: Add the `onGenerateFailed` prop to the wizard's props interface**

In `apps/web/src/components/TemplatesAIWizard.tsx`, the `TemplatesAIWizardProps` interface currently ends with `onToast?`. Add the new optional prop. Change:

```tsx
  onToast?: (message: string, variant?: 'success' | 'error') => void;
}
```

to:

```tsx
  onToast?: (message: string, variant?: 'success' | 'error') => void;
  /** Called after AI generation fails, so the caller can fall back to manual creation. */
  onGenerateFailed?: () => void;
}
```

- [ ] **Step 2: Destructure the new prop in the component signature**

In the same file, change:

```tsx
export function TemplatesAIWizard({ open, onClose, regenerate, onToast }: TemplatesAIWizardProps) {
```

to:

```tsx
export function TemplatesAIWizard({ open, onClose, regenerate, onToast, onGenerateFailed }: TemplatesAIWizardProps) {
```

- [ ] **Step 3: Update the generate-mutation error handler**

In the same file, the `generateMut` mutation's `onError` currently reads:

```tsx
    onError: () => {
      onToast?.('Failed to generate drafts', 'error');
    },
```

Replace it with:

```tsx
    onError: () => {
      onToast?.('AI drafting is unavailable right now — create your template manually.', 'error');
      onGenerateFailed?.();
    },
```

- [ ] **Step 4: Wire the callback from the Templates page**

In `apps/web/src/pages/Templates.tsx`, find the `<TemplatesAIWizard ... />` element near the end of the component. It currently reads:

```tsx
      <TemplatesAIWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        regenerate={wizardRegen}
        onToast={showToast}
      />
```

Replace it with:

```tsx
      <TemplatesAIWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        regenerate={wizardRegen}
        onToast={showToast}
        onGenerateFailed={() => {
          setWizardOpen(false);
          navigate('/templates/new');
        }}
      />
```

(`navigate` and `setWizardOpen` are already defined in this component — `const navigate = useNavigate();` and the `wizardOpen` state.)

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run lint`
Expected: no new errors in `TemplatesAIWizard.tsx` or `Templates.tsx`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/components/TemplatesAIWizard.tsx apps/web/src/pages/Templates.tsx
git commit -m "feat(templates): route to manual form when AI drafting fails"
```

---

## Task 4: Verify and open the PR

**Files:** none (verification + PR).

- [ ] **Step 1: Full backend suite + frontend build**

From `apps/api/`: `npm test` → all green.
From `apps/web/`: `npm run build` → `tsc` passes and Vite builds with no errors.

- [ ] **Step 2: Push the branch and open the PR**

```bash
git push -u origin feat/ollama-template-generation
gh pr create --title "Real Ollama-backed template generation" --body "$(cat <<'EOF'
Replaces the mocked `generateTemplateDrafts` with a real `qwen3:14b` call via Ollama's native `/api/chat` (structured-output JSON, thinking disabled). Provider chosen at runtime by an `LLM_PROVIDER` factory (default `mock`); reply/intent still delegate to the mock. One backend retry on failure, then 503; the wizard then routes the user to the manual template form.

Design: `docs/superpowers/specs/2026-06-12-llm-template-generation-design.md`
Plan: `docs/superpowers/plans/2026-06-12-llm-template-generation.md`

## Post-merge verification (on the Mac Studio)
1. `ollama list` shows `qwen3:14b`.
2. `curl http://localhost:11434/api/chat -d '{"model":"qwen3:14b","stream":false,"think":false,"messages":[{"role":"user","content":"hi"}]}'` returns a response.
3. Set `LLM_PROVIDER=ollama` in `apps/api/.env`; restart the API.
4. Templates → Create template → describe a brief → confirm real, localised drafts (not the `[EN] … reply to {{1}}` mock text).
5. Point `OLLAMA_BASE_URL` at a dead port; confirm Generate routes to `/templates/new` with the error toast after one retry.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Post-merge checklist (run by the user on the Mac Studio after merge + pull)**

The five steps in the PR body above. Setting `LLM_PROVIDER=ollama` is the only switch needed; leaving it unset keeps the deterministic mock.

---

## Notes & out-of-scope

- **Worker graph:** `LlmModule` is also registered in `blast-worker.module.ts`. The worker will construct `OllamaLlmService` too, but autopilot/tickets call `generateReply`/`classifyIntent`, which delegate to the mock — so worker behavior is unchanged regardless of `LLM_PROVIDER`.
- **Not in scope:** making reply/intent real on Ollama; wiring `bge-m3` embeddings into knowledge retrieval; pre-filling the manual form from the brief on failure; the pre-existing wizard `submitTemplate(name, 1)` hard-coded-version bug.
```
