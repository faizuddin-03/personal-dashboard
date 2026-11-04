import type { Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";

/**
 * The dealer dashboard.
 *
 * It exists so nothing constructs a module's URL. A guessed path 404s or
 * redirects, and a redirect can land the run on another environment whose
 * login form is identical — so a module is reached by clicking its tile, the
 * way a dealer reaches it (qa-principles #13).
 *
 * Shape follows `eauto-qa-automation/src/pages/ucd/ucd-home.page.ts` so the two
 * merge rather than duplicate.
 *
 * ── The tile list ───────────────────────────────────────────────────────────
 * Every entry below was resolved by CLICKING it on staging and reading where it
 * went (`knowledge/portals/ucd/portal.md`). The tiles are `<button>` elements
 * with jQuery handlers and no `href`, so nothing here can be read off markup.
 *
 * A transaction LISTING is deliberately absent: a listing is not a dashboard
 * tile, it is a control on the module's own landing page. Proved on staging
 * 2026-09-21 — `eSERAHAN TRANSACTION LISTING`, `BMK Listing`,
 * `INSURANCE TRANSACTION LISTING` and `JOMCHECK TRANSACTION LISTING` are not
 * dashboard buttons, and a `goTo()` for any of them throws. Reach one by
 * clicking the module tile first, then the listing control on that screen.
 */
export const UCD_MENU = {
  stms: "STMS",
  eSerahan: "eSERAHAN",
  ucdToUcd: "UCD TO UCD",
  apt: "APT",
  bmk: "BMK",
  insurance: "INSURANCE",
  jomcheckReport: "JOMCHECK REPORT",
  ssmDocument: "SSM DOCUMENT",
  wholesale: "WHOLESALE",
  serviceHub: "SERVICE HUB",
  evoc: "eVOC",
  lkmRefund: "LKM REFUND",
  companyProfile: "COMPANY/BUSINESS PROFILE",
  reports: "REPORTS",
  settings: "SETTINGS",
} as const;

export type UcdMenuItem = (typeof UCD_MENU)[keyof typeof UCD_MENU];

export class UcdHomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /**
   * Wait for the dashboard to be usable and clear whatever is covering it.
   *
   * The dashboard opens behind a popup queue. A spec that does not close it
   * sees no navigation at all, because every tile click lands on the overlay
   * instead (qa-principles #13, corollary).
   */
  @step("Settle the dashboard")
  async settle(): Promise<void> {
    await this.page
      .locator("//h1[normalize-space()='Working...']")
      .waitFor({ state: "hidden", timeout: 30_000 })
      .catch(() => undefined);
    await this.closePopups();
  }

  /** Close the announcement / terms dialogs that queue over the dashboard. */
  async closePopups(): Promise<void> {
    // Campaign banners (e.g. #dialog-lkm-refund "LKM Refund Now on eAuto!", seen
    // on preprod1 2026-10-07) are not jQuery UI dialogs and put up no
    // .ui-widget-overlay, yet they cover the tiles. Close with their own button.
    const campaigns = this.page.locator(".modal-campaign:visible");
    for (let n = await campaigns.count(); n > 0; n--) {
      const m = campaigns.first();
      await m.locator(".close-btn").first().click({ force: true, timeout: 3_000 }).catch(() => undefined);
      await m.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => m.evaluate((e) => ((e as HTMLElement).style.display = "none")));
    }

    // "Company/Business Profile Update" (#dialog-einvoice): shown to a company whose main user has not done the
    // update yet, e.g. the QA companies made in BO 21.10.2026 (lanes 5-9). Never shown for AZFARAZO. Its Close.
    const einvoice = this.page.locator("#dialog-einvoice:visible");
    if (await einvoice.isVisible().catch(() => false)) {
      await this.page.locator("#dialog-einvoice #close-dialog, #dialog-einvoice button:has-text('Close')").first()
        .click({ timeout: 3_000 }).catch(() => undefined);
      await einvoice.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
    }

    for (let attempt = 0; attempt < 3; attempt++) {
      const overlay = this.page.locator(".ui-widget-overlay").first();
      if (!(await overlay.isVisible().catch(() => false))) break;

      const closers = [
        this.page.locator(".ui-dialog:visible .ui-dialog-titlebar-close").first(),
        this.page.locator(".ui-dialog:visible button", { hasText: /^(Close|Tutup|OK)$/ }).first(),
        this.page.locator(".modal.show .close, .modal.in .close").first(),
      ];
      let clicked = false;
      for (const c of closers) {
        if (await c.isVisible().catch(() => false)) {
          await c.click({ timeout: 3_000 }).catch(() => undefined);
          clicked = true;
          break;
        }
      }
      if (!clicked) break;
      // The overlay going away is the signal the dialog closed — not a delay.
      await overlay.waitFor({ state: "hidden", timeout: 5_000 }).catch(() => undefined);
    }
  }

  /**
   * Get back to the dashboard from wherever a previous flow left the page.
   *
   * A finished journey ends on its own last screen (e.g. `jpj-sub.do`), which
   * has no dashboard tiles. `#home-link` is in the header of every portal page,
   * so this is what lets one flow follow another in the same session.
   * Does nothing when the dashboard is already showing.
   */
  @step("Return to the dashboard")
  async returnToDashboard(): Promise<void> {
    const tiles = this.page.locator("button.dashboard-menu-item-btn").first();
    if (await tiles.isVisible().catch(() => false)) return;
    await this.page.locator("#home-link").click();
    await tiles.waitFor({ state: "visible", timeout: 30_000 });
    await this.settle();
  }

  /**
   * Click a dashboard tile.
   *
   * Throws naming the tile when it is not there, because a missing menu item is
   * a real finding and must not be mistaken for a slow page (qa-principles #5).
   */
  @step("Open a module from the dashboard")
  async goTo(item: UcdMenuItem): Promise<void> {
    await this.closePopups();
    const button = this.page.locator(
      `//button[@class='dashboard-menu-item-btn' and normalize-space()='${item}']`,
    );
    await (await this.requireVisible(button, `dashboard menu item "${item}"`)).click();
  }
}
