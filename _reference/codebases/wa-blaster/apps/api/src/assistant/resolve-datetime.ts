// apps/api/src/assistant/resolve-datetime.ts

const KL_OFFSET_MIN = 8 * 60; // UTC+8, no DST
const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const PART_HOURS: Record<string, number> = { morning: 9, afternoon: 14, evening: 19, night: 20, noon: 12 };

interface KlParts { y: number; m: number; d: number; weekday: number }

/** Civil date/time fields in KL for a given instant. */
function klParts(now: Date): KlParts {
  const kl = new Date(now.getTime() + KL_OFFSET_MIN * 60_000);
  return { y: kl.getUTCFullYear(), m: kl.getUTCMonth(), d: kl.getUTCDate(), weekday: kl.getUTCDay() };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Build an ISO string for a KL civil date at the given hour. */
function klIso(y: number, m: number, d: number, hour: number): string {
  // Normalize the calendar (handles month/day rollover) via a UTC date.
  const base = new Date(Date.UTC(y, m, d));
  return `${base.getUTCFullYear()}-${pad(base.getUTCMonth() + 1)}-${pad(base.getUTCDate())}T${pad(hour)}:00:00+08:00`;
}

/**
 * Turn a natural-language phrase into a concrete KL ISO timestamp.
 * Handles: weekday names (optionally "next"), today/tomorrow, parts of day
 * (morning/afternoon/evening/night/noon), and explicit "8am"/"2 pm" times.
 * Returns { error } when it can't confidently parse — the caller re-asks.
 */
export function resolveDatetime(phrase: string, now: Date): { sendAt: string } | { error: string } {
  const text = phrase.toLowerCase().trim();
  const { y, m, d, weekday } = klParts(now);

  // ---- hour ----
  let hour: number | null = null;
  const explicit = text.match(/(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)?/);
  for (const [part, h] of Object.entries(PART_HOURS)) {
    if (new RegExp(`\\b${part}\\b`).test(text)) hour = h;
  }
  if (explicit && explicit[1] && (explicit[3] || !hour)) {
    let h = parseInt(explicit[1], 10);
    const mer = explicit[3];
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    if (h >= 0 && h <= 23) hour = h;
  }
  if (hour === null) hour = 9; // sensible default: morning

  // ---- day ----
  let addDays: number | null = null;
  if (text.includes('today')) addDays = 0;
  else if (text.includes('tomorrow')) addDays = 1;
  else {
    const wdIndex = WEEKDAYS.findIndex((w) => text.includes(w));
    if (wdIndex >= 0) {
      let delta = (wdIndex - weekday + 7) % 7;
      if (delta === 0) delta = 7; // "monday" on a Monday means next Monday
      if (text.includes('next')) delta = ((wdIndex - weekday + 7) % 7) || 7;
      addDays = delta;
    }
  }

  if (addDays === null) return { error: `Could not parse a date/time from "${phrase}"` };
  return { sendAt: klIso(y, m, d + addDays, hour) };
}
