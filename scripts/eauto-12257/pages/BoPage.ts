import { Page, BrowserContext } from '@playwright/test';
import { BasePage } from './BasePage';
import { CONFIG } from '../data/config';
import { settleObs, confirmObsDialog } from './ObsShared';

// BackOffice onboarding screens. Ported from Azila's backoffice.page.ts;
// handles re-confirmed on the 2026-10-21 walk-through
// (knowledge/flow-ucd-onboarding.md rows 6–19, captures obs-admin-*.html):
//
//   login     /<instance>/public/login/ → /<instance>/home/
//   logout    /<instance>/user/logout.do — the Logout LINK raises a native
//             confirm("Sure to logout?") that freezes automation; the link's
//             own handler goes to this URL after OK, so the URL is used.
//   /obs      li.obs-auth-required[data-type=…] on the BO home opens the /obs
//             session; /obs/admin/* is 403 without it. Re-click after a user switch.
//   listings  Pre-Application: #preOnboardingNo #companyName … #to-search
//             Application: #applicationNo #companyName … #to-search
//   rows      View / Edit open a NEW TAB.

export const BO_MENU = {
  preApplicationListing: 'PRE_OBS_APPLICATION_LISTING',
  applicationListing: 'OBS_APPLICATION_LISTING',
} as const;

export class BoPage extends BasePage {
  constructor(page: Page, private readonly context: BrowserContext) { super(page); }

  async login(user: { username: string; password: string }): Promise<void> {
    if (!user.password) throw new Error(`BO password for ${user.username} is blank — type it on the dashboard (BackOffice section).`);
    await this.page.goto(CONFIG.loginUrl, { waitUntil: 'domcontentloaded', timeout: CONFIG.navigationTimeout });
    // Capture: _reference/html/eauto/eauto-public-login-staging-eauto.html
    const name = this.page.locator('#form-username');
    await this.demoHighlight(name);
    await name.fill(user.username);
    await name.press('Tab');
    await this.page.locator('#form-password').fill(user.password);
    const btn = this.page.getByRole('button', { name: /^login/i }).first();
    await this.demoHighlight(btn);
    await Promise.all([
      this.page.waitForURL(new RegExp(`/${CONFIG.boInstance}/home`), { waitUntil: 'domcontentloaded', timeout: 60_000 }),
      btn.click(),
    ]).catch(() => { throw new Error(`BO login as ${user.username} did not reach /${CONFIG.boInstance}/home — wrong password or instance?`); });
    console.log(`DETAIL: BackOffice signed in as ${user.username} (/${CONFIG.boInstance})`);
  }

  async logout(): Promise<void> {
    await this.page.goto(CONFIG.logoutUrl, { waitUntil: 'domcontentloaded' }).catch(() => undefined);
    console.log('DETAIL: BackOffice signed out');
  }

  /** Open an onboarding listing from the BO home menu (also opens the /obs session). */
  async openListing(item: string): Promise<void> {
    if (!/\/home\/?/.test(new URL(this.page.url()).pathname)) {
      await this.page.goto(CONFIG.boHomeUrl, { waitUntil: 'commit' });
    }
    const menu = this.page.locator(`li.obs-auth-required[data-type="${item}"]`);
    await menu.waitFor({ state: 'attached', timeout: 60_000 });
    // The menu item can sit in a collapsed group; the handler is on the <li>.
    if (!(await menu.isVisible().catch(() => false))) {
      await menu.locator('xpath=ancestor::li[1]/a').first().hover().catch(() => undefined);
    }
    await this.demoHighlight(menu);
    await menu.click({ timeout: 30_000 });
    // Search as soon as the Search button shows. No settleObs here: the listing
    // stays under its 15,000-character mark until a search fills the table, so it
    // always waited the full 30 s (Faizuddin, 2026-10-26: "the automation seems to
    // wait a long time in the listing page before searching").
    await this.page.locator('#to-search').waitFor({ state: 'visible', timeout: 90_000 });
    console.log(`DETAIL: Opened ${item === BO_MENU.preApplicationListing ? 'UCD Pre-Application Listing' : 'UCD Application Listing'}`);
  }

  /** Type the search fields, Search, and wait until the table answers THIS search (two equal reads). */
  async search(fields: Record<string, string>, timeout = 60_000): Promise<void> {
    for (const [id, value] of Object.entries(fields)) {
      const box = this.page.locator(`#${id}`);
      await this.demoHighlight(box);
      await box.fill(value);
    }
    const btn = this.page.locator('#to-search');
    await this.demoHighlight(btn);
    await btn.click();
    const wanted = Object.values(fields).map(v => v.toUpperCase());
    const deadline = Date.now() + timeout;
    let previous = '';
    for (;;) {
      await this.page.waitForTimeout(300);
      const now = await this.page.evaluate(() => document.querySelector('tbody')?.innerText?.replace(/\s+/g, ' ') ?? '');
      const answered = /no records found/i.test(now) || wanted.some(w => now.toUpperCase().includes(w));
      if ((answered && now === previous) || Date.now() > deadline) return;
      previous = now;
    }
  }

  /** One listing row by header → cell. Throws on "No records found". */
  async readRow(match: string, show?: string): Promise<Record<string, string>> {
    const row = await this.page.evaluate(m => {
      const table = Array.from(document.querySelectorAll('table')).find(t => t.querySelector('thead th'));
      if (!table) return null;
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => (th.textContent ?? '').replace(/\s+/g, ' ').trim());
      const tr = Array.from(table.querySelectorAll('tbody tr')).find(r => (r.textContent ?? '').includes(m));
      if (!tr) return null;
      const cells = Array.from(tr.querySelectorAll('td')).map(td => (td.textContent ?? '').replace(/\s+/g, ' ').trim());
      return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? '']));
    }, match);
    if (!row || Object.values(row).some(v => /no records found/i.test(v))) throw new Error(`No listing row containing "${match}".`);
    const tr = this.page.locator('tbody tr', { hasText: match }).first();
    await this.demoHighlight(tr, { color: 'green' });
    // The listings are wider than the screen: scroll to the last column so the video
    // shows the whole row, then back to `show` (kept in view for the screenshot) or
    // the first column (Faizuddin, 2026-10-27: right-side columns were never recorded).
    const cells = tr.locator('td');
    const n = await cells.count();
    if (n > 1) {
      await cells.nth(n - 1).scrollIntoViewIfNeeded().catch(() => undefined);
      await this.page.waitForTimeout(1_500);
      const at = show ? Object.keys(row).indexOf(show) : -1;
      const back = cells.nth(at >= 0 ? at : 0);
      await back.scrollIntoViewIfNeeded().catch(() => undefined);
      if (at >= 0) await this.demoHighlight(back, { color: 'green' });
    }
    return row;
  }

  /** Rows of the current search containing `match` (0 on "No records found"). */
  async countRows(match: string): Promise<number> {
    return this.page.evaluate(m => Array.from(document.querySelectorAll('tbody tr'))
      .filter(r => (r.textContent ?? '').includes(m) && !/no records found/i.test(r.textContent ?? '')).length, match);
  }

  /**
   * Application listing → "Registration Fee" filter (`select#stage4Status`:
   * All / - / Pending UCD / Failed / OK; capture obs-admin-application-enquiry-default.html),
   * then Search with the company name.
   */
  async filterRegistrationFee(label: 'OK' | 'Failed' | 'Pending UCD', companyName: string): Promise<void> {
    const sel = this.page.locator('#stage4Status');
    await this.demoHighlight(sel);
    await sel.selectOption({ label });
    await this.search({ companyName });
    console.log(`DETAIL: Application listing filtered by Registration Fee = ${label}`);
  }

  /** Back to "All" so later searches are not filtered. */
  async clearRegistrationFeeFilter(): Promise<void> {
    await this.page.locator('#stage4Status').selectOption({ label: 'All' }).catch(() => undefined);
  }

  /**
   * BO Pre-Application Summary → "Payment Details" block (`.section-title` +
   * `table.detail-table`; capture obs-admin-preonb-summary-new.html):
   * Payment ID / Payment Method / Payment Date Time / Payment Status.
   */
  async paymentDetails(detail: Page): Promise<Record<string, string>> {
    const title = detail.locator('.section-title', { hasText: 'Payment Details' }).first();
    await title.scrollIntoViewIfNeeded().catch(() => undefined);
    const table = title.locator('xpath=following-sibling::table[1]');
    await new BasePage(detail).demoHighlight(table, { color: 'green' });
    return table.evaluate(t => Object.fromEntries(Array.from(t.querySelectorAll('tr')).map(tr => {
      const td = tr.querySelectorAll('td');
      return [(td[0]?.textContent ?? '').replace(/[:\s]+$/, '').trim(), (td[1]?.textContent ?? '').replace(/\s+/g, ' ').trim()];
    })));
  }

  /** Click the row's action link (View / Edit) — opens a new tab. */
  async openRow(match: string, timeout = 120_000): Promise<Page> {
    const row = this.page.locator('tbody tr', { hasText: match }).first();
    if (!(await row.count())) throw new Error(`No BackOffice row matching "${match}".`);
    const link = row.locator('td').last().locator('a,button').first();
    const opened = this.context.waitForEvent('page', { timeout }).catch(() => null);
    await this.demoHighlight(link);
    await link.click({ timeout: 20_000 });
    const tab = await opened;
    if (!tab) throw new Error(`Clicked the action link of "${match}" but no new tab opened within ${timeout / 1000}s.`);
    await settleObs(tab);
    return tab;
  }

  /** Pre-Application detail: Approve → dialog "Yes" → the Application link appears. */
  async approvePreApplication(detail: Page): Promise<string> {
    const bo = new BasePage(detail);
    const btn = detail.getByRole('button', { name: /^approve$/i }).first();
    await bo.demoHighlight(btn);
    await btn.click({ timeout: 20_000 });
    const said = await confirmObsDialog(detail);
    console.log(`DETAIL: Approve confirmed — dialog said "${said}"`);
    for (let i = 0; i < 40; i++) {
      const link = await this.applicationLink(detail).catch(() => '');
      if (link) return link;
      if (i === 20) { await detail.reload({ waitUntil: 'commit' }).catch(() => undefined); await settleObs(detail); }
      await detail.waitForTimeout(1_500);
    }
    throw new Error(`Approve was pressed (dialog "${said || 'none'}") but no Application link appeared within 60 s.`);
  }

  /** The signed Application link, read from the page (the Copy Link input). `&amp;` decoded or it 403s. */
  async applicationLink(detail: Page): Promise<string> {
    const link = await detail.evaluate(() => {
      const fromInput = Array.from(document.querySelectorAll('input,textarea'))
        .map(i => (i as HTMLInputElement).value)
        .find(v => /\/obs\/form\/[0-9a-f-]{36}\?/i.test(v || ''));
      if (fromInput) return fromInput;
      return (document.body.innerHTML.match(/https?:\/\/[^"'<>\s]*\/obs\/form\/[^"'<>\s]+/i) ?? [])[0] ?? '';
    });
    if (!link) throw new Error('No Application link on this page.');
    return link.replace(/&amp;/g, '&');
  }

  /** Assignee: UCD Group = Authorised Dealer → Submit For Approval → Yes. */
  async submitForApproval(detail: Page, group = 'Authorised Dealer'): Promise<void> {
    const bo = new BasePage(detail);
    const control = detail.locator('#to-submit-for-approval');
    if (!(await control.count())) throw new Error('No "Submit For Approval" on this page — the signed-in BO user is not the assignee at this stage.');
    const sel = detail.locator('#ucdGroup');
    await bo.demoHighlight(sel);
    await sel.selectOption({ label: group });
    await bo.demoHighlight(control);
    await control.click({ timeout: 20_000 });
    const said = await confirmObsDialog(detail);
    for (let i = 0; i < 20; i++) {
      if (!(await control.count().catch(() => 0))) { console.log(`DETAIL: UCD Group "${group}", Submit For Approval confirmed ("${said}")`); return; }
      if (i === 10) { await detail.reload({ waitUntil: 'commit' }).catch(() => undefined); await settleObs(detail); }
      await detail.waitForTimeout(1_500);
    }
    throw new Error(`Submit For Approval was pressed (dialog "${said || 'none'}") but the page still offers it 30 s later.`);
  }

  /** Approver: Approve → Yes → Registration Documents tab appears. */
  async approveApplication(detail: Page): Promise<void> {
    const bo = new BasePage(detail);
    const btn = detail.locator('#to-approve-ucd');
    await bo.demoHighlight(btn);
    await btn.click({ timeout: 20_000 });
    const said = await confirmObsDialog(detail);
    for (let i = 0; i < 20; i++) {
      if (await detail.locator('a[href*="edit-registration-doc"]').count().catch(() => 0)) {
        console.log(`DETAIL: Application approved ("${said}") — Registration Documents tab shown`);
        return;
      }
      if (i === 10) { await detail.reload({ waitUntil: 'commit' }).catch(() => undefined); await settleObs(detail); }
      await detail.waitForTimeout(1_500);
    }
    throw new Error(`Approve was pressed (dialog "${said || 'none'}") but no Registration Documents tab appeared.`);
  }

  /** Assignee: Registration Documents tab → Verified → Yes. */
  async verifyRegistrationDocuments(detail: Page): Promise<void> {
    const bo = new BasePage(detail);
    const tab = detail.locator('a[href*="edit-registration-doc"]').first();
    await bo.demoHighlight(tab);
    await tab.click();
    await detail.waitForURL(/edit-registration-doc/, { timeout: 60_000 });
    await settleObs(detail);
    const btn = detail.locator('#to-submit-verified');
    if (!(await btn.isVisible().catch(() => false))) throw new Error('No "Verified" button on Registration Documents — the dealer has not submitted page 4, or this user is not the assignee.');
    await bo.demoHighlight(btn);
    await btn.click();
    // Wait for BO to save before the caller closes this tab: on 12153_TS03
    // (2026-10-23) the tab closed 2.5 s after Yes, the save request
    // (verify-softcopy-documents) was cancelled, and Softcopy Docs stayed
    // "Pending Assignee", so the dealer never got page 5.
    const saved = detail.waitForResponse(r => /verify-softcopy-documents/.test(r.url()), { timeout: 60_000 });
    const said = await confirmObsDialog(detail);
    const res = await saved.catch(() => null);
    if (!res) throw new Error('BO Verified: no reply from verify-softcopy-documents within 60 s — the documents were not verified.');
    if (!res.ok()) throw new Error(`BO Verified: the save returned HTTP ${res.status()} — the documents were not verified.`);
    // Confirm on screen the way a person would: the Verified button goes away.
    await btn.waitFor({ state: 'hidden', timeout: 30_000 })
      .catch(() => { throw new Error('BO Verified: the save replied, but the "Verified" button is still shown.'); });
    console.log(`DETAIL: Registration documents Verified ("${said}") — BO saved it`);
    await bo.captureEvidence('bo-registration-docs-verified');
  }
}
