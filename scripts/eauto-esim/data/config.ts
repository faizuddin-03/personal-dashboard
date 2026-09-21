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

export function assertConfig(): void {
  if (!CONFIG.prefix) throw new Error('ESIM_PREFIX is required — give the vehicle prefix to edit.');
  if (!ENTITIES[CONFIG.entity]) {
    throw new Error(`Unknown ESIM_ENTITY "${CONFIG.entity}". Known: ${Object.keys(ENTITIES).join(', ')}`);
  }
  // Reading needs no changes — that is the whole point of read mode.
  if (CONFIG.mode === 'write' && !Object.keys(CONFIG.changes).length) {
    throw new Error('No changes were given — every field was left blank, so there is nothing to apply.');
  }
}
