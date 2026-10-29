import * as fs from 'fs';
import { CompanyRowInput, CompanyRowResult } from '../data/types';

// ── JSON I/O with the dashboard ────────────────────────────
// Plain JSON rather than Excel (unlike scripts/eauto-insurance): the input
// here is pasted text, not an existing spreadsheet schema, so there's no
// round-trip format to preserve — the dashboard does its own Excel export
// client-side from the JSON this writes.

export function readInputJson(path: string): CompanyRowInput[] {
  const raw = JSON.parse(fs.readFileSync(path, 'utf-8'));
  const rows = Array.isArray(raw?.rows) ? raw.rows : [];
  return rows.map((r: any) => ({
    roc: String(r.roc ?? ''),
    newRoc: String(r.newRoc ?? ''),
    tin: String(r.tin ?? ''),
  }));
}

export function writeOutputJson(results: CompanyRowResult[], path: string): void {
  fs.writeFileSync(path, JSON.stringify({ results }, null, 2));
}
