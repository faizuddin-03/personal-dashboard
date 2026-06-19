import { DecisionEngine } from '../decision-engine.service';
import { CannedRepliesService } from '../../drafter/prompts/canned-replies';
import { RetrievedChunk, RetrievalResult } from '../../knowledge/retrieval.service';
import { DrafterOutput } from '../../drafter/drafter.service';
import { RerankerService } from '../../knowledge/reranker.service';

function chunk(over: Partial<RetrievedChunk> & { chunkId: string; rank: number }): RetrievedChunk {
  return {
    chunkId: over.chunkId,
    text: over.text ?? 'We open at 9am daily.',
    tokenCount: over.tokenCount ?? 5,
    similarityScore: over.similarityScore ?? 0.9,
    rank: over.rank,
    document: over.document ?? { id: 'd1', name: 'hours.md', title: 'Hours', category: 'General' },
  };
}

function retrievalResult(chunks: RetrievedChunk[]): RetrievalResult {
  return { chunks, embeddingLatencyMs: 3, searchLatencyMs: 4, totalLatencyMs: 7, queryEmbeddingModel: 'mock-embed' };
}

function drafterOutput(over: Partial<DrafterOutput> = {}): DrafterOutput {
  return {
    body: 'We open at 9am daily.',
    draftConfidence: 0.95,
    modelUsed: 'mock-model',
    latencyMs: 12,
    citedChunkIds: ['c1'],
    citedRanks: [1],
    ...over,
  };
}

function buildEngine() {
  const classifier = { classify: jest.fn(async () => ({ intent: 'inquiry', confidence: 0.9, language: 'en' as const })) };
  const retrieval = { retrieve: jest.fn(async () => retrievalResult([chunk({ chunkId: 'c1', rank: 1 })])) };
  const drafter = { draft: jest.fn(async () => drafterOutput()) };
  const guardrails = { evaluate: jest.fn(() => ({ passed: true, failures: [] as string[] })) };
  const optOut = { detect: jest.fn(() => false) };
  const complaint = { detect: jest.fn(() => false) };
  const yesNo = { detect: jest.fn(() => 'none' as const) };
  const canned = new CannedRepliesService();
  const conversations = {
    hasPendingEscalation: jest.fn(async () => false),
    isOfferingEscalation: jest.fn(async () => false),
  };
  const settings = {
    get: jest.fn(async (key: string, def?: unknown) => {
      const map: Record<string, unknown> = {
        enabled: true,
        disable_auto_reply: false,
        confidence_threshold: 0.85,
        business_hours_start: '00:00',
        business_hours_end: '24:00',
        business_days: 'MON,TUE,WED,THU,FRI,SAT,SUN',
        business_hours_timezone: 'Asia/Kuala_Lumpur',
      };
      return key in map ? map[key] : def;
    }),
  };
  const contextualizer = {
    contextualize: jest.fn(async (msg: string) => ({ searchQuery: msg, strategy: 'raw' as const })),
  };
  const reranker = {
    enabled: false,
    fetchTopK: jest.fn(() => undefined as number | undefined),
    rerank: jest.fn(async (_q: string, chunks: RetrievedChunk[]) => chunks),
  };

  const engine = new DecisionEngine(
    classifier as any,
    retrieval as any,
    drafter as any,
    guardrails as any,
    optOut as any,
    complaint as any,
    yesNo as any,
    canned,
    conversations as any,
    settings as any,
    contextualizer as any,
    reranker as unknown as RerankerService,
  );
  return { engine, drafter, guardrails, conversations };
}

describe('DecisionEngine — campaign context', () => {
  it('forwards campaign text to the drafter and the guardrails on a confident answer', async () => {
    const { engine, drafter, guardrails } = buildEngine();

    const decision = await engine.decide({
      inboundMessageBody: 'when does the offer end?',
      contactOptedIn: true,
      csWindowOpen: true,
      businessName: 'Kedai Kopi',
      conversationId: 'conv-1',
      campaignContext: { campaignName: 'June Promo', renderedText: 'Get 15% off until 30 June.', blastId: 'b1' },
    });

    expect(decision.subKind).toBe('rag_answer');
    expect(drafter.draft).toHaveBeenCalledWith(
      expect.objectContaining({ campaignText: 'Get 15% off until 30 June.' }),
    );
    expect(guardrails.evaluate).toHaveBeenCalledWith(
      'We open at 9am daily.',
      expect.objectContaining({ campaignText: 'Get 15% off until 30 June.' }),
    );
  });

  it('omits campaignText when no campaign context is supplied', async () => {
    const { engine, drafter, guardrails } = buildEngine();

    await engine.decide({
      inboundMessageBody: 'what time do you open?',
      contactOptedIn: true,
      csWindowOpen: true,
      businessName: 'Kedai Kopi',
      conversationId: 'conv-1',
    });

    expect(drafter.draft).toHaveBeenCalledWith(expect.objectContaining({ campaignText: undefined }));
    expect(guardrails.evaluate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ campaignText: undefined }),
    );
  });

  it('forwards campaign text through tryRagAnswer when a pending escalation exists', async () => {
    const { engine, drafter, guardrails, conversations } = buildEngine();
    conversations.hasPendingEscalation.mockResolvedValueOnce(true);

    await engine.decide({
      inboundMessageBody: 'when does the offer end?',
      contactOptedIn: true,
      csWindowOpen: true,
      businessName: 'Kedai Kopi',
      conversationId: 'conv-1',
      campaignContext: { campaignName: 'June Promo', renderedText: 'Get 15% off until 30 June.', blastId: 'b1' },
    });

    expect(drafter.draft).toHaveBeenCalledWith(
      expect.objectContaining({ campaignText: 'Get 15% off until 30 June.' }),
    );
    expect(guardrails.evaluate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ campaignText: 'Get 15% off until 30 June.' }),
    );
  });
});
