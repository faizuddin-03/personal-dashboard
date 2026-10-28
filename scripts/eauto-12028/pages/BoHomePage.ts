import { Page } from '@playwright/test';
import { AplBase } from './AplBase';
import { CONFIG } from '../data/config';

// BackOffice Home. Category markup from _reference/html/eauto/bo-home-mfared-uat4.html
// lines 312-330: `<td><span class="category">Reports</span><ul><li><img …><a href=…>JPJ Reports</a>`.
// The new item's text is from SRD v1.1 REQ-001 ("Add "Association Payment
// Listing" under the Reports section") and the mock-up line 148 — the live
// link is NOT captured yet [unconfirmed]: where it points (same tab, new tab,
// SSO hand-off to the backoffice app) is unknown, so openListing() follows
// either a same-tab navigation or a new tab.
export class BoHomePage extends AplBase {
  // from _reference/html/eauto/bo-home-mfared-uat4.html line 312 (span.category "Reports"; its parent <td> holds the list)
  reportsBlock = () => this.page.locator('span.category', { hasText: /^\s*Reports\s*$/ }).locator('xpath=..');
  // [unconfirmed] text from SRD v1.1 REQ-001 / mock-up line 148 — live link not captured
  listingLink = () => this.reportsBlock().getByRole('link', { name: 'Association Payment Listing', exact: true });
  // from _reference/html/eauto/bo-home-hub-admin-eauto-account-2026-10-19.html line 68
  txStateLink = () => this.reportsBlock().getByRole('link', { name: 'Transaction Summary Report (State)', exact: true });
  // from _reference/html/eauto/bo-home-mfared-uat4.html line 1204
  userName = () => this.page.locator('span.user-name').first();

  constructor(page: Page) { super(page); }

  /** BO home is the first landing page; loaded by URL only when its menu is not on screen (scaffold skill §7). */
  async goto(): Promise<void> {
    if (!(await this.reportsBlock().count())) {
      await this.page.goto(CONFIG.boHomeUrl, { waitUntil: 'load', timeout: CONFIG.navigationTimeout });
      await this.settleAfterLoad();
      await this.dismissBanners();
    }
    if (!(await this.reportsBlock().count())) throw new Error(`BO Home has no "Reports" category at ${this.page.url()} — is this a BackOffice login?`);
  }

  async listingLinkCount(): Promise<number> {
    return this.listingLink().count();
  }

  /**
   * Clicks Reports → Association Payment Listing and returns the page the
   * module opened on (this tab, or a new tab if the link opens one).
   */
  async openListing(): Promise<Page> {
    await this.goto();
    const link = this.listingLink();
    if (!(await link.count())) throw new Error(`"Association Payment Listing" is not under Reports on BO Home (${this.page.url()}).`);
    await this.dismissBanners();
    await this.demoHighlight(link);
    const newTab = this.page.context().waitForEvent('page', { timeout: 5_000 }).catch(() => null);
    await link.click();
    const tab = await newTab;
    const target = tab ?? this.page;
    await target.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    if (tab) console.log(`   ↗ The module opened in a new tab: ${tab.url()}`);
    return target;
  }

  async openTransactionSummaryState(): Promise<void> {
    await this.goto();
    const link = this.txStateLink();
    if (!(await link.count())) throw new Error(`"Transaction Summary Report (State)" is not under Reports for this login (${this.page.url()}).`);
    await this.demoHighlight(link);
    await link.click();
    await this.page.waitForLoadState('load', { timeout: CONFIG.navigationTimeout });
    await this.settleAfterLoad();
  }
}
