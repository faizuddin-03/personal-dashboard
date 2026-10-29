import { Module } from '@nestjs/common';
import { LlmRouterService } from './llm-router.service';

/**
 * Provides the LLM router. ConfigModule is global, so the router reads its Ollama
 * settings (LLM_OLLAMA_URL, LLM_OLLAMA_CHAT_MODEL, LLM_OLLAMA_TIMEOUT_MS, LLM_MOCK_MODE)
 * straight from ConfigService — no extra imports needed here.
 */
@Module({
  providers: [LlmRouterService],
  exports: [LlmRouterService],
})
export class LlmModule {}
