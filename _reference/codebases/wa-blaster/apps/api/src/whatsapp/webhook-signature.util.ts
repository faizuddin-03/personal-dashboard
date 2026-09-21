import * as crypto from 'crypto';

const PREFIX = 'sha256=';

export function verifyMetaSignature(rawBody: Buffer, headerValue: string, appSecret: string): boolean {
  if (!headerValue || !headerValue.startsWith(PREFIX)) return false;

  const provided = headerValue.slice(PREFIX.length);
  const expected = crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex');

  const providedBuf = Buffer.from(provided, 'hex');
  const expectedBuf = Buffer.from(expected, 'hex');

  if (providedBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}
