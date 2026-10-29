"use client";
import { Pause, Play, Square, Timer, X } from "lucide-react";
import clsx from "clsx";
import { mmss, type useFocusTimer } from "./useFocusTimer";

type TimerApi = ReturnType<typeof useFocusTimer>;

/** The running focus session. Renders nothing when no timer is active. */
export default function FocusTimerBar({ timer, compact }: { timer: TimerApi; compact?: boolean }) {
  const { state, running, elapsed, remaining } = timer;
  if (!state) return null;
  const pct = state.durationSec > 0 ? (elapsed / state.durationSec) * 100 : 0;

  return (
    <div className={clsx(
      "relative overflow-hidden rounded-2xl border border-rose-500/30 bg-rose-500/5",
      compact ? "px-3 py-2" : "px-4 py-3",
    )}>
      <div className="absolute inset-y-0 left-0 bg-rose-500/10 transition-[width] duration-1000 ease-linear" style={{ width: `${pct}%` }} />
      <div className="relative flex items-center gap-3">
        <span className={clsx("flex items-center justify-center rounded-full bg-rose-500/15 text-rose-400 shrink-0", compact ? "w-7 h-7" : "w-9 h-9")}>
          <Timer size={compact ? 14 : 17} className={running ? "motion-safe:animate-pulse" : ""} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] uppercase tracking-wider text-rose-400 font-semibold">{running ? "Focusing" : "Paused"}</p>
          <p className="text-sm text-slate-200 truncate">{state.title}</p>
        </div>
        <span className={clsx("font-mono tabular-nums text-slate-100 shrink-0", compact ? "text-base" : "text-xl")}>{mmss(remaining)}</span>
        <div className="flex items-center gap-1 shrink-0">
          {running ? (
            <button type="button" onClick={timer.pause} title="Pause" aria-label="Pause timer" className={btn}><Pause size={14} /></button>
          ) : (
            <button type="button" onClick={timer.resume} title="Resume" aria-label="Resume timer" className={btn}><Play size={14} /></button>
          )}
          <button type="button" onClick={() => timer.stop(true)} title="Stop and record time" aria-label="Stop and record time" className={btn}><Square size={13} /></button>
          {!compact && (
            <button type="button" onClick={() => timer.stop(false)} title="Discard session" aria-label="Discard session" className={btn}><X size={14} /></button>
          )}
        </div>
      </div>
    </div>
  );
}

const btn = "p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500";
