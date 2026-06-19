import { YesNoDetector } from '../yes-no.detector';

describe('YesNoDetector', () => {
  const detector = new YesNoDetector();

  it.each(['yes', 'Yes', 'YES', 'yeah', 'ok', 'okay', 'sure', 'please', 'go ahead', 'do it'])(
    'detects "%s" as yes (EN)',
    (msg) => {
      expect(detector.detect(msg)).toBe('yes');
    },
  );

  it.each(['no', 'No', 'nope', 'not now', 'skip', 'no thanks', "don't bother", 'later'])(
    'detects "%s" as no (EN)',
    (msg) => {
      expect(detector.detect(msg)).toBe('no');
    },
  );

  it.each(['ya', 'ok lah', 'boleh', 'nak', 'setuju', 'sila', 'teruskan'])(
    'detects "%s" as yes (MS)',
    (msg) => {
      expect(detector.detect(msg)).toBe('yes');
    },
  );

  it.each(['tak', 'tidak', 'tak nak', 'tak payah', 'jangan', 'lain kali'])(
    'detects "%s" as no (MS)',
    (msg) => {
      expect(detector.detect(msg)).toBe('no');
    },
  );

  it('treats a question with no yes/no signal as ambiguous', () => {
    expect(detector.detect('What time do you open?')).toBe('ambiguous');
  });

  it('treats an ambivalent message with both signals as ambiguous', () => {
    expect(detector.detect('yes but actually wait')).toBe('ambiguous');
  });

  it('treats empty and whitespace input as ambiguous', () => {
    expect(detector.detect('')).toBe('ambiguous');
    expect(detector.detect('   ')).toBe('ambiguous');
    expect(detector.detect(undefined as unknown as string)).toBe('ambiguous');
  });
});
