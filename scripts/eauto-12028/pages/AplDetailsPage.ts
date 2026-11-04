import { Download, Locator, Page, expect } from '@playwright/test';
import { AplBase } from './AplBase';
import { CONFIG } from '../data/config';
import { readTable, colOf, cellText, cellLocator, rowLocator, TableData, TableRow, norm } from '../utils/table';
import { pickDatepickerDate } from '../utils/datepicker';
import { ddmmyyyy, parseWhen, whenDay, DATE_RE } from '../utils/format';
import { PENDING_NOTE } from '../data/expected';
import { watchDialogs, takeDialogs, peekDialogs } from '../utils/dialogs';

// Association Payment Listing — Details page (one month) and its popups.
// Live capture (staging uat1, 2026-11-02, Approver login, September 2026 all Pending, not its turn):
//   DETAILS = _reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-not-turn.html
// Confirmed there: #det-title, the "← Back to Summary" link, #wf-bar with #pill-drafter /
// #pill-reviewer / #pill-approver, #wf-not-your-turn, .wf-note, #pdf-bar and its pending note,
// #tbl-veh, #tbl-log, and the #rmk-modal / #date-modal / #sig-modal popups.
// Still [unconfirmed] (not rendered in that capture): the role buttons Approve / KIV / Reject
// and the FMC / MMSDA download controls — names from the 31.07 mock-up
// (_reference/tickets/Studying/EAINT-12028/association-payment-listing-mockup_20260731.html lines 472-486, 513-514).

export type Status = { drafter: string; reviewer: string; approver: string };
export type Role = 'Drafter' | 'Reviewer' | 'Approver';

export class AplDetailsPage extends AplBase {
  // 2026-11-03 build — DETAILS2 = _reference/html/eauto/bo-association-payment-listing-details-jan-2026-drafter-turn-2026-11-03.html
  // (Drafter login, January 2026, Drafter's turn). The old ids (#det-title, #wf-bar, #pill-*) are kept as fallbacks.
  // DETAILS2 lines 79-81 `<div class="page-title"><span class="app-title">Association Payment Listing — January 2026</span>`
  title = () => this.page.locator('#det-title, .page-title .app-title');
  // DETAILS2 lines 104-106 `<a class="ap-summary" id="ap-summary" href="/backoffice/admin/association?year=2026">… Summary</a>`
  // (was DETAILS line 91 "← Back to Summary")
  backBtn = () => this.page.locator('#ap-summary').or(this.page.getByRole('link', { name: /Back to Summary/ }));
  // DETAILS2 line 102 `<div class="ap" id="action-panel">` — chips, the role's buttons and the note (was DETAILS line 99 #wf-bar)
  wfBar = () => this.page.locator('#action-panel, #wf-bar');
  // DETAILS2 lines 151-159 `<div class="ap-note …" id="ap-note" role="status"> … <span class="ap-note-text">Your turn as Drafter. …</span>`
  // (was DETAILS lines 128-133 `.wf-note`)
  note = () => this.page.locator('#ap-note .ap-note-text, #wf-bar .wf-note');
  // DETAILS line 126 `#wf-not-your-turn`. [unconfirmed] not in DETAILS2 (a Drafter on its own turn); the new build may say it in #ap-note instead.
  notYourTurn = () => this.page.locator('#wf-not-your-turn');
  // DETAILS2 lines 111-126 `<span class="ap-chip …" id="chip-drafter"> … <span class="ap-chip-status st-pending"><span>Pending · your turn</span>`
  // (was DETAILS lines 102-106 `#pill-drafter` "Pending")
  pill = (role: Role) => this.page.locator(`#chip-${role.toLowerCase()} .ap-chip-status, #pill-${role.toLowerCase()}`);
  // DETAILS2 lines 131 / 141 `<button class="ap-btn ap-btn-kiv" id="btn-drafter-kiv">KIV</button>`,
  // `<button class="ap-btn ap-btn-approve" id="btn-drafter-approve">Approve</button>`, inside #action-panel.
  // Only the buttons of the role whose turn it is are rendered. Reject: [unconfirmed] not in DETAILS2 (Drafter has none).
  approveBtn = () => this.wfBar().getByRole('button', { name: 'Approve', exact: true });
  kivBtn = () => this.wfBar().getByRole('button', { name: 'KIV', exact: true });
  rejectBtn = () => this.wfBar().getByRole('button', { name: 'Reject', exact: true });
  // from DETAILS line 138 `<div class="wf-bar" id="pdf-bar">` (the mock-up's #inv-bar)
  invBar = () => this.page.locator('#pdf-bar');
  // [unconfirmed] mock-up lines 513-514 names; DETAILS lines 53-54 say the PDF controls are anchor
  // buttons (`.btn` links), so both a link and a button are accepted, inside #pdf-bar only.
  fmcBtn = () => this.invBar().locator('a, button', { hasText: /^\s*FMC Payment Request\s*$/ });
  mmsdaBtn = () => this.invBar().locator('a, button', { hasText: /^\s*MMSDA Payment Request\s*$/ });
  // PENDING_NOTE = SRD v1.1 REQ-016 Example 2 wording, kept on purpose (Faizuddin is checking DETAILS line 141's
  // "become available" vs the SRD's "will be available" with the SA, 2026-11-02).
  pendingNote = () => this.invBar().getByText(PENDING_NOTE, { exact: true });
  // from DETAILS lines 147 / 295
  stateTable = () => this.page.locator('#tbl-veh');
  logTable = () => this.page.locator('#tbl-log');

  // Signature popup — from DETAILS lines 343-352
  sigModal = () => this.page.locator('#sig-modal');
  sigTitle = () => this.sigModal().getByText(/^Sign to Approve/);
  sigPad = () => this.page.locator('#sig-pad');
  sigClear = () => this.sigModal().getByRole('button', { name: 'Clear', exact: true });
  sigCancel = () => this.sigModal().getByRole('button', { name: 'Cancel', exact: true });
  sigSave = () => this.sigModal().getByRole('button', { name: 'Save & Approve', exact: true });

  // Reject popup — from DETAILS lines 322-330 (#rmk-submit starts disabled; enabled once remarks are typed, script line 386-387)
  rmkModal = () => this.page.locator('#rmk-modal');
  rmkText = () => this.page.locator('#rmk-text');
  rmkSubmit = () => this.page.locator('#rmk-submit');
  rmkCancel = () => this.rmkModal().getByRole('button', { name: 'Cancel', exact: true });

  // Payment date popup — from DETAILS lines 332-341 (min = local tomorrow, script lines 395-399)
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
    if (!ok) {
      await this.captureIssue('details-not-shown', this.page.locator('main, body').first(), 'No state table (#tbl-veh) / action panel (#action-panel) on this page');
      throw new Error(`The Details page did not open (no state table #tbl-veh / action panel #action-panel) at ${this.page.url()}.`);
    }
    const title = norm((await this.title().allInnerTexts().catch(() => [] as string[])).join(' '));
    if (!title.includes(`${month} ${year}`)) {
      await this.captureIssue('details-wrong-month', this.title(), `Title "${title}" is not ${month} ${year}`);
      throw new Error(`Details title is "${title}", not ${month} ${year}.`);
    }
  }

  // ── Statuses ──────────────────────────────────────────────

  /**
   * The three statuses — read from the chips #chip-drafter / -reviewer / -approver (DETAILS2 lines 111-126).
   * The chip of the role whose turn it is adds " · your turn" ("Pending · your turn", line 113): only the
   * status word before " · " is returned.
   */
  async statuses(): Promise<Status> {
    const read = async (role: Role) => {
      const p = this.pill(role);
      if (!(await p.count())) throw new Error(`No ${role} status (#chip-${role.toLowerCase()}) on the Details page (${this.page.url()}).`);
      return norm(await p.first().innerText()).split('·')[0].trim();
    };
    return { drafter: await read('Drafter'), reviewer: await read('Reviewer'), approver: await read('Approver') };
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

  /** Types into the open Reject popup (replacing what is there). */
  async typeRemarks(remarks: string): Promise<void> {
    if (!(await this.rmkModal().isVisible())) throw new Error('The Reject remarks popup is not open.');
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
    if (!(await b.count())) throw new Error('No [Summary] link (#ap-summary) on the Details page.');
    await this.demoHighlight(b.first());
    await b.first().click();
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

  /** Live Audit Log columns (DETAILS lines 301-304): When, Actor, Role, Action, Payment Date, Remarks. */
  static readonly LOG_COLUMNS = ['When', 'Actor', 'Role', 'Action', 'Payment Date', 'Remarks'];
  /** Columns the TS expects (12028_TS48: "Date/Time, Role, Action/Status, Remarks"; Payment Date: SRD REQ-015 Example 5 puts the Approver's payment date on the log).
   *  Faizuddin, 2026-11-02: follow the expected results; only the Actor column is overlooked. */
  static readonly LOG_COLUMNS_EXPECTED = ['Date/Time', 'Role', 'Action/Status', 'Payment Date', 'Remarks'];

  private static readonly LOG_COL = {
    when: /^(when|date\s*\/?\s*time)$/i,
    role: /^role$/i,
    action: /^action(\s*\/\s*status)?$/i,
    paymentDate: /^payment date$/i,
    remarks: /^remarks$/i,
  };

  /** One row of the Audit Log. "Role — Action" is built from the Role and Action cells, as shown. The empty-state row has one cell and is skipped. */
  logEntries(data: TableData): { entry: string; role: string; action: string; time: string; remarks: string; paymentDate: string; row: TableRow }[] {
    const C = AplDetailsPage.LOG_COL;
    const get = (row: TableRow, re: RegExp) => (data.headers.some(h => re.test(h.trim())) ? cellText(data, row, re) : '');
    return data.rows
      .filter(r => Object.keys(r.byCol).length > 1)
      .map(row => {
        const action = get(row, C.action);
        const role = get(row, C.role);
        return {
          entry: role ? `${role} — ${action}` : action,
          role, action,
          time: get(row, C.when),
          remarks: get(row, C.remarks),
          paymentDate: get(row, C.paymentDate),
          row,
        };
      });
  }

  /** Finds a row by role and action, whatever the letter case or tense ("Drafter — Approved" or "DRAFTER — APPROVE"); the exact words are checked by checkLogRowFormat().
   *  Expected words: SRD v1.1 REQ-015 "Drafter — Approved", "Drafter — KIV", "Reviewer — Rejected (returned to Drafter)". */
  static entryRe(role: Role, action: 'Approved' | 'KIV' | 'Rejected'): RegExp {
    const a = action === 'Approved' ? 'Approve[ds]?\\b' : action === 'KIV' ? 'KIV\\s*$' : 'Reject(ed)?\\b';
    return new RegExp(`^${role}\\s*[—–-]\\s*${a}`, 'i');
  }

  /** True when the page lists the newest row first (live), false when oldest first (SA mock-up). Read from the times, so row order never decides a pass or fail by accident. */
  static listedNewestFirst(entries: { time: string }[]): boolean {
    const t = entries.map(e => parseWhen(e.time)).filter(x => !Number.isNaN(x));
    if (t.length < 2) return true;
    if (t[0] === t[t.length - 1]) return true;
    return t[0] > t[t.length - 1];
  }

  /** The rows oldest → newest, whichever way the page lists them. */
  static chronological<T extends { time: string }>(entries: T[]): T[] {
    return AplDetailsPage.listedNewestFirst(entries) ? [...entries].reverse() : [...entries];
  }

  /** Rows of one role + action, oldest → newest (the last one is the newest). */
  static matching<T extends { entry: string; time: string }>(entries: T[], role: Role, action: 'Approved' | 'KIV' | 'Rejected'): T[] {
    const re = AplDetailsPage.entryRe(role, action);
    return AplDetailsPage.chronological(entries).filter(e => re.test(e.entry));
  }

  async logCount(role: Role, action: 'Approved' | 'KIV' | 'Rejected'): Promise<number> {
    return AplDetailsPage.matching(this.logEntries(await this.readLog()), role, action).length;
  }

  logRowAt(row: TableRow): Locator { return rowLocator(this.logTable(), row); }
  logCell(data: TableData, row: TableRow, header: string): Locator { return cellLocator(this.logTable(), data, row, header); }

  /** One format mismatch: red box on the cell, a plain line in the run log, and a soft failure (the TS carries on, then fails at the end). */
  private async logMismatch(label: string, target: Locator, what: string, shown: string, expected: string | RegExp, expectedText: string): Promise<void> {
    const ok = typeof expected === 'string' ? shown === expected : expected.test(shown);
    if (ok) return;
    const msg = `${what}: shows "${shown}", expected ${expectedText}`;
    console.log(`DETAIL:${JSON.stringify({ label: 'Does not follow the expected result', value: msg })}`);
    await this.captureIssue(label, target, msg.slice(0, 200));
    expect.soft(false, msg).toBe(true);
  }

  /**
   * The words and shapes of one Audit Log row, against the expected results (SA mock-up lines 329 and 548; TS 12028_TS20/TS21: "Drafter — Approved", "Drafter — KIV"):
   * Role "Drafter" (not "DRAFTER"), Action "Approved (signed)" / "KIV" / "Rejected — returned to <role>" (not "APPROVE"),
   * When "DD-MM-YYYY HH:mm" (not "02 Nov 2026 15:36"). Empty Remarks / Payment Date are not checked (dropped 2026-11-03).
   * The Actor column and the Pending / Approved status words are NOT held to the mock-up (Faizuddin, 2026-11-02: the mock-up is wrong for those only). Every mismatch is named in plain words.
   */
  async checkLogRowFormat(data: TableData, e: { role: string; action: string; time: string; remarks: string; paymentDate: string; row: TableRow }, role: Role, action: 'Approved' | 'KIV' | 'Rejected', opts: { remarksTyped?: boolean } = {}): Promise<void> {
    const C = AplDetailsPage.LOG_COL;
    const who = `Audit Log row "${role} — ${action}"`;
    const cell = (re: RegExp) => {
      const h = data.headers.find(x => re.test(x.trim()));
      return h ? this.logCell(data, e.row, h) : this.logRowAt(e.row);
    };
    const key = `log-${role}-${action}`.toLowerCase();
    await this.logMismatch(`${key}-role`, cell(C.role), `${who}, Role`, e.role, role, `"${role}"`);
    // Approved: "Approved (signed)" (SA mock-up lines 519-523; Faizuddin, dashboard chat 2026-11-02).
    const wantAction = action === 'Rejected' ? `Rejected — returned to ${role === 'Reviewer' ? 'Drafter' : 'Reviewer'}` : action === 'Approved' ? 'Approved (signed)' : action;
    await this.logMismatch(`${key}-action`, cell(C.action), `${who}, Action`, e.action, wantAction, `"${wantAction}"`);
    await this.logMismatch(`${key}-when`, cell(C.when), `${who}, When`, e.time, /^\d{2}-\d{2}-\d{4} \d{2}:\d{2}$/, '"DD-MM-YYYY HH:mm" (e.g. "02-11-2026 15:36")');
    // Empty Payment Date / Remarks cells are not checked for "-" (Faizuddin, dashboard chat 2026-11-03: "drop those for now").
    if (role === 'Approver' && action === 'Approved') {
      await this.logMismatch(`${key}-payment-date`, cell(C.paymentDate), `${who}, Payment Date`, e.paymentDate, DATE_RE, '"DD-MM-YYYY"');
    }
  }

  /** The Audit Log header row against the expected columns; the Actor column is left out of the comparison. */
  async checkLogColumns(data: TableData): Promise<void> {
    const shown = data.headers.map(h => h.trim()).filter(h => !/^actor$/i.test(h));
    const want = AplDetailsPage.LOG_COLUMNS_EXPECTED;
    const head = this.logTable().locator('tr').first();
    for (let i = 0; i < Math.max(shown.length, want.length); i++) {
      await this.logMismatch(`log-column-${i + 1}`, head, `Audit Log column ${i + 1} (Actor left out)`, shown[i] ?? '(no column)', want[i] ?? '(none)', `"${want[i] ?? '(no column)'}"`);
    }
  }

  /** Date (DD-MM-YYYY) of the newest "<role> — Approved" row, read from its When cell in either format. */
  async approvedDate(role: Role): Promise<string> {
    const rows = AplDetailsPage.matching(this.logEntries(await this.readLog()), role, 'Approved');
    const last = rows[rows.length - 1];
    const d = last ? whenDay(last.time) : null;
    if (!d) throw new Error(`No "${role} — Approved" row with a readable date in the Audit Log${last ? ` (When shows "${last.time}")` : ''}.`);
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
