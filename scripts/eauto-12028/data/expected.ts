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
};

/** Mock-up renderLog() empty state (line 547) — [unconfirmed]. */
export const NO_ACTIVITY = 'No activity yet.';

/** SRD v1.1 REQ-008: 16 states, code → names (SRD short form; mock-up long form, line 271). */
export const STATES: { code: string; names: string[] }[] = [
  { code: '01', names: ['Johor'] },
  { code: '02', names: ['Kedah'] },
  { code: '03', names: ['Kelantan'] },
  { code: '04', names: ['Melaka'] },
  { code: '05', names: ['Negeri Sembilan'] },
  { code: '06', names: ['Pahang'] },
  { code: '07', names: ['Pulau Pinang'] },
  { code: '08', names: ['Perak'] },
  { code: '09', names: ['Perlis'] },
  { code: '10', names: ['Selangor'] },
  { code: '11', names: ['Terengganu'] },
  { code: '12', names: ['Sabah'] },
  { code: '13', names: ['Sarawak'] },
  { code: '14', names: ['W.P. Kuala Lumpur', 'Wilayah Persekutuan Kuala Lumpur'] },
  { code: '15', names: ['W.P. Labuan', 'Wilayah Persekutuan Labuan'] },
  { code: '16', names: ['W.P. Putrajaya', 'Wilayah Persekutuan Putrajaya'] },
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
