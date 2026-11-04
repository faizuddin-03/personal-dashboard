// ── Expected values, each quoted from its source ─────────────────────────
// SRD: _reference/tickets/Studying/EAINT-12028/EAINT-12028_SRD_v1.1_20260731-text.md
// Mock-up: association-payment-listing-mockup_20260731.html (same folder) — [unconfirmed] wording.

/** SRD v1.1 §2.2.6 REQ-016 Example 2 (verbatim). */
export const PENDING_NOTE = 'Payment Request documents will be available for download once the Drafter, Reviewer and Approver have all approved.';

/** Mock-up renderWorkflow() notes (lines 474-487) — [unconfirmed]: the SRD only says "disabled with a waiting note" (REQ-009). */
export const WAIT_NOTE = {
  forDrafter: 'Waiting for the Drafter to approve first.',
  forReviewer: 'Waiting for the Reviewer to approve first.',
  drafterDone: 'Drafter has already approved this month. Waiting for the Reviewer.',
  reviewerDone: 'Reviewer has already approved. Waiting for the Approver.',
  fullyApproved: 'Fully approved.', // mock-up line 488 (Approver on a fully approved month)
};

/** Note under the workflow bar when it is not this login's turn —
 *  _reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-not-turn.html line 132. */
export const NOT_YOUR_TURN_NOTE = 'Awaiting the next role in the approval sequence.';

/** Validation messages, from the live Details capture's script
 *  (_reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-not-turn.html).
 *  The Reject popup has NO remarks message: #rmk-submit stays disabled until remarks are typed (lines 328, 386-387).
 *  A past or today date cannot be picked: the field's min is tomorrow (lines 395-399). Forced in, the page
 *  still posts it and the SERVER refuses: "payment date must be a future date (got 2026-11-04)."
 *  [verified: Claude run uat1 2026-11-04, 12028_TS37-part2-dates]. TS37's own wording differs for both
 *  messages ("Please select a payment date.", "Payment date must be a future date.") — see FAILS-AND-BLOCKS F12. */
export const MSG = {
  signature: 'Please provide your signature.', // DETAILS line 421
  noDate: 'Please pick a future payment date.', // DETAILS line 403 (Confirm with no date)
};

/** Audit Log empty state — DETAILS line 306. */
export const NO_ACTIVITY = 'No workflow actions recorded yet.';

/** SRD v1.1 REQ-008: 16 states, code → names (SRD short form; mock-up long form, line 271). */
/** label = the live cell text, from _reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-not-turn.html lines 156-276 (upper case + code). */
export const STATES: { code: string; label: string; names: string[] }[] = [
  { code: '01', label: 'JOHOR (01)', names: ['Johor'] },
  { code: '02', label: 'KEDAH (02)', names: ['Kedah'] },
  { code: '03', label: 'KELANTAN (03)', names: ['Kelantan'] },
  { code: '04', label: 'MELAKA (04)', names: ['Melaka'] },
  { code: '05', label: 'NEGERI SEMBILAN (05)', names: ['Negeri Sembilan'] },
  { code: '06', label: 'PAHANG (06)', names: ['Pahang'] },
  { code: '07', label: 'PULAU PINANG (07)', names: ['Pulau Pinang'] },
  { code: '08', label: 'PERAK (08)', names: ['Perak'] },
  { code: '09', label: 'PERLIS (09)', names: ['Perlis'] },
  { code: '10', label: 'SELANGOR (10)', names: ['Selangor'] },
  { code: '11', label: 'TERENGGANU (11)', names: ['Terengganu'] },
  { code: '12', label: 'SABAH (12)', names: ['Sabah'] },
  { code: '13', label: 'SARAWAK (13)', names: ['Sarawak'] },
  { code: '14', label: 'WILAYAH PERSEKUTUAN KUALA LUMPUR (14)', names: ['W.P. Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur'] },
  { code: '15', label: 'WILAYAH PERSEKUTUAN LABUAN (15)', names: ['W.P. Labuan', 'Wilayah Persekutuan Labuan'] },
  { code: '16', label: 'WILAYAH PERSEKUTUAN PUTRAJAYA (16)', names: ['W.P. Putrajaya', 'Wilayah Persekutuan Putrajaya'] },
];

/** SRD v1.1 REQ-008 "FMC (Car) = RM1.00", "MMSDA (Motorcycle) = RM2.00". */
export const RATE = { car: 1, motorcycle: 2 };

/** SRD v1.1 §2.2.10 (FMC) and §2.2.11 (MMSDA) fixed rows, verbatim. */
export const PDF_FIXED = {
  header: ['eAuto Sdn. Bhd. 200401038456 (676967-T)', 'Level 15, Sunway Tower', '86, Jalan Ampang', '50450 Kuala Lumpur'],
  title: 'ONLINE PAYMENT REQUISITION',
  to: 'Finance @ eAuto Sdn Bhd',
  attn: 'Marie Ann',
  adds: ['Level 15, Sunway Tower', '86, Jalan Ampang', '50450 Kuala Lumpur'],
  FMC: {
    reason: 'eAUTO PAYMENT TO FMCCAM',
    payTo: {
      'Account Holder Name': 'FED OF MOTOR & CREDIT COMPANIES ASSO MSI (PPM-001-14-11041979)',
      'Bank Name': 'Alliance Bank Malaysia Berhad',
      'Bank Account No.': '1404-6001-0016-661',
      'Person in charge': 'Lai Wooi Ping',
      'Contact Number': '03-9200 6880 / 012-4801052',
      'Email Address': 'cpanet@gmail.com',
    } as Record<string, string>,
  },
  MMSDA: {
    reason: 'eAUTO PAYMENT TO MMSDA',
    payTo: {
      'Account Holder Name': 'MALAYSIA MOTORCYCLE & SCOOTER DEALERS ASSOCIATION (MMSDA)',
      'Bank Name': 'PBB',
      'Bank Account No.': '308-208-810-3',
      'Person in charge': 'Wee Hong (President)',
      'Contact Number': '603 9285 6666',
      'Email Address': 'mmsda.kl@gmail.com',
    } as Record<string, string>,
  },
};

/** Wrong values a broken build plausibly prints (assertion-plan wrongOutcomes). */
export const PDF_WRONG = {
  headerTypo: 'eAuto Sdn .Bhd.', // mock-up line 409
  attnSample: 'Justin Ng', // sample xlsx R8
  fmcHolderSample: 'FED OF MOTOR & CREDIT COMPANIES ASSO MSIA', // sample xlsx R20
  malayMonths: ['MAC', 'MEI', 'OGO', 'OKT', 'DIS'], // sample xlsx MMSDA R14 "MEI 2026"
};
