import * as path from 'path';

// ── Environment & scenario configuration ───────────────────
// Every value is env-switchable; the dashboard's /api/eauto-e2e route injects
// E2E_* variables at runtime. Vehicle number and IC are REQUIRED (never
// hardcoded to a real vehicle) — the run fails early if they're missing.

const env = (k: string, d = '') => (process.env[k]?.trim() ?? d);
const envName = env('E2E_ENV', 'sit3');

export const CONFIG = {
  env: envName,
  baseUrl: `https://staging.eauto.my/${envName}`,
  username: env('E2E_USERNAME', 'Azfar1'),
  password: env('E2E_PASSWORD', '123456'),

  // Required inputs (validated in the spec)
  vehicleNo: env('E2E_VEHICLE_NO'),
  ic: env('E2E_IC'),

  category: env('E2E_CATEGORY', 'individual').toLowerCase(),   // individual | company
  email: env('E2E_EMAIL', 'amirul.azfar@modefair.com'),
  // first | random | zurich-comprehensive | zurich-tpft | takaful-comprehensive | takaful-tpft | chubb
  insurer: env('E2E_INSURER', 'first').toLowerCase(),
  coverage: env('E2E_COVERAGE', 'random').toLowerCase(),       // random | none | all
  sumMode: env('E2E_SUM', 'default').toLowerCase(),            // default | random | max
  bank: env('E2E_BANK', 'random'),                             // "random" or an exact option label

  artifactDir: env('E2E_ARTIFACT_DIR', path.join(__dirname, '..', 'artifacts', 'local')),
  // Safety switch: stop before PAY NOW so no real transaction is created and
  // the vehicle number is not consumed. The dashboard exposes this as a toggle.
  stopBeforePayment: env('E2E_STOP_BEFORE_PAYMENT', '0') === '1',
};

// Hire-purchase banks offered on the payment step (used when bank = "random").
export const CANDIDATE_BANKS = [
  'Maybank Berhad', 'CIMB Bank Berhad', 'Public Bank Berhad',
  'RHB Bank Berhad', 'Hong Leong Bank Berhad', 'AmBank Berhad',
];
