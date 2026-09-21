"use client";
import { useEffect, useRef, useState } from "react";
import { Play, Square, Loader2, CheckCircle2, XCircle, Circle, Layers, ShieldAlert, Clock, ChevronDown, ChevronRight, Download, ExternalLink, Info, ArrowRightCircle, Copy, Check } from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import {
  TEST_CASES, TEST_CASE_GROUPS, VPN_GATE_SKIP_TEST_CASES, RE_WAIT_TEST_CASES, CONTINUATIONS_KEY,
  type FormState, type TestCase, type RunResponse, type RunResult, type PendingContinuation,
} from "./shared";

// Runs MULTIPLE DIFFERENT test cases in one batch — pick several from the
// list below, give one starting Vehicle Reg No., and each selected test case
// runs once, in the order picked, against its own auto-incremented vehicle
// no. (HXA001 for the 1st test case picked, HXA002 for the 2nd, etc.). Added
// per Faizuddin: this is "run several different TS", NOT "run the same TS N
// times" — the earlier version of this panel did the latter and was wrong.
//
// Deliberately a SEPARATE background-run key from the main single-run panel
// (hooks/useBackgroundRuns.ts) — reusing the same key would race the main
// panel's own continuation/video bookkeeping (page.tsx's processedRunId
// effect assumes exactly one run in flight per key) and, since
// startRun()'s promise chain closes over the run KEY rather than its id,
// starting a second run under an already-in-flight key can let the OLD
// run's resolution clobber the NEW run's state. Runs strictly ONE AT A TIME
// in sequence regardless — this repo's own run/route.ts wipes+republishes
// its shared video-artifacts folder on every run, so two of these running
// concurrently would also stomp on each other's recordings.
const RUN_KEY_BULK = "eauto/edereg-precheck-bulk";
const BULK_STATE_KEY = "edereg_precheck_bulk_state";

// "needs-patch" — a Part 1 test case finished with `status: "PART1_DONE"`.
// That is NOT a pass: it's the test stopping deliberately at the point
// where a dev needs to patch the vehicle's data (e.g. backdate a JPJ
// approval past 6 months) before Part 2 can run. Bug found live,
// per Faizuddin: this used to be folded into "success" (a plain green
// check), indistinguishable from a test that actually completed — so
// 6 Part-1-only test cases in one batch all showed as "success" with
// nothing telling him he still needed to hand anything to dev.
type BulkStatus = "pending" | "running" | "success" | "needs-patch" | "fail" | "stopped";

interface BulkItem {
  testCase: TestCase;
  label: string;
  vehicleRegNo: string;
  status: BulkStatus;
  summary?: string;
  // Populated once the run finishes — kept per item (not just the last run's
  // own bgRun.result) so every test case in the batch stays inspectable
  // after the whole thing completes, per Faizuddin: "look at the logs/
  // details of each TS in the bulk run to understand what happened".
  result?: RunResult;
  progress?: { step: string; status: string; label?: string }[];
  log?: string;
  videos?: { label: string; url: string }[];
}

interface BulkState {
  items: BulkItem[];
  currentIndex: number;
  active: boolean;
}

function loadBulkState(): BulkState | null {
  try {
    const raw = localStorage.getItem(BULK_STATE_KEY);
    return raw ? (JSON.parse(raw) as BulkState) : null;
  } catch { return null; }
}

function saveBulkState(state: BulkState | null) {
  try {
    if (state) localStorage.setItem(BULK_STATE_KEY, JSON.stringify(state));
    else localStorage.removeItem(BULK_STATE_KEY);
  } catch { /* full */ }
}

/** Increments the TRAILING digit run in a vehicle no., zero-padded to the
 *  same width as the original (e.g. "HXA001" -> "HXA002", "HXA099" ->
 *  "HXA100" — note the width grows past 3 digits here, same as a car
 *  odometer, deliberately not clamped). Falls back to just appending "1"
 *  if the initial value has no trailing digits at all (e.g. "HXA"). */
export function nextVehicleRegNo(vehicleRegNo: string): string {
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

/** Short one-line summary of a finished run's own result payload — same
 *  fields the main single-run panel already renders in full, condensed to
 *  fit one row per test case in the bulk list. */
function summarizeResult(data: RunResponse): string {
  if (data.stopped) return "Stopped";
  const r = data.result;
  if (!r) return data.error ? `Error: ${data.error}` : "No result";
  if (r.part === 1 && r.status === "PART1_DONE") {
    return `Part 1 done — send Vehicle ${r.vehicleRegNo ?? "?"} / Transaction ${r.transactionId ?? "?"} to dev for the patch, then run Part 2`;
  }
  const bits: string[] = [r.status ?? "?"];
  if (r.precheck?.jpjStatusLabel) bits.push(`precheck ${r.precheck.jpjStatusLabel}`);
  if (r.deregistration?.jpjDeregistrationStatus) bits.push(`dereg ${r.deregistration.jpjDeregistrationStatus}`);
  if (r.transactionId) bits.push(`id ${r.transactionId}`);
  return bits.join(" · ");
}

/** Condensed version of page.tsx's own (much longer) result panel — just
 *  the fields most useful for "what happened", one line each, so a whole
 *  batch's worth of these can be expanded without turning into a wall of
 *  text. */
function ResultDetailBlock({ result }: { result: RunResult }) {
  const rows: string[] = [];
  if (result.precheck) rows.push(`Pre-Checking: ${result.precheck.jpjStatusLabel ?? "?"} — ${result.precheck.responseDesc ?? ""}`);
  if (result.deregistration?.jpjCheckResponseCode) rows.push(`Step 4 JPJ check: ${result.deregistration.jpjCheckStatus} — ${result.deregistration.jpjCheckResponseCode}`);
  if (result.deregistration?.jpjDeregistrationStatus) rows.push(`Step 6 JPJ Deregistration: ${result.deregistration.jpjDeregistrationStatus}`);
  if (result.inlineRetry?.usedInlinePrecheck) rows.push(`Inline pre-check: ${result.inlineRetry.jpjStatus} — ${result.inlineRetry.responseDesc} (gate satisfied: ${String(result.inlineRetry.satisfied)})`);
  if (result.firstAttempt) rows.push(`1st attempt: ${result.firstAttempt.jpjStatus} — ${result.firstAttempt.responseDesc} (satisfied: ${String(result.firstAttempt.satisfied)})`);
  if (result.secondAttempt) rows.push(`2nd attempt: ${result.secondAttempt.jpjStatus} — ${result.secondAttempt.responseDesc} (satisfied: ${String(result.secondAttempt.satisfied)})`);
  if (result.paymentAttempts?.length) {
    result.paymentAttempts.forEach((a, i) => rows.push(`Payment attempt ${i + 1}: ${a.declined ? "Declined" : `Succeeded — ${a.jpjStatus} / ${a.responseDesc}`}`));
  }
  if (result.detailsCheck) rows.push(`Details page: Trx Status ${result.detailsCheck.trxStatus} — ${result.detailsCheck.responseDesc}, ${result.detailsCheck.paymentRowCount ?? 0} payment row(s) OK: ${String(result.detailsCheck.paymentRowsAllOk)}`);
  if (result.precheckLinkCheck) rows.push(`"eDereg Pre-Checking: Yes" link → listing has rows: ${String(result.precheckLinkCheck.listingHasRows)}`);
  if (result.jpjXmlLogCheck?.precheckLog) rows.push(`JPJ XML Log (precheck): found by vehicle ${result.jpjXmlLogCheck.precheckLog.foundByVehicleNo ?? 0}, by ref ${result.jpjXmlLogCheck.precheckLog.foundByRefNo ?? 0}`);
  if (result.nextAction) rows.push(`Next: ${result.nextAction}`);

  return (
    <div className="space-y-1">
      {result.transactionId && <p className="text-[11px] font-mono text-slate-400">Transaction ID: {result.transactionId}</p>}
      {rows.length ? rows.map((r, i) => <p key={i} className="text-[11px] text-slate-400">{r}</p>)
        : <p className="text-[11px] text-slate-600 italic">No further result fields for this test case.</p>}
    </div>
  );
}

const statusIcon: Record<BulkStatus, React.ReactNode> = {
  pending: <Circle size={14} className="text-slate-600" />,
  running: <Loader2 size={14} className="text-indigo-400 animate-spin" />,
  success: <CheckCircle2 size={14} className="text-emerald-400" />,
  "needs-patch": <ArrowRightCircle size={14} className="text-amber-400" />,
  fail: <XCircle size={14} className="text-red-400" />,
  stopped: <Square size={14} className="text-amber-400" />,
};

// Part 2 / multi-user cases each depend on a SPECIFIC vehicle no. a dev
// already patched, or on a second/third account — auto-incrementing a fresh
// vehicle no. for every run doesn't fit that shape. Flagged per-case rather
// than hidden from the list, since it's still possible to run them (just
// probably not useful without matching setup).
function looksMismatched(tc: TestCase): boolean {
  return /part2$/.test(tc) || tc.startsWith("mu-");
}

export default function BulkRunPanel({ form }: { form: FormState }) {
  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY_BULK];
  const running = !!bgRun?.running;

  const [selected, setSelected] = useState<TestCase[]>([]);
  const [initialVehicleRegNo, setInitialVehicleRegNo] = useState(form.vehicleRegNo);
  const [bulk, setBulk] = useState<BulkState | null>(
    typeof window !== "undefined" ? loadBulkState() : null,
  );
  // Mirrors `bulk` so the queue-advance effect below can read the LATEST
  // state synchronously without putting a side effect (runIndex/startRun,
  // which itself calls AppShell's setRuns) inside a setState updater
  // function — React updaters must be pure, and can be invoked more than
  // once/replayed, which is exactly what triggered "Cannot update a
  // component (AppShell) while rendering a different component
  // (BulkRunPanel)" here.
  const bulkRef = useRef<BulkState | null>(bulk);
  useEffect(() => { bulkRef.current = bulk; }, [bulk]);
  const [vpnAsk, setVpnAsk] = useState(false);
  const [open, setOpen] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());
  // Which item's own "Details" (steps/result/log) is expanded — one at a
  // time, an accordion, so a long finished batch doesn't dump every item's
  // full log on screen at once.
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  // Video checkboxes span ALL items (keyed by each video's own URL, which
  // now embeds its runId — see run/route.ts's publishVideos()), so one
  // "Download selected" can grab recordings from several different test
  // cases in the batch together.
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [downloadingVideos, setDownloadingVideos] = useState(false);
  const [downloadError, setDownloadError] = useState("");
  const [copiedDevItem, setCopiedDevItem] = useState<number | null>(null);

  function copyDevDetails(i: number, result: RunResult) {
    const text = `TS No.: ${result.tsNo ?? ""}\nVehicle Number: ${result.vehicleRegNo ?? ""}\nTransaction ID: ${result.transactionId ?? ""}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedDevItem(i);
      setTimeout(() => setCopiedDevItem(prev => (prev === i ? null : prev)), 2000);
    }).catch(() => { /* ignore */ });
  }

  function toggleGroup(group: string) {
    setOpenGroups(prev => {
      const next = new Set(prev);
      if (next.has(group)) next.delete(group); else next.add(group);
      return next;
    });
  }

  function toggleSelected(tc: TestCase) {
    setSelected(prev => (prev.includes(tc) ? prev.filter(v => v !== tc) : [...prev, tc]));
  }

  const skipVpnGate = selected.length > 0 && selected.every(tc => {
    const meta = TEST_CASES.find(t => t.value === tc);
    return !!meta?.skipVpnGate || VPN_GATE_SKIP_TEST_CASES.has(tc);
  });
  const anyMismatched = selected.some(looksMismatched);

  function runIndex(items: BulkItem[], index: number) {
    startRun<RunResponse>(RUN_KEY_BULK, {
      url: "/api/eauto-edereg-precheck/run",
      liveLogUrl: "/api/eauto-edereg-precheck/live-log",
      meta: { bulkIndex: index },
      body: { ...form, testCase: items[index].testCase, vehicleRegNo: items[index].vehicleRegNo },
    });
  }

  function startBulk() {
    if (!selected.length || !initialVehicleRegNo.trim()) return;
    // RE-wait test cases (CPC_E2E_TS5 Part 2, MU_TS3 — a real fixed
    // ~6.5-minute payment reset-timer wait) run LAST, per Faizuddin — a
    // long fixed wait shouldn't sit in front of faster test cases queued
    // behind it. Stable partition: everything else keeps its picked order,
    // RE-wait cases keep THEIR relative order too, just moved to the end.
    const ordered = [
      ...selected.filter(tc => !RE_WAIT_TEST_CASES.has(tc)),
      ...selected.filter(tc => RE_WAIT_TEST_CASES.has(tc)),
    ];
    const vehicleNumbers = generateVehicleNumbers(initialVehicleRegNo.trim().toUpperCase(), ordered.length);
    const items: BulkItem[] = ordered.map((tc, i) => ({
      testCase: tc,
      label: TEST_CASES.find(t => t.value === tc)?.label ?? tc,
      vehicleRegNo: vehicleNumbers[i],
      status: "pending",
    }));
    items[0].status = "running";
    const next: BulkState = { items, currentIndex: 0, active: true };
    setBulk(next);
    saveBulkState(next);
    runIndex(items, 0);
  }

  function stopBulk() {
    setBulk(prev => {
      if (!prev) return prev;
      const next = { ...prev, active: false };
      saveBulkState(next);
      return next;
    });
    stopRun(RUN_KEY_BULK);
  }

  function toggleVideoSelected(url: string) {
    setSelectedVideos(prev => {
      const next = new Set(prev);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  }

  function toggleAllVideosForItem(item: BulkItem) {
    if (!item.videos?.length) return;
    const urls = item.videos.map(v => v.url);
    const allSelected = urls.every(u => selectedVideos.has(u));
    setSelectedVideos(prev => {
      const next = new Set(prev);
      urls.forEach(u => (allSelected ? next.delete(u) : next.add(u)));
      return next;
    });
  }

  // Maps every selected video's url to the folder it should land in inside
  // the downloaded zip — one folder per TEST CASE ITEM (its TS no./label +
  // vehicle no.), so a multi-TS bulk download comes back pre-sorted instead
  // of landing as one flat pile of runId-prefixed files the user has to sort
  // by hand. Built fresh from `bulk` on every download rather than cached,
  // since it only needs to cover whatever's currently selected.
  function folderNameFor(item: BulkItem): string {
    const tsNo = item.result?.tsNo?.trim();
    return `${tsNo || item.label} (${item.vehicleRegNo})`;
  }

  // Same endpoint the main single-run panel uses (page.tsx's
  // downloadSelectedVideos), extended with a per-video `folder` — a single
  // video comes back as-is (unless it's the only one AND has a folder), and
  // several come back zipped with each TS's recordings under its own
  // subfolder, per download-videos/route.ts.
  async function downloadSelectedVideos() {
    if (!selectedVideos.size) return;
    setDownloadingVideos(true);
    setDownloadError("");
    try {
      const files = Array.from(selectedVideos).map(url => {
        const owner = bulk?.items.find(item => item.videos?.some(v => v.url === url));
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
      const filename = /filename="([^"]+)"/.exec(disposition)?.[1] ?? "edereg-precheck-bulk-videos.zip";
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

  // Advances the queue as each run completes — mirrors page.tsx's own
  // processedRunId guard so a finished run is only consumed once, even
  // across a navigation away and back (bgRun/bulk both persist).
  const processedRunId = useRef<string | null>(null);
  useEffect(() => {
    if (!bgRun || bgRun.running || !bgRun.result) return;
    if (processedRunId.current === bgRun.runId) return;
    processedRunId.current = bgRun.runId;

    const prev = bulkRef.current;
    if (!prev) return;

    const data = bgRun.result as RunResponse;
    const idx = prev.currentIndex;
    const items = prev.items.slice();
    if (items[idx]) {
      // A Part 1 test case (ts4-part1, ts10-part1, etc.) deliberately stops
      // here — `PART1_DONE` is NOT a pass, it's "now send this vehicle/
      // transaction to dev for a patch, then run Part 2". Used to be folded
      // into plain "success" (indistinguishable from an actually-finished
      // test) until Faizuddin caught it live: 6 Part-1 test cases in one
      // batch all showed green with nothing telling him he still had
      // dev-handoff work to do.
      const isPart1Done = data.result?.part === 1 && data.result?.status === "PART1_DONE";
      const failed = !isPart1Done && (data.stopped || data.error || (data.result && !["SUCCESS", "PART1_DONE"].includes(String(data.result.status))));
      items[idx] = {
        ...items[idx],
        status: data.stopped ? "stopped" : isPart1Done ? "needs-patch" : failed ? "fail" : "success",
        summary: summarizeResult(data),
        result: data.result,
        progress: data.progress,
        log: data.log,
        videos: data.videos,
      };

      // Same continuation list the single-run panel (page.tsx) writes to
      // for its own Part 1 runs — a Part 1 test case picked inside a bulk
      // batch now shows up there too, ready to select for Part 2, instead
      // of the vehicle/transaction only being visible in this batch's own
      // (ephemeral, per-item) summary text.
      if (isPart1Done && data.result?.continuesAs) {
        try {
          const raw = localStorage.getItem(CONTINUATIONS_KEY);
          const existing: PendingContinuation[] = raw ? JSON.parse(raw) : [];
          const entry: PendingContinuation = {
            id: `${Date.now()}-${data.result.vehicleRegNo ?? ""}`,
            tsNo: data.result.tsNo ?? "",
            part2TestCase: data.result.continuesAs,
            vehicleRegNo: data.result.vehicleRegNo ?? "",
            transactionId: data.result.transactionId ?? "",
            createdAt: Date.now(),
          };
          localStorage.setItem(CONTINUATIONS_KEY, JSON.stringify([...existing, entry]));
        } catch { /* localStorage full or unavailable — the dev-handoff box below still shows the details */ }
      }
    }
    const nextIndex = idx + 1;
    const hasMore = prev.active && nextIndex < items.length;
    if (hasMore) items[nextIndex] = { ...items[nextIndex], status: "running" };
    const next: BulkState = { ...prev, items, currentIndex: hasMore ? nextIndex : idx, active: hasMore };

    // Plain setState (no updater function) — safe here since `next` was
    // already computed from `bulkRef.current`, not from React's own
    // possibly-stale `prev` snapshot.
    setBulk(next);
    saveBulkState(next);
    // Side effect (starts the next run) AFTER the state update, as a
    // separate statement — never inside a setState updater.
    if (hasMore) runIndex(items, nextIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgRun?.runId, bgRun?.running, bgRun?.result]);

  const doneCount = bulk?.items.filter(i => i.status === "success" || i.status === "needs-patch" || i.status === "fail" || i.status === "stopped").length ?? 0;
  const totalCount = bulk?.items.length ?? 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
      <button type="button" onClick={() => setOpen(v => !v)} className="w-full flex items-center justify-between gap-2 text-left">
        <span className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-semibold text-slate-500">
          <Layers size={13} />Bulk Run{totalCount > 0 && ` (${doneCount}/${totalCount})`}
        </span>
        {open ? <ChevronDown size={14} className="text-slate-600" /> : <ChevronRight size={14} className="text-slate-600" />}
      </button>

      {open && (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-500">
            Pick several test cases below, give one starting Vehicle Reg No., and each one runs in order against its
            own auto-incremented vehicle no. Runs strictly one at a time; continues through individual failures — use
            Stop to abort. Any picked test case with a real ~6.5-minute payment reset-timer wait (marked below)
            automatically runs LAST, so it doesn&apos;t hold up faster ones queued behind it.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Initial Vehicle Reg No</label>
            <input
              value={initialVehicleRegNo}
              onChange={e => setInitialVehicleRegNo(e.target.value.toUpperCase())}
              placeholder="e.g. HXA001"
              disabled={running}
              className="w-full max-w-xs px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600 disabled:opacity-60"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-slate-400">Test cases <span className="text-slate-600">({selected.length} selected)</span></label>
              {selected.length > 0 && !running && (
                <button type="button" onClick={() => setSelected([])} className="text-[11px] text-slate-500 hover:text-slate-300">Clear</button>
              )}
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {TEST_CASE_GROUPS.map(({ group, cases }) => {
                const isOpen = openGroups.has(group);
                const selectedInGroup = cases.filter(tc => selected.includes(tc.value)).length;
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
                      <div className="p-2 space-y-1.5 border-t border-slate-800">
                        {cases.map(tc => (
                          <label key={tc.value} className={clsx(
                            "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors",
                            selected.includes(tc.value) ? "border-indigo-600 bg-indigo-950/30" : "border-slate-700 hover:border-slate-600",
                            running && "opacity-60 pointer-events-none",
                          )}>
                            <input type="checkbox" checked={selected.includes(tc.value)} onChange={() => toggleSelected(tc.value)} />
                            <span className="text-xs font-medium text-slate-200">{tc.label}</span>
                            <span className="ml-auto flex items-center gap-1.5 shrink-0">
                              {RE_WAIT_TEST_CASES.has(tc.value) && (
                                <span title="Has a real ~6.5-minute payment reset-timer wait — always runs last in a batch" className="flex items-center gap-1 text-[10px] text-amber-500">
                                  <Clock size={11} />~6.5min
                                </span>
                              )}
                              {looksMismatched(tc.value) && <ShieldAlert size={11} className="text-amber-500" />}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {anyMismatched && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-400">
              <ShieldAlert size={12} className="shrink-0 mt-0.5" />
              One or more picked test cases (flagged above) depend on a specific dev-patched vehicle/transaction or a
              second account — a fresh auto-incremented vehicle no. every run may not be the right fit there.
            </p>
          )}

          <div className="flex justify-end">
            {!running ? (
              <button
                onClick={() => (skipVpnGate ? startBulk() : setVpnAsk(true))}
                disabled={!selected.length || !initialVehicleRegNo.trim()}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Play size={16} />Start Bulk Run ({selected.length})
              </button>
            ) : (
              <button onClick={stopBulk} className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 transition-colors">
                <Square size={16} />Stop Bulk
              </button>
            )}
          </div>

          {bulk && bulk.items.length > 0 && (
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

              {bulk.items.map((item, i) => {
                const expanded = expandedItem === i;
                const hasDetails = item.status !== "pending" && item.status !== "running";
                return (
                  <div key={item.testCase + i} className="rounded-lg border border-slate-800 bg-slate-950/40">
                    <div className="flex items-start gap-2 px-3 py-2">
                      <span className="mt-0.5 shrink-0">{statusIcon[item.status]}</span>
                      <div className="min-w-0 flex-1">
                        <span className="block text-xs font-medium text-slate-200 truncate">{item.label}</span>
                        <span className="block text-[11px] font-mono text-slate-500">{item.vehicleRegNo}</span>
                        {item.summary && <span className="block text-[11px] text-slate-500 truncate">{item.summary}</span>}
                      </div>
                      {hasDetails && (
                        <button
                          type="button"
                          onClick={() => setExpandedItem(prev => (prev === i ? null : i))}
                          title="Steps, result details, log, and recordings"
                          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 shrink-0"
                        >
                          <Info size={12} />Details
                          {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                        </button>
                      )}
                    </div>

                    {/* Actionable, so shown directly — not tucked behind Details.
                        Also added to the Continuations list (page.tsx, "9306 TS"
                        tab), so this same entry is pickable there for Part 2. */}
                    {item.status === "needs-patch" && item.result && (
                      <div className="mx-3 mb-3 rounded-lg border border-amber-800/50 bg-amber-950/20 p-2.5 space-y-1.5">
                        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                          <ArrowRightCircle size={12} />Part 1 done — send to dev, then run Part 2 (added to Continuations)
                        </p>
                        <pre className="text-[11px] text-slate-300 font-mono whitespace-pre-wrap">{`TS No.: ${item.result.tsNo ?? ""}\nVehicle Number: ${item.result.vehicleRegNo ?? ""}\nTransaction ID: ${item.result.transactionId ?? ""}`}</pre>
                        <button
                          type="button" onClick={() => copyDevDetails(i, item.result!)}
                          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] bg-amber-800/40 text-amber-200 rounded-lg hover:bg-amber-800/60 transition-colors"
                        >
                          {copiedDevItem === i ? <Check size={12} /> : <Copy size={12} />}{copiedDevItem === i ? "Copied" : "Copy for dev"}
                        </button>
                      </div>
                    )}

                    {expanded && hasDetails && (
                      <div className="border-t border-slate-800 p-3 space-y-3">
                        {item.progress && item.progress.length > 0 && (
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Steps</p>
                            <div className="space-y-0.5">
                              {item.progress.map((p, pi) => (
                                <div key={pi} className="flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <CheckCircle2 size={11} className="text-green-500 shrink-0" />{p.label ?? p.step}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.result && (
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Result</p>
                            <ResultDetailBlock result={item.result} />
                          </div>
                        )}

                        {item.videos && item.videos.length > 0 && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Recordings</p>
                              <button type="button" onClick={() => toggleAllVideosForItem(item)} className="text-[10px] text-slate-500 hover:text-slate-300">
                                Select all
                              </button>
                            </div>
                            <div className="space-y-1">
                              {item.videos.map((v, vi) => (
                                <div key={vi} className="flex items-center gap-2 text-[11px]">
                                  <input
                                    type="checkbox"
                                    checked={selectedVideos.has(v.url)}
                                    onChange={() => toggleVideoSelected(v.url)}
                                  />
                                  <span className="text-slate-400 flex-1 truncate">{v.label}</span>
                                  <a href={v.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300">
                                    <ExternalLink size={11} />Open
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {item.log && (
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-1">Log</p>
                            <pre className="max-h-48 overflow-auto rounded-lg border border-slate-800 bg-black/40 p-2 text-[10px] text-slate-400 whitespace-pre-wrap">
                              {item.log}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {running && (
            <div>
              <button type="button" onClick={() => setShowLog(v => !v)} className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-300">
                {showLog ? <ChevronDown size={11} /> : <ChevronRight size={11} />}Live log
              </button>
              {showLog && (
                <pre className="mt-1.5 max-h-40 overflow-auto rounded-lg border border-slate-800 bg-black/40 p-2 text-[10px] text-slate-400 whitespace-pre-wrap">
                  {bgRun?.liveLog || "Waiting for output…"}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      {vpnAsk && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setVpnAsk(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
              <ShieldAlert size={16} />Is your VPN connected, and is the MyKad emulator running?
            </p>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Same requirement as a single run — every one of these {selected.length} runs sets eSIM&apos;s Response
              Code and needs the MyKad emulator at <span className="font-mono text-slate-300">localhost:7878</span>{" "}
              reachable for its whole duration, not just the first run.
            </p>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setVpnAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">
                Not yet — cancel
              </button>
              <button onClick={() => { setVpnAsk(false); startBulk(); }} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Confirmed — VPN + Emulator Ready
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
