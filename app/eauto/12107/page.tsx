"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, Film, RefreshCw, Image as ImageIcon, Download, Copy, Check, ClipboardList, FileSpreadsheet, History, Wallet, Repeat, Lock,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import EvidenceBulkDownload, { EvidenceGroupCheckbox, toEvidenceStatus, type EvidenceGroup, type EvidenceGroupStatus } from "@/components/EvidenceBulkDownload";
import { useTsPassState, TS_PASS_ROW, TS_PASS_TITLE } from "@/lib/tsPassState";
import { DeploySoonHeader } from "@/lib/useDeployReminder";

/** Registry key for this page's run in AppShell's background-run store. */
const RUN_KEY = "eauto/12107";

// EAINT-12107 — [Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay
// and GrabPay, + EAINT-12327 — [CIBO] To Enhance Payment Mode Column Format
// in Transaction Listing and Payment Report. Tested together for release
// S34.X (May Chin Mei Theng, eAuto QAs, 2026-10-15); the combined workbook
// is the execution copy: _reference/tickets/EAINT-12107/EAINT-12107 +
// EAINT-12327 - Combined TS - ...xlsx. Specs: scripts/eauto-12107/tests.
//
// Same standard flow as app/eauto/jomcheck/page.tsx (queue of one TS per run
// call, one card per TS, per-TS evidence, past runs, detailed log). No eSim /
// VPN here — Secarang's Fiuu sandbox needs neither.
//
// Automated: the Secarang leg of 12107_TS01 (GrabPay Full Amount OK), TS02
// (ShopeePay OK, via the QR link) and TS07/TS08 (card / FPX regression). Everything on CIBO —
// 12107_TS03-TS06 and all of 12327 — is manual: no CIBO page objects or
// captured HTML exist, so those rows render disabled.

const TS_SECTIONS = [
  { id: "tsA", letter: "A", title: "Secarang — GrabPay / ShopeePay E2E (12107)" },
  { id: "tsB", letter: "B", title: "CIBO — patched payment methods and filter (12107)" },
  { id: "tsC", letter: "C", title: "Regression — existing payment methods (12107)" },
  { id: "tsD", letter: "D", title: "CIBO — Payment Mode column format (12327)" },
] as const;
type SectionLetter = (typeof TS_SECTIONS)[number]["letter"];


interface Scenario {
  id: string;
  section: SectionLetter;
  order: number;
  /** MUST match the spec's test() title exactly — the runner greps by it. */
  title: string;
  summary: string;
  /** Private-car (vehicle no. + IC) or company-car (vehicle no. + SSM) data. */
  owner?: "private" | "company";
  /** Env var carrying this TS's own vehicle no. / insurer override. */
  vehicleEnvVar?: string;
  insurerEnvVar?: string;
  insurerDefault?: string;
  needsBank?: boolean;
  /** Pays on the Fiuu card form — needs a test card. */
  needsCard?: boolean;
  /** Manual-only row — rendered disabled. */
  notBuilt?: boolean;
  /** Runs on CIBO (tests/cibo.spec.ts) — needs the CIBO login and refs. */
  cibo?: boolean;
  /** Selectors not yet confirmed from captured HTML. */
  unconfirmed?: boolean;
}

const SCENARIOS: Scenario[] = [
  { id: "ts01", section: "A", order: 1, title: "12107_TS01: Successful Pay With Grab (Full Amount) — private car, Lonpac", summary: "Private car → Lonpac → add-ons → confirm → GrabPay, Full Amount → Fiuu popup Status = Success → Pay. Checks the success page, premium vs confirmation page, Payment Method text, receipt PDF.", owner: "private", vehicleEnvVar: "SECARANG_TS01_VEHICLE_NO", insurerEnvVar: "SECARANG_TS01_INSURER", insurerDefault: "Lonpac", unconfirmed: true },
  { id: "ts02", section: "A", order: 2, title: "12107_TS02: Successful Pay With ShopeePay — private car, Lonpac", summary: "Private car → Lonpac → add-ons → confirm → ShopeePay (SPayLater tile) → Fiuu QR code → the QR link opens the ShopeePay simulator → Status = Success → PROCEED TO PAY. Checks the success page, premium vs confirmation page, Payment Method text, receipt PDF.", owner: "private", vehicleEnvVar: "SECARANG_TS02_VEHICLE_NO", insurerEnvVar: "SECARANG_TS02_INSURER", insurerDefault: "Lonpac" },
  // TS v3 (20_10_26): TS03 / TS04 are the failed GrabPay / ShopeePay payments;
  // the ShopeePay / SPayLater dev-patch TS were dropped (Faizuddin, 2026-10-20).
  { id: "ts03", section: "A", order: 3, title: "12107_TS03: Failed Pay With Grab (Full Amount) — private car, Lonpac", summary: "Private car → Lonpac → GrabPay, Full Amount → Fiuu popup Status = Failed → Pay. Checks the failed / unsuccessful message, no success page, no receipt, back on Select Payment Method with methods selectable.", owner: "private", vehicleEnvVar: "SECARANG_TS03_VEHICLE_NO", insurerEnvVar: "SECARANG_TS03_INSURER", insurerDefault: "Lonpac" },
  { id: "ts04", section: "A", order: 4, title: "12107_TS04: Failed Pay With ShopeePay — private car, Lonpac", summary: "Private car → Lonpac → ShopeePay (SPayLater tile) → Fiuu QR code → ShopeePay simulator Status = Failed → PROCEED TO PAY. Checks the failed / unsuccessful message, no success page, no receipt, back on Select Payment Method with methods selectable.", owner: "private", vehicleEnvVar: "SECARANG_TS04_VEHICLE_NO", insurerEnvVar: "SECARANG_TS04_INSURER", insurerDefault: "Lonpac" },
  { id: "ts09", section: "A", order: 9, title: "12107_TS09: Cancelled Pay With Grab (Full Amount) — private car, Lonpac", summary: "Private car → Lonpac → GrabPay, Full Amount → Fiuu GrabPay page → cancel. Checks back on Select Payment Method, the quotation (vehicle + premium) is kept, another method can be selected, no receipt.", owner: "private", vehicleEnvVar: "SECARANG_TS09_VEHICLE_NO", insurerEnvVar: "SECARANG_TS09_INSURER", insurerDefault: "Lonpac" },
  { id: "ts10", section: "A", order: 10, title: "12107_TS10: Cancelled Pay With ShopeePay — private car, Lonpac", summary: "Private car → Lonpac → ShopeePay (SPayLater tile) → Fiuu QR page → [Cancel the transaction]. Checks back on Select Payment Method, the quotation (vehicle + premium) is kept, another method can be selected.", owner: "private", vehicleEnvVar: "SECARANG_TS10_VEHICLE_NO", insurerEnvVar: "SECARANG_TS10_INSURER", insurerDefault: "Lonpac" },
  { id: "ts05", section: "B", order: 5, title: "12107_TS05: CIBO display different payment method", summary: "Dev-patched PayLater by Grab transaction (Instalment; ref from the \"PayLater by Grab (12107_TS05 patch)\" box, or found on CIBO): Transaction Management (insurance created, amount Paid) → Transaction Details (Payment Method Fiuu eWallet - GrabPay Paid, amount, Payment Ref ID with EW) → Payment Management filtered to GrabPay - PayLater by Grab (listed, Paid, Fiuu eWallet GrabPay, EW) → Payment Report (Fiuu | eWallet – GrabPay – BNPL – Installment, amount, EW).", cibo: true },
  { id: "ts06", section: "B", order: 6, title: "12107_TS06: CIBO Payment Channel filter", summary: "CIBO Payment Management: tick GrabPay / PayLater by Grab / ShopeePay one at a time → Search → listing + export show only that channel, Payment Ref ID contains EW; no separate SPayLater option (shows as ShopeePay); then the Fiuu - eWallet group tick / untick.", cibo: true },
  { id: "ts07", section: "C", order: 7, title: "12107_TS07: Payment method = Credit or Debit Card — private car, Lonpac", summary: "Private car → Lonpac → Credit or Debit Card → Fiuu card popup Status = Success → Pay → success page + receipt.", owner: "private", vehicleEnvVar: "SECARANG_TS07_VEHICLE_NO", insurerEnvVar: "SECARANG_TS07_INSURER", insurerDefault: "Lonpac", needsCard: true },
  { id: "ts08", section: "C", order: 8, title: "12107_TS08: Payment method = FPX (RHB) — private car, Lonpac", summary: "Private car → Lonpac → FPX → RHB → Fiuu FPX simulator (login, status 00, TAC, OTP, Pay Now) → success page + receipt.", owner: "private", vehicleEnvVar: "SECARANG_TS08_VEHICLE_NO", insurerEnvVar: "SECARANG_TS08_INSURER", insurerDefault: "Lonpac", needsBank: true },
  { id: "x01", section: "D", order: 11, title: "12327_TS11: New Payment Mode column in Transaction Listing", summary: "Transaction Listing: Payment Mode sits between Payment and Discount Code, value format \"<gateway> | <method> – <details>\", other columns unchanged. Uses the GrabPay ref.", cibo: true },
  { id: "x02", section: "D", order: 12, title: "12327_TS12: Payment Mode value per payment method (7 strings)", summary: "Searches each ref and compares Payment Mode with the 7 strings in the TS. A blank ref is found on CIBO by the run; a type with no transaction is logged as not found.", cibo: true },
  { id: "x03", section: "D", order: 13, title: "12327_TS13: Transaction with no payment shows \"-\"", summary: "Searches the no-payment ref; Payment Mode = \"-\".", cibo: true },
  { id: "x04", section: "D", order: 14, title: "12327_TS14: Transaction Listing export", summary: "Exports each ref from Transaction Management; the CSV Payment Mode matches the listing; the no-payment row shows \"-\".", cibo: true },
  { id: "x05", section: "D", order: 15, title: "12327_TS15: Payment Report Payment Mode format", summary: "Payment Report on the default one-month window: column position, no bare \"BoldPay\" / \"Fiuu\", each ref in the new format.", cibo: true },
  { id: "x06", section: "D", order: 16, title: "12327_TS16: Payment Report export", summary: "Exports each ref from Payment Report; the file's Payment Mode matches the page.", cibo: true },
  { id: "x07", section: "D", order: 17, title: "12327_TS17: Same value on all 4 pages", summary: "GrabPay ref: same string on Transaction Listing, its export, Payment Report and its export.", cibo: true },
  { id: "x08", section: "D", order: 18, title: "12327_TS18: Existing transactions show the new format", summary: "Existing (pre-push) ref shows the new format on Transaction Listing and Payment Report.", cibo: true },
  { id: "x09", section: "D", order: 19, title: "12327_TS19: Payment Mode for eAuto (RHB) and Secarang before cutoff (RMS) transactions", summary: "An eAuto (RHB) and a pre-cutoff Secarang (RMS) transaction, both found on CIBO by the run: a Payment Mode value is shown and is the same on Transaction Listing, its export, Payment Report and its export.", cibo: true },
];

const TS_SCENARIOS = [...SCENARIOS].sort((a, b) => a.order - b.order);
const BUILT_TS_SCENARIOS = TS_SCENARIOS.filter(s => !s.notBuilt);
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

// ── Run queue — one TS per run call, exactly like 9306 / jomcheck ──
type QueueStatus = "pending" | "running" | "passed" | "failed" | "stopped";
interface QueueItem { id: string; title: string; record: boolean; status: QueueStatus; res?: RunResponse }
interface QueueState { items: QueueItem[]; currentIndex: number; active: boolean; body: Record<string, unknown> }
const QUEUE_STATE_KEY = "eauto_12107_queue_state";
/** Queue chip label: the TS number from the title ("12327_TS11"), not the
 *  internal scenario id ("x01") — Faizuddin, 2026-10-20. */
const tsNo = (it: { id: string; title: string }) => /^\s*(\d+_TS\d+)/.exec(it.title)?.[1] ?? it.id.toUpperCase();
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
const CREDS_KEY = "eauto_12107_creds";
const AUTOFILL_RESET_KEY = "eauto_12107_autofill_reset";
interface Creds {
  baseUrl: string; sitePassword: string;
  vehicleNo: string; icNumber: string; postcode: string;
  companyVehicleNo: string; companySsm: string;
  bankValue: string; bankName: string; bankUsername: string; bankPassword: string;
  cardNumber: string; cardExpiry: string; cardCvv: string;
  ownerName: string; ownerEmail: string; ownerPhone: string;
  addr1: string; addr2: string; addr3: string;
  insurers: Record<string, string>;
  ciboLoginId: string; ciboPassword: string;
  ciboRefGrabPay: string; ciboRefShopeePay: string; ciboRefSPayLater: string; ciboRefGrabPayLater: string;
  ciboRefBoldPayTng: string; ciboRefFiuuFpx: string; ciboRefBoldPayCard: string;
  ciboRefNoPayment: string; ciboRefExisting: string;
}
// Malaysian addresses for the Secarang owner form — one is picked at random
// when the address boxes are blank (Faizuddin, 2026-10-19: "address line
// 1/2/3 - any random malaysian address"). All in the 55000 Kuala Lumpur area
// to sit with the default postcode.
const SAMPLE_ADDRESSES: [string, string, string][] = [
  ["No. 12, Jalan Bukit Bintang", "Bukit Bintang", "Kuala Lumpur"],
  ["No. 8, Jalan Pudu Lama", "Pudu", "Kuala Lumpur"],
  ["No. 27, Jalan Imbi", "Bukit Bintang", "Kuala Lumpur"],
  ["No. 5, Jalan Hang Tuah", "Bukit Bintang", "Kuala Lumpur"],
  ["No. 33, Jalan Tun Razak", "Kampung Pandan", "Kuala Lumpur"],
  ["No. 19, Jalan Kampung Pandan", "Taman Maluri", "Kuala Lumpur"],
];
function randomAddress(): [string, string, string] {
  return SAMPLE_ADDRESSES[Math.floor(Math.random() * SAMPLE_ADDRESSES.length)];
}

// Defaults the form starts with (Faizuddin, 2026-10-19): the Secarang
// staging /ia link and site password (same password on /ia and /preprod),
// postcode 55000, a random Malaysian address, and the CIBO staging login. A saved blank
// value falls back to these too (see loadCreds). The script's own
// data/users.ts has no fallbacks — every value arrives from this form.
const DEFAULT_CREDS: Creds = {
  baseUrl: "https://staging.secarang.com/ia/car-insurance", sitePassword: "eAuTo<2025#",
  // Owner IC: Faizuddin, 2026-10-19. The vehicle no. comes from the running
  // counter below, not from here.
  vehicleNo: "", icNumber: "030217141005", postcode: "55000",
  companyVehicleNo: "", companySsm: "",
  // RHB is named in 12107_TS08; every other value is typed by the tester.
  // FPX simulator login: Faizuddin, 2026-10-19.
  bankValue: "", bankName: "RHB", bankUsername: "Gaara", bankPassword: "Letmepaywithsand",
  // Fiuu sandbox test card. Faizuddin, 2026-10-20, gave 4111111111111111
  // (12/26, CVV 111), Master 5200 0000 0000 1096 and VISA 4456 5300 0000 1096
  // (any expiry). Live the same day the Fiuu card form rejected 4111… with
  // "P10: Sorry, Your Credit Card Number or CVV or expiration date is not
  // valid"; VISA and Master both passed (3D Secure OTP page, receipts
  // 26102021300019 / 26102021300022). Default = Master (his choice).
  cardNumber: "5200000000001096", cardExpiry: "12/26", cardCvv: "111",
  // Owner details: Faizuddin, 2026-10-19.
  ownerName: "MUHAMMAD FAIZUDDIN BIN BIDI", ownerEmail: "faizuddin@modefair.com", ownerPhone: "0189812839",
  addr1: "", addr2: "", addr3: "",
  insurers: {},
  // CIBO staging login. The "BR…" ref boxes start blank: a blank ref means
  // the automation finds a matching transaction on CIBO itself.
  ciboLoginId: "testadmin", ciboPassword: "eAuTo<2025#",
  ciboRefGrabPay: "", ciboRefShopeePay: "", ciboRefSPayLater: "", ciboRefGrabPayLater: "",
  ciboRefBoldPayTng: "", ciboRefFiuuFpx: "", ciboRefBoldPayCard: "",
  ciboRefNoPayment: "", ciboRefExisting: "",
};
/** Fields that take their default again when saved blank. */
const REFILL_WHEN_BLANK = ["baseUrl", "sitePassword", "icNumber", "postcode", "ownerName", "ownerEmail", "ownerPhone", "bankUsername", "bankPassword", "cardNumber", "cardExpiry", "cardCvv", "ciboLoginId", "ciboPassword"] as const;
function loadCreds(): Creds {
  let c: Creds = DEFAULT_CREDS;
  try { const raw = localStorage.getItem(CREDS_KEY); if (raw) c = { ...DEFAULT_CREDS, ...JSON.parse(raw) }; } catch { /* ignore */ }
  for (const k of REFILL_WHEN_BLANK) if (!c[k].trim()) c = { ...c, [k]: DEFAULT_CREDS[k] };
  // Chrome's password manager used to fill a saved login into Base URL + Site
  // password (2026-10-19). A base URL that isn't a link is such a fill; and
  // values saved before the autofill fix are reset to the defaults once.
  if (!/^https?:\/\//i.test(c.baseUrl.trim())) c = { ...c, baseUrl: DEFAULT_CREDS.baseUrl };
  // The first FPX simulator default was saved in lower case (2026-10-19).
  if (c.bankPassword === "letmepaywithsand") c = { ...c, bankPassword: DEFAULT_CREDS.bankPassword };
  // The first card default was "next December" (12/27); Faizuddin's card is 12/26 (2026-10-20).
  if (c.cardExpiry === "12/27") c = { ...c, cardExpiry: DEFAULT_CREDS.cardExpiry };
  // 4111… is rejected (P10); the default is the Master card (Faizuddin, 2026-10-20: "update that in the dashboard to use 5200 0000 0000 1096").
  // Once only, so the VISA card can still be typed back in later.
  try {
    if (!localStorage.getItem("eauto_12107_card_master_v1")) {
      if (["4111111111111111", "4456530000001096"].includes(c.cardNumber)) c = { ...c, cardNumber: DEFAULT_CREDS.cardNumber };
      localStorage.setItem("eauto_12107_card_master_v1", "1");
    }
  } catch { /* ignore */ }
  if (c.cardNumber === "4111111111111111") c = { ...c, cardNumber: DEFAULT_CREDS.cardNumber };
  try {
    if (!localStorage.getItem(AUTOFILL_RESET_KEY)) {
      for (const k of REFILL_WHEN_BLANK) if (k !== "postcode") c = { ...c, [k]: DEFAULT_CREDS[k] };
      localStorage.setItem(CREDS_KEY, JSON.stringify(c));
      localStorage.setItem(AUTOFILL_RESET_KEY, "1");
    }
  } catch { /* ignore */ }
  if (!c.addr1.trim() && !c.addr2.trim() && !c.addr3.trim()) {
    const [addr1, addr2, addr3] = randomAddress();
    c = { ...c, addr1, addr2, addr3 };
  }
  return c;
}

const UI_STATE_KEY = "eauto_12107_ui_state";
interface UiState { selected: string[]; headless: boolean; detailed: boolean; collapsed: Record<string, boolean>; autoAdvanceVehicleNo: boolean }
const DEFAULT_UI_STATE: UiState = { selected: [], headless: true, detailed: true, collapsed: {}, autoAdvanceVehicleNo: true };
function loadUiState(): UiState {
  try { const raw = localStorage.getItem(UI_STATE_KEY); if (raw) return { ...DEFAULT_UI_STATE, ...JSON.parse(raw) }; } catch { /* ignore */ }
  return DEFAULT_UI_STATE;
}

// ── Running private-car vehicle no. — same HXA####A format and auto-advance
// as app/eauto/12412/page.tsx (Faizuddin, 2026-10-19: "Running number, just
// like we did with 12412"). Own counter: Secarang is a different system from
// the eAuto JomCheck counter. ──
const VN_COUNTER_KEY = "eauto_12107_vn_counter";
const formatVehicleNo = (n: number) => `HXA${String(n).padStart(4, "0")}A`;
function loadVnCounter(): number {
  const raw = typeof window !== "undefined" ? localStorage.getItem(VN_COUNTER_KEY) : null;
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function Ticket12107Page() {
  // TS rows tinted from the TS Tracker: light green = passed in automation, darker = passed by hand.
  const passState = useTsPassState();
  const savedUi = typeof window !== "undefined" ? loadUiState() : DEFAULT_UI_STATE;
  const VALID_SCENARIO_IDS = new Set(BUILT_TS_SCENARIOS.map(s => s.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(savedUi.selected.filter(id => VALID_SCENARIO_IDS.has(id))));
  const [headless, setHeadless] = useState(savedUi.headless);
  const [detailed, setDetailed] = useState(savedUi.detailed);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(savedUi.collapsed);
  function toggleSection(id: string) { setCollapsed(prev => ({ ...prev, [id]: !prev[id] })); }
  // TS section boxes start COLLAPSED (undefined) — flip against `false`.
  function toggleTsSection(id: string) { setCollapsed(prev => ({ ...prev, [id]: prev[id] === false })); }
  const isTsSectionCollapsed = (id: string) => collapsed[id] !== false;

  const [creds, setCreds] = useState<Creds>(typeof window !== "undefined" ? loadCreds() : DEFAULT_CREDS);
  const set = (k: keyof Creds, v: string) => setCreds(p => ({ ...p, [k]: v }));
  const setInsurer = (id: string, v: string) => setCreds(p => ({ ...p, insurers: { ...p.insurers, [id]: v } }));

  const [formError, setFormError] = useState("");
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
      const r = await fetch("/api/eauto-12107/history");
      if (!r.ok) throw new Error(`Failed to load past runs (${r.status})`);
      const data = await r.json() as { runs: HistoryRun[] };
      setHistory(data.runs); setHistoryLoaded(true);
    } catch (e) { setHistoryError(e instanceof Error ? e.message : "Failed to load past runs."); }
    finally { setHistoryLoading(false); }
  }

  const [autoAdvanceVehicleNo, setAutoAdvanceVehicleNo] = useState(savedUi.autoAdvanceVehicleNo);
  const [vnCounter, setVnCounter] = useState<number>(() => loadVnCounter());
  const [freshVehicleNo, setFreshVehicleNo] = useState(() => (savedUi.autoAdvanceVehicleNo ? formatVehicleNo(loadVnCounter()) : creds.vehicleNo));
  function regenerateVehicleNo() { const n = loadVnCounter(); setVnCounter(n); setFreshVehicleNo(formatVehicleNo(n)); }
  function advanceVehicleNoCounter(steps: number) {
    const next = vnCounter + steps;
    localStorage.setItem(VN_COUNTER_KEY, String(next));
    setVnCounter(next);
    setFreshVehicleNo(formatVehicleNo(next));
  }

  useEffect(() => {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({ selected: Array.from(selected), headless, detailed, collapsed, autoAdvanceVehicleNo }));
  }, [selected, headless, detailed, collapsed, autoAdvanceVehicleNo]);

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
      url: "/api/eauto-12107/run",
      stopUrl: "/api/eauto-12107/run",
      meta: { queueIndex: index, scenarios: [item.id] },
      body: { ...q.body, scenarios: [item.title], record: item.record },
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
      items[idx] = { ...items[idx], res: data, status: data.stopped ? "stopped" : failed ? "failed" : "passed" };
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

  const selectedScenarios = SCENARIOS.filter(s => selected.has(s.id));
  const privateScenarios = selectedScenarios.filter(s => s.owner === "private");
  const companyScenarios = selectedScenarios.filter(s => s.owner === "company");
  const bankScenarios = selectedScenarios.filter(s => s.needsBank);
  const cardScenarios = selectedScenarios.filter(s => s.needsCard);
  const ciboScenarios = selectedScenarios.filter(s => s.cibo);

  function toggle(id: string) {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  }

  function run() {
    if (!selected.size) { setFormError("Select at least one test case."); return; }
    const missing: string[] = [];
    if (privateScenarios.length) {
      if (!freshVehicleNo.trim()) missing.push("Private car vehicle no.");
      if (!creds.icNumber.trim()) missing.push("Owner IC");
    }
    if (companyScenarios.length) {
      if (!creds.companyVehicleNo.trim()) missing.push("Company car vehicle no.");
      if (!creds.companySsm.trim()) missing.push("Company SSM");
    }
    const secarangScenarios = selectedScenarios.filter(s => s.owner);
    if (secarangScenarios.length) {
      if (!creds.sitePassword.trim()) missing.push("Site password");
      if (!creds.postcode.trim()) missing.push("Postcode");
      if (!creds.ownerName.trim()) missing.push("Owner name");
      if (!creds.ownerEmail.trim()) missing.push("Owner email");
      if (!creds.ownerPhone.trim()) missing.push("Owner phone");
      if (!creds.addr1.trim()) missing.push("Address line 1");
    }
    if (bankScenarios.length && !creds.bankValue.trim() && !creds.bankName.trim()) missing.push("FPX bank");
    if (bankScenarios.length && (!creds.bankUsername.trim() || !creds.bankPassword.trim())) missing.push("FPX simulator login");
      if (cardScenarios.length && (!creds.cardNumber.trim() || !creds.cardExpiry.trim() || !creds.cardCvv.trim())) missing.push("Test card");
    if (ciboScenarios.length) {
      if (!creds.ciboLoginId.trim()) missing.push("CIBO login ID");
      if (!creds.ciboPassword.trim()) missing.push("CIBO password");
      // Transaction refs are optional: a blank one is found on CIBO by the run.
    }
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    setFormError("");

    // Per-TS env: vehicle no. (private/company field) and insurer override.
    // Each private-car TS buys on its own consecutive running number; the
    // counter moves past them after the run is queued.
    const vehicleEnvVars: Record<string, string> = {};
    const fixedVehicleNo = freshVehicleNo.trim().toUpperCase();
    let vnOffset = 0;
    let firstVehicleNo = "";
    for (const s of [...selectedScenarios].sort((a, b) => a.order - b.order)) {
      if (s.vehicleEnvVar && s.owner === "company") vehicleEnvVars[s.vehicleEnvVar] = creds.companyVehicleNo.trim().toUpperCase();
      else if (s.vehicleEnvVar) {
        const vn = autoAdvanceVehicleNo ? formatVehicleNo(vnCounter + vnOffset++) : fixedVehicleNo;
        vehicleEnvVars[s.vehicleEnvVar] = vn;
        firstVehicleNo ||= vn;
      }
      if (s.insurerEnvVar) vehicleEnvVars[s.insurerEnvVar] = (creds.insurers[s.id] ?? s.insurerDefault ?? "").trim();
    }

    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    const ordered = [...selectedScenarios].sort((a, b) => a.order - b.order);
    const items: QueueItem[] = ordered.map((sc, i) => ({ id: sc.id, title: sc.title, record: true, status: i === 0 ? "running" : "pending" }));
    const { insurers: _ignored, ...flat } = creds; // eslint-disable-line @typescript-eslint/no-unused-vars
    const q: QueueState = { items, currentIndex: 0, active: true, body: { ...flat, vehicleNo: firstVehicleNo || fixedVehicleNo, vehicleEnvVars, headless, detailed } };
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
      const r = await fetch("/api/eauto-12107/download-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId, runLabel, ...(files ? { files } : {}) }) });
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
        <Wallet size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">12107 + 12327</h1>
        <DeploySoonHeader keys={["EAINT-12107","EAINT-12327"]} />
        <span className="text-xs text-slate-600 hidden md:block">Secarang ShopeePay / GrabPay (12107) + CIBO Payment Mode column format (12327) — release S34.X 20/21 Oct</span>
      </header>

      <div className="p-4 sm:p-6 space-y-5">
        <Section id="config" title="Run configuration" collapsed={!!collapsed.config} onToggle={toggleSection}>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={label}>Secarang base URL</label>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.baseUrl} onChange={e => set("baseUrl", e.target.value)} placeholder="https://staging.secarang.com/ia/car-insurance" className={field} />
              </div>
              <div>
                <label className={label}>Site password</label>
                <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.sitePassword} onChange={e => set("sitePassword", e.target.value)} placeholder="staging gate password" className={field} />
              </div>
              <div>
                <label className={label}>Postcode</label>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.postcode} onChange={e => set("postcode", e.target.value)} className={field} />
              </div>
              <div>
                <label className={label}>Owner name / phone</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.ownerName} onChange={e => set("ownerName", e.target.value)} placeholder="name" className={field} title="Owner name" />
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.ownerPhone} onChange={e => set("ownerPhone", e.target.value)} placeholder="phone" className={clsx(field, "w-32 shrink-0")} title="Phone" />
                </div>
              </div>
              <div>
                <label className={label}>Owner email</label>
                <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.ownerEmail} onChange={e => set("ownerEmail", e.target.value)} className={field} />
              </div>
              <div className="sm:col-span-2 lg:col-span-3">
                <label className={label}>Address lines 1 / 2 / 3</label>
                <div className="flex gap-1.5">
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.addr1} onChange={e => set("addr1", e.target.value)} placeholder="line 1" className={field} />
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.addr2} onChange={e => set("addr2", e.target.value)} placeholder="line 2" className={field} />
                  <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.addr3} onChange={e => set("addr3", e.target.value)} placeholder="line 3" className={field} />
                </div>
              </div>
              {privateScenarios.length > 0 && (
                <>
                  <div>
                    <label className={label}>Private car vehicle no. <span className="text-red-400">*</span><UsedBy scenarios={privateScenarios} /></label>
                    <div className="flex gap-1.5">
                      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={freshVehicleNo} onChange={e => { setFreshVehicleNo(e.target.value.toUpperCase()); set("vehicleNo", e.target.value.toUpperCase()); }} className={field} />
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
                        ? "Fixed — this exact value is used for every private-car TS and never changes."
                        : "Auto-advances after every run — each private-car TS gets its own consecutive vehicle no. starting here."}
                    </p>
                  </div>
                  <div>
                    <label className={label}>Owner IC <span className="text-red-400">*</span></label>
                    <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.icNumber} onChange={e => set("icNumber", e.target.value)} className={field} />
                  </div>
                </>
              )}
              {bankScenarios.length > 0 && (
                <>
                  <div>
                    <label className={label}>FPX bank (name or value)<UsedBy scenarios={bankScenarios} /></label>
                    <div className="flex gap-1.5">
                      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.bankName} onChange={e => set("bankName", e.target.value)} placeholder="RHB" className={field} title="Matched against the bank logo's alt text" />
                      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.bankValue} onChange={e => set("bankValue", e.target.value)} placeholder="value (eg. fpx_rhb)" className={field} title="Exact input value — overrides the name when set" />
                    </div>
                  </div>
                  <div>
                    <label className={label}>FPX simulator login</label>
                    <div className="flex gap-1.5">
                      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.bankUsername} onChange={e => set("bankUsername", e.target.value)} className={field} />
                      <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.bankPassword} onChange={e => set("bankPassword", e.target.value)} className={field} />
                    </div>
                  </div>
                </>
              )}
              {cardScenarios.length > 0 && (
                <div>
                  <label className={label}>Fiuu test card (number / MM/YY / CVV)<UsedBy scenarios={cardScenarios} /></label>
                  <div className="flex gap-1.5">
                    <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.cardNumber} onChange={e => set("cardNumber", e.target.value.replace(/\D/g, ""))} className={field} />
                    <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.cardExpiry} onChange={e => set("cardExpiry", e.target.value)} placeholder="MM/YY" className={clsx(field, "w-24 shrink-0")} />
                    <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.cardCvv} onChange={e => set("cardCvv", e.target.value.replace(/\D/g, ""))} placeholder="CVV" className={clsx(field, "w-20 shrink-0")} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">Other test cards: VISA 4456 5300 0000 1096 (works, 12/26 / 111) · 4111 1111 1111 1111 is rejected by Fiuu (P10)</p>
                </div>
              )}
            </div>

            {ciboScenarios.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-400">
                  CIBO <UsedBy scenarios={ciboScenarios} /> <span className="normal-case font-normal tracking-normal text-slate-500">— transaction refs per payment method; leave a ref blank and the run finds a matching transaction on CIBO itself</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className={label}>CIBO login ID / password <span className="text-red-400">*</span></label>
                    <div className="flex gap-1.5">
                      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.ciboLoginId} onChange={e => set("ciboLoginId", e.target.value)} className={field} />
                      <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.ciboPassword} onChange={e => set("ciboPassword", e.target.value)} placeholder="password" className={field} />
                    </div>
                  </div>
                  {([
                    ["ciboRefGrabPay", "GrabPay Full Amount (12107_TS01)"],
                    ["ciboRefShopeePay", "ShopeePay (12107_TS02)"],
                    ["ciboRefGrabPayLater", "PayLater by Grab (12107_TS05 patch)"],
                    ["ciboRefBoldPayTng", "BoldPay TouchNGo"],
                    ["ciboRefFiuuFpx", "Fiuu FPX (12107_TS08)"],
                    ["ciboRefBoldPayCard", "BoldPay Credit/Debit Card"],
                    ["ciboRefNoPayment", "No payment (12327_TS13)"],
                    ["ciboRefExisting", "Existing, pre-push (12327_TS18)"],
                  ] as const).map(([k, l]) => (
                    <div key={k}>
                      <label className={label}>{l}</label>
                      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds[k]} onChange={e => set(k, e.target.value.toUpperCase())} placeholder="BR… (blank = auto)" className={field} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedScenarios.some(s => s.insurerEnvVar) && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-400">
                  Insurer per TS <span className="normal-case font-normal tracking-normal text-slate-500">— from the test script; edit to override</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {selectedScenarios.filter(s => s.insurerEnvVar).sort((a, b) => a.order - b.order).map(s => (
                    <div key={s.id}>
                      <label className={label}>Insurer<UsedBy scenarios={[s]} /></label>
                      <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.insurers[s.id] ?? s.insurerDefault ?? ""} onChange={e => setInsurer(s.id, e.target.value)} className={field} />
                    </div>
                  ))}
                </div>
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
              {!running ? (
                <button onClick={run} disabled={!selectedScenarios.length} className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
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
            <span className="text-xs text-slate-600">{BUILT_TS_SCENARIOS.length} automated · {TS_SCENARIOS.length - BUILT_TS_SCENARIOS.length} manual · {TS_SECTIONS.length} sections</span>
            <div className="flex-1" />
            <button onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, false])) }))} className="text-xs text-indigo-400 hover:text-indigo-300">Expand all</button>
            <button onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, true])) }))} className="text-xs text-slate-500 hover:text-slate-300">Collapse all</button>
            <button onClick={() => setSelected(new Set())} className="text-xs text-slate-500 hover:text-slate-300">Clear selection</button>
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
                    <button onClick={() => setSelected(prev => new Set([...prev, ...built.map(s => s.id)]))} className="text-xs text-indigo-400 hover:text-indigo-300">Select all</button>
                    <button onClick={() => setSelected(prev => { const next = new Set(prev); sec.scenarios.forEach(s => next.delete(s.id)); return next; })} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                  </>
                ) : undefined}
              >
                {sec.scenarios.map(s => (
                  <label key={s.id} title={passState(s.title) ? TS_PASS_TITLE[passState(s.title)!] : s.notBuilt ? "Manual — dev patches the payment method; the patched value is checked by 12327_TS12." : s.unconfirmed ? "Selectors for the new GrabPay / Fiuu popup screens are not yet confirmed from captured HTML." : undefined}
                    className={clsx("flex gap-3 px-4 py-2.5", s.notBuilt ? "cursor-not-allowed opacity-50" : "cursor-pointer", passState(s.title) ? TS_PASS_ROW[passState(s.title)!] : clsx(!s.notBuilt && "hover:bg-slate-800/40", !s.notBuilt && s.unconfirmed && "bg-amber-950/20 hover:bg-amber-950/30"))}>
                    <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} disabled={s.notBuilt} className="mt-1 accent-indigo-600 shrink-0 disabled:cursor-not-allowed" />
                    <div className="min-w-0 flex-1">
                      <span className={clsx("text-sm font-mono", s.notBuilt ? "text-slate-500" : s.unconfirmed ? "text-amber-300" : "text-slate-300")}>{s.title.split(":")[0]}</span>
                      {s.notBuilt && <span className="ml-2 text-[10px] font-medium text-slate-500">Manual (dev patch)</span>}
                      {!s.notBuilt && s.unconfirmed && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400"><AlertTriangle size={10} />Selectors unconfirmed</span>}
                      <p className="text-xs text-slate-400 mt-0.5">{s.title.slice(s.title.indexOf(":") + 2)}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{s.summary}</p>
                      {/* Company car needs a specific registered vehicle and its
                          company details, typed per run on the TS row
                          (Faizuddin, 2026-10-19). preventDefault keeps a click
                          in these boxes from ticking / unticking the row. */}
                      {s.owner === "company" && selected.has(s.id) && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2" onClick={e => e.preventDefault()}>
                          <div>
                            <span className={label}>Company car vehicle no. <span className="text-red-400">*</span></span>
                            <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.companyVehicleNo} onChange={e => set("companyVehicleNo", e.target.value.toUpperCase())} placeholder="a company-registered vehicle on staging" className={field} />
                          </div>
                          <div>
                            <span className={label}>Company SSM no. <span className="text-red-400">*</span></span>
                            <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.companySsm} onChange={e => set("companySsm", e.target.value)} className={field} />
                          </div>
                        </div>
                      )}
                    </div>
                  </label>
                ))}
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
