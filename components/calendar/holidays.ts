// STATIC list of Malaysian public holidays (federal + Kuala Lumpur), 2026–2027.
// Typed in by hand on 2026-10-21 — NOT fetched from any official source.
// Holidays tied to the Islamic, Chinese or Hindu calendars move by a day or
// so once the official announcement is made; those carry `approx: true`.
// Check against the gazetted JPM list before relying on a date for mandays.

export interface Holiday {
  date: string;   // YYYY-MM-DD
  name: string;
  approx?: boolean;
  /** Replacement day (cuti ganti) for a holiday that falls on a weekend. */
  replacement?: boolean;
}

export const HOLIDAYS_SOURCE_NOTE = "Static list (2026–2027), typed in by hand. Lunar-calendar dates are estimates — check the official JPM list.";

export const MY_HOLIDAYS: Holiday[] = [
  // ── 2026 ──
  { date: "2026-01-01", name: "New Year's Day" },
  { date: "2026-02-01", name: "Thaipusam", approx: true },
  { date: "2026-02-01", name: "Federal Territory Day" },
  { date: "2026-02-02", name: "Thaipusam / FT Day (replacement)", replacement: true, approx: true },
  { date: "2026-02-17", name: "Chinese New Year", approx: true },
  { date: "2026-02-18", name: "Chinese New Year (Day 2)", approx: true },
  { date: "2026-03-07", name: "Nuzul Al-Quran", approx: true },
  { date: "2026-03-21", name: "Hari Raya Aidilfitri", approx: true },
  { date: "2026-03-22", name: "Hari Raya Aidilfitri (Day 2)", approx: true },
  { date: "2026-03-23", name: "Hari Raya Aidilfitri (replacement)", replacement: true, approx: true },
  { date: "2026-05-01", name: "Labour Day" },
  { date: "2026-05-27", name: "Hari Raya Haji", approx: true },
  { date: "2026-05-31", name: "Wesak Day", approx: true },
  { date: "2026-06-01", name: "Agong's Birthday" },
  { date: "2026-06-17", name: "Awal Muharram", approx: true },
  { date: "2026-08-25", name: "Maulidur Rasul", approx: true },
  { date: "2026-08-31", name: "Merdeka Day" },
  { date: "2026-09-16", name: "Malaysia Day" },
  { date: "2026-11-08", name: "Deepavali", approx: true },
  { date: "2026-11-09", name: "Deepavali (replacement)", replacement: true, approx: true },
  { date: "2026-12-25", name: "Christmas Day" },
  // ── 2027 ──
  { date: "2027-01-01", name: "New Year's Day" },
  { date: "2027-01-22", name: "Thaipusam", approx: true },
  { date: "2027-02-01", name: "Federal Territory Day" },
  { date: "2027-02-06", name: "Chinese New Year", approx: true },
  { date: "2027-02-07", name: "Chinese New Year (Day 2)", approx: true },
  { date: "2027-02-08", name: "Chinese New Year (replacement)", replacement: true, approx: true },
  { date: "2027-02-24", name: "Nuzul Al-Quran", approx: true },
  { date: "2027-03-10", name: "Hari Raya Aidilfitri", approx: true },
  { date: "2027-03-11", name: "Hari Raya Aidilfitri (Day 2)", approx: true },
  { date: "2027-05-01", name: "Labour Day" },
  { date: "2027-05-17", name: "Hari Raya Haji", approx: true },
  { date: "2027-05-20", name: "Wesak Day", approx: true },
  { date: "2027-06-07", name: "Agong's Birthday" },
  { date: "2027-06-07", name: "Awal Muharram", approx: true },
  { date: "2027-08-15", name: "Maulidur Rasul", approx: true },
  { date: "2027-08-16", name: "Maulidur Rasul (replacement)", replacement: true, approx: true },
  { date: "2027-08-31", name: "Merdeka Day" },
  { date: "2027-09-16", name: "Malaysia Day" },
  { date: "2027-10-28", name: "Deepavali", approx: true },
  { date: "2027-12-25", name: "Christmas Day" },
];

const BY_DATE = new Map<string, Holiday[]>();
for (const h of MY_HOLIDAYS) {
  const list = BY_DATE.get(h.date) ?? [];
  list.push(h);
  BY_DATE.set(h.date, list);
}

export function holidaysOn(date: string): Holiday[] { return BY_DATE.get(date) ?? []; }
export function isHoliday(date: string): boolean { return BY_DATE.has(date); }
