"use client";
import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import {
  MessageSquare, Play, Square, Settings2, ChevronDown, Download,
  Loader2, Eye, EyeOff, CheckCircle2, XCircle, Clock, AlertTriangle,
  RotateCcw, ChevronLeft, Terminal, Copy, Check,
} from "lucide-react";
import clsx from "clsx";

// ── Types ─────────────────────────────────────────────────────────────────────

interface TestParam {
  key: string;
  label: string;
  defaultValue: string;
  description?: string;
  type?: "text" | "select" | "password";
  options?: { value: string; label: string }[];
}

interface FlowVar  { key: string; label: string; defaultValue: string; description?: string; }
interface FlowTest { name: string; defaultEnabled: boolean; metaRisk?: boolean; params?: TestParam[]; }
interface FlowDef  {
  id: string; file: string; title: string; description: string;
  emoji: string; tags: string[]; estimatedDuration: string; metaRisk: boolean;
  tests: FlowTest[]; flowVars: FlowVar[];
}

// ── Flow definitions ──────────────────────────────────────────────────────────

const MY_STATES = [
  { value: "JOHOR",          label: "Johor" },
  { value: "KEDAH",          label: "Kedah" },
  { value: "KELANTAN",       label: "Kelantan" },
  { value: "MELAKA",         label: "Melaka" },
  { value: "N_SEMBILAN",     label: "Negeri Sembilan" },
  { value: "PAHANG",         label: "Pahang" },
  { value: "PENANG",         label: "Penang" },
  { value: "PERAK",          label: "Perak" },
  { value: "PERLIS",         label: "Perlis" },
  { value: "SABAH",          label: "Sabah" },
  { value: "SARAWAK",        label: "Sarawak" },
  { value: "SELANGOR",       label: "Selangor" },
  { value: "TERENGGANU",     label: "Terengganu" },
  { value: "KL",             label: "Kuala Lumpur" },
  { value: "LABUAN",         label: "Labuan" },
  { value: "PUTRAJAYA",      label: "Putrajaya" },
];

const FLOWS: FlowDef[] = [
  {
    id: "smoke-sidebar", file: "smoke-sidebar.spec.ts",
    title: "Sidebar Smoke Test", emoji: "🚦",
    description: "Logs in as admin, clicks through every sidebar page in order, pauses 5 seconds on the last page, then closes. Run this first to confirm the app is reachable and your credentials are correct.",
    tags: ["smoke", "navigation"], estimatedDuration: "~30 sec", metaRisk: false,
    tests: [
      { name: "smoke: login then visit all sidebar pages", defaultEnabled: true },
    ],
    flowVars: [],
  },
  {
    id: "flow-auth-and-roles", file: "flow-auth-and-roles.spec.ts",
    title: "Auth & Roles", emoji: "🔐",
    description: "Login, session persistence, logout, and role-based access control for admin and operator.",
    tags: ["auth", "roles"], estimatedDuration: "~3 min", metaRisk: false,
    tests: [
      { name: "remember-me checkbox is checked by default", defaultEnabled: true },
      { name: "unauthenticated visit to / redirects to /login", defaultEnabled: true },
      {
        name: "wrong password shows error message", defaultEnabled: true,
        params: [
          { key: "E2E_WRONG_PASSWORD", label: "Wrong Password", defaultValue: "wrong-password", type: "password",
            description: "Password that should be rejected and trigger an error message." },
        ],
      },
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
      {
        name: "admin adds dealer via modal → searchable in table; duplicate phone shows error",
        defaultEnabled: true,
        params: [
          {
            key: "E2E_DEALER_TIER", label: "Dealer Tier", defaultValue: "GOLD", type: "select",
            description: "Tier assigned to the newly created dealer.",
            options: [{ value: "GOLD", label: "Gold" }, { value: "SILVER", label: "Silver" }, { value: "BRONZE", label: "Bronze" }],
          },
          {
            key: "E2E_DEALER_SPEC", label: "Vehicle Specialization", defaultValue: "EV_HYBRID", type: "select",
            description: "Vehicle specialization assigned to the dealer.",
            options: [
              { value: "EV_HYBRID",     label: "EV / Hybrid" },
              { value: "CONVENTIONAL",  label: "Conventional" },
              { value: "COMMERCIAL",    label: "Commercial" },
              { value: "LUXURY",        label: "Luxury" },
            ],
          },
        ],
      },
      {
        name: "create → verify in list → edit → delete", defaultEnabled: true,
        params: [
          {
            key: "E2E_CONTACT_ETHNICITY", label: "Ethnicity", defaultValue: "MALAY", type: "select",
            options: [{ value: "MALAY", label: "Malay" }, { value: "CHINESE", label: "Chinese" }, { value: "INDIAN", label: "Indian" }, { value: "OTHER", label: "Other" }],
          },
          {
            key: "E2E_CONTACT_LANGUAGE", label: "Language", defaultValue: "MS", type: "select",
            options: [{ value: "MS", label: "Malay (MS)" }, { value: "EN", label: "English (EN)" }, { value: "ZH", label: "Chinese (ZH)" }, { value: "TA", label: "Tamil (TA)" }],
          },
          {
            key: "E2E_CONTACT_STATE", label: "State", defaultValue: "SELANGOR", type: "select",
            options: MY_STATES,
          },
        ],
      },
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
    id: "flow-send-campaign", file: "flow-send-campaign.spec.ts",
    title: "Send Campaign (Live)", emoji: "📲",
    description: "Picks a specific dealer by name in the campaign wizard and fires a real WhatsApp message immediately. Skipped by default — set E2E_SEND_CAMPAIGN to true below to enable.",
    tags: ["campaigns", "send", "live"], estimatedDuration: "~2 min", metaRisk: true,
    tests: [
      {
        name: "send campaign to Muhammad Faizuddin",
        defaultEnabled: true, metaRisk: true,
      },
    ],
    flowVars: [
      {
        key: "E2E_SEND_CAMPAIGN",
        label: "Enable Real Send",
        defaultValue: "false",
        description: "⚠️ Must be 'true' to actually run. Sends a real WhatsApp message to the contact below.",
      },
      {
        key: "E2E_CAMPAIGN_CONTACT",
        label: "Contact Name",
        defaultValue: "Muhammad Faizuddin",
        description: "Dealer name to search in the picker. Default targets Muhammad Faizuddin's phone.",
      },
      {
        key: "E2E_CAMPAIGN_TEMPLATE",
        label: "Template Name",
        defaultValue: "",
        description: "Approved template name to use. Leave blank to pick the first available template.",
      },
      {
        key: "E2E_CAMPAIGN_LANGUAGE",
        label: "Language Code",
        defaultValue: "EN",
        description: "Language variant to select, e.g. EN, MS, ZH.",
      },
    ],
  },
  {
    id: "flow-inbox-complete", file: "flow-inbox-complete.spec.ts",
    title: "Inbox", emoji: "💬",
    description: "Inbound messages, conversation lifecycle, search, keyboard shortcuts, AI tabs, and canned replies.",
    tags: ["inbox", "conversations", "canned-replies"], estimatedDuration: "~7 min", metaRisk: false,
    tests: [
      { name: "inbound message appears in Awaiting tab", defaultEnabled: true },
      {
        name: "replying to a message moves it to Replied and auto-resolves", defaultEnabled: true,
        params: [
          { key: "E2E_REPLY_MESSAGE", label: "Reply Message", defaultValue: "I will help you shortly.",
            description: "Text typed into the inbox composer before sending." },
        ],
      },
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
      { key: "API_BASE",            label: "API Base URL",       defaultValue: "http://localhost:3000", description: "Backend URL for webhook seeding" },
      { key: "WHATSAPP_APP_SECRET", label: "WhatsApp App Secret", defaultValue: "3056575083ca35ce9aab0ddc07a705e0", description: "HMAC secret for webhook payloads" },
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
      {
        name: "admin creates a multi-language draft, submits to Meta (mock), sees PENDING",
        defaultEnabled: false, metaRisk: true,
        params: [
          {
            key: "E2E_TEMPLATE_CATEGORY", label: "Template Category", defaultValue: "MARKETING", type: "select",
            options: [{ value: "MARKETING", label: "Marketing" }, { value: "UTILITY", label: "Utility" }, { value: "AUTHENTICATION", label: "Authentication" }],
          },
          {
            key: "E2E_TEMPLATE_LANG_VARIANT", label: "Second Language Variant", defaultValue: "MS", type: "select",
            description: "Language added as a second variant alongside the default EN.",
            options: [{ value: "MS", label: "Malay (MS)" }, { value: "ZH", label: "Chinese (ZH)" }, { value: "TA", label: "Tamil (TA)" }],
          },
        ],
      },
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
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlowConfig   { enabledTests: Set<string>; vars: Record<string, string>; }
interface TestParamVals { [testName: string]: { [paramKey: string]: string }; }
interface ReportSpec   { title: string; ok: boolean; duration: number; error?: string; suite: string; }
interface RunResult    {
  exitCode: number; log: string; startedAt: string;
  setupRequired?: boolean;
  stats?: { duration: number; expected: number; unexpected: number; skipped: number; };
  specs?: ReportSpec[];
}

// ── Report parser ─────────────────────────────────────────────────────────────

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

// ── Setup banner ─────────────────────────────────────────────────────────────

function SetupBanner() {
  const cmd = "cd scripts/WA-Blaster && npm install";
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(cmd).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }
  return (
    <div className="bg-amber-950/40 border border-amber-700/50 rounded-2xl p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Terminal size={15} className="text-amber-400 shrink-0" />
        <span className="text-sm font-semibold text-amber-300">One-time setup required</span>
      </div>
      <p className="text-xs text-amber-200/70 leading-relaxed">
        Playwright dependencies are not installed yet. Run this command once in your terminal —
        Chromium will be downloaded automatically afterwards.
      </p>
      <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5">
        <code className="flex-1 text-xs font-mono text-slate-200">{cmd}</code>
        <button onClick={copy} className="shrink-0 text-slate-400 hover:text-slate-200 transition-colors">
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
        </button>
      </div>
    </div>
  );
}

// ── Report panel ──────────────────────────────────────────────────────────────

function ReportPanel({ result, baseUrl }: { result: RunResult; baseUrl: string }) {
  if (!result.stats) return null;
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-200">Results</h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Passed",   value: result.stats.expected,           color: "text-green-400", bg: "bg-green-900/30 border-green-800" },
          { label: "Failed",   value: result.stats.unexpected,         color: "text-red-400",   bg: "bg-red-900/30 border-red-800" },
          { label: "Skipped",  value: result.stats.skipped,            color: "text-slate-400", bg: "bg-slate-800 border-slate-700" },
          { label: "Duration", value: msToHuman(result.stats.duration), color: "text-blue-300",  bg: "bg-blue-900/20 border-blue-900" },
        ].map(s => (
          <div key={s.label} className={clsx("rounded-xl border p-3 text-center", s.bg)}>
            <div className={clsx("text-xl font-black", s.color)}>{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {result.specs && result.specs.length > 0 && (
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider w-14">Status</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Suite</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-500 uppercase tracking-wider">Test</th>
                <th className="px-3 py-2 text-right font-semibold text-slate-500 uppercase tracking-wider w-20">Time</th>
              </tr>
            </thead>
            <tbody>
              {result.specs.map((spec, i) => (
                <Fragment key={i}>
                  <tr className={clsx("border-b border-slate-800/60", !spec.ok && "bg-red-950/20")}>
                    <td className="px-3 py-2">
                      {spec.ok ? <CheckCircle2 size={13} className="text-green-400" /> : <XCircle size={13} className="text-red-400" />}
                    </td>
                    <td className="px-3 py-2 text-slate-500 max-w-[140px] truncate">{spec.suite}</td>
                    <td className="px-3 py-2 text-slate-300">{spec.title}</td>
                    <td className="px-3 py-2 text-right text-slate-500 font-mono">{msToHuman(spec.duration)}</td>
                  </tr>
                  {spec.error && (
                    <tr className="bg-red-950/10 border-b border-red-900/20">
                      <td colSpan={4} className="px-3 py-2">
                        <pre className="text-[10px] text-red-400 whitespace-pre-wrap font-mono max-h-28 overflow-y-auto">{spec.error}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
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
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showBrowser,   setShowBrowser]   = useState(true);

  // ── Per-flow configs (enable/disable toggles + flow-level vars) ────────────
  const [flowConfigs, setFlowConfigs] = useState<Record<string, FlowConfig>>(() =>
    Object.fromEntries(FLOWS.map(f => [f.id, defaultConfig(f)]))
  );

  // ── Per-test param values ──────────────────────────────────────────────────
  const [testParamVals, setTestParamVals] = useState<Record<string, TestParamVals>>(() =>
    Object.fromEntries(FLOWS.map(f => [f.id, Object.fromEntries(f.tests.map(t => [t.name, {}]))]))
  );

  // ── Navigation: null = overview, string = flow detail ─────────────────────
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);

  // ── Batch selection (overview) ─────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // ── Run state ──────────────────────────────────────────────────────────────
  const [running,      setRunning]      = useState(false);
  const [stopping,     setStopping]     = useState(false);
  const [runLog,       setRunLog]       = useState("");
  const [result,       setResult]       = useState<RunResult | null>(null);
  const [downloadErr,  setDownloadErr]  = useState<string | null>(null);
  const runningContextRef = useRef<string | null>(null); // "overview" | flowId | null
  const [resultContext,  setResultContext]  = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef  = useRef<HTMLPreElement>(null);

  // ── Restore from localStorage ──────────────────────────────────────────────
  useEffect(() => {
    const s = localStorage.getItem("wa_settings");
    if (!s) return;
    try {
      const d = JSON.parse(s);
      if (d.baseUrl)       setBaseUrl(d.baseUrl);
      if (d.adminEmail)    setAdminEmail(d.adminEmail);
      if (d.adminPassword) setAdminPassword(d.adminPassword);
      if (d.opEmail)       setOpEmail(d.opEmail);
      if (d.opPassword)              setOpPassword(d.opPassword);
      if (d.showBrowser !== undefined) setShowBrowser(d.showBrowser);
    } catch { /* ignore */ }
  }, []);

  function saveSettings() {
    localStorage.setItem("wa_settings", JSON.stringify({ baseUrl, adminEmail, adminPassword, opEmail, opPassword, showBrowser }));
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
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
        const ctx = runningContextRef.current;
        runningContextRef.current = null;
        setResultContext(ctx);
        setResult({ exitCode: data.exitCode, log: data.log, startedAt: data.startedAt ?? "", ...parseReport(data.report) });
      }
    }, 1500);
  }, [stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [runLog]);

  // ── Start run ──────────────────────────────────────────────────────────────
  async function startRun(flowIds: string[], ctx: string) {
    const specFiles = flowIds.map(id => FLOWS.find(f => f.id === id)!.file);
    const env: Record<string, string> = {
      E2E_BASE_URL:          baseUrl,
      E2E_ADMIN_EMAIL:       adminEmail,
      E2E_ADMIN_PASSWORD:    adminPassword,
      E2E_OPERATOR_EMAIL:    opEmail,
      E2E_OPERATOR_PASSWORD: opPassword,
    };

    for (const id of flowIds) {
      // Flow-level vars
      const cfg = flowConfigs[id];
      if (cfg) Object.assign(env, cfg.vars);

      // Per-test param overrides
      const flow     = FLOWS.find(f => f.id === id)!;
      const paramMap = testParamVals[id] ?? {};
      for (const test of flow.tests) {
        for (const param of (test.params ?? [])) {
          const val = (paramMap[test.name]?.[param.key] ?? "").trim();
          if (val) env[param.key] = val;
        }
      }
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
    runningContextRef.current = ctx;
    setResultContext(null);
    setResult(null);
    setRunLog("");

    const res = await fetch("/api/wa-blaster/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ specFiles, grepPattern, env, headed: showBrowser }),
    });
    if (!res.ok) {
      const data = await res.json();
      const errMsg = data.error ?? "Failed to start.";
      setRunning(false);
      runningContextRef.current = null;
      setResultContext(ctx);
      setRunLog(errMsg);
      setResult({ exitCode: 1, log: errMsg, startedAt: "", setupRequired: data.setupRequired ?? false });
      return;
    }
    startPolling();
  }

  async function stopRun() { setStopping(true); await fetch("/api/wa-blaster/run", { method: "DELETE" }); }

  const [downloading, setDownloading] = useState(false);

  async function downloadReport() {
    if (!result) return;
    const { stats, specs } = result;
    if (!specs?.length) { setDownloadErr("No test data — run a test suite first."); return; }
    setDownloadErr(null);
    setDownloading(true);

    // Fetch screenshots from server (best-effort — report still works without them)
    type ShotMap = Record<string, Record<string, { filename: string; caption: string; data: string }[]>>;
    let shots: ShotMap = {};
    try {
      const r = await fetch("/api/wa-blaster/screenshots-data");
      if (r.ok) shots = await r.json();
    } catch { /* ignore — screenshots are optional */ }

    setDownloading(false);

    const esc = (s: string) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    const ts = new Date().toLocaleString("en-MY", { timeZone:"Asia/Kuala_Lumpur", dateStyle:"long", timeStyle:"short" });
    const allPassed = (stats?.unexpected ?? 0) === 0;

    // Build per-spec slug the same way fixtures.ts does
    function specSlug(title: string) {
      return title.replace(/[^a-zA-Z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,60);
    }

    // Group specs by suite label
    const suiteMap = new Map<string, ReportSpec[]>();
    for (const s of specs) {
      const key = s.suite || "Tests";
      (suiteMap.get(key) ?? suiteMap.set(key,[]).get(key))!.push(s);
    }

    // Derive flow id from suite names (the suite top-level is the spec filename)
    // shots keys are flow ids like "smoke-sidebar", "flow-auth-and-roles" etc.
    const flowIds = Object.keys(shots);

    function shotsForSpec(title: string): { filename:string; caption:string; data:string }[] {
      const slug = specSlug(title);
      for (const fid of flowIds) {
        if (shots[fid]?.[slug]) return shots[fid][slug];
      }
      return [];
    }

    const suiteBlocks = [...suiteMap.entries()].map(([suiteName, suiteSpecs]) => {
      const passed = suiteSpecs.filter(s => s.ok).length;
      const failed = suiteSpecs.filter(s => !s.ok).length;

      const testBlocks = suiteSpecs.map(s => {
        const specShots = shotsForSpec(s.title);

        const errBlock = s.error ? `
          <div style="margin-top:10px;background:#fef2f2;border:1px solid #fecaca;border-left:4px solid #ef4444;border-radius:8px;padding:12px 16px">
            <div style="font-size:11px;font-weight:700;color:#991b1b;margin-bottom:6px;text-transform:uppercase;letter-spacing:.5px">Error Detail</div>
            <pre style="white-space:pre-wrap;word-break:break-word;font-size:11px;line-height:1.7;margin:0;font-family:'SF Mono','Fira Code',Consolas,monospace;color:#7f1d1d">${esc(s.error)}</pre>
          </div>` : "";

        const screenshotGrid = specShots.length > 0 ? `
          <div style="margin-top:14px">
            <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.6px;color:#64748b;margin-bottom:10px">
              Pages visited (${specShots.length} screenshot${specShots.length !== 1 ? "s" : ""})
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px">
              ${specShots.map((sh,i) => `
              <figure style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#f8fafc;break-inside:avoid">
                <div style="position:relative">
                  <span style="position:absolute;top:6px;left:6px;background:rgba(0,0,0,.55);color:#fff;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px">${i+1}</span>
                  <img src="data:image/png;base64,${sh.data}" style="width:100%;display:block" />
                </div>
                <figcaption style="font-size:11px;font-family:'SF Mono','Fira Code',Consolas,monospace;color:#64748b;padding:6px 10px;background:#f1f5f9;border-top:1px solid #e2e8f0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(sh.caption)}</figcaption>
              </figure>`).join("")}
            </div>
          </div>` : "";

        return `
        <div style="border:1px solid ${s.ok ? "#dcfce7" : "#fee2e2"};border-left:4px solid ${s.ok ? "#22c55e" : "#ef4444"};border-radius:10px;padding:16px 20px;margin-bottom:12px;background:${s.ok ? "#f0fdf4" : "#fff1f2"}">
          <div style="display:flex;align-items:flex-start;gap:12px;flex-wrap:wrap">
            <span style="flex-shrink:0;margin-top:1px;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:5px;${s.ok ? "background:#dcfce7;color:#15803d" : "background:#fee2e2;color:#b91c1c"}">${s.ok ? "PASS" : "FAIL"}</span>
            <span style="flex:1;min-width:0;font-size:13.5px;font-weight:600;color:#0f172a;line-height:1.4">${esc(s.title)}</span>
            <span style="flex-shrink:0;font-size:12px;color:#94a3b8;font-variant-numeric:tabular-nums;white-space:nowrap">${msToHuman(s.duration)}</span>
          </div>
          ${errBlock}
          ${screenshotGrid}
        </div>`;
      }).join("");

      return `
      <section style="margin:0;padding:28px 32px 12px;border-top:1px solid #e2e8f0">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:8px">
          <h2 style="font-size:16px;font-weight:700;color:#0f172a;margin:0">${esc(suiteName)}</h2>
          <div style="display:flex;gap:10px;font-size:12px;font-weight:600">
            ${passed > 0 ? `<span style="color:#16a34a">${passed} passed</span>` : ""}
            ${failed > 0 ? `<span style="color:#dc2626">${failed} failed</span>` : ""}
          </div>
        </div>
        ${testBlocks}
      </section>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>WA Blaster Test Report</title>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; font-size: 13px; line-height: 1.5; background: #ffffff; color: #1a1a2e; }
figure { break-inside: avoid; }
section { break-before: auto; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
</style>
</head>
<body>

<!-- Cover -->
<div style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);color:white;padding:48px 56px 44px">
  <div style="font-size:28px;font-weight:800;letter-spacing:-.5px;margin-bottom:4px">WA Blaster — Test Report</div>
  <div style="font-size:13px;color:#94a3b8;margin-bottom:32px">Generated ${ts}</div>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    ${([
      ["Passed",   String(stats?.expected   ?? 0), allPassed ? "#4ade80" : "#4ade80"],
      ["Failed",   String(stats?.unexpected ?? 0), (stats?.unexpected ?? 0) > 0 ? "#f87171" : "#4ade80"],
      ["Skipped",  String(stats?.skipped    ?? 0), "#94a3b8"],
      ["Duration", msToHuman(stats?.duration ?? 0), "#60a5fa"],
    ] as [string,string,string][]).map(([label,val,color]) => `
    <div style="background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:16px 24px;min-width:120px;text-align:center">
      <div style="font-size:32px;font-weight:800;line-height:1;margin-bottom:6px;color:${color}">${val}</div>
      <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.7px">${label}</div>
    </div>`).join("")}
  </div>
  <div style="margin-top:28px;font-size:12px;color:#475569">
    Overall result: <strong style="color:${allPassed ? "#4ade80" : "#f87171"}">${allPassed ? "ALL TESTS PASSED ✓" : "SOME TESTS FAILED ✗"}</strong>
  </div>
</div>

${suiteBlocks}

</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    win?.print();
    setTimeout(() => URL.revokeObjectURL(url), 120_000);
  }

  // ── Config helpers ─────────────────────────────────────────────────────────
  function toggleTest(flowId: string, name: string) {
    setFlowConfigs(prev => {
      const cfg = prev[flowId];
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

  function setFlowVar(flowId: string, key: string, value: string) {
    setFlowConfigs(prev => ({
      ...prev,
      [flowId]: { ...prev[flowId], vars: { ...prev[flowId].vars, [key]: value } },
    }));
  }

  function resetFlowVars(flowId: string) {
    const flow = FLOWS.find(f => f.id === flowId)!;
    setFlowConfigs(prev => ({
      ...prev,
      [flowId]: { ...prev[flowId], vars: Object.fromEntries(flow.flowVars.map(v => [v.key, v.defaultValue])) },
    }));
  }

  function setTestParam(flowId: string, testName: string, paramKey: string, value: string) {
    setTestParamVals(prev => ({
      ...prev,
      [flowId]: { ...prev[flowId], [testName]: { ...(prev[flowId]?.[testName] ?? {}), [paramKey]: value } },
    }));
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeFlow = activeFlowId ? FLOWS.find(f => f.id === activeFlowId) ?? null : null;
  const isRunningIn = (ctx: string) => running && runningContextRef.current === ctx;
  const hasResultIn = (ctx: string) => resultContext === ctx;

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
      <header className="no-print sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {activeFlow ? (
            <>
              <button onClick={() => setActiveFlowId(null)}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors shrink-0">
                <ChevronLeft size={13} />
                <MessageSquare size={13} className="text-green-400" />
                <span>WA Blaster</span>
              </button>
              <span className="text-slate-700">/</span>
              <span className="text-sm font-semibold text-slate-200 truncate">{activeFlow.emoji} {activeFlow.title}</span>
            </>
          ) : (
            <>
              <MessageSquare size={14} className="text-green-400 shrink-0" />
              <h1 className="text-sm font-semibold text-slate-200">WA Blaster Tests</h1>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {running ? (
            <button onClick={stopRun} disabled={stopping}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-lg font-medium">
              {stopping ? <Loader2 size={12} className="animate-spin" /> : <Square size={12} />}
              {stopping ? "Stopping…" : "Stop"}
            </button>
          ) : activeFlow ? (
            <button onClick={() => startRun([activeFlow.id], activeFlow.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-700 hover:bg-green-600 text-white rounded-lg font-medium">
              <Play size={12} /> Run Flow
            </button>
          ) : (
            <button onClick={() => startRun(FLOWS.map(f => f.id), "overview")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium">
              <Play size={12} /> Run All
            </button>
          )}
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════
          OVERVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      {!activeFlow && (
        <div className="px-4 sm:px-6 py-5 space-y-5">

          {/* Global settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <button onClick={() => setSettingsOpen(v => !v)}
              className="w-full flex items-center gap-2 px-5 py-3.5 text-sm text-slate-400 hover:text-slate-200 transition-colors">
              <Settings2 size={15} className="text-slate-500" />
              <span className="flex-1 text-left font-medium">Testing Environment</span>
              <span className="text-xs font-mono text-slate-600 mr-2 max-w-[240px] truncate">{baseUrl}</span>
              <ChevronDown size={14} className={clsx("transition-transform shrink-0", settingsOpen && "rotate-180")} />
            </button>
            {settingsOpen && (
              <div className="px-5 pb-5 border-t border-slate-800 pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="sm:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">WA Blaster Base URL</label>
                  <input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="http://localhost:5173"
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
                <div className="sm:col-span-2 lg:col-span-3 flex items-center justify-between flex-wrap gap-3">
                  <label className="flex items-center gap-3 cursor-pointer select-none group">
                    <button type="button" role="switch" aria-checked={showBrowser}
                      onClick={() => setShowBrowser(v => !v)}
                      className={clsx(
                        "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
                        showBrowser ? "bg-green-600" : "bg-slate-600"
                      )}>
                      <span className={clsx(
                        "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform duration-200",
                        showBrowser ? "translate-x-4" : "translate-x-0"
                      )} />
                    </button>
                    <span className="text-xs text-slate-300 font-medium">Show Browser</span>
                    <span className="text-[10px] text-slate-500">{showBrowser ? "Visible — browser window opens during tests" : "Headless — runs in background, no window"}</span>
                  </label>
                  <button onClick={saveSettings}
                    className={clsx(
                      "px-4 py-2 text-xs font-medium rounded-lg transition-colors",
                      settingsSaved
                        ? "bg-green-700 text-green-100 cursor-default"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    )}>
                    {settingsSaved ? "✓ Saved" : "Save Settings"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Flow cards */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              {selected.size > 0
                ? `${selected.size} flow${selected.size > 1 ? "s" : ""} selected — or click any card to configure it.`
                : "Click a card to configure and run a flow. Tick checkboxes to select multiple for a batch run."}
            </p>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">Clear</button>
                <button onClick={() => startRun(Array.from(selected), "overview")} disabled={running}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white rounded-lg transition-colors">
                  <Play size={11} /> Run Selected ({selected.size})
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {FLOWS.map(flow => {
              const cfg = flowConfigs[flow.id] ?? defaultConfig(flow);
              const isChecked = selected.has(flow.id);
              return (
                <div key={flow.id} onClick={() => setActiveFlowId(flow.id)}
                  className={clsx(
                    "bg-slate-900 border rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-colors group",
                    isChecked ? "border-blue-600/60" : "border-slate-800 hover:border-slate-700"
                  )}>
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
                    <span className="ml-auto text-[10px] font-medium text-slate-600 group-hover:text-blue-400 transition-colors">Configure →</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Overview run output */}
          {(isRunningIn("overview") || hasResultIn("overview")) && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  {isRunningIn("overview") ? <Loader2 size={13} className="text-blue-400 animate-spin" />
                    : result?.exitCode === 0 ? <CheckCircle2 size={13} className="text-green-400" />
                    : <XCircle size={13} className="text-red-400" />}
                  <span className="text-xs font-medium text-slate-400">
                    {isRunningIn("overview") ? "Test output (live)" : `Run finished — exit code ${result?.exitCode}`}
                  </span>
                </div>
                <pre ref={isRunningIn("overview") ? logRef : undefined}
                  className="text-[11px] font-mono text-slate-400 px-4 py-3 max-h-48 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {runLog || "Starting…"}
                </pre>
              </div>
              {hasResultIn("overview") && result?.setupRequired && <SetupBanner />}
              {hasResultIn("overview") && result && !result.setupRequired && (
                <>
                  <div className="flex items-center gap-2">
                    <button onClick={downloadReport} disabled={downloading}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-300 rounded-lg">
                      <Download size={12} />
                      {downloading ? "Building report…" : "Download Report"}
                    </button>
                    {downloadErr && <span className="text-xs text-red-400">{downloadErr}</span>}
                  </div>
                  <ReportPanel result={result} baseUrl={baseUrl} />
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          FLOW DETAIL
      ══════════════════════════════════════════════════════════════════════ */}
      {activeFlow && (() => {
        const flow       = activeFlow;
        const cfg        = flowConfigs[flow.id];
        const paramMap   = testParamVals[flow.id] ?? {};
        const isRunning  = isRunningIn(flow.id);
        const hasResult  = hasResultIn(flow.id);
        const otherBusy  = running && runningContextRef.current !== flow.id;

        return (
          <div className="px-4 sm:px-6 py-5 space-y-5">

            {/* Flow info */}
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
                  {flow.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-slate-800 rounded text-slate-500">{t}</span>)}
                </div>
              </div>
              <div className="shrink-0 text-right hidden sm:block">
                <p className="text-[10px] text-slate-600">Testing against</p>
                <p className="text-xs font-mono text-slate-500 max-w-[200px] truncate">{baseUrl}</p>
              </div>
            </div>

            {/* Main layout */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">

              {/* Test list — takes 2 columns on xl */}
              <div className="xl:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Tests
                    <span className="ml-2 text-slate-600 font-normal normal-case">
                      {cfg.enabledTests.size} of {flow.tests.length} enabled
                    </span>
                  </h3>
                  <div className="flex gap-3">
                    <button onClick={() => setAllTests(flow.id, true)} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">All</button>
                    <button onClick={() => setAllTests(flow.id, false)} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">None</button>
                  </div>
                </div>

                <div className="divide-y divide-slate-800/60">
                  {flow.tests.map(t => {
                    const enabled = cfg.enabledTests.has(t.name);
                    const hasParams = (t.params ?? []).length > 0;
                    return (
                      <div key={t.name} className={clsx("px-5 py-3.5 transition-colors", enabled ? "" : "opacity-50")}>
                        {/* Test row */}
                        <div className="flex items-start gap-3">
                          <input type="checkbox" checked={enabled} onChange={() => toggleTest(flow.id, t.name)}
                            className="accent-blue-500 mt-0.5 shrink-0 cursor-pointer" />
                          <div className="flex-1 min-w-0">
                            <p className={clsx("text-sm leading-snug", enabled ? "text-slate-200" : "text-slate-500")}>{t.name}</p>
                            {t.metaRisk && (
                              <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-orange-900/40 text-orange-400 border border-orange-800/60">
                                <AlertTriangle size={8} /> Calls Meta API — use sparingly
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Per-test param inputs */}
                        {hasParams && enabled && (
                          <div className="mt-3 ml-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {(t.params ?? []).map(param => (
                              <div key={param.key}>
                                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                                  {param.label}
                                  <span className="ml-1.5 text-slate-600 font-normal">default: {param.defaultValue}</span>
                                </label>
                                {param.description && (
                                  <p className="text-[10px] text-slate-600 mb-1">{param.description}</p>
                                )}
                                {param.type === "select" && param.options ? (
                                  <select
                                    value={paramMap[t.name]?.[param.key] ?? ""}
                                    onChange={e => setTestParam(flow.id, t.name, param.key, e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
                                  >
                                    <option value="">— use default ({param.defaultValue}) —</option>
                                    {param.options.map(o => (
                                      <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <input
                                    value={paramMap[t.name]?.[param.key] ?? ""}
                                    onChange={e => setTestParam(flow.id, t.name, param.key, e.target.value)}
                                    type={param.type === "password" ? "text" : "text"}
                                    placeholder={`default: ${param.defaultValue}`}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right column: flow vars + run */}
              <div className="space-y-4">

                {/* Flow variables */}
                {flow.flowVars.length > 0 && (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Flow Variables</h3>
                      <button onClick={() => resetFlowVars(flow.id)}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
                        <RotateCcw size={10} /> Defaults
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-600">Override values specific to this flow. Leave blank to use the default.</p>
                    {flow.flowVars.map(v => (
                      <div key={v.key}>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          {v.label}
                          <span className="ml-1.5 text-slate-600 font-normal text-[11px]">default: {v.defaultValue}</span>
                        </label>
                        {v.description && <p className="text-[11px] text-slate-600 mb-1.5">{v.description}</p>}
                        <input value={cfg.vars[v.key] ?? v.defaultValue} onChange={e => setFlowVar(flow.id, v.key, e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-600" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Run panel */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Run</h3>
                    <span className="text-[11px] text-slate-600">{cfg.enabledTests.size}/{flow.tests.length} tests</span>
                  </div>
                  {otherBusy ? (
                    <div className="flex items-center gap-2 text-xs text-slate-500 italic">
                      <Loader2 size={12} className="animate-spin text-blue-400 shrink-0" />
                      Another flow is running…
                    </div>
                  ) : isRunning ? (
                    <>
                      <div className="flex items-center gap-1.5 text-xs text-blue-300 animate-pulse">
                        <Loader2 size={12} className="animate-spin" /> Running…
                      </div>
                      <button onClick={stopRun} disabled={stopping}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white rounded-xl transition-colors">
                        {stopping ? <Loader2 size={14} className="animate-spin" /> : <Square size={14} />}
                        {stopping ? "Stopping…" : "Stop Run"}
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button onClick={() => startRun([flow.id], flow.id)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-green-700 hover:bg-green-600 text-white rounded-xl transition-colors">
                        <Play size={14} /> Run Flow
                      </button>
                      {hasResult && (
                        <>
                          <button onClick={downloadReport} disabled={downloading}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-slate-300 rounded-xl transition-colors">
                            <Download size={14} />
                            {downloading ? "Building report…" : "Download Report"}
                          </button>
                          {downloadErr && <p className="text-xs text-red-400 text-center">{downloadErr}</p>}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live log */}
            {(isRunning || hasResult) && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                  {isRunning ? <Loader2 size={13} className="text-blue-400 animate-spin" />
                    : result?.exitCode === 0 ? <CheckCircle2 size={13} className="text-green-400" />
                    : <XCircle size={13} className="text-red-400" />}
                  <span className="text-xs font-medium text-slate-400">
                    {isRunning ? "Test output (live)" : `Run finished — exit code ${result?.exitCode}`}
                  </span>
                </div>
                <pre ref={isRunning ? logRef : undefined}
                  className="text-[11px] font-mono text-slate-400 px-4 py-3 max-h-56 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                  {runLog || "Starting…"}
                </pre>
              </div>
            )}

            {/* Report */}
            {hasResult && result?.setupRequired && <SetupBanner />}
            {hasResult && result && !result.setupRequired && <ReportPanel result={result} baseUrl={baseUrl} />}

          </div>
        );
      })()}
    </div>
  );
}
