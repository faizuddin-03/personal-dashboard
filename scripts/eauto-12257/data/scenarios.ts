// ── EAINT-12153 scenarios — official TS, QATeam SharePoint v38 (2026-10-21) ──
// Text copy: _reference/tickets/EAINT-12153/EAINT-12153-official-TS-sharepoint-v38-20261021.md
// Every TS is one full onboarding chain: Pre-Application payment (columns D/E),
// Continuation Steps (column F), Application payment (columns G/H).

export type BizType = 'ROC' | 'ROB' | 'LLP' | 'TRADING_SABAH' | 'TRADING_SARAWAK';

/** Radio label on the Pre-Application form (Azila's BUSINESS_TYPE, live 2026-09-22). */
export const BIZ_LABEL: Record<BizType, string> = {
  ROC: 'Sdn Bhd / Bhd',
  ROB: 'Sole Proprietorship / Partnership',
  LLP: 'LLP',
  TRADING_SABAH: 'Business Trading (Sabah)',
  TRADING_SARAWAK: 'Business Trading (Sarawak)',
};

/** `input[name=businessType]` value (capture obs-preonb-form-blank.html). */
export const BIZ_VALUE: Record<BizType, string> = {
  ROC: 'SDN_BHD',
  ROB: 'SOLE_PROPRIETORSHIP_PARTNERSHIP',
  LLP: 'LLP',
  TRADING_SABAH: 'TRADING_SABAH',
  TRADING_SARAWAK: 'TRADING_SARAWAK',
};

/** Company-name tag — Faizuddin's convention "UDIN ONBOARD TESTING <TAG><NNNN>". */
export const BIZ_TAG: Record<BizType, string> = {
  ROC: 'SDN',
  ROB: 'SOLEPROP',
  LLP: 'LLP',
  TRADING_SABAH: 'SABAH',
  TRADING_SARAWAK: 'SARAWAK',
};

export const isTrading = (t: BizType) => t === 'TRADING_SABAH' || t === 'TRADING_SARAWAK';

/** eSIM SSM row type behind each business type. Trading types have no SSM record. */
export const SSM_TYPE: Partial<Record<BizType, 'ROC' | 'ROB' | 'LLP'>> = { ROC: 'ROC', ROB: 'ROB', LLP: 'LLP' };

/** FPX bank tile values (`bank-b2c-N`, capture obs-application-step5-fpx-personal-selected.html). */
export const BANKS = {
  Maybank: 'fpx_mb2u',
  'CIMB Bank': 'fpx_cimbclicks',
  AmBank: 'fpx_amb',
  'Public Bank': 'fpx_pbb',
  RHB: 'fpx_rhb',
  'HongLeong Bank': 'fpx_hlb',
  HSBC: 'fpx_hsbc',
  'Affin Bank': 'fpx_abb',
} as const;
export type BankName = keyof typeof BANKS;

export type Method = 'fpx-b2b' | 'fpx-b2c' | 'card-credit' | 'card-debit' | 'duitnow-qr';

/**
 * success                — pay once, status Approved.
 * failed-then-success    — pay with a failed status, check the error, pay again.
 * pending-then-authorise — B2B: leave Pending Authorisation (99), reopen the
 *                          page, approve as authoriser.
 * failed-then-authorise  — B2B: fail once, then pay and approve as authoriser.
 */
export type Outcome = 'success' | 'failed-then-success' | 'pending-then-authorise' | 'failed-then-authorise'
  // EAINT-12257 DuitNow QR: how the first attempt ends before the retry with Success.
  | 'qr-rejected-then-success' | 'qr-cancel-then-success' | 'qr-close-then-success' | 'qr-timer-then-success';

export interface Leg {
  method: Method;
  bank?: BankName;
  card?: 'VISA' | 'Mastercard';
  outcome: Outcome;
  /** DuitNow QR: the phone the TS names for the scan (shown to the person scanning). */
  phone?: 'Android' | 'iPhone';
}

/**
 * Extra checks of the payment-retry TS suggested on 2026-10-22
 * (12153_TS09–TS12, 12257_TS11–TS13; "Suggestion by Claude - … Payment Retry …
 * (official format).xlsx"; knowledge/flow-payment-channels.md §9):
 *   bo-payment-details  BO Pre-Application details → Payment Details block matches the payment
 *   reopen-after-fail   after the failed attempt, close the browser and reopen the link in a new one
 *   second-session      the Pre-Application link opened in a second browser is refused
 *   bo-listing-status   failed Pre-Application not listed; Registration Fee = Failed, then OK, plus its filter
 */
export type Check = 'bo-payment-details' | 'reopen-after-fail' | 'second-session' | 'bo-listing-status';

export interface Scenario {
  id: string;
  checks?: Check[];
  /** Exact Playwright test title — the dashboard and run route match it. */
  title: string;
  /** Column B, verbatim. */
  sheet: string;
  bizType: BizType;
  preApp: Leg;
  application: Leg;
  /** Column E last line: the Pre-Application listing status the TS expects. */
  preAppListingStatus: 'Approved' | 'New';
  /** BO Application listing "Registration Fee" expected after the failed attempt (default Failed). */
  feeAfterFail?: 'Failed' | 'Pending UCD';
}

const s = (id: string, summary: string) => `${id}: ${summary}`;

export const SCENARIOS: Scenario[] = [
  {
    id: '12153_TS01',
    title: s('12153_TS01', 'FPX (B2B) Maybank then CIMB Bank, Success — Sdn Bhd'),
    sheet: 'Payment Method : FPX (B2B) / Bank : Maybank, CIMB Bank / Payment Status : Success',
    bizType: 'ROC',
    preApp: { method: 'fpx-b2b', bank: 'Maybank', outcome: 'success' },
    application: { method: 'fpx-b2b', bank: 'CIMB Bank', outcome: 'success' },
    preAppListingStatus: 'Approved',
  },
  {
    id: '12153_TS02',
    title: s('12153_TS02', 'FPX (B2B) AmBank then Public Bank, Failed then redo — Sole Prop'),
    sheet: 'Payment Method : FPX (B2B) / Bank : AmBank, Public Bank / Payment Status : Failed',
    bizType: 'ROB',
    preApp: { method: 'fpx-b2b', bank: 'AmBank', outcome: 'failed-then-success' },
    application: { method: 'fpx-b2b', bank: 'Public Bank', outcome: 'failed-then-success' },
    preAppListingStatus: 'Approved',
  },
  {
    id: '12153_TS03',
    title: s('12153_TS03', 'FPX (B2B) AmBank then Public Bank, Pending Approval revisit then Approved — Sole Prop'),
    sheet: 'Payment Method : FPX (B2B) / Bank : AmBank, Public Bank / Payment Status : Pending Approval (revisit) > Approved',
    bizType: 'ROB',
    preApp: { method: 'fpx-b2b', bank: 'AmBank', outcome: 'pending-then-authorise' },
    application: { method: 'fpx-b2b', bank: 'Public Bank', outcome: 'pending-then-authorise' },
    preAppListingStatus: 'New',
  },
  {
    id: '12153_TS04',
    title: s('12153_TS04', 'FPX (B2B) HSBC then Affin Bank, Failed then Success and authorised — LLP'),
    sheet: 'Payment Method : FPX (B2B) / Bank : HSBC, Affin Bank / Payment Status : Failed > Success',
    bizType: 'LLP',
    preApp: { method: 'fpx-b2b', bank: 'HSBC', outcome: 'failed-then-authorise' },
    application: { method: 'fpx-b2b', bank: 'Affin Bank', outcome: 'failed-then-authorise' },
    preAppListingStatus: 'New',
  },
  {
    id: '12153_TS05',
    title: s('12153_TS05', 'FPX (B2C) RHB then HongLeong Bank, Success — LLP'),
    sheet: 'Payment Method : FPX (B2C) / Bank : RHB, HongLeong Bank / Payment Status : Success',
    bizType: 'LLP',
    preApp: { method: 'fpx-b2c', bank: 'RHB', outcome: 'success' },
    application: { method: 'fpx-b2c', bank: 'HongLeong Bank', outcome: 'success' },
    preAppListingStatus: 'Approved',
  },
  {
    id: '12153_TS06',
    title: s('12153_TS06', 'FPX (B2C) HSBC then Affin Bank, Failed then redo — Business Trading (Sabah)'),
    sheet: 'Payment Method : FPX (B2C) / Bank : HSBC, Affin Bank / Payment Status : Failed',
    bizType: 'TRADING_SABAH',
    preApp: { method: 'fpx-b2c', bank: 'HSBC', outcome: 'failed-then-success' },
    application: { method: 'fpx-b2c', bank: 'Affin Bank', outcome: 'failed-then-success' },
    preAppListingStatus: 'Approved',
  },
  {
    id: '12153_TS07',
    title: s('12153_TS07', 'Card (Credit) VISA, Success — Business Trading (Sarawak)'),
    sheet: 'Payment Method : Card (Credit) / Card Type : VISA / Payment Status : Success',
    bizType: 'TRADING_SARAWAK',
    preApp: { method: 'card-credit', card: 'VISA', outcome: 'success' },
    application: { method: 'card-credit', card: 'VISA', outcome: 'success' },
    preAppListingStatus: 'Approved',
  },
  {
    id: '12153_TS08',
    title: s('12153_TS08', 'Card (Debit) Mastercard, Failed then Success — Sdn Bhd'),
    sheet: 'Payment Method : Card (Debit) / Card Type : Mastercard / Payment Status : Failed > Success',
    bizType: 'ROC',
    preApp: { method: 'card-debit', card: 'Mastercard', outcome: 'failed-then-success' },
    application: { method: 'card-debit', card: 'Mastercard', outcome: 'failed-then-success' },
    preAppListingStatus: 'Approved',
  },
  // ── Payment retry, suggested 2026-10-22 (not yet in the official TS) ──
  {
    id: '12153_TS09',
    title: s('12153_TS09', 'FPX (B2C) Maybank then CIMB Bank, Failed then redo, BO Payment Details — Sdn Bhd'),
    sheet: 'Payment Method : FPX (B2C) / Bank : Maybank, CIMB Bank / Payment Status : Failed > Success / Check : BO Payment Details after redo payment',
    bizType: 'ROC',
    preApp: { method: 'fpx-b2c', bank: 'Maybank', outcome: 'failed-then-success' },
    application: { method: 'fpx-b2c', bank: 'CIMB Bank', outcome: 'failed-then-success' },
    preAppListingStatus: 'Approved',
    checks: ['bo-payment-details'],
  },
  {
    id: '12153_TS10',
    title: s('12153_TS10', 'FPX (B2C) Public Bank then AmBank, Failed, close the browser and reopen the link — Sole Prop'),
    sheet: 'Payment Method : FPX (B2C) / Bank : Public Bank, AmBank / Payment Status : Failed > Success / Check : Close the browser and reopen the link',
    bizType: 'ROB',
    preApp: { method: 'fpx-b2c', bank: 'Public Bank', outcome: 'failed-then-success' },
    application: { method: 'fpx-b2c', bank: 'AmBank', outcome: 'failed-then-success' },
    preAppListingStatus: 'Approved',
    checks: ['reopen-after-fail'],
  },
  {
    id: '12153_TS11',
    title: s('12153_TS11', 'FPX (B2C) RHB then HongLeong Bank, Success, link opened in a second session — Business Trading (Sabah)'),
    sheet: 'Payment Method : FPX (B2C) / Bank : RHB, HongLeong Bank / Payment Status : Success / Check : Pre-Application link opened in a second session',
    bizType: 'TRADING_SABAH',
    preApp: { method: 'fpx-b2c', bank: 'RHB', outcome: 'success' },
    application: { method: 'fpx-b2c', bank: 'HongLeong Bank', outcome: 'success' },
    preAppListingStatus: 'Approved',
    checks: ['second-session'],
  },
  {
    id: '12153_TS12',
    title: s('12153_TS12', 'FPX (B2C) HSBC then Affin Bank, Failed then redo, BO listing payment status — Business Trading (Sarawak)'),
    sheet: 'Payment Method : FPX (B2C) / Bank : HSBC, Affin Bank / Payment Status : Failed > Success / Check : BO listing payment status',
    bizType: 'TRADING_SARAWAK',
    preApp: { method: 'fpx-b2c', bank: 'HSBC', outcome: 'failed-then-success' },
    application: { method: 'fpx-b2c', bank: 'Affin Bank', outcome: 'failed-then-success' },
    preAppListingStatus: 'Approved',
    checks: ['bo-listing-status'],
  },
];

/** TS text for "Unsuccessful Payment" (E2 / H2, TS2/4/6/8); the page's own copy
 *  (`#payment-error-message`, capture obs-application-step5-*.html) matches. */
export const UNSUCCESSFUL_PAYMENT = {
  heading: 'Unsuccessful Payment',
  body: 'Something went wrong and your payment didn’t go through. Please choose a payment method and retry.',
};

// ── EAINT-12257 — official TS, QATeam SharePoint v19 (2026-10-21) ─────────────
// Text copy: _reference/tickets/EAINT-12257/EAINT-12257-official-TS-sharepoint-v19-20261021.md
// TS1–TS5 DuitNow QR (the phone sets the outcome: a person scans);
// TS6–TS9 regression = 12153_TS05–TS8; TS10 = FPX (B2B) (was TS11 until v23, 2026-10-22);
// TS11–TS13 = payment retry (added to the official sheet v23).
const qr = (outcome: Outcome, phone: Leg['phone']): Leg => ({ method: 'duitnow-qr', outcome, phone });

export const SCENARIOS_12257: Scenario[] = [
  {
    id: '12257_TS01', title: s('12257_TS01', 'DuitNow QR, Approved payment — Sdn Bhd'),
    sheet: 'Happy Flow - Approved Payment', bizType: 'ROC',
    preApp: qr('success', 'Android'), application: qr('success', 'iPhone'), preAppListingStatus: 'Approved',
  },
  {
    id: '12257_TS02', title: s('12257_TS02', 'DuitNow QR, Rejected then retry — Sdn Bhd'),
    sheet: 'Negative Flow - Reject Payment & Retry Payment', bizType: 'ROC',
    preApp: qr('qr-rejected-then-success', 'iPhone'), application: qr('qr-rejected-then-success', 'Android'), preAppListingStatus: 'Approved',
  },
  {
    id: '12257_TS03', title: s('12257_TS03', 'DuitNow QR, Cancel Transaction then retry — Sdn Bhd'),
    sheet: 'Cancel transaction', bizType: 'ROC',
    preApp: qr('qr-cancel-then-success', 'Android'), application: qr('qr-cancel-then-success', 'Android'), preAppListingStatus: 'Approved',
  },
  {
    id: '12257_TS04', title: s('12257_TS04', 'DuitNow QR, close the QR Code window then retry — Sdn Bhd'),
    sheet: 'Close QR Code Window', bizType: 'ROC',
    preApp: qr('qr-close-then-success', 'Android'), application: qr('qr-close-then-success', 'Android'), preAppListingStatus: 'Approved',
  },
  {
    id: '12257_TS05', title: s('12257_TS05', 'DuitNow QR, timer expiry then retry — Sdn Bhd'),
    sheet: 'Timer Expiry', bizType: 'ROC',
    preApp: qr('qr-timer-then-success', 'Android'), application: qr('qr-timer-then-success', 'Android'), preAppListingStatus: 'Approved',
    // Timer expiry leaves the Application at Pending UCD, not Failed (Faizuddin, same as TS13, 2026-10-27).
    feeAfterFail: 'Pending UCD',
  },
  // Regression — same legs as 12153_TS05–TS8.
  ...SCENARIOS.filter(x => ['12153_TS05', '12153_TS06', '12153_TS07', '12153_TS08'].includes(x.id)).map((x, i) => {
    const id = `12257_TS${String(i + 6).padStart(2, '0')}`;
    return { ...x, id, title: s(id, `Regression — ${x.title.slice(x.title.indexOf(':') + 2)}`) };
  }),
  {
    id: '12257_TS10', title: s('12257_TS10', 'Regression — FPX (B2B) Maybank then CIMB Bank, Success — Business Trading (Sarawak)'),
    sheet: 'Payment Method : FPX (B2B) / Bank : Maybank, CIMB Bank / Payment Status : Success', bizType: 'TRADING_SARAWAK',
    preApp: { method: 'fpx-b2b', bank: 'Maybank', outcome: 'success' },
    application: { method: 'fpx-b2b', bank: 'CIMB Bank', outcome: 'success' },
    preAppListingStatus: 'Approved',
  },
  // ── Payment retry, suggested 2026-10-22 (not yet in the official TS) ──
  {
    id: '12257_TS11', title: s('12257_TS11', 'DuitNow QR, Rejected then retry, BO Payment Details — Sole Prop'),
    sheet: 'Reject Payment & Retry Payment - BO Payment Details', bizType: 'ROB',
    preApp: qr('qr-rejected-then-success', 'Android'), application: qr('qr-rejected-then-success', 'iPhone'), preAppListingStatus: 'Approved',
    checks: ['bo-payment-details'],
  },
  {
    id: '12257_TS12', title: s('12257_TS12', 'DuitNow QR, Cancel Transaction, close the browser and reopen the link — LLP'),
    sheet: 'Cancel transaction - Close the browser and reopen the link', bizType: 'LLP',
    preApp: qr('qr-cancel-then-success', 'Android'), application: qr('qr-cancel-then-success', 'iPhone'), preAppListingStatus: 'Approved',
    checks: ['reopen-after-fail'],
  },
  {
    id: '12257_TS13', title: s('12257_TS13', 'DuitNow QR, timer expiry, BO listing payment status — Business Trading (Sabah)'),
    sheet: 'Timer Expiry - BO listing payment status', bizType: 'TRADING_SABAH',
    preApp: qr('qr-timer-then-success', 'Android'), application: qr('qr-timer-then-success', 'iPhone'), preAppListingStatus: 'Approved',
    checks: ['bo-listing-status'],
    // Timer expiry leaves the Application at Pending UCD, not Failed (Faizuddin, confirmed with BA, 2026-10-27).
    feeAfterFail: 'Pending UCD',
  },
];

/** DuitNow QR timer — SRD EAINT-12257 v1.0 REQ-003: "Scan QR in mm:ss" from 03:00. */
export const QR_VALIDITY_MS = 3 * 60_000;
