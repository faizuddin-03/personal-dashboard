// ── CIBO (Secarang back office) — config + test data ───────
// EAINT-12327 (Payment Mode column format) and the CIBO leg of EAINT-12107
// (Payment Channel filter, 12107_TS06). Selectors come from the pages
// captured live on 2026-10-16: _reference/html/cibo/*.html.
//
// Every test input comes from the /eauto/12107 dashboard page as an env var —
// no fallback values here (Faizuddin, 2026-10-16). The dashboard pre-fills the
// CIBO staging login. Exception, Faizuddin 2026-10-19: the transaction refs
// ("BR…" boxes) are "any values that the automation should decide by
// itself" — a blank ref is found on CIBO by utils/ciboRefFinder.ts.

export const CIBO = {
  baseUrl: process.env.CIBO_BASE_URL || 'https://staging.secarang.com/cibo',
  loginPath: '/auth/login',
  loginId: process.env.CIBO_LOGIN_ID || '',
  password: process.env.CIBO_PASSWORD || '',

  // The listing search is a server round trip; staging answers in ~1 s.
  listingTimeout: 60_000,
  // Payment Report hung on staging 2026-10-16 (summary POST pending > 60 s on
  // four tries) — give it a long, separate ceiling so a slow day still passes
  // and a hung one fails with a clear message instead of a test timeout.
  paymentReportTimeout: 120_000,
  // Transaction Management export of the whole table (~7,900 rows) never
  // finished; a single-ref export came back in < 10 s.
  exportTimeout: 90_000,
};

/** Transaction refs per payment method — typed on the dashboard, or filled
 *  in at run time by utils/ciboRefFinder.ts when left blank. */
export const CIBO_REFS = {
  grabPay:        process.env.CIBO_REF_GRABPAY        || '',
  shopeePay:      process.env.CIBO_REF_SHOPEEPAY      || '',
  sPayLater:      process.env.CIBO_REF_SPAYLATER      || '',
  grabPayLater:   process.env.CIBO_REF_GRAB_PAYLATER  || '',
  boldPayTng:     process.env.CIBO_REF_BOLDPAY_TNG    || '',
  fiuuFpx:        process.env.CIBO_REF_FIUU_FPX       || '', // Secarang FPX paid through Fiuu, e.g. 12107_TS08
  boldPayCard:    process.env.CIBO_REF_BOLDPAY_CARD   || '',
  noPayment:      process.env.CIBO_REF_NO_PAYMENT     || '',
  existing:       process.env.CIBO_REF_EXISTING       || '',
  eautoRhb:       process.env.CIBO_REF_EAUTO_RHB      || '', // 12327_TS19 (TS v2)
  secarangRms:    process.env.CIBO_REF_SECARANG_RMS   || '', // 12327_TS19 (TS v2)
};

/** Fails the TS when a dashboard input was left blank. */
export function required(value: string, field: string): string {
  if (!value.trim()) throw new Error(`"${field}" is blank — type it in the CIBO box on /eauto/12107.`);
  return value.trim();
}

/**
 * Expected Payment Mode strings — 12327_TS12, copied verbatim from the
 * combined TS (row 21). The dashes are EN DASHES (U+2013), as the export
 * CSV also shows; the separator before the method is " | ".
 */
export const PAYMENT_MODE = {
  boldPayTng:   'BoldPay | eWallet – TouchNGo',
  // FPX: SA (Teams, relayed by Faizuddin 2026-10-20): "added Fiuu - FPX display
  // format for Secarang payment method ya: Fiuu | Online Banking – FPX-Bank Name".
  fiuuFpx:      /^Fiuu \| Online Banking – FPX-\S/,
  boldPayCard:  'BoldPay | Credit/Debit Card – MBBMGATE_MS',
  // Full Amount and SPayLater show the same value — Fiuu cannot tell them
  // apart (dev, 2026-10-19); TS line merged the same day.
  shopeePay:    'Fiuu | eWallet – ShopeePay',
  sPayLater:    'Fiuu | eWallet – ShopeePay',
  grabPay:      'Fiuu | eWallet – GrabPay – Full Amount – Single Payment',
  grabPayLater: 'Fiuu | eWallet – GrabPay – BNPL – Installment',
};

/** The Payment Channel options 12107_TS06 expects under "Fiuu - eWallet". No
 *  separate SPayLater option: it shows as ShopeePay (dev, 2026-10-19). */
export const FIUU_EWALLET_GROUP = 'Fiuu - eWallet';
export const FIUU_EWALLET_OPTIONS = [
  'GrabPay',
  'GrabPay - PayLater by Grab',
  'ShopeePay',
];
