import {
  GenerateReplyInput,
  GenerateReplyResult,
  ClassifyIntentInput,
  ClassifyIntentResult,
  GenerateTemplateDraftsInput,
  TemplateDraftResult,
  SendTimeAdviceInput,
  SendTimeAdvice,
} from './llm.types';

/**
 * Abstract contract for all LLM-backed features. Used as the NestJS injection
 * token so the concrete provider (mock vs. real) is swappable without touching
 * call sites. See llm.module.ts for binding.
 */
export abstract class LlmService {
  abstract generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult>;
  abstract classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentResult>;
  abstract generateTemplateDrafts(input: GenerateTemplateDraftsInput): Promise<TemplateDraftResult>;
  abstract generateSendTimeAdvice(input: SendTimeAdviceInput): Promise<SendTimeAdvice>;
}
