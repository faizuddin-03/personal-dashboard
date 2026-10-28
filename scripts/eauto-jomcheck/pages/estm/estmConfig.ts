// ── eSTM settings for 12412_TS12 ───────────────────────────
// The files in this folder are COPIES of the maintained eSTM suite
// (scripts/eauto-estm/pages + utils/session.ts) and of the eDereg MyKad
// emulator client (scripts/eauto-edereg-precheck/utils/mykadEmulator.ts),
// kept step for step. Faizuddin, 2026-10-19: "follow the steps of the
// original eSTM flow other than the fingerprint bypass, because the eSTM flow
// is very specific, and cannot afford to make new assumptions". The only
// change is in BuyerDetailsPage.ts: the two zzz/<slot> URL bypasses are
// replaced by the MyKad emulator, run the way eDereg runs it.
// Values below mirror scripts/eauto-estm/data/config.ts.

const env = (k: string, d = '') => (process.env[k]?.trim() || d);

export interface EstmInputs {
  envSegment: string;
  vehicleRegNo: string;
  emailAddress: string;
  mobileNo: string;
}

export const CONFIG = {
  baseUrlFor: (segment: string) => `https://staging.eauto.my/${segment}`,
  idType: '1', // 1 = MyKad (Malaysian)
  evocEmail: env('JOMCHECK_12412_TS12_EVOC_EMAIL', 'faizuddin@modefair.com'),
  // Faizuddin, 2026-10-19: "tick them by default".
  elkm: true,
  evoc: true,
  // Emulator card — typed on the TS12 row (default IC "030217-14-1005",
  // name "MUHAMMAD FAIZUDDIN BIN BIDI", Faizuddin 2026-10-19).
  mykadNric: env('JOMCHECK_12412_TS12_MYKAD_NRIC'),
  mykadName: env('JOMCHECK_12412_TS12_MYKAD_NAME'),
};

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
