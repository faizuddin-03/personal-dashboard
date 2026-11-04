"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { UploadCloud, FileSpreadsheet, AlertCircle, X } from "lucide-react";
import clsx from "clsx";
import { readVehicleSheet, sheetToLines, type SheetRow, type SheetOwner } from "@/lib/vehicleSheet";

/**
 * Drop zone for an eSTM export (.xlsx / .csv). Fills the vehicle box with
 * "VEHICLE⇥ID" lines for the current owner type and refills it when the owner
 * type changes (private = Buyer ID / IC, company = Company ROC).
 */
export default function VehicleSheetDrop({ owner, disabled, onLines }: {
  owner: SheetOwner;
  disabled?: boolean;
  onLines: (text: string) => void;
}) {
  const [file, setFile] = useState<{ name: string; rows: SheetRow[] } | null>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const onLinesRef = useRef(onLines);
  useEffect(() => { onLinesRef.current = onLines; });

  const result = useMemo(() => (file ? sheetToLines(file.rows, owner) : null), [file, owner]);
  // Refill on a new file or an owner switch only — typing in the box afterwards is kept.
  useEffect(() => { if (result) onLinesRef.current(result.lines.join("\n")); }, [result]);

  async function load(f: File | undefined) {
    if (!f || disabled) return;
    try { setFile({ name: f.name, rows: await readVehicleSheet(f) }); setError(""); }
    catch (e) { setFile(null); setError(`${f.name}: ${e instanceof Error ? e.message : "could not read the file"}`); }
  }

  const s = result?.skipped;
  const left = s ? s.scientific + s.noIc + s.noRoc : 0;

  return (
    <div className="space-y-1.5 mb-2">
      <label
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); void load(e.dataTransfer.files?.[0]); }}
        className={clsx("flex items-center gap-3 rounded-xl border border-dashed px-3 py-2.5 transition-colors",
          disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
          dragOver ? "border-blue-500 bg-blue-950/30" : "border-slate-700 hover:border-slate-500")}>
        <UploadCloud size={16} className="shrink-0 text-slate-500" />
        <span className="text-xs text-slate-400">
          Drop the Excel (.xlsx / .csv) here, or click to choose. Reads <b className="text-slate-300">Vehicle</b>,{" "}
          <b className="text-slate-300">Company ROC</b> and <b className="text-slate-300">Buyer ID</b>: private uses the IC, company uses the Company ROC.
        </span>
        <input type="file" accept=".xlsx,.csv" className="hidden" disabled={disabled}
          onChange={e => { void load(e.target.files?.[0]); e.target.value = ""; }} />
      </label>
      {file && result && (
        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
          <FileSpreadsheet size={12} /> {file.name}: {result.lines.length} of {file.rows.length} row(s) used for {owner}. Switching the owner type refills the list.
          <button type="button" className="ml-1 text-slate-500 hover:text-slate-300" aria-label="Forget file" title="Forget file" onClick={() => setFile(null)}><X size={12} /></button>
        </p>
      )}
      {s && left > 0 && (
        <p className="text-xs text-amber-400 flex items-start gap-1.5">
          <AlertCircle size={12} className="mt-0.5 shrink-0" />
          <span>
            Left out:
            {s.scientific > 0 && <> {s.scientific} with a Buyer ID Excel turned into a number like 9.10825E+11 (digits lost in the .csv; drop the .xlsx instead, or format the column as Text before saving).</>}
            {s.noIc > 0 && <> {s.noIc} whose Buyer ID is not an IC.</>}
            {s.noRoc > 0 && <> {s.noRoc} with no Company ROC.</>}
          </span>
        </p>
      )}
      {error && <p className="text-xs text-rose-400 flex items-center gap-1.5"><AlertCircle size={12} /> {error}</p>}
    </div>
  );
}
