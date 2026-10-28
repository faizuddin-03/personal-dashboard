// Custom calendar events, stored in localStorage `calendar_events`.
// Every field added after the first version is optional, so older saved
// events still load unchanged.

export type EventColor = "blue" | "green" | "red" | "yellow" | "orange" | "pink" | "teal" | "purple" | "slate";

export type EventCategory = "deployment" | "testing" | "meeting" | "leave" | "personal" | "other";
export type EventRecurrence = "none" | "daily" | "weekly" | "monthly";

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
  // ── Added 2026-10 (all optional) ──
  category?: EventCategory;
  jiraKey?: string;
  recurrence?: EventRecurrence;
  /** Last date (inclusive) a recurring event repeats on. Empty = forever. */
  recurrenceUntil?: string;
  /** Occurrence start dates skipped for a recurring event. */
  exceptions?: string[];
  /** Minutes before start to show a browser notification. Undefined = none. */
  reminderMin?: number;
  updatedAt?: string;
  // ── Added 2026-10-26, leave only (optional) ──
  /** Leave length. Undefined on older leave events = full day. */
  leaveDuration?: "full" | "half";
  /** Which half, when leaveDuration is "half". */
  leaveHalf?: "am" | "pm";
}

/** "Leave", "Half-day leave (AM)" … for a leave event. */
export function leaveLabel(e: Pick<CalendarEvent, "leaveDuration" | "leaveHalf">): string {
  return e.leaveDuration === "half" ? `Half-day leave (${(e.leaveHalf ?? "am").toUpperCase()})` : "Leave";
}

export const EVENT_COLOR_META: Record<EventColor, { label: string; dot: string; chipBg: string; hex: string }> = {
  blue:   { label: "Blue",   dot: "bg-blue-400",   chipBg: "bg-blue-900/50 border-blue-700/50 text-blue-200",       hex: "#3b82f6" },
  green:  { label: "Green",  dot: "bg-green-400",  chipBg: "bg-green-900/50 border-green-700/50 text-green-200",    hex: "#10b981" },
  red:    { label: "Red",    dot: "bg-red-400",    chipBg: "bg-red-900/50 border-red-700/50 text-red-200",          hex: "#ef4444" },
  yellow: { label: "Yellow", dot: "bg-yellow-400", chipBg: "bg-yellow-900/50 border-yellow-700/50 text-yellow-200", hex: "#eab308" },
  orange: { label: "Orange", dot: "bg-orange-400", chipBg: "bg-orange-900/50 border-orange-700/50 text-orange-200", hex: "#f59e0b" },
  pink:   { label: "Pink",   dot: "bg-pink-400",   chipBg: "bg-pink-900/50 border-pink-700/50 text-pink-200",       hex: "#ec4899" },
  teal:   { label: "Teal",   dot: "bg-teal-400",   chipBg: "bg-teal-900/50 border-teal-700/50 text-teal-200",       hex: "#14b8a6" },
  purple: { label: "Purple", dot: "bg-purple-400", chipBg: "bg-purple-900/40 border-purple-700/50 text-purple-200", hex: "#8b5cf6" },
  slate:  { label: "Slate",  dot: "bg-slate-400",  chipBg: "bg-slate-800 border-slate-700 text-slate-300",          hex: "#64748b" },
};

export const EVENT_CATEGORY_META: Record<EventCategory, { label: string; color: EventColor }> = {
  deployment: { label: "Deployment", color: "purple" },
  testing:    { label: "Testing",    color: "green"  },
  meeting:    { label: "Meeting",    color: "blue"   },
  leave:      { label: "Leave",      color: "yellow" },
  personal:   { label: "Personal",   color: "pink"   },
  other:      { label: "Other",      color: "slate"  },
};

export const EVENT_CATEGORIES = Object.keys(EVENT_CATEGORY_META) as EventCategory[];

/** Display colour (hex) for an event — its category colour, or the legacy colour. */
export function eventHex(e: Pick<CalendarEvent, "color" | "category">): string {
  if (e.category) return EVENT_COLOR_META[EVENT_CATEGORY_META[e.category].color].hex;
  return (EVENT_COLOR_META[e.color] ?? EVENT_COLOR_META.blue).hex;
}

export function getCalendarEvents(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(localStorage.getItem("calendar_events") ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  }
  catch { return []; }
}

export function saveCalendarEvents(items: CalendarEvent[]) {
  try { localStorage.setItem("calendar_events", JSON.stringify(items)); }
  catch { /* storage full or blocked — keep in-memory state */ }
}

export function dateInRange(date: string, startDate: string, endDate: string): boolean {
  return date >= startDate && date <= endDate;
}
