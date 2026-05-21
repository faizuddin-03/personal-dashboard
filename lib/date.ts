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

/**
 * Returns a JQL date range for a given date (YYYY-MM-DD).
 * Sends date-only strings so Jira parses them in the user's own Jira
 * profile timezone rather than treating them as UTC.
 */
export function jqlDayRange(dateStr: string): { from: string; to: string } {
  return { from: dateStr, to: dateStr };
}

/** @deprecated Use jqlDayRange(todayLocal()) — this sends UTC datetimes which
 *  Jira misinterprets when the user's Jira timezone is not UTC. */
export function todayRangeUTC(): { from: string; to: string } {
  const todayMY = todayLocal();
  const start = new Date(`${todayMY}T00:00:00+08:00`);
  const end   = new Date(`${todayMY}T23:59:59+08:00`);
  const fmt = (d: Date) => d.toISOString().slice(0, 16).replace("T", " ");
  return { from: fmt(start), to: fmt(end) };
}
