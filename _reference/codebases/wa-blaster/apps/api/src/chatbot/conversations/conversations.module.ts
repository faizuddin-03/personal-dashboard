import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConversationService, CHATBOT_RESOLUTION_CAPTURE_QUEUE } from './conversation.service';

/**
 * The Bull *root* connection (BullModule.forRootAsync) is supplied by the app/chatbot module that
 * imports this one (Session 11 wiring). Here we only register the resolution-capture queue and the
 * ConversationService that enqueues onto it.
 */
@Module({
  imports: [BullModule.registerQueue({ name: CHATBOT_RESOLUTION_CAPTURE_QUEUE })],
  providers: [ConversationService],
  exports: [ConversationService],
})
export class ConversationsModule {}
