import type { Module, Source } from "../types";

// CIBO — separate Angular back office for eAuto + Secarang insurance transactions.
// Faizuddin is "deep" here (09-taxonomy.md): his knowledge/ facts are shown.

// ---- Source shorthands -------------------------------------------------------
const CIBO: Source = { kind: "mine", ref: "knowledge/cibo.md" };
const CIBO_LIVE: Source = { kind: "mine", ref: "knowledge/cibo.md §Live staging check — 12107 + 12327", date: "2026-10-16" };
const CIBO_ROLES: Source = { kind: "mine", ref: "knowledge/cibo.md §Roles — after EAINT-9840" };
const CIBO_MONEY: Source = { kind: "mine", ref: "knowledge/cibo.md §Money columns and discount codes" };
const CIBO_UCD: Source = { kind: "mine", ref: "knowledge/cibo.md §What CIBO shows about a UCD", date: "2026-08-13" };
const CIBO_DATES: Source = { kind: "mine", ref: "knowledge/cibo.md §Date fields — EAINT-12151", date: "2026-09-30" };
const CIBO_PM: Source = { kind: "mine", ref: "knowledge/cibo.md §Payment Mode column format — EAINT-12327", date: "2026-10-20" };
const CIBO_BA: Source = { kind: "mine", ref: "knowledge/cibo.md §BA requirement update — 12107 + 12327", date: "2026-10-20" };
const CIBO_PR: Source = { kind: "mine", ref: "knowledge/cibo.md §Payment Report — always narrow", date: "2026-10-19" };
const CIBO_RACE: Source = { kind: "mine", ref: "knowledge/cibo.md §Listing race", date: "2026-10-20" };
const CIBO_EW: Source = { kind: "mine", ref: "knowledge/cibo.md §EW in Payment Reference ID applies to new data only", date: "2026-10-20" };
const CIBO_FPX: Source = { kind: "mine", ref: "knowledge/cibo.md §FPX Payment Mode = Fiuu, not BoldPay", date: "2026-10-20" };
const CIBO_OPEN: Source = { kind: "mine", ref: "knowledge/cibo.md §Open questions" };
const CIBO_TEST: Source = { kind: "mine", ref: "knowledge/cibo.md §Testing notes" };
const FC: Source = { kind: "mine", ref: "knowledge/flow-cibo.md" };
const FC_1: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §1" };
const FC_2: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §2 entry points" };
const FC_42: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §4.2 listing table" };
const FC_43: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §4.3 export" };
const FC_44A: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §4.4a Transaction Details", date: "2026-10-20" };
const FC_45: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §4.5 Payment Management" };
const FC_46: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §4.6 Payment Report" };
const FC_47: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §4.7 Referred Risk Log" };
const FC_54: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §5.4 Payment Reference ID" };
const FC_55: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §5.5 status values" };
const FC_6: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §6 preconditions" };
const FC_7: Source = { kind: "mine", ref: "knowledge/flow-cibo.md §7 traps" };
const FIP_X: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Cross-page verification" };
const ASK_C: Source = { kind: "askeauto", ref: "prod code — CIBO answer (cibo-frontend cac20d5 origin/master, secarang-eauto-integration 1a5e67e, auth.service.ts, route guards)", date: "2026-10-23" };
const J_12327: Source = { kind: "jira", ref: "EAINT-12327" };
const J_12151: Source = { kind: "jira", ref: "EAINT-12151", date: "2026-08-20" };
const J_12058: Source = { kind: "jira", ref: "EAINT-12058" };
const J_11934: Source = { kind: "jira", ref: "EAINT-11934 comments", date: "2026-08-19" };
const J_12107: Source = { kind: "jira", ref: "EAINT-12107 comments (dev)", date: "2026-09-09" };
const J_12442: Source = { kind: "jira", ref: "EAINT-12442", date: "2026-10-19" };
const J_8669: Source = { kind: "jira", ref: "EAINT-8669 children" };
const J_12443: Source = { kind: "jira", ref: "EAINT-12443" };
const TEAMS_12107: Source = { kind: "teams", ref: "EAINT-12107 CR chat, Yi Link Lim", date: "2026-10-20" };
const TEAMS_12151: Source = { kind: "teams", ref: "EAINT-12151, Mong Guo Hao", date: "2026-08-20" };
const TEAMS_12058: Source = { kind: "teams", ref: "EAINT-12058, dev Goh Kai Jiaeh", date: "2026-08-13" };
const TS_9840: Source = { kind: "ts", ref: "SC_EAINT-9840 CIBO_Post_9840_TS01" };
const TS_9979: Source = { kind: "ts", ref: "SC_EAINT-9979 9979_TS01-TS09" };
const TS_10052: Source = { kind: "ts", ref: "SC_EAINT-10052 10052_TS01-TS08" };
const TS_9900: Source = { kind: "ts", ref: "SC_EAINT-9900 9900_TS01-TS06" };
const TS_11541: Source = { kind: "ts", ref: "SC_EAINT-11541 11541_TS1-TS8" };
const TS_12058: Source = { kind: "ts", ref: "SC_EAINT-12058 12058_TS1-TS6" };
const TS_12151: Source = { kind: "ts", ref: "EAINT-12151 12151_TS01-TS05" };
const TS_12107: Source = { kind: "ts", ref: "EAINT-12107 12107_TS01-TS08 (CIBO rows)" };
const TS_12327: Source = { kind: "ts", ref: "EAINT-12327 12327_TS11-TS19" };
const TS_8147: Source = { kind: "ts", ref: "SC_EAINT-8147 CIBO_WAMSG_TS1-TS4" };
const TS_11867: Source = { kind: "ts", ref: "EAINT-11867 11867_TS01" };
const TS_9617: Source = { kind: "ts", ref: "EAINT-9617 TS1.4-TS1.5" };
const TS_10044: Source = { kind: "ts", ref: "EAINT-10044 10044_INS_TS02" };

export const cibo: Module = {
  id: "cibo",
  name: "CIBO (insurance back office: transactions, payments, reports)",
  short: "CIBO",
  portals: ["CIBO portal (Angular, staging.secarang.com/cibo)"],
  summary:
    "CIBO is a separate back office that holds both eAuto and Secarang insurance transactions in one place. QA only reads it: Transaction Management (listing, details, export), Payment Management, Payment Report, Referred Risk Log and CRM. It is the third check for every eAuto insurance purchase and the only record for a Secarang one.",
  related: ["secarang", "insurance"],
  glossary: [
    { term: "Transaction Management / Transaction Listing", meaning: "Same surface: the page is Transaction Management, the table on it is the Transaction Listing.", sources: [FC_2] },
    { term: "CIBO", meaning: "The actual on-screen title of the app (cibo-frontend). A staff-only back office for the Secarang insurance aggregator. It reads, lists and reports transactions created on Secarang or eAuto; it does not create them.", sources: [ASK_C] },
    { term: "JPJ status code (CIBO)", meaning: "Shown per transaction: 00 Not available, 03 Pending, 02 Rejected, 01 Accepted. Can be re-checked on demand from the details page; what flips it is the JPJ / eAuto integration, not CIBO.", sources: [ASK_C] },
    { term: "Platform", meaning: "Filter / column telling eAuto, Secarang (and Secarang-MK for MacroKiosk renewals) apart.", sources: [TS_9979, J_8669] },
    { term: "Payment Mode", meaning: "Text '<gateway> | <method> – <details>', e.g. 'Fiuu | eWallet – ShopeePay'. Same string on every page and export.", sources: [CIBO_PM, J_12327] },
    { term: "Insurance Created Date", meaning: "Payment date-time of the insurance (not JPJ approval). '-' when not approved.", sources: [CIBO_DATES, TEAMS_12151] },
    { term: "EW", meaning: "Marker in the Payment Reference ID of Fiuu e-wallet payments (new data only).", sources: [FC_54, CIBO_EW] },
  ],
  flows: [
    // =========================================================================
    {
      id: "login-menu",
      name: "Login and menu by role",
      summary: "Log in to CIBO; the sidebar shows only the modules the login's role allows.",
      portals: ["CIBO portal"],
      triggers: [
        {
          id: "login",
          name: "CIBO login",
          entry: "staging.secarang.com/cibo › login form",
          sources: [CIBO_LIVE, TS_9840],
          steps: [
            {
              title: "Log in",
              where: "CIBO login (Angular form: loginId, pwd)",
              detail: "Login button stays disabled until both fields are filled.",
              sources: [CIBO_LIVE],
            },
            {
              title: "Open a module from the sidebar",
              where: "Sidebar → /cibo/transaction-management, /cibo/payment-management, /cibo/payment-report, dashboard, crm, referred-risk-log, commission-report, …",
              detail: "The sidebar collapses to icons after a wide listing; open pages by their link.",
              sources: [CIBO_LIVE],
              branches: [{ when: "Role has no access to a module", then: "Module not in the sidebar; Print / Export hidden for some roles." }],
            },
          ],
        },
      ],
      affects: [],
      cronjobs: [],
      roles: [
        { text: "Admin: all modules (Dashboard, User Account Management, CRM, Transaction Management, Payment Management, Referred Risk Log, Payment Report, Commission Report, Visitor Management, Agent Management, Discount Code Management).", sources: [CIBO_ROLES, TS_9840] },
        { text: "Admin Insurance: Dashboard, Transaction Management, Payment Report, Commission Report, Discount Code Management.", sources: [CIBO_ROLES, TS_9840] },
        { text: "Temporary Insurance Staff: Dashboard, Transaction Management, Payment Report, Commission Report.", sources: [CIBO_ROLES, TS_9840] },
        { text: "Finance (prod code): Transaction Management and Payment Report; not Payment Management. Other menu items: User Account Management, CRM, Agent Management and Discount Management are Admin / Technical Support (or Admin only).", sources: [ASK_C], alt: [{ text: "Finance: as Temporary Insurance Staff plus Agent Management.", sources: [TS_9840], note: "old guess (unconfirmed), swapped for the code version" }] },
        { text: "Role names in the prod code are Admin, Technical Support, Finance and Ops Support. Per screen: Transaction Management = Admin, Technical Support, Finance, Ops Support. Payment Management = Admin, Technical Support, Ops Support (no Finance). Payment Report = Admin, Technical Support, Finance (no Ops Support). A user without the right role is sent back to /dashboard even by direct URL. CIBO has its own login page (/auth/login) on its own domain, apart from the eAuto menus; there is no public entry, email link or JPJ-notice trigger.", sources: [ASK_C], unconfirmed: true },
        { text: "Ops Support: Dashboard + Transaction Management, Print and Export hidden.", sources: [CIBO_ROLES, TS_9840] },
      ],
      afterCompletion: [],
      rules: [
        { text: "Rights follow the login's role (EAINT-9840).", sources: [TS_9840] },
        { text: "Planned page 'Macrokiosk - Opt Out Listing' for free-text WhatsApp opt-outs (To Do).", sources: [J_12443] },
      ],
      scopeToCheck: [{ text: "Each role x module x Access / Download (Print, Export).", sources: [TS_9840] }],
      tickets: [{ key: "EAINT-9840", what: "CIBO user permission and download access per role.", state: "latest" }],
      openQuestions: ["Role names: prod code lists Admin, Technical Support, Finance, Ops Support; the TS lists Admin Insurance and Temporary Insurance Staff. Is the prod code older than EAINT-9840?"],
    },
    // =========================================================================
    {
      id: "transaction-management",
      name: "Transaction Management (listing, details, export, print)",
      summary:
        "One table of all eAuto and Secarang insurance transactions. Filter, search, open a transaction's details, export CSV or print.",
      portals: ["CIBO portal"],
      triggers: [
        {
          id: "search-listing",
          name: "Search the Transaction Listing",
          entry: "CIBO › Transaction Management (/cibo/transaction-management)",
          sources: [CIBO_LIVE, FC_42],
          steps: [
            {
              title: "Set filters",
              where: "Transaction Management › filter card",
              detail: "Platform, Insurance Company, Date Range Type (Transaction Creation Date / Insurance Creation Date) + From/Till, Transaction Status, JPJ status, Road Tax, Discount Code. Dates are read-only pickers: pick in the calendar, never type.",
              sources: [CIBO_LIVE, CIBO_DATES, TS_12151],
            },
            {
              title: "Click Search and wait",
              where: "Search (button[type=submit]) / Clear all",
              detail: "20 rows per page, up to 100. Wait until no CIBO API call is open: the first unfiltered load can overwrite the filtered result on screen.",
              sources: [CIBO_LIVE, CIBO_RACE, FC_7],
            },
            {
              title: "Read the row",
              where: "Transaction Listing table",
              detail: "# | Transaction Ref. No. | Transaction Created Date | Insurance Created Date | UCD | UCD Name | Vehicle No | Vehicle Type | Insured | Payment | Payment Mode | Discount Code | Road Tax | Ins. Co. | Transaction Status | JPJ | Remark. eAuto rows show the UCD name; Secarang rows show '-' in UCD, UCD Name, Discount Code, Road Tax, Remark.",
              sources: [FC_42, CIBO_UCD],
            },
          ],
        },
        {
          id: "open-details",
          name: "Open Transaction Details",
          entry: "Listing › Transaction Ref. No. link → /cibo/transaction-management/transaction-details/<uuid>",
          sources: [FC_44A],
          steps: [
            {
              title: "Open the details page",
              where: "Transaction Details",
              detail: "Header vehicle + model, Ref. No, status badge ('Insurance created'). Buttons Certificate of Insurance, Policy Schedule, Receipt. Sections: Car Owner, Car Details, Payment Details (Receipt No, Payment History with Payment Method e.g. 'Fiuu eWallet - GrabPay' + Paid badge, Payment Ref ID), More Info, premium block ending Total Premium.",
              sources: [FC_44A, TS_9617],
              branches: [{ when: "Hire purchase transaction", then: "Shows 'Hire Purchase: (Claimed by)'; e-cert cannot be downloaded on CIBO." }],
            },
          ],
        },
        {
          id: "export",
          name: "Export CSV / Print",
          entry: "Transaction Management › Export / Print",
          sources: [CIBO_LIVE, FC_43],
          steps: [
            {
              title: "Narrow the filter, then Export",
              where: "Transaction Management › Export",
              detail: "File Transaction_Management_<yyyyMMddHHmm>.csv (UTF-8 BOM; line 1 title, line 2 blank, line 3 header; 40 columns). Export follows the filter. An unfiltered export (~7,900 rows) produced no file after 3+ minutes.",
              sources: [CIBO_LIVE, FC_43],
            },
          ],
          affects: [{ text: "Export column order differs from the screen: Payment Mode sits between Discount Code and Payment Amount (RM).", sources: [CIBO_LIVE] }],
        },
      ],
      affects: [
        { text: "Nothing is written; CIBO is read-only for QA in every TS.", sources: [FC_6] },
        { text: "Third check for every eAuto insurance purchase (after UCD and BO) and the only record of a Secarang purchase.", sources: [FC_1] },
        { text: "Reads RHB direct-debit payment reference / response data through secarang-eauto-integration (/ia/insurance-payment-eauto/*, /ia/insurance-payment-report-eauto/*). The two platforms are told apart by tenant ID. No write-back into eAuto or Secarang, no e-Invoice, email, SMS or WhatsApp sender in CIBO.", sources: [ASK_C] },
      ],
      cronjobs: [
        { name: "CIBO data arrival (sync vs live join)", schedule: "None found in CIBO (it is a frontend; nothing is pushed to it)", does: "CIBO pulls on demand from the ins-api backend. For eAuto rows it uses the enrichment service secarang-eauto-integration (/ia/insurance-transaction-eauto/*, EAINT-11934) for UCD company, address and UCD Name. The only scheduled job found in these repos is a password / token cleanup (0 0 1 * * ?), unrelated to transactions.", sources: [ASK_C, CIBO_OPEN], unconfirmed: true },
      ],
      roles: [{ text: "Admin, Admin Insurance, Temporary Insurance Staff, Ops Support (no Print / Export).", sources: [CIBO_ROLES] }],
      afterCompletion: [],
      rules: [
        { text: "eAuto and Secarang transactions share one table; Secarang rows show '-' in UCD fields.", sources: [CIBO_UCD, J_12058] },
        { text: "UCD Name sits between UCD and Vehicle No (listing + export). Records before 2025 have no UCD Name (accepted).", sources: [CIBO_UCD, TS_12058] },
        { text: "EAINT-12058: Full Name (created / paid / last updated) + Login ID (paid) stored; only Full Name visible, rest DB-only (dev DB screenshot is the evidence). Last-updated always equals the payer.", sources: [CIBO_UCD, TEAMS_12058] },
        { text: "Insurance Created Date = payment date-time (payment table last_updated_at), '-' when not approved; the Insurance Creation Date filter excludes rows without it.", sources: [CIBO_DATES, TEAMS_12151, J_12151] },
        { text: "Money: Gross Premium = after NCD + add-ons; Service Tax = Gross x 8%; Stamp Duty RM10; codes EAUTOOFF10 10%, RJC7 7%, COTEAM 5%, SCW5 5%; eAuto commission 10%; sub-agent RJC7 3%.", sources: [CIBO_MONEY, TS_9979, TS_10052] },
        { text: "Payment cell text has no space before the badge (e.g. 'RM884.48Paid 07-10-2026 10:20').", sources: [CIBO_LIVE] },
        { text: "Statuses (code enums): Transaction (InsuranceStatusListEnum) Draft 'Quotation', Approval 'Pending approval', Pending 'Pending payment', Success 'Insurance created', Failed, Expired 'Quotation expired', Cancelled. Payment (PaymentStatusListEnum) New, Pending, Paid 'OK', Failed. JPJ 00 Not available, 03 Pending, 02 Rejected, 01 Accepted. CIBO only displays them; the service that moves a record between statuses is not in the repos the code reader could see.", sources: [ASK_C], alt: [{ text: "Seen statuses: Transaction 'Insurance Created', 'Pending payment'; Payment 'Paid', 'Pending', 'Failed'; JPJ 'Accepted'. Full lists unknown.", sources: [FC_55], note: "old guess (unconfirmed), swapped for the code version" }] },
        { text: "Details page actions (code): download e-certificate / certificate of insurance / policy schedule, generate a payment receipt (Secarang transactions only), re-check JPJ status on demand, edit and save the customer's road-tax delivery address. The Special Remark modal shows a hardcoded sample list, not live data (transaction-details and special-remark components).", sources: [ASK_C] },
        { text: "Payment channel groups shown: Credit/Debit Card (Visa, Mastercard), FPX Online Banking (many Malaysian banks incl. B2B variants), RHB Direct Debit. The payment report export separates eAuto and Secarang rows and pulls different fields for each (invoice number / date from the eAuto invoice record vs the Secarang payment record).", sources: [ASK_C] },
      ],
      scopeToCheck: [
        { text: "Every new or changed column on screen AND in the CSV export AND Print.", sources: [CIBO_TEST, FC] },
        { text: "An eAuto row and a Secarang row ('-' case); pre-CR rows (backfill).", sources: [CIBO_TEST, TS_12058] },
        { text: "Sub UCD created vs Main UCD paid (12058 attribution).", sources: [FC_6] },
        { text: "Same sum insured / premium as UCD and BO for an eAuto purchase.", sources: [FIP_X, TS_10044] },
        { text: "Both date types, mixed filters, export.", sources: [TS_12151] },
      ],
      tickets: [
        { key: "EAINT-12327", date: "2026-10", what: "Payment Mode column (after Payment, before Discount Code).", state: "latest" },
        { key: "EAINT-12151", date: "2026-09", what: "Transaction Created Date rename + Insurance Created Date (deployed 2026-09-30).", state: "latest" },
        { key: "EAINT-12058", date: "2026-08", what: "UCD Full Name + Login ID columns (prod 2026-08-17).", state: "latest" },
        { key: "EAINT-11934", date: "2026-07", what: "UCD Name / User ID (Payment Report 2026-07-24; listing moved to 12058).", state: "latest" },
        { key: "EAINT-9979", date: "2026-05", what: "Extra listing / export columns.", state: "latest" },
        { key: "EAINT-8657", date: "2025-10", what: "First extra export fields (with 8956).", state: "legacy", supersededBy: "EAINT-9979" },
        { key: "EAINT-9617", date: "2026-02", what: "Hire Purchase (Claimed by) in CIBO.", state: "latest" },
      ],
      openQuestions: [
        "Which service owns the ins-api transaction engine and moves records between statuses? It is not in the repos the code reader could see.",
        "Is the Special Remark modal a known placeholder? The code shows a hardcoded sample list, not live data.",
        "Transaction Listing date-range limit unknown (12151 TS05 uses about 2 months).",
        "Export Payment Mode position: SRD 'before Discount Code' vs live 'between Discount Code and Payment Amount'.",
      ],
    },
    // =========================================================================
    {
      id: "payment-management",
      name: "Payment Management (payment channels)",
      summary: "Listing of payments filtered by payment channel, with Payment Reference ID and export.",
      portals: ["CIBO portal"],
      triggers: [
        {
          id: "filter-channels",
          name: "Filter by Payment Channels",
          entry: "CIBO › Payment Management (/cibo/payment-management)",
          sources: [CIBO_LIVE, FC_45, TS_12107],
          steps: [
            {
              title: "Tick payment channels",
              where: "Payment Channels checkbox tree",
              detail: "Group 'Fiuu - eWallet' → GrabPay, GrabPay - PayLater by Grab, ShopeePay. Ticking the group ticks all; unticking one clears that one and the group tick.",
              sources: [CIBO_LIVE, CIBO_BA, J_12107],
            },
            {
              title: "Search and export",
              where: "Search / Export / Clear all",
              detail: "Listing has Payment Ref ID. Export column is 'Payment Reference ID'. An empty listing downloads no file.",
              sources: [CIBO_LIVE, FC_45],
            },
          ],
        },
      ],
      affects: [],
      cronjobs: [],
      roles: [{ text: "Admin (not in the Admin Insurance / Temporary Staff module lists).", sources: [CIBO_ROLES], alt: [{ text: "Payment Management guard allows Admin, Technical Support and Ops Support; Finance is not allowed.", sources: [ASK_C], note: "prod code says" }] }],
      afterCompletion: [],
      rules: [
        { text: "'ShopeePay - SPayLater' option dropped 2026-10-20: dev cannot tell it from ShopeePay Full Amount.", sources: [CIBO_BA, TEAMS_12107] },
        { text: "E-wallet Payment Ref ID contains 'EW' (e.g. LON20261007SEW0001), new data from 2026-09-11 only; card / FPX must not.", sources: [FC_54, CIBO_EW] },
        { text: "PayLater by Grab rows show channel 'Fiuu eWallet GrabPay' (accepted; not a separate channel per dev).", sources: [CIBO_BA] },
      ],
      scopeToCheck: [
        { text: "Tick / untick behaviour; export only filtered rows; EW present / absent.", sources: [TS_12107, CIBO_LIVE] },
      ],
      tickets: [
        { key: "EAINT-12107", date: "2026-10", what: "Fiuu eWallet filter group + EW in reference.", state: "latest" },
      ],
    },
    // =========================================================================
    {
      id: "payment-report",
      name: "Payment Report",
      summary: "Report of insured (paid) transactions by Insurance Created date, with money, commission and Payment Mode columns.",
      portals: ["CIBO portal"],
      triggers: [
        {
          id: "run-report",
          name: "Run the Payment Report",
          entry: "CIBO › Payment Report (/cibo/payment-report)",
          sources: [CIBO_PR, FC_46, TS_10052],
          steps: [
            {
              title: "Set a narrow date window",
              where: "Insurance Created From / Till (fromDate / toDate pickers) + Platform",
              detail: "Always one week or less (automation uses the last 7 days). Each search takes about 2 minutes.",
              sources: [CIBO_PR],
            },
            {
              title: "Search and read",
              where: "Payment Report table",
              detail: "Only insured transactions. Columns include Company, Insurance Company, Agency, Transaction Ref. No., Receipt No., Vehicle No., E-Certificate No., Coverage Type, Payment Ref. ID, Payment Mode, Platform, Hire Purchase x3, Gross Premium, Service Tax, Stamp Duty, Total Premium, Discount Code, Commission, Gross Profit, Payment Amount.",
              sources: [CIBO_PR, TS_10052],
            },
            {
              title: "Export",
              where: "Export",
              detail: "File Payment_Report_YYMMDDHHmm.csv.",
              sources: [FC_46, TS_10052],
            },
          ],
        },
      ],
      affects: [],
      cronjobs: [],
      roles: [{ text: "Admin, Admin Insurance, Temporary Insurance Staff.", sources: [CIBO_ROLES], alt: [{ text: "Payment Report guard allows Admin, Technical Support and Finance; Ops Support is not allowed.", sources: [ASK_C], note: "prod code says" }] }],
      afterCompletion: [],
      rules: [
        { text: "Payment Mode strings (SRD 12327 v1.1): 'BoldPay | eWallet – TouchNGo', 'BoldPay | Online Banking – FPX-Bank Name', 'BoldPay | Credit/Debit Card – MBBMGATE_MS', 'Fiuu | eWallet – ShopeePay', 'Fiuu | eWallet – GrabPay – Full Amount – Single Payment', 'Fiuu | eWallet – GrabPay – BNPL – Installment', 'Fiuu | Online Banking – FPX-Bank Name'. Never blank on the report; '-' when none.", sources: [CIBO_PM, CIBO_BA, CIBO_FPX] },
        {
          text: "Bare 'Fiuu' is correct for a Fiuu card payment.",
          sources: [CIBO_PM],
          unconfirmed: true,
        },
        { text: "Legacy values: 'Bold Pay' = MacroKiosk, 'Fiuu' = Secarang after 01.03.2024, 'RMS' = Secarang before, 'RHB' = eAuto.", sources: [TS_11541, FC_46] },
        { text: "'RHB – eAuto' in the export vs 'RHB' on screen is existing behaviour (pass).", sources: [CIBO_BA] },
        { text: "UCD Name column between UCD and Vehicle No (live 2026-07-24).", sources: [FC_46, J_11934] },
      ],
      scopeToCheck: [
        { text: "Payment Report and Transaction Listing agree for the same transaction (Payment Mode, dates, UCD).", sources: [CIBO_TEST, TS_12327] },
        { text: "Payment Mode per platform and per cutoff date; individual vs company; with / without hire purchase.", sources: [TS_11541, TS_10052] },
      ],
      tickets: [
        { key: "EAINT-12327", date: "2026-10", what: "Payment Mode full format (SRD v1.0 → v1.1, 6 → 7 strings).", state: "latest" },
        { key: "EAINT-11541", date: "2026-07", what: "Gateway name in Payment Mode (RMS → Fiuu, Bold Pay).", state: "legacy", supersededBy: "EAINT-12327" },
        { key: "EAINT-10052", date: "2026-05", what: "Payment Report columns (commission, profit).", state: "latest" },
        { key: "EAINT-12566", date: "2026-10", what: "QA-Issue: Fiuu FPX shows bare 'Fiuu' (On Hold).", state: "latest" },
      ],
      openQuestions: ["11934 'User ID' vs 12058 'Login ID' — same field?"],
    },
    // =========================================================================
    {
      id: "referred-risk-log",
      name: "Referred Risk Log",
      summary: "Log of quote enquiries the insurer referred (not auto-approved). Feeds the monthly referred-risk WhatsApp video.",
      portals: ["CIBO portal"],
      triggers: [
        {
          id: "search-log",
          name: "Search and export the log",
          entry: "CIBO › Referred Risk Log (/cibo/referred-risk-log)",
          sources: [TS_9900, FC_47, J_12442],
          steps: [
            {
              title: "Set Platform and Create Date",
              where: "Referred Risk Log filters",
              detail: "After EAINT-12442 (testing): max 30 days, default 1st of this month to today, From not in the future, Till not after today.",
              sources: [TS_9900, J_12442],
            },
            {
              title: "Search and export",
              where: "Search / Export",
              detail: "Columns: Inquiry Date, Inquiry By, Platform, Reference No, Company Name, Company Registration No, Vehicle No., Vehicle Type, Insured Name, Insured ID, Insurance Company, Year, Make, UCD City, UCD State, Vehicle Model, Hire Purchase x3, Remark.",
              sources: [TS_9900, FC_47],
            },
          ],
        },
      ],
      affects: [{ text: "Monthly referred-risk cron reads this log (records from 01.06.2026) to send the WhatsApp video.", sources: [TS_11867] }],
      cronjobs: [{ name: "Referred-risk re-quote", schedule: "monthly", does: "Re-quotes logged vehicles with other insurers and sends one WhatsApp video.", sources: [TS_11867] }],
      roles: [{ text: "Admin only (not in other role lists).", sources: [CIBO_ROLES] }],
      afterCompletion: [],
      rules: [{ text: "Inquiry Date 'DD-MM-YYYY HH:MM' (24 h); Inquiry By 'UCDID/userID'; UCD City = branch city.", sources: [FC_47, TS_9900] }],
      scopeToCheck: [{ text: "Date-range limits (12442); column order; export.", sources: [J_12442, TS_9900] }],
      tickets: [
        { key: "EAINT-12442", date: "2026-10", what: "Limit date range to one month (Testing In 1st Env).", state: "latest" },
        { key: "EAINT-9900", date: "2026-05", what: "Referred Risk Log columns.", state: "latest" },
      ],
      openQuestions: ["9900 export uses the Payment_Report file name — copy error?"],
    },
    // =========================================================================
    {
      id: "crm-quotation-link",
      name: "CRM: send renewal quotation link",
      summary: "CIBO CRM user sends a renewal WhatsApp to a customer from the customer's details page.",
      portals: ["CIBO portal", "WhatsApp (MessageBird)"],
      triggers: [
        {
          id: "send-quotation-link",
          name: "Send quotation link",
          entry: "CIBO › Customer Relationship Management › Customer Details › [Send quotation link]",
          sources: [TS_8147],
          steps: [
            {
              title: "Open the customer",
              where: "CIBO › CRM › Customer Details",
              detail: "Customer from a Secarang or eAuto insurance purchase.",
              sources: [TS_8147],
            },
            {
              title: "Click Send quotation link",
              where: "Customer Details › Send quotation link",
              detail: "Secarang origin: 'Dear {owner_name}, Your insurance policy for vehicle {vehicle_no}({vehicle_make}) will expire on {dd.mm.yyyy}…'. eAuto origin adds 'since your purchase from {ucd_company}'. Company vehicles use {company_name}. MessageBird must be enabled.",
              sources: [TS_8147],
            },
          ],
        },
      ],
      affects: [{ text: "WhatsApp to the owner / company.", sources: [TS_8147] }],
      cronjobs: [],
      roles: [{ text: "Admin (CRM is in the Admin module list only).", sources: [CIBO_ROLES] }],
      afterCompletion: [],
      rules: [],
      scopeToCheck: [{ text: "Origin (Secarang / eAuto) x insurer x private / company; placeholders.", sources: [TS_8147] }],
      tickets: [{ key: "EAINT-8147", what: "CRM renewal reminder WhatsApp (many rows Not Started).", state: "latest" }],
    },
  ],
};
