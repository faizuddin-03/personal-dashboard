"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  CalendarDays, ChevronLeft, ChevronRight, ClipboardPaste, Download, Keyboard, MoreHorizontal, Plus, Rocket, Search, X,
} from "lucide-react";
import { CalItem } from "./model";
import { fmtLong } from "./dates";
import { CalView } from "./store";
import type { TicketScope } from "@/lib/ticketScope";
import { Dot, Segmented, btnGhost, btnOutline, btnPrimary } from "./ui";

export const SHORTCUTS: [string, string][] = [
  ["T", "Go to today"],
  ["M / W / D / A", "Month, week, day, agenda view"],
  ["← / →  or  J / K", "Previous / next"],
  ["N", "New event"],
  ["/", "Search"],
  ["Esc", "Close panel / cancel drag"],
  ["?", "Show shortcuts"],
];

interface Props {
  title: string;
  view: CalView;
  isPhone: boolean;
  h24: boolean;
  query: string;
  results: CalItem[];
  showShortcuts: boolean;
  onShortcuts: (v: boolean) => void;
  onQuery: (q: string) => void;
  onPickResult: (it: CalItem) => void;
  onView: (v: CalView) => void;
  /** Global All / My tickets filter (lib/ticketScope.ts). */
  scope: TicketScope;
  onScope: (s: TicketScope) => void;
  scopeWarning?: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onNewEvent: () => void;
  onNewDeployment: () => void;
  onPaste: () => void;
  onExport: () => void;
  onToggle24h: () => void;
}

const Toolbar = forwardRef<HTMLInputElement, Props>(function Toolbar(p, searchRef) {
  const [menu, setMenu] = useState(false);
  const [focus, setFocus] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    function onDoc(e: MouseEvent) { if (!menuRef.current?.contains(e.target as Node)) setMenu(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menu]);

  const viewOpts: { value: CalView; label: string; title: string }[] = [
    { value: "month", label: p.isPhone ? "M" : "Month", title: "Month (M)" },
    { value: "week", label: p.isPhone ? "3D" : "Week", title: p.isPhone ? "3 days (W)" : "Week (W)" },
    { value: "day", label: p.isPhone ? "D" : "Day", title: "Day (D)" },
    { value: "agenda", label: p.isPhone ? "List" : "Agenda", title: "Agenda (A)" },
  ];

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-slate-800">
      <div className="px-4 sm:px-6 py-3 flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex items-center gap-2 min-w-0">
          <CalendarDays size={16} className="text-slate-500 shrink-0 hidden sm:block" />
          <button onClick={p.onToday} className={btnOutline} title="Today (T)">Today</button>
          <div className="flex items-center">
            <button onClick={p.onPrev} aria-label="Previous" title="Previous (←)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"><ChevronLeft size={18} /></button>
            <button onClick={p.onNext} aria-label="Next" title="Next (→)" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800"><ChevronRight size={18} /></button>
          </div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-100 truncate">{p.title}</h1>
        </div>

        <div className="flex-1" />

        {/* Search */}
        <div className="relative order-last w-full sm:order-none sm:w-56 lg:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            ref={searchRef}
            value={p.query}
            onChange={e => p.onQuery(e.target.value)}
            onFocus={() => setFocus(true)}
            onBlur={() => setTimeout(() => setFocus(false), 150)}
            onKeyDown={e => {
              if (e.key === "Escape") { p.onQuery(""); (e.target as HTMLInputElement).blur(); }
              if (e.key === "Enter" && p.results[0]) p.onPickResult(p.results[0]);
            }}
            placeholder="Search events, tickets…"
            className="w-full pl-8 pr-8 py-1.5 rounded-lg text-sm bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[color:var(--accent,#3b82f6)]"
          />
          {p.query && (
            <button onClick={() => p.onQuery("")} aria-label="Clear search" className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-500 hover:text-slate-200"><X size={13} /></button>
          )}
          {focus && p.query.trim() && (
            <div className="absolute z-40 mt-1.5 left-0 right-0 sm:left-auto sm:w-96 max-h-96 overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-1.5">
              {p.results.length === 0 ? (
                <p className="px-3 py-4 text-xs text-slate-500 text-center">No matches within a year either side of today</p>
              ) : p.results.map(it => (
                <button
                  key={it.key}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => { p.onPickResult(it); setFocus(false); }}
                  className="w-full flex items-start gap-2.5 px-2.5 py-2 rounded-lg hover:bg-slate-800 text-left"
                >
                  <Dot hex={it.hex} className="w-2 h-2 mt-1.5" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-slate-200 truncate">{it.title}</span>
                    <span className="block text-[11px] text-slate-500 truncate">{fmtLong(it.date)} · {it.label}{it.jiraKeys.length ? ` · ${it.jiraKeys.slice(0, 3).join(", ")}` : ""}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="inline-flex items-center gap-1.5" title={p.scopeWarning ?? "Applies to every page that shows Jira tickets. Mine = you are in the ticket's QA field."}>
          <Segmented
            value={p.scope}
            options={[
              { value: "all", label: p.isPhone ? "All" : "All tickets" },
              { value: "mine", label: p.isPhone ? "Mine" : "My tickets" },
            ]}
            onChange={p.onScope}
          />
          {p.scopeWarning && <span className="text-[11px] text-amber-400">!</span>}
        </span>

        <Segmented value={p.view} options={viewOpts} onChange={p.onView} />

        <div className="flex items-center gap-1.5">
          <button onClick={p.onNewEvent} className={btnPrimary} title="New event (N)"><Plus size={14} /><span className="hidden sm:inline">Event</span></button>
          <span className="hidden md:block"><button onClick={p.onNewDeployment} className={btnOutline}><Rocket size={13} /> Deployment</button></span>
          <div className="relative" ref={menuRef}>
            <button onClick={() => setMenu(v => !v)} aria-label="More" className={clsx(btnGhost, "px-2")}><MoreHorizontal size={16} /></button>
            {menu && (
              <div className="absolute right-0 mt-1.5 w-56 z-40 rounded-xl border border-slate-700 bg-slate-900 shadow-2xl p-1.5">
                <MenuItem icon={<Rocket size={14} />} label="New deployment" onClick={() => { setMenu(false); p.onNewDeployment(); }} />
                <MenuItem icon={<ClipboardPaste size={14} />} label="Paste deployment update" onClick={() => { setMenu(false); p.onPaste(); }} />
                <MenuItem icon={<Download size={14} />} label="Export visible range (.ics)" onClick={() => { setMenu(false); p.onExport(); }} />
                <div className="my-1 border-t border-slate-800" />
                <MenuItem icon={<span className="text-[10px] font-bold w-3.5">{p.h24 ? "24" : "12"}</span>} label={p.h24 ? "Use 12-hour time" : "Use 24-hour time"} onClick={() => { setMenu(false); p.onToggle24h(); }} />
                <MenuItem icon={<Keyboard size={14} />} label="Keyboard shortcuts" onClick={() => { setMenu(false); p.onShortcuts(true); }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {p.showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => p.onShortcuts(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl p-5" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Keyboard size={15} /> Keyboard shortcuts</h2>
              <button onClick={() => p.onShortcuts(false)} aria-label="Close" className="p-1 text-slate-500 hover:text-slate-200"><X size={15} /></button>
            </div>
            <dl className="space-y-2">
              {SHORTCUTS.map(([k, d]) => (
                <div key={k} className="flex items-center justify-between gap-4 text-sm">
                  <dt className="text-slate-400">{d}</dt>
                  <dd><kbd className="px-2 py-0.5 rounded-md border border-slate-700 bg-slate-800 text-[11px] font-mono text-slate-300 whitespace-nowrap">{k}</kbd></dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-slate-500">In week and day view: drag on empty space to create, drag an event to move it, drag its bottom edge to resize. In month view: drag a pill to another day.</p>
          </div>
        </div>
      )}
    </header>
  );
});

function MenuItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-slate-100 text-left">
      <span className="text-slate-500 flex items-center justify-center w-4">{icon}</span>{label}
    </button>
  );
}

export default Toolbar;
