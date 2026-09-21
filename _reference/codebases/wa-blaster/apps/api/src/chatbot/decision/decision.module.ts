import { Module } from '@nestjs/common';
import { ClassifierModule } from '../classifier/classifier.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { DrafterModule } from '../drafter/drafter.module';
import { GuardrailsModule } from '../guardrails/guardrails.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { ChatbotSettingsModule } from '../settings/chatbot-settings.module';
import { DecisionEngine } from './decision-engine.service';

/**
 * Wires the {@link DecisionEngine} to its collaborators: the classifier + yes/no detector
 * (ClassifierModule), KB retrieval (KnowledgeModule), the drafter + canned replies (DrafterModule),
 * the guardrails + opt-out/complaint detectors (GuardrailsModule), the conversation state machine
 * (ConversationsModule) and chatbot settings (ChatbotSettingsModule).
 */
@Module({
  imports: [ClassifierModule, KnowledgeModule, DrafterModule, GuardrailsModule, ConversationsModule, ChatbotSettingsModule],
  providers: [DecisionEngine],
  exports: [DecisionEngine],
})
export class DecisionModule {}
