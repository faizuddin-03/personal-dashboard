import type { Fact, Source, Module, Step } from "../types";

const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref, date });
const mi = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const ji = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const ts = (ref: string, date?: string): Source => ({ kind: "ts", ref, date });
const ae = (ref: string): Source => ({ kind: "askeauto", ref, date: "2026-10-23" });
const ac = (ref: string): Source => ({ kind: "askeauto", ref: `prod code 0e21bef3db — ${ref}`, date: "2026-10-23" });
const tm = (ref: string, date?: string): Source => ({ kind: "teams", ref, date });

const F = (text: string, sources: Source[], extra: Partial<Fact> = {}): Fact => ({ text, sources, ...extra });
const S = (title: string, sources: Source[], extra: Partial<Step> = {}): Step => ({ title, sources, ...extra });

const FEES = "knowledge/_core/fees-and-pricing.md";
const APT = "knowledge/_core/apt.md";
const STMS = "knowledge/_core/stms.md";
const UCDP = "knowledge/portals/ucd/portal.md";
const PAYK = "knowledge/eauto-payments.md";
const RULES = "knowledge/business-rules-from-test-scenarios.md";

export const paymentsFees: Module = {
  id: "payments-fees",
  name: "Payments and Fees: RHB direct debit, failed-payment reset, fee changes",
  short: "Payments & Fees",
  portals: ["UCD portal (pays)", "Back Office (reset, reports)", "RHB (bank)", "JPJ (fee part)", "Backend jobs"],
  summary:
    "How eAuto takes money and how its prices are set. Most UCD modules pay with RHB direct debit: a button and a confirm popup, with no gateway page. When a payment fails, Back Office or the system can reset it so the dealer can pay again. When a fee changes, a Dev updates the rate card, then failed payments are reset so they are paid at the new price.",
  related: ["stms", "apt", "estm", "service-hub", "jomcheck", "dereg", "onboarding", "backoffice"],
  glossary: [
    { term: "RHB direct debit", meaning: "eAuto’s own payment rail. The dealer clicks pay and confirms. Money comes from the dealer’s RHB account. No bank login and no QR.", sources: [mi(PAYK)] },
    { term: "POB", meaning: "Pay On Behalf (also called Payment On Behalf in one internal note). Old split-payment method: the fee is split into two bank debits, dealer to eAuto and dealer to JPJ. Marked discontinued (sunset) in the knowledge notes, but the flag and handling code remain (PaymentMethod.POB, allowPOB, CompanyPOBBalanceReportController). Treat as legacy.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }] },
    { term: "eAuto Plus", meaning: "Product name for a bundle of add-on services on top of the core system: BMK, OTH, LKM, eVOC, JomCheck and others. Seen as the BO menu group eAuto Plus Relevant and in report names such as RHB Payment Transaction (eAuto Plus). Not an acronym.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }] },
    { term: "Payment OK / Failed / -", meaning: "Payment column on a transaction. “-” means no payment yet (state after a reset).", sources: [az(FEES), mi(RULES)] },
    { term: "Reset (payment)", meaning: "BO action that clears a failed payment: Payment becomes “-”, Tx Status becomes Pending, remarks cleared. The dealer can then pay again.", sources: [az(STMS)] },
    { term: "RHB codes", meaning: "OK = success (only code that completes a transfer). IF = insufficient funds. RE = invalid reference. DP = duplicate. GD = enquiry-leg success, NOT transfer success. ED = Ref 2 longer than 30 characters. NP = RHB maintenance.", sources: [az(UCDP), mi(PAYK)] },
    { term: "transfercost", meaning: "The rate card table. Fee depends on type, usage code, region (1/2/3) and CAR/BIKE. Only Dev changes it, by SQL. No BO screen edits it.", sources: [az(FEES)] },
    { term: "Usage code", meaning: "JPJ code of the vehicle use. It decides the rate-card row (for example AA Motosikal vs AB–DK cars).", sources: [az("knowledge/_core/usage-codes.md")] },
  ],
  flows: [
    // ---------------------------------------------------------- 1
    {
      id: "rhb-direct-debit",
      name: "RHB direct debit payment (all eAuto-rail modules)",
      summary:
        "At the payment step of a module the dealer clicks pay and confirms in popups. eAuto sends the debit to RHB. The result is saved on the transaction as OK or Failed.",
      portals: ["UCD portal", "RHB"],
      triggers: [
        {
          id: "module-payment-step",
          name: "Make Payment / Pay Now at the module payment step",
          entry: "UCD › module payment step (STMS Step 5, eSTM, APT Step 5, Service Hub, JomCheck, eDereg)",
          summary: "A button plus confirmation popups. No gateway page, no bank login and no QR (QR is not implemented in eAuto).",
          steps: [
            S("Open the payment step", [mi(PAYK), az(UCDP)], { where: "Module › Step 5 / payment page", detail: "Shows fee lines: JPJ fee, eAuto fee, Service Tax 8%, total.", affects: ["stms", "apt", "estm", "service-hub", "jomcheck", "dereg"] }),
            S("Confirm in the popup(s)", [mi(PAYK)], { detail: "Examples: Service Hub #si-pay-btn then .confirm-dialog-btn; eSTM has two dialogs; JomCheck shows a payment popup with an RHB sufficient-funds notice; APT retry asks “Sure to retry?” Cancel / Make Payment." }),
            S("RHB answers", [az(UCDP), mi(PAYK)], {
              detail: "Payment Details gets a line “[Date time] - RHB (<ref>) - OK/Failed”.",
              branches: [
                { when: "OK", then: "Payment OK. The module goes on (for STMS family: final JPJ submission)." },
                { when: "IF", then: "Failed. Remark “IF - Wang di dalam akaun RHB anda TIDAK MENCUKUPI…”. A dialog shows and the page does not move on." },
                { when: "NP", then: "Failed. Remark “NP - Sistem Pembayaran RHB dibawah penyelengaraan antara 10.30mlm - 8.30pg.”" },
                { when: "RE", then: "Failed. Next-day retry shows “RHB ERROR-RE” until BO resets (see failed-payment reset flow)." },
                { when: "ED", then: "Failed. Ref 2 is longer than 30 characters." },
                { when: "DP", then: "Duplicate. The result depends on the enquiry leg." },
              ],
              affects: ["Module listing (Payment column)", "Back Office enquiry"],
            }),
          ],
          sources: [mi(PAYK), az(UCDP)],
        },
        {
          id: "retry-and-timer",
          name: "Retry button, countdown timer and mobile or bulk payment",
          entry: "Module payment page: Retry button, on-screen countdown, /mb/... app routes, bulk-payment.do",
          summary: "Prod code: three different things are called 'reset' in the UI. The countdown timer only refreshes the shown expiry. The Retry button is a user action. A silent auto-reset runs inside the APT payment handler.",
          steps: [
            S("Retry after Failed", [ac("payment.jsp, retry-rhb-payment.do")], { detail: "The page shows 'Payment Status: Failed - Waiting for RHB to reset payment' with a Retry button. It posts to the module's retry-rhb-payment.do and repeats the Pending → Paid / Failed cycle." }),
            S("Countdown timer", [ac("reset-rhb-payment-timer.do (and -v2 for STMS and OTH)")], { detail: "The timer calls the module's reset-rhb-payment-timer.do only to get a fresh expiry display. It never changes the payment status." }),
            S("Mobile and bulk", [ac("/mb/... make-payment, retry, timer-reset; bulk-payment.do (STMS, Wholesale)")], { detail: "The mobile app mirrors make-payment, retry and timer-reset. Companies with bulk submission use bulk-payment.do." }),
            S("AATF payments", [ac("Dereg and DPC payment pages")], { detail: "AATF users pay Dereg and Dereg Pre-check the same way." }),
            S("BO Incomplete Transaction recovery", [ac("/ajax/support/incomplete-txn/list-enquiry.do")], { detail: "Support staff force-fix a transaction stuck mid-pipeline (STMS, APT, eSTM only). A separate gated admin tool, not a general retry button.", affects: ["Back Office support tools"] }),
          ],
          sources: [ac("RhbPaymentController, StmsPaymentController:939-990,1048-1065")],
        },
        {
          id: "service-hub-pay",
          name: "Service Hub payment",
          entry: "UCD › Service Hub › Software Installation / Biometric Device › Pay",
          steps: [S("Pay and fail rule", [mi(PAYK), mi("EAINT-10960 SRD v1.2", "2026-08")], { detail: "A failed Service Hub payment cancels the transaction (Tx Cancelled). The UCD cannot retry.", affects: ["service-hub"] })],
          sources: [mi(PAYK)],
        },
        {
          id: "apt-resubmit-dealer",
          name: "Dealer retries a failed APT payment",
          entry: "UCD › APT Transaction Listing › Resubmit › Step 5",
          steps: [S("Retry", [az("knowledge/_core/apt.md#Payment reset")], { detail: "Step 5 shows “Payment Status: Failed” and only [Retry]. Same-day retry re-sends the same RHB reference (one debit).", affects: ["apt"] })],
          sources: [az(APT)],
        },
      ],
      affects: [
        F("Module listing Payment column and BO enquiry show OK or Failed.", [mi(PAYK)]),
        F("Reconciliation: the daily RHB reconciliation compares eAuto payments with the uploaded RHB statement.", [az("cr/EAINT-10168/LEDGER.md")]),
        F("Invoices and e-Invoices follow the stored paid amount.", [az(FEES)]),
        F("A payment event (success or failure) goes over RabbitMQ (PaymentTransactionRabbitMQProducer) to eauto-einvoice, which builds or updates the e-Invoice record. Failed and Error payments are mapped there too. GST and SST payment reports and tax invoices are made once Paid. No email, SMS or WhatsApp for a failed or reset RHB payment was found.", [ac("PaymentTransactionRabbitMQProducer:703-730,831")]),
        F("LKM Refund reads EstmPaymentResetLog to see whether the eSTM payment behind it was reset. That changes its refund eligibility. eVOC is tied to eSTM: an eSTM payment reset goes together with the eVOC payment reset.", [ac("EvocTransactionHandler:289")]),
        F("Wholesale STMS and listing payments have their own reset path (WholesaleResetPayment.reset) on the same RhbPayment rows. Test it apart from the retail modules.", [ac("WholesaleResetPayment.java, WholesaleLogisticPricingHandler:290-306")]),
        F("BO 'RHB Payment Transaction (eAuto Plus)' is a separate listing for the BMK, OTH and LKM RHB legs. The main listing covers STMS, eSTM, APT and Dereg.", [ac("backoffice-administration.md:187-241")]),
      ],
      cronjobs: [
        { name: "AptPaymentJob", schedule: "Daily, cron 0 0 20 * * ? (8:00 PM). Confirmed active in prod.", does: "Fires the APT payment after enquiry with no user click. Same job as the APT auto-pay entry below.", sources: [ac("AptPaymentJob")] },
        { name: "RhbPaymentGatewayJob", schedule: "Defined as a Quartz job but no trigger is enabled in the dev scheduler. The prod scheduler file is withheld, so enabled or not in prod is not confirmed.", does: "Processes RHB debit and transfer.", sources: [ac("RhbPaymentGatewayJob")], unconfirmed: true },
        { name: "Legacy bank-file jobs (CreateDirectDebitJob, PushDirectDebitJob, PullDDAckJob, PullDDReturnJob, CreatePaymentFileJob, PushPaymentFileJob, PullBKAckJob, PullBKReturnJob)", schedule: "All disabled in the dev scheduler. Prod schedule not confirmable (withheld).", does: "The sunset Maybank direct-debit and bank-file SFTP pipeline. Not part of the live RHB flow.", sources: [ac("quartz-scheduled-jobs.md, BankGatewayController")], unconfirmed: true },
        { name: "Payment transaction sync job (eauto-cron)", schedule: "On by default; run time is a hidden setting", does: "Syncs / migrates payment transaction data.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list (eauto-cron service)", date: "2026-10-23" }] },
        { name: "FpxPaymentGatewayJob (old in-app scheduler)", schedule: "Intended every 30 minutes; commented out in the only readable (non-production) copy", does: "Reconciles FPX online payments. Prod on / off state not confirmed (prod scheduler file withheld). RHB gateway job in the same copy is intended roughly every 40 minutes in business hours.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list, old in-app scheduler (non-production reference copy; prod file withheld)", date: "2026-10-23" }], unconfirmed: true },
        { name: "Nightly reconciliation task (old in-app scheduler)", schedule: "Intended once nightly, about 11:15 PM; commented out in the readable copy", does: "Old reconciliation task. The eauto-cron ReconciliationJob (10:00 AM and 12:00 PM, off by default) is the newer one.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list, old in-app scheduler (non-production reference copy; prod file withheld)", date: "2026-10-23" }], unconfirmed: true },
        { name: "No cron job dedicated to resetting a failed RHB payment", schedule: "n/a", does: "Prod code: reset logic is inline in the payment handler (per request), not a batch job.", sources: [ac("RhbAutoResetDecision")] },
        { name: "APT resubmit failed APT (EAINT-8668)", schedule: "Production 8:00 PM daily (once a day); staging every 10 minutes", does: "Re-pays and re-submits Payment = Failed APT transactions that meet all criteria. Payment OK + Tx Failed is not re-paid. Pending and New are not picked up.", sources: [mi(RULES), az(FEES)] },
      ],
      roles: [
        F("UCD users with permission for the module pay. No separate payment role.", [mi(PAYK)]),
      ],
      afterCompletion: [
        F("The transaction goes to the module listing with Payment OK or Failed. On OK, e-Invoice and Slip Pengesahan are available for STMS family.", [mi(PAYK), mi(RULES)]),
      ],
      rules: [
        F("STMS-family Ref 1 is “{TransactionNo}-{VehicleNo}”. Ref 2 is “{TransactionNo}/{STMS|JCK|OTH|DPC}”. Description “ETUKARMILIK CR”. Service Hub Ref 1 is SR{YYYYMMDD}{6}-{CompanyID}; Ref 2 is SOFTINSTALL / BIODEV / SOFTINSTALL_BIODEV.", [mi(PAYK), ts("TS #123 RHB 25.06.2026")]),
        F("RHB Ref 2 longer than 30 characters returns “ED”.", [tm("EAINT-12099 Goh Kai Jiaeh", "2026-07-17")]),
        F("A failed RHB payment does not navigate. A dialog shows. A test that waits for the next screen times out on a correct refusal.", [az("automation/README.md#Three traps")]),
        F("A failed JPJ enquiry shows Resubmit, not Make Payment.", [az("automation/README.md#Three traps")]),
        F("GD is not a success code for the transfer; only OK is. DP outcome depends on the enquiry leg (a prefix with no enquiry row defaults to confirming).", [az(UCDP)]),
        F("Interstate UCD to UCD with no active RHB account needs a company groupType starting with “A” to proceed.", [ae("Q4")]),
        F("Payment is made by RHB Direct Debit / FPX for STMS (StmsPaymentController) and must finish before submission.", [ae("Q3")], {
          alt: [{ text: "RHB Direct Debit is the one live payment rail. Maybank DD, FPX and POB are sunset. Every transaction module reuses it (STMS, eSTM, APT, Dereg and DPC, BMK, OTH, JCK, SSM add-on, Wholesale, Service Hub).", sources: [ac("payment-gateway-architecture.md")], note: "prod code says" }],
        }),
        F("Company must have an active RHB account (rhbAccActive and a non-blank bank account number) before payment is allowed. Only logged-in UCD or AATF users can pay. BO has a view-only 'RHB Payment Transaction' listing. No public access point.", [ac("StmsPaymentController:939-990")]),
        F("Statuses: RhbPaymentStatus New → Pending → Paid (bank code OK) or Failed. Module PaymentStatus New → Pending → Created → Submitted → Paid, or Failed / Error / Aborted, plus ToRefund / Refunded. TransactionStatus New(0), Pending(1), Approved(2), Failed(3), Draft(4), Cancelled(5), Expired(6), PendingApproval(7, eSTM), CommitedJPJApproved(12, eSTM). A Failed payment keeps the transaction at Pending or Failed. Approved only after JPJ submission succeeds.", [ac("RhbPaymentStatus, PaymentStatus, TransactionStatus")]),
        F("Orchestration: Pay Now calls the module's make-payment endpoint, then the handler (for STMS NewPaymentHandlerBean) calls FundTransferHandlerBean.doTransferRhbUcdToEauto(). An RhbPayment row starts New and moves to Pending while the live RHB call runs. After Paid, JPJ submission is a manual click for STMS, APT, eSTM and Dereg. It is built into the payment handler for the Plus modules BMK and OTH.", [ac("NewPaymentHandlerBean, FundTransferHandlerBean")]),
        F("When the company has no RHB account, a retry uses the new price through FPX or balance.", [az(FEES)]),
      ],
      scopeToCheck: [
        F("Check success, IF, RE, ER and NP paths per module (button, popups, remark text).", [mi(PAYK)]),
        F("Check the Payment Details line, references and the Ref 2 length limit.", [mi(PAYK)]),
        F("Check the module continues only after OK.", [az("automation/README.md#Three traps")]),
        F("Check Service Hub failure cancels the transaction and cannot be retried.", [mi(PAYK)]),
        F("Check the RHB maintenance message window.", [ts("EAINT-9141 (TS #092)")]),
      ],
      tickets: [
        { key: "EAINT-12403", date: "2026-10", what: "APT RHB IF prefix and fee change", state: "latest" },
        { key: "EAINT-9141", what: "RHB maintenance message", state: "latest" },
        { key: "EAINT-8668", what: "APT resubmit cronjob", state: "latest" },
        { key: "EAINT-10960", date: "2026-08", what: "Service Hub SRD (failed payment cancels)", state: "latest" },
      ],
      openQuestions: [
        "Prod code calls RHB Direct Debit the one live rail and FPX sunset. Other prod-code answers (APT payment page) still say 'RHB or FPX'. Which is right on screen?",
        "Prod behaviour for RHB codes outside the list above is not documented here.",
      ],
    },

    // ---------------------------------------------------------- 2
    {
      id: "failed-payment-reset",
      name: "Failed-payment reset (BO Reset, auto reset, reset on deploy)",
      summary:
        "A failed payment can be reset so the dealer pays again. BO does it per transaction with the Reset button. The system resets APT payments by itself on RHB error RE. For a fee change, IT resets failed payments on deploy night.",
      portals: ["Back Office", "UCD portal", "Backend"],
      triggers: [
        {
          id: "bo-reset-button",
          name: "BO Reset button",
          entry: "Back Office › STMS / APT / eSTM Transaction (enquiry) › Action column › Reset",
          summary: "The button shows for a Failed transaction next to View and Cancel. Permission is EAINT-8826 (eSTM and STMS) and EAINT-11854 (CSE team, APT).",
          steps: [
            S("Open the failed transaction", [az(STMS), mi(RULES)], { where: "BO › STMS Transaction (view/stms/enquiry) or APT Transaction Enquiry", detail: "Actions for Failed: View, Cancel, Reset." }),
            S("Press Reset", [az(STMS)], { detail: "Browser confirm “Sure to reset payment for <vehicle>?”. Payment becomes “-”, Tx Status Pending, remarks cleared, the Reset link disappears.", affects: ["Module listing", "UCD Resubmit"] }),
            S("Dealer pays again", [az(FEES)], { detail: "The UCD sees the transaction as Pending and resubmits. It is paid at the current price.", affects: ["rhb-direct-debit"] }),
          ],
          sources: [az(STMS), mi(RULES)],
        },
        {
          id: "apt-auto-reset-re",
          name: "Auto reset of APT payment on RHB error RE (EAINT-11855)",
          entry: "UCD or cronjob resubmits an APT and RHB returns RE",
          steps: [
            S("System detects RE and resets", [ji("EAINT-11855")], { detail: "On RE during APT resubmit the system resets the payment by itself. IT used to reset by hand. RE text became “RE – Invalid RefNo/Amount/Date”. A fund enquiry on RE hits DE (Original Trans Date > 1 Day). The next-day APT makes a new payment at the new price." }),
          ],
          sources: [ji("EAINT-11855"), az(FEES)],
        },
        {
          id: "deploy-night-reset",
          name: "Reset on deploy night for a fee change",
          entry: "Release night of a price CR (for example 01.10.2026 from 11:30 PM)",
          steps: [S("IT/Dev resets failed payments per transaction", [ji("EAINT-12403"), az(FEES)], { detail: "Order: update the rate card first, then reset. Reset only Payment = Failed (UCD portal only for EAINT-12403; Pending and Wholesale excluded). Use BO Reset Payment per transaction. Never use the bulk admin link.", affects: ["fee-change"] })],
          sources: [az(FEES), ji("EAINT-12403")],
        },
        {
          id: "api-reset-prod",
          name: "Failed-payment reset by API (staging and prod)",
          entry: "API call as a logged-in admin user",
          steps: [S("Reset through API", [mi(PAYK), tm("EAINT-12289", "2026-09-10")], { detail: "Used in staging and production for failed-payment reset. In production it runs under an admin user’s account." })],
          sources: [mi(PAYK), tm("EAINT-12289", "2026-09-10")],
        },
      ],
      affects: [
        F("After a reset the transaction is Payment - / Tx Pending. For APT this is exactly the cronjob pickup state, so a reset APT is auto-paid by the APT job.", [az(FEES), az(APT)]),
        F("BO Reset Payment Report lists reset rows (filter by Vehicle No).", [az(FEES)]),
        F("Documents of already-approved transactions keep the price they paid.", [az(FEES), mi(RULES)]),
      ],
      cronjobs: [
        { name: "APT auto-pay / resubmit job", schedule: "20:00 daily (production)", does: "Pays APT transactions in the pickup state (Payment - / Pending). After a reset it charges them at the new fee in one batch. Warn Ops and RHB with the count.", sources: [az(FEES), mi(RULES)] },
        { name: "Bulk reset admin link /ajax/admin/scheduler/reset-payment.do?transactionType=STMS|APT", schedule: "Manual only", does: "Resets every pending and failed transaction, leaves bank records, writes no audit row. NEVER use.", sources: [az(FEES)] },
      ],
      roles: [
        F("BO users with the Reset permission (CSE team for APT). Support Tools actions need named BO users or roles.", [ji("EAINT-11855"), ji("EAINT-8826"), az(STMS)]),
        F("In SRD 12403 REQ005 the reset is done by IT/Dev per transaction.", [az(APT)]),
        F("In production the API reset uses an admin user’s account; Ops use the BO Reset button for APT.", [mi(PAYK), tm("2026-06-25")]),
      ],
      afterCompletion: [
        F("The UCD sees the transaction as Pending and can resubmit. APT goes to the next 20:00 job.", [az(FEES), az(APT)]),
      ],
      rules: [
        F("Reset takes only Payment = Failed for EAINT-12403. Pending and Wholesale are excluded.", [az(FEES), az("cr/EAINT-12403/LEDGER.md")], {
          alt: [{ text: "EAINT-12289 reset all non-completed transactions. Read each CR’s SRD for the reset scope.", sources: [mi(RULES)], note: "Faizuddin’s notes: the scope differs per CR, not a defect." }],
        }),
        F("Prod code auto-reset: inside the APT payment handler, when RHB returns code RE for a stale previous-day transaction reference, the handler soft-archives the old RhbPayment row and creates a fresh one dated today, then retries. This has no user click and no status other than the normal Paid or Failed (RhbAutoResetDecision). It is APT only.", [ac("RhbAutoResetDecision.java")]),
        F("Same-day retry with RHB active uses the old fee. A next-day retry shows “RHB ERROR-RE” until BO resets.", [az(FEES)]),
        F("AA (Motosikal) is reset but not repriced.", [mi(RULES), ts("EAINT-12403")]),
        F("Negative cases: JPJ Enquiry Failed (4K HAK MILIK DITUNTUT) fails without payment and has only View and Cancel (no Reset). Approved transactions have no Reset.", [ts("12403_STMS_PAY2, NEG1, NEG2")]),
        F("BO Reset Payment Report: filter by Vehicle No, not date. Reset rows carry the reset day as Payment Date. A date range that includes the reset day hangs 7+ minutes. BO STMS Transaction has no Payment-status filter.", [az(FEES), az("cr/EAINT-12403/LEDGER.md")]),
        F("Test data must be created BEFORE the new price is pushed. It cannot be reproduced after.", [ts("TS #042 row 8")]),
      ],
      scopeToCheck: [
        F("Check Reset shows only for Failed. Check Payment becomes “-” and Tx Pending.", [az(STMS), ts("12403_STMS_PAY1")]),
        F("Check repay at the new fee after the reset.", [ts("12289_PAY1"), ts("12403_STMS_PAY1")]),
        F("Check the negative cases (JPJ enquiry failed, Approved).", [ts("12403_STMS_NEG1-NEG2")]),
        F("Check APT: reset then the 20:00 / staging 10-minute job pays at the new price.", [ts("12289_CRN1-CRN3")]),
        F("Check auto reset on RE (EAINT-11855).", [ji("EAINT-11855")]),
        F("Check the Reset Payment Report by Vehicle No.", [az(FEES)]),
      ],
      tickets: [
        { key: "EAINT-8826", date: "2025-09", what: "Reset Payment permission for eSTM and STMS", state: "latest" },
        { key: "EAINT-11854", date: "2026-06", what: "Permission for CSE team to use Reset on APT", state: "latest" },
        { key: "EAINT-11855", date: "2026-06", what: "Auto reset payment on RHB error RE in APT resubmit (Done 2026-08)", state: "latest" },
        { key: "EAINT-12289", date: "2026-09", what: "APT fee RM15 to RM20, reset", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-12403", date: "2026-10", what: "STMS and APT fee RM20 to RM25; reset Failed", state: "latest" },
      ],
      openQuestions: [
        "RHB’s reply on the RE fix is not in Jira.",
      ],
    },

    // ---------------------------------------------------------- 3
    {
      id: "fee-change",
      name: "Fee / price change (rate card, tiles, invoices, reports)",
      summary:
        "A price CR changes the eAuto service fee in the rate card and updates every place that shows or stores the price. The price is applied when the payment is made, not when the transaction was created.",
      portals: ["UCD portal (shows)", "Back Office (stores, reports)", "Wholesale display", "Android app"],
      triggers: [
        {
          id: "sql-rate-card",
          name: "Dev updates the rate card (SQL)",
          entry: "Dev runs an SQL update on transfercost. No BO screen exists.",
          steps: [
            S("Rate card updated first", [az(FEES)], { detail: "Row = type × usage code × region 1/2/3 × CAR/BIKE. JPJ body type decides CAR or BIKE (AA + MSL = bike). Usage code decides the row. Four APT exception rows exist (IA Sabah/Sarawak, BF/BJ Semenanjung)." }),
            S("Hard-coded labels updated", [az(FEES)], { where: "home.jsp:807 STMS, :814 UCD TO UCD, :820 APT; stms/index.jsp:364; stms/interstate/index.jsp:258", detail: "Tile and module-page labels are text in the page. They can disagree with Step 5 if not updated.", affects: ["ucd-portal › homepage tiles"] }),
            S("Failed payments reset", [az(FEES), ji("EAINT-12403")], { detail: "See the failed-payment reset flow.", affects: ["failed-payment-reset"] }),
          ],
          sources: [az(FEES)],
        },
        {
          id: "payment-priced",
          name: "Dealer pays after the change",
          entry: "Any STMS / UCD to UCD / APT payment step",
          steps: [S("Price is taken at payment time", [az(FEES), ts("12403 header")], { detail: "No date logic (decided 24.09.2026). Invoices print the stored amount. Already approved transactions keep the amount charged." })],
          sources: [az(FEES)],
        },
        {
          id: "android-tile",
          name: "Android app tile price (EAINT-12550)",
          entry: "eAuto app home › STMS and UCD to UCD tiles",
          steps: [S("Update app tile price RM25 to RM35", [ji("EAINT-12550")], { detail: "Sub-task in Code Review 2026-10-19." })],
          sources: [ji("EAINT-12550")],
        },
        {
          id: "wholesale-price",
          name: "Wholesale price copies (JomCheck, STMS)",
          entry: "Wholesale chatbot and payment portal",
          steps: [S("Follow the eAuto fee", [ji("EAINT-12279")], { detail: "Wholesale STMS shows RM27.00 (eAuto fee incl. SST). JomCheck chatbot and payment portal price went RM18 to RM20 (EAINT-12279, Done 2026-09-15).", affects: ["wholesale"] })],
          sources: [ji("EAINT-12279"), mi(RULES)],
        },
      ],
      affects: [
        F("Step 5 Payment Summary, tiles, invoices, e-Invoices, Slip Pengesahan, reports, BO enquiries (stored amounts), Wholesale price display, APT 6.0 auto-trigger and cronjob, and any module sharing the configuration.", [az(FEES)]),
        F("Invoice and e-Invoice description: Sistem Tukar Milik Sementara (“STMS”) service charge RM25.00 + SST RM2.00. Reports show both fee versions side by side.", [mi(RULES)]),
        F("Seller booking fee for APT follows the APT fee. Reconciliation totals must tie.", [mi(RULES)]),
        F("Wholesale APT check reuses the saved APT fee if checked today (Malaysia time). If the price changed: “The price has changed. Please check the new total and pay again”. APT is priced from the eAuto TransferCost table.", [ji("EAINT-12562")]),
      ],
      cronjobs: [
        { name: "APT auto-pay (20:00)", schedule: "20:00", does: "Charges reset APT transactions at the new fee in one batch.", sources: [az(FEES)] },
      ],
      roles: [
        F("Dev updates the rate card and resets. BO users only view stored amounts. IT resets on deploy night.", [az(FEES), ji("EAINT-12403")]),
      ],
      afterCompletion: [F("Transactions approved before the change keep the amount charged.", [az(FEES)])],
      rules: [
        F("Live prices on 20.10.2026: STMS Car = JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00 (tile “From RM35”). UCD to UCD the same (tile “RM35”). APT Semenanjung Car 100 + 25 + 2 = RM127.00 (tile RM125). APT Sabah/Sarawak 40 + 25 + 2 = RM67.00.", [az(FEES)]),
        F("Other prices: SSM report RM19.44; Transfer History JPJ 10.00 + eAuto 10.00 + 0.80 = RM20.80 (invoice shows eAuto part 10.80 only); JomCheck RM20 + 1.60 = RM21.60; eSerahan tile “From RM135”; BMK RM30 tile (RM30.80 total on staging); eVOC RM10; eLKM RM2.75 + 0.22; eSTM car RM35 + 2.80; Dereg RM35 + 2.80; eDereg Pre-Checking RM5 + 0.40; Pre-Application RM100 + 8 = RM108; eAuto registration RM1,500 (staging); Service Hub SI RM54.00, BDP RM850.00; Insurance Cancellation RM38 + 8% = RM41.04; LKM refund fee bands.", [az(FEES), mi(RULES)]),
        F("Not changed by EAINT-12403: AA CAR RM11.80 (STMS); AA Motosikal JPJ 1 + eAuto 5 + 0.40 = RM6.40; AB–AE BIKE RM26.20. 52 CAR rows changed (27 STMS + 25 APT). eSerahan untouched.", [az(FEES), mi(RULES)]),
        F("Fee history (newest last): STMS Car RM15 → RM20 (EAINT-10175, 2026-03-31) → RM25 (EAINT-12403, effective 02.10.2026, update from 01.10 11:30 PM). APT Car RM15 → RM20 (EAINT-12289, 15–17.09.2026) → RM25 (EAINT-12403). APT tile RM115 → RM120 → RM125. JomCheck RM18 → RM20 (EAINT-10089, 2026-09-14). SSM RM18.64 → RM19.44 (EAINT-10691).", [az(FEES), mi(RULES), ji("EAINT-12403")]),
        F("Home page tile: STMS from RM30 to RM35 and APT from RM120 to RM125 (EAINT-12403).", [ji("EAINT-12403")]),
        F("JPJ fee follows the usage code and region. APT region = the UCD company’s mailing-address state at payment time. Check and restore it in BO around region tests. The cronjob takes yesterday and earlier only.", [az(APT), az("knowledge/portals/ucd/how-we-test.md#Traps")]),
        F("Production UCD registration fee is RM601.85 (+ Dermalog RM850 + tax) per prod code; it sits in the host company record, not in the transfercost table. No Fiuu cap is coded. Staging total is RM1,500.00. The staging amount comes from Fiuu's simulator and QA cannot control it.", [ae("prod code prod/master (2026-10-22) — UCD registration fee and Fiuu cap answer"), mi("Faizuddin decision in chat", "2026-10-23")]),
        F("Mock-ups and old workbooks are not expectations (for example EAINT-12289 expected RM121.60 for a BF row that should be RM67.00).", [az("cr/EAINT-12403/LEDGER.md")]),
      ],
      scopeToCheck: [
        F("Check every fee line plus 8% tax, the invoice and e-Invoice descriptions, and tile and Step 5 values.", [mi(RULES), az(FEES)]),
        F("Check JPJ amounts per region and usage code, and excluded vehicle types (AA and bikes).", [mi(RULES), ts("EAINT-12403")]),
        F("Check the reset scope, the cronjob resubmission price and old vs new transactions in reports.", [ts("12403_CRN1"), ts("12289")]),
        F("Check Wholesale STMS display, Android tiles, UCD to UCD Standard and Interstate.", [ji("EAINT-12550"), ts("12403_UTU_E2E1-E2E2")]),
        F("Check Step 6 and detail pages show no pricing for APT.", [ts("12289_DSP2")]),
        F("Check reconciliation and reports tie to both fee versions.", [ts("12403_STMS_RPT1")]),
        F("Create test data before the push so old-price cases can be tested.", [ts("TS #042 row 8")]),
      ],
      tickets: [
        { key: "EAINT-10175", date: "2026-03", what: "STMS Car RM15 to RM20", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-10089", date: "2026-09", what: "JomCheck RM18 to RM20", state: "latest" },
        { key: "EAINT-10691", what: "SSM price to RM19.44", state: "latest" },
        { key: "EAINT-9605", what: "New usage code and body type (legacy STMS RM15, eSTM RM35)", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-11057", what: "STMS usage code AH visible only when JPJ returns AH", state: "latest" },
        { key: "EAINT-12289", date: "2026-09", what: "APT eAuto fee RM15 to RM20, effective 15.09.2026", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-12403", date: "2026-10", what: "STMS (incl. UCD to UCD) and APT eAuto fee RM20 to RM25 +8%, Car and Commercial Car, excl. AA; effective 02.10.2026; SRD v1.1 2026-09-25", state: "latest" },
        { key: "EAINT-12279", date: "2026-09", what: "Wholesale chatbot and payment portal JomCheck price RM18 to RM20", state: "latest" },
        { key: "EAINT-12550", date: "2026-10", what: "Android tile price RM25 to RM35", state: "latest" },
        { key: "EAINT-12553", date: "2026-10", what: "Usage code AH", state: "latest" },
        { key: "EAINT-12562", date: "2026-10", what: "Wholesale APT check and priced from TransferCost", state: "latest" },
      ],
      openQuestions: [
        "SRD 12403 says AA stays RM10 STMS / RM5 APT. That matches AA CAR rows only. The QA note “RM15 is total incl. JPJ” does not match the rate card (RM15 is the eAuto fee on AB–AE BIKE rows). Still open.",
        "STMS SSM price: older workbooks show RM15 + 3 + 1.44; the screen shows RM18 + 1.44.",
        "“production folder 20260331 (Add RM5 STMS & UTU)” is probably the RM15 → RM20 STMS step. Not confirmed.",
      ],
    },

    // ---------------------------------------------------------- 4
    {
      id: "apt-payment-jobs",
      name: "APT automatic payment and resubmit jobs",
      summary:
        "APT (Automatic Permanent Transfer) is never started by the dealer. The system makes it and a job pays it. Failed ones are retried by the resubmit job.",
      portals: ["Back Office (manual trigger, reset)", "UCD portal (APT listing)", "JPJ (notices 5.5 and 6.0)", "RHB"],
      triggers: [
        {
          id: "jpj-notice",
          name: "JPJ notice 5.5 then 6.0 after an STMS is approved",
          entry: "JPJ notice → APT transaction created with status New",
          steps: [
            S("APT is created", [mi(RULES), ts("12289_E2E1"), az(APT)], { detail: "On staging BO uses Manual APT Trigger for notice 5.5 then 6.0. The 6.0 auto-create/submit job runs with no payment. Region follows the company address state." }),
            S("Dealer or job pays", [az(APT), ts("12289_E2E1")], { detail: "UCD APT listing › Resubmit › Step 5. Or the job pays by itself.", affects: ["rhb-direct-debit"] }),
          ],
          sources: [az(APT), ts("12289")],
        },
        {
          id: "resubmit-cron",
          name: "Resubmit job (EAINT-8668)",
          entry: "Scheduled job",
          steps: [S("Resubmits failed APT", [mi(RULES), az(FEES)], { detail: "Production 8:00 PM daily; staging every 10 minutes. Only Payment = Failed that meets all criteria. On success: Payment OK, Tx Approved, e-Invoice and Slip Pengesahan available. Priced at the new fee." })],
          sources: [mi(RULES), ts("12289_CRN1-CRN3")],
        },
      ],
      affects: [
        F("APT Transaction Listing (UCD) and APT Transaction Enquiry (BO).", [ts("12289_PAY1")]),
        F("Invoice, e-Invoice, Slip Pengesahan, reconciliation, Wholesale booking fee (code 4Z).", [ts("12289_R2")]),
      ],
      cronjobs: [
        { name: "APT resubmit job (EAINT-8668)", schedule: "Production 8:00 PM daily; staging every 10 minutes", does: "Resubmits failed APT payments and final submission.", sources: [mi(RULES), az(FEES)] },
        { name: "APT 6.0 auto-create / submit job", schedule: "Not recorded", does: "Creates and submits APT after STMS approval with no payment.", sources: [ts("12289_R3")], unconfirmed: true },
        { name: "Manual APT trigger (BO Support Tools)", schedule: "Manual", does: "Triggers APT for JPJ notice 5.5 then 6.0 on staging.", sources: [az("knowledge/_core/apt.md")] },
      ],
      roles: [
        F("Dealer never starts an APT. BO Hub Admin and Super Admin use Manual APT Trigger.", [az(APT), az(STMS)]),
      ],
      afterCompletion: [F("APT Approved. e-Invoice and Slip Pengesahan appear.", [mi(RULES)])],
      rules: [
        F("APT statuses: New, Pending, Committed, Approved, Failed, Cancelled. The pay link shows only when the 6.0 notice date is present and the transaction is not Cancelled or Expired.", [az(APT)]),
        F("APT Step 6 and UCD / BO detail pages show no price.", [ts("12289_DSP1-DSP2")]),
      ],
      scopeToCheck: [
        F("Check APT created by notice and by manual trigger, then paid by dealer and by job.", [ts("12289_E2E1")]),
        F("Check the job picks only Payment = Failed and prices at the new fee.", [ts("12289_CRN1-CRN3")]),
      ],
      tickets: [
        { key: "EAINT-8668", what: "APT resubmit cronjob", state: "latest" },
        { key: "EAINT-12403", date: "2026-10", what: "APT fee RM25 and reset rules", state: "latest" },
        { key: "EAINT-12289", date: "2026-09", what: "APT fee RM20", state: "legacy", supersededBy: "EAINT-12403" },
        { key: "EAINT-11855", date: "2026-06", what: "Auto reset on RE", state: "latest" },
      ],
      openQuestions: ["Is the APT resubmit job schedule the same as the 20:00 auto-pay job? Azfar and Faizuddin both say 20:00 / 8 PM, so they likely are one job. Not confirmed."],
    },
  ],
};
