"use client";
import { useRef, useState, type ReactNode, type PointerEvent as ReactPointerEvent } from "react";
import { Minus, Maximize2, Minimize2, X } from "lucide-react";
import clsx from "clsx";
import { clampGeom, DOCK_CLEARANCE, EDGE, MIN_H, MIN_W, type WinGeom, type WinState } from "@/lib/floatingWindows";
import s from "./floating.module.css";

interface Props {
  title: string;
  icon: ReactNode;
  /** Background of the small icon square in the title bar. */
  tint: string;
  state: WinState;
  zIndex: number;
  front: boolean;
  sheet: boolean;
  closing: boolean;
  onFocus: () => void;
  onCommit: (g: WinGeom) => void;
  onMinimise: () => void;
  onToggleMax: () => void;
  onClose: () => void;
  children: ReactNode;
}

type Gesture = { kind: "move" | "resize"; px: number; py: number; start: WinGeom; pointerId: number };

/**
 * One floating window: glass title bar (drag), corner grip (resize),
 * minimise / maximise / close. Geometry is kept locally while a gesture is
 * in progress and committed to the layout on release, so dragging doesn't
 * re-render the whole layer — or the window's contents — on every move.
 */
export default function FloatingWindow({
  title, icon, tint, state, zIndex, front, sheet, closing,
  onFocus, onCommit, onMinimise, onToggleMax, onClose, children,
}: Props) {
  const [live, setLive] = useState<WinGeom | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const liveRef = useRef<WinGeom | null>(null);

  const maxGeom: WinGeom | null = state.maximised && typeof window !== "undefined"
    ? { x: EDGE, y: EDGE, w: window.innerWidth - EDGE * 2, h: Math.max(MIN_H, window.innerHeight - EDGE - DOCK_CLEARANCE) }
    : null;
  const g = live ?? maxGeom ?? state;

  function begin(kind: Gesture["kind"], e: ReactPointerEvent<HTMLElement>) {
    if (sheet || e.button !== 0) return;
    if (kind === "move" && (e.target as HTMLElement).closest("button")) return;
    if (state.maximised) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    gesture.current = { kind, px: e.clientX, py: e.clientY, start: { x: state.x, y: state.y, w: state.w, h: state.h }, pointerId: e.pointerId };
    onFocus();
  }

  function move(e: ReactPointerEvent<HTMLElement>) {
    const gs = gesture.current;
    if (!gs || gs.pointerId !== e.pointerId) return;
    const dx = e.clientX - gs.px;
    const dy = e.clientY - gs.py;
    const next = gs.kind === "move"
      ? clampGeom({ ...gs.start, x: gs.start.x + dx, y: gs.start.y + dy })
      : clampGeom({
          ...gs.start,
          w: Math.max(MIN_W, Math.min(gs.start.w + dx, window.innerWidth - gs.start.x - EDGE)),
          h: Math.max(MIN_H, Math.min(gs.start.h + dy, window.innerHeight - gs.start.y - EDGE)),
        });
    liveRef.current = next;
    setLive(next);
  }

  function end(e: ReactPointerEvent<HTMLElement>) {
    const gs = gesture.current;
    if (!gs || gs.pointerId !== e.pointerId) return;
    gesture.current = null;
    if (liveRef.current) onCommit(liveRef.current);
    liveRef.current = null;
    setLive(null);
  }

  const style = sheet
    ? { zIndex }
    : { zIndex, left: g.x, top: g.y, width: g.w, height: g.h };

  return (
    <section
      role="dialog"
      aria-label={title}
      className={clsx(s.win, front && s.front, sheet && s.sheet, live && s.dragging, closing && s.closing)}
      style={style}
      onPointerDownCapture={onFocus}
    >
      <header
        className={s.titlebar}
        onPointerDown={e => begin("move", e)}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onDoubleClick={e => { if (!sheet && !(e.target as HTMLElement).closest("button")) onToggleMax(); }}
      >
        {sheet && <span className={s.grabber} aria-hidden />}
        <span className={s.titleIcon} style={{ background: tint }} aria-hidden>{icon}</span>
        <span className={s.titleText}>{title}</span>
        <button type="button" className={s.titleBtn} onClick={onMinimise} title="Minimise to dock" aria-label="Minimise">
          <Minus size={14} />
        </button>
        {!sheet && (
          <button type="button" className={s.titleBtn} onClick={onToggleMax} title={state.maximised ? "Restore" : "Maximise"} aria-label={state.maximised ? "Restore" : "Maximise"}>
            {state.maximised ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        )}
        <button type="button" className={clsx(s.titleBtn, s.closeBtn)} onClick={onClose} title="Close" aria-label="Close">
          <X size={14} />
        </button>
      </header>
      <div className={s.body}>{children}</div>
      {!sheet && !state.maximised && (
        <div
          className={s.resize}
          onPointerDown={e => begin("resize", e)}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          aria-hidden
        />
      )}
    </section>
  );
}
