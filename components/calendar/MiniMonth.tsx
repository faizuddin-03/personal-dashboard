"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { MONTHS, WEEKDAYS_SHORT, addMonths, monthGrid, parts, startOfMonth, isWeekend } from "./dates";
import { isHoliday } from "./holidays";

/** Small month picker. Highlights today, the cursor date, and days with items. */
export default function MiniMonth({ cursor, todayStr, busy, onPick }: {
  cursor: string;
  todayStr: string;
  busy?: Set<string>;
  onPick: (d: string) => void;
}) {
  const [shown, setShown] = useState(() => startOfMonth(cursor));
  const [lastCursor, setLastCursor] = useState(cursor);
  // Follow the main calendar when it moves to another month.
  if (cursor !== lastCursor) {
    setLastCursor(cursor);
    if (startOfMonth(cursor) !== shown) setShown(startOfMonth(cursor));
  }
  const { y, m } = parts(shown);
  const cells = monthGrid(shown);

  return (
    <div className="select-none">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm font-semibold text-slate-200">{MONTHS[m]} {y}</span>
        <div className="flex items-center">
          <button aria-label="Previous month" onClick={() => setShown(addMonths(shown, -1))} className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800"><ChevronLeft size={14} /></button>
          <button aria-label="Next month" onClick={() => setShown(addMonths(shown, 1))} className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-slate-800"><ChevronRight size={14} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS_SHORT.map(d => <div key={d} className="text-[10px] font-semibold text-slate-600 py-1">{d[0]}</div>)}
        {cells.map(d => {
          const inMonth = parts(d).m === m;
          const isToday = d === todayStr;
          const isCursor = d === cursor;
          const hol = isHoliday(d);
          return (
            <button
              key={d}
              onClick={() => onPick(d)}
              className={clsx(
                "relative mx-auto my-px w-7 h-7 rounded-full text-[11px] tabular-nums motion-safe:transition-colors",
                isToday ? "bg-[color:var(--accent,#3b82f6)] text-white font-bold"
                  : isCursor ? "bg-slate-700 text-slate-100 font-semibold"
                  : inMonth ? (hol ? "text-red-400 hover:bg-slate-800" : isWeekend(d) ? "text-slate-500 hover:bg-slate-800" : "text-slate-300 hover:bg-slate-800")
                  : "text-slate-600 hover:bg-slate-800",
              )}
            >
              {parts(d).day}
              {busy?.has(d) && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-slate-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
