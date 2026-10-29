/**
 * email-contracts.js — the BASELINE email contracts for the eAuto SI + BDP modules.
 * ------------------------------------------------------------------------------
 * Single source of truth for "what email does the system send, to whom, with what
 * subject and body". Consumed by:
 *   - automation/lib/mailtrap.js  (assertEmail / assertNoEmail check every field)
 *   - tracker/si-e2e.json         (each scenario's `email` block references a type)
 *   - the app + knowledge digest  (09-email-verification-and-contracts.md)
 *
 * Both modules send the SAME "Software Installation Appointment" emails — a BDP
 * purchase's bundled install fires the identical Confirmation / Reschedule email as
 * a standalone SI booking. So the contract keys are module-agnostic.
 *
 * BASELINE ANCHORS: SRD V1.0 §2.3.2.1 #7 (Confirmation) / #8 (Reschedule);
 * requirements.json category "Email"; C1 (sender = support@eauto.my, resolved).
 *
 * OBSERVED (live Mailtrap, sandbox 2581833) 15.07.2026 — message 5594318644:
 *   - Reschedule subject is DATE+TIME, not "- [Company]" (baseline text corrected).
 *   - The subject's separator em-dash is emitted as a literal "?" (mojibake) because
 *     the Subject header is NOT RFC 2047-encoded → SUBJECT_ENCODING_DEFECT below.
 *   - Reschedule body greets "Dear Customer," and closes "contact us at
 *     support@eauto.my" (NOT "contact our Customer Service team at 03-27798899").
 *     These are logged as deviations to verify against the baseline, not asserted.
 */

const SENDER = 'support@eauto.my';
const CS_PHONE = '03-27798899';           // baseline Customer Service number (V1.0 §2.3.2.1#7)
const AUTO_FOOTER_RE = /automatically generated email/i;

// The known Subject-header encoding defect: a non-ASCII dash in an un-encoded
// Subject header degrades to "?". Detect "Rescheduled ? <date>" / "Confirmed ? ".
// (Raise as a QA-Issue — see knowledge/09; do NOT treat "?" as the expected copy.)
const SUBJECT_ENCODING_DEFECT = {
  id: 'email-subject-mojibake',
  re: /(Rescheduled|Confirmed)\s+\?\s+\S/i,
  note: 'Subject separator em-dash rendered as "?" — the Subject header is not RFC 2047 (=?UTF-8?…?=) encoded, so the non-ASCII dash becomes a replacement char. Observed 15.07 on the reschedule email (Mailtrap 5594318644). Expected: a real dash "-"/"—", matching the "Confirmed - [Company]" convention. Raise / verify.',
};

const CONTRACTS = {
  // ── Appointment Confirmation ───────────────────────────────────────────────
  'appointment-confirmation': {
    key: 'appointment-confirmation',
    label: 'Appointment Confirmation email',
    from: SENDER,
    recipient: 'the transacting UCD user / company (lands in the Mailtrap sandbox on staging)',
    // subject: "eAuto: Your Software Installation Appointment is Confirmed - [UCD Company Name]"
    subjectHuman: 'eAuto: Your Software Installation Appointment is Confirmed - [UCD Company Name]',
    subjectRe: /eAuto:\s*Your Software Installation Appointment is Confirmed\s*[-–—?]\s*.+/i,
    // Body invariants to assert PRESENT (case-insensitive substring / regex).
    bodyMustContain: [
      /Software Installation Appointment/i,   // subject/context echoed
    ],
    // Body items that SHOULD be present per the baseline but have shown deviations
    // live — verify, don't hard-assert (recorded as info/knownIssue).
    bodyShouldContain: [
      { what: 'details table columns (#, Date, Time, Units/Unit)', re: /(date)/i },
      { what: `Customer Service line "${CS_PHONE}"`, re: new RegExp(CS_PHONE.replace(/[-]/g, '\\-')) },
      { what: 'auto-generated-email footer', re: AUTO_FOOTER_RE },
      { what: 'pre-appointment reminders (IC/passport, vehicle, arrive early)', re: /(identification|passport|vehicle|before your appointment)/i },
    ],
    // Values interpolated from the booking under test (asserted to appear in the body).
    dynamicFields: ['companyName', 'appointmentDate', 'timeSlot', 'units'],
    baselineRef: 'SRD V1.0 §2.3.2.1 #7 · requirements.json Email · C1',
    trigger: 'Fires ONCE when an installation appointment is CONFIRMED (Confirm Appointment → Request Submitted), for both SI bookings and the BDP bundled install.',
    checkSubjectEncoding: true,
  },

  // ── Reschedule ─────────────────────────────────────────────────────────────
  'appointment-reschedule': {
    key: 'appointment-reschedule',
    label: 'Reschedule email',
    from: SENDER,
    recipient: 'the appointment owner (UCD customer) — fires on UCD-, CSE/BO-, and same-day-reschedule paths',
    // LATEST/observed subject = date + time (NOT the company name the old digest claimed).
    subjectHuman: 'eAuto: Your Software Installation Appointment has been Rescheduled — [New Date] ([Day]), [Time Slot]',
    subjectRe: /eAuto:\s*Your Software Installation Appointment has been Rescheduled\s*[-–—?]\s*\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}.*\d{1,2}:\d{2}\s*[ap]m/i,
    bodyMustContain: [
      /rescheduled/i,
    ],
    bodyShouldContain: [
      { what: 'updated details table (#, Date, Time, Units)', re: /(date)/i },
      { what: 'auto-generated-email footer', re: AUTO_FOOTER_RE },
      { what: 'pre-appointment reminders', re: /(identification|passport|vehicle|before your appointment)/i },
      // Deviation flag: baseline says CS phone; live reschedule shows "contact us at support@eauto.my".
      { what: `contact line (baseline: CS "${CS_PHONE}"; live shows "contact us at ${SENDER}")`, re: new RegExp(`(${CS_PHONE.replace(/[-]/g, '\\-')}|contact us at ${SENDER})`, 'i'), deviation: true },
    ],
    // PARTIAL RESCHEDULE (decision T, BA-confirmed 22.07): on a multi-appointment txn where only SOME
    // appointments are rescheduled, the details table must list ONLY the rescheduled appointment(s), NOT
    // all appointments in the txn (same rule as the on-screen reschedule Summary page). Row-count is
    // data-dependent so it's asserted per-scenario (SI-E2E-88 checks 2-of-4), not by a static regex here.
    partialReschedule: 'details table shows ONLY the rescheduled appointment(s), not all txn appointments (decision T, 22.07; SI-E2E-88)',
    dynamicFields: ['appointmentDate', 'timeSlot', 'units'],
    baselineRef: 'SRD V1.0 §2.3.2.1 #8 · requirements.json Email · BDP-E2E-61 · partial-display 22.07 (decision T)',
    trigger: 'Fires when an appointment is rescheduled: UCD self-service reschedule, CSE/BO reappoint (incl. after Mark-Failed), and the same-day reschedule special case.',
    checkSubjectEncoding: true,
    // The old "- [UCD Company Name]" reschedule subject in the digest was WRONG —
    // corrected 15.07 to the live date+time form (see requirements.json + SI-E2E-33).
    correction: 'Subject corrected 15.07 from "…Rescheduled - [UCD Company Name]" to "…Rescheduled — [New Date], [Time]" (live + BDP-E2E-61).',
  },
};

// The "expect" vocabulary a scenario's email block may use, and what each means.
const LEGEND = {
  confirmation: 'Expects ONE Appointment Confirmation email — verify every field in Mailtrap.',
  reschedule: 'Expects a Reschedule email — verify every field in Mailtrap.',
  both: 'Expects a Confirmation AND a Reschedule email over the scenario — verify both.',
  contract: 'This scenario IS the email-contract test — verify Confirmation, Reschedule, AND the negative (no email on failure).',
  none: 'Expects NO email — assert in Mailtrap that nothing new arrived for the recipient during the run window.',
};

// Map an "expect" value to the contract keys it should verify present.
function typesFor(expect) {
  switch (expect) {
    case 'confirmation': return ['appointment-confirmation'];
    case 'reschedule': return ['appointment-reschedule'];
    case 'both': return ['appointment-confirmation', 'appointment-reschedule'];
    case 'contract': return ['appointment-confirmation', 'appointment-reschedule'];
    default: return [];
  }
}

module.exports = { SENDER, CS_PHONE, CONTRACTS, LEGEND, SUBJECT_ENCODING_DEFECT, typesFor };
