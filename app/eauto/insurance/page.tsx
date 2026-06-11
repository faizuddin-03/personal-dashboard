"use client";
import { useState, useEffect, useMemo } from "react";
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
  RegressionResult, RegressionStepResult,
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

// One vehicle per line. Each line may carry an optional IC number after the
// plate, separated by a tab (Excel paste), comma, or spaces. IC dashes/spaces
// are stripped so "030217-14-1005" and "030217141005" normalise the same.
function parseVehicles(raw: string): VehicleEntry[] {
  return raw
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[\s,]+/).filter(Boolean);
      const vehicleNumber = (parts[0] ?? "").toUpperCase();
      const icNumber = (parts[1] ?? "").replace(/[-\s]/g, "") || undefined;
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
  const searchLower = search.trim().toLowerCase();
  const afterSearch = filteredRows.filter(r => {
    if (searchLower) {
      const hit = [r.vehicleNumber, r.make, r.model, r.insurer]
        .some(f => f.toLowerCase().includes(searchLower));
      if (!hit) return false;
    }
    if (allowFilter !== "all") {
      const v = r.allowPurchase.trim().toLowerCase();
      if (allowFilter === "yes"   && !["yes","y","true","1"].includes(v))          return false;
      if (allowFilter === "no"    && !["no","n","false","0"].includes(v))           return false;
      if (allowFilter === "refer" && !v.startsWith("refer"))                        return false;
    }
    return true;
  });

  // Sort
  const displayRows = sort.key
    ? [...afterSearch].sort((a, b) => {
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

  // Summary stats over displayRows
  const statsYes   = displayRows.filter(r => ["yes","y","true","1"].includes(r.allowPurchase.trim().toLowerCase())).length;
  const statsNo    = displayRows.filter(r => ["no","n","false","0"].includes(r.allowPurchase.trim().toLowerCase())).length;
  const statsRefer = displayRows.filter(r => r.allowPurchase.trim().toLowerCase().startsWith("refer")).length;

  const matrix         = buildMatrix(afterSearch);
  const matrixVehicles = Array.from(matrix.keys());
  const matrixInsurers = Array.from(new Set(afterSearch.map(r => r.insurer).filter(Boolean)));
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

  return (
    <div className="flex flex-col min-h-full">

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

      {activeTab === "tab2" && <SecarangTab mode="standard" />}
      {activeTab === "tab3" && <RegressionTab />}

      {activeTab === "check" && <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

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
          </div>
        )}

        {/* ── Empty state: filters produced no results ── */}
        {afterSearch.length === 0 && rows.length > 0 && (
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
                {displayRows.map((row, idx) => (
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
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Matrix view ── */}
        {afterSearch.length > 0 && view === "matrix" && (
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
      </div>}
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
      const icNumber = (parts[1] ?? "").replace(/[-\s]/g, "") || undefined;
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
    if (r.insurer && !shownInsurers.has(r.insurer)) return false;
    if (searchLower) {
      const hit = [r.vehicleNumber, r.make, r.model, r.insurer, r.variant]
        .some(f => f.toLowerCase().includes(searchLower));
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

function RegressionTab() {
  const [vehicleNumber,  setVehicleNumber]  = useState("WYN3837");
  const [icNumber,       setIcNumber]       = useState("730620065847");
  const [postcode,       setPostcode]       = useState("55000");
  const [targetInsurer,  setTargetInsurer]  = useState("Zurich");
  const [baseUrl,        setBaseUrl]        = useState<string>(SC_DEFAULT_ENV);
  const [customEnv,      setCustomEnv]      = useState(false);
  const [sitePassword,   setSitePassword]   = useState(SC_DEFAULT_PASSWORD);
  const [showPassword,   setShowPassword]   = useState(false);
  const [showAdvanced,   setShowAdvanced]   = useState(false);
  const [showLog,        setShowLog]        = useState(false);

  const [loading,  setLoading]  = useState(false);
  const [stopping, setStopping] = useState(false);
  const [result,   setResult]   = useState<RegressionResult | null>(null);
  const [error,    setError]    = useState("");
  const [log,      setLog]      = useState("");

  useEffect(() => {
    const saved = loadRegressionTestResult();
    if (saved) { setResult(saved); setLog(saved.log ?? ""); }
  }, []);

  function handleRun() {
    setLoading(true);
    setStopping(false);
    setResult(null);
    setError("");
    setLog("");
    fetch("/api/secarang/regression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl:       baseUrl       || undefined,
        sitePassword:  sitePassword  || undefined,
        vehicleNumber,
        icNumber:      icNumber.replace(/[-\s]/g, ""),
        postcode,
        targetInsurer,
      }),
    })
      .then(r => r.json())
      .then(data => {
        setLoading(false);
        setStopping(false);
        if (data.error && !data.steps) { setError(data.error); return; }
        const res = data as RegressionResult;
        setResult(res);
        setLog(data.log ?? "");
        saveRegressionTestResult({ ...res, log: data.log ?? "" });
      })
      .catch(e => {
        setLoading(false);
        setStopping(false);
        setError(e instanceof Error ? e.message : "Something went wrong");
      });
  }

  function handleStop() {
    setStopping(true);
    fetch("/api/secarang/regression", { method: "DELETE" }).catch(() => {});
  }

  function handleClear() {
    setResult(null);
    setError("");
    setLog("");
    clearRegressionTestResult();
  }

  const passed = result?.steps.filter(s => s.status === "PASS").length ?? 0;
  const failed = result?.steps.filter(s => s.status === "FAIL").length ?? 0;
  const duration = result ? (result.durationMs / 1000).toFixed(1) : null;

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

      {/* Config panel */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">

        {/* Fixed test identity */}
        <div className="flex items-start gap-3">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Vehicle Number</label>
              <input
                value={vehicleNumber}
                onChange={e => setVehicleNumber(e.target.value.toUpperCase())}
                disabled={loading}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">IC Number</label>
              <input
                value={icNumber}
                onChange={e => setIcNumber(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Target Insurer</label>
              <input
                value={targetInsurer}
                onChange={e => setTargetInsurer(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>
          </div>
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          {showAdvanced ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          Advanced settings
        </button>

        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Environment</label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {SC_REGRESSION_ENV_PRESETS.map(p => (
                  <button key={p.value} type="button"
                    onClick={() => { setBaseUrl(p.value); setCustomEnv(false); }}
                    disabled={loading}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all disabled:opacity-50",
                      !customEnv && baseUrl === p.value
                        ? "bg-blue-600/20 border-blue-500/60 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}>{p.label}</button>
                ))}
              </div>
              <input
                value={customEnv ? baseUrl : ""}
                onChange={e => { setBaseUrl(e.target.value); setCustomEnv(true); }}
                placeholder="Custom URL…"
                disabled={loading}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Site Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={sitePassword}
                  onChange={e => setSitePassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pr-9 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Run / Stop */}
        <div className="flex items-center gap-3 pt-1">
          {!loading ? (
            <button onClick={handleRun}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors">
              <Play size={14} /> Run Regression
            </button>
          ) : (
            <button onClick={handleStop} disabled={stopping}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-colors">
              <Square size={14} /> {stopping ? "Stopping…" : "Stop"}
            </button>
          )}

          {loading && !stopping && (
            <span className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={14} className="animate-spin" />
              Running E2E test…
            </span>
          )}

          {result && !loading && (
            <button onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors">
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Error (API/network level) */}
      {error && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <pre className="text-sm text-red-300 whitespace-pre-wrap font-mono">{error}</pre>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">

          {/* Overall status banner */}
          <div className={clsx(
            "rounded-2xl border p-5 flex items-center justify-between gap-4",
            result.overallStatus === "PASS"
              ? "bg-green-950/40 border-green-800/60"
              : "bg-red-950/40 border-red-800/60"
          )}>
            <div className="flex items-center gap-3">
              <span className={clsx(
                "text-3xl font-black tracking-tight",
                result.overallStatus === "PASS" ? "text-green-400" : "text-red-400"
              )}>
                {result.overallStatus === "PASS" ? "✓ PASS" : "✗ FAIL"}
              </span>
              <div className="text-sm text-slate-400 space-y-0.5">
                <div>{result.vehicleNumber} → {result.targetInsurer}</div>
                <div className="text-xs text-slate-500">
                  {passed} / {result.steps.length} steps passed
                  {duration && <> · {duration}s</>}
                  {result.completedAt && <> · {new Date(result.completedAt).toLocaleString()}</>}
                </div>
              </div>
            </div>
            {failed > 0 && (
              <span className="text-sm font-semibold text-red-400">{failed} failed</span>
            )}
          </div>

          {/* Steps list */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 text-xs font-semibold text-slate-400 uppercase tracking-wide">
              Steps
            </div>
            <div className="divide-y divide-slate-800">
              {result.steps.map((step, i) => (
                <div key={i} className={clsx(
                  "flex items-start gap-3 px-5 py-3.5",
                  step.status === "FAIL" && "bg-red-950/20",
                )}>
                  <span className="text-xs text-slate-600 w-5 shrink-0 pt-0.5 text-right">{i + 1}.</span>
                  <StepBadge status={step.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-200">{step.name}</div>
                    {step.message && (
                      <div className="text-xs text-slate-500 mt-0.5">{step.message}</div>
                    )}
                  </div>
                  <span className="text-xs text-slate-700 shrink-0 hidden sm:block">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Error message (script-level) */}
          {result.errorMessage && (
            <div className="bg-red-950/30 border border-red-800/50 rounded-xl px-4 py-3 text-sm text-red-300 font-mono">
              {result.errorMessage}
            </div>
          )}

          {/* Log */}
          {log && (
            <details open={showLog} onToggle={e => setShowLog((e.target as HTMLDetailsElement).open)}
              className="bg-slate-900 border border-slate-800 rounded-xl">
              <summary className="px-4 py-2.5 text-xs text-slate-500 cursor-pointer hover:text-slate-300 select-none">
                Show run log
              </summary>
              <pre className="px-4 pb-3 text-xs text-slate-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{log}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
