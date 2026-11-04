/**
 * BackOffice — transaction screens a CR touches AFTER a transaction exists.
 *
 *   BO STMS Transaction   view/stms/enquiry           (STMS, UCD to UCD, eSTM rows)
 *   BO APT Transaction    view/apt/enquiry
 *   Reset Payment Report  view/report/reset-payment-report
 *   Manual APT Trigger    view/stms/manual-trigger-apt
 *   BO APT Transaction Details  view/apt/enquiry/view.do?id=…&back=false (the listing's [View], a NEW TAB)
 *
 * This is NOT `obs/backoffice.page.ts`, which is the onboarding side
 * (Pre-Application / Application). Both sign in to the same portal.
 *
 * Every selector below was read off staging by a probe or used in the EAINT-12403
 * runs; the source is named next to it. A control no probe has seen is marked
 * TODO(unsourced) rather than guessed.
 *
 * Paths are RELATIVE (no leading slash) so the instance in `baseURL` — including
 * `/preprod1/` — is kept. The caller must already be signed in as `bo`.
 */

import type { Page, Download } from "@playwright/test";
import { step } from "@fixtures/step";

export type BoListingKind = "stms" | "apt";
export type BoRow = Record<string, string>;

export const BO_LISTING_PATH: Record<BoListingKind, string> = {
  stms: "view/stms/enquiry", // bo-stms-reset-probe, bo-reset-link-map
  apt: "view/apt/enquiry", // bo-reset-link-map
};
export const BO_RESET_REPORT_PATH = "view/report/reset-payment-report"; // bo-stms-reset-probe
export const BO_MANUAL_TRIGGER_PATH = "view/stms/manual-trigger-apt"; // 12403 post: boTriggerApt

/** Collapse every kind of whitespace (incl. NBSP / zero-width) and trim. */
export const clean = (x: string | undefined | null): string =>
  String(x ?? "").replace(/[\s ​‌‍﻿]+/g, " ").trim();

/** Set a jQuery-UI datepicker (they reject typing); falls back to dd/mm/yyyy text. */
async function setDatepicker(page: Page, selector: string, date: Date | null): Promise<void> {
  await page.locator(selector).evaluate((el, iso) => {
    const $ = (window as any).jQuery;
    const isDp = $ && $(el).hasClass("hasDatepicker");
    if (iso === null) {
      if (isDp) $(el).datepicker("setDate", null);
      (el as HTMLInputElement).value = "";
      return;
    }
    const d = new Date(iso);
    if (isDp) $(el).datepicker("setDate", d);
    else (el as HTMLInputElement).value = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
  }, date ? date.toISOString() : null);
}

export class BoTransactionsPage {
  constructor(private readonly page: Page) {}

  // ------------------------------------------------------------- listings

  /**
   * Search a BO listing by vehicle number (`#vehicleNo`, `#to-search`).
   * Waits for the row to appear rather than sleeping a fixed time; a vehicle
   * with no row leaves the page showing its empty state and returns false.
   */
  @step("Search a BO transaction listing")
  async searchListing(kind: BoListingKind, vehicleNo: string): Promise<boolean> {
    await this.page.goto(BO_LISTING_PATH[kind]);
    await this.page.fill("#vehicleNo", vehicleNo);
    await this.page.click("#to-search");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    return this.page
      .locator("table tr", { hasText: vehicleNo })
      .first()
      .waitFor({ timeout: 15_000 })
      .then(() => true)
      .catch(() => false);
  }

  /**
   * The listing row for a vehicle (optionally narrowed by transaction no.),
   * keyed by column header, own cells only. Nested tables are skipped by
   * requiring more than 6 own `<td>`s. Null when no row matches.
   */
  async readRow(vehicleNo: string, txNo?: string): Promise<BoRow | null> {
    const raw = await this.page.evaluate(({ v, t }) => {
      const norm = (x: string) => x.replace(/\s+/g, " ").trim();
      const own = (tr: Element) => Array.from(tr.children).filter((c) => c.tagName === "TD");
      const tr = Array.from(document.querySelectorAll("tr")).find(
        (r) => own(r).length > 6 && norm(r.textContent || "").includes(v) && (!t || norm(r.textContent || "").includes(t)),
      );
      if (!tr) return null;
      const table = tr.closest("table")!;
      const header = Array.from(table.querySelectorAll("tr")).find((h) => h.querySelectorAll(":scope > th").length > 4);
      const ths = header ? Array.from(header.querySelectorAll(":scope > th")) : [];
      const out: Record<string, string> = {};
      for (const th of ths) {
        const r = th.getBoundingClientRect();
        const td = own(tr).find((c) => {
          const b = c.getBoundingClientRect();
          const m = b.left + b.width / 2;
          return m >= r.left && m <= r.right;
        });
        if (td) out[norm(th.textContent || "")] = norm(td.textContent || "");
      }
      return out;
    }, { v: vehicleNo, t: txNo });
    if (!raw) return null;
    return Object.fromEntries(Object.entries(raw).map(([k, val]) => [clean(k), clean(val)]));
  }

  // ---------------------------------------------------------------- reset

  /** The row's Reset link. `a.resetPayment` with the tx no. in its title — bo-reset-link-map. */
  resetLink(txNo: string) {
    return this.page.locator(`a.resetPayment[title*="${txNo}"]`);
  }

  /**
   * Press Reset on ONE transaction and confirm.
   *
   * eAuto raises a native browser dialog AND/OR a jQuery-UI one depending on the
   * build (both seen in the probes), so both are accepted. Returns every message
   * the screens showed, for the report.
   */
  @step("Press Reset Payment on a BO row")
  async pressReset(txNo: string): Promise<string[]> {
    const messages: string[] = [];
    const onDialog = (d: import("@playwright/test").Dialog) => {
      messages.push(`browser dialog: ${d.message()}`);
      d.accept().catch(() => undefined);
    };
    this.page.on("dialog", onDialog);
    try {
      await this.resetLink(txNo).first().click();
      const yes = this.page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/ }).first();
      if (await yes.isVisible({ timeout: 6_000 }).catch(() => false)) {
        messages.push("dialog: " + clean(await this.page.locator(".ui-dialog:visible").first().innerText()));
        await yes.click();
      }
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      await this.page.waitForTimeout(2_500); // no completion signal was found in the probes — TODO(unsourced)
      const after = clean((await this.page.locator(".ui-dialog:visible").allInnerTexts().catch(() => [])).join(" "));
      if (after) messages.push("after: " + after);
      const ok = this.page.locator(".ui-dialog-buttonpane button").first();
      if (await ok.isVisible().catch(() => false)) await ok.click();
    } finally {
      this.page.off("dialog", onDialog);
    }
    return messages;
  }

  // -------------------------------------------------------- reset report

  /**
   * Reset Payment Report, filtered by VEHICLE NO. (Dev 29.09: it is filtered by
   * vehicle, not by date — a date filter missed STMS resets). Clears both payment
   * dates, ticks `#select_all`, presses `#to-generate`, waits out "Working...".
   * The report may open in a new tab; returns the page that holds the result.
   */
  @step("Generate the Reset Payment Report for a vehicle")
  async generateResetReport(vehicleNo: string): Promise<{ view: Page; text: string }> {
    await this.page.goto(BO_RESET_REPORT_PATH);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    for (const id of ["#paymentFrom", "#paymentTo"]) await setDatepicker(this.page, id, null);
    await this.page.locator("#vehicleNo").fill(vehicleNo);
    await this.page.locator("#select_all").check().catch(() => undefined);
    const pop = this.page.context().waitForEvent("page", { timeout: 20_000 }).catch(() => null);
    await this.page.click("#to-generate");
    await this.page.getByText("Working...").waitFor({ state: "visible", timeout: 5_000 }).catch(() => undefined);
    await this.page.getByText("Working...").waitFor({ state: "hidden", timeout: 150_000 }).catch(() => undefined);
    await this.page.waitForTimeout(1_500);
    const tab = await Promise.race([pop, this.page.waitForTimeout(2_000).then(() => null)]);
    const view = tab ?? this.page;
    if (tab) await tab.waitForLoadState("load").catch(() => undefined);
    return { view, text: clean(await view.evaluate(() => document.body.innerText)) };
  }

  // ------------------------------------------------------ manual APT trigger

  /**
   * Manual APT Trigger: search the STMS vehicle + its company ROC.
   * `#vehicleRegNo`, `#companyRoc`, `#to-search` — bo-apt-trigger-map.
   */
  @step("Search the vehicle on Manual APT Trigger")
  async searchForTrigger(vehicleNo: string, companyRoc: string): Promise<void> {
    await this.page.goto(BO_MANUAL_TRIGGER_PATH);
    await this.page.fill("#vehicleRegNo", vehicleNo);
    await this.page.fill("#companyRoc", companyRoc);
    await this.page.click("#to-search");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.page.waitForTimeout(1_500); // the result renders after the AJAX search — TODO(unsourced): a signal to wait on
  }

  /**
   * Set the expiry, then press the stage button: `#jpjNotice` = 5.5 notice,
   * `#jpjPermanent` = 6.0 permanent. The date box is the first visible
   * `input.hasDatepicker` (12403 post: boTriggerApt).
   * TODO(unsourced): no probe has read a success message after the press, so this
   * returns nothing; confirm the outcome from the BO APT listing.
   */
  @step("Trigger an APT stage")
  async trigger(stage: "5.5" | "6.0", expiry: Date): Promise<void> {
    const onDialog = (d: import("@playwright/test").Dialog) => d.accept().catch(() => undefined);
    this.page.on("dialog", onDialog);
    try {
      const box = this.page.locator("input.hasDatepicker:visible").first();
      await box.evaluate((el, iso) => {
        (window as any).jQuery(el).datepicker("setDate", new Date(iso));
      }, expiry.toISOString());
      await this.page.locator(stage === "5.5" ? "#jpjNotice" : "#jpjPermanent").first().click();
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      await this.page.waitForTimeout(2_500);
    } finally {
      this.page.off("dialog", onDialog);
    }
  }

  // ------------------------------------------------- APT Transaction Details (added 26.10.2026, EAINT-12626)

  /**
   * The APT listing row's [View] (searched first with `searchListing("apt", …)`). Seen on staging /uat1/ 26.10.2026
   * (cr/EAINT-12626/03-spec/probes/p01): `<a href="/uat1/view/apt/enquiry/view.do?id=…&back=false" target="_blank"
   * title="to view A…">View</a>`: it opens a NEW TAB (open it with `ts.open()` so the TS tab follows). The row also
   * offers [Cancel] on a Pending APT: only the exact text "View" is matched here.
   */
  aptViewLink(vehicleNo: string) {
    return this.page.locator("table tr", { hasText: vehicleNo }).last().getByText("View", { exact: true }).first();
  }

  /**
   * BO APT Transaction Details, read from the page text only (read-only; seen on /uat1/ 26.10.2026 for A60347839,
   * probe p02): the heading "<vehicle> (Ref No.: A…) - Transaction Details <status>", every "Label:" cell, the
   * "Payment Details:" lines (up to "Payment Files:") and the "JPJ Transfer (Final Submission):" block (up to "Print").
   * Nothing on the page is pressed ("Update Special Remark" is never touched).
   */
  async readAptDetails(): Promise<{ heading: string; status: string; labels: string[]; paymentDetails: string[]; finalSubmission: string }> {
    const body = await this.page.locator("body").innerText();
    const lines = body.split(/\r?\n/);
    const head = lines.find((l) => /Transaction Details/.test(l)) ?? "";
    const status = clean(head.split("Transaction Details")[1] ?? "");
    const labels = [...new Set(lines.flatMap((l) => l.split("\t")).map((c) => clean(c)).filter((c) => /^[A-Za-z0-9][^:]{1,60}:$/.test(c)))];
    const between = (from: string, to: RegExp) => {
      const i = body.indexOf(from);
      if (i === -1) return "";
      const rest = body.slice(i + from.length);
      const j = rest.search(to);
      return j === -1 ? rest : rest.slice(0, j);
    };
    const paymentDetails = between("Payment Details:", /Payment Files:/)
      .split(/\r?\n/)
      .map((l) => clean(l))
      .filter(Boolean)
      .reduce<string[]>((acc, l) => {
        if (/^\d+\.$/.test(l)) acc.push(l); // the number cell on its own line
        else if (/^\d+\.\s/.test(l) || !acc.length) acc.push(l);
        else acc[acc.length - 1] = `${acc[acc.length - 1]} ${l}`;
        return acc;
      }, [])
      .map((l) => clean(l));
    return { heading: clean(head), status, labels, paymentDetails, finalSubmission: clean(between("JPJ Transfer (Final Submission):", /\bPrint\b|Special Remark/)) };
  }

  // --------------------------------------------------------------- export

  /**
   * Search a listing by Tx Status and press `#to-export`. The listing filter is
   * `#to-filter`, dates `#fromDate` / `#toDate` (dd-mm-yyyy in the probe) —
   * bo-export-probe and 12403 post: reset population. Returns the download.
   * The export can take a while; 90 s matches the runs that used it.
   */
  @step("Export a BO listing by Tx Status")
  async exportByStatus(kind: BoListingKind, status: string, from: Date, to: Date): Promise<Download> {
    await this.page.goto(BO_LISTING_PATH[kind]);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await setDatepicker(this.page, "#fromDate", from);
    await setDatepicker(this.page, "#toDate", to);
    await this.page.selectOption("#to-filter", { label: status });
    await this.page.click("#to-search");
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.page.waitForTimeout(2_500);
    this.page.once("dialog", (d) => d.accept().catch(() => undefined));
    const [dl] = await Promise.all([this.page.waitForEvent("download", { timeout: 90_000 }), this.page.click("#to-export")]);
    return dl;
  }
}
