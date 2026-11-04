import { type Locator, type Page } from "@playwright/test";
import { BasePage } from "../base.page";
import { step } from "@fixtures/step";

/**
 * eMOVE Logistics Transaction — BackOffice: listing and details.
 *
 * Selectors read off staging /uat3/ on 30.10.2026 (EAINT-12019 smoke p04, `BO_USERNAME`, Admin menu):
 *   listing `view/bo/emove/listing/main.do`: Vehicle No `#em-vehicleRegNo`, the Date Created boxes (ids containing
 *   "creat", read-only datepickers: the value is set directly), Search `#em-search`; empty until searched.
 *   Row Action View → `view/bo/emove/detail.do?id=<uuid>`.
 *   details: buttons `#em-btn-cancel`, `#em-btn-invoice`, `#em-btn-einvoice`, `#em-do-pickup`, `#em-do-dropoff`,
 *   `#em-do-resend`, `#em-view-photos`, `#em-btn-remark`; sections Payment History, Payment Details (Logistic),
 *   Pricing History (table), Delivery Tracking.
 * Cancel and Reset Payment are NOT here yet: not exercised by a probe (Reset moved to the listing on 30.10, uat3
 * run F11). Add them when a spec needs them, from a probe.
 */
export class BoEmovePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  @step("BO eMOVE listing: search")
  async search(f: { vehicleRegNo?: string; createdFrom?: string; createdTo?: string }): Promise<void> {
    await this.page.goto("view/bo/emove/listing/main.do");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    if (f.vehicleRegNo !== undefined) await this.page.fill("#em-vehicleRegNo", f.vehicleRegNo);
    const today = new Date().toLocaleDateString("en-GB", { timeZone: "Asia/Kuala_Lumpur" });
    const ids = await this.page.locator("input").evaluateAll((els) => els.map((e) => e.id).filter((x) => /creat/i.test(x)));
    const values = [f.createdFrom ?? today, f.createdTo ?? today];
    for (const [i, id] of ids.entries()) {
      await this.page.locator(`#${id}`).evaluate((e, v) => { (e as HTMLInputElement).removeAttribute("readonly"); (e as HTMLInputElement).value = v; }, values[Math.min(i, 1)]);
    }
    await this.page.locator("#em-search").click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  async listingRow(transactionNo: string): Promise<Record<string, string>> {
    const row = this.page.locator("tr", { hasText: transactionNo }).first();
    await this.requireVisible(row, `BO listing row ${transactionNo}`);
    return row.evaluate((tr) => {
      const table = tr.closest("table")!;
      const heads = Array.from(table.querySelectorAll("thead th, tr:first-child th")).map((h) => (h as HTMLElement).innerText.replace(/\s+/g, " ").trim());
      const cells = Array.from(tr.querySelectorAll("td")).map((c) => (c as HTMLElement).innerText.replace(/\s+/g, " ").trim());
      const out: Record<string, string> = {};
      heads.forEach((h, i) => (out[h] = cells[i] ?? ""));
      return out;
    });
  }

  @step("BO eMOVE details")
  async gotoDetails(id: string): Promise<void> {
    await this.page.goto(`view/bo/emove/detail.do?id=${id}`);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
  }

  button(id: "cancel" | "invoice" | "einvoice" | "doPickup" | "doDropoff" | "doResend" | "photos" | "remark"): Locator {
    const ids = { cancel: "#em-btn-cancel", invoice: "#em-btn-invoice", einvoice: "#em-btn-einvoice", doPickup: "#em-do-pickup", doDropoff: "#em-do-dropoff", doResend: "#em-do-resend", photos: "#em-view-photos", remark: "#em-btn-remark" };
    return this.page.locator(ids[id]);
  }

  /** The details page as printed: header status, Payment History lines, Pricing History rows, DO numbers. */
  async readDetails(): Promise<{ header: string; paymentHistory: string[]; pricingHistory: Record<string, string>[]; pickupDo: string; dropoffDo: string; distanceNote: string; body: string }> {
    const body = await this.page.locator("body").innerText();
    const pricingHistory = await this.page.evaluate(() => {
      const t = Array.from(document.querySelectorAll("table")).find((x) => /Decided At/.test((x as HTMLElement).innerText));
      if (!t) return [];
      const rows = Array.from(t.querySelectorAll("tr")).map((r) => Array.from(r.querySelectorAll("th,td")).map((c) => (c as HTMLElement).innerText.trim()));
      const [h, ...rest] = rows;
      return rest.filter((r) => r.length === h.length).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i]])));
    });
    return {
      header: /^.*Transaction Details.*$/m.exec(body)?.[0]?.trim() ?? "",
      paymentHistory: Array.from(body.matchAll(/\d+\. \d{2}\/\d{2}\/\d{4} \d{1,2}:\d{2}[ap]m - RHB \([^)]*\) - [^\n]+/g)).map((m) => m[0].trim()),
      pricingHistory,
      pickupDo: /Pick-Up DO No:\s*(\S+)/.exec(body)?.[1] ?? "",
      dropoffDo: /Drop-Off DO No:\s*(\S+)/.exec(body)?.[1] ?? "",
      distanceNote: /Distance [^\n]*km[^\n]*/.exec(body)?.[0]?.trim() ?? "",
      body,
    };
  }
}
