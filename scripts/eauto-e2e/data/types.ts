// ── Shared data shapes for the UCD Insurance E2E ───────────

/** A single field-consistency / math verification result. */
export interface Check {
  name: string;
  pass: boolean;
  detail: string;
}

/** One boxed target on an annotated screenshot. */
export interface ShotBox {
  sel?: string;
  text?: string;
  label: string;
}

/** Per-page captured data ledger: page name → { field → value }. */
export type Snapshot = Record<string, Record<string, string>>;

/** Common field regex patterns, reused across steps + details.
 *  E-cert format and whether a "10% discount" line appears both vary by
 *  insurer, so these are intentionally insurer-agnostic. */
export const FIELD_RX = {
  refNo:   /Reference No[.:\s]*([A-Z]{1,3}\d{5,})/i,
  eCert:   /E-?certificate No\.?(?:\s*\/\s*Policy No)?[.:\s]*([A-Z0-9]{4,}(?:-[A-Z0-9]{3,})?)/i,
  sum:     /(?:Total )?Sum (?:Covered|Insured)[:\s]*RM\s?([\d,]+\.\d{2})/i,
  basic:   /Basic Contribution[:\s]*RM\s?([\d,]+\.\d{2})/i,
  afterNcd:/Contribution After NCD[:\s]*RM\s?([\d,]+\.\d{2})/i,
  gross:   /Gross Contribution[:\s]*RM\s?([\d,]+\.\d{2})/i,
  tax:     /Service Tax[:\s]*RM\s?([\d,]+\.\d{2})/i,
  stamp:   /Stamp Duty[:\s]*RM\s?([\d,]+\.\d{2})/i,
  totalContrib: /Total Contribution\s*RM\s?([\d,]+\.\d{2})/i,
  // Primary: the "after 10% agent discount" line (not every insurer shows one).
  totalNett:    /Total Nett Contribution After Discount\s*RM\s?([\d,]+\.\d{2})/i,
  // Fallback: the amount next to PAY NOW — always present.
  priceIncludeTax: /Price include Service Tax\s*RM\s?([\d,]+\.\d{2})/i,
} as const;
