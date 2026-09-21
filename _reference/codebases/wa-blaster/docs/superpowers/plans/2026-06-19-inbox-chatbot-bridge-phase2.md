# Inbox ↔ AI-Chatbot Bridge — Phase 2 (Frontend) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let operators choose how a resolved/closed ticket's chatbot conversation is captured into the RAG KB (IMPORT_LIVE / SAVE_DRAFT / SKIP), and surface that inbox suggestions/auto-replies are RAG-backed — completing spec §3.5/§3.7/§5-Phase-2 on the existing dashboard inbox.

**Architecture:** A small backend addition threads an optional `disposition` (+ `editedAnswer`/`resolutionNotes`) through the existing `POST /tickets/:id/resolve|close` endpoints into `ConversationService.close()` (default `SKIP` keeps today's behavior). The frontend reorders the inbox so Resolve/Close opens the existing `SaveToKnowledgeModal` **first** as a disposition chooser that performs the resolve/close with the operator's choice. Plus minimal "RAG-backed" labels. No schema/migration change.

**Tech Stack:** NestJS + Prisma (api), React 18 + TanStack Query v5 + axios + inline-style/CSS-var UI (web), Playwright (e2e). class-validator DTOs.

## Global Constraints

- **NEVER import or modify the blasting `WhatsappCloudApiService`** (`apps/api/src/whatsapp/whatsapp-cloud-api.service.ts`). Phase 2 does not send messages at all.
- **No schema change / no migration** in this phase. If you think you need one, stop — re-read the plan. NEVER run `prisma migrate dev` (it tries to drop the raw-SQL pgvector `knowledge_chunks.embedding` column).
- **Default disposition is `SKIP`** everywhere a body is absent — an empty resolve/close body must behave exactly as today.
- **Best-effort vs. surfaced:** for `SKIP`, a non-closeable linked conversation (`ConflictException`) stays swallowed+logged (the ticket is the operator's primary object). For a **non-SKIP** disposition the operator explicitly asked to capture, so surface the conflict (`NO_OPERATOR_REPLY` / `INVALID_STATE`) instead of silently dropping the capture.
- **Reuse the shared disposition type** `CloseDisposition` + `CLOSE_DISPOSITIONS` from `apps/api/src/chatbot/dto/conversations.dto.ts`; do not redeclare the union in api code.
- **Static gates** (eslint is absent in this env — do not rely on `lint`):
  - api: `pnpm --filter api exec tsc --noEmit -p tsconfig.build.json`
  - web: `pnpm --filter web exec tsc --noEmit`
- **Backend tests** run jest against the **live dev DB** (`localhost:5432/wbs`) with mocked queue/WhatsApp/embeddings; run them `--runInBand`. **Frontend has no unit-test runner** — per-task frontend verification is the `tsc` typecheck above; behavioral verification is the Phase 3 Playwright e2e + live click-through (this plan adds the e2e assertions but defers the full run to Phase 3).
- **Worktree env:** if `node_modules`/`.env` are missing, copy `apps/api/.env` from the main checkout, `pnpm install --frozen-lockfile`, `pnpm --filter api exec prisma generate` before running anything.
- **Commit after every task** (DRY/YAGNI/TDD, frequent commits). Do not push unless asked (workflow-push-no-pr).

---

## File Structure

**Backend (apps/api):**
- Create `src/tickets/dto/resolve-ticket.dto.ts` — optional resolve/close body (`disposition?`, `resolutionNotes?`, `editedAnswer?`).
- Modify `src/tickets/tickets.controller.ts` — `resolve`/`close` accept `@Body() dto`.
- Modify `src/tickets/tickets.service.ts` — `resolve`/`close` accept opts, reorder close-before-status, thread disposition through `closeLinkedConversation` with SKIP-only swallow.
- Modify `src/tickets/tickets.service.spec.ts` — add disposition integration tests.

**Frontend (apps/web):**
- Modify `src/api/tickets.ts` — `CloseDisposition` type + `ResolveTicketOptions`; `resolveTicket`/`closeTicket` send the body.
- Rewrite `src/pages/inbox/SaveToKnowledgeModal.tsx` — disposition chooser that performs the resolve/close.
- Modify `src/pages/inbox/NeedsHumanMode.tsx` — modal-first wiring (carry `action`), invalidate+toast on done, minimal RAG label.
- Modify `src/components/inbox/MessageBubble.tsx` — audit card shows "RAG knowledge base" source when `matchedKbSlug` is null.

**e2e:**
- Modify `e2e/tests/inbox-agent-assist.spec.ts` — assert the disposition modal (assertions run in Phase 3).

---

## Task 1: Backend — resolve/close accept a capture disposition

**Files:**
- Create: `apps/api/src/tickets/dto/resolve-ticket.dto.ts`
- Modify: `apps/api/src/tickets/tickets.controller.ts:40-48`
- Modify: `apps/api/src/tickets/tickets.service.ts:134-154,228-243`
- Test: `apps/api/src/tickets/tickets.service.spec.ts` (append a describe block)

**Interfaces:**
- Consumes: `ConversationService.close({ conversationId, userId, disposition, resolutionNotes?, editedAnswer? })` (existing, `conversation.service.ts:322`); `CloseDisposition` + `CLOSE_DISPOSITIONS` from `chatbot/dto/conversations.dto.ts`.
- Produces (frontend Task 2 relies on these): `POST /tickets/:id/resolve` and `POST /tickets/:id/close` accept an optional JSON body `{ disposition?: 'IMPORT_LIVE'|'SAVE_DRAFT'|'SKIP'; resolutionNotes?: string; editedAnswer?: string }`; absent/empty body ⇒ `SKIP`. Both still return the enriched `Ticket` (`{ ...ticket, num }`). A non-SKIP disposition with no operator reply on the linked conversation responds **409** with body `{ code: 'NO_OPERATOR_REPLY', message }` and does **not** change ticket status.

- [ ] **Step 1: Write the failing tests** (append to `apps/api/src/tickets/tickets.service.spec.ts`)

Add `ConflictException` to the existing nestjs import if not present, then append:

```ts
describe('TicketsService.resolve with a capture disposition', () => {
  it('SAVE_DRAFT — closes the conversation and records a pending ResolutionCapture with that disposition', async () => {
    const contactId = await makeContact();
    const operator = await makeOperator();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    // A capture disposition requires at least one operator reply on the conversation.
    await conversations.recordOperatorReply(conv.id, 'Top up via the app under Wallet → Add credit.', operator);
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'LOW_CONFIDENCE', status: 'OPEN' } });

    const result = await svc.resolve(ticket.id, operator, { disposition: 'SAVE_DRAFT', editedAnswer: 'Open Wallet → Add credit.' });

    expect(result.status).toBe('RESOLVED');
    const after = await prisma.conversation.findUniqueOrThrow({ where: { id: conv.id } });
    expect(after.state).toBe('RESOLVED');
    const capture = await prisma.resolutionCapture.findFirst({ where: { conversationId: conv.id }, orderBy: { closedAt: 'desc' } });
    expect(capture?.disposition).toBe('SAVE_DRAFT');
    expect(capture?.editedAnswer).toBe('Open Wallet → Add credit.');
  });

  it('non-SKIP without an operator reply — surfaces the conflict and leaves the ticket OPEN', async () => {
    const contactId = await makeContact();
    const operator = await makeOperator();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'ESCALATED', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });

    await expect(svc.resolve(ticket.id, operator, { disposition: 'IMPORT_LIVE' })).rejects.toBeInstanceOf(ConflictException);

    const after = await prisma.ticket.findUniqueOrThrow({ where: { id: ticket.id } });
    expect(after.status).toBe('OPEN'); // close-first ordering: a rejected capture must not resolve the ticket
  });

  it('default (no opts) still resolves with SKIP — best-effort even when not closeable', async () => {
    const contactId = await makeContact();
    const conv = await prisma.conversation.create({ data: { contactId, state: 'NEW', lastInboundAt: new Date() } });
    const ticket = await prisma.ticket.create({ data: { contactId, conversationId: conv.id, reason: 'COMPLAINT', status: 'OPEN' } });

    const result = await svc.resolve(ticket.id, randomUUID());

    expect(result.status).toBe('RESOLVED');
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm --filter api exec jest src/tickets/tickets.service.spec.ts --runInBand`
Expected: the two new disposition tests FAIL (current `resolve(id, userId)` ignores a 3rd arg and always uses `SKIP`, so SAVE_DRAFT capture isn't created and IMPORT_LIVE doesn't throw). The existing tests still pass.

- [ ] **Step 3: Create the DTO** (`apps/api/src/tickets/dto/resolve-ticket.dto.ts`)

```ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CLOSE_DISPOSITIONS, CloseDisposition } from '../../chatbot/dto/conversations.dto';

/**
 * Optional body for POST /tickets/:id/resolve and /close. Lets the operator choose how the linked
 * chatbot conversation's resolution is captured into the KB. An absent/empty body ⇒ SKIP, preserving
 * the pre-Phase-2 behavior. Mirrors CloseConversationDto (minus forcedDespiteDuplicate, unused here).
 */
export class ResolveTicketDto {
  @ApiPropertyOptional({
    enum: CLOSE_DISPOSITIONS,
    description: 'IMPORT_LIVE publishes the resolution to the KB; SAVE_DRAFT stores a draft; SKIP (default) captures nothing.',
  })
  @IsOptional()
  @IsIn(CLOSE_DISPOSITIONS)
  disposition?: CloseDisposition;

  @ApiPropertyOptional({ description: 'Internal notes about how the ticket was resolved.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resolutionNotes?: string;

  @ApiPropertyOptional({ description: 'Cleaned-up answer used as the authoritative KB content (overrides the literal operator reply).' })
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  editedAnswer?: string;
}
```

- [ ] **Step 4: Thread the DTO through the controller** (`apps/api/src/tickets/tickets.controller.ts`)

Add the import after the existing dto imports (line 7):

```ts
import { ResolveTicketDto } from './dto/resolve-ticket.dto';
```

Replace the `resolve` and `close` handlers (lines 40-48) with:

```ts
  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() dto: ResolveTicketDto, @Req() req: Request) {
    return this.tickets.resolve(id, (req.user as { id: string }).id, dto);
  }

  @Post(':id/close')
  close(@Param('id') id: string, @Body() dto: ResolveTicketDto, @Req() req: Request) {
    return this.tickets.close(id, (req.user as { id: string }).id, dto);
  }
```

- [ ] **Step 5: Thread it through the service** (`apps/api/src/tickets/tickets.service.ts`)

Add a type-only import near the top (after line 6):

```ts
import type { CloseDisposition } from '../chatbot/dto/conversations.dto';
```

Add an options type just above the class (after `formatTicketNum`, ~line 12):

```ts
export interface ResolveOptions {
  disposition?: CloseDisposition;
  resolutionNotes?: string;
  editedAnswer?: string;
}
```

Replace `resolve` and `close` (lines 134-154) with close-first ordering:

```ts
  async resolve(id: string, userId: string, opts: ResolveOptions = {}) {
    const existing = await this.getOrThrow(id);
    // Close-first: for a non-SKIP disposition the capture must succeed (or surface) BEFORE we mark the
    // ticket resolved, so a NO_OPERATOR_REPLY/INVALID_STATE error never leaves a resolved ticket with no
    // capture. SKIP stays best-effort (swallows a non-closeable conversation; see closeLinkedConversation).
    await this.closeLinkedConversation(existing.conversationId, userId, opts);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }

  async close(id: string, userId: string, opts: ResolveOptions = {}) {
    const existing = await this.getOrThrow(id);
    await this.closeLinkedConversation(existing.conversationId, userId, opts);
    const ticket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'CLOSED', closedAt: new Date() },
      include: TICKET_INCLUDE,
    });
    return this.enrich(ticket);
  }
```

Replace `closeLinkedConversation` (lines 228-243) with:

```ts
  private async closeLinkedConversation(
    conversationId: string | null,
    userId: string,
    opts: ResolveOptions,
  ): Promise<void> {
    if (!conversationId) return;
    const disposition = opts.disposition ?? 'SKIP';
    try {
      await this.conversations.close({
        conversationId,
        userId,
        disposition,
        resolutionNotes: opts.resolutionNotes,
        editedAnswer: opts.editedAnswer,
      });
    } catch (err) {
      // SKIP: a non-closeable conversation (ConflictException) is expected and swallow-worthy — the
      // ticket is the operator's primary object and take-over already stood the bot down. Re-throw
      // anything else (DB/Redis down, programming error).
      // Non-SKIP: the operator explicitly asked to capture, so surface the conflict
      // (NO_OPERATOR_REPLY / INVALID_STATE) rather than silently dropping the capture.
      if (err instanceof ConflictException && disposition === 'SKIP') {
        this.logger.warn(`closeLinkedConversation skipped conv=${conversationId}: ${err.message}`);
        return;
      }
      throw err;
    }
  }
```

(`ConflictException` is already imported at `tickets.service.ts:1`.)

- [ ] **Step 6: Run the tests to verify they pass**

Run: `pnpm --filter api exec jest src/tickets/tickets.service.spec.ts --runInBand`
Expected: PASS (all old + 3 new tests). If `recordOperatorReply` is flaky against the live DB, confirm the dev DB is up (`localhost:5432/wbs`).

- [ ] **Step 7: Typecheck**

Run: `pnpm --filter api exec tsc --noEmit -p tsconfig.build.json`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add apps/api/src/tickets
git commit -m "feat(tickets): resolve/close accept a capture disposition (drives chatbot close → resolution-capture)"
```

---

## Task 2: Frontend API client — send the disposition body

**Files:**
- Modify: `apps/web/src/api/tickets.ts:72-80` (and add types near the existing `CreateKnowledgeCandidateDto`)

**Interfaces:**
- Consumes: the Task 1 endpoints.
- Produces (Tasks 3-4 rely on these): `export type CloseDisposition = 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP'`; `export interface ResolveTicketOptions { disposition?: CloseDisposition; resolutionNotes?: string; editedAnswer?: string }`; `resolveTicket(id: string, opts?: ResolveTicketOptions): Promise<Ticket>`; `closeTicket(id: string, opts?: ResolveTicketOptions): Promise<Ticket>`.

- [ ] **Step 1: Add the types** (`apps/web/src/api/tickets.ts`, after `CreateKnowledgeCandidateDto`, ~line 43)

```ts
export type CloseDisposition = 'IMPORT_LIVE' | 'SAVE_DRAFT' | 'SKIP';

export interface ResolveTicketOptions {
  disposition?: CloseDisposition;
  resolutionNotes?: string;
  editedAnswer?: string;
}
```

- [ ] **Step 2: Send the body from `resolveTicket`/`closeTicket`** (replace lines 72-80)

```ts
export async function resolveTicket(id: string, opts: ResolveTicketOptions = {}): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/tickets/${id}/resolve`, opts);
  return data;
}

export async function closeTicket(id: string, opts: ResolveTicketOptions = {}): Promise<Ticket> {
  const { data } = await api.post<Ticket>(`/tickets/${id}/close`, opts);
  return data;
}
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors (the optional 2nd arg is backward-compatible with existing 1-arg callers).

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/api/tickets.ts
git commit -m "feat(web): tickets API resolve/close accept a capture disposition body"
```

---

## Task 3: Frontend — SaveToKnowledgeModal becomes a disposition chooser

Rewrite the modal so it (a) is opened **before** the resolve/close fires, (b) lets the operator pick a disposition, (c) performs the resolve/close itself, and (d) handles the `NO_OPERATOR_REPLY` 409.

**Files:**
- Rewrite: `apps/web/src/pages/inbox/SaveToKnowledgeModal.tsx`

**Interfaces:**
- Consumes: `resolveTicket`/`closeTicket`/`ResolveTicketOptions`/`CloseDisposition` (Task 2); `getKnowledgeSuggestion` + `KnowledgeSuggestion` (existing, for prefill); `Button, IcBook, IcCheck, IcX` from `../../components/ui`; `isAxiosError` from `axios`.
- Produces (Task 4 relies on this): `export type TicketCloseAction = 'resolve' | 'close'`; `SaveToKnowledgeModal` props `{ ticketId: string; ticketNum: string; action: TicketCloseAction; onClose: () => void; onDone: () => void }`. Test ids: modal root `save-kb-modal`; options `disposition-IMPORT_LIVE|disposition-SAVE_DRAFT|disposition-SKIP`; submit `kb-confirm`.

- [ ] **Step 1: Replace the whole file** (`apps/web/src/pages/inbox/SaveToKnowledgeModal.tsx`)

```tsx
// SaveToKnowledgeModal.tsx — opened on Resolve/Close: pick how the chatbot resolution is captured into the KB,
// then perform the ticket resolve/close with that disposition. Replaces the legacy createKnowledgeCandidate flow.
import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  getKnowledgeSuggestion,
  resolveTicket,
  closeTicket,
  type CloseDisposition,
} from '../../api/tickets';
import { Button, IcBook, IcCheck, IcX } from '../../components/ui';

export type TicketCloseAction = 'resolve' | 'close';

interface SaveToKnowledgeModalProps {
  ticketId: string;
  ticketNum: string;
  action: TicketCloseAction;
  onClose: () => void;
  onDone: () => void;
}

const OPTIONS: { value: CloseDisposition; label: string; help: string }[] = [
  { value: 'IMPORT_LIVE', label: 'Publish to knowledge base', help: 'The bot can use this answer immediately.' },
  { value: 'SAVE_DRAFT', label: 'Save as draft for review', help: 'Stored as a draft before it goes live.' },
  { value: 'SKIP', label: "Don't save", help: 'Just close the ticket — capture nothing.' },
];

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)',
  marginBottom: 5, letterSpacing: '0.03em', textTransform: 'uppercase',
};

export function SaveToKnowledgeModal({ ticketId, ticketNum, action, onClose, onDone }: SaveToKnowledgeModalProps) {
  const [disposition, setDisposition] = useState<CloseDisposition>('IMPORT_LIVE');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [notes, setNotes] = useState('');
  const [fetched, setFetched] = useState(false);

  // Prefill the Q&A preview from the latest inbound + operator reply (best-effort).
  useEffect(() => {
    getKnowledgeSuggestion(ticketId)
      .then((s) => {
        setQuestion(s.question);
        setAnswer(s.answer);
        setFetched(true);
      })
      .catch(() => setFetched(true));
  }, [ticketId]);

  const mut = useMutation({
    mutationFn: () => {
      const opts =
        disposition === 'SKIP'
          ? { disposition }
          : { disposition, editedAnswer: answer.trim() || undefined, resolutionNotes: notes.trim() || undefined };
      return action === 'resolve' ? resolveTicket(ticketId, opts) : closeTicket(ticketId, opts);
    },
    onSuccess: () => onDone(),
  });

  // The backend rejects a non-SKIP capture (409) when the conversation has no operator reply yet.
  const conflictCode =
    isAxiosError(mut.error) && mut.error.response?.status === 409
      ? (mut.error.response.data as { code?: string } | undefined)?.code
      : undefined;
  const needsReply = conflictCode === 'NO_OPERATOR_REPLY';

  const verb = action === 'resolve' ? 'Resolve' : 'Close';
  const submitLabel =
    disposition === 'SKIP' ? `${verb} without saving`
    : disposition === 'IMPORT_LIVE' ? `${verb} & publish`
    : `${verb} & save draft`;
  const captureNeedsAnswer = disposition !== 'SKIP';
  const canSubmit = !mut.isPending && (!captureNeedsAnswer || answer.trim().length > 0);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        data-testid="save-kb-modal"
        style={{
          width: '100%', maxWidth: 540, background: 'var(--background)', borderRadius: 14,
          border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div style={{ padding: '20px 24px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 11 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--accent-fill)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcBook size={18} style={{ color: 'var(--accent-text)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>{verb} {ticketNum}</h3>
            <p style={{ margin: '1px 0 0', fontSize: 12.5, color: 'var(--text-muted)' }}>
              Choose how this resolution is saved to the bot's knowledge base.
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
          >
            <IcX size={16} />
          </button>
        </div>

        {/* body */}
        <div style={{ padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {OPTIONS.map((o) => {
              const selected = disposition === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  data-testid={`disposition-${o.value}`}
                  onClick={() => setDisposition(o.value)}
                  style={{
                    textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 10, cursor: 'pointer',
                    border: selected ? '1.5px solid var(--accent)' : '1px solid var(--border)',
                    background: selected ? 'var(--background-hover)' : 'var(--background)',
                  }}
                >
                  <span style={{ width: 16, height: 16, borderRadius: 999, flexShrink: 0, border: selected ? '5px solid var(--accent)' : '2px solid var(--border)' }} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>{o.label}</span>
                    <span style={{ display: 'block', fontSize: 12, color: 'var(--text-muted)' }}>{o.help}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {captureNeedsAnswer && (
            <>
              {question && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  <span style={{ fontWeight: 600 }}>Dealer asked:</span> {question}
                </div>
              )}
              <div>
                <label style={labelStyle}>Answer to save</label>
                <textarea
                  rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)}
                  placeholder={fetched ? 'The answer the bot should learn…' : 'Loading your reply…'}
                  style={{ width: '100%', resize: 'vertical', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '8px 10px', fontSize: 13, color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={labelStyle}>Notes (optional)</label>
                <input
                  type="text" value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Internal note about this resolution"
                  style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)', padding: '6px 10px', fontSize: 13, color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </>
          )}

          {needsReply && (
            <div style={{ fontSize: 12.5, color: 'var(--amber-500, #f59e0b)' }}>
              Send a reply to the dealer before saving to the knowledge base — there's nothing to capture yet.
              You can still {verb.toLowerCase()} without saving.
            </div>
          )}
          {mut.isError && !needsReply && (
            <div style={{ fontSize: 12, color: 'var(--red-500, #ef4444)' }}>
              {(mut.error as Error).message || `Failed to ${verb.toLowerCase()}`}
            </div>
          )}
        </div>

        {/* footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 9 }}>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            variant="primary" data-testid="kb-confirm" disabled={!canSubmit}
            onClick={() => mut.mutate()} icon={<IcCheck size={14} />}
          >
            {mut.isPending ? 'Saving…' : submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

NOTE: confirm `Button` forwards `data-testid` (it spreads extra props in `src/components/ui`). If it does not, add `data-testid` to a wrapping element instead — check `apps/web/src/components/ui/Button.tsx` before relying on it.

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: errors about `NeedsHumanMode.tsx` still passing the OLD props (`onImported`, no `action`). That's expected — Task 4 fixes the call site. To verify this file in isolation, also eyeball that the modal file itself has no internal type errors in the `tsc` output (the only errors should reference `NeedsHumanMode.tsx`). Proceed to Task 4 to make the whole `tsc` green.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/inbox/SaveToKnowledgeModal.tsx
git commit -m "feat(web): SaveToKnowledgeModal is a chatbot-disposition chooser (IMPORT_LIVE/SAVE_DRAFT/SKIP)"
```

---

## Task 4: Frontend — wire NeedsHumanMode modal-first + minimal RAG label

Resolve/Close now open the modal instead of mutating directly; the modal performs the action and reports back via `onDone`. Add a small "RAG" label to the assist area.

**Files:**
- Modify: `apps/web/src/pages/inbox/NeedsHumanMode.tsx` (imports ~4-36; `TicketDetailProps` ~294-297; mutations ~342-388; action buttons ~493-513; assist toolbar ~636-680; `NeedsHumanMode` state + modal ~719-790)

**Interfaces:**
- Consumes: `SaveToKnowledgeModal` + `TicketCloseAction` (Task 3); `useQueryClient` (already imported).
- Produces: `onSaveKbNeeded(ticketId: string, ticketNum: string, action: TicketCloseAction)`.

- [ ] **Step 1: Update imports**

In the `../../api/tickets` import block (lines 4-15), **remove** `resolveTicket` and `closeTicket` (now used only by the modal) but keep `reopenTicket`, `assignTicket`, etc. Then update the modal import (line 36):

```tsx
import { SaveToKnowledgeModal, type TicketCloseAction } from './SaveToKnowledgeModal';
```

- [ ] **Step 2: Change the detail prop type** (lines 294-297)

```tsx
interface TicketDetailProps {
  ticketId: string;
  onSaveKbNeeded: (ticketId: string, ticketNum: string, action: TicketCloseAction) => void;
}
```

- [ ] **Step 3: Drop the resolve/close mutations** (lines 346-359)

Delete the `resolveMut` and `closeMut` `useMutation` blocks entirely (keep `assignMut`, `reopenMut`, `sendMut`, `suggestMut`). The buttons will call `onSaveKbNeeded` directly.

- [ ] **Step 4: Repoint the action buttons** (the Resolve and Close `<Button>`s, lines 493-513)

```tsx
          {!isResolved && !isClosed && (
            <Button
              variant="secondary"
              size="sm"
              data-testid="resolve-ticket"
              icon={<IcCheck size={14} />}
              onClick={() => onSaveKbNeeded(ticketId, ticket.num, 'resolve')}
            >
              Resolve
            </Button>
          )}
          {!isClosed && (
            <Button
              variant="secondary"
              size="sm"
              data-testid="close-ticket"
              onClick={() => onSaveKbNeeded(ticketId, ticket.num, 'close')}
            >
              Close
            </Button>
          )}
```

- [ ] **Step 5: Add the minimal RAG label in the assist area**

In the agent-context card, change the "Suggested knowledge" header (line 638) to flag the source:

```tsx
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>
                    Suggested knowledge <span style={{ color: '#7C5CFC', fontWeight: 700 }}>· RAG</span>
                  </span>
```

And change the draft-confidence span (line 678) so the source is explicit:

```tsx
            {suggestMut.data?.text && (
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>RAG draft · {Math.round(suggestMut.data.confidence * 100)}% conf</span>
            )}
```

- [ ] **Step 6: Update the `NeedsHumanMode` container** (state + modal, lines 719-790)

Change the state type to carry the action and add a query client:

```tsx
export function NeedsHumanMode() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'active' | 'closed'>('active');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saveKbState, setSaveKbState] = useState<{ ticketId: string; ticketNum: string; action: TicketCloseAction } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
```

Update the `TicketDetail` usage (lines 766-769):

```tsx
        <TicketDetail
          ticketId={selectedId}
          onSaveKbNeeded={(tid, tnum, action) => setSaveKbState({ ticketId: tid, ticketNum: tnum, action })}
        />
```

Replace the modal block (lines 780-790):

```tsx
      {saveKbState && (
        <SaveToKnowledgeModal
          ticketId={saveKbState.ticketId}
          ticketNum={saveKbState.ticketNum}
          action={saveKbState.action}
          onClose={() => setSaveKbState(null)}
          onDone={() => {
            const wasResolve = saveKbState.action === 'resolve';
            qc.invalidateQueries({ queryKey: ['tickets'] });
            qc.invalidateQueries({ queryKey: ['inbox'] });
            setSaveKbState(null);
            setToastMsg(wasResolve ? 'Ticket resolved' : 'Ticket closed');
          }}
        />
      )}
```

(`useQueryClient` is already imported at line 3.)

- [ ] **Step 7: Typecheck the whole web app**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors. (If `resolveTicket`/`closeTicket` are reported unused anywhere else, confirm no other inbox file imported them; only this file did.)

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/pages/inbox/NeedsHumanMode.tsx
git commit -m "feat(web): inbox Resolve/Close open the disposition modal first; label suggestions RAG-backed"
```

---

## Task 5: Frontend — audit card shows RAG source for chatbot auto-replies

The auto-replied audit card already hides `matchedKbSlug` when null (chatbot events have no legacy KB slug). Replace that blank with an explicit "RAG knowledge base" source so operators see why there's no slug; legacy autopilot events keep their slug.

**Files:**
- Modify: `apps/web/src/components/inbox/MessageBubble.tsx:156-169`

**Interfaces:**
- Consumes: `auditEvent.matchedKbSlug` (existing `AutopilotEvent` field).

- [ ] **Step 1: Replace the matched-KB block** (lines 156-169)

```tsx
            {auditEvent.matchedKbSlug ? (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Matched </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#7C5CFC', fontSize: 11 }}>
                  {auditEvent.matchedKbSlug}
                </span>
              </div>
            ) : (
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Source </span>
                <span style={{ color: '#7C5CFC', fontSize: 11, fontWeight: 600 }}>RAG knowledge base</span>
              </div>
            )}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm --filter web exec tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/components/inbox/MessageBubble.tsx
git commit -m "feat(web): audit card shows 'RAG knowledge base' source for chatbot auto-replies"
```

---

## Task 6: e2e — assert the disposition modal (run in Phase 3)

Add a Playwright assertion that Resolve opens the disposition chooser. This compiles/collects now; the full run requires the Phase 3 stack (API + worker + web, `CHATBOT_ENABLED=true`, mock modes).

**Files:**
- Modify: `e2e/tests/inbox-agent-assist.spec.ts`

**Interfaces:**
- Consumes test ids from Tasks 3-4: `resolve-ticket`, `save-kb-modal`, `disposition-IMPORT_LIVE|SAVE_DRAFT|SKIP`, `kb-confirm`.

- [ ] **Step 1: Read the existing spec** to match its `loginAsAdmin`/navigation helpers and seeding conventions.

Run: `sed -n '1,60p' e2e/tests/inbox-agent-assist.spec.ts` (use the file's existing fixtures; do not invent new ones).

- [ ] **Step 2: Add the test** (inside the existing `test.describe('Inbox agent-assist', ...)` block, mirroring the file's setup)

```ts
  test('Resolve opens the disposition chooser with a RAG-backed save option', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/inbox');
    const needsHuman = page.getByRole('button', { name: /needs[ -]?human/i });
    if (await needsHuman.count()) await needsHuman.first().click();

    // Requires at least one active ticket in the seeded fixture (see Phase 3 seed).
    await page.getByTestId('resolve-ticket').first().click();

    const modal = page.getByTestId('save-kb-modal');
    await expect(modal).toBeVisible();
    await expect(page.getByTestId('disposition-IMPORT_LIVE')).toBeVisible();
    await expect(page.getByTestId('disposition-SAVE_DRAFT')).toBeVisible();
    await expect(page.getByTestId('disposition-SKIP')).toBeVisible();

    // SKIP requires no operator reply, so it always succeeds.
    await page.getByTestId('disposition-SKIP').click();
    await page.getByTestId('kb-confirm').click();
    await expect(modal).toBeHidden();
  });
```

- [ ] **Step 3: Verify the spec compiles/collects** (does not run the browser)

Run: `npx playwright test e2e/tests/inbox-agent-assist.spec.ts --list`
Expected: the new test title is listed with no TypeScript/collection errors. (Full execution is part of Phase 3.)

- [ ] **Step 4: Commit**

```bash
git add e2e/tests/inbox-agent-assist.spec.ts
git commit -m "test(e2e): assert inbox Resolve opens the chatbot disposition chooser"
```

---

## Self-Review

**Spec coverage (§5 Phase 2):**
- "SaveToKnowledgeModal: switch from createKnowledgeCandidate to choosing a chatbot disposition (IMPORT_LIVE/SAVE_DRAFT/SKIP) on resolve/close" → Tasks 1-4. The modal no longer calls `createKnowledgeCandidate`; resolve/close drive `ConversationService.close()` → resolution-capture. (Legacy `createKnowledgeCandidate` endpoint + `CreateKnowledgeCandidateDto`/`createKnowledgeCandidate` client fn are left in place, now vestigial per spec §7.)
- "Surface that suggestions are RAG-backed (optionally show citations)" → Task 4 (minimal label; citations already render via `agentCtx.suggestedKnowledge`).
- "Auto-replied audit card: KB-slug blank for chatbot events — hide it or show RAG citations instead; re-verify confidence/intent/model render" → Task 5 (slug already conditionally hidden; now shows RAG source). Confidence/intent/model already render unconditionally from the bridged `AutopilotEvent` — verified in Phase 3 live click-through.

**Decisions honored:** modal-first + ticket `disposition` param (not a direct conversation-close call); minimal labeling (no backend citation joins, no `suggestReply` change).

**Type consistency:** `CloseDisposition`/`CLOSE_DISPOSITIONS` reused from `conversations.dto.ts` in api; mirrored as a web `CloseDisposition` type in `tickets.ts`. `ResolveOptions` (api) ↔ `ResolveTicketOptions` (web) carry the same `{ disposition?, resolutionNotes?, editedAnswer? }`. `TicketCloseAction` defined once in the modal and imported by `NeedsHumanMode`.

**Out of scope (Phase 3):** full Playwright run + seed; live click-through checklist; verifying the capture worker publishes/drafts the KB doc end-to-end.

**Risk / watch-items for the implementer:**
- Confirm `Button` (`src/components/ui`) forwards `data-testid`; if not, attach the test id to a wrapper (Task 3 Step 1 note).
- The `NO_OPERATOR_REPLY` 409 body shape is `{ code, message }` (NestJS sends the object passed to `ConflictException` verbatim). The modal reads `error.response.data.code`.
- Reordering to close-first changes when the linked conversation is closed relative to the ticket-status write; the SKIP path stays best-effort, so existing SKIP tests/behaviour are preserved (Task 1 Step 1 third test guards this).
