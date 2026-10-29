// Date helpers for the calendar. All dates are "YYYY-MM-DD" strings in the
// app timezone (Asia/Kuala_Lumpur, UTC+8, no DST). Arithmetic runs on UTC
// midnights so the browser's own timezone never shifts a day.

import { APP_TIMEZONE, todayLocal } from "@/lib/date";

export const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
export const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
export const WEEKDAYS_SHORT = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DOW_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

/** App timezone offset in minutes (Malaysia, fixed). */
export const TZ_OFFSET_MIN = 8 * 60;

export function today(): string { return todayLocal(); }

function toUTC(d: string): number {
  const [y, m, day] = d.split("-").map(Number);
  return Date.UTC(y, m - 1, day);
}
function fromUTC(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(d: string, n: number): string { return fromUTC(toUTC(d) + n * 86400000); }
export function diffDays(a: string, b: string): number { return Math.round((toUTC(b) - toUTC(a)) / 86400000); }

/** 0 = Sunday … 6 = Saturday */
export function dow(d: string): number { return new Date(toUTC(d)).getUTCDay(); }
export function isWeekend(d: string): boolean { const w = dow(d); return w === 0 || w === 6; }

/** Monday of the week containing d. */
export function startOfWeek(d: string): string { const w = dow(d); return addDays(d, w === 0 ? -6 : 1 - w); }

export function parts(d: string) { const [y, m, day] = d.split("-").map(Number); return { y, m: m - 1, day }; }
export function ymd(y: number, m: number, day: number): string { return fromUTC(Date.UTC(y, m, day)); }

export function startOfMonth(d: string): string { const { y, m } = parts(d); return ymd(y, m, 1); }
export function addMonths(d: string, n: number): string {
  const { y, m, day } = parts(d);
  const last = new Date(Date.UTC(y, m + n + 1, 0)).getUTCDate();
  return ymd(y, m + n, Math.min(day, last));
}
export function daysInMonth(y: number, m: number): number { return new Date(Date.UTC(y, m + 1, 0)).getUTCDate(); }

/** 42 cells (6 weeks), Monday-first, covering the month of d. */
export function monthGrid(d: string): string[] {
  const first = startOfWeek(startOfMonth(d));
  return Array.from({ length: 42 }, (_, i) => addDays(first, i));
}

export function range(start: string, count: number): string[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export function dowShort(d: string): string { return DOW_SHORT[dow(d)]; }

export function fmtLong(d: string): string {
  const { y, m, day } = parts(d);
  return `${DOW_SHORT[dow(d)]}, ${day} ${MONTHS_SHORT[m]} ${y}`;
}
export function fmtShort(d: string): string {
  const { m, day } = parts(d);
  return `${day} ${MONTHS_SHORT[m]}`;
}

// ── Time ──────────────────────────────────────────────────
export function toMin(t?: string): number | undefined {
  if (!t || !/^\d{1,2}:\d{2}/.test(t)) return undefined;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
export function toHHMM(min: number): string {
  const c = Math.max(0, Math.min(24 * 60 - 1, Math.round(min)));
  return `${String(Math.floor(c / 60)).padStart(2, "0")}:${String(c % 60).padStart(2, "0")}`;
}
export function fmtMin(min: number, h24: boolean): string {
  const h = Math.floor(min / 60) % 24, m = Math.round(min % 60);
  if (h24) return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const suffix = h >= 12 ? "pm" : "am";
  const hh = (h % 12) || 12;
  return m === 0 ? `${hh}${suffix}` : `${hh}:${String(m).padStart(2, "0")}${suffix}`;
}
export function fmtHour(h: number, h24: boolean): string {
  if (h24) return `${String(h).padStart(2, "0")}:00`;
  return `${(h % 12) || 12} ${h >= 12 ? "PM" : "AM"}`;
}

/** Epoch ms for a wall-clock date/time in the app timezone. */
export function epochOf(d: string, min: number): number {
  return toUTC(d) + (min - TZ_OFFSET_MIN) * 60000;
}

/** Current minutes since midnight in the app timezone. */
export function nowMinutes(): number {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: APP_TIMEZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const h = Number(p.find(x => x.type === "hour")?.value ?? 0);
  const m = Number(p.find(x => x.type === "minute")?.value ?? 0);
  return h * 60 + m;
}
