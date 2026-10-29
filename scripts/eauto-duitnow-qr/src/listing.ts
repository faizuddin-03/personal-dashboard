/**
 * The BackOffice application listing.
 *
 * Three traps are encoded here, all of which have produced false results before:
 *
 * - **The search is AJAX and the "record(s) in total" line is ALREADY on the
 *   page.** Waiting for it is satisfied by the PREVIOUS search's count, so every
 *   filtered search reads the previous result set, lagging by exactly one query.
 *   That produced a false defect report. The correct wait is three-part:
 *   response → overlay hidden → two identical table reads 300ms apart.
 * - **The empty state is a ROW** (`<td colspan>No records found`). A naive row
 *   reader counts it as data.
 * - **Take the Edit link from the ROW, not the page.** A page-level first-match
 *   opens whatever sits on top; one run sent four different statuses to the same
 *   record and reported a false defect that looked entirely real.
 */
import type { Page } from "@playwright/test";
import { OBS } from "./env";
import { gotoObs } from "./obs";

export interface ListingRow {
  index: number;
  applicationNo: string;
  companyName: string;
  applicationStatus: string;
  hardcopyAccCreated: string;
  createdAt: string;
  expiry: string;
}

const norm = (s: string) => String(s || "").replace(/\s+/g, " ").trim();
/** Header keys are punctuation-loose: "Application No." and "Application No :" must agree. */
const key = (s: string) => norm(s).toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();

const dataRows = (page: Page) => page.locator("table tbody tr");

async function tableSignature(page: Page): Promise<string> {
  return page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));
    return rows.length + "|" + rows.slice(0, 5).map(r => (r.textContent || "").trim()).join("~");
  }).catch(() => "");
}

/** An empty table is also a "stable" state — guard against settling mid-repaint. */
async function looksUnpainted(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const t = document.querySelector("table tbody");
    return !t || t.children.length === 0;
  }).catch(() => true);
}

export async function submitSearch(page: Page): Promise<void> {
  const button = page.locator("#to-search")
    .or(page.getByRole("button", { name: /^search$/i })).first();

  const [response] = await Promise.all([
    page.waitForResponse(r => /admin\/form\/enquiry\/search/.test(r.url()), { timeout: 60_000 })
      .catch(() => null),
    button.click(),
  ]);
  if (response && !response.ok()) {
    throw new Error(`the listing search returned HTTP ${response.status()} — ${response.url()}`);
  }

  const overlay = page.locator("#overlay");
  if (await overlay.count()) {
    await overlay.first().waitFor({ state: "hidden", timeout: 30_000 }).catch(() => {});
  }

  let last: string | null = null;
  for (let i = 0; i < 20; i++) {
    const now = await tableSignature(page);
    if (last !== null && now === last && !(await looksUnpainted(page))) return;
    last = now;
    await page.waitForTimeout(300);
  }
}

export async function readRows(page: Page): Promise<ListingRow[]> {
  const headers = (await page.locator("table thead th").allInnerTexts().catch(() => []))
    .map(key);

  const raw = await page.evaluate(() =>
    Array.from(document.querySelectorAll("table tbody tr"))
      .map(tr => Array.from(tr.querySelectorAll("td"))
        .map(td => (td.textContent || "").replace(/\s+/g, " ").trim())),
  ).catch(() => [] as string[][]);

  const at = (cells: string[], ...names: string[]) => {
    for (const n of names) {
      const i = headers.indexOf(key(n));
      if (i >= 0 && cells[i] !== undefined) return cells[i];
    }
    return "";
  };

  const rows: ListingRow[] = [];
  raw.forEach((cells, index) => {
    // The empty state is a row, not an absence of rows.
    if (cells.length < 3 && /no records found/i.test(cells.join(" "))) return;
    rows.push({
      index,
      applicationNo: at(cells, "application no"),
      companyName: at(cells, "company name", "company business name"),
      applicationStatus: at(cells, "application status", "status"),
      hardcopyAccCreated: at(cells, "hardcopy acc created", "hardcopy doc"),
      createdAt: at(cells, "application created date", "created date", "created at"),
      expiry: at(cells, "application expiry date", "expiry date"),
    });
  });
  return rows;
}

async function open(page: Page): Promise<void> {
  await gotoObs(page, OBS.applicationListing, "application");
}

/**
 * Find the run's application by its company name. The name carries the run
 * stamp and is unique by construction, which is why this works before the
 * application number is known.
 */
export async function findByCompanyName(page: Page, companyName: string): Promise<ListingRow> {
  await open(page);
  const field = page.getByRole("textbox", { name: /company name/i });
  if (await field.count()) await field.first().fill(companyName);
  await submitSearch(page);

  const rows = await readRows(page);
  const hit = rows.find(r => norm(r.companyName).toLowerCase() === norm(companyName).toLowerCase());
  if (!hit) {
    throw new Error(`No application for company "${companyName}" on the listing (${rows.length} row(s) returned)`);
  }
  return hit;
}

/**
 * Find by application number. Matched against the Application No COLUMN
 * exactly, never `hasText` across the row — these references are prefixes of
 * one another, so NA6800110 is a substring of NA68001100 through NA68001109.
 */
export async function findByApplicationNo(page: Page, applicationNo: string): Promise<ListingRow> {
  await open(page);
  const field = page.getByRole("textbox", { name: /application no/i });
  if (await field.count()) await field.first().fill(applicationNo);
  await submitSearch(page);

  const rows = await readRows(page);
  const hit = rows.find(r => norm(r.applicationNo) === norm(applicationNo));
  if (!hit) {
    throw new Error(`No row for application ${applicationNo} (${rows.length} row(s) returned)`);
  }
  return hit;
}

/**
 * Open a row's Edit page and return its uuid. Edit opens a NEW TAB, so race a
 * popup event against a same-page navigation and follow whichever wins.
 */
export async function openRow(page: Page, row: ListingRow): Promise<string> {
  const link = dataRows(page).nth(row.index).getByRole("link", { name: /^edit$/i }).first();
  if (!(await link.count())) {
    throw new Error(`row ${row.index} (${row.applicationNo}) has no Edit action`);
  }

  const [popup] = await Promise.all([
    page.context().waitForEvent("page", { timeout: 8_000 }).catch(() => null),
    link.click(),
  ]);
  const target = popup || page;
  await target.waitForURL(/\/obs\/admin\/form\/edit(-registration-doc)?\//, { timeout: 30_000, waitUntil: "commit" });
  await target.waitForFunction(() => document.documentElement.outerHTML.length > 20_000, null, { timeout: 30_000 });

  const url = target.url();
  if (popup) await popup.close().catch(() => {});
  return url.split("/").pop()!.split("?")[0];
}

export async function openApplication(page: Page, applicationNo: string): Promise<string> {
  const row = await findByApplicationNo(page, applicationNo);
  return openRow(page, row);
}
