import { ConfigService } from '@nestjs/config';
import { EMBEDDING_DIM } from './embedding-adapter.interface';

// Mock the openai SDK: `new OpenAI(...)` exposes `embeddings.create(...)`.
const createMock = jest.fn();
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      embeddings: { create: createMock },
    })),
  };
});

// Imported after the mock is registered.
import OpenAI from 'openai';
import { OpenAiEmbeddingAdapter } from './openai-embedding.adapter';

const CONFIG: Record<string, string> = {
  OPENAI_API_KEY: 'sk-test',
  EMBEDDINGS_OPENAI_MODEL: 'text-embedding-3-small',
  EMBEDDINGS_OPENAI_DIMENSIONS: '1024',
};

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const merged = { ...CONFIG, ...overrides };
  return {
    get: (key: string, fallback?: unknown) => merged[key] ?? fallback,
    getOrThrow: (key: string) => {
      const v = merged[key];
      if (!v) throw new Error(`missing: ${key}`);
      return v;
    },
  } as unknown as ConfigService;
}

function vec(offset = 0, dim = EMBEDDING_DIM): number[] {
  return Array.from({ length: dim }, (_, i) => (i + offset) / dim);
}

describe('OpenAiEmbeddingAdapter', () => {
  beforeEach(() => {
    createMock.mockReset();
    (OpenAI as unknown as jest.Mock).mockClear();
  });

  it('name() and dim() identify the adapter', () => {
    const adapter = new OpenAiEmbeddingAdapter(makeConfig());
    expect(adapter.name()).toBe('openai-text-embedding-3-small');
    expect(adapter.dim()).toBe(EMBEDDING_DIM);
  });

  it('constructs the client with the API key from config', () => {
    new OpenAiEmbeddingAdapter(makeConfig());
    expect(OpenAI).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'sk-test' }));
  });

  it('calls embeddings.create with model, input and dimensions=1024 and maps the vectors', async () => {
    createMock.mockResolvedValue({
      data: [{ embedding: vec(0) }, { embedding: vec(1) }],
      usage: { total_tokens: 9 },
    });
    const adapter = new OpenAiEmbeddingAdapter(makeConfig());

    const result = await adapter.embed(['a', 'b']);

    expect(createMock).toHaveBeenCalledWith({
      model: 'text-embedding-3-small',
      input: ['a', 'b'],
      dimensions: 1024,
    });
    expect(result.vectors).toHaveLength(2);
    expect(result.vectors[0]).toHaveLength(EMBEDDING_DIM);
    expect(result.modelUsed).toBe('openai-text-embedding-3-small');
    expect(result.tokenCount).toBe(9);
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it('throws when the API returns a wrong-dim vector', async () => {
    createMock.mockResolvedValue({ data: [{ embedding: vec(0, 512) }], usage: { total_tokens: 1 } });
    const adapter = new OpenAiEmbeddingAdapter(makeConfig());

    await expect(adapter.embed(['x'])).rejects.toThrow(/dim/i);
  });

  it('propagates API errors', async () => {
    createMock.mockRejectedValue(new Error('rate limited'));
    const adapter = new OpenAiEmbeddingAdapter(makeConfig());

    await expect(adapter.embed(['x'])).rejects.toThrow('rate limited');
  });
});
