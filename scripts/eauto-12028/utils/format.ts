// Number, date and word formats the TS expect.

/** SRD v1.1 REQ-008 "#,##0.00 format (2 decimal places, comma as thousands separator). Example: 38,785.00". */
export const AMOUNT_RE = /^\d{1,3}(,\d{3})*\.\d{2}$/;
/** A transaction count as the mock-up prints it (toLocaleString('en-US'), e.g. "38,785"). */
export const COUNT_RE = /^\d{1,3}(,\d{3})*$/;
/** SRD v1.1 REQ-006 "DD-MM-YYYY format, e.g. 31-07-2026". */
export const DATE_RE = /^\d{2}-\d{2}-\d{4}$/;

export const fmtCount = (n: number) => n.toLocaleString('en-US');
export const fmtAmount = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** "38,785.00" → 38785; throws on anything that is not a number. */
export function toNumber(text: string, what: string): number {
  const t = text.trim();
  if (!/^\d{1,3}(,\d{3})*(\.\d+)?$|^\d+(\.\d+)?$/.test(t)) throw new Error(`${what} is "${t}", not a number.`);
  return Number(t.replace(/,/g, ''));
}

const pad = (n: number) => String(n).padStart(2, '0');
export const ddmmyyyy = (d: Date) => `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
const MON = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
/** Reads an Audit Log When cell in the expected "DD-MM-YYYY HH:mm" or the live "02 Nov 2026 15:36" shape; NaN when neither. Used to FIND rows only: the format itself is checked separately. */
export function parseWhen(text: string): number {
  const s = text.trim();
  let m = s.match(/^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1], +(m[4] ?? 0), +(m[5] ?? 0)).getTime();
  m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[a-z]*\s+(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (m) {
    const mo = MON.indexOf(m[2].toLowerCase());
    if (mo >= 0) return new Date(+m[3], mo, +m[1], +(m[4] ?? 0), +(m[5] ?? 0)).getTime();
  }
  return NaN;
}
/** The DD-MM-YYYY day of a When cell, or null when it cannot be read as a date. */
export function whenDay(text: string): string | null {
  const t = parseWhen(text);
  return Number.isNaN(t) ? null : ddmmyyyy(new Date(t));
}
export const addDays = (d: Date, n: number) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };
export const today = () => addDays(new Date(), 0);

/** "January" → "JAN" (SRD §2.2.10 row 9 "English short form. Format: MON YYYY (e.g. JUN 2026)"). */
export const monShort = (month: string) => month.slice(0, 3).toUpperCase();
/** "January" → "Jan" — the mock-up total label "YEAR TO DATE (Jan–Jun)". */
export const monTitle = (month: string) => month.slice(0, 3);

/** Amount in words, as the sample requisition writes it ("EIGHTY THREE THOUSAND THIRTY FIVE ONLY",
 *  Sample ASSOCIATIONS PAYMENT REQUISITION_20260728-text.md R30). Sen: "AND <n> SEN" (mock-up amtWords, line 370) [unconfirmed]. */
export function amountInWords(amount: number): string {
  const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
  const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
  const below1000 = (x: number): string => {
    const parts: string[] = [];
    if (x >= 100) { parts.push(`${ones[Math.floor(x / 100)]} HUNDRED`); x %= 100; }
    if (x >= 20) { parts.push(tens[Math.floor(x / 10)] + (x % 10 ? ` ${ones[x % 10]}` : '')); }
    else if (x > 0) parts.push(ones[x]);
    return parts.join(' ');
  };
  const words = (n: number): string => {
    if (n === 0) return 'ZERO';
    const parts: string[] = [];
    for (const [name, size] of [['BILLION', 1e9], ['MILLION', 1e6], ['THOUSAND', 1e3]] as const) {
      if (n >= size) { parts.push(`${below1000(Math.floor(n / size))} ${name}`); n %= size; }
    }
    if (n > 0) parts.push(below1000(n));
    return parts.join(' ');
  };
  const whole = Math.floor(amount);
  const sen = Math.round((amount - whole) * 100);
  return `${words(whole)}${sen ? ` AND ${words(sen)} SEN` : ''} ONLY`;
}

export const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whitespace-tolerant regex for a phrase (PDF text breaks lines anywhere). */
export const phraseRe = (s: string, flags = '') => new RegExp(s.trim().split(/\s+/).map(escapeRe).join('\\s*'), flags);

export function detail(label: string, value: string): void {
  console.log('DETAIL:' + JSON.stringify({ label, value }));
}
