import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ChatMessage, LlmAdapter, LlmCompleteOptions, LlmCompletion } from './adapter.interface';

const DEFAULT_MAX_TOKENS = 512;
const DEFAULT_TEMPERATURE = 0.2;

/** Error thrown by the adapter, carrying a finishReason hint the router can inspect. */
type AdapterError = Error & { finishReason: LlmCompletion['finishReason']; status?: number };

/**
 * Thin axios wrapper over Ollama's OpenAI-compatible API (`POST {baseURL}/chat/completions`).
 * Model, base URL and default timeout come from env at construction time; the same instance
 * serves every task (classify, draft) — the router just calls it with different prompts.
 */
@Injectable()
export class OllamaAdapter implements LlmAdapter {
  private readonly logger = new Logger(OllamaAdapter.name);
  private readonly http: AxiosInstance;
  private readonly model: string;
  private readonly defaultTimeoutMs: number;

  constructor(private readonly config: ConfigService) {
    const baseURL = this.config.get<string>('LLM_OLLAMA_URL', 'http://localhost:11434/v1');
    this.model = this.config.get<string>('LLM_OLLAMA_CHAT_MODEL', 'qwen3.5:4b');
    this.defaultTimeoutMs = Number(this.config.get<string>('LLM_OLLAMA_TIMEOUT_MS', '20000'));
    this.http = axios.create({ baseURL });
  }

  name(): string {
    return 'ollama';
  }

  async complete(messages: ChatMessage[], opts: LlmCompleteOptions = {}): Promise<LlmCompletion> {
    const timeoutMs = opts.timeoutMs ?? this.defaultTimeoutMs;
    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens: opts.maxTokens ?? DEFAULT_MAX_TOKENS,
      temperature: opts.temperature ?? DEFAULT_TEMPERATURE,
    };
    if (opts.jsonMode) body.response_format = { type: 'json_object' };

    const startedAt = Date.now();
    try {
      const { data } = await this.http.post('/chat/completions', body, {
        signal: AbortSignal.timeout(timeoutMs),
      });
      const choice = data?.choices?.[0];
      return {
        text: choice?.message?.content ?? '',
        modelUsed: data?.model ?? this.model,
        latencyMs: Date.now() - startedAt,
        finishReason: mapFinishReason(choice?.finish_reason),
      };
    } catch (err) {
      throw this.toError(err, timeoutMs);
    }
  }

  private toError(err: unknown, timeoutMs: number): AdapterError {
    const e = err as { code?: string; name?: string; message?: string; response?: { status?: number } };
    const isTimeout =
      e?.code === 'ERR_CANCELED' ||
      e?.code === 'ECONNABORTED' ||
      e?.name === 'CanceledError' ||
      e?.name === 'TimeoutError';
    const status = e?.response?.status;
    const message = isTimeout
      ? `Ollama request timed out after ${timeoutMs}ms`
      : `Ollama request failed${status ? ` with status ${status}` : ''}: ${e?.message ?? 'unknown error'}`;
    const out = new Error(message) as AdapterError;
    out.finishReason = isTimeout ? 'timeout' : 'error';
    out.status = status;
    return out;
  }
}

function mapFinishReason(raw: unknown): LlmCompletion['finishReason'] {
  return raw === 'length' ? 'length' : 'stop';
}
