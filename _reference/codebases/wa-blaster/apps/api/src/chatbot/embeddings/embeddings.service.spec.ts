import { ConfigService } from '@nestjs/config';
import { EMBEDDING_DIM, EmbeddingBatch } from './adapters/embedding-adapter.interface';

// --- Mock the three adapter classes so we can drive success/failure deterministically. ---
const ollamaEmbed = jest.fn();
const openaiEmbed = jest.fn();
const mockEmbed = jest.fn();

jest.mock('./adapters/ollama-embedding.adapter', () => ({
  OllamaEmbeddingAdapter: jest.fn().mockImplementation(() => ({
    name: () => 'ollama-bge-m3',
    dim: () => 1024,
    embed: ollamaEmbed,
  })),
}));
jest.mock('./adapters/openai-embedding.adapter', () => ({
  OpenAiEmbeddingAdapter: jest.fn().mockImplementation(() => ({
    name: () => 'openai-text-embedding-3-small',
    dim: () => 1024,
    embed: openaiEmbed,
  })),
}));
jest.mock('./adapters/mock-embedding.adapter', () => ({
  MockEmbeddingAdapter: jest.fn().mockImplementation(() => ({
    name: () => 'mock-embed',
    dim: () => 1024,
    embed: mockEmbed,
  })),
}));

import { OllamaEmbeddingAdapter } from './adapters/ollama-embedding.adapter';
import { OpenAiEmbeddingAdapter } from './adapters/openai-embedding.adapter';
import { MockEmbeddingAdapter } from './adapters/mock-embedding.adapter';
import { EmbeddingsService } from './embeddings.service';
import { EmbeddingsExhaustedException } from './embeddings-exhausted.exception';

function makeConfig(overrides: Record<string, string | undefined> = {}): ConfigService {
  const base: Record<string, string | undefined> = {
    EMBEDDINGS_MOCK_MODE: 'false',
    EMBEDDINGS_PRIMARY: 'ollama',
    OPENAI_API_KEY: 'sk-test',
  };
  const merged = { ...base, ...overrides };
  return {
    get: (key: string, fallback?: unknown) => (merged[key] !== undefined ? merged[key] : fallback),
    getOrThrow: (key: string) => {
      const v = merged[key];
      if (v === undefined) throw new Error(`missing: ${key}`);
      return v;
    },
  } as unknown as ConfigService;
}

/** A batch whose vector count matches the input, so callers can assert merged lengths. */
function batchFor(model: string, texts: string[]): EmbeddingBatch {
  return {
    vectors: texts.map(() => new Array(EMBEDDING_DIM).fill(0)),
    modelUsed: model,
    latencyMs: 1,
    tokenCount: texts.length,
  };
}

describe('EmbeddingsService', () => {
  beforeEach(() => {
    ollamaEmbed.mockReset();
    openaiEmbed.mockReset();
    mockEmbed.mockReset();
    (OllamaEmbeddingAdapter as unknown as jest.Mock).mockClear();
    (OpenAiEmbeddingAdapter as unknown as jest.Mock).mockClear();
    (MockEmbeddingAdapter as unknown as jest.Mock).mockClear();
  });

  it('EMBEDDINGS_MOCK_MODE=true routes to the mock adapter only', async () => {
    mockEmbed.mockImplementation((texts: string[]) => Promise.resolve(batchFor('mock-embed', texts)));
    const svc = new EmbeddingsService(makeConfig({ EMBEDDINGS_MOCK_MODE: 'true' }));

    const result = await svc.embed(['hi']);

    expect(mockEmbed).toHaveBeenCalledTimes(1);
    expect(ollamaEmbed).not.toHaveBeenCalled();
    expect(openaiEmbed).not.toHaveBeenCalled();
    expect(result.modelUsed).toBe('mock-embed');
  });

  it('default primary (ollama) succeeds without touching the fallback', async () => {
    ollamaEmbed.mockImplementation((texts: string[]) => Promise.resolve(batchFor('ollama-bge-m3', texts)));
    const svc = new EmbeddingsService(makeConfig());

    const result = await svc.embed(['hi']);

    expect(ollamaEmbed).toHaveBeenCalledTimes(1);
    expect(openaiEmbed).not.toHaveBeenCalled();
    expect(result.modelUsed).toBe('ollama-bge-m3');
  });

  it('primary ollama fails → falls back to OpenAI (key present)', async () => {
    ollamaEmbed.mockRejectedValue(new Error('connection refused'));
    openaiEmbed.mockImplementation((texts: string[]) => Promise.resolve(batchFor('openai-text-embedding-3-small', texts)));
    const svc = new EmbeddingsService(makeConfig());

    const result = await svc.embed(['hi']);

    expect(ollamaEmbed).toHaveBeenCalledTimes(1);
    expect(openaiEmbed).toHaveBeenCalledTimes(1);
    expect(result.modelUsed).toBe('openai-text-embedding-3-small');
  });

  it('EMBEDDINGS_PRIMARY=openai tries OpenAI first, then falls back to Ollama', async () => {
    openaiEmbed.mockRejectedValue(new Error('rate limited'));
    ollamaEmbed.mockImplementation((texts: string[]) => Promise.resolve(batchFor('ollama-bge-m3', texts)));
    const svc = new EmbeddingsService(makeConfig({ EMBEDDINGS_PRIMARY: 'openai' }));

    const result = await svc.embed(['hi']);

    expect(openaiEmbed).toHaveBeenCalledTimes(1);
    expect(ollamaEmbed).toHaveBeenCalledTimes(1);
    expect(result.modelUsed).toBe('ollama-bge-m3');
  });

  it('both adapters fail → throws EmbeddingsExhaustedException', async () => {
    ollamaEmbed.mockRejectedValue(new Error('ollama down'));
    openaiEmbed.mockRejectedValue(new Error('openai down'));
    const svc = new EmbeddingsService(makeConfig());

    await expect(svc.embed(['hi'])).rejects.toBeInstanceOf(EmbeddingsExhaustedException);
  });

  it('OPENAI_API_KEY missing → OpenAI adapter never constructed, only Ollama tried', async () => {
    ollamaEmbed.mockRejectedValue(new Error('ollama down'));
    const svc = new EmbeddingsService(makeConfig({ OPENAI_API_KEY: undefined }));

    await expect(svc.embed(['hi'])).rejects.toBeInstanceOf(EmbeddingsExhaustedException);
    expect(OpenAiEmbeddingAdapter).not.toHaveBeenCalled();
    expect(openaiEmbed).not.toHaveBeenCalled();
    expect(ollamaEmbed).toHaveBeenCalledTimes(1);
  });

  it('splits a batch over 100 texts into chunks of 100', async () => {
    ollamaEmbed.mockImplementation((texts: string[]) => Promise.resolve(batchFor('ollama-bge-m3', texts)));
    const svc = new EmbeddingsService(makeConfig({ OPENAI_API_KEY: undefined }));

    const texts = Array.from({ length: 250 }, (_, i) => `t${i}`);
    const result = await svc.embed(texts);

    expect(ollamaEmbed).toHaveBeenCalledTimes(3);
    expect(ollamaEmbed.mock.calls[0][0]).toHaveLength(100);
    expect(ollamaEmbed.mock.calls[1][0]).toHaveLength(100);
    expect(ollamaEmbed.mock.calls[2][0]).toHaveLength(50);
    expect(result.vectors).toHaveLength(250);
    expect(result.tokenCount).toBe(250);
  });
});
