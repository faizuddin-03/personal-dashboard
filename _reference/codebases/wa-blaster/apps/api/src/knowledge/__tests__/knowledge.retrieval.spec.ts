import { tokenize, scoreDoc } from '../knowledge.retrieval';

describe('tokenize', () => {
  it('lowercases, splits on non-alphanumerics, and drops stopwords + 1-char tokens', () => {
    expect(tokenize('How do I transfer ownership?')).toEqual(['transfer', 'ownership']);
  });
});

describe('scoreDoc', () => {
  const doc = {
    question: 'How do I do an ownership transfer online?',
    answer: 'Use the eAuto portal under Transfers.',
    category: 'Transfer',
  };

  it('scores question-token matches highest', () => {
    expect(scoreDoc('ownership transfer', doc)).toBe(6); // two question hits @ 3 each
  });

  it('scores a category match above an answer-only match', () => {
    const catScore = scoreDoc('transfer', { question: 'x', answer: 'y', category: 'Transfer' });
    const ansScore = scoreDoc('portal', { question: 'x', answer: 'eauto portal', category: 'z' });
    expect(catScore).toBe(2);
    expect(ansScore).toBe(1);
  });

  it('returns 0 when nothing overlaps or the query is empty', () => {
    expect(scoreDoc('insurance roadtax', doc)).toBe(0);
    expect(scoreDoc('', doc)).toBe(0);
    expect(scoreDoc('???', doc)).toBe(0);
    expect(scoreDoc('   ', doc)).toBe(0);
  });

  it('de-dupes repeated query tokens', () => {
    expect(scoreDoc('transfer transfer transfer', doc)).toBe(scoreDoc('transfer', doc));
  });
});
