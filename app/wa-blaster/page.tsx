"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Play, Square, Settings2, ChevronDown, Download,
  Loader2, Eye, EyeOff, CheckCircle2, XCircle, Clock, AlertTriangle,
  RotateCcw,
} from "lucide-react";
import clsx from "clsx";

// ── Flow definitions ──────────────────────────────────────────────────────────

interface FlowVar  { key: string; label: string; defaultValue: string; description?: string; }
interface FlowTest { name: string; defaultEnabled: boolean; metaRisk?: boolean; }
interface FlowDef  {
  id: string; file: string; title: string; description: string;
  emoji: string; tags: string[]; estimatedDuration: string; metaRisk: boolean;
  tests: FlowTest[]; flowVars: FlowVar[];
}

const FLOWS: FlowDef[] = [
  {
    id: "flow-auth-and-roles", file: "flow-auth-and-roles.spec.ts",
    title: "Auth & Roles", emoji: "🔐",
    description: "Login, session persistence, logout, and role-based access control for admin and operator.",
    tags: ["auth", "roles"], estimatedDuration: "~3 min", metaRisk: false,
    tests: [
      { name: "remember-me checkbox is checked by default", defaultEnabled: true },
      { name: "unauthenticated visit to / redirects to /login", defaultEnabled: true },
      { name: "wrong password shows error message", defaultEnabled: true },
      { name: "admin logs in, sees dashboard, navigates with keyboard, opens help overlay, then logs out", defaultEnabled: true },
      { name: "session persists across page reload", defaultEnabled: true },
      { name: "after logout, reload stays on /login", defaultEnabled: true },
      { name: "admin can access /settings and see users table", defaultEnabled: true },
      { name: "operator sees the correct nav items and is blocked from admin-only pages", defaultEnabled: true },
      { name: "operator can access Dealers but has no Add dealer button", defaultEnabled: true },
      { name: "operator can access the inbox", defaultEnabled: true },
    ],
    flowVars: [],
  },
  {
    id: "flow-contacts-and-segments", file: "flow-contacts-and-segments.spec.ts",
    title: "Contacts & Segments", emoji: "👥",
    description: "CSV import, dealer management, manual contact CRUD, segment creation, and blast wizard integration.",
    tags: ["contacts", "segments", "csv"], estimatedDuration: "~5 min", metaRisk: false,
    tests: [
      { name: "Import button disabled until file selected", defaultEnabled: true },
      { name: "valid CSV imports and shows result; Back to contacts returns to list", defaultEnabled: true },
      { name: "CSV with invalid rows surfaces the error list", defaultEnabled: true },
      { name: "Cancel on the import page navigates back to contacts", defaultEnabled: true },
      { name: "dealers table renders; search filters; specialization chip works", defaultEnabled: true },
      { name: "admin adds dealer via modal → searchable in table; duplicate phone shows error", defaultEnabled: true },
      { name: "create → verify in list → edit → delete", defaultEnabled: true },
      { name: "segment builder page shows filter options", defaultEnabled: true },
      { name: "select all dealers → save as segment → success toast shown", defaultEnabled: true },
      { name: "saved segment is selectable in the blast wizard audience step", defaultEnabled: true },
    ],
    flowVars: [
      { key: "E2E_SEED_TEMPLATE", label: "Seed Template Name", defaultValue: "sample_promo_2026", description: "Template used in wizard audience step test" },
    ],
  },
  {
    id: "flow-blast-complete", file: "flow-blast-complete.spec.ts",
    title: "Blast Lifecycle", emoji: "📣",
    description: "Send-now blasts, scheduled blasts, past-date validation, and campaigns list filters.",
    tags: ["campaigns", "blasts", "scheduling"], estimatedDuration: "~6 min", metaRisk: false,
    tests: [
      { name: "create blast → detail page shows counters and recipients table", defaultEnabled: true },
      { name: "detail page shows recipients table; filtering to Failed surfaces Retry buttons", defaultEnabled: true },
      { name: "Retry All Failed button is visible on the detail page", defaultEnabled: true },
      { name: "schedule blast for future time → detail page shows Cancel button (SCHEDULED state)", defaultEnabled: true },
      { name: "cancel a SCHEDULED blast — Cancel button disappears after confirmation", defaultEnabled: true },
      { name: "past scheduled date shows validation error and does not create blast", defaultEnabled: true },
      { name: "newly scheduled blast appears in the campaigns list", defaultEnabled: true },
      { name: "list shows heading, new-campaign button, and status filter", defaultEnabled: true },
      { name: "clicking the Sending status chip filters without crashing", defaultEnabled: true },
      { name: "clicking a blast row navigates to its detail page", defaultEnabled: true },
    ],
    flowVars: [
      { key: "E2E_SEED_TEMPLATE", label: "Seed Template Name", defaultValue: "sample_promo_2026" },
    ],
  },
  {
    id: "flow-inbox-complete", file: "flow-inbox-complete.spec.ts",
    title: "Inbox", emoji: "💬",
    description: "Inbound messages, conversation lifecycle, search, keyboard shortcuts, AI tabs, and canned replies.",
    tags: ["inbox", "conversations", "canned-replies"], estimatedDuration: "~7 min", metaRisk: false,
    tests: [
      { name: "inbound message appears in Awaiting tab", defaultEnabled: true },
      { name: "replying to a message moves it to Replied and auto-resolves", defaultEnabled: true },
      { name: "manually mark resolved → hidden from active tabs → reopen restores it", defaultEnabled: true },
      { name: "window-closed: composer is locked and re-engage CTA appears", defaultEnabled: true },
      { name: "search filter narrows and then clears conversation list", defaultEnabled: true },
      { name: "keyboard shortcut j navigates into the first conversation", defaultEnabled: true },
      { name: "sidebar badge appears for unresolved inbound messages", defaultEnabled: true },
      { name: "AI tabs (Auto-replied, Escalated) show Coming Soon without hitting inbox API", defaultEnabled: true },
      { name: "operator can access and use the inbox", defaultEnabled: true },
      { name: "needs-human mode shows suggest-draft and agent-context-card", defaultEnabled: true },
      { name: "canned replies: create → edit → delete via settings", defaultEnabled: true },
      { name: "Add canned reply button disabled until title and body filled", defaultEnabled: true },
    ],
    flowVars: [
      { key: "API_BASE",             label: "API Base URL",       defaultValue: "http://localhost:3000", description: "Backend URL for webhook seeding" },
      { key: "WHATSAPP_APP_SECRET",  label: "WhatsApp App Secret", defaultValue: "3056575083ca35ce9aab0ddc07a705e0", description: "HMAC secret for webhook payloads" },
    ],
  },
  {
    id: "flow-settings-and-team", file: "flow-settings-and-team.spec.ts",
    title: "Settings & Team", emoji: "⚙️",
    description: "Team member invite, duplicate email guard, password reset, delete, and canned reply CRUD.",
    tags: ["settings", "team", "canned-replies"], estimatedDuration: "~4 min", metaRisk: false,
    tests: [
      { name: "invite member → appears in users table with correct name and email", defaultEnabled: true },
      { name: "duplicate email shows inline error and keeps modal open", defaultEnabled: true },
      { name: "admin resets a team member password", defaultEnabled: true },
      { name: "admin deletes a team member — they disappear from the table", defaultEnabled: true },
      { name: "operator is redirected away from /settings and has no invite button", defaultEnabled: true },
      { name: "create → edit → delete full lifecycle", defaultEnabled: true },
      { name: "Add button is disabled until both title and body are filled", defaultEnabled: true },
      { name: "cancelling the create modal discards changes", defaultEnabled: true },
      { name: "seeded canned replies list is visible and Add button is present", defaultEnabled: true },
    ],
    flowVars: [],
  },
  {
    id: "flow-blast-state-language", file: "flow-blast-state-language.spec.ts",
    title: "State-Language Blasting", emoji: "🗺️",
    description: "Per-state language mappings, STATE-mode wizard with preview, gap detection, and PREFERENCE-mode regression.",
    tags: ["campaigns", "state", "language"], estimatedDuration: "~5 min", metaRisk: false,
    tests: [
      { name: "admin configures Penang (ZH+EN) and Kelantan (MS) mappings; they persist on reload", defaultEnabled: true },
      { name: "operator cannot access the state→language mapping (redirected to /)", defaultEnabled: true },
      { name: "preview renders message + contact summary when mapping covers an approved language", defaultEnabled: true },
      { name: "gap blocker: missing template variant disables Continue", defaultEnabled: true },
      { name: "happy path: STATE-mode blast creates and lands on detail page", defaultEnabled: true },
      { name: "PREFERENCE-mode blast creates successfully and shows counters on detail page", defaultEnabled: true },
    ],
    flowVars: [
      { key: "API_BASE",          label: "API Base URL",        defaultValue: "http://localhost:3000", description: "Used for state-language mapping API calls" },
      { key: "E2E_SEED_TEMPLATE", label: "Seed Template Name", defaultValue: "sample_promo_2026" },
    ],
  },
  {
    id: "flow-dashboard-and-analytics", file: "flow-dashboard-and-analytics.spec.ts",
    title: "Dashboard & Analytics", emoji: "📊",
    description: "Dashboard KPI strip, reports delivery funnel, template list, Meta sync, and AI wizard flow.",
    tags: ["dashboard", "analytics", "templates"], estimatedDuration: "~4 min", metaRisk: true,
    tests: [
      { name: "KPI strip has no demo badge and reply-handling donut renders", defaultEnabled: true },
      { name: "renders real (non-demo) analytics with delivery funnel and range chips", defaultEnabled: true },
      { name: "template list loads and status filter marks chip as active", defaultEnabled: true },
      { name: "admin creates a multi-language draft, submits to Meta (mock), sees PENDING", defaultEnabled: false, metaRisk: true },
      { name: "Sync button triggers a request and shows a result toast", defaultEnabled: false, metaRisk: true },
      { name: "edit content, save as draft, draft appears in list with edits", defaultEnabled: true },
      { name: "closing the wizard at review step warns before discarding", defaultEnabled: true },
    ],
    flowVars: [],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function escapeRegex(s: string) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function msToHuman(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlowConfig { enabledTests: Set<string>; vars: Record<string, string>; }

interface ReportSpec { title: string; ok: boolean; duration: number; error?: string; suite: string; }

interface RunResult {
  exitCode: number; log: string; startedAt: string;
  stats?: { duration: number; expected: number; unexpected: number; skipped: number; };
  specs?: ReportSpec[];
}

// ── Parse Playwright JSON report ──────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseReport(raw: any): Omit<RunResult, 'exitCode' | 'log' | 'startedAt'> {
  if (!raw) return {};
  const specs: ReportSpec[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function walk(suite: any, parentTitle = '') {
    const title = parentTitle ? `${parentTitle} › ${suite.title}` : suite.title;
    for (const spec of (suite.specs ?? [])) {
      const result = spec.tests?.[0]?.results?.[0];
      const error  = result?.errors?.[0]?.message ?? result?.errors?.[0] ?? undefined;
      specs.push({ title: spec.title, ok: spec.ok ?? false, duration: result?.duration ?? 0, error: typeof error === 'string' ? error : undefined, suite: suite.title });
    }
    for (const sub of (suite.suites ?? [])) walk(sub, title);
  }
  for (const suite of (raw.suites ?? [])) walk(suite);
  return { stats: { duration: raw.stats?.duration ?? 0, expected: raw.stats?.expected ?? 0, unexpected: raw.stats?.unexpected ?? 0, skipped: raw.stats?.skipped ?? 0 }, specs };
}

function defaultConfig(flow: FlowDef): FlowConfig {
  return {
    enabledTests: new Set(flow.tests.filter(t => t.defaultEnabled).map(t => t.name)),
    vars: Object.fromEntries(flow.flowVars.map(v => [v.key, v.defaultValue])),
  };
}

// ── Report panel ──────────────────────────────────────────────────────────────

function ReportPanel({ result, baseUrl }: { result: RunResult; baseUrl: string }) {
  if (!result.stats) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
      {/* Print-only title */}
      <div className="hidden print-show" style={{ display: "none" }}>
        <h1 className="text-xl font-bold mb-1">WA Blaster — Test Report</h1>
        <p className="text-sm text-gray-600">Generated: {new Date().toLocaleString()} · {baseUrl}</p>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Test Results</h3>
        <button onClick={() => window.print()}
          className="no-print flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg">
          <Download size={12} /> Download PDF
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Passed",   value: result.stats.expected,                color: "text-green-400", bg: "bg-green-900/30 border-green-800" },
          { label: "Failed",   value: result.stats.unexpected,              color: "text-red-400",   bg: "bg-red-900/30 border-red-800" },
          { label: "Skipped",  value: result.stats.skipped,                 color: "text-slate-400", bg: "bg-slate-800 border-slate-700" },
          { label: "Duration", value: msToHuman(result.stats.duration),     color: "text-blue-300",  bg: "bg-blue-900/20 border-blue-900" },
        ].map(stat => (
          <div key={stat.label} className={clsx("rounded-xl border p-3 text-center", stat.bg)}>
            <div className={clsx("text-xl font-black", stat.color)}>{stat.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {result.specs && result.specs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider w-16">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Suite</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Test</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wider w-20">Duration</th>
              </tr>
            </thead>
            <tbody>
              {result.specs.map((spec, i) => (
                <>
                  <tr key={i} className={clsx("border-b border-slate-800/60", !spec.ok && "bg-red-950/20")}>
                    <td className="px-3 py-2">
                      {spec.ok ? <CheckCircle2 size={13} className="text-green-400" /> : <XCircle size={13} className="text-red-400" />}
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-[160px] truncate">{spec.suite}</td>
                    <td className="px-3 py-2 text-slate-300">{spec.title}</td>
                    <td className="px-3 py-2 text-right text-slate-500 font-mono">{msToHuman(spec.duration)}</td>
                  </tr>
                  {spec.error && (
                    <tr key={`${i}-err`} className="bg-red-950/10 border-b border-red-900/20">
                      <td colSpan={4} className="px-3 py-2">
                        <pre className="text-[10px] text-red-400 whitespace-pre-wrap font-mono max-h-28 overflow-y-auto">{spec.error}</pre>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.log && (
        <details className="no-print bg-slate-950 border border-slate-800 rounded-xl">
          <summary className="px-4 py-2.5 text-xs text-slate-500 cursor-pointer hover:text-slate-300">Show full log</summary>
          <pre className="px-4 pb-3 text-[10px] text-slate-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{result.log}</pre>
        </details>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WABlasterPage() {
  // ── Global settings ────────────────────────────────────────────────────────
  const [baseUrl,       setBaseUrl]       = useState("http://localhost:5173");
  const [adminEmail,    setAdminEmail]    = useState("admin@example.com");
  const [adminPassword, setAdminPassword] = useState("ChangeMe123!");
  const [opEmail,       setOpEmail]       = useState("support@example.com");
  const [opPassword,    setOpPassword]    = useState("ChangeMe123!");
  const [showAdminPw,   setShowAdminPw]   = useState(false);
  const [showOpPw,      setShowOpPw]      = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);

  // ── Per-flow configs ───────────────────────────────────────────────────────
  const [flowConfigs, setFlowConfigs] = useState<Record<string, FlowConfig>>(() =>
    Object.fromEntries(FLOWS.map(f => [f.id, defaultConfig(f)]))
  );

  // ── Tabs ───────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState("overview");

  // ── Selection for batch run (overview) ────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Run state ──────────────────────────────────────────────────────────────
  const [running,   setRunning]   = useState(false);
  const [stopping,  setStopping]  = useState(false);
  const [runLog,    setRunLog]    = useState("");
  const [result,    setResult]    = useState<RunResult | null>(null);
  const runningTabRef = useRef<string | null>(null); // tab that launched the current run
  const [resultTab,   setResultTab]  = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef  = useRef<HTMLPreElement>(null);

  // ── Restore settings from localStorage ────────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem("wa_settings");
    if (!s) return;
    try {
      const d = JSON.parse(s);
      if (d.baseUrl)       setBaseUrl(d.baseUrl);
      if (d.adminEmail)    setAdminEmail(d.adminEmail);
      if (d.adminPassword) setAdminPassword(d.adminPassword);
      if (d.opEmail)       setOpEmail(d.opEmail);
      if (d.opPassword)    setOpPassword(d.opPassword);
    } catch { /* ignore */ }
  }, []);

  function saveSettings() {
    localStorage.setItem("wa_settings", JSON.stringify({ baseUrl, adminEmail, adminPassword, opEmail, opPassword }));
  }

  // ── Polling ────────────────────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollRef.current = setInterval(async () => {
      const res = await fetch("/api/wa-blaster/run");
      if (!res.ok) return;
      const data = await res.json();
      setRunLog(data.log ?? "");
      if (!data.running) {
        stopPolling();
        setRunning(false);
        setStopping(false);
        const parsed = parseReport(data.report);
        const tab = runningTabRef.current;
        runningTabRef.current = null;
        setResultTab(tab);
        setResult({ exitCode: data.exitCode, log: data.log, startedAt: data.startedAt ?? "", ...parsed });
      }
    }, 1500);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [runLog]);

  // ── Start / stop run ───────────────────────────────────────────────────────
  async function startRun(flowIds: string[], tabId: string) {
    const specFiles = flowIds.map(id => FLOWS.find(f => f.id === id)!.file);
    const env: Record<string, string> = {
      E2E_BASE_URL:          baseUrl,
      E2E_ADMIN_EMAIL:       adminEmail,
      E2E_ADMIN_PASSWORD:    adminPassword,
      E2E_OPERATOR_EMAIL:    opEmail,
      E2E_OPERATOR_PASSWORD: opPassword,
    };
    for (const id of flowIds) {
      const cfg = flowConfigs[id];
      if (cfg) Object.assign(env, cfg.vars);
    }
    const allEnabled: string[] = [];
    for (const id of flowIds) {
      const flow = FLOWS.find(f => f.id === id)!;
      const cfg  = flowConfigs[id];
      allEnabled.push(...flow.tests.filter(t => cfg.enabledTests.has(t.name)).map(t => t.name));
    }
    const totalTests = flowIds.reduce((sum, id) => sum + (FLOWS.find(f => f.id === id)?.tests.length ?? 0), 0);
    const grepPattern = allEnabled.length < totalTests ? allEnabled.map(escapeRegex).join("|") : undefined;

    setRunning(true);
    runningTabRef.current = tabId;
    setResultTab(null);
    setResult(null);
    setRunLog("");

    const res = await fetch("/api/wa-blaster/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ specFiles, grepPattern, env }),
    });
    if (!res.ok) {
      const data = await res.json();
      setRunning(false);
      runningTabRef.current = null;
      setResultTab(tabId);
      setResult({ exitCode: 1, log: data.error ?? "Failed to start.", startedAt: "" });
      return;
    }
    startPolling();
  }

  async function stopRun() {
    setStopping(true);
    await fetch("/api/wa-blaster/run", { method: "DELETE" });
  }

  // ── Per-flow config helpers ────────────────────────────────────────────────
  function toggleTest(flowId: string, name: string) {
    setFlowConfigs(prev => {
      const cfg  = prev[flowId];
      const next = new Set(cfg.enabledTests);
      next.has(name) ? next.delete(name) : next.add(name);
      return { ...prev, [flowId]: { ...cfg, enabledTests: next } };
    });
  }

  function setAllTests(flowId: string, on: boolean) {
    const flow = FLOWS.find(f => f.id === flowId)!;
    setFlowConfigs(prev => ({
      ...prev,
      [flowId]: { ...prev[flowId], enabledTests: on ? new Set(flow.tests.map(t => t.name)) : new Set() },
    }));
  }

  function setVar(flowId: string, key: string, value: string) {
    setFlowConfigs(prev => ({
      ...prev,
      [flowId]: { ...prev[flowId], vars: { ...prev[flowId].vars, [key]: value } },
    }));
  }

  function resetVars(flowId: string) {
    const flow = FLOWS.find(f => f.id === flowId)!;
    setFlowConfigs(prev => ({
      ...prev,
      [flowId]: { ...prev[flowId], vars: Object.fromEntries(flow.flowVars.map(v => [v.key, v.defaultValue])) },
    }));
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-full">
      <style>{`
        @media print {
          .no-print  { display: none !important; }
          .print-show { display: block !important; }
          body { background: white !important; color: black !important; }
          .print-show * { color: black !important; background: white !important; border-color: #ddd !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="no-print sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">eAuto</span>
          <span className="text-slate-700">/</span>
          <MessageSquare size={14} className="text-green-400" />
          <h1 className="text-sm font-semibold text-slate-200">WA Blaster Tests</h1>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg">
              <Download size={12} /> PDF
            </button>
          )}
          {running ? (
            <button onClick={stopRun} disabled={stopping}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium">
              {stopping ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
              {stopping ? "Stopping…" : "Stop"}
            </button>
          ) : (
            <button onClick={() => { startRun(FLOWS.map(f => f.id), "overview"); setActiveTab("overview"); }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
              <Play size={12} /> Run All
            </button>
          )}
        </div>
      </header>

      {/* ── Tab bar ── */}
      <div className="no-print flex items-center gap-0 px-4 sm:px-6 border-b border-slate-800 overflow-x-auto">
        {[{ id: "overview", label: "Overview", emoji: "" }, ...FLOWS.map(f => ({ id: f.id, label: f.title, emoji: f.emoji }))]
          .map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap shrink-0",
                activeTab === tab.id
                  ? "border-blue-500 text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              {tab.emoji && <span className="text-base leading-none">{tab.emoji}</span>}
              {tab.label}
              {running && runningTabRef.current === tab.id && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse ml-0.5" />
              )}
            </button>
          ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════════════════════ */}
      <div className={clsx(activeTab !== "overview" && "hidden", "px-4 sm:px-6 py-5 space-y-5")}>

        {/* Global settings */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <button onClick={() => setSettingsOpen(v => !v)}
            className="w-full flex items-center gap-2 px-5 py-3.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
            <Settings2 size={15} className="text-slate-500" />
            <span className="flex-1 text-left font-medium">Testing Environment</span>
            <span className="text-xs font-mono text-slate-600 mr-2">{baseUrl}</span>
            <ChevronDown size={14} className={clsx("transition-transform", settingsOpen && "rotate-180")} />
          </button>
          {settingsOpen && (
            <div className="px-5 pb-5 border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-xs font-medium text-slate-400 mb-1.5">WA Blaster Base URL</label>
                <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:5173"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Admin Email</label>
                <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Admin Password</label>
                <div className="relative">
                  <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)} type={showAdminPw ? "text" : "password"}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <button type="button" onClick={() => setShowAdminPw(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showAdminPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div className="hidden lg:block" />
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Operator Email</label>
                <input value={opEmail} onChange={e => setOpEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Operator Password</label>
                <div className="relative">
                  <input value={opPassword} onChange={e => setOpPassword(e.target.value)} type={showOpPw ? "text" : "password"}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <button type="button" onClick={() => setShowOpPw(v => !v)} tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                    {showOpPw ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <button onClick={saveSettings}
                  className="px-4 py-2 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                  Save Settings
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Flow cards */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {selected.size > 0
              ? `${selected.size} flow${selected.size > 1 ? "s" : ""} selected — click a card to open it, or run the selection below.`
              : "Click a card to open a flow. Tick the checkbox to queue multiple flows for a batch run."}
          </p>
          {selected.size > 0 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
              <button
                onClick={() => { startRun(Array.from(selected), "overview"); }}
                disabled={running}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                <Play size={11} /> Run Selected ({selected.size})
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {FLOWS.map(flow => {
            const cfg       = flowConfigs[flow.id];
            const isChecked = selected.has(flow.id);
            return (
              <div
                key={flow.id}
                onClick={() => setActiveTab(flow.id)}
                className={clsx(
                  "bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-colors group",
                  isChecked ? "border-blue-600/60" : "border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked}
                        onChange={e => { e.stopPropagation(); setSelected(prev => { const n = new Set(prev); e.target.checked ? n.add(flow.id) : n.delete(flow.id); return n; }); }}
                        className="accent-blue-500 w-3.5 h-3.5 cursor-pointer" />
                    </label>
                    <span className="text-lg leading-none">{flow.emoji}</span>
                    <span className="text-sm font-semibold text-slate-200 group-hover:text-blue-300 transition-colors">{flow.title}</span>
                  </div>
                  {flow.metaRisk && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-900/50 border border-orange-700/60 text-orange-300 shrink-0">
                      <AlertTriangle size={9} /> META
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{flow.description}</p>
                <div className="flex items-center gap-3 text-xs text-slate-600 border-t border-slate-800 pt-2.5">
                  <span className="flex items-center gap-1"><Clock size={11} />{flow.estimatedDuration}</span>
                  <span>{cfg.enabledTests.size}/{flow.tests.length} tests</span>
                  <span className="ml-auto text-[10px] font-medium text-slate-600 group-hover:text-blue-400 transition-colors">Open →</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Overview run output */}
        {(running && runningTabRef.current === "overview") || resultTab === "overview" ? (
          <div className="space-y-4">
            <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                {running && runningTabRef.current === "overview"
                  ? <Loader2 size={13} className="text-blue-400 animate-spin" />
                  : result?.exitCode === 0
                    ? <CheckCircle2 size={13} className="text-green-400" />
                    : <XCircle size={13} className="text-red-400" />}
                <span className="text-xs font-medium text-slate-400">
                  {running && runningTabRef.current === "overview"
                    ? "Test output (live)" : `Run finished — exit code ${result?.exitCode}`}
                </span>
              </div>
              <pre ref={running && runningTabRef.current === "overview" ? logRef : undefined}
                className="text-[11px] font-mono text-slate-400 px-4 py-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                {runLog || "Starting…"}
              </pre>
            </div>
            {resultTab === "overview" && result && <ReportPanel result={result} baseUrl={baseUrl} />}
          </div>
        ) : null}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          FLOW TABS
      ══════════════════════════════════════════════════════════════════════ */}
      {FLOWS.map(flow => {
        const cfg        = flowConfigs[flow.id];
        const isRunning  = running && runningTabRef.current === flow.id;
        const hasResult  = resultTab === flow.id;
        const otherRunning = running && runningTabRef.current !== flow.id;

        return (
          <div key={flow.id} className={clsx(activeTab !== flow.id && "hidden", "px-4 sm:px-6 py-5 space-y-5")}>

            {/* Flow info bar */}
            <div className="flex items-start gap-4">
              <span className="text-3xl leading-none mt-0.5">{flow.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-slate-100">{flow.title}</h2>
                  {flow.metaRisk && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-900/50 border border-orange-700/60 text-orange-300">
                      <AlertTriangle size={9} /> Contains META API calls
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-2">{flow.description}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 text-slate-500"><Clock size={11} />{flow.estimatedDuration}</span>
                  {flow.tags.map(t => (
                    <span key={t} className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">{t}</span>
                  ))}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[10px] text-slate-600">Testing against</p>
                <p className="text-xs font-mono text-slate-500 max-w-[200px] truncate">{baseUrl}</p>
              </div>
            </div>

            {/* Two-column: tests + (vars + run) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">

              {/* Test toggles */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Tests <span className="text-slate-600 font-normal normal-case ml-1">({cfg.enabledTests.size}/{flow.tests.length} enabled)</span>
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => setAllTests(flow.id, true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">All</button>
                    <button onClick={() => setAllTests(flow.id, false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">None</button>
                  </div>
                </div>
                <div className="space-y-1">
                  {flow.tests.map(t => (
                    <label key={t.name} className={clsx(
                      "flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                      cfg.enabledTests.has(t.name) ? "bg-slate-800" : "bg-slate-800/30 hover:bg-slate-800/60"
                    )}>
                      <input type="checkbox" checked={cfg.enabledTests.has(t.name)} onChange={() => toggleTest(flow.id, t.name)}
                        className="accent-blue-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={clsx("text-xs leading-snug", cfg.enabledTests.has(t.name) ? "text-slate-200" : "text-slate-500")}>{t.name}</p>
                        {t.metaRisk && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-900/40 text-orange-400 border border-orange-800/60">
                            <AlertTriangle size={8} /> Calls Meta API — use sparingly
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Right column: variables + run */}
              <div className="space-y-4">

                {/* Variables */}
                {flow.flowVars.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flow Variables</h3>
                      <button onClick={() => resetVars(flow.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        <RotateCcw size={10} /> Defaults
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      These override the global credentials above for this flow only.
                    </p>
                    {flow.flowVars.map(v => (
                      <div key={v.key}>
                        <label className="block text-xs font-medium text-slate-400 mb-1">{v.label}</label>
                        {v.description && <p className="text-[11px] text-slate-600 mb-1.5">{v.description}</p>}
                        <input
                          value={cfg.vars[v.key] ?? v.defaultValue}
                          onChange={e => setVar(flow.id, v.key, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Run panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Run</h3>
                  {otherRunning ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic py-1">
                      <Loader2 size={12} className="animate-spin text-blue-400" />
                      Another flow is currently running…
                    </div>
                  ) : isRunning ? (
                    <>
                      <div className="flex items-center gap-2 text-xs text-blue-300 animate-pulse">
                        <Loader2 size={12} className="animate-spin" /> Running tests…
                      </div>
                      <button onClick={stopRun} disabled={stopping}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl transition-colors">
                        {stopping ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                        {stopping ? "Stopping…" : "Stop Run"}
                      </button>
                    </>
                  ) : (
                    <button onClick={() => startRun([flow.id], flow.id)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-green-700 hover:bg-green-600 text-white rounded-xl transition-colors">
                      <Play size={14} /> Run Flow
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Live log */}
            {(isRunning || hasResult) && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  {isRunning
                    ? <Loader2 size={13} className="text-blue-400 animate-spin" />
                    : result?.exitCode === 0
                      ? <CheckCircle2 size={13} className="text-green-400" />
                      : <XCircle size={13} className="text-red-400" />}
                  <span className="text-xs font-medium text-slate-400">
                    {isRunning ? "Test output (live)" : `Run finished — exit code ${result?.exitCode}`}
                  </span>
                </div>
                <pre
                  ref={isRunning ? logRef : undefined}
                  className="text-[11px] font-mono text-slate-400 px-4 py-3 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {runLog || "Starting…"}
                </pre>
              </div>
            )}

            {/* Report */}
            {hasResult && result && <ReportPanel result={result} baseUrl={baseUrl} />}
          </div>
        );
      })}
    </div>
  );
}
