import { Injectable, Logger } from '@nestjs/common';
import { AssistantLlm } from './assistant-llm';
import { AssistantToolsService } from './assistant-tools.service';
import { AssistantPlanService } from './assistant-plan.service';
import { MAX_ITERATIONS, PROPOSE_PLAN, SYSTEM_PROMPT, TOOL_DEFS } from './tool-defs';
import type { AssistantPlanInput, ChatMessage, ChatResult } from './assistant.types';

interface HandleInput {
  message: string;
  history: { role: 'user' | 'assistant'; content: string }[];
  userId: string;
}

@Injectable()
export class AssistantService {
  private readonly logger = new Logger(AssistantService.name);

  constructor(
    private readonly llm: AssistantLlm,
    private readonly tools: AssistantToolsService,
    private readonly plans: AssistantPlanService,
  ) {}

  async handleMessage({ message, history, userId }: HandleInput): Promise<ChatResult> {
    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role, content: h.content }) as ChatMessage),
      { role: 'user', content: message },
    ];

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const turn = await this.llm.chat(messages, TOOL_DEFS);
      messages.push(turn.raw as ChatMessage);

      if (turn.toolCalls.length === 0) {
        return { reply: turn.content || 'Could you clarify the audience and when to send?' };
      }

      const propose = turn.toolCalls.find((tc) => tc.name === PROPOSE_PLAN);
      if (propose) {
        try {
          const staged = await this.plans.stage(propose.arguments as unknown as AssistantPlanInput, userId);
          return { reply: turn.content || 'Here is the campaign — review and approve.', plan: staged };
        } catch (err) {
          const error = err instanceof Error ? err.message : 'invalid plan';
          this.logger.warn(`propose_plan rejected, asking model to repair: ${error}`);
          messages.push({ role: 'tool', content: JSON.stringify({ error }) });
          continue;
        }
      }

      for (const tc of turn.toolCalls) {
        const result = await this.tools.run(tc.name, tc.arguments);
        messages.push({ role: 'tool', content: JSON.stringify(result) });
      }
    }

    return { reply: "I couldn't complete that — try again with the audience and a clear send time (e.g. \"Monday morning\")." };
  }
}
