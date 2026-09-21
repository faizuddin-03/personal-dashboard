import { LlmRouterService } from '../llm/llm-router.service';
import { ClassifierService } from './classifier.service';

function makeLlm(complete: jest.Mock): LlmRouterService {
  return { complete } as unknown as LlmRouterService;
}

function completion(text: string) {
  return { text, modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' };
}

describe('ClassifierService', () => {
  it('parses a well-formed LLM JSON response on the happy path', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"intent": "question", "confidence": 0.92, "language": "en"}'),
    );
    const svc = new ClassifierService(makeLlm(complete));

    const result = await svc.classify('What time do you open?');

    expect(result).toEqual({ intent: 'question', confidence: 0.92, language: 'en' });
    expect(complete).toHaveBeenCalledWith(
      'classify',
      expect.any(Array),
      expect.objectContaining({ jsonMode: true, temperature: 0 }),
    );
  });

  it('returns the unknown fallback without throwing when the LLM returns malformed JSON', async () => {
    const complete = jest.fn().mockResolvedValue(completion('not json at all'));
    const svc = new ClassifierService(makeLlm(complete));

    const result = await svc.classify('hello there');

    expect(result).toEqual({ intent: 'unknown', confidence: 0, language: 'en' });
  });

  it('returns the unknown fallback without calling the LLM on empty input', async () => {
    const complete = jest.fn();
    const svc = new ClassifierService(makeLlm(complete));

    expect(await svc.classify('')).toEqual({ intent: 'unknown', confidence: 0, language: 'en' });
    expect(await svc.classify('   ')).toEqual({ intent: 'unknown', confidence: 0, language: 'en' });
    expect(complete).not.toHaveBeenCalled();
  });

  it('surfaces a Bahasa Malaysia classification from the LLM', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"intent": "question", "confidence": 0.88, "language": "ms"}'),
    );
    const svc = new ClassifierService(makeLlm(complete));

    for (const msg of ['bila kedai buka?', 'berapa harga?', 'macam mana nak order?']) {
      const result = await svc.classify(msg);
      expect(result.language).toBe('ms');
    }
  });

  it('overrides an LLM "ms" verdict to EN when the message mixes English (Manglish)', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"intent": "question", "confidence": 0.9, "language": "ms"}'),
    );
    const svc = new ClassifierService(makeLlm(complete));

    const result = await svc.classify('my car kena flood damage, basic comprehensive cover or not?');

    expect(result.language).toBe('en');
  });

  it('tells the LLM to return "ms" only for messages entirely in Bahasa Malaysia', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"intent": "question", "confidence": 0.9, "language": "en"}'),
    );
    const svc = new ClassifierService(makeLlm(complete));

    await svc.classify('hello');

    const [, messages] = complete.mock.calls[0];
    expect(messages[0].content).toMatch(/"ms" ONLY when the message is written entirely in Bahasa Malaysia/);
  });

  it('detects opt_out intent with high confidence for "STOP" (detection only)', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"intent": "opt_out", "confidence": 0.99, "language": "en"}'),
    );
    const svc = new ClassifierService(makeLlm(complete));

    const result = await svc.classify('STOP');

    expect(result.intent).toBe('opt_out');
    expect(result.confidence).toBeGreaterThan(0.9);
  });

  it('coerces non-conforming field types in the parsed JSON to safe defaults', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"intent": 42, "confidence": "high", "language": "fr"}'),
    );
    const svc = new ClassifierService(makeLlm(complete));

    const result = await svc.classify('bonjour');

    expect(result).toEqual({ intent: 'unknown', confidence: 0, language: 'en' });
  });
});
