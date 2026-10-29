"use client";
import clsx from "clsx";
import { CalendarX2 } from "lucide-react";
import { CalItem } from "./model";
import { diffDays, dowShort, MONTHS_SHORT, parts, isWeekend } from "./dates";
import ItemRow from "./ItemRow";

/** Upcoming list grouped by day, starting at `from`. */
export default function AgendaView({ from, days, todayStr, byDay, h24, onOpen, onMore, onOpenDay }: {
  from: string;
  days: string[];
  todayStr: string;
  byDay: Map<string, CalItem[]>;
  h24: boolean;
  onOpen: (it: CalItem) => void;
  onMore: () => void;
  onOpenDay: (d: string) => void;
}) {
  const withItems = days.filter(d => (byDay.get(d) ?? []).length > 0);
  if (withItems.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 py-16 flex flex-col items-center text-center gap-2">
        <CalendarX2 size={28} className="text-slate-600" />
        <p className="text-sm text-slate-400">Nothing scheduled in the next {days.length} days</p>
        <button onClick={onMore} className="text-xs font-medium text-[color:var(--accent,#3b82f6)] hover:underline">Look further ahead</button>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {withItems.map(d => {
        const { m, day } = parts(d);
        const rel = diffDays(todayStr, d);
        const relLabel = rel === 0 ? "Today" : rel === 1 ? "Tomorrow" : rel === -1 ? "Yesterday" : rel > 1 && rel < 7 ? `In ${rel} days` : "";
        return (
          <section key={d} className="flex gap-4">
            <button onClick={() => onOpenDay(d)} className="w-14 shrink-0 text-center pt-1 rounded-xl hover:bg-slate-900">
              <p className={clsx("text-[11px] font-semibold uppercase tracking-wider", d === todayStr ? "text-[color:var(--accent,#3b82f6)]" : isWeekend(d) ? "text-slate-600" : "text-slate-500")}>{dowShort(d)}</p>
              <p className={clsx(
                "mx-auto mt-0.5 w-10 h-10 rounded-full flex items-center justify-center text-lg font-semibold tabular-nums motion-safe:transition-colors",
                d === todayStr ? "bg-[color:var(--accent,#3b82f6)] text-white" : "text-slate-200",
              )}>{day}</p>
              <p className="text-[10px] text-slate-600 mt-0.5">{MONTHS_SHORT[m]}</p>
            </button>
            <div className="flex-1 min-w-0 space-y-2">
              {relLabel && <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{relLabel}</p>}
              {(byDay.get(d) ?? []).map(it => <ItemRow key={it.key} it={it} h24={h24} onOpen={onOpen} />)}
            </div>
          </section>
        );
      })}
      <div className="text-center pt-2">
        <button onClick={onMore} className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900">Show 60 more days</button>
      </div>
      <p className="sr-only">Starts {from}</p>
    </div>
  );
}
