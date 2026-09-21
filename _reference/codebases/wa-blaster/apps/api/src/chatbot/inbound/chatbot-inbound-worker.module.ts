import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ChatbotModule } from '../chatbot.module';
import { CHATBOT_INBOUND_QUEUE } from './chatbot-inbound.queue';
import { ChatbotInboundProcessor } from './chatbot-inbound.processor';

/**
 * Worker-only module: registers the chatbot-inbound queue + its @Processor. Imported ONLY by
 * WorkerAppModule, so the processor runs solely in the worker process — never in the API (which
 * would spin up a second consumer competing on the same queue). Mirrors CaptureWorkerModule.
 *
 * ChatbotModule supplies ChatbotService and its whole graph (decision engine, RAG/knowledge,
 * conversations, settings, the chatbot's own WhatsApp client). The worker already has the @Global
 * Prisma/Llm/Config and the Bull root (from CaptureWorkerModule / BlastWorkerModule), so no
 * forRootAsync here. ChatbotModule → ConversationsModule re-registers the resolution-capture queue
 * that CaptureWorkerModule also registers; that's the standard producer+consumer pattern and is
 * harmless (the underlying Redis queue is shared by name).
 */
@Module({
  imports: [
    ChatbotModule,
    BullModule.registerQueue({ name: CHATBOT_INBOUND_QUEUE }),
  ],
  providers: [ChatbotInboundProcessor],
})
export class ChatbotInboundWorkerModule {}
