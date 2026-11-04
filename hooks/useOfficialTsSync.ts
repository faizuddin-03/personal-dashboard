"use client";
// Keeps the TS Tracker in step with the official TS sheets (Faizuddin,
// 2026-11-03). Polls /api/ts-tracker/official every 10 s while the tab is
// visible and applies it only when a sheet's file changed. Mounted once in
// components/AppShell.tsx, so the tracker stays current on every page.
import { useEffect } from "react";
import { syncOfficialIntoTracker, type OfficialTicket } from "@/lib/tsTrackerOfficialSync";

const POLL_MS = 10_000;

export function useOfficialTsSync() {
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const seen = new Map<string, number>(); // key -> file mtime last applied
    const tick = async () => {
      if (stopped) return;
      if (document.visibilityState === "visible") {
        try {
          const res = await fetch("/api/ts-tracker/official", { cache: "no-store" });
          if (res.ok) {
            const body = (await res.json()) as { tickets?: OfficialTicket[] };
            const fresh = (body.tickets ?? []).filter(t => seen.get(t.key) !== t.mtimeMs);
            if (fresh.length) {
              syncOfficialIntoTracker(fresh);
              for (const t of fresh) seen.set(t.key, t.mtimeMs);
            }
          }
        } catch { /* server busy or offline: try again next tick */ }
      }
      if (!stopped) timer = setTimeout(tick, POLL_MS);
    };
    void tick();
    return () => { stopped = true; if (timer) clearTimeout(timer); };
  }, []);
}
