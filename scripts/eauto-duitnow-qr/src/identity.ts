/**
 * Unique dealer identity for one run.
 *
 * Every field below is generated fresh per run because eAuto refuses a second
 * pre-application carrying an identity it has already onboarded. The scheme is
 * ported from the reference rig's `src/fixture.js` (Charmain, EAINT-11982):
 * a minute-resolution run stamp plus a monotonic on-disk counter. NOTHING is
 * random — two runs in the same minute are separated by the counter, so a
 * value can always be traced back to the run that made it.
 *
 * Anything the dashboard sends as an override wins. Leave a field blank in the
 * dashboard and it is generated here.
 *
 * `[ported from _reference/automation code/Pre-Application & Application/
 *   .../03-automation/src/fixture.js, 2026-09-03]`
 */
import fs from "node:fs";
import path from "node:path";

const SEQ_FILE = path.join(__dirname, "..", ".seq");

/** yymmdd-hhmm — unique only to the minute, hence the counter below. */
function stampNow(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    String(d.getFullYear()).slice(2) + p(d.getMonth() + 1) + p(d.getDate()) +
    "-" + p(d.getHours()) + p(d.getMinutes())
  );
}

/** Monotonic 3-digit sequence, persisted so parallel-in-a-minute runs differ. */
function nextSeq(): string {
  let n = 0;
  try { n = parseInt(fs.readFileSync(SEQ_FILE, "utf-8").trim(), 10) || 0; } catch { n = 0; }
  n = (n + 1) % 1000;
  try { fs.writeFileSync(SEQ_FILE, String(n)); } catch { /* read-only fs — stamp alone still separates runs */ }
  return String(n).padStart(3, "0");
}

export type BusinessType =
  | "TRADING_SARAWAK" | "TRADING_SABAH"
  | "SDN_BHD" | "SOLE_PROPRIETORSHIP_PARTNERSHIP" | "LLP";

/** The three SSM types post their BRN to a live registry lookup. */
export const isSsmType = (t: BusinessType) => !/^TRADING_/.test(t);

export interface IdentityOverrides {
  businessType?: BusinessType;
  /** SSM types only — a REAL company's numbers, cleared by the Checker. */
  oldBrn?: string;
  newBrn?: string;
  ownerTag?: string;
  emailPrefix?: string;
  emailDomain?: string;
  tinPrefix?: string;
  /** Blank = generate. Set to reuse a name deliberately (rare — see below). */
  companyName?: string;
  businessLicenseNo?: string;
  tin?: string;
  sst?: string;
  adminEmail?: string;
}

export interface Identity {
  runLabel: string;
  businessType: BusinessType;
  isSsm: boolean;
  companyName: string;
  /** Non-SSM types only. */
  businessLicenseNo: string;
  /** SSM types only. */
  oldBrn: string;
  newBrn: string;
  tin: string;
  sst: string;
  showroomAddress: string;
  showroomPostcode: string;
  state: string;
  city: string;
  adminName: string;
  adminEmail: string;
  adminMobile: string;
  directorName: string;
  directorEmail: string;
  directorMobile: string;
  directorMyKad: string;
  picName: string;
  picEmail: string;
  picMobile: string;
  picMyKad: string;
}

/**
 * Field rules measured off the live form on 24-08-2026 (reference rig):
 * Business Trading License No min 4 chars · TIN 9–15 chars, no checksum ·
 * SST on the Application Form is EXACTLY 15 chars · postcode exactly 5 ·
 * mobile max 11 · the page upper-cases the company name for you.
 */
export function buildIdentity(o: IdentityOverrides = {}): Identity {
  const businessType = o.businessType ?? "TRADING_SARAWAK";
  const stamp = stampNow();
  const seq = nextSeq();
  const digits = stamp.replace(/\D/g, ""); // 10 digits
  const seven = (digits + seq).slice(-7);
  const ownerTag = (o.ownerTag || "FAIZUDDIN").toUpperCase();
  const emailPrefix = o.emailPrefix || "qa.eaint12257";
  const emailDomain = o.emailDomain || "modefair.com";
  const tinPrefix = o.tinPrefix || "C";

  const sarawak = businessType === "TRADING_SARAWAK";
  const ssm = isSsmType(businessType);

  // An SSM type without real numbers cannot work: /obs/preOnb/checkSSM.do is a
  // LIVE lookup against the real registry, and the form does not error on a miss
  // — it silently switches to Business Trading (Sabah). Refuse loudly instead of
  // running a scenario that quietly tested the wrong type.
  if (ssm && !(o.oldBrn && o.newBrn)) {
    throw new Error(
      `${businessType} needs a REAL company's Old BRN and New BRN. Nothing generated passes checkSSM.do. ` +
      `Run the Checker tab, press Use on a row marked "Able to use", and try again.`,
    );
  }
  if (ssm && !o.companyName) {
    throw new Error(`${businessType} needs the registered company name that goes with the BRN.`);
  }

  return {
    runLabel: `qr-${stamp}-${seq}`,
    businessType,
    isSsm: ssm,
    // For the non-SSM types the licence is the identity eAuto de-duplicates on,
    // and the company name is how we find the record again in the BO listing —
    // both carry the owner tag so a stranger's cleanup leaves ours alone. On the
    // SSM types BOTH are the real company's, and uniqueness comes from the
    // registry instead: a real BRN is good for exactly one onboarding, ever.
    companyName: o.companyName || `${ownerTag} QA12257 ${stamp}-${seq} ENTERPRISE`,
    businessLicenseNo: ssm ? "" : (o.businessLicenseNo || (sarawak ? `KCH/${seven}` : `KK/${seven}`)),
    oldBrn: ssm ? o.oldBrn! : "",
    newBrn: ssm ? o.newBrn! : "",
    tin: o.tin || `${tinPrefix}${(digits + seq + "0").slice(-10)}`,
    sst: o.sst || (`W${digits}${seq}00`).slice(0, 15),

    // Deliberately NOT unique — repeating these across runs is safe and keeps
    // the generated records recognisable as ours. They only have to AGREE with
    // the business type: picking the type auto-selects the state, and the state
    // drives the city dropdown. The SSM types are not state-bound, so they take
    // a neutral KL address.
    showroomAddress: "Lot 12, Jalan QA, Taman Automation",
    showroomPostcode: ssm ? "50450" : sarawak ? "93100" : "88000",
    state: ssm ? "WILAYAH PERSEKUTUAN KUALA LUMPUR" : sarawak ? "SARAWAK" : "SABAH",
    city: ssm ? "KUALA LUMPUR" : sarawak ? "KUCHING" : "KOTA KINABALU",

    adminName: `QA Admin ${stamp}`,
    adminEmail: o.adminEmail || `${emailPrefix}+${stamp}-${seq}@${emailDomain}`,
    adminMobile: (`01${digits}${seq}`).slice(0, 10),

    directorName: `QA Director ${stamp}`,
    directorEmail: `${emailPrefix}+dir${stamp}-${seq}@${emailDomain}`,
    directorMobile: (`012${digits}${seq}`).slice(0, 10),
    directorMyKad: (`90${digits}${seq}`).slice(0, 12),

    picName: `QA PIC ${stamp}`,
    picEmail: `${emailPrefix}+pic${stamp}-${seq}@${emailDomain}`,
    picMobile: (`013${digits}${seq}`).slice(0, 10),
    picMyKad: (`91${digits}${seq}`).slice(0, 12),
  };
}
