import { LlmRouterService } from '../llm/llm-router.service';
import { LlmExhaustedException } from '../llm/llm-exhausted.exception';
import { EnrichmentService } from './enrichment.service';

function makeLlm(complete: jest.Mock): LlmRouterService {
  return { complete } as unknown as LlmRouterService;
}
function completion(text: string) {
  return { text, modelUsed: 'mock', latencyMs: 1, finishReason: 'stop' as const };
}

describe('EnrichmentService', () => {
  describe('hasFigure', () => {
    const svc = new EnrichmentService(makeLlm(jest.fn()));
    it('detects currency, percent, parenthesised counts and number+unit', () => {
      expect(svc.hasFigure('Up to RM200 per day')).toBe(true);
      expect(svc.hasFigure('maximum five (5) days per incident')).toBe(true);
      expect(svc.hasFigure('NCD up to 55%')).toBe(true);
      expect(svc.hasFigure('more than 100 kilometers from home')).toBe(true);
      expect(svc.hasFigure('RM3 million')).toBe(true);
    });
    it('returns false for rows with no figure', () => {
      expect(svc.hasFigure('Up to the Sum Insured')).toBe(false);
      expect(svc.hasFigure('Covered')).toBe(false);
      expect(svc.hasFigure('Unlimited')).toBe(false);
    });
  });

  describe('enrichTableRow', () => {
    it('returns enriched text for a figure-bearing row', async () => {
      const complete = jest.fn().mockResolvedValue(
        completion('You can claim up to RM200 per day for hotel accommodation, maximum 5 days per incident.'),
      );
      const svc = new EnrichmentService(makeLlm(complete));

      const out = await svc.enrichTableRow('Hotel Accommodation Reimbursement — Up to RM200 per day, max 5 days', 'Chubb');

      expect(out).toContain('RM200 per day');
      expect(complete).toHaveBeenCalledTimes(1);
    });

    it('skips the LLM entirely for a row with no figure', async () => {
      const complete = jest.fn();
      const svc = new EnrichmentService(makeLlm(complete));

      const out = await svc.enrichTableRow('Loss or Damage To Your Car — Up to the Sum Insured', 'Chubb');

      expect(out).toBe('');
      expect(complete).not.toHaveBeenCalled();
    });

    it('returns "" (best-effort) when the LLM fails — never breaks ingestion', async () => {
      const complete = jest.fn().mockRejectedValue(new LlmExhaustedException('down'));
      const svc = new EnrichmentService(makeLlm(complete));

      const out = await svc.enrichTableRow('Hotel Accommodation — Up to RM200 per day', 'Chubb');

      expect(out).toBe('');
    });

    it('rejects an absurdly long / runaway enrichment', async () => {
      const complete = jest.fn().mockResolvedValue(completion('x'.repeat(5000)));
      const svc = new EnrichmentService(makeLlm(complete));

      const out = await svc.enrichTableRow('Hotel Accommodation — Up to RM200 per day', 'Chubb');

      expect(out).toBe('');
    });
  });

  describe('shouldEnrichProse', () => {
    const svc = new EnrichmentService(makeLlm(jest.fn()));

    it('enriches a consequence passage (claim + outcome cue, no figure)', () => {
      const text =
        'Satu Tuntutan dan Diskaun Tanpa Tuntutan Anda Menjadi Sifar. Jika Anda membuat tuntutan, ' +
        'kelayakan NCD akan menjadi sifar pada pembaharuan seterusnya.';
      expect(svc.shouldEnrichProse(text)).toBe(true);
    });

    it('skips a figure row (handled by the table-row path)', () => {
      expect(svc.shouldEnrichProse('Selepas 1 tahun tanpa tuntutan — Kelayakan: 25%')).toBe(false);
    });

    it('skips boilerplate with no scenario+outcome cue', () => {
      expect(svc.shouldEnrichProse('This policy is governed by the laws of Malaysia.')).toBe(false);
    });
  });

  describe('enrichProse', () => {
    it('returns "" without calling the LLM when the gate fails', async () => {
      const complete = jest.fn();
      const svc = new EnrichmentService(makeLlm(complete));

      const out = await svc.enrichProse('Governed by the laws of Malaysia.', 'Doc');

      expect(out).toBe('');
      expect(complete).not.toHaveBeenCalled();
    });

    it('returns the restatement for a passing consequence passage', async () => {
      const complete = jest.fn().mockResolvedValue(completion('If you claim, your NCD resets to zero.'));
      const svc = new EnrichmentService(makeLlm(complete));

      const out = await svc.enrichProse('Jika Anda membuat tuntutan, NCD menjadi sifar.', 'RHB BM');

      expect(out).toBe('If you claim, your NCD resets to zero.');
      expect(complete).toHaveBeenCalledTimes(1);
    });
  });
});
