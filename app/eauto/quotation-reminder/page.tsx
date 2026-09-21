"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, Film, Mail,
  ChevronDown, ChevronRight, Clock, Lock, Hand, MailWarning, ShieldAlert,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";

/** Registry key for this page's run in AppShell's background-run store — see
 *  hooks/useBackgroundRuns.ts. This ticket's own cases span up to ~2h15m
 *  (TS03) or run overnight (TS07, 23:30 → 07:00), which is exactly the
 *  scenario navigating away and losing the run would ruin. */
const RUN_KEY = "eauto/quotation-reminder";

// EAINT-11864 — [eAuto-Insurance] Send Email Reminder to UCD for Generated
// Quotations Without Purchase.
//
// The cronjob runs hourly 07:00–23:00 and emails a UCD when a quotation was
// generated but never purchased. Scenario data below is transcribed verbatim
// from the team test script in
// _reference/tickets/EAINT-11864/, so the TS ids match the spreadsheet.
// See knowledge/eauto-insurance.md and knowledge/flow-insurance-purchase.md.

const ENV_PRESETS = [
  { label: "UAT1", value: "https://staging.eauto.my/uat1" },
  { label: "UAT2", value: "https://staging.eauto.my/uat2" },
  { label: "UAT3", value: "https://staging.eauto.my/uat3" },
  { label: "UAT4", value: "https://staging.eauto.my/uat4" },
  { label: "SIT1", value: "https://staging.eauto.my/sit1" },
  { label: "SIT2", value: "https://staging.eauto.my/sit2" },
  { label: "SIT3", value: "https://staging.eauto.my/sit3" },
] as const;

/**
 * How much of a case the automation can carry today.
 *  auto    — runnable now, start to finish, with no manual precondition —
 *            including creating its own eSTM first, if the case needs one.
 *  assisted— no longer used as of 2026-08-18: every case that needs an eSTM
 *            now creates it automatically (see generateQuotation()'s
 *            needsEstm flag and EstmHandoffPage for the two ways it's done).
 *            Kept as a type option in case a genuinely partial case shows up
 *            later.
 *  manual  — cannot be automated as written; run it by hand.
 */
type Automation = "auto" | "assisted" | "manual";

interface Scenario {
  id: string;
  /** MUST match the spec's test() title exactly — the runner greps by it. */
  title: string;
  trigger: string;
  /** From the SRD — display only. The automation always takes whichever
   *  insurer card the e-simulator puts first; which one that is depends on
   *  the e-simulator's response for the vehicle number, not this field.
   *  `[from Faizuddin, 2026-08-18]` */
  insurer: string;
  user: "Main UCD" | "Sub UCD";
  /** Insurance step the case drops out on. TS04 stops at 3 too, then comes
   *  back through the listing and completes the purchase. */
  stopAt?: 1 | 2 | 3;
  /** When the quotation must be generated, relative to the cron hour. */
  timing?: string;
  /** What the mailtrap should show afterwards. */
  expect: "email" | "no email" | "one email only";
  automation: Automation;
  /** Why it is not fully automated — rendered next to the case. */
  note?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "11864_TS01",
    title: "11864_TS01: Get Free Quote, stop at step 1, quotation 1 minute before the hour",
    trigger: "Get Free Quote", insurer: "Lonpac", user: "Main UCD", stopAt: 1,
    timing: "1 minute before the hour", expect: "email", automation: "auto",
    note: "Creates its own approved eSTM first (scripts/eauto-estm, to full completion) even though the entry point is Get Free Quote — no manual precondition needed.",
  },
  {
    id: "11864_TS02",
    title: "11864_TS02: eSTM entry, stop at step 2, quotation exactly on the hour",
    trigger: "eSTM", insurer: "Tokio Marine", user: "Sub UCD", stopAt: 2,
    timing: "exactly on the hour", expect: "email", automation: "auto",
    note: "Drives the eSTM's own creation flow in-process, unticks eLKM on its Payment step, and follows the auto-redirect straight into insurance — no separate login. Always uses the eSTM bypass login (faizuddinsub2), not the Main/Sub UCD fields below.",
  },
  {
    id: "11864_TS03",
    title: "11864_TS03: Banner entry, stop at step 3, two cron runs send only one email",
    trigger: "Banner", insurer: "Takaful", user: "Main UCD", stopAt: 3,
    timing: "wait for two cron runs", expect: "one email only", automation: "auto",
    note: "Same eSTM-entry start as TS02, but that first insurance entry is abandoned (Home); the same eSTM is already Approved by then, so its own listing search + View gets straight to its details-page \"Buy Insurance\" banner — the real, second entry. Always uses the eSTM bypass login, not the Main/Sub UCD fields below. Spans two cron hours, so budget ~2h15m.",
  },
  {
    id: "11864_TS04",
    title: "11864_TS04: Purchase completed before the cron runs, no reminder sent",
    trigger: "Get Free Quote", insurer: "Tokio Marine", user: "Sub UCD", stopAt: 3,
    timing: "purchase before the cron run", expect: "no email", automation: "auto",
    note: "The only case that buys. Creates its own eSTM (scripts/eauto-estm) on the same vehicle number, quotes with the IC that eSTM was created against, stops at step 3, idles 5 minutes, then pays from the Insurance Transaction Listing. Staging purchases are allowed — sandbox payment. Budget ~20 minutes plus the hold to the cron hour, and use a fresh vehicle number: a completed purchase consumes it.",
  },
  {
    id: "11864_TS05",
    title: "11864_TS05: No approved eSTM, quotation stops at step 2, no reminder sent",
    trigger: "Get Free Quote", insurer: "Chubb", user: "Sub UCD", stopAt: 2,
    expect: "no email", automation: "auto",
    note: "The only case that needs NO eSTM — it requires the vehicle not to have one. Quoting works from vehicle no + IC alone.",
  },
  {
    id: "11864_TS06",
    title: "11864_TS06: 69E redirect, stop at step 3, no reminder sent",
    trigger: "69E", insurer: "Tokio Marine", user: "Main UCD", stopAt: 3,
    expect: "no email", automation: "auto",
    note: "Sets the vehicle prefix's Response Code to VEL000069E via scripts/eauto-esim (requires the VPN), completes the eSTM normally, and follows the 69E auto-redirect into insurance — confirmed working end to end. Stops at step 3; the reminder-email check is done by hand for now (dev-side bug) rather than asserted here. Always restores the code to GLB000000I afterwards. Always uses the eSTM bypass login, not the Main/Sub UCD fields below.",
  },
  {
    id: "11864_TS07",
    title: "11864_TS07: Quotation after the last cron run, reminder arrives at 07:00",
    trigger: "Get Free Quote", insurer: "Lonpac", user: "Main UCD", stopAt: 3,
    timing: "after 23:00, verified at 07:00", expect: "no email", automation: "auto",
    note: "Creates its own approved eSTM first. Runs across midnight — schedule it for 23:30 and leave it. Verify at 07:00.",
  },
  {
    id: "11864_TS08",
    title: "11864_TS08: Complete Purchase Now with the UCD already logged in",
    trigger: "Complete Purchase Now", insurer: "Lonpac", user: "Main UCD",
    expect: "email", automation: "manual",
    note: "Starts from a link inside the reminder email — not automatable as written.",
  },
  {
    id: "11864_TS09",
    title: "11864_TS09: Complete Purchase Now from a browser with no session",
    trigger: "Complete Purchase Now", insurer: "Tokio Marine", user: "Main UCD",
    expect: "email", automation: "manual",
    note: "Starts from a link inside the reminder email — not automatable as written.",
  },
  {
    id: "11864_TS10",
    title: "11864_TS10: Complete Purchase Now used by a Sub UCD in the same company",
    trigger: "Complete Purchase Now", insurer: "Chubb", user: "Sub UCD",
    expect: "email", automation: "manual",
    note: "Starts from a link inside the reminder email — not automatable as written.",
  },
  {
    id: "11864_TS11",
    title: "11864_TS11: Complete Purchase Now opened by a UCD from a different company",
    trigger: "Complete Purchase Now", insurer: "Takaful", user: "Main UCD",
    expect: "email", automation: "manual",
    note: "Needs a UCD from a second company, and starts from the email link.",
  },
  {
    id: "11864_TS12",
    title: "11864_TS12: Complete Purchase Now opened in a fresh browser",
    trigger: "Complete Purchase Now", insurer: "Tokio Marine", user: "Main UCD",
    expect: "email", automation: "manual",
    note: "Starts from a link inside the reminder email — not automatable as written.",
  },
];

/** Quotation timing. The cron runs hourly 07:00–23:00 and picks a quotation
 *  up on the NEXT run, so when the click lands decides what is being tested. */
const SCHEDULE_MODES = [
  { value: "now", label: "Run now" },
  { value: "before-hour", label: "1 minute before the hour" },
  { value: "on-hour", label: "Exactly on the hour" },
  { value: "at", label: "At a specific time…" },
] as const;
type ScheduleMode = (typeof SCHEDULE_MODES)[number]["value"];

interface TestResult { title: string; status: string; error?: string; duration?: number }
interface RunResponse {
  results?: TestResult[]; error?: string; stopped?: boolean; video?: string; log?: string;
  progress?: { step: string; status: string; label?: string }[];
  /** Which Chrome profile the run resolved, or why it couldn't. */
  profile?: { account?: string; dir?: string; error?: string };
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

const CREDS_KEY = "quotation_reminder_creds";
type Creds = {
  ucdUser: string; ucdPass: string; subUcdUser: string; subUcdPass: string;
  vehicleNo: string; ic: string; estmBuyerEmail: string; estmMobile: string;
};
// The sub UCD is fixed for this ticket: faizuddinsub2 is the account patched to
// the eSTM bypass slot's IC, so a Sub UCD case run as anyone else fails the
// approved-eSTM precondition. Prefilled rather than hardcoded — still editable,
// and still what gets sent.
const DEFAULT_CREDS: Creds = {
  ucdUser: "", ucdPass: "", subUcdUser: "faizuddinsub2", subUcdPass: "password",
  vehicleNo: "", ic: "", estmBuyerEmail: "faizbidi03@gmail.com", estmMobile: "0123456789",
};

/**
 * Mailtrap is read by driving its web UI in a Chrome profile that is already
 * signed in — the working manual approach, not the REST API. Testing ALWAYS
 * runs in the work profile, so this is fixed here and deliberately not
 * settable from the UI. The server resolves the actual folder by Google
 * account, because folder-to-account mapping shifts when profiles change.
 */
const WORK_PROFILE_DOMAIN = "modefair.com";

function loadCreds(): Creds {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) {
      // Drop blanks before merging: a previously-saved empty sub UCD would
      // otherwise beat the default and the field would come up empty again.
      const saved = Object.fromEntries(
        Object.entries(JSON.parse(raw) as Partial<Creds>).filter(([, v]) => typeof v === "string" && v.trim()),
      );
      return { ...DEFAULT_CREDS, ...saved };
    }
  } catch { /* ignore */ }
  return DEFAULT_CREDS;
}

const AUTOMATION_BADGE: Record<Automation, { text: string; cls: string; icon: typeof Play }> = {
  auto:     { text: "Automated",   cls: "bg-green-500/15 text-green-400",  icon: Play },
  assisted: { text: "Needs eSTM",  cls: "bg-amber-500/15 text-amber-400",  icon: Clock },
  manual:   { text: "Manual",      cls: "bg-slate-600/25 text-slate-400",  icon: Hand },
};

export default function QuotationReminderPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  // UAT1 — where the insurance code changes for EAINT-11864 are deployed. This
  // is the environment the ticket must be tested on; testing elsewhere tests
  // the old code. (The DOM captures in knowledge/ came from UAT4, so selectors
  // are uat4-derived — if one misses here, that is the likely reason.)
  const [baseUrl, setBaseUrl] = useState<string>(ENV_PRESETS[0].value);
  const [scheduleMode, setScheduleMode] = useState<ScheduleMode>("now");
  const [scheduleAt, setScheduleAt] = useState("");
  const [headless, setHeadless] = useState(false);

  // The run lives in AppShell (hooks/useBackgroundRuns.ts) so it survives
  // navigating away and back. This matters more here than almost anywhere
  // else in the dashboard: TS03 runs ~2h15m and TS07 spans overnight
  // (23:30 → 07:00) — exactly the kind of run nobody watches continuously.
  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const [formError, setFormError] = useState("");
  const error = formError || bgRun?.error || "";
  const res = (bgRun?.result as RunResponse | null) ?? null;
  const [showLog, setShowLog] = useState(false);
  const [showNotes, setShowNotes] = useState(true);
  // TS06 drives scripts/eauto-esim, which only reaches the e-simulator over
  // the VPN. Opening this gate runs nothing — only "Confirmed" starts the run.
  const [vpnAsk, setVpnAsk] = useState(false);

  const saved = typeof window !== "undefined" ? loadCreds() : DEFAULT_CREDS;
  const [creds, setCreds] = useState<Creds>(saved);
  const set = (k: keyof Creds, v: string) => setCreds(p => ({ ...p, [k]: v }));

  const runnable = SCENARIOS.filter(s => s.automation !== "manual");
  const selectedScenarios = SCENARIOS.filter(s => selected.has(s.id));
  const needsSubUcd = selectedScenarios.some(s => s.user === "Sub UCD");
  // TS06 sets the e-simulator's Response Code before the eSTM flow runs —
  // reachable only over the VPN. See scripts/eauto-quotation-reminder/utils/esim.ts.
  const needsVpn = selectedScenarios.some(s => s.id === "11864_TS06");

  function toggle(id: string) {
    const s = SCENARIOS.find(x => x.id === id);
    if (s?.automation === "manual") return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function run() {
    if (!selected.size) { setFormError("Select at least one test case."); return; }
    const missing: string[] = [];
    if (!creds.ucdUser.trim()) missing.push("Main UCD username");
    if (!creds.ucdPass.trim()) missing.push("Main UCD password");
    if (needsSubUcd && !creds.subUcdUser.trim()) missing.push("Sub UCD username");
    if (!creds.vehicleNo.trim()) missing.push("vehicle no");
    if (!creds.ic.trim()) missing.push("IC");
    if (scheduleMode === "at" && !scheduleAt) missing.push("scheduled time");
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    setFormError("");

    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-quotation-reminder/run",
      stopUrl: "/api/eauto-quotation-reminder/run",
      meta: { scenarios: selectedScenarios.map(s => s.id), scheduleMode },
      body: {
        scenarios: selectedScenarios.map(s => s.title),
        baseUrl, scheduleMode, scheduleAt, headless, ...creds,
      },
    });
  }

  function stop() { stopRun(RUN_KEY); }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Mail size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">11864</h1>
        <span className="text-xs text-slate-600 hidden md:block">
          Send Email Reminder to UCD for Generated Quotations Without Purchase · hourly cron 07:00–23:00
        </span>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr]">
        <aside className="border-r border-slate-800 p-4 space-y-3">
          <div>
            <label className={label}>Environment</label>
            <select value={baseUrl} onChange={e => setBaseUrl(e.target.value)} className={field}>
              {ENV_PRESETS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* The cron picks a quotation up on the NEXT hourly run, so when the
              click lands is the variable several cases are built around. */}
          <div>
            <label className={label}><Clock size={11} className="inline mr-1 -mt-0.5" />Set schedule</label>
            <select value={scheduleMode} onChange={e => setScheduleMode(e.target.value as ScheduleMode)} className={field}>
              {SCHEDULE_MODES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            {scheduleMode === "at" && (
              <input
                type="datetime-local"
                value={scheduleAt}
                onChange={e => setScheduleAt(e.target.value)}
                className={clsx(field, "mt-2")}
              />
            )}
            {scheduleMode === "on-hour" && (
              <p className="mt-1 text-[11px] leading-snug text-slate-500">
                23:00 races the last cron run — use 23:30 for the dead-window case.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Vehicle No <span className="text-red-400">*</span></label>
              <input value={creds.vehicleNo} onChange={e => set("vehicleNo", e.target.value.toUpperCase())} placeholder="WXY1234" className={field} /></div>
            <div><label className={label}>IC <span className="text-red-400">*</span></label>
              <input value={creds.ic} onChange={e => set("ic", e.target.value)} placeholder="900101015432" className={field} /></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div><label className={label}>Main UCD user <span className="text-red-400">*</span></label>
              <input value={creds.ucdUser} onChange={e => set("ucdUser", e.target.value)} className={field} /></div>
            <div><label className={label}>Password <span className="text-red-400">*</span></label>
              <input type="password" value={creds.ucdPass} onChange={e => set("ucdPass", e.target.value)} className={field} /></div>
          </div>

          {/* Every runnable case except TS05 creates its own eSTM (either via
              scripts/eauto-estm directly, or in-process through
              EstmHandoffPage) and needs a buyer email + mobile for it — so
              this stays visible regardless of which cases are selected,
              rather than gating on any one scenario id. */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>Buyer&apos;s email — eSTM leg</label>
              <input value={creds.estmBuyerEmail} onChange={e => set("estmBuyerEmail", e.target.value)} placeholder="faizbidi03@gmail.com" className={field} />
            </div>
            <div>
              <label className={label}>Buyer&apos;s mobile — eSTM leg</label>
              <input value={creds.estmMobile} onChange={e => set("estmMobile", e.target.value)} placeholder="0123456789" className={field} />
            </div>
          </div>
          {needsSubUcd && (
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>Sub UCD user <span className="text-red-400">*</span></label>
                <input value={creds.subUcdUser} onChange={e => set("subUcdUser", e.target.value)} className={field} /></div>
              <div><label className={label}>Password</label>
                <input type="password" value={creds.subUcdPass} onChange={e => set("subUcdPass", e.target.value)} className={field} /></div>
            </div>
          )}
          {needsSubUcd && (
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-400/90">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              <span>
                Main and Sub UCD must have <strong className="font-semibold">different</strong> email
                addresses — these cases assert which user received the reminder.
              </span>
            </p>
          )}

          {/* Fixed by policy — testing always runs in the work profile, so this
              is shown, not chosen. The server resolves it by Google account
              rather than folder name; see the run route. */}
          <div>
            <label className={label}>Chrome profile</label>
            <div className="flex items-center gap-2 px-3 py-2 border border-slate-800 rounded-lg bg-slate-900/60">
              <Lock size={12} className="text-slate-500 shrink-0" />
              <span className="text-sm text-slate-300 flex-1">{WORK_PROFILE_DOMAIN}</span>
              <span className="text-[10px] text-slate-600 uppercase tracking-wider">Fixed</span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)}
              className="accent-indigo-600" />
            Headless
          </label>

          <div className="flex gap-2 pt-1">
            {!running ? (
              <button onClick={() => needsVpn ? setVpnAsk(true) : run()} disabled={!selected.size}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
                <Play size={14} />Run {selected.size || ""} case{selected.size === 1 ? "" : "s"}
              </button>
            ) : (
              <button onClick={stop} disabled={bgRun?.stopping}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
              </button>
            )}
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
        </aside>

        <main className="p-4 sm:p-6 space-y-5">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">
                Test cases <span className="text-slate-600 normal-case tracking-normal">· 12 from the team script</span>
              </p>
              <button onClick={() => setSelected(new Set(runnable.map(s => s.id)))}
                className="text-xs text-indigo-400 hover:text-indigo-300">Select automated</button>
              <button onClick={() => setSelected(new Set())}
                className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
            </div>
            <div className="divide-y divide-slate-800/70">
              {SCENARIOS.map(s => {
                const badge = AUTOMATION_BADGE[s.automation];
                const isManual = s.automation === "manual";
                return (
                  <label key={s.id}
                    className={clsx(
                      "flex gap-3 px-4 py-2.5",
                      isManual ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-slate-800/40"
                    )}>
                    <input type="checkbox" checked={selected.has(s.id)} disabled={isManual}
                      onChange={() => toggle(s.id)} className="mt-1 accent-indigo-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-mono text-slate-300">{s.id}</span>
                        <span className={clsx("text-[10px] px-1.5 py-0.5 rounded font-medium flex items-center gap-1", badge.cls)}>
                          {isManual ? <Lock size={9} /> : <badge.icon size={9} />}{badge.text}
                        </span>
                        <span className={clsx(
                          "text-[10px] px-1.5 py-0.5 rounded font-medium",
                          s.expect === "email" ? "bg-blue-500/15 text-blue-400" : "bg-slate-600/25 text-slate-400"
                        )}>{s.expect}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.trigger} · {s.insurer} · {s.user}
                        {s.stopAt && <> · stop at step {s.stopAt}</>}
                        {s.timing && <> · {s.timing}</>}
                      </p>
                      {showNotes && s.note && (
                        <p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.note}</p>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
            <button onClick={() => setShowNotes(v => !v)}
              className="w-full px-4 py-2 text-[11px] text-slate-600 hover:text-slate-400 border-t border-slate-800">
              {showNotes ? "Hide" : "Show"} automation notes
            </button>
          </div>

          {running && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={15} className="animate-spin" />
              {(bgRun?.meta?.scheduleMode ?? scheduleMode) === "now"
                ? "Generating the quotation…"
                : "Holding at the quote form until the scheduled minute…"}
            </div>
          )}
          {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

          {/* Survived the page but not a full browser reload — for TS03/TS07
              this is the one that matters, since nobody watches a run for
              2+ hours continuously. */}
          {orphaned && !res && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="flex-1 text-xs text-amber-200 leading-relaxed">
                A run was still going when this browser reloaded, so the dashboard lost track of it.
                It may well have finished — check the terminal or Mailtrap directly.
              </p>
            </div>
          )}

          {/* An unresolvable profile blocks the email half only — the quotation
              was still created, so say which half is affected. */}
          {res?.profile?.error && (
            <div className="rounded-xl border border-amber-800/50 bg-amber-950/25 p-4">
              <p className="flex items-start gap-2 text-sm font-semibold text-amber-300">
                <MailWarning size={15} className="shrink-0 mt-0.5" />
                Email check blocked — the quotation itself was still created
              </p>
              <pre className="mt-2 ml-[23px] text-xs text-amber-200/80 whitespace-pre-wrap font-mono">{res.profile.error}</pre>
            </div>
          )}
          {res?.profile?.account && (
            <p className="flex items-center gap-1.5 text-xs text-slate-500">
              <Lock size={11} />Mailtrap read as {res.profile.account}
              <span className="text-slate-700">· profile {res.profile.dir}</span>
            </p>
          )}

          {res?.results && res.results.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/70">
              {res.results.map((r, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    {r.status === "passed"
                      ? <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                      : <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />}
                    <p className="text-sm text-slate-300 flex-1">{r.title}</p>
                  </div>
                  {r.error && <pre className="mt-2 ml-6 text-xs text-red-400/90 whitespace-pre-wrap font-mono">{r.error}</pre>}
                </div>
              ))}
            </div>
          )}

          {res?.video && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><Film size={12} />Run recording</p>
              <video src={res.video} controls className="w-full rounded-lg border border-slate-800" />
            </div>
          )}

          {res?.log && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl">
              <button onClick={() => setShowLog(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200">
                {showLog ? <ChevronDown size={13} /> : <ChevronRight size={13} />}Raw run log
              </button>
              {showLog && <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">{res.log}</pre>}
            </div>
          )}
        </main>
      </div>

      {/* VPN gate for TS06. Opening this runs nothing — only "Confirmed" starts the run. */}
      {vpnAsk && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setVpnAsk(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <ShieldAlert size={16} />Is your VPN connected?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              TS06 sets the e-simulator&apos;s Response Code before the eSTM flow runs.
              eSIM lives at <span className="font-mono text-slate-300">172.30.202.114</span>, which is only
              reachable on the VPN. Without it the run just times out.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setVpnAsk(false)}
                className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">
                Not yet — cancel
              </button>
              <button onClick={() => { setVpnAsk(false); run(); }}
                className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Confirmed VPN Connected
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
