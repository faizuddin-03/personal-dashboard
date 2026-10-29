// Persistence for the Company Details Checker (EAINT-12153 sub-function).
// Browser localStorage — survives navigating away and back, and survives a
// PC restart/terminal relaunch too, since it lives in the browser profile on
// disk rather than in the dev server's memory. Mirrors lib/insurance.ts.

export type ColumnStatus = "PRESENT" | "ABSENT" | "ERROR";

export interface CompanyRowResult {
  roc: string; newRoc: string; tin: string;
  rocStatus: ColumnStatus; newRocStatus: ColumnStatus; tinStatus: ColumnStatus;
  overall: "PASS" | "FAIL";
  errorMessage?: string;
}

const STORAGE_KEY = "company_details_checker_results";

interface SavedCompanyCheckerState {
  results:  CompanyRowResult[];
  rowInput: string;
  username: string;
  baseUrl:  string;
  runLog:   string;
  savedAt:  string;
}

export function loadCompanyCheckerSaved(): SavedCompanyCheckerState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveCompanyCheckerResults(data: SavedCompanyCheckerState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch { /* storage full/unavailable */ }
}

export function clearCompanyCheckerSaved() {
  localStorage.removeItem(STORAGE_KEY);
}

// ── The checker → test-script bridge (EAINT-12257) ─────────────
// A row the checker cleared is exactly what the SSM business types need: a
// REAL company that staging has not already onboarded. Nothing generated can
// satisfy /obs/preOnb/checkSSM.do, so these three values are the only way into
// the Sdn Bhd / Sole Prop / LLP paths. Picking one here hands it to the 12257
// runner instead of retyping it.
//
// Company ROC → Old BRN · New Company ROC → New BRN · TIN Number → TIN.

export interface PickedCompany {
  roc: string;
  newRoc: string;
  tin: string;
  /** The checker's source export carries no name column, so this is typed in. */
  companyName?: string;
  pickedAt: string;
}

const PICKED_KEY = "eaint12257_picked_company";

export function loadPickedCompany(): PickedCompany | null {
  try {
    const raw = localStorage.getItem(PICKED_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function savePickedCompany(picked: PickedCompany) {
  try { localStorage.setItem(PICKED_KEY, JSON.stringify(picked)); } catch { /* storage full/unavailable */ }
}

export function clearPickedCompany() {
  localStorage.removeItem(PICKED_KEY);
}
