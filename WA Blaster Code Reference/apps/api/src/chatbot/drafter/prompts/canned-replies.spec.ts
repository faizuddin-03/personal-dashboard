import { CannedRepliesService, CannedReplyKey } from './canned-replies';

const KEYS: CannedReplyKey[] = [
  'consent_offer',
  'escalation_accepted',
  'escalation_declined',
  'still_being_processed',
];

describe('CannedRepliesService', () => {
  const svc = new CannedRepliesService();

  it('returns a non-empty reply for every key in both languages', () => {
    for (const key of KEYS) {
      expect(svc.get(key, 'en').length).toBeGreaterThan(0);
      expect(svc.get(key, 'ms').length).toBeGreaterThan(0);
    }
  });

  it('returns distinct EN and MS strings per key', () => {
    for (const key of KEYS) {
      expect(svc.get(key, 'en')).not.toBe(svc.get(key, 'ms'));
    }
  });

  it('falls back to English for an unknown language', () => {
    expect(svc.get('consent_offer', 'fr' as unknown as 'en')).toBe(
      svc.get('consent_offer', 'en'),
    );
  });
});
