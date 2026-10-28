"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, Film, RefreshCw, Image as ImageIcon, Download, Copy, Check, ClipboardList, FileSpreadsheet, History, Receipt, Repeat, Lock, ShieldAlert, BookOpen, Trash2, Plus,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import EvidenceBulkDownload, { EvidenceGroupCheckbox, toEvidenceStatus, type EvidenceGroup, type EvidenceGroupStatus } from "@/components/EvidenceBulkDownload";
import NumericTextInput from "@/components/NumericTextInput";
import { useTsPassState, TS_PASS_ROW, TS_PASS_TITLE } from "@/lib/tsPassState";
import { DeploySoonHeader } from "@/lib/useDeployReminder";

/** Registry key for this page's run in AppShell's background-run store. */
const RUN_KEY = "eauto/12412";

// EAINT-12412 — [eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice
// Charge into JomCheck Service Charge and eAuto Service Charge (final line
// names per the re-uploaded SRD v1.0: "JomCheck report" RM18.00 + "JomCheck
// service charge" RM2.00, 8% SST each, total still RM21.60). Release S34.X,
// 20/21 Oct 2026 morning session. Workbook: _reference/tickets/EAINT-12412/
// EAINT-12412 - ....xlsx (12 TS, renumbered ascending 2026-10-19 — old→new
// map in the ticket's NOTES.md). Specs: scripts/eauto-jomcheck/tests/
// invoice-split-12412*.spec.ts, run through /api/eauto-12412 (own evidence
// folder, 35-minute per-TS limit).
//
// Same standard flow as app/eauto/jomcheck/page.tsx: setup utilities in
// their own box above the TS, one TS per run call (queued), one card per
// TS, per-TS evidence, past runs, detailed log. The running vehicle-no.
// counter is SHARED with the JomCheck (12339) page — both buy HXA####A
// vehicles on the same environments, so one counter avoids collisions.
//
// Automated: TS01, TS03, TS04, TS05, TS06, TS08, TS09, TS10, TS11 + the two
// pre-deployment data setups. Setups never feed a TS: they fill a test data
// pool (localStorage) and the person picks a record per TS (Faizuddin,
// 2026-10-15) — see DATA_KINDS. Manual: TS02 (Wholesale chatbot, by choice),
// TS07 (MyInvois), TS12's Insurance half (TS12 eSTM is automated).

const TS_SECTIONS = [
  { id: "tsA", letter: "A", title: "UCD — JomCheck Invoice & e-Invoice" },
  { id: "tsB", letter: "B", title: "BackOffice — JomCheck Invoice, e-Invoice & SST Report" },
  { id: "tsC", letter: "C", title: "LHDN — MyInvois" },
  { id: "tsD", letter: "D", title: "Existing transactions — approval date cut-off" },
  { id: "tsE", letter: "E", title: "Regression — e-Invoice listing & payment documents" },
] as const;
type SectionLetter = (typeof TS_SECTIONS)[number]["letter"];


// The "eAuto Account" BackOffice login (HubAdmin) — the one that can open the
// SST Payment Report (JomCheck) and the e-Invoice / Consolidated e-Invoice
// Listing. Its own fields on the TS06 / TS10 rows, not the shared BO login, so
// a bulk run keeps the BO login for the other TS (Faizuddin, 2026-10-19).
const EAUTO_ACCOUNT_INPUTS: NonNullable<Scenario["extraInputs"]> = [
  { key: "user", envVar: "JOMCHECK_12412_EAUTO_ACCOUNT_USERNAME", label: "eAuto Account username (BackOffice)", defaultValue: "eautoaccount" },
  { key: "pass", envVar: "JOMCHECK_12412_EAUTO_ACCOUNT_PASSWORD", label: "eAuto Account password", secret: true, defaultValue: "eAut0#2026!" },
];

interface Scenario {
  id: string;
  kind: "ts" | "setup";
  section?: SectionLetter;
  order: number;
  /** MUST match the spec's test() title exactly — the runner greps by it. */
  title: string;
  summary: string;
  /** Buys a new JomCheck — gets its own fresh vehicle no. off the running counter. */
  needsFreshVehicleNo?: boolean;
  vehicleEnvVar?: string;
  /** The person types or picks this vehicle no. (an existing transaction). */
  userVehicleNo?: { envVar: string; placeholder: string };
  /** Other values typed on the row when ticked (a login, a second vehicle
   *  no.). Stored with the row's picks; a blank required one blocks Run. */
  extraInputs?: { key: string; envVar: string; label: string; placeholder?: string; secret?: boolean; optional?: boolean; defaultValue?: string }[];
  /** Which kinds of test-data-pool records the picker beside this TS's
   *  vehicle field offers. The pick is the person's choice — nothing fills
   *  the field automatically (Faizuddin, 2026-10-15). */
  pickFrom?: DataKind[];
  /** A run that passes adds a record of this kind to the test data pool. */
  produces?: DataKind;
  /** Drives eSim (VPN) — the Run button asks for the VPN first. */
  needsEsim?: boolean;
  /** Manual-only row — rendered disabled. */
  notBuilt?: boolean;
  /** Deprioritised — automation kept, row blurred and not selectable. */
  deprio?: boolean;
  /** Selectors not yet confirmed from captured HTML. */
  unconfirmed?: boolean;
}

// ── Test data pool ──
// Faizuddin, 2026-10-15: "for every test data preparation, it will not
// automatically connect it to any TS. because i want to be able to make
// multiple test data, and use those test data into the related TS. so if the
// first run failed, i have multiple test data i can choose from to run it
// again". A setup run that passes adds one record here; a setup can be run
// several times in one go (count per setup). A TS never reads the pool by
// itself — the person picks a record (or types a vehicle no.) per TS.
type DataKind = "approved-before" | "failed-before" | "new-after";
const DATA_KINDS: { kind: DataKind; label: string; hint: string }[] = [
  { kind: "approved-before", label: "Approved, before deployment", hint: "SETUP_APPROVED — for TS08" },
  { kind: "failed-before", label: "Failed, before deployment", hint: "SETUP_FAILED — for TS09" },
  { kind: "new-after", label: "New purchase, after deployment", hint: "TS01 — for TS05, TS06, TS10, TS11" },
];
interface DataUse { ts: string; status: QueueStatus; at: number }
interface DataRecord {
  id: string;
  kind: DataKind;
  vehicleNo: string;
  transactionNo?: string;
  transactionId?: string;
  /** Base URL it was made on ("" = the script default, uat1). */
  env: string;
  createdAt: number;
  /** "12412_SETUP_APPROVED", "12412_TS01", or "manual". */
  source: string;
  uses: DataUse[];
}
const DATA_POOL_KEY = "eauto_12412_test_data_pool";
function loadDataPool(): DataRecord[] {
  try { const raw = localStorage.getItem(DATA_POOL_KEY); return raw ? (JSON.parse(raw) as DataRecord[]) : []; } catch { return []; }
}
function saveDataPool(pool: DataRecord[]) {
  try { localStorage.setItem(DATA_POOL_KEY, JSON.stringify(pool)); } catch { /* full */ }
}
const envLabel = (env: string) => env.trim() ? env.trim().replace(/^https?:\/\//, "") : "default (uat1)";

const SCENARIOS: Scenario[] = [
  { id: "setup_approved", kind: "setup", order: 1, title: "12412_SETUP_APPROVED: create an Approved JomCheck transaction (pre-deployment test data)", summary: "Buys a JomCheck on a fresh vehicle no. and saves its current 1-line Invoice and e-Invoice PDFs as the \"before\" copies. Each passed run adds one \"Approved, before deployment\" record to the test data pool.", needsFreshVehicleNo: true, vehicleEnvVar: "JOMCHECK_12412_SETUP_APPROVED_VEHICLE_NO", produces: "approved-before" },
  { id: "setup_failed", kind: "setup", order: 2, title: "12412_SETUP_FAILED: create a Failed JomCheck transaction (pre-deployment test data, eSim Result = Failed)", summary: "Sets eSim Report Result = Failed for the vehicle no.'s prefix, buys a JomCheck that pays but fails, confirms Payment OK / Tx Failed, then restores eSim. Each passed run adds one \"Failed, before deployment\" record to the pool. Needs the VPN.", needsFreshVehicleNo: true, vehicleEnvVar: "JOMCHECK_12412_SETUP_FAILED_VEHICLE_NO", needsEsim: true, produces: "failed-before" },

  { id: "ts01", kind: "ts", section: "A", order: 1, title: "12412_TS01: Verify a new JomCheck transaction from UCD shows the fee in 2 lines on the invoice and e-Invoice", summary: "UCD purchase on a fresh vehicle no. → price prompt still \"RM20.00 + 8% Service Tax\" → Invoice 2 lines (RM18.00 + RM1.44 = RM19.44, RM2.00 + RM0.16 = RM2.16, total RM21.60) → e-Invoice same 2 lines, code 022 on each line. A passed run adds a \"New purchase, after deployment\" record to the pool.", needsFreshVehicleNo: true, vehicleEnvVar: "JOMCHECK_12412_TS01_VEHICLE_NO", produces: "new-after" },
  { id: "ts02", kind: "ts", section: "A", order: 2, title: "12412_TS02: Verify a new JomCheck transaction from Wholesale shows the fee in 2 lines on the invoice and e-Invoice", summary: "Manual — Wholesale chatbot purchase.", notBuilt: true },
  { id: "ts03", kind: "ts", section: "A", order: 3, title: "12412_TS03: Verify a new JomCheck transaction by a UCD with an invalid TIN shows the fee in 2 lines on the invoice", summary: "Buys a JomCheck on a fresh vehicle no. as the UCD you type below (its company has an invalid TIN), checks the Invoice has the 2 lines and total RM21.60, then confirms no e-Invoice is generated (reloads until LHDN reports the failure, up to 10 minutes).", needsFreshVehicleNo: true, vehicleEnvVar: "JOMCHECK_12412_TS03_VEHICLE_NO", extraInputs: [
    { key: "user", envVar: "JOMCHECK_12412_TS03_UCD_USERNAME", label: "Invalid-TIN UCD username" },
    { key: "pass", envVar: "JOMCHECK_12412_TS03_UCD_PASSWORD", label: "Invalid-TIN UCD password", secret: true },
  ] },
  { id: "ts04", kind: "ts", section: "A", order: 4, title: "12412_TS04: Verify a paid JomCheck transaction that ends Failed shows the fee in 2 lines on the invoice", summary: "Sets eSim Report Result = Failed for the fresh vehicle no.'s prefix, buys a JomCheck that pays but fails, opens the Payment OK / Tx Failed transaction and checks its Invoice has the 2 lines. eSim is restored afterwards. Needs the VPN.", needsFreshVehicleNo: true, vehicleEnvVar: "JOMCHECK_12412_TS04_VEHICLE_NO", needsEsim: true },
  { id: "ts05", kind: "ts", section: "B", order: 5, title: "12412_TS05: Verify the BackOffice invoice and e-Invoice match the UCD copies for the same transaction", summary: "Pick a \"New purchase, after deployment\" record (or type a vehicle no.). Downloads the UCD Invoice / e-Invoice, opens the same transaction in BackOffice, downloads both again and compares document code, payment reference, line items and amounts; code 022 on each e-Invoice line.", userVehicleNo: { envVar: "JOMCHECK_12412_TS05_VEHICLE_NO", placeholder: "pick or type a vehicle no." }, pickFrom: ["new-after"] },
  { id: "ts06", kind: "ts", section: "B", order: 6, title: "12412_TS06: Verify the SST Payment Report shows the same amounts for the new transaction", summary: "Pick a \"New purchase, after deployment\" record. BackOffice: reads its transaction no. and date from the JomCheck Transaction Enquiry, opens Reports > SST Payment Report (JomCheck), filters by that date and transaction no., Generate → 1 row: Amount 20.00, Total Service Tax 1.60, Total 21.60, EAUTO 6.00, SST 0.48, ezAUTO Asia 14.00; Grand Total the same. Logs in to BackOffice with the eAuto Account fields on this row.", extraInputs: EAUTO_ACCOUNT_INPUTS, userVehicleNo: { envVar: "JOMCHECK_12412_TS06_VEHICLE_NO", placeholder: "pick or type a vehicle no." }, pickFrom: ["new-after"] },
  { id: "ts07", kind: "ts", section: "C", order: 7, title: "12412_TS07: Verify the e-Invoice submitted to LHDN carries the 2 lines", summary: "Manual — MyInvois sandbox: 2 line items, total RM21.60, code 022 on both. No login known.", notBuilt: true },
  { id: "ts08", kind: "ts", section: "D", order: 8, title: "12412_TS08: Verify an existing approved JomCheck transaction keeps the single-line invoice and e-Invoice", summary: "Pick an \"Approved, before deployment\" record (or type a vehicle no.). After the push: UCD Invoice / e-Invoice still 1 line \"JomCheck service charge\" RM20.00 + RM1.60 = RM21.60; BackOffice copies identical. MyInvois is checked by hand (UIN and Submission Date are printed).", userVehicleNo: { envVar: "JOMCHECK_12412_TS08_VEHICLE_NO", placeholder: "pick or type a vehicle no." }, pickFrom: ["approved-before"] },
  { id: "ts09", kind: "ts", section: "D", order: 9, title: "12412_TS09: Verify an existing failed JomCheck transaction resubmitted from BackOffice gets the 2-line invoice and e-Invoice", summary: "Pick a \"Failed, before deployment\" record (or type a vehicle no.). After the push: BackOffice Transaction Enquiry → Resubmit on the Failed row → search until Approved (Action shows View only) → View → Invoice / e-Invoice 2 lines → UCD copies identical. A record resubmitted successfully is no longer Failed. 19 Oct run: Invoice still 1 line — EAINT-12554. Deprioritised (Faizuddin, 2026-10-20).", deprio: true, userVehicleNo: { envVar: "JOMCHECK_12412_TS09_VEHICLE_NO", placeholder: "pick or type a vehicle no." }, pickFrom: ["failed-before"] },
  { id: "ts10", kind: "ts", section: "E", order: 10, title: "12412_TS10: Verify the finance reports still show one row per JomCheck transaction with the same totals", summary: "Pick a \"New purchase, after deployment\" record. BackOffice e-Invoice / Consolidated e-Invoice Listing (company + JomCheck + payment date): 1 row for the vehicle, 20.00 / 1.60 / 21.60. Then UCD Reports > Payment Breakdown Report (JomCheck, same date) → PDF: 1 row for the transaction no., eAuto 20.00 + Service Tax 1.60. BackOffice part uses the eAuto Account fields on this row.", extraInputs: EAUTO_ACCOUNT_INPUTS, userVehicleNo: { envVar: "JOMCHECK_12412_TS10_VEHICLE_NO", placeholder: "pick or type a vehicle no." }, pickFrom: ["new-after"] },
  { id: "ts11", kind: "ts", section: "E", order: 11, title: "12412_TS11: Verify the Download Payment Document zip carries the 2-line invoice and e-Invoice", summary: "Pick a \"New purchase, after deployment\" record. UCD Reports > Download Payment Document (month / year of the transaction, JomCheck) → Download its week → in the zip, its Invoice and e-Invoice PDFs both show the 2 lines, code 022 on each e-Invoice line. Past weeks only: skipped while the week is still open.", userVehicleNo: { envVar: "JOMCHECK_12412_TS11_VEHICLE_NO", placeholder: "pick or type a vehicle no." }, pickFrom: ["new-after"] },
  { id: "ts12", kind: "ts", section: "E", order: 12, title: "12412_TS12: Verify invoices of other products keep their current layout", summary: "New eSTM through the MyKad emulator (start it at http://localhost:7878 first): Buyer and Seller Authentication use the card below, buyer email and mobile are random, eLKM and eVOC ticked, payment, Done. Then Invoice and e-Invoice: eSTM 35.00 + 2.80 = 37.80, eLKM 2.75 + 0.22 = 2.97, eVOC 10.00 + 0.80 = 10.80, one line per document as on the 28 Sep samples, code 022 on the e-Invoice. Insurance (Invoice / Receipt only) stays manual.", extraInputs: [
    { key: "vehicle", envVar: "JOMCHECK_12412_TS12_VEHICLE_NO", label: "eSTM vehicle no. (in the UCD's stock)", placeholder: "e.g. HX0001EX" },
    { key: "nric", envVar: "JOMCHECK_12412_TS12_MYKAD_NRIC", label: "MyKad NRIC (login user)", defaultValue: "030217-14-1005" },
    { key: "name", envVar: "JOMCHECK_12412_TS12_MYKAD_NAME", label: "MyKad name (login user)", defaultValue: "MUHAMMAD FAIZUDDIN BIN BIDI" },
  ] },
];

const TS_SCENARIOS = SCENARIOS.filter(s => s.kind === "ts").sort((a, b) => a.order - b.order);
const BUILT_TS_SCENARIOS = TS_SCENARIOS.filter(s => !s.notBuilt);
const DEPRIO_TS_COUNT = TS_SCENARIOS.filter(s => s.deprio).length;
/** Manual or deprioritised — the row cannot be ticked. */
const isOff = (s: Scenario) => !!(s.notBuilt || s.deprio);
const TS_BY_SECTION = TS_SECTIONS.map(sec => ({ ...sec, scenarios: TS_SCENARIOS.filter(s => s.section === sec.letter) }));
const SETUP_SCENARIOS = SCENARIOS.filter(s => s.kind === "setup").sort((a, b) => a.order - b.order);

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
    const key = e.label.match(/^\d+_(?:TS\d+(?:_TS\d+)*|SETUP_[A-Z]+)/)?.[0] ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));
}

// ── Run queue — one TS per run call, exactly like 9306 / jomcheck ──
type QueueStatus = "pending" | "running" | "passed" | "failed" | "stopped";
interface QueueItem {
  id: string; title: string; record: boolean; status: QueueStatus; res?: RunResponse;
  /** This item's own env vars (its fresh vehicle no., its picked vehicle no.)
   *  — merged over the shared body, so N runs of one setup each get their own. */
  env?: Record<string, string>;
  /** A passed run adds a test-data-pool record of this kind. */
  produces?: DataKind;
  /** The pool record this TS run used, to log the use against it. */
  usesVehicleNo?: string;
}
interface QueueState { items: QueueItem[]; currentIndex: number; active: boolean; body: Record<string, unknown> }
const QUEUE_STATE_KEY = "eauto_12412_queue_state";
function loadQueueState(): QueueState | null {
  try { const raw = localStorage.getItem(QUEUE_STATE_KEY); return raw ? (JSON.parse(raw) as QueueState) : null; } catch { return null; }
}
function saveQueueState(state: QueueState | null) {
  try { if (state) localStorage.setItem(QUEUE_STATE_KEY, JSON.stringify(state)); else localStorage.removeItem(QUEUE_STATE_KEY); } catch { /* full */ }
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";
const tsLabel = (s: Scenario) => s.title.slice(6, s.title.indexOf(":"));

function UsedBy({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
      {scenarios.map(s => <span key={s.id} className="px-1.5 py-px rounded border border-sky-800 bg-sky-950/50 text-[10px] font-semibold text-sky-300">{tsLabel(s)}</span>)}
    </span>
  );
}

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

// ── Persisted form state ──
const CREDS_KEY = "eauto_12412_creds";
interface Creds { baseUrl: string; username: string; password: string; ucdUsername: string; ucdPassword: string }
// UCD defaults as given by Faizuddin (2026-10-01) — mirrors
// scripts/eauto-jomcheck/data/users.ts; kept in sync by hand.
const DEFAULT_CREDS: Creds = { baseUrl: "", username: "", password: "", ucdUsername: "faizuddin", ucdPassword: "password" };
function loadCreds(): Creds {
  try { const raw = localStorage.getItem(CREDS_KEY); if (raw) {
    // A field saved blank falls back to its default, so a browser that stored
    // empty BO fields before the default existed still gets it.
    const saved = JSON.parse(raw) as Partial<Creds>;
    const filled = Object.fromEntries(Object.entries(saved).filter(([k, v]) => k === "baseUrl" || (typeof v === "string" && v.trim())));
    return { ...DEFAULT_CREDS, ...filled };
  } } catch { /* ignore */ }
  return DEFAULT_CREDS;
}

// v2: rows renumbered 2026-10-19 — picks saved under the old ids would land
// on the wrong TS, so the ticks / picks start clean (the data pool is kept).
const UI_STATE_KEY = "eauto_12412_ui_state_v2";
interface UiState { selected: string[]; headless: boolean; detailed: boolean; collapsed: Record<string, boolean>; autoAdvanceVehicleNo: boolean; userVehicleNos: Record<string, string>; setupCounts: Record<string, number> }
const DEFAULT_UI_STATE: UiState = { selected: [], headless: true, detailed: true, collapsed: {}, autoAdvanceVehicleNo: true, userVehicleNos: {}, setupCounts: {} };
const MAX_SETUP_COUNT = 10;
function loadUiState(): UiState {
  try { const raw = localStorage.getItem(UI_STATE_KEY); if (raw) return { ...DEFAULT_UI_STATE, ...JSON.parse(raw) }; } catch { /* ignore */ }
  return DEFAULT_UI_STATE;
}

// ── Running vehicle-no. counter — SHARED with app/eauto/jomcheck/page.tsx
// (same key), same HXA####A format. ──
const VN_COUNTER_KEY = "eauto_jomcheck_vn_counter";
const formatVehicleNo = (n: number) => `HXA${String(n).padStart(4, "0")}A`;
function loadVnCounter(): number {
  const raw = typeof window !== "undefined" ? localStorage.getItem(VN_COUNTER_KEY) : null;
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function Ticket12412Page() {
  // TS rows tinted from the TS Tracker: light green = passed in automation, darker = passed by hand.
  const passState = useTsPassState();
  const savedUi = typeof window !== "undefined" ? loadUiState() : DEFAULT_UI_STATE;
  const VALID_SCENARIO_IDS = new Set(SCENARIOS.filter(s => !isOff(s)).map(s => s.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(savedUi.selected.filter(id => VALID_SCENARIO_IDS.has(id))));
  const [headless, setHeadless] = useState(savedUi.headless);
  const [detailed, setDetailed] = useState(savedUi.detailed);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(savedUi.collapsed);
  const [autoAdvanceVehicleNo, setAutoAdvanceVehicleNo] = useState(savedUi.autoAdvanceVehicleNo);
  const [userVehicleNos, setUserVehicleNos] = useState<Record<string, string>>(savedUi.userVehicleNos ?? {});
  // How many records each setup makes per Run (1-10).
  const [setupCounts, setSetupCounts] = useState<Record<string, number>>(savedUi.setupCounts ?? {});
  const countOf = (id: string) => Math.min(MAX_SETUP_COUNT, Math.max(1, setupCounts[id] ?? 1));
  const [dataPool, setDataPool] = useState<DataRecord[]>(() => (typeof window !== "undefined" ? loadDataPool() : []));
  function updatePool(fn: (prev: DataRecord[]) => DataRecord[]) {
    setDataPool(prev => { const next = fn(prev); saveDataPool(next); return next; });
  }
  const [manualKind, setManualKind] = useState<DataKind>("approved-before");
  const [manualVehicleNo, setManualVehicleNo] = useState("");
  const [copiedRecord, setCopiedRecord] = useState<string | null>(null);
  async function copyText(id: string, text: string) {
    let ok = false;
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch { ok = false; }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    if (ok) { setCopiedRecord(id); setTimeout(() => setCopiedRecord(null), 1500); }
  }
  function toggleSection(id: string) { setCollapsed(prev => ({ ...prev, [id]: !prev[id] })); }
  // TS section boxes start COLLAPSED (undefined) — flip against `false`.
  function toggleTsSection(id: string) { setCollapsed(prev => ({ ...prev, [id]: prev[id] === false })); }
  const isTsSectionCollapsed = (id: string) => collapsed[id] !== false;

  const [creds, setCreds] = useState<Creds>(typeof window !== "undefined" ? loadCreds() : DEFAULT_CREDS);
  const set = (k: keyof Creds, v: string) => setCreds(p => ({ ...p, [k]: v }));

  // Lazy initialisers (same pattern as `creds` above) instead of a mount
  // effect that calls setState — react-hooks/set-state-in-effect.
  const [vnCounter, setVnCounter] = useState<number>(() => loadVnCounter());
  const [freshVehicleNo, setFreshVehicleNo] = useState(() => formatVehicleNo(loadVnCounter()));
  function regenerateVehicleNo() { const n = loadVnCounter(); setVnCounter(n); setFreshVehicleNo(formatVehicleNo(n)); }
  function advanceVehicleNoCounter(steps = 1) {
    const next = vnCounter + steps;
    localStorage.setItem(VN_COUNTER_KEY, String(next));
    setVnCounter(next);
    setFreshVehicleNo(formatVehicleNo(next));
  }

  const [formError, setFormError] = useState("");
  const [vpnAsk, setVpnAsk] = useState(false);
  const [stopAsk, setStopAsk] = useState(false);
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
      const r = await fetch("/api/eauto-12412/history");
      if (!r.ok) throw new Error(`Failed to load past runs (${r.status})`);
      const data = await r.json() as { runs: HistoryRun[] };
      setHistory(data.runs); setHistoryLoaded(true);
    } catch (e) { setHistoryError(e instanceof Error ? e.message : "Failed to load past runs."); }
    finally { setHistoryLoading(false); }
  }

  useEffect(() => {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({ selected: Array.from(selected), headless, detailed, collapsed, autoAdvanceVehicleNo, userVehicleNos, setupCounts }));
  }, [selected, headless, detailed, collapsed, autoAdvanceVehicleNo, userVehicleNos, setupCounts]);

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
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-12412/run",
      stopUrl: "/api/eauto-12412/run",
      meta: { queueIndex: index, scenarios: [item.id] },
      body: {
        ...q.body,
        vehicleEnvVars: { ...((q.body.vehicleEnvVars as Record<string, string> | undefined) ?? {}), ...(item.env ?? {}) },
        scenarios: [item.title], record: item.record,
      },
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
    const items = prev.items.slice();
    if (items[idx]) {
      const failed = !!data.error || !data.result || data.result.failed > 0 || data.result.total === 0;
      const status: QueueStatus = data.stopped ? "stopped" : failed ? "failed" : "passed";
      items[idx] = { ...items[idx], res: data, status };
      recordDataOutcome(items[idx], data, status, (prev.body.baseUrl as string | undefined) ?? "");
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

  /** Pool bookkeeping for one finished queue item: a passed producer adds a
   *  record (vehicle no. / transaction no. / id read from its DETAIL lines);
   *  a TS that ran on a picked vehicle no. logs the use on that record. */
  function recordDataOutcome(item: QueueItem, data: RunResponse, status: QueueStatus, env: string) {
    const det = data.details ?? [];
    const val = (label: string) => det.find(d => d.label === label)?.value?.trim() || undefined;
    if (item.produces && status === "passed") {
      const vehicleNo = val("Vehicle No.") ?? Object.values(item.env ?? {})[0];
      if (vehicleNo) {
        const rec: DataRecord = {
          id: `${Date.now()}-${vehicleNo}`, kind: item.produces, vehicleNo,
          transactionNo: val("Transaction No."), transactionId: val("Transaction ID"),
          env, createdAt: Date.now(), source: item.title.split(":")[0], uses: [],
        };
        updatePool(prev => [rec, ...prev.filter(r => !(r.vehicleNo === vehicleNo && r.kind === rec.kind))]);
      }
    }
    if (item.usesVehicleNo && (status === "passed" || status === "failed")) {
      const ts = item.title.split(":")[0];
      updatePool(prev => prev.map(r => r.vehicleNo === item.usesVehicleNo ? { ...r, uses: [...r.uses, { ts, status, at: Date.now() }] } : r));
    }
  }

  useEffect(() => {
    if (historyLoaded && res?.runId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res?.runId]);

  const selectedScenarios = SCENARIOS.filter(s => selected.has(s.id));
  const freshVehicleScenarios = selectedScenarios.filter(s => s.needsFreshVehicleNo && s.vehicleEnvVar);
  const needsFreshVehicleNo = freshVehicleScenarios.length > 0;
  const userVehicleScenarios = selectedScenarios.filter(s => s.userVehicleNo).sort((a, b) => a.order - b.order);
  const needsEsim = selectedScenarios.some(s => s.needsEsim);
  const esimPrefix = freshVehicleNo.trim().toUpperCase().slice(0, 2);

  function toggle(id: string) {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function run() {
    if (!selected.size) { setFormError("Select at least one test case."); return; }
    const missing: string[] = [];
    if (!creds.username.trim()) missing.push("BO username");
    if (!creds.password.trim()) missing.push("BO password");
    if (!creds.ucdUsername.trim()) missing.push("UCD username");
    if (!creds.ucdPassword.trim()) missing.push("UCD password");
    if (needsFreshVehicleNo && !freshVehicleNo.trim()) missing.push("Fresh vehicle no.");
    for (const s of userVehicleScenarios) if (!(userVehicleNos[s.id] ?? "").trim()) missing.push(`test data for ${tsLabel(s)} (choose it on the ${tsLabel(s)} row)`);
    for (const s of selectedScenarios) for (const x of s.extraInputs ?? []) if (!x.optional && !(userVehicleNos[`${s.id}:${x.key}`] ?? x.defaultValue ?? "").trim()) missing.push(`${x.label} (on the ${tsLabel(s)} row)`);
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    if (needsEsim && esimPrefix.length < 2) { setFormError("The eSim setup needs a vehicle no. of at least 2 characters — its first 2 are the eSim prefix."); return; }
    setFormError("");

    // One queue item per run: a setup with count N becomes N items. Every
    // item that buys gets its OWN consecutive vehicle no. off the shared
    // counter (auto-advance on); off = the literal field value, which only
    // makes sense for a single run.
    if (!autoAdvanceVehicleNo && selectedScenarios.some(s => s.kind === "setup" && countOf(s.id) > 1)) {
      setFormError("A setup count above 1 needs auto-advance ON — each record needs its own vehicle no.");
      return;
    }
    const fixedVehicleNo = freshVehicleNo.trim().toUpperCase();
    let vnOffset = 0;
    const ordered = [...selectedScenarios].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "setup" ? -1 : 1) || a.order - b.order);
    const items: QueueItem[] = [];
    for (const sc of ordered) {
      const copies = sc.kind === "setup" ? countOf(sc.id) : 1;
      for (let n = 0; n < copies; n++) {
        const env: Record<string, string> = {};
        if (sc.needsFreshVehicleNo && sc.vehicleEnvVar) {
          env[sc.vehicleEnvVar] = autoAdvanceVehicleNo ? formatVehicleNo(vnCounter + vnOffset) : fixedVehicleNo;
          vnOffset++;
        }
        const picked = sc.userVehicleNo ? (userVehicleNos[sc.id] ?? "").trim().toUpperCase() : "";
        if (sc.userVehicleNo) env[sc.userVehicleNo.envVar] = picked;
        for (const x of sc.extraInputs ?? []) { const v = (userVehicleNos[`${sc.id}:${x.key}`] ?? x.defaultValue ?? "").trim(); if (v) env[x.envVar] = x.secret || x.key === "user" ? v : v.toUpperCase(); }
        items.push({
          id: copies > 1 ? `${sc.id}#${n + 1}` : sc.id, title: sc.title, record: sc.kind !== "setup",
          status: items.length === 0 ? "running" : "pending", env, produces: sc.produces,
          usesVehicleNo: picked || undefined,
        });
      }
    }

    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    const q: QueueState = { items, currentIndex: 0, active: true, body: { ...creds, vehicleEnvVars: {}, headless, detailed } };
    setQueue(q);
    saveQueueState(q);
    setSelectedEvidence(new Set());
    runQueueIndex(q, 0);
    if (autoAdvanceVehicleNo && vnOffset > 0) advanceVehicleNoCounter(vnOffset);
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
      const r = await fetch("/api/eauto-12412/download-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, runLabel, ...(files ? { files } : {}) }) });
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

  /** The test-data picker shown INSIDE a ticked TS row (standing rule
   *  2026-10-15: choose the data when selecting the scenario). Pool records
   *  of the kinds this TS accepts, newest first, plus a free-text field.
   *  Nothing is preselected; Run refuses while it is empty. */
  function renderPoolPicker(s: Scenario) {
    const options = dataPool.filter(r => s.pickFrom?.includes(r.kind));
    const current = userVehicleNos[s.id] ?? "";
    const chosen = options.find(r => r.vehicleNo === current);
    const otherEnv = chosen && envLabel(chosen.env) !== envLabel(creds.baseUrl);
    const kinds = (s.pickFrom ?? []).map(k => DATA_KINDS.find(d => d.kind === k)?.label ?? k).join(" / ");
    return (
      <div className="mt-2 rounded-lg border border-sky-900/60 bg-sky-950/20 p-2.5">
        <p className="text-[11px] text-sky-300 mb-1.5">Test data for {tsLabel(s)} <span className="text-red-400">*</span> <span className="text-slate-500">— {kinds}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-2">
          <select
            value={chosen ? chosen.vehicleNo : ""}
            onChange={e => { if (e.target.value) setUserVehicleNos(prev => ({ ...prev, [s.id]: e.target.value })); }}
            className={field}
            title="Pick a record from the test data pool, or type a vehicle no."
          >
            <option value="">{options.length ? `Pick from pool (${options.length})…` : "Pool is empty — run a setup or type a vehicle no."}</option>
            {options.map(r => {
              const lastUse = r.uses[r.uses.length - 1];
              return (
                <option key={r.id} value={r.vehicleNo}>
                  {r.vehicleNo}{r.transactionNo ? ` · ${r.transactionNo}` : ""} · {envLabel(r.env)} · {new Date(r.createdAt).toLocaleDateString()}{lastUse ? ` · last: ${lastUse.ts.replace(/^\d+_/, "")} ${lastUse.status}` : " · unused"}
                </option>
              );
            })}
          </select>
          <input value={current} onChange={e => setUserVehicleNos(prev => ({ ...prev, [s.id]: e.target.value.toUpperCase() }))} placeholder="or type a vehicle no." className={field} />
        </div>
        {otherEnv && <p className="mt-1 text-[11px] text-amber-400">Made on {envLabel(chosen!.env)}, not the environment in Run configuration.</p>}
        {!current.trim() && <p className="mt-1 text-[11px] text-slate-500">Choose a record before running.</p>}
      </div>
    );
  }

  const rowTitle = (s: Scenario) =>
    s.notBuilt ? "Manual — see the summary for why." : s.deprio ? "Deprioritised — not run for now." : s.unconfirmed ? "What the page shows after clicking Resubmit is not captured yet — the run logs every prompt it answers." : undefined;

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <Receipt size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">12412</h1>
        <DeploySoonHeader keys={["EAINT-12412"]} />
        <span className="text-xs text-slate-600 hidden md:block">JomCheck invoice / e-Invoice split into RM18.00 + RM2.00 (UCD & BackOffice) — release S34.X 20/21 Oct, morning session</span>
      </header>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Plain-language guide — Faizuddin, 2026-10-15: "put a simple
            explanation into the dashboard, so i can read it there". Open by
            default; collapse state persists with the rest of the UI state. */}
        <Section id="guide" title={<span className="flex items-center gap-1.5"><BookOpen size={12} />How this works</span>} collapsed={!!collapsed.guide} onToggle={toggleSection}>
          <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-4 text-xs text-slate-300 leading-relaxed">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300 mb-1.5">What the CR changes</p>
              <p>The JomCheck invoice and e-Invoice used to show one line. They now show two lines. The total stays the same.</p>
              <div className="mt-2 rounded-lg border border-slate-800 overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead className="bg-slate-800/60 text-slate-400"><tr><th className="text-left px-2 py-1">Line</th><th className="text-right px-2 py-1">Price</th><th className="text-right px-2 py-1">SST 8%</th><th className="text-right px-2 py-1">Total</th></tr></thead>
                  <tbody className="font-mono">
                    <tr className="border-t border-slate-800"><td className="px-2 py-1 font-sans">JomCheck report</td><td className="text-right px-2">18.00</td><td className="text-right px-2">1.44</td><td className="text-right px-2">19.44</td></tr>
                    <tr className="border-t border-slate-800"><td className="px-2 py-1 font-sans">JomCheck service charge</td><td className="text-right px-2">2.00</td><td className="text-right px-2">0.16</td><td className="text-right px-2">2.16</td></tr>
                    <tr className="border-t border-slate-800 text-slate-200"><td className="px-2 py-1 font-sans font-semibold">Total</td><td className="text-right px-2">20.00</td><td className="text-right px-2">1.60</td><td className="text-right px-2">21.60</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2">Both e-Invoice lines use classification code 022. The screen price, purchase price and revenue split do not change.</p>
              <p className="mt-2">Only transactions <span className="font-semibold text-slate-100">approved after deployment</span> get the 2 lines. Older ones keep 1 line.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300 mb-1.5">What to do, in order</p>
              <ol className="list-decimal pl-4 space-y-1.5">
                <li>Type the environment URL in Run configuration.</li>
                <li><span className="font-semibold text-slate-100">Before dev pushes the code</span>, run both setups. Set &quot;How many&quot; to make several at once. SETUP_APPROVED makes Approved transactions. SETUP_FAILED makes Failed ones and needs the VPN.</li>
                <li>Each passed setup adds a record to the Test data pool. Setups never feed a TS by themselves.</li>
                <li>After the push, run TS01. It buys a new JomCheck, checks the 2 lines, and adds its vehicle no. to the pool.</li>
                <li>Tick TS05, TS06, TS08, TS09, TS10 or TS11 and choose its record right on that row. TS05, TS06, TS10 and TS11 take a TS01 purchase. TS08 takes an Approved record. TS09 takes a Failed record.</li>
                <li>TS03 needs the login of a UCD with an invalid TIN. TS04 makes its own Failed transaction through eSim (VPN on). Type them on the row.</li>
                <li>If a TS fails, pick another unused record and run it again. The pool shows which TS used each record and the result.</li>
              </ol>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300 mb-1.5">Why the setups come first</p>
              <p>The 1-line and 2-line result depends on when a transaction is approved. Data approved before the push cannot be made after it. Miss this window and TS08 and TS09 cannot be tested.</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-300 mb-1.5">Timing</p>
              <p>A run can take up to about 15 minutes. Payment can take 5 minutes. The e-Invoice button only appears after LHDN approves it, which can take up to 10 minutes.</p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-indigo-300 mb-1.5">Evidence</p>
              <p>Every Invoice and e-Invoice is saved as a PDF, plus a picture of it named &quot;…-checked&quot;. Green boxes mark what is correct. Red boxes mark what is wrong, or the row where an expected value is missing. The caption lists both.</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-300 mb-1.5">Do by hand</p>
              <ol className="list-decimal pl-4 space-y-1">
                <li>TS02: Wholesale chatbot purchase.</li>
                <li>TS07: MyInvois check. TS08 and TS09 print the e-Invoice number to look up.</li>
                <li>TS11 after the week of the purchase has ended (the run skips until then).</li>
                <li>TS12: the Insurance Invoice / Receipt (Insurance has no e-Invoice). The eSTM half is automated.</li>
              </ol>
              <p className="mt-2 text-[11px] text-slate-500">Confirmed: the Invoice and e-Invoice buttons download the PDF directly (15 Oct). Resubmit asks &quot;Sure to resubmit?&quot; then shows &quot;Succesfully resubmit.&quot; (19 Oct).</p>
              <p className="mt-2 text-[11px] text-slate-500">TS numbers changed on 19 Oct (old TS03 → TS05, TS06 → TS08, TS07 → TS09). Past runs keep their old names.</p>
            </div>
          </div>
        </Section>

        <Section id="config" title="Run configuration" collapsed={!!collapsed.config} onToggle={toggleSection}>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={label}>Environment base URL</label>
                <input value={creds.baseUrl} onChange={e => set("baseUrl", e.target.value)} placeholder="https://staging.eauto.my/uat1 (default)" className={field} />
                <p className="mt-1 text-[11px] text-slate-500">Environment to be confirmed — type the staging path dev pushes to.</p>
              </div>
              <div><label className={label}>BO user <span className="text-red-400">*</span></label>
                <input value={creds.username} onChange={e => set("username", e.target.value)} className={field} /></div>
              <div><label className={label}>BO password <span className="text-red-400">*</span></label>
                <input type="password" value={creds.password} onChange={e => set("password", e.target.value)} className={field} /></div>
              <div><label className={label}>UCD user (purchase) <span className="text-red-400">*</span></label>
                <div className="flex gap-1.5">
                  <input value={creds.ucdUsername} onChange={e => set("ucdUsername", e.target.value)} className={field} />
                  <input type="password" value={creds.ucdPassword} onChange={e => set("ucdPassword", e.target.value)} className={field} title="UCD password" />
                </div>
              </div>
              {needsFreshVehicleNo && (
                <div>
                  <label className={label}>Fresh vehicle no. <span className="text-red-400">*</span><UsedBy scenarios={freshVehicleScenarios} /></label>
                  <div className="flex gap-1.5">
                    <input value={freshVehicleNo} onChange={e => setFreshVehicleNo(e.target.value.toUpperCase())} className={field} />
                    {autoAdvanceVehicleNo && (
                      <button type="button" onClick={regenerateVehicleNo} title="Reload the next running number" className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600"><RefreshCw size={14} /></button>
                    )}
                    <button type="button" onClick={() => setAutoAdvanceVehicleNo(v => !v)}
                      title={autoAdvanceVehicleNo ? "Auto-advance is ON — click to keep this exact value across runs" : "Auto-advance is OFF — this value stays fixed. Click to turn auto-advance back on"}
                      className={clsx("shrink-0 px-2.5 rounded-lg border transition-colors", autoAdvanceVehicleNo ? "border-indigo-700 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-950/60" : "border-amber-700 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50")}>
                      {autoAdvanceVehicleNo ? <Repeat size={14} /> : <Lock size={14} />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {!autoAdvanceVehicleNo
                      ? "Fixed — this exact value is used for every selected scenario and never changes."
                      : freshVehicleScenarios.length > 1
                        ? `Auto-advances after every run — ${freshVehicleScenarios.map(tsLabel).join(" and ")} each get their own consecutive vehicle no. starting here. Counter shared with the 12339 page.`
                        : "Auto-advances after every run (counter shared with the 12339 page) — edit only to override."}
                  </p>
                  {needsEsim && <p className="mt-1 text-[11px] text-amber-400">Requires the VPN. {selectedScenarios.filter(s => s.needsEsim).map(tsLabel).join(" and ")} {selectedScenarios.filter(s => s.needsEsim).length > 1 ? "set" : "sets"} eSim Report Result = Failed on prefix &quot;{esimPrefix}&quot; (first 2 characters of this vehicle no.), then {selectedScenarios.filter(s => s.needsEsim).length > 1 ? "restore" : "restores"} it.</p>}
                </div>
              )}
            </div>

            {/* Read-only mirror — the record is CHOSEN on the TS row itself
                (Faizuddin, 2026-10-15: "user should be able to choose which
                data they want when select the scenario"). */}
            {userVehicleScenarios.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-sky-400">Chosen test data</span>
                {userVehicleScenarios.map(s => {
                  const v = (userVehicleNos[s.id] ?? "").trim();
                  return (
                    <span key={s.id} className={clsx("px-2 py-0.5 rounded border text-[11px] font-mono", v ? "border-sky-800 text-sky-200" : "border-red-800 text-red-300")}>
                      {tsLabel(s)} → {v || "not chosen"}
                    </span>
                  );
                })}
                <span className="text-[11px] text-slate-500">— change it on the scenario row below.</span>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)} className="accent-indigo-600" />Headless
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-400" title="Slows the run down and highlights each button/field/value being acted on or checked.">
                <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} className="accent-indigo-600" />Detailed (slow + highlighted)
              </label>
              <div className="flex-1" />
              {vpnAsk && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setVpnAsk(false)}>
                  <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-300"><ShieldAlert size={16} />Is your VPN connected?</p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setVpnAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">Not yet — cancel</button>
                      <button onClick={() => { setVpnAsk(false); run(); }} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Confirmed VPN Connected</button>
                    </div>
                  </div>
                </div>
              )}
              {stopAsk && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setStopAsk(false)}>
                  <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-red-300"><AlertTriangle size={16} />Stop this run?</p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">A stopped SETUP_FAILED gets no eSim restore step — check the log for its <span className="font-mono text-slate-300">[esim] … snapshot:</span> line and put the Result back by hand.</p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setStopAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">No — keep running</button>
                      <button onClick={() => { setStopAsk(false); stop(); }} className="flex-1 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600">Yes — stop the run</button>
                    </div>
                  </div>
                </div>
              )}
              {!running ? (
                <button onClick={() => (needsEsim ? setVpnAsk(true) : run())} disabled={!selectedScenarios.length} className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
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

        <Section id="setup" title={<>Test data setup <span className="text-slate-600 normal-case tracking-normal">· run BEFORE the dev push · not a TS · no recording</span></>} collapsed={!!collapsed.setup} onToggle={toggleSection}
          extra={
            <>
              <button onClick={() => setSelected(prev => new Set([...prev, ...SETUP_SCENARIOS.map(s => s.id)]))} className="text-xs text-indigo-400 hover:text-indigo-300">Select all</button>
              <button onClick={() => setSelected(prev => { const next = new Set(prev); SETUP_SCENARIOS.forEach(s => next.delete(s.id)); return next; })} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
            </>
          }
          footer={<div className="px-4 py-3 border-t border-slate-800"><p className="text-[11px] text-slate-500 leading-snug">SRD REQ-001: the breakdown applies by approval date and time, so this data must exist before the code lands. Setups are not tied to any TS: each passed run adds one record to the test data pool below, and you pick which record each TS uses. Make several so a failed TS run can be retried on a fresh record.</p></div>}
        >
          {SETUP_SCENARIOS.map(s => (
            <div key={s.id} title={passState(s.title) ? TS_PASS_TITLE[passState(s.title)!] : undefined} className={clsx("flex gap-3 px-4 py-2.5", passState(s.title) ? TS_PASS_ROW[passState(s.title)!] : clsx("hover:bg-slate-800/40", s.needsEsim && "bg-violet-950/20 hover:bg-violet-950/30"))}>
              <input id={`chk-${s.id}`} type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="mt-1 accent-indigo-600 shrink-0 cursor-pointer" />
              <label htmlFor={`chk-${s.id}`} className="min-w-0 flex-1 cursor-pointer">
                <span className={clsx("text-sm font-mono", s.needsEsim ? "text-violet-300" : "text-slate-300")}>{s.title.split(":")[0]}</span>
                {s.needsEsim && <span className="ml-2 text-[10px] font-medium text-violet-400">eSim · VPN</span>}
                <p className="text-xs text-slate-400 mt-0.5">{s.summary}</p>
              </label>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <span className="text-[10px] uppercase tracking-wide text-slate-500">How many</span>
                <NumericTextInput min={1} max={MAX_SETUP_COUNT} value={countOf(s.id)} aria-label={`How many ${tsLabel(s)} records`}
                  onChange={n => setSetupCounts(prev => ({ ...prev, [s.id]: n }))}
                  className="w-16 px-2 py-1 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 text-center focus:outline-none focus:ring-2 focus:ring-indigo-600" />
              </div>
            </div>
          ))}
        </Section>

        <Section id="pool" title={<>Test data pool <span className="text-slate-600 normal-case tracking-normal">· {dataPool.length} record{dataPool.length === 1 ? "" : "s"} · chosen on each TS row when you tick it</span></>} collapsed={!!collapsed.pool} onToggle={toggleSection}
          footer={<div className="px-4 py-3 border-t border-slate-800"><p className="text-[11px] text-slate-500 leading-snug">Records are kept in this browser. Each TS run on a record is logged against it. A record TS09 resubmitted is no longer Failed — remove it once it has been used.</p></div>}
        >
          <div className="p-4 space-y-4">
            {DATA_KINDS.map(dk => {
              const rows = dataPool.filter(r => r.kind === dk.kind);
              return (
                <div key={dk.kind}>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-400 mb-1.5">{dk.label} <span className="normal-case font-normal tracking-normal text-slate-500">— {dk.hint} · {rows.length}</span></p>
                  {rows.length === 0 ? (
                    <p className="text-xs text-slate-600">None yet.</p>
                  ) : (
                    <div className="rounded-lg border border-slate-800 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-800/50 text-slate-500 text-[11px]">
                          <tr><th className="text-left px-3 py-1.5">Vehicle no.</th><th className="text-left px-3">Transaction no.</th><th className="text-left px-3">Environment</th><th className="text-left px-3">Created</th><th className="text-left px-3">Used by</th><th className="px-3" /></tr>
                        </thead>
                        <tbody>
                          {rows.map(r => (
                            <tr key={r.id} className="border-t border-slate-800">
                              <td className="px-3 py-1.5 font-mono text-slate-200">{r.vehicleNo}</td>
                              <td className="px-3 font-mono text-slate-400">{r.transactionNo ?? "-"}</td>
                              <td className={clsx("px-3", envLabel(r.env) !== envLabel(creds.baseUrl) ? "text-amber-400" : "text-slate-400")}>{envLabel(r.env)}</td>
                              <td className="px-3 text-slate-500 whitespace-nowrap">{new Date(r.createdAt).toLocaleString()}<span className="text-slate-600"> · {r.source.replace(/^\d+_/, "")}</span></td>
                              <td className="px-3">
                                {r.uses.length === 0 ? <span className="text-slate-600">unused</span> : (
                                  <span className="flex flex-wrap gap-1">
                                    {r.uses.map((u, j) => (
                                      <span key={j} title={new Date(u.at).toLocaleString()} className={clsx("px-1.5 py-px rounded border text-[10px] font-mono", u.status === "passed" ? "border-green-800 text-green-300" : "border-red-800 text-red-300")}>{u.ts.replace(/^\d+_/, "")} {u.status}</span>
                                    ))}
                                  </span>
                                )}
                              </td>
                              <td className="px-3 whitespace-nowrap text-right">
                                <button onClick={() => copyText(r.id, r.vehicleNo)} title="Copy vehicle no." className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 mr-3">
                                  {copiedRecord === r.id ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}Copy
                                </button>
                                <button onClick={() => updatePool(prev => prev.filter(x => x.id !== r.id))} title="Remove from the pool (does not touch the transaction)" className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-300">
                                  <Trash2 size={11} />Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex flex-wrap items-end gap-2 pt-3 border-t border-slate-800">
              <div>
                <label className={label}>Add a record by hand</label>
                <select value={manualKind} onChange={e => setManualKind(e.target.value as DataKind)} className={clsx(field, "w-64")}>
                  {DATA_KINDS.map(dk => <option key={dk.kind} value={dk.kind}>{dk.label}</option>)}
                </select>
              </div>
              <input value={manualVehicleNo} onChange={e => setManualVehicleNo(e.target.value.toUpperCase())} placeholder="vehicle no." className={clsx(field, "w-40")} />
              <button
                onClick={() => {
                  const v = manualVehicleNo.trim();
                  if (!v) return;
                  updatePool(prev => [{ id: `${Date.now()}-${v}`, kind: manualKind, vehicleNo: v, env: creds.baseUrl, createdAt: Date.now(), source: "manual", uses: [] }, ...prev]);
                  setManualVehicleNo("");
                }}
                disabled={!manualVehicleNo.trim()}
                className="flex items-center gap-1.5 px-3 py-2 text-xs bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-700 disabled:opacity-50"
              >
                <Plus size={12} />Add
              </button>
            </div>
          </div>
        </Section>

        <div className="space-y-2">
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Test scenarios</span>
            <span className="text-xs text-slate-600">{BUILT_TS_SCENARIOS.length} automated · {TS_SCENARIOS.length - BUILT_TS_SCENARIOS.length} manual{DEPRIO_TS_COUNT > 0 && <> · {DEPRIO_TS_COUNT} deprioritised</>} · {TS_SECTIONS.length} sections</span>
            <div className="flex-1" />
            <button onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, false])) }))} className="text-xs text-indigo-400 hover:text-indigo-300">Expand all</button>
            <button onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, true])) }))} className="text-xs text-slate-500 hover:text-slate-300">Collapse all</button>
            <button onClick={() => setSelected(prev => { const next = new Set(prev); TS_SCENARIOS.forEach(s => next.delete(s.id)); return next; })} className="text-xs text-slate-500 hover:text-slate-300">Clear selection</button>
          </div>

          {TS_BY_SECTION.map(sec => {
            const built = sec.scenarios.filter(s => !s.notBuilt);
            const selectedHere = sec.scenarios.filter(s => selected.has(s.id)).length;
            return (
              <Section key={sec.id} id={sec.id}
                title={<><span className="text-slate-400">{sec.letter}.</span> {sec.title} <span className="text-slate-600 normal-case tracking-normal">· {built.length}/{sec.scenarios.length} automated{selectedHere > 0 && <span className="text-indigo-400"> · {selectedHere} selected</span>}</span></>}
                collapsed={isTsSectionCollapsed(sec.id)} onToggle={toggleTsSection}
                extra={built.length > 0 ? (
                  <>
                    <button onClick={() => setSelected(prev => new Set([...prev, ...built.filter(s => !s.deprio).map(s => s.id)]))} className="text-xs text-indigo-400 hover:text-indigo-300">Select all</button>
                    <button onClick={() => setSelected(prev => { const next = new Set(prev); sec.scenarios.forEach(s => next.delete(s.id)); return next; })} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                  </>
                ) : undefined}
              >
                {sec.scenarios.map(s => {
                  const isSelected = selected.has(s.id);
                  // A <div>, not a <label>: the row holds its own picker
                  // controls, which must not toggle the checkbox when used.
                  return (
                    <div key={s.id} title={rowTitle(s)}
                      className={clsx("flex gap-3 px-4 py-2.5", s.deprio ? "opacity-40 blur-[1.5px] select-none" : s.notBuilt ? "opacity-50" : "hover:bg-slate-800/40", !isOff(s) && s.unconfirmed && "bg-amber-950/20 hover:bg-amber-950/30", !isOff(s) && s.needsEsim && "bg-violet-950/20 hover:bg-violet-950/30")}>
                      <input id={`chk-${s.id}`} type="checkbox" checked={isSelected} onChange={() => toggle(s.id)} disabled={isOff(s)} className="mt-1 accent-indigo-600 shrink-0 cursor-pointer disabled:cursor-not-allowed" />
                      <div className="min-w-0 flex-1">
                        <label htmlFor={`chk-${s.id}`} className={clsx("block", isOff(s) ? "cursor-not-allowed" : "cursor-pointer")}>
                          <span className={clsx("text-sm font-mono", isOff(s) ? "text-slate-500" : s.unconfirmed ? "text-amber-300" : "text-slate-300")}>{s.title.split(":")[0]}</span>
                          {s.notBuilt && <span className="ml-2 text-[10px] font-medium text-slate-500">Manual</span>}
                          {s.deprio && <span className="ml-2 text-[10px] font-medium text-slate-500">Deprioritised</span>}
                          {!isOff(s) && s.unconfirmed && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400"><AlertTriangle size={10} />Selectors unconfirmed</span>}
                          {s.needsEsim && !isOff(s) && <span className="ml-2 text-[10px] font-medium text-violet-400">eSim · VPN</span>}
                          {(s.userVehicleNo || s.extraInputs) && !isOff(s) && <span className="ml-2 text-[10px] font-medium text-sky-400">{s.userVehicleNo ? "uses test data" : "needs inputs"}</span>}
                          <p className="text-xs text-slate-400 mt-0.5">{s.title.slice(s.title.indexOf(":") + 2)}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{s.summary}</p>
                        </label>
                        {isSelected && s.userVehicleNo && renderPoolPicker(s)}
                        {isSelected && s.extraInputs && (
                          <div className="mt-2 rounded-lg border border-sky-900/60 bg-sky-950/20 p-2.5 grid grid-cols-1 md:grid-cols-2 gap-2">
                            {s.extraInputs.map(x => (
                              <label key={x.key} className="block min-w-0">
                                <span className="text-[11px] text-sky-300">{x.label}{!x.optional && <span className="text-red-400"> *</span>}</span>
                                <input
                                  type={x.secret ? "password" : "text"}
                                  value={userVehicleNos[`${s.id}:${x.key}`] ?? x.defaultValue ?? ""}
                                  onChange={e => setUserVehicleNos(prev => ({ ...prev, [`${s.id}:${x.key}`]: e.target.value }))}
                                  placeholder={x.placeholder}
                                  className={clsx(field, "mt-1")}
                                />
                              </label>
                            ))}
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
                  {it.id.toUpperCase()}
                </span>
              ))}
            </div>
            {queue.items.filter(i => i.res && !(i.res.result?.checks?.length)).map((i, k) => (
              <p key={k} className="mt-2 text-[11px] text-red-400">{i.id.toUpperCase()}: {i.res!.stopped ? "stopped" : i.res!.error ?? "no result — see the Detailed log"}</p>
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
