"use client";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { LayoutGrid, StickyNote, ListTodo, Timer, ClipboardPen, Flame, ChevronRight } from "lucide-react";
import clsx from "clsx";
import {
  clampGeom, loadLayout, saveLayout,
  type FloatingLayout, type FloatingWinId, type WinGeom,
} from "@/lib/floatingWindows";
import { formatClock, streakDays, todayCount, startTimer, pauseTimer } from "@/lib/floatingTimer";
import FloatingWindow from "./FloatingWindow";
import FocusTimer from "./FocusTimer";
import Scratchpad from "./Scratchpad";
import { NotesPanel, TodoPanel } from "./MiniPanels";
import { useFocusTimer } from "./useFocusTimer";
import s from "./floating.module.css";

interface WinDef {
  id: FloatingWinId;
  title: string;
  icon: (size: number) => ReactNode;
  tint: string;
  /** KeyboardEvent.code used with Alt. */
  code: string;
  keyLabel: string;
  /** Created once, so re-rendering the layer never re-renders window contents. */
  content: ReactNode;
}

const DEFS: WinDef[] = [
  { id: "notes",   title: "Notes",       icon: n => <StickyNote size={n} />,   tint: "linear-gradient(135deg,#f59e0b,#f97316)", code: "KeyN", keyLabel: "Alt N", content: <NotesPanel /> },
  { id: "todo",    title: "To-do",       icon: n => <ListTodo size={n} />,     tint: "linear-gradient(135deg,#10b981,#06b6d4)", code: "KeyT", keyLabel: "Alt T", content: <TodoPanel /> },
  { id: "timer",   title: "Focus timer", icon: n => <Timer size={n} />,        tint: "linear-gradient(135deg,#f43f5e,#ec4899)", code: "KeyP", keyLabel: "Alt P", content: <FocusTimer /> },
  { id: "scratch", title: "Scratchpad",  icon: n => <ClipboardPen size={n} />, tint: "linear-gradient(135deg,#6366f1,#8b5cf6)", code: "KeyS", keyLabel: "Alt S", content: <Scratchpad /> },
];

const DOCK_KEY = { code: "Backquote", label: "Alt `" };
const CLOSE_MS = 150;
const Z_BASE = 60;

// Narrow or touch-first screens get one bottom-sheet window at a time.
const SHEET_QUERY = "(max-width: 640px), (pointer: coarse) and (max-width: 1024px)";
function subscribeSheet(cb: () => void) {
  const mq = window.matchMedia(SHEET_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getSheet = () => window.matchMedia(SHEET_QUERY).matches;
const getSheetServer = () => false;

/**
 * In-page floating windows (Notes, To-do, Focus timer, Scratchpad) plus the
 * bottom-right dock that launches them. Mounted once in AppShell, which
 * never unmounts on client navigation, so windows stay open across pages;
 * layout is also persisted to localStorage for reloads.
 */
export default function FloatingLayer() {
  const [layout, setLayout] = useState<FloatingLayout>(loadLayout);
  const [closing, setClosing] = useState<Set<FloatingWinId>>(() => new Set());
  const sheet = useSyncExternalStore(subscribeSheet, getSheet, getSheetServer);
  const closeTimers = useRef<Map<FloatingWinId, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => { saveLayout(layout); }, [layout]);

  // Re-clamp every window when the viewport changes, so none ends up off-screen.
  useEffect(() => {
    let raf = 0;
    function onResize() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setLayout(l => {
          const wins = { ...l.wins };
          for (const d of DEFS) wins[d.id] = clampGeom(wins[d.id]);
          return { ...l, wins };
        });
      });
    }
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const timers = closeTimers.current;
    return () => { timers.forEach(clearTimeout); };
  }, []);

  const front = [...layout.order].reverse().find(id => layout.wins[id].open && !layout.wins[id].minimised) ?? null;

  const bringToFront = useCallback((id: FloatingWinId) => {
    setLayout(l => (l.order[l.order.length - 1] === id ? l : { ...l, order: [...l.order.filter(x => x !== id), id] }));
  }, []);

  const patch = useCallback((id: FloatingWinId, p: Partial<FloatingLayout["wins"][FloatingWinId]>) => {
    setLayout(l => ({ ...l, wins: { ...l.wins, [id]: { ...l.wins[id], ...p } } }));
  }, []);

  const close = useCallback((id: FloatingWinId) => {
    setClosing(c => new Set(c).add(id));
    const prev = closeTimers.current.get(id);
    if (prev) clearTimeout(prev);
    closeTimers.current.set(id, setTimeout(() => {
      closeTimers.current.delete(id);
      setClosing(c => { const n = new Set(c); n.delete(id); return n; });
      patch(id, { open: false, minimised: false });
    }, CLOSE_MS));
  }, [patch]);

  /** Dock button / shortcut: open, restore, raise — or minimise if already on top. */
  const activate = useCallback((id: FloatingWinId) => {
    setLayout(l => {
      const w = l.wins[id];
      const topVisible = [...l.order].reverse().find(x => l.wins[x].open && !l.wins[x].minimised);
      if (w.open && !w.minimised && topVisible === id) {
        return { ...l, wins: { ...l.wins, [id]: { ...w, minimised: true } } };
      }
      return {
        ...l,
        wins: { ...l.wins, [id]: { ...w, open: true, minimised: false } },
        order: [...l.order.filter(x => x !== id), id],
      };
    });
  }, []);

  const toggleDock = useCallback(() => setLayout(l => ({ ...l, dockExpanded: !l.dockExpanded })), []);

  // Alt+N / Alt+T / Alt+P / Alt+S toggle windows; Alt+` expands the dock.
  // Alt-only (no Ctrl/Meta/Shift) so Ctrl/Cmd+K search and AltGr typing are untouched.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat) return;
      if (e.code === DOCK_KEY.code) { e.preventDefault(); toggleDock(); return; }
      const def = DEFS.find(d => d.code === e.code);
      if (def) { e.preventDefault(); activate(def.id); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activate, toggleDock]);

  return (
    <div className={s.layer}>
      {DEFS.map(d => {
        const w = layout.wins[d.id];
        if (!w.open || w.minimised) return null;
        if (sheet && d.id !== front) return null;
        return (
          <FloatingWindow
            key={d.id}
            title={d.title}
            icon={d.icon(13)}
            tint={d.tint}
            state={w}
            zIndex={Z_BASE + layout.order.indexOf(d.id)}
            front={front === d.id}
            sheet={sheet}
            closing={closing.has(d.id)}
            onFocus={() => bringToFront(d.id)}
            onCommit={(g: WinGeom) => patch(d.id, g)}
            onMinimise={() => patch(d.id, { minimised: true })}
            onToggleMax={() => patch(d.id, { maximised: !w.maximised })}
            onClose={() => close(d.id)}
          >
            {d.content}
          </FloatingWindow>
        );
      })}

      <nav
        aria-label="Floating tools"
        className={clsx(s.dock, layout.dockExpanded && s.dockOpen, sheet && s.dockSheetMode)}
      >
        <DockStatus onOpenTimer={() => activate("timer")} />

        {layout.dockExpanded && (
          <div className={s.dockItems}>
            <span className={s.divider} aria-hidden />
            {DEFS.map(d => {
              const w = layout.wins[d.id];
              return (
                <button
                  key={d.id}
                  type="button"
                  className={clsx(s.dockBtn, s.hasTip, front === d.id && s.dockBtnActive)}
                  onClick={() => activate(d.id)}
                  aria-label={`${d.title} (${d.keyLabel})`}
                >
                  {d.icon(17)}
                  {w.open && <span className={clsx(s.dockDot, w.minimised && s.dockDotMin)} aria-hidden />}
                  <span className={s.tip}>
                    {d.title}{w.open && w.minimised ? " (minimised)" : ""}<kbd>{d.keyLabel}</kbd>
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          className={clsx(s.dockBtn, s.dockToggle, s.hasTip)}
          onClick={toggleDock}
          aria-expanded={layout.dockExpanded}
          aria-label={layout.dockExpanded ? "Collapse tools" : "Open tools"}
        >
          {layout.dockExpanded ? <ChevronRight size={17} /> : <LayoutGrid size={16} />}
          <span className={clsx(s.tip, s.tipRight)}>
            {layout.dockExpanded ? "Collapse" : "Notes, to-do, timer, scratchpad"}<kbd>{DOCK_KEY.label}</kbd>
          </span>
        </button>
      </nav>
    </div>
  );
}

/** Timer clock + today's session count. Its own component so the timer tick re-renders only this. */
function DockStatus({ onOpenTimer }: { onOpenTimer: () => void }) {
  const { t, leftMs: left } = useFocusTimer();
  const running = t.endsAt !== null;
  const phaseFull = (t.phase === "focus" ? t.focusMin : t.breakMin) * 60_000;
  const showClock = running || left < phaseFull;
  const today = todayCount(t);
  const streak = streakDays(t);

  return (
    <>
      {showClock && (
        <button
          type="button"
          className={clsx(s.chip, s.chipButton, s.hasTip, t.phase === "focus" ? s.chipFocus : s.chipBreak)}
          onClick={running ? pauseTimer : startTimer}
          style={{ position: "relative" }}
        >
          <Timer size={12} />
          {formatClock(left)}
          <span className={clsx(s.tip, s.tipRight)}>{running ? "Pause" : "Resume"} {t.phase === "focus" ? "focus" : "break"}</span>
        </button>
      )}
      <button
        type="button"
        className={clsx(s.chip, s.chipButton, s.hasTip)}
        style={{ position: "relative" }}
        onClick={onOpenTimer}
        aria-label={`${today} focus sessions today, ${streak} day streak. Open focus timer`}
      >
        <Flame size={12} className={clsx(s.flame, today > 0 && s.flameLit)} />
        {today}
        <span className={clsx(s.tip, s.tipRight)}>
          {today} focus session{today === 1 ? "" : "s"} today · {streak} day streak
        </span>
      </button>
    </>
  );
}
