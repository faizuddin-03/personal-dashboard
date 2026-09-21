import { Module } from '@nestjs/common';
import { ChatbotWhatsappService } from './chatbot-whatsapp.service';

/**
 * Provides the chatbot's isolated Meta Cloud API client. ConfigModule is global,
 * so the service reads its WhatsApp settings (WHATSAPP_MOCK_MODE,
 * WHATSAPP_API_VERSION, WHATSAPP_PHONE_NUMBER_ID, WHATSAPP_ACCESS_TOKEN) straight
 * from ConfigService — no extra imports needed here.
 */
@Module({
  providers: [ChatbotWhatsappService],
  exports: [ChatbotWhatsappService],
})
export class ChatbotWhatsappModule {}
