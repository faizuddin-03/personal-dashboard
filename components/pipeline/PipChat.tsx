"use client";
// Floating (picture-in-picture) chat for /pipeline/<KEY> (Faizuddin, 2026-10-29:
// "put the chats with the characters in PIP, but it will only show in that
// details page ... will show again if i open that ticket again"). Rendered by
// the ticket page itself, so leaving the page hides it; which chat is popped
// out and where the window sits are kept per ticket in localStorage.
// An in-page window, not the browser's Document PiP: that one needs a click
// every time, so it could not come back on its own when the ticket reopens.
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { PictureInPicture2, Minus, X, Maximize2 } from "lucide-react";
import clsx from "clsx";
import CharacterSprite, { CHARACTER_INFO } from "@/components/pipeline/CharacterSprite";
import type { Character } from "@/lib/pipeline/types";

export const PIP_CHARACTERS = ["scout", "scribe", "elf", "dwarf"] as const;
export type PipCharacter = (typeof PIP_CHARACTERS)[number];

interface PipState { character: PipCharacter; x: number; y: number; minimized: boolean }

const storeKey = (ticket: string) => `pipeline-pip:${ticket}`;
const WIDTH = 384;

function readState(ticket: string): PipState | null {
  try {
    const raw = localStorage.getItem(storeKey(ticket));
    const s = raw ? JSON.parse(raw) as Partial<PipState> : null;
    if (!s || !PIP_CHARACTERS.includes(s.character as PipCharacter)) return null;
    return { character: s.character as PipCharacter, x: Number(s.x) || 0, y: Number(s.y) || 0, minimized: !!s.minimized };
  } catch { return null; }
}

function writeState(ticket: string, s: PipState | null) {
  try {
    if (s) localStorage.setItem(storeKey(ticket), JSON.stringify(s));
    else localStorage.removeItem(storeKey(ticket));
  } catch { /* storage blocked: the window still works, it just is not remembered */ }
}

/** Keeps the window's title bar on screen. */
function clamp(x: number, y: number) {
  const w = Math.min(WIDTH, window.innerWidth - 16);
  return {
    x: Math.max(8, Math.min(x, window.innerWidth - w - 8)),
    y: Math.max(8, Math.min(y, window.innerHeight - 48)),
  };
}

/** Pop-out state for one ticket. `popped` is the character shown in the floating window, if any. */
export function usePipChat(ticket: string) {
  const [state, setState] = useState<PipState | null>(null);

  // Read after mount: localStorage does not exist during the server render.
  useEffect(() => {
    const id = setTimeout(() => setState(readState(ticket)), 0);
    return () => clearTimeout(id);
  }, [ticket]);

  const update = useCallback((s: PipState | null) => { setState(s); writeState(ticket, s); }, [ticket]);

  const popOut = useCallback((character: PipCharacter) => {
    setState(prev => {
      const pos = prev ?? clamp(window.innerWidth - WIDTH - 24, window.innerHeight - 560);
      const next = { character, x: pos.x, y: pos.y, minimized: false };
      writeState(ticket, next);
      return next;
    });
  }, [ticket]);

  return { state, popped: state?.character ?? null, popOut, update };
}

/** Header button that pops a character's chat out. */
export function PopOutButton({ onClick, name }: { onClick: () => void; name: string }) {
  return (
    <button type="button" onClick={onClick} title={`Pop out the ${name} chat`} aria-label={`Pop out the ${name} chat`}
      className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800">
      <PictureInPicture2 size={14} aria-hidden />
    </button>
  );
}

/** Shown where the chat used to be while it is popped out. */
export function PoppedNote({ name, onBack }: { name: string; onBack: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-400">
      <PictureInPicture2 size={13} aria-hidden /> The {name} chat is in the floating window.
      <button type="button" onClick={onBack} className="text-blue-400 hover:underline">Put it back here</button>
    </p>
  );
}

export default function PipChat({ pip, waiting, render }: {
  pip: ReturnType<typeof usePipChat>;
  /** Characters waiting for an answer: a dot on their tab. */
  waiting: Partial<Record<Character, boolean>>;
  render: (c: PipCharacter) => ReactNode;
}) {
  const { state, update } = pip;
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  // Pull the window back on screen when the browser window shrinks.
  useEffect(() => {
    if (!state) return;
    const onResize = () => {
      const c = clamp(state.x, state.y);
      if (c.x !== state.x || c.y !== state.y) update({ ...state, ...c });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [state, update]);

  if (!state) return null;
  const at = pos ?? clamp(state.x, state.y);

  function onDown(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest("button")) return;
    drag.current = { dx: e.clientX - at.x, dy: e.clientY - at.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function onMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (drag.current) setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  }
  function onUp() {
    if (!drag.current) return;
    drag.current = null;
    if (pos) update({ ...state!, ...pos });
    setPos(null);
  }

  return (
    <div role="dialog" aria-label={`Chat with ${CHARACTER_INFO[state.character].name}`}
      className="fixed z-40 flex flex-col rounded-xl border border-slate-700 bg-slate-900 shadow-2xl shadow-black/60"
      style={{ left: at.x, top: at.y, width: `min(${WIDTH}px, calc(100vw - 16px))` }}>
      <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
        className="flex items-center gap-1 px-2 py-1.5 border-b border-slate-800 cursor-move select-none touch-none">
        <div className="flex items-center gap-0.5" role="tablist" aria-label="Character">
          {PIP_CHARACTERS.map(c => (
            <button key={c} type="button" role="tab" aria-selected={c === state.character} title={CHARACTER_INFO[c].name}
              onClick={() => update({ ...state, character: c, minimized: false })}
              className={clsx("relative p-1 rounded-md", c === state.character ? "bg-slate-800" : "opacity-60 hover:opacity-100")}>
              <CharacterSprite character={c} size={22} />
              {waiting[c] && <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-amber-400" aria-label="waiting for you" />}
            </button>
          ))}
        </div>
        <span className="flex-1 truncate px-1 text-xs font-semibold text-slate-200">{CHARACTER_INFO[state.character].name}</span>
        <button type="button" onClick={() => update({ ...state, minimized: !state.minimized })}
          aria-label={state.minimized ? "Expand" : "Minimise"} className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800">
          {state.minimized ? <Maximize2 size={13} aria-hidden /> : <Minus size={13} aria-hidden />}
        </button>
        <button type="button" onClick={() => update(null)} aria-label="Close the floating chat"
          className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800">
          <X size={14} aria-hidden />
        </button>
      </div>
      {!state.minimized && <div className="p-3 max-h-[70vh] overflow-y-auto">{render(state.character)}</div>}
    </div>
  );
}
