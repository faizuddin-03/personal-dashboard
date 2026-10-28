// Catalogue of the per-ticket automation pages shown on /tickets.
//
// One entry per page under app/eauto/<page>. The sidebar "Tickets" item links
// to /tickets (a list of these, card or list view), not to a dropdown of
// ticket numbers — Faizuddin, 2026-10-15: "instead of a dropdown, when i click
// the sidemenu 'tickets', it will open a page with a list of all the ticket's
// automation. view can have card or list view, detailed or simple view".
//
// Keep `label` as the ticket number only — the page header carries the
// summary (knowledge/automation-testing.md § Navigation).

export type AutomationKind = "tester" | "checker" | "semi" | "planned";

export type AutomationStatus =
  | "automated"      // runnable end to end from the page
  | "partial"        // some TS runnable, the rest manual / blocked
  | "semi"           // runs headed and stops for a person (captcha, QR scan)
  | "data-prep"      // not a test: prepares or validates test data
  | "paused"         // built or started, then parked pending a team decision
  | "planned";       // page exists, no automation yet

export interface TicketAutomation {
  /** Ticket number(s) shown on the card. */
  label: string;
  /** Jira keys covered by the page. */
  keys: string[];
  href: string;
  /** lucide icon name — resolved in app/tickets/page.tsx. */
  icon: string;
  /** Jira summary, emoji stripped. */
  title: string;
  module: string;
  portals: string[];
  kind: AutomationKind;
  status: AutomationStatus;
  /** One line for the simple view. */
  summary: string;
  /** Detailed view: what the page does, what it can and cannot run. */
  details: string[];
  /** TS counts where known. */
  coverage?: { automated: number; total: number };
  /** Where the specs live. */
  scripts?: string;
  /** YYYY-MM-DD this dashboard page was created (the app/eauto/<page> folder's
   *  creation date on this PC; git history starts 2026-09-21, too late to use). */
  createdAt: string;
  /** YYYY-MM-DD of the last substantive change to the page or suite. */
  updatedAt: string;
}

export const TICKET_AUTOMATIONS: TicketAutomation[] = [
  {
    label: "12028",
    keys: ["EAINT-12028"],
    createdAt: "2026-10-28",
    href: "/eauto/12028",
    icon: "Receipt",
    title: "[eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)",
    module: "BackOffice — Association Payment Listing",
    portals: ["BackOffice"],
    kind: "tester",
    status: "partial",
    summary: "166 of 174 TS automated (pipeline build): Summary, Details figures, Drafter / Reviewer / Approver workflow, audit log, FMC / MMSDA Payment Request PDFs, login / session / double submit. 8 TS manual only.",
    details: [
      "Built 2026-10-28 by the pipeline (Dwarf) from Elf's approved scenarios; P1 TS listed first. Not run yet.",
      "No live capture of the module: Summary / Details selectors come from the 31.07 mock-up [unconfirmed] until the first run.",
      "Workflow TS act on a month typed on the row and stop first if it is not in the needed status; 12028_PREP moves a month to a status.",
      "Manual only: 12028_TS117, TS118, TS163, TS167, TS168, TS172 to TS174 (address replay, redirect tampering, forced requests).",
    ],
    coverage: { automated: 166, total: 174 },
    scripts: "scripts/eauto-12028",
    updatedAt: "2026-10-28",
  },
  {
    label: "12107 + 12327",
    keys: ["EAINT-12107", "EAINT-12327"],
    createdAt: "2026-10-15",
    href: "/eauto/12107",
    icon: "Wallet",
    title: "[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay + [CIBO] Enhance Payment Mode Column Format",
    module: "Secarang payment / CIBO",
    portals: ["Secarang", "CIBO"],
    kind: "tester",
    status: "partial",
    summary: "Secarang GrabPay OK / Failed and card / FPX regression, plus the CIBO Payment Channel filter and every 12327 Payment Mode check; only the dev-patch rows (12107_TS03-05) stay manual.",
    details: [
      "Combined test script: 12107_TS01-TS08 and 12327_TS01-TS08, tested together for release S34.X (20/21 Oct 2026).",
      "Built 2026-10-15 on the scripts/secarang-insurance chain: queue of one TS per run, detailed mode, per-TS evidence, receipt PDF saved.",
      "Not yet run live: the GrabPay tile, Full Amount option and the Fiuu e-wallet / card popups use unconfirmed selectors — the first run logs them for capture.",
      "CIBO specs added 2026-10-16 from live staging HTML (tests/cibo.spec.ts); refs typed per payment method. Built against pre-push staging pages; run after dev pushes 12107 / 12327.",
    ],
    coverage: { automated: 13, total: 16 },
    scripts: "scripts/eauto-12107",
    updatedAt: "2026-10-16",
  },
  {
    label: "12412",
    keys: ["EAINT-12412"],
    createdAt: "2026-10-15",
    href: "/eauto/12412",
    icon: "Receipt",
    title: "[eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge",
    module: "JomCheck — invoice / e-Invoice",
    portals: ["UCD", "BackOffice"],
    kind: "tester",
    status: "partial",
    summary: "Invoice and e-Invoice split into RM18.00 + RM2.00 lines; 6 of 12 TS runnable plus two pre-deployment data setups (Approved / Failed transaction).",
    details: [
      "Built 2026-10-15 on the scripts/eauto-jomcheck page objects; own run route (35-minute per-TS limit for the real payment plus the LHDN e-Invoice wait).",
      "Run the two setups BEFORE the dev push to the chosen environment; TS08 / TS09 take the vehicle no.s they print. TS numbers renumbered ascending on 2026-10-19.",
      "Manual: TS02 (Wholesale chatbot), TS06 (SST Payment Report), TS07 (MyInvois), TS10-TS12 (finance reports, Download Payment Document, eSTM / Insurance invoices). First live runs on uat1, 19 Oct: TS01, TS05, TS08 pass; TS09 found EAINT-12554 (Invoice still 1 line after resubmit).",
    ],
    coverage: { automated: 6, total: 12 },
    scripts: "scripts/eauto-jomcheck/tests/invoice-split-12412*.spec.ts",
    updatedAt: "2026-10-19",
  },
  {
    label: "12339",
    keys: ["EAINT-12339"],
    createdAt: "2026-09-30",
    href: "/eauto/jomcheck",
    icon: "CheckSquare",
    title: "[eAuto-JomCheck] Upgrade JomCheck Gateway API Integration from v1.9 to v2.0",
    module: "JomCheck",
    portals: ["UCD", "BackOffice", "Service Portal"],
    kind: "tester",
    status: "partial",
    summary: "Checklist runner across UCD, BackOffice and Service Portal; one TS per run call, queued.",
    details: [
      "Sections A-I mirror the reviewed workbook; each is its own collapsible box, collapsed by default.",
      "eSim-driven rows need the VPN; Wholesale (TS40-TS42) is chatbot-driven and out of scope.",
      "Setup utilities (test-data creation) sit in their own box, separate from the numbered TS.",
    ],
    scripts: "scripts/eauto-jomcheck",
    updatedAt: "2026-10-05",
  },
  {
    label: "12166 + 12167",
    keys: ["EAINT-12166", "EAINT-12167"],
    createdAt: "2026-09-23",
    href: "/eauto/12166",
    icon: "Barcode",
    title: "[eAuto-BackOffice] Service Hub: Enable DO Creation for Device Purchase + Allow Ops to Input Device SN when updating Delivery Status to Arranged",
    module: "Service Hub — Device Purchase",
    portals: ["BackOffice", "UCD"],
    kind: "tester",
    status: "partial",
    summary: "Combined E2E suite (DO generation + serial capture) plus a User Access Regression tab.",
    details: [
      "6 of 8 combined-study TS cases automated (2026-09-23); TS04 / TS05 need dev coordination or legacy test data.",
      "Reference implementation for detailed mode (slow + highlighted) — every new automation copies it.",
      "Both tabs stay mounted so a background run survives switching tabs.",
    ],
    coverage: { automated: 6, total: 8 },
    scripts: "tests/service-hub/specs/device-purchase-do-ts*.spec.ts",
    updatedAt: "2026-09-25",
  },
  {
    label: "12257",
    keys: ["EAINT-12257"],
    createdAt: "2026-09-03",
    href: "/eauto/duitnow-qr",
    icon: "QrCode",
    title: "[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application",
    module: "Application — payment channels",
    portals: ["UCD"],
    kind: "semi",
    status: "semi",
    summary: "Runs headed and stops twice for a person: the reCAPTCHA tick and the QR scan on a phone.",
    details: [
      "Drives everything up to the QR popup, pauses for the scan and approve / reject, then resumes and asserts the outcome.",
      "Cannot go headless; not a candidate for the nightly runner.",
    ],
    scripts: "scripts/eauto-duitnow-qr",
    updatedAt: "2026-09-10",
  },
  {
    label: "12257",
    keys: ["EAINT-12257"],
    createdAt: "2026-10-21",
    href: "/eauto/12257",
    icon: "QrCode",
    title: "[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application",
    module: "UCD onboarding — Pre-Application + Application payment",
    portals: ["UCD", "BackOffice"],
    kind: "semi",
    status: "partial",
    summary: "Official TS v23, 12257_TS1–TS13, each a full onboarding chain. DuitNow QR legs scan the QR on Fiuu's viewqr page (Scan an Image File); Cancel, close-window and timer-expiry are driven by the run. A person ticks the reCAPTCHA.",
    details: [
      "Split from the 12153 suite on 2026-10-21: scripts/eauto-12257 is a copy of scripts/eauto-12153 with its own spec, routes and page.",
      "DuitNow QR reached staging /obs on 2026-10-22: TS1–TS5 and TS11–TS13 (payment retry) runnable; the QR screens were captured and TS1 passed end to end on 2026-10-22. TS10 (FPX B2B, was TS11) runnable from 2026-10-22 (B2B screens not captured yet). TS6–TS9 regression runnable.",
      "The viewqr scan was verified with a made-up QR (amount read, Approve / Reject not clicked). BO: the Application listing's Registration Fee = Failed is checked between a failed attempt and the retry; the Pre-Application listing has no payment column.",
    ],
    coverage: { automated: 12, total: 13 },
    scripts: "scripts/eauto-12257",
    updatedAt: "2026-10-22",
  },
  {
    label: "12153",
    keys: ["EAINT-12153"],
    createdAt: "2026-10-21",
    href: "/eauto/12153",
    icon: "Building2",
    title: "[eAuto-Application] Add Payment Channels for Pre-application and Application",
    module: "UCD onboarding — Pre-Application + Application payment",
    portals: ["UCD", "BackOffice"],
    kind: "semi",
    status: "partial",
    summary: "Official TS v42, 12153_TS1–TS12: each TS runs the full onboarding chain (eSIM SSM seed → Pre-Application → Fiuu → BO approve → Application → BO approve / verify → registration fee). A person ticks the reCAPTCHA.",
    details: [
      "Built 2026-10-21 from the live Sdn Bhd walk-through on staging (knowledge/flow-ucd-onboarding.md) and Azila's 12341 onboarding robot.",
      "TS5–TS8 (FPX B2C, card) runnable; FPX B2B reached staging on 2026-10-22: TS1–TS2 runnable (B2B screens not captured yet); TS3–TS4 runnable: maker Authorize, checker Approve on /fpx-b2b/pending by Order ID, refresh (built 2026-10-22 from Faizuddin's steps, markup not captured yet).",
      "TS9–TS12 (payment retry, added in v42 on 2026-10-22): BO Payment Details, close the browser and reopen the link, link opened in a second session, BO listing payment status.",
      "Company per TS typed on its row or picked from the Company Details Checker; names follow UDIN ONBOARD TESTING <TYPE><NNNN>. Not yet run end to end by the script.",
    ],
    coverage: { automated: 8, total: 12 },
    scripts: "scripts/eauto-12153",
    updatedAt: "2026-10-22",
  },
  {
    label: "12153",
    keys: ["EAINT-12153"],
    createdAt: "2026-08-21",
    href: "/eauto/company-details-checker",
    icon: "Building2",
    title: "[eAuto-Application] Add Payment Channels for Pre-application and Application — Company Details Checker",
    module: "Application — test data",
    portals: ["BackOffice"],
    kind: "checker",
    status: "data-prep",
    summary: "Confirms Company ROC / New ROC / TIN are not already used in staging before onboarding a company.",
    details: [
      "A checker, not a tester: no recording, no pass / fail against UI behaviour, so it is not slowed down.",
      "Prepares data for the 12153 payment-channel tests; it is not that feature itself.",
    ],
    scripts: "scripts/eauto-company-checker",
    updatedAt: "2026-09-05",
  },
  {
    label: "9306",
    keys: ["EAINT-9306"],
    createdAt: "2026-08-20",
    href: "/eauto/edereg-precheck",
    icon: "ClipboardList",
    title: "[eAuto-AATF] eDereg Pre-Check as a compulsory step in the eDereg transaction creation flow",
    module: "eDereg",
    portals: ["UCD"],
    kind: "tester",
    status: "partial",
    summary: "Queue runner (one TS per run call) — the pattern every multi-TS page copies.",
    details: [
      "TS11 P2 failed live on 2026-09-03 on the reshow rule and was rewritten; TS12 P2 has never been run.",
      "Reference for QueueState / runQueueIndex / processedRunId (knowledge/automation-testing.md).",
    ],
    scripts: "scripts/eauto-edereg-precheck",
    updatedAt: "2026-09-03",
  },
  {
    label: "11864",
    keys: ["EAINT-11864"],
    createdAt: "2026-08-17",
    href: "/eauto/quotation-reminder",
    icon: "Mail",
    title: "Quotation reminder email",
    module: "Insurance — quotation reminder",
    portals: ["UCD", "Mailtrap"],
    kind: "tester",
    status: "paused",
    summary: "Time-sensitive cases built around the hourly 07:00-23:00 cron; schedule picker on the page.",
    details: [
      "Paused 2026-08-13 pending team decisions on scope and test-case triage.",
      "Dead-window cases must run off-laptop (GitHub Actions) with TZ pinned to Asia/Kuala_Lumpur.",
    ],
    scripts: "scripts/eauto-quotation-reminder",
    updatedAt: "2026-08-13",
  },
];

export const STATUS_LABEL: Record<AutomationStatus, string> = {
  automated: "Automated",
  partial: "Partly automated",
  semi: "Semi-automated",
  "data-prep": "Data checker",
  paused: "Paused",
  planned: "Planned",
};
