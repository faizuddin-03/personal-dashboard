# Campaign-Aware Chatbot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the chatbot answer campaign questions from the campaign the customer received (attributed by quote-reply or 7-day recency), injected as a top-priority source alongside KB RAG, with conversation memory wired in.

**Architecture:** A new `CampaignContextService` attributes each inbound to a campaign and renders the exact promo text. `ChatbotService` resolves campaign context + recent conversation history per inbound and passes both into the existing `DecisionEngine`, which forwards them to the drafter (campaign + history in the system prompt) and to the guardrails (so campaign numbers aren't flagged as hallucinated promises). When no campaign is attributed, behaviour is identical to today.

**Tech Stack:** NestJS, Prisma (Postgres/pgvector), Jest. Reuses existing pure helpers `attributeReply()` (`src/blasts/reply-attribution.ts`) and `renderTemplate()` (`src/blasts/variable-renderer.ts`).

**Working directory for all commands:** `apps/api`

---

## File Structure

- **Create** `apps/api/src/chatbot/campaign/campaign-context.service.ts` — attribution + template rendering
- **Create** `apps/api/src/chatbot/campaign/campaign.module.ts` — DI module exporting the service
- **Create** `apps/api/src/chatbot/campaign/__tests__/campaign-context.service.spec.ts`
- **Create** `apps/api/src/chatbot/drafter/prompts/drafter.prompt.spec.ts`
- **Modify** `apps/api/src/chatbot/guardrails/no-unknown-promises.guard.ts` — accept extra grounding text
- **Modify** `apps/api/src/chatbot/guardrails/guardrails.service.ts` — thread `campaignText` through
- **Modify** `apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts` — CAMPAIGN + RECENT CONVERSATION sections
- **Modify** `apps/api/src/chatbot/drafter/drafter.service.ts` — pass `campaignText` + history into the prompt
- **Modify** `apps/api/src/chatbot/drafter/drafter.service.spec.ts` — assert forwarding
- **Modify** `apps/api/src/chatbot/decision/decision.types.ts` — add `campaignContext` to `DecisionInput`
- **Modify** `apps/api/src/chatbot/decision/decision-engine.service.ts` — forward campaign + history to drafter & guardrails
- **Create** `apps/api/src/chatbot/decision/__tests__/decision-engine.campaign.spec.ts`
- **Modify** `apps/api/src/chatbot/chatbot.service.ts` — payload `context`, resolve campaign + history, pass to `decide()`
- **Modify** `apps/api/src/chatbot/chatbot.service.spec.ts` — add campaign dep + a wiring test
- **Modify** `apps/api/src/chatbot/chatbot.module.ts` — import `CampaignModule`

---

## Task 1: Guardrails accept campaign text as grounding

Without this, a campaign answer like "15% off until 30 June" fails `NoUnknownPromisesGuard`
(numbers 15/30 aren't in the KB chunks) and wrongly escalates.

**Files:**
- Modify: `apps/api/src/chatbot/guardrails/no-unknown-promises.guard.ts`
- Modify: `apps/api/src/chatbot/guardrails/guardrails.service.ts`
- Test: `apps/api/src/chatbot/guardrails/__tests__/no-unknown-promises.guard.spec.ts` (existing dir; add cases)

- [ ] **Step 1: Write the failing test**

Append these cases to `apps/api/src/chatbot/guardrails/__tests__/no-unknown-promises.guard.spec.ts`
(if the file does not exist, create it with the import below at top):

```ts
import { NoUnknownPromisesGuard } from '../no-unknown-promises.guard';

describe('NoUnknownPromisesGuard — campaign grounding', () => {
  const guard = new NoUnknownPromisesGuard();

  it('treats numbers present in extraGroundingText as known', () => {
    const res = guard.check('Enjoy 15% off until 30 June.', [], 'Get 15% off, valid till 30 June 2026.');
    expect(res.ok).toBe(true);
  });

  it('still fails on a number absent from both chunks and grounding text', () => {
    const res = guard.check('It costs RM99.', [], 'Get 15% off.');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('unknown_promise:99');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/chatbot/guardrails/__tests__/no-unknown-promises.guard.spec.ts -t "campaign grounding"`
Expected: FAIL — `check` currently takes only 2 args, so the 3rd arg is ignored and `15`/`30` are flagged.

- [ ] **Step 3: Add the `extraGroundingText` parameter**

In `apps/api/src/chatbot/guardrails/no-unknown-promises.guard.ts`, replace the `check` method:

```ts
  check(body: string, chunks: RetrievedChunk[], extraGroundingText?: string): GuardResult {
    const chunkNumbers = new Set([
      ...chunks.flatMap((c) => this.extractNumbers(c.text)),
      ...this.extractNumbers(extraGroundingText ?? ''),
    ]);

    for (const num of this.extractNumbers(body)) {
      if (this.safelist.has(num)) continue;
      if (!chunkNumbers.has(num)) {
        return { ok: false, reason: `unknown_promise:${num}` };
      }
    }
    return { ok: true, reason: '' };
  }
```

- [ ] **Step 4: Thread `campaignText` through `GuardrailsService`**

In `apps/api/src/chatbot/guardrails/guardrails.service.ts`, change the `evaluate` signature and the promises call:

```ts
  evaluate(
    draftBody: string,
    ctx: { chunks: RetrievedChunk[]; language: 'en' | 'ms'; campaignText?: string },
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    const lenResult = this.length.check(draftBody);
    if (!lenResult.ok) failures.push(lenResult.reason);

    const promResult = this.noUnknownPromises.check(draftBody, ctx.chunks, ctx.campaignText);
    if (!promResult.ok) failures.push(promResult.reason);

    const aiResult = this.noAiSelfReference.check(draftBody);
    if (!aiResult.ok) failures.push(aiResult.reason);

    return { passed: failures.length === 0, failures };
  }
```

- [ ] **Step 5: Add a GuardrailsService test**

Append to `apps/api/src/chatbot/guardrails/__tests__/no-unknown-promises.guard.spec.ts`:

```ts
import { GuardrailsService } from '../guardrails.service';
import { LengthGuard } from '../length.guard';
import { NoAiSelfReferenceGuard } from '../no-ai-self-reference.guard';

describe('GuardrailsService — campaignText', () => {
  it('passes campaignText numbers through to the promises guard', () => {
    const svc = new GuardrailsService(new LengthGuard(), new NoUnknownPromisesGuard(), new NoAiSelfReferenceGuard());
    const res = svc.evaluate('Enjoy 15% off until 30 June.', {
      chunks: [],
      language: 'en',
      campaignText: 'Get 15% off, valid till 30 June.',
    });
    expect(res.passed).toBe(true);
  });
});
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm jest src/chatbot/guardrails -t "campaign"`
Expected: PASS (both new describes).

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/chatbot/guardrails
git commit -m "feat(chatbot): guardrails accept campaign text as numeric grounding

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Drafter prompt + service — CAMPAIGN and RECENT CONVERSATION sections

The drafter already accepts `conversationHistory` but ignores it; we render both history and
campaign text into the system prompt (keeping the `[system, user]` message shape that the
existing drafter test asserts).

**Files:**
- Modify: `apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts`
- Modify: `apps/api/src/chatbot/drafter/drafter.service.ts`
- Create: `apps/api/src/chatbot/drafter/prompts/drafter.prompt.spec.ts`
- Modify: `apps/api/src/chatbot/drafter/drafter.service.spec.ts`

- [ ] **Step 1: Write the failing prompt test**

Create `apps/api/src/chatbot/drafter/prompts/drafter.prompt.spec.ts`:

```ts
import { buildDrafterSystemPrompt } from './drafter.prompt';

describe('buildDrafterSystemPrompt', () => {
  it('includes a CAMPAIGN section when campaignText is provided', () => {
    const p = buildDrafterSystemPrompt({
      businessName: 'X',
      language: 'en',
      chunks: [],
      campaignText: 'Get 15% off until 30 June.',
    });
    expect(p).toContain('CAMPAIGN');
    expect(p).toContain('Get 15% off until 30 June.');
  });

  it('omits CAMPAIGN and RECENT CONVERSATION when not provided', () => {
    const p = buildDrafterSystemPrompt({ businessName: 'X', language: 'en', chunks: [] });
    expect(p).not.toContain('CAMPAIGN (');
    expect(p).not.toContain('RECENT CONVERSATION');
  });

  it('renders conversation history with role labels', () => {
    const p = buildDrafterSystemPrompt({
      businessName: 'X',
      language: 'en',
      chunks: [],
      history: [
        { role: 'customer', body: 'Is towing free?' },
        { role: 'bot', body: 'Yes, unlimited.' },
      ],
    });
    expect(p).toContain('RECENT CONVERSATION');
    expect(p).toContain('Customer: Is towing free?');
    expect(p).toContain('You: Yes, unlimited.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm jest src/chatbot/drafter/prompts/drafter.prompt.spec.ts`
Expected: FAIL — `buildDrafterSystemPrompt` does not accept `campaignText`/`history` and never emits those sections.

- [ ] **Step 3: Rewrite the prompt builder**

Replace the entire contents of `apps/api/src/chatbot/drafter/prompts/drafter.prompt.ts`:

```ts
export function buildDrafterSystemPrompt(input: {
  businessName: string;
  language: 'en' | 'ms';
  chunks: Array<{ rank: number; text: string; document: { title: string; category: string } }>;
  campaignText?: string;
  history?: Array<{ role: 'customer' | 'bot' | 'operator'; body: string }>;
}): string {
  const lang = input.language === 'ms' ? 'Bahasa Malaysia' : 'English';
  const sources = input.chunks.length
    ? input.chunks
        .map(
          (c) =>
            `[CHUNK ${c.rank} — from "${c.document.title}" (${c.document.category})]\n${c.text}`,
        )
        .join('\n\n---\n\n')
    : '(no relevant knowledge found)';

  const campaignBlock = input.campaignText
    ? `CAMPAIGN (the marketing message this customer recently received — answer questions about this offer, discount, or deadline from here):\n${input.campaignText}\n\n`
    : '';

  const historyBlock =
    input.history && input.history.length
      ? `RECENT CONVERSATION (oldest first; use it to resolve follow-up questions like "what about that?"):\n${input.history
          .map(
            (h) =>
              `${h.role === 'customer' ? 'Customer' : h.role === 'operator' ? 'Agent' : 'You'}: ${h.body}`,
          )
          .join('\n')}\n\n`
      : '';

  return `You are a customer support agent for ${input.businessName}, a Malaysian business. Reply in ${lang}, briefly and politely.

Use ONLY the facts in the CAMPAIGN and SOURCES sections below. Do NOT invent prices, dates, policies, or any fact not present there. If the customer asks about the offer they received, answer from CAMPAIGN; otherwise use SOURCES. If neither contains the answer, say "Let me check with my colleague and get back to you shortly." in ${lang}.

Keep replies under 200 characters when possible. Do NOT mention that you are an AI, bot, or automated system.

${campaignBlock}${historyBlock}SOURCES:
${sources}

Respond ONLY with a JSON object: {"reply": "...", "confidence": 0.0-1.0, "cited_chunks": [<rank>, ...]}
- confidence: how well the CAMPAIGN/SOURCES answer the question. 1.0 = perfect, 0.5 = partial, 0.0 = no relevant info found.
- cited_chunks: array of SOURCE chunk numbers (1-indexed) you actually used. Use an empty array if you answered from CAMPAIGN or said "let me check".`;
}
```

- [ ] **Step 4: Run prompt test to verify it passes**

Run: `pnpm jest src/chatbot/drafter/prompts/drafter.prompt.spec.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing drafter-service forwarding test**

Append to `apps/api/src/chatbot/drafter/drafter.service.spec.ts` (inside the existing `describe('DrafterService', ...)` block):

```ts
  it('passes campaignText and history into the system prompt', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"reply": "ok", "confidence": 0.9, "cited_chunks": []}'),
    );
    const svc = new DrafterService(makeLlm(complete));

    await svc.draft({
      customerMessage: 'when does it end?',
      language: 'en',
      chunks: [],
      businessName: 'Kedai Kopi',
      campaignText: 'Get 15% off until 30 June.',
      conversationHistory: [{ role: 'customer', body: 'hi' }],
    });

    const [, messages] = complete.mock.calls[0];
    expect(messages[0].content).toContain('Get 15% off until 30 June.');
    expect(messages[0].content).toContain('RECENT CONVERSATION');
    expect(messages[1]).toEqual({ role: 'user', content: 'when does it end?' });
  });
```

- [ ] **Step 6: Run it to verify it fails**

Run: `pnpm jest src/chatbot/drafter/drafter.service.spec.ts -t "passes campaignText"`
Expected: FAIL — `draft()` builds the prompt from chunks only; campaign/history text is absent.

- [ ] **Step 7: Forward campaignText + history in `draft()`**

In `apps/api/src/chatbot/drafter/drafter.service.ts`, change the `buildDrafterSystemPrompt` call inside `draft()`:

```ts
    const system = buildDrafterSystemPrompt({
      businessName: input.businessName,
      language: input.language,
      chunks: input.chunks.map((c) => ({ rank: c.rank, text: c.text, document: c.document })),
      campaignText: input.campaignText,
      history: input.conversationHistory,
    });
```

Then add `campaignText` to the `DrafterInput` interface at the top of the same file:

```ts
export interface DrafterInput {
  customerMessage: string;
  language: 'en' | 'ms';
  chunks: RetrievedChunk[]; // from RetrievalService
  conversationHistory?: Array<{ role: 'customer' | 'bot' | 'operator'; body: string }>;
  businessName: string;
  campaignText?: string;
}
```

- [ ] **Step 8: Run the full drafter suite**

Run: `pnpm jest src/chatbot/drafter`
Expected: PASS — including the pre-existing test asserting `messages[1]` is the plain user message.

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/chatbot/drafter
git commit -m "feat(chatbot): drafter renders campaign + conversation history into prompt

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Decision engine forwards campaign context + history

**Files:**
- Modify: `apps/api/src/chatbot/decision/decision.types.ts`
- Modify: `apps/api/src/chatbot/decision/decision-engine.service.ts`
- Create: `apps/api/src/chatbot/decision/__tests__/decision-engine.campaign.spec.ts`

- [ ] **Step 1: Add `campaignContext` to `DecisionInput`**

In `apps/api/src/chatbot/decision/decision.types.ts`, extend `DecisionInput`:

```ts
export interface DecisionInput {
  inboundMessageBody: string;
  contactOptedIn: boolean;
  csWindowOpen: boolean;
  businessName: string;
  conversationId: string;
  conversationHistory?: Array<{ role: 'customer' | 'bot' | 'operator'; body: string }>;
  campaignContext?: { campaignName: string; renderedText: string; blastId: string };
}
```

- [ ] **Step 2: Write the failing engine test**

Create `apps/api/src/chatbot/decision/__tests__/decision-engine.campaign.spec.ts`:

```ts
import { DecisionEngine } from '../decision-engine.service';
import { CannedRepliesService } from '../../drafter/prompts/canned-replies';
import { RetrievedChunk, RetrievalResult } from '../../knowledge/retrieval.service';
import { DrafterOutput } from '../../drafter/drafter.service';

function chunk(over: Partial<RetrievedChunk> & { chunkId: string; rank: number }): RetrievedChunk {
  return {
    chunkId: over.chunkId,
    text: over.text ?? 'We open at 9am daily.',
    tokenCount: over.tokenCount ?? 5,
    similarityScore: over.similarityScore ?? 0.9,
    rank: over.rank,
    document: over.document ?? { id: 'd1', name: 'hours.md', title: 'Hours', category: 'General' },
  };
}

function retrievalResult(chunks: RetrievedChunk[]): RetrievalResult {
  return { chunks, embeddingLatencyMs: 3, searchLatencyMs: 4, totalLatencyMs: 7, queryEmbeddingModel: 'mock-embed' };
}

function drafterOutput(over: Partial<DrafterOutput> = {}): DrafterOutput {
  return {
    body: 'We open at 9am daily.',
    draftConfidence: 0.95,
    modelUsed: 'mock-model',
    latencyMs: 12,
    citedChunkIds: ['c1'],
    citedRanks: [1],
    ...over,
  };
}

function buildEngine() {
  const classifier = { classify: jest.fn(async () => ({ intent: 'inquiry', confidence: 0.9, language: 'en' as const })) };
  const retrieval = { retrieve: jest.fn(async () => retrievalResult([chunk({ chunkId: 'c1', rank: 1 })])) };
  const drafter = { draft: jest.fn(async () => drafterOutput()) };
  const guardrails = { evaluate: jest.fn(() => ({ passed: true, failures: [] as string[] })) };
  const optOut = { detect: jest.fn(() => false) };
  const complaint = { detect: jest.fn(() => false) };
  const yesNo = { detect: jest.fn(() => 'none' as const) };
  const canned = new CannedRepliesService();
  const conversations = {
    hasPendingEscalation: jest.fn(async () => false),
    isOfferingEscalation: jest.fn(async () => false),
  };
  const settings = {
    get: jest.fn(async (key: string, def?: unknown) => {
      const map: Record<string, unknown> = {
        enabled: true,
        disable_auto_reply: false,
        confidence_threshold: 0.85,
        business_hours_start: '00:00',
        business_hours_end: '24:00',
        business_days: 'MON,TUE,WED,THU,FRI,SAT,SUN',
        business_hours_timezone: 'Asia/Kuala_Lumpur',
      };
      return key in map ? map[key] : def;
    }),
  };

  const engine = new DecisionEngine(
    classifier as any,
    retrieval as any,
    drafter as any,
    guardrails as any,
    optOut as any,
    complaint as any,
    yesNo as any,
    canned,
    conversations as any,
    settings as any,
  );
  return { engine, drafter, guardrails };
}

describe('DecisionEngine — campaign context', () => {
  it('forwards campaign text to the drafter and the guardrails on a confident answer', async () => {
    const { engine, drafter, guardrails } = buildEngine();

    const decision = await engine.decide({
      inboundMessageBody: 'when does the offer end?',
      contactOptedIn: true,
      csWindowOpen: true,
      businessName: 'Kedai Kopi',
      conversationId: 'conv-1',
      campaignContext: { campaignName: 'June Promo', renderedText: 'Get 15% off until 30 June.', blastId: 'b1' },
    });

    expect(decision.subKind).toBe('rag_answer');
    expect(drafter.draft).toHaveBeenCalledWith(
      expect.objectContaining({ campaignText: 'Get 15% off until 30 June.' }),
    );
    expect(guardrails.evaluate).toHaveBeenCalledWith(
      'We open at 9am daily.',
      expect.objectContaining({ campaignText: 'Get 15% off until 30 June.' }),
    );
  });

  it('omits campaignText when no campaign context is supplied', async () => {
    const { engine, drafter } = buildEngine();

    await engine.decide({
      inboundMessageBody: 'what time do you open?',
      contactOptedIn: true,
      csWindowOpen: true,
      businessName: 'Kedai Kopi',
      conversationId: 'conv-1',
    });

    expect(drafter.draft).toHaveBeenCalledWith(expect.objectContaining({ campaignText: undefined }));
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `pnpm jest src/chatbot/decision/__tests__/decision-engine.campaign.spec.ts`
Expected: FAIL — engine does not yet pass `campaignText` to drafter/guardrails.

- [ ] **Step 4: Forward in the main pipeline**

In `apps/api/src/chatbot/decision/decision-engine.service.ts`, in `decide()`, update the main-pipeline `drafter.draft` call (currently passing `customerMessage/language/chunks/conversationHistory/businessName`):

```ts
      draft = await this.drafter.draft({
        customerMessage: input.inboundMessageBody,
        language,
        chunks: retrieval.chunks,
        conversationHistory: input.conversationHistory,
        businessName: input.businessName,
        campaignText: input.campaignContext?.renderedText,
      });
```

And update the main-pipeline guardrails call (currently `this.guardrails.evaluate(draft.body, { chunks: retrieval.chunks, language })`):

```ts
    const guard = this.guardrails.evaluate(draft.body, {
      chunks: retrieval.chunks,
      language,
      campaignText: input.campaignContext?.renderedText,
    });
```

- [ ] **Step 5: Forward in `tryRagAnswer` (pending-escalation path)**

In the same file, in the private `tryRagAnswer()` method, update its `drafter.draft` call:

```ts
      const draft = await this.drafter.draft({
        customerMessage: input.inboundMessageBody,
        language,
        chunks: retrieval.chunks,
        conversationHistory: input.conversationHistory,
        businessName: input.businessName,
        campaignText: input.campaignContext?.renderedText,
      });
```

And its guardrails call (currently `this.guardrails.evaluate(draft.body, { chunks: retrieval.chunks, language })`):

```ts
      const guard = this.guardrails.evaluate(draft.body, {
        chunks: retrieval.chunks,
        language,
        campaignText: input.campaignContext?.renderedText,
      });
```

- [ ] **Step 6: Run the engine tests**

Run: `pnpm jest src/chatbot/decision`
Expected: PASS — the new campaign spec and the existing `decision-engine.service.spec.ts`.

- [ ] **Step 7: Commit**

```bash
git add apps/api/src/chatbot/decision
git commit -m "feat(chatbot): decision engine forwards campaign context to drafter and guardrails

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: CampaignContextService — attribution + rendering

**Files:**
- Create: `apps/api/src/chatbot/campaign/campaign-context.service.ts`
- Create: `apps/api/src/chatbot/campaign/campaign.module.ts`
- Create: `apps/api/src/chatbot/campaign/__tests__/campaign-context.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `apps/api/src/chatbot/campaign/__tests__/campaign-context.service.spec.ts`:

```ts
import { CampaignContextService } from '../campaign-context.service';

const CONTACT = { id: 'c1', phoneE164: '+60123456789', name: 'Ali' } as any;

function buildPrisma(over: {
  findFirst?: any;
  findMany?: any;
  blast?: any;
  template?: any;
}) {
  return {
    message: {
      findFirst: jest.fn(async () => over.findFirst ?? null),
      findMany: jest.fn(async () => over.findMany ?? []),
    },
    blast: { findUnique: jest.fn(async () => over.blast ?? null) },
    template: { findUnique: jest.fn(async () => over.template ?? null) },
  } as any;
}

describe('CampaignContextService', () => {
  it('uses an exact quote-reply match and skips the time heuristic', async () => {
    const prisma = buildPrisma({
      findFirst: { blastId: 'b1', templateId: 't1' },
      blast: { id: 'b1', name: 'June Promo', variableMapping: {} },
      template: { id: 't1', bodyText: 'Get 15% off until 30 June.' },
    });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT, replyToMetaMessageId: 'wamid.blast1' });

    expect(ctx).toEqual({ blastId: 'b1', campaignName: 'June Promo', renderedText: 'Get 15% off until 30 June.' });
    expect(prisma.message.findMany).not.toHaveBeenCalled();
  });

  it('falls back to the most-recent blast within the window when there is no quote-reply', async () => {
    const recent = new Date(Date.now() - 60 * 60 * 1000); // 1h ago
    const prisma = buildPrisma({
      findMany: [{ id: 'm1', blastId: 'b1', status: 'SENT', sentAt: recent, templateId: 't1' }],
      blast: { id: 'b1', name: 'June Promo', variableMapping: {} },
      template: { id: 't1', bodyText: 'Get 15% off until 30 June.' },
    });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT });

    expect(prisma.message.findFirst).not.toHaveBeenCalled();
    expect(ctx?.blastId).toBe('b1');
    expect(ctx?.renderedText).toBe('Get 15% off until 30 June.');
  });

  it('returns null when no blast falls within the window', async () => {
    const prisma = buildPrisma({ findMany: [] });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT });

    expect(ctx).toBeNull();
  });

  it('renders template variables against the contact', async () => {
    const prisma = buildPrisma({
      findFirst: { blastId: 'b1', templateId: 't1' },
      blast: { id: 'b1', name: 'Promo', variableMapping: { '1': 'contact.name', '2': 'literal:15%' } },
      template: { id: 't1', bodyText: 'Hi {{1}}, get {{2}} off!' },
    });
    const svc = new CampaignContextService(prisma);

    const ctx = await svc.getActiveCampaign({ contact: CONTACT, replyToMetaMessageId: 'wamid.x' });

    expect(ctx?.renderedText).toBe('Hi Ali, get 15% off!');
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm jest src/chatbot/campaign/__tests__/campaign-context.service.spec.ts`
Expected: FAIL — module `../campaign-context.service` does not exist.

- [ ] **Step 3: Implement the service**

Create `apps/api/src/chatbot/campaign/campaign-context.service.ts`:

```ts
import { Injectable } from '@nestjs/common';
import { Contact } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { attributeReply } from '../../blasts/reply-attribution';
import { renderTemplate, VariableMapping } from '../../blasts/variable-renderer';

/** A reply within this many days of a blast is treated as "about that campaign". */
export const CAMPAIGN_ATTRIBUTION_WINDOW_DAYS = 7;

export interface CampaignContext {
  blastId: string;
  campaignName: string;
  renderedText: string;
}

/**
 * Resolves which campaign an inbound message is about, and renders that campaign's exact text.
 *
 * Two-tier attribution:
 *  1. EXACT  — the inbound quote-replies a blast message (WhatsApp `context.id`) → that campaign.
 *  2. FALLBACK — most-recent SENT/DELIVERED/READ blast within CAMPAIGN_ATTRIBUTION_WINDOW_DAYS.
 *
 * Returns null when nothing attributes (the chatbot then behaves as pure KB RAG).
 */
@Injectable()
export class CampaignContextService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveCampaign(input: {
    contact: Contact;
    replyToMetaMessageId?: string;
  }): Promise<CampaignContext | null> {
    const resolved = await this.resolveBlastMessage(input.contact.id, input.replyToMetaMessageId);
    if (!resolved?.templateId) return null;

    const [blast, template] = await Promise.all([
      this.prisma.blast.findUnique({ where: { id: resolved.blastId } }),
      this.prisma.template.findUnique({ where: { id: resolved.templateId } }),
    ]);
    if (!blast || !template) return null;

    const renderedText = renderTemplate(
      template.bodyText,
      (blast.variableMapping ?? {}) as VariableMapping,
      input.contact as any,
    );

    return { blastId: blast.id, campaignName: blast.name, renderedText };
  }

  private async resolveBlastMessage(
    contactId: string,
    replyToMetaMessageId?: string,
  ): Promise<{ blastId: string; templateId: string | null } | null> {
    // Tier 1 — exact quote-reply match.
    if (replyToMetaMessageId) {
      const exact = await this.prisma.message.findFirst({
        where: { metaMessageId: replyToMetaMessageId, blastId: { not: null } },
        select: { blastId: true, templateId: true },
      });
      if (exact?.blastId) return { blastId: exact.blastId, templateId: exact.templateId };
    }

    // Tier 2 — most recent blast within the window.
    const candidates = await this.prisma.message.findMany({
      where: {
        contactId,
        source: 'BLAST',
        blastId: { not: null },
        status: { in: ['SENT', 'DELIVERED', 'READ'] },
      },
      orderBy: { sentAt: 'desc' },
      take: 20,
      select: { id: true, blastId: true, status: true, sentAt: true, templateId: true },
    });

    const attribution = attributeReply(
      candidates.map((c) => ({ id: c.id, blastId: c.blastId as string, status: c.status, sentAt: c.sentAt })),
      new Date(),
      CAMPAIGN_ATTRIBUTION_WINDOW_DAYS,
    );
    if (!attribution) return null;

    const picked = candidates.find((c) => c.id === attribution.messageId);
    if (!picked?.blastId) return null;
    return { blastId: picked.blastId, templateId: picked.templateId };
  }
}
```

- [ ] **Step 4: Create the module**

Create `apps/api/src/chatbot/campaign/campaign.module.ts`:

```ts
import { Module } from '@nestjs/common';
import { CampaignContextService } from './campaign-context.service';

/** PrismaModule is @Global, so PrismaService needs no explicit import here. */
@Module({
  providers: [CampaignContextService],
  exports: [CampaignContextService],
})
export class CampaignModule {}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `pnpm jest src/chatbot/campaign/__tests__/campaign-context.service.spec.ts`
Expected: PASS (all four cases).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/chatbot/campaign
git commit -m "feat(chatbot): CampaignContextService — two-tier attribution + template render

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Wire ChatbotService — payload context, campaign + history resolution

**Files:**
- Modify: `apps/api/src/chatbot/chatbot.service.ts`
- Modify: `apps/api/src/chatbot/chatbot.service.spec.ts`
- Modify: `apps/api/src/chatbot/chatbot.module.ts`

- [ ] **Step 1: Update the spec's service factory + add a wiring test**

In `apps/api/src/chatbot/chatbot.service.spec.ts`:

(a) Add the import near the other imports:

```ts
import { CampaignContextService } from './campaign/campaign-context.service';
```

(b) In `buildService()`, add a `getConversationHistory` mock to the `conversations` object (add this line inside the `conversations` object literal):

```ts
    getConversationHistory: jest.fn(async () => []),
```

(c) In `buildService()`, add a `campaign` mock after the `config` const:

```ts
  const campaign = { getActiveCampaign: jest.fn(async () => null) };
```

(d) Pass `campaign` as the final constructor argument:

```ts
  const service = new ChatbotService(
    conversations as unknown as ConversationService,
    decisionEngine as unknown as DecisionEngine,
    whatsapp as unknown as ChatbotWhatsappService,
    prisma as unknown as PrismaService,
    settings as unknown as ChatbotSettingsService,
    logger as unknown as Logger,
    config as unknown as ConfigService,
    campaign as unknown as CampaignContextService,
  );

  return { service, conversations, decisionEngine, whatsapp, prisma, settings, logger, config, campaign };
```

(e) Add this test inside `describe('audit + language (every decision)', ...)`:

```ts
    it('resolves campaign context + history and passes them to the engine', async () => {
      const { service, decisionEngine, conversations, campaign } = buildService();
      conversations.getConversationHistory.mockResolvedValueOnce([
        { role: 'customer', body: 'is towing free?' },
        { role: 'bot', body: 'Yes, unlimited.' },
        { role: 'customer', body: 'What time do you open?' }, // current inbound, dropped
      ]);
      campaign.getActiveCampaign.mockResolvedValueOnce({
        campaignName: 'June Promo',
        renderedText: 'Get 15% off until 30 June.',
        blastId: 'b1',
      });

      await service.handleInbound(payload({ message: { context: { id: 'wamid.blast1' } } }));

      expect(campaign.getActiveCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ replyToMetaMessageId: 'wamid.blast1' }),
      );
      expect(decisionEngine.decide).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignContext: { campaignName: 'June Promo', renderedText: 'Get 15% off until 30 June.', blastId: 'b1' },
          conversationHistory: [
            { role: 'customer', body: 'is towing free?' },
            { role: 'bot', body: 'Yes, unlimited.' },
          ],
        }),
      );
    });
```

- [ ] **Step 2: Run it to verify it fails**

Run: `pnpm jest src/chatbot/chatbot.service.spec.ts -t "resolves campaign context"`
Expected: FAIL — `ChatbotService` constructor takes 7 args (no campaign dep) and never calls `getActiveCampaign`/`getConversationHistory`.

- [ ] **Step 3: Add `context` to the payload type**

In `apps/api/src/chatbot/chatbot.service.ts`, update the `ChatbotInboundPayload` interface:

```ts
export interface ChatbotInboundPayload {
  contacts: Array<{ wa_id: string; profile?: { name?: string } }>;
  message: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    context?: { id?: string };
  };
}
```

- [ ] **Step 4: Inject `CampaignContextService`**

In `apps/api/src/chatbot/chatbot.service.ts`, add the import:

```ts
import { CampaignContextService } from './campaign/campaign-context.service';
```

Add it as the final constructor parameter (after `config`):

```ts
    private readonly config: ConfigService,
    private readonly campaign: CampaignContextService,
  ) {
```

- [ ] **Step 5: Resolve campaign + history and pass to `decide()`**

In `handleInbound()`, replace the block that builds `csWindowOpen`, `businessName` and calls `decide()` (currently lines that compute `csWindowOpen`/`businessName` then `const decision = await this.decisionEngine.decide({...})`) with:

```ts
    const csWindowOpen = await this.conversations.getCsWindowOpen(conversationId);
    const businessName = await this.settings.get('business_name', 'Our Business');

    // Campaign attribution: exact quote-reply match, else most-recent blast within the window.
    const campaignContext =
      (await this.campaign.getActiveCampaign({ contact, replyToMetaMessageId: message.context?.id })) ?? undefined;

    // Conversation memory: prior turns only — the just-persisted current inbound is the last turn.
    const history = await this.conversations.getConversationHistory(conversationId);
    const conversationHistory = history.slice(0, -1);

    const decision = await this.decisionEngine.decide({
      inboundMessageBody: body,
      contactOptedIn: contact.optInStatus === 'OPTED_IN',
      csWindowOpen,
      businessName,
      conversationId,
      conversationHistory,
      campaignContext,
    });
```

- [ ] **Step 6: Import `CampaignModule` into `ChatbotModule`**

In `apps/api/src/chatbot/chatbot.module.ts`, add the import and include it in `imports`:

```ts
import { CampaignModule } from './campaign/campaign.module';
```

```ts
@Module({
  imports: [ConversationsModule, DecisionModule, ChatbotWhatsappModule, ChatbotSettingsModule, CampaignModule],
  providers: [ChatbotService, chatbotLogger],
  exports: [ChatbotService],
})
export class ChatbotModule {}
```

- [ ] **Step 7: Run the chatbot service suite**

Run: `pnpm jest src/chatbot/chatbot.service.spec.ts`
Expected: PASS — the new wiring test plus all existing tests (the `decide` assertions use `objectContaining`, so the extra fields don't break them).

- [ ] **Step 8: Build to confirm DI + types compile**

Run: `pnpm build`
Expected: build succeeds (no TS errors; `ChatbotModule` resolves `CampaignContextService`).

- [ ] **Step 9: Commit**

```bash
git add apps/api/src/chatbot/chatbot.service.ts apps/api/src/chatbot/chatbot.service.spec.ts apps/api/src/chatbot/chatbot.module.ts
git commit -m "feat(chatbot): resolve campaign context + conversation history per inbound

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Full verification

- [ ] **Step 1: Run the entire chatbot test suite**

Run: `pnpm jest src/chatbot`
Expected: PASS — all chatbot specs green.

- [ ] **Step 2: Typecheck/build**

Run: `pnpm build`
Expected: success.

- [ ] **Step 3 (optional, requires running stack): mock-mode end-to-end**

With Postgres/Redis up and `LLM_MOCK_MODE=true`, drive the sim CLI for a contact that has a recent blast and assert the campaign text influences the answer. Use the existing sim entrypoint:

Run: `pnpm --filter @app/api exec ts-node src/chatbot/sim/sim.cli.ts` (follow its usage output)
Expected: an inbound about the campaign produces a campaign-grounded answer; an unrelated question still uses KB RAG; an unanswerable one offers support.

- [ ] **Step 4: Final commit (if any test-only tweaks were needed)**

```bash
git add -A
git commit -m "test(chatbot): campaign-aware end-to-end verification

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Notes for the implementer

- **Run all commands from `apps/api`.** The repo is a pnpm monorepo; `pnpm jest <path>` and `pnpm build` resolve within the API package.
- **Reused pure helpers** (`attributeReply`, `renderTemplate`) live under `src/blasts/`. Importing them into `src/chatbot/` is fine — they have no Nest/DI dependencies. Do NOT import the blasting WhatsApp client into the chatbot (that isolation rule still holds).
- **`Message.templateId` is always set for blast messages** (guaranteed at blast creation), so loading the template by id is safe.
- **No DB migration is required** — this feature reads existing tables only.
- **Out of scope** (do not build here): lead-capture / quote / plan-recommendation flows; making the 7-day window a configurable setting.
