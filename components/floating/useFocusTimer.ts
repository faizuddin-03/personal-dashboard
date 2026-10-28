"use client";
import { useEffect, useState, useSyncExternalStore } from "react";
import { getTimerServerSnapshot, getTimerSnapshot, subscribeTimer, type TimerState } from "@/lib/floatingTimer";

/**
 * Timer state from lib/floatingTimer plus `leftMs`, re-computed every half
 * second while the timer runs.
 */
export function useFocusTimer(): { t: TimerState; leftMs: number } {
  const t = useSyncExternalStore(subscribeTimer, getTimerSnapshot, getTimerServerSnapshot);
  const [now, setNow] = useState(0);
  const running = t.endsAt !== null;
  useEffect(() => {
    if (!running) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const id = setInterval(tick, 500);
    return () => { clearTimeout(first); clearInterval(id); };
  }, [running]);

  const full = (t.phase === "focus" ? t.focusMin : t.breakMin) * 60_000;
  // Before the first tick `now` can be stale; never show more than the phase length.
  const leftMs = t.endsAt !== null ? Math.min(full, Math.max(0, t.endsAt - now)) : t.remainingMs;
  return { t, leftMs };
}
