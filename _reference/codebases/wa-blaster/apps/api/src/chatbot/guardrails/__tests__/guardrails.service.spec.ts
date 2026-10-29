import { GuardrailsService } from '../guardrails.service';
import { LengthGuard } from '../length.guard';
import { NoUnknownPromisesGuard } from '../no-unknown-promises.guard';
import { NoAiSelfReferenceGuard } from '../no-ai-self-reference.guard';
import { RetrievedChunk } from '../../knowledge/retrieval.service';

function chunk(text: string): RetrievedChunk {
  return {
    chunkId: 'c1',
    text,
    tokenCount: 5,
    similarityScore: 0.9,
    rank: 1,
    document: { id: 'd1', name: 'doc', title: 'Pricing', category: 'general' },
  };
}

function makeService(): GuardrailsService {
  return new GuardrailsService(
    new LengthGuard(),
    new NoUnknownPromisesGuard(),
    new NoAiSelfReferenceGuard(),
  );
}

describe('GuardrailsService', () => {
  it('passes a grounded, human, well-sized draft', () => {
    const svc = makeService();
    const result = svc.evaluate('Our price is RM50.', {
      chunks: [chunk('Price is RM50 each.')],
      language: 'en',
    });
    expect(result).toEqual({ passed: true, failures: [] });
  });

  it('fails and reports the specific reason for a single violation', () => {
    const svc = makeService();
    const result = svc.evaluate('It costs RM99.', {
      chunks: [chunk('We sell coffee.')],
      language: 'en',
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(['unknown_promise:99']);
  });

  it('collects all failures when a draft violates multiple guards', () => {
    const svc = makeService();
    const result = svc.evaluate('I am an AI. It costs RM99.', {
      chunks: [chunk('We sell coffee.')],
      language: 'en',
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(
      expect.arrayContaining(['unknown_promise:99', 'ai_self_reference']),
    );
  });

  it('fails an empty draft on the length guard', () => {
    const svc = makeService();
    const result = svc.evaluate('', { chunks: [], language: 'en' });
    expect(result.passed).toBe(false);
    expect(result.failures).toContain('length:empty');
  });

  it('grounds numbers the customer supplied — a draft echoing the asked age is not a hallucination', () => {
    const svc = makeService();
    // KB chunk has the "under 21" rule but not the literal age "19"; the customer asked about 19.
    const result = svc.evaluate('Since the driver is 19, under 21, an additional excess applies.', {
      chunks: [chunk('Drivers under 21 incur an additional compulsory excess.')],
      language: 'en',
      customerMessage: 'what about with age 19?',
    });
    expect(result).toEqual({ passed: true, failures: [] });
  });

  it('grounds numbers from recent conversation history too', () => {
    const svc = makeService();
    const result = svc.evaluate('For your 2015 car, the rate of betterment is 30%.', {
      chunks: [chunk('Betterment is 30% for cars between 5 and 10 years old.')],
      language: 'en',
      customerMessage: 'how much betterment?',
      conversationHistory: [{ role: 'customer', body: 'my car is a 2015 model' }],
    });
    expect(result).toEqual({ passed: true, failures: [] });
  });

  it('still flags a genuinely hallucinated number not in chunks, customer message, or history', () => {
    const svc = makeService();
    const result = svc.evaluate('It costs RM99.', {
      chunks: [chunk('We sell coffee.')],
      language: 'en',
      customerMessage: 'how much is it?',
    });
    expect(result.passed).toBe(false);
    expect(result.failures).toEqual(['unknown_promise:99']);
  });
});
