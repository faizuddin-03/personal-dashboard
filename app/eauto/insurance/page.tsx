import { Shield } from "lucide-react";

export default function InsurancePage() {
  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-6 h-14 flex items-center gap-2">
        <span className="text-xs text-slate-600">eAuto</span>
        <span className="text-slate-700">/</span>
        <h1 className="text-sm font-semibold text-slate-200">Insurance</h1>
      </header>

      {/* Placeholder */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4">
          <Shield size={24} className="text-slate-600" />
        </div>
        <h2 className="text-base font-semibold text-slate-300 mb-2">Insurance Automation</h2>
        <p className="text-sm text-slate-600 max-w-xs">
          Automation scripts will live here. You&apos;ll be able to search and run them from this page.
        </p>
      </div>
    </div>
  );
}
