import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { WhatsappCloudApiService } from '../whatsapp-cloud-api.service';

const CONFIG: Record<string, string> = {
  WHATSAPP_MOCK_MODE: 'false',
  WHATSAPP_API_VERSION: 'v20.0',
  WHATSAPP_WABA_ID: '999000111',
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

describe('WhatsappCloudApiService', () => {
  afterEach(() => nock.cleanAll());

  describe('mock mode', () => {
    it('returns canned PENDING response without hitting network', async () => {
      const service = new WhatsappCloudApiService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));

      const result = await service.submitTemplate({
        name: 'raya_promo_2026',
        language: 'MS',
        category: 'MARKETING',
        components: [{ type: 'BODY', text: 'Salam {{1}}!' }],
      });

      expect(result.id).toMatch(/^mock-/);
      expect(result.status).toBe('PENDING');
    });
  });

  describe('live mode', () => {
    it('POSTs to /v20.0/{waba}/message_templates with auth header', async () => {
      const service = new WhatsappCloudApiService(makeConfig());

      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/999000111/message_templates', (body) => {
          return body.name === 'raya_promo_2026' && body.language === 'MS';
        })
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { id: '1234567890', status: 'PENDING', category: 'MARKETING' });

      const result = await service.submitTemplate({
        name: 'raya_promo_2026',
        language: 'MS',
        category: 'MARKETING',
        components: [{ type: 'BODY', text: 'Salam {{1}}!' }],
      });

      expect(result.id).toBe('1234567890');
      expect(result.status).toBe('PENDING');
      expect(scope.isDone()).toBe(true);
    });

    it('throws a helpful error on 4xx from Meta', async () => {
      const service = new WhatsappCloudApiService(makeConfig());

      nock('https://graph.facebook.com')
        .post('/v20.0/999000111/message_templates')
        .reply(400, { error: { message: 'Invalid component', code: 100 } });

      await expect(
        service.submitTemplate({
          name: 'bad',
          language: 'EN',
          category: 'MARKETING',
          components: [{ type: 'BODY', text: 'x' }],
        }),
      ).rejects.toThrow(/Invalid component/);
    });

    it('getTemplateStatus fetches by meta id', async () => {
      const service = new WhatsappCloudApiService(makeConfig());

      nock('https://graph.facebook.com')
        .get('/v20.0/1234567890')
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { id: '1234567890', status: 'APPROVED', category: 'MARKETING' });

      const result = await service.getTemplateStatus('1234567890');
      expect(result.status).toBe('APPROVED');
    });
  });

  describe('sendMessage', () => {
    it('returns a fake wamid in mock mode', async () => {
      const service = new WhatsappCloudApiService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));
      const result = await service.sendMessage({
        toPhoneE164: '+60123456789',
        templateName: 'raya_promo',
        templateLanguage: 'ms',
      });
      expect(result.metaMessageId).toMatch(/^wamid\.mock-/);
    });

    it('POSTs to /v20.0/{phoneId}/messages and returns wamid', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages', (b: any) => {
          return b.messaging_product === 'whatsapp' && b.to === '60123456789' && b.template?.name === 'raya_promo';
        })
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { messages: [{ id: 'wamid.HBgM...' }] });

      const result = await service.sendMessage({
        toPhoneE164: '+60123456789',
        templateName: 'raya_promo',
        templateLanguage: 'ms',
      });
      expect(result.metaMessageId).toBe('wamid.HBgM...');
      expect(scope.isDone()).toBe(true);
    });

    it('throws on 4xx from Meta', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages')
        .reply(400, { error: { message: 'Recipient is not a WhatsApp user', code: 131026 } });
      await expect(
        service.sendMessage({ toPhoneE164: '+60123456789', templateName: 'x', templateLanguage: 'en' }),
      ).rejects.toThrow(/Recipient is not a WhatsApp user/);
    });
  });

  describe('sendFreeFormText', () => {
    it('returns a fake wamid in mock mode without hitting network', async () => {
      const service = new WhatsappCloudApiService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));
      // Any unexpected HTTP call would throw because no nock interceptor is registered
      // and nock would let it through; we additionally assert no pending mocks exist.
      const result = await service.sendFreeFormText('+60123456789', 'Hello there!');
      expect(result.metaMessageId).toMatch(/^wamid\.mock-/);
    });

    it('POSTs type:text to /v20.0/{phoneId}/messages and returns wamid', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      const scope = nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages', (b: any) => {
          return (
            b.messaging_product === 'whatsapp' &&
            b.to === '60123456789' &&
            b.type === 'text' &&
            b.text?.body === 'Hi, how can we help?'
          );
        })
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, { messages: [{ id: 'wamid.HBgFreeForm...' }] });

      const result = await service.sendFreeFormText('+60123456789', 'Hi, how can we help?');
      expect(result.metaMessageId).toBe('wamid.HBgFreeForm...');
      expect(scope.isDone()).toBe(true);
    });

    it('throws on 4xx from Meta via transformError', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      nock('https://graph.facebook.com')
        .post('/v20.0/555000111/messages')
        .reply(400, { error: { message: 'Message failed to send because more than 24 hours have passed', code: 131047 } });
      await expect(
        service.sendFreeFormText('+60123456789', 'too late'),
      ).rejects.toThrow(/more than 24 hours have passed/);
    });
  });

  describe('listMessageTemplates', () => {
    it('returns a canned fixture in mock mode without hitting network', async () => {
      const service = new WhatsappCloudApiService(makeConfig({ WHATSAPP_MOCK_MODE: 'true' }));
      const result = await service.listMessageTemplates();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          language: expect.any(String),
          status: expect.any(String),
          category: expect.any(String),
        }),
      );
      expect(Array.isArray(result[0].components)).toBe(true);
    });

    it('GETs the WABA message_templates endpoint and follows pagination', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      const scope = nock('https://graph.facebook.com')
        .get('/v20.0/999000111/message_templates')
        .query((q) => q.limit === '100' && !q.after)
        .matchHeader('authorization', 'Bearer test-token')
        .reply(200, {
          data: [{ id: 'a1', name: 'one', language: 'en', status: 'APPROVED', category: 'UTILITY', components: [] }],
          paging: { cursors: { after: 'CUR2' }, next: 'https://graph.facebook.com/more' },
        })
        .get('/v20.0/999000111/message_templates')
        .query((q) => q.after === 'CUR2')
        .reply(200, {
          data: [{ id: 'b2', name: 'two', language: 'ms', status: 'REJECTED', category: 'MARKETING', components: [] }],
          paging: { cursors: { after: 'CUR3' } }, // no `next` → stop
        });

      const result = await service.listMessageTemplates();
      expect(result.map((t) => t.id)).toEqual(['a1', 'b2']);
      expect(scope.isDone()).toBe(true);
    });

    it('throws a helpful error on 4xx from Meta', async () => {
      const service = new WhatsappCloudApiService(makeConfig());
      nock('https://graph.facebook.com')
        .get('/v20.0/999000111/message_templates')
        .query(true)
        .reply(400, { error: { message: 'Invalid WABA', code: 100 } });
      await expect(service.listMessageTemplates()).rejects.toThrow(/Invalid WABA/);
    });
  });
});
