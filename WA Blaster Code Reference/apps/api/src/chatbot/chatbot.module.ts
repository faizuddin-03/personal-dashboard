import { Logger, Module } from '@nestjs/common';
import { ConversationsModule } from './conversations/conversations.module';
import { DecisionModule } from './decision/decision.module';
import { ChatbotWhatsappModule } from './whatsapp/chatbot-whatsapp.module';
import { ChatbotSettingsModule } from './settings/chatbot-settings.module';
import { CampaignModule } from './campaign/campaign.module';
import { ChatbotService } from './chatbot.service';

/** A Logger bound to the ChatbotService context so every orchestrator line is tagged [ChatbotService]. */
const chatbotLogger = { provide: Logger, useValue: new Logger(ChatbotService.name) };

/**
 * The chatbot's top-level module: the inbound orchestrator plus the collaborators it sequences.
 *
 * - DecisionModule       → the DecisionEngine (and, transitively, the whole RAG/guardrail graph)
 * - ConversationsModule  → ConversationService + the resolution-capture queue registration. The
 *                          Bull *root* is the app-global one BlastsModule supplies; the capture
 *                          processor is NOT here — it runs in the worker (Session 12).
 * - ChatbotWhatsappModule→ the chatbot's OWN Meta client (never the blasting one)
 * - ChatbotSettingsModule→ business_name and friends
 *
 * PrismaModule is @Global, so PrismaService needs no explicit import. ChatbotService is exported so
 * the WhatsApp WebhookController can bridge inbound messages into it (whatsapp.module wiring).
 */
@Module({
  imports: [ConversationsModule, DecisionModule, ChatbotWhatsappModule, ChatbotSettingsModule, CampaignModule],
  providers: [ChatbotService, chatbotLogger],
  exports: [ChatbotService],
})
export class ChatbotModule {}
