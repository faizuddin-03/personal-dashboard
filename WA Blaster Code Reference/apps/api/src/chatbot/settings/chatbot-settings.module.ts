import { Module } from '@nestjs/common';
import { ChatbotSettingsService } from './chatbot-settings.service';

@Module({
  providers: [ChatbotSettingsService],
  exports: [ChatbotSettingsService],
})
export class ChatbotSettingsModule {}
