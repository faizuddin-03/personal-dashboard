import { LlmRouterService } from '../llm/llm-router.service';
import { LlmExhaustedException } from '../llm/llm-exhausted.exception';
import { FollowUpDetector } from './follow-up.detector';
import { QueryContextualizerService } from './query-contextualizer.service';

type Turn = { role: 'customer' | 'bot' | 'operator'; body: string };

function makeLlm(complete: jest.Mock): LlmRouterService {
  return { complete } as unknown as LlmRouterService;
}
function completion(text: string) {
  return { text, modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' as const };
}

const thread: Turn[] = [
  { role: 'customer', body: 'my daughter is 23, if she drives my car and we claim, got extra excess?' },
  { role: 'bot', body: 'No additional Compulsory Excess applies since your daughter is over 21 years old.' },
];
const FOLLOW_UP = 'what about if she is 18?';
const EXPECTED_CONCAT =
  'my daughter is 23, if she drives my car and we claim, got extra excess? what about if she is 18?';

describe('QueryContextualizerService', () => {
  it('returns the raw message and does NOT call the LLM for a non-follow-up (no history)', async () => {
    const complete = jest.fn();
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize('what does comprehensive cover?', []);

    expect(result).toEqual({ searchQuery: 'what does comprehensive cover?', strategy: 'raw' });
    expect(complete).not.toHaveBeenCalled();
  });

  it('uses the LLM-rewritten standalone query for a follow-up', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('additional compulsory excess if 18 year old daughter drives insured car and claims'),
    );
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result.strategy).toBe('rewrite');
    expect(result.searchQuery).toBe(
      'additional compulsory excess if 18 year old daughter drives insured car and claims',
    );
    expect(complete).toHaveBeenCalledWith('classify', expect.any(Array), expect.objectContaining({ temperature: 0 }));
  });

  it('falls back to concat when the LLM chain is exhausted', async () => {
    const complete = jest.fn().mockRejectedValue(new LlmExhaustedException('down'));
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result).toEqual({ searchQuery: EXPECTED_CONCAT, strategy: 'concat' });
  });

  it('falls back to concat when the LLM returns an empty rewrite', async () => {
    const complete = jest.fn().mockResolvedValue(completion('   '));
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result).toEqual({ searchQuery: EXPECTED_CONCAT, strategy: 'concat' });
  });

  it('falls back to concat when the LLM rambles (likely prompt echo, not a query)', async () => {
    const complete = jest.fn().mockResolvedValue(completion('x'.repeat(500)));
    const svc = new QueryContextualizerService(makeLlm(complete), new FollowUpDetector());

    const result = await svc.contextualize(FOLLOW_UP, thread);

    expect(result.strategy).toBe('concat');
    expect(result.searchQuery).toBe(EXPECTED_CONCAT);
  });
});
