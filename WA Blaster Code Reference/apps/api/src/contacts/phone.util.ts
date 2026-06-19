import { parsePhoneNumberFromString } from 'libphonenumber-js';

const DEFAULT_REGION = 'MY';

export function normalizePhoneE164(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    throw new Error('invalid phone: empty input');
  }
  const parsed = parsePhoneNumberFromString(raw.trim(), DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) {
    throw new Error(`invalid phone: ${raw}`);
  }
  return parsed.number;
}

/**
 * Classify a number as a WhatsApp-capable mobile (`PHONE`) or a non-mobile line (`LANE`, e.g. a
 * fixed line / fax). Used to drive opt-in eligibility — only mobiles can receive WhatsApp.
 *
 * libphonenumber's `getType()` is unreliable for Malaysian numbers (returns `undefined` for many
 * valid 011/03/088 lines), so we use the Malaysian numbering plan directly: a mobile's national
 * number starts with `1` (010–019); area-code lines (03/04/05/06/07/08/09) start with 3–9.
 * Numbers that can't be parsed, or non-Malaysian numbers, default to `PHONE` so we never
 * accidentally opt out a reachable contact (an operator can still opt them out manually).
 */
export function classifyNumberType(raw: string): 'PHONE' | 'LANE' {
  const parsed = parsePhoneNumberFromString((raw ?? '').trim(), DEFAULT_REGION);
  if (!parsed || !parsed.isValid()) return 'PHONE';
  if (parsed.countryCallingCode === '60') {
    return parsed.nationalNumber.startsWith('1') ? 'PHONE' : 'LANE';
  }
  return 'PHONE';
}
