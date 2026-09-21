import { resolveContactLanguages } from '../resolve-contact-languages';

describe('resolveContactLanguages', () => {
  const mapping = new Map<any, any>([
    ['PENANG', ['ZH', 'EN']],
    ['KELANTAN', ['MS']],
    ['SABAH', []],
  ]);

  it('returns mapped languages for a mapped state', () => {
    expect(resolveContactLanguages('PENANG', mapping, 'EN')).toEqual(['ZH', 'EN']);
    expect(resolveContactLanguages('KELANTAN', mapping, 'EN')).toEqual(['MS']);
  });

  it('falls back to default for null state', () => {
    expect(resolveContactLanguages(null, mapping, 'EN')).toEqual(['EN']);
  });

  it('falls back to default for an unmapped state', () => {
    expect(resolveContactLanguages('JOHOR', mapping, 'MS')).toEqual(['MS']);
  });

  it('falls back to default for an explicitly empty mapping', () => {
    expect(resolveContactLanguages('SABAH', mapping, 'EN')).toEqual(['EN']);
  });
});
