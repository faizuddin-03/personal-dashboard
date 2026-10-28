"use client";
// Dashboard "Upcoming Deployments" — the same deployment items the Calendar
// shows: Jira release tickets + manual deployments, the Calendar's layer
// toggles, and the global All / My tickets filter (lib/ticketScope.ts). The
// filter is read only here; it is changed on the Calendar page.
import { useMemo } from "react";
import Link from "next/link";
import clsx from "clsx";
import type { JiraCredentials } from "@/lib/jira";
import { useTicketScope } from "@/lib/ticketScope";
import { DEPLOYMENT_STATUS_META } from "@/lib/deployments";
import { buildItems, tint } from "./model";
import { addDays, fmtMin } from "./dates";
import { useDeployments, useLayers, useToday } from "./store";
import { useJiraDeploySync } from "./useJiraDeploySync";

const DAYS_AHEAD = 30;
const MAX_ROWS = 8;

/** Small read-only chip: which scope the deployments follow. */
export function ScopeIndicator() {
  const scope = useTicketScope();
  return (
    <span
      title="Follows the Calendar filter. Change it on the Calendar page."
      className="px-2 py-0.5 rounded-full border border-slate-700 text-[10px] font-semibold uppercase tracking-wide text-slate-400 select-none"
    >
      {scope === "mine" ? "My tickets" : "All tickets"}
    </span>
  );
}

function fmtDay(d: string, today: string): string {
  if (d === today) return "Today";
  if (d === addDays(today, 1)) return "Tomorrow";
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short" });
}

export default function UpcomingDeployments({ creds }: { creds: JiraCredentials | null }) {
  const todayStr = useToday();
  const deployments = useDeployments();
  const layers = useLayers();
  const scope = useTicketScope();
  const { tickets, syncing } = useJiraDeploySync(creds, todayStr);

  const items = useMemo(() => {
    const src = { deployments, events: [], cards: [], todos: [], jiraDeploys: tickets, scope, myAccountId: creds?.accountId };
    const only = { jira: layers.jira, deployments: layers.deployments, events: false, kanban: false, todos: false, holidays: false };
    return buildItems(src, only, todayStr, addDays(todayStr, DAYS_AHEAD))
      .filter(it => !it.muted)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.start ?? -1) - (b.start ?? -1) || a.title.localeCompare(b.title));
  }, [deployments, tickets, scope, creds?.accountId, layers.jira, layers.deployments, todayStr]);

  if (!items.length) {
    return (
      <p className="text-sm text-slate-600 py-4 text-center">
        {syncing ? "Reading Jira releases…" : `No deployments in the next ${DAYS_AHEAD} days${scope === "mine" ? " for your tickets" : ""}`}
      </p>
    );
  }

  const shown = items.slice(0, MAX_ROWS);
  return (
    <div className="space-y-2">
      {shown.map(it => {
        const j = it.jira, d = it.dep;
        const session = j
          ? (j.session === "Both" ? "Morning + Night" : j.session ?? "Session not set")
          : d ? (d.type === "night" ? "Night" : "Morning") : "";
        return (
          <Link
            key={it.key}
            href="/calendar"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl border hover:opacity-90 transition-opacity"
            style={{ background: tint(it.hex, 12), borderColor: tint(it.hex, 40) }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-mono font-bold text-blue-400">{j?.key ?? d?.ticketKey}</span>
                <span className="text-xs font-semibold" style={{ color: it.hex }}>{session}</span>
                {j && <span className="text-[11px] text-slate-500 truncate">{j.version}</span>}
                {d?.environment && <span className="text-[11px] text-slate-500">{d.environment}</span>}
              </div>
              <span className="text-xs font-medium text-slate-300 line-clamp-1">{j ? j.summary : d?.ticketSummary || d?.ticketKey}</span>
            </div>
            <div className="text-right shrink-0 space-y-0.5">
              <p className="text-xs font-semibold text-slate-200">{fmtDay(it.date, todayStr)}</p>
              {j && <p className="text-[11px] text-slate-500">{j.status}</p>}
              {d && it.start !== undefined && <p className="text-[11px] text-slate-500">{fmtMin(it.start, false)}</p>}
              {d && d.status !== "planned" && <p className={clsx("text-[11px] font-medium", DEPLOYMENT_STATUS_META[d.status].color)}>{DEPLOYMENT_STATUS_META[d.status].label}</p>}
            </div>
          </Link>
        );
      })}
      {items.length > shown.length && (
        <Link href="/calendar" className="block text-center text-xs text-slate-500 hover:text-slate-300 pt-1">
          +{items.length - shown.length} more in the Calendar
        </Link>
      )}
    </div>
  );
}
