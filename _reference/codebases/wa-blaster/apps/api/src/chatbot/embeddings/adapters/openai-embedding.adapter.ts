import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { EmbeddingAdapter, EmbeddingBatch } from './embedding-adapter.interface';

/**
 * OpenAI embeddings via the official SDK. Constructed only when OPENAI_API_KEY is set
 * (the service guards on that). `dimensions` is pinned so OpenAI's output matches the
 * pgvector column width and the Ollama bge-m3 primary — both sides of the chain are 1024-dim.
 */
@Injectable()
export class OpenAiEmbeddingAdapter implements EmbeddingAdapter {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly dimensions: number;

  constructor(private readonly config: ConfigService) {
    this.client = new OpenAI({ apiKey: config.getOrThrow('OPENAI_API_KEY') });
    this.model = config.get('EMBEDDINGS_OPENAI_MODEL', 'text-embedding-3-small');
    this.dimensions = Number(config.get('EMBEDDINGS_OPENAI_DIMENSIONS', 1024));
  }

  name() {
    return `openai-${this.model}`;
  }

  dim() {
    return this.dimensions;
  }

  async embed(texts: string[]): Promise<EmbeddingBatch> {
    const t0 = Date.now();
    const res = await this.client.embeddings.create({
      model: this.model,
      input: texts,
      dimensions: this.dimensions,
    });
    const vectors = res.data.map((d) => d.embedding);
    if (vectors.some((v) => v.length !== this.dimensions)) {
      throw new Error(`OpenAI returned wrong dim: ${vectors[0]?.length}`);
    }
    return {
      vectors,
      modelUsed: `openai-${this.model}`,
      latencyMs: Date.now() - t0,
      tokenCount: res.usage?.total_tokens ?? 0,
    };
  }
}
