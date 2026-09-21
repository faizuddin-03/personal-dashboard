import { Module } from '@nestjs/common';
import { ConversationsModule } from '../conversations/conversations.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { ChatbotSettingsModule } from '../settings/chatbot-settings.module';
import { ChatbotWhatsappModule } from '../whatsapp/chatbot-whatsapp.module';

import { CapturesController } from './captures.controller';
import { ConversationsController } from './conversations.controller';
import { DecisionsController } from './decisions.controller';
import { DraftsController } from './drafts.controller';
import { KnowledgeController } from './knowledge.controller';
import { SettingsController } from './settings.controller';

import { CaptureAdminService } from './capture-admin.service';
import { DecisionQueryService } from './decision-query.service';
import { DraftsService } from './drafts.service';
import { InboxService } from './inbox.service';
import { KnowledgeStatsService } from './knowledge-stats.service';

/**
 * Presentation layer for the chatbot: the REST controllers plus the thin query/orchestration
 * services that back the operator inbox and the admin console. All domain logic lives in the
 * feature modules imported here (conversations, knowledge, whatsapp, settings) — this module only
 * exposes it over HTTP, guarded and documented for Swagger. PrismaModule and ConfigModule are
 * global, so they need no explicit import.
 */
@Module({
  imports: [ConversationsModule, KnowledgeModule, ChatbotWhatsappModule, ChatbotSettingsModule],
  controllers: [
    ConversationsController,
    DraftsController,
    DecisionsController,
    KnowledgeController,
    CapturesController,
    SettingsController,
  ],
  providers: [InboxService, DraftsService, DecisionQueryService, KnowledgeStatsService, CaptureAdminService],
})
export class ChatbotApiModule {}
