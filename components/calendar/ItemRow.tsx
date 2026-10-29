"use client";
import clsx from "clsx";
import { Repeat, Bell } from "lucide-react";
import { CalItem, tint } from "./model";
import { fmtMin } from "./dates";
import { JiraChip } from "./ui";
import { DEPLOYMENT_STATUS_META } from "@/lib/deployments";

/** Time label for an item: "All day", "9am – 10am", or "10pm" for deployments. */
export function timeLabel(it: CalItem, h24: boolean): string {
  if (it.jira) return it.jira.session === "Both" ? "Morning + night session" : it.jira.session ? `${it.jira.session} session` : "Session not set";
  if (it.allDay || it.start === undefined) return it.date !== it.endDate ? "Multi-day" : "All day";
  if (it.source === "deployment") return fmtMin(it.start, h24);
  return `${fmtMin(it.start, h24)} – ${fmtMin(it.end ?? it.start + 60, h24)}`;
}

/** A roomy list row used by the agenda, the phone day list and the sidebar. */
export default function ItemRow({ it, h24, onOpen, dense }: {
  it: CalItem;
  h24: boolean;
  onOpen: (it: CalItem) => void;
  dense?: boolean;
}) {
  const status = it.dep ? DEPLOYMENT_STATUS_META[it.dep.status] : undefined;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(it)}
      onKeyDown={e => { if (e.key === "Enter") onOpen(it); }}
      className={clsx(
        "group w-full text-left flex gap-3 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-900 cursor-pointer",
        "motion-safe:transition-colors",
        dense ? "px-3 py-2" : "px-3.5 py-3",
        it.muted && "opacity-60",
      )}
    >
      <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: it.hex }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={clsx("text-sm font-medium text-slate-200 leading-snug", it.muted && "line-through", dense && "truncate")}>{it.title}</span>
          {it.ev?.recurrence && it.ev.recurrence !== "none" && <Repeat size={11} className="text-slate-500" aria-label="Repeats" />}
          {it.ev?.reminderMin !== undefined && <Bell size={11} className="text-slate-500" aria-label="Reminder" />}
        </div>
        <div className="flex items-center gap-x-2 gap-y-1 flex-wrap mt-0.5 text-xs text-slate-500">
          <span className="tabular-nums">{timeLabel(it, h24)}</span>
          <span className="px-1.5 py-px rounded-md text-[10px] font-semibold uppercase tracking-wide" style={{ background: tint(it.hex, 18), color: "var(--text-secondary, #cbd5e1)" }}>{it.label}</span>
          {it.dep?.fixVersion && <span className="text-[11px] font-semibold text-slate-400">{it.dep.fixVersion}</span>}
          {it.jira && <span className="text-[11px] font-semibold text-slate-400">{it.jira.version}</span>}
          {it.jira?.status && <span>{it.jira.status}</span>}
          {it.dep?.environment && <span>{it.dep.environment}</span>}
          {status && it.dep?.status !== "planned" && <span className={status.color}>{status.label}</span>}
          {it.holiday?.approx && <span className="italic">date may shift</span>}
        </div>
        {!dense && it.jiraKeys.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {it.jiraKeys.slice(0, 8).map(k => <JiraChip key={k} k={k} />)}
            {it.jiraKeys.length > 8 && <span className="text-[11px] text-slate-500">+{it.jiraKeys.length - 8}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
