import { ComplaintDetector } from '../complaint.detector';

describe('ComplaintDetector', () => {
  const detector = new ComplaintDetector();

  it('detects English complaint signals', () => {
    expect(detector.detect('This is terrible, I want a refund!')).toBe(true);
    expect(detector.detect('You guys are a scam')).toBe(true);
    expect(detector.detect('I am so disappointed with the service')).toBe(true);
  });

  it('detects Bahasa Malaysia complaint signals', () => {
    expect(detector.detect('saya nak komplen')).toBe(true);
    expect(detector.detect('servis sangat teruk')).toBe(true);
  });

  it('returns false for a neutral question', () => {
    expect(detector.detect('What time do you open?')).toBe(false);
  });

  it('returns false for empty input', () => {
    expect(detector.detect('')).toBe(false);
  });
});
