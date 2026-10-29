import type { Fact, Module, Source, Step } from "../types";

const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref: `eauto-qa-azfar:${ref}`, date });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string): Source => ({ kind: "ts", ref });
const miro = (ref: string): Source => ({ kind: "miro", ref });

const ac = (ref: string): Source => ({ kind: "askeauto", ref: `prod code 0e21bef3db — ${ref}`, date: "2026-10-23" });

const f = (text: string, sources: Source[], extra?: Partial<Fact>): Fact => ({ text, sources, ...extra });
const st = (
  title: string,
  where: string | undefined,
  detail: string | undefined,
  sources: Source[],
  extra?: Partial<Step>,
): Step => ({ title, where, detail, sources, ...extra });

const X = "01b-azfar-extra.md";
const HOW = "knowledge/portals/ucd/how-we-test.md";
const L104 = "cr/EAINT-104/LEDGER.md";
const L12022 = "cr/EAINT-12022/LEDGER.md";
const MIRO_LKM = miro("uXjVJv2Y3G0= (LKM Refund board, EAINT-12022)");

export const stmsAddons: Module = {
  id: "stms-addons",
  name: "STMS Step 5 add-ons: LKM Refund and Insurance Cancellation",
  short: "STMS Add-ons",
  portals: ["UCD Portal", "Back Office", "JPJ (external)", "RHB (payment)", "Runnerku (insurer API)", "LHDN MyInvois", "AI document check"],
  summary:
    "Two optional add-ons on STMS Step 5. LKM Refund asks JPJ to refund the seller's unused road tax. Insurance Cancellation asks the seller's insurer (through Runnerku) to cancel the policy and refund the balance. Both use pop-ups, document preview and an e-signature. Each has its own fee, status page and listings. Shallow area for Faizuddin: Azfar's repo is the main source.",
  related: ["stms", "ucd-to-ucd", "payments-fees", "backoffice", "ucd-portal"],
  glossary: [
    { term: "LKM Refund", meaning: "Refund of the seller's unused road tax (Lesen Kenderaan Motor) through JPJ. Not the same as eLKM, the road tax renewal add-on in eSerahan (RM60 for 12 months).", sources: [az("cr/EAINT-12022/01-research/study.md"), az(L104)] },
    { term: "PTJ Branch", meaning: "The JPJ branch that handles the refund. It is derived from the UCD's State and City in Manage Company Account.", sources: [az(X)] },
    { term: "RTR", meaning: "Prefix of the LKM Refund transaction number: RTR + year digit + month code (Oct = 0, Nov = N, Dec = D) + 7-digit running number. Example RTR620000001.", sources: [az(X)] },
    { term: "JPJK6", meaning: "JPJ road-tax refund application form. One of the 3 documents previewed and signed at Step 5.", sources: [az(X)] },
    { term: "Refund Indicator", meaning: "Y or N sent in the JPJ final submission. Y only when the add-on was ticked, saved, signed and paid.", sources: [az(X), jira("EAINT-12567", "2026-10")] },
    { term: "Insurance Cancellation (IC)", meaning: "Cancels the seller's insurance policy through Runnerku. Individual sellers (MyKad and MyPR) only.", sources: [az(L12022)] },
    { term: "Runnerku", meaning: "The external insurance-cancellation processor. On staging it is simulated by eSim.", sources: [az(L12022), az(`${HOW}#eSim Runnerku facts`)] },
    { term: "eauto-asset-manager", meaning: "The service that owns the Runnerku link, document OCR, IC eligibility check and the IC payment-retry poller. It writes Runnerku's status straight into the IC tables of eAuto core.", sources: [ac("InsCancelRetryPaymentPoller, eauto-asset-manager README")] },
    { term: "eauto-cron", meaning: "A separate scheduler service. It holds the LKM Refund JPJ status job and the PTJ document summary job, and copies e-Invoice results back onto IC and STMS rows.", sources: [ac("LkmRefundApplicationSyncJob, EInvoiceTransactionHandler")] },
    { term: "AC / WC / CU / RB", meaning: "JPJ LKM refund status codes. AC = In Progress (New Application), WC = In Progress (Confirmation), CU = Refund Done, RB = Rejected.", sources: [az(X)] },
  ],
  flows: [
    // ----------------------------------------------------------------- LKM request
    {
      id: "lkm-refund-request",
      name: "LKM Refund: eligibility and request (Step 5)",
      summary:
        "At Step 5 the dealer ticks LKM Refund when JPJ says the vehicle has a refund balance of RM5 or more. The dealer fills a pop-up, signs, and pays the refund processing fee together with the STMS fee.",
      portals: ["UCD Portal", "JPJ (external)", "RHB (payment)"],
      triggers: [
        {
          id: "tick-checkbox",
          name: "Tick the LKM Refund checkbox at Step 5",
          entry: "UCD › STMS › Step 5 (Payment) › LKM Refund add-on checkbox (#lkm-refund-addon-checkbox)",
          summary: "The checkbox shows only when the JPJ enquiry returns a refund balance of RM5 or more (eSim stms-enquiry-resp 'LKM Refund Amount').",
          sources: [az(X), az(`${HOW}#STMS Step 5 add-ons`), jira("EAINT-12567", "2026-10")],
          steps: [
            st(
              "Perakuan at Step 1",
              "UCD › STMS › Step 1",
              "Perakuan 'PERAKUAN STMS / TH / LKM REFUND - PENJUAL'. The text says a refund is possible if the balance is above RM5.00 and details are emailed to lkmrefund@eauto.my. On preprod1 an extra LKM refund email field (#sellerEmail) shows.",
              [az("cr/EAINT-12022/01-research/study.md"), az(X)],
              { affects: ["STMS Step 1 and Step 3 Perakuan"] },
            ),
            st(
              "Add-on card shows the refund balance",
              "UCD › STMS › Step 5",
              "The card sits in an 'Add-on Services' section. A 3-to-6 month processing notice (Malay, then English) shows below the form fields and above the consent tick box, for Individu and Syarikat (EAINT-12411).",
              [jira("EAINT-12567", "2026-10"), jira("EAINT-12411", "2026-09")],
              {
                branches: [
                  { when: "Balance is below RM5", then: "The UCD cannot request. The checkbox is not shown." },
                  { when: "Company has no LKM Refund permission", then: "No request. At payment time: popup 'Your account don't have LKM Refund permission' [OK]." },
                ],
              },
            ),
            st(
              "Fill the LKM Refund Details pop-up",
              "UCD › STMS › Step 5 › pop-up",
              "Step 1 Refund Details: State, PTJ (JPJ Branch), Seller's Name, Bank Name, Bank Account No. Step 2 Verification Documents: Copy of IC and Bank Statement (Individual, MyPR) or Bank Statement only (Company), PDF/PNG/JPG/JPEG up to 5MB, plus a declaration. [Next] runs the AI document check. Real AI has been on since 07.10.2026 and the seller name must equal the full IC name.",
              [jira("EAINT-12567", "2026-10"), az(`${HOW}#STMS Step 5 add-ons`), az(L104)],
              {
                branches: [
                  { when: "State is Wilayah Persekutuan Labuan", then: "Shown as Sabah." },
                  { when: "State is Putrajaya", then: "Shown as Kuala Lumpur." },
                  { when: "File is tiny (about 1 KB)", then: "HTTP 500 EG0001 'Upload failed.'" },
                ],
              },
            ),
            st(
              "Document Preview and e-signature",
              "UCD › STMS › Step 5 › LKM Refund Document Preview",
              "See the document flow below. Close without signing unticks the checkbox. After [Proceed], the signature is locked and [Reconfirm LKM Refund Details] shows after Close.",
              [az(X)],
              { affects: ["LKM Refund Document, e-Signature and Reset flow"] },
            ),
            st(
              "Pay: one payment for STMS and LKM Refund",
              "UCD › STMS › Step 5 › [STMS Payment] › [Yes]",
              "Payment Summary adds the row 'eAuto Processing Fee - LKM Refund'. One example total: RM10 + RM25 + RM50 LKM + RM6 tax = RM91.00. The LKM fee is a non-split RHB UcdToEauto payment with Reference 2 'RTR'. JPJ final submission sends Refund Indicator = Y with the PTJ Branch.",
              [az(L104), az(X), jira("EAINT-12407", "2026-09")],
              {
                affects: ["RHB Payment Transaction (BO)", "JPJ XML Log", "Reconciliation listing"],
                branches: [
                  { when: "At payment: refund amount below RM5, state permission unticked, global permission disabled, amount band unticked, or UCD mailing state changed", then: "Popup 'Your account don't have LKM Refund permission'. Stays on Step 5. Summary refreshed without the LKM fee. Indicator = N. No LKM Refund section in details." },
                  { when: "Amount changes within permitted bands (e.g. 30.01 becomes 30.00, 50.01 becomes 50.00)", then: "The new amount is used. Indicator = Y." },
                ],
              },
            ),
            st(
              "Step 6 shows LKM Refund Details",
              "UCD › STMS › Step 6",
              "Shows LKM Refund amount and PTJ when approved. A red error card shows if the LKM Refund JPJ submission or payment failed. The UCD LKM Refund Status listing shows the new RTR row at once (In Progress).",
              [jira("EAINT-12567", "2026-10"), az(`${HOW}#STMS Step 5 add-ons`)],
            ),
          ],
          affects: [
            f("Permission matrix, can the user request at Step 5? Individual with LKM permission = yes; without = no. Company: LKM + SSM permission and SSM bought at Step 4 = yes; LKM + SSM permission, SSM already bought within 7 days = yes; LKM + SSM permission with no SSM in 7 days = no; LKM permission without SSM permission = no; no LKM permission = no.", [az(X), miro("EAINT-12022 board T12")]),
          ],
        },
        {
          id: "resubmit-from-listing",
          name: "Resubmit from the STMS listing after Save & Continue Later",
          entry: "UCD › STMS › STMS Transaction Listing › Resubmit",
          sources: [az(X), ts("EAINT-12022 T30, T52 TS9-TS15")],
          steps: [
            st(
              "Resubmit after a change in amount or permission",
              "UCD › STMS › STMS Transaction Listing › Resubmit",
              "JPJ Enquiry OK goes to Step 5 (the checkbox shows if still allowed) or Step 4. Failed enquiry: Tx Failed, remark 'JPJ Enquiry Failed : {error_description}', a new JPJ Enquiry record, and JPJ XML Log shows the new enquiry with [~RefundAmt].",
              [az(X)],
              {
                branches: [
                  { when: "Amount or permission changed after the first pass", then: "Checkbox is hidden at Step 5. Indicator = N, or Y with the new amount if still permitted." },
                ],
              },
            ),
          ],
        },
        {
          id: "reconfirm-link",
          name: "Reconfirm LKM Refund Details link",
          entry: "UCD › STMS › Step 5 › [Reconfirm LKM Refund Details] (#to-lkm-refund)",
          sources: [az(`${HOW}#STMS Step 5 add-ons`), az(X)],
          steps: [
            st("Reopen the pop-up", "UCD › STMS › Step 5", "Shown after Close once the signature was saved. Reopens the LKM Refund Details.", [az(X)]),
          ],
        },
        {
          id: "owner-notifications",
          name: "Owner email and WhatsApp (in development, not live)",
          entry: "UCD › STMS › Step 1 and Step 4 (new)",
          summary: "New notifications to the car owner about the refund. Status: In Development or To Do as of 23.10.2026.",
          sources: [jira("EAINT-12431", "2026-10"), jira("EAINT-12329", "2026-09")],
          steps: [
            st(
              "Step 1: owner awareness",
              "UCD › STMS › Step 1",
              "UCD enters vehicle no. and owner email. The owner gets an email, then WhatsApp, when a refund is available. Email in EN/BM/CN, WhatsApp in EN/BM. EAINT-12431, Part 1, In Development.",
              [jira("EAINT-12431", "2026-10")],
            ),
            st(
              "Step 4: refund amount and instructions",
              "UCD › STMS › Step 4",
              "Owner gets email and WhatsApp with the refund amount and how to submit. The UCD gets an email-only reminder to collect and upload the owner's IC and bank statement, within 7 days after STMS approval. EAINT-12329, Part 2, To Do.",
              [jira("EAINT-12329", "2026-09")],
            ),
          ],
        },
        {
          id: "lkm-enquiry-and-bo-pages",
          name: "LKM Refund enquiry and BO pages (prod code)",
          entry: "UCD /view/ucd/lkm-refund/enquiry/main.do. BO /view/lkm-refund/management, /attachment, /jpj/log, /enquiry",
          summary: "Prod code: there is no menu item or tile that starts a new refund. The only way into the data-entry form is the Step 5 checkbox. The UCD enquiry page has no menu item or tile in current code, so a dealer reaches it by URL or from the STMS transaction.",
          sources: [ac("LkmRefundTransactionController.java:75, LkmRefundEnquiryController.java:76, LkmRefundBackofficeController")],
          steps: [
            st("Open data-entry popup", "UCD › STMS › Step 5", "GET /api/ucd/stms/lkm-refund/transaction/data-entry.do loads the popup. Server-side eligibility and permission are checked again before the form shows (checkStmsAllowedForLkmRefund, isRefundPermitted).", [ac("LkmRefundTransactionController")]),
            st("Save details and sign", "UCD popup", "upsert.do saves owner, bank and PTJ branch details and the uploads (bank statement, IC copy, company stamp for CTU sellers). upsert-signature.do saves the e-signature.", [ac("LkmRefundTransactionController")]),
          ],
        },
        {
          id: "move-to-step-4",
          name: "Move the add-ons from Step 5 to Step 4 (requested, not built)",
          entry: "UCD › STMS › Step 4",
          summary: "A client leaves after Step 4 and cannot sign at Step 5. EAINT-11179 asks to move LKM Refund and Insurance Cancellation to Step 4. Status To Do.",
          sources: [jira("EAINT-11179", "2026-05")],
          steps: [st("Not built", undefined, "No behaviour yet.", [jira("EAINT-11179", "2026-05")])],
        },
      ],
      affects: [
        f("STMS Transaction Listing and Details (UCD + BO): UCD +3 columns, BO +4, BO CSV +7 (41 columns). LKM Refund Transaction No, LKM Refund section (requested date, status, amount, PTJ, bank, documents), Payment Details (LKM Refund).", [az(L104), az(X)]),
        f("New UCD and BO 'LKM Refund Status' listing. Columns: #, Vehicle, STMS Transaction No, LKM Refund Transaction No, Seller Name, Created At, Application Status, Last Update, Remarks, Refund Remarks, Action. A 'LKM Refund Amount' column is added after Application Status (EAINT-12430).", [az(X), jira("EAINT-12430", "2026-10")]),
        f("BO LKM Refund Attachment Listing (per PTJ Branch), with print.", [az(L104), az(X)]),
        f("JPJ XML Log, e-Invoice and Invoice (Page 3 LKM Refund), eAuto Plus RHB Payment Transaction and SST Payment Report (LKM included per 104 V1.4).", [az(X), az(L104)]),
        f("Reconciliation: LKM Refund type, Kod Hasil '-', not on the Summary tab. In eAuto but not in the bank statement: 'Rekod Transaksi Tiada Di Penyata Bank', Refund Required = No. In bank but not in eAuto: 'Rekod Transaksi Tiada Di Sistem eAuto', Refund Required = Yes. Hidden from JPJ users.", [jira("EAINT-12407", "2026-09")]),
        f("Payment Breakdown Report and UCD Payment Report.", [az(L104)], { unconfirmed: true }),
        f("Android app parity (EAINT-12567): the app paid without the LKM indicator and cancelled refunds were prepared on web (CCB-485).", [jira("EAINT-12567", "2026-10")]),
        f("Homepage popup and 'What's New' (see the popups flow).", [jira("EAINT-12525", "2026-10")]),
      ],
      cronjobs: [
        {
          name: "Manual Payment Processing (existing cronjob)",
          schedule: "Unknown",
          does: "Handles a paid STMS with JPJ pending, and sets the LKM Refund indicator to Y.",
          sources: [jira("EAINT-9971"), az(L104)],
          unconfirmed: true,
        },
        {
          name: "eauto-cron snapshot for reconciliation",
          schedule: "02:00 snapshot. Compare runs at 10:00 and 12:00.",
          does: "Stages paid LKM Refund fees (lkmrefundtransaction + plusrhbpayment, UcdToEauto only). The compare includes LKM_REFUND.",
          sources: [jira("EAINT-12407", "2026-09")],
        },
      ],
      roles: [
        f("Prod code: UCD side only the buyer company of that STMS can open the LKM Refund form (loginUser company = stmsTx buyerCompanyId), and global, state and company LKM Refund config must allow it. Any BO login can view the management, enquiry and JPJ-log pages. Changing the per-state permission (enable, disable, FOC, Chargeable) is limited to a hard-coded list of 4 BO user IDs (AuthorizedUserList.manageLkmRefundPermission).", [ac("LkmRefundPermissionHandler:60-150, AuthorizedUserList:73")]),
        f("The account needs LKM Refund permission. Without it: 'Your account don't have LKM Refund permission.'", [az(`${HOW}#STMS Step 5 add-ons`), jira("EAINT-12567", "2026-10")]),
        f("Phase 1 (CR group, 24.09.2026): Individual only, PTJ Branch Kuala Lumpur and Selangor only. Company category withdrawn for Phase 1 (EAINT-12417, Done 29.09.2026).", [az(L104), jira("EAINT-12417", "2026-09")], {
          alt: [{ text: "Company sellers are covered by the permission matrix (company with LKM + SSM permission can request).", sources: [az(X)], note: "Board T12 predates the Phase 1 gate. The title says Company, Phase 1 says Individual only." }],
        }),
        f("Company also needs Purchase SSM permission for the SSM paths.", [az(X)]),
        f("What's New LKM section is shown to all UCD users.", [jira("EAINT-12525", "2026-10")]),
      ],
      afterCompletion: [
        f("STMS Tx Status Approved with an LKM Refund section: status 'New Application', amount, PTJ, bank, documents. Transaction goes to the LKM Refund Status listing (UCD + BO).", [az(X), az(`${HOW}#STMS Step 5 add-ons`)]),
        f("The LKM Refund fee is paid by a non-split RHB UcdToEauto transfer, Reference 2 = RTR, TransType = RoadTaxRefund. EFT No format RR + yy + mm + dd + 6-digit running - vehicle no, e.g. RR260205000001 - ABC1234.", [jira("EAINT-12407", "2026-09"), az(X)]),
        f("Sent to JPJ: JPJ forms (UCD checklist, JPJK6, Surat Rasmi, Lampiran F3). A vehicle number goes through once only.", [az(L104)]),
      ],
      rules: [
        f("Fee bands by refund amount: below RM5 not offered; 5.00-30.00 RM0; 30.01-50 RM5; 50.01-100 RM10; 100.01-500 RM35; above 500 RM50.", [az(L104), az(X)], {
          alt: [{ text: "Board table T11 shows an eAuto Processing Fee of 0 in every band. Other TS (T52 TS6-8) show fees 5.00, 10.00 and 35.00 for the 30.01+ bands.", sources: [az(X), MIRO_LKM], note: "Unresolved in the source. The ledger bands match the T52 rows." }],
        }),
        f("Service tax 8% is included in the STMS payment breakdown. The calculation on the board: (eAuto STMS Fee x 8%) + eAuto Processing Fee - LKM Refund x 8%.", [az(X)], { unconfirmed: true }),
        f("The refund takes 3 to 6 months. JPJ asked for the notice. Wording dated 25.09.2026, live 1 Oct.", [jira("EAINT-12411", "2026-09")]),
        f("e-Signature replaces the thumbprint (EAINT-10093, S34.2-20261001).", [az(L104), jira("EAINT-10093", "2026-03")]),
        f("EAINT-12393 restores two letters ('Surat Rasmi Pihak eAuto' and 'Surat Rasmi UCD ke eAuto', Individu and Syarikat variants) removed on 16.03.2026 after JPJ asked to combine them. The combined documents are kept too. The newer ticket wins.", [jira("EAINT-12393", "2026-09")]),
        f("Prod code: LKM Refund is live in production. It is not the 'Coming Soon' placeholder some older notes describe.", [ac("stms-addon-lkm-refund.jsp")]),
        f("Prod code: at Make Payment the permission is re-checked in NewPaymentHandlerBean. LkmRefundNoPermissionException or LkmRefundNoSignatureException blocks payment if the permission was revoked or the signature is missing. A free-of-charge (FOC) refund creates no lkmrefundpayment row, so it is not in payment reports.", [ac("NewPaymentHandlerBean, PaymentTransactionRabbitMQProducer:572")]),
        f("Make Payment and Retry always send the LKM Refund indicator. It is true only when ticked, saved and signed.", [jira("EAINT-12567", "2026-10")]),
        f("UCD to UCD Standard STMS with the indicator ticked is blocked on BO resubmit. Interstate STMS and unticking the box let the resubmit succeed with LKM fields '-'.", [az(X)]),
      ],
      scopeToCheck: [
        f("Run the permission matrix: Individual and Company, with and without LKM permission, SSM permission and SSM bought within 7 days.", [az(X), ts("EAINT-12022 T12")]),
        f("Run amount bands and the fee for each band, and a refund below RM5.", [az(X), ts("EAINT-12022 T52 LKM_MLR_TS1-TS8")]),
        f("Run payment-time re-checks: untick state, disable global permission, untick band, change UCD mailing state. Expect the permission popup and Indicator = N.", [az(X)]),
        f("Run resubmit from the listing after an amount or permission change.", [az(X), ts("EAINT-12022 T52 TS9-TS15")]),
        f("Check PTJ Branch derived from State and City, and the Labuan and Putrajaya display mapping.", [az(X)]),
        f("Check the Perakuan on Step 1 and Step 3 for Individual and Company.", [az(X)]),
        f("Check Step 5 pop-up in Firefox (Document Preview was blank in Firefox, EAINT-12388, fixed 24.09.2026) and Chrome.", [jira("EAINT-12388", "2026-09"), az("knowledge/_core/stms.md#Step 5")]),
        f("Check listings: STMS listing and details columns (UCD and BO), CSV export, LKM Refund Status listing, e-Invoice page 3, payment reports.", [az(L104), az(X)]),
        f("Check the Android app against web (indicator, cancelled refunds).", [jira("EAINT-12567", "2026-10")]),
      ],
      tickets: [
        { key: "EAINT-104", date: "2026-10", what: "LKM Refund add-on. Live S34.2-20261001. Base SRD V1.4 2026-02-24.", state: "latest" },
        { key: "EAINT-10093", date: "2026-03", what: "e-Signature replaces thumbprint. JPJ UAT feedback.", state: "latest" },
        { key: "EAINT-12417", date: "2026-09", what: "Phase 1 gates (Individual only, KL + Selangor).", state: "latest" },
        { key: "EAINT-12411", date: "2026-09", what: "3-to-6 month processing notice in the Step 5 pop-up.", state: "latest" },
        { key: "EAINT-12393", date: "2026-09", what: "Restore two JPJ letters.", state: "latest" },
        { key: "EAINT-12407", date: "2026-09", what: "Reconciliation snapshot and RTR reference.", state: "latest" },
        { key: "EAINT-12430", date: "2026-10", what: "LKM Refund Amount column in the status listing. Done.", state: "latest" },
        { key: "EAINT-12431", date: "2026-10", what: "Owner email and WhatsApp at Step 1. In Development.", state: "latest" },
        { key: "EAINT-12329", date: "2026-09", what: "Owner and UCD reminders at Step 4. To Do.", state: "latest" },
        { key: "EAINT-12567", date: "2026-10", what: "Android parity. In Development.", state: "latest" },
        { key: "EAINT-11179", date: "2026-05", what: "Move add-ons to Step 4. To Do.", state: "latest" },
        { key: "EAINT-9974", what: "Permission check before payment at Step 5. On Hold." },
        { key: "EAINT-12388", date: "2026-09", what: "Blank Document Preview in Firefox. Fixed.", state: "latest" },
        { key: "EAINT-9973", what: "Status inquiry once after submission." },
      ],
      openQuestions: [
        "Fee band table: T11 shows fee 0 in every band. T52 shows non-zero fees. Which is current?",
        "'LKM Refund Payment = Failed' on its own: how is it produced? Unknown.",
        "Notification templates for 12431 and 12329 'will be shared by Nurul later'. 12329 SRD v0.2 had 5 open questions.",
        "Where does a UCD dealer open the LKM Refund Status page? Azfar lists a new UCD listing. Prod code found no menu item or tile to /view/ucd/lkm-refund/enquiry/main.do.",
        "Which email address gets LKM Refund notices (eautoemails.lkmRefundEmail)? The value is hidden in config. Prod code found no refund-done SMS or WhatsApp to the dealer.",
      ],
    },

    // ------------------------------------------------------------ LKM document
    {
      id: "lkm-document-esign",
      name: "LKM Refund: documents, e-signature and BO reset",
      summary: "The dealer previews 3 documents, signs once, and the signature is pasted on all three. BO can reset the signature.",
      portals: ["UCD Portal", "Back Office"],
      triggers: [
        {
          id: "preview-after-next",
          name: "Document Preview after Next",
          entry: "UCD › STMS › Step 5 › LKM Refund Details › [Next]",
          sources: [az(X), ts("EAINT-12022 T68 DOCPREV_E-SIGN_TS1-TS9")],
          steps: [
            st(
              "Preview 3 documents",
              "UCD › STMS › Step 5 › LKM Refund Document Preview",
              "Surat Wakil Urusan Permohonan Pulangan Balik Hasil (PTJ Branch Address blank), Surat Permohonan dari Pemohon Asal (Lampiran F3), JPJK6 Borang Permohonan Bayaran Balik. The viewer is PDF.js and shows 'Loading document...' until #lkm-signature-wrapper loses lkm-signature-disabled.",
              [az(X), az(`${HOW}#STMS Step 5 add-ons`)],
            ),
            st(
              "Sign and Proceed",
              "UCD › Step 5 › Document Preview",
              "e-Signature pad with [Clear] and [Proceed]. After Proceed the signature is locked. Message 'e-Signature signed on DD-MM-YYYY hh:mmam/pm.' The signature is pasted on all three documents.",
              [az(X)],
              {
                branches: [
                  { when: "Close without signing, or Close with a signature not yet Proceeded", then: "LKM Refund checkbox is unticked." },
                  { when: "Close after Proceed", then: "Checkbox stays ticked. [Reconfirm LKM Refund Details] link shows." },
                ],
              },
            ),
          ],
        },
        {
          id: "bo-reset-signature",
          name: "BO Reset Signature",
          entry: "BO › STMS Transaction Listing › Action column › [Reset Signature]",
          sources: [az(X), ts("EAINT-12022 T75 BO_RES_E-SIGN_TS1"), az(L104)],
          steps: [
            st(
              "Reset the saved signature",
              "BO › STMS Transaction Listing",
              "Confirm 'Sure to reset e-Signature for LKM Refund?' [OK]. The saved signature is removed and the UCD can sign again. It also unticks LKM Refund. Not in the SRD.",
              [az(X), az(L104)],
              {
                branches: [
                  { when: "Resubmitted from the listing after a failed payment", then: "Reset not shown (T75 TS2)." },
                  { when: "After a BO payment Reset", then: "Allowed (T75 TS3)." },
                ],
              },
            ),
          ],
        },
      ],
      affects: [
        f("LKM Refund Document download at Step 6 and on STMS Details. The full document is 8 pages: Surat Wakil, Lampiran F3, JPJK6, Copy of IC, Bank Statement, Lain-lain, Borang Permohonan Bayaran Balik (from JPJ), Butir-butir Bayaran Balik LKM (from JPJ). The button shows only when the two JPJ items are available.", [az(X)]),
        f("Copy of IC and Bank Statement uploads use AI extraction (bank name, IC name).", [az(X)]),
      ],
      cronjobs: [],
      roles: [
        f("Reset Signature is visible only to listed BO users (eautojrjaya, eautonurul, jasons, mfared, nikmuhamad, mfizni). BO SuperAdmin, Admin, Probation and other users cannot see it.", [az(X)]),
      ],
      afterCompletion: [f("Signed documents are stored with the transaction and downloadable from STMS Details.", [az(X)])],
      rules: [
        f("AI document check at [Next] gives per-file results BANK_STATEMENT and COPY_OF_IC, then SELLER_SIGNATURE after [Proceed]. Real AI since 07.10.2026. Charged per use.", [az(`${HOW}#STMS Step 5 add-ons`), az(L104)]),
        f("Unsigned documents are not accepted. The signature cannot change after it is saved.", [az(L104), jira("EAINT-12567", "2026-10")]),
      ],
      scopeToCheck: [
        f("Check Close before sign, Close after Proceed, Clear, and the signed-at message.", [ts("EAINT-12022 T68 TS5, TS6, TS8, TS9")]),
        f("Check BO Reset Signature with an allowed and a non-allowed BO user.", [ts("EAINT-12022 T79 RES_E-SIGN_ROLEPERM_TS1")]),
        f("Check the Document Preview in Firefox and Chrome.", [jira("EAINT-12388", "2026-09")]),
      ],
      tickets: [
        { key: "EAINT-10093", date: "2026-03", what: "e-Signature.", state: "latest" },
        { key: "EAINT-12388", date: "2026-09", what: "Blank preview in Firefox, fixed.", state: "latest" },
        { key: "EAINT-12022", date: "2026-10", what: "Board T68, T75 cover this flow.", state: "latest" },
      ],
    },

    // ------------------------------------------------------------ LKM status
    {
      id: "lkm-status-and-failures",
      name: "LKM Refund: status inquiry, JPJ failure and BO tools",
      summary: "After payment, JPJ's refund status is polled. JPJ failures, BO resubmit, e-Invoice retries and BO settings are covered here.",
      portals: ["UCD Portal", "Back Office", "JPJ (external)", "LHDN MyInvois"],
      triggers: [
        {
          id: "refresh-status",
          name: "Refresh Status button",
          entry: "UCD or BO › LKM Refund Status page › [Refresh Status]",
          sources: [az(X), ts("EAINT-12022 T05")],
          steps: [
            st(
              "Ask JPJ for the status",
              "UCD › LKM Refund Status",
              "One press locks the row for 5 hours. Status moves AC (In Progress / New Application), then WC (In Progress / Confirmation), then CU (Refund Done) or RB (Rejected with reason). Check the LKM Refund Status page, STMS Details and the JPJ XML Log (LKM Refund).",
              [az(X), az(`${HOW}#STMS Step 5 add-ons`)],
              {
                branches: [
                  { when: "Response REV000058E, REV000049E or GLB000179E", then: "Status stays AC." },
                  { when: "CU", then: "End state. Manual refresh is blocked." },
                ],
              },
            ),
          ],
        },
        {
          id: "daily-status-job",
          name: "Daily status cronjob",
          entry: "System: LKM status inquiry cronjob",
          sources: [az(X), jira("EAINT-12407")],
          steps: [
            st(
              "Cronjob calls JPJ",
              "System",
              "Daily 2:30 am (T63) or 02:00 per the research study. Picks NW, AC, WC and RB (depending on reason). CU is never re-inquired. It also runs once after submission (EAINT-9973).",
              [az(X), az("cr/EAINT-12022/01-research/study.md")],
            ),
          ],
        },
        {
          id: "jpj-final-submission-failure",
          name: "JPJ final submission fails at Step 6",
          entry: "UCD › STMS › Step 6, after LKM Refund payment OK",
          sources: [az(X), ts("EAINT-12022 T29, T27")],
          steps: [
            st(
              "STMS is resubmitted without LKM Refund",
              "UCD › STMS › Step 6",
              "The system resubmits the STMS with Indicator = N. Tx Status = Approved, LKM Refund JPJ = Failed. Message shows only when the UCD proceeded with LKM Refund and LKM payment was OK: 'Sorry, your LKM Refund request had failed. Your processing fee is charged. Please contact eAuto Support Team at 03-27798899. Kindly proceed to JPJ Counter for your LKM Refund submission.'",
              [az(X)],
              {
                affects: ["STMS Tx Status", "LKM Refund JPJ column", "JPJ XML Log"],
                branches: [
                  { when: "JPJ error 7G (Company)", then: "'No request for LKM cancellation has been made'." },
                  { when: "7H, 7I, 7J, 7K, 7M, 7P, 7U, 7V, 7W, 7X, GLB000648E", then: "Refund record not found, technical errors or PTJ branch/email required." },
                  { when: "REF000068E or REF000069E", then: "Contact JPJ helpdesk. No QA result recorded." },
                ],
              },
            ),
          ],
        },
        {
          id: "bo-resubmit",
          name: "BO Resubmit JPJ Final Submission (STMS)",
          entry: "BO › Resubmit JPJ Final Submission (STMS)",
          sources: [az(X), ts("EAINT-12022 T10, T13, T34")],
          steps: [
            st(
              "Resubmit a failed STMS",
              "BO › Resubmit JPJ Final Submission (STMS)",
              "Cronjob stmsJpjSubmissionTrigger (every 1 hour) also resends the second enquiry and submission for Pending (patched) transactions. A failed STMS payment can be reset in the BO listing and retried at Step 5.",
              [az(X)],
              {
                branches: [
                  { when: "Failed due to the LKM Refund Indicator", then: "Popup 'Unsuccessful Submitted JPJ Submission {transaction_no} - LKM Refund Transaction Not Found / LKM Refund Payment Not Paid.' Tx stays Failed." },
                  { when: "Otherwise", then: "Popup 'Resubmitted 1 transactions.' and Indicator = N." },
                ],
              },
            ),
          ],
        },
        {
          id: "bo-manage-amount",
          name: "BO Manage LKM Refund Amount",
          entry: "BO › Manage LKM Refund Amount (below RM30) page / state-level bands",
          sources: [az(X), ts("EAINT-12022 T04, T15, T48")],
          steps: [
            st(
              "Edit permission and bands",
              "BO › Manage LKM Refund Amount",
              "Enable or Disable (default Enable). Tick an amount band (5-30, 30.01-50, 50.01-100, 100.01-500, 500+), then the states, with Select All. [Update] writes an audit log. Unticking one state unticks Select All.",
              [az(X)],
              { affects: ["UCD Step 5 checkbox visibility", "JPJ Refund Indicator"] },
            ),
          ],
        },
        {
          id: "bo-attachment-listing",
          name: "BO LKM Refund Attachment Listing",
          entry: "BO › LKM Refund Attachment Listing",
          sources: [az(X), ts("EAINT-12022 T21")],
          steps: [
            st(
              "Per PTJ Branch counts and documents",
              "BO › LKM Refund Attachment Listing",
              "The 'LKM Refund Transaction' count per PTJ Branch goes up for LKM Refund Status = Requested, not Failed. An incomplete document shows Remarks 'Incomplete Document: {Transaction No.}'. [Retry] checks readiness, then [Download] and [Print] show.",
              [az(X)],
            ),
          ],
        },
        {
          id: "lhdn-retry",
          name: "e-Invoice retry for invalid or blank TIN",
          entry: "System: LHDN resubmission and consolidated e-Invoice jobs",
          sources: [az(X), ts("EAINT-12022 T09, T37")],
          steps: [
            st(
              "BO fixes the TIN, the cronjob resubmits",
              "BO › company TIN; System",
              "LHDN Failed (invalid or blank TIN): BO updates the TIN, the cronjob resubmits and the e-Invoice is generated. Consolidated e-Invoice resubmits with the general TIN EI00000000010 and keeps the remarks 'TIN verification failed...' or 'No TIN info has been provided.'",
              [az(X)],
              { affects: ["e-Invoice listing", "Consolidated e-Invoice listing", "MyInvois"] },
            ),
          ],
        },
      ],
      affects: [
        f("LKM Refund Status listing, STMS Details, JPJ XML Log (LKM Refund).", [az(X)]),
        f("Invoice and e-Invoice carry Page 1 Transfer History, Page 2 STMS, Page 3 LKM Refund when a refund is taken. A 'Not charged (FOC RM0.00)' case has no LKM sections.", [az(X)]),
        f("Consolidated e-Invoice job does not pick transactions from the previous month (patched Dec 2025) or LHDN-OK ones.", [az(X)]),
      ],
      cronjobs: [
        { name: "LKM Refund status inquiry", schedule: "Daily 2:30 am (T63). Research study says 02:00.", does: "Picks NW, AC, WC, RB (depending on reason) and triggers a JPJ inquiry. CU is never re-inquired.", sources: [az(X), az("cr/EAINT-12022/01-research/study.md")] },
        { name: "LkmRefundApplicationSyncJob (eauto-cron)", schedule: "Spring cron key cron-config.lkm-refund-sync.time, enabled by cron-config.lkm-refund-sync.enabled. Value hidden in config (prod schedule not confirmed).", does: "Pulls pending refund transactions, calls JPJ and updates applicationStatus on lkmrefundtransaction. Has a manual-trigger admin endpoint for support.", sources: [ac("LkmRefundApplicationSyncJob.java:32")], unconfirmed: true },
        { name: "LkmRefundPtjDocumentSummaryJob (eauto-cron)", schedule: "Spring cron key cron-config.ptj-document-summary.time. Value hidden in config (prod schedule not confirmed).", does: "Builds the daily document-delivery summary per JPJ branch (PTJ). The BO Attachment Listing uses it. Has a manual-trigger admin endpoint.", sources: [ac("LkmRefundPtjDocumentSummaryJob.java:28")], unconfirmed: true },
        { name: "stmsJpjSubmissionTrigger", schedule: "Every 1 hour", does: "Resends SecondEnquiry and Submission for Pending (patched) STMS.", sources: [az(X)] },
        { name: "LHDN e-Invoice resubmission", schedule: "Unknown", does: "Resubmits failed e-Invoices using the BO TIN. Skips if the TIN is blank.", sources: [az(X)], unconfirmed: true },
        { name: "Consolidated e-Invoice job", schedule: "Auto-run, schedule unknown", does: "Resubmits with the general TIN. Skips previous-month and LHDN-OK transactions.", sources: [az(X)], unconfirmed: true },
      ],
      roles: [
        f("UCD and BO can both click Refresh Status.", [az(X)]),
        f("Manage LKM Refund Amount: kmcheah, jasons, nikmuhamad, mfizni can view and edit. BO SuperAdmin, Admin, Probation and others view only, with no [Update] button.", [az(X)]),
        f("Resubmit JPJ Final Submission: BO user.", [az(X)]),
      ],
      afterCompletion: [
        f("CU or RB are end states. CU is never re-inquired.", [az(X)]),
        f("An e-Invoice (LKM Refund) with submission and validation date and response status OK.", [az(X)]),
      ],
      rules: [
        f("Status 'LKM Refund JPJ' column is new in the BO STMS listing, with 'LKM Refund Payment'.", [az(X)]),
        f("JPJ response GLB000000I is normal.", [az(X)]),
        f("Statuses (prod enum LkmRefundApplicationStatus): IN_PROGRESS, REFUND_DONE, REJECTED. JPJ codes AC and WC give IN_PROGRESS, CU gives REFUND_DONE, RB gives REJECTED. The eauto-cron side also knows NEW_APPLICATION, CONFIRMATION and LKM_CANCELLED. A 2026-02-14 migration nulled any stored LKM_CANCELLED, so it is retired in the data.", [ac("LkmRefundApplicationStatus, 2026-02-14-boo.sql")]),
        f("Statuses on other fields: lkmRefundIndicator Y/N, lkmRefundEligibility (flag on stmsTransaction), LkmRefundDocStatus NEW / OWNED / DELETED per uploaded document, lkmRefundPaymentStatus (RHB debit result), lkmRefundJpjSubStatus and response code, and lkmRefundEInvoiceSubmissionStatus / ValidationStatus.", [ac("LkmRefundDocStatus, StmsTransaction")]),
        f("After completion: lkmRefundIndicator and amount fields on stmsTransaction are indexed into ElasticStmsTransaction (eauto-elasticgateway, Service Portal listings). JPJ is called through eauto-cron's SOAP link and logged to lkmrefundjpjlog and lkmrefundjpjtransaction. In test the JPJ call can go to eauto-simulator (jpj-config.lkm-refund.mode). Bank statement, IC copy, stamp and signature are stored by asset-manager. The e-Invoice and payment-invoice events go over RabbitMQ.", [ac("ElasticStmsTransaction, LkmRefundPaymentHandler, EInvoiceRabbitMQProducer:204, PaymentInvoiceRabbitMQProducer")]),
      ],
      scopeToCheck: [
        f("Check each status AC, WC, CU, RB in the status page, STMS Details and the XML Log. Check the 5-hour lock after Refresh.", [ts("EAINT-12022 T05, T63")]),
        f("Check JPJ error codes at Step 6 and the 'LKM Refund request had failed' message.", [ts("EAINT-12022 T27, T29")]),
        f("Check BO resubmit with and without the indicator, and for UCD to UCD Standard vs Interstate.", [ts("EAINT-12022 T10")]),
        f("Check Manage LKM Refund Amount: Select All logic, audit log, role view.", [ts("EAINT-12022 T04, T15")]),
        f("Check Attachment Listing counts, incomplete document, Retry, Download and Print.", [ts("EAINT-12022 T21")]),
        f("Check LHDN retry for invalid and blank TIN, and consolidated e-Invoice.", [ts("EAINT-12022 T09, T37")]),
      ],
      tickets: [
        { key: "EAINT-104", date: "2026-10", what: "LKM Refund.", state: "latest" },
        { key: "EAINT-9973", what: "Status inquiry after submission." },
        { key: "EAINT-12022", date: "2026-10", what: "Board for the add-on test scripts.", state: "latest" },
        { key: "EAINT-10097", what: "Status cronjob and screens." },
        { key: "EAINT-12389", what: "Status screens." },
      ],
      openQuestions: [
        "T59 note says '04.02.2026 (only manual trigger JPJ enquiry)'. T63 shows the cronjob passing. The schedule is only in T63.",
        "How to trigger an 'Incomplete Document' on the Attachment Listing is unknown (needs a dev patch). T21 TS3 has no result.",
        "Schedules for the LHDN and consolidated e-Invoice jobs are not in the extracts.",
      ],
    },

    // -------------------------------------------------------- Insurance Cancellation
    {
      id: "insurance-cancellation",
      name: "Insurance Cancellation (Runnerku) at Step 5",
      summary:
        "Individual sellers (MyKad and MyPR) can ask to cancel their motor insurance when the vehicle is transferred. The add-on shows only when Runnerku says the vehicle is eligible. The IC case is submitted to Runnerku only after the STMS is Approved and the IC fee is paid.",
      portals: ["UCD Portal", "Back Office", "Runnerku (external; eSim on staging)", "AI document check"],
      triggers: [
        {
          id: "tick-ic",
          name: "Tick Insurance Cancellation at Step 5",
          entry: "UCD › STMS › Step 5 › Add-on Services › Insurance Cancellation (below LKM Refund)",
          summary: "Optional and unticked by default. Shows the insurer display name, balance percent and a tooltip.",
          sources: [az(L12022), jira("EAINT-12022", "2026-07")],
          steps: [
            st(
              "Ticking creates the IC transaction and the Runnerku case",
              "UCD › STMS › Step 5",
              "The IC transaction (running number) and the Runnerku case are created at once. Runnerku answers REQUEST_DOCUMENT. The first 'Pending Docs' is never shown. UCD and BO show '-' until the STMS is Approved.",
              [az(`${HOW}#Insurance Cancellation status flow`)],
              {
                branches: [
                  { when: "Vehicle is not eligible (eSim runnerku-eligibility-resp matches the first 2 letters of the vehicle no.)", then: "Add-on is not shown. P&O, RHB Insurance and Progressive are never eligible." },
                  { when: "Seller is a company", then: "Not offered. Individual only." },
                ],
              },
            ),
            st(
              "Fill the pop-up",
              "UCD › STMS › Step 5 › Insurance Cancellation pop-up",
              "Seller's Name (read-only), Bank Name (39 banks), Bank Account No (4-30 digits), Copy of IC, Bank Statement (5MB; PDF/PNG/JPG/JPEG), declaration, [Cancel] / [Next]. [Next] runs the AI check (3 messages). The State field was removed in v1.1. Error 'File size exceeded.'",
              [az(L12022), jira("EAINT-12022 SRD v1.1", "2026-07")],
            ),
            st(
              "Preview and sign insurer documents",
              "UCD › Step 5 › Document Preview",
              "All 19 insurers: Authorisation Letter + Endorsement Form. 6 also an ePayment Slip. Some a KYC Form. The Transfer Slip is NOT signed at Step 5 (BA, 09.10.2026). e-Signature button changes from Close to Proceed after signing. Judged by eye (09.10.2026).",
              [az("cr/EAINT-12022/STATUS.md"), jira("EAINT-12022 SRD v1.1", "2026-07")],
            ),
            st(
              "Pay",
              "UCD › STMS › Step 5 › Payment Summary",
              "Line 'eAuto STMS Fee'. IC processing fee RM38.00 + 8% SST = RM41.04, shown RM0.00 when unticked. IC is its own non-split RHB payment with Reference 2 '.../IC', Payment Ref ID format '0809'. IC coexists with LKM Refund on one Step 5 (user decision 01.10.2026). IC does not replace LKM Refund.",
              [az(L12022), jira("EAINT-12022 SRD v1.1-v1.2", "2026-07")],
              {
                branches: [
                  { when: "IC payment fails", then: "IC Status '-'. Slip Pengesahan pages 1-2 hidden in the IC document. Before EAINT-12549 the fee was charged once right after the STMS payment." },
                ],
              },
            ),
            st(
              "Order of events after payment",
              "System",
              "STMS payment, then STMS submission (JPJ), then LKM Refund payment, then LKM Refund submission, then IC payment, then IC submission to Runnerku. IC goes to Runnerku only after the STMS is Approved and the IC payment is OK.",
              [az(`${HOW}#Insurance Cancellation status flow`)],
              { affects: ["Runnerku", "STMS listing", "Insurance Cancellation Status page"] },
            ),
          ],
        },
        {
          id: "status-page",
          name: "Insurance Cancellation Status page",
          entry: "UCD STMS home › Insurance Cancellation Status tile; BO › Insurance Cancellation Status",
          sources: [az(L12022), jira("EAINT-12022 child tickets 12494, 12497, 12498, 12512, 12544")],
          steps: [
            st(
              "Watch the status change",
              "UCD / BO › Insurance Cancellation Status",
              "7 filters, 11 columns. After STMS Approved: Pending / In Review, then Runnerku PROCESS gives Pending / In Progress, then COMPLETE gives OK / OK. REQUEST_DOCUMENT gives Pending / Pending Docs with [Resubmit]. CANCEL gives Cancelled / Failed (Document Review Failed + IC Status Cancelled).",
              [az(`${HOW}#Insurance Cancellation status flow`), az(L12022)],
              {
                branches: [
                  { when: "Only the IC payment fails", then: "IC Payment Failed. Other IC columns '-'. No [Resubmit] (Azfar decision, over SRD v1.1 §2.2.9 #5 which says Pending Docs)." },
                ],
              },
            ),
          ],
        },
        {
          id: "resubmit-pending-docs",
          name: "Resubmit when Runnerku asks for documents",
          entry: "UCD › Insurance Cancellation Status › [Resubmit] (resubmit.do)",
          summary: "Only on this page. Never on the STMS Transaction Listing and not on BO.",
          sources: [az("knowledge/_core/stms.md#Entry points"), az(`${HOW}#Insurance Cancellation status flow`)],
          steps: [
            st(
              "Re-sign and resubmit",
              "UCD › Insurance Cancellation Status › Resubmit",
              "Redirects to a new page with a pre-populated signature (v1.2). Resubmission was on hold at times.",
              [jira("EAINT-12022 SRD v1.2", "2026-10"), az(L12022)],
            ),
          ],
        },
        {
          id: "retry-payment",
          name: "Failed IC payment is retried by the system (EAINT-12549)",
          entry: "System at STMS approval",
          summary: "Status: Ready for Prod as of 19.10.2026.",
          sources: [jira("EAINT-12549", "2026-10")],
          steps: [
            st(
              "Retry task and poller",
              "System",
              "A retry-task row (inscancelretrypaymenttask) is created at STMS approval. A cron poller claims due tasks and retries through RHB with the same payment reference. On success the normal payment records and invoice are produced and the case goes to Runnerku. BO shows Resubmit after the auto-retries fail.",
              [jira("EAINT-12549", "2026-10")],
            ),
          ],
        },
        {
          id: "enhancements-todo",
          name: "Enhancements raised 21-22.10.2026 (To Do)",
          entry: "Several (split from the 'Insurance Cancellation Enhancement request' of 22.10.2026)",
          summary: "None built. EAINT-12573 (2026-10-21) overlaps 12581-12584. The newer split tickets supersede the umbrella.",
          sources: [jira("EAINT-12581", "2026-10"), jira("EAINT-12573", "2026-10")],
          steps: [
            st("Resubmit button visible for 24 hours only", "UCD › IC Status", "Counted by working day after a payment failure. Once only. Holiday cases handled by Ops manually. EAINT-12581.", [jira("EAINT-12581", "2026-10")]),
            st("Email Ops when Runnerku rejects", "System", "Email with Vehicle No, STMS Tx No, IC Tx No, failure reason and date. Ops calls the UCD to reupload. EAINT-12582.", [jira("EAINT-12582", "2026-10")]),
            st("Send nothing to Runnerku if IC was unticked before payment", "System", "A production case sent all documents although IC was unticked. EAINT-12583.", [jira("EAINT-12583", "2026-10")]),
            st("BO export on the IC listing", "BO › Insurance Cancellation Status", "Export for Ops Manager only. Document checklist tick button copied from LKM Refund. EAINT-12584 and 12573.", [jira("EAINT-12584", "2026-10")]),
            st("Reuse uploaded documents between LKM Refund and IC", "UCD › Step 5", "Prepopulate; the UCD may replace. EAINT-12585.", [jira("EAINT-12585", "2026-10")]),
            st("Owner awareness and Ops alert emails", "System", "Owner email or WhatsApp at Step 1 and 2, eligibility notice after the JPJ check, Ops alert on IC payment failure or Runnerku reject. EAINT-12572.", [jira("EAINT-12572", "2026-10")]),
            st("BO STMS listing column 'Ins Cancellation Balance %'", "BO › STMS Transaction", "Before 'Ins Cancellation Payment' (12586, Ready for Prod). 12589 (To Do): show '-' for Failed, Cancelled or no-transaction cases and a whole percent such as '67%'.", [jira("EAINT-12586", "2026-10"), jira("EAINT-12589", "2026-10")]),
          ],
        },
      ],
      affects: [
        f("STMS listing (UCD + BO): 4 filters, 5 columns, remarks, actions. STMS Details: IC section, Payment Details (IC), e-Invoice.", [az(L12022)]),
        f("New UCD and BO 'Insurance Cancellation Status' module. Documents downloadable as 'Insurance Cancellation Document' from STMS Details.", [az(L12022), az("cr/EAINT-12022/STATUS.md")]),
        f("e-Invoice and Consolidated e-Invoice listing, Type 'Insurance Cancellation'. BO RHB Payment Transaction. Payment Report and Payment Breakdown Report.", [az(L12022), jira("EAINT-12022 children 12494-12544")]),
        f("Reconciliation Listing type: matched only when IC Status = OK (OQ16). Revenue Report unclear (Q16).", [az(L12022)], { unconfirmed: true }),
        f("The SST Payment Report does not include IC.", [az(L12022)]),
        f("Homepage popup and What's New (see the popups flow).", [jira("EAINT-12555", "2026-10")]),
      ],
      cronjobs: [
        {
          name: "InsCancelRetryPaymentPoller (eauto-asset-manager)",
          schedule: "Cron key cron.ins-cancel-retry-payment.time. Runs every 2 minutes by default. Retries each due task hourly, up to 10 attempts, never between 23:00 and 08:00 MYT.",
          does: "Claims due inscancelretrypaymenttask rows and retries the RHB fee charge with the same reference. When the attempts run out it emails the support alert address (support.alert.ins-cancel). It also flags tasks stuck in progress for more than 15 minutes (settings.inscancel.payment-retry.stuck-after) and sends one support alert. It does not reset them. Ops must re-arm them.",
          sources: [ac("InsCancelRetryPaymentPoller, eauto-asset-manager README:102-146"), jira("EAINT-12549 comment", "2026-10-19")],
        },
        {
          name: "e-Invoice result copy-back (eauto-cron)",
          schedule: "Not given in the answer",
          does: "Copies the e-Invoice result back onto IC and STMS rows (EInvoiceTransactionHandler) and reindexes. A reconciliation job against RHB payments also includes IC rows. It does not poll Runnerku for status.",
          sources: [ac("EInvoiceTransactionHandler, InsCancelReconSlaveRepository")],
          unconfirmed: true,
        },
      ],
      roles: [
        f("Individual sellers only. A company-level permission for IC is not named (unlike TH and eLKM).", [az(L12022), az("cr/EAINT-9233/LEDGER.md")]),
        f("BO IC page is open to all users after the patch. On 15.10.2026 deploy night all BO users except 8 hard-coded ones (jasons, eautohaffiz, eautokelvin, eautosoyeng, mfared, nikmuhamad, soxian, mfizni) got access denied (/eauto/home/?err=203). Patched the same night.", [az("knowledge/portals/backoffice/how-we-test.md#Traps"), az(L12022)]),
        f("Prod code: UCD side only the buyer company of the STMS, and only if its payment account is an active RHB payer (InsCancelUtil.isRhbPayer), can open, sign or resubmit an IC. The STMS must have an individual seller (seller category not 4, 5 or 6). BO side: any eAuto-company login can view the IC listing and detail. The code comment says there is no per-user function allow-list on that screen. Document download links need isEAutoStaff. No AATF or public access.", [ac("InsCancelAddOnController.openOwnStms, InsCancelUtil:61-70, InsCancelBackofficeController:70,88")]),
        f("BO export on the IC listing: Ops Manager only (To Do).", [jira("EAINT-12584", "2026-10")]),
      ],
      afterCompletion: [
        f("The case goes to Runnerku, the external insurance-cancellation processor. Status comes back by webhook. The signed IC document is downloadable from STMS Details.", [az("cr/EAINT-12022/STATUS.md"), jira("EAINT-12022 SRD v1.1", "2026-07")]),
      ],
      rules: [
        f("Statuses (prod): Case status InsCancelCaseStatus Pending → Completed (shown 'OK') / Cancelled / Failed. Document Review status InsCancelDocStatus New ('Not Started') → PendingDocs → InReview → InProgress → OK / Failed, driven by Runnerku codes REVIEW, PROCESS, REQUEST_DOCUMENT, COMPLETE, CANCEL. Backend transaction status: Pending at creation → Approved once Runnerku has the case → Failed if it cannot be paid or handed off. Payment New → Pending → Paid / Failed. transactionStatus is always set to Approved once Runnerku has the case.", [ac("InsCancelCaseStatus, InsCancelDocStatus, InsCancelStatusUtil:44-48,376-390")]),
        f("Prod code steps: Step 4 'Make Payment' page (payment.jsp) shows the slot only if the company is an RHB payer and an eligibility check against Runnerku passes. Popup step 1 (upsert.do) creates the IC row (caseStatus Pending, transactionStatus Pending, documentReviewStatus New, lastPaymentStatus New) and opens or reuses the Runnerku case. A 'BLOCKED' answer (case exists elsewhere, NRIC or bank mismatch) stops there. Popup step 2 (finalize.do) needs the Runnerku case VALIDATED and marks the STMS inscancelStatus VALIDATED. The IC fee is charged with the STMS payment. After JPJ approves the STMS, asset-manager submits the case to Runnerku in the background.", [ac("InsCancelAddOnController:379-526, InsCancelSubmissionHandler:96-126, StmsPaymentController:555-581")]),
        f("After completion (prod): the STMS enquiry listing carries IC columns (inscancelPaymentStatus, inscancelCaseStatus, inscancelDocumentReviewStatus) copied onto the STMS row and indexed into eauto-elasticgateway. e-Invoice goes out once the case is submitted with the fee paid (transaction type INSURANCE_CANCELLATION in eauto-einvoice). A GST payment report row is written (InsCancelGstPaymentReportHandler). No eAuto-notification email, SMS or WhatsApp template exists for IC. Only the ops support alert email from asset-manager.", [ac("InsCancelFundTransferHandler:183-185, InsCancelGstPaymentReportHandler, Constant.java:64-84")]),
        f("Runnerku pushes only on a status change. Only REQUEST_DOCUMENT, COMPLETE and CANCEL reach eAuto from eSim.", [az(`${HOW}#eSim Runnerku facts`)]),
        f("Assumption: only STMS transactions created after the production deploy are in scope.", [az("knowledge/_core/stms.md#Entry points")], { unconfirmed: true }),
        f("AI document check is real since 07.10.2026 and charged per use.", [az(L12022)]),
        f("The transfer slip sent to the insurer is unsigned (BA, 09.10.2026).", [az("cr/EAINT-12022/STATUS.md")]),
        f("Column name differs by source: 'Ins Cancellation Transaction No', 'Insurance Cancellation Transaction No' and the build's 'IC Transaction No'.", [az("cr/EAINT-12022/STATUS.md")]),
      ],
      scopeToCheck: [
        f("Check eligibility: eligible and not eligible insurers, Individual vs Company, MyKad vs MyPR.", [az(L12022), az(`${HOW}#eSim Runnerku facts`)]),
        f("Check the pop-up fields, 39 banks, account no length, file size and type errors, and the 3 AI messages.", [az(L12022)]),
        f("Check preview and sign for each insurer family: 19 with Authorisation Letter + Endorsement Form, 6 with ePayment Slip, KYC Form cases.", [az("cr/EAINT-12022/STATUS.md")]),
        f("Check fee RM38.00 + SST = RM41.04, and RM0.00 when unticked, with and without LKM Refund.", [az(L12022)]),
        f("Check the status paths: PROCESS, COMPLETE, REQUEST_DOCUMENT, CANCEL, payment failure.", [az(`${HOW}#Insurance Cancellation status flow`)]),
        f("Check Resubmit only on the IC Status page and not on the STMS listing or BO.", [az("knowledge/_core/stms.md#Entry points")]),
        f("Check the listings, e-Invoice type, reconciliation and reports. Check SST Payment Report does not include IC.", [az(L12022)]),
        f("Check BO Insurance Cancellation Status access for BO roles.", [az("knowledge/portals/backoffice/how-we-test.md#Traps")]),
      ],
      tickets: [
        { key: "EAINT-12022", date: "2026-10", what: "Insurance Cancellation add-on. Live S34.10-20261014. SRD v1.2 2026-10-13. 352 TS, 319 PASS, 33 deprioritised.", state: "latest" },
        { key: "EAINT-10165", date: "2026-03", what: "Legacy prototype. Done.", state: "legacy", supersededBy: "EAINT-12022" },
        { key: "EAINT-12549", date: "2026-10", what: "Failed IC fee retry task. Ready for Prod.", state: "latest" },
        { key: "EAINT-12586", date: "2026-10", what: "Ins Cancellation Balance % column. Ready for Prod.", state: "latest" },
        { key: "EAINT-12589", date: "2026-10", what: "Balance % column values. To Do.", state: "latest" },
        { key: "EAINT-12581", date: "2026-10", what: "Resubmit visible 24 hours. To Do.", state: "latest" },
        { key: "EAINT-12582", date: "2026-10", what: "Email Ops on Runnerku reject. To Do.", state: "latest" },
        { key: "EAINT-12583", date: "2026-10", what: "Send nothing if IC unticked. To Do.", state: "latest" },
        { key: "EAINT-12584", date: "2026-10", what: "BO export, Ops Manager. To Do.", state: "latest" },
        { key: "EAINT-12585", date: "2026-10", what: "Reuse documents with LKM Refund. To Do.", state: "latest" },
        { key: "EAINT-12572", date: "2026-10", what: "Awareness and alert emails. To Do.", state: "latest" },
        { key: "EAINT-12573", date: "2026-10", what: "Umbrella for 12581-12584.", state: "legacy", supersededBy: "EAINT-12581" },
        { key: "EAINT-11156", what: "Message blast to West Malaysia. To Do." },
        { key: "EAINT-12580", what: "Watermark case. Referenced, not read." },
      ],
      openQuestions: [
        "Transfer slip sent to the insurer is unsigned (BA, 09.10.2026). Is that final?",
        "Real Runnerku-only behaviours such as 'In Review' cannot be reproduced on eSim.",
        "77 open questions were outstanding at draft time.",
        "IC payment failed: SRD v1.1 §2.2.9 #5 says Pending Docs and Resubmit. Azfar decided IC Payment Failed with no Resubmit. Which stands?",
        "Prod code on payment failure: payment failure sets Failed and PendingDocs, and Resubmit comes from the IC Status page only when Runnerku asks for new documents (resubmitBy decides dealer or BO). This sits between SRD v1.1 and Azfar's decision. Confirm on screen.",
        "Stuck IC payment-retry tasks are not auto-reset. Who re-arms them in Ops, and how?",
      ],
    },

    // ------------------------------------------------------------------- popups
    {
      id: "homepage-popups",
      name: "Homepage popups and What's New for the add-ons",
      summary: "Launch posters shown on the UCD homepage after login.",
      portals: ["UCD Portal"],
      triggers: [
        {
          id: "login-popup",
          name: "Poster popup after UCD login",
          entry: "UCD Home (after login)",
          sources: [jira("EAINT-12555", "2026-10"), jira("EAINT-12438", "2026-10"), jira("EAINT-12421", "2026-09")],
          steps: [
            st(
              "Show the latest poster once per login",
              "UCD Home",
              "Latest: EAINT-12555 replaces the LKM Refund popup with the Insurance Cancellation poster (prod 20.10.2026). One time per login.",
              [jira("EAINT-12555", "2026-10")],
            ),
          ],
        },
        {
          id: "whats-new",
          name: "What's New section",
          entry: "UCD Home › What's New",
          sources: [jira("EAINT-12525", "2026-10")],
          steps: [
            st(
              "'What's New - LKM Refund'",
              "UCD Home › What's New",
              "Heading changes from 'What's New' to 'What's New – LKM Refund'. The BMK video is replaced by the LKM Refund tutorial. Before, only users with insurance permission saw it. Now all UCD users do (clarified 20.10.2026).",
              [jira("EAINT-12525", "2026-10")],
            ),
          ],
        },
      ],
      affects: [f("UCD Homepage only.", [jira("EAINT-12555", "2026-10")])],
      cronjobs: [],
      roles: [f("All UCD users see the What's New LKM section.", [jira("EAINT-12525", "2026-10")])],
      afterCompletion: [],
      rules: [f("Popup shows one time per login.", [jira("EAINT-12555", "2026-10")])],
      scopeToCheck: [
        f("Check the popup appears once per login and again at the next login.", [jira("EAINT-12555", "2026-10")]),
        f("Check What's New heading and video for a user with and without insurance permission.", [jira("EAINT-12525", "2026-10")]),
      ],
      tickets: [
        { key: "EAINT-12555", date: "2026-10", what: "Insurance Cancellation poster replaces LKM Refund popup. Prod 20.10.2026.", state: "latest" },
        { key: "EAINT-12438", date: "2026-10", what: "LKM Refund popup v1.1. Prod 07.10.2026.", state: "legacy", supersededBy: "EAINT-12555" },
        { key: "EAINT-12421", date: "2026-09", what: "LKM Refund launching poster. Prod 01.10.2026.", state: "legacy", supersededBy: "EAINT-12438" },
        { key: "EAINT-12525", date: "2026-10", what: "What's New - LKM Refund heading and tutorial video.", state: "latest" },
      ],
    },
  ],
};
