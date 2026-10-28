"use client";
import { useState } from "react";
import { Barcode } from "lucide-react";
import clsx from "clsx";
import E2ETestsTab from "./E2ETestsTab";
import UserAccessRegressionTab from "./UserAccessRegressionTab";
import { DeploySoonHeader } from "@/lib/useDeployReminder";

// EAINT-12166 — [eAuto-BackOffice] Service Hub: Enable DO Creation for
// Device Purchase with Interim Document Upload Space, +
// EAINT-12167 — [eAuto-BackOffice] Service Hub: Allow Ops to Input Device SN
// on Device Purchase SR Info Page When Updating Delivery Status to Arranged.
//
// Two tabs: the combined E2E suite (E2ETestsTab.tsx) and the standalone
// "User Access Regression" permissions check (UserAccessRegressionTab.tsx,
// not tied to either ticket — per Faizuddin, 2026-09-24: "put it in page
// 12166, but a different tab"). Both tabs stay mounted (hidden via CSS, not
// unmounted) so a background run in one survives switching to the other —
// same pattern as app/eauto/insurance/page.tsx's tabs.

export default function DevicePurchaseDoPage() {
  const [activeTab, setActiveTab] = useState<"e2e" | "access">("e2e");

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Barcode size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">12166</h1>
        <DeploySoonHeader keys={["EAINT-12166","EAINT-12167"]} />
        <span className="text-xs text-slate-600 hidden md:block">
          Delivery Order generation (12166) + Device Serial No. capture (12167) — combined E2E
        </span>
      </header>

      <div className="flex items-center gap-1 px-4 sm:px-6 pt-3 border-b border-slate-800">
        <button
          onClick={() => setActiveTab("e2e")}
          className={clsx(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "e2e"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300",
          )}
        >
          E2E Tests
        </button>
        <button
          onClick={() => setActiveTab("access")}
          className={clsx(
            "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
            activeTab === "access"
              ? "border-indigo-500 text-indigo-400"
              : "border-transparent text-slate-500 hover:text-slate-300",
          )}
        >
          User Access Regression
        </button>
      </div>

      <div className={clsx("flex-1 flex flex-col", activeTab !== "e2e" && "hidden")}>
        <E2ETestsTab />
      </div>
      <div className={clsx("flex-1 flex flex-col", activeTab !== "access" && "hidden")}>
        <UserAccessRegressionTab />
      </div>
    </div>
  );
}
