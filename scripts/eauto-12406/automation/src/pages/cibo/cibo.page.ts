/**
 * CIBO — what every listing screen of the insurance back office shares (knowledge/portals/cibo/portal.md
 * "Shared screen pattern"; walks of 28.10.2026: cr/EAINT-12406/04-explore/2026-10-28-before-deploy/ and
 * 2026-10-28-cibo-map/, scripts in cr/EAINT-12406/03-spec/before-walk/ and cibo-map/).
 *
 *  - A listing has a filter block, a free-text search box (`input[formcontrolname="search"]`), [Search] and
 *    "Clear all". **Most listings show no table until [Search]** is pressed.
 *  - Filters are **ng-select** multi-selects: open `ng-select[formcontrolname=<c>] .ng-select-container`, click
 *    `ng-dropdown-panel .ng-option` (agency headers are `.ng-optgroup`; ticking one ticks its insurers).
 *  - Dates are read-only **ngb date pickers**: click, never type (`ngb-datepicker` month / year selects + day).
 *  - A search is a read-only `POST …/page` (reports add `…/summary`); a spinner `.ia-spinner` /
 *    `.spinner-border` shows meanwhile.
 *  - **Wait for the first load before searching**: opening a listing starts a slow load, and a search sent
 *    before it ends can be overtaken by that answer, which then replaces the filtered rows (team doc §10).
 *
 * Shared, read-only helpers only. Nothing here presses Print, Export, Create, Save, Edit, Duplicate or Send.
 * Faizuddin's code had no CIBO automation (his knowledge/cibo.md is notes only); this is ours, from the walks.
 */

import type { Download, Locator, Page, Response } from "@playwright/test";
import { BasePage } from "../base.page";

export const clean = (x: string | null | undefined): string => String(x ?? "").replace(/[\s ]+/g, " ").trim();

export type CiboRow = Record<string, string>;

/** Escape a string for a RegExp. */
const rx = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export abstract class CiboPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  spinner(): Locator {
    return this.page.locator(".ia-spinner, .spinner-border");
  }

  /** Network quiet and no spinner (the CRM search takes ~9 s, a broad Payment Report ~2 min). */
  async settle(timeoutMs = 240_000): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: timeoutMs }).catch(() => undefined);
    const t0 = Date.now();
    while (Date.now() - t0 < timeoutMs && (await this.spinner().filter({ visible: true }).count())) {
      await this.page.waitForTimeout(800);
    }
  }

  /**
   * Open an ng-select's option list by its ARROW (`.ng-arrow-wrapper`). Never by the middle of the box: once values
   * are ticked the box is full of chips and its middle is a chip's "×", so a click there REMOVES a value and opens
   * nothing (probe cr/EAINT-12406/03-spec/probes-automation/rc-cibo-pm-reopen9.mjs, 29.10.2026: Payment Channel
   * after the FPX group, 19 chips, centre = `span.ng-value-icon`). Falls back to the box when there is no arrow.
   */
  async openSelect(control: string): Promise<Locator> {
    const sel = this.page.locator(`ng-select[formcontrolname="${control}"]`).filter({ visible: true }).first();
    const panel = this.page.locator("ng-dropdown-panel").first();
    if (await panel.isVisible().catch(() => false)) return panel;
    const arrow = sel.locator(".ng-arrow-wrapper");
    if (await arrow.isVisible().catch(() => false)) await arrow.click();
    else await sel.locator(".ng-select-container").click({ position: { x: 8, y: 8 } });
    await panel.waitFor({ state: "visible", timeout: 10_000 });
    return panel;
  }

  /**
   * Remove every value ticked in an ng-select, by each chip's own "×" (`.ng-value .ng-value-icon`; the select's
   * clear-all button is display:none on CIBO). The filter state outlives a search, and clicking the same sidebar link
   * again does NOT reset the page (probe rc-cibo-pm-reopen9, 29.10.2026), so a search that sets a filter clears it
   * first. Returns how many values were removed. Changes the filter only (nothing is searched or saved).
   */
  async clearSelect(control: string): Promise<number> {
    const chips = this.page.locator(`ng-select[formcontrolname="${control}"] .ng-value .ng-value-icon`).filter({ visible: true });
    let n = 0;
    for (; n < 60 && (await chips.count()); n++) await chips.first().click();
    if (n) await this.page.keyboard.press("Escape");
    return n;
  }

  /** The values an ng-select filter offers (opens and closes it). Reads only. */
  async filterOptions(control: string): Promise<string[]> {
    await this.openSelect(control);
    const values = (await this.page.locator("ng-dropdown-panel .ng-option").allInnerTexts()).map(clean).filter(Boolean);
    await this.page.keyboard.press("Escape");
    return values;
  }

  /**
   * Set an ng-select filter to these values, each by its exact text (insurer, status …, or an agency group header
   * such as "Serba Sentral"): values ticked before are removed first. Throws naming the value the list does not offer.
   */
  async pick(control: string, values: string[]): Promise<void> {
    await this.clearSelect(control); // the filter becomes exactly `values` (a value left from an earlier search would stay ticked)
    for (const v of values) {
      const panel = await this.openSelect(control);
      const exact = new RegExp(`^\\s*${rx(v)}\\s*$`);
      const option = panel.locator(".ng-option").filter({ hasText: exact }).or(panel.locator(".ng-optgroup").filter({ hasText: exact })).first();
      if (!(await option.isVisible().catch(() => false))) {
        const offered = (await panel.locator(".ng-option, .ng-optgroup").allInnerTexts()).map(clean).join(" | ");
        await this.page.keyboard.press("Escape");
        throw new Error(`CIBO filter "${control}" offers no "${v}" (offered: ${offered}).`);
      }
      await option.click();
      await this.page.keyboard.press("Escape");
    }
  }

  /**
   * Pick a date in a read-only ngb date picker (click the input, set the year and month selects, click the
   * day). The day is a `[ngbdatepickerdayview]` of the shown month; days of the next / previous month carry
   * ngb-bootstrap's `outside` class and are skipped (that class is the library's; the walks only ever picked
   * day 1). The two calendars of a pair limit each other: move a window later by setting "till" first
   * (team doc §8).
   */
  async pickDate(control: string, date: Date): Promise<string> {
    await this.page.locator(`input[formcontrolname="${control}"]`).click();
    const dp = this.page.locator("ngb-datepicker").filter({ visible: true }).first();
    await dp.waitFor({ state: "visible", timeout: 10_000 });
    await dp.locator("select[title='Select year'], select[aria-label='Select year']").selectOption(String(date.getFullYear()));
    await dp.locator("select[title='Select month'], select[aria-label='Select month']").selectOption(String(date.getMonth() + 1));
    await dp
      .locator("[ngbdatepickerdayview]:not(.outside), .ngb-dp-day:not(.hidden) .btn-light:not(.outside)")
      .filter({ hasText: new RegExp(`^\\s*${date.getDate()}\\s*$`) })
      .first()
      .click();
    return this.page.locator(`input[formcontrolname="${control}"]`).inputValue();
  }

  /** Type into the listing's free-text box (Ref. No., plate, name …). */
  async searchText(text: string): Promise<void> {
    await this.page.locator("input[formcontrolname='search']").filter({ visible: true }).first().fill(text);
  }

  /**
   * Press [Search] and wait for ITS answer: the `POST …/page` sent after the click, then the spinner. Returns
   * the HTTP status of that answer.
   */
  async search(): Promise<number> {
    const req = this.page.waitForRequest((r) => r.method() === "POST" && /\/page(\?|$)/.test(r.url()), { timeout: 60_000 });
    await this.page.getByRole("button", { name: "Search", exact: true }).filter({ visible: true }).first().click();
    const sent = await req;
    const res = await sent.response();
    await this.settle();
    return res?.status() ?? 0;
  }

  /**
   * The listing table (the one whose header has `column`) as rows keyed by header text, visible rows only.
   * Cells are read as the page shows them, e.g. Payment "RM884.48Paid 07-10-2026 10:20" (no space before
   * the badge: a word-boundary match on "Paid" fails, team doc §10).
   */
  async readTable(column: string): Promise<CiboRow[]> {
    return this.page.evaluate((col) => {
      const norm = (s: string | null) => (s || "").replace(/\s+/g, " ").trim();
      const table = Array.from(document.querySelectorAll("table")).find((t) =>
        Array.from(t.querySelectorAll("thead th")).some((th) => norm(th.textContent) === col),
      );
      if (!table) return [];
      const heads = Array.from(table.querySelectorAll("thead th")).map((th) => norm(th.textContent));
      return Array.from(table.querySelectorAll("tbody tr"))
        .filter((tr) => (tr as HTMLElement).offsetParent !== null)
        .map((tr) => {
          const out: Record<string, string> = {};
          Array.from(tr.children).forEach((td, i) => {
            const h = heads[i] || `col${i}`;
            out[h] = norm((td as HTMLElement).innerText || td.textContent);
          });
          return out;
        })
        .filter((r) => Object.values(r).some(Boolean));
    }, column);
  }

  /**
   * Blur the customer's details on screen before a screenshot (style only, nothing typed or sent). Transaction
   * Details: the left column (Car Owner Details, Car Details, Payment Details) and the name above "Ref. No:";
   * the insurer box on the right stays sharp. Listings: the Insured, Vehicle No and UCD Name cells. Ported from
   * the EAINT-12406 BEFORE run 28.10.2026 (cr/EAINT-12406/03-spec/before-run/ts-before.mjs `blurPersonal`,
   * whose `*-blurred.png` screenshots were checked). The video still shows the page as it came.
   */
  async blurPersonalData(): Promise<void> {
    await this.page.evaluate(() => {
      const blur = (el: Element | null | undefined) => { if (el) (el as HTMLElement).style.filter = "blur(7px)"; };
      const smallest = (must: string[], mustNot: string[] = []) => {
        let best: { el: Element; a: number } | null = null;
        for (const el of Array.from(document.querySelectorAll("div, section, table, tbody"))) {
          const t = (el as HTMLElement).innerText || "";
          if (must.every((m) => t.includes(m)) && !mustNot.some((m) => t.includes(m))) {
            const r = el.getBoundingClientRect();
            if (r.width > 50 && (!best || r.width * r.height < best.a)) best = { el, a: r.width * r.height };
          }
        }
        return best ? best.el : null;
      };
      if (location.pathname.includes("transaction-details")) {
        blur(smallest(["Car Owner Details", "Payment Details"], ["More Info", "Policy No"]));
        const ref = Array.from(document.querySelectorAll("body *")).find((e) => e.children.length === 0 && /^Ref\. No:/.test((e.textContent || "").trim()));
        if (ref) blur(ref.previousElementSibling ?? ref.parentElement?.previousElementSibling);
      }
      const ths = Array.from(document.querySelectorAll("table thead th")).map((t) => (t as HTMLElement).innerText.replace(/\s+/g, " ").trim());
      for (const col of ["Insured", "Vehicle No", "UCD Name"]) {
        const i = ths.indexOf(col);
        if (i >= 0) document.querySelectorAll("table tbody tr").forEach((tr) => blur(tr.children[i]));
      }
    });
    await this.page.waitForTimeout(400);
  }

  /** The pager text ("« 1 2 3 4 5 … N »"), "" when none. */
  async pagerText(): Promise<string> {
    return clean(await this.page.locator("ngb-pagination").first().innerText().catch(() => ""));
  }

  /**
   * Did the search fail? An HTTP error, EXCEPT the empty result: CIBO answers a search with no rows by HTTP 404 and the
   * page shows "Ops, no search result found" (Payment Listing, verify run c1 29.10.2026). That is an empty listing.
   */
  async searchFailed(status: number): Promise<boolean> {
    if (status < 400) return false;
    return !(status === 404 && (await this.noResult()));
  }

  /** "Ops, no search result found" [walk 28.10.2026]. */
  async noResult(): Promise<boolean> {
    return this.page.getByText(/no search result found/i).filter({ visible: true }).first().isVisible().catch(() => false);
  }

  /**
   * A report's "Summary Report for <from> - <till>" block (Payment Report, Commission Report): the period and
   * the block's text. The totals are returned as text because their markup has not been read yet.
   */
  async summary(): Promise<{ period: string; text: string }> {
    const head = this.page.getByText(/Summary Report for/).filter({ visible: true }).first();
    if (!(await head.isVisible().catch(() => false))) return { period: "", text: "" };
    const period = clean((/Summary Report for\s*(.*)/.exec(await head.innerText()) || ["", ""])[1]);
    const text = clean(await head.locator("xpath=ancestor::*[contains(@class,'card')][1]").innerText().catch(async () => head.locator("xpath=..").innerText()));
    return { period, text };
  }

  // ---------------------------------------------------------------- added 29.10.2026 for EAINT-12406 sheet RC
  // Probes (read only) cr/EAINT-12406/03-spec/probes-automation/rc-cibo-markup.mjs, -markup2, -export3, -export4,
  // -clear5, -pm6 on Transaction Management, Payment Management, Payment Report and Commission Report.

  /**
   * An ng-select's options grouped as the panel shows them: each `.ng-optgroup` header (agency on Insurance
   * Company; "Credit / Debit Card", "FPX Online Banking", "Fiuu - eWallet" … on Payment Channel) followed by its
   * `.ng-option.ng-option-child` items; a list without groups comes back as one group "". Opens and closes it.
   * [rc-cibo-markup: insuranceComp = Bintang Prospek (Chubb, RHB, Takaful Malaysia) · Pemaju Eksklusif (Lonpac,
   * TokioMarine, Zurich Takaful) · Serba Sentral (Allianz, eTiqa)]
   */
  async filterGroups(control: string): Promise<{ group: string; options: string[] }[]> {
    await this.openSelect(control);
    const groups = await this.page.evaluate(() => {
      const norm = (s: string | null) => (s || "").replace(/\s+/g, " ").trim();
      const out: { group: string; options: string[] }[] = [];
      for (const e of Array.from(document.querySelectorAll("ng-dropdown-panel .ng-optgroup, ng-dropdown-panel .ng-option"))) {
        if (e.classList.contains("ng-optgroup")) out.push({ group: norm(e.textContent), options: [] });
        else {
          if (!out.length) out.push({ group: "", options: [] });
          out[out.length - 1].options.push(norm(e.textContent));
        }
      }
      return out;
    });
    await this.page.keyboard.press("Escape");
    return groups;
  }

  /** Open an ng-select's panel and leave it open (for a screenshot); `closeFilter()` closes it. */
  async openFilter(control: string): Promise<Locator> {
    return this.openSelect(control);
  }

  async closeFilter(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }

  /**
   * Tick a group header (no `option`: ticks every item under it) or ONE item under a given group. Needed where the
   * same item name sits under two groups (Payment Channel "GrabPay" is under "eWallet" AND "Fiuu - eWallet"
   * [rc-cibo-markup]), which `pick()` (first exact match) cannot tell apart. Throws naming what the panel offers.
   * It TOGGLES (a ticked group is unticked): call `clearSelect(control)` first for a fresh filter.
   */
  async pickInGroup(control: string, group: string, option?: string): Promise<void> {
    const panel = await this.openSelect(control);
    const items = panel.locator(".ng-optgroup, .ng-option");
    const at = await this.page.evaluate(
      ({ group, option }) => {
        const norm = (s: string | null) => (s || "").replace(/\s+/g, " ").trim();
        let inGroup = false;
        const all = Array.from(document.querySelectorAll("ng-dropdown-panel .ng-optgroup, ng-dropdown-panel .ng-option"));
        for (const [i, e] of all.entries()) {
          if (e.classList.contains("ng-optgroup")) {
            inGroup = norm(e.textContent) === group;
            if (inGroup && !option) return i;
          } else if (inGroup && norm(e.textContent) === option) return i;
        }
        return -1;
      },
      { group, option },
    );
    if (at < 0) {
      const offered = (await items.allInnerTexts()).map(clean).join(" | ");
      await this.page.keyboard.press("Escape");
      throw new Error(`CIBO filter "${control}" has no ${option ? `"${option}" under ` : ""}group "${group}" (offered: ${offered}).`);
    }
    await items.nth(at).click();
    await this.page.keyboard.press("Escape");
  }

  /**
   * What the filter block holds now: each ng-select's ticked chips (`.ng-value`, text without the "×") and each
   * `input[formcontrolname]` value (dates, search box). Reads only. [rc-cibo-clear5: a ticked value is
   * `div.ng-value` > `span.ng-value-icon` "×" + `span.ng-value-label`]
   */
  async filterState(): Promise<{ selects: { control: string; values: string[] }[]; inputs: { control: string; value: string }[] }> {
    return this.page.evaluate(() => ({
      selects: Array.from(document.querySelectorAll("ng-select[formcontrolname]"))
        .filter((s) => (s as HTMLElement).offsetParent !== null)
        .map((s) => ({
          control: s.getAttribute("formcontrolname") || "",
          values: Array.from(s.querySelectorAll(".ng-value")).map((v) => ((v.querySelector(".ng-value-label") || v).textContent || "").replace(/\s+/g, " ").trim()),
        })),
      inputs: Array.from(document.querySelectorAll("input[formcontrolname]"))
        .filter((i) => (i as HTMLElement).offsetParent !== null)
        .map((i) => ({ control: i.getAttribute("formcontrolname") || "", value: (i as HTMLInputElement).value })),
    }));
  }

  /** "Clear all" (`button.btn-link`). On Transaction Management it also re-runs the listing [rc-cibo-clear5]. */
  clearAllButton(): Locator {
    return this.page.getByRole("button", { name: "Clear all", exact: true }).filter({ visible: true }).first();
  }

  async clearAll(): Promise<void> {
    await this.requireVisible(this.clearAllButton(), "Clear all");
    await this.clearAllButton().click();
    await this.settle();
  }

  /** The listing card's "Export" (icon `bi-filetype-csv`) and "Print" buttons: shown only after a Search [rc-cibo-markup]. */
  exportButton(): Locator {
    return this.page.locator("button").filter({ hasText: /^\s*Export\s*$/ }).filter({ visible: true }).first();
  }

  printButton(): Locator {
    return this.page.locator("button").filter({ hasText: /^\s*Print\s*$/ }).filter({ visible: true }).first();
  }

  /**
   * Press Export and return the CSV download. A read: it downloads what the search shows, nothing is changed. Keep
   * the search narrow (team doc §8). Transaction Management → `Transaction_Management_<yyyymmddhhmm>.csv`, Payment
   * Report → `Payment_Report_….csv`, Commission Report → `Commission_Report_….csv`; no confirm box [rc-cibo-export3/4].
   */
  async exportCsv(): Promise<Download> {
    await this.requireVisible(this.exportButton(), "Export");
    const [dl] = await Promise.all([this.page.waitForEvent("download", { timeout: 120_000 }), this.exportButton().click()]);
    return dl;
  }

  /**
   * Press Print and show the print view. Print calls the browser's `window.print()` (no new tab; the page carries
   * a `d-print-block` print layout) [rc-cibo-markup]. The call is recorded instead of opening the system dialog, and
   * the page is then rendered with print CSS, which is what the printer gets. `endPrintView()` goes back to screen.
   *
   * `waitForPrintMs` (added 29.10.2026, EAINT-12406 RC_TS10 triage of run sRC-1545-c2): Print first FETCHES the
   * whole listing (Transaction Management: `POST …/insurance-transactions/main-page`, the search without paging), then
   * fills the `d-print-block` layout and calls `window.print()`. A fixed 1.5 s read it before that (narrow listing:
   * answer ~0.4 s, print() ~0.5 s after the click; after Clear all: answer HTTP 404 after ~125 s, print() never
   * called — read-only probes 03-spec/probes-automation/rc-tm-discount-print11.mjs, rc-tm-print-after-clear12.mjs).
   * With it, waits until `window.print()` was called or the time is up, and returns every POST answer that came in
   * after the click (`answers`) and how long it waited. Without it: the old fixed wait (cibo verify spec).
   */
  async printView(opts: { waitForPrintMs?: number } = {}): Promise<{ printCalls: number; waitedMs?: number; answers?: { url: string; status: number; afterMs: number }[] }> {
    await this.requireVisible(this.printButton(), "Print");
    await this.page.evaluate(() => {
      const w = window as unknown as { __qaPrintCalls?: number; print: () => void };
      w.__qaPrintCalls = 0;
      w.print = () => { w.__qaPrintCalls = (w.__qaPrintCalls ?? 0) + 1; };
    });
    const calls = () => this.page.evaluate(() => (window as unknown as { __qaPrintCalls?: number }).__qaPrintCalls ?? 0);
    let result: { printCalls: number; waitedMs?: number; answers?: { url: string; status: number; afterMs: number }[] };
    if (opts.waitForPrintMs === undefined) {
      await this.printButton().click();
      await this.page.waitForTimeout(1_500);
      result = { printCalls: await calls() };
    } else {
      const answers: { url: string; status: number; afterMs: number }[] = [];
      const t0 = Date.now();
      const onResponse = (r: Response) => {
        if (r.request().method() === "POST" && !/authenticate/.test(r.url())) answers.push({ url: r.url().replace(/^.*?\/ins-api/, "/ins-api"), status: r.status(), afterMs: Date.now() - t0 });
      };
      this.page.on("response", onResponse);
      try {
        await this.printButton().click();
        while (Date.now() - t0 < opts.waitForPrintMs && !(await calls())) await this.page.waitForTimeout(500);
        result = { printCalls: await calls(), waitedMs: Date.now() - t0, answers };
      } finally {
        this.page.off("response", onResponse);
      }
    }
    await this.page.emulateMedia({ media: "print" });
    await this.page.waitForTimeout(800);
    return result;
  }

  async endPrintView(): Promise<void> {
    await this.page.emulateMedia({ media: null });
  }
}

/**
 * Read a CIBO CSV export: line 1 the report title ("Transaction Management", "Payment Report Listing",
 * "Commission Report Listing"), line 2 blank, line 3 the header, then one quoted row per record [rc-cibo-export3/4].
 * The columns differ from the screen (Transaction Management: "Transaction Ref. No.", "Insurance Company", "Agency" …;
 * Payment Report: "Transaction Ref. No.", "Insurance Company", "Agency" …; Commission Report is a payout file:
 * "Recipient Reference" = "<plate>-<INSURER>", no Ref. No. or insurer column).
 */
export function readCiboCsv(text: string): { title: string; header: string[]; rows: Record<string, string>[] } {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  const cells = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (q) {
        if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c;
      } else if (c === '"') q = true;
      else if (c === ",") { out.push(cur); cur = ""; } else cur += c;
    }
    out.push(cur);
    return out.map((x) => x.replace(/\s+/g, " ").trim());
  };
  const h = lines.findIndex((l, i) => i > 0 && l.includes(","));
  if (h < 0) return { title: (lines[0] ?? "").trim(), header: [], rows: [] };
  const header = cells(lines[h]);
  const rows = lines.slice(h + 1).filter((l) => l.trim()).map((l) => Object.fromEntries(cells(l).map((v, i) => [header[i] ?? `col${i}`, v])));
  return { title: (lines[0] ?? "").trim(), header, rows };
}
