import { Injectable, Logger } from '@nestjs/common';
import { LlmRouterService } from '../llm/llm-router.service';

/** Currency, percentage, parenthesised counts, or number+unit — i.e. a figure worth enriching. */
const FIGURE = /RM\s?\d|\d\s?%|\(\s*\d+\s*\)|\b\d+\s*(day|days|week|weeks|month|months|year|years|hour|hours|km|kilomet)/i;

const ENRICH_SYSTEM =
  'You enrich an insurance knowledge base for semantic search. Given ONE benefit and its limits, ' +
  'write 2-3 plain sentences that (a) state the benefit and its EXACT figures verbatim, and ' +
  '(b) include the everyday phrasings and scenarios a customer would use to ask about it. Keep ' +
  'every number exact. Do NOT invent figures or conditions. Output only the text, no preamble.';

/** A consequence/scenario passage worth enriching: a scenario reference AND an outcome term. */
const PROSE_SCENARIO = /\b(claim|tuntutan|accident|kemalangan|kejadian|breakdown|rosak)\b/i;
const PROSE_OUTCOME =
  /\b(zero|sifar|reset|forfeit|hilang|terjejas|reject(?:ed)?|ditolak|tolak|excess|ekses|kecuali|unless|except|void|batal|no longer)\b|tidak dilindungi|tidak lagi/i;

const ENRICH_PROSE_SYSTEM =
  'You enrich an insurance knowledge base for semantic search. Given a passage that states a rule, ' +
  'condition, or consequence (e.g. what happens when a customer makes a claim), output 3-4 of the ' +
  'everyday QUESTIONS a customer would ask about it — in their own words, in question form, and in ' +
  'the SAME language as the passage (e.g. "Apa jadi pada NCD saya kalau saya buat tuntutan?") — then ' +
  'ONE sentence answering them by restating the rule/outcome. Preserve every fact and figure exactly. ' +
  'Do NOT invent conditions or numbers. Output only the text, no preamble.';

/**
 * Ingestion-time enrichment for benefit table-rows: for a row that carries a figure, an LLM
 * generates a short natural-language restatement (exact figures + the everyday phrasings a customer
 * would use) that is appended to the row chunk before embedding. This lets a terse figure-row match
 * scenario-heavy questions ("if my car breaks down far from home, how much hotel accommodation…")
 * that pure dense/keyword retrieval would otherwise lose to the verbose narrative.
 */
@Injectable()
export class EnrichmentService {
  private readonly logger = new Logger(EnrichmentService.name);

  constructor(private readonly llm: LlmRouterService) {}

  /** True when the row contains a figure (amount, percentage, count, duration) worth enriching. */
  hasFigure(text: string): boolean {
    return FIGURE.test(text ?? '');
  }

  /**
   * Returns enrichment text to append to a figure-bearing row chunk, or '' for non-figure rows (no
   * LLM call) and on any failure (best-effort — enrichment must never break ingestion).
   */
  async enrichTableRow(rowText: string, docTitle: string): Promise<string> {
    if (!this.hasFigure(rowText)) return '';
    try {
      const res = await this.llm.complete(
        'draft',
        [
          { role: 'system', content: ENRICH_SYSTEM },
          { role: 'user', content: `Document: ${docTitle}\nBenefit row: ${rowText}` },
        ],
        { temperature: 0.2, maxTokens: 200 },
      );
      const out = (res.text ?? '').trim();
      // Guard against empty or runaway output (prompt echo / rambling).
      return out.length > 0 && out.length <= rowText.length + 800 ? out : '';
    } catch (e) {
      this.logger.warn(`enrich_failed: ${(e as Error).message}`);
      return '';
    }
  }

  /** True for a non-figure consequence/scenario passage (figures go through enrichTableRow). */
  shouldEnrichProse(text: string): boolean {
    const t = text ?? '';
    if (this.hasFigure(t)) return false;
    return PROSE_SCENARIO.test(t) && PROSE_OUTCOME.test(t);
  }

  /**
   * Returns enrichment text to append to a consequence-prose chunk, or '' (no LLM call) when the
   * gate fails and on any failure. Mirrors {@link enrichTableRow}'s best-effort contract: never
   * throws, length-guarded against runaway output, so enrichment can never break ingestion.
   */
  async enrichProse(text: string, docTitle: string): Promise<string> {
    if (!this.shouldEnrichProse(text)) return '';
    try {
      const res = await this.llm.complete(
        'draft',
        [
          { role: 'system', content: ENRICH_PROSE_SYSTEM },
          { role: 'user', content: `Document: ${docTitle}\nPassage: ${text}` },
        ],
        { temperature: 0.2, maxTokens: 200 },
      );
      const out = (res.text ?? '').trim();
      return out.length > 0 && out.length <= text.length + 800 ? out : '';
    } catch (e) {
      this.logger.warn(`enrich_prose_failed: ${(e as Error).message}`);
      return '';
    }
  }
}
