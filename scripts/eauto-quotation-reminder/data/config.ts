// EAINT-11864 — run configuration. Everything comes from env, injected by
// app/api/eauto-quotation-reminder/run/route.ts. Nothing is hardcoded that a
// per-run value could supply.

const env = (key: string, fallback = '') => process.env[key]?.trim() || fallback;

export type ScheduleMode = 'now' | 'before-hour' | 'on-hour' | 'at';

export const CONFIG = {
  /** Full base, e.g. https://staging.eauto.my/uat4 — env is a PATH segment. */
  // UAT1: EAINT-11864's insurance code changes are deployed there.
  // Testing any other segment tests the old code.
  baseUrl: env('QR_BASE_URL', 'https://staging.eauto.my/uat1').replace(/\/+$/, ''),

  ucdUser: env('QR_UCD_USER'),
  ucdPass: env('QR_UCD_PASS'),
  subUcdUser: env('QR_SUB_UCD_USER'),
  subUcdPass: env('QR_SUB_UCD_PASS'),

  // The eSTM is created by hand for now; the run is handed the vehicle it was
  // created against. The vehicle number threads the whole scenario — listing
  // search, details header, and the reminder email's body.
  vehicleNo: env('QR_VEHICLE_NO').toUpperCase(),
  ic: env('QR_IC'),

  // ── TS04 — the only case that buys ────────────────────────
  // TS04 creates its own eSTM (same vehicle number, and the IC the eSTM was
  // created against), drops out at step 3, waits, then pays from the Insurance
  // Transaction Listing. Everything below exists for that case only.

  /** Drive scripts/eauto-estm to create the eSTM in-run. "0" = one already
   *  exists for QR_VEHICLE_NO and QR_IC matches its buyer. */
  createEstm: env('QR_CREATE_ESTM', '1') !== '0',
  estmScriptDir: env('QR_ESTM_SCRIPT_DIR'),
  // The eSTM login is the account the eSTM settings are set up under —
  // faizuddinsub2, the user patched to the bypass slot's IC. Any other account
  // is blocked at step 3 with "Please use login user's mykad".
  estmUser: env('QR_ESTM_USERNAME'),
  estmPass: env('QR_ESTM_PASSWORD'),
  estmBypassSlot: env('QR_ESTM_BYPASS_SLOT'),

  // ── TS06 — 69E, drives scripts/eauto-esim (untouched) ─────
  /** Where scripts/eauto-esim lives, if not the usual sibling directory. */
  esimScriptDir: env('QR_ESIM_SCRIPT_DIR'),
  /** eSIM's own login — defaults to admin/admin, same as that suite's own default. */
  esimUser: env('QR_ESIM_USER'),
  esimPass: env('QR_ESIM_PASS'),

  /**
   * The eSTM BUYER email — `#buyerEmail` on the buyer/vehicle step.
   * Dashboard-supplied. It must NOT equal the eVOC email
   * (`faizuddin@modefair.com`, fixed): the portal rejects the form with
   * "Please enter Buyer's Email Address." when the two match.
   * See _reference/html/eauto/estm-step2-buyer-vehicle.html.
   */
  estmBuyerEmail: env('QR_ESTM_BUYER_EMAIL', env('QR_ESTM_EMAIL')),
  /** The eSTM buyer mobile — dashboard-supplied, same usage-limit reason as
   *  the buyer email above. */
  estmMobile: env('QR_ESTM_MOBILE', '0123456789'),
  /** Add-ons cost real money and neither is needed for TS04 — off by default. */
  estmElkm: env('QR_ESTM_ELKM', '0') === '1',
  estmEvoc: env('QR_ESTM_EVOC', '0') === '1',

  /**
   * Seconds to idle at step 3 before going back to the listing to pay.
   *
   * **TS04 as written says 5 minutes (300).** The default here is 10 so the
   * script can be proved end to end without waiting out the drop-off every
   * time — set QR_DROP_OFF_SECONDS=300 for a run that actually tests the case.
   * A 10-second run still exercises every step; it just doesn't leave the
   * quotation sitting long enough to be a realistic drop-off.
   */
  dropOffSeconds: Number(env('QR_DROP_OFF_SECONDS', '10')) || 10,

  scheduleMode: env('QR_SCHEDULE_MODE', 'now') as ScheduleMode,
  /** datetime-local string, only when scheduleMode === 'at'. */
  scheduleAt: env('QR_SCHEDULE_AT'),

  // Mailtrap is read in the signed-in work Chrome profile, resolved by Google
  // account server-side. Absent → the email check reports `blocked`.
  chromeUserDataDir: env('QR_CHROME_USER_DATA_DIR'),
  chromeProfileDir: env('QR_CHROME_PROFILE_DIR', 'Default'),
  mailtrapInbox: env('QR_MAILTRAP_INBOX', 'https://mailtrap.io/sandboxes/2581833/messages'),
} as const;

/** The reminder's sender. `imonitor@auto.my` in the team script is a typo. */
export const SENDER = 'imonitor@eauto.my';

/**
 * The cron runs on the hour, 07:00–23:00 inclusive, in production.
 *
 * For TESTING, the team runs it on a much shorter interval (every 10 minutes —
 * 13:00, 13:10, 13:20, …) so a scenario doesn't take hours to prove out.
 * QR_CRON_INTERVAL_MINUTES switches the grid; QR_CRON_FIRST_HOUR /
 * QR_CRON_LAST_HOUR move the operating window if that ever needs to change
 * too. `[from Faizuddin, 2026-08-18]`
 */
export const CRON = {
  firstHour: Number(env('QR_CRON_FIRST_HOUR', '7')) || 7,
  lastHour: Number(env('QR_CRON_LAST_HOUR', '23')) || 23,
  intervalMinutes: Number(env('QR_CRON_INTERVAL_MINUTES', '60')) || 60,
} as const;

export function assertConfig(): void {
  const missing = (['baseUrl', 'ucdUser', 'ucdPass', 'vehicleNo', 'ic'] as const)
    .filter((k) => !CONFIG[k]);
  if (missing.length) {
    throw new Error(
      `Missing required config: ${missing.join(', ')}. ` +
      'These are injected by the dashboard run route — set them in the UI, not here.',
    );
  }
}
