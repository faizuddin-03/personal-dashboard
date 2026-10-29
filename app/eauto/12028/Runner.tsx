"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, Film, RefreshCw, Image as ImageIcon, Download, Copy, Check, ClipboardList, FileSpreadsheet, History, Landmark, Hand, Trash2, ArrowLeft,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import type { RunnerProps } from "@/lib/pipeline/runnerRegistry";

/** Registry key for this runner's run in AppShell's background-run store (shared with /pipeline/EAINT-12028). */
const RUN_KEY = "eauto/12028";

// EAINT-12028 — [eAuto-BackOffice] New Module – Association Payment Listing.
// Suite: scripts/eauto-12028 (one test per TS). Scenarios: Elf's
// data/pipeline/work/EAINT-12028/scenarios.json (approved 2026-10-28); manual
// TS are listed, greyed, never run. Same standard flow as app/eauto/12153 and
// app/eauto/jomcheck: queue of one TS per run call, one card per TS, per-TS
// evidence, past runs, detailed log (eauto-automation-scaffold skill §4-§5).
// The module is not captured live yet: every Summary / Details selector comes
// from the 31.07 mock-up and is [unconfirmed] until the first run.

type RoleKey = "drafter" | "drafter2" | "reviewer" | "approver" | "multi" | "norole" | "superadmin";
type InputKey = "month" | "month2" | "state" | "state2" | "vehicle" | "count" | "count2" | "name" | "name2" | "name3" | "payDate" | "expectMenu" | "expectKiv" | "expectSig" | "waitMin" | "timeoutMin" | "target"
  | "mPending" | "mKIV" | "mDRA" | "mDA" | "mRRA" | "mRA" | "mFull";

interface Scenario {
  id: string;
  /** Section letter, as scenarios.json "section". */
  section: string;
  priority: "P1" | "P2" | "P3";
  /** MUST match the spec's test() title exactly — the run route greps by it. */
  title: string;
  manual?: boolean;
  /** Logins this TS signs in with (their fields become required). */
  roles?: RoleKey[];
  /** Values typed on the TS row (blank and required). */
  inputs?: InputKey[];
  /** Field labels that say what this TS needs (e.g. which month). */
  labels?: Partial<Record<InputKey, string>>;
}

const TS_SECTIONS: { letter: string; title: string }[] = [
  { letter: "A", title: "Reports menu and module access" },
  { letter: "B", title: "Summary page" },
  { letter: "C", title: "Month-close" },
  { letter: "D", title: "Details page figures" },
  { letter: "E", title: "Drafter actions" },
  { letter: "F", title: "Reviewer actions" },
  { letter: "G", title: "Approver actions and payment date" },
  { letter: "H", title: "Multi-role user" },
  { letter: "I", title: "Audit log" },
  { letter: "J", title: "Payment Request download" },
  { letter: "K", title: "FMC Payment Request PDF" },
  { letter: "L", title: "MMSDA Payment Request PDF" },
  { letter: "M", title: "BO login, SSO, session and double submit" },
];

// P1 first, then P2, then P3 (scenarios.json "priority"), so the default order runs the P1 tests first.
const SCENARIOS: Scenario[] = [
  { id: "12028_TS05", section: "A", priority: "P1", title: "12028_TS05: No-role BO user Reports menu item visible or hidden per BA answer", roles: ["norole"], inputs: ["expectMenu"] },
  { id: "12028_TS06", section: "A", priority: "P1", title: "12028_TS06: No-role BO user blocked on the Summary and Details page addresses", roles: ["drafter","norole"], inputs: ["month"], labels: {"month":"Closed month"} },
  { id: "12028_TS08", section: "B", priority: "P1", title: "12028_TS08: Summary figures use the FMC and MMSDA rates and the total row sums the months", roles: ["drafter"] },
  { id: "12028_TS10", section: "B", priority: "P1", title: "12028_TS10: View opens the month's Details matching the Summary row and Back to Summary returns", roles: ["drafter"], inputs: ["month"], labels: {"month":"Closed month"} },
  { id: "12028_TS13", section: "C", priority: "P1", title: "12028_TS13: Running month-close on an approved month keeps statuses and Payment Date", roles: ["drafter"], inputs: ["month","waitMin"], labels: {"month":"Fully approved month"} },
  { id: "12028_TS14", section: "D", priority: "P1", title: "12028_TS14: Details shows 16 states, TOTAL and amounts at the FMC and MMSDA rates", roles: ["drafter"], inputs: ["month"], labels: {"month":"Closed month with an amount of 1,000+"} },
  { id: "12028_TS15", section: "D", priority: "P1", title: "12028_TS15: State counts match Transaction Summary Report (State)", roles: ["superadmin","drafter"], inputs: ["month"], labels: {"month":"Closed month"} },
  { id: "12028_TS25", section: "E", priority: "P1", title: "12028_TS25: Drafter buttons disabled once the Drafter step is done", roles: ["drafter"], inputs: ["mDA","mRRA","mFull"] },
  { id: "12028_TS28", section: "F", priority: "P1", title: "12028_TS28: Reviewer buttons disabled with waiting note until the Drafter approves", roles: ["reviewer"], inputs: ["mPending","mKIV","mDRA"] },
  { id: "12028_TS33", section: "F", priority: "P1", title: "12028_TS33: Reviewer buttons disabled once the Reviewer step is done", roles: ["reviewer"], inputs: ["mRA","mFull"] },
  { id: "12028_TS35", section: "G", priority: "P1", title: "12028_TS35: Approver buttons disabled with waiting note until the Reviewer approves", roles: ["approver"], inputs: ["mPending","mKIV","mDA","mDRA","mRRA"] },
  { id: "12028_TS36", section: "G", priority: "P1", title: "12028_TS36: Approver first Approve with signature and tomorrow's date completes the month", roles: ["approver"], inputs: ["month"], labels: {"month":"Reviewer Approved month (Approver never signed)"} },
  { id: "12028_TS39", section: "G", priority: "P1", title: "12028_TS39: Approver buttons disabled on a fully approved month", roles: ["approver"], inputs: ["month"], labels: {"month":"Fully approved month"} },
  { id: "12028_TS48", section: "J", priority: "P1", title: "12028_TS48: Download buttons hidden with pending note until the month is fully approved", roles: ["approver"], inputs: ["mPending","mKIV","mDA","mDRA","mRA","mRRA"] },
  { id: "12028_TS49", section: "J", priority: "P1", title: "12028_TS49: Approver sees both download buttons on a fully approved month", roles: ["approver"], inputs: ["month"], labels: {"month":"Fully approved month"} },
  { id: "12028_TS52", section: "J", priority: "P1", title: "12028_TS52: No-role BO user blocked on the PDF download address (manual)", manual: true },
  { id: "12028_TS53", section: "J", priority: "P1", title: "12028_TS53: Download address of a month not fully approved is blocked (manual)", manual: true },
  { id: "12028_TS55", section: "K", priority: "P1", title: "12028_TS55: FMC Payment Request PDF shows the SRD fields and the month's car amount", roles: ["approver"], inputs: ["month","name","name2","name3"], labels: {"month":"Fully approved month"} },
  { id: "12028_TS56", section: "L", priority: "P1", title: "12028_TS56: MMSDA Payment Request PDF shows the SRD fields and the month's motorcycle amount", roles: ["approver"], inputs: ["month","name","name2","name3"], labels: {"month":"Fully approved month"} },
  { id: "12028_TS57", section: "M", priority: "P1", title: "12028_TS57: BO login hand-off opens Association Payment Listing and module logout needs a fresh login", roles: ["drafter"] },
  { id: "12028_TS58", section: "M", priority: "P1", title: "12028_TS58: Used SSO hand-off address cannot log in again (manual)", manual: true },
  { id: "12028_TS59", section: "M", priority: "P1", title: "12028_TS59: Core logout logs out the open Association Payment Listing tab", roles: ["drafter"] },
  { id: "12028_TS61", section: "M", priority: "P1", title: "12028_TS61: Logout redirect to an outside address stays on eAuto (manual)", manual: true },
  { id: "12028_TS62", section: "M", priority: "P1", title: "12028_TS62: Session-expiry redirect to an outside address stays on eAuto (manual)", manual: true },
  { id: "12028_TS63", section: "M", priority: "P1", title: "12028_TS63: Drafter Approve from two tabs makes one audit row", roles: ["drafter"], inputs: ["month"], labels: {"month":"Pending month"} },
  { id: "12028_TS64", section: "M", priority: "P1", title: "12028_TS64: Reviewer Approve from two tabs makes one audit row", roles: ["reviewer"], inputs: ["month"], labels: {"month":"Drafter Approved month"} },
  { id: "12028_TS65", section: "M", priority: "P1", title: "12028_TS65: Approver Approve from two tabs makes one audit row and one payment date", roles: ["approver"], inputs: ["month"], labels: {"month":"Reviewer Approved month"} },
  { id: "12028_TS66", section: "M", priority: "P1", title: "12028_TS66: Forced Reviewer approval on a Pending month is rejected (manual)", manual: true },
  { id: "12028_TS67", section: "M", priority: "P1", title: "12028_TS67: Forced Approver approval before the Reviewer approves is rejected (manual)", manual: true },
  { id: "12028_TS68", section: "M", priority: "P1", title: "12028_TS68: Forced action on a fully approved month is rejected (manual)", manual: true },
  { id: "12028_TS01", section: "A", priority: "P2", title: "12028_TS01: Drafter sees Association Payment Listing under Reports and opens Summary", roles: ["drafter"] },
  { id: "12028_TS02", section: "A", priority: "P2", title: "12028_TS02: Reviewer sees Association Payment Listing under Reports and opens Summary", roles: ["reviewer"] },
  { id: "12028_TS03", section: "A", priority: "P2", title: "12028_TS03: Approver sees Association Payment Listing under Reports and opens Summary", roles: ["approver"] },
  { id: "12028_TS04", section: "A", priority: "P2", title: "12028_TS04: Multi-role user sees Association Payment Listing under Reports and opens Summary", roles: ["multi"] },
  { id: "12028_TS07", section: "B", priority: "P2", title: "12028_TS07: Summary for Year 2026 shows the year filter, 12 months, columns, total label and Payment Date", roles: ["drafter"], inputs: ["month"], labels: {"month":"Month with Approver Status Pending"} },
  { id: "12028_TS11", section: "C", priority: "P2", title: "12028_TS11: Month-close on a past month shows its figures with all statuses Pending", roles: ["drafter"], inputs: ["month","waitMin"], labels: {"month":"Past month not yet closed"} },
  { id: "12028_TS12", section: "C", priority: "P2", title: "12028_TS12: Running month-close twice keeps the same figures", roles: ["drafter"], inputs: ["month","waitMin"], labels: {"month":"Closed month"} },
  { id: "12028_TS16", section: "D", priority: "P2", title: "12028_TS16: Private and company vehicles both counted under Car and Motorcycle", roles: ["drafter"], inputs: ["month","state","count","count2"], labels: {"month":"Closed month","count":"Car count (private + company)","count2":"Motorcycle count (private + company)"} },
  { id: "12028_TS17", section: "D", priority: "P2", title: "12028_TS17: Transaction counted in the month of its JPJ Approved Date", roles: ["drafter"], inputs: ["month","month2","state","vehicle","count","count2"], labels: {"month":"JPJ approval month","count":"Count, approval month","count2":"Count, creation month"} },
  { id: "12028_TS18", section: "D", priority: "P2", title: "12028_TS18: Approved transaction not yet paid is not counted", roles: ["drafter"], inputs: ["month","state","vehicle","count"], labels: {"month":"Month of the unpaid transaction","count":"Count (paid only)"} },
  { id: "12028_TS19", section: "D", priority: "P2", title: "12028_TS19: Transaction counted under the dealer's registered state", roles: ["drafter"], inputs: ["month","state","state2","vehicle","count","count2"], labels: {"month":"JPJ approval month","count":"Count, dealer state","count2":"Count, plate state"} },
  { id: "12028_TS20", section: "E", priority: "P2", title: "12028_TS20: Drafter first Approve with the signature pad sets Drafter Status Approved", roles: ["drafter"], inputs: ["month"], labels: {"month":"Pending month (Drafter never signed)"} },
  { id: "12028_TS21", section: "E", priority: "P2", title: "12028_TS21: Drafter KIV on a Pending month sets Drafter Status KIV", roles: ["drafter"], inputs: ["month"], labels: {"month":"Pending month"} },
  { id: "12028_TS22", section: "E", priority: "P2", title: "12028_TS22: Drafter Approve on a Review Again month sets Drafter Status Approved", roles: ["drafter"], inputs: ["month"], labels: {"month":"Drafter Review Again month"} },
  { id: "12028_TS23", section: "E", priority: "P2", title: "12028_TS23: Drafter KIV on a Review Again month sets Drafter Status KIV", roles: ["drafter"], inputs: ["month"], labels: {"month":"Drafter Review Again month"} },
  { id: "12028_TS24", section: "E", priority: "P2", title: "12028_TS24: Drafter action on a KIV month follows the final KIV rule", roles: ["drafter"], inputs: ["month","expectKiv"], labels: {"month":"KIV month"} },
  { id: "12028_TS26", section: "E", priority: "P2", title: "12028_TS26: Second Drafter user approves a Pending month and is blocked after another Drafter approved", roles: ["drafter2"], inputs: ["mPending","mDA"], labels: {"mDA":"Month the first Drafter approved"} },
  { id: "12028_TS27", section: "E", priority: "P2", title: "12028_TS27: Drafter second approval reuses the signature without the pad", roles: ["drafter"], inputs: ["month"], labels: {"month":"Another Pending month"} },
  { id: "12028_TS29", section: "F", priority: "P2", title: "12028_TS29: Reviewer first Approve with the signature pad sets Reviewer Status Approved", roles: ["reviewer"], inputs: ["month"], labels: {"month":"Drafter Approved month (Reviewer never signed)"} },
  { id: "12028_TS30", section: "F", priority: "P2", title: "12028_TS30: Reviewer Reject needs remarks and returns the month to Drafter Review Again", roles: ["reviewer"], inputs: ["month"], labels: {"month":"Drafter Approved month"} },
  { id: "12028_TS31", section: "F", priority: "P2", title: "12028_TS31: Reviewer re-approves a Reviewer Review Again month", roles: ["reviewer"], inputs: ["month"], labels: {"month":"Reviewer Review Again month"} },
  { id: "12028_TS32", section: "F", priority: "P2", title: "12028_TS32: Reviewer Reject on a Review Again month sets Drafter Status Review Again", roles: ["reviewer"], inputs: ["month"], labels: {"month":"Reviewer Review Again month"} },
  { id: "12028_TS34", section: "F", priority: "P2", title: "12028_TS34: Reviewer second approval reuses the signature without the pad", roles: ["reviewer"], inputs: ["month"], labels: {"month":"Another Drafter Approved month"} },
  { id: "12028_TS37", section: "G", priority: "P2", title: "12028_TS37: Payment date popup blocks cancel, blank, today, past, typed and pasted dates", roles: ["approver"], inputs: ["month"], labels: {"month":"Reviewer Approved month"} },
  { id: "12028_TS38", section: "G", priority: "P2", title: "12028_TS38: Approver Reject needs remarks and returns the month to Reviewer Review Again", roles: ["approver"], inputs: ["month"], labels: {"month":"Reviewer Approved month"} },
  { id: "12028_TS40", section: "G", priority: "P2", title: "12028_TS40: Approver second approval reuses the signature and still asks payment date", roles: ["approver"], inputs: ["month"], labels: {"month":"Another Reviewer Approved month"} },
  { id: "12028_TS41", section: "G", priority: "P2", title: "12028_TS41: Approver approves a month after the Reviewer re-approves it", roles: ["approver"], inputs: ["month"], labels: {"month":"Month re-approved in 12028_TS31"} },
  { id: "12028_TS42", section: "H", priority: "P2", title: "12028_TS42: Multi-role user completes a month alone", roles: ["multi"], inputs: ["month","expectSig"], labels: {"month":"Pending month (multi-role user never signed)"} },
  { id: "12028_TS43", section: "H", priority: "P2", title: "12028_TS43: Multi-role user KIV sets Drafter Status KIV", roles: ["multi"], inputs: ["month"], labels: {"month":"Pending month"} },
  { id: "12028_TS44", section: "H", priority: "P2", title: "12028_TS44: Multi-role user Reviewer Reject then re-approves as Drafter", roles: ["multi"], inputs: ["month"], labels: {"month":"Drafter Approved month"} },
  { id: "12028_TS45", section: "H", priority: "P2", title: "12028_TS45: Multi-role user Approver Reject sets Reviewer Status Review Again", roles: ["multi"], inputs: ["month"], labels: {"month":"Reviewer Approved month"} },
  { id: "12028_TS47", section: "I", priority: "P2", title: "12028_TS47: Audit Log shows its columns, keeps every row after a reject loop and shows no signature image", roles: ["drafter"], inputs: ["month"], labels: {"month":"Month approved in 12028_TS41"} },
  { id: "12028_TS50", section: "J", priority: "P2", title: "12028_TS50: Drafter can download both PDFs on a fully approved month", roles: ["drafter"], inputs: ["month"], labels: {"month":"Fully approved month"} },
  { id: "12028_TS51", section: "J", priority: "P2", title: "12028_TS51: Reviewer can download both PDFs on a fully approved month", roles: ["reviewer"], inputs: ["month"], labels: {"month":"Fully approved month"} },
  { id: "12028_TS60", section: "M", priority: "P2", title: "12028_TS60: Session expiry returns to BO login without an error page", roles: ["drafter"], inputs: ["timeoutMin"] },
  { id: "12028_TS09", section: "B", priority: "P3", title: "12028_TS09: Closed month with zero transactions shows 0.00 and can be opened", roles: ["drafter"], inputs: ["month"], labels: {"month":"Closed month, zero transactions, all Pending"} },
  { id: "12028_TS46", section: "I", priority: "P3", title: "12028_TS46: New month Audit Log shows No activity yet", roles: ["drafter"], inputs: ["month"], labels: {"month":"Pending month with no action yet"} },
  { id: "12028_TS54", section: "J", priority: "P3", title: "12028_TS54: Second download gives the same file", roles: ["approver"], inputs: ["month"], labels: {"month":"Fully approved month"} },
];

/** Test-data setup (not a TS): its own box above the TS sections. */
const SETUP = { id: "12028_PREP", title: "12028_PREP: Move a month to a chosen workflow status", roles: ["drafter", "reviewer", "approver"] as RoleKey[] };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const STATES = ["01 Johor", "02 Kedah", "03 Kelantan", "04 Melaka", "05 Negeri Sembilan", "06 Pahang", "07 Pulau Pinang", "08 Perak", "09 Perlis", "10 Selangor", "11 Terengganu", "12 Sabah", "13 Sarawak", "14 W.P. Kuala Lumpur", "15 W.P. Labuan", "16 W.P. Putrajaya"];
const TARGETS: { key: string; label: string }[] = [
  { key: "DA", label: "Drafter Approved" }, { key: "KIV", label: "KIV" }, { key: "RA", label: "Reviewer Approved" },
  { key: "DRA", label: "Drafter Review Again" }, { key: "RRA", label: "Reviewer Review Again" }, { key: "Full", label: "fully approved" },
];

const ROLE_LABEL: Record<RoleKey, string> = {
  drafter: "Drafter", drafter2: "Second Drafter", reviewer: "Reviewer", approver: "Approver",
  multi: "Multi-role user", norole: "BO user with no Association role", superadmin: "Super Admin",
};
// SRD v1.1 REQ-003 mapping, shown as a hint only (never prefilled).
const ROLE_HINT: Record<RoleKey, string> = {
  drafter: "SRD: eautozara / mfared", drafter2: "the other Drafter ID", reviewer: "SRD: eautonurul", approver: "SRD: kmcheah",
  multi: "SRD: mfizni", norole: "any BO user without a role row", superadmin: "sees Transaction Summary Report (State)",
};
const ROLE_ENV: Record<RoleKey, string> = { drafter: "DRAFTER", drafter2: "DRAFTER2", reviewer: "REVIEWER", approver: "APPROVER", multi: "MULTI", norole: "NOROLE", superadmin: "SUPERADMIN" };
const ROLES = Object.keys(ROLE_LABEL) as RoleKey[];

const INPUT_ENV: Record<InputKey, string> = {
  month: "E12028_MONTH", month2: "E12028_MONTH2", state: "E12028_STATE", state2: "E12028_STATE2", vehicle: "E12028_VEHICLE",
  count: "E12028_COUNT", count2: "E12028_COUNT2", name: "E12028_NAME", name2: "E12028_NAME2", name3: "E12028_NAME3", payDate: "E12028_PAY_DATE",
  expectMenu: "E12028_EXPECT_MENU", expectKiv: "E12028_EXPECT_KIV", expectSig: "E12028_EXPECT_SIG",
  waitMin: "E12028_WAIT_MIN", timeoutMin: "E12028_TIMEOUT_MIN", target: "E12028_TARGET",
  // One month per status, for the TS that visit several months (scripts/eauto-12028/utils/combined.ts MONTH_KEY).
  mPending: "E12028_M_PENDING", mKIV: "E12028_M_KIV", mDRA: "E12028_M_DRA", mDA: "E12028_M_DA", mRRA: "E12028_M_RRA", mRA: "E12028_M_RA", mFull: "E12028_M_FULL",
};
const MONTH_INPUTS: InputKey[] = ["month", "month2", "mPending", "mKIV", "mDRA", "mDA", "mRRA", "mRA", "mFull"];

/** Environments (staging = the /eauto instance from 2026-10-21). Chosen, never prefilled. */
const ENVIRONMENTS = [{ value: "https://staging.eauto.my|eauto", label: "Staging — staging.eauto.my/eauto" }];

function inputLabel(s: { labels?: Partial<Record<InputKey, string>> }, k: InputKey): string {
  const own = s.labels?.[k];
  if (own) return own;
  switch (k) {
    case "month": return "Month";
    case "month2": return "Creation month";
    case "state": return "Dealer state";
    case "state2": return "Plate state";
    case "vehicle": return "Vehicle type";
    case "count": return "Count";
    case "count2": return "Count 2";
    case "name": return "Drafter full name (as on the PDF)";
    case "name2": return "Reviewer full name (as on the PDF)";
    case "name3": return "Approver full name (as on the PDF)";
    case "payDate": return "Payment date (DD-MM-YYYY)";
    case "expectMenu": return "BA answer: menu item for a no-role user";
    case "expectKiv": return "Final KIV rule (BA)";
    case "expectSig": return "Final signature rule (BA)";
    case "waitMin": return "Month-close wait (minutes, ≥ one cron interval)";
    case "timeoutMin": return "Session timeout (minutes, from the developer)";
    case "target": return "Move it to";
    case "mPending": return "Pending month";
    case "mKIV": return "KIV month";
    case "mDRA": return "Drafter Review Again month";
    case "mDA": return "Drafter Approved month";
    case "mRRA": return "Reviewer Review Again month";
    case "mRA": return "Reviewer Approved month";
    case "mFull": return "Fully approved month";
  }
}

const CHOICES: Partial<Record<InputKey, string[]>> = {
  vehicle: ["Car", "Motorcycle"],
  expectMenu: ["shown", "hidden"],
  expectKiv: ["can act", "locked"],
  expectSig: ["per role", "per person"],
};
const DIGITS: InputKey[] = ["count", "count2", "waitMin", "timeoutMin"];

interface RunStep { title: string; duration: number; error?: string; steps: RunStep[] }
interface EvidenceItem { label: string; url: string; kind: "video" | "image" | "file" }
interface DetailItem { label: string; value: string }
interface CheckResult {
  title: string; status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted"; durationMs: number;
  error?: string; friendlyError?: string; steps: RunStep[]; tsLabel?: string; evidence?: EvidenceItem[]; video?: string; details?: DetailItem[]; runId?: string;
}
interface HistoryRun { runId: string; runLabel: string; timestamp: number; scenarios: string[]; evidence: EvidenceItem[]; status?: string }
interface RunResponse {
  result?: { checks: CheckResult[]; passed: number; failed: number; total: number };
  error?: string; stopped?: boolean; log?: string; video?: string; evidence?: EvidenceItem[]; details?: DetailItem[]; runId?: string; runLabel?: string;
}

type QueueStatus = "pending" | "running" | "passed" | "failed" | "stopped";
interface QueueItem { id: string; title: string; record: boolean; status: QueueStatus; env: Record<string, string>; res?: RunResponse }
interface QueueState { items: QueueItem[]; currentIndex: number; active: boolean; body: Record<string, unknown> }

/** A month the PREP setup moved (test data pool — picked on the TS row, never wired to a TS). */
interface PoolRecord { month: string; status: string; env: string; created: number; uses: { ts: string; status: string; at: number }[] }

const QUEUE_KEY = "eauto_12028_queue_state";
const CREDS_KEY = "eauto_12028_creds";
const UI_KEY = "eauto_12028_ui_state";
const POOL_KEY = "eauto_12028_month_pool";

interface Creds { env: string; users: Record<RoleKey, { user: string; pass: string }> }
const EMPTY_CREDS: Creds = { env: "", users: Object.fromEntries(ROLES.map(r => [r, { user: "", pass: "" }])) as Creds["users"] };
interface UiState { selected: string[]; headless: boolean; detailed: boolean; collapsed: Record<string, boolean>; rows: Record<string, Partial<Record<InputKey, string>>> }
// New runner: Headless OFF, Detailed ON (Faizuddin, 2026-10-15).
const DEFAULT_UI: UiState = { selected: [], headless: false, detailed: true, collapsed: {}, rows: {} };

function load<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try { const raw = localStorage.getItem(key); if (raw) return { ...fallback, ...JSON.parse(raw) }; } catch { /* ignore */ }
  return fallback;
}
function loadList<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw) as T[]; } catch { /* ignore */ }
  return [];
}
const tsNo = (title: string) => /^\s*(\d+_[A-Z]+\d*)/.exec(title)?.[1] ?? title.split(":")[0];

const field = "w-full min-w-0 px-2.5 py-1.5 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1";

function Section({ id, title, extra, collapsed, onToggle, children }: { id: string; title: ReactNode; extra?: ReactNode; collapsed: boolean; onToggle: (id: string) => void; children: ReactNode }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div role="button" tabIndex={0} onClick={() => onToggle(id)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(id); } }}
        className="w-full flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-800 text-left hover:bg-slate-800/30 cursor-pointer">
        {collapsed ? <ChevronRight size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1 min-w-0">{title}</span>
        {extra && <span onClick={e => e.stopPropagation()} className="flex items-center gap-3">{extra}</span>}
      </div>
      {!collapsed && <div className="divide-y divide-slate-800/70">{children}</div>}
    </div>
  );
}

function StepList({ steps }: { steps: RunStep[] }) {
  const flat: RunStep[] = [];
  const walk = (list: RunStep[]) => { for (const s of list) { flat.push(s); walk(s.steps); } };
  walk(steps);
  return (
    <ul className="space-y-1">
      {flat.map((s, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs">
          {s.error ? <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" /> : <CheckCircle2 size={12} className="text-green-500/80 shrink-0 mt-0.5" />}
          <span className={clsx("flex-1 break-words", s.error ? "text-red-300" : "text-slate-300")}>{s.title}</span>
        </li>
      ))}
    </ul>
  );
}

function groupByTs(items: EvidenceItem[]): [string, EvidenceItem[]][] {
  const groups = new Map<string, EvidenceItem[]>();
  for (const e of items) {
    const key = e.label.match(/^\d+_(?:TS\d+|PREP)/)?.[0] ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));
}

const PRIORITY_STYLE: Record<string, string> = {
  P1: "border-red-800 text-red-300", P2: "border-amber-800 text-amber-300", P3: "border-slate-700 text-slate-400",
};

export default function Runner({ embedded = false, pick }: RunnerProps) {
  const savedUi = load<UiState>(UI_KEY, DEFAULT_UI);
  const AUTOMATED = new Set(SCENARIOS.filter(s => !s.manual).map(s => s.id));
  const [selected, setSelected] = useState<Set<string>>(new Set(savedUi.selected.filter(id => AUTOMATED.has(id) || id === SETUP.id)));
  const [headless, setHeadless] = useState(savedUi.headless);
  const [detailed, setDetailed] = useState(savedUi.detailed);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(savedUi.collapsed);
  const [rows, setRows] = useState<UiState["rows"]>(savedUi.rows ?? {});
  const [creds, setCreds] = useState<Creds>(() => {
    const c = load<Creds>(CREDS_KEY, EMPTY_CREDS);
    return { ...c, users: { ...EMPTY_CREDS.users, ...c.users } };
  });
  const [pool, setPool] = useState<PoolRecord[]>(() => loadList<PoolRecord>(POOL_KEY));
  const [formError, setFormError] = useState("");
  const [stopAsk, setStopAsk] = useState(false);
  const [logCopied, setLogCopied] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<Set<string>>(new Set());
  const [downloading, setDownloading] = useState(false);
  const [evidenceError, setEvidenceError] = useState("");
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [openHistory, setOpenHistory] = useState<string | null>(null);

  const toggleSection = (id: string) => setCollapsed(p => ({ ...p, [id]: !p[id] }));
  // TS sections start collapsed: undefined counts as collapsed (scaffold skill §5 rule 13).
  const toggleTsSection = (id: string) => setCollapsed(p => ({ ...p, [id]: p[id] === false }));
  const tsCollapsed = (id: string) => collapsed[id] !== false;

  useEffect(() => { localStorage.setItem(UI_KEY, JSON.stringify({ selected: Array.from(selected), headless, detailed, collapsed, rows })); }, [selected, headless, detailed, collapsed, rows]);
  useEffect(() => { localStorage.setItem(CREDS_KEY, JSON.stringify(creds)); }, [creds]);
  useEffect(() => { localStorage.setItem(POOL_KEY, JSON.stringify(pool)); }, [pool]);

  // Runner contract 3: `pick` ticks exactly the listed TS ids this runner knows.
  const pickKey = pick?.join(",");
  useEffect(() => {
    if (pick === undefined) return;
    const want = new Set(pick);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- runner contract 3: a useEffect on pick?.join(",") ticks exactly the picked TS
    setSelected(new Set(SCENARIOS.filter(s => !s.manual && want.has(s.id)).map(s => s.id)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickKey]);

  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const res = (bgRun?.result as RunResponse | null) ?? null;
  const error = formError || bgRun?.error || "";

  const [queue, setQueue] = useState<QueueState | null>(() => (typeof window === "undefined" ? null : (() => { try { const raw = localStorage.getItem(QUEUE_KEY); return raw ? JSON.parse(raw) as QueueState : null; } catch { return null; } })()));
  const queueRef = useRef<QueueState | null>(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);
  const saveQueue = (q: QueueState | null) => { try { if (q) localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); else localStorage.removeItem(QUEUE_KEY); } catch { /* full */ } };

  function runQueueIndex(q: QueueState, index: number) {
    const item = q.items[index];
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-12028/run",
      stopUrl: "/api/eauto-12028/run",
      meta: { queueIndex: index, scenarios: [item.id] },
      body: { ...q.body, env: { ...(q.body.env as Record<string, string>), ...item.env }, scenarios: [item.title], record: item.record },
    });
  }

  const envLabel = ENVIRONMENTS.find(e => e.value === creds.env)?.label ?? creds.env;

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
      const it = items[idx];
      // A passed PREP run adds its month to the pool.
      if (it.id === SETUP.id && status === "passed") {
        const d = Object.fromEntries((data.details ?? []).map(x => [x.label, x.value]));
        // eslint-disable-next-line react-hooks/set-state-in-effect -- consumes a finished background run (external store), same queue pattern as app/eauto/12153
        if (d.Month && d.Status) setPool(p => [{ month: d.Month, status: d.Status, env: envLabel, created: Date.now(), uses: [] }, ...p.filter(r => !(r.month === d.Month && r.env === envLabel))]);
      }
      // Usage log on the pool record of the month this TS ran on.
      const m = it.env.E12028_MONTH;
      if (m && it.id !== SETUP.id && (status === "passed" || status === "failed")) {
        setPool(p => p.map(r => (r.month === `${m} 2026` ? { ...r, uses: [...r.uses, { ts: it.id, status, at: Date.now() }] } : r)));
      }
    }
    const next = idx + 1;
    const hasMore = prev.active && !data.stopped && next < items.length;
    if (hasMore) items[next] = { ...items[next], status: "running" };
    else for (let i = next; i < items.length; i++) items[i] = { ...items[i], status: "stopped" };
    const nq: QueueState = { ...prev, items, currentIndex: hasMore ? next : idx, active: hasMore };
    setQueue(nq);
    saveQueue(nq);
    if (hasMore) runQueueIndex(nq, next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bgRun?.runId, bgRun?.running, bgRun?.result]);

  async function loadHistory() {
    setHistoryLoading(true); setHistoryError("");
    try {
      const r = await fetch("/api/eauto-12028/history");
      if (!r.ok) throw new Error(`Failed to load past runs (${r.status})`);
      setHistory(((await r.json()) as { runs: HistoryRun[] }).runs);
      setHistoryLoaded(true);
    } catch (e) { setHistoryError(e instanceof Error ? e.message : "Failed to load past runs."); }
    finally { setHistoryLoading(false); }
  }
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- refetch Past runs once the current run finishes (scaffold skill §5 rule 9)
    if (historyLoaded && res?.runId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res?.runId]);

  const selectedTs = SCENARIOS.filter(s => selected.has(s.id) && !s.manual);
  const setupSelected = selected.has(SETUP.id);
  const neededRoles = new Set<RoleKey>([...selectedTs.flatMap(s => s.roles ?? []), ...(setupSelected ? SETUP.roles : [])]);

  const toggle = (id: string) => setSelected(p => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setRow = (id: string, k: InputKey, v: string) => setRows(p => ({ ...p, [id]: { ...(p[id] ?? {}), [k]: v } }));
  const setUser = (r: RoleKey, k: "user" | "pass", v: string) => setCreds(p => ({ ...p, users: { ...p.users, [r]: { ...p.users[r], [k]: v } } }));

  function requestRun() {
    if (!selectedTs.length && !setupSelected) { setFormError("Select at least one test case."); return; }
    const missing: string[] = [];
    if (!creds.env) missing.push("Environment");
    for (const r of neededRoles) {
      if (!creds.users[r].user.trim()) missing.push(`${ROLE_LABEL[r]} login`);
      if (!creds.users[r].pass) missing.push(`${ROLE_LABEL[r]} password`);
    }
    const rowsToCheck = [...(setupSelected ? [{ id: SETUP.id, inputs: ["month", "target"] as InputKey[] }] : []), ...selectedTs.map(s => ({ id: s.id, inputs: s.inputs ?? [] }))];
    for (const s of rowsToCheck) {
      for (const k of s.inputs) {
        const v = (rows[s.id]?.[k] ?? "").trim();
        if (!v) missing.push(`${tsNo(s.id)} ${inputLabel(SCENARIOS.find(x => x.id === s.id) ?? {}, k)}`);
        else if (k === "payDate" && !/^\d{2}-\d{2}-\d{4}$/.test(v)) missing.push(`${tsNo(s.id)} payment date as DD-MM-YYYY`);
      }
    }
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    setFormError("");
    run();
  }

  function run() {
    const [host, instance] = creds.env.split("|");
    const env: Record<string, string> = { E12028_HOST: host, E12028_INSTANCE: instance };
    for (const r of neededRoles) {
      env[`E12028_${ROLE_ENV[r]}_USER`] = creds.users[r].user.trim();
      env[`E12028_${ROLE_ENV[r]}_PASS`] = creds.users[r].pass;
    }
    const rowEnv = (id: string, inputs: InputKey[]) => Object.fromEntries(inputs.map(k => [INPUT_ENV[k], (rows[id]?.[k] ?? "").trim()]));
    // Frozen at start: editing the form mid-queue changes nothing (scaffold skill §4).
    const items: QueueItem[] = [
      ...(setupSelected ? [{ id: SETUP.id, title: SETUP.title, record: false, status: "pending" as QueueStatus, env: rowEnv(SETUP.id, ["month", "target"]) }] : []),
      ...selectedTs.map(s => ({ id: s.id, title: s.title, record: true, status: "pending" as QueueStatus, env: rowEnv(s.id, s.inputs ?? []) })),
    ];
    items[0].status = "running";
    const q: QueueState = { items, currentIndex: 0, active: true, body: { env, headless, detailed } };
    setQueue(q);
    saveQueue(q);
    setSelectedEvidence(new Set());
    runQueueIndex(q, 0);
  }

  function stop() {
    const prev = queueRef.current;
    if (prev) { const n = { ...prev, active: false }; setQueue(n); saveQueue(n); }
    stopRun(RUN_KEY);
  }

  async function downloadEvidence(files: string[] | null, target: { runId: string; runLabel: string; zipName?: string }) {
    setDownloading(true); setEvidenceError("");
    try {
      const r = await fetch("/api/eauto-12028/download-all", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ runId: target.runId, runLabel: target.runLabel, ...(files ? { files } : {}) }) });
      if (!r.ok) { const d = await r.json().catch(() => ({})); throw new Error(d.error ?? `Download failed (${r.status})`); }
      const url = URL.createObjectURL(await r.blob());
      const a = document.createElement("a");
      a.href = url; a.download = target.zipName ?? `${target.runLabel}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch (e) { setEvidenceError(e instanceof Error ? e.message : "Failed to download evidence."); }
    finally { setDownloading(false); }
  }

  const responses = queue ? queue.items.filter(i => i.res).map(i => i.res!) : (res ? [res] : []);
  const checks: CheckResult[] = responses.flatMap(r => (r.result?.checks ?? []).map(c => ({ ...c, runId: r.runId })));
  const passed = checks.filter(c => c.status === "passed").length;
  const failed = checks.filter(c => c.status !== "passed" && c.status !== "skipped").length;
  const evidence = responses.flatMap(r => r.evidence ?? []);
  const fullLog = queue ? queue.items.filter(i => i.res?.log).map(i => `===== ${i.title} =====\n${i.res!.log}`).join("\n\n") : (res?.log ?? "");

  async function copyLog() {
    if (!fullLog) return;
    try { await navigator.clipboard.writeText(fullLog); setLogCopied(true); setTimeout(() => setLogCopied(false), 2000); } catch { /* denied */ }
  }

  const monthOptions = (id: string) => MONTHS.map(m => {
    const rec = pool.find(r => r.month === `${m} 2026` && r.env === envLabel);
    return { value: m, label: rec ? `${m} — ${rec.status}${rec.uses.length ? ` (last: ${tsNo(rec.uses[rec.uses.length - 1].ts)} ${rec.uses[rec.uses.length - 1].status})` : ""}` : m, id };
  });

  // A plain render function (not a nested component), so typing never remounts the field.
  function inputField(s: { id: string; labels?: Partial<Record<InputKey, string>> }, k: InputKey): ReactNode {
    const v = rows[s.id]?.[k] ?? "";
    const set = (x: string) => setRow(s.id, k, x);
    let control: ReactNode;
    if (MONTH_INPUTS.includes(k)) control = (
      <select value={v} onChange={e => set(e.target.value)} className={field}>
        <option value="">— month —</option>
        {monthOptions(s.id).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
    else if (k === "state" || k === "state2") control = (
      <select value={v} onChange={e => set(e.target.value)} className={field}>
        <option value="">— state —</option>
        {STATES.map(st => <option key={st} value={st.slice(0, 2)}>{st}</option>)}
      </select>
    );
    else if (k === "target") control = (
      <select value={v} onChange={e => set(e.target.value)} className={field}>
        <option value="">— status —</option>
        {TARGETS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
      </select>
    );
    else if (CHOICES[k]) control = (
      <select value={v} onChange={e => set(e.target.value)} className={field}>
        <option value="">— choose —</option>
        {CHOICES[k]!.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    );
    // Digits only, may be empty while editing (same behaviour as components/NumericTextInput,
    // which cannot start blank — these fields must start blank and required).
    else if (DIGITS.includes(k)) control = <input inputMode="numeric" autoComplete="off" value={v} onChange={e => set(e.target.value.replace(/\D/g, ""))} className={field} />;
    else control = <input autoComplete="off" value={v} onChange={e => set(e.target.value)} placeholder={k === "payDate" ? "DD-MM-YYYY" : ""} className={field} />;
    return (
      <div key={k} className="min-w-0">
        <span className={label}>{inputLabel(s, k)} <span className="text-red-400">*</span></span>
        {control}
      </div>
    );
  }

  const automatedCount = AUTOMATED.size;
  const manualCount = SCENARIOS.length - automatedCount;

  return (
    <div className={clsx(embedded ? "space-y-4 min-w-0" : "flex flex-col min-h-full")}>
      {!embedded && (
        <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
          <Link href="/tickets" className="text-slate-500 hover:text-slate-300" title="Back to Tickets"><ArrowLeft size={15} /></Link>
          <Landmark size={16} className="text-indigo-400" />
          <h1 className="text-sm font-semibold text-slate-200">12028</h1>
          <span className="text-xs text-slate-600 hidden md:block truncate">Association Payment Listing — Summary, Details, Drafter / Reviewer / Approver workflow, FMC / MMSDA Payment Requests</span>
        </header>
      )}

      <div className={clsx("space-y-4 min-w-0", !embedded && "p-4 sm:p-6")}>
        <div className="flex items-start gap-2 rounded-xl border border-amber-800/50 bg-amber-950/20 p-3">
          <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200 leading-relaxed">Not run yet. The module has no live capture: Summary / Details selectors come from the 31.07 mock-up. Each workflow TS acts on the month typed on its row and stops first if that month is not in the status it needs.</p>
        </div>

        <Section id="config" title="Run configuration" collapsed={!!collapsed.config} onToggle={toggleSection}>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <div className="min-w-0">
                <label className={label}>Environment <span className="text-red-400">*</span></label>
                <select value={creds.env} onChange={e => setCreds(p => ({ ...p, env: e.target.value }))} className={field}>
                  <option value="">— choose —</option>
                  {ENVIRONMENTS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
              </div>
              {ROLES.map(r => (
                <div key={r} className="min-w-0">
                  <label className={label}>{ROLE_LABEL[r]} {neededRoles.has(r) && <span className="text-red-400">*</span>}</label>
                  <div className="flex gap-1.5">
                    <input autoComplete="off" data-1p-ignore data-lpignore="true" value={creds.users[r].user} onChange={e => setUser(r, "user", e.target.value)} placeholder="login" className={field} />
                    <input type="password" autoComplete="new-password" data-1p-ignore data-lpignore="true" value={creds.users[r].pass} onChange={e => setUser(r, "pass", e.target.value)} placeholder="password" className={field} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">{ROLE_HINT[r]}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)} className="accent-indigo-600" />Headless</label>
              <label className="flex items-center gap-2 text-xs text-slate-400" title="Slows the run down and highlights each button / field / value being acted on or checked."><input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} className="accent-indigo-600" />Detailed (slow + highlighted)</label>
              <div className="flex-1" />
              {!running ? (
                <button onClick={requestRun} disabled={!selectedTs.length && !setupSelected} className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
                  <Play size={14} />Run {selectedTs.length + (setupSelected ? 1 : 0) || ""}
                </button>
              ) : (
                <button onClick={() => setStopAsk(true)} disabled={bgRun?.stopping} className="flex items-center gap-2 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 transition-colors">
                  <Square size={14} />{bgRun?.stopping ? "Stopping…" : "Stop"}
                </button>
              )}
            </div>
            {error && <p className="flex items-start gap-1.5 text-xs text-red-400 break-words"><AlertTriangle size={13} className="shrink-0 mt-0.5" />{error}</p>}
          </div>
        </Section>

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

        <Section id="setup" title="Test data setup" collapsed={!!collapsed.setup} onToggle={toggleSection}>
          <div className="flex gap-3 px-4 py-2.5">
            <input type="checkbox" checked={setupSelected} onChange={() => toggle(SETUP.id)} className="mt-1 accent-indigo-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-mono text-slate-300 cursor-pointer" onClick={() => toggle(SETUP.id)}>{tsNo(SETUP.title)}</p>
              <p className="text-xs text-slate-400 mt-0.5">{SETUP.title.slice(SETUP.title.indexOf(":") + 2)}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Moves one month forward with the Drafter / Reviewer / Approver logins (approve, KIV or reject) until it shows the chosen status. The month then appears in the pool below and in every TS month list. No recording.</p>
              {setupSelected && (
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inputField({ id: SETUP.id }, "month")}
                  {inputField({ id: SETUP.id }, "target")}
                </div>
              )}
            </div>
          </div>
          <div className="px-4 py-2.5">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Prepared months ({pool.length})</p>
            {!pool.length && <p className="text-xs text-slate-600">None yet. A passed 12028_PREP run adds its month here.</p>}
            <div className="space-y-1">
              {pool.map((r, i) => (
                <div key={`${r.month}-${r.env}-${i}`} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-mono text-slate-300">{r.month}</span>
                  <span className="text-slate-400">{r.status}</span>
                  <span className="text-slate-600">{r.env}</span>
                  <span className="text-slate-600">{new Date(r.created).toLocaleString()}</span>
                  {r.uses.map((u, j) => <span key={j} className={clsx("px-1.5 rounded border text-[10px]", u.status === "passed" ? "border-green-800 text-green-300" : "border-red-800 text-red-300")}>{tsNo(u.ts)}</span>)}
                  <button onClick={() => setPool(p => p.filter((_, k) => k !== i))} title="Remove" className="text-slate-500 hover:text-red-400"><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3 px-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Test scenarios</span>
            <span className="text-xs text-slate-600">{automatedCount} automated · {manualCount} manual · P1 first</span>
            <div className="flex-1" />
            <button onClick={() => setCollapsed(p => ({ ...p, ...Object.fromEntries(TS_SECTIONS.map(s => [`ts${s.letter}`, false])) }))} className="text-xs text-indigo-400 hover:text-indigo-300">Expand all</button>
            <button onClick={() => setCollapsed(p => ({ ...p, ...Object.fromEntries(TS_SECTIONS.map(s => [`ts${s.letter}`, true])) }))} className="text-xs text-slate-500 hover:text-slate-300">Collapse all</button>
            <button onClick={() => setSelected(p => new Set([...p].filter(id => id === SETUP.id)))} className="text-xs text-slate-500 hover:text-slate-300">Clear selection</button>
          </div>

          {TS_SECTIONS.map(sec => {
            const list = SCENARIOS.filter(s => s.section === sec.letter);
            const auto = list.filter(s => !s.manual);
            const picked = auto.filter(s => selected.has(s.id)).length;
            return (
              <Section key={sec.letter} id={`ts${sec.letter}`} collapsed={tsCollapsed(`ts${sec.letter}`)} onToggle={toggleTsSection}
                title={<><span className="text-slate-400">{sec.letter}.</span> {sec.title} <span className="text-slate-600 normal-case tracking-normal">· {auto.length}/{list.length} automated{picked > 0 && <span className="text-indigo-400"> · {picked} selected</span>}</span></>}
                extra={<>
                  <button onClick={() => setSelected(p => new Set([...p, ...auto.map(s => s.id)]))} className="text-xs text-indigo-400 hover:text-indigo-300">Select all</button>
                  <button onClick={() => setSelected(p => { const n = new Set(p); auto.forEach(s => n.delete(s.id)); return n; })} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
                </>}>
                {list.map(s => (
                  <div key={s.id} className={clsx("flex gap-3 px-4 py-2.5", s.manual ? "opacity-60" : "hover:bg-slate-800/40")}>
                    <input type="checkbox" disabled={s.manual} checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="mt-1 accent-indigo-600 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className={clsx(!s.manual && "cursor-pointer")} onClick={() => !s.manual && toggle(s.id)}>
                        <span className="text-sm font-mono text-slate-300">{tsNo(s.title)}</span>
                        <span className={clsx("ml-2 text-[10px] font-medium px-1.5 py-px rounded border", PRIORITY_STYLE[s.priority])}>{s.priority}</span>
                        {s.manual && <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-slate-400"><Hand size={10} />Manual only — not automated</span>}
                        {!s.manual && <span className="ml-2 text-[10px] text-slate-500">{(s.roles ?? []).map(r => ROLE_LABEL[r]).join(" + ")}</span>}
                        <p className="text-xs text-slate-400 mt-0.5 break-words">{s.title.slice(s.title.indexOf(":") + 2)}</p>
                      </div>
                      {!s.manual && selected.has(s.id) && (s.inputs ?? []).length > 0 && (
                        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                          {(s.inputs ?? []).map(k => inputField(s, k))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </Section>
            );
          })}
        </div>

        {running && <div className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={15} className="animate-spin" />Running…</div>}
        {bgRun?.orphaned && !res && <p className="text-xs text-amber-300">A run was still going when this browser reloaded, so the dashboard lost track of it. Check the terminal.</p>}

        {checks.length > 0 && (
          <div className={clsx("rounded-xl border p-4", failed === 0 ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50")}>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-slate-200 flex-1">{passed}/{checks.length} passed{failed ? `, ${failed} failed` : ""}</p>
              <button onClick={async () => { for (const c of checks) if (c.runId && (c.evidence ?? []).length) await downloadEvidence((c.evidence ?? []).map(e => e.url.split("/").pop()!), { runId: c.runId, runLabel: c.tsLabel ?? c.runId, zipName: `${c.tsLabel ?? c.runId}.zip` }); }}
                disabled={downloading} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white">
                {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}All TS ({evidence.length} files)
              </button>
            </div>
          </div>
        )}

        {queue && queue.items.length > 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Queue · {queue.items.filter(i => i.status !== "pending" && i.status !== "running").length}/{queue.items.length} done</p>
            <div className="flex flex-wrap gap-1.5">
              {queue.items.map((it, i) => (
                <span key={i} title={it.title} className={clsx("inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
                  it.status === "passed" && "border-green-800 text-green-300", it.status === "failed" && "border-red-800 text-red-300", it.status === "running" && "border-indigo-700 text-indigo-300", it.status === "stopped" && "border-amber-800 text-amber-300", it.status === "pending" && "border-slate-700 text-slate-500")}>
                  {it.status === "running" ? <Loader2 size={10} className="animate-spin" /> : it.status === "passed" ? <CheckCircle2 size={10} /> : it.status === "failed" ? <XCircle size={10} /> : it.status === "stopped" ? <Square size={10} /> : null}
                  {tsNo(it.title)}
                </span>
              ))}
            </div>
            {queue.items.filter(i => i.res && !(i.res.result?.checks?.length)).map((i, k) => (
              <p key={k} className="mt-2 text-[11px] text-red-400 break-words">{tsNo(i.title)}: {i.res!.stopped ? "stopped" : i.res!.error ?? "no result — see the Detailed log"}</p>
            ))}
          </div>
        )}

        {checks.map((c, i) => {
          const ev = (c.evidence ?? []).filter((e, idx, arr) => arr.findIndex(x => x.url === e.url) === idx);
          const tl = c.tsLabel ?? "evidence";
          const fileOf = (e: EvidenceItem) => e.url.split("/").pop()!;
          const pickedEv = ev.filter(e => selectedEvidence.has(e.url));
          return (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden min-w-0">
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                {c.status === "passed" ? <CheckCircle2 size={15} className="text-green-400 shrink-0" /> : c.status === "skipped" ? <AlertTriangle size={15} className="text-slate-500 shrink-0" /> : <XCircle size={15} className="text-red-400 shrink-0" />}
                <p className="text-sm text-slate-200 font-medium flex-1 min-w-0 break-words">{c.title}</p>
                <span className="text-[11px] text-slate-600 shrink-0">{Math.round(c.durationMs / 1000)}s</span>
                {ev.length > 0 && c.runId && (
                  <>
                    <button onClick={() => downloadEvidence(pickedEv.map(fileOf), { runId: c.runId!, runLabel: tl })} disabled={downloading || !pickedEv.length}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200"><Download size={11} />Selected ({pickedEv.length})</button>
                    <button onClick={() => downloadEvidence(ev.map(fileOf), { runId: c.runId!, runLabel: tl, zipName: `${tl}.zip` })} disabled={downloading}
                      className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white"><Download size={11} />{tl} evidence</button>
                  </>
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x divide-slate-800">
                <div className="min-w-0">
                  {c.video && <div className="p-3 border-b border-slate-800"><video src={c.video} controls className="w-full rounded-lg border border-slate-800" /></div>}
                  {ev.length > 0 && (
                    <div className="divide-y divide-slate-800/70">
                      {ev.map(e => (
                        <div key={e.url} className="px-4 py-2 flex items-center gap-3 min-w-0">
                          <input type="checkbox" checked={selectedEvidence.has(e.url)} onChange={() => setSelectedEvidence(p => { const n = new Set(p); if (n.has(e.url)) n.delete(e.url); else n.add(e.url); return n; })} className="accent-indigo-600 shrink-0" />
                          {e.kind === "video" ? <Film size={13} className="text-slate-500 shrink-0" /> : e.kind === "file" ? <FileSpreadsheet size={13} className="text-slate-500 shrink-0" /> : <ImageIcon size={13} className="text-slate-500 shrink-0" />}
                          <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                          <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white shrink-0"><Download size={11} />Download</a>
                        </div>
                      ))}
                    </div>
                  )}
                  {(c.details ?? []).length > 0 && (
                    <div className="p-4 border-t border-slate-800">
                      <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><ClipboardList size={12} />Details</p>
                      <dl className="space-y-1.5">
                        {(c.details ?? []).map((d, j) => <div key={j} className="flex items-baseline gap-3 text-xs"><dt className="text-slate-500 shrink-0 max-w-[45%]">{d.label}</dt><dd className="text-slate-200 font-mono break-all">{d.value}</dd></div>)}
                      </dl>
                    </div>
                  )}
                  {!c.video && !ev.length && !(c.details ?? []).length && <p className="p-4 text-xs text-slate-600">No evidence captured for this TS.</p>}
                </div>
                <div className="p-4 min-w-0">
                  {c.friendlyError && <p className="mb-2 text-xs text-red-400/90 break-words">{c.friendlyError}</p>}
                  {c.steps.length > 0 ? <StepList steps={c.steps} /> : <p className="text-xs text-slate-600">No steps recorded.</p>}
                </div>
              </div>
            </div>
          );
        })}
        {evidenceError && <p className="text-[11px] text-red-400">{evidenceError}</p>}

        {(() => {
          const owned = new Set(checks.flatMap(c => (c.evidence ?? []).map(e => e.url)));
          const loose = evidence.filter(e => !owned.has(e.url));
          const runId = responses.find(r => r.runId)?.runId;
          if (!loose.length || !runId) return null;
          return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1 flex items-center gap-1.5"><Film size={12} />Run evidence</p>
                <button onClick={() => downloadEvidence(loose.map(e => e.url.split("/").pop()!), { runId, runLabel: "run" })} disabled={downloading} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"><Download size={11} />All</button>
              </div>
              <div className="divide-y divide-slate-800/70">
                {loose.map(e => (
                  <div key={e.url} className="px-4 py-2 flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                    <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white shrink-0"><Download size={11} />Download</a>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {fullLog && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">Detailed log</p>
              <button onClick={copyLog} className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white" title="Copy the full log">
                {logCopied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}{logCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="px-4 py-4 text-xs text-slate-500 whitespace-pre-wrap break-all max-h-96 overflow-y-auto font-mono">{fullLog}</pre>
          </div>
        )}

        <Section id="history" title={<>Past runs <span className="text-slate-600 normal-case tracking-normal">· evidence kept across runs</span></>} collapsed={collapsed.history !== false}
          onToggle={() => { const opening = collapsed.history !== false; setCollapsed(p => ({ ...p, history: !opening })); if (opening && !historyLoaded) loadHistory(); }}
          extra={<button onClick={() => loadHistory()} disabled={historyLoading} className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-300 disabled:opacity-50"><RefreshCw size={11} className={historyLoading ? "animate-spin" : ""} />Refresh</button>}>
          <div className="p-4 space-y-2">
            {historyError && <p className="text-xs text-red-400">{historyError}</p>}
            {historyLoading && !history.length && <p className="text-xs text-slate-500 flex items-center gap-2"><Loader2 size={13} className="animate-spin" />Loading past runs…</p>}
            {!historyLoading && historyLoaded && !history.length && <p className="text-xs text-slate-500">No past runs found yet.</p>}
            {history.map(h => {
              const open = openHistory === h.runId;
              return (
                <div key={h.runId} className="border border-slate-800 rounded-lg overflow-hidden">
                  <div role="button" tabIndex={0} onClick={() => setOpenHistory(open ? null : h.runId)} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenHistory(open ? null : h.runId); } }}
                    className="flex flex-wrap items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-800/40">
                    {open ? <ChevronDown size={13} className="text-slate-500" /> : <ChevronRight size={13} className="text-slate-500" />}
                    <History size={13} className="text-slate-500" />
                    <span className="text-xs font-mono text-slate-300">{h.runLabel}</span>
                    {h.status === "passed" && <CheckCircle2 size={12} className="text-green-400" />}
                    {h.status === "failed" && <XCircle size={12} className="text-red-400" />}
                    <span className="text-[11px] text-slate-600">{new Date(h.timestamp).toLocaleString()} · {h.evidence.length} file{h.evidence.length === 1 ? "" : "s"}</span>
                    <div className="flex-1" />
                    <button onClick={e => { e.stopPropagation(); downloadEvidence(null, { runId: h.runId, runLabel: h.runLabel }); }} disabled={downloading}
                      className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50"><Download size={11} />All</button>
                  </div>
                  {open && groupByTs(h.evidence).map(([ts, items]) => (
                    <div key={ts} className="border-t border-slate-800">
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30">
                        <span className="text-[11px] font-mono font-semibold text-slate-400 flex-1">{ts}</span>
                        <button onClick={() => downloadEvidence(items.map(e => e.url.split("/").pop()!), { runId: h.runId, runLabel: ts, zipName: `${ts}.zip` })} disabled={downloading}
                          className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50"><Download size={11} />{ts} evidence</button>
                      </div>
                      {items.map(e => (
                        <div key={e.url} className="px-3 py-1.5 flex items-center gap-3 min-w-0">
                          {e.kind === "video" ? <Film size={12} className="text-slate-500 shrink-0" /> : e.kind === "file" ? <FileSpreadsheet size={12} className="text-slate-500 shrink-0" /> : <ImageIcon size={12} className="text-slate-500 shrink-0" />}
                          <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                          <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white shrink-0"><Download size={11} />Download</a>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </Section>
      </div>
    </div>
  );
}
