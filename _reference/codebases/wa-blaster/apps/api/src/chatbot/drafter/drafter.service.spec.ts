import { LlmRouterService } from '../llm/llm-router.service';
import { RetrievedChunk } from '../knowledge/retrieval.service';
import { DrafterService } from './drafter.service';

function makeLlm(complete: jest.Mock): LlmRouterService {
  return { complete } as unknown as LlmRouterService;
}

function completion(text: string) {
  return { text, modelUsed: 'mock-model', latencyMs: 7, finishReason: 'stop' };
}

function chunk(over: Partial<RetrievedChunk> & { chunkId: string; rank: number }): RetrievedChunk {
  return {
    chunkId: over.chunkId,
    text: over.text ?? 'some fact',
    tokenCount: over.tokenCount ?? 5,
    similarityScore: over.similarityScore ?? 0.9,
    rank: over.rank,
    document: over.document ?? { id: 'd1', name: 'doc', title: 'Hours', category: 'general' },
  };
}

describe('DrafterService', () => {
  it('returns a body grounded in the chunks with confidence > 0.5 when sources answer the question', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"reply": "We open at 9am daily.", "confidence": 0.9, "cited_chunks": [1]}'),
    );
    const svc = new DrafterService(makeLlm(complete));

    const out = await svc.draft({
      customerMessage: 'What time do you open?',
      language: 'en',
      chunks: [chunk({ chunkId: 'c1', rank: 1, text: 'We open at 9am daily.' })],
      businessName: 'Kedai Kopi',
    });

    expect(out.body).toBe('We open at 9am daily.');
    expect(out.draftConfidence).toBeGreaterThan(0.5);
    expect(out.citedChunkIds).toEqual(['c1']);
    expect(out.citedRanks).toEqual([1]);
    expect(out.modelUsed).toBe('mock-model');
    expect(out.latencyMs).toBe(7);
  });

  it('returns a "let me check" body with confidence < 0.3 when there are no chunks', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion(
        '{"reply": "Let me check with my colleague and get back to you shortly.", "confidence": 0.0, "cited_chunks": []}',
      ),
    );
    const svc = new DrafterService(makeLlm(complete));

    const out = await svc.draft({
      customerMessage: 'Do you ship to Mars?',
      language: 'en',
      chunks: [],
      businessName: 'Kedai Kopi',
    });

    expect(out.body).toContain('Let me check');
    expect(out.draftConfidence).toBeLessThan(0.3);
    expect(out.citedChunkIds).toEqual([]);
    expect(out.citedRanks).toEqual([]);
  });

  it('preserves language: ms input builds a Bahasa Malaysia prompt and returns the ms reply', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"reply": "Kami buka pada jam 9 pagi.", "confidence": 0.85, "cited_chunks": [1]}'),
    );
    const svc = new DrafterService(makeLlm(complete));

    const out = await svc.draft({
      customerMessage: 'Pukul berapa buka?',
      language: 'ms',
      chunks: [chunk({ chunkId: 'c1', rank: 1, text: 'Kami buka pada jam 9 pagi.' })],
      businessName: 'Kedai Kopi',
    });

    expect(out.body).toBe('Kami buka pada jam 9 pagi.');
    const [task, messages, opts] = complete.mock.calls[0];
    expect(task).toBe('draft');
    expect(messages[0].role).toBe('system');
    expect(messages[0].content).toContain('Bahasa Malaysia');
    expect(messages[1]).toEqual({ role: 'user', content: 'Pukul berapa buka?' });
    expect(opts).toEqual(expect.objectContaining({ jsonMode: true, temperature: 0.3, maxTokens: 300 }));
  });

  it('returns an empty draft with confidence 0 when the LLM returns malformed JSON', async () => {
    const complete = jest.fn().mockResolvedValue(completion('not json at all'));
    const svc = new DrafterService(makeLlm(complete));

    const out = await svc.draft({
      customerMessage: 'hi',
      language: 'en',
      chunks: [chunk({ chunkId: 'c1', rank: 1 })],
      businessName: 'Kedai Kopi',
    });

    expect(out.body).toBe('');
    expect(out.draftConfidence).toBe(0);
    expect(out.citedChunkIds).toEqual([]);
    expect(out.citedRanks).toEqual([]);
    expect(out.modelUsed).toBe('mock-model');
    expect(out.latencyMs).toBe(7);
  });

  it('maps cited_chunks ranks back to actual chunkIds and drops ranks not in the set', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"reply": "answer", "confidence": 0.7, "cited_chunks": [2, 99]}'),
    );
    const svc = new DrafterService(makeLlm(complete));

    const out = await svc.draft({
      customerMessage: 'q',
      language: 'en',
      chunks: [
        chunk({ chunkId: 'c-a', rank: 1 }),
        chunk({ chunkId: 'c-b', rank: 2 }),
      ],
      businessName: 'Kedai Kopi',
    });

    expect(out.citedRanks).toEqual([2, 99]);
    expect(out.citedChunkIds).toEqual(['c-b']);
  });

  it('passes campaignText and history into the system prompt', async () => {
    const complete = jest.fn().mockResolvedValue(
      completion('{"reply": "ok", "confidence": 0.9, "cited_chunks": []}'),
    );
    const svc = new DrafterService(makeLlm(complete));

    await svc.draft({
      customerMessage: 'when does it end?',
      language: 'en',
      chunks: [],
      businessName: 'Kedai Kopi',
      campaignText: 'Get 15% off until 30 June.',
      conversationHistory: [{ role: 'customer', body: 'hi' }],
    });

    const [, messages] = complete.mock.calls[0];
    expect(messages[0].content).toContain('Get 15% off until 30 June.');
    expect(messages[0].content).toContain('RECENT CONVERSATION');
    expect(messages[1]).toEqual({ role: 'user', content: 'when does it end?' });
  });
});
