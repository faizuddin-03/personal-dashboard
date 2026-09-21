"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play, Square, Loader2, AlertTriangle,
  ChevronDown, ChevronRight, Copy, Check, Building2, X,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import type { PickedCompany } from "@/lib/companyDetailsChecker";
import { markUsed } from "@/lib/companyUsageLedger";
import {
  ENV_PRESETS, BUSINESS_TYPES, TEST_CASES, checkerNeed, findCase, findType,
} from "./scenarios";

/** Identifies this page's run in the shell-level registry. */
const RUN_KEY = "eauto/duitnow-qr";

/** Generated fresh per run. Blank = auto. */
const IDENTITY_FIELDS = [
  { key: "companyName", label: "Company name" },
  { key: "licenceNo", label: "Trading Licence No" },
  { key: "tin", label: "TIN" },
  { key: "sst", label: "SST No" },
  { key: "adminEmail", label: "Admin email" },
] as const;

type IdentityKey = (typeof IDENTITY_FIELDS)[number]["key"];

const fieldCls = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";

interface RunResult {
  exitCode: number;
  passed: boolean;
  stopped: boolean;
  preApplicationRef: string | null;
  identity: Record<string, string> | null;
  output: string;
}

export default function TestScriptTab({
  testCase, setTestCase, businessType, setBusinessType,
  picked, onUpdatePicked, onClearPicked, onGoToChecker,
}: {
  testCase: string;
  setTestCase: (v: string) => void;
  businessType: string;
  setBusinessType: (v: string) => void;
  picked: PickedCompany | null;
  onUpdatePicked: (next: PickedCompany) => void;
  onClearPicked: () => void;
  onGoToChecker: () => void;
}) {
  const [baseUrl, setBaseUrl] = useState<string>(ENV_PRESETS[0].value);
  const [ownerTag, setOwnerTag] = useState("FAIZUDDIN");
  const [emailPrefix, setEmailPrefix] = useState("qa.eaint12257");
  const [gateBudgetMin, setGateBudgetMin] = useState(5);
  const [scanBudgetMin, setScanBudgetMin] = useState(10);
  const [bo, setBo] = useState({
    approverUser: "jasons", approverPass: "Pw12345",
    assigneeUser: "mfared", assigneePass: "eauTo>!2026@",
    assigneeName: "", fiuuUser: "Gaara", fiuuPass: "letmepaywithsand",
  });
  const [overrides, setOverrides] = useState<Record<IdentityKey, string>>({
    companyName: "", licenceNo: "", tin: "", sst: "", adminEmail: "",
  });

  // The real run lives in AppShell so it survives navigating away — see
  // hooks/useBackgroundRuns.ts. Only the TS99 preview is local, since it has no
  // server side to outlive the page.
  const { runs, startRun, stopRun, clearRun } = useApp();
  const bgRun = runs[RUN_KEY];

  const [dummyRunning, setDummyRunning] = useState(false);
  const [dummyRes, setDummyRes] = useState<RunResult | null>(null);
  const [dummyLog, setDummyLog] = useState("");
  const [showLiveLog, setShowLiveLog] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [liveLogCopied, setLiveLogCopied] = useState(false);
  const [runLogCopied, setRunLogCopied] = useState(false);

  const stopRef = useRef(false);
  const liveLogRef = useRef<HTMLPreElement | null>(null);

  // One view over both sources, so the JSX below does not care which one is
  // driving. AppShell owns the real run and its polling; the dummy is local.
  const running = dummyRunning || !!bgRun?.running;
  const stopping = !!bgRun?.stopping;
  const liveLog = dummyRunning || dummyRes ? dummyLog : (bgRun?.liveLog ?? "");
  const res = dummyRes ?? (bgRun?.result as RunResult | null) ?? null;
  const error = bgRun?.error ?? "";
  const orphaned = !!bgRun?.orphaned;

  useEffect(() => {
    if (liveLogRef.current) liveLogRef.current.scrollTop = liveLogRef.current.scrollHeight;
  }, [liveLog]);

  function copyToClipboard(text: string, setFlag: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      setFlag(true);
      setTimeout(() => setFlag(false), 2000);
    }).catch(() => { /* ignore */ });
  }

  function setOverride(key: IdentityKey, value: string) {
    setOverrides(prev => ({ ...prev, [key]: value }));
  }

  function setBoField(key: keyof typeof bo, value: string) {
    setBo(prev => ({ ...prev, [key]: value }));
  }

  const activeCase = findCase(testCase);
  const activeType = findType(businessType);
  const need = checkerNeed(testCase, businessType);

  const needsCompany = !!need && !picked;
  const needsCompanyName = !!need && !!picked && !picked.companyName;

  /**
   * The TS99 preview. Nothing is spawned and nothing is called — it just walks
   * the same UI states a real run moves through (live log filling, then a
   * result card) so the layout can be judged for free.
   */
  async function runDummy() {
    clearRun(RUN_KEY);
    setDummyRunning(true);
    setDummyRes(null);
    setDummyLog("");
    stopRef.current = false;

    const lines = [
      "Running 1 test using 1 worker",
      "",
      "[identity] generating a unique dealer…",
      `[identity] company        ${picked?.companyName || "ACME PREVIEW SDN BHD"}`,
      `[identity] old BRN        ${picked?.roc || "123456-A"}`,
      `[identity] new BRN        ${picked?.newRoc || "202601012345"}`,
      `[identity] TIN            ${picked?.tin || "C12345678900"}`,
      "",
      "[human-gate] ACTION NEEDED — reCAPTCHA",
      "[human-gate] the reCAPTCHA gate — done.",
      "[dealer] pre-application form filled",
      "",
      "==========================================",
      "  ACTION NEEDED — SCAN THE QR NOW",
      "  Scan the QR on screen and APPROVE.",
      "  The amount should read RM 108.00.",
      "==========================================",
      "",
      "[human-gate] still waiting on the DuitNow QR scan — 540s left",
      "[human-gate] the DuitNow QR scan — done.",
      "[dealer] pre-application submitted and paid (uuid 7f1c…)",
      "[result] preApplicationRef=P260903/00412",
      "",
      "  1 passed (2.1m)",
    ];

    for (const line of lines) {
      if (stopRef.current) {
        setDummyRes({
          exitCode: 1, passed: false, stopped: true,
          preApplicationRef: null, identity: null,
          output: "Run stopped.",
        });
        setDummyRunning(false);
        return;
      }
      setDummyLog(prev => prev + line + "\n");
      await new Promise(r => setTimeout(r, 420));
    }

    setDummyRes({
      exitCode: 0,
      passed: true,
      stopped: false,
      preApplicationRef: "P260903/00412",
      identity: {
        companyName: picked?.companyName || "ACME PREVIEW SDN BHD",
        businessLicenseNo: picked?.roc || "123456-A",
        tin: picked?.tin || "C12345678900",
        sst: "W260903041200",
        adminEmail: `${emailPrefix}+260903-041@modefair.com`,
      },
      output: lines.join("\n"),
    });
    setDummyRunning(false);
  }

  function run() {
    if (activeCase.dummy) { void runDummy(); return; }
    setDummyRes(null);
    setDummyLog("");
    startRun<RunResult>(RUN_KEY, {
      url: "/api/eauto-duitnow-qr/run",
      liveLogUrl: "/api/eauto-duitnow-qr/live-log",
      meta: { scenario: activeCase.value, label: activeCase.label, baseUrl },
      body: {
        scenarios: [activeCase.title],
        baseUrl, businessType, ownerTag, emailPrefix,
        gateBudgetMin, scanBudgetMin,
        headless: false, video: true,
        ...bo,
        ...overrides,
        // Company ROC → Old BRN, New Company ROC → New BRN. Sent only on the
        // SSM types; the trading types have no BRN at all.
        ...(need && picked ? {
          oldBrn: picked.roc,
          newBrn: picked.newRoc,
          tin: picked.tin,
          companyName: picked.companyName || overrides.companyName,
        } : {}),
      },
    });
  }

  function stop() {
    if (activeCase.dummy) { stopRef.current = true; return; }
    stopRun(RUN_KEY);
  }

  // A minted reference means eAuto onboarded this company, so it can never be
  // used again by any ticket. This lives in an effect rather than inline in
  // run() because the run now finishes in AppShell — this page may not even have
  // been mounted at the time.
  const markedRef = useRef<string | null>(null);
  useEffect(() => {
    const result = bgRun?.result as RunResult | null;
    if (!result || bgRun?.running) return;
    if (!picked || !(result.preApplicationRef || result.passed)) return;
    if (markedRef.current === bgRun?.runId) return;
    markedRef.current = bgRun?.runId ?? null;
    markUsed(picked, {
      ticket: "EAINT-12257",
      scenario: String(bgRun?.meta?.scenario ?? ""),
      companyName: picked.companyName,
      reference: result.preApplicationRef ?? undefined,
      confirmed: true,
    });
    onClearPicked();
  }, [bgRun?.runId, bgRun?.running, bgRun?.result, bgRun?.meta, picked, onClearPicked]);

  const activeLabel = TEST_CASES.find(tc => tc.value === testCase)?.label;

  return (
      <div className="flex-1 p-4 sm:p-6 space-y-5">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Test data</p>
          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-3">
              <div>
                <label className={labelCls}>Environment</label>
                <select value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className={fieldCls}>
                  {ENV_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>Business type</label>
                <select value={businessType} onChange={e => setBusinessType(e.target.value)} className={fieldCls}>
                  {BUSINESS_TYPES.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelCls}>reCAPTCHA wait (min)</label>
                <input type="number" min={1} max={30} value={gateBudgetMin} onChange={e => setGateBudgetMin(Number(e.target.value))} className={fieldCls} />
              </div>
              <div>
                <label className={labelCls}>QR scan wait (min)</label>
                <input type="number" min={1} max={45} value={scanBudgetMin} onChange={e => setScanBudgetMin(Number(e.target.value))} className={fieldCls} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400">Unique data <span className="text-slate-600 font-normal">— blank = auto</span></p>
              <div className="space-y-2 pl-3 border-l border-slate-800">
                <div>
                  <label className={labelCls}>Owner tag</label>
                  <input value={ownerTag} onChange={e => setOwnerTag(e.target.value.toUpperCase())} placeholder="FAIZUDDIN" className={fieldCls} />
                </div>
                <div>
                  <label className={labelCls}>Email prefix</label>
                  <input value={emailPrefix} onChange={e => setEmailPrefix(e.target.value)} placeholder="qa.eaint12257" className={fieldCls} />
                </div>
                {IDENTITY_FIELDS
                  // Fields the Checker supplies, and the trading-only licence,
                  // are hidden rather than left to be overridden into conflict.
                  .filter(f => !(need && (f.key === "companyName" || f.key === "tin" || f.key === "licenceNo")))
                  .filter(f => need || f.key !== "licenceNo" || !activeType.ssm)
                  .map(f => (
                    <div key={f.key}>
                      <label className={labelCls}>{f.label}</label>
                      <input value={overrides[f.key]} onChange={e => setOverride(f.key, e.target.value)} placeholder="auto" className={fieldCls} />
                    </div>
                  ))}
              </div>
            </div>

            {/* BackOffice logins — only TS02 walks the full chain and needs them. */}
            <div className="space-y-2">
              {activeCase.needsBo ? (
                <>
                  <p className="text-[11px] font-semibold text-slate-400">BackOffice <span className="text-slate-600 font-normal">— full chain</span></p>
                  <div className="space-y-2 pl-3 border-l border-slate-800">
                    <div>
                      <label className={labelCls}>Approver <span className="text-red-400">*</span></label>
                      <input value={bo.approverUser} onChange={e => setBoField("approverUser", e.target.value)} placeholder="Username" className={fieldCls} />
                    </div>
                    <div>
                      <input type="text" value={bo.approverPass} onChange={e => setBoField("approverPass", e.target.value)} placeholder="Password" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Assignee <span className="text-red-400">*</span></label>
                      <input value={bo.assigneeUser} onChange={e => setBoField("assigneeUser", e.target.value)} placeholder="Username" className={fieldCls} />
                    </div>
                    <div>
                      <input type="text" value={bo.assigneePass} onChange={e => setBoField("assigneePass", e.target.value)} placeholder="Password" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Assignee display name</label>
                      <input value={bo.assigneeName} onChange={e => setBoField("assigneeName", e.target.value)} placeholder="auto — first option" className={fieldCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Fiuu simulator</label>
                      <input value={bo.fiuuUser} onChange={e => setBoField("fiuuUser", e.target.value)} placeholder="Username" className={fieldCls} />
                    </div>
                    <div>
                      <input type="text" value={bo.fiuuPass} onChange={e => setBoField("fiuuPass", e.target.value)} placeholder="Password" className={fieldCls} />
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-600 italic">Not needed for this test case.</p>
              )}
            </div>
          </div>

          {/* Driven entirely by the selection above — see scenarios.ts. */}
          {need && (
            picked ? (
              <div className="rounded-lg border border-indigo-800/60 bg-indigo-950/25 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Building2 size={13} className="text-indigo-400 shrink-0" />
                  <p className="text-xs font-semibold text-indigo-300 flex-1">Company from the Checker</p>
                  <button type="button" onClick={onClearPicked} title="Clear" className="text-slate-500 hover:text-slate-300">
                    <X size={13} />
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Old BRN <span className="text-slate-600">(Company ROC)</span></label>
                    <p className="font-mono text-xs text-slate-200 truncate">{picked.roc}</p>
                  </div>
                  <div>
                    <label className={labelCls}>New BRN <span className="text-slate-600">(New Company ROC)</span></label>
                    <p className="font-mono text-xs text-slate-200 truncate">{picked.newRoc}</p>
                  </div>
                  <div>
                    <label className={labelCls}>TIN</label>
                    <p className="font-mono text-xs text-slate-200 truncate">{picked.tin}</p>
                  </div>
                </div>
                <div>
                  <label className={labelCls}>Company name <span className="text-red-400">*</span></label>
                  <input
                    value={picked.companyName ?? ""}
                    onChange={e => onUpdatePicked({ ...picked, companyName: e.target.value })}
                    placeholder="the registered name that goes with this BRN"
                    className={fieldCls}
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 space-y-2">
                <p className="flex items-start gap-1.5 text-xs text-amber-300">
                  <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                  {need.reason}
                </p>
                <div className="space-y-0.5">
                  {need.fields.map(f => (
                    <p key={f.from} className="text-[11px] text-slate-500">
                      <span className="text-slate-400">{f.source}</span> → <span className="font-mono text-slate-400">{f.target}</span>
                    </p>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={onGoToChecker}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-800/40 text-amber-200 rounded-lg hover:bg-amber-800/60 transition-colors"
                >
                  <Building2 size={13} />Go to the Checker
                </button>
              </div>
            )
          )}

          <div className="flex justify-end gap-2 pt-1">
            {!running ? (
              <button
                onClick={run}
                disabled={needsCompany || !!needsCompanyName}
                title={needsCompany ? "Pick a company in the Checker tab first" : needsCompanyName ? "Fill in the company name" : undefined}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={16} />Run
              </button>
            ) : (
              <button onClick={stop} disabled={stopping} className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                <Square size={16} />{stopping ? "Stopping…" : "Stop"}
              </button>
            )}
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
        </div>

        <div className="grid gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-3">Test case</p>
            <div className="space-y-2">
              {TEST_CASES.map(tc => (
                <label key={tc.value} className={clsx(
                  "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors",
                  testCase === tc.value ? "border-indigo-600 bg-indigo-950/30" : "border-slate-700 hover:border-slate-600",
                )}>
                  <input type="radio" name="testCase" checked={testCase === tc.value} onChange={() => setTestCase(tc.value)} />
                  <span className="text-xs font-medium text-slate-200 flex-1">{tc.label}</span>
                  {tc.dummy && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-slate-800 text-slate-500 border border-slate-700">
                      Preview
                    </span>
                  )}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          {running && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={15} className="animate-spin" />
              Running {String(bgRun?.meta?.label ?? activeLabel)} against {String(bgRun?.meta?.baseUrl ?? baseUrl)}…
            </div>
          )}
          {!running && !res && !orphaned && <p className="text-sm text-slate-500">Pick a test case and hit Run.</p>}
          {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

          {/* Survived the page but not a full browser reload. */}
          {orphaned && !res && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 text-xs text-amber-200 leading-relaxed">
                A run was still going when this browser reloaded, so the dashboard lost track of it.
                It may well have finished — check the terminal. The log below is the last output captured.
              </div>
              <button onClick={() => clearRun(RUN_KEY)} className="text-[11px] text-slate-400 hover:text-slate-200 underline underline-offset-2">
                Dismiss
              </button>
            </div>
          )}

          {(running || orphaned) && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-slate-800/60 hover:bg-slate-800 transition-colors">
                <button type="button" onClick={() => setShowLiveLog(v => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
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

          {res && (
            <div className={clsx("rounded-xl border p-4 space-y-3", res.passed ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50")}>
              <div>
                <p className="text-sm font-semibold text-slate-200">
                  {res.passed ? "Flow completed ✅" : "Flow did not complete ❌"}
                </p>
                {res.preApplicationRef && <p className="text-xs text-slate-400">Pre-application {res.preApplicationRef} · {baseUrl}</p>}
              </div>

              {res.identity && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Dealer identity</p>
                  {["companyName", "businessLicenseNo", "tin", "sst", "adminEmail"].map(k => (
                    res.identity?.[k]
                      ? <p key={k} className="text-xs text-slate-400">{k}: <span className="font-mono text-slate-300">{res.identity[k]}</span></p>
                      : null
                  ))}
                </div>
              )}
            </div>
          )}

          {res?.output && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl">
              <div className="w-full flex items-center justify-between gap-2 px-4 py-2.5">
                <button onClick={() => setShowLog(v => !v)} className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
                  {showLog ? <ChevronDown size={13} /> : <ChevronRight size={13} />}Raw run log
                </button>
                <button onClick={() => copyToClipboard(res.output, setRunLogCopied)}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                  {runLogCopied ? <Check size={13} /> : <Copy size={13} />}{runLogCopied ? "Copied" : "Copy"}
                </button>
              </div>
              {showLog && <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">{res.output}</pre>}
            </div>
          )}
        </div>
      </div>
  );
}
