# Follow-up–aware retrieval (hybrid gated query rewrite)

- **Date:** 2026-06-13
- **Status:** Approved (design) — pending implementation plan
- **Branch:** `feat/ai-chatbot`

## Problem

The chatbot answers a self-contained question correctly but fails on an **elliptical follow-up** that depends on prior context.

Observed live (contact +60183825227):

1. Customer: "my daughter is 23, if she drives my car and we claim, got extra excess for this?" → bot: "No additional Compulsory Excess applies since your daughter is over 21 years old." ✅
2. Customer: "what about if she is 18?" → bot: "Your previous enquiry is still being processed…" ❌

The same question asked self-contained ("my daughter is 18, if she drives my car and we claim, got extra excess?") answers correctly ("…additional Compulsory Excess of RM400 since your daughter is under 21").

### Root cause (confirmed in code)

`RetrievalService.retrieve(query)` (`apps/api/src/chatbot/knowledge/retrieval.service.ts`) embeds **only the raw query string**. The decision engine calls it with `input.inboundMessageBody` — the literal current message — at two sites in `apps/api/src/chatbot/decision/decision-engine.service.ts`:

- line ~152, main pipeline
- line ~279, `tryRagAnswer` (under the pending-escalation guard)

`conversationHistory` **is** available on `DecisionInput` (last 10 turns, `{role, body}`, oldest-first; built in `chatbot.service.ts` via `ConversationService.getConversationHistory`) and **is** passed to the **drafter** — whose prompt already has a "RECENT CONVERSATION… resolve follow-up questions" block, so the *answering* side can resolve "she → daughter."

The gap is purely at **retrieval**: "what about if she is 18?" embeds to a region far from the compulsory-excess chunk → KB miss → `consent_offer` ("I'm not sure I can answer…") or, when an escalation ticket is open, `still_being_processed`. The drafter never gets the chunk it needs.

The "still being processed" text specifically was a separate, already-fixed/ cleared issue (the open ticket); the durable bug is the history-blind retrieval query.

## Goal & success criteria

- A follow-up like "what about if she is 18?" retrieves the compulsory-excess chunk and the bot answers "…RM400… under 21."
- General, not hardcoded: handles arbitrary elliptical follow-ups ("and for a motorcycle?", "how about a second driver who is 19?", "what about night towing?").
- A **new** question after a thread is treated as new — prior context is **not** dragged in (e.g. after the daughter thread, "Does comprehensive cover flood?" retrieves as a fresh flood query).
- No regression to self-contained questions; no confidently-wrong answers introduced.

## Non-goals (scope guard / YAGNI)

- No DB schema changes, no new chatbot settings.
- No change to the drafter, guardrails, embedding model, or the pgvector search itself.
- No new LLM task chain — reuse the existing fast `classify` chain.
- Not trying for 100% detection; a missed follow-up degrades to today's safe behavior.

## Design

The drafter is already history-aware. We contextualize **only the search query**, leaving the rest of the answering path untouched.

### Detection is two layers

The concern "is this a follow-up or a new question?" is split so detection is both **accurate** and **cheap**:

- **Layer 1 — cheap gate (recall-tuned, free).** Decides only *whether to spend an LLM call*. Condition: **prior history exists** AND (message is **short** OR starts with a **follow-up cue**). Deliberately loose — a false trigger only costs one cheap LLM call. Phrasing-agnostic via the length signal; cue words catch slightly longer follow-ups.
- **Layer 2 — the LLM is the real judge.** When the gate fires, the rewrite prompt instructs: *if the latest message is already a complete, self-contained question, output it unchanged; otherwise resolve the references.* The semantic new-vs-follow-up decision is the model's, not a keyword list's.

Why misclassification is low-harm:

| Case | Behavior | Harm |
|---|---|---|
| New question, gate says "new" | raw retrieval | none (self-contained retrieves fine) |
| New question, gate wrongly fires | LLM returns it **unchanged** | none — context not injected |
| Follow-up, gate fires | LLM resolves references | ✅ fixed |
| Follow-up, gate misses (rare) | raw retrieval → safe "connect you to support?" | safe failure, never a wrong answer |

We bias toward catching follow-ups because over-checking is harmless (LLM passes new questions through) while under-checking reintroduces the bug.

### Component 1 — `FollowUpDetector` (pure, no deps)

Location: `apps/api/src/chatbot/knowledge/follow-up.detector.ts` (mirrors the existing `YesNoDetector`/`OptOutDetector` pattern).

```
isFollowUp(message: string, history?: Array<{role, body}>): boolean
```

Returns `true` only when:
- `history` contains at least one prior **customer** turn (nothing to contextualize otherwise), AND
- the message is **short** (≤ ~8 words — a code constant, not a runtime setting) OR matches a **cue** regex (`what about`, `how about`, `and if`, `what if`, `and for`, `but if`, leading `and`/`but`, bare "… is N?", pronoun-led with no topic noun).

Pure and deterministic → exhaustively unit-testable.

### Component 2 — `QueryContextualizerService`

Location: `apps/api/src/chatbot/knowledge/query-contextualizer.service.ts`. Deps: `LlmRouterService`, `FollowUpDetector`.

```
contextualize(message, history?): Promise<{ searchQuery: string; strategy: 'raw' | 'concat' | 'rewrite' }>
```

Logic:
1. `!detector.isFollowUp(message, history)` → `{ message, 'raw' }`. **No LLM call.**
2. Follow-up → LLM **rewrite** on the fast `classify` chain (`temperature: 0`, `maxTokens: ~80`, plain-text output). Validate the result (non-empty after trim, not absurdly long vs. input, not the prompt echoed back). Valid → `{ rewritten, 'rewrite' }`.
3. Rewrite invalid/empty OR `LlmExhaustedException`/any throw → **concat fallback**: `{ "<most-recent prior customer message> <current message>", 'concat' }`.

**Never throws** — contextualization is best-effort.

#### Rewrite prompt (Layer 2)

System (sketch):

> You rewrite a customer's latest WhatsApp message into ONE standalone search query for an insurance knowledge base.
> - Use the recent conversation to resolve references (pronouns like "she/it", or omitted subjects like "what about if she is 18?").
> - If the latest message is ALREADY a complete, self-contained question, output it unchanged.
> - Output ONLY the search query text — no quotes, no explanation.

User content: the last few turns (cap ~4 to bound tokens) rendered `Customer:/You:/Agent:` + `Latest message: <message>`.

#### Concat fallback

`<most recent prior customer message> + " " + <current message>`. The prior customer question carries the topic ("daughter drives my car claim excess"); the current carries the changed parameter ("if she is 18"). Cheap, no LLM, still contextualized.

### Fallback chain (resilience)

`follow-up → rewrite → concat`; `raw` is used **only** for non-follow-ups. If the local Ollama LLM is down (`llm_exhausted` has recurred this session), a follow-up still degrades to a **contextualized concat** query — it never reverts to the blind raw query.

### Decision-engine integration

Build the query once and pass it to `retrieval.retrieve(searchQuery)` at **both** call sites:

- main pipeline (line ~152)
- `tryRagAnswer` (line ~279)

`RetrievalService` signature is unchanged — it just receives a better query. `conversationHistory` continues to flow to the drafter unchanged, so it produces the precise "18 → RM400" answer once it has the right chunk.

`QueryContextualizerService` is injected into `DecisionEngine`. The engine invokes the contextualizer immediately before each `retrieve` call via a small private helper. The two retrieve sites are **mutually exclusive within a single `decide()`** — the pending-escalation branch (`tryRagAnswer`) returns early, otherwise the main pipeline runs — so at most one rewrite happens per message. This also means no wasted LLM call on short-circuit paths that never retrieve (opt-out, complaint, low-intent, disabled, out-of-hours), since classification/safety checks run before retrieval.

### Telemetry

Log per inbound: chosen `strategy` (`raw`/`concat`/`rewrite`) and the final search query (truncated). **Logger only — no DB schema change.** Lets us confirm in logs that rewriting fires and helps.

## Module wiring

Provide `FollowUpDetector` + `QueryContextualizerService` in the module that supplies the decision engine's providers (the module already wires `RetrievalService` from `knowledge/` and `LlmModule`). Inject `QueryContextualizerService` into `DecisionEngine`.

## Testing (TDD)

- **`FollowUpDetector`** — positive/negative table:
  - follow-up: "what about if she is 18?", "and for a motorcycle?", "how about 25?", "she 18?", "and night towing?" (with prior customer history).
  - not: "my daughter is 18, if she drives my car and we claim, got extra excess?", "what does comprehensive cover?", greetings, **any message with no prior history**.
- **`QueryContextualizerService`**:
  - follow-up + LLM ok → `strategy: 'rewrite'`, uses rewritten query.
  - follow-up + LLM throws (`LlmExhaustedException`) → `strategy: 'concat'`.
  - follow-up + LLM returns empty/invalid → `strategy: 'concat'`.
  - non-follow-up → `strategy: 'raw'`, **LLM not called** (`expect(complete).not.toHaveBeenCalled()`).
- **`DecisionEngine`** (mock contextualizer): both retrieve sites call `retrieval.retrieve` with the contextualized query (not the raw body) when contextualizer returns a rewritten query.
- Full `npx jest src/chatbot` stays green.

## Edge cases

- First message (no history) → `raw`.
- History exists, full self-contained question → gate may fire; LLM returns unchanged → effectively `raw`-equivalent.
- LLM down → `concat`.
- Rewrite returns junk/echo → `concat`.
- Empty/whitespace message → `raw` (retrieval already handles empties downstream).

## Files touched

- **New:** `apps/api/src/chatbot/knowledge/follow-up.detector.ts` (+ spec)
- **New:** `apps/api/src/chatbot/knowledge/query-contextualizer.service.ts` (+ spec)
- **Edit:** `apps/api/src/chatbot/decision/decision-engine.service.ts` (build query once, use at both retrieve sites; inject contextualizer)
- **Edit:** decision/knowledge module wiring (provide the two new units)
- **Edit:** `apps/api/src/chatbot/decision/decision-engine.service.spec.ts` (contextualized-query assertions)
