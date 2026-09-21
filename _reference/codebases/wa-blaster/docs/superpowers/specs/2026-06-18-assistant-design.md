# WhatsApp Blast Assistant — Design

**Date:** 2026-06-18
**Branch:** feat/blast-assistant
**Status:** Design — pending implementation plan

## Problem

Creating a campaign today is a multi-screen chore: pick or author a template, wait for Meta
approval, build a campaign, choose an audience, set a schedule. Operators know what they
want in one sentence — *"blast dealers about car A on Monday morning"* — but have to
translate that into several manual steps.

We want a **"Siri-like" assistant inside the app**: the operator types an intent in natural
language and the assistant assembles the work — selecting or drafting a template and
scheduling a campaign — then presents it for approval. It does this by driving the existing
domain services as **tools**, not by reimplementing any campaign logic.

### Decisions made during brainstorming

- **Autonomy: plan, then confirm.** A chat turn has *zero* side effects. Nothing is written
  to the DB, submitted to Meta, or scheduled until the operator clicks **Approve**.
- **Template flow is prompt-driven.** If the operator says *reuse*, the assistant reuses an
  existing **APPROVED** template; if they say *create*, it drafts a new one. Both paths are
  first-class.
- **UI: a slide-over chat panel** opened from the existing `AIOrb`, available on every page.
- **LLM engine: real Ollama native tool-calling** (`qwen3:14b`), with a constrained-JSON
  fallback for the final plan (see Reliability). No mock planner ships, but the LLM is
  stubbed in tests.

## What already exists (verified in code)

- **Scheduled blasts are BullMQ delayed jobs.** `BlastsService.createAndSchedule()`
  (`apps/api/src/blasts/blasts.service.ts:231`) computes `delayMs = scheduledAt - now`
  (~`:315`) and enqueues with that delay. The job sits delayed until BullMQ fires it; the
  actual send happens in `BlastProcessor.process()` (`apps/api/src/blasts/blast.processor.ts:30`),
  which calls `whatsapp.sendMessage()`.
- **Blast creation rejects non-APPROVED templates.** `BlastsService.validateTemplate()`
  (`blasts.service.ts:192`) throws `BadRequestException` unless an `APPROVED` variant exists,
  picking the latest approved version. **This is the gate we must relax** to schedule against
  a freshly-created PENDING template.
- **`CreateBlastDto`** (`blasts/dto/create-blast.dto.ts`) accepts `name`, `templateName`,
  `defaultLanguage`, optional `segmentId` / `audienceFilter`, `variableMapping`,
  `scheduledAt` (ISO), optional `languageMode`.
- **Template create + submit exist.** `TemplatesService.createDraft()`
  (`templates/templates.service.ts:114`) writes one `DRAFT` row per language (family shares
  `name`+`version`); `submitGroup(name, version)` (`:181`) transitions `DRAFT → PENDING`,
  calls `whatsapp.submitTemplate()`, and stamps `metaTemplateId` / `submittedAt`.
- **The LLM layer is a swappable abstract service.** `LlmService`
  (`llm/llm.service.ts:17`) is selected by `LLM_PROVIDER` (`mock` default | `ollama`,
  `llm/llm.module.ts:11`). `OllamaLlmService` (`llm/ollama-llm.service.ts`) posts to
  Ollama `/api/chat` (~`:236`) with `{ model, stream:false, format, options, messages }`
  and parses `data.message.content`. The codebase's proven reliability trick is the `format`
  JSON-schema (constrained decoding) — it does **not** currently send a `tools` array.
  Env: `OLLAMA_BASE_URL`, `OLLAMA_TEMPLATE_MODEL` (default `qwen3:14b`), `OLLAMA_TIMEOUT_MS`.
- **KL-timezone helper exists** (`analytics/analytics.util.ts:6`, `klWeekdayHour`) for the
  Asia/Kuala_Lumpur conversions `resolve_datetime` needs.
- **`AIOrb`** and a slide-over/`CommandPalette` pattern already exist in
  `apps/web/src/components/`.

## Goals / Non-goals

**Goals (v1):** the two flows above — *reuse-and-schedule* and *create-and-schedule* — driven
by a single natural-language prompt, gated by one human approval.

**Non-goals (v1):** editing/pausing existing campaigns by prompt; multi-campaign batch
requests; contact CRUD via the assistant; a dedicated `AWAITING_TEMPLATE` blast status
(a held job simply stays `SCHEDULED`). All are fast-follows.

## Design

### Architecture overview

A new **HTTP-side** NestJS module `assistant/` (not part of the blast worker — it is
interactive). It runs an Ollama tool-calling loop **in-process**, so its tools call the
existing `TemplatesService` / `BlastsService` / `SegmentsService` directly, preserving the
caller's JWT user context. The frontend only renders chat and the confirmation cards.

```
Operator ──prompt──▶ POST /assistant/chat
                        │  AssistantService runs Ollama tool loop (READ tools only)
                        │  └─ search_templates / search_audience / resolve_datetime / get_template_variables
                        ▼
                     propose_plan(plan)  ── validated, persisted as StagedPlan(PENDING_APPROVAL)
                        │
   chat reply + plan ◀──┘
                        │
Operator clicks Approve ─▶ POST /assistant/plans/:id/approve
                        │  re-validate, then execute DETERMINISTICALLY:
                        │   (create) createDraft → submitGroup
                        │   createAndSchedule(...)  ── enqueues delayed BullMQ job
                        ▼
                     links to the new campaign/template
```

### Backend module `assistant/`

| Endpoint | Purpose |
|---|---|
| `POST /api/assistant/chat` | `{ conversationId?, message }` → runs the agent loop, returns assistant text + (when ready) a staged plan. |
| `POST /api/assistant/plans/:id/approve` | Re-validates and executes the staged plan deterministically. |
| `POST /api/assistant/plans/:id/cancel` | Discards a staged plan. |

All guarded by `JwtAuthGuard` and the same role guard that protects campaign creation today.

- `AssistantController` — thin HTTP layer.
- `AssistantService` — drives the Ollama tool-calling loop; owns the read-tool dispatch table
  and the validate→repair→bail logic.
- `AssistantPlanService` — validates a proposed plan, persists/loads `StagedPlan`, and runs
  the deterministic `approve` execution.
- `assistant/tools/*` — one small, independently-testable function per read tool.

`StagedPlan` persistence (v1): a new Postgres model `AssistantPlan` (id, the plan JSON, a
TTL/`expiresAt`, and a `status` of `PENDING_APPROVAL | EXECUTED | CANCELLED | EXPIRED`) so a
staged plan survives an API restart between propose and approve. Requires one Prisma migration.

### The tool contract

**Read tools** (callable mid-conversation; no side effects):

- `search_templates(query, status="APPROVED")` → matching template families (name, languages, variables).
- `search_audience(query)` → matching contact **segments** with recipient counts (resolves "dealers").
- `resolve_datetime(phrase)` → a concrete **KL-timezone** ISO timestamp from "Monday morning",
  computed from the server clock + `klWeekdayHour` helper. The LLM never invents dates.
- `get_template_variables(name)` → the `{{n}}` slots a reused template needs (to build `variableMapping`).

**Terminal tool** `propose_plan(plan)` — the model's final call; its argument *is* the plan:

```jsonc
{
  "intent": "reuse_and_schedule" | "create_and_schedule",
  "campaignName": "string",
  "template": { "mode": "reuse", "name": "string" }
             | { "mode": "create", "name": "string", "category": "MARKETING|UTILITY|AUTHENTICATION",
                 "languages": ["EN", ...], "bodyText": "string", "variables": ["1", ...] },
  "audience": { "segmentId": "uuid" },
  "defaultLanguage": "EN|MS|ZH|TA|OTHER",
  "variableMapping": { "1": "contact.name" },
  "schedule": { "sendAt": "2026-06-22T08:00:00+08:00" }
}
```

The backend validates this against a DTO, persists it as a `StagedPlan`, and returns it. The
model **never** calls a write tool — all dangerous sequencing is deterministic backend code.

### Data flow (execution / approve)

`approve` re-validates (plan not expired/executed, segment still exists, `sendAt` still
future, template still resolvable), then runs in order:

1. **create path only:** `TemplatesService.createDraft(plan.template)` → `submitGroup(name, version)`
   (DRAFT→PENDING + Meta submit; instant in `WHATSAPP_MOCK_MODE`).
2. `BlastsService.createAndSchedule({ name: campaignName, templateName, defaultLanguage,
   segmentId, variableMapping, scheduledAt: schedule.sendAt, languageMode })`.
3. Mark the `StagedPlan` `EXECUTED`, store the created template/blast ids, return links.

If a later step fails, report exactly what succeeded (a created DRAFT/PENDING template is
harmless and reusable) rather than feigning atomicity, and surface it in the chat thread.

### Campaign-module changes

**Edit 1 — relax creation validation** (`BlastsService.validateTemplate`, `blasts.service.ts:192`).
Accept a `PENDING` variant **only when `scheduledAt` is in the future**: schedule the campaign
betting approval lands before send time. Still reject `PENDING` for immediate sends, and still
reject when no variant exists at all. `APPROVED` continues to work exactly as today.

**Edit 2 — fire-time approval guard** (`BlastProcessor.process`, `blast.processor.ts:30`).
Before dispatching a message, re-check the template status:

- `APPROVED` → send (today's behaviour).
- not yet `APPROVED` → **hold**: re-enqueue the job with a short delay (configurable grace
  window — recheck every `ASSISTANT_TEMPLATE_RECHECK_MS`, up to `ASSISTANT_TEMPLATE_GRACE_MS`)
  so it auto-sends the moment Meta approves.
- `REJECTED`, or grace window exceeded → mark the blast `FAILED` and raise an operator alert.

Wiring note: the worker graph (`BlastWorkerModule`) needs template-status access for this
check (inject `TemplatesService` or a thin status query + `PrismaService`).

### Reliability & error handling (local model)

- **Constrained `propose_plan`.** Emit the plan via Ollama's `format` JSON-schema (the proven
  pattern), not free-form text. Native `tools` drive the read phase; if `qwen3:14b` `tool_calls`
  prove flaky in testing, collapse to a single constrained-output turn without changing the contract.
- **Grounding by id.** Read tools return real template names / `segmentId`s; the validator
  **rejects any plan referencing a template or segment that does not exist** — no hallucinated audiences.
- **Validate → repair → bail.** A malformed plan (missing field, past `sendAt`, unknown ref) is
  fed back once as a structured error for a repair attempt. Still invalid → graceful "I couldn't
  pin that down — which audience / what date?" instead of a broken card.
- **Bounded loop.** Hard cap on tool iterations (default 5). Timeout via `OLLAMA_TIMEOUT_MS`,
  clean chat-level error on timeout/connection failure.

### Security / side-effect containment

- Chat turns are read-only; only `approve` writes.
- `StagedPlan` is **single-use with a TTL**: cannot be approved twice; expires if stale; `approve`
  re-validates at execution time.
- Reuses the existing auth + role guards that protect campaign creation.

### Frontend (slide-over panel)

- A drawer opened from the persistent `AIOrb`, available on every page (mounted in `Layout`).
- Multi-turn chat thread. When `chat` returns a plan, render confirmation **cards**: template
  preview (reuse: existing body; create: drafted body + languages), audience name + recipient
  count, and the resolved send-time — with **Approve / Edit / Cancel**.
- **Edit** lets the operator tweak fields (campaign name, send-time, variable mapping) before
  approving; **Approve** calls `/approve`; on success, link out to the new campaign in the normal UI.
- New API client module `apps/web/src/api/assistant.ts` + a React Query hook; follows the
  existing per-domain client convention.

### Testing

Follows the project pattern (instantiate services directly, hand-rolled `ConfigService` stub,
`nock` for HTTP; LLM stubbed even though prod uses real Ollama).

- Tool unit tests — especially `resolve_datetime` ("Monday morning" against a fixed clock, KL tz)
  and `search_audience`.
- Plan-validation tests — valid/invalid plans, hallucinated refs, past dates,
  **PENDING-template + future = OK vs PENDING + immediate = reject**.
- Campaign edits — `validateTemplate` accept/reject matrix; `BlastProcessor` fire-time guard
  (holds → sends on approval; fails past grace window / on `REJECTED`).
- `AssistantService` loop — stubbed LLM returning canned tool calls / plan; assert iteration cap
  and the repair path.
- Integration — `chat → propose → approve` in `WHATSAPP_MOCK_MODE` + stubbed LLM asserts a real
  `Blast` + `Template` row are created and scheduled.

## Open questions

- **Native `tools` vs constrained-JSON for the read phase.** Decided at implementation time by a
  spike against `qwen3:14b`; the contract is unaffected either way.
- **Grace-window defaults** (`ASSISTANT_TEMPLATE_RECHECK_MS` / `ASSISTANT_TEMPLATE_GRACE_MS`) —
  start at recheck 5 min / grace 24 h; tune after observing real Meta approval latency.
