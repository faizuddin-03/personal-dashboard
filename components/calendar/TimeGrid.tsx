"use client";
// Week / 3-day / Day time grid: all-day row, hour grid, current-time line,
// drag to create, drag to move, drag the bottom edge to resize.

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { CalItem, LEAVE_HEX, isLeaveItem, leaveCellBg, leaveCellLabel, tint, tintSolid } from "./model";
import { dowShort, fmtHour, fmtMin, isWeekend, parts } from "./dates";
import { holidaysOn } from "./holidays";
import { useNowMinutes } from "./store";

const SNAP = 15;
const DAY_MIN = 24 * 60;

export interface Draft { date: string; endDate: string; allDay: boolean; start?: number; end?: number }

type Drag =
  | { kind: "create"; day: string; a: number; b: number; touch: boolean; x0: number; y0: number; moved: boolean }
  | { kind: "move"; it: CalItem; grab: number; day: string; start: number; touch: boolean; x0: number; y0: number; moved: boolean }
  | { kind: "resize"; it: CalItem; end: number };

interface Props {
  days: string[];
  todayStr: string;
  byDay: Map<string, CalItem[]>;
  h24: boolean;
  hourPx: number;
  highlight?: (it: CalItem) => boolean;
  onCreate: (d: Draft) => void;
  onOpen: (it: CalItem) => void;
  onMove: (it: CalItem, date: string, start?: number) => void;
  onResize: (it: CalItem, end: number) => void;
  onOpenDay: (d: string) => void;
}

interface Placed { it: CalItem; col: number; cols: number }

/** Side-by-side layout for overlapping timed items. */
function layout(items: CalItem[]): Placed[] {
  const sorted = [...items].sort((a, b) => a.start! - b.start! || (b.end! - b.start!) - (a.end! - a.start!));
  const out: Placed[] = [];
  let cluster: Placed[] = [];
  let colEnds: number[] = [];
  let clusterEnd = -1;
  const flush = () => { const n = colEnds.length; for (const p of cluster) p.cols = n; cluster = []; colEnds = []; };
  for (const it of sorted) {
    const s = it.start!, e = Math.max(it.end!, s + 20);
    if (s >= clusterEnd) { flush(); clusterEnd = -1; }
    let col = colEnds.findIndex(end => end <= s);
    if (col === -1) { col = colEnds.length; colEnds.push(e); } else colEnds[col] = e;
    const p = { it, col, cols: 1 };
    cluster.push(p); out.push(p);
    clusterEnd = Math.max(clusterEnd, e);
  }
  flush();
  return out;
}

const snap = (m: number) => Math.round(m / SNAP) * SNAP;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export default function TimeGrid(p: Props) {
  const { days, hourPx } = p;
  const scrollRef = useRef<HTMLDivElement>(null);
  const colRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const [allDayDrag, setAllDayDrag] = useState<string | null>(null);
  const [allDayOver, setAllDayOver] = useState<string | null>(null);
  const nowMin = useNowMinutes();
  const propsRef = useRef(p);
  useEffect(() => { propsRef.current = p; });

  const showsToday = days.includes(p.todayStr);

  // Scroll to a useful hour on first show and when the range changes.
  const firstDay = days[0];
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const target = showsToday && nowMin >= 0 ? Math.max(0, nowMin / 60 - 2) : 7.5;
    el.scrollTop = target * hourPx;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstDay, days.length, hourPx]);

  const { allDay, timed, leaves } = useMemo(() => {
    const allDay = new Map<string, CalItem[]>();
    const timed = new Map<string, CalItem[]>();
    const leaves = new Map<string, CalItem[]>();
    for (const d of days) {
      const list = p.byDay.get(d) ?? [];
      leaves.set(d, list.filter(isLeaveItem));
      allDay.set(d, list.filter(i => (i.allDay || i.start === undefined) && !isLeaveItem(i)));
      timed.set(d, list.filter(i => !i.allDay && i.start !== undefined));
    }
    return { allDay, timed, leaves };
  }, [days, p.byDay]);

  /** Leave shading as a background image layer (half day = top/bottom half, split at noon). */
  function leaveLayer(d: string, pct: number): string | undefined {
    const bg = leaveCellBg(leaves.get(d) ?? [], pct);
    if (!bg) return undefined;
    return bg.startsWith("linear-gradient") ? bg : `linear-gradient(${bg}, ${bg})`;
  }

  function minuteAt(clientY: number, idx: number): number {
    const el = colRefs.current[idx];
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    return clamp(((clientY - r.top) / hourPx) * 60, 0, DAY_MIN);
  }
  function dayAt(clientX: number): number {
    const rects = colRefs.current.map(el => el?.getBoundingClientRect());
    for (let i = 0; i < rects.length; i++) { const r = rects[i]; if (r && clientX >= r.left && clientX < r.right) return i; }
    const first = rects[0];
    return first && clientX < first.left ? 0 : rects.length - 1;
  }

  function set(d: Drag | null) { dragRef.current = d; setDrag(d); }

  useEffect(() => {
    if (!drag) return;
    function onMove(e: PointerEvent) {
      const d = dragRef.current;
      if (!d) return;
      if (d.kind === "resize") {
        const idx = days.indexOf(d.it.date);
        set({ ...d, end: clamp(snap(minuteAt(e.clientY, idx)), d.it.start! + SNAP, DAY_MIN) });
        return;
      }
      const dist = Math.hypot(e.clientX - d.x0, e.clientY - d.y0);
      if (d.touch) { if (dist > 8) set(null); return; }
      const moved = d.moved || dist > 4;
      if (d.kind === "create") {
        set({ ...d, moved, b: minuteAt(e.clientY, days.indexOf(d.day)) });
      } else {
        const idx = dayAt(e.clientX);
        const dur = (d.it.end ?? d.it.start! + 60) - d.it.start!;
        const start = clamp(snap(minuteAt(e.clientY, idx) - d.grab), 0, DAY_MIN - Math.min(dur, DAY_MIN));
        set({ ...d, moved, day: days[idx], start });
      }
    }
    function onUp() {
      const d = dragRef.current;
      set(null);
      if (!d) return;
      const P = propsRef.current;
      if (d.kind === "resize") { if (d.end !== d.it.end) P.onResize(d.it, d.end); return; }
      if (d.kind === "create") {
        let s = Math.min(d.a, d.b), e = Math.max(d.a, d.b);
        if (!d.moved || e - s < SNAP) { s = Math.floor(d.a / 30) * 30; e = s + 60; }
        else { s = snap(s); e = snap(e); }
        P.onCreate({ date: d.day, endDate: d.day, allDay: false, start: s, end: Math.min(e, DAY_MIN) });
        return;
      }
      if (!d.moved) { P.onOpen(d.it); return; }
      if (d.day !== d.it.date || d.start !== d.it.start) P.onMove(d.it, d.day, d.start);
    }
    function onCancel() { set(null); }
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") set(null); }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("keydown", onKey);
    };
    // Only (re)attach when a drag starts or ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drag === null, days]);

  function startCreate(e: React.PointerEvent, day: string, idx: number) {
    if (e.button !== 0) return;
    const touch = e.pointerType === "touch";
    if (!touch) e.preventDefault();
    const m = minuteAt(e.clientY, idx);
    set({ kind: "create", day, a: snap(m), b: snap(m), touch, x0: e.clientX, y0: e.clientY, moved: false });
  }
  function startMove(e: React.PointerEvent, it: CalItem, idx: number) {
    if (e.button !== 0) return;
    e.stopPropagation();
    const touch = e.pointerType === "touch";
    if (!touch) e.preventDefault();
    if (!it.movable && !touch) {
      // Not draggable: still open on click.
      set({ kind: "move", it, grab: 0, day: it.date, start: it.start!, touch: true, x0: e.clientX, y0: e.clientY, moved: false });
      return;
    }
    set({ kind: "move", it, grab: minuteAt(e.clientY, idx) - it.start!, day: it.date, start: it.start!, touch, x0: e.clientX, y0: e.clientY, moved: false });
  }
  function startResize(e: React.PointerEvent, it: CalItem) {
    if (e.button !== 0 || e.pointerType === "touch") return;
    e.stopPropagation(); e.preventDefault();
    set({ kind: "resize", it, end: it.end ?? it.start! + 60 });
  }

  // Touch "drags" are taps: resolve them on pointerup through the same handler.
  // (onUp treats an unmoved create as a 1-hour slot and an unmoved move as open.)

  const gridBg = `repeating-linear-gradient(to bottom, var(--border-subtle, #1e293b) 0, var(--border-subtle, #1e293b) 1px, transparent 1px, transparent ${hourPx}px)`;
  const cols = `3.5rem repeat(${days.length}, minmax(0, 1fr))`;
  const draggingKey = drag && drag.kind !== "create" && (drag.kind === "resize" || drag.moved) ? drag.it.key : null;

  return (
    <div className={clsx("rounded-2xl border border-slate-800 overflow-hidden bg-slate-950", drag && !("touch" in drag && drag.touch) && "select-none")}>
      {/* Day headers */}
      <div className="grid border-b border-slate-800 bg-slate-900/60" style={{ gridTemplateColumns: cols }}>
        <div />
        {days.map(d => {
          const isToday = d === p.todayStr;
          const hol = holidaysOn(d);
          return (
            <button key={d} onClick={() => p.onOpenDay(d)} className="min-w-0 py-2 px-1 flex flex-col items-center gap-0.5 hover:bg-slate-900 motion-safe:transition-colors border-l border-slate-800">
              <span className={clsx("text-[10px] font-semibold uppercase tracking-wider", isToday ? "text-[color:var(--accent,#3b82f6)]" : "text-slate-500")}>{dowShort(d)}</span>
              <span className={clsx(
                "w-8 h-8 flex items-center justify-center rounded-full text-base font-semibold tabular-nums",
                isToday ? "bg-[color:var(--accent,#3b82f6)] text-white" : hol.length ? "text-red-400" : "text-slate-200",
              )}>{parts(d).day}</span>
            </button>
          );
        })}
      </div>

      {/* All-day row */}
      <div className="grid border-b border-slate-800" style={{ gridTemplateColumns: cols }}>
        <div className="text-[10px] text-slate-600 text-right pr-2 pt-2 uppercase tracking-wide">All day</div>
        {days.map(d => {
          const list = allDay.get(d) ?? [];
          const dayLeaves = leaves.get(d) ?? [];
          return (
            <div
              key={d}
              onClick={() => p.onCreate({ date: d, endDate: d, allDay: true })}
              onDragOver={e => { if (allDayDrag) { e.preventDefault(); setAllDayOver(d); } }}
              onDragLeave={() => setAllDayOver(o => (o === d ? null : o))}
              onDrop={e => {
                e.preventDefault();
                const it = allDayDrag ? (p.byDay.get(days.find(x => (p.byDay.get(x) ?? []).some(i => i.key === allDayDrag)) ?? "") ?? []).find(i => i.key === allDayDrag) : undefined;
                setAllDayDrag(null); setAllDayOver(null);
                if (it && it.date !== d) p.onMove(it, d);
              }}
              className={clsx("min-w-0 min-h-[34px] p-1 space-y-0.5 border-l border-slate-800 cursor-pointer hover:bg-slate-900", allDayOver === d && "ring-2 ring-inset ring-[color:var(--accent,#3b82f6)]")}
              style={{ background: dayLeaves.length ? `color-mix(in srgb, ${LEAVE_HEX} 22%, transparent)` : holidaysOn(d).length ? "color-mix(in srgb, #ef4444 6%, transparent)" : isWeekend(d) ? "color-mix(in srgb, var(--bg-elevated, #1e293b) 40%, transparent)" : undefined }}
            >
              {dayLeaves.map(l => (
                <button
                  key={l.key}
                  onClick={e => { e.stopPropagation(); p.onOpen(l); }}
                  title={l.title}
                  className="block px-1 text-[10px] font-semibold uppercase tracking-wide hover:underline truncate"
                  style={{ color: LEAVE_HEX }}
                >
                  {leaveCellLabel(l)}
                </button>
              ))}
              {list.map(it => (
                <div
                  key={it.key}
                  draggable={it.movable}
                  onDragStart={e => { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", it.key); setAllDayDrag(it.key); }}
                  onDragEnd={() => { setAllDayDrag(null); setAllDayOver(null); }}
                  onClick={e => { e.stopPropagation(); p.onOpen(it); }}
                  title={it.title}
                  className={clsx("px-1.5 py-[3px] rounded-md text-[11px] leading-tight truncate text-slate-200 hover:brightness-110", it.movable ? "cursor-grab" : "cursor-pointer", (it.muted || (p.highlight && !p.highlight(it))) && "opacity-40")}
                  style={{ background: tint(it.hex, 20), boxShadow: `inset 3px 0 0 ${it.hex}` }}
                >
                  {it.title}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Hour grid */}
      <div ref={scrollRef} className="overflow-y-auto overscroll-contain" style={{ height: "max(420px, calc(100dvh - 300px))" }}>
        <div className="grid relative" style={{ gridTemplateColumns: cols, height: 24 * hourPx }}>
          <div className="relative">
            {Array.from({ length: 24 }, (_, h) => (
              <span key={h} className="absolute right-2 -translate-y-1/2 text-[10px] tabular-nums text-slate-600" style={{ top: h * hourPx }}>
                {h === 0 ? "" : fmtHour(h, p.h24)}
              </span>
            ))}
          </div>
          {days.map((d, idx) => {
            const placed = layout((timed.get(d) ?? []).filter(i => i.key !== draggingKey));
            const isToday = d === p.todayStr;
            const creating = drag?.kind === "create" && drag.day === d && drag.moved ? drag : null;
            const ghost = drag && drag.kind !== "create" && draggingKey && (drag.kind === "resize" ? drag.it.date === d : drag.day === d) ? drag : null;
            return (
              <div
                key={d}
                ref={el => { colRefs.current[idx] = el; }}
                onPointerDown={e => startCreate(e, d, idx)}
                className="relative border-l border-slate-800 cursor-crosshair"
                style={{
                  backgroundImage: [gridBg, leaveLayer(d, 14)].filter(Boolean).join(", "),
                  backgroundColor: holidaysOn(d).length ? "color-mix(in srgb, #ef4444 5%, transparent)" : isWeekend(d) ? "color-mix(in srgb, var(--bg-elevated, #1e293b) 35%, transparent)" : isToday ? "color-mix(in srgb, var(--accent, #3b82f6) 4%, transparent)" : undefined,
                }}
              >
                {placed.map(({ it, col, cols: n }) => (
                  <Block
                    key={it.key} it={it} h24={p.h24} hourPx={hourPx}
                    start={it.start!} end={it.end ?? it.start! + 60}
                    left={`calc(${(col / n) * 100}% + 2px)`} width={`calc(${100 / n}% - 4px)`}
                    dim={!!p.highlight && !p.highlight(it)}
                    onPointerDown={e => startMove(e, it, idx)}
                    onResizeDown={e => startResize(e, it)}
                  />
                ))}
                {ghost && (
                  <Block
                    it={ghost.it} h24={p.h24} hourPx={hourPx} lifted
                    start={ghost.kind === "resize" ? ghost.it.start! : ghost.start}
                    end={ghost.kind === "resize" ? ghost.end : ghost.start + ((ghost.it.end ?? ghost.it.start! + 60) - ghost.it.start!)}
                    left="2px" width="calc(100% - 4px)"
                  />
                )}
                {creating && (
                  <div
                    className="absolute left-0.5 right-0.5 rounded-lg border-2 border-dashed pointer-events-none px-2 py-1 text-[11px] font-semibold text-slate-200"
                    style={{
                      top: (Math.min(creating.a, creating.b) / 60) * hourPx,
                      height: Math.max(SNAP, Math.abs(snap(creating.b) - creating.a)) / 60 * hourPx,
                      borderColor: "var(--accent, #3b82f6)",
                      background: "color-mix(in srgb, var(--accent, #3b82f6) 14%, transparent)",
                    }}
                  >
                    {fmtMin(Math.min(creating.a, snap(creating.b)), p.h24)} – {fmtMin(Math.max(creating.a, snap(creating.b)), p.h24)}
                  </div>
                )}
                {isToday && nowMin >= 0 && (
                  <div className="absolute left-0 right-0 pointer-events-none z-20" style={{ top: (nowMin / 60) * hourPx }}>
                    <div className="relative h-0.5 bg-red-500">
                      <span className="absolute -left-1.5 -top-[5px] w-3 h-3 rounded-full bg-red-500" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Block({ it, h24, hourPx, start, end, left, width, dim, lifted, onPointerDown, onResizeDown }: {
  it: CalItem; h24: boolean; hourPx: number; start: number; end: number;
  left: string; width: string; dim?: boolean; lifted?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onResizeDown?: (e: React.PointerEvent) => void;
}) {
  const height = Math.max(20, ((end - start) / 60) * hourPx - 2);
  const short = height < 38;
  return (
    <div
      onPointerDown={onPointerDown}
      title={`${it.title}\n${fmtMin(start, h24)} – ${fmtMin(end, h24)}`}
      className={clsx(
        "absolute rounded-lg overflow-hidden px-2 text-[11px] leading-tight z-10",
        "motion-safe:transition-shadow",
        it.movable ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        lifted ? "shadow-xl ring-2 ring-[color:var(--accent,#3b82f6)] z-30 opacity-95" : "hover:shadow-lg",
        (dim || it.muted) && !lifted && "opacity-45",
        short ? "py-0.5 flex items-center gap-1.5" : "py-1",
      )}
      style={{
        top: (start / 60) * hourPx + 1, height, left, width,
        background: tintSolid(it.hex, 24),
        boxShadow: `inset 3px 0 0 ${it.hex}`,
        color: "var(--text-primary, #f1f5f9)",
        touchAction: "auto",
      }}
    >
      <p className={clsx("font-semibold truncate", it.muted && "line-through")}>{it.title}</p>
      <p className={clsx("tabular-nums truncate", short ? "text-[10px] opacity-70" : "opacity-70 mt-0.5")}>
        {fmtMin(start, h24)}{it.source !== "deployment" && ` – ${fmtMin(end, h24)}`}
        {it.dep?.fixVersion && ` · ${it.dep.fixVersion}`}
        {it.jira && ` · ${it.jira.version}`}
      </p>
      {!short && height > 56 && it.jiraKeys.length > 0 && (
        <p className="mt-0.5 font-mono text-[10px] opacity-70 truncate">{it.jiraKeys.slice(0, 3).join(" ")}</p>
      )}
      {it.resizable && onResizeDown && (
        <div onPointerDown={onResizeDown} className="absolute left-0 right-0 bottom-0 h-2 cursor-ns-resize" aria-label="Resize" />
      )}
    </div>
  );
}
