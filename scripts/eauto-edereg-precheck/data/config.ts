// ── eDereg Pre-Checking environment & input configuration ──
// The dashboard's /api/eauto-edereg-precheck route injects DPC_* variables at
// runtime. Vehicle reg no and JPJ receipt email are required inputs; env
// segment and login credentials have confirmed defaults.

const env = (k: string, d = '') => (process.env[k]?.trim() ?? d);

export interface PrecheckInputs {
  envSegment: string;
  vehicleRegNo: string;
  jpjReceiptEmail: string;
}

// Deregistration step-2 Vehicle Details needs more fields than the
// pre-checking enquiry does. None of these are ticket-critical test data —
// the ticket is the compulsory PRE-CHECKING gate, not these values — so
// defaults are fixed happy-path values, overridable via env for a re-run
// that needs different ones. Engine/Chassis default to a per-run-unique
// value (timestamp-suffixed) since a real Deregistration transaction is
// created against a specific vehicle+engine+chassis combination.
export interface DeregVehicleInputs {
  contactNo: string;
  ownerEmail: string;
  vehicleEngineNo: string;
  vehicleChassisNo: string;
  otherVehicleMake: string;
  otherVehicleModel: string;
  vehicleYear: string;
}

export function getDeregVehicleInputs(): DeregVehicleInputs {
  const suffix = env('DPC_VEHICLE_ENGINE_SUFFIX') || String(Date.now()).slice(-8);
  return {
    contactNo: env('DPC_CONTACT_NO', '0123456789'),
    ownerEmail: env('DPC_OWNER_EMAIL', 'faizuddin@modefair.com'),
    vehicleEngineNo: env('DPC_VEHICLE_ENGINE_NO', `ENG${suffix}`),
    vehicleChassisNo: env('DPC_VEHICLE_CHASSIS_NO', `CHS${suffix}`),
    // "OTHER" + free-text avoids depending on the vehicleMake-dependent
    // vehicleModel option list, which has not been captured (see
    // EAINT-9306-dereg-step2-vehicle-details.html).
    otherVehicleMake: env('DPC_VEHICLE_MAKE', 'Proton'),
    otherVehicleModel: env('DPC_VEHICLE_MODEL', 'Automation Test'),
    vehicleYear: env('DPC_VEHICLE_YEAR', '2020'),
  };
}

export const CONFIG = {
  // Confirmed by Faizuddin, 2026-08-21 — this ticket's automation runs on uat1.
  envSegment: env('DPC_ENV_SEGMENT', 'uat1'),
  // Default AATF test account, confirmed by Faizuddin 2026-08-21. Overridable
  // per run, same pattern as eSTM's faizuddinsub2 default.
  username: env('DPC_USERNAME', 'faizuddinAATF'),
  password: env('DPC_PASSWORD', 'password'),
  // Sub-user AATF test account (User B in the "AATF Multiple Users" test
  // plan block, MU_TS1 onward) — SAME company as the main account above,
  // confirmed by Faizuddin 2026-08-26. Logs in via a SEPARATE browser
  // context, same pattern as boUsername/boPassword below — see
  // pages/LoginPage.ts's `username`/`password` override params.
  subUsername: env('DPC_SUB_USERNAME', 'faizAATFsub2'),
  subPassword: env('DPC_SUB_PASSWORD', 'password'),
  // MyKad emulator identity — NRIC + name injected directly into the
  // INSERTCARD payload (utils/mykadEmulator.ts), added 2026-08-26 so this
  // suite can be handed to colleagues without editing code: everyone types
  // their own AATF account's identity here instead. NOT a "profile name"
  // lookup (tried and reverted the same day — a fresh Playwright browser
  // context never shares localStorage with a human's own browser, so a
  // saved control-panel profile is invisible to automation regardless of
  // name). Default matches the confirmed main AATF test account.
  mykadNric: env('DPC_MYKAD_NRIC', '030217141005'),
  mykadName: env('DPC_MYKAD_NAME', 'MUHAMMAD FAIZUDDIN BIN BIDI'),
  // Sub-user's own identity (User B, "Multiple Users" cases) — confirmed
  // by Faizuddin 2026-08-26.
  mykadNricSub: env('DPC_MYKAD_NRIC_SUB', '030117-14-1005'),
  mykadNameSub: env('DPC_MYKAD_NAME_SUB', 'MUHAMMAD FAIZUDDIN SUB2'),
  // User C — a DIFFERENT company from the main account (MU_TS2 onward,
  // "AATF Multiple Users" different-company block), confirmed by Faizuddin
  // 2026-08-26. Name is genuinely "23 , 24,25" per Faizuddin checking the
  // DB directly — not a placeholder, that's the real test data.
  subUsername2: env('DPC_SUB2_USERNAME', 'AzfarAATF'),
  subPassword2: env('DPC_SUB2_PASSWORD', 'abcd1234'),
  mykadNricSub2: env('DPC_MYKAD_NRIC_SUB2', '020406081081'),
  mykadNameSub2: env('DPC_MYKAD_NAME_SUB2', '23 , 24,25'),
  // BO/Hub Admin test account, confirmed by Faizuddin 2026-08-24 — used ONLY
  // for the JPJ XML Log checks (a Back-Office page, separate login from the
  // AATF account above). Same shared eAuto login page, different account +
  // post-login redirect (see pages/BoLoginPage.ts).
  boUsername: env('DPC_BO_USERNAME', 'faizuddinBO1'),
  boPassword: env('DPC_BO_PASSWORD', 'password'),
  // Skip the interactive pause at the end (always set by the dashboard runner).
  skipPause: env('DPC_SKIP_PAUSE', '') !== '',
  // How long to hold on a screen that's DISPLAYING details (a result popup,
  // a Details/transaction-listing page, a JPJ XML Log search result) before
  // moving on — long enough to actually read on the recorded video
  // afterward, per Faizuddin 2026-08-24. Deliberately NOT applied to
  // form-filling steps, only to screens whose whole point is showing
  // information back to the tester.
  detailsPauseMs: Number(env('DPC_DETAILS_PAUSE_MS', '4000')) || 4000,
  baseUrlFor: (segment: string) => `https://staging.eauto.my/${segment}`,
};

/** Read + validate the required per-run inputs. Throws listing what's missing. */
export function getRequiredInputs(): PrecheckInputs {
  const inputs: PrecheckInputs = {
    envSegment: CONFIG.envSegment,
    vehicleRegNo: env('DPC_VEHICLE_REG_NO'),
    jpjReceiptEmail: env('DPC_JPJ_RECEIPT_EMAIL'),
  };
  const missing = (['vehicleRegNo', 'jpjReceiptEmail'] as const).filter((k) => inputs[k].length === 0);
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(', ')}. Provide them via the dashboard eDereg Pre-Checking form.`);
  }
  return inputs;
}

export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
