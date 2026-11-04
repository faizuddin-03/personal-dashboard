/**
 * Secarang — Step 6 Success: "Thank you for your purchase!" with Receipt No, Purchase Date, Payment Method,
 * the vehicle / owner / price details, and a [Receipt] PDF download. A WhatsApp and an email receipt follow to
 * the phone / email typed on Confirmation [doc §3]. The site password page can come back here first [doc §2, §13; F].
 *
 * Ported from Faizuddin's PaymentSuccessPage (secarang-insurance, commit c9aab16), with his OK, 28.10.2026.
 * Kept: the success text, `app-payment-success .d-print-none` label / value rows, the Receipt button and its
 * download [F]. Dropped: his Confirmation-vs-Success comparison report and the PDF text check (pdf-parse is not
 * a dependency here; a CR spec compares what its TS names, and `pdftotext -layout` reads the PDF, as the CIBO
 * receipt is read in the 12406 walks). Changed: the receipt is a separate call, so the final screen is
 * returned on arrival like every flow's final stop.
 * Run from this repo since 29.10.2026 (verify runs fx4, cd4, gp1 …, src/flows/README.md).
 */

import type { Download, Page, Request } from "@playwright/test";
import { step } from "@fixtures/step";
import { SecarangPage } from "./secarang.page";
import { SecarangSiteGatePage } from "./site-gate.page";

export class SecarangSuccessPage extends SecarangPage {
  constructor(page: Page) {
    super(page);
  }

  marker() {
    return this.page.getByText(/Thank you for your purchase/i).filter({ visible: true }).first();
  }

  /** [Receipt] (the PDF download), never a [Print receipt]. */
  receiptButton() {
    return this.page
      .getByRole("button", { name: /Receipt/i })
      .or(this.page.getByRole("link", { name: /Receipt/i }))
      .filter({ visible: true })
      .filter({ hasNotText: /Print/i })
      .first();
  }

  /**
   * Wait for "Thank you for your purchase!", giving the site password if it comes back first.
   *
   * After Fiuu returns, the tab sits on Secarang's own check page `/ia/payment/check/<receipt>` ("Verifying payment /
   * Just a short moment"), then `/ia/payment/check/<receipt>/ecert/<id>` ("Just a little moment..."), which asks
   * `ins-api/v1/ia/plan/view-insurance-details/<id>` every 2 s until the policy is ready, then shows Success [trace
   * of verify run sE2E 29.10.2026, card test]. In that run the check page stopped asking after about 45 s and stayed
   * on "Just a little moment..." for the rest of the 180 s, while CIBO showed the record (BR60006337) Paid and
   * "Insurance created". So on a timeout this says where the tab stopped and how often the page was still asking,
   * to tell a site-side hang from a test fault. Never reloads: a buyer would see the same page.
   */
  @step("Wait for the Secarang success page")
  async waitForPage(timeoutMs = 180_000): Promise<void> {
    const t0 = Date.now();
    const polls: number[] = [];
    const onRequest = (req: Request) => {
      if (/\/plan\/view-insurance-details\//.test(req.url())) polls.push(Date.now() - t0);
    };
    this.page.on("request", onRequest);
    try {
      while (Date.now() - t0 < timeoutMs) {
        if (await this.marker().isVisible().catch(() => false)) return;
        await new SecarangSiteGatePage(this.page).passIfShown();
        await this.page.waitForTimeout(1_500);
      }
    } finally {
      this.page.off("request", onRequest);
    }
    const url = this.page.url();
    const heading = (await this.page.locator("h1, h2, h3, h4").filter({ visible: true }).allInnerTexts().catch(() => [] as string[]))
      .map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean).join(" / ");
    const lastPoll = polls.length ? polls[polls.length - 1] : -1;
    const asked = polls.length
      ? `the page asked for the policy details ${polls.length} time(s), the last ${Math.round(lastPoll / 1000)} s into the wait` +
        (Date.now() - t0 - lastPoll > 10_000 ? ", then stopped asking" : ", and was still asking at the end")
      : "the page did not ask for the policy details during the wait";
    if (/\/payment\/check\//.test(url)) {
      throw new Error(
        `Secarang stayed on its own payment-check page "${heading}" for ${timeoutMs / 1000} s (${url}): Fiuu had returned the ` +
          `payment to Secarang, and ${asked}. A possible site / Fiuu-sandbox / insurer-simulator hang, not a test step: ` +
          `look the receipt up in CIBO (Paid? Insurance created?).`,
      );
    }
    throw new Error(`Secarang: "Thank you for your purchase!" did not show within ${timeoutMs / 1000} s (${url}; page shows "${heading}"; ${asked}).`);
  }

  /** Every label → value row of the success panel (Receipt No, Purchase Date, Payment Method, Plate No …). */
  @step("Read the success page")
  async read(): Promise<Record<string, string>> {
    return this.page.evaluate(() => {
      const norm = (s: string | null) => (s || "").replace(/\s+/g, " ").trim();
      const out: Record<string, string> = {};
      const root = document.querySelector("app-payment-success .d-print-none") || document.querySelector("app-payment-success") || document.body;
      root.querySelectorAll(".row.mb-2, .row.mb-4, .row.mb-5").forEach((row) => {
        const muted = row.querySelector(".text-muted");
        if (muted) {
          const label = norm(muted.textContent);
          const col = Array.from(row.querySelectorAll("[class*='col']")).find((c) => c !== muted && !c.contains(muted) && norm(c.textContent));
          if (label && col) out[label] = norm(col.textContent);
          return;
        }
        const cols = Array.from(row.querySelectorAll(".col, .col-auto"));
        if (cols.length >= 2) {
          const label = norm(cols[0].textContent);
          const value = norm(cols[cols.length - 1].textContent);
          if (label && value && label !== value) out[label] = value;
        }
      });
      return out;
    });
  }

  /** Every visible button / link-button on the Success page, by its text (to record what the page offers). Reads only. */
  async offeredButtons(): Promise<string[]> {
    const names = await this.page
      .locator("button, a.btn, a[role=button]")
      .filter({ visible: true })
      .evaluateAll((els) => els.map((e) => ((e as HTMLElement).innerText || e.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim()).filter(Boolean));
    return [...new Set(names)];
  }

  /** A [Print receipt] / [Print] control, if the page offers one (12406_RC_TS1 E9: "if the Success page offers it"). */
  printReceiptButton() {
    return this.page
      .getByRole("button", { name: /Print/i })
      .or(this.page.getByRole("link", { name: /Print/i }))
      .filter({ visible: true })
      .first();
  }

  /**
   * If [Print receipt] is offered: press it with `window.print` recorded instead of opening the system dialog (as
   * `CiboPage.printView`), and render the page with print CSS. A new window it opens is returned instead. Reads only;
   * `endPrintView()` goes back to screen. Returns `offered: false` and does nothing when there is no such control.
   */
  @step("Open the Secarang [Print receipt] view, if offered")
  async printView(): Promise<{ offered: boolean; label?: string; printCalls?: number; popup?: Page }> {
    const btn = this.printReceiptButton();
    if (!(await btn.isVisible().catch(() => false))) return { offered: false };
    const label = ((await btn.innerText().catch(() => "")) || "").replace(/\s+/g, " ").trim();
    await this.page.evaluate(() => {
      const w = window as unknown as { __qaPrintCalls?: number; print: () => void };
      w.__qaPrintCalls = 0;
      w.print = () => { w.__qaPrintCalls = (w.__qaPrintCalls ?? 0) + 1; };
    });
    const popupP = this.page.context().waitForEvent("page", { timeout: 5_000 }).catch(() => undefined);
    await btn.click();
    const popup = await popupP;
    await this.page.waitForTimeout(1_500);
    const printCalls = await this.page.evaluate(() => (window as unknown as { __qaPrintCalls?: number }).__qaPrintCalls ?? 0);
    if (!popup) await this.page.emulateMedia({ media: "print" });
    return { offered: true, label, printCalls, popup };
  }

  async endPrintView(): Promise<void> {
    await this.page.emulateMedia({ media: null });
  }

  /** Press [Receipt] and return the PDF download. */
  @step("Download the Secarang receipt")
  async downloadReceipt(): Promise<Download> {
    const btn = this.receiptButton();
    await this.requireVisible(btn, "Receipt");
    const [dl] = await Promise.all([this.page.waitForEvent("download", { timeout: 60_000 }), btn.click()]);
    return dl;
  }
}
