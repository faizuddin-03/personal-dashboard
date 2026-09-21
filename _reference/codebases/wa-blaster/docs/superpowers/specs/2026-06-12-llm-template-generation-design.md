# LLM Template Generation — Real Ollama Provider

**Date:** 2026-06-12
**Branch:** `feat/ollama-template-generation`
**Status:** Approved design — ready for implementation plan

## Goal

Replace the mocked `generateTemplateDrafts` with a real LLM call to a `qwen3:14b`
model served by Ollama on the Mac Studio that hosts the app. Only template
generation is in scope; `generateReply` and `classifyIntent` keep using the
existing `MockLlmService`.

## Context

- `LlmService` (abstract, `apps/api/src/llm/llm.service.ts`) is the injection
  token. Today `LlmModule` binds it to `MockLlmService` via `useClass`.
- Three call sites use the service: `templates.service.ts`
  (`generateTemplateDrafts` — in scope), `autopilot.service.ts`
  (`classifyIntent` + `generateReply` — out of scope), `tickets.service.ts`
  (`generateReply` — out of scope).
- The wizard (`apps/web/src/components/TemplatesAIWizard.tsx`) calls
  `POST /templates/generate` → `TemplatesService.generateDrafts` →
  `LlmService.generateTemplateDrafts`, which returns `TemplateDraft[]`
  (`apps/api/src/llm/llm.types.ts`). The mock returns 2 drafts per language
  (a HIGH-likelihood UTILITY `_a` and a MEDIUM MARKETING `_b`).
- The API, Ollama, Postgres, and Redis all run on the same Mac Studio, so the
  API reaches Ollama at `http://localhost:11434`. The base URL is still made
  env-configurable so a remote dev box could point at it.

## Decisions (from brainstorming)

| Decision | Choice |
|---|---|
| Topology | API + Ollama co-located on Mac Studio → `http://localhost:11434` |
| Scope | `generateTemplateDrafts` only; mock stays for reply/intent |
| Model | `qwen3:14b`, thinking disabled; model name env-configurable |
| Provider selection | `LLM_PROVIDER` env (`mock` default \| `ollama`) via a module factory |
| API surface | Ollama **native** `/api/chat` with `format` = JSON schema |
| Failure handling | retry once in the backend → throw `503` → wizard routes to the manual form |
| Drafts per language | 2 (preserves the wizard's "pick among options" UX) |

## Architecture & provider wiring

New `OllamaLlmService extends LlmService` in
`apps/api/src/llm/ollama-llm.service.ts`. It implements
`generateTemplateDrafts` against Ollama and **delegates `generateReply` and
`classifyIntent` to an injected `MockLlmService`** (composition), so those two
paths remain identical to today.

`LlmModule` switches from a fixed `useClass` binding to a factory keyed on
`LLM_PROVIDER`:

```ts
@Global()
@Module({
  providers: [
    MockLlmService,
    OllamaLlmService,
    {
      provide: LlmService,
      inject: [ConfigService, MockLlmService, OllamaLlmService],
      useFactory: (cfg: ConfigService, mock: MockLlmService, ollama: OllamaLlmService) =>
        cfg.get<string>('LLM_PROVIDER') === 'ollama' ? ollama : mock,
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
```

- Default is `mock`, so CI, local Windows dev, and the demo keep working with
  no configuration.
- HTTP uses an `axios` instance created in the constructor (same pattern as
  `WhatsappCloudApiService`): `axios.create({ baseURL: OLLAMA_BASE_URL,
  timeout: OLLAMA_TIMEOUT_MS })`.

### New environment variables

Added to `apps/api/.env.example` and the Mac Studio `apps/api/.env`:

```
# LLM provider: mock (default, deterministic offline stub) | ollama
LLM_PROVIDER=mock
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_TEMPLATE_MODEL=qwen3:14b
OLLAMA_TIMEOUT_MS=60000
```

On the Mac Studio, `LLM_PROVIDER=ollama`.

## The `generateTemplateDrafts` call

A single non-streaming POST to `{OLLAMA_BASE_URL}/api/chat`:

```jsonc
{
  "model": "<OLLAMA_TEMPLATE_MODEL>",     // qwen3:14b
  "stream": false,
  "think": false,                          // qwen3 thinking off → clean JSON
  "format": { /* JSON schema for { drafts: TemplateDraft[] } */ },
  "options": { "temperature": 0.4 },
  "messages": [
    { "role": "system", "content": "<system prompt>" },
    { "role": "user",   "content": "<brief + languages + tone>" }
  ]
}
```

### Structured output schema

`format` is a JSON Schema (Ollama structured outputs). The top level is an
**object** with a `drafts` array (a bare top-level array is less reliable in
Ollama). Each draft item requires:

| Field | Type | Notes |
|---|---|---|
| `language` | string | one of the requested codes |
| `name` | string | snake_case slug |
| `category` | enum | `MARKETING` \| `UTILITY` \| `AUTHENTICATION` |
| `body` | string | uses `{{1}}`, `{{2}}` placeholders |
| `variables` | string[] | one name per placeholder, in order |
| `approvalLikelihood` | enum | `HIGH` \| `MEDIUM` \| `LOW` |
| `rationale` | string | one-sentence justification |

### Prompt

- **System:** "You are a WhatsApp Business message-template copywriter for
  eAuto (a vehicle-insurance renewal platform for dealers)." Rules:
  - Produce **2 drafts per requested language** with differing
    `approvalLikelihood` (e.g. a safe transactional UTILITY option and a warmer
    MARKETING option).
  - **Localise** each language properly — not a word-for-word translation.
  - Honour the requested tone (`friendly` | `formal`).
  - Body uses `{{1}}`, `{{2}}`… placeholders; their order must match the
    `variables` array; keep body ≤ 1024 characters.
  - Respect Meta category semantics (transactional → UTILITY; promotional →
    MARKETING; OTP/codes → AUTHENTICATION).
  - `name` is a lowercase snake_case slug derived from the brief.
- **User:** the `brief`, the requested language list, and the tone.
- Language code → name mapping for the prompt:
  `EN→English, MS→Bahasa Malaysia, ZH→Chinese (Simplified), TA→Tamil,
  OTHER→English`.

### Parse, normalize, validate

From `response.data.message.content` (a JSON string when `format` is set):

1. Defensively strip any stray `<think>…</think>` block before `JSON.parse`.
2. Parse to `{ drafts: [...] }`.
3. Normalize each draft in place:
   - `category` → uppercased, coerced to the enum; fallback `UTILITY`.
   - `approvalLikelihood` → uppercased, coerced to the enum; fallback `MEDIUM`.
   - `name` → slugified to `^[a-z][a-z0-9_]*$` if it does not already match.
   - `variables` → ensured to be `string[]`.
   - keep only drafts whose `language` is in the requested set.
4. If **zero** usable drafts remain, treat it as a failure (see retry).

### Retry once

A private helper wraps request + parse + validate. Attempt 1; on any thrown
error (timeout, non-200, unparseable output, or zero usable drafts) it makes
exactly one more attempt. A second failure throws
`ServiceUnavailableException` (HTTP 503). No silent fallback to mock output.

## Frontend behaviour on failure

In `TemplatesAIWizard`, `generateMut.onError` changes from "toast + stay on
step 1" to: **show an error toast and route to the manual template form.**

- A new optional prop `onGenerateFailed?: () => void` is added to the wizard.
- `Templates.tsx` wires it to close the wizard and `navigate('/templates/new')`.
- No React Query retry on the mutation (the backend already retried once).
- Toast copy: *"AI drafting is unavailable right now — create your template
  manually."*
- The manual form opens blank. Pre-filling the name slug from the brief is a
  deliberate non-goal for v1.

## Error handling & edge cases

| Case | Handling |
|---|---|
| Ollama down / timeout | retry once → 503 → wizard routes to manual form |
| Malformed / non-JSON output | failure → retry → 503 |
| Valid JSON, wrong enums / bad slug | normalized in place, not a failure |
| Zero usable drafts after normalize | failure → retry → 503 |
| Model returns 1 draft, not 2 | accepted — wizard shows fewer options |
| Extra / unrequested languages | filtered to the requested set |

## Testing

- **Unit** — `apps/api/src/llm/__tests__/ollama-llm.service.spec.ts`, with a
  mocked axios instance:
  - request shape: correct model from env, `think: false`, `stream: false`,
    `format` present, system + user messages.
  - happy path: valid JSON → `TemplateDraft[]`.
  - normalization: bad `category` / `approvalLikelihood` coerced; non-matching
    `name` slugified; unrequested languages filtered out.
  - resilience: malformed output on attempt 1 → success on attempt 2; two
    consecutive failures → throws.
  - delegation: `generateReply` / `classifyIntent` produce the same results as
    `MockLlmService`.
- **Module** — `LlmModule` factory returns `MockLlmService` when `LLM_PROVIDER`
  is unset and `OllamaLlmService` when `LLM_PROVIDER=ollama`.
- Existing `mock-llm.service.spec.ts` stays untouched.

## Verification (post-merge, on the Mac Studio)

Code reaches the Studio via: branch → PR → user merges → `git pull` on the Mac.
After pulling:

1. `ollama list` shows `qwen3:14b`.
2. Smoke test:
   `curl http://localhost:11434/api/chat -d '{"model":"qwen3:14b","stream":false,"think":false,"messages":[{"role":"user","content":"hi"}]}'`
   returns a response.
3. Set `LLM_PROVIDER=ollama` in `apps/api/.env`; restart the API.
4. Open the Templates page → "Create template" → describe a brief → confirm
   real, localised drafts appear (not the `[EN] … reply to {{1}}` mock text).
5. Temporarily point `OLLAMA_BASE_URL` at a dead port; confirm Generate routes
   to `/templates/new` with the error toast after one retry.

## Out of scope (future work)

- Making `generateReply` / `classifyIntent` real on Ollama.
- Wiring `bge-m3` embeddings into knowledge-base retrieval.
- Pre-filling the manual form from the brief on AI failure.
- The pre-existing wizard `submitTemplate(name, 1)` hard-coded-version bug
  (tracked separately; not introduced or fixed here).
