"use client";
import { useState } from "react";
import {
  Play, Loader2, CheckCircle2, XCircle, Monitor, MonitorOff,
  ChevronDown, ShoppingCart, Video, Clock, SkipForward,
  AlertTriangle, ChevronRight,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";

const ENV_PRESETS = [
  { label: "UAT1", value: "https://staging.eauto.my/uat1" },
  { label: "UAT2", value: "https://staging.eauto.my/uat2" },
  { label: "UAT3", value: "https://staging.eauto.my/uat3" },
  { label: "SIT1", value: "https://staging.eauto.my/sit1" },
  { label: "SIT3", value: "https://staging.eauto.my/sit3" },
] as const;

interface Scenario {
  id: string;
  title: string;
  user: "UCD" | "BO";
}

interface ScenarioGroup {
  label: string;
  scenarios: Scenario[];
}

const TEST_GROUPS: ScenarioGroup[] = [
  {
    label: "Reschedule & Handling",
    scenarios: [
      { id: "rs-1", title: "Reschedule on the day of the initial appointment to a future date", user: "UCD" },
      { id: "rs-2", title: "Reschedule before the day of the appointment to a future date", user: "UCD" },
      { id: "rs-3", title: "Reschedule after 1 appointment has successfully finished", user: "UCD" },
      { id: "rs-4", title: "Slot taken mid selection", user: "UCD" },
      { id: "rs-5", title: "Reschedule cancelled appointment", user: "UCD" },
      { id: "rs-6", title: "Reschedule failed appointment", user: "UCD" },
      { id: "rs-7", title: "BO reschedule normal flow", user: "BO" },
      { id: "rs-8", title: "BO reschedule on same day different time slot and the next day", user: "BO" },
      { id: "rs-9", title: "Reschedule after appointment status = cancel", user: "BO" },
      { id: "rs-10", title: "Reschedule after appointment status = fail", user: "BO" },
    ],
  },
  {
    label: "Add Appointment (BO)",
    scenarios: [
      { id: "aa-1", title: "Add Appointment - Offline Purchase", user: "BO" },
      { id: "aa-2", title: "Add Appointment - Partial Booking Call-in", user: "BO" },
      { id: "aa-3", title: "Full date booking", user: "BO" },
      { id: "aa-4", title: "Morning Slot Booking", user: "BO" },
      { id: "aa-5", title: "Evening Slot Booking", user: "BO" },
    ],
  },
  {
    label: "Slot Capacity & Boundary",
    scenarios: [
      { id: "sc-1", title: "Morning Slot - Book until full", user: "UCD" },
      { id: "sc-2", title: "Afternoon Slot - Book until full", user: "UCD" },
      { id: "sc-3", title: "Day capacity reach 6/6", user: "UCD" },
      { id: "sc-4", title: "Software Installation - Mandatory Booking", user: "UCD" },
      { id: "sc-5", title: "Biometric Purchase - Free Install Option", user: "UCD" },
      { id: "sc-6", title: "Biometric Purchase - Paid Install Mandatory", user: "UCD" },
      { id: "sc-7", title: "Two UCD - Select same last available slot", user: "UCD" },
      { id: "sc-8", title: "BO add beyond 6 days limit", user: "BO" },
      { id: "sc-9", title: "Add beyond morning slot limit", user: "BO" },
      { id: "sc-10", title: "Add beyond afternoon slot limit", user: "BO" },
    ],
  },
];

interface TestResult {
  title: string;
  status: string;
  duration: number;
  error: string;
}

interface RunSummary {
  total: number;
  passed: number;
  failed: number;
  skipped: number;
}

interface RunResult {
  exitCode: number;
  results: TestResult[];
  summary: RunSummary;
  recordDir: string;
  recordings: string[];
  stderr: string;
  stdout: string;
  logs: string[];
  timestamp: string;
}

const CREDS_KEY = "shopping_cart_test_creds";

function loadCreds() {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ucdUser: "", ucdPass: "", boUser: "", boPass: "" };
}

function saveCreds(c: { ucdUser: string; ucdPass: string; boUser: string; boPass: string }) {
  localStorage.setItem(CREDS_KEY, JSON.stringify(c));
}

function StatusIcon({ status }: { status: string }) {
  if (status === "passed") return <CheckCircle2 size={14} className="text-green-400 shrink-0" />;
  if (status === "failed") return <XCircle size={14} className="text-red-400 shrink-0" />;
  if (status === "skipped") return <SkipForward size={14} className="text-yellow-400 shrink-0" />;
  return <Clock size={14} className="text-slate-500 shrink-0" />;
}

export default function ShoppingCartPage() {
  useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(TEST_GROUPS.map(g => g.label))
  );
  const [headless, setHeadless] = useState(true);
  const [baseUrl, setBaseUrl] = useState(ENV_PRESETS[0].value);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [showStderr, setShowStderr] = useState(false);

  const saved = typeof window !== "undefined" ? loadCreds() : { ucdUser: "", ucdPass: "", boUser: "", boPass: "" };
  const [ucdUser, setUcdUser] = useState(saved.ucdUser);
  const [ucdPass, setUcdPass] = useState(saved.ucdPass);
  const [boUser, setBoUser] = useState(saved.boUser);
  const [boPass, setBoPass] = useState(saved.boPass);

  function toggleGroup(label: string) {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  function toggleScenario(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll(group: ScenarioGroup) {
    setSelected(prev => {
      const next = new Set(prev);
      const allSelected = group.scenarios.every(s => next.has(s.id));
      group.scenarios.forEach(s => allSelected ? next.delete(s.id) : next.add(s.id));
      return next;
    });
  }

  function selectAllScenarios() {
    const allIds = TEST_GROUPS.flatMap(g => g.scenarios.map(s => s.id));
    const allSelected = allIds.every(id => selected.has(id));
    setSelected(allSelected ? new Set() : new Set(allIds));
  }

  function toggleError(idx: number) {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  async function runTests() {
    if (!selected.size) return;
    saveCreds({ ucdUser, ucdPass, boUser, boPass });
    setRunning(true);
    setError("");
    setRunResult(null);
    setExpandedErrors(new Set());
    setShowStderr(false);

    const scenarioTitles = TEST_GROUPS
      .flatMap(g => g.scenarios)
      .filter(s => selected.has(s.id))
      .map(s => s.title);

    try {
      const res = await fetch("/api/eauto/shopping-cart/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarios: scenarioTitles,
          headless,
          baseUrl,
          ucdUser,
          ucdPass,
          boUser,
          boPass,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Run failed (${res.status})`);
      setRunResult(data);
      // Auto-expand all failed errors
      const failedIndices = new Set<number>();
      (data.results as TestResult[]).forEach((r, i) => {
        if (r.status === "failed" && r.error) failedIndices.add(i);
      });
      setExpandedErrors(failedIndices);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  const needsBO = TEST_GROUPS.flatMap(g => g.scenarios)
    .some(s => selected.has(s.id) && s.user === "BO");
  const needsUCD = TEST_GROUPS.flatMap(g => g.scenarios)
    .some(s => selected.has(s.id) && s.user === "UCD");

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-purple-600/20 rounded-xl flex items-center justify-center">
          <ShoppingCart size={18} className="text-purple-400" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-slate-100">Shopping Cart — Test Runner</h1>
          <p className="text-xs text-slate-500">Service Hub module automation tests</p>
        </div>
      </div>

      {/* Config bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500">Environment</label>
            <select
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {ENV_PRESETS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setHeadless(v => !v)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors",
              headless
                ? "bg-slate-800 border-slate-700 text-slate-400"
                : "bg-blue-600/20 border-blue-500/30 text-blue-300"
            )}
          >
            {headless ? <MonitorOff size={13} /> : <Monitor size={13} />}
            {headless ? "Headless" : "Headed (visible browser)"}
          </button>

          <div className="flex-1" />

          <button
            onClick={runTests}
            disabled={running || !selected.size}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              running || !selected.size
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-500 text-white"
            )}
          >
            {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {running ? "Running..." : `Run ${selected.size} test${selected.size !== 1 ? "s" : ""}`}
          </button>
        </div>

        {/* Credentials — always show when any scenario is selected */}
        {(needsUCD || needsBO) && (
          <div className="grid grid-cols-2 gap-3">
            {needsUCD && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">UCD Login</p>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Username" value={ucdUser}
                    onChange={e => setUcdUser(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="password" placeholder="Password" value={ucdPass}
                    onChange={e => setUcdPass(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
            {needsBO && (
              <div className="space-y-1.5">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">BO Login</p>
                <div className="flex gap-2">
                  <input
                    type="text" placeholder="Username" value={boUser}
                    onChange={e => setBoUser(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                  <input
                    type="password" placeholder="Password" value={boPass}
                    onChange={e => setBoPass(e.target.value)}
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scenario selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-slate-300">Test Scenarios</h2>
          <button
            onClick={selectAllScenarios}
            className="text-[11px] text-blue-400 hover:text-blue-300 transition-colors"
          >
            {TEST_GROUPS.flatMap(g => g.scenarios).every(s => selected.has(s.id)) ? "Deselect all" : "Select all"}
          </button>
        </div>

        {TEST_GROUPS.map(group => {
          const isOpen = expandedGroups.has(group.label);
          const groupSelected = group.scenarios.filter(s => selected.has(s.id)).length;
          const allSelected = groupSelected === group.scenarios.length;

          return (
            <div key={group.label} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-slate-800/50 transition-colors"
              >
                <ChevronDown size={14} className={clsx("text-slate-500 transition-transform", isOpen && "rotate-180")} />
                <span className="text-sm font-medium text-slate-200 flex-1">{group.label}</span>
                <span className="text-[10px] text-slate-500">
                  {groupSelected}/{group.scenarios.length}
                </span>
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); selectAll(group); }}
                  className={clsx(
                    "text-[10px] px-2 py-0.5 rounded border transition-colors cursor-pointer",
                    allSelected
                      ? "bg-blue-600/20 border-blue-500/30 text-blue-300"
                      : "border-slate-700 text-slate-500 hover:text-slate-300"
                  )}
                >
                  {allSelected ? "Deselect" : "Select all"}
                </span>
              </div>

              {isOpen && (
                <div className="border-t border-slate-800">
                  {group.scenarios.map(scenario => (
                    <label
                      key={scenario.id}
                      className={clsx(
                        "flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors",
                        selected.has(scenario.id) ? "bg-blue-600/5" : "hover:bg-slate-800/30"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(scenario.id)}
                        onChange={() => toggleScenario(scenario.id)}
                        className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className={clsx(
                        "text-xs flex-1",
                        selected.has(scenario.id) ? "text-slate-200" : "text-slate-400"
                      )}>
                        {scenario.title}
                      </span>
                      <span className={clsx(
                        "text-[10px] px-1.5 py-0.5 rounded-md",
                        scenario.user === "UCD"
                          ? "bg-blue-900/40 text-blue-300"
                          : "bg-amber-900/40 text-amber-300"
                      )}>
                        {scenario.user}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Error from fetch */}
      {error && (
        <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle size={14} className="text-red-400 shrink-0 mt-0.5" />
          <span className="text-xs text-red-300">{error}</span>
        </div>
      )}

      {/* Results */}
      {runResult && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          {/* Summary header */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-medium text-slate-200 flex-1">Results</h3>
            {runResult.summary.passed > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-green-900/40 text-green-300 font-medium">
                {runResult.summary.passed} passed
              </span>
            )}
            {runResult.summary.failed > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-900/40 text-red-300 font-medium">
                {runResult.summary.failed} failed
              </span>
            )}
            {runResult.summary.skipped > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-yellow-900/40 text-yellow-300 font-medium">
                {runResult.summary.skipped} skipped
              </span>
            )}
            <span className="text-[10px] text-slate-600">{runResult.timestamp}</span>
          </div>

          {/* Individual results */}
          <div>
            {runResult.results.map((r, i) => (
              <div key={i} className="border-b border-slate-800/50 last:border-0">
                <div
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2",
                    r.status === "failed" && r.error && "cursor-pointer hover:bg-slate-800/30"
                  )}
                  onClick={() => r.status === "failed" && r.error && toggleError(i)}
                >
                  <StatusIcon status={r.status} />
                  <span className={clsx(
                    "text-xs flex-1",
                    r.status === "passed" ? "text-slate-300"
                      : r.status === "failed" ? "text-red-300"
                      : r.status === "skipped" ? "text-yellow-300"
                      : "text-slate-500"
                  )}>
                    {r.title}
                  </span>
                  <span className="text-[10px] text-slate-600">
                    {(r.duration / 1000).toFixed(1)}s
                  </span>
                  {r.status === "failed" && r.error && (
                    <ChevronRight size={12} className={clsx(
                      "text-slate-600 transition-transform",
                      expandedErrors.has(i) && "rotate-90"
                    )} />
                  )}
                </div>

                {/* Error details */}
                {r.status === "failed" && r.error && expandedErrors.has(i) && (
                  <div className="px-4 pb-3 pt-0">
                    <pre className="text-[11px] text-red-300/80 bg-red-950/20 border border-red-900/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto max-h-60 overflow-y-auto font-mono leading-relaxed">
                      {r.error}
                    </pre>
                  </div>
                )}
              </div>
            ))}

            {runResult.results.length === 0 && (
              <div className="px-4 py-3 text-xs text-slate-500">
                No test results captured. The test runner may have failed to start.
              </div>
            )}
          </div>

          {/* Recordings */}
          {runResult.recordings.length > 0 && (
            <div className="border-t border-slate-800 px-4 py-3">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Video size={11} /> Recordings ({runResult.recordings.length})
              </p>
              <div className="space-y-1">
                {runResult.recordings.map((rec, i) => (
                  <div key={i} className="text-[11px] text-slate-400 font-mono truncate">
                    {rec}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-2">
                Saved to: <span className="font-mono">{runResult.recordDir}/</span>
              </p>
            </div>
          )}

          {/* Debug logs — always show */}
          {runResult.logs?.length > 0 && (
            <div className="border-t border-slate-800">
              <button
                onClick={() => setShowStderr(v => !v)}
                className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-slate-800/30 transition-colors"
              >
                <ChevronRight size={12} className={clsx("text-slate-600 transition-transform", showStderr && "rotate-90")} />
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Debug Logs</span>
              </button>
              {showStderr && (
                <div className="px-4 pb-3 space-y-2">
                  <pre className="text-[11px] text-blue-400 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-slate-950 rounded-lg p-3">
                    {runResult.logs.join("\n")}
                  </pre>
                  {runResult.stdout && (
                    <>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Stdout</p>
                      <pre className="text-[11px] text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-slate-950 rounded-lg p-3">
                        {runResult.stdout}
                      </pre>
                    </>
                  )}
                  {runResult.stderr && (
                    <>
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Stderr</p>
                      <pre className="text-[11px] text-red-400/80 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-slate-950 rounded-lg p-3">
                        {runResult.stderr}
                      </pre>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
