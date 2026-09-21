import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { OllamaEmbeddingAdapter } from './ollama-embedding.adapter';
import { EMBEDDING_DIM } from './embedding-adapter.interface';

const CONFIG: Record<string, string> = {
  EMBEDDINGS_OLLAMA_URL: 'http://localhost:11434/v1',
  EMBEDDINGS_OLLAMA_MODEL: 'bge-m3',
  EMBEDDINGS_OLLAMA_TIMEOUT_MS: '10000',
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
const EMBED_PATH = '/v1/embeddings';

/** A deterministic 1024-length vector; offset lets us make distinct rows. */
function vec(offset = 0, dim = EMBEDDING_DIM): number[] {
  return Array.from({ length: dim }, (_, i) => (i + offset) / dim);
}

function embeddingsResponse(vectors: number[][], model = 'bge-m3') {
  return {
    object: 'list',
    model,
    data: vectors.map((embedding, index) => ({ object: 'embedding', index, embedding })),
    usage: { prompt_tokens: 11, total_tokens: 11 },
  };
}

describe('OllamaEmbeddingAdapter', () => {
  afterEach(() => nock.cleanAll());

  it('name() and dim() identify the adapter', () => {
    const adapter = new OllamaEmbeddingAdapter(makeConfig());
    expect(adapter.name()).toBe('ollama-bge-m3');
    expect(adapter.dim()).toBe(EMBEDDING_DIM);
  });

  it('POSTs {model, input:<array>} and parses data[i].embedding', async () => {
    const adapter = new OllamaEmbeddingAdapter(makeConfig());
    let captured: any = {};
    const scope = nock(OLLAMA_HOST)
      .post(EMBED_PATH, (body: any) => {
        captured = body;
        return true;
      })
      .reply(200, embeddingsResponse([vec(0), vec(1)]));

    const result = await adapter.embed(['shipping to KL?', 'refund policy?']);

    expect(captured.model).toBe('bge-m3');
    expect(captured.input).toEqual(['shipping to KL?', 'refund policy?']);
    expect(result.vectors).toHaveLength(2);
    expect(result.vectors[0]).toHaveLength(EMBEDDING_DIM);
    expect(result.modelUsed).toBe('ollama-bge-m3');
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
    expect(result.tokenCount).toBe(11);
    expect(scope.isDone()).toBe(true);
  });

  it('uses the model from EMBEDDINGS_OLLAMA_MODEL', async () => {
    const adapter = new OllamaEmbeddingAdapter(makeConfig({ EMBEDDINGS_OLLAMA_MODEL: 'nomic-embed' }));
    let captured: any = {};
    nock(OLLAMA_HOST)
      .post(EMBED_PATH, (body: any) => {
        captured = body;
        return true;
      })
      .reply(200, embeddingsResponse([vec(0)], 'nomic-embed'));

    await adapter.embed(['hi']);
    expect(captured.model).toBe('nomic-embed');
  });

  it('a batch of 32 strings goes out in a single request', async () => {
    const adapter = new OllamaEmbeddingAdapter(makeConfig());
    const inputs = Array.from({ length: 32 }, (_, i) => `text ${i}`);
    let captured: any = {};
    const scope = nock(OLLAMA_HOST)
      .post(EMBED_PATH, (body: any) => {
        captured = body;
        return true;
      })
      .reply(200, embeddingsResponse(inputs.map((_, i) => vec(i))));

    const result = await adapter.embed(inputs);

    expect(captured.input).toHaveLength(32);
    expect(result.vectors).toHaveLength(32);
    expect(scope.isDone()).toBe(true);
  });

  it('throws on a 500 response', async () => {
    const adapter = new OllamaEmbeddingAdapter(makeConfig());
    nock(OLLAMA_HOST).post(EMBED_PATH).reply(500, { error: 'internal' });

    await expect(adapter.embed(['hi'])).rejects.toThrow();
  });

  it('throws when the request exceeds the timeout', async () => {
    const adapter = new OllamaEmbeddingAdapter(makeConfig({ EMBEDDINGS_OLLAMA_TIMEOUT_MS: '40' }));
    nock(OLLAMA_HOST).post(EMBED_PATH).delay(300).reply(200, embeddingsResponse([vec(0)]));

    await expect(adapter.embed(['hi'])).rejects.toThrow();
  });

  it('throws when a returned vector is not 1024-dim', async () => {
    const adapter = new OllamaEmbeddingAdapter(makeConfig());
    nock(OLLAMA_HOST).post(EMBED_PATH).reply(200, embeddingsResponse([vec(0, 768)]));

    await expect(adapter.embed(['hi'])).rejects.toThrow(/dim/i);
  });
});
