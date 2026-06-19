export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LlmCompletion {
  text: string;
  modelUsed: string;
  latencyMs: number;
  finishReason: 'stop' | 'length' | 'timeout' | 'error';
}

export interface LlmCompleteOptions {
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  jsonMode?: boolean;
}

export interface LlmAdapter {
  name(): string;
  complete(messages: ChatMessage[], opts?: LlmCompleteOptions): Promise<LlmCompletion>;
}
