"use client";
import { useState, useEffect } from "react";
import {
  Shield, Play, Download, Loader2,
  TableProperties, LayoutGrid, AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff, Trash2,
  Search, X,
} from "lucide-react";
import * as XLSX from "xlsx";
import clsx from "clsx";

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

interface InsuranceRow {
  vehicleNumber:  string;
  make:           string;
  model:          string;
  mfgYear:        string;
  engineCC:       string;
  transmission:   string;
  variant:        string;
  insurer:        string;
  coverType:      string;
  allowPurchase:  string;
  referRiskCode:  string;
  totalPrice:     string;
}

interface SavedResults {
  rows: InsuranceRow[];
  vehicleInput: string;
  username: string;
  baseUrl: string;
  runLog: string;
  savedAt: string;
}

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

const STORAGE_KEY = "insurance_results";

function loadSaved(): SavedResults | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveResults(data: SavedResults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function clearSaved() {
  localStorage.removeItem(STORAGE_KEY);
}

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
function parseVehicles(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map(v => v.trim().toUpperCase())
    .filter(Boolean);
}

function exportToExcel(rows: InsuranceRow[]) {
  const data = rows.map(r => ({
    "Vehicle Number":  r.vehicleNumber,
    "Make":            r.make,
    "Model":           r.model,
    "Mfg Year":        r.mfgYear,
    "Engine CC":       r.engineCC,
    "Transmission":    r.transmission,
    "Variant":         r.variant,
    "Insurer":         r.insurer,
    "Cover Type":      r.coverType,
    "Allow Purchase":  r.allowPurchase,
    "Refer Risk Code": r.referRiskCode,
    "Total Price":     r.totalPrice,
  }));
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Insurance Results");
  XLSX.writeFile(wb, `insurance_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function buildMatrix(rows: InsuranceRow[]) {
  const map = new Map<string, Map<string, string>>();
  for (const r of rows) {
    const vn = r.vehicleNumber.toUpperCase();
    if (!map.has(vn)) map.set(vn, new Map());
    if (r.insurer) map.get(vn)!.set(r.insurer, r.allowPurchase);
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
  // Input
  const [vehicleInput, setVehicleInput]     = useState("");
  const [username, setUsername]             = useState("");
  const [password, setPassword]             = useState("");
  const [showPassword, setShowPassword]     = useState(false);
  const [baseUrl, setBaseUrl]               = useState<string>(DEFAULT_ENV);
  const [customEnv, setCustomEnv]           = useState(false);
  const [icNumber, setIcNumber]             = useState("");
  const [postcode, setPostcode]             = useState("");
  const [vehicleCategory, setVehicleCategory] = useState<"individual" | "company">("individual");
  const [concurrency, setConcurrency]       = useState(4);
  const [showAdvanced, setShowAdvanced]     = useState(false);

  // Run state
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [hasRun, setHasRun]     = useState(false);
  const [runLog, setRunLog]     = useState("");
  const [savedAt, setSavedAt]   = useState<string | null>(null);

  // Results
  const [rows, setRows]         = useState<InsuranceRow[]>([]);
  const [view, setView]         = useState<ViewMode>("table");

  // Display filter — applied to results after run (does not affect what script checks)
  const [shownInsurers, setShownInsurers] = useState<Set<string>>(new Set(ALL_INSURERS));

  // Search / Allow Purchase filter / Sort
  const [search, setSearch]               = useState("");
  const [allowFilter, setAllowFilter]     = useState<AllowFilter>("all");
  const [sort, setSort]                   = useState<SortState>({ key: null, dir: "asc" });

  // Restore saved results on mount
  useEffect(() => {
    const saved = loadSaved();
    if (!saved || saved.rows.length === 0) return;
    setRows(saved.rows);
    setVehicleInput(saved.vehicleInput);
    if (saved.username) setUsername(saved.username);
    if (saved.baseUrl) {
      setBaseUrl(saved.baseUrl);
      const isPreset = ENV_PRESETS.some(p => p.value === saved.baseUrl);
      if (!isPreset) setCustomEnv(true);
    }
    setRunLog(saved.runLog ?? "");
    setSavedAt(saved.savedAt);
    setHasRun(true);
    const found = new Set(saved.rows.map((r: InsuranceRow) => r.insurer).filter(Boolean));
    setShownInsurers(found.size ? found : new Set(ALL_INSURERS));
  }, []);

  function handleClearResults() {
    clearSaved();
    setRows([]);
    setRunLog("");
    setSavedAt(null);
    setHasRun(false);
    setVehicleInput("");
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

  async function handleRun() {
    if (!vehicles.length) return;
    setLoading(true);
    setError("");
    setRunLog("");
    setRows([]);
    setHasRun(true);
    try {
      const res = await fetch("/api/insurance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicles,
          username:        username.trim()  || undefined,
          password:        password         || undefined,
          icNumber:        icNumber.trim()  || undefined,
          postcode:        postcode.trim()  || undefined,
          vehicleCategory: vehicleCategory,
          baseUrl:         baseUrl          || undefined,
          concurrency:     concurrency,
        }),
      });
      const data = await res.json() as { rows?: InsuranceRow[]; error?: string; log?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      const newRows = data.rows ?? [];
      const now = new Date().toISOString();
      setRows(newRows);
      setSavedAt(now);
      if (data.log) setRunLog(data.log);

      // Persist to localStorage
      saveResults({ rows: newRows, vehicleInput, username, baseUrl, runLog: data.log ?? "", savedAt: now });

      // Auto-expand insurer filter to all found insurers
      const found = new Set(newRows.map(r => r.insurer).filter(Boolean));
      setShownInsurers(found.size ? found : new Set(ALL_INSURERS));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
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
  const foundInsurers  = Array.from(new Set(rows.map(r => r.insurer).filter(Boolean)));

  const [activeTab, setActiveTab] = useState<"check" | "tab2">("check");

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
          Check VN Insurance Stats
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
          Tab 2
        </button>
      </div>

      {activeTab === "tab2" && (
        <div className="flex-1 flex items-center justify-center text-slate-600 text-sm py-24">
          Coming soon
        </div>
      )}

      {activeTab === "check" && <div className="px-4 py-4 sm:px-6 sm:py-5 space-y-4 sm:space-y-5">

        {/* ── Input panel ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">

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

          {/* ── Vehicle numbers ── */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Vehicle Numbers
              <span className="text-slate-600 font-normal ml-1">— one per line or comma-separated</span>
            </label>
            <textarea
              value={vehicleInput}
              onChange={e => setVehicleInput(e.target.value)}
              placeholder={"WXX1234\nABC5678\nXYZ9012"}
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
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
              </p>
            )}
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">
                  IC Number <span className="text-slate-700">default: 020406081081</span>
                </label>
                <input
                  value={icNumber}
                  onChange={e => setIcNumber(e.target.value)}
                  placeholder="020406081081"
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
              <p className="text-xs text-slate-500 animate-pulse">
                Checking {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} — please wait (est. {estimateTime(vehicles.length, concurrency)})…
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
                    <td className="px-3 py-2 text-slate-400 whitespace-nowrap">{row.coverType || "—"}</td>
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
                    <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[130px]">Vehicle</th>
                    {matrixInsurers.map(ins => (
                      <th key={ins} className="px-4 py-2.5 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">{ins}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrixVehicles.map(vn => (
                    <tr key={vn} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                      <td className="px-4 py-2.5 font-mono font-bold text-slate-200">{vn}</td>
                      {matrixInsurers.map(ins => {
                        const val = matrix.get(vn)?.get(ins) ?? "";
                        return (
                          <td key={ins} className="px-4 py-2.5 text-center">
                            {val ? <AllowBadge value={val} /> : <span className="text-slate-700">—</span>}
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
                const vRows = afterSearch.filter(r => r.vehicleNumber.toUpperCase() === vn);
                const first = vRows[0];
                if (!first) return null;
                return (
                  <div key={vn} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                    <div className="flex items-start justify-between flex-wrap gap-3 mb-3">
                      <div>
                        <p className="font-mono font-bold text-slate-100 text-sm">{vn}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {[first.make, first.model, first.variant].filter(Boolean).join(" · ")}
                          {first.mfgYear && <span className="ml-2 text-slate-500">({first.mfgYear})</span>}
                        </p>
                      </div>
                      <div className="flex gap-4 text-xs text-slate-500">
                        {first.engineCC    && <span><span className="text-slate-400">CC</span> {first.engineCC}</span>}
                        {first.transmission && <span><span className="text-slate-400">Trans</span> {first.transmission}</span>}
                      </div>
                    </div>
                    <table className="text-xs border-collapse w-full">
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
                            <td className="py-1.5 pr-4 text-blue-300 font-medium">{r.insurer || "—"}</td>
                            <td className="py-1.5 pr-4 text-slate-400">{r.coverType || "—"}</td>
                            <td className="py-1.5 pr-4"><AllowBadge value={r.allowPurchase} /></td>
                            <td className="py-1.5 pr-4 text-slate-400">{r.referRiskCode || "—"}</td>
                            <td className="py-1.5 text-right text-slate-200 font-medium">{r.totalPrice || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
