// Plain types and helpers of the shared onboarding company list — no React, so the
// API route (app/api/onboarding-companies) can import them. The client hook is
// lib/onboardingCompanies.ts.

export type CompanyType = "ROC" | "ROB" | "LLP" | "OTHER";

export interface OnboardingCompany {
  roc: string;
  newRoc: string;
  tin: string;
  /** "PASS" = old BRN, new BRN and TIN all absent from eAuto (free to onboard). */
  overall: string;
  /** Checker "TIN Status": "PRESENT" = this TIN is already in eAuto, "ABSENT" = not. Missing in Excels dropped before 2026-10-26. */
  tinStatus?: string;
  type: CompanyType;
}

export interface OnboardingCompanyList {
  file: string;
  uploadedAt: string;
  rows: OnboardingCompany[];
}

export const TYPE_LABEL: Record<CompanyType, string> = {
  ROC: "Sdn Bhd / Bhd",
  ROB: "Sole Proprietorship / Partnership",
  LLP: "LLP",
  OTHER: "Other",
};

/** SSM entity code (digits 5–6 of the new 12-digit number) → business type. */
export function typeFromNewRoc(newRoc: string): CompanyType {
  const code = newRoc.replace(/\D/g, "").slice(4, 6);
  if (code === "01") return "ROC";
  if (code === "03") return "ROB";
  if (code === "04" || code === "06") return "LLP";
  return "OTHER";
}

/** Free rows of one type: PASS in the checker and not spent by any ticket. */
export function freeRows(list: OnboardingCompanyList | null, type: CompanyType, isUsed: (r: OnboardingCompany) => boolean): OnboardingCompany[] {
  return (list?.rows ?? []).filter(r => r.type === type && r.overall === "PASS" && !isUsed(r));
}

/** A row's identity — the same ROC can appear twice in the sheet with different New ROC / TIN. */
export const rowKey = (r: { roc: string; newRoc: string; tin: string }) => `${r.roc}|${r.newRoc}|${r.tin}`;

/**
 * A made-up LLP for when the Excel has no free LLP row (Faizuddin, 2026-10-23:
 * "i dont have the real details for LLP. if make fake one we can continue. just
 * that we wont have e-invoice, which is not a problem for now").
 *
 * The run seeds both eSIM SSM rows with these numbers, so the SSM lookup
 * passes; the TIN is not real, so LHDN fails and there is no e-Invoice.
 * Shape: "LLP9" + 6 digits + "-LGN" (real LLP numbers seen start "LLP00",
 * e.g. LLP0035174-LGN — the 9 keeps fakes apart), New BRN = year + "04" (LLP
 * entity code) + 6 digits. No TIN: Faizuddin, 2026-10-23 — "for any TS that
 * uses fake details, do not input in the TIN number, since the TIN is optional".
 */
export function fakeLlp(): { oldBrn: string; newBrn: string; tin: string } {
  const d = (n: number) => Array.from({ length: n }, () => Math.floor(Math.random() * 10)).join("");
  return { oldBrn: `LLP9${d(6)}-LGN`, newBrn: `${new Date().getFullYear()}04${d(6)}`, tin: "" };
}

export const isFakeLlp = (oldBrn: string) => /^LLP9\d{6}-LGN$/i.test(oldBrn.trim());

/**
 * A TIN for the Application form of a fake company. The Application requires a
 * TIN (12153_TS04, 2026-10-23: "This field is required"), the Pre-Application
 * does not. Faizuddin, 2026-10-23: "choose TIN from the excel, but it must not
 * have any unused ROC/New ROC. because the TIN with unused ROC and New ROC must
 * be saved for other scenarios" — so only rows whose ROC / New ROC are spent
 * (already in eAuto, or used by a run) are taken. Any business type will do
 * (Faizuddin, 2026-10-23: "the TIN for LLP doesnt have to tally, any TIN from
 * any types of business can use").
 */
/**
 * A made-up Business Trading licence number. Business Trading (Sabah/Sarawak)
 * is the non-SSM route, so no real data and no eSIM set-up are needed (a
 * colleague, relayed by Faizuddin 2026-10-26). Format agreed 2026-10-26:
 * "SBH/TL/9" or "SWK/TL/9" + 6 digits — the 9 marks it as fake, like fakeLlp().
 * eAuto accepts letters, digits and "/", 4–35 characters (#businessLicenseNo).
 */
export function fakeLicence(state: "SABAH" | "SARAWAK"): string {
  const d = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10)).join("");
  return `${state === "SABAH" ? "SBH" : "SWK"}/TL/9${d}`;
}

/**
 * A TIN on its own in the usage ledger (no company row): spent by a fake LLP or
 * Business Trading run, or refused by eAuto as already used. Key "TIN|-|<tin>".
 */
export const tinKey = (tin: string) => ({ roc: "TIN", newRoc: "-", tin: tin.trim().toUpperCase() });

/**
 * TINs a fake / Business Trading run may type. Rule (Faizuddin, 2026-10-23 and
 * 2026-10-26): from a row whose ROC / New ROC is already in eAuto (Overall not
 * PASS), so no free company is touched — but the TIN itself must still be
 * unused, or eAuto refuses it as duplicated (12257_TS08, 2026-10-26: "the
 * details are duplicated, even after i shuffle couple of times"). So:
 *   1. Overall is not PASS (some value of the row is already in eAuto);
 *   2. TIN Status is not PRESENT (the TIN itself is not in eAuto);
 *   3. the row was never used by a run (a run types the row's TIN too);
 *   4. the TIN was never spent or refused on its own (tinKey ledger entry);
 *   5. it looks like a real TIN (letters + digits, not "-").
 */
export function tinCandidates(list: OnboardingCompanyList | null, isUsed: (r: { roc: string; newRoc: string; tin: string }) => boolean): string[] {
  const out = new Set<string>();
  for (const r of list?.rows ?? []) {
    const tin = r.tin.trim().toUpperCase();
    if (!/^[A-Z]{1,2}\d{8,13}$/.test(tin)) continue;
    if (r.overall === "PASS" || r.tinStatus === "PRESENT" || isUsed(r) || isUsed(tinKey(tin))) continue;
    out.add(tin);
  }
  return [...out];
}

export function tinFromUsedRow(list: OnboardingCompanyList | null, isUsed: (r: { roc: string; newRoc: string; tin: string }) => boolean): string {
  const c = tinCandidates(list, isUsed);
  return c.length ? c[Math.floor(Math.random() * c.length)] : "";
}

/** The chosen TIN first, then up to `n` other candidates in random order — the run swaps to the next one when eAuto refuses a TIN. */
export function tinPool(list: OnboardingCompanyList | null, isUsed: (r: { roc: string; newRoc: string; tin: string }) => boolean, first: string, n = 15): string[] {
  const rest = tinCandidates(list, isUsed).filter(t => t !== first).sort(() => Math.random() - 0.5).slice(0, n);
  return first ? [first, ...rest] : rest;
}
