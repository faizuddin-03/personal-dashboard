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
type InputKey = "month" | "month2" | "state" | "state2" | "vehicle" | "count" | "count2" | "name" | "payDate" | "expectMenu" | "expectKiv" | "expectSig" | "waitMin" | "timeoutMin" | "target";

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
  /** What the month must be — shown under the month field. */
  needs?: string;
  /** Whose full name the "name" field holds (PDF TS). */
  nameRole?: string;
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
  { id: "12028_TS06", section: "A", priority: "P1", title: "12028_TS06: No-role BO user blocked on the Summary page address", roles: ["drafter","norole"] },
  { id: "12028_TS07", section: "A", priority: "P1", title: "12028_TS07: No-role BO user blocked on the Details page address", roles: ["drafter","norole"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS14", section: "B", priority: "P1", title: "12028_TS14: Summary Cars (RM) equals Car Transactions x 1.00 for each month", roles: ["drafter"] },
  { id: "12028_TS15", section: "B", priority: "P1", title: "12028_TS15: Summary Motorcycles (RM) equals Motorcycle Transactions x 2.00 for each month", roles: ["drafter"] },
  { id: "12028_TS16", section: "B", priority: "P1", title: "12028_TS16: Total row sums Car Transactions and Cars (RM)", roles: ["drafter"] },
  { id: "12028_TS17", section: "B", priority: "P1", title: "12028_TS17: Total row sums Motorcycle Transactions and Motorcycles (RM)", roles: ["drafter"] },
  { id: "12028_TS22", section: "B", priority: "P1", title: "12028_TS22: Summary month row equals the Details TOTAL row", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS25", section: "C", priority: "P1", title: "12028_TS25: Running month-close on an approved month keeps statuses and Payment Date", roles: ["drafter"], inputs: ["month","waitMin"], needs: "fully approved" },
  { id: "12028_TS27", section: "D", priority: "P1", title: "12028_TS27: Details TOTAL sums the car columns of 16 states", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS28", section: "D", priority: "P1", title: "12028_TS28: Details TOTAL sums the motorcycle columns of 16 states", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS29", section: "D", priority: "P1", title: "12028_TS29: Each state Cars (RM) equals Car Transactions x 1.00", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS30", section: "D", priority: "P1", title: "12028_TS30: Each state Motorcycles (RM) equals Motorcycle Transactions x 2.00", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS33", section: "D", priority: "P1", title: "12028_TS33: Car counts per state match Transaction Summary Report (State)", roles: ["superadmin","drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS34", section: "D", priority: "P1", title: "12028_TS34: Motorcycle counts per state match Transaction Summary Report (State)", roles: ["superadmin","drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS52", section: "E", priority: "P1", title: "12028_TS52: Drafter buttons disabled on a fully approved month", roles: ["drafter"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS56", section: "F", priority: "P1", title: "12028_TS56: Reviewer buttons disabled with waiting note on a Pending month", roles: ["reviewer"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS57", section: "F", priority: "P1", title: "12028_TS57: Reviewer buttons disabled with waiting note on a KIV month", roles: ["reviewer"], inputs: ["month"], needs: "KIV" },
  { id: "12028_TS58", section: "F", priority: "P1", title: "12028_TS58: Reviewer buttons disabled with waiting note on a Drafter Review Again month", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Review Again" },
  { id: "12028_TS70", section: "F", priority: "P1", title: "12028_TS70: Reviewer buttons disabled on a fully approved month", roles: ["reviewer"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS72", section: "G", priority: "P1", title: "12028_TS72: Approver buttons disabled with waiting note on a Pending month", roles: ["approver"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS73", section: "G", priority: "P1", title: "12028_TS73: Approver buttons disabled with waiting note on a KIV month", roles: ["approver"], inputs: ["month"], needs: "KIV" },
  { id: "12028_TS74", section: "G", priority: "P1", title: "12028_TS74: Approver buttons disabled with waiting note when only the Drafter approved", roles: ["approver"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS75", section: "G", priority: "P1", title: "12028_TS75: Approver buttons disabled with waiting note on a Drafter Review Again month", roles: ["approver"], inputs: ["month"], needs: "Drafter Review Again" },
  { id: "12028_TS76", section: "G", priority: "P1", title: "12028_TS76: Approver buttons disabled with waiting note on a Reviewer Review Again month", roles: ["approver"], inputs: ["month"], needs: "Reviewer Review Again" },
  { id: "12028_TS79", section: "G", priority: "P1", title: "12028_TS79: Approver Approve with tomorrow's date sets Approver Status Approved", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS92", section: "G", priority: "P1", title: "12028_TS92: Approver buttons disabled on a fully approved month", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS108", section: "J", priority: "P1", title: "12028_TS108: Download buttons hidden with pending note on a Pending month", roles: ["approver"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS109", section: "J", priority: "P1", title: "12028_TS109: Download buttons hidden with pending note on a KIV month", roles: ["approver"], inputs: ["month"], needs: "KIV" },
  { id: "12028_TS110", section: "J", priority: "P1", title: "12028_TS110: Download buttons hidden with pending note when only the Drafter approved", roles: ["approver"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS111", section: "J", priority: "P1", title: "12028_TS111: Download buttons hidden with pending note on a Drafter Review Again month", roles: ["approver"], inputs: ["month"], needs: "Drafter Review Again" },
  { id: "12028_TS112", section: "J", priority: "P1", title: "12028_TS112: Download buttons hidden with pending note when the Approver has not approved", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS113", section: "J", priority: "P1", title: "12028_TS113: Download buttons hidden with pending note on a Reviewer Review Again month", roles: ["approver"], inputs: ["month"], needs: "Reviewer Review Again" },
  { id: "12028_TS114", section: "J", priority: "P1", title: "12028_TS114: Approver sees both download buttons on a fully approved month", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS117", section: "J", priority: "P1", title: "12028_TS117: No-role BO user blocked on the PDF download address (manual)", manual: true },
  { id: "12028_TS118", section: "J", priority: "P1", title: "12028_TS118: Download address of a month not fully approved is blocked (manual)", manual: true },
  { id: "12028_TS130", section: "K", priority: "P1", title: "12028_TS130: FMC PDF Pay to Account Holder Name", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS131", section: "K", priority: "P1", title: "12028_TS131: FMC PDF Pay to Bank Name", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS132", section: "K", priority: "P1", title: "12028_TS132: FMC PDF Pay to Bank Account No.", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS136", section: "K", priority: "P1", title: "12028_TS136: FMC PDF Amount Payable equals the month's Cars (RM)", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS137", section: "K", priority: "P1", title: "12028_TS137: FMC PDF amount in words matches the figures", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS151", section: "L", priority: "P1", title: "12028_TS151: MMSDA PDF Pay to Account Holder Name", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS152", section: "L", priority: "P1", title: "12028_TS152: MMSDA PDF Pay to Bank Name", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS153", section: "L", priority: "P1", title: "12028_TS153: MMSDA PDF Pay to Bank Account No.", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS157", section: "L", priority: "P1", title: "12028_TS157: MMSDA PDF Amount Payable equals the month's Motorcycles (RM)", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS158", section: "L", priority: "P1", title: "12028_TS158: MMSDA PDF amount in words matches the figures", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS162", section: "M", priority: "P1", title: "12028_TS162: BO login opens Association Payment Listing without a second login", roles: ["drafter"] },
  { id: "12028_TS163", section: "M", priority: "P1", title: "12028_TS163: Used SSO hand-off address cannot log in again (manual)", manual: true },
  { id: "12028_TS165", section: "M", priority: "P1", title: "12028_TS165: Core logout logs out the open Association Payment Listing tab", roles: ["drafter"] },
  { id: "12028_TS167", section: "M", priority: "P1", title: "12028_TS167: Logout redirect to an outside address stays on eAuto (manual)", manual: true },
  { id: "12028_TS168", section: "M", priority: "P1", title: "12028_TS168: Session-expiry redirect to an outside address stays on eAuto (manual)", manual: true },
  { id: "12028_TS169", section: "M", priority: "P1", title: "12028_TS169: Drafter Approve from two tabs makes one audit row", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS170", section: "M", priority: "P1", title: "12028_TS170: Reviewer Approve from two tabs makes one audit row", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS171", section: "M", priority: "P1", title: "12028_TS171: Approver Approve from two tabs makes one audit row and one payment date", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS172", section: "M", priority: "P1", title: "12028_TS172: Forced Reviewer approval on a Pending month is rejected (manual)", manual: true },
  { id: "12028_TS173", section: "M", priority: "P1", title: "12028_TS173: Forced Approver approval before the Reviewer approves is rejected (manual)", manual: true },
  { id: "12028_TS174", section: "M", priority: "P1", title: "12028_TS174: Forced action on a fully approved month is rejected (manual)", manual: true },
  { id: "12028_TS01", section: "A", priority: "P2", title: "12028_TS01: Drafter sees Association Payment Listing under Reports and opens Summary", roles: ["drafter"] },
  { id: "12028_TS02", section: "A", priority: "P2", title: "12028_TS02: Reviewer sees Association Payment Listing under Reports and opens Summary", roles: ["reviewer"] },
  { id: "12028_TS03", section: "A", priority: "P2", title: "12028_TS03: Approver sees Association Payment Listing under Reports and opens Summary", roles: ["approver"] },
  { id: "12028_TS04", section: "A", priority: "P2", title: "12028_TS04: Multi-role user sees Association Payment Listing under Reports and opens Summary", roles: ["multi"] },
  { id: "12028_TS09", section: "B", priority: "P2", title: "12028_TS09: Search Year 2026 lists 12 months January to December", roles: ["drafter"] },
  { id: "12028_TS11", section: "B", priority: "P2", title: "12028_TS11: Month not yet closed shows No data with no View", roles: ["drafter"], inputs: ["month"], needs: "not yet closed" },
  { id: "12028_TS12", section: "B", priority: "P2", title: "12028_TS12: Closed month shows car and motorcycle counts and amounts", roles: ["drafter"], inputs: ["month"], needs: "closed, with data" },
  { id: "12028_TS19", section: "B", priority: "P2", title: "12028_TS19: Newly closed month starts with all three statuses Pending", roles: ["drafter"], inputs: ["month"], needs: "newly closed" },
  { id: "12028_TS20", section: "B", priority: "P2", title: "12028_TS20: Payment Date shows - before the Approver approves", roles: ["drafter"], inputs: ["month"], needs: "Approver Status Pending" },
  { id: "12028_TS21", section: "B", priority: "P2", title: "12028_TS21: View opens the Details page of that month", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS23", section: "C", priority: "P2", title: "12028_TS23: Month-close on a past month makes its figures appear", roles: ["drafter"], inputs: ["month","waitMin"], needs: "past, not yet closed" },
  { id: "12028_TS24", section: "C", priority: "P2", title: "12028_TS24: Running month-close twice keeps the same figures", roles: ["drafter"], inputs: ["month","waitMin"], needs: "closed" },
  { id: "12028_TS26", section: "D", priority: "P2", title: "12028_TS26: Details lists 16 states with codes 01 to 16", roles: ["drafter"], inputs: ["month"], needs: "closed, with data" },
  { id: "12028_TS35", section: "D", priority: "P2", title: "12028_TS35: Private and company cars both counted under Car", roles: ["drafter"], inputs: ["month","state","count"], needs: "JPJ approval month" },
  { id: "12028_TS36", section: "D", priority: "P2", title: "12028_TS36: Private and company motorcycles both counted under Motorcycle", roles: ["drafter"], inputs: ["month","state","count"], needs: "JPJ approval month" },
  { id: "12028_TS37", section: "D", priority: "P2", title: "12028_TS37: Transaction counted in the month of its JPJ Approved Date", roles: ["drafter"], inputs: ["month","month2","state","vehicle","count","count2"], needs: "JPJ approval month" },
  { id: "12028_TS38", section: "D", priority: "P2", title: "12028_TS38: Approved transaction not yet paid is not counted", roles: ["drafter"], inputs: ["month","state","vehicle","count"], needs: "month of the unpaid transaction" },
  { id: "12028_TS39", section: "D", priority: "P2", title: "12028_TS39: Transaction counted under the dealer's registered state", roles: ["drafter"], inputs: ["month","state","state2","vehicle","count","count2"], needs: "JPJ approval month" },
  { id: "12028_TS41", section: "E", priority: "P2", title: "12028_TS41: Drafter sees Approve and KIV but no Reject on a Pending month", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS42", section: "E", priority: "P2", title: "12028_TS42: Drafter first Approve shows the signature pad", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS44", section: "E", priority: "P2", title: "12028_TS44: Signature pad Cancel leaves Drafter Status Pending", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS45", section: "E", priority: "P2", title: "12028_TS45: Drafter Save and Approve sets Drafter Status Approved", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS46", section: "E", priority: "P2", title: "12028_TS46: Drafter KIV on a Pending month sets Drafter Status KIV", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS47", section: "E", priority: "P2", title: "12028_TS47: Drafter Approve on a Review Again month sets Drafter Status Approved", roles: ["drafter"], inputs: ["month"], needs: "Drafter Review Again" },
  { id: "12028_TS48", section: "E", priority: "P2", title: "12028_TS48: Drafter KIV on a Review Again month sets Drafter Status KIV", roles: ["drafter"], inputs: ["month"], needs: "Drafter Review Again" },
  { id: "12028_TS49", section: "E", priority: "P2", title: "12028_TS49: Drafter action on a KIV month follows the final KIV rule", roles: ["drafter"], inputs: ["month","expectKiv"], needs: "KIV" },
  { id: "12028_TS50", section: "E", priority: "P2", title: "12028_TS50: Drafter buttons disabled after the Drafter approved", roles: ["drafter"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS51", section: "E", priority: "P2", title: "12028_TS51: Drafter buttons disabled on a Reviewer Review Again month", roles: ["drafter"], inputs: ["month"], needs: "Reviewer Review Again" },
  { id: "12028_TS53", section: "E", priority: "P2", title: "12028_TS53: Second Drafter user can approve a Pending month", roles: ["drafter2"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS54", section: "E", priority: "P2", title: "12028_TS54: Second Drafter user cannot approve a month the first Drafter approved", roles: ["drafter2"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS55", section: "E", priority: "P2", title: "12028_TS55: Drafter second approval reuses the signature without the pad", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS59", section: "F", priority: "P2", title: "12028_TS59: Reviewer sees Approve and Reject but no KIV after the Drafter approved", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS60", section: "F", priority: "P2", title: "12028_TS60: Reviewer first Approve shows the signature pad", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS61", section: "F", priority: "P2", title: "12028_TS61: Reviewer Approve sets Reviewer Status Approved", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS62", section: "F", priority: "P2", title: "12028_TS62: Reviewer Reject with blank remarks is not submitted", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS64", section: "F", priority: "P2", title: "12028_TS64: Reviewer Reject Cancel leaves the month unchanged", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS65", section: "F", priority: "P2", title: "12028_TS65: Reviewer Reject with remarks sets Drafter Status Review Again", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS66", section: "F", priority: "P2", title: "12028_TS66: Reviewer sees Approve and Reject on a Reviewer Review Again month", roles: ["reviewer"], inputs: ["month"], needs: "Reviewer Review Again" },
  { id: "12028_TS67", section: "F", priority: "P2", title: "12028_TS67: Reviewer Approve on a Review Again month sets Reviewer Status Approved", roles: ["reviewer"], inputs: ["month"], needs: "Reviewer Review Again" },
  { id: "12028_TS68", section: "F", priority: "P2", title: "12028_TS68: Reviewer Reject on a Review Again month sets Drafter Status Review Again", roles: ["reviewer"], inputs: ["month"], needs: "Reviewer Review Again" },
  { id: "12028_TS69", section: "F", priority: "P2", title: "12028_TS69: Reviewer buttons disabled after the Reviewer approved", roles: ["reviewer"], inputs: ["month"] },
  { id: "12028_TS71", section: "F", priority: "P2", title: "12028_TS71: Reviewer second approval reuses the signature without the pad", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS77", section: "G", priority: "P2", title: "12028_TS77: Approver sees Approve and Reject but no KIV after the Reviewer approved", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS78", section: "G", priority: "P2", title: "12028_TS78: Approver first Approve shows the signature pad then the payment date popup", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS80", section: "G", priority: "P2", title: "12028_TS80: Payment Date shows the picked date in DD-MM-YYYY", roles: ["drafter"], inputs: ["month","payDate"], needs: "approved in 12028_TS79" },
  { id: "12028_TS81", section: "G", priority: "P2", title: "12028_TS81: Payment date popup Cancel leaves Approver Status Pending", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS82", section: "G", priority: "P2", title: "12028_TS82: Blank payment date is rejected", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS83", section: "G", priority: "P2", title: "12028_TS83: Today's date is rejected as payment date", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS84", section: "G", priority: "P2", title: "12028_TS84: Yesterday's date is rejected as payment date", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS85", section: "G", priority: "P2", title: "12028_TS85: Typed payment date is blocked", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS86", section: "G", priority: "P2", title: "12028_TS86: Pasted payment date is blocked", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS87", section: "G", priority: "P2", title: "12028_TS87: Approver Reject with blank remarks is not submitted", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS89", section: "G", priority: "P2", title: "12028_TS89: Approver Reject Cancel leaves the month unchanged", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS90", section: "G", priority: "P2", title: "12028_TS90: Approver Reject with remarks sets Reviewer Status Review Again", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS91", section: "G", priority: "P2", title: "12028_TS91: Approver Reject keeps Payment Date as -", roles: ["drafter"], inputs: ["month"], needs: "rejected in 12028_TS90" },
  { id: "12028_TS93", section: "G", priority: "P2", title: "12028_TS93: Approver second approval reuses the signature and still asks payment date", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS94", section: "G", priority: "P2", title: "12028_TS94: Approver approves a month after the Reviewer re-approves it", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS95", section: "H", priority: "P2", title: "12028_TS95: Multi-role user sees Drafter Approve and KIV on a Pending month", roles: ["multi"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS96", section: "H", priority: "P2", title: "12028_TS96: Multi-role user first Drafter Approve shows the signature pad", roles: ["multi"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS97", section: "H", priority: "P2", title: "12028_TS97: Multi-role user Reviewer step signature pad follows the final signature rule", roles: ["multi"], inputs: ["month","expectSig"], needs: "Drafter Approved" },
  { id: "12028_TS98", section: "H", priority: "P2", title: "12028_TS98: Multi-role user Approver step asks for the payment date", roles: ["multi"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS99", section: "H", priority: "P2", title: "12028_TS99: Multi-role user completes a month alone", roles: ["multi"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS100", section: "H", priority: "P2", title: "12028_TS100: Multi-role user KIV sets Drafter Status KIV", roles: ["multi"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS101", section: "H", priority: "P2", title: "12028_TS101: Multi-role user Reviewer Reject then re-approves as Drafter", roles: ["multi"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS102", section: "H", priority: "P2", title: "12028_TS102: Multi-role user Approver Reject sets Reviewer Status Review Again", roles: ["multi"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS103", section: "H", priority: "P2", title: "12028_TS103: Multi-role user name shows in Prepared Checked and Approved by", roles: ["multi"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS106", section: "I", priority: "P2", title: "12028_TS106: Audit Log keeps every row after a reject loop", roles: ["drafter"], inputs: ["month"], needs: "approved in 12028_TS94" },
  { id: "12028_TS115", section: "J", priority: "P2", title: "12028_TS115: Drafter can download both PDFs on a fully approved month", roles: ["drafter"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS116", section: "J", priority: "P2", title: "12028_TS116: Reviewer can download both PDFs on a fully approved month", roles: ["reviewer"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS120", section: "K", priority: "P2", title: "12028_TS120: FMC PDF file name", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS126", section: "K", priority: "P2", title: "12028_TS126: FMC PDF Date is the Approver's approved date", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS127", section: "K", priority: "P2", title: "12028_TS127: FMC PDF Requestor is the Drafter who approved", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Drafter" },
  { id: "12028_TS128", section: "K", priority: "P2", title: "12028_TS128: FMC PDF Reason for Payment line 1", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS129", section: "K", priority: "P2", title: "12028_TS129: FMC PDF Reason for Payment line 2 month", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS138", section: "K", priority: "P2", title: "12028_TS138: FMC PDF Prepared by shows the Drafter", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Drafter" },
  { id: "12028_TS139", section: "K", priority: "P2", title: "12028_TS139: FMC PDF Checked by shows the Reviewer", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Reviewer" },
  { id: "12028_TS140", section: "K", priority: "P2", title: "12028_TS140: FMC PDF Approved by shows the Approver", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Approver" },
  { id: "12028_TS141", section: "L", priority: "P2", title: "12028_TS141: MMSDA PDF file name", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS147", section: "L", priority: "P2", title: "12028_TS147: MMSDA PDF Date is the Approver's approved date", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS148", section: "L", priority: "P2", title: "12028_TS148: MMSDA PDF Requestor is the Drafter who approved", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Drafter" },
  { id: "12028_TS149", section: "L", priority: "P2", title: "12028_TS149: MMSDA PDF Reason for Payment line 1", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS150", section: "L", priority: "P2", title: "12028_TS150: MMSDA PDF Reason for Payment line 2 month in English", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS159", section: "L", priority: "P2", title: "12028_TS159: MMSDA PDF Prepared by shows the Drafter", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Drafter" },
  { id: "12028_TS160", section: "L", priority: "P2", title: "12028_TS160: MMSDA PDF Checked by shows the Reviewer", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Reviewer" },
  { id: "12028_TS161", section: "L", priority: "P2", title: "12028_TS161: MMSDA PDF Approved by shows the Approver", roles: ["approver"], inputs: ["month","name"], needs: "fully approved", nameRole: "Approver" },
  { id: "12028_TS164", section: "M", priority: "P2", title: "12028_TS164: Logout from Association Payment Listing lands on BO login", roles: ["drafter"] },
  { id: "12028_TS166", section: "M", priority: "P2", title: "12028_TS166: Session expiry returns to BO login without an error page", roles: ["drafter"], inputs: ["timeoutMin"] },
  { id: "12028_TS08", section: "B", priority: "P3", title: "12028_TS08: Year filter starts at 2026 with no earlier year", roles: ["drafter"] },
  { id: "12028_TS10", section: "B", priority: "P3", title: "12028_TS10: Summary shows the listing columns", roles: ["drafter"] },
  { id: "12028_TS13", section: "B", priority: "P3", title: "12028_TS13: Closed month with zero transactions shows 0.00 and can be opened", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS18", section: "B", priority: "P3", title: "12028_TS18: Total row label reads YEAR TO DATE for a part year", roles: ["drafter"] },
  { id: "12028_TS31", section: "D", priority: "P3", title: "12028_TS31: Amounts show the #,##0.00 format", roles: ["drafter"], inputs: ["month"], needs: "has an amount of 1,000+" },
  { id: "12028_TS32", section: "D", priority: "P3", title: "12028_TS32: Car and Motorcycle values shown separately", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS40", section: "D", priority: "P3", title: "12028_TS40: Back to Summary returns to the Summary page", roles: ["drafter"], inputs: ["month"], needs: "closed" },
  { id: "12028_TS43", section: "E", priority: "P3", title: "12028_TS43: Signature pad Clear empties the pad", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS63", section: "F", priority: "P3", title: "12028_TS63: Reviewer Reject with spaces only is not submitted", roles: ["reviewer"], inputs: ["month"], needs: "Drafter Approved" },
  { id: "12028_TS88", section: "G", priority: "P3", title: "12028_TS88: Approver Reject with spaces only is not submitted", roles: ["approver"], inputs: ["month"], needs: "Reviewer Approved" },
  { id: "12028_TS104", section: "I", priority: "P3", title: "12028_TS104: New month Audit Log shows No activity yet", roles: ["drafter"], inputs: ["month"], needs: "Pending" },
  { id: "12028_TS105", section: "I", priority: "P3", title: "12028_TS105: Audit Log shows Date/Time, Role, Action/Status and Remarks", roles: ["drafter"], inputs: ["month"], needs: "rejected in 12028_TS65" },
  { id: "12028_TS107", section: "I", priority: "P3", title: "12028_TS107: Audit Log shows no signature image", roles: ["drafter"], inputs: ["month"], needs: "approved in 12028_TS45" },
  { id: "12028_TS119", section: "J", priority: "P3", title: "12028_TS119: Second download gives the same file", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS121", section: "K", priority: "P3", title: "12028_TS121: FMC PDF company header", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS122", section: "K", priority: "P3", title: "12028_TS122: FMC PDF document title", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS123", section: "K", priority: "P3", title: "12028_TS123: FMC PDF To", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS124", section: "K", priority: "P3", title: "12028_TS124: FMC PDF Attn", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS125", section: "K", priority: "P3", title: "12028_TS125: FMC PDF Adds", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS133", section: "K", priority: "P3", title: "12028_TS133: FMC PDF Pay to Person in charge", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS134", section: "K", priority: "P3", title: "12028_TS134: FMC PDF Pay to Contact Number", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS135", section: "K", priority: "P3", title: "12028_TS135: FMC PDF Pay to Email Address", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS142", section: "L", priority: "P3", title: "12028_TS142: MMSDA PDF company header", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS143", section: "L", priority: "P3", title: "12028_TS143: MMSDA PDF document title", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS144", section: "L", priority: "P3", title: "12028_TS144: MMSDA PDF To", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS145", section: "L", priority: "P3", title: "12028_TS145: MMSDA PDF Attn", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS146", section: "L", priority: "P3", title: "12028_TS146: MMSDA PDF Adds", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS154", section: "L", priority: "P3", title: "12028_TS154: MMSDA PDF Pay to Person in charge", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS155", section: "L", priority: "P3", title: "12028_TS155: MMSDA PDF Pay to Contact Number", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
  { id: "12028_TS156", section: "L", priority: "P3", title: "12028_TS156: MMSDA PDF Pay to Email Address", roles: ["approver"], inputs: ["month"], needs: "fully approved" },
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
  count: "E12028_COUNT", count2: "E12028_COUNT2", name: "E12028_NAME", payDate: "E12028_PAY_DATE",
  expectMenu: "E12028_EXPECT_MENU", expectKiv: "E12028_EXPECT_KIV", expectSig: "E12028_EXPECT_SIG",
  waitMin: "E12028_WAIT_MIN", timeoutMin: "E12028_TIMEOUT_MIN", target: "E12028_TARGET",
};

/** Environments (staging = the /eauto instance from 2026-10-21). Chosen, never prefilled. */
const ENVIRONMENTS = [{ value: "https://staging.eauto.my|eauto", label: "Staging — staging.eauto.my/eauto" }];

function inputLabel(s: { id: string; nameRole?: string; needs?: string }, k: InputKey): string {
  const x = Number(s.id.replace(/^12028_TS/, ""));
  switch (k) {
    case "month": return x === 37 ? "JPJ approval month" : `Month${s.needs ? ` (${s.needs})` : ""}`;
    case "month2": return "Creation month";
    case "state": return "Dealer state";
    case "state2": return "Plate state";
    case "vehicle": return "Vehicle type";
    case "count": return x === 37 ? "Count, approval month" : x === 39 ? "Count, dealer state" : x === 38 ? "Count (paid only)" : "Count (private + company)";
    case "count2": return x === 37 ? "Count, creation month" : "Count, plate state";
    case "name": return `${s.nameRole ?? ""} full name (as on the PDF)`;
    case "payDate": return "Payment date picked in 12028_TS79 (DD-MM-YYYY)";
    case "expectMenu": return "BA answer: menu item for a no-role user";
    case "expectKiv": return "Final KIV rule (BA)";
    case "expectSig": return "Final signature rule (BA)";
    case "waitMin": return "Month-close wait (minutes, ≥ one cron interval)";
    case "timeoutMin": return "Session timeout (minutes, from the developer)";
    case "target": return "Move it to";
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
        if (!v) missing.push(`${tsNo(s.id)} ${inputLabel(SCENARIOS.find(x => x.id === s.id) ?? { id: s.id }, k)}`);
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
  function inputField(s: { id: string; needs?: string; nameRole?: string }, k: InputKey): ReactNode {
    const v = rows[s.id]?.[k] ?? "";
    const set = (x: string) => setRow(s.id, k, x);
    let control: ReactNode;
    if (k === "month" || k === "month2") control = (
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
