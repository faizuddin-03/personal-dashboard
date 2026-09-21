import { deriveSubKind, normalizeToE164, buildSimPayload } from '../sim-readback';

describe('sim-readback pure helpers', () => {
  it('deriveSubKind maps opt-out to safety_escalate', () => {
    expect(deriveSubKind('ESCALATE', 'opt_out_requested')).toBe('safety_escalate');
    expect(deriveSubKind('AUTO_SEND', 'approved')).toBe('rag_answer');
    expect(deriveSubKind('IGNORE', 'opted_out')).toBe('ignore_opted_out');
  });

  it('normalizeToE164 strips non-digits and prefixes +', () => {
    expect(normalizeToE164('60 12-345 6789')).toBe('+60123456789');
  });

  it('buildSimPayload produces a text Meta payload with a unique wamid', () => {
    const p = buildSimPayload('+60123456789', 'hello', 7);
    expect(p.message.from).toBe('60123456789');
    expect(p.message.type).toBe('text');
    expect(p.message.text?.body).toBe('hello');
    expect(p.message.id).toMatch(/^wamid\.sim-\d+-7$/);
    expect(p.contacts[0].wa_id).toBe('60123456789');
  });
});
