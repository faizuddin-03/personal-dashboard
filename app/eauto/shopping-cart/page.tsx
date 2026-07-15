"use client";
import { useState } from "react";
import {
  Play, Loader2, CheckCircle2, XCircle, Monitor, MonitorOff,
  ChevronDown, ShoppingCart, Video, Clock, SkipForward,
  AlertTriangle, ChevronRight, Check, X, Dot, FlaskConical,
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

type ScenarioParam = "publicHoliday" | "referenceNo";

interface Scenario {
  id: string;
  // MUST match the leaf test() title in the spec exactly — the runner greps
  // by this string, so any drift means the scenario maps to no test.
  title: string;
  user: "UCD" | "BO" | "BOTH";
  // Extra values the user keys in for this scenario (rendered in "Test data").
  params?: ScenarioParam[];
  // True for the successful-path scenarios (a real booking/reschedule/add
  // goes through end to end). False/omitted for negative & boundary checks
  // (blocked dates, caps refused, cancelled/failed handling, concurrency).
  happyFlow?: boolean;
}

interface ScenarioGroup {
  label: string;
  scenarios: Scenario[];
}

const TEST_GROUPS: ScenarioGroup[] = [
  {
    label: "Slot Capacity & Boundary (UCD)",
    scenarios: [
      { id: "sc-1", title: "Morning Slot - Book until full", user: "UCD" },
      { id: "sc-2", title: "Afternoon Slot - Book until full", user: "UCD" },
      { id: "sc-3", title: "Day capacity reach 6/6", user: "UCD" },
      { id: "sc-4", title: "Software Installation - Mandatory Booking", user: "UCD", happyFlow: true },
      { id: "sc-5", title: "Biometric Purchase - Free Install Option (partial booking)", user: "UCD", params: ["referenceNo"], happyFlow: true },
      { id: "sc-6", title: "Biometric Purchase - Free Install Option (no booking)", user: "UCD", params: ["referenceNo"], happyFlow: true },
      { id: "sc-7", title: "Biometric Purchase - Paid Install Mandatory", user: "UCD", happyFlow: true },
      { id: "sc-8", title: "Two UCD - Select same last available slot", user: "UCD" },
    ],
  },
  {
    label: "Calendar Rules (UCD)",
    scenarios: [
      { id: "cal-1", title: "Book for current day and the next day", user: "UCD" },
      { id: "cal-2", title: "Book for previous dates", user: "UCD" },
      { id: "cal-3", title: "Book future dates more than 2 months", user: "UCD" },
      { id: "cal-4", title: "Book weekend dates", user: "UCD" },
      { id: "cal-5", title: "Book Public Holiday", user: "UCD", params: ["publicHoliday"] },
    ],
  },
  {
    label: "Reschedule & Handling",
    scenarios: [
      { id: "rs-1", title: "Reschedule on the day of the initial appointment to a future date", user: "UCD", happyFlow: true },
      { id: "rs-2", title: "Reschedule before the day of the appointment to a future date", user: "UCD", happyFlow: true },
      { id: "rs-3", title: "Reschedule after 1 appointment has successfully finished", user: "UCD", happyFlow: true },
      { id: "rs-4", title: "Same-day reschedule via portal — record becomes Failed", user: "UCD" },
      { id: "rs-5", title: "Slot taken mid selection — concurrency", user: "UCD" },
      { id: "rs-6", title: "Reschedule cancelled appointment — should be blocked", user: "BOTH" },
      { id: "rs-7", title: "Reschedule failed appointment — should be blocked for UCD", user: "BOTH" },
      { id: "rs-8", title: "BO reschedule normal flow", user: "BO", happyFlow: true },
      { id: "rs-9", title: "BO reschedule to afternoon slot", user: "BO", happyFlow: true },
    ],
  },
  {
    label: "Add Appointment (BO)",
    scenarios: [
      { id: "aa-1", title: "Add Appointment - Offline Purchase (New Record)", user: "BO", happyFlow: true },
      { id: "aa-2", title: "Add Appointment - Both slots on one date", user: "BO", happyFlow: true },
      { id: "aa-3", title: "Add Appointment - Partial Booking Call-in", user: "BOTH", happyFlow: true },
      { id: "aa-4", title: "CSE not bound by 6/day cap — can add to a full slot", user: "BO", happyFlow: true },
      { id: "aa-5", title: "Afternoon Slot Booking", user: "BO", happyFlow: true },
    ],
  },
  {
    label: "BO Calendar & Limits",
    scenarios: [
      { id: "bo-1", title: "BO add beyond 6 days limit", user: "BOTH", happyFlow: true },
      { id: "bo-2", title: "BO add beyond morning slot limit", user: "BO", happyFlow: true },
      { id: "bo-3", title: "BO add beyond afternoon slot limit", user: "BO", happyFlow: true },
      { id: "bo-4", title: "BO add for current day and the next day", user: "BO", happyFlow: true },
      { id: "bo-5", title: "BO add for previous dates", user: "BO" },
      { id: "bo-6", title: "BO book future date more than 2 months", user: "BO", happyFlow: true },
      { id: "bo-7", title: "BO book weekend dates", user: "BO" },
      { id: "bo-8", title: "BO book Public Holiday", user: "BO", params: ["publicHoliday"] },
    ],
  },
];

const PARAM_META: Record<ScenarioParam, { label: string; hint: string; type: string; placeholder: string }> = {
  publicHoliday: { label: "Public Holiday date", hint: "The tests try to book this date and expect it greyed out / unclickable.", type: "date", placeholder: "" },
  referenceNo: { label: "Reference No", hint: "Existing SR reference used by the biometric free-install validity checks.", type: "text", placeholder: "e.g. SR67000230" },
};

interface TestStep {
  title: string;
  status: "passed" | "failed";
  category: string; // "test.step" | "expect"
  durationMs: number;
  depth: number;
  error: string;
  friendlyError: string;
}

interface TestResult {
  title: string;
  status: string;
  duration: number;
  error: string;
  friendlyError: string;
  steps: TestStep[];
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

const PARAMS_KEY = "shopping_cart_test_params";

function loadParams(): { publicHoliday: string; referenceNo: string } {
  try {
    const raw = localStorage.getItem(PARAMS_KEY);
    if (raw) return { publicHoliday: "", referenceNo: "", ...JSON.parse(raw) };
  } catch {}
  return { publicHoliday: "", referenceNo: "" };
}

function saveParams(p: { publicHoliday: string; referenceNo: string }) {
  localStorage.setItem(PARAMS_KEY, JSON.stringify(p));
}

function fmtDuration(ms: number): string {
  if (!ms) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

/** Tidy up an auto-recorded assertion step title into human-friendly copy. */
function prettyStep(step: TestStep): string {
  if (step.category !== "expect") return step.title;
  // "expect.toBeVisible", "expect.toBe", "expect "SR123" toHaveText" → readable
  const t = step.title.replace(/^expect(\.soft)?\.?/, "").trim();
  const map: Record<string, string> = {
    toBeVisible: "element is shown",
    toBeHidden: "element is hidden",
    toBe: "value matches",
    toEqual: "value matches",
    toHaveText: "text matches",
    toContainText: "text contains expected",
    toHaveURL: "URL matches",
    not: "condition holds",
  };
  const key = Object.keys(map).find(k => t.includes(k));
  return key ? `Check: ${map[key]}` : `Check: ${t || "assertion"}`;
}

const STATUS_META: Record<string, { label: string; dot: string; text: string; ring: string; bg: string }> = {
  passed: { label: "Passed", dot: "bg-emerald-400", text: "text-emerald-300", ring: "ring-emerald-500/30", bg: "bg-emerald-500/10" },
  failed: { label: "Failed", dot: "bg-rose-400", text: "text-rose-300", ring: "ring-rose-500/30", bg: "bg-rose-500/10" },
  skipped: { label: "Skipped", dot: "bg-amber-400", text: "text-amber-300", ring: "ring-amber-500/30", bg: "bg-amber-500/10" },
};

function TestStatusIcon({ status, size = 18 }: { status: string; size?: number }) {
  if (status === "passed")
    return <span className="grid place-items-center rounded-full bg-emerald-500/15 text-emerald-400" style={{ width: size + 8, height: size + 8 }}><Check size={size - 4} strokeWidth={3} /></span>;
  if (status === "failed")
    return <span className="grid place-items-center rounded-full bg-rose-500/15 text-rose-400" style={{ width: size + 8, height: size + 8 }}><X size={size - 4} strokeWidth={3} /></span>;
  if (status === "skipped")
    return <span className="grid place-items-center rounded-full bg-amber-500/15 text-amber-400" style={{ width: size + 8, height: size + 8 }}><SkipForward size={size - 6} /></span>;
  return <span className="grid place-items-center rounded-full bg-slate-700/40 text-slate-500" style={{ width: size + 8, height: size + 8 }}><Clock size={size - 6} /></span>;
}

export default function ShoppingCartPage() {
  useApp();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(TEST_GROUPS.map(g => g.label))
  );
  const [headless, setHeadless] = useState(true);
  const [detailed, setDetailed] = useState(true);
  const [baseUrl, setBaseUrl] = useState<string>(ENV_PRESETS[0].value);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState<RunResult | null>(null);
  const [error, setError] = useState("");
  const [expandedTests, setExpandedTests] = useState<Set<number>>(new Set());
  const [expandedErrors, setExpandedErrors] = useState<Set<number>>(new Set());
  const [showLogs, setShowLogs] = useState(false);

  const saved = typeof window !== "undefined" ? loadCreds() : { ucdUser: "", ucdPass: "", boUser: "", boPass: "" };
  const [ucdUser, setUcdUser] = useState(saved.ucdUser);
  const [ucdPass, setUcdPass] = useState(saved.ucdPass);
  const [boUser, setBoUser] = useState(saved.boUser);
  const [boPass, setBoPass] = useState(saved.boPass);

  const savedParams = typeof window !== "undefined" ? loadParams() : { publicHoliday: "", referenceNo: "" };
  const [publicHoliday, setPublicHoliday] = useState(savedParams.publicHoliday);
  const [referenceNo, setReferenceNo] = useState(savedParams.referenceNo);

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

  function toggleTest(idx: number) {
    setExpandedTests(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  function toggleErrorDetails(idx: number) {
    setExpandedErrors(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  }

  async function runTests() {
    if (!selected.size) return;
    saveCreds({ ucdUser, ucdPass, boUser, boPass });
    saveParams({ publicHoliday, referenceNo });
    setRunning(true);
    setError("");
    setRunResult(null);
    setExpandedTests(new Set());
    setExpandedErrors(new Set());
    setShowLogs(false);

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
          detailed,
          baseUrl,
          ucdUser,
          ucdPass,
          boUser,
          boPass,
          publicHoliday,
          referenceNo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `Run failed (${res.status})`);
      setRunResult(data);
      // Auto-expand failed tests so the failing step is visible immediately.
      const failed = new Set<number>();
      (data.results as TestResult[]).forEach((r, i) => {
        if (r.status === "failed") failed.add(i);
      });
      setExpandedTests(failed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Run failed");
    } finally {
      setRunning(false);
    }
  }

  const selectedScenarios = TEST_GROUPS.flatMap(g => g.scenarios).filter(s => selected.has(s.id));
  const needsBO = selectedScenarios.some(s => s.user === "BO" || s.user === "BOTH");
  const needsUCD = selectedScenarios.some(s => s.user === "UCD" || s.user === "BOTH");
  const neededParams = new Set<ScenarioParam>();
  selectedScenarios.forEach(s => (s.params ?? []).forEach(p => neededParams.add(p)));
  const paramValue: Record<ScenarioParam, string> = { publicHoliday, referenceNo };
  const paramSetter: Record<ScenarioParam, (v: string) => void> = { publicHoliday: setPublicHoliday, referenceNo: setReferenceNo };

  const totalSelected = selected.size;
  const allSelectedGlobal = TEST_GROUPS.flatMap(g => g.scenarios).every(s => selected.has(s.id));
  const envLabel = ENV_PRESETS.find(p => p.value === baseUrl)?.label ?? baseUrl;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/25 to-indigo-500/10 ring-1 ring-purple-400/20 grid place-items-center">
          <ShoppingCart size={20} className="text-purple-300" />
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-semibold text-slate-100 tracking-tight">Shopping Cart — Test Runner</h1>
          <p className="text-xs text-slate-500">eAuto Service Hub · automated end-to-end checks</p>
        </div>
      </div>

      {/* ── Config toolbar ── */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 pr-2.5 mr-0.5 border-r border-slate-800">
            <label className="text-[11px] text-slate-500 uppercase tracking-wider">Env</label>
            <select
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
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
                ? "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300"
                : "bg-blue-500/15 border-blue-500/30 text-blue-300"
            )}
          >
            {headless ? <MonitorOff size={13} /> : <Monitor size={13} />}
            {headless ? "Headless" : "Headed"}
          </button>

          <button
            onClick={() => setDetailed(v => !v)}
            title="Detailed mode slows the run down and highlights each element being checked, so the recording is easy to review step by step."
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-colors",
              detailed
                ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-300"
            )}
          >
            <Video size={13} />
            {detailed ? "Detailed: on" : "Detailed: off"}
          </button>

          <div className="flex-1" />

          <button
            onClick={runTests}
            disabled={running || !selected.size}
            className={clsx(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
              running || !selected.size
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/20"
            )}
          >
            {running ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? "Running…" : `Run ${totalSelected || ""} ${totalSelected === 1 ? "test" : "tests"}`.trim()}
          </button>
        </div>

        {(needsUCD || needsBO) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {needsUCD && (
              <CredBox label="UCD Login" accent="blue"
                user={ucdUser} pass={ucdPass} onUser={setUcdUser} onPass={setUcdPass} />
            )}
            {needsBO && (
              <CredBox label="BO Login" accent="amber"
                user={boUser} pass={boPass} onUser={setBoUser} onPass={setBoPass} />
            )}
          </div>
        )}

        {neededParams.size > 0 && (
          <div className="border-t border-slate-800 pt-3 space-y-2.5">
            <p className="text-[10px] text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <FlaskConical size={11} /> Test data
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[...neededParams].map(p => {
                const meta = PARAM_META[p];
                return (
                  <div key={p} className="space-y-1">
                    <label className="text-[11px] text-slate-400 font-medium">{meta.label}</label>
                    <input
                      type={meta.type}
                      value={paramValue[p]}
                      placeholder={meta.placeholder}
                      onChange={e => paramSetter[p](e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500 [color-scheme:dark]"
                    />
                    <p className="text-[10px] text-slate-600 leading-snug">{meta.hint}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Scenario selection ── */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-300">Scenarios</h2>
          <button
            onClick={selectAllScenarios}
            className="text-[11px] font-medium text-purple-400 hover:text-purple-300 transition-colors"
          >
            {allSelectedGlobal ? "Clear all" : "Select all"}
          </button>
        </div>

        {TEST_GROUPS.map(group => {
          const isOpen = expandedGroups.has(group.label);
          const groupSelected = group.scenarios.filter(s => selected.has(s.id)).length;
          const allSelected = groupSelected === group.scenarios.length;

          return (
            <div key={group.label} className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
              <div
                onClick={() => toggleGroup(group.label)}
                className="w-full flex items-center gap-2.5 px-4 py-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
              >
                <ChevronDown size={15} className={clsx("text-slate-500 transition-transform", !isOpen && "-rotate-90")} />
                <span className="text-sm font-medium text-slate-200 flex-1">{group.label}</span>
                {groupSelected > 0 && (
                  <span className="text-[10px] font-medium text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full">
                    {groupSelected} selected
                  </span>
                )}
                <span className="text-[11px] text-slate-500 tabular-nums">{groupSelected}/{group.scenarios.length}</span>
                <span
                  role="button"
                  onClick={e => { e.stopPropagation(); selectAll(group); }}
                  className={clsx(
                    "text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer",
                    allSelected
                      ? "bg-purple-500/15 border-purple-500/30 text-purple-300"
                      : "border-slate-700 text-slate-500 hover:text-slate-300"
                  )}
                >
                  {allSelected ? "Clear" : "All"}
                </span>
              </div>

              {isOpen && (
                <div className="border-t border-slate-800/70">
                  {group.scenarios.map(scenario => {
                    const isSel = selected.has(scenario.id);
                    return (
                      <label
                        key={scenario.id}
                        className={clsx(
                          "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-l-2",
                          isSel ? "bg-purple-500/[0.06] border-purple-500/60" : "border-transparent hover:bg-slate-800/30"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleScenario(scenario.id)}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        />
                        <span className={clsx("text-xs flex-1", isSel ? "text-slate-100" : "text-slate-400")}>
                          {scenario.title}
                        </span>
                        {scenario.happyFlow && (
                          <span
                            title="Happy flow — successful path, no error/boundary expected"
                            className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 bg-emerald-500/15 text-emerald-300"
                          >
                            <CheckCircle2 size={11} /> Happy flow
                          </span>
                        )}
                        <UserBadge user={scenario.user} />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Fetch-level error ── */}
      {error && (
        <div className="bg-rose-950/30 border border-rose-800/50 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertTriangle size={15} className="text-rose-400 shrink-0 mt-0.5" />
          <span className="text-xs text-rose-300 leading-relaxed">{error}</span>
        </div>
      )}

      {/* ── Results ── */}
      {runResult && <Results
        runResult={runResult}
        envLabel={envLabel}
        expandedTests={expandedTests}
        expandedErrors={expandedErrors}
        onToggleTest={toggleTest}
        onToggleError={toggleErrorDetails}
        showLogs={showLogs}
        onToggleLogs={() => setShowLogs(v => !v)}
      />}
    </div>
  );
}

function CredBox({ label, accent, user, pass, onUser, onPass }: {
  label: string; accent: "blue" | "amber";
  user: string; pass: string; onUser: (v: string) => void; onPass: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <p className={clsx("text-[10px] uppercase tracking-wider font-medium",
        accent === "blue" ? "text-blue-400/80" : "text-amber-400/80")}>{label}</p>
      <div className="flex gap-2">
        <input
          type="text" placeholder="Username" value={user}
          onChange={e => onUser(e.target.value)}
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
        />
        <input
          type="password" placeholder="Password" value={pass}
          onChange={e => onPass(e.target.value)}
          className="flex-1 min-w-0 bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
        />
      </div>
    </div>
  );
}

function UserBadge({ user }: { user: "UCD" | "BO" | "BOTH" }) {
  const cls = user === "UCD" ? "bg-blue-500/15 text-blue-300"
    : user === "BO" ? "bg-amber-500/15 text-amber-300"
    : "bg-purple-500/15 text-purple-300";
  return <span className={clsx("text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0", cls)}>{user === "BOTH" ? "UCD+BO" : user}</span>;
}

function Results({ runResult, envLabel, expandedTests, expandedErrors, onToggleTest, onToggleError, showLogs, onToggleLogs }: {
  runResult: RunResult;
  envLabel: string;
  expandedTests: Set<number>;
  expandedErrors: Set<number>;
  onToggleTest: (i: number) => void;
  onToggleError: (i: number) => void;
  showLogs: boolean;
  onToggleLogs: () => void;
}) {
  const { summary } = runResult;
  const totalMs = runResult.results.reduce((a, r) => a + (r.duration || 0), 0);
  const pct = (n: number) => summary.total ? `${(n / summary.total) * 100}%` : "0%";

  return (
    <div className="space-y-3">
      {/* Summary card */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3.5">
        <div className="flex items-center gap-2">
          <FlaskConical size={15} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-200 flex-1">Run results</h3>
          <span className="text-[11px] text-slate-500">{envLabel} · {fmtDuration(totalMs)} · {runResult.timestamp.replace("T", " ")}</span>
        </div>

        {/* Segmented progress bar */}
        <div className="flex h-2 rounded-full overflow-hidden bg-slate-800">
          {summary.passed > 0 && <div className="bg-emerald-500" style={{ width: pct(summary.passed) }} />}
          {summary.failed > 0 && <div className="bg-rose-500" style={{ width: pct(summary.failed) }} />}
          {summary.skipped > 0 && <div className="bg-amber-500" style={{ width: pct(summary.skipped) }} />}
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-4 gap-2.5">
          <StatTile label="Total" value={summary.total} tone="slate" />
          <StatTile label="Passed" value={summary.passed} tone="emerald" />
          <StatTile label="Failed" value={summary.failed} tone="rose" />
          <StatTile label="Skipped" value={summary.skipped} tone="amber" />
        </div>
      </div>

      {/* Per-test cards */}
      <div className="space-y-2">
        {runResult.results.map((r, i) => (
          <TestCard
            key={i}
            r={r}
            expanded={expandedTests.has(i)}
            onToggle={() => onToggleTest(i)}
            showError={expandedErrors.has(i)}
            onToggleError={() => onToggleError(i)}
          />
        ))}
        {runResult.results.length === 0 && (
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-500">
            No test results captured — the runner may have failed to start. Check the debug logs below.
          </div>
        )}
      </div>

      {/* Recordings */}
      {runResult.recordings.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Video size={12} /> Recordings · {runResult.recordings.length}
          </p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {runResult.recordings.map((rec, i) => (
              <div key={i} className="text-[11px] text-slate-400 font-mono truncate">{rec}</div>
            ))}
          </div>
          <p className="text-[10px] text-slate-600 mt-2">Saved to <span className="font-mono text-slate-500">{runResult.recordDir}/</span></p>
        </div>
      )}

      {/* Debug logs */}
      {runResult.logs?.length > 0 && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden">
          <button onClick={onToggleLogs} className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-slate-800/40 transition-colors">
            <ChevronRight size={13} className={clsx("text-slate-600 transition-transform", showLogs && "rotate-90")} />
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Debug logs</span>
          </button>
          {showLogs && (
            <div className="px-4 pb-3 space-y-2">
              <pre className="text-[11px] text-blue-300/90 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-slate-950 rounded-lg p-3">{runResult.logs.join("\n")}</pre>
              {runResult.stdout && (<><p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Stdout</p>
                <pre className="text-[11px] text-slate-400 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-slate-950 rounded-lg p-3">{runResult.stdout}</pre></>)}
              {runResult.stderr && (<><p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Stderr</p>
                <pre className="text-[11px] text-rose-400/80 whitespace-pre-wrap max-h-48 overflow-y-auto font-mono bg-slate-950 rounded-lg p-3">{runResult.stderr}</pre></>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatTile({ label, value, tone }: { label: string; value: number; tone: "slate" | "emerald" | "rose" | "amber" }) {
  const toneCls = {
    slate: "text-slate-200",
    emerald: value > 0 ? "text-emerald-300" : "text-slate-600",
    rose: value > 0 ? "text-rose-300" : "text-slate-600",
    amber: value > 0 ? "text-amber-300" : "text-slate-600",
  }[tone];
  return (
    <div className="bg-slate-800/40 rounded-xl px-3 py-2">
      <div className={clsx("text-xl font-semibold tabular-nums", toneCls)}>{value}</div>
      <div className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TestCard({ r, expanded, onToggle, showError, onToggleError }: {
  r: TestResult; expanded: boolean; onToggle: () => void; showError: boolean; onToggleError: () => void;
}) {
  const meta = STATUS_META[r.status] ?? STATUS_META.skipped;
  const stepCount = r.steps?.length ?? 0;
  const failedSteps = r.steps?.filter(s => s.status === "failed").length ?? 0;

  return (
    <div className={clsx("bg-slate-900/70 border rounded-2xl overflow-hidden transition-colors",
      r.status === "failed" ? "border-rose-900/50" : "border-slate-800")}>
      <button onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-800/30 transition-colors">
        <TestStatusIcon status={r.status} />
        <span className={clsx("text-sm flex-1 font-medium",
          r.status === "failed" ? "text-rose-200" : "text-slate-200")}>{r.title}</span>
        {stepCount > 0 && (
          <span className="text-[10px] text-slate-500 hidden sm:inline">
            {failedSteps > 0 ? `${failedSteps} of ${stepCount} steps failed` : `${stepCount} steps`}
          </span>
        )}
        <span className="text-[11px] text-slate-500 tabular-nums">{fmtDuration(r.duration)}</span>
        <ChevronDown size={15} className={clsx("text-slate-600 transition-transform", !expanded && "-rotate-90")} />
      </button>

      {expanded && (
        <div className="border-t border-slate-800/70 px-4 py-3 space-y-3">
          {/* Step checklist */}
          {stepCount > 0 ? (
            <ol className="space-y-0.5">
              {r.steps.map((s, j) => <StepRow key={j} step={s} />)}
            </ol>
          ) : (
            <p className="text-xs text-slate-500">
              {r.status === "skipped"
                ? "Test was skipped (a precondition wasn't met — e.g. no matching data on staging)."
                : "No step detail was captured for this test."}
            </p>
          )}

          {/* Failure summary + technical details */}
          {r.status === "failed" && (r.friendlyError || r.error) && (
            <div className="rounded-xl bg-rose-950/20 border border-rose-900/40 p-3 space-y-2">
              {r.friendlyError && (
                <p className="text-[12px] text-amber-200/90 leading-relaxed">{r.friendlyError}</p>
              )}
              {r.error && (
                <>
                  <button onClick={onToggleError} className="flex items-center gap-1.5 text-[10px] text-slate-500 uppercase tracking-wider hover:text-slate-400">
                    <ChevronRight size={11} className={clsx("transition-transform", showError && "rotate-90")} />
                    Technical details
                  </button>
                  {showError && (
                    <pre className="text-[11px] text-rose-300/80 bg-rose-950/30 border border-rose-900/30 rounded-lg p-3 whitespace-pre-wrap overflow-x-auto max-h-56 overflow-y-auto font-mono leading-relaxed">{r.error}</pre>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StepRow({ step }: { step: TestStep }) {
  const isExpect = step.category === "expect";
  const failed = step.status === "failed";
  return (
    <li
      className={clsx("flex items-start gap-2.5 py-1 rounded-md",
        failed && "bg-rose-500/[0.06]")}
      style={{ paddingLeft: 6 + step.depth * 18 }}
    >
      <span className="mt-0.5 shrink-0">
        {failed
          ? <span className="grid place-items-center w-4 h-4 rounded-full bg-rose-500/20 text-rose-400"><X size={10} strokeWidth={3} /></span>
          : isExpect
            ? <span className="grid place-items-center w-4 h-4 text-emerald-500/70"><Dot size={22} /></span>
            : <span className="grid place-items-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400"><Check size={10} strokeWidth={3} /></span>}
      </span>
      <div className="flex-1 min-w-0">
        <span className={clsx(
          isExpect ? "text-[11px]" : "text-xs",
          failed ? "text-rose-200" : isExpect ? "text-slate-500" : "text-slate-300"
        )}>
          {prettyStep(step)}
        </span>
        {failed && step.friendlyError && (
          <p className="text-[11px] text-amber-200/80 leading-relaxed mt-0.5">{step.friendlyError}</p>
        )}
      </div>
      {step.durationMs > 0 && (
        <span className="text-[10px] text-slate-600 tabular-nums shrink-0">{fmtDuration(step.durationMs)}</span>
      )}
    </li>
  );
}
