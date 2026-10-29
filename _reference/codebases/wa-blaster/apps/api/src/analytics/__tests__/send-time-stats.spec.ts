import { computeSendTimeStats } from '../send-time-stats';

// 2026-06-08 is a Monday (weekday 1). KL = UTC+8.
// KL hour H on that day → UTC = (H-8):00Z.
const readKL = (hourUtcIso: string) => ({ readAt: new Date(hourUtcIso), repliedAt: null });
const replyKL = (hourUtcIso: string) => ({ readAt: null, repliedAt: new Date(hourUtcIso) });
const HOUR20_MON = '2026-06-08T12:00:00Z'; // 20:00 KL Monday
const HOUR09_MON = '2026-06-08T01:00:00Z'; // 09:00 KL Monday
const HOUR20_SUN = '2026-06-07T12:00:00Z'; // 20:00 KL Sunday

describe('computeSendTimeStats', () => {
  it('returns INSUFFICIENT with no recommendation below the minimum', () => {
    const events = Array.from({ length: 5 }, () => readKL(HOUR20_MON));
    const r = computeSendTimeStats({ events, minEvents: 30 });
    expect(r.confidence).toBe('INSUFFICIENT');
    expect(r.recommendation).toBeNull();
    expect(r.totalEvents).toBe(5);
  });

  it('picks the peak hour band and reports the share', () => {
    const events = Array.from({ length: 40 }, () => readKL(HOUR20_MON));
    const r = computeSendTimeStats({ events, minEvents: 30 });
    expect(r.confidence).toBe('LOW'); // 40 < 100
    expect(r.recommendation).toEqual({ hourStart: 19, hourEnd: 21, days: [1, 2, 3, 4, 5], share: 100 });
  });

  it('weights replies above reads (replies can win a quieter hour)', () => {
    const events = [
      ...Array.from({ length: 10 }, () => readKL(HOUR09_MON)), // hour 9: weight 10
      ...Array.from({ length: 4 }, () => replyKL(HOUR20_MON)), // hour 20: weight 12
    ];
    const r = computeSendTimeStats({ events, minEvents: 5 });
    expect(r.totalEvents).toBe(14);
    expect(r.recommendation!.hourStart).toBe(19);
    expect(r.recommendation!.hourEnd).toBe(21);
  });

  it('omits the day qualifier when engagement is spread across the week', () => {
    const events = [
      ...Array.from({ length: 20 }, () => readKL(HOUR20_MON)), // weekday
      ...Array.from({ length: 20 }, () => readKL(HOUR20_SUN)), // weekend
    ];
    const r = computeSendTimeStats({ events, minEvents: 30 });
    expect(r.recommendation!.days).toBeNull();
  });

  it('escalates confidence with sample size', () => {
    const at = (n: number) => Array.from({ length: n }, () => readKL(HOUR20_MON));
    expect(computeSendTimeStats({ events: at(29), minEvents: 30 }).confidence).toBe('INSUFFICIENT');
    expect(computeSendTimeStats({ events: at(30), minEvents: 30 }).confidence).toBe('LOW');
    expect(computeSendTimeStats({ events: at(100), minEvents: 30 }).confidence).toBe('MEDIUM');
    expect(computeSendTimeStats({ events: at(400), minEvents: 30 }).confidence).toBe('HIGH');
  });
});
