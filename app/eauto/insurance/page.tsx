"use client";
import { useState } from "react";
import {
  Shield, Play, Download, Loader2,
  TableProperties, LayoutGrid, AlertCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import clsx from "clsx";

// ── Types ─────────────────────────────────────────────────────
const INSURERS = ["Zurich", "Takaful", "Lonpac", "Chubb", "Tokio Marine"] as const;
type Insurer = (typeof INSURERS)[number];

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

type ViewMode = "table" | "matrix";

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
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-900/60 text-green-300 border border-green-800">Yes</span>;
  if (["no", "n", "false", "0"].includes(v))
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-900/60 text-red-300 border border-red-800">No</span>;
  if (v.startsWith("refer"))
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-900/60 text-yellow-300 border border-yellow-800">{value}</span>;
  return <span className="text-slate-400 text-[11px]">{value || "—"}</span>;
}

// ── Main page ─────────────────────────────────────────────────
export default function InsurancePage() {
  const [vehicleInput, setVehicleInput]   = useState("");
  const [selectedInsurers, setSelectedInsurers] = useState<Set<Insurer>>(new Set(INSURERS));
  const [rows, setRows]                   = useState<InsuranceRow[]>([]);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState("");
  const [view, setView]                   = useState<ViewMode>("table");
  const [hasRun, setHasRun]               = useState(false);

  const vehicles = parseVehicles(vehicleInput);

  function toggleInsurer(ins: Insurer) {
    setSelectedInsurers(prev => {
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
    setRows([]);
    setHasRun(true);
    try {
      const res = await fetch("/api/insurance/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vehicles, insurers: Array.from(selectedInsurers) }),
      });
      const data = await res.json() as { rows?: InsuranceRow[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setRows(data.rows ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const matrix         = buildMatrix(rows);
  const matrixVehicles = Array.from(matrix.keys());
  const matrixInsurers = Array.from(new Set(rows.map(r => r.insurer).filter(Boolean)));

  return (
    <div className="flex flex-col min-h-full">

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">eAuto</span>
          <span className="text-slate-700">/</span>
          <Shield size={14} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">Insurance</h1>
        </div>
        {rows.length > 0 && (
          <div className="flex items-center gap-2">
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
            <button onClick={() => exportToExcel(rows)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors">
              <Download size={12} /> Export Excel
            </button>
          </div>
        )}
      </header>

      <div className="px-6 py-5 space-y-5">

        {/* ── Input panel ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">

          {/* Vehicle numbers */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Vehicle Numbers
              <span className="text-slate-600 font-normal ml-1">— one per line, or comma-separated</span>
            </label>
            <textarea
              value={vehicleInput}
              onChange={e => setVehicleInput(e.target.value)}
              placeholder={"WXX1234\nABC5678\nXYZ9012"}
              rows={4}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
            {vehicles.length > 0 && (
              <p className="text-xs text-slate-600 mt-1">{vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} detected</p>
            )}
          </div>

          {/* Insurer filter */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">
              Insurers to check
              <span className="text-slate-600 font-normal ml-1">— deselect to skip</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {INSURERS.map(ins => {
                const active = selectedInsurers.has(ins);
                return (
                  <button key={ins} onClick={() => toggleInsurer(ins)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-all",
                      active
                        ? "bg-blue-600/20 border-blue-600/50 text-blue-300"
                        : "bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300"
                    )}>
                    {ins}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Run button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRun}
              disabled={loading || vehicles.length === 0}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
              {loading ? "Running…" : "Run Check"}
            </button>
            {loading && (
              <p className="text-xs text-slate-500 animate-pulse">
                Checking {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""} — this may take a few minutes…
              </p>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-3 bg-red-950/50 border border-red-800 rounded-xl p-4 text-red-400 text-sm">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Error running script</p>
              <p className="text-xs text-red-500 font-mono whitespace-pre-wrap">{error}</p>
              {error.includes("INSURANCE_SCRIPT_PATH") && (
                <p className="text-xs text-red-400 mt-2">
                  Create a <code className="bg-red-900/40 px-1 rounded">.env.local</code> file in your project root and add:<br />
                  <code className="bg-red-900/40 px-1 rounded">INSURANCE_SCRIPT_PATH=C:/path/to/your/check_insurance.js</code>
                </p>
              )}
            </div>
          </div>
        )}

        {/* No results after run */}
        {hasRun && !loading && !error && rows.length === 0 && (
          <div className="text-center py-12 text-slate-600">
            <Shield size={28} className="mx-auto mb-2 opacity-40" />
            <p className="text-sm">Script ran but returned no rows.</p>
            <p className="text-xs mt-1">Check that your script prints CSV/TSV with a header row to stdout.</p>
          </div>
        )}

        {/* ── Table view ── */}
        {rows.length > 0 && view === "table" && (
          <div className="overflow-x-auto rounded-2xl border border-slate-800">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900">
                  {COLUMNS.map(col => (
                    <th key={col.key} className="px-3 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
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
            <div className="px-4 py-2 bg-slate-900/60 border-t border-slate-800">
              <p className="text-xs text-slate-600">{rows.length} row{rows.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
        )}

        {/* ── Matrix view ── */}
        {rows.length > 0 && view === "matrix" && (
          <div className="space-y-6">
            {/* Eligibility grid */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="text-xs border-collapse w-full">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900">
                    <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[130px]">Vehicle</th>
                    {matrixInsurers.map(ins => (
                      <th key={ins} className="px-4 py-2.5 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">{ins}</th>
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

            {/* Per-vehicle breakdown */}
            <div className="space-y-3">
              <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Vehicle Details</p>
              {matrixVehicles.map(vn => {
                const vRows = rows.filter(r => r.vehicleNumber.toUpperCase() === vn);
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
                          <th className="pb-1.5 text-left text-[11px] text-slate-500 font-semibold pr-4">Insurer</th>
                          <th className="pb-1.5 text-left text-[11px] text-slate-500 font-semibold pr-4">Cover Type</th>
                          <th className="pb-1.5 text-left text-[11px] text-slate-500 font-semibold pr-4">Allow Purchase</th>
                          <th className="pb-1.5 text-left text-[11px] text-slate-500 font-semibold pr-4">Refer Risk Code</th>
                          <th className="pb-1.5 text-right text-[11px] text-slate-500 font-semibold">Total Price</th>
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
      </div>
    </div>
  );
}
