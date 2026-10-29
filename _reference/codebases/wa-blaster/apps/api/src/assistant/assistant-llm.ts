import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import type { AssistantLlmTurn, ChatMessage, ToolDef } from './assistant.types';

/** Injection token + seam. Tests provide a fake; prod binds OllamaAssistantLlm. */
export abstract class AssistantLlm {
  abstract chat(messages: ChatMessage[], tools: ToolDef[]): Promise<AssistantLlmTurn>;
}

@Injectable()
export class OllamaAssistantLlm extends AssistantLlm {
  private readonly logger = new Logger(OllamaAssistantLlm.name);
  private readonly http: AxiosInstance;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    super();
    const baseURL = this.config.get<string>('OLLAMA_BASE_URL', 'http://localhost:11434');
    const rawTimeout = Number(this.config.get<string>('OLLAMA_TIMEOUT_MS', '60000'));
    const timeout = Number.isFinite(rawTimeout) && rawTimeout > 0 ? rawTimeout : 60000;
    this.model = this.config.get<string>('OLLAMA_ASSISTANT_MODEL') || this.config.get<string>('OLLAMA_TEMPLATE_MODEL', 'qwen3:14b');
    this.http = axios.create({ baseURL, timeout });
  }

  async chat(messages: ChatMessage[], tools: ToolDef[]): Promise<AssistantLlmTurn> {
    const { data } = await this.http.post('/api/chat', {
      model: this.model,
      stream: false,
      think: false,
      options: { temperature: 0.2 },
      tools: tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.parameters } })),
      messages,
    });
    const msg = data?.message ?? {};
    const toolCalls = (msg.tool_calls ?? []).map((tc: any) => {
      const raw = tc.function?.arguments;
      const args = typeof raw === 'string' ? safeJson(raw) : (raw ?? {});
      return { name: tc.function?.name, arguments: args };
    });
    return {
      content: typeof msg.content === 'string' ? msg.content : '',
      toolCalls,
      raw: msg,
    };
  }
}

function safeJson(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}
