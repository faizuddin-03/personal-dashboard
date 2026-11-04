/**
 * What each eAuto email is supposed to say — one place, so a copy change is a
 * one-file edit rather than a hunt through specs.
 *
 * The shape is taken from `Mailtrap-Email-Checker/lib/email-contracts.js`
 * (Azfar). That design is the good part of the tool and is kept as-is: a
 * contract is DATA, and the assertion code knows nothing about any particular
 * email.
 *
 * ── Two kinds of body check, and the difference matters ─────────────────────
 * `mustContain` FAILS the test. `shouldContain` reports and does not fail.
 * The split exists because a baseline written from an SRD and the email the
 * system actually sends drift apart, and a QA needs to see the drift without a
 * red that stops the run. Anything genuinely required belongs in `mustContain`.
 *
 * ── Provenance, and why onboarding is empty ─────────────────────────────────
 * A contract states what the email SHOULD say, and that has to come from a
 * requirement — the ticket, the SRD, a confirmed clarification. Copy read off
 * a live email is what the system does today, which is not the same thing
 * (qa-principles #17): a contract written from an observed email passes for
 * ever and defends whatever is wrong with it.
 *
 * So the onboarding contracts below are DECLARED AND EMPTY. Filling them needs
 * the EAINT-12341 templates. Guessing the wording would produce a suite that
 * looks like coverage and is not.
 */

export interface BodyCheck {
  /** What this is looking for, in words a reviewer can check. */
  what: string;
  re: RegExp;
  /** True when the baseline and the live email are known to disagree here. */
  deviation?: boolean;
}

export interface EmailContract {
  key: string;
  label: string;
  /** The envelope sender. */
  from: string;
  /** Who it goes to, in words — the assertion takes the address from the test. */
  recipient: string;
  /** The subject as a human reads it, placeholders and all. */
  subjectHuman: string;
  /** The subject as a test matches it. */
  subjectRe: RegExp;
  /** Addresses that must be on CC. Empty means none are required. */
  ccMustContain?: string[];
  /** Body fragments whose absence FAILS. */
  mustContain?: RegExp[];
  /** Body fragments whose absence is reported, not failed. */
  shouldContain?: BodyCheck[];
  /** Run-specific values that must appear in the body, by name. */
  dynamicFields?: string[];
  /** How many attachments the email must carry. Omit when none are expected. */
  attachments?: { count: number; filenameRe?: RegExp };
  /** Where the expectation comes from. A contract with no source is a guess. */
  source: string;
  /** What makes it send. */
  trigger: string;
}

export const SENDER = "support@eauto.my";

/**
 * A known defect, kept so a test RAISES it rather than encoding it as correct.
 *
 * Found on the SI/BDP appointment emails: the Subject header is not RFC 2047
 * encoded, so a non-ASCII dash degrades to a literal "?". Whether the
 * onboarding emails share the fault is unverified — the same mail layer sends
 * them, so it is worth checking on the first real one.
 */
export const SUBJECT_ENCODING_DEFECT = {
  id: "email-subject-mojibake",
  re: /(Rescheduled|Confirmed|Approved)\s+\?\s+\S/i,
  note:
    'Subject separator rendered as "?" — the header is not RFC 2047 encoded, so a ' +
    "non-ASCII dash becomes a replacement character. Observed on the SI reschedule " +
    "email (Mailtrap 5594318644, 15.07.2026). Expected a real dash. Do NOT treat " +
    '"?" as the expected copy.',
} as const;

/**
 * Onboarding emails — EAINT-12341.
 *
 * EMPTY ON PURPOSE. See the provenance note at the top of this file: these get
 * filled from the ticket's confirmed templates, not from the first email that
 * happens to arrive.
 *
 * What is known so far, from `eAuto_UCD_Onboarding_Automation_Brief.md` §7:
 *  - recipient is the Admin In Charge email given on the Pre-Application
 *  - there are TWO CC addresses, not yet named
 *  - at least one email carries an attachment that must open
 *  - several cases assert that NO email is sent
 *  - whether sending is synchronous on approval or queued is UNANSWERED, and
 *    it decides how long `assertNone` has to watch for
 */
export const ONBOARDING_CONTRACTS: Record<string, EmailContract> = {};

/** Every contract, by key. */
export const CONTRACTS: Record<string, EmailContract> = {
  ...ONBOARDING_CONTRACTS,
};

export function contract(key: string): EmailContract {
  const c = CONTRACTS[key];
  if (!c) {
    const known = Object.keys(CONTRACTS);
    throw new Error(
      `No email contract "${key}". ` +
        (known.length
          ? `Known: ${known.join(", ")}.`
          : "None are defined yet — see the provenance note in this file."),
    );
  }
  return c;
}
