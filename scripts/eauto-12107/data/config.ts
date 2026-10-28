// ── Environment & runtime configuration ───────────────────
// Every value is env-switchable; fallbacks keep a bare local run working.
// EAINT-12107 (Secarang ShopeePay/GrabPay) + EAINT-12327 (CIBO Payment Mode
// format, manual) — release S34.X 20/21 Oct 2026.
//
// Secarang staging URL: base path /ia — Faizuddin, 2026-10-16: "script uses
// /ia"; matches the /ia/car-insurance links in the captured payment page.

// The dashboard default is the full entry link
// (https://staging.secarang.com/ia/car-insurance, Faizuddin 2026-10-19), so a
// trailing "/car-insurance" (and slash) is dropped here — carInsurancePath
// below adds it back.
const baseUrl = (process.env.SECARANG_BASE_URL || 'https://staging.secarang.com/ia')
  .trim().replace(/\/+$/, '').replace(/\/car-insurance$/, '');

export const CONFIG = {
  baseUrl,
  // Staging site-password gate (not a user login — Secarang has none).
  sitePassword: process.env.SECARANG_SITE_PASSWORD || '',
  // Car insurance entry page — the ONLY page ever goto()'d directly; every
  // later screen is reached by clicking through the real flow.
  carInsurancePath: '/car-insurance',

  // Timeouts (ms)
  navigationTimeout: 90_000,
  waitAfterPageLoad: 500,
  pollingInterval: 200,
  maxWaitForResult: 30_000,
  // Quotation cards on staging can take a while to come back from insurers.
  quotationTimeout: 90_000,
  // Fiuu sandbox popup → redirect back to Secarang → success/failed page.
  paymentOutcomeTimeout: 120_000,
};
