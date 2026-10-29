import { applyLanguagePolicy, containsEnglish } from './language-policy';

describe('language policy (reply in MS only when the message is entirely BM)', () => {
  describe('applyLanguagePolicy', () => {
    it('forces EN for the live Manglish message the LLM mis-tagged as MS', () => {
      expect(
        applyLanguagePolicy('my car kena flood damage, basic comprehensive cover or not?', 'ms'),
      ).toBe('en');
    });

    it('keeps MS for messages written entirely in Bahasa Malaysia', () => {
      const fullyBm = [
        'kereta saya kena banjir semalam, polisi ada perlindungan tak?',
        'macam mana nak buat tuntutan?',
        'berapa harga premium untuk kereta saya?',
        'bila kedai buka?',
      ];
      for (const msg of fullyBm) {
        expect(applyLanguagePolicy(msg, 'ms')).toBe('ms');
      }
    });

    it('forces EN when colloquial BM mixes in English pronouns or structure words', () => {
      expect(applyLanguagePolicy('boleh i claim ke?', 'ms')).toBe('en');
      expect(applyLanguagePolicy('polisi ni got cover banjir or not', 'ms')).toBe('en');
    });

    it('never upgrades an EN detection to MS', () => {
      expect(applyLanguagePolicy('apa khabar', 'en')).toBe('en');
      expect(applyLanguagePolicy('what time do you open?', 'en')).toBe('en');
    });

    it('ignores English-looking tokens inside emails and URLs', () => {
      expect(
        applyLanguagePolicy('sila hantar dokumen tuntutan ke claims@chubb.com.my', 'ms'),
      ).toBe('ms');
      expect(
        applyLanguagePolicy('layari https://www.chubb.com/my untuk maklumat lanjut', 'ms'),
      ).toBe('ms');
    });

    it('tolerates universal borrowings (ok/thanks) without flipping a BM message to EN', () => {
      expect(applyLanguagePolicy('ok terima kasih, dah faham', 'ms')).toBe('ms');
    });

    it('defaults to EN for empty input', () => {
      expect(applyLanguagePolicy('', 'ms')).toBe('en');
      expect(applyLanguagePolicy('   ', 'ms')).toBe('en');
    });
  });

  describe('containsEnglish', () => {
    it('spots English function words regardless of case or punctuation', () => {
      expect(containsEnglish('Basic comprehensive cover OR NOT?')).toBe(true);
      expect(containsEnglish('My car rosak.')).toBe(true);
    });

    it('does not treat BM loanwords (claim/cover/plan/order) alone as English', () => {
      expect(containsEnglish('nak claim macam mana')).toBe(false);
      expect(containsEnglish('plan ni cover banjir tak')).toBe(false);
      expect(containsEnglish('macam mana nak order?')).toBe(false);
    });
  });
});
