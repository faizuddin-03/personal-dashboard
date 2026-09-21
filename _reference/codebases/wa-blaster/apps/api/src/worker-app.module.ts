import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LlmModule } from './llm/llm.module';
import { BlastWorkerModule } from './blasts/blast-worker.module';
import { CaptureWorkerModule } from './chatbot/capture/capture-worker.module';
import { ChatbotInboundWorkerModule } from './chatbot/inbound/chatbot-inbound-worker.module';

/**
 * The worker process's root module — runs BullMQ processors only (no HTTP layer).
 *
 * LlmModule (root, @Global) is imported because BlastWorkerModule pulls in WhatsappModule, whose
 * TemplatesModule needs the global LlmService; the API gets this via AppModule, so the worker needs
 * it too. CaptureWorkerModule adds the resolution-capture @Processor alongside the blast processor.
 * ChatbotInboundWorkerModule adds the chatbot-inbound @Processor — the fast-ack webhook enqueues
 * inbound messages and this worker runs the classify→RAG→draft→send pipeline off the HTTP request.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LlmModule,
    BlastWorkerModule,
    CaptureWorkerModule,
    ChatbotInboundWorkerModule,
  ],
})
export class WorkerAppModule {}
