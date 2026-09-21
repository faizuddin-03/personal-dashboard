import { renderTemplate, resolveValue } from '../variable-renderer';

const contact = {
  id: 'c1',
  phoneE164: '+60123456789',
  name: 'Ahmad',
  state: 'Selangor',
  attributes: { tier: 'gold', orderId: '12345' } as Record<string, unknown>,
} as any;

describe('resolveValue', () => {
  it('reads contact.name', () => {
    expect(resolveValue('contact.name', contact)).toBe('Ahmad');
  });

  it('reads contact.state', () => {
    expect(resolveValue('contact.state', contact)).toBe('Selangor');
  });

  it('reads nested attribute via contact.attributes.X', () => {
    expect(resolveValue('contact.attributes.tier', contact)).toBe('gold');
  });

  it('returns empty string for unknown contact.field', () => {
    expect(resolveValue('contact.unknown', contact)).toBe('');
  });

  it('returns the literal value when source starts with literal:', () => {
    expect(resolveValue('literal:Hello', contact)).toBe('Hello');
  });

  it('returns empty string for a name with no value (null)', () => {
    expect(resolveValue('contact.name', { ...contact, name: null })).toBe('');
  });
});

describe('renderTemplate', () => {
  it('substitutes a single {{1}} placeholder', () => {
    const result = renderTemplate('Hello {{1}}!', { '1': 'contact.name' }, contact);
    expect(result).toBe('Hello Ahmad!');
  });

  it('substitutes multiple placeholders', () => {
    const result = renderTemplate('Hi {{1}}, your order is {{2}}', { '1': 'contact.name', '2': 'contact.attributes.orderId' }, contact);
    expect(result).toBe('Hi Ahmad, your order is 12345');
  });

  it('leaves placeholders empty when source is missing', () => {
    const result = renderTemplate('Hi {{1}}', { '1': 'contact.missing' }, contact);
    expect(result).toBe('Hi ');
  });

  it('returns body unchanged when no placeholders', () => {
    expect(renderTemplate('Hi there', {}, contact)).toBe('Hi there');
  });

  it('returns an ordered components array matching the template variables', () => {
    // helper that returns the Meta-API components payload
    const components = renderTemplate.toComponents(['1', '2'], { '1': 'contact.name', '2': 'literal:Premium' }, contact);
    expect(components).toEqual([
      { type: 'body', parameters: [
        { type: 'text', text: 'Ahmad' },
        { type: 'text', text: 'Premium' },
      ]},
    ]);
  });
});
