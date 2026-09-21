import { NoAiSelfReferenceGuard } from '../no-ai-self-reference.guard';

describe('NoAiSelfReferenceGuard', () => {
  const guard = new NoAiSelfReferenceGuard();

  it('passes a normal human-sounding reply', () => {
    expect(guard.check('Sure! We open at 9am daily.')).toEqual({ ok: true, reason: '' });
  });

  it('fails when the reply admits to being an AI', () => {
    expect(guard.check('I am an AI assistant here to help.')).toEqual({
      ok: false,
      reason: 'ai_self_reference',
    });
  });

  it('fails when the reply admits to being a bot', () => {
    expect(guard.check("Sorry, I'm a bot.").ok).toBe(false);
  });

  it('fails on the "automated system" phrasing', () => {
    expect(guard.check('This is an automated response.').ok).toBe(false);
  });

  it('fails on the Bahasa Malaysia "saya bot" phrasing', () => {
    expect(guard.check('Maaf, saya bot.').ok).toBe(false);
  });
});
