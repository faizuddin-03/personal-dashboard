import { Injectable } from '@nestjs/common';
import { LlmService } from './llm.service';
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
 * Deterministic, offline LLM stub. Default provider so the demo and CI run
 * without an API key. Behavior is intentionally simple and predictable.
 */
@Injectable()
export class MockLlmService extends LlmService {
  async generateReply(input: GenerateReplyInput): Promise<GenerateReplyResult> {
    const top = input.knowledge[0];
    if (!top) {
      return { text: "I'm not certain about that — I'll pass you to a teammate.", confidence: 0.2 };
    }
    const who = input.dealerName ? `${input.dealerName}, ` : '';
    return { text: `${who}${top.answer}`, confidence: 0.9 };
  }

  async classifyIntent(input: ClassifyIntentInput): Promise<ClassifyIntentResult> {
    const lower = input.message.toLowerCase();
    const match = input.intents.find((i) => lower.includes(i.replace(/_/g, ' ')));
    return match ? { intent: match, confidence: 0.8 } : { intent: 'general', confidence: 0.4 };
  }

  async generateTemplateDrafts(input: GenerateTemplateDraftsInput): Promise<TemplateDraftResult> {
    const slug = input.brief.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 30) || 'template';
    const drafts = input.languages.flatMap((lang) => [
      {
        language: lang,
        name: `${slug}_a`,
        category: 'UTILITY' as const,
        body: `[${lang}] ${input.brief} — reply to {{1}} to continue.`,
        variables: ['name'],
        approvalLikelihood: 'HIGH' as const,
        rationale: 'Transactional wording, no promotional language — fits the Utility category.',
      },
      {
        language: lang,
        name: `${slug}_b`,
        category: 'MARKETING' as const,
        body: `[${lang}] Hi {{1}}! ${input.brief} Tap below to learn more about {{2}}.`,
        variables: ['name', 'topic'],
        approvalLikelihood: 'MEDIUM' as const,
        rationale: 'Warmer, promotional framing — Marketing category; slightly lower auto-approval odds.',
      },
    ]);
    // The offline stub never refuses — guardrail behavior is exercised against the
    // real provider and at the service layer (see TemplatesService.generateDrafts).
    return { relevant: true, drafts };
  }

  async generateSendTimeAdvice(input: SendTimeAdviceInput): Promise<SendTimeAdvice> {
    const prefix = input.thisRun.sentLabel
      ? `You sent ${input.campaignName} ${input.thisRun.sentLabel} and ${input.thisRun.readRate}% was read. `
      : '';
    return {
      headline: 'Best time to resend',
      body:
        `${prefix}This audience is most active ${input.recommendation.windowLabel} — ` +
        `about ${input.recommendation.share}% of their reads land then, so resending around that window should lift opens.`,
    };
  }
}
