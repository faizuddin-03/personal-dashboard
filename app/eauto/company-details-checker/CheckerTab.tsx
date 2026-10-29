"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Building2, Play, Download, Loader2, Square, Copy, Check,
  AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, Trash2,
  UploadCloud, FileSpreadsheet, X, ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react";
import ExcelJS from "exceljs";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { loadCompanyCheckerSaved, saveCompanyCheckerResults, clearCompanyCheckerSaved } from "@/lib/companyDetailsChecker";
import {
  loadUsage, markUsed, unmarkUsed, usageKey, shortDate, type UsageLedger,
} from "@/lib/companyUsageLedger";

// ── EAINT-12153 — Company Details Checker ──────────────────────
// Not the ticket's main feature (payment channels) — this is a data-prep
// sub-tool: given candidate Company ROC / New Company ROC / TIN values,
// check whether each is already used in the staging UCD Company Listing.
// The listing search is AND-only, so each column is searched in isolation
// (see knowledge/flow-ucd-company-listing.md) — a row only PASSes when all
// three are independently absent; any one PRESENT fails the whole triple,
// since the three values are meant to be used together.
//
// Moved out of page.tsx 2026-09-02 to make room for a sibling "Test Script"
// tab (TestScriptTab.tsx) — this component is otherwise unchanged.

const ENV_PRESETS = [
  { label: "SIT3", value: "https://staging.eauto.my/sit3" },
  { label: "SIT1", value: "https://staging.eauto.my/sit1" },
  { label: "UAT1", value: "https://staging.eauto.my/uat1" },
  { label: "UAT2", value: "https://staging.eauto.my/uat2" },
  { label: "UAT3", value: "https://staging.eauto.my/uat3" },
] as const;

const DEFAULT_ENV = ENV_PRESETS[0].value;

type ColumnStatus = "PRESENT" | "ABSENT" | "ERROR";
interface CompanyRowResult {
  roc: string; newRoc: string; tin: string;
  rocStatus: ColumnStatus; newRocStatus: ColumnStatus; tinStatus: ColumnStatus;
  overall: "PASS" | "FAIL";
  errorMessage?: string;
}
interface CompanyRowInput { roc: string; newRoc: string; tin: string }

// A cell holding just "-" (or blank) means "no value" in the source export
// (see the sample Company Listing export) — most rows have at least one
// such placeholder column, and per Faizuddin those are the ones NOT worth
// checking. "Complete" here means all three columns have a real value.
function isPlaceholderValue(v: string): boolean {
  const t = v.trim();
  return t === "" || t === "-";
}
function isCompleteRow(r: CompanyRowInput): boolean {
  return !isPlaceholderValue(r.roc) && !isPlaceholderValue(r.newRoc) && !isPlaceholderValue(r.tin);
}

// One row per line, 3 columns. Tab-separated (Excel paste) is the primary
// case; fall back to 2+ spaces or commas if there's no tab in the line.
function parseRows(raw: string): CompanyRowInput[] {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.includes("\t") ? line.split("\t") : line.split(/\s{2,}|,/);
      return {
        roc:    (parts[0] ?? "").trim(),
        newRoc: (parts[1] ?? "").trim(),
        tin:    (parts[2] ?? "").trim(),
      };
    })
    .filter(r => r.roc || r.newRoc || r.tin);
}

// Minimal RFC4180-ish CSV parser — handles quoted fields, embedded commas,
// escaped `""`, and CRLF/LF. Needed because eAuto's own Company Listing
// export uses ="0123456789"-style forced-text fields and free-text Remarks
// columns full of commas, so a naive split(",") would misalign every column
// after the first quoted one.
function parseCsvText(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === ",") { row.push(field); field = ""; continue; }
    if (ch === "\r") continue;
    if (ch === "\n") { row.push(field); rows.push(row); row = []; field = ""; continue; }
    field += ch;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// Header names are matched case-insensitively and trimmed — the export's
// own header row is exactly "Company ROC" / "New Company ROC" / "TIN
// Number", but this stays forgiving of stray whitespace either way.
function findColumnIndex(headers: string[], name: string): number {
  const target = name.trim().toLowerCase();
  return headers.findIndex(h => (h ?? "").toString().trim().toLowerCase() === target);
}

const REQUIRED_COLUMNS = ["Company ROC", "New Company ROC", "TIN Number"] as const;

// Dropped-file → the same tab-separated rowInput the textarea already
// produces, so parseRows() and everything downstream is untouched. Accepts
// .xlsx (via the ExcelJS dependency already used for export) and .csv
// (via parseCsvText above) — picks the parser by file extension.
async function extractRowsFromFile(file: File): Promise<CompanyRowInput[]> {
  let headers: string[] = [];
  let dataRows: string[][] = [];

  if (file.name.toLowerCase().endsWith(".csv")) {
    const table = parseCsvText(await file.text()).filter(r => r.some(c => c.trim() !== ""));
    if (!table.length) throw new Error("File is empty.");
    [headers, ...dataRows] = table;
  } else {
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(await file.arrayBuffer());
    const ws = wb.worksheets[0];
    if (!ws) throw new Error("No worksheet found in the file.");
    ws.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => { headers[colNumber] = String(cell.value ?? "").trim(); });
    for (let r = 2; r <= ws.rowCount; r++) {
      const rowValues: string[] = [];
      ws.getRow(r).eachCell({ includeEmpty: true }, (cell, colNumber) => { rowValues[colNumber] = (cell.text ?? String(cell.value ?? "")).trim(); });
      if (rowValues.some(v => v && v.trim())) dataRows.push(rowValues);
    }
  }

  const indices = REQUIRED_COLUMNS.map(name => findColumnIndex(headers, name));
  const missing = REQUIRED_COLUMNS.filter((_, i) => indices[i] === -1);
  if (missing.length) {
    throw new Error(`Couldn't find column(s) in the header row: ${missing.join(", ")}.`);
  }
  const [rocIdx, newRocIdx, tinIdx] = indices;

  const extracted = dataRows
    .map(r => ({
      roc: (r[rocIdx] ?? "").trim(),
      newRoc: (r[newRocIdx] ?? "").trim(),
      tin: (r[tinIdx] ?? "").trim(),
    }))
    .filter(r => r.roc || r.newRoc || r.tin);

  if (!extracted.length) throw new Error("No data rows found under the header.");
  return extracted;
}

async function exportToExcel(rows: CompanyRowResult[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Company Details Checker");

  ws.columns = [
    { header: "Company ROC",     key: "roc",       width: 20 },
    { header: "ROC Status",      key: "rocStatus", width: 14 },
    { header: "New Company ROC", key: "newRoc",    width: 20 },
    { header: "New ROC Status",  key: "newRocStatus", width: 14 },
    { header: "TIN Number",      key: "tin",       width: 20 },
    { header: "TIN Status",      key: "tinStatus", width: 14 },
    { header: "Overall",         key: "overall",   width: 12 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBDD7EE" } };
  });
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

  rows.forEach(r => {
    const row = ws.addRow({
      roc: r.roc, rocStatus: r.rocStatus,
      newRoc: r.newRoc, newRocStatus: r.newRocStatus,
      tin: r.tin, tinStatus: r.tinStatus,
      overall: r.overall,
    });
    for (const key of ["rocStatus", "newRocStatus", "tinStatus"] as const) {
      const cell = row.getCell(key);
      cell.font = { color: { argb: r[key] === "PRESENT" ? "FFC00000" : r[key] === "ABSENT" ? "FF008000" : "FF808080" }, bold: true };
    }
    const overallCell = row.getCell("overall");
    overallCell.font = { color: { argb: r.overall === "PASS" ? "FF008000" : "FFC00000" }, bold: true };
  });

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `company-details-checker_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

// The checkmark is "who copied last" — shared across every cell via
// copiedId/onCopy from the parent, so copying a new cell clears the old
// one's tick. That's the point: it's a memory aid for which value the user
// just grabbed, not a per-cell "copied" toast.
function CopyCell({ value, id, copiedId, onCopy }: { value: string; id: string; copiedId: string | null; onCopy: (id: string) => void }) {
  // Flash the text blue on copy, then let it fade back out — fade-in is quick
  // (so it reads as an immediate confirmation), fade-out is slow (so it's
  // still visible a beat later without needing to watch the cursor).
  const [flash, setFlash] = useState(false);
  if (!value) return <span className="text-slate-600">—</span>;
  const copied = copiedId === id;
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        onCopy(id);
        setFlash(true);
        setTimeout(() => setFlash(false), 250);
      }}
      className="group inline-flex items-center gap-1.5 hover:text-slate-100 transition-colors"
      title="Copy"
    >
      <span className={clsx(
        "font-mono transition-colors ease-in-out",
        flash ? "text-green-400 duration-200" : "text-inherit duration-[5000ms]"
      )}>
        {value}
      </span>
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="opacity-0 group-hover:opacity-60" />}
    </button>
  );
}

function StatusCell({ value, label }: { value: ColumnStatus; label: string }) {
  if (value === "ERROR") {
    return <span className="text-xs text-orange-400">{label} — check failed</span>;
  }
  return (
    <span className={clsx(
      "inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold",
      value === "PRESENT" ? "bg-red-900/40 text-red-300" : "bg-green-900/40 text-green-300"
    )}>
      {value === "PRESENT" ? "Used" : "Free"}
    </span>
  );
}

type SortKey = "roc" | "newRoc" | "tin" | "overall";
type SortDirection = "asc" | "desc";

function SortableHeader({ label, sortKey, active, direction, onSort }: {
  label: string; sortKey: SortKey; active: boolean; direction: SortDirection; onSort: (key: SortKey) => void;
}) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={clsx("inline-flex items-center gap-1 hover:text-slate-300 transition-colors", active && "text-slate-200")}
      >
        {label}
        {active ? (direction === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />) : <ArrowUpDown size={11} className="opacity-40" />}
      </button>
    </th>
  );
}

// EAINT-12257 reuses this component verbatim and passes `onUse`, which adds a
// "Use" action to every PASS row so a cleared company can be handed straight to
// the test runner. Omit the prop (as EAINT-12153 does) and nothing changes.
export interface CheckerTabProps {
  onUse?: (row: { roc: string; newRoc: string; tin: string }) => void;
  /** Which row is currently in use, so it can be marked in the table. */
  usedKey?: string;
  /** Rendered above the form — says which scenario the Use button feeds. */
  notice?: React.ReactNode;
  /** Which ticket is spending rows here, e.g. "EAINT-12257". */
  ticket?: string;
}

export const rowKey = (r: { roc: string; newRoc: string; tin: string }) =>
  `${r.roc}|${r.newRoc}|${r.tin}`;

/**
 * Registry key for this checker's run in AppShell's background-run store —
 * see hooks/useBackgroundRuns.ts. Deliberately ONE key shared by every page
 * that renders this component (12153 and 12257 both do): the route behind it
 * (`app/api/eauto/company-details-checker/run/route.ts`) holds a single
 * module-level `currentChild`, so only one check can genuinely run at a time
 * regardless of which ticket page is open. A shared key mirrors that
 * constraint instead of pretending two independent runs are possible.
 */
const RUN_KEY = "eauto/company-details-checker";

export default function CheckerTab({ onUse, usedKey, notice, ticket = "EAINT-12153" }: CheckerTabProps = {}) {
  // The spent-rows ledger is shared across tickets — a company onboarded by one
  // is dead for all of them. Lazy initialiser so it hydrates without an effect.
  const [usage, setUsage] = useState<UsageLedger>(() => loadUsage());

  // The run lives in AppShell (hooks/useBackgroundRuns.ts) so it survives
  // navigating away and back, AND survives switching between the two pages
  // that render this same component (12153 ↔ 12257) — before this, navigating
  // away mid-run reset `loading` to false while the check kept running
  // server-side, so coming back showed stale results with no sign a run was
  // even in flight.
  const { runs, startRun, stopRun, clearRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const loading = !!bgRun?.running;
  const stopping = !!bgRun?.stopping;
  const orphaned = !!bgRun?.orphaned;
  const results = useMemo(
    () => (bgRun?.result as { results?: CompanyRowResult[] } | null)?.results ?? [],
    [bgRun?.result],
  );
  const runLog = (bgRun?.result as { log?: string } | null)?.log ?? "";
  const [formError, setFormError] = useState("");
  const error = formError || bgRun?.error || "";

  const [rowInput, setRowInput]   = useState("");
  const [username, setUsername]   = useState("");
  const [password, setPassword]   = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [baseUrl, setBaseUrl]     = useState<string>(DEFAULT_ENV);
  const [customEnv, setCustomEnv] = useState(false);
  const [concurrency, setConcurrency] = useState(4);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [droppedFileName, setDroppedFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection } | null>(null);
  // Default on, per Faizuddin — most export rows have at least one "-"
  // placeholder column, and those are the ones NOT worth checking most of
  // the time. Still toggle-able for the rare run that needs everything.
  const [onlyCompleteRows, setOnlyCompleteRows] = useState(true);

  const parsedRows = parseRows(rowInput);
  const skippedCount = parsedRows.filter(r => !isCompleteRow(r)).length;
  const rows = onlyCompleteRows ? parsedRows.filter(isCompleteRow) : parsedRows;

  async function handleFile(file: File) {
    setFileError("");
    try {
      const extracted = await extractRowsFromFile(file);
      setRowInput(extracted.map(r => [r.roc, r.newRoc, r.tin].join("\t")).join("\n"));
      setDroppedFileName(file.name);
    } catch (e) {
      setFileError(e instanceof Error ? e.message : "Failed to read file.");
      setDroppedFileName("");
    }
  }

  // Restore the last-typed form fields on mount — from localStorage, so they
  // survive navigating away and back, and even a PC restart / fresh terminal.
  // Results and the run log no longer come from here — those live in the
  // background-run registry above, which is what actually stays correct while
  // a run is in flight.
  useEffect(() => {
    const saved = loadCompanyCheckerSaved();
    if (!saved) return;
    setRowInput(saved.rowInput);
    setUsername(saved.username);
    if (saved.baseUrl) {
      setBaseUrl(saved.baseUrl);
      if (!ENV_PRESETS.some(p => p.value === saved.baseUrl)) setCustomEnv(true);
    }
  }, []);

  // Persist the finished result for next-visit restore, same shape as before
  // (loadCompanyCheckerSaved/saveCompanyCheckerResults) — the background-run
  // registry already keeps it for THIS browser session, but that store is
  // capped at 24h (hooks/useBackgroundRuns.ts) and this one has always
  // survived indefinitely, so both are kept rather than narrowing behaviour.
  const savedForRunId = useRef<string | null>(null);
  useEffect(() => {
    if (!bgRun || bgRun.running || !bgRun.result) return;
    if (savedForRunId.current === bgRun.runId) return;
    savedForRunId.current = bgRun.runId;
    const data = bgRun.result as { results?: CompanyRowResult[]; log?: string };
    saveCompanyCheckerResults({
      results: data.results ?? [],
      rowInput,
      username: username.trim(),
      baseUrl,
      runLog: data.log ?? "",
      savedAt: new Date().toISOString(),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgRun?.runId, bgRun?.running, bgRun?.result]);

  function handleRun() {
    if (!rows.length) return;
    setFormError("");
    startRun<{ results?: CompanyRowResult[]; log?: string }>(RUN_KEY, {
      url: "/api/eauto/company-details-checker/run",
      body: {
        rows,
        username: username.trim() || undefined,
        password: password || undefined,
        baseUrl: baseUrl || undefined,
        concurrency,
      },
    });
  }

  function handleStop() { stopRun(RUN_KEY); }

  function handleClear() {
    clearRun(RUN_KEY);
    setRowInput("");
    setFormError("");
    setDroppedFileName("");
    setFileError("");
    clearCompanyCheckerSaved();
  }

  const statsPass = results.filter(r => r.overall === "PASS").length;
  const statsFail = results.filter(r => r.overall === "FAIL").length;
  // "Available" is what actually matters day to day: passed the check AND not
  // yet spent by any ticket.
  const statsUsed = results.filter(r => usage[usageKey(r)]).length;
  const statsAvailable = results.filter(r => r.overall === "PASS" && !usage[usageKey(r)]).length;

  // Clicking a header cycles asc -> desc -> unsorted (back to run order),
  // same 3-state pattern as most spreadsheet tools.
  function handleSort(key: SortKey) {
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return null;
    });
  }

  const sortedResults = useMemo(() => {
    if (!sort) return results;
    const { key, direction } = sort;
    const sign = direction === "asc" ? 1 : -1;
    return [...results].sort((a, b) => a[key].localeCompare(b[key]) * sign);
  }, [results, sort]);

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

      {notice}

      {/* ── Purpose note ── */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-500 leading-relaxed">
        Paste Company ROC / New Company ROC / TIN Number (3 columns pasted from Excel, one row per candidate).
        Each column is searched <span className="text-slate-300">independently</span> in the UCD Company Listing —
        a row <span className="text-green-400 font-medium">Passes</span> only when all three are free; any one
        already used <span className="text-red-400 font-medium">Fails</span> the whole row, since the three
        values are meant to be used together. This is a data check, not a test run — no recording, no evidence.
      </div>

      {/* ── Input panel ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:items-stretch">

          {/* Left: connection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Environment</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {ENV_PRESETS.map(p => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => { setBaseUrl(p.value); setCustomEnv(false); }}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      !customEnv && baseUrl === p.value
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setCustomEnv(true)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    customEnv
                      ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  )}
                >
                  Custom
                </button>
              </div>
              {customEnv ? (
                <input
                  value={baseUrl}
                  onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://staging.eauto.my/uat1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                />
              ) : (
                <p className="text-xs text-slate-600 font-mono">{baseUrl}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
                <input
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="eAuto username"
                  autoComplete="username"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    type={showPassword ? "text" : "password"}
                    placeholder="eAuto password"
                    autoComplete="current-password"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Advanced options
            </button>

            {showAdvanced && (
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Workers (concurrency)
                  <span className="text-slate-700 font-normal ml-1">— one login, this many pages checking rows in parallel</span>
                </label>
                <div className="flex items-center gap-1.5 h-[38px]">
                  <button
                    type="button"
                    onClick={() => setConcurrency(v => Math.max(1, v - 1))}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-base font-bold"
                  >−</button>
                  <span className="w-6 text-center text-sm font-semibold text-slate-200">{concurrency}</span>
                  <button
                    type="button"
                    onClick={() => setConcurrency(v => Math.min(8, v + 1))}
                    className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors text-base font-bold"
                  >+</button>
                </div>
              </div>
            )}
          </div>

          {/* Right: paste area */}
          <div className="flex flex-col">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Company ROC / New Company ROC / TIN Number
              <span className="text-slate-600 font-normal ml-1">— paste 3 columns from Excel (tab-separated), or drop a file below</span>
            </label>

            {/* Drop zone — accepts the full Company Listing export (.xlsx/.csv)
                and pulls out just the "Company ROC" / "New Company ROC" /
                "TIN Number" columns by header name, so a tester doesn't have
                to manually isolate 3 columns out of a 50+ column export
                before pasting. Populates the SAME rowInput the textarea
                below edits — nothing downstream (parseRows, handleRun)
                changes. */}
            <label
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault();
                setDragOver(false);
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className={clsx(
                "flex items-center gap-3 mb-2 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-colors",
                dragOver ? "border-blue-500 bg-blue-950/20" : "border-slate-700 hover:border-slate-600 bg-slate-800/40",
              )}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                className="hidden"
                onChange={e => { const file = e.target.files?.[0]; if (file) handleFile(file); e.target.value = ""; }}
              />
              <UploadCloud size={18} className="shrink-0 text-slate-500" />
              <div className="min-w-0 flex-1">
                {droppedFileName ? (
                  <p className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                    <FileSpreadsheet size={12} className="shrink-0 text-emerald-400" />
                    <span className="truncate">{droppedFileName}</span>
                  </p>
                ) : (
                  <p className="text-xs text-slate-500">Drop an Excel/CSV export here, or click to browse</p>
                )}
              </div>
              {droppedFileName && (
                <button
                  type="button"
                  onClick={e => { e.preventDefault(); setDroppedFileName(""); setFileError(""); }}
                  className="shrink-0 text-slate-500 hover:text-red-400 transition-colors"
                  title="Clear file"
                >
                  <X size={14} />
                </button>
              )}
            </label>
            {fileError && (
              <p className="flex items-start gap-1.5 text-xs text-red-400 mb-2">
                <AlertCircle size={12} className="shrink-0 mt-0.5" />{fileError}
              </p>
            )}

            <textarea
              value={rowInput}
              onChange={e => { setRowInput(e.target.value); setDroppedFileName(""); }}
              placeholder={"1234567-A\t202101012345\tC12345678901\n1234568-B\t202101012346\tC12345678902"}
              className="w-full flex-1 min-h-[220px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />

            {/* Skip rows where any of the 3 columns is just "-"/blank — most
                export rows have at least one placeholder column, and those
                aren't worth searching. On by default, per Faizuddin. */}
            <label className="flex items-center gap-2 mt-2 text-xs text-slate-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={onlyCompleteRows}
                onChange={e => setOnlyCompleteRows(e.target.checked)}
                className="accent-blue-600"
              />
              Only check rows where all 3 columns have a value (skip &quot;-&quot;/blank)
            </label>

            {parsedRows.length > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                {onlyCompleteRows && skippedCount > 0
                  ? `${rows.length} of ${parsedRows.length} row${parsedRows.length !== 1 ? "s" : ""} will be checked`
                  : `${rows.length} row${rows.length !== 1 ? "s" : ""} parsed`}
                {onlyCompleteRows && skippedCount > 0 && (
                  <span className="text-slate-700"> · {skippedCount} skipped ({"-"}/blank)</span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Run button */}
        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleRun}
            disabled={loading || rows.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? "Running…" : "Run Check"}
          </button>
          {loading && (
            <button
              onClick={handleStop}
              disabled={stopping}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              {stopping ? <Loader2 size={15} className="animate-spin" /> : <Square size={14} />}
              {stopping ? "Stopping…" : "Stop"}
            </button>
          )}
          {loading && (
            <p className="text-xs text-slate-500 animate-pulse">
              {stopping ? "Stopping — finishing current row, partial results will be shown…" : `Checking ${rows.length} row${rows.length !== 1 ? "s" : ""}…`}
            </p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium mb-1">Error</p>
            <pre className="text-xs text-red-500 whitespace-pre-wrap break-words font-mono">{error}</pre>
          </div>
        </div>
      )}

      {/* Run log */}
      {runLog && results.length > 0 && (
        <details className="bg-slate-900 border border-slate-800 rounded-xl">
          <summary className="px-4 py-2.5 text-xs text-slate-500 cursor-pointer select-none hover:text-slate-300">
            Show run log
          </summary>
          <pre className="px-4 pb-3 text-xs text-slate-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">{runLog}</pre>
        </details>
      )}

      {/* Toolbar */}
      {results.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-2 text-xs text-slate-500">
            {results.length} row{results.length !== 1 ? "s" : ""}
            <span className="px-2 py-0.5 rounded-full bg-green-900/60 text-green-300 border border-green-800 font-semibold">Pass {statsPass}</span>
            <span className="px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-800 font-semibold">Fail {statsFail}</span>
            {statsUsed > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">Used {statsUsed}</span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 text-indigo-300 border border-indigo-800 font-semibold">Available {statsAvailable}</span>
          </span>
          <button onClick={() => exportToExcel(results)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors ml-auto">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={handleClear} title="Clear results"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800">
            <Trash2 size={12} /> Clear
          </button>
        </div>
      )}

      {/* Results table */}
      {results.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                <SortableHeader label="Company ROC" sortKey="roc" active={sort?.key === "roc"} direction={sort?.direction ?? "asc"} onSort={handleSort} />
                <SortableHeader label="New Company ROC" sortKey="newRoc" active={sort?.key === "newRoc"} direction={sort?.direction ?? "asc"} onSort={handleSort} />
                <SortableHeader label="TIN Number" sortKey="tin" active={sort?.key === "tin"} direction={sort?.direction ?? "asc"} onSort={handleSort} />
                <SortableHeader label="Overall" sortKey="overall" active={sort?.key === "overall"} direction={sort?.direction ?? "asc"} onSort={handleSort} />
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  Test data
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedResults.map((r, idx) => (
                <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CopyCell value={r.roc} id={`${idx}-roc`} copiedId={copiedId} onCopy={setCopiedId} />
                      <StatusCell value={r.rocStatus} label="ROC" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CopyCell value={r.newRoc} id={`${idx}-newRoc`} copiedId={copiedId} onCopy={setCopiedId} />
                      <StatusCell value={r.newRocStatus} label="New ROC" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <CopyCell value={r.tin} id={`${idx}-tin`} copiedId={copiedId} onCopy={setCopiedId} />
                      <StatusCell value={r.tinStatus} label="TIN" />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={clsx(
                      "px-2.5 py-1 rounded-lg text-xs font-semibold border",
                      // A spent row reads neutral, not green — the check said it
                      // was free, but it has been consumed since.
                      usage[usageKey(r)]
                        ? "bg-slate-800 text-slate-400 border-slate-700"
                        : r.overall === "PASS"
                          ? "bg-green-950/60 text-green-300 border-green-800"
                          : "bg-red-950/60 text-red-300 border-red-800"
                    )}>
                      {usage[usageKey(r)]
                        ? "Already used"
                        : r.overall === "PASS" ? "Able to use" : "Unable to use"}
                    </span>
                    {r.errorMessage && (
                      <span className="ml-2 text-[11px] text-orange-400">{r.errorMessage}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    {(() => {
                      const spent = usage[usageKey(r)];
                      // A spent row is dead everywhere, whatever this run of the
                      // checker said — eAuto refuses the same BRN twice.
                      if (spent) {
                        return (
                          <div className="flex items-center gap-2">
                            <span
                              title={`${spent.confirmed ? "Onboarded" : "Marked used by hand"} by ${spent.ticket}` +
                                `${spent.scenario ? ` · ${spent.scenario}` : ""}` +
                                `${spent.reference ? ` · ${spent.reference}` : ""}`}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-slate-800 text-slate-400 border-slate-700"
                            >
                              <Check size={12} />Used · {spent.ticket.replace(/^EAINT-/, "")} · {shortDate(spent.usedAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => setUsage(unmarkUsed(r))}
                              title="Release this row — only if the run never reached submission"
                              className="text-[11px] text-slate-600 hover:text-slate-300 underline underline-offset-2"
                            >
                              Release
                            </button>
                          </div>
                        );
                      }
                      if (r.overall !== "PASS") return <span className="text-[11px] text-slate-700">—</span>;
                      return (
                        <div className="flex items-center gap-2">
                          {onUse && (
                            usedKey === rowKey(r) ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border bg-indigo-950/60 text-indigo-300 border-indigo-700">
                                <Check size={12} />In use
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onUse({ roc: r.roc, newRoc: r.newRoc, tin: r.tin })}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700 hover:border-indigo-600 hover:text-indigo-300 transition-colors"
                              >
                                Use
                              </button>
                            )
                          )}
                          <button
                            type="button"
                            onClick={() => setUsage(markUsed(r, { ticket, confirmed: false }))}
                            title="Record this row as spent, so no ticket offers it again"
                            className="text-[11px] text-slate-600 hover:text-slate-300 underline underline-offset-2"
                          >
                            Mark used
                          </button>
                        </div>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Survived the page but not a full browser reload. */}
      {orphaned && results.length === 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
          <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="flex-1 text-xs text-amber-200 leading-relaxed">
            A check was still running when this browser reloaded, so the dashboard lost track of it.
            It may well have finished — check the terminal.
          </p>
        </div>
      )}

      {/* No results yet */}
      {results.length === 0 && !loading && !error && !orphaned && (
        <div className="text-center py-12 text-slate-600">
          <Building2 size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">Paste rows above and run the check.</p>
        </div>
      )}
    </div>
  );
}
