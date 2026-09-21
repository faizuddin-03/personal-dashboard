"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square, Loader2, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import clsx from "clsx";

// ── Custom Run — EAINT-9306 ──────────────────────────────────────────
// Added 2026-08-28, per Faizuddin, modelled on the Insurance page's own
// "Regression (Secarang)" tab (app/eauto/insurance/page.tsx): instead of
// picking a fixed test case from the "9306 TS" tab's TEST_CASES list, a
// tester hand-picks the exact scenario to build — entry point, JPJ
// Pre-Check response code, RHB payment code, whether to continue into a
// full Deregistration, whether to run the SRD checklist — and this drives
// ONE generic Playwright spec
// (scripts/eauto-edereg-precheck/tests/edereg-precheck-custom.spec.ts)
// through exactly that combination, the same way Secarang's Regression tab
// turns a form of options into `REGRESSION_*` env vars for its own script.
//
// Deliberately single-user, v1 — every "Multiple Users"/two-part/cronjob
// shape in the "9306 TS" tab stays there; this tab is for exploring
// single-user combinations that don't already have a named TS.
//
// Reuses the SAME server-side plumbing as the "9306 TS" tab (a client-
// generated `runId`, `/api/eauto-edereg-precheck/run` with `testCase:
// "custom"`, `/live-log`, and the run's own DELETE for Stop) — no new API
// routes needed; `run/route.ts`'s PROJECTS map just gained one more entry,
// and the spawn's env block passes the extra `DPC_CUSTOM_*` vars only when
// `testCase === "custom"`.

const fieldCls = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";
const LIVE_LOG_POLL_MS = 1500;
const FORM_KEY = "edereg_precheck_custom_form";

// JPJ Pre-Check (dereg-precheck-enquiry entity) response codes — mirrors
// scripts/eauto-edereg-precheck/utils/esim.ts's own named constants.
const JPJ_CODES = [
  { value: "GLB000000I", label: "OK — Approved" },
  { value: "VEL000100E", label: "Failed — Vehicle Not Exist" },
  { value: "VEL000045E", label: "Failed — JPJ error (generic)" },
  { value: "__custom", label: "Custom code…" },
];
// RHB Transfer (payment) response codes — same source.
const RHB_CODES = [
  { value: "OK", label: "OK — Approved" },
  { value: "IF", label: "Declined — Insufficient Funds" },
  { value: "RE", label: "Declined — Reset timer (~6.5min retry window)" },
  { value: "ER", label: "Declined — RHB API Down" },
  { value: "__custom", label: "Custom code…" },
];

type FormState = {
  envSegment: string; vehicleRegNo: string; jpjReceiptEmail: string;
  username: string; password: string;
  entry: "standalone" | "inline";
  jpjCode: string; jpjCodeCustom: string;
  rhbCode: string; rhbCodeCustom: string;
  continueFull: boolean; runSrd: boolean;
};
const DEFAULT_FORM: FormState = {
  envSegment: "uat1", vehicleRegNo: "", jpjReceiptEmail: "faizuddin@modefair.com",
  username: "faizuddinAATF", password: "password",
  entry: "inline",
  jpjCode: "GLB000000I", jpjCodeCustom: "",
  rhbCode: "OK", rhbCodeCustom: "",
  continueFull: true, runSrd: false,
};

function loadForm(): FormState {
  try {
    const raw = localStorage.getItem(FORM_KEY);
    if (raw) return { ...DEFAULT_FORM, ...(JSON.parse(raw) as Partial<FormState>) };
  } catch { /* ignore */ }
  return DEFAULT_FORM;
}

interface RunResult {
  status?: string;
  vehicleRegNo?: string; envSegment?: string;
  entry?: string; jpjCode?: string; rhbCode?: string;
  precheck?: Record<string, unknown>;
  gate?: Record<string, unknown>;
  deregistration?: Record<string, unknown>;
  srdChecklist?: Record<string, unknown>;
  finalUrl?: string;
}
interface RunResponse {
  result?: RunResult; error?: string; stopped?: boolean; log?: string;
  videos?: { label: string; url: string }[];
  progress?: { step: string; status: string; label?: string }[];
}

export default function CustomRunTab() {
  const [form, setForm] = useState<FormState>(typeof window !== "undefined" ? loadForm() : DEFAULT_FORM);
  const [running, setRunning] = useState(false);
  const runIdRef = useRef<string>("");
  const [error, setError] = useState("");
  const [res, setRes] = useState<RunResponse | null>(null);
  const [liveLog, setLiveLog] = useState("");
  const [showLiveLog, setShowLiveLog] = useState(true);
  const [liveLogCopied, setLiveLogCopied] = useState(false);
  const liveLogRef = useRef<HTMLPreElement | null>(null);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/eauto-edereg-precheck/live-log?runId=${runIdRef.current}`);
        const data = await r.json() as { log: string };
        setLiveLog(data.log);
      } catch { /* ignore — next poll will retry */ }
    }, LIVE_LOG_POLL_MS);
    return () => clearInterval(interval);
  }, [running]);

  useEffect(() => {
    if (liveLogRef.current) liveLogRef.current.scrollTop = liveLogRef.current.scrollHeight;
  }, [liveLog]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm(p => ({ ...p, [k]: v }));

  function copyToClipboard(text: string, onDone: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      onDone(true);
      setTimeout(() => onDone(false), 2000);
    }).catch(() => { /* ignore */ });
  }

  async function run() {
    const missing = (["vehicleRegNo", "jpjReceiptEmail"] as const).filter(k => !form[k].trim());
    if (missing.length) { setError(`Required: ${missing.join(", ")}`); return; }
    localStorage.setItem(FORM_KEY, JSON.stringify(form));
    runIdRef.current = crypto.randomUUID();
    setRunning(true); setError(""); setRes(null); setLiveLog("");
    const jpjCode = form.jpjCode === "__custom" ? form.jpjCodeCustom.trim() : form.jpjCode;
    const rhbCode = form.rhbCode === "__custom" ? form.rhbCodeCustom.trim() : form.rhbCode;
    try {
      const r = await fetch("/api/eauto-edereg-precheck/run", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          runId: runIdRef.current,
          testCase: "custom",
          envSegment: form.envSegment, vehicleRegNo: form.vehicleRegNo, jpjReceiptEmail: form.jpjReceiptEmail,
          username: form.username, password: form.password,
          customEntry: form.entry, customJpjCode: jpjCode, customRhbCode: rhbCode,
          customContinueFull: form.continueFull ? "1" : "", customRunSrd: form.runSrd ? "1" : "",
        }),
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

  async function stop() { await fetch(`/api/eauto-edereg-precheck/run?runId=${runIdRef.current}`, { method: "DELETE" }).catch(() => {}); }

  const result = res?.result;

  return (
    <div className="flex-1 p-4 sm:p-6 space-y-5">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Test data</p>
        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Environment</label>
              <input value={form.envSegment} onChange={e => set("envSegment", e.target.value)} placeholder="uat1" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>Vehicle Reg No <span className="text-red-400">*</span></label>
              <input value={form.vehicleRegNo} onChange={e => set("vehicleRegNo", e.target.value.toUpperCase())} placeholder="e.g. HXA001" className={fieldCls} />
            </div>
            <div>
              <label className={labelCls}>JPJ receipt email <span className="text-red-400">*</span></label>
              <input value={form.jpjReceiptEmail} onChange={e => set("jpjReceiptEmail", e.target.value)} placeholder="you@example.com" className={fieldCls} />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400">AATF login</p>
            <div className="space-y-2 pl-3 border-l border-slate-800">
              <div>
                <label className={labelCls}>Username</label>
                <input value={form.username} onChange={e => set("username", e.target.value)} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>Password</label>
                <input type="password" value={form.password} onChange={e => set("password", e.target.value)} className={fieldCls} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Scenario</p>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Entry point</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => set("entry", "inline")}
                  className={clsx("flex-1 px-3 py-2 text-xs rounded-lg border", form.entry === "inline" ? "border-indigo-500 bg-indigo-950/40 text-indigo-300" : "border-slate-700 text-slate-400 hover:border-slate-600")}>
                  Inline at Deregistration Step 2
                </button>
                <button type="button" onClick={() => set("entry", "standalone")}
                  className={clsx("flex-1 px-3 py-2 text-xs rounded-lg border", form.entry === "standalone" ? "border-indigo-500 bg-indigo-950/40 text-indigo-300" : "border-slate-700 text-slate-400 hover:border-slate-600")}>
                  Standalone Pre-Checking Enquiry
                </button>
              </div>
            </div>
            <div>
              <label className={labelCls}>JPJ Pre-Check response code</label>
              <select value={form.jpjCode} onChange={e => set("jpjCode", e.target.value)} className={fieldCls}>
                {JPJ_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {form.jpjCode === "__custom" && (
                <input value={form.jpjCodeCustom} onChange={e => set("jpjCodeCustom", e.target.value)} placeholder="e.g. VEL000123E"
                  className={clsx(fieldCls, "mt-2")} />
              )}
            </div>
            <div>
              <label className={labelCls}>RHB payment response code</label>
              <select value={form.rhbCode} onChange={e => set("rhbCode", e.target.value)} className={fieldCls}>
                {RHB_CODES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              {form.rhbCode === "__custom" && (
                <input value={form.rhbCodeCustom} onChange={e => set("rhbCodeCustom", e.target.value)} placeholder="e.g. XX"
                  className={clsx(fieldCls, "mt-2")} />
              )}
            </div>
          </div>
          <div className="space-y-3">
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.continueFull} onChange={e => set("continueFull", e.target.checked)} className="accent-indigo-500" />
              <span className="text-xs text-slate-300">Continue through the full Deregistration if the gate/pre-check succeeds</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-700 cursor-pointer">
              <input type="checkbox" checked={form.runSrd} onChange={e => set("runSrd", e.target.checked)} className="accent-indigo-500" />
              <span className="text-xs text-slate-300">Run the SRD checklist (details page, Yes-link, BO JPJ XML Log) if a Deregistration completes</span>
            </label>
            <p className="text-[11px] leading-snug text-slate-500">
              Unlike the numbered TS cases on the "9306 TS" tab, this run has no
              fixed pass/fail expectation — it reports whatever the app actually
              did for this exact combination.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        {running ? (
          <button onClick={stop} className="flex items-center gap-2 px-5 py-2.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            <Square size={16} />Stop
          </button>
        ) : (
          <button onClick={run} className="flex items-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
            <Play size={16} />Run
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {running && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Running against {form.envSegment}…</div>}
      {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

      {running && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-800/60">
            <button type="button" onClick={() => setShowLiveLog(v => !v)} className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
              <Loader2 size={13} className="animate-spin text-indigo-400" />Live log
            </button>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => copyToClipboard(liveLog, setLiveLogCopied)} disabled={!liveLog}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 disabled:opacity-40">
                {liveLogCopied ? <Check size={13} /> : <Copy size={13} />}{liveLogCopied ? "Copied" : "Copy"}
              </button>
              <button type="button" onClick={() => setShowLiveLog(v => !v)}>
                {showLiveLog ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
              </button>
            </div>
          </div>
          {showLiveLog && (
            <pre ref={liveLogRef} className="px-4 py-3 text-xs text-slate-400 whitespace-pre-wrap max-h-80 overflow-y-auto font-mono border-t border-slate-800">
              {liveLog || "Waiting for output…"}
            </pre>
          )}
        </div>
      )}

      {result && (
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-3">
          <p className="text-sm font-semibold text-slate-200">
            {result.status === "SUCCESS" ? "Run completed" : "Run finished with issues"}
          </p>
          <pre className="text-xs text-slate-400 font-mono whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}

      {!!res?.videos?.length && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Run recordings</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {res.videos.map((v, i) => (
              <div key={`${v.url}-${i}`}>
                <p className="text-xs text-slate-400 font-medium mb-1">{v.label}</p>
                <video src={v.url} controls className="w-full rounded-lg border border-slate-800" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
