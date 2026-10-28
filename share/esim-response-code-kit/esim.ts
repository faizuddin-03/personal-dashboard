// eSIM (eAuto Simulator): open a record by vehicle prefix and change its Response Code.
// Taken from Faizuddin's scripts/eauto-esim. VPN required. See README.md.

import { expect, type Page } from '@playwright/test';

export const ESIM_BASE = 'https://172.30.202.114:9089/esim';

/** Entity -> list page path under ESIM_BASE. */
export const ENTITIES = {
  'estm-enquiry': '/estm-enquiry-resp',
  'estm-submission': '/estm-submission-resp',
  'dereg-enquiry': '/dereg-enquiry-resp',
  'dereg-submission': '/dereg-submission-resp',
  'dereg-precheck-enquiry': '/dereg-precheck-enquiry-resp',
  'rhb-transfer': '/rhb-transfer-resp',
  'jomcheck-enquiry': '/jomcheck-enquiry-resp',
  'jomcheck-report': '/jomcheck-report-resp',
} as const;
export type Entity = keyof typeof ENTITIES;

/** eSIM prefix = first 2 characters of the vehicle no. (HX1234 -> HX). */
export const prefixOf = (vehicleNo: string) => vehicleNo.trim().toUpperCase().slice(0, 2);

/** Step 1: log in. A failed login re-renders the login form instead of erroring. */
export async function esimLogin(page: Page): Promise<void> {
  const user = process.env.ESIM_USER;
  const pass = process.env.ESIM_PASS;
  if (!user || !pass) throw new Error('Set ESIM_USER and ESIM_PASS.');
  await page.goto(`${ESIM_BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.locator('input[name="username"]').fill(user);
  await page.locator('input[name="password"]').fill(pass);
  await page.locator('button.login-btn, button[type="submit"]').first().click();
  await expect(page.locator('aside.sidebar'), 'eSIM login failed: wrong login, or VPN is off')
    .toBeVisible({ timeout: 20_000 });
}

/** Step 2: open the entity list, search the prefix, open its edit form.
 *  All rows are in the DOM; #searchInput hides non-matches client-side, so
 *  only visible rows count. The search is a substring match ("AB" also finds
 *  "ABC"), so the Vn Start With cell must match exactly. */
export async function openRecord(page: Page, entity: Entity, prefix: string): Promise<void> {
  await page.goto(`${ESIM_BASE}${ENTITIES[entity]}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#dataTable')).toBeVisible({ timeout: 20_000 });
  await page.locator('#searchInput').fill(prefix);
  await page.waitForTimeout(600);

  const rows = page.locator('#dataTable tbody tr').locator('visible=true');
  const hrefs: string[] = [];
  for (let i = 0; i < await rows.count(); i++) {
    const cell = (await rows.nth(i).locator('td').nth(1).innerText()).trim();
    const href = await rows.nth(i).locator('a[href*="/edit"]').first().getAttribute('href');
    if (href && cell.toUpperCase() === prefix.toUpperCase()) hrefs.push(href);
  }
  if (hrefs.length !== 1) {
    throw new Error(`${hrefs.length} records with Vn Start With "${prefix}" in ${entity}. Need exactly 1.`);
  }
  const url = hrefs[0].startsWith('http') ? hrefs[0] : new URL(hrefs[0], ESIM_BASE).toString();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('form[action$="/save"]')).toBeVisible({ timeout: 20_000 });
}

/** Step 3: change Response Code on the open edit form, save, confirm.
 *  The field is found by its label (label.form-label > span "Response Code",
 *  then its for= id). Returns the previous code so it can be restored. */
export async function changeResponseCode(page: Page, code: string): Promise<string> {
  const id = await page.locator('label.form-label:has(span:text-is("Response Code"))').first().getAttribute('for');
  if (!id) throw new Error('No "Response Code" field on this form.');
  const field = page.locator(`#${id}`);
  const before = (await field.inputValue()).trim();
  await field.fill(code);

  await page.locator('form[action$="/save"] button[type="submit"]').click();
  // Save lands on the record's view page, not the list.
  await expect(page.getByText(/saved successfully/i), 'eSIM did not confirm the save')
    .toBeVisible({ timeout: 20_000 });
  return before;
}

/** All three steps in one call. Returns the previous code. */
export async function setResponseCode(page: Page, entity: Entity, vehicleNo: string, code: string): Promise<string> {
  await esimLogin(page);
  await openRecord(page, entity, prefixOf(vehicleNo));
  return changeResponseCode(page, code);
}
