"use client";
import { useState } from "react";
import { Play, Pause, RotateCcw, Bell, BellOff, Flame, Coffee, Target } from "lucide-react";
import clsx from "clsx";
import NumericTextInput from "@/components/NumericTextInput";
import {
  formatClock, pauseTimer, playChime, resetTimer, setLengths, setNotify, startTimer,
  streakDays, switchPhase, todayCount,
} from "@/lib/floatingTimer";
import { useFocusTimer } from "./useFocusTimer";

const PRESETS: [number, number][] = [[25, 5], [50, 10], [15, 3]];

export default function FocusTimer() {
  const { t, leftMs: left } = useFocusTimer();
  const [notifyMsg, setNotifyMsg] = useState<string | null>(null);
  const running = t.endsAt !== null;
  const total = (t.phase === "focus" ? t.focusMin : t.breakMin) * 60_000;
  const progress = total > 0 ? 1 - left / total : 0;
  const today = todayCount(t);
  const streak = streakDays(t);
  const isFocus = t.phase === "focus";
  const ringColor = isFocus ? "#fb7185" : "#34d399";

  const R = 70;
  const C = 2 * Math.PI * R;

  async function toggleNotify() {
    if (t.notify) { setNotify(false); setNotifyMsg(null); return; }
    if (typeof Notification === "undefined") { setNotifyMsg("This browser has no notifications."); return; }
    let perm = Notification.permission;
    if (perm === "default") {
      try { perm = await Notification.requestPermission(); } catch { perm = "denied"; }
    }
    if (perm === "granted") { setNotify(true); setNotifyMsg(null); }
    else setNotifyMsg("Notifications are blocked for this site. The chime still plays.");
  }

  return (
    <div className="h-full flex flex-col items-center gap-3 px-4 pt-3 pb-4 text-slate-300">
      {/* Phase switch */}
      <div className="flex gap-1 p-0.5 rounded-full bg-slate-800 text-[11.5px] font-semibold">
        {(["focus", "break"] as const).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => { if (p !== t.phase) switchPhase(p); }}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 rounded-full transition-colors",
              t.phase === p ? "bg-slate-950 text-slate-100 shadow-sm" : "text-slate-400 hover:text-slate-200",
            )}
          >
            {p === "focus" ? <Target size={12} /> : <Coffee size={12} />}
            {p === "focus" ? "Focus" : "Break"}
          </button>
        ))}
      </div>

      {/* Ring */}
      <div className="relative w-[164px] h-[164px] shrink-0">
        <svg viewBox="0 0 164 164" className="w-full h-full -rotate-90">
          <circle cx="82" cy="82" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
          <circle
            cx="82" cy="82" r={R} fill="none" stroke={ringColor} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - Math.min(1, Math.max(0, progress)))}
            style={{ transition: "stroke-dashoffset 0.5s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[34px] font-bold tabular-nums text-slate-100 leading-none">{formatClock(left)}</span>
          <span className="mt-1.5 text-[11px] uppercase tracking-wider text-slate-500">
            {running ? (isFocus ? "focusing" : "on break") : "paused"}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={running ? pauseTimer : startTimer}
          className="flex items-center gap-1.5 px-5 h-9 rounded-full text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors"
        >
          {running ? <Pause size={15} /> : <Play size={15} />}
          {running ? "Pause" : "Start"}
        </button>
        <button
          type="button"
          onClick={resetTimer}
          title="Reset this phase"
          className="grid place-items-center w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
        >
          <RotateCcw size={15} />
        </button>
        <button
          type="button"
          onClick={toggleNotify}
          title={t.notify ? "Browser notification on — click to turn off" : "Notify me when a phase ends"}
          className={clsx(
            "grid place-items-center w-9 h-9 rounded-full transition-colors",
            t.notify ? "bg-blue-600/20 text-blue-400" : "bg-slate-800 hover:bg-slate-700 text-slate-400",
          )}
        >
          {t.notify ? <Bell size={15} /> : <BellOff size={15} />}
        </button>
      </div>
      {notifyMsg && <p className="text-[11px] text-amber-400 text-center -mt-1">{notifyMsg}</p>}

      {/* Stats */}
      <div className="flex items-center gap-3 text-[12px] text-slate-400">
        <span className="flex items-center gap-1">
          <Flame size={13} className={today > 0 ? "text-amber-400" : "text-slate-600"} />
          <b className="text-slate-200">{today}</b> today
        </span>
        <span className="text-slate-700">|</span>
        <span><b className="text-slate-200">{streak}</b> day streak</span>
        <SessionDots count={today} />
      </div>

      {/* Lengths */}
      <div className="w-full mt-auto pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2 text-[11.5px] text-slate-400">
        <label className="flex items-center gap-1">
          Focus
          <NumericTextInput
            value={t.focusMin} min={1} max={180}
            onChange={v => setLengths(v, t.breakMin)}
            className="w-11 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-center"
          />
        </label>
        <label className="flex items-center gap-1">
          Break
          <NumericTextInput
            value={t.breakMin} min={1} max={60}
            onChange={v => setLengths(t.focusMin, v)}
            className="w-11 px-1.5 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-200 text-center"
          />
        </label>
        <span>min</span>
        <div className="flex gap-1 ml-auto">
          {PRESETS.map(([f, b]) => (
            <button
              key={f}
              type="button"
              onClick={() => setLengths(f, b)}
              className={clsx(
                "px-1.5 py-0.5 rounded-md border text-[11px] transition-colors",
                t.focusMin === f && t.breakMin === b
                  ? "border-blue-500/60 text-blue-400"
                  : "border-slate-700 text-slate-500 hover:text-slate-300",
              )}
            >
              {f}/{b}
            </button>
          ))}
          <button type="button" onClick={playChime} title="Preview the chime" className="px-1.5 py-0.5 rounded-md border border-slate-700 text-slate-500 hover:text-slate-300">
            <Bell size={11} />
          </button>
        </div>
      </div>
    </div>
  );
}

/** Up to 8 little tomatoes-as-dots for today's sessions; a "+n" past that. */
function SessionDots({ count }: { count: number }) {
  if (count === 0) return null;
  const shown = Math.min(count, 8);
  return (
    <span className="flex items-center gap-0.5" aria-label={`${count} sessions today`}>
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-rose-400" />
      ))}
      {count > shown && <span className="ml-0.5 text-[10px] text-slate-500">+{count - shown}</span>}
    </span>
  );
}
