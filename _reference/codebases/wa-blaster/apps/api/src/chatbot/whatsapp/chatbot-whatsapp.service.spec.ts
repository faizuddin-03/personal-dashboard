import { ConfigService } from '@nestjs/config';
import { ChatbotWhatsappService } from './chatbot-whatsapp.service';

function makeConfig(over: Record<string, string> = {}): ConfigService {
  const vals: Record<string, string> = {
    WHATSAPP_MOCK_MODE: 'false',
    WHATSAPP_API_VERSION: 'v20.0',
    WHATSAPP_PHONE_NUMBER_ID: 'PNID',
    WHATSAPP_ACCESS_TOKEN: 'TOKEN',
    ...over,
  };
  return {
    get: (k: string, d?: unknown) => (k in vals ? vals[k] : d),
    getOrThrow: (k: string) => {
      if (!(k in vals)) throw new Error(`missing ${k}`);
      return vals[k];
    },
  } as unknown as ConfigService;
}

function build(over: Record<string, string> = {}) {
  const svc = new ChatbotWhatsappService(makeConfig(over));
  const post = jest.fn().mockResolvedValue({ data: { messages: [{ id: 'wamid.out' }] } });
  (svc as unknown as { http: { post: jest.Mock } }).http = { post };
  return { svc, post };
}

describe('ChatbotWhatsappService.sendTextMessage — reply quoting', () => {
  it('adds context.message_id when replyToWamid is provided (native reply-quote)', async () => {
    const { svc, post } = build();

    await svc.sendTextMessage('+60123456789', 'hello', 'wamid.original');

    const payload = post.mock.calls[0][1];
    expect(payload.context).toEqual({ message_id: 'wamid.original' });
    expect(payload.text.body).toBe('hello');
  });

  it('omits context for a plain send (no replyToWamid)', async () => {
    const { svc, post } = build();

    await svc.sendTextMessage('+60123456789', 'hello');

    const payload = post.mock.calls[0][1];
    expect(payload.context).toBeUndefined();
  });

  it('mock mode returns a mock id and never calls HTTP, even with a quote target', async () => {
    const { svc, post } = build({ WHATSAPP_MOCK_MODE: 'true' });

    const r = await svc.sendTextMessage('+60123456789', 'hi', 'wamid.x');

    expect(r.metaMessageId).toContain('wamid.mock-chatbot-');
    expect(post).not.toHaveBeenCalled();
  });
});
