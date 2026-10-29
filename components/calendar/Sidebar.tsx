"use client";
import { useMemo, useState } from "react";
import clsx from "clsx";
import { Bell, BellOff, Calculator, Eye, EyeOff, RefreshCw } from "lucide-react";
import { CalendarEvent, EVENT_CATEGORIES, EVENT_CATEGORY_META, EVENT_COLOR_META } from "@/lib/calendar-events";
import { CalItem, SOURCE_META, DEPLOY_HEX, DEPLOY_HEX_BOTH, occurrences } from "./model";
import { addDays, diffDays, fmtShort, isWeekend, dowShort } from "./dates";
import { holidaysOn, HOLIDAYS_SOURCE_NOTE } from "./holidays";
import { LayerId, Layers, useColorScheme } from "./store";
import MiniMonth from "./MiniMonth";
import { Dot, inp } from "./ui";

const LAYER_ROWS: { id: LayerId; label: string; hex: string }[] = [
  { id: "jira", label: "Jira deployments", hex: DEPLOY_HEX.day },
  { id: "deployments", label: "Manual deployments", hex: DEPLOY_HEX.night },
  { id: "events", label: "My events", hex: EVENT_COLOR_META.blue.hex },
  { id: "kanban", label: SOURCE_META.kanban.label, hex: SOURCE_META.kanban.hex },
  { id: "todos", label: SOURCE_META.todo.label, hex: SOURCE_META.todo.hex },
  { id: "holidays", label: "Public holidays (MY)", hex: SOURCE_META.holiday.hex },
];

function Section({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

export default function Sidebar({
  cursor, todayStr, busy, layers, onToggleLayer, jiraSync, weekItems, events, remindersOn, onToggleReminders, onPick, onOpen,
}: {
  cursor: string;
  todayStr: string;
  busy: Set<string>;
  layers: Layers;
  onToggleLayer: (id: LayerId) => void;
  jiraSync: JiraSync;
  weekItems: CalItem[];
  events: CalendarEvent[];
  remindersOn: boolean;
  onToggleReminders: () => void;
  onPick: (d: string) => void;
  onOpen: (it: CalItem) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-3 hidden lg:block">
        <MiniMonth cursor={cursor} todayStr={todayStr} busy={busy} onPick={onPick} />
      </div>
      <ThisWeek items={weekItems} todayStr={todayStr} onOpen={onOpen} />
      <Section title="Layers">
        <div className="space-y-0.5">
          {LAYER_ROWS.map(l => (
            <button
              key={l.id}
              onClick={() => onToggleLayer(l.id)}
              className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-800 text-left motion-safe:transition-colors"
            >
              <span
                className="w-3.5 h-3.5 rounded-[4px] border-2 shrink-0 motion-safe:transition-colors"
                style={{ borderColor: l.hex, background: layers[l.id] ? l.hex : "transparent" }}
              />
              <span className={clsx("flex-1 text-sm", layers[l.id] ? "text-slate-200" : "text-slate-500")}>{l.label}</span>
              {layers[l.id] ? <Eye size={13} className="text-slate-600" /> : <EyeOff size={13} className="text-slate-600" />}
            </button>
          ))}
        </div>
        <JiraSyncRow s={jiraSync} />
        <div className="mt-3 pt-3 border-t border-slate-800">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Event categories</p>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
            {EVENT_CATEGORIES.map(c => (
              <span key={c} className="flex items-center gap-1.5 text-xs text-slate-400"><Dot hex={EVENT_COLOR_META[EVENT_CATEGORY_META[c].color].hex} />{EVENT_CATEGORY_META[c].label}</span>
            ))}
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><Dot hex={DEPLOY_HEX.day} />🌞 Morning deploy</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><Dot hex={DEPLOY_HEX.night} />🌙 Night deploy</span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400"><Dot hex={DEPLOY_HEX_BOTH} />🌞🌙 Both</span>
          </div>
        </div>
        <button
          onClick={onToggleReminders}
          className={clsx("mt-3 w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm motion-safe:transition-colors", remindersOn ? "text-slate-200 bg-slate-800" : "text-slate-500 hover:bg-slate-800")}
        >
          {remindersOn ? <Bell size={14} /> : <BellOff size={14} />}
          <span className="flex-1 text-left">Browser reminders</span>
          <span className={clsx("relative w-8 h-[18px] rounded-full motion-safe:transition-colors", remindersOn ? "bg-[color:var(--accent,#3b82f6)]" : "bg-slate-700")}>
            <span className={clsx("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white motion-safe:transition-all", remindersOn ? "left-4" : "left-0.5")} />
          </span>
        </button>
        <p className="mt-1.5 px-2 text-[11px] text-slate-600">Fires only while this page is open.</p>
      </Section>
      <WorkingDays todayStr={todayStr} events={events} />
    </div>
  );
}

export interface JiraSync {
  syncedAt?: string;
  error?: string;
  count: number;
  syncing: boolean;
  onSync: () => void;
}

/** Last sync time and a refresh button for the Jira deployment calendar. */
function JiraSyncRow({ s }: { s: JiraSync }) {
  const when = s.syncedAt
    ? new Date(s.syncedAt).toLocaleString(undefined, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })
    : null;
  return (
    <div className="mt-2 px-2 flex items-start gap-2">
      <p className="flex-1 text-[11px] text-slate-600 leading-snug">
        {s.syncing ? "Reading Jira releases…"
          : when ? <>{s.count} ticket{s.count !== 1 ? "s" : ""} from Jira · synced {when}</>
          : "Not synced with Jira yet."}
        {s.error && !s.syncing && <span className="block text-amber-400">{s.error}</span>}
      </p>
      <button
        onClick={s.onSync}
        disabled={s.syncing}
        aria-label="Sync Jira deployments"
        title="Sync Jira deployments"
        className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-50"
      >
        <RefreshCw size={13} className={s.syncing ? "motion-safe:animate-spin" : ""} />
      </button>
    </div>
  );
}

function ThisWeek({ items, todayStr, onOpen }: { items: CalItem[]; todayStr: string; onOpen: (it: CalItem) => void }) {
  const groups = useMemo(() => {
    const dep = items.filter(i => i.source === "deployment" && !i.muted);
    const testing = items.filter(i => i.ev?.category === "testing");
    const leave = items.filter(i => i.ev?.category === "leave");
    const hol = items.filter(i => i.source === "holiday");
    return [
      { title: "Deployments", list: dep },
      { title: "Testing windows", list: testing },
      { title: "Leave", list: leave },
      { title: "Holidays", list: hol },
    ].filter(g => g.list.length);
  }, [items]);

  function when(it: CalItem) {
    const rel = diffDays(todayStr, it.date);
    const day = rel === 0 ? "Today" : rel === 1 ? "Tomorrow" : rel < 0 ? `since ${fmtShort(it.date)}` : `${dowShort(it.date)} ${fmtShort(it.date)}`;
    return it.endDate !== it.date ? `${day} → ${fmtShort(it.endDate)}` : day;
  }

  return (
    <Section title="Next 7 days">
      {groups.length === 0 ? (
        <p className="text-xs text-slate-500">No deployments, testing windows, leave or holidays coming up.</p>
      ) : (
        <div className="space-y-3">
          {groups.map(g => (
            <div key={g.title}>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 mb-1">{g.title}</p>
              <div className="space-y-1">
                {g.list.map(it => (
                  <button key={it.key} onClick={() => onOpen(it)} className="w-full flex items-start gap-2 px-2 py-1.5 -mx-2 rounded-lg hover:bg-slate-800 text-left motion-safe:transition-colors" style={{ width: "calc(100% + 1rem)" }}>
                    <Dot hex={it.hex} className="w-2 h-2 mt-1.5" />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm text-slate-200 truncate">{it.title}</span>
                      <span className="block text-[11px] text-slate-500">
                        {when(it)}
                        {it.dep?.fixVersion && <> · <span className="font-semibold text-slate-400">{it.dep.fixVersion}</span></>}
                        {it.jira && <> · {it.jira.session === "Both" ? "Morning + Night" : it.jira.session ?? "Session not set"}</>}
                        {it.dep && it.jiraKeys.length > 0 && <> · {it.jiraKeys.length} ticket{it.jiraKeys.length !== 1 ? "s" : ""}</>}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}

/** Working days between two dates (inclusive): Mon–Fri, minus holidays and, optionally, my leave. */
export function countWorkingDays(from: string, to: string, opts: { holidays: boolean; leave: Set<string> }) {
  let a = from, b = to;
  if (b < a) [a, b] = [b, a];
  let working = 0, weekend = 0, holiday = 0, leave = 0;
  const total = diffDays(a, b) + 1;
  for (let i = 0, d = a; i < total && i < 3660; i++, d = addDays(d, 1)) {
    if (isWeekend(d)) { weekend++; continue; }
    if (opts.holidays && holidaysOn(d).length) { holiday++; continue; }
    if (opts.leave.has(d)) { leave++; continue; }
    working++;
  }
  return { working, weekend, holiday, leave, total };
}

function WorkingDays({ todayStr, events }: { todayStr: string; events: CalendarEvent[] }) {
  const scheme = useColorScheme();
  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(addDays(todayStr, 13));
  const [skipHol, setSkipHol] = useState(true);
  const [skipLeave, setSkipLeave] = useState(true);

  const leaveDays = useMemo(() => {
    const s = new Set<string>();
    if (!skipLeave || !from || !to) return s;
    const lo = from < to ? from : to, hi = from < to ? to : from;
    for (const e of events) {
      if (e.category !== "leave") continue;
      const span = Math.max(0, diffDays(e.startDate, e.endDate));
      for (const start of occurrences(e, lo, hi)) for (let i = 0; i <= span; i++) s.add(addDays(start, i));
    }
    return s;
  }, [events, from, to, skipLeave]);

  const valid = /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to);
  const r = valid ? countWorkingDays(from, to, { holidays: skipHol, leave: leaveDays }) : null;

  return (
    <Section title="Working days" right={<Calculator size={13} className="text-slate-600" />}>
      <div className="grid grid-cols-2 gap-2">
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} className={clsx(inp, "px-2 text-xs")} style={{ colorScheme: scheme }} aria-label="From date" />
        <input type="date" value={to} onChange={e => setTo(e.target.value)} className={clsx(inp, "px-2 text-xs")} style={{ colorScheme: scheme }} aria-label="To date" />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer"><input type="checkbox" checked={skipHol} onChange={e => setSkipHol(e.target.checked)} className="accent-[color:var(--accent,#3b82f6)]" />Skip holidays</label>
        <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer"><input type="checkbox" checked={skipLeave} onChange={e => setSkipLeave(e.target.checked)} className="accent-[color:var(--accent,#3b82f6)]" />Skip my leave</label>
      </div>
      {r && (
        <div className="mt-3 flex items-end gap-3">
          <p className="text-3xl font-semibold tabular-nums text-slate-100 leading-none">{r.working}</p>
          <p className="text-xs text-slate-500 pb-0.5 leading-snug">
            working day{r.working !== 1 ? "s" : ""}<br />
            of {r.total} · {r.weekend} weekend{r.holiday ? ` · ${r.holiday} holiday` : ""}{r.leave ? ` · ${r.leave} leave` : ""}
          </p>
        </div>
      )}
      <p className="mt-2 text-[10px] text-slate-600 leading-snug">Both dates count. {HOLIDAYS_SOURCE_NOTE}</p>
    </Section>
  );
}
