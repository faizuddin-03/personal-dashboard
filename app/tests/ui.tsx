"use client";
import { CheckCircle2, Timer, XCircle, Bot } from "lucide-react";
import clsx from "clsx";
import type { CREntry, TestCase, TsLogEntry, TsStatus } from "@/lib/tsTrackerModel";

// ── Formatting ────────────────────────────────────────────

export function fmtWhen(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: false });
}
export function fmtDay(isoOrDate: string): string {
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(isoOrDate) ? isoOrDate + "T12:00:00" : isoOrDate);
  if (isNaN(d.getTime())) return isoOrDate;
  return d.toLocaleDateString("en-MY", { day: "numeric", month: "short", year: "numeric" });
}

/** "Fail → Pass · automation run 12412_TS04" — the part after the time. */
export function describeLog(e: TsLogEntry): string {
  const arrow = e.from !== undefined || e.to !== undefined ? `${e.from || "—"} → ${e.to || "—"}` : "";
  const src = e.source === "manual" ? "manual" : e.source === "import" ? "import" : "automation";
  switch (e.kind) {
    case "created": return ["Created", e.text ?? `(${src})`].join(" · ");
    case "status": return [arrow, e.text ?? src].filter(Boolean).join(" · ");
    case "date": return [`Date tested ${arrow}`, src].join(" · ");
    case "deprioritized": return ["Deprioritized", e.text ?? src].join(" · ");
    case "restored": return ["Restored from deprioritized", e.text ?? src].join(" · ");
    case "imported": return e.text ?? "Imported";
    case "automation": return [arrow, e.text ?? "automation run"].filter(Boolean).join(" · ");
    case "note": return `Note · ${e.text ?? ""}`;
    default: return e.text ?? "";
  }
}

// ── Stats ─────────────────────────────────────────────────

export interface Counts { total: number; pass: number; fail: number; wip: number; notStarted: number; deprio: number }

export function countCases(cases: TestCase[]): Counts {
  const c: Counts = { total: 0, pass: 0, fail: 0, wip: 0, notStarted: 0, deprio: 0 };
  for (const tc of cases) {
    if (tc.disabled) { c.deprio++; continue; }
    c.total++;
    if (tc.status === "pass") c.pass++;
    else if (tc.status === "fail") c.fail++;
    else if (tc.status === "in-progress") c.wip++;
    else c.notStarted++;
  }
  return c;
}
export function countCR(cr: CREntry): Counts {
  return countCases(cr.suites.flatMap(s => s.cases));
}

export function ProgressBar({ c, className }: { c: Counts; className?: string }) {
  const pct = (n: number) => (c.total ? (n / c.total) * 100 : 0);
  return (
    <div className={clsx("h-1.5 rounded-full bg-slate-800 overflow-hidden flex", className)}
      title={`${c.pass} pass · ${c.wip} WIP · ${c.fail} fail · ${c.notStarted} not started`}>
      <div className="h-full bg-green-500" style={{ width: `${pct(c.pass)}%` }} />
      <div className="h-full bg-amber-500" style={{ width: `${pct(c.wip)}%` }} />
      <div className="h-full bg-red-500" style={{ width: `${pct(c.fail)}%` }} />
    </div>
  );
}

export function CountsLine({ c, compact }: { c: Counts; compact?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
      <span className="text-green-400">{c.pass} pass</span>
      <span className="text-amber-400">{c.wip} WIP</span>
      <span className="text-red-400">{c.fail} fail</span>
      <span className="text-slate-500">{c.notStarted} not started</span>
      {!compact && c.deprio > 0 && <span className="text-slate-600">{c.deprio} deprioritized</span>}
    </div>
  );
}

// ── Status control ────────────────────────────────────────

const OPTIONS: { v: Exclude<TsStatus, null>; label: string; icon: typeof CheckCircle2; on: string; hover: string }[] = [
  { v: "pass", label: "Pass", icon: CheckCircle2, on: "bg-green-900/60 text-green-300 border-green-700", hover: "hover:text-green-400" },
  { v: "in-progress", label: "WIP", icon: Timer, on: "bg-amber-900/60 text-amber-300 border-amber-700", hover: "hover:text-amber-400" },
  { v: "fail", label: "Fail", icon: XCircle, on: "bg-red-900/60 text-red-300 border-red-700", hover: "hover:text-red-400" },
];

/** One segmented Pass / WIP / Fail control; clicking the active one clears it. */
export function StatusControl({ status, disabled, onChange }: { status: TsStatus; disabled?: boolean; onChange: (s: TsStatus) => void }) {
  return (
    <div role="group" aria-label="Status" className={clsx("inline-flex rounded-lg border border-slate-700 overflow-hidden shrink-0", disabled && "opacity-40")}>
      {OPTIONS.map((o, i) => {
        const active = status === o.v;
        const Icon = o.icon;
        return (
          <button key={o.v} type="button" disabled={disabled} aria-pressed={active}
            title={active ? `Clear ${o.label}` : `Mark ${o.label}`}
            onClick={e => { e.stopPropagation(); onChange(active ? null : o.v); }}
            className={clsx("flex items-center gap-1 px-2 py-1 text-xs font-medium transition-colors border-transparent",
              i > 0 && "border-l border-l-slate-700",
              active ? o.on : clsx("text-slate-500", !disabled && o.hover),
              disabled && "cursor-not-allowed")}>
            <Icon size={11} />{o.label}
          </button>
        );
      })}
    </div>
  );
}

export function StatusText({ status }: { status: TsStatus }) {
  if (status === "pass") return <span className="inline-flex items-center gap-1 text-xs text-green-400 font-medium"><CheckCircle2 size={11} />Pass</span>;
  if (status === "in-progress") return <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium"><Timer size={11} />WIP</span>;
  if (status === "fail") return <span className="inline-flex items-center gap-1 text-xs text-red-400 font-medium"><XCircle size={11} />Fail</span>;
  return <span className="text-xs text-slate-600">Not started</span>;
}

/** Last automation run on a case, as a small badge. */
export function AutoBadge({ tc }: { tc: TestCase }) {
  const last = tc.runs?.length ? tc.runs[tc.runs.length - 1] : null;
  const at = last?.at ?? tc.autoUpdatedAt;
  if (!at) return null;
  const passed = last ? /^pass/i.test(last.status) : tc.autoNote?.startsWith("Passed");
  return (
    <span title={last ? `${last.label} · ${last.status} · ${last.page}` : tc.autoNote}
      className={clsx("inline-flex items-center gap-1 px-1.5 py-px rounded border text-[10px] whitespace-nowrap",
        passed ? "border-green-900 bg-green-950/40 text-green-300" : "border-red-900 bg-red-950/40 text-red-300")}>
      <Bot size={10} />{passed ? "Passed" : "Failed"} {fmtWhen(at)}
      {tc.runs && tc.runs.length > 1 && <span className="text-slate-500">· {tc.runs.length} runs</span>}
    </span>
  );
}
