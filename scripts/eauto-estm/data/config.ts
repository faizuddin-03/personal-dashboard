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
  // Faizuddin's sub UCD. Paired with bypassSlot below — read that comment
  // before changing either.
  username: env('ESTM_USERNAME', 'faizuddinsub2'),
  password: env('ESTM_PASSWORD', 'password'),
  idType: env('ESTM_ID_TYPE', '1'), // 1 = MyKad (Malaysian), 2 = MyPR
  // Fixed eVOC email the flow reuses on the buyer + reconfirm fields.
  evocEmail: env('ESTM_EVOC_EMAIL', 'faizuddin@modefair.com'),
  // Identity-bypass slot injected into the URL as /<env>/<slot>/<env>/view/...
  // MUST match the UCD being logged in as: each slot (1-30) is bound to a
  // specific IC, and the login user has to be patched to that same IC or the
  // portal blocks step 3 with "Please use login user's mykad".
  //
  // NO LONGER A DASHBOARD FIELD (removed 2026-08-17) — it doesn't vary per run
  // any more. zzz/22 paired with the `faizuddinsub2` default above runs green
  // on sit2. Kept as an env override because the patch is PER ENVIRONMENT, so
  // sit2 working says nothing about sit3 or uat2, and it depends on a manual
  // UCD setup step outside this code. A new tester or a new environment needs
  // that step, and may need a different slot here.
  bypassSlot: env('ESTM_BYPASS_SLOT', 'zzz/22'),
  // The two Payment-step add-ons. The portal ticks BOTH on load, and both
  // default ON here to match — set ESTM_ELKM=0 / ESTM_EVOC=0 to untick.
  //
  // "0" is the only off value, so an unset var means ON. That matters: the
  // dashboard always sends an explicit "1"/"0", but a hand-run with a partial
  // .env gets the portal's own default rather than a silent opt-out.
  //
  // Cost note, since these are real charges on every throwaway transaction:
  // eLKM adds ~RM200 + RM2.75 processing, eVOC adds RM10 + tax. eLKM also
  // needs the vehicle to have active insurance, and EAINT-11864 TS02/TS03
  // specifically require it unticked — untick it for those.
  elkm: env('ESTM_ELKM', '1') !== '0',
  evoc: env('ESTM_EVOC', '1') !== '0',
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
