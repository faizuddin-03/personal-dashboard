import type { Fact, Module, Source, Step } from "../types";

// JomCheck module. Faizuddin is deep here (EAINT-12339, 12412), so knowledge/flow-jomcheck.md is the
// shown text; Azfar's differing versions sit in `alt`. Ask eAuto prod-code facts (2026-10-23) are added with the ask source.

const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const azfar = (ref: string, date?: string): Source => ({ kind: "azfar", ref, date });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string, date?: string): Source => ({ kind: "ts", ref, date });
const teams = (ref: string, date?: string): Source => ({ kind: "teams", ref, date });
const ask = (ref: string): Source => ({ kind: "askeauto", ref: "prod code 0e21bef3db — " + ref, date: "2026-10-23" });

const F = (text: string, sources: Source[], extra: Partial<Fact> = {}): Fact => ({ text, sources, ...extra });
const S = (title: string, sources: Source[], extra: Partial<Step> = {}): Step => ({ title, sources, ...extra });

export const jomcheck: Module = {
  id: "jomcheck",
  name: "JomCheck",
  short: "JomCheck",
  portals: ["UCD portal", "Back Office", "Service Portal", "Wholesale chatbot (manual testing only)", "eAuto open API for credit companies", "ezAuto JomCheck Gateway API (third party)"],
  summary:
    "JomCheck is a vehicle claim-history report. A UCD user buys it by vehicle number or chassis number. eAuto gets the data from the ezAuto JomCheck Gateway API (v2.0 since the night of 2026-10-05). The price is RM20.00 plus 8% SST (RM21.60). The user can share the report with a bank or credit company for 30 days. Back Office can see every transaction and resubmit a failed one. Banks see shared reports in the Service Portal or through the open API.",
  related: ["service-portal", "backoffice", "wholesale", "payments-fees"],
  glossary: [
    { term: "ezAuto", meaning: "The third party that owns and runs the JomCheck Gateway API. eAuto is only a client.", sources: [mine("knowledge/flow-jomcheck.md §1")] },
    { term: "eSim", meaning: "The staging simulator. In eSim mode the report PDF is a dummy and the results are what the tester sets in eSim. In API mode the PDF is real but the results are random.", sources: [mine("knowledge/flow-jomcheck.md §7a", "2026-09-30")] },
    { term: "Tx Status", meaning: "Transaction status: New, Pending, Approved or Failed. A JomCheck is never Cancelled (only the invoice can be cancelled).", sources: [mine("knowledge/flow-jomcheck.md §9h item 12", "2026-10-19")] },
    { term: "Possible Total Loss / Possible BER", meaning: "New vehicle-level fields from API v2.0. Back Office only, never shown in the Service Portal. Possible Total Loss is Yes only for ICAP claim code 16 (Actual Total Loss).", sources: [mine("knowledge/flow-jomcheck.md §4", "2026-09-30"), jira("EAINT-12339 description", "2026-10")] },
    { term: "ICAP claim code", meaning: "Code in ClaimsType that maps to the Type of Claim text, for example 16 = Own Damage - Actual Total Loss.", sources: [mine("knowledge/flow-jomcheck.md §10e")] },
    { term: "Share window", meaning: "The 30 days after purchase in which the UCD can share the report with a bank or credit company.", sources: [mine("knowledge/flow-jomcheck.md §3")] },
    { term: "JomcheckShareStatus", meaning: "Sharing status of a report with a credit company. DRAFT = the UCD picked companies before payment (not visible to the company). SHARED = locked and visible to the company.", sources: [ask("JomcheckShareStatus.java")] },
    { term: "JomcheckSubmissionStatus", meaning: "Submitted (report call in flight), OK (report saved) or Failed. It decides whether Resubmit is allowed.", sources: [ask("JomcheckSubmissionStatus.java, JomcheckTransactionHandler.java")] },
    { term: "JCK", meaning: "Reference type for JomCheck in the RHB statement ('<txn no>/JCK'). Amount 19.44 or 21.60.", sources: [ts("RHB_25.06.2026_2 rows")] },
  ],
  flows: [
    // ---------------------------------------------------------------- 1. UCD purchase
    {
      id: "ucd-purchase",
      name: "UCD buys a JomCheck report",
      summary: "A UCD user searches a vehicle or chassis number, pays RM20.00 + 8% SST by RHB direct debit, and downloads the report. Failed reports can be resubmitted by Back Office only.",
      portals: ["UCD portal", "ezAuto JomCheck Gateway API", "Wholesale chatbot (manual)"],
      triggers: [
        {
          id: "ucd-tile",
          name: "Direct from the UCD JomCheck tile",
          entry: "UCD home › JomCheck tile › JomCheck Report › PURCHASE JOMCHECK REPORT",
          summary: "Main way in. The tile shows RM20 (RM18 before EAINT-10089).",
          sources: [mine("knowledge/flow-jomcheck.md §7c", "2026-09-30"), azfar("knowledge/portals/ucd/portal.md#The modules")],
          steps: [
            S("Log in and open the JomCheck tile", [mine("knowledge/flow-jomcheck.md §7c", "2026-09-30")], {
              where: "UCD portal › Home › JOMCHECK REPORT tile",
              detail: "The tile opens the JomCheck module. The landing page also has the JomCheck Transaction Listing.",
              branches: [{ when: "BO set Transaction Restriction = Yes on the company", then: "A popup says the user is restricted from creating transactions and to call eAuto. No transaction is created." }],
            }),
            S("Click PURCHASE JOMCHECK REPORT", [mine("knowledge/flow-jomcheck.md §7c", "2026-09-30")], { where: "UCD › JomCheck Report › PURCHASE JOMCHECK REPORT (#create-tx)" }),
            S("Choose Vehicle No or Chassis No and type the value", [mine("knowledge/flow-jomcheck.md §5a item 1", "2026-10-16"), ts("EAINT-6475 JC_6475_TS1")], {
              where: "Get JomCheck Report page (Vehicle No is the default radio)",
              detail: "Vehicle number is made upper case and special or non-ASCII characters are removed. Chassis keeps * / - and spaces, max 30 characters. Empty field shows 'This field is required'.",
            }),
            S("Click Submit", [mine("knowledge/flow-jomcheck.md §5a", "2026-10-16"), ts("EAINT-6475 6475_REG_TS01")], {
              where: "Submit (#to-check-vehicle)",
              detail: "eAuto asks ezAuto for a pre-search. If found, a Pending transaction is created and the page says 'Vehicle number found.' (or 'Chassis number found.') with the price 'RM20.00 + 8% Service Tax'.",
              affects: ["ezAuto JomCheck Gateway API", "UCD JomCheck Transaction Listing"],
              branches: [
                { when: "Vehicle not found", then: "Message 'Vehicle not found. Try again with another vehicle' (chassis: 'Chassis not found. Try again with another chassis'). Status stays Pending." },
                { when: "ezAuto API is down", then: "Message 'Jomcheck API is temporarily unavailable now, please try again in 10 minutes.' No Pay Now button. Status Failed." },
                { when: "ezAuto is in maintenance", then: "Popup 'Unable to retrieve JomCheck results due to system maintenance. Please try again later.' Listing shows Transaction No '-', Payment '-', Tx Status Pending, same text in Remarks." },
              ],
            }),
            S("Optionally tick credit companies to share the report with", [mine("knowledge/flow-jomcheck.md §5a item 5, §3", "2026-10-16"), ts("10937_E2E_TS01")], {
              where: "Section 'Share Report with Financial Institution (Bank and Credit Company) (Optional)' (checkboxes .share-cc-pay)",
              detail: "Shows 'until {date d+30}'. Only companies that BO allowed to share are listed. If there are none, the section is hidden. Ticks stay after a failed payment and retry.",
            }),
            S("Click Pay Now and confirm", [mine("knowledge/flow-jomcheck.md §7c-i", "2026-10-02")], {
              where: "Pay Now (#to-pay) › 'Payment' dialog",
              detail: "Dialog text: 'Are you sure you want to proceed with this payment? Please ensure that there is sufficient fund in your RHB account.' With a company ticked, the text adds that the report will be shared with the credit company. RHB direct debit; no thumbprint.",
              affects: ["RHB direct debit", "Reset Payment cronjob"],
              branches: [
                { when: "RHB funds are not enough", then: "RHB message 'Wang di dalam akaun RHB anda TIDAK MENCUKUPI.' Payment fails; the user can Retry." },
                { when: "Payment OK but ezAuto fails to give the report", then: "Payment OK, Tx Failed, Remarks 'Failed to retrieve report'. UCD has no Resubmit button; Back Office resubmits." },
              ],
            }),
            S("Wait for the report, then download", [mine("knowledge/flow-jomcheck.md §7c-i, §5a", "2026-10-03")], {
              where: "Same page › Download Report (#to-view-report)",
              detail: "Real payment takes about 2 minutes. Success text: 'Report is retrieved successfully. You can download the report now or access it later through the JomCheck report listing.' Status becomes Approved. Transaction Details then has Invoice, e-Invoice and Report buttons.",
              affects: ["UCD JomCheck Transaction Listing", "BO JomCheck Transaction Enquiry", "BO JomCheck Report Listing", "Invoice and e-Invoice"],
            }),
          ],
          affects: [
            F("An unpaid Pending JomCheck cannot be resumed; the user must create a new one.", [azfar("knowledge/_core/jomcheck.md", "2026-10-21")]),
          ],
        },
        {
          id: "ucd-listing",
          name: "From the UCD JomCheck Transaction Listing",
          entry: "UCD › JomCheck module landing › JOMCHECK TRANSACTION LISTING",
          summary: "Used to find an old purchase, download its report or invoice, or share it later.",
          sources: [azfar("knowledge/_core/jomcheck.md#UCD: purchase and report"), mine("knowledge/flow-jomcheck.md §7c")],
          steps: [
            S("Filter the listing", [mine("knowledge/flow-jomcheck.md §7c")], {
              where: "UCD › JomCheck › Transaction Listing",
              detail: "Filters: vehicle no, ref no, chassis no, status, from and to date. The listing has no claim columns. UCD sees only its own company's rows.",
            }),
            S("Open View", [mine("knowledge/flow-jomcheck.md §7c, §9f")], {
              where: "Row › View",
              detail: "Details page has Print Invoice (#to-print-invoice), Print e-Invoice (#to-print-e-invoice) and Print Report (#to-print-report, downloads directly). The e-Invoice button appears only after LHDN validation.",
            }),
            S("Share with more credit companies", [ts("10937_E2E_TS04, TS06")], {
              where: "Details › Share",
              detail: "Allowed inside the 30-day window. Shows 'Shared on dd-mm-yyyy'. See the sharing flow.",
            }),
          ],
        },
        {
          id: "wholesale-chatbot",
          name: "Wholesale chatbot match card (manual testing only)",
          entry: "WhatsApp chatbot › match card for a listed vehicle › 'Book here or purchase JomCheck report' › payment page",
          summary: "A buyer or dealer buys JomCheck through the Wholesale chatbot. No login screen. Wholesale chatbot flows are tested by hand only.",
          sources: [mine("knowledge/flow-jomcheck.md §2", "2026-09-30"), jira("EAINT-12198 comment", "2026-08-18")],
          steps: [
            S("Open the match card and the payment page", [mine("knowledge/flow-jomcheck.md §2", "2026-09-30")], {
              where: "WhatsApp chatbot › match card › payment page",
              detail: "The payment page shows the JomCheck price plus SST. The add-on is available in every deal state except for a locked-out buyer (option hidden, no message). A cancelled-order buyer keeps JomCheck.",
              affects: ["Wholesale"],
            }),
            S("Pay; the bot sends a confirmation and an e-invoice is made", [mine("knowledge/flow-jomcheck.md §2", "2026-09-30")], {
              detail: "The chatbot quote, FAQ answer and payment page must show the same price (RM20 excl. SST).",
            }),
          ],
          affects: [
            F("Wholesale-bought JomCheck does not show the sharing section.", [ts("10089 / 10937 TS")]),
            F("How the report is downloaded after a Wholesale purchase, and whether Wholesale reads the v2.0 API fields, is not documented in the SRD.", [mine("knowledge/flow-jomcheck.md §2")], { unconfirmed: true }),
          ],
        },
        {
          id: "wholesale-hmac-api",
          name: "Wholesale portal calls the JomCheck API (prod code)",
          entry: "External wholesale portal › /xapi/hmac/wholesale/jomcheck/* (availability, price, purchase, download)",
          summary: "A separate signed (HMAC) channel for wholesale dealers. Reports bought here are never shareable with credit companies.",
          sources: [ask("WholesaleJomcheckController.java:93-184; JomcheckTransactionController.java:210-214")],
          steps: [S("Wholesale portal calls the endpoint", [ask("WholesaleJomcheckController.java")], { detail: "Not a UCD screen. The report is linked back to the deal by wholesaleDealId on the JomCheck record." })],
        },
        {
          id: "ucd-otp-payment",
          name: "UCD pays after director SMS OTP (prod code)",
          entry: "UCD › Purchase JomCheck Report › Submit › OTP › make-payment.do",
          summary: "Prod code shows an OTP step and a payment step that the shown steps do not describe.",
          sources: [ask("JomcheckTransactionController.java:546-688; JomcheckPaymentController.java:94-147")],
          steps: [
            S("Transaction is created as New, then Pending after the vendor pre-check", [ask("JomcheckTransactionHandler.java:169, 372-404")], { detail: "Pre-check goes through jomcheck-api (real or simulator, setting settings.eauto.jomcheck.connection.mode)." }),
            S("UCD director confirms by SMS OTP", [ask("jomcheck-generateotp.do, checking-otp.do")], { detail: "The charge is calculated from the transfer-cost config." }),
            S("UCD pays by RHB account debit; a DRAFT share selection can be saved", [ask("JomcheckPaymentController.java:94-147")]),
            S("On payment success eAuto calls the vendor report service", [ask("JomcheckTransactionHandler.java:251-272, 327-339")], {
              detail: "Success: submissionStatus OK, transactionStatus Approved, approvedAt and shareableAt stamped, DRAFT shares become SHARED. Failure: submissionStatus Failed, transactionStatus Failed.",
              affects: ["eSTM transaction JomCheck flag", "e-Invoice", "Elasticsearch index"],
            }),
          ],
        },
      ],
      affects: [
        F("Prod code: the eSTM transaction of the same vehicle and UCD gets its JomCheck sub-status flag set to Y and is re-indexed. Listings are also pushed to an Elasticsearch index used by the BO Report Listing and the Service Portal listing.", [ask("JomcheckTransactionHandler.java:358-368; ElasticJomcheckTransactionDao.java")]),
        F("Prod code: no email, SMS or WhatsApp notification to the UCD or credit company was found for JomCheck.", [ask("eauto and eauto-notification search")]),
        F("BO JomCheck Transaction Enquiry (all companies) and BO JomCheck Report Listing (29 columns plus Excel export).", [mine("knowledge/flow-jomcheck.md §2, §9", "2026-10-19")]),
        F("Service Portal JomCheck Report Listing and Ownership Claim Details, only if the UCD shared the report.", [mine("knowledge/flow-jomcheck.md §2, §3")]),
        F("Invoice and e-Invoice (LHDN / MyInvois). Two lines since EAINT-12412.", [mine("knowledge/flow-jomcheck.md §9", "2026-10-19")]),
        F("BO SST Payment Report (JomCheck): Amount 20.00, Tax 1.60, Total 21.60, eAuto 6.00, SST 0.48.", [mine("knowledge/business-rules-from-test-scenarios.md §5")]),
        F("Payment Breakdown Report, Download Payment Document and UCD Payment Report.", [ts("10089 TS-006..012"), ts("EAINT-7495 E2E")]),
        F("Reconciliation listing: JomCheck, SSM and Insurance approved two days after payment are listed under Approved Date (EAINT-12113). RHB statement reference type JCK.", [mine("knowledge/business-rules-from-test-scenarios.md"), ts("RHB_25.06.2026_2")]),
        F("JomCheck shares the Transaction Restriction popup (EAINT-9044) with STMS, eSTM, APT, UCD to UCD, BMK and Insurance Get Free Quote.", [ts("EAINT-9044 JC_TS1-TS3")]),
      ],
      cronjobs: [
        { name: "Reset Payment cronjob", schedule: "Not stated in the digests", does: "Handles existing JomCheck transactions that are Pending, Enquiry Failed or Failed Retry Payment. Prod code lists no JomCheck-specific scheduled job, so this is probably the shared payment-reset job.", sources: [ts("10937_E2E_TS10-14"), ask("quartz-scheduled-jobs.md (34 job classes, none for JomCheck)")], unconfirmed: true },
        { name: "Maintenance window (inline check, not a job)", schedule: "On every request", does: "The under-maintenance window is checked inside the request, not by a scheduler. No JomCheck Quartz job exists in prod code.", sources: [ask("JomcheckTransactionController.java:738-741; quartz-scheduled-jobs.md")] },
        { name: "LHDN e-Invoice validation wait", schedule: "No cronjob named; the UCD page reloads every 15 s (up to 10 min in automation)", does: "The e-Invoice button appears only after LHDN validates the e-Invoice.", sources: [mine("knowledge/flow-jomcheck.md §9f item 4")], unconfirmed: true },
        { name: "Resubmit on empty report (proposed)", schedule: "Not defined", does: "EAINT-12386 asks for a cron that resubmits when ezAuto returns an empty report code. Today the UCD gets an empty report and asks for a refund.", sources: [jira("EAINT-12386 description", "2026-10-23")], unconfirmed: true },
      ],
      roles: [
        F("UCD Main and Sub users with JomCheck access. A UCD sees only its own company's transactions.", [mine("knowledge/flow-jomcheck.md §3, §7w"), ts("10937 Configuration")]),
        F("Back Office users can see all companies. Only BO HubAdmin was confirmed to see Resubmit.", [mine("knowledge/flow-jomcheck.md §9g", "2026-10-15")], {
          unconfirmed: true,
          alt: [{ text: "Any logged-in BO user can open the general 'Jomcheck Transaction' enquiry (/view/jomcheck/enquiry/list.do) and resubmit. There is no per-user function gate.", sources: [ask("menu.jsp:404; JomcheckBackofficeController.java:316, 827-867")], note: "prod code says" }],
        }),
        F("UCD listing is limited to the user's branch if the permission flag branchTransactionListingOnly is set. A read-only valuation-advisor mode also exists.", [ask("JomcheckEnquiryController.java:124-133")]),
        F("No public or anonymous access and no AATF role for JomCheck.", [ask("JomCheck controllers")]),
      ],
      afterCompletion: [
        F("UCD JomCheck Transaction Listing (Approved), BO JomCheck Transaction Enquiry and BO Report Listing. Service Portal listing if shared.", [mine("knowledge/flow-jomcheck.md §9h item 12", "2026-10-19"), azfar("knowledge/_core/jomcheck.md")]),
        F("Status path: New → Pending → Approved or Failed. Never Cancelled.", [mine("knowledge/flow-jomcheck.md §9h item 12", "2026-10-19")]),
        F("Prod code: the invoice and e-Invoice message is sent to RabbitMQ (EInvoiceMessager.sendJomcheckMsg) and eauto-einvoice consumes it. The report PDF is stored and downloadable by the owning UCD and BO. The SST/GST payment report and tax invoice are in the BO sst-payment-report pages.", [ask("JomcheckTransactionHandler.java:353-356; JomcheckBackofficeController.java:869-1132")]),
      ],
      rules: [
        F("Fee is RM20.00 + 8% SST = RM21.60. Reports bought before the change keep RM18.", [mine("knowledge/flow-jomcheck.md §4"), ts("EAINT-10089 TS-006..012"), azfar("knowledge/_core/jomcheck.md")]),
        F("Search is exact match. Vehicle number: upper case, special characters removed. Chassis: keeps * / - and spaces, max 30 characters.", [mine("knowledge/flow-jomcheck.md §5a"), ts("EAINT-6475")], {
          alt: [{ text: "EAINT-12386 (requirement refinement) wants special characters such as '-' stripped from the chassis number before sending to JomCheck, and the field length raised to 60 (EAINT-12216, from 2026-10-01).", sources: [jira("EAINT-12386 description", "2026-10-23"), jira("EAINT-12216 description", "2026-10-12")], note: "Newer tickets; not confirmed live." }],
        }),
        F("Resubmit is shown only in Back Office, only for Payment OK + Tx Failed. It is hidden on both sides when Approved, Pending, New, or Payment Failed. UCD never sees it.", [mine("knowledge/flow-jomcheck.md §5a item 3, §9g"), ts("EAINT-9203 TS1-TS16")]),
        F("When ezAuto is down the status is Failed and Pay Now is hidden.", [mine("knowledge/flow-jomcheck.md §5a")], {
          alt: [{ text: "API-down case shows Tx New with 'try again in 10 minutes'; maintenance case shows Tx Pending with the maintenance remark.", sources: [ts("EAINT-9203 TS7"), ts("EAINT-9786 TS2-TS3")], note: "Older workbook text; later behaviour unknown-dated." }],
        }),
        F("Invalid TIN: Invoice only, no e-Invoice. A Failed JomCheck gets no e-Invoice even with a valid TIN. The e-Invoice is created only when Approved.", [mine("knowledge/flow-jomcheck.md §9h items 9, 11", "2026-10-19")], {
          alt: [{ text: "The e-Invoice message is sent on payment, not on approval.", sources: [ask("JomcheckTransactionHandler.java:353-356")], note: "prod code says" }],
        }),
        F("Test limit on the live gateway is 20 reports per day (new JomCheck, API v2.0).", [mine("Faizuddin decision in chat", "2026-10-23"), mine("knowledge/flow-jomcheck.md §7a", "2026-09-30"), teams("EAINT-12339", "2026-09-30")], {
          alt: [{ text: "Live gateway is limited to 10 transactions per day for testing.", sources: [azfar("cr/EAINT-12339/STATUS.md")], note: "older/other version" }],
        }),
        F("A refresh during resubmit does not create a duplicate transaction. A transaction made before an API upgrade, when resubmitted after, gets the latest API data.", [azfar("knowledge/_core/jomcheck.md"), ts("EAINT-8686 TS2")]),
        F("Payment is a simple RHB direct-debit click. No gateway, no QR.", [mine("knowledge/flow-jomcheck.md §7c-i")]),
        F("Statuses (prod code). Transaction: New → Pending (after vendor pre-check) → Approved (paid report retrieved) or Failed (report call fails or is empty). Submission: Submitted → OK or Failed. Payment: Paid is required for resubmit and payment screens. Sharing: DRAFT → SHARED.", [ask("TransactionStatus.java; JomcheckSubmissionStatus.java; JomcheckShareStatus.java; JomcheckTransactionHandler.java")]),
        F("Resubmit in prod code: allowed while the transaction is not Approved and the submission status is not Submitted or OK. The last payment status must be Paid.", [ask("JomcheckTransactionController.java:288-329, 302-306; JomcheckBackofficeController.java:827-867")], {
          alt: [{ text: "Resubmit is shown only for Payment OK + Tx Failed and hidden when Pending or New.", sources: [mine("knowledge/flow-jomcheck.md §5a item 3, §9g"), ts("EAINT-9203 TS1-TS16")], note: "Shown rule; code is wider (not Approved, not Submitted/OK)." }],
        }),
      ],
      scopeToCheck: [
        F("Check purchase by vehicle number and by chassis number, with and without sharing.", [mine("knowledge/flow-jomcheck.md §9e item 9, §9h")]),
        F("Check the price (RM20.00 + 8% Service Tax) on every screen: tile, Purchase Report text, sidebar, result sentence, payment dialog.", [ts("EAINT-10089 TS-005..012")]),
        F("Check the Pay Now dialog text, with none, one and many companies ticked.", [ts("11175_TS15-TS19")]),
        F("Check failed purchase paths: not found, API down, maintenance, payment failed, Payment OK + Tx Failed (set eSim Report Result = Failed).", [mine("knowledge/flow-jomcheck.md §7y"), ts("EAINT-9786"), ts("EAINT-9203")]),
        F("Check the UCD and BO listings and details show the same rows and documents.", [mine("knowledge/flow-jomcheck.md §9e item 9")]),
        F("Check invoice and e-Invoice lines, amounts and that UCD = BO. Check invalid TIN and failed payment (no e-Invoice).", [mine("knowledge/flow-jomcheck.md §9"), ts("TS #079")]),
        F("Check SST Payment Report revenue split, Payment Breakdown Report, Download Payment Document, UCD Payment Report and MyInvois.", [mine("knowledge/flow-jomcheck.md §9h item 13")]),
        F("Check the Transaction Restriction popup on Pay Now and Submit.", [ts("EAINT-9044 JC_TS1-TS3")]),
        F("Check Wholesale chatbot price against the payment page (manual).", [ts("14th Sep TC-01 (12279)")]),
        F("Regression: eSTM and insurance invoices stay unchanged.", [mine("knowledge/flow-jomcheck.md §9 item 6")]),
      ],
      tickets: [
        { key: "EAINT-12339", date: "2026-10", what: "Gateway API v1.9 to v2.0. Deployed S34.4-20261005. 46 official TS. KJ hotfix 2026-10-06 for an invalid JomCheck API result.", state: "latest" },
        { key: "EAINT-12412", date: "2026-10", what: "Invoice and e-Invoice split into 2 lines. Deployed 2026-10-20/21, closed 2026-10-21.", state: "latest" },
        { key: "EAINT-12386", date: "2026-09", what: "Strip special characters from chassis no and auto-resubmit on empty report. Requirement refinement, SRD v0.3 2026-10-23.", state: "latest" },
        { key: "EAINT-12279", date: "2026-09", what: "Wholesale chatbot and payment portal JomCheck price RM18 to RM20. Done 2026-09-15.", state: "latest" },
        { key: "EAINT-12198", date: "2026-08", what: "JomCheck add-on on the Wholesale payment page in every deal state.", state: "latest" },
        { key: "EAINT-12290", date: "2026-09", what: "Payment collected and final submission OK but e-Invoice not sent. Done 2026-09-07.", state: "latest" },
        { key: "EAINT-10089", date: "2026-03", what: "Price RM18 to RM20 and the share checkbox.", state: "legacy", supersededBy: "EAINT-12279" },
        { key: "EAINT-9786", date: "2026-03", what: "ezAuto maintenance popup (Technical Spec 1.6-1.7).", state: "latest" },
        { key: "EAINT-9203", date: "2025-12", what: "Resubmit visibility rules (BO only for Payment OK + Tx Failed). Live S24.1-20251203.", state: "latest" },
        { key: "EAINT-8686", date: "2025-10", what: "ClaimInfoExtra and duplicate-submission fix (spec 1.4).", state: "legacy" },
        { key: "EAINT-8687", date: "2025-10", what: "Duplicate-submission fix.", state: "legacy" },
        { key: "EAINT-6475", what: "Search by chassis number as well as vehicle number.", state: "legacy" },
        { key: "EAINT-9044", what: "Transaction Restriction popup across modules.", state: "latest" },
      ],
      openQuestions: [
        "Whether eSim can return a failed retrieval or a maintenance response (Azfar: Q-ESIM-FAIL).",
        "Which endpoint (V1.9 or V2.0) eAuto calls. The ezAuto spec version and the endpoint version differ.",
        "Prod code shows a director SMS OTP step before payment. Confirm it is live on staging and add it to the UCD steps.",
        "Prod code sends the e-Invoice message on payment, the shown notes say on Approved. Confirm which is true.",
      ],
    },

    // ---------------------------------------------------------------- 2. Sharing
    {
      id: "share-with-credit-company",
      name: "Share a report with a bank or credit company",
      summary: "A UCD can share a purchased report with a bank or credit company for 30 days. Back Office must first allow the credit company to receive shared reports.",
      portals: ["UCD portal", "Back Office", "Service Portal"],
      triggers: [
        {
          id: "tick-at-purchase",
          name: "Tick the company at purchase",
          entry: "UCD › Get JomCheck Report › 'Share Report with Financial Institution (Bank and Credit Company) (Optional)' checkboxes",
          sources: [mine("knowledge/flow-jomcheck.md §3, §5a item 5"), ts("10937_E2E_TS01")],
          steps: [
            S("BO allows the credit company to receive shared reports", [mine("knowledge/flow-jomcheck.md §3"), ts("11175_TS04")], {
              where: "Back Office › Manage Bank/Credit Company Accounts › tick 'Allow UCD to share JomCheck Report' › Save",
              detail: "Two siblings sit beside it: 'Allow Login to Service Portal' and 'Allow Bypass Whitelisting Feature'. Defaults on a new account: Full Enquiry ticked, Share JomCheck unticked, Allow Login ticked, Bypass unticked.",
              affects: ["Service Portal login"],
            }),
            S("UCD ticks one or more companies and pays", [mine("knowledge/flow-jomcheck.md §5a item 5")], {
              where: "UCD › Get JomCheck Report page",
              detail: "The section shows 'until {date d+30}'. After payment, the report appears in that company's Service Portal listing. Revoking a company in BO hides it from the UCD after refresh.",
              branches: [{ when: "No credit company is allowed in BO", then: "The sharing section is hidden." }],
              affects: ["Service Portal JomCheck Report Listing"],
            }),
          ],
        },
        {
          id: "share-after-purchase",
          name: "Share later from the Transaction Details",
          entry: "UCD › JomCheck Transaction Details › Share button",
          sources: [ts("10937_E2E_TS04, TS06")],
          steps: [
            S("Click Share for a company not ticked earlier", [ts("11175_TS15-TS19"), ts("10937_E2E_TS04")], {
              where: "UCD › JomCheck Transaction Details › Share",
              detail: "Allowed up to 30 days after purchase. Shows 'Shared on dd-mm-yyyy'. If two UCDs share the same vehicle or chassis at the same time, the first one wins.",
            }),
          ],
        },
        {
          id: "credit-partner-api",
          name: "Credit-company partner API (prod code)",
          entry: "POST /oapi/v1/jomcheck-report and GET /oapi/v1/jomcheck-report/doc/{id} in eauto-service-api",
          summary: "External API for credit-company partners. It reads shared reports only.",
          sources: [ask("JomcheckReportController.kt:72; JomcheckDocumentController.kt:36")],
          steps: [
            S("Partner sends a signed (HMAC) request", [ask("JomcheckReportController.kt:125; CapabilityIds.kt:5")], { detail: "The partner credential must be scoped to the jomcheck capability." }),
            S("Service reads shared reports from a MySQL replica", [ask("JomcheckReadRepository.kt:33-40")], { detail: "Reads the JomCheck and jomcheckreportcreditshare tables. Only SHARED reports inside the 30-day window are returned." }),
          ],
        },
      ],
      affects: [
        F("Service Portal listing is visible to every credit company, but View, Export, Export to Excel and bulk download are limited to a named user list. Otherwise a credit company sees only reports SHARED with it.", [ask("ServicePortalController.java:192-261, 346; AuthorizedUserList.java:79")]),
        F("Service Portal JomCheck Report Listing, Ownership Claim Listing and Details (JomCheck = YES, latest report).", [ts("10937_E2E_TS15")]),
        F("The sharing date is checked again on every access to the report (EAINT-12345, S33.7-20260917).", [azfar("knowledge/_core/jomcheck.md")]),
      ],
      cronjobs: [],
      roles: [
        F("A bank or credit company sees a report only if the UCD shared it AND BO ticked 'Allow UCD to share JomCheck Report' on that company's account.", [mine("knowledge/flow-jomcheck.md §3")]),
        F("Test accounts: superadmin (sees JomCheck = YES and Latest JomCheck Report differently from a credit-company account) and credit companies X-Star and Carsome.", [mine("knowledge/flow-jomcheck.md §3"), ts("10937 Configuration")]),
      ],
      afterCompletion: [F("The report is listed in the Service Portal for the chosen companies until the sharing window ends.", [mine("knowledge/flow-jomcheck.md §3")])],
      rules: [
        F("Sharing window is 30 days from purchase.", [mine("knowledge/flow-jomcheck.md §3"), ts("EAINT-10089 / 10937 TS")], {
          alt: [{ text: "Sharing window was 14 days in EAINT-10089 SRD v0.1.", sources: [mine("knowledge/flow-jomcheck.md §3")], note: "Older revision; v1.1 of 10089 and 10937 say 30 days. Confirm before writing a TS that depends on it." }],
        }),
        F("Reports bought through Wholesale and reports bought before the 2026-06-10 deployment do not show sharing.", [ts("10937 TS")]),
        F("Only reports purchased after EAINT-10937's deployment appear in the Service Portal.", [azfar("knowledge/_core/jomcheck.md")]),
      ],
      scopeToCheck: [
        F("Check one company and many companies; none ticked; ticks kept after a failed payment and retry.", [ts("10937 sections")]),
        F("Check BO permission add and revoke, and that the UCD page follows after refresh.", [ts("11175_TS04")]),
        F("Check the 30-day window edges and the Share button after purchase.", [ts("10937_E2E_TS04, TS06")]),
        F("Check the Service Portal listing shows only shared reports.", [mine("knowledge/flow-service-portal-shell.md §6")]),
        F("Check two UCDs sharing the same vehicle at the same time.", [ts("10937 TS")]),
      ],
      tickets: [
        { key: "EAINT-10937", date: "2026-04", what: "Service Portal JomCheck Report Access and Listing. Deployed 2026-06-10 (S33.5-20260914 per Azfar). 109 TS.", state: "latest" },
        { key: "EAINT-11175", what: "Three new checkboxes on the Bank/Credit Company account page.", state: "latest" },
        { key: "EAINT-10089", date: "2026-03", what: "Share checkbox added with the price rise.", state: "legacy", supersededBy: "EAINT-10937" },
        { key: "EAINT-12345", date: "2026-09", what: "Sharing date re-checked on every access.", state: "latest" },
      ],
      openQuestions: ["Credit Company, Total Loss History and Windscreen Claim columns are in no SRD (Azfar)."],
    },

    // ---------------------------------------------------------------- 3. BO enquiry and resubmit
    {
      id: "bo-enquiry-resubmit",
      name: "Back Office JomCheck Transaction Enquiry and Resubmit",
      summary: "Back Office finds a transaction, opens its documents, and resubmits a failed one (Payment OK + Tx Failed).",
      portals: ["Back Office"],
      triggers: [
        {
          id: "bo-transaction-menu",
          name: "BO menu: Jomcheck Transaction",
          entry: "BO home /home/ › Transactions Relevant › Jomcheck Transaction (/view/jomcheck/enquiry)",
          sources: [mine("knowledge/flow-jomcheck.md §7c, §9g", "2026-10-15")],
          steps: [
            S("Filter the transactions", [mine("knowledge/flow-jomcheck.md §7w, §10c")], {
              where: "BO › Jomcheck Transaction",
              detail: "Filters: vehicle, chassis, ref no, Created At From and To (read-only date pickers, max one month), Trx status (New, Pending, Approved, Failed), Payment From and To. Payment To defaults to today, no future dates, and not after 30 days from From.",
            }),
            S("Read the result table", [mine("knowledge/flow-jomcheck.md §10d")], {
              detail: "Columns: # / Company Name / Company ROC / Vehicle / Chassis No / Transaction No. / Created At / Method / Payment / Tx Status / LHDN Response Status / Remarks / Special Remarks / Action.",
            }),
            S("Click Resubmit on a failed row", [mine("knowledge/flow-jomcheck.md §9g, §9h item 7", "2026-10-19")], {
              where: "Row › Resubmit (a.to-resubmit). Not on the details page",
              detail: "Shown for Payment OK + Tx Failed + LHDN '-' + Remarks 'Failed to retrieve report'. Prompt 'Sure to resubmit?' then 'Succesfully resubmit.' The row turns Approved in about 5 minutes.",
              affects: ["Invoice and e-Invoice (made only on Approved)", "UCD JomCheck Transaction Listing"],
              branches: [{ when: "Resubmit fails again", then: "Row stays Failed and Resubmit stays in BO." }],
            }),
            S("Open View for the documents", [mine("knowledge/flow-jomcheck.md §7c")], {
              where: "Row › View (opens a new tab, /view/jomcheck/enquiry/view.do)",
              detail: "Invoice, e-Invoice and Report buttons, and a Special Remark box.",
            }),
          ],
        },
        {
          id: "bo-invoice-support",
          name: "BO support: invoice check on a resubmitted transaction",
          entry: "BackOffice › Jomcheck Transaction Enquiry › Resubmit; View › Invoice",
          sources: [jira("EAINT-12554 description")],
          steps: [
            S("Resubmit an old failed transaction after the 12412 push and open its invoice", [jira("EAINT-12554 description")], {
              detail: "QA-Issue 12554 expects the invoice to show 2 lines (SRD v1.0 REQ-001 Example 3: approval date decides).",
            }),
          ],
        },
      ],
      affects: [
        F("UCD copy of the same transaction and documents; Invoice and e-Invoice generated only on Approved.", [mine("knowledge/flow-jomcheck.md §9h")]),
      ],
      cronjobs: [],
      roles: [
        F("BO HubAdmin sees Resubmit (confirmed from capture).", [mine("knowledge/flow-jomcheck.md §9g")]),
        F("Finance-flagged BO users can use Cancel Invoice (SST Payment Report).", [mine("knowledge/flow-jomcheck.md §10b")]),
      ],
      afterCompletion: [F("Approved row in BO Enquiry and in the UCD listing.", [mine("knowledge/flow-jomcheck.md §9g")])],
      rules: [
        F("Resubmit is existing behaviour (EAINT-9203), not part of 12412.", [mine("knowledge/flow-jomcheck.md §9g")]),
        F("BO sees all companies, UCD only its own.", [mine("knowledge/flow-jomcheck.md §7w item 10")]),
        F("Old transactions: invoice downloaded again still shows 1 line; the e-Invoice is not resubmitted.", [mine("knowledge/flow-jomcheck.md §9 item 3")], {
          alt: [{ text: "Live run 2026-10-19: a pre-deploy payment approved after deploy showed 1 invoice line and 2 e-Invoice lines, while SRD REQ-001 Example 3 expects 2 on both.", sources: [mine("knowledge/flow-jomcheck.md §9h item 7", "2026-10-19"), jira("EAINT-12554")], note: "Open defect (QA-Issue 12554)." }],
        }),
      ],
      scopeToCheck: [
        F("Check Resubmit visibility for every Payment x Tx status x LHDN status combination (EAINT-9203 matrix).", [ts("EAINT-9203 TS1-TS16")]),
        F("Check the invoice and e-Invoice line count after resubmit.", [mine("knowledge/flow-jomcheck.md §9h")]),
        F("Check the one-month date rule and BO date picker limits.", [ts("EAINT-1245 TS1-TS5")]),
      ],
      tickets: [
        { key: "EAINT-9203", date: "2025-12", what: "Resubmit visibility rules.", state: "latest" },
        { key: "EAINT-12412", date: "2026-10", what: "Uses Resubmit for TS09.", state: "latest" },
        { key: "EAINT-12554", date: "2026-10", what: "QA-Issue: old failed transactions resubmitted after the push should show 2 lines.", state: "latest" },
        { key: "EAINT-1245", what: "Payment To date picker fine-tuning (default today, no future, max 30 days).", state: "latest" },
      ],
      openQuestions: ["Whether BO roles other than HubAdmin can use Resubmit.", "What exactly happens after the Resubmit click is only known from observed prompts."],
    },

    // ---------------------------------------------------------------- 4. BO report listing
    {
      id: "bo-report-listing",
      name: "Back Office JomCheck Report Listing and export",
      summary: "A read-only listing of report data (29 columns since EAINT-12339) with an Excel export.",
      portals: ["Back Office"],
      triggers: [
        {
          id: "bo-settings-menu",
          name: "BO menu: Settings (Hub Admin) › JomCheck Report Listing",
          entry: "BO home › Settings (Hub Admin) › JomCheck Report Listing (/view/jomcheck/report-listing/index.do)",
          sources: [mine("knowledge/flow-jomcheck.md §7c", "2026-09-30"), azfar("knowledge/_core/jomcheck.md#BackOffice: JomCheck Report Listing")],
          steps: [
            S("Enter Vehicle No or Chassis No and click Search", [mine("knowledge/flow-jomcheck.md §7s item 6, §10c")], {
              where: "BO › JomCheck Report Listing (#vehicleNo / #chassisNo, #to-search)",
              detail: "Typing one field disables the other. Search is exact match.",
              branches: [{ when: "No match", then: "Message 'No records found. Please ensure there are existing JomCheck report purchase records.' or '0 record(s) in total'." }],
            }),
            S("Read the columns", [mine("knowledge/flow-jomcheck.md §10d")], {
              detail: "29 columns. New in v2.0: Possible Total Loss and Possible BER (between the Total Loss History columns), Odometer Reading as a 10,000 km range, Type of Claim from ClaimsType, Total No. of Parts Approved for Change as a range. Multi-claim cells show '1. value<br>2. value' in one cell.",
              affects: ["ezAuto API v2.0 data"],
            }),
            S("Click Export", [mine("knowledge/flow-jomcheck.md §5a item 2, §10c")], {
              where: "Export (#to-export)",
              detail: "Downloads Excel JomCheck_Report_DDMMYYYY_HHMM.xlsx. Azfar notes an audit log of search and export with the BO username.",
            }),
          ],
        },
      ],
      affects: [F("Backend audit log of search and export (TS34 page unknown, deprioritised).", [azfar("knowledge/_core/jomcheck.md"), mine("knowledge/flow-jomcheck.md §7v")], { unconfirmed: true })],
      cronjobs: [],
      roles: [
        F("BO accounts that have the Report Listing menu (under Settings (Hub Admin)). Others do not see it. The default test account faizuddinBO1 lacks the menu.", [mine("knowledge/flow-jomcheck.md §10b"), ts("EAINT-8638 TS #073")], {
          alt: [{ text: "Only 9 named users from SRD 8638 (kmcheah, mfizni, eautonurul, eautosoyeng, eautokelvin, nikmuhamad, mfared, eautohaffiz, eautozara). jasons also works on staging although not on the SRD list.", sources: [azfar("knowledge/_core/roles-and-accounts.md#JomCheck")], note: "Staging may differ from the production list." }],
        }),
      ],
      afterCompletion: [F("Read-only. Nothing moves after the search or export.", [mine("knowledge/flow-jomcheck.md")])],
      rules: [
        F("Claim Type (ICAP) codes 1-19, 30 and 31 map to text; null shows '-'. Possible Total Loss and BER are BO only. Deprecated fields (ClaimType, ApprovedParts, Mileage) return 'N/A'.", [mine("knowledge/flow-jomcheck.md §10e, §10a"), jira("EAINT-12339 description")]),
        F("Odometer shows ranges such as '0 to 10,000 km' and 'More than 300,000 km'; null shows 'Not Specified'. Parts shows '1 to 10 parts' ... 'More than 100 parts'; blank shows 'No information available.'", [ts("12339_TS04-TS43")], {
          alt: [{ text: "SRD wording is '0 to 10 parts' in one place and '1 to 10 parts' in another.", sources: [azfar("knowledge/portals/backoffice/open-questions.md")], note: "Open wording difference." }],
        }),
        F("Column count is 29 after EAINT-12339.", [mine("knowledge/flow-jomcheck.md §10d"), ts("12339 TS")], {
          alt: [{ text: "27 columns before EAINT-12339, 29 after. uat1 already showed 29 columns and N/A before the deploy (Q-UAT1-BUILD).", sources: [azfar("cr/EAINT-12339/STATUS.md")], note: "Azfar's open question about the uat1 build." }],
        }),
        F("Without a claim, per-claim columns show '-'; Total Loss, Flood and Windscreen show 'NO RECORD FOUND'; Last Mileage '0'; State in Malaysia always '-'.", [azfar("knowledge/_core/jomcheck.md")]),
        F("Transactions before the v2.0 deploy show 'N/A' for the new fields. A pre-deploy transaction resubmitted in BO after the deploy gets the new values (QA reading of earlier CRs, not in SRD v1.0).", [azfar("knowledge/_core/jomcheck.md")], { unconfirmed: true }),
      ],
      scopeToCheck: [
        F("Check new-field values against the eSim claims (TS05-TS19 boundaries).", [mine("knowledge/flow-jomcheck.md §7i")]),
        F("Check old and new transactions, exported file content, and the position of Possible Total Loss and BER.", [mine("knowledge/flow-jomcheck.md §10d")]),
        F("Check one filter at a time, exact match, and the empty result text.", [ts("12339 regression"), ts("EAINT-8638 SnF_TS1, TS15")]),
        F("Check role visibility of the menu.", [ts("EAINT-8638 TS #073")]),
      ],
      tickets: [
        { key: "EAINT-12339", date: "2026-10", what: "Adds 2 columns (29) and re-sources three fields.", state: "latest" },
        { key: "EAINT-8638", date: "2025-08", what: "Created the BO JomCheck Report Listing. Live S28.4-20260415.", state: "legacy", supersededBy: "EAINT-12339" },
        { key: "EAINT-10922", date: "2026-04", what: "Relabelled pricing columns. Note under listing 'Before 22 April 2026 ...'.", state: "legacy" },
        { key: "EAINT-10493", what: "Bug for special characters found in 8638 testing.", state: "legacy" },
      ],
      openQuestions: [
        "ICAP codes 20-29 and a null in the middle of a list are undefined.",
        "Severity band order: SRD REQ-008 (Severe, Critical, Catastrophic, High, Medium, Low) differs from the mock-up and live page (Severe, High, Medium, Low, Critical, Catastrophic). Needs a BA decision.",
        "Mock-up row 'Possible Total Loss = Yes' for ICAP code 1 contradicts SRD REQ-004 (code 16 only).",
      ],
    },

    // ---------------------------------------------------------------- 5. Gateway v2.0 fields
    {
      id: "gateway-v2-report-fields",
      name: "Gateway API v1.9 to v2.0: where the new report fields show",
      summary: "EAINT-12339 re-sources report fields from the ezAuto API v2.0. The same data shows in the UCD report PDF, the BO listing, the Service Portal listing, the open API and the Wholesale flow.",
      portals: ["UCD portal", "Back Office", "Service Portal", "Wholesale chatbot (manual)", "eAuto open API"],
      triggers: [
        {
          id: "ucd-report-download",
          name: "UCD downloads the report",
          entry: "UCD › JomCheck Report › Get JomCheck Report › Pay Now › JomCheck Details › Download Report",
          sources: [ts("12339_TS01, TS03"), mine("knowledge/flow-jomcheck.md §7a")],
          steps: [
            S("Buy a report", [ts("12339 Golden Rule, TS01")], {
              detail: "Test rule: eSim connected → PDF is a dummy, so cross-check the listing against eSim. API connected → PDF is real but the results are random.",
            }),
            S("Check the report fields", [ts("12339_TS04-TS43"), mine("knowledge/flow-jomcheck.md §4, §10a")], {
              detail: "Odometer from MileageRange, Type of Claim from ClaimsType, Parts from TotalPartsChanged, Possible Total Loss and Possible BER at vehicle level, severity bands increased from 4 to 6 (LOW 1-5%, MEDIUM 6-15%, HIGH 16-30%, SEVERE 31-50%, CRITICAL 51-70%, CATASTROPHIC over 70%).",
            }),
          ],
        },
        {
          id: "bo-listing",
          name: "BO listing, export and Transaction Details",
          entry: "BO › JomCheck Report Listing (+ Export, Transaction Details)",
          sources: [ts("12339 sections B, D, E")],
          steps: [S("Compare the BO listing with the eSim claims", [ts("12339 B, D, E")], { detail: "See the BO Report Listing flow for the 29 columns." })],
        },
        {
          id: "sp-listing",
          name: "Service Portal listing, export and bulk download",
          entry: "Service Portal › Hire Purchase Ownership › JomCheck Report Listing",
          sources: [ts("12339_TS37")],
          steps: [S("Check the six severity counters and the missing columns", [ts("12339_TS37"), mine("knowledge/flow-jomcheck.md §4")], { detail: "Service Portal shows 6 severity counters and no Possible Total Loss, Possible BER, Type of Claim, Odometer or Parts columns." })],
        },
        {
          id: "wholesale-purchase",
          name: "Wholesale chatbot purchase (manual)",
          entry: "WhatsApp chatbot › JomCheck purchase",
          sources: [ts("12339_TS40"), mine("knowledge/flow-jomcheck.md §2")],
          steps: [S("Buy through the chatbot and check the downloaded report", [ts("12339_TS40")], { detail: "Reports paid before the CR download the OLD report unchanged." })],
        },
        {
          id: "api-contract",
          name: "API response contract check",
          entry: "eAuto JomCheck open API response (7 new fields, deprecated fields kept)",
          sources: [ts("12339_TS43")],
          steps: [S("Check the response has the 7 new fields and keeps the deprecated ones", [ts("12339_TS43")], { detail: "Deprecated ClaimType, ApprovedParts and Mileage return 'N/A' or null." })],
        },
      ],
      affects: [
        F("The open API for credit companies is NOT changed by 12339 (left for 'the next round'). After 12339, claimType, approvedParts and mileage may be 'N/A' or null.", [azfar("knowledge/_core/jomcheck.md")]),
        F("Whether Wholesale 2.0 and the eAuto mobile app JomCheck (7616-7618) read ClaimType, ApprovedParts or Mileage is unknown.", [azfar("knowledge/_core/jomcheck.md")], { unconfirmed: true }),
      ],
      cronjobs: [],
      roles: [F("UCD, BO, Service Portal credit-company users and superadmin (eAuto Sdn Bhd), Wholesale buyer.", [ts("12339_TS38")])],
      afterCompletion: [F("JomCheck Listing (UCD and BO) and the Service Portal listing.", [ts("12339")])],
      rules: [
        F("Prod code (prod/master, 2026-10-22): JomCheck Gateway v2.0 (EAINT-12339) is live. A dated migration and matching code (vehicle search handler, transaction and claim models, search indexing, report listing screen) are tagged to EAINT-12339. They replace the old claim type, mileage and approved parts fields with the v2.0 fields and add vehicle roll-up flags (accident count, flood history, total-loss history). It is wired into the live JomCheck transaction handler, not a parked branch.", [ask("JomCheck v2.0 live answer (prod/master 2026-10-22)")]),
        F("Prod code did not check whether the live vendor connection itself is switched to v2.0 or still 1.9. That depends on the simulator / connection-mode setting, which the answer did not read.", [ask("JomCheck v2.0 live answer (prod/master 2026-10-22)")], { unconfirmed: true }),
        F("ezAuto upgraded from v1.9 to v2.0 on the night of 2026-10-05 (ezAuto done 11:30pm). Staging was updated earlier.", [mine("knowledge/flow-jomcheck.md §1"), jira("EAINT-12339 description row 3")]),
        F("Possible Total Loss is Yes only for ICAP code 16 (Actual Total Loss). It is vehicle level: Yes if any claim qualifies.", [mine("knowledge/flow-jomcheck.md §4, §6"), ts("12339 Field Reference")]),
        F("Severity bands: SRD REQ-008 order is Severe, Critical, Catastrophic, High, Medium, Low. The live Service Portal and mock-up show Severe, High, Medium, Low, Critical, Catastrophic.", [mine("knowledge/flow-jomcheck.md §6")], {
          alt: [{ text: "After 12339 the Service Portal shows 6 counters in order Severe, Critical, Catastrophic, High, Medium, Low. Before: SRD 10937 v1.2 said 3 counters, the workbook 4.", sources: [azfar("knowledge/portals/service-portal/open-questions.md")], note: "Azfar's order follows the SRD; Faizuddin saw the live page." }],
        }),
        F("The price prompt stays RM20 + 8% after the upgrade.", [ts("12339 TS")]),
        F("Credit-company sharing scenarios are regression only for 12339 (Faizuddin 2026-09-29). TS were renumbered twice: 49 on 2026-10-01, then 46 on 2026-10-05 (TS34 audit log deprioritised).", [mine("knowledge/flow-jomcheck.md §7l, §7s")]),
      ],
      scopeToCheck: [
        F("Check UCD purchase and report, BO listing, export and details, for old and new transactions.", [ts("12339 sections A-I")]),
        F("Check the Service Portal 6 counters and absent columns.", [ts("12339_TS37-TS39")]),
        F("Check Wholesale purchase (manual) and the API v2.0 contract.", [ts("12339_TS40, TS43")]),
        F("Regression: latest report shown, one filter at a time, '0 record(s) in total'.", [ts("12339 regression")]),
      ],
      tickets: [
        { key: "EAINT-12339", date: "2026-10", what: "Gateway API v1.9 to v2.0.", state: "latest" },
        { key: "EAINT-10922", date: "2026-04", what: "Pricing label spec 1.9.", state: "legacy" },
      ],
      openQuestions: [
        "Whether the 12339 deploy also needs the open API changed ('next round').",
        "Is the live vendor connection switched to v2.0 (not 1.9)? Prod code shows the v2.0 code is live, but the connection-mode setting was not read.",
        "Azfar's ezAuto spec version vs endpoint version (spec 1.9 = endpoints V1.8/V1.9; spec 2.0 = V1.8/V2.0).",
      ],
    },

    // ---------------------------------------------------------------- 6. Invoice split
    {
      id: "invoice-and-einvoice",
      name: "JomCheck invoice and e-Invoice (split into 2 lines)",
      summary: "After an Approved purchase the system makes an invoice and an e-Invoice. Since EAINT-12412 each shows two lines: RM18 and RM2, each with 8% SST. The total stays RM21.60.",
      portals: ["UCD portal", "Back Office", "LHDN MyInvois"],
      triggers: [
        {
          id: "approved-transaction",
          name: "Transaction becomes Approved",
          entry: "UCD or BO › JomCheck Transaction Details › Print Invoice / Print e-Invoice",
          sources: [mine("knowledge/flow-jomcheck.md §9", "2026-10-19"), jira("EAINT-12412 description")],
          steps: [
            S("The approval date and time decide the layout", [mine("knowledge/flow-jomcheck.md §9 item 3")], {
              detail: "Approved after deployment = 2 lines, even if paid before. Old invoices downloaded again keep 1 line. The e-Invoice is not resubmitted.",
            }),
            S("Invoice shows line 1 and line 2", [mine("knowledge/flow-jomcheck.md §9 item 7", "2026-10-15"), jira("EAINT-12412 description row 5")], {
              where: "UCD/BO Details › Print Invoice (#to-print-invoice)",
              detail: "Line 1 'JomCheck report' RM18.00 + SST RM1.44 = RM19.44. Line 2 'JomCheck service charge' RM2.00 + SST RM0.16 = RM2.16. Subtotal RM20.00, tax RM1.60, total RM21.60. Both lines use e-Invoice classification code 022.",
              affects: ["LHDN MyInvois"],
            }),
            S("e-Invoice is sent to LHDN", [mine("knowledge/flow-jomcheck.md §9f")], {
              where: "Details › Print e-Invoice (#to-print-e-invoice)",
              detail: "The button appears only after LHDN validation. UCD and BO documents must match (REQ-005).",
              branches: [
                { when: "TIN invalid or blank", then: "Invoice only, no e-Invoice. Report is still OK." },
                { when: "Transaction Failed", then: "No e-Invoice, even with a valid TIN." },
              ],
            }),
          ],
        },
      ],
      affects: [
        F("Prod code: the JomCheck payment record keeps two subtotal amounts (eAuto and partner). A dedicated JomCheck e-invoice line builder makes exactly two lines (report charge and service charge) whenever a stored service charge split amount is present. The amounts and tax rate are not hard-coded as RM18 and RM2; they come from a configurable price table.", [ask("JomCheck v2.0 live answer (prod/master 2026-10-22)")]),
        F("Prod code: the split is defensive. If the stored service charge is missing, zero, negative, larger than the subtotal, or the two tax rates differ, the builder silently falls back to ONE invoice line. So two lines on the invoice depend on the price table being set up right, not only on the code.", [ask("JomCheck v2.0 live answer (prod/master 2026-10-22)")]),
        F("Revenue split is not changed: eAuto RM6 and ezAUTO Asia RM14 in the revenue, SST and e-Invoice reports. The RM2 eAuto line on the invoice and the RM6 in reports are meant to differ.", [mine("knowledge/flow-jomcheck.md §9 item 4"), jira("EAINT-12412 description")]),
        F("Screen price stays 'RM20.00 + 8% Service Tax'. UCD and BO screens do not show the breakdown.", [mine("knowledge/flow-jomcheck.md §9b Q6")]),
        F("Consolidated e-Invoice and the invoice listing.", [azfar("knowledge/_core/jomcheck.md")]),
      ],
      cronjobs: [
        { name: "Monthly consolidated e-Invoice job (EAINT-9845)", schedule: "Monthly (live S27.6-20260318)", does: "Resubmits LHDN-failed e-Invoices as a consolidated e-Invoice. Testing needs a Dev trigger or a month-end wait. JomCheck-specific cronjob unknown.", sources: [azfar("cr/EAINT-12022/01-research/study.md")] },
      ],
      roles: [F("UCD users and BO users view their invoices. Finance-flagged BO users can Cancel Invoice in the SST Payment Report.", [mine("knowledge/flow-jomcheck.md §10b")])],
      afterCompletion: [F("Invoice and e-Invoice listings, SST Payment Report and MyInvois.", [mine("knowledge/flow-jomcheck.md §9h item 13")])],
      rules: [
        F("Line names are 'JomCheck report' (RM18) and 'JomCheck service charge' (RM2). Settled 2026-10-15; the SRD PDF re-uploaded 2026-10-09 carries the renamed lines.", [mine("knowledge/flow-jomcheck.md §9 item 7", "2026-10-15")], {
          alt: [{ text: "Line names 'JomCheck Service Charge' and 'eAuto Service Charge' (ticket title and the first v1.0 PDF; BA answer Q3 on 2026-09-29).", sources: [jira("EAINT-12412 summary"), azfar("knowledge/_core/jomcheck.md")], note: "Older wording. The first PDF was not regenerated after v0.3." }],
        }),
        F("Document Code runs in sequence with no skipped numbers across all modules, including failed e-Invoices (EAINT-8659). Classification code 022 is used for SSM and JomCheck lines.", [mine("knowledge/business-rules-from-test-scenarios.md")]),
        F("Dev says other products that share the e-Invoice code (eSTM, insurance, APT) do not change.", [mine("knowledge/flow-jomcheck.md §9 item 6", "2026-09-28")], { unconfirmed: true }),
        F("Invoices from before July 2025 keep their old layout.", [mine("knowledge/flow-jomcheck.md §9 item 6")], { unconfirmed: true }),
        F("An e-Invoice not sent after payment collected and final submission OK was a bug fixed in EAINT-12290.", [jira("EAINT-12290 summary", "2026-09-07")]),
      ],
      scopeToCheck: [
        F("Check invoice and e-Invoice lines, amounts and tax for a new Approved transaction.", [mine("knowledge/flow-jomcheck.md §9e item 9")]),
        F("Check a transaction created before deploy and approved after, and one approved before.", [mine("knowledge/flow-jomcheck.md §9 item 3")]),
        F("Check UCD invoice = BO invoice.", [mine("knowledge/flow-jomcheck.md §9 item 5")]),
        F("Check invalid TIN and failed JomCheck.", [mine("knowledge/flow-jomcheck.md §9h items 9, 11")]),
        F("Check the SST Payment Report, revenue report and Payment Breakdown stay unchanged (eAuto RM6, ezAUTO Asia RM14).", [mine("knowledge/flow-jomcheck.md §9 item 4")]),
        F("Check eSTM, insurance and APT invoices have no change.", [mine("knowledge/flow-jomcheck.md §9 item 6")]),
      ],
      tickets: [
        { key: "EAINT-12412", date: "2026-10", what: "Split invoice and e-Invoice charge. Deployed 2026-10-20/21.", state: "latest" },
        { key: "EAINT-12290", date: "2026-09", what: "e-Invoice not sent after payment collected.", state: "latest" },
        { key: "EAINT-9845", date: "2026-03", what: "Monthly consolidated e-Invoice resubmission cronjob.", state: "latest" },
      ],
      openQuestions: [
        "Live run 2026-10-19: invoice stayed at 1 line while the e-Invoice had 2 for a pre-deploy payment approved after deploy. SRD REQ-001 Example 3 expects 2 on both. To raise with dev and BA.",
        "12412 environment: lives on /uat1, not /eauto (verified live 2026-10-19).",
      ],
    },

    // ---------------------------------------------------------------- 7. Open API
    {
      id: "credit-company-api",
      name: "eAuto JomCheck open API for credit companies",
      summary: "A credit company system calls a signed API to get the report of a vehicle that a UCD shared with it. The API returns a link to the report, not the PDF.",
      portals: ["eAuto open API", "API partner console"],
      triggers: [
        {
          id: "api-call",
          name: "Credit company calls the report API",
          entry: "POST /oapi/v1/jomcheck-report (RS256 signed request, ucdBrn)",
          sources: [azfar("knowledge/_core/jomcheck.md#eAuto JomCheck open API"), ts("EAINT-11757 TC-01a")],
          steps: [
            S("Admin provisions the partner", [ts("EAINT-11757 TC-00a-d")], {
              where: "Staging tester console /v1/test/console › Capabilities › JomCheck Report › Partners › '+ Provision a partner'",
              detail: "Search first to avoid a duplicate. Provision as Credit Company, generate keypair, download the .pem, tick delivered, confirm delivered and activate (key ACTIVE). Cancelling before that discards the credential.",
              affects: ["Credential audit log (COMPANY_CREATED, CREDENTIAL_ISSUED)"],
            }),
            S("UCD buys a report and shares it with that company", [ts("EAINT-11757 TC-01a")]),
            S("Partner sends a signed request", [ts("EAINT-11757 TC-01a, TC-02..TC-29")], {
              detail: "Needs vehicleNo and ucdBrn (max 20 characters). The timestamp must be within 5 minutes. Success is HTTP 200 with documentUrl and documentUrlExpiresAt. The newest Approved report wins.",
              branches: [
                { when: "Signature, key id, timestamp or body is wrong", then: "Identical generic HTTP 401." },
                { when: "Rate limit reached", then: "HTTP 429 on the report endpoint only; recovers after the window." },
                { when: "Report was shared a moment ago", then: "May return 404 briefly because of replication lag. Retry." },
              ],
            }),
          ],
        },
      ],
      affects: [F("Credit companies' own systems. Only reports that are Approved AND shared to that company are returned.", [ts("EAINT-11757 TC-13, TC-14, TC-27")])],
      cronjobs: [],
      roles: [F("Provisioned credit-company partners; an admin console user provisions them.", [ts("EAINT-11757 TC-00f"), azfar("cr/EAINT-11757/LEDGER.md")])],
      afterCompletion: [F("Report JSON with a time-limited documentUrl. No PDF inside the JSON.", [ts("EAINT-11757 TC-01a")])],
      rules: [
        F("Keys are RS256 RSA-3072. Rotation asks for confirmation; the old key becomes Expiring then Revoked, and a revoked key must fail.", [ts("EAINT-11757 TC-08c-R"), mine("knowledge/business-rules-from-test-scenarios.md §5")]),
        F("Tampered, other-document or expired document links are rejected.", [ts("EAINT-11757 TC-02..TC-29")]),
        F("Claim fields are passed as strings (claimType is not a fixed list, approvedParts is a count or text). Vehicle level: maxSeverity, totalLossHistory, latestMileage, latestMileageDate.", [azfar("cr/EAINT-11757/LEDGER.md")]),
        F("The API is not changed by EAINT-12339.", [azfar("knowledge/_core/jomcheck.md")]),
      ],
      scopeToCheck: [
        F("Check provisioning, happy path, input validation, auth failures, report lookup, response content, document link security, rate limit and E2E edge cases (38 TS: 34 in scope, 33 pass, 1 not run).", [ts("EAINT-11757 Progress Tracker")]),
        F("Regression after the key-delivery change: TC-01a-R, TC-08c-R (14th Sep).", [ts("EAINT-11757 regression 2026-09-14")]),
      ],
      tickets: [
        { key: "EAINT-11757", date: "2026-06", what: "JomCheck API integration with credit company. Done 2026-09-15. Bugs 12127, 12128, 12154.", state: "latest" },
      ],
      openQuestions: ["TC-28 (HTTP 500) is not covered.", "API v2.0 behaviour is not accepted or recorded (Azfar, Q4 on the SP list)."],
    },
  ],
};
