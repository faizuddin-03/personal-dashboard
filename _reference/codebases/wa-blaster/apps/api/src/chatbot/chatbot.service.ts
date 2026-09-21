import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationService, ConversationHistoryTurn } from './conversations/conversation.service';
import { DecisionEngine } from './decision/decision-engine.service';
import { ChatbotWhatsappService } from './whatsapp/chatbot-whatsapp.service';
import { ChatbotSettingsService } from './settings/chatbot-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { Decision } from './decision/decision.types';
import { CampaignContextService } from './campaign/campaign-context.service';
import { ChatbotInboxBridge } from './bridge/chatbot-inbox-bridge.service';

export interface ChatbotInboundPayload {
  contacts: Array<{ wa_id: string; profile?: { name?: string } }>;
  message: {
    from: string;
    id: string;
    timestamp: string;
    type: string;
    text?: { body: string };
    context?: { id?: string };
  };
}

interface CitationRecord {
  chunkId: string;
  similarityScore: number;
  rank: number;
}

/**
 * Webhook → decision → action orchestrator. Persists every decision for audit, then carries out
 * the engine's verdict: send a confident RAG reply, send a canned consent/ack reply, and/or open
 * an operator escalation. The state machine itself lives in {@link ConversationService}; this class
 * only sequences the side-effects the engine signals (via `decision.sideEffects`) and the WhatsApp
 * send. It owns the chatbot's *own* Meta client, never the blasting one.
 */
@Injectable()
export class ChatbotService {
  /**
   * Whether message bodies (PII) may appear in logs. Off by default; flip with
   * CHATBOT_LOG_BODIES=true only in a trusted environment for debugging.
   */
  private readonly logBodies: boolean;

  constructor(
    private readonly conversations: ConversationService,
    private readonly decisionEngine: DecisionEngine,
    private readonly whatsapp: ChatbotWhatsappService,
    private readonly prisma: PrismaService,
    private readonly settings: ChatbotSettingsService,
    private readonly logger: Logger,
    private readonly config: ConfigService,
    private readonly campaign: CampaignContextService,
    private readonly inboxBridge: ChatbotInboxBridge,
  ) {
    this.logBodies = this.config.get<string>('CHATBOT_LOG_BODIES', 'false') === 'true';
  }

  async handleInbound(payload: ChatbotInboundPayload): Promise<void> {
    const { message, contacts } = payload;

    if (message.type !== 'text' || !message.text?.body) {
      // Pre-decision guard: no conversation/decision context exists yet.
      this.logger.log(`ignored_non_text type=${message.type} wamid=${message.id}`);
      return;
    }
    const body = message.text.body;

    const phoneE164 = '+' + message.from;
    const contact = await this.prisma.contact.findUnique({ where: { phoneE164 } });
    if (!contact) {
      // Pre-decision guard: no conversation/decision context exists yet.
      this.logger.warn(`unknown_contact phone=${phoneE164} wamid=${message.id} — skipping`);
      return;
    }

    const receivedAt = new Date(parseInt(message.timestamp, 10) * 1000);
    const { conversation, inboundMessage } = await this.conversations.handleInbound({
      contactId: contact.id,
      metaMessageId: message.id,
      body,
      receivedAt,
      rawJson: { contacts, message },
    });
    const conversationId = conversation.id;
    const inboundMessageId = inboundMessage.id;

    const csWindowOpen = await this.conversations.getCsWindowOpen(conversationId);
    const businessName = await this.settings.get('business_name', 'Our Business');

    // Campaign attribution: exact quote-reply match, else most-recent blast within the window.
    // Best-effort: a DB failure here must not drop the inbound — fall back to KB-only RAG.
    let campaignContext: { campaignName: string; renderedText: string; blastId: string } | undefined;
    try {
      campaignContext =
        (await this.campaign.getActiveCampaign({ contact, replyToMetaMessageId: message.context?.id })) ?? undefined;
    } catch (err) {
      this.logger.warn(`campaign_attribution_failed wamid=${message.id} error=${(err as Error).message}`);
    }

    // Conversation memory: prior turns only. getConversationHistory returns turns sorted
    // oldest-first and tail-sliced to a limit, so the last entry is the inbound persisted just
    // above — drop it so the engine sees only prior context. Best-effort: a failure degrades to
    // no history rather than dropping the inbound.
    let conversationHistory: ConversationHistoryTurn[] = [];
    try {
      const history = await this.conversations.getConversationHistory(conversationId);
      conversationHistory = history.slice(0, -1);
    } catch (err) {
      this.logger.warn(`history_fetch_failed conversationId=${conversationId} error=${(err as Error).message}`);
    }

    const decision = await this.decisionEngine.decide({
      inboundMessageBody: body,
      contactOptedIn: contact.optInStatus === 'OPTED_IN',
      csWindowOpen,
      businessName,
      conversationId,
      conversationHistory,
      campaignContext,
      receivedAt,
    });

    // Always persist the decision (audit) — independent of what we do with it.
    await this.prisma.chatbotDecision.create({
      data: {
        conversationId,
        inboundMessageId,
        kind: decision.kind,
        reason: decision.reason,
        intent: decision.intent,
        intentConfidence: decision.intentConfidence,
        draftConfidence: decision.draftConfidence,
        modelUsed: decision.modelUsed,
        embeddingModelUsed: decision.embeddingModelUsed,
        totalLatencyMs: decision.totalLatencyMs,
        retrievalLatencyMs: decision.retrievalLatencyMs,
        guardrailFailures: decision.guardrailFailures,
        topChunkScore: decision.topChunkScore,
        chunksRetrieved: decision.chunksRetrieved,
      },
    });

    // Record the detected language on the conversation.
    if (decision.detectedLanguage) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { detectedLanguage: decision.detectedLanguage === 'ms' ? 'MS' : 'EN' },
      });
    }

    // One structured line per handled inbound — carries the full decision context so logs are
    // greppable and aggregatable. Bodies (PII) appear only when CHATBOT_LOG_BODIES=true.
    const logFields = this.decisionLogFields({ conversationId, inboundMessageId, decision, body });
    this.logger.log(`decision ${logFields}`);

    const citations = this.buildCitations(decision);

    // Quote the original question only when other activity (a newer question, or the bot's own
    // earlier reply) has appeared since it arrived — so an "out of order" reply is unambiguous,
    // while a reply that directly follows its question stays clean (no quote).
    const quoteWamid = (await this.conversations.hasActivityAfterInbound(conversationId, inboundMessageId))
      ? message.id
      : undefined;

    try {
      switch (decision.subKind) {
        case 'rag_answer': {
          const { metaMessageId } = await this.whatsapp.sendTextMessage(phoneE164, decision.draftBody!, quoteWamid);
          const botDraft = await this.prisma.botDraft.create({
            data: {
              conversationId,
              inboundMessageId,
              ...this.buildDraftData(decision, decision.draftBody!),
              state: 'SENT',
            },
          });
          await this.persistCitations(botDraft.id, citations);
          await this.conversations.recordAutoReply({
            conversationId,
            body: decision.draftBody!,
            metaMessageId,
            botDraftId: botDraft.id,
            subKind: 'rag_answer',
          });
          await this.inboxBridge.recordAutoReply({
            contactId: contact.id,
            intent: decision.intent,
            confidence: decision.draftConfidence,
            replyText: decision.draftBody!,
            metaMessageId,
            model: decision.modelUsed,
          });
          // Read receipt is best-effort; never block or fail the turn on it.
          void this.whatsapp.markAsRead(message.id).catch(() => undefined);
          break;
        }

        case 'consent_offer': {
          await this.whatsapp.sendTextMessage(phoneE164, decision.draftBody!, quoteWamid);
          await this.conversations.recordAutoReply({ conversationId, body: decision.draftBody!, subKind: 'consent_offer' });
          // The engine emits a '__current__' sentinel; the orchestrator owns the real inbound id.
          await this.conversations.recordEscalationOffer(conversationId, inboundMessageId);
          break;
        }

        case 'escalation_accepted_ack':
        case 'consent_accepted_escalate': {
          // Two-action: ack the customer AND open an operator ticket for the ORIGINAL question.
          const { metaMessageId } = await this.whatsapp.sendTextMessage(phoneE164, decision.draftBody!, quoteWamid);
          await this.conversations.recordAutoReply({
            conversationId,
            body: decision.draftBody!,
            metaMessageId,
            subKind: 'escalation_accepted_ack',
          });
          const originalInboundId = decision.sideEffects!.escalateUsingOriginalQuestion!.originalInboundId;
          const originalInbound = await this.prisma.conversationInboundMessage.findUniqueOrThrow({
            where: { id: originalInboundId },
          });
          // recordEscalation transitions the conversation to ESCALATED, which makes the stale
          // ESCALATION_OFFERED fields inert — no explicit clearOfferState needed.
          await this.conversations.recordEscalation({
            conversationId,
            inboundMessageId: originalInbound.id,
            draftData: this.buildDraftData(decision, originalInbound.body),
            citations,
          });
          // decision.reason here ('escalation_accepted') maps to the SENSITIVE catch-all in the bridge.
          await this.inboxBridge.recordEscalation({
            contactId: contact.id,
            conversationId,
            reason: decision.reason,
            intent: decision.intent,
            confidence: decision.intentConfidence,
          });
          break;
        }

        case 'escalation_declined_ack': {
          await this.whatsapp.sendTextMessage(phoneE164, decision.draftBody!, quoteWamid);
          await this.conversations.recordAutoReply({
            conversationId,
            body: decision.draftBody!,
            subKind: 'escalation_declined_ack',
          });
          await this.conversations.clearOfferState(conversationId);
          break;
        }

        case 'still_being_processed': {
          await this.whatsapp.sendTextMessage(phoneE164, decision.draftBody!, quoteWamid);
          await this.conversations.recordAutoReply({
            conversationId,
            body: decision.draftBody!,
            subKind: 'still_being_processed',
          });
          // The existing PENDING escalation stays — no state change, no new draft.
          break;
        }

        case 'safety_escalate': {
          // No outbound to the customer — an operator will reply. Queue their question.
          await this.conversations.recordEscalation({
            conversationId,
            inboundMessageId,
            draftData: this.buildDraftData(decision, body),
            citations,
          });
          await this.inboxBridge.recordEscalation({
            contactId: contact.id,
            conversationId,
            reason: decision.reason,
            intent: decision.intent,
            confidence: decision.intentConfidence,
          });
          break;
        }

        case 'ignore_disabled':
        case 'ignore_opted_out':
        case 'ignore_stale':
        case 'ignore_human_handling':
        case 'ignore_llm_unavailable':
        case 'ignore_embeddings_unavailable':
          // Intentional no-op: recorded in chatbot_decisions for audit; no send, no draft, no state
          // change. (Transient LLM/embeddings outages stay silent here rather than poison the convo.)
          break;

        default:
          this.logger.warn(`unhandled_subkind ${logFields}`);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      this.logger.error(`dispatch_failed error=${JSON.stringify(reason)} ${logFields}`);
      // A failed confident auto-send must not vanish — hand the operator the ready-made draft.
      // Failed canned replies (offer/ack/still-processing) are best-effort: log only, no operator noise.
      if (decision.subKind === 'rag_answer') {
        await this.conversations.recordEscalation({
          conversationId,
          inboundMessageId,
          // body = the customer's question (operator context); suggestedReply = the vetted reply that
          // failed to send, so Approve has something genuinely sendable (unlike safety/consent drafts).
          draftData: this.buildDraftData(decision, body),
          citations,
          suggestedReply: decision.draftBody,
        });
        await this.inboxBridge.recordEscalation({
          contactId: contact.id,
          conversationId,
          reason: 'dispatch_failure',
          intent: decision.intent,
          confidence: decision.draftConfidence,
        });
      }
    }
  }

  /**
   * The structured `key=value` suffix attached to every decision-path log line. Always carries the
   * spec's required observability fields (conversationId, inboundMessageId, decisionKind, reason,
   * chunksRetrieved, topChunkScore, totalLatencyMs); subKind + retrievalLatencyMs are included for
   * triage. The raw message body is PII and is emitted only when CHATBOT_LOG_BODIES=true.
   */
  private decisionLogFields(args: {
    conversationId: string;
    inboundMessageId: string;
    decision: Decision;
    body: string;
  }): string {
    const { conversationId, inboundMessageId, decision, body } = args;
    const fields: Array<[string, unknown]> = [
      ['conversationId', conversationId],
      ['inboundMessageId', inboundMessageId],
      ['decisionKind', decision.kind],
      ['subKind', decision.subKind],
      ['reason', decision.reason],
      ['chunksRetrieved', decision.chunksRetrieved],
      ['topChunkScore', decision.topChunkScore ?? ''],
      ['retrievalLatencyMs', decision.retrievalLatencyMs ?? ''],
      ['totalLatencyMs', decision.totalLatencyMs],
    ];
    if (this.logBodies) fields.push(['body', JSON.stringify(body)]);
    return fields.map(([k, v]) => `${k}=${v}`).join(' ');
  }

  /** The cited subset of the retrieved chunks, shaped for BotDraftCitation rows. */
  private buildCitations(decision: Decision): CitationRecord[] {
    return (decision.topChunks ?? [])
      .filter((c) => decision.citedChunkIds.includes(c.chunkId))
      .map((c) => ({ chunkId: c.chunkId, similarityScore: c.similarityScore, rank: c.rank }));
  }

  private async persistCitations(botDraftId: string, citations: CitationRecord[]): Promise<void> {
    if (citations.length === 0) return;
    await this.prisma.botDraftCitation.createMany({
      data: citations.map((c) => ({ botDraftId, chunkId: c.chunkId, similarityScore: c.similarityScore, rank: c.rank })),
    });
  }

  /** The scalar BotDraft columns — everything except ids, state and citations. */
  private buildDraftData(decision: Decision, body: string) {
    return {
      body,
      intent: decision.intent ?? 'unknown',
      intentConfidence: decision.intentConfidence ?? 0,
      draftConfidence: decision.draftConfidence ?? 0,
      modelUsed: decision.modelUsed ?? 'unknown',
      embeddingModelUsed: decision.embeddingModelUsed ?? 'unknown',
      latencyMs: decision.totalLatencyMs,
    };
  }
}
