/**
 * JPJ error codes for STMS, and the eSim prefix that produces each one.
 *
 * Source: `🚨Master Regression Checklist _ JPJ & RHB Error Codes.xlsx`,
 * sheet "JPJ (STMS + Others)". Priorities are the checklist's own, derived from
 * production hit counts between 1 Jan 2024 and 2 Sep 2024:
 *
 *   P1 >10k hits · P2 <10k · P3 <1k · P4 <100 · P5 never hit in prod
 *
 * Only P1–P4 are listed. The sheet's other 92 rows are P5 and have never
 * occurred in production.
 *
 * ── Why a prefix per code ────────────────────────────────────────────────────
 * eSim keys its canned JPJ response on the START of the vehicle number, so a
 * test selects its outcome by choosing the prefix it generates from. One record
 * per code, created once, means no test ever edits a record another test or
 * another person is relying on.
 *
 * ── Why the Y namespace ──────────────────────────────────────────────────────
 * eSim matches by "starts with", so a new prefix must neither begin with, nor
 * be the beginning of, any existing one. Of 243 records on staging, `Y*` left
 * 24 collision-free prefixes. These assignments are PINNED: changing one
 * silently repoints a scenario, so add new codes at the end instead.
 *
 * Checked against staging 2026-09-15.
 */

export type Priority = "P1" | "P2" | "P3" | "P4";

export interface JpjCode {
  /** The eSim vehicle-number prefix that triggers this code. */
  prefix: string;
  /** The JPJ response code as the checklist writes it. */
  code: string;
  priority: Priority;
  /** What the checklist says the user should see. Abridged where very long. */
  description: string;
  /** Extra eSim fields this code needs beyond `responseCode`. */
  esimFields?: Record<string, string | number>;
  /** When the checklist last records this being regressed, if it does. */
  lastRegressed?: string;
  /** The checklist's test-scenario id, where it has one. */
  tsNo?: string;
}

export const STMS_JPJ_CODES: JpjCode[] = [
  { prefix: "YA", code: "1R", priority: "P3", description: "Sila hantarkan salinan depan dan belakang MyKad penjual dan Geran kenderaan melalui WhatsApp — JPJ seller-ID verification needed" },
  { prefix: "YB", code: "2D", priority: "P4", description: "VEHICLE STATUS NOT ALLOWED" },
  { prefix: "YC", code: "3", priority: "P4", description: "TRANSACTION COULD NOT BE COMPLETED" },
  { prefix: "YD", code: "3A", priority: "P2", description: "INVALID VEHICLE NUMBER" },
  { prefix: "YE", code: "3B", priority: "P1", description: "Nombor kenderaan tidak sepadan dengan id penjual dalam sistem JPJ.", lastRegressed: "20/9/2024", tsNo: "STMSUCDREG_TS29" },
  { prefix: "YF", code: "3G", priority: "P4", description: "Pemilik kenderaan meninggal dunia. (owner deceased)" },
  { prefix: "YG", code: "4", priority: "P2", description: "Penjual sila hadirkan diri di kaunter JPJ untuk menyelesaikan senarai hitam. (blacklist)" },
  { prefix: "YH", code: "4A", priority: "P1", description: "INVALID CHASSIS NUMBER" },
  { prefix: "YI", code: "4B", priority: "P1", description: "INVALID ENGINE NUMBER" },
  { prefix: "YJ", code: "4E", priority: "P2", description: "CONDITION CODE EXIST" },
  {
    prefix: "YK", code: "4F", priority: "P2",
    description: "Ini adalah kenderaan E-Hailing — shown when vehicle usage is AH",
    esimFields: { usageCode: "AH" },
  },
  {
    prefix: "YL", code: "4F", priority: "P2",
    description: "VEHICLE USAGE NOT ALLOWED — shown when vehicle usage is NOT AH",
    esimFields: { usageCode: "AB" },
  },
  { prefix: "YM", code: "4G", priority: "P4", description: "JPJ RETURNED CODE" },
  { prefix: "YN", code: "4K", priority: "P1", description: "HAK MILIK DITUNTUT" },
  { prefix: "YP", code: "4Z", priority: "P3", description: "STMS bagi kenderaan ini telah melebihi 6 bulan. Sila bayar APT." },
  { prefix: "YQ", code: "6P", priority: "P3", description: "Nombor kenderaan tidak sepadan dengan kategori atau id penjual dalam sistem JPJ." },
  { prefix: "YR", code: "6T", priority: "P3", description: "Nombor kenderaan tidak sepadan dengan kategori atau id penjual dalam sistem JPJ." },
  { prefix: "YS", code: "6V", priority: "P1", description: "Lesen Kenderaan Motor sudah tamat tempoh lebih daripada satu (1) tahun." },
  { prefix: "YT", code: "6W", priority: "P2", description: "Kenderaan ini tidak ada Lesen Kenderaan Motor." },
  { prefix: "YV", code: "7C", priority: "P3", description: "Sila buat permohonan pembatalan EVP dengan Operator eHailing." },
  { prefix: "YW", code: "VE", priority: "P4", description: "(no description in the checklist)" },
];

/** Defaults every seeded record gets unless the code overrides them. */
export const ESIM_DEFAULTS = {
  usageCode: "AB",
  bodyType: "MKR",
  jsjStatus: "0",
  sekatStatus: "0",
  jpjEnqStatus: "0",
  delayMiliSeconds: 0,
} as const;

export function codesByPriority(...levels: Priority[]): JpjCode[] {
  return STMS_JPJ_CODES.filter((c) => levels.includes(c.priority));
}
