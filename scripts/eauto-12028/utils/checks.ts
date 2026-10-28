import { expect, Locator, test } from '@playwright/test';
import { AplDetailsPage } from '../pages/AplDetailsPage';
import { norm } from './table';

// Assertions several TS share. Each one says exactly which state it means
// (lesson 11): "absent" = count 0; "disabled" = in the page and greyed.

type Btn = 'Approve' | 'KIV' | 'Reject' | 'FMC Payment Request' | 'MMSDA Payment Request';

function btnOf(d: AplDetailsPage, b: Btn): Locator {
  switch (b) {
    case 'Approve': return d.approveBtn();
    case 'KIV': return d.kivBtn();
    case 'Reject': return d.rejectBtn();
    case 'FMC Payment Request': return d.fmcBtn();
    case 'MMSDA Payment Request': return d.mmsdaBtn();
  }
}

export async function expectButtons(d: AplDetailsPage, ts: string, want: { enabled?: Btn[]; disabled?: Btn[]; absent?: Btn[]; disabledOrAbsent?: Btn[]; visible?: Btn[] }): Promise<void> {
  for (const b of want.enabled ?? []) {
    await test.step(`Check [${b}] is shown and enabled`, async () => {
      const l = btnOf(d, b);
      await d.verify(`${ts}-${b}-enabled`, (await l.count()) ? l : d.wfBar(), `[${b}] should be enabled`, async () => {
        await expect(l).toHaveCount(1);
        await expect(l).toBeEnabled();
      });
      await d.showValue(l);
    });
  }
  for (const b of want.visible ?? []) {
    await test.step(`Check [${b}] is shown`, async () => {
      const l = btnOf(d, b);
      await d.verify(`${ts}-${b}-shown`, (await l.count()) ? l : d.invBar(), `[${b}] should be shown`, async () => {
        await expect(l).toHaveCount(1);
        await expect(l).toBeVisible();
      });
      await d.showValue(l);
    });
  }
  for (const b of want.disabled ?? []) {
    await test.step(`Check [${b}] is disabled`, async () => {
      const l = btnOf(d, b);
      await d.verify(`${ts}-${b}-disabled`, (await l.count()) ? l : d.wfBar(), `[${b}] should be shown and disabled`, async () => {
        await expect(l).toHaveCount(1);
        await expect(l).toBeDisabled();
      });
      await d.showValue(l);
    });
  }
  for (const b of want.absent ?? []) {
    await test.step(`Check [${b}] is not on the page`, async () => {
      const l = btnOf(d, b);
      await d.verify(`${ts}-${b}-absent`, l, `[${b}] must not be offered here`, async () => expect(l).toHaveCount(0));
    });
  }
  for (const b of want.disabledOrAbsent ?? []) {
    await test.step(`Check [${b}] is disabled or not shown`, async () => {
      const l = btnOf(d, b);
      if (await l.count()) await d.verify(`${ts}-${b}-not-actionable`, l, `[${b}] must not be usable on a fully approved month`, async () => expect(l).toBeDisabled());
    });
  }
}

/** Waiting note under the buttons, exact text. */
export async function expectNote(d: AplDetailsPage, ts: string, text: string): Promise<void> {
  await test.step(`Check the note reads "${text}"`, async () => {
    const n = d.note();
    await d.verify(`${ts}-note`, (await n.count()) ? n : d.wfBar(), `Note should read "${text}"`, async () => {
      await expect(n).toHaveCount(1);
      expect(norm(await n.innerText())).toBe(text);
    });
    await d.showValue(n);
  });
}

/** The signature popup is NOT shown (lesson 11: given a short time, then count of visible = 0). */
export async function expectNoPad(d: AplDetailsPage, ts: string): Promise<void> {
  const shown = await d.shownWithin(d.sigModal());
  if (shown) {
    await d.captureIssue(`${ts}-pad-shown`, d.sigModal(), 'Signature pad shown again — the stored signature should be reused');
    throw new Error('The signature pad was shown, but this user has signed before (SRD v1.1 REQ-014 Example 2 "the pad is not shown again").');
  }
}
