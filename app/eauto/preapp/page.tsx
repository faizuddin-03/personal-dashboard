"use client";
import { useEffect, useState, type ReactNode } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, Copy, Check, ClipboardList, FilePlus2, ShieldAlert, Shuffle,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import OnboardingCompanyDrop from "@/components/OnboardingCompanyDrop";
import { useOnboardingCompanies, spend } from "@/lib/onboardingCompanies";
import { freeRows, rowKey } from "@/lib/onboardingCompanyTypes";
import EautoBrowserSignIn from "@/components/EautoBrowserSignIn";

// Create Pre-Application — eAuto module page (2026-10-21). Faizuddin: "create
// a preapplication, where i can choose the payment pass or failed for now.
// later i will tell you what else i can choose. as for the business type, make
// it always use sdn bhd. basically this function is to create a quick
// transaction to check the listing".
//
// Suite: scripts/eauto-preapp (pages copied from scripts/eauto-12153). The run
// stops after the Pre-Application payment — no BO approval, no Application.
// Layout, form fields and defaults copied from app/eauto/12153/page.tsx.

const RUN_KEY = "eauto/preapp";

type Payment = "pass" | "fail";
/** MUST match scripts/eauto-preapp/tests/preapp.spec.ts test() titles exactly. */
const TITLES: Record<Payment, string> = {
  pass: "PREAPP_PASS: Pre-Application (Sdn Bhd), payment Success",
  fail: "PREAPP_FAIL: Pre-Application (Sdn Bhd), payment Failed",
};
const PAYMENT_LABEL: Record<Payment, string> = { pass: "Success", fail: "Failed" };
/** FPX (B2C) banks the suite knows — keys of BANKS in scripts/eauto-preapp/data/scenarios.ts. */
const BANKS = ["Maybank", "CIMB Bank", "AmBank", "Public Bank", "RHB", "HongLeong Bank", "HSBC", "Affin Bank"] as const;
type Bank = (typeof BANKS)[number];
// Faizuddin, 2026-10-21: "can choose bank, but make the default Maybank".
const DEFAULT_BANK: Bank = "Maybank";

interface RunStep { title: string; duration: number; error?: string; steps: RunStep[] }
interface EvidenceItem { label: string; url: string; kind: "video" | "image" | "file" }
interface DetailItem { label: string; value: string }
interface CheckResult {
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  durationMs: number;
  friendlyError?: string;
  steps: RunStep[];
  evidence?: EvidenceItem[];
  video?: string;
  details?: DetailItem[];
}
interface RunResponse {
  result?: { checks: CheckResult[]; passed: number; failed: number; total: number };
  error?: string;
  stopped?: boolean;
  log?: string;
  evidence?: EvidenceItem[];
  details?: DetailItem[];
  runId?: string;
  runLabel?: string;
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

function Section({ id, title, extra, collapsed, onToggle, children }: { id: string; title: ReactNode; extra?: ReactNode; collapsed: boolean; onToggle: (id: string) => void; children: ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div role="button" tabIndex={0} onClick={() => onToggle(id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(id); } }}
        className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 text-left hover:bg-slate-800/30 cursor-pointer">
        {collapsed ? <ChevronRight size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">{title}</span>
        {extra && <span onClick={e => e.stopPropagation()} className="flex items-center gap-3">{extra}</span>}
      </div>
      {!collapsed && children}
    </div>
  );
}

function StepList({ steps }: { steps: RunStep[] }) {
  return (
    <ul className="space-y-1">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs">
          {s.error ? <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" /> : <CheckCircle2 size={12} className="text-green-500/80 shrink-0 mt-0.5" />}
          <span className={clsx("flex-1", s.error ? "text-red-300" : "text-slate-300")}>{s.title}</span>
        </li>
      ))}
    </ul>
  );
}

// Company-name counters are SHARED with /eauto/12153 and /eauto/12257, so a
// name made here is never reused there (same key, same "SDN" counter).
const NAME_COUNTER_KEY = "eauto_12153_name_counters";
function loadSdnCounter(): number {
  try { const raw = localStorage.getItem(NAME_COUNTER_KEY); if (raw) return JSON.parse(raw).SDN ?? 2; } catch { /* ignore */ }
  return 2;
}
const sdnName = (n: number) => `UDIN ONBOARD TESTING SDN${String(n).padStart(4, "0")}`;

/** Directors named after game characters — same list as app/eauto/12153/page.tsx. */
const GAME_CHARACTERS = ["DOOMFIST", "KIRIKO", "TRACER", "GENJI", "MERCY", "REINHARDT", "SONIC", "TAILS", "KNUCKLES", "SHADOW", "MARIO", "LUIGI", "YOSHI", "BOWSER", "PEACH", "KRATOS", "ATREUS", "ALOY", "NATHAN DRAKE", "JOEL", "ELLIE", "SACKBOY", "SPYRO", "CRASH"];
// Director MyKad: a new one per TS run (Faizuddin, 2026-10-22). Year "20" plus 10
// random digits — no real MyKad starts with 20, so it never matches a real person
// and eAuto no longer reports "The company and director existed in eAuto system".
const randomIc = () => "20" + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
const randomDirector = () => `${GAME_CHARACTERS[Math.floor(Math.random() * GAME_CHARACTERS.length)]} DIRECTOR A`;

const CREDS_KEY = "eauto_preapp_creds";
interface Creds {
  boInstance: string;
  esimUser: string; esimPass: string; seedEsim: boolean;
  fiuuUser: string; fiuuPass: string;
  directorIc: string; adminName: string; adminMobile: string;
  gateMinutes: string;
}
// Same defaults as app/eauto/12153/page.tsx (Faizuddin, 2026-10-21).
const DEFAULT_CREDS: Creds = {
  boInstance: "eauto",
  esimUser: "admin", esimPass: "admin", seedEsim: true,
  fiuuUser: "Gaara", fiuuPass: "Letmepaywithsand",
  directorIc: "030217141005", adminName: "MUHAMMAD FAIZUDDIN BIN BIDI", adminMobile: "0137428615",
  gateMinutes: "5",
};
function loadCreds(): Creds {
  try { const raw = localStorage.getItem(CREDS_KEY); if (raw) return { ...DEFAULT_CREDS, ...JSON.parse(raw) }; } catch { /* ignore */ }
  return DEFAULT_CREDS;
}

/** The company is typed each time (or picked) — never prefilled. */
interface Company { name: string; oldBrn: string; newBrn: string; tin: string; directorName: string }
const EMPTY_COMPANY: Company = { name: "", oldBrn: "", newBrn: "", tin: "", directorName: "" };

const UI_STATE_KEY = "eauto_preapp_ui_state";
interface UiState { payment: Payment; bank: Bank; headless: boolean; detailed: boolean; collapsed: Record<string, boolean>; company: Company }
// New page: Headless OFF (a person ticks the reCAPTCHA), Detailed ON.
const DEFAULT_UI_STATE: UiState = { payment: "pass", bank: DEFAULT_BANK, headless: false, detailed: true, collapsed: {}, company: EMPTY_COMPANY };
function loadUiState(): UiState {
  try { const raw = localStorage.getItem(UI_STATE_KEY); if (raw) return { ...DEFAULT_UI_STATE, ...JSON.parse(raw) }; } catch { /* ignore */ }
  return DEFAULT_UI_STATE;
}


export default function CreatePreApplicationPage() {
  const savedUi = typeof window !== "undefined" ? loadUiState() : DEFAULT_UI_STATE;
  const [payment, setPayment] = useState<Payment>(savedUi.payment);
  const [bank, setBank] = useState<Bank>(BANKS.includes(savedUi.bank) ? savedUi.bank : DEFAULT_BANK);
  const [headless, setHeadless] = useState(savedUi.headless);
  const [detailed, setDetailed] = useState(savedUi.detailed);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(savedUi.collapsed);
  const [company, setCompanyState] = useState<Company>(savedUi.company);
  const setCompany = (k: keyof Company, v: string) => setCompanyState(p => ({ ...p, [k]: v }));
  function toggleSection(id: string) { setCollapsed(prev => ({ ...prev, [id]: !prev[id] })); }

  const [creds, setCreds] = useState<Creds>(typeof window !== "undefined" ? loadCreds() : DEFAULT_CREDS);
  const set = <K extends keyof Creds>(k: K, v: Creds[K]) => setCreds(p => ({ ...p, [k]: v }));
  const [sdnCounter, setSdnCounter] = useState<number>(() => (typeof window !== "undefined" ? loadSdnCounter() : 2));

  // Always Sdn Bhd: the company comes from the shared Excel (components/OnboardingCompanyDrop),
  // the next free Sdn Bhd row unless one is typed or picked.
  const { list: companyList, error: companyListError, isUsed, ledger: companyLedger } = useOnboardingCompanies();
  function pickCompany(roc: string) {
    const row = companyList?.rows.find(r => rowKey(r) === roc);
    if (row) setCompanyState(p => ({ ...p, oldBrn: row.roc, newBrn: row.newRoc, tin: row.tin }));
  }
  useEffect(() => {
    if (!companyList) return;
    setCompanyState(p => {
      const spent = companyList.rows.find(r => r.roc === p.oldBrn && isUsed(r));
      if (p.oldBrn && !spent) return p;
      const row = freeRows(companyList, "ROC", isUsed)[0];
      return row ? { ...p, oldBrn: row.roc, newBrn: row.newRoc, tin: row.tin } : p;
    });
  }, [companyList, isUsed]);

  useEffect(() => {
    try { localStorage.setItem(UI_STATE_KEY, JSON.stringify({ payment, bank, headless, detailed, collapsed, company })); } catch { /* full */ }
  }, [payment, bank, headless, detailed, collapsed, company]);

  const [formError, setFormError] = useState("");
  const [stopAsk, setStopAsk] = useState(false);
  const [vpnAsk, setVpnAsk] = useState(false);
  const [logCopied, setLogCopied] = useState(false);


  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const error = formError || bgRun?.error || "";
  const res = (bgRun?.result as RunResponse | null) ?? null;
  // Companies the run skipped (another tester's eSIM rows) or switched to are spent too.
  useEffect(() => {
    for (const m of (res?.log ?? "").matchAll(/^COMPANY-(?:SKIP|USED) (\{.*\})\s*$/gm)) {
      try { const c = JSON.parse(m[1]); spend({ roc: c.oldBrn, newRoc: c.newBrn, tin: c.tin }, "Create Pre-Application", "preapp", ""); } catch { /* ignore */ }
    }
  }, [res?.log]);


  const autoName = sdnName(sdnCounter);

  function requestRun() {
    const missing: string[] = [];
    if (!company.oldBrn.trim()) missing.push("Old BRN");
    if (!company.newBrn.trim()) missing.push("New BRN");
    if (!company.tin.trim()) missing.push("TIN");
    if (!creds.fiuuPass.trim()) missing.push("Fiuu simulator login");
    if (creds.seedEsim && !creds.esimPass.trim()) missing.push("eSIM login");
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    setFormError("");
    if (creds.seedEsim) setVpnAsk(true); else run();
  }

  function run() {
    setVpnAsk(false);
    // The company name comes off the shared SDN counter unless one was typed;
    // the counter advances once the run starts (a name is "used" pass or fail).
    const typed = company.name.trim().toUpperCase();
    const name = typed || autoName;
    if (!typed) {
      const next = sdnCounter + 1;
      setSdnCounter(next);
      try {
        const all = JSON.parse(localStorage.getItem(NAME_COUNTER_KEY) ?? "{}");
        localStorage.setItem(NAME_COUNTER_KEY, JSON.stringify({ ...all, SDN: next }));
      } catch { /* ignore */ }
    }
    try { localStorage.setItem(CREDS_KEY, JSON.stringify(creds)); } catch { /* full */ }
    // Spent once started (cross-ticket ledger), so the next run gets a fresh company.
    spend({ roc: company.oldBrn.trim().toUpperCase(), newRoc: company.newBrn.trim(), tin: company.tin.trim().toUpperCase() }, "Create Pre-Application", "preapp", name);
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-preapp/run",
      stopUrl: "/api/eauto-preapp/run",
      meta: { payment, bank, company: name },
      body: {
        scenarios: [TITLES[payment]],
        headless, detailed, record: false,
        env: {
          EPREAPP_BO_INSTANCE: creds.boInstance.trim(),
          EPREAPP_ESIM_USER: creds.esimUser.trim(), EPREAPP_ESIM_PASS: creds.esimPass,
          EPREAPP_SEED_ESIM: creds.seedEsim ? "1" : "0",
          EPREAPP_FIUU_USER: creds.fiuuUser.trim(), EPREAPP_FIUU_PASS: creds.fiuuPass,
          EPREAPP_ADMIN_NAME: creds.adminName.trim(), EPREAPP_ADMIN_MOBILE: creds.adminMobile.trim(),
          EPREAPP_BANK: bank,
          EPREAPP_GATE_MINUTES: creds.gateMinutes.trim() || "5",
          EPREAPP_COMPANY_NAME: name,
          EPREAPP_OLD_BRN: company.oldBrn.trim().toUpperCase(),
          EPREAPP_NEW_BRN: company.newBrn.trim(),
          EPREAPP_TIN: company.tin.trim().toUpperCase(),
          EPREAPP_DIRECTOR_NAME: (company.directorName.trim() || randomDirector()).toUpperCase(),
          EPREAPP_DIRECTOR_IC: randomIc(),
          // Next free Sdn Bhd companies, used if eSIM holds another tester's rows for the first.
          EPREAPP_COMPANY_ALTERNATES: JSON.stringify(freeRows(companyList, "ROC", isUsed).filter(r => r.roc !== company.oldBrn.trim().toUpperCase()).slice(0, 5).map(r => ({ oldBrn: r.roc, newBrn: r.newRoc, tin: r.tin }))),
        },
      },
    });
  }


  const checks = res?.result?.checks ?? [];
  const fullLog = res?.log ?? "";

  async function copyLog() {
    if (!fullLog) return;
    try { await navigator.clipboard.writeText(fullLog); setLogCopied(true); setTimeout(() => setLogCopied(false), 2000); } catch { /* denied */ }
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <FilePlus2 size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">Create Pre-Application</h1>
        <span className="text-xs text-slate-600 hidden md:block">A quick UCD Pre-Application (Sdn Bhd) to check the listing</span>
      </header>

      <div className="p-4 sm:p-6 space-y-5">
        <Section id="config" title="Run configuration" collapsed={!!collapsed.config} onToggle={toggleSection}>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={label}>Instance (staging)</label>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.boInstance} onChange={e => set("boInstance", e.target.value.replace(/\//g, ""))} placeholder="eauto" className={field} />
                <p className="mt-1 text-[11px] text-slate-500">staging.eauto.my/<span className="font-mono">{creds.boInstance || "eauto"}</span>/public/login/ — /obs has no instance</p>
              </div>
              <div>
                <label className={label}>eSIM login {creds.seedEsim && <span className="text-red-400">*</span>}</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.esimUser} onChange={e => set("esimUser", e.target.value)} className={field} />
                  <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.esimPass} onChange={e => set("esimPass", e.target.value)} className={field} />
                </div>
                <label className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <input type="checkbox" checked={creds.seedEsim} onChange={e => set("seedEsim", e.target.checked)} className="accent-indigo-600" />Seed the SSM rows in eSIM first (VPN)
                </label>
              </div>
              <div>
                <label className={label}>Fiuu FPX simulator login <span className="text-red-400">*</span></label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.fiuuUser} onChange={e => set("fiuuUser", e.target.value)} className={field} />
                  <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.fiuuPass} onChange={e => set("fiuuPass", e.target.value)} className={field} />
                </div>
              </div>
              <div>
                <label className={label}>reCAPTCHA wait (minutes)</label>
                <input inputMode="numeric" autoComplete="off" value={creds.gateMinutes} onChange={e => set("gateMinutes", e.target.value.replace(/\D/g, ""))} onBlur={() => set("gateMinutes", String(Math.min(30, Math.max(1, Number(creds.gateMinutes) || 5))))} className={field} />
                <p className="mt-1 text-[11px] text-slate-500">A person ticks it in the browser window — keep Headless off</p>
                <EautoBrowserSignIn />
              </div>
              <div>
                <label className={label}>Director IC</label>
                <div className={clsx(field, "text-slate-500")}>New for every run: 20 + 10 random digits</div>
              </div>
              <div className="sm:col-span-2">
                <label className={label}>Admin In Charge name / mobile</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.adminName} onChange={e => set("adminName", e.target.value.toUpperCase())} className={field} />
                  <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.adminMobile} onChange={e => set("adminMobile", e.target.value.replace(/\D/g, ""))} className={clsx(field, "w-36 shrink-0")} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Email: a fresh qa.fz.…@testingz.com per run</p>
              </div>
            </div>
          </div>
        </Section>

        <Section id="transaction" title="Pre-Application" collapsed={!!collapsed.transaction} onToggle={toggleSection}>
          <div className="p-4 space-y-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div>
                <span className={label}>Business type</span>
                <p className="text-sm text-slate-200">Sdn Bhd / Bhd <span className="text-[11px] text-slate-500">(always)</span></p>
              </div>
              <div>
                <span className={label}>Payment</span>
                <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
                  {(["pass", "fail"] as Payment[]).map(p => (
                    <button key={p} type="button" onClick={() => setPayment(p)} aria-pressed={payment === p}
                      className={clsx("flex items-center gap-1.5 px-3 py-1 rounded-md text-xs transition-colors",
                        payment === p ? (p === "pass" ? "bg-green-900/60 text-green-200" : "bg-red-900/60 text-red-200") : "text-slate-400 hover:text-slate-200")}>
                      {p === "pass" ? <CheckCircle2 size={12} /> : <XCircle size={12} />}{PAYMENT_LABEL[p]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <span className={label}>Bank — Online Banking (Personal)</span>
                <select value={bank} onChange={e => setBank(e.target.value as Bank)} className={clsx(field, "w-44")}>
                  {BANKS.map(b => <option key={b} value={b}>{b}{b === DEFAULT_BANK ? " (default)" : ""}</option>)}
                </select>
              </div>
              <p className="text-[11px] text-slate-500 flex-1 min-w-[16rem]">
                FPX B2C, {bank}, on the Fiuu simulator. {payment === "pass" ? "Approved → Pre-Application Submitted for Review." : "Status 51 (Insufficient Funds) → Unsuccessful Payment; left unpaid, no retry."} Stops there — no BO approval.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="lg:col-span-2">
                <span className={label}>Company name</span>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={company.name} onChange={e => setCompany("name", e.target.value.toUpperCase())} placeholder={autoName} className={field} />
                <p className="mt-1 text-[11px] text-slate-500">Blank = <span className="font-mono">{autoName}</span> (counter shared with 12153 / 12257)</p>
              </div>
              <div>
                <span className={label}>Director name</span>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={company.directorName} onChange={e => setCompany("directorName", e.target.value.toUpperCase().replace(/[^A-Z ]/g, ""))} placeholder="random game character" className={field} />
                  <button type="button" title="Pick a game character" onClick={() => setCompany("directorName", randomDirector())} className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"><Shuffle size={14} /></button>
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <span className={label}>Company from the Excel (Sdn Bhd / Bhd)</span>
                {(() => {
                  const rows = (companyList?.rows ?? []).filter(r => r.type === "ROC");
                  const free = freeRows(companyList, "ROC", isUsed);
                  return (
                    <select value={rows.map(rowKey).find(k => k === rowKey({ roc: company.oldBrn, newRoc: company.newBrn, tin: company.tin })) ?? ""} onChange={e => pickCompany(e.target.value)} className={field}>
                      <option value="">{companyList ? `— ${free.length} free of ${rows.length} Sdn Bhd / Bhd —` : "— drop the company Excel below —"}</option>
                      {[...free, ...rows.filter(r => !free.includes(r))].map(r => <option key={rowKey(r)} value={rowKey(r)}>{isUsed(r) ? "✗ used" : r.overall === "PASS" ? "✓ free" : "✗ in eAuto"} · {r.roc} · {r.newRoc} · {r.tin}</option>)}
                    </select>
                  );
                })()}
                <div className="mt-2"><OnboardingCompanyDrop list={companyList} error={companyListError} isUsed={isUsed} ledger={companyLedger} /></div>
              </div>
              <div>
                <span className={label}>Old BRN (with check letter) <span className="text-red-400">*</span></span>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={company.oldBrn} onChange={e => setCompany("oldBrn", e.target.value.toUpperCase())} placeholder="KT0307773-P" className={field} />
              </div>
              <div>
                <span className={label}>New BRN <span className="text-red-400">*</span></span>
                <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={company.newBrn} onChange={e => setCompany("newBrn", e.target.value.replace(/\D/g, ""))} placeholder="12 digits" className={field} />
              </div>
              <div>
                <span className={label}>TIN <span className="text-red-400">*</span></span>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={company.tin} onChange={e => setCompany("tin", e.target.value.toUpperCase())} className={field} />
              </div>
            </div>
            <p className="text-[11px] text-slate-500">One real company per run — eAuto refuses a company that is already onboarded. Pick a &quot;✓ free&quot; one.</p>

            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)} className="accent-indigo-600" />Headless
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-400" title="Slows the run down and highlights each button/field/value being acted on or checked.">
                <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} className="accent-indigo-600" />Detailed (slow + highlighted)
              </label>
              {headless && <span className="text-[11px] text-amber-400 flex items-center gap-1"><AlertTriangle size={11} />Headless hides the reCAPTCHA — the run will wait and time out</span>}
              <div className="flex-1" />
              {!running ? (
                <button onClick={requestRun} className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  <Play size={14} />Create Pre-Application ({bank} · {PAYMENT_LABEL[payment]})
                </button>
              ) : (
                <button onClick={() => setStopAsk(true)} disabled={bgRun?.stopping} className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                  <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
                </button>
              )}
            </div>
            {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
          </div>
        </Section>

        {stopAsk && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setStopAsk(false)}>
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <p className="flex items-center gap-2 text-sm font-semibold text-red-300"><AlertTriangle size={16} />Stop this run?</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setStopAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">No — keep running</button>
                <button onClick={() => { setStopAsk(false); stopRun(RUN_KEY); }} className="flex-1 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600">Yes — stop the run</button>
              </div>
            </div>
          </div>
        )}
        {vpnAsk && (
          <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setVpnAsk(false)}>
            <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
              <p className="flex items-center gap-2 text-sm font-semibold text-amber-300"><ShieldAlert size={16} />Is your VPN connected?</p>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setVpnAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">Not yet — cancel</button>
                <button onClick={run} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirmed VPN Connected</button>
              </div>
            </div>
          </div>
        )}

        {running && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Creating the Pre-Application ({PAYMENT_LABEL[(bgRun?.meta?.payment as Payment) ?? payment]})… tick the reCAPTCHA in the browser window.</div>}
        {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}
        {orphaned && !res && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="flex-1 text-xs text-amber-200 leading-relaxed">A run was still going when this browser reloaded, so the dashboard lost track of it. It may well have finished — check the terminal.</p>
          </div>
        )}

        {checks.map((c, i) => {
          const det = c.details ?? [];
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                {c.status === "passed" ? <CheckCircle2 size={15} className="text-green-400 shrink-0" /> : <XCircle size={15} className="text-red-400 shrink-0" />}
                <p className="text-sm text-slate-200 font-medium flex-1 min-w-0">{c.title}</p>
                <span className="text-[11px] text-slate-600 shrink-0">{Math.round(c.durationMs / 1000)}s</span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-slate-800">
                <div className="min-w-0">
                  {det.length > 0 && (
                    <div className="p-4 border-b border-slate-800">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><ClipboardList size={12} />Details</p>
                      <dl className="space-y-1.5">
                        {det.map((d, j) => <div key={j} className="flex items-baseline gap-3 text-xs"><dt className="text-slate-500 shrink-0 max-w-[45%]">{d.label}</dt><dd className="text-slate-200 font-mono break-all">{d.value}</dd></div>)}
                      </dl>
                    </div>
                  )}
                </div>
                <div className="p-4 min-w-0">
                  {c.friendlyError && <p className="mb-2 text-xs text-red-400/90">{c.friendlyError}</p>}
                  {c.steps.length > 0 ? <StepList steps={c.steps} /> : <p className="text-xs text-slate-600">No steps recorded.</p>}
                </div>
              </div>
            </div>
          );
        })}


        {fullLog && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">Detailed log</p>
              <button onClick={copyLog} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors" title="Copy the full log">
                {logCopied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}{logCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="px-4 py-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">{fullLog}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
