import { normalizeState } from '../state-normalizer';

describe('normalizeState', () => {
  it('maps canonical names', () => {
    expect(normalizeState('Penang')).toBe('PENANG');
    expect(normalizeState('Selangor')).toBe('SELANGOR');
    expect(normalizeState('Kelantan')).toBe('KELANTAN');
  });

  it('maps common aliases', () => {
    expect(normalizeState('Pulau Pinang')).toBe('PENANG');
    expect(normalizeState('PNG')).toBe('PENANG');
    expect(normalizeState('KL')).toBe('KUALA_LUMPUR');
    expect(normalizeState('W.P. Kuala Lumpur')).toBe('KUALA_LUMPUR');
    expect(normalizeState('Wilayah Persekutuan Kuala Lumpur')).toBe('KUALA_LUMPUR');
    expect(normalizeState('Malacca')).toBe('MELAKA');
    expect(normalizeState('N. Sembilan')).toBe('NEGERI_SEMBILAN');
  });

  it('is case- and whitespace-insensitive', () => {
    expect(normalizeState('  penang ')).toBe('PENANG');
    expect(normalizeState('SELANGOR')).toBe('SELANGOR');
    expect(normalizeState('kuala lumpur')).toBe('KUALA_LUMPUR');
  });

  it('accepts the enum value itself', () => {
    expect(normalizeState('NEGERI_SEMBILAN')).toBe('NEGERI_SEMBILAN');
    expect(normalizeState('KUALA_LUMPUR')).toBe('KUALA_LUMPUR');
  });

  it('returns null for unknown or empty', () => {
    expect(normalizeState('Atlantis')).toBeNull();
    expect(normalizeState('')).toBeNull();
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState(undefined)).toBeNull();
  });
});
