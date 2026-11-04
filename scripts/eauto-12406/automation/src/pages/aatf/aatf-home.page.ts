import { expect, type Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";

/**
 * AATF portal home and the eDEREG landing.
 *
 * Read off staging /eauto/ on 2026-10-20 as azfaraatf (persona `aatf`; EAINT-12253 probes p11–p13,
 * `cr/EAINT-12253/03-spec/probes-2010/`):
 *
 *   sign-in lands on `view/aatf/home.do` behind an "ANNOUNCEMENT/ PENGUMUMAN" jQuery dialog
 *   (closed with its titlebar close). Tiles: `#DEREGISTRATION` "eDEREG" → `view/aatf/dereg/view.do`,
 *   SETTINGS (`#settings-link`), REPORTS.
 *   eDEREG landing buttons: `#precheck-transaction` eDEREG PRE-CHECKING ENQUIRY
 *   (→ `dereg/precheck/transaction/main.do`), `#precheck-listing` (→ `dereg/precheck/enquiry/main.do`),
 *   `#transactionListing` DEREGISTRATION TRANSACTION LISTING (→ `dereg/enquiry/main.do`),
 *   `#deregTransaction` CREATE DEREGISTRATION TRANSACTION (→ `dereg/transaction/`).
 *   (The 2026-09-09 note that the sub-tiles did not navigate did not reproduce: clicks work.)
 *
 * The announcement is closed ONLY by its own title text, never "any dialog" (EAINT-12253: a
 * browser reminder must never be closed by a helper).
 */
export type EderegTile = "precheck-transaction" | "precheck-listing" | "transactionListing" | "deregTransaction";

export class AatfHomePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  /** Close the home ANNOUNCEMENT dialog if it is up. Nothing else. */
  async closeAnnouncement(): Promise<void> {
    const dlg = this.page.locator(".ui-dialog:visible").filter({ hasText: /ANNOUNCEMENT/ }).first();
    if (await dlg.isVisible().catch(() => false)) {
      await dlg.locator(".ui-dialog-titlebar-close").first().click();
      await dlg.waitFor({ state: "hidden", timeout: 10_000 }).catch(() => undefined);
    }
  }

  /** From anywhere in the portal: HOME → announcement closed → eDEREG landing. */
  @step("AATF: open eDEREG")
  async gotoEdereg(): Promise<void> {
    if (!/view\/aatf\/home/.test(this.page.url())) {
      await this.page.locator("#home-link").click();
      await this.page.waitForURL(/view\/aatf\/home/, { timeout: 30_000 });
    }
    await this.closeAnnouncement();
    await (await this.requireVisible(this.page.locator("#DEREGISTRATION"), "eDEREG tile (#DEREGISTRATION)")).click();
    await expect(this.page).toHaveURL(/view\/aatf\/dereg\/view\.do/, { timeout: 30_000 });
  }

  @step("AATF: open an eDEREG function")
  async open(tile: EderegTile): Promise<void> {
    await this.gotoEdereg();
    await this.page.locator(`#${tile}`).click();
    await this.page.waitForLoadState("domcontentloaded");
  }
}
