import { resolveDatetime } from '../resolve-datetime';

// Wed 2026-06-17 03:00 UTC === Wed 2026-06-17 11:00 KL.
const NOW = new Date('2026-06-17T03:00:00.000Z');

describe('resolveDatetime (KL timezone)', () => {
  it('resolves "Monday morning" to the next Monday at 09:00 +08:00', () => {
    const out = resolveDatetime('Monday morning', NOW) as { sendAt: string };
    // Next Monday after Wed 2026-06-17 is 2026-06-22.
    expect(out.sendAt).toBe('2026-06-22T09:00:00+08:00');
  });

  it('resolves "tomorrow afternoon" to next day 14:00 +08:00', () => {
    const out = resolveDatetime('tomorrow afternoon', NOW) as { sendAt: string };
    expect(out.sendAt).toBe('2026-06-18T14:00:00+08:00');
  });

  it('resolves an explicit time "friday 8am"', () => {
    const out = resolveDatetime('friday 8am', NOW) as { sendAt: string };
    expect(out.sendAt).toBe('2026-06-19T08:00:00+08:00');
  });

  it('defaults a bare weekday to 09:00', () => {
    const out = resolveDatetime('next monday', NOW) as { sendAt: string };
    expect(out.sendAt).toBe('2026-06-22T09:00:00+08:00');
  });

  it('returns an error for an unparseable phrase', () => {
    const out = resolveDatetime('whenever you feel like it', NOW);
    expect(out).toHaveProperty('error');
  });
});
