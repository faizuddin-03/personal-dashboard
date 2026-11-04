"use client";
import { useEffect, useMemo, useState } from "react";
import { CarFront, Play, Square, Loader2, Copy, Check, Trash2, AlertCircle, Download, UploadCloud, FileSpreadsheet } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import NumericTextInput from "@/components/NumericTextInput";

// ── Secarang Insurance Checker (was "Plate / SSM Checker", renamed 2026-10-30) ───────────────────────────────
// Faizuddin, 2026-10-20: real vehicle numbers and company SSMs from an Excel
// sheet; for each one, "the checker will only check if the secarang/ia will
// return an error message, or it will be able to proceed". 20 tabs at once by
// default ("the data is in the hundreds"). A checker, not a tester: no
// recording, nothing bought. Script: scripts/secarang-insurance
// (tests/plate-checker.spec.ts, utils/plateCheck.ts).

const RUN_KEY = "secarang-plate-checker";
const API = "/api/secarang/plate-check";
const FORM_KEY = "secarang_plate_checker_form";

const ENV_PRESETS = [
  { label: "/ia", value: "https://staging.secarang.com/ia" },
  { label: "/preprod", value: "https://staging.secarang.com/preprod" },
] as const;

type OwnerMode = "auto" | "private" | "company";
interface RowInput { vehicleNo: string; idNo: string; ownerType: "private" | "company"; postcode?: string }
interface RowResult extends RowInput { result: "PROCEED" | "ERROR"; stage: string; message: string }
/** One row of a dropped sheet: every ID column is kept, the owner type picks one. */
interface FileRow { vehicle: string; roc: string; buyer: string }
interface FileData { name: string; rows: FileRow[] }
interface Form { baseUrl: string; sitePassword: string; postcode: string; tabs: number; ownerMode: OwnerMode; headed: boolean; raw: string; file: FileData | null }

const DEFAULT_FORM: Form = {
  baseUrl: ENV_PRESETS[0].value, sitePassword: "eAuTo<2025#", postcode: "55000",
  tabs: 20, ownerMode: "auto", headed: false, raw: "", file: null,
};

/** An IC is 12 digits starting with a real YYMMDD date; anything else is taken
 *  as an SSM. The date check keeps a 12-digit new ROC ("201901003993", month
 *  19) from being read as an IC. */
function looksLikeIc(id: string): boolean {
  const d = id.replace(/[-\s]/g, "");
  if (!/^\d{12}$/.test(d)) return false;
  const mm = +d.slice(2, 4), dd = +d.slice(4, 6);
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}

// Faizuddin, 2026-10-20: "automatically reads and takes the values from the 2
// columns titled 'Company ROC' and 'Vehicle' … i just need to drag and drop my
// excel". 2026-10-30 (eSTM export, _reference/excel/ESTM-202610301108.csv):
// "after a drop, the system will still collect all. if use choose private, will
// use IC. if choose company, will use Company ROC" — so Buyer ID (the IC) is
// read too, and the owner type picks the column. The header row is looked for
// in the first 10 rows; matching ignores case and spaces at the ends.
const FILE_COLUMNS = { vehicle: "vehicle", roc: "company roc", buyer: "buyer id" } as const;

/** Excel turns a 12-digit IC into "9.10825E+11" when the sheet is saved as CSV; the digits are lost. */
const isScientific = (v: string) => /^\d+(\.\d+)?e\+\d+$/i.test(v.trim());
const blank = (v: string) => !v.trim() || v.trim() === "-";

/** Rows to check from a dropped sheet, for the chosen owner type, plus why rows were left out. */
function fileToRows(file: FileData, mode: OwnerMode): { rows: RowInput[]; skipped: { scientific: number; noIc: number; noRoc: number } } {
  const skipped = { scientific: 0, noIc: 0, noRoc: 0 };
  const rows: RowInput[] = [];
  for (const r of file.rows) {
    const vehicleNo = r.vehicle.toUpperCase().replace(/\s+/g, "");
    const ic = r.buyer.replace(/[-\s]/g, "");
    const hasIc = looksLikeIc(ic);
    const usePrivate = mode === "private" || (mode === "auto" && hasIc);
    if (usePrivate) {
      if (hasIc) rows.push({ vehicleNo, idNo: ic, ownerType: "private" });
      else if (isScientific(r.buyer)) skipped.scientific++;
      else skipped.noIc++;
    } else if (!blank(r.roc)) rows.push({ vehicleNo, idNo: r.roc.trim(), ownerType: "company" });
    else skipped.noRoc++;
  }
  return { rows, skipped };
}

/** Minimal CSV split — quoted fields, escaped "", CRLF. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let f = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += ch; continue; }
    if (ch === '"') q = true;
    else if (ch === ",") { row.push(f); f = ""; }
    else if (ch === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
    else if (ch !== "\r") f += ch;
  }
  if (f || row.length) { row.push(f); rows.push(row); }
  return rows;
}

/** Reads Vehicle, Company ROC and Buyer ID from a dropped .xlsx / .csv. */
async function readFileRows(file: File): Promise<FileRow[]> {
  let table: string[][];
  if (file.name.toLowerCase().endsWith(".csv")) table = parseCsv(await file.text());
  else {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets.find(w => w.rowCount > 0);
    if (!ws) throw new Error("No worksheet with data in the file.");
    table = [];
    ws.eachRow({ includeEmpty: true }, (r, n) => {
      const cells: string[] = [];
      // A numeric IC cell loses its leading zero ("030426010837" → 30426010837): put it back.
      r.eachCell({ includeEmpty: true }, (c, col) => {
        const t = (c.text ?? "").trim();
        cells[col - 1] = typeof c.value === "number" && /^\d{10,11}$/.test(t) ? t.padStart(12, "0") : t;
      });
      table[n - 1] = Array.from(cells, v => v ?? "");
    });
    table = Array.from(table, r => r ?? []);
  }
  const norm = (s: string) => (s ?? "").trim().toLowerCase();
  const has = (r: string[], name: string) => r.some(c => norm(c) === name);
  const headerAt = table.slice(0, 10).findIndex(r => has(r, FILE_COLUMNS.vehicle) && (has(r, FILE_COLUMNS.roc) || has(r, FILE_COLUMNS.buyer)));
  if (headerAt < 0) throw new Error('Couldn\'t find a "Vehicle" column with a "Company ROC" or "Buyer ID" column in the first 10 rows.');
  const header = table[headerAt].map(norm);
  const vi = header.indexOf(FILE_COLUMNS.vehicle), ri = header.indexOf(FILE_COLUMNS.roc), bi = header.indexOf(FILE_COLUMNS.buyer);
  const cell = (r: string[], i: number) => (i < 0 ? "" : (r[i] ?? "").trim());
  const rows = table.slice(headerAt + 1)
    .map(r => ({ vehicle: cell(r, vi), roc: cell(r, ri), buyer: cell(r, bi) }))
    .filter(r => !blank(r.vehicle) && (!blank(r.roc) || !blank(r.buyer)));
  if (!rows.length) throw new Error("No rows with a Vehicle and a Company ROC or Buyer ID under the header.");
  return rows;
}

/** One row per line: Vehicle No. ⇥ IC / SSM [⇥ Postcode]. Header lines are skipped. */
function parseRows(raw: string, mode: OwnerMode): RowInput[] {
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).flatMap(line => {
    let cells = (line.includes("\t") ? line.split("\t") : line.split(/\s{2,}|,/)).map(c => c.trim());
    // Typed with single spaces ("VA5919 820724015555 50450", 2026-10-30): the ID is
    // the last word, or the one before a 5-digit postcode; the rest is the vehicle
    // no., so "WXY 1234 820724015555" still works.
    if (cells.length < 2) {
      const words = line.split(/\s+/);
      const tail = words.length >= 3 && /^\d{5}$/.test(words[words.length - 1]) ? words.splice(-1) : [];
      if (words.length >= 2) cells = [words.slice(0, -1).join(""), words[words.length - 1], ...tail];
    }
    const vehicleNo = (cells[0] ?? "").toUpperCase().replace(/\s+/g, "");
    const idNo = cells[1] ?? "";
    if (!vehicleNo || !idNo || !/\d/.test(vehicleNo)) return [];
    const ownerType = mode === "auto" ? (looksLikeIc(idNo) ? "private" : "company") : mode;
    const postcode = /^\d{5}$/.test(cells[2] ?? "") ? cells[2] : undefined;
    return [{ vehicleNo, idNo, ownerType, ...(postcode && { postcode }) }];
  });
}

const field = "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-600";
const label = "block text-xs text-slate-500 mb-1";
const noFill = { autoComplete: "off", "data-1p-ignore": true, "data-lpignore": "true" } as const;

export default function SecarangPlateCheckerPage() {
  const { runs, startRun, stopRun, clearRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;

  // Lazy initialiser, not a mount effect (react-hooks/set-state-in-effect) —
  // same pattern as app/eauto/12412/page.tsx.
  const [form, setForm] = useState<Form>(() => {
    if (typeof window === "undefined") return DEFAULT_FORM;
    try { const s = localStorage.getItem(FORM_KEY); return s ? { ...DEFAULT_FORM, ...JSON.parse(s) } : DEFAULT_FORM; }
    catch { return DEFAULT_FORM; }
  });
  const [live, setLive] = useState<{ total: number; results: RowResult[] } | null>(null);
  const [filter, setFilter] = useState<"all" | "PROCEED" | "ERROR">("all");
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [fileNote, setFileNote] = useState<{ ok: boolean; text: string } | null>(null);

  // A dropped sheet keeps all its ID columns; the owner type picks IC or Company ROC.
  async function loadFile(file: File | undefined) {
    if (!file || running) return;
    try {
      const fileRows = await readFileRows(file);
      setForm(f => ({ ...f, file: { name: file.name, rows: fileRows } }));
      setFileNote({ ok: true, text: `${file.name}: ${fileRows.length} row(s) taken from "Vehicle", "Company ROC" and "Buyer ID"` });
    } catch (e) {
      setFileNote({ ok: false, text: `${file.name}: ${e instanceof Error ? e.message : "could not read the file"}` });
    }
  }

  useEffect(() => {
    try { localStorage.setItem(FORM_KEY, JSON.stringify(form)); } catch { /* storage off */ }
  }, [form]);
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));

  // Progress while running: the script rewrites its output after every row.
  useEffect(() => {
    if (!running) return;
    let alive = true;
    const tick = async () => {
      try {
        const r = await fetch(API, { cache: "no-store" });
        const d = await r.json();
        if (alive) setLive({ total: d.total ?? 0, results: d.results ?? [] });
      } catch { /* next tick */ }
    };
    tick();
    const t = setInterval(tick, 3000);
    return () => { alive = false; clearInterval(t); };
  }, [running]);

  const fromFile = useMemo(() => (form.file ? fileToRows(form.file, form.ownerMode) : null), [form.file, form.ownerMode]);
  const rows = useMemo(() => fromFile?.rows ?? parseRows(form.raw, form.ownerMode), [fromFile, form.raw, form.ownerMode]);
  const finished = (bgRun?.result as { results?: RowResult[] } | null)?.results;
  const results: RowResult[] = (running ? live?.results : finished) ?? live?.results ?? [];
  const total = running ? live?.total || (bgRun?.meta?.total as number) || 0 : results.length;
  const proceed = results.filter(r => r.result === "PROCEED").length;
  const errors = results.length - proceed;
  const shown = filter === "all" ? results : results.filter(r => r.result === filter);

  function run() {
    if (!rows.length) return;
    setLive({ total: rows.length, results: [] });
    startRun(RUN_KEY, {
      url: API,
      body: { rows, baseUrl: form.baseUrl, sitePassword: form.sitePassword, postcode: form.postcode, concurrency: form.tabs, headed: form.headed },
      meta: { total: rows.length },
    });
  }

  // Tab-separated, in the pasted order, so it pastes straight back into Excel.
  const tsv = () => ["Vehicle No.\tIC / SSM\tOwner\tResult\tStopped at\tMessage",
    ...results.map(r => [r.vehicleNo, r.idNo, r.ownerType, r.result, r.stage, r.message].join("\t"))].join("\n");
  async function copy() {
    await navigator.clipboard.writeText(tsv());
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }
  // Same format as the Company Details Checker export (2026-11-02): blue bold
  // header with filters, coloured bold result. Vehicle No. and IC / SSM cells
  // are Text ("@"), so a 12-digit IC never turns into 9.10825E+11 or loses a
  // leading zero.
  async function downloadExcel() {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Secarang Insurance Checker");
    ws.columns = [
      { header: "Vehicle No.", key: "vehicleNo", width: 16, style: { numFmt: "@" } },
      { header: "IC / SSM",    key: "idNo",      width: 20, style: { numFmt: "@" } },
      { header: "Owner",       key: "ownerType", width: 12 },
      { header: "Result",      key: "result",    width: 12 },
      { header: "Stopped at",  key: "stage",     width: 22 },
      { header: "Message",     key: "message",   width: 70 },
    ];
    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true };
    headerRow.eachCell(cell => { cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBDD7EE" } }; });
    ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };
    ws.views = [{ state: "frozen", ySplit: 1 }];

    for (const r of results) {
      const row = ws.addRow({
        vehicleNo: String(r.vehicleNo), idNo: String(r.idNo),
        ownerType: r.ownerType === "private" ? "Private" : "Company",
        result: r.result, stage: r.stage, message: r.message,
      });
      row.getCell("vehicleNo").numFmt = "@";
      row.getCell("idNo").numFmt = "@";
      row.getCell("result").font = { bold: true, color: { argb: r.result === "PROCEED" ? "FF008000" : "FFC00000" } };
      row.getCell("message").alignment = { wrapText: true, vertical: "top" };
    }

    const buffer = await wb.xlsx.writeBuffer();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
    a.download = `secarang-insurance-checker_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="relative flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-2">
        <span className="text-xs text-slate-600">eAuto</span>
        <span className="text-slate-700">/</span>
        <CarFront size={14} className="text-slate-500" />
        <h1 className="text-sm font-semibold text-slate-200">Secarang Insurance Checker</h1>
        <span className="text-xs text-slate-600 hidden sm:block ml-auto">Error message, or can it proceed?</span>
      </header>

      <div className="p-4 sm:p-6 space-y-4">
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <span className={label}>Secarang</span>
              <div className="flex gap-1">
                {ENV_PRESETS.map(p => (
                  <button key={p.value} type="button" onClick={() => set("baseUrl", p.value)} disabled={running}
                    className={clsx("px-3 py-2 rounded-lg text-xs border", form.baseUrl === p.value ? "border-blue-600 text-blue-300 bg-blue-950/40" : "border-slate-800 text-slate-400 hover:text-slate-200")}>
                    {p.label}
                  </button>
                ))}
                <input className={field} value={form.baseUrl} onChange={e => set("baseUrl", e.target.value)} disabled={running} {...noFill} />
              </div>
            </div>
            <div>
              <span className={label}>Site password</span>
              <input type="password" className={field} value={form.sitePassword} onChange={e => set("sitePassword", e.target.value)} disabled={running} autoComplete="new-password" data-1p-ignore data-lpignore="true" />
            </div>
            <div>
              <span className={label}>Postcode (when the row has none)</span>
              <input className={field} value={form.postcode} onChange={e => set("postcode", e.target.value)} disabled={running} {...noFill} />
            </div>
            <div>
              <span className={label}>Tabs at once</span>
              <NumericTextInput value={form.tabs} onChange={n => set("tabs", n)} min={1} max={30} fallback={20} className={field} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="text-slate-500">Owner type:</span>
            {(["auto", "private", "company"] as const).map(m => (
              <label key={m} className="flex items-center gap-1.5 cursor-pointer">
                <input type="radio" checked={form.ownerMode === m} onChange={() => set("ownerMode", m)} disabled={running} />
                {form.file
                  ? (m === "auto" ? "Auto (Buyer ID is an IC = private, else Company ROC)" : m === "private" ? "Private (Buyer ID / IC)" : "Company (Company ROC)")
                  : (m === "auto" ? "Auto (12-digit IC = private, else company SSM)" : m === "private" ? "All private (IC)" : "All company (SSM)")}
              </label>
            ))}
            <label className="flex items-center gap-1.5 cursor-pointer ml-auto">
              <input type="checkbox" checked={form.headed} onChange={e => set("headed", e.target.checked)} disabled={running} />
              Show browsers
            </label>
          </div>

          <label
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); loadFile(e.dataTransfer.files?.[0]); }}
            className={clsx("flex items-center gap-3 rounded-xl border border-dashed px-4 py-4 cursor-pointer transition-colors",
              dragOver ? "border-blue-500 bg-blue-950/30" : "border-slate-700 hover:border-slate-500")}>
            <UploadCloud size={18} className="shrink-0 text-slate-500" />
            <span className="text-sm text-slate-400">
              Drop the Excel (.xlsx / .csv) here, or click to choose. Reads the <b className="text-slate-300">Vehicle</b>, <b className="text-slate-300">Company ROC</b> and <b className="text-slate-300">Buyer ID</b> columns; the owner type picks IC or Company ROC.
            </span>
            <input type="file" accept=".xlsx,.csv" className="hidden" disabled={running}
              onChange={e => { loadFile(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
          {fileNote && (
            <p className={clsx("text-xs flex items-center gap-1.5", fileNote.ok ? "text-emerald-400" : "text-rose-400")}>
              {fileNote.ok ? <FileSpreadsheet size={12} /> : <AlertCircle size={12} />} {fileNote.text}
            </p>
          )}

          <div>
            <span className={label}>
              {form.file
                ? <>Rows to check from <b className="text-slate-300">{form.file.name}</b> for the owner type above. Typing here stops using the file. <button type="button" className="text-blue-400 hover:text-blue-300" disabled={running} onClick={() => { set("file", null); setFileNote(null); }}>Clear file</button></>
                : "Or paste from Excel — one row per line: Vehicle No. ⇥ IC / Company SSM (⇥ Postcode, optional). Header rows are skipped."}
            </span>
            <textarea className={clsx(field, "font-mono h-48")}
              value={form.file ? rows.map(r => `${r.vehicleNo}\t${r.idNo}`).join("\n") : form.raw}
              onChange={e => setForm(f => ({ ...f, raw: e.target.value, file: null }))} disabled={running}
              placeholder={"WXY1234\t1234567-X\nVBA5678\t201901003993\t50450"} {...noFill} />
            <p className="text-xs text-slate-500 mt-1">
              {rows.length} row(s) read · {rows.filter(r => r.ownerType === "private").length} private · {rows.filter(r => r.ownerType === "company").length} company
            </p>
            {fromFile && (fromFile.skipped.scientific + fromFile.skipped.noIc + fromFile.skipped.noRoc) > 0 && (
              <p className="text-xs text-amber-400 mt-1 flex items-start gap-1.5">
                <AlertCircle size={12} className="mt-0.5 shrink-0" />
                <span>
                  Left out:
                  {fromFile.skipped.scientific > 0 && <> {fromFile.skipped.scientific} with a Buyer ID Excel turned into a number like 9.10825E+11 (digits lost in the .csv; drop the .xlsx instead, or format the column as Text before saving).</>}
                  {fromFile.skipped.noIc > 0 && <> {fromFile.skipped.noIc} whose Buyer ID is not an IC.</>}
                  {fromFile.skipped.noRoc > 0 && <> {fromFile.skipped.noRoc} with no Company ROC.</>}
                </span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {!running ? (
              <button type="button" onClick={run} disabled={!rows.length}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-sm text-white">
                <Play size={14} /> Check {rows.length || ""} row(s)
              </button>
            ) : (
              <button type="button" onClick={() => stopRun(RUN_KEY)} disabled={bgRun?.stopping}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 text-sm text-white">
                <Square size={14} /> {bgRun?.stopping ? "Stopping…" : "Stop"}
              </button>
            )}
            <button type="button" onClick={() => { clearRun(RUN_KEY); setLive(null); }} disabled={running}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-40">
              <Trash2 size={14} /> Clear results
            </button>
          </div>
          {bgRun?.error && (
            <div className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/30 border border-rose-900/50 rounded-lg p-3 whitespace-pre-wrap">
              <AlertCircle size={14} className="shrink-0 mt-0.5" /> {bgRun.error.slice(-2000)}
            </div>
          )}
        </div>

        {(running || results.length > 0) && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {running && <Loader2 size={14} className="animate-spin text-blue-400" />}
              <span className="text-slate-300">{results.length}{total ? ` / ${total}` : ""} checked</span>
              <span className="text-emerald-400">{proceed} proceed</span>
              <span className="text-rose-400">{errors} error</span>
              <div className="flex gap-1 ml-auto">
                {(["all", "PROCEED", "ERROR"] as const).map(f => (
                  <button key={f} type="button" onClick={() => setFilter(f)}
                    className={clsx("px-2.5 py-1 rounded-md text-xs border", filter === f ? "border-blue-600 text-blue-300" : "border-slate-800 text-slate-500 hover:text-slate-300")}>
                    {f === "all" ? "All" : f === "PROCEED" ? "Proceed" : "Error"}
                  </button>
                ))}
                <button type="button" onClick={copy} disabled={!results.length} title="Copy as Excel rows"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-slate-800 text-slate-400 hover:text-slate-200">
                  {copied ? <Check size={12} /> : <Copy size={12} />} Copy
                </button>
                <button type="button" onClick={downloadExcel} disabled={!results.length}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white">
                  <Download size={12} /> Export Excel
                </button>
              </div>
            </div>
            {running && total > 0 && (
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${(results.length / total) * 100}%` }} />
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-slate-500 text-left">
                  <tr className="border-b border-slate-800">
                    <th className="py-2 pr-3">Vehicle No.</th><th className="py-2 pr-3">IC / SSM</th><th className="py-2 pr-3">Owner</th>
                    <th className="py-2 pr-3">Result</th><th className="py-2 pr-3">Stopped at</th><th className="py-2">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={`${r.vehicleNo}-${r.idNo}-${i}`} className="border-b border-slate-800/60 text-slate-300">
                      <td className="py-1.5 pr-3 font-mono">{r.vehicleNo}</td>
                      <td className="py-1.5 pr-3 font-mono">{r.idNo}</td>
                      <td className="py-1.5 pr-3 capitalize">{r.ownerType}</td>
                      <td className="py-1.5 pr-3">
                        <span className={clsx("px-2 py-0.5 rounded-full font-medium", r.result === "PROCEED" ? "bg-emerald-950 text-emerald-300" : "bg-rose-950 text-rose-300")}>
                          {r.result === "PROCEED" ? "Proceed" : "Error"}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 text-slate-400">{r.stage}</td>
                      <td className="py-1.5 text-slate-400">{r.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
