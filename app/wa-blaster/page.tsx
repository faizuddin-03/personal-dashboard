"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MessageSquare, Play, Square, Settings2, ChevronDown, Download,
  Loader2, AlertCircle, Eye, EyeOff, CheckCircle2, XCircle,
  Clock, ChevronRight, AlertTriangle, RotateCcw, X,
} from "lucide-react";
import clsx from "clsx";

// ── Flow definitions ──────────────────────────────────────────────────────────

interface FlowVar { key: string; label: string; defaultValue: string; description?: string; }
interface FlowTest { name: string; defaultEnabled: boolean; metaRisk?: boolean; }
interface FlowDef {
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
      { key: "API_BASE", label: "API Base URL", defaultValue: "http://localhost:3000", description: "Backend URL for webhook seeding and conversation API calls" },
      { key: "WHATSAPP_APP_SECRET", label: "WhatsApp App Secret", defaultValue: "3056575083ca35ce9aab0ddc07a705e0", description: "HMAC secret for validating webhook payloads" },
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
      { key: "API_BASE", label: "API Base URL", defaultValue: "http://localhost:3000", description: "Used for state-language mapping API calls" },
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

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function msToHuman(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlowConfig { enabledTests: Set<string>; vars: Record<string, string>; }

interface ReportSpec {
  title: string; ok: boolean; duration: number; error?: string; suite: string;
}

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
      const test = spec.tests?.[0];
      const result = test?.results?.[0];
      const duration = result?.duration ?? 0;
      const error = result?.errors?.[0]?.message ?? result?.errors?.[0] ?? undefined;
      specs.push({ title: spec.title, ok: spec.ok ?? false, duration, error: typeof error === 'string' ? error : undefined, suite: suite.title });
    }
    for (const sub of (suite.suites ?? [])) walk(sub, title);
  }

  for (const suite of (raw.suites ?? [])) walk(suite);

  return {
    stats: {
      duration: raw.stats?.duration ?? 0,
      expected: raw.stats?.expected ?? 0,
      unexpected: raw.stats?.unexpected ?? 0,
      skipped: raw.stats?.skipped ?? 0,
    },
    specs,
  };
}

// ── Default configs ───────────────────────────────────────────────────────────

function defaultConfig(flow: FlowDef): FlowConfig {
  const enabledTests = new Set(flow.tests.filter(t => t.defaultEnabled).map(t => t.name));
  const vars: Record<string, string> = {};
  for (const v of flow.flowVars) vars[v.key] = v.defaultValue;
  return { enabledTests, vars };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WABlasterPage() {
  // ── Global settings ──────────────────────────────────────────────────────
  const [baseUrl,   setBaseUrl]   = useState("http://localhost:5173");
  const [adminEmail,    setAdminEmail]    = useState("admin@example.com");
  const [adminPassword, setAdminPassword] = useState("ChangeMe123!");
  const [opEmail,       setOpEmail]       = useState("support@example.com");
  const [opPassword,    setOpPassword]    = useState("ChangeMe123!");
  const [showAdminPw,   setShowAdminPw]   = useState(false);
  const [showOpPw,      setShowOpPw]      = useState(false);
  const [settingsOpen,  setSettingsOpen]  = useState(false);

  // ── Per-flow configs ─────────────────────────────────────────────────────
  const [flowConfigs, setFlowConfigs] = useState<Record<string, FlowConfig>>(() =>
    Object.fromEntries(FLOWS.map(f => [f.id, defaultConfig(f)]))
  );

  // ── Selection for batch run ──────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Config modal ─────────────────────────────────────────────────────────
  const [modal, setModal] = useState<{ flowId: string; step: 1 | 2 } | null>(null);
  const [modalTests, setModalTests] = useState<Set<string>>(new Set());
  const [modalVars, setModalVars] = useState<Record<string, string>>({});

  // ── Run state ────────────────────────────────────────────────────────────
  const [running,  setRunning]  = useState(false);
  const [stopping, setStopping] = useState(false);
  const [runLog,   setRunLog]   = useState("");
  const [result,   setResult]   = useState<RunResult | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef  = useRef<HTMLPreElement>(null);

  // ── Restore settings from localStorage ──────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem("wa_settings");
    if (!s) return;
    try {
      const d = JSON.parse(s);
      if (d.baseUrl)      setBaseUrl(d.baseUrl);
      if (d.adminEmail)   setAdminEmail(d.adminEmail);
      if (d.adminPassword)setAdminPassword(d.adminPassword);
      if (d.opEmail)      setOpEmail(d.opEmail);
      if (d.opPassword)   setOpPassword(d.opPassword);
    } catch { /* ignore */ }
  }, []);

  function saveSettings() {
    localStorage.setItem("wa_settings", JSON.stringify({
      baseUrl, adminEmail, adminPassword, opEmail, opPassword,
    }));
  }

  // ── Poll during run ──────────────────────────────────────────────────────
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
        setResult({ exitCode: data.exitCode, log: data.log, startedAt: data.startedAt ?? "", ...parsed });
      }
    }, 1500);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [runLog]);

  // ── Start run ────────────────────────────────────────────────────────────
  async function startRun(flowIds: string[]) {
    const specFiles = flowIds.map(id => FLOWS.find(f => f.id === id)!.file);
    const env: Record<string, string> = {
      E2E_BASE_URL:          baseUrl,
      E2E_ADMIN_EMAIL:       adminEmail,
      E2E_ADMIN_PASSWORD:    adminPassword,
      E2E_OPERATOR_EMAIL:    opEmail,
      E2E_OPERATOR_PASSWORD: opPassword,
    };

    // Collect flow-specific vars
    for (const id of flowIds) {
      const cfg = flowConfigs[id];
      if (cfg) Object.assign(env, cfg.vars);
    }

    // Build grep pattern from enabled tests
    const allEnabledNames: string[] = [];
    for (const id of flowIds) {
      const flow = FLOWS.find(f => f.id === id)!;
      const cfg  = flowConfigs[id];
      const enabled = flow.tests.filter(t => cfg.enabledTests.has(t.name)).map(t => t.name);
      allEnabledNames.push(...enabled);
    }

    const grepPattern = allEnabledNames.length < flowIds.reduce((a, id) => a + (FLOWS.find(f => f.id === id)?.tests.length ?? 0), 0)
      ? allEnabledNames.map(escapeRegex).join("|")
      : undefined;

    setRunning(true);
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
      setResult({ exitCode: 1, log: data.error ?? "Failed to start.", startedAt: "" });
      return;
    }

    startPolling();
  }

  async function stopRun() {
    setStopping(true);
    await fetch("/api/wa-blaster/run", { method: "DELETE" });
  }

  // ── Config modal helpers ─────────────────────────────────────────────────
  function openModal(flowId: string) {
    const flow = FLOWS.find(f => f.id === flowId)!;
    const cfg  = flowConfigs[flowId];
    setModalTests(new Set(cfg.enabledTests));
    setModalVars({ ...cfg.vars });
    setModal({ flowId, step: 1 });
  }

  function saveModal() {
    if (!modal) return;
    setFlowConfigs(prev => ({
      ...prev,
      [modal.flowId]: { enabledTests: new Set(modalTests), vars: { ...modalVars } },
    }));
    setModal(null);
  }

  function toggleModalTest(name: string) {
    setModalTests(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const activeFlow   = modal ? FLOWS.find(f => f.id === modal.flowId)! : null;
  const hasSelected  = selected.size > 0;
  const allSelected  = selected.size === FLOWS.length;

  return (
    <div className="flex flex-col min-h-full">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-section { display: block !important; }
          body { background: white !important; color: black !important; }
          .print-section * { color: black !important; background: white !important; border-color: #ddd !important; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="no-print sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-green-400" />
          <h1 className="text-sm font-semibold text-slate-200">WA Blaster Tests</h1>
        </div>
        <div className="flex items-center gap-2">
          {result && (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              <Download size={12} /> Download PDF
            </button>
          )}
          {hasSelected && !running && (
            <button
              onClick={() => startRun(Array.from(selected))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              <Play size={12} /> Run Selected ({selected.size})
            </button>
          )}
          {!running && (
            <button
              onClick={() => startRun(FLOWS.map(f => f.id))}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              <Play size={12} /> Run All
            </button>
          )}
          {running && (
            <button
              onClick={stopRun}
              disabled={stopping}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
            >
              {stopping ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
              {stopping ? "Stopping…" : "Stop"}
            </button>
          )}
          {running && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 animate-pulse">
              <Loader2 size={12} className="animate-spin text-blue-400" />
              Running tests…
            </div>
          )}
        </div>
      </header>

      <div className="no-print px-4 py-4 sm:px-6 sm:py-5 space-y-4">

        {/* ── Global settings panel ── */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <button
            onClick={() => setSettingsOpen(v => !v)}
            className="w-full flex items-center gap-2 px-5 py-3.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
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
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Admin Email</label>
                <input value={adminEmail} onChange={e => setAdminEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Admin Password</label>
                <div className="relative">
                  <input value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
                    type={showAdminPw ? "text" : "password"}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <button type="button" onClick={() => setShowAdminPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" tabIndex={-1}>
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
                  <input value={opPassword} onChange={e => setOpPassword(e.target.value)}
                    type={showOpPw ? "text" : "password"}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 pr-10 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600" />
                  <button type="button" onClick={() => setShowOpPw(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" tabIndex={-1}>
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

        {/* ── Flow cards ── */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            {allSelected ? "All flows selected" : hasSelected ? `${selected.size} flow${selected.size > 1 ? "s" : ""} selected` : "Select flows to run together, or run individual flows below."}
          </p>
          {hasSelected && (
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
              Clear selection
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {FLOWS.map(flow => {
            const cfg       = flowConfigs[flow.id];
            const isChecked = selected.has(flow.id);
            const enabledCount = cfg.enabledTests.size;
            const totalCount   = flow.tests.length;
            return (
              <div
                key={flow.id}
                className={clsx(
                  "bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 transition-colors",
                  isChecked ? "border-blue-600/60" : "border-slate-800 hover:border-slate-700"
                )}
              >
                {/* Card header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 cursor-pointer" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={isChecked}
                        onChange={e => setSelected(prev => { const n = new Set(prev); e.target.checked ? n.add(flow.id) : n.delete(flow.id); return n; })}
                        className="accent-blue-500 w-3.5 h-3.5 cursor-pointer" />
                    </label>
                    <span className="text-lg leading-none">{flow.emoji}</span>
                    <span className="text-sm font-semibold text-slate-200">{flow.title}</span>
                  </div>
                  {flow.metaRisk && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-900/50 border border-orange-700/60 text-orange-300 shrink-0">
                      <AlertTriangle size={9} /> META
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed flex-1">{flow.description}</p>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Clock size={11} />{flow.estimatedDuration}</span>
                  <span>{enabledCount}/{totalCount} tests enabled</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => openModal(flow.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
                  >
                    <Settings2 size={11} /> Configure
                  </button>
                  <button
                    onClick={() => startRun([flow.id])}
                    disabled={running}
                    className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                  >
                    <Play size={11} /> Run
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Live log ── */}
        {(running || result) && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
              {running ? (
                <Loader2 size={13} className="text-blue-400 animate-spin" />
              ) : result?.exitCode === 0 ? (
                <CheckCircle2 size={13} className="text-green-400" />
              ) : (
                <XCircle size={13} className="text-red-400" />
              )}
              <span className="text-xs font-medium text-slate-400">
                {running ? "Test output (live)" : `Run finished — exit code ${result?.exitCode}`}
              </span>
              {!running && (
                <button onClick={() => setResult(null)} className="ml-auto text-slate-600 hover:text-slate-400">
                  <X size={13} />
                </button>
              )}
            </div>
            <pre
              ref={logRef}
              className="text-[11px] font-mono text-slate-400 px-4 py-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed"
            >{runLog || "Starting…"}</pre>
          </div>
        )}
      </div>

      {/* ── Report section ── */}
      {result && (
        <div className="print-section px-4 pb-8 sm:px-6 space-y-4">

          {/* Print-only title */}
          <div className="hidden print-section" style={{ display: "none" }}>
            <h1 className="text-2xl font-bold mb-1">WA Blaster — Test Report</h1>
            <p className="text-sm text-gray-600">
              Generated: {new Date().toLocaleString()} ·
              Environment: {baseUrl}
            </p>
          </div>

          {/* Summary stats */}
          {result.stats && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-200">Test Results</h2>
                <button onClick={() => window.print()}
                  className="no-print flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg transition-colors">
                  <Download size={12} /> Download PDF
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Passed", value: result.stats.expected,   color: "text-green-400", bg: "bg-green-900/30 border-green-800" },
                  { label: "Failed", value: result.stats.unexpected, color: "text-red-400",   bg: "bg-red-900/30 border-red-800" },
                  { label: "Skipped", value: result.stats.skipped,   color: "text-slate-400", bg: "bg-slate-800 border-slate-700" },
                  { label: "Duration", value: msToHuman(result.stats.duration), color: "text-blue-300", bg: "bg-blue-900/20 border-blue-900" },
                ].map(stat => (
                  <div key={stat.label} className={clsx("rounded-xl border p-3 text-center", stat.bg)}>
                    <div className={clsx("text-xl font-black", stat.color)}>{stat.value}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>

              {/* Per-test table */}
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
                              {spec.ok
                                ? <CheckCircle2 size={13} className="text-green-400" />
                                : <XCircle size={13} className="text-red-400" />}
                            </td>
                            <td className="px-3 py-2 text-slate-500 max-w-[180px] truncate">{spec.suite}</td>
                            <td className="px-3 py-2 text-slate-300">{spec.title}</td>
                            <td className="px-3 py-2 text-right text-slate-500 font-mono">{msToHuman(spec.duration)}</td>
                          </tr>
                          {spec.error && (
                            <tr key={`${i}-err`} className="bg-red-950/10 border-b border-red-900/20">
                              <td colSpan={4} className="px-3 py-2">
                                <pre className="text-[10px] text-red-400 whitespace-pre-wrap font-mono max-h-32 overflow-y-auto">{spec.error}</pre>
                              </td>
                            </tr>
                          )}
                        </>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Run log (collapsed) */}
          {result.log && (
            <details className="no-print bg-slate-900 border border-slate-800 rounded-xl">
              <summary className="px-4 py-2.5 text-xs text-slate-500 cursor-pointer select-none hover:text-slate-300">Show full log</summary>
              <pre className="px-4 pb-3 text-[10px] text-slate-500 font-mono whitespace-pre-wrap overflow-x-auto max-h-64 overflow-y-auto">{result.log}</pre>
            </details>
          )}
        </div>
      )}

      {/* ── Config modal ── */}
      {modal && activeFlow && (
        <div className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl">

            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
              <span className="text-xl">{activeFlow.emoji}</span>
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-slate-100 truncate">{activeFlow.title}</h2>
                <p className="text-xs text-slate-500">Step {modal.step} of {activeFlow.flowVars.length > 0 ? 2 : 1}</p>
              </div>
              <button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-300 p-1"><X size={16} /></button>
            </div>

            {/* Step indicator */}
            {activeFlow.flowVars.length > 0 && (
              <div className="flex gap-1 px-5 pt-4">
                {["Select Tests", "Variables"].map((label, i) => (
                  <button
                    key={label}
                    onClick={() => setModal(m => m ? { ...m, step: (i + 1) as 1 | 2 } : null)}
                    className={clsx(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                      modal.step === i + 1 ? "bg-blue-600/20 text-blue-300 border border-blue-600/40" : "text-slate-500 hover:text-slate-300"
                    )}
                  >
                    <span className={clsx("w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold", modal.step === i + 1 ? "bg-blue-500 text-white" : "bg-slate-700 text-slate-400")}>{i + 1}</span>
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
              {modal.step === 1 && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-400">Choose which tests to include in this run.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setModalTests(new Set(activeFlow.tests.map(t => t.name)))} className="text-xs text-blue-400 hover:text-blue-300">All</button>
                      <button onClick={() => setModalTests(new Set())} className="text-xs text-slate-500 hover:text-slate-300">None</button>
                    </div>
                  </div>
                  {activeFlow.tests.map(t => (
                    <label key={t.name} className={clsx(
                      "flex items-start gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors",
                      modalTests.has(t.name) ? "bg-slate-800" : "bg-slate-800/30 hover:bg-slate-800/60"
                    )}>
                      <input type="checkbox" checked={modalTests.has(t.name)} onChange={() => toggleModalTest(t.name)}
                        className="accent-blue-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className={clsx("text-xs leading-snug", modalTests.has(t.name) ? "text-slate-200" : "text-slate-500")}>{t.name}</p>
                        {t.metaRisk && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-900/40 text-orange-400 border border-orange-800/60">
                            <AlertTriangle size={8} /> Calls Meta API — use sparingly
                          </span>
                        )}
                      </div>
                    </label>
                  ))}
                </>
              )}

              {modal.step === 2 && (
                <>
                  <p className="text-xs text-slate-400 mb-3">
                    Override flow-specific variables. Global credentials (URL, admin, operator) are set in the Testing Environment panel.
                  </p>
                  {activeFlow.flowVars.map(v => (
                    <div key={v.key}>
                      <label className="block text-xs font-medium text-slate-400 mb-1">{v.label}</label>
                      {v.description && <p className="text-xs text-slate-600 mb-1.5">{v.description}</p>}
                      <input
                        value={modalVars[v.key] ?? v.defaultValue}
                        onChange={e => setModalVars(prev => ({ ...prev, [v.key]: e.target.value }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  ))}
                  <button onClick={() => setModalVars(Object.fromEntries(activeFlow.flowVars.map(v => [v.key, v.defaultValue])))}
                    className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2">
                    <RotateCcw size={11} /> Reset to defaults
                  </button>
                </>
              )}
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-slate-800">
              <div>
                {modal.step === 2 && (
                  <button onClick={() => setModal(m => m ? { ...m, step: 1 } : null)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                    ← Back
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setModal(null)} className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors">
                  Cancel
                </button>
                {modal.step === 1 && activeFlow.flowVars.length > 0 ? (
                  <button onClick={() => setModal(m => m ? { ...m, step: 2 } : null)}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors">
                    Next <ChevronRight size={12} />
                  </button>
                ) : (
                  <button onClick={() => { saveModal(); startRun([modal.flowId]); }}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors">
                    <Play size={11} /> Save & Run
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
