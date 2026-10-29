import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from '../../prisma/prisma.module';
import { KnowledgeModule } from '../knowledge/knowledge.module';
import { CHATBOT_RESOLUTION_CAPTURE_QUEUE } from './capture.queue';
import { CaptureProcessor } from './capture.processor';

/**
 * Worker-only module: registers the resolution-capture queue + its @Processor. Imported ONLY by
 * WorkerAppModule, so the processor runs solely in the worker process — never in the API process
 * (which would spin up a second consumer competing on the same queue).
 *
 * No BullModule.forRootAsync here: BlastWorkerModule already registers the Bull root, and
 * @nestjs/bullmq registers that root with `global: true` (see bull.module.js forRootAsync), so it
 * serves every queue in the process. This mirrors the API side, where BlastsModule's root serves
 * ConversationsModule's registerQueue. A second forRootAsync would register a conflicting default.
 */
@Module({
  imports: [
    PrismaModule,
    KnowledgeModule, // provides ResolutionCaptureService (+ its embedding/RAG collaborators)
    BullModule.registerQueue({ name: CHATBOT_RESOLUTION_CAPTURE_QUEUE }),
  ],
  providers: [CaptureProcessor],
})
export class CaptureWorkerModule {}
