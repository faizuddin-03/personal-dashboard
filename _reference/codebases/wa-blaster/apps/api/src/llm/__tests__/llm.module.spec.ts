import { ConfigService } from '@nestjs/config';
import { llmServiceFactory } from '../llm.module';
import { MockLlmService } from '../mock-llm.service';
import { OllamaLlmService } from '../ollama-llm.service';

function cfg(provider?: string): ConfigService {
  return {
    get: (key: string, fallback?: string) => (key === 'LLM_PROVIDER' ? (provider ?? fallback) : fallback),
  } as unknown as ConfigService;
}

describe('llmServiceFactory', () => {
  const mock = new MockLlmService();
  const ollama = new OllamaLlmService(cfg(undefined), mock);

  it('returns the mock provider when LLM_PROVIDER is unset', () => {
    expect(llmServiceFactory(cfg(undefined), mock, ollama)).toBe(mock);
  });

  it('returns the Ollama provider when LLM_PROVIDER=ollama', () => {
    expect(llmServiceFactory(cfg('ollama'), mock, ollama)).toBe(ollama);
  });
});
