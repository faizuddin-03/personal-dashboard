import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage, LlmAdapter, LlmCompleteOptions, LlmCompletion } from './adapters/adapter.interface';
import { OllamaAdapter } from './adapters/ollama.adapter';
import { MockAdapter } from './adapters/mock.adapter';
import { LlmExhaustedException } from './llm-exhausted.exception';

export type LlmTask = 'classify' | 'draft';

/**
 * Routes completion requests to an adapter chain per task. Today both chains point at the
 * same Ollama instance (retry-on-failure); the chain abstraction stays so a future Mac Studio
 * variant can slot in a specialized adapter (e.g. a small model for classify) without rewriting
 * this service. If a chain is exhausted, throws LlmExhaustedException — the decision engine
 * translates that into an ESCALATE.
 */
@Injectable()
export class LlmRouterService {
  private readonly logger = new Logger(LlmRouterService.name);
  private readonly mockMode: boolean;
  private readonly mockAdapter = new MockAdapter();
  private readonly classifyChain: LlmAdapter[];
  private readonly draftChain: LlmAdapter[];

  constructor(private readonly config: ConfigService) {
    this.mockMode = this.config.get<string>('LLM_MOCK_MODE', 'true') === 'true';
    const ollama = new OllamaAdapter(this.config);
    // Same adapter twice = one retry against the same endpoint/model on transient failure.
    this.classifyChain = [ollama, ollama];
    this.draftChain = [ollama, ollama];
  }

  async complete(
    task: LlmTask,
    messages: ChatMessage[],
    opts?: LlmCompleteOptions,
  ): Promise<LlmCompletion> {
    if (this.mockMode) return this.mockAdapter.complete(messages, opts);

    const chain = this.chainForTask(task);
    let lastErr: unknown;
    for (const adapter of chain) {
      try {
        return await adapter.complete(messages, opts);
      } catch (e) {
        this.logger.warn(`${adapter.name()} failed: ${(e as Error).message}`);
        lastErr = e;
      }
    }
    throw new LlmExhaustedException('Ollama exhausted after retries', { cause: lastErr });
  }

  private chainForTask(task: LlmTask): LlmAdapter[] {
    return task === 'classify' ? this.classifyChain : this.draftChain;
  }
}
