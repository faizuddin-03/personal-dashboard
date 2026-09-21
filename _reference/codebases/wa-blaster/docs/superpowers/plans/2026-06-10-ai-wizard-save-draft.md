# AI Wizard "Save as draft" Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the AI template wizard so user work is never silently discarded — add an explicit "Save as draft" action at the review step and a discard-confirmation when closing with unsaved content.

**Architecture:** Pure frontend fix in `TemplatesAIWizard.tsx`. The backend already supports everything needed: `POST /templates` (`createDraft`) creates a template group with status `DRAFT`, and the Templates page already lists DRAFT families and offers "Submit for review" on them. The wizard currently has exactly one persistence path — "Submit for review" (`createTemplate` + `submitTemplate`) — while its "Save edits" button only mutates local React state and `handleClose` wipes everything. We extract the create-input builder shared by submit and save-draft, add a `saveDraftMut` that calls `createTemplate` only, and guard dialog dismissal at step 3 with `window.confirm` (the established pattern in this codebase — see `Templates.tsx:468`, `Segments.tsx:75`).

**Tech Stack:** React 18 + TanStack Query v5 (web), Playwright e2e (`e2e/` workspace). The web app has **no unit-test infrastructure** — Playwright e2e is the test layer, so TDD here means writing the failing e2e spec first.

---

## Root cause (for context)

User flow: AI generates drafts → user picks one → "Edit content" → edits → "Save edits" → closes dialog → **template is gone**.

- `apps/web/src/components/TemplatesAIWizard.tsx:639` — the "Save edits" button is `onClick={() => setEditOpen(false)}`. It only closes the inline edit panel; edits live in the `editedBodies` React state. **No API call.** The label misleads the user into thinking the template was persisted.
- `TemplatesAIWizard.tsx:166` (`handleClose`) — closing via X, backdrop, or Cancel resets all state. Work silently discarded.
- The only API write is `submitMut` (line 204): `createTemplate` + `submitTemplate` in one shot. There is no draft-only path.
- Backend (`apps/api/src/templates/templates.service.ts:113` `createDraft`) and the list page (`apps/web/src/pages/Templates.tsx:275`, `canSubmit` includes `DRAFT`) fully support drafts already. Nothing server-side changes.

## Fix design

1. **"Save as draft" button** at Step 3, between "Edit content" and "Submit for review". Calls `createTemplate` only → invalidates `['templates']` → success toast → close. Reuses the submit path's name validation and input building.
2. **Rename "Save edits" → "Apply edits"** in the edit panel so the label no longer implies server persistence.
3. **Discard guard:** closing the wizard (X / backdrop / Cancel) at Step 3 asks `window.confirm` before discarding. Programmatic close after a successful save/submit bypasses the guard.
4. `data-testid` attributes on wizard controls so e2e can drive it.

Out of scope (existing behavior, unchanged): friendly 409 duplicate-name messages (submit has the same gap today), saving drafts from Step 2, draft autosave.

---

### Task 1: Failing e2e spec for the wizard draft flow

**Files:**
- Create: `e2e/tests/templates-wizard.spec.ts`

The spec mocks `POST /templates/generate` with `page.route` so tests don't depend on a live LLM; `createTemplate`/`listTemplates` hit the real API (same as the existing `templates.spec.ts` smoke test).

- [ ] **Step 1: Write the failing test**

```ts
import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

/** Mock the LLM endpoint and drive the wizard to Step 3 (review). */
async function openWizardToReview(page: Page) {
  await page.route('**/templates/generate', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          language: 'EN',
          name: 'service_reminder',
          category: 'UTILITY',
          body: 'Hi {{1}}, your service is due on {{2}}.',
          variables: ['name', 'date'],
          approvalLikelihood: 'HIGH',
          rationale: 'Transactional reminder with clear variables.',
        },
      ]),
    }),
  );

  await page.getByRole('link', { name: 'Templates' }).click();
  await page.getByTestId('add-template').click();
  await page.getByTestId('wizard-brief').fill('Service reminder for customers');
  await page.getByRole('button', { name: 'Generate suggestions' }).click();
  // Step 2: first draft is auto-picked
  await page.getByRole('button', { name: 'Continue' }).click();
  // Step 3: name input visible
  await expect(page.getByTestId('wizard-name')).toBeVisible();
}

test.describe('AI wizard draft persistence', () => {
  test('edit content, save as draft, draft appears in list with edits', async ({ page }) => {
    await loginAsAdmin(page);
    const templateName = `e2e_wizard_${Date.now().toString().slice(-8)}`;
    await openWizardToReview(page);

    await page.getByTestId('wizard-name').fill(templateName);

    // Edit the body, apply locally
    await page.getByTestId('wizard-edit-content').click();
    await page
      .getByTestId('wizard-edit-body-EN')
      .fill('Hi {{1}}, your car service is due on {{2}}. Book via eAuto.');
    await page.getByTestId('wizard-apply-edits').click();

    // Persist as draft (no Meta submission)
    await page.getByTestId('wizard-save-draft').click();

    // Wizard closes, draft family visible in the list
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
    await expect(page.getByTestId(`template-group-${templateName}`)).toBeVisible();

    // Open detail: status DRAFT, edited body persisted
    await page.getByTestId(`template-group-${templateName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();
    await expect(page.getByText('Book via eAuto', { exact: false })).toBeVisible();
  });

  test('closing the wizard at review step warns before discarding', async ({ page }) => {
    await loginAsAdmin(page);
    await openWizardToReview(page);

    // Dismissing the confirm keeps the wizard open
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeVisible();

    // Accepting the confirm closes it
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
  });
});
```

- [ ] **Step 2: Run the spec to verify it fails for the right reason**

Prereq: API and web dev servers running (in separate terminals: `npm run dev` in `apps/api` and in `apps/web`; web must be on `http://localhost:5173` per `e2e/playwright.config.ts`).

Run (from `e2e/`): `npx playwright test tests/templates-wizard.spec.ts`

Expected: **FAIL** — timeout locating `wizard-brief` / `wizard-save-draft` test ids (they don't exist yet). If it fails on login or navigation instead, fix the environment before proceeding.

- [ ] **Step 3: Commit the failing spec**

```bash
git add e2e/tests/templates-wizard.spec.ts
git commit -m "test(e2e): failing spec for AI wizard save-as-draft flow"
```

---

### Task 2: Wizard implementation — save-draft mutation, buttons, close guard

**Files:**
- Modify: `apps/web/src/components/TemplatesAIWizard.tsx` (all changes in this one file)

- [ ] **Step 1: Add shared name-validation and input-builder helpers**

Add a module-level constant after the `AVAILABLE_LANGS` declaration (~line 37):

```tsx
const NAME_RULE_ERROR =
  'Name must start with a letter and contain only lowercase letters, numbers, and underscores.';
```

Inside the component, after the Step 3 state declarations (~line 163), add:

```tsx
  // ─ Shared by Save-as-draft and Submit ─
  const resolveNameSlug = () => templateName.trim() || slugify(brief);

  const buildCreateInput = (nameSlug: string) => {
    const pickedLangs = langs.filter((l) => picked[l]);
    const firstDraft = picked[pickedLangs[0]];
    return {
      name: nameSlug,
      category: category ?? mapCategory(firstDraft?.category ?? 'UTILITY'),
      variants: pickedLangs.map((l) => ({
        language: l as LanguagePreference,
        bodyText: editedBodies[l] ?? picked[l]?.body ?? '',
        variables: picked[l]?.variables ?? [],
      })),
    };
  };

  const validateName = () => {
    if (!/^[a-z][a-z0-9_]*$/.test(resolveNameSlug())) {
      setNameError(NAME_RULE_ERROR);
      return false;
    }
    setNameError('');
    setSubmitError('');
    return true;
  };
```

- [ ] **Step 2: Rename `handleClose` → `resetAndClose` and add the guarded `requestClose`**

Replace the existing `handleClose` `useCallback` (lines 166–182) with:

```tsx
  // ─ Reset all state and close (used after successful save/submit) ─
  const resetAndClose = useCallback(() => {
    setStep(1);
    setBrief(regenBrief);
    setLangs(regenerate?.language ? [regenerate.language] : ['EN']);
    setTone('friendly');
    setDrafts([]);
    setPicked({});
    setActiveLang('EN');
    setTemplateName('');
    setCategory(null);
    setNameError('');
    setEditOpen(false);
    setEditedBodies({});
    setSubmitError('');
    onClose();
  }, [onClose, regenBrief, regenerate?.language]);

  // ─ User-initiated close: at the review step, confirm before discarding ─
  const requestClose = useCallback(() => {
    const hasUnsavedWork = step === 3 && Object.keys(picked).length > 0;
    if (
      hasUnsavedWork &&
      !window.confirm("Close without saving? This template hasn't been saved as a draft.")
    ) {
      return;
    }
    resetAndClose();
  }, [step, picked, resetAndClose]);
```

Then update the three user-initiated close sites to use `requestClose` (the backdrop `onClick` at ~line 264, the header X button `onClick` at ~line 294, and the footer button at ~line 707 — `onClick={step === 1 ? requestClose : () => setStep(step - 1)}`).

- [ ] **Step 3: Refactor `submitMut` to use the helpers and add `saveDraftMut`**

Replace the body of `submitMut`'s `mutationFn` (lines 205–228) and add `saveDraftMut` after it:

```tsx
  // ─ Submit mutation ─
  const submitMut = useMutation({
    mutationFn: async () => {
      const nameSlug = resolveNameSlug();
      if (!/^[a-z][a-z0-9_]*$/.test(nameSlug)) {
        throw new Error(NAME_RULE_ERROR);
      }
      await createTemplate(buildCreateInput(nameSlug));
      await submitTemplate(nameSlug, 1);
      return nameSlug;
    },
    onSuccess: (nameSlug) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      onToast?.(
        `Submitted ${langs.length} language version${langs.length > 1 ? 's' : ''} of ${nameSlug} — Meta reviews each language separately (4–24 hours).`,
        'success',
      );
      resetAndClose();
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Submit failed. Please try again.');
    },
  });

  // ─ Save-as-draft mutation (creates DRAFT rows, no Meta submission) ─
  const saveDraftMut = useMutation({
    mutationFn: async () => {
      const nameSlug = resolveNameSlug();
      if (!/^[a-z][a-z0-9_]*$/.test(nameSlug)) {
        throw new Error(NAME_RULE_ERROR);
      }
      await createTemplate(buildCreateInput(nameSlug));
      return nameSlug;
    },
    onSuccess: (nameSlug) => {
      qc.invalidateQueries({ queryKey: ['templates'] });
      onToast?.(
        `Saved ${nameSlug} as a draft — submit it for review from the template list when ready.`,
        'success',
      );
      resetAndClose();
    },
    onError: (err: Error) => {
      setSubmitError(err.message || 'Save failed. Please try again.');
    },
  });
```

(`submitMut`'s old `onSuccess` called `handleClose`, which no longer exists after the Step 2 rename — this replacement covers that.)

- [ ] **Step 4: Add test ids to the Step 1 brief textarea and Step 3 name input**

Brief textarea (~line 312): add `data-testid="wizard-brief"` to the `<textarea>`.

Name input (~line 485): add `data-testid="wizard-name"` to the `<input type="text">`.

- [ ] **Step 5: Edit panel — test ids and honest label**

In the edit panel (lines 597–643): add `data-testid={`wizard-edit-body-${l}`}` to the per-language `<textarea>`, and change the save button to:

```tsx
                    <Button
                      variant="primary"
                      style={{ flex: 1 }}
                      icon={<IcCheck size={16} />}
                      onClick={() => setEditOpen(false)}
                      data-testid="wizard-apply-edits"
                    >
                      Apply edits
                    </Button>
```

- [ ] **Step 6: Replace the Step 3 actions row with three buttons**

Replace the `{!editOpen && (` actions-row block (lines 647–679) with:

```tsx
              {/* Actions row (only when not in edit mode) */}
              {!editOpen && (
                <div style={{ display: 'flex', gap: 9 }}>
                  <Button
                    variant="secondary"
                    style={{ flex: 1 }}
                    icon={<IcEdit size={16} />}
                    onClick={() => setEditOpen(true)}
                    data-testid="wizard-edit-content"
                  >
                    Edit content
                  </Button>
                  <Button
                    variant="secondary"
                    style={{ flex: 1 }}
                    disabled={saveDraftMut.isPending || submitMut.isPending}
                    onClick={() => {
                      if (!validateName()) return;
                      saveDraftMut.mutate();
                    }}
                    data-testid="wizard-save-draft"
                  >
                    {saveDraftMut.isPending ? 'Saving…' : 'Save as draft'}
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 1 }}
                    icon={<IcSend size={16} />}
                    disabled={submitMut.isPending || saveDraftMut.isPending}
                    onClick={() => {
                      if (!validateName()) return;
                      submitMut.mutate();
                    }}
                    data-testid="wizard-submit"
                  >
                    {submitMut.isPending ? 'Submitting…' : 'Submit for review'}
                  </Button>
                </div>
              )}
```

- [ ] **Step 7: Type-check and lint**

Run (from `apps/web`): `npm run lint` then `npx tsc --noEmit`

Expected: no errors. A leftover `handleClose` reference anywhere is a compile error — fix by using `requestClose` (user-initiated) or `resetAndClose` (programmatic).

---

### Task 3: Verify end-to-end and commit

- [ ] **Step 1: Run the new spec**

With both dev servers running, from `e2e/`: `npx playwright test tests/templates-wizard.spec.ts`

Expected: **2 passed**.

- [ ] **Step 2: Run the existing templates smoke spec for regressions**

From `e2e/`: `npx playwright test tests/templates.spec.ts`

Expected: **2 passed**. (It drives the manual form route and the list filters; the wizard changes must not break it.)

- [ ] **Step 3: Manual sanity check of the reported flow**

In the browser: Templates → Create template → describe → generate → pick → Continue → Edit content → edit → **Apply edits** → **Save as draft**. Confirm the toast appears, the wizard closes, and the family card shows with a DRAFT badge. Open it and confirm "Submit for review" is offered.

- [ ] **Step 4: Commit**

```bash
git add apps/web/src/components/TemplatesAIWizard.tsx
git commit -m "fix(web): AI wizard can save templates as drafts; confirm before discarding at review step"
```

---

## Self-review notes

- **Spec coverage:** reported flow (edit → save → close → see draft) is covered by Task 1 test 1; the silent-discard half of the bug by Task 1 test 2 + Task 2 Step 2; misleading "Save edits" label by Task 2 Step 5.
- **Type consistency:** `resolveNameSlug`/`buildCreateInput`/`validateName` defined in Task 2 Step 1 are the names used in Steps 3 and 6; `resetAndClose`/`requestClose` from Step 2 are the names used in Steps 3 and the close-site updates.
- **Known trade-off:** duplicate-name 409 surfaces as a raw axios message in `submitError` — same as today's submit path; intentionally unchanged.
