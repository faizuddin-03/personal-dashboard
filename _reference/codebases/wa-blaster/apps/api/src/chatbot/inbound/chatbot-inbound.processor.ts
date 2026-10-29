import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { ChatbotService } from '../chatbot.service';
import { CHATBOT_INBOUND_QUEUE, ChatbotInboundJobPayload } from './chatbot-inbound.queue';

/**
 * Runs ONLY in the worker process (WorkerAppModule → ChatbotInboundWorkerModule). Consumes the
 * chatbot-inbound queue the webhook produces to after fast-acking Meta, so the classify→RAG→draft→
 * send pipeline never blocks the HTTP response.
 *
 * The payload IS ChatbotService.handleInbound's argument, so we forward `job.data` verbatim. We do
 * NOT catch errors: letting them propagate gives BullMQ its retry/fail semantics (the producer sets
 * `attempts`). A retry is send-safe because handleInbound persists the inbound via
 * ConversationInboundMessage.metaMessageId (@unique) before sending — a duplicate run throws on that
 * `create` and aborts before re-sending. handleInbound already handles its OWN expected failures
 * (send failure → operator escalation; LLM/embeddings outage → an `ignore_*` decision), so only
 * genuine infra errors reach here — exactly when a retry helps.
 */
@Processor(CHATBOT_INBOUND_QUEUE)
@Injectable()
export class ChatbotInboundProcessor extends WorkerHost {
  private readonly logger = new Logger(ChatbotInboundProcessor.name);

  constructor(private readonly chatbot: ChatbotService) {
    super();
  }

  async process(job: Job<ChatbotInboundJobPayload>): Promise<void> {
    const wamid = job.data.message?.id;
    this.logger.log(`Processing inbound wamid=${wamid} attempt=${job.attemptsMade + 1}`);
    await this.chatbot.handleInbound(job.data);
  }
}
