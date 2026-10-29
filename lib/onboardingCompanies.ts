"use client";
// Shared company list for every onboarding automation (Pre-Application +
// Application): /eauto/12153, /eauto/12257, /eauto/preapp. Faizuddin,
// 2026-10-22: "read the details from an excel i drop instead of manually
// typing in the business type details … able to be used by any automation
// that requires it".
//
// The Excel is the Company Details Checker export he keeps (e.g.
// "ROC_New ROC_TIN Checked 20_10_2026.xlsx"): Company ROC, ROC Status, New
// Company ROC, New ROC Status, TIN Number, TIN Status, Overall. It has no
// business-type column, so the type comes from the New ROC's SSM entity code
// (digits 5–6 of the 12-digit number): 01 = company (Sdn Bhd / Bhd),
// 03 = business (Sole Proprietorship / Partnership), 04 = LLP (eSIM row #2,
// 202204000729, 2026-10-23; 06 unconfirmed). Business Trading has no
// SSM number and is never in the file.
//
// One list, stored on the dashboard server (app/api/onboarding-companies),
// so every page reads the same rows. Which rows are spent is the existing
// cross-ticket ledger (lib/companyUsageLedger.ts).
import { useCallback, useEffect, useState } from "react";
import { loadUsage, markUsed, unmarkUsed, usageKey, type UsageEntry, type UsageLedger } from "@/lib/companyUsageLedger";
import type { OnboardingCompany, OnboardingCompanyList } from "@/lib/onboardingCompanyTypes";

// Spent companies are kept on the dashboard server (app/api/onboarding-companies/usage,
// data/onboarding/usage.json) so every browser sees the same list; the browser
// ledger (lib/companyUsageLedger.ts) is kept in step for the older checker pages.
// Entries only in this browser are sent up once, the first time the list loads.

export const UPDATED_EVENT = "onboarding-companies-updated";

async function postUsage(body: { mark?: UsageEntry[]; release?: string[] }): Promise<void> {
  await fetch("/api/onboarding-companies/usage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => undefined);
}

/** The dropped list, refreshed whenever any page replaces it or marks a company. */
export function useOnboardingCompanies() {
  const [list, setList] = useState<OnboardingCompanyList | null>(null);
  const [error, setError] = useState("");
  const [ledger, setLedger] = useState<UsageLedger>({});
  const reload = useCallback(() => {
    fetch("/api/onboarding-companies", { cache: "no-store" })
      .then(r => r.json())
      .then((d: OnboardingCompanyList & { error?: string }) => {
        setList(d.rows ? d : null);
        setError(d.error ?? "");
      })
      .catch(() => setError("The company list could not be loaded."));
    const local = loadUsage();
    setLedger(local);
    fetch("/api/onboarding-companies/usage", { cache: "no-store" })
      .then(r => r.json())
      .then(async (server: UsageLedger) => {
        const missing = Object.values(local).filter(e => !server[e.key]);
        if (missing.length) await postUsage({ mark: missing });
        setLedger({ ...local, ...server, ...Object.fromEntries(missing.map(e => [e.key, e])) });
      })
      .catch(() => undefined);
  }, []);
  useEffect(() => {
    reload();
    window.addEventListener(UPDATED_EVENT, reload);
    window.addEventListener("storage", reload);
    return () => { window.removeEventListener(UPDATED_EVENT, reload); window.removeEventListener("storage", reload); };
  }, [reload]);
  const isUsed = useCallback((r: { roc: string; newRoc: string; tin: string }) => !!ledger[usageKey(r)], [ledger]);
  const usedBy = useCallback((r: { roc: string; newRoc: string; tin: string }): UsageEntry | undefined => ledger[usageKey(r)], [ledger]);
  return { list, error, reload, isUsed, usedBy, ledger };
}

/** Mark a company spent once a run is queued with it (this browser and the server). */
export function spend(row: { roc: string; newRoc: string; tin: string }, ticket: string, scenario: string, companyName: string): void {
  if (!row.roc || !row.newRoc) return;
  const ledger = markUsed(row, { ticket, scenario, companyName });
  const entry = ledger[usageKey(row)];
  void postUsage({ mark: entry ? [entry] : [] }).then(() => window.dispatchEvent(new Event(UPDATED_EVENT)));
  window.dispatchEvent(new Event(UPDATED_EVENT));
}

/** Make a spent company free again (e.g. a run that stopped before eAuto saw it). */
export function release(row: { roc: string; newRoc: string; tin: string }): void {
  unmarkUsed(row);
  void postUsage({ release: [usageKey(row)] }).then(() => window.dispatchEvent(new Event(UPDATED_EVENT)));
}
