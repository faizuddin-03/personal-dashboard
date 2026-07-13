// ── eSTM environment & input configuration ─────────────────
// The dashboard's /api/eauto-estm route injects ESTM_* variables at runtime.
// Vehicle reg no, email, and mobile are required inputs; login credentials
// and ID type have staging fallbacks.

const env = (k: string, d = '') => (process.env[k]?.trim() ?? d);

export interface EstmInputs {
  envSegment: string;
  vehicleRegNo: string;
  emailAddress: string;
  mobileNo: string;
}

export const CONFIG = {
  username: env('ESTM_USERNAME', 'nsub2abc'),
  password: env('ESTM_PASSWORD', 'abcd1234'),
  idType: env('ESTM_ID_TYPE', '1'), // 1 = MyKad (Malaysian), 2 = MyPR
  // Fixed eVOC email the flow reuses on the buyer + reconfirm fields.
  evocEmail: env('ESTM_EVOC_EMAIL', 'nicholas.lim@modefair.com'),
  // Skip the interactive pause at the end (always set by the dashboard runner).
  skipPause: env('ESTM_SKIP_PAUSE', '') !== '',
  baseUrlFor: (segment: string) => `https://staging.eauto.my/${segment}`,
};

/** Read + validate the required per-run inputs. Throws listing what's missing. */
export function getRequiredInputs(): EstmInputs {
  const inputs: EstmInputs = {
    envSegment:   env('ESTM_ENV_SEGMENT'),
    vehicleRegNo: env('ESTM_VEHICLE_REG_NO'),
    emailAddress: env('ESTM_EMAIL_ADDRESS'),
    mobileNo:     env('ESTM_MOBILE_NO'),
  };
  const missing = Object.entries(inputs).filter(([, v]) => v.length === 0).map(([k]) => k);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}. Provide them via the dashboard eSTM form.`);
  }
  if (CONFIG.idType !== '1' && CONFIG.idType !== '2') {
    throw new Error('Invalid ESTM_ID_TYPE. Use 1 for MyKad or 2 for MyPR.');
  }
  return inputs;
}

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
