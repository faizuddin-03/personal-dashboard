"use client";
// "Automation" panel of /pipeline/<KEY> (ticket-automation-panel, 2026-10-28).
// Faizuddin, 2026-10-27: "once the automation is created, the dwarf should
// also build a page for it in the ticket page, for me to track the
// automation, and to run it".
// 1. Tracking strip: per TS the latest status (saved pipeline runs + the
//    official-sheet sync log, voided runs ignored), last run, open findings,
//    and each TS's assertion plan (GET /api/pipeline/automation).
// 2. Pipeline-built suites (lib/pipeline/runnerRegistry.ts): the runner itself,
//    embedded. It uses the same useBackgroundRuns key as /eauto/<n>, so the
//    panel and the standalone page show the same run.
// 3. Automation made outside the pipeline (files.runnerPage, or a known suite in
//    lib/ticketAutomations.ts): the strip plus an "Open runner page" button.
// 4. Nothing yet: a short placeholder.
// Design: scripts/pipeline/README.md §10.
import { useCallback, useEffect, useMemo, useState, type ComponentType } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import clsx from "clsx";
import { ExternalLink, Loader2, Bug, ListChecks, Target, Ban } from "lucide-react";
import { useApp } from "@/components/AppShell";
import { RUNNERS, type RunnerProps } from "@/lib/pipeline/runnerRegistry";
import { TICKET_AUTOMATIONS } from "@/lib/ticketAutomations";
import { PriorityChip } from "@/components/pipeline/SectionedDoc";
import { api, startPolling, when } from "@/components/pipeline/api";

type TrackStatus = "Pass" | "Fail" | "In Progress" | "Skipped";
interface TsTrack { status: TrackStatus; at?: string; source: "run" | "sheet"; runId?: string; runLabel?: string; error?: string }
interface Scenario { id: string; title: string; priority?: string; manual?: boolean; section?: string }
interface PlanEntry {
  ts?: string;
  checks?: { screen?: string; element?: string; expect?: string }[];
  wrongOutcomes?: { outcome?: string; why?: string }[];
}
interface AutomationData {
  scenarios: Scenario[];
  track: Record<string, TsTrack>;
  lastRunAt?: string;
  lastSyncAt?: string;
  runs: number;
  voidedRuns: number;
  assertionPlan: PlanEntry[] | null;
}
export interface PanelRun {
  runId: string;
  runLabel?: string;
  startedAt?: string;
  finishedAt?: string;
  savedAt?: string;
  total?: number;
  failed?: number;
  voided?: { reason?: string } | null;
}

// next/dynamic must be called at module level: one lazy component per registry entry.
const EMBEDS: Record<string, ComponentType<RunnerProps>> = Object.fromEntries(
  Object.entries(RUNNERS).map(([k, r]) => [k, dynamic(r.load, {
    ssr: false,
    loading: () => <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" aria-hidden /> Loading the runner…</p>,
  })]),
);

const STATUS_TONE: Record<TrackStatus | "Not run", string> = {
  Pass: "border-green-500/40 bg-green-500/10 text-green-300",
  Fail: "border-red-500/40 bg-red-500/10 text-red-300",
  "In Progress": "border-blue-500/40 bg-blue-500/10 text-blue-200",
  Skipped: "border-slate-600 bg-slate-800 text-slate-300",
  "Not run": "border-slate-700 bg-slate-900 text-slate-500",
};
const PRIO_ORDER: Record<string, number> = { P1: 1, P2: 2, P3: 3 };

function StatusChip({ s }: { s: TrackStatus | "Not run" }) {
  return <span className={clsx("shrink-0 px-1.5 leading-5 rounded-full border text-[11px]", STATUS_TONE[s])}>{s}</span>;
}

function PlanView({ entry }: { entry?: PlanEntry }) {
  if (!entry) return <p className="text-[11px] text-slate-500">No assertion plan for this TS yet.</p>;
  return (
    <div className="space-y-1.5 text-[11px]">
      {(entry.checks?.length ?? 0) > 0 && (
        <div>
          <p className="text-slate-400">Checks</p>
          <ol className="list-decimal ml-4 space-y-0.5 text-slate-300">
            {entry.checks!.map((c, i) => (
              <li key={i}>{c.screen ? <span className="text-slate-500">{c.screen} → </span> : null}{c.element}: <span className="text-green-300">{c.expect}</span></li>
            ))}
          </ol>
        </div>
      )}
      {(entry.wrongOutcomes?.length ?? 0) > 0 && (
        <div>
          <p className="text-slate-400">Wrong outcomes it must catch</p>
          <ol className="list-decimal ml-4 space-y-0.5 text-slate-300">
            {entry.wrongOutcomes!.map((w, i) => <li key={i}><span className="text-red-300">{w.outcome}</span>{w.why ? <span className="text-slate-500"> — {w.why}</span> : null}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function AutomationPanel({ ticketKey, runnerPage, runKey, runs, openFindings, approved }: {
  ticketKey: string;
  /** files.runnerPage of the ticket (set by Dwarf, or for automation made elsewhere). */
  runnerPage?: string;
  runKey?: string;
  /** Saved runs from GET /api/pipeline/runs (the page already loads them). */
  runs: PanelRun[] | null;
  openFindings: number;
  approved: boolean;
}) {
  const entry = RUNNERS[ticketKey];
  const Embedded = EMBEDS[ticketKey];
  const known = TICKET_AUTOMATIONS.find(a => a.keys.includes(ticketKey));
  const page = entry?.page ?? runnerPage ?? known?.href;
  const mode: "embedded" | "link" | "none" = entry && Embedded ? "embedded" : page ? "link" : "none";
  const liveKey = entry?.runKey ?? runKey;

  const { runs: bgRuns } = useApp();
  const live = liveKey ? bgRuns[liveKey] : undefined;
  const runningNow = !!live?.running;

  const [data, setData] = useState<AutomationData | null>(null);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState<string[] | undefined>(undefined);
  const [openPlan, setOpenPlan] = useState<string | null>(null);

  const load = useCallback(async () => {
    const r = await api<AutomationData>(`/api/pipeline/automation?key=${encodeURIComponent(ticketKey)}`);
    if (r.ok) { setData(r.data); setErr(""); } else setErr(r.error);
  }, [ticketKey]);

  useEffect(() => {
    if (mode === "none") return;
    const first = setTimeout(() => { void load(); }, 0);
    const stop = startPolling(() => { void load(); }, () => (runningNow ? 4000 : 15000));
    return () => { clearTimeout(first); stop(); };
  }, [load, mode, runningNow]);

  const rows = useMemo(() => {
    const list = data?.scenarios ?? [];
    // P1 first, then P2, P3, then no priority; keep TS order inside each group.
    return list.map((s, i) => ({ s, i })).sort((a, b) => (PRIO_ORDER[a.s.priority ?? ""] ?? 9) - (PRIO_ORDER[b.s.priority ?? ""] ?? 9) || a.i - b.i).map(x => x.s);
  }, [data]);
  const planBy = useMemo(() => new Map((data?.assertionPlan ?? []).filter(e => e.ts).map(e => [e.ts!, e])), [data]);

  if (mode === "none") {
    return (
      <p className="text-xs text-slate-500">
        {approved ? "No automation yet. Dwarf builds it after your green light; start Dwarf in the panel above." : "No automation yet. Dwarf builds the automation after your green light."}
      </p>
    );
  }

  const auto = rows.filter(s => !s.manual);
  const statusOf = (id: string): TrackStatus | "Not run" => data?.track[id]?.status ?? "Not run";
  const count = (s: TrackStatus | "Not run") => auto.filter(x => statusOf(x.id) === s).length;
  const p1 = auto.filter(s => s.priority === "P1").map(s => s.id);
  const failedIds = auto.filter(s => statusOf(s.id) === "Fail").map(s => s.id);
  const recent = (runs ?? []).slice(0, 6);

  return (
    <div className="space-y-4">
      {/* Tracking strip */}
      <section aria-label="Automation tracking" className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(["Pass", "Fail", "In Progress", "Not run"] as const).map(s => (
            <span key={s} className="inline-flex items-center gap-1"><StatusChip s={s} /><span className="text-slate-300">{count(s)}</span></span>
          ))}
          <span className="text-slate-500">of {auto.length} automated TS{rows.length > auto.length ? ` (${rows.length - auto.length} manual)` : ""}</span>
          {runningNow && <span className="inline-flex items-center gap-1 text-blue-300"><Loader2 size={12} className="animate-spin" aria-hidden /> Running now</span>}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>Last run: <span className="text-slate-200">{data?.lastRunAt ? when(data.lastRunAt) : "none yet"}</span></span>
          {data?.lastSyncAt && <span>Last sheet update: <span className="text-slate-200">{when(data.lastSyncAt)}</span></span>}
          <span className="inline-flex items-center gap-1"><Bug size={12} className={openFindings ? "text-amber-300" : "text-slate-500"} aria-hidden /> Open findings: <span className={openFindings ? "text-amber-300" : "text-slate-200"}>{openFindings}</span></span>
          {!!data?.voidedRuns && <span className="inline-flex items-center gap-1"><Ban size={12} aria-hidden /> {data.voidedRuns} voided run{data.voidedRuns === 1 ? "" : "s"} ignored</span>}
          {page && (
            <Link href={page} className="ml-auto inline-flex items-center gap-1 text-blue-400 hover:underline">
              <ExternalLink size={12} aria-hidden /> {mode === "embedded" ? "Open full runner page" : "Open runner page"}
            </Link>
          )}
        </div>
        {err && <p className="text-xs text-amber-300">{err}</p>}
        {!data && !err && <p className="flex items-center gap-2 text-xs text-slate-500"><Loader2 size={12} className="animate-spin" aria-hidden /> Loading TS status…</p>}

        {rows.length > 0 && (
          <ol className="space-y-1">
            {rows.map(s => {
              const tr = data?.track[s.id];
              const st = s.manual ? null : statusOf(s.id);
              const planOpen = openPlan === s.id;
              return (
                <li key={s.id} className="rounded border border-slate-800/80 bg-slate-900/50 px-2 py-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {s.priority && <PriorityChip p={s.priority} />}
                    <span className="font-mono text-slate-300">{s.id}</span>
                    <span className="min-w-0 flex-1 text-slate-200 truncate" title={s.title}>{s.title}</span>
                    {s.manual ? <span className="text-[11px] text-slate-500">Manual</span> : st && <StatusChip s={st} />}
                    {tr?.at && <span className="text-[11px] text-slate-500">{when(tr.at)}{tr.source === "sheet" ? " (sheet)" : ""}</span>}
                    {!s.manual && (
                      <button type="button" onClick={() => setOpenPlan(planOpen ? null : s.id)} aria-expanded={planOpen}
                        className="inline-flex items-center gap-1 text-[11px] text-blue-400 hover:underline">
                        <Target size={11} aria-hidden /> {planOpen ? "Hide plan" : "Plan"}
                      </button>
                    )}
                  </div>
                  {tr?.status === "Fail" && tr.error && <p className="mt-1 text-[11px] text-red-300/90 break-words">{tr.error}</p>}
                  {planOpen && <div className="mt-1.5 border-t border-slate-800 pt-1.5"><PlanView entry={planBy.get(s.id)} /></div>}
                </li>
              );
            })}
          </ol>
        )}
        {data && rows.length === 0 && <p className="text-xs text-slate-500">No scenario list yet.</p>}

        {recent.length > 0 && (
          <div>
            <p className="text-[11px] text-slate-500 mb-1">Recent runs (voided runs are grey and do not count)</p>
            <ol className="flex flex-wrap gap-1.5">
              {recent.map(r => {
                const total = r.total ?? 0;
                const failed = r.failed ?? 0;
                return (
                  <li key={r.runId} title={r.voided?.reason ? `Voided: ${r.voided.reason}` : undefined}
                    className={clsx("px-2 leading-6 rounded-full border text-[11px]",
                      r.voided ? "border-slate-700 bg-slate-900 text-slate-500 line-through opacity-60"
                        : failed ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-green-500/40 bg-green-500/10 text-green-300")}>
                    {when(r.finishedAt ?? r.savedAt ?? r.startedAt)} · {total - failed}/{total}
                  </li>
                );
              })}
            </ol>
          </div>
        )}
      </section>

      {/* The runner */}
      {mode === "embedded" ? (
        <section aria-label="Runner" className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <ListChecks size={13} className="text-green-400" aria-hidden />
            <span className="text-slate-300">Pick tests:</span>
            <button type="button" disabled={!p1.length} onClick={() => setPick([...p1])}
              className="px-2 py-1 rounded border border-red-500/40 text-red-200 hover:bg-red-500/10 disabled:opacity-40">P1 tests first ({p1.length})</button>
            <button type="button" disabled={!failedIds.length} onClick={() => setPick([...failedIds])}
              className="px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40">Failed only ({failedIds.length})</button>
            <button type="button" disabled={!auto.length} onClick={() => setPick(auto.map(s => s.id))}
              className="px-2 py-1 rounded border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40">All ({auto.length})</button>
            <span className="text-slate-500">Then press Run in the runner below.</span>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-950/30 p-2 sm:p-3 min-w-0 overflow-x-auto">
            <Embedded embedded pick={pick} />
          </div>
        </section>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Link href={page!} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-blue-600 text-white hover:bg-blue-500">
            <ExternalLink size={14} aria-hidden /> Open runner page
          </Link>
          <span className="text-xs text-slate-500">
            {p1.length ? `This runner is not set up to show here, so it opens on its own page. Run the P1 tests first: ${p1.join(", ")}.` : "This runner is not set up to show here, so it opens on its own page."}
          </span>
        </div>
      )}
    </div>
  );
}
