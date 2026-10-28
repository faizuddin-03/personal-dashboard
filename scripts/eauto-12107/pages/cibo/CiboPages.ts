import { Page, Locator, Download, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { BasePage } from '../BasePage';
import { CIBO } from '../../data/cibo';

// ── CIBO page objects ─────────────────────────────────────
// Selectors from the live staging pages captured 2026-10-16
// (_reference/html/cibo/). CIBO is an Angular app: filters are ng-select,
// dates are readonly ngbdatepicker inputs, Search is button[type=submit],
// Print / Export sit in the listing card, a loading row is
// `tbody i.ia-spinner`. Every listing also renders a hidden print-only copy
// (`.d-print-block`), so tables are always read from `main .card table`.

/** CIBO API calls still waiting for an answer, per page. Playwright's
 *  'networkidle' only covers a full page load, not the calls this Angular app
 *  makes afterwards, so they are counted here. */
const pendingCalls = new WeakMap<Page, Set<object>>();

function trackCalls(page: Page): void {
  if (pendingCalls.has(page)) return;
  const pending = new Set<object>();
  pendingCalls.set(page, pending);
  page.on('request', r => { if (['xhr', 'fetch'].includes(r.resourceType())) pending.add(r); });
  page.on('requestfinished', r => pending.delete(r));
  page.on('requestfailed', r => pending.delete(r));
}

/** Waits until no CIBO API call has been open for 1 s (or `timeout`). */
async function waitForQuiet(page: Page, timeout: number): Promise<void> {
  const pending = pendingCalls.get(page);
  if (!pending) return;
  const deadline = Date.now() + timeout;
  let quietSince = 0;
  while (Date.now() < deadline) {
    if (pending.size) quietSince = 0;
    else if (!quietSince) quietSince = Date.now();
    else if (Date.now() - quietSince >= 1000) return;
    await page.waitForTimeout(100);
  }
}

/** Login — the only page ever goto()'d directly. */
export class CiboLoginPage extends BasePage {
  async open(): Promise<void> {
    trackCalls(this.page);
    await this.page.goto(CIBO.baseUrl + CIBO.loginPath, { waitUntil: 'domcontentloaded' });
    await this.page.locator('input[formcontrolname="loginId"]').waitFor({ state: 'visible' });
  }

  async login(): Promise<void> {
    const id = this.page.locator('input[formcontrolname="loginId"]');
    const pwd = this.page.locator('input[formcontrolname="pwd"]');
    await this.demoHighlight(id);
    await id.fill(CIBO.loginId);
    await this.demoHighlight(pwd);
    await pwd.fill(CIBO.password);
    const btn = this.page.locator('button[type="submit"]', { hasText: 'Login' });
    await this.demoHighlight(btn);
    await btn.click();
    await this.page.waitForURL(/\/cibo\/(?!auth)/, { timeout: CIBO.listingTimeout });
  }

  /** Sidebar link, e.g. "Transaction Management". Matched on its href
   *  (/cibo/transaction-management): the sidebar collapses to icons only after
   *  a wide listing is read, and the label text is then hidden (live 2026-10-19). */
  async openMenu(label: string): Promise<void> {
    const slug = label.toLowerCase().replace(/\s+/g, '-');
    const link = this.page.locator(`nav a[href$="/cibo/${slug}"]`).first();
    await this.demoHighlight(link);
    await link.click();
    await this.page.locator('main h3', { hasText: label }).waitFor({ state: 'visible', timeout: CIBO.listingTimeout });
  }
}

/** One parsed listing row: header text → cell text (whitespace collapsed). */
export type ListingRow = Record<string, string>;

/** Shared listing behaviour: search, wait, read rows, export. */
export class CiboListingPage extends BasePage {
  constructor(page: Page, private readonly loadTimeout = CIBO.listingTimeout) { super(page); }

  protected table(): Locator { return this.page.locator('main .card table').first(); }
  private searchInput(): Locator { return this.page.locator('main input[formcontrolname="search"]'); }
  private searchBtn(): Locator { return this.page.locator('main button[type="submit"]', { hasText: 'Search' }); }
  private clearAllBtn(): Locator { return this.page.locator('main button', { hasText: 'Clear all' }); }
  exportBtn(): Locator { return this.page.locator('main .card button', { hasText: 'Export' }); }

  async search(text: string): Promise<void> {
    const box = this.searchInput();
    await this.demoHighlight(box);
    await box.fill(text);
    await this.clickSearch();
  }

  async clickSearch(): Promise<void> {
    const btn = this.searchBtn();
    await this.demoHighlight(btn);
    // The old rows stay on screen until the new ones arrive, and the loading
    // row can appear a moment after the click. Reading straight away read the
    // previous, unfiltered list (12107_TS06, 2026-10-20). Wait until the
    // loading row shows or the rows change, then for loading to finish.
    // A page's own first load (every row, no filter) can still be on its way.
    // Arriving after the filtered result, it replaced it on screen
    // (12107_TS06, 2026-10-20: request sent "paymentChannelList":
    // ["FIUU_SHOPEEPAY"], the unfiltered response landed last). Wait for the
    // network to go quiet first, as a person waits for the page to load.
    await waitForQuiet(this.page, this.loadTimeout);
    const before = await this.tbodyText();
    await btn.click();
    await this.poll(async () =>
      (await this.table().locator('tbody i.ia-spinner').count()) > 0 || (await this.tbodyText()) !== before, 10_000, 100);
    await this.waitForListing();
    await waitForQuiet(this.page, this.loadTimeout);
  }

  private async tbodyText(): Promise<string> {
    return this.table().locator('tbody').first().innerText({ timeout: 2000 }).catch(() => '');
  }

  /** One cell of the listing, by row index (as returned by rows()) and header. */
  async cell(rowIndex: number, header: string): Promise<Locator> {
    const col = (await this.headers()).indexOf(header);
    const rows = this.table().locator('tbody tr').filter({ has: this.page.locator('td:nth-child(3)') });
    return rows.nth(rowIndex).locator(':scope > td').nth(Math.max(col, 0));
  }

  /** The header cell of a column. */
  headerCell(header: string): Locator {
    return this.table().locator('thead th').filter({ hasText: new RegExp(`^\\s*${escapeRe(header)}\\s*$`) }).first();
  }

  async clearAll(): Promise<void> {
    const btn = this.clearAllBtn();
    await this.demoHighlight(btn);
    await btn.click();
  }

  /** Waits for the table to appear and the loading spinner to go. Fails with
   *  a plain message when it never does (Payment Report, 2026-10-16). */
  async waitForListing(): Promise<void> {
    await this.table().waitFor({ state: 'visible', timeout: this.loadTimeout });
    const done = await this.poll(async () => (await this.table().locator('tbody i.ia-spinner').count()) === 0, this.loadTimeout, 500);
    if (!done) {
      await this.captureEvidence('listing-still-loading');
      throw new Error(`Listing still loading after ${this.loadTimeout / 1000}s — the server did not return the rows.`);
    }
  }

  async headers(): Promise<string[]> {
    return (await this.table().locator('thead th').allInnerTexts()).map(t => this.clean(t));
  }

  /** Every data row on the current page, keyed by header. */
  async rows(): Promise<ListingRow[]> {
    const heads = await this.headers();
    const raw = await this.table().locator('tbody tr').evaluateAll(trs =>
      trs.map(tr => Array.from(tr.querySelectorAll(':scope > td')).map(td => (td as HTMLElement).innerText)));
    return raw
      .filter(cells => cells.length === heads.length)
      .map(cells => Object.fromEntries(heads.map((h, i) => [h, this.clean(cells[i] ?? '')])));
  }

  /** The row whose Transaction Ref. No. cell starts with `ref`. */
  async rowByRef(ref: string, refHeader = 'Transaction Ref. No.'): Promise<{ row: ListingRow; index: number } | null> {
    const rows = await this.rows();
    const index = rows.findIndex(r => (r[refHeader] ?? '').startsWith(ref));
    return index < 0 ? null : { row: rows[index], index };
  }

  /** Green highlight on one cell before it is read and asserted. */
  async highlightCell(rowIndex: number, header: string): Promise<void> {
    const col = (await this.headers()).indexOf(header);
    if (col < 0) return;
    const rows = this.table().locator('tbody tr').filter({ has: this.page.locator('td:nth-child(3)') });
    await this.demoHighlight(rows.nth(rowIndex).locator(':scope > td').nth(col), { color: 'green' });
  }

  /** Runs a bulk scan with demo highlighting off (finder loops). */
  async quietly<T>(fn: () => Promise<T>): Promise<T> { return this.suppressDemo(fn); }

  // ── Paging (ngb-pagination + page-size select under the table) ──
  // Seen on Transaction Management 2026-10-16: 20 per page by default,
  // options 20/40/60/80/100, newest transaction first.
  private pager(): Locator { return this.page.locator('main .card ngb-pagination'); }

  /** Chooses "<n> items per page" in the page-size dropdown. */
  async choosePageSize(n: number): Promise<void> {
    const sel = this.page.locator('main .card select.custom-select');
    if (!(await sel.count())) return;
    await this.demoHighlight(sel);
    await this.afterChange(() => sel.selectOption({ label: `${n} items per page` }));
  }

  /** Ticks one Platform in the ng-select filter (e.g. "Secarang") and clicks
   *  Search. Exact option text, so "Secarang" does not also tick "Secarang-MK". */
  async choosePlatform(name: string): Promise<void> {
    const sel = this.page.locator('main ng-select[formcontrolname="platform"]');
    const box = sel.locator('.ng-select-container');
    await this.demoHighlight(box);
    await box.click();
    const opt = this.page.locator('ng-dropdown-panel .ng-option', { hasText: new RegExp(`^\\s*${name}\\s*$`) }).first();
    await opt.waitFor({ state: 'visible', timeout: 10_000 });
    await this.demoHighlight(opt);
    await opt.click();
    await this.page.keyboard.press('Escape');
    await this.afterChange(() => this.clickSearch());
  }

  /** Clicks » (next). False when already on the last page. */
  async nextPage(): Promise<boolean> { return this.clickPager(this.pager().locator('a[aria-label="Next"]')); }

  /** Clicks « (previous). False when already on the first page. */
  async previousPage(): Promise<boolean> { return this.clickPager(this.pager().locator('a[aria-label="Previous"]')); }

  /** Clicks the highest page number shown — the oldest transactions. */
  async lastPage(): Promise<boolean> {
    const links = this.pager().locator('li.page-item:not(.disabled) a.page-link');
    const texts = await links.allInnerTexts();
    let best = -1, bestN = 0;
    texts.forEach((t, i) => { const n = Number(t.replace(/\D/g, '')); if (/^\s*\d+/.test(t) && n > bestN) { bestN = n; best = i; } });
    if (best < 0) return false;
    const active = Number((await this.pager().locator('li.page-item.active').innerText().catch(() => '')).replace(/\D/g, ''));
    if (active === bestN) return true;
    return this.clickPager(links.nth(best));
  }

  private async clickPager(link: Locator): Promise<boolean> {
    if (!(await link.count())) return false;
    const li = link.locator('xpath=ancestor::li[1]');
    if (((await li.getAttribute('class')) ?? '').includes('disabled')) return false;
    await this.demoHighlight(link);
    await this.afterChange(() => link.click());
    return true;
  }

  /** Runs `act`, then waits for the rows to change and finish loading. */
  private async afterChange(act: () => Promise<unknown>): Promise<void> {
    const firstRow = async () => (await this.table().locator('tbody tr').first().innerText().catch(() => ''));
    const before = await firstRow();
    await act();
    await this.poll(async () => (await firstRow()) !== before, 15_000, 300);
    await this.waitForListing();
  }

  /** Clicks Export, keeps the file as evidence, returns its text. */
  async exportAsText(label: string): Promise<{ text: string; filename: string }> {
    const btn = this.exportBtn();
    await expect(btn).toBeEnabled({ timeout: this.loadTimeout });
    await this.demoHighlight(btn);
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: CIBO.exportTimeout }),
      btn.click(),
    ]);
    await this.saveDownloadAsEvidence(download, label);
    return { text: await readDownload(download), filename: download.suggestedFilename() };
  }
}

async function readDownload(download: Download): Promise<string> {
  const tmp = path.join(os.tmpdir(), `cibo-${Date.now()}-${download.suggestedFilename()}`);
  try {
    await download.saveAs(tmp);
    return fs.readFileSync(tmp, 'utf8').replace(/^﻿/, '');
  } finally {
    fs.rmSync(tmp, { force: true });
  }
}

/**
 * CIBO CSV export → header + rows. Shape seen 2026-10-16 (Transaction
 * Management): line 1 = report title, line 2 blank, line 3 = header, then
 * one quoted row per transaction. The header row is found by `mustHave`
 * rather than a fixed line number.
 */
export function parseCiboCsv(text: string, mustHave: string): { header: string[]; rows: Record<string, string>[] } {
  const lines = parseCsv(text);
  const hi = lines.findIndex(l => l.includes(mustHave));
  if (hi < 0) throw new Error(`Export has no header row containing "${mustHave}"`);
  const header = lines[hi].map(h => h.trim());
  const rows = lines.slice(hi + 1)
    .filter(l => l.some(c => c.trim()))
    .map(l => Object.fromEntries(header.map((h, i) => [h, (l[i] ?? '').trim()])));
  return { header, rows };
}

function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') q = false;
      else cell += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell); out.push(row); row = []; cell = ''; }
    else if (ch !== '\r') cell += ch;
  }
  if (cell || row.length) { row.push(cell); out.push(row); }
  return out;
}

/** Payment Management — adds the Payment Channel ng-select. */
export class CiboPaymentManagementPage extends CiboListingPage {
  private channelSelect(): Locator { return this.page.locator('ng-select[formcontrolname="selectedBank"]'); }
  private panel(): Locator { return this.page.locator('ng-dropdown-panel'); }

  async openChannelFilter(): Promise<void> {
    if (await this.panel().isVisible().catch(() => false)) return;
    const sel = this.channelSelect().locator('.ng-select-container');
    await this.demoHighlight(sel);
    await sel.click();
    await this.panel().waitFor({ state: 'visible' });
  }

  async closeChannelFilter(): Promise<void> {
    if (await this.panel().isVisible().catch(() => false)) await this.page.keyboard.press('Escape');
  }

  /** The group header row, e.g. "Fiuu - eWallet". */
  group(name: string): Locator {
    return this.panel().locator('.ng-optgroup').filter({ hasText: new RegExp(`^\\s*${escapeRe(name)}\\s*$`) });
  }

  /** Options are flat siblings after their group header — pick the one whose
   *  nearest preceding group header is `group`. */
  option(group: string, label: string): Locator {
    return this.panel().locator(
      `xpath=.//div[contains(@class,"ng-option-child")][normalize-space()="${label}"]` +
      `[preceding-sibling::div[contains(@class,"ng-optgroup")][1][normalize-space()="${group}"]]`);
  }

  /** Every option label listed under `group`. */
  async optionsUnder(group: string): Promise<string[]> {
    return this.panel().locator('.ng-optgroup, .ng-option').evaluateAll((els, g) => {
      const out: string[] = []; let inGroup = false;
      for (const el of els) {
        const t = (el as HTMLElement).innerText.trim();
        if (el.classList.contains('ng-optgroup')) inGroup = t === g;
        else if (inGroup) out.push(t);
      }
      return out;
    }, group);
  }

  /**
   * Screenshot of the Payment Channel box and its open dropdown only. The
   * listing behind it still shows the previous search until [Search] is
   * clicked, so a full-page shot taken here looked unfiltered (Faizuddin,
   * 2026-10-20: "it didnt not apply the filters before screenshooting").
   */
  async captureFilter(label: string): Promise<void> {
    const dir = process.env.PW_EVIDENCE_DIR;
    if (!dir) return;
    try {
      const boxes = [await this.channelSelect().boundingBox(), await this.panel().boundingBox().catch(() => null)].filter(Boolean) as { x: number; y: number; width: number; height: number }[];
      if (!boxes.length) return;
      const x = Math.max(0, Math.min(...boxes.map(b => b.x)) - 8), y = Math.max(0, Math.min(...boxes.map(b => b.y)) - 8);
      const clip = { x, y, width: Math.max(...boxes.map(b => b.x + b.width)) + 8 - x, height: Math.max(...boxes.map(b => b.y + b.height)) + 8 - y };
      fs.mkdirSync(dir, { recursive: true });
      await this.page.screenshot({ path: path.join(dir, `${label.replace(/[^\w.-]+/g, '_')}.png`), clip });
    } catch {
      // Evidence capture is best-effort — never fail a test over it.
    }
  }

  async isTicked(target: Locator): Promise<boolean> {
    return (await target.getAttribute('aria-selected')) === 'true';
  }

  async click(target: Locator): Promise<void> {
    await target.scrollIntoViewIfNeeded();
    await this.demoHighlight(target);
    await target.click();
  }
}

/** Payment Report — same listing contract, longer load ceiling. */
export class CiboPaymentReportPage extends CiboListingPage {
  constructor(page: Page) { super(page, CIBO.paymentReportTimeout); }

  /**
   * Sets "Insurance Created From" and "Insurance Created Till" by picking the
   * days in the calendar (both inputs are readonly ngbDatepicker). Calendar
   * captured 2026-10-19 (_reference/html/cibo/payment-report-datepicker-open.html):
   * select "Select month" (1-12), select "Select year", day cells
   * .ngb-dp-day[aria-label="Monday, October 19, 2026"].
   */
  async setInsuranceCreatedRange(from: Date, till: Date): Promise<void> {
    // The calendars limit each other: with Till already on 9 Aug, the From
    // calendar would not take September (live 2026-10-19). Moving the window
    // later, set Till first; otherwise From first.
    const m = /(\d{1,2})\D(\d{1,2})\D(\d{4})/.exec(await this.page.locator('main input[formcontrolname="toDate"]').inputValue().catch(() => ''));
    const currentTill = m ? new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1])) : null;
    if (currentTill && from > currentTill) {
      await this.pickDate('toDate', till);
      await this.pickDate('fromDate', from);
    } else {
      await this.pickDate('fromDate', from);
      await this.pickDate('toDate', till);
    }
  }

  private async pickDate(control: 'fromDate' | 'toDate', d: Date): Promise<void> {
    const input = this.page.locator(`main input[formcontrolname="${control}"]`);
    await this.demoHighlight(input);
    await input.click();
    const dp = this.page.locator('ngb-datepicker').first();
    await dp.waitFor({ state: 'visible', timeout: 15_000 });
    await dp.locator('select[title="Select year"]').selectOption(String(d.getFullYear()));
    await dp.locator('select[title="Select month"]').selectOption(String(d.getMonth() + 1));
    const label = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    const day = dp.locator(`.ngb-dp-day[aria-label="${label}"]`).first();
    await this.demoHighlight(day);
    await day.click();
    await dp.waitFor({ state: 'hidden', timeout: 10_000 }).catch(() => {});
  }
}

/**
 * Transaction Management > Transaction Details, opened by clicking the
 * Transaction Ref. No. link on the listing. Captured 2026-10-20
 * (_reference/html/cibo/transaction-details.html): every field is a label
 * element followed by its value element ("Payment Method" → "Fiuu eWallet -
 * GrabPay" + a "Paid" badge, "Payment Ref ID", "Total Premium" → "RM1,052.55").
 */
export class CiboTransactionDetailsPage extends BasePage {
  /** Clicks the ref's link on the listing rows shown and waits for the page. */
  async openFromListing(ref: string): Promise<void> {
    const link = this.page.locator('main .card table a', { hasText: ref }).first();
    await this.demoHighlight(link);
    await link.click();
    await this.page.waitForURL(/transaction-details/, { timeout: CIBO.listingTimeout });
    await this.page.locator('main', { hasText: 'Payment Details' }).waitFor({ state: 'visible', timeout: CIBO.listingTimeout });
  }

  /** The value element next to a label, e.g. value('Payment Method'). */
  value(label: string): Locator {
    return this.page.locator(`xpath=(//main//*[normalize-space(.)="${label}"][following-sibling::*])[1]/following-sibling::*[1]`);
  }

  async read(label: string): Promise<string> {
    return this.clean(await this.value(label).innerText({ timeout: 10_000 }).catch(() => ''));
  }

  /** Status badge in the header, e.g. "Insurance created". */
  async status(): Promise<string> {
    return this.clean(await this.page.locator('main .badge').first().innerText().catch(() => ''));
  }
}

function escapeRe(s: string): string { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
