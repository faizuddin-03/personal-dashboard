"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Download, Loader2, Film, Image as ImageIcon, FileText, Archive, Trash2, EyeOff, Eye, Bot, History, ExternalLink, StickyNote } from "lucide-react";
import clsx from "clsx";
import type { CREntry, TestCase, TsRun, TsStatus } from "@/lib/tsTrackerModel";
import { StatusControl, describeLog, fmtWhen, fmtDay } from "./ui";

const KIND_ICON = { video: Film, image: ImageIcon, trace: Archive, file: FileText } as const;

function RunCard({ run, index }: { run: TsRun; index: number }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const passed = /^pass/i.test(run.status);

  async function downloadAll() {
    if (!run.download) return;
    setBusy(true); setErr("");
    try {
      const r = await fetch(run.download.url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(run.download.body) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? `Download failed (${r.status})`); }
      const blob = await r.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = href; a.download = run.download.zipName;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(href);
    } catch (e) { setErr(e instanceof Error ? e.message : "Download failed."); }
    finally { setBusy(false); }
  }

  return (
    <li className={clsx("rounded-lg border bg-slate-950/50 p-3", passed ? "border-green-900/70" : "border-red-900/70")}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={clsx("text-[10px] font-semibold uppercase px-1.5 py-px rounded",
          passed ? "bg-green-900/60 text-green-300" : "bg-red-900/60 text-red-300")}>{run.status}</span>
        <span className="text-xs font-mono text-slate-300">{run.label}</span>
        <span className="text-xs text-slate-500">#{index + 1} · {fmtWhen(run.at)}</span>
        <Link href={"/" + run.page.replace(/^\/+/, "")} className="ml-auto text-xs text-blue-400 hover:text-blue-300 inline-flex items-center gap-1">
          {run.page}<ExternalLink size={10} />
        </Link>
      </div>
      {run.evidence.length === 0 ? (
        <p className="text-xs text-slate-600 mt-2">No evidence files returned by this run.</p>
      ) : (
        <>
          <ul className="mt-2 space-y-1">
            {run.evidence.map(e => {
              const Icon = KIND_ICON[e.kind] ?? FileText;
              const name = e.label.split("/").pop() || e.label;
              return (
                <li key={e.url} className="flex items-center gap-2 text-xs min-w-0">
                  <Icon size={12} className="text-slate-500 shrink-0" />
                  <a href={e.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0 truncate text-slate-300 hover:text-blue-300" title={e.label}>{name}</a>
                  <a href={e.url} download={name} className="shrink-0 inline-flex items-center gap-1 text-slate-400 hover:text-blue-300" title="Download">
                    <Download size={11} />Download
                  </a>
                </li>
              );
            })}
          </ul>
          {run.download && (
            <button onClick={downloadAll} disabled={busy}
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-50">
              {busy ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}Download all ({run.evidence.length})
            </button>
          )}
          {err && <p className="text-xs text-red-400 mt-1">{err}</p>}
        </>
      )}
    </li>
  );
}

export function TsDetailDrawer({ cr, suiteTitle, tc, onClose, onStatus, onDate, onToggleDeprio, onNote, onRename, onObjective, onDelete }: {
  cr: CREntry;
  suiteTitle: string;
  tc: TestCase;
  onClose: () => void;
  onStatus: (s: TsStatus) => void;
  onDate: (d: string | null) => void;
  onToggleDeprio: () => void;
  onNote: (text: string) => void;
  onRename: (tsNumber: string) => void;
  onObjective: (objective: string) => void;
  onDelete: () => void;
}) {
  const [note, setNote] = useState("");
  const [tsDraft, setTsDraft] = useState(tc.tsNumber);
  const [objDraft, setObjDraft] = useState(tc.objective ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Drafts reset per case: the page renders this with key={tc.id}.

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const log = [...(tc.log ?? [])].reverse();
  const hasCreated = (tc.log ?? []).some(e => e.kind === "created");
  const logStart = cr.logSince ?? tc.log?.[0]?.at;
  const runs = [...(tc.runs ?? [])].map((r, i) => ({ r, i })).reverse();

  function addNote() {
    const t = note.trim();
    if (!t) return;
    onNote(t.slice(0, 500));
    setNote("");
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <aside role="dialog" aria-label={`${tc.tsNumber} details`} onClick={e => e.stopPropagation()}
        className="relative h-full w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
        <div className="h-14 shrink-0 flex items-center gap-2 px-4 border-b border-slate-800">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-200 font-mono truncate">{tc.tsNumber}</p>
            <p className="text-[11px] text-slate-500 truncate">{cr.crKey} · {suiteTitle}</p>
          </div>
          <button onClick={onClose} className="ml-auto text-slate-500 hover:text-slate-300" aria-label="Close"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Details */}
          <section className="space-y-3">
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">TS No.</span>
              <input value={tsDraft} onChange={e => setTsDraft(e.target.value)}
                onBlur={() => tsDraft.trim() && tsDraft.trim() !== tc.tsNumber ? onRename(tsDraft.trim()) : setTsDraft(tc.tsNumber)}
                onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                className="mt-1 w-full text-xs font-mono bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-600" />
            </label>
            <label className="block">
              <span className="text-[11px] uppercase tracking-wider text-slate-500">Objective</span>
              <textarea value={objDraft} onChange={e => setObjDraft(e.target.value)} rows={3}
                onBlur={() => { if (objDraft.trim() !== (tc.objective ?? "")) onObjective(objDraft.trim()); }}
                placeholder="What this TS verifies"
                className="mt-1 w-full text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y" />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <StatusControl status={tc.status} disabled={tc.disabled} onChange={onStatus} />
              <label className="flex items-center gap-1.5 text-xs text-slate-400">
                Date tested
                <input type="date" value={tc.dateTested ?? ""} disabled={tc.disabled}
                  onChange={e => onDate(e.target.value || null)}
                  className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-slate-200 [color-scheme:dark] focus:outline-none focus:ring-1 focus:ring-blue-600 disabled:opacity-40" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={onToggleDeprio}
                className={clsx("inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border",
                  tc.disabled ? "border-slate-600 bg-slate-800 text-slate-200" : "border-slate-700 text-slate-400 hover:bg-slate-800")}>
                {tc.disabled ? <><Eye size={12} />Restore</> : <><EyeOff size={12} />Deprioritize</>}
              </button>
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg border border-slate-700 text-slate-400 hover:text-red-400 hover:border-red-800">
                  <Trash2 size={12} />Delete TS
                </button>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs">
                  <span className="text-red-400">Delete {tc.tsNumber} and its log?</span>
                  <button onClick={onDelete} className="px-2 py-0.5 bg-red-700 text-white rounded hover:bg-red-600">Yes</button>
                  <button onClick={() => setConfirmDelete(false)} className="px-2 py-0.5 border border-slate-700 text-slate-400 rounded hover:bg-slate-800">No</button>
                </span>
              )}
            </div>
          </section>

          {/* Automation runs */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2"><Bot size={13} className="text-blue-400" />Automation runs <span className="text-slate-500 font-normal">({runs.length})</span></h3>
            {runs.length === 0 ? (
              <p className="text-xs text-slate-600">No automation run has reported this TS yet. Runs from the ticket page appear here with their evidence.</p>
            ) : (
              <ul className="space-y-2">{runs.map(({ r, i }) => <RunCard key={`${r.at}-${i}`} run={r} index={i} />)}</ul>
            )}
          </section>

          {/* Log */}
          <section>
            <h3 className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2"><History size={13} className="text-blue-400" />Log</h3>
            <div className="flex gap-2 mb-3">
              <input value={note} onChange={e => setNote(e.target.value)} maxLength={500}
                onKeyDown={e => { if (e.key === "Enter") addNote(); }}
                placeholder="Add a note, e.g. something happened, retest"
                className="flex-1 min-w-0 text-xs bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-600" />
              <button onClick={addNote} disabled={!note.trim()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-40">
                <StickyNote size={11} />Add
              </button>
            </div>
            <ol className="relative border-l border-slate-800 ml-1.5 space-y-2.5">
              {log.map((e, i) => (
                <li key={`${e.at}-${i}`} className="pl-3 relative">
                  <span className={clsx("absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full",
                    e.kind === "note" ? "bg-blue-400" : e.source === "automation" ? "bg-violet-400" : e.source === "import" ? "bg-slate-500" : "bg-slate-300")} />
                  <p className="text-xs text-slate-300">
                    <span className="text-slate-500 tabular-nums">{fmtWhen(e.at)}</span>
                    <span className="text-slate-600"> · </span>
                    {describeLog(e)}
                  </p>
                </li>
              ))}
              {!hasCreated && (
                <li className="pl-3 relative">
                  <span className="absolute -left-[4.5px] top-1.5 w-2 h-2 rounded-full bg-slate-700" />
                  <p className="text-xs text-slate-500 italic">Log starts {fmtDay(logStart ?? new Date().toISOString())} — earlier history was not recorded.</p>
                </li>
              )}
            </ol>
          </section>
        </div>
      </aside>
    </div>
  );
}
