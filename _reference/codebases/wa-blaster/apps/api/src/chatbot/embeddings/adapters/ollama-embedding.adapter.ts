import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { EMBEDDING_DIM, EmbeddingAdapter, EmbeddingBatch } from './embedding-adapter.interface';

const DEFAULT_TIMEOUT_MS = 10000;

/**
 * Thin axios wrapper over Ollama's OpenAI-compatible embeddings API
 * (`POST {baseURL}/embeddings`). Model, base URL and timeout come from env at construction.
 * Mirrors the OpenAI request/response shape: body `{model, input}`, response `data[i].embedding`.
 */
@Injectable()
export class OllamaEmbeddingAdapter implements EmbeddingAdapter {
  private readonly logger = new Logger(OllamaEmbeddingAdapter.name);
  private readonly http: AxiosInstance;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('EMBEDDINGS_OLLAMA_URL', 'http://localhost:11434/v1');
    this.model = this.config.get<string>('EMBEDDINGS_OLLAMA_MODEL', 'bge-m3');
    this.timeoutMs = Number(this.config.get<string>('EMBEDDINGS_OLLAMA_TIMEOUT_MS', String(DEFAULT_TIMEOUT_MS)));
    this.http = axios.create({ baseURL });
  }

  name(): string {
    return `ollama-${this.model}`;
  }

  dim(): number {
    return EMBEDDING_DIM;
  }

  async embed(texts: string[]): Promise<EmbeddingBatch> {
    const startedAt = Date.now();
    let data: any;
    try {
      const res = await this.http.post(
        '/embeddings',
        { model: this.model, input: texts },
        { signal: AbortSignal.timeout(this.timeoutMs) },
      );
      data = res.data;
    } catch (err) {
      throw this.toError(err);
    }

    const vectors: number[][] = (data?.data ?? []).map((d: any) => d.embedding);
    if (vectors.some((v) => v?.length !== EMBEDDING_DIM)) {
      throw new Error(
        `Ollama returned wrong embedding dim: ${vectors.find((v) => v?.length !== EMBEDDING_DIM)?.length} (expected ${EMBEDDING_DIM})`,
      );
    }

    return {
      vectors,
      modelUsed: this.name(),
      latencyMs: Date.now() - startedAt,
      tokenCount: data?.usage?.total_tokens ?? 0,
    };
  }

  private toError(err: unknown): Error {
    const e = err as { code?: string; name?: string; message?: string; response?: { status?: number } };
    const isTimeout =
      e?.code === 'ERR_CANCELED' ||
      e?.code === 'ECONNABORTED' ||
      e?.name === 'CanceledError' ||
      e?.name === 'TimeoutError';
    const status = e?.response?.status;
    if (isTimeout) return new Error(`Ollama embeddings request timed out after ${this.timeoutMs}ms`);
    return new Error(
      `Ollama embeddings request failed${status ? ` with status ${status}` : ''}: ${e?.message ?? 'unknown error'}`,
    );
  }
}
