/**
 * Job contract for the resolution-capture queue.
 *
 * The queue is REGISTERED and PRODUCED to on the API side by ConversationsModule /
 * ConversationService.close() (committed in Sessions 10–11). This file does NOT define a producer —
 * it only re-exports the canonical queue name and declares the job payload shape, so the worker-side
 * processor shares a single source of truth with the producer.
 *
 * Payload note: close() enqueues only the two ids; the full disposition (closedByUserId, disposition,
 * editedAnswer, forcedDespiteDuplicate) is persisted on the ResolutionCapture row, which the worker
 * loads to reconstruct ResolutionCaptureService.capture()'s input.
 */
export { CHATBOT_RESOLUTION_CAPTURE_QUEUE } from '../conversations/conversation.service';

export interface CaptureJobPayload {
  /** ResolutionCapture row id (status='pending' at enqueue time). */
  captureId: string;
  conversationId: string;
}
