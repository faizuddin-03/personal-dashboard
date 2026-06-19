import * as crypto from 'crypto';
import { verifyMetaSignature } from '../webhook-signature.util';

const APP_SECRET = 'test-secret-12345';

function signBody(body: string, secret: string): string {
  const hmac = crypto.createHmac('sha256', secret).update(body).digest('hex');
  return `sha256=${hmac}`;
}

describe('verifyMetaSignature', () => {
  it('returns true for a correctly signed body', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const sig = signBody(body.toString('utf8'), APP_SECRET);
    expect(verifyMetaSignature(body, sig, APP_SECRET)).toBe(true);
  });

  it('returns false when the signature does not match', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    expect(verifyMetaSignature(body, 'sha256=deadbeef', APP_SECRET)).toBe(false);
  });

  it('returns false when the signature header is empty', () => {
    const body = Buffer.from('{}');
    expect(verifyMetaSignature(body, '', APP_SECRET)).toBe(false);
  });

  it('returns false when the prefix is missing', () => {
    const body = Buffer.from('{}');
    const hmac = crypto.createHmac('sha256', APP_SECRET).update(body).digest('hex');
    expect(verifyMetaSignature(body, hmac, APP_SECRET)).toBe(false); // no "sha256=" prefix
  });

  it('returns false when the secret is wrong', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const sig = signBody(body.toString('utf8'), 'wrong-secret');
    expect(verifyMetaSignature(body, sig, APP_SECRET)).toBe(false);
  });

  it('uses constant-time comparison (timingSafeEqual)', () => {
    // Both signatures wrong but different lengths -> must not throw, must return false
    const body = Buffer.from('{}');
    expect(verifyMetaSignature(body, 'sha256=short', APP_SECRET)).toBe(false);
    expect(verifyMetaSignature(body, 'sha256=' + 'a'.repeat(64), APP_SECRET)).toBe(false);
  });
});
