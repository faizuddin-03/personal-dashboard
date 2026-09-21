// ── Ticket Studies (JIRA > Ticket Studies) ──────────────────
// A reading-room catalogue of every ticket we've studied in depth: the Jira
// metadata, the SRD requirements, what the SRD leaves undefined, decisions
// already settled with the requestor, what's still open, the test script that
// came out of it, and (where done) the automation feasibility verdict.
//
// The catalogue itself is CODE, not user data — each study is authored once,
// when the ticket is studied, and then only read. The only per-user state is
// the free-text notes below, kept in localStorage so they survive edits to
// this file. Add a new study by prepending it to TICKET_STUDIES.

export interface StudyRequirement {
  /** e.g. "REQ-001" */
  id: string;
  text: string;
}

/** A question that was open during the study and has since been settled. */
export interface StudyDecision {
  topic: string;
  decision: string;
  /** Why it needed deciding, or what still needs tidying up as a result. */
  note?: string;
}

export interface StudyOpenItem {
  question: string;
  why?: string;
  /** Test case ID that will answer it during execution, if any. */
  coveredBy?: string;
}

export type StudyBlockTone = "e2e" | "negative" | "edge" | "regression";

export interface StudyTestScriptBlock {
  label: string;
  /** e.g. "TS_01–10" */
  range: string;
  count: number;
  tone: StudyBlockTone;
}

export interface StudyTestScript {
  path: string;
  sheet?: string;
  total: number;
  columns?: string[];
  blocks: StudyTestScriptBlock[];
  /** Team conventions the script follows (bullet style, row granularity…). */
  conventions?: string[];
}

export type AutomationVerdict = "automatable" | "partly" | "manual";

export interface AutomationGroup {
  verdict: AutomationVerdict;
  /** Short heading for this cluster, e.g. "3DS / OTP fidelity". */
  title: string;
  /** Case IDs in this cluster (bare numbers or full IDs). */
  cases: string[];
  reason: string;
}

export interface StudyAutomation {
  /** Where the automation would live / what it would reuse. */
  intro: string;
  groups: AutomationGroup[];
  blockers: string[];
}

export interface TicketStudy {
  key: string;
  url: string;
  title: string;
  /** YYYY-MM-DD — when we studied it. */
  studiedAt: string;
  jira: {
    type: string;
    priority: string;
    category?: string;
    status: string;
    assignee?: string;
    reporter?: string;
    fixVersion?: string;
  };
  scope: {
    portals: string[];
    modules: string[];
    /** The exact screen/step under test. */
    trigger: string;
    environment: string;
  };
  overview: string[];
  srd?: {
    file: string;
    version: string;
    date: string;
    status: string;
    requirements: StudyRequirement[];
    /** Everything the SRD is silent on — the QA risk list. */
    notSpecified: string[];
  };
  decisions: StudyDecision[];
  openItems: StudyOpenItem[];
  testScript?: StudyTestScript;
  automation?: StudyAutomation;
  related: string[];
  tags: string[];
}

// ── The catalogue ───────────────────────────────────────────
// Newest study first.
export const TICKET_STUDIES: TicketStudy[] = [
  {
    key: "EAINT-12257",
    url: "https://mfservices.atlassian.net/browse/EAINT-12257",
    title: "[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application",
    studiedAt: "2026-09-02",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "REQ GATHERING & ANALYSIS IN QUEUE",
      assignee: "Chee Mei Jia",
      reporter: "Lim Yi Link",
    },
    scope: {
      portals: ["UCD"],
      modules: ["Pre-application & Application (onboarding payment step)"],
      trigger: "UCD onboarding payment method selection, in both the Pre-application and the Application flow",
      environment: "Not stated — no environment field, no comments, no SRD. Ticket is pre-SRD (\"REQ GATHERING & ANALYSIS IN QUEUE\"); ask which environment before writing test scenarios.",
    },
    overview: [
      "Adds DuitNow QR as a fourth UCD onboarding payment tile alongside the three already covered by EAINT-12153 (Credit/Debit Card, Online Banking Business/FPX B2B, Online Banking Personal/FPX B2C) — existing methods stay unchanged.",
      "No SRD exists yet and the ticket itself is a one-paragraph request table with an empty Design Reference field and zero attachments.",
      "The shape below came from an IRL discussion with the dev in charge, not a written spec — every point is dev-stated intent, not confirmed behaviour.",
    ],
    decisions: [
      { topic: "QR interaction shape", decision: "Selecting DuitNow QR opens a popup showing the QR code, with a Cancel Transaction button and a countdown timer; the paying side (scan) only ever offers Approve or Reject.", note: "From dev discussion, 2026-09-02 — not yet in an SRD. See knowledge/eauto-payments.md § DuitNow QR channel." },
      { topic: "Amount verification", decision: "QA must check the amount on the invoice/e-invoice matches what was charged. The invoice is downloaded from the system itself, so this is NOT a phone step and automates like any other assertion.", note: "Dev-stated check, not yet a written acceptance criterion. Phone-scope corrected by Faizuddin, 2026-09-03." },
      { topic: "How this gets automated", decision: "No new script is needed — the senior QA already has working automation for Pre-application and Application. The job is to modify that script's payment step so it drives to the QR popup, pauses for a human to scan and approve/reject on a physical phone, then resumes and asserts the outcome.", note: "From Faizuddin, 2026-09-03. Makes the channel semi-automated (human-in-the-loop), superseding the earlier manual-only reading. Script to be handed over in a later session." },
      { topic: "Scope boundary — the phone screens", decision: "Whatever appears on the phone is out of our jurisdiction; it belongs to the Fiuu system. The phone is a means of triggering an outcome, not a test surface — no assertions and no defects against the paying app's screens (amounts, merchant name, QR contents, error copy). For Approve and Reject, only eAuto's reaction afterwards is under test.", note: "From Faizuddin, 2026-09-03. Same boundary already agreed for the other Fiuu rails: we verify our side reacts correctly, not that Fiuu produces the outcome correctly." },
    ],
    openItems: [
      { question: "Is testing needed on both iPhone and Android, or is one representative?", why: "Dev flagged that QR scanning requires a physical phone; Playwright can't drive the scan-and-approve side." },
      { question: "Is a captcha step really present on Pre-application?", why: "Dev raised this as a \"maybe,\" not confirmed." },
      { question: "Which environment will this be tested on?", why: "Not stated anywhere in the ticket." },
      { question: "Is this a narrower follow-on to EAINT-12153's payment-channels initiative, or a separate parallel one?", why: "Same portal/module, same request shape, and EAINT-12153's own script already reserved TS7/TS8 for QR Code with no steps written — worth confirming before scoping test cases twice." },
    ],
    automation: {
      intro: "Semi-automated, human-in-the-loop. Built 2026-09-03 as scripts/eauto-duitnow-qr/, running from the dashboard at /eauto/duitnow-qr (Tickets → 12257), ported from Charmain's EAINT-11982 reference pack. TWO scenarios, one per payment point: 12257_TS01 pays the pre-application fee (RM 108) by QR and drives phases 1-2; 12257_TS02 pays the registration fee (RM 990) by QR and drives the full 11-phase chain, paying the pre-application fee by FPX on purpose so the operator scans only once. The phone is used for the payment act only — cancel, timer-expiry and the invoice/amount check all need no phone (the invoice downloads from the system). Runs headed; the route rejects a headless request outright.",
      groups: [],
      blockers: [
        "The DuitNow QR tile and popup selectors are UNVERIFIED — that channel is not built yet and no HTML has ever been captured for it. Everything else is ported from locators matched live on 2026-08-31. Capture the payment-step HTML on the first live run and correct src/payment.ts.",
        "TS02 needs both BackOffice logins (approver + assignee) and ideally the Fiuu simulator credentials; without the latter its FPX leg pauses for a human as well.",
        "Only Business Trading (Sabah/Sarawak) is automatable. The three SSM types post the BRN to a LIVE SSM registry lookup that no generated number can pass, and the form silently switches to Trading (Sabah) rather than erroring.",
        "No non-phone way to trigger Approve/Reject is known — unlike Fiuu's response picker for the other rails, nothing suggests DuitNow QR sandbox exposes a headless outcome selector, so the scan stays human-in-the-loop.",
        "No SRD, so no field-level UI spec, integration detail (own gateway vs. reused QR mechanism), or edge cases (timeout, cancel, retry) are available yet.",
      ],
    },
    related: ["EAINT-12153"],
    tags: ["ucd", "onboarding", "payment", "duitnow-qr", "pre-srd"],
  },
  {
    key: "EAINT-12028",
    url: "https://mfservices.atlassian.net/browse/EAINT-12028",
    title: "[eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)",
    studiedAt: "2026-09-14",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Ready For Development",
      assignee: "Chee Mei Jia",
      reporter: "Chee Mei Jia",
      fixVersion: "[QA]Ready for Testing Tickets",
    },
    scope: {
      portals: ["BackOffice"],
      modules: ["Association Payment Listing (brand-new module — no prior version exists)"],
      trigger: "BackOffice Home → Reports → Association Payment Listing (new menu item) → Summary (year filter) → View → month Details (state breakdown, approval actions, audit log, payment-request download)",
      environment: "Not stated anywhere — no Testing Environment field, no mention in description/comments/SRD. This is a brand-new module still \"Ready For Development\"; ask the requestor/dev which BackOffice environment (SIT/UAT/PREPROD) it will land on before writing test scenarios.",
    },
    overview: [
      "Replaces a manual Ops process: today Ops exports approved STMS/eSTM/APT transactions, compiles them in Excel by vehicle and state, and emails Finance to verify and pay two associations — FMC (car transactions) and MMSDA (motorcycle transactions). There is no entry record or summary listing.",
      "The new BackOffice module auto-calculates monthly payment amounts (approved-transaction count × a fixed per-transaction rate: FMC RM1.00/car, MMSDA RM2.00/motorcycle), shows a Summary listing per year and a per-state Details breakdown (16 states + TOTAL), and routes each month through a fixed Drafter → Reviewer → Approver e-signature workflow before the Payment Request PDF becomes downloadable.",
      "Phase 1 covers Car and Motorcycle (FMC/MMSDA) only — JomCheck is explicitly deferred to a later phase. Actual money movement/disbursement stays outside this module (Finance still pays manually using the generated PDF); vendor bank-account master data is also out of scope.",
      "The acting role (Drafter/Reviewer/Approver) is derived automatically from the logged-in BackOffice user ID against a hardcoded mapping — there is no manual role selector.",
    ],
    srd: {
      file: "EAINT-12028_SRD_v1.1_20260731.pdf",
      version: "1.1",
      date: "2026-07-31",
      status: "Post-baseline addendum (baselined at v1.0, 30.07.2026; v1.1 added the JPJ-Approved-Date transaction-count columns and confirmed the Attn name)",
      requirements: [
        { id: "REQ-001", text: "Add \"Association Payment Listing\" under BackOffice Home → Reports; clicking it opens the Summary page." },
        { id: "REQ-002", text: "Summary page has a Year filter (years from 2026 onward, Year-only) + Search button." },
        { id: "REQ-003", text: "Acting workflow role comes from the logged-in user ID, mapped: Drafter = eautozara/mfared/mfizni; Reviewer = eautonurul/mfizni; Approver = kmcheah/mfizni. A user can hold more than one role (e.g. mfizni holds all three)." },
        { id: "REQ-004", text: "Summary lists all 12 months with Car Transactions, Cars (RM), Motorcycle Transactions, Motorcycles (RM) + a year-to-date/full-year total row. Months with no data show \"No data\". Car/Motorcycle transaction counts are based on the JPJ Approved Date." },
        { id: "REQ-005", text: "Summary shows Drafter/Reviewer/Approver Status columns. Drafter: Pending/Approved/KIV/Review Again. Reviewer: Pending/Approved/Review Again. Approver: Pending/Approved. All start Pending." },
        { id: "REQ-006", text: "Summary shows the Finance Payment Date column (DD-MM-YYYY, set by Approver on approval; \"-\" until then)." },
        { id: "REQ-007", text: "Summary has a View link per month → opens that month's Details page." },
        { id: "REQ-008", text: "Details page shows one combined table, all 16 Malaysian states + TOTAL, columns Car Transactions/Cars (RM)/Motorcycle Transactions/Motorcycles (RM), amounts in #,##0.00 format. Amount per state = approved-transaction count for that state × the association rate (FMC car RM1.00, MMSDA motorcycle RM2.00). Transaction counts use the JPJ Approved Date." },
        { id: "REQ-009", text: "Enforce sequential approval: Drafter → Reviewer → Approver. A role's action buttons stay disabled (with a waiting note) until the prior role has approved." },
        { id: "REQ-010", text: "Drafter reviews the amount, clicks Approve (→ Drafter Status = Approved) or KIV (amount looks wrong → Drafter Status = KIV)." },
        { id: "REQ-011", text: "Reviewer clicks Approve (→ Reviewer Status = Approved) or Reject with mandatory remarks (→ returns to Drafter, Drafter Status = Review Again)." },
        { id: "REQ-012", text: "Approver clicks Approve (→ proceeds to Finance payment-date entry) or Reject with mandatory remarks (→ returns to Reviewer, Reviewer Status = Review Again)." },
        { id: "REQ-013", text: "On Approver approval, a date picker (mandatory, future date only) captures the Finance payment date. Manual typing/pasting into the field is blocked — only on-screen date-picker selection is accepted; empty/past date is rejected with a validation message." },
        { id: "REQ-014", text: "Capture an on-screen e-signature on a role's first-ever approval; the stored signature is silently reused for every later approval by that same role/user (pad is not re-shown)." },
        { id: "REQ-015", text: "Audit log on the Details page records date/time, role, action/status and remarks for every workflow update on the month (Drafter Approve/KIV, Reviewer Approve/Reject, Approver Approve/Reject, each with signature-capture note where applicable)." },
        { id: "REQ-016", text: "Payment Request PDFs (FMC for car, MMSDA for motorcycle) become downloadable from the Details page only once the month is fully approved (Drafter + Reviewer + Approver). Before that, buttons are hidden and a pending note is shown. File name: \"Payment Requisition_<Association>_<Month> <Year>.pdf\", e.g. \"Payment Requisition_FMC_January 2026.pdf\"." },
        { id: "REQ-017", text: "Generated PDF follows the existing Online Payment Requisition format: company header, To/Attn/Adds, Date/Requestor, Reason for Payment, Pay to, Amount Payable (figures + words), Prepared/Checked/Approved by." },
        { id: "REQ-018", text: "FMC Payment Request field mapping — fixed values: company header, \"ONLINE PAYMENT REQUISITION\" title, To = \"Finance @ eAuto Sdn Bhd\", Attn = \"Marie Ann\", Adds, Reason line 1 = \"eAUTO PAYMENT TO FMCCAM\", Pay-to block (FED OF MOTOR & CREDIT COMPANIES ASSO MSI, Alliance Bank, a/c 1404-6001-0016-661, Lai Wooi Ping). Flexible values: Date/Reason-month = Approver's approved date, Requestor = Drafter's full name, Amount Payable = that month's report amount (figures + words), Prepared/Checked/Approved by = each role's signature + full name + that role's approved date." },
        { id: "REQ-019", text: "MMSDA Payment Request field mapping — same structure as REQ-018 but Reason line 1 = \"eAUTO PAYMENT TO MMSDA\", Pay-to block (MALAYSIA MOTORCYCLE & SCOOTER DEALERS ASSOCIATION, PBB, a/c 308-208-810-3, Wee Hong (President))." },
      ],
      notSpecified: [
        "Testing environment — nothing in the ticket, comments, or SRD names SIT/UAT/PREPROD for this new module.",
        "Role mapping (REQ-003) is by hardcoded username, not a permission group — SRD doesn't say what happens if one of those accounts is disabled/renamed, or how a new Drafter/Reviewer/Approver gets added.",
        "Whether a state with zero approved transactions for the month shows RM0.00 / \"0\" or is omitted from the Details table — REQ-008 says all 16 states are listed, but doesn't give a zero-transaction example.",
        "No target date/phase given for the deferred JomCheck payment listing.",
        "Concurrent-edit behaviour if two users holding the same role (or mfizni acting as multiple roles) act at the same time isn't addressed.",
        "Real PDF generation, the state display order, and the SPA-vs-full-page navigation style are unconfirmed — the mockup HTML (reviewed 2026-09-02) answers some UI questions but is explicitly a demo, not the real build (see knowledge/flow-association-payment-listing.md).",
      ],
    },
    decisions: [
      { topic: "Finance handling", decision: "Removed from scope in v0.2 (27.07.2026) — this module produces the Payment Request PDF only; Finance still executes the actual disbursement outside the system.", note: "Confirms REQ scope stops at PDF generation, not payment execution." },
      { topic: "Association charge rates", decision: "FMC (car) = RM1.00/approved transaction; MMSDA (motorcycle) = RM2.00/approved transaction — added in v0.3 (29.07.2026).", note: "Drives every amount calculation in Summary and Details (REQ-004, REQ-008)." },
      { topic: "Transaction-count basis", decision: "Car/Motorcycle transaction totals are counted by JPJ Approved Date, not submission or STMS-approval date — added in v1.1 (31.07.2026).", note: "Test data must be checked against JPJ Approved Date, not the transaction's own approval timestamp." },
      { topic: "Attn name on Payment Request PDF", decision: "Confirmed as \"Marie Ann\" in v1.1 (31.07.2026).", note: "Fixed field — any other value on the generated PDF is a bug." },
      { topic: "JomCheck", decision: "Deferred to a later phase, liaised with Nurul on 23.07.2026 — Phase 1 is Car and Motorcycle only.", note: "Do not expect a JomCheck row/column anywhere in Phase 1 UI." },
      { topic: "What happens after Drafter clicks KIV", decision: "Mockup shows KIV never locks the Drafter out — the Approve/KIV buttons stay enabled on a KIV'd month exactly as on a Pending one, so the Drafter can flip it to Approved on a later visit with no separate 'un-KIV' action.", note: "CONFIRMED as a real gap by the dev-authored QA test guide (2026-09-04, see below) — filed as deferred item L2, needing a business decision on whether KIV should be resumable, not a code fix. No longer mockup-only. Full detail in knowledge/flow-association-payment-listing.md." },
      { topic: "Module has been built past mockup stage", decision: "A dev-authored QA test guide (artifact shared 2026-09-04, saved at _reference/tickets/EAINT-12028/EAINT-12028-artifact-qa-test-guide-from-dev.html) describes a real running app across 3 services (eauto core -> eauto-backoffice via SSO -> eauto-cron for the month-close job), built on branch dev/feat/EAINT-12028, tracked as MR !1 (129 files, +10,920, 40 commits).", note: "As of 2026-09-04, MR !1 carries a ⛔ BLOCK code-review verdict (1 blocker, 2 high, 7 medium findings); a fix pass for all 10 was in progress (8/10 coded). Two are test-relevant: H1 (cross-module role confusion) and H2 (open redirect on session-expiry/logout) — re-test both once the fix lands, don't trust a pre-fix build. Full guide content in knowledge/flow-association-payment-listing.md's 'QA Test Guide' section." },
      { topic: "Ticket reassigned to QA + fixVersion flipped, 2026-09-14", decision: "Jira changelog shows Fix Version flip from \"S34.X-20261005\" back to \"[QA]Ready for Testing Tickets\" (Chee Mei Jia, 08:19) followed by May Chin assigning Muhammad Faizuddin Bin Bidi as QA (09:25) — no comment on either change.", note: "The `status` field itself is still \"Ready For Development\", unchanged — treat the fixVersion move as a signal, not a confirmed green light. MR !1's review state could not be re-verified this session (masterjedi.modefair.com unreachable, likely needs VPN)." },
      { topic: "Who can download the FMC/MMSDA PDFs", decision: "Not role-restricted. SRD REQ-016 gates the download buttons on the month's full-approval state only, never on identity; the mockup's own source comment confirms intent: \"Invoice bar - shown for ALL roles on details; downloadable once fully approved\" (line ~508).", note: "Drafter, Reviewer and Approver can all see/download both PDFs once fully approved — nothing limits it to just the Approver. Inferred from mockup + SRD silence, 2026-09-14 — re-check once the real build is reachable." },
    ],
    openItems: [
      { question: "Which environment (SIT/UAT/PREPROD) will this module be tested on?", why: "Still not stated anywhere in the ticket, comments, or SRD. The 2026-09-04 QA test guide gives dev-box localhost URLs (core :8080, backoffice :8095), not a shared testing environment — this does not resolve the open item." },
      { question: "Does a state with 0 approved transactions show RM0.00 in the Details table, or is it hidden?", why: "REQ-008 lists all 16 states + TOTAL but has no zero-transaction worked example." },
      { question: "Does the real Details page display states in the SRD's numeric 01–16 order, or the mockup's alphabetical-ish order?", why: "Matters for any row-position assertion in automation; the mockup and SRD disagree on ordering." },
      { question: "Has MR !1's fix pass for the 10 blocking code-review findings (incl. H1/H2) completed and merged?", why: "As of 2026-09-04 it was still in progress (8/10 coded); still unverified as of 2026-09-14 (internal GitLab unreachable this session) — staging sign-off should wait for a clean re-review." },
      { question: "Why did the ticket flip to Ready-for-Testing and get reassigned to QA today with no explanation?", why: "No Jira comment and no new Teams message (group chat silent since 2026-09-04) explains today's changes — worth a direct ping to Chee Mei Jia or May Chin." },
    ],
    related: ["EAUTO-977", "CCB-848"],
    tags: ["backoffice", "new-module", "association-payment", "payment-request", "approval-workflow", "fmc", "mmsda"],
  },
  {
    key: "EAINT-9306",
    url: "https://mfservices.atlassian.net/browse/EAINT-9306",
    title: "[eAuto - AATF] - To Set eDereg Pre-Check Transaction as a Compulsory Step in the eDereg Transaction Creation Flow",
    studiedAt: "2026-08-21",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review",
      assignee: "Batrisyia Hasanah Binti Nursyamsi",
      reporter: "Izni Zurni",
    },
    scope: {
      portals: ["AATF"],
      modules: ["eDereg", "Deregistration"],
      trigger: "Vehicle field exit on the Deregistration Step 2 data-entry form — also reachable via a standalone eDereg Pre-Checking Enquiry created before Deregistration starts",
      environment: "uat1 — confirmed by Faizuddin, 2026-08-21 (the QA plan itself still marks this [TBC], but the AATF portal captures for this ticket were all taken there)",
    },
    overview: [
      "A Deregistration can no longer be created unless the vehicle already has an Approved + Paid + JPJ-Approved eDereg Pre-Checking whose JPJ approval is within the last 6 months. All four conditions must hold simultaneously.",
      "Two flows reach the same gate: pre-check done ahead of time via its own enquiry screen, or triggered inline at Deregistration Step 2 when no qualifying pre-check exists yet.",
      "The new Dereg flow differs from the old one — the QA test plan explicitly warns not to assume old Dereg automation/behaviour still applies.",
      "See knowledge/flow-edereg.md for the full decision-point breakdown (JPJ/payment response codes, the 6-month-expiry vs daily-cronjob-expiry distinction, and the AATF multi-user race-condition behaviour) sourced from the dev's QA guide and the QA test plan.",
    ],
    srd: {
      file: "SRD_EAINT-9306_eDereg_Pre-Check_Compulsory_in_Deregistration_V1.0_20260102 (2).pdf",
      version: "V1.0",
      date: "2026-01-02",
      status: "Sent out for external review",
      requirements: [
        { id: "REQ-001", text: "Gate Deregistration creation on an Approved + Paid + JPJ-Approved eDereg Pre-Checking within the last 6 months." },
        { id: "REQ-002", text: "Add a compliance announcement banner (red, bolded) on AATF Home, the eDEREG page, and the Create Deregistration Transaction option — added in v0.2 specifically for this." },
        { id: "REQ-003", text: "Add an \"eDereg Pre-Checking:\" row with a Yes hyperlink to AATF and back-office Dereg enquiry views, auto-filling the Pre-Checking Transaction Listing's Vehicle No. field." },
        { id: "REQ-004", text: "Add a vehicle-number search field to the back-office eDereg Pre-Checking listing." },
      ],
      notSpecified: [
        "Which \"multiple different reports\" the cross-verification checks are meant to reference",
      ],
    },
    decisions: [
      {
        topic: "Expiry has two independent mechanisms — don't conflate them",
        decision:
          "A 6-month SRD expiry applies only to an Approved pre-check's JPJ-approval age, and can only be simulated by a dev data patch (no in-app fast-forward). Separately, a daily cronjob (fires 23:59:59) auto-expires any Pre-Checking transaction NOT in Approved status after ~1 day (also excludes same-day records) — it explicitly does not touch Approved or already-Expired/Failed records.",
        note: "Confirmed by CJ_TS1–CJ_TS5 in the QA test plan: only Failed (CJ_TS1) and Pending (CJ_TS5) actually flip to Expired; Failed/Expired/Approved held steady (CJ_TS2–TS4) explicitly assert the cronjob did NOT pick up the transaction.",
      },
      {
        topic: "Test data setup — vehicle number state matters",
        decision:
          "Several scenarios require \"ensure VN does not have any prior pre-checking trx\" as an explicit precondition — vehicle numbers can't be freely reused across scenarios without contaminating results.",
      },
      {
        topic: "Mid-run dev patches split the test script into Parts",
        decision:
          "Any scenario needing a backdated JPJ-approval timestamp or a manually-triggered cronjob run is authored as Part 1 (run) → hand off to dev → Part 2 (continue), per the existing repo convention for dev-patch-dependent scripts.",
        note: "Applies to CPC_E2E_TS4–6 and CPC_E2E_TS10–12 (the Expired-after-6-months blocks) and to every CJ_TS case that needs the cronjob manually triggered. Dashboard-side shape confirmed 2026-08-24 (built for CPC_E2E_TS4 first): Part 1's result shows a copy-to-dev block (TS No. / Vehicle Number / Transaction ID), and a separate \"Continuation\" selector (distinct from \"Test case\") auto-arms the matching Part 2 run with the vehicle no. carried over — see knowledge/flow-edereg.md § \"Two-part (dev-patch) automation\".",
      },
      {
        topic: "Result-icon convention for this ticket's scripts",
        decision: "✅ Pass, ❌ Failed, 🚧 In Progress — placed at the TS title itself, not only in a results column.",
      },
      {
        topic: "Default AATF test account",
        decision: "faizuddinAATF / password — set as the runner's default login, overridable per run, same pattern as eSIM's admin/admin default.",
        note: "Confirmed by Faizuddin, 2026-08-21. Only needed once the AATF/eDereg runner script itself is scaffolded — not yet built.",
      },
      {
        topic: "Phase split — this round stops at a working eDereg flow, not BO verification",
        decision: "Phase 1: get the automation completing the AATF-side eDereg flow end-to-end (Pre-Checking → Deregistration → JPJ Deregistration success). Phase 2 (later): Back-Office checking-details screens, which are unstarted — no BO HTML captured at all yet.",
        note: "Confirmed by Faizuddin, 2026-08-21. Narrows this round's scope below what REQ-003/004 and OF_TS5 (JPJ XML Log) would otherwise require.",
      },
      {
        topic: "Starting scope — one happy-path flow first",
        decision: "Build a single end-to-end happy-path case before attempting the rest of the 38-case script — likely CPC_E2E_TS1 or CPC_E2E_TS2 (see automation.groups below), both already assessed as automatable with no dev-patch dependency.",
        note: "Confirmed by Faizuddin, 2026-08-21.",
      },
    ],
    openItems: [],
    testScript: {
      path: "_reference/tickets/EAINT-9306/[eAuto - AATF] Deregistration - Test Plan (2).pdf",
      total: 38,
      columns: ["TS No.", "Trx Status / Page", "Payment / Multiple Users", "Steps / Expected Results", "QA", "Test Result (P/F)"],
      blocks: [
        { label: "eDereg Pre-Check E2E flows (enquiry-first, step-2-first, both with a 6-month-expiry variant)", range: "CPC_E2E_TS1–12", count: 12, tone: "e2e" },
        { label: "Announcement Message banner placement/wording", range: "AM_TS1–4", count: 4, tone: "edge" },
        { label: "Cronjob expiry behaviour (fires daily 23:59:59)", range: "CJ_TS1–5", count: 5, tone: "edge" },
        { label: "Other Functions — field validation, cancel, input shaping, JPJ XML Log search", range: "OF_TS1–5", count: 5, tone: "edge" },
        { label: "AATF Multiple Users — same/different company races on payment, JPJ-failure resubmit, cancel and expiry", range: "MU_TS1–12", count: 12, tone: "edge" },
      ],
      conventions: [
        "TS ids are prefixed by block: CPC_E2E_ (E2E flow), AM_ (Announcement Message), CJ_ (Cronjob), OF_ (Other Functions), MU_ (AATF Multiple Users).",
        "Icon convention: ✅ Pass, ❌ Failed, 🚧 In Progress, placed at the TS title.",
        "Faizuddin's own coverage notes are embedded directly in the test plan (a \"Faiz's Notes\" section) rather than tracked in a separate document.",
      ],
    },
    automation: {
      intro:
        "First automation build started 2026-08-21, CONFIRMED LIVE END-TO-END 2026-08-24: scripts/eauto-edereg-precheck runs the full happy path in one continuous run — login → AATF home → eDEREG menu → eDereg Pre-Checking Enquiry (vehicle no. + consent → pay → JPJ result → Done) → straight into creating a Deregistration transaction for the SAME vehicle no. → all 6 Deregistration steps (category select, Owner MyKad auth, Vehicle details incl. file uploads, AATF/owner consent + auth, JPJ Check, Payment/Deregister) — exposed at /eauto/edereg-precheck. This IS CPC_E2E_TS1/TS2's happy path now, not just the standalone Enquiry. The MyKad emulator bypass (knowledge/mykad-emulator.md) is wired up and confirmed working at all three auth points. This is now the reference flow for automating any other AATF Deregistration/MyKad-auth screen — see knowledge/flow-edereg.md §8–9. TS1's script also grew a 2026-08-24 addition covering the rest of the SRD's own TS1 checklist (Pre-Checking/Deregistration details pages, the \"eDereg Pre-Checking: Yes\" hyperlink, and the JPJ XML Log under a separate BO login), since rolled out to every other TS case too (full checklist for TS1/TS7/TS9/TS4-6/TS10-12's last part; a reduced subset for TS2 and TS6/TS12's last part; nothing for TS8, which has no persisted record to check) — NOT yet run live, see knowledge/flow-edereg.md §10.",
      groups: [
        {
          verdict: "automatable",
          title: "E2E happy-path and JPJ-failure-code flows",
          cases: ["CPC_E2E_TS1", "CPC_E2E_TS2", "CPC_E2E_TS3", "CPC_E2E_TS7", "CPC_E2E_TS8", "CPC_E2E_TS9"],
          reason: "Deterministically driven by the three JPJ response codes rather than a real JPJ outage — same shape as the sandbox status-code pattern already proven out in scripts/secarang-insurance and scripts/eauto-insurance, once the eSIM steering steps are documented. CPC_E2E_TS1's happy path is confirmed live 2026-08-24. CPC_E2E_TS2, TS7, TS8, and TS9 are all built (tests/edereg-precheck-vehicle-not-exist.spec.ts, -step2-first-approved.spec.ts, -step2-first-vehicle-not-exist.spec.ts, -step2-first-retry-approved.spec.ts) but NOT yet run live — see knowledge/flow-edereg.md §9 for what each needs verified. TS3's own \"RHB API Down\" trigger, previously unconfirmed, was resolved 2026-08-27 (same RHB Transfer eSIM entity, code \"ER\") — built as tests/edereg-precheck-rhb-api-down.spec.ts, NOT yet run live.",
        },
        {
          verdict: "partly",
          title: "6-month-expiry E2E variants",
          cases: ["CPC_E2E_TS4", "CPC_E2E_TS5", "CPC_E2E_TS6", "CPC_E2E_TS10", "CPC_E2E_TS11", "CPC_E2E_TS12"],
          reason: "Each requires a mid-run dev patch to backdate a JPJ-approval timestamp — the browser-driven portions automate, but the script must be split into Part 1 / Part 2 around the handoff, same as every other dev-patch-dependent case in this repo. CPC_E2E_TS4/TS5/TS6 built 2026-08-24 as this two-part shape (tests/edereg-precheck-ts{4,5,6}-part{1,2}.spec.ts, dashboard workflow in knowledge/flow-edereg.md § \"Two-part (dev-patch) automation\") but NOT yet run live. TS5/TS6 Part 2 also introduce a brand-new DECLINED-payment popup shape (knowledge/flow-edereg.md § \"Declined-payment retry shape\") that's never been exercised at all. CPC_E2E_TS10/TS11/TS12 built 2026-08-24 too, as the \"pre-check done in step 2\" counterparts of TS4/TS5/TS6 (tests/edereg-precheck-ts{10,11,12}-part{1,2}.spec.ts) — same Part 2 code reused exactly, and all three Part 1s resolve Approved regardless of the TS since a Failed inline pre-check doesn't persist anything to later expire. Part 1's transaction ID (no Done screen at this entry point) is looked up via the \"eDereg Pre-Checking Transaction Listing\" page instead, per Faizuddin (PrecheckEnquiryPage.findTransactionIdByVehicleNo). See knowledge/flow-edereg.md's TS10-12 bullet for the full reasoning. NOT yet run live.",
        },
        {
          verdict: "partly",
          title: "Cronjob expiry checks",
          cases: ["CJ_TS1", "CJ_TS2", "CJ_TS3", "CJ_TS4", "CJ_TS5"],
          reason: "Data creation and the listing/details assertions automate cleanly; the cronjob itself fires once daily at 23:59:59 and needs a dev to manually trigger it for any reasonable test turnaround, which is a coordination step outside the script's control.",
        },
        {
          verdict: "automatable",
          title: "Field validation, banner text/colour, and log search",
          cases: ["AM_TS1", "AM_TS2", "AM_TS3", "AM_TS4", "OF_TS1", "OF_TS2", "OF_TS3", "OF_TS5"],
          reason: "Pure DOM reads and input-shaping assertions (character rejection, spacebar stripping, auto-uppercase) plus a banner text/colour check and a JPJ XML Log search by Vehicle No. / Transaction Ref ID — no timing sensitivity once selectors exist. AM_TS1-4 built 2026-08-26 as a single combined spec (tests/edereg-precheck-am.spec.ts, project edereg-precheck-am, dashboard testCase \"am\") — all 4 check the same banner text/red/bold styling on 4 screens/states in one run, since it's pure navigate-and-check with no transaction to create. NOT yet run live — see knowledge/flow-edereg.md §15, AM_TS4's \"still visible under the popup\" state is the one unconfirmed piece. OF_TS1-3 built 2026-08-26 too, also combined into one spec (tests/edereg-precheck-of.spec.ts, project edereg-precheck-of, dashboard testCase \"of\") — Cancel on the inline pre-check popup (reuses the same gate DeregTransactionPage.beginInlinePaymentFlow() already confirmed live via CPC_E2E_TS5 Part 2), blank-Vehicle-No. validation, and Vehicle No. input-shaping. NOT yet run live — see knowledge/flow-edereg.md §16; OF_TS2's validation state has no captured HTML behind it and is the one real gap. OF_TS5 built 2026-08-26 as its own spec (tests/edereg-precheck-of-ts5.spec.ts, project edereg-precheck-of-ts5, dashboard testCase \"of-ts5\") — inline pre-check purchase from a fresh vehicle (CPC_E2E_TS7/TS10 Part 1's shape, stops right after the gate turns green, no Step 3+) then a BO JPJ XML Log search by Vehicle No. and Transaction Ref No., reusing runJpjXmlLogChecklist() unchanged. NOT yet run live — see knowledge/flow-edereg.md §17.",
        },
        {
          verdict: "partly",
          title: "Pre-Checking Reset Payment",
          cases: ["OF_TS4"],
          reason: "Needs a Trx ID handed to dev mid-run to force a resettable payment state before retriggering, on the SAME transaction throughout — a genuinely different dev action than the expiry-patch cases (payment reset, not an expiry-timestamp backdate). Built 2026-08-26 as a Part 1/Part 2 split, then REBUILT 2026-08-28 as a single run with a dashboard pause/continue (tests/edereg-precheck-of-ts4.spec.ts, project edereg-precheck-of-ts4, dashboard testCase \"of-ts4\") after Faizuddin caught the split build creating a BRAND NEW Deregistration transaction for Part 2 instead of continuing the one Part 1 declined — wrong shape for a payment reset (the dev patches THIS specific transaction), same fix MU_TS11/TS12 already needed. Now: RHB IF declines the first payment attempt, the SAME still-open #precheck-popup pauses for the dashboard's Continue button while the dev resets the payment, then resumes with THREE payment attempts on that same popup (retrigger -> observe a dev-reset-specific dialog message -> retry -> re-steer eSIM to OK -> succeed) before completing the rest of Deregistration. NOT yet run live — see knowledge/flow-edereg.md §18.",
        },
        {
          verdict: "partly",
          title: "AATF Multiple Users — concurrency and races",
          cases: ["MU_TS1", "MU_TS2", "MU_TS3", "MU_TS4", "MU_TS5", "MU_TS6", "MU_TS7", "MU_TS8", "MU_TS9", "MU_TS10", "MU_TS11", "MU_TS12"],
          reason: "Two-account, two-context automation is native Playwright territory (proven pattern in the EAINT-12153 concurrency group), but several cases race a click against a system-generated \"duplicate request\" popup or depend on a third BackOffice actor cancelling mid-flow (MU_TS9/TS10) — timing-sensitive enough to need careful synchronization rather than a straight port. MU_TS1 built 2026-08-26 (tests/edereg-precheck-mu-ts1.spec.ts, project edereg-precheck-mu-ts1, dashboard testCase \"mu-ts1\") — sequential, not concurrent (User A buys the pre-check and stops at Step 2, never a real Deregistration; User B, same company, reuses it and completes a real one). Confirmed two corrections to the written test plan in the same session — see knowledge/flow-edereg.md §19. New: CONFIG.subUsername/subPassword (default faizAATFsub2/password) and LoginPage.login()'s optional credentials override, both reusable by every other MU_TS case. CONFIRMED LIVE 2026-08-26 — the pre-check-sharing scenario itself works exactly as designed (User B's gate comes up already-satisfied, completes a real Deregistration); one listing-check race-condition bug found and fixed on the same run, see knowledge/flow-edereg.md §19. MU_TS2 (different company) built the same day (tests/edereg-precheck-mu-ts2.spec.ts, project edereg-precheck-mu-ts2, dashboard testCase \"mu-ts2\") — the inverse of MU_TS1: User C (a genuinely different company, CONFIG.subUsername2/mykadNricSub2 etc., default AzfarAATF) is expected to need their OWN separate pre-check rather than reusing User A's, confirmed directly by Faizuddin. Checks BOTH the Pre-Checking listing (expect 2 rows) and the Deregistration listing (expect 1 row) — see knowledge/flow-edereg.md §20. NOT yet run live. MU_TS3 built the same day too (tests/edereg-precheck-mu-ts3.spec.ts, project edereg-precheck-mu-ts3, dashboard testCase \"mu-ts3\") — MU_TS2's shape plus an RE decline-then-retry first (each company gets its own independent countdown, confirmed by Faizuddin they \"should not affect each other\"); new DeregTransactionPage.readResetTimerRemaining() reads the #clockdiv countdown for a diagnostic independence check, logged not hard-asserted. Route timeout raised 16→22min for headroom (two full logins + the 6.5min wait + full Deregistration + two listing checks). See knowledge/flow-edereg.md §21. MU_TS4 built the same day (tests/edereg-precheck-mu-ts4.spec.ts, project edereg-precheck-mu-ts4, dashboard testCase \"mu-ts4\") — the actual same-company concurrent-retry case (Faizuddin's original detailed description, once the TS3/TS4 mix-up was sorted out): User A declines via RHB IF and stays open, User B (same-company sub-account, not User C) opens the SAME transaction via the Pre-Checking listing's \"Resubmit\" link (never a new transaction, never touches MyKad), then both retry concurrently via Promise.all() — pass condition is \"exactly one side wins\" (reaches success directly), not \"both got text back\" — corrected after the first live run, since a winning attempt naturally has no dialog message at all. New PrecheckEnquiryPage.openViaListingAndResubmit()/attemptResubmitPayment() — Resubmit turned out to land on a full standalone page (own #to-retry-rhb RETRY button), not the inline popup originally assumed. CONFIRMED LIVE 2026-08-26 (second run, after both fixes): User A won, User B got the literal \"Transaction Approved\" message — matching the test plan's own step 7 verbatim for the first time. See knowledge/flow-edereg.md §22. MU_TS5 built the same day (tests/edereg-precheck-mu-ts5.spec.ts, project edereg-precheck-mu-ts5, dashboard testCase \"mu-ts5\") — a different-company ISOLATION check, not the payment-collision scenario the written test plan describes: User A and User C (same different-company slot as MU_TS2/TS3) each independently fail JPJ Pre-Checking (VEL000100E) on the same vehicle no. in their own new Deregistration, each gets its own 1-row Pre-Checking listing entry, then eSIM is re-steered to Approved (GLB000000I) for User A's redo only, then re-steered back to Failed before User C's own redo — proving User A's now-Approved state does not leak across companies for the same vehicle no. Composes two already-established patterns: CPC_E2E_TS9's own resolveVehicleGate()-called-twice-on-the-same-page shape (that pattern itself has never been confirmed live) and MU_TS2/TS3's separate-browser-context-per-company shape (confirmed live). See knowledge/flow-edereg.md §23. First live run 2026-08-26 FAILED before reaching either redo — not the flagged TS9-retry risk, but a page-handle bug: the listing-count step navigated User A's still-open Deregistration tab away via page.goto(), stranding it off #vehicleRegNo for the later resolveVehicleGate() redo. Fixed by running each listing count on an ephemeral context.newPage() tab instead of the user's own tab. Not yet re-run live. MU_TS6 built the same day (tests/edereg-precheck-mu-ts6.spec.ts, project edereg-precheck-mu-ts6, dashboard testCase \"mu-ts6\") — its first written version (User B resubmits User A's existing Failed transaction via the listing's Resubmit link) was built and run live 2026-08-26, but failed on a real app behaviour, not an automation bug: same-company + an in-progress Deregistration draft redirects ANY navigation on a second same-company session back to RESUMING that draft rather than the URL requested, so User B never reached the Pre-Checking listing at all. Faizuddin replaced the scenario directly: User B now creates their OWN new Deregistration for the same vehicle no. (own inline pre-check purchase, steered Approved this time) and completes a real Deregistration end to end (MU_TS1's own confirmed-live completion chain), then User A's session checks that the SAME Pre-Checking record (not a new one) updated from Failed to OK — via new PrecheckEnquiryPage.getListingStatusForVehicle(), never exercised live. Step 5 reuses utils/srdChecklist.ts's runPostDeregSrdChecklist() (Step Page/Transaction Listing/JPJ XML Log/Details Page in one call) on User B's own session — its JPJ XML Log leg still has never been exercised live for any case in this ticket, the main residual risk here. First live run of the corrected build, 2026-08-26: the automation itself completed cleanly, but the \"updates in place\" assumption was wrong — the app creates a genuinely SEPARATE second row (Failed + Approved coexisting) rather than mutating User A's original record, matching the dev-authored QA test guide Faizuddin shared (_reference/tickets/EAINT-9306/EAINT-9306-artifact-qa-test-guide-from-dev.html: \"a later failed or cancelled attempt does not cancel out an earlier approved one\" — multiple coexisting records per vehicle+company is the intended design). Per Faizuddin, kept the pass condition expecting exactly 1 row and deliberately flags the real 2-row outcome as FAIL — no code change needed, this was already the assertion. See knowledge/flow-edereg.md §24 (the abandoned first version's diagnosis, the corrected build, and this live-run finding). MU_TS7 built the same day (tests/edereg-precheck-mu-ts7.spec.ts, project edereg-precheck-mu-ts7, dashboard testCase \"mu-ts7\") — different-company: User A creates a Deregistration and stops with the inline pre-check popup open (never paid), checked Pending via a second tab, then User C (different-company slot) independently buys their own Approved standalone pre-check for the same vehicle no. in between, then User A resumes and pays for their OWN Pending record via the Pre-Checking listing's Resubmit link, then drives a real completed Deregistration. Two shapes flagged unconfirmed rather than guessed silently: the Resubmit payment button for a never-attempted (Pending) record (new PrecheckEnquiryPage.resumePendingPayment(), checks for either #to-retry-rhb or #to-payment), and re-entering the Deregistration flow after abandoning the Step 2 popup (may collide with MU_TS6's own \"navigating while a draft is pending resumes it\" finding). See knowledge/flow-edereg.md §25. NOT yet run live.",
        },
        {
          verdict: "partly",
          title: "Extra Coverage — gaps found by cross-checking the dev's QA test guide",
          cases: ["EC_TS1", "EC_TS2", "EC_TS4", "EC_TS5"],
          reason: "Added 2026-08-28, after Faizuddin asked for a crosscheck between this suite's automation and the dev-authored QA test guide's own 10 scenarios (_reference/tickets/EAINT-9306/EAINT-9306-artifact-qa-test-guide-from-dev.html) — everything found not-covered or only partially-covered got built here, filed under a NEW \"Extra Coverage\" dashboard group (distinct from the now-removed \"Others\" group, which was for ad hoc diagnostics not tied to a specific coverage gap). EC_TS1: a later failed precheck does not undo an earlier approved one (fresh Deregistration must still be allowed) — not covered anywhere else; MU_TS6 tests the opposite ordering. EC_TS2: an abandoned never-paid precheck is reused, not duplicated, when a genuinely NEW Deregistration transaction is created afterward and carried through to a completed purchase — OF_TS1 never re-triggered the gate at all, let alone via a fresh transaction (rebuilt 2026-09-01 to match Faizuddin's own literal steps; originally re-triggered the gate on the same still-open Step 2 page instead of creating a new transaction each round). EC_TS4: an existing BackOffice-cancelled precheck still blocks a fresh Deregistration — produced elsewhere in the suite but never re-tested against the gate afterward. (EC_TS3, the JPJ-rejected sibling case, was removed 2026-09-01 — per Faizuddin, already covered by his own testing.) EC_TS5: a failed-payment precheck resumes in retry mode with its Payment History via a genuine cancel-and-return (not OF_TS4's own continuous-popup pause/continue). (EC_TS6, the small-viewport Payment History case, was removed 2026-09-01 — per Faizuddin, already covered by his own testing.) (EC_TS7, the JPJ receipt email check, and its EC_TS7B sibling — built to answer the guide's own \"does this company have a precheck email configured\" caveat — were both removed 2026-09-01, per Faizuddin; EC_TS7's own first live run had confirmed the email genuinely comes back blank on the inline path, hand-verified against the raw Request Data string, but that finding is no longer tracked by automation here. EC_TS8, the Expired-precheck sibling case, and EC_TS9, the repeated-Failed-precheck case, were also both removed 2026-09-01 — per Faizuddin, EC_TS8 already covered by his own testing and EC_TS9 close enough in shape to EC_TS1 not to need a separate case.) All are single-user, compose only already-confirmed page-object methods (no new selectors guessed), and are NEVER RUN LIVE except where noted. Not built: scenario 10's back-office \"eDereg Pre-Checking: Yes\" row check — no BO Dereg-enquiry page HTML has ever been captured; Faizuddin will paste it in a later session, per the repo's own no-blind-selectors rule. Full reasoning and 5 flagged open questions per test: knowledge/flow-edereg.md's \"Extra Coverage\" section.",
        },
      ],
      blockers: [
        "Cronjob only fires once daily at 23:59:59 in real time — every cronjob-dependent case needs a dev to trigger it manually for testing (accepted: Part 1 / Part 2 script split, confirmed by Faizuddin 2026-08-21)",
        "Whether openTrackedContext()'s existing evidence recording covers this ticket's context shape (repeat eSIM visits, 4 distinct Dereg-group entities, STMS-vs-AATF login switches) is unverified",
        "RESOLVED 2026-08-21: URL map + DOM handles captured for the full AATF-side flow (see flow-edereg.md §3–4)",
        "RESOLVED 2026-08-21: the fingerprint-bypass emulator's UI/API is documented in knowledge/mykad-emulator.md — a local WebSocket emulator at localhost:7878, distinct from eSIM; the last blocker on the happy-path case",
        "RESOLVED 2026-08-21: the eSIM entity for pre-checking's JPJ codes is dereg-precheck-enquiry-resp, confirmed by field-shape match + an explicit remark; all 4 relevant entities (dereg-enquiry, dereg-submission, dereg-precheck-enquiry, rhb-transfer) now registered in scripts/eauto-esim/data/config.ts and app/eauto/esim/page.tsx",
        "RESOLVED 2026-08-21: IF/RE are RHB Transfer response codes (Insufficient Fund / a 6-minute timeout retry), confirmed by live eSIM HTML",
        "RESOLVED 2026-08-21: EsimPages.applyChanges() only called .fill(), which throws on Dereg Precheck's <select> fields — now branches on tag name and calls .selectOption() where needed",
      ],
    },
    related: [],
    tags: ["AATF", "eDereg", "Deregistration", "Compulsory Gate", "Multi-system", "Code Review"],
  },
  {
    key: "EAINT-12153",
    url: "https://mfservices.atlassian.net/browse/EAINT-12153",
    title: "[eAuto-Application] Add Payment Channels for Pre-application and Application",
    studiedAt: "2026-08-11",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Ready For Development",
      assignee: "Lim Yi Link",
      reporter: "Chee Mei Jia",
      fixVersion: "Latest Pending Listing (target Sept 2026)",
    },
    scope: {
      portals: ["UCD"],
      modules: ["Pre-application", "Application"],
      trigger: "Onboarding Payment step (identical step on both modules)",
      environment: "Unconfirmed — to be selected at run time in the dashboard runner, not fixed in config",
    },
    overview: [
      "Today a new UCD can only pay the onboarding fee through FPX (Personal). This CR adds more payment channels to the Onboarding Payment step, on both the Pre-application and the Application module.",
      "The change is confined to that one step. Everything before and after it in the onboarding flow is untouched by the CR, which is why the regression block focuses on the surrounding steps rather than re-testing them in depth.",
    ],
    srd: {
      file: "EAINT-12153_SRD_..._v1.0_20260810.pdf",
      version: "V1.0",
      date: "2026-08-10",
      status: "Sent out for external review",
      requirements: [
        { id: "REQ-001", text: "Add a Credit or Debit Card option on the onboarding payment step in both modules." },
        { id: "REQ-002", text: "Add an Online Banking option on the same two screens." },
        { id: "REQ-003", text: "FPX (Personal) remains available and behaves exactly as before." },
      ],
      notSpecified: [
        "No gateway or payment provider is named",
        "No minimum or maximum transaction limits",
        "No bank lists (neither personal nor corporate)",
        "No timeout, callback or retry rules",
        "No refund or reversal rule",
        "No UI mockups",
        "No test data",
        "No testing environment",
        "Doesn't say whether Pre-application and Application are separate charges",
      ],
    },
    decisions: [
      {
        topic: "Channel model — corrected 2026-08-13",
        decision:
          "THREE options total on the payment step, of which TWO are new: Credit or Debit Card (new), Online Banking (Business) = FPX B2B (new), Online Banking (Personal) = FPX B2C (the existing channel, relabelled).",
        note:
          "Supersedes the earlier \"three new channels plus existing FPX (Personal)\" reading, which double-counted B2C and Personal as separate channels. The Figma payment-method screen shows exactly three tiles, and the requestor confirmed B2C and Personal are the same rail. SRD v1.0's two-new-channel wording was right after all.",
      },
      {
        topic: "Payment gateway",
        decision:
          "Fiuu sandbox — the same gateway Secarang uses, presenting Fiuu's own hosted form. So the existing FPX automation chain in scripts/secarang-insurance is a port, not a fresh build.",
        note:
          "The Figma bank grid (Maybank, CIMB, AmBank, Public Bank, RHB, Hong Leong, HSBC, Affin, Bank Rakyat, BSN) is identical to the FPX list already documented for the insurance runner, which corroborates the same rail.",
      },
      {
        topic: "Gateway failure testing — scope boundary",
        decision:
          "The Fiuu sandbox exposes a response picker: choose approved, or any specific failure reason, and Fiuu returns that outcome properly signed. We test OUR side of the boundary — that eAuto handles each response correctly — not that Fiuu produces the right one.",
        note:
          "This removes the need for a callback endpoint or merchant signing secret, and turns the negative-response cases from manual into deterministic automated ones. Not covered by the picker, and currently accepted as out of scope: the same callback delivered twice, or one arriving long after the session ended.",
      },
      {
        topic: "Payment page hosting",
        decision: "Believed to be gateway-framed (Fiuu-hosted), not eAuto-hosted.",
        note: "Stated as a belief, not verified. It decides how fragile the card-field cases are — confirm against the running page before building against it.",
      },
      {
        topic: "Testing environment",
        decision:
          "Still unconfirmed. To be chosen at run time rather than fixed in config — the dashboard runner is getting an environment picker for exactly this.",
      },
      {
        topic: "Test data",
        decision:
          "None yet. Test cards and corporate/personal FPX accounts will only be available at execution time.",
      },
      {
        topic: "Undefined rules",
        decision:
          "Limits, timeouts, late callbacks, refunds and whether the two stages are separate charges are all left as-is — expected result is existing system behaviour.",
        note: "Keeps the script honest: no invented rule is asserted anywhere the SRD is silent.",
      },
    ],
    openItems: [
      {
        question: "Is the Fiuu sandbox 3DS / card OTP readable in the DOM?",
        why:
          "The FPX TAC page renders its OTP in the page, which is what makes FPX failure paths automatable. If the card challenge does the same, the card channel automates too; if it's a real ACS with an SMS OTP, every card-3DS case stays manual. Biggest single swing factor left.",
      },
      {
        question: "Does eAuto charge Pre-application and Application separately?",
        why: "The SRD never says. Decides whether a UCD pays once or twice during onboarding, and therefore what a duplicate-charge bug even looks like.",
      },
    ],
    automation: {
      intro:
        "⚠️ The TS_xx ids below refer to the SUPERSEDED v1.0 test script, which was withdrawn on 2026-08-13 — a replacement is being written. Re-map every id when the new script lands; the groupings and reasoning still hold, the numbers do not. Assessed against tests/service-hub (Playwright + POM, env-driven ENV/PATHS, step-reporter for the runner UI). The decisive find: the FPX gateway is already fully automated in scripts/secarang-insurance — PaymentTypePage selects FPX and captures the bank popup, BankTACPage forces the outcome via select#status_code and reads the TAC straight out of the DOM, PaymentSuccessPage scrapes the receipt. Since this module uses the same Fiuu sandbox, that chain is a port rather than a fresh build.",
      groups: [
        {
          verdict: "automatable",
          title: "Channel list & FPX happy paths",
          cases: ["TS_01", "TS_03", "TS_05", "TS_09", "TS_44"],
          reason:
            "Pure DOM reads plus a direct port of the Secarang FPX chain (status_code = 00). Put the four expected channel labels in ENV.text so wording drift fails loudly. TS_44 has a precondition: the \"identical to before\" baseline must be captured on the PRE-CR build — it's the one item that expires.",
        },
        {
          verdict: "automatable",
          title: "Forced-failure FPX paths",
          cases: ["TS_11", "TS_15", "TS_17", "TS_25", "TS_27"],
          reason:
            "Driven deterministically by the sandbox status codes (51 Insufficient Funds, 80/BC Buyer Cancel) instead of trying to genuinely fail a real bank login. TS_11 also asserts no gateway request fired, via page.route.",
        },
        {
          verdict: "automatable",
          title: "Idempotency, duplicates & concurrency",
          cases: ["TS_28", "TS_29", "TS_30", "TS_31", "TS_32", "TS_37", "TS_40", "TS_43", "TS_47"],
          reason:
            "Native Playwright territory — close a popup, goBack, reload loop, two rapid clicks, two tabs, two contexts, CDP throttling. ENV.ucd2Username already exists for the concurrency pair, and xlsx/exceljs are already project deps for the TS_47 export parse. Cheapest high-value duplicate-charge coverage in the whole script.",
        },
        {
          verdict: "partly",
          title: "3DS / OTP fidelity",
          cases: ["TS_02", "TS_06", "TS_12", "TS_13", "TS_14"],
          reason:
            "Card entry and field validation automate fine if the fields are eAuto-hosted; a cross-origin gateway iframe makes TS_12 fragile. The swing factor is the 3DS challenge — if the sandbox renders the OTP in the DOM (as the FPX TAC page does) it all automates; a real ACS with an SMS OTP makes 02/06/14 manual. TS_13 needs a decline-forcing card. TS_14's timeout leg is slow — deprioritise.",
        },
        {
          verdict: "partly",
          title: "FPX B2B semantics",
          cases: ["TS_04", "TS_16", "TS_19", "TS_20", "TS_41"],
          reason:
            "Code 99 (Pending for Authorization, B2B) makes the pending path automatable, but a real maker-checker approval leaves the browser. TS_19/20 need a matched corporate + personal account pair and may only be rejectable server-side. TS_41's cut-off can be simulated with OE, but the genuine out-of-hours window is time-of-day dependent.",
        },
        {
          verdict: "partly",
          title: "Evidence capture vs human judgment",
          cases: ["TS_07", "TS_08", "TS_10", "TS_45"],
          reason:
            "On-screen and BO values compare automatically; emailed receipts are manual (no mail integration in the repo). TS_10 can capture both bank lists, labels, redirect URLs and BO method values and diff them — but \"is the difference clear to the user\" stays a human call. TS_45 needs someone to identify which BO records predate the CR.",
        },
        {
          verdict: "partly",
          title: "Environment & provisioning dependent",
          cases: ["TS_23", "TS_26", "TS_42"],
          reason:
            "route.abort() is a good proxy for a gateway timeout but a browser-side abort isn't a server-side no-response. Clearing session cookies mid-flow is a clean stand-in for session expiry; the real idle timeout needs the configured value. TS_42 needs a UCD provisioned with a long special-character name.",
        },
        {
          verdict: "partly",
          title: "Scope & platform limits",
          cases: ["TS_35", "TS_36", "TS_38", "TS_39", "TS_46"],
          reason:
            "TS_35/36 need a BO action between UCD legs — each leg automates, the cross-actor chain is slow and best assisted. Device emulation covers TS_38's render and selection but not a real mobile bank-app redirect. For TS_39, Chromium and Edge automate here — WebKit is not Safari and there's no macOS/iOS, so that leg is manual. TS_46 is a full onboarding walk-through: the largest build item in the script.",
        },
        {
          verdict: "manual",
          title: "Amount limits",
          cases: ["TS_21", "TS_22"],
          reason:
            "The onboarding fee isn't settable from the UI — changing it needs BO config or a DB edit. And since the expected result is already \"existing behaviour, no new rule in the SRD\", automating it buys almost nothing.",
        },
        {
          verdict: "automatable",
          title: "Gateway response handling (simulated outcomes)",
          cases: ["TS_24", "TS_33", "TS_34"],
          reason:
            "Re-verdicted 2026-08-13. The Fiuu sandbox lets the tester CHOOSE the response it returns — approved, or any of its failure reasons — and signs each one genuinely, so nothing has to be forged and no signing secret is needed. Same shape as the FPX select#status_code chain in scripts/secarang-insurance: pick the outcome, assert eAuto handles it. Scope is deliberately our side of the boundary — that eAuto reacts correctly to each response — not Fiuu's own correctness. Residual gap, out of scope for now: delivery anomalies the picker cannot produce, i.e. the same callback arriving twice or arriving long after the session ended. Those would still need a dev-provided endpoint, and they are the double-charge cases.",
        },
      ],
      blockers: [
        "No environment assigned — to be selectable at run time, but still unconfirmed",
        "RESOLVED 2026-08-13: the gateway is Fiuu sandbox, same as Secarang — the FPX chain ports over",
        "Payment step believed gateway-framed (Fiuu-hosted) but not verified — decides how fragile the card-field cases are",
        "Unknown whether the Fiuu sandbox 3DS/card OTP is readable in the DOM — biggest single swing factor, to be checked on first contact with the page",
        "RESOLVED 2026-08-13: no callback endpoint or signing secret needed — the Fiuu sandbox simulates the response (approved / each failure reason) and signs it genuinely. Only duplicate or very-late callback delivery remains out of reach, and that is out of scope",
        "The pre-CR regression baseline must be captured BEFORE the CR deploys, or there is nothing to compare against. Ticket is already Ready For Development, so this window is closing",
        "Test data outstanding: test cards (approve / decline / 3DS-fail), corporate + personal FPX credentials, a long special-character UCD, second UCD account",
      ],
    },
    related: ["EAUTO-1018", "CCB-897"],
    tags: ["UCD", "Payment", "Onboarding", "Enhancement", "Sept 2026"],
  },
];

// ── Per-user notes (localStorage) ───────────────────────────
const NOTES_KEY = "jira_study_notes";

export function getStudyNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(NOTES_KEY) ?? "{}"); } catch { return {}; }
}

export function saveStudyNote(issueKey: string, note: string) {
  const all = getStudyNotes();
  if (note.trim()) all[issueKey] = note;
  else delete all[issueKey];
  localStorage.setItem(NOTES_KEY, JSON.stringify(all));
}

/** Total case count across a study's test-script blocks (0 when there's no script). */
export function studyCaseCount(study: TicketStudy): number {
  return study.testScript?.total ?? 0;
}

/** How many cases fall in each automation verdict, for the summary chips. */
export function automationTotals(study: TicketStudy): Record<AutomationVerdict, number> {
  const totals: Record<AutomationVerdict, number> = { automatable: 0, partly: 0, manual: 0 };
  for (const g of study.automation?.groups ?? []) totals[g.verdict] += g.cases.length;
  return totals;
}
