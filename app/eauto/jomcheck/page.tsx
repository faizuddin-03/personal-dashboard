"use client";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import {
  Play, Square, Loader2, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, Film, RefreshCw, Image as ImageIcon, Download, Copy, Check, ClipboardList, FileSpreadsheet, Repeat, Lock, History, ShieldAlert,
} from "lucide-react";
import clsx from "clsx";
import { useApp } from "@/components/AppShell";
import EvidenceBulkDownload, { EvidenceGroupCheckbox, toEvidenceStatus, type EvidenceGroup, type EvidenceGroupStatus } from "@/components/EvidenceBulkDownload";
import { useTsPassState, TS_PASS_ROW, TS_PASS_TITLE } from "@/lib/tsPassState";
import { DeploySoonHeader } from "@/lib/useDeployReminder";

/** Registry key for this page's run in AppShell's background-run store — see
 *  hooks/useBackgroundRuns.ts. Keeps the run alive across navigating away. */
const RUN_KEY = "eauto/jomcheck";

// EAINT-12339 — [eAuto-JomCheck] Upgrade JomCheck Gateway API Integration
// from v1.9 to v2.0. Specs live in scripts/eauto-jomcheck/tests/*.spec.ts.
// Wholesale (TS40-TS42) is out of scope here — that flow is chatbot-driven, not
// automatable through this UI (Faizuddin, 2026-09-30).
//
// Two kinds of entries, kept in SEPARATE sections in the UI (Faizuddin,
// 2026-10-01, standing rule): "ts" scenarios are numbered TS checks; "setup"
// entries are utilities that create/prepare test data and aren't a TS at
// all. Both live in this one SCENARIOS array (id, title matching the spec's
// test() title EXACTLY — the runner greps by it — summary, `order` for
// ascending sort within its own kind, optional per-scenario input-field
// flags), just rendered into two different boxes below.

/**
 * The reviewed workbook's own section headings, verbatim and in its own
 * order — `_reference/tickets/EAINT-12339/Azila Review - EAINT-12339 -
 * ...Reviewed_20261001.xlsx`, "Test Scenarios" sheet. Each renders as its
 * OWN collapsible box in the checklist (Faizuddin, 2026-10-04: "i want you
 * to make the TS into their own collapsable sections, just like based on
 * the excel"), so the dashboard reads the same way the sheet does rather
 * than as one flat 40-row list.
 *
 * ⚠ Sections are COLLAPSED BY DEFAULT — same request. `collapsed[id]` is
 * undefined until someone touches a section, so the render reads
 * `collapsed[id] !== false` (undefined → collapsed) and `toggleTsSection()`
 * flips against that same default. Do NOT reuse `toggleSection()` here: it
 * computes `!prev[id]`, which on an untouched section turns undefined into
 * true (collapsed → collapsed) and makes the first click do nothing.
 */
const TS_SECTIONS = [
  { id: "tsA", letter: "A", title: "UCD — JomCheck Purchase & Report" },
  { id: "tsB", letter: "B", title: "BackOffice — JomCheck Report Listing" },
  { id: "tsC", letter: "C", title: "BackOffice — Report Listing (existing / pre-push transactions)" },
  { id: "tsD", letter: "D", title: "BackOffice — Report Listing Export" },
  { id: "tsE", letter: "E", title: "BackOffice — JomCheck Transaction Details" },
  { id: "tsF", letter: "F", title: "Service Portal — JomCheck Report Listing" },
  { id: "tsG", letter: "G", title: "Wholesale — JomCheck Purchase & Report" },
  { id: "tsH", letter: "H", title: "API Testing (staging must be connected to JomCheck API)" },
  { id: "tsI", letter: "I", title: "Regression" },
] as const;

type SectionLetter = (typeof TS_SECTIONS)[number]["letter"];

/** Per-section note shown under that section's own rows, replacing the one
 *  giant "Not automated yet" footer the flat list used to carry. */
const TS_SECTION_NOTES: Partial<Record<SectionLetter, string>> = {
  B: "TS06-TS16/TS19-TS24/TS26 are eSim-driven (violet); TS25 needs the JomCheck API (amber) — they need the VPN and edit the eSim claim records of the vehicle no.'s 2-character prefix (restored after the last test). Two expectations here are still unconfirmed: TS06's numbered-vs-bare single-claim format (OQ-13 — currently assumes numbered) and TS12/TS20's \"-\" for a null ClaimsType inside a MIXED claim list (OQ-04 — the SRD only confirms \"-\" for a vehicle with zero claims, which is TS15's case).",
  C: "TS28/TS29 read pre-push J690008380 (BO only). TS30 and TS31 buy via eSim (VPN) — TS31 creates its own failed transaction with eSim Result = Failed, then buys again. TS27 and the TS31 existing-transaction variant take a vehicle no. you type (use Find data); the variant checks the failed row from BackOffice, so it may belong to another company.",
  D: "TS32/TS33 buy via eSim (VPN) and read the export; TS35 exports pre-push J690008380 (BO only). The export's real format has never been captured, so the first run confirms it. TS34 is blocked on OQ-15 (which audit log page records exports).",
  E: "Scope itself is open — OQ-12 asks whether BackOffice Transaction Details is in scope or regression-only.",
  F: "TS37-TS39 each buy a new JomCheck in UCD (eSim sets the claims, VPN), tick \"Share Report with Financial Institution\" for X STAR TECHNOLOGY MALAYSIA SDN BHD before Pay Now (Faizuddin, 05.10.2026), then search it on the Service Portal with Shared Date = today (a From/To search accepts at most one month in eAuto). Counter order is never asserted (OQ-07).",
  G: "Chatbot-driven — not automatable through this UI (Faizuddin, 2026-09-30). Scope is also open per OQ-12.",
  H: "TS43 only covers the 5 fields the BO listing actually renders. Claim-level Possible Total Loss/BER and the raw API response need a dev-provided response, which no UI exposes.",
  I: "TS46 is production verification after the 05.10.2026 deployment — deliberately not automated against production. Owner, timing and account are open per OQ-10.",
};

interface Scenario {
  id: string;
  kind: "ts" | "setup";
  /** Which workbook section this row belongs to — drives which collapsible
   *  box it renders in. "setup" entries have none (own section already). */
  section?: SectionLetter;
  /** Ascending sort key within its own kind — lowest TS number first. */
  order: number;
  /** MUST match the spec's test() title exactly — the runner greps by it. */
  title: string;
  summary: string;
  needsServicePortal?: boolean;
  needsUcd?: boolean;
  needsFreshVehicleNo?: boolean;
  /** Set when this scenario needs a vehicle no. of its OWN, distinct from
   *  every other scenario's — so selecting several such scenarios together
   *  in one run doesn't collide on one vehicle no. Faizuddin, 2026-10-02:
   *  TS06 and TS18 "are checking different things" and must run as separate,
   *  independently-selectable scenarios; each purchases its own vehicle.
   *  Undefined means the scenario shares the single `freshVehicleNo` field
   *  (the "setup" purchase utility, and any single-vehicle TS). */
  vehicleEnvVar?: string;
  /** Set when this scenario needs a CHASSIS no. instead of/alongside a
   *  vehicle no. — TS03 purchases by chassis no., which has no established
   *  running-counter format (unlike vehicle no.s), so it's a plain required
   *  text field the person supplies each run, not auto-generated. */
  needsChassisNo?: boolean;
  /** Reads an EXISTING vehicle from the BO listing (TS17) — shows the
   *  "Existing vehicle no." field. Fills JOMCHECK_MULTI_CLAIM_VEHICLE_NO. */
  needsExistingVehicleNo?: boolean;
  chassisEnvVar?: string;
  /** Flags this scenario yellow in the checklist — Faizuddin, 2026-10-03:
   *  "make the selection in the dashboard yellow, to signal that these TS
   *  require staging to connect to JomCheck API." These TS's own
   *  precondition/Golden Rule only holds in that mode (an eSim-connected
   *  run gets a dummy PDF/random result with nothing real to check), so the
   *  highlight is a reminder to confirm the environment before running. */
  needsApiConnection?: boolean;
  /** Flags this scenario as needing the VPN + eSim claim records on the HX
   *  prefix (TS06-TS16/TS19/TS20 — see esim-claim-boundaries.spec.ts). These
   *  set EXACT claim records on eSim before purchasing, then put HX back the
   *  way it was. Their vehicle no. comes from the same running counter /
   *  fixed value as every other scenario (Faizuddin, 2026-10-01: "allow
   *  running numbers, and allow specific numbers") — it must start with
   *  The eSim prefix is that vehicle no.'s first 2 characters (eSim
   *  prefixes are always 2 characters) — Faizuddin, 2026-10-01: "it will
   *  always use any prefix that is set in the 'fresh vehicle number' field". */
  needsEsimClaimPrefix?: boolean;
  /** No spec exists yet — renders as a disabled, non-selectable row instead
   *  of a checkbox. Added 2026-10-04 so the checklist's TS ordering mirrors
   *  the reviewed workbook ("Azila Review..._Reviewed_20261001.xlsx") 1:1,
   *  including the 14 new/moved TS it introduced, instead of only
   *  mentioning them in the footer. `order` still places it at its correct
   *  position in that sheet, not at the numeric end of the list. */
  notBuilt?: boolean;
  /** The person types this vehicle no. (an existing pre-push transaction —
   *  TS05/TS27/TS31). Faizuddin, 2026-10-04: "allow user to input vehicle
   *  number for the automation to check". Never auto-generated. */
  userVehicleNo?: { envVar: string; placeholder: string };
  /** Set when the row offers a "Find data" button: a separate headless,
   *  fast Playwright run (tests/find-pre-push-data.spec.ts via
   *  /api/eauto-jomcheck/find-data) that looks for a usable pre-push
   *  transaction in BackOffice and shows it on the row to copy/paste into
   *  the vehicle no. field above. Faizuddin, 2026-10-05: "a button in their
   *  row, where it will check for available data headless and fast in the
   *  background. after finishing, it will display the data to be used, so i
   *  can copy and paste in the main handling up top in the dashboard". */
  finder?: "ts27" | "ts31x";
}

const SCENARIOS: Scenario[] = [
  {
    id: "ts01",
    kind: "ts",
    section: "A",
    order: 1,
    title: "12339_TS01: Verify UCD able to purchase JomCheck and the details are displayed correctly",
    summary: "Verify UCD able to purchase JomCheck and the details are displayed correctly",
    needsUcd: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS01_VEHICLE_NO",
  },
  {
    id: "ts02",
    kind: "ts",
    section: "A",
    order: 2,
    title: "12339_TS02: Verify UCD JomCheck reports are displayed correctly",
    summary: "Verify UCD JomCheck reports are displayed correctly",
    needsUcd: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS02_VEHICLE_NO",
    needsApiConnection: true,
  },
  {
    id: "ts03",
    kind: "ts",
    section: "A",
    order: 3,
    title: "12339_TS03: Verify JomCheck report purchased by Chassis No. shows the same re-sourced fields as purchase by Vehicle No.",
    summary: "Verify JomCheck report purchased by Chassis No. shows the same re-sourced fields as purchase by Vehicle No.",
    needsUcd: true,
    needsChassisNo: true,
    chassisEnvVar: "JOMCHECK_TS03_CHASSIS_NO",
  },
  {
    id: "ts04",
    kind: "ts",
    section: "A",
    order: 4,
    title: "12339_TS04: Verify UCD JomCheck purchase flow, price prompt and e-Invoice/report buttons are unchanged",
    summary: "Verify UCD JomCheck purchase flow, price prompt and e-Invoice/report buttons are unchanged",
    needsUcd: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS04_VEHICLE_NO",
  },
  {
    id: "ts05",
    kind: "ts",
    section: "A",
    order: 5,
    title: "12339_TS05: Verify UCD Report button for a JomCheck transaction purchased BEFORE the CR was pushed downloads the report as originally generated",
    summary: "Type the vehicle no. of a pre-push UCD transaction. Opens it (saved pre-push Transaction No., else the oldest Approved row), clicks Report, and checks the PDF still prints the pre-CR claim table. HXJ0001 is also compared with its saved pre-push copy.",
    needsUcd: true,
    userVehicleNo: { envVar: "JOMCHECK_TS05_VEHICLE_NO", placeholder: "e.g. HXJ0001" },
  },
  {
    id: "ts06",
    kind: "ts",
    section: "B",
    order: 6,
    title: "12339_TS06: single claim shows as a numbered line (\"1. ...\")",
    summary: "Sets exactly 1 claim record on eSim, purchases that vehicle via UCD, then checks the BackOffice listing shows ONE numbered line for Odometer/Type of Claim/Parts Approved. Format assumption pending OQ-13.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS06_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts07",
    kind: "ts",
    section: "B",
    order: 7,
    title: "12339_TS07: 2+ claims show as a numbered multi-line list",
    summary: "Sets 2 claim records on eSim, purchases that vehicle, then checks the listing shows a numbered multi-line list (\"1. ...\", \"2. ...\") for each re-sourced column",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS07_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts08",
    kind: "ts",
    section: "B",
    order: 8,
    title: "12339_TS08: mileage buckets at the 10,000km boundary",
    summary: "Sets mileage 9,999 / 10,000 / 10,001 km via eSim and checks Odometer Reading buckets correctly either side of the 10,000km boundary",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS08_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts09",
    kind: "ts",
    section: "B",
    order: 9,
    title: "12339_TS09: mileage buckets at the 300,000km ceiling and the null case",
    summary: "Sets mileage 300,000 / 300,001 / blank via eSim and checks Odometer Reading shows \"More than 300,000 km\" / \"Not Specified\" correctly",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS09_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts10",
    kind: "ts",
    section: "B",
    order: 10,
    title: "12339_TS10: parts-changed buckets at the 10/20 part boundaries",
    summary: "Sets parts-changed 10 / 11 / 20 / 21 via eSim and checks Total No. of Parts Approved buckets correctly across the 10/20-part boundaries",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS10_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts11",
    kind: "ts",
    section: "B",
    order: 11,
    title: "12339_TS11: parts-changed at the 100-part ceiling and the blank case",
    summary: "Sets parts-changed 100 / 101 / blank via eSim and checks the listing shows \"91 to 100 parts\" / \"More than 100 parts\" / \"No information available.\"",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS11_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts12",
    kind: "ts",
    section: "B",
    order: 12,
    title: "12339_TS12: claim code 11 resolves to \"Windscreen (WS)\"; blank resolves to \"-\"",
    summary: "Sets claim code 11 and a blank claim code via eSim and checks Type of Claim shows \"Windscreen (WS)\" / \"-\"",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS12_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts13",
    kind: "ts",
    section: "B",
    order: 13,
    title: "12339_TS13: Possible Total Loss / Possible BER roll up to Yes when ANY claim is Yes",
    summary: "Sets 2 claims (one Total Loss/BER = Yes, one No) via eSim and checks the VEHICLE-level Possible Total Loss/BER columns both show Yes",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS13_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts14",
    kind: "ts",
    section: "B",
    order: 14,
    title: "12339_TS14: Possible Total Loss / Possible BER stay No when every claim is No",
    summary: "Sets 2 claims, both Total Loss/BER = No, via eSim and checks the vehicle-level columns both stay No",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS14_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts15",
    kind: "ts",
    section: "B",
    order: 15,
    title: "12339_TS15: no prior claim history shows \"-\" on the Listing",
    summary: "Clears all claim records via eSim and checks Type of Claim shows \"-\" on the listing; also downloads the Report PDF and logs its text for manual advisory-message review (exact wording not yet confirmed)",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS15_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts16",
    kind: "ts",
    section: "B",
    order: 16,
    title: "12339_TS16: Windscreen claim with no severity shows \"NOT RELEVANT / NO SUM INSURED PROVIDED\"",
    summary: "Sets a Windscreen (code 11) claim with Severity left blank via eSim and checks Incidents Severity Scale shows the advisory text — ⚠ the field mapping for \"no sum insured\" is a best-effort guess, confirm on a live run",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS16_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts18",
    kind: "ts",
    section: "B",
    order: 18,
    title: "12339_TS18: new transaction never shows deprecated-field values",
    summary: "Purchases JomCheck for a fresh vehicle no. via UCD, then checks BackOffice's listing — no blank/N/A/null values in the re-sourced columns, for any claim count",
    needsUcd: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS18_VEHICLE_NO",
  },
  {
    id: "ts17",
    kind: "ts",
    section: "B",
    order: 17,
    title: "12339_TS17: Report Listing shows all 29 columns in the documented order",
    summary: "BackOffice JomCheck Report Listing — column count + order, positional check against the header row",
    needsExistingVehicleNo: true,
  },
  {
    id: "ts19",
    kind: "ts",
    section: "B",
    order: 19,
    title: "12339_TS19: 2 claims stay aligned line-by-line across Odometer/Type/Parts",
    summary: "Sets 2 claims (9,999km/10 parts, 10,001km/11 parts) via eSim and checks each line pairs the right Odometer Reading with the right Total No. of Parts Approved",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS19_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts20",
    kind: "ts",
    section: "B",
    order: 20,
    title: "12339_TS20: 3 claims (code 11 / blank / code 11) stay aligned with Date of Loss",
    summary: "Sets 3 claims (code 11, blank, code 11) with distinct Loss Dates via eSim and checks Type of Claim stays aligned line-by-line with Date of Loss",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS20_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts21",
    kind: "ts",
    section: "B",
    order: 21,
    title: "12339_TS21: Verify Type of Claim maps every ICAP code to the exact description in SRD 2.2.5",
    summary: "eSim: one vehicle with 21 claims (ICAP codes 1-19, 30, 31); each Type of Claim line must match SRD 2.2.5 character for character.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS21_VEHICLE_NO",
  },
  {
    id: "ts22",
    kind: "ts",
    section: "B",
    order: 22,
    title: "12339_TS22: Verify Possible Total Loss = \"Yes\" and Possible BER = \"No\" when only an Actual Total Loss claim exists",
    summary: "eSim: claims OD-ATL + OD; vehicle level TL yes / BER no. Checks both columns' positions and values (catches the 2 columns being swapped).",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS22_VEHICLE_NO",
  },
  {
    id: "ts23",
    kind: "ts",
    section: "B",
    order: 23,
    title: "12339_TS23: Verify Possible Total Loss = \"No\" and Possible BER = \"Yes\" when only a Constructive Total Loss (BER) claim exists",
    summary: "eSim: claims OD + OD-CTL; vehicle level TL no / BER yes. Same position and value checks, opposite direction.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS23_VEHICLE_NO",
  },
  {
    id: "ts24",
    kind: "ts",
    section: "B",
    order: 24,
    title: "12339_TS24: Verify Possible Total Loss / Possible BER are taken from the vehicle-level flags, not recalculated by eAuto from the claims",
    summary: "eSim: 1 claim with both flags No, vehicle level TL yes / BER no — the listing must follow the vehicle level. eSim has separate vehicle-level selects (OQ-14 precondition holds).",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS24_VEHICLE_NO",
  },
  {
    id: "ts25",
    kind: "ts",
    section: "B",
    order: 25,
    title: "12339_TS25: Verify columns NOT changed by this CR still display correctly for a new transaction on API v2.0",
    summary: "Real API purchase (real vehicle no.). Retail/Trade price, Total Loss History (Actual)/(BER) checked against the Report PDF; State in Malaysia = \"-\". The raw-response compare (dev) is not automatable; Severity is logged only.",
    needsUcd: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS25_VEHICLE_NO",
    needsApiConnection: true,
  },
  {
    id: "ts26",
    kind: "ts",
    section: "B",
    order: 26,
    title: "12339_TS26: Verify BackOffice Incidents Severity Scale value passes through and displays correctly for each of the 6 ranges",
    summary: "eSim: 6 claims, one per Severity (LOW … CATASTROPHIC); the listing shows each value in claim order.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS26_VEHICLE_NO",
  },
  {
    id: "ts27",
    kind: "ts",
    section: "C",
    order: 27,
    title: "12339_TS27: Verify an existing (pre-push) transaction with 1 claim keeps the existing single-value display",
    summary: "Type the vehicle no. of a pre-push 1-claim transaction (Find data looks one up in BO). Finds its BO row (Possible Total Loss \"N/A\", no numbering) and checks the 3 claim columns show one bare, raw pre-CR value. BO only.",
    userVehicleNo: { envVar: "JOMCHECK_TS27_VEHICLE_NO", placeholder: "pre-push, 1 claim — use Find data" },
    finder: "ts27",
  },
  {
    id: "ts28",
    kind: "ts",
    section: "C",
    order: 28,
    title: "12339_TS28: Verify an existing (pre-push) transaction with 2+ claims keeps the existing numbered multi-claim display",
    summary: "Pre-push J690008380 (HXJ0001, 2 claims) still shows its stored values, numbered 1 line per claim. Stored values from the 30-09-2026 listing capture. BO only.",
  },
  {
    id: "ts29",
    kind: "ts",
    section: "C",
    order: 29,
    title: "12339_TS29: Verify an existing (pre-push) transaction shows \"N/A\" for Possible Total Loss and Possible BER",
    summary: "Pre-push J690008380: Possible Total Loss / Possible BER read \"N/A\" and sit in the right column positions. BO only.",
  },
  {
    id: "ts30",
    kind: "ts",
    section: "C",
    order: 30,
    title: "12339_TS30: Verify BackOffice listing and export behave identically for an existing (pre-push) transaction and a new transaction, except the 5 affected columns",
    summary: "New eSim transaction (HX0023, 2 claims) vs pre-push J690008380 — 5 affected columns, unaffected columns filled, and listing = export for both.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS30_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts31",
    kind: "ts",
    section: "C",
    order: 31,
    title: "12339_TS31: Verify an existing failed transaction remains unchanged after a new transaction is created for the same vehicle",
    summary: "eSim: Result = Failed, buy → the purchase pays but the report fails (Payment OK, Tx Failed). Then Result back to passing with 1 claim, buy again on the same vehicle. Checks the failed row is unchanged with no report, and the new row has the 5 re-sourced values. No pre-push data needed (Faizuddin, 05.10.2026).",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS31_VEHICLE_NO",
  },
  {
    id: "ts31x",
    kind: "ts",
    section: "C",
    order: 31.5,
    title: "12339_TS31 (existing failed transaction): Verify an existing failed transaction remains unchanged after a new transaction is created for the same vehicle",
    summary: "Same TS31 on an EXISTING pre-push failed transaction, possibly another company's: BackOffice Transaction Enquiry finds the failed row (Payment OK, Tx Failed) and its details show no REPORT button; your UCD buys a new report on that vehicle; BackOffice confirms the old row is unchanged and the new row has the 5 re-sourced values. Type the vehicle no. (Find data lists failed transactions of every company). No eSim.",
    needsUcd: true,
    userVehicleNo: { envVar: "JOMCHECK_TS31X_VEHICLE_NO", placeholder: "pre-push, failed (any company) — use Find data" },
    finder: "ts31x",
  },
  {
    id: "ts32",
    kind: "ts",
    section: "D",
    order: 32,
    title: "12339_TS32: Verify BackOffice JomCheck Report Listing Export matches the listing display",
    summary: "New eSim transaction (HX0025, 2 claims) exported; 29 headers in listing order and every column matches the listing. OQ-09 header suffixes logged, not asserted.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS32_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts33",
    kind: "ts",
    section: "D",
    order: 33,
    title: "12339_TS33: Verify exported range values keep text format and are not auto-converted by Excel",
    summary: "New eSim transaction (HX0026) exported; Odometer Reading / Parts Approved cells are text holding the range.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    vehicleEnvVar: "JOMCHECK_TS33_VEHICLE_NO",
    needsFreshVehicleNo: true,
  },
  {
    id: "ts34",
    kind: "ts",
    section: "D",
    order: 34,
    title: "12339_TS34: Verify BackOffice JomCheck Report Listing export is recorded in the audit log",
    summary: "Deprioritised (Faizuddin, 05.10.2026). SRD REQ-007 Ex2 says the audit log records UserID, file type and export time — a backend record, no BO page known (OQ-15). Not automated.",
    notBuilt: true,
  },
  {
    id: "ts35",
    kind: "ts",
    section: "D",
    order: 35,
    title: "12339_TS35: Verify BackOffice export for an existing (pre-push) transaction matches the listing",
    summary: "Pre-push J690008380 (HXJ0001): export vs listing — stored values, N/A for the 2 new columns, numbered multi-claim cells. BO only.",
  },
  {
    id: "ts36",
    kind: "ts",
    section: "E",
    order: 36,
    title: "12339_TS36: Verify BackOffice JomCheck Details Page download reflects API v2.0 data",
    summary: "Verify BackOffice JomCheck Details Page download reflects API v2.0 data",
    needsUcd: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS36_VEHICLE_NO",
    needsApiConnection: true,
  },
  {
    id: "ts37",
    kind: "ts",
    section: "F",
    order: 37,
    title: "12339_TS37: Verify Service Portal JomCheck Report Listing Export & bulk download reflect the updated Severity ranges",
    summary: "eSim (CATASTROPHIC + MEDIUM claim), UCD purchase shared with X STAR TECHNOLOGY MALAYSIA SDN BHD, then Service Portal: Export XLSX counter column carries all 6 bands and matches the listing row, no Possible Total Loss/BER column; bulk download ZIP holds the report PDF.",
    needsServicePortal: true,
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS37_VEHICLE_NO",
  },
  {
    id: "ts38",
    kind: "ts",
    section: "F",
    order: 38,
    title: "12339_TS38: Verify Service Portal Severity counters show correctly from the eAuto Sdn Bhd (superadmin) account view",
    summary: "eSim (CATASTROPHIC + MEDIUM claim), UCD purchase shared with X STAR TECHNOLOGY MALAYSIA SDN BHD, then superadmin Service Portal: the new report shows Catastrophic 1, Medium 1, the other 4 bands 0. Order logged only (OQ-07).",
    needsServicePortal: true,
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS38_VEHICLE_NO",
  },
  {
    id: "ts39",
    kind: "ts",
    section: "F",
    order: 39,
    title: "12339_TS39: Verify Service Portal JomCheck Report Listing shows no Possible Total Loss/BER, Type of Claim, Odometer Reading or Parts column",
    summary: "eSim (CATASTROPHIC + MEDIUM claim), UCD purchase shared with X STAR TECHNOLOGY MALAYSIA SDN BHD, then Service Portal: no Possible Total Loss / Possible BER / Type of Claim / Odometer Reading / Parts column; Total Loss History still shown on the new row.",
    needsServicePortal: true,
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS39_VEHICLE_NO",
  },
  {
    id: "ts40",
    kind: "ts",
    section: "G",
    order: 40,
    title: "12339_TS40: Verify a new Wholesale transaction shows a JomCheck report with re-sourced fields, reflected in UCD & BO",
    summary: "Chatbot-driven purchase — not automatable through this UI. Scope open per OQ-12.",
    notBuilt: true,
  },
  {
    id: "ts41",
    kind: "ts",
    section: "G",
    order: 41,
    title: "12339_TS41: Verify a Wholesale payment made before this CR was pushed to staging shows the OLD JomCheck report",
    summary: "Chatbot-driven — not automatable through this UI. Scope open per OQ-12.",
    notBuilt: true,
  },
  {
    id: "ts42",
    kind: "ts",
    section: "G",
    order: 42,
    title: "12339_TS42: Verify a Wholesale payment made after this CR was pushed to staging shows the NEW JomCheck report",
    summary: "Chatbot-driven — not automatable through this UI. Scope open per OQ-12.",
    notBuilt: true,
  },
  {
    id: "ts43",
    kind: "ts",
    section: "H",
    order: 43,
    title: "12339_TS43: Verify JomCheck Gateway API v2.0 response returns all 7 new fields, keeps the deprecated fields and is called on the V2.0 endpoint",
    summary: "Real API purchase: the 5 fields the listing shows are populated. Claim-level flags, deprecated fields and the endpoint need the raw response from dev — not automatable.",
    needsUcd: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS43_VEHICLE_NO",
    needsApiConnection: true,
  },
  {
    id: "ts44",
    kind: "ts",
    section: "I",
    order: 44,
    title: "12339_TS44: Verify downloaded JomCheck report always reflects the latest report across all portals",
    summary: "eSim: buys twice on one vehicle no., changing the prefix's claim and flags in between. The second row shows the new values, the first keeps its own.",
    needsUcd: true,
    needsEsimClaimPrefix: true,
    needsFreshVehicleNo: true,
    vehicleEnvVar: "JOMCHECK_TS44_VEHICLE_NO",
  },
  {
    id: "ts45",
    kind: "ts",
    section: "I",
    order: 45,
    title: "12339_TS45: Verify BackOffice JomCheck Report Listing filters and no-match message are unchanged",
    summary: "After Search, the Vehicle No. / Chassis No. filters disable each other; a no-match search shows \"No records found. Please ensure there are existing JomCheck report purchase records.\" BO only.",
  },
  {
    id: "ts46",
    kind: "ts",
    section: "I",
    order: 46,
    title: "12339_TS46: Production verification after deployment on 05.10.2026 (night session)",
    summary: "New (01.10.2026 review) — production verification, gated on OQ-10 (deployment order/timing, owner, account). Not something to automate against production.",
    notBuilt: true,
  },
  {
    id: "purchase",
    kind: "setup",
    order: 1,
    title: "12339_PURCHASE: create JomCheck purchase for a given vehicle no.",
    summary: "Not a TS — logs into UCD and completes a JomCheck purchase for the fresh vehicle no. below. No result checks beyond \"the purchase went through\".",
    needsUcd: true,
    needsFreshVehicleNo: true,
  },
];

const TS_SCENARIOS = SCENARIOS.filter(s => s.kind === "ts").sort((a, b) => a.order - b.order);
/** Only the ones with a real spec behind them — drives "Select all"/"Clear"
 *  and the "N automated" count. `notBuilt` entries still render (disabled)
 *  in TS_SCENARIOS so the checklist's ordering matches the reviewed
 *  workbook, but they're never selectable. */
const BUILT_TS_SCENARIOS = TS_SCENARIOS.filter(s => !s.notBuilt);
/** TS_SCENARIOS bucketed by the workbook's section letter, each already in
 *  `order` ascending — what the per-section collapsible boxes render from. */
const TS_BY_SECTION = TS_SECTIONS.map(sec => ({
  ...sec,
  scenarios: TS_SCENARIOS.filter(s => s.section === sec.letter),
}));
const SETUP_SCENARIOS = SCENARIOS.filter(s => s.kind === "setup").sort((a, b) => a.order - b.order);

interface RunStep {
  title: string;
  duration: number;
  error?: string;
  steps: RunStep[];
}
interface CheckResult {
  title: string;
  status: "passed" | "failed" | "timedOut" | "skipped" | "interrupted";
  durationMs: number;
  error?: string;
  friendlyError?: string;
  steps: RunStep[];
  /** e.g. "12339_TS22" — this TS's own zip name. */
  tsLabel?: string;
  /** This TS's own video / screenshots / downloads, never another TS's. */
  evidence?: EvidenceItem[];
  video?: string;
  /** DETAIL: lines this TS printed. */
  details?: DetailItem[];
  /** Which run folder holds this TS's evidence (each queued TS is its own run). */
  runId?: string;
}

/**
 * Renders the authored test.step() list, always visible, one line per
 * action — same shape as app/eauto/edereg-precheck's plain progress list
 * (`p.label ?? p.step`, a checkmark, nothing else). Faizuddin, 2026-10-02:
 * "i want the steps to be similar to 9306, where it lists out one by one."
 * No collapse toggle, no nested tree rendering (our specs only ever author
 * flat, top-level test.step() calls) — just the human-language title per
 * step. The run route's filterSteps() already strips every raw pw:api/
 * expect entry, so there is no technical "log reading" here to hide.
 */
function StepList({ steps }: { steps: RunStep[] }) {
  return (
    <ul className="space-y-1">
      {steps.map((s, i) => (
        <li key={i} className="flex items-start gap-1.5 text-xs">
          {s.error
            ? <XCircle size={12} className="text-red-400 shrink-0 mt-0.5" />
            : <CheckCircle2 size={12} className="text-green-500/80 shrink-0 mt-0.5" />}
          <span className={clsx("flex-1", s.error ? "text-red-300" : "text-slate-300")}>{s.title}</span>
        </li>
      ))}
    </ul>
  );
}

interface EvidenceItem { label: string; url: string; kind: "video" | "image" | "file"; }

/** Groups evidence by its "<ticket>_TSnn" filename prefix (in TS order);
 *  anything without one lands under "Other". */
function groupByTs(items: EvidenceItem[]): [string, EvidenceItem[]][] {
  const groups = new Map<string, EvidenceItem[]>();
  for (const e of items) {
    const key = e.label.match(/^\d+_TS\d+(?:_TS\d+)*/)?.[0] ?? "Other";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(e);
  }
  return Array.from(groups.entries()).sort(([a], [b]) => (a === "Other" ? 1 : b === "Other" ? -1 : a.localeCompare(b)));
}
interface DetailItem { label: string; value: string; }
/** /api/eauto-jomcheck/find-data response. */
interface FindResult {
  ok: boolean;
  found: { scenario: string; vehicleNo: string; transactionNo: string; createdAt: string; companyName: string; searched: string; extra: Record<string, string> } | null;
  details: DetailItem[];
  error?: string;
}
/** One past run's published evidence — from GET /api/eauto-jomcheck/history.
 *  Faizuddin, 2026-10-03: past runs' evidence (incl. a JomCheck API report —
 *  a limited, precious download) used to be deleted the moment any later
 *  run finished. The run route now keeps a history of runs instead of just
 *  the latest; this is how the dashboard reaches the older ones. */
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

// ── Run queue — same as 9306 (app/eauto/edereg-precheck/page.tsx). Faizuddin,
// 2026-10-01: "the bulk run is not working. i want it to work exactly like
// 9306". Several TS used to go to the run route as ONE Playwright call; 17 TS
// hit the route's 10-minute limit (both 17:05 and 17:12 runs were killed at
// exactly 10:00, leaving no per-TS results). Now each selected TS is its OWN
// run, strictly one at a time, in checklist order; a failure doesn't stop the
// queue; Stop aborts it. Queue state is persisted, so leaving the page and
// coming back keeps it.
type QueueStatus = "pending" | "running" | "passed" | "failed" | "stopped";
interface QueueItem { id: string; title: string; record: boolean; status: QueueStatus; res?: RunResponse; }
interface QueueState { items: QueueItem[]; currentIndex: number; active: boolean; body: Record<string, unknown>; }
const QUEUE_STATE_KEY = "eauto_jomcheck_queue_state";
function loadQueueState(): QueueState | null {
  try { const raw = localStorage.getItem(QUEUE_STATE_KEY); return raw ? (JSON.parse(raw) as QueueState) : null; } catch { return null; }
}
function saveQueueState(state: QueueState | null) {
  try { if (state) localStorage.setItem(QUEUE_STATE_KEY, JSON.stringify(state)); else localStorage.removeItem(QUEUE_STATE_KEY); } catch { /* full */ }
}

const field = "w-full px-3 py-2 border border-slate-700 rounded-lg text-sm bg-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-600";
const label = "block text-xs font-medium text-slate-400 mb-1.5";

/** "12339_TS05: ..." -> "TS05". */
const tsLabel = (s: Scenario) => s.title.slice(6, s.title.indexOf(":"));

/** Chips naming the selected TS a field belongs to — Faizuddin, 2026-10-05:
 *  "for fields that is specific for a TS, make a label for it in the run
 *  configuration so that i know that TS requires a specific data/VN". */
function UsedBy({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
      {scenarios.map(s => (
        <span key={s.id} className="px-1.5 py-px rounded border border-sky-800 bg-sky-950/50 text-[10px] font-semibold text-sky-300">
          {tsLabel(s)}
        </span>
      ))}
    </span>
  );
}

/** A collapsible section — every input/config box on this page uses this so
 *  a ticket with several sections can be collapsed down to just the ones in
 *  use (Faizuddin, 2026-10-02: "for tickets with multiple sections, the
 *  sections should be collapsible"). Collapse state is passed in/out so the
 *  page can persist it alongside the rest of the form's UI state. */
function Section({
  id, title, extra, collapsed, onToggle, children, footer,
}: {
  id: string;
  title: ReactNode;
  extra?: ReactNode;
  collapsed: boolean;
  onToggle: (id: string) => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      {/* A <div role="button">, not a real <button> — the `extra` slot
          (Select all/Clear) renders its own <button>s, and nested <button>
          elements are invalid HTML (React 16.2 flags it as a hydration
          error). */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => onToggle(id)}
        onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(id); } }}
        className="w-full flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 text-left hover:bg-slate-800/30 cursor-pointer"
      >
        {collapsed ? <ChevronRight size={14} className="text-slate-500 shrink-0" /> : <ChevronDown size={14} className="text-slate-500 shrink-0" />}
        <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">{title}</span>
        {/* extra (Select all/Clear, counts, etc.) stops propagation so clicking it doesn't also toggle collapse */}
        {extra && <span onClick={e => e.stopPropagation()} className="flex items-center gap-3">{extra}</span>}
      </div>
      {!collapsed && <div className="divide-y divide-slate-800/70">{children}</div>}
      {!collapsed && footer}
    </div>
  );
}

// ── Persisted state ──────────────────────────────────────────────
// Everything the form holds — credentials, which scenarios were checked,
// the Headless/Detailed toggles, which sections are collapsed — is
// mirrored to localStorage so the page looks exactly the same after
// navigating away and back (Faizuddin, 2026-10-01: "every page should
// retain its latest condition"). Run results themselves already persist via
// useApp()'s background-run registry (hooks/useBackgroundRuns.ts) — this
// covers the FORM half.
const CREDS_KEY = "eauto_jomcheck_creds";
interface Creds { username: string; password: string; ucdUsername: string; ucdPassword: string; spUsername: string; spPassword: string; multiClaimVehicleNo: string; baseUrl: string; }
// UCD username/password default to what Faizuddin gave (2026-10-01) — still
// editable, just pre-filled so the common case needs no typing. Matches
// data/users.ts's own fallback, kept in sync manually (no shared import
// across the app/scripts boundary).
const DEFAULT_CREDS: Creds = { username: "", password: "", ucdUsername: "faizuddin", ucdPassword: "password", spUsername: "", spPassword: "", multiClaimVehicleNo: "", baseUrl: "" };

function loadCreds(): Creds {
  try {
    const raw = localStorage.getItem(CREDS_KEY);
    if (raw) return { ...DEFAULT_CREDS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_CREDS;
}

// "_v2": TS ids were renumbered 2026-10-01 (Azila review order), so a saved
// selection from before would tick different scenarios — start fresh.
const UI_STATE_KEY = "eauto_jomcheck_ui_state_v2";
interface UiState { selected: string[]; headless: boolean; detailed: boolean; collapsed: Record<string, boolean>; autoAdvanceVehicleNo: boolean; userVehicleNos: Record<string, string>; }
// autoAdvanceVehicleNo default true — preserves the existing behaviour
// (running counter, auto-advances on Run) out of the box. Faizuddin,
// 2026-10-03: turning it off should let the typed "Fresh vehicle no." value
// stay exactly as typed across runs (e.g. re-using a known real vehicle no.
// like HXJ0001 for TS02, instead of a synthetic HXA####A one).
const DEFAULT_UI_STATE: UiState = { selected: [], headless: true, detailed: true, collapsed: {}, autoAdvanceVehicleNo: true, userVehicleNos: {} };

function loadUiState(): UiState {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (raw) return { ...DEFAULT_UI_STATE, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return DEFAULT_UI_STATE;
}

// ── Running vehicle-no. counter ──────────────────────────────────
// Format given by Faizuddin, 2026-10-01: "HX" (his assigned eSim prefix) +
// one extension letter (any letter is fine, defaults to "A") + a 4-digit
// running number + a trailing "A" (marks it as automation-created, vs.
// manual). Auto-advances every time Run is clicked for a scenario that
// consumes one, so the field never needs manual editing between runs —
// still a plain text input if an override is ever needed.
const VN_COUNTER_KEY = "eauto_jomcheck_vn_counter";
const VN_PREFIX = "HXA";

function formatVehicleNo(n: number): string {
  return `${VN_PREFIX}${String(n).padStart(4, "0")}A`;
}

// Chassis no. follows the same scheme (Faizuddin, 2026-10-01: "the logic for
// chassis number should also be the same as VN, where the prefix is HX, and
// the rest is running numbers"): "HX" + a zero-padded running number, 17
// characters in all (standard chassis length). Own counter, same auto-advance
// toggle as the vehicle no.
const CN_COUNTER_KEY = "eauto_jomcheck_cn_counter";
const CN_PREFIX = "HX";

// Letters are mixed into the running number so it reads like a real chassis
// no., not a long run of zeros (Faizuddin, 2026-10-01): HX + A## J## C## K## +
// MTA, the 8-digit running number split into pairs. 17 characters; avoids
// I/O/Q, which real chassis numbers never use. E.g. 1 -> HXA00J00C00K01MTA.
function formatChassisNo(n: number): string {
  const d = String(n).padStart(8, "0");
  return `${CN_PREFIX}A${d.slice(0, 2)}J${d.slice(2, 4)}C${d.slice(4, 6)}K${d.slice(6, 8)}MTA`;
}

function loadCnCounter(): number {
  const raw = typeof window !== "undefined" ? localStorage.getItem(CN_COUNTER_KEY) : null;
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function loadVnCounter(): number {
  const raw = typeof window !== "undefined" ? localStorage.getItem(VN_COUNTER_KEY) : null;
  const n = raw ? parseInt(raw, 10) : 1;
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export default function JomCheckPage() {
  // TS rows tinted from the TS Tracker: light green = passed in automation, darker = passed by hand.
  const passState = useTsPassState();
  const savedUi = typeof window !== "undefined" ? loadUiState() : DEFAULT_UI_STATE;
  // Drop any persisted id that no longer matches a scenario — e.g. a leftover
  // from before a scenario was renamed/split (the old combined "ts05-17" id,
  // after the TS06/TS18 split). Left unfiltered, a stale id inflates
  // `selected.size` (and so the Run button's "N cases" label) without ever
  // showing as a checked box, since nothing renders it.
  const VALID_SCENARIO_IDS = new Set(SCENARIOS.filter(s => !s.notBuilt).map(s => s.id));
  const [selected, setSelected] = useState<Set<string>>(
    new Set(savedUi.selected.filter(id => VALID_SCENARIO_IDS.has(id))),
  );
  const [headless, setHeadless] = useState(savedUi.headless);
  const [detailed, setDetailed] = useState(savedUi.detailed);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(savedUi.collapsed);
  const [autoAdvanceVehicleNo, setAutoAdvanceVehicleNo] = useState(savedUi.autoAdvanceVehicleNo);
  // Typed vehicle no. per scenario id (TS05/TS27/TS31 — Scenario.userVehicleNo).
  const [userVehicleNos, setUserVehicleNos] = useState<Record<string, string>>(savedUi.userVehicleNos ?? {});
  // "Find data" per row (Scenario.finder): running flag + last result/error.
  const [finding, setFinding] = useState<Record<string, boolean>>({});
  // "Copied" tick per row for the found vehicle no. The Clipboard API is
  // only available on a secure origin (https / localhost); when the
  // dashboard is opened by LAN IP it is undefined, so fall back to a
  // temporary textarea + execCommand("copy") (Faizuddin, 2026-10-05: "the
  // copy button in the data section is not working").
  const [copiedFind, setCopiedFind] = useState<Record<string, boolean>>({});
  async function copyFound(id: string, text: string) {
    let ok = false;
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); ok = true; } } catch { ok = false; }
    if (!ok) {
      const ta = document.createElement("textarea");
      ta.value = text; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { ok = document.execCommand("copy"); } catch { ok = false; }
      ta.remove();
    }
    setCopiedFind(prev => ({ ...prev, [id]: ok }));
    setTimeout(() => setCopiedFind(prev => ({ ...prev, [id]: false })), 1500);
  }
  const [findResult, setFindResult] = useState<Record<string, FindResult | undefined>>({});
  async function findData(s: Scenario) {
    if (!s.finder || finding[s.id]) return;
    setFinding(prev => ({ ...prev, [s.id]: true }));
    setFindResult(prev => ({ ...prev, [s.id]: undefined }));
    try {
      const r = await fetch("/api/eauto-jomcheck/find-data", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: s.finder, baseUrl: creds.baseUrl, username: creds.username, password: creds.password }),
      });
      const data = await r.json() as FindResult;
      setFindResult(prev => ({ ...prev, [s.id]: data }));
    } catch (e) {
      setFindResult(prev => ({ ...prev, [s.id]: { ok: false, found: null, details: [], error: e instanceof Error ? e.message : String(e) } }));
    } finally {
      setFinding(prev => ({ ...prev, [s.id]: false }));
    }
  }
  function toggleSection(id: string) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  /** Toggle for a section that starts COLLAPSED (the per-TS-section boxes).
   *  `collapsed[id]` is undefined until first touched and those boxes render
   *  as `collapsed[id] !== false`, so flipping has to compare against `false`
   *  — `!prev[id]` would turn undefined into true and make the first click
   *  look like a no-op. */
  function toggleTsSection(id: string) {
    setCollapsed(prev => ({ ...prev, [id]: prev[id] === false }));
  }
  const isTsSectionCollapsed = (id: string) => collapsed[id] !== false;

  const saved = typeof window !== "undefined" ? loadCreds() : DEFAULT_CREDS;
  const [creds, setCreds] = useState<Creds>(saved);
  const set = (k: keyof Creds, v: string) => setCreds(p => ({ ...p, [k]: v }));

  const [vnCounter, setVnCounter] = useState<number>(1);
  const [freshVehicleNo, setFreshVehicleNo] = useState("");
  useEffect(() => {
    const n = loadVnCounter();
    setVnCounter(n);
    setFreshVehicleNo(formatVehicleNo(n));
  }, []);
  function regenerateVehicleNo() {
    const n = loadVnCounter();
    setVnCounter(n);
    setFreshVehicleNo(formatVehicleNo(n));
  }
  function advanceVehicleNoCounter(steps = 1) {
    const next = vnCounter + steps;
    localStorage.setItem(VN_COUNTER_KEY, String(next));
    setVnCounter(next);
    setFreshVehicleNo(formatVehicleNo(next));
  }

  const [cnCounter, setCnCounter] = useState<number>(1);
  const [freshChassisNo, setFreshChassisNo] = useState("");
  useEffect(() => {
    const n = loadCnCounter();
    setCnCounter(n);
    setFreshChassisNo(formatChassisNo(n));
  }, []);
  function regenerateChassisNo() {
    const n = loadCnCounter();
    setCnCounter(n);
    setFreshChassisNo(formatChassisNo(n));
  }
  function advanceChassisNoCounter(steps = 1) {
    const next = cnCounter + steps;
    localStorage.setItem(CN_COUNTER_KEY, String(next));
    setCnCounter(next);
    setFreshChassisNo(formatChassisNo(next));
  }

  const [formError, setFormError] = useState("");
  // VPN reminder before Run — Faizuddin, 2026-10-01: "if at least one TS that
  // requires VPN is selected, when i click the Run button, it will pop up a
  // reminder message, telling me to make sure the VPN is connected".
  // Replaces the earlier "warning text only" choice; the text stays too.
  const [vpnAsk, setVpnAsk] = useState(false);
  // Stop asks first — Faizuddin, 2026-10-01: "if i click stop button while the
  // TS is running, a popup for confirmation will show up first, instead of
  // automatically stopping it."
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

  // Past runs' evidence — lazy-loaded the first time the "Past runs"
  // section is expanded (never on every render), and refetched whenever the
  // CURRENT run finishes so the just-finished run shows up in the list too.
  const [history, setHistory] = useState<HistoryRun[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [expandedHistoryRun, setExpandedHistoryRun] = useState<string | null>(null);

  /** Collapses/expands the "Past runs" section, lazy-loading its data the
   *  first time it's expanded (never fetched on every render/mount). */
  function toggleHistorySection() {
    const aboutToExpand = collapsed.history !== false; // currently collapsed (default) and about to open
    toggleSection("history");
    if (aboutToExpand && !historyLoaded) loadHistory();
  }

  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const r = await fetch("/api/eauto-jomcheck/history");
      if (!r.ok) throw new Error(`Failed to load past runs (${r.status})`);
      const data = await r.json() as { runs: HistoryRun[] };
      setHistory(data.runs);
      setHistoryLoaded(true);
    } catch (e) {
      setHistoryError(e instanceof Error ? e.message : "Failed to load past runs.");
    } finally {
      setHistoryLoading(false);
    }
  }

  // Persist UI state (selected scenarios + toggles + collapsed sections) on
  // every change.
  useEffect(() => {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({ selected: Array.from(selected), headless, detailed, collapsed, autoAdvanceVehicleNo, userVehicleNos }));
  }, [selected, headless, detailed, collapsed, autoAdvanceVehicleNo, userVehicleNos]);

  const { runs, startRun, stopRun } = useApp();
  const bgRun = runs[RUN_KEY];
  const running = !!bgRun?.running;
  const orphaned = !!bgRun?.orphaned;
  const error = formError || bgRun?.error || "";
  const res = (bgRun?.result as RunResponse | null) ?? null;

  const [queue, setQueue] = useState<QueueState | null>(typeof window !== "undefined" ? loadQueueState() : null);
  // Mirrors `queue` so the advance effect reads the latest state without a
  // side effect inside a setState updater (same reason as 9306's queueRef).
  const queueRef = useRef<QueueState | null>(queue);
  useEffect(() => { queueRef.current = queue; }, [queue]);

  function runQueueIndex(q: QueueState, index: number) {
    const item = q.items[index];
    startRun<RunResponse>(RUN_KEY, {
      url: "/api/eauto-jomcheck/run",
      stopUrl: "/api/eauto-jomcheck/run",
      meta: { queueIndex: index, scenarios: [item.id] },
      body: { ...q.body, scenarios: [item.title], record: item.record },
    });
  }

  // Advances the queue as each TS's run finishes — consumed once per runId,
  // even across navigating away and back (bgRun and queue both persist).
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

  // Refresh "Past runs" once a new run finishes, so it shows up without the
  // person having to manually reopen the section — but only if they've
  // already opened it at least once this session (no point fetching a list
  // nobody's looking at).
  useEffect(() => {
    if (historyLoaded && res?.runId) loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [res?.runId]);

  const selectedScenarios = SCENARIOS.filter(s => selected.has(s.id));
  const needsServicePortal = selectedScenarios.some(s => s.needsServicePortal);
  const needsUcd = selectedScenarios.some(s => s.needsUcd);
  const needsFreshVehicleNo = selectedScenarios.some(s => s.needsFreshVehicleNo);
  const distinctVehicleScenarios = selectedScenarios.filter(s => s.needsFreshVehicleNo && s.vehicleEnvVar);
  const chassisScenarios = selectedScenarios.filter(s => s.needsChassisNo);
  const needsChassisNo = chassisScenarios.length > 0;
  const existingVehicleScenarios = selectedScenarios.filter(s => s.needsExistingVehicleNo);
  const needsExistingVehicleNo = existingVehicleScenarios.length > 0;
  const userVehicleScenarios = selectedScenarios.filter(s => s.userVehicleNo).sort((a, b) => a.order - b.order);
  const esimClaimScenarios = selectedScenarios.filter(s => s.needsEsimClaimPrefix);
  const needsEsimClaimPrefix = esimClaimScenarios.length > 0;
  // eSim prefixes are always 2 characters — the vehicle no. in use decides it.
  const esimPrefix = freshVehicleNo.trim().toUpperCase().slice(0, 2);
  // Test-data-setup scenarios never record — Faizuddin, 2026-10-02: "running
  // a test data setup wont record. it will simply show the details." Only
  // skip recording when EVERY selected scenario is a setup utility; any TS
  // (alone or mixed with a setup one) still records as before.

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function run() {
    if (!selected.size) { setFormError("Select at least one test case."); return; }
    const missing: string[] = [];
    if (!creds.username.trim()) missing.push("UCD/BO username");
    if (!creds.password.trim()) missing.push("UCD/BO password");
    if (needsServicePortal) {
      if (!creds.spUsername.trim()) missing.push("Service Portal username");
      if (!creds.spPassword.trim()) missing.push("Service Portal password");
    }
    if (needsUcd) {
      if (!creds.ucdUsername.trim()) missing.push("UCD username");
      if (!creds.ucdPassword.trim()) missing.push("UCD password");
    }
    if (needsFreshVehicleNo && !freshVehicleNo.trim()) missing.push("Fresh vehicle no.");
    if (needsChassisNo && !freshChassisNo.trim()) missing.push("Chassis no.");
    for (const s of userVehicleScenarios) {
      if (!(userVehicleNos[s.id] ?? "").trim()) missing.push(`Vehicle no. (${s.title.slice(6, s.title.indexOf(":"))})`);
    }
    if (missing.length) { setFormError(`Required: ${missing.join(", ")}`); return; }
    // eSim claim records are set on the vehicle no.'s own 2-character prefix.
    if (needsEsimClaimPrefix && esimPrefix.length < 2) {
      setFormError("eSim scenarios need a vehicle no. of at least 2 characters — its first 2 are the eSim prefix.");
      return;
    }
    setFormError("");

    // Scenarios with their OWN vehicleEnvVar (TS06, TS18, ...) each get a
    // DISTINCT vehicle no. off the running counter, so selecting several in
    // one run never collides on one vehicle — Faizuddin, 2026-10-02.
    // Anything else that needs a vehicle no. (the "setup" purchase utility)
    // still shares the single `freshVehicleNo` field, consuming the base
    // counter value itself.
    //
    // This whole counter/collision scheme only applies when auto-advance is
    // ON. Faizuddin, 2026-10-03: turning it off means "maintain as the
    // inputted/current value" — every scenario needing a vehicle no. gets
    // the LITERAL `freshVehicleNo` field value, unchanged, and the field
    // never advances after Run. (Deliberately no per-scenario distinct
    // values in this mode either — fixed mode means exactly that, one fixed
    // value; collisions across scenarios are the person's call once they've
    // turned off the counter.)
    const usesGenericVehicleNo = selectedScenarios.some(s => s.needsFreshVehicleNo && !s.vehicleEnvVar);
    const vehicleEnvVars: Record<string, string> = {};
    let vnOffset = usesGenericVehicleNo ? 1 : 0;
    const fixedVehicleNo = freshVehicleNo.trim().toUpperCase();
    const fixedChassisNo = freshChassisNo.trim().toUpperCase();
    let cnOffset = 0;
    for (const s of selectedScenarios) {
      if (s.needsFreshVehicleNo && s.vehicleEnvVar) {
        vehicleEnvVars[s.vehicleEnvVar] = autoAdvanceVehicleNo ? formatVehicleNo(vnCounter + vnOffset) : fixedVehicleNo;
        vnOffset++;
      }
      // Typed by the person, passed as-is — never off the counter.
      if (s.userVehicleNo) vehicleEnvVars[s.userVehicleNo.envVar] = (userVehicleNos[s.id] ?? "").trim().toUpperCase();
      // Chassis no.: same running-counter / fixed-value rule as the vehicle no.
      if (s.needsChassisNo && s.chassisEnvVar) {
        vehicleEnvVars[s.chassisEnvVar] = autoAdvanceVehicleNo ? formatChassisNo(cnCounter + cnOffset) : fixedChassisNo;
        cnOffset++;
      }
    }

    localStorage.setItem(CREDS_KEY, JSON.stringify(creds));
    // One queue item per selected scenario, in checklist order (setup first,
    // then TS by number). Every item gets the same body — each spec only reads
    // its own JOMCHECK_TSnn_* env var out of `vehicleEnvVars`.
    const ordered = [...selectedScenarios].sort((a, b) =>
      (a.kind === b.kind ? 0 : a.kind === "setup" ? -1 : 1) || a.order - b.order);
    const items: QueueItem[] = ordered.map((sc, i) => ({
      id: sc.id, title: sc.title, record: sc.kind !== "setup", status: i === 0 ? "running" : "pending",
    }));
    const q: QueueState = {
      items, currentIndex: 0, active: true,
      body: { ...creds, freshVehicleNo, vehicleEnvVars, headless, detailed },
    };
    setQueue(q);
    saveQueueState(q);
    setSelectedEvidence(new Set());
    runQueueIndex(q, 0);

    // Auto-advance the running number by however many vehicle no.s this run
    // just consumed, so the NEXT click needs no manual edit, regardless of
    // whether this run succeeds — a vehicle no. is consumed the moment it's
    // submitted, pass or fail. Skipped entirely when the toggle is off: the
    // field stays exactly as typed for the next run too.
    if (autoAdvanceVehicleNo && vnOffset > 0) advanceVehicleNoCounter(vnOffset);
    if (autoAdvanceVehicleNo && cnOffset > 0) advanceChassisNoCounter(cnOffset);
  }

  function stop() {
    // Ends the queue too — the current TS is stopped and nothing after it starts.
    const prev = queueRef.current;
    if (prev) {
      const next = { ...prev, active: false };
      setQueue(next);
      saveQueueState(next);
    }
    stopRun(RUN_KEY);
  }

  // Keyed by URL, not label: two files can share a label (e.g. a TS's own
  // video and the run-level video copy are both "12339_TS37").
  function toggleEvidence(labelKey: string) {
    setSelectedEvidence(prev => {
      const next = new Set(prev);
      if (next.has(labelKey)) next.delete(labelKey); else next.add(labelKey);
      return next;
    });
  }

  /** Downloads either the selected evidence files, or everything, as one
   *  zip — Faizuddin, 2026-10-02: "every test evidence must have a download
   *  and download all button. user must be able to select which evidence
   *  they want to download." Defaults to the CURRENT run; pass `target` to
   *  download a PAST run's evidence instead (from the "Past runs" list). */
  async function downloadEvidence(files: string[] | null, target?: { runId: string; runLabel: string; zipName?: string }) {
    const runId = target?.runId ?? res?.runId;
    if (!runId) return;
    setDownloadingEvidence(true);
    setEvidenceError("");
    try {
      const runLabel = target?.runLabel ?? res?.runLabel ?? runId;
      const r = await fetch("/api/eauto-jomcheck/download-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ runId, runLabel, ...(files ? { files } : {}) }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error ?? `Download failed (${r.status})`);
      }
      const blob = await r.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      // Named after the TS number(s), not the runId — Faizuddin, 2026-10-02.
      a.download = target?.zipName ?? `${runLabel}${files ? "-selected" : ""}.zip`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      setEvidenceError(e instanceof Error ? e.message : "Failed to download evidence.");
    } finally {
      setDownloadingEvidence(false);
    }
  }

  // Results come from EVERY finished queue item (each TS is its own run).
  // Falls back to the last plain run when there is no queue (older state).
  const queueResponses = queue ? queue.items.filter(i => i.res).map(i => i.res!) : (res ? [res] : []);
  const allChecks: CheckResult[] = queueResponses.flatMap(r => (r.result?.checks ?? []).map(c => ({ ...c, runId: r.runId })));
  const result = queueResponses.length
    ? {
        checks: allChecks,
        passed: allChecks.filter(c => c.status === "passed").length,
        failed: allChecks.filter(c => c.status !== "passed" && c.status !== "skipped").length,
        total: allChecks.length,
      }
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
  // Full raw log of every queued TS, one after another, each under its own header.
  const fullLog = queue
    ? queue.items.filter(i => i.res?.log).map(i => `===== ${i.title} =====\n${i.res!.log}`).join("\n\n")
    : (res?.log ?? "");

  /** Copies the full raw log — Faizuddin, 2026-10-02: "the log should be at
   *  the bottom part, with a copy button, so that i can copy and send it to
   *  claude." */
  async function copyLog() {
    if (!fullLog) return;
    try {
      await navigator.clipboard.writeText(fullLog);
      setLogCopied(true);
      setTimeout(() => setLogCopied(false), 2000);
    } catch { /* clipboard permission denied — nothing more we can do */ }
  }

  return (
    <div className="flex flex-col min-h-full">
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center gap-3">
        <CheckCircle2 size={16} className="text-indigo-400" />
        <h1 className="text-sm font-semibold text-slate-200">JomCheck (EAINT-12339)</h1>
        <DeploySoonHeader keys={["EAINT-12339"]} />
        <span className="text-xs text-slate-600 hidden sm:block">Gateway API v1.9→v2.0 — UCD, BackOffice, Service Portal (Wholesale excluded, chatbot-driven)</span>
      </header>

      <div className="p-4 sm:p-6 space-y-5">
        {/* ── Run configuration — a horizontal section at the top, not a
            sidebar column (Faizuddin, 2026-10-01: config fields shouldn't
            eat a narrow column that wastes space at the bottom). ── */}
        <Section id="config" title="Run configuration" collapsed={!!collapsed.config} onToggle={toggleSection}>
          <div className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className={label}>Environment base URL</label>
                <input value={creds.baseUrl} onChange={e => set("baseUrl", e.target.value)} placeholder="staging.eauto.my/uat1 (default)" className={field} />
              </div>
              <div><label className={label}>UCD/BO user <span className="text-red-400">*</span></label>
                <input value={creds.username} onChange={e => set("username", e.target.value)} className={field} /></div>
              <div><label className={label}>Password <span className="text-red-400">*</span></label>
                <input type="password" value={creds.password} onChange={e => set("password", e.target.value)} className={field} /></div>
              {needsUcd && (
                <>
                  <div><label className={label}>UCD user (purchase) <span className="text-red-400">*</span></label>
                    <input value={creds.ucdUsername} onChange={e => set("ucdUsername", e.target.value)} className={field} /></div>
                  <div><label className={label}>Password <span className="text-red-400">*</span></label>
                    <input type="password" value={creds.ucdPassword} onChange={e => set("ucdPassword", e.target.value)} className={field} /></div>
                </>
              )}
              {needsServicePortal && (
                <>
                  <div><label className={label}>Service Portal user <span className="text-red-400">*</span></label>
                    <input value={creds.spUsername} onChange={e => set("spUsername", e.target.value)} className={field} /></div>
                  <div><label className={label}>Password <span className="text-red-400">*</span></label>
                    <input type="password" value={creds.spPassword} onChange={e => set("spPassword", e.target.value)} className={field} /></div>
                </>
              )}
              {needsFreshVehicleNo && (
                <div>
                  <label className={label}>Fresh vehicle no. <span className="text-red-400">*</span></label>
                  <div className="flex gap-1.5">
                    <input value={freshVehicleNo} onChange={e => setFreshVehicleNo(e.target.value.toUpperCase())} className={field} />
                    {autoAdvanceVehicleNo && (
                      <button type="button" onClick={regenerateVehicleNo} title="Reload the next running number" className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600">
                        <RefreshCw size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setAutoAdvanceVehicleNo(v => !v)}
                      title={autoAdvanceVehicleNo
                        ? "Auto-advance is ON — click to turn off and keep this exact value across runs"
                        : "Auto-advance is OFF — this value stays fixed across runs. Click to turn auto-advance back on"}
                      className={clsx(
                        "shrink-0 px-2.5 rounded-lg border transition-colors",
                        autoAdvanceVehicleNo
                          ? "border-indigo-700 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-950/60"
                          : "border-amber-700 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50",
                      )}
                    >
                      {autoAdvanceVehicleNo ? <Repeat size={14} /> : <Lock size={14} />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-slate-500">
                    {!autoAdvanceVehicleNo
                      ? "Fixed — this exact value is used for every run and never changes. Click the lock to turn auto-advance back on."
                      : distinctVehicleScenarios.length > 1
                        ? `Auto-advances after every run — ${distinctVehicleScenarios.map(s => s.id.toUpperCase()).join(" and ")} will each get their own consecutive vehicle no. starting here, so they don't collide.`
                        : "Auto-advances after every run — edit only to override."}
                  </p>
                  {needsEsimClaimPrefix && (
                    <p className="mt-1 text-[11px] text-amber-400">
                      Requires the VPN. {esimClaimScenarios.length} selected scenario{esimClaimScenarios.length === 1 ? "" : "s"} will replace the eSim claim records of prefix &quot;{esimPrefix}&quot; (first 2 characters of this vehicle no.), then restore the original records after the last test.
                    </p>
                  )}
                </div>
              )}
            </div>

            {(needsExistingVehicleNo || userVehicleScenarios.length > 0 || needsChassisNo) && (
              <div className="mt-3 pt-3 border-t border-slate-800">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-sky-400">
                  TS-specific data <span className="normal-case font-normal tracking-normal text-slate-500">— each field is used only by the TS named on it</span>
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {needsExistingVehicleNo && (
                    <div>
                      <label className={label}>Existing vehicle no.<UsedBy scenarios={existingVehicleScenarios} /></label>
                      <input value={creds.multiClaimVehicleNo} onChange={e => set("multiClaimVehicleNo", e.target.value.toUpperCase())} placeholder="HXJ0001 (default)" className={field} />
                    </div>
                  )}
                  {userVehicleScenarios.map(s => {
                    return (
                      <div key={s.id}>
                        <label className={label}>Vehicle no. <span className="text-red-400">*</span><UsedBy scenarios={[s]} /></label>
                        <input
                          value={userVehicleNos[s.id] ?? ""}
                          onChange={e => setUserVehicleNos(prev => ({ ...prev, [s.id]: e.target.value.toUpperCase() }))}
                          placeholder={s.userVehicleNo!.placeholder}
                          className={field}
                        />
                      </div>
                    );
                  })}
                  {needsChassisNo && (
                    <div>
                      <label className={label}>Chassis no. <span className="text-red-400">*</span><UsedBy scenarios={chassisScenarios} /></label>
                      <div className="flex gap-1.5">
                        <input value={freshChassisNo} onChange={e => setFreshChassisNo(e.target.value.toUpperCase())} className={field} />
                        {autoAdvanceVehicleNo && (
                          <button type="button" onClick={regenerateChassisNo} title="Reload the next running number" className="shrink-0 px-2.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-600">
                            <RefreshCw size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setAutoAdvanceVehicleNo(v => !v)}
                          title={autoAdvanceVehicleNo
                            ? "Auto-advance is ON (vehicle no. and chassis no.) — click to keep these exact values across runs"
                            : "Auto-advance is OFF — values stay fixed across runs. Click to turn auto-advance back on"}
                          className={clsx(
                            "shrink-0 px-2.5 rounded-lg border transition-colors",
                            autoAdvanceVehicleNo
                              ? "border-indigo-700 bg-indigo-950/40 text-indigo-300 hover:bg-indigo-950/60"
                              : "border-amber-700 bg-amber-950/30 text-amber-300 hover:bg-amber-950/50",
                          )}
                        >
                          {autoAdvanceVehicleNo ? <Repeat size={14} /> : <Lock size={14} />}
                        </button>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {autoAdvanceVehicleNo
                          ? "Auto-advances after every run (HX + running number mixed with letters) — follows the vehicle no. auto-advance toggle."
                          : "Fixed — this exact value is used for every run (vehicle no. auto-advance is off)."}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-slate-800">
              <label className="flex items-center gap-2 text-xs text-slate-400">
                <input type="checkbox" checked={headless} onChange={e => setHeadless(e.target.checked)} className="accent-indigo-600" />
                Headless
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-400" title="Slows the run down and highlights each button/field/value being acted on or checked, so the recording is easy to review step by step.">
                <input type="checkbox" checked={detailed} onChange={e => setDetailed(e.target.checked)} className="accent-indigo-600" />
                Detailed (slow + highlighted)
              </label>

              <div className="flex-1" />

              {vpnAsk && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setVpnAsk(false)}>
                  <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                      <ShieldAlert size={16} />Is your VPN connected?
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setVpnAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">
                        Not yet — cancel
                      </button>
                      <button onClick={() => { setVpnAsk(false); run(); }} className="flex-1 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                        Confirmed VPN Connected
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {stopAsk && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/70 p-4" onClick={() => setStopAsk(false)}>
                  <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
                    <p className="flex items-center gap-2 text-sm font-semibold text-red-300">
                      <AlertTriangle size={16} />Stop this run?
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-400">
                      The running TS will be cut off where they are. A TS that already changed eSim gets no
                      restore step if it is stopped — check the log for its <span className="font-mono text-slate-300">[esim] … snapshot:</span> line
                      and put those values back by hand.
                    </p>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => setStopAsk(false)} className="flex-1 px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-800">
                        No — keep running
                      </button>
                      <button onClick={() => { setStopAsk(false); stop(); }} className="flex-1 px-4 py-2 text-sm bg-red-700 text-white rounded-lg hover:bg-red-600">
                        Yes — stop the run
                      </button>
                    </div>
                  </div>
                </div>
              )}
              {!running ? (
                <button onClick={() => (needsEsimClaimPrefix ? setVpnAsk(true) : run())} disabled={!selectedScenarios.length} className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-600 transition-colors">
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

        {/* ── Test data setup — utilities that create/prepare data. Placed
            ABOVE the TS section (Faizuddin, 2026-10-02): you set up the data
            a TS needs before running the TS itself, so the page reads in
            the same order the work actually happens. ── */}
        <Section
          id="setup"
          title={<>Test data setup <span className="text-slate-600 normal-case tracking-normal">· not a TS</span></>}
          collapsed={!!collapsed.setup}
          onToggle={toggleSection}
          extra={
            <>
              <button onClick={() => setSelected(prev => new Set([...prev, ...SETUP_SCENARIOS.map(s => s.id)]))} className="text-xs text-indigo-400 hover:text-indigo-300">Select all</button>
              <button onClick={() => setSelected(prev => { const next = new Set(prev); SETUP_SCENARIOS.forEach(s => next.delete(s.id)); return next; })} className="text-xs text-slate-500 hover:text-slate-300">Clear</button>
            </>
          }
        >
          {SETUP_SCENARIOS.map(s => (
            <label key={s.id} className="flex gap-3 px-4 py-2.5 cursor-pointer hover:bg-slate-800/40">
              <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggle(s.id)} className="mt-1 accent-indigo-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="text-sm font-mono text-slate-300">{s.title.split(":")[0]}</span>
                <p className="text-xs text-slate-400 mt-0.5">{s.summary}</p>
              </div>
            </label>
          ))}
        </Section>

        {/* ── Test scenarios — ONE collapsible box per workbook section
            (A-I), each COLLAPSED by default. Faizuddin, 2026-10-04: "i want
            you to make the TS into their own collapsable sections, just
            like based on the excel. make the TS section closed by default.
            user will click to expand it." Sections, their order and their
            titles come from TS_SECTIONS, which mirrors the reviewed
            workbook's own headings; each section's own blocking note (what
            used to be one giant shared footer) lives in
            TS_SECTION_NOTES and renders under that section's rows. ── */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 px-1">
            <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Test scenarios
            </span>
            <span className="text-xs text-slate-600">
              {BUILT_TS_SCENARIOS.length} automated · {TS_SCENARIOS.length - BUILT_TS_SCENARIOS.length} not built · {TS_SECTIONS.length} sections
            </span>
            <div className="flex-1" />
            <button
              onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, false])) }))}
              className="text-xs text-indigo-400 hover:text-indigo-300"
            >
              Expand all
            </button>
            <button
              onClick={() => setCollapsed(prev => ({ ...prev, ...Object.fromEntries(TS_SECTIONS.map(s => [s.id, true])) }))}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Collapse all
            </button>
            <button
              onClick={() => setSelected(prev => { const next = new Set(prev); TS_SCENARIOS.forEach(s => next.delete(s.id)); return next; })}
              className="text-xs text-slate-500 hover:text-slate-300"
            >
              Clear selection
            </button>
          </div>

          {TS_BY_SECTION.map(sec => {
            const built = sec.scenarios.filter(s => !s.notBuilt);
            const selectedHere = sec.scenarios.filter(s => selected.has(s.id)).length;
            const note = TS_SECTION_NOTES[sec.letter];
            return (
              <Section
                key={sec.id}
                id={sec.id}
                title={
                  <>
                    <span className="text-slate-400">{sec.letter}.</span> {sec.title}{" "}
                    <span className="text-slate-600 normal-case tracking-normal">
                      · {built.length}/{sec.scenarios.length} automated
                      {selectedHere > 0 && <span className="text-indigo-400"> · {selectedHere} selected</span>}
                    </span>
                  </>
                }
                collapsed={isTsSectionCollapsed(sec.id)}
                onToggle={toggleTsSection}
                extra={
                  built.length > 0 ? (
                    <>
                      <button
                        onClick={() => setSelected(prev => new Set([...prev, ...built.map(s => s.id)]))}
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        Select all
                      </button>
                      <button
                        onClick={() => setSelected(prev => { const next = new Set(prev); sec.scenarios.forEach(s => next.delete(s.id)); return next; })}
                        className="text-xs text-slate-500 hover:text-slate-300"
                      >
                        Clear
                      </button>
                    </>
                  ) : undefined
                }
                footer={
                  note ? (
                    <div className="px-4 py-3 border-t border-slate-800">
                      <p className="text-[11px] text-slate-500 leading-snug">{note}</p>
                    </div>
                  ) : undefined
                }
              >
                {sec.scenarios.map(s => (
                  <label
                    key={s.id}
                    title={
                      passState(s.title) ? TS_PASS_TITLE[passState(s.title)!]
                      : s.notBuilt
                        ? "No automation yet — see the summary on this row for what's blocking it."
                        : s.needsApiConnection
                          ? "Requires staging to be connected to the JomCheck API — an eSim-connected run returns a dummy/random result this TS can't meaningfully check."
                          : s.needsEsimClaimPrefix
                            ? "Requires the VPN — this TS sets exact claim records on the eSim prefix of the vehicle no. (its first 2 characters) before purchasing, then restores them."
                            : undefined
                    }
                    className={clsx(
                      "flex gap-3 px-4 py-2.5",
                      s.notBuilt ? "cursor-not-allowed opacity-50" : "cursor-pointer",
                      passState(s.title) ? TS_PASS_ROW[passState(s.title)!]
                        : !s.notBuilt && s.needsApiConnection ? "bg-amber-950/20 hover:bg-amber-950/30"
                        : !s.notBuilt && s.needsEsimClaimPrefix ? "bg-violet-950/20 hover:bg-violet-950/30"
                        : !s.notBuilt ? "hover:bg-slate-800/40" : "",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.id)}
                      onChange={() => toggle(s.id)}
                      disabled={s.notBuilt}
                      className="mt-1 accent-indigo-600 shrink-0 disabled:cursor-not-allowed"
                    />
                    <div className="min-w-0 flex-1">
                      <span className={clsx(
                        "text-sm font-mono",
                        s.notBuilt ? "text-slate-500"
                          : s.needsApiConnection ? "text-amber-300" : s.needsEsimClaimPrefix ? "text-violet-300" : "text-slate-300",
                      )}>{s.title.split(":")[0]}</span>
                      {s.notBuilt && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
                          Not built
                        </span>
                      )}
                      {!s.notBuilt && s.needsApiConnection && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-amber-400">
                          <AlertTriangle size={10} />Needs JomCheck API connected
                        </span>
                      )}
                      {!s.notBuilt && s.needsEsimClaimPrefix && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-medium text-violet-400">
                          <AlertTriangle size={10} />Needs VPN + eSim
                        </span>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{s.summary}</p>
                      {s.finder && !s.notBuilt && (
                        <div className="mt-2" onClick={e => e.preventDefault()}>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              disabled={!!finding[s.id] || !creds.username.trim()}
                              onClick={e => { e.preventDefault(); e.stopPropagation(); void findData(s); }}
                              title={creds.username.trim() ? "Searches BackOffice (headless, fast, no recording) for a usable pre-push transaction and shows it here" : "Fill the UCD/BO user and password first"}
                              className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                              {finding[s.id] ? <Loader2 size={11} className="animate-spin" /> : <ClipboardList size={11} />}
                              {finding[s.id] ? "Finding data in BackOffice…" : "Find data"}
                            </button>
                            {finding[s.id] && <span className="text-[11px] text-slate-500">Headless, no recording. Up to a few minutes.</span>}
                          </div>
                          {findResult[s.id]?.found && (() => {
                            const f = findResult[s.id]!.found!;
                            const inField = (userVehicleNos[s.id] ?? "").trim().toUpperCase() === f.vehicleNo.toUpperCase();
                            return (
                              <div className="mt-2 rounded-lg border border-emerald-800/60 bg-emerald-950/30 px-3 py-2 text-xs">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-slate-400">Vehicle no.</span>
                                  <span className="font-mono text-emerald-300 text-sm select-all">{f.vehicleNo}</span>
                                  <button
                                    type="button"
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); void copyFound(s.id, f.vehicleNo); }}
                                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600"
                                  >{copiedFind[s.id] ? <><Check size={10} className="text-green-400" />Copied</> : <><Copy size={10} />Copy</>}</button>
                                  <button
                                    type="button"
                                    disabled={inField}
                                    onClick={e => { e.preventDefault(); e.stopPropagation(); setUserVehicleNos(prev => ({ ...prev, [s.id]: f.vehicleNo.toUpperCase() })); }}
                                    className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500"
                                  >{inField ? <><Check size={10} />In the field above</> : "Use in the field above"}</button>
                                </div>
                                <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
                                  <dt className="text-slate-500">Transaction</dt><dd className="font-mono text-slate-300">{f.transactionNo} · {f.createdAt}</dd>
                                  <dt className="text-slate-500">Company</dt><dd className="text-slate-300">{f.companyName}</dd>
                                  <dt className="text-slate-500">Found in</dt><dd className="text-slate-300">{f.searched}</dd>
                                  {Object.entries(f.extra).map(([k, val]) => (
                                    <Fragment key={k}><dt className="text-slate-500">{k}</dt><dd className="font-mono text-slate-300 whitespace-pre-wrap">{val}</dd></Fragment>
                                  ))}
                                </dl>
                              </div>
                            );
                          })()}
                          {findResult[s.id] && !findResult[s.id]!.found && (
                            <div className="mt-2 rounded-lg border border-red-800/60 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                              <p className="font-medium">No usable transaction found.</p>
                              <p className="mt-0.5 text-red-300/80 whitespace-pre-wrap">{findResult[s.id]!.error}</p>
                              {findResult[s.id]!.details.length > 0 && (
                                <ul className="mt-1.5 space-y-0.5 text-[11px] text-slate-400">
                                  {findResult[s.id]!.details.map((dd, j) => <li key={j}><span className="text-slate-500">{dd.label}:</span> {dd.value}</li>)}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </Section>
            );
          })}
        </div>

        {running && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={15} className="animate-spin" />
            Running {selectedScenarios.length} case{selectedScenarios.length === 1 ? "" : "s"}…
          </div>
        )}
        {res?.stopped && !queue && <p className="text-sm text-amber-400">Run stopped.</p>}

        {queue && queue.items.length > 1 && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">
              Queue · {queue.items.filter(i => i.status !== "pending" && i.status !== "running").length}/{queue.items.length} done
            </p>
            <div className="flex flex-wrap gap-1.5">
              {queue.items.map((it, i) => (
                <span key={i} title={it.title} className={clsx(
                  "inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded border",
                  it.status === "passed" && "border-green-800 text-green-300",
                  it.status === "failed" && "border-red-800 text-red-300",
                  it.status === "running" && "border-indigo-700 text-indigo-300",
                  it.status === "stopped" && "border-amber-800 text-amber-300",
                  it.status === "pending" && "border-slate-700 text-slate-500",
                )}>
                  {it.status === "running" ? <Loader2 size={10} className="animate-spin" />
                    : it.status === "passed" ? <CheckCircle2 size={10} />
                    : it.status === "failed" ? <XCircle size={10} />
                    : it.status === "stopped" ? <Square size={10} /> : null}
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
            <p className="flex-1 text-xs text-amber-200 leading-relaxed">
              A run was still going when this browser reloaded, so the dashboard lost track of it.
              It may well have finished — check the terminal.
            </p>
          </div>
        )}

        {result && (
          <div className={clsx("rounded-xl border p-4", result.failed === 0 ? "bg-green-950/30 border-green-800/50" : "bg-red-950/30 border-red-800/50")}>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-sm font-semibold text-slate-200 flex-1">
                {result.passed}/{result.total} passed{result.failed ? `, ${result.failed} failed` : ""}
              </p>
              <EvidenceBulkDownload groups={currentGroups} selected={bulkPicked} busy={downloadingEvidence}
                onDownload={g => downloadGroups(g)} onClearSelection={() => setBulkPicked(new Set())} />
            </div>
          </div>
        )}

        {/* ── Results, ONE CARD PER TS — Faizuddin, 2026-10-01: "for the results
            in the dashboard, each TS should have their own sections and details
            displayed without being connected/combined with other TS", and "for
            multiple run, i should still be able to choose to download each test
            evidence individually". Each card holds only that TS's own video,
            files, DETAIL lines and steps (the run route maps them per test from
            Playwright's JSON report), with its own zip download plus a
            per-file Download link. ── */}
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
              // De-duplicated by URL: results saved by older API code can
              // carry the same file twice (two "video" attachments from a
              // two-tab test were both published as <TS>.webm, 2026-10-05).
              const ev = (c.evidence ?? []).filter((e, idx, arr) => arr.findIndex(x => x.url === e.url) === idx);
              const det = c.details ?? [];
              const tsLabel = c.tsLabel ?? res?.runLabel ?? "evidence";
              const cardRunId = c.runId ?? res?.runId;
              const fileOf = (e: EvidenceItem) => e.url.split("/").pop()!;
              const picked = ev.filter(e => selectedEvidence.has(e.url));
              return (
                <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div role="button" tabIndex={0} onClick={() => toggleEvidenceCard(`ts:${i}`)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleEvidenceCard(`ts:${i}`); } }}
                    className={`flex flex-wrap items-center gap-2 px-4 py-2.5 cursor-pointer hover:bg-slate-800/40 ${!closedEvidence.has(`ts:${i}`) ? "border-b border-slate-800" : ""}`}>
                    {!closedEvidence.has(`ts:${i}`) ? <ChevronDown size={13} className="text-slate-500 shrink-0" /> : <ChevronRight size={13} className="text-slate-500 shrink-0" />}
                    {ev.length > 0 && cardRunId && <EvidenceGroupCheckbox checked={bulkPicked.has(`cur:${cardRunId}|${i}`)} onChange={() => toggleBulk(`cur:${cardRunId}|${i}`)} />}
                    {c.status === "passed"
                      ? <CheckCircle2 size={15} className="text-green-400 shrink-0" />
                      : c.status === "skipped"
                        ? <AlertTriangle size={15} className="text-slate-500 shrink-0" />
                        : <XCircle size={15} className="text-red-400 shrink-0" />}
                    <p className="text-sm text-slate-200 font-medium flex-1 min-w-0">{c.title}</p>
                    <span className="text-[11px] text-slate-600 shrink-0">{Math.round(c.durationMs / 1000)}s</span>
                    {ev.length > 0 && cardRunId && (
                      <>
                        <button
                          onClick={e => { e.stopPropagation(); downloadEvidence(picked.map(fileOf), { runId: cardRunId, runLabel: tsLabel }); }}
                          disabled={downloadingEvidence || !picked.length}
                          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 transition-colors"
                        >
                          <Download size={11} />Selected ({picked.length})
                        </button>
                        <button
                          onClick={e => { e.stopPropagation(); downloadEvidence(ev.map(fileOf), { runId: cardRunId, runLabel: tsLabel, zipName: `${tsLabel}.zip` }); }}
                          disabled={downloadingEvidence}
                          title={`Download every file of ${tsLabel} as ${tsLabel}.zip`}
                          className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white transition-colors"
                        >
                          {downloadingEvidence ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
                          {tsLabel} evidence
                        </button>
                      </>
                    )}
                  </div>

                  {!closedEvidence.has(`ts:${i}`) && <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 lg:divide-x divide-slate-800">
                    <div className="min-w-0">
                      {c.video && (
                        <div className="p-3 border-b border-slate-800">
                          <video src={c.video} controls className="w-full rounded-lg border border-slate-800" />
                        </div>
                      )}
                      {ev.length > 0 && (
                        <div className="divide-y divide-slate-800/70">
                          {ev.map(e => (
                            <div key={e.url} className="px-4 py-2 flex items-center gap-3">
                              <input type="checkbox" checked={selectedEvidence.has(e.url)} onChange={() => toggleEvidence(e.url)} className="accent-indigo-600 shrink-0" />
                              {e.kind === "video"
                                ? <Film size={13} className="text-slate-500 shrink-0" />
                                : e.kind === "file"
                                  ? <FileSpreadsheet size={13} className="text-slate-500 shrink-0" />
                                  : <ImageIcon size={13} className="text-slate-500 shrink-0" />}
                              <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                              <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors shrink-0">
                                <Download size={11} />Download
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                      {det.length > 0 && (
                        <div className="p-4 border-t border-slate-800">
                          <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2 flex items-center gap-1.5"><ClipboardList size={12} />Details</p>
                          <dl className="space-y-1.5">
                            {det.map((d, j) => (
                              <div key={j} className="flex items-baseline gap-3 text-xs">
                                <dt className="text-slate-500 shrink-0 max-w-[45%]">{d.label}</dt>
                                <dd className="text-slate-200 font-mono break-all">{d.value}</dd>
                              </div>
                            ))}
                          </dl>
                        </div>
                      )}
                      {!c.video && !ev.length && !det.length && (
                        <p className="p-4 text-xs text-slate-600">No evidence captured for this TS.</p>
                      )}
                    </div>

                    <div className="p-4 min-w-0">
                      {c.friendlyError && <p className="mb-2 text-xs text-red-400/90">{c.friendlyError}</p>}
                      {c.steps.length > 0
                        ? <StepList steps={c.steps} />
                        : <p className="text-xs text-slate-600">No steps recorded.</p>}
                    </div>
                  </div>}
                </div>
              );
            })}
          </div>
        )}
        {evidenceError && <p className="text-[11px] text-red-400">{evidenceError}</p>}

        {/* Evidence not tied to any TS (e.g. a stopped run with no per-test
            results) — still listed, so nothing is ever hidden. */}
        {(() => {
          const owned = new Set(checks.flatMap(c => (c.evidence ?? []).map(e => e.url)));
          const loose = evidence.filter(e => !owned.has(e.url));
          if (!loose.length && !(checks.length === 0 && details.length)) return null;
          return (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
                <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1 flex items-center gap-1.5"><Film size={12} />Run evidence</p>
                {loose.length > 0 && (
                  <button
                    onClick={() => downloadEvidence(loose.map(e => e.url.split("/").pop()!))}
                    disabled={downloadingEvidence}
                    className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white transition-colors"
                  >
                    <Download size={11} />All
                  </button>
                )}
              </div>
              {res?.video && checks.length === 0 && (
                <div className="p-3 border-b border-slate-800"><video src={res.video} controls className="w-full rounded-lg border border-slate-800" /></div>
              )}
              <div className="divide-y divide-slate-800/70">
                {loose.map(e => (
                  <div key={e.url} className="px-4 py-2 flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                    <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition-colors shrink-0">
                      <Download size={11} />Download
                    </a>
                  </div>
                ))}
              </div>
              {checks.length === 0 && details.length > 0 && (
                <dl className="p-4 space-y-1.5 border-t border-slate-800">
                  {details.map((d, j) => (
                    <div key={j} className="flex items-baseline gap-3 text-xs">
                      <dt className="text-slate-500 shrink-0">{d.label}</dt>
                      <dd className="text-slate-200 font-mono break-all">{d.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          );
        })()}

        {/* ── Past runs — Faizuddin, 2026-10-03: a JomCheck API report is a
            limited, precious download, so past runs' evidence must stay
            reachable instead of getting silently deleted the moment a
            later run finishes (the run route used to prune every run
            except the latest on every new run). Lazy-loads on first
            expand. ── */}
        <Section
          id="history"
          title={<>Past runs <span className="text-slate-600 normal-case tracking-normal">· evidence kept across runs</span></>}
          collapsed={collapsed.history !== false}
          onToggle={toggleHistorySection}
          extra={
            <button
              onClick={e => { e.stopPropagation(); loadHistory(); }}
              disabled={historyLoading}
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-300 disabled:opacity-50"
            >
              <RefreshCw size={11} className={historyLoading ? "animate-spin" : ""} />Refresh
            </button>
          }
        >
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
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedHistoryRun(isOpen ? null : h.runId)}
                      onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setExpandedHistoryRun(isOpen ? null : h.runId); } }}
                      className="w-full flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-800/40"
                    >
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
                      <button
                        onClick={e => { e.stopPropagation(); downloadEvidence(null, { runId: h.runId, runLabel: h.runLabel }); }}
                        disabled={downloadingEvidence}
                        className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 disabled:opacity-50 transition-colors shrink-0"
                      >
                        <Download size={11} />All
                      </button>
                    </div>
                    {isOpen && (
                      <div className="border-t border-slate-800">
                        {/* Grouped by TS — each file's own "<ticket>_TSnn" prefix —
                            with a per-TS zip, same as the live results cards. */}
                        {groupByTs(h.evidence).map(([ts, items]) => (
                          <div key={ts} className="border-b border-slate-800/70 last:border-b-0">
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800/30">
                              <span className="text-[11px] font-mono font-semibold text-slate-400 flex-1">{ts}</span>
                              <button
                                onClick={() => downloadEvidence(items.map(e => e.url.split("/").pop()!), { runId: h.runId, runLabel: ts, zipName: `${ts}.zip` })}
                                disabled={downloadingEvidence}
                                className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white disabled:opacity-50 transition-colors"
                              >
                                <Download size={11} />{ts} evidence
                              </button>
                            </div>
                        {items.map(e => (
                          <div key={e.url} className="px-3 py-2 flex items-center gap-3">
                            {e.kind === "video"
                              ? <Film size={12} className="text-slate-500 shrink-0" />
                              : e.kind === "file"
                                ? <FileSpreadsheet size={12} className="text-slate-500 shrink-0" />
                                : <ImageIcon size={12} className="text-slate-500 shrink-0" />}
                            <span className="text-xs font-mono text-slate-300 flex-1 truncate">{e.label}</span>
                            <a href={e.url} download className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors shrink-0">
                              <Download size={11} />Download
                            </a>
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

        {/* ── Detailed log — replaces the old separate "Evidence" section's
            slot (Faizuddin, 2026-10-02): "the current evidence section
            should be replaced with the proper detailed log that i can copy
            and share to you." Always shown in full (no collapse toggle) so
            it's ready to copy immediately, not one more click away. ── */}
        {fullLog && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold flex-1">Detailed log</p>
              <button
                onClick={copyLog}
                className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:border-slate-600 hover:bg-slate-700 transition-colors"
                title="Copy the full log — e.g. to paste into a Claude conversation"
              >
                {logCopied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
                {logCopied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="px-4 py-4 text-xs text-slate-500 whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">{fullLog}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
