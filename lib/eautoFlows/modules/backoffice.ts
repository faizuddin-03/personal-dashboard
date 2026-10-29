import type { Module, Source } from "../types";

const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const azfar = (ref: string): Source => ({ kind: "azfar", ref });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const miro = (ref: string): Source => ({ kind: "miro", ref });
const ts = (ref: string): Source => ({ kind: "ts", ref });
const ask = (ref: string): Source => ({ kind: "askeauto", ref: "prod code 0e21bef3db — " + ref, date: "2026-10-23" });

const AZ_BO = azfar("knowledge/portals/backoffice/portal.md#The 11 menu groups");
const AZ_ROLES = azfar("knowledge/_core/roles-and-accounts.md");
const AZ_BO_OPEN = azfar("knowledge/portals/backoffice/open-questions.md");
const M_SHELL = mine("knowledge/flow-bo-shell.md");
const M_BR = mine("knowledge/business-rules-from-test-scenarios.md");
const M_CL = mine("knowledge/flow-ucd-company-listing.md");
const M_XML = mine("knowledge/jpj-xml-log.md");
const M_AP = mine("knowledge/flow-association-payment-listing.md");
const MIRO_AP = miro("uXjVHrYDgq8= (EAINT-12028)");
const MIRO_CN = miro("uXjVHUk5_XI= ([eAuto - BackOffice] 8700 - Credit Note Module)");
const MIRO_SC: Source = miro("uXjVHAd4xoA= (Shopping Cart, Reconciliation Summary section)");
const AZ_RECON = azfar("cr/EAINT-10168/LEDGER.md");

export const backoffice: Module = {
  id: "backoffice",
  name: "Back Office (admin, accounts, reports, reconciliation)",
  short: "Back Office",
  portals: ["Back Office (BO)", "JPJ", "RHB (bank statement via Synology)", "LHDN MyInvois"],
  summary:
    "Back Office is the staff portal. The same login page as UCD is used, and the account role decides which portal opens. BO staff manage company accounts, run listings and reports, support stuck transactions, read JPJ logs, reconcile payments against the RHB statement, approve monthly association payments and raise credit notes. Most flow documents for BO pages are thin: only the menu label and link are known for many pages.",
  related: ["service-hub", "payments-fees", "cibo", "onboarding"],
  glossary: [
    { term: "Hub Admin", meaning: "A BO role (also written HubAdmin). Seen on the captured home menu. Super Admin and Hub Admin differ in some menus (see open questions).", sources: [M_SHELL, AZ_ROLES] },
    { term: "Ops / CSE / Finance", meaning: "Staff groups used in test accounts. Ops = operations, CSE = customer service, Finance = payments and reports. Prod code has no role for them. They are informal labels on hand-picked lists of usernames (for example a finance-only list for payment invoices and SST reports). CSE appears only as a comment next to one Service Hub list.", sources: [AZ_ROLES, AZ_BO_OPEN, ask("AuthorizedUserList.java; Which BO roles exist")] },
    { term: "Superadmin (code meaning)", meaning: "In prod code this is a status of an external company's own user (dealer or AATF) inside that company's user management. It is not an internal BO role.", sources: [ask("Which BO roles exist")] },
    { term: "JPJ Dereg / JPJ Hasil / Bintang Prospek", meaning: "Separate company or login accounts, not BO staff roles. JPJ Dereg and JPJ Hasil are JPJ staff logins that upload and view reconciliation reports. Bintang Prospek is an insurance company with its own portal and login.", sources: [ask("Which BO roles exist")] },
    { term: "Wholesale Logistic Admin", meaning: "The only role in the newer role table (role, permissions, members). It covers 4 wholesale logistics screens (pricing tiers, hubs, unpriced items, pricing history) and has 4 named members.", sources: [ask("BackOfficePermissionCode.java:21-54; Which BO roles exist")] },
    { term: "JPJ Hasil", meaning: "JPJ revenue portal that receives final submissions and reconciliation. BO has a JPJ Hasil Audit Log and JPJ Hasil reports. The long form is not defined in the repo.", sources: [AZ_BO_OPEN] },
    { term: "Kod Hasil", meaning: "JPJ revenue code in the reconciliation listing: H0272423 (STMS, eSTM, APT), H0272404 (BMK, TH, eDereg Pre-Checking), H0171105 (eLKM), - for non-JPJ items.", sources: [AZ_RECON] },
    { term: "Synology", meaning: "Where Finance uploads the RHB transaction file. The auto-reconciliation reads it from there.", sources: [ts("RECONSL_SS_TS2"), AZ_RECON] },
    { term: "HTM", meaning: "Hakmilik Tukar Milik (roughly \"ownership transfer\"). The JPJ-facing label for the feature coded as OTH (Ownership Transfer History); shown as JpjEnquiryTransactionType.HTM in JPJ reports, reconciliation and payment screens, and in the listing name \"BMK, HTM dan eLKM Transaction Listing\".", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }, AZ_BO_OPEN] },
    { term: "POB", meaning: "Pay On Behalf (also called Payment On Behalf in one internal note). Old split-payment method: the fee is split into two bank debits, dealer to eAuto and dealer to JPJ. Marked discontinued (sunset) in the knowledge notes, but the flag and handling code remain (PaymentMethod.POB, allowPOB, CompanyPOBBalanceReportController). Treat as legacy.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }, AZ_BO_OPEN] },
    { term: "eAuto Plus", meaning: "Product name for a bundle of add-on services on top of the core system: BMK, OTH, LKM, eVOC, JomCheck and others. Seen as the BO menu group eAuto Plus Relevant and in report names such as RHB Payment Transaction (eAuto Plus). Not an acronym.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }, AZ_BO_OPEN] },
    { term: "eLKM", meaning: "BO menu name. The repo does not say what the \"e\" long form is; LKM is one of the eAuto Plus services.", sources: [AZ_BO_OPEN] },
    { term: "FMC / MMSDA", meaning: "The two associations paid monthly in Association Payment Listing. FMC gets RM1 per car transaction. MMSDA gets RM2 per motorcycle transaction.", sources: [M_AP, jira("EAINT-12028")] },
    { term: "CompanyStatus", meaning: "Status of a company account in prod code: New, Verified, Activated, Inactivated, Rejected, Terminated.", sources: [ask("CompanyStatus.java")] },
    { term: "PFI", meaning: "Proforma Invoice. A Credit Note is raised from a PFI.", sources: [MIRO_CN] },
  ],
  flows: [
    {
      id: "bo-menu-and-roles",
      name: "BO login, home menu and role map",
      summary:
        "Staff log in on the shared login page, land on /home/ and use the menu category grid. Every BO listing follows one search pattern. The menu has 11 groups and about 121 links. Menu items are shown by role.",
      portals: ["Back Office"],
      triggers: [
        {
          id: "bo-login",
          name: "Login page",
          entry: "https://staging.eauto.my/<env>/public/login/ (same page as UCD) then /<env>/home/",
          summary: "House rule for scripts: open only /home/ and click through the menus. Never goto() a deep URL.",
          sources: [M_SHELL, mine("scripts/eauto-jomcheck/data/config.ts", "2026-09-30")],
          steps: [
            {
              title: "Log in",
              where: "/<env>/public/login/",
              detail: "Enter username and password. Wait until the URL leaves /public/login. BO has no campaign popup chain, but dismiss any banner. Staging prints DEMO SYSTEM!! on the BO home.",
              branches: [{ when: "Inactive BO user", then: "Message: Unable to login. Please contact your supervisor or admin." }],
              sources: [M_SHELL, AZ_BO, ts("EAINT-10038 #003")],
            },
            {
              title: "Land on the home menu",
              where: "BO › /<env>/home/ (div#home-welcome and div#home-menu)",
              detail: "Category grid. Header links: home (a#home-link), menu (a#menu-link), logout (a.logout, asks Sure to logout?), My Account. Session timeout is about 24 hours.",
              sources: [M_SHELL],
            },
            {
              title: "Check the pending transaction counter",
              where: "Header › #incomplete-txn-notification-wrapper",
              detail: "Text: <n> Pending Transaction Found! Click opens /view/support/incomplete-txn/.",
              affects: ["Support Tools"],
              sources: [M_SHELL],
            },
          ],
        },
        {
          id: "bo-onboarding-redirect",
          name: "Onboarding items redirect into the /obs app",
          entry: "BO › Onboarding › any listing item (li.obs-auth-required)",
          summary: "These items leave the BO app. The instance goes in the redirect, the /obs app itself has no instance.",
          sources: [M_SHELL],
          steps: [
            {
              title: "Click an Onboarding menu item",
              where: "BO › Onboarding",
              detail: "Goes to /<env>/api/admin/onboarding/auth-redirect.do?type=<type> and lands in the /obs app.",
              affects: ["Onboarding"],
              sources: [M_SHELL],
            },
          ],
        },
        {
          id: "bo-search-pattern",
          name: "Any BO listing (shared search pattern)",
          entry: "Any BO menu page with form#search-form",
          sources: [M_SHELL],
          steps: [
            {
              title: "Fill filters and search",
              where: "form#search-form › Search (input#to-search)",
              detail:
                "Common fields: vehicleNo, refNo, companyName, companyRoc, chassisNo, #fromDate and #toDate (readonly jQuery UI datepickers, DD-MM-YYYY, max date today). The button text varies (SEARCH Now, Search Now, SEARCH). Results appear in td#result as <n> record(s) in total. Action View opens .../view.do?id=<uuid>&back=false in a new tab. Export (a#to-export) is hidden until a search returns. Reset is a.to-reset.",
              sources: [M_SHELL],
            },
            {
              title: "Use the datepickers by clicking",
              where: "Date fields",
              detail: "Fields are readonly: pick in the widget. The To picker is limited by the From picker only when the From date is picked with a real click.",
              sources: [M_SHELL],
            },
          ],
        },
      ],
      affects: [
        { text: "The shell is where every BO check in other flows begins: Service Hub listing, JomCheck enquiry, eDereg logs, company accounts, insurance listing.", sources: [M_SHELL] },
        { text: "Two menu labels appear twice with different links: STMS Transaction and eSTM Transaction (one under Transactions Relevant, one under Support Tools). Jomcheck Transaction and JomCheck Report Listing are different pages.", sources: [M_SHELL] },
      ],
      cronjobs: [],
      roles: [
        {
          text: "Menu groups on the Hub Admin capture (2026-08-21 uat1): Account Management; Reports; Insurance; Onboarding; Transactions Relevant; eAuto Plus Relevant; Support Tools; Proforma Invoice / e-Invoice; Settings; Settings (Hub Admin); JPJ Reports; Wholesale.",
          sources: [M_SHELL],
          alt: [{ text: "Azfar lists 11 groups with 121 links, and names a Permission Setup group (6 items) that mine puts inside Settings. Counts: Account Management 9, Reports 12, Insurance 8, Onboarding 5, Transactions Relevant 8, eAuto Plus Relevant 2, Support Tools 14, Permission Setup 6, Settings (Hub Admin) 17, JPJ Reports 8, Wholesale 8.", sources: [AZ_BO], note: "Same menu, grouped differently. Counts are from the Azfar capture." }],
        },
        { text: "Category divs carry role classes: Admin, HubAdmin, Normal. The observed BO user role is HubAdmin. A Normal user sees only Reports and Onboarding (inferred).", unconfirmed: true, sources: [M_SHELL] },
        {
          text: "Super Admin vs Hub Admin (EAINT-10038): menus only Super Admin sees are Company Account Listing (Limited Features For UCD To UCD), Manage AATF/PBT Account, JPJ Reports, Account Balance Summary, Statement of Account (UCD) and Transaction Summary Report. This conflicts with the Hub Admin capture, which shows some of these.",
          unconfirmed: true,
          sources: [ts("EAINT-10038"), M_SHELL],
          alt: [
            { text: "Support Tools STMS, Bulk STMS Cancellation, Resubmit JPJ Final Submission (STMS) and Manual APT Trigger = Super Admin and Hub Admin. JPJ Reports = Super Admin only.", sources: [AZ_ROLES], note: "From workbook 10038 as read in the Azfar repo." },
            { text: "Prod code has no Super Admin BO role (UserRole is Admin, HubAdmin, Normal, Probation). JPJ Reports and Reconciliation V2 are gated by the named whitelist list_jpj_reconciliate_v2_for_backoffice plus role Admin or HubAdmin, and a separate insurance-only whitelist sees a cut-down menu.", sources: [ask("AuthorizedUserList.java:20; menu.jsp:690-825")], note: "prod code says" },
          ],
        },
        { text: "Test account groups (QA credential sheet 2026-09-09): plain (eautoadmin, rosalindkhoo, onghongkee, kmcheah, wahidahzaki); Ops (jasons, mfared, diannan, nikmuhamad, eautosoyeng, eautohaffiz, eautokelvin); Finance (eautoaccount); CSE (eautohamal, eautochinwei, eautojrjaya, eautoxiayuan, kokping, eautomie). Other roles: Super Admin, Hub Admin, Admin, Probation, JPJ Dereg User (jpjdereg), JPJ Hasil User (jpjhasil1), Bintang Prospek (angela, windscreen, kmchia), Service Portal users.", sources: [AZ_ROLES] },
        { text: "Prod code: there is no BO role to menu-group map for CSE, Ops, Finance, Bintang Prospek, JPJ Dereg, JPJ Hasil or superadmin. Almost every BO screen or action checks its own hardcoded list of individual staff usernames in AuthorizedUserList (dozens of lists, one per feature, for example who sees payment invoices, who manages credit notes, who uploads JPJ reconciliation, who edits Service Hub biometric remarks). The real BO user roles in the UserRole enum are Admin, HubAdmin, Normal and Probation. A test case of the form 'does role X see menu group Y' has nothing to map to.", sources: [ask("AuthorizedUserList.java; UserRole.java; Which BO roles exist")], alt: [{ text: "Ops, CSE and Finance are real BO staff groups with different menu access (test account groups above).", sources: [AZ_ROLES, M_SHELL], note: "Shown by test-account labels. Code shows only named-user lists." }] },
        { text: "Prod code: the one real role table so far has a single role, Wholesale Logistic Admin (4 named members), covering four wholesale logistics screens. See the glossary.", sources: [ask("BackOfficePermissionCode.java:21-54")] },
        { text: "Some new BO pages ship behind hard-coded user whitelists that are not in the SRD. Check this on deploy night. Examples: JomCheck BO listing (9 users plus jasons on staging), Bypass BioID (jasons, mfared, eautohaffiz, eautosoyeng, mfizni), Bypass Purchase SSM page (jasons, mfared, nikmuhamad, mfizni), Insurance Cancellation Status page (8 accounts until patched 2026-10-15), reconciliation (Ops 5 plus Finance eautoaccount).", sources: [AZ_BO_OPEN, azfar("knowledge/portals/backoffice/how-we-test.md"), AZ_ROLES] },
      ],
      afterCompletion: [],
      rules: [
        { text: "Date From and To max one month unless the module says otherwise. Never set the widest possible window.", sources: [mine("quirks.md", "2026-10-05")] },
        { text: "Menu map (links shown only; most pages have no flow document yet): Account Management: Manage Company Accounts /view/account/company, Manage Backoffice User Accounts /view/account/user, View UCD User Accounts, Manage Bank/Credit Company Accounts /view/credit-account/company, IP Whitelist, Company Account Listing (Limited Features For UCD To UCD), Manage AATF/PBT Account /view/account/dereg/aatf, Manage e-Invoice Setup Company Listing /view/einvoice/company.", sources: [M_SHELL, AZ_BO] },
        { text: "Reports: JPJ Reports, Account Balance Summary (and by Month/Year), Account Deposit/Adjustment, Company POB Balance, POB Payment Report, Statement of Account (UCD), Transaction Summary Report (and by State), Vehicle Movement Report (UCD), Interim Payment Report, Reset Payment Report, Inter-Branch Transfer History Report.", sources: [M_SHELL, AZ_BO] },
        { text: "Insurance: Permission Listing, User Permission Log, Endorsement, Insurance Transaction Listing /view/insurance/enquiry, Insurance Payment Transaction, Upload Insurance e-Certificate, Insurance Quote Enquiry, Refer Risk Log, Insurance Payment OTP Log.", sources: [M_SHELL] },
        { text: "Transactions Relevant: STMS /view/stms/enquiry, APT /view/apt/enquiry, eSTM /view/estm/enquiry, Deregistration /view/dereg/enquiry/main.do, Jomcheck /view/jomcheck/enquiry, SSM, eDereg Pre-Checking /view/dereg/precheck/enquiry/main.do, Company Business Document Listing. eAuto Plus: BMK Transaction /view/bmk/enquiry/main.do and RHB Payment Transaction.", sources: [M_SHELL] },
        { text: "Support Tools: STMS Transaction, Support Audit Log (STMS, APT, eSTM), Audit Trail Log, Company Account Audit Log, Backoffice User Account Audit Log, Blacklist audit log, Pending/Failed APT audit log, RHB Reconciliation Audit Log, JPJ Hasil Audit Log, Resubmit Pending STMS/APT/eSTM /view/support/incomplete-txn/, Manual APT Trigger, Manage Pending/Failed APT Transaction, JPJ Enquiry (and New), Bulk STMS Cancellation, Resubmit JPJ Final Submission (STMS, eSTM, eDereg Pre-Checking).", sources: [M_SHELL] },
        { text: "Settings: RHB Payment Transaction, 1 Layer Permission Listing, 2 Layer Permission Setup, eLKM Permission Listing/Log, Blacklist Company ROC, MyKad (STMS and eSTM), MyKad (UCD User), Vehicle No. Settings (Hub Admin): Manual Payment Processing, JPJ XML Logs, SSM XML Log, Generate Batch Invoice, eSTM User Permission Log, Change Director Log, Customize Display Message, Bulk Submission Setup (and Audit Log, Control for System Maintenance), Bypass Purchase SSM (and Audit Log), JomCheck Report Listing.", sources: [M_SHELL] },
        { text: "Proforma Invoice / e-Invoice: Generate Proforma Invoice, Proforma Invoice / e-Invoice Listing /view/proformainvoice/enquiry/, Credit Note Listing, Biometric Device Purchase & Software Installation Listing /view/bo/service-hub/listing/main.do.", sources: [M_SHELL] },
        { text: "JPJ Reports: eAuto Reconciliation Summary Report (and eAuto Plus), STMS/APT/eSTM Transaction Listing, BMK/HTM/eLKM Transaction Listing, eDereg Pre-Checking listing, Reconciliation Summary Listing, JPJ Reconciliation Report (HASIL), JPJ eSTM Report (HASIL). Wholesale group: Manage Wholesale Company Account, Transaction, Refund, Vehicle Payment, Rejection and Payment listings, Alternative Vehicle Maintenance (and Audit Log). Which of the 8 wholesale items belong to eAuto BO and which to the wholesale back office is not known.", sources: [M_SHELL, AZ_BO, AZ_BO_OPEN] },
        { text: "The transaction id in the URL differs by page: ?txnId=<number> (oldest Service Hub), ?transactionId=<uuid> (insurance details), ?id=<uuid> (eSTM details and current Service Hub). Service Hub detail needs both txnId and apptId.", sources: [mine("knowledge/eauto-portals.md")] },
        { text: "BO footer says Best Compatible With Mozilla Firefox V36.0.4. BO and JPJ users use Chrome, then Firefox. Chrome only from 2027-01-01 (EAINT-12180 / 12253).", sources: [M_SHELL, mine("knowledge/eauto-portals.md")] },
      ],
      scopeToCheck: [
        { text: "A ticket that adds a BO menu item: check role visibility of the category and the item.", sources: [M_SHELL] },
        { text: "Listing pattern variants: search button text, export, reset, datepickers.", sources: [M_SHELL] },
        { text: "Duplicate menu labels that point to different pages.", sources: [M_SHELL] },
        { text: "New BO page behind a hard-coded user whitelist: confirm the list before deploy night.", sources: [AZ_BO_OPEN] },
        { text: "BO account without permission lands on main.do with no date filter (no listing access).", sources: [mine("knowledge/eauto-portals.md")] },
      ],
      tickets: [
        { key: "EAINT-10038", date: "2026-05", what: "Super Admin role and menu access.", state: "latest" },
        { key: "EAINT-9044", what: "Transaction Restriction on company account.", state: "latest" },
        { key: "EAINT-8826", what: "BO Reset Payment on STMS and eSTM listing.", state: "latest" },
        { key: "EAINT-12403", date: "2026-10", what: "APT Reset and service charge change.", state: "latest" },
      ],
      openQuestions: [
        "Is jasons a Super Admin or Ops only? (Azfar open question).",
        "What do eLKM and JPJ HASIL stand for? (Azfar open question). Prod code answered HTM, POB and eAuto Plus (see glossary) but gives no long form for these two.",
        "Menu captures disagree: the 2026-08-24 paste lacks about 30 links. It is probably partial.",
        "BO login DOM, pagination markup and the over-one-month error text were never captured.",
      ],
    },
    {
      id: "manage-company-accounts",
      name: "Manage Company Accounts and company administration",
      summary:
        "BO creates and updates UCD company accounts: fields, permissions, transaction restriction, SSM bypass, audit log. Related pages: Manage Bank/Credit Company Accounts and Manage AATF/PBT Account.",
      portals: ["Back Office", "UCD portal", "Service Portal"],
      triggers: [
        {
          id: "mca-menu",
          name: "Manage Company Accounts",
          entry: "BO › Account Management › Manage Company Accounts (/<env>/view/account/company) › Create New or open a company",
          sources: [M_SHELL, M_BR, ts("EAINT-9233 TSDTCB_TS1")],
          steps: [
            {
              title: "Search or create a company",
              where: "Manage Company Accounts › form#search-form (Company Account Listing) › Search or Create New",
              detail: "Filters include Transaction Restriction (All default, Yes, No) next to Business Type.",
              sources: [M_CL, ts("EAINT-9044 9044_SnF_TS1")],
            },
            {
              title: "Fill the company form",
              where: "Create New / Update Company Account",
              detail:
                "Validation (EAINT-8774): Postcode 5 digits, Mailing address max 300, Director name letters only and max 100, Director email rules and max 100. Decision Maker and Showroom fields (EAINT-8644 and 8773). Default ticked permissions on a new company (EAINT-9233): eSTM (1 layer) 10, Insurance 6, BMK, Transfer History, eLKM 10. Block STMS Category and Transaction Restriction (default No) sit in the same form.",
              affects: ["UCD portal permissions", "Company Account Audit Log"],
              sources: [M_BR, ts("EAINT-9233"), ts("EAINT-8774")],
            },
            {
              title: "Set Purchase SSM Document options",
              where: "Create/Update Company Account › Purchase SSM Document",
              detail: "Tick STMS Company Category, eSTM Company Category and Bypass Purchase SSM - User Category. Only some BO users can see and tick the bypass box (jasons seen in tests).",
              affects: ["SSM", "STMS", "eSTM"],
              sources: [ts("EAINT-8802 BO_PERM_TS1")],
            },
            {
              title: "Save or Update",
              where: "Create/Update Company Account › Save / Update",
              detail: "A change is written to the audit log as [Field] Old: X New: Y. Entries are named Create New Company and Update Company Information. A log entry must never be written under another company.",
              affects: ["Company Account Audit Log", "CSV export (writes an audit log entry too)"],
              sources: [M_BR, ts("EAINT-6762 CAL_6762_TS1")],
            },
          ],
        },
        {
          id: "mca-company-details-mvd",
          name: "Company Details › MVD Agreement",
          entry: "BO › Manage Company Accounts › search › click the company name › Company Details › MVD Agreement",
          sources: [ts("EAINT-11499 11499_TS01")],
          steps: [
            {
              title: "Open the MVD Agreement",
              where: "Company Details › MVD Agreement",
              detail: "CSE users see the UCD version (no thumbprint), read-only, no download. Super Admin (jasons) downloads the version with the MyKad picture and thumbprint. Other Hub Admin, Admin and Probation users do not see the button.",
              sources: [ts("EAINT-11499 11499_TS01-TS09")],
            },
          ],
        },
        {
          id: "mca-bank-credit",
          name: "Manage Bank/Credit Company Accounts",
          entry: "BO › Account Management › Manage Bank/Credit Company Accounts › open account or Create New",
          sources: [ts("EAINT-11175 11175_TS01"), mine("knowledge/cr-test-scenario-catalogue.md")],
          steps: [
            {
              title: "Set the three permission checkboxes",
              where: "Bank/Credit account form › below Full Enquiry Permission",
              detail: "Allow UCD to share JomCheck Report (default off), Allow Login to Service Portal (default on), Allow Bypass Whitelisting Feature (default off). Existing accounts default Full Enquiry and Allow Login on. Click Save. Others see the boxes disabled.",
              affects: ["JomCheck (UCD Get JomCheck Report page)", "Service Portal login"],
              sources: [ts("EAINT-11175 11175_TS03-TS13")],
            },
          ],
        },
        {
          id: "mca-company-details-checker",
          name: "Company Details Checker (dashboard tool)",
          entry: "Dashboard tool /eauto/company-details-checker. It reads BO › Manage Company Accounts.",
          summary: "A read-only helper that tells whether a Company ROC, New Company ROC or TIN is still free. See flow company-details-checker.",
          sources: [M_CL],
          steps: [
            {
              title: "Run the checker",
              where: "Dashboard › /eauto/company-details-checker",
              detail: "Searches the BO listing one column at a time. See the Company Details Checker flow for steps.",
              sources: [M_CL],
            },
          ],
        },
        {
          id: "mca-activation-email",
          name: "Activation email to the new UCD primary user (prod code)",
          entry: "Email link › /public/activation/activate.do (MyKad and consent steps)",
          summary: "The only outward-facing entry point of the company and user management pages. Everything else is BO-staff only.",
          sources: [ask("CompanyAccountController.java")],
          steps: [
            { title: "BO creates the company", where: "BO › Manage Company Accounts › Create New", detail: "Form A/D and IC or passport documents are uploaded. The record is created as CompanyStatus New, the primary user is created automatically, eSTM permission defaults are set, IUTU whitelist rows may be written and an audit log row is written.", sources: [ask("CompanyAccountController.java")] },
            { title: "Primary user self-activates from the email", where: "/public/activation/activate.do", detail: "The activation email goes to the new UCD's primary user.", sources: [ask("CompanyAccountController.java")] },
            { title: "BO edits or changes status", where: "BO › Manage Company Accounts › edit; /view/account/company/status.do", detail: "Sensitive module flags (BMK, OTH, eLKM, eVOC, SSM) are silently reverted unless the editor is on the super-admin whitelist. Duplicate ROC and login checks run.", sources: [ask("CompanyAccountController.java")] },
          ],
        },
      ],
      affects: [
        { text: "Prod code: company and user changes take effect at once for login, transaction eligibility and permission checks across STMS, eSTM, APT, Dereg, BMK, OTH, eLKM, eVOC, Insurance and SSM, because all of them read the company account record.", sources: [ask("CompanyAccountController.java; UserAccountController.java")] },
        { text: "Prod code: there is no standalone Association Payment screen in eauto core. Association is a field on the company account (CompanyAccount.association, UcdGroup.ASSOCIATION) and appears as an Association or Association Fee column in RHB Payment Transaction, the Payment Invoice export and the SST reports for STMS, APT, BMK, OTH and JomCheck. Those values reach the e-Invoice pipeline with the other fee lines.", sources: [ask("GstPaymentReport.java; PaymentInvoiceController.java")] },
        { text: "Transaction Restriction = Yes: the UCD sees Notice popup You are currently restricted from performing transactions. Please contact eAuto at 03-27798899. when starting or resubmitting STMS, eSTM, APT, UCD to UCD, BMK, Insurance (Get Free Quote) or JomCheck. Wording is creating transactions on all but STMS. Steps inside an already open transaction carry on.", sources: [ts("EAINT-9044"), M_BR] },
        { text: "Permission ticks decide which UCD tiles and steps the company gets (eSTM layers, Insurance, BMK, Transfer History, eLKM, eVOC).", sources: [ts("EAINT-9233")] },
        { text: "SSM bypass matrix (EAINT-8802): user Bypass ticked = no SSM purchase and 3 documents; company SSM ticked and user bypass not ticked = must buy SSM and 1 document; neither ticked = no purchase and 3 documents.", sources: [ts("EAINT-8802")] },
        { text: "Bank/Credit checkboxes drive JomCheck sharing (EAINT-10937) and Service Portal login.", sources: [ts("EAINT-11175")] },
        { text: "Company Account Audit Log and the CSV export (columns: Decision Maker between State and UCD Vehicle Type; Showroom between e-Invoice PIC Email and Director Name; empty values shown as -).", sources: [M_BR] },
        { text: "A UCD onboarding application is rejected if its Company ROC, New Company ROC or TIN belongs to another company.", sources: [M_CL, mine("knowledge/flow-ucd-onboarding.md")] },
      ],
      cronjobs: [],
      roles: [
        { text: "BO users with Manage Company Accounts access. Hub Admin runs the checker.", sources: [ts("EAINT-9044"), M_CL] },
        { text: "Bank/Credit checkboxes can be edited only by kmcheah, jasons, eautonurul, mfared, nikmuhamad, eautokelvin, eautosoyeng, eautozara, mfizni.", sources: [ts("EAINT-11175 TS04-TS13")] },
        { text: "Prod code: Manage Company Accounts and most Account Management screens need BO role Admin or HubAdmin. Manage Backoffice User Accounts is HubAdmin only. Bank/Credit company user screens also need the named whitelist AuthorizedUserList.list1 or HubAdmin. Nothing here is reachable from UCD, AATF or the public Service Portal.", sources: [ask("menu.jsp:1-80, 690-825; UserAccountController.java")] },
      ],
      afterCompletion: [
        { text: "Company account record and audit log entry. Company status Activated plus RHB Account Number ticked is needed before payments (EAINT-8668).", sources: [M_BR, ts("EAINT-8668 TS1")] },
      ],
      rules: [
        { text: "Proforma Invoice payment slip (EAINT-8538): optional, up to 5 MB, pdf, jpeg or png, max 5 files, remarks up to 2,000 characters. Message Sure to update? then Proforma Invoice updated successfully. Finance view only shows No payment slip found.", sources: [M_BR] },
        { text: "Decision Maker Name special characters differ between UCD company (EAINT-8644) and AATF/PBT/Director (only ' / . , : - @).", unconfirmed: true, sources: [M_BR] },
        { text: "Statuses (prod code). Company account: New → Verified → Activated → Inactivated, Rejected or Terminated (CompanyStatus; changed at /view/account/company/status.do). BO and credit user account: DataStatus Active or Inactive, default Active with UserRole Normal; roles are Admin, HubAdmin, Normal, Probation. BO can reset a user's password from the view page. Creating a user is not a flow with steps. No scheduled job exists for company or user management.", sources: [ask("CompanyStatus.java; UserRole.java; UserAccountController.java")] },
      ],
      scopeToCheck: [
        { text: "Each field validation and its error text.", sources: [ts("EAINT-8774")] },
        { text: "CSV column positions and the audit log entry on export.", sources: [M_BR] },
        { text: "Audit log wording and that it never lands under another company.", sources: [ts("EAINT-6762")] },
        { text: "Default permission ticks on create, and that a manual untick persists.", sources: [ts("EAINT-9233")] },
        { text: "Transaction Restriction: popup on each module entry, create vs resubmit vs bulk, mid-flow, Yes to No.", sources: [ts("EAINT-9044")] },
        { text: "SSM bypass matrix per user type and company type.", sources: [ts("EAINT-8802")] },
        { text: "Search and filter on Company Account Listing and AATF/PBT Account Listing.", sources: [ts("EAINT-8781")] },
        { text: "Check the UCD side (popup, tiles, steps) after any BO permission change.", sources: [ts("EAINT-9044")] },
      ],
      tickets: [
        { key: "EAINT-9044", what: "Transaction Restriction setting (popup defect EAINT-10219).", state: "latest" },
        { key: "EAINT-9233", what: "Default ticked permissions for a new company.", state: "latest" },
        { key: "EAINT-8802", what: "Bypass Purchase SSM at user level plus company level SSM permission.", state: "latest" },
        { key: "EAINT-8526 / 8532", what: "SSM Hybrid Model: user with SSM permission needs 1 document.", state: "legacy", supersededBy: "EAINT-8802" },
        { key: "EAINT-8774", what: "Company field validation.", state: "latest" },
        { key: "EAINT-8644 / 8645", what: "Decision Maker and Showroom fields (AATF versions EAINT-8773 and 8742).", state: "latest" },
        { key: "EAINT-8781", what: "Search and filter on company listings.", state: "latest" },
        { key: "EAINT-6762", what: "Company account audit log.", state: "latest" },
        { key: "EAINT-8538", what: "Proforma Invoice payment slip.", state: "latest" },
        { key: "EAINT-11499", what: "MVD Agreement access for CSE.", state: "latest" },
        { key: "EAINT-11175", what: "Three new checkboxes on Bank/Credit company account.", state: "latest" },
        { key: "EAINT-8668", what: "RHB Account Number and company status.", state: "latest" },
      ],
      openQuestions: [
        "Company Account Listing (Limited Features For UCD To UCD) was never captured.",
        "Decision Maker Name allowed characters differ between UCD company and AATF.",
        "EAINT-8802 is treated as the current SSM rule and EAINT-8526 as legacy. Confirm with the team.",
      ],
    },
    {
      id: "company-details-checker",
      name: "Company Details Checker (is the ROC or TIN still free?)",
      summary:
        "A dashboard tool for QA. Before an onboarding run, it checks that a Company ROC, New Company ROC and TIN do not already belong to another company in BO. It only searches. It creates nothing.",
      portals: ["Back Office (Hub Admin)", "Dashboard /eauto/company-details-checker"],
      triggers: [
        {
          id: "checker-run",
          name: "Search the company listing, one field at a time",
          entry: "BO Home › Account Management › Manage Company Accounts (/<env>/view/account/company). The dashboard tool drives the same page.",
          sources: [M_CL],
          steps: [
            {
              title: "Log in as Hub Admin and open the listing",
              where: "/<env>/view/account/company (form#search-form, titled Company Account Listing)",
              detail: "Open the page through the menu, not by a typed URL.",
              sources: [M_CL],
            },
            {
              title: "Search one field only",
              where: "Fields registrationCompany (Company ROC), newRegistrationCompany (New Company ROC), tinNo (TIN Number) › #to-search",
              detail: "Fill ONE field and leave all others blank. Filters are AND only, so each column is searched on its own. Results load by AJAX into #result. Click Reset (a.to-reset) between searches.",
              sources: [M_CL],
            },
            {
              title: "Count the rows",
              where: "#result table tbody tr",
              detail: "Zero rows = the value is free (ABSENT). One or more = used (PRESENT). The triple check passes only if all three are ABSENT. Unset fields show - in the listing.",
              affects: ["Onboarding (supplies Able to use real company data: Old BRN, New BRN, TIN)"],
              branches: [{ when: "Any of the three is PRESENT", then: "Do not use that company. Onboarding rejects account creation if any of the three belongs to another company." }],
              sources: [M_CL],
            },
          ],
        },
      ],
      affects: [
        { text: "Feeds onboarding runs for EAINT-12153 and EAINT-12257. The checker is reused on the 12257 page.", sources: [M_CL, mine("knowledge/flow-ucd-onboarding.md")] },
      ],
      cronjobs: [],
      roles: [
        { text: "Hub Admin BO account (default faizuddinBO1).", sources: [M_CL] },
      ],
      afterCompletion: [
        { text: "Nothing is created. Read-only search. The result is shown on the dashboard.", sources: [M_CL] },
      ],
      rules: [
        { text: "Whether the live SSM check (checkSSM.do) also accepts a row that is free in the Company Listing is not known.", unconfirmed: true, sources: [M_CL] },
      ],
      scopeToCheck: [
        { text: "Duplicate ROC, New ROC and TIN are rejected on account creation.", sources: [M_CL] },
        { text: "Listing search per column. Pagination was not seen.", sources: [M_CL] },
      ],
      tickets: [
        { key: "EAINT-12153", date: "2026-08", what: "Payment channels for Pre-application and Application. The checker was built for it.", state: "latest" },
        { key: "EAINT-12257", date: "2026-10", what: "DuitNow QR for Pre-application and Application. Checker reused.", state: "latest" },
      ],
      openQuestions: ["Does checkSSM.do (live SSM) accept a row that is free in the Company Listing?"],
    },
    {
      id: "association-payment-listing",
      name: "Association Payment Listing (EAINT-12028, new module)",
      summary:
        "Each month the system builds a row for the month before. A Drafter, then a Reviewer, then an Approver approve it in that order. When all three approve, Finance Payment Request PDFs for FMC and MMSDA can be downloaded. The ticket is ON HOLD since 2026-10-15 and has no test environment.",
      portals: ["Back Office (Reports menu)", "eauto-cron", "Report PDFs"],
      triggers: [
        {
          id: "ap-menu",
          name: "Reports menu item",
          entry: "BO Home › Reports › Association Payment Listing (new item with green NEW badge) › Summary page",
          summary: "No other entry point: no deep link and no email.",
          sources: [M_AP, MIRO_AP],
          steps: [
            {
              title: "Open the Summary page and pick a year",
              where: "Association Payment Listing › #sel-year › Search",
              detail: "Year from 2026 onward (REQ-002). Table #tbl-summary columns: #, Month, Car Transactions, Cars (RM), Motorcycle Transactions, Motorcycles (RM), Drafter Status, Reviewer Status, Approver Status, Payment Date, Action (View »). Footer reads YEAR TO DATE (Jan–Jun) or FULL YEAR TOTAL. A month with no data shows No data only in the Drafter Status cell. Other cells show -.",
              sources: [M_AP, MIRO_AP],
            },
            {
              title: "Open a month",
              where: "Action › View »",
              detail: "Details page: workflow bar (role tag, three status pills Pending, Approved, KIV or Review Again, Finance Payment Date, buttons, note), payment-request bar, Vehicle Breakdown by State table (16 states plus TOTAL; Cars RM = count x RM1 FMC; Motorcycles RM = count x RM2 MMSDA) and an Audit Log (Date/Time, Role, Action/Status, Remarks).",
              sources: [M_AP],
            },
            {
              title: "Drafter acts",
              where: "Details › [KIV] or [Approve]",
              detail: "Allowed when Drafter status is Pending, Review Again or KIV. KIV does not lock the Drafter out. The first ever approval asks for a signature (Sign to Approve, canvas, Clear / Cancel / Save & Approve). The signature is reused after that. Approve gives Drafter Approved, Reviewer Pending, Approver Pending.",
              sources: [M_AP, MIRO_AP],
            },
            {
              title: "Reviewer acts",
              where: "Details › [Approve] or [Reject]",
              detail: "Only when Drafter is Approved. Reject opens Reviewer - Reject Remarks (remarks required, recorded in the audit log). After Submit Reject: Drafter Review Again, Reviewer Pending, Approver Pending.",
              sources: [M_AP, MIRO_AP],
            },
            {
              title: "Approver acts and sets the payment date",
              where: "Details › [Approve] or [Reject]",
              detail: "Only when Reviewer is Approved. Reject gives Reviewer Review Again, Approver Pending. Approve opens the Finance Payment Date modal (#pay-date, picker only, future date only: Payment date must be a future date.). After approval all three show Approved.",
              sources: [M_AP, MIRO_AP],
            },
            {
              title: "Download the Payment Requests",
              where: "Details › FMC Payment Request / MMSDA Payment Request",
              detail: "Available once all three have approved. File name Payment Requisition_<FMC|MMSDA>_<Month> <Year>.pdf. A second download returns the same stored file. Before approval a pending note shows (REQ-016). Back to summary returns to the listing.",
              affects: ["Finance (PDF is sent outside this module)"],
              sources: [M_AP, MIRO_AP],
            },
          ],
        },
        {
          id: "ap-month-close",
          name: "Month-close job (system)",
          entry: "eauto-cron on the 1st of each month at 00:05. QA can trigger it by hand.",
          sources: [M_AP, MIRO_AP],
          steps: [
            {
              title: "Job closes the month and freezes the numbers",
              where: "eauto-cron › association-payment-month-close",
              detail:
                "Creates the row for the previous month and freezes approved count x rate into a snapshot. Months show - until closed. QA manual trigger: GET {eauto-cron}/eautocron/sys/manual/association-payment-month-close/{year}/{month}. Machine path: POST /ext/association/{year}/{month}/close with X-API-KEY.",
              branches: [
                { when: "Closed again", then: "200 SKIPPED_ALREADY_CLOSED." },
                { when: "Month not fully approved", then: "409 SKIPPED_NOT_APPROVED." },
              ],
              sources: [M_AP],
            },
          ],
        },
      ],
      affects: [
        { text: "Finance receives the Payment Request PDFs (outside scope). PDFs are archived in MinIO object storage.", sources: [M_AP] },
        { text: "Cross-check against the core Transaction Summary Report by State.", sources: [M_AP] },
        { text: "Associations covered: FMC, MMSDA, and JomCheck as an association in the ticket description. A JomCheck payment listing is outside Phase 1.", sources: [jira("EAINT-12028"), M_AP] },
      ],
      cronjobs: [
        {
          name: "association-payment-month-close",
          schedule: "00:05 on the 1st of every month (eauto-cron)",
          does: "System creates a new row for the previous month and freezes its figures.",
          sources: [M_AP, MIRO_AP],
        },
      ],
      roles: [
        {
          text: "Role is taken from the login ID (SRD REQ-003). Drafter: mfared and eautozara. Reviewer: eautonurul. Approver: kmcheah. mfizni holds all three. A user with no role sees the Reports link but the module returns 403. The signature is kept per person.",
          sources: [M_AP],
          alt: [
            { text: "Any BackOffice user with module access, with action roles Drafter, Reviewer and Approver. Signature kept once per role and reused.", sources: [MIRO_AP], note: "Miro board wording. Not tied to login IDs." },
            { text: "Roles in the Jira ticket description: Ops (approval line) and Finance.", sources: [jira("EAINT-12028 description row 5")], note: "Early ticket wording." },
          ],
        },
        { text: "Download is not limited by role once fully approved (inferred from a mockup comment).", unconfirmed: true, sources: [M_AP] },
        { text: "The module is reached through an SSO hand-off from core eauto to the eauto-backoffice service (3 services).", sources: [M_AP] },
      ],
      afterCompletion: [
        { text: "Archived PDFs, audit log, and the Approved row. No money moves in this module.", sources: [M_AP] },
      ],
      rules: [
        { text: "Figures count approved and PAID STMS, eSTM and APT transactions by JPJ Approved Date, grouped by the dealer's registered state (not the plate state). CAR and COMM_CAR = RM1.00 each (FMC). BIKE and COMM_BIKE = RM2.00 each (MMSDA).", sources: [M_AP, jira("EAINT-12028 SRD v1.1")] },
        { text: "Order is enforced on the server: Drafter, then Reviewer, then Approver. Otherwise 403 or 409.", sources: [M_AP] },
        { text: "A KIV month has no un-KIV button. This is a deferred item (L2) and needs a business decision.", sources: [M_AP] },
        { text: "Listing status values: Drafter Pending, Approved, KIV, Review Again, No Data. Reviewer and Approver: Pending, Approved, -.", sources: [MIRO_AP] },
      ],
      scopeToCheck: [
        { text: "One test per requirement REQ-001 to REQ-019, priority P1 first: REQ-003, 004, 008, 009, 013, 014, 016, 017, 018, 019.", sources: [M_AP] },
        { text: "Each reject path and the Review Again status chain.", sources: [MIRO_AP, M_AP] },
        { text: "Signature popup on the first approval only.", sources: [MIRO_AP] },
        { text: "Payment date: future only.", sources: [M_AP] },
        { text: "PDF names and identical second download.", sources: [M_AP] },
        { text: "Month-close: manual trigger, repeat close, month not approved.", sources: [M_AP] },
        { text: "Security: replay of the SSO hand-off URL (expect 401 Token already used), cross-app logout, idle timeout, cross-module role confusion, open redirect on session expiry or logout, double submit from two tabs (409).", sources: [M_AP] },
        { text: "Car and motorcycle counts tie out to the Transaction Summary Report by State.", sources: [M_AP] },
      ],
      tickets: [
        { key: "EAINT-12028", date: "2026-10", what: "New BO module Association Payment Listing. ON HOLD since 2026-10-15 (no longer going out end of October). Dev MR !1 had a BLOCK review verdict on 2026-09-04. Dev boxes only. No environment assigned.", state: "latest" },
      ],
      openQuestions: [
        "ON HOLD per May Chin DM 2026-10-15 and Mei Jia 2026-10-14. No deployment date.",
        "Who may act as Drafter, Reviewer and Approver: login IDs (SRD) vs any BO user with access (Miro) vs Ops and Finance (Jira description).",
        "Signature kept per person (dev guide) or per role (Miro).",
        "State row order in the mockup is alphabetical, in the SRD numeric 01 to 16.",
        "Mockup Pay to table is empty. SRD fixed values are used.",
      ],
    },
    {
      id: "reconciliation",
      name: "Reconciliation (eAuto vs RHB statement)",
      summary:
        "Finance uploads the RHB transaction file. The system compares it with eAuto payments and shows only the differences in the Reconciliation Listing. A Summary tab shows totals. Differences can mean a refund is needed.",
      portals: ["Back Office (JPJ Reports)", "Synology", "RHB file", "JPJ Hasil", "Email"],
      triggers: [
        {
          id: "recon-auto",
          name: "Automatic run after the RHB file is uploaded",
          entry: "System. Finance uploads the RHB file to Synology. Runs at 10:00 and 12:00.",
          sources: [ts("RECONSL_SS_TS2"), AZ_RECON, M_BR],
          steps: [
            {
              title: "Payment goes through and JPJ final submission is made",
              where: "Any module (STMS, APT, eSTM, SSM, Dereg, eDereg Pre-Checking, BMK, TH, eLKM, eVOC, JomCheck, Insurance, Wholesale STMS)",
              detail: "The payment is the eAuto side of the match.",
              sources: [ts("RECONLS_TS1"), AZ_RECON],
            },
            {
              title: "Finance uploads the RHB file to Synology",
              where: "Synology",
              detail: "Finance uploads after 10am but before 12pm. A file uploaded after the 10am run is picked up at 12pm. One RHB file that spans many dates is split per date and per month.",
              sources: [ts("RECONSL_SS_TS2"), M_BR, MIRO_SC],
            },
            {
              title: "Auto-reconciliation compares eAuto and RHB",
              where: "System job",
              detail: "RHB statement refs are {TransactionNo}-{VehicleNo} and {TransactionNo}/{code} (STMS, JCK, OTH, DPC). Differences go to the Reconciliation Listing. Matches show only in the Summary.",
              affects: ["Reconciliation Listing and Summary", "Finance email", "JPJ Hasil"],
              sources: [M_BR, AZ_RECON],
            },
          ],
        },
        {
          id: "recon-listing",
          name: "Reconciliation Summary Listing page",
          entry: "BO › JPJ Reports › eAuto Reconciliation Summary Listing (tabs Listing, Reconciliation, Summary)",
          sources: [ts("RECON_ROLEPERM_TS1"), M_SHELL, AZ_RECON],
          steps: [
            {
              title: "Search by Payment Date",
              where: "Reconciliation Summary Listing › Payment Date From/To › Search",
              detail: "Both dates are mandatory (Please select both Payment Date (From) and Payment Date (To).). From fills To with the last day of the month. Future dates are off. Transaction Type is a multi-select with 13 options.",
              sources: [M_BR, AZ_RECON],
              branches: [{ when: "A date has no data", then: "No records found." }],
            },
            {
              title: "Read the outcome rows",
              where: "Listing and Summary",
              detail:
                "eAuto < RHB (not found in eAuto): Listing Yes, Summary Yes, Refund Required Yes, and Finance gets email Refund Review Required - <date> from imonitor@eauto.my to finance@eauto.my. eAuto > RHB: Listing Yes, Summary Yes, Refund Required No. eAuto = RHB: not in Listing, in Summary. Double payment (JPJ fail REV000001E, Reset Payment, paid twice) needs a refund.",
              affects: ["Finance refund review"],
              sources: [ts("RECON rules"), AZ_RECON],
            },
            {
              title: "Use the Reconciliation tab (manual)",
              where: "Reconciliation tab",
              detail: "Download the bank statement template, upload it, click Reconcile Now. A Perbezaan section shows differences. A manual trigger exists.",
              sources: [ts("JPJRBOREG_TS2"), ts("SPS_RECONLS_TS01")],
            },
          ],
        },
        {
          id: "recon-manual-v2",
          name: "Manual reconciliation V2 (prod code)",
          entry: "BO › JPJ Reports › eAuto Reconciliation Summary Report (/view/jpj/report/reconcile-v2/eauto-report.jsp)",
          summary: "A manual upload path that the shown flow does not describe. The menu item is visible only to a hardcoded list of named BO or JPJ accounts.",
          sources: [ask("JpjReconciliationV2Controller.java")],
          steps: [
            { title: "BO uploads the bank statement Excel for a date", detail: "A record is created with ReconciliationSummaryStatus Processing and a background thread matches transactions.", sources: [ask("JpjReconciliationV2Controller.java")] },
            { title: "BO generates the mismatch summary and edits remarks", detail: "BO can edit 'temporary transfer' and 'permanent transfer' remarks.", sources: [ask("JpjReconciliationV2Controller.java")] },
            { title: "BO exports PDF, uploads to the JPJ Hasil portal or deletes", detail: "Every JPJ-side view or download is written to a JPJ audit log. A deleted summary ends as Deleted.", affects: ["JPJ Hasil portal"], sources: [ask("JpjReconciliationV2Controller.java")] },
          ],
        },
      ],
      affects: [
        { text: "Prod code: reconciliation reads STMS, APT, eSTM and eHAK payment and JPJ enquiry data to find mismatches against the bank statement. Summaries are kept as downloadable PDF reports.", sources: [ask("JpjReconciliationV2Controller.java")] },
        { text: "A discrepancy date goes to the Reconciliation Listing and is NOT auto-submitted to JPJ Hasil. Other dates reconcile and go on.", sources: [M_BR] },
        { text: "Service Hub (SI and BDP) rows are in the reconciliation too (EAINT-12018). Weekend and public holiday payments reconcile by payment date.", sources: [jira("EAINT-12018", "2026-07"), MIRO_SC] },
        { text: "LKM Refund added to the listing (EAINT-12407).", sources: [jira("EAINT-12407", "2026-10"), AZ_RECON] },
        { text: "JomCheck, SSM and Insurance approved two days after payment are listed under Approved Date (EAINT-12113): two mismatch entries with the same ref no.", sources: [M_BR, azfar("cr/EAINT-12113/LEDGER.md")] },
        { text: "A resubmitted and approved mismatch pair is hidden after the match (EAINT-12055), same or cross month, retroactive, and stays hidden after an RHB re-upload. Still visible: JPJ Final Submission FAILED but RHB paid, or APPROVED but RHB not received. Modules that cannot be resubmitted (Dereg, APT, Wholesale STMS final submission) keep their mismatch.", sources: [M_BR, azfar("cr/EAINT-12055/LEDGER.md")] },
        { text: "JPJ Hasil portal auto-upload and Finance email.", sources: [ts("RECONLS_TS1")] },
      ],
      cronjobs: [
        {
          name: "Auto-reconciliation",
          schedule: "10:00 and 12:00 daily (12:00 picks up files uploaded after 10:00)",
          does: "Compares RHB file with eAuto payments and writes the Listing, Summary and Finance email.",
          sources: [ts("RECONSL_SS_TS2"), M_BR],
        },
        {
          name: "Snapshot (EAINT-12407)",
          schedule: "02:00 snapshot, then 10:00 and 12:00 compare",
          does: "Azfar records a 02:00 snapshot step before the compares.",
          sources: [AZ_RECON],
          unconfirmed: true,
        },
        {
          name: "ReconciliationTask (prod code, legacy)",
          schedule: "0 15 23 * * ? (daily 23:15), read from the eauto-dev edition scheduler config, not the production schedule",
          does: "Legacy automatic reconciliation job (com.myetrade.eauto.controller.stms.reconcile.ReconciliationTask). A newer Consolidated Reconciliation pipeline exists across eauto and eauto-cron but was not read in this pass. The production schedule was not shown.",
          sources: [ask("scheduler.spring.xml:699-707 (dev edition); ReconciliationTask")],
          unconfirmed: true,
        },
        {
          name: "JPJ Monthly Report (EAINT-639)",
          schedule: "1st of the month, 3:00 AM",
          does: "Emails the report link (permission-gated, expiring).",
          sources: [M_BR],
        },
      ],
      roles: [
        { text: "Ops: jasons, mfared, nikmuhamad, mfizni (and eautokelvin per Azfar). Finance: eautoaccount. Insurance user (EAINT-11887, eautoshamini): sees Insurance type only and the Summary section is hidden. Hub Admin with permission sees all.", sources: [ts("RECON_ROLEPERM_TS1"), AZ_RECON] },
        { text: "Without permission, the module is hidden, including the direct URL. Other BO roles (admin, probation) cannot see it.", sources: [M_BR, ts("RECON_ROLEPERM_TS1")] },
        { text: "Prod code: Reconciliation V2 and most JPJ Reports are gated by the named whitelist list_jpj_reconciliate_v2_for_backoffice plus role Admin or HubAdmin. An ordinary BO admin not on the list cannot see the menu item. A separate insurance-only whitelist sees a cut-down version.", sources: [ask("AuthorizedUserList.java:20; menu.jsp:690-825")] },
      ],
      afterCompletion: [
        { text: "Reconciliation Listing (differences only), Summary, Finance email and JPJ Hasil.", sources: [ts("RECONLS_TS1")] },
      ],
      rules: [
        { text: "Amounts and modules reconciled: one row per module and outcome across STMS, APT, eSTM, SSM, Dereg, eDereg Pre-Checking, BMK, TH, eLKM, eVOC, JomCheck, Insurance and Wholesale-STMS.", sources: [AZ_RECON, azfar("cr/EAINT-12055/LEDGER.md")] },
        { text: "No. Resit JPJ in JPJ Reports and No. Resit in JPJ Hasil (EAINT-9642).", sources: [M_BR] },
        { text: "Statuses (prod code, ReconciliationSummaryStatus): Processing → Completed or Failed, with Deleted as a manual end state.", sources: [ask("ReconciliationSummaryStatus.java")] },
        { text: "Kod Hasil: H0272423 (STMS, eSTM, APT), H0272404 (BMK, TH, eDereg Pre-Checking), H0171105 (eLKM), - for non-JPJ.", sources: [AZ_RECON] },
      ],
      scopeToCheck: [
        { text: "Per module amount tie-out, including after fee changes.", sources: [M_BR] },
        { text: "Date filter rules and the No records found case.", sources: [M_BR] },
        { text: "Each outcome: eAuto < RHB, eAuto > RHB, eAuto = RHB, double payment.", sources: [ts("RECONLS_TS1")] },
        { text: "Resubmission exclusion rules (12055) and Approved Date rule (12113).", sources: [M_BR] },
        { text: "Role visibility, including Insurance user and the direct URL.", sources: [ts("RECON_ROLEPERM_TS1")] },
        { text: "Refund email subject, sender and recipient.", sources: [AZ_RECON] },
        { text: "The branch is frozen during reconciliation tests: no changes or transactions on it.", sources: [mine("knowledge/environments-history.md §5")] },
      ],
      tickets: [
        { key: "EAINT-10168", date: "2026-06", what: "eAuto Reconciliation Summary Report. 88 TS. Live S30.9-20260630.", state: "latest" },
        { key: "EAINT-11883", what: "Multi-date RHB file.", state: "latest" },
        { key: "EAINT-11887", what: "Insurance user permission.", state: "latest" },
        { key: "EAINT-12055", date: "2026-08", what: "Exclude successful resubmission pairs (S32.7-20260817).", state: "latest" },
        { key: "EAINT-12113", date: "2026-08", what: "Non-JPJ modules with different payment and approval dates (S32.7-20260817).", state: "latest" },
        { key: "EAINT-12407", date: "2026-10", what: "LKM Refund added to the listing. Done 2026-10-15.", state: "latest" },
        { key: "EAINT-12018", date: "2026-07", what: "Reconciliation Summary Listing for Service Hub.", state: "latest" },
        { key: "EAINT-12418", what: "Follow-up listed in Azfar notes.", state: "latest" },
      ],
      openQuestions: [
        "Does the Insurance type include Insurance Cancellation? Is a paid but Pending Insurance Cancellation a daily mismatch until COMPLETE? (10168/11887 vs 12022 section 2.2.14 #3).",
        "Amounts in the reconciliation script predate the STMS and APT fee changes.",
        "02:00 snapshot step comes only from Azfar (EAINT-12407). The TS sources show 10:00 and 12:00 only.",
        "Reconciliation was studied as shallow. Only TS-based facts exist for most rules.",
      ],
    },
    {
      id: "jpj-reports-and-xml-logs",
      name: "JPJ reports and JPJ XML logs",
      summary:
        "Hub Admin can read every request and response sent to JPJ from the JPJ XML Log pages. Each log has one page per module. JPJ Reports hold the monthly and Hasil reports. The logs prove what eAuto sent and what JPJ answered.",
      portals: ["Back Office (Settings (Hub Admin), JPJ Reports)", "JPJ"],
      triggers: [
        {
          id: "xml-log",
          name: "JPJ XML Log pages",
          entry: "BO Home › Settings (Hub Admin) › JPJ XML Log (APT / STMS / ESTM / Deregistration / eDereg Pre-Checking / BMK) and SSM XML Log",
          summary: "Links: /view/apt/jpj/log, /view/stms/jpj/log, /view/estm/jpj/log, /view/dereg/jpj/log, /view/dereg/precheck/jpj/log/main.do, /view/bmk/jpj/log, /view/ssm/xml-log. Only the Dereg and Pre-Checking pages were captured.",
          sources: [M_XML, mine("knowledge/flow-edereg.md §45.1, §46")],
          steps: [
            {
              title: "Open the log page and wait",
              where: "Settings (Hub Admin) › JPJ XML Log › <module>",
              detail: "Wait about 2 seconds. Typing a vehicle number too early flipped the heading to DEREG on the pre-check log (reported 2026-09-02, fix not confirmed).",
              sources: [mine("knowledge/flow-edereg.md §46.1")],
            },
            {
              title: "Choose a search type and search",
              where: "Radio Vehicle No. (default) or Transaction Ref No. (duplicate id #type, target by value) › SEARCH Now",
              detail: "Search by the human reference (for example PC68001153 or D680000566), not by the uuid.",
              sources: [M_XML, mine("knowledge/flow-edereg.md §46.1")],
            },
            {
              title: "Read the rows",
              where: "Result table, newest first",
              detail:
                "Columns: #, Vehicle, Transaction No., [Search By on Pre-Checking], Type (Enquiry, SecondEnquiry, Submission, PrecheckEnquiry), Submitted At, Request Data, Responded At, Response Data. One completed dereg wrote 4 rows (Submission, SecondEnquiry, Enquiry, Enquiry).",
              sources: [M_XML, mine("knowledge/flow-edereg.md §46.2-46.3")],
            },
            {
              title: "Split the data and check it",
              where: "Request Data and Response Data text",
              detail:
                "Split by ~ and read against the JPJ XML Log - Code Splitter workbook (17 sheets: eSTM, STMS, TH, BMK, LKM refund, eDereg Pre-Checking, APT expiry). The pre-check request has 11 fields: vehicleNo, eftDateTime, receiptNo, eftReference, agCode 72404, jpjRevenueCode 2910002, paymentMode E, eftAmount 5.00, ssm/roc, companyEmail, emailCc. The response has 12 fields starting with the response code.",
              sources: [M_XML, mine("knowledge/flow-edereg.md §46.3")],
            },
          ],
        },
        {
          id: "jpj-reports-menu",
          name: "JPJ Reports menu",
          entry: "BO Home › JPJ Reports",
          sources: [M_SHELL, AZ_BO],
          steps: [
            {
              title: "Open a JPJ report",
              where: "JPJ Reports › eAuto Reconciliation Summary Report, STMS/APT/eSTM Transaction Listing, BMK/HTM/eLKM Transaction Listing, eDereg Pre-Checking listing, JPJ Reconciliation Report (HASIL), JPJ eSTM Report (HASIL)",
              detail: "Each page is a listing with a Payment Date style filter. Only the reconciliation pages have flow documents.",
              affects: ["Reconciliation"],
              sources: [M_SHELL, AZ_BO],
            },
          ],
        },
      ],
      affects: [
        { text: "Evidence of the JPJ call for each module: STMS, eSTM, APT, BMK, eDereg Pre-Checking, Deregistration, SSM.", sources: [M_XML] },
        { text: "Prod code: the log is read-only. Nothing downstream changes by viewing it. It reads the JPJ communication logs written by each module's JPJ handlers (STMS, APT, eSTM, Dereg, eDereg Pre-Check, BMK, LKM Refund, SSM). The BO enters a transaction number, the DAO lists the matching SOAP calls newest first, and one entry shows the raw request and response XML. There is no status field.", sources: [ask("backoffice-administration.md (JPJ XML Log viewer pattern)")] },
        { text: "JPJ request XML for eSTM ends with LKM Indicator, LKM Duration and eVOC Indicator. Examples of endings: ~N~0~N, ~Y~6~Y, ~Y~12~N, ~N~0~Y.", sources: [ts("EAINT-3677 TS02-TS07")] },
      ],
      cronjobs: [],
      roles: [
        { text: "BO Hub Admin, from the Settings (Hub Admin) menu. This is a separate login from UCD and AATF.", sources: [M_XML] },
        { text: "Prod code: the Settings (Hub Admin) section, and so the XML log links, is visible to role HubAdmin, or the named whitelist list7, or a small hardcoded account list. The BMK variant has an extra exclusion list for some HubAdmin accounts. BMK and LKM Refund variants and a separate SSM XML Log link exist next to the five shown pages.", sources: [ask("menu.jsp:870-930")] },
        { text: "JPJ Reports is Super Admin only per workbook 10038, but the Hub Admin capture shows some of it (see menu and roles flow).", unconfirmed: true, sources: [AZ_ROLES, M_SHELL] },
      ],
      afterCompletion: [],
      rules: [
        { text: "Constants: AG Code 72404, Payment Mode E, copy address receipt@eauto.my. Revenue Code 2910001 (eSTM, BMK), 2910002 (eDereg Pre-Checking), 2910030 (TH). eSTM region codes: 10 Semenanjung, 11 Langkawi, 20 Sabah, 21 Labuan, 30 Sarawak. eSTM submission transaction code VEL04514.", sources: [M_XML] },
        { text: "The JPJ receipt email goes to systemtest@eauto.my while a branch is connected to JPJ staging, so Mailtrap will not show it.", sources: [mine("Teams Main 2026-09-17")] },
      ],
      scopeToCheck: [
        { text: "A row is written for every JPJ call.", sources: [M_XML] },
        { text: "Response code equals the code set in eSIM for that vehicle prefix.", sources: [M_XML, mine("knowledge/esim.md")] },
        { text: "Request fields are correct (constants, amount, ROC, email).", sources: [M_XML] },
        { text: "Row count per flow, for example 4 rows for one completed dereg.", sources: [mine("knowledge/flow-edereg.md §46.2")] },
      ],
      tickets: [
        { key: "EAINT-9306", date: "2026-08", what: "eDereg Pre-Checking. Case OF_TS5 checks the JPJ XML Log.", state: "latest" },
        { key: "EAINT-3677", what: "BO JPJ Enquiry LKM and eVOC fields in the request XML.", state: "latest" },
        { key: "EAINT-8646", what: "SSM XML Log page.", state: "latest" },
      ],
      openQuestions: [
        "Dereg log field names are not confirmed. Response position 12 is not confirmed.",
        "Is the search AJAX? Not confirmed.",
        "The other five log pages (APT, STMS, ESTM, BMK, SSM) were never captured.",
        "Live rows carry an extra 12th trailing field, and the test cc address differs from the workbook.",
      ],
    },
    {
      id: "credit-note",
      name: "Credit Note (from a Proforma Invoice)",
      summary:
        "Ops raises a Credit Note from a paid Proforma Invoice. Finance reviews it, approves, generates the document and submits it to LHDN. The source is the Miro board for EAINT-8700. Its test tables were not readable, so this flow comes from the mind maps and text only.",
      portals: ["Back Office (Proforma Invoice / e-Invoice)", "LHDN MyInvois"],
      triggers: [
        {
          id: "cn-raise",
          name: "Raise Credit Note on the PFI details page",
          entry: "BO › Proforma Invoice / e-Invoice › Proforma Invoice details page (Payment Status = OK and e-Invoice Status = OK) › Raise Credit Note",
          sources: [MIRO_CN],
          steps: [
            {
              title: "Raise the Credit Note",
              where: "PFI details › Raise Credit Note popup",
              detail: "Popup: Are you sure you want to raise Credit Note [Yes] [No]. Ops gives a reason (mandatory, 1 to 100 characters). Status = Draft.",
              sources: [MIRO_CN],
            },
            {
              title: "Edit the Credit Note",
              where: "Credit Note Details page (Ops)",
              detail:
                "Header Credit Note: EA-CN-MMYY-XXXXX with buttons Original e-Invoice, Preview, Save, Cancel Request, Submit for Approval. Shows Module Proforma Invoice, P. Invoice No. EA-PI-MMYY-XXXXX, Credit Note Status, Submission Date, Validation Date, LHDN Response Status, Company Details, Invoice Breakdown (filled from the PFI) and Supporting Documents. Unit Price: numbers, dot allowed, 3 to 10 characters. Quantity 1 to 100. Description optional, max 100. A value above the PFI shows The entered value exceeds the existing Proforma Invoice record. Please try again. Reason list: Correction of errors, Discounts, Incorrect amount delivered, Return of goods/services. Remove deletes a row (keep at least one).",
              sources: [MIRO_CN],
            },
            {
              title: "Save, cancel or submit",
              where: "Credit Note Details › Save / Cancel Request / Submit for Approval",
              detail: "Save is on only when mandatory fields are filled. After Save Ops cannot edit the details. Cancel Request gives Cancelled (from Draft). Submit for Approval asks Are you sure you want to submit Credit Note and gives Pending Approval.",
              sources: [MIRO_CN],
            },
            {
              title: "Finance reviews",
              where: "Credit Note Details (Finance view)",
              detail: "Finance may edit Supporting Documents, Invoice Breakdown and reason. Reject (reason mandatory, 1 to 100) gives Rejected and Ops raises a new Credit Note from the PFI. Approve gives In Progress.",
              sources: [MIRO_CN],
            },
            {
              title: "Generate and submit to LHDN",
              where: "Finance › Generate Credit Note › Submit to LHDN",
              detail: "Messages: Please confirm the details before generating Credit Note., then Are you sure you want to perform LHDN submission. Result: Status Completed with LHDN Status OK, or Status Failed with LHDN Status Failed. The Credit Note button downloads the document.",
              affects: ["MyInvois Portal (LHDN)", "Credit Note Listing"],
              sources: [MIRO_CN],
            },
          ],
        },
        {
          id: "cn-listing",
          name: "Credit Note Listing",
          entry: "BO › Proforma Invoice / e-Invoice › Credit Note Listing",
          sources: [MIRO_CN, M_SHELL],
          steps: [
            {
              title: "Search the listing",
              where: "Credit Note Listing › Search Now / Reset / Export",
              detail:
                "Filters: Credit Note No., Company Name, Issued Date From/To, Module, Credit Note Status, Original e-Invoice UIN, Document Code, LHDN Response Status. Columns: Credit Note No., Module, Issued Date, Created By, Company Name, Amount (RM), Credit Note Status, Document Code, e-Invoice UIN, Credit Note Submission Date, LHDN Response Status, Credit Note Validation Date, Last Updated, Remarks, Action.",
              sources: [MIRO_CN],
            },
          ],
        },
      ],
      affects: [
        { text: "Credit Note Listing, the PFI details page (link back) and the MyInvois Portal (LHDN e-Invoice).", sources: [MIRO_CN] },
      ],
      cronjobs: [],
      roles: [
        { text: "Ops: raise, edit, submit for approval, cancel. Finance: edit, reject, approve, generate, submit to LHDN. The board lists nine BO usernames as the access list (not copied here).", sources: [MIRO_CN] },
      ],
      afterCompletion: [
        { text: "Credit Note Listing with Credit Note Status Completed and LHDN Response Status OK.", sources: [MIRO_CN] },
      ],
      rules: [
        { text: "Status path: Draft → Pending Approval → In Progress → Completed or Failed. Side exits: Cancelled (from Draft) and Rejected (from Pending Approval).", sources: [MIRO_CN] },
        { text: "Supporting documents: PDF, JPEG or PNG, max 5 files, 5 MB each. Messages: Invalid file type. and File size exceeded. Browse Files is off at 5 files.", sources: [MIRO_CN] },
      ],
      scopeToCheck: [
        { text: "Every status move and each button on each role's view.", sources: [MIRO_CN] },
        { text: "Breakdown calculation limits (unit price, quantity, over-PFI error).", sources: [MIRO_CN] },
        { text: "Supporting document limits.", sources: [MIRO_CN] },
        { text: "Concurrent edits (the board has an E2E Concurrent Test Scenarios table, unread).", sources: [MIRO_CN] },
        { text: "LHDN OK and Failed outcomes in MyInvois.", sources: [MIRO_CN] },
        { text: "Different trigger points into the listing (table unread).", sources: [MIRO_CN] },
      ],
      tickets: [
        { key: "EAINT-8700", date: "2026-06", what: "New Credit Note module. Board shared on 2026-06-03. Ticket text not read in the Jira digests.", state: "latest" },
      ],
      openQuestions: [
        "15 Miro test tables were not read, including Different Trigger Points Test Scenarios and E2E Concurrent Test Scenarios.",
        "EAINT-8700 has no Jira digest entry. Dates and current status are not known.",
        "The cronjob list for Credit Note is unknown.",
      ],
    },
    {
      id: "einvoice-revenue-report-jobs",
      name: "Consolidated e-Invoice and Revenue Report jobs (prod code)",
      summary: "Two scheduled jobs in the eauto-einvoice service build the monthly consolidated e-Invoice and the Revenue Report. BO Finance can also download a Revenue Report on demand.",
      portals: ["eauto-einvoice service", "Back Office (Finance)", "LHDN MyInvois"],
      triggers: [
        {
          id: "revenue-report-download",
          name: "BO Finance downloads a Revenue Report",
          entry: "BO › Finance › Revenue Report (finance role only)",
          summary: "On-demand export for a chosen date range. Separate from the scheduled job.",
          sources: [ask("consolidated e-Invoice and Revenue Report answer")],
          steps: [{ title: "Pick a date range and export", where: "BO › Finance › Revenue Report", sources: [ask("consolidated e-Invoice and Revenue Report answer")] }],
        },
      ],
      affects: [
        { text: "Consolidated e-Invoice submission goes to LHDN MyInvois. The Consolidated e-Invoice Report Job only makes a report file, not the invoice.", sources: [ask("eauto-einvoice, 2026-10-20")] },
      ],
      cronjobs: [
        {
          name: "Consolidated e-Invoice Submission Job (eauto-einvoice)",
          schedule: "Monthly. The day and time are set in configuration and were not shown. Each run covers the previous calendar month.",
          does: "Builds and submits the consolidated e-Invoice for the previous month. In production config it is in dry-run mode today: it only logs what it would do and does not create or submit invoices until dry-run is turned off.",
          sources: [ask("eauto-einvoice, 2026-10-20 — Consolidated e-Invoice Submission Job")],
          unconfirmed: true,
        },
        {
          name: "Consolidated e-Invoice Report Job (eauto-einvoice)",
          schedule: "Not shown",
          does: "Produces a report file about the consolidated e-Invoice. Currently turned off in configuration.",
          sources: [ask("eauto-einvoice, 2026-10-20 — Consolidated e-Invoice Report Job")],
          unconfirmed: true,
        },
        {
          name: "Revenue Report Job (eauto-einvoice)",
          schedule: "Two schedules: every Tuesday and Friday, and the 1st of every month. Times of day are config settings and were not shown.",
          does: "Generates the Revenue Report. If the 1st of the month falls on a Tuesday or Friday, the Tuesday/Friday run is skipped that day so the report is not made twice. Enabled today.",
          sources: [ask("eauto-einvoice, 2026-10-20 — Revenue Report Job")],
        },
      ],
      roles: [{ text: "Scheduled jobs run in the backend. The on-demand Revenue Report button is limited to users with the finance role.", sources: [ask("consolidated e-Invoice and Revenue Report answer")] }],
      afterCompletion: [{ text: "Consolidated e-Invoice: submitted to LHDN only when dry-run is off. Revenue Report: a report file for Finance.", sources: [ask("consolidated e-Invoice and Revenue Report answer")] }],
      rules: [
        { text: "Prod config shows dryrun: true for the consolidated e-Invoice submission job. Check this before testing consolidated e-Invoice on production.", sources: [ask("eauto-einvoice, 2026-10-20")], unconfirmed: true },
      ],
      scopeToCheck: [
        { text: "Revenue Report is produced on Tuesday, Friday and the 1st, and only once when the 1st is a Tuesday or Friday.", sources: [ask("Revenue Report Job")] },
        { text: "Consolidated e-Invoice covers the previous calendar month only.", sources: [ask("Consolidated e-Invoice Submission Job")] },
      ],
      tickets: [],
      openQuestions: [
        "On which day of the month does the consolidated e-Invoice job run? The day is a hidden config setting.",
        "Is dry-run for the consolidated e-Invoice job still on in production? Confirm with the dev team.",
      ],
    },
  ],
};
