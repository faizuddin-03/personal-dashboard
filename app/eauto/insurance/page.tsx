"use client";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Shield, Play, Download, Loader2, Square,
  TableProperties, LayoutGrid, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, Trash2,
  Search, X,
} from "lucide-react";
import ExcelJS from "exceljs";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import { InsuranceRow, VehicleEntry, loadInsuranceSaved, clearInsuranceSaved } from "@/lib/insurance";
import {
  SecarangRow, SecarangJob, SecarangVehicle, SecarangRunParams,
  VehicleEntry as ScVehicleEntry,
  loadSecarangSaved, clearSecarangSaved,
  loadRegressionSecarangSaved, clearRegressionSecarangSaved,
  RegressionResult, RegressionStepResult, RegressionScreenshot,
  VerificationData, VerificationRow, PdfVerificationRow, PostcodeChangeInfo,
  loadRegressionTestResult, saveRegressionTestResult, clearRegressionTestResult,
  buildVehicles,
} from "@/lib/secarang";

// ── Environment presets ───────────────────────────────────────
const ENV_PRESETS = [
  { label: "SIT3", value: "https://staging.eauto.my/sit3" },
  { label: "SIT1", value: "https://staging.eauto.my/sit1" },
  { label: "UAT1", value: "https://staging.eauto.my/uat1" },
  { label: "UAT2", value: "https://staging.eauto.my/uat2" },
  { label: "UAT3", value: "https://staging.eauto.my/uat3" },
] as const;

const DEFAULT_ENV = ENV_PRESETS[0].value;

// ── Types ─────────────────────────────────────────────────────
const ALL_INSURERS = ["Zurich", "Takaful", "Lonpac", "Chubb", "Tokio Marine"] as const;

// ── Estimate helpers ──────────────────────────────────────────
const SECS_PER_VEHICLE = 50;

function estimateTime(vehicleCount: number, concurrency: number): string {
  if (vehicleCount === 0) return "";
  const batches = Math.ceil(vehicleCount / concurrency);
  const totalSecs = batches * SECS_PER_VEHICLE;
  if (totalSecs < 60) return `~${totalSecs}s`;
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  return secs > 0 ? `~${mins}m ${secs}s` : `~${mins}m`;
}

type ViewMode = "table" | "matrix";
type AllowFilter = "all" | "yes" | "no" | "refer";
type SortDir = "asc" | "desc";
interface SortState { key: keyof InsuranceRow | null; dir: SortDir }

const COLUMNS: { key: keyof InsuranceRow; label: string }[] = [
  { key: "vehicleNumber",  label: "Vehicle No."    },
  { key: "make",           label: "Make"           },
  { key: "model",          label: "Model"          },
  { key: "mfgYear",        label: "Mfg Year"       },
  { key: "engineCC",       label: "Engine CC"      },
  { key: "transmission",   label: "Transmission"   },
  { key: "variant",        label: "Variant"        },
  { key: "insurer",        label: "Insurer"        },
  { key: "coverType",      label: "Cover Type"     },
  { key: "allowPurchase",  label: "Allow Purchase" },
  { key: "referRiskCode",  label: "Refer Risk"     },
  { key: "totalPrice",     label: "Total Price"    },
];

// ── Helpers ───────────────────────────────────────────────────
function formatCoverType(v: string) {
  if (!v) return "—";
  const stripped = v.replace(/^cover type\s*/i, "").trim();
  if (!stripped) return "—";
  if (/^third/i.test(stripped)) return "Third Party";
  return stripped;
}

// Normalise an IC or SSM number typed / pasted by the user.
// IC  format has 2 dashes: "030217-14-1005" → strip all → "030217141005"
// SSM format has 1 dash:   "1234567-X"      → keep dash → "1234567-X"
// Whitespace is always removed regardless.
function normalizeIdNumber(raw: string): string {
  const s = raw.replace(/\s/g, "");
  return (s.match(/-/g) ?? []).length >= 2 ? s.replace(/-/g, "") : s;
}

// One vehicle per line. Each line may carry an optional IC/SSM number after
// the plate, separated by a tab (Excel paste), comma, or spaces.
function parseVehicles(raw: string): VehicleEntry[] {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\s,]+/).filter(Boolean);
      const vehicleNumber = (parts[0] ?? "").toUpperCase();
      const icNumber = parts[1] ? normalizeIdNumber(parts[1]) : undefined;
      return { vehicleNumber, icNumber };
    })
    .filter(v => v.vehicleNumber);
}

async function exportToExcel(rows: InsuranceRow[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Insurance Results");

  ws.columns = [
    { header: "Vehicle Number",  key: "vehicleNumber",  width: 16 },
    { header: "Make",            key: "make",           width: 12 },
    { header: "Model",           key: "model",          width: 16 },
    { header: "Mfg Year",        key: "mfgYear",        width: 10 },
    { header: "Engine CC",       key: "engineCC",       width: 11 },
    { header: "Transmission",    key: "transmission",   width: 14 },
    { header: "Variant",         key: "variant",        width: 16 },
    { header: "Insurer",         key: "insurer",        width: 15 },
    { header: "Cover Type",      key: "coverType",      width: 13 },
    { header: "Allow Purchase",  key: "allowPurchase",  width: 15 },
    { header: "Refer Risk Code", key: "referRiskCode",  width: 17 },
    { header: "Total Price",     key: "totalPrice",     width: 14 },
  ];

  // Bold + light blue header row
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.eachCell(cell => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFBDD7EE" } };
  });

  // Auto-filter across all header columns
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ws.columns.length } };

  rows.forEach(r => ws.addRow({
    vehicleNumber: r.vehicleNumber, make: r.make, model: r.model,
    mfgYear: r.mfgYear, engineCC: r.engineCC, transmission: r.transmission,
    variant: r.variant, insurer: r.insurer, coverType: r.coverType,
    allowPurchase: r.allowPurchase, referRiskCode: r.referRiskCode, totalPrice: r.totalPrice,
  }));

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `insurance_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

function isDualCover(ins: string) {
  const n = ins.toLowerCase().trim();
  return n === "zurich" || n === "takaful" || n.startsWith("zurich") || n.startsWith("takaful");
}
type MatrixColDef = { key: string; insurer: string; plan: "first" | "tpft" | "single"; label: string; sub: string };

type DualCover = { firstParty: string; tpft: string };
type MatrixCell = DualCover | string;

function buildMatrix(rows: InsuranceRow[]) {
  const map = new Map<string, Map<string, MatrixCell>>();
  for (const r of rows) {
    const vn = r.vehicleNumber.toUpperCase();
    if (!map.has(vn)) map.set(vn, new Map());
    if (!r.insurer) continue;
    if (isDualCover(r.insurer)) {
      const prev = (map.get(vn)!.get(r.insurer) ?? { firstParty: "", tpft: "" }) as DualCover;
      const isTPFT = /third/i.test(r.coverType ?? "");
      map.get(vn)!.set(r.insurer, isTPFT
        ? { ...prev, tpft: r.allowPurchase }
        : { ...prev, firstParty: r.allowPurchase }
      );
    } else {
      map.get(vn)!.set(r.insurer, r.allowPurchase);
    }
  }
  return map;
}

// ── Allow Purchase badge ──────────────────────────────────────
function AllowBadge({ value }: { value: string }) {
  const v = value.trim().toLowerCase();
  if (["yes", "y", "true", "1"].includes(v))
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/60 text-green-300 border border-green-800">Yes</span>;
  if (["no", "n", "false", "0"].includes(v))
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/60 text-red-300 border border-red-800">No</span>;
  if (v.startsWith("refer"))
    return <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-900/60 text-yellow-300 border border-yellow-800">{value}</span>;
  return <span className="text-slate-400 text-xs">{value || "—"}</span>;
}

// ── Main page ─────────────────────────────────────────────────
export default function InsurancePage() {
  const { insuranceJob, startInsuranceRun, stopInsuranceRun, clearInsuranceJob, restoreInsuranceJob } = useApp();

  // Input — local only, restored from job/localStorage on mount
  const [vehicleInput, setVehicleInput]     = useState("");
  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [baseUrl, setBaseUrl]               = useState<string>(DEFAULT_ENV);
  const [customEnv, setCustomEnv]           = useState(false);
  const [icNumber, setIcNumber]             = useState("");
  const [postcode, setPostcode]             = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<"individual" | "company">("individual");
  const [concurrency, setConcurrency]       = useState(8);
  const [showAdvanced, setShowAdvanced]     = useState(false);

  // Display
  const [view, setView]         = useState<ViewMode>("table");
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [shownInsurers, setShownInsurers] = useState<Set<string>>(() => {
    const found = (insuranceJob?.rows ?? []).map(r => r.insurer).filter(Boolean);
    return found.length > 0 ? new Set(found) : new Set(ALL_INSURERS);
  });
  const [search, setSearch]               = useState("");
  const [allowFilter, setAllowFilter]     = useState<AllowFilter>("all");
  const [sort, setSort]                   = useState<SortState>({ key: null, dir: "asc" });

  // Derive run state from context job
  const loading  = insuranceJob?.loading  ?? false;
  const stopping = insuranceJob?.stopping ?? false;
  // "IC" for individuals, "SSM" for companies — display label only, no process change
  const idLabel  = vehicleCategory === "company" ? "SSM" : "IC";
  const rows    = insuranceJob?.rows    ?? [];
  const error   = insuranceJob?.error   ?? "";
  const runLog  = insuranceJob?.log     ?? "";
  const savedAt = insuranceJob?.savedAt ?? null;
  const hasRun  = insuranceJob !== null;

  // On mount: restore input fields from active job or localStorage
  useEffect(() => {
    if (insuranceJob) {
      setVehicleInput(insuranceJob.vehicleInput);
      if (insuranceJob.username) setUsername(insuranceJob.username);
      if (insuranceJob.baseUrl) {
        setBaseUrl(insuranceJob.baseUrl);
        if (!ENV_PRESETS.some(p => p.value === insuranceJob.baseUrl)) setCustomEnv(true);
      }
      const found = new Set(insuranceJob.rows.map(r => r.insurer).filter(Boolean));
      if (found.size) setShownInsurers(found);
      return;
    }
    const saved = loadInsuranceSaved();
    if (!saved || saved.rows.length === 0) return;
    setVehicleInput(saved.vehicleInput);
    if (saved.username) setUsername(saved.username);
    if (saved.baseUrl) {
      setBaseUrl(saved.baseUrl);
      if (!ENV_PRESETS.some(p => p.value === saved.baseUrl)) setCustomEnv(true);
    }
    const found = new Set(saved.rows.map((r: InsuranceRow) => r.insurer).filter(Boolean));
    setShownInsurers(found.size ? found : new Set(ALL_INSURERS));
    // Restore saved results into context
    restoreInsuranceJob({
      loading: false, rows: saved.rows, error: "", log: saved.runLog ?? "",
      savedAt: saved.savedAt, vehicleInput: saved.vehicleInput,
      username: saved.username, baseUrl: saved.baseUrl,
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep insurer filter in sync when job rows arrive
  useEffect(() => {
    if (!rows.length) return;
    const found = new Set(rows.map(r => r.insurer).filter(Boolean));
    if (found.size) setShownInsurers(found);
  }, [rows]);

  function handleClearResults() {
    clearInsuranceSaved();
    clearInsuranceJob();
    setVehicleInput("");
    setShownInsurers(new Set(ALL_INSURERS));
  }

  const vehicles = parseVehicles(vehicleInput);

  function toggleInsurer(ins: string) {
    setShownInsurers(prev => {
      const next = new Set(prev);
      if (next.has(ins)) { if (next.size > 1) next.delete(ins); }
      else next.add(ins);
      return next;
    });
  }

  function handleRun() {
    if (!vehicles.length) return;
    startInsuranceRun({
      vehicles,
      username:        username.trim()  || undefined,
      password:        password         || undefined,
      icNumber:        icNumber.trim()  || undefined,
      postcode:        postcode.trim()  || undefined,
      vehicleCategory,
      baseUrl:         baseUrl          || undefined,
      concurrency,
      vehicleInput,
      usernameDisplay: username.trim(),
      baseUrlDisplay:  baseUrl,
    });
  }

  // Filtered results for display
  const filteredRows = rows.filter(r => !r.insurer || shownInsurers.has(r.insurer));

  // Search + allowPurchase filter
  // Error rows bypass the allowPurchase filter (they have no purchase data) but still respect search
  const searchLower = search.trim().toLowerCase();
  const isErrorRow = (r: InsuranceRow) => r.status === "ERROR" || r.status === "NO_VEHICLE_INFO";
  const afterSearch = filteredRows.filter(r => {
    if (searchLower) {
      const hit = [r.vehicleNumber, r.make, r.model, r.insurer, r.errorMessage ?? ""]
        .some(f => f.toLowerCase().includes(searchLower));
      if (!hit) return false;
    }
    if (!isErrorRow(r) && allowFilter !== "all") {
      const v = r.allowPurchase.trim().toLowerCase();
      if (allowFilter === "yes"   && !["yes","y","true","1"].includes(v))          return false;
      if (allowFilter === "no"    && !["no","n","false","0"].includes(v))           return false;
      if (allowFilter === "refer" && !v.startsWith("refer"))                        return false;
    }
    return true;
  });

  // Sort (error rows always sort to the bottom)
  const displayRows = sort.key
    ? [...afterSearch].sort((a, b) => {
        const aErr = isErrorRow(a), bErr = isErrorRow(b);
        if (aErr !== bErr) return aErr ? 1 : -1;
        const av = a[sort.key!] ?? "";
        const bv = b[sort.key!] ?? "";
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
        return sort.dir === "asc" ? cmp : -cmp;
      })
    : afterSearch;

  function toggleSort(key: keyof InsuranceRow) {
    setSort(prev =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  }

  // Summary stats over displayRows (error rows counted separately)
  const statsYes   = displayRows.filter(r => !isErrorRow(r) && ["yes","y","true","1"].includes(r.allowPurchase.trim().toLowerCase())).length;
  const statsNo    = displayRows.filter(r => !isErrorRow(r) && ["no","n","false","0"].includes(r.allowPurchase.trim().toLowerCase())).length;
  const statsRefer = displayRows.filter(r => !isErrorRow(r) && r.allowPurchase.trim().toLowerCase().startsWith("refer")).length;
  const statsError = displayRows.filter(isErrorRow).length;

  // Matrix only uses successful rows (error rows have no insurer data)
  const matrixRows     = afterSearch.filter(r => !isErrorRow(r));
  const matrix         = buildMatrix(matrixRows);
  const matrixVehicles = Array.from(matrix.keys());
  const matrixInsurers = Array.from(new Set(matrixRows.map(r => r.insurer).filter(Boolean)));
  // Flat column list — dual insurers expand into two columns
  const matrixCols: MatrixColDef[] = [];
  for (const ins of matrixInsurers) {
    if (isDualCover(ins)) {
      matrixCols.push({ key: `${ins}__1st`,  insurer: ins, plan: "first",  label: ins, sub: "1st Party" });
      matrixCols.push({ key: `${ins}__tpft`, insurer: ins, plan: "tpft",   label: ins, sub: "Third Party" });
    } else {
      matrixCols.push({ key: ins,             insurer: ins, plan: "single", label: ins, sub: "" });
    }
  }
  const foundInsurers  = Array.from(new Set(rows.map(r => r.insurer).filter(Boolean)));

  const [activeTab, setActiveTab] = useState<"check" | "tab2" | "tab3">("check");

  // Daily maintenance window: 10:50 – 13:00 MYT (UTC+8), repeated every day
  function inMaintenanceWindow(): boolean {
    const myt = new Date(Date.now() + 8 * 60 * 60 * 1000); // shift to UTC+8
    const total = myt.getUTCHours() * 60 + myt.getUTCMinutes();
    return total >= 10 * 60 + 50 && total < 13 * 60 + 30;   // 10:50–13:30
  }
  const [blocked, setBlocked] = useState(() => inMaintenanceWindow());
  useEffect(() => {
    const t = setInterval(() => setBlocked(inMaintenanceWindow()), 30_000);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="relative flex flex-col min-h-full">

      {/* ── Blocking overlay — covers page content only, sidebar stays accessible ── */}
      {blocked && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="max-w-md w-full mx-4 bg-red-950 border-2 border-red-500 rounded-2xl p-8 text-center shadow-2xl">
            <div className="text-red-400 text-5xl mb-4">⛔</div>
            <h2 className="text-xl font-black text-red-300 uppercase tracking-wide mb-3">Access Restricted</h2>
            <p className="text-red-200 text-base font-medium leading-relaxed">
              The environment is under maintenance.<br />
              <span className="font-black">DO NOT proceed with any insurance transaction.</span>
            </p>
            <p className="mt-5 text-xs text-red-400/70">Maintenance window: 10:50 AM – 1:30 PM (MYT) daily. Page will unlock automatically.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">eAuto</span>
          <span className="text-slate-700">/</span>
          <Shield size={14} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">Insurance Checker</h1>
        </div>
        {rows.length > 0 && savedAt && (
          <span className="text-xs text-slate-600 hidden sm:block">
            Saved {new Date(savedAt).toLocaleString()}
          </span>
        )}
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-4 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("check")}
          className={clsx(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "check"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          )}
        >
          Insurance Availability - eAuto
        </button>
        <button
          onClick={() => setActiveTab("tab2")}
          className={clsx(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "tab2"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          )}
        >
          Insurance Availability - Secarang
        </button>
        <button
          onClick={() => setActiveTab("tab3")}
          className={clsx(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "tab3"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-slate-500 hover:text-slate-300"
          )}
        >
          Regression - Secarang
        </button>
      </div>

      <div className={clsx(activeTab !== "tab2" && "hidden")}><SecarangTab mode="standard" /></div>
      <div className={clsx(activeTab !== "tab3" && "hidden")}><RegressionTab /></div>

      <div className={clsx(activeTab !== "check" && "hidden", "px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5")}>

        {/* ── Input panel ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:items-stretch">

          {/* ── Left: connection + options ── */}
          <div className="space-y-4">

          {/* ── Environment ── */}
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
            {customEnv && (
              <input
                value={baseUrl}
                onChange={e => setBaseUrl(e.target.value)}
                placeholder="https://staging.eauto.my/uat1"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            )}
            {!customEnv && (
              <p className="text-xs text-slate-600 font-mono">{baseUrl}</p>
            )}
          </div>

          {/* ── Credentials ── */}
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

          {/* ── Advanced options toggle ── */}
          <button
            onClick={() => setShowAdvanced(v => !v)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            Advanced options
          </button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  {vehicleCategory === "company" ? "SSM Number" : "IC Number"} <span className="text-slate-700">default: 030217141005</span>
                </label>
                <input
                  value={icNumber}
                  onChange={e => setIcNumber(e.target.value)}
                  placeholder="030217141005"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  Postcode <span className="text-slate-700">default: 31150</span>
                </label>
                <input
                  value={postcode}
                  onChange={e => setPostcode(e.target.value)}
                  placeholder="31150"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Vehicle Category</label>
                <div className="flex gap-1.5 h-[38px]">
                  {(["individual", "company"] as const).map(cat => (
                    <button key={cat} onClick={() => setVehicleCategory(cat)}
                      className={clsx("flex-1 rounded-lg text-xs font-medium border transition-all capitalize",
                        vehicleCategory === cat
                          ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                          : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300")}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Workers (concurrency)</label>
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
            </div>
          )}

          </div>{/* end left column */}

          {/* ── Right: vehicle numbers + IC (tall) ── */}
          <div className="flex flex-col">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Vehicle Numbers
              <span className="text-slate-600 font-normal ml-1">— one per line, optional {idLabel} after the plate (paste 2 columns from Excel)</span>
            </label>
            <textarea
              value={vehicleInput}
              onChange={e => setVehicleInput(e.target.value)}
              placeholder={"WXX1234\t030217141005\nABC5678\t900101015523\nXYZ9012  (uses default IC)"}
              className="w-full flex-1 min-h-[260px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
            {vehicles.length > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
                {" · "}
                <span className="text-slate-500 font-medium">
                  est. {estimateTime(vehicles.length, concurrency)}
                </span>
                {" "}
                <span className="text-slate-700">({concurrency} workers)</span>
                {vehicles.some(v => v.icNumber) && (
                  <span className="text-slate-500">
                    {" · "}{vehicles.filter(v => v.icNumber).length} with custom {idLabel}
                  </span>
                )}
              </p>
            )}
          </div>

          </div>{/* end grid */}

          {/* ── Run button ── */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={handleRun}
              disabled={loading || vehicles.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              {loading ? "Running…" : "Run Check"}
            </button>
            {loading && (
              <button
                onClick={stopInsuranceRun}
                disabled={stopping}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                {stopping ? <Loader2 size={15} className="animate-spin" /> : <Square size={14} />}
                {stopping ? "Stopping…" : "Stop"}
              </button>
            )}
            {loading && (
              <p className="text-xs text-slate-500 animate-pulse">
                {stopping
                  ? "Stopping — finishing current vehicle, partial results will be shown…"
                  : `Checking ${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""} — please wait (est. ${estimateTime(vehicles.length, concurrency)})…`}
              </p>
            )}
            {!loading && vehicles.length > 0 && (
              <p className="text-xs text-slate-600">
                Est. {estimateTime(vehicles.length, concurrency)}
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

        {/* Playwright log (collapsed by default) */}
        {runLog && rows.length > 0 && (
          <details className="bg-slate-900 border border-slate-800 rounded-xl">
            <summary className="px-4 py-2.5 text-xs text-slate-500 cursor-pointer select-none hover:text-slate-300">
              Show run log
            </summary>
            <pre className="px-4 pb-3 text-xs text-slate-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">{runLog}</pre>
          </details>
        )}

        {/* No results */}
        {hasRun && !loading && !error && rows.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <Shield size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">No results returned.</p>
            <p className="text-xs mt-1">Check that the script ran correctly and output-results.xlsx was created.</p>
          </div>
        )}

        {/* ── Results toolbar: view toggle + export + clear ── */}
        {rows.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
              <button onClick={() => setView("table")}
                className={clsx("px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5",
                  view === "table" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
                <TableProperties size={12} /> Table
              </button>
              <button onClick={() => setView("matrix")}
                className={clsx("px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5",
                  view === "matrix" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
                <LayoutGrid size={12} /> Matrix
              </button>
            </div>
            <button onClick={() => exportToExcel(displayRows)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors">
              <Download size={12} /> Export Excel
            </button>
            <button onClick={handleClearResults} title="Clear saved results"
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800">
              <Trash2 size={12} /> Clear
            </button>
          </div>
        )}

        {/* ── Unified filter card ── */}
        {rows.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
            {/* Search row */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vehicle number, make, model, insurer…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pl-9 pr-9 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter pills row */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
              {/* Insurer group */}
              {foundInsurers.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold shrink-0">Insurer</span>
                  <button
                    onClick={() => setShownInsurers(new Set(foundInsurers))}
                    className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                      shownInsurers.size === foundInsurers.length
                        ? "bg-slate-700 border-slate-600 text-slate-200"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}>All</button>
                  {foundInsurers.map(ins => {
                    const active = shownInsurers.has(ins);
                    return (
                      <button key={ins} onClick={() => toggleInsurer(ins)}
                        className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                          active
                            ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                            : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                        )}>{ins}</button>
                    );
                  })}
                </div>
              )}

              {/* Divider */}
              {foundInsurers.length > 0 && <span className="text-slate-700 hidden sm:block">|</span>}

              {/* Allow Purchase group */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold shrink-0">Allow</span>
                {(["all", "yes", "no", "refer"] as AllowFilter[]).map(f => (
                  <button key={f} onClick={() => setAllowFilter(f)}
                    className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border transition-all capitalize",
                      allowFilter === f
                        ? f === "yes"   ? "bg-green-900/60 border-green-700 text-green-300"
                          : f === "no"  ? "bg-red-900/60 border-red-700 text-red-300"
                          : f === "refer" ? "bg-yellow-900/60 border-yellow-700 text-yellow-300"
                          : "bg-slate-700 border-slate-600 text-slate-200"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}>{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</button>
                ))}
              </div>
            </div>

            {/* Active filter summary + clear */}
            {(search || allowFilter !== "all" || shownInsurers.size < foundInsurers.length) && (
              <div className="flex items-center justify-between text-xs pt-0.5 border-t border-slate-800">
                <span className="text-slate-500">
                  Showing <span className="text-slate-200 font-medium">{displayRows.length}</span> of <span className="text-slate-200 font-medium">{rows.length}</span> rows
                </span>
                <button
                  onClick={() => { setSearch(""); setAllowFilter("all"); setShownInsurers(new Set(foundInsurers)); }}
                  className="text-blue-400 hover:text-blue-300 font-medium"
                >Clear filters</button>
              </div>
            )}
          </div>
        )}

        {/* ── Summary stats (inline one-liner) ── */}
        {displayRows.length > 0 && view === "table" && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">{displayRows.length} row{displayRows.length !== 1 ? "s" : ""}</span>
            <span className="text-slate-700">·</span>
            <span className="px-2 py-0.5 rounded-full bg-green-900/60 text-green-300 border border-green-800 font-semibold">Yes {statsYes}</span>
            <span className="px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-800 font-semibold">No {statsNo}</span>
            <span className="px-2 py-0.5 rounded-full bg-yellow-900/60 text-yellow-300 border border-yellow-800 font-semibold">Refer {statsRefer}</span>
            {statsError > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-orange-900/60 text-orange-300 border border-orange-800 font-semibold">Error {statsError}</span>
            )}
          </div>
        )}

        {/* ── Empty state: filters produced no results ── */}
        {afterSearch.length === 0 && rows.length > 0 && view === "table" && (
          <div className="text-center py-10 text-slate-600 text-sm">
            No rows match your filters — try adjusting the search or filters above.
          </div>
        )}

        {/* ── Table view ── */}
        {displayRows.length > 0 && view === "table" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  {COLUMNS.map(col => {
                    const active = sort.key === col.key;
                    return (
                      <th key={col.key}
                        onClick={() => toggleSort(col.key)}
                        className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-300 transition-colors">
                        <span className="inline-flex items-center gap-1">
                          {col.label}
                          {active
                            ? <span className="text-blue-400">{sort.dir === "asc" ? "▲" : "▼"}</span>
                            : <span className="text-slate-700 opacity-0 group-hover:opacity-100">▲</span>
                          }
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, idx) => {
                  if (isErrorRow(row)) {
                    const isNoInfo = row.status === "NO_VEHICLE_INFO";
                    return (
                      <tr key={idx} className="border-b border-red-900/30 bg-red-950/15">
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-300 whitespace-nowrap">{row.vehicleNumber || "—"}</td>
                        <td colSpan={COLUMNS.length - 1} className="px-3 py-2.5">
                          <div className="flex items-center gap-2.5">
                            <span className={clsx(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap",
                              isNoInfo
                                ? "bg-yellow-900/50 border-yellow-700/60 text-yellow-300"
                                : "bg-red-900/50 border-red-700/60 text-red-300"
                            )}>
                              {isNoInfo ? "⚠ No Info" : "✗ Error"}
                            </span>
                            <span className="text-sm text-slate-400">{row.errorMessage || "Unknown error"}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                      <td className="px-3 py-2 font-mono font-bold text-slate-200 whitespace-nowrap">{row.vehicleNumber || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.make || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.model || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.mfgYear || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.engineCC || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.transmission || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.variant || "—"}</td>
                      <td className="px-3 py-2 text-blue-300 font-medium whitespace-nowrap">{row.insurer || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{formatCoverType(row.coverType)}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><AllowBadge value={row.allowPurchase} /></td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.referRiskCode || "—"}</td>
                      <td className="px-3 py-2 text-slate-200 font-medium whitespace-nowrap">{row.totalPrice || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Matrix view ── */}
        {matrixRows.length > 0 && view === "matrix" && (
          <div className="space-y-6">
            {/* Eligibility grid */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                    {matrixCols.map((col, i) => {
                      const isFirstOfPair = col.plan === "first";
                      const isSecondOfPair = col.plan === "tpft";
                      return (
                        <th key={col.key} className={clsx(
                          "px-4 py-2.5 text-center whitespace-nowrap",
                          isFirstOfPair && "border-l-2 border-slate-700",
                          isSecondOfPair && "border-r-2 border-slate-700",
                        )}>
                          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                            {col.sub ? col.sub : col.label}
                          </div>
                          {col.sub && (
                            <div className="text-[10px] font-bold text-slate-400 mt-0.5">{col.label}</div>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {matrixVehicles.map(vn => (
                    <tr key={vn} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-200 whitespace-nowrap">{vn}</td>
                      {matrixCols.map(col => {
                        const cell = matrix.get(vn)?.get(col.insurer);
                        const isFirstOfPair = col.plan === "first";
                        const isSecondOfPair = col.plan === "tpft";
                        if (col.plan === "single") {
                          return (
                            <td key={col.key} className="px-4 py-2.5 text-center">
                              {cell ? <AllowBadge value={cell as string} /> : <span className="text-slate-700">—</span>}
                            </td>
                          );
                        }
                        const dual = (cell ?? { firstParty: "", tpft: "" }) as DualCover;
                        const val  = col.plan === "first" ? dual.firstParty : dual.tpft;
                        return (
                          <td key={col.key} className={clsx(
                            "px-4 py-2.5 text-center",
                            isFirstOfPair && "border-l-2 border-slate-700",
                            isSecondOfPair && "border-r-2 border-slate-700",
                          )}>
                            <AllowBadge value={val || "No"} />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Per-vehicle detail cards */}
            <div className="space-y-3">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Vehicle Details</p>
              {matrixVehicles.map(vn => {
                const vRows = afterSearch
                  .filter(r => r.vehicleNumber.toUpperCase() === vn)
                  .sort((a, b) => (a.insurer || "").localeCompare(b.insurer || ""));
                const first = vRows[0];
                if (!first) return null;
                const isExpanded = expandedCards.has(vn);
                const toggleCard = () => setExpandedCards(prev => {
                  const next = new Set(prev);
                  next.has(vn) ? next.delete(vn) : next.add(vn);
                  return next;
                });
                return (
                  <div key={vn} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                    {/* Card header — click to expand */}
                    <div
                      className="flex items-start justify-between flex-wrap gap-3 px-4 pt-4 pb-3 cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
                      onClick={toggleCard}
                    >
                      <div>
                        <p className="font-mono font-bold text-slate-100 text-sm">{vn}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[first.make, first.model, first.variant].filter(Boolean).join(" · ")}
                          {first.mfgYear && <span className="ml-2 text-slate-500">({first.mfgYear})</span>}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        {first.engineCC    && <span><span className="text-slate-400">CC</span> {first.engineCC}</span>}
                        {first.transmission && <span><span className="text-slate-400">Trans</span> {first.transmission}</span>}
                        {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                      </div>
                    </div>
                    {/* Table */}
                    <div className="px-4 pb-4">
                      <table className="text-xs border-collapse w-full table-fixed">
                        <colgroup>
                          <col className="w-[18%]" />
                          <col className="w-[28%]" />
                          <col className="w-[16%]" />
                          <col className="w-[20%]" />
                          <col className="w-[18%]" />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="pb-1.5 text-left text-xs text-slate-500 font-semibold pr-4">Insurer</th>
                            <th className="pb-1.5 text-left text-xs text-slate-500 font-semibold pr-4">Cover Type</th>
                            <th className="pb-1.5 text-left text-xs text-slate-500 font-semibold pr-4">Allow Purchase</th>
                            <th className="pb-1.5 text-left text-xs text-slate-500 font-semibold pr-4">Refer Risk Code</th>
                            <th className="pb-1.5 text-right text-xs text-slate-500 font-semibold">Total Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vRows.map((r, i) => (
                            <tr key={i} className="border-b border-slate-800/40">
                              <td className={clsx("py-1.5 pr-4 text-blue-300 font-medium", !isExpanded && "truncate")}>{r.insurer || "—"}</td>
                              <td className={clsx("py-1.5 pr-4 text-slate-400", !isExpanded && "truncate")}>{formatCoverType(r.coverType)}</td>
                              <td className="py-1.5 pr-4"><AllowBadge value={r.allowPurchase} /></td>
                              <td className={clsx("py-1.5 pr-4 text-slate-400", !isExpanded && "truncate")}>{r.referRiskCode || "—"}</td>
                              <td className="py-1.5 text-right text-slate-200 font-medium">{r.totalPrice || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECARANG TAB
// ══════════════════════════════════════════════════════════════════════════════

const SC_ENV_PRESETS = [
  { label: "Preprod", value: "https://staging.secarang.com/preprod" },
  { label: "IA",      value: "https://staging.secarang.com/ia"      },
  { label: "Zurich",  value: "https://staging.secarang.com/zurich"  },
] as const;

const SC_DEFAULT_ENV      = SC_ENV_PRESETS[0].value;
const SC_DEFAULT_PASSWORD = "eAuTo<2025#";
const SC_SECS_PER_VEHICLE = 60;

function scEstimateTime(count: number, concurrency: number): string {
  const secs = Math.ceil(count / concurrency) * SC_SECS_PER_VEHICLE;
  if (secs < 60) return `~${secs}s`;
  const m = Math.floor(secs / 60), s = secs % 60;
  return s > 0 ? `~${m}m ${s}s` : `~${m}m`;
}

function parseScVehicles(raw: string): ScVehicleEntry[] {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\s,]+/).filter(Boolean);
      const vehicleNumber = (parts[0] ?? "").toUpperCase();
      const icNumber = parts[1] ? normalizeIdNumber(parts[1]) : undefined;
      return { vehicleNumber, icNumber };
    })
    .filter(v => v.vehicleNumber);
}

async function exportSecarangExcel(rows: SecarangRow[]) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Secarang Quotations");
  ws.columns = [
    { header: "Vehicle Number",  key: "vn",        width: 18 },
    { header: "Make",            key: "make",       width: 15 },
    { header: "Model",           key: "model",      width: 30 },
    { header: "Year",            key: "year",       width: 8  },
    { header: "Variant",         key: "variant",    width: 25 },
    { header: "Insurer",         key: "insurer",    width: 25 },
    { header: "Available",       key: "available",  width: 12 },
    { header: "Reason",          key: "reason",     width: 40 },
    { header: "Total Displayed", key: "displayed",  width: 16 },
    { header: "Total Available", key: "avail2",     width: 16 },
  ];
  const h = ws.getRow(1);
  h.font      = { bold: true, color: { argb: "FFFFFFFF" } };
  h.fill      = { type: "pattern", pattern: "solid", fgColor: { argb: "FF2E75B6" } };
  h.alignment = { vertical: "middle", horizontal: "center" };

  for (const r of rows) {
    const row = ws.addRow({
      vn: r.vehicleNumber, make: r.make, model: r.model, year: r.year,
      variant: r.variant, insurer: r.insurer,
      available: r.available, reason: r.unavailableReason,
      displayed: r.totalDisplayed, avail2: r.totalAvailable,
    });
    const c = row.getCell("available");
    c.font = { color: { argb: r.available === "Yes" ? "FF008000" : "FFFF0000" }, bold: true };
  }
  if (ws.rowCount > 1) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: ws.rowCount, column: 10 } };

  const buf  = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a"); a.href = url; a.download = "secarang-results.xlsx"; a.click();
  URL.revokeObjectURL(url);
}

function ScAvailBadge({ value }: { value: string }) {
  const yes = value.toLowerCase() === "yes";
  return (
    <span className={clsx("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold",
      yes ? "bg-green-900/40 text-green-400" : "bg-red-900/30 text-red-400"
    )}>
      {yes ? "Yes" : "No"}
    </span>
  );
}

type ScAvailFilter = "all" | "yes" | "no";
type ScSortKey = "vehicleNumber" | "make" | "insurer" | "available" | "totalDisplayed" | "totalAvailable";
interface ScSortState { key: ScSortKey | null; dir: SortDir }

const SC_TABLE_COLS: { key: ScSortKey; label: string }[] = [
  { key: "vehicleNumber",  label: "Vehicle"    },
  { key: "make",           label: "Make/Model" },
  { key: "insurer",        label: "Insurer"    },
  { key: "available",      label: "Available"  },
  { key: "totalDisplayed", label: "Displayed"  },
  { key: "totalAvailable", label: "Avail."     },
];

function SecarangTab({ mode = "standard" }: { mode?: "standard" | "regression" }) {
  const [vehicleInput,  setVehicleInput]  = useState("");
  const [icNumber,      setIcNumber]      = useState("");
  const [postcode,      setPostcode]      = useState("55000");
  const [vehicleType,   setVehicleType]   = useState<"car" | "motorcycle">("car");
  const [ownerType,     setOwnerType]     = useState<"private" | "company">("private");
  const [baseUrl,       setBaseUrl]       = useState<string>(SC_DEFAULT_ENV);
  const [customEnv,     setCustomEnv]     = useState(false);
  const [sitePassword,  setSitePassword]  = useState(SC_DEFAULT_PASSWORD);
  const [showPassword,  setShowPassword]  = useState(false);
  const [showAdvanced,  setShowAdvanced]  = useState(false);
  const [concurrency,   setConcurrency]   = useState(8);
  const [view,          setView]          = useState<"table" | "matrix">("matrix");

  const [checkVehicleDetails, setCheckVehicleDetails] = useState(true);

  const {
    secarangJob,           startSecarangRun,           stopSecarangRun,           clearSecarangJob,           restoreSecarangJob,
    regressionSecarangJob, startRegressionSecarangRun, stopRegressionSecarangRun, clearRegressionSecarangJob, restoreRegressionSecarangJob,
  } = useApp();

  const isRegression  = mode === "regression";
  const activeJob     = isRegression ? regressionSecarangJob : secarangJob;
  const startRun      = isRegression ? startRegressionSecarangRun  : startSecarangRun;
  const stopRun       = isRegression ? stopRegressionSecarangRun   : stopSecarangRun;
  const clearJob      = isRegression ? clearRegressionSecarangJob  : clearSecarangJob;
  const restoreJob    = isRegression ? restoreRegressionSecarangJob : restoreSecarangJob;
  const loadSaved     = isRegression ? loadRegressionSecarangSaved  : loadSecarangSaved;
  const clearSaved    = isRegression ? clearRegressionSecarangSaved : clearSecarangSaved;

  // Filters & search
  const [search,        setSearch]        = useState("");
  const [availFilter,   setAvailFilter]   = useState<ScAvailFilter>("all");
  const [shownInsurers, setShownInsurers] = useState<Set<string>>(() => {
    const found = (activeJob?.rows ?? []).map(r => r.insurer).filter(Boolean);
    return new Set(found);
  });
  const [sort,          setSort]          = useState<ScSortState>({ key: null, dir: "asc" });
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const loading  = activeJob?.loading  ?? false;
  const stopping = activeJob?.stopping ?? false;
  const rows     = activeJob?.rows     ?? [];
  const error    = activeJob?.error    ?? "";
  const runLog   = activeJob?.log      ?? "";
  const savedAt  = activeJob?.savedAt  ?? null;
  const hasRun   = activeJob !== null;

  const idLabel  = ownerType === "company" ? "SSM" : "IC";
  const vehicles = parseScVehicles(vehicleInput);

  // Restore saved on mount (if no active job in context)
  useEffect(() => {
    if (activeJob) {
      setVehicleInput(activeJob.vehicleInput);
      return;
    }
    const saved = loadSaved();
    if (!saved || saved.rows.length === 0) return;
    setVehicleInput(saved.vehicleInput);
    restoreJob({ loading: false, rows: saved.rows, error: "", log: saved.runLog ?? "", savedAt: saved.savedAt, vehicleInput: saved.vehicleInput });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Build structured view
  const scVehicles = useMemo(() => buildVehicles(rows), [rows]);
  const allInsurerNames = useMemo(() => {
    const s = new Set<string>();
    scVehicles.forEach(v => v.insurers.forEach(i => s.add(i.name)));
    return Array.from(s).sort();
  }, [scVehicles]);

  // Keep insurer filter in sync when rows arrive
  useEffect(() => {
    if (!allInsurerNames.length) return;
    setShownInsurers(new Set(allInsurerNames));
  }, [allInsurerNames]);

  // Filtering
  const searchLower = search.trim().toLowerCase();
  const filteredRows = useMemo(() => rows.filter(r => {
    // Empty shownInsurers means "no selection yet" — show all rather than none
    if (r.insurer && shownInsurers.size > 0 && !shownInsurers.has(r.insurer)) return false;
    if (searchLower) {
      const hit = [r.vehicleNumber, r.make, r.model, r.insurer, r.variant]
        .some(f => (f ?? "").toLowerCase().includes(searchLower));
      if (!hit) return false;
    }
    if (availFilter !== "all") {
      const yes = r.available.toLowerCase() === "yes";
      if (availFilter === "yes" && !yes) return false;
      if (availFilter === "no"  &&  yes) return false;
    }
    return true;
  }), [rows, shownInsurers, searchLower, availFilter]);

  // Sort (table view)
  const sortedRows = useMemo(() => {
    if (!sort.key) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      let av: string, bv: string;
      if (sort.key === "make") {
        av = [a.make, a.model, a.year].filter(Boolean).join(" ");
        bv = [b.make, b.model, b.year].filter(Boolean).join(" ");
      } else {
        av = a[sort.key!] ?? "";
        bv = b[sort.key!] ?? "";
      }
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: "base" });
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [filteredRows, sort]);

  // Filtered vehicles for matrix view
  const filteredVehicles = useMemo(() => {
    const vns = new Set(filteredRows.map(r => r.vehicleNumber));
    return scVehicles.filter(v => vns.has(v.vehicleNumber));
  }, [scVehicles, filteredRows]);

  const filteredInsurerNames = useMemo(() => {
    const s = new Set<string>();
    filteredVehicles.forEach(v => v.insurers.filter(i => shownInsurers.has(i.name)).forEach(i => s.add(i.name)));
    return Array.from(s).sort();
  }, [filteredVehicles, shownInsurers]);

  const statsYes = filteredRows.filter(r => r.available.toLowerCase() === "yes").length;
  const statsNo  = filteredRows.filter(r => r.available.toLowerCase() !== "yes" && r.insurer).length;
  const hasActiveFilters = !!(search || availFilter !== "all" || shownInsurers.size < allInsurerNames.length);

  function toggleSort(key: ScSortKey) {
    setSort(prev => prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  }

  function toggleInsurer(ins: string) {
    setShownInsurers(prev => {
      const next = new Set(prev);
      if (next.has(ins)) { if (next.size > 1) next.delete(ins); }
      else next.add(ins);
      return next;
    });
  }

  function clearFilters() {
    setSearch("");
    setAvailFilter("all");
    setShownInsurers(new Set(allInsurerNames));
  }

  function handleRun() {
    if (!vehicles.length) return;
    const params: SecarangRunParams = {
      vehicles,
      icNumber:            icNumber.trim()     || undefined,
      postcode:            postcode.trim()     || undefined,
      vehicleType,
      ownerType,
      baseUrl:             baseUrl             || undefined,
      sitePassword:        sitePassword.trim() || undefined,
      concurrency,
      checkVehicleDetails,
      vehicleInput,
    };
    startRun(params);
  }

  function handleStop() {
    stopRun();
  }

  function handleClear() {
    clearSaved();
    clearJob();
    setVehicleInput("");
    setShownInsurers(new Set());
  }

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

      {/* ── Input panel ── */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:items-stretch">

          {/* Left column */}
          <div className="space-y-4">

            {/* Environment */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Environment</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SC_ENV_PRESETS.map(p => (
                  <button key={p.value} type="button"
                    onClick={() => { setBaseUrl(p.value); setCustomEnv(false); }}
                    className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      !customEnv && baseUrl === p.value
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}>{p.label}</button>
                ))}
                <button type="button" onClick={() => setCustomEnv(true)}
                  className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                    customEnv ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                               : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  )}>Custom</button>
              </div>
              {customEnv && (
                <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                  placeholder="https://staging.secarang.com/preprod"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono" />
              )}
              {!customEnv && <p className="text-xs text-slate-600 font-mono">{baseUrl}</p>}
            </div>

            {/* Site password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Site Password</label>
              <div className="relative">
                <input value={sitePassword} onChange={e => setSitePassword(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="eAuTo<2025#"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors" tabIndex={-1}>
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Vehicle + Owner type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Vehicle Type</label>
                <div className="flex gap-1.5 h-[38px]">
                  {(["car", "motorcycle"] as const).map(vt => (
                    <button key={vt} onClick={() => setVehicleType(vt)}
                      className={clsx("flex-1 rounded-lg text-xs font-medium border transition-all capitalize",
                        vehicleType === vt ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                                           : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300")}>
                      {vt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">Owner Type</label>
                <div className="flex gap-1.5 h-[38px]">
                  {(["private", "company"] as const).map(ot => (
                    <button key={ot} onClick={() => setOwnerType(ot)}
                      className={clsx("flex-1 rounded-lg text-xs font-medium border transition-all capitalize",
                        ownerType === ot ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                                         : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300")}>
                      {ot}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced toggle */}
            <button onClick={() => setShowAdvanced(v => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">
                    {idLabel} Number <span className="text-slate-700">default: 030217141005</span>
                  </label>
                  <input value={icNumber} onChange={e => setIcNumber(e.target.value)}
                    placeholder="030217141005"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Postcode <span className="text-slate-700">default: 55000</span></label>
                  <input value={postcode} onChange={e => setPostcode(e.target.value)}
                    placeholder="55000"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1.5">Workers (concurrency) <span className="text-slate-700">max 10</span></label>
                  <div className="flex items-center gap-1.5 h-[38px]">
                    <button type="button" onClick={() => setConcurrency(v => Math.max(1, v - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors text-base font-bold">−</button>
                    <span className="w-6 text-center text-sm font-semibold text-slate-200">{concurrency}</span>
                    <button type="button" onClick={() => setConcurrency(v => Math.min(10, v + 1))}
                      className="w-8 h-8 flex items-center justify-center bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-slate-200 transition-colors text-base font-bold">+</button>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-1.5">Checks <span className="text-slate-700">click to enable / disable</span></label>
                  <div className="flex flex-wrap gap-1.5">
                    {([
                      { key: "veh", label: "Vehicle Details", on: checkVehicleDetails, set: setCheckVehicleDetails },
                    ] as const).map(t => (
                      <button key={t.key} type="button" onClick={() => t.set(v => !v)}
                        className={clsx(
                          "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                          t.on ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                               : "bg-slate-800 border-slate-700 text-slate-500 grayscale"
                        )}>
                        {t.on ? "✓ " : "✕ "}{t.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>{/* end left */}

          {/* Right column — vehicle input */}
          <div className="flex flex-col">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Vehicle Numbers
              <span className="text-slate-600 font-normal ml-1">— one per line, optional {idLabel} after plate (paste 2 columns from Excel)</span>
            </label>
            <textarea value={vehicleInput} onChange={e => setVehicleInput(e.target.value)}
              placeholder={"ALA2133\t980121066038\nCDJ7398\t910920126347\nPNA3787  (uses default IC)"}
              className="w-full flex-1 min-h-[260px] bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none" />
            {vehicles.length > 0 && (
              <p className="text-xs text-slate-600 mt-1">
                {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}{" · "}
                <span className="text-slate-500 font-medium">est. {scEstimateTime(vehicles.length, concurrency)}</span>
                {vehicles.some(v => v.icNumber) && (
                  <span className="text-slate-500">{" · "}{vehicles.filter(v => v.icNumber).length} with custom {idLabel}</span>
                )}
              </p>
            )}
          </div>
        </div>{/* end grid */}

        {/* Run / Stop */}
        <div className="flex items-center gap-3 pt-1">
          <button onClick={handleRun} disabled={loading || vehicles.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {loading ? "Running…" : "Run Check"}
          </button>
          {loading && (
            <button onClick={handleStop} disabled={stopping}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors">
              {stopping ? <Loader2 size={15} className="animate-spin" /> : <Square size={14} />}
              {stopping ? "Stopping…" : "Stop"}
            </button>
          )}
          {loading && (
            <p className="text-xs text-slate-500 animate-pulse">
              {stopping
                ? "Stopping — partial results will be shown…"
                : `Checking ${vehicles.length} vehicle${vehicles.length !== 1 ? "s" : ""} — est. ${scEstimateTime(vehicles.length, concurrency)}…`}
            </p>
          )}
        </div>
      </div>{/* end input panel */}

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

      {/* Run log (collapsed) */}
      {runLog && rows.length > 0 && (
        <details className="bg-slate-900 border border-slate-800 rounded-xl">
          <summary className="px-4 py-2.5 text-xs text-slate-500 cursor-pointer select-none hover:text-slate-300">
            Show run log
          </summary>
          <pre className="px-4 pb-3 text-xs text-slate-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-48 overflow-y-auto">{runLog}</pre>
        </details>
      )}

      {/* No results */}
      {hasRun && !loading && !error && rows.length === 0 && (
        <div className="text-center py-12 text-slate-600">
          <Shield size={28} className="mx-auto mb-2 opacity-40" />
          <p className="text-sm">No results returned.</p>
          <p className="text-xs mt-1">Check that the script ran correctly and output-results.xlsx was created.</p>
        </div>
      )}

      {/* ── Results toolbar ── */}
      {rows.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button onClick={() => setView("matrix")}
              className={clsx("px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5",
                view === "matrix" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
              <TableProperties size={12} /> Matrix
            </button>
            <button onClick={() => setView("table")}
              className={clsx("px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1.5",
                view === "table" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}>
              <LayoutGrid size={12} /> Table
            </button>
          </div>
          <button onClick={() => exportSecarangExcel(sortedRows.length ? sortedRows : rows)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors">
            <Download size={12} /> Export Excel
          </button>
          <button onClick={handleClear} title="Clear saved results"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg transition-colors border border-slate-800">
            <Trash2 size={12} /> Clear
          </button>
          {savedAt && (
            <span className="text-xs text-slate-600 ml-auto">
              Saved {new Date(savedAt).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* ── Filter card ── */}
      {rows.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search vehicle number, make, model, insurer..."
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pl-9 pr-9 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 items-center">
            {allInsurerNames.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold shrink-0">Insurer</span>
                <button
                  onClick={() => setShownInsurers(new Set(allInsurerNames))}
                  className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                    shownInsurers.size === allInsurerNames.length
                      ? "bg-slate-700 border-slate-600 text-slate-200"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  )}>All</button>
                {allInsurerNames.map(ins => (
                  <button key={ins} onClick={() => toggleInsurer(ins)}
                    className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border transition-all",
                      shownInsurers.has(ins)
                        ? "bg-blue-600/20 border-blue-500/50 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}>{ins}</button>
                ))}
              </div>
            )}

            {allInsurerNames.length > 0 && <span className="text-slate-700 hidden sm:block">|</span>}

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-slate-500 uppercase tracking-wide font-semibold shrink-0">Available</span>
              {(["all", "yes", "no"] as ScAvailFilter[]).map(f => (
                <button key={f} onClick={() => setAvailFilter(f)}
                  className={clsx("px-2.5 py-1 rounded-full text-xs font-medium border transition-all capitalize",
                    availFilter === f
                      ? f === "yes" ? "bg-green-900/60 border-green-700 text-green-300"
                        : f === "no" ? "bg-red-900/60 border-red-700 text-red-300"
                        : "bg-slate-700 border-slate-600 text-slate-200"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                  )}>{f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
          </div>

          {/* Active filter summary */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between text-xs pt-0.5 border-t border-slate-800">
              <span className="text-slate-500">
                Showing <span className="text-slate-200 font-medium">{filteredRows.length}</span> of <span className="text-slate-200 font-medium">{rows.length}</span> rows
              </span>
              <button onClick={clearFilters} className="text-blue-400 hover:text-blue-300 font-medium">Clear filters</button>
            </div>
          )}
        </div>
      )}

      {/* ── Summary stats ── */}
      {filteredRows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500">
            {filteredVehicles.length} vehicle{filteredVehicles.length !== 1 ? "s" : ""}
            {" · "}{filteredRows.filter(r => r.insurer).length} row{filteredRows.filter(r => r.insurer).length !== 1 ? "s" : ""}
          </span>
          <span className="text-slate-700">·</span>
          <span className="px-2 py-0.5 rounded-full bg-green-900/60 text-green-300 border border-green-800 font-semibold">Yes {statsYes}</span>
          <span className="px-2 py-0.5 rounded-full bg-red-900/60 text-red-300 border border-red-800 font-semibold">No {statsNo}</span>
        </div>
      )}

      {/* Empty filter state */}
      {filteredRows.length === 0 && rows.length > 0 && (
        <div className="text-center py-10 text-slate-600 text-sm">
          No rows match your filters — try adjusting the search or filters above.
        </div>
      )}

      {/* ── Matrix view ── */}
      {filteredRows.length > 0 && view === "matrix" && (
        <div className="space-y-6">
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="text-xs border-collapse w-full">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Vehicle</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Displayed</th>
                  <th className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Available</th>
                  {filteredInsurerNames.map(name => (
                    <th key={name} className="px-3 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredVehicles.map(v => (
                  <tr key={v.vehicleNumber} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-200 whitespace-nowrap">
                      {v.vehicleNumber}
                      {(v.make || v.model) && (
                        <div className="text-[10px] font-normal text-slate-500">{[v.make, v.model, v.year].filter(Boolean).join(" ")}</div>
                      )}
                    </td>
                    {v.status === "ERROR" ? (
                      <td colSpan={2 + filteredInsurerNames.length} className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold bg-red-900/40 text-red-400">
                          <AlertCircle size={11} /> {v.errorMessage || "Error"}
                        </span>
                      </td>
                    ) : (
                      <>
                        <td className="px-3 py-2.5 text-center text-slate-300 font-semibold">{v.totalDisplayed}</td>
                        <td className="px-3 py-2.5 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-green-900/40 text-green-400">
                            {v.totalAvailable}
                          </span>
                        </td>
                        {filteredInsurerNames.map(name => {
                          const ins = v.insurers.find(i => i.name === name);
                          if (!ins) return <td key={name} className="px-3 py-2.5 text-center text-slate-700">—</td>;
                          return (
                            <td key={name} className="px-3 py-2.5 text-center">
                              {ins.available
                                ? <span className="text-green-400 text-xs font-semibold">✓</span>
                                : <span className="text-red-400 text-xs font-semibold" title={ins.unavailableReason}>N/A</span>}
                            </td>
                          );
                        })}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Per-vehicle detail cards */}
          <div className="space-y-3">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Vehicle Details</p>
            {filteredVehicles.map(v => {
              const isExpanded = expandedCards.has(v.vehicleNumber);
              const toggleCard = () => setExpandedCards(prev => {
                const next = new Set(prev);
                next.has(v.vehicleNumber) ? next.delete(v.vehicleNumber) : next.add(v.vehicleNumber);
                return next;
              });
              const visibleInsurers = v.insurers.filter(i => shownInsurers.has(i.name));
              return (
                <div key={v.vehicleNumber} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                  <div
                    className="flex items-start justify-between flex-wrap gap-3 px-4 pt-4 pb-3 cursor-pointer hover:bg-slate-800/40 transition-colors select-none"
                    onClick={toggleCard}
                  >
                    <div>
                      <p className="font-mono font-bold text-slate-100 text-sm">{v.vehicleNumber}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {[v.make, v.model, v.variant].filter(Boolean).join(" · ")}
                        {v.year && <span className="ml-2 text-slate-500">({v.year})</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      {v.status === "ERROR"
                        ? <span className="flex items-center gap-1 text-red-400 font-semibold"><AlertCircle size={12} /> Error</span>
                        : <>
                            <span><span className="text-slate-400">Displayed</span> {v.totalDisplayed}</span>
                            <span><span className="text-green-400 font-semibold">Available</span> {v.totalAvailable}</span>
                          </>
                      }
                      {isExpanded ? <ChevronUp size={14} className="text-slate-500" /> : <ChevronDown size={14} className="text-slate-500" />}
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4">
                      {v.status === "ERROR" ? (
                        <p className="text-xs text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg px-3 py-2">
                          {v.errorMessage || "An error occurred processing this vehicle."}
                        </p>
                      ) : (
                      <table className="text-xs border-collapse w-full table-fixed">
                        <colgroup>
                          <col className="w-[30%]" />
                          <col className="w-[15%]" />
                          <col className="w-[55%]" />
                        </colgroup>
                        <thead>
                          <tr className="border-b border-slate-800">
                            <th className="pb-1.5 text-left text-xs text-slate-500 font-semibold pr-4">Insurer</th>
                            <th className="pb-1.5 text-left text-xs text-slate-500 font-semibold pr-4">Available</th>
                            <th className="pb-1.5 text-left text-xs text-slate-500 font-semibold">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleInsurers.map((ins, i) => (
                            <tr key={i} className="border-b border-slate-800/40">
                              <td className="py-1.5 pr-4 text-blue-300 font-medium">{ins.name}</td>
                              <td className="py-1.5 pr-4"><ScAvailBadge value={ins.available ? "Yes" : "No"} /></td>
                              <td className="py-1.5 text-slate-500 text-[11px]">{ins.unavailableReason || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Table view ── */}
      {filteredRows.length > 0 && view === "table" && (
        <div className="overflow-x-auto rounded-2xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900">
                {SC_TABLE_COLS.map(col => {
                  const active = sort.key === col.key;
                  return (
                    <th key={col.key}
                      onClick={() => toggleSort(col.key)}
                      className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap cursor-pointer select-none hover:text-slate-300 transition-colors">
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {active
                          ? <span className="text-blue-400">{sort.dir === "asc" ? "▲" : "▼"}</span>
                          : <span className="text-slate-700 opacity-0 group-hover:opacity-100">▲</span>
                        }
                      </span>
                    </th>
                  );
                })}
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">Reason</th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((r, i) => (
                <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                  <td className="px-3 py-2 font-mono font-bold text-slate-200 whitespace-nowrap">{r.vehicleNumber}</td>
                  <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{[r.make, r.model, r.year].filter(Boolean).join(" ") || "—"}</td>
                  {r.status === "ERROR" ? (
                    <td colSpan={5} className="px-3 py-2">
                      <span className="inline-flex items-center gap-1.5 text-xs text-red-400">
                        <AlertCircle size={11} /> {r.errorMessage || "Error"}
                      </span>
                    </td>
                  ) : (
                    <>
                      <td className="px-3 py-2 text-blue-300 font-medium whitespace-nowrap">{r.insurer || "—"}</td>
                      <td className="px-3 py-2 whitespace-nowrap"><ScAvailBadge value={r.available} /></td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.totalDisplayed || "—"}</td>
                      <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{r.totalAvailable || "—"}</td>
                      <td className="px-3 py-2 text-slate-500 text-[11px]">{r.unavailableReason || "—"}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Regression Tab ────────────────────────────────────────────────────────────
const SC_REGRESSION_ENV_PRESETS = SC_ENV_PRESETS;

const INSURER_ADDONS: Record<string, string[]> = {
  "Zurich": [
    "CART (Compensation for Assessed Repair Time)",
    "Special Perils",
    "Legal Liability of Passengers for Negligent Acts",
    "All Drivers",
    "Legal Liability to Passengers",
  ],
  "Tokio Marine": [
    "Breakage of glass in windscreen",
    "Inclusion of special perils",
    "Legal liability to passengers",
    "Legal liability of passengers for negligent acts",
    "Unlimited Towing",
    "Current year non claim discount relief",
  ],
  "Lonpac": [
    "Breakage of glass in windscreen",
    "Inclusion of special perils",
    "Legal liability to passengers",
    "Legal liability of passengers for negligent acts",
    "Unlimited Towing",
    "Current year non claim discount relief",
  ],
};

const INSURER_DEFAULT_ADDONS: Record<string, string[]> = {
  "Zurich": ["All Drivers"],
};

const POSTCODE_PRESETS = [
  { label: "KL",       value: "50000", hint: "Kuala Lumpur" },
  { label: "Kelantan", value: "15000", hint: "Kota Bharu" },
  { label: "Labuan",   value: "87000", hint: "Labuan Town" },
  { label: "Sabah",    value: "88000", hint: "Kota Kinabalu" },
] as const;
const PRESET_POSTCODES: Set<string> = new Set(POSTCODE_PRESETS.map(p => p.value));

// ── Verification Report UI ────────────────────────────────────────────────────
function VerifTable({ title, rows }: { title: string; rows: VerificationRow[] }) {
  return (
    <div>
      <div className="px-5 py-2.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
        {title}
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-950/40">
            <th className="text-left px-5 py-2 text-slate-500 font-medium w-[22%]">Field</th>
            <th className="text-left px-4 py-2 text-slate-500 font-medium w-[35%]">Confirmation Page</th>
            <th className="text-left px-4 py-2 text-slate-500 font-medium w-[35%]">Success Page</th>
            <th className="text-center px-3 py-2 text-slate-500 font-medium w-[8%]">Match</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {rows.map((row, i) => (
            <tr key={i} className={clsx(
              "transition-colors",
              !row.match && "bg-red-950/20",
              row.match  && "hover:bg-slate-800/30",
            )}>
              <td className="px-5 py-2.5 text-slate-400 font-medium">{row.label}</td>
              <td className={clsx("px-4 py-2.5 font-mono", row.confirmed ? "text-slate-300" : "text-slate-600")}>
                {row.confirmed || "—"}
              </td>
              <td className={clsx("px-4 py-2.5 font-mono", row.success ? "text-slate-300" : "text-slate-600")}>
                {row.success || "—"}
              </td>
              <td className="px-3 py-2.5 text-center">
                {row.match
                  ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-900/60 border border-green-700/50 text-green-400 text-[10px] font-bold">✓</span>
                  : <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-900/60 border border-red-700/50 text-red-400 text-[10px] font-bold">✗</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PdfTable({ rows }: { rows: PdfVerificationRow[] }) {
  return (
    <div>
      <div className="px-5 py-2.5 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-900/60">
        PDF Receipt Verification
      </div>
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-950/40">
            <th className="text-left px-5 py-2 text-slate-500 font-medium w-[28%]">Field</th>
            <th className="text-left px-4 py-2 text-slate-500 font-medium w-[64%]">Expected Value</th>
            <th className="text-center px-3 py-2 text-slate-500 font-medium w-[8%]">Found</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {rows.map((row, i) => (
            <tr key={i} className={clsx(
              "transition-colors",
              !row.found && "bg-red-950/20",
              row.found  && "hover:bg-slate-800/30",
            )}>
              <td className="px-5 py-2.5 text-slate-400 font-medium">{row.label}</td>
              <td className={clsx("px-4 py-2.5 font-mono", row.expected ? "text-slate-300" : "text-slate-600")}>
                {row.expected || "—"}
              </td>
              <td className="px-3 py-2.5 text-center">
                {row.found
                  ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-900/60 border border-green-700/50 text-green-400 text-[10px] font-bold">✓</span>
                  : <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-900/60 border border-red-700/50 text-red-400 text-[10px] font-bold">✗</span>
                }
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VerificationReportUI({ data }: { data: VerificationData }) {
  const allRows = [...data.vehicleRows, ...data.ownerRows, ...data.pricingRows];
  const passed  = allRows.filter(r => r.match).length;
  const failed  = allRows.filter(r => !r.match).length;

  const pdfPassed = (data.pdfRows ?? []).filter(r => r.found).length;
  const pdfFailed = (data.pdfRows ?? []).filter(r => !r.found).length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

      {/* Header */}
      <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between gap-4">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Verification Report</span>
        <span className={clsx(
          "text-[11px] font-semibold px-3 py-1 rounded-full border",
          failed === 0
            ? "bg-green-900/40 border-green-700/50 text-green-300"
            : "bg-red-900/40 border-red-700/50 text-red-300"
        )}>
          {failed === 0 ? `✓ All ${allRows.length} checks passed` : `✗ ${failed} mismatch(es) · ${passed}/${allRows.length} passed`}
        </span>
      </div>

      {/* Metadata row */}
      <div className="px-5 py-3.5 border-b border-slate-800 grid grid-cols-3 gap-4 bg-slate-950/40">
        {[
          { label: "Receipt No",     value: data.receiptNo },
          { label: "Purchase Date",  value: data.purchaseDate },
          { label: "Payment Method", value: data.paymentMethod },
        ].map(item => (
          <div key={item.label}>
            <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">{item.label}</div>
            <div className="text-sm text-slate-200 font-mono">{item.value || "—"}</div>
          </div>
        ))}
      </div>

      {/* Comparison tables */}
      <div className="divide-y divide-slate-800">
        <VerifTable title="Vehicle Details" rows={data.vehicleRows} />
        <VerifTable title="Owner Details"   rows={data.ownerRows}   />
        <VerifTable title="Pricing"         rows={data.pricingRows} />

        {data.pdfRows && data.pdfRows.length > 0 && (
          <>
            <PdfTable rows={data.pdfRows} />
            <div className="px-5 py-2.5 bg-slate-950/30 text-xs">
              <span className={clsx(
                "font-semibold",
                pdfFailed === 0 ? "text-green-400" : "text-red-400",
              )}>
                PDF: {pdfFailed === 0 ? `✓ All ${data.pdfRows.length} fields found` : `✗ ${pdfFailed} field(s) missing`}
              </span>
              <span className="text-slate-600 ml-2">({pdfPassed}/{data.pdfRows.length})</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StepBadge({ status }: { status: RegressionStepResult["status"] }) {
  if (status === "PASS") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/50 border border-green-700/60 text-green-300">
      <span className="text-[10px]">✓</span> PASS
    </span>
  );
  if (status === "FAIL") return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-900/50 border border-red-700/60 text-red-300">
      <span className="text-[10px]">✗</span> FAIL
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 border border-slate-700 text-slate-400">
      <span className="text-[10px]">–</span> SKIP
    </span>
  );
}

// ── Regression wizard constants ───────────────────────────────
const REGRESSION_BANKS = [
  { value: "fpx_mb2u",       label: "Maybank2u"   },
  { value: "fpx_cimbclicks", label: "CIMB"        },
  { value: "fpx_amb",        label: "Ambank"      },
  { value: "fpx_pbb",        label: "Public Bank" },
  { value: "fpx_rhb",        label: "RHB"         },
  { value: "fpx_hlb",        label: "HLB"         },
  { value: "fpx_hsbc",       label: "HSBC"        },
  { value: "fpx_abb",        label: "Affin Bank"  },
  { value: "fpx_bkrm",       label: "Bank Rakyat" },
  { value: "fpx_bsn",        label: "BSN"         },
];

const FPX_STATUS_CODES = [
  { value: "00", label: "Approved" },
  { value: "03", label: "Invalid Merchant" },
  { value: "05", label: "Seller Account Closed" },
  { value: "12", label: "Invalid Transaction" },
  { value: "13", label: "Invalid Amount" },
  { value: "14", label: "Invalid Buyer Amount" },
  { value: "20", label: "Invalid Response" },
  { value: "22", label: "Pending Response From Bank" },
  { value: "30", label: "Transaction Not Supported" },
  { value: "31", label: "Invalid Bank" },
  { value: "39", label: "No Credit Account" },
  { value: "45", label: "Duplicate Seller Order Number" },
  { value: "46", label: "Invalid Seller Exchange or Seller" },
  { value: "47", label: "Invalid Currency" },
  { value: "48", label: "Transaction Limit Exceeded" },
  { value: "51", label: "Insufficient Funds" },
  { value: "53", label: "No Savings Account" },
  { value: "57", label: "Transaction Not Permitted" },
  { value: "61", label: "Withdrawal Limit Exceeded" },
  { value: "65", label: "Withdrawal Frequency Exceeded" },
  { value: "70", label: "Invalid Serial Number" },
  { value: "72", label: "Duplicate Exchange Order Number" },
  { value: "76", label: "Transaction Not Found" },
  { value: "77", label: "Invalid Buyer Name Or Buyer ID" },
  { value: "78", label: "Decryption Failed" },
  { value: "79", label: "Host Decline When Down" },
  { value: "80", label: "Buyer Cancel Transaction" },
  { value: "83", label: "Invalid Transaction Model" },
  { value: "84", label: "Invalid Transaction Type" },
  { value: "85", label: "Internal Error At Bank System" },
  { value: "87", label: "Debit Failed Exception Handling" },
  { value: "88", label: "Credit Failed Exception Handling" },
  { value: "89", label: "Transaction Not Received" },
  { value: "93", label: "Transaction Cannot Be Completed" },
  { value: "96", label: "System Malfunction" },
  { value: "98", label: "MAC Error" },
  { value: "99", label: "Pending for Authorization (B2B)" },
  { value: "FE", label: "Internal Error" },
  { value: "BC", label: "Transaction Cancelled By Customer" },
  { value: "OE", label: "Not In FPX Operating Hours" },
  { value: "OF", label: "Transaction Timeout" },
  { value: "OA", label: "Session Timeout at FPX Entry" },
  { value: "SB", label: "Invalid Seller Bank Code" },
  { value: "XA", label: "Invalid Source IP Address" },
  { value: "XE", label: "Invalid Message" },
  { value: "XM", label: "Invalid FPX Transaction Model" },
  { value: "XN", label: "Duplicate Seller Exchange Order Number" },
  { value: "XO", label: "Duplicate Exchange Order Number" },
  { value: "XS", label: "Seller Not In Exchange" },
  { value: "XC", label: "Seller Exchange Encryption Error" },
  { value: "XI", label: "Invalid Seller Exchange" },
  { value: "XB", label: "Invalid Seller Exchange IP" },
  { value: "XF", label: "Invalid Number Of Orders" },
  { value: "XT", label: "Invalid Transaction Type (X)" },
  { value: "XW", label: "Date Difference Exceeded" },
  { value: "1A", label: "Buyer Session Timeout at IB Login" },
  { value: "1B", label: "Buyer Failed Login" },
  { value: "1C", label: "Buyer Cancelled at Login" },
  { value: "1D", label: "Buyer Session Timeout at Account Selection" },
  { value: "1E", label: "Buyer Failed at Account Selection" },
  { value: "1F", label: "Buyer Cancelled at Account Selection" },
  { value: "1G", label: "Buyer Session Timeout at TAC" },
  { value: "1H", label: "Buyer Failed at TAC" },
  { value: "1I", label: "Buyer Cancelled at TAC" },
  { value: "1J", label: "Buyer Session Timeout at Confirmation" },
  { value: "1K", label: "Buyer Failed at Confirmation" },
  { value: "1L", label: "Buyer Cancelled at Confirmation" },
  { value: "2A", label: "Amount Below Minimum Limit" },
  { value: "ZZ", label: "Status Not Found" },
];


interface RegressionWizardConfig {
  baseUrl:            string;
  customEnv:          boolean;
  sitePassword:       string;
  vehicleNumber:      string;
  icNumber:           string;
  postcode:           string;
  targetInsurer:      string;
  coverageType:       "comprehensive" | "tpft";
  sumInsuredMode:     "default" | "min" | "medium" | "max";
  vehicleType:        "car" | "motorcycle";
  ownerType:          "private" | "company";
  selectedAddons:     string[];
  ownerName:          string;
  ownerEmail:         string;
  ownerPhone:         string;
  addressLine1:       string;
  addressLine2:       string;
  addressLine3:       string;
  discountCode:       string;
  paymentMethod:      "fpx" | "card";
  targetBank:         string;
  bankUsername:       string;
  bankPassword:       string;
  paymentStatus:      string;
  cardNumber:         string;
  cardExpiry:         string;
  cardCvv:            string;
  cardName:           string;
}

const REGRESSION_CONFIG_KEY = "regression_wizard_config";

function loadWizardConfig(): RegressionWizardConfig {
  const defaults: RegressionWizardConfig = {
    baseUrl:            SC_DEFAULT_ENV,
    customEnv:          false,
    sitePassword:       SC_DEFAULT_PASSWORD,
    vehicleNumber:      "WYN3837",
    icNumber:           "730620065847",
    postcode:           "55000",
    targetInsurer:      "Zurich",
    coverageType:       "comprehensive" as const,
    sumInsuredMode:     "default" as const,
    vehicleType:        "car" as const,
    ownerType:          "private" as const,
    selectedAddons:     ["All Drivers"],
    ownerName:          "MUHAMMAD FAIZUDDIN BIN BIDI",
    ownerEmail:         "faizuddin@modefair.com",
    ownerPhone:         "189812839",
    addressLine1:       "2505, Arctic Monkeys Road",
    addressLine2:       "Taman Monyet Kutub",
    addressLine3:       "Shah Alam, Selangor",
    discountCode:       "",
    paymentMethod:      "fpx" as const,
    targetBank:         "fpx_mb2u",
    bankUsername:       "",
    bankPassword:       "",
    paymentStatus:      "00",
    cardNumber:         "",
    cardExpiry:         "",
    cardCvv:            "",
    cardName:           "",
  };
  try {
    const raw = localStorage.getItem(REGRESSION_CONFIG_KEY);
    // Merge saved config over defaults so any newly added fields
    // (like selectedAddons) are always present even in old saved configs.
    if (raw) return { ...defaults, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaults;
}

function saveWizardConfig(cfg: RegressionWizardConfig) {
  try { localStorage.setItem(REGRESSION_CONFIG_KEY, JSON.stringify(cfg)); } catch { /* ignore */ }
}

// ── Horizontal section divider used in the right panel ───────
function RightSectionHeader({ num, label }: { num: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-[10px] font-bold text-slate-300 shrink-0">
        {num}
      </div>
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

// ── Reusable labelled field ───────────────────────────────────
function WField({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-400 mb-1.5">
        {label}
        {hint && <span className="text-slate-600 font-normal ml-1">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

const INPUT_CLS = "w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50";

function RegressionTab() {
  const [cfg, setCfg] = useState<RegressionWizardConfig>(loadWizardConfig);

  const [showPassword,     setShowPassword]     = useState(false);
  const [showCardCvv,         setShowCardCvv]         = useState(false);
  const [bankCredsDraft,      setBankCredsDraft]      = useState<{ username: string; password: string } | null>(null);
  const [confirmBankUpdate,   setConfirmBankUpdate]   = useState(false);
  const [showLog,             setShowLog]             = useState(false);

  const [loading,  setLoading]  = useState(false);
  const [stopping, setStopping] = useState(false);
  const [result,   setResult]   = useState<RegressionResult | null>(null);
  const [error,    setError]    = useState("");
  const [log,      setLog]      = useState("");
  const [liveLog,  setLiveLog]  = useState("");
  const liveLogRef = useRef<HTMLPreElement>(null);

  const RUNNING_KEY = "regression_e2e_running";


  // On mount: restore a completed result OR resume a run that was in progress
  // when the user navigated away.
  useEffect(() => {
    const saved = loadRegressionTestResult();
    if (saved) {
      setResult(saved);
      setLog(saved.log ?? "");
      // Fetch the full result from the API to restore screenshots (stripped from localStorage)
      fetch("/api/secarang/regression")
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (data && data.completedAt && (data.screenshots ?? []).length > 0) {
            setResult(prev => prev ? { ...prev, screenshots: data.screenshots } : prev);
          }
        })
        .catch(() => {});
      return;
    }
    if (localStorage.getItem(RUNNING_KEY) === "1") {
      setLoading(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll the live log every 500 ms while running.
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      fetch("/api/secarang/regression/log")
        .then(r => r.text())
        .then(text => {
          setLiveLog(text);
          if (liveLogRef.current) liveLogRef.current.scrollTop = liveLogRef.current.scrollHeight;
        })
        .catch(() => {});
    }, 500);
    return () => clearInterval(id);
  }, [loading]);

  // Poll the result endpoint every 3 s while running.
  // This recovers the result even if the user navigated away and came back.
  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => {
      fetch("/api/secarang/regression")
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (!data || !data.completedAt) return;
          localStorage.removeItem(RUNNING_KEY);
          setLoading(false);
          setStopping(false);
          if (data.error && !data.steps) { setError(data.error); return; }
          const res = data as RegressionResult;
          setResult(res);
          setLog(data.log ?? "");
          saveRegressionTestResult({ ...res, log: data.log ?? "" });
        })
        .catch(() => {});
    }, 3_000);
    return () => clearInterval(id);
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  function patch(updates: Partial<RegressionWizardConfig>) {
    setCfg(prev => {
      const next = { ...prev, ...updates };
      saveWizardConfig(next);
      return next;
    });
  }

  function handleRun() {
    localStorage.setItem(RUNNING_KEY, "1");
    setLoading(true);
    setStopping(false);
    setResult(null);
    setError("");
    setLog("");
    setLiveLog("");
    fetch("/api/secarang/regression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl:       cfg.baseUrl       || undefined,
        sitePassword:  cfg.sitePassword  || undefined,
        vehicleNumber: cfg.vehicleNumber || undefined,
        icNumber:      normalizeIdNumber(cfg.icNumber) || undefined,
        postcode:      cfg.postcode      || undefined,
        targetInsurer: cfg.targetInsurer || undefined,
        coverageType:    cfg.coverageType    || undefined,
        sumInsuredMode:  cfg.sumInsuredMode  !== "default" ? cfg.sumInsuredMode : undefined,
        vehicleType:     cfg.vehicleType     || undefined,
        ownerType:     cfg.ownerType     || undefined,
        addons: cfg.selectedAddons.length > 0 ? cfg.selectedAddons : undefined,
        ownerName:     cfg.ownerName     || undefined,
        ownerEmail:    cfg.ownerEmail    || undefined,
        ownerPhone:    cfg.ownerPhone    || undefined,
        addressLine1:  cfg.addressLine1  || undefined,
        addressLine2:  cfg.addressLine2  || undefined,
        addressLine3:  cfg.addressLine3  || undefined,
        discountCode:  cfg.discountCode  || undefined,
        ...(cfg.paymentMethod === "fpx" && {
          targetBank:    cfg.targetBank    || undefined,
          bankUsername:  cfg.bankUsername  || undefined,
          bankPassword:  cfg.bankPassword  || undefined,
          paymentStatus: cfg.paymentStatus || undefined,
        }),
      }),
    })
      .then(r => r.json())
      .then(data => {
        localStorage.removeItem(RUNNING_KEY);
        setLoading(false);
        setStopping(false);
        if (data.error && !data.steps) { setError(data.error); return; }
        const res = data as RegressionResult;
        setResult(res);
        setLog(data.log ?? "");
        saveRegressionTestResult({ ...res, log: data.log ?? "" });
      })
      .catch(e => {
        localStorage.removeItem(RUNNING_KEY);
        setLoading(false);
        setStopping(false);
        setError(e instanceof Error ? e.message : "Something went wrong");
      });
  }

  function handleStop() {
    localStorage.removeItem(RUNNING_KEY);
    setStopping(true);
    fetch("/api/secarang/regression", { method: "DELETE" }).catch(() => {});
  }

  function handleClear() {
    localStorage.removeItem(RUNNING_KEY);
    setResult(null);
    setError("");
    setLog("");
    clearRegressionTestResult();
  }

  const passed   = (result?.steps ?? []).filter(s => s.status === "PASS").length;
  const failed   = (result?.steps ?? []).filter(s => s.status === "FAIL").length;
  const duration = result ? (result.durationMs / 1000).toFixed(1) : null;

  function handleDownloadPDF() {
    if (!result) return;

    const statusColor  = result.overallStatus === "PASS" ? "#22c55e" : "#ef4444";
    const statusSymbol = result.overallStatus === "PASS" ? "✓ PASS" : "✗ FAIL";

    const stepRows = (result.steps ?? []).map((s, i) => {
      const icon  = s.status === "PASS" ? "✓" : s.status === "FAIL" ? "✗" : "⏭";
      const color = s.status === "PASS" ? "#22c55e" : s.status === "FAIL" ? "#ef4444" : "#94a3b8";
      const bg    = s.status === "FAIL" ? "#450a0a" : "transparent";
      return `<tr style="background:${bg}">
        <td style="padding:6px 10px;color:#64748b;width:28px;text-align:right">${i + 1}.</td>
        <td style="padding:6px 8px;width:52px"><span style="color:${color};font-weight:700;font-size:11px">${icon} ${s.status}</span></td>
        <td style="padding:6px 8px;font-weight:600">${s.name}</td>
        <td style="padding:6px 8px;color:#94a3b8;font-size:11px">${s.message || ""}</td>
        <td style="padding:6px 8px;color:#475569;font-size:10px;white-space:nowrap">${new Date(s.timestamp).toLocaleTimeString()}</td>
      </tr>`;
    }).join("");

    let verifSection = "";
    if (result.verificationData) {
      const vd = result.verificationData;
      const buildVerifTable = (title: string, rows: VerificationRow[]) => {
        if (!rows.length) return "";
        const trs = rows.map(r => `<tr>
          <td style="padding:5px 8px;color:#94a3b8;font-size:11px">${r.label}</td>
          <td style="padding:5px 8px;font-size:11px;font-family:monospace">${r.confirmed || "—"}</td>
          <td style="padding:5px 8px;font-size:11px;font-family:monospace">${r.success || "—"}</td>
          <td style="padding:5px 8px;text-align:center">${r.match ? '<span style="color:#22c55e;font-weight:700">✓</span>' : '<span style="color:#ef4444;font-weight:700">✗</span>'}</td>
        </tr>`).join("");
        return `<div style="margin-top:14px">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">${title}</div>
          <table style="width:100%;border-collapse:collapse;font-size:12px;color:#e2e8f0">
            <thead><tr style="border-bottom:1px solid #334155">
              <th style="padding:4px 8px;text-align:left;color:#64748b;font-size:10px">Field</th>
              <th style="padding:4px 8px;text-align:left;color:#64748b;font-size:10px">Confirmation Page</th>
              <th style="padding:4px 8px;text-align:left;color:#64748b;font-size:10px">Success Page</th>
              <th style="padding:4px 8px;text-align:center;color:#64748b;font-size:10px">Match</th>
            </tr></thead>
            <tbody>${trs}</tbody>
          </table>
        </div>`;
      };
      const allRows = [...vd.vehicleRows, ...vd.ownerRows, ...vd.pricingRows];
      const vPassed = allRows.filter(r => r.match).length;
      const vFailed = allRows.filter(r => !r.match).length;
      verifSection = `
        <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px;margin-top:16px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <span style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Verification Report</span>
            <span style="font-size:11px;font-weight:700;color:${vFailed === 0 ? "#22c55e" : "#ef4444"}">${vFailed === 0 ? `✓ All ${allRows.length} checks passed` : `✗ ${vFailed} mismatch(es) · ${vPassed}/${allRows.length} passed`}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;padding:10px 0;border-top:1px solid #1e293b;border-bottom:1px solid #1e293b;margin-bottom:8px">
            ${[["Receipt No", vd.receiptNo], ["Purchase Date", vd.purchaseDate], ["Payment Method", vd.paymentMethod]].map(([l, v]) => `
              <div><div style="font-size:10px;color:#475569;text-transform:uppercase;letter-spacing:.05em">${l}</div><div style="font-size:13px;font-family:monospace;color:#e2e8f0">${v || "—"}</div></div>`).join("")}
          </div>
          ${buildVerifTable("Vehicle Details", vd.vehicleRows)}
          ${buildVerifTable("Owner Details", vd.ownerRows)}
          ${buildVerifTable("Pricing", vd.pricingRows)}
        </div>`;
    } else if (result.verificationReport) {
      verifSection = `<div style="margin-top:16px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;padding:16px">
        <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">Verification Report</div>
        <pre style="font-size:11px;font-family:monospace;color:#cbd5e1;white-space:pre-wrap;margin:0">${result.verificationReport}</pre>
      </div>`;
    }

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<title>Regression Report — ${result.vehicleNumber} ${result.targetInsurer}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #020617; color: #e2e8f0; font-size: 13px; padding: 28px; }
  table { border-collapse: collapse; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
  <div style="border-bottom:1px solid #1e293b;padding-bottom:14px;margin-bottom:18px;display:flex;align-items:flex-start;justify-content:space-between">
    <div>
      <div style="font-size:18px;font-weight:800;color:${statusColor}">${statusSymbol}</div>
      <div style="font-size:14px;color:#94a3b8;margin-top:4px">${result.vehicleNumber} → ${result.targetInsurer}</div>
      <div style="font-size:11px;color:#475569;margin-top:3px">${passed}/${(result.steps ?? []).length} steps passed${duration ? ` · ${duration}s` : ""}${result.completedAt ? ` · ${new Date(result.completedAt).toLocaleString()}` : ""}</div>
    </div>
    <div style="font-size:10px;color:#334155;text-align:right">Secarang Regression<br/>Generated ${new Date().toLocaleString()}</div>
  </div>

  <div style="background:#0f172a;border:1px solid #1e293b;border-radius:10px;overflow:hidden">
    <div style="padding:10px 14px;border-bottom:1px solid #1e293b;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Steps</div>
    <table style="width:100%;color:#e2e8f0">${stepRows}</table>
  </div>

  ${result.errorMessage ? `<div style="margin-top:14px;background:#450a0a;border:1px solid #7f1d1d;border-radius:8px;padding:12px;font-family:monospace;font-size:12px;color:#fca5a5">${result.errorMessage}</div>` : ""}

  ${verifSection}

  ${result.postcodeChangeInfo ? (() => {
    const pc = result.postcodeChangeInfo as PostcodeChangeInfo;
    const priceColor  = pc.priceChanged ? "#f59e0b" : "#22c55e";
    const priceSymbol = pc.priceChanged ? "⚠ Price Changed" : "✓ Price Unchanged";
    return `<div style="margin-top:14px;background:#0f172a;border:1px solid #1e293b;border-radius:10px;overflow:hidden">
      <div style="padding:10px 14px;border-bottom:1px solid #1e293b;font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em">Postcode Change — Quotation Page</div>
      <div style="padding:12px 14px;display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:12px;color:#e2e8f0">
        <div>
          <div style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">Before</div>
          <div style="font-family:monospace;color:#94a3b8">${pc.priceBefore || "—"}</div>
        </div>
        <div>
          <div style="color:#64748b;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px">After (postcode ${pc.postcode})</div>
          <div style="font-family:monospace;color:#94a3b8">${pc.priceAfter || "—"}</div>
        </div>
      </div>
      <div style="padding:8px 14px;border-top:1px solid #1e293b;font-size:11px;font-weight:700;color:${priceColor}">${priceSymbol}</div>
    </div>`;
  })() : ""}

  ${(result.screenshots ?? []).length > 0 ? `
  <div style="margin-top:20px">
    <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #1e293b">Screenshots</div>
    ${(result.screenshots as RegressionScreenshot[]).map(s => `
      <div style="margin-bottom:20px;break-inside:avoid">
        <div style="font-size:11px;font-weight:600;color:#94a3b8;margin-bottom:6px">${s.label}</div>
        <img src="${s.dataUrl}" style="width:100%;border-radius:6px;border:1px solid #1e293b;display:block" />
      </div>`).join("")}
  </div>` : ""}
</body>
</html>`;

    const win = window.open("", "_blank", "width=960,height=700");
    if (!win) {
      alert("Popup blocked — please allow popups for this page and try again.");
      return;
    }
    win.document.write(html);
    win.document.close();
    // Give the browser time to render base64 images before opening the print dialog
    setTimeout(() => { win.focus(); win.print(); }, 800);
  }

  // ── Config form (two-column) ──────────────────────────────
  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-3">


      {/* ── Compact result panel — always visible after a run ── */}
      {(result || error) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">

          {/* Result header bar */}
          {result && (
            <div className={clsx(
              "flex items-center gap-3 px-4 py-2.5 border-b border-slate-800",
              result.overallStatus === "PASS" ? "bg-green-950/30" : "bg-red-950/30"
            )}>
              <span className={clsx(
                "text-sm font-black tracking-tight shrink-0",
                result.overallStatus === "PASS" ? "text-green-400" : "text-red-400"
              )}>
                {result.overallStatus === "PASS" ? "✓ PASS" : "✗ FAIL"}
              </span>
              <span className="text-xs text-slate-300 font-medium">{result.vehicleNumber} → {result.targetInsurer}</span>
              <span className="text-xs text-slate-500">
                {passed}/{(result.steps ?? []).length} steps
                {duration && <> · {duration}s</>}
                {failed > 0 && <span className="text-red-400 ml-1">· {failed} failed</span>}
              </span>
              {result.completedAt && <span className="text-xs text-slate-600 hidden sm:block">{new Date(result.completedAt).toLocaleTimeString()}</span>}
              <div className="ml-auto flex items-center gap-2">
                <button onClick={handleDownloadPDF}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-600/15 border border-blue-500/30 text-blue-300 hover:bg-blue-600/25 transition-all">
                  <Download size={11} /> PDF
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="flex gap-2 px-4 py-2.5 border-b border-slate-800">
              <AlertCircle size={13} className="text-red-400 shrink-0 mt-0.5" />
              <pre className="text-xs text-red-300 whitespace-pre-wrap font-mono">{error}</pre>
            </div>
          )}

          {/* Steps + Log — 2-column layout */}
          {result && (result.steps ?? []).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/60 border-t border-slate-800/60">

              {/* Left: steps */}
              <div className="divide-y divide-slate-800/60">
                {(result.steps ?? []).map((step, i) => (
                  <div key={i} className={clsx(
                    "flex items-center gap-2.5 px-4 py-1.5",
                    step.status === "FAIL" && "bg-red-950/20"
                  )}>
                    <span className="text-[10px] text-slate-700 w-4 shrink-0 text-right">{i + 1}.</span>
                    <StepBadge status={step.status} />
                    <span className="text-xs font-medium text-slate-300 shrink-0">{step.name}</span>
                    {step.message && <span className="text-[11px] text-slate-500 truncate">{step.message}</span>}
                    <span className="text-[10px] text-slate-700 ml-auto shrink-0 hidden sm:block">{new Date(step.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>

              {/* Right: run log */}
              <div className="flex flex-col">
                <div className="px-4 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest border-b border-slate-800/60">Run Log</div>
                <pre className="px-4 py-3 text-[11px] text-slate-500 font-mono whitespace-pre-wrap overflow-y-auto leading-relaxed flex-1" style={{ maxHeight: "calc(1.75rem * 13)" }}>{log || "—"}</pre>
              </div>

            </div>
          )}

          {/* Postcode change info — shown when postcode was applied on quotation page */}
          {result?.postcodeChangeInfo && (() => {
            const pc = result.postcodeChangeInfo as PostcodeChangeInfo;
            return (
              <div className="border-t border-slate-800 px-4 py-3">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">Postcode Change — Quotation Page</p>
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">Before</p>
                    <p className="text-xs font-mono text-slate-400">{pc.priceBefore || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-600 mb-0.5">After (postcode {pc.postcode})</p>
                    <p className="text-xs font-mono text-slate-400">{pc.priceAfter || "—"}</p>
                  </div>
                </div>
                <p className={clsx(
                  "text-xs font-semibold",
                  pc.priceChanged ? "text-amber-400" : "text-green-400"
                )}>
                  {pc.priceChanged ? "⚠ Price changed" : "✓ Price unchanged"}
                </p>
              </div>
            );
          })()}

          {/* Verification + error — below the 2-col grid */}
          {result && (result.verificationData || result.verificationReport || result.errorMessage) && (
            <div className="border-t border-slate-800">
              {result.verificationData
                ? <VerificationReportUI data={result.verificationData} />
                : result.verificationReport && (
                  <details className="group">
                    <summary className="px-4 py-2 text-xs text-slate-500 cursor-pointer hover:text-slate-300 select-none list-none flex items-center gap-1">
                      <ChevronDown size={11} className="group-open:rotate-180 transition-transform" /> Verification report
                    </summary>
                    <pre className="px-4 pb-3 text-xs font-mono text-slate-300 whitespace-pre overflow-x-auto leading-relaxed">{result.verificationReport}</pre>
                  </details>
                )
              }
              {result.errorMessage && (
                <div className="px-4 py-2 text-xs text-red-300 font-mono border-t border-slate-800">{result.errorMessage}</div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">

          {/* ── LEFT: Environment + Vehicle ── */}
          <div className="p-5 space-y-5">
            {/* Environment */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Environment</p>
              <WField label="Preset">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {SC_REGRESSION_ENV_PRESETS.map(p => (
                    <button key={p.value} type="button"
                      onClick={() => patch({ baseUrl: p.value, customEnv: false })}
                      disabled={loading}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                        !cfg.customEnv && cfg.baseUrl === p.value
                          ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                          : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300",
                        loading && "opacity-50 cursor-not-allowed pointer-events-none"
                      )}>{p.label}</button>
                  ))}
                  <button type="button"
                    onClick={() => patch({ customEnv: true })}
                    disabled={loading}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      cfg.customEnv
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300",
                      loading && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}>Custom</button>
                </div>
                {cfg.customEnv ? (
                  <input value={cfg.baseUrl}
                    onChange={e => patch({ baseUrl: e.target.value })}
                    placeholder="https://..."
                    className={INPUT_CLS}
                  />
                ) : (
                  <p className="text-xs text-slate-600 font-mono">{cfg.baseUrl}</p>
                )}
              </WField>
              <WField label="Site Password">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={cfg.sitePassword}
                    onChange={e => patch({ sitePassword: e.target.value })}
                    disabled={loading}
                    className={INPUT_CLS}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </WField>
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-800" />

            {/* Bank Credentials */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Bank Credentials</p>
              <WField label="Bank Username">
                <input
                  value={bankCredsDraft?.username ?? cfg.bankUsername}
                  onChange={e => setBankCredsDraft(d => ({ username: e.target.value, password: d?.password ?? cfg.bankPassword }))}
                  placeholder="Username"
                  autoComplete="off"
                  disabled={loading}
                  className={INPUT_CLS}
                />
              </WField>
              <WField label="Bank Password">
                <input
                  type="text"
                  value={bankCredsDraft?.password ?? cfg.bankPassword}
                  onChange={e => setBankCredsDraft(d => ({ username: d?.username ?? cfg.bankUsername, password: e.target.value }))}
                  placeholder="Password"
                  autoComplete="off"
                  disabled={loading}
                  className={INPUT_CLS}
                />
              </WField>

              {confirmBankUpdate ? (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5">
                  <span className="text-xs text-amber-300 flex-1">Update bank credentials?</span>
                  <button type="button"
                    onClick={() => {
                      if (bankCredsDraft) patch({ bankUsername: bankCredsDraft.username, bankPassword: bankCredsDraft.password });
                      setBankCredsDraft(null);
                      setConfirmBankUpdate(false);
                    }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 transition-all">
                    Yes, update
                  </button>
                  <button type="button"
                    onClick={() => { setBankCredsDraft(null); setConfirmBankUpdate(false); }}
                    className="px-3 py-1 rounded-lg text-xs font-semibold bg-slate-700 border border-slate-600 text-slate-400 hover:text-slate-200 transition-all">
                    Cancel
                  </button>
                </div>
              ) : (
                <button type="button"
                  onClick={() => setConfirmBankUpdate(true)}
                  disabled={loading || !bankCredsDraft}
                  className="w-full py-2 rounded-xl text-xs font-semibold border transition-all bg-slate-800 border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed">
                  Update
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="h-px bg-slate-800" />

            {/* Vehicle */}
            <div className="space-y-3">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Vehicle</p>
              <div className="grid grid-cols-2 gap-3">
                <WField label="Vehicle Number">
                  <input value={cfg.vehicleNumber}
                    onChange={e => patch({ vehicleNumber: e.target.value.toUpperCase() })}
                    placeholder="WXX1234"
                    disabled={loading}
                    className={clsx(INPUT_CLS, "font-mono")}
                  />
                </WField>
                <WField label="IC / SSM Number">
                  <input value={cfg.icNumber}
                    onChange={e => patch({ icNumber: e.target.value })}
                    placeholder="730620065847"
                    disabled={loading}
                    className={clsx(INPUT_CLS, "font-mono")}
                  />
                </WField>
                <WField label="Postcode">
                  <input value={cfg.postcode}
                    onChange={e => patch({ postcode: e.target.value })}
                    placeholder="55000"
                    disabled={loading}
                    className={INPUT_CLS}
                  />
                </WField>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Vehicle Type</label>
                  <div className="flex gap-1.5 h-[38px]">
                    {(["car", "motorcycle"] as const).map(vt => (
                      <button key={vt} type="button"
                        onClick={() => patch({ vehicleType: vt })}
                        disabled={loading}
                        className={clsx("flex-1 rounded-lg text-xs font-medium border transition-all capitalize",
                          cfg.vehicleType === vt
                            ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                            : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300",
                          loading && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}>
                        {vt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Owner Type</label>
                  <div className="flex gap-1.5 h-[38px]">
                    {(["private", "company"] as const).map(ot => (
                      <button key={ot} type="button"
                        onClick={() => patch({ ownerType: ot })}
                        disabled={loading}
                        className={clsx("flex-1 rounded-lg text-xs font-medium border transition-all capitalize",
                          cfg.ownerType === ot
                            ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                            : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300",
                          loading && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}>
                        {ot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: 4 flow sections ── */}
          <div className="p-5 space-y-5 overflow-y-auto">

            {/* Section 1: Choose Quotation */}
            <RightSectionHeader num={1} label="Choose Quotation" />
            <div className="flex gap-2">
              {(["Zurich", "Lonpac", "Tokio Marine"] as const).map(ins => (
                <button key={ins} type="button"
                  onClick={() => patch({ targetInsurer: ins, selectedAddons: INSURER_DEFAULT_ADDONS[ins] ?? [] })}
                  disabled={loading}
                  className={clsx(
                    "flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all",
                    cfg.targetInsurer === ins
                      ? "bg-blue-600/20 border-blue-500 text-blue-200"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                    loading && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}>
                  {ins}
                </button>
              ))}
            </div>

            {/* Coverage type — only shown for Zurich */}
            {cfg.targetInsurer === "Zurich" && (
              <div className="flex gap-2 mt-2">
                <button type="button"
                  onClick={() => patch({ coverageType: "comprehensive" })}
                  disabled={loading}
                  className={clsx(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all",
                    cfg.coverageType === "comprehensive"
                      ? "bg-blue-600/20 border-blue-500 text-blue-200"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                    loading && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}>
                  Comprehensive
                </button>
                <div className="flex-1 flex flex-col items-stretch gap-1">
                  <button type="button"
                    disabled
                    className="w-full py-2.5 rounded-xl text-sm font-semibold border-2 bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60">
                    TPFT
                  </button>
                  <p className="text-[10px] text-red-500/80 text-center leading-tight">
                    (pending to be deployed by dev. enable once changes has been pushed)
                  </p>
                </div>
              </div>
            )}

            {/* Postcode quick-select — sub-section of Choose Quotation */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Postcode</p>
              <div className="flex gap-1.5 flex-wrap">
                {POSTCODE_PRESETS.map(({ label, value, hint }) => (
                  <button key={label} type="button"
                    onClick={() => patch({ postcode: value })}
                    disabled={loading}
                    title={`${hint} — ${value}`}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                      cfg.postcode === value
                        ? "bg-blue-600/20 border-blue-500 text-blue-200"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                      loading && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}>
                    {label}
                  </button>
                ))}
                <button type="button"
                  onClick={() => {
                    if (PRESET_POSTCODES.has(cfg.postcode)) patch({ postcode: "" });
                  }}
                  disabled={loading}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                    !PRESET_POSTCODES.has(cfg.postcode)
                      ? "bg-blue-600/20 border-blue-500 text-blue-200"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                    loading && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}>
                  Custom
                </button>
              </div>
              {!PRESET_POSTCODES.has(cfg.postcode) && (
                <input
                  value={cfg.postcode}
                  onChange={e => patch({ postcode: e.target.value })}
                  placeholder="e.g. 55000"
                  maxLength={5}
                  disabled={loading}
                  className={clsx(
                    "mt-2 w-full px-3 py-1.5 rounded-lg text-xs bg-slate-800 border border-slate-600 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30",
                    loading && "opacity-50 cursor-not-allowed"
                  )}
                />
              )}
            </div>

            {/* Sum Insured quick-select — sub-section of Choose Quotation */}
            <div>
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Sum Insured</p>
              <div className="flex gap-1.5">
                {(["default", "min", "medium", "max"] as const).map(mode => (
                  <button key={mode} type="button"
                    onClick={() => patch({ sumInsuredMode: mode })}
                    disabled={loading}
                    title={{
                      default: "Leave as-is — use whatever the system shows",
                      min:     "Select the first (lowest) option in the dropdown",
                      medium:  "Select the second option (not first, not last)",
                      max:     "Select the last (highest) option in the dropdown",
                    }[mode]}
                    className={clsx(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold border transition-all capitalize",
                      cfg.sumInsuredMode === mode
                        ? "bg-blue-600/20 border-blue-500 text-blue-200"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                      loading && "opacity-50 cursor-not-allowed pointer-events-none"
                    )}>
                    {mode}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-1.5 leading-tight">
                {cfg.sumInsuredMode === "default" && "System default — dropdown is not touched."}
                {cfg.sumInsuredMode === "min"     && "Selects the first (lowest) sum insured option."}
                {cfg.sumInsuredMode === "medium"  && "Selects the 2nd option — skipped if only 2 options exist."}
                {cfg.sumInsuredMode === "max"     && "Selects the last (highest) sum insured option."}
                {" "}If the dropdown is not shown or disabled, this setting is skipped automatically.
              </p>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Section 2: Add-ons — list changes based on the selected insurer */}
            <RightSectionHeader num={2} label="Add-ons" />
            {(() => {
              const available = INSURER_ADDONS[cfg.targetInsurer] ?? [];
              if (!available.length) {
                return <p className="text-xs text-slate-600 italic">No add-ons available for {cfg.targetInsurer}.</p>;
              }
              return (
                <div className="space-y-1.5">
                  {available.map(addon => {
                    const on = cfg.selectedAddons.includes(addon);
                    return (
                      <button key={addon} type="button"
                        onClick={() => {
                          const next = on
                            ? cfg.selectedAddons.filter(a => a !== addon)
                            : [...cfg.selectedAddons, addon];
                          patch({ selectedAddons: next });
                        }}
                        disabled={loading}
                        className={clsx(
                          "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium border transition-all text-left",
                          on
                            ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                            : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300",
                          loading && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}>
                        <span className={clsx(
                          "w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-all",
                          on ? "bg-blue-500 border-blue-500" : "border-slate-600"
                        )}>
                          {on && <span className="text-white text-[9px] font-black leading-none">✓</span>}
                        </span>
                        {addon}
                      </button>
                    );
                  })}
                </div>
              );
            })()}

            <div className="h-px bg-slate-800" />

            {/* Section 3: Confirmation Payment */}
            <RightSectionHeader num={3} label="Confirmation Payment" />
            <div className="space-y-3">
              <WField label="Full Name">
                <input value={cfg.ownerName}
                  onChange={e => patch({ ownerName: e.target.value })}
                  placeholder="MUHAMMAD FAIZUDDIN BIN BIDI"
                  disabled={loading}
                  className={INPUT_CLS}
                />
              </WField>
              <div className="grid grid-cols-2 gap-3">
                <WField label="Email">
                  <input value={cfg.ownerEmail}
                    onChange={e => patch({ ownerEmail: e.target.value })}
                    placeholder="you@example.com"
                    disabled={loading}
                    className={INPUT_CLS}
                  />
                </WField>
                <WField label="Phone">
                  <input value={cfg.ownerPhone}
                    onChange={e => patch({ ownerPhone: e.target.value })}
                    placeholder="189812839"
                    disabled={loading}
                    className={INPUT_CLS}
                  />
                </WField>
              </div>
              <WField label="Address Line 1">
                <input value={cfg.addressLine1}
                  onChange={e => patch({ addressLine1: e.target.value })}
                  placeholder="Street address"
                  disabled={loading}
                  className={INPUT_CLS}
                />
              </WField>
              <div className="grid grid-cols-2 gap-3">
                <WField label="Address Line 2">
                  <input value={cfg.addressLine2}
                    onChange={e => patch({ addressLine2: e.target.value })}
                    placeholder="Taman / Area"
                    disabled={loading}
                    className={INPUT_CLS}
                  />
                </WField>
                <WField label="Address Line 3">
                  <input value={cfg.addressLine3}
                    onChange={e => patch({ addressLine3: e.target.value })}
                    placeholder="City, State"
                    disabled={loading}
                    className={INPUT_CLS}
                  />
                </WField>
              </div>
              <WField label="Discount Code" hint="(optional)">
                <input value={cfg.discountCode}
                  onChange={e => patch({ discountCode: e.target.value })}
                  placeholder="PROMO123"
                  disabled={loading}
                  className={INPUT_CLS}
                />
              </WField>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Section 4: Choose Payment */}
            <RightSectionHeader num={4} label="Choose Payment" />
            <div className="flex gap-2 mb-3">
              {(["fpx", "card"] as const).map(m => (
                <button key={m} type="button"
                  onClick={() => patch({ paymentMethod: m })}
                  disabled={loading}
                  className={clsx(
                    "flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all uppercase tracking-wide",
                    cfg.paymentMethod === m
                      ? "bg-blue-600/20 border-blue-500 text-blue-200"
                      : "bg-slate-800 border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-300",
                    loading && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}>{m === "fpx" ? "FPX" : "Card"}</button>
              ))}
            </div>

            {cfg.paymentMethod === "fpx" && (
              <div className="space-y-3">
                <WField label="Bank">
                  <div className="grid grid-cols-5 gap-1.5">
                    {REGRESSION_BANKS.map(b => (
                      <button key={b.value} type="button"
                        onClick={() => patch({ targetBank: b.value })}
                        disabled={loading}
                        className={clsx(
                          "px-1 py-2 rounded-lg text-[11px] font-medium border transition-all text-center leading-tight",
                          cfg.targetBank === b.value
                            ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                            : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300",
                          loading && "opacity-50 cursor-not-allowed pointer-events-none"
                        )}>{b.label}</button>
                    ))}
                  </div>
                </WField>
                <WField label="Payment Status">
                  <select
                    value={cfg.paymentStatus}
                    onChange={e => patch({ paymentStatus: e.target.value })}
                    disabled={loading}
                    className={clsx(INPUT_CLS, "cursor-pointer")}
                  >
                    {FPX_STATUS_CODES.map(s => (
                      <option key={s.value} value={s.value}>
                        {s.value} — {s.label}
                      </option>
                    ))}
                  </select>
                </WField>
              </div>
            )}

            {cfg.paymentMethod === "card" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-amber-500/80 uppercase tracking-wide bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">WIP — UI only</span>
                </div>
                <WField label="Card Number">
                  <input value={cfg.cardNumber}
                    onChange={e => patch({ cardNumber: e.target.value.replace(/\D/g, "").slice(0, 16) })}
                    placeholder="1234 5678 9012 3456"
                    autoComplete="off"
                    className={clsx(INPUT_CLS, "font-mono tracking-widest")}
                  />
                </WField>
                <div className="grid grid-cols-2 gap-3">
                  <WField label="Expiry (MM/YY)">
                    <input value={cfg.cardExpiry}
                      onChange={e => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 4);
                        patch({ cardExpiry: v.length > 2 ? `${v.slice(0,2)}/${v.slice(2)}` : v });
                      }}
                      placeholder="MM/YY"
                      autoComplete="off"
                      className={clsx(INPUT_CLS, "font-mono")}
                    />
                  </WField>
                  <WField label="CVV">
                    <div className="relative">
                      <input
                        type={showCardCvv ? "text" : "password"}
                        value={cfg.cardCvv}
                        onChange={e => patch({ cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        placeholder="•••"
                        autoComplete="off"
                        className={clsx(INPUT_CLS, "font-mono")}
                      />
                      <button type="button" onClick={() => setShowCardCvv(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showCardCvv ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </WField>
                </div>
                <WField label="Name on Card">
                  <input value={cfg.cardName}
                    onChange={e => patch({ cardName: e.target.value.toUpperCase() })}
                    placeholder="MUHAMMAD FAIZUDDIN"
                    autoComplete="off"
                    className={clsx(INPUT_CLS, "font-mono")}
                  />
                </WField>
              </div>
            )}

            {/* Invisible spacer so the last section isn't flush against the Run button */}
            <div className="h-1" />
          </div>
        </div>

        {/* Footer — Run or Stop */}
        <div className="px-5 py-4 border-t border-slate-800 flex items-center gap-3">
          {!loading ? (
            <button
              type="button"
              onClick={handleRun}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-colors"
            >
              <Play size={14} /> Run Regression
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStop}
              disabled={stopping}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl transition-colors"
            >
              <Square size={13} /> {stopping ? "Stopping…" : "Stop"}
            </button>
          )}
          {loading && (
            <div className="flex items-center gap-2">
              <Loader2 size={13} className="animate-spin text-blue-400" />
              <span className="text-xs text-slate-400 animate-pulse">
                {stopping ? "Stopping…" : "Running E2E regression…"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Live log — shown below config panel while running */}
      {loading && liveLog && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800 text-xs text-slate-400">
            <Loader2 size={11} className="animate-spin text-blue-400 shrink-0" />
            Live output
          </div>
          <pre ref={liveLogRef}
            className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-pre-wrap overflow-x-auto max-h-72 overflow-y-auto leading-relaxed"
          >{liveLog}</pre>
        </div>
      )}
    </div>
  );
}
