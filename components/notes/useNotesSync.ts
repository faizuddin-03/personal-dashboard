"use client";
// Keeps several views of localStorage `notes` in step: the /notes page, the
// mini notes panel, other tabs. Each view passes its own source id so it can
// ignore the event its own save fired.
import { useEffect, useRef } from "react";
import { NOTES_EVENT } from "@/lib/notes-store";

export function useNotesSync(source: string, onExternalChange: () => void) {
  const cb = useRef(onExternalChange);
  useEffect(() => { cb.current = onExternalChange; });

  useEffect(() => {
    function onLocal(e: Event) {
      const src = (e as CustomEvent<{ source?: string }>).detail?.source;
      if (src !== source) cb.current();
    }
    function onStorage(e: StorageEvent) {
      if (e.key === "notes") cb.current();
    }
    window.addEventListener(NOTES_EVENT, onLocal);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(NOTES_EVENT, onLocal);
      window.removeEventListener("storage", onStorage);
    };
  }, [source]);
}

/** Recently opened note ids (per browser, newest first). */
const RECENT_KEY = "notes-recent";
export function getRecentIds(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]"); } catch { return []; }
}
export function pushRecentId(id: string) {
  try {
    const next = [id, ...getRecentIds().filter(x => x !== id)].slice(0, 8);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* storage blocked */ }
}
