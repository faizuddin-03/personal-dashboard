import type { Fact, Source, Module, Step } from "../types";

const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref, date });
const mi = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const ji = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string, date?: string): Source => ({ kind: "ts", ref, date });
const ae = (ref: string): Source => ({ kind: "askeauto", ref, date: "2026-10-23" });
const ac = (ref: string): Source => ({ kind: "askeauto", ref: `prod code (eauto 0e21bef3db, eauto-einvoice 87b8142) — ${ref}`, date: "2026-10-23" });

const F = (text: string, sources: Source[], extra: Partial<Fact> = {}): Fact => ({ text, sources, ...extra });
const S = (title: string, sources: Source[], extra: Partial<Step> = {}): Step => ({ title, sources, ...extra });

const UCDP = "knowledge/portals/ucd/portal.md";
const ROLES = "knowledge/_core/roles-and-accounts.md";
const RULES = "knowledge/business-rules-from-test-scenarios.md";
const LEDGER12022 = "cr/EAINT-12022/01-research/study.md";

export const companyProfileEinvoice: Module = {
  id: "company-profile-einvoice",
  name: "Company / Business Profile Update and e-Invoice",
  short: "Profile & e-Invoice",
  portals: ["UCD portal", "Back Office", "AATF portal (payment report)", "LHDN MyInvois (external)"],
  summary:
    "Two linked topics. First, every dealer must update its Company/Business Profile so eAuto has a valid TIN for e-Invoicing. Second, every paid transaction gets an Invoice and, when the TIN is valid, an e-Invoice sent to LHDN. Failed e-Invoices are re-sent by a monthly job once the TIN is fixed.",
  related: ["onboarding", "ucd-portal", "ssm", "backoffice", "cibo"],
  glossary: [
    { term: "TIN", meaning: "Tax Identification Number. A valid TIN is needed for an e-Invoice.", sources: [mi(RULES)] },
    { term: "LHDN / MyInvois", meaning: "The tax authority and its e-Invoice system. eAuto submits e-Invoices to it.", sources: [az("cr/EAINT-7548/LEDGER.md")] },
    { term: "Pre e-Invoice", meaning: "The name of the Company/Business Profile Update flow (done before e-Invoicing starts).", sources: [az(UCDP)] },
    { term: "Consolidated e-Invoice", meaning: "A combined e-Invoice sent later for transactions whose e-Invoice failed (for example an invalid TIN). Created by a monthly cronjob.", sources: [az(LEDGER12022)] },
    { term: "Document Code", meaning: "Invoice number like EA-IV-MMYY-xxxxxxx. It runs in sequence with no skipped numbers.", sources: [az("cr/EAINT-7548/LEDGER.md"), mi(RULES)] },
    { term: "Proforma Invoice", meaning: "An invoice shown before payment is final. Has its own button and e-Invoice.", sources: [mi(RULES)] },
    { term: "Type of Business (profile)", meaning: "ROB, ROC, TLN (Trading Licence) or LLP. It decides which documents Step 2 asks for.", sources: [az("automation/src/ff36/journeys.ts")] },
  ],
  flows: [
    // ---------------------------------------------------------- 1
    {
      id: "profile-update",
      name: "Company / Business Profile Update (3 steps)",
      summary:
        "The main user updates the company profile: details, a Trading Licence or SSM document, then a licence agreement with MyKad and thumbprint. The steps depend on the Type of Business.",
      portals: ["UCD portal"],
      triggers: [
        {
          id: "home-tile",
          name: "Homepage tile COMPANY/BUSINESS PROFILE",
          entry: "UCD homepage › COMPANY/BUSINESS PROFILE (/view/ucd/einvoice/view.do)",
          summary: "Main user only. A sub user cannot open Step 1.",
          steps: [
            S("Open the tile", [az(UCDP), mi("knowledge/flow-ucd-shell.md")], { where: "Homepage › #company-business-profile", detail: "Opens Pre e-Invoice Step 1. For a company that is already updated it shows a read-only summary (SSM Invoice, MVD Agreement, “MyKad/Thumbprint verified on …”).", affects: ["ucd-portal"] }),
            S("Step 1 – Details", [az("automation/src/ff36/journeys.ts")], { where: "Profile › Step 1", detail: "Company details. Fields depend on Type of Business (ROB, ROC, TLN, LLP)." }),
            S("Step 2 – Upload Trading Licence / SSM document", [az("automation/src/ff36/journeys.ts"), ts("EAINT-9247 PE_TS02-TS06")], {
              where: "Profile › Step 2 (#TradingLicense, [Upload & Submit] #to-upload-tl)",
              detail: "Multipart upload to einvoice/trading-license-doc/upload.do. For SSM types the system runs an SSM enquiry first.",
              branches: [
                { when: "SSM enquiry answers anything other than 004", then: "Popup “Purchase SSM Document / The SSM Document is not available for purchase.” OK goes to the homepage. SSM Check = Failed and Tx Status = Failed." },
                { when: "Retry", then: "Company Name and SSM Number fill in. Summary: SSM Document Fee RM15.00 + eAuto Service Fee RM3.00 + Service Tax RM1.44 = RM19.44. Press Agree to Purchase." },
                { when: "Duplicate purchase", then: "Popup “SSM Document for this Company was purchased recently.”" },
              ],
              affects: ["ssm"],
            }),
            S("Step 3 – MVD License Agreement and Thumbprint", [az(ROLES), az("automation/src/ff36/journeys.ts")], {
              where: "Profile › Step 3",
              detail: "The main user reads the MVD agreement and verifies with MyKad and thumbprint.",
              affects: ["platform › MyKad / thumbprint"],
            }),
          ],
          sources: [az(UCDP), az("automation/src/ff36/journeys.ts")],
        },
        {
          id: "update-required-popup",
          name: "“Company/Business Profile Update – UPDATE REQUIRED” popup",
          entry: "UCD homepage popup chain (#dialog-einvoice)",
          steps: [
            S("Popup shows after login until the profile is done", [az(UCDP), mi("knowledge/flow-ucd-shell.md"), ae("Q2")], {
              detail: "Text: “UPDATE REQUIRED … Failure to comply may result on your account with eAuto be suspended”. It sits in the popup order after the profile-updates dialog (order depends on the campaign). The e-Invoice reminder flag reads CompanyAccount.eInvoiceSetupStatus. The popup button leads to the same update flow.",
              affects: ["ucd-portal › startup popup chain"],
            }),
          ],
          sources: [az(UCDP), ae("Q2")],
        },
        {
          id: "top-link",
          name: "Link at the top of the homepage",
          entry: "UCD homepage › Company/Business Profile (top of page)",
          steps: [S("Open the link", [ts("EAINT-9247 E2E_TS01"), ts("EAINT-8169 TS1-TS3")], { detail: "Same flow as the tile. Message wording was changed in EAINT-8169 (e-Invoicing phase 3 notice; deadline moved from 31 May 2025 to 20 June 2025)." })],
          sources: [ts("EAINT-9247"), ts("EAINT-8169")],
        },
        {
          id: "update-now-banner",
          name: "'Update Now' button on the login popup",
          entry: "UCD login/home popup, once per session, dismissible (dialog-einvoice.jsp, dialog-manager.jsp)",
          summary: "Prod code: shows a reminder about the e-Invoicing deadline. Only the main user gets the 'Update Now' button.",
          steps: [
            S("Main user clicks Update Now", [ac("dialog-manager.jsp:1-30, home.jsp:347")], { detail: "Goes to the profile wizard. Any other logged-in user sees a pop-up telling them to ask the main user to do it." }),
          ],
          sources: [ac("dialog-einvoice.jsp, home.jsp:347")],
        },
        {
          id: "bo-company-einvoice-search",
          name: "BO company e-Invoice search and listing",
          entry: "Back Office › company e-Invoice search (/api/admin/einvoice/company/search.get)",
          summary: "Prod code: a staff screen, not a dealer entry point. It has a filterable setup status.",
          steps: [
            S("Search the setup status", [ac("EInvoiceBoController:86-120")], { detail: "No per-user function gate was found on the listing. Two download actions for the main user's signed consent PDF need the function mvdBackOfficeAccess or mvdAgreementViewOnly." }),
          ],
          sources: [ac("EInvoiceBoController:86-120, 329-400")],
        },
        {
          id: "bo-created-company",
          name: "Company created in BO without a Type of Business",
          entry: "Back Office › Manage Company Accounts (create)",
          steps: [S("Treated as Trading Licence", [az(ROLES)], { detail: "Companies created in BO without a Type of Business are treated as “Trading License” (PDF upload) in the profile flow.", affects: ["onboarding › registration-and-account"] })],
          sources: [az(ROLES)],
        },
      ],
      affects: [
        F("Company/Business Profile page shows SSM documents and the purchase date (dd Month YYYY HH:MM AM|PM).", [ts("EAINT-9247 PE_TS06")]),
        F("SSM Transaction Details (LLP) and the BO SSM listing and Export CSV get the purchase.", [ts("EAINT-9247 PE_TS06")]),
        F("BO company details TIN is the value later used for invoices and e-Invoices.", [mi(RULES)]),
        F("Pre-Application price stays RM108.00; only SSM price changed (EAINT-10691).", [ts("EAINT-9247 10691_PC_TS1-TS10")]),
        F("On completion the company record gets e-Invoice setup status Completed, TIN, SST, e-Invoice contact and the consent time and consenter. The signed consent PDF plus the SSM or Trading Licence document are stored (DocumentCategory.EINVOICE) and can be downloaded from the UCD portal and BO. No email, SMS or WhatsApp goes to the dealer when the wizard completes.", [ac("EInvoiceUcdController:106-650, EInvoiceHandler:84-217")]),
        F("If the company came from onboarding (OBS), the wizard pulls its SSM details and business-profile documents from the OBS API instead of doing its own lookup. SSM is looked up and checked during company-type detection and document verification.", [ac("EInvoiceUcdController")]),
      ],
      cronjobs: [
        { name: "None for the profile wizard", schedule: "n/a", does: "Prod code: nothing in eauto core's scheduler touches the profile wizard. The e-Invoice jobs run inside the eauto-einvoice service (see the consolidated flow).", sources: [ac("EInvoiceUcdController, quartz-scheduled-jobs.md")] },
      ],
      roles: [
        F("Prod code: only the registered main user of a UCD-type company can open the wizard. The EInvoiceFilter checks both 'is a UCD company' and 'is the primary user ID'. Anyone else is sent to an access-denied page. No AATF, Service Portal or public path.", [ac("EInvoiceFilter, EInvoiceUcdController")]),
        F("Main user does the update and the thumbprint. Sub UCD cannot open Pre e-Invoice Step 1.", [az(UCDP), ts("EAINT-9247")]),
        F("BO users can view the result.", [ts("EAINT-9247")]),
        F("Main UCD in the TS is Sdn Bhd/Bhd; Sub UCD is Sole Proprietorship/Partnership (EAINT-8169 sheet).", [ts("EAINT-8169")]),
      ],
      afterCompletion: [
        F("The SSM purchase appears in the SSM Transaction Listing (UCD and BO). The profile page shows read-only data.", [ts("EAINT-9247")]),
        F("Where else the update data goes is not known.", [az(UCDP)], { unconfirmed: true }),
      ],
      rules: [
        F("SSM price RM19.44 applies on STMS Step 4, eSTM Step 4 (new and retry) and Profile Update Step 2. MyInvois classification 022 “SSM profile & admin fees”, unit price 18.00, tax 1.44, total 19.44.", [ts("EAINT-9247 10691_PC_TS1-TS10")], {
          alt: [{ text: "Older workbooks show SSM price RM15 + 3 + 1.44; one screen showed RM18 + 1.44; the earlier price was RM18.64.", sources: [az("knowledge/_core/fees-and-pricing.md"), mi(RULES)], note: "EAINT-10691 is newer; RM19.44 wins." }],
        }),
        F("If the user is NOT granted SSM permission (company level does not matter), Step 2 asks for documents instead: Sdn Bhd/Bhd = SSM Company Profile + Company Board Resolution + Staff Employment Pass & MyKad; Sole Proprietorship/Partnership = SSM Business Profile + Authorisation Letter + …", [ts("EAINT-8802 E2E_STMS_TS1-TS5")]),
        F("A Bypass Purchase SSM user setting lets the UCD proceed without buying SSM and upload 3 documents.", [ts("EAINT-8802")]),
        F("Statuses (prod, EInvoiceSetupStatus): New (record created, nothing sent) → Pending (profile form saved, waiting for document check and consent) → Completed (MyKad consent matched the registered main user, signed consent PDF made).", [ac("EInvoiceSetupStatus, EInvoiceUcdController")]),
        F("Prod code wizard order: view page (creates the record at New and looks up the company type through SSM), data entry (TIN, SST, contact name, phone, email), save (New → Pending), document check (SSM for ROC/ROB/LLP, Trading Licence PDF for TLN), consent screen, MyKad and thumbprint scan, auth-consent (the scanned ID must match the main user, then Pending → Completed), completion summary.", [ac("EInvoiceUcdController:106-650")]),
        F("The popup and wizard pages still say 'before 31 August 2025' as the deadline. That date has passed, so the wording is stale.", [ac("home.jsp, dialog-einvoice.jsp")]),
        F("The profile reminder is NOT shown on this flow’s own pages (EAINT-12253, Ex.3).", [az(UCDP), ji("EAINT-12253")]),
        F("One SSM general-error popup for ROB in Pre e-Invoice cannot be triggered (code error per dev).", [ts("EAINT-9247")], { unconfirmed: true }),
      ],
      scopeToCheck: [
        F("Check each Type of Business (ROB, ROC, TLN, LLP) through the 3 steps.", [az("automation/src/ff36/journeys.ts"), ts("EAINT-9247")]),
        F("Check SSM not-available popup, retry price breakdown RM19.44, and the duplicate-purchase popup.", [ts("EAINT-9247 PE_TS02-TS06")]),
        F("Check main user vs sub user access.", [az(UCDP)]),
        F("Check the update popup and the homepage link, and message wording.", [ts("EAINT-8169")]),
        F("Check the thumbprint step and MVD agreement date and name.", [az(ROLES)]),
        F("Check the SSM Transaction Listing (UCD and BO) and Export CSV after a purchase.", [ts("EAINT-9247")]),
        F("Check an updated company shows the read-only summary.", [az("cr/EAINT-9247/LEDGER.md")]),
      ],
      tickets: [
        { key: "EAINT-7229", what: "Applet certificate / profile flow", state: "latest" },
        { key: "EAINT-8169", date: "2025-05", what: "Profile update message content (e-Invoicing phase 3 notice)", state: "latest" },
        { key: "EAINT-8081", what: "Hotline number text on pages including Change Address popup", state: "latest" },
        { key: "EAINT-9247", what: "SSM purchase for LLP in Pre e-Invoice", state: "latest" },
        { key: "EAINT-10691", what: "SSM price change to RM19.44 (newer than 9247 base)", state: "latest" },
        { key: "EAINT-12253", date: "2026-09", what: "Browser reminder is not shown in this flow", state: "latest" },
        { key: "EAINT-11558", date: "2026-05", what: "Data job: 334 UCDs restricted for not completing the company profile update (also rounds 11212, 10948, 10510)", state: "latest" },
      ],
      openQuestions: [
        "Cronjobs for this flow are unknown.",
        "Where the transaction goes after completion beyond the SSM listing is unknown.",
        "Ask eAuto Q16 (profile and e-Invoice, prod code) has not been answered yet.",
      ],
    },

    // ---------------------------------------------------------- 2
    {
      id: "invoice-issue",
      name: "Invoice and e-Invoice on each transaction",
      summary:
        "When a transaction is approved, the details page shows an Invoice and, if the TIN is valid, an e-Invoice. e-Invoices go to LHDN MyInvois. A dealer with a blank or invalid TIN gets the Invoice only.",
      portals: ["UCD portal", "AATF portal", "Back Office", "LHDN MyInvois"],
      triggers: [
        {
          id: "details-buttons",
          name: "Invoice / e-Invoice buttons on Transaction Details",
          entry: "UCD or BO › any module › Transaction Details (Approved)",
          steps: [
            S("Transaction is approved", [mi(RULES), ts("EAINT-7548")], { detail: "e-Invoice is built and submitted to LHDN. Listings show e-Invoice Status and Submission Date. The [Invoice] button is named [e-Invoice] when it applies (SSM: [SSM Invoice] / [SSM e-Invoice]; Proforma: [Proforma Invoice] / [e-Invoice]).", affects: ["All paid modules", "LHDN MyInvois"] }),
            S("Valid TIN", [mi(RULES), ts("EAINT-8550")], { detail: "Both [Invoice] and [e-Invoice] show. LHDN Response Status = OK." }),
            S("Blank or invalid TIN", [mi(RULES), ts("EAINT-8550")], {
              detail: "Only [Invoice] shows, with the note “e-Invoices are only available for customers with a valid TIN. e-Invoices can only be issued for transactions within the current calendar month.” LHDN Response Status = Failed (remark “TIN verification failed. Kindly provide correct TIN information to eAuto customer service.” or “No TIN info has been provided.”).",
              branches: [{ when: "TIN is fixed later", then: "The monthly consolidated e-Invoice cronjob re-sends the failed e-Invoice." }],
            }),
          ],
          sources: [mi(RULES), ts("EAINT-8550"), az("cr/EAINT-3090/LEDGER.md")],
        },
        {
          id: "auto-after-jpj",
          name: "Automatic e-Invoice after a successful JPJ submission (no user entry)",
          entry: "System: eauto core publishes to RabbitMQ (EInvoiceMessager, EInvoiceRabbitMQProducer) after the JPJ step",
          summary: "Prod code: no user starts it. It fires for STMS, eSTM, APT, Dereg, Dereg Pre-check, BMK, JomCheck, eLKM, eVOC, OTH (Transfer History), Wholesale STMS, LKM Refund, Service Hub and Insurance Cancellation.",
          steps: [
            S("Core sets the row to New", [ac("EInvoiceMessager:42-108, EInvoiceRabbitMQProducer:204-300")], { detail: "The module's own handler sets its e-Invoice flag to New when the transaction succeeds. eauto-einvoice submits to LHDN and the status moves toward OK or Failed.", affects: ["eauto-einvoice"] }),
          ],
          sources: [ac("EInvoiceMessager, EInvoiceRabbitMQProducer")],
        },
        {
          id: "eDereg-precheck-einvoice",
          name: "eDereg Pre-Checking e-Invoice",
          entry: "AATF portal › eDereg Pre-Checking transaction",
          steps: [S("Valid TIN gives OK, invalid gives Failed", [mi(RULES)], { detail: "AATF “e-Invoice Status = OK” and BO “LHDN Response Status = OK” for a valid TIN. Failed with the TIN verification remark for an invalid TIN.", affects: ["dereg"] })],
          sources: [mi(RULES), ji("EAINT-8655"), ji("EAINT-9043")],
        },
        {
          id: "onboarding-invoices",
          name: "Pre-Application and Application payment invoices",
          entry: "Onboarding success pages and emails",
          steps: [S("Invoice and e-Invoice for the onboarding fees", [az("cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv")], { detail: "Invoice PDF + e-Invoice PDF (valid TIN) or Invoice PDF only (invalid or blank TIN). BO Pre-Application / Application listings have lhdnStatus filters.", affects: ["onboarding"] })],
          sources: [az("cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv")],
        },
      ],
      affects: [
        F("LHDN MyInvois receives the e-Invoice. Supplier is eAuto Sdn Bhd (fixed TIN, MSIC 62099).", [ts("EAINT-7548"), az("cr/EAINT-7548/LEDGER.md")]),
        F("Modules with e-Invoices: STMS, Transfer History, UCD to UCD Interstate, eSTM, eLKM, eVOC, APT, BMK, JomCheck, SSM, Dereg, Insurance Cancellation. Mobile: STMS, UCD to UCD, eSTM, eLKM, eVOC, SSM.", [ts("EAINT-7548")]),
        F("Combined documents: STMS + TH, and eSTM + eLKM + eVOC list one line per item, each with its own SST.", [az("knowledge/portals/ucd/how-we-test.md")]),
        F("Reconciliation and Finance use the same amounts.", [mi(RULES)]),
        F("CIBO payments are a separate system.", [mi(RULES)]),
      ],
      cronjobs: [
        { name: "LHDN resubmission (consolidated e-Invoice)", schedule: "Monthly (day of month not recorded)", does: "Re-sends LHDN-failed e-Invoices once the TIN is fixed.", sources: [az(LEDGER12022), mi(RULES)] },
      ],
      roles: [
        F("UCD users see their own company documents. BO Finance and Ops see per page. AATF sees its own.", [az("knowledge/_index/sharepoint-studied.md"), mi(RULES)]),
        F("Invoice rules apply on UCD web and mobile and BackOffice.", [ts("EAINT-8550")]),
      ],
      afterCompletion: [
        F("Documents are in the transaction details, the UCD Payment Report, Download Payment Document and Payment Breakdown Report, and sent to LHDN.", [mi(RULES), az("cr/EAINT-3090/LEDGER.md")]),
      ],
      rules: [
        F("Document Code runs in sequence with no skipped numbers across all modules, including failed e-Invoices (EAINT-8659). Format EA-IV-MMYY-xxxxxxx, resets monthly. Type 01 Invoice version 1.1.", [mi(RULES), az("cr/EAINT-7548/LEDGER.md"), ts("EAINT-7548")]),
        F("Payment Reference No format {yymmdd}{0017}{000001}-{vehicle}. Vehicle number prints with spaces (for example “WU 4444”).", [az("cr/EAINT-7548/LEDGER.md"), mi(RULES)]),
        F("Buyer block: blank SST prints “n/a”. Blank PIC contact falls back to the company contact. Blank PIC email falls back to the Director/Owner email.", [mi(RULES)]),
        F("A partial bundle failure gives an invoice with only the successful part. Classification code 022 is used for SSM and JomCheck lines.", [mi(RULES)]),
        F("e-Invoices can only be issued for transactions in the current calendar month.", [ts("EAINT-8550"), mi(RULES)]),
        F("New documents carry the eAuto logo with TM. Documents already approved keep the old logo (EAINT-9555). Hotline 03-27798899 and the new address (Level 15 Sunway Tower) apply; documents before 5/5/2025 keep the old address (EAINT-8620 / 8627).", [mi(RULES)]),
        F("An Approved transaction with e-Invoice Failed (“Submission failed due to unexpected error”) was seen. What the dealer should do is unknown.", [az(UCDP)], { unconfirmed: true }),
        F("Statuses (prod): per-transaction e-Invoice status in eauto core is New (shown '-'), Pending (sent, waiting), OK (accepted), Failed (rejected or error). Inside eauto-einvoice, document status is Valid, Invalid, Cancelled, Submitted, Rejected. Invoice and submission status is DRAFT, PENDING, APPROVED, WITHDRAWN, FAILED, REJECTED (the LHDN-facing lifecycle). A payment event, including Failed or Error payments, also reaches eauto-einvoice over RabbitMQ.", [ac("EInvoiceSubmissionStatus, EInvoiceStatus.kt, DocumentStatus.kt, PaymentTransactionRabbitMQProducer")]),
        F("Each transaction table in eauto core (STMS, Dereg, BMK, eVOC, JomCheck, eLKM, LKM Refund, OTH and others) has its own e-Invoice submission and validation status column. eauto-einvoice owns invoice numbering, PDF printing and credit notes.", [ac("eauto-einvoice service")]),
        F("Staging company “FAIZUDDIN AUTO TEST 2” has an invalid TIN ready-made.", [az("knowledge/portals/ucd/how-we-test.md")]),
      ],
      scopeToCheck: [
        F("Check buttons and PDFs for valid, invalid and blank TIN on UCD and BO details, for every module (EAINT-8550 sheets: Invalid or Blank TIN, New Transactions, Existing, Buyer, Supplier & Amount).", [ts("EAINT-8550")]),
        F("Check Document Code sequence and description wording per module.", [mi(RULES)]),
        F("Check listing columns and filters (e-Invoice Status, Submission Date, LHDN Response Status, e-Invoice Validation Date).", [ts("EAINT-7548"), az("cr/EAINT-7548/LEDGER.md")]),
        F("Check amounts: item lines, SST, JPJ/FIS/eAuto split, price after a fee change.", [ts("EAINT-7548"), az("knowledge/_core/fees-and-pricing.md")]),
        F("Check the monthly resubmission after the TIN is corrected.", [az(LEDGER12022)]),
        F("Check the BO Consolidated e-Invoice Listing (Type, Payment Date From/To, LHDN status, Submission Date, Proforma Invoice Only).", [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv")]),
        F("Check JomCheck invoice split RM18 + RM2 (EAINT-12412).", [az(LEDGER12022), ji("EAINT-12412")]),
      ],
      tickets: [
        { key: "EAINT-2450", date: "2025-06", what: "e-Invoice (earlier ticket in the e-Invoice family)", state: "latest" },
        { key: "EAINT-7548", date: "2025-05", what: "e-Invoice templates and listings (umbrella, To Do)", state: "latest" },
        { key: "EAINT-8550", date: "2025-10", what: "New Invoice template for users with invalid or blank TIN", state: "latest" },
        { key: "EAINT-8659", what: "Document Code sequence with no gaps", state: "latest" },
        { key: "EAINT-8655", what: "eDereg Pre-Checking e-Invoice", state: "latest" },
        { key: "EAINT-9043", what: "eDereg Pre-Checking e-Invoice (follow-up)", state: "latest" },
        { key: "EAINT-9555", what: "eAuto logo with TM on documents", state: "latest" },
        { key: "EAINT-8620", what: "Address and hotline change on documents", state: "latest" },
        { key: "EAINT-8627", what: "Address and hotline change (follow-up)", state: "latest" },
        { key: "EAINT-9058", what: "e-Invoice ticket listed in Faizuddin’s e-Invoice notes", state: "latest" },
        { key: "EAINT-9059", what: "e-Invoice ticket listed in Faizuddin’s e-Invoice notes", state: "latest" },
        { key: "EAINT-12412", date: "2026-10", what: "JomCheck charge split (RM18 + RM2) on invoices", state: "latest" },
        { key: "EAINT-12130", date: "2026-08", what: "Contact Us: hide eAuto bank account", state: "latest" },
      ],
      openQuestions: [
        "e-Invoice retry for an Approved transaction whose e-Invoice failed is unknown.",
        "Buyer contact number source is marked “details source?” in the EAINT-7548 template.",
        "Ask eAuto answers for e-Invoice (Q16 and the gap question on the monthly job day) have not arrived yet.",
      ],
    },

    // ---------------------------------------------------------- 3
    {
      id: "consolidated-einvoice",
      name: "Consolidated e-Invoice and revenue report jobs",
      summary:
        "Failed e-Invoices are re-sent in bulk as consolidated e-Invoices by a monthly job. BO and UCD can see the result in listings.",
      portals: ["Back Office", "LHDN MyInvois"],
      triggers: [
        {
          id: "monthly-job",
          name: "Monthly consolidated e-Invoice cronjob (EAINT-9845)",
          entry: "Scheduled backend job (live since S27.6-20260318)",
          steps: [
            S("Job picks LHDN-failed e-Invoices", [az(LEDGER12022)], { detail: "Selects e-Invoices that failed (for example invalid TIN) where the TIN is now fixed. Re-sends them as consolidated. In staging TS the transaction is “patched to previous month” to test it." }),
            S("Result", [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv")], { detail: "Consolidated e-Invoice Listing shows rows by Type (STMS, …, Pre-Application, Application, Insurance Cancellation).", affects: ["BO Consolidated e-Invoice Listing"] }),
          ],
          sources: [az(LEDGER12022)],
        },
        {
          id: "bo-listing",
          name: "BO Consolidated e-Invoice Listing",
          entry: "Back Office › e-Invoice / Consolidated e-Invoice Listing",
          steps: [S("Filter and read", [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv"), az("cr/EAINT-3090/LEDGER.md")], { detail: "Filters: Type, Payment Date From/To, LHDN e-Invoice Status, Consolidated e-Invoice Submission Date, “Proforma Invoice Only”. EAINT-9063 added eDereg Pre-Checking to the Type filter (S22.9-20251029)." })],
          sources: [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv")],
        },
      ],
      affects: [
        F("Finance sees the Revenue Report (live in some form via EAINT-8772 / 8816 exports, EAINT-10120 cronjob, EAINT-12260 fix S33.4-20260910).", [az(LEDGER12022)]),
        F("LHDN receives the consolidated e-Invoice.", [az(LEDGER12022)]),
      ],
      cronjobs: [
        { name: "Consolidated e-Invoice Submission Job (eauto-einvoice, ConsolidatedEInvoiceSubmissionJob.kt)", schedule: "Config key cron.consolidated-einvoice.time. The day and time are hidden in config. Always processes the previous calendar month. Enabled by default, but the current prod config has dryrun: true.", does: "Gathers the month's individual e-Invoices and Proforma Invoices and submits one consolidated e-Invoice to LHDN. In dry-run mode it only logs what it would do and creates and submits nothing. On error it emails an internal report recipient, never the dealer.", sources: [ac("ConsolidatedEInvoiceSubmissionJob.kt, ConsolidatedEInvoiceHandler.kt:1-120")], unconfirmed: true },
        { name: "Consolidated e-Invoice Report Job (eauto-einvoice)", schedule: "Config key cron.consolidated-einvoice-report.time. Hidden. Currently turned off in config.", does: "Makes a report file of the previous month's consolidated submission. It does not create the invoice.", sources: [ac("ConsolidatedEInvoiceReportJob.kt")], unconfirmed: true },
        { name: "Missing Invoice Generation Job (eauto-einvoice)", schedule: "Config key cron.missing-invoice-generation.time. Weekly. Off by default.", does: "A catch-up sweep from a configured start date that remakes invoice PDFs that were not produced.", sources: [ac("MissingInvoiceGenerationJob.kt")], unconfirmed: true },
        { name: "Revenue Report Job (eauto-einvoice, RevenueReportJob.kt)", schedule: "Two schedules: every Tuesday and Friday (cron.revenue-report.tuesday-friday-time) and the 1st of every month (cron.revenue-report.first-of-month-time). Times are hidden in config. If the 1st falls on a Tuesday or Friday, the Tuesday/Friday run is skipped that day. Enabled.", does: "Makes the Revenue Report. A separate manual 'Revenue Report' download exists in BO under Finance for the finance role only (any date range).", sources: [ac("RevenueReportJob.kt, RevenueReportService.kt")] },
        { name: "Monthly consolidated e-Invoice cronjob (EAINT-9845)", schedule: "Monthly; the day is not recorded", does: "Re-sends LHDN-failed e-Invoices (invalid TIN fixed) as consolidated.", sources: [az(LEDGER12022)] },
        { name: "Revenue Report cronjob (EAINT-10120)", schedule: "Unknown", does: "Builds the Revenue Report.", sources: [az(LEDGER12022)], unconfirmed: true },
        { name: "Pre-Application / Application consolidated resubmission", schedule: "Monthly", does: "Re-sends LHDN-failed onboarding payment e-Invoices. Remarks: “No TIN info has been provided.” or “TIN verification failed. Kindly provide correct TIN information to eAuto customer service.”", sources: [az("cr/_boards/miro-preapp-application/t36_3458764647399514416.tsv")] },
      ],
      roles: [F("BO Finance and Ops.", [az("knowledge/_index/sharepoint-studied.md")])],
      afterCompletion: [F("Rows in the Consolidated e-Invoice Listing with the LHDN status.", [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv")])],
      rules: [
        F("The Revenue Report scope for Insurance Cancellation is an open question (Q16 in Azfar’s list).", [az(LEDGER12022)], { unconfirmed: true }),
      ],
      scopeToCheck: [
        F("Check a failed e-Invoice becomes consolidated after the job and the TIN fix.", [az(LEDGER12022)]),
        F("Check the listing filters and Type values, including Pre-Application and Application.", [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv")]),
        F("Check the remark text for blank and invalid TIN.", [az("cr/_boards/miro-preapp-application/t36_3458764647399514416.tsv")]),
      ],
      tickets: [
        { key: "EAINT-9845", date: "2026-03", what: "Monthly consolidated e-Invoice cronjob (live S27.6-20260318)", state: "latest" },
        { key: "EAINT-9063", date: "2025-10", what: "Add eDereg Pre-Checking to the consolidated listing Type filter", state: "latest" },
        { key: "EAINT-10120", what: "Revenue Report cronjob", state: "latest" },
        { key: "EAINT-12260", date: "2026-09", what: "Revenue Report fix (S33.4-20260910)", state: "latest" },
      ],
      openQuestions: [
        "The day of the month for the consolidated submission is a hidden config value (cron.consolidated-einvoice.time). Prod code says it always processes the previous calendar month.",
        "Prod config shows dryrun: true for the Consolidated e-Invoice Submission Job, so no consolidated invoice may be sent to LHDN today. Azfar's notes say the job re-sends failed e-Invoices (live since S27.6-20260318). Which is true in prod?",
        "Does the Consolidated e-Invoice Report Job need turning on? It is off in config.",
      ],
    },

    // ---------------------------------------------------------- 4
    {
      id: "payment-reports",
      name: "UCD payment reports and downloads",
      summary:
        "Dealers can export payment reports, download weekly invoice bundles and read the payment breakdown for tax and accounts.",
      portals: ["UCD portal (Reports)", "AATF portal", "Back Office"],
      triggers: [
        {
          id: "ucd-payment-report",
          name: "UCD › Reports › UCD Payment Report (EAINT-7495)",
          entry: "UCD › Reports › UCD Payment Report",
          steps: [S("Search and export", [mi(RULES), az("cr/EAINT-7495/LEDGER.md")], { detail: "Payment Date defaults to today, max 30 days, no future dates. Export name Payment_Report_{ddMMyyyy}_{hh_mm_AM}." })],
          sources: [mi(RULES), az("cr/EAINT-7495/LEDGER.md")],
        },
        {
          id: "download-payment-doc",
          name: "UCD › Reports › Download Payment Document (EAINT-8514, EAINT-7496)",
          entry: "UCD › Reports › Download Payment Document › Generate",
          steps: [S("Pick month and year, Generate, download a week", [ts("EAINT-8514 TS1-TS6"), az("cr/EAINT-7496/LEDGER.md")], { detail: "Weekly rows, past weeks only (the current week cannot be downloaded). Zip name payment_documents_{UCD_Company_ID}_YYYY-MM-DD_to_YYYY-MM-DD with Invoice and e-Invoice PDFs. Pressing Generate builds the latest set (no cronjob). Totals = eSTM + STMS + APT." })],
          sources: [ts("EAINT-8514"), az("cr/EAINT-7496/LEDGER.md")],
        },
        {
          id: "payment-breakdown",
          name: "Payment Breakdown Report (EAINT-3090)",
          entry: "UCD › Reports and BO › Report › Payment Breakdown Report",
          steps: [S("Choose range and type, download", [ts("3090_TS1-TS3"), az("cr/EAINT-3090/LEDGER.md")], { detail: "Payment Date range max 1 month. Types: BMK, TH, eLKM, eVOC, SSM, JomCheck, eSTM, STMS, APT, All. Output PDF and Excel. Columns: Tarikh Invoice, Tarikh Bayaran, No Rujukan, No Transaksi, Document Code, No Kenderaan, Keterangan, Mod Bayaran, JPJ, FIS, eAuto, Service Tax." })],
          sources: [ts("3090"), az("cr/EAINT-3090/LEDGER.md")],
        },
        {
          id: "aatf-payment-report",
          name: "AATF Payment Report (EAINT-9715)",
          entry: "AATF portal › Payment Report",
          steps: [S("Same filters, types All / DEREG / eDereg Pre-Checking", [mi(RULES)], { affects: ["dereg"] })],
          sources: [mi(RULES), ji("EAINT-9715")],
        },
        {
          id: "bo-sst-report",
          name: "BO SST Payment Report (eAuto Plus)",
          entry: "Back Office › SST Payment Report",
          steps: [S("Read the report", [az("cr/EAINT-3090/LEDGER.md")], { detail: "Includes JomCheck lines (shown in EAINT-12339 TS)." })],
          sources: [az("cr/EAINT-3090/LEDGER.md")],
        },
      ],
      affects: [
        F("Documents equal the Invoice and e-Invoice PDFs on eSTM / STMS / APT details pages. The invalid/blank TIN template is used where it applies.", [ts("EAINT-8514 TS3-TS4")]),
        F("A fee change shows both fee versions in the reports for old and new transactions.", [mi("knowledge/business-rules-from-test-scenarios.md")]),
      ],
      cronjobs: [
        { name: "Weekly document zip job (old design)", schedule: "None now", does: "EAINT-8514 note: “No longer using cronjob - Clicking [Generate] will generate latest set of documents”.", sources: [ts("EAINT-8514 TS1")] },
      ],
      roles: [F("UCD main and sub users for their own company. AATF for AATF. BO for the BO report.", [mi(RULES)])],
      afterCompletion: [F("Files download to the browser.", [ts("EAINT-8514")])],
      rules: [
        F("Download Payment Document zip name is payment_documents_{UCD_Company_ID}_YYYY-MM-DD_to_YYYY-MM-DD.", [mi(RULES), az("cr/EAINT-7496/LEDGER.md")], {
          alt: [{ text: "Earlier zip name {UCD Company ID}-YYYYMMDD-YYYYMMDD; PDFs named {Transaction No.}_YYYYMMDD.pdf.", sources: [ts("EAINT-8514 TS2")], note: "EAINT-7496 is newer; later wins." }],
        }),
        F("Payment Report: Payment Date max 30 days. Breakdown: max 1 month. This matches the standard one-month date rule.", [mi(RULES), az("cr/EAINT-3090/LEDGER.md")]),
      ],
      scopeToCheck: [
        F("Check filters, default dates, maximum range and export file names.", [mi(RULES)]),
        F("Check past month, current month, all months; valid, invalid and blank TIN; transactions from before the deploy.", [ts("EAINT-8514")]),
        F("Check the PDF contents equal the details page PDFs.", [ts("EAINT-8514 TS3-TS4")]),
        F("Check Breakdown columns and amounts per type, in PDF and Excel.", [ts("3090")]),
      ],
      tickets: [
        { key: "EAINT-3090", date: "2026-05", what: "Payment Breakdown Report", state: "latest" },
        { key: "EAINT-7495", date: "2026-05", what: "UCD Payment Report (S29.5-20260520)", state: "latest" },
        { key: "EAINT-7496", date: "2026-04", what: "Download Payment Document (extends 8514)", state: "latest" },
        { key: "EAINT-8514", date: "2025-07", what: "Download Payment Document base behaviour", state: "legacy", supersededBy: "EAINT-7496" },
        { key: "EAINT-9715", what: "AATF Payment Report", state: "latest" },
      ],
      openQuestions: [],
    },
  ],
};
