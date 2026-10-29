import {
  fromMetaLocale,
  fromMetaStatus,
  fromMetaCategory,
  parseMetaComponents,
} from '../meta-template-mapping';

describe('fromMetaLocale', () => {
  it('maps known Meta locales to local language codes', () => {
    expect(fromMetaLocale('en')).toBe('EN');
    expect(fromMetaLocale('en_US')).toBe('EN');
    expect(fromMetaLocale('ms')).toBe('MS');
    expect(fromMetaLocale('zh_CN')).toBe('ZH');
    expect(fromMetaLocale('ta')).toBe('TA');
  });
  it('falls back to OTHER for unknown/empty locales', () => {
    expect(fromMetaLocale('fr')).toBe('OTHER');
    expect(fromMetaLocale('')).toBe('OTHER');
  });
});

describe('fromMetaStatus', () => {
  it('maps Meta statuses to the local enum', () => {
    expect(fromMetaStatus('APPROVED')).toBe('APPROVED');
    expect(fromMetaStatus('PENDING')).toBe('PENDING');
    expect(fromMetaStatus('IN_APPEAL')).toBe('PENDING');
    expect(fromMetaStatus('REJECTED')).toBe('REJECTED');
    expect(fromMetaStatus('PAUSED')).toBe('DISABLED');
    expect(fromMetaStatus('DISABLED')).toBe('DISABLED');
  });
  it('returns null for an unknown status', () => {
    expect(fromMetaStatus('SOMETHING_NEW')).toBeNull();
  });
});

describe('fromMetaCategory', () => {
  it('passes through known categories and defaults unknown to UTILITY', () => {
    expect(fromMetaCategory('MARKETING')).toBe('MARKETING');
    expect(fromMetaCategory('UTILITY')).toBe('UTILITY');
    expect(fromMetaCategory('AUTHENTICATION')).toBe('AUTHENTICATION');
    expect(fromMetaCategory('OTP')).toBe('UTILITY');
  });
});

describe('parseMetaComponents', () => {
  it('extracts body, text header, footer, buttons and example variables', () => {
    const parsed = parseMetaComponents([
      { type: 'HEADER', format: 'TEXT', text: 'Promo' },
      { type: 'BODY', text: 'Hi {{1}}, code {{2}}', example: { body_text: [['Ahmad', '1234']] } },
      { type: 'FOOTER', text: 'eAuto' },
      {
        type: 'BUTTONS',
        buttons: [
          { type: 'URL', text: 'Open', url: 'https://x' },
          { type: 'PHONE_NUMBER', text: 'Call', phone_number: '+60123' },
        ],
      },
    ] as any);
    expect(parsed.bodyText).toBe('Hi {{1}}, code {{2}}');
    expect(parsed.headerJson).toEqual({ type: 'TEXT', text: 'Promo' });
    expect(parsed.footerText).toBe('eAuto');
    expect(parsed.variables).toEqual(['Ahmad', '1234']);
    expect(parsed.buttonsJson).toEqual([
      { type: 'URL', text: 'Open', url: 'https://x' },
      { type: 'PHONE_NUMBER', text: 'Call', phoneNumber: '+60123' },
    ]);
  });

  it('drops non-text headers and sizes variables to placeholder count when no example is given', () => {
    const parsed = parseMetaComponents([
      { type: 'HEADER', format: 'IMAGE' },
      { type: 'BODY', text: 'Hi {{1}} and {{2}}' },
    ] as any);
    expect(parsed.headerJson).toBeNull();
    expect(parsed.footerText).toBeNull();
    expect(parsed.buttonsJson).toBeNull();
    expect(parsed.variables).toEqual(['', '']);
  });
});
