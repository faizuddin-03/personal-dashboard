import { Page, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BoHomePage } from '../pages/BoHomePage';
import { AplSummaryPage } from '../pages/AplSummaryPage';
import { AplDetailsPage, Status } from '../pages/AplDetailsPage';
import { CONFIG, monthInput, optional } from '../data/config';
import { getUser, roleLabel, RoleKey } from '../data/users';
import { TableData } from './table';
import { detail } from './format';

// One TS = one browser page and one recording. Roles are switched on the SAME
// page (log out, log in) so the whole TS lands in one video (scaffold skill §3),
// and each role logs in once per TS (automation lesson 4).

/** The month statuses the TS name (scenarios.md: "Month status words used in steps"). */
export type MonthState = 'Pending' | 'KIV' | 'DRA' | 'DA' | 'RRA' | 'RA' | 'Full';
export const MONTH_STATE: Record<MonthState, { label: string; s: Status }> = {
  Pending: { label: 'Pending (all three Pending)', s: { drafter: 'Pending', reviewer: 'Pending', approver: 'Pending' } },
  KIV: { label: 'KIV', s: { drafter: 'KIV', reviewer: 'Pending', approver: 'Pending' } },
  DRA: { label: 'Drafter Review Again', s: { drafter: 'Review Again', reviewer: 'Pending', approver: 'Pending' } },
  DA: { label: 'Drafter Approved (Reviewer Pending)', s: { drafter: 'Approved', reviewer: 'Pending', approver: 'Pending' } },
  RRA: { label: 'Reviewer Review Again', s: { drafter: 'Approved', reviewer: 'Review Again', approver: 'Pending' } },
  RA: { label: 'Reviewer Approved (Approver Pending)', s: { drafter: 'Approved', reviewer: 'Approved', approver: 'Pending' } },
  Full: { label: 'fully approved', s: { drafter: 'Approved', reviewer: 'Approved', approver: 'Approved' } },
};
/** What findMonth looks for: a workflow state, any closed month, or a custom test on the three statuses. */
export type MonthTarget = MonthState | 'Closed' | { label: string; test: (s: Status) => boolean };
export const sameStatus =(a: Status, b: Status) => a.drafter === b.drafter && a.reviewer === b.reviewer && a.approver === b.approver;
export const showStatus = (s: Status) => `Drafter ${s.drafter} / Reviewer ${s.reviewer} / Approver ${s.approver}`;

export class Session {
  readonly login: LoginPage;
  readonly home: BoHomePage;
  /** The page the module runs on (this page, or the tab the menu link opened). */
  apl: Page;
  current?: RoleKey;
  readonly names: Partial<Record<RoleKey, string>> = {};

  constructor(readonly page: Page, readonly ts: string) {
    this.login = new LoginPage(page);
    this.home = new BoHomePage(page);
    this.apl = page;
  }

  get summary(): AplSummaryPage { return new AplSummaryPage(this.apl); }
  get details(): AplDetailsPage { return new AplDetailsPage(this.apl); }

  /** Logs in as `role` (logging the previous role out first). Returns the header name. */
  async as(role: RoleKey): Promise<string> {
    if (this.current === role) return this.names[role]!;
    const user = getUser(role);
    if (this.current) {
      await test.step(`Log out ${roleLabel(this.current)}`, async () => {
        // The module is its own app under /backoffice with its own session ("invalidates THIS
        // session only", summary capture line 23): end it with its own Logout first, when the
        // module page is open, then end the BO core session.
        if (await this.summary.moduleLogoutBtn().count()) await this.summary.moduleLogout();
        await this.closeModuleTab();
        await this.login.logout();
      });
    }
    const name = await test.step(`Log in to BO as ${user.label} (${user.username})`, async () => this.login.login(user));
    this.current = role;
    this.names[role] = name;
    detail(`${user.label} (BO header)`, `${user.username} — ${name}`);
    // Lesson 21: evidence of who is logged in — the portal's own header.
    await this.login.captureEvidence(`${this.ts}-logged-in-${role}`, this.page.locator('#common-bar').first());
    return name;
  }

  async closeModuleTab(): Promise<void> {
    if (this.apl !== this.page && !this.apl.isClosed()) await this.apl.close();
    this.apl = this.page;
  }

  /** BO Home → Reports → Association Payment Listing → Summary shown. */
  async openListing(): Promise<AplSummaryPage> {
    return test.step('Open Reports → Association Payment Listing', async () => {
      await this.closeModuleTab();
      this.apl = await this.home.openListing();
      const s = this.summary;
      await s.expectShown();
      await this.expectModuleUser(s);
      return s;
    });
  }

  /**
   * The module header (span.who-name) must name the BO user logged in now. A /backoffice session
   * left from the previous role would still show the old name: then log the module out and open
   * the listing again once; still wrong → the TS stops naming both names.
   */
  private async expectModuleUser(s: AplSummaryPage): Promise<void> {
    const want = this.current ? this.names[this.current] : undefined;
    if (!want) return;
    const shown = async () => ((await s.whoName().count()) ? (await s.whoName().innerText()).trim() : '');
    let got = await shown();
    if (got && got !== want) {
      console.log(`   ↺ Module still signed in as "${got}" — logging the module out and reopening as "${want}".`);
      await s.moduleLogout();
      await this.closeModuleTab();
      this.apl = await this.home.openListing();
      await this.summary.expectShown();
      got = await shown();
    }
    // The 2026-11-03 build (summary capture bo-association-payment-listing-summary-2026-11-03.html,
    // lines 20-32) shows no name and no Logout in the module header (raised as EAINT-12752), so the
    // user cannot be checked here: say so and go on.
    if (!got) { console.log(`   ⚠️ The module header shows no user name (EAINT-12752) — cannot confirm the module is signed in as "${want}".`); return; }
    if (got !== want) throw new Error(`The module shows "${got}", but BO is logged in as "${want}" — the /backoffice session did not switch user.`);
    await this.summary.captureEvidence(`${this.ts}-module-user-${this.current}`, this.summary.whoName());
  }

  async search(year = CONFIG.year): Promise<TableData> {
    return test.step(`Select Year ${year} and click [Search]`, async () => this.summary.search(year));
  }

  /**
   * Finds the month this TS needs by reading the Summary (Faizuddin, dashboard chat 2026-11-03: "it will
   * automatically search of available month based on the status it is targetting, and choose that. if no
   * status that it wants is available, it will stop the automation but DOES NOT considered failed. will just
   * leave a note saying there are no available status for that TS").
   * Picks the first closed month (it has [View]) whose Drafter / Reviewer / Approver Status match `want`
   * ('Closed' = any closed month). None → a note in the run log and the TS is SKIPPED (not failed).
   * Leaves the Summary on screen with the returned `data`, so openMonth(month, data) clicks [View] straight away.
   */
  async findMonth(want: MonthTarget): Promise<{ month: string; data: TableData }> {
    const label = typeof want === 'string' ? (want === 'Closed' ? 'closed' : MONTH_STATE[want].label) : want.label;
    const match = (st: Status) => typeof want === 'string' ? (want === 'Closed' || sameStatus(st, MONTH_STATE[want].s)) : want.test(st);
    await this.openListing();
    const data = await this.search();
    const month = await test.step(`Find a ${label} month on the ${CONFIG.year} Summary`, async () => {
      const sm = this.summary;
      for (const { month: m, row } of sm.monthRows(data)) {
        if (!(await sm.viewLink(row).count())) continue; // not closed yet: no [View]
        const st = sm.monthStatus(data, m);
        if (match({ drafter: st.drafter, reviewer: st.reviewer, approver: st.approver })) {
          await sm.showValue(sm.rowAt(row));
          return m;
        }
      }
      return undefined;
    });
    if (!month) {
      const note = `No ${label} month available in ${CONFIG.year} for ${this.ts} — the TS was not run (not a failure). Move a month to ${label} (12028_PREP) or wait for one, then run it again.`;
      console.log(`DETAIL:${JSON.stringify({ label: 'No available month', value: note })}`);
      await this.summary.captureEvidence(`${this.ts}-no-${label.replace(/\W+/g, '-')}-month`, this.summary.table());
      test.skip(true, note);
    }
    console.log(`DETAIL:${JSON.stringify({ label: `Month picked (${label})`, value: `${month} ${CONFIG.year}` })}`);
    return { month: month!, data };
  }

  /**
   * The month typed on the TS row for `key`, or — when left blank — the first month the Summary shows
   * in `want` (findMonth). Returns `data` only when it searched, so openMonth can reuse the Summary.
   */
  async monthFor(key: string, want: MonthTarget): Promise<{ month: string; data?: TableData }> {
    const typed = optional(key);
    if (typed) return { month: monthInput(key, 'Month') };
    return this.findMonth(want);
  }

  /** Listing → Search → [View] on `month` → Details of that month. With `data`, the Summary is already on screen (findMonth). */
  async openMonth(month: string, shown?: TableData): Promise<{ data: TableData; details: AplDetailsPage }> {
    let data = shown;
    if (!data) {
      await this.openListing();
      data = await this.search();
    }
    const found = data;
    const details = await test.step(`Click [View] on ${month} ${CONFIG.year}`, async () => {
      await this.summary.openMonth(found, month);
      const d = this.details;
      await d.expectOpenFor(month, CONFIG.year);
      return d;
    });
    return { data: found, details };
  }

  /**
   * The TS needs `month` in a given status. If it is not, the TS stops here
   * with the reason (lesson 18: never pass what was not reached) and a red
   * box on the workflow bar.
   */
  async requireState(details: AplDetailsPage, month: string, want: MonthState): Promise<Status> {
    return test.step(`Check ${month} ${CONFIG.year} is ${MONTH_STATE[want].label}`, async () => {
      const s = await details.statuses();
      await details.showValue(details.wfBar());
      if (!sameStatus(s, MONTH_STATE[want].s)) {
        await details.captureIssue(`${this.ts}-precondition`, details.wfBar(), `Needs ${MONTH_STATE[want].label}; shows ${showStatus(s)}`);
        throw new Error(`Precondition not met: ${month} ${CONFIG.year} shows ${showStatus(s)}; this TS needs a month that is ${MONTH_STATE[want].label}. Pick such a month on the ${this.ts} row (12028_PREP can move a Pending month there).`);
      }
      return s;
    });
  }

  /** Back to Summary → Search → the month's row statuses (to confirm what the Summary shows). */
  async summaryStatusOf(month: string): Promise<{ data: TableData; status: ReturnType<AplSummaryPage['monthStatus']> }> {
    return test.step(`Back to the Summary and read ${month}'s statuses`, async () => {
      if (await this.details.backBtn().count()) await this.details.backToSummary();
      else await this.openListing();
      const data = await this.summary.search();
      return { data, status: this.summary.monthStatus(data, month) };
    });
  }
}

/** Remarks typed on a Reject — unique per TS run, so the log row read back is THIS run's (lesson 10). */
export const remarksFor = (ts: string) => `Automation ${ts} reject ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`;
