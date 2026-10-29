# Campaign-Aware Chatbot — Design

**Date:** 2026-06-12
**Branch:** feat/ai-chatbot
**Status:** Design — pending implementation plan

## Problem

The AI chatbot answers customer WhatsApp messages purely from the knowledge base (KB)
via RAG. It has **zero awareness of the marketing campaigns** the same system blasts to
those customers. So when a customer receives a promo blast and replies with a question
about it ("what's this 15% off?", "until when?"), the bot searches the KB — which doesn't
contain campaign-specific facts — and either misses or gives a generic answer.

We want the bot to be **campaign-aware first, knowledge-base second**:

```
On each inbound message:
  1. Attribute it to a campaign the customer received
  2. If a campaign is found → inject its text as a TOP-PRIORITY source
  3. Retrieve KB chunks as usual
  4. Drafter answers from [campaign text + KB chunks]
  5. Confidence gate (>=0.85) + guardrails        ── unchanged
  6. KB miss / low confidence → offer support routing   (already built)
```

If no recent campaign is attributed, behaviour is **identical to today** (pure KB RAG).
Nothing regresses.

## What already exists (verified in code)

- **Support routing is done.** `consent_offer` / `escalation_accepted` / `escalation_declined`
  canned replies + YES/NO handling in `decision-engine.service.ts`. KB miss **and** low
  confidence both already trigger the "connect you to customer support?" offer.
- **Reply attribution logic exists.** `src/blasts/reply-attribution.ts::attributeReply()`
  is a pure function that, given a contact's sent blast messages, picks the most recent
  `SENT/DELIVERED/READ` message within a `windowDays` window. Currently used only for inbox
  stats — **not** wired into the chatbot.
- **Template rendering exists.** `src/blasts/variable-renderer.ts::renderTemplate()` renders
  `Template.bodyText` with a blast's `variableMapping` for a contact. Blast messages do NOT
  store the rendered body (`Message.body` is null for blasts — they send Meta template
  components), so we render on demand.
- **The drafter already accepts conversation history.** `buildDrafterSystemPrompt` /
  `DrafterService.draft({ conversationHistory })` support it; `chatbot.service.ts` just
  never passes it.
- **Data model.** `Message { blastId, contactId, metaMessageId, status, sentAt }` →
  `Blast { templateName, variableMapping }` → `Template { bodyText, ... }`.

## Design

### Component 1 — Conversation memory (Phase 0, small)

`chatbot.service.ts` resolves the last ~6 messages of the conversation and passes them as
`conversationHistory` into `DecisionEngine.decide()`, which already forwards it to the
classifier and drafter. Bounded to last N to cap tokens.

- Fixes existing follow-up failures (e.g. "is Chubb towing free?" answered, then "any
  distance limit?" failed because the bot had no memory of the prior turn).
- Required for campaign follow-ups too.

### Component 2 — `CampaignContextService` (new, in chatbot module)

Single responsibility: given an inbound, return the campaign the customer is talking about.

```
getActiveCampaign(input: {
  contactId: string;
  replyToMetaMessageId?: string;   // from WhatsApp quote-reply context.id
}): Promise<CampaignContext | null>

CampaignContext = { blastId, campaignName, renderedText }
```

**Two-tier attribution:**

1. **EXACT (quote-reply):** if `replyToMetaMessageId` is present and matches a
   `Message` with a non-null `blastId` → use **that** campaign with certainty.
2. **FALLBACK (time heuristic):** otherwise, load the contact's recent blast messages and
   run the existing `attributeReply(candidates, now, 7)` → most-recent-within-7-days.

Window = **7 days** (constant for now).

On a hit, load `Blast` + `Template`, render the body via `renderTemplate(template.bodyText,
blast.variableMapping, contact)` → the exact promo text the customer received. Returns
`null` when nothing attributes (no quote match and no blast in window).

### Component 3 — Decision-engine integration

- Add `context?: { id?: string }` to `ChatbotInboundPayload.message` (currently dropped;
  the raw `msg` from `webhook.controller.ts:95` already carries it).
- `chatbot.service.ts` calls `CampaignContextService.getActiveCampaign()` once per inbound
  and passes the result into `decide()` via a new optional `campaignContext` field on
  `DecisionInput`.
- In the main RAG pipeline (after retrieval, before drafting), if `campaignContext` is
  present, **prepend it as a synthetic rank-1 chunk** labeled *"CAMPAIGN the customer
  received"*, ahead of the KB chunks. KB chunks follow at ranks 2..N.
- Everything downstream — confidence threshold, all guardrails, citations, support
  routing — is **unchanged**. If `campaignContext` is null, the pipeline is exactly today's.

### Component 4 — Drafter prompt

One small addition to `buildDrafterSystemPrompt`: a line noting that the campaign source is
the message the customer was sent, so campaign-specific questions should be answered from
it. The existing "answer ONLY from the SOURCES" rule already constrains the rest.

## Safety / invariants (unchanged)

- **No hallucination:** campaign text is real (rendered from the actually-sent template);
  the drafter still answers only from provided sources.
- Confidence threshold (0.85), all 6 guardrails, opt-out/complaint detection, business
  hours, CS-window — all unchanged.
- KB miss / low confidence → existing `consent_offer` support routing.

## Edge cases

- No blast in 7 days and no quote-reply → normal KB RAG (today's behaviour).
- Multiple blasts in window, no quote → most recent wins (`attributeReply`).
- Quote-reply to a non-blast message (e.g. a prior bot reply) → no exact match → fall
  through to time heuristic.
- Campaign text + KB both irrelevant → low confidence → support offer.
- Conversation history capped at last N messages to bound token usage.

## Testing

- **Unit — `CampaignContextService`:** exact-match path, time-heuristic path, no-match
  path, rendering correctness (mocked Prisma).
- **Unit — decision engine:** campaign-chunk injected at rank 1 when context present;
  identical-to-today path when context null.
- **E2E (mock mode):** blast → campaign question → campaign-sourced answer; general
  question → KB answer; unanswerable → support offer; quote-reply → exact campaign.

## Out of scope (parked for later, separate specs)

- Lead capture / quote / renewal / plan-recommendation conversational flows (the
  multi-turn "flow engine" funnel). Different feature; revisit after this ships.
- Making the attribution window a configurable chatbot setting (hardcoded 7 days for now).
