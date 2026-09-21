/**
 * Which records on this listing still hold the expiry the BUILD gave them?
 *
 * TS17 asks whether pre-deploy applications hold created + 90. It kept failing on
 * records whose expiry nobody claims the build ever set, and each failure had to
 * be diagnosed by hand. This module answers the prior question — *is this record's
 * expiry still the computed one?* — from evidence, so a sweep can state its
 * population instead of hardcoding names.
 *
 * Three exclusion classes, each with its own proof. Nothing here excludes a record
 * merely for deviating: that would be the assertion widening until it passed.
 *
 *   1. OURS — named in `discovery/96-expiry-patches.jsonl` or in the .env fixture
 *      set. We moved it, so it says nothing about the build.
 *
 *   2. NOT COMPUTED — its exact expiry value also appears on another record with a
 *      DIFFERENT creation timestamp. No function of created-date can return the
 *      same output for two different inputs, so such a value was set, not
 *      calculated. On staging today `2026-06-28 00:00` sits on six records created
 *      between 29 April and 26 June, and `2026-06-29 18:00` on seven created
 *      inside one afternoon. This is the airtight one.
 *
 *   3. MOVED SINCE BASELINE — it obeyed created + 90 in the oldest listing capture
 *      we hold (`discovery/47-listing-searched.txt`, 24-08-2026 15:56) and does
 *      not now. Somebody changed it in between, and since support-tool patches
 *      write no BackOffice audit-log row, the log cannot say who.
 *
 * Class 3 is reported LOUDLY rather than quietly dropped: a third party moving
 * expiry dates on shared staging is a finding about the environment every time it
 * happens, and it is the one class that can appear between two runs of the same
 * test.
 */
const fs = require('fs');
const path = require('path');

const DAY = 86_400_000;
const BASELINE = path.join(__dirname, '..', 'discovery', '47-listing-searched.txt');
const LEDGER = path.join(__dirname, '..', 'discovery', '96-expiry-patches.jsonl');

/** .env vars that name a record this project has patched or extended. */
const FIXTURE_VARS = [
  'APP_NO', 'EXTEND_APP_NO', 'EXTENDED_APP_NO', 'PAST_WINDOW_APP_NO',
  'PAST_WINDOW_EXTENDED_APP_NO', 'EXTENDED_THEN_EXPIRED_APP_NO',
  'FORMAT_APP_NO', 'TS49_APP_NO', 'MODAL_APP_NO', 'ASSIGNEE_APP_NO',
];

const parse = (s) => {
  const d = new Date(String(s || '').replace(' ', 'T'));
  return isNaN(d) ? null : d;
};

/** The listing writes an absent value as "-", not as "". Both mean no expiry. */
const isBlank = (v) => {
  const s = String(v ?? '').trim();
  return s === '' || s === '-';
};

/** days between created and expiry, or null if either is unreadable */
function deltaDays(createdAt, expiryDate) {
  const c = parse(createdAt);
  const e = parse(expiryDate);
  return (c && e) ? Math.round((e - c) / DAY) : null;
}

/** Class 1 — record names this project has moved. */
function ours() {
  const names = new Set();
  for (const v of FIXTURE_VARS) {
    const n = (process.env[v] || '').trim();
    if (n) names.add(n);
  }
  let ledgerRead = false;
  try {
    for (const line of fs.readFileSync(LEDGER, 'utf8').split('\n')) {
      if (!line.trim()) continue;
      const row = JSON.parse(line);
      const n = (row.applicationNo || row.appNo || '').trim();
      if (n) names.add(n);
    }
    ledgerRead = true;
  } catch { /* reported by the caller via ledgerRead */ }
  return { names, ledgerRead };
}

/**
 * Class 2 — expiry values shared across records with different creation times.
 * Returns the set of application numbers carrying such a value.
 */
function notComputed(rows) {
  const byExpiry = new Map();
  for (const r of rows) {
    if (!r.expiryDate || !r.createdAt) continue;
    // "-" is the listing's EMPTY cell, not a shared expiry value. Grouping on it
    // put eleven records with no expiry at all into "value shared across different
    // creation dates", which is both wrong and dangerous: TS17's first assertion
    // is that an old application CARRIES an expiry, so excluding the records
    // without one deletes the check. They get their own class — see noExpiry().
    if (isBlank(r.expiryDate)) continue;
    if (!byExpiry.has(r.expiryDate)) byExpiry.set(r.expiryDate, []);
    byExpiry.get(r.expiryDate).push(r);
  }
  const names = new Set();
  const groups = [];
  for (const [expiry, group] of byExpiry) {
    const creations = new Set(group.map((r) => r.createdAt));
    if (group.length > 1 && creations.size > 1) {
      groups.push({ expiry, records: group.map((r) => r.applicationNo) });
      for (const r of group) names.add(r.applicationNo);
    }
  }
  return { names, groups };
}

/**
 * Class 3 — obeyed created + 90 in the baseline capture, does not now.
 *
 * The baseline is a tab-separated dump of the same 24-column listing; column 3 is
 * Application Created Date, 4 is Application No, 13 is Application Expiry Date.
 */
function movedSinceBaseline(rows) {
  const before = new Map();
  let baselineRead = false;
  try {
    for (const line of fs.readFileSync(BASELINE, 'utf8').split('\n')) {
      const c = line.split('\t');
      if (c.length !== 24) continue;
      const no = (c[3] || '').trim();
      if (!/^NA/.test(no)) continue;
      before.set(no, { createdAt: (c[2] || '').trim(), expiryDate: (c[12] || '').trim() });
    }
    baselineRead = before.size > 0;
  } catch { /* reported via baselineRead */ }

  const moved = [];
  for (const r of rows) {
    const b = before.get(r.applicationNo);
    if (!b || !b.expiryDate || !r.expiryDate) continue;
    if (b.expiryDate === r.expiryDate) continue;
    moved.push({
      applicationNo: r.applicationNo,
      wasExpiry: b.expiryDate,
      nowExpiry: r.expiryDate,
      wasDays: deltaDays(b.createdAt, b.expiryDate),
      nowDays: deltaDays(r.createdAt, r.expiryDate),
    });
  }
  return { moved, baselineRead, baselineSize: before.size };
}

/**
 * The whole picture for one set of listing rows.
 *
 * `natural` is what a build assertion may be made against. Everything else comes
 * back labelled, so the caller can print WHY a record was left out rather than
 * reporting a population it cannot explain.
 */
function classify(rows) {
  const withNo = rows.filter((r) => (r.applicationNo || '').trim());
  const o = ours();
  const nc = notComputed(withNo);
  const ms = movedSinceBaseline(withNo);
  const movedNames = new Set(ms.moved.map((m) => m.applicationNo));

  // Records carrying no expiry at all. NOT an exclusion the caller may ignore:
  // "an old application still shows an Application Expiry Date" is half of what
  // TS17 asserts, so these are handed back for the caller to judge against the
  // record's STATUS (an unapproved application having no expiry is correct).
  const noExpiry = withNo.filter((r) => isBlank(r.expiryDate));

  const natural = withNo.filter((r) =>
    !isBlank(r.expiryDate) &&
    !o.names.has(r.applicationNo) &&
    !nc.names.has(r.applicationNo) &&
    !movedNames.has(r.applicationNo));

  // Ours-and-moved is the expected case, not a discovery. Splitting them keeps
  // the report honest: the first run of this said "Not ours" over a list that
  // included two records we had patched ourselves.
  const ourNames = o.names;
  ms.movedByUs = ms.moved.filter((m) => ourNames.has(m.applicationNo));
  ms.movedByOthers = ms.moved.filter((m) => !ourNames.has(m.applicationNo));

  return {
    natural,
    noExpiry: noExpiry.map((r) => ({ applicationNo: r.applicationNo, status: r.applicationStatus || '?' })),
    ours: withNo.filter((r) => o.names.has(r.applicationNo)).map((r) => r.applicationNo),
    notComputed: nc,
    movedSinceBaseline: ms,
    ledgerRead: o.ledgerRead,
    // Rows with no application number (BackOffice stubs, R19) never reach any
    // class — they are dropped here so a count can always name what it counted.
    unnamed: rows.length - withNo.length,
  };
}

module.exports = { classify, deltaDays, ours, notComputed, movedSinceBaseline };
