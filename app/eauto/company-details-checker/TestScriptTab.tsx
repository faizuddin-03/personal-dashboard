"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, AlertTriangle, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, ShieldAlert,
} from "lucide-react";
import clsx from "clsx";

// EAINT-12153 — [eAuto-Application] Add Payment Channels for Pre-application
// and Application. TS1-8 below mirror the manual test scenario sheet
// (_reference/tickets/EAINT-12153/EAINT-12153 - ... 1.9.2026.csv) as of
// 2026-09-01. No Playwright automation exists yet for this ticket — the
// picker/form/Run shape here deliberately matches the EAINT-9306 "9306 TS"
// tab (app/eauto/edereg-precheck/page.tsx) so the UI is ready the moment
// real scripts + an API route land, but Run currently calls a placeholder
// route that reports "not automated yet" rather than pretending to execute
// anything. Per Faizuddin, 2026-09-02: layout/functionality shell now,
// automation later.

const fieldCls = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";

type TestCase = "ts1" | "ts2" | "ts3" | "ts4" | "ts5" | "ts6" | "ts7" | "ts8";

// blocked = flagged in the sheet as not runnable yet (TS7/8 are "TBC with
// BA" — no steps drafted at all); staleNote surfaces the sheet's own Remarks
// column so the picker doesn't hide a known gap behind a clean-looking label.
const TEST_CASES: { value: TestCase; label: string; group: string; blocked?: boolean; staleNote?: string }[] = [
  { value: "ts1", label: "TS1 — FPX (B2B), Maybank → CIMB Bank, Success", group: "FPX (B2B)", staleNote: "Need to change scenario with the B2B handling (REQ-004–007, SRD v1.1)" },
  { value: "ts2", label: "TS2 — FPX (B2B), AmBank → Public Bank, Failed → Success", group: "FPX (B2B)", staleNote: "Need to change scenario with the B2B handling (REQ-004–007, SRD v1.1)" },
  { value: "ts3", label: "TS3 — FPX (B2C), RHB → HongLeong Bank, Success", group: "FPX (B2C)" },
  { value: "ts4", label: "TS4 — FPX (B2C), HSBC → Affin Bank, Failed → Success", group: "FPX (B2C)" },
  { value: "ts5", label: "TS5 — Card (Credit, VISA), Success", group: "Card" },
  { value: "ts6", label: "TS6 — Card (Debit, Mastercard), Failed → Success", group: "Card", staleNote: "Exact error message on decline not yet confirmed" },
  { value: "ts7", label: "TS7 — QR Code, Success", group: "QR Code", blocked: true, staleNote: "TBC with BA — no steps drafted" },
  { value: "ts8", label: "TS8 — QR Code, Failed", group: "QR Code", blocked: true, staleNote: "TBC with BA — no steps drafted" },
];

const TEST_CASE_GROUPS: { group: string; cases: typeof TEST_CASES }[] = (() => {
  const groups: { group: string; cases: typeof TEST_CASES }[] = [];
  for (const tc of TEST_CASES) {
    const last = groups[groups.length - 1];
    if (last && last.group === tc.group) last.cases.push(tc);
    else groups.push({ group: tc.group, cases: [tc] });
  }
  return groups;
})();

const BUSINESS_TYPES = [
  "Sdn Bhd / Bhd", "Sole Proprietorship / Partnership", "LLP",
  "Business Trading (Sabah)", "Business Trading (Sarawak)",
] as const;

type FormState = {
  envSegment: string; businessType: string; adminEmail: string;
  preApplicationBank: string; applicationBank: string;
  boApproverUsername: string; boApproverSecondUsername: string;
  testCase: TestCase;
};
const DEFAULT_FORM: FormState = {
  envSegment: "uat1", businessType: BUSINESS_TYPES[0], adminEmail: "azli123@gmail.com",
  preApplicationBank: "", applicationBank: "",
  boApproverUsername: "mfared", boApproverSecondUsername: "jasons",
  testCase: "ts1",
};

interface RunResult { message?: string }
interface RunResponse { result?: RunResult; error?: string }

export default function TestScriptTab() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [res, setRes] = useState<RunResponse | null>(null);
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set([TEST_CASES.find(tc => tc.value === DEFAULT_FORM.testCase)?.group ?? TEST_CASES[0].group]),
  );

  const set = (k: keyof FormState, v: string) => setForm(p => ({ ...p, [k]: v }));

  function toggleGroup(group: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  const activeCase = TEST_CASES.find(tc => tc.value === form.testCase);

  async function run() {
    setRunning(true); setError(""); setRes(null);
    try {
      const r = await fetch("/api/eauto/payment-channels-test-script/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await r.json()) as RunResponse;
      if (!r.ok && data.error) throw new Error(data.error);
      setRes(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  async function stop() {
    await fetch("/api/eauto/payment-channels-test-script/run", { method: "DELETE" }).catch(() => {});
  }

  const result = res?.result;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5">
      {/* Not-yet-automated banner — the picker/form below is a UI shell built
          ahead of any Playwright script for this ticket (see the module
          doc comment). Kept visible rather than discovered only after
          clicking Run. */}
      <div className="flex items-start gap-2.5 bg-amber-950/30 border border-amber-900/60 rounded-xl px-4 py-3 text-xs text-amber-300">
        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
        <span>
          No automation is wired up yet for EAINT-12153&apos;s payment channels — this tab is a layout/functionality
          shell matching the EAINT-9306 test runner. Run currently reports back that nothing executes yet.
        </span>
      </div>

      {/* Test data */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Test data</p>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Environment</label>
              <input value={form.envSegment} onChange={e => set("envSegment", e.target.value)} placeholder="uat1" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Business Type (Pre-Application form)</label>
              <select value={form.businessType} onChange={e => set("businessType", e.target.value)} className={fieldCls}>
                {BUSINESS_TYPES.map(bt => <option key={bt} value={bt}>{bt}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Admin / notification email</label>
              <input value={form.adminEmail} onChange={e => set("adminEmail", e.target.value)} placeholder="you@example.com" className={fieldCls} />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-400">Payment banks</p>
            <div className="space-y-3 pl-3 border-l border-slate-800">
              <div>
                <label className={labelCls}>Pre-Application step bank</label>
                <input value={form.preApplicationBank} onChange={e => set("preApplicationBank", e.target.value)} placeholder="e.g. Maybank" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Application step bank</label>
                <input value={form.applicationBank} onChange={e => set("applicationBank", e.target.value)} placeholder="e.g. CIMB Bank" className={fieldCls} />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[11px] font-semibold text-slate-400">BO approvers</p>
            <div className="space-y-3 pl-3 border-l border-slate-800">
              <div>
                <label className={labelCls}>Group-assign / Submit For Approval</label>
                <input value={form.boApproverUsername} onChange={e => set("boApproverUsername", e.target.value)} placeholder="mfared" className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Approve button</label>
                <input value={form.boApproverSecondUsername} onChange={e => set("boApproverSecondUsername", e.target.value)} placeholder="jasons" className={fieldCls} />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          {!running ? (
            <button onClick={run} disabled={activeCase?.blocked}
              className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors">
              <Play size={16} />Run
            </button>
          ) : (
            <button onClick={stop} className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors">
              <Square size={16} />Stop
            </button>
          )}
        </div>
        {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
      </div>

      {/* Test case picker */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Test case</p>
        <div className="space-y-2">
          {TEST_CASE_GROUPS.map(({ group, cases }) => {
            const isOpen = openGroups.has(group);
            const activeInGroup = cases.some(tc => tc.value === form.testCase);
            return (
              <div key={group} className="rounded-lg border border-slate-800 overflow-hidden">
                <button type="button" onClick={() => toggleGroup(group)}
                  className={clsx(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors",
                    activeInGroup ? "bg-indigo-950/30" : "bg-slate-800/60 hover:bg-slate-800",
                  )}>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                    {group}
                    {activeInGroup && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
                  </span>
                  <span className="flex items-center gap-1.5 text-[10px] text-slate-500">
                    {cases.length}
                    {isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                  </span>
                </button>
                {isOpen && (
                  <div className="p-2 space-y-2 border-t border-slate-800">
                    {cases.map(tc => (
                      <label key={tc.value} className={clsx(
                        "flex flex-col gap-1 p-2.5 rounded-lg border transition-colors",
                        tc.blocked ? "border-slate-800 opacity-60 cursor-not-allowed" : "cursor-pointer",
                        !tc.blocked && (form.testCase === tc.value ? "border-indigo-600 bg-indigo-950/30" : "border-slate-700 hover:border-slate-600"),
                      )}>
                        <span className="flex items-center gap-2">
                          <input type="radio" name="testCase" checked={form.testCase === tc.value} disabled={tc.blocked}
                            onChange={() => set("testCase", tc.value)} />
                          <span className="text-xs font-medium text-slate-200">{tc.label}</span>
                          {tc.blocked && <span className="text-[10px] font-semibold text-amber-400 uppercase tracking-wide">Blocked</span>}
                        </span>
                        {tc.staleNote && (
                          <span className="pl-5 text-[11px] text-amber-400/80 flex items-center gap-1">
                            <AlertTriangle size={11} className="shrink-0" />{tc.staleNote}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result */}
      {res && (
        <div className={clsx(
          "flex items-start gap-3 rounded-xl p-4 text-sm border",
          result ? "bg-emerald-950/30 border-emerald-900 text-emerald-300" : "bg-slate-900 border-slate-800 text-slate-400",
        )}>
          {result ? <CheckCircle2 size={16} className="shrink-0 mt-0.5" /> : <XCircle size={16} className="shrink-0 mt-0.5" />}
          <p>{result?.message ?? res.error}</p>
        </div>
      )}
    </div>
  );
}
