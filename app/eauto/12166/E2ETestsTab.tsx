"use client";
import { useState } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, Film,
  ChevronDown, ChevronRight, Download, Image as ImageIcon, FileArchive,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import EvidenceBulkDownload, { EvidenceGroupCheckbox, toEvidenceStatus, type EvidenceGroup } from "@/components/EvidenceBulkDownload";
import PastRunsSection from "./PastRunsSection";
import { useTsPassState, TS_PASS_ROW, TS_PASS_TITLE } from "@/lib/tsPassState";

/** Registry key for this page's run in AppShell's background-run store — see
 *  hooks/useBackgroundRuns.ts. Keeps the run (and its results) alive across
 *  navigating to another dashboard page and back. */
const RUN_KEY = "eauto/12166";

// EAINT-12166 — [eAuto-BackOffice] Service Hub: Enable DO Creation for
// Device Purchase with Interim Document Upload Space, +
// EAINT-12167 — [eAuto-BackOffice] Service Hub: Allow Ops to Input Device SN
// on Device Purchase SR Info Page When Updating Delivery Status to Arranged.
//
// One combined page for both tickets — 12166 (DO auto-generation) cannot be
// meaningfully tested without 12167's serial data existing first, and every
// E2E scenario below already spans both. Specs live in
// tests/service-hub/specs/device-purchase-do-ts*.spec.ts. See
// knowledge/flow-device-purchase.md for the full study, and the combined
// study artifact for the original 8 click-through chains
// (https://claude.ai/code/artifact/272e5af6-2f09-475b-aef5-6ea929e24bc9).

const ENV_PRESETS = [
  { label: "UAT1", value: "https://staging.eauto.my/uat1" },
  { label: "UAT2", value: "https://staging.eauto.my/uat2" },
  { label: "UAT3", value: "https://staging.eauto.my/uat3" },
  { label: "UAT4", value: "https://staging.eauto.my/uat4" },
  { label: "SIT1", value: "https://staging.eauto.my/sit1" },
  { label: "SIT2", value: "https://staging.eauto.my/sit2" },
  { label: "SIT3", value: "https://staging.eauto.my/sit3" },
] as const;

interface Scenario {
  id: string;
  /** MUST match the spec's test() title exactly — the runner greps by it. */
  title: string;
  summary: string;
  needsBo2?: boolean;
  note?: string;
  /** Pauses mid-run for a human/dev hand-off — see tests/service-hub/utils/manualGate.ts. */
  pausesForManualGate?: boolean;
}

const SCENARIOS: Scenario[] = [
  {
    id: "ts01",
    title: "12166_67_E2E_TS01",
    summary: "Baseline happy path — purchase, serial capture, Arranged, DO download, re-download identical",
  },
  {
    id: "ts02",
    title: "12166_67_E2E_TS02",
    summary: "41→40 quantity clamp, 40-unit split (2 DOs, 2-page PDF), Officer B check, invalid status transition",
    needsBo2: true,
    note: "The Officer B leg needs a SECOND BO Hub Admin account below — skips gracefully if left blank.",
  },
  {
    id: "ts03",
    title: "12166_67_E2E_TS03",
    summary: "REQ-008 snapshot rule (edits Company Management, restores it after) + extra installations print as quantity + extras, in words — one purchase covers both",
  },
  {
    id: "ts04",
    title: "12166_67_E2E_TS04",
    summary: "Report Engine outage — save still succeeds while down, [DO] fails with the REQ-006 error, PDF recovers once restarted, DO numbers keep sequencing",
    note: "Pauses TWICE for a real dev hand-off (stop the Report Engine, later restart it) — a banner + Resume button appears below once the run reaches each pause point. The \"incomplete details\" and next-calendar-day legs are skipped (see knowledge/flow-device-purchase.md).",
    pausesForManualGate: true,
  },
  {
    id: "ts05",
    title: "12166_67_E2E_TS05",
    summary: "Pre-release legacy transaction (BO-side only for now) — searches the real BO listing for records dated before the release: no [DO] button, DO Number '-', Serial No. column present at any age",
    note: "Read-only against whatever pre-release records genuinely exist in this environment — skips a leg gracefully if none qualify. UCD-side and 41→40-quantity legs are dropped for now (no prior-month transactions in this environment) — see knowledge base.",
  },
  {
    id: "ts06",
    title: "12166_67_E2E_TS06",
    summary: "Single-device purchase — DO shows exactly 1 Serial No. box on 1 page",
    note: "Only covers the DO's own single-serial rendering — the UCD quantity-box \"clear to 1\" interaction itself isn't automated yet (see knowledge base).",
  },
  {
    id: "ts07",
    title: "12166_67_E2E_TS07",
    summary: "[DO] button visibility by category — Purchase-only / Purchase+Install / Install-only",
  },
  {
    id: "ts08",
    title: "12166_67_E2E_TS08",
    summary: "Serial No. validation — blank, 7-char, 13-char, symbol, duplicate (native alert), then valid save",
  },
];

const NOT_AUTOMATED: { id: string; label: string; reason: string }[] = [];

interface RunStep {
  title: string;
  duration: number;
  error?: string;
  steps: RunStep[];
}
interface TestResultItem {
  title: string;
  status: string;
  duration: number;
  error: string;
  friendlyError: string;
  steps?: RunStep[];
}
interface EvidenceItem {
  label: string;
  url: string;
  kind: "video" | "image" | "trace";
}
interface RunResponse {
  results?: TestResultItem[];
  summary?: { total: number; passed: number; failed: number; skipped: number };
  error?: string;
  stopped?: boolean;
  evidence?: EvidenceItem[];
  logs?: string[];
  stdout?: string;
  stderr?: string;
  timestamp?: string;
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

function countSteps(steps: RunStep[]): number {
  return steps.reduce((n, s) => n + 1 + countSteps(s.steps), 0);
}

/** Renders the authored test.step() tree (values embedded in each title,
 *  e.g. `Fill 40 serial number(s): AB12CD34EF01, ...`, `Read "Delivery
 *  Status:" = "Arranged"`) so a reviewer can pinpoint exactly what data was
 *  used/checked and in what order, not just pass/fail per whole test. */
function StepTree({ steps, depth = 0 }: { steps: RunStep[]; depth?: number }) {
  return (
    <ul className={depth === 0 ? "space-y-0.5" : "space-y-0.5 ml-3 border-l border-slate-800 pl-3 mt-0.5"}>
      {steps.map((s, i) => (
        <li key={i}>
          <div className="flex items-start gap-1.5 text-xs">
            {s.error
              ? <XCircle size={11} className="text-red-400 shrink-0 mt-0.5" />
              : <CheckCircle2 size={11} className="text-slate-600 shrink-0 mt-0.5" />}
            <span className={clsx("flex-1 font-mono", s.error ? "text-red-300" : "text-slate-400")}>{s.title}</span>
            <span className="text-slate-600 shrink-0">{s.duration}ms</span>
          </div>
          {s.error && <p className="ml-4 mt-0.5 text-[11px] text-red-400/80 whitespace-pre-wrap font-mono">{s.error}</p>}
          {s.steps.length > 0 && <StepTree steps={s.steps} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

const CREDS_KEY = "eauto_12166_creds";
interface Creds {
  ucdUser: string; ucdPass: string;
  boUser: string; boPass: string;
  bo2User: string; bo2Pass: string;
}
const DEFAULT_CREDS: Creds = { ucdUser: "", ucdPass: "", boUser: "", boPass: "", bo2User: "", bo2Pass: "" };

function loadCreds(): Creds {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return { ...DEFAULT_CREDS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_CREDS;
}

export default function E2ETestsTab() {
  // TS rows tinted from the TS Tracker: light green = passed in automation, darker = passed by hand.
  const passState = useTsPassState();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [baseUrl, setBaseUrl] = useState<string>(ENV_PRESETS[0].value);
  const [headless, setHeadless] = useState(true);
  const [detailed, setDetailed] = useState(true);
  const [showLog, setShowLog] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  function toggleSteps(i: number) {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  }

  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const [formError, setFormError] = useState("");
  const error = formError || bgRun?.error || "";
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadAllError, setDownloadAllError] = useState("");
  const [resuming, setResuming] = useState(false);
  const [resumeError, setResumeError] = useState("");

  // TS04's manual gate (see tests/service-hub/utils/manualGate.ts) rides on
  // the existing liveLog poll — app/api/eauto/12166/live-log/route.ts emits
  // a single marker line while a gate is waiting: "[GATE:waiting:<id>] <msg>".
  const gateMatch = bgRun?.liveLog?.match(/^\[GATE:waiting:([\w-]+)\]\s*(.*)$/);
  const activeGate = gateMatch ? { id: gateMatch[1], message: gateMatch[2] } : null;

  async function resumeGate() {
    if (!activeGate || !bgRun) return;
    setResuming(true);
    setResumeError("");
    try {
      const r = await fetch("/api/eauto/12166/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId: bgRun.runId, gateId: activeGate.id }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? `Resume failed (${r.status})`);
      }
    } catch (e) {
      setResumeError(e instanceof Error ? e.message : "Failed to resume.");
    } finally {
      setResuming(false);
    }
  }

  /** "ts01" -> "TS01", "ts03" -> "TS03" — same code the evidence naming
   *  itself uses, so the downloaded zip's name always matches what's inside
   *  it. Still handles a multi-digit id sharing one TS number gracefully
   *  (dedupes via the Set in zipFilenameFor below) in case a scenario ever
   *  gets split again in the future. */
  function tsCodeFromScenarioId(id: string): string {
    const m = id.match(/ts(\d+)/i);
    return m ? `TS${m[1].padStart(2, "0")}` : id.toUpperCase();
  }

  /** Always exactly this shape — one or more TS codes appended to the
   *  ticket's own id format, per Faizuddin's 2026-09-24 request: never a
   *  timestamp or "evidence" in the name, just "12166_67_E2E_TSXX" (joined
   *  with "_" when a run covered more than one scenario). */
  function zipFilenameFor(scenarioIds: string[]): string {
    const codes = Array.from(new Set(scenarioIds.map(tsCodeFromScenarioId)));
    const suffix = codes.length ? codes.join("_") : "ALL";
    return `12166_67_E2E_${suffix}.zip`;
  }

  /** `folders` = per-test evidence subfolders to include (Passed only /
   *  Failed only / Selected); omitted = the whole run. */
  async function downloadAllEvidence(runId: string, scenarioIds: string[], folders?: string[]) {
    setDownloadingAll(true);
    setDownloadAllError("");
    try {
      const r = await fetch("/api/eauto/12166/download-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, ...(folders ? { folders } : {}) }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? `Download failed (${r.status})`);
      }
      const blob = await r.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl; a.download = zipFilenameFor(scenarioIds);
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setDownloadAllError(e instanceof Error ? e.message : "Failed to download the evidence bundle.");
    } finally {
      setDownloadingAll(false);
    }
  }
  const res = (bgRun?.result as RunResponse | null) ?? null;

  // Evidence is published per test under "<test title>/<file>" — those
  // folders are the groups for Download All / Passed only / Failed only /
  // Selected (Faizuddin, 2026-10-21).
  const [bulkPicked, setBulkPicked] = useState<Set<string>>(new Set());
  const toggleBulk = (key: string) => setBulkPicked(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  const folderOf = (e: EvidenceItem) => (e.label.includes("/") ? e.label.split("/")[0] : "");
  const statusOfFolder = (folder: string) => toEvidenceStatus(res?.results?.find(r => r.title === folder)?.status);
  const evidenceGroups: EvidenceGroup[] = Array.from(new Set((res?.evidence ?? []).map(folderOf).filter(Boolean))).map(folder => ({
    key: folder, label: folder, status: statusOfFolder(folder), fileCount: (res?.evidence ?? []).filter(e => folderOf(e) === folder).length,
  }));

  const saved = typeof window !== "undefined" ? loadCreds() : DEFAULT_CREDS;
  const [creds, setCreds] = useState<Creds>(saved);
  const set = (k: keyof Creds, v: string) => setCreds((p) => ({ ...p, [k]: v }));

  const selectedScenarios = SCENARIOS.filter((s) => selected.has(s.id));
  const needsBo2 = selectedScenarios.some((s) => s.needsBo2);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function run() {
    if (!selected.size) { setFormError("Select at least one test case."); return; }
    const missing: string[] = [];
    if (!creds.ucdUser.trim()) missing.push("UCD username");
    if (!creds.ucdPass.trim()) missing.push("UCD password");
    if (!creds.boUser.trim()) missing.push("BO username");
    if (!creds.boPass.trim()) missing.push("BO password");
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    setFormError("");

    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto/12166/run",
      stopUrl: "/api/eauto/12166/run",
      // Polled every 2s while the run is in flight — only used to surface a
      // TS04 manual gate (see tests/service-hub/utils/manualGate.ts) as a
      // pause banner below; every other scenario just gets an empty log.
      liveLogUrl: "/api/eauto/12166/live-log",
      meta: { scenarios: selectedScenarios.map((s) => s.id) },
      body: {
        scenarios: selectedScenarios.map((s) => s.title),
        baseUrl,
        headless,
        detailed,
        ...creds,
      },
    });
  }

  function stop() { stopRun(RUN_KEY); }

  return (
    <div className="flex-1 grid grid-cols-1 lg:grid-cols-[340px_1fr]">
      <aside className="border-r border-slate-800 p-4 space-y-3">
        <div>
          <label className={label}>Environment</label>
          <select value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} className={field}>
            {ENV_PRESETS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>UCD user <span className="text-red-400">*</span></label>
            <input value={creds.ucdUser} onChange={(e) => set("ucdUser", e.target.value)} className={field} /></div>
          <div><label className={label}>Password <span className="text-red-400">*</span></label>
            <input type="password" value={creds.ucdPass} onChange={(e) => set("ucdPass", e.target.value)} className={field} /></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>BO user (Officer A) <span className="text-red-400">*</span></label>
            <input value={creds.boUser} onChange={(e) => set("boUser", e.target.value)} className={field} /></div>
          <div><label className={label}>Password <span className="text-red-400">*</span></label>
            <input type="password" value={creds.boPass} onChange={(e) => set("boPass", e.target.value)} className={field} /></div>
        </div>

        {needsBo2 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={label}>BO user (Officer B)</label>
                <input value={creds.bo2User} onChange={(e) => set("bo2User", e.target.value)} className={field} /></div>
              <div><label className={label}>Password</label>
                <input type="password" value={creds.bo2Pass} onChange={(e) => set("bo2Pass", e.target.value)} className={field} /></div>
            </div>
            <p className="flex items-start gap-1.5 text-[11px] leading-snug text-amber-400/90">
              <AlertTriangle size={12} className="shrink-0 mt-0.5" />
              Leave blank to skip TS02&apos;s Officer B leg — it must be a DIFFERENT BO Hub Admin account from Officer A above.
            </p>
          </>
        )}

        <label className="flex items-center gap-2 text-xs text-slate-400 pt-1">
          <input type="checkbox" checked={headless} onChange={(e) => setHeadless(e.target.checked)}
            className="accent-indigo-600" />
          Headless
        </label>

        <label className="flex items-center gap-2 text-xs text-slate-400" title="Slows the run down and highlights each button/field/value being acted on or checked, so the recording is easy to review step by step.">
          <input type="checkbox" checked={detailed} onChange={(e) => setDetailed(e.target.checked)}
            className="accent-indigo-600" />
          Detailed (slow + highlighted)
        </label>

        <div className="flex gap-2 pt-1">
          {!running ? (
            <button onClick={run} disabled={!selected.size}
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
              Test cases <span className="text-slate-600 normal-case tracking-normal">· 8 of 8 E2E scenarios</span>
            </p>
            <button onClick={() => setSelected(new Set(SCENARIOS.map((s) => s.id)))}
              className="text-xs text-indigo-400 hover:text-indigo-300">Select all</button>
            <button onClick={() => setSelected(new Set())}
              className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
          </div>
          <div className="divide-y divide-slate-800/70">
            {SCENARIOS.map((s) => (
              <label key={s.id} title={passState(s.title) ? TS_PASS_TITLE[passState(s.title)!] : undefined}
                className={`flex gap-3 px-4 py-2.5 cursor-pointer ${passState(s.title) ? TS_PASS_ROW[passState(s.title)!] : "hover:bg-slate-800/40"}`}>
                <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)}
                  className="mt-1 accent-indigo-600 shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-mono text-slate-300">{s.title.split(" — ")[0]}</span>
                  {s.pausesForManualGate && (
                    <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-400 border border-amber-800/60 bg-amber-950/40 rounded px-1.5 py-0.5 align-middle">
                      Pauses for dev
                    </span>
                  )}
                  <p className="text-xs text-slate-400 mt-0.5">{s.summary}</p>
                  {s.note && <p className="text-[11px] text-slate-500 mt-1 leading-snug">{s.note}</p>}
                </div>
              </label>
            ))}
          </div>
          {NOT_AUTOMATED.length > 0 && (
            <div className="px-4 py-3 border-t border-slate-800 space-y-1.5">
              <p className="text-[11px] text-slate-600 uppercase tracking-wider font-semibold">Not automated</p>
              {NOT_AUTOMATED.map((n) => (
                <p key={n.id} className="text-[11px] text-slate-500 leading-snug">
                  <span className="text-slate-400 font-medium">{n.label}</span> — {n.reason}
                </p>
              ))}
            </div>
          )}
        </div>

        {running && !activeGate && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={15} className="animate-spin" />
            Running against {String(bgRun?.meta ? baseUrl : baseUrl).replace("https://staging.eauto.my/", "")}…
          </div>
        )}

        {running && activeGate && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3">
            <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-amber-200 font-medium">Paused — waiting on you</p>
              <p className="text-xs text-amber-300/90 mt-0.5 leading-relaxed">{activeGate.message}</p>
              {resumeError && <p className="text-xs text-red-400 mt-1">{resumeError}</p>}
            </div>
            <button onClick={resumeGate} disabled={resuming}
              className="shrink-0 flex items-center gap-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-lg px-3 py-1.5">
              {resuming ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              Resume
            </button>
          </div>
        )}
        {res?.stopped && <p className="text-sm text-amber-400">Run stopped.</p>}

        {orphaned && !res && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="flex-1 text-xs text-amber-200 leading-relaxed">
              A run was still going when this browser reloaded, so the dashboard lost track of it.
              It may well have finished — check the terminal.
            </p>
          </div>
        )}

        {res?.summary && (
          <p className="text-xs text-slate-400">
            <span className="text-green-400">{res.summary.passed} passed</span>
            {" · "}
            <span className={res.summary.failed ? "text-red-400" : ""}>{res.summary.failed} failed</span>
            {" · "}
            <span className="text-slate-500">{res.summary.skipped} skipped</span>
          </p>
        )}

        {res?.results && res.results.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800/70">
            {res.results.map((r, i) => (
              <div key={i} className="px-4 py-3">
                <div className="flex items-start gap-2">
                  {r.status === "passed"
                    ? <CheckCircle2 size={15} className="text-green-400 shrink-0 mt-0.5" />
                    : r.status === "skipped"
                      ? <AlertTriangle size={15} className="text-slate-500 shrink-0 mt-0.5" />
                      : <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />}
                  <p className="text-sm text-slate-300 flex-1">{r.title}</p>
                </div>
                {r.friendlyError && <p className="mt-1.5 ml-6 text-xs text-red-400/90">{r.friendlyError}</p>}
                {r.error && <pre className="mt-2 ml-6 text-xs text-red-400/70 whitespace-pre-wrap font-mono max-h-40 overflow-y-auto">{r.error}</pre>}
                {r.steps && r.steps.length > 0 && (
                  <div className="mt-2 ml-6">
                    <button onClick={() => toggleSteps(i)}
                      className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300">
                      {expandedSteps.has(i) ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                      Detailed log ({countSteps(r.steps)} steps)
                    </button>
                    {expandedSteps.has(i) && (
                      <div className="mt-1.5 max-h-96 overflow-y-auto">
                        <StepTree steps={r.steps} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {res?.evidence && res.evidence.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-3">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex items-center gap-1.5 flex-1"><Film size={12} />Evidence ({res.evidence.length} files)</p>
              {evidenceGroups.length < 2 && <button
                onClick={() => downloadAllEvidence(
                  res.timestamp ?? "",
                  (bgRun?.meta?.scenarios as string[] | undefined) ?? Array.from(selected),
                )}
                disabled={downloadingAll || !res.timestamp}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-colors"
              >
                {downloadingAll ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
                {downloadingAll ? "Zipping…" : "Download all"}
              </button>}
            </div>
            <EvidenceBulkDownload groups={evidenceGroups} selected={bulkPicked} busy={downloadingAll}
              onDownload={g => downloadAllEvidence(res.timestamp ?? "", g.map(x => x.key), g.map(x => x.key))}
              onClearSelection={() => setBulkPicked(new Set())} />
            {downloadAllError && <p className="text-[11px] text-red-400">{downloadAllError}</p>}
            <div className="space-y-3">
              {res.evidence.map((e, idx) => (
                <div key={e.url} className="space-y-1">
                  {evidenceGroups.length > 1 && folderOf(e) !== (idx > 0 ? folderOf(res.evidence![idx - 1]) : null) && (
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800 first:border-t-0 first:pt-0">
                      <EvidenceGroupCheckbox checked={bulkPicked.has(folderOf(e))} onChange={() => toggleBulk(folderOf(e))} />
                      {statusOfFolder(folderOf(e)) === "passed" ? <CheckCircle2 size={12} className="text-green-400 shrink-0" />
                        : statusOfFolder(folderOf(e)) === "failed" ? <XCircle size={12} className="text-red-400 shrink-0" /> : null}
                      <span className="text-[11px] font-mono font-semibold text-slate-300">{folderOf(e)}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    {e.kind === "video" ? <Film size={12} className="shrink-0" />
                      : e.kind === "image" ? <ImageIcon size={12} className="shrink-0" />
                        : <FileArchive size={12} className="shrink-0" />}
                    <span className="font-mono break-all flex-1">{e.label}</span>
                    <a href={e.url} download className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 shrink-0">
                      <Download size={11} />Download
                    </a>
                  </div>
                  {e.kind === "video" && (
                    <video src={e.url} controls className="w-full max-w-xl rounded-lg border border-slate-800" />
                  )}
                  {e.kind === "image" && (
                    <img src={e.url} alt={e.label} className="max-w-xl rounded-lg border border-slate-800" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <PastRunsSection
          historyUrl="/api/eauto/12166/history"
          downloadUrl="/api/eauto/12166/download-all"
          currentRunId={res?.timestamp}
          refreshKey={bgRun?.finishedAt}
        />

        {(res?.logs || res?.stdout || res?.stderr) && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl">
            <button onClick={() => setShowLog((v) => !v)}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200">
              {showLog ? <ChevronDown size={13} /> : <ChevronRight size={13} />}Raw run log
            </button>
            {showLog && (
              <pre className="px-4 pb-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
                {(res.logs ?? []).join("\n")}
                {res.stdout}
                {res.stderr}
              </pre>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
