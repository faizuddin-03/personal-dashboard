export interface KnowledgeSnippet {
  question: string;
  answer: string;
}

export interface GenerateReplyInput {
  message: string;
  intent?: string;
  knowledge: KnowledgeSnippet[];
  dealerName?: string;
}

export interface GenerateReplyResult {
  text: string;
  confidence: number; // 0..1
}

export interface ClassifyIntentInput {
  message: string;
  intents: string[];
}

export interface ClassifyIntentResult {
  intent: string;
  confidence: number; // 0..1
}

export type ApprovalLikelihood = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GenerateTemplateDraftsInput {
  brief: string;
  languages: string[]; // e.g. ['EN','MS','ZH']
  tone: 'friendly' | 'formal';
}

export interface TemplateDraft {
  language: string;
  name: string;
  category: string;
  body: string;
  variables: string[];
  approvalLikelihood: ApprovalLikelihood;
  rationale: string;
}

/**
 * Result of a template-drafting request. `relevant` is the guardrail signal:
 * when the brief is not a genuine WhatsApp-template request (off-topic questions,
 * math, trivia, prompt-injection, etc.) the provider returns relevant=false with a
 * short refusalReason and no drafts, instead of answering the off-topic request.
 */
export interface TemplateDraftResult {
  relevant: boolean;
  refusalReason?: string;
  drafts: TemplateDraft[];
}

export interface SendTimeAdviceInput {
  campaignName: string;
  thisRun: { sentLabel: string | null; readRate: number; replyRate: number };
  recommendation: { windowLabel: string; share: number; confidence: 'LOW' | 'MEDIUM' | 'HIGH' };
}

export interface SendTimeAdvice {
  headline: string;
  body: string;
}
