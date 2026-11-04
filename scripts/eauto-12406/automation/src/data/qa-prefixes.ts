/**
 * QA-owned eSim prefixes — the "O" family. Reusable by any automation.
 *
 * eSim picks the JPJ / RHB reply from the START of the vehicle number, so a
 * vehicle numbered `OC12345` gets whatever `OC` is set to. These records were
 * created by QA (Azfar) on 2026-09-25 on prefixes that were free in EVERY eSim
 * entity at the time, so they collide with nobody's data.
 *
 * Rules:
 *  - Only `scripts/seed-qa-prefixes.ts` writes these, and only CREATES a missing
 *    prefix or updates one whose remark starts with QA_TAG. It never edits a
 *    record anyone else made.
 *  - Usage code + body type are real JPJ pairs seen in existing eSim records
 *    (AA+MSL and AB+MSL for bikes). Car rows use MKR (motokar), the body type
 *    the rate card files under CAR; other Car usage codes may carry other body
 *    types in real life (e.g. BF with LFC / LRF) — MKR is chosen so the CAR row
 *    is hit deterministically.
 *  - The switchable prefixes (`OQ` car, `OR` motorcycle) start with RHB = IF;
 *    a test flips one to OK after a reset (`--rhb <PREFIX> OK`). Put it back to
 *    IF afterwards.
 */

export const QA_TAG = "QA automation (Azfar)";

export interface QaPrefix {
  prefix: string;
  usageCode: string;
  bodyType: string;
  /** JPJ enquiry response code. */
  jpj: string;
  /** Optional RHB transfer reply for this prefix; none = eSim default (OK). */
  rhb?: string;
  vehicle: "CAR" | "BIKE";
  purpose: string;
  /** Optional eSTM enquiry reply (estm-enquiry-resp) — e.g. VEL000392E for the APT cronjob route. */
  estm?: { responseCode: string; declarationArea: string };
  /**
   * Optional LKM Refund set: the refund balance JPJ reports (stms-enquiry-resp
   * refundAmount, which makes Step 5 offer the add-on), what the simulated
   * document check "reads" off the uploads (lkm-refund-ocr-document-resp — must
   * match the seller card and the bank details typed), and the refund status
   * JPJ answers (lkm-refund-inquiry-resp; AC/WC In Progress, CU Refund Done,
   * RB Rejected).
   */
  lkmRefund?: {
    balance: number;
    ocr: { bankName: string; bankAccNo: string; bankAccHolderName: string; icFullName: string; icIdNo: string };
    inquiry: { respCode: string; refundStatus: string; refundAmount: number; ptjBranch: string; seqNo: number; receiptNo: string };
  };
}

export const QA_PREFIXES: QaPrefix[] = [
  { prefix: "OC", usageCode: "AA", bodyType: "MSL", jpj: "00", vehicle: "BIKE", purpose: "Motosikal — usage AA, body MSL, JPJ OK (rate card: STMS AA BIKE row)" },
  { prefix: "OD", usageCode: "AB", bodyType: "MSL", jpj: "00", vehicle: "BIKE", purpose: "Bike on usage AB — body MSL, JPJ OK (rate card: AB BIKE row, eAuto RM15)" },
  { prefix: "OE", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage AE, JPJ OK" },
  { prefix: "OF", usageCode: "DK", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage DK, JPJ OK (APT DK exists for Semenanjung only)" },
  { prefix: "OG", usageCode: "BJ", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage BJ, JPJ OK (APT BJ Semenanjung = JPJ RM40 exception)" },
  { prefix: "OH", usageCode: "AI", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage AI, JPJ OK" },
  { prefix: "OI", usageCode: "AC", bodyType: "MKR", jpj: "00", rhb: "IF", vehicle: "CAR", purpose: "SWITCHABLE payment (rhb IF, added 2026-09-29 for 12403_E2E2) — Car — usage AC, JPJ OK" },
  { prefix: "OJ", usageCode: "AD", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage AD, JPJ OK" },
  { prefix: "OL", usageCode: "BF", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage BF, JPJ OK (APT BF Semenanjung = JPJ RM40 exception)" },
  { prefix: "OM", usageCode: "IA", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage IA, JPJ OK (APT IA Sabah/Sarawak = JPJ RM100 exception)" },
  { prefix: "ON", usageCode: "AB", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car — usage AB, JPJ OK (QA-owned twin of TE)" },
  { prefix: "OR", usageCode: "AA", bodyType: "MSL", jpj: "00", rhb: "IF", vehicle: "BIKE", purpose: "SWITCHABLE payment, Motosikal (AA+MSL) — RHB IF by default; flip to OK after a BO reset, then back to IF (added 2026-09-28, EAINT-12403)" },
  { prefix: "OT", usageCode: "AB", bodyType: "MKR", jpj: "00", rhb: "IF", vehicle: "CAR", estm: { responseCode: "VEL000392E", declarationArea: "SABAH" }, purpose: "SWITCHABLE payment, Car AB+MKR, eSTM VEL000392E declarationArea SABAH — APT cronjob route (added 2026-09-28, EAINT-12403)" },
  { prefix: "OV", usageCode: "AD", bodyType: "MKR", jpj: "00", vehicle: "CAR", estm: { responseCode: "VEL000392E", declarationArea: "SABAH" }, purpose: "Car AD+MKR, JPJ OK, eSTM VEL000392E declarationArea SABAH — APT via eSTM route, 12403_E2E3 (added 2026-09-29, EAINT-12403)" },
  {
    prefix: "OU", usageCode: "AB", bodyType: "MKR", jpj: "00", rhb: "IF", vehicle: "CAR",
    estm: { responseCode: "GLB000000I", declarationArea: "SEMENANJUNG" },
    purpose: "SWITCHABLE throwaway for automation dry runs ONLY — never used by a CR seed (added 2026-09-28). " +
      "EAINT-12253 (20.10.2026) uses vehicles OUP…; its estm-enquiry-resp row (created 20.10 by setEstmCode, @fixtures/esim-switch) " +
      "rests at GLB000000I and is switched to VEL000069E mid-run for the insurance divert. An 'OUPV' estm row also exists " +
      "(QA-tagged) but eSim ignores it: the eSTM enquiry matches on the first two letters. " +
      "OUJ (21.10.2026, EAINT-12253 CH_TS8 / FF_TS10 (b)): a jomcheck-enquiry-resp row result No (JomCheck PAID but FAILED), " +
      "created by ts.esim.jomcheckEnquiry when missing and kept as OUJ's dedicated row (that entity has no remark column); " +
      "whether eSim matches that entity on 3 letters is not yet seen",
  },
  {
    prefix: "OW", usageCode: "AB", bodyType: "MKR", jpj: "00", vehicle: "CAR",
    lkmRefund: {
      balance: 1000,
      ocr: { bankName: "MAYBANK", bankAccNo: "112233445566", bankAccHolderName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM", icFullName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM", icIdNo: "020406081081" },
      inquiry: { respCode: "GLB000000I", refundStatus: "AC", refundAmount: 1000, ptjBranch: "0104011", seqNo: 1, receiptNo: "2002" },
    },
    purpose: "LKM Refund — Car AB+MKR, JPJ OK, refund balance RM1,000; document check reads CARDS.malaysianIndividual + MAYBANK 112233445566; refund In Progress (AC) (added 2026-10-07, lkm-refund.flow)",
  },
  { prefix: "OQ", usageCode: "AB", bodyType: "MKR", jpj: "00", rhb: "IF", vehicle: "CAR", purpose: "SWITCHABLE payment — RHB IF by default; flip to OK after a BO reset, then back to IF" },
  // Insurance Cancellation (EAINT-12022), added 2026-10-08. Runnerku eligibility rows (eSim HTML page, not the API)
  // are seeded by scripts/seed-runnerku-eligibility.ts; OX's sub-prefixes (OXA, OXB, ...) each carry one insurer.
  { prefix: "OX", usageCode: "AB", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Car AB+MKR, JPJ OK — Insurance Cancellation per-insurer sub-prefixes OXA.. (Runnerku eligibility per sub-prefix)" },
  { prefix: "OY", usageCode: "AB", bodyType: "MKR", jpj: "00", rhb: "IF", vehicle: "CAR", purpose: "SWITCHABLE payment (RHB IF) + Insurance Cancellation eligible (Allianz 0.71) — IC payment-failure chains" },
  {
    prefix: "OZ", usageCode: "AB", bodyType: "MKR", jpj: "00", vehicle: "CAR",
    lkmRefund: {
      balance: 80,
      ocr: { bankName: "MAYBANK", bankAccNo: "112233445566", bankAccHolderName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM", icFullName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM", icIdNo: "020406081081" },
      inquiry: { respCode: "GLB000000I", refundStatus: "AC", refundAmount: 80, ptjBranch: "0104011", seqNo: 1, receiptNo: "2002" },
    },
    purpose: "LKM Refund RM80 (fee band RM10) + Insurance Cancellation eligible (Allianz 0.71) — both add-ons on one Step 5",
  },
  // The I family (21.10.2026): no Malaysian state plate starts with I, so other testers' realistic
  // plates never land on it. Free in every eSim entity on 21.10.2026 (scripts/esim-prefix-free.ts).
  { prefix: "IA", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 3 (AzfarL3) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "IB", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 4 (AzfarL4) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "IC", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 5 (AzfarCo1) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "ID", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 6 (AzfarCo2) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "IE", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 7 (AzfarCo3) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "IG", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 8 (AzfarCo4) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "IH", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 9 (AzfarCo5) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "II", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 10 (AzfarCo1S) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "IK", usageCode: "AE", bodyType: "MKR", jpj: "00", vehicle: "CAR", purpose: "Runner lane 11 (AzfarCo2S) baseline car — usage AE, JPJ OK, RHB default OK (lane smoke 21.10.2026)" },
  { prefix: "IM", usageCode: "AB", bodyType: "MKR", jpj: "00", rhb: "IF", vehicle: "CAR", purpose: "STMS PAID but JPJ final submission FAILED — Car AB+MKR, JPJ 00, RHB IF (OK only around the payment, locked), stms-submission-resp 3A (EAINT-12253 probe 2210/p01, 22.10.2026; rows #352 / #179 / #80); apt-submission-resp 3B (#13, 26.10.2026, EAINT-12626 TS9): an APT on IM is paid but its JPJ transfer fails — APT reads apt-submission-resp, not stms-submission-resp" },
  {
    prefix: "OS", usageCode: "AB", bodyType: "MKR", jpj: "00", vehicle: "CAR",
    lkmRefund: {
      balance: 3,
      ocr: { bankName: "MAYBANK", bankAccNo: "112233445566", bankAccHolderName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM", icFullName: "MUHAMMAD AMIRUL AZFAR BIN KAMARULAZAM", icIdNo: "020406081081" },
      inquiry: { respCode: "GLB000000I", refundStatus: "AC", refundAmount: 3, ptjBranch: "0104011", seqNo: 1, receiptNo: "2002" },
    },
    purpose: "LKM Refund RM3 (below RM5, not offered) + Insurance Cancellation eligible (Allianz 0.71) — only IC shown",
  },
];

export const qaPrefix = (prefix: string): QaPrefix => {
  const p = QA_PREFIXES.find((x) => x.prefix === prefix);
  if (!p) throw new Error(`No QA prefix "${prefix}". Known: ${QA_PREFIXES.map((x) => x.prefix).join(", ")}`);
  return p;
};
