import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatbotService, ChatbotInboundPayload } from './chatbot.service';
import { ConversationService } from './conversations/conversation.service';
import { DecisionEngine } from './decision/decision-engine.service';
import { ChatbotWhatsappService } from './whatsapp/chatbot-whatsapp.service';
import { ChatbotSettingsService } from './settings/chatbot-settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { Decision } from './decision/decision.types';
import { RetrievedChunk } from './knowledge/retrieval.service';
import { CampaignContextService } from './campaign/campaign-context.service';

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

/** Happy-path RAG decision; each test overrides exactly the fields its branch needs. */
function decision(over: Partial<Decision> = {}): Decision {
  return {
    kind: 'AUTO_SEND',
    subKind: 'rag_answer',
    reason: 'approved',
    draftBody: 'We open at 9am daily.',
    intent: 'question',
    intentConfidence: 0.9,
    detectedLanguage: 'en',
    draftConfidence: 0.95,
    modelUsed: 'mock-model',
    citedChunkIds: ['c1'],
    citedRanks: [1],
    topChunks: [chunk({ chunkId: 'c1', rank: 1 })],
    chunksRetrieved: 1,
    topChunkScore: 0.9,
    embeddingModelUsed: 'mock-embed',
    retrievalLatencyMs: 7,
    guardrailFailures: [],
    totalLatencyMs: 42,
    ...over,
  };
}

function payload(over: { contacts?: ChatbotInboundPayload['contacts']; message?: Partial<ChatbotInboundPayload['message']> } = {}): ChatbotInboundPayload {
  return {
    contacts: over.contacts ?? [{ wa_id: '60123456789', profile: { name: 'Ali' } }],
    message: {
      from: '60123456789',
      id: 'wamid.abc',
      timestamp: '1700000000',
      type: 'text',
      text: { body: 'What time do you open?' },
      ...over.message,
    },
  };
}

function buildService() {
  const conversations = {
    handleInbound: jest.fn(async () => ({ conversation: { id: 'conv-1' }, inboundMessage: { id: 'inb-1' } })),
    getCsWindowOpen: jest.fn(async () => true),
    getConversationHistory: jest.fn(async () => []),
    recordAutoReply: jest.fn(async () => ({ id: 'out-1' })),
    recordEscalation: jest.fn(async () => ({ id: 'draft-esc-1' })),
    recordEscalationOffer: jest.fn(async () => ({ id: 'conv-1' })),
    clearOfferState: jest.fn(async () => undefined),
    hasActivityAfterInbound: jest.fn(async () => false),
  };
  const decisionEngine = { decide: jest.fn(async () => decision()) };
  const whatsapp = {
    sendTextMessage: jest.fn(async () => ({ metaMessageId: 'wamid.sent' })),
    markAsRead: jest.fn(async () => undefined),
  };
  const prisma = {
    contact: {
      findUnique: jest.fn(
        async (): Promise<{ id: string; optInStatus: string } | null> => ({ id: 'contact-1', optInStatus: 'OPTED_IN' }),
      ),
    },
    conversation: { update: jest.fn(async () => ({ id: 'conv-1' })) },
    chatbotDecision: { create: jest.fn(async () => ({ id: 'dec-1' })) },
    botDraft: { create: jest.fn(async () => ({ id: 'draft-1' })) },
    botDraftCitation: { createMany: jest.fn(async () => ({ count: 1 })) },
    conversationInboundMessage: {
      findUniqueOrThrow: jest.fn(async () => ({ id: 'orig-1', body: 'original question' })),
    },
  };
  const settings = { get: jest.fn(async () => 'Kedai Kopi') };
  const logger = { log: jest.fn(), warn: jest.fn(), error: jest.fn() };
  // CHATBOT_LOG_BODIES defaults off → get() returns the supplied default ('false').
  const config = { get: jest.fn((_key: string, def?: unknown) => def) };
  const campaign = { getActiveCampaign: jest.fn(async () => null) };
  const inboxBridge = { recordAutoReply: jest.fn().mockResolvedValue(undefined), recordEscalation: jest.fn().mockResolvedValue(undefined) };

  const service = new ChatbotService(
    conversations as unknown as ConversationService,
    decisionEngine as unknown as DecisionEngine,
    whatsapp as unknown as ChatbotWhatsappService,
    prisma as unknown as PrismaService,
    settings as unknown as ChatbotSettingsService,
    logger as unknown as Logger,
    config as unknown as ConfigService,
    campaign as unknown as CampaignContextService,
    inboxBridge as never,
  );

  return { service, conversations, decisionEngine, whatsapp, prisma, settings, logger, config, campaign, inboxBridge };
}

describe('ChatbotService', () => {
  describe('guards', () => {
    it('ignores a non-text inbound — logs and never touches the DB or engine', async () => {
      const { service, prisma, decisionEngine, logger } = buildService();

      await service.handleInbound(payload({ message: { type: 'image', text: undefined } }));

      expect(logger.log).toHaveBeenCalled();
      expect(prisma.contact.findUnique).not.toHaveBeenCalled();
      expect(decisionEngine.decide).not.toHaveBeenCalled();
    });

    it('logs and skips when the contact is unknown', async () => {
      const { service, prisma, conversations, decisionEngine, logger } = buildService();
      prisma.contact.findUnique.mockResolvedValueOnce(null);

      await service.handleInbound(payload());

      expect(logger.warn).toHaveBeenCalled();
      expect(conversations.handleInbound).not.toHaveBeenCalled();
      expect(decisionEngine.decide).not.toHaveBeenCalled();
    });
  });

  describe('audit + language (every decision)', () => {
    it('always persists the chatbot_decision row', async () => {
      const { service, prisma } = buildService();

      await service.handleInbound(payload());

      expect(prisma.chatbotDecision.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: 'conv-1',
            inboundMessageId: 'inb-1',
            kind: 'AUTO_SEND',
            reason: 'approved',
            totalLatencyMs: 42,
          }),
        }),
      );
    });

    it('maps detectedLanguage ms → MS on the conversation', async () => {
      const { service, prisma, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(decision({ detectedLanguage: 'ms' }));

      await service.handleInbound(payload());

      expect(prisma.conversation.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'conv-1' }, data: { detectedLanguage: 'MS' } }),
      );
    });

    it('passes through the customer message, opt-in and CS-window to the engine', async () => {
      const { service, decisionEngine, conversations } = buildService();

      await service.handleInbound(payload());

      expect(conversations.handleInbound).toHaveBeenCalledWith(
        expect.objectContaining({ contactId: 'contact-1', metaMessageId: 'wamid.abc', body: 'What time do you open?' }),
      );
      expect(decisionEngine.decide).toHaveBeenCalledWith(
        expect.objectContaining({
          inboundMessageBody: 'What time do you open?',
          contactOptedIn: true,
          csWindowOpen: true,
          businessName: 'Kedai Kopi',
          conversationId: 'conv-1',
        }),
      );
    });

    it('resolves campaign context + history and passes them to the engine', async () => {
      const { service, decisionEngine, conversations, campaign } = buildService();
      conversations.getConversationHistory.mockResolvedValueOnce([
        { role: 'customer', body: 'is towing free?' },
        { role: 'bot', body: 'Yes, unlimited.' },
        { role: 'customer', body: 'What time do you open?' }, // current inbound, dropped
      ]);
      campaign.getActiveCampaign.mockResolvedValueOnce({
        campaignName: 'June Promo',
        renderedText: 'Get 15% off until 30 June.',
        blastId: 'b1',
      });

      await service.handleInbound(payload({ message: { context: { id: 'wamid.blast1' } } }));

      expect(campaign.getActiveCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ replyToMetaMessageId: 'wamid.blast1' }),
      );
      expect(decisionEngine.decide).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignContext: { campaignName: 'June Promo', renderedText: 'Get 15% off until 30 June.', blastId: 'b1' },
          conversationHistory: [
            { role: 'customer', body: 'is towing free?' },
            { role: 'bot', body: 'Yes, unlimited.' },
          ],
        }),
      );
    });

    it('degrades to KB-only when campaign attribution or history fetch throws', async () => {
      const { service, decisionEngine, conversations, campaign } = buildService();
      campaign.getActiveCampaign.mockRejectedValueOnce(new Error('db down'));
      conversations.getConversationHistory.mockRejectedValueOnce(new Error('db down'));

      await service.handleInbound(payload());

      // The inbound is NOT dropped — the engine still runs, with safe defaults.
      expect(decisionEngine.decide).toHaveBeenCalledWith(
        expect.objectContaining({ campaignContext: undefined, conversationHistory: [] }),
      );
    });
  });

  describe('rag_answer (AUTO_SEND)', () => {
    it('sends the draft, records a SENT BotDraft + citations, records the auto-reply, marks read', async () => {
      const { service, whatsapp, prisma, conversations, inboxBridge } = buildService();

      await service.handleInbound(payload());

      expect(whatsapp.sendTextMessage).toHaveBeenCalledWith('+60123456789', 'We open at 9am daily.', undefined);
      expect(prisma.botDraft.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            conversationId: 'conv-1',
            inboundMessageId: 'inb-1',
            body: 'We open at 9am daily.',
            state: 'SENT',
          }),
        }),
      );
      expect(prisma.botDraftCitation.createMany).toHaveBeenCalledWith({
        data: [{ botDraftId: 'draft-1', chunkId: 'c1', similarityScore: 0.9, rank: 1 }],
      });
      expect(conversations.recordAutoReply).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          body: 'We open at 9am daily.',
          metaMessageId: 'wamid.sent',
          botDraftId: 'draft-1',
          subKind: 'rag_answer',
        }),
      );
      expect(inboxBridge.recordAutoReply).toHaveBeenCalled();
      expect(whatsapp.markAsRead).toHaveBeenCalledWith('wamid.abc');
      expect(conversations.recordEscalation).not.toHaveBeenCalled();
    });

    it('passes the message receivedAt (Meta timestamp) to the engine', async () => {
      const { service, decisionEngine } = buildService();

      await service.handleInbound(payload()); // timestamp '1700000000'

      const decideArg = decisionEngine.decide.mock.calls[0][0];
      expect(decideArg.receivedAt).toEqual(new Date(1700000000 * 1000));
    });

    it('does NOT quote when the reply directly follows its question (no intervening activity)', async () => {
      const { service, whatsapp, conversations } = buildService();
      conversations.hasActivityAfterInbound.mockResolvedValue(false);

      await service.handleInbound(payload());

      expect(whatsapp.sendTextMessage).toHaveBeenCalledWith('+60123456789', 'We open at 9am daily.', undefined);
    });

    it('quotes the original question when other activity has appeared since it arrived', async () => {
      const { service, whatsapp, conversations } = buildService();
      conversations.hasActivityAfterInbound.mockResolvedValue(true);

      await service.handleInbound(payload()); // inbound wamid = 'wamid.abc'

      expect(whatsapp.sendTextMessage).toHaveBeenCalledWith('+60123456789', 'We open at 9am daily.', 'wamid.abc');
    });

    it('does not write citations when no chunks were cited', async () => {
      const { service, prisma, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(decision({ citedChunkIds: [], citedRanks: [], topChunks: [] }));

      await service.handleInbound(payload());

      expect(prisma.botDraft.create).toHaveBeenCalled();
      expect(prisma.botDraftCitation.createMany).not.toHaveBeenCalled();
    });
  });

  describe('consent_offer (AUTO_SEND)', () => {
    it('sends the offer, records the auto-reply, then sets the escalation-offer state with the local inbound id', async () => {
      const { service, whatsapp, conversations, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(
        decision({
          subKind: 'consent_offer',
          reason: 'escalation_offer_sent:no_kb',
          draftBody: 'Would you like customer support? Reply YES or NO.',
          draftConfidence: undefined,
          citedChunkIds: [],
          citedRanks: [],
          topChunks: [],
          sideEffects: { setOfferState: { inboundMessageId: '__current__' } },
        }),
      );

      await service.handleInbound(payload());

      expect(whatsapp.sendTextMessage).toHaveBeenCalledWith('+60123456789', 'Would you like customer support? Reply YES or NO.', undefined);
      expect(conversations.recordAutoReply).toHaveBeenCalledWith(expect.objectContaining({ subKind: 'consent_offer' }));
      // engine emits the '__current__' sentinel; orchestrator substitutes the real inbound id
      expect(conversations.recordEscalationOffer).toHaveBeenCalledWith('conv-1', 'inb-1');
      expect(conversations.recordEscalation).not.toHaveBeenCalled();
    });
  });

  describe('consent_accepted_escalate (ESCALATE, two-action)', () => {
    it('sends the ack, records the ack reply, then escalates using the original question', async () => {
      const { service, whatsapp, conversations, prisma, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(
        decision({
          kind: 'ESCALATE',
          subKind: 'consent_accepted_escalate',
          reason: 'escalation_accepted',
          draftBody: "Got it — I've passed your question to our support team.",
          sideEffects: { escalateUsingOriginalQuestion: { originalInboundId: 'orig-1' } },
        }),
      );

      await service.handleInbound(payload());

      expect(whatsapp.sendTextMessage).toHaveBeenCalledWith(
        '+60123456789',
        "Got it — I've passed your question to our support team.",
        undefined,
      );
      expect(conversations.recordAutoReply).toHaveBeenCalledWith(
        expect.objectContaining({ subKind: 'escalation_accepted_ack' }),
      );
      expect(prisma.conversationInboundMessage.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'orig-1' } });
      expect(conversations.recordEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          inboundMessageId: 'orig-1',
          draftData: expect.objectContaining({ body: 'original question' }),
        }),
      );
    });
  });

  describe('escalation_declined_ack (AUTO_SEND)', () => {
    it('sends the decline ack, records the reply, then clears the offer state', async () => {
      const { service, whatsapp, conversations, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(
        decision({
          subKind: 'escalation_declined_ack',
          reason: 'escalation_declined',
          draftBody: 'No problem. Let me know if you need anything else!',
          sideEffects: { clearOfferState: true },
        }),
      );

      await service.handleInbound(payload());

      expect(whatsapp.sendTextMessage).toHaveBeenCalledWith('+60123456789', 'No problem. Let me know if you need anything else!', undefined);
      expect(conversations.recordAutoReply).toHaveBeenCalledWith(
        expect.objectContaining({ subKind: 'escalation_declined_ack' }),
      );
      expect(conversations.clearOfferState).toHaveBeenCalledWith('conv-1');
      expect(conversations.recordEscalation).not.toHaveBeenCalled();
    });
  });

  describe('still_being_processed (AUTO_SEND)', () => {
    it('sends the canned reply only — no escalation, no offer change, no BotDraft', async () => {
      const { service, whatsapp, conversations, prisma, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(
        decision({
          subKind: 'still_being_processed',
          reason: 'pending_escalation_still_processing',
          draftBody: 'Your previous enquiry is still being processed.',
        }),
      );

      await service.handleInbound(payload());

      expect(whatsapp.sendTextMessage).toHaveBeenCalledWith('+60123456789', 'Your previous enquiry is still being processed.', undefined);
      expect(conversations.recordAutoReply).toHaveBeenCalledWith(
        expect.objectContaining({ subKind: 'still_being_processed' }),
      );
      expect(prisma.botDraft.create).not.toHaveBeenCalled();
      expect(conversations.recordEscalation).not.toHaveBeenCalled();
      expect(conversations.recordEscalationOffer).not.toHaveBeenCalled();
      expect(conversations.clearOfferState).not.toHaveBeenCalled();
    });
  });

  describe('safety_escalate (ESCALATE)', () => {
    it('sends nothing to the customer; persists a PENDING operator draft from the inbound body', async () => {
      const { service, whatsapp, conversations, decisionEngine, inboxBridge } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(
        decision({
          kind: 'ESCALATE',
          subKind: 'safety_escalate',
          reason: 'complaint',
          draftBody: undefined,
          citedChunkIds: [],
          citedRanks: [],
          topChunks: [],
        }),
      );

      await service.handleInbound(payload());

      expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
      expect(conversations.recordAutoReply).not.toHaveBeenCalled();
      expect(conversations.recordEscalation).toHaveBeenCalledWith(
        expect.objectContaining({
          conversationId: 'conv-1',
          inboundMessageId: 'inb-1',
          draftData: expect.objectContaining({ body: 'What time do you open?' }),
        }),
      );
      expect(inboxBridge.recordEscalation).toHaveBeenCalled();
    });
  });

  describe('IGNORE', () => {
    it('only persists the decision — no outbound, no state change, no BotDraft', async () => {
      const { service, whatsapp, conversations, prisma, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(
        decision({ kind: 'IGNORE', subKind: 'ignore_disabled', reason: 'chatbot_disabled', draftBody: undefined }),
      );

      await service.handleInbound(payload());

      expect(prisma.chatbotDecision.create).toHaveBeenCalled();
      expect(whatsapp.sendTextMessage).not.toHaveBeenCalled();
      expect(conversations.recordAutoReply).not.toHaveBeenCalled();
      expect(conversations.recordEscalation).not.toHaveBeenCalled();
      expect(prisma.botDraft.create).not.toHaveBeenCalled();
    });
  });

  describe('send-failure handling', () => {
    it('rag_answer: a failed send is logged and falls back to an operator escalation', async () => {
      const { service, whatsapp, conversations, logger, inboxBridge } = buildService();
      whatsapp.sendTextMessage.mockRejectedValueOnce(new Error('meta down'));

      await service.handleInbound(payload());

      expect(logger.error).toHaveBeenCalled();
      expect(conversations.recordEscalation).toHaveBeenCalledWith(
        expect.objectContaining({ conversationId: 'conv-1', inboundMessageId: 'inb-1' }),
      );
      expect(inboxBridge.recordEscalation).toHaveBeenCalledWith(
        expect.objectContaining({ reason: 'dispatch_failure' }),
      );
    });

    it('canned reply (consent_offer): a failed send is logged but does NOT create an operator escalation', async () => {
      const { service, whatsapp, conversations, logger, decisionEngine } = buildService();
      decisionEngine.decide.mockResolvedValueOnce(
        decision({
          subKind: 'consent_offer',
          reason: 'escalation_offer_sent:no_kb',
          draftBody: 'Would you like customer support? Reply YES or NO.',
          citedChunkIds: [],
          citedRanks: [],
          topChunks: [],
          sideEffects: { setOfferState: { inboundMessageId: '__current__' } },
        }),
      );
      whatsapp.sendTextMessage.mockRejectedValueOnce(new Error('meta down'));

      await service.handleInbound(payload());

      expect(logger.error).toHaveBeenCalled();
      expect(conversations.recordEscalation).not.toHaveBeenCalled();
    });
  });
});
