/**
 * CIBO — Transaction Management (`/cibo/transaction-management`): the Transaction Listing of Secarang AND eAuto
 * insurance transactions [team doc §6–8; walk 28.10.2026].
 *
 * Filters (ng-select `formcontrolname`) [walk: cibo-map discover + before-walk]:
 *   platform        Secarang (> Secarang only, Secarang-MK), eAuto
 *   insuranceComp   agency groups: Bintang Prospek (Chubb, RHB, Takaful Malaysia) · Pemaju Eksklusif (Lonpac,
 *                   TokioMarine — ONE word, Zurich Takaful) · Serba Sentral (Allianz, eTiqa)
 *   dateRange       Transaction Creation Date, Insurance Creation Date;  dates fromDate / toDate (pickers)
 *   status          Cancelled, Failed, Insurance created, Pending approval, Pending payment, Quotation, Quotation expired
 *   jpjStatus       Not available, Pending, Rejected, Accepted;   roadTax;   discountCode
 *   search          free text: finds a Transaction Ref. No.
 * Columns: # · Transaction Ref. No. · Transaction Created Date · Insurance Created Date · UCD · UCD Name ·
 * Vehicle No · Vehicle Type · Insured · Payment · Payment Mode · Discount Code · Road Tax · Ins. Co. ·
 * Transaction Status · JPJ · Remark. Secarang rows show a literal "-" in the UCD columns (a rule, team doc §6).
 * The Ref. No. opens Transaction Details in the same tab.
 * Print / Export are never pressed here.
 */

import { expect, type Locator, type Page } from "@playwright/test";
import { step } from "@fixtures/step";
import { CiboPage, type CiboRow } from "./cibo.page";

export interface CiboTransactionFilter {
  platform?: string[];
  /** Filter values as the list shows them, e.g. "Allianz", "TokioMarine", or a group "Serba Sentral". */
  insuranceCompany?: string[];
  dateRangeType?: "Transaction Creation Date" | "Insurance Creation Date";
  from?: Date;
  till?: Date;
  status?: string[];
  jpjStatus?: string[];
  roadTax?: string[];
  discountCode?: string[];
  /** Free text, e.g. a Transaction Ref. No. */
  text?: string;
}

export const TM_REF_COLUMN = "Transaction Ref. No.";

export class CiboTransactionManagementPage extends CiboPage {
  constructor(page: Page) {
    super(page);
  }

  async isShown(): Promise<boolean> {
    return /\/transaction-management(\?|$)/.test(this.page.url());
  }

  /** Set the filters (each only when given) and press Search; returns the rows. */
  @step("Search the CIBO Transaction Listing")
  async searchListing(f: CiboTransactionFilter = {}): Promise<CiboRow[]> {
    await this.settle(); // the page's own first load must finish first (team doc §10)
    if (f.platform) await this.pick("platform", f.platform);
    if (f.insuranceCompany) await this.pick("insuranceComp", f.insuranceCompany);
    if (f.dateRangeType) await this.pick("dateRange", [f.dateRangeType]);
    if (f.till) await this.pickDate("toDate", f.till); // till first: the two calendars limit each other
    if (f.from) await this.pickDate("fromDate", f.from);
    if (f.status) await this.pick("status", f.status);
    if (f.jpjStatus) await this.pick("jpjStatus", f.jpjStatus);
    if (f.roadTax) await this.pick("roadTax", f.roadTax);
    if (f.discountCode) await this.pick("discountCode", f.discountCode);
    if (f.text !== undefined) await this.searchText(f.text);
    const status = await this.search();
    if (await this.searchFailed(status)) throw new Error(`CIBO Transaction Listing search answered HTTP ${status}.`);
    return this.readTable(TM_REF_COLUMN);
  }

  /** Search by Ref. No. and return that row (the Ref. No. cell also carries the platform badge). */
  @step("Find a CIBO transaction by Ref. No.")
  async findByRef(ref: string, f: Omit<CiboTransactionFilter, "text"> = {}): Promise<CiboRow> {
    const rows = await this.searchListing({ ...f, text: ref });
    const row = rows.find((r) => (r[TM_REF_COLUMN] ?? "").split(" ")[0] === ref || (r[TM_REF_COLUMN] ?? "").startsWith(ref));
    if (!row) {
      throw new Error(`CIBO Transaction Listing: no row for ${ref} (${rows.length} row(s) shown${(await this.noResult()) ? ', "no search result found"' : ""}).`);
    }
    return row;
  }

  /**
   * Search by a vehicle PLATE (the free-text box finds a plate: probe 29.10.2026,
   * cr/EAINT-12406/03-spec/probes-author/cibo-search-by-plate.mjs) and return that plate's rows, newest first
   * (by "Transaction Created Date", dd-mm-yyyy hh:mm). `since` drops rows created before it (minute precision,
   * one minute of slack): the team's made-up plates are shared, so older rows of the same plate are someone else's.
   */
  @step("Find CIBO transactions by plate")
  async findByPlate(plate: string, since?: Date, f: Omit<CiboTransactionFilter, "text"> = {}): Promise<CiboRow[]> {
    const rows = await this.searchListing({ ...f, text: plate });
    const created = (r: CiboRow) => {
      const m = /(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})/.exec(r["Transaction Created Date"] ?? "");
      return m ? new Date(+m[3], +m[2] - 1, +m[1], +m[4], +m[5]).getTime() : 0;
    };
    const floor = since ? since.getTime() - 60_000 - (since.getTime() % 60_000) : -Infinity;
    return rows
      .filter((r) => (r["Vehicle No"] ?? "").split(" ")[0].toUpperCase() === plate.toUpperCase())
      .filter((r) => created(r) >= floor)
      .sort((a, b) => created(b) - created(a));
  }

  /** The visible listing row whose Ref. No. cell starts with `ref` (to outline it in a screenshot). */
  row(ref: string) {
    return this.page.locator("table tbody tr").filter({ visible: true }).filter({ has: this.page.getByText(ref, { exact: true }) }).first();
  }

  /** Click the Ref. No. and wait for Transaction Details. */
  @step("Open CIBO Transaction Details")
  async openDetails(ref: string): Promise<void> {
    const link = this.page.locator("table tbody").getByText(ref, { exact: true }).first();
    await this.requireVisible(link, `Ref. No. ${ref}`);
    await link.click();
    await expect(this.page).toHaveURL(/\/transaction-details\//, { timeout: 60_000 });
    await this.settle();
  }

  // ---------------------------------------------------------------- added 29.10.2026 for EAINT-12406 sheet RC
  // Probe (read only) cr/EAINT-12406/03-spec/probes-automation/rc-cibo-markup.mjs, row of BR55004010.

  /** One cell of the row of `ref`, by column header (to outline it). */
  async cell(ref: string, column: string): Promise<Locator> {
    const heads = (await this.page.locator("table thead th").allInnerTexts()).map((h) => h.replace(/\s+/g, " ").trim());
    const i = heads.indexOf(column);
    if (i < 0) throw new Error(`CIBO Transaction Listing has no column "${column}" (columns: ${heads.join(" | ")}).`);
    return this.row(ref).locator("td").nth(i);
  }

  /**
   * The badges in the row of `ref`, per column: Ref. No. → platform badge `span.ia-badge` ("Secarang"); Payment →
   * `span.ok-badge` "Paid" / `span.pending-badge` "Pending"; Ins. Co. → the agency badge (`span.serba-sentral-badge`
   * "Serba Sentral" on Allianz) under the insurer's name. Text, class and computed colours, to compare one row's
   * styling with another's. Reads only.
   */
  async rowBadges(ref: string): Promise<Record<string, { text: string; cls: string; background: string; color: string }[]>> {
    const heads = (await this.page.locator("table thead th").allInnerTexts()).map((h) => h.replace(/\s+/g, " ").trim());
    const row = this.row(ref);
    if (!(await row.count())) return {};
    const cells = await row.locator("td").evaluateAll((tds) =>
      tds.map((td) =>
        Array.from(td.querySelectorAll("span.badge")).map((b) => ({
          text: (b.textContent || "").replace(/\s+/g, " ").trim(),
          cls: (b as HTMLElement).className.split(/\s+/).filter((c) => !/^ng-/.test(c)).join(" "),
          background: getComputedStyle(b).backgroundColor,
          color: getComputedStyle(b).color,
        })),
      ),
    );
    return Object.fromEntries(cells.map((b, i) => [heads[i] ?? `col${i}`, b]).filter(([, b]) => (b as unknown[]).length));
  }

  // ---------------------------------------------------------------- added 29.10.2026 (EAINT-12406 RC_TS4 triage)
  // Run eaint-12406-run-sRC-20261029-1330: a search's Ref. No. stayed in the Search box (searchListing only types
  // when `text` is given, and the sidebar link does not reset the page), so the next search listed nothing. Not
  // used by cibo.flow.ts.

  /**
   * Empty the filter block before a search: "Clear all" (verify run c2 29.10.2026, EAINT-12406-verify-cibo-c2: it
   * leaves every select empty except Date Range Type "Transaction Creation Date", both dates and the Search box
   * empty), then anything still filled is removed by hand (each chip by its "×", the Search box emptied). Throws
   * naming what is left (a date can only be emptied by Clear all: the pickers are read-only). Clear all re-runs the
   * listing (a read); nothing is saved. Returns the state read back.
   */
  @step("Reset the CIBO Transaction Listing filters")
  async resetFilters(): Promise<Awaited<ReturnType<CiboPage["filterState"]>>> {
    await this.settle();
    await this.clearAll();
    let st = await this.filterState();
    for (const s of st.selects) if (s.control !== "dateRange" && s.values.length) await this.clearSelect(s.control);
    if (st.inputs.find((i) => i.control === "search")?.value) await this.searchText("");
    st = await this.filterState();
    const left = [
      ...st.selects.filter((s) => s.control !== "dateRange" && s.values.length).map((s) => `${s.control} = ${s.values.join(", ")}`),
      ...st.inputs.filter((i) => i.value).map((i) => `${i.control} = "${i.value}"`),
    ];
    if (left.length) throw new Error(`CIBO Transaction Listing: filters still filled after Clear all: ${left.join("; ")}.`);
    return st;
  }
}
