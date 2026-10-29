"use client";
import { useEffect, useRef, useState } from "react";
import {
  Play, Square, Loader2, CheckCircle2, AlertTriangle, Film,
  ClipboardList, ChevronDown, ChevronRight, ShieldAlert, Copy, Check, ArrowRightCircle, X, Info, Wifi,
  Download, Scissors, XCircle, Circle,
} from "lucide-react";
import clsx from "clsx";
import CustomRunTab from "./CustomRunTab";
import JpjCodeCheckerTab from "./JpjCodeCheckerTab";
// BulkRunPanel is HIDDEN, not deleted — per Faizuddin (this session), its own
// "run several different TS one at a time" job is now built directly into
// this page (the Test case picker below went from a single radio pick to a
// multi-select, and Run drives a queue). The component/route/logic still
// exist untouched in case they're needed again.
// import BulkRunPanel from "./BulkRunPanel";
import { useApp } from "@/components/AppShell";

// Registry key for this page's run in AppShell's background-run store — see
// hooks/useBackgroundRuns.ts. The run itself now lives there so it survives
// navigating to another dashboard page and back; only page-local UI state
// (video selection, continuations bookkeeping, expanded rows) stays here.
// Also now the ONE run channel for both a single test case and a multi-pick
// queue — there is no separate "bulk" key anymore (see the queue state below).
const RUN_KEY = "eauto/edereg-precheck";

// A run's own `fetch()` to /run doesn't resolve until the WHOLE test
// finishes (the route only replies once the child process closes) — there
// is no live progress channel while a run is in flight. This is the one
// exception: CPC_E2E_TS5/TS11 Part 2's RHB "RE" reset-timer wait
// (~6.5 minutes, DeregTransactionPage.waitOutPaymentResetTimer) is exactly
// when Faizuddin's VPN tends to disconnect, and the automation needs it
// again right after, to re-steer eSIM before retrying payment. Polling a
// separate lightweight status route (app/api/eauto-edereg-precheck/
// wait-status) while `running` is true is the only way to warn about that
// mid-run. Per Faizuddin, 2026-08-24 — warn ~1 minute before eSIM is
// touched again, not tied to any confirmed VPN timeout duration.
const WAIT_STATUS_POLL_MS = 5_000;
const VPN_REMINDER_THRESHOLD_MS = 60_000;

// EAINT-9306 — [eAuto-AATF] To Set eDereg Pre-Check Transaction as a
// Compulsory Step in the eDereg Transaction Creation Flow.
//
// Happy path, continuous: login -> AATF home -> eDEREG menu -> eDereg
// Pre-Checking Enquiry -> vehicle no. + consent -> pay -> JPJ result -> Done
// -> straight into creating a Deregistration transaction for the SAME
// vehicle no. (Owner MyKad auth -> Vehicle/gate -> AATF consent + auth ->
// JPJ Check -> Payment -> Deregister), bypassing the three MyKad/thumbprint
// auth points via the local emulator (knowledge/mykad-emulator.md).
//
// Some ticket cases (the 6-month-expiry block) need a dev to manually patch
// data mid-scenario (backdate a JPJ-approval timestamp) — those run as TWO
// separate Playwright projects, "Part 1" (stops right before the patch is
// needed) and "Part 2" (continues after it's done), per Faizuddin's
// 2026-08-24 workflow. Part 1 can be run multiple times with different
// vehicle numbers, so each completed Part 1 run generates its OWN
// continuation entry (TS + vehicle no. + transaction id) rather than a
// single static "Part 2" option — there is no continuation to pick until at
// least one Part 1 run has finished.
//
// REVAMPED (this session), per Faizuddin: the picker below now supports
// selecting SEVERAL test cases (and/or several continuations) at once. Hit
// Run and they execute strictly ONE AT A TIME, in order, as a queue — same
// "keep going through individual failures, Stop to abort" behaviour the old
// separate Bulk Run panel had, just folded into this one picker instead of
// living in its own sibling panel. Multiple test cases auto-increment the
// Vehicle Reg No. field above starting from whatever's typed in; multiple
// continuations always reuse the vehicle no. their own Part 1 run already
// used (never incremented — that vehicle/transaction was already patched by
// dev for that exact number).

import type {
  RunResult, RunResponse, TestCase, FormState, PendingContinuation,
} from "./shared";
import { TEST_CASES, TEST_CASE_GROUPS, VPN_GATE_SKIP_TEST_CASES, RE_WAIT_TEST_CASES, CONTINUATIONS_KEY } from "./shared";

const fieldCls = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const labelCls = "block text-xs font-medium text-slate-400 mb-1.5";

const FORM_KEY = "edereg_precheck_form";
// Confirmed by Faizuddin, 2026-08-21 — this ticket's automation runs on uat1,
// and faizuddinAATF/password is the default AATF test account. subUsername/
// subPassword (User B, "Multiple Users" cases) confirmed 2026-08-26 — same
// company, sub-account under the main one. mykadNric/mykadName (+ Sub
// variants) are injected directly into the MyKad emulator's INSERTCARD
// payload (utils/mykadEmulator.ts) — NOT a "profile name" lookup (tried and
// reverted the same day: a fresh Playwright browser context never shares
// localStorage with a colleague's own real browser, so a saved
// control-panel profile is invisible to automation). Each colleague types
// their own AATF account's NRIC/name here instead — no code change needed.
const DEFAULT_FORM: FormState = {
  envSegment: "uat1", vehicleRegNo: "", jpjReceiptEmail: "faizuddin@modefair.com",
  username: "faizuddinAATF", password: "password",
  subUsername: "faizAATFsub2", subPassword: "password",
  mykadNric: "030217141005", mykadName: "MUHAMMAD FAIZUDDIN BIN BIDI",
  mykadNricSub: "030117-14-1005", mykadNameSub: "MUHAMMAD FAIZUDDIN SUB2",
  // User C — different company (MU_TS2 onward), confirmed 2026-08-26. Name
  // is genuinely "23 , 24,25" per the DB, not a placeholder.
  subUsername2: "AzfarAATF", subPassword2: "abcd1234",
  mykadNricSub2: "020406081081", mykadNameSub2: "23 , 24,25",
  testCase: "happy-path",
};

// TEST_CASES/TEST_CASE_GROUPS/VPN_GATE_SKIP_TEST_CASES/RE_WAIT_TEST_CASES
// now live in ./shared.ts (imported above).

// PendingContinuation/CONTINUATIONS_KEY now live in ./shared.ts (imported
// above).

function loadForm(): FormState {
  try {
    const raw = localStorage.getItem(FORM_KEY);
    if (raw) {
      const saved = Object.fromEntries(
        Object.entries(JSON.parse(raw) as Partial<FormState>).filter(([, v]) => typeof v === "string" && v.trim()),
      );
      return { ...DEFAULT_FORM, ...saved };
    }
  } catch { /* ignore */ }
  return DEFAULT_FORM;
}

function loadContinuations(): PendingContinuation[] {
  try {
    const raw = localStorage.getItem(CONTINUATIONS_KEY);
    if (raw) return JSON.parse(raw) as PendingContinuation[];
  } catch { /* ignore */ }
  return [];
}

/** Increments the TRAILING digit run in a vehicle no., zero-padded to the
 *  same width as the original (e.g. "HXA001" -> "HXA002", "HXA099" ->
 *  "HXA100" — note the width grows past 3 digits here, same as a car
 *  odometer, deliberately not clamped). Falls back to just appending "1" if
 *  the initial value has no trailing digits at all (e.g. "HXA"). Moved here
 *  from the old BulkRunPanel.tsx (now hidden) — this page is the only
 *  caller now. */
function nextVehicleRegNo(vehicleRegNo: string): string {
  const m = /^(.*?)(\d+)$/.exec(vehicleRegNo);
  if (!m) return `${vehicleRegNo}1`;
  const [, prefix, digits] = m;
  const width = digits.length;
  const next = (parseInt(digits, 10) + 1).toString().padStart(width, "0");
  return `${prefix}${next}`;
}

function generateVehicleNumbers(initial: string, count: number): string[] {
  const out: string[] = [initial];
  let cur = initial;
  for (let i = 1; i < count; i++) {
    cur = nextVehicleRegNo(cur);
    out.push(cur);
  }
  return out;
}

// Part 2 / multi-user cases each depend on a SPECIFIC vehicle no. a dev
// already patched, or on a second/third account — auto-incrementing a fresh
// vehicle no. for every run doesn't fit that shape. Flagged per-case rather
// than hidden from the list, since it's still possible to run them (just
// probably not useful without matching setup).
function looksMismatched(tc: TestCase): boolean {
  return /part2$/.test(tc) || tc.startsWith("mu-");
}

/** Short one-line summary of a finished run's own result payload. */
function summarizeResult(data: RunResponse): string {
  if (data.stopped) return "Stopped";
  const r = data.result;
  if (!r) return data.error ? `Error: ${data.error}` : "No result";
  if (r.part === 1 && r.status === "PART1_DONE") {
    return `Part 1 done — send Vehicle ${r.vehicleRegNo ?? "?"} / Transaction ${r.transactionId ?? "?"} to dev for the patch, then run the continuation`;
  }
  const bits: string[] = [r.status ?? "?"];
  if (r.precheck?.jpjStatusLabel) bits.push(`precheck ${r.precheck.jpjStatusLabel}`);
  if (r.deregistration?.jpjDeregistrationStatus) bits.push(`dereg ${r.deregistration.jpjDeregistrationStatus}`);
  if (r.transactionId) bits.push(`id ${r.transactionId}`);
  return bits.join(" · ");
}

function formatTrimTime(s: number): string {
  if (!Number.isFinite(s)) return "0:00.0";
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return `${m}:${sec}`;
}

// Single-video trim — added 2026-08-28 per Faizuddin, to cut long dead
// pauses (RE reset-timer waits, dashboard pause/continue holds) out of a
// run recording before sharing it. Marks one or more "keep" segments off
// the SAME <video> player already used to preview the recording (no
// separate scrubber UI — the native player's own seek bar + currentTime is
// enough to mark points), then sends them to trim-video/route.ts's ffmpeg
// trim+concat. Deliberately single-video only — combining two recordings
// side by side is a separate, not-yet-built feature.
function VideoTrimPanel({ url }: { url: string }) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [open, setOpen] = useState(false);
  const [markStart, setMarkStart] = useState<number | null>(null);
  const [segments, setSegments] = useState<{ start: number; end: number }[]>([]);
  const [trimming, setTrimming] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  function markSegmentStart() {
    setMarkStart(videoRef.current?.currentTime ?? 0);
    setError("");
  }
  function markSegmentEnd() {
    const t = videoRef.current?.currentTime ?? 0;
    if (markStart === null) { setError("Mark a start point first."); return; }
    if (t <= markStart) { setError("End point must be after the start point."); return; }
    setSegments(prev => [...prev, { start: markStart, end: t }].sort((a, b) => a.start - b.start));
    setMarkStart(null);
    setError("");
  }
  function removeSegment(i: number) {
    setSegments(prev => prev.filter((_, idx) => idx !== i));
  }

  async function exportTrimmed() {
    if (!segments.length) { setError("Add at least one segment to keep."); return; }
    setTrimming(true); setError(""); setResultUrl(null);
    try {
      const r = await fetch("/api/eauto-edereg-precheck/trim-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, segments }),
      });
      const data = await r.json() as { url?: string; error?: string };
      if (!r.ok || !data.url) { setError(data.error ?? "Trim failed."); return; }
      setResultUrl(data.url);
    } catch {
      setError("Trim request failed — is the dashboard's dev server still running?");
    } finally {
      setTrimming(false);
    }
  }

  return (
    <div>
      <video ref={videoRef} src={url} controls className="w-full rounded-lg border border-slate-800" />
      <div className="mt-1.5 border-t border-slate-800 pt-1.5">
        <button type="button" onClick={() => setOpen(v => !v)}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300">
          {open ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
          <Scissors size={11} />Trim{segments.length > 0 ? ` (${segments.length})` : ""}
        </button>
        {open && (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-slate-500">Play the video above, then mark the start and end of each stretch you want to KEEP — everything else gets cut.</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button type="button" onClick={markSegmentStart}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300">
                Mark start{markStart !== null ? ` (${formatTrimTime(markStart)})` : ""}
              </button>
              <button type="button" onClick={markSegmentEnd} disabled={markStart === null}
                className="text-[11px] px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed">
                Mark end — add segment
              </button>
            </div>
            {segments.length > 0 && (
              <ul className="space-y-1">
                {segments.map((s, i) => (
                  <li key={i} className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-800/60 rounded px-2 py-1">
                    <span>Keep {formatTrimTime(s.start)} → {formatTrimTime(s.end)}</span>
                    <button type="button" onClick={() => removeSegment(i)} className="text-slate-500 hover:text-red-400">
                      <X size={11} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="text-[11px] text-red-400">{error}</p>}
            <button type="button" onClick={exportTrimmed} disabled={!segments.length || trimming}
              className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-colors">
              {trimming ? <Loader2 size={12} className="animate-spin" /> : <Scissors size={12} />}
              {trimming ? "Trimming…" : "Export trimmed video"}
            </button>
            {resultUrl && (
              <div className="space-y-1 pt-1">
                <p className="text-[11px] text-emerald-400">Trimmed video ready:</p>
                <video src={resultUrl} controls className="w-full rounded-lg border border-slate-800" />
                <a href={resultUrl} download className="inline-flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2">
                  <Download size={11} />Download trimmed video
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Every rich per-run field the old single-result view used to render,
 *  factored out so both a one-item and a many-item queue show exactly the
 *  same amount of detail per item — nothing was dropped when this merged
 *  with the old Bulk Run panel's (deliberately condensed) own version. */
function ResultDetail({ result }: { result: RunResult }) {
  return (
    <>
      {result.precheck && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Pre-Checking Enquiry</p>
          {result.precheck.responseDesc && <p className="text-xs text-slate-400">JPJ response: {result.precheck.responseDesc}</p>}
          {result.precheck.transactionId && <p className="text-xs text-slate-500 font-mono">{result.precheck.transactionId}</p>}
        </div>
      )}
      {result.deregistration && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Deregistration Transaction</p>
          {result.deregistration.jpjCheckResponseCode && <p className="text-xs text-slate-400">Step 4 JPJ check: {result.deregistration.jpjCheckStatus} — {result.deregistration.jpjCheckResponseCode}</p>}
          {result.deregistration.jpjDeregistrationStatus && <p className="text-xs text-slate-400">Step 6 JPJ Deregistration: {result.deregistration.jpjDeregistrationStatus}</p>}
          {result.deregistration.transactionId && <p className="text-xs text-slate-500 font-mono">{result.deregistration.transactionId}</p>}
        </div>
      )}
      {result.inlineRetry?.usedInlinePrecheck && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Inline pre-check at step 2</p>
          <p className="text-xs text-slate-400">JPJ status: {result.inlineRetry.jpjStatus} — {result.inlineRetry.responseDesc}</p>
          <p className="text-xs text-slate-400">
            Gate satisfied after Close: {String(result.inlineRetry.satisfied)}
            {result.inlineRetry.satisfied === false && " (Vehicle No. field reset to blank)"}
          </p>
        </div>
      )}
      {(result.firstAttempt || result.secondAttempt) && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Inline pre-check at step 2 (retry)</p>
          {result.firstAttempt && (
            <p className="text-xs text-slate-400">1st attempt: {result.firstAttempt.jpjStatus} — {result.firstAttempt.responseDesc} (satisfied: {String(result.firstAttempt.satisfied)})</p>
          )}
          {result.secondAttempt && (
            <p className="text-xs text-slate-400">2nd attempt: {result.secondAttempt.jpjStatus} — {result.secondAttempt.responseDesc} (satisfied: {String(result.secondAttempt.satisfied)})</p>
          )}
        </div>
      )}
      {result.paymentAttempts && result.paymentAttempts.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Payment attempts</p>
          {result.paymentAttempts.map((a, i) => (
            <p key={i} className="text-xs text-slate-400">
              Attempt {i + 1}: {a.declined ? "Declined" : `Succeeded — ${a.jpjStatus} / ${a.responseDesc}`}
            </p>
          ))}
        </div>
      )}
      {result.detailsCheck && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Pre-Checking details page check</p>
          <p className="text-xs text-slate-400">Trx Status: {result.detailsCheck.trxStatus} — Enquiry: {result.detailsCheck.responseDesc}</p>
          <p className="text-xs text-slate-400">
            Payment Details: {result.detailsCheck.paymentRowCount} row(s), all OK: {String(result.detailsCheck.paymentRowsAllOk)}
          </p>
        </div>
      )}
      {result.precheckLinkCheck && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">&quot;eDereg Pre-Checking: Yes&quot; link check</p>
          <p className="text-xs text-slate-400">Listing Vehicle No. auto-filled: {result.precheckLinkCheck.listingVehicleNoValue}</p>
          <p className="text-xs text-slate-400">Listing has rows: {String(result.precheckLinkCheck.listingHasRows)}</p>
        </div>
      )}
      {result.jpjXmlLogCheck && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">JPJ XML Log check (BO)</p>
          <p className="text-xs text-slate-400">
            eDereg Pre-Checking log — by Vehicle No.: {result.jpjXmlLogCheck.precheckLog?.foundByVehicleNo ?? 0} row(s),
            by Ref. ID ({result.jpjXmlLogCheck.precheckLog?.refNo}): {result.jpjXmlLogCheck.precheckLog?.foundByRefNo ?? 0} row(s),
            response code matches: {String(result.jpjXmlLogCheck.precheckLog?.responseCodeMatches)}
          </p>
          <p className="text-xs text-slate-400">
            Deregistration log — by Vehicle No.: {result.jpjXmlLogCheck.deregLog?.foundByVehicleNo ?? 0} row(s),
            by Ref. ID ({result.jpjXmlLogCheck.deregLog?.refNo}): {result.jpjXmlLogCheck.deregLog?.foundByRefNo ?? 0} row(s)
          </p>
        </div>
      )}
    </>
  );
}

// "needs-patch" — a Part 1 test case finished with `status: "PART1_DONE"`.
// That is NOT a pass: it's the test stopping deliberately at the point
// where a dev needs to patch the vehicle's data (e.g. backdate a JPJ
// approval past 6 months) before the continuation can run.
type QueueStatus = "pending" | "running" | "success" | "needs-patch" | "fail" | "stopped";

interface QueueItem {
  id: string;
  kind: "testCase" | "continuation";
  testCase: TestCase;
  label: string;
  vehicleRegNo: string;
  // Set only for a `kind: "continuation"` item — the PendingContinuation's
  // own id, so a SUCCESS result can remove that exact entry (rather than
  // matching by testCase+vehicleRegNo, which risked colliding with another
  // pending continuation for the same vehicle no.).
  continuationId?: string;
  status: QueueStatus;
  summary?: string;
  result?: RunResult;
  progress?: { step: string; status: string; label?: string }[];
  log?: string;
  videos?: { label: string; url: string }[];
}

interface QueueState {
  items: QueueItem[];
  currentIndex: number;
  active: boolean;
}

const QUEUE_STATE_KEY = "edereg_precheck_queue_state";

function loadQueueState(): QueueState | null {
  try {
    const raw = localStorage.getItem(QUEUE_STATE_KEY);
    return raw ? (JSON.parse(raw) as QueueState) : null;
  } catch { return null; }
}

function saveQueueState(state: QueueState | null) {
  try {
    if (state) localStorage.setItem(QUEUE_STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(QUEUE_STATE_KEY);
  } catch { /* full */ }
}

const statusIcon: Record<QueueStatus, React.ReactNode> = {
  pending: <Circle size={14} className="text-slate-600" />,
  running: <Loader2 size={14} className="text-indigo-400 animate-spin" />,
  success: <CheckCircle2 size={14} className="text-emerald-400" />,
  "needs-patch": <ArrowRightCircle size={14} className="text-amber-400" />,
  fail: <XCircle size={14} className="text-red-400" />,
  stopped: <Square size={14} className="text-amber-400" />,
};

export default function EderegPrecheckPage() {
  const [form, setForm] = useState<FormState>(
    typeof window !== "undefined" ? loadForm() : DEFAULT_FORM,
  );
  const [continuations, setContinuations] = useState<PendingContinuation[]>(
    typeof window !== "undefined" ? loadContinuations() : [],
  );
  // Top-level page tab — added 2026-08-28, per Faizuddin, mirroring the
  // Insurance page's own tab shape (app/eauto/insurance/page.tsx). "9306 TS"
  // is this whole existing picker/runner, unchanged; "Custom Run" is a new,
  // fully separate sibling component (CustomRunTab.tsx) that lets a tester
  // hand-pick a scenario (entry point, JPJ code, RHB code, etc.) instead of
  // choosing from the fixed TEST_CASES list.
  const [activeTab, setActiveTab] = useState<"tests" | "custom" | "jpj">("tests");

  // The run itself lives in AppShell (hooks/useBackgroundRuns.ts) so it
  // survives navigating away and back — the runId used to be a plain ref
  // that died with the page; it is now part of the persisted run entry.
  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const stopping = !!bgRun?.stopping;
  const orphaned = !!bgRun?.orphaned;
  const runError = bgRun?.error ?? "";
  const liveLog = bgRun?.liveLog ?? "";

  // Which test cases are picked to run — a checkbox list now (was a single
  // radio bound to form.testCase), preserving CLICK ORDER so the queue runs
  // in the order picked (RE-wait cases still get pushed to the end, same as
  // the old Bulk Run panel). Seeded from the saved single testCase so a
  // returning user still sees their last pick highlighted.
  const [selectedTestCases, setSelectedTestCases] = useState<TestCase[]>(
    () => (typeof window !== "undefined" ? [loadForm().testCase] : [DEFAULT_FORM.testCase]),
  );
  function toggleTestCase(tc: TestCase) {
    setSelectedTestCases(prev => (prev.includes(tc) ? prev.filter(v => v !== tc) : [...prev, tc]));
  }

  // The run queue — one entry per selected test case AND per selected
  // continuation, run strictly one at a time. Replaces both the old single
  // `res`/`result` view (a 1-item queue looks identical) and the separate
  // BulkRunPanel's own item list.
  const [queue, setQueue] = useState<QueueState | null>(
    typeof window !== "undefined" ? loadQueueState() : null,
  );
  // Mirrors `queue` so the queue-advance effect below can read the LATEST
  // state synchronously without putting a side effect (starting the next
  // run) inside a setState updater function — same reasoning as the old
  // BulkRunPanel's own bulkRef (React updaters must stay pure and can be
  // invoked more than once).
  const queueRef = useRef<QueueState | null>(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  // Validation errors (missing fields) are separate from a run's own error —
  // they can fire before any run exists.
  const [formError, setFormError] = useState("");
  const error = formError || runError;

  // Which queue items have their "Raw run log" section expanded — keyed by
  // item id so toggling one item's log doesn't affect any other's (a plain
  // shared boolean was fine when there was only ever one result to show;
  // now that several items can render at once, each needs its own toggle).
  const [expandedLogIds, setExpandedLogIds] = useState<Set<string>>(new Set());
  function toggleLogExpanded(id: string) {
    setExpandedLogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  // Which recordings the user has picked to download together — spans
  // EVERY item in the queue (keyed by each video's own url), so one
  // "Download selected" can grab recordings from several different test
  // cases/continuations in the same run together, each landing in its own
  // TS-named folder inside the zip (download-videos/route.ts).
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [downloadingVideos, setDownloadingVideos] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [showLiveLog, setShowLiveLog] = useState(true);
  const liveLogRef = useRef<HTMLPreElement | null>(null);
  // Copy buttons for the live/raw run log, added 2026-08-28 per Faizuddin —
  // so a log can be pasted straight into a message instead of manually
  // selecting the (often long, scrolling) <pre> block's text.
  const [liveLogCopied, setLiveLogCopied] = useState(false);
  function copyToClipboard(text: string, onDone: (v: boolean) => void) {
    navigator.clipboard.writeText(text).then(() => {
      onDone(true);
      setTimeout(() => onDone(false), 2000);
    }).catch(() => { /* ignore */ });
  }
  // Which item's own "Details" (steps/result/log/recordings) is expanded —
  // one at a time, an accordion, so a long finished queue doesn't dump every
  // item's full detail on screen at once. Auto-expanded below when the
  // queue only has one item, matching the old single-run page's behaviour
  // of always showing its one result in full.
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [copiedDevItem, setCopiedDevItem] = useState<number | null>(null);
  const [expandedContId, setExpandedContId] = useState<string | null>(null);
  const [copiedContId, setCopiedContId] = useState<string | null>(null);
  // Which continuations are picked — now DUAL purpose: "Copy selected" (as
  // before) AND "include in the run queue" (new). Same checkboxes drive
  // both, per Faizuddin: "the same thing goes for the continuation... i can
  // also select multiple TS to run it."
  const [selectedContinuations, setSelectedContinuations] = useState<Set<string>>(new Set());
  // Test case picker groups are COLLAPSED by default — too many cases now
  // to show every group open at once (per Faizuddin, 2026-08-26). The
  // group containing whatever testCase was already selected/saved starts
  // open so the active choice stays visible; every other group starts
  // closed.
  const [openGroups, setOpenGroups] = useState<Set<string>>(
    () => new Set([TEST_CASES.find(tc => tc.value === (typeof window !== "undefined" ? loadForm().testCase : DEFAULT_FORM.testCase))?.group ?? TEST_CASES[0].group]),
  );
  function toggleGroup(group: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }
  // Every run of this suite sets eSIM response codes before touching the
  // portal (utils/esim.ts ensureEsimHappyPath) — reachable only over the
  // VPN, unconditionally, not just for a steered-failure scenario. Opening
  // this gate runs nothing — only "Confirmed" starts the run.
  // EXCEPT test cases flagged `skipVpnGate` in TEST_CASES ("am" AM_TS1-4,
  // "of" OF_TS1-3) — neither touches utils/esim.ts (the thing that's
  // actually VPN-gated); OF_TS1-3 does use the MyKad emulator to reach Step
  // 2, but that's a local ws://localhost:7878 connection, not VPN-gated
  // either. Run skips this gate entirely for those — ALSO for
  // `VPN_GATE_SKIP_TEST_CASES` below, which covers the dynamically-generated
  // continuations (CJ_TS1-5's own Part 2). The whole SELECTED batch has to
  // qualify for the gate to be skipped, same as the old Bulk Run panel.
  const [vpnAsk, setVpnAsk] = useState(false);
  const [vpnReminder, setVpnReminder] = useState(false);
  // Dashboard-driven pause/continue — added 2026-08-27 for MU_TS11
  // (utils/pauseSignal.ts). `pauseInfo` mirrors the wait-status state
  // below, just for a run that's fully BLOCKED on a human click rather
  // than just approaching a fixed-duration wait.
  const [pauseInfo, setPauseInfo] = useState<{ label: string; transactions?: { label: string; transactionId: string }[] } | null>(null);
  const [continuing, setContinuing] = useState(false);
  const [pauseCopied, setPauseCopied] = useState(false);

  // Poll the wait-status route while a run is in progress — the only way
  // to learn mid-run that the RE reset-timer wait has started, so the VPN
  // reminder can fire near its end (see the module-level comment above).
  useEffect(() => {
    if (!running) { setVpnReminder(false); return; }
    const interval = setInterval(async () => {
      try {
        const r = await fetch("/api/eauto-edereg-precheck/wait-status");
        const data = await r.json() as { waiting: boolean; startedAtMs?: number; waitMs?: number };
        if (!data.waiting || !data.startedAtMs || !data.waitMs) { setVpnReminder(false); return; }
        const remaining = data.startedAtMs + data.waitMs - Date.now();
        setVpnReminder(remaining > 0 && remaining <= VPN_REMINDER_THRESHOLD_MS);
      } catch { /* ignore — next poll will retry */ }
    }, WAIT_STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [running]);

  // Poll the pause-status route while a run is in progress — lets the
  // dashboard show a "Continue" button the moment a test blocks on
  // pauseForDashboardContinue() (scripts/eauto-edereg-precheck/utils/
  // pauseSignal.ts), same polling shape as the wait-status effect above.
  useEffect(() => {
    if (!running || !bgRun?.runId) { setPauseInfo(null); setContinuing(false); return; }
    const runId = bgRun.runId;
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/eauto-edereg-precheck/pause-status?runId=${runId}`);
        const data = await r.json() as { paused: boolean; label?: string; transactions?: { label: string; transactionId: string }[] };
        setPauseInfo(data.paused && data.label ? { label: data.label, transactions: data.transactions } : null);
      } catch { /* ignore — next poll will retry */ }
    }, WAIT_STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [running, bgRun?.runId]);

  const handleContinue = async () => {
    if (!bgRun?.runId) return;
    setContinuing(true);
    try {
      await fetch("/api/eauto-edereg-precheck/continue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: bgRun.runId }),
      });
    } finally {
      setContinuing(false);
    }
  };

  // Copies EVERY transaction the current pause is waiting on — one line
  // each, labelled (e.g. MU_TS11's User A/User B are genuinely separate
  // records, MU_TS12's is one shared record) — so the dev gets a
  // ready-to-paste list regardless of how many there are.
  function copyPauseTransactions() {
    if (!pauseInfo?.transactions?.length) return;
    const text = pauseInfo.transactions.map(t => `${t.label}: ${t.transactionId}`).join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setPauseCopied(true);
      setTimeout(() => setPauseCopied(false), 2000);
    }).catch(() => { /* ignore */ });
  }

  // Auto-scroll the live log to the bottom as new output arrives.
  useEffect(() => {
    if (liveLogRef.current) liveLogRef.current.scrollTop = liveLogRef.current.scrollHeight;
  }, [liveLog]);

  // Flicker the browser tab title too — easy to miss a banner if the tab
  // isn't focused for the whole ~6.5-minute wait.
  useEffect(() => {
    if (!vpnReminder) return;
    const original = document.title;
    let flip = false;
    const interval = setInterval(() => {
      document.title = flip ? original : "⚠ RECONNECT VPN NOW";
      flip = !flip;
    }, 800);
    return () => { clearInterval(interval); document.title = original; };
  }, [vpnReminder]);

  const set = (k: keyof typeof form, v: string) => setForm(p => ({ ...p, [k]: v }));

  // One stacked field for the "User Credentials" nested section below —
  // Faizuddin, 2026-08-26: 4 fields per user (username/password/NRIC No./
  // NRIC Name), always full-width/stacked, never side-by-side (too
  // cramped to read at 2-up).
  function CredField(key: keyof FormState, label: string, placeholder: string, type: "text" | "password" = "text") {
    return (
      <div key={key}>
        <label className={labelCls}>{label}</label>
        <input type={type} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={placeholder} className={fieldCls} />
      </div>
    );
  }

  function removeContinuation(id: string) {
    setContinuations(prev => {
      const next = prev.filter(c => c.id !== id);
      localStorage.setItem(CONTINUATIONS_KEY, JSON.stringify(next));
      return next;
    });
    setSelectedContinuations(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function copyContinuationDetails(c: PendingContinuation) {
    const text = `Vehicle Number: ${c.vehicleRegNo}\nTransaction ID: ${c.transactionId}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedContId(c.id);
      setTimeout(() => setCopiedContId(prev => (prev === c.id ? null : prev)), 2000);
    }).catch(() => { /* ignore */ });
  }

  function copyAllContinuations() {
    if (!continuations.length) return;
    const text = continuations
      .map(c => `Vehicle Number: ${c.vehicleRegNo}\nTransaction ID: ${c.transactionId}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedContId('__all__');
      setTimeout(() => setCopiedContId(prev => (prev === '__all__' ? null : prev)), 2000);
    }).catch(() => { /* ignore */ });
  }

  function toggleContinuationSelected(id: string) {
    setSelectedContinuations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  // Copies only the CHOSEN subset — added 2026-08-27 per Faizuddin ("allow
  // me to select the TS to copy the details, since i dont want to copy all,
  // just a select few").
  function copySelectedContinuations() {
    const chosen = continuations.filter(c => selectedContinuations.has(c.id));
    if (!chosen.length) return;
    const text = chosen
      .map(c => `${c.tsNo} — Vehicle Number: ${c.vehicleRegNo}\nTransaction ID: ${c.transactionId}`)
      .join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopiedContId('__selected__');
      setTimeout(() => setCopiedContId(prev => (prev === '__selected__' ? null : prev)), 2000);
    }).catch(() => { /* ignore */ });
  }

  // Builds the ordered run queue from whatever's currently checked — test
  // cases first (RE-wait ones pushed to the end, same stable partition the
  // old Bulk Run panel used), then continuations. Test cases share ONE
  // auto-incremented run of vehicle numbers starting at the Vehicle Reg No.
  // field above (a single selection just gets that field's value, unchanged
  // from the old single-run behaviour); continuations always keep their OWN
  // already-patched vehicle no., never incremented.
  function buildQueueItems(): QueueItem[] {
    const orderedTestCases = [
      ...selectedTestCases.filter(tc => !RE_WAIT_TEST_CASES.has(tc)),
      ...selectedTestCases.filter(tc => RE_WAIT_TEST_CASES.has(tc)),
    ];
    const vehicleNumbers = orderedTestCases.length
      ? generateVehicleNumbers(form.vehicleRegNo.trim().toUpperCase(), orderedTestCases.length)
      : [];
    const testCaseItems: QueueItem[] = orderedTestCases.map((tc, i) => ({
      id: `tc-${i}-${tc}`,
      kind: "testCase",
      testCase: tc,
      label: TEST_CASES.find(t => t.value === tc)?.label ?? tc,
      vehicleRegNo: vehicleNumbers[i],
      status: "pending",
    }));

    const continuationItems: QueueItem[] = continuations
      .filter(c => selectedContinuations.has(c.id))
      .map(c => ({
        id: `cont-${c.id}`,
        kind: "continuation",
        testCase: c.part2TestCase,
        label: `${c.tsNo} — Continuation`,
        vehicleRegNo: c.vehicleRegNo,
        continuationId: c.id,
        status: "pending",
      }));

    return [...testCaseItems, ...continuationItems];
  }

  const hasSelection = selectedTestCases.length > 0 || selectedContinuations.size > 0;
  const skipVpnGate = hasSelection && selectedTestCases.every(tc => {
    const meta = TEST_CASES.find(t => t.value === tc);
    return !!meta?.skipVpnGate || VPN_GATE_SKIP_TEST_CASES.has(tc);
  }) && continuations
    .filter(c => selectedContinuations.has(c.id))
    .every(c => VPN_GATE_SKIP_TEST_CASES.has(c.part2TestCase));
  const anyMismatched = selectedTestCases.some(looksMismatched);

  function runQueueIndex(items: QueueItem[], index: number) {
    const item = items[index];
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-edereg-precheck/run",
      liveLogUrl: "/api/eauto-edereg-precheck/live-log",
      // Frozen at start so the continuation bookkeeping below reflects what
      // was actually run, even if the form is edited before it finishes.
      meta: { label: item.label, testCase: item.testCase, vehicleRegNo: item.vehicleRegNo, continuationId: item.continuationId },
      body: { ...form, testCase: item.testCase, vehicleRegNo: item.vehicleRegNo },
    });
  }

  function startQueue() {
    const items = buildQueueItems();
    if (!items.length) { setFormError("Pick at least one test case or continuation to run."); return; }
    if (items.some(i => i.kind === "testCase") && !form.vehicleRegNo.trim()) {
      setFormError("Vehicle Reg No is required.");
      return;
    }
    if (!form.jpjReceiptEmail.trim()) { setFormError("Required: jpjReceiptEmail"); return; }
    setFormError("");
    localStorage.setItem(FORM_KEY, JSON.stringify(form));
    setSelectedVideos(new Set());
    items[0].status = "running";
    const next: QueueState = { items, currentIndex: 0, active: true };
    setQueue(next);
    saveQueueState(next);
    setExpandedItem(items.length === 1 ? 0 : null);
    runQueueIndex(items, 0);
  }

  function stopQueue() {
    setQueue(prev => {
      if (!prev) return prev;
      const next = { ...prev, active: false };
      saveQueueState(next);
      return next;
    });
    stopRun(RUN_KEY);
  }

  // Advances the queue as each run completes, AND does the continuation
  // bookkeeping that used to be a separate effect on the old single-run
  // page: a Part 1 test case that finishes PART1_DONE generates a new
  // continuation entry; a continuation item that finishes SUCCESS gets
  // removed from the list (by its OWN id — precise, no risk of matching the
  // wrong pending entry for the same vehicle no.).
  const processedRunId = useRef<string | null>(null);
  useEffect(() => {
    if (!bgRun || bgRun.running || !bgRun.result) return;
    if (processedRunId.current === bgRun.runId) return;
    processedRunId.current = bgRun.runId;

    const prev = queueRef.current;
    if (!prev) return;

    const data = bgRun.result as RunResponse;
    const idx = prev.currentIndex;
    const items = prev.items.slice();
    const cur = items[idx];
    if (cur) {
      const isPart1Done = data.result?.part === 1 && data.result?.status === "PART1_DONE";
      const failed = !isPart1Done && (data.stopped || data.error || (data.result && !["SUCCESS", "PART1_DONE"].includes(String(data.result.status))));
      items[idx] = {
        ...cur,
        status: data.stopped ? "stopped" : isPart1Done ? "needs-patch" : failed ? "fail" : "success",
        summary: summarizeResult(data),
        result: data.result,
        progress: data.progress,
        log: data.log,
        videos: data.videos,
      };

      if (isPart1Done && data.result?.continuesAs) {
        const entry: PendingContinuation = {
          id: `${Date.now()}-${data.result.vehicleRegNo ?? ""}`,
          tsNo: data.result.tsNo ?? "",
          part2TestCase: data.result.continuesAs,
          vehicleRegNo: data.result.vehicleRegNo ?? "",
          transactionId: data.result.transactionId ?? "",
          createdAt: Date.now(),
        };
        setContinuations(prevConts => {
          const nextConts = [...prevConts, entry];
          localStorage.setItem(CONTINUATIONS_KEY, JSON.stringify(nextConts));
          return nextConts;
        });
      }
      // A continuation succeeded — passed means done, drop it from the
      // list; failed stays so the same vehicle no./data can be retried once
      // fixed (the underlying dev-patch data is still valid).
      if (cur.kind === "continuation" && cur.continuationId && data.result?.part === 2 && data.result?.status === "SUCCESS") {
        removeContinuation(cur.continuationId);
      }
    }

    const nextIndex = idx + 1;
    const hasMore = prev.active && nextIndex < items.length;
    if (hasMore) items[nextIndex] = { ...items[nextIndex], status: "running" };
    const next: QueueState = { ...prev, items, currentIndex: hasMore ? nextIndex : idx, active: hasMore };

    // Plain setState (no updater function) — safe here since `next` was
    // already computed from `queueRef.current`, not from React's own
    // possibly-stale `prev` snapshot.
    setQueue(next);
    saveQueueState(next);
    // Side effect (starts the next run) AFTER the state update, as a
    // separate statement — never inside a setState updater.
    if (hasMore) runQueueIndex(items, nextIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgRun?.runId, bgRun?.running, bgRun?.result]);

  function toggleVideoSelected(url: string) {
    setSelectedVideos(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  }

  function toggleAllVideosForItem(item: QueueItem) {
    if (!item.videos?.length) return;
    const urls = item.videos.map(v => v.url);
    const allSelected = urls.every(u => selectedVideos.has(u));
    setSelectedVideos(prev => {
      const next = new Set(prev);
      urls.forEach(u => (allSelected ? next.delete(u) : next.add(u)));
      return next;
    });
  }

  // Folder each video lands in inside a multi-video zip download — one
  // folder per QUEUE ITEM (its TS no./label + vehicle no.), so downloading
  // several test cases'/continuations' recordings together comes back
  // pre-sorted instead of one flat pile of same-named files. See
  // download-videos/route.ts.
  function folderNameFor(item: QueueItem): string {
    const tsNo = item.result?.tsNo?.trim();
    return `${tsNo || item.label} (${item.vehicleRegNo})`;
  }

  // Downloads the CHOSEN subset of recordings as one file — a single video
  // comes back as-is (unless it needs its own folder), several come back
  // zipped with each item's recordings under its own subfolder.
  async function downloadSelectedVideos() {
    if (!selectedVideos.size) return;
    setDownloadingVideos(true);
    setDownloadError("");
    try {
      const files = Array.from(selectedVideos).map(url => {
        const owner = queue?.items.find(item => item.videos?.some(v => v.url === url));
        return owner ? { url, folder: folderNameFor(owner) } : { url };
      });
      const r = await fetch("/api/eauto-edereg-precheck/download-videos", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? `Download failed (${r.status})`);
      }
      const blob = await r.blob();
      const disposition = r.headers.get("Content-Disposition") ?? "";
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "edereg-precheck-videos.zip";
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl; a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setDownloadError(e instanceof Error ? e.message : "Failed to download the selected videos.");
    } finally {
      setDownloadingVideos(false);
    }
  }

  function copyDevDetails(i: number, result: RunResult) {
    const text = `TS No.: ${result.tsNo ?? ""}\nVehicle Number: ${result.vehicleRegNo ?? ""}\nTransaction ID: ${result.transactionId ?? ""}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDevItem(i);
      setTimeout(() => setCopiedDevItem(prev => (prev === i ? null : prev)), 2000);
    }).catch(() => { /* ignore */ });
  }

  // "User B/C" credentials column — shown if ANY currently-selected test
  // case needs that account (not just the single active one anymore, now
  // that several can be picked at once).
  const needsUserB = selectedTestCases.some(tc => TEST_CASES.find(t => t.value === tc)?.multiUser === "same");
  const needsUserC = selectedTestCases.some(tc => TEST_CASES.find(t => t.value === tc)?.multiUser === "different");

  const doneCount = queue?.items.filter(i => i.status === "success" || i.status === "needs-patch" || i.status === "fail" || i.status === "stopped").length ?? 0;
  const totalCount = queue?.items.length ?? 0;
  const currentItem = queue && running ? queue.items[queue.currentIndex] : null;

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <ClipboardList size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">eDereg Pre-Checking Enquiry</h1>
        <span className="text-xs text-slate-600 hidden sm:block">EAINT-9306 · AATF portal (with video)</span>
      </header>

      {/* Tab switcher — same underline style as the Insurance page's own
          tabs (app/eauto/insurance/page.tsx): plain buttons, no UI library,
          active tab gets a blue bottom border + blue text. */}
      <div className="flex items-center gap-1 px-4 sm:px-6 pt-4 border-b border-slate-800">
        <button type="button" onClick={() => setActiveTab("tests")} className={clsx(
          "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
          activeTab === "tests" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300",
        )}>9306 TS</button>
        <button type="button" onClick={() => setActiveTab("custom")} className={clsx(
          "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
          activeTab === "custom" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300",
        )}>Custom Run</button>
        <button type="button" onClick={() => setActiveTab("jpj")} className={clsx(
          "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
          activeTab === "jpj" ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300",
        )}>JPJ Code Checker</button>
      </div>

      {activeTab === "custom" && <CustomRunTab />}
      {activeTab === "jpj" && <JpjCodeCheckerTab />}

      <div className={clsx("flex-1 p-4 sm:p-6 space-y-5", activeTab !== "tests" && "hidden")}>
        {/* Test data — one full-width card, 3 internal columns (env/vehicle/
            email, User A, User B-or-C interchangeable), per Faizuddin
            2026-08-26. Test case picker + continuations move to their own
            row below instead of sharing this one. */}
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
                {selectedTestCases.length > 1 && (
                  <p className="mt-1 text-[11px] text-slate-500">Starting number — {selectedTestCases.length} test cases picked, each gets its own auto-incremented number from here.</p>
                )}
              </div>
              <div>
                <label className={labelCls}>JPJ receipt email <span className="text-red-400">*</span></label>
                <input value={form.jpjReceiptEmail} onChange={e => set("jpjReceiptEmail", e.target.value)} placeholder="you@example.com" className={fieldCls} />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold text-slate-400">User A</p>
              <div className="space-y-2 pl-3 border-l border-slate-800">
                {CredField("username", "Username", "faizuddinAATF")}
                {CredField("password", "Password", "default", "password")}
                {CredField("mykadNric", "NRIC No.", "030217141005")}
                {CredField("mykadName", "NRIC Name", "MUHAMMAD FAIZUDDIN BIN BIDI")}
              </div>
            </div>

            {/* User B/C share this one column — interchangeable. Shown if
                ANY currently-picked test case needs that account. */}
            <div className="space-y-2">
              {needsUserB && (
                <>
                  <p className="text-[11px] font-semibold text-slate-400">User B <span className="text-slate-600 font-normal">— Same Company</span></p>
                  <div className="space-y-2 pl-3 border-l border-slate-800">
                    {CredField("subUsername", "Username", "faizAATFsub2")}
                    {CredField("subPassword", "Password", "default", "password")}
                    {CredField("mykadNricSub", "NRIC No.", "030117-14-1005")}
                    {CredField("mykadNameSub", "NRIC Name", "MUHAMMAD FAIZUDDIN SUB2")}
                  </div>
                </>
              )}
              {needsUserC && (
                <>
                  <p className={clsx("text-[11px] font-semibold text-slate-400", needsUserB && "mt-3")}>User C <span className="text-slate-600 font-normal">— Different Company</span></p>
                  <div className="space-y-2 pl-3 border-l border-slate-800">
                    {CredField("subUsername2", "Username", "AzfarAATF")}
                    {CredField("subPassword2", "Password", "default", "password")}
                    {CredField("mykadNricSub2", "NRIC No.", "020406081081")}
                    {CredField("mykadNameSub2", "NRIC Name", "23 , 24,25")}
                  </div>
                </>
              )}
              {!needsUserB && !needsUserC && (
                <p className="text-xs text-slate-600 italic">Not needed for the currently picked test case(s).</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {!running ? (
              <button
                onClick={() => (skipVpnGate ? startQueue() : setVpnAsk(true))}
                disabled={!hasSelection}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={16} />Run{(selectedTestCases.length + selectedContinuations.size) > 1 ? ` (${selectedTestCases.length + selectedContinuations.size})` : ""}
              </button>
            ) : (
              <button onClick={stopQueue} disabled={stopping} className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                <Square size={16} />{stopping ? "Stopping…" : "Stop"}
              </button>
            )}
          </div>
          {error && <p className="flex items-start gap-1.5 text-xs text-red-400"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
        </div>

        <div className={clsx("grid gap-4", continuations.length > 0 && "grid-cols-2")}>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                  Test case{selectedTestCases.length > 0 && <span className="text-slate-600 normal-case font-normal"> ({selectedTestCases.length} selected)</span>}
                </p>
                {selectedTestCases.length > 0 && !running && (
                  <button type="button" onClick={() => setSelectedTestCases([])} className="text-[11px] text-slate-500 hover:text-slate-300">Clear</button>
                )}
              </div>
              <p className="text-[11px] text-slate-500 mb-3">
                Pick one or more — several run one at a time, in order, against their own auto-incremented vehicle no.
                Any pick with a real ~6.5-minute payment reset-timer wait automatically runs last.
              </p>
              <div className="space-y-2">
                {TEST_CASE_GROUPS.map(({ group, cases }) => {
                  const isOpen = openGroups.has(group);
                  const selectedInGroup = cases.filter(tc => selectedTestCases.includes(tc.value)).length;
                  return (
                    <div key={group} className="rounded-lg border border-slate-800 overflow-hidden">
                      <button type="button" onClick={() => toggleGroup(group)}
                        className={clsx(
                          "w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors",
                          selectedInGroup > 0 ? "bg-indigo-950/30" : "bg-slate-800/60 hover:bg-slate-800",
                        )}>
                        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                          {group}
                          {selectedInGroup > 0 && <span className="text-[10px] font-normal normal-case text-indigo-400">({selectedInGroup})</span>}
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
                              "flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors",
                              selectedTestCases.includes(tc.value) ? "border-indigo-600 bg-indigo-950/30" : "border-slate-700 hover:border-slate-600",
                              running && "opacity-60 pointer-events-none",
                            )}>
                              <input type="checkbox" checked={selectedTestCases.includes(tc.value)}
                                onChange={() => toggleTestCase(tc.value)} />
                              <span className="text-xs font-medium text-slate-200 flex-1">{tc.label}</span>
                              {looksMismatched(tc.value) && (
                                <span title="Depends on a specific dev-patched vehicle/transaction or a second account — a fresh auto-incremented vehicle no. may not fit" className="shrink-0">
                                  <ShieldAlert size={11} className="text-amber-500" />
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
              {anyMismatched && (
                <p className="flex items-start gap-1.5 mt-3 text-[11px] text-amber-400">
                  <ShieldAlert size={12} className="shrink-0 mt-0.5" />
                  One or more picked test cases (flagged above) depend on a specific dev-patched vehicle/transaction or
                  a second account — a fresh auto-incremented vehicle no. every run may not be the right fit there.
                </p>
              )}
            </div>

            {continuations.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
                    Continuation{selectedContinuations.size > 0 && <span className="text-slate-600 normal-case font-normal"> ({selectedContinuations.size} selected)</span>}
                  </p>
                  <div className="flex items-center gap-1.5">
                    {selectedContinuations.size > 0 && (
                      <button onClick={copySelectedContinuations} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-indigo-700 text-white rounded-lg hover:bg-indigo-600 transition-colors">
                        {copiedContId === "__selected__" ? <Check size={12} /> : <Copy size={12} />}{copiedContId === "__selected__" ? "Copied" : `Copy selected (${selectedContinuations.size})`}
                      </button>
                    )}
                    <button onClick={copyAllContinuations} className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                      {copiedContId === "__all__" ? <Check size={12} /> : <Copy size={12} />}{copiedContId === "__all__" ? "Copied" : "Copy all"}
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mb-3">
                  Pick one or more to run — each reuses its OWN already-patched vehicle no./transaction, never auto-incremented.
                </p>
                <div className="space-y-2">
                  {continuations.map(c => {
                    const isSelected = selectedContinuations.has(c.id);
                    const expanded = expandedContId === c.id;
                    return (
                      <div key={c.id} className={clsx(
                        "rounded-lg border transition-colors",
                        isSelected ? "border-indigo-600 bg-indigo-950/30" : "border-slate-700 hover:border-slate-600",
                      )}>
                        <div className="flex items-center gap-2 p-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleContinuationSelected(c.id)}
                            title="Select to run and/or copy"
                            className="shrink-0"
                          />
                          <button type="button" onClick={() => toggleContinuationSelected(c.id)} className="flex-1 text-left cursor-pointer">
                            <span className="text-xs">
                              <span className="block font-medium text-slate-200">{c.tsNo} — Continuation</span>
                              <span className="block text-slate-500">Vehicle {c.vehicleRegNo} · {new Date(c.createdAt).toLocaleString()}</span>
                            </span>
                          </button>
                          <button onClick={() => setExpandedContId(prev => (prev === c.id ? null : c.id))} title="Details" className="text-slate-600 hover:text-slate-300 shrink-0">
                            <Info size={13} />
                          </button>
                          <button onClick={() => removeContinuation(c.id)} title="Remove" className="text-slate-600 hover:text-slate-300 shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                        {expanded && (
                          <div className="mx-2.5 mb-2.5 rounded-lg border border-slate-700 bg-slate-950/60 p-2.5 space-y-2">
                            <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{`Vehicle Number: ${c.vehicleRegNo}\nTransaction ID: ${c.transactionId}`}</pre>
                            <button onClick={() => copyContinuationDetails(c)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors">
                              {copiedContId === c.id ? <Check size={13} /> : <Copy size={13} />}{copiedContId === c.id ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        {vpnReminder && (
          <div className="fixed inset-x-0 top-0 z-50 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-red-600 animate-pulse shadow-lg">
            <Wifi size={16} />
            RECONNECT THE VPN NOW — the automation will need it again in under a minute (RHB &quot;RE&quot; reset-timer wait ending soon)
          </div>
        )}

        {pauseInfo && (
          <div className="fixed inset-x-0 top-0 z-50 flex flex-wrap items-center justify-center gap-3 px-4 py-3 text-sm font-semibold text-white bg-amber-600 shadow-lg">
            <span>Paused — {pauseInfo.label}. Inspect the live transaction, then continue when ready.</span>
            {!!pauseInfo.transactions?.length && (
              <span className="flex items-center gap-2 rounded-lg bg-black/15 px-2.5 py-1 text-xs font-normal">
                {pauseInfo.transactions.map(t => (
                  <span key={t.label}>{t.label}: <span className="font-mono">{t.transactionId}</span></span>
                ))}
                <button
                  type="button"
                  onClick={copyPauseTransactions}
                  title="Copy transaction ID(s) for the dev"
                  className="flex items-center gap-1 rounded bg-white/20 px-2 py-0.5 hover:bg-white/30"
                >
                  {pauseCopied ? <Check size={12} /> : <Copy size={12} />}{pauseCopied ? "Copied" : "Copy"}
                </button>
              </span>
            )}
            <button
              type="button"
              onClick={handleContinue}
              disabled={continuing}
              className="flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 hover:bg-white/30 disabled:opacity-60"
            >
              <ArrowRightCircle size={15} />
              {continuing ? "Continuing…" : "Continue"}
            </button>
          </div>
        )}

        {/* Row 2: results, full width — one card per queue item (a single
            selection is just a 1-item queue, auto-expanded). */}
        <div className="space-y-5">
          {running && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Loader2 size={15} className="animate-spin" />
              Running {currentItem?.label ?? "…"} ({currentItem?.vehicleRegNo}) against {form.envSegment}…
              {totalCount > 1 && ` — ${doneCount}/${totalCount} done`}
            </div>
          )}
          {!running && !queue && !orphaned && <p className="text-sm text-slate-500">Pick one or more test cases/continuations above, then hit Run.</p>}

          {/* Survived the page but not a full browser reload — the process may
              well have finished; the dashboard just lost track of it. */}
          {orphaned && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
              <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="flex-1 text-xs text-amber-200 leading-relaxed">
                A run was still going when this browser reloaded, so the dashboard lost track of it.
                Check the terminal — it may have finished. The log below is the last output captured.
              </p>
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

          {queue && queue.items.length > 0 && (
            <div className="space-y-2">
              {selectedVideos.size > 0 && (
                <div className="flex items-center justify-between gap-2 rounded-lg border border-indigo-800/50 bg-indigo-950/20 px-3 py-2">
                  <span className="text-[11px] text-indigo-300">{selectedVideos.size} video(s) selected</span>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setSelectedVideos(new Set())} className="text-[11px] text-slate-400 hover:text-slate-200">
                      Clear
                    </button>
                    <button
                      type="button" onClick={downloadSelectedVideos} disabled={downloadingVideos}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                    >
                      {downloadingVideos ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                      {downloadingVideos ? "Downloading…" : "Download selected"}
                    </button>
                  </div>
                </div>
              )}
              {downloadError && <p className="text-[11px] text-red-400">{downloadError}</p>}

              {queue.items.map((item, i) => {
                const expanded = expandedItem === i;
                const hasDetails = item.status !== "pending" && item.status !== "running";
                return (
                  <div key={item.id} className="rounded-lg border border-slate-800 bg-slate-950/40">
                    <div className="flex items-start gap-2 px-3 py-2.5">
                      <span className="mt-0.5 shrink-0">{statusIcon[item.status]}</span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-200 truncate">{item.label}</span>
                        <span className="block text-xs font-mono text-slate-500">{item.vehicleRegNo}</span>
                        {item.summary && <span className="block text-xs text-slate-500 truncate">{item.summary}</span>}
                      </div>
                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() => setExpandedItem(prev => (prev === i ? null : i))}
                          title="Steps, result details, log, and recordings"
                          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 shrink-0"
                        >
                          <Info size={13} />Details
                          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                        </button>
                      )}
                    </div>

                    {/* Actionable, so shown directly — not tucked behind Details. */}
                    {item.status === "needs-patch" && item.result && (
                      <div className="mx-3 mb-3 rounded-lg border border-amber-800/50 bg-amber-950/20 p-3 space-y-2">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-300">
                          <ArrowRightCircle size={13} />Send these details to dev, then run the continuation (added below)
                        </p>
                        <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">{`TS No.: ${item.result.tsNo ?? ""}\nVehicle Number: ${item.result.vehicleRegNo ?? ""}\nTransaction ID: ${item.result.transactionId ?? ""}`}</pre>
                        {item.result.nextAction && <p className="text-[11px] leading-snug text-slate-400">{item.result.nextAction}</p>}
                        <button
                          type="button" onClick={() => copyDevDetails(i, item.result!)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-800/40 text-amber-200 rounded-lg hover:bg-amber-800/60 transition-colors"
                        >
                          {copiedDevItem === i ? <Check size={13} /> : <Copy size={13} />}{copiedDevItem === i ? "Copied" : "Copy for dev"}
                        </button>
                      </div>
                    )}

                    {expanded && hasDetails && (
                      <div className="border-t border-slate-800 p-3 space-y-3">
                        {item.progress && item.progress.length > 0 && (
                          <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Steps</p>
                            <div className="space-y-1">
                              {item.progress.map((p, pi) => (
                                <div key={pi} className="flex items-center gap-2 text-sm text-slate-300">
                                  <CheckCircle2 size={13} className="text-green-400 shrink-0" />{p.label ?? p.step}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.result && (
                          <div className="space-y-3">
                            {item.result.transactionId && <p className="text-xs font-mono text-slate-400">Transaction ID: {item.result.transactionId}</p>}
                            <ResultDetail result={item.result} />
                          </div>
                        )}

                        {item.videos && item.videos.length > 0 && (
                          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5">
                                <Film size={12} />Recordings ({item.videos.length} browser{item.videos.length === 1 ? "" : "s"})
                              </p>
                              <button type="button" onClick={() => toggleAllVideosForItem(item)} className="text-xs text-slate-400 hover:text-slate-200 underline underline-offset-2">
                                Select all
                              </button>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                              {item.videos.map((v, vi) => (
                                <div key={`${v.url}-${vi}`}>
                                  <label className="flex items-center gap-2 mb-1 cursor-pointer select-none">
                                    <input type="checkbox" checked={selectedVideos.has(v.url)} onChange={() => toggleVideoSelected(v.url)}
                                      className="accent-indigo-500" />
                                    <span className="text-xs text-slate-400 font-medium">{v.label}</span>
                                  </label>
                                  <VideoTrimPanel url={v.url} />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.log && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <button onClick={() => toggleLogExpanded(item.id)} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200">
                                {expandedLogIds.has(item.id) ? <ChevronDown size={13} /> : <ChevronRight size={13} />}Raw run log
                              </button>
                              <button onClick={() => copyToClipboard(item.log ?? "", () => {})}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200">
                                <Copy size={13} />Copy
                              </button>
                            </div>
                            {expandedLogIds.has(item.id) && (
                              <pre className="max-h-96 overflow-auto rounded-lg border border-slate-800 bg-black/40 p-2 text-[10px] text-slate-400 whitespace-pre-wrap">
                                {item.log}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* VPN gate — every run of this suite sets eSIM response codes before
          touching the portal. Opening this runs nothing — only "Confirmed"
          starts the run. */}
      {vpnAsk && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setVpnAsk(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <ShieldAlert size={16} />Is your VPN connected, and is the MyKad emulator running?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              This run sets the e-simulator&apos;s Response Code for the vehicle&apos;s
              pre-check and payment outcomes before starting (so a stale code
              left by another tester can&apos;t cause a false failure) — for EVERY
              item in this batch, not just the first. eSIM
              lives at <span className="font-mono text-slate-300">172.30.202.114</span>,
              which is only reachable on the VPN. The Deregistration steps that follow
              also need the local MyKad Reader Emulator listening at{" "}
              <span className="font-mono text-slate-300">localhost:7878</span> (see
              knowledge/mykad-emulator.md) to bypass the three MyKad/thumbprint auth
              points — without either, the run just times out.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setVpnAsk(false)}
                className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">
                Not yet — cancel
              </button>
              <button onClick={() => { setVpnAsk(false); startQueue(); }}
                className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Confirmed — VPN + Emulator Ready
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
