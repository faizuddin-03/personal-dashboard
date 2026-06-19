import { Injectable } from '@nestjs/common';
import { ClassifierService, Classification } from '../classifier/classifier.service';
import { RetrievalService, RetrievalResult } from '../knowledge/retrieval.service';
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
import { Decision, DecisionInput, DecisionKind, DecisionSubKind } from './decision.types';

/** The minimum classifier confidence we trust before answering from the KB. */
const LOW_INTENT_CONFIDENCE = 0.6;

/** Narrow core fields a branch decides; the accumulated telemetry is merged in by `finalize`. */
interface DecisionCore {
  kind: DecisionKind;
  subKind: DecisionSubKind;
  reason: string;
  draftBody?: string;
  sideEffects?: Decision['sideEffects'];
}

/**
 * The brain of the autopilot. Given one inbound customer message (plus pre-computed conversation
 * facts), it runs the full safety → consent → RAG pipeline and returns a single {@link Decision}
 * describing what the orchestrator should do — auto-send a reply, escalate to a human, or ignore.
 *
 * The engine never sends or persists anything itself: it is pure decision logic over its injected
 * collaborators. Any state mutation it wants (set/clear the escalation-offer state, escalate the
 * original question) is surfaced declaratively via `decision.sideEffects` for the orchestrator.
 */
@Injectable()
export class DecisionEngine {
  constructor(
    private readonly classifier: ClassifierService,
    private readonly retrieval: RetrievalService,
    private readonly drafter: DrafterService,
    private readonly guardrails: GuardrailsService,
    private readonly optOut: OptOutDetector,
    private readonly complaint: ComplaintDetector,
    private readonly yesNo: YesNoDetector,
    private readonly canned: CannedRepliesService,
    private readonly conversations: ConversationService,
    private readonly settings: ChatbotSettingsService,
    private readonly contextualizer: QueryContextualizerService,
    private readonly reranker: RerankerService,
  ) {}

  async decide(input: DecisionInput): Promise<Decision> {
    const t0 = Date.now();
    const acc: Partial<Decision> = {
      detectedLanguage: 'en',
      citedChunkIds: [],
      citedRanks: [],
      chunksRetrieved: 0,
      guardrailFailures: [],
    };

    // ── PRE-CHECKS ─────────────────────────────────────────────────────
    if (!(await this.settings.get('enabled', false)))
      return this.finalize({ kind: 'IGNORE', subKind: 'ignore_disabled', reason: 'chatbot_disabled' }, acc, t0);

    // Stale-redelivery guard: Meta retries undelivered webhooks for up to ~7 days. If we only
    // received this message long after the customer sent it, auto-replying now would be an
    // unsolicited message out of the blue — drop it (still persisted + logged by the orchestrator).
    if (input.receivedAt) {
      const maxAgeMin = (await this.settings.get('max_inbound_age_minutes', 10)) as number;
      if (Date.now() - input.receivedAt.getTime() > maxAgeMin * 60_000)
        return this.finalize({ kind: 'IGNORE', subKind: 'ignore_stale', reason: 'stale_redelivery' }, acc, t0);
    }
    if (await this.settings.get('disable_auto_reply', false))
      return this.finalize({ kind: 'ESCALATE', subKind: 'safety_escalate', reason: 'kill_switch_active' }, acc, t0);
    if (!input.contactOptedIn)
      return this.finalize({ kind: 'IGNORE', subKind: 'ignore_opted_out', reason: 'opted_out' }, acc, t0);
    if (!input.csWindowOpen)
      return this.finalize({ kind: 'ESCALATE', subKind: 'safety_escalate', reason: 'cs_window_expired' }, acc, t0);

    // ── PENDING ESCALATION GUARD ───────────────────────────────────────
    // If this conversation already has a PENDING BotDraft, do NOT create a second escalation.
    // Try to answer from the KB; if it can't, tell the customer the prior enquiry is in progress.
    if (await this.conversations.hasPendingEscalation(input.conversationId)) {
      // A transient LLM outage during classify returns a finalized IGNORE (stay silent) — surface
      // it as-is, which also guarantees no second escalation is filed. Otherwise try a confident
      // KB answer; on a miss, gently tell the customer the prior enquiry is still in progress.
      const cls = await this.safeClassify(input, acc, t0);
      if ('kind' in cls) return cls;
      const lang = acc.detectedLanguage as 'en' | 'ms';
      const ragResult = await this.tryRagAnswer(input, acc, lang);
      if (ragResult.kind === 'success') {
        return this.finalize(
          { kind: 'AUTO_SEND', subKind: 'rag_answer', reason: 'approved', draftBody: ragResult.body },
          acc,
          t0,
        );
      }
      return this.finalize(
        {
          kind: 'AUTO_SEND',
          subKind: 'still_being_processed',
          reason: 'pending_escalation_still_processing',
          draftBody: this.canned.get('still_being_processed', lang),
        },
        acc,
        t0,
      );
    }

    // ── ESCALATION_OFFERED BRANCH ──────────────────────────────────────
    if (await this.conversations.isOfferingEscalation(input.conversationId)) {
      const lang = await this.detectLanguageSafe(input.inboundMessageBody);
      acc.detectedLanguage = lang;
      const verdict = this.yesNo.detect(input.inboundMessageBody);
      if (verdict === 'yes') {
        const originalInboundId = await this.conversations.getEscalationOfferOriginalInboundId(input.conversationId);
        return this.finalize(
          {
            kind: 'ESCALATE',
            subKind: 'consent_accepted_escalate',
            reason: 'escalation_accepted',
            draftBody: this.canned.get('escalation_accepted', lang),
            sideEffects: { escalateUsingOriginalQuestion: { originalInboundId } },
          },
          acc,
          t0,
        );
      }
      if (verdict === 'no') {
        return this.finalize(
          {
            kind: 'AUTO_SEND',
            subKind: 'escalation_declined_ack',
            reason: 'escalation_declined',
            draftBody: this.canned.get('escalation_declined', lang),
            sideEffects: { clearOfferState: true },
          },
          acc,
          t0,
        );
      }
      // ambiguous → expire the offer and treat this inbound as a fresh question (fall through).
      await this.conversations.clearOfferState(input.conversationId);
      acc.guardrailFailures = [];
    }

    // ── MAIN PIPELINE ──────────────────────────────────────────────────
    const cls = await this.safeClassify(input, acc, t0);
    if ('kind' in cls) return cls;
    const language = acc.detectedLanguage as 'en' | 'ms';

    if (this.optOut.detect(input.inboundMessageBody))
      return this.finalize({ kind: 'ESCALATE', subKind: 'safety_escalate', reason: 'opt_out_requested' }, acc, t0);
    if (this.complaint.detect(input.inboundMessageBody))
      return this.finalize({ kind: 'ESCALATE', subKind: 'safety_escalate', reason: 'complaint' }, acc, t0);
    if ((acc.intentConfidence ?? 0) < LOW_INTENT_CONFIDENCE)
      return this.finalize({ kind: 'ESCALATE', subKind: 'safety_escalate', reason: 'low_intent_confidence' }, acc, t0);

    // Retrieve (history-aware: resolve elliptical follow-ups before embedding the query)
    const { searchQuery } = await this.contextualizer.contextualize(
      input.inboundMessageBody,
      input.conversationHistory,
    );
    let retrieval: RetrievalResult;
    try {
      retrieval = await this.retrieveReranked(searchQuery);
    } catch (e) {
      if (e instanceof EmbeddingsExhaustedException)
        return this.finalize({ kind: 'IGNORE', subKind: 'ignore_embeddings_unavailable', reason: 'embeddings_unavailable' }, acc, t0);
      throw e;
    }
    acc.chunksRetrieved = retrieval.chunks.length;
    acc.topChunkScore = retrieval.chunks[0]?.similarityScore;
    acc.embeddingModelUsed = retrieval.queryEmbeddingModel;
    acc.retrievalLatencyMs = retrieval.totalLatencyMs;
    acc.topChunks = retrieval.chunks;

    // KB miss → CONSENT OFFER (not a silent escalation)
    if (retrieval.chunks.length === 0) {
      return this.finalize(
        {
          kind: 'AUTO_SEND',
          subKind: 'consent_offer',
          reason: 'escalation_offer_sent:no_kb',
          draftBody: this.canned.get('consent_offer', language),
          sideEffects: { setOfferState: { inboundMessageId: '__current__' } },
        },
        acc,
        t0,
      );
    }

    // Draft
    let draft: DrafterOutput;
    try {
      draft = await this.drafter.draft({
        customerMessage: input.inboundMessageBody,
        language,
        chunks: retrieval.chunks,
        conversationHistory: input.conversationHistory,
        businessName: input.businessName,
        campaignText: input.campaignContext?.renderedText,
      });
    } catch (e) {
      if (e instanceof LlmExhaustedException)
        return this.finalize({ kind: 'IGNORE', subKind: 'ignore_llm_unavailable', reason: 'llm_unavailable' }, acc, t0);
      throw e;
    }
    acc.draftConfidence = draft.draftConfidence;
    acc.modelUsed = draft.modelUsed;
    acc.citedChunkIds = draft.citedChunkIds;
    acc.citedRanks = draft.citedRanks;

    const threshold = (await this.settings.get('confidence_threshold', 0.85)) as number;
    // Low confidence → CONSENT OFFER (not a silent escalation)
    if (draft.draftConfidence < threshold) {
      return this.finalize(
        {
          kind: 'AUTO_SEND',
          subKind: 'consent_offer',
          reason: 'escalation_offer_sent:low_conf',
          draftBody: this.canned.get('consent_offer', language),
          sideEffects: { setOfferState: { inboundMessageId: '__current__' } },
        },
        acc,
        t0,
      );
    }

    const guard = this.guardrails.evaluate(draft.body, {
      chunks: retrieval.chunks,
      language,
      campaignText: input.campaignContext?.renderedText,
      customerMessage: input.inboundMessageBody,
      conversationHistory: input.conversationHistory,
    });
    if (!guard.passed) {
      acc.guardrailFailures = guard.failures;
      return this.finalize(
        { kind: 'ESCALATE', subKind: 'safety_escalate', reason: `guardrail_${guard.failures[0]}` },
        acc,
        t0,
      );
    }

    if (!(await this.isWithinBusinessHours()))
      return this.finalize({ kind: 'ESCALATE', subKind: 'safety_escalate', reason: 'out_of_hours' }, acc, t0);

    return this.finalize({ kind: 'AUTO_SEND', subKind: 'rag_answer', reason: 'approved', draftBody: draft.body }, acc, t0);
  }

  /**
   * Classify the message, recording intent/confidence/language into the accumulator. Returns the
   * classification on success, or a finalized ESCALATE Decision when the LLM chain is exhausted
   * (callers detect this via the `'kind' in result` discriminant).
   */
  private async safeClassify(
    input: DecisionInput,
    acc: Partial<Decision>,
    t0: number,
  ): Promise<Classification | Decision> {
    try {
      const cls = await this.classifier.classify(input.inboundMessageBody);
      acc.intent = cls.intent;
      acc.intentConfidence = cls.confidence;
      acc.detectedLanguage = cls.language;
      return cls;
    } catch (e) {
      if (e instanceof LlmExhaustedException)
        return this.finalize({ kind: 'IGNORE', subKind: 'ignore_llm_unavailable', reason: 'llm_unavailable' }, acc, t0);
      throw e;
    }
  }

  /** Best-effort language detection for the consent flow; defaults to English if classify fails. */
  private async detectLanguageSafe(message: string): Promise<'en' | 'ms'> {
    try {
      return (await this.classifier.classify(message)).language;
    } catch {
      return 'en';
    }
  }

  /**
   * Dense-retrieve then (when enabled) rerank by relevance, returning a RetrievalResult whose
   * `chunks` are the top-N the drafter should see. When the reranker is disabled, retrieval is
   * byte-for-byte unchanged: `fetchTopK()` is undefined (RetrievalService keeps its own default
   * top-K) and the reranker is never invoked. The reranker never throws; only `retrieve` can
   * surface an EmbeddingsExhaustedException, which callers handle.
   */
  private async retrieveReranked(searchQuery: string): Promise<RetrievalResult> {
    // One read of fetchTopK() drives both the fetch width AND the gate: undefined means the
    // reranker is off, so retrieval keeps its default top-K and we skip rerank entirely.
    const topK = this.reranker.fetchTopK();
    const retrieval = await this.retrieval.retrieve(searchQuery, { topK });
    if (topK === undefined) return retrieval;
    const chunks = await this.reranker.rerank(searchQuery, retrieval.chunks);
    return { ...retrieval, chunks };
  }

  /**
   * Attempt a confident RAG answer without ever escalating — used under the pending-escalation
   * guard, where a second ticket must never be created. Any failure (no chunks, low confidence,
   * guardrail rejection, or a thrown LLM/embeddings error) collapses to a `miss`.
   */
  private async tryRagAnswer(
    input: DecisionInput,
    acc: Partial<Decision>,
    language: 'en' | 'ms',
  ): Promise<{ kind: 'success'; body: string } | { kind: 'miss' }> {
    try {
      const { searchQuery } = await this.contextualizer.contextualize(
        input.inboundMessageBody,
        input.conversationHistory,
      );
      const retrieval = await this.retrieveReranked(searchQuery);
      acc.chunksRetrieved = retrieval.chunks.length;
      acc.topChunkScore = retrieval.chunks[0]?.similarityScore;
      acc.embeddingModelUsed = retrieval.queryEmbeddingModel;
      acc.retrievalLatencyMs = retrieval.totalLatencyMs;
      acc.topChunks = retrieval.chunks;
      if (retrieval.chunks.length === 0) return { kind: 'miss' };

      const draft = await this.drafter.draft({
        customerMessage: input.inboundMessageBody,
        language,
        chunks: retrieval.chunks,
        conversationHistory: input.conversationHistory,
        businessName: input.businessName,
        campaignText: input.campaignContext?.renderedText,
      });
      acc.draftConfidence = draft.draftConfidence;
      acc.modelUsed = draft.modelUsed;
      acc.citedChunkIds = draft.citedChunkIds;
      acc.citedRanks = draft.citedRanks;

      const threshold = (await this.settings.get('confidence_threshold', 0.85)) as number;
      if (draft.draftConfidence < threshold) return { kind: 'miss' };

      const guard = this.guardrails.evaluate(draft.body, {
        chunks: retrieval.chunks,
        language,
        campaignText: input.campaignContext?.renderedText,
        customerMessage: input.inboundMessageBody,
        conversationHistory: input.conversationHistory,
      });
      if (!guard.passed) return { kind: 'miss' };

      return { kind: 'success', body: draft.body };
    } catch {
      return { kind: 'miss' };
    }
  }

  private finalize(core: DecisionCore, acc: Partial<Decision>, t0: number): Decision {
    return { ...core, totalLatencyMs: Date.now() - t0, ...acc } as Decision;
  }

  /**
   * True when "now" falls inside the configured business window. Honours the business timezone,
   * the comma-separated business days (e.g. "MON,TUE,WED,THU,FRI"), and HH:MM open/close times,
   * all read from {@link ChatbotSettingsService}. Days/times are evaluated in the business's own
   * timezone, not the server's.
   */
  private async isWithinBusinessHours(): Promise<boolean> {
    const start = (await this.settings.get('business_hours_start', '09:00')) as string;
    const end = (await this.settings.get('business_hours_end', '18:00')) as string;
    const timezone = (await this.settings.get('business_hours_timezone', 'Asia/Kuala_Lumpur')) as string;
    const daysCsv = (await this.settings.get('business_days', 'MON,TUE,WED,THU,FRI')) as string;

    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour12: false,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(new Date());
    const part = (type: string) => parts.find((p) => p.type === type)?.value ?? '';

    const weekday = part('weekday').slice(0, 3).toUpperCase(); // "Mon" → "MON"
    let hour = parseInt(part('hour'), 10);
    if (Number.isNaN(hour) || hour === 24) hour = 0; // some runtimes render midnight as "24"
    const minute = parseInt(part('minute'), 10) || 0;

    const allowedDays = daysCsv
      .split(',')
      .map((d) => d.trim().toUpperCase())
      .filter(Boolean);
    if (!allowedDays.includes(weekday)) return false;

    const nowMinutes = hour * 60 + minute;
    return nowMinutes >= toMinutes(start) && nowMinutes < toMinutes(end);
  }
}

/** "HH:MM" → minutes since midnight. "24:00" maps to 1440 (end-of-day sentinel). */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return (h || 0) * 60 + (m || 0);
}
