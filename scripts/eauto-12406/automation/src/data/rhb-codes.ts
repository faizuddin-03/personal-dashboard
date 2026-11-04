/**
 * RHB payment response codes, and the eSim prefix that produces each one.
 *
 * Source: `🚨Master Regression Checklist _ JPJ & RHB Error Codes.xlsx`, sheet
 * "RHB (Shared Across Modules)". The sheet's own name is the point: **RHB is
 * the payment gateway for every module** — STMS, eSerahan, APT, BMK — so one
 * prefix map covers all of them, and a failure proved on STMS is the same
 * failure eSerahan will show.
 *
 * Priorities are the checklist's, from production hit counts:
 *   P1 >10k · P2 <10k · P3 <1k · P4 <100
 *
 * ── Why a prefix per code ────────────────────────────────────────────────────
 * eSim keys its canned RHB response on the START of the vehicle number, so a
 * test selects the outcome by choosing the prefix it generates from, and no
 * record is edited. See `jpj-codes.ts` for the same pattern on JPJ.
 *
 * ── Why the Z namespace ─────────────────────────────────────────────────────
 * `Y*` is already the JPJ map. Of 122 rows in `rhb-transfer-resp`, `Z*` left 25
 * prefixes that collide with nothing AND are outside the protected set in
 * `esim.ts`. These assignments are PINNED — changing one silently repoints a
 * scenario, so add new codes at the end.
 *
 * Checked against staging 2026-09-18.
 */

export type Priority = "P1" | "P2" | "P3" | "P4";

export interface RhbCode {
  /** The eSim vehicle-number prefix that triggers this code. */
  prefix: string;
  /** The RHB response code as the checklist writes it. */
  code: string;
  priority: Priority;
  /** What the checklist says the user should see, abridged. */
  description: string;
  /** True when the transaction is expected to go through. */
  success?: boolean;
  /**
   * The code this prefix's RHB **enquiry** leg must return.
   *
   * Only `DP` needs it, and it is the difference between a pass and a
   * meaningless test — see the note on `DP` below.
   */
  enquiryCode?: string;
}

/** The success code. Everything else here is a failure of some kind. */
export const RHB_SUCCESS = "OK";

export const RHB_CODES: RhbCode[] = [
  // ── P1 — over 10,000 hits in production ──────────────────────────────────
  { prefix: "ZA", code: "IF", priority: "P1", description: "Wang di dalam akaun RHB anda TIDAK MENCUKUPI — insufficient funds" },
  { prefix: "ZB", code: "NP", priority: "P1", description: "Sistem Pembayaran RHB dibawah penyelengaraan 10.30pm–8.30am — maintenance window" },
  { prefix: "ZC", code: "RE", priority: "P1", description: "Sila TUNGGU 6 minit kemudian klik 'Resubmit' — RHB still processing" },

  // ── P2 ───────────────────────────────────────────────────────────────────
  { prefix: "ZD", code: "ER", priority: "P2", description: "Sila TUNGGU 12 minit kemudian klik 'Resubmit' — RHB network down" },

  // ── P3 ───────────────────────────────────────────────────────────────────
  { prefix: "ZE", code: "RC", priority: "P3", description: "PESANAN PENTING dari RHB Bank kepada Pengarah atau Pemilik" },
  /*
   * `DP` ("duplicate") is NOT a plain failure, and testing it without pinning
   * the ENQUIRY leg proves nothing.
   *
   * eAuto re-queries RHB when it sees DP. If that enquiry answers `GD`, the
   * money did move, so the result is rewritten to `OK` and the payment is
   * marked Paid. Only when the enquiry does NOT confirm does the support-desk
   * message appear.
   *
   * Verified both branches on 2026-09-18:
   *   transfer DP + enquiry NF  -> rejected, "Sila hubungi 1700 816 186..."
   *   transfer DP + enquiry GD  -> transferred
   *
   * A prefix with no `rhb-enquiry-resp` row defaults to confirming, which is
   * why this looked like "DP does not stop the payment" on the first run.
   *
   * Source for the mechanism: Ask eAuto, citing
   * `RhbCodeMaps.java:63,70,84,148-168` and
   * `FundTransferHandlerBean.java:141-175,203-274,427-493`. Code-sourced, so it
   * may not gate sign-off — but both branches are reproduced above.
   *
   * Also from that answer, NOT yet verified here: the DP re-check is switched
   * OFF for APT (`FundTransferHandlerBean.java:447`), so APT keeps DP as a hard
   * failure. Worth a test when APT is automated.
   */
  { prefix: "ZF", code: "DP", priority: "P3", description: "Sila hubungi 1700 816 186 untuk bantuan", enquiryCode: "NF" },
  { prefix: "ZG", code: "NF", priority: "P3", description: "Sila hubungi 1700 816 186 untuk bantuan" },
  { prefix: "ZH", code: "RP", priority: "P3", description: "Need to reprocess / resend due to line down" },

  // ── P4 — under 100 hits in production ────────────────────────────────────
  { prefix: "ZI", code: "NA", priority: "P4", description: "Sila TUNGGU 12 minit kemudian klik 'Resubmit' — RHB network down" },
  { prefix: "ZJ", code: "ID", priority: "P4", description: "Sila hubungi 1700 816 186 untuk bantuan" },
  { prefix: "ZL", code: "EM", priority: "P4", description: "Exceeded max amount. Kindly retry next business day" },
  { prefix: "ZM", code: "ERROR", priority: "P4", description: "Connection Failed" },
  { prefix: "ZN", code: "NR", priority: "P4", description: "No Record" },
  { prefix: "ZO", code: "AI", priority: "P4", description: "Account Issue" },
  { prefix: "ZP", code: "ER-T", priority: "P4", description: "PAYMENT METHOD NOT ALLOWED" },
  { prefix: "ZQ", code: "AL", priority: "P4", description: "Already Login" },
  { prefix: "ZR", code: "AS", priority: "P4", description: "Already Sign-on" },
  { prefix: "ZS", code: "EC", priority: "P4", description: "RHB System Error" },
  /*
   * `GD` is NOT a success code, whatever the checklist's wording suggests.
   * Mapped as one on 2026-09-18 and the transfer was REJECTED — eAuto accepts
   * only `OK`. Corrected rather than deleted, because "Transaction Good" reads
   * like success and the next person will assume the same thing.
   */
  { prefix: "ZT", code: "GD", priority: "P4", description: "Transaction Good — but eAuto still rejects it" },
  { prefix: "ZU", code: "OK", priority: "P4", description: "Transaction Updated — the only code that completes a transfer", success: true },
];

/** Defaults every seeded record gets unless the code overrides them. */
export const RHB_DEFAULTS = {
  delayMiliSeconds: 0,
} as const;

export function rhbByPriority(...levels: Priority[]): RhbCode[] {
  return RHB_CODES.filter((c) => levels.includes(c.priority));
}

/** The codes that should STOP a payment. Everything except the success ones. */
export function rhbFailures(): RhbCode[] {
  return RHB_CODES.filter((c) => !c.success);
}
