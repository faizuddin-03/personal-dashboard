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
