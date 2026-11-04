/**
 * Secarang — Step 5 Payment, "How would you like to pay?". On staging /ia/ four tiles: "Credit or Debit Card |
 * FPX Online banking | SPayLater | PayLater by Grab" (logo alts "ShopeePay", "GrabPay") [doc §5, live
 * 19.10.2026]. Each opens Fiuu in a POPUP window, which closes itself after Pay: register for the popup BEFORE
 * the click [doc §13; F]. A failed or cancelled payment comes back here with "Unsuccessful payment You may try
 * again." and no receipt [doc §3, §5]. Mock payment was enabled on /ia only (14.08.2026); /ia was once linked
 * to production BoldPay (20.05.2026): check before paying [doc §2].
 *
 * Ported from Faizuddin's PaymentTypePage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026.
 * Kept for FPX: `input[formcontrolname="paymentType"]`, the FPX `label`, the bank `label` holding
 * `input[formcontrolname="bank"][value=<code>]` (visible copy only), popup awaited before the click [F].
 * Added from the team doc (NOT seen in code or live): the card / GrabPay / ShopeePay tiles, matched by label
 * text or logo alt; whether a tile opens the popup at once or after a further button is
 * TODO(unsourced) — `openGateway` handles both and says which happened.
 * NOT run from this repo yet (Azfar 28.10.2026).
 */

import type { Locator, Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage } from "./secarang.page";
import { SecarangSiteGatePage } from "./site-gate.page";
import { watchFiuuWindow } from "./fiuu-popup.page";

export type SecarangPayChannel = "fpx" | "card" | "grabpay" | "shopeepay";

/** Tile text, then logo alt [doc §5]. */
const TILE: Record<SecarangPayChannel, { text: RegExp; alt?: RegExp }> = {
  fpx: { text: /FPX/i },
  card: { text: /Credit or Debit Card/i },
  grabpay: { text: /PayLater by Grab/i, alt: /GrabPay/i },
  shopeepay: { text: /SPayLater/i, alt: /ShopeePay/i },
};

/** FPX bank codes seen in the Secarang automation [doc §5; F]: Maybank2u is the default. */
export const FPX_BANK = {
  maybank2u: "fpx_mb2u",
  cimb: "fpx_cimbclicks",
  ambank: "fpx_amb",
  publicBank: "fpx_pbb",
  rhb: "fpx_rhb",
  hongLeong: "fpx_hlb",
} as const;

/**
 * The logo alt of each FPX bank tile on /ia/ (verify run fx1, 29.10.2026: Maybank2u, Cimb, Ambank, Public bank, RHB,
 * HLB, HSBC, Affin Bank, Bank rakyat, BSN). Codes as in the team doc §5.
 */
export const FPX_BANK_ALT: Record<string, string> = {
  fpx_mb2u: "Maybank2u",
  fpx_cimbclicks: "Cimb",
  fpx_amb: "Ambank",
  fpx_pbb: "Public bank",
  fpx_rhb: "RHB",
  fpx_hlb: "HLB",
  fpx_hsbc: "HSBC",
  fpx_abb: "Affin Bank",
  fpx_bkrm: "Bank rakyat",
  fpx_bsn: "BSN",
};

export class SecarangPaymentPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  async isShown(): Promise<boolean> {
    return (await this.page.locator("input[formcontrolname='paymentType']").count()) > 0;
  }

  @step("Wait for the payment page")
  async waitForPage(): Promise<void> {
    await this.page.locator("input[formcontrolname='paymentType']").first().waitFor({ state: "attached", timeout: 90_000 });
  }

  /**
   * Wait until the page is drawn: network quiet, every tile / bank logo loaded, then a short steady pause. A click
   * before that is lost (see `openFpx`).
   */
  async ready(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => undefined);
    await this.page
      .waitForFunction(() => Array.from(document.querySelectorAll("label img")).every((i) => (i as HTMLImageElement).complete), null, { timeout: 30_000 })
      .catch(() => undefined);
    await this.page.waitForTimeout(1_500);
  }

  /** The visible tile for a channel. */
  async tile(channel: SecarangPayChannel): Promise<Locator> {
    const t = TILE[channel];
    let tile = this.page.locator("label").filter({ visible: true }).filter({ hasText: t.text });
    if (!(await tile.count()) && t.alt) {
      tile = this.page.locator("label").filter({ visible: true }).filter({ has: this.page.getByAltText(t.alt) });
    }
    return this.requireVisible(tile, `payment tile ${channel}`);
  }

  /** The tiles' text / logo alts as the page shows them. Reads only. */
  @step("Read the payment tiles")
  async tiles(): Promise<string[]> {
    return this.page
      .locator("label")
      .filter({ visible: true })
      .filter({ has: this.page.locator("input[formcontrolname='paymentType']") })
      .evaluateAll((ls) => ls.map((l) => ((l as HTMLElement).innerText || "").trim() || Array.from(l.querySelectorAll("img")).map((i) => i.alt).join(" ")));
  }

  /**
   * The visible bank tile of the FPX grid. On /ia/ after the EAINT-12406 deploy (verify run fx1, 29.10.2026, trace)
   * each bank is `label.w-100` > `input.bank-input-element[formcontrolname="bank"]` (radio, d-none, NO value
   * attribute: Angular binds the code as a property) + the logo `img` whose alt names the bank, so the bank is found
   * by that alt ([F]'s `[value=<code>]` no longer matches). The code attribute is still tried first.
   */
  bankTile(bank: string): Locator {
    const byCode = this.page.locator("label").filter({ has: this.page.locator(`input[formcontrolname="bank"][value="${bank}"]`) });
    const alt = FPX_BANK_ALT[bank];
    const byAlt = alt
      ? this.page.locator("label").filter({ has: this.page.locator("input[formcontrolname='bank']") }).filter({ has: this.page.getByAltText(alt, { exact: true }) })
      : byCode;
    return byCode.or(byAlt).filter({ visible: true }).first();
  }

  /**
   * FPX: choose the tile, then the bank; the bank click opens the Fiuu popup [F]. Returns the popup.
   */
  @step("Pay by FPX: choose the bank")
  async openFpx(bank: string = FPX_BANK.maybank2u): Promise<Page> {
    await this.ready();
    await (await this.tile("fpx")).click();
    const bankLabel = this.bankTile(bank);
    await this.requireVisible(bankLabel, `FPX bank ${bank} (logo "${FPX_BANK_ALT[bank] ?? "?"}")`);
    // A bank clicked while the grid is still drawing is ticked but sends nothing: the page then says "Kindly select
    // payment option" and no window opens (verify run fx2, 29.10.2026). Clicked once the grid is drawn, the same click
    // sends POST …/plan/payment-details and opens the window (probe fpx-bank-click.probe.spec.ts, 29.10.2026).
    await this.ready();
    const popup = this.page.context().waitForEvent("page", { timeout: 60_000 });
    await bankLabel.click();
    const win = await popup;
    await win.waitForLoadState("domcontentloaded", { timeout: 90_000 }).catch(() => undefined);
    return win;
  }

  /**
   * Card / GrabPay / ShopeePay: choose the tile and return the Fiuu popup. If the tile alone opens no popup
   * within 10 s, the visible pay / proceed button is pressed once (TODO(unsourced): which of the two the site
   * does is not seen yet); `via` says which.
   */
  @step("Open the Fiuu window")
  async openGateway(channel: Exclude<SecarangPayChannel, "fpx">): Promise<{ popup: Page; via: "tile" | "button" }> {
    await this.ready();
    const watch = (w: Page) => { watchFiuuWindow(w); return true; };
    let popup = this.page.context().waitForEvent("page", { timeout: 10_000, predicate: watch }).catch(() => null);
    await (await this.tile(channel)).click();
    let win = await popup;
    if (win) {
      await win.waitForLoadState("domcontentloaded", { timeout: 90_000 }).catch(() => undefined);
      return { popup: win, via: "tile" };
    }
    const go = this.page.getByRole("button", { name: /^\s*(Pay|Pay Now|Proceed|Continue|Make Payment)\s*$/i }).filter({ visible: true }).last();
    await this.requireVisible(go, `pay button after the ${channel} tile`);
    popup = this.page.context().waitForEvent("page", { timeout: 60_000, predicate: watch }).catch(() => null);
    await go.click();
    win = await popup;
    if (!win) throw new Error(`Payment: no Fiuu window opened for ${channel} (${this.page.url()}).`);
    await win.waitForLoadState("domcontentloaded", { timeout: 90_000 }).catch(() => undefined);
    return { popup: win, via: "button" };
  }

  /**
   * Come back to the payment page at `url` (the flow's `paymentUrl`) after looking elsewhere in the same tab (a
   * failed attempt checked in CIBO, EAINT-12406 E2E_TS5): open it, give the site password if it asks, wait for
   * the tiles. TODO(unsourced): whether /ia/ re-opens a pending payment from its address is not seen yet; if it
   * does not, this throws naming the screen it found.
   */
  @step("Come back to the payment page")
  async reopen(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
    const gate = new SecarangSiteGatePage(this.page);
    for (let i = 0; i < 3 && (await gate.passIfShown()); i++) {
      if (!this.page.url().startsWith(url)) await this.page.goto(url, { waitUntil: "domcontentloaded" });
    }
    await this.waitForPage().catch((e) => {
      throw new Error(`Payment page not back at ${url} (now ${this.page.url()}): ${String(e).split("\n")[0]}`);
    });
  }

  /** "Unsuccessful payment You may try again." on the payment page [doc §3, §5]. */
  async unsuccessfulMessage(): Promise<string> {
    const body = await this.body();
    return (/Unsuccessful payment[^\n]*(\n[^\n]*try again[^\n]*)?/i.exec(body) || [""])[0].replace(/\s+/g, " ").trim();
  }
}
