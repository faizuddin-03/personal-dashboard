import type { Fact, Module, Source, Step } from "../types";

const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref: `eauto-qa-azfar:${ref}`, date });
const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string): Source => ({ kind: "ts", ref });
const miro = (ref: string): Source => ({ kind: "miro", ref });

const ac = (ref: string): Source => ({ kind: "askeauto", ref: `prod code (eauto prod/master, eauto-ssm prod/master) — ${ref}`, date: "2026-10-23" });

const f = (text: string, sources: Source[], extra?: Partial<Fact>): Fact => ({ text, sources, ...extra });
const st = (
  title: string,
  where: string | undefined,
  detail: string | undefined,
  sources: Source[],
  extra?: Partial<Step>,
): Step => ({ title, where, detail, sources, ...extra });

const S = "knowledge/_core/stms.md#Company category and SSM";
const ONB = "knowledge/cross-portal/onboarding.md";
const B2 = "02b-my-knowledge.md Module SSM";

export const ssm: Module = {
  id: "ssm",
  name: "SSM document purchase and permissions",
  short: "SSM",
  portals: ["UCD Portal", "Public /obs (Pre-Application)", "Back Office", "Rafftech SSM e-Info API (external)", "RHB (payment)", "eSim (staging)"],
  summary:
    "SSM is the company-registration document from the Suruhanjaya Syarikat Malaysia. eAuto buys it for a company seller (STMS) or company buyer (eSTM), checks that the company and its representative match the transaction, and reuses it for 7 days. BO settings decide whether a user must buy it, upload documents, or bypass the purchase. Shallow area for Faizuddin: Azfar's repo is the main source.",
  related: ["stms", "estm", "onboarding", "company-profile-einvoice", "backoffice", "payments-fees"],
  glossary: [
    { term: "SSM", meaning: "Suruhanjaya Syarikat Malaysia. The company registrar.", sources: [az(S)] },
    { term: "ROB / ROC / LLP", meaning: "Business types in the SSM lookup. eSim itemType B = ROB (Registration of Business), C = ROC (Registration of Company), L = LLP.", sources: [az("01-azfar-repo.md Module SSM Document purchase")] },
    { term: "BRN", meaning: "Business Registration Number. A new 12-digit number and an old one (e.g. 597436-Q, written with '-A' in the SSM document).", sources: [az(S)] },
    { term: "SSM Permission (company)", meaning: "BO company box 'STMS - Company Category' (ssmPermission) and 'ESTM - Company Category' (estmSsmPermission).", sources: [az(S)] },
    { term: "Bypass Purchase SSM (user)", meaning: "BO user box (stmsSsmBypass / estmSsmBypass). The user uploads all documents and does not buy SSM.", sources: [az(S), jira("EAINT-8802", "2026-01")] },
    { term: "Hybrid model", meaning: "The older model (EAINT-8526 / 8532) that combined a company-level and a user-level SSM permission. Superseded by 8802.", sources: [ts("EAINT-8526/8532 SSM_HM_TS1-TS8"), mine(B2)] },
  ],
  flows: [
    // ---------------------------------------------------------------- purchase
    {
      id: "purchase",
      name: "Enquire, buy and submit an SSM document",
      summary:
        "The system enquires with SSM, the UCD pays through RHB, then the SSM document is submitted and downloaded. It is bought from four places.",
      portals: ["UCD Portal", "Public /obs", "Rafftech SSM e-Info API", "RHB (payment)", "eSim on staging"],
      triggers: [
        {
          id: "stms-step4",
          name: "STMS Step 4 [Purchase SSM] (company seller)",
          entry: "UCD › STMS › Step 4 › [Purchase SSM]",
          summary: "Offered only when the company SSM permission says so. Azfar found both the STMS and ESTM company boxes must be ticked before the transaction starts.",
          sources: [az(S), az("01-azfar-repo.md Flow: STMS Company seller - SSM Permission / Purchase SSM at Step 4")],
          steps: [
            st(
              "Pop-up 1: Purchase SSM Document",
              "UCD › STMS › Step 4",
              "Seller Company Name and Seller SSM Number (<ROC>-A). 'Please reconfirm ...'. [Cancel] [Next].",
              [az(S)],
            ),
            st(
              "Pop-up 2: Payment Summary",
              "UCD › STMS › Step 4",
              "'SSM Profile & Admin Fees: RM 18.00, eAuto Service Tax: RM 1.44, Total Amount Payable: RM 19.44 ... validity of the SSM document is 7 days only'. [Cancel] [Make Payment] (class confirm-wfw-dialog-btn). Pays by RHB.",
              [az(S)],
              {
                affects: ["RHB payment", "BO SSM Transaction listing", "SSM XML Log"],
                branches: [
                  { when: "An Approved SSM document for the same number exists within 7 days", then: "Step 4 reuses it. No purchase." },
                  { when: "Two sessions buy the same SSM", then: "Popup 'SSM Document for this Seller Company was purchased recently.' [OK]/[X], then Step 4 refreshes and reuses it." },
                ],
              },
            ),
            st(
              "Verification",
              "UCD › STMS › Step 4",
              "After payment the document is verified. See the verification flow.",
              [az(S)],
              { affects: ["SSM verification flow"] },
            ),
          ],
        },
        {
          id: "estm-step4",
          name: "eSTM Step 4 (company buyer)",
          entry: "UCD › eSTM › Step 4",
          sources: [az("01-azfar-repo.md Module SSM Document purchase"), ts("EAINT-8802 E2E_eSTM_TS1")],
          steps: [
            st(
              "Purchase SSM as a company buyer",
              "UCD › eSTM › Step 4",
              "Same purchase as STMS. An SSM bought in eSTM is auto-retrieved in STMS for the same ROC.",
              [az("01-azfar-repo.md Module SSM Document purchase")],
              { affects: ["eSTM", "STMS"] },
            ),
          ],
        },
        {
          id: "pre-application",
          name: "Pre-Application (public /obs)",
          entry: "Public /obs › Pre-Application › Step 1 (blur on New BRN) and Step 2 payment",
          sources: [az("01-azfar-repo.md Module SSM Document purchase"), az(ONB)],
          steps: [
            st(
              "SSM enquiry on the New BRN, auto-purchase on payment",
              "Public /obs › Pre-Application",
              "Step 1 does the SSM enquiry when the user leaves the New BRN field. Step 2 payment auto-purchases the document.",
              [az("01-azfar-repo.md Module SSM Document purchase")],
              { affects: ["Onboarding"] },
            ),
          ],
        },
        {
          id: "company-profile",
          name: "Company / Business Profile 'Agree to Purchase'",
          entry: "UCD › Company / Business Profile Update › Agree to Purchase",
          sources: [az("01-azfar-repo.md Module SSM Document purchase")],
          steps: [
            st(
              "Buy SSM for the profile update",
              "UCD › Company / Business Profile",
              "The profile update (driven by Type of Business: ROB, ROC, TLN, LLP) can buy SSM data.",
              [az("01-azfar-repo.md Module SSM Document purchase")],
              { affects: ["Company Profile and e-Invoice"] },
            ),
          ],
        },
        {
          id: "ssm-listings",
          name: "SSM Transaction tile and BO menu",
          entry: "UCD Home tile 'SSM Transaction' (/view/ucd/ssm/enquiry/ssm.do). BO menu 'SSM Transaction' (/view/ssm/enquiry)",
          summary: "Prod code: these open the SSM listings. They do not start a new purchase. No cron job, JPJ notice or email link starts a purchase.",
          sources: [ac("home.jsp:643, menu.jsp:408")],
          steps: [
            st("Open the listing", "UCD Home or BO menu", "UCD sees its own SSM transactions. BO sees all. Both link to the report, invoice and e-Invoice downloads.", [ac("SsmTransactionController, SsmBackofficeController")]),
          ],
        },
        {
          id: "einvoice-doc-verification",
          name: "e-Invoice setup document verification (auto SSM enquiry)",
          entry: "UCD › Company / Business Profile › document verification (doSsmEnquiry())",
          summary: "Prod code: for an SSM-registered company type the screen runs an SSM enquiry by itself.",
          sources: [ac("document-verification.jsp doSsmEnquiry()")],
          steps: [
            st("Auto enquiry", "UCD › Business Profile", "Calls the SSM enquiry for the company type ROC, ROB or LLP.", [ac("document-verification.jsp")], { affects: ["Company Profile and e-Invoice"] }),
          ],
        },
        {
          id: "repurchase",
          name: "Repurchase without the 7-day block (FUTURE)",
          entry: "UCD › STMS / eSTM › Step 4 (EAINT-12121)",
          summary: "Code Review, S34.X-20261028. Not live.",
          sources: [jira("EAINT-12121", "2026-10"), jira("EAINT-12230", "2026-10")],
          steps: [
            st(
              "Allow repurchase the same or next day",
              "UCD › Step 4",
              "Removes the 7-day block after the first purchase so the UCD does not need an IT patch. Adds cross-flow repurchase (STMS to eSTM), download of the latest SSM only, and Sub UCD repurchase. EAINT-12230 adds duplicate-purchase validation on the payment step.",
              [jira("EAINT-12121", "2026-10")],
            ),
          ],
        },
      ],
      affects: [
        f("BO SSM Transaction listing, SSM XML Log (/view/ssm/xml-log), Bypass Purchase SSM page and audit log.", [az("knowledge/portals/backoffice/portal.md"), mine(B2)]),
        f("Invoices: SSM Document, SSM Invoice, SSM e-Invoice on Transaction Details. MyInvois e-invoice code 022.", [az("knowledge/_core/stms.md#Documents"), mine(B2)]),
        f("Reconciliation type SSM. Main UCD vs Sub UCD dimension (EAINT-8526 history).", [az("cr/EAINT-8526/LEDGER.md")]),
        f("Payment reports: SSM is included in the Payment Breakdown Report and UCD Payment Report.", [ts("EAINT-7495"), ts("EAINT-3090")]),
      ],
      cronjobs: [
        {
          name: "SsmFinalResubmissionJob (eauto-ssm, profile cron)",
          schedule: "Two configurable cron expressions (cron.time.ssm-final-resubmission and the -2 key). Values hidden in config.",
          does: "Retries the final document-purchase call for transactions stuck after payment but before approval. Max attempts and look-back window are also set in config. This is the prod-code job behind the Azfar 'every 2 minutes' entry below.",
          sources: [ac("SsmFinalResubmissionJob")],
          unconfirmed: true,
        },
        {
          name: "FailedPaymentResetJob (eauto-ssm, profile payment-reset)",
          schedule: "Config key cron.time.failed-payment-reset. Value hidden.",
          does: "Resets SSM transactions whose payment is stuck Failed before a configured cut-off date and time, so they can be retried.",
          sources: [ac("FailedPaymentResetJob")],
          unconfirmed: true,
        },
        {
          name: "SSM Final Submission resubmit",
          schedule: "Every 2 minutes",
          does: "When SSM Final Submission fails, the screen says 'Verification unavailable now. Please call eAuto at 1700816186' and shows [SSM Invoice]. The cronjob resubmits every 2 minutes.",
          sources: [az("cr/EAINT-9247/LEDGER.md"), miro("PO_SSM_FS"), ts("EAINT-9247 TS31-TS32")],
        },
        {
          name: "SSM transaction expiry",
          schedule: "After 7 days",
          does: "An SSM transaction expires after 7 days.",
          sources: [az("cr/EAINT-9247/LEDGER.md")],
          unconfirmed: true,
        },
      ],
      roles: [
        f("UCD users who create STMS or eSTM Company transactions. BO sees SSM Transactions and the XML Log.", [az(S)]),
        f("The SSM data lives in eSim on staging: ssm-enquiry-resp, ssm-rob-submission-resp, ssm-roc-submission-resp (page1 to page6; page3 = directors, page4 = shareholders) and ssm-llp-submission-resp. A company needs rows in BOTH the enquiry and the submission entities.", [az("01-azfar-repo.md Module SSM Document purchase"), az(ONB)]),
      ],
      afterCompletion: [
        f("Prod code: the purchased document is linked back onto the parent STMS, eSTM or e-Invoice transaction page as a viewable and downloadable report and invoice. The SSM charge gets its own invoice and e-Invoice, queued over RabbitMQ to eauto-einvoice once Approved and the date is on or after the e-Invoice cut-over setting. For a pre-onboarding purchase, eauto-notification attaches the SSM PDF to the approval or rejection email. No SMS or WhatsApp.", [ac("SsmEInvoiceHandler:57-82, EmailNotificationSender:152-173")]),
        f("The SSM document is stored for 7 days (counted to 23:59:59) and reused by any deal on the same SSM number, across modules. The transaction then continues at Step 4 to Make Payment.", [az("cr/EAINT-5155/LEDGER.md"), az("cr/EAINT-9247/LEDGER.md")]),
      ],
      rules: [
        f("Prod code steps: search-ssm.do creates the SSM record at New. payment.do checks the company RHB account is active and the parent STMS or eSTM is in an eligible status. make-payment.do sets transaction Pending and last payment Pending and creates a reference and an RHB debit request. A good debit sets payment Paid (SsmFundTransferHandler.doUpdateSsmTransaction). Then the real registry call (performGenXml) runs: on success transaction Approved and the PDF is stored, on error or time-out Failed.", [ac("SsmTransactionController:152-445, SsmPaymentHandler:135-227, SsmApiService:145-260")]),
        f("Statuses: SSM transaction New → Pending → Approved or Failed (Draft and Cancelled exist, not seen in this flow). Payment New → Pending → Paid or Failed (NA when not applicable). Registry call (SsmApiStatus) New → Pending → Passed / Approved (both shown 'OK') or Failed. RHB debit New → Pending → Paid or Failed. Pre-onboarding copy (eauto-onboarding SsmStatus) PENDING → OK or FAILED.", [ac("eauto-ssm TransactionStatus, PaymentStatus, SsmApiStatus, RhbPaymentStatus; eauto-onboarding SsmStatus")]),
        f("The SSM search and payment screens are open only if the company access-module flag is on: ssmPermission (STMS) or estmSsmPermission (eSTM). Otherwise the screen says 'permission not found'. Some users can bypass the purchase through hard-coded lists (AuthorizedUserList.manageBypassPurchaseSsm and ...InCompany), managed from a BO screen.", [ac("AuthorizedUserList:38-46")]),
        f("SSM price RM19.44 = RM18.00 SSM Profile and Admin Fees + RM1.44 eAuto Service Tax. One fee line on screen (staging /uat1/, 21.10.2026).", [az(S)], {
          alt: [
            { text: "RM15.00 + RM3.00 + RM1.44 = RM19.44 (EAINT-10691).", sources: [mine("02b business-rules §1.2"), az("knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026")], note: "Older workbooks (10691 regression in 9247, 2026-04) split the fee." },
            { text: "RM18.64.", sources: [jira("EAINT-5155", "2025-01")], note: "SRD 5155 is older still." },
          ],
        }),
        f("SSM response codes: 001 Authentication error, 002 Duplicate Order Code, 003 Not Found, 004 Found (Pending), 005 Confirm (Approved), 006 Insufficient Balance, 007 Search Not Done, 008 Duplicate, 009 Unable to Supply Data (popup 'Purchase SSM Document'), 010 Found and Available, 011 PDF file and Second Endpoint expired.", [mine(B2)]),
        f("The SSM record need not be a real company on staging, but it must never have been used before. eSim enquiry and submission rows must match what is keyed in (Company Name, Reg No, and a director whose IC is the Step 1 representative).", [az("knowledge/_core/stms.md#Company category and SSM")]),
        f("A bought document is stored for 7 days and reused by a new STMS on the same number whatever eSim says afterwards. After a mismatch, seed a NEW company.", [az("knowledge/_core/stms.md#Company category and SSM")]),
        f("The seed command alone is not enough. What eAuto compares is page1 of ssm-roc-submission-resp (<NAME>, <REF_NO>, <NEW_REF_NO>) and the page3 directors. Enquiry Roc = old number without '-A'. Submission REF_NO = {Roc}-A, NEW_REF_NO = {New Roc}, ROC_STATUS EXISTING.", [az("knowledge/_core/stms.md#Company category and SSM")]),
        f("Upload rules: up to 5MB, pdf/jpeg/png. Type of Business radios are unselected by default. LLP needs an Authorisation Letter.", [mine(B2), jira("EAINT-4942", "2024-11")]),
      ],
      scopeToCheck: [
        f("Check the purchase pop-ups, price lines and RHB payment for STMS and eSTM.", [az(S), ts("EAINT-8802")]),
        f("Check each SSM type: ROB, ROC, LLP, with the matching eSim rows.", [ts("EAINT-9247"), az("01-azfar-repo.md Module SSM Document purchase")]),
        f("Check SSM Final Submission failure: message, [SSM Invoice] button, cronjob resubmit.", [ts("EAINT-9247 TS31-TS32")]),
        f("Check reuse within 7 days across STMS and eSTM, and the duplicate-purchase popup.", [az("cr/EAINT-9247/LEDGER.md")]),
        f("Check BO SSM Transaction listing, SSM XML Log and the invoices (SSM Document, SSM Invoice, SSM e-Invoice).", [az("knowledge/_core/stms.md#Documents")]),
        f("Check Payment Breakdown Report and Reconciliation include SSM, including a payment date different from the approved date.", [ts("EAINT-12113"), jira("EAINT-12113", "2026-08")]),
        f("Check SSM validation ignores Page 2 and Page 6 of the document (EAINT-12132).", [jira("EAINT-12132", "2026-08")]),
      ],
      tickets: [
        { key: "EAINT-5155", date: "2025-01", what: "Company seller: SSM identity check at Step 4 and Purchase SSM.", state: "latest" },
        { key: "EAINT-9247", date: "2026-04", what: "LLP added. Go-live 27.04.2026.", state: "latest" },
        { key: "EAINT-10691", date: "2026-04", what: "SSM SST amount.", state: "latest" },
        { key: "EAINT-12132", date: "2026-08", what: "SSM validation excludes Page 2 and Page 6. Done 07.08.2026.", state: "latest" },
        { key: "EAINT-12113", date: "2026-08", what: "SSM data missing in Reconciliation Listing when payment date and approved date differ.", state: "latest" },
        { key: "EAINT-12121", date: "2026-10", what: "FUTURE: remove 7-day lock, repurchase. Code Review.", state: "latest" },
        { key: "EAINT-12230", date: "2026-10", what: "FUTURE: duplicate SSM purchase validation. Code Review.", state: "latest" },
        { key: "EAINT-8683", date: "2025-08", what: "Data patch: enable SSM Permission for 24 companies.", state: "latest" },
        { key: "EAINT-8688", date: "2025-08", what: "Data patch: untick Block STMS Category.", state: "latest" },
      ],
      openQuestions: [
        "EAINT-5155 'Pending confirmation from IT side' item #9: what if the SSM is paid but the transaction is not Approved within 7 days?",
        "Popup titles and prices differ between the SRD and the screen. Repo rule: use the screen wording.",
        "In EAINT-9247 TS13-16 are the 'Multiple UCDs' two users of one company or two companies?",
        "Both prod-code jobs have hidden schedules. Is the Azfar '2 minutes' value the live SsmFinalResubmissionJob schedule?",
        "Prod code found no job that expires an SSM transaction after 7 days. Is the 7-day rule only a stored-document lookup?",
      ],
    },

    // ------------------------------------------------------------ permissions
    {
      id: "permissions-bypass",
      name: "SSM permissions and Bypass Purchase SSM (BO settings)",
      summary: "Two BO settings decide what a company user must do at Step 2 and Step 4: the company SSM permission and the user's Bypass Purchase SSM.",
      portals: ["Back Office", "UCD Portal"],
      triggers: [
        {
          id: "bo-company-edit",
          name: "BO Manage Company Accounts > Purchase SSM Document section",
          entry: "BO › Account Management › Manage Company Accounts › Create / Edit › 'Purchase SSM Document'",
          summary: "Three boxes: ssmPermission (STMS - Company Category), estmSsmPermission (ESTM - Company Category), bypassPurchaseSsmPermission (Bypass Purchase SSM - User Category).",
          sources: [az(S), ts("EAINT-8802 BO_PERM_TS1")],
          steps: [
            st(
              "Tick the company boxes",
              "BO › Manage Company Accounts",
              "Ticking the bypass box lists the company on BO › view/bypass-purchase-ssm/view.do.",
              [az(S)],
            ),
          ],
        },
        {
          id: "bo-bypass-page",
          name: "BO Settings > Bypass Purchase SSM",
          entry: "BO › Settings (Hub Admin) › Bypass Purchase SSM (view/bypass-purchase-ssm/view.do)",
          sources: [az(S), mine("flow-bo-shell.md §3.10"), mine(B2)],
          steps: [
            st(
              "Edit per-user ticks",
              "BO › Bypass Purchase SSM › Edit (edit.do)",
              "Each user has an stmsSsmBypass and an estmSsmBypass box. The page has Export Excel and an audit log.",
              [az(S), mine(B2)],
              {
                branches: [
                  { when: "Audit log search", then: "Log Date From and To are mandatory, max 30 days. Columns: #, Date, UCD Company Name, UCD User Full Name, By, Description (EAINT-9842)." },
                ],
              },
            ),
          ],
        },
        {
          id: "ucd-step2",
          name: "UCD Step 2 uploads and Step 4 buttons",
          entry: "UCD › STMS / eSTM › Step 2 and Step 4",
          sources: [ts("EAINT-8802 E2E_STMS_TS1-TS6"), mine(B2)],
          steps: [
            st(
              "The permission matrix decides the path",
              "UCD › Step 2 and Step 4",
              "See the rules below. A permission change mid-flow is re-evaluated at [Make Payment] or [Resubmit] on Step 4. If it changes mid-flow the popup 'Upload Seller Company Information' shows with [Update Document]. Make Payment is greyed until updated.",
              [ts("EAINT-8802 SSMPERM_STMS_TS1-TS4"), az(S)],
            ),
          ],
        },
      ],
      affects: [
        f("UCD homepage still shows the SSM Document module. No SSM transaction is created when bypassed. SSM items are hidden in all steps.", [ts("EAINT-8802 E2E_STMS_TS1")]),
        f("BO audit log and Excel export capture permission changes.", [ts("EAINT-8802 BO_PERM_TS1"), jira("EAINT-9842", "2026-06")]),
        f("Company Account audit log and remarks (see EAINT-6762) after data patches.", [ts("EAINT-8688")]),
      ],
      cronjobs: [],
      roles: [
        f("Bypass Purchase SSM page: Settings (Hub Admin); jasons, mfared, nikmuhamad, mfizni. The audit log is hidden from unauthorised BO users.", [az("knowledge/_core/stms.md#BackOffice"), mine(B2)]),
        f("Prod code: any logged-in BO user can open the SSM listing, view and invoice screens (SsmBackofficeController). Only managing the SSM permission toggles or bypass is limited to the hard-coded manageStmsSsm, manageEstmSsm and manageBypassPurchaseSsm user lists. A public pre-onboarding applicant can trigger an automatic SSM purchase from the OBS form. No separate AATF or Service Portal role.", [ac("SsmBackofficeController:1-140, AuthorizedUserList:38-46")]),
        f("The SSM Permission setting is at company level only.", [az("knowledge/_core/stms.md#BackOffice"), jira("EAINT-5155")]),
        f("Main UCD, Sub UCD, and eSTM L1 and Approval users are covered by the permission matrix.", [ts("EAINT-8802")]),
      ],
      afterCompletion: [f("Normal STMS or eSTM flow continues to Step 6 Approved.", [ts("EAINT-8802")])],
      rules: [
        f("Matrix (EAINT-8802, current): User Bypass ticked, with any company state: proceeds without buying SSM, uploads 3 documents. Company SSM ticked and user bypass not ticked: must buy SSM, uploads 1 document (Board Resolution or Authorisation Letter), [Purchase SSM] shows at Step 4. Neither ticked: no purchase, 3 documents.", [ts("EAINT-8802 E2E_STMS_TS1-TS6"), az(S), mine(B2)]),
        f("3 documents: Sdn Bhd or Bhd = SSM Company Profile + Company Board Resolution + Staff Employment Pass & MyKad. Sole Proprietorship or Partnership = SSM Business Profile + Authorisation Letter + Staff Employment Pass & MyKad.", [ts("EAINT-8802"), jira("EAINT-4942", "2024-11")]),
        f("Both the STMS and the ESTM company boxes must be ticked for Purchase SSM to be offered at STMS Step 4 (Azfar, 21.10.2026). Untick them afterwards.", [az("knowledge/_core/stms.md#Company category and SSM")]),
        f("SSM Permission applies to STMS and eSTM company transactions only, not UCD to UCD.", [az("knowledge/_core/stms.md#Company category and SSM")]),
      ],
      scopeToCheck: [
        f("Run the matrix: company yes/no x user bypass yes/no x STMS/eSTM x company type x Main/Sub x web/mobile.", [ts("EAINT-8802"), ts("EAINT-8526/8532 SSM_HM_TS1-TS8")]),
        f("Check permission revoked or granted while at Step 4, after a failed JPJ enquiry and resubmit.", [ts("EAINT-8802 SSMPERM_STMS_TS2-TS4")]),
        f("Check existing transactions created before and after the deployment.", [ts("EAINT-8802 Existing Transaction sheet")]),
        f("Check BO user permissions: who sees and ticks the bypass checkbox. Check the audit log and Excel export.", [ts("EAINT-8802 BO_PERM_TS1"), jira("EAINT-9842", "2026-06")]),
        f("Check the regression with bypass unticked.", [ts("EAINT-8802")]),
        f("Check data-patched companies (SSM Permission on, Block STMS Category unticked) before and after, on staging and production.", [ts("EAINT-8683"), ts("EAINT-8688")]),
      ],
      tickets: [
        { key: "EAINT-8802", date: "2026-01", what: "Bypass Purchase SSM BO page. Current model.", state: "latest" },
        { key: "EAINT-8526", date: "2025-07", what: "SSM hybrid model, company + user level.", state: "legacy", supersededBy: "EAINT-8802" },
        { key: "EAINT-8532", date: "2025-07", what: "SSM hybrid model (paired with 8526).", state: "legacy", supersededBy: "EAINT-8802" },
        { key: "EAINT-8683", date: "2025-08", what: "Data patch for 24 companies.", state: "latest" },
        { key: "EAINT-8688", date: "2025-08", what: "Untick Block STMS Category for 24 companies.", state: "latest" },
        { key: "EAINT-8652", what: "Data patch." },
        { key: "EAINT-9842", date: "2026-06", what: "Dedicated audit log for the bypass page.", state: "latest" },
      ],
      openQuestions: [
        "Which document pairing is current? EAINT-8526: Main UCD STMS uses Company Board Resolution, Sub UCD eSTM uses Authorisation Letter. EAINT-8802: the reverse. Confirm with the team.",
        "The user-level SSM permission under EAINT-8526 needed a dev patch (no UI in that TS).",
      ],
    },

    // ------------------------------------------------------------ verification
    {
      id: "verification",
      name: "Verify the SSM document against the transaction",
      summary: "After the document is bought, eAuto compares its company name, registration numbers and directors with what the seller typed at Step 1.",
      portals: ["UCD Portal", "Back Office"],
      triggers: [
        {
          id: "after-purchase",
          name: "After Purchase SSM at Step 4",
          entry: "UCD › STMS Step 4 › [Purchase SSM] › [Next] / payment done",
          sources: [az("01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison"), ts("EAINT-12022 T56, T65, T14")],
          steps: [
            st(
              "Compare Company Name and numbers",
              "UCD › STMS › Step 4",
              "The system compares the SSM document's Company Name (and OLDNAME for ROC) with the Step 1 Company Name. The old name also counts as a match (TS3 PASS). The ROB variant is in T65. The director is matched on IC number only against the Step 1 seller. ROB must be ACTIVE and ROC must be EXISTING.",
              [az("01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison"), az(S)],
              {
                branches: [
                  { when: "Match", then: "Popup 'SSM Document Verification - Verification successful: The seller representative's information matches the SSM document.' [OK]. Step 4 offers Make Payment." },
                  { when: "Company Name does not match", then: "Popup 'Verification failed: The seller representative's Business Registered Name does not match the SSM document.' Tx Status Cancelled. Remarks 'AUTO-CANCELLED BY eAuto on dd-mm-yyyy hh:mm'. Only [Create Again], which goes to Step 1 with Company Name and BRN pre-populated and not editable. The existing SSM document is reused. BO shows Cancelled By = System." },
                  { when: "Business Registration Number does not match", then: "Popup 'Verification failed: The seller representative's Business Registration Number does not match the SSM document.' Tx stays Pending. Save & Continue Later only. The SSM fee is already paid (EAINT-10119 SRD V1.2 §2.2.2 flow B)." },
                ],
              },
            ),
            st(
              "Resubmit after a purchase",
              "UCD › STMS › Listing › Resubmit",
              "Within 7 days of the purchase the transaction goes to Step 5. After 7 days it goes back to Step 4 to repurchase.",
              [az(S)],
            ),
          ],
        },
        {
          id: "bulk-payment-check",
          name: "Bulk Payment SSM check",
          entry: "UCD › STMS › Bulk Payment Submission (Company transactions)",
          sources: [jira("EAINT-12054", "2026-08"), az(S)],
          steps: [
            st(
              "Re-check SSM per transaction",
              "UCD › STMS › Bulk Payment Submission",
              "With SSM bypass permission: all 3 required documents must be uploaded before payment. Without it: the Board Resolution or Authorisation Letter is uploaded and the existing SSM validation passes. Prod code: StmsBulkPaymentSsmValidationHandler marks an item SkippedSsm when the check fails at run time.",
              [jira("EAINT-12054 SRD v1.2", "2026-08"), jira("EAINT-12054", "2026-08")],
            ),
          ],
        },
      ],
      affects: [
        f("STMS and SSM Transaction Listing and Details (UCD + BO), SSM Document / Invoice / e-Invoice buttons.", [az("01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison")]),
        f("A mismatch in Name sets the STMS to Cancelled. A mismatch in BRN leaves it Pending.", [jira("EAINT-10119", "2026-10"), az(S)]),
      ],
      cronjobs: [],
      roles: [f("UCD user. BO sees 'Cancelled By = System'.", [az("01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison")])],
      afterCompletion: [
        f("Match: continue to payment and Approved. Mismatch: Cancelled with Create Again, or Pending with Save & Continue Later.", [az("01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison"), az(S)]),
      ],
      rules: [
        f("A UCD user's own IC is refused as the company representative.", [az(S)]),
        f("Reg No format: QA597435 is rejected. 540323-T style and the 12-digit new BRN are accepted.", [az(S)]),
        f("The remark example in T14 says 'AUTO-CANCELLED BY system' while the format line says 'BY eAuto'.", [az("01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison")], {
          unconfirmed: true,
        }),
      ],
      scopeToCheck: [
        f("Check name match, OLDNAME match, name mismatch and BRN mismatch for ROC and ROB.", [ts("EAINT-12022 T56 SSMCOMPNAME_ROC_TS1-TS3"), ts("EAINT-12022 T65")]),
        f("Check Create Again pre-populates Step 1 and reuses the SSM document.", [az("01b-azfar-extra.md Flow: SSM company name vs STMS Step 1 comparison")]),
        f("Check the BO view shows Cancelled By = System.", [ts("EAINT-12022 T14")]),
        f("Check the bulk-payment SSM check for a company transaction.", [jira("EAINT-12054", "2026-08")]),
      ],
      tickets: [
        { key: "EAINT-10119", date: "2026-10", what: "Name and BRN mismatch handling. Done 05.10.2026, live S34.2-20261001.", state: "latest" },
        { key: "EAINT-12054", date: "2026-08", what: "Bulk payment SSM check, SRD v1.2, Done 21.08.2026.", state: "latest" },
        { key: "EAINT-12132", date: "2026-08", what: "Validation excludes Page 2 and Page 6.", state: "latest" },
        { key: "EAINT-12022", date: "2026-10", what: "Board rows T14, T56, T65 cover the comparison (47 TS).", state: "latest" },
        { key: "EAINT-5155", date: "2025-01", what: "Original identity check.", state: "legacy", supersededBy: "EAINT-10119" },
      ],
      openQuestions: [
        "Is the remark 'AUTO-CANCELLED BY eAuto' or 'BY system'? The T14 example and format line differ.",
      ],
    },
  ],
};

