"use client";
import { useEffect, useState } from "react";
import { Tickets } from "lucide-react";
import AutomationCatalog, { byTicketNo } from "@/components/AutomationCatalog";
import { TICKET_AUTOMATIONS, type TicketAutomation } from "@/lib/ticketAutomations";
import { type CREntry, TRACKER_KEY, TS_TRACKER_UPDATED_EVENT, loadTracker } from "@/lib/tsTrackerModel";
import { runTally } from "@/lib/tsTrackerTally";

// /tickets — every per-ticket automation page in one list. Replaces the
// sidebar "Tickets" dropdown (Faizuddin, 2026-10-15). Layout, density and
// sort live in components/AutomationCatalog.tsx, shared with /eauto.
//
// Each card also shows the TS Tracker progress of its tickets, and opening the
// page tallies the tracker with the ticket pages (lib/tsTrackerTally.ts,
// 2026-10-22).

interface Counts { pass: number; fail: number; wip: number; none: number; deprio: number; total: number }

function countsFor(data: CREntry[], keys: string[]): Counts {
  const c: Counts = { pass: 0, fail: 0, wip: 0, none: 0, deprio: 0, total: 0 };
  const wanted = keys.map(k => k.toUpperCase());
  for (const cr of data) {
    if (!wanted.includes(cr.crKey.toUpperCase())) continue;
    for (const s of cr.suites) for (const tc of s.cases) {
      if (tc.disabled) { c.deprio++; continue; }
      c.total++;
      if (tc.status === "pass") c.pass++;
      else if (tc.status === "fail") c.fail++;
      else if (tc.status === "in-progress") c.wip++;
      else c.none++;
    }
  }
  return c;
}

function TrackerProgress({ t, data }: { t: TicketAutomation; data: CREntry[] }) {
  const c = countsFor(data, t.keys);
  if (c.total === 0 && c.deprio === 0) return null;
  const seg = (n: number) => `${c.total ? (n / c.total) * 100 : 0}%`;
  const parts: [number, string, string][] = [
    [c.pass, "Pass", "text-emerald-400"],
    [c.fail, "Fail", "text-red-400"],
    [c.wip, "WIP", "text-amber-400"],
    [c.none, "Not started", "text-slate-500"],
  ];
  return (
    <div className="space-y-1">
      <div className="flex h-1.5 overflow-hidden rounded-full bg-slate-800" title="TS Tracker progress">
        <div className="bg-emerald-500" style={{ width: seg(c.pass) }} />
        <div className="bg-red-500" style={{ width: seg(c.fail) }} />
        <div className="bg-amber-500" style={{ width: seg(c.wip) }} />
      </div>
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px]">
        <span className="text-slate-500">TS Tracker</span>
        {parts.filter(([n]) => n > 0).map(([n, label, cls]) => (
          <span key={label} className={cls}>{n} {label}</span>
        ))}
        {c.deprio > 0 && <span className="text-slate-600">{c.deprio} deprio</span>}
        <span className="text-slate-600">· {c.pass}/{c.total} passed</span>
      </div>
    </div>
  );
}

export default function TicketsPage() {
  const [data, setData] = useState<CREntry[]>([]);

  useEffect(() => {
    const reload = () => setData(loadTracker());
    reload();
    void runTally();
    const onStorage = (e: StorageEvent) => { if (e.key === TRACKER_KEY) reload(); };
    window.addEventListener(TS_TRACKER_UPDATED_EVENT, reload);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(TS_TRACKER_UPDATED_EVENT, reload);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <AutomationCatalog
      title="Tickets"
      subtitle="Automation built for one specific ticket — {n} pages"
      icon={Tickets}
      items={TICKET_AUTOMATIONS}
      storageKey="tickets_view"
      keyLabels={["Ticket no. (low → high)", "Ticket no. (high → low)"]}
      compareKey={byTicketNo}
      extra={t => <TrackerProgress t={t} data={data} />}
    />
  );
}
