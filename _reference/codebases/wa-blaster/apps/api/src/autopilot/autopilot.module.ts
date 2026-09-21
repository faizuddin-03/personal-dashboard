import { Module, forwardRef } from '@nestjs/common';
import { AutopilotService } from './autopilot.service';
import { AutopilotController } from './autopilot.controller';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { TicketsModule } from '../tickets/tickets.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    AuthModule,
    KnowledgeModule, // exports KnowledgeService
    forwardRef(() => WhatsappModule), // WhatsappCloudApiService (mutual dep with the webhook controller)
    TicketsModule,
    // LlmModule, SystemSettingsModule, PrismaModule are @Global
  ],
  controllers: [AutopilotController],
  providers: [AutopilotService],
  exports: [AutopilotService],
})
export class AutopilotModule {}
