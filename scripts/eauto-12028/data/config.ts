// ── Environment & runtime configuration — EAINT-12028 ─────────────────────
// Every value that names an environment, a login or a test record arrives from
// the /eauto/12028 runner page as an E12028_* env var (run route
// app/api/eauto-12028/run/route.ts). Nothing here falls back to a host, a
// login or a month the script picked: a missing value stops the TS with the
// field name ("Inputs typed on the dashboard, never invented").
//
// Module flow and the mock-up handles: knowledge/flow-association-payment-listing.md.
// The module is NOT captured live yet — every Summary / Details selector comes
// from the 31.07 mock-up (_reference/tickets/Studying/EAINT-12028/
// association-payment-listing-mockup_20260731.html) and is [unconfirmed].

const raw = (k: string) => (process.env[k] ?? '').trim();

/** A value the runner page must send; throws naming the field when it is blank. */
export function required(k: string, field: string): string {
  const v = raw(k);
  if (!v) throw new Error(`"${field}" is blank — type it on the /eauto/12028 runner page (${k}).`);
  return v;
}

export const optional = (k: string): string => raw(k);

/** "https://host" — the eAuto host chosen in Run configuration. */
const host = () => required('E12028_HOST', 'Environment').replace(/\/+$/, '');
/** BO instance path segment ("eauto" on staging since 2026-10-21). */
const instance = () => required('E12028_INSTANCE', 'Environment').replace(/^\/+|\/+$/g, '');

export const CONFIG = {
  get host() { return host(); },
  get instance() { return instance(); },
  /** The only eAuto page ever loaded by URL (plus BO home as the first landing page, scaffold skill §7). */
  get loginUrl() { return `${host()}/${instance()}/public/login/`; },
  /** BO home — loaded only when the menu is not already on screen. */
  get boHomeUrl() { return `${host()}/${instance()}/home/`; },
  /** Logout endpoint behind the header "Logout" link (bo-home-mfared-uat4.html line 1128: "/uat4/user/logout.do"). */
  get logoutUrl() { return `${host()}/${instance()}/user/logout.do`; },

  /** The TS steps search Year 2026 (12028_TS09 "select Year **2026**"; SRD v1.1 REQ-002 "available years start from 2026"). */
  year: 2026,

  // Timeouts (ms) — BasePage (copied from scripts/eauto-jomcheck) reads the last four.
  navigationTimeout: 60_000,
  actionTimeout: 30_000,
  waitAfterPageLoad: 1_000,
  pollingInterval: 500,
  maxWaitForResult: 20_000,
  /** How long a download button may take to hand over its PDF. */
  downloadTimeout: 60_000,
  /** A popup that should NOT open (e.g. the signature pad on a second approval) is given this long to show. */
  absentWait: 5_000,
};

/** Month name → 1..12, as the Summary lists them (mock-up `months` array). */
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Reads a month typed on the TS row (E12028_MONTH / E12028_MONTH2) as its name. */
export function monthInput(k: string, field: string): string {
  const v = required(k, field);
  const byName = MONTHS.find(m => m.toLowerCase() === v.toLowerCase());
  const byNo = /^\d{1,2}$/.test(v) ? MONTHS[Number(v) - 1] : undefined;
  const month = byName ?? byNo;
  if (!month) throw new Error(`"${field}" = "${v}" is not a month name.`);
  return month;
}

/** A whole number typed on the TS row. */
export function countInput(k: string, field: string): number {
  const v = required(k, field).replace(/,/g, '');
  if (!/^\d+$/.test(v)) throw new Error(`"${field}" = "${v}" is not a whole number.`);
  return Number(v);
}
