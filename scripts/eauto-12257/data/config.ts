// ── Environment & runtime configuration — EAINT-12153 ─────────────────────
// Every value arrives from the /eauto/12257 dashboard as an E12257_* env var.
// Flow, URLs and handles: knowledge/flow-ucd-onboarding.md § "Live end-to-end
// walk-through, staging, 2026-10-21" and knowledge/flow-payment-channels.md.

const env = (k: string, fallback = '') => (process.env[k] ?? '').trim() || fallback;

const host = env('E12257_HOST', 'https://staging.eauto.my').replace(/\/+$/, '');
// BackOffice instance. Faizuddin, 2026-10-21: staging = /eauto from now on
// (the /obs onboarding pages are instance-less). The 2026-10-21 live run used /uat4.
const boInstance = env('E12257_BO_INSTANCE', 'eauto').replace(/^\/+|\/+$/g, '');

export const CONFIG = {
  host,
  boInstance,
  /** UCD/BO login page — the only eAuto page ever loaded by URL. "Apply eAuto" lives here. */
  loginUrl: `${host}/${boInstance}/public/login/`,
  /** BO logout endpoint. The Logout link raises a native confirm() that freezes
   *  automation; the link's own handler navigates here after OK. */
  logoutUrl: `${host}/${boInstance}/user/logout.do`,
  boHomeUrl: `${host}/${boInstance}/home/`,
  esimUrl: env('E12257_ESIM_URL', 'https://172.30.202.114:9089/esim').replace(/\/+$/, ''),

  // Fees on staging, read from the live pages 2026-10-21.
  preAppFee: env('E12257_FEE_PREAPP', '108.00'),
  registrationFee: env('E12257_FEE_REGISTRATION', '1500.00'),

  // How long a person has to tick the reCAPTCHA.
  gateMs: Number(env('E12257_GATE_MINUTES', '5')) * 60_000,
  // Fiuu popup → redirect back → success / failure page.
  paymentOutcomeTimeout: 180_000,

  // Timeouts (ms) used by BasePage helpers.
  navigationTimeout: 90_000,
  waitAfterPageLoad: 500,
  pollingInterval: 300,
  maxWaitForResult: 30_000,

  fixtures: {
    dir: `${__dirname}/../fixtures`,
    tradingLicence: `${__dirname}/../fixtures/trading-licence.pdf`,
    pdf: `${__dirname}/../fixtures/mva-receipt.pdf`,
  },

  /** eSIM rows copied as the template for a new company's SSM submission row.
   *  ROC #3 = Azila's CH2 "AZ WINS AUTO SDN. BHD." ("AZILA - DO NOT CHANGE") —
   *  read only, proven 2026-10-21 (row #173 built from it reached SSM Status OK).
   *  ROB / LLP: blank = the first row whose remark mentions Azila. [unconfirmed] */
  esimDonor: {
    ROC: env('E12257_ESIM_DONOR_ROC', '3'),
    ROB: env('E12257_ESIM_DONOR_ROB', ''),
    LLP: env('E12257_ESIM_DONOR_LLP', ''),
  },
};

export const USERS = {
  /** BO assignee — sets UCD Group, Submit For Approval, Verified (TS continuation steps 4, 7). */
  assignee: { username: env('E12257_BO_ASSIGNEE_USER', 'mfared'), password: env('E12257_BO_ASSIGNEE_PASS') },
  /** BO approver — approves the Application (TS continuation step 5). */
  approver: { username: env('E12257_BO_APPROVER_USER', 'jasons'), password: env('E12257_BO_APPROVER_PASS') },
  esim: { username: env('E12257_ESIM_USER', 'admin'), password: env('E12257_ESIM_PASS') },
  /** Fiuu bank simulator — typed ONLY when the popup host is bank-simulator.fiuu.com. */
  fiuu: { username: env('E12257_FIUU_USER', 'Gaara'), password: env('E12257_FIUU_PASS') },
};

export const ADMIN = {
  name: env('E12257_ADMIN_NAME', 'MUHAMMAD FAIZUDDIN BIN BIDI'),
  mobile: env('E12257_ADMIN_MOBILE', '0137428615'),
  emailDomain: env('E12257_EMAIL_DOMAIN', 'testingz.com'),
  address: env('E12257_SHOWROOM_ADDRESS', 'LOT 12, JALAN UJIAN QA 3, TAMAN AUTOMASI'),
  postcode: env('E12257_SHOWROOM_POSTCODE', '50450'),
  state: env('E12257_SHOWROOM_STATE', 'WILAYAH PERSEKUTUAN KUALA LUMPUR'),
  city: env('E12257_SHOWROOM_CITY', 'KUALA LUMPUR'),
};

export const CARDS = {
  /** Works on the Fiuu sandbox (12107, 2026-10-20). The TS's own 4111 1111 1111 1111 is rejected there (P10). */
  credit: { number: env('E12257_CARD_CREDIT_NUMBER', '4456530000001096'), expiry: env('E12257_CARD_CREDIT_EXPIRY', '12/26'), cvv: env('E12257_CARD_CREDIT_CVV', '111') },
  debit: { number: env('E12257_CARD_DEBIT_NUMBER', '5200000000001096'), expiry: env('E12257_CARD_DEBIT_EXPIRY', '12/26'), cvv: env('E12257_CARD_DEBIT_CVV', '111') },
  /** Failed card attempt: the valid Mastercard 5200 0000 0000 1096 (Faizuddin, 2026-10-26 — not the TS Notes 5555 5555 5555 4440), failed with a wrong OTP on 3D Secure (confirmed 2026-10-26). */
  invalid: { number: env('E12257_CARD_INVALID_NUMBER', '5200000000001096'), expiry: env('E12257_CARD_INVALID_EXPIRY', '12/26'), cvv: env('E12257_CARD_INVALID_CVV', '111') },
};

/**
 * The company for THIS run — typed on the /eauto/12257 dashboard per TS, or
 * picked from the Company Details Checker list. Never invented here: a blank
 * required value stops the run before anything is created.
 *   SSM types: old BRN (with check letter, e.g. KT0307773-P), new BRN (12
 *   digits), TIN — these must be a real matching set (checkSSM.do + LHDN).
 *   Trading types: licence number; TIN optional on the Pre-Application.
 */
export const COMPANY = {
  name: env('E12257_COMPANY_NAME'),
  oldBrn: env('E12257_OLD_BRN').toUpperCase(),
  newBrn: env('E12257_NEW_BRN').replace(/\D/g, ''),
  tin: env('E12257_TIN').toUpperCase(),
  licenceNo: env('E12257_LICENCE_NO').toUpperCase(),
  directorName: env('E12257_DIRECTOR_NAME').toUpperCase(),
  /** 12 digits; eSIM ROC Page 3 stores it dashed, ROB/LLP plain. */
  directorIc: env('E12257_DIRECTOR_IC').replace(/\D/g, ''),
  /** Seed the eSIM SSM rows before the Pre-Application (off = rows already exist). */
  seedEsim: env('E12257_SEED_ESIM', '1') === '1',
  /** Made-up company details (fake LLP): no TIN is typed anywhere (Faizuddin, 2026-10-23). */
  fake: env('E12257_FAKE_COMPANY', '0') === '1',
  /** Fake LLP (required) or Business Trading with "Include TIN" (optional): the TIN typed on the Application, from a spent Excel row. */
  appTin: env('E12257_APP_TIN').toUpperCase(),
  /** Spare TINs (same rule as appTin) to swap to when eAuto refuses the TIN as already used — utils/tinPool.ts. */
  tinPool: env('E12257_TIN_POOL').toUpperCase().split(',').map(x => x.trim()).filter(Boolean),
  /**
   * Next free companies of the same type from the dashboard's company Excel
   * (JSON [{ oldBrn, newBrn, tin }]). Used in order when eSIM already holds
   * another tester's rows for the company above.
   */
  alternates: ((): { oldBrn: string; newBrn: string; tin: string }[] => {
    try { return JSON.parse(env('E12257_COMPANY_ALTERNATES', '[]')); } catch { return []; }
  })(),
};
