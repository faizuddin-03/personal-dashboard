// ── Environment & runtime configuration ───────────────────
// Every value is env-switchable; fallbacks keep local runs working.
// The dashboard's /api/eauto/company-details-checker/run route injects
// EAUTO_* and COMPANY_CHECKER_CONCURRENCY when it spawns this project.

const baseUrl = process.env.EAUTO_BASE_URL || 'https://staging.eauto.my/sit3';

export const CONFIG = {
  baseUrl,
  stagingLoginUrl: `${baseUrl}/public/login`,
  companyListingPath: '/view/account/company',

  // File contract with the dashboard API route — do not move these
  inputFile: './input-rows.json',
  outputFile: './output-results.json',

  // Timeouts
  navigationTimeout: 60000,
  waitAfterPageLoad: 2000,
  waitAfterSearch: 1500,
  pollingInterval: 500,
  maxWaitForResult: 20000,

  // Parallel worker PAGES sharing the one login; override with
  // COMPANY_CHECKER_CONCURRENCY
  defaultConcurrency: 4,
};
