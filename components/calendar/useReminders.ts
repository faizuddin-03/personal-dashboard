// Browser-notification reminders for custom events. Runs only while the
// calendar page is open. Permission is requested by the sidebar toggle,
// never here.

import { useEffect } from "react";
import { CalendarEvent } from "@/lib/calendar-events";
import { occurrences } from "./model";
import { addDays, epochOf, toMin, today } from "./dates";

const FIRED_KEY = "calendar_reminders_fired";

function readFired(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(FIRED_KEY) ?? "{}"); } catch { return {}; }
}
function writeFired(f: Record<string, number>) {
  // Drop entries older than two days so the map stays small.
  const cutoff = Date.now() - 2 * 86400000;
  const kept = Object.fromEntries(Object.entries(f).filter(([, t]) => t > cutoff));
  try { localStorage.setItem(FIRED_KEY, JSON.stringify(kept)); } catch { /* ignore */ }
}

export function useReminders(events: CalendarEvent[], enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof Notification === "undefined") return;
    function check() {
      if (Notification.permission !== "granted") return;
      const now = Date.now();
      const from = addDays(today(), -1), to = addDays(today(), 2);
      const fired = readFired();
      let changed = false;
      for (const e of events) {
        if (e.reminderMin === undefined || e.reminderMin === null) continue;
        const startMin = e.allDay ? 9 * 60 : (toMin(e.startTime) ?? 9 * 60);
        for (const d of occurrences(e, from, to)) {
          const at = epochOf(d, startMin) - e.reminderMin * 60000;
          const key = `${e.id}:${d}`;
          // Fire once, within 10 minutes after the reminder time.
          if (now >= at && now - at < 10 * 60000 && !fired[key]) {
            fired[key] = now;
            changed = true;
            try {
              const when = e.reminderMin === 0 ? "now" : e.reminderMin >= 1440 ? "tomorrow" : `in ${e.reminderMin} min`;
              new Notification(e.title, { body: `${e.allDay ? "All day" : e.startTime} — starts ${when}`, tag: key });
            } catch { /* notification blocked */ }
          }
        }
      }
      if (changed) writeFired(fired);
    }
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [events, enabled]);
}
