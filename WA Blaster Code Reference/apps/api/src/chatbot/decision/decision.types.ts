import { RetrievedChunk } from '../knowledge/retrieval.service';

export type DecisionKind = 'AUTO_SEND' | 'ESCALATE' | 'IGNORE';

export type DecisionSubKind =
  // AUTO_SEND sub-kinds — orchestrator just sends `draftBody`
  | 'rag_answer' // confident RAG reply
  | 'consent_offer' // "want customer support?" canned
  | 'escalation_accepted_ack' // canned "Got it — passed to support" (operator-facing escalation still created)
  | 'escalation_declined_ack' // canned "no problem"
  | 'still_being_processed' // canned "your previous enquiry..."
  // ESCALATE sub-kinds — orchestrator creates BotDraft, no outbound to customer (operator will reply)
  | 'safety_escalate' // opt_out, complaint, kill_switch, cs_window_expired, low_intent_confidence, guardrail_*, out_of_hours
  | 'consent_accepted_escalate' // customer said yes → escalate the original question
  // IGNORE sub-kinds — orchestrator does nothing (no send, no draft, no state change)
  | 'ignore_disabled'
  | 'ignore_opted_out'
  | 'ignore_stale' // inbound delivered long after it was sent (late Meta redelivery) — don't auto-reply
  | 'ignore_llm_unavailable' // transient LLM outage — stay silent rather than escalate (avoids poisoning the convo)
  | 'ignore_human_handling' // a human operator owns this conversation — autopilot stands down
  | 'ignore_embeddings_unavailable'; // transient embeddings outage — stay silent

export interface DecisionInput {
  inboundMessageBody: string;
  contactOptedIn: boolean;
  csWindowOpen: boolean;
  businessName: string;
  conversationId: string;
  conversationHistory?: Array<{ role: 'customer' | 'bot' | 'operator'; body: string }>;
  campaignContext?: { campaignName: string; renderedText: string; blastId: string };
  /** When the customer actually sent the message (Meta timestamp). Used to drop stale redeliveries. */
  receivedAt?: Date;
}

export interface Decision {
  kind: DecisionKind;
  subKind: DecisionSubKind;
  reason: string; // human-readable; e.g. "approved" | "escalation_offer_sent:no_kb" | "pending_escalation_still_processing"

  draftBody?: string; // the message to send (set for every AUTO_SEND; absent for ESCALATE/IGNORE)

  intent?: string;
  intentConfidence?: number;
  detectedLanguage: 'en' | 'ms';

  draftConfidence?: number;
  modelUsed?: string;

  citedChunkIds: string[];
  citedRanks: number[];
  topChunks?: RetrievedChunk[]; // full retrieval result; orchestrator uses these for citation persistence

  chunksRetrieved: number;
  // Dense cosine score of the top chunk the drafter saw. When the reranker fired this is the
  // reranked-best chunk's dense score (often lower than the pre-rerank top) — observability only,
  // no gate reads it.
  topChunkScore?: number;
  embeddingModelUsed?: string;
  retrievalLatencyMs?: number;

  guardrailFailures: string[];
  totalLatencyMs: number;

  // ESCALATION_OFFERED-related side-effects the engine signals to the orchestrator
  // (the orchestrator carries these out by calling ConversationService methods)
  sideEffects?: {
    setOfferState?: { inboundMessageId: string }; // engine emitted a consent_offer → set state ESCALATION_OFFERED
    clearOfferState?: boolean; // customer said no → state back to NEW; clear offer fields
    escalateUsingOriginalQuestion?: { originalInboundId: string }; // customer said yes → escalate using the original question
  };
}
