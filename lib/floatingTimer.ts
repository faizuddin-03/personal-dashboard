/**
 * Focus timer (pomodoro) store for the floating windows.
 *
 * Lives at module level, not in a component, so the countdown keeps going
 * while the timer window is closed and the dock can show it. A running
 * timer is stored as an absolute end time, so it also survives a reload.
 * Subscribe with React's useSyncExternalStore.
 */

export type TimerPhase = "focus" | "break";

export interface TimerState {
  phase: TimerPhase;
  focusMin: number;
  breakMin: number;
  /** Epoch ms when the running phase ends; null while paused/idle. */
  endsAt: number | null;
  /** Time left while paused. */
  remainingMs: number;
  /** User opted in to a browser notification at the end of a phase. */
  notify: boolean;
  /** Completed focus sessions per local day, "YYYY-MM-DD" → count. */
  history: Record<string, number>;
}

const KEY = "floating_timer_v1";
const HISTORY_DAYS = 60;

export const DEFAULT_FOCUS_MIN = 25;
export const DEFAULT_BREAK_MIN = 5;

export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const SERVER_STATE: TimerState = {
  phase: "focus",
  focusMin: DEFAULT_FOCUS_MIN,
  breakMin: DEFAULT_BREAK_MIN,
  endsAt: null,
  remainingMs: DEFAULT_FOCUS_MIN * 60_000,
  notify: false,
  history: {},
};

let state: TimerState = SERVER_STATE;
let loaded = false;
let ticker: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<() => void>();

function clampMin(n: number, max: number): number {
  if (!Number.isFinite(n)) return 1;
  return Math.min(Math.max(Math.round(n), 1), max);
}

function load(): void {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<TimerState>;
      const focusMin = clampMin(Number(p.focusMin ?? DEFAULT_FOCUS_MIN), 180);
      const breakMin = clampMin(Number(p.breakMin ?? DEFAULT_BREAK_MIN), 60);
      state = {
        phase: p.phase === "break" ? "break" : "focus",
        focusMin,
        breakMin,
        endsAt: typeof p.endsAt === "number" ? p.endsAt : null,
        remainingMs: typeof p.remainingMs === "number" ? p.remainingMs : focusMin * 60_000,
        notify: !!p.notify,
        history: p.history && typeof p.history === "object" ? p.history : {},
      };
    }
  } catch { /* corrupt or blocked storage — defaults */ }
  syncTicker();
}

function persist(): void {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

function set(next: TimerState): void {
  state = next;
  persist();
  syncTicker();
  listeners.forEach(l => l());
}

function phaseMs(phase: TimerPhase, s: TimerState = state): number {
  return (phase === "focus" ? s.focusMin : s.breakMin) * 60_000;
}

function syncTicker(): void {
  if (typeof window === "undefined") return;
  if (state.endsAt !== null && !ticker) {
    ticker = setInterval(checkDone, 1000);
    checkDone();
  } else if (state.endsAt === null && ticker) {
    clearInterval(ticker);
    ticker = null;
  }
}

function pruneHistory(h: Record<string, number>): Record<string, number> {
  const keys = Object.keys(h).sort();
  if (keys.length <= HISTORY_DAYS) return h;
  const keep: Record<string, number> = {};
  keys.slice(-HISTORY_DAYS).forEach(k => { keep[k] = h[k]; });
  return keep;
}

function checkDone(): void {
  if (state.endsAt === null || Date.now() < state.endsAt) return;
  const lateMs = Date.now() - state.endsAt;
  const finished = state.phase;
  let history = state.history;
  if (finished === "focus") {
    const k = dayKey(new Date(state.endsAt));
    history = pruneHistory({ ...history, [k]: (history[k] ?? 0) + 1 });
  }
  const nextPhase: TimerPhase = finished === "focus" ? "break" : "focus";
  set({ ...state, history, phase: nextPhase, endsAt: null, remainingMs: phaseMs(nextPhase) });
  // Only make noise if we were around when it ended, not on a reload hours later.
  if (lateMs < 60_000) announce(finished);
}

// ── Public API ────────────────────────────────────────────────

export function subscribeTimer(cb: () => void): () => void {
  load();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function getTimerSnapshot(): TimerState {
  load();
  return state;
}

export function getTimerServerSnapshot(): TimerState {
  return SERVER_STATE;
}

export function timeLeftMs(s: TimerState, now: number): number {
  return s.endsAt !== null ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

export function startTimer(): void {
  if (state.endsAt !== null) return;
  const left = state.remainingMs > 0 ? state.remainingMs : phaseMs(state.phase);
  set({ ...state, endsAt: Date.now() + left });
}

export function pauseTimer(): void {
  if (state.endsAt === null) return;
  set({ ...state, remainingMs: Math.max(0, state.endsAt - Date.now()), endsAt: null });
}

export function resetTimer(): void {
  set({ ...state, endsAt: null, remainingMs: phaseMs(state.phase) });
}

/** Jump to the other phase without counting the current one. */
export function switchPhase(phase: TimerPhase): void {
  set({ ...state, phase, endsAt: null, remainingMs: phaseMs(phase) });
}

export function setLengths(focusMin: number, breakMin: number): void {
  const next = { ...state, focusMin: clampMin(focusMin, 180), breakMin: clampMin(breakMin, 60) };
  // A paused, untouched phase picks up the new length straight away.
  if (next.endsAt === null) next.remainingMs = phaseMs(next.phase, next);
  set(next);
}

export function setNotify(on: boolean): void {
  set({ ...state, notify: on });
}

export function todayCount(s: TimerState): number {
  return s.history[dayKey()] ?? 0;
}

/** Consecutive days, ending today (or yesterday if nothing yet today), with ≥1 session. */
export function streakDays(s: TimerState): number {
  const d = new Date();
  if (!s.history[dayKey(d)]) d.setDate(d.getDate() - 1);
  let n = 0;
  while (s.history[dayKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── End-of-phase signal ───────────────────────────────────────

export function playChime(): void {
  try {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    // Soft two-note bell: C6 then G5, sine with a quick attack and long tail.
    [[1046.5, 0], [783.99, 0.18]].forEach(([freq, at]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + at;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.18, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 1.25);
    });
    setTimeout(() => { ctx.close().catch(() => {}); }, 1800);
  } catch { /* audio blocked — silent */ }
}

function announce(finished: TimerPhase): void {
  playChime();
  if (!state.notify) return;
  try {
    if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
    const today = todayCount(state);
    new Notification(finished === "focus" ? "Focus session done" : "Break over", {
      body: finished === "focus"
        ? `${today} session${today === 1 ? "" : "s"} today. Take ${state.breakMin} min.`
        : `Back to it — ${state.focusMin} min focus.`,
      silent: true,
    });
  } catch { /* notifications unavailable */ }
}
