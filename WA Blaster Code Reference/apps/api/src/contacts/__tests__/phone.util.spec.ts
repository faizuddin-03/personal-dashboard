import { normalizePhoneE164, classifyNumberType } from '../phone.util';

describe('normalizePhoneE164', () => {
  it('normalizes a local Malaysian mobile (starts with 01...) to +60', () => {
    expect(normalizePhoneE164('0123456789')).toBe('+60123456789');
  });

  it('normalizes a number with spaces and dashes', () => {
    expect(normalizePhoneE164('012-345 6789')).toBe('+60123456789');
  });

  it('keeps already-E164 format unchanged', () => {
    expect(normalizePhoneE164('+60123456789')).toBe('+60123456789');
  });

  it('normalizes a number with country code but no plus (60...)', () => {
    expect(normalizePhoneE164('60123456789')).toBe('+60123456789');
  });

  it('throws on a number that is too short to be valid', () => {
    expect(() => normalizePhoneE164('123')).toThrow(/invalid phone/i);
  });

  it('throws on a number with letters', () => {
    expect(() => normalizePhoneE164('phone-number')).toThrow(/invalid phone/i);
  });

  it('throws on empty input', () => {
    expect(() => normalizePhoneE164('')).toThrow(/invalid phone/i);
  });
});

describe('classifyNumberType', () => {
  it.each(['0123456789', '+60123456789', '012-345 6789', '0112345678', '0193334444'])(
    'classifies Malaysian mobile %s as PHONE',
    (n) => expect(classifyNumberType(n)).toBe('PHONE'),
  );

  it.each(['0312345678', '+60312345678', '042618000', '088123456', '099012345'])(
    'classifies Malaysian fixed-line %s as LANE',
    (n) => expect(classifyNumberType(n)).toBe('LANE'),
  );

  it('defaults to PHONE for an unparseable number (never auto-opts-out)', () => {
    expect(classifyNumberType('not-a-phone')).toBe('PHONE');
    expect(classifyNumberType('')).toBe('PHONE');
  });
});
