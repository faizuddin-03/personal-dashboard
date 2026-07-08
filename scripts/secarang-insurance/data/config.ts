// ── Shared environment configuration ───────────────────────
// Env-switchable with staging fallbacks. The dashboard's /api/secarang/*
// routes inject SECARANG_* and REGRESSION_* variables at runtime.

export const CONFIG = {
  baseUrl:      process.env.SECARANG_BASE_URL      || 'https://staging.secarang.com/preprod',
  sitePassword: process.env.SECARANG_SITE_PASSWORD || 'eAuTo<2025#',
  postcode:     process.env.SECARANG_POSTCODE      || '55000',
  defaultIc:    process.env.SECARANG_IC            || '',

  // File contract with the dashboard API routes — do not move these
  inputFile:  './input-vehicles.xlsx',
  outputFile: './output-results.xlsx',

  // Checker timeouts
  navigationTimeout: 90000,
  waitAfterPageLoad:   300,  // small settle after a detected page advance
  waitAfterClick:      250,  // settle after a UI click
  quotationTimeout:  15000,  // max wait (ms) for a page transition / cards
  pollingInterval:     150,  // fast polling so we proceed the instant content appears

  // Feature toggles (set "0" to disable via env)
  checkVehicleDetails: process.env.SECARANG_CHECK_VEHICLE_DETAILS !== '0',

  defaultConcurrency: 1,
};
