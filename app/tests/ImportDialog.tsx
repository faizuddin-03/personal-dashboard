"use client";
import { useRef, useState } from "react";
import { X, Upload, Loader2, FileSpreadsheet, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";
import type { CREntry, ImportPreview } from "@/lib/tsTrackerModel";
import { StatusText } from "./ui";

/**
 * "Import TS from Excel": pick or drop a TS workbook, see what it holds, then
 * apply. Parsing runs server-side (app/api/ts-tracker/import); applying is the
 * caller's mergeImport() on localStorage.
 */
export function ImportDialog({ existing, onApply, onClose }: {
  existing: CREntry[];
  onApply: (preview: ImportPreview) => void;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(""); setPreview(null);
    if (!/\.xlsx$/i.test(file.name)) { setError("Choose an .xlsx workbook."); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/ts-tracker/import", { method: "POST", body: fd });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? `Import failed (HTTP ${r.status})`);
      setPreview(d as ImportPreview);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed.");
    } finally { setBusy(false); }
  }

  const total = preview?.crs.reduce((n, cr) => n + cr.suites.reduce((m, s) => m + s.cases.length, 0), 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-3 overflow-y-auto" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Import TS from Excel"
        className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl my-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-4 h-12 border-b border-slate-800">
          <FileSpreadsheet size={15} className="text-blue-400" />
          <p className="text-sm font-semibold text-slate-200">Import TS from Excel</p>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300" aria-label="Close"><X size={15} /></button>
        </div>

        <div className="p-4 space-y-4">
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
            onClick={() => inputRef.current?.click()}
            className={clsx("flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 cursor-pointer transition-colors text-center",
              dragOver ? "border-blue-500 bg-blue-950/30" : "border-slate-700 hover:border-slate-500 bg-slate-950/40")}>
            {busy ? <Loader2 size={20} className="animate-spin text-blue-400" /> : <Upload size={20} className="text-slate-500" />}
            <p className="text-sm text-slate-300">{busy ? "Reading workbook…" : "Drop the TS workbook here, or click to choose"}</p>
            <p className="text-xs text-slate-600">.xlsx with a &quot;TS No.&quot; header row. Only TS numbers, objectives and status are read — no steps.</p>
            <input ref={inputRef} type="file" accept=".xlsx" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
          </div>

          {error && <p className="text-xs text-red-400 flex items-center gap-1.5"><AlertTriangle size={12} />{error}</p>}

          {preview && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400">
                <span className="text-slate-200 font-medium">{preview.filename}</span> · {preview.sheets.length} sheet{preview.sheets.length === 1 ? "" : "s"} ({preview.sheets.join(", ") || "none"}) · <span className="text-slate-200">{total} TS</span> in {preview.crs.length} CR{preview.crs.length === 1 ? "" : "s"}
              </p>
              {preview.warnings.map(w => (
                <p key={w} className="text-xs text-amber-400 flex items-start gap-1.5"><AlertTriangle size={12} className="mt-0.5 shrink-0" />{w}</p>
              ))}
              {preview.crs.map(cr => {
                const exists = existing.some(e => e.crKey.toUpperCase() === cr.crKey.toUpperCase());
                const n = cr.suites.reduce((m, s) => m + s.cases.length, 0);
                return (
                  <div key={cr.crKey} className="rounded-xl border border-slate-800 bg-slate-950/40">
                    <div className="px-3 py-2.5 border-b border-slate-800">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-blue-400">{cr.crKey}</span>
                        <span className={clsx("text-[10px] px-1.5 py-px rounded border",
                          exists ? "border-amber-800 text-amber-300 bg-amber-950/40" : "border-green-800 text-green-300 bg-green-950/40")}>
                          {exists ? "Merge into existing" : "New CR"}
                        </span>
                        <span className="text-xs text-slate-500 ml-auto">{n} TS · {cr.suites.length} section{cr.suites.length === 1 ? "" : "s"}</span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 line-clamp-2">{cr.crSummary}</p>
                    </div>
                    {cr.suites.map(s => {
                      const k = `${cr.crKey}::${s.title}`;
                      const isOpen = open[k] ?? false;
                      return (
                        <div key={k} className="border-b border-slate-800/60 last:border-0">
                          <button onClick={() => setOpen(p => ({ ...p, [k]: !isOpen }))}
                            className="w-full flex items-center gap-1.5 px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800/40">
                            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            <span className="flex-1 min-w-0 truncate">{s.title}</span>
                            <span className="text-slate-500 shrink-0">{s.cases.length} TS</span>
                          </button>
                          {isOpen && (
                            <ul className="px-3 pb-2 space-y-1">
                              {s.cases.map(c => (
                                <li key={c.tsNumber} className="flex items-start gap-2 text-xs">
                                  <span className="font-mono text-slate-400 w-28 shrink-0">{c.tsNumber}</span>
                                  <span className="flex-1 min-w-0 text-slate-300">{c.objective || <span className="text-slate-600">No objective</span>}</span>
                                  {c.status && <span className="shrink-0"><StatusText status={c.status} /></span>}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              <p className="text-xs text-slate-500">
                Existing TS keep their status, date tested and log; only missing TS are added and objectives refreshed.
                A status in the workbook is used only for newly added TS.
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-800">
          <button onClick={onClose} className="px-3 py-1.5 text-xs border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800">Cancel</button>
          <button disabled={!preview || total === 0} onClick={() => preview && onApply(preview)}
            className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed">
            Import {total ? `${total} TS` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
