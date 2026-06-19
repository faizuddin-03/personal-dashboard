import { buildDrafterSystemPrompt } from './drafter.prompt';

describe('buildDrafterSystemPrompt', () => {
  it('includes a CAMPAIGN section when campaignText is provided', () => {
    const p = buildDrafterSystemPrompt({
      businessName: 'X',
      language: 'en',
      chunks: [],
      campaignText: 'Get 15% off until 30 June.',
    });
    expect(p).toContain('CAMPAIGN');
    expect(p).toContain('Get 15% off until 30 June.');
  });

  it('omits CAMPAIGN and RECENT CONVERSATION when not provided', () => {
    const p = buildDrafterSystemPrompt({ businessName: 'X', language: 'en', chunks: [] });
    expect(p).not.toContain('CAMPAIGN');
    expect(p).not.toContain('RECENT CONVERSATION');
  });

  it('labels an operator turn as Agent', () => {
    const p = buildDrafterSystemPrompt({
      businessName: 'X',
      language: 'en',
      chunks: [],
      history: [{ role: 'operator', body: 'How can I help?' }],
    });
    expect(p).toContain('Agent: How can I help?');
  });

  it('renders conversation history with role labels', () => {
    const p = buildDrafterSystemPrompt({
      businessName: 'X',
      language: 'en',
      chunks: [],
      history: [
        { role: 'customer', body: 'Is towing free?' },
        { role: 'bot', body: 'Yes, unlimited.' },
      ],
    });
    expect(p).toContain('RECENT CONVERSATION');
    expect(p).toContain('Customer: Is towing free?');
    expect(p).toContain('You: Yes, unlimited.');
  });

  it('uses the original source-coverage wording when the decouple flag is OFF (default, safe)', () => {
    const p = buildDrafterSystemPrompt({ businessName: 'X', language: 'ms', chunks: [] });
    expect(p).toContain('how well the SOURCES answer the question');
    expect(p).not.toContain('NOT how hard it is to phrase the reply');
  });

  it('anchors confidence to source coverage, not output-language difficulty when flag ON (ms)', () => {
    const p = buildDrafterSystemPrompt({ businessName: 'X', language: 'ms', chunks: [], decoupleLangConfidence: true });
    expect(p).toContain('NOT how hard it is to phrase the reply');
    expect(p).toContain('translate them into Bahasa Malaysia');
  });

  it('interpolates the reply language into the confidence instruction when flag ON (en)', () => {
    const p = buildDrafterSystemPrompt({ businessName: 'X', language: 'en', chunks: [], decoupleLangConfidence: true });
    expect(p).toContain('NOT how hard it is to phrase the reply');
    expect(p).toContain('translate them into English');
  });

  it('keeps the calibration clause on the campaign path when flag ON', () => {
    const p = buildDrafterSystemPrompt({
      businessName: 'X',
      language: 'ms',
      chunks: [],
      campaignText: 'Promo',
      decoupleLangConfidence: true,
    });
    expect(p).toContain('NOT how hard it is to phrase the reply');
    expect(p).toContain('CAMPAIGN/SOURCES contain the facts');
  });
});
