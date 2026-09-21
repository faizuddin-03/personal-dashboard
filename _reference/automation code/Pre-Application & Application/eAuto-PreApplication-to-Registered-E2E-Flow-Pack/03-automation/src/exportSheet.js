/**
 * The UCD Application Listing's Export, as a readable workbook — and the R14
 * two-surface sweep built on top of it.
 *
 * WHY THIS IS A MODULE
 *
 * R14's ruling is that the extension remark must not surface in either of the
 * two places a whole team reads applications: the listing itself, and the file
 * its Export produces. Eight scenarios carry that sweep as a mandatory step
 * (TS29, TS34, TS35, TS43, TS51, TS55, E2E_TS9, E2E_TS10), and every one of
 * them was going to reimplement "download the xlsx and look in column 23".
 * Reimplemented eight times it would be wrong in eight different ways, and the
 * failure mode is the quiet one: a sweep that looks in the wrong column and
 * reports "remark absent" is indistinguishable from a passing test.
 *
 * The download and the XLSX reader were proven by scripts/probe-listing-export.js
 * on 26-08-2026 against NA68001099 and are lifted from it unchanged in
 * behaviour. Two things about them are load-bearing and easy to get wrong:
 *
 *   - Export is a **GET carrying the same serialized filters as the search**
 *     ($('#search-form').serialize()), so it must be fired from a page that has
 *     already run the search you want exported. Fetching it from a fresh page
 *     load exports the DEFAULT filter set, which is a different question.
 *   - The writer sets the ZIP data-descriptor flag, so the sizes in the local
 *     file headers are ZERO. A naive scan of local headers reads garbage; the
 *     central directory is the only reliable index. That cost one debugging
 *     round already.
 *
 * COLUMN NUMBERS ARE NOT HARD-CODED. R14 and the scenarios talk about "column
 * 13" and "column 23" because that is what the 26-08 baseline measured, but a
 * column that moves would silently break a positional read. Everything here
 * resolves by HEADER TEXT and reports the index it found, so a moved column is
 * a visible difference rather than a wrong cell.
 */
const zlib = require('node:zlib');

/** Where the 26-08-2026 baseline found them — for reporting drift, not for reading. */
const BASELINE_COLUMNS = { expiryDate: 13, applicationStatus: 19, remarks: 23, total: 55 };

/* --------------------------------------------------------------- zip + xlsx */

/**
 * Walk the ZIP central directory. See the header note: local headers carry zero
 * sizes on this writer, so they cannot be scanned.
 */
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('not a zip (no end-of-central-directory record)');

  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const files = {};
  for (let n = 0; n < count; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    const method = buf.readUInt16LE(p + 10);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const commentLen = buf.readUInt16LE(p + 32);
    const localOff = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    const lNameLen = buf.readUInt16LE(localOff + 26);
    const lExtraLen = buf.readUInt16LE(localOff + 28);
    const start = localOff + 30 + lNameLen + lExtraLen;
    const raw = buf.slice(start, start + compSize);
    files[name] = method === 0 ? raw : zlib.inflateRawSync(raw);
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
}

const unescapeXml = (s) =>
  String(s)
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(+d))
    .replace(/&amp;/g, '&');

/**
 * Every row of sheet1 as arrays of strings, shared strings resolved.
 *
 * The probe script capped this at 5 rows because it only wanted the header. A
 * sweep needs the whole sheet — a remark leaking into row 40 of a wide export is
 * exactly the case the cap would hide — so the default here is NO limit.
 */
function sheetRows(files, limit = Infinity) {
  const sst = [];
  const ssXml = files['xl/sharedStrings.xml'];
  if (ssXml) {
    for (const si of ssXml.toString('utf8').split('<si>').slice(1)) {
      sst.push(unescapeXml([...si.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((m) => m[1]).join('')));
    }
  }
  const name = Object.keys(files).find((f) => /^xl\/worksheets\/sheet1\.xml$/.test(f));
  if (!name) return { rows: [], sharedStrings: sst.length };

  const xml = files[name].toString('utf8');
  const chunks = xml.split('<row');
  const rows = [];
  for (const r of chunks.slice(1, Number.isFinite(limit) ? limit + 1 : undefined)) {
    const cells = [];
    for (const m of r.matchAll(/<c\b([^>]*)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const attrs = m[1] || '';
      const inner = m[2] || '';
      const type = (/\bt="([^"]+)"/.exec(attrs) || [])[1] || 'n';
      const v = (/<v>([\s\S]*?)<\/v>/.exec(inner) || [])[1];
      const inlineStr = [...inner.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join('');
      cells.push(
        type === 's' ? (sst[+v] ?? '')
          : type === 'inlineStr' ? unescapeXml(inlineStr)
            : v === undefined ? '' : unescapeXml(v)
      );
    }
    rows.push(cells);
  }
  return { rows, sharedStrings: sst.length };
}

/* ------------------------------------------------------------- the download */

/**
 * Fire the page's own Export GET and bring the bytes back.
 *
 * MUST be called on a listing page whose search has already been run — the URL
 * is built from #search-form, so the export inherits the filters on screen. A
 * caller that wants a wider export runs a wider search first (TS43 step 12).
 */
async function download(page) {
  const dl = await page.evaluate(async () => {
    const form = document.getElementById('search-form');
    if (!form) return { error: 'no #search-form on this page — not the listing, or it never rendered' };
    const qs = new URLSearchParams(new FormData(form)).toString();
    const url = `${window.contextPath || '/obs/'}admin/form/enquiry/export?${qs}`;
    const res = await fetch(url, { credentials: 'same-origin' });
    const buf = new Uint8Array(await res.arrayBuffer());
    let bin = '';
    for (let i = 0; i < buf.length; i++) bin += String.fromCharCode(buf[i]);
    return {
      url,
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      disposition: res.headers.get('content-disposition') || '',
      bytes: buf.length,
      base64: btoa(bin),
    };
  });
  if (dl.error) throw new Error(dl.error);
  const body = Buffer.from(dl.base64, 'base64');
  const named = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(dl.disposition);
  return {
    url: dl.url,
    status: dl.status,
    contentType: dl.contentType,
    disposition: dl.disposition,
    bytes: dl.bytes,
    serverFilename: named ? named[1] : null,
    isZip: body[0] === 0x50 && body[1] === 0x4b,
    body,
  };
}

/**
 * Download and parse in one go: the workbook as { columns, rows, records }.
 *
 * `records` maps each data row to an object keyed by its header, which is what
 * every assertion here actually wants — nothing should be counting commas.
 */
async function read(page) {
  const dl = await download(page);
  if (dl.status !== 200) {
    throw new Error(`export returned HTTP ${dl.status} — expected 200. url: ${dl.url}`);
  }
  if (!dl.isZip) {
    // Kept as a real error rather than a fallback: R14 and TS43 both assert the
    // export IS an xlsx, so a text body is a finding, not a format to cope with.
    throw new Error(
      'the export is not an XLSX (no ZIP magic). content-type: ' + dl.contentType +
      ' — R14/TS43 record it as OBS-<stamp>.xlsx, so this is a finding, not a parse problem.'
    );
  }
  const files = unzip(dl.body);
  const { rows, sharedStrings } = sheetRows(files);
  const columns = rows[0] || [];
  const dataRows = rows.slice(1);
  const records = dataRows.map((cells) => {
    const rec = {};
    columns.forEach((c, i) => { rec[c] = cells[i] ?? ''; });
    return rec;
  });
  return {
    ...dl,
    parts: Object.keys(files),
    sharedStrings,
    columns,
    rows: dataRows,
    records,
    /** 1-based index of the first column whose header matches, or 0. */
    columnIndex(re) {
      const i = columns.findIndex((c) => re.test(c));
      return i < 0 ? 0 : i + 1;
    },
    /** The row for one application number, or null. */
    row(applicationNo) {
      const key = columns.find((c) => /application\s*no/i.test(c));
      if (!key) return null;
      return records.find((r) => String(r[key]).trim() === String(applicationNo).trim()) || null;
    },
    /**
     * Every (row, column) whose cell contains `needle`, anywhere in the sheet.
     * TS43 step 10 is explicit that column 23 is not enough — a leak into an
     * unexpected column is still a leak.
     */
    findText(needle) {
      const hits = [];
      const want = String(needle).trim().toLowerCase();
      if (!want) return hits;
      dataRows.forEach((cells, r) => {
        cells.forEach((cell, c) => {
          if (String(cell).toLowerCase().includes(want)) {
            hits.push({ row: r + 2, column: c + 1, header: columns[c] || `(col ${c + 1})`, value: cell });
          }
        });
      });
      return hits;
    },
  };
}

/* ---------------------------------------------------------- the R14 sweep */

/**
 * THE TWO-SURFACE SWEEP, once, for every scenario that carries it.
 *
 * Reads the same application on both surfaces after a search, and reports the
 * four things R14 asks about. It REPORTS rather than asserts, because what is
 * expected differs per scenario — a pre-expiry extension has no status flip to
 * find, and TS51's subject must not have an expiry at all.
 *
 * @param page      a logged-in page (it will drive the listing itself)
 * @param applicationNo the record to read
 * @param remark    the extension remark that must NOT appear (optional; when
 *                  omitted the leak half is skipped rather than passing vacuously)
 * @param filters   extra listing filters, for the wider-search variant
 */
async function sweep(page, applicationNo, remark, filters = {}) {
  const listing = require('./listing');

  await listing.open(page);

  /**
   * ALWAYS write the box, even when the caller wants it empty.
   *
   * `listing.open()` goes through gotoObs(), which SHORT-CIRCUITS when the page
   * is already on the listing — no navigation, so no form reset. That is fine
   * for a single search and a trap for a chained one: TS43's step 12 runs a
   * narrow search, then a deliberately WIDER one to prove the remark is absent
   * at both filter widths, and an inherited application number would silently
   * make the "wider" export exactly as narrow as the first. The sweep would then
   * report "absent at both widths" having only ever asked one question.
   *
   * Same family as the dropdown inheritance the 26-08 status sweep hit. Filling
   * with '' costs nothing and removes the class of bug.
   */
  await page.getByRole('textbox', { name: /application no/i }).fill(applicationNo || '');
  const search = await listing.search(page, filters);
  const row = search.rows.find((r) => String(r.applicationNo).trim() === String(applicationNo).trim()) || null;

  // The export MUST be fired on this same page, after this same search.
  const book = await read(page);
  const bookRow = book.row(applicationNo);

  const remarkGiven = Boolean(remark && String(remark).trim());
  const listingRemark = row ? String(row.remarks ?? '') : '';
  const exportRemarkHeader = book.columns.find((c) => /^remarks?$/i.test(c)) || '';
  const exportRemark = bookRow && exportRemarkHeader ? String(bookRow[exportRemarkHeader] ?? '') : '';

  const contains = (hay) => remarkGiven && hay.toLowerCase().includes(String(remark).trim().toLowerCase());

  return {
    applicationNo,
    searchTotal: search.total,
    /** SURFACE 1 — the listing row as rendered. */
    listing: row && {
      expiryDate: row.expiryDate,
      applicationStatus: row.applicationStatus,
      hardcopyAccCreated: row.hardcopyAccCreated,
      remarks: listingRemark,
    },
    /** SURFACE 2 — the exported workbook. */
    export: {
      serverFilename: book.serverFilename,
      bytes: book.bytes,
      columnCount: book.columns.length,
      columns: book.columns,
      /** Measured, not assumed — compare against BASELINE_COLUMNS to see drift. */
      indexes: {
        expiryDate: book.columnIndex(/application\s*expiry\s*date/i),
        applicationStatus: book.columnIndex(/application\s*status/i),
        remarks: book.columnIndex(/^remarks?$/i),
      },
      /**
       * The resolved header STRINGS, or null when the column is not there.
       *
       * Callers must read cells through these, never through
       * `columns[indexes.x - 1]`. A missing column gives index 0, that
       * expression is then `columns[-1]` which is `undefined`, and
       * `row[undefined]` is `undefined` — so an assertion like "the expiry cell
       * is empty" PASSES on a workbook that has no expiry column at all. A
       * vacuous pass is the one failure mode a sweep must not have, which is why
       * these are exposed as nulls that blow up loudly instead.
       */
      headers: {
        expiryDate: book.columns[book.columnIndex(/application\s*expiry\s*date/i) - 1] ?? null,
        applicationStatus: book.columns[book.columnIndex(/application\s*status/i) - 1] ?? null,
        remarks: exportRemarkHeader || null,
      },
      row: bookRow,
      remarks: exportRemark,
    },
    /** THE LEAK CHECK — null when no remark was supplied, so it never passes vacuously. */
    leak: !remarkGiven ? null : {
      remark,
      inListingRemarks: contains(listingRemark),
      inExportRemarks: contains(exportRemark),
      /** Every cell in the whole workbook, not just column 23 (TS43 step 10). */
      anywhereInExport: book.findText(remark),
    },
    book,
  };
}

/**
 * Read one cell of the swept row by its ROLE, refusing to answer if the column
 * is missing.
 *
 * `role` is one of the keys in `export.headers`. This is the only sanctioned way
 * to read the expiry / status / remarks cells — see the note on `headers` for
 * the vacuous pass it exists to prevent.
 */
function cell(result, role) {
  const header = result.export.headers[role];
  if (!header) {
    throw new Error(
      `the exported workbook has no "${role}" column (looked across ${result.export.columnCount} columns; ` +
      `the 26-08 baseline had it at position ${BASELINE_COLUMNS[role] ?? '?'} of ${BASELINE_COLUMNS.total}).\n` +
      '  That is a finding about the export, not a parse problem — R14 and TS43 both assert this column exists.\n' +
      `  Columns actually present: ${result.export.columns.join(' | ')}`
    );
  }
  if (!result.export.row) {
    throw new Error(`${result.applicationNo} has no row in the exported workbook, so "${role}" cannot be read`);
  }
  return String(result.export.row[header] ?? '');
}

/**
 * The assertion half, for the scenarios whose expectation IS R14's default:
 * remark in neither surface, new expiry in both. Throws with a readable message
 * naming the surface that failed, so a failure reads as a finding.
 */
function assertNoLeak(result) {
  if (!result.leak) {
    throw new Error('sweep() was called without a remark — the leak check cannot pass vacuously');
  }
  const problems = [];
  if (result.leak.inListingRemarks) {
    problems.push(`the listing's Remarks column carries the extension remark: ${JSON.stringify(result.listing.remarks)}`);
  }
  if (result.leak.inExportRemarks) {
    problems.push(`export column ${result.export.indexes.remarks} (Remarks) carries the extension remark: ${JSON.stringify(result.export.remarks)}`);
  }
  const elsewhere = result.leak.anywhereInExport.filter((h) => h.column !== result.export.indexes.remarks);
  if (elsewhere.length) {
    problems.push(
      'the remark appears in ' + elsewhere.length + ' other export cell(s): ' +
      elsewhere.map((h) => `col ${h.column} "${h.header}" row ${h.row}`).join(', ')
    );
  }
  if (problems.length) {
    throw new Error(
      'R14 two-surface sweep FAILED for ' + result.applicationNo + ':\n  - ' + problems.join('\n  - ') +
      '\n  Raise against R14, and check TS24 at the same time — a leak here usually means the' +
      '\n  extension remark was written into the application\'s own Remarks field.'
    );
  }
}

module.exports = { unzip, sheetRows, download, read, sweep, cell, assertNoLeak, BASELINE_COLUMNS };
