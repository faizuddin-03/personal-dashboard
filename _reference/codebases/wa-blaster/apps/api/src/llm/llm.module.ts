import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from './llm.service';
import { MockLlmService } from './mock-llm.service';
import { OllamaLlmService } from './ollama-llm.service';

/**
 * Selects the concrete LLM provider at runtime. Mock-first: default is the
 * deterministic offline stub; set LLM_PROVIDER=ollama to use the local model.
 */
export function llmServiceFactory(
  config: ConfigService,
  mock: MockLlmService,
  ollama: OllamaLlmService,
): LlmService {
  const provider = (config.get<string>('LLM_PROVIDER') ?? '').toLowerCase().trim();
  return provider === 'ollama' ? ollama : mock;
}

// NOTE: OllamaLlmService and the factory depend on ConfigService. ConfigModule is
// global in both AppModule and WorkerAppModule, so this resolves in the running app;
// any test that bootstraps LlmModule in isolation must also provide ConfigService.
@Global()
@Module({
  providers: [
    MockLlmService,
    OllamaLlmService,
    {
      provide: LlmService,
      inject: [ConfigService, MockLlmService, OllamaLlmService],
      useFactory: llmServiceFactory,
    },
  ],
  exports: [LlmService],
})
export class LlmModule {}
