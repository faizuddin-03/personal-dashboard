import { ScenarioConfig } from './types';

// ── TS3-TS8 scenario data ──────────────────────────────────
// Transcribed directly from the test sheet (_reference/tickets/EAINT-12153/
// EAINT-12153 - ... 1.9.2026.csv), pasted and confirmed by Faizuddin
// 2026-09-02. TS1/TS2 (FPX B2B) are deliberately excluded — the sheet flags
// both "Need to change scenario with the B2B handling" (REQ-004-007, SRD
// v1.1) and they're being reworked separately.
//
// TS7/TS8 (QR Code) have NO steps in the sheet at all — the sheet marks
// them "TBC with BA". They're listed here for completeness (and so the
// dashboard picker/Playwright projects have somewhere to point), but their
// spec files are `test.skip` until real steps exist.

export const SCENARIOS: Record<string, ScenarioConfig> = {
  ts3: {
    tsNo: '12153_TS3',
    scenario: 'Payment Method: FPX (B2C), Bank: RHB -> HongLeong Bank, Payment Status: Success',
    businessType: 'LLP',
    preApplicationLeg: { channel: 'fpx-b2c', bank: 'RHB', outcome: 'Success' },
    applicationLeg: { channel: 'fpx-b2c', bank: 'HongLeong Bank', outcome: 'Success' },
  },
  ts4: {
    tsNo: '12153_TS4',
    scenario: 'Payment Method: FPX (B2C), Bank: HSBC -> Affin Bank, Payment Status: Failed (then redo to Success)',
    businessType: 'Business Trading (Sabah)',
    preApplicationLeg: { channel: 'fpx-b2c', bank: 'HSBC', outcome: 'Failed' },
    applicationLeg: { channel: 'fpx-b2c', bank: 'Affin Bank', outcome: 'Failed' },
  },
  ts5: {
    tsNo: '12153_TS5',
    scenario: 'Payment Method: Card (Credit), Card Type: VISA, Payment Status: Success',
    businessType: 'Business Trading (Sarawak)',
    preApplicationLeg: { channel: 'card-credit', cardType: 'VISA', outcome: 'Success' },
    applicationLeg: { channel: 'card-credit', cardType: 'VISA', outcome: 'Success' },
  },
  ts6: {
    tsNo: '12153_TS6',
    scenario: 'Payment Method: Card (Debit), Card Type: Mastercard, Payment Status: Failed -> Success',
    businessType: 'Sdn Bhd / Bhd',
    preApplicationLeg: { channel: 'card-debit', cardType: 'Mastercard', outcome: 'Failed' },
    applicationLeg: { channel: 'card-debit', cardType: 'Mastercard', outcome: 'Failed' },
    remarks: 'To confirm the exact error message on decline (sheet TODO as of 2026-09-01)',
  },
  ts7: {
    tsNo: '12153_TS7',
    scenario: 'Payment Method: QR Code, Payment Status: Success',
    businessType: 'Sdn Bhd / Bhd', // placeholder — sheet has no Initial Steps for TS7/8
    preApplicationLeg: { channel: 'qr', outcome: 'Success' },
    applicationLeg: { channel: 'qr', outcome: 'Success' },
    remarks: 'TBC with BA — no steps drafted in the sheet. Do not implement until steps exist.',
  },
  ts8: {
    tsNo: '12153_TS8',
    scenario: 'Payment Method: QR Code, Payment Status: Failed',
    businessType: 'Sdn Bhd / Bhd', // placeholder — sheet has no Initial Steps for TS7/8
    preApplicationLeg: { channel: 'qr', outcome: 'Failed' },
    applicationLeg: { channel: 'qr', outcome: 'Failed' },
    remarks: 'No steps at all in the sheet — blocked pending BA input.',
  },
};
