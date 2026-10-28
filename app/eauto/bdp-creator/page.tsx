"use client";
import { useEffect, useState } from "react";
import { Play, Square, Loader2, CheckCircle2, AlertTriangle, Fingerprint, Copy, Building2, Clock, CalendarCheck } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";

/** Registry key for this page's run in AppShell's background-run store — see
 *  hooks/useBackgroundRuns.ts. Keeps the run (and its result) alive across
 *  navigating to another dashboard page and back. */
const RUN_KEY = "eauto/bdp-creator";

// Create BDP — one-click Biometric Device Purchase test-data generator.
//
// NOT connected to any TS or ticket. Buys a device as UCD with the chosen
// quantity/install options and exits at the appointment/slot page without
// booking, leaving a fresh, unallocated Reference No. — the exact precondition
// EAINT-12167's Update Shipping Details / Device Serial No. testing needs.

const ENV_PRESETS = [
  { label: "UAT1", value: "https://staging.eauto.my/uat1" },
  { label: "UAT2", value: "https://staging.eauto.my/uat2" },
  { label: "UAT3", value: "https://staging.eauto.my/uat3" },
  { label: "UAT4", value: "https://staging.eauto.my/uat4" },
  { label: "SIT1", value: "https://staging.eauto.my/sit1" },
  { label: "SIT2", value: "https://staging.eauto.my/sit2" },
  { label: "SIT3", value: "https://staging.eauto.my/sit3" },
] as const;

const CREDS_KEY = "bdp_creator_ucd_creds";
// Every past successful run, newest first — never overwritten by a new run,
// only prepended to. Per Faizuddin, 2026-09-24: "everytime i run, it wont
// remove the old data. it will just shift down."
const HISTORY_KEY = "bdp_creator_history";
const MAX_HISTORY = 200; // generous cap so localStorage can't grow unbounded

function loadCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return { ucdUser: "", ucdPass: "", ...JSON.parse(raw) };
  } catch {}
  return { ucdUser: "", ucdPass: "" };
}

function saveCreds(c: { ucdUser: string; ucdPass: string }) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(c));
}

interface CreateBdpResult {
  reference: string | null;
  txnId: string;
  deviceQty: number;
  extraInstalls: number;
  skipInstall: boolean;
  companyName?: string;
  createdAt?: string;
  appointmentBooked?: boolean;
}
interface RunResponse {
  result?: CreateBdpResult | null;
  error?: string;
  stopped?: boolean;
  stderr?: string;
  stdout?: string;
}

function loadHistory(): CreateBdpResult[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function saveHistory(entries: CreateBdpResult[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, MAX_HISTORY)));
  } catch { /* full or unavailable — history just stops growing this session */ }
}

function fmtDateTime(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

export default function BdpCreatorPage() {
  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const res = (bgRun?.result as RunResponse | null) ?? null;
  const [formError, setFormError] = useState("");
  const error = formError || bgRun?.error || res?.error || "";
  const [copied, setCopied] = useState("");

  const [baseUrl, setBaseUrl] = useState<string>(ENV_PRESETS[0].value);
  const [deviceQty, setDeviceQty] = useState(1);
  const [extraInstalls, setExtraInstalls] = useState(0);
  const [skipInstall, setSkipInstall] = useState(false);
  const [headless, setHeadless] = useState(true);

  const saved = typeof window !== "undefined" ? loadCreds() : { ucdUser: "", ucdPass: "" };
  const [ucdUser, setUcdUser] = useState(saved.ucdUser);
  const [ucdPass, setUcdPass] = useState(saved.ucdPass);

  const [history, setHistory] = useState<CreateBdpResult[]>(() =>
    typeof window !== "undefined" ? loadHistory() : [],
  );

  // Every time a run completes with a real reference, prepend it to history
  // instead of replacing anything — dedupe on txnId so a page reload that
  // re-hydrates the same finished run's result doesn't double-add it.
  useEffect(() => {
    const entry = res?.result;
    if (!entry?.reference) return;
    setHistory((prev) => {
      if (prev.some((h) => h.txnId === entry.txnId)) return prev;
      const next = [entry, ...prev];
      saveHistory(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res?.result?.txnId]);

  function run() {
    if (!ucdUser.trim() || !ucdPass.trim()) {
      setFormError("Enter the UCD username and password.");
      return;
    }
    setFormError("");
    saveCreds({ ucdUser, ucdPass });
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto/bdp-creator/run",
      stopUrl: "/api/eauto/bdp-creator/run",
      meta: { deviceQty, extraInstalls: skipInstall ? 0 : extraInstalls, skipInstall, env: baseUrl },
      body: {
        deviceQty,
        extraInstalls: skipInstall ? 0 : extraInstalls,
        skipInstall,
        headless,
        baseUrl,
        ucdUser: ucdUser.trim(),
        ucdPass,
      },
    });
  }

  function copyReference(ref: string | null | undefined, key: string) {
    if (!ref) return;
    navigator.clipboard.writeText(ref).then(() => {
      setCopied(key);
      setTimeout(() => setCopied((cur) => (cur === key ? "" : cur)), 1500);
    }).catch(() => {});
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Fingerprint size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">Create BDP</h1>
        <span className="text-xs text-slate-600 hidden md:block">
          Biometric Device Purchase test-data generator · not connected to any TS
        </span>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="border-r border-slate-800 p-4 space-y-3">
          <div>
            <label className={label}>Environment</label>
            <select value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className={field}>
              {ENV_PRESETS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={label}>UCD Username <span className="text-red-400">*</span></label>
            <input value={ucdUser} onChange={e => setUcdUser(e.target.value)} className={field} />
          </div>
          <div>
            <label className={label}>UCD Password <span className="text-red-400">*</span></label>
            <input type="password" value={ucdPass} onChange={e => setUcdPass(e.target.value)} className={field} />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Company Name on each card is read live off this account&apos;s own UCD home page — no need to type it.
            </p>
          </div>

          <div>
            <label className={label}>Device Quantity</label>
            <input type="number" min={1} max={40} value={deviceQty}
              onChange={e => setDeviceQty(Math.max(1, Math.min(40, Number(e.target.value) || 1)))}
              className={field} />
            <p className="mt-1 text-[11px] leading-snug text-slate-500">
              Capped at 40 — the UCD Portal&apos;s own purchase-quantity cap (EAINT-12166 REQ-007).
            </p>
          </div>

          <div className={clsx(skipInstall && "opacity-50 pointer-events-none")}>
            <label className={label}>Extra Software Installations</label>
            <input type="number" min={0} value={extraInstalls}
              onChange={e => setExtraInstalls(Math.max(0, Number(e.target.value) || 0))}
              className={field} disabled={skipInstall} />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={skipInstall} onChange={e => setSkipInstall(e.target.checked)}
              className="accent-indigo-600" />
            Opt out of software installation entirely
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)}
              className="accent-indigo-600" />
            Headless
          </label>

          <div className="pt-1">
            {!running ? (
              <button onClick={run}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                <Play size={14} />Create BDP
              </button>
            ) : (
              <button onClick={() => stopRun(RUN_KEY)} disabled={bgRun?.stopping}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
              </button>
            )}
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
        </aside>

        <main className="p-4 sm:p-6 flex justify-center">
          <div className="w-full max-w-2xl space-y-5">
            {running && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Loader2 size={15} className="animate-spin" />
                Buying {String(bgRun?.meta?.deviceQty ?? deviceQty)} device(s)
                {bgRun?.meta?.skipInstall ? "" : ` + ${String(bgRun?.meta?.extraInstalls ?? extraInstalls)} extra install(s)`}
                {" "}on {String(bgRun?.meta?.env ?? baseUrl).replace("https://staging.eauto.my/", "")}…
              </div>
            )}

            {orphaned && !res && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
                <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="flex-1 text-xs text-amber-200 leading-relaxed">
                  A run was still going when this browser reloaded, so the dashboard lost track of it.
                  It may well have finished — check the terminal.
                </p>
              </div>
            )}

            {history.length > 0 && (
              <div className="space-y-3">
                {history.map((h, i) => {
                  const key = h.txnId || `${h.reference}-${i}`;
                  return (
                    <div key={key} className={clsx(
                      "rounded-xl border border-green-800/50 bg-green-950/25 p-4",
                      i === 0 && "ring-1 ring-green-700/40",
                    )}>
                      <p className="flex items-center gap-2 text-sm font-semibold text-green-300">
                        <CheckCircle2 size={15} />BDP created
                        {i === 0 && <span className="text-[10px] font-normal uppercase tracking-wide text-green-500/70">Latest</span>}
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="font-mono text-lg text-slate-100">{h.reference}</span>
                        <button onClick={() => copyReference(h.reference, key)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 rounded-md hover:bg-slate-800"
                          title="Copy Reference No.">
                          <Copy size={14} />
                        </button>
                        {copied === key && <span className="text-[11px] text-green-400">Copied</span>}
                      </div>
                      <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
                        <div className="flex justify-between border-t border-green-900/30 py-1">
                          <span className="text-slate-500">Devices</span>
                          <span className="text-slate-300">{h.deviceQty}</span>
                        </div>
                        <div className="flex justify-between border-t border-green-900/30 py-1">
                          <span className="text-slate-500">Extra installs</span>
                          <span className="text-slate-300">{h.skipInstall ? "opted out" : h.extraInstalls}</span>
                        </div>
                        <div className="flex justify-between border-t border-green-900/30 py-1">
                          <span className="text-slate-500 flex items-center gap-1"><Building2 size={11} />Company</span>
                          <span className="text-slate-300 truncate max-w-[60%] text-right">{h.companyName || "—"}</span>
                        </div>
                        <div className="flex justify-between border-t border-green-900/30 py-1">
                          <span className="text-slate-500 flex items-center gap-1"><Clock size={11} />Created</span>
                          <span className="text-slate-300">{fmtDateTime(h.createdAt)}</span>
                        </div>
                        <div className="flex justify-between border-t border-green-900/30 py-1 col-span-2">
                          <span className="text-slate-500 flex items-center gap-1"><CalendarCheck size={11} />Appointment booked</span>
                          <span className="text-slate-300">{h.appointmentBooked ? "Yes" : "No"}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

            {res && !res.stopped && !res.result?.reference && !error && (
              <div className="rounded-xl border border-amber-800/50 bg-amber-950/25 p-4">
                <p className="flex items-center gap-2 text-sm text-amber-300">
                  <AlertTriangle size={15} />
                  Purchase may have gone through, but no Reference No. came back — check the listing manually.
                </p>
              </div>
            )}

            {(res?.stderr || res?.stdout) && (
              <details className="bg-slate-900 border border-slate-800 rounded-xl">
                <summary className="cursor-pointer px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200">
                  Raw run output
                </summary>
                <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                  {res.stderr}
                  {res.stdout}
                </pre>
              </details>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
