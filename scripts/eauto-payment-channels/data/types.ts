// ── Shared types ───────────────────────────────────────────

export type BusinessType =
  | 'Sdn Bhd / Bhd'
  | 'Sole Proprietorship / Partnership'
  | 'LLP'
  | 'Business Trading (Sabah)'
  | 'Business Trading (Sarawak)';

export type PaymentChannel = 'fpx-b2b' | 'fpx-b2c' | 'card-credit' | 'card-debit' | 'qr';

export type FpxOutcome = 'Success' | 'Failed';
export type CardOutcome = 'Success' | 'Failed';

export interface FpxLegConfig {
  channel: 'fpx-b2b' | 'fpx-b2c';
  bank: string;
  outcome: FpxOutcome;
}

export interface CardLegConfig {
  channel: 'card-credit' | 'card-debit';
  cardType: 'VISA' | 'Mastercard';
  outcome: CardOutcome;
}

/** QR Code (TS7/TS8) — placeholder shape only; the sheet has no real steps yet. */
export interface QrLegConfig {
  channel: 'qr';
  outcome: 'Success' | 'Failed';
}

export type PaymentLegConfig = FpxLegConfig | CardLegConfig | QrLegConfig;

/** One TS's full scenario — Pre-Application leg + Application (continuation) leg. */
export interface ScenarioConfig {
  tsNo: string;
  scenario: string;
  businessType: BusinessType;
  preApplicationLeg: PaymentLegConfig;
  applicationLeg: PaymentLegConfig;
  /** Sheet's own Remarks column, if any — surfaced in logs, not asserted on. */
  remarks?: string;
}

export interface ScenarioResult {
  tsNo: string;
  passed: boolean;
  steps: { label: string; passed: boolean; error?: string }[];
}
