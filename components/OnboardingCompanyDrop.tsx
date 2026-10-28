"use client";
import { useRef, useState } from "react";
import clsx from "clsx";
import { FileSpreadsheet, Upload, Loader2, ChevronDown, ChevronRight, Undo2 } from "lucide-react";
import { UPDATED_EVENT, release } from "@/lib/onboardingCompanies";
import { usageKey, shortDate, type UsageLedger } from "@/lib/companyUsageLedger";
import { TYPE_LABEL, freeRows, type OnboardingCompanyList, type OnboardingCompany } from "@/lib/onboardingCompanyTypes";

// Drop zone for the shared onboarding company Excel (lib/onboardingCompanies.ts).
// Same list on every onboarding page: dropping it here replaces it everywhere.

export default function OnboardingCompanyDrop({ list, error, isUsed, ledger }: {
  list: OnboardingCompanyList | null;
  error: string;
  isUsed: (r: OnboardingCompany) => boolean;
  /** Spent companies (server + this browser) — shown in the "Used" list. */
  ledger?: UsageLedger;
}) {
  const [showUsed, setShowUsed] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function upload(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/onboarding-companies", { method: "POST", body });
      const d = await res.json();
      if (!res.ok) setMsg(d.error ?? "The file could not be read.");
      else window.dispatchEvent(new Event(UPDATED_EVENT));
    } catch {
      setMsg("The file could not be uploaded.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const has = !!list?.rows.length;
  return (
    <div
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); void upload(e.dataTransfer.files[0]); }}
      className={clsx("rounded-lg border border-dashed px-3 py-2.5 transition-colors", over ? "border-indigo-400 bg-indigo-950/30" : "border-slate-700 bg-slate-900/40")}
    >
      <input ref={input} type="file" accept=".xlsx" className="hidden" onChange={e => void upload(e.target.files?.[0])} />
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <FileSpreadsheet size={16} className={has ? "text-emerald-400" : "text-slate-500"} />
        <div className="min-w-0 flex-1 text-xs">
          {has ? (
            <>
              <span className="font-medium text-slate-200 break-all">{list!.file}</span>
              <span className="text-slate-500"> · dropped {new Date(list!.uploadedAt).toLocaleString()} · {list!.rows.length} companies</span>
              <div className="mt-0.5 flex flex-wrap gap-x-3 text-[11px] text-slate-400">
                {(["ROC", "ROB", "LLP"] as const).map(t => (
                  <span key={t}>{TYPE_LABEL[t]}: <b className={freeRows(list, t, isUsed).length ? "text-emerald-300" : "text-amber-300"}>{freeRows(list, t, isUsed).length} free</b></span>
                ))}
              </div>
            </>
          ) : (
            <span className="text-slate-400">Drop the company Excel (Company Details Checker export, .xlsx) here. Every onboarding page uses the same list.</span>
          )}
        </div>
        <button type="button" onClick={() => input.current?.click()} disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-200 hover:border-indigo-500 disabled:opacity-50">
          {busy ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          {has ? "Replace" : "Choose file"}
        </button>
      </div>
      {(msg || (!has && error && error !== "No company Excel dropped yet.")) && <p className="mt-1.5 text-[11px] text-red-400">{msg || error}</p>}
      {has && ledger && (() => {
        const used = list!.rows.filter(isUsed).map(r => ({ r, e: ledger[usageKey(r)] })).sort((a, b) => (b.e?.usedAt ?? "").localeCompare(a.e?.usedAt ?? ""));
        return (
          <div className="mt-1.5">
            <button type="button" onClick={() => setShowUsed(v => !v)} className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200">
              {showUsed ? <ChevronDown size={12} /> : <ChevronRight size={12} />} Used companies ({used.length})
            </button>
            {showUsed && (
              <div className="mt-1 max-h-56 overflow-y-auto rounded border border-slate-800">
                {used.length ? used.map(({ r, e }) => (
                  <div key={usageKey(r)} className="flex flex-wrap items-center gap-x-3 gap-y-0.5 border-b border-slate-800/60 px-2 py-1 text-[11px] last:border-0">
                    <span className="font-mono text-slate-300">{r.roc} · {r.newRoc}</span>
                    <span className="text-slate-500">{TYPE_LABEL[r.type as keyof typeof TYPE_LABEL] ?? r.type}</span>
                    <span className="text-slate-400">{[e?.scenario || e?.ticket, e?.companyName].filter(Boolean).join(" · ")}</span>
                    <span className="text-slate-600">{e?.usedAt ? shortDate(e.usedAt) : ""}</span>
                    <button type="button" title="Make this company free again (only if eAuto never received it)" onClick={() => release(r)} className="ml-auto inline-flex items-center gap-1 text-slate-500 hover:text-amber-300"><Undo2 size={11} /> Free again</button>
                  </div>
                )) : <p className="px-2 py-1 text-[11px] text-slate-500">None yet.</p>}
              </div>
            )}
          </div>
        );
      })()}
      <p className="mt-1 text-[10px] text-slate-600">Free = Overall PASS and not used by any run yet (tracked on the dashboard server, the same for every browser). The shuffle button on a TS row picks another free company at random. Type comes from the New ROC (01 Sdn Bhd, 03 Sole Prop / Partnership, 04/06 LLP). Business Trading has no SSM number, so its licence is made up automatically on the TS row.</p>
    </div>
  );
}
