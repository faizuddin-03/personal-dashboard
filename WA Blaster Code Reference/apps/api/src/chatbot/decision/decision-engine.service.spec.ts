import { ClassifierService } from '../classifier/classifier.service';
import { RetrievalService, RetrievedChunk, RetrievalResult } from '../knowledge/retrieval.service';
import { DrafterService, DrafterOutput } from '../drafter/drafter.service';
import { GuardrailsService } from '../guardrails/guardrails.service';
import { OptOutDetector } from '../guardrails/opt-out.detector';
import { ComplaintDetector } from '../guardrails/complaint.detector';
import { YesNoDetector } from '../guardrails/yes-no.detector';
import { CannedRepliesService } from '../drafter/prompts/canned-replies';
import { ConversationService } from '../conversations/conversation.service';
import { ChatbotSettingsService } from '../settings/chatbot-settings.service';
import { LlmExhaustedException } from '../llm/llm-exhausted.exception';
import { EmbeddingsExhaustedException } from '../embeddings/embeddings-exhausted.exception';
import { QueryContextualizerService } from '../knowledge/query-contextualizer.service';
import { RerankerService } from '../knowledge/reranker.service';
import { DecisionEngine } from './decision-engine.service';
import { DecisionInput } from './decision.types';

const canned = new CannedRepliesService();

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
  return {
    chunks,
    embeddingLatencyMs: 3,
    searchLatencyMs: 4,
    totalLatencyMs: 7,
    queryEmbeddingModel: 'mock-embed',
  };
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

type SettingValue = boolean | number | string;

/**
 * Builds a DecisionEngine with happy-path mocks: chatbot enabled, contact opted in, CS window
 * open, a confident KB hit, passing guardrails, and a 24/7 business-hours window. Each test
 * nudges exactly one collaborator (or one setting) to drive the branch under test.
 */
function buildEngine() {
  const settingsValues: Record<string, SettingValue> = {
    enabled: true,
    disable_auto_reply: false,
    confidence_threshold: 0.85,
    business_hours_start: '00:00',
    business_hours_end: '24:00',
    business_hours_timezone: 'Asia/Kuala_Lumpur',
    business_days: 'MON,TUE,WED,THU,FRI,SAT,SUN',
  };
  const settings = {
    get: jest.fn(async (key: string, def: SettingValue) => (key in settingsValues ? settingsValues[key] : def)),
    patch: jest.fn(),
    reload: jest.fn(),
  };

  const classifier = {
    classify: jest.fn(async () => ({ intent: 'question', confidence: 0.9, language: 'en' as const })),
  };
  const retrieval = {
    retrieve: jest.fn(async () => retrievalResult([chunk({ chunkId: 'c1', rank: 1 })])),
  };
  const drafter = { draft: jest.fn(async () => drafterOutput()) };
  const guardrails = { evaluate: jest.fn(() => ({ passed: true, failures: [] as string[] })) };
  const conversations = {
    hasPendingEscalation: jest.fn(async () => false),
    isOfferingEscalation: jest.fn(async () => false),
    isHumanHandling: jest.fn(async () => false),
    getEscalationOfferOriginalInboundId: jest.fn(async () => 'orig-1'),
    clearOfferState: jest.fn(async () => undefined),
  };
  const contextualizer = {
    contextualize: jest.fn(async (msg: string) => ({ searchQuery: msg, strategy: 'raw' as const })),
  };
  const reranker = {
    enabled: false,
    fetchTopK: jest.fn(() => undefined as number | undefined),
    rerank: jest.fn(async (_q: string, chunks: RetrievedChunk[]) => chunks),
  };

  const optOut = new OptOutDetector();
  const complaint = new ComplaintDetector();
  const yesNo = new YesNoDetector();

  const engine = new DecisionEngine(
    classifier as unknown as ClassifierService,
    retrieval as unknown as RetrievalService,
    drafter as unknown as DrafterService,
    guardrails as unknown as GuardrailsService,
    optOut,
    complaint,
    yesNo,
    canned,
    conversations as unknown as ConversationService,
    settings as unknown as ChatbotSettingsService,
    contextualizer as unknown as QueryContextualizerService,
    reranker as unknown as RerankerService,
  );

  return { engine, settings, settingsValues, classifier, retrieval, drafter, guardrails, conversations, contextualizer, reranker };
}

function input(over: Partial<DecisionInput> = {}): DecisionInput {
  return {
    inboundMessageBody: 'What time do you open?',
    contactOptedIn: true,
    csWindowOpen: true,
    businessName: 'Kedai Kopi',
    conversationId: 'conv-1',
    ...over,
  };
}

describe('DecisionEngine', () => {
  describe('pre-checks', () => {
    it('IGNOREs (ignore_disabled) when the chatbot is disabled — no LLM, no retrieval', async () => {
      const { engine, settingsValues, classifier, retrieval } = buildEngine();
      settingsValues.enabled = false;

      const d = await engine.decide(input());

      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_disabled');
      expect(d.reason).toBe('chatbot_disabled');
      expect(classifier.classify).not.toHaveBeenCalled();
      expect(retrieval.retrieve).not.toHaveBeenCalled();
    });

    it('ESCALATEs (safety_escalate / kill_switch_active) when auto-reply is disabled — no classify', async () => {
      const { engine, settingsValues, classifier } = buildEngine();
      settingsValues.disable_auto_reply = true;

      const d = await engine.decide(input());

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('safety_escalate');
      expect(d.reason).toBe('kill_switch_active');
      expect(classifier.classify).not.toHaveBeenCalled();
    });

    it('IGNOREs (ignore_opted_out) when the contact has not opted in', async () => {
      const { engine, classifier } = buildEngine();

      const d = await engine.decide(input({ contactOptedIn: false }));

      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_opted_out');
      expect(d.reason).toBe('opted_out');
      expect(classifier.classify).not.toHaveBeenCalled();
    });

    it('ESCALATEs (safety_escalate / cs_window_expired) when the CS window is closed', async () => {
      const { engine } = buildEngine();

      const d = await engine.decide(input({ csWindowOpen: false }));

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('safety_escalate');
      expect(d.reason).toBe('cs_window_expired');
    });
  });

  describe('human-handling guard', () => {
    it('IGNOREs (ignore_human_handling) when a human owns the conversation — no classify/retrieve/draft', async () => {
      const { engine, conversations, classifier, retrieval, drafter } = buildEngine();
      conversations.isHumanHandling.mockResolvedValue(true);

      const d = await engine.decide(input());

      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_human_handling');
      expect(d.reason).toBe('human_handling');
      expect(d.draftBody).toBeUndefined();
      expect(classifier.classify).not.toHaveBeenCalled();
      expect(retrieval.retrieve).not.toHaveBeenCalled();
      expect(drafter.draft).not.toHaveBeenCalled();
      // The guard sits ahead of the pending-escalation/offer branches, so neither is consulted.
      expect(conversations.hasPendingEscalation).not.toHaveBeenCalled();
      expect(conversations.isOfferingEscalation).not.toHaveBeenCalled();
    });
  });

  describe('pending escalation guard', () => {
    it('answers from the KB (AUTO_SEND / rag_answer) when a confident hit exists — no second escalation', async () => {
      const { engine, conversations } = buildEngine();
      conversations.hasPendingEscalation.mockResolvedValue(true);

      const d = await engine.decide(input());

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
      expect(d.reason).toBe('approved');
      expect(d.draftBody).toBe('We open at 9am daily.');
      expect(d.sideEffects?.setOfferState).toBeUndefined();
    });

    it('tells the customer it is still being processed (AUTO_SEND / still_being_processed) on a KB miss', async () => {
      const { engine, conversations, retrieval, drafter } = buildEngine();
      conversations.hasPendingEscalation.mockResolvedValue(true);
      retrieval.retrieve.mockResolvedValue(retrievalResult([]));

      const d = await engine.decide(input());

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('still_being_processed');
      expect(d.reason).toBe('pending_escalation_still_processing');
      expect(d.draftBody).toBe(canned.get('still_being_processed', 'en'));
      expect(d.sideEffects?.setOfferState).toBeUndefined();
      expect(drafter.draft).not.toHaveBeenCalled();
    });

    it('does not create a second escalation when drafting fails under a pending ticket', async () => {
      const { engine, conversations, drafter } = buildEngine();
      conversations.hasPendingEscalation.mockResolvedValue(true);
      drafter.draft.mockRejectedValue(new LlmExhaustedException('boom'));

      const d = await engine.decide(input());

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('still_being_processed');
    });

    it('stays silent (IGNORE) and files no second escalation when classify is LLM-exhausted under a pending ticket', async () => {
      const { engine, conversations, classifier, retrieval, drafter } = buildEngine();
      conversations.hasPendingEscalation.mockResolvedValue(true);
      classifier.classify.mockRejectedValue(new LlmExhaustedException('classify exhausted'));

      const d = await engine.decide(input());

      // A transient outage must not escalate (that would file a second PENDING draft and poison the
      // conversation) and must not send a canned reply — stay silent.
      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_llm_unavailable');
      expect(d.reason).toBe('llm_unavailable');
      expect(d.draftBody).toBeUndefined();
      expect(d.sideEffects).toBeUndefined();
      // The drafter shares the exhausted chain, so the RAG attempt is skipped.
      expect(retrieval.retrieve).not.toHaveBeenCalled();
      expect(drafter.draft).not.toHaveBeenCalled();
    });
  });

  describe('ESCALATION_OFFERED branch', () => {
    it('escalates the original question when the customer says yes (ESCALATE + ack draftBody)', async () => {
      const { engine, conversations } = buildEngine();
      conversations.isOfferingEscalation.mockResolvedValue(true);
      conversations.getEscalationOfferOriginalInboundId.mockResolvedValue('inbound-orig-42');

      const d = await engine.decide(input({ inboundMessageBody: 'yes please' }));

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('consent_accepted_escalate');
      expect(d.reason).toBe('escalation_accepted');
      // Exception to the usual rule: an ESCALATE that also carries a draftBody (the ack to send first).
      expect(d.draftBody).toBe(canned.get('escalation_accepted', 'en'));
      expect(d.sideEffects?.escalateUsingOriginalQuestion).toEqual({ originalInboundId: 'inbound-orig-42' });
    });

    it('acknowledges and clears the offer when the customer says no (AUTO_SEND / escalation_declined_ack)', async () => {
      const { engine, conversations } = buildEngine();
      conversations.isOfferingEscalation.mockResolvedValue(true);

      const d = await engine.decide(input({ inboundMessageBody: 'no thanks' }));

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('escalation_declined_ack');
      expect(d.reason).toBe('escalation_declined');
      expect(d.draftBody).toBe(canned.get('escalation_declined', 'en'));
      expect(d.sideEffects?.clearOfferState).toBe(true);
    });

    it('expires the offer and falls through to the normal pipeline on an ambiguous reply', async () => {
      const { engine, conversations } = buildEngine();
      conversations.isOfferingEscalation.mockResolvedValue(true);

      // Neither yes nor no — a fresh question.
      const d = await engine.decide(input({ inboundMessageBody: 'What are your shipping rates to Penang?' }));

      expect(conversations.clearOfferState).toHaveBeenCalledWith('conv-1');
      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
      expect(d.reason).toBe('approved');
    });
  });

  describe('safety escalations', () => {
    it('ESCALATEs (opt_out_requested) on opt-out language', async () => {
      const { engine } = buildEngine();

      const d = await engine.decide(input({ inboundMessageBody: 'Please stop messaging me' }));

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('safety_escalate');
      expect(d.reason).toBe('opt_out_requested');
    });

    it('ESCALATEs (complaint) on complaint language', async () => {
      const { engine } = buildEngine();

      const d = await engine.decide(input({ inboundMessageBody: 'This is terrible service and I am furious' }));

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('safety_escalate');
      expect(d.reason).toBe('complaint');
    });

    it('ESCALATEs (low_intent_confidence) when the classifier is unsure', async () => {
      const { engine, classifier } = buildEngine();
      classifier.classify.mockResolvedValue({ intent: 'unknown', confidence: 0.4, language: 'en' as const });

      const d = await engine.decide(input());

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('safety_escalate');
      expect(d.reason).toBe('low_intent_confidence');
    });

    it('IGNOREs (ignore_llm_unavailable) when classification throws LlmExhaustedException — transient, stay silent', async () => {
      const { engine, classifier } = buildEngine();
      classifier.classify.mockRejectedValue(new LlmExhaustedException('classify exhausted'));

      const d = await engine.decide(input());

      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_llm_unavailable');
      expect(d.reason).toBe('llm_unavailable');
      expect(d.draftBody).toBeUndefined();
    });

    it('IGNOREs (ignore_llm_unavailable) when drafting throws LlmExhaustedException — transient, stay silent', async () => {
      const { engine, drafter } = buildEngine();
      drafter.draft.mockRejectedValue(new LlmExhaustedException('draft exhausted'));

      const d = await engine.decide(input());

      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_llm_unavailable');
      expect(d.reason).toBe('llm_unavailable');
    });

    it('IGNOREs (ignore_embeddings_unavailable) when retrieval throws EmbeddingsExhaustedException — transient, stay silent', async () => {
      const { engine, retrieval } = buildEngine();
      retrieval.retrieve.mockRejectedValue(new EmbeddingsExhaustedException('embed exhausted'));

      const d = await engine.decide(input());

      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_embeddings_unavailable');
      expect(d.reason).toBe('embeddings_unavailable');
    });

    it('ESCALATEs (guardrail_<name>) when a guardrail rejects the draft', async () => {
      const { engine, guardrails } = buildEngine();
      guardrails.evaluate.mockReturnValue({ passed: false, failures: ['no_unknown_promises', 'length'] });

      const d = await engine.decide(input());

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('safety_escalate');
      expect(d.reason).toBe('guardrail_no_unknown_promises');
      expect(d.guardrailFailures).toEqual(['no_unknown_promises', 'length']);
    });
  });

  describe('consent offer on uncertainty', () => {
    it('offers consent (AUTO_SEND / consent_offer) with setOfferState on a KB miss', async () => {
      const { engine, retrieval, drafter } = buildEngine();
      retrieval.retrieve.mockResolvedValue(retrievalResult([]));

      const d = await engine.decide(input());

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('consent_offer');
      expect(d.reason).toBe('escalation_offer_sent:no_kb');
      expect(d.draftBody).toBe(canned.get('consent_offer', 'en'));
      expect(d.sideEffects?.setOfferState).toEqual({ inboundMessageId: '__current__' });
      expect(drafter.draft).not.toHaveBeenCalled();
    });

    it('offers consent (AUTO_SEND / consent_offer) with setOfferState when draft confidence is low', async () => {
      const { engine, drafter } = buildEngine();
      drafter.draft.mockResolvedValue(drafterOutput({ draftConfidence: 0.5 }));

      const d = await engine.decide(input());

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('consent_offer');
      expect(d.reason).toBe('escalation_offer_sent:low_conf');
      expect(d.draftBody).toBe(canned.get('consent_offer', 'en'));
      expect(d.sideEffects?.setOfferState).toEqual({ inboundMessageId: '__current__' });
    });

    it('honours a settings-driven confidence threshold', async () => {
      const { engine, settingsValues, drafter } = buildEngine();
      settingsValues.confidence_threshold = 0.6;
      drafter.draft.mockResolvedValue(drafterOutput({ draftConfidence: 0.7 }));

      const d = await engine.decide(input());

      // 0.7 clears the lowered 0.6 bar, so this auto-sends rather than offering consent.
      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
    });
  });

  describe('business hours', () => {
    afterEach(() => {
      jest.useRealTimers();
    });

    it('ESCALATEs (out_of_hours) outside the configured window', async () => {
      const { engine, settingsValues } = buildEngine();
      settingsValues.business_hours_start = '09:00';
      settingsValues.business_hours_end = '18:00';
      settingsValues.business_hours_timezone = 'UTC';
      // 02:00 UTC is outside 09:00–18:00.
      jest.useFakeTimers().setSystemTime(new Date('2026-06-10T02:00:00Z'));

      const d = await engine.decide(input());

      expect(d.kind).toBe('ESCALATE');
      expect(d.subKind).toBe('safety_escalate');
      expect(d.reason).toBe('out_of_hours');
    });

    it('respects the configured timezone for the same absolute instant', async () => {
      // 2026-06-10T02:00:00Z is 02:00 in UTC but 10:00 in Asia/Kuala_Lumpur (UTC+8).
      jest.useFakeTimers().setSystemTime(new Date('2026-06-10T02:00:00Z'));

      const utc = buildEngine();
      utc.settingsValues.business_hours_start = '09:00';
      utc.settingsValues.business_hours_end = '18:00';
      utc.settingsValues.business_hours_timezone = 'UTC';
      const outside = await utc.engine.decide(input());
      expect(outside.reason).toBe('out_of_hours');

      const kl = buildEngine();
      kl.settingsValues.business_hours_start = '09:00';
      kl.settingsValues.business_hours_end = '18:00';
      kl.settingsValues.business_hours_timezone = 'Asia/Kuala_Lumpur';
      const inside = await kl.engine.decide(input());
      expect(inside.kind).toBe('AUTO_SEND');
      expect(inside.subKind).toBe('rag_answer');
      expect(inside.reason).toBe('approved');
    });

    it('ESCALATEs (out_of_hours) on a non-business day', async () => {
      const { engine, settingsValues } = buildEngine();
      settingsValues.business_hours_start = '00:00';
      settingsValues.business_hours_end = '24:00';
      settingsValues.business_hours_timezone = 'UTC';
      settingsValues.business_days = 'MON,TUE,WED,THU,FRI';
      // 2026-06-07 is a Sunday.
      jest.useFakeTimers().setSystemTime(new Date('2026-06-07T05:00:00Z'));

      const d = await engine.decide(input());

      expect(d.reason).toBe('out_of_hours');
    });
  });

  describe('happy path', () => {
    it('AUTO_SENDs (rag_answer / approved) when everything passes, with full telemetry', async () => {
      const { engine } = buildEngine();

      const d = await engine.decide(input());

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
      expect(d.reason).toBe('approved');
      expect(d.draftBody).toBe('We open at 9am daily.');

      expect(d.detectedLanguage).toBe('en');
      expect(d.intent).toBe('question');
      expect(d.intentConfidence).toBe(0.9);
      expect(d.draftConfidence).toBe(0.95);
      expect(d.modelUsed).toBe('mock-model');
      expect(d.citedChunkIds).toEqual(['c1']);
      expect(d.citedRanks).toEqual([1]);
      expect(d.chunksRetrieved).toBe(1);
      expect(d.topChunkScore).toBe(0.9);
      expect(d.embeddingModelUsed).toBe('mock-embed');
      expect(d.retrievalLatencyMs).toBe(7);
      expect(d.topChunks).toHaveLength(1);
      expect(d.guardrailFailures).toEqual([]);
      expect(typeof d.totalLatencyMs).toBe('number');
    });
  });

  describe('history-aware retrieval', () => {
    it('retrieves with the contextualized query, not the raw follow-up text', async () => {
      const { engine, contextualizer, retrieval } = buildEngine();
      contextualizer.contextualize.mockResolvedValue({
        searchQuery: 'additional compulsory excess for driver under 21',
        strategy: 'rewrite',
      });

      await engine.decide(
        input({
          inboundMessageBody: 'what about if she is 18?',
          conversationHistory: [
            { role: 'customer', body: 'my daughter is 23, if she drives my car and we claim, got extra excess?' },
            { role: 'bot', body: 'No additional Compulsory Excess applies since your daughter is over 21 years old.' },
          ],
        }),
      );

      expect(contextualizer.contextualize).toHaveBeenCalledWith('what about if she is 18?', expect.any(Array));
      expect(retrieval.retrieve).toHaveBeenCalledWith('additional compulsory excess for driver under 21', { topK: undefined });
    });
  });

  describe('relevance reranking', () => {
    it('fetches a wide candidate set and hands the reranked chunks to the drafter when enabled', async () => {
      const { engine, reranker, retrieval, drafter } = buildEngine();
      reranker.enabled = true;
      reranker.fetchTopK.mockReturnValue(20);

      const noise = chunk({ chunkId: 'noise', rank: 1, similarityScore: 0.75 });
      const answer = chunk({ chunkId: 'answer', rank: 2, similarityScore: 0.65, text: 'One claim and your NCD becomes zero.' });
      retrieval.retrieve.mockResolvedValue(retrievalResult([noise, answer]));
      // Judge promotes the real answer to rank 1.
      reranker.rerank.mockResolvedValue([
        { ...answer, rank: 1 },
        { ...noise, rank: 2 },
      ]);

      const d = await engine.decide(input());

      // Wide fetch driven by fetchTopK().
      expect(retrieval.retrieve).toHaveBeenCalledWith('What time do you open?', { topK: 20 });
      // Reranker received the dense candidates for the (raw) query.
      expect(reranker.rerank).toHaveBeenCalledWith('What time do you open?', [noise, answer]);
      // Drafter sees the reranked order (answer first).
      const draftArg = drafter.draft.mock.calls[0][0];
      expect(draftArg.chunks[0].chunkId).toBe('answer');
      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
    });

    it('does not rerank or widen the fetch when disabled (zero behavior change)', async () => {
      const { engine, reranker, retrieval } = buildEngine();

      await engine.decide(input());

      expect(retrieval.retrieve).toHaveBeenCalledWith('What time do you open?', { topK: undefined });
      expect(reranker.rerank).not.toHaveBeenCalled();
    });

    it('routes the second retrieve site (tryRagAnswer under a pending escalation) through the reranker too', async () => {
      const { engine, reranker, retrieval, conversations } = buildEngine();
      reranker.enabled = true;
      reranker.fetchTopK.mockReturnValue(20);
      conversations.hasPendingEscalation.mockResolvedValue(true);

      const d = await engine.decide(input());

      // The pending-escalation RAG attempt widens the fetch and reranks, exactly like the main pipeline.
      expect(retrieval.retrieve).toHaveBeenCalledWith('What time do you open?', { topK: 20 });
      expect(reranker.rerank).toHaveBeenCalledWith('What time do you open?', expect.any(Array));
      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
    });
  });

  describe('staleness guard (late Meta redelivery)', () => {
    it('IGNOREs (ignore_stale) an inbound received far earlier than it is processed — no classify/retrieve/send', async () => {
      const { engine, classifier, retrieval, drafter } = buildEngine();

      const d = await engine.decide(input({ receivedAt: new Date(Date.now() - 20 * 60 * 1000) })); // 20 min late

      expect(d.kind).toBe('IGNORE');
      expect(d.subKind).toBe('ignore_stale');
      expect(d.reason).toBe('stale_redelivery');
      expect(classifier.classify).not.toHaveBeenCalled();
      expect(retrieval.retrieve).not.toHaveBeenCalled();
      expect(drafter.draft).not.toHaveBeenCalled();
    });

    it('processes a freshly-received inbound normally', async () => {
      const { engine } = buildEngine();

      const d = await engine.decide(input({ receivedAt: new Date() }));

      expect(d.kind).toBe('AUTO_SEND');
      expect(d.subKind).toBe('rag_answer');
    });

    it('processes normally when receivedAt is absent (back-compat)', async () => {
      const { engine } = buildEngine();

      const d = await engine.decide(input());

      expect(d.kind).toBe('AUTO_SEND');
    });
  });
});
