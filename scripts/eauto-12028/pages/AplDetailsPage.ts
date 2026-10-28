import { Download, Locator, Page } from '@playwright/test';
import { AplBase } from './AplBase';
import { CONFIG } from '../data/config';
import { readTable, colOf, cellText, cellLocator, rowLocator, TableData, TableRow, norm } from '../utils/table';
import { pickDatepickerDate } from '../utils/datepicker';
import { ddmmyyyy } from '../utils/format';
import { PENDING_NOTE } from '../data/expected';
import { watchDialogs, takeDialogs, peekDialogs } from '../utils/dialogs';

// Association Payment Listing — Details page (one month) and its three popups.
// [unconfirmed] NOT captured live: every handle is the 31.07 mock-up's
// (_reference/tickets/Studying/EAINT-12028/association-payment-listing-mockup_20260731.html):
// title `#det-title` line 209, "← Back to Summary" line 211, workflow bar
// `#wf-bar` line 213 (statuses / buttons / note built at lines 468-503),
// download bar `#inv-bar` line 214 (lines 509-518), state table `#tbl-veh`
// line 218 (line 617), audit log `#tbl-log` line 222 (lines 544-552),
// Reject popup `#rmk-modal` lines 227-237, payment date popup `#date-modal`
// lines 240-251, signature popup `#sig-modal` lines 254-265.
// Capture the live Details page in each status, and each popup, to confirm.

export type Status = { drafter: string; reviewer: string; approver: string };
export type Role = 'Drafter' | 'Reviewer' | 'Approver';

export class AplDetailsPage extends AplBase {
  // mock-up line 209
  title = () => this.page.locator('#det-title');
  // mock-up line 211 `<button class="btn secondary" …>&#8592; Back to Summary</button>`
  backBtn = () => this.page.getByRole('button', { name: /Back to Summary/ });
  // mock-up line 213
  wfBar = () => this.page.locator('#wf-bar');
  // mock-up line 503 `<div class='wf-note'>`
  note = () => this.wfBar().locator('.wf-note');
  // mock-up lines 472-486 `<button class='abtn approve'>Approve</button>` / kiv / reject
  approveBtn = () => this.page.getByRole('button', { name: 'Approve', exact: true });
  kivBtn = () => this.page.getByRole('button', { name: 'KIV', exact: true });
  rejectBtn = () => this.page.getByRole('button', { name: 'Reject', exact: true });
  // mock-up line 214
  invBar = () => this.page.locator('#inv-bar');
  // mock-up lines 513-514
  fmcBtn = () => this.page.getByRole('button', { name: 'FMC Payment Request', exact: true });
  mmsdaBtn = () => this.page.getByRole('button', { name: 'MMSDA Payment Request', exact: true });
  // SRD v1.1 REQ-016 Example 2 wording (mock-up line 516 shows the same text)
  pendingNote = () => this.page.getByText(PENDING_NOTE, { exact: true });
  // mock-up line 218 / line 222
  stateTable = () => this.page.locator('#tbl-veh');
  logTable = () => this.page.locator('#tbl-log');

  // Signature popup — mock-up lines 254-265
  sigModal = () => this.page.locator('#sig-modal');
  sigTitle = () => this.sigModal().getByText(/^Sign to Approve/);
  sigPad = () => this.page.locator('#sig-pad');
  sigClear = () => this.sigModal().getByRole('button', { name: 'Clear', exact: true });
  sigCancel = () => this.sigModal().getByRole('button', { name: 'Cancel', exact: true });
  sigSave = () => this.sigModal().getByRole('button', { name: 'Save & Approve', exact: true });

  // Reject popup — mock-up lines 227-237
  rmkModal = () => this.page.locator('#rmk-modal');
  rmkText = () => this.page.locator('#rmk-text');
  rmkSubmit = () => this.rmkModal().getByRole('button', { name: 'Submit Reject', exact: true });
  rmkCancel = () => this.rmkModal().getByRole('button', { name: 'Cancel', exact: true });

  // Payment date popup — mock-up lines 240-251
  dateModal = () => this.page.locator('#date-modal');
  dateTitle = () => this.dateModal().getByText('Approve — Finance Payment Date', { exact: true });
  payDate = () => this.page.locator('#pay-date');
  dateConfirm = () => this.dateModal().getByRole('button', { name: 'Confirm Approve', exact: true });
  dateCancel = () => this.dateModal().getByRole('button', { name: 'Cancel', exact: true });

  constructor(page: Page) {
    super(page);
    watchDialogs(page);
  }

  /** Alerts / confirms the page raised since the last call (validation messages). */
  takeDialogs(): string[] { return takeDialogs(this.page); }
  private get dialogs(): string[] { return peekDialogs(this.page); }

  async expectOpenFor(month: string, year: number): Promise<void> {
    const ok = await this.waitForCondition(async () => (await this.stateTable().count()) > 0 && (await this.wfBar().count()) > 0);
    if (!ok) throw new Error(`The Details page did not open (no state table / workflow bar) at ${this.page.url()}.`);
    const title = norm(await this.title().innerText().catch(() => ''));
    if (!title.includes(`${month} ${year}`)) throw new Error(`Details title is "${title}", not ${month} ${year}.`);
  }

  // ── Statuses ──────────────────────────────────────────────

  /** "Drafter Status: Approved" etc. from the workflow bar (mock-up lines 498-500). */
  async statuses(): Promise<Status> {
    const text = norm(await this.wfBar().innerText());
    const pick = (role: Role) => text.match(new RegExp(`${role} Status:?\\s*(Pending|Approved|KIV|Review Again)`))?.[1];
    const s = { drafter: pick('Drafter'), reviewer: pick('Reviewer'), approver: pick('Approver') };
    if (!s.drafter || !s.reviewer || !s.approver) throw new Error(`Cannot read the three statuses from the workflow bar: "${text.slice(0, 200)}".`);
    return s as Status;
  }

  /** Waits until a status shows the expected word (lesson 14: confirm every submit by the page's own words). */
  async waitForStatus(role: Role, value: string): Promise<boolean> {
    return this.waitForCondition(async () => {
      try { return (await this.statuses())[role.toLowerCase() as keyof Status] === value; } catch { return false; }
    }, CONFIG.maxWaitForResult);
  }

  // ── Actions ───────────────────────────────────────────────

  private async click(btn: Locator, name: string): Promise<void> {
    if (!(await btn.count())) throw new Error(`No [${name}] button on the Details page (${this.page.url()}).`);
    if (!(await btn.first().isEnabled())) throw new Error(`[${name}] is disabled on the Details page.`);
    await this.dismissBanners();
    await this.demoHighlight(btn.first());
    await btn.first().click();
  }

  async clickApprove(): Promise<void> { await this.click(this.approveBtn(), 'Approve'); }
  async clickKiv(): Promise<void> { await this.click(this.kivBtn(), 'KIV'); }
  async clickReject(): Promise<void> { await this.click(this.rejectBtn(), 'Reject'); }

  /** Is a popup on screen within `ms`? (a short wait — the absent case must not cost the action timeout) */
  async shownWithin(target: Locator, ms = CONFIG.absentWait): Promise<boolean> {
    return target.waitFor({ state: 'visible', timeout: ms }).then(() => true, () => false);
  }

  /** Draws a signature on the pad with the mouse, as a person does. */
  async drawSignature(): Promise<void> {
    const pad = this.sigPad();
    const box = await pad.boundingBox();
    if (!box) throw new Error('The signature pad (#sig-pad) has no size on screen.');
    await this.demoHighlight(pad);
    const m = this.page.mouse;
    await m.move(box.x + box.width * 0.15, box.y + box.height * 0.6);
    await m.down();
    for (let i = 1; i <= 12; i++) {
      await m.move(box.x + box.width * (0.15 + i * 0.055), box.y + box.height * (0.6 - Math.sin(i / 2) * 0.25), { steps: 3 });
    }
    await m.up();
  }

  async padPicture(): Promise<Buffer> {
    return this.sigPad().screenshot();
  }

  /** Signs when the pad shows and presses Save & Approve. Returns whether the pad was shown. */
  async signIfAsked(): Promise<boolean> {
    if (!(await this.shownWithin(this.sigModal()))) return false;
    await this.drawSignature();
    await this.demoHighlight(this.sigSave());
    await this.sigSave().click();
    const closed = await this.sigModal().waitFor({ state: 'hidden', timeout: CONFIG.maxWaitForResult }).then(() => true, () => false);
    if (!closed) throw new Error(`The signature popup stayed open after [Save & Approve]${this.dialogs.length ? ` (message: "${this.dialogs.join('; ')}")` : ''}.`);
    return true;
  }

  async cancelSignature(): Promise<void> {
    await this.demoHighlight(this.sigCancel());
    await this.sigCancel().click();
    await this.sigModal().waitFor({ state: 'hidden', timeout: CONFIG.maxWaitForResult });
  }

  /** Drafter / Reviewer approve: [Approve] → sign if asked → confirm the status changed. */
  async approve(role: 'Drafter' | 'Reviewer'): Promise<{ padShown: boolean }> {
    await this.clickApprove();
    const padShown = await this.signIfAsked();
    if (!(await this.waitForStatus(role, 'Approved'))) {
      const s = await this.statuses().catch(() => null);
      throw new Error(`${role} Status did not change to Approved after [Approve] (shows ${s ? `${s.drafter}/${s.reviewer}/${s.approver}` : 'unreadable'})${this.dialogs.length ? `; message: "${this.dialogs.join('; ')}"` : ''}.`);
    }
    return { padShown };
  }

  /** Approver approve up to the payment date popup (signing if asked). */
  async approverOpenDatePopup(): Promise<{ padShown: boolean }> {
    await this.clickApprove();
    const padShown = await this.signIfAsked();
    if (!(await this.shownWithin(this.dateModal(), CONFIG.maxWaitForResult))) throw new Error('The "Approve — Finance Payment Date" popup did not open after [Approve].');
    return { padShown };
  }

  /**
   * Picks a date the way a person does. A jQuery UI datepicker (the eAuto
   * convention) is clicked open and the day clicked (utils/datepicker.ts,
   * copied from scripts/eauto-jomcheck). The mock-up's field is a native
   * `<input type="date">` (line 244) whose calendar is not part of the page,
   * so it cannot be clicked: then the date is entered with fill(), the only
   * way Playwright can drive a native date field [unconfirmed — capture the
   * live popup; see the final-message question on native date pickers].
   */
  async choosePayDate(date: Date): Promise<string> {
    const input = this.payDate();
    if (!(await input.count())) throw new Error('No payment date field (#pay-date) in the popup.');
    const native = (await input.getAttribute('type')) === 'date';
    if (!native) return pickDatepickerDate(this.page, input, date);
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    await this.demoHighlight(input);
    await input.fill(iso);
    return input.inputValue();
  }

  async confirmApprove(): Promise<void> {
    await this.demoHighlight(this.dateConfirm());
    await this.dateConfirm().click();
  }

  async cancelDatePopup(): Promise<void> {
    await this.demoHighlight(this.dateCancel());
    await this.dateCancel().click();
    await this.dateModal().waitFor({ state: 'hidden', timeout: CONFIG.maxWaitForResult });
  }

  /** Approver: [Approve] → sign if asked → pick `date` → [Confirm Approve] → status Approved. */
  async approverApprove(date: Date): Promise<{ padShown: boolean; picked: string }> {
    const { padShown } = await this.approverOpenDatePopup();
    const picked = await this.choosePayDate(date);
    await this.confirmApprove();
    if (!(await this.waitForStatus('Approver', 'Approved'))) {
      throw new Error(`Approver Status did not change to Approved after [Confirm Approve] with ${ddmmyyyy(date)}${this.dialogs.length ? ` (message: "${this.dialogs.join('; ')}")` : ''}.`);
    }
    return { padShown, picked };
  }

  async kiv(): Promise<void> {
    await this.clickKiv();
    if (await this.shownWithin(this.page.locator('.ui-dialog:visible .confirm-dialog-btn'), 2_000)) await this.acceptConfirmDialog();
    if (!(await this.waitForStatus('Drafter', 'KIV'))) throw new Error('Drafter Status did not change to KIV after [KIV].');
  }

  /** Opens the Reject popup and types `remarks` (may be blank / spaces). */
  async openRejectAndType(remarks: string): Promise<void> {
    await this.clickReject();
    if (!(await this.shownWithin(this.rmkModal(), CONFIG.maxWaitForResult))) throw new Error('The Reject remarks popup did not open after [Reject].');
    await this.demoHighlight(this.rmkText());
    await this.rmkText().fill(remarks);
  }

  async submitReject(): Promise<void> {
    await this.demoHighlight(this.rmkSubmit());
    await this.rmkSubmit().click();
  }

  async cancelReject(): Promise<void> {
    await this.demoHighlight(this.rmkCancel());
    await this.rmkCancel().click();
    await this.rmkModal().waitFor({ state: 'hidden', timeout: CONFIG.maxWaitForResult });
  }

  /** Reject with remarks; confirms the role it returns to shows "Review Again". */
  async reject(by: 'Reviewer' | 'Approver', remarks: string): Promise<void> {
    await this.openRejectAndType(remarks);
    await this.submitReject();
    const back: Role = by === 'Reviewer' ? 'Drafter' : 'Reviewer';
    if (!(await this.waitForStatus(back, 'Review Again'))) throw new Error(`${back} Status did not change to Review Again after ${by} [Submit Reject].`);
  }

  async bringToFront(): Promise<void> { await this.page.bringToFront(); }

  async reloadPage(): Promise<void> {
    await this.page.reload({ waitUntil: 'load', timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  async backToSummary(): Promise<void> {
    const b = this.backBtn();
    if (!(await b.count())) throw new Error('No [← Back to Summary] button on the Details page.');
    await this.demoHighlight(b);
    await b.click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }

  // ── State table ──────────────────────────────────────────

  async readStates(): Promise<TableData> {
    if (!(await this.stateTable().count())) throw new Error('No Vehicle Breakdown by State table (#tbl-veh).');
    return readTable(this.stateTable());
  }

  /** State column: mock-up header "PEN & E. MALAYSIA" (line 617). */
  stateCol = (data: TableData) => { try { return colOf(data, /PEN & E\. MALAYSIA|State/i); } catch { return 1; } };

  stateRows(data: TableData): { name: string; code: string; row: TableRow }[] {
    const c = this.stateCol(data);
    return data.rows
      .map(row => ({ name: row.byCol[c]?.text ?? '', row }))
      .map(r => ({ ...r, code: /\((\d{2})\)\s*$/.exec(r.name)?.[1] ?? '' }))
      .filter(r => r.code);
  }

  totalRow(data: TableData): TableRow {
    const row = data.rows.find(r => /^\s*TOTAL\b/i.test(r.text));
    if (!row) throw new Error('No TOTAL row in the Vehicle Breakdown by State table.');
    return row;
  }

  cell(data: TableData, row: TableRow, header: string | RegExp): string { return cellText(data, row, header); }
  stateCell(data: TableData, row: TableRow, header: string | RegExp): Locator { return cellLocator(this.stateTable(), data, row, header); }
  stateRowAt(row: TableRow): Locator { return rowLocator(this.stateTable(), row); }

  // ── Audit log ────────────────────────────────────────────

  async readLog(): Promise<TableData> {
    if (!(await this.logTable().count())) throw new Error('No Audit Log table (#tbl-log).');
    return readTable(this.logTable());
  }

  /** "Role — Action/Status" of each log row (works whether role and action are one cell or two). */
  logEntries(data: TableData): { entry: string; time: string; remarks: string; row: TableRow }[] {
    const has = (h: string) => data.headers.some(x => x.toLowerCase() === h.toLowerCase());
    return data.rows
      .filter(r => Object.keys(r.byCol).length > 1)
      .map(row => {
        const action = has('Action/Status') ? cellText(data, row, 'Action/Status') : '';
        const role = has('Role') ? cellText(data, row, 'Role') : '';
        return {
          entry: role ? `${role} — ${action}` : action,
          time: has('Date/Time') ? cellText(data, row, 'Date/Time') : '',
          remarks: has('Remarks') ? cellText(data, row, 'Remarks') : '',
          row,
        };
      });
  }

  /** SRD v1.1 REQ-015 log words: "Drafter — Approved", "Drafter — KIV", "Reviewer — Rejected (returned to Drafter)". */
  static entryRe(role: Role, action: 'Approved' | 'KIV' | 'Rejected'): RegExp {
    const a = action === 'Approved' ? 'Approved\\b' : action === 'KIV' ? 'KIV$' : `Rejected\\W+returned to ${role === 'Reviewer' ? 'Drafter' : 'Reviewer'}\\W*$`;
    return new RegExp(`^${role}\\s*[—–-]\\s*${a}`, 'i');
  }

  async logCount(role: Role, action: 'Approved' | 'KIV' | 'Rejected'): Promise<number> {
    const re = AplDetailsPage.entryRe(role, action);
    return this.logEntries(await this.readLog()).filter(e => re.test(e.entry)).length;
  }

  logRowAt(row: TableRow): Locator { return rowLocator(this.logTable(), row); }
  logCell(data: TableData, row: TableRow, header: string): Locator { return cellLocator(this.logTable(), data, row, header); }

  /** Date (DD-MM-YYYY) of the newest "<role> — Approved" row. */
  async approvedDate(role: Role): Promise<string> {
    const re = AplDetailsPage.entryRe(role, 'Approved');
    const rows = this.logEntries(await this.readLog()).filter(e => re.test(e.entry));
    const last = rows[rows.length - 1];
    const d = last?.time.match(/\d{2}-\d{2}-\d{4}/)?.[0];
    if (!d) throw new Error(`No "${role} — Approved" row with a DD-MM-YYYY date in the Audit Log.`);
    return d;
  }

  // ── Downloads ────────────────────────────────────────────

  /** Clicks a download button and returns the browser download (a person's click). */
  async download(btn: Locator, name: string): Promise<Download> {
    if (!(await btn.count())) throw new Error(`No [${name}] button on the Details page.`);
    await this.demoHighlight(btn);
    const [dl] = await Promise.all([
      this.page.waitForEvent('download', { timeout: CONFIG.downloadTimeout }),
      btn.click(),
    ]);
    return dl;
  }
}
