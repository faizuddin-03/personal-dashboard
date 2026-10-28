"use client";
import { useState } from "react";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { CalItem, LEAVE_HEX, isLeaveItem, leaveCellBg, leaveCellLabel, tint } from "./model";
import { MONTHS_SHORT, WEEKDAYS_SHORT, fmtLong, fmtMin, isWeekend, monthGrid, parts } from "./dates";
import { holidaysOn } from "./holidays";
import ItemRow from "./ItemRow";

const MAX_PILLS = 3;

interface Props {
  cursor: string;
  todayStr: string;
  byDay: Map<string, CalItem[]>;
  h24: boolean;
  compact: boolean;
  highlight?: (it: CalItem) => boolean;
  onSelectDay: (d: string) => void;
  onCreate: (d: string) => void;
  onOpen: (it: CalItem) => void;
  onMove: (it: CalItem, date: string) => void;
  onOpenDay: (d: string) => void;
}

function cellTint(d: string, inMonth: boolean): string | undefined {
  if (holidaysOn(d).length) return "color-mix(in srgb, #ef4444 6%, transparent)";
  if (isWeekend(d)) return "color-mix(in srgb, var(--bg-elevated, #1e293b) 45%, transparent)";
  if (!inMonth) return "color-mix(in srgb, var(--bg-elevated, #1e293b) 25%, transparent)";
  return undefined;
}

export default function MonthView(p: Props) {
  const cells = monthGrid(p.cursor);
  const month = parts(p.cursor).m;
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overDay, setOverDay] = useState<string | null>(null);

  if (p.compact) return <CompactMonth {...p} cells={cells} month={month} />;

  function findItem(key: string): CalItem | undefined {
    for (const list of p.byDay.values()) { const f = list.find(i => i.key === key); if (f) return f; }
    return undefined;
  }

  return (
    <div className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-950">
      <div className="grid grid-cols-7 border-b border-slate-800 bg-slate-900/60">
        {WEEKDAYS_SHORT.map((d, i) => (
          <div key={d} className={clsx("px-3 py-2 text-[11px] font-semibold uppercase tracking-wider", i >= 5 ? "text-slate-600" : "text-slate-500")}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 grid-rows-6">
        {cells.map((d, idx) => {
          const items = p.byDay.get(d) ?? [];
          const hols = items.filter(i => i.source === "holiday");
          const leaves = items.filter(isLeaveItem);
          const rest = items.filter(i => i.source !== "holiday" && !isLeaveItem(i));
          const inMonth = parts(d).m === month;
          const isToday = d === p.todayStr;
          const visible = rest.slice(0, MAX_PILLS);
          const overflow = rest.length - visible.length;
          return (
            <div
              key={d}
              onClick={() => p.onCreate(d)}
              onDragOver={e => { if (dragKey) { e.preventDefault(); setOverDay(d); } }}
              onDragLeave={() => setOverDay(o => (o === d ? null : o))}
              onDrop={e => {
                e.preventDefault();
                const it = dragKey ? findItem(dragKey) : undefined;
                setDragKey(null); setOverDay(null);
                if (it && it.date !== d) p.onMove(it, d);
              }}
              className={clsx(
                "group relative min-h-[118px] p-1.5 cursor-pointer motion-safe:transition-colors",
                idx % 7 !== 6 && "border-r border-slate-800",
                idx < 35 && "border-b border-slate-800",
                "hover:bg-slate-900",
                overDay === d && "ring-2 ring-inset ring-[color:var(--accent,#3b82f6)]",
              )}
              style={{ background: overDay === d ? undefined : leaveCellBg(leaves) ?? cellTint(d, inMonth) }}
            >
              <div className="flex items-center justify-between gap-1 mb-1 px-0.5">
                <button
                  onClick={e => { e.stopPropagation(); p.onOpenDay(d); }}
                  title={`Open ${fmtLong(d)}`}
                  className={clsx(
                    "min-w-7 h-7 px-1.5 rounded-full text-xs font-semibold tabular-nums motion-safe:transition-colors",
                    isToday ? "bg-[color:var(--accent,#3b82f6)] text-white"
                      : inMonth ? "text-slate-300 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-800",
                  )}
                >
                  {parts(d).day === 1 ? `1 ${MONTHS_SHORT[parts(d).m]}` : parts(d).day}
                </button>
                <Plus size={13} className="text-slate-600 opacity-0 group-hover:opacity-100 motion-safe:transition-opacity" />
              </div>
              {hols.length > 0 && (
                <p className="px-1 mb-0.5 text-[10px] font-semibold text-red-400 truncate" title={hols.map(h => h.title).join(", ")}>
                  {hols[0].title}{hols.length > 1 ? ` +${hols.length - 1}` : ""}
                </p>
              )}
              {leaves.length > 0 && <LeaveLabels leaves={leaves} onOpen={p.onOpen} />}
              <div className="space-y-0.5">
                {visible.map(it => (
                  <MonthPill
                    key={it.key} it={it} h24={p.h24}
                    dim={p.highlight ? !p.highlight(it) : false}
                    onOpen={p.onOpen}
                    onDragStart={() => setDragKey(it.key)}
                    onDragEnd={() => { setDragKey(null); setOverDay(null); }}
                  />
                ))}
                {overflow > 0 && (
                  <button
                    onClick={e => { e.stopPropagation(); p.onOpenDay(d); }}
                    className="w-full text-left px-1.5 py-0.5 text-[11px] font-medium text-slate-500 hover:text-slate-200 rounded-md hover:bg-slate-800"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Small text label on a leave day (the cell itself is coloured); click to edit. */
function LeaveLabels({ leaves, onOpen }: { leaves: CalItem[]; onOpen: (it: CalItem) => void }) {
  return (
    <div className="flex flex-wrap gap-x-2 px-1 mb-0.5">
      {leaves.map(l => (
        <button
          key={l.key}
          onClick={e => { e.stopPropagation(); onOpen(l); }}
          title={l.title}
          className="text-[10px] font-semibold uppercase tracking-wide hover:underline truncate"
          style={{ color: LEAVE_HEX }}
        >
          {leaveCellLabel(l)}
        </button>
      ))}
    </div>
  );
}

function MonthPill({ it, h24, dim, onOpen, onDragStart, onDragEnd }: {
  it: CalItem; h24: boolean; dim: boolean;
  onOpen: (it: CalItem) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const timed = !it.allDay && it.start !== undefined;
  return (
    <div
      draggable={it.movable}
      onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", it.key); onDragStart(); }}
      onDragEnd={onDragEnd}
      onClick={e => { e.stopPropagation(); onOpen(it); }}
      title={it.title}
      className={clsx(
        "flex items-center gap-1.5 px-1.5 py-[3px] rounded-md text-[11.5px] leading-tight truncate motion-safe:transition-[opacity,filter]",
        "hover:brightness-110",
        it.movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        (it.muted || dim) && "opacity-40",
      )}
      style={timed ? undefined : { background: tint(it.hex, 18), boxShadow: `inset 3px 0 0 ${it.hex}` }}
    >
      {timed && <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: it.hex }} />}
      {timed && <span className="shrink-0 tabular-nums text-slate-500">{fmtMin(it.start!, h24)}</span>}
      <span className={clsx("truncate text-slate-200", it.muted && "line-through")}>{it.title}</span>
    </div>
  );
}

function CompactMonth(p: Props & { cells: string[]; month: number }) {
  const sel = p.cursor;
  const dayItems = p.byDay.get(sel) ?? [];
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-slate-950 p-2">
        <div className="grid grid-cols-7 text-center">
          {WEEKDAYS_SHORT.map(d => <div key={d} className="text-[10px] font-semibold text-slate-600 py-1">{d[0]}</div>)}
          {p.cells.map(d => {
            const items = p.byDay.get(d) ?? [];
            const inMonth = parts(d).m === p.month;
            const isToday = d === p.todayStr;
            const hol = items.some(i => i.source === "holiday");
            const dayLeaves = items.filter(isLeaveItem);
            const dots = items.filter(i => i.source !== "holiday" && !isLeaveItem(i)).slice(0, 4);
            return (
              <button
                key={d}
                onClick={() => p.onSelectDay(d)}
                className={clsx("flex flex-col items-center gap-1 py-1.5 rounded-xl motion-safe:transition-colors", d === sel && !isToday && !dayLeaves.length && "bg-slate-800", d === sel && dayLeaves.length > 0 && "ring-1 ring-slate-600")}
                style={{ background: leaveCellBg(dayLeaves, 28) }}
              >
                <span className={clsx(
                  "w-7 h-7 flex items-center justify-center rounded-full text-xs tabular-nums",
                  isToday ? "bg-[color:var(--accent,#3b82f6)] text-white font-bold"
                    : hol ? "text-red-400 font-semibold"
                    : inMonth ? (isWeekend(d) ? "text-slate-500" : "text-slate-200") : "text-slate-600",
                )}>{parts(d).day}</span>
                <span className="flex gap-0.5 h-1.5">
                  {dots.map(it => <span key={it.key} className="w-1.5 h-1.5 rounded-full" style={{ background: it.hex }} />)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <p className="text-sm font-semibold text-slate-200">{fmtLong(sel)}</p>
          <button onClick={() => p.onCreate(sel)} className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-slate-200"><Plus size={13} /> Add</button>
        </div>
        {dayItems.length === 0
          ? <p className="text-xs text-slate-500 px-1 py-6 text-center rounded-xl border border-dashed border-slate-800">Nothing on this day</p>
          : <div className="space-y-2">{dayItems.map(it => <ItemRow key={it.key} it={it} h24={p.h24} onOpen={p.onOpen} />)}</div>}
      </div>
    </div>
  );
}
