import { Injectable } from '@nestjs/common';
import { RetrievedChunk } from '../knowledge/retrieval.service';
import { LengthGuard } from './length.guard';
import { NoUnknownPromisesGuard } from './no-unknown-promises.guard';
import { NoAiSelfReferenceGuard } from './no-ai-self-reference.guard';

/**
 * Combines the three draft-side guards (length / no_unknown_promises / no_ai_self_reference) into
 * a single pass. Returns every failure reason so the decision engine can log exactly why a draft
 * was rejected before falling back to the consent offer.
 */
@Injectable()
export class GuardrailsService {
  constructor(
    private readonly length: LengthGuard,
    private readonly noUnknownPromises: NoUnknownPromisesGuard,
    private readonly noAiSelfReference: NoAiSelfReferenceGuard,
  ) {}

  evaluate(
    draftBody: string,
    ctx: {
      chunks: RetrievedChunk[];
      language: 'en' | 'ms';
      campaignText?: string;
      customerMessage?: string;
      conversationHistory?: Array<{ role: 'customer' | 'bot' | 'operator'; body: string }>;
    },
  ): { passed: boolean; failures: string[] } {
    const failures: string[] = [];

    const lenResult = this.length.check(draftBody);
    if (!lenResult.ok) failures.push(lenResult.reason);

    // Numbers the customer themselves provided (their age, car year, a price they quoted) are
    // legitimate grounding — echoing them back is not a hallucinated promise. Fold the campaign,
    // the current message and recent history into the grounding text for the promises guard.
    const extraGrounding = [
      ctx.campaignText,
      ctx.customerMessage,
      ...(ctx.conversationHistory ?? []).map((t) => t.body),
    ]
      .filter(Boolean)
      .join(' ');

    const promResult = this.noUnknownPromises.check(draftBody, ctx.chunks, extraGrounding);
    if (!promResult.ok) failures.push(promResult.reason);

    const aiResult = this.noAiSelfReference.check(draftBody);
    if (!aiResult.ok) failures.push(aiResult.reason);

    return { passed: failures.length === 0, failures };
  }
}
