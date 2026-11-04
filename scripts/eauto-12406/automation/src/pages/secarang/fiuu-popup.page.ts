/**
 * Secarang — the Fiuu sandbox window a payment tile opens, one driver per channel. Sandbox money, real record:
 * a sandbox payment still creates the Secarang transaction and shows in CIBO [doc §5].
 *
 *  - FPX: the Fiuu Bank Simulator — its own username + password (NOT the site password), a status dropdown
 *    (00 = approved, any other code is a negative case), Request TAC, the TAC shown on the page typed into its
 *    box, Pay Now; the window closes itself [doc §5; F].
 *  - Card: the Fiuu card form (Card Number, Expiry, CVV), then a 3D Secure page "For testing: use OTP 123456";
 *    3D Secure CANCEL leaves the transaction Pending [doc §5].
 *  - GrabPay: `select#status_code` Success / Failed, then Pay [doc §5].
 *  - ShopeePay: a QR page "Kindly scan the QR code below to proceed with payment."; the QR's link opens
 *    bank-simulator.fiuu.com/shopeepay/spsimulator, where "✓ Success" or "✗ Failed" then PROCEED TO PAY. After
 *    Pay this tab may land on `/ia/auth/login?returnUrl=/payment/check/<receipt>`: ignore it, the result shows in
 *    the main window [doc §5].
 *
 * Ported from Faizuddin's BankLoginPage + BankTACPage (secarang-insurance, commit c9aab16), with his OK,
 * 28.10.2026, for FPX only (`select#status_code`, "Request TAC", `.otp` holding 6 digits, `input#otp-input`,
 * `button.pay-btn` / "Pay Now", wait for close [F]). Changed: the simulator login is the repo's HOST-LOCKED
 * `simulatorLogin` (`pages/obs/fiuu.page.ts`): FIUU_USERNAME / FIUU_PASSWORD are typed only on
 * bank-simulator.fiuu.com, and the Secarang site password is never offered to this window (his login passed
 * the site gate on the bank window first; the site gate belongs to the Secarang host only).
 * Card, GrabPay and ShopeePay are written from the team doc alone: TODO(unsourced) selectors, NOT seen.
 * Nothing here has run from this repo yet (Azfar 28.10.2026).
 */

import type { Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { SIMULATOR_HOST, simulatorLogin } from "@pages/obs/fiuu.page";
import { SecarangSiteGatePage } from "./site-gate.page";

export type FiuuOutcome = "success" | "failed";

/** A Fiuu sandbox test card [doc §5]. Not a real card. */
export interface SandboxCard {
  number: string;
  expiry: string; // MM/YY
  cvv: string;
}

const hostOf = (p: Page): string => {
  try {
    return new URL(p.url()).hostname;
  } catch {
    return "";
  }
};
const onFiuu = (p: Page): boolean => /(^|\.)fiuu\.com$/i.test(hostOf(p));

/** The ShopeePay QR's link per Fiuu window (the `qr_data` field it POSTs to viewqr.php), noted by `watchFiuuWindow`. */
const QR_DATA = new WeakMap<Page, string>();

/**
 * Call at once when a Fiuu window opens (from the "page" event), so what it sends while loading is noted: the
 * ShopeePay QR link travels only in a form POST (see `payShopee`).
 */
export function watchFiuuWindow(win: Page): void {
  win.on("request", (r) => {
    if (r.method() !== "POST" || !/viewqr\.php/i.test(r.url())) return;
    const v = new URLSearchParams(r.postData() ?? "").get("qr_data");
    if (v) QR_DATA.set(win, v);
  });
}

export class SecarangFiuuPopup {
  constructor(private readonly popup: Page) {}

  /** Wait for the window to close itself (the hand-back after Pay). True when it closed. */
  async waitForClose(timeoutMs = 60_000): Promise<boolean> {
    if (this.popup.isClosed()) return true;
    return this.popup.waitForEvent("close", { timeout: timeoutMs }).then(() => true).catch(() => this.popup.isClosed());
  }

  /**
   * The popup can first open on a Secarang /ia/ page that shows the site password page again (the password is
   * kept per tab) [doc §2, §13; F]. Given here, on the Secarang host only (the gate's own guard).
   */
  async passGateIfShown(): Promise<boolean> {
    await this.popup.waitForLoadState("domcontentloaded").catch(() => undefined);
    if (onFiuu(this.popup)) return false;
    return new SecarangSiteGatePage(this.popup).passIfShown();
  }

  private refuseOffFiuu(what: string): void {
    if (!onFiuu(this.popup)) {
      throw new Error(`Refusing to ${what} on ${this.popup.url()}: not a Fiuu sandbox page.`);
    }
  }

  /**
   * FPX on the Bank Simulator: sign in (host-locked), set the status (`"00"` approved; another code = a failed
   * payment), Request TAC, type the TAC the page shows, Pay Now [F]. Returns the TAC used.
   */
  @step("Fiuu Bank Simulator: pay by FPX")
  async payFpx(statusCode = "00"): Promise<{ tac: string; closed: boolean }> {
    await this.passGateIfShown();
    await this.popup.waitForURL((u) => u.hostname === SIMULATOR_HOST, { timeout: 90_000 });
    await this.popup.locator("input[type=password]").filter({ visible: true }).first().waitFor({ timeout: 60_000 });
    if (!(await simulatorLogin(this.popup))) {
      throw new Error(`Fiuu Bank Simulator login not done on ${this.popup.url()}: FIUU_USERNAME / FIUU_PASSWORD blank, or not the simulator host.`);
    }
    const status = this.popup.locator("select#status_code");
    await status.waitFor({ state: "visible", timeout: 60_000 });
    await status.selectOption(statusCode);
    // Seen 29.10.2026 (verify run fx3, trace, page bank-simulator.fiuu.com/RHB0218/simulator): "Request TAC" is
    // `button#tac-btn`; the TAC then shows as the VALUE of the read-only `input#otp`; it is typed into
    // `input#tac_no` ("Enter TAC"); "Pay now" is `button#pay-btn` (submits form fpx_form). [F]'s `.otp` text,
    // `input#otp-input` and `button.pay-btn` are kept as fallbacks.
    await this.popup.locator("button#tac-btn").or(this.popup.getByRole("button", { name: /Request TAC/i })).filter({ visible: true }).first().click();
    let tac = "";
    for (let i = 0; i < 60 && !tac; i++) {
      const v = await this.popup.locator("input#otp").inputValue().catch(() => "");
      const t = await this.popup.locator("div.otp").first().innerText({ timeout: 500 }).catch(() => "");
      tac = (/\d{6}/.exec(`${v} ${t}`) || [""])[0];
      if (!tac) await this.popup.waitForTimeout(1_000);
    }
    if (!tac) throw new Error("Fiuu Bank Simulator: no 6-digit TAC after Request TAC (input#otp stayed empty for 60 s).");
    await this.popup.locator("input#tac_no, input#otp-input, input[name='otp-input']").filter({ visible: true }).first().fill(tac);
    await this.popup.locator("button#pay-btn, button.pay-btn").or(this.popup.getByRole("button", { name: /Pay Now/i })).filter({ visible: true }).first().click();
    return { tac, closed: await this.waitForClose() };
  }

  /**
   * Card form, then 3D Secure with OTP 123456 [doc §5]. Card form seen 29.10.2026 (verify run cd1, trace;
   * sandbox-payment.fiuu.com/MOLPay/API/seamless/index.php): `input#cardnumber`, `input#expdate` ("MM / YY", a
   * masked box: typed key by key), `input#cvv-flip`, `button#pay-online-btn` "Pay MYR …". The label / placeholder
   * guesses from the team doc stay as fallbacks. The 3D Secure page is found by its text "use OTP 123456" in the
   * window or any of its frames; `threeDsUrl` records where it was.
   */
  @step("Fiuu: pay by card")
  async payCard(card: SandboxCard, otp = "123456"): Promise<{ closed: boolean; threeDsUrl: string }> {
    await this.passGateIfShown();
    await this.popup.waitForURL((u) => /(^|\.)fiuu\.com$/i.test(u.hostname), { timeout: 90_000 });
    this.refuseOffFiuu("type card details");
    const box = (css: string, re: RegExp) =>
      this.popup.locator(css).or(this.popup.getByLabel(re)).or(this.popup.getByPlaceholder(re)).filter({ visible: true }).first();
    const number = box("input#cardnumber", /card\s*n(o|umber)/i);
    await number.waitFor({ state: "visible", timeout: 90_000 });
    await number.fill(card.number);
    const exp = box("input#expdate", /expir|MM\s*\/\s*YY/i);
    await exp.click();
    await exp.pressSequentially(card.expiry.replace(/\D/g, ""), { delay: 80 });
    const cvv = box("input#cvv-flip", /cvv|cvc/i);
    await cvv.click();
    await cvv.pressSequentially(card.cvv, { delay: 80 });
    await this.popup
      .locator("button#pay-online-btn")
      .or(this.popup.getByRole("button", { name: /^\s*(Pay\b.*|Submit|Proceed)\s*$/i }))
      .filter({ visible: true })
      .first()
      .click();
    // 3D Secure: the page (or a frame of it) that says "use OTP 123456"
    let frame = null as null | import("@playwright/test").Frame;
    for (let i = 0; i < 90 && !frame; i++) {
      for (const f of this.popup.frames()) {
        if (await f.getByText(/use OTP\s*:?\s*123456/i).first().isVisible().catch(() => false)) { frame = f; break; }
      }
      if (!frame) {
        if (this.popup.isClosed()) throw new Error("Card: the Fiuu window closed before a 3D Secure page showed.");
        await this.popup.waitForTimeout(1_000);
      }
    }
    if (!frame) throw new Error(`Card: no 3D Secure page saying "use OTP 123456" within 90 s (window at ${this.popup.url()}).`);
    const threeDsUrl = frame.url();
    // Seen 29.10.2026 (verify run cd2, trace): bank-simulator.fiuu.com/card/3ds-challenge, form#otpForm with
    // input#otpInput ("000000") and the submit button "PAY" (`button.pay-btn`); also CANCEL and Resend OTP.
    await frame.locator("input#otpInput").or(frame.locator("input:not([type=hidden])")).filter({ visible: true }).first().fill(otp);
    await frame.locator("#otpForm button[type=submit], button.pay-btn")
      .or(frame.getByRole("button", { name: /^\s*(PAY|Submit|Confirm|Verify|OK|Continue|Authenticate|Proceed)\s*$/i }))
      .filter({ visible: true }).first().click();
    return { closed: await this.waitForClose(), threeDsUrl };
  }

  /** GrabPay sandbox: `select#status_code` Success / Failed, then Pay [doc §5]. */
  @step("Fiuu: pay by GrabPay")
  async payGrab(outcome: FiuuOutcome = "success"): Promise<{ closed: boolean }> {
    await this.passGateIfShown();
    const status = this.popup.locator("select#status_code");
    await status.waitFor({ state: "visible", timeout: 90_000 });
    this.refuseOffFiuu("set the GrabPay outcome");
    await status.selectOption({ label: outcome === "success" ? "Success" : "Failed" });
    await this.popup.getByRole("button", { name: /^\s*Pay\s*$/i }).filter({ visible: true }).first().click();
    return { closed: await this.waitForClose() };
  }

  /**
   * ShopeePay: read the QR's simulator link, open it in a SEPARATE tab (as a phone scanning the QR would; the QR window
   * keeps polling for the result), pick the outcome, PROCEED TO PAY, then wait for the QR window to close [doc §5].
   * Seen 29.10.2026 (verify run sp1, trace): the QR page (sandbox-payment.fiuu.com/RMS/intermediate_app/viewqr.php)
   * shows the QR only as an image (`img#qrcode_img`, data URI) and `button#cancelBtn` "Cancel the transaction"; the
   * link (bank-simulator.fiuu.com/shopeepay/spsimulator?q=…) arrives as the form field `qr_data` POSTed to viewqr.php,
   * which `watchFiuuWindow` keeps when the window opens. The page's own `input[name=qr_data]` / a link are fallbacks.
   */
  @step("Fiuu: pay by ShopeePay")
  async payShopee(outcome: FiuuOutcome = "success"): Promise<{ simulatorUrl: string; closed: boolean }> {
    await this.passGateIfShown();
    await this.popup.getByText(/scan the QR code/i).first().waitFor({ timeout: 90_000 });
    let link = QR_DATA.get(this.popup) ?? "";
    if (!link) {
      link =
        (await this.popup.locator("input[name='qr_data']").first().inputValue({ timeout: 2_000 }).catch(() => "")) ||
        (await this.popup.locator("a[href*='spsimulator']").first().getAttribute("href", { timeout: 2_000 }).catch(() => "")) ||
        "";
    }
    if (!/spsimulator/.test(link)) throw new Error("ShopeePay: the QR's simulator link was not seen (no qr_data POST noted: was the window opened through openGateway?).");
    const url = new URL(link, this.popup.url());
    if (url.hostname !== SIMULATOR_HOST) throw new Error(`ShopeePay: refusing to open ${url.hostname}: not the Fiuu bank simulator.`);
    const sim = await this.popup.context().newPage();
    try {
      await sim.goto(url.toString(), { waitUntil: "domcontentloaded" });
      // Seen 29.10.2026 (verify run sp2, trace): form shopeepay_form with `select#status_code` (options "✓ Success" = 1,
      // "✗ Failed" = 6) and `button#pay-btn` "Proceed to Pay".
      await sim.locator("select#status_code").selectOption(outcome === "success" ? "1" : "6");
      await sim.locator("button#pay-btn").or(sim.getByRole("button", { name: /PROCEED TO PAY/i })).first().click();
      await sim.waitForLoadState("domcontentloaded").catch(() => undefined);
      await sim.waitForTimeout(2_000);
    } finally {
      // After Pay the simulator tab may land on /ia/auth/login?returnUrl=/payment/check/<receipt>: ignored [doc §5].
      await sim.close().catch(() => undefined);
    }
    return { simulatorUrl: `${url.origin}${url.pathname}`, closed: await this.waitForClose(90_000) };
  }

  /** ShopeePay: [Cancel the transaction] → "Are you sure?" → only [OK] cancels [doc §5]. */
  @step("Fiuu: cancel the ShopeePay payment")
  async cancelShopee(): Promise<void> {
    // "Are you sure?" may be a browser confirm box rather than a page button (not seen yet): accept it if it is,
    // else press the page's OK [doc §5: only OK cancels].
    let native = false;
    this.popup.once("dialog", (d) => {
      native = true;
      void d.accept().catch(() => undefined);
    });
    await this.popup.getByText(/Cancel the transaction/i).first().click();
    await this.popup.waitForTimeout(1_500);
    if (!native && !this.popup.isClosed()) {
      await this.popup.getByRole("button", { name: /^\s*OK\s*$/ }).filter({ visible: true }).first().click();
    }
  }
}
