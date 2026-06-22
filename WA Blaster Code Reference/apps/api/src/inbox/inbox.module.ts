import { Module } from '@nestjs/common';
import { InboxService } from './inbox.service';
import { InboxController } from './inbox.controller';
import { AuthModule } from '../auth/auth.module';
import { ConversationsModule } from '../chatbot/conversations/conversations.module';
import { ChatbotWhatsappModule } from '../chatbot/whatsapp/chatbot-whatsapp.module';
import { ChatbotModule } from '../chatbot/chatbot.module';

@Module({
  imports: [ConversationsModule, ChatbotWhatsappModule, ChatbotModule, AuthModule],
  controllers: [InboxController],
  providers: [InboxService],
  exports: [InboxService],
})
export class InboxModule {}
