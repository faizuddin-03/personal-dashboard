import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmbeddingAdapter, EmbeddingBatch } from './adapters/embedding-adapter.interface';
import { OllamaEmbeddingAdapter } from './adapters/ollama-embedding.adapter';
import { OpenAiEmbeddingAdapter } from './adapters/openai-embedding.adapter';
import { MockEmbeddingAdapter } from './adapters/mock-embedding.adapter';
import { EmbeddingsExhaustedException } from './embeddings-exhausted.exception';

const MAX_BATCH = 100;

/**
 * Picks an embedding adapter chain from env and embeds text with primary→fallback retry.
 * Primary defaults to Ollama (bge-m3); OpenAI is wired as the other end of the chain only
 * when OPENAI_API_KEY is set. EMBEDDINGS_PRIMARY=openai flips the order. With no OpenAI key
 * there is no fallback, so a primary failure surfaces as EmbeddingsExhaustedException.
 * EMBEDDINGS_MOCK_MODE=true bypasses the chain entirely (deterministic, network-free).
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly mockMode: boolean;
  private readonly mockAdapter = new MockEmbeddingAdapter();
  private readonly primary: EmbeddingAdapter;
  private readonly fallback?: EmbeddingAdapter;

  constructor(private readonly config: ConfigService) {
    this.mockMode = this.config.get<string>('EMBEDDINGS_MOCK_MODE', 'false') === 'true';

    const ollama = new OllamaEmbeddingAdapter(this.config);
    const hasOpenAi = !!this.config.get<string>('OPENAI_API_KEY');
    const openai = hasOpenAi ? new OpenAiEmbeddingAdapter(this.config) : undefined;

    const preferOpenAi = this.config.get<string>('EMBEDDINGS_PRIMARY', 'ollama') === 'openai';
    if (preferOpenAi && openai) {
      this.primary = openai;
      this.fallback = ollama;
    } else {
      this.primary = ollama;
      this.fallback = openai;
    }
  }

  async embed(texts: string[]): Promise<EmbeddingBatch> {
    if (this.mockMode) return this.mockAdapter.embed(texts);

    // Batch in groups of 100 to avoid hitting per-request limits.
    const batches = chunk(texts, MAX_BATCH);
    const results: EmbeddingBatch[] = [];
    for (const batch of batches) {
      results.push(await this.embedOne(batch));
    }
    return mergeBatches(results);
  }

  private async embedOne(texts: string[]): Promise<EmbeddingBatch> {
    try {
      return await this.primary.embed(texts);
    } catch (e) {
      this.logger.warn(`Primary embedding (${this.primary.name()}) failed: ${(e as Error).message}`);
      if (this.fallback) {
        try {
          return await this.fallback.embed(texts);
        } catch (e2) {
          this.logger.warn(`Fallback embedding (${this.fallback.name()}) failed: ${(e2 as Error).message}`);
          throw new EmbeddingsExhaustedException('Primary and fallback embedding adapters failed', { cause: e2 });
        }
      }
      throw new EmbeddingsExhaustedException('No fallback embedding adapter configured', { cause: e });
    }
  }
}

function chunk<T>(items: T[], size: number): T[][] {
  if (items.length <= size) return [items];
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

function mergeBatches(batches: EmbeddingBatch[]): EmbeddingBatch {
  return {
    vectors: batches.flatMap((b) => b.vectors),
    modelUsed: batches[0]?.modelUsed ?? '',
    latencyMs: batches.reduce((acc, b) => acc + b.latencyMs, 0),
    tokenCount: batches.reduce((acc, b) => acc + b.tokenCount, 0),
  };
}
