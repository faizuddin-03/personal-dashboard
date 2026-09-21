"use client";
import { useState } from "react";
import { Building2 } from "lucide-react";
import clsx from "clsx";
import CheckerTab from "./CheckerTab";
import TestScriptTab from "./TestScriptTab";

// EAINT-12153 — [eAuto-Application] Add Payment Channels for Pre-application
// and Application. Two tabs, same shape as the Insurance and eDereg
// Pre-Check pages' own tab switchers: "Checker" is the pre-existing
// Company Details Checker (unchanged, moved into CheckerTab.tsx), "Test
// Script" is the new TS1-8 picker/runner shell (TestScriptTab.tsx). Per
// Faizuddin, 2026-09-02.

export default function CompanyDetailsCheckerPage() {
  const [activeTab, setActiveTab] = useState<"checker" | "test-script">("checker");

  return (
    <div className="relative flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">Tickets</span>
          <span className="text-slate-700">/</span>
          <Building2 size={14} className="text-slate-500" />
          <h1 className="text-sm font-semibold text-slate-200">EAINT-12153</h1>
        </div>
        <span className="text-xs text-slate-600 hidden sm:block">Add Payment Channels for Pre-application and Application</span>
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

      {activeTab === "checker" ? <CheckerTab /> : <TestScriptTab />}
    </div>
  );
}
