import type { ChatbotInboundPayload } from '../chatbot.service';

/**
 * Job contract for the chatbot-inbound queue.
 *
 * The webhook (WhatsappModule / WebhookController) REGISTERS and PRODUCES to this queue: on every
 * inbound `messages` event (when CHATBOT_ENABLED), it fast-acks Meta and enqueues `{ contacts,
 * message }` with `jobId = message.id` so the slow classify→RAG→draft→send pipeline runs off the
 * HTTP request. The processor (ChatbotInboundProcessor, worker-only) consumes it.
 *
 * The payload is exactly the argument ChatbotService.handleInbound already takes, so the processor
 * forwards `job.data` verbatim — no reconstruction needed (unlike the capture queue, which carries
 * ids and reloads a row).
 */
export const CHATBOT_INBOUND_QUEUE = 'chatbot-inbound';

export type ChatbotInboundJobPayload = ChatbotInboundPayload;
