import { Page, test } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BoHomePage } from '../pages/BoHomePage';
import { AplSummaryPage } from '../pages/AplSummaryPage';
import { AplDetailsPage, Status } from '../pages/AplDetailsPage';
import { CONFIG } from '../data/config';
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
export const sameStatus = (a: Status, b: Status) => a.drafter === b.drafter && a.reviewer === b.reviewer && a.approver === b.approver;
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
      return s;
    });
  }

  async search(year = CONFIG.year): Promise<TableData> {
    return test.step(`Select Year ${year} and click [Search]`, async () => this.summary.search(year));
  }

  /** Listing → Search → [View] on `month` → Details of that month. */
  async openMonth(month: string): Promise<{ data: TableData; details: AplDetailsPage }> {
    await this.openListing();
    const data = await this.search();
    const details = await test.step(`Click [View] on ${month} ${CONFIG.year}`, async () => {
      await this.summary.openMonth(data, month);
      const d = this.details;
      await d.expectOpenFor(month, CONFIG.year);
      return d;
    });
    return { data, details };
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
