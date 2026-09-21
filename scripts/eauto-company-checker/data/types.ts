// ── Shared data shapes for the Company Details Checker ────
// EAINT-12153 sub-function: check whether Company ROC / New Company ROC /
// TIN Number are already used in the UCD Company Listing, one column at a
// time (the listing search is AND-only across populated fields).

export interface CompanyRowInput {
  roc: string;
  newRoc: string;
  tin: string;
}

export type ColumnStatus = 'PRESENT' | 'ABSENT' | 'ERROR';

export interface CompanyRowResult {
  roc: string;
  newRoc: string;
  tin: string;
  rocStatus: ColumnStatus;
  newRocStatus: ColumnStatus;
  tinStatus: ColumnStatus;
  overall: 'PASS' | 'FAIL';
  errorMessage?: string;
}

export function emptyResult(row: CompanyRowInput, msg: string): CompanyRowResult {
  return {
    roc: row.roc, newRoc: row.newRoc, tin: row.tin,
    rocStatus: 'ERROR', newRocStatus: 'ERROR', tinStatus: 'ERROR',
    overall: 'FAIL', errorMessage: msg,
  };
}
