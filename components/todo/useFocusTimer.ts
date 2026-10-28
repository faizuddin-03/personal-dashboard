"use client";
import { useCallback, useEffect, useState } from "react";
import { logFocus } from "@/lib/todo";
import { addTimeToTask } from "./useTodos";
import { burstFrom } from "./confetti";

// One shared timer for every open view (the /todo page and the floating mini).
const TIMER_KEY = "todo_focus_timer";
const TIMER_EVENT = "todo-timer-updated";

export interface FocusTimerState {
  taskId: string;
  title: string;
  durationSec: number;
  /** ms timestamp of the current running stretch, or null when paused */
  startedAt: number | null;
  /** seconds banked from earlier stretches */
  banked: number;
}

function read(): FocusTimerState | null {
  try {
    const v = JSON.parse(localStorage.getItem(TIMER_KEY) ?? "null");
    return v && typeof v === "object" && typeof v.taskId === "string" ? v : null;
  } catch { return null; }
}

function write(s: FocusTimerState | null) {
  try {
    if (s) localStorage.setItem(TIMER_KEY, JSON.stringify(s));
    else localStorage.removeItem(TIMER_KEY);
  } catch { /* storage unavailable */ }
  try { window.dispatchEvent(new CustomEvent(TIMER_EVENT)); } catch { /* no window */ }
}

export function elapsedOf(s: FocusTimerState, now = Date.now()): number {
  return s.banked + (s.startedAt ? (now - s.startedAt) / 1000 : 0);
}

/** Stop and record. Re-reads storage so two views cannot record twice. */
function finish(record: boolean): number {
  const s = read();
  if (!s) return 0;
  write(null);
  const sec = Math.min(elapsedOf(s), s.durationSec);
  if (record && sec >= 5) {
    addTimeToTask(s.taskId, sec);
    logFocus({ id: s.taskId, at: new Date().toISOString(), sec: Math.round(sec) });
  }
  return sec;
}

export const FOCUS_PRESETS = [15, 25, 50];

export function useFocusTimer(onComplete?: (title: string, sec: number) => void) {
  const [state, setState] = useState<FocusTimerState | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const sync = () => { setState(read()); setNow(Date.now()); };
    sync();
    const onStorage = (e: StorageEvent) => { if (!e.key || e.key === TIMER_KEY) sync(); };
    window.addEventListener(TIMER_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(TIMER_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const running = !!state?.startedAt;

  useEffect(() => {
    if (!running) return;
    const iv = window.setInterval(() => {
      const s = read();
      setNow(Date.now());
      if (s && s.startedAt && elapsedOf(s) >= s.durationSec) {
        const sec = finish(true);
        if (sec > 0) {
          burstFrom(null, true);
          onComplete?.(s.title, sec);
        }
      }
    }, 1000);
    return () => window.clearInterval(iv);
  }, [running, onComplete]);

  const start = useCallback((taskId: string, title: string, minutes = 25) => {
    if (read()) finish(true); // switching task records the previous stretch
    write({ taskId, title, durationSec: minutes * 60, startedAt: Date.now(), banked: 0 });
  }, []);

  const pause = useCallback(() => {
    const s = read();
    if (!s || !s.startedAt) return;
    write({ ...s, banked: elapsedOf(s), startedAt: null });
  }, []);

  const resume = useCallback(() => {
    const s = read();
    if (!s || s.startedAt) return;
    write({ ...s, startedAt: Date.now() });
  }, []);

  const stop = useCallback((record = true) => finish(record), []);

  const elapsed = state ? Math.min(elapsedOf(state, now), state.durationSec) : 0;
  const remaining = state ? Math.max(0, state.durationSec - elapsed) : 0;

  return { state, running, elapsed, remaining, start, pause, resume, stop };
}

export function mmss(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}
