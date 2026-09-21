import { MockLlmService } from '../mock-llm.service';

describe('MockLlmService', () => {
  const svc = new MockLlmService();

  it('returns the top KB answer with high confidence when knowledge is present', async () => {
    const r = await svc.generateReply({
      message: 'how do I transfer ownership?',
      knowledge: [{ question: 'transfer?', answer: 'Use the eAuto portal.' }],
    });
    expect(r.text).toBe('Use the eAuto portal.');
    expect(r.confidence).toBeGreaterThanOrEqual(0.7);
  });

  it('returns low confidence when no knowledge is available', async () => {
    const r = await svc.generateReply({ message: 'anything', knowledge: [] });
    expect(r.confidence).toBeLessThan(0.5);
  });

  it('classifies intent by keyword and falls back to general', async () => {
    const hit = await svc.classifyIntent({
      message: 'I need a credit topup please',
      intents: ['credit_topup', 'complaint'],
    });
    expect(hit.intent).toBe('credit_topup');

    const miss = await svc.classifyIntent({ message: 'hello there', intents: ['credit_topup'] });
    expect(miss.intent).toBe('general');
  });

  it('generates two distinct drafts per requested language and is always relevant', async () => {
    const { relevant, drafts } = await svc.generateTemplateDrafts({
      brief: 'subscription renewal reminder',
      languages: ['EN', 'MS'],
      tone: 'friendly',
    });
    expect(relevant).toBe(true);
    expect(drafts).toHaveLength(4);
    expect(drafts.filter((d) => d.language === 'EN')).toHaveLength(2);
    expect(drafts.filter((d) => d.language === 'MS')).toHaveLength(2);
    const en = drafts.filter((d) => d.language === 'EN');
    expect(en[0].name).not.toBe(en[1].name);
    expect(en[0].variables.length).not.toBe(en[1].variables.length);
  });

  it('narrates send-time advice deterministically from the given figures', async () => {
    const r = await svc.generateSendTimeAdvice({
      campaignName: 'Roadtax June',
      thisRun: { sentLabel: 'Tue 2 PM', readRate: 34, replyRate: 6 },
      recommendation: { windowLabel: 'Mon–Fri, 7 PM–9 PM', share: 41, confidence: 'MEDIUM' },
    });
    expect(r.headline).toBeTruthy();
    expect(r.body).toContain('Mon–Fri, 7 PM–9 PM');
    expect(r.body).toContain('41%');
    expect(r.body).toContain('Tue 2 PM');
  });
});
