# Finish AI Templates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make the AI template flow "finished": multiple draft options per language, per-language variable mapping, and a real on-demand "Sync with Meta".

**Architecture:** Backend — `MockLlmService` returns 2 drafts/language; `variables` moves from the global `CreateTemplateDto` onto each `TemplateLanguageVariantDto`; a new `TemplatesService.syncPending(staleOnly)` (the poller's reconcile loop, now shared) backs `POST /templates/sync`. Frontend — the wizard sends per-variant variables (drop the union), `TemplateForm` gets a per-language variables input, and the toast-only Sync button calls the real endpoint. LLM stays mock.

**Tech Stack:** NestJS 10, Prisma 5, Jest (mocked deps), Vite + React + TS, @tanstack/react-query v5, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-07-finish-ai-templates-design.md`

---

## Conventions (read once)

- Backend unit tests construct services directly with mocked deps: `new TemplatesService(prisma, whatsapp, llm)` (3 args; pass `{} as any` for unused). See `apps/api/src/templates/__tests__/templates.service.spec.ts`.
- `WHATSAPP_MOCK_MODE` (dev default) → `getTemplateStatus` always returns `PENDING`, so `syncPending` reports `updated: 0` against mock ids — expected.
- Run: `pnpm --filter api test -- templates` (or `mock-llm`); `pnpm --filter api build`; `pnpm --filter web build`.
- All `/templates` routes are JWT-guarded under `/api`.
- **GIT GUARD (every implementer):** you are on branch `feat/finish-ai-templates` — do NOT run `git checkout`/`switch`/`branch`; only `git add` + `git commit`.

---

## Task 1: Multi-draft mock (2 drafts per language)

**Files:**
- Modify: `apps/api/src/llm/mock-llm.service.ts`
- Test: `apps/api/src/llm/__tests__/mock-llm.service.spec.ts`

- [ ] **Step 1: Update the failing test** — replace the existing `generates exactly one draft per requested language` test in `mock-llm.service.spec.ts` with:
```ts
  it('generates two distinct drafts per requested language', async () => {
    const drafts = await svc.generateTemplateDrafts({
      brief: 'subscription renewal reminder',
      languages: ['EN', 'MS'],
      tone: 'friendly',
    });
    expect(drafts).toHaveLength(4);
    expect(drafts.filter((d) => d.language === 'EN')).toHaveLength(2);
    expect(drafts.filter((d) => d.language === 'MS')).toHaveLength(2);
    // the two per-language drafts differ (name + variable count)
    const en = drafts.filter((d) => d.language === 'EN');
    expect(en[0].name).not.toBe(en[1].name);
    expect(en[0].variables.length).not.toBe(en[1].variables.length);
  });
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- mock-llm`
Expected: FAIL (length 2, not 4).

- [ ] **Step 3: Implement** — replace `generateTemplateDrafts` in `mock-llm.service.ts`:
```ts
  async generateTemplateDrafts(input: GenerateTemplateDraftsInput): Promise<TemplateDraft[]> {
    const slug = input.brief.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'template';
    return input.languages.flatMap((lang) => [
      {
        language: lang,
        name: `${slug}_a`,
        category: 'UTILITY' as const,
        body: `[${lang}] ${input.brief} — reply to {{1}} to continue.`,
        variables: ['name'],
        approvalLikelihood: 'HIGH' as const,
        rationale: 'Transactional wording, no promotional language — fits the Utility category.',
      },
      {
        language: lang,
        name: `${slug}_b`,
        category: 'MARKETING' as const,
        body: `[${lang}] Hi {{1}}! ${input.brief} Tap below to learn more about {{2}}.`,
        variables: ['name', 'topic'],
        approvalLikelihood: 'MEDIUM' as const,
        rationale: 'Warmer, promotional framing — Marketing category; slightly lower auto-approval odds.',
      },
    ]);
  }
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- mock-llm`
Expected: PASS.

- [ ] **Step 5: Commit**
```bash
git add apps/api/src/llm
git commit -m "feat(api): mock LLM returns two distinct template drafts per language"
```

---

## Task 2: `syncPending` service + poller refactor + `POST /templates/sync`

**Files:**
- Modify: `apps/api/src/templates/templates.service.ts`, `apps/api/src/templates/templates.poller.ts`, `apps/api/src/templates/templates.controller.ts`
- Test: `apps/api/src/templates/__tests__/templates.service.spec.ts`

- [ ] **Step 1: Write the failing test** — append to `templates.service.spec.ts`:
```ts
describe('TemplatesService.syncPending', () => {
  let prisma: any; let whatsapp: any; let service: TemplatesService;
  beforeEach(() => {
    prisma = { template: { findMany: jest.fn(), update: jest.fn().mockResolvedValue({}) } };
    whatsapp = { getTemplateStatus: jest.fn() };
    service = new TemplatesService(prisma, whatsapp, {} as any);
  });

  it('staleOnly adds a submittedAt cutoff; false does not', async () => {
    prisma.template.findMany.mockResolvedValue([]);
    await service.syncPending(true);
    expect(prisma.template.findMany.mock.calls[0][0].where).toEqual(expect.objectContaining({
      status: 'PENDING', metaTemplateId: { not: null }, submittedAt: expect.objectContaining({ lt: expect.any(Date) }),
    }));
    await service.syncPending(false);
    expect(prisma.template.findMany.mock.calls[1][0].where).toEqual({ status: 'PENDING', metaTemplateId: { not: null } });
  });

  it('updates APPROVED/REJECTED, skips PENDING, returns counts', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', metaTemplateId: 'm1', approvedAt: null },
      { id: 't2', metaTemplateId: 'm2', approvedAt: null },
      { id: 't3', metaTemplateId: 'm3', approvedAt: null },
    ]);
    whatsapp.getTemplateStatus
      .mockResolvedValueOnce({ status: 'APPROVED' })
      .mockResolvedValueOnce({ status: 'PENDING' })
      .mockResolvedValueOnce({ status: 'REJECTED' });
    const res = await service.syncPending(false);
    expect(res).toEqual({ checked: 3, updated: 2 });
    expect(prisma.template.update).toHaveBeenCalledTimes(2);
  });

  it('a failing getTemplateStatus does not abort the rest', async () => {
    prisma.template.findMany.mockResolvedValue([
      { id: 't1', metaTemplateId: 'm1', approvedAt: null },
      { id: 't2', metaTemplateId: 'm2', approvedAt: null },
    ]);
    whatsapp.getTemplateStatus
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValueOnce({ status: 'APPROVED' });
    const res = await service.syncPending(false);
    expect(res).toEqual({ checked: 2, updated: 1 });
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- templates.service`
Expected: FAIL — `service.syncPending is not a function`.

- [ ] **Step 3: Implement `syncPending`** in `TemplatesService` (after `applyMetaTemplateUpdate`):
```ts
  /** Reconcile PENDING templates against Meta. staleOnly=true → only rows pending >1h (cron); false → all (manual sync). */
  async syncPending(staleOnly: boolean): Promise<{ checked: number; updated: number }> {
    const where: Prisma.TemplateWhereInput = { status: 'PENDING', metaTemplateId: { not: null } };
    if (staleOnly) where.submittedAt = { lt: new Date(Date.now() - 60 * 60 * 1000) };
    const pending = await this.prisma.template.findMany({ where });
    const map: Record<string, TemplateStatus> = { APPROVED: 'APPROVED', REJECTED: 'REJECTED', DISABLED: 'DISABLED' };
    let updated = 0;
    for (const row of pending) {
      try {
        const remote = await this.whatsapp.getTemplateStatus(row.metaTemplateId!);
        const newStatus = map[remote.status];
        if (!newStatus) continue;
        await this.prisma.template.update({
          where: { id: row.id },
          data: { status: newStatus, approvedAt: newStatus === 'APPROVED' ? new Date() : row.approvedAt },
        });
        updated++;
      } catch (err) {
        this.logger.warn(`Sync failed for ${row.id} (${row.metaTemplateId}): ${err instanceof Error ? err.message : 'unknown'}`);
      }
    }
    return { checked: pending.length, updated };
  }
```

- [ ] **Step 4: Run, verify pass**

Run: `pnpm --filter api test -- templates.service`
Expected: PASS (existing + 3 new).

- [ ] **Step 5: Refactor the poller to reuse it** — replace the body of `apps/api/src/templates/templates.poller.ts`:
```ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TemplatesService } from './templates.service';

@Injectable()
export class TemplatesPoller {
  private readonly logger = new Logger(TemplatesPoller.name);

  constructor(private readonly templates: TemplatesService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async pollPending(): Promise<void> {
    const { checked, updated } = await this.templates.syncPending(true);
    if (checked > 0) this.logger.log(`Polled ${checked} stale PENDING template(s); ${updated} updated`);
  }
}
```
> `TemplatesModule` already provides both `TemplatesService` and `TemplatesPoller`, so no module change is needed (the dependency is one-way poller→service). Confirm by reading `templates.module.ts`; if the poller was the only consumer of `WhatsappModule` there, leave the import — `TemplatesService` still needs it.

- [ ] **Step 6: Add the controller route** — in `templates.controller.ts`, after the `generate` route:
```ts
  @Post('sync')
  sync() {
    return this.templates.syncPending(false);
  }
```

- [ ] **Step 7: Build + commit**

Run: `pnpm --filter api build` (expect success), then:
```bash
git add apps/api/src/templates
git commit -m "feat(api): POST /templates/sync + shared syncPending (poller reuses it)"
```

---

## Task 3: Per-language variables (backend)

**Files:**
- Modify: `apps/api/src/templates/dto/template-component.dto.ts`, `apps/api/src/templates/dto/create-template.dto.ts`, `apps/api/src/templates/templates.service.ts`
- Test: `apps/api/src/templates/__tests__/templates.service.spec.ts`

- [ ] **Step 1: Write the failing test** — append to `templates.service.spec.ts`:
```ts
describe('TemplatesService.createDraft (per-language variables)', () => {
  let prisma: any; let service: TemplatesService;
  beforeEach(() => {
    prisma = {
      template: { findMany: jest.fn().mockResolvedValue([]), create: jest.fn((a: any) => Promise.resolve({ id: 'x', ...a.data })) },
      $transaction: jest.fn((ops: any[]) => Promise.all(ops)),
    };
    service = new TemplatesService(prisma, {} as any, {} as any);
  });

  it('writes each variant its OWN variables array', async () => {
    await service.createDraft({
      name: 'promo', category: 'MARKETING',
      variants: [
        { language: 'EN', bodyText: 'Hi {{1}}', variables: ['name'] },
        { language: 'MS', bodyText: 'Hai {{1}} {{2}}', variables: ['name', 'topic'] },
      ],
    } as any, 'u1');
    const created = prisma.template.create.mock.calls.map((c: any) => c[0].data);
    const en = created.find((d: any) => d.language === 'EN');
    const ms = created.find((d: any) => d.language === 'MS');
    expect(en.variables).toEqual(['name']);
    expect(ms.variables).toEqual(['name', 'topic']);
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `pnpm --filter api test -- templates.service`
Expected: FAIL (createDraft still writes `dto.variables`, which is now undefined per-variant, or the test's `variant.variables` isn't used yet).

- [ ] **Step 3: Move `variables` onto the variant DTO** — in `template-component.dto.ts`, add to `TemplateLanguageVariantDto` (after `buttons`):
```ts
  @IsArray()
  @IsString({ each: true })
  variables!: string[];
```
(`IsArray`/`IsString` are already imported in that file.)

- [ ] **Step 4: Remove the global `variables` from `create-template.dto.ts`** — delete:
```ts
  @IsArray()
  @IsString({ each: true })
  variables!: string[]; // friendly names for {{1}}, {{2}}, etc.
```
(and remove now-unused `IsArray`/`IsString` from its imports only if the compiler flags them — `IsArray` may still be used by the `variants` decorator, so keep what's needed.)

- [ ] **Step 5: Use per-variant variables in `createDraft`** — in `templates.service.ts`, change the `create` data's `variables` line from `variables: dto.variables,` to:
```ts
            variables: variant.variables,
```

- [ ] **Step 6: Run, verify pass + full suite**

Run: `pnpm --filter api test -- templates.service` (PASS), then `pnpm --filter api test` (full suite green), then `pnpm --filter api build`.

- [ ] **Step 7: Commit**
```bash
git add apps/api/src/templates
git commit -m "feat(api): per-language template variables (variables move onto each variant)"
```

---

## Task 4: Per-language variables (web — atomic: type + wizard + form)

> These three edits MUST land together — the `api/templates.ts` type change breaks the wizard + form compile until both are updated. Build only at the end.

**Files:**
- Modify: `apps/web/src/api/templates.ts`, `apps/web/src/components/TemplatesAIWizard.tsx`, `apps/web/src/pages/TemplateForm.tsx`

- [ ] **Step 1: `api/templates.ts`** — add `variables` to `TemplateVariant` and remove it from `CreateTemplateInput`:
```ts
export interface TemplateVariant {
  language: LanguagePreference;
  bodyText: string;
  header?: TemplateHeader;
  footerText?: string;
  buttons?: TemplateButton[];
  variables: string[];
}

export interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  variants: TemplateVariant[];
}
```

- [ ] **Step 2: `TemplatesAIWizard.tsx`** — in `submitMut.mutationFn`, replace the payload build (the `allVars` + `input` block) so each variant carries its draft's own variables and there is no top-level `variables`:
```ts
      // Build variants from picked drafts — each carries its own per-language variables
      const pickedLangs = langs.filter((l) => picked[l]);
      const firstDraft = picked[pickedLangs[0]];
      const category = mapCategory(firstDraft?.category ?? 'UTILITY');

      const input = {
        name: nameSlug,
        category,
        variants: pickedLangs.map((l) => ({
          language: l as LanguagePreference,
          bodyText: editedBodies[l] ?? picked[l]?.body ?? '',
          variables: picked[l]?.variables ?? [],
        })),
      };
```
Also make the auto-pick choose the FIRST draft per language (now that there are 2) — in `generateMut.onSuccess`, change the loop:
```ts
      const autoPick: Record<string, DraftSuggestion> = {};
      for (const d of data) {
        if (!autoPick[d.language]) autoPick[d.language] = d;
      }
```

- [ ] **Step 3: `TemplateForm.tsx`** — move the variables input into the per-language `VariantEditor` and drop the global one:
  1. Delete the `const [variables, setVariables] = useState<string[]>([]);` line.
  2. `emptyVariant`: add `variables: []`:
     ```ts
     function emptyVariant(language: LanguagePreference): TemplateVariant {
       return { language, bodyText: '', footerText: '', buttons: [], variables: [] };
     }
     ```
  3. `rowToVariant`: add `variables: row.variables`:
     ```ts
     function rowToVariant(row: Template): TemplateVariant {
       return {
         language: row.language,
         bodyText: row.bodyText,
         header: row.headerJson ?? undefined,
         footerText: row.footerText ?? undefined,
         buttons: row.buttonsJson ?? [],
         variables: row.variables,
       };
     }
     ```
  4. In the `useEffect` that loads `group`, delete the `setVariables(group[0].variables);` line.
  5. Delete the global "Variable names" `<Field>` block (the one with `data-testid="template-variables"` bound to `variables`/`setVariables`).
  6. `onSubmit`: drop `variables`:
     ```ts
     const input: CreateTemplateInput = { name, category, variants };
     ```
  7. In `VariantEditor`, add a per-variant variables Field (after the Footer field), bound to `variant.variables`:
     ```tsx
       <Field label="Variable names for this language (one per {{n}}, comma-separated)">
         <input
           type="text"
           value={variant.variables.join(', ')}
           onChange={(e) => onChange({ variables: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
           disabled={disabled}
           placeholder="customer_name, order_id"
           className="w-full rounded-md border border-border-strong bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
           data-testid="variant-variables"
         />
       </Field>
     ```

- [ ] **Step 4: Typecheck** — `pnpm --filter web build` → success (the type change + both consumers updated together).

- [ ] **Step 5: Commit**
```bash
git add apps/web/src/api/templates.ts apps/web/src/components/TemplatesAIWizard.tsx apps/web/src/pages/TemplateForm.tsx
git commit -m "feat(web): per-language template variables (wizard payload + per-tab form input)"
```

---

## Task 5: Wire the real "Sync with Meta" button

**Files:**
- Modify: `apps/web/src/api/templates.ts`, `apps/web/src/pages/Templates.tsx`

- [ ] **Step 1: Add the client fn** — append to `apps/web/src/api/templates.ts`:
```ts
export async function syncTemplates(): Promise<{ checked: number; updated: number }> {
  const { data } = await api.post<{ checked: number; updated: number }>('/templates/sync');
  return data;
}
```

- [ ] **Step 2: Wire the button in `Templates.tsx`** — read the file to confirm it has `useMutation`, `useQueryClient` (`qc`), and `showToast` in scope (it uses react-query + a local toast). Import `syncTemplates` (add to the existing `../api/templates` import). Add a mutation near the other mutations:
```ts
  const syncMut = useMutation({
    mutationFn: syncTemplates,
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      showToast(r.checked === 0
        ? 'No pending templates to sync'
        : `Synced with Meta — checked ${r.checked}, ${r.updated} updated`);
    },
    onError: () => showToast('Sync with Meta failed', 'error'),
  });
```
Replace the Sync button's handler (currently `onClick={() => showToast('Syncing template statuses with Meta…')}`) with:
```tsx
            onClick={() => syncMut.mutate()}
            disabled={syncMut.isPending}
```
(and change the button label to show `{syncMut.isPending ? 'Syncing…' : 'Sync with Meta'}` if it currently hardcodes "Sync with Meta").
> If `Templates.tsx` doesn't already expose `qc`/`useMutation`, add `const qc = useQueryClient();` and the `useMutation`/`useQueryClient` imports. `showToast` already exists (used by the current button).

- [ ] **Step 3: Typecheck** — `pnpm --filter web build` → success.

- [ ] **Step 4: Commit**
```bash
git add apps/web/src/api/templates.ts apps/web/src/pages/Templates.tsx
git commit -m "feat(web): wire 'Sync with Meta' button to POST /templates/sync"
```

---

## Task 6: E2E spec (run deferred)

**Files:**
- Create: `e2e/tests/templates-sync.spec.ts`

> Run is DEFERRED (no Postgres/servers/browsers). Mirror `e2e/tests/blasts.spec.ts` (local `loginAsAdmin`). Do NOT run `pnpm --filter e2e test`.

- [ ] **Step 1: Inspect** `e2e/tests/blasts.spec.ts` (login helper) and `apps/web/src/pages/Templates.tsx` to confirm how the Templates page is reached (nav link "Templates", route `/templates`) and the exact Sync button text.

- [ ] **Step 2: Create `e2e/tests/templates-sync.spec.ts`**
```ts
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

test.describe('Templates — Sync with Meta', () => {
  test('the Sync button triggers a request and shows a result toast', async ({ page }) => {
    await loginAsAdmin(page);
    await page.getByRole('link', { name: 'Templates' }).click();
    await expect(page).toHaveURL(/\/templates$/);

    await page.getByRole('button', { name: /sync with meta/i }).click();
    // Either "No pending templates to sync" or "Synced with Meta — checked N…"
    await expect(page.getByText(/sync(ed|ing)|no pending templates/i)).toBeVisible();
  });
});
```
> Adapt the nav/route/button selectors to the real `Templates.tsx` if they differ; keep the assertion that a sync result toast (not the old static text) appears.

- [ ] **Step 3: Commit**
```bash
git add e2e/tests/templates-sync.spec.ts
git commit -m "test(e2e): Templates Sync-with-Meta button (run deferred)"
```

---

## Final verification

- [ ] `pnpm --filter api test` — green (mock-llm + templates.service syncPending + createDraft).
- [ ] `pnpm --filter api build` + `pnpm --filter web build` — compile.
- [ ] Live (deferred — needs Postgres + servers): generate a template → step-2 shows 2 drafts/language with different variable counts; submit → per-language variables stored; click "Sync with Meta" → result toast; `pnpm --filter e2e test -- templates-sync`.

---

## Self-review notes (author)

- **Spec coverage:** §3.1 multi-draft → Task 1; §3.3 sync → Tasks 2 + 5; §3.2 per-language variables → Tasks 3 (backend) + 4 (web). E2E → Task 6. Deferred (real LLM, edit-existing, View-Meta-details) untouched.
- **Type consistency:** backend `TemplateLanguageVariantDto.variables` (Task 3) ↔ web `TemplateVariant.variables` (Task 4); `CreateTemplateDto`/`CreateTemplateInput` both drop the top-level `variables`; `createDraft` writes `variant.variables`; `submitGroup` already reads per-row `variables` (unchanged). `syncPending` return `{checked,updated}` (Task 2) ↔ `syncTemplates` (Task 5) ↔ controller route.
- **Atomicity:** Task 4 bundles the web type change with both consumers so the build is green at the boundary (a standalone type change would break the wizard/form compile).
- **No placeholders:** complete code per step; the only deferral (live DB/e2e + mock-mode `updated:0`) is explicit/environmental.
- **Poller→service:** one-way; both already in `TemplatesModule` (Task 2 Step 5 notes the confirm).
