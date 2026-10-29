import { Browser, Page, test } from '@playwright/test';
import { USERS } from '../data/config';
import { BoPage, BO_MENU } from '../pages/BoPage';
import { splitBrn } from '../pages/EsimSsmPage';
import { trackContext } from './focusTimeline';

// Before a run spends 3–6 minutes on eSIM, reCAPTCHA and payment, make sure the
// company has never had a Pre-Application on this environment. A "PASS" row in
// the Company Details Checker can still be onboarded (12153_TS02, 2026-10-23:
// MA0248268-X already approved as P260702/00678 → BO Approve said "Unable to
// generate the application link"). Faizuddin approved this check 2026-10-23.
//
// How: BO (assignee) → UCD Pre-Application Listing → type the New BRN, Search;
// then the Old BRN, Search — the way a person would. Any row = used. Used
// companies print COMPANY-SKIP (the dashboard spends them) and COMPANY_SPOILED
// (the run route marks them used for good), and the next alternate is tried.

export type Candidate = { oldBrn: string; newBrn: string; tin: string };

/** Search the Pre-Application listing on one field and return the Pre-Application Nos found. */
async function preAppsFor(page: Page, bo: BoPage, field: 'newBRN' | 'oldBRN' | 'businessTrading', value: string): Promise<string[]> {
  for (const id of ['newBRN', 'oldBRN', 'businessTrading']) {
    if (!(await page.locator(`#${id}`).count())) continue;
    const box = page.locator(`#${id}`);
    await bo.demoHighlight(box);
    await box.fill(id === field ? value : '');
  }
  const btn = page.locator('#to-search');
  await bo.demoHighlight(btn);
  const answered = page.waitForResponse(r => /preOnb\/form\/enquiry\/search/.test(r.url()), { timeout: 60_000 }).catch(() => null);
  await btn.click();
  if (!(await answered)) throw new Error(`BO Pre-Application Listing did not answer the ${field} search for ${value}.`);
  await page.locator('#overlay').waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(500);
  const rows = page.locator('tbody tr', { hasText: value });
  const texts = await rows.allInnerTexts().catch(() => [] as string[]);
  return texts.map(t => /P\d{6}\/\d{5}/.exec(t)?.[0] ?? '(no Pre-Application No)');
}

/**
 * Drop the candidates BO already knows. Returns the free ones, in order.
 * Throws when none is free.
 */
export async function dropCompaniesUsedInBo(browser: Browser, candidates: Candidate[]): Promise<Candidate[]> {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: process.env.PW_VIDEO === '1' ? { dir: test.info().outputPath('bo-check-video'), size: { width: 1920, height: 1080 } } : undefined });
  trackContext(ctx, 'BackOffice check');
  const page = await ctx.newPage();
  const bo = new BoPage(page, ctx);
  const free: Candidate[] = [];
  try {
    await bo.login(USERS.assignee);
    await bo.openListing(BO_MENU.preApplicationListing);
    for (const c of candidates) {
      const found = [
        ...await preAppsFor(page, bo, 'newBRN', c.newBrn),
        ...await preAppsFor(page, bo, 'oldBRN', splitBrn(c.oldBrn).roc),
      ];
      if (!found.length) {
        console.log(`DETAIL: BO has no earlier Pre-Application for ${c.oldBrn} / ${c.newBrn}`);
        // Only the first free one is needed now; later ones stay as alternates.
        free.push(c);
        break;
      }
      const refs = [...new Set(found)].join(', ');
      console.log(`DETAIL: BO already has Pre-Application ${refs} for ${c.oldBrn} / ${c.newBrn} — company used, skipping it`);
      await bo.captureEvidence(`bo-company-used-${c.oldBrn}`);
      console.log(`COMPANY-SKIP ${JSON.stringify(c)}`);
      console.log('COMPANY_SPOILED:' + JSON.stringify({ roc: c.oldBrn, newRoc: c.newBrn, tin: c.tin, reason: `earlier Pre-App ${refs}` }));
    }
  } finally { await ctx.close(); }
  if (!free.length) throw new Error(`Every company tried (${candidates.map(c => c.oldBrn).join(', ')}) already has a Pre-Application in BO. Drop a newer company Excel or pick another company on the TS row.`);
  const rest = candidates.slice(candidates.indexOf(free[0]) + 1);
  return [free[0], ...rest];
}

/**
 * Business Trading: the run types the licence from the dashboard, never another one
 * (Faizuddin, 2026-10-28: 12153_TS07 kept failing because the run did not use the
 * dashboard's licence). BO refuses a second Pre-Application for a licence with
 * "Unable to generate the application link for this potential UCD" (12153_TS07,
 * 2026-10-27), so a used licence stops the run here, before any payment.
 */
export async function checkLicenceFreeInBo(browser: Browser, licence: string): Promise<void> {
  const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 }, recordVideo: process.env.PW_VIDEO === '1' ? { dir: test.info().outputPath('bo-check-video'), size: { width: 1920, height: 1080 } } : undefined });
  trackContext(ctx, 'BackOffice check');
  const page = await ctx.newPage();
  const bo = new BoPage(page, ctx);
  try {
    await bo.login(USERS.assignee);
    await bo.openListing(BO_MENU.preApplicationListing);
    const found = await preAppsFor(page, bo, 'businessTrading', licence);
    if (!found.length) {
      console.log(`DETAIL: BO has no earlier Pre-Application for licence ${licence}`);
      return;
    }
    await bo.captureEvidence(`bo-licence-used-${licence.replace(/\W/g, '-')}`);
    throw new Error(`Licence ${licence} (from the dashboard) already has Pre-Application ${[...new Set(found)].join(', ')} in BO. Press the shuffle button on the row for a new licence, then run again.`);
  } finally { await ctx.close(); }
}
