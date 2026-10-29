// ── Environment & runtime configuration ───────────────────
// Every value is env-switchable; fallbacks keep local runs working.
// The dashboard's /api/insurance/check route injects EAUTO_* and
// INSURANCE_CONCURRENCY when it spawns this project.

const baseUrl = process.env.EAUTO_BASE_URL || 'https://staging.eauto.my/sit3';

export const CONFIG = {
  baseUrl,
  stagingLoginUrl: `${baseUrl}/public/login`,
  enquiryPath: '/view/insurance/insurance-quote-enquiry/',

  // Defaults used when the input Excel doesn't specify these per vehicle
  icNumber: process.env.EAUTO_DEFAULT_IC || '030217141005',
  postcode: process.env.EAUTO_DEFAULT_POSTCODE || '31150',
  vehicleCategory: 'individual', // lowercase: 'individual' or 'company'

  // File contract with the dashboard API route — do not move these
  inputFile: './input-vehicles.xlsx',
  outputFile: './output-results.xlsx',

  // Timeouts
  navigationTimeout: 60000,
  waitAfterPageLoad: 3000,
  waitAfterClick: 5000,
  pollingInterval: 2000,
  maxWaitForResult: 60000, // max wait for "Working..." to finish

  // Parallel browser contexts; override with INSURANCE_CONCURRENCY
  defaultConcurrency: 4,
};
