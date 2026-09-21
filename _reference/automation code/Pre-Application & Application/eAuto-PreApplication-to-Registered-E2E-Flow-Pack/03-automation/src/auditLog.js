/**
 * The UCD Application Audit Log — `/obs/admin/audit-log/enquiry` (R18).
 *
 * Charmain, 26-08-2026: *"any changes should show in this audit log."* And the
 * team's requirement notice the same evening: *"if Assignee / any BO user clicked
 * [Extend], System should display: [Extend] / old: - / new: Yes"*.
 *
 * THREE THINGS THIS MODULE EXISTS TO STOP A TEST GETTING WRONG, all measured:
 *
 * 1. **A direct GET is 403 with an empty body** — for every account. /obs needs
 *    the session handoff, and the menu's own door is
 *    `/uat4/api/admin/onboarding/auth-redirect.do?type=OBS_AUDIT_LOG_LISTING`.
 *    A test that pastes the URL reports "no permission" and is simply wrong.
 * 2. **Both log dates are mandatory.** `#to-search` alerts "Please input Log Date
 *    (From) and Log Date (To)" and returns false, so a company-only search never
 *    submits — indistinguishable from an empty log if you only read the table.
 * 3. **The rows paint after networkidle.** Reading too early shows "No records
 *    found matching your search criteria" while the server has already returned
 *    53 records. So assertions go through the JSON endpoint, and the rendered
 *    table is only what a human sees.
 *
 * The endpoint, same session, plain GET:
 *
 *   /obs/admin/audit-log/enquiry/search
 *     ?pageNo=1&logDateFrom=dd/mm/yyyy&logDateTo=dd/mm/yyyy
 *     &companyRoc=&businessTrading=&companyName=
 *
 *   -> { records: [{ id, applicationUuid, logDate, companyName, companyRoc,
 *                    businessTrading, activity, activityDisplayName, createdBy,
 *                    description }],
 *        totalRecords, totalPages, maxRecordsPerPage, currentPageNo, errorMsg }
 *
 * `description` is NEWLINE-separated blocks:
 *
 *   [Extend]\nold: -\nnew: Yes\n\n[Application Expiry Date]\nold: …\nnew: …\n\n…
 */
const { BASE, INSTANCE } = require('./env');

const ENQUIRY = `${BASE}/obs/admin/audit-log/enquiry`;
const SEARCH_PATH = '/obs/admin/audit-log/enquiry/search';

/** Menu types behind the two audit screens. */
const TYPE = {
  application: 'OBS_AUDIT_LOG_LISTING',
  preApplication: 'PRE_OBS_AUDIT_LOG_LISTING',
};

const authRedirect = (type = TYPE.application) =>
  `${BASE}/${INSTANCE}/api/admin/onboarding/auth-redirect.do?type=${type}`;

/** dd/mm/yyyy — the format the datepickers and the endpoint both use. */
function ddmmyyyy(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Enter the log through the menu's redirect. Throws if we do not land on /obs. */
async function open(page, type = TYPE.application) {
  await page.goto(authRedirect(type), { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle').catch(() => {});
  if (!/\/obs\//.test(page.url())) {
    throw new Error(
      'the audit-log handshake did not land on /obs (got ' + page.url() + '). ' +
        'A direct GET of ' + ENQUIRY + ' answers 403 — that is the handshake, not permissions (R18).'
    );
  }
  return page.url();
}

/**
 * Search the log through its own endpoint.
 *
 * `from`/`to` default to a window ending today. Both are always sent: the screen
 * refuses to search without them, and so does this.
 */
async function search(page, { from, to, companyName = '', companyRoc = '', businessTrading = '', days = 7 } = {}) {
  const end = to || ddmmyyyy();
  const start = from || ddmmyyyy(new Date(Date.now() - days * 86_400_000));
  if (!/\/obs\//.test(page.url())) await open(page);

  const res = await page.evaluate(
    async ([path, qs]) => {
      const r = await fetch(path + '?' + qs, { credentials: 'same-origin' });
      return { status: r.status, text: await r.text() };
    },
    [
      SEARCH_PATH,
      new URLSearchParams({
        pageNo: '1',
        logDateFrom: start,
        logDateTo: end,
        companyRoc,
        businessTrading,
        companyName,
      }).toString(),
    ]
  );
  if (res.status !== 200) throw new Error(`audit-log search -> HTTP ${res.status}`);
  let data;
  try {
    data = JSON.parse(res.text);
  } catch {
    throw new Error('audit-log search did not return JSON: ' + res.text.slice(0, 200));
  }
  return {
    from: start,
    to: end,
    companyName,
    records: data.records || [],
    totalRecords: data.totalRecords ?? (data.records || []).length,
    totalPages: data.totalPages,
    errorMsg: data.errorMsg || null,
  };
}

/**
 * Split a Description into its `[Block] old: … new: …` parts.
 *
 * Returns `{ '[Extend]': { old: '-', new: 'Yes' }, … }`, keyed WITHOUT the
 * brackets, plus `order` so a test can assert which block comes first.
 */
function parseDescription(description) {
  const fields = {};
  const order = [];
  const re = /\[([^\]]+)\]\s*\n\s*old:\s*([^\n]*)\n\s*new:\s*([^\n]*)/g;
  let m;
  while ((m = re.exec(String(description || '')))) {
    const key = m[1].trim();
    fields[key] = { old: m[2].trim(), new: m[3].trim() };
    order.push(key);
  }
  return { fields, order };
}

/** Just the Extend rows, newest first as the server returns them. */
const extendRows = (records) => (records || []).filter((r) => r.activity === 'EXTEND');

/**
 * The requirement, as one assertable predicate.
 *
 * Team notice 26-08-2026: an Extend row must display `[Extend] / old: - / new:
 * Yes`. Returns `{ ok, reasons[], fields, order }` rather than throwing, so a
 * test can report WHICH half failed.
 */
function checkExtendEntry(row) {
  const reasons = [];
  if (!row) return { ok: false, reasons: ['no Extend row at all'], fields: {}, order: [] };
  const { fields, order } = parseDescription(row.description);
  const extend = fields['Extend'];

  if (!extend) reasons.push('no [Extend] block in the Description');
  else {
    if (extend.old !== '-') reasons.push(`[Extend] old is ${JSON.stringify(extend.old)}, expected "-"`);
    if (!/^yes$/i.test(extend.new)) reasons.push(`[Extend] new is ${JSON.stringify(extend.new)}, expected "Yes"`);
  }
  if (order[0] && order[0] !== 'Extend') reasons.push(`[Extend] is not the first block (first is [${order[0]}])`);
  if (!fields['Application Expiry Date']) reasons.push('no [Application Expiry Date] block');
  if (!row.createdBy) reasons.push('no By value on the row');

  return { ok: reasons.length === 0, reasons, fields, order };
}

/* -------------------------------------------------------------------------- */
/* THE SCREEN, for evidence                                                    */
/* -------------------------------------------------------------------------- */

/** The screen's own controls, read off discovery/90-audit-log.html. */
const UI = {
  form: '#search-form',
  from: '#logDateFrom',
  to: '#logDateTo',
  companyName: '#companyName',
  search: '#to-search',
  table: '#listing-table',
  body: '#listing-body',
  count: '#listing-count',
};

/** Column order of the on-screen table: #, Date, Company Name, Action, By, Description. */
const COL = { index: 1, date: 2, companyName: 3, action: 4, by: 5, description: 6 };

/**
 * Drive the audit-log screen BY HAND and return locators, not JSON.
 *
 * `search()` above answers the log through its own endpoint, which is right for an
 * assertion and useless as evidence: a fetch leaves nothing on camera. Charmain,
 * 27-08-2026, on the TS03 take: *"didnt check the audit log to prove that it
 * extended before also"*. TS03's whole precondition is "this application has
 * already been extended once", and the take proved it from the greyed button on
 * the page under test — which is the thing being tested. The log is the
 * independent record, and it is a screen, so it can be filmed.
 *
 * Both dates are mandatory (R18). They are SET, not typed, and that is forced:
 * `#logDateFrom` and `#logDateTo` both carry `readonly` (measured —
 * discovery/90-audit-log.html), so `fill()` refuses them as not editable and the
 * only human route is the jQuery-UI datepicker. The value is assigned and a
 * `change` dispatched, which leaves the dates VISIBLE in their own fields on
 * camera; the caller records that the method was programmatic, because how a
 * precondition was set is part of the evidence. Nothing about the feature under
 * test is set this way.
 *
 * `networkidle` after Search because the rows paint from an AJAX call — asserting
 * on the table before that reads as "no rows".
 *
 * Returns { rows, rowFor(uuid|appliesTo), locators } — rows parsed from the DOM so
 * the caption can quote what is on the screen rather than what the endpoint said.
 */
async function searchOnScreen(page, { companyName = '', from, to, days = 7 } = {}) {
  if (!/\/obs\//.test(page.url()) || !(await page.locator(UI.from).count())) await open(page);
  const end = to || ddmmyyyy();
  const start = from || ddmmyyyy(new Date(Date.now() - days * 86_400_000));

  const setDate = async (selector, value) => {
    await page.locator(selector).evaluate((el, v) => {
      el.value = v;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, value);
  };
  await setDate(UI.from, start);
  await setDate(UI.to, end);
  // The datepicker opens on focus and can sit over the Search button.
  await page.keyboard.press('Escape').catch(() => {});
  // ALWAYS fill, even with '' — this is the project's chained-search trap in its
  // second home. `if (companyName)` left a previous search's company in the field,
  // so a deliberately UNFILTERED search silently re-ran the narrow one and came
  // back empty. The evidence recorder's liveness control is exactly that search:
  // "the log renders rows for this date window" was answered `0 rows` on a log
  // that had plenty, and the take failed reporting the screen was empty.
  //
  // The listing has the same fault and the same fix (see FLOW.md, widest search
  // first); it cost a "65 Registered, all 65 Expired" reading there.
  await page.locator(UI.companyName).fill(companyName || '');
  // WAIT FOR THE SEARCH'S OWN RESPONSE, not for a row to exist.
  //
  // Measured 27-08-2026, and it had been silently wrong the whole time: this
  // function returned the PREVIOUS search's table. Three searches in one session
  // printed 0 rows / 0 rows / 6 rows, and the 6 belonged to the search before —
  // the company field read "115366TS06" while the rows on screen were
  // "QA11982 MOTORS …".
  //
  // Both old waits were no-ops. `networkidle` can settle before the AJAX that
  // repaints the table has been issued, and `${UI.body} tr` is satisfied
  // INSTANTLY by the single empty-state row the table already holds — so the
  // "wait for rows" wait is satisfied by the absence of rows.
  //
  // It passed for a year because a headed take is slow enough elsewhere that the
  // repaint lands before anything reads. That is the worst kind of green: the one
  // that goes red the first time something else gets faster.
  // A signature of what is on screen BEFORE the click, so the wait afterwards can
  // tell "the new results arrived" from "the old results are still here". The
  // response alone is not enough — it resolves before the rows are written, and a
  // click the datepicker swallowed produces no response at all, in which case the
  // stale table is read as this search's answer.
  const signature = () => page.evaluate((sel) => {
    const body = document.querySelector(sel.body);
    const count = document.querySelector(sel.count);
    return `${count ? count.textContent.trim() : ''}|${body ? body.rows.length : -1}|` +
           `${body && body.rows[0] ? (body.rows[0].innerText || '').slice(0, 120) : ''}`;
  }, UI).catch(() => '');
  const was = await signature();

  // AND BLANK THE TABLE BEFORE ASKING. A signature comparison catches a stale read
  // only when the new results LOOK different; going from a wide search back to a
  // narrow one can land on a table whose first row and row count are unchanged, and
  // then the old rows are read as the new answer with nothing to notice. Emptying
  // the body first makes any repaint a real change — and makes a search that never
  // repaints read as ZERO rows with `repainted: false` beside it, which a caller
  // can refuse, instead of as somebody else's data.
  await page.evaluate((sel) => {
    const body = document.querySelector(sel.body);
    if (body) body.innerHTML = '';
  }, UI).catch(() => {});

  const responded = page.waitForResponse(
    (r) => r.url().includes(SEARCH_PATH) && r.request().method() !== 'OPTIONS',
    { timeout: 20_000 },
  ).catch(() => null);
  await page.locator(UI.search).click();
  const res = await responded;
  await page.waitForLoadState('networkidle').catch(() => {});

  // Then wait for the TABLE to change, not just for the network to go quiet. Two
  // consecutive searches that legitimately return the identical screen would wait
  // out the grace period and read the right thing anyway, so this is bounded, not
  // asserted.
  const deadline = Date.now() + 8_000;
  let changed = false;
  while (Date.now() < deadline) {
    const now = await signature();
    // The body was emptied above, so ANY row is this search's own row.
    if (now !== was && !/\|0\|/.test(now)) { changed = true; break; }
    await page.waitForTimeout(200);
  }
  await page.waitForTimeout(300);
  if (!res) {
    // Worth surfacing: no search response at all usually means the click was
    // swallowed (the jQuery-UI datepicker opens on focus and can sit over the
    // Search button), and everything read after it describes the PREVIOUS search.
    // eslint-disable-next-line no-console
    console.log(`  audit search: no ${SEARCH_PATH} response — the table may still hold the previous search`);
  }

  // The column map goes in as an ARGUMENT: the page callback runs in the browser
  // and cannot close over module scope, and a silently-undefined index there
  // returns a row of empty strings that reads as an empty log.
  const rows = await page
    .locator(`${UI.body} tr`)
    .evaluateAll(
      (trs, col) =>
        trs.map((tr, i) => {
          const td = [...tr.querySelectorAll('td')].map((c) => (c.innerText || '').trim());
          const at = (n) => td[n - 1] ?? '';
          return {
            _index: i,
            date: at(col.date),
            companyName: at(col.companyName),
            action: at(col.action),
            by: at(col.by),
            description: at(col.description),
            cells: td.length,
          };
        }),
      COL,
    )
    .catch(() => []);

  return {
    from: start,
    to: end,
    companyName,
    // Did the screen actually repaint for THIS search? A caller asserting an
    // absence needs to know, because an absence read off a stale table is an
    // absence of evidence rather than evidence of absence.
    responded: !!res,
    repainted: changed,
    rows,
    /** The Extend row, on screen. */
    extendRow: () => page.locator(`${UI.body} tr`).filter({ hasText: /Extend/i }).first(),
    descriptionCell: (row) => row.locator(`td:nth-child(${COL.description})`),
    dateCell: (row) => row.locator(`td:nth-child(${COL.date})`),
    actionCell: (row) => row.locator(`td:nth-child(${COL.action})`),
    /**
     * Date + Action only. SUPERSEDED as the evidence ring by `evidenceCells` — see
     * there for why leaving the Description outside the ring is what let the
     * caption be placed on top of it. Kept because a leg that wants a small ring
     * on this row (and no claim about the Description) still has one.
     *
     * Not the row, and not the Description cell: a six-block Description makes the
     * row ~700px tall, taller than the viewport, and a ring bigger than the screen
     * frames everything and therefore nothing. Ringing the two narrow cells keeps
     * the ring small while the Description stays legible beside it — the spotlight
     * dims the rest of the page by 45%, which text survives.
     */
    keyCells: (row) => [row.locator(`td:nth-child(${COL.date})`), row.locator(`td:nth-child(${COL.action})`)],
    /**
     * What a still must RING once the Description itself is the evidence.
     *
     * Charmain, 27-08-2026: *"the audit log page should show the log with extend
     * description and the extend remarks"*. Ringing only Date + Action left the
     * Description column OUTSIDE the ring — and the caption placer avoids the ring
     * and nothing else, so it took the first free slot, which was directly on top of
     * it. The [Application Extension Date] and [Extended By] blocks went under the
     * bubble in the 06:30 take.
     *
     * Including the Description makes it part of what the caption must dodge. The
     * cost is a ring the width of the table and the height of the row, so the caption
     * has to be SHORT enough to fit in the strip beneath it — the detail belongs in
     * the narration footer and the sidecar, both of which are already carrying it.
     */
    evidenceCells: (row) => [
      row.locator(`td:nth-child(${COL.date})`),
      row.locator(`td:nth-child(${COL.action})`),
      row.locator(`td:nth-child(${COL.description})`),
    ],
    table: page.locator(UI.table),
    count: page.locator(UI.count),
  };
}

module.exports = {
  ENQUIRY, SEARCH_PATH, TYPE, authRedirect, ddmmyyyy,
  open, search, parseDescription, extendRows, checkExtendEntry,
  searchOnScreen, UI, COL,
};
