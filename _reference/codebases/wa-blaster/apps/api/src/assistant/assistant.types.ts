// apps/api/src/assistant/assistant.types.ts

export type PlanIntent = 'reuse_and_schedule' | 'create_and_schedule';
export type PlanLanguage = 'EN' | 'MS' | 'ZH' | 'TA' | 'OTHER';

export interface ReuseTemplateSpec {
  mode: 'reuse';
  name: string;
}
export interface CreateTemplateSpec {
  mode: 'create';
  name: string; // lowercase letters/digits/underscores, starts with a letter
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  languages: PlanLanguage[];
  bodyText: string;
  variables: string[];
}
export type TemplateSpec = ReuseTemplateSpec | CreateTemplateSpec;

/** The structured object the model emits via the propose_plan tool. */
export interface AssistantPlanInput {
  intent: PlanIntent;
  campaignName: string;
  template: TemplateSpec;
  audience: { segmentId: string };
  defaultLanguage: PlanLanguage;
  variableMapping: Record<string, string>;
  schedule: { sendAt: string }; // ISO 8601
}

/** What the API returns to the frontend for the confirmation cards. */
export interface StagedPlan {
  id: string;
  status: 'PENDING_APPROVAL' | 'EXECUTED' | 'CANCELLED' | 'EXPIRED';
  plan: AssistantPlanInput;
  expiresAt: string;
}

// ---- tool-calling seam ----
export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>; // JSON schema
}
export interface AssistantToolCall {
  name: string;
  arguments: Record<string, unknown>;
}
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}
/** One model turn: free-text content + any tool calls + the raw message to append back. */
export interface AssistantLlmTurn {
  content: string;
  toolCalls: AssistantToolCall[];
  raw: unknown;
}

export interface ChatResult {
  reply: string;
  plan?: StagedPlan;
}
