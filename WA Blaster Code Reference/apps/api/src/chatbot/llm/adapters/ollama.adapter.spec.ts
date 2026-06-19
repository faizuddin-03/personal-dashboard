import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { OllamaAdapter } from './ollama.adapter';

const CONFIG: Record<string, string> = {
  LLM_OLLAMA_URL: 'http://localhost:11434/v1',
  LLM_OLLAMA_CHAT_MODEL: 'qwen3.5:4b',
  LLM_OLLAMA_TIMEOUT_MS: '20000',
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

const OLLAMA_HOST = 'http://localhost:11434';
const CHAT_PATH = '/v1/chat/completions';

function chatResponse(content: string, model = 'qwen3.5:4b', finishReason = 'stop') {
  return {
    model,
    choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: finishReason }],
  };
}

describe('OllamaAdapter', () => {
  afterEach(() => nock.cleanAll());

  it('name() identifies the adapter', () => {
    expect(new OllamaAdapter(makeConfig()).name()).toBe('ollama');
  });

  it('POSTs model+messages+max_tokens+temperature and parses choices[0]/model/latency', async () => {
    const adapter = new OllamaAdapter(makeConfig());
    let captured: any = {};
    const scope = nock(OLLAMA_HOST)
      .post(CHAT_PATH, (body: any) => {
        captured = body;
        return true;
      })
      .reply(200, chatResponse('Refund dalam 7 hari.', 'qwen3.5:4b', 'stop'));

    const result = await adapter.complete(
      [{ role: 'user', content: 'Bila boleh refund?' }],
      { maxTokens: 256, temperature: 0.1 },
    );

    expect(captured.model).toBe('qwen3.5:4b');
    expect(captured.messages).toEqual([{ role: 'user', content: 'Bila boleh refund?' }]);
    expect(captured.max_tokens).toBe(256);
    expect(captured.temperature).toBe(0.1);

    expect(result.text).toBe('Refund dalam 7 hari.');
    expect(result.modelUsed).toBe('qwen3.5:4b');
    expect(result.finishReason).toBe('stop');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(scope.isDone()).toBe(true);
  });

  it('sends the model name from LLM_OLLAMA_CHAT_MODEL', async () => {
    const adapter = new OllamaAdapter(makeConfig({ LLM_OLLAMA_CHAT_MODEL: 'qwen2.5:14b' }));
    let captured: any = {};
    nock(OLLAMA_HOST)
      .post(CHAT_PATH, (body: any) => {
        captured = body;
        return true;
      })
      .reply(200, chatResponse('ok', 'qwen2.5:14b'));

    await adapter.complete([{ role: 'user', content: 'hi' }]);
    expect(captured.model).toBe('qwen2.5:14b');
  });

  it('jsonMode adds response_format {type:"json_object"} to the body', async () => {
    const adapter = new OllamaAdapter(makeConfig());
    let captured: any = {};
    nock(OLLAMA_HOST)
      .post(CHAT_PATH, (body: any) => {
        captured = body;
        return true;
      })
      .reply(200, chatResponse('{"intent":"refund"}'));

    await adapter.complete([{ role: 'user', content: 'refund?' }], { jsonMode: true });
    expect(captured.response_format).toEqual({ type: 'json_object' });
  });

  it('throws on a 500 response', async () => {
    const adapter = new OllamaAdapter(makeConfig());
    nock(OLLAMA_HOST).post(CHAT_PATH).reply(500, { error: 'internal' });

    await expect(adapter.complete([{ role: 'user', content: 'hi' }])).rejects.toThrow();
  });

  it('throws with a timeout finishReason hint when the request exceeds timeoutMs', async () => {
    const adapter = new OllamaAdapter(makeConfig());
    nock(OLLAMA_HOST).post(CHAT_PATH).delay(300).reply(200, chatResponse('too slow'));

    await expect(
      adapter.complete([{ role: 'user', content: 'hi' }], { timeoutMs: 40 }),
    ).rejects.toMatchObject({ finishReason: 'timeout' });
  });
});
