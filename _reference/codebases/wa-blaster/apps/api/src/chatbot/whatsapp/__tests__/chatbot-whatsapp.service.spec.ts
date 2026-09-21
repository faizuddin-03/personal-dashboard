import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { ChatbotWhatsappService } from '../chatbot-whatsapp.service';
import { ChatbotWhatsappError } from '../chatbot-whatsapp.error';

const CONFIG: Record<string, string> = {
  WHATSAPP_MOCK_MODE: 'false',
  WHATSAPP_API_VERSION: 'v20.0',
  WHATSAPP_PHONE_NUMBER_ID: '555000111',
  WHATSAPP_ACCESS_TOKEN: 'test-token',
};

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const merged = { ...CONFIG, ...overrides };
  return {
    get: (key: string, fallback?: string) => merged[key] ?? fallback,
    getOrThrow: (key: string) => {
      const v = merged[key];
      if (!v) throw new Error(`missing: ${key}`);
      return v;
    },
  } as unknown as ConfigService;
}

describe('ChatbotWhatsappService', () => {
  afterEach(() => nock.cleanAll());

  describe('sendTextMessage', () => {
    it('returns a chatbot mock wamid in mock mode without hitting network', async () => {
      const service = new ChatbotWhatsappService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));
      const result = await service.sendTextMessage('+60123456789', 'Hello from the bot!');
      expect(result.metaMessageId).toMatch(/^wamid\.mock-chatbot-/);
    });

    it('POSTs type:text with preview_url:false to /v20.0/{phoneId}/messages and returns wamid', async () => {
      const service = new ChatbotWhatsappService(makeConfig());
      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages', (b: any) => {
          return (
            b.messaging_product === 'whatsapp' &&
            b.to === '60123456789' &&
            b.type === 'text' &&
            b.text?.body === 'Hi, how can we help?' &&
            b.text?.preview_url === false
          );
        })
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { messages: [{ id: 'wamid.HBgChatbot...' }] });

      const result = await service.sendTextMessage('+60123456789', 'Hi, how can we help?');
      expect(result.metaMessageId).toBe('wamid.HBgChatbot...');
      expect(scope.isDone()).toBe(true);
    });

    it('throws ChatbotWhatsappError on 4xx from Meta', async () => {
      const service = new ChatbotWhatsappService(makeConfig());
      nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages')
        .reply(400, { error: { message: 'Recipient is not a WhatsApp user', code: 131026 } });

      await expect(service.sendTextMessage('+60123456789', 'hello')).rejects.toThrow(
        ChatbotWhatsappError,
      );
    });

    it('strips a leading + from the recipient', async () => {
      const service = new ChatbotWhatsappService(makeConfig());
      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages', (b: any) => b.to === '60123456789')
        .reply(200, { messages: [{ id: 'wamid.X' }] });

      await service.sendTextMessage('+60123456789', 'hello');
      expect(scope.isDone()).toBe(true);
    });

    it('throws before any HTTP call when body is empty', async () => {
      const service = new ChatbotWhatsappService(makeConfig());
      // No nock interceptor registered: a real HTTP attempt would reject with a
      // connection error rather than ChatbotWhatsappError, so this asserts the guard
      // fires first.
      await expect(service.sendTextMessage('+60123456789', '   ')).rejects.toThrow(
        ChatbotWhatsappError,
      );
    });
  });

  describe('markAsRead', () => {
    it('returns void in mock mode without hitting network', async () => {
      const service = new ChatbotWhatsappService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));
      await expect(service.markAsRead('wamid.incoming123')).resolves.toBeUndefined();
    });

    it('POSTs status:read with the message id', async () => {
      const service = new ChatbotWhatsappService(makeConfig());
      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages', (b: any) => {
          return (
            b.messaging_product === 'whatsapp' &&
            b.status === 'read' &&
            b.message_id === 'wamid.incoming123'
          );
        })
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { success: true });

      await expect(service.markAsRead('wamid.incoming123')).resolves.toBeUndefined();
      expect(scope.isDone()).toBe(true);
    });

    it('swallows Meta errors and returns void', async () => {
      const service = new ChatbotWhatsappService(makeConfig());
      nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages')
        .reply(400, { error: { message: 'Invalid message id', code: 100 } });

      await expect(service.markAsRead('wamid.bad')).resolves.toBeUndefined();
    });
  });
});
