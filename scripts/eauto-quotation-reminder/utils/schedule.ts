import { CONFIG, CRON, type ScheduleMode } from '../data/config';

// ── When the quotation is stamped ───────────────────────────
// The cron picks a quotation up on the NEXT hourly run, so the minute the
// quotation lands is the variable several cases are built around:
//   TS01  1 minute before the hour   → 10:59 quotation, 11:00 email
//   TS02  exactly on the hour
//   TS07  after the last run (23:00) → no email until 07:00
//
// Nothing here reads the clock at import time — every helper takes `now` so it
// can be tested and so a long-held process never uses a stale reference.

export const fmt = (d: Date) =>
  `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;

/** The moment the quotation should be generated, for the chosen mode. */
export function targetTime(mode: ScheduleMode, at: string, now = new Date()): Date {
  switch (mode) {
    case 'now':
      return now;

    case 'on-hour': {
      // Despite the name, this lands on the next CRON.intervalMinutes grid
      // mark, not literally :00 — with the default 60-minute interval the two
      // are the same thing. `[from Faizuddin, 2026-08-18]`
      const interval = CRON.intervalMinutes;
      const t = new Date(now);
      const rounded = Math.ceil(t.getMinutes() / interval) * interval;
      t.setMinutes(rounded, 0, 0);
      if (t <= now) t.setMinutes(t.getMinutes() + interval);
      return t;
    }

    case 'before-hour': {
      // One minute before the next grid mark (the old ":59" was just the
      // 60-minute-interval instance of this).
      const interval = CRON.intervalMinutes;
      const t = new Date(now);
      const rounded = Math.ceil(t.getMinutes() / interval) * interval;
      t.setMinutes(rounded - 1, 0, 0);
      if (t <= now) t.setMinutes(t.getMinutes() + interval);
      return t;
    }

    case 'at': {
      // datetime-local has no timezone — it means local time, which is what
      // the cron runs on. `new Date('...')` on a bare local string is
      // interpreted as local, which is the behaviour we want here.
      const t = new Date(at);
      if (Number.isNaN(t.getTime())) throw new Error(`Unparseable scheduled time: "${at}"`);
      return t;
    }
  }
}

/**
 * The next cron run at or after `from`. Generalised from "on the hour" to an
 * arbitrary `CRON.intervalMinutes` grid, anchored at `firstHour:00` — with the
 * default interval (60) this reduces to exactly the old hourly behaviour.
 * `[from Faizuddin, 2026-08-18]`
 */
export function nextCronRun(from: Date): Date {
  const { firstHour, lastHour, intervalMinutes } = CRON;
  const startOfDay = (d: Date, dayOffset: number): Date => {
    const t = new Date(d);
    t.setHours(0, 0, 0, 0);
    t.setDate(t.getDate() + dayOffset);
    return t;
  };
  const atMinute = (dayStart: Date, minuteOfDay: number): Date => {
    const t = new Date(dayStart);
    t.setMinutes(minuteOfDay);
    return t;
  };

  const startMin = firstHour * 60;
  const endMin = lastHour * 60;
  // Fractional so a run stamped exactly on a grid minute (0 seconds) counts as
  // "now", while a few seconds past it correctly rolls to the NEXT grid point
  // — the same "at or after" semantics the old `t <= now` check had.
  const nowMin = from.getHours() * 60 + from.getMinutes() + from.getSeconds() / 60;

  if (nowMin <= startMin) return atMinute(startOfDay(from, 0), startMin);
  if (nowMin > endMin) return atMinute(startOfDay(from, 1), startMin);

  const steps = Math.ceil((nowMin - startMin) / intervalMinutes);
  const targetMin = startMin + steps * intervalMinutes;
  if (targetMin > endMin) return atMinute(startOfDay(from, 1), startMin);
  return atMinute(startOfDay(from, 0), targetMin);
}

/**
 * True when a quotation generated at `t` falls in the dead window — after the
 * last run of the day and before the first of the next. TS07's whole premise.
 *
 * Uses fractional minutes (seconds included), not just `getMinutes()`. A
 * whole-minutes comparison would treat `23:00:01`–`23:00:59` as "races the
 * last run" (not dead) the same as `23:00:00` itself — wrong, since the run
 * already fired a second earlier. That gap existed in the original hourly
 * version too; it only surfaces reliably once the grid gets fine enough
 * (10-minute testing cadence) that landing inside it stops being a
 * coincidence. `[fixed by Faizuddin, 2026-08-18]`
 */
export function inDeadWindow(t: Date): boolean {
  const m = t.getHours() * 60 + t.getMinutes() + t.getSeconds() / 60;
  const startMin = CRON.firstHour * 60;
  const endMin = CRON.lastHour * 60;
  if (m < startMin) return true;   // before the first run
  if (m > endMin) return true;     // after the last run
  // m === endMin RACES the last run rather than missing it — not dead.
  return false;
}

/**
 * Block until `target`, logging progress so a run that sits idle for 50 minutes
 * doesn't look hung. Returns immediately when the target has passed.
 */
export async function holdUntil(target: Date, label: string): Promise<void> {
  const waitMs = target.getTime() - Date.now();
  if (waitMs <= 0) {
    console.log(`[schedule] ${label} — target ${fmt(target)} already passed, continuing now`);
    return;
  }
  console.log(`[schedule] ${label} — holding until ${fmt(target)} (${Math.round(waitMs / 1000)}s)`);

  // Tick every 30s so the run log shows life, and re-derive the remaining time
  // from the clock each round rather than trusting a single long timer.
  while (Date.now() < target.getTime()) {
    const remaining = target.getTime() - Date.now();
    await new Promise((r) => setTimeout(r, Math.min(30_000, remaining)));
    const left = Math.max(0, target.getTime() - Date.now());
    if (left > 0) console.log(`[schedule] ${label} — ${Math.round(left / 1000)}s to go`);
  }
  console.log(`[schedule] ${label} — reached ${fmt(new Date())}`);
}

/** Resolve and hold for the run's configured schedule. Returns when it's time. */
export async function holdForSchedule(label = 'quotation'): Promise<Date> {
  const target = targetTime(CONFIG.scheduleMode, CONFIG.scheduleAt);
  await holdUntil(target, `${label} (${CONFIG.scheduleMode})`);
  return target;
}
