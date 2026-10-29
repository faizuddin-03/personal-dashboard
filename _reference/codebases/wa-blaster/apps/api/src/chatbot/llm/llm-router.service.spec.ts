import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { LlmRouterService } from './llm-router.service';
import { LlmExhaustedException } from './llm-exhausted.exception';

const CONFIG: Record<string, string> = {
  LLM_MOCK_MODE: 'false',
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

function chatResponse(content: string, model = 'qwen3.5:4b') {
  return { model, choices: [{ index: 0, message: { role: 'assistant', content }, finish_reason: 'stop' }] };
}

describe('LlmRouterService', () => {
  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('mock mode', () => {
    it('LLM_MOCK_MODE=true always uses the mock adapter and never hits the network', async () => {
      nock.disableNetConnect();
      const router = new LlmRouterService(makeConfig({ LLM_MOCK_MODE: 'true' }));

      const result = await router.complete(
        'classify',
        [{ role: 'user', content: 'Bila boleh refund?' }],
        { jsonMode: true },
      );

      expect(result.modelUsed).toBe('mock');
      expect(JSON.parse(result.text).intent).toBe('refund');
    });
  });

  describe("task='classify'", () => {
    it('retries the same Ollama endpoint/model on a transient failure, then succeeds', async () => {
      const router = new LlmRouterService(makeConfig());
      nock(OLLAMA_HOST).post(CHAT_PATH).reply(503, { error: 'model loading' });
      let captured: any = {};
      const second = nock(OLLAMA_HOST)
        .post(CHAT_PATH, (body: any) => {
          captured = body;
          return true;
        })
        .reply(200, chatResponse('{"intent":"refund"}'));

      const result = await router.complete(
        'classify',
        [{ role: 'user', content: 'refund?' }],
        { jsonMode: true },
      );

      expect(result.text).toBe('{"intent":"refund"}');
      expect(captured.model).toBe('qwen3.5:4b'); // retry used the same model
      expect(second.isDone()).toBe(true);
    });

    it('throws LlmExhaustedException carrying the last error when all retries fail', async () => {
      const router = new LlmRouterService(makeConfig());
      nock(OLLAMA_HOST).post(CHAT_PATH).times(2).reply(500, { error: 'boom' });

      const err = await router
        .complete('classify', [{ role: 'user', content: 'hi' }])
        .then(() => null)
        .catch((e) => e);

      expect(err).toBeInstanceOf(LlmExhaustedException);
      expect(err.cause).toBeDefined();
    });
  });

  describe("task='draft'", () => {
    it('uses the same Ollama chain on the happy path', async () => {
      const router = new LlmRouterService(makeConfig());
      const scope = nock(OLLAMA_HOST).post(CHAT_PATH).reply(200, chatResponse('Boleh, kami bantu.'));

      const result = await router.complete('draft', [{ role: 'user', content: 'tolong' }]);

      expect(result.text).toBe('Boleh, kami bantu.');
      expect(scope.isDone()).toBe(true);
    });

    it('also retries once on transient failure', async () => {
      const router = new LlmRouterService(makeConfig());
      nock(OLLAMA_HOST).post(CHAT_PATH).reply(500);
      const second = nock(OLLAMA_HOST).post(CHAT_PATH).reply(200, chatResponse('ok'));

      const result = await router.complete('draft', [{ role: 'user', content: 'x' }]);

      expect(result.text).toBe('ok');
      expect(second.isDone()).toBe(true);
    });
  });
});
