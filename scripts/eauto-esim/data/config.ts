// eAuto Simulator (eSIM) — run configuration.
//
// The base URL is FIXED. eSIM is a single internal instance, not a per-env
// deployment like staging.eauto.my/<env>, so there is deliberately no picker
// and no override: every run goes to the same simulator.

const env = (key: string, fallback = '') => process.env[key]?.trim() || fallback;

export const ESIM_BASE = 'https://172.30.202.114:9089/esim';

/** Entities this suite can edit. `path` is the list page under ESIM_BASE. */
export const ENTITIES = {
  'estm-enquiry': { path: '/estm-enquiry-resp', label: 'eSTM Enquiry' },
  'estm-submission': { path: '/estm-submission-resp', label: 'eSTM Submission' },
  'dereg-enquiry': { path: '/dereg-enquiry-resp', label: 'Dereg Enquiry' },
  'dereg-submission': { path: '/dereg-submission-resp', label: 'Dereg Submission' },
  'dereg-precheck-enquiry': { path: '/dereg-precheck-enquiry-resp', label: 'Dereg Precheck' },
  'rhb-transfer': { path: '/rhb-transfer-resp', label: 'RHB Transfer' },
  'jomcheck-enquiry': { path: '/jomcheck-enquiry-resp', label: 'JomCheck Enquiry' },
  'jomcheck-report': { path: '/jomcheck-report-resp', label: 'JomCheck Report' },
} as const;

export type EntityKey = keyof typeof ENTITIES;

export const CONFIG = {
  username: env('ESIM_USER', 'admin'),
  password: env('ESIM_PASS', 'admin'),

  /** Which simulator table to work on. */
  entity: env('ESIM_ENTITY', 'estm-enquiry') as EntityKey,

  /** `read` just reports the record's current values; `write` applies changes. */
  mode: env('ESIM_MODE', 'write') as 'read' | 'write',

  /** The "Vn Start With" value to find. Matched exactly, case-insensitively. */
  prefix: env('ESIM_PREFIX').toUpperCase(),

  /**
   * Changes to apply, as {"<field label>": "<new value>"}. Only labels present
   * here are touched — an omitted field keeps whatever the record already has.
   * Labels are resolved against the form's <label for=...>, so this suite needs
   * no hardcoded input ids and works for entities whose form HTML we have not
   * captured.
   */
  changes: parseChanges(env('ESIM_CHANGES', '{}')),

  /**
   * `jomcheck-report` only: claim records to ADD, as an array of
   * {"<claim field label>": "value"} objects, one per claim — e.g.
   * `[{"Mileage":"9999","Severity":"MEDIUM"}]`. Each object becomes one
   * "+ Add Claim Record" click, its fields resolved by the claim-record's
   * own (for-less) labels. Added 2026-10-03 for EAINT-12339's TS05-TS19,
   * which need EXACT claim values (mileage/parts/claim-code boundaries) no
   * amount of purchasing against the real API can reliably produce.
   */
  claimRecords: parseClaimRecords(env('ESIM_CLAIM_RECORDS', '[]')),

  /** `jomcheck-report` only: when true, every EXISTING claim record is
   *  removed (via "Remove Record") before any `claimRecords` above are
   *  added — use this alone (no `claimRecords`) to restore a prefix back to
   *  "no claim history" after a TS that set specific claims finishes. */
  clearClaimRecords: env('ESIM_CLEAR_CLAIM_RECORDS') === '1',
} as const;

function parseChanges(raw: string): Record<string, string> {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    // Drop blanks defensively — blank means "leave alone", never "clear it".
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, v]) => typeof v === 'string' && v.trim() !== '')
        .map(([k, v]) => [k, String(v)]),
    );
  } catch {
    throw new Error(`ESIM_CHANGES is not valid JSON: ${raw.slice(0, 200)}`);
  }
}

function parseClaimRecords(raw: string): Record<string, string>[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.map(rec => {
      if (!rec || typeof rec !== 'object') return {};
      // Blank/missing fields stay blank in the new claim row — unlike
      // top-level `changes`, there is no "existing value" to preserve on a
      // brand-new row, so an explicit blank is kept (e.g. TS11's "Type of
      // Claim left blank").
      return Object.fromEntries(
        Object.entries(rec as Record<string, unknown>).map(([k, v]) => [k, v == null ? '' : String(v)]),
      );
    });
  } catch {
    throw new Error(`ESIM_CLAIM_RECORDS is not valid JSON: ${raw.slice(0, 200)}`);
  }
}

export function assertConfig(): void {
  if (!CONFIG.prefix) throw new Error('ESIM_PREFIX is required — give the vehicle prefix to edit.');
  if (!ENTITIES[CONFIG.entity]) {
    throw new Error(`Unknown ESIM_ENTITY "${CONFIG.entity}". Known: ${Object.keys(ENTITIES).join(', ')}`);
  }
  // Reading needs no changes — that is the whole point of read mode.
  const hasClaimWork = CONFIG.clearClaimRecords || CONFIG.claimRecords.length > 0;
  if (CONFIG.mode === 'write' && !Object.keys(CONFIG.changes).length && !hasClaimWork) {
    throw new Error('No changes were given — every field was left blank, so there is nothing to apply.');
  }
}
