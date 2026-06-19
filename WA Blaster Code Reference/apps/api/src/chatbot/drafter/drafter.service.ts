import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmRouterService } from '../llm/llm-router.service';
import { RetrievedChunk } from '../knowledge/retrieval.service';
import { buildDrafterSystemPrompt } from './prompts/drafter.prompt';

export interface DrafterInput {
  customerMessage: string;
  language: 'en' | 'ms';
  chunks: RetrievedChunk[]; // from RetrievalService
  conversationHistory?: Array<{ role: 'customer' | 'bot' | 'operator'; body: string }>;
  businessName: string;
  campaignText?: string;
}

export interface DrafterOutput {
  body: string;
  draftConfidence: number;
  modelUsed: string;
  latencyMs: number;
  citedChunkIds: string[]; // mapped from LLM ranks → chunk ids
  citedRanks: number[]; // ranks the LLM said it used
}

@Injectable()
export class DrafterService {
  private readonly decoupleLangConfidence: boolean;

  // ConfigService is @Optional so unit tests can construct the service with just the LLM router.
  constructor(
    private readonly llm: LlmRouterService,
    @Optional() config?: ConfigService,
  ) {
    this.decoupleLangConfidence =
      config?.get<string>('CHATBOT_CONFIDENCE_DECOUPLE_LANG', 'false') === 'true';
  }

  async draft(input: DrafterInput): Promise<DrafterOutput> {
    const system = buildDrafterSystemPrompt({
      businessName: input.businessName,
      language: input.language,
      chunks: input.chunks.map((c) => ({ rank: c.rank, text: c.text, document: c.document })),
      campaignText: input.campaignText,
      history: input.conversationHistory,
      decoupleLangConfidence: this.decoupleLangConfidence,
    });

    const res = await this.llm.complete(
      'draft',
      [
        { role: 'system', content: system },
        { role: 'user', content: input.customerMessage },
      ],
      { jsonMode: true, maxTokens: 300, temperature: 0.3 },
    );

    try {
      const parsed = JSON.parse(res.text);
      const body = String(parsed.reply ?? '').trim();
      const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0;
      const citedRanks: number[] = Array.isArray(parsed.cited_chunks)
        ? parsed.cited_chunks.filter((n: unknown) => Number.isInteger(n))
        : [];
      const citedChunkIds = citedRanks
        .map((rank) => input.chunks.find((c) => c.rank === rank)?.chunkId)
        .filter(Boolean) as string[];

      return {
        body,
        draftConfidence: confidence,
        modelUsed: res.modelUsed,
        latencyMs: res.latencyMs,
        citedChunkIds,
        citedRanks,
      };
    } catch {
      return {
        body: '',
        draftConfidence: 0,
        modelUsed: res.modelUsed,
        latencyMs: res.latencyMs,
        citedChunkIds: [],
        citedRanks: [],
      };
    }
  }
}
