"use client";
import { useEffect, useMemo, useState } from "react";
import { CarFront, Play, Square, Loader2, Copy, Check, Trash2, AlertCircle, Download, UploadCloud, FileSpreadsheet } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import NumericTextInput from "@/components/NumericTextInput";

// ── Secarang Plate / SSM Checker ───────────────────────────────
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
interface Form { baseUrl: string; sitePassword: string; postcode: string; tabs: number; ownerMode: OwnerMode; headed: boolean; raw: string }

const DEFAULT_FORM: Form = {
  baseUrl: ENV_PRESETS[0].value, sitePassword: "eAuTo<2025#", postcode: "55000",
  tabs: 20, ownerMode: "auto", headed: false, raw: "",
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
// excel". The header row is looked for in the first 10 rows; matching ignores
// case and spaces at the ends.
const FILE_COLUMNS = { vehicle: "vehicle", roc: "company roc" } as const;

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

/** Reads Vehicle + Company ROC from a dropped .xlsx / .csv as "VN⇥ROC" lines. */
async function readFileRows(file: File): Promise<string[]> {
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
      r.eachCell({ includeEmpty: true }, (c, col) => { cells[col - 1] = (c.text ?? "").trim(); });
      table[n - 1] = Array.from(cells, v => v ?? "");
    });
    table = Array.from(table, r => r ?? []);
  }
  const norm = (s: string) => (s ?? "").trim().toLowerCase();
  const headerAt = table.slice(0, 10).findIndex(r => r.some(c => norm(c) === FILE_COLUMNS.vehicle) && r.some(c => norm(c) === FILE_COLUMNS.roc));
  if (headerAt < 0) throw new Error('Couldn\'t find both "Vehicle" and "Company ROC" columns in the first 10 rows.');
  const header = table[headerAt].map(norm);
  const vi = header.indexOf(FILE_COLUMNS.vehicle), ri = header.indexOf(FILE_COLUMNS.roc);
  const lines = table.slice(headerAt + 1)
    .map(r => [(r[vi] ?? "").trim(), (r[ri] ?? "").trim()])
    .filter(([v, roc]) => v && roc && v !== "-" && roc !== "-")
    .map(([v, roc]) => `${v}\t${roc}`);
  if (!lines.length) throw new Error("No rows with both a Vehicle and a Company ROC under the header.");
  return lines;
}

/** One row per line: Vehicle No. ⇥ IC / SSM [⇥ Postcode]. Header lines are skipped. */
function parseRows(raw: string, mode: OwnerMode): RowInput[] {
  return raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean).flatMap(line => {
    const cells = (line.includes("\t") ? line.split("\t") : line.split(/\s{2,}|,/)).map(c => c.trim());
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

  // A dropped sheet fills the paste box; its ROC column means company owner.
  async function loadFile(file: File | undefined) {
    if (!file || running) return;
    try {
      const lines = await readFileRows(file);
      setForm(f => ({ ...f, raw: lines.join("\n"), ownerMode: "company" }));
      setFileNote({ ok: true, text: `${file.name}: ${lines.length} row(s) taken from "Vehicle" + "Company ROC"` });
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

  const rows = useMemo(() => parseRows(form.raw, form.ownerMode), [form.raw, form.ownerMode]);
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
  function downloadCsv() {
    const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
    const csv = tsv().split("\n").map(l => l.split("\t").map(esc).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `secarang-plate-check-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="relative flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-2">
        <span className="text-xs text-slate-600">eAuto</span>
        <span className="text-slate-700">/</span>
        <CarFront size={14} className="text-slate-500" />
        <h1 className="text-sm font-semibold text-slate-200">Secarang Plate / SSM Checker</h1>
        <span className="text-xs text-slate-600 hidden sm:block ml-auto">Error message, or can it proceed?</span>
      </header>

      <div className="p-4 sm:p-6 space-y-4 max-w-6xl">
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
                {m === "auto" ? "Auto (12-digit IC = private, else company SSM)" : m === "private" ? "All private (IC)" : "All company (SSM)"}
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
              Drop the Excel (.xlsx / .csv) here, or click to choose. Reads the <b className="text-slate-300">Vehicle</b> and <b className="text-slate-300">Company ROC</b> columns.
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
            <span className={label}>Or paste from Excel — one row per line: Vehicle No. ⇥ IC / Company SSM (⇥ Postcode, optional). Header rows are skipped.</span>
            <textarea className={clsx(field, "font-mono h-48")} value={form.raw} onChange={e => set("raw", e.target.value)} disabled={running}
              placeholder={"WXY1234\t1234567-X\nVBA5678\t201901003993\t50450"} {...noFill} />
            <p className="text-xs text-slate-500 mt-1">
              {rows.length} row(s) read · {rows.filter(r => r.ownerType === "private").length} private · {rows.filter(r => r.ownerType === "company").length} company
            </p>
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
                <button type="button" onClick={downloadCsv} disabled={!results.length}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border border-slate-800 text-slate-400 hover:text-slate-200">
                  <Download size={12} /> CSV
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
