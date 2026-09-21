export type Range = '7d' | '30d' | '90d';

const DAYS: Record<Range, number> = { '7d': 7, '30d': 30, '90d': 90 };
export const rangeDays = (r: Range): number => DAYS[r];

const KL_OFFSET_MS = 8 * 60 * 60 * 1000; // Asia/Kuala_Lumpur, no DST

/** YYYY-MM-DD of the date in Asia/Kuala_Lumpur. */
export function klDayKey(d: Date): string {
  return new Date(d.getTime() + KL_OFFSET_MS).toISOString().slice(0, 10);
}

/** Day-of-week (0=Sun..6=Sat) and hour (0..23) of the date in Asia/Kuala_Lumpur. */
export function klWeekdayHour(d: Date): { weekday: number; hour: number } {
  const kl = new Date(d.getTime() + KL_OFFSET_MS);
  return { weekday: kl.getUTCDay(), hour: kl.getUTCHours() };
}

/** N ascending KL day keys ending on `now`'s KL day. */
export function lastNDayKeys(n: number, now: Date): string[] {
  const keys: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    keys.push(klDayKey(new Date(now.getTime() - i * 86_400_000)));
  }
  return keys;
}

/** Percent change cur vs prev, 1-decimal; 0 if both 0, 100 if prev 0. */
export function pctDelta(cur: number, prev: number): number {
  if (prev === 0) return cur === 0 ? 0 : 100;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

/** part/whole as a 1-decimal percentage; 0 when whole is 0. */
export function rate(part: number, whole: number): number {
  return whole === 0 ? 0 : Math.round((part / whole) * 1000) / 10;
}
