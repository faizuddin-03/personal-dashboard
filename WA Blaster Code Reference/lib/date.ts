export const APP_TIMEZONE = "Asia/Kuala_Lumpur";

/** Returns today's date as YYYY-MM-DD in the app timezone. */
export function todayLocal(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(new Date());
}

/** Returns a date N days from today as YYYY-MM-DD in the app timezone. */
export function daysFromToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return new Intl.DateTimeFormat("en-CA", { timeZone: APP_TIMEZONE }).format(d);
}

const JIRA_MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/**
 * Returns JQL created-range clauses for a given YYYY-MM-DD date.
 * Uses startOfDay()/endOfDay() with a day offset so Jira applies the
 * user's profile timezone consistently — avoids UTC mismatch on past dates.
 */
export function jqlCreatedRange(isoDate: string): string {
  const today = todayLocal();
  const diff = Math.round(
    (new Date(isoDate + "T12:00:00").getTime() - new Date(today + "T12:00:00").getTime())
    / 86400000
  );
  if (diff === 0) return `created >= startOfDay() AND created <= endOfDay()`;
  const offset = diff > 0 ? `"+${diff}"` : `"${diff}"`;
  return `created >= startOfDay(${offset}) AND created <= endOfDay(${offset})`;
}

/** @deprecated Use jqlCreatedRange(todayLocal()) */
export function jqlDayRange(dateStr: string): { from: string; to: string } {
  return { from: dateStr, to: dateStr };
}

/** @deprecated */
export function todayRangeUTC(): { from: string; to: string } {
  const todayMY = todayLocal();
  const start = new Date(`${todayMY}T00:00:00+08:00`);
  const end   = new Date(`${todayMY}T23:59:59+08:00`);
  const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
  return { from: fmt(start), to: fmt(end) };
}
