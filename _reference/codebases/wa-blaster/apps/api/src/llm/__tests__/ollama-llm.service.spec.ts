import nock from 'nock';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { OllamaLlmService } from '../ollama-llm.service';
import { MockLlmService } from '../mock-llm.service';

const BASE = 'http://localhost:11434';

function makeConfig(overrides: Record<string, string> = {}): ConfigService {
  const merged: Record<string, string> = {
    OLLAMA_BASE_URL: BASE,
    OLLAMA_TEMPLATE_MODEL: 'qwen3:14b',
    OLLAMA_TIMEOUT_MS: '60000',
    ...overrides,
  };
  return {
    get: (key: string, fallback?: string) => merged[key] ?? fallback,
  } as unknown as ConfigService;
}

function makeService(overrides: Record<string, string> = {}) {
  return new OllamaLlmService(makeConfig(overrides), new MockLlmService());
}

// Shapes an Ollama /api/chat reply whose message.content is the JSON string
// the model emits under the structured-output `format`.
function chatReply(drafts: unknown) {
  return {
    model: 'qwen3:14b',
    message: { role: 'assistant', content: JSON.stringify({ relevant: true, drafts }) },
    done: true,
  };
}

// A guardrail refusal: the model judged the brief off-topic.
function refusalReply(refusalReason: string) {
  return {
    model: 'qwen3:14b',
    message: { role: 'assistant', content: JSON.stringify({ relevant: false, refusalReason, drafts: [] }) },
    done: true,
  };
}

const GOOD_EN_DRAFTS = [
  {
    language: 'EN',
    name: 'insurance_renewal_a',
    category: 'UTILITY',
    body: 'Hi {{1}}, your insurance for {{2}} expires soon. Reply to renew.',
    variables: ['name', 'plate'],
    approvalLikelihood: 'HIGH',
    rationale: 'Transactional wording fits Utility.',
  },
  {
    language: 'EN',
    name: 'insurance_renewal_b',
    category: 'MARKETING',
    body: 'Hi {{1}}! Renew {{2}} with eAuto in minutes and save.',
    variables: ['name', 'plate'],
    approvalLikelihood: 'MEDIUM',
    rationale: 'Promotional framing, Marketing category.',
  },
];

describe('OllamaLlmService', () => {
  afterEach(() => nock.cleanAll());

  describe('generateTemplateDrafts', () => {
    it('sends a non-streaming, thinking-off, schema-constrained request', async () => {
      const service = makeService();
      const scope = nock(BASE)
        .post(
          '/api/chat',
          (body) =>
            body.model === 'qwen3:14b' &&
            body.stream === false &&
            body.think === false &&
            !!body.format &&
            Array.isArray(body.messages) &&
            body.messages.length === 2,
        )
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      const result = await service.generateTemplateDrafts({
        brief: 'insurance renewal reminder',
        languages: ['EN'],
        tone: 'friendly',
      });

      expect(scope.isDone()).toBe(true);
      expect(result.relevant).toBe(true);
      expect(result.drafts).toHaveLength(2);
      expect(result.drafts[0].name).toBe('insurance_renewal_a');
      expect(result.drafts[0].category).toBe('UTILITY');
    });

    it('uses the model name from OLLAMA_TEMPLATE_MODEL', async () => {
      const service = makeService({ OLLAMA_TEMPLATE_MODEL: 'qwen2.5:14b' });
      const scope = nock(BASE)
        .post('/api/chat', (body) => body.model === 'qwen2.5:14b')
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      await service.generateTemplateDrafts({ brief: 'x', languages: ['EN'], tone: 'formal' });
      expect(scope.isDone()).toBe(true);
    });

    it('normalizes bad enums and slugs, and drops unrequested languages', async () => {
      const service = makeService();
      nock(BASE)
        .post('/api/chat')
        .reply(
          200,
          chatReply([
            {
              language: 'EN',
              name: 'Insurance Renewal!!', // not a valid slug
              category: 'promo', // not a valid enum
              body: 'Hi {{1}}',
              variables: ['name'],
              approvalLikelihood: 'pretty good', // not a valid enum
              rationale: 'r',
            },
            {
              language: 'FR', // not requested → dropped
              name: 'french_one',
              category: 'MARKETING',
              body: 'Bonjour {{1}}',
              variables: ['name'],
              approvalLikelihood: 'HIGH',
              rationale: 'r',
            },
          ]),
        );

      const result = await service.generateTemplateDrafts({
        brief: 'renewal',
        languages: ['EN'],
        tone: 'friendly',
      });

      expect(result.drafts).toHaveLength(1);
      expect(result.drafts[0].language).toBe('EN');
      expect(result.drafts[0].name).toMatch(/^[a-z][a-z0-9_]*$/);
      expect(result.drafts[0].category).toBe('UTILITY'); // fallback
      expect(result.drafts[0].approvalLikelihood).toBe('MEDIUM'); // fallback
    });

    it('keeps drafts when the model labels languages with different casing or names', async () => {
      // Real models (e.g. qwen2.5) emit lower-case codes ("ms") or localized names
      // ("Chinese"); these must still map to the requested MS/ZH, not be dropped.
      const service = makeService();
      nock(BASE)
        .post('/api/chat')
        .reply(200, {
          model: 'qwen2.5:latest',
          message: {
            role: 'assistant',
            content: JSON.stringify({
              relevant: true,
              drafts: [
                { language: 'ms', name: 'renew_ms', category: 'UTILITY', body: 'Hai {{1}}', variables: ['name'], approvalLikelihood: 'HIGH', rationale: 'r' },
                { language: 'Chinese', name: 'renew_zh', category: 'MARKETING', body: '你好 {{1}}', variables: ['name'], approvalLikelihood: 'MEDIUM', rationale: 'r' },
              ],
            }),
          },
          done: true,
        });

      const result = await service.generateTemplateDrafts({
        brief: 'renewal',
        languages: ['MS', 'ZH'],
        tone: 'friendly',
      });

      expect(result.drafts.map((d) => d.language).sort()).toEqual(['MS', 'ZH']);
    });

    it('constrains the draft language to the requested set via the output schema', async () => {
      const service = makeService();
      const scope = nock(BASE)
        .post(
          '/api/chat',
          (body) =>
            JSON.stringify(body?.format?.properties?.drafts?.items?.properties?.language?.enum) ===
            JSON.stringify(['EN']),
        )
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      await service.generateTemplateDrafts({ brief: 'x', languages: ['EN'], tone: 'friendly' });
      expect(scope.isDone()).toBe(true);
    });

    it('sends a low temperature for steadier guardrail decisions', async () => {
      const service = makeService();
      const scope = nock(BASE)
        .post('/api/chat', (body) => body.options?.temperature === 0.3)
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      await service.generateTemplateDrafts({ brief: 'renewal', languages: ['EN'], tone: 'friendly' });
      expect(scope.isDone()).toBe(true);
    });

    it('forces relevance to be decided first: relevanceReasoning is the first required schema field', async () => {
      // Ollama emits JSON properties in schema order, so making the model write its
      // relevance reasoning BEFORE the `relevant` boolean and any draft tokens gives the
      // guardrail a scratchpad even with think:false.
      const service = makeService();
      const scope = nock(BASE)
        .post('/api/chat', (body) => {
          const props = body?.format?.properties ?? {};
          const required: string[] = body?.format?.required ?? [];
          return (
            Object.keys(props)[0] === 'relevanceReasoning' &&
            required.includes('relevanceReasoning') &&
            required.includes('relevant') &&
            required.includes('drafts')
          );
        })
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      await service.generateTemplateDrafts({ brief: 'renewal', languages: ['EN'], tone: 'friendly' });
      expect(scope.isDone()).toBe(true);
    });

    it('embeds guardrail few-shot refusals (incl. the reported failing case) in the system prompt', async () => {
      const service = makeService();
      let systemPrompt = '';
      const scope = nock(BASE)
        .post('/api/chat', (body) => {
          systemPrompt = body?.messages?.[0]?.content ?? '';
          return true;
        })
        .reply(200, chatReply(GOOD_EN_DRAFTS));

      await service.generateTemplateDrafts({ brief: 'renewal', languages: ['EN'], tone: 'friendly' });
      expect(scope.isDone()).toBe(true);
      const lower = systemPrompt.toLowerCase();
      expect(lower).toContain('where is paris');
      expect(lower).toContain('broadcast');
    });

    it('retries once on a transient failure, then succeeds', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').reply(500, 'boom'); // attempt 1
      const ok = nock(BASE).post('/api/chat').reply(200, chatReply(GOOD_EN_DRAFTS)); // attempt 2

      const result = await service.generateTemplateDrafts({
        brief: 'renewal',
        languages: ['EN'],
        tone: 'friendly',
      });

      expect(result.drafts).toHaveLength(2);
      expect(ok.isDone()).toBe(true);
    });

    it('returns a refusal without retrying when the model judges the brief off-topic', async () => {
      const service = makeService();
      // Single interceptor: if the code retried, the second POST would have no
      // interceptor and the test would fail — so this also proves "no retry".
      const scope = nock(BASE)
        .post('/api/chat')
        .reply(200, refusalReply('Not a WhatsApp template request.'));

      const result = await service.generateTemplateDrafts({
        brief: 'what is 1 + 1?',
        languages: ['EN'],
        tone: 'friendly',
      });

      expect(scope.isDone()).toBe(true);
      expect(result.relevant).toBe(false);
      expect(result.drafts).toHaveLength(0);
      expect(result.refusalReason).toBe('Not a WhatsApp template request.');
    });

    it('throws ServiceUnavailableException after two failures', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').twice().reply(200, { message: { content: 'not json' } });

      await expect(
        service.generateTemplateDrafts({ brief: 'x', languages: ['EN'], tone: 'friendly' }),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });

  describe('delegation to the mock', () => {
    it('classifyIntent matches MockLlmService', async () => {
      const service = makeService();
      const r = await service.classifyIntent({
        message: 'I need a credit topup please',
        intents: ['credit_topup', 'complaint'],
      });
      expect(r.intent).toBe('credit_topup');
    });

    it('generateReply matches MockLlmService', async () => {
      const service = makeService();
      const r = await service.generateReply({
        message: 'how do I renew?',
        knowledge: [{ question: 'renew?', answer: 'Use eAuto.' }],
      });
      expect(r.text).toBe('Use eAuto.');
    });
  });

  describe('generateSendTimeAdvice', () => {
    const input = {
      campaignName: 'Roadtax June',
      thisRun: { sentLabel: 'Tue 2 PM', readRate: 34, replyRate: 6 },
      recommendation: { windowLabel: 'Mon–Fri, 7 PM–9 PM', share: 41, confidence: 'MEDIUM' as const },
    };

    it('returns the model headline/body on a valid response', async () => {
      const service = makeService();
      nock(BASE)
        .post('/api/chat')
        .reply(200, {
          message: { role: 'assistant', content: JSON.stringify({ headline: 'Resend in the evening', body: 'Send around 7–9 PM.' }) },
          done: true,
        });
      const r = await service.generateSendTimeAdvice(input);
      expect(r.headline).toBe('Resend in the evening');
      expect(r.body).toBe('Send around 7–9 PM.');
    });

    it('uses OLLAMA_INSIGHT_MODEL when set', async () => {
      const service = makeService({ OLLAMA_INSIGHT_MODEL: 'qwen2.5:14b' });
      let sentModel = '';
      nock(BASE)
        .post('/api/chat', (b: any) => { sentModel = b.model; return true; })
        .reply(200, { message: { content: JSON.stringify({ headline: 'h', body: 'b' }) }, done: true });
      await service.generateSendTimeAdvice(input);
      expect(sentModel).toBe('qwen2.5:14b');
    });

    it('falls back to the deterministic mock when Ollama fails', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').reply(500, 'boom');
      const r = await service.generateSendTimeAdvice(input);
      // Mock narrator phrasing references the passed window + share.
      expect(r.body).toContain('Mon–Fri, 7 PM–9 PM');
      expect(r.body).toContain('41%');
    });

    it('falls back to the mock when the model emits unparseable JSON', async () => {
      const service = makeService();
      nock(BASE).post('/api/chat').reply(200, { message: { content: 'not json {{' }, done: true });
      const r = await service.generateSendTimeAdvice(input);
      expect(r.body).toContain('Mon–Fri, 7 PM–9 PM');
    });
  });
});
