import { NoUnknownPromisesGuard } from '../no-unknown-promises.guard';
import { RetrievedChunk } from '../../knowledge/retrieval.service';
import { GuardrailsService } from '../guardrails.service';
import { LengthGuard } from '../length.guard';
import { NoAiSelfReferenceGuard } from '../no-ai-self-reference.guard';

function chunk(text: string, rank = 1): RetrievedChunk {
  return {
    chunkId: `c${rank}`,
    text,
    tokenCount: 5,
    similarityScore: 0.9,
    rank,
    document: { id: 'd1', name: 'doc', title: 'Pricing', category: 'general' },
  };
}

describe('NoUnknownPromisesGuard', () => {
  const guard = new NoUnknownPromisesGuard();

  it('passes when every number in the draft appears in a chunk', () => {
    const result = guard.check('It costs RM50.', [chunk('Our price is RM50 per item.')]);
    expect(result).toEqual({ ok: true, reason: '' });
  });

  it('fails when the draft contains a number that is in no chunk and not safelisted', () => {
    const result = guard.check('It costs RM50.', [chunk('We sell coffee and tea.')]);
    expect(result).toEqual({ ok: false, reason: 'unknown_promise:50' });
  });

  it('passes a safelisted small number even when no chunk contains it', () => {
    const result = guard.check('We will reply within 3 days, open at 9am.', [
      chunk('We sell coffee and tea.'),
    ]);
    expect(result).toEqual({ ok: true, reason: '' });
  });

  it('passes when the draft contains no numbers', () => {
    const result = guard.check('Sure, we can help with that.', [chunk('anything')]);
    expect(result).toEqual({ ok: true, reason: '' });
  });
});

describe('NoUnknownPromisesGuard — campaign grounding', () => {
  const guard = new NoUnknownPromisesGuard();

  it('treats numbers present in extraGroundingText as known', () => {
    const res = guard.check('Enjoy 15% off until 30 June.', [], 'Get 15% off, valid till 30 June 2026.');
    expect(res.ok).toBe(true);
  });

  it('still fails on a number absent from both chunks and grounding text', () => {
    const res = guard.check('It costs RM99.', [], 'Get 15% off.');
    expect(res.ok).toBe(false);
    expect(res.reason).toBe('unknown_promise:99');
  });
});

describe('GuardrailsService — campaignText', () => {
  it('passes campaignText numbers through to the promises guard', () => {
    const svc = new GuardrailsService(new LengthGuard(), new NoUnknownPromisesGuard(), new NoAiSelfReferenceGuard());
    const res = svc.evaluate('Enjoy 15% off until 30 June.', {
      chunks: [],
      language: 'en',
      campaignText: 'Get 15% off, valid till 30 June.',
    });
    expect(res.passed).toBe(true);
  });
});
