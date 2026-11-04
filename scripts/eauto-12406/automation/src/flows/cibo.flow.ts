/**
 * CIBO transaction look-up flow — find one insurance transaction by its Ref. No. and read it, READ ONLY. Same
 * shape as the other flows (`stopAfter`, defaults, a result carrying what the next step needs).
 *
 *   `login`    signed in (persona `cibo`), on the dashboard
 *   `listing`  Transaction Management opened from the sidebar, searched by `ref` (+ optional filters), the row read
 *   `details`  (default) the Ref. No. clicked: on Transaction Details, insurer box and document buttons read
 *   `receipt`  Receipt pressed: the PDF downloaded (it downloads directly; a final transaction only)
 *
 * By PLATE instead of Ref. No. (29.10.2026, EAINT-12406 E2E sheet: a Secarang purchase gives a Receipt No., not
 * the CIBO Ref. No.): pass `plate` (+ `since`, the TS's start, because the team's made-up plates are shared) and,
 * for a paid purchase, `receiptNo` from the Secarang success page. The newest rows of that plate are opened in
 * turn until Transaction Details shows that Receipt No (Payment Details); without `receiptNo` the newest row
 * since `since` is taken. The listing row returned is the matched one, and `ref` is set from it. `listing` with
 * `plate` still opens Transaction Details to match the Receipt No, then comes back to the searched listing.
 *
 * Every Secarang payment test needs this check: CIBO is the only place a Secarang purchase can be seen after
 * payment, and an eAuto insurance transaction is checked in UCD, BO and CIBO (team doc §6, §7;
 * knowledge/portals/cibo/portal.md). Screens and traps: `src/pages/cibo/`.
 *
 * Side effects: none (searches are read-only POSTs; Print / Export never pressed). The details page and the
 * receipt show the customer's personal data: evidence from them stays out of git and off boards as it is.
 *
 * Faizuddin's automation had no CIBO part (his knowledge/cibo.md is notes); written 28.10.2026 from the
 * EAINT-12406 walks (cr/EAINT-12406/03-spec/before-walk/, cibo-map/).
 * Register: UNVERIFIED (src/flows/README.md).
 */

import type { Download, Page } from "@playwright/test";
import type { PersonaKey } from "@config/personas";
import { CiboLoginPage } from "@pages/cibo/cibo-login.page";
import { CiboSidebar } from "@pages/cibo/cibo-sidebar.page";
import { CiboTransactionManagementPage, type CiboTransactionFilter } from "@pages/cibo/transaction-management.page";
import { CiboTransactionDetailsPage } from "@pages/cibo/transaction-details.page";
import type { CiboRow } from "@pages/cibo/cibo.page";

export type CiboStep = "login" | "listing" | "details" | "receipt";
const ORDER: CiboStep[] = ["login", "listing", "details", "receipt"];

export interface CiboScenario {
  /** Transaction Ref. No., e.g. "BR69005852". Needed from `listing` unless `plate` is given. */
  ref?: string;
  /** Look the transaction up by plate instead (see the header). */
  plate?: string;
  /** With `plate`: ignore rows created before this (minute precision). */
  since?: Date;
  /** With `plate`: the Secarang Receipt No. the transaction must carry (Transaction Details > Payment Details). */
  receiptNo?: string;
  /** Extra listing filters (e.g. insuranceCompany ["TokioMarine"]) to narrow a slow search. */
  filter?: Omit<CiboTransactionFilter, "text">;
  /** Default "cibo". */
  persona?: PersonaKey;
  /** True when this tab is already signed in to CIBO (e.g. a second look-up in the same TS). */
  signedIn?: boolean;
  /** Default "details". */
  stopAfter?: CiboStep;
}

export interface CiboResult {
  stoppedAfter: CiboStep;
  ref?: string;
  welcome?: string;
  row?: CiboRow;
  detailsUrl?: string;
  insurer?: { text: string; lines: string[] };
  documentButtons?: string[];
  receipt?: Download;
  page: Page;
}

export async function runCiboFlow(page: Page, s: CiboScenario = {}): Promise<CiboResult> {
  const stopAfter = s.stopAfter ?? "details";
  const stopAt = ORDER.indexOf(stopAfter);
  if (stopAt === -1) throw new Error(`Unknown stopAfter "${stopAfter}".`);
  const reaches = (st: CiboStep) => ORDER.indexOf(st) <= stopAt;
  if (reaches("listing") && !s.ref && !s.plate) throw new Error(`stopAfter "${stopAfter}" looks a transaction up: pass ref or plate.`);
  const r: CiboResult = { stoppedAfter: "login", ref: s.ref, page };
  const out = (st: CiboStep): CiboResult => ({ ...r, stoppedAfter: st });

  const login = new CiboLoginPage(page);
  if (!s.signedIn) {
    await login.as(s.persona ?? "cibo");
    r.welcome = await login.welcome();
  }
  if (!reaches("listing")) return out("login");

  await new CiboSidebar(page).open("transactions");
  const tm = new CiboTransactionManagementPage(page);
  const details = new CiboTransactionDetailsPage(page);
  if (!s.ref) {
    const rows = await tm.findByPlate(s.plate!, s.since, s.filter ?? {});
    if (!rows.length) throw new Error(`CIBO Transaction Listing: no row for plate ${s.plate}${s.since ? ` created since ${s.since.toISOString()}` : ""}.`);
    let hit: CiboRow | undefined;
    const seen: string[] = [];
    for (const [i, row] of rows.entries()) {
      const ref = (row["Transaction Ref. No."] ?? "").split(" ")[0];
      if (!s.receiptNo) { hit = row; break; }
      if (i > 0) await tm.findByRef(ref, s.filter ?? {}); // back on the listing, this row shown
      await tm.openDetails(ref);
      const rn = await details.value("Receipt No");
      seen.push(`${ref}: Receipt No "${rn}"`);
      if (rn.replace(/\s+/g, "") === s.receiptNo.replace(/\s+/g, "")) { hit = row; break; }
      await new CiboSidebar(page).open("transactions");
    }
    if (!hit) throw new Error(`CIBO: no transaction of plate ${s.plate} carries Receipt No ${s.receiptNo} (${seen.join("; ")}).`);
    r.ref = (hit["Transaction Ref. No."] ?? "").split(" ")[0];
    if (s.receiptNo || !reaches("details")) {
      // come back to the listing searched by the found Ref. No., so `listing` ends on its row as with `ref`
      if (/\/transaction-details\//.test(page.url())) await new CiboSidebar(page).open("transactions");
      r.row = await tm.findByRef(r.ref, s.filter ?? {});
    } else r.row = hit;
  } else r.row = await tm.findByRef(s.ref, s.filter ?? {});
  if (!reaches("details")) return out("listing");

  await tm.openDetails(r.ref!);
  r.detailsUrl = page.url();
  r.insurer = await details.insurer();
  r.documentButtons = await details.documentButtons();
  if (!reaches("receipt")) return out("details");

  r.receipt = await details.downloadReceipt();
  return out("receipt");
}
