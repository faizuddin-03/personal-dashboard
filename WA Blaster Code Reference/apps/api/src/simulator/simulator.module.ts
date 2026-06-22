import { Module } from '@nestjs/common';
import { ChatbotModule } from '../chatbot/chatbot.module';
import { ChatbotSettingsModule } from '../chatbot/settings/chatbot-settings.module';
import { SimulatorController } from './simulator.controller';
import { SimulatorService } from './simulator.service';
import { SimulatorGuard } from './simulator.guard';

/**
 * Dev-only QA simulator. Always registered, but every route is gated at request time by
 * SimulatorGuard (SIMULATOR_ENABLED + WHATSAPP_MOCK_MODE), so it is inert in production.
 * Imports ChatbotModule (exports ChatbotService) and ChatbotSettingsModule (ChatbotSettingsService);
 * PrismaService is @Global and ConfigService comes from the global ConfigModule.
 */
@Module({
  imports: [ChatbotModule, ChatbotSettingsModule],
  controllers: [SimulatorController],
  providers: [SimulatorService, SimulatorGuard],
})
export class SimulatorModule {}
