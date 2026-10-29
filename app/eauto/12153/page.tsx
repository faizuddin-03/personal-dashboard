"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, Film, RefreshCw, Image as ImageIcon, Download, Copy, Check, ClipboardList, FileSpreadsheet, History, Building2, ShieldAlert, Shuffle,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import OnboardingCompanyDrop from "@/components/OnboardingCompanyDrop";
import { useOnboardingCompanies, spend } from "@/lib/onboardingCompanies";
import { fakeLicence, fakeLlp, freeRows, isFakeLlp, rowKey, tinFromUsedRow, tinKey, tinPool, type CompanyType } from "@/lib/onboardingCompanyTypes";
import EvidenceBulkDownload, { EvidenceGroupCheckbox, toEvidenceStatus, type EvidenceGroup, type EvidenceGroupStatus } from "@/components/EvidenceBulkDownload";
import EautoBrowserSignIn from "@/components/EautoBrowserSignIn";
import { useTsPassState, TS_PASS_ROW, TS_PASS_TITLE } from "@/lib/tsPassState";
import { DeploySoonHeader } from "@/lib/useDeployReminder";

/** Registry key for this page's run in AppShell's background-run store. */
const RUN_KEY = "eauto/12153";

// EAINT-12153 — [eAuto-Application] Add Payment Channels for Pre-application
// and Application. Official TS: QATeam SharePoint v38 (2026-10-21), text copy
// _reference/tickets/EAINT-12153/EAINT-12153-official-TS-sharepoint-v38-20261021.md.
// Suite: scripts/eauto-12153 (one test per TS = one full onboarding chain).
//
// Same standard flow as app/eauto/12107/page.tsx (queue of one TS per run
// call, one card per TS, per-TS evidence, past runs, detailed log). Each TS
// carries its own company (old BRN / new BRN / TIN or trading licence),
// typed on its row or picked from the Company Details Checker list. eSIM is
// used for SSM seeding, so runs are gated on the VPN prompt.
//
// TS1–TS4 are FPX (B2B): maker Authorize (Order ID) → Pending Approval → checker approves on /fpx-b2b/pending → refresh.

const TS_SECTIONS = [
  { id: "tsA", letter: "A", title: "FPX (B2B) — Online Banking (Business)" },
  { id: "tsB", letter: "B", title: "FPX (B2C) — Online Banking (Personal)" },
  { id: "tsC", letter: "C", title: "Card — Credit / Debit" },
  { id: "tsD", letter: "D", title: "Payment retry (official v42)" },
  { id: "tsE", letter: "E", title: "Guided capture (not a TS) — you click, the run saves every page" },
] as const;
type SectionLetter = (typeof TS_SECTIONS)[number]["letter"];

type BizType = "ROC" | "ROB" | "LLP" | "TRADING_SABAH" | "TRADING_SARAWAK";
const BIZ_LABEL: Record<BizType, string> = {
  ROC: "Sdn Bhd / Bhd", ROB: "Sole Proprietorship / Partnership", LLP: "LLP",
  TRADING_SABAH: "Business Trading (Sabah)", TRADING_SARAWAK: "Business Trading (Sarawak)",
};
/** Company-name tag — Faizuddin, 2026-10-21: "UDIN ONBOARD TESTING SDNXXXX/SABAHXXXX/SOLE PROPXXXX". */
const BIZ_TAG: Record<BizType, string> = { ROC: "SDN", ROB: "SOLEPROP", LLP: "LLP", TRADING_SABAH: "SABAH", TRADING_SARAWAK: "SARAWAK" };
const isTrading = (t: BizType) => t === "TRADING_SABAH" || t === "TRADING_SARAWAK";

interface Scenario {
  id: string;
  section: SectionLetter;
  order: number;
  /** MUST match the spec's test() title exactly — the runner greps by it. */
  title: string;
  summary: string;
  biz: BizType;
  /** Blocked on staging — runs, but stops with the reason. */
  blocked?: string;
  /** Runs, but part of the flow is unverified: true = card form; a string = that note. */
  unconfirmed?: boolean | string;
}


// Titles mirror scripts/eauto-12153/data/scenarios.ts exactly.
const SCENARIOS: Scenario[] = [
  { id: "ts1", section: "A", order: 1, biz: "ROC", title: "12153_TS01: FPX (B2B) Maybank then CIMB Bank, Success — Sdn Bhd", summary: "Pre-Application: Online Banking (Business) → Maybank → sandbox Success → invoice / e-Invoice → listing Approved. Application: CIMB Bank → Success → Application Payment Success → Registration Fee OK." },
  { id: "ts2", section: "A", order: 2, biz: "ROB", title: "12153_TS02: FPX (B2B) AmBank then Public Bank, Failed then redo — Sole Prop", summary: "AmBank / Public Bank: Failed status → \"Unsuccessful Payment\" on the review page / page 5 → redo until Success." },
  { id: "ts3", section: "A", order: 3, biz: "ROB", title: "12153_TS03: FPX (B2B) AmBank then Public Bank, Pending Approval revisit then Approved — Sole Prop", summary: "Leave Pending Approval (99) → \"Payment is Pending Approval\" page → close the tab and reopen the page (staging shows it in the system; email is production only) → authoriser approves → listing New / Approved + Registration Fee OK." },
  { id: "ts4", section: "A", order: 4, biz: "LLP", title: "12153_TS04: FPX (B2B) HSBC then Affin Bank, Failed then Success and authorised — LLP", summary: "HSBC / Affin Bank: Failed → Unsuccessful Payment → redo → authoriser approves → listing New / Approved + Registration Fee OK." },
  { id: "ts5", section: "B", order: 5, biz: "LLP", title: "12153_TS05: FPX (B2C) RHB then HongLeong Bank, Success — LLP", summary: "Pre-Application: Online Banking (Personal) → RHB → sandbox Approved → Submitted for Review → invoice. Application: Hong Leong Bank → Approved → Application Payment Success → Registration Fee OK." },
  { id: "ts6", section: "B", order: 6, biz: "TRADING_SABAH", title: "12153_TS06: FPX (B2C) HSBC then Affin Bank, Failed then redo — Business Trading (Sabah)", summary: "HSBC / Affin Bank: status 51 → \"Unsuccessful Payment\" message checked → redo with Approved → success, invoice, listing." },
  { id: "ts7", section: "C", order: 7, biz: "TRADING_SARAWAK", title: "12153_TS07: Card (Credit) VISA, Success — Business Trading (Sarawak)", summary: "Credit or Debit Card → Fiuu card form (VISA) → 3D Secure OTP → Submitted for Review / Application Payment Success → invoice, listing.", unconfirmed: true },
  { id: "ts8", section: "C", order: 8, biz: "ROC", title: "12153_TS08: Card (Debit) Mastercard, Failed then Success — Sdn Bhd", summary: "Invalid Mastercard → error observed → redo with the valid Mastercard → success, invoice, listing. Where the failure lands (Fiuu form vs eAuto page) is unverified.", unconfirmed: true },
  { id: "ts9", section: "D", order: 9, biz: "ROC", title: "12153_TS09: FPX (B2C) Maybank then CIMB Bank, Failed then redo, BO Payment Details — Sdn Bhd", summary: "Failed → Unsuccessful Payment → redo → BO Pre-Application details: Payment Details shows the same Payment ID, Method and Date/Time as the payment details page, Status Paid.", unconfirmed: "Never run — the new checks are unverified" },
  { id: "ts10", section: "D", order: 10, biz: "ROB", title: "12153_TS10: FPX (B2C) Public Bank then AmBank, Failed, close the browser and reopen the link — Sole Prop", summary: "After each failed payment the run closes the browser, opens the link in a new browser (no cookies), checks the payment methods are back, and pays again. A person ticks the reCAPTCHA if the link asks for it.", unconfirmed: "Never run — the new checks are unverified" },
  { id: "ts11", section: "D", order: 11, biz: "TRADING_SABAH", title: "12153_TS11: FPX (B2C) RHB then HongLeong Bank, Success, link opened in a second session — Business Trading (Sabah)", summary: "On Business Info Review the run opens the same link in a second browser and expects a \"not allowed to edit\" message (exact wording unknown — the page is saved as evidence), then pays in the first.", unconfirmed: "Never run — the new checks are unverified" },
  { id: "ts12", section: "D", order: 12, biz: "TRADING_SARAWAK", title: "12153_TS12: FPX (B2C) HSBC then Affin Bank, Failed then redo, BO listing payment status — Business Trading (Sarawak)", summary: "Failed Pre-Application not in the BO listing until paid, then Status New. Application: Registration Fee = Failed and the Failed filter, then OK and the OK filter.", unconfirmed: "Never run — the new checks are unverified" },
  { id: "g1", section: "E", order: 13, biz: "ROC", title: "12153_GUIDE_B2B: Guided capture — FPX (B2B) maker Authorize and checker Approve, Pre-Application only — Sdn Bhd", summary: "Headless off. The run fills the Pre-Application up to the payment step, then you: choose Online Banking (Business) + Affin Bank or Hong Leong Bank → Submit and Pay → Authorize on Fiuu (note the tranID) → refresh the Pending Approval page → new tab https://bank-simulator.fiuu.com/fpx-b2b/pending → look up the tranID → Approve → refresh eAuto until Pre-Application Submitted for Review. Every page is saved to _reference/tickets/EAINT-12153/guided-capture/.", unconfirmed: "You do the payment — the run only saves pages" },
];


const TS_SCENARIOS = [...SCENARIOS].sort((a, b) => a.order - b.order);
const TS_BY_SECTION = TS_SECTIONS.map(sec => ({ ...sec, scenarios: TS_SCENARIOS.filter(s => s.section === sec.letter) }));

interface RunStep { title: string; duration: number; error?: string; steps: RunStep[] }
interface EvidenceItem { label: string; url: string; kind: "video" | "image" | "file" }
interface DetailItem { label: string; value: string }
interface CheckResult {
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  durationMs: number;
  error?: string;
  friendlyError?: string;
  steps: RunStep[];
  tsLabel?: string;
  evidence?: EvidenceItem[];
  video?: string;
  details?: DetailItem[];
  runId?: string;
}
interface HistoryRun { runId: string; runLabel: string; timestamp: number; scenarios: string[]; evidence: EvidenceItem[]; status?: EvidenceGroupStatus }
/** One TS card or past run in the bulk-download bar; files null = the whole run folder. */
interface BulkGroup extends EvidenceGroup { runId: string; files: string[] | null }
interface RunResponse {
  result?: { checks: CheckResult[]; passed: number; failed: number; total: number };
  error?: string;
  stopped?: boolean;
  log?: string;
  video?: string;
  evidence?: EvidenceItem[];
  details?: DetailItem[];
  runId?: string;
  runLabel?: string;
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

function groupByTs(items: EvidenceItem[]): [string, EvidenceItem[]][] {
  const groups = new Map<string, EvidenceItem[]>();
  for (const e of items) {
    const key = e.label.match(/^\d+_TS\d+(?:_TS\d+)*/)?.[0] ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));
}

// ── Run queue — one TS per run call; each item carries its own company env ──
type QueueStatus = "pending" | "running" | "passed" | "failed" | "stopped";
interface QueueItem { id: string; title: string; record: boolean; status: QueueStatus; env: Record<string, string>; res?: RunResponse }
interface QueueState { items: QueueItem[]; currentIndex: number; active: boolean; body: Record<string, unknown> }
const QUEUE_STATE_KEY = "eauto_12153_queue_state";
const tsNo = (it: { id: string; title: string }) => /^\s*(\d+_TS\d+)/.exec(it.title)?.[1] ?? it.id.toUpperCase();
function loadQueueState(): QueueState | null {
  try { const raw = localStorage.getItem(QUEUE_STATE_KEY); return raw ? (JSON.parse(raw) as QueueState) : null; } catch { return null; }
}
function saveQueueState(state: QueueState | null) {
  try { if (state) localStorage.setItem(QUEUE_STATE_KEY, JSON.stringify(state)); else localStorage.removeItem(QUEUE_STATE_KEY); } catch { /* full */ }
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

function Section({ id, title, extra, collapsed, onToggle, children, footer }: { id: string; title: ReactNode; extra?: ReactNode; collapsed: boolean; onToggle: (id: string) => void; children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div role="button" tabIndex={0} onClick={() => onToggle(id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(id); } }}
        className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 text-left hover:bg-slate-800/30 cursor-pointer">
        {collapsed ? <ChevronRight size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">{title}</span>
        {extra && <span onClick={e => e.stopPropagation()} className="flex items-center gap-3">{extra}</span>}
      </div>
      {!collapsed && <div className="divide-y divide-slate-800/70">{children}</div>}
      {!collapsed && footer}
    </div>
  );
}

// ── Per-TS company ──
interface Company { name: string; oldBrn: string; newBrn: string; tin: string; licenceNo: string; directorName: string; /** Fake company only: TIN typed on the Application (a spent Excel row's). */ appTin?: string; /** Business Trading: also type a TIN on the Application (it is optional there). */ includeTin?: boolean }
const EMPTY_COMPANY: Company = { name: "", oldBrn: "", newBrn: "", tin: "", licenceNo: "", directorName: "" };

/** Running company-name counters per business type. SDN0001 was used by hand on 2026-10-21. */
const NAME_COUNTER_KEY = "eauto_12153_name_counters";
function loadCounters(): Record<string, number> {
  try { const raw = localStorage.getItem(NAME_COUNTER_KEY); if (raw) return JSON.parse(raw); } catch { /* ignore */ }
  return { SDN: 2 };
}
const companyName = (t: BizType, n: number) => `UDIN ONBOARD TESTING ${BIZ_TAG[t]}${String(n).padStart(4, "0")}`;

/** Directors named after game characters — Faizuddin, 2026-10-21 ("Doomfist Director A, Kiriko Director A"). */
const GAME_CHARACTERS = ["DOOMFIST", "KIRIKO", "TRACER", "GENJI", "MERCY", "REINHARDT", "SONIC", "TAILS", "KNUCKLES", "SHADOW", "MARIO", "LUIGI", "YOSHI", "BOWSER", "PEACH", "KRATOS", "ATREUS", "ALOY", "NATHAN DRAKE", "JOEL", "ELLIE", "SACKBOY", "SPYRO", "CRASH"];
// Director MyKad: a new one per TS run (Faizuddin, 2026-10-22). Year "20" plus 10
// random digits — no real MyKad starts with 20, so it never matches a real person
// and eAuto no longer reports "The company and director existed in eAuto system".
const randomIc = () => "20" + Array.from({ length: 10 }, () => Math.floor(Math.random() * 10)).join("");
const randomDirector = () => `${GAME_CHARACTERS[Math.floor(Math.random() * GAME_CHARACTERS.length)]} DIRECTOR A`;

// ── Persisted form state ──
const CREDS_KEY = "eauto_12153_creds";
interface Creds {
  boInstance: string;
  assigneeUser: string; assigneePass: string;
  approverUser: string; approverPass: string;
  esimUser: string; esimPass: string; seedEsim: boolean;
  fiuuUser: string; fiuuPass: string;
  creditCard: string; debitCard: string; invalidCard: string; cardExpiry: string; cardCvv: string;
  directorIc: string; adminName: string; adminMobile: string;
  gateMinutes: string;
  companies: Record<string, Company>;
}
// Defaults (Faizuddin, 2026-10-21): staging BO instance /eauto from the next
// run; BO users mfared (assignee) and jasons (approver) as in the TS; director
// IC 030217141005; admin name; Fiuu sandbox login from the TS Notes row 13 (capital L, as 12107 found live);
// cards that work on the Fiuu sandbox (12107, 2026-10-20 — the TS's 4111…
// is rejected with P10); the TS's own negative Mastercard.
const DEFAULT_CREDS: Creds = {
  boInstance: "eauto",
  assigneeUser: "mfared", assigneePass: "eAut0#2026!",
  approverUser: "jasons", approverPass: "Pw1234@eauto",
  esimUser: "admin", esimPass: "admin", seedEsim: true,
  fiuuUser: "Gaara", fiuuPass: "Letmepaywithsand",
  creditCard: "4456530000001096", debitCard: "5200000000001096", invalidCard: "5200000000001096", cardExpiry: "12/26", cardCvv: "111",
  directorIc: "030217141005", adminName: "MUHAMMAD FAIZUDDIN BIN BIDI", adminMobile: "0137428615",
  gateMinutes: "5",
  companies: {},
};
function loadCreds(): Creds {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) {
      const saved = { ...DEFAULT_CREDS, ...JSON.parse(raw) } as Creds;
      // The TS Notes card 5555…4440 never fails on Fiuu (2026-10-26); saved settings move to the new default.
      if (saved.invalidCard === "5555555555554440") saved.invalidCard = DEFAULT_CREDS.invalidCard;
      return saved;
    }
  } catch { /* ignore */ }
  return DEFAULT_CREDS;
}

const UI_STATE_KEY = "eauto_12153_ui_state";
interface UiState { selected: string[]; headless: boolean; detailed: boolean; collapsed: Record<string, boolean> }
// New page: Headless OFF (a person ticks the reCAPTCHA), Detailed ON.
const DEFAULT_UI_STATE: UiState = { selected: [], headless: false, detailed: true, collapsed: {} };
function loadUiState(): UiState {
  try { const raw = localStorage.getItem(UI_STATE_KEY); if (raw) return { ...DEFAULT_UI_STATE, ...JSON.parse(raw) }; } catch { /* ignore */ }
  return DEFAULT_UI_STATE;
}

/** Business type → the type the dropped company Excel carries (Business Trading has none). */
const LIST_TYPE: Partial<Record<BizType, CompanyType>> = { ROC: "ROC", ROB: "ROB", LLP: "LLP" };

/** COMPANY-SKIP / COMPANY-USED lines the run prints when eSIM held another tester's rows. */
function companiesFromLog(log: string | undefined): { oldBrn: string; newBrn: string; tin: string }[] {
  const out: { oldBrn: string; newBrn: string; tin: string }[] = [];
  for (const m of (log ?? "").matchAll(/^COMPANY-(?:SKIP|USED) (\{.*\})\s*$/gm)) {
    try { out.push(JSON.parse(m[1])); } catch { /* ignore */ }
  }
  return out;
}

export default function Ticket12153Page() {
  // TS rows tinted from the TS Tracker: light green = passed in automation, darker = passed by hand.
  const passState = useTsPassState();
  const savedUi = typeof window !== "undefined" ? loadUiState() : DEFAULT_UI_STATE;
  const VALID_SCENARIO_IDS = new Set(TS_SCENARIOS.map(s => s.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(savedUi.selected.filter(id => VALID_SCENARIO_IDS.has(id))));
  const [headless, setHeadless] = useState(savedUi.headless);
  const [detailed, setDetailed] = useState(savedUi.detailed);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(savedUi.collapsed);
  function toggleSection(id: string) { setCollapsed(prev => ({ ...prev, [id]: !prev[id] })); }
  function toggleTsSection(id: string) { setCollapsed(prev => ({ ...prev, [id]: prev[id] === false })); }
  const isTsSectionCollapsed = (id: string) => collapsed[id] !== false;

  const [creds, setCreds] = useState<Creds>(typeof window !== "undefined" ? loadCreds() : DEFAULT_CREDS);
  const set = <K extends keyof Creds>(k: K, v: Creds[K]) => setCreds(p => ({ ...p, [k]: v }));
  const [counters, setCounters] = useState<Record<string, number>>(() => (typeof window !== "undefined" ? loadCounters() : { SDN: 2 }));
  const companyOf = (s: Scenario): Company => {
    const c = creds.companies[s.id] ?? EMPTY_COMPANY;
    return { ...c, name: c.name || companyName(s.biz, counters[BIZ_TAG[s.biz]] ?? 1) };
  };
  const setCompany = (id: string, k: keyof Company, v: string) => setCreds(p => ({ ...p, companies: { ...p.companies, [id]: { ...(p.companies[id] ?? EMPTY_COMPANY), [k]: v } } }));

  // Companies come from the shared Excel (components/OnboardingCompanyDrop): each
  // ticked TS gets the next free row of its type; the dropdown on the row swaps it.
  const { list: companyList, error: companyListError, isUsed, usedBy, ledger: companyLedger } = useOnboardingCompanies();
  function pickCompany(id: string, roc: string) {
    const row = companyList?.rows.find(r => rowKey(r) === roc);
    if (!row) return;
    setCreds(p => ({ ...p, companies: { ...p.companies, [id]: { ...(p.companies[id] ?? EMPTY_COMPANY), oldBrn: row.roc, newBrn: row.newRoc, tin: row.tin } } }));
  }
  /** A random free company of the row's type, not already on another TS row (Faizuddin, 2026-10-22). */
  function shuffleCompany(id: string, biz: BizType) {
    const type = LIST_TYPE[biz];
    if (!type || !companyList) return;
    setCreds(p => {
      const current = p.companies[id] ?? EMPTY_COMPANY;
      const taken = new Set(Object.entries(p.companies).filter(([k]) => k !== id).map(([, c]) => c.oldBrn).filter(Boolean));
      const pool = freeRows(companyList, type, isUsed).filter(r => !taken.has(r.roc) && r.roc !== current.oldBrn);
      if (!pool.length && biz === "LLP") return { ...p, companies: { ...p.companies, [id]: { ...current, ...fakeLlp(), appTin: tinFromUsedRow(companyList, isUsed) } } };
      if (!pool.length) return p;
      const row = pool[Math.floor(Math.random() * pool.length)];
      return { ...p, companies: { ...p.companies, [id]: { ...current, oldBrn: row.roc, newBrn: row.newRoc, tin: row.tin } } };
    });
  }
  useEffect(() => {
    if (!companyList) return;
    setCreds(p => {
      const companies = { ...p.companies };
      const taken = new Set(Object.values(companies).map(c => c.oldBrn).filter(Boolean));
      let changed = false;
      for (const s of TS_SCENARIOS) {
        const type = LIST_TYPE[s.biz];
        if (!type || !selected.has(s.id)) continue;
        const c = companies[s.id] ?? EMPTY_COMPANY;
        // Keep a typed or picked company unless the list says it has been spent since.
        const spent = companyList.rows.find(r => r.roc === c.oldBrn && isUsed(r))
          || (isFakeLlp(c.oldBrn) && isUsed({ roc: c.oldBrn, newRoc: c.newBrn, tin: c.tin }));
        if (c.oldBrn && !spent) {
          if (isFakeLlp(c.oldBrn) && !c.appTin) { companies[s.id] = { ...c, tin: "", appTin: tinFromUsedRow(companyList, isUsed) }; changed = true; }
          continue;
        }
        const row = freeRows(companyList, type, isUsed).find(r => !taken.has(r.roc));
        if (!row && s.biz === "LLP") { companies[s.id] = { ...c, ...fakeLlp(), appTin: tinFromUsedRow(companyList, isUsed) }; changed = true; continue; }
        if (!row) continue;
        taken.add(row.roc);
        companies[s.id] = { ...c, oldBrn: row.roc, newBrn: row.newRoc, tin: row.tin };
        changed = true;
      }
      return changed ? { ...p, companies } : p;
    });
  }, [companyList, selected, isUsed]);

  // Business Trading is the non-SSM route: made-up licence numbers, no Excel and no eSIM
  // (2026-10-26). Each ticked row gets one; the shuffle on the row makes a new one.
  useEffect(() => {
    setCreds(p => {
      const companies = { ...p.companies };
      let changed = false;
      for (const s of TS_SCENARIOS) {
        if (!isTrading(s.biz) || !selected.has(s.id)) continue;
        const c = companies[s.id] ?? EMPTY_COMPANY;
        if (!c.licenceNo.trim()) { companies[s.id] = { ...c, licenceNo: fakeLicence(s.biz === "TRADING_SABAH" ? "SABAH" : "SARAWAK") }; changed = true; }
        const now = companies[s.id] ?? c;
        if (!now.appTin && companyList) { companies[s.id] = { ...now, appTin: tinFromUsedRow(companyList, isUsed) }; changed = true; }
      }
      return changed ? { ...p, companies } : p;
    });
  }, [companyList, selected, isUsed]);
  /** Business Trading: switch the Pre-Application TIN on or off. The Application always gets the TIN (required there). */
  function setIncludeTin(id: string, on: boolean) {
    setCreds(p => {
      const c = p.companies[id] ?? EMPTY_COMPANY;
      return { ...p, companies: { ...p.companies, [id]: { ...c, includeTin: on, appTin: c.appTin || tinFromUsedRow(companyList, isUsed) } } };
    });
  }

  const [formError, setFormError] = useState("");
  const [stopAsk, setStopAsk] = useState(false);
  const [vpnAsk, setVpnAsk] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Set<string>>(new Set());
  // Bulk download across TS cards / past runs — All, Passed only, Failed only,
  // Selected (Faizuddin, 2026-10-21). One zip per TS / run, as before.
  const [bulkPicked, setBulkPicked] = useState<Set<string>>(new Set());
  function toggleBulk(key: string) {
    setBulkPicked(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }
  async function downloadGroups(groups: BulkGroup[]) {
    for (const g of groups) await downloadEvidence(g.files, { runId: g.runId, runLabel: g.label, zipName: `${g.label}.zip` });
  }
  const [downloadingEvidence, setDownloadingEvidence] = useState(false);
  // Run evidence bar and each TS card inside start open; both can be closed to save screen space (Faizuddin, 2026-10-26).
  const [evidenceOpen, setEvidenceOpen] = useState(true);
  const [closedEvidence, setClosedEvidence] = useState<Set<string>>(new Set());
  const toggleEvidenceCard = (k: string) => setClosedEvidence(prev => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const [evidenceError, setEvidenceError] = useState("");

  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [expandedHistoryRun, setExpandedHistoryRun] = useState<string | null>(null);
  function toggleHistorySection() {
    const aboutToExpand = collapsed.history !== false;
    toggleSection("history");
    if (aboutToExpand && !historyLoaded) loadHistory();
  }
  async function loadHistory() {
    setHistoryLoading(true); setHistoryError("");
    try {
      const r = await fetch("/api/eauto-12153/history");
      if (!r.ok) throw new Error(`Failed to load past runs (${r.status})`);
      const data = await r.json() as { runs: HistoryRun[] };
      setHistory(data.runs); setHistoryLoaded(true);
    } catch (e) { setHistoryError(e instanceof Error ? e.message : "Failed to load past runs."); }
    finally { setHistoryLoading(false); }
  }

  useEffect(() => {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({ selected: Array.from(selected), headless, detailed, collapsed }));
  }, [selected, headless, detailed, collapsed]);

  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const error = formError || bgRun?.error || "";
  const res = (bgRun?.result as RunResponse | null) ?? null;

  const [queue, setQueue] = useState<QueueState | null>(typeof window !== "undefined" ? loadQueueState() : null);
  const queueRef = useRef<QueueState | null>(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  function runQueueIndex(q: QueueState, index: number) {
    const item = q.items[index];
    const baseEnv = (q.body.env ?? {}) as Record<string, string>;
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-12153/run",
      stopUrl: "/api/eauto-12153/run",
      meta: { queueIndex: index, scenarios: [item.id] },
      body: { ...q.body, env: { ...baseEnv, ...item.env }, scenarios: [item.title], record: item.record },
    });
  }

  const processedRunId = useRef<string | null>(null);
  useEffect(() => {
    if (!bgRun || bgRun.running || !bgRun.result) return;
    if (processedRunId.current === bgRun.runId) return;
    processedRunId.current = bgRun.runId;
    const prev = queueRef.current;
    if (!prev) return;
    const data = bgRun.result as RunResponse;
    const idx = prev.currentIndex;
    // Companies the run skipped (another tester's eSIM rows) or switched to are spent too.
    for (const c of companiesFromLog(data.log)) spend({ roc: c.oldBrn, newRoc: c.newBrn, tin: c.tin }, "EAINT-12153", prev.items[idx]?.id ?? "", "");
    const items = prev.items.slice();
    if (items[idx]) {
      const failed = !!data.error || !data.result || data.result.failed > 0 || data.result.total === 0;
      items[idx] = { ...items[idx], res: data, status: data.stopped ? "stopped" : failed ? "failed" : "passed" };
      // A passed TS is unticked so the next run takes only what is left (Faizuddin, 2026-10-26).
      if (!data.stopped && !failed) { const done = items[idx].id; setSelected(p => { if (!p.has(done)) return p; const n = new Set(p); n.delete(done); return n; }); }
    }
    const nextIndex = idx + 1;
    const hasMore = prev.active && !data.stopped && nextIndex < items.length;
    if (hasMore) items[nextIndex] = { ...items[nextIndex], status: "running" };
    if (!hasMore) for (let i = nextIndex; i < items.length; i++) items[i] = { ...items[i], status: "stopped" };
    const next: QueueState = { ...prev, items, currentIndex: hasMore ? nextIndex : idx, active: hasMore };
    setQueue(next);
    saveQueueState(next);
    if (hasMore) runQueueIndex(next, nextIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgRun?.runId, bgRun?.running, bgRun?.result]);

  useEffect(() => {
    if (historyLoaded && res?.runId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res?.runId]);

  const selectedScenarios = TS_SCENARIOS.filter(s => selected.has(s.id));
  const ssmSelected = selectedScenarios.some(s => !isTrading(s.biz));
  const cardSelected = selectedScenarios.some(s => /Card \(/.test(s.title));
  const fpxSelected = selectedScenarios.some(s => /FPX/.test(s.title));

  function toggle(id: string) {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  /** Validate, then open the VPN prompt when eSIM will be used. */
  function requestRun() {
    if (!selected.size) { setFormError("Select at least one test case."); return; }
    const missing: string[] = [];
    if (!creds.assigneePass.trim() || !creds.approverPass.trim()) missing.push("BO passwords");
    if (fpxSelected && !creds.fiuuPass.trim()) missing.push("Fiuu sandbox login");
    if (ssmSelected && creds.seedEsim && !creds.esimPass.trim()) missing.push("eSIM login");
    for (const s of selectedScenarios) {
      const c = companyOf(s);
      const ts = tsNo(s);
      if (isTrading(s.biz)) {
        if (!c.licenceNo.trim()) missing.push(`${ts} licence no.`);
        if (!c.appTin) missing.push(`${ts} Application TIN (no spent row with a TIN in the Excel)`);
      }
      else {
        if (!c.oldBrn.trim()) missing.push(`${ts} old BRN`);
        if (!c.newBrn.trim()) missing.push(`${ts} new BRN`);
        if (!c.tin.trim() && !isFakeLlp(c.oldBrn)) missing.push(`${ts} TIN`);
        if (isFakeLlp(c.oldBrn) && !c.appTin) missing.push(`${ts} Application TIN (no spent row with a TIN in the Excel)`);
      }
    }
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    setFormError("");
    if (ssmSelected && creds.seedEsim) setVpnAsk(true); else run();
  }

  function run() {
    setVpnAsk(false);
    // Each TS gets its own company name from the running counter (per type),
    // unless one was typed on its row; counters advance once the run is queued.
    const next = { ...counters };
    const items: QueueItem[] = selectedScenarios.map((s, i) => {
      const c = creds.companies[s.id] ?? EMPTY_COMPANY;
      const tag = BIZ_TAG[s.biz];
      let name = c.name.trim().toUpperCase();
      if (!name) { name = companyName(s.biz, next[tag] ?? 1); next[tag] = (next[tag] ?? 1) + 1; }
      const env: Record<string, string> = {
        E12153_COMPANY_NAME: name,
        E12153_OLD_BRN: c.oldBrn.trim().toUpperCase(),
        E12153_NEW_BRN: c.newBrn.trim(),
        // Fake details never send a TIN (Faizuddin, 2026-10-23).
        // Business Trading with "Include TIN": the same spent-row TIN on the Pre-Application too (2026-10-26).
        E12153_TIN: isFakeLlp(c.oldBrn) ? "" : isTrading(s.biz) ? (c.includeTin ? (c.appTin ?? "") : "") : c.tin.trim().toUpperCase(),
        E12153_FAKE_COMPANY: isFakeLlp(c.oldBrn) ? "1" : "0",
        E12153_APP_TIN: isFakeLlp(c.oldBrn) || isTrading(s.biz) ? (c.appTin ?? "") : "",
        // Spares the run swaps to when eAuto refuses the TIN as already used (2026-10-26).
        E12153_TIN_POOL: isFakeLlp(c.oldBrn) || isTrading(s.biz) ? tinPool(companyList, isUsed, c.appTin ?? "").slice(1).join(",") : "",
        E12153_LICENCE_NO: c.licenceNo.trim().toUpperCase(),
        E12153_DIRECTOR_NAME: (c.directorName.trim() || randomDirector()).toUpperCase(),
        E12153_DIRECTOR_IC: randomIc(),
        // Next free companies of this type, used if eSIM holds another tester's rows for the first.
        E12153_COMPANY_ALTERNATES: JSON.stringify((() => {
          const type = LIST_TYPE[s.biz];
          if (!type) return [];
          const taken = new Set(Object.values(creds.companies).map(x => x.oldBrn).filter(Boolean));
          return freeRows(companyList, type, isUsed).filter(r => !taken.has(r.roc)).slice(i * 5, i * 5 + 5).map(r => ({ oldBrn: r.roc, newBrn: r.newRoc, tin: r.tin }));
        })()),
      };
      return { id: s.id, title: s.title, record: true, status: i === 0 ? "running" : "pending", env };
    });
    // The companies are spent once queued (cross-ticket ledger), so the next run gets fresh ones.
    for (const it of items) {
      const roc = it.env.E12153_OLD_BRN, newRoc = it.env.E12153_NEW_BRN;
      if (roc && newRoc) spend({ roc, newRoc, tin: it.env.E12153_TIN }, "EAINT-12153", tsNo(it), it.env.E12153_COMPANY_NAME);
      if (it.env.E12153_APP_TIN) spend(tinKey(it.env.E12153_APP_TIN), "EAINT-12153", tsNo(it), "TIN only");
    }
    // The licence field keeps the number the run types (Faizuddin, 2026-10-28: the run
    // must use the dashboard's licence). A licence BO has already seen stops the run at
    // setup with a message; press the shuffle on the row for a new one.
    const saved = { ...creds, companies: { ...creds.companies } };
    setCreds(saved);
    localStorage.setItem(CREDS_KEY, JSON.stringify(saved));
    localStorage.setItem(NAME_COUNTER_KEY, JSON.stringify(next));
    setCounters(next);
    const env: Record<string, string> = {
      E12153_BO_INSTANCE: creds.boInstance.trim(),
      E12153_BO_ASSIGNEE_USER: creds.assigneeUser.trim(), E12153_BO_ASSIGNEE_PASS: creds.assigneePass,
      E12153_BO_APPROVER_USER: creds.approverUser.trim(), E12153_BO_APPROVER_PASS: creds.approverPass,
      E12153_ESIM_USER: creds.esimUser.trim(), E12153_ESIM_PASS: creds.esimPass,
      E12153_SEED_ESIM: creds.seedEsim ? "1" : "0",
      E12153_FIUU_USER: creds.fiuuUser.trim(), E12153_FIUU_PASS: creds.fiuuPass,
      E12153_CARD_CREDIT_NUMBER: creds.creditCard, E12153_CARD_DEBIT_NUMBER: creds.debitCard, E12153_CARD_INVALID_NUMBER: creds.invalidCard,
      E12153_CARD_CREDIT_EXPIRY: creds.cardExpiry, E12153_CARD_DEBIT_EXPIRY: creds.cardExpiry, E12153_CARD_INVALID_EXPIRY: creds.cardExpiry,
      E12153_CARD_CREDIT_CVV: creds.cardCvv, E12153_CARD_DEBIT_CVV: creds.cardCvv, E12153_CARD_INVALID_CVV: creds.cardCvv,
      E12153_ADMIN_NAME: creds.adminName.trim(), E12153_ADMIN_MOBILE: creds.adminMobile.trim(),
      E12153_GATE_MINUTES: creds.gateMinutes.trim() || "5",
    };
    const q: QueueState = { items, currentIndex: 0, active: true, body: { env, headless, detailed } };
    setQueue(q);
    saveQueueState(q);
    setSelectedEvidence(new Set());
    runQueueIndex(q, 0);
  }

  function stop() {
    const prev = queueRef.current;
    if (prev) { const next = { ...prev, active: false }; setQueue(next); saveQueueState(next); }
    stopRun(RUN_KEY);
  }

  function toggleEvidence(key: string) {
    setSelectedEvidence(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }

  async function downloadEvidence(files: string[] | null, target?: { runId: string; runLabel: string; zipName?: string }) {
    const runId = target?.runId ?? res?.runId;
    if (!runId) return;
    setDownloadingEvidence(true); setEvidenceError("");
    try {
      const runLabel = target?.runLabel ?? res?.runLabel ?? runId;
      const r = await fetch("/api/eauto-12153/download-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, runLabel, ...(files ? { files } : {}) }) });
      if (!r.ok) { const data = await r.json().catch(() => ({})); throw new Error(data.error ?? `Download failed (${r.status})`); }
      const blob = await r.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = target?.zipName ?? `${runLabel}${files ? "-selected" : ""}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) { setEvidenceError(e instanceof Error ? e.message : "Failed to download evidence."); }
    finally { setDownloadingEvidence(false); }
  }

  const queueResponses = queue ? queue.items.filter(i => i.res).map(i => i.res!) : (res ? [res] : []);
  const allChecks: CheckResult[] = queueResponses.flatMap(r => (r.result?.checks ?? []).map(c => ({ ...c, runId: r.runId })));
  const result = queueResponses.length
    ? { checks: allChecks, passed: allChecks.filter(c => c.status === "passed").length, failed: allChecks.filter(c => c.status !== "passed" && c.status !== "skipped").length, total: allChecks.length }
    : undefined;
  const checks = result?.checks ?? [];
  const currentGroups: BulkGroup[] = checks.flatMap((c, i) => {
    const runId = c.runId ?? res?.runId;
    const files = (c.evidence ?? []).map(e => e.url.split("/").pop()!).filter((f, idx, arr) => arr.indexOf(f) === idx);
    return runId ? [{ key: `cur:${runId}|${i}`, label: c.tsLabel ?? res?.runLabel ?? runId, status: toEvidenceStatus(c.status), fileCount: files.length, runId, files }] : [];
  });
  const historyGroups: BulkGroup[] = history.map(h => ({ key: `hist:${h.runId}`, label: h.runLabel, status: h.status ?? "unknown", fileCount: h.evidence.length, runId: h.runId, files: null }));
  const evidence = queueResponses.flatMap(r => r.evidence ?? []);
  const details = queueResponses.flatMap(r => r.details ?? []);
  const fullLog = queue ? queue.items.filter(i => i.res?.log).map(i => `===== ${i.title} =====\n${i.res!.log}`).join("\n\n") : (res?.log ?? "");

  async function copyLog() {
    if (!fullLog) return;
    try { await navigator.clipboard.writeText(fullLog); setLogCopied(true); setTimeout(() => setLogCopied(false), 2000); } catch { /* denied */ }
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Building2 size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">12153</h1>
        <DeploySoonHeader keys={["EAINT-12153"]} />
        <span className="text-xs text-slate-600 hidden md:block">Onboarding payment channels — Pre-Application + Application (official TS v42)</span>
      </header>

      <div className="p-4 sm:p-6 space-y-5">
        <Section id="config" title="Run configuration" collapsed={!!collapsed.config} onToggle={toggleSection}>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={label}>BO instance (staging)</label>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.boInstance} onChange={e => set("boInstance", e.target.value.replace(/\//g, ""))} placeholder="eauto" className={field} />
                <p className="mt-1 text-[11px] text-slate-500">staging.eauto.my/<span className="font-mono">{creds.boInstance || "eauto"}</span>/public/login/ — /obs has no instance</p>
              </div>
              <div>
                <label className={label}>BO assignee (F1, F2, F4, F7)</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.assigneeUser} onChange={e => set("assigneeUser", e.target.value)} className={field} />
                  <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.assigneePass} onChange={e => set("assigneePass", e.target.value)} className={field} />
                </div>
              </div>
              <div>
                <label className={label}>BO approver (F5)</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.approverUser} onChange={e => set("approverUser", e.target.value)} className={field} />
                  <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.approverPass} onChange={e => set("approverPass", e.target.value)} className={field} />
                </div>
              </div>
              <div>
                <label className={label}>reCAPTCHA wait (minutes)</label>
                <input inputMode="numeric" autoComplete="off" value={creds.gateMinutes} onChange={e => set("gateMinutes", e.target.value.replace(/\D/g, ""))} onBlur={() => set("gateMinutes", String(Math.min(30, Math.max(1, Number(creds.gateMinutes) || 5))))} className={field} />
                <p className="mt-1 text-[11px] text-slate-500">A person ticks it in the browser window — keep Headless off</p>
                <EautoBrowserSignIn />
              </div>
              <div>
                <label className={label}>eSIM login {ssmSelected && creds.seedEsim && <span className="text-red-400">*</span>}</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.esimUser} onChange={e => set("esimUser", e.target.value)} className={field} />
                  <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.esimPass} onChange={e => set("esimPass", e.target.value)} className={field} />
                </div>
                <label className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400">
                  <input type="checkbox" checked={creds.seedEsim} onChange={e => set("seedEsim", e.target.checked)} className="accent-indigo-600" />Seed the SSM rows in eSIM first (VPN)
                </label>
              </div>
              <div>
                <label className={label}>Fiuu FPX simulator login</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.fiuuUser} onChange={e => set("fiuuUser", e.target.value)} className={field} />
                  <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.fiuuPass} onChange={e => set("fiuuPass", e.target.value)} className={field} />
                </div>
              </div>
              <div>
                <label className={label}>Director IC</label>
                <div className={clsx(field, "text-slate-500")}>New for every run: 20 + 10 random digits</div>
              </div>
              <div>
                <label className={label}>Admin In Charge name / mobile</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.adminName} onChange={e => set("adminName", e.target.value.toUpperCase())} className={field} />
                  <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.adminMobile} onChange={e => set("adminMobile", e.target.value.replace(/\D/g, ""))} className={clsx(field, "w-36 shrink-0")} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">Email: a fresh qa.fz.…@testingz.com per run</p>
              </div>
              {cardSelected && (
                <div className="sm:col-span-2">
                  <label className={label}>Cards — credit (TS7) / debit (TS8) / failed attempt (TS8) · expiry · CVV</label>
                  <div className="flex gap-1.5">
                    <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.creditCard} onChange={e => set("creditCard", e.target.value.replace(/\D/g, ""))} className={field} />
                    <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.debitCard} onChange={e => set("debitCard", e.target.value.replace(/\D/g, ""))} className={field} />
                    <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.invalidCard} onChange={e => set("invalidCard", e.target.value.replace(/\D/g, ""))} className={field} />
                    <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.cardExpiry} onChange={e => set("cardExpiry", e.target.value)} placeholder="MM/YY" className={clsx(field, "w-20 shrink-0")} />
                    <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.cardCvv} onChange={e => set("cardCvv", e.target.value.replace(/\D/g, ""))} placeholder="CVV" className={clsx(field, "w-16 shrink-0")} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">Failed attempt: the Mastercard above with a wrong OTP (000000) on the 3D Secure page — the confirmed way to fail a card payment.</p>
                  <p className="mt-1 text-[11px] text-slate-500">VISA 4456… and Master 5200… pass on the Fiuu sandbox (12107, 2026-10-20); the TS&apos;s 4111… is rejected (P10)</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)} className="accent-indigo-600" />Headless
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-400" title="Slows the run down and highlights each button/field/value being acted on or checked.">
                <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} className="accent-indigo-600" />Detailed (slow + highlighted)
              </label>
              {headless && <span className="text-[11px] text-amber-400 flex items-center gap-1"><AlertTriangle size={11} />Headless hides the reCAPTCHA — the run will wait and time out</span>}
              <div className="flex-1" />
              {stopAsk && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setStopAsk(false)}>
                  <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-red-300"><AlertTriangle size={16} />Stop this run?</p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setStopAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">No — keep running</button>
                      <button onClick={() => { setStopAsk(false); stop(); }} className="flex-1 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600">Yes — stop the run</button>
                    </div>
                  </div>
                </div>
              )}
              {vpnAsk && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setVpnAsk(false)}>
                  <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-300"><ShieldAlert size={16} />Is your VPN connected?</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      The SSM TS seed their company in eSIM at <span className="font-mono text-slate-300">172.30.202.114</span>, which is only reachable on the VPN. Without it the run stops at the eSIM step.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setVpnAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">Not yet — cancel</button>
                      <button onClick={run} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirmed VPN Connected</button>
                    </div>
                  </div>
                </div>
              )}
              {!running ? (
                <button onClick={requestRun} disabled={!selectedScenarios.length} className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
                  <Play size={14} />Run {selectedScenarios.length || ""} case{selectedScenarios.length === 1 ? "" : "s"}
                </button>
              ) : (
                <button onClick={() => setStopAsk(true)} disabled={bgRun?.stopping} className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                  <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
                </button>
              )}
            </div>
            {error && <p className="flex items-start gap-1.5 text-xs text-red-400 mt-2"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
          </div>
        </Section>

        <div className="space-y-2">
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Test scenarios</span>
            <span className="text-xs text-slate-600">{TS_SCENARIOS.filter(s => s.section !== "E").length} TS · {TS_SCENARIOS.filter(s => s.blocked).length} blocked</span>
            <div className="flex-1" />
            <button onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, false])) }))} className="text-xs text-indigo-400 hover:text-indigo-300">Expand all</button>
            <button onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, true])) }))} className="text-xs text-slate-500 hover:text-slate-300">Collapse all</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300">Clear selection</button>
          </div>
          <OnboardingCompanyDrop list={companyList} error={companyListError} isUsed={isUsed} ledger={companyLedger} />

          {TS_BY_SECTION.map(sec => {
            const selectedHere = sec.scenarios.filter(s => selected.has(s.id)).length;
            return (
              <Section key={sec.id} id={sec.id}
                title={<><span className="text-slate-400">{sec.letter}.</span> {sec.title} <span className="text-slate-600 normal-case tracking-normal">· {sec.scenarios.length} TS{selectedHere > 0 && <span className="text-indigo-400"> · {selectedHere} selected</span>}</span></>}
                collapsed={isTsSectionCollapsed(sec.id)} onToggle={toggleTsSection}
                extra={
                  <>
                    <button onClick={() => setSelected(prev => new Set([...prev, ...sec.scenarios.map(s => s.id)]))} className="text-xs text-indigo-400 hover:text-indigo-300">Select all</button>
                    <button onClick={() => setSelected(prev => { const next = new Set(prev); sec.scenarios.forEach(s => next.delete(s.id)); return next; })} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                  </>
                }
              >
                {sec.scenarios.map(s => {
                  const c = companyOf(s);
                  return (
                    <div key={s.id} title={passState(s.title) ? TS_PASS_TITLE[passState(s.title)!] : undefined} className={clsx("flex gap-3 px-4 py-2.5", passState(s.title) ? TS_PASS_ROW[passState(s.title)!] : clsx("hover:bg-slate-800/40", s.blocked && "bg-red-950/10", !s.blocked && s.unconfirmed && "bg-amber-950/20 hover:bg-amber-950/30"))}>
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="mt-1 accent-indigo-600 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="cursor-pointer" onClick={() => toggle(s.id)}>
                        <span className={clsx("text-sm font-mono", s.blocked ? "text-red-300" : s.unconfirmed ? "text-amber-300" : "text-slate-300")}>{s.title.split(":")[0]}</span>
                        <span className="ml-2 text-[10px] font-medium px-1.5 py-px rounded border border-slate-700 text-slate-400">{BIZ_LABEL[s.biz]}</span>
                        {s.blocked && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-red-400"><AlertTriangle size={10} />{s.blocked}</span>}
                        {!s.blocked && s.unconfirmed && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400"><AlertTriangle size={10} />{typeof s.unconfirmed === "string" ? s.unconfirmed : "Card form unverified on /obs"}</span>}
                        <p className="text-xs text-slate-400 mt-0.5">{s.title.slice(s.title.indexOf(":") + 2)}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{s.summary}</p>
                        </div>
                        {/* The company for this TS, typed on its row. */}
                        {selected.has(s.id) && (
                          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                            <div className="lg:col-span-2">
                              <span className={label}>Company name</span>
                              <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.companies[s.id]?.name ?? ""} onChange={e => setCompany(s.id, "name", e.target.value.toUpperCase())} placeholder={c.name} className={field} />
                            </div>
                            <div>
                              <span className={label}>Director name</span>
                              <div className="flex gap-1.5">
                                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.companies[s.id]?.directorName ?? ""} onChange={e => setCompany(s.id, "directorName", e.target.value.toUpperCase().replace(/[^A-Z ]/g, ""))} placeholder="random game character" className={field} />
                                <button type="button" title="Pick a game character" onClick={() => setCompany(s.id, "directorName", randomDirector())} className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"><Shuffle size={14} /></button>
                              </div>
                            </div>
                            {isTrading(s.biz) ? (
                              <>
                                <div>
                                  <span className={label}>Business Trading Licence No <span className="text-red-400">*</span></span>
                                  <div className="flex gap-1.5">
                                    <input autoComplete="off" data-1p-ignore data-lpignore="true" value={c.licenceNo} onChange={e => setCompany(s.id, "licenceNo", e.target.value.toUpperCase().replace(/[^A-Z0-9/]/g, ""))} placeholder="made up when ticked" className={field} />
                                    <button type="button" title="Make a new made-up licence number" onClick={() => setCompany(s.id, "licenceNo", fakeLicence(s.biz === "TRADING_SABAH" ? "SABAH" : "SARAWAK"))} className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200"><Shuffle size={14} /></button>
                                  </div>
                                  <p className="mt-1 text-[11px] text-slate-500">Made up: Business Trading is the non-SSM route, so no real licence and no eSIM set-up are needed.</p>
                                </div>
                                <div>
                                  <label className="flex items-center gap-2 text-[11px] text-slate-400"><input type="checkbox" checked={!!c.includeTin} onChange={e => setIncludeTin(s.id, e.target.checked)} /> Include TIN on the Pre-Application (optional there)</label>
                                  {(
                                    <div className="mt-1 flex gap-1.5">
                                      <input readOnly value={c.appTin ?? ""} placeholder={companyList ? "no spent row with a TIN" : "drop the company Excel above"} className={field} />
                                      <button type="button" title="Pick another TIN from a spent Excel row" disabled={!companyList} onClick={() => setCompany(s.id, "appTin", tinFromUsedRow(companyList, isUsed))} className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40"><Shuffle size={14} /></button>
                                    </div>
                                  )}
                                  <p className="mt-1 text-[11px] text-slate-500">The Application always gets this TIN: it is required there ("This field is required", 12257_TS08, 2026-10-26). When ticked, the same TIN is also typed on the Pre-Application (it shows a "TIN is invalid" warning for a made-up licence; the run presses Next again). The TIN comes from an Excel row whose ROC / New ROC / TIN is already used, so no free company is touched.</p>
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="sm:col-span-2 lg:col-span-3">
                                  <span className={label}>Company from the Excel ({BIZ_LABEL[s.biz]})</span>
                                  {(() => {
                                    const type = LIST_TYPE[s.biz];
                                    const rows = type ? (companyList?.rows ?? []).filter(r => r.type === type) : [];
                                    const free = type ? freeRows(companyList, type, isUsed) : [];
                                    return (
                                      <div className="flex gap-1.5">
                                      <select value={rows.map(rowKey).find(k => k === rowKey({ roc: c.oldBrn, newRoc: c.newBrn, tin: c.tin })) ?? ""} onChange={e => pickCompany(s.id, e.target.value)} className={field}>
                                        <option value="">{companyList ? (rows.length ? `— ${free.length} free of ${rows.length} ${BIZ_LABEL[s.biz]} —` : `— no ${BIZ_LABEL[s.biz]} rows in the Excel —`) : "— drop the company Excel above —"}</option>
                                        {[...free, ...rows.filter(r => !free.includes(r))].map(r => <option key={rowKey(r)} value={rowKey(r)}>{isUsed(r) ? `✗ used${usedBy(r)?.scenario ? ` (${usedBy(r)!.scenario})` : ""}` : r.overall === "PASS" ? "✓ free" : "✗ in eAuto"} · {r.roc} · {r.newRoc} · {r.tin}</option>)}
                                      </select>
                                      <button type="button" title={free.length ? "Pick another free company at random" : s.biz === "LLP" ? "No free LLP in the Excel — make a new fake LLP" : "No free company of this type left"} disabled={!free.length && s.biz !== "LLP"} onClick={() => shuffleCompany(s.id, s.biz)} className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40"><Shuffle size={14} /></button>
                                      </div>
                                    );
                                  })()}
                                  {isFakeLlp(c.oldBrn) && <p className="mt-1 text-[11px] text-amber-400">Fake LLP (no real LLP in the Excel). eSIM is seeded with these numbers, so SSM passes. No TIN on the Pre-Application; the Application requires one, so it gets {c.appTin ? <b>{c.appTin}</b> : "(none found)"}, taken from an Excel row whose ROC / New ROC are already used.</p>}
                                </div>
                                <div>
                                  <span className={label}>Old BRN (with check letter) <span className="text-red-400">*</span></span>
                                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={c.oldBrn} onChange={e => setCompany(s.id, "oldBrn", e.target.value.toUpperCase())} placeholder="KT0307773-P" className={field} />
                                </div>
                                <div>
                                  <span className={label}>New BRN <span className="text-red-400">*</span></span>
                                  <input inputMode="numeric" autoComplete="off" data-1p-ignore data-lpignore="true" value={c.newBrn} onChange={e => setCompany(s.id, "newBrn", e.target.value.replace(/\D/g, ""))} placeholder="12 digits" className={field} />
                                </div>
                                <div>
                                  <span className={label}>TIN <span className="text-red-400">*</span></span>
                                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={c.tin} onChange={e => setCompany(s.id, "tin", e.target.value.toUpperCase())} className={field} />
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </Section>
            );
          })}
        </div>

        {running && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Running {selectedScenarios.length} case{selectedScenarios.length === 1 ? "" : "s"}…</div>}
        {res?.stopped && !queue && <p className="text-sm text-amber-400">Run stopped.</p>}

        {queue && queue.items.length > 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Queue · {queue.items.filter(i => i.status !== "pending" && i.status !== "running").length}/{queue.items.length} done</p>
            <div className="flex flex-wrap gap-1.5">
              {queue.items.map((it, i) => (
                <span key={i} title={it.title} className={clsx("inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
                  it.status === "passed" && "border-green-800 text-green-300", it.status === "failed" && "border-red-800 text-red-300", it.status === "running" && "border-indigo-700 text-indigo-300", it.status === "stopped" && "border-amber-800 text-amber-300", it.status === "pending" && "border-slate-700 text-slate-500")}>
                  {it.status === "running" ? <Loader2 size={10} className="animate-spin" /> : it.status === "passed" ? <CheckCircle2 size={10} /> : it.status === "failed" ? <XCircle size={10} /> : it.status === "stopped" ? <Square size={10} /> : null}
                  {tsNo(it)}
                </span>
              ))}
            </div>
            {queue.items.filter(i => i.res && !(i.res.result?.checks?.length)).map((i, k) => (
              <p key={k} className="mt-2 text-[11px] text-red-400">{tsNo(i)}: {i.res!.stopped ? "stopped" : i.res!.error ?? "no result — see the Detailed log"}</p>
            ))}
          </div>
        )}

        {orphaned && !res && (
          <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
            <AlertTriangle size={15} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="flex-1 text-xs text-amber-200 leading-relaxed">A run was still going when this browser reloaded, so the dashboard lost track of it. It may well have finished — check the terminal.</p>
          </div>
        )}

        {result && (
          <div className={clsx("rounded-xl border p-4", result.failed === 0 ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50")}>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-slate-200 flex-1">{result.passed}/{result.total} passed{result.failed ? `, ${result.failed} failed` : ""}</p>
              <EvidenceBulkDownload groups={currentGroups} selected={bulkPicked} busy={downloadingEvidence}
                onDownload={g => downloadGroups(g)} onClearSelection={() => setBulkPicked(new Set())} />
            </div>
          </div>
        )}

        {checks.length > 0 && (
          <button onClick={() => setEvidenceOpen(o => !o)} className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800/40 text-left">
            {evidenceOpen ? <ChevronDown size={13} className="text-slate-500 shrink-0" /> : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
            <Film size={12} className="text-slate-500" />
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">Run evidence · {checks.length} TS</span>
            <span className="text-[11px] text-slate-500">{checks.filter(c => c.status === "passed").length} passed · {checks.filter(c => c.status !== "passed" && c.status !== "skipped").length} failed</span>
            <span className="text-[11px] text-slate-600">{evidenceOpen ? "Hide" : "Show"}</span>
          </button>
        )}
        {evidenceOpen && checks.length > 0 && (
          <div className="space-y-4">
            {checks.map((c, i) => {
              const ev = (c.evidence ?? []).filter((e, idx, arr) => arr.findIndex(x => x.url === e.url) === idx);
              const det = c.details ?? [];
              const tl = c.tsLabel ?? res?.runLabel ?? "evidence";
              const cardRunId = c.runId ?? res?.runId;
              const fileOf = (e: EvidenceItem) => e.url.split("/").pop()!;
              const picked = ev.filter(e => selectedEvidence.has(e.url));
              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div role="button" tabIndex={0} onClick={() => toggleEvidenceCard(`ts:${i}`)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleEvidenceCard(`ts:${i}`); } }}
                    className={`flex flex-wrap items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-slate-800/40 ${!closedEvidence.has(`ts:${i}`) ? "border-b border-slate-800" : ""}`}>
                    {!closedEvidence.has(`ts:${i}`) ? <ChevronDown size={13} className="text-slate-500 shrink-0" /> : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
                    {ev.length > 0 && cardRunId && <EvidenceGroupCheckbox checked={bulkPicked.has(`cur:${cardRunId}|${i}`)} onChange={() => toggleBulk(`cur:${cardRunId}|${i}`)} />}
                    {c.status === "passed" ? <CheckCircle2 size={15} className="text-green-400 shrink-0" /> : c.status === "skipped" ? <AlertTriangle size={15} className="text-slate-500 shrink-0" /> : <XCircle size={15} className="text-red-400 shrink-0" />}
                    <p className="text-sm text-slate-200 font-medium flex-1 min-w-0">{c.title}</p>
                    <span className="text-[11px] text-slate-600 shrink-0">{Math.round(c.durationMs / 1000)}s</span>
                    {ev.length > 0 && cardRunId && (
                      <>
                        <button onClick={e => { e.stopPropagation(); downloadEvidence(picked.map(fileOf), { runId: cardRunId, runLabel: tl }); }} disabled={downloadingEvidence || !picked.length}
                          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 transition-colors"><Download size={11} />Selected ({picked.length})</button>
                        <button onClick={e => { e.stopPropagation(); downloadEvidence(ev.map(fileOf), { runId: cardRunId, runLabel: tl, zipName: `${tl}.zip` }); }} disabled={downloadingEvidence} title={`Download every file of ${tl} as ${tl}.zip`}
                          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors">
                          {downloadingEvidence ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}{tl} evidence
                        </button>
                      </>
                    )}
                  </div>
                  {!closedEvidence.has(`ts:${i}`) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-slate-800">
                    <div className="min-w-0">
                      {c.video && <div className="p-3 border-b border-slate-800"><video src={c.video} controls className="w-full rounded-lg border border-slate-800" /></div>}
                      {ev.length > 0 && (
                        <div className="divide-y divide-slate-800/70">
                          {ev.map(e => (
                            <div key={e.url} className="px-4 py-2 flex items-center gap-3">
                              <input type="checkbox" checked={selectedEvidence.has(e.url)} onChange={() => toggleEvidence(e.url)} className="accent-indigo-600 shrink-0" />
                              {e.kind === "video" ? <Film size={13} className="text-slate-500 shrink-0" /> : e.kind === "file" ? <FileSpreadsheet size={13} className="text-slate-500 shrink-0" /> : <ImageIcon size={13} className="text-slate-500 shrink-0" />}
                              <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                              <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors shrink-0"><Download size={11} />Download</a>
                            </div>
                          ))}
                        </div>
                      )}
                      {det.length > 0 && (
                        <div className="p-4 border-t border-slate-800">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><ClipboardList size={12} />Details</p>
                          <dl className="space-y-1.5">
                            {det.map((d, j) => <div key={j} className="flex items-baseline gap-3 text-xs"><dt className="text-slate-500 shrink-0 max-w-[45%]">{d.label}</dt><dd className="text-slate-200 font-mono break-all">{d.value}</dd></div>)}
                          </dl>
                        </div>
                      )}
                      {!c.video && !ev.length && !det.length && <p className="p-4 text-xs text-slate-600">No evidence captured for this TS.</p>}
                    </div>
                    <div className="p-4 min-w-0">
                      {c.friendlyError && <p className="mb-2 text-xs text-red-400/90">{c.friendlyError}</p>}
                      {c.steps.length > 0 ? <StepList steps={c.steps} /> : <p className="text-xs text-slate-600">No steps recorded.</p>}
                    </div>
                  </div>}
                </div>
              );
            })}
          </div>
        )}
        {evidenceError && <p className="text-[11px] text-red-400">{evidenceError}</p>}

        {(() => {
          const owned = new Set(checks.flatMap(c => (c.evidence ?? []).map(e => e.url)));
          const loose = evidence.filter(e => !owned.has(e.url));
          if (!loose.length && !(checks.length === 0 && details.length)) return null;
          return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1 flex items-center gap-1.5"><Film size={12} />Run evidence</p>
                {loose.length > 0 && <button onClick={() => downloadEvidence(loose.map(e => e.url.split("/").pop()!))} disabled={downloadingEvidence} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white transition-colors"><Download size={11} />All</button>}
              </div>
              {res?.video && checks.length === 0 && <div className="p-3 border-b border-slate-800"><video src={res.video} controls className="w-full rounded-lg border border-slate-800" /></div>}
              <div className="divide-y divide-slate-800/70">
                {loose.map(e => (
                  <div key={e.url} className="px-4 py-2 flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                    <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0"><Download size={11} />Download</a>
                  </div>
                ))}
              </div>
              {checks.length === 0 && details.length > 0 && (
                <dl className="p-4 space-y-1.5 border-t border-slate-800">
                  {details.map((d, j) => <div key={j} className="flex items-baseline gap-3 text-xs"><dt className="text-slate-500 shrink-0">{d.label}</dt><dd className="text-slate-200 font-mono break-all">{d.value}</dd></div>)}
                </dl>
              )}
            </div>
          );
        })()}

        <Section id="history" title={<>Past runs <span className="text-slate-600 normal-case tracking-normal">· evidence kept across runs</span></>} collapsed={collapsed.history !== false} onToggle={toggleHistorySection}
          extra={<button onClick={e => { e.stopPropagation(); loadHistory(); }} disabled={historyLoading} className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-300 disabled:opacity-50"><RefreshCw size={11} className={historyLoading ? "animate-spin" : ""} />Refresh</button>}>
          <div className="p-4">
            {historyError && <p className="flex items-start gap-1.5 text-xs text-red-400 mb-3"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{historyError}</p>}
            {historyLoading && !history.length && <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Loading past runs…</p>}
            {!historyLoading && historyLoaded && !history.length && <p className="text-xs text-slate-500">No past runs found yet.</p>}
            <EvidenceBulkDownload groups={historyGroups} selected={bulkPicked} busy={downloadingEvidence} className="mb-3"
              onDownload={g => downloadGroups(g)} onClearSelection={() => setBulkPicked(new Set())} />
            <div className="space-y-2">
              {history.map(h => {
                const isOpen = expandedHistoryRun === h.runId;
                const isCurrent = h.runId === res?.runId;
                return (
                  <div key={h.runId} className="border border-slate-800 rounded-lg overflow-hidden">
                    <div role="button" tabIndex={0} onClick={() => setExpandedHistoryRun(isOpen ? null : h.runId)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedHistoryRun(isOpen ? null : h.runId); } }}
                      className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800/40">
                      <EvidenceGroupCheckbox checked={bulkPicked.has(`hist:${h.runId}`)} onChange={() => toggleBulk(`hist:${h.runId}`)} />
                      {isOpen ? <ChevronDown size={13} className="text-slate-500 shrink-0" /> : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
                      <History size={13} className="text-slate-500 shrink-0" />
                      <span className="text-xs font-mono text-slate-300">{h.runLabel}</span>
                      {h.status === "passed" && <CheckCircle2 size={12} className="text-green-400 shrink-0" />}
                      {h.status === "failed" && <XCircle size={12} className="text-red-400 shrink-0" />}
                      {isCurrent && <span className="text-[10px] font-medium text-indigo-400 border border-indigo-800 rounded px-1.5 py-0.5">current</span>}
                      <span className="text-[11px] text-slate-600">{new Date(h.timestamp).toLocaleString()}</span>
                      <span className="text-[11px] text-slate-600">· {h.evidence.length} file{h.evidence.length === 1 ? "" : "s"}</span>
                      <div className="flex-1" />
                      <button onClick={e => { e.stopPropagation(); downloadEvidence(null, { runId: h.runId, runLabel: h.runLabel }); }} disabled={downloadingEvidence}
                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0"><Download size={11} />All</button>
                    </div>
                    {isOpen && (
                      <div className="border-t border-slate-800">
                        {groupByTs(h.evidence).map(([ts, items]) => (
                          <div key={ts} className="border-b border-slate-800/70 last:border-b-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30">
                              <span className="text-[11px] font-mono font-semibold text-slate-400 flex-1">{ts}</span>
                              <button onClick={() => downloadEvidence(items.map(e => e.url.split("/").pop()!), { runId: h.runId, runLabel: ts, zipName: `${ts}.zip` })} disabled={downloadingEvidence}
                                className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50 transition-colors"><Download size={11} />{ts} evidence</button>
                            </div>
                            {items.map(e => (
                              <div key={e.url} className="px-3 py-2 flex items-center gap-3">
                                {e.kind === "video" ? <Film size={12} className="text-slate-500 shrink-0" /> : e.kind === "file" ? <FileSpreadsheet size={12} className="text-slate-500 shrink-0" /> : <ImageIcon size={12} className="text-slate-500 shrink-0" />}
                                <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                                <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors shrink-0"><Download size={11} />Download</a>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {fullLog && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">Detailed log</p>
              <button onClick={copyLog} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors" title="Copy the full log">
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
