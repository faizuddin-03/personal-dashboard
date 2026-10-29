import { rangeDays, klDayKey, klWeekdayHour, lastNDayKeys, pctDelta, rate } from '../analytics.util';

describe('analytics.util', () => {
  it('rangeDays maps the three ranges', () => {
    expect(rangeDays('7d')).toBe(7);
    expect(rangeDays('30d')).toBe(30);
    expect(rangeDays('90d')).toBe(90);
  });

  it('klDayKey buckets by Asia/Kuala_Lumpur (UTC+8) day', () => {
    expect(klDayKey(new Date('2026-06-07T20:00:00Z'))).toBe('2026-06-08');
    expect(klDayKey(new Date('2026-06-07T10:00:00Z'))).toBe('2026-06-07');
  });

  it('klWeekdayHour returns KL (UTC+8) weekday and hour', () => {
    // 2026-06-07T20:00Z → 2026-06-08T04:00 KL → Monday(1), hour 4
    expect(klWeekdayHour(new Date('2026-06-07T20:00:00Z'))).toEqual({ weekday: 1, hour: 4 });
    // 2026-06-07T10:00Z → 2026-06-07T18:00 KL → Sunday(0), hour 18
    expect(klWeekdayHour(new Date('2026-06-07T10:00:00Z'))).toEqual({ weekday: 0, hour: 18 });
  });

  it('lastNDayKeys returns N ascending KL day keys ending today', () => {
    const now = new Date('2026-06-07T10:00:00Z');
    expect(lastNDayKeys(3, now)).toEqual(['2026-06-05', '2026-06-06', '2026-06-07']);
  });

  it('lastNDayKeys uses the KL day across the midnight boundary', () => {
    const now = new Date('2026-06-07T16:05:00Z'); // 00:05 KL on 2026-06-08
    expect(lastNDayKeys(3, now)).toEqual(['2026-06-06', '2026-06-07', '2026-06-08']);
  });

  it('pctDelta computes rounded percent change, guarding divide-by-zero', () => {
    expect(pctDelta(110, 100)).toBe(10);
    expect(pctDelta(0, 0)).toBe(0);
    expect(pctDelta(5, 0)).toBe(100);
  });

  it('rate is part/whole as a 1-decimal percentage, 0 when whole is 0', () => {
    expect(rate(1, 4)).toBe(25);
    expect(rate(1, 3)).toBe(33.3);
    expect(rate(5, 0)).toBe(0);
  });
});
