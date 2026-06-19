import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthController } from './health/health.controller';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { SegmentsModule } from './segments/segments.module';
import { TemplatesModule } from './templates/templates.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { BlastsModule } from './blasts/blasts.module';
import { SystemSettingsModule } from './system-settings/system-settings.module';
import { InboxModule } from './inbox/inbox.module';
import { StateLanguageMappingModule } from './state-language-mapping/state-language-mapping.module';
import { LlmModule } from './llm/llm.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { AutopilotModule } from './autopilot/autopilot.module';
import { TicketsModule } from './tickets/tickets.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { CannedRepliesModule } from './canned-replies/canned-replies.module';
import { KnowledgeModule as ChatbotKnowledgeModule } from './chatbot/knowledge/knowledge.module';
import { ChatbotModule } from './chatbot/chatbot.module';
import { ChatbotApiModule } from './chatbot/api/chatbot-api.module';
import { AssistantModule } from './assistant/assistant.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContactsModule,
    SegmentsModule,
    TemplatesModule,
    WhatsappModule,
    SystemSettingsModule,
    BlastsModule,
    InboxModule,
    StateLanguageMappingModule,
    LlmModule,
    KnowledgeModule,
    AutopilotModule,
    TicketsModule,
    AnalyticsModule,
    CannedRepliesModule,
    ChatbotKnowledgeModule,
    ChatbotModule,
    ChatbotApiModule,
    AssistantModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
