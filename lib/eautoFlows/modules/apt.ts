import type { Fact, Module, Source, Step } from "../types";

const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref: `eauto-qa-azfar:${ref}`, date });
const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string): Source => ({ kind: "ts", ref });
const ask = (ref: string): Source => ({ kind: "askeauto", ref: `07-ask-eauto.md ${ref} (prod/master 0e21bef3)`, date: "2026-10-23" });

const ac = (ref: string): Source => ({ kind: "askeauto", ref: `prod code 0e21bef3db — ${ref}`, date: "2026-10-23" });

const f = (text: string, sources: Source[], extra?: Partial<Fact>): Fact => ({ text, sources, ...extra });
const st = (
  title: string,
  where: string | undefined,
  detail: string | undefined,
  sources: Source[],
  extra?: Partial<Step>,
): Step => ({ title, where, detail, sources, ...extra });

const A = "knowledge/_core/apt.md";
const P = "knowledge/portals/ucd/portal.md";
const FEES = "knowledge/_core/fees-and-pricing.md";

export const apt: Module = {
  id: "apt",
  name: "APT (Automatic Permanent Transfer)",
  short: "APT",
  portals: ["UCD Portal", "Back Office", "JPJ (notices 5.5 and 6.0)", "RHB (payment)", "Cronjob"],
  summary:
    "APT lets a dealer view and pay for vehicles that have been held under STMS for 6 months or more. The dealer never starts an APT. It is created from JPJ notices 5.5 and 6.0, or by a BO manual trigger. The dealer then pays at Step 5 and JPJ makes the transfer permanent.",
  related: ["stms", "ucd-to-ucd", "payments-fees", "estm", "wholesale", "backoffice"],
  glossary: [
    { term: "APT", meaning: "Automatic Permanent Transfer. Moves a vehicle from STMS (temporary) to permanent ownership of the dealer.", sources: [az(A), jira("EAINT-12403 SRD v1.1 §1.4 #2")] },
    { term: "JPJ Notice 5.5", meaning: "The expiry notice. It creates the APT with status New.", sources: [az(`${A}#How a vehicle reaches APT`)] },
    { term: "JPJ Notice 6.0", meaning: "The permanent transfer notice. It moves the APT to Pending and makes it payable.", sources: [az(`${A}#How a vehicle reaches APT`)] },
    { term: "VEL000392E", meaning: "The eSim vehicle prefix / JPJ code used to make an eSTM create an APT and to make the cronjob retry.", sources: [az(`${A}#How a vehicle reaches APT`), ts("EAINT-8668 8668_APT_TS1")] },
    { term: "Reset Payment", meaning: "A BO action that clears a failed payment so the dealer can pay again at the current price.", sources: [az(`${A}#Payment reset (BackOffice Reset Payment)`)] },
  ],
  flows: [
    // -------------------------------------------------------------- creation
    {
      id: "creation",
      name: "How an APT is created",
      summary: "The dealer never starts an APT. JPJ notices, a BO manual trigger, an eSTM, or a Wholesale booking fee create it.",
      portals: ["Back Office", "JPJ (external)", "System"],
      triggers: [
        {
          id: "jpj-notices",
          name: "JPJ notices 5.5 then 6.0",
          entry: "System: JPJ expiry notice handler",
          summary: "eAuto matches each notice line to an existing STMS of the same vehicle and dealer company.",
          sources: [az(`${P}#APT — mapped`), ask("Q3 §3.3")],
          steps: [
            st(
              "Notice 5.5 creates the APT",
              "System (JpjExpiryNotificationJob, daily about 5am)",
              "The APT is created with status New and a reference starting APT. Prod code says this job also turns an aging STMS into an APT.",
              [az(`${A}#How a vehicle reaches APT`), ask("Q3 §3.3")],
            ),
            st(
              "Notice 6.0 makes it payable",
              "System",
              "Status moves to Pending. The pay link shows only when the 6.0 notice date is present and the transaction is not Cancelled or Expired.",
              [az(`${A}#How a vehicle reaches APT`), az(`${P}#APT — mapped`)],
            ),
          ],
        },
        {
          id: "bo-manual-trigger",
          name: "BO Manual APT Trigger",
          entry: "BO › Support Tools › Manual APT Trigger (view/stms/manual-trigger-apt)",
          summary: "Used by QA and support to make an APT appear without waiting for JPJ.",
          sources: [az(`${P}#Making one appear without waiting`), ts("EAINT-12289 12289_E2E1"), ts("EAINT-8668 8668_APT_TS1")],
          steps: [
            st(
              "Search the company and vehicle",
              "BO › Support Tools › Manual APT Trigger",
              "Search by company ROC and vehicle. Pick the Expiry Date (read-only date picker).",
              [az(`${P}#Making one appear without waiting`)],
              { branches: [{ when: "No expiry date picked", then: "'Please key in expiry date before proceed trigger JPJ APT 5.5'." }] },
            ),
            st(
              "Trigger 5.5, then 6.0",
              "BO › Manual APT Trigger",
              "Each button is one-shot. 5.5 creates the APT at New. 6.0 moves it to Pending. The trigger writes a support audit-log entry.",
              [az(`${P}#Making one appear without waiting`), az(`${A}#How a vehicle reaches APT`)],
              { affects: ["APT listing (UCD)", "Support audit log"] },
            ),
          ],
        },
        {
          id: "ajax-trigger",
          name: "Trigger by endpoint",
          entry: "POST /ajax/estm/transaction/triggerAPT.do (vehicleRegNo + ucdCompanyId)",
          summary: "Does both notices in one call. Test use.",
          sources: [az(`${P}#Making one appear without waiting`)],
          steps: [
            st("Call the endpoint", "Back end", "Sends vehicleRegNo and ucdCompanyId. Does notice 5.5 and 6.0.", [az(`${P}#Making one appear without waiting`)]),
          ],
        },
        {
          id: "other-routes",
          name: "STMS approved, eSTM with VEL000392E, Wholesale booking fee",
          entry: "Other flows",
          sources: [az(`${A}#How a vehicle reaches APT`), ts("EAINT-12289 12289_E2E3, 12289_R2")],
          steps: [
            st(
              "An approved STMS is the normal route",
              "UCD › STMS",
              "After JPJ sends the notices, the STMS vehicle becomes an APT.",
              [az(`${A}#How a vehicle reaches APT`)],
              { affects: ["STMS"] },
            ),
            st(
              "eSTM with code VEL000392E",
              "UCD › eSTM",
              "Needs a completed STMS on the same vehicle first. The vehicle then shows in the APT Transaction Listing.",
              [az(`${A}#How a vehicle reaches APT`), ts("EAINT-12289 12289_E2E3")],
              { affects: ["eSTM"] },
            ),
            st(
              "Wholesale booking fee",
              "Wholesale",
              "Wholesale counts as STMS for APT. The seller booking fee includes the APT value (eSim STMS response code 4Z).",
              [az(`${A}#How a vehicle reaches APT`), ts("EAINT-12289 12289_R2")],
              { affects: ["Wholesale"] },
            ),
          ],
        },
        {
          id: "jpj-permanent-transfer-job",
          name: "JpjPermanentTransferJob (6.0 notice)",
          entry: "System: JpjPermanentTransferJob, daily",
          summary: "Prod code: a second daily job reads JPJ's 6.0 Permanent Transfer notice and attaches it to the APT.",
          sources: [ac("JpjPermanentTransferJob, JpjPermanentTransferHandlerBean")],
          steps: [
            st("Apply the 6.0 notice", "System", "If the dealer has a pay-on-behalf or RHB direct-debit arrangement, the handler tries to pay at once. If not, the dealer pays RM115 on the APT payment page (RHB or FPX).", [ac("JpjPermanentTransferHandlerBean")]),
          ],
        },
        {
          id: "dead-estm-button",
          name: "eSTM listing button 'Click here to pay APT fees' (dead)",
          entry: "eSTM enquiry screen (view/estm/enquiry/view.jsp)",
          summary: "Prod code: the button depends on the flags isTriggerAPT and aptTxRefNo. No controller ever sets them, so the button is dead code today.",
          sources: [ac("estm/enquiry/view.jsp:71,77,1061-1068")],
          steps: [
            st("Button never shows", "UCD › eSTM enquiry", "No flag is set, so users cannot reach APT from this button.", [ac("estm/enquiry/view.jsp")]),
          ],
        },
        {
          id: "wholesale-apt",
          name: "Wholesale APT path (WholesaleAptController)",
          entry: "Wholesale companies",
          summary: "Prod code: Wholesale has its own parallel APT controller. Test it separately.",
          sources: [ac("WholesaleAptController")],
          steps: [
            st("Wholesale APT", "Wholesale", "Mirrors the same APT creation fields on its own code path.", [ac("WholesaleAptController")]),
          ],
        },
        {
          id: "auto-6-0",
          name: "APT 6.0 auto-trigger",
          entry: "System: when the transaction reaches 6 months",
          summary: "Same job as the resubmit cronjob, not a separate one.",
          sources: [az(`${A}#How a vehicle reaches APT`), jira("EAINT-12403 SRD §1.4 #7"), mine("02b business-rules §1.2 item 8")],
          steps: [
            st(
              "System performs the APT at 6 months",
              "Cronjob",
              "An APT created after STMS approval is submitted by the cronjob with no UCD action.",
              [az(`${A}#How a vehicle reaches APT`), mine("02b business-rules §1.2 item 8"), ts("EAINT-12289 12289_R3")],
            ),
          ],
        },
      ],
      affects: [
        f("APT listing (UCD) and BO APT Transaction Enquiry. Columns: Expiry Date 5.5, Expiry Date 6.0, Payment, JPJ Transfer, Tx Status, e-Invoice Status, Remarks.", [az(`${P}#APT — mapped`)]),
        f("BO JPJ XML Log (APT).", [az(P)]),
        f("Prod code: no APT email, SMS or WhatsApp template was found. The 'send email' call for the 5.5 notice inside JpjExpiryNoticeHandlerBean is commented out in the source. A link to eauto-elasticgateway, report-engine or ClickHouse marts for APT was not confirmed.", [ac("JpjExpiryNoticeHandlerBean")]),
      ],
      cronjobs: [
        {
          name: "JpjExpiryNotificationJob",
          schedule: "Daily, about 5am (dev-reference config; prod file withheld). Not in the list of 4 jobs named active in prod.",
          does: "Reads JPJ's 5.5 Expiry Notice data and creates the APT record (status New) for an eligible STMS. Turns an aging STMS into an APT.",
          sources: [ask("Q3 §3.3"), ac("JpjExpiryNotificationJob, JpjExpiryNoticeHandlerBean")],
          unconfirmed: true,
        },
        {
          name: "JpjPermanentTransferJob",
          schedule: "Daily, about 7:30am (dev-reference config; prod file withheld). Not in the list of 4 jobs named active in prod.",
          does: "Reads JPJ's 6.0 Permanent Transfer notice, attaches it to the APT, and can auto-trigger payment.",
          sources: [ac("JpjPermanentTransferJob, JpjPermanentTransferHandlerBean")],
          unconfirmed: true,
        },
        {
          name: "AptJpjSubmissionJob",
          schedule: "Two times a day in the dev config: 8:30am and 5:50pm. Named as one of the 4 jobs active in prod. Live time not confirmed (prod scheduler file withheld).",
          does: "Batch-submits APT records with Transaction = Pending, Payment = Paid and JPJ submission = Pending to JPJ.",
          sources: [ac("AptJpjSubmissionJob, NewJpjAptSubmissionHandlerBean")],
          unconfirmed: true,
        },
      ],
      roles: [
        f("BO Manual APT Trigger menu: SuperAdmin and Hub Admin.", [az("knowledge/_core/stms.md#BackOffice"), ts("EAINT-10038")], {
          alt: [{ text: "Prod code found no per-user function list on ManualAptTriggerController. Any operator BO session reaches the manual trigger pages and the resubmission audit-log viewer.", sources: [ac("ManualAptTriggerController:195-293")], note: "prod code says" }],
        }),
        f("The endpoint /ajax/estm/transaction/triggerAPT.do only needs a logged-in session. No role or company-type check was found.", [ac("ManualAptTriggerController")]),
        f("UCD portal users (any logged-in company or branch session) see the APT tile and pay. The payment page also checks the user's 'pay on behalf' permission and the company's RHB status. No AATF, Service Portal or public access.", [ac("AptPaymentController, AptEnquiryController")]),
      ],
      afterCompletion: [
        f("An APT row at status New (5.5) or Pending (6.0) in the dealer's APT listing. The dealer pays from there.", [az(`${A}#How a vehicle reaches APT`)]),
      ],
      rules: [
        f("All routes in are priced the same, at the configuration in force when payment runs.", [az(`${A}#How a vehicle reaches APT`)]),
        f("The 6-month rule is JPJ's. Azfar's code reading found no 6-month check in eAuto. The Perakuan text says 6 months.", [az("knowledge/_core/stms.md#Rules still unsettled")], {
          alt: [{ text: "After roughly 6 months of temporary ownership an APT is auto-created by the expiry notification job.", sources: [ask("Q3 §5.4"), ask("Q3 §3.3")], note: "prod code says" }],
        }),
      ],
      scopeToCheck: [
        f("Create an APT each way: STMS then manual trigger 5.5 and 6.0, eSTM with VEL000392E, Wholesale booking fee, 6.0 auto by cronjob.", [ts("EAINT-12289 12289_E2E1, E2E3, R2, R3")]),
        f("Check the Manual APT Trigger menu is visible only to SuperAdmin and Hub Admin.", [ts("EAINT-10038")]),
      ],
      tickets: [
        { key: "EAINT-12289", date: "2026-09", what: "APT fee RM15 to RM20. Entry points tested.", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-12403", date: "2026-10", what: "APT fee RM20 to RM25 and reset Failed/Failed.", state: "latest" },
        { key: "EAINT-8668", date: "2025-08", what: "Cronjob resubmits failed APT payments.", state: "latest" },
      ],
      openQuestions: [
        "Timing of JPJ notices 5.5 and 6.0 is JPJ's decision. No eAuto document defines it.",
        "Prod times for JpjExpiryNotificationJob (5:00) and JpjPermanentTransferJob (7:30) are dev-config values and these two are not in the list of 4 active prod jobs. Do they run in prod?",
        "Where exactly does APT Transaction status move from New to Pending? Prod code answer could not pin the line (inferred, between payment and the JPJ-submission query).",
      ],
    },

    // ------------------------------------------------------------------- pay
    {
      id: "pay-apt",
      name: "Dealer pays an APT (Step 5 and Step 6)",
      summary: "The dealer opens the APT listing, searches, clicks Resubmit and pays at Step 5. JPJ transfer follows as a batch.",
      portals: ["UCD Portal", "RHB (payment)", "JPJ (external)"],
      triggers: [
        {
          id: "apt-tile",
          name: "APT tile on UCD Home",
          entry: "UCD Home › APT tile (view/ucd/apt/enquiry/) › Search Now › row Resubmit",
          summary: "There is no create button. The list is empty until searched.",
          sources: [az(`${P}#The journey is two steps`), az(A)],
          steps: [
            st(
              "Open the APT listing and search",
              "UCD › APT",
              "Tile shows 'RM125' (JPJ 100 + eAuto 25, before 8% tax). The list is empty until Search Now. Preconditions: same company (and same branch if branch-restricted), active RHB account, and the 6.0 date present.",
              [az(`${P}#Preconditions before a dealer can pay one`), jira("EAINT-12403", "2026-10")],
              {
                branches: [
                  { when: "Company has no active RHB account", then: "'No RHB account' popup." },
                  { when: "User is a Valuation Advisor", then: "View only." },
                  { when: "BO Transaction Restriction = Yes", then: "Restriction popup on APT Resubmit." },
                ],
              },
            ),
            st(
              "Step 5 - Payment",
              "UCD › APT › Resubmit › Step 5 (apt/transaction/payment.do)",
              "The wizard opens at Step 5. It shows vehicle, STMS submission date, both expiry dates, dealer company and Payment Summary: JPJ Fee + eAuto Fee + Service Tax 8% = Total. Car Semenanjung RM127.00. Sabah or Sarawak RM67.00. Click Next, then Yes on the payment confirmation.",
              [az(`${A}#Steps that matter for testing`), jira("EAINT-12403", "2026-10")],
              {
                affects: ["RHB payment", "BO APT Transaction Enquiry"],
                branches: [
                  { when: "Payment succeeds", then: "Dialog 'Payment request sent'. [OK] goes to the APT listing, not Step 6." },
                  { when: "Payment Failed", then: "Row shows Resubmit. Step 5 shows 'Payment Status: Failed' with only [Retry], then 'Sure to retry?' Cancel / Make Payment. A same-day retry re-sends the same RHB reference (one debit)." },
                ],
              },
            ),
            st(
              "Step 6 - Submission (JPJ Transfer)",
              "UCD › APT › jpj-sub.do?id=",
              "Shows JPJ Transfer Status (e.g. OK - SUCCESSFUL) and the submission date and time. No price. The normal flow does not reach it. Reloading (F5) the paid APT's payment page opens it.",
              [az(`${A}#Steps that matter for testing`)],
              {
                branches: [{ when: "JPJ batch has not run yet", then: "JPJ Transfer reads Pending until the batch runs." }],
              },
            ),
            st(
              "View an Approved APT",
              "UCD › APT › View (apt/enquiry/view.do?id=)",
              "An Approved row offers only [View]. Transaction Details shows Invoice, e-Invoice, Slip Pengesahan, JPJ Transfer (Final Submission) and Payment History. A Failed row offers [Resubmit].",
              [az(`${A}#Steps that matter for testing`)],
            ),
          ],
          affects: [
            f("FUTURE: Firefox Browser Reminder popup on APT Step 6 (jpj-sub.do) only, on every load. Not on Step 5, not on the listing, not on Details. 'Once per transaction' was dropped by the BA on 21.10.2026. EAINT-12253, S34.X-20261028.", [az(`${A}#FUTURE — not live yet (20.10.2026)`)], { unconfirmed: true }),
          ],
        },
      ],
      affects: [
        f("APT listing columns: Payment, JPJ Transfer, Tx Status, e-Invoice Status. BO APT enquiry. Reports: BO eAuto STMS, APT and eSTM Transaction Listing; reconciliation summary; BO APT Transaction Enquiry Export CSV.", [az(`${FEES}#Every surface a price reaches`)]),
        f("Invoice, e-Invoice, Slip Pengesahan, LHDN response keep the stored paid amount.", [az(`${FEES}#Every surface a price reaches`), ts("EAINT-12289 12289_INV1")]),
        f("Home APT tile price is hard-coded (home.jsp). It must be checked after each price change.", [az(`${FEES}#Every surface a price reaches`)]),
        f("Wholesale seller booking fee follows the APT fee.", [mine("02b business-rules §1.2")]),
      ],
      cronjobs: [
        {
          name: "AptJpjSubmissionJob",
          schedule: "Twice a day, about 8:30am and 5:50pm (dev-reference config; prod file withheld)",
          does: "Batch APT submission to JPJ. The downstream successor of STMS.",
          sources: [ask("Q3 §3.2")],
          unconfirmed: true,
        },
      ],
      roles: [
        f("Same company, plus the same branch if the user is branch-restricted. 'Valuation Advisor' users can only View.", [az(`${P}#Preconditions before a dealer can pay one`)]),
        f("No MyKad step. Identity was captured in the STMS.", [az(`${A}#Steps that matter for testing`), az("01-azfar-repo.md Module APT")]),
      ],
      afterCompletion: [
        f("APT listing shows Approved. BO APT enquiry shows it. JPJ transfer is a batch, so JPJ Transfer reads Pending until the batch runs.", [az(`${P}#The journey is two steps`)]),
      ],
      rules: [
        f("Statuses seen: New, Pending, Committed, Approved, Failed, Cancelled.", [az("01-azfar-repo.md Module APT")]),
        f("Statuses (prod enums): Transaction New → Pending → Approved or Failed (Cancelled, Expired, Draft exist but the APT flow was not seen setting them). Payment New → Pending / Submitted → Paid, or Failed / Error / Aborted, ToRefund / Refunded. JPJ submission New → Pending → Approved (Passed) or Failed. e-Invoice submission and validation start at New. On JPJ success: Approved and jpjApprovedAt is set. On failure: Failed, and two specific JPJ error codes trigger an automatic resubmit.", [ac("TransactionStatus, PaymentStatus, JpjStatus, NewJpjAptSubmissionHandlerBean")]),
        f("After approval: e-Invoice event to eauto-einvoice (EInvoiceMessager.sendAptMsg), a payment/GST report event (PaymentInvoiceMessager), a payment-transaction event, a saved JPJ receipt and a printable APT receipt (PrintAptReceiptHandler). RHB payment records are written when paid by RHB.", [ac("EInvoiceMessager, PaymentInvoiceMessager, PrintAptReceiptHandler")]),
        f("JPJ Fee follows the UCD company's mailing-address State in BO > Manage Company Accounts: Semenanjung RM100, Sabah or Sarawak RM40. It is read at payment time, not stored when the APT is created.", [az(`${A}#Region — the UCD company's address`)]),
        f("Four exception rows break the region rule. APT IA Sabah and IA Sarawak: JPJ 100.00, total RM127.00. APT BF Semenanjung and BJ Semenanjung: JPJ 40.00, total RM67.00. Test against the row, not the rule.", [az(`${FEES}#Rows that price differently (rate card, live 20.09.2026)`)], {
          alt: [{ text: "Faizuddin's note: 'JPJ follows usage code not only region'. Commercial car Semenanjung BF: JPJ 40 + 25 + 2 = 67. RHB split debit eAuto 27 + JPJ 40.", sources: [mine("02b business-rules §1.1")], note: "Same fact from a different angle." }],
        }),
        f("Usage code DK exists for Semenanjung only. A DK vehicle in Sabah or Sarawak fails the APT price lookup.", [az("knowledge/_core/usage-codes.md")]),
        f("The seller's MyKad address and the eSTM declarationArea do not change the JPJ Fee region.", [az(`${A}#Region — the UCD company's address`)]),
        f("APT Car today: eAuto RM25 + 8% RM2 = RM27, with JPJ RM100 = RM127.00. History: RM15 to RM20 (12289) to RM25 (12403).", [az(`${FEES}#Current prices — live on 20.10.2026`), mine("02b business-rules §1.1")]),
        f("AA (Motosikal) APT rows do not move with Car price CRs: JPJ 3.00 (Sabah CAR 40.00, Sarawak CAR 5.00) + eAuto 5.00 + 0.40.", [az(`${FEES}#Rows that price differently (rate card, live 20.09.2026)`)]),
        f("Prod code (code reading, unverified): the DP re-check is switched off for APT, so a failure is hard.", [az("01-azfar-repo.md Module APT")], { unconfirmed: true }),
      ],
      scopeToCheck: [
        f("Check usage code x region x entry point. Created before the deploy vs after.", [ts("EAINT-12289"), ts("EAINT-12403")]),
        f("Check Step 5 fee lines and total for Semenanjung and Sabah or Sarawak.", [ts("EAINT-12289 12289_E2E1"), az(`${A}#Region — the UCD company's address`)]),
        f("Check APT Step 6 and the UCD and BO detail pages show no price.", [ts("EAINT-12289 12289_DSP2")]),
        f("Check the Home APT tile, invoice, e-Invoice, Slip Pengesahan and LHDN response. Old transactions keep the old fee.", [ts("EAINT-12289 12289_DSP1, INV1")]),
        f("Check reports show both fee versions when old and new transactions mix.", [ts("EAINT-12289 12289_RPT1")]),
        f("Check the company's mailing-address State in BO before any region test, and restore it afterwards.", [az(`${A}#Region — the UCD company's address`)]),
        f("Check Wholesale booking fee.", [ts("EAINT-12289 12289_R2")]),
        f("Check the Transaction Restriction popup on APT Resubmit.", [ts("EAINT-9044 APT_TS1")]),
      ],
      tickets: [
        { key: "EAINT-12403", date: "2026-10", what: "APT Car fee RM25. Live S34.2-20261001.", state: "latest" },
        { key: "EAINT-12289", date: "2026-09", what: "APT Car fee RM20, production 17.09.2026 night.", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-12253", date: "2026-10", what: "FUTURE: Browser Reminder on APT Step 6.", state: "latest" },
        { key: "EAINT-9044", what: "Transaction Restriction on APT Resubmit.", state: "latest" },
      ],
      openQuestions: [
        "Does the normal flow reach Step 6? 'Payment request sent' > OK goes to the listing. Q23 is open with the BA (EAINT-12253).",
        "The showroom address was not tested as a source of the JPJ region.",
      ],
    },

    // ------------------------------------------------------------- cronjob
    {
      id: "resubmit-cronjob",
      name: "Resubmit / auto-pay cronjob and auto-reset on error RE",
      summary: "A job pays failed or pending APT without the dealer. A separate rule resets the payment when RHB answers RE.",
      portals: ["Cronjob", "UCD Portal", "Back Office", "RHB"],
      triggers: [
        {
          id: "nightly-job",
          name: "Nightly resubmit job (EAINT-8668)",
          entry: "System: AptPaymentJob, daily 8:00pm in production",
          summary: "Also the same job as the APT 6.0 auto-trigger.",
          sources: [az(`${A}#Resubmit cronjob (EAINT-8668)`), ask("Q3 §3.4"), mine("02b business-rules §2 item 6; TS #077")],
          steps: [
            st(
              "Pick up APT transactions",
              "System",
              "Picks up Payment = Failed and Tx = Failed, or Payment = '-' and Tx = Pending. Only yesterday and earlier. Needs RHB Active, Company Activated and eSTM code VEL000392E. Does not pick up Payment = OK and Tx = Failed.",
              [az(`${A}#Resubmit cronjob (EAINT-8668)`), ts("EAINT-8668 TS1-TS13")],
            ),
            st(
              "Pay at run-time price",
              "System",
              "Resubmits the payment and the final submission. On success Payment = OK and Tx = Approved. [e-Invoice] and [Slip Pengesahan] become available. The row appears in BO RHB Payment Transaction. A Pending transaction picked up after a price change is charged the new price.",
              [az(`${A}#Resubmit cronjob (EAINT-8668)`), ts("EAINT-8668 TS1")],
              { affects: ["BO RHB Payment Transaction", "e-Invoice"] },
            ),
          ],
        },
        {
          id: "auto-reset-re",
          name: "Auto reset on RHB error RE (EAINT-11855)",
          entry: "UCD › APT › Resubmit › Step 5 › Next › Yes, when RHB answers RE",
          summary: "The system resets the payment itself. Before this, IT reset it by hand.",
          sources: [jira("EAINT-11855", "2026-08"), ts("EAINT-11855 11855_TS1"), az(`${FEES}#When a price changes — failed payments and the reset`)],
          steps: [
            st(
              "System detects RE and resets",
              "UCD › APT › Step 5",
              "RE is shown as 'RE - Invalid RefNo/Amount/Date'. A fund enquiry on RE hits DE (Original Trans Date over 1 day). Next day and later, the system makes a new payment at the new price by itself.",
              [jira("EAINT-11855", "2026-08"), az(`${FEES}#When a price changes — failed payments and the reset`)],
              {
                branches: [
                  { when: "Company has an active RHB account, next day or later", then: "RHB rejects the reference. System auto-resets and makes a new payment at the new price." },
                  { when: "No RHB account or RHB inactive", then: "Screen shows the new price but the bank record is not cleared. Screen and actual debit can disagree (found in EAINT-12289)." },
                ],
              },
            ),
          ],
        },
      ],
      affects: [
        f("A reset leaves a transaction at Payment '-' / Tx Pending, which is the cronjob's second pickup state. So the next run can pay the whole reset population at the new price (EAINT-12289 CRN3).", [az(`${A}#Payment reset (BackOffice Reset Payment)`)]),
        f("Warn Ops and RHB with the count before a run, because the 8pm auto-pay charges all reset APT in one batch.", [az(`${FEES}#When a price changes — failed payments and the reset`)]),
      ],
      cronjobs: [
        {
          name: "APT resubmit / auto-pay (EAINT-8668)",
          schedule: "Daily 8:00pm in production. Staging every 10 minutes. Test interval is set by Dev on request. Auto-pay was left off on QA staging in EAINT-12289.",
          does: "Picks Payment = Failed and Tx = Failed, or Payment '-' and Tx = Pending. Prices at run time. Does not pick Payment OK and Tx Failed.",
          sources: [az(`${A}#Resubmit cronjob (EAINT-8668)`), mine("02b business-rules §2 item 6; TS #077"), ask("Q3 §3.4")],
        },
      ],
      roles: [
        f("BO CSE team gets a Reset button in the APT Action column (permission via EAINT-11854).", [jira("EAINT-11855", "2026-08")]),
      ],
      afterCompletion: [
        f("Payment OK, Tx Approved. e-Invoice and Slip Pengesahan downloadable. Row in BO RHB Payment Transaction.", [ts("EAINT-8668 TS1")]),
      ],
      rules: [
        f("Dev agreed each usage code does not need its own flow. The fee changes through one configuration update. Spread codes across scenarios.", [az("knowledge/_core/usage-codes.md#Testing habit")]),
        f("Payment OK with Tx Failed is not covered by price CRs: not reset and not picked up.", [az(`${A}#Decided, not open`)]),
      ],
      scopeToCheck: [
        f("Run the criteria matrix: Payment Failed / OK / '-', Tx Failed / Pending, RHB Active / Inactive, Company Activated / Inactivated, VEL000392E vs other codes.", [ts("EAINT-8668 TS1-TS13")]),
        f("Check the two-day case: fails on day 1, cronjob pays on day 2.", [ts("EAINT-8668")]),
        f("Check the cronjob picks up reset transactions at the new fee.", [ts("EAINT-12289 12289_CRN1-CRN3")]),
        f("Check auto reset on RE: payment reset, retry allowed.", [ts("EAINT-11855 11855_TS1")]),
      ],
      tickets: [
        { key: "EAINT-8668", date: "2025-08", what: "New cronjob to resubmit failed APT payments.", state: "latest" },
        { key: "EAINT-11855", date: "2026-08", what: "Auto reset payment on RHB error RE. Done.", state: "latest" },
        { key: "EAINT-11854", what: "Reset button permission for CSE." },
      ],
      openQuestions: [
        "Production schedule is documented as 8:00pm. The prod scheduler file is withheld, so Ask eAuto could only confirm the dev-reference value.",
      ],
    },

    // --------------------------------------------------------------- reset
    {
      id: "payment-reset-price-change",
      name: "BO Reset Payment and price-change reset",
      summary: "After a price change IT or BO resets Failed APT payments so they are paid at the new price.",
      portals: ["Back Office", "UCD Portal"],
      triggers: [
        {
          id: "bo-reset",
          name: "BO > APT Transaction Enquiry > Reset",
          entry: "BO › APT Transaction Enquiry › Action column › Reset (next to View and Cancel)",
          sources: [az(`${A}#Payment reset (BackOffice Reset Payment)`), ts("EAINT-12289 12289_PAY4")],
          steps: [
            st(
              "Reset a Failed APT",
              "BO › APT Transaction Enquiry",
              "Returns Payment to '-' and Tx to Pending, available for payment again. AA transactions are reset but not repriced. Done by IT or Dev per transaction after the rate update is live.",
              [az(`${A}#Payment reset (BackOffice Reset Payment)`), jira("EAINT-12403 REQ005")],
              {
                branches: [
                  { when: "Payment = Failed only", then: "Reset allowed. Dev's reset on preprod1 moved 52 STMS and 4 APT, nothing else." },
                  { when: "Payment OK with Tx Failed", then: "Not reset." },
                ],
              },
            ),
            st(
              "UCD pays again",
              "UCD › APT › Resubmit › Step 5 › Retry",
              "Step 5 shows the current price. A Failed APT keeps its amount until reset.",
              [az(`${A}#Payment reset (BackOffice Reset Payment)`)],
            ),
          ],
        },
      ],
      affects: [
        f("BO Reset Payment Report: filter by Vehicle No, not date. Reset rows carry the reset date as Payment Date. A date range that includes the reset day stayed on 'Working…' for 7+ minutes.", [az(`${A}#Payment reset (BackOffice Reset Payment)`)]),
      ],
      cronjobs: [],
      roles: [
        f("IT or Dev reset per transaction. BO CSE has a Reset button (EAINT-11855).", [az(`${A}#Payment reset (BackOffice Reset Payment)`), jira("EAINT-11855", "2026-08")]),
      ],
      afterCompletion: [f("Transaction waits at Payment '-' / Tx Pending for the UCD or the nightly job.", [az(`${A}#Payment reset (BackOffice Reset Payment)`)])],
      rules: [
        f("Scope differs per CR. 12289: all Failed, any vehicle type incl. Motosikal. 12403: Failed/Failed on the UCD portal only. Pending and Wholesale excluded. Read the SRD every time.", [az(`${A}#Payment reset (BackOffice Reset Payment)`)], {
          alt: [{ text: "Fee reset scope differs per CR. It is not a defect.", sources: [mine("02b business-rules §1.2")], note: "Faizuddin's wording of the same rule." }],
        }),
        f("Never use the bulk admin link /ajax/admin/scheduler/reset-payment.do. It leaves bank records and writes no audit row.", [az(`${FEES}#When a price changes — failed payments and the reset`)]),
        f("Rate update first, reset after. A transaction reset before the new rate is live can be paid again at the old fee.", [az(`${FEES}#When a price changes — failed payments and the reset`)]),
        f("Create test data BEFORE Dev pushes a new price. It cannot be reproduced afterwards.", [mine("TS #042 EAINT-12403 row 8")]),
      ],
      scopeToCheck: [
        f("Check positive reset (Failed becomes '-' / Pending) and negative cases (Approved has no Reset).", [ts("EAINT-12403 12403_STMS_PAY1, NEG1, NEG2")]),
        f("Check the completeness: count unpaid transactions still at the old amount during the deployment and again 24-48 hours later.", [az(`${FEES}#When a price changes — failed payments and the reset`)]),
        f("Check the Reset Payment Report by vehicle number.", [az(`${A}#Payment reset (BackOffice Reset Payment)`)]),
      ],
      tickets: [
        { key: "EAINT-12403", date: "2026-10", what: "Reset Failed/Failed after fee RM25.", state: "latest" },
        { key: "EAINT-12289", date: "2026-09", what: "Reset all Failed after fee RM20.", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-8826", what: "Reset Payment permission.", state: "latest" },
      ],
    },
  ],
};
