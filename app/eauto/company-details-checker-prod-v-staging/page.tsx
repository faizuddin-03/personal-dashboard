"use client";
import { Building2 } from "lucide-react";
import CheckerTab from "./CheckerTab";

// Company Details Checker (Prod v Staging) Availability — eAuto sidebar page.
// Duplicated 2026-10-20 from the EAINT-12257 page's Checker tab (Faizuddin:
// "duplicate this page exactly"). CheckerTab.tsx here is a verbatim copy of
// app/eauto/company-details-checker/CheckerTab.tsx, so changes to this page
// never touch the 12153 / 12257 checker. Not passed: 12257's `onUse` / `notice`
// / `usedKey` — those hand a row to the 12257 test runner, which this page has none of.

export default function CompanyDetailsCheckerProdVStagingPage() {
  return (
    <div className="relative flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">eAuto</span>
          <span className="text-slate-700">/</span>
          <Building2 size={14} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">Company Details Checker (Prod v Staging) Availability</h1>
        </div>
      </header>

      <CheckerTab />
    </div>
  );
}
