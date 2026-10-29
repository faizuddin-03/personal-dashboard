"use client";
import { useState } from "react";
import { QrCode, ArrowRight, Info } from "lucide-react";
import clsx from "clsx";
import CheckerTab, { rowKey } from "@/app/eauto/company-details-checker/CheckerTab";
import TestScriptTab from "./TestScriptTab";
import { checkerNeed, findCase, findType, TEST_CASES, BUSINESS_TYPES } from "./scenarios";
import {
  loadPickedCompany, savePickedCompany, clearPickedCompany, type PickedCompany,
} from "@/lib/companyDetailsChecker";

// EAINT-12257 — [eAuto-Application] Add DuitNow QR Payment Channel for
// Pre-application and Application. Two tabs, same shape as EAINT-12153's page.
//
// The Checker is 12153's component reused, not copied — the two tickets touch
// the same module and a second copy would drift. It takes an optional `onUse`;
// 12153 omits it and is unchanged.
//
// WHY THE SELECTION LIVES HERE, not in TestScriptTab: the scenario is chosen
// first, and what it needs then drives the Checker. A selection that needs real
// company data gets a Use button on every passing row; one that doesn't gets no
// button at all, so there is never a Use that would silently go nowhere. Both
// tabs read the same rule from scenarios.ts. Per Faizuddin, 2026-09-03.

export default function DuitNowQrPage() {
  const [activeTab, setActiveTab] = useState<"checker" | "test-script">("test-script");
  const [testCase, setTestCase] = useState<string>(TEST_CASES[0].value);
  const [businessType, setBusinessType] = useState<string>(BUSINESS_TYPES[0].value);
  // Lazy initialiser with the SSR guard — the same shape app/eauto/shopping-cart
  // uses for its saved credentials. React state is the single source of truth
  // from here on; localStorage is only written through updatePicked below.
  const [picked, setPicked] = useState<PickedCompany | null>(
    () => (typeof window !== "undefined" ? loadPickedCompany() : null),
  );

  const need = checkerNeed(testCase, businessType);

  function updatePicked(next: PickedCompany) {
    savePickedCompany(next);
    setPicked(next);
  }

  function handleUse(row: { roc: string; newRoc: string; tin: string }) {
    // A different company means the old name no longer applies — drop it rather
    // than carrying a name that belongs to another BRN.
    updatePicked({ ...row, pickedAt: new Date().toISOString() });
    setActiveTab("test-script");
  }

  function handleClearPicked() {
    clearPickedCompany();
    setPicked(null);
  }

  const activeCase = findCase(testCase);
  const activeType = findType(businessType);

  const notice = need ? (
    <div className="rounded-xl border border-indigo-800/60 bg-indigo-950/25 px-4 py-3 space-y-1.5">
      <p className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
        <ArrowRight size={13} />Feeding {activeCase.value} · {activeType.label}
      </p>
      <p className="text-xs leading-relaxed text-slate-400">
        {need.reason} Press <span className="text-slate-200 font-medium">Use</span> on a row
        marked &ldquo;Able to use&rdquo; and it fills{" "}
        {need.fields.map((f, i) => (
          <span key={f.from}>
            {i > 0 && (i === need.fields.length - 1 ? " and " : ", ")}
            <span className="text-slate-300">{f.source}</span> → <span className="font-mono text-slate-300">{f.target}</span>
          </span>
        ))}{" "}on the Test Script tab.
      </p>
    </div>
  ) : (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
      <p className="flex items-start gap-2 text-xs leading-relaxed text-slate-500">
        <Info size={13} className="shrink-0 mt-0.5" />
        <span>
          {activeCase.value} on {activeType.label} generates its own identity, so there is nothing
          to hand over and no <span className="text-slate-400">Use</span> button here. Pick an SSM
          business type on the Test Script tab if you want to run against a real company.
        </span>
      </p>
    </div>
  );

  return (
    <div className="relative flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Tickets</span>
          <span className="text-slate-700">/</span>
          <QrCode size={14} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">EAINT-12257</h1>
        </div>
        <span className="text-xs text-slate-600 hidden sm:block">Add DuitNow QR Payment Channel for Pre-application and Application</span>
      </header>

      <div className="flex items-center gap-1 px-4 sm:px-6 pt-4 border-b border-slate-800">
        <button type="button" onClick={() => setActiveTab("checker")} className={clsx(
          "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
          activeTab === "checker" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300",
        )}>Checker</button>
        <button type="button" onClick={() => setActiveTab("test-script")} className={clsx(
          "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
          activeTab === "test-script" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300",
        )}>Test Script</button>
      </div>

      {activeTab === "checker" ? (
        <CheckerTab
          ticket="EAINT-12257"
          notice={notice}
          onUse={need ? handleUse : undefined}
          usedKey={picked ? rowKey(picked) : undefined}
        />
      ) : (
        <TestScriptTab
          testCase={testCase}
          setTestCase={setTestCase}
          businessType={businessType}
          setBusinessType={setBusinessType}
          picked={picked}
          onUpdatePicked={updatePicked}
          onClearPicked={handleClearPicked}
          onGoToChecker={() => setActiveTab("checker")}
        />
      )}
    </div>
  );
}
