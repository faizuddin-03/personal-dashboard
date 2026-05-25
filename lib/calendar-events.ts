import { remoteSync } from "./remote-sync";
export type EventColor = "blue" | "green" | "red" | "yellow" | "orange" | "pink" | "teal";

export interface CalendarEvent {
  id: string;
  title: string;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD (same as startDate for single-day)
  startTime?: string;  // HH:MM
  endTime?: string;    // HH:MM
  color: EventColor;
  notes: string;
  allDay: boolean;
  createdAt: string;
}

export const EVENT_COLOR_META: Record<EventColor, { label: string; dot: string; chipBg: string }> = {
  blue:   { label: "Blue",   dot: "bg-blue-400",   chipBg: "bg-blue-900/50 border-blue-700/50 text-blue-200"   },
  green:  { label: "Green",  dot: "bg-green-400",  chipBg: "bg-green-900/50 border-green-700/50 text-green-200"  },
  red:    { label: "Red",    dot: "bg-red-400",    chipBg: "bg-red-900/50 border-red-700/50 text-red-200"    },
  yellow: { label: "Yellow", dot: "bg-yellow-400", chipBg: "bg-yellow-900/50 border-yellow-700/50 text-yellow-200" },
  orange: { label: "Orange", dot: "bg-orange-400", chipBg: "bg-orange-900/50 border-orange-700/50 text-orange-200" },
  pink:   { label: "Pink",   dot: "bg-pink-400",   chipBg: "bg-pink-900/50 border-pink-700/50 text-pink-200"   },
  teal:   { label: "Teal",   dot: "bg-teal-400",   chipBg: "bg-teal-900/50 border-teal-700/50 text-teal-200"   },
};

export function getCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem("calendar_events") ?? "[]"); }
  catch { return []; }
}

export function saveCalendarEvents(items: CalendarEvent[]) {
  const json = JSON.stringify(items);
  localStorage.setItem("calendar_events", json);
  remoteSync("calendar_events", json);
}

export function dateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}
