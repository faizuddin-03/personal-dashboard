"use client";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { TODOS_UPDATED_EVENT } from "@/lib/todo";

// localStorage-backed external store. Snapshots are the raw strings, so React
// only re-renders when the stored value really changed. Server snapshot is null.

export function readRaw(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

const PREFS_EVENT = "todo-prefs-updated";

function subscribe(cb: () => void) {
  const onStorage = (e: StorageEvent) => { if (!e.key || e.key.startsWith("todo_")) cb(); };
  window.addEventListener(TODOS_UPDATED_EVENT, cb);
  window.addEventListener(PREFS_EVENT, cb);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(TODOS_UPDATED_EVENT, cb);
    window.removeEventListener(PREFS_EVENT, cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Raw stored string for a key; "" when missing; null during SSR / hydration. */
export function useStoredRaw(key: string): string | null {
  return useSyncExternalStore(subscribe, () => readRaw(key) ?? "", () => null);
}

/** JSON value stored under `key`, merged over `fallback`, with a setter. */
export function useStoredJson<T extends object>(key: string, fallback: T): [T, (patch: Partial<T>) => void] {
  const raw = useStoredRaw(key);
  const value = useMemo<T>(() => {
    if (!raw) return fallback;
    try { return { ...fallback, ...JSON.parse(raw) }; } catch { return fallback; }
    // fallback is expected to be a module constant
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);
  const set = useCallback((patch: Partial<T>) => {
    let current: T = fallback;
    try { const r = readRaw(key); if (r) current = { ...fallback, ...JSON.parse(r) }; } catch { /* keep fallback */ }
    try { localStorage.setItem(key, JSON.stringify({ ...current, ...patch })); } catch { /* storage unavailable */ }
    try { window.dispatchEvent(new CustomEvent(PREFS_EVENT)); } catch { /* no window */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [value, set];
}
