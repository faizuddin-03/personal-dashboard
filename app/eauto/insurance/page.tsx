"use client";
import { useState, useRef, useCallback } from "react";
import { Shield, Download, Plus, Trash2, ClipboardPaste, TableProperties, LayoutGrid, X } from "lucide-react";
import * as XLSX from "xlsx";
import clsx from "clsx";

// ── Types ────────────────────────────────────────────────────
const INSURERS = ["Zurich", "Takaful", "Lonpac", "Chubb", "Tokio Marine"] as const;
type Insurer = (typeof INSURERS)[number];

interface InsuranceRow {
  vehicleNumber: string;
  make: string;
  model: string;
  mfgYear: string;
  engineCC: string;
  transmission: string;
  variant: string;
  insurer: Insurer | string;
  coverType: string;
  allowPurchase: string;
  referRiskCode: string;
  totalPrice: string;
}

type ViewMode = "table" | "matrix";

const COLUMNS: { key: keyof InsuranceRow; label: string; width?: string }[] = [
  { key: "vehicleNumber",  label: "Vehicle No.",   width: "min-w-[110px]" },
  { key: "make",           label: "Make",          width: "min-w-[80px]"  },
  { key: "model",          label: "Model",         width: "min-w-[100px]" },
  { key: "mfgYear",        label: "Mfg Year",      width: "min-w-[80px]"  },
  { key: "engineCC",       label: "Engine CC",     width: "min-w-[80px]"  },
  { key: "transmission",   label: "Trans.",        width: "min-w-[80px]"  },
  { key: "variant",        label: "Variant",       width: "min-w-[100px]" },
  { key: "insurer",        label: "Insurer",       width: "min-w-[100px]" },
  { key: "coverType",      label: "Cover Type",    width: "min-w-[90px]"  },
  { key: "allowPurchase",  label: "Allow Purchase",width: "min-w-[110px]" },
  { key: "referRiskCode",  label: "Refer Risk",    width: "min-w-[90px]"  },
  { key: "totalPrice",     label: "Total Price",   width: "min-w-[100px]" },
];

const EMPTY_ROW: InsuranceRow = {
  vehicleNumber: "", make: "", model: "", mfgYear: "",
  engineCC: "", transmission: "", variant: "", insurer: "",
  coverType: "", allowPurchase: "", referRiskCode: "", totalPrice: "",
};

// ── Paste parser ─────────────────────────────────────────────
// Accepts TSV (tab-separated) or CSV pasted from Excel / automation output.
// First row is treated as header; columns matched by name (case-insensitive).
const HEADER_ALIASES: Record<keyof InsuranceRow, string[]> = {
  vehicleNumber:  ["vehicle number", "vehicle no", "vehicle no.", "plate", "reg no", "registration"],
  make:           ["make"],
  model:          ["model"],
  mfgYear:        ["mfg year", "year", "manufacture year", "manufacturing year"],
  engineCC:       ["engine cc", "cc", "engine"],
  transmission:   ["transmission", "trans", "gearbox"],
  variant:        ["variant"],
  insurer:        ["insurer", "insurance", "insurance company"],
  coverType:      ["cover type", "coverage", "cover"],
  allowPurchase:  ["allow purchase", "allow", "eligible", "purchasable"],
  referRiskCode:  ["refer risk code", "refer risk", "risk code", "risk"],
  totalPrice:     ["total price", "price", "premium", "total"],
};

function matchHeader(raw: string): keyof InsuranceRow | null {
  const norm = raw.trim().toLowerCase();
  for (const [field, aliases] of Object.entries(HEADER_ALIASES) as [keyof InsuranceRow, string[]][]) {
    if (aliases.includes(norm)) return field;
  }
  return null;
}

function parsePaste(text: string): InsuranceRow[] {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];

  const sep = lines[0].includes("\t") ? "\t" : ",";
  const headers = lines[0].split(sep).map(h => h.trim().replace(/^"|"$/g, ""));
  const fieldMap = headers.map(matchHeader);

  return lines.slice(1).map(line => {
    const cells = line.split(sep).map(c => c.trim().replace(/^"|"$/g, ""));
    const row: InsuranceRow = { ...EMPTY_ROW };
    fieldMap.forEach((field, i) => {
      if (field) row[field] = cells[i] ?? "";
    });
    return row;
  });
}

// ── Excel export ─────────────────────────────────────────────
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
  XLSX.writeFile(wb, `insurance_results_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

// ── Matrix view helpers ───────────────────────────────────────
function buildMatrix(rows: InsuranceRow[]): Map<string, Map<string, string>> {
  const map = new Map<string, Map<string, string>>();
  for (const r of rows) {
    const vn = r.vehicleNumber.toUpperCase();
    if (!map.has(vn)) map.set(vn, new Map());
    if (r.insurer) {
      map.get(vn)!.set(r.insurer, r.allowPurchase);
    }
  }
  return map;
}

// ── Sub-components ───────────────────────────────────────────
function AllowBadge({ value }: { value: string }) {
  const v = value.trim().toLowerCase();
  if (v === "yes" || v === "y" || v === "true" || v === "1") {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-900/60 text-green-300 border border-green-800">Yes</span>;
  }
  if (v === "no" || v === "n" || v === "false" || v === "0") {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-900/60 text-red-300 border border-red-800">No</span>;
  }
  if (v === "refer" || v === "refer risk" || v.startsWith("refer")) {
    return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-yellow-900/60 text-yellow-300 border border-yellow-800">{value}</span>;
  }
  return <span className="text-slate-400 text-[11px]">{value || "—"}</span>;
}

// ── Main page ─────────────────────────────────────────────────
export default function InsurancePage() {
  const [rows, setRows]             = useState<InsuranceRow[]>([]);
  const [view, setView]             = useState<ViewMode>("table");
  const [pasteText, setPasteText]   = useState("");
  const [pasteError, setPasteError] = useState("");
  const [showPaste, setShowPaste]   = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const pasteRef = useRef<HTMLTextAreaElement>(null);

  // ── Paste handler ──
  const handleParse = useCallback(() => {
    if (!pasteText.trim()) { setPasteError("Nothing to parse."); return; }
    const parsed = parsePaste(pasteText);
    if (!parsed.length) { setPasteError("Could not parse rows — make sure the first row is a header."); return; }
    setRows(prev => [...prev, ...parsed]);
    setPasteText("");
    setPasteError("");
    setShowPaste(false);
  }, [pasteText]);

  // ── Manual row add ──
  const addRow = () => setRows(prev => [...prev, { ...EMPTY_ROW }]);

  const updateCell = (idx: number, field: keyof InsuranceRow, val: string) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));
  };

  const deleteRow = (idx: number) => {
    setRows(prev => prev.filter((_, i) => i !== idx));
    if (editingIdx === idx) setEditingIdx(null);
  };

  const clearAll = () => { setRows([]); setEditingIdx(null); };

  const matrix = buildMatrix(rows);
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
          {rows.length > 0 && (
            <span className="ml-1 px-2 py-0.5 text-[11px] bg-slate-800 border border-slate-700 rounded-full text-slate-400">
              {rows.length} row{rows.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {rows.length > 0 && (
            <>
              {/* View toggle */}
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  onClick={() => setView("table")}
                  className={clsx("p-1.5 rounded text-xs transition-colors flex items-center gap-1.5",
                    view === "table" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}
                  title="Table view"
                >
                  <TableProperties size={13} /> <span className="hidden sm:inline text-xs">Table</span>
                </button>
                <button
                  onClick={() => setView("matrix")}
                  className={clsx("p-1.5 rounded text-xs transition-colors flex items-center gap-1.5",
                    view === "matrix" ? "bg-slate-700 text-slate-100" : "text-slate-500 hover:text-slate-300")}
                  title="Matrix view"
                >
                  <LayoutGrid size={13} /> <span className="hidden sm:inline text-xs">Matrix</span>
                </button>
              </div>
              <button
                onClick={() => exportToExcel(rows)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                <Download size={13} /> Export Excel
              </button>
              <button
                onClick={clearAll}
                className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Clear all rows"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          <button
            onClick={() => { setShowPaste(true); setTimeout(() => pasteRef.current?.focus(), 50); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            <ClipboardPaste size={13} /> Paste Results
          </button>
          <button
            onClick={addRow}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
          >
            <Plus size={13} /> Add Row
          </button>
        </div>
      </header>

      {/* Paste modal */}
      {showPaste && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowPaste(false)}>
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Paste Automation Results</h2>
                <p className="text-xs text-slate-500 mt-0.5">Paste TSV or CSV output from your automation. First row must be headers.</p>
              </div>
              <button onClick={() => setShowPaste(false)} className="p-1.5 text-slate-500 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Header mapping hint */}
            <div className="mb-3 p-3 bg-slate-800/60 rounded-xl border border-slate-700 text-[11px] text-slate-500 leading-relaxed">
              <p className="font-medium text-slate-400 mb-1">Recognised column headers</p>
              <div className="grid grid-cols-2 gap-x-4">
                {(Object.entries(HEADER_ALIASES) as [keyof InsuranceRow, string[]][]).map(([field, aliases]) => (
                  <p key={field}><span className="text-slate-300">{COLUMNS.find(c => c.key === field)?.label}</span> — {aliases.join(", ")}</p>
                ))}
              </div>
            </div>

            <textarea
              ref={pasteRef}
              value={pasteText}
              onChange={e => { setPasteText(e.target.value); setPasteError(""); }}
              placeholder={"Vehicle Number\tMake\tModel\t...\nWXX1234\tToyota\tVios\t..."}
              rows={10}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 resize-none"
            />
            {pasteError && <p className="text-red-400 text-xs mt-1">{pasteError}</p>}
            <div className="flex items-center justify-end gap-2 mt-3">
              <button onClick={() => setShowPaste(false)} className="px-4 py-1.5 text-sm text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors">Cancel</button>
              <button onClick={handleParse} className="px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">Parse & Add</button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {rows.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
            <Shield size={24} className="text-slate-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-300 mb-2">No results yet</h2>
          <p className="text-sm text-slate-600 max-w-xs mb-6">
            Paste TSV/CSV output from your automation tool, or add rows manually.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setShowPaste(true); setTimeout(() => pasteRef.current?.focus(), 50); }}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
            >
              <ClipboardPaste size={14} /> Paste Results
            </button>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors"
            >
              <Plus size={14} /> Add Row Manually
            </button>
          </div>
        </div>
      )}

      {/* ── Table view ── */}
      {rows.length > 0 && view === "table" && (
        <div className="flex-1 overflow-x-auto px-6 py-5">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800">
                {COLUMNS.map(col => (
                  <th key={col.key} className={clsx("px-3 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap", col.width)}>
                    {col.label}
                  </th>
                ))}
                <th className="px-3 py-2 w-8" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={clsx("border-b border-slate-800/60 group hover:bg-slate-900/40 transition-colors cursor-pointer",
                    editingIdx === idx && "bg-slate-900/60")}
                  onClick={() => setEditingIdx(editingIdx === idx ? null : idx)}
                >
                  {COLUMNS.map(col => (
                    <td key={col.key} className={clsx("px-3 py-2 whitespace-nowrap", col.width)}>
                      {editingIdx === idx ? (
                        <input
                          value={row[col.key]}
                          onChange={e => updateCell(idx, col.key, e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full bg-slate-800 border border-slate-600 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      ) : col.key === "allowPurchase" ? (
                        <AllowBadge value={row[col.key]} />
                      ) : col.key === "totalPrice" && row[col.key] ? (
                        <span className="text-slate-200 font-medium">{row[col.key]}</span>
                      ) : col.key === "vehicleNumber" ? (
                        <span className="font-mono font-bold text-slate-200">{row[col.key] || <span className="text-slate-600">—</span>}</span>
                      ) : col.key === "insurer" ? (
                        <span className="text-blue-300">{row[col.key] || <span className="text-slate-600">—</span>}</span>
                      ) : (
                        <span className="text-slate-400">{row[col.key] || <span className="text-slate-600">—</span>}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2">
                    <button
                      onClick={e => { e.stopPropagation(); deleteRow(idx); }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-red-400 rounded transition-all"
                      title="Delete row"
                    >
                      <X size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-slate-600 mt-3">Click a row to edit. Hover to delete.</p>
        </div>
      )}

      {/* ── Matrix view ── */}
      {rows.length > 0 && view === "matrix" && (
        <div className="flex-1 overflow-x-auto px-6 py-5">
          <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold mb-3">Eligibility Matrix — Allow Purchase</p>
          {matrixVehicles.length === 0 ? (
            <p className="text-sm text-slate-500">No vehicle numbers found in the data.</p>
          ) : (
            <table className="text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-2 text-left text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[120px]">Vehicle</th>
                  {matrixInsurers.map(ins => (
                    <th key={ins} className="px-4 py-2 text-center text-[11px] font-semibold text-slate-500 uppercase tracking-wider min-w-[110px]">{ins}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrixVehicles.map(vn => (
                  <tr key={vn} className="border-b border-slate-800/60 hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-2 font-mono font-bold text-slate-200">{vn}</td>
                    {matrixInsurers.map(ins => {
                      const val = matrix.get(vn)?.get(ins) ?? "";
                      return (
                        <td key={ins} className="px-4 py-2 text-center">
                          {val ? <AllowBadge value={val} /> : <span className="text-slate-700 text-xs">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Vehicle detail cards below matrix */}
          <div className="mt-8 space-y-4">
            <p className="text-xs text-slate-600 uppercase tracking-wider font-semibold">Vehicle Details</p>
            {matrixVehicles.map(vn => {
              const vehicleRows = rows.filter(r => r.vehicleNumber.toUpperCase() === vn);
              const first = vehicleRows[0];
              if (!first) return null;
              return (
                <div key={vn} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                    <div>
                      <p className="font-mono font-bold text-slate-100 text-base">{vn}</p>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {[first.make, first.model, first.variant].filter(Boolean).join(" · ")}
                        {first.mfgYear && <span className="ml-2 text-slate-500">({first.mfgYear})</span>}
                      </p>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500">
                      {first.engineCC && <span><span className="text-slate-400 font-medium">CC</span> {first.engineCC}</span>}
                      {first.transmission && <span><span className="text-slate-400 font-medium">Trans</span> {first.transmission}</span>}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-xs border-collapse w-full">
                      <thead>
                        <tr className="border-b border-slate-800">
                          <th className="px-3 py-1.5 text-left text-[11px] text-slate-500 font-semibold">Insurer</th>
                          <th className="px-3 py-1.5 text-left text-[11px] text-slate-500 font-semibold">Cover Type</th>
                          <th className="px-3 py-1.5 text-left text-[11px] text-slate-500 font-semibold">Allow Purchase</th>
                          <th className="px-3 py-1.5 text-left text-[11px] text-slate-500 font-semibold">Refer Risk Code</th>
                          <th className="px-3 py-1.5 text-right text-[11px] text-slate-500 font-semibold">Total Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vehicleRows.map((r, i) => (
                          <tr key={i} className="border-b border-slate-800/40">
                            <td className="px-3 py-1.5 text-blue-300 font-medium">{r.insurer || "—"}</td>
                            <td className="px-3 py-1.5 text-slate-400">{r.coverType || "—"}</td>
                            <td className="px-3 py-1.5"><AllowBadge value={r.allowPurchase} /></td>
                            <td className="px-3 py-1.5 text-slate-400">{r.referRiskCode || "—"}</td>
                            <td className="px-3 py-1.5 text-right text-slate-200 font-medium">{r.totalPrice || "—"}</td>
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
  );
}
