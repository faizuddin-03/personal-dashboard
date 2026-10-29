import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CaptureInput, ResolutionCaptureService } from '../knowledge/resolution-capture.service';
import { CHATBOT_RESOLUTION_CAPTURE_QUEUE, CaptureJobPayload } from './capture.queue';

/**
 * Runs ONLY in the worker process (WorkerAppModule → CaptureWorkerModule). Consumes the
 * resolution-capture queue that ConversationService.close() produces to on the API side.
 *
 * The job carries just `{ captureId, conversationId }`; the disposition was persisted on the
 * ResolutionCapture row at close time, so we load the row and reconstruct the CaptureInput.
 *
 * ResolutionCaptureService.capture() never throws on a capture failure — it records the error on the
 * row (status='failed', failureReason) and returns it. We re-throw on that so BullMQ retries per the
 * producer's `attempts`; once attempts are exhausted the row remains 'failed' for investigation. A
 * missing row (findUniqueOrThrow) propagates the same way.
 */
@Processor(CHATBOT_RESOLUTION_CAPTURE_QUEUE)
@Injectable()
export class CaptureProcessor extends WorkerHost {
  private readonly logger = new Logger(CaptureProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly captureService: ResolutionCaptureService,
  ) {
    super();
  }

  async process(job: Job<CaptureJobPayload>): Promise<void> {
    const { captureId, conversationId } = job.data;
    this.logger.log(`Processing capture ${captureId} conv=${conversationId} attempt=${job.attemptsMade + 1}`);

    const row = await this.prisma.resolutionCapture.findUniqueOrThrow({ where: { id: captureId } });

    const result = await this.captureService.capture({
      conversationId,
      closedByUserId: row.closedByUserId,
      disposition: row.disposition as CaptureInput['disposition'],
      editedAnswer: row.editedAnswer ?? undefined,
      forcedDespiteDuplicate: row.forcedDespiteDuplicate,
    });

    this.logger.log(`Capture ${captureId} → status=${result.status} documentId=${result.documentId ?? '(none)'}`);

    if (result.status === 'failed') {
      throw new Error(`Capture ${captureId} failed: ${result.failureReason ?? 'unknown'}`);
    }
  }
}
