import type { Page } from '@playwright/test';

// Behaviour every `/obs/` screen shares — BackOffice and the dealer forms are
// the same application. Ported from Azila's EAINT-12341 robot
// (eauto-qa-gpt `consolidate-azila`, src/pages/obs/obs-page.ts), unchanged in
// behaviour. See knowledge/flow-ucd-onboarding.md.

/**
 * Wait for an `/obs/` page to be readable. These pages never fire `load` /
 * `domcontentloaded` (static assets that never answer), so poll for a body
 * big enough to be real. Observed on staging 2026-09-22 (Azila).
 */
export async function settleObs(page: Page, minChars = 15_000, timeout = 30_000): Promise<number> {
  const deadline = Date.now() + timeout;
  for (;;) {
    const size = await page.evaluate(() => document.body?.innerHTML?.length ?? 0).catch(() => 0);
    if (size >= minChars || Date.now() > deadline) return size;
    await page.waitForTimeout(400);
  }
}

/**
 * Press the affirmative button on the open jQuery UI dialog and return what
 * it said ("" when no dialog). The buttons are **No / Yes**, never the verb —
 * matching the verb re-hits the button that opened the dialog and nothing
 * happens (Azila, 2026-09-22).
 */
export async function confirmObsDialog(page: Page, names = /^yes$/i): Promise<string> {
  const dialog = page.locator('.ui-dialog:visible').last();
  if (!(await dialog.count().catch(() => 0))) return '';
  const text = (await dialog.innerText().catch(() => '')).replace(/\s+/g, ' ').trim();
  const button = dialog.getByRole('button', { name: names }).first();
  if (!(await button.count().catch(() => 0))) return text;
  await button.click({ timeout: 15_000 }).catch(() => undefined);
  await page.waitForTimeout(2_500);
  return text;
}

/**
 * Press a dealer-form Submit and ride out the "Unsaved Changes → Save &
 * Continue" cycle until the page confirms. Steps 3 and 4 both behave this way.
 */
export async function submitUntilConfirmed(
  page: Page,
  controlId: string,
  success = /successfully submitted/i,
  tries = 6,
): Promise<string> {
  for (let i = 0; i < tries; i++) {
    await page.locator(`#${controlId}`).click({ timeout: 20_000 }).catch(() => undefined);
    await page.waitForTimeout(2_500);
    for (let d = 0; d < 3; d++) {
      const text = await confirmObsDialog(page, /^(save & continue|yes|ok|submit|confirm|proceed)$/i);
      if (!text) break;
      if (success.test(text)) return text;
    }
    const body = await page.locator('body').innerText().catch(() => '');
    const hit = body.split('\n').find(line => success.test(line));
    if (hit) return hit.trim();
  }
  throw new Error(`#${controlId} was pressed ${tries} times and the page never confirmed.`);
}

export type FormStep = 1 | 2 | 3 | 4 | 5;

/** Which `#stepN` of the Application form is visible, or 0 (receipt / none). */
export async function visibleFormStep(page: Page): Promise<FormStep | 0> {
  for (const n of [5, 4, 3, 2, 1] as const) {
    if (await page.locator(`#step${n}`).isVisible().catch(() => false)) return n;
  }
  return 0;
}
