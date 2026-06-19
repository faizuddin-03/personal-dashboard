import { LlmRouterService } from '../llm/llm-router.service';
import { TitleGeneratorService } from './title-generator.service';

function makeLlm(complete: jest.Mock): LlmRouterService {
  return { complete } as unknown as LlmRouterService;
}

describe('TitleGeneratorService', () => {
  it('returns a clean, trimmed, unquoted title on the happy path', async () => {
    const complete = jest.fn().mockResolvedValue({ text: '  "Shipping rates to Kuala Lumpur"  ', modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' });
    const svc = new TitleGeneratorService(makeLlm(complete));

    const title = await svc.generate('How much does it cost to ship to KL?', 'en');

    expect(title).toBe('Shipping rates to Kuala Lumpur');
    expect(complete).toHaveBeenCalledWith('classify', expect.any(Array), expect.objectContaining({ maxTokens: 30 }));
  });

  it('falls back to the first 60 chars of the question when the LLM returns malformed output', async () => {
    const complete = jest.fn().mockResolvedValue({ text: '', modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' });
    const svc = new TitleGeneratorService(makeLlm(complete));
    const question = 'a'.repeat(200);

    const title = await svc.generate(question, 'en');

    expect(title).toBe('a'.repeat(60));
  });

  it('falls back to the first 60 chars of the question when the LLM throws', async () => {
    const complete = jest.fn().mockRejectedValue(new Error('llm exhausted'));
    const svc = new TitleGeneratorService(makeLlm(complete));
    const question = 'Why was my order delayed and when will it arrive at my doorstep please?';

    const title = await svc.generate(question, 'ms');

    expect(title).toBe(question.substring(0, 60));
  });

  it('throws on an empty question', async () => {
    const svc = new TitleGeneratorService(makeLlm(jest.fn()));

    await expect(svc.generate('', 'en')).rejects.toThrow(/empty question/i);
    await expect(svc.generate('   ', 'en')).rejects.toThrow(/empty question/i);
  });

  it('requests a Bahasa Malaysia title when language is ms', async () => {
    const complete = jest.fn().mockResolvedValue({ text: 'Kadar penghantaran', modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' });
    const svc = new TitleGeneratorService(makeLlm(complete));

    await svc.generate('Berapa kos penghantaran?', 'ms');

    const messages = complete.mock.calls[0][1];
    expect(messages[0].content).toContain('Bahasa Malaysia');
  });
});
