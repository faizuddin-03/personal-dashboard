/**
 * Cardinal number -> uppercase English words, matching the exact style seen
 * on real Delivery Order PDFs (e.g. "TWO", "FOUR", "TWENTY-FIVE").
 * `[verified: live DO PDFs, _reference/tickets/EAINT-12167/, 2026-09-23 —
 * "RM 1700.00, TWO SOFTWARE INSTALLATION" (qty 2, 0 extra),
 * "RM 1808.00, FOUR SOFTWARE INSTALLATION" (qty 2, 2 extra),
 * "RM 21250.00, TWENTY-FIVE SOFTWARE INSTALLATION" (qty 25, 0 extra) —
 * confirms the word count = quantity + extra installations]`
 * Only covers 1-40 (the device-purchase cap), which is all this flow needs.
 */
const ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
  "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];
const TENS = ["", "", "TWENTY", "THIRTY", "FORTY"];

export function numberToWords(n: number): string {
  if (n < 0 || n > 99) throw new Error(`numberToWords only supports 0-99, got ${n}`);
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? TENS[tens] : `${TENS[tens]}-${ONES[ones]}`;
}

/** The DO's installation-count word for a purchase: quantity + extra installations. */
export function installationCountWords(deviceQty: number, extraInstalls: number = 0): string {
  return numberToWords(deviceQty + extraInstalls);
}
