/**
 * UCD Application Listing — /obs/admin/enquiry
 *
 * This is the only surface that shows the expiry date (C2, settled by the
 * 23-08-2026 walkthrough), so every date assertion reads it from here rather
 * than from the database.
 *
 * Columns are addressed by their header text, not by index, so a column being
 * added or moved does not silently shift every read.
 */
const { OBS } = require('./env');
const { gotoObs } = require('./obs');

/** Header text -> the key we expose. Matching is case-insensitive, whitespace-loose. */
const COLUMNS = {
  'pre-application submission date': 'preAppSubmittedAt',
  'application created date': 'createdAt',
  'application no': 'applicationNo',
  'company name': 'companyName',
  'old brn': 'oldBrn',
  'new brn': 'newBrn',
  'business trading license number': 'tradingLicenseNo',
  'type of business': 'businessType',
  'application submission date': 'submittedAt',
  'approved date': 'approvedAt',
  'turn around time (days)': 'turnaroundDays',
  'application expiry date': 'expiryDate',
  'assignee': 'assignee',
  'assignee / ucd': 'assigneeUcd',
  'approver / assignee': 'approverAssignee',
  'last updated date': 'lastUpdatedAt',
  'lhdn response status': 'lhdnStatus',
  'application status': 'applicationStatus',
  'softcopy docs': 'softcopyDocs',
  'registration fee': 'registrationFee',
  'hardcopy & acc created': 'hardcopyAccCreated',
  'remarks': 'remarks',
};

/**
 * The listing's own filter bar — every dropdown it offers, keyed by the COLUMN
 * the filter narrows, so a filter value and the row it produced can be compared
 * without a second mapping.
 *
 * The ids are the page's (confirmed from discovery/02-application-listing-
 * result.html, 26-08-2026); the labels are what a tester reads on screen:
 *
 *   #status        Application Status:      All | New | Draft | Pending | KIV |
 *                                           Re-evaluate | Approved | Rejected | Expired
 *   #lhdnStatus    LHDN Response Status:    All | OK | Failed | - | N/A
 *   #assigneeUserId Assignee:               All | <every BackOffice user>
 *   #stage1Status  Assignee / UCD:          All | Pending UCD | Pending Assignee | Checked
 *   #stage2Status  Approver / Assignee:     All | Pending Approver | Pending Assignee | Checked
 *   #stage3Status  Softcopy Docs:           All | Pending UCD | Pending Assignee | Checked
 *   #stage4Status  Registration Fee:        All | - | Pending UCD | Failed | OK
 *   #stage5Status  Hardcopy & Acc Created:  All | Pending UCD | Pending UCD - Incomplete Docs |
 *                                           Pending Assignee | Registered
 *
 * Those option lists are documentation only. Nothing here hardcodes them —
 * filterOptions() reads them off the live page, so a status added on the server
 * turns up as a new uncovered combination instead of being silently missed.
 */
const FILTERS = {
  applicationStatus: { id: '#status', label: 'Application Status' },
  lhdnStatus: { id: '#lhdnStatus', label: 'LHDN Response Status' },
  assignee: { id: '#assigneeUserId', label: 'Assignee' },
  assigneeUcd: { id: '#stage1Status', label: 'Assignee / UCD' },
  approverAssignee: { id: '#stage2Status', label: 'Approver / Assignee' },
  softcopyDocs: { id: '#stage3Status', label: 'Softcopy Docs' },
  registrationFee: { id: '#stage4Status', label: 'Registration Fee' },
  hardcopyAccCreated: { id: '#stage5Status', label: 'Hardcopy & Acc Created' },
};

/** "All" as the filter bar spells it — the do-not-narrow value, not a status. */
const ANY = 'All';

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
// Header matching is punctuation-loose: "Application No." and "Application No :"
// must both land on 'application no' (an empty applicationNo on the 24-08 run
// traced back to a header variant the strict key missed).
const key = (s) => norm(s).toLowerCase().replace(/[.:]+$/, '').trim();

/**
 * Open the listing. Goes through gotoObs, not page.goto: /obs is a separate
 * application and a direct hit returns an empty document (see src/obs.js).
 */
async function open(page) {
  await gotoObs(page, OBS.applicationListing);
  await page.getByRole('button', { name: /^search$/i }).waitFor({ timeout: 30_000 });
}

/**
 * Every option each filter dropdown offers, read off the live page.
 *
 * This is the answer to "is that all the statuses?" — never a list kept in the
 * harness. Returns { applicationStatus: ['All','New',...], ... }, "All"
 * included, because filtering by All is itself a case worth running.
 */
async function filterOptions(page, only) {
  const wanted = only ? [].concat(only) : Object.keys(FILTERS);
  const out = {};
  for (const key of wanted) {
    const spec = FILTERS[key];
    if (!spec) throw new Error('unknown listing filter "' + key + '" — known: ' + Object.keys(FILTERS).join(', '));
    const el = page.locator(spec.id).first();
    out[key] = (await el.count())
      ? (await el.locator('option').allInnerTexts()).map(norm).filter(Boolean)
      : [];
  }
  return out;
}

/**
 * Search WITH the filter bar set — the only way to be sure a status was
 * actually covered.
 *
 * The 25-08 sweep read whatever rows page one happened to hold and took one
 * representative of each status it found there, so coverage was whatever
 * staging's newest records happened to be: KIV was never seen, and nobody could
 * tell "no rows in that state" from "that state was off the bottom of the page".
 * Setting the dropdown asks the server the question directly, and the record
 * count answers it.
 *
 * filters is keyed by COLUMN name (see FILTERS): { applicationStatus: 'KIV' }.
 * A value of 'All' — or omitting the key — leaves that dropdown alone.
 * Returns { total, rows, filters } where total is the server's own
 * "N record(s) in total", which is how a genuinely empty status is told apart
 * from a filter that silently failed to apply.
 */
async function search(page, filters = {}) {
  await open(page);

  const applied = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === '' || norm(value) === ANY) continue;
    const spec = FILTERS[key];
    if (!spec) throw new Error('unknown listing filter "' + key + '" — known: ' + Object.keys(FILTERS).join(', '));
    const el = page.locator(spec.id).first();
    if (!(await el.count())) throw new Error('filter "' + spec.label + '" (' + spec.id + ') is not on this listing');

    const options = (await el.locator('option').allInnerTexts()).map(norm);
    const label =
      options.find((o) => o.toLowerCase() === norm(value).toLowerCase()) ||
      options.find((o) => o.toLowerCase().includes(norm(value).toLowerCase()));
    if (!label) {
      throw new Error('"' + value + '" is not an option of ' + spec.label + ' — it offers: ' + options.join(' | '));
    }
    await el.selectOption({ label });
    applied[key] = label;
  }

  await submitSearch(page);
  return { total: await total(page), rows: await readRows(page), filters: applied };
}

/**
 * The WHOLE filtered population, not just the page one search() returns.
 *
 * The listing renders 100 rows a page and the rest behind pagination, which is
 * how the 25-08 post-expiry census concluded there were 15 Expired applications
 * and none beyond the 90-day window. Filtering by Expired says 289, and 224 of
 * them are beyond the window — including the day-90 and day-91 records TS08 was
 * waiting on dev to fabricate.
 *
 * Search is an AJAX GET returning JSON ({ records, totalRecords, totalPages,
 * maxRecordsPerPage }) and the form carries a pageNo, so this re-fires the SAME
 * query page by page from inside the page — same session, same criteria, still a
 * GET, still read-only. Returns the raw records, whose field names are the
 * server's (applicationNumber, expiredAt, stage1Status..stage5Status) rather
 * than the column names readRows() exposes.
 */
async function searchAll(page, filters = {}) {
  const first = await search(page, filters);
  const walked = await page.evaluate(async () => {
    const form = document.getElementById('search-form');
    if (!form) return null;
    const base = new URLSearchParams(new FormData(form)).toString().replace(/(^|&)pageNo=\d*/g, '');
    const url = (n) => `${window.contextPath || '/obs/'}admin/form/enquiry/search?${base}&pageNo=${n}`;
    const get = async (n) => (await fetch(url(n), { headers: { 'X-Requested-With': 'XMLHttpRequest' } })).json();

    const page1 = await get(1);
    const records = [...(page1.records || [])];
    for (let n = 2; n <= (page1.totalPages || 1); n++) records.push(...((await get(n)).records || []));
    return { totalRecords: page1.totalRecords, totalPages: page1.totalPages || 1, perPage: page1.maxRecordsPerPage, records };
  });

  if (!walked) return { total: first.total, records: [], pages: 0, firstPage: first };
  return { total: walked.totalRecords ?? first.total, records: walked.records, pages: walked.totalPages, firstPage: first };
}

/**
 * Click Search and WAIT FOR THE RESULTS THAT CLICK PRODUCED.
 *
 * Search is not a form post — the page's own JS serialises #search-form and
 * fires an AJAX GET at admin/form/enquiry/search, then rebuilds the table in
 * the success callback. The old wait was `getByText(/record\(s\) in total/)`,
 * which is satisfied by the count line ALREADY on the page, so a second search
 * read the previous result set. Every filtered sweep came back lagging exactly
 * one query behind — the 26-08 status sweep reported Draft rows under the
 * Pending filter and Re-evaluate rows under Approved, which reads like a broken
 * filter and is nothing of the kind.
 *
 * So: wait for the response, then for the app's own busy overlay to drop
 * (jQuery ajaxStop fades #overlay out once the callbacks have run), then for
 * the rendered rows to stop changing. No lifecycle events — they never fire on
 * these pages.
 */
async function submitSearch(page) {
  const button = page.locator('#to-search').or(page.getByRole('button', { name: /^search$/i })).first();
  const [response] = await Promise.all([
    page.waitForResponse((r) => /admin\/form\/enquiry\/search/.test(r.url()), { timeout: 60_000 }),
    button.click(),
  ]);
  if (!response.ok()) {
    throw new Error('the listing search returned HTTP ' + response.status() + ' — ' + response.url());
  }

  const overlay = page.locator('#overlay');
  if (await overlay.count()) await overlay.first().waitFor({ state: 'hidden', timeout: 30_000 }).catch(() => {});

  // The success callback repaints the table; settle when two reads 300 ms apart
  // agree. Cheap, and it does not assume anything about what the rows contain.
  let last = null;
  for (let i = 0; i < 20; i++) {
    const now = await signature(page);
    // 30-08-2026 — AN EMPTY TABLE IS ALSO A STABLE STATE, and that cost TS08.5 a take.
    //
    // If the repaint clears the rows before drawing them, two consecutive reads both
    // see nothing, this loop calls the search settled, and findByApplicationNo reports
    // "0 row(s) returned" for a record that is plainly there — the very record it had
    // already read four points earlier in the same run. Neither the export nor a
    // past-window expiry reproduced it (scripts/probe-listing-after-export.js clears
    // both); a rendering race explains every observation, including why it left no trace.
    //
    // A GENUINE empty result is distinguishable, and readRows already relies on the
    // distinction: displayResults appends a ROW carrying "No records found matching
    // your search criteria". So a painted empty result HAS a row. Zero rows of any kind
    // means the table has not painted, and settling there turns a rendering race into a
    // false "this application does not exist".
    if (last !== null && now === last && !(await looksUnpainted(page))) return;
    last = now;
    await page.waitForTimeout(300);
  }
}

/** A cheap fingerprint of what is rendered — row count plus the first row's text. */
async function signature(page) {
  return page
    .evaluate(() => {
      const table = document.querySelector('#listing-table');
      const rows = table ? table.querySelectorAll('tbody tr') : [];
      const count = document.querySelector('#listing-count');
      return (count ? count.textContent.trim() : '?') + '|' + rows.length + '|' + (rows[0] ? rows[0].innerText.replace(/\s+/g, ' ').slice(0, 120) : '');
    })
    .catch(() => '');
}

/** The server's own record count, from #listing-count (falls back to the sentence). */
async function total(page) {
  const el = page.locator('#listing-count').first();
  if (await el.count()) {
    const n = Number((await el.innerText()).replace(/[^\d]/g, ''));
    if (Number.isFinite(n)) return n;
  }
  const line = page.getByText(/record\(s\) in total/i).first();
  if (!(await line.count())) return null;
  const n = Number((/([\d,]+)\s*record\(s\)/i.exec(await line.innerText()) || [])[1]?.replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
}

/** Search by Application No and return the single matching row, parsed. */
async function findByApplicationNo(page, applicationNo) {
  // A blank number matches every row that has no number yet (Draft rows) and
  // then quietly returns the first of them — ask by row instead (openRow).
  if (!norm(applicationNo)) {
    throw new Error('findByApplicationNo needs an application number; use openRow/reopenRow for rows that have none');
  }
  await open(page);
  await page.getByRole('textbox', { name: /application no/i }).fill(applicationNo);
  await submitSearch(page);

  const rows = await readRows(page);
  const hit = rows.find((r) => norm(r.applicationNo) === norm(applicationNo));
  if (!hit) {
    throw new Error(`Application ${applicationNo} not found on the listing (${rows.length} row(s) returned)`);
  }
  return hit;
}

/** The results table and its data rows — shared, so a row locator and a parsed row always mean the same row. */
const resultsTable = (page) =>
  page.locator('table').filter({ has: page.getByText(/application expiry date/i) }).first();
const dataRows = (page) => resultsTable(page).locator('tbody tr').filter({ hasNot: page.locator('th') });

/**
 * Has the results table actually painted?
 *
 * TRUE means: the table element is there but contains no row of ANY kind — not a data
 * row and not the empty-state row. That is a table mid-repaint, never an answer.
 *
 * It is deliberately NOT "zero data rows": the empty state is itself a row, so a search
 * that genuinely matched nothing still renders one and reads as painted. Conflating the
 * two is what let a race masquerade as a missing record.
 */
async function looksUnpainted(page) {
  const table = resultsTable(page);
  if (!(await table.count().catch(() => 0))) return true;
  return (await dataRows(page).count().catch(() => 0)) === 0;
}

/** Every row currently rendered, as objects keyed by COLUMNS. */
async function readRows(page) {
  const table = resultsTable(page);
  const headers = (await table.locator('thead th, tr:first-child th').allInnerTexts()).map(key);

  const bodyRows = dataRows(page);
  const count = await bodyRows.count();

  const out = [];
  for (let i = 0; i < count; i++) {
    const cells = await bodyRows.nth(i).locator('td').allInnerTexts();
    if (!cells.length) continue;
    // The empty state is a ROW: displayResults appends a single
    // <td colspan="100%">No records found matching your search criteria</td>.
    // Counted as data it makes a zero-result search look like a one-row search
    // whose row cannot be opened — the 26-08 TS37/TS38 sweeps reported
    // "COULD NOT OPEN — row 0 (unidentified) has no Edit action" several times
    // where the honest answer was "no such application exists".
    if (cells.length < 3 && /no records found/i.test(cells.join(' '))) continue;
    const row = { _index: i, _cells: cells.map(norm) };
    headers.forEach((h, j) => {
      const name = COLUMNS[h];
      if (name) row[name] = norm(cells[j]);
    });
    out.push(row);
  }
  return out;
}

/**
 * Open ONE ROW's detail page from the results already on screen.
 *
 * The Edit link is taken from the row, not from the page. Asking the page for
 * getByRole('link', { name: /edit/ }).first() opens whatever sits at the top of
 * the results, which is the row you meant only when the search returned exactly
 * one — on the 25-08 run it sent four different statuses to the same Approved
 * fixture, which then reported an Extend button for "Draft" and "Rejected".
 *
 * Returns the uuid AND the route the link used, which is a free read of how far
 * the application got: /form/edit/<uuid> before the registration documents are
 * submitted, /form/edit-registration-doc/<uuid> after. Extend renders only on
 * the registration-documents page, so a row still on the 'app' route has
 * nowhere to show it — that is out of scope, not a missing button.
 */
async function openRow(page, row) {
  const link = dataRows(page).nth(row._index).getByRole('link', { name: /^edit$/i }).first();
  if (!(await link.count())) {
    throw new Error('row ' + row._index + ' (' + (row.applicationNo || row.companyName || 'unidentified') + ') has no Edit action');
  }

  // Edit opens a NEW TAB (same behaviour as the pre-application listing's View,
  // bitten on the 24-08 run). Follow whichever page ends up on the edit URL,
  // take the uuid, and close the popup — callers navigate by uuid afterwards.
  const [popup] = await Promise.all([
    page.context().waitForEvent('page', { timeout: 8_000 }).catch(() => null),
    link.click(),
  ]);
  const target = popup || page;
  try {
    // waitUntil: 'commit', not 'load' and not 'domcontentloaded'. The Rejected
    // row on the 25-08 sweep navigated to its edit URL and then sat there; the
    // first fix moved off 'load' and it STILL timed out. Probing it on 26-08
    // (Q25) showed neither event ever fires on these pages — the document is
    // complete in ~1.2 s but a batch of static assets never answer, so
    // readyState never leaves "loading". Wait for the URL, then for a document
    // big enough to be real. Never for a lifecycle.
    await target.waitForURL(/\/obs\/admin\/form\/edit(-registration-doc)?\//, {
      timeout: 30_000,
      waitUntil: 'commit',
    });
    await target.waitForFunction(() => document.documentElement.outerHTML.length > 20_000,
      null, { timeout: 30_000 });
  } catch {
    // Some rows have an Edit link that goes nowhere — seen 25-08 while sweeping
    // statuses. Say which row, and say what the page is showing instead, so the
    // caller can record a gap rather than reporting a 30-second silence.
    if (popup) await popup.close().catch(() => {});
    const e = new Error(
      'Edit on row ' + row._index + ' (' + (row.applicationNo || row.companyName || 'unidentified') +
      ', status "' + (row.applicationStatus || '?') + '") did not open a detail page — still at ' + target.url()
    );
    e.code = 'ROW_EDIT_DEAD';
    throw e;
  }
  const url = target.url();
  if (popup) await popup.close().catch(() => {});

  return {
    uuid: url.split('/').pop().split('?')[0],
    route: /edit-registration-doc/.test(url) ? 'regDocs' : 'app',
    url,
  };
}

/**
 * Search again and re-open the given row — walking several rows means coming
 * back for each one, because opening a row navigates away.
 *
 * Rows are re-identified by application number, or by company name when there
 * is none yet (a Draft row has no number). The row index is only a hint: if the
 * listing reordered under the run, the identity match wins.
 *
 * PASS THE SAME FILTERS the row was found under. Coming back with an empty
 * filter bar re-runs a different query, and row._index then points into a
 * different result set — the same class of mistake as taking the first Edit
 * link on the page (25-08), which reported an Approved fixture's button as
 * Draft's.
 */
async function reopenRow(page, row, filters = {}) {
  const { rows } = await search(page, filters);
  const same = (a, b) =>
    norm(a.applicationNo)
      ? norm(a.applicationNo) === norm(b.applicationNo)
      : norm(a.companyName).toLowerCase() === norm(b.companyName).toLowerCase();

  const here = rows[row._index];
  const target = here && same(row, here) ? here : rows.find((r) => same(row, r));
  if (!target) {
    throw new Error('row "' + (row.applicationNo || row.companyName) + '" is no longer in the results — the listing changed under the run');
  }
  return openRow(page, target);
}

/**
 * Open the application's detail page by number and return the uuid — the uuid
 * is what every later navigation needs. openRow/reopenRow carry the route too.
 */
async function openApplication(page, applicationNo) {
  const row = await findByApplicationNo(page, applicationNo);
  return (await openRow(page, row)).uuid;
}

/**
 * The expiry date as the listing renders it, e.g. "2026-11-21 21:01".
 * Returned as both the raw string and a Date, because the time of day matters
 * (Q4) and any parsing we do is an assumption until Q4 is answered.
 */
async function expiry(page, applicationNo) {
  const row = await findByApplicationNo(page, applicationNo);
  const raw = row.expiryDate || '';
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(raw);
  return {
    raw,
    date: m ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) : null,
    row,
  };
}

/**
 * Search by Company Name and return the matching row.
 *
 * A freshly built fixture has no application number yet — that is the thing we
 * are trying to learn — so the fixture builder finds its own application by the
 * run-stamped company name, which is unique by construction (see fixture.js).
 */
async function findByCompanyName(page, companyName) {
  await open(page);
  const field = page.getByRole('textbox', { name: /company name/i });
  if (await field.count()) await field.first().fill(companyName);
  await submitSearch(page);

  const rows = await readRows(page);
  const hit = rows.find((r) => norm(r.companyName).toLowerCase() === norm(companyName).toLowerCase());
  if (!hit) {
    throw new Error(`No application for company "${companyName}" on the listing (${rows.length} row(s) returned)`);
  }
  return hit;
}

/**
 * ONE CELL of one row, by column name — so evidence can ring the VALUE it claims
 * instead of the row that happens to contain it.
 *
 * WHY THIS EXISTS (Charmain, 27-08-2026, on the TS03 take): *"for listing view you
 * didnt show the expiry date column"*. The take ringed the whole row and captioned
 * it "Application Expiry Date BEFORE: 2026-12-22 21:10" — and Application Expiry
 * Date is the 12th of 22 columns inside a `table-scroll-container`, so it was
 * metres off the right edge of the frame. The caption asserted a value the still
 * could not show, which is the same fault as the tooltip read from the DOM: a
 * reviewer is asked to take it on trust.
 *
 * Ringing the cell fixes it by construction, because `scrollIntoViewIfNeeded` on a
 * cell scrolls the container HORIZONTALLY to reach it — the row locator never
 * needed to, so nothing ever did.
 *
 * `columnKey` is a COLUMNS value (`'expiryDate'`, `'remarks'`), not a header
 * string, so a header re-wording does not silently return the wrong column.
 * Returns null when the column or the row is not there, and the caller must then
 * refuse the shot rather than fall back to the row — a ring on the wrong element
 * is worse than no ring.
 */
async function cell(page, applicationNo, columnKey) {
  // THROW on a missing application number — do NOT return null. 29-08-2026.
  //
  // `filter({ hasText: undefined })` is a NO-OP in Playwright: it matches every row,
  // so `.first()` handed back whatever sat at the top of the listing and the caller
  // framed ANOTHER RECORD'S cell believing it was this one. Measured the same day: a
  // call with an undefined appNo returned the first row's Application Created Date
  // and reported success.
  //
  // Returning null would be no better, because the recorder's showCell() renders a
  // null as "the COLUMN could not be located" — which sends the next person to the
  // header map for a fault that is in the ARGUMENT. A wrong argument must say so.
  if (typeof applicationNo !== 'string' || !applicationNo.trim()) {
    throw new Error('listing.cell: applicationNo must be a non-empty string, got ' +
      JSON.stringify(applicationNo) + ' — an unfiltered row match reads the WRONG record');
  }
  const table = resultsTable(page);
  if (!(await table.count())) return null;
  const headers = (await table.locator('thead th, tr:first-child th').allInnerTexts()).map(key);
  const idx = headers.findIndex((h) => COLUMNS[h] === columnKey);
  if (idx === -1) return null;

  // Match the Application No COLUMN exactly, not `hasText` anywhere in the row.
  // These references are prefixes of one another — NA6800110 is a substring of
  // NA68001100 through NA68001109 — so a substring match can silently select a
  // neighbouring record. Fall back to the old behaviour only where the listing has
  // no Application No column to key on.
  const wanted = applicationNo.trim();
  const noIdx = headers.findIndex((h) => COLUMNS[h] === 'applicationNo');
  let row;
  if (noIdx !== -1) {
    const all = dataRows(page);
    const n = await all.count();
    for (let i = 0; i < n; i++) {
      const cand = all.nth(i);
      const txt = String(await cand.locator('td').nth(noIdx).innerText().catch(() => '')).trim();
      if (txt === wanted) { row = cand; break; }
    }
    if (!row) return null;
  } else {
    row = dataRows(page).filter({ hasText: wanted }).first();
    if (!(await row.count())) return null;
  }
  const td = row.locator('td').nth(idx);
  return (await td.count()) ? td : null;
}

/**
 * The cell, and the header above it, as two locators — for a spotlight that has to
 * frame both. A highlighted value with its column title scrolled out of frame
 * names no field, exactly as the Excel leg learned about the reference column.
 */
async function cellWithHeader(page, applicationNo, columnKey) {
  const td = await cell(page, applicationNo, columnKey);
  if (!td) return null;
  const table = resultsTable(page);
  const headers = (await table.locator('thead th, tr:first-child th').allInnerTexts()).map(key);
  const idx = headers.findIndex((h) => COLUMNS[h] === columnKey);
  const th = table.locator('thead th, tr:first-child th').nth(idx);
  return { td, th: (await th.count()) ? th : null };
}

/**
 * Is the Application Listing's results table on screen at all?
 *
 * Added 29-08-2026 so a caller can tell "this column is missing" apart from "you are
 * not on the listing". The recorder's showCell() had ONE message for both, and TS17's
 * `predeploy` point spent two days reported as a missing Application Created Date
 * column when the column was present and the take was simply on the application
 * detail page — where no results table exists. A message that names the wrong cause
 * is worse than no message, because it is acted on.
 */
async function hasResultsTable(page) {
  const table = resultsTable(page);
  return (await table.count()) > 0;
}

module.exports = {
  open, search, searchAll, filterOptions, findByApplicationNo, findByCompanyName, readRows,
  openApplication, openRow, reopenRow, expiry, cell, cellWithHeader, hasResultsTable,
  COLUMNS, FILTERS, ANY,
};
