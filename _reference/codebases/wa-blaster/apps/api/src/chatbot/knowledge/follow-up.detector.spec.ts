import { FollowUpDetector } from './follow-up.detector';

type Turn = { role: 'customer' | 'bot' | 'operator'; body: string };

const priorThread: Turn[] = [
  { role: 'customer', body: 'my daughter is 23, if she drives my car and we claim, got extra excess?' },
  { role: 'bot', body: 'No additional Compulsory Excess applies since your daughter is over 21 years old.' },
];

describe('FollowUpDetector', () => {
  const detector = new FollowUpDetector();

  it('flags a short elliptical message when prior customer history exists', () => {
    expect(detector.isFollowUp('what about if she is 18?', priorThread)).toBe(true);
    expect(detector.isFollowUp('and for a motorcycle?', priorThread)).toBe(true);
    expect(detector.isFollowUp('she 18?', priorThread)).toBe(true);
  });

  it('flags a longer message that carries a follow-up cue word', () => {
    expect(
      detector.isFollowUp('how about if my second driver is nineteen and drives occasionally?', priorThread),
    ).toBe(true);
  });

  it('treats a short question as a follow-up CANDIDATE when history exists — the LLM makes the final call', () => {
    // Recall-tuned: over-flagging is harmless (the rewrite leaves self-contained questions unchanged).
    expect(detector.isFollowUp('what does comprehensive cover?', priorThread)).toBe(true);
  });

  it('does NOT flag when there is no prior customer turn (nothing to contextualize)', () => {
    expect(detector.isFollowUp('what about if she is 18?', [])).toBe(false);
    expect(detector.isFollowUp('what about if she is 18?', undefined)).toBe(false);
    expect(detector.isFollowUp('and for a motorcycle?', [{ role: 'bot', body: 'Hi!' }])).toBe(false);
  });

  it('does NOT flag a long, self-contained question with no cue', () => {
    expect(
      detector.isFollowUp(
        'my daughter is 18, if she drives my car and we claim, got extra excess for this?',
        priorThread,
      ),
    ).toBe(false);
  });

  it('does NOT flag empty input', () => {
    expect(detector.isFollowUp('', priorThread)).toBe(false);
    expect(detector.isFollowUp('   ', priorThread)).toBe(false);
  });
});
