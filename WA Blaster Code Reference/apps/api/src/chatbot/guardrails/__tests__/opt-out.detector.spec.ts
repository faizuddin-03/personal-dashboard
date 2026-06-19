import { OptOutDetector } from '../opt-out.detector';

describe('OptOutDetector', () => {
  const detector = new OptOutDetector();

  it('detects English opt-out keywords', () => {
    expect(detector.detect('STOP')).toBe(true);
    expect(detector.detect('please unsubscribe me')).toBe(true);
    expect(detector.detect('remove me from this list')).toBe(true);
  });

  it('detects Bahasa Malaysia opt-out keywords', () => {
    expect(detector.detect('berhenti')).toBe(true);
    expect(detector.detect('jangan hantar lagi')).toBe(true);
  });

  it('returns false for a normal question', () => {
    expect(detector.detect('What time do you open?')).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(detector.detect('')).toBe(false);
    expect(detector.detect('   ')).toBe(false);
  });
});
