// Which company triples have already been spent, across every ticket.
//
// WHY THIS IS NOT TICKET-SCOPED: the constraint lives in eAuto, not in Jira. A
// real company can be onboarded exactly ONCE — the second pre-application
// carrying the same BRN is refused. So a row consumed by EAINT-12153 is dead for
// EAINT-12257 too, and a ledger stored per ticket would happily hand the same
// company to both and waste a run discovering it.
//
// Keyed on the three values themselves (`roc|newRoc|tin`) for the same reason:
// the identity is what eAuto de-duplicates on, so that is what has to be
// remembered. Any page that renders the checker reads this and shows the same
// verdict. Per Faizuddin, 2026-09-03.

export interface UsageEntry {
  key: string;
  roc: string;
  newRoc: string;
  tin: string;
  /** Which ticket spent it, e.g. "EAINT-12257". */
  ticket: string;
  /** Which scenario, when known, e.g. "12257_TS01". */
  scenario?: string;
  companyName?: string;
  /** The pre-application reference the run minted, when it got that far. */
  reference?: string;
  /** true = the run definitely onboarded it; false = marked by hand. */
  confirmed: boolean;
  usedAt: string;
}

const STORAGE_KEY = "eauto_ucd_company_usage";

export const usageKey = (r: { roc: string; newRoc: string; tin: string }) =>
  `${r.roc.trim()}|${r.newRoc.trim()}|${r.tin.trim()}`;

export type UsageLedger = Record<string, UsageEntry>;

export function loadUsage(): UsageLedger {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed as UsageLedger : {};
  } catch { return {}; }
}

function write(ledger: UsageLedger) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ledger)); } catch { /* storage full */ }
}

/**
 * Record a triple as spent. Returns the updated ledger so a caller can drop it
 * straight into React state.
 *
 * A CONFIRMED entry is never downgraded by a later unconfirmed one — a run that
 * actually minted a reference is stronger evidence than a hand-marked guess, and
 * re-marking by hand afterwards must not erase that.
 */
export function markUsed(
  row: { roc: string; newRoc: string; tin: string },
  info: { ticket: string; scenario?: string; companyName?: string; reference?: string; confirmed?: boolean },
): UsageLedger {
  const ledger = loadUsage();
  const key = usageKey(row);
  const existing = ledger[key];
  if (existing?.confirmed && !info.confirmed) return ledger;

  ledger[key] = {
    key,
    roc: row.roc,
    newRoc: row.newRoc,
    tin: row.tin,
    ticket: info.ticket,
    scenario: info.scenario ?? existing?.scenario,
    companyName: info.companyName ?? existing?.companyName,
    reference: info.reference ?? existing?.reference,
    confirmed: info.confirmed ?? false,
    usedAt: new Date().toISOString(),
  };
  write(ledger);
  return ledger;
}

/** Release a row — for a run that turned out never to have reached submission. */
export function unmarkUsed(row: { roc: string; newRoc: string; tin: string }): UsageLedger {
  const ledger = loadUsage();
  delete ledger[usageKey(row)];
  write(ledger);
  return ledger;
}

export function clearUsage(): UsageLedger {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  return {};
}

/** "3 Sep" — short enough for a table cell. */
export function shortDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short" });
  } catch { return ""; }
}
