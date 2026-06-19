import { ChatbotInboundProcessor } from '../chatbot-inbound.processor';
import type { ChatbotInboundJobPayload } from '../chatbot-inbound.queue';

/**
 * Unit test for the chatbot-inbound processor (mirrors capture.processor.spec.ts: mocked deps +
 * direct `new`, no Nest/DB/Redis).
 *
 * The processor's whole job is to forward the enqueued `{ contacts, message }` payload to
 * ChatbotService.handleInbound. It must NOT swallow errors — letting them propagate is what gives
 * BullMQ its retry/fail semantics (and a retry is send-safe because handleInbound re-hits the
 * ConversationInboundMessage.metaMessageId unique constraint before sending again).
 */
describe('ChatbotInboundProcessor', () => {
  let chatbot: { handleInbound: jest.Mock };
  let processor: ChatbotInboundProcessor;

  const payload: ChatbotInboundJobPayload = {
    contacts: [{ wa_id: '60198765432', profile: { name: 'Tan' } }],
    message: {
      from: '60198765432',
      id: 'wamid.cb1',
      timestamp: '1234567890',
      type: 'text',
      text: { body: 'hello' },
    },
  };

  const job = (data: ChatbotInboundJobPayload) => ({ data, attemptsMade: 0 }) as any;

  beforeEach(() => {
    chatbot = { handleInbound: jest.fn() };
    processor = new ChatbotInboundProcessor(chatbot as any);
  });

  it('forwards the job payload to ChatbotService.handleInbound', async () => {
    chatbot.handleInbound.mockResolvedValue(undefined);

    await expect(processor.process(job(payload))).resolves.toBeUndefined();

    expect(chatbot.handleInbound).toHaveBeenCalledWith(payload);
  });

  it('propagates errors from handleInbound (does NOT swallow), so BullMQ can retry/fail the job', async () => {
    chatbot.handleInbound.mockRejectedValueOnce(new Error('boom'));

    await expect(processor.process(job(payload))).rejects.toThrow(/boom/);
  });
});
