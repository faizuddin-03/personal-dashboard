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
    key: "EAINT-12431",
    url: "https://mfservices.atlassian.net/browse/EAINT-12431",
    title: "[eAuto-UCD] To Send Email and WhatsApp Notifications to Car Owner for LKM Refund when UCD proceeding to Step 3 (Part 1)",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Ready for Prod Deployment (2026-10-23); deployed to prod 2026-10-26 morning, WhatsApp only",
      assignee: "Lim Yi Link (BA); dev Lim Xiwei; QA Charmain Ea Chiang",
      reporter: "Lim Yi Link",
      fixVersion: "S34.15-20261026 (release date 2026-10-26)",
    },
    scope: {
      portals: ["UCD", "BackOffice"],
      modules: ["LKM Refund – STMS Notification"],
      trigger: "STMS Individual transaction moving from Step 2 to Step 3: owner email + WhatsApp (MessageBird) about LKM refund availability",
      environment: "staging/uat4 (Miro card; Charmain, CR group, 2026-10-20 17:14: \"can use staging/uat4 for this ticket ya\").",
    },
    overview: [
      "Part 1 of 2: notify the car owner that an LKM refund is available. Jira #5: \"Method: Email, followed by WhatsApp with the same content\". Email in EN/BM/CN, WhatsApp in EN/BM.",
      "Company category must not send. Bug EAINT-12600 (Company sent both messages) fixed on uat4 2026-10-23, QA comment 2026-10-26: \"Tested and verified on staging/uat4 : PASS\".",
      "Email part deferred. BA, CR group, 2026-10-23 12:26: \"new email \"bizsupport@eauto.my\" is not ready just yet ... we can proceed deployment with whatsapp message first Enable email feature once new email is ready\".",
      "Part 2 (Step 4 email + WhatsApp, UCD reminder) is EAINT-12329, To Do. Studying folder: _reference/tickets/Studying/EAINT-12431/.",
    ],
    decisions: [
      { topic: "WhatsApp channel", decision: "\"for EAINT-12431, we will use messagebird as a decision at the moment\"", note: "PM, CR group, 2026-10-07 16:41." },
      { topic: "Send timing", decision: "\"we will send the email + WhatsApp together when user finish Step 2 and moves to Step 3\"", note: "Lim Xiwei, CR group, 2026-10-16 15:06. Settles the Step 1 / Step 3 wording conflict in Jira for the as-built behaviour." },
      { topic: "QA scope", decision: "\"i will test with one E2E Happy Flow for Individual only\"", note: "Charmain, CR group, 2026-10-21 12:12. Result 2/2 (100%) per EOD 23-10." },
      { topic: "Johor / Manage LKM Refund Amount suppression", decision: "\"This handling to send out notification based on Manage LKM Refund Amount listing is NOT required ya.\"", note: "BA, CR group, 2026-10-23 12:26." },
    ],
    openItems: [
      { question: "When does the email part go live?", why: "Waits on the bizsupport@eauto.my mailbox. No date given." },
      { question: "Does SRD v1.0 (2026-10-23) match the as-built trigger?", why: "SRD not retrieved (connector cannot download). Jira title says Step 3, description says Step 1." },
    ],
    related: ["EAINT-12329", "EAINT-12600", "EAINT-12430", "EAINT-10108"],
    tags: ["ucd", "stms", "lkm-refund", "whatsapp", "messagebird", "email", "notification"],
  },
  {
    key: "EAINT-12589",
    url: "https://mfservices.atlassian.net/browse/EAINT-12589",
    title: "[eAuto - BackOffice] Ins Cancellation Balance % - show on STMS & Insurance Cancellation listings and STMS export whenever a value exists",
    studiedAt: "2026-10-26",
    jira: {
      type: "Bug",
      priority: "Medium",
      status: "Done (2026-10-26); deployed to prod 2026-10-26",
      assignee: "Boo Jin Siang (dev); QA field empty",
      reporter: "Boo Jin Siang",
      fixVersion: "S34.15-20261026 (release date 2026-10-26)",
    },
    scope: {
      portals: ["BackOffice"],
      modules: ["STMS Transaction listing + CSV export (\"Ins Cancellation Balance %\")", "Insurance Cancellation Transaction listing (\"Balance %\")"],
      trigger: "BO listings showing \"-\" for rows that do have an Insurance Cancellation balance",
      environment: "Miro: \"Test Env: /uat4\".",
    },
    overview: [
      "Expected (Jira, verbatim): \"the balance column shows the balance (whole percent, e.g. \"67%\") whenever one is on record - whatever the Insurance Cancellation status, and even before an Insurance Cancellation transaction exists. It shows \"-\" only when there is no balance at all.\"",
      "Display only. UCD pages unchanged. Follow-up to EAINT-12586 (column added, prod 2026-10-23). MR eauto_v2 !4965.",
      "Studying folder: _reference/tickets/Studying/EAINT-12589/.",
    ],
    decisions: [
      { topic: "QA involvement", decision: "\"no QA needed for 12589 ya\"", note: "Charmain, DM, 2026-10-26 09:37. Huddle mentions it only as deployed to prod." },
    ],
    openItems: [
      { question: "Does knowledge/flow-stms-addons.md line 267 need correcting?", why: "It says 12589 shows \"-\" for Failed/Cancelled/no-transaction — the opposite of Jira. Jira wins." },
      { question: "Whole percent: rounded or truncated?", why: "Not stated in Jira." },
    ],
    related: ["EAINT-12586", "EAINT-12022"],
    tags: ["backoffice", "stms", "insurance-cancellation", "listing", "export", "bug"],
  },
  {
    key: "EAINT-10108",
    url: "https://mfservices.atlassian.net/browse/EAINT-10108",
    title: "[eAuto-UCD] STMS - Enhance Perakuan Step 1 & Step 3 Wording to Require Customer Email Address",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Ready for Prod Deployment (2026-10-23)",
      assignee: "Lim Yi Link (BA); dev Yi Fung Tan; QA Charmain Ea Chiang",
      reporter: "Lim Yi Link",
      fixVersion: "S34.16-20261027 (release date 2026-10-27)",
    },
    scope: {
      portals: ["UCD"],
      modules: ["STMS – Step 1 Perakuan Penjual, Step 3 Perakuan UCD Berdaftar, Slip Pengesahan PDF"],
      trigger: "Perakuan text on STMS Step 1 and Step 3, Individual and Company",
      environment: "staging/uat3 (Jira Code Merge Environment; KJ, CR group, 2026-10-22 11:26: \"the changes is ready on staging/uat3\").",
    },
    overview: [
      "Adds the word \"pemohon\" to the email line of 4 Perakuan texts (Step 1 Individual/Company item iii; Step 3 Individual/Company, Pulangan Balik Hasil LKM item i). Jira: \"Word in bold (pemohon) is the new wording added.\"",
      "Why (Jira): \"to ensure only the customer's email address is entered for LKM Refund applications ... and UCD does not use their own email address.\"",
      "No SRD; wording source is \"documents shared by Ops Team on 13.10.2026 (Tues)\" (not in repo). Studying folder: _reference/tickets/Studying/EAINT-10108/.",
    ],
    decisions: [
      { topic: "Scope of change", decision: "\"can ignore them, just ensure to add the \"pemohon\" word will do\"", note: "BA, CR group, 2026-10-21 14:19, answering the dev's screenshot of other text differences." },
      { topic: "Deployment slot", decision: "27 Oct 2026 (Tue) morning.", note: "Charmain, CR group, 2026-10-21 14:49; release moved from 28 Oct (Secarang Main Group, 2026-10-22 11:47)." },
      { topic: "QA result", decision: "\"QA has completed testing for EAINT-10108 on staging/uat3 (eAuto) with no outstanding issues.\" 5/5 (E2E TS1-TS3, existing transactions TS4-TS5).", note: "Charmain, CR group, 2026-10-23 09:20; EOD 22-10." },
    ],
    openItems: [
      { question: "Is the consent / Slip Pengesahan PDF covered?", why: "Dev asked \"cover the consent pdf , right?\" (2026-10-22 11:58), no reply captured. Miro scope includes the Slip PDF; Jira does not." },
      { question: "Are Company wording differences intended?", why: "Company Step 1 says \"sesalinan dihantar\" (Individual \"akan dihantar\"); Company Step 3 has no \"(Penjual)\"." },
    ],
    related: ["EAINT-9204", "EAINT-12431", "EAINT-12329"],
    tags: ["ucd", "stms", "perakuan", "lkm-refund", "wording"],
  },
  {
    key: "EAINT-12253",
    url: "https://mfservices.atlassian.net/browse/EAINT-12253",
    title: "[eAuto-UCD] To Display Browser Reminder in Last Step of Transaction for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Testing In 1st Env (2026-10-21)",
      assignee: "Lim Yi Link (BA); dev zhan.choon (Wong Zhan Choon); QA Muhammad Amirul Azfar",
      reporter: "Lim Yi Link",
      fixVersion: "S34.17-20261028 (release date 2026-10-28)",
    },
    scope: {
      portals: ["UCD", "AATF"],
      modules: ["Transaction last step (STMS incl. UCD to UCD & wholesale, eSTM, BMK, APT, Insurance, Service Hub, JomCheck, Deregistration, e-Dereg Pre-Checking)"],
      trigger: "Last step of each transaction in Mozilla Firefox: Browser Reminder popup",
      environment: "staging/uat1 (Jira Code Merge Environment, Miro; dev merged 2026-10-21 10:33).",
    },
    overview: [
      "Popup \"Browser Reminder 浏览器提醒\" for Firefox users only: \"Mozilla Firefox support will end on 31 December 2026. Starting 1 January 2027, please use Google Chrome ...\" Buttons \"Continue 继续\" and \"View User Guide 查看操作指南\". Not shown for Company/Business Profile Update.",
      "As built: shown only to Firefox < 37 (accepted by BA per Azfar STATUS.md CD1), after payment on the final step, and again after F5.",
      "QA result: \"(36/36) 100% PASS only\" (Azfar EOD, 2026-10-23 19:30). Studying folder: _reference/tickets/Studying/EAINT-12253/; Azfar CR folder: _reference/codebases/eauto-qa-azfar/cr/EAINT-12253/.",
    ],
    srd: {
      file: "_reference/tickets/Studying/EAINT-12253/EAINT-12253_SRD__eAuto-UCD__Transaction_Last_Step_-_..._v1_1_20260903.pdf",
      version: "1.1",
      date: "2026-09-03",
      status: "Latest of 4 attachments.",
      requirements: [
        { id: "REQ-001", text: "Popup at the last step for Mozilla Firefox (user agent), 9 transaction types. \"The browser reminder shall not be displayed for Company/Business Profile Update.\" \"Displayed once per transaction.\"" },
        { id: "REQ-002", text: "Title \"Browser Reminder 浏览器提醒\"; English above divider, Chinese below." },
        { id: "REQ-003", text: "\"Continue 继续\" closes popup; \"View User Guide 查看操作指南\" opens UCD User Guide in a new tab. \"The transaction is not blocked before 1 January 2027.\"" },
      ],
      notSpecified: [
        "Firefox version: SRD says any Firefox; build shows only to Firefox < 37.",
        "Timing: SRD \"before the user confirms or submits\" vs build \"after payment\".",
        "SRD §2.1.2 says out of scope on portals other than UCD, but §2.2.1 says \"UCD & AATF\".",
      ],
    },
    decisions: [
      { topic: "Refresh behaviour (EAINT-12574)", decision: "\"This ticket can be closed as we can remain existing behaviour in staging.\" Popup showing again after F5 is accepted.", note: "BA, Jira EAINT-12574, 2026-10-21 12:23. SRD and Miro (\"Close the banner & refresh the page - should NOT show popup\") not updated." },
      { topic: "Footer", decision: "\"We should remain unchanged for this footer after deployment of 12180 ya.\"", note: "BA, Teams, 2026-09-03 16:19." },
      { topic: "Deployment slot", decision: "28 Oct 2026 (Wed) morning.", note: "Mei Jia Chee 2026-10-20 14:25; Tan Yi Fung 17:18 \"Can be morning\"." },
    ],
    openItems: [
      { question: "What was the \"existing issue on APT\" outcome?", why: "Azfar EOD 2026-10-22 18:40: \"To follow up with SA on existing issue on APT\". No outcome captured." },
      { question: "Will the SRD be updated for the Firefox < 37 rule, after-payment timing and refresh behaviour?", why: "Build and SRD v1.1 differ on all three." },
    ],
    related: ["EAINT-12180", "EAINT-12574", "CCB-933", "EAUTO-1028"],
    tags: ["ucd", "aatf", "firefox", "browser-reminder", "popup", "last-step"],
  },
  {
    key: "EAINT-11179",
    url: "https://mfservices.atlassian.net/browse/EAINT-11179",
    title: "[eAuto-UCD] STMS - Add entry point for LKM Refund & Insurance Cancellation Add-on from Step 5 to Step 4",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "To Do",
      assignee: "Unassigned; QA Charmain Ea Chiang",
      reporter: "Chee Mei Jia",
    },
    scope: {
      portals: ["UCD"],
      modules: ["STMS - LKM Refund & Insurance Cancellation"],
      trigger: "STMS Step 4: add-on selection and signature (today at Step 5)",
      environment: "Not set (Miro blank).",
    },
    overview: [
      "Request (Jira): \"To move LKM Refund & Insurance Cancellation optional add-on from Step 5 to Step 4 in STMS transaction flow.\"",
      "Why (Jira): \"Per Carsome feedback, their client leaves once Step 4 is done. UCD is unable to arrange another session to meet client for signature at Step 5\".",
      "Miro deploy column: \"TBC (pending requirement)\". No SRD. Charmain status through 2026-10-26: \"Not Ready for Testing\". Studying folder: _reference/tickets/Studying/EAINT-11179/.",
    ],
    decisions: [],
    openItems: [
      { question: "Move or add? Does Step 5 keep the add-ons?", why: "Jira title says \"Add entry point\"; description and Miro say \"Move\"." },
      { question: "Is the add-on shown before or after the Step 4 JPJ enquiry?", why: "The LKM amount comes from the 1st JPJ enquiry at Step 4." },
      { question: "Company scope?", why: "LKM Refund Company excluded (EAINT-12417); IC is Individual only." },
    ],
    related: ["EAINT-104", "EAINT-12022", "EAINT-12585", "EAINT-12431", "EAINT-12329"],
    tags: ["ucd", "stms", "lkm-refund", "insurance-cancellation", "add-on"],
  },
  {
    key: "LKM-Refund-Phase-2",
    url: "https://miro.com/app/board/uXjVLqFnnAU=/?share_link_id=694056267956",
    title: "LKM Refund (Phase 2) — no Jira key (Miro card \"EAINT-xxxxx - LKM Refund (Phase 2)\")",
    studiedAt: "2026-10-26",
    jira: {
      type: "No Jira ticket found (JQL searches 2026-10-26)",
      priority: "n/a",
      status: "n/a — Miro column \"TBC (update by 8/10/2026)\", date passed with no update",
      assignee: "Miro: \"BA: MJ, Yi Link\", \"QA: Charmain / Azila\"",
    },
    scope: {
      portals: ["UCD", "BackOffice"],
      modules: ["STMS – LKM Refund"],
      trigger: "Not defined in any source",
      environment: "Miro: \"staging/preprod1 & /preprod2\", \"Test Env Point to: JPJ Staging\" — looks carried over from the Phase 1 card.",
    },
    overview: [
      "Phase 2 scope is not defined anywhere. Phase 1 gates (EAINT-12417, quoting CR group 24-09-2026): \"PTJ Branch - Only display KL & Selangor in LKM Refund popup\", \"Allow Individual category only\".",
      "Miro scope (verbatim): \"Regression Scope (before UAT) - E2E Happy Flow - Individual - Company - LKM Refund Payment = Failed - LKM Refund Submission = Failed - Pending item - IC automation test result\".",
      "Studying folder: _reference/tickets/Studying/LKM-Refund-Phase-2/.",
    ],
    decisions: [
      { topic: "Company category", decision: "\"Company category remains excluded\", \"deprioritized until further notice\"", note: "Yi Link Lim, CR group, 24-09-2026, quoted in the EAINT-12417 QA comment (2026-09-29). Conflicts with Miro scope listing \"Company\"." },
    ],
    openItems: [
      { question: "Is Phase 2 a ticket yet to be raised, or a set of existing LKM tickets?", why: "No Jira key. Candidates: EAINT-12329, 12630, 12615, 12585, 12567/12591 — none labelled Phase 2." },
      { question: "Deploy date and environment?", why: "Miro values are Phase 1 carry-over; \"update by 8/10/2026\" has passed." },
      { question: "What is \"IC automation test result\" — Insurance Cancellation or Copy of IC?", why: "Not stated." },
    ],
    related: ["EAINT-104", "EAINT-10093", "EAINT-10119", "EAINT-12417", "EAINT-12329"],
    tags: ["stms", "lkm-refund", "phase-2", "no-jira-key"],
  },
  {
    key: "EAINT-12580",
    url: "https://mfservices.atlassian.net/browse/EAINT-12580",
    title: "[eAuto - Insurance Cancellation] Copy of IC split saves watermark pieces instead of the IC as Front IC / Back IC",
    studiedAt: "2026-10-26",
    jira: {
      type: "Bug",
      priority: "Medium",
      status: "Ready in 1st Env (2026-10-26)",
      assignee: "Boo Jin Siang (dev); QA Muhammad Amirul Azfar (Miro says Azila)",
      reporter: "Boo Jin Siang",
    },
    scope: {
      portals: ["UCD"],
      modules: ["STMS > Insurance Cancellation add-on – Copy of IC upload (Front IC / Back IC split)"],
      trigger: "Copy of IC upload in the Insurance Cancellation pop-up at STMS Step 5",
      environment: "Miro: \"Test Env: /preprod1\".",
    },
    overview: [
      "Problem (Jira): a watermark (e.g. \"For proton use only\") \"can save two pieces of the watermark as the Front IC and Back IC instead of the card\", and these are sent to the insurance partner.",
      "Expected (Jira): real front and back, nothing cut off; otherwise reject with \"Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy.\"",
      "Jira QA note: \"a successful upload proves nothing - open the saved Front IC and Back IC and check they show the real card.\" Deploy TBC. Studying folder: _reference/tickets/Studying/EAINT-12580/.",
    ],
    decisions: [],
    openItems: [
      { question: "Where can QA view the saved Front IC / Back IC on staging?", why: "Not stated; needed for every case." },
      { question: "Expected result for a card photographed on a table and a sideways photocopy?", why: "Jira says they are \"not found at all\" and \"An improved splitting method is being evaluated.\"" },
      { question: "Does the fix also apply to the LKM Refund Copy of IC upload?", why: "Not stated." },
    ],
    related: ["EAINT-12022", "EAINT-12585"],
    tags: ["ucd", "stms", "insurance-cancellation", "copy-of-ic", "upload", "bug"],
  },
  {
    key: "EAINT-8767",
    url: "https://mfservices.atlassian.net/browse/EAINT-8767",
    title: "[eAuto-Insurance] To Fix Cronjob of Insurance for \"Quotation Expired\" & Allow Special Remarks Field to Accept Special Character",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "In Development",
      assignee: "zhong.tai (dev); QA field empty",
      reporter: "Lim Yi Link",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["UCD"],
      modules: ["Insurance – Quotation Expired cronjob, Special Remarks field"],
      trigger: "Unpaid insurance transaction older than 24 hours with special characters in Special Remarks",
      environment: "Not stated (Jira Code Merge Environment and Miro both blank).",
    },
    overview: [
      "Request (Jira): \"Cronjob for Insurance to update transaction status to \"Quotation Expired\" after transactions are created > 24 hours\".",
      "Reason (Jira): \"As per checking by dev, all special char in [special remarks] will affect this cronjob to update status to \"Quotation Expired\"\". Prod examples B58005885, B58005800.",
      "No SRD, no QA, no deploy date. Miro estimate 3 days. Studying folder: _reference/tickets/Studying/EAINT-8767/.",
    ],
    decisions: [],
    openItems: [
      { question: "Which statuses must expire after 24 h?", why: "Miro lists Failed and \"Quotation / Pending Approval???\"; Jira says only unpaid. EAINT-9141 TS said Failed and Pending Approval also become Quotation Expired." },
      { question: "Where is the Special Remarks field, and is the fix in the field validation, the cron, or both?", why: "No capture of the field in the repo; title and reason point at different parts." },
      { question: "Are stuck old rows back-filled?", why: "Miro lists \"Existing eAuto Insurance Transaction\"." },
      { question: "How is the 24 h wait forced on staging?", why: "Needs a dev patch of created time; cron schedule not documented." },
    ],
    related: ["EAINT-11864", "EAINT-12171", "EAINT-9141"],
    tags: ["ucd", "insurance", "cronjob", "quotation-expired", "special-remarks"],
  },
  {
    key: "EAINT-12121",
    url: "https://mfservices.atlassian.net/browse/EAINT-12121",
    title: "[eAuto-UCD] SSM: Remove 7 Days Validation After First Purchase to Allow SSM Repurchase",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review (2026-10-21)",
      assignee: "Lim Yi Link (BA); dev Wong Zhan Choon; QA Muhammad Amirul Azfar",
      reporter: "Chee Mei Jia",
      fixVersion: "S35.X-20261102 (release date 2026-11-02)",
    },
    scope: {
      portals: ["UCD", "BackOffice"],
      modules: ["SSM (STMS & eSTM Step 4)", "BO SSM Transaction Listing", "BO Consolidated e-Invoice Listing", "BO eAuto Reconciliation Summary Listing"],
      trigger: "[Purchase SSM] on STMS / eSTM Step 4 after a previous SSM purchase for the same company",
      environment: "Not stated in Jira, Miro or Teams. Senior QA, Teams 2026-08-24 09:50: \"please wait for QA's greenlight ya, dont deploy to any staging env first\".",
    },
    overview: [
      "SRD §2.1.1: \"Remove the 7-day validation that blocks SSM repurchase after the first purchase. Allow UCD to repurchase SSM starting from the same day.\" A 10-minute cooling period replaces it.",
      "Every repurchase is a new charge, new invoice/e-Invoice and new BO listing rows. Download validity stays 7 days per document.",
      "Tested together with EAINT-12230. QA estimate (Azfar, eAuto QAs, 2026-10-20 14:14): \"( 7 + 2) days. I dont think can deploy on 28th Oct Morning\". Status 2026-10-26: TS and automation drafting, Not Ready For Testing.",
      "Studying folder: _reference/tickets/Studying/EAINT-12121/ (SRD PDF + text copy). Prior joint 12121+12230 draft (64 TS) in Azfar repo branch origin/12121-past-miro-board.",
    ],
    srd: {
      file: "_reference/tickets/Studying/EAINT-12121/EAINT-12121_SRD_v1.0_20260818.pdf (text: EAINT-12121_SRD_v1.0_20260818-text.md)",
      version: "1.0",
      date: "2026-08-18",
      status: "Latest. Copied from the QA colleague's repo branch; byte size matches the Jira attachment.",
      requirements: [
        { id: "REQ-001", text: "Remove 7-day validation. \"Note: The SSM document is still valid to download for 7 days only.\"" },
        { id: "REQ-002", text: "10-minute cooling period: \"Repurchase attempted within 10 minutes from the previous purchase → [Purchase SSM] button is not displayed\"." },
        { id: "REQ-003", text: "\"No error message is shown to the UCD.\" Button appears on manual refresh or after \"No\" on the Payment Confirmation popup (auto-refresh)." },
        { id: "REQ-004", text: "Repurchase allowed regardless of previous SSM status (OK or Failed)." },
        { id: "REQ-005", text: "Standard fee every purchase. \"No free repurchase is granted.\"" },
        { id: "REQ-006/007", text: "UCD downloads latest SSM document; BO downloads SSM documents in a zip file." },
        { id: "REQ-008..011", text: "New SSM Transaction Listing record, new invoice + e-Invoice (latest first), Consolidated e-Invoice for invalid TIN, new Reconciliation Summary record — per purchase." },
        { id: "REQ-012", text: "\"Upon purchasing SSM in the STMS flow, the UCD shall be able to repurchase SSM in the eSTM flow.\"" },
        { id: "REQ-013", text: "UCD sees latest SSM only, even if latest = Failed (1st OK, 2nd Failed → 1st document no longer displayed)." },
        { id: "REQ-014", text: "Repurchase by any UCD user (\"Main UCD and sub UCD are examples only\")." },
      ],
      notSpecified: [
        "§2.1.2 lists download handling as Out-of-Scope, yet REQ-006/007/013 define it.",
        "REQ-011 vs the current rule that matched eAuto = RHB rows are not listed in Recon.",
        "Meaning of Miro item \"SSM 2 Layer Permission???\".",
      ],
    },
    decisions: [
      { topic: "Cooling period", decision: "\"confirmed with Nurul to have 10 min cooling down period. Within this 10 min period, UCD is unable to repurchase this SSM Document.\"", note: "BA, Teams, 2026-08-11 18:01." },
      { topic: "Cross-flow and downloads", decision: "\"STMS purchased SSM, UCD can repurchase SSM in eSTM.\" / \"Nurul: No, system should only allow UCD to download latest SSM doc. If 2nd purchase, SSM Status = Failed, UCD unable to view & download SSM Doc for 1st purchase.\"", note: "BA, Teams, 2026-08-14 17:07." },
      { topic: "Rafftech same-BRN check", decision: "\"Rafftech feedback that our account is excluded for this 008 checking which meant can purchase same BRN within 3 hours.\"", note: "Senior dev, Teams, 2026-08-10 10:24." },
    ],
    openItems: [
      { question: "Test environment and deployment date?", why: "Not set anywhere. Fix version moved to S35.X-20261102; older notes say S34.X-20261028." },
      { question: "10-minute anchor: from previous purchase or from approval?", why: "SRD Assumption 1 says purchase; EAINT-12230 says \"within 10 min of approval\"." },
      { question: "Paid-not-Approved previous purchase: allow or refuse?", why: "SRD REQ-004 \"regardless of the SSM status\" vs EAINT-12230 row 1 \"Refuse payment\"." },
    ],
    related: ["EAINT-12230", "EAUTO-1006", "CCB-886", "EAINT-5155", "EAINT-9247", "EAINT-8802", "EAINT-10119"],
    tags: ["ucd", "backoffice", "ssm", "stms", "estm", "repurchase"],
  },
  {
    key: "EAINT-12230",
    url: "https://mfservices.atlassian.net/browse/EAINT-12230",
    title: "[eAuto-UCD] SSM: Add Duplicate Purchase Validation on Payment Step to Prevent Double Charge",
    studiedAt: "2026-10-26",
    jira: {
      type: "Bug",
      priority: "Medium",
      status: "Code Review (2026-10-21)",
      assignee: "None; reporter is dev zhan.choon; QA Muhammad Amirul Azfar",
      reporter: "Wong Zhan Choon",
      fixVersion: "S35.X-20261102 (release date 2026-11-02)",
    },
    scope: {
      portals: ["UCD"],
      modules: ["SSM purchase – STMS Step 4 Payment Confirmation"],
      trigger: "[Yes] on a Payment Confirmation dialog that was already open when a colleague paid for the same BRN",
      environment: "Not stated. Must be the same build as EAINT-12121 (Miro: \"Test together with EAINT-12121\").",
    },
    overview: [
      "Problem (Jira): \"The \"transaction is paid\" refusal added recently only applies when user clicks Purchase SSM — it does not apply when a user confirms payment from a dialog that was already open on their screen, which stays valid for about 24 hours.\"",
      "Expected (Jira rows): paid-not-Approved by colleague → refuse; Approved and 10-minute cooldown not elapsed → refuse; cooldown elapsed → allow; own retry on own paid row → allow, no 2nd charge.",
      "No SRD; Jira description is the only source. Likely a fix to 12121's new guard, not prod [inference, QA colleague's study]. Studying folder: _reference/tickets/Studying/EAINT-12230/.",
    ],
    decisions: [
      { topic: "Test together with 12121", decision: "\"Yup can be test together and i think better to be test together\"; estimate 7+2 days for both.", note: "Azfar, eAuto QAs, 2026-10-20 14:14." },
      { topic: "Expected-result source", decision: "\"12230's expected results come from its ticket description only; no SRD will be requested\".", note: "QA colleague's STATUS.md, 2026-10-20 (Azfar repo, read-only)." },
    ],
    openItems: [
      { question: "What is the refusal message on the payment step?", why: "Not defined in Jira." },
      { question: "Does the fix cover eSTM and a second UCD company on the same BRN?", why: "Jira names STMS and \"same company\" only." },
      { question: "Environment and deployment date?", why: "Not set; QA says 28 Oct not feasible." },
    ],
    related: ["EAINT-12121", "EAINT-5155", "EAINT-9247"],
    tags: ["ucd", "ssm", "stms", "duplicate-payment", "bug"],
  },
  {
    key: "EAINT-12087",
    url: "https://mfservices.atlassian.net/browse/EAINT-12087",
    title: "[eAuto-Backend] Build Cronjob to Auto-Expire Software Installation Slot After 60 days",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review (2026-10-19)",
      assignee: "zhan.choon (dev); QA Charmain Ea Chiang",
      reporter: "Batrisyia Hasanah Binti Nursyamsi",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["UCD", "BackOffice"],
      modules: ["Backend - Software Installation Slot Expiry Cronjob"],
      trigger: "Daily cron: paid SI/BDP transaction with no slot taken within 60 days of payment → Expired",
      environment: "Not stated (Miro blank).",
    },
    overview: [
      "Jira: \"Build a cronjob to auto-expire installation payment/slot transactions where the UCD has made payment but did not proceed with the paid/free installation slot within 60 days of payment.\"",
      "Jira example: \"Payment made on 27.07.2026 → slot valid until 25.09.2026 → cronjob runs on 26.09.2026 and marks the transaction as expired.\"",
      "No SRD. Miro: 3 days, \"Refer to previous TS drafted in miro\". Studying folder: _reference/tickets/Studying/EAINT-12087/.",
    ],
    decisions: [],
    openItems: [
      { question: "Does the cron already exist?", why: "Jira: \"No cronjob currently exists\". SRD 10960 and a code note (ServiceHubAppointmentExpiredJob, daily 01:00) say a 2-month expiry job exists." },
      { question: "60 days from payment or 2 months from purchase?", why: "Jira vs SRD EAINT-10960 (\"buy 6 July → expire 7 September\")." },
      { question: "Partial use: whole SR expired or only unbooked slots? Covers BDP free installation?", why: "Not stated." },
      { question: "How is expiry forced on staging?", why: "Needs a dev date patch or manual cron trigger." },
    ],
    related: ["EAINT-10960", "EAINT-11880", "EAINT-12099"],
    tags: ["backend", "service-hub", "software-installation", "cronjob", "expiry"],
  },
  {
    key: "EAINT-12123",
    url: "https://mfservices.atlassian.net/browse/EAINT-12123",
    title: "[eAuto-BackOffice] Differentiate Reference Number for Multiple Records under Same SR in Biometric Device Purchase & Software Installation Listing",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review (2026-09-18)",
      assignee: "zhan.choon (dev); QA field empty",
      reporter: "Batrisyia Hasanah Binti Nursyamsi",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["BackOffice"],
      modules: ["Biometric Device Purchase & Software Installation Listing", "SR Details page", "Export Excel", "Appointment Calendar (Add / Reschedule)"],
      trigger: "BO listing rows that share one SR reference number",
      environment: "Not stated.",
    },
    overview: [
      "Jira: \"Each record under the same running number should be suffixed with a 2-digit running number to differentiate them, e.g. SR67000001-01, SR67000001-02, SR67000001-03, SR67000001-04\". Same suffix on the Details page.",
      "Miro affected pages: listing, Export Excel, Reference No search, Details, Add Appointment, Reschedule Appointment. Miro estimate 3 days.",
      "Automation impact: the BO page object accepts /^SR[A-Za-z]*\\d+$/ and will not match \"-01\" (tests/service-hub/pages/bo/SoftwareInstallationListingPage.ts). Studying folder: _reference/tickets/Studying/EAINT-12123/.",
    ],
    srd: {
      file: "SRD_EAINT-12123_V1.1_Differentiate_Reference_Number_20260911.pdf (NOT retrieved — drop into the Studying folder)",
      version: "V1.1",
      date: "2026-09-11",
      status: "Ops greenlight: \"To update, Ops given greenlight for SRD V1.1 ya\" (BA, Teams, 2026-09-11 15:58). Revision: \"Updated Section 2.2.3 Affected Pages / Added Sections 2.2.7 to 2.2.8\".",
      requirements: [],
      notSpecified: ["SRD not read — requirements pending the file."],
    },
    decisions: [],
    openItems: [
      { question: "Does a single-record SR show \"-01\" or plain SR?", why: "Miro tests 1 installation / 1 device; Jira defines multi-record only." },
      { question: "Search: does the base SR return all \"-NN\" rows?", why: "Not stated." },
      { question: "BDP + SI rows: one sequence or separate?", why: "Not stated." },
      { question: "UCD side affected?", why: "Not named in Jira or Miro." },
    ],
    related: ["EAINT-10960", "EAINT-11880", "EAINT-12166", "EAINT-12167", "EAINT-11913", "EAINT-12124"],
    tags: ["backoffice", "service-hub", "reference-number", "listing", "biometric-device"],
  },
  {
    key: "EAINT-12124",
    url: "https://mfservices.atlassian.net/browse/EAINT-12124",
    title: "[eAuto-Service Hub] Create Email Notification with CC to Support for Biometric Device Purchase",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review (2026-10-22)",
      assignee: "Shane (Kasheng Liew, dev); QA field empty",
      reporter: "Batrisyia Hasanah Binti Nursyamsi",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["Backend (email)"],
      modules: ["Service Hub - Biometric Device Purchase email"],
      trigger: "Biometric Device Purchase (alone or with Software Installation) completing",
      environment: "Not stated.",
    },
    overview: [
      "Jira: \"Create an email notification for Biometric Device Purchase, sent from support@eauto.my, with CC to support@eauto.my. If Software Installation is purchased together with Biometric Device Purchase, send 1 combined email instead of separate emails\".",
      "Reschedule (Jira): \"only the existing Software Installation Rescheduled email is sent\". Existing SI templates unchanged.",
      "Miro scope: BDP; BDP + SI (Free); BDP + SI (Add On); SI; E2E Happy Flow; Payment = Failed. Estimate 2 days. Studying folder: _reference/tickets/Studying/EAINT-12124/.",
    ],
    srd: {
      file: "SRD_EAINT-12124_V1.0_Email_BDP_20260911.pdf (NOT retrieved — drop into the Studying folder)",
      version: "V1.0",
      date: "2026-09-11",
      status: "\"To update we received greenlight from Ops to proceed with this ya\" (BA, Teams, 2026-09-11 15:49).",
      requirements: [],
      notSpecified: ["SRD not read — subject, body, table layout and trigger point unknown."],
    },
    decisions: [
      { topic: "Paid Amount and free installation row", decision: "\"clarified with Nuru, we will show total amount for Paid Amount and just '-' for free installation\"", note: "Dev, Teams, 2026-09-28 09:34. Agreed after SRD V1.0." },
      { topic: "Dev complete", decision: "\"please note that the dev for this ticket is completed ya\"", note: "Dev, Teams, 2026-10-05 10:57." },
    ],
    openItems: [
      { question: "Does showing total Paid Amount in the device table double count the RM54 add-on row?", why: "Dev's own example: 850 + 54 shown, 904 total." },
      { question: "Combined email trigger: payment success or appointment booking?", why: "Code note: the payment-success email publish is commented out in production." },
      { question: "Any email on Payment = Failed?", why: "Miro lists it; Jira silent." },
    ],
    related: ["EAINT-11880", "EAINT-10960", "EAINT-12123"],
    tags: ["service-hub", "biometric-device", "email", "mailtrap"],
  },
  {
    key: "EAINT-12125",
    url: "https://mfservices.atlassian.net/browse/EAINT-12125",
    title: "[eAuto] Existing User: Enforce 12-Character Password Complexity Across All Portals with uppercase, lowercase, number & special character",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "In Development (2026-10-05)",
      assignee: "Lim Yi Link (BA); last named dev Lim Xiwei; QA field empty",
      reporter: "Lim Yi Link",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["UCD (web)", "BackOffice", "AATF", "Service Portal", "Secarang", "CIBO"],
      modules: ["Login / Change Password / BO Reset Password"],
      trigger: "Existing user changes or is given a new password",
      environment: "Not stated (Miro blank).",
    },
    overview: [
      "Existing users move to the 12-character policy. Policy (Teams, Yi Link, 2026-08-11 09:37): \"Minimum 12 characters in length. At least one (1) uppercase letter (A–Z). At least one (1) lowercase letter (a–z). At least one (1) number (0–9). At least one (1) special character ... No space allowed.\" Max 30 (2026-08-18 14:30).",
      "Split from EAINT-12155 (new users, Done, prod 2026-09-10). Miro package \"PACKAGE - ENFORCE 12-CHAR PASSWORD\" with 12228, 12299, 12333; no deploy date. Miro estimate 3 days.",
      "QA status (Azila, eAuto QAs, to 2026-10-21): \"On Hold ... Not Ready for Testing\"; dropped from her list from 2026-10-22. Studying folder: _reference/tickets/Studying/EAINT-12125/.",
    ],
    srd: {
      file: "EAINT-12125_SRD_Existing UCD - Enforce 12-Character Password Complexity ..._v1.0_20260901.pdf (NOT retrieved — drop into the Studying folder). Design: EAINT-12125_CCB-899_Existing_User_Password_Policy_Prototype_v0.2.html (2026-09-04).",
      version: "1.0",
      date: "2026-09-01",
      status: "Latest attachment. Unread.",
      requirements: [],
      notSpecified: ["SRD not read — portal list and screens to confirm against it."],
    },
    decisions: [
      { topic: "No forced change", decision: "\"Existing user - can update password with new password rules, but no forcing them to update before login.\"", note: "Yi Link, Teams, 2026-08-21 09:23." },
      { topic: "Same page, no popup", decision: "\"he suggested to remain users to change password at same page instead of popups ya.\"", note: "Yi Link, Teams, 2026-08-21 09:52." },
      { topic: "App not tested", decision: "\"the eAuto App will be sharing the same DB as the web version ... QA side doesn't need to specifically test this on the app ya\"", note: "Charmain, Teams, 2026-09-02 11:53; dev confirmed 12:00." },
      { topic: "Deployment", decision: "\"As of now, there is no planned deployment date for this ticket just yet\"", note: "Yi Link, Teams, 2026-10-01 15:39." },
    ],
    openItems: [
      { question: "Is it on staging?", why: "Miro says Ready for Testing; Jira In Development; Teams 2026-10-01 \"left only code review\"." },
      { question: "Which portals are in scope?", why: "Title/SRD say \"Existing UCD\"; Miro lists BO, AATF, Service Portal, Secarang, CIBO and the App; JPJ, Bank/Credit, Insurance missing." },
      { question: "Who is QA, which env, which date?", why: "All blank." },
    ],
    related: ["EAINT-12155", "EAINT-12228", "EAINT-12275", "CCB-899"],
    tags: ["password", "login", "security", "all-portals", "package-12-char-password"],
  },
  {
    key: "EAINT-12228",
    url: "https://mfservices.atlassian.net/browse/EAINT-12228",
    title: "[eAuto-Login Page] Add Forgot Password Link at Login Page for Self-Service Password Reset",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "In Development (2026-10-05)",
      assignee: "Lim Yi Link (BA); last named dev Lim Xiwei; QA field empty",
      reporter: "Chee Mei Jia",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["UCD", "AATF"],
      modules: ["eAuto Login Page – new Forgot Password page"],
      trigger: "Forgot Password link below the login box",
      environment: "Not stated (Miro blank).",
    },
    overview: [
      "Main UCD / Main AATF: verification code to registered email; Sub UCD / Sub AATF reset directly after a valid Login ID. 12-character policy applies. Other sessions logged out; user lands on Home.",
      "Jira superseding note: \"The verification code is sent to the Main User's registered email address. SMS and MessageBird are not used.\" \"valid for 5 minutes, allows a maximum of 5 incorrect attempts, and is limited to a maximum of 3 requests within a rolling 24-hour period.\"",
      "Miro card empty (no estimate, no scope, no QA). Azila status to 2026-10-21: \"On Hold ... Not Ready for Testing\". Studying folder: _reference/tickets/Studying/EAINT-12228/.",
    ],
    srd: {
      file: "SRD_EAINT-12228_v1.1_20260924.pdf (NOT retrieved — drop into the Studying folder, with ProcessFlow_EAINT-12228_ForgotPassword.png and Prototype_EAINT-12228_ForgotPassword.html)",
      version: "1.1",
      date: "2026-09-24",
      status: "Latest. Jira history: \"V1.1 | Added the verification code email template  Added the password change confirmation email template confirmed by Ops.\"",
      requirements: [],
      notSpecified: ["SRD not read."],
    },
    decisions: [
      { topic: "AATF included", decision: "\"we should include AATF and sub AATF for this ticket. ... AATF - same flow as Main UCD; sub AATF - same flow as sub UCD\"", note: "Yi Link, Teams, 2026-09-15 15:35." },
      { topic: "Confirmation email timing", decision: "\"it is sent to users email address only after user changed to new password successfully.\"", note: "Yi Link, Teams, 2026-09-15 15:51." },
    ],
    openItems: [
      { question: "Is the confirmation email copied to support@eauto.my?", why: "Jira note says copied; SRD v0.2 history says \"Removed the copy ... to support@eauto.my.\" SRD v1.1 decides." },
      { question: "Do BO / Service Portal / Secarang / CIBO logins get the link?", why: "Ticket names only \"eAuto Login Page\" plus AATF." },
      { question: "Who is QA, which env, which date?", why: "All blank. knowledge/flow-platform.md still says phone OTP — stale." },
    ],
    related: ["EAINT-12125", "EAINT-12155"],
    tags: ["login", "forgot-password", "ucd", "aatf", "email", "package-12-char-password"],
  },
  {
    key: "EAINT-12299",
    url: "https://mfservices.atlassian.net/browse/EAINT-12299",
    title: "[eAuto-UCD & BackOffice] Rename Uploaded File with Chinese Characters upon Upload in Pre-Application & Application",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review (2026-09-17)",
      assignee: "Lim Yi Link (BA); dev Jin Siang Boo; QA field empty",
      reporter: "Lim Yi Link",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["UCD", "BackOffice"],
      modules: ["Onboarding – Pre-Application & Application uploads"],
      trigger: "File with Chinese characters uploaded in Pre-Application / Application",
      environment: "Not stated (Jira \"Production\" = where the issue occurs).",
    },
    overview: [
      "Jira: \"Rename the file name on the spot after the user uploads the file, in both Pre-Application and Application.\" Root cause: Chinese filenames left BO unable to edit after [Create Account] (EAINT-12221 prod patch, 2026-08-20).",
      "Miro scope: 5 business types, \"35 files per business type, total around 175 files\"; flows Pre-Application, Application, Registration Document; Upload / Download / View. Estimate 4 days.",
      "No SRD. Studying folder: _reference/tickets/Studying/EAINT-12299/.",
    ],
    decisions: [
      { topic: "Rename format", decision: "\"we will translate Chinese to hanyupinyin which is \"sao miao quan neng wang.pdf\"\"", note: "BA, Teams, 2026-09-11 10:57. Jira still says \"Rename file name format is still to be discussed.\"" },
      { topic: "Dev ready", decision: "\"ya, can deploy to staging anytime (code review done)\"", note: "Dev, Teams, 2026-09-17 15:42. Dev also added \"some extra handling on other language\" (rules in a redacted artifact)." },
    ],
    openItems: [
      { question: "What are the \"other language\" rules?", why: "Only in a dev artifact; needed for expected results." },
      { question: "Are files uploaded before deploy renamed?", why: "Miro lists \"Existing transaction\" with no expected result." },
      { question: "Two files mapping to the same Pinyin name?", why: "Not stated." },
      { question: "QA, env, deploy date?", why: "All blank." },
    ],
    related: ["EAINT-12221", "EAUTO-1037"],
    tags: ["ucd", "backoffice", "onboarding", "upload", "filename", "package-12-char-password"],
  },
  {
    key: "EAINT-12333",
    url: "https://mfservices.atlassian.net/browse/EAINT-12333",
    title: "[eAuto-BackOffice] To Create Invoice for Proforma Invoice Module",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review (2026-10-01)",
      assignee: "Lim Yi Link (BA); dev Jin Siang Boo; QA field empty",
      reporter: "Lim Yi Link",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02)",
    },
    scope: {
      portals: ["BackOffice"],
      modules: ["Proforma Invoice (Generate, Listing, Details)", "Credit Note", "e-Invoice / Consolidated e-Invoice"],
      trigger: "Proforma Invoice payment: generate invoice and/or e-Invoice",
      environment: "Not stated (Miro blank).",
    },
    overview: [
      "Jira: \"The system shall generate an invoice and/or e-invoice.\" Why: \"UCD requires the invoice after making a payment where they do not have a TIN. Refer to source ticket EAUTO-1055.\"",
      "Miro: existing records — \"Invoice auto-generated upon deployment (no BackOffice action)\"; new — \"[Generate Invoice & e-Invoice] button\"; \"Valid TIN: Invoice + e-Invoice generated\"; \"Invalid / No TIN: Invoice generated only; no e-Invoice\". Estimate 5 days.",
      "Dev, Teams, 2026-09-29 11:45: \"this ticket done development and can be deploy to staging anytime for QA Testing ya\". Studying folder: _reference/tickets/Studying/EAINT-12333/.",
    ],
    srd: {
      file: "SRD_EAINT-12333_v1.0_20260917.pdf (NOT retrieved — drop into the Studying folder)",
      version: "1.0",
      date: "2026-09-17",
      status: "Latest attachment. Unread.",
      requirements: [],
      notSpecified: ["SRD not read. Invoice numbering format not stated anywhere read."],
    },
    decisions: [
      { topic: "Priority", decision: "\"not urgent ticket ya\"", note: "Yi Link, Teams, 2026-09-25 17:36." },
    ],
    openItems: [
      { question: "UCD in scope?", why: "Jira lists UCD Web/Mobile and Homepage; Miro says \"UCD Portal (Web / Mobile): no change (out of scope)\"." },
      { question: "Which existing records are \"not covered by the deployment backfill\"?", why: "Miro item, no definition." },
      { question: "Why is it in the 12-char password package?", why: "No source explains it." },
      { question: "QA, env, deploy date?", why: "All blank." },
    ],
    related: ["EAUTO-1055", "EAINT-7583", "EAINT-8538", "EAINT-11069"],
    tags: ["backoffice", "proforma-invoice", "invoice", "e-invoice", "package-12-char-password"],
  },
  {
    key: "EAINT-12088",
    url: "https://mfservices.atlassian.net/browse/EAINT-12088",
    title: "[eAuto-UCD] Automate Public Holiday List via Google Calendar Integration",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Code Review (since 2026-09-03)",
      assignee: "zhan.choon (dev); QA Charmain Ea Chiang (set 2026-10-19)",
      reporter: "Batrisyia Hasanah Binti Nursyamsi",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02); Miro column \"3RD NOV DEPLOYMENT\"",
    },
    scope: {
      portals: ["UCD", "BackOffice"],
      modules: ["Service Hub – Software Installation Appointment Calendar", "BO Appointment Calendar", "Reschedule"],
      trigger: "Slot picker / reschedule calendar greying public holidays from Google Calendar (KL + National)",
      environment: "Not stated.",
    },
    overview: [
      "Jira: \"Automate the public holiday (PH) list in the system calendar by integrating with Google Calendar\". Source: \"Kuala Lumpur + National (Malaysia) public holidays from Google Calendar.\"",
      "Scenario A (Sunday PH → Monday greyed, Tuesday selectable, earliest reschedule Wednesday); B (Sun + Mon PH); C (tentative PH moved: no auto-cancel, email \"Public Holiday Calendar Update - Booked Appointments Affected\" from imonitor@eauto.my to support@eauto.my, cc ops@eauto.my).",
      "No SRD. Deploy 3 Nov per Miro; Jira Exp. Deploy Date cleared 2026-10-19. Miro estimate 1 day. Studying folder: _reference/tickets/Studying/EAINT-12088/.",
    ],
    decisions: [
      { topic: "Deployment type", decision: "\"Will require deployment , morning should be fine\"", note: "Dev, Teams (EAINT-12099 group), 2026-09-18 10:05." },
    ],
    openItems: [
      { question: "+2 reschedule buffer: counted from today or from the last greyed day?", why: "Jira says from the last greyed day; repo knowledge says earliest = today+2." },
      { question: "How are test PH dates created on staging?", why: "Calendar shows 2 months only; Sunday PH and tentative moves cannot be arranged naturally." },
      { question: "Is the Scenario C email system-sent, and when does the sync run?", why: "Jira says \"IT to notify\" yet gives an automated template." },
      { question: "Test env?", why: "Not stated." },
    ],
    related: ["EAINT-10960", "EAINT-11880", "EAINT-12087"],
    tags: ["ucd", "backoffice", "service-hub", "public-holiday", "google-calendar", "appointment-calendar"],
  },
  {
    key: "EAINT-12099",
    url: "https://mfservices.atlassian.net/browse/EAINT-12099",
    title: "[eAuto-BackOffice] Shopping Cart - To Create Inventory Control Module",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "REQ REVIEW IN PROGRESS - EAUTO (since 2026-09-14)",
      assignee: "Chee Mei Jia (BA lead); dev Xiwei Lim; QA field empty",
      reporter: "Batrisyia Hasanah Binti Nursyamsi",
      fixVersion: "S35.X-20261105 (release date 2026-11-05; \"Main item(s): 1. Inventory Control Phase 1\"); Exp. Deploy Date 5 Nov 2026",
    },
    scope: {
      portals: ["BackOffice", "UCD"],
      modules: ["Service Hub > Inventory Control Report", "Stock In Request", "Stock Out Request", "Inventory Control Dashboard", "UCD > Biometric Device Purchase (available stock)"],
      trigger: "Scan-based Stock In / Stock Out of Dermalog devices, dashboard Safe Level %, low-stock email",
      environment: "Not stated. Dev, CR group, 2026-10-12 16:09: \"Do let me know which env and when to deploy ya\" — no answer.",
    },
    overview: [
      "New BO inventory pages (report with 18-column listing, Stock In, Stock Out, dashboard) and UCD available-stock rule: \"Paid-but-not-shipped units now count as taken\" (Miro).",
      "Split 2026-10-26 (Mei Jia, CR group, 10:16): \"Ticket 1: EAINT-12099 ... To proceed arrange deployment, push to prod first. ... Ticket 2: EAINT-12635 for those items that did not cover in EAINT-12099\". 12635 = Manual Purchase, Reserve Unit, Iris Scanning.",
      "Miro: 7 days (1 QA), \"~250 TS\", \"47 message strings - asserted literally\". Charmain 2026-10-26: \"To draft high level scope and provide testing estimation\". Studying folder: _reference/tickets/Studying/EAINT-12099/.",
    ],
    srd: {
      file: "SRD_EAINT-12099_v1.1_20261009.pdf (NOT retrieved — drop into the Studying folder, with Mock Up_EAINT-12099_BackOffice Portal_20261009.html)",
      version: "1.1",
      date: "2026-10-09",
      status: "Combined Stock In, Stock Out and Dashboard SRD. \"i updated SRD v1.1 based on Tracey's feedback ya. and also attached the mockup will send out for external review\" (BA lead, Teams, 2026-10-09 14:58).",
      requirements: [],
      notSpecified: ["SRD not read — 47 message strings and Safe Level formula need it."],
    },
    decisions: [
      { topic: "Low-stock email recipient", decision: "\"can send to this email ya: operation@eauto.my\"", note: "BA lead, Teams, 2026-09-28 11:16." },
      { topic: "Dev clarifications", decision: "Auto-save on every scan (no Save button); eautonurul has Stock Out access; one row per unit; email \"daily at 08:00\" when Safe Level < 30%; Safe Level = \"BF ÷ (Stock Opening + Stock IN) × 100\"; refurbished/damaged units phase 2.", note: "Dev, Teams, 2026-09-29 08:49." },
      { topic: "Scope split", decision: "Deploy 12099 with what is already built; uncovered items to EAINT-12635.", note: "Mei Jia, CR group, 2026-10-26 10:16." },
    ],
    openItems: [
      { question: "Low-stock email: daily 08:00 or 6:00 AM once per drop?", why: "Teams 2026-09-29 vs Miro." },
      { question: "Was the SRD Safe Level formula corrected in v1.1?", why: "Dev said the SRD formula was wrong (2026-09-29); v1.1 is later but unread." },
      { question: "QA owner and test env?", why: "QA field cleared 2026-09-25; env not answered." },
    ],
    related: ["EAINT-12635", "EAINT-10960", "EAINT-11880", "EAINT-12166", "EAINT-12167", "EAUTO-857", "CCB-878"],
    tags: ["backoffice", "ucd", "service-hub", "inventory", "biometric-device", "stock"],
  },
  {
    key: "EAINT-11868",
    url: "https://mfservices.atlassian.net/browse/EAINT-11868",
    title: "[eAuto-Application] To Implement Email Reminders & Application Link Reactivation",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "Code Review (2026-10-19)",
      assignee: "Lim Yi Link (BA); dev Lim Xiwei; QA Siti Nur Azila",
      reporter: "Lim Yi Link",
      fixVersion: "[QA]Ready for Testing Tickets (release date 2026-11-02); Miro column \"26TH NOV DEPLOYMENT\" (all dates TBC)",
    },
    scope: {
      portals: ["Potential UCD (Application form)", "BackOffice"],
      modules: ["UCD Application Form – reminder emails", "Application link reactivation"],
      trigger: "Time-based reminder emails; [Reactivate Application] button in the expired email",
      environment: "Miro: \"Test Env: staging/uat1\".",
    },
    overview: [
      "SRD 2.1.1: \"automated reminder emails, a one-time application expiry extension, and application link reactivation.\" Extension already shipped as EAINT-11982 (2026-09-02); 11868 now = reminders + reactivation [inference].",
      "Reminders from imonitor@eauto.my, CC apply@eauto.my: 3 days after approval; 2 months and 1 month before expiry; payment 1 day after Softcopy Docs = Checked; hardcopy 3 days after payment.",
      "Reactivation: RM108 Pre-Application fee, new PA record each time, link valid 90 days from payment, \"There is no maximum limit on the number of reactivations.\"",
      "Azila status to 2026-10-22: \"To continue study SRD ... Not Ready for Testing\". Studying folder: _reference/tickets/Studying/EAINT-11868/ (SRD v1.4 text copy).",
    ],
    srd: {
      file: "_reference/tickets/Studying/EAINT-11868/EAINT-11868-SRD-v1.4-20260826-text.txt (PDF not retrieved)",
      version: "1.4",
      date: "2026-08-26",
      status: "Latest. SRD title: \"[eAuto-Application] To Implement Email Reminders, Expiry Extension & Application Link Reactivation\".",
      requirements: [
        { id: "§2.2.4", text: "Reminder emails 1-5 (sender imonitor@eauto.my, CC apply@eauto.my). \"Each reminder fires once on its scheduled date; the cycle restarts after extension or reactivation.\"" },
        { id: "§2.2.5", text: "One-time expiry extension (delivered by EAINT-11982 — regression)." },
        { id: "§2.2.6", text: "[Reactivate Application] in the expired email; RM108 payment; new PA record; 90-day link; status Approved; SSM refresh before Step 4; failed payment PA not in PA listing." },
      ],
      notSpecified: [
        "Miro rule \"30 days > no reactivation email > 60days > no reactivation email > 90 days > send reactivation email\" has no SRD match.",
        "How time-based emails are triggered on staging.",
      ],
    },
    decisions: [
      { topic: "Reactivation", decision: "\"UCD to pay Pre-Application (AP) fee to reactivate their Application link; Record each \"Reactivation\" as a PA record; UCD shud use same application link\"", note: "BA, Teams, 2026-07-29 13:01." },
      { topic: "Reminder rules", decision: "\"a. Each reminder is triggered only on the exact scheduled date. b. Each reminder is sent only once. c. The reminder cycle resets whenever the application is extended or reactivated.\"", note: "BA, Teams, 2026-08-20 18:33." },
      { topic: "Deployment type", decision: "\"EAINT-11868 need deployment and morning deployment is fine\"", note: "Dev, Teams, 2026-09-21 09:06." },
    ],
    openItems: [
      { question: "Which Hardcopy & Acc Created states get Emails 2/3?", why: "Teams 2026-08-05: \"not send ... when ... is NOT \"Registered\" & \"Pending Assignee\"\" — double negative." },
      { question: "How are 3-day / 1-2-month / 90-day emails forced on staging?", why: "Needs a dev date patch or cron trigger." },
      { question: "Who tests on 26 Nov, and on which env?", why: "Jira QA = Azila; Miro QA blank; Miro uat1 vs dev note \"apply to all staging environments\"." },
    ],
    related: ["EAINT-11982", "EAINT-12235", "EAINT-11829", "EAINT-12346", "EAINT-12153", "EAINT-12257", "EAUTO-947", "CCB-824"],
    tags: ["onboarding", "application", "email", "reminder", "reactivation"],
  },
  {
    key: "EAINT-12348",
    url: "https://mfservices.atlassian.net/browse/EAINT-12348",
    title: "[eAuto-AATF & BackOffice] eDereg: Enable PBT Organisations as Active eDereg Users",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "REQ REVIEW IN PROGRESS - EAUTO",
      assignee: "Chee Mei Jia (BA); dev zhong.tai (Sia Zhong Tai); QA field empty",
      reporter: "Chee Mei Jia",
      fixVersion: "None. Jira ETA for Testing 2026-10-27; Miro column \"26TH NOV DEPLOYMENT\" (all dates TBC)",
    },
    scope: {
      portals: ["AATF (PBT login)", "BackOffice"],
      modules: ["BO Manage AATF/PBT Account", "eDereg Pre-Checking", "Deregistration", "BO reports (RHB Payment Transaction, PBT Payment Report, JPJ XML Log)"],
      trigger: "BO creates a login-enabled PBT company account; PBT user runs eDereg",
      environment: "Not stated.",
    },
    overview: [
      "Jira: \"Company Type = PBT creates a login-enabled organisation account, not only a reference record used in AATF function.\" Own numbering \"PBT0000001\"; AATF sequence unchanged. Mandatory Organisation Name dropdown (~154 PBTs / licensed AATFs); no duplicate active accounts.",
      "SRD remarks: v0.9 \"Receipt No fixed number for PBT confirmed as 0810\"; v1.1 \"Added mandatory AATF dropdown at Dereg Step 2 for PBT users\", \"Cancel available to BackOffice users only\", \"Removed eDereg Pre-Checking column from Deregistration Transaction Listing\".",
      "SRD v1.1 sent to requestor 2026-10-23. Dev ETA (excluding Perakuan): \"next Monday EOD including code review\" (2026-10-19 11:07) = 2026-10-26. Studying folder: _reference/tickets/Studying/EAINT-12348/.",
    ],
    srd: {
      file: "SRD_EAINT-12348_v1.1_20261023.pdf (NOT retrieved — drop into the Studying folder)",
      version: "1.1",
      date: "2026-10-23",
      status: "\"sent out srd v1.1 for requestor to review ya\" (Mei Jia, CR group, 2026-10-23 15:26).",
      requirements: [],
      notSpecified: ["SRD not read. Mock-ups (20261020), PBT master list xlsx and invoice samples also unread."],
    },
    decisions: [
      { topic: "PBT receipt code", decision: "\"for the PBT version we will use \"0810\" ya\"", note: "Mei Jia, CR group, 2026-10-19 08:19." },
      { topic: "5-vehicle search limit", decision: "\"this handling has been removed last year ya\"", note: "Mei Jia, CR group, 2026-10-19 09:45." },
      { topic: "TIN / e-Invoice", decision: "\"confirmed PBT will have TIN. hence, will have e-invoice\"", note: "BA, Teams, 2026-10-08 16:37." },
      { topic: "Flow status", decision: "\"the flow is confirmed, now just pending the perakuan part from ops team\"", note: "Mei Jia, CR group, 2026-10-19 10:48." },
    ],
    openItems: [
      { question: "Deployment date: 26 Nov (Miro) or testing from 27 Oct (Jira ETA)?", why: "Status still REQ REVIEW IN PROGRESS." },
      { question: "Does PBT0000001 cover Dereg, Pre-Checking or both?", why: "Teams proposed \"PBTPC69000001\" for Pre-Checking." },
      { question: "JPJ submission for PBT without BRN?", why: "Shortform suggestion has duplicates; outcome not recorded." },
      { question: "QA owner and env?", why: "Both blank." },
    ],
    related: ["EAINT-9306", "EAINT-12252"],
    tags: ["aatf", "backoffice", "edereg", "pbt", "deregistration"],
  },
  {
    key: "EAINT-12019",
    url: "https://mfservices.atlassian.net/browse/EAINT-12019",
    title: "[eAuto-UCD] eMOVE – Standalone Logistics Service",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "REQ REFINEMENT IN PROGRESS -EAUTO",
      assignee: "Chee Mei Jia (BA); Developer field empty (Teams: Wei Ting Lim); QA field empty",
      reporter: "Chee Mei Jia",
      fixVersion: "None. Miro column \"26TH NOV DEPLOYMENT\" (all dates TBC)",
    },
    scope: {
      portals: ["UCD", "BackOffice", "Driver Pick Up / Drop Off pages"],
      modules: ["eMOVE (new standalone module)", "BO eMOVE listing / details", "Finance vendor payment", "Charges Matrix"],
      trigger: "UCD requests car delivery after a completed UCD-to-UCD interstate transfer or an approved eSTM",
      environment: "Not stated.",
    },
    overview: [
      "Jira: \"eMOVE — new standalone module in UCD Portal. Confirmed 26.08.2026: not placed under STMS (eSTM & UCD to UCD).\" Door-to-Door and Hub-to-Hub; fee by distance, vehicle type, method, accessibility; \"Charges matrix to be confirmed.\"",
      "Driver scans a QR to upload photos and update status; invoice + e-Invoice after payment; Finance vendor payment via MotoHub PO.",
      "SRD still a draft (v0.8, 2026-10-21). Requirement discussion with Nurul set \"this coming Friday 11am\" (Mei Jia, 2026-10-21 10:54); outcome not posted. Studying folder: _reference/tickets/Studying/EAINT-12019/.",
    ],
    srd: {
      file: "SRD_EAINT-12019_v0.8_20261021.docx (NOT retrieved — drop into the Studying folder)",
      version: "0.8 (draft)",
      date: "2026-10-21",
      status: "Draft, no v1.0 baseline. v0.7: \"Removed JPJ Approved Date limit\", \"Added Wholesale conflict check\". v0.8: cancellation handling, SST Payment Report, Service column, server-side messages.",
      requirements: [],
      notSpecified: ["SRD not read. Mock-ups (UCD, BO, Driver Pick Up / Drop Off, 20261009) unread."],
    },
    decisions: [
      { topic: "Not Wholesale", decision: "\"there is nothing related to the wholesale flow, this is the logistics standalone module.\"", note: "BA, Teams, 2026-08-28 12:25." },
      { topic: "QR and DO reused", decision: "\"the QR and Delivery Order use the existing flow and template / there are no changes on QR and delivery order in this ticket\"", note: "BA, Teams, 2026-09-15 14:21." },
      { topic: "Payee", decision: "\"emove payment will go to eAuto Sdn Bhd ya. / for wholesale part will go to eAuto Digits\"", note: "BA, Teams, 2026-10-14 18:27." },
      { topic: "Wholesale regression", decision: "\"for wholesale part will need to regress, maybe on DO generation + qr scanning\"", note: "Dev, Teams, 2026-10-14 16:10. Wholesale TS are manual only." },
    ],
    openItems: [
      { question: "Which charges apply: \"to be confirmed\" matrix, EAINT-12119 tiers, or EAINT-11824 Hub-to-Hub +RM200?", why: "Jira row 6 vs Done/Closed tickets." },
      { question: "Driver entry: QR-first or QR or reg-no?", why: "REQ-060 question unanswered since 2026-09." },
      { question: "Is Finance / MotoHub vendor payment in this release?", why: "Large scope; SRD still draft." },
      { question: "QA owner and env?", why: "Both blank." },
    ],
    related: ["EAINT-11731", "EAINT-12119", "EAINT-11824", "EAINT-11884", "EAINT-12378", "EAUTO-936"],
    tags: ["ucd", "backoffice", "emove", "logistics", "wholesale"],
  },
  {
    key: "EAINT-12107",
    url: "https://mfservices.atlassian.net/browse/EAINT-12107",
    title: "[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay",
    studiedAt: "2026-10-15",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Code Review (dev says ready for QA since 2026-09-15)",
      assignee: "Lim Yi Link",
      reporter: "Chee Mei Jia",
      fixVersion: "S34.X-20261020/21 TBC (release date 2026-10-20)",
    },
    scope: {
      portals: ["Secarang", "CIBO"],
      modules: ["Fiuu payment gateway (Secarang checkout)", "CIBO > Payment Management > Payment Channels filter", "CIBO > Transaction Management > Transaction Details", "CIBO Payment Report (Payment Reference ID)"],
      trigger: "Secarang insurance checkout payment step: GrabPay / GrabPay PayLater / ShopeePay / SPayLater tiles under the Fiuu gateway, then the CIBO filter, details and export that display the chosen channel",
      environment: "Staging. Shane, Jira comment 2026-09-07: \"changes are up in staging ya\"; 2026-09-09: \"cibo staging changes are up as well\".",
    },
    overview: [
      "Adds ShopeePay and GrabPay as Fiuu e-wallet rails in Secarang, each with a Buy-Now-Pay-Later sub-option (SPayLater, PayLater by Grab). The BNPL tenure is handled by Shopee/Grab, not stored by Secarang (SRD assumption 3).",
      "CIBO gets a \"Fiuu - eWallet\" filter group with 4 checkboxes (REQ-011 to 013) and e-wallet transactions carry an EW marker in the Payment Reference ID, e.g. LON20260908SEW0002 (REQ-014/015).",
      "Only GrabPay Full Amount is testable in the Fiuu sandbox (SRD §2.2.8). ShopeePay, SPayLater and PayLater by Grab are verified through dev data patching, which Shane confirmed is possible (Jira comment 2026-09-09).",
      "Testing came back to Faizuddin on 2026-10-15 (May Chin Mei Theng, eAuto QAs chat, 10:11) at 1 + 1 = 2 days, with EAINT-12327 tested together. It had been with Amirul Azfar since 2026-09-15; the Jira QA field still names Azfar.",
    ],
    srd: {
      file: "_reference/tickets/EAINT-12107/SRD_EAINT-12107_[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay_v1.1_20260911.pdf",
      version: "1.1",
      date: "2026-09-11",
      status: "Latest. Jira SRD table row 4: \"Updated Section 2.2.3 Added Section 2.2.9 Payment Reference ID\". No newer version since.",
      requirements: [
        { id: "REQ-001..010", text: "ShopeePay and GrabPay tiles under Fiuu, each with Full Amount and BNPL sub-options; payment flow (§2.2.6) and success/fail handling unchanged from the existing Fiuu rails." },
        { id: "REQ-011", text: "CIBO Payment Channels filter gets a \"Fiuu - eWallet\" group: GrabPay, GrabPay - PayLater by Grab, ShopeePay, ShopeePay - SPayLater." },
        { id: "REQ-012", text: "Ticking the parent group ticks all 4 children." },
        { id: "REQ-013", text: "Any child can be unticked on its own without affecting the others." },
        { id: "REQ-014/015", text: "E-wallet transactions carry EW in the Payment Reference ID (e.g. LON20260908SEW0002), shown in 5 places including the CIBO Payment Report." },
      ],
      notSpecified: [
        "The exact text per channel in the CIBO Transaction Listing row (the SRD names the Transaction Details view only). EAINT-12327 now defines the listing format.",
        "Failed-payment wording for the new rails.",
      ],
    },
    decisions: [
      { topic: "Insurer coverage", decision: "Any one available insurer is enough. All insurers share the same gateway.", note: "Charmain checked with KJ, relayed by Faizuddin to May Chin, eAuto QAs chat, 2026-09-11 16:37." },
      { topic: "Sandbox limits", decision: "GrabPay Full Amount is the only live-testable rail. ShopeePay, SPayLater and PayLater by Grab are covered by dev-patched transactions.", note: "SRD v1.1 §2.2.8; Shane, Jira 2026-09-07 and 2026-09-09." },
      { topic: "Agreed test scope", decision: "E2E: GrabPay OK, GrabPay Failed, regression of Card or FPX. Dev-patched: ShopeePay, SPayLater, PayLater by Grab. Functional: CIBO filter and payment-type display including the export.", note: "May Chin Mei Theng and Faizuddin, eAuto QAs chat, 2026-09-11 16:31 to 18:21. Estimate 1 + 1 days." },
      { topic: "Deployment slot", decision: "\"can deploy in morning ya\" for this CR and EAINT-12327.", note: "Kasheng Liew, EAINT-12107 Teams chat, 2026-10-07 12:55, answering Mei Jia Chee 11:54." },
    ],
    openItems: [
      { question: "Has dev patched the 3 BNPL / ShopeePay transactions on staging yet?", why: "Groups 2 and 3 of the agreed scope cannot run without them. Request them on day 1." },
      { question: "Does the regression TS portion exist? The 2026-09-15 EOD post said \"Pending regression TS\".", why: "The handed-over xlsx covered E2E and negative flow only." },
    ],
    testScript: {
      path: "EAINT-12107 - [Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay.xlsx (shared in Teams 2026-09-15, not in this repo)",
      total: 6,
      blocks: [
        { label: "E2E GrabPay OK / Failed / regression", range: "E2E TS1-TS3", count: 3, tone: "e2e" },
        { label: "Dev-patched ShopeePay / SPayLater / PayLater by Grab", range: "Patch TS1-TS3", count: 3, tone: "edge" },
      ],
    },
    automation: {
      intro: "scripts/secarang-insurance already drives Fiuu checkout and selects the outcome in the sandbox. GrabPay OK/Failed is a new payment-type branch on the same chain. CIBO checks are manual until a CIBO page object exists.",
      groups: [
        { verdict: "automatable", title: "GrabPay E2E", cases: ["E2E TS1", "E2E TS2", "E2E TS3"], reason: "Same chain as the FPX rails; outcome is selectable in the sandbox." },
        { verdict: "manual", title: "Dev-patched rows and CIBO filter/export", cases: ["Patch TS1-TS3", "Functional"], reason: "Depends on patched data and on CIBO, which has no automation yet." },
      ],
      blockers: [
        "No CIBO page objects or captured HTML in the repo.",
        "No Secarang HTML captured either — the GrabPay tile, Full Amount sub-option, Fiuu e-wallet popup, card popup and failed page are driven by unconfirmed selectors (scripts/eauto-12107/pages/PaymentTypePage.ts:7-13, FiuuSandboxPage.ts:8-16, PaymentFailedPage.ts:10-12).",
      ],
    },
    related: ["EAINT-12327", "ESI-355"],
    tags: ["secarang", "cibo", "fiuu", "grabpay", "shopeepay", "bnpl", "payment"],
  },
  {
    key: "EAINT-12327",
    url: "https://mfservices.atlassian.net/browse/EAINT-12327",
    title: "[CIBO] To Enhance Payment Mode Column Format in Transaction Listing and Payment Report",
    studiedAt: "2026-10-15",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Ready For Development",
      assignee: "Lim Yi Link",
      reporter: "Lim Yi Link",
      fixVersion: "S34.X-20261020/21 TBC (release date 2026-10-20)",
    },
    scope: {
      portals: ["CIBO"],
      modules: ["Transaction Management > Transaction Listing (+ export)", "Payment Report (+ export)"],
      trigger: "CIBO > Transaction Management > Transaction Listing, its exported file, CIBO > Payment Report, and its exported file",
      environment: "Not stated in the ticket or SRD. Tested together with EAINT-12107, which is on staging. Dev side not finished as of the last Teams message (Kasheng Liew, 2026-10-01).",
    },
    overview: [
      "The Payment Mode value becomes one standard string in the order gateway, method, details: BoldPay | eWallet - TouchNGo; BoldPay | Online Banking - FPX-Bank Name; BoldPay | Credit/Debit Card - MBBMGATE_MS; Fiuu | eWallet - ShopeePay - Full Amount - Single Payment; Fiuu | eWallet - ShopeePay - BNPL - Installment; Fiuu | eWallet - GrabPay - Full Amount - Single Payment; Fiuu | eWallet - GrabPay - BNPL - Installment.",
      "Transaction Listing and its export get a new Payment Mode column after Payment and before Discount Code. Payment Report and its export keep the column position but change the value, which today shows only the gateway name (BoldPay or Fiuu).",
      "Purpose: let the requestor see which gateway and method each Secarang payment used (source ticket ESI-355, cross-department CCB-949).",
      "May Chin Mei Theng, 2026-10-15: \"test together with 12107\". The 7 format strings need one transaction per payment mode, so the dev data patching planned for EAINT-12107 must cover all 7.",
    ],
    srd: {
      file: "_reference/tickets/EAINT-12327/EAINT-12327-SRD-v1.0-20260917.pdf",
      version: "1.0",
      date: "2026-09-17",
      status: "Baseline. Only v0.1 and v1.0 exist, both dated 2026-09-17, author Lim Yi Link.",
      requirements: [
        { id: "REQ-001", text: "Existing and new BoldPay and Fiuu transactions display Payment Mode in the order gateway, method, details, using the 7 strings in §2.2.4." },
        { id: "REQ-002", text: "The value for the same transaction is identical in the Transaction Listing, the Payment Report and both exported files." },
        { id: "REQ-003", text: "Transaction Listing: existing columns unchanged; new Payment Mode column after Payment and before Discount Code." },
        { id: "REQ-004", text: "Transaction Listing and its export show a dash when no payment mode is recorded. Payment Report has no blank values." },
        { id: "REQ-005", text: "Exported Transaction Listing has the new column in the same position and the same value as the page." },
        { id: "REQ-006", text: "Payment Report: column position unchanged, value updated to the new format for every transaction." },
        { id: "REQ-007", text: "Exported Payment Report shows the same value as the page." },
      ],
      notSpecified: [
        "Whether existing (historical) rows are back-filled or only rows created after deployment change. REQ-001 says \"Existing and new transactions\" but gives no migration rule.",
        "The bank-name source for \"FPX-Bank Name\" and whether other BoldPay e-wallets besides TouchNGo exist.",
        "Any filter or sort on the new column.",
      ],
    },
    decisions: [
      { topic: "Dev ownership", decision: "Kasheng Liew took the ticket over from Wong Kar Kin.", note: "EAINT-12327 Teams chat, 2026-10-01 10:35. On 2026-09-28 13:21 Kasheng said: \"not done yet. transaction listing and payment report both untouched on latest staging, need frontend and backend. 12107 got some parts can reuse\"." },
      { topic: "Deployment slot", decision: "Morning deployment together with EAINT-12107.", note: "Kasheng Liew, EAINT-12107 Teams chat, 2026-10-07 12:55." },
    ],
    openItems: [
      { question: "When does the build reach staging?", why: "Jira is still Ready For Development; no dev comment on the ticket." },
      { question: "Do historical rows get the new format, or only new rows?", why: "Decides whether the regression data set needs patching." },
    ],
    automation: {
      intro: "No CIBO automation exists. Export comparison would fit the data-verification standard once a CIBO login and listing page object exist.",
      groups: [
        { verdict: "manual", title: "All 7 requirements", cases: ["REQ-001 to REQ-007"], reason: "No CIBO page objects; 7 payment modes need patched data." },
      ],
      blockers: ["No CIBO page objects or captured HTML in the repo."],
    },
    related: ["EAINT-12107", "ESI-355", "CCB-949"],
    tags: ["cibo", "transaction-listing", "payment-report", "export", "payment-mode"],
  },
  {
    key: "EAINT-12412",
    url: "https://mfservices.atlassian.net/browse/EAINT-12412",
    title: "[eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge",
    studiedAt: "2026-10-15",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Ready For Development (2026-10-15; QA field empty, no comments)",
      assignee: "Chee Mei Jia",
      reporter: "Chee Mei Jia",
      fixVersion: "S34.X-20261020/21 TBC (release date 2026-10-20)",
    },
    scope: {
      portals: ["UCD", "BackOffice"],
      modules: ["JomCheck – Invoice & e-Invoice"],
      trigger: "Invoice download (#to-print-invoice) and e-Invoice download (#to-print-e-invoice) on the UCD and BO JomCheck transaction details pages, plus the e-Invoice submitted to LHDN",
      environment: "Not stated in the ticket, the SRD, Teams or the QA Portal task (\"Own staging\") as of 2026-10-15. uat1 is now Wei Ting's wholesale env, uat3 = EAINT-8622, preprod1 = Insurance Cancellation.",
    },
    overview: [
      "The single invoice line \"JomCheck service charge\" RM20.00 + SST RM1.60 = RM21.60 is split into 2 lines: RM18.00 + SST RM1.44 = RM19.44, and RM2.00 + SST RM0.16 = RM2.16.",
      "Total payable stays RM21.60. Only the invoice and e-Invoice change. Screens, purchase price and the revenue split (eAuto RM6 / ezAUTO Asia RM14) stay as today.",
      "Applies only to transactions approved after deployment. The approval date decides, even when the transaction was created before deployment.",
      "Dev PIC Sia Zhong Tai: dev incl. code review due Fri 2026-10-09 (Teams 07/10 09:42, 10:37); morning-session deployment (Teams 12/10 16:37). QA estimate 1 + 1 = 2 days, deploy 20 or 21 Oct (May Chin, eAuto QAs 15/10 10:11).",
    ],
    srd: {
      file: "_reference/tickets/EAINT-12412/EAINT-12412-SRD-v1.0-20260930-reupload-20261009.pdf",
      version: "1.0 (PDF re-uploaded 2026-10-09, carries the v0.3 renames)",
      date: "2026-09-30",
      status: "Baseline. Requestor approved, per Chee Mei Jia in Teams, 2026-10-01 14:27. The first v1.0 PDF (2026-10-01 copy) was not regenerated after v0.3; cite only the re-uploaded PDF for line names and the classification code.",
      requirements: [
        { id: "REQ-001", text: "New breakdown cut-off by transaction approval date and time. Approved before deployment: invoice keeps 1 line RM21.60, e-Invoice not resubmitted. Created before but approved after deployment: 2 lines." },
        { id: "REQ-002", text: "Line 1 \"JomCheck report\": Quantity 1, Unit Price RM18.00, Subtotal RM18.00, Tax Amount RM1.44, Total Price RM19.44." },
        { id: "REQ-003", text: "Line 2 \"JomCheck service charge\": Quantity 1, Unit Price RM2.00, Subtotal RM2.00, Tax Amount RM0.16, Total Price RM2.16. No line 2 on transactions approved before deployment." },
        { id: "REQ-004", text: "Totals are the sum of the 2 lines. Subtotal row RM20.00 | RM1.60 | RM21.60; Total Net Amount RM20.00; Total Excluding Tax RM20.00; Tax Amount RM1.60; Total Including Tax RM21.60; Total Payable Amount RM21.60." },
        { id: "REQ-005", text: "UCD and BackOffice invoices for the same transaction show identical line items and totals." },
        { id: "REQ-006", text: "e-Invoice submitted to LHDN with the same 2 lines, total RM21.60. \"Both line items use classification code 022.\" Approved before deployment: \"e-Invoice remains as submitted, no resubmission\"." },
      ],
      notSpecified: [
        "Behaviour of cancelled or refunded JomCheck transactions and of credit notes. The dev says cancellations are unchanged; the SRD is silent.",
        "Rounding. It does not apply at RM18/RM2 with 8%, but the SRD gives no rule.",
        "The LHDN-side check: how QA sees the submitted 2-line payload (MyInvois portal, BO LHDN Response Status, or the dev's sandbox only).",
        "The exact deployment time to use as the cut-off on staging.",
      ],
    },
    decisions: [
      { topic: "Invoice wording only, or a real revenue split change", decision: "Option A: invoice wording only. Revenue split stays eAuto RM6 / ezAUTO Asia RM14.", note: "BA answer Q1, dev analysis doc (Goh Kai Jiaeh), posted in Teams 2026-09-29 15:32. Also SRD §2.1.1 assumption 3. Invoice amounts will not match the reports; that is by design." },
      { topic: "Finance sign-off", decision: "\"Nurul will update Marie that invoice will show RM18 + RM2.\"", note: "BA answer Q2." },
      { topic: "Cutover", decision: "\"Approval date decides. Approved after go-live gets 2 lines, even if paid before go-live.\"", note: "BA answer Q5. Same as SRD REQ-001 Example 3." },
      { topic: "Screens", decision: "\"No. Only invoice and e-Invoice change. Screens stay as today.\"", note: "BA answer Q6. Same as SRD §2.1.2 item 4." },
      { topic: "Line item names", decision: "Line 1 \"JomCheck report\", line 2 \"JomCheck service charge\".", note: "Re-uploaded SRD v1.0 §2.1.1, §2.2.2, REQ-002, REQ-003 (2026-10-09). The Jira summary and BA answer Q3 are stale." },
      { topic: "e-Invoice classification code", decision: "\"Both line items use classification code 022.\"", note: "Re-uploaded SRD v1.0 REQ-006. Settled 2026-10-09; the QA Portal task text still says pending." },
    ],
    openItems: [
      { question: "Which staging env will dev push to, and when?", why: "Not stated anywhere as of 2026-10-15. Dev said done 09/10 but Jira is still Ready For Development and no push was announced." },
      { question: "How does QA verify the LHDN submission content (MyInvois sandbox login)?", why: "QA Portal scope lists \"MyInvois / Ensure the Line Items show correctly with 2-lines (same as e-Invoice)\". TS05 assumes a MyInvois sandbox login; credentials unknown.", coveredBy: "12412_TS05" },
      { question: "Can a Wholesale chatbot JomCheck purchase be made on the chosen env?", why: "QA Portal TS2 requires it; the chatbot env link is unknown.", coveredBy: "12412_TS02" },
    ],
    automation: {
      intro: "Extend scripts/eauto-jomcheck. TS04 (tests/ucd-purchase-flow-checks.spec.ts) already downloads the invoice and e-Invoice; BO details page objects already hold #to-print-invoice / #to-print-e-invoice. New work: parse the downloaded PDF text and assert the 2 lines and totals, then compare the UCD and BO invoices.",
      groups: [
        { verdict: "automatable", title: "New-transaction invoice and e-Invoice amounts", cases: ["REQ-002", "REQ-003", "REQ-004", "REQ-005"], reason: "Buy a JomCheck on UCD, download both PDFs from UCD and BO, assert line text and amounts." },
        { verdict: "partly", title: "Cut-off", cases: ["REQ-001"], reason: "Needs transactions approved before deployment (old data) and one created before but approved after. This depends on deployment timing, not on a script." },
        { verdict: "manual", title: "LHDN payload", cases: ["REQ-006"], reason: "No known QA view of the submitted payload yet." },
      ],
      blockers: [
        "Environment not stated.",
        "No PDF text parser in scripts/eauto-jomcheck yet.",
      ],
    },
    related: ["CCB-994", "EAUTO-1070", "EAINT-10089", "EAINT-12339", "EAINT-12386"],
    tags: ["ucd", "backoffice", "jomcheck", "invoice", "e-invoice", "lhdn", "sst"],
  },
  {
    key: "EAINT-12257",
    url: "https://mfservices.atlassian.net/browse/EAINT-12257",
    title: "[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Testing In 1st Env (2026-10-26; was Code Review at the 2026-10-21 study)",
      assignee: "Lim Yi Link (BA); Developer field: Mong Guo Hao; QA Muhammad Faizuddin Bin Bidi",
      reporter: "Lim Yi Link",
      fixVersion: "S34.1X-20261029 (release date 2026-10-29; morning deployment). Was [QA]Ready for Testing Tickets.",
    },
    scope: {
      portals: ["UCD"],
      modules: ["Pre-application & Application (onboarding payment step)"],
      trigger: "UCD onboarding payment method selection, in both the Pre-application and the Application flow",
      environment: "staging/obs — the onboarding module's only staging (knowledge/eauto-payments.md § EAINT-12414 scope); the sibling card ticket EAINT-12259 was tested there (Teams, Charmain Ea Chiang, 2026-09-02 12:49). Not deployed to staging yet: dev said 2026-09-29 10:58 \"both tickets are ready for testing, but not deployed yet\"; BA said 2026-10-01 15:40 \"there is no planned deployment date for this ticket just yet\". UPDATE: Mong Guo Hao, CR group, 2026-10-22 11:20: \"EAINT-12257 have been deployed to staging/obs\". QA-Issues EAINT-12625 / 12627 record \"staging/eauto\".",
    },
    overview: [
      "Adds DuitNow QR as one more UCD onboarding payment tile, on both the Pre-application (RM 108) and the Application (RM 990) payment step. Existing methods stay unchanged.",
      "Split out of EAINT-12153 on 2026-09-02 (Teams, Yi Link Lim, 11:19): 12153 = B2B (Tracy), 12257 = DuitNow QR (Mong), 12259 = Card (Tracy, in prod 2026-09-02).",
      "SRD v1.0 (10.09.2026) now exists and confirms the dev-described shape: QR popup from Fiuu, 3-minute countdown, cancel, failure returns to method selection with the existing banner, retry without restarting.",
      "UPDATE 2026-10-26: deploy 29 Oct 2026 morning together with EAINT-12153. Progress \"(3/13) 23.07%\" (Faizuddin, eAuto QAs, 2026-10-26 08:46); official TS v25 status column: TS1 Pass, TS2 Pass, TS3–TS13 Not Started. QA test-complete deadline EOD 28 Oct.",
      "As built: Cancel / close / timer → \"Payment is pending\" (paymentStatus PENDING), review page reloads with no \"Unsuccessful Payment\" box. Bugs: EAINT-12625 (Closed as existing behaviour), EAINT-12627 timer expiry (To Do). Studying folder: _reference/tickets/Studying/EAINT-12257/.",
    ],
    srd: {
      file: "SRD_EAINT-12257_v1.0_20260910.pdf (text: _reference/tickets/EAINT-12257/EAINT-12257-SRD-v1.0-20260910-text.md)",
      version: "V1.0",
      date: "2026-09-10",
      status: "Send out for external review",
      requirements: [
        { id: "REQ-001", text: "\"DuitNow QR\" shown as a payment option on Pre-application and Application payment. Existing options unchanged. Success → Pre-Application Summary page (pre-app) / Application Payment Success page (application)." },
        { id: "REQ-002", text: "Only one payment method selectable at a time. Selecting DuitNow QR enables \"Submit and Pay\"." },
        { id: "REQ-003", text: "Submit and Pay opens a popup: DuitNow (Malaysia National QR) code from Fiuu; text \"Kindly scan the QR code below to proceed with payment. Do Not Refresh!\"; timer \"Scan QR in mm:ss\" starting at 03:00, tied to Fiuu QR validity." },
        { id: "REQ-004", text: "Successful payment redirects to Pre-Application Summary page (pre-app) / Application Payment Success page (application)." },
        { id: "REQ-005", text: "Failed when: timer reaches 00:00, user clicks Cancel, or bank declines / insufficient funds. Then: close popup, return to method selection, show \"Unsuccessful Payment — Something went wrong and your payment didn't go through. Please choose a payment method and retry.\"" },
        { id: "REQ-006", text: "After failure the Pre-application / Application stays intact; user can pick any method (incl. DuitNow QR again) without restarting." },
      ],
      notSpecified: [
        "Whether the QR popup shows the payment amount — SRD §2.2.6 item 1, \"Pending (Fiuu)\"",
        "Refresh or browser Back during the popup, and any duplicate-payment safeguard — SRD §2.2.6 item 2, \"Pending (Fiuu)\"",
        "Payment Method text on the success pages' Payment Details block for a QR payment",
        "Invoice / e-Invoice content for a QR payment",
        "No mockup attached to Jira, although SRD §1.5 lists \"DuitNow QR Payment Design Mockup (HTML)\"",
      ],
    },
    decisions: [
      { topic: "QR interaction shape", decision: "Now SRD-backed (REQ-003/005): popup with Fiuu QR, instruction text, \"Scan QR in mm:ss\" timer from 03:00, Cancel. Timer expiry, Cancel and a bank decline are all failures that close the popup and return to method selection with the existing banner.", note: "Supersedes the dev-discussion-only version of 2026-09-02. The 3-minute timer is new information — the script's QR_SCAN_BUDGET_MS default (10 min) is longer than the QR is valid." },
      { topic: "Ticket split", decision: "12257 covers DuitNow QR only. Card = EAINT-12259 (Done, prod 2026-09-02). B2B = EAINT-12153.", note: "Teams, Yi Link Lim, 2026-09-02 11:19. Answers the former open item about overlap with 12153's reserved TS7/TS8." },
      { topic: "Amount verification", decision: "QA must check the amount on the invoice/e-invoice matches what was charged. The invoice is downloaded from the system itself, so this is NOT a phone step and automates like any other assertion.", note: "Dev-stated check, not yet a written acceptance criterion. Phone-scope corrected by Faizuddin, 2026-09-03." },
      { topic: "How this gets automated", decision: "No new script is needed — the senior QA already has working automation for Pre-application and Application. The job is to modify that script's payment step so it drives to the QR popup, pauses for a human to scan and approve/reject on a physical phone, then resumes and asserts the outcome.", note: "From Faizuddin, 2026-09-03. Makes the channel semi-automated (human-in-the-loop), superseding the earlier manual-only reading. Script to be handed over in a later session." },
      { topic: "Scope boundary — the phone screens", decision: "Whatever appears on the phone is out of our jurisdiction; it belongs to the Fiuu system. The phone is a means of triggering an outcome, not a test surface — no assertions and no defects against the paying app's screens (amounts, merchant name, QR contents, error copy). For Approve and Reject, only eAuto's reaction afterwards is under test.", note: "From Faizuddin, 2026-09-03. Same boundary already agreed for the other Fiuu rails: we verify our side reacts correctly, not that Fiuu produces the outcome correctly." },
      { topic: "Captcha on Pre-application", decision: "Yes: Google reCAPTCHA at /obs/preOnb/recaptcha, two or three image challenges, not solvable by the script. The ask is Google's test keys on staging.", note: "Answers the former open item \"Is a captcha step really present on Pre-application?\" (dev had raised it as a \"maybe\"). [verified: reference pack 01-flow/04-costs-and-human-gates.md]" },
      { topic: "Deployment slot", decision: "29 Oct 2026 (Thu) morning, together with EAINT-12153. Dev: \"yea both can be done on morning deployment\".", note: "Mong Guo Hao, CR group, 2026-10-22 10:27; Charmain, eAuto QAs, 2026-10-22 10:29." },
      { topic: "QR simulator", decision: "\"note to use this to scan the qr https://bank-simulator.fiuu.com/duitnow/viewqr\"", note: "Mong Guo Hao, CR group, 2026-10-22 11:21." },
      { topic: "No error message on cancel / close (EAINT-12625)", decision: "\"Follow existing behaviour where it will not show error message if close the payment gateway page\"", note: "QA comment, Jira EAINT-12625, 2026-10-26 10:39; status Closed. TS v25 applies it to Cancel and Close QR window. Deviates from SRD REQ-005; BA sign-off not seen." },
    ],
    openItems: [
      { question: "Is testing needed on both iPhone and Android, or is one representative?", why: "Dev flagged that QR scanning requires a physical phone; Playwright can't drive the scan-and-approve side." },
      { question: "Does the QR popup show the payment amount?", why: "SRD v1.0 §2.2.6 item 1 — \"Pending (Fiuu)\". Decides whether the popup gets an amount assertion." },
      { question: "What happens on refresh / browser Back during the popup, and is there a duplicate-payment safeguard?", why: "SRD v1.0 §2.2.6 item 2 — \"Pending (Fiuu)\". Same step already had a reload defect (EAINT-12414)." },
      { question: "Is DuitNow QR enabled in prod?", why: "Teams, Yi Link Lim, 2026-08-19 12:48: \"B2B and DuitNow QR is not enabled in prod just yet\". Only B2B was later confirmed enabled (2026-08-24). No later word on QR." },
      { question: "When is it deployed to staging/obs?", why: "RESOLVED 2026-10-22 11:20: deployed to staging/obs (Mong Guo Hao, CR group). Earlier: Teams 2026-10-01 15:40, no planned deployment date." },
      { question: "Where is the DuitNow QR mockup?", why: "SRD §1.5 item 4 lists it; it is not attached to the Jira ticket." },
      { question: "EAINT-12627 timer expiry: fix before 29 Oct, or close as existing behaviour like EAINT-12625?", why: "Still To Do. Its expected result is \"Payment is Failed and the review page shows \"Unsuccessful Payment\"\"; TS5 / TS13 depend on the answer.", coveredBy: "12257_TS5" },
      { question: "Payment status on cancel: PENDING or Failed?", why: "Observed PENDING in eAuto; TS v25 note says \"Failed\". Confirm what BO shows." },
      { question: "Ready for the BA walkthrough session?", why: "Yi Link Lim, CR group, 2026-10-26 10:36: \"Do lemme know latest by 4PM today ya.\"" },
    ],
    testScript: {
      path: "OFFICIAL (team-agreed 2026-10-21): QATeam SharePoint › 1. eAuto Project › eAuto - CR Test Scenarios › EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.xlsx. Latest read: OneDrive eAuto Documents\\EAINT-12257\\EAINT-12257 - official TS v25 + no-error-message update 2026-10-26.xlsx (13 TS). Older text copy (v19, 10 TS): _reference/tickets/EAINT-12257/EAINT-12257-official-TS-sharepoint-v19-20261021.md",
      sheet: "Sheet1",
      total: 13,
      columns: ["TS No.", "Scenario", "Initial Steps", "Pre-Application Payment: Test Steps / Expected Result", "Continuation Steps", "Application Payment: Test Steps / Expected Result", "QA", "Status (Pass/Fail)", "Remarks"],
      blocks: [
        { label: "Happy flow — Approved payment (Android pre-app, iPhone application)", range: "12257_TS1", count: 1, tone: "e2e" },
        { label: "Reject & retry, Cancel transaction, Close QR window, Timer expiry", range: "12257_TS2–TS5", count: 4, tone: "negative" },
        { label: "Regression — FPX (B2C) Success / Failed, Card VISA Success / Mastercard Failed > Success, FPX (B2B) Success", range: "12257_TS6–TS10", count: 5, tone: "regression" },
        { label: "Reject & Retry – BO Payment Details; Cancel – close browser and reopen link; Timer Expiry – BO listing payment status", range: "12257_TS11–TS13", count: 3, tone: "edge" },
      ],
      conventions: [
        "This SharePoint file is the TS to follow — not the 'Suggestion by Claude' workbook (Faizuddin, 2026-10-21, after consulting the team).",
        "v19 had no 12257_TS10 (jumped TS9 to TS11). v25 (2026-10-26) runs TS1–TS13: TS10 = FPX (B2B) Success, TS11–TS13 new.",
        "v25 Faiz's Note: \"Cancel the payment ; Failed ; No error message - follow existing behaviour (EAINT-12625, 26/10/2026)\"; same for \"Close the QR Code window\". \"Wait for the timer to end ; Failed\" has no note.",
        "Payment outcome is set on the phone at https://bank-simulator.fiuu.com/duitnow/viewqr (Faiz's Note D24 \"In phone\").",
        "Retries in TS2–TS5 retry with QR (\"Retry with Payment = Success\").",
        "Not in the official TS (left out on purpose): popup text / 03:00 timer check (REQ-003), single-selection check (REQ-002) beyond TS1 step 1, retry with another method (REQ-006a), refresh/Back (SRD §2.2.6).",
      ],
    },
    automation: {
      intro: "Official TS since 2026-10-21 = SharePoint v19 (12257_TS1–TS9, TS11, see testScript). The runner's own case ids differ: runner 12257_TS01 = QR on the pre-application fee only, runner 12257_TS02 = QR on the registration fee (pre-app by FPX); the official TS1 pays both legs by QR. Re-map before reporting results. Semi-automated, human-in-the-loop. Built 2026-09-03 as scripts/eauto-duitnow-qr/, running from the dashboard at /eauto/duitnow-qr (Tickets → 12257), ported from Charmain's EAINT-11982 reference pack. TWO scenarios, one per payment point: 12257_TS01 pays the pre-application fee (RM 108) by QR and drives phases 1-2; 12257_TS02 pays the registration fee (RM 990) by QR and drives the full 11-phase chain (phases 1-10 are actions; phase 11 only reads the resulting record), paying the pre-application fee by FPX on purpose so the operator scans only once. The phone is used for the payment act only — cancel, timer-expiry and the invoice/amount check all need no phone (the invoice downloads from the system). Runs headed; the route rejects a headless request outright.",
      groups: [],
      blockers: [
        "The DuitNow QR tile and popup selectors are UNVERIFIED — that channel is not built yet and no HTML has ever been captured for it. Everything else is ported from locators matched live on 2026-08-31. Capture the payment-step HTML on the first live run and correct src/payment.ts.",
        "TS02 needs both BackOffice logins (approver + assignee) and ideally the Fiuu simulator credentials; without the latter its FPX leg pauses for a human as well.",
        "Only Business Trading (Sabah/Sarawak) is automatable. The three SSM types post the BRN to a LIVE SSM registry lookup that no generated number can pass, and the form silently switches to Trading (Sabah) rather than erroring.",
        "No non-phone way to trigger Approve/Reject is known — unlike Fiuu's response picker for the other rails, nothing suggests DuitNow QR sandbox exposes a headless outcome selector, so the scan stays human-in-the-loop.",
        "RESOLVED 2026-10-21: SRD v1.0 (2026-09-10) defines timeout (03:00), cancel, decline and retry. Still open in the SRD: amount display, refresh/Back, duplicate-payment safeguard.",
        "QR_SCAN_BUDGET_MS defaults to 10 min, but the SRD says the QR is valid for 3 min — a scan wait past 03:00 can only end in the failure path.",
        "The script has no scenario yet for REQ-005 (timer expiry, Cancel, decline) or REQ-006 (retry another method after a QR failure).",
        "UPDATE 2026-10-26: TS runner now at scripts/eauto-12257 + app/eauto/12257 (runs TS1–TS6 seen in public/qa-artifacts/eauto-12257/, 2026-10-22/23). Registration fee is RM 1,500.00, so QR_FEE_REGISTRATION in scripts/eauto-duitnow-qr is out of date (knowledge/flow-payment-channels.md §0b).",
      ],
    },
    related: ["EAINT-12153", "EAINT-12259", "EAINT-12414", "CCB-937", "EAUTO-1018"],
    tags: ["ucd", "onboarding", "payment", "duitnow-qr"],
  },
  {
    key: "EAINT-12028",
    url: "https://mfservices.atlassian.net/browse/EAINT-12028",
    title: "[eAuto-BackOffice] New Module – Association Payment Listing (Automate Association/Vendor Payment Requests)",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      status: "In Development (since 2026-10-05; was Ready For Development at the 2026-09-14 study)",
      assignee: "Shane (Kasheng Liew, dev) since 2026-10-05; BA Chee Mei Jia; QA Muhammad Faizuddin Bin Bidi",
      reporter: "Chee Mei Jia",
      fixVersion: "S35.X-20261126 (release date 2026-11-26); Exp. Deploy Date 26 Nov 2026 (set 2026-10-19). Was [QA]Ready for Testing Tickets.",
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
      "UPDATE 2026-10-26: target 26 Nov 2026 (Jira Exp. Deploy Date, fix version, Miro column \"26TH NOV DEPLOYMENT (SIT Testing: TBC, UAT Testing: TBC, Target Deployment: TBC)\"). Miro: \"Est. Testing Mandays: 10 days (1 QA)\", \"~150 TS\"; scope E2E Approval Workflow, Search and Filter, Role and Permission, E-Signature. Studying folder: _reference/tickets/Studying/EAINT-12028/.",
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
      { topic: "Dev handover", decision: "\"Hi Kasheng Liew please help on this ticket.\"", note: "Dev lead, Teams, 2026-09-24 14:32. Jira assignee → Shane and status → In Development on 2026-10-05; Developer field still shows the original dev." },
      { topic: "KIV bug found by the new dev", decision: "\"all ok except 1 bug.. once drafter click KIV.. nobody can approve that month anymore.. so the payment request can never be generated.. im fixing it now\"", note: "Kasheng Liew, Teams, 2026-09-29 16:04. Conflicts with the mockup-based \"KIV never locks the Drafter out\" decision above — confirm the final KIV rule on the build." },
      { topic: "Private vs company", decision: "\"no need to separate whether is private or company, as long as is car then total up the amount will do, same goes to motorcycle\"; state basis: \"think we use UCD company state ya\" — \"yes ... they export file from backoffice trx listing ya\".", note: "BA and dev lead, Teams, 2026-09-04 10:32 to 11:17." },
      { topic: "Downtime deployment", decision: "\"then this one need downtime, sorry If really need prepare for urgent deployment, then can deploy and hide the link in backoffice first\"", note: "Dev lead, Teams, 2026-08-26 12:12. Core login/logout touched." },
      { topic: "Rescheduled", decision: "\"this ticket will rearrange ya. not going to deploy on end of this month anymore.\"", note: "BA, Teams, 2026-10-14 12:03. Now 26 Nov per Jira (2026-10-19)." },
    ],
    openItems: [
      { question: "Which environment (SIT/UAT/PREPROD) will this module be tested on?", why: "Still not stated anywhere in the ticket, comments, or SRD. The 2026-09-04 QA test guide gives dev-box localhost URLs (core :8080, backoffice :8095), not a shared testing environment — this does not resolve the open item." },
      { question: "Does a state with 0 approved transactions show RM0.00 in the Details table, or is it hidden?", why: "REQ-008 lists all 16 states + TOTAL but has no zero-transaction worked example." },
      { question: "Does the real Details page display states in the SRD's numeric 01–16 order, or the mockup's alphabetical-ish order?", why: "Matters for any row-position assertion in automation; the mockup and SRD disagree on ordering." },
      { question: "Has MR !1's fix pass for the 10 blocking code-review findings (incl. H1/H2) completed and merged?", why: "As of 2026-09-04 it was still in progress (8/10 coded); still unverified as of 2026-09-14 (internal GitLab unreachable this session) — staging sign-off should wait for a clean re-review." },
      { question: "Why did the ticket flip to Ready-for-Testing and get reassigned to QA today with no explanation?", why: "No Jira comment and no new Teams message (group chat silent since 2026-09-04) explains today's changes — worth a direct ping to Chee Mei Jia or May Chin." },
      { question: "What is the final KIV rule, and is the KIV fix in?", why: "Mockup/dev guide: KIV never locks out (gap L2). New dev 2026-09-29: KIV blocked approval for the month — being fixed. Unverified since." },
      { question: "How many TS: ~150 (Miro), 27 existing high-level scenarios, or 10 man-days?", why: "Miro, existing xlsx in _reference/tickets/EAINT-12028/ and Jira estimate disagree." },
      { question: "Are cancelled-but-JPJ-approved transactions counted?", why: "BA, 2026-09-04: \"i dont think that ops team got this SOP, can u check again?\" — never answered." },
      { question: "Night (downtime) slot for 26 Nov?", why: "Dev lead 2026-08-26 said it needs downtime. SIT/UAT dates still TBC on Miro." },
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
    title: "[eAuto-Application] Add B2B Payment Channel for Pre-application and Application",
    studiedAt: "2026-10-26",
    jira: {
      type: "Task",
      priority: "Medium",
      category: "Enhancement",
      status: "Testing In 1st Env (2026-10-26; was In Development at the 2026-10-21 study)",
      assignee: "Lim Yi Link (BA); Developer field: Mong Guo Hao, Xiwei Lim; QA Muhammad Faizuddin Bin Bidi",
      reporter: "Chee Mei Jia",
      fixVersion: "S34.1X-20261029 (release date 2026-10-29; morning deployment). Was [QA]Ready for Testing Tickets; QA est. 3.5 man-days, re-estimated 2+1 days (Faizuddin, eAuto QAs, 2026-10-21 12:56)",
    },
    scope: {
      portals: ["UCD"],
      modules: ["Pre-application", "Application"],
      trigger: "Onboarding Payment step (identical step on both modules)",
      environment: "The onboarding module (/obs) has exactly one staging environment: staging/obs (https://staging.eauto.my/obs/...), with no per-CR staging split (knowledge/eauto-payments.md § EAINT-12414 scope). Two code defaults contradict this and are guesses: app/eauto/company-details-checker/TestScriptTab.tsx defaults envSegment to uat1, and scripts/eauto-payment-channels/data/config.ts falls back to /sit3. Supersedes \"unconfirmed, to be selected at run time\". UPDATE: Mong Guo Hao, CR group, 2026-10-22 14:41: \"to update i have deployed EAINT-12153 to staging/obs\". EAINT-12588 records \"staging/obs\".",
    },
    overview: [
      "Today a new UCD can only pay the onboarding fee through FPX (Personal). Since the 2026-09-02 split, this ticket covers only Online Banking (Business) = FPX B2B, on both the Pre-application and the Application payment step.",
      "B2B differs from Personal: after payment the applicant lands on a new Pending Approval page; the company authorizer must approve in online banking within 7 days; approved → existing success page; not approved in 7 days → back to the payment page with the existing failure handling.",
      "SRD v1.2 (04.09.2026) adds two fields on the Pending Approval page (Payment Submitted Date Time, Payment Date Time) and a \"Payment Pending Approval\" email to the applicant, CC apply@eauto.my.",
      "Card moved to EAINT-12259 (Done, prod 2026-09-02). DuitNow QR moved to EAINT-12257.",
      "UPDATE 2026-10-26: deploy 29 Oct 2026 morning together with EAINT-12257. Progress \"(6/12) 50% - PASS only\" (Faizuddin, eAuto QAs, 2026-10-23 19:30 and 2026-10-26 08:46). First full B2B run passed 2026-10-22 (12153_TS1, Pre-App P261022/00902, Application NA60001193). QA test-complete deadline EOD 28 Oct.",
      "As built: Fiuu sandbox simulates B2B only for \"ABB (Affin Bank), ABBM (Affin Bank Multi-Bank), HLB (Hong Leong Bank)\"; checker approves at https://bank-simulator.fiuu.com/fpx-b2b/pending with Order ID + Decide code. Registration fee now RM 1,500.00. Bug EAINT-12588 (Pending Approval page only after refresh) Done. Studying folder: _reference/tickets/Studying/EAINT-12153/.",
    ],
    srd: {
      file: "EAINT-12153_SRD_[eAuto-Application] Add B2B Payment Channel for Pre-application and Application_v1.2_20260904.pdf (copy in _reference/tickets/EAINT-12153/)",
      version: "V1.2",
      date: "2026-09-04",
      status: "Uploaded to Jira 2026-09-07 15:53. Teams 2026-09-07 15:55 says \"uploaded SRD v1.3\" — no v1.3 file exists in Jira; v1.2 is the latest file.",
      requirements: [
        { id: "REQ-001", text: "Credit or Debit Card option on both payment steps. (Now delivered by EAINT-12259.)" },
        { id: "REQ-002", text: "Online Banking (Business) option on both payment steps; UCD can complete payment with it." },
        { id: "REQ-003", text: "FPX (Personal) remains available and behaves exactly as before." },
        { id: "REQ-004", text: "After an Online Banking (Business) payment, redirect to the Pending Approval page, status shown as Pending Approval. Payment stays pending until the authorizer approves within 7 days." },
        { id: "REQ-005", text: "Authorizer approves → redirect to the Pre-application / Application pages as per the existing successful-payment flow." },
        { id: "REQ-006", text: "While still pending → the applicant is shown the Pending Approval summary page, status Pending Approval." },
        { id: "REQ-007", text: "Not approved within 7 days → back to the payment page as per the existing unsuccessful-payment flow." },
        { id: "REQ-008", text: "Pending Approval page shows Payment Submitted Date Time, format DD-MM-YYYY hh:mm AM/PM (e.g. 23-12-2024 12:20 PM)." },
        { id: "REQ-009", text: "Pending Approval page shows Payment Date Time: \"-\" while pending; the actual payment date time once Fiuu returns an approved response." },
        { id: "§2.3", text: "Email from imonitor@eauto.my to the applicant's registered email, CC apply@eauto.my. Subject \"[Pre-Application/Application No] [Company Name]: Payment Pending Approval - Awaiting Authorizer Approval\". Body includes Payment ID, a link to the Pending Payment Approval page, and \"If the payment is not approved by [Approval Deadline Date] at 12:00 PM, the payment will expire.\"" },
      ],
      notSpecified: [
        "Where and how the authorizer approves (SRD and mockup say only \"through online banking\") — no eAuto screen for it",
        "How QA triggers approval / non-approval in the sandbox or the dev simulator (Teams 2026-09-03: dev prepared a simulator for B2B)",
        "How the 7-day expiry can be tested without waiting 7 days",
        "Which page REQ-005 lands on per module (\"respective Pre-application and Application pages\")",
        "BO listing / detail status for a pending B2B payment",
        "Mockup shows a Payment Date Time row only; it has no Payment Submitted Date Time row (mockup predates v1.2)",
      ],
    },
    decisions: [
      {
        topic: "Scope after the 2026-09-02 split",
        decision: "EAINT-12153 = B2B only (dev Tracy). Card = EAINT-12259 (Done; QA regression one E2E happy-flow Pre-Application on staging/obs; prod 2026-09-02). DuitNow QR = EAINT-12257 (dev Mong).",
        note: "Teams, Yi Link Lim, 2026-09-02 11:19; Charmain Ea Chiang 11:39 and 12:49; Goh Kai Jiaeh 14:39. Supersedes the three-tile channel model below for test scope: Card and Personal are now regression only.",
      },
      {
        topic: "SRD v1.2 discussion (Teams, Yi Link Lim, 2026-09-07 18:36)",
        decision: "1. Payment Method — no need to label the transaction B2B or C2B. 2. Approval Deadline Date in the email = Submitted Payment Date + 7 days; 12 PM unchanged. 3. Submitted Payment Date Time is only displayed for the B2B payment method.",
        note: "Item 3 is Teams-only — the SRD does not say it is B2B-only.",
      },
      {
        topic: "Delivery state",
        decision: "Dev: \"both tickets are ready for testing, but not deployed yet\" (Mong Guo Hao, 2026-09-29 10:58). BA: \"there is no planned deployment date for this ticket just yet\" (Yi Link Lim, 2026-10-01 15:40). Jira still In Development. No Teams messages after 2026-10-01 (checked 2026-10-21).",
      },
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
        decision: "Answered: the tiles and the bank grid are eAuto-hosted on /obs/preOnb/form/<uuid> (pre-app) and /obs/form/... (step 5). Only Submit and Pay opens Fiuu — a popup to sandbox-payment.fiuu.com, then bank-simulator.fiuu.com.",
        note: "Supersedes the earlier belief that the step was gateway-framed (Fiuu-hosted). [verified: reference pack 02-screens/34-registration-fee.aria.yaml; 05-known-traps.md §5]",
      },
      {
        topic: "Separate charges for Pre-application and Application",
        decision: "Yes: RM 108.00 (Payment ID P…) and RM 990.00 (Payment ID A…), each with its own Payment Details block.",
        note: "Answers the former open item \"Does eAuto charge Pre-application and Application separately?\". [verified: reference pack 02-screens/14-*.txt and 35-*.txt]",
      },
      {
        topic: "Testing environment",
        decision:
          "The onboarding module has one staging environment, staging/obs — see scope.environment. Supersedes \"still unconfirmed, to be chosen at run time\".",
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
      {
        topic: "Deployment slot",
        decision: "29 Oct 2026 (Thu) morning, together with EAINT-12257. \"we are targeting 29 Oct for the deployment of both EAINT-12153 and EAINT-12257 ya\".",
        note: "Charmain, eAuto QAs, 2026-10-22 10:29; Mong Guo Hao, CR group, 2026-10-22 10:27 \"yea both can be done on morning deployment\".",
      },
      {
        topic: "Affin bank tile",
        decision: "\"i changed the affin bank to affin max yea\"",
        note: "Mong Guo Hao, DM, 2026-10-22 16:39, after Faizuddin reported only Affin Max works for B2B. BA confirmation not seen in Teams.",
      },
    ],
    openItems: [
      {
        question: "How does QA make the authorizer approve, stay pending, or not approve?",
        why: "REQ-005/006/007 all hang on the authorizer's action in online banking. Dev prepared a B2B simulator (Teams, Yi Link Lim, 2026-09-03 15:44; briefing 2026-09-04 14:46) — its controls are not recorded anywhere in the repo.",
      },
      {
        question: "How is the 7-day expiry (REQ-007) tested?",
        why: "Waiting 7 days is not practical. Needs a dev date shift, a short config value, or a simulator \"expired\" response.",
      },
      {
        question: "Is Payment Submitted Date Time shown for B2B only?",
        why: "Teams 2026-09-07 18:36 says B2B only; SRD v1.2 REQ-008 does not limit it. Decides a negative check on the Personal success page.",
      },
      {
        question: "Is there an SRD v1.3?",
        why: "Teams 2026-09-07 15:55 announces v1.3; Jira holds only v1.2 (uploaded 15:53 the same day). Likely a typo — confirm before writing TS against v1.2.",
      },
      {
        question: "When does this reach staging/obs?",
        why: "RESOLVED 2026-10-22 14:41: deployed to staging/obs (Mong Guo Hao, CR group). Earlier: no deployment date as of 2026-10-01.",
      },
      {
        question: "Is the Affin Max tile change on staging and accepted by the BA?",
        why: "Dev changed it 2026-10-22 16:39 (DM); no BA confirmation seen. Re-run one Affin B2B case.",
      },
      {
        question: "Does SharePoint v42 cover the Payment Pending Approval email (SRD §2.3)?",
        why: "Not in the v38 snapshot. v42 not available locally.",
      },
      {
        question: "Ready for the BA walkthrough session?",
        why: "Yi Link Lim, CR group, 2026-10-26 10:36: \"Do lemme know latest by 4PM today ya.\"",
      },
      {
        question: "(No longer this ticket's — card moved to EAINT-12259) Is the Fiuu sandbox 3DS / card OTP readable in the DOM?",
        why:
          "The FPX TAC page renders its OTP in the page, which is what makes FPX failure paths automatable. If the card challenge does the same, the card channel automates too; if it's a real ACS with an SMS OTP, every card-3DS case stays manual. Biggest single swing factor left.",
      },
      {
        question: "What does the sheet intend by the payment-leg expected result \"Ensure in Pre-Application listing, it is Status = Approved\"?",
        why: "That status is only true after the BO approver acts; the status straight after payment is New. [verified: reference pack FLOW-video-verified.md Phase 2-3] [unconfirmed what the sheet intends]",
      },
    ],
    testScript: {
      path: "OFFICIAL (team-agreed 2026-10-21): QATeam SharePoint › 1. eAuto Project › eAuto - CR Test Scenarios › EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.xlsx (v38, 2026-10-21). Text copy: _reference/tickets/EAINT-12153/EAINT-12153-official-TS-sharepoint-v38-20261021.md",
      sheet: "Sheet1",
      total: 8,
      columns: ["TS No.", "Scenario", "Initial Steps", "Pre-Application Payment: Test Steps / Expected Result", "Continuation Steps", "Application Payment: Test Steps / Expected Result", "QA", "Status (Pass/Fail)", "Remarks"],
      blocks: [
        { label: "FPX (B2B) — Success, Failed (instant-result style)", range: "12153_TS1–TS2", count: 2, tone: "e2e" },
        { label: "FPX (B2B) — Pending Approval revisit > Approved; Failed > Success then authorizer approves", range: "12153_TS3–TS4", count: 2, tone: "negative" },
        { label: "Regression — FPX (B2C) Success / Failed, Card Credit Success / Debit Failed > Success (no banner row)", range: "12153_TS5–TS8", count: 4, tone: "regression" },
      ],
      conventions: [
        "This SharePoint file is the TS to follow — not the 'Suggestion by Claude' workbook (Faizuddin, 2026-10-21, after consulting the team).",
        "Each row is one full onboarding chain: Pre-Application payment → 8 continuation steps (BO mfared / jasons, UCD) → Application payment.",
        "Listing status: TS1, TS2, TS5–TS8 expect Pre-Application listing Status = Approved; TS3, TS4 expect Status = New. Follow the cell as written.",
        "Note B15 answer: new B2B requirements are tested on \"the popup page from Fiuu side only\".",
        "Not in the official TS (left out on purpose): 7-day expiry (REQ-007), Payment Submitted Date Time / Payment Date Time checks (REQ-008/009), email content (§2.3) beyond the email link in TS3.",
        "UPDATE 2026-10-26: latest SharePoint is v42 = TS1–TS12 (TS9–TS12 FPX retry rows added 2026-10-22); not available locally — re-read before quoting. Runner scripts/eauto-12153 + app/eauto/12153; artifacts exist for TS1–TS06 only (public/qa-artifacts/eauto-12153/).",
      ],
    },
    automation: {
      intro:
        "⚠️ Official TS since 2026-10-21 is the SharePoint v38 file (12153_TS1–TS8, see testScript). The TS_xx ids in the groups below refer to the SUPERSEDED v1.0 test script, which was withdrawn on 2026-08-13 — a replacement is being written. Re-map every id when the new script lands; the groupings and reasoning still hold, the numbers do not. Assessed against tests/service-hub (Playwright + POM, env-driven ENV/PATHS, step-reporter for the runner UI). The decisive find: the FPX gateway is already fully automated in scripts/secarang-insurance — PaymentTypePage selects FPX and captures the bank popup, BankTACPage forces the outcome via select#status_code and reads the TAC straight out of the DOM, PaymentSuccessPage scrapes the receipt. Since this module uses the same Fiuu sandbox, that chain is a port rather than a fresh build.",
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
        "RESOLVED: environment is staging/obs, the onboarding module's only staging. Code defaults still guess otherwise (company-details-checker TestScriptTab envSegment uat1; eauto-payment-channels config /sit3)",
        "RESOLVED 2026-08-13: the gateway is Fiuu sandbox, same as Secarang — the FPX chain ports over",
        "RESOLVED: the tiles and bank grid are eAuto-hosted; only Submit and Pay opens the Fiuu popup (reference pack 02-screens/34-registration-fee.aria.yaml; 05-known-traps.md §5)",
        "The sheet's TS1/TS2/TS3/TS6 use SSM business types (Sdn Bhd, Sole Prop, LLP, Sdn Bhd) and so need Company-Details-Checker data; only TS4 (Sabah) and TS5 (Sarawak) run on generated identities",
        "Unknown whether the Fiuu sandbox 3DS/card OTP is readable in the DOM — biggest single swing factor, to be checked on first contact with the page",
        "RESOLVED 2026-08-13: no callback endpoint or signing secret needed — the Fiuu sandbox simulates the response (approved / each failure reason) and signs it genuinely. Only duplicate or very-late callback delivery remains out of reach, and that is out of scope",
        "The pre-CR regression baseline must be captured BEFORE the CR deploys, or there is nothing to compare against. Ticket is already Ready For Development, so this window is closing",
        "Test data outstanding: test cards (approve / decline / 3DS-fail), corporate + personal FPX credentials, a long special-character UCD, second UCD account",
      ],
    },
    related: ["EAUTO-1018", "CCB-897", "EAINT-12259", "EAINT-12257", "EAINT-12414"],
    tags: ["UCD", "Payment", "Onboarding", "Enhancement", "B2B"],
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
