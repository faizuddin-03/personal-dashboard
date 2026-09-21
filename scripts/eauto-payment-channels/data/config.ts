// ── Environment & runtime configuration ───────────────────
// Every value is env-switchable; fallbacks keep local runs working.
//
// TODO once real HTML is captured: confirm onboardingEntryPath and
// companyListingPath-equivalent BO paths below — currently guesses based on
// the test sheet's wording ("Open eAuto Login page and click 'Apply eAuto'")
// and the sibling scripts/eauto-company-checker's BO login convention.

const baseUrl = process.env.EAUTO_BASE_URL || 'https://staging.eauto.my/sit3';

export const CONFIG = {
  baseUrl,

  // TODO: confirm exact path once the login/landing page HTML is captured.
  publicLoginUrl: `${baseUrl}/public/login`,
  // TODO: confirm the BO login path — reusing the company-checker convention
  // as a starting guess.
  boLoginUrl: `${baseUrl}/public/login`,

  // Timeouts — same defaults as the other eauto-* scripts in this repo.
  navigationTimeout: 60000,
  waitAfterPageLoad: 2000,
  waitAfterSearch: 1500,
  pollingInterval: 500,
  maxWaitForResult: 20000,

  // Where downloaded invoice/e-invoice files land for the verification step.
  downloadDir: './downloads',
};
