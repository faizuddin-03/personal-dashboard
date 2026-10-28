// Official TS status writer for the QA pipeline (Faizuddin, 2026-10-27).
//
// Standing permission from Faizuddin 2026-10-27: the pipeline may write the
// STATUS COLUMN ONLY of the official QA Team workbook in the synced folder,
// values "In Progress" / "Pass" / "Fail". Nothing else in the file changes.
//
// Why the write is an XML patch and not an exceljs save: every official
// workbook carries SharePoint customXml, and many carry web extensions,
// drawings, threaded comments or rich data. An exceljs round-trip drops all of
// those. So exceljs only READS (finds the header, the status column and the TS
// rows); the write edits just the target <c> cells inside the sheet XML and
// copies every other part of the zip byte for byte. After the write the file
// is re-read with exceljs and compared part by part; any mismatch restores the
// backup taken just before.
//
// Design: scripts/pipeline/README.md §1.7, §6.3.

import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { ROOT, PIPE_DIR, nowIso, setupInfo, readTicket, updateTicket, addEvent } from "../store.mjs";

export const TS_STATUSES = ["In Progress", "Pass", "Fail"];
export const LOCKED_ERROR = "The official TS is open in Excel. Close it and the status will be written on the next try.";

const BACKUP_DIR = path.join(/*turbopackIgnore: true*/ PIPE_DIR, "backups");
const TEST_DIR = path.join(/*turbopackIgnore: true*/ PIPE_DIR, "test");
const LOG_FILE = path.join(/*turbopackIgnore: true*/ PIPE_DIR, "ts-sync.jsonl");
const PENDING_FILE = path.join(/*turbopackIgnore: true*/ PIPE_DIR, "ts-sync-pending.json");
const LOCK_FILE = path.join(/*turbopackIgnore: true*/ PIPE_DIR, "locks", "ts-sync.lock");

const KEY_RE = /^[A-Z][A-Z0-9]+-\d+$/;
// Header text of the status column, in order of preference.
const STATUS_HEADERS = [/^status\s*\(\s*pass\s*\/\s*fail\s*\)/i, /^status\b/i, /^test\s*result/i];
const TS_NO_RE = /^TS\s*No\.?$/i;
const PENDING_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// ── TS ids ──────────────────────────────────────────────────────────

const digitsOf = key => String(key ?? "").match(/-(\d+)$/)?.[1] ?? "";

/**
 * One spelling for every TS id: "12153_TS01", "TS01", "TS 1", "12153_TS_01",
 * "EAINT-12153_TS1" all become "12153_TS1" (inside EAINT-12153). null if the
 * text is not a TS id.
 */
export function canonTs(id, key) {
  const s = String(id ?? "").toUpperCase().replace(/\s+/g, "");
  const m = s.match(/^(?:[A-Z][A-Z0-9]*-)?(?:(\d{3,})[_-]?)?TS[_-]?0*(\d+)([A-Z]?)$/);
  if (!m) return null;
  const prefix = m[1] ?? digitsOf(key);
  return `${prefix ? `${prefix}_` : ""}TS${m[2]}${m[3]}`;
}

/** TS ids found anywhere in a text ("12153_TS02: FPX ..."). Two-digit spelling. */
export function tsIdsIn(text) {
  const out = new Set();
  for (const m of String(text ?? "").matchAll(/\b(\d+)_TS_?(\d+)\b/gi)) out.add(`${m[1]}_TS${m[2].padStart(2, "0")}`);
  return [...out];
}

// ── finding the workbook ────────────────────────────────────────────

/** Ticket keys in a file or folder name, incl. "EAINT-11978, 11979" and "EAINT-11977 & EAINT-12020". */
export function keysInName(name) {
  const out = new Set();
  const re = /\b([A-Z][A-Z0-9]+)-(\d{3,})((?:\s*(?:,|&|\band\b)\s*(?:[A-Z][A-Z0-9]+-)?\d{3,}(?!\d))*)/gi;
  for (const m of String(name).matchAll(re)) {
    const project = m[1].toUpperCase();
    out.add(`${project}-${m[2]}`);
    for (const more of m[3].matchAll(/(?:([A-Z][A-Z0-9]+)-)?(\d{3,})/gi)) out.add(`${(more[1] ?? project).toUpperCase()}-${more[2]}`);
  }
  return [...out];
}

const skipName = n => n.startsWith("~$") || /\[(TEMPLATE|OUTDATED)\]/i.test(n);

/** Every .xlsx under dir (follows OneDrive reparse points via statSync). */
function walkXlsx(dir, depth = 0, out = []) {
  if (depth > 6) return out;
  let names = [];
  try { names = fs.readdirSync(dir); } catch { return out; }
  for (const n of names) {
    if (skipName(n) || n === "desktop.ini") continue;
    const p = path.join(dir, n);
    let st;
    try { st = fs.statSync(p); } catch { continue; }
    if (st.isDirectory()) walkXlsx(p, depth + 1, out);
    else if (/\.xlsx$/i.test(n)) out.push({ file: p, mtimeMs: st.mtimeMs });
  }
  return out;
}

/**
 * The official workbook for a ticket in the synced QA Team folder
 * (data/agents/setup.json → sharepointDir). A file named with the key wins;
 * a file with no key in its name counts when its folder carries the key.
 * Newest first. Returns { file, candidates } or { file: null, error }.
 */
export function findOfficialWorkbook(key, opts = {}) {
  const k = String(key ?? "").toUpperCase();
  if (!KEY_RE.test(k)) return { file: null, candidates: [], error: `Not a ticket key: ${key}` };
  const dir = opts.dir ?? setupInfo().sharepointDir;
  if (!dir || !fs.existsSync(dir)) return { file: null, candidates: [], error: "The synced QA Team folder is not set up on this PC (data/agents/setup.json → sharepointDir)." };
  const candidates = [];
  for (const f of walkXlsx(dir)) {
    const own = keysInName(path.basename(f.file, ".xlsx"));
    const keys = own.length ? own : keysInName(path.basename(path.dirname(f.file)));
    if (keys.includes(k)) candidates.push({ ...f, keys, named: own.length > 0 });
  }
  candidates.sort((a, b) => b.mtimeMs - a.mtimeMs);
  const best = candidates[0]?.file ?? null;
  return best
    ? { file: best, candidates: candidates.map(c => c.file) }
    : { file: null, candidates: [], error: `No official TS workbook found for ${k} in the QA Team folder.` };
}

// ── reading ─────────────────────────────────────────────────────────

function cellText(v) {
  if (v === null || v === undefined) return "";
  if (typeof v !== "object") return String(v);
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (Array.isArray(v.richText)) return v.richText.map(r => r.text).join("");
  if ("formula" in v || "sharedFormula" in v) return v.result === undefined || v.result === null || typeof v.result === "object" ? "" : String(v.result);
  if ("hyperlink" in v) return String(v.text ?? "");
  if ("error" in v) return "";
  return String(v);
}
const clean = s => String(s).replace(/\s+/g, " ").trim();

/**
 * Header row, status column and the first row of every TS, per sheet.
 * Continuation rows of the same TS are ignored; a merged status cell is
 * addressed by its top-left (master) cell.
 */
function layoutOf(wb, key) {
  const sheets = [];
  const warnings = [];
  for (const ws of wb.worksheets) {
    const colCount = Math.max(ws.columnCount, 1);
    const textAt = (row, c) => clean(cellText(row.getCell(c).value));
    let tsCol = -1;
    const headerRows = [];
    ws.eachRow((row, n) => {
      if (n > 60) return;
      for (let c = 1; c <= colCount; c++) {
        if (TS_NO_RE.test(textAt(row, c)) && (tsCol < 0 || tsCol === c)) { tsCol = c; headerRows.push(n); break; }
      }
    });
    if (tsCol < 0) continue;

    let statusCol = -1, statusHeader = "";
    for (const re of STATUS_HEADERS) {
      for (const n of headerRows) {
        const row = ws.getRow(n);
        for (let c = 1; c <= colCount && statusCol < 0; c++) {
          const t = textAt(row, c);
          if (re.test(t)) { statusCol = c; statusHeader = t; }
        }
        if (statusCol >= 0) break;
      }
      if (statusCol >= 0) break;
    }
    if (statusCol < 0) { warnings.push(`Sheet "${ws.name}": no status column ("Status (Pass/Fail)", "Status" or "Test Result").`); continue; }

    const lastHeader = Math.max(...headerRows);
    const rows = [];
    const seen = new Set();
    ws.eachRow((row, n) => {
      if (n <= lastHeader) return;
      const raw = textAt(row, tsCol);
      const canon = canonTs(raw, key);
      if (!canon || seen.has(canon)) return;
      seen.add(canon);
      let cell = row.getCell(statusCol);
      if (cell.isMerged && cell.master) cell = cell.master;
      const v = cell.value;
      rows.push({
        ts: raw, canon, row: n, address: cell.address,
        status: clean(cellText(v)),
        formula: !!(v && typeof v === "object" && ("formula" in v || "sharedFormula" in v)),
      });
    });
    sheets.push({ name: ws.name, headerRow: headerRows[0], tsCol, statusCol, statusHeader, rows });
  }
  if (!sheets.length) warnings.push('No sheet has a "TS No." header with a status column.');
  return { sheets, warnings };
}

function friendlyReadError(e, file) {
  const code = e?.code;
  if (code === "EBUSY" || code === "EPERM" || code === "EACCES") return { locked: true, error: LOCKED_ERROR };
  if (code === "ENOENT") return { error: `The official TS was not found: ${file}` };
  if (code === "UNKNOWN") return { error: "The official TS is not downloaded on this PC (OneDrive online-only). Open it once, or set the folder to Always keep on this device." };
  return { error: `Could not read the official TS: ${e?.message ?? e}` };
}

/** { ok, file, sheets:[{name, statusHeader, rows:[{ts, canon, address, status}]}], map:{canon: status}, warnings } */
export async function readStatusMap(file, key) {
  try {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(fs.readFileSync(file));
    const k = key ?? keysInName(path.basename(file))[0];
    const { sheets, warnings } = layoutOf(wb, k);
    const map = {};
    for (const s of sheets) for (const r of s.rows) if (!(r.canon in map)) map[r.canon] = r.status;
    return { ok: true, file, sheets, map, warnings };
  } catch (e) {
    return { ok: false, file, ...friendlyReadError(e, file) };
  }
}

// ── the XML patch ───────────────────────────────────────────────────

const xmlEsc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function colNum(letters) {
  let n = 0;
  for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}

/** Sheet name → zip path of its XML (xl/worksheets/sheetN.xml). */
async function sheetPaths(zip) {
  const wbXml = await zip.file("xl/workbook.xml")?.async("string");
  const relsXml = await zip.file("xl/_rels/workbook.xml.rels")?.async("string");
  if (!wbXml || !relsXml) throw new Error("not a normal xlsx (workbook.xml missing)");
  const targets = {};
  for (const m of relsXml.matchAll(/<Relationship\b[^>]*>/g)) {
    const id = m[0].match(/\bId="([^"]+)"/)?.[1];
    const target = m[0].match(/\bTarget="([^"]+)"/)?.[1];
    if (id && target) targets[id] = target.startsWith("/") ? target.slice(1) : path.posix.join("xl", target);
  }
  const out = {};
  for (const m of wbXml.matchAll(/<sheet\b[^>]*>/g)) {
    const name = m[0].match(/\bname="([^"]*)"/)?.[1];
    const rid = m[0].match(/\br:id="([^"]+)"/)?.[1];
    if (name !== undefined && rid && targets[rid]) {
      const decoded = name.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
      out[decoded] = targets[rid];
    }
  }
  return out;
}

/**
 * Sets one cell to an inline string in a sheet's XML, keeping its style (s=)
 * and every other cell. Throws when the cell holds a formula or the XML has a
 * shape this patch does not know.
 */
function patchCell(xml, address, value) {
  const [, letters, rowStr] = address.match(/^([A-Z]+)(\d+)$/) ?? [];
  if (!letters) throw new Error(`bad cell address ${address}`);
  if (!/<sheetData\b/.test(xml)) throw new Error("sheet XML has no plain <sheetData>");
  const newInner = `<is><t xml:space="preserve">${xmlEsc(value)}</t></is>`;

  const rowRe = new RegExp(`<row\\b[^>]*\\br="${rowStr}"[^>]*?(\\/>|>([\\s\\S]*?)<\\/row>)`);
  const rowM = xml.match(rowRe);
  if (!rowM) throw new Error(`row ${rowStr} not found in the sheet XML`);
  const rowOpen = rowM[0].slice(0, rowM[0].length - rowM[1].length);
  let inner = rowM[2] ?? "";

  const cellRe = new RegExp(`<c\\b([^>]*?)\\br="${reEsc(address)}"([^>]*?)(\\/>|>([\\s\\S]*?)<\\/c>)`);
  const cellM = inner.match(cellRe);
  if (cellM) {
    if (/<f\b/.test(cellM[4] ?? "")) throw new Error(`cell ${address} holds a formula`);
    const attrs = `${cellM[1]}${cellM[2]}`.replace(/\s*\b(?:t|vm|cm)="[^"]*"/g, "").replace(/\s+$/, "");
    const cell = `<c r="${address}"${attrs ? ` ${attrs.trim()}` : ""} t="inlineStr">${newInner}</c>`;
    inner = inner.replace(cellM[0], () => cell);
  } else {
    // No cell yet: insert it in column order.
    const want = colNum(letters);
    const cell = `<c r="${address}" t="inlineStr">${newInner}</c>`;
    let at = inner.length;
    for (const m of inner.matchAll(/<c\b[^>]*\br="([A-Z]+)\d+"/g)) {
      if (colNum(m[1]) > want) { at = m.index; break; }
    }
    inner = inner.slice(0, at) + cell + inner.slice(at);
  }
  // rowOpen is "<row ..." without its closing ">" or "/>".
  return xml.replace(rowM[0], () => `${rowOpen.replace(/\s*$/, "")}>${inner}</row>`);
}

// ── locks, log, pending queue ───────────────────────────────────────

function ensureDir(d) { fs.mkdirSync(d, { recursive: true }); }

async function withLock(fn) {
  ensureDir(path.dirname(LOCK_FILE));
  const until = Date.now() + 20_000;
  for (;;) {
    try { fs.closeSync(fs.openSync(LOCK_FILE, "wx")); break; } catch (e) {
      if (e?.code !== "EEXIST") throw e;
      try { if (Date.now() - fs.statSync(LOCK_FILE).mtimeMs > 120_000) fs.rmSync(LOCK_FILE, { force: true }); } catch { /* gone */ }
      if (Date.now() > until) throw new Error("Another status write is still running. Try again shortly.");
      await new Promise(r => setTimeout(r, 150));
    }
  }
  try { return await fn(); } finally { try { fs.rmSync(LOCK_FILE, { force: true }); } catch { /* ignore */ } }
}

function logSync(entry) {
  ensureDir(PIPE_DIR);
  fs.appendFileSync(LOG_FILE, JSON.stringify({ at: nowIso(), ...entry }) + "\n");
}

/** Sync log lines for a key, newest first. */
export function readSyncLog(key, limit = 200) {
  let lines = [];
  try { lines = fs.readFileSync(LOG_FILE, "utf8").split(/\r?\n/).filter(Boolean); } catch { return []; }
  const out = [];
  for (let i = lines.length - 1; i >= 0 && out.length < limit; i--) {
    try { const e = JSON.parse(lines[i]); if (!key || e.key === key) out.push(e); } catch { /* bad line */ }
  }
  return out;
}

export function readPending() {
  try { const v = JSON.parse(fs.readFileSync(PENDING_FILE, "utf8")); return Array.isArray(v) ? v : []; } catch { return []; }
}
function writePending(list) {
  ensureDir(PIPE_DIR);
  const tmp = `${PENDING_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, PENDING_FILE);
}

/** Drops the given TS of a key from the queue (a newer status replaces them). */
function dropPending(key, ts, list = readPending()) {
  const drop = new Set(ts.map(t => canonTs(t, key)));
  return list
    .map(p => (p.key === key ? { ...p, ts: p.ts.filter(t => !drop.has(canonTs(t, key))) } : p))
    .filter(p => p.ts.length);
}

function queuePending(req, error) {
  const list = dropPending(req.key, req.ts);
  list.push({ key: req.key, ts: req.ts, status: req.status, runId: req.runId ?? null, targetPath: req.targetPath ?? null, queuedAt: nowIso(), attempts: 0, lastError: error });
  writePending(list);
}

// ── writing ─────────────────────────────────────────────────────────

const stamp = () => nowIso().replace(/[:.]/g, "-");

/** True when the file is under data/pipeline/test/ (the only place tests may write). */
export function isTestPath(p) {
  const abs = path.resolve(ROOT, String(p ?? ""));
  return abs.startsWith(TEST_DIR + path.sep);
}

/**
 * Writes `status` into the status cell of each TS in `ts`. Backs the file up
 * first, verifies after, restores the backup on any mismatch. dryRun = plan only.
 * Returns { ok, file, changed:[{ts, sheet, cell, from, to}], unchanged, missing, backup?, error?, locked? }.
 */
export async function writeStatus(file, { ts, status, key, dryRun = false } = {}) {
  if (!TS_STATUSES.includes(status)) return { ok: false, file, error: `Status must be one of: ${TS_STATUSES.join(", ")}.` };
  const k = String(key ?? keysInName(path.basename(file))[0] ?? "").toUpperCase();
  const wanted = [...new Set((ts ?? []).map(t => canonTs(t, k)).filter(Boolean))];
  if (!wanted.length) return { ok: false, file, error: "No TS ids given." };

  return withLock(async () => {
    // Excel holds a write lock while the file is open.
    if (!dryRun) {
      try { fs.closeSync(fs.openSync(file, "r+")); } catch (e) {
        const f = friendlyReadError(e, file);
        return { ok: false, file, ...f };
      }
    }
    let original;
    try { original = fs.readFileSync(file); } catch (e) { return { ok: false, file, ...friendlyReadError(e, file) }; }

    const wb = new ExcelJS.Workbook();
    try { await wb.xlsx.load(original); } catch (e) { return { ok: false, file, error: `The official TS could not be opened: ${e?.message ?? e}` }; }
    const { sheets, warnings } = layoutOf(wb, k);

    const targets = [], unchanged = [], missing = [];
    for (const c of wanted) {
      let found = false;
      for (const s of sheets) {
        const r = s.rows.find(x => x.canon === c);
        if (!r) continue;
        found = true;
        if (r.formula) return { ok: false, file, error: `${r.ts} status cell (${s.name}!${r.address}) holds a formula, so it cannot be written safely.` };
        if (r.status === status) unchanged.push(r.ts);
        else targets.push({ ts: r.ts, canon: c, sheet: s.name, cell: r.address, from: r.status, to: status });
      }
      if (!found) missing.push(c);
    }
    const base = { file, changed: targets.map(t => ({ ts: t.ts, sheet: t.sheet, cell: t.cell, from: t.from, to: t.to })), unchanged, missing, warnings };
    if (!targets.length) return { ok: missing.length < wanted.length, ...base, ...(missing.length === wanted.length ? { error: `TS not found in the official sheet: ${missing.join(", ")}` } : {}) };
    if (dryRun) return { ok: true, dryRun: true, ...base };

    // Patch only the sheets that change; every other part is copied as is.
    let zip;
    try { zip = await JSZip.loadAsync(original); } catch (e) { return { ok: false, file, error: `The official TS is not a normal xlsx: ${e?.message ?? e}` }; }
    const paths = await sheetPaths(zip);
    const touched = new Set();
    try {
      for (const t of targets) {
        const p = paths[t.sheet];
        if (!p || !zip.file(p)) throw new Error(`sheet "${t.sheet}" not found in the file`);
        const xml = await zip.file(p).async("string");
        zip.file(p, patchCell(xml, t.cell, t.to));
        touched.add(p);
      }
    } catch (e) {
      return { ok: false, file, error: `The official TS cannot be written safely: ${e?.message ?? e}` };
    }
    const out = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE", compressionOptions: { level: 6 } });

    const backupDir = path.join(BACKUP_DIR, k || "UNKNOWN");
    ensureDir(backupDir);
    const backup = path.join(backupDir, `${stamp()}-${path.basename(file)}`);
    fs.writeFileSync(backup, original);

    try { fs.writeFileSync(file, out); } catch (e) {
      try { fs.writeFileSync(file, original); } catch { /* backup is on disk */ }
      return { ok: false, file, backup, ...friendlyReadError(e, file) };
    }

    // Verify: re-reads as a workbook, the cells hold the new values, and
    // every other zip part is unchanged.
    const problem = await verifyWrite(file, original, touched, targets, k);
    if (problem) {
      try { fs.writeFileSync(file, original); } catch { /* backup is on disk */ }
      return { ok: false, file, backup, restored: true, error: `The write could not be verified (${problem}). The file was put back as it was.` };
    }
    return { ok: true, ...base, backup };
  });
}

async function verifyWrite(file, original, touched, targets, key) {
  try {
    const now = fs.readFileSync(file);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(now);
    const { sheets } = layoutOf(wb, key);
    for (const t of targets) {
      const r = sheets.find(s => s.name === t.sheet)?.rows.find(x => x.canon === t.canon);
      if (!r || r.status !== t.to) return `${t.ts} reads "${r?.status ?? "nothing"}"`;
    }
    const [a, b] = await Promise.all([JSZip.loadAsync(original), JSZip.loadAsync(now)]);
    const na = Object.keys(a.files).filter(n => !a.files[n].dir), nb = Object.keys(b.files).filter(n => !b.files[n].dir);
    if (na.length !== nb.length) return "the file has a different number of parts";
    for (const n of na) {
      if (touched.has(n)) continue;
      if (!b.file(n)) return `part ${n} is missing`;
      const [x, y] = await Promise.all([a.file(n).async("nodebuffer"), b.file(n).async("nodebuffer")]);
      if (!x.equals(y)) return `part ${n} changed`;
    }
    return null;
  } catch (e) {
    return `re-read failed: ${e?.message ?? e}`;
  }
}

// ── repeat guard (2026-10-27) ───────────────────────────────────────
// Two open tabs could post the same status for the same run. Each written
// (key, runId, TS, status) is remembered in ts-sync-written.json and an
// identical repeat is skipped. Without a runId the same (key, TS, status)
// within 2 minutes counts as a repeat. Check + record happen in one
// synchronous step, so two requests to the same server cannot both pass.
const WRITTEN_FILE = path.join(/*turbopackIgnore: true*/ PIPE_DIR, "ts-sync-written.json");
const NO_RUN_WINDOW_MS = 2 * 60 * 1000;
const WRITTEN_KEEP_MS = 14 * 24 * 60 * 60 * 1000;

function readWritten() {
  try { const v = JSON.parse(fs.readFileSync(WRITTEN_FILE, "utf8")); return v && typeof v === "object" && !Array.isArray(v) ? v : {}; } catch { return {}; }
}
function writeWritten(map) {
  ensureDir(PIPE_DIR);
  const cut = Date.now() - WRITTEN_KEEP_MS;
  const kept = Object.fromEntries(Object.entries(map).filter(([, at]) => Date.parse(at) > cut));
  const tmp = `${WRITTEN_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(kept, null, 2));
  fs.renameSync(tmp, WRITTEN_FILE);
}
const writtenSig = (key, runId, ts, status, target) => [target ? `test:${target}` : "", key, runId ?? "", canonTs(ts, key) ?? ts, status].join("|");

/** Splits ids into fresh and repeats, and reserves the fresh ones. */
function reserveWrites(key, runId, ids, status, target) {
  const map = readWritten();
  const now = Date.now();
  const fresh = [], repeats = [];
  for (const t of ids) {
    const sig = writtenSig(key, runId, t, status, target);
    const at = map[sig] ? Date.parse(map[sig]) : NaN;
    const repeat = Number.isFinite(at) && (runId ? true : now - at < NO_RUN_WINDOW_MS);
    if (repeat) repeats.push(t);
    else { fresh.push(t); map[sig] = new Date(now).toISOString(); }
  }
  if (fresh.length) writeWritten(map);
  return { fresh, repeats };
}

/** Forgets reservations whose write failed, so a later try is not skipped. */
function releaseWrites(key, runId, ids, status, target) {
  const map = readWritten();
  for (const t of ids) delete map[writtenSig(key, runId, t, status, target)];
  writeWritten(map);
}

// ── the one entry point the route uses ──────────────────────────────

/**
 * Writes the status for a pipeline ticket and logs it. Locked file → queued
 * for the next call. targetPath (tests only) must sit under data/pipeline/test/.
 */
export async function syncStatus({ key, ts, status, runId, targetPath, dryRun = false, retry = false }) {
  const k = String(key ?? "").toUpperCase();
  const ids = (Array.isArray(ts) ? ts : [ts]).map(String).filter(Boolean);
  const test = !!targetPath;
  let file;
  if (test) {
    if (!isTestPath(targetPath)) return { ok: false, error: "targetPath is only allowed under data/pipeline/test/." };
    file = path.resolve(ROOT, targetPath);
  } else {
    const known = readTicket(k)?.files?.officialTs;
    file = known && fs.existsSync(known) ? known : findOfficialWorkbook(k).file;
    if (!file) {
      const res = { ok: false, ...findOfficialWorkbook(k) };
      logSync({ key: k, ts: ids, status, runId: runId ?? null, ok: false, error: res.error, dryRun, retry });
      return res;
    }
  }

  // Same status for the same run (or within 2 min without a run) already written: skip it.
  let skippedTs = [];
  const guard = !dryRun && !retry;
  if (guard) {
    const { fresh, repeats } = reserveWrites(k, runId, ids, status, test ? targetPath : null);
    skippedTs = repeats;
    if (!fresh.length) {
      logSync({ key: k, ts: ids, status, runId: runId ?? null, file, test, dryRun, retry, ok: true, skipped: "duplicate", changed: [], unchanged: [], missing: [] });
      return { ok: true, skipped: "duplicate", skippedTs: repeats, file, changed: [], unchanged: [], missing: [] };
    }
    ids.splice(0, ids.length, ...fresh);
  }

  // A newer status replaces anything still queued for the same TS.
  if (!dryRun && !retry) {
    const left = dropPending(k, ids);
    if (left.length !== readPending().length) writePending(left);
  }

  let res;
  try {
    res = await writeStatus(file, { ts: ids, status, key: k, runId, dryRun });
  } catch (e) {
    if (guard) releaseWrites(k, runId, ids, status, test ? targetPath : null);
    throw e;
  }
  // A failed write (other than "locked, queued for retry") must not block a later try.
  if (guard && !res.ok && !res.locked) releaseWrites(k, runId, ids, status, test ? targetPath : null);
  if (skippedTs.length) res = { ...res, skippedTs };
  logSync({
    key: k, ts: ids, status, runId: runId ?? null, file, test, dryRun, retry,
    ok: res.ok, changed: res.changed ?? [], unchanged: res.unchanged ?? [], missing: res.missing ?? [],
    backup: res.backup ? path.relative(ROOT, res.backup).split(path.sep).join("/") : undefined,
    error: res.error,
  });

  if (!res.ok && res.locked && !dryRun) {
    if (!retry) queuePending({ key: k, ts: ids, status, runId, targetPath: test ? targetPath : null }, res.error);
    return { ...res, queued: true };
  }
  if (res.ok && !dryRun && !test && res.changed?.length) {
    try {
      updateTicket(k, t => {
        t.files = { ...(t.files ?? {}), officialTs: file };
      });
      addEvent(k, `Official TS: ${res.changed.map(c => c.ts).join(", ")} → ${status}`);
    } catch { /* the sheet write already succeeded */ }
  }
  return res;
}

/** Retries queued writes (files that were open in Excel). Returns what happened. */
export async function retryPending({ key } = {}) {
  const list = readPending();
  if (!list.length) return [];
  const results = [];
  const keep = [];
  for (const p of list) {
    const old = Date.now() - new Date(p.queuedAt).getTime() > PENDING_MAX_AGE_MS;
    if ((key && p.key !== key) || old) { if (!old) keep.push(p); continue; }
    const res = await syncStatus({ key: p.key, ts: p.ts, status: p.status, runId: p.runId, targetPath: p.targetPath || undefined, retry: true });
    results.push({ key: p.key, ts: p.ts, status: p.status, ok: res.ok, error: res.error });
    // Keep only what is still locked; anything else is logged and dropped.
    if (!res.ok && res.locked) keep.push({ ...p, attempts: (p.attempts ?? 0) + 1, lastError: res.error, lastTriedAt: nowIso() });
  }
  // Merge with anything queued while we were retrying.
  const current = readPending();
  const tried = new Set(list.map(p => `${p.key}|${p.queuedAt}`));
  const added = current.filter(p => !tried.has(`${p.key}|${p.queuedAt}`));
  writePending([...keep, ...added]);
  return results;
}
