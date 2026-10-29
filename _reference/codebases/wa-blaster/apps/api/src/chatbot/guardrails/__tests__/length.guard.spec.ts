import { LengthGuard } from '../length.guard';

describe('LengthGuard', () => {
  const guard = new LengthGuard();

  it('passes a normal-length body', () => {
    expect(guard.check('We open at 9am daily.')).toEqual({ ok: true, reason: '' });
  });

  it('fails an empty body', () => {
    expect(guard.check('')).toEqual({ ok: false, reason: 'length:empty' });
    expect(guard.check('   ')).toEqual({ ok: false, reason: 'length:empty' });
  });

  it('fails a body over the 800-char soft cap', () => {
    const result = guard.check('a'.repeat(801));
    expect(result).toEqual({ ok: false, reason: 'length:too_long' });
  });

  it('fails a body over the 4096-char Meta hard limit with a distinct reason', () => {
    const result = guard.check('a'.repeat(4097));
    expect(result).toEqual({ ok: false, reason: 'length:exceeds_whatsapp_limit' });
  });
});
