import type { Module, Source } from "../types";

const FD: Source = { kind: "mine", ref: "knowledge/flow-edereg.md" };
const FD_LIVE: Source = { kind: "mine", ref: "knowledge/flow-edereg.md §3,§8,§9 (confirmed live end to end)", date: "2026-08-24" };
const FD_GATE: Source = { kind: "mine", ref: "knowledge/flow-edereg.md §4,§5.1", date: "2026-08-21" };
const FD_BO: Source = { kind: "mine", ref: "knowledge/flow-edereg.md §45", date: "2026-10-15" };
const FD_LOG: Source = { kind: "mine", ref: "knowledge/flow-edereg.md §46", date: "2026-08-24" };
const FD_CRON: Source = { kind: "mine", ref: "knowledge/flow-edereg.md §5.5", date: "2026-08-28" };
const FD_PERAKUAN: Source = { kind: "mine", ref: "knowledge/flow-edereg.md §42", date: "2026-09-10" };
const FD_REPEAT: Source = { kind: "mine", ref: "knowledge/flow-edereg.md §38,§40", date: "2026-09-04" };
const MIRO: Source = { kind: "miro", ref: "uXjVKZM9x0M=" };
const AZ_DEREG: Source = { kind: "azfar", ref: "knowledge/cross-portal/deregistration.md" };
const AZ_AATF: Source = { kind: "azfar", ref: "knowledge/portals/aatf/portal.md" };
const AZ_FLOW: Source = { kind: "azfar", ref: "automation/src/flows/dereg.flow.ts" };
const ASK_D: Source = { kind: "askeauto", ref: "prod code 0e21bef3 (eauto) + eauto-cron + eauto-elasticgateway prod/master — AATF Deregistration and eDereg Pre-Checking answer", date: "2026-10-23" };
const J9306: Source = { kind: "jira", ref: "EAINT-9306" };

export const dereg: Module = {
  id: "dereg",
  name: "AATF Deregistration (eDEREG) and eDereg Pre-Checking",
  short: "eDereg",
  portals: ["AATF portal", "Back Office", "JPJ", "RHB", "eSIM (staging steering)"],
  summary:
    "AATF users (authorised treatment facilities, and PBT accounts) deregister a vehicle through the AATF portal. Since EAINT-9306 (live 2026-09-15) every deregistration needs an Approved eDereg Pre-Checking for the same vehicle and company within the last 6 months. A pre-check is a paid JPJ enquiry. The user can buy it first, or buy it inside Deregistration Step 2.",
  related: ["backoffice", "payments-fees", "platform"],
  glossary: [
    { term: "AATF", meaning: "Authorized Automotive Treatment Facilities. The type of account that uses the deregistration portal.", sources: [{ kind: "azfar", ref: "knowledge/_core/glossary.md" }, J9306] },
    { term: "PBT", meaning: "Account type that uses the same UI as AATF. The prod code calls PBT the local authority and emails the Certificate of Destruction to the PBT and DOE addresses. The full words are not written in the code (unconfirmed). EAINT-12348 plans PBT organisations as login-enabled eDereg users.", sources: [ASK_D, { kind: "azfar", ref: "knowledge/_core/glossary.md" }, { kind: "jira", ref: "EAINT-12348" }] },
    { term: "eDereg Pre-Checking", meaning: "Paid JPJ enquiry on a vehicle before deregistration. Result is Approved only if payment is Paid and JPJ answers OK.", sources: [FD_GATE, AZ_DEREG] },
    { term: "Perakuan", meaning: "Malay declaration the user must accept. In the pre-check popup it is \"PERAKUAN eDEREG PRE-CHECKING - AATF\" and needs an email.", sources: [FD_PERAKUAN] },
    { term: "Slip Pengesahan", meaning: "Confirmation slip for an approved pre-check or deregistration.", sources: [MIRO, FD] },
    { term: "COD", meaning: "Certificate of Destruction. The AATF uploads the COD document (with the JPJ K1D) before the JPJ decomposition call; isCodUploaded is set. The system emails the COD PDF to the vehicle owner and the PBT / DOE addresses.", sources: [ASK_D] },
    { term: "COD (old guess)", meaning: "Confirmation of Deregistration / upload (Upload COD screen). Replaced by Certificate of Destruction from the prod code.", sources: [AZ_DEREG] },
    { term: "MOT / JPJ Hasil", meaning: "Government accounts that see approved deregistrations and JPJ summary reports.", sources: [MIRO] },
    { term: "PC / D numbers", meaning: "Pre-check refs look like PC68001153. Deregistration refs look like D680000566.", sources: [FD_LOG] },
  ],
  flows: [
    // ------------------------------------------------------------------
    {
      id: "precheck-purchase",
      name: "Buy an eDereg Pre-Checking",
      summary:
        "The user pays RM10.40 and JPJ returns a result for the vehicle. There are two ways in: the standalone Enquiry page, or the popup inside Deregistration Step 2. Both create the same kind of pre-check record.",
      portals: ["AATF portal", "JPJ", "RHB"],
      triggers: [
        {
          id: "standalone-enquiry",
          name: "Standalone enquiry (pre-check done first)",
          entry: "AATF portal › eDEREG › eDereg Pre-Checking Enquiry (/view/aatf/dereg/precheck/enquiry/main.do)",
          summary: "Steps 1 Vehicle, 2 Payment, 3 Result all happen on the same URL.",
          sources: [FD, MIRO],
          steps: [
            {
              title: "Log in as AATF user",
              where: "/<env>/public/login → AATF home (/view/aatf/home)",
              detail: "A compliance announcement banner shows. Close the Announcement (Pengumuman) modal.",
              sources: [FD, AZ_AATF],
            },
            {
              title: "Open eDereg Pre-Checking Enquiry",
              where: "AATF home › eDEREG (/view/aatf/dereg/view.do) › eDEREG PRE-CHECKING ENQUIRY",
              detail: "The page has four buttons: eDEREG PRE-CHECKING ENQUIRY, eDEREG PRE-CHECKING TRANSACTION LISTING, DEREGISTRATION TRANSACTION LISTING, CREATE DEREGISTRATION TRANSACTION.",
              sources: [MIRO, FD],
            },
            {
              title: "Step 1 Vehicle: enter the vehicle no and enquire",
              where: "Pre-Checking Enquiry › Step 1",
              detail: "Vehicle no: alphanumeric only, auto uppercase, strips spaces and special characters, min 3 and max 20 characters. Tick the consent, then ENQUIRE NOW. Warning on page: no refund once paid. First JPJ enquiry runs.",
              branches: [
                { when: "First enquiry fails with another code", then: "Result shows and a RESUBMIT button." },
                { when: "First enquiry fails with VEL000100E (vehicle record not exist)", then: "MAKE ANOTHER ENQUIRY button." },
                { when: "First enquiry succeeds (GLB000000I)", then: "Vehicle no is locked. Next." },
              ],
              sources: [FD, MIRO, AZ_DEREG],
            },
            {
              title: "Step 2 Payment: declaration and pay with RHB",
              where: "Pre-Checking Enquiry › Step 2 Payment",
              detail: "Fee RM10.40 = JPJ Fee 5.00 + eAuto Service Fee 5.00 + Service Tax 8% 0.40. From SRD V1.2 a Malay declaration with a mandatory email shows once per new transaction (not on resubmit or RE). Next, then \"Sure to submit this payment\". A hidden JPJ enquiry runs, then the RHB payment.",
              affects: ["RHB direct debit"],
              branches: [
                { when: "RHB code RE", then: "Payment history and \"Waiting for RHB to reset payment\". 6-minute timer. Retry is hidden until the timer ends, also for a second user and after refresh." },
                { when: "RHB code IF or other", then: "Retry shows at once. Retry fires a native confirm each time and retries the same payment." },
                { when: "RHB API down (ER)", then: "Transaction can end Cancelled; about 12-minute cooldown between real attempts." },
              ],
              sources: [FD, FD_PERAKUAN, MIRO],
            },
            {
              title: "Step 3 Result: second and final JPJ enquiry",
              where: "Pre-Checking Enquiry › Step 3 Result (#payment-result)",
              detail: "Shows 12 attributes: Vehicle Record, Vehicle Status, Verified Status, Usage Code, JPJ / JSJ / Agency Blacklist, Claim Ownership, Vehicle In Investigation, Vehicle Condition. Click Done.",
              branches: [
                { when: "JPJ answers GLB000000I", then: "Pre-check Approved (Payment OK, JPJ OK)." },
                { when: "JPJ API down", then: "\"Rangkaian sistem tergendala...\" and result \"04 - Timeout Error Waiting for Response\"." },
                { when: "JPJ fails after payment", then: "Result shows the JPJ code and description. Status Failed." },
              ],
              sources: [FD, MIRO],
            },
            {
              title: "Open the pre-check details page",
              where: "Done › eDereg Pre-Checking Transaction Details (Ref No: PC########)",
              detail: "Buttons and blocks: Slip Pengesahan, Result, JPJ Enquiry, Payment Details, Final Submission.",
              sources: [MIRO, FD],
            },
          ],
        },
        {
          id: "inside-step2",
          name: "Popup inside Deregistration Step 2 (pre-check done in Step 2)",
          entry: "Create Deregistration › Step 2 Vehicle › leave the Vehicle No field (blur)",
          summary: "The gate fires when the user leaves #vehicleRegNo. If there is no qualifying pre-check, the pre-check popup (#precheck-popup) opens.",
          sources: [FD_GATE, MIRO, J9306],
          steps: [
            {
              title: "Type the vehicle no and leave the field",
              where: "Create Deregistration › Step 2 Vehicle (data-entry.do)",
              detail: "System checks for a qualifying pre-check.",
              sources: [FD_GATE, MIRO],
            },
            {
              title: "Read the gate message",
              where: "Step 2 › #precheck-result",
              detail: "Green: \"This vehicle is allowed to create eDereg transaction\". Red: \"Approved eDereg Pre-Checking within 6 months is required to proceed\" and the popup opens: \"Click NEXT to pay and retrieve the vehicle pre-checking result.\" with \"Note : No refund is allowed, once payment is made.\" Buttons Cancel and Next.",
              branches: [
                { when: "User clicks Cancel", then: "Red message stays under the vehicle number." },
                { when: "User clicks Next", then: "Declaration with email, then RHB payment, then final JPJ enquiry." },
              ],
              sources: [FD_GATE, MIRO],
            },
            {
              title: "Declaration, payment and JPJ result inside the popup",
              where: "#precheck-popup (Step 1 Vehicle and Payment Details, Step 2 Payment, Step 3 Result)",
              detail: "The vehicle no is copied from Step 2 and cannot be edited. Email field (#dpc-consent-email) is editable: required, max 100 characters, only letters, numbers, dot, underscore and hyphen. The declaration shows on first-time purchase and on repurchase of the same vehicle no in a different transaction, not on resubmit or RE. Payment failure shows \"Payment History\" with #reset-timer and Next / Cancel.",
              branches: [
                { when: "JPJ result GLB000000I", then: "Popup says \"Able to proceed for eDereg\". Close, then the green message shows and Next continues." },
                { when: "JPJ failed after payment", then: "Popup says \"Unable to proceed for eDereg\". Close only. Close clears Vehicle No and blocks Step 3. Remark: \"Your eDereg Pre-Checking is unsuccessful. Kindly contact our Customer Service at 03-27798899\"." },
              ],
              sources: [FD_PERAKUAN, FD_REPEAT, MIRO],
            },
          ],
        },
        {
          id: "listing-resubmit",
          name: "Resubmit from the Pre-Checking Transaction Listing",
          entry: "AATF portal › eDereg Pre-Checking Transaction Listing › Resubmit (status Pending)",
          sources: [MIRO, FD],
          steps: [
            {
              title: "Open the listing and click Resubmit",
              where: "eDereg Pre-Checking Transaction Listing",
              detail: "Listing shows no records until Search Now is clicked. Pending rows have View | Resubmit. Failed and Approved rows have View. Resubmit after a JPJ failure goes to Step 3 and shows the existing result, no new enquiry.",
              sources: [MIRO, FD],
            },
          ],
        },
        {
          id: "details-link",
          name: "Link from a deregistration details page",
          entry: "Deregistration details › \"eDereg Pre-Checking: Yes\"",
          summary: "Opens the pre-check listing for that vehicle with auto search.",
          sources: [FD, MIRO],
          steps: [
            {
              title: "Click Yes",
              where: "Deregistration details page (AATF and BO)",
              detail: "Goes to /view/aatf/dereg/precheck/enquiry/main.do?vehicleNo=<plate>&autoSearch=true.",
              sources: [FD, MIRO],
            },
          ],
        },
      ],
      affects: [
        { text: "Deregistration Step 2 gate decides if Create Deregistration can continue.", sources: [FD_GATE] },
        { text: "AATF and BO eDereg Pre-Checking listings and details pages.", sources: [FD, MIRO] },
        { text: "Deregistration details shows a new row \"eDereg Pre-Checking: Yes\" or \"-\".", sources: [FD, MIRO] },
        { text: "BO JPJ XML Log (eDereg Pre-Checking) writes a PrecheckEnquiry row.", sources: [FD_LOG] },
        { text: "Invoice and e-Invoice for a paid pre-check (LHDN status). Slip Pengesahan for AATF and BO.", sources: [FD, { kind: "ts", ref: "EAINT-8655 & 9043 TS #075" }] },
        { text: "AATF Payment Report type \"All - DEREG - Deregistration - eDereg Pre- Checking\" (EAINT-9715).", sources: [FD] },
        { text: "JPJ emails a receipt to the declared email, cc receipt@eauto.my. While staging is connected to JPJ staging the email goes to systemtest@eauto.my.", sources: [FD, { kind: "mine", ref: "knowledge/mailtrap.md", date: "2026-09-17" }] },
        { text: "Kod Hasil H0272404 on reconciliation covers BMK, TH and eDereg Pre-Checking.", sources: [{ kind: "azfar", ref: "cr/EAINT-10168/LEDGER.md" }] },
      ],
      cronjobs: [
        {
          name: "Pre-Checking expiry",
          schedule: "Daily 23:59:59",
          does: "Flips non-Approved pre-checks (Failed, Pending) to Expired with Remarks \"Transaction Expired\". Never touches Approved, Expired or Failed rows. Skips records created the same calendar day. For testing ask dev to run it.",
          sources: [FD_CRON, MIRO],
        },
        {
          name: "DeregPrecheckExpiredJob (eauto-cron)",
          schedule: "Config key cron.time.dpcexpired (value hidden). Switch cron.task.dpcexpired.enabled defaults to on.",
          does: "Expires stale eDereg Pre-Checking transactions. A manual trigger endpoint exists for support (ManualTriggerResource). Same job as the daily 23:59:59 expiry above, by name.",
          sources: [ASK_D],
          unconfirmed: true,
        },
        {
          name: "LHDN e-Invoice resubmission",
          schedule: "Not known",
          does: "Picks up failed e-Invoice rows after the TIN is corrected.",
          sources: [{ kind: "ts", ref: "EAINT-8655 & 9043 TS #075 rows 12-13" }],
          unconfirmed: true,
        },
      ],
      roles: [
        { text: "AATF Main user and Sub user in the same company, or two Main users in different companies. Another company's approval does not satisfy the gate.", sources: [FD_GATE] },
        { text: "BO users see and cancel pre-checks. BO Export Excel is limited to a named list of six BO accounts.", sources: [FD_BO, MIRO] },
        { text: "Dereg owner email must not be @modefair.com or a disposable address.", sources: [FD] },
        { text: "Code gate: only AATF-type companies (CompanyType.AATF) use these screens. BO Admin and HubAdmin users bypass the AATF permission check. The JPJ Reconciliation Summary (eDereg Pre-Checking) report and the pre-check export are limited to a hardcoded list of BO user IDs (AuthorizedUserList), not a role.", sources: [ASK_D] },
        { text: "UCD, Insurance, Bank and public portals have no access.", sources: [ASK_D] },
      ],
      afterCompletion: [
        { text: "AATF eDereg Pre-Checking Transaction Listing (PC######## refs). Status values: Approved, Failed, Pending, Cancelled, Expired. BO mirrors it.", sources: [FD_BO, MIRO] },
        { text: "Payment refs (dev, not confirmed): Pre-check TransType DPC, Ref1 DPC<yymmdd><6>-<VN>.", sources: [FD_BO], unconfirmed: true },
        { text: "An e-Invoice is sent through RabbitMQ (EInvoiceMessager.sendDeregPrecheckMsg) and tracked on eInvoiceSubmissionStatus / eInvoiceValidationStatus. Payment events go to a payment-transaction stream that eauto-cron uses for GST and RHB reconciliation. Paid transactions are indexed into eauto-elasticgateway for the RHB payment listing.", sources: [ASK_D] },
      ],
      rules: [
        { text: "Statuses (DeregPrecheckTransaction): transactionStatus New → Pending → Approved or Failed, plus Cancelled (cancelFlag, cancelledAt, cancelledBy) and Expired (expiry job). lastPaymentStatus New → Pending → Paid (or Failed / Error / Aborted / To Refund / Refunded). lastJpjPrecheckEnquiryStatus New → Pending → Passed / Failed; jpjApprovedAt is set on approval. Steps: enquiry form + AATF consent creates the transaction (New); RHB payment sets Paid and paidAt; one JPJ SOAP check (5 second timeout) sets the JPJ status.", sources: [ASK_D] },
        { text: "The gate is enforced in code, not only on screen: Step 2 of Deregistration calls /api/aatf/dereg/transaction/precheck-exists.do and blocks progress with an error if no passed pre-check exists for the vehicle.", sources: [ASK_D] },
        {
          text: "Gate needs ALL four: pre-check status Approved, payment Paid, JPJ status Approved, JPJ approval within the last 6 months. One qualifying record is enough. Later failure does not invalidate it.",
          sources: [FD_GATE],
        },
        { text: "Fee RM10.40 = JPJ 5.00 + eAuto 5.00 + tax 0.40.", sources: [FD, { kind: "mine", ref: "knowledge/cr-ledger.md §EAINT-9306", date: "2026-09" }],
          alt: [{ text: "Standalone enquiry map shows \"JPJ Fee : RM 5.00 / eAuto Service Fee : RM 0.00 / Service Tax : RM 0.00 / Total RM 5.00\". The Step 2 gate popup shows placeholder RM 0.00.", sources: [MIRO], note: "Miro mind map. Staging shows RM10.40; confirm against the SRD." }] },
        { text: "Perakuan applies only to a first-time purchase (and repurchase of the same vehicle no in a different transaction), not to resubmit or RE.", sources: [FD_PERAKUAN, MIRO] },
        {
          text: "Re-entering the same vehicle: a payment-leg failure restarts the popup. A JPJ failure re-shows the SAME Failed result (no new payment). Exception VEL000100E offers a fresh purchase and creates a NEW pre-check row each time.",
          sources: [FD_REPEAT],
          alt: [{ text: "Three live runs (CPC_E2E_TS2, MU_TS5, MU_TS6) showed the closed-direct re-show even for VEL000100E. SRD V1.1 Scenario 4 documents no per-code exception.", sources: [FD], note: "Unresolved live-vs-rule conflict." }],
        },
        { text: "6-month expiry is separate from the cronjob. To test it dev patches the transaction; there is no in-app fast-forward.", sources: [FD_CRON] },
        { text: "Refreshing mid-flow restarts Step 2 pre-check. Nothing is saved.", sources: [FD] },
        { text: "Staging payment codes via eSIM RHB Transfer entity: OK, IF (insufficient funds), RE (6-minute timer), ER (API down, ~12-minute cooldown).", sources: [FD, { kind: "mine", ref: "knowledge/flow-edereg.md §5.3,§49", date: "2026-09-14" }] },
        { text: "Staging JPJ codes via eSIM entity dereg-precheck-enquiry-resp: GLB000000I approved, VEL000100E vehicle not exist, VEL000045E generic JPJ error. Most JPJ codes show the same \"system currently unavailable\" note.", sources: [FD, AZ_DEREG] },
        { text: "Second user on the same payment gets \"Duplicate RHB payment requests have been detected... please refresh\". BO cancel or cronjob expiry while another user has the transaction open shows \"Transaction Cancelled\" or \"Transaction Expired\".", sources: [FD] },
        { text: "Invoice and e-Invoice outcome: valid TIN gives e-Invoice OK + Invoice; invalid TIN gives both Failed with remark \"TIN verification failed. Kindly provide correct TIN information to eAuto customer service.\"; cancelled or failed payment gives no documents.", sources: [{ kind: "ts", ref: "EAINT-8655 & 9043 TS #075" }, FD] },
        { text: "Invoice / e-Invoice item and the JPJ Official Receipt button were rejected from EAINT-9306 and sent to a new CR (EAINT-9204 covers JPJ Official Receipt including eDereg Pre-Checking).", sources: [FD_PERAKUAN, { kind: "jira", ref: "EAINT-9204" }] },
      ],
      scopeToCheck: [
        { text: "Both entry points: standalone enquiry and Step 2 popup.", sources: [FD_GATE] },
        { text: "The four-condition gate including the 6-month expiry (needs a dev patch).", sources: [FD_GATE] },
        { text: "Every JPJ code outcome: Approved, VEL000100E, VEL000045E.", sources: [FD] },
        { text: "Payment OK, IF, RE (6-minute timer) and ER.", sources: [FD] },
        { text: "Re-entry: show same result versus buy again.", sources: [FD_REPEAT] },
        { text: "Multi-user, same and different company (MU_TS1-12). Cronjob statuses (CJ_TS1-5).", sources: [FD, MIRO] },
        { text: "Announcement banners on AATF Home, eDEREG page and Kategori ID page (AM_TS1-4).", sources: [FD] },
        { text: "Check the Deregistration details link \"eDereg Pre-Checking: Yes\", BO listing and BO cancel.", sources: [FD_BO] },
        { text: "Check the BO JPJ XML Log, invoice, e-Invoice, Slip Pengesahan and AATF Payment Report.", sources: [FD_LOG, FD] },
        { text: "Thumbprint pages (Dereg Step 1 and Step 3) still work.", sources: [FD] },
      ],
      tickets: [
        { key: "EAINT-9306", date: "2026-09", what: "Compulsory eDereg Pre-Checking. SRD V1.0 → V1.1 (2026-09-01, Scenario 4 re-show) → V1.2 (2026-09-10, declaration + email). Live 2026-09-15 (S33.6-20260915).", state: "latest" },
        { key: "EAINT-5459", date: "2024-11", what: "Original eDereg Pre-Checking (vehicle status). Done.", state: "legacy", supersededBy: "EAINT-9306" },
        { key: "EAINT-12340", date: "2026-09", what: "Deregistration proceeds when pre-check Vehicle Status is not Active (QA-Issue under 9306). Done.", state: "latest" },
        { key: "EAINT-12268", date: "2026-09", what: "Failed pre-check at Step 2 not offering repurchase. Closed as miscommunication.", state: "latest" },
        { key: "EAINT-12258", date: "2026-09", what: "Resubmit dereg payment after dev payment reset fails. Closed.", state: "latest" },
        { key: "EAINT-12251", date: "2026-09", what: "Internal Server Error at Step 2 with Approved plus later Declined pre-check. Closed.", state: "latest" },
        { key: "EAINT-12240", date: "2026-08", what: "Failed pre-check not auto-expired by daily cronjob. Closed (same-day exclusion).", state: "latest" },
        { key: "EAINT-12233", date: "2026-09", what: "No \"Transaction Cancelled\" message after BO cancels pre-check. Closed.", state: "latest" },
        { key: "EAINT-8655", what: "Invoice and e-Invoice for pre-check (from 1 Nov 2025). Linked ticket EAINT-9043.", state: "latest" },
        { key: "EAINT-9715", what: "AATF Payment Report includes pre-check type.", state: "latest" },
        { key: "EAINT-12253", date: "2026-10", what: "Browser Reminder at Dereg Step 5 / pre-check Step 2 payment (Firefox). Testing in 1st env.", state: "latest" },
        { key: "EAINT-12180", date: "2026-09", what: "Firefox to Chrome announcement popup on AATF homepage. Live.", state: "latest" },
        { key: "EAINT-12348", date: "2026-10", what: "PBT organisations as active eDereg users (SRD v1.1 2026-10-20, review).", state: "latest" },
        { key: "EAINT-12252", date: "2026-09", what: "UI/UX revamp of eDereg portal for AATF and PBT. To Do.", state: "latest" },
      ],
      openQuestions: [
        "VEL000100E repurchase rule conflicts with 3 live runs that showed the same result again. Unresolved.",
        "How \"Active\" maps to the captured status select values is not confirmed.",
        "Never captured: BO pre-check details view, Slip Pengesahan, Resubmit JPJ Final Submission, Reset Payment Report.",
        "TS11 Part 2 and TS12 Part 2 were never re-run after rewrite (need a dev patch to Expired).",
        "Message for an expired approval is not defined (Azfar Q5).",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "create-deregistration",
      name: "Create a Deregistration (6 steps)",
      summary:
        "The AATF user deregisters a vehicle owned by a Malaysian (MyKad) or MyPR person. Steps: 1 Owner, 2 Vehicle (with the pre-check gate), 3 Consents, 4 JPJ Check, 5 Payment, 6 Deregister result. Confirmed live end to end on 2026-08-24.",
      portals: ["AATF portal", "JPJ", "RHB"],
      triggers: [
        {
          id: "aatf-home",
          name: "AATF home: CREATE DEREGISTRATION TRANSACTION",
          entry: "AATF portal › Home › eDEREG tile (/view/aatf/dereg/view.do) › CREATE DEREGISTRATION TRANSACTION",
          sources: [FD_LIVE, MIRO, AZ_DEREG],
          steps: [
            {
              title: "Choose the category",
              where: "CREATE DEREGISTRATION TRANSACTION › Kategori ID",
              detail: "\"Orang Awam Malaysia (MyKad)\" or MyPR. MyPR behaves like MyKad.",
              sources: [FD_LIVE, MIRO],
            },
            {
              title: "Step 1 Owner: reminder and owner authentication",
              where: "Dereg › Step 1 Owner",
              detail: "Reminder to vehicle owner. The owner reads MyKad and thumbprint (\"Please use Owner's MyKad.\"). Photo, name, MyKad no and address show. The thumbprint device only checks that the thumbprint matches the IC, not against eAuto's system. A mismatch shows \"Verification Failed, do you want to try again\".",
              affects: ["Platform › MyKad / thumbprint reader"],
              sources: [FD_LIVE, MIRO, AZ_DEREG],
            },
            {
              title: "Step 2 Vehicle: details and the pre-check gate",
              where: "Dereg › Step 2 Vehicle (data-entry.do)",
              detail: "Fields: mobile no, email, PBT / Individu dropdown, Attach Consent, Vehicle No (min 3), Engine No, Chassis No, Make/Model, Manufacturing Year, Attach Photos (max 3, photo 1 mandatory). Four uploads. Engine and chassis accept only 4 special characters (* - / space). Leaving Vehicle No runs the pre-check gate (see flow Buy an eDereg Pre-Checking). Next (#to-continue) shows a native confirm.",
              affects: ["eDereg Pre-Checking"],
              branches: [
                { when: "No qualifying pre-check", then: "Pre-check popup opens; user must buy one." },
                { when: "Pre-check JPJ failed", then: "Vehicle No is cleared and Step 3 is blocked." },
              ],
              sources: [FD_LIVE, MIRO, AZ_DEREG],
            },
            {
              title: "Step 3 Consents: owner and AATF representative",
              where: "Dereg › Step 3",
              detail: "Owner declaration and agreement tick, then owner MyKad and thumbprint. Then the AATF's copy: representative declaration tick (Next hidden until ticked), then the login user's MyKad and thumbprint (\"Please use login user's MyKad\").",
              affects: ["Platform › MyKad / thumbprint reader"],
              sources: [FD_LIVE, MIRO],
            },
            {
              title: "Step 4 JPJ Check",
              where: "Dereg › Step 4 JPJ Check",
              detail: "Shows owner, vehicle and AATF company details (from BO). Agreement \"I hereby agree to submit the information for deregistration purpose.\" Next triggers the JPJ enquiry (native confirm). On success Tx Status is Pending with Cancel and Make Payment; engine and chassis can no longer be edited.",
              branches: [
                { when: "JPJ enquiry fails", then: "A record is created in the listing: JPJ Check FAILED, Tx Status FAILED, Remark \"JPJ Enquiry Failed : {error}\". Actions View | Resubmit. Page shows Save Continue Later / Retry." },
              ],
              sources: [FD_LIVE, MIRO],
            },
            {
              title: "Step 5 Payment",
              where: "Dereg › Step 5 Payment",
              detail: "\"Click NEXT to pay and DEREGISTER.\" Native confirm, then RHB enquiry. No email is sent to the owner or UCD when payment fails.",
              affects: ["RHB direct debit"],
              branches: [
                { when: "RHB payment fails", then: "Popup with the RHB error text, payment history and RETRY. Listing: Payment Failed, Tx Status Failed, Remarks \"{code} - {description}\"." },
                { when: "Payment OK but JPJ submission fails", then: "Tx Status Failed, Invoice download available, listing \"JPJ Transfer = Failed / JPJ Submission Failed : {error}\". No email." },
              ],
              sources: [FD_LIVE, MIRO, AZ_FLOW],
            },
            {
              title: "Step 6 Deregister result",
              where: "Dereg › Step 6 (jpj-sub.do)",
              detail: "\"JPJ Transfer Status = OK - TRANSACTION SUCCESSFUL\". Click Done. Tx Status becomes Approved. Details page shows Category (\"Malaysian to AATF\" or \"MyPR to AATF (Non-Company)\"), Uploaded Consent and Perakuan downloads. JPJ Enquiry shows 2 records because it triggers 2 times. JPJ sends an email with COD to the owner email on final submission success.",
              sources: [MIRO, AZ_FLOW, { kind: "mine", ref: "knowledge/mailtrap.md §1a" }],
            },
          ],
        },
        {
          id: "deregistration-listing",
          name: "Deregistration Transaction Listing (view / resubmit)",
          entry: "AATF portal › DEREGISTRATION TRANSACTION LISTING (/view/aatf/dereg/enquiry/main.do)",
          sources: [FD, AZ_AATF],
          steps: [
            {
              title: "Open the listing and use View or Resubmit",
              where: "Deregistration Transaction Listing",
              detail: "Refs look like D#########. Failed rows have View | Resubmit. Expired rows are View only.",
              sources: [FD, MIRO],
            },
          ],
        },
      ],
      affects: [
        { text: "AATF and BO Deregistration listing and details; column eDereg Pre-Checking (Yes link or -).", sources: [AZ_DEREG, FD] },
        { text: "Tax Invoice PDF, Perakuan PDF, Uploaded Consent download.", sources: [MIRO] },
        { text: "BO JPJ XML Log (Deregistration): one completed dereg wrote 4 rows (Submission, SecondEnquiry, Enquiry, Enquiry).", sources: [FD_LOG] },
        { text: "AATF Payment Report, Audit Trail Log, JPJ Reports in BO.", sources: [AZ_DEREG, { kind: "azfar", ref: "knowledge/portals/aatf/how-we-test.md" }] },
        { text: "MOT Deregistration Transaction Listing (Approved only).", sources: [MIRO] },
        { text: "JPJ: the vehicle is deregistered on JPJ.", sources: [AZ_DEREG] },
        { text: "eauto-cron reads Dereg and pre-check transactions for e-Invoice status sync and RHB bank-statement reconciliation. eauto-elasticgateway indexes paid Dereg payments. eauto-einvoice consumes the e-Invoice events. BO Manage AATF/PBT Account (DeregAccountController) holds the AATF / PBT company records. No JomCheck, SSM or report-engine link found.", sources: [ASK_D] },
      ],
      cronjobs: [
        {
          name: "DeregTransactionExpiredJob (unpaid Deregistration expiry)",
          schedule: "Dev-edition config: 0 0 2 * * ? (daily 2AM), but its trigger is commented out and the job inventory says Disabled. Prod scheduler file is withheld.",
          does: "Expires stale eDEREG transactions. Staging observation: an unpaid Deregistration moves to Expired (\"Transaction Expired.\", View only), e.g. created 17:21, Expired by 18:13. That does not match a 2AM job, so another mechanism may run on staging.",
          sources: [ASK_D, AZ_DEREG, { kind: "azfar", ref: "knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires" }],
          unconfirmed: true,
        },
      ],
      roles: [
        { text: "AATF portal user (AATF or PBT accounts). Managed in BO under Manage AATF/PBT Account (/view/account/dereg/aatf). AATF Settings has Confirmation of Registration and Manage Users. UI is English and Chinese.", sources: [AZ_AATF, { kind: "azfar", ref: "knowledge/portals/backoffice/portal.md" }] },
        { text: "Back Office users view only. A BO account is blocked from JPJ Dereg / JPJ Hasil URLs.", sources: [MIRO] },
        { text: "Different accounts are used for STMS and AATF on staging.", sources: [FD] },
        { text: "Code gate: AATF-type company users only. Per-user DeregUserPermission flags decide the actions: deregTransaction (create and work), uploadCOD, viewTransactionListingOnly, viewReport. A user with none of them (and not Admin / HubAdmin) is sent to an access-denied page. AATF company, branch and user onboarding is a separate MyKad flow (/public/aatf/wskad.do).", sources: [ASK_D] },
        { text: "BO staff reach both transaction types from the menu links Deregistration Transaction and eDereg Pre-Checking Transaction, plus the JPJ XML log viewers and a resubmission tool for failed pre-check JPJ submissions.", sources: [ASK_D] },
      ],
      afterCompletion: [
        { text: "Approved in the AATF Deregistration Listing and in the MOT Deregistration Transaction Listing.", sources: [MIRO, AZ_DEREG] },
        { text: "Payment ref (dev, not confirmed): TransType DRG, Ref1 DRG<yymmdd><6>-<VN>.", sources: [FD_BO], unconfirmed: true },
        { text: "On successful COD / decomposition the system emails the Certificate of Destruction PDF by SMTP (DeregEmailHandlerBean, not the RabbitMQ notification service) to the vehicle owner and the PBT / DOE email addresses. An e-Invoice goes out through RabbitMQ (EInvoiceMessager.sendDeregMsg). No SMS or WhatsApp is sent. No dedicated report-engine template exists for dereg.", sources: [ASK_D] },
      ],
      rules: [
        { text: "Statuses (DeregTransaction): transactionStatus New → Approved or Failed (Pending in between), plus Cancelled and Expired. lastPaymentStatus → Paid at payment (paidAt set). Each JPJ field moves New → Pending → Passed / Approved or Failed: lastJpjEnqStatus, lastJpjSecondEnqStatus (second owner scan), lastJpjDecStatus (decomposition, decompositionDate set, isCodUploaded = true) and lastJpjSubStatus (final submission; jpjApprovedAt set on approval).", sources: [ASK_D] },
        { text: "Prod code controllers per step (prod/master). Step 3 AATF (consent and AATF scrapping facility confirmation, before anything goes to JPJ): DeregTransactionController, aatf-consent / auth-aatf actions. Step 4 JPJ Check (eligibility enquiry): DeregJpjEnquiryController. Step 5 Payment: DeregPaymentController, then NewDeregPaymentHandlerBean. Step 6 Deregister (final JPJ submission and COD decomposition): DeregJpjSubmissionController and DeregCodController. All steps are user-driven; no scheduled job drives steps 3 to 6.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — Deregistration steps 3 to 6 and payment amount answer", date: "2026-10-23" }] },
        { text: "Prod code: on Step 5 only RHB direct debit works. If FPX or \"Pay Over the Bank / online\" is attempted the code throws a \"payment method not supported\" error, even where those options appear selectable elsewhere.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — Deregistration steps 3 to 6 and payment amount answer", date: "2026-10-23" }] },
        { text: "Prod code: the Deregistration payment amount is not a literal in code. It is read from the dedicated \"deregistration transfer cost\" setting (SettingsDao.getDeregTransferCost()). It is one flat fee for all dereg transactions (no variation by usage code, vehicle type or state), split into an eAuto part, a JPJ part and GST that add up to the total. Discount is forced to zero for Deregistration, so no discount ever applies. The actual value is a configured setting (not found in code).", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — Deregistration steps 3 to 6 and payment amount answer", date: "2026-10-23" }] },
        { text: "Order in the code: owner MyKad scan → data entry (pre-check gate) → second owner scan with LIVESCAN consent → AATF staff consent → JPJ enquiry → AATF staff MyKad scan + COD document + JPJ K1D upload → JPJ decomposition → RHB payment → JPJ final submission.", sources: [ASK_D] },
        { text: "A vehicle and owner may have only one Dereg transaction (\"Transaksi yang sama...\").", sources: [AZ_DEREG] },
        { text: "Email is not sent on a failed payment or failed JPJ submission.", sources: [MIRO] },
        { text: "Owner email must not be @modefair.com or a disposable address.", sources: [FD] },
        { text: "eSIM entities used: dereg-precheck-enquiry-resp, dereg-enquiry-resp, dereg-submission-resp, dereg-decomposition-resp.", sources: [AZ_DEREG] },
      ],
      scopeToCheck: [
        { text: "All 6 steps for Malaysian and MyPR owners.", sources: [FD_LIVE] },
        { text: "Each failure branch: JPJ enquiry fail, RHB fail, JPJ submission fail after payment. Check the listing remark.", sources: [MIRO] },
        { text: "Check no email is sent on failure.", sources: [MIRO] },
        { text: "Documents on the details page: Uploaded Consent, Perakuan, Invoice.", sources: [MIRO] },
        { text: "MOT listing filters and export (IC starting 00 or 01 shows 0 in Excel).", sources: [MIRO] },
        { text: "Check the JPJ XML Log rows and the eDereg Pre-Checking Yes link.", sources: [FD_LOG] },
      ],
      tickets: [
        { key: "EAINT-9306", date: "2026-09", what: "Pre-check gate at Step 2.", state: "latest" },
        { key: "EAINT-7229", date: "2025-12", what: "Thumbprint list includes Dereg Step 1 and Step 3, Upload COD Step 1, Manage Users.", state: "latest" },
        { key: "EAINT-12037", date: "2026-07", what: "Backlog: Deregistration reference number generation hardened. To Do.", state: "latest" },
        { key: "EAINT-12130", date: "2026-08", what: "Contact Us: hide eAuto bank account information (UCD and AATF). Done.", state: "latest" },
        { key: "DRG-19", what: "Older MOT / JPJ Hasil dereg listing access (date unknown).", state: "legacy", supersededBy: "EAINT-9306" },
      ],
      openQuestions: [
        "What is the configured Deregistration fee value (the deregistration transfer cost setting)? Prod code gives the rule (flat, no discount) but not the amount.",
        "Miro Step 4 has an open TBC: which highlighted fields show on Step 4.",
        "Miro Failed-branch Step 6 text mentions \"Dealer's Representative ... eVOC Request\", which looks copied from eSTM.",
        "Meaning of \"Confirmation of Registration\" in AATF Settings is not recorded.",
        "Dereg Steps 3-6 detail is missing from the old workbooks. The prod code order (decomposition and COD upload before payment) should be checked against the live screens.",
        "Is DeregTransactionExpiredJob enabled in production? The dev config has it commented out, the job inventory says Disabled, yet staging showed expiry after about 50 minutes.",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "bo-precheck-views",
      name: "Back Office: pre-check listing, cancel and special remark",
      summary: "BO staff view eDereg Pre-Checking transactions, cancel them and add a special remark.",
      portals: ["Back Office"],
      triggers: [
        {
          id: "bo-menu",
          name: "BO Transactions Relevant menu",
          entry: "BO home › Transactions Relevant › eDereg Pre-Checking Transaction (/view/dereg/precheck/enquiry/main.do)",
          sources: [FD_BO, MIRO],
          steps: [
            {
              title: "Search for pre-checks",
              where: "BO › eDereg Pre-Checking Transaction",
              detail: "Click Search Now (or Quick Search); the listing shows nothing by default. Filters: Company Name, Vehicle No, Transaction No, Date Created From/To, Company ROC, Payment Date From/To (max 1 month), Trx Status, Payment Status. Export file eDereg-Pre-Checking-{yyyymmddHHmm}.xlsx. Empty message: \"Transaction not found, please create new eDereg Pre-Checking transaction.\"",
              sources: [FD_BO, MIRO],
            },
            {
              title: "Cancel a pre-check",
              where: "BO listing › Action › Cancel",
              detail: "Popup \"Sure to cancel\". Tx Status becomes Cancelled. AATF remark \"CANCELLED BY eAuto on {dd-mm-yyyy HH:mm}\"; BO remark \"CANCELLED BY {bo_user} on {dd-mm-yyyy HH:mm}\". Actions are View | Cancel.",
              sources: [MIRO],
            },
            {
              title: "Update the special remark",
              where: "BO details page › Special Remark › Update Special Remark",
              detail: "Textbox on the BO details page.",
              sources: [MIRO],
            },
          ],
        },
      ],
      affects: [
        { text: "A cancelled pre-check no longer satisfies the Step 2 gate. A user with the transaction open sees \"Transaction Cancelled\".", sources: [FD, J9306] },
      ],
      cronjobs: [],
      roles: [
        { text: "BO account; Hub Admin sees the JPJ XML Log under Settings. Excel export is limited to six named BO accounts.", sources: [FD_BO, MIRO] },
      ],
      afterCompletion: [{ text: "Cancelled / Expired rows stay in both listings.", sources: [MIRO] }],
      rules: [
        { text: "Special Remarks column meaning and BO confirm-before-cancel wording were never fully observed.", sources: [FD_BO], unconfirmed: true },
      ],
      scopeToCheck: [
        { text: "Filters, export, cancel and special remark.", sources: [MIRO] },
        { text: "AATF listing shows the cancel remark and blocks resubmit.", sources: [MIRO] },
      ],
      tickets: [
        { key: "EAINT-9306", date: "2026-09", what: "BO listing and cancel.", state: "latest" },
        { key: "EAINT-12233", date: "2026-09", what: "Message after BO cancels a pre-check. Closed.", state: "latest" },
      ],
      openQuestions: ["BO pre-check details view was never captured.", "Who is on the hardcoded BO user list for the JPJ Reconciliation Summary (eDereg Pre-Checking) report and the pre-check export? Compare with the six named accounts."],
    },
    // ------------------------------------------------------------------
    {
      id: "bo-jpj-xml-log",
      name: "BO JPJ XML Log (Deregistration and eDereg Pre-Checking)",
      summary: "Read-only log of the JPJ requests and answers for deregistration and pre-checks.",
      portals: ["Back Office"],
      triggers: [
        {
          id: "settings-menu",
          name: "BO Settings (Hub Admin) menu",
          entry: "BO home › Settings (Hub Admin) › JPJ XML Log (Deregistration) /view/dereg/jpj/log, or JPJ XML Log (eDereg Pre-Checking) /view/dereg/precheck/jpj/log/main.do",
          sources: [FD_BO, FD_LOG],
          steps: [
            {
              title: "Open the log page and wait about 2 seconds",
              where: "BO › Settings (Hub Admin) › JPJ XML Log",
              detail: "Typing a vehicle no too early once flipped the heading to DEREG on the pre-check log. The fix was not confirmed live.",
              sources: [FD_LOG],
            },
            {
              title: "Choose a search type and search",
              where: "JPJ XML Log › radio Vehicle No. or Transaction Ref No. › SEARCH Now",
              detail: "The radio id #type is duplicated, so target it by value. Search with the human ref (PC68001153, D680000566), not the uuid.",
              sources: [FD_LOG],
            },
            {
              title: "Read the rows",
              where: "JPJ XML Log results (newest first)",
              detail: "Dereg log has 8 columns. Pre-check log has 9 columns including Search By and Type PrecheckEnquiry. Pre-check request is 11 tilde-separated fields; response has 12 fields starting with the response code.",
              sources: [FD_LOG],
            },
          ],
        },
      ],
      affects: [
        { text: "Sibling logs exist for APT, STMS, ESTM, BMK and SSM.", sources: [FD_BO, { kind: "jira", ref: "EAINT-684" }] },
      ],
      cronjobs: [],
      roles: [{ text: "BO Hub Admin (Settings menu).", sources: [FD_BO] }],
      afterCompletion: [{ text: "Read-only. Nothing goes anywhere.", sources: [FD_LOG] }],
      rules: [
        { text: "Dereg log field names, response position 12, and whether the search is AJAX are not confirmed.", sources: [FD_LOG], unconfirmed: true },
      ],
      scopeToCheck: [
        { text: "A row appears per pre-check and per deregistration.", sources: [FD_LOG] },
        { text: "Response code matches the steered eSIM code; request fields match.", sources: [FD_LOG] },
        { text: "The email in the request matches the declared email (Perakuan).", sources: [MIRO] },
      ],
      tickets: [{ key: "EAINT-9306", date: "2026-08", what: "OF_TS5 JPJ XML Log check.", state: "latest" }],
      openQuestions: [],
    },
    // ------------------------------------------------------------------
    {
      id: "mot-listing",
      name: "MOT / JPJ Hasil listing of approved deregistrations (older)",
      summary: "Government accounts see approved deregistrations. From the older Miro flow; date unknown.",
      portals: ["MOT portal", "JPJ Hasil portal"],
      triggers: [
        {
          id: "mot-login",
          name: "MOT account login",
          entry: "MOT account › Deregistration Transaction Listing / for MOT",
          sources: [MIRO],
          steps: [
            {
              title: "Search the MOT listing",
              where: "Deregistration Transaction Listing / for MOT",
              detail: "Only Approved shows. No View action. Filters: Creation Date From/To, AATF, Vehicle No., Transaction No., Category Type (All/Malaysian/MyPR), COD (Yes/No). The AATF dropdown lists only AATF companies with RHB status Active and Company status Active. Export XLSX. Records with IC starting 00 or 01 show 0 in the excel.",
              sources: [MIRO],
            },
          ],
        },
      ],
      affects: [
        { text: "JPJ Hasil account sees \"Laporan Ringkasan Penyamaan Penyata eAuto\" and \"Senarai Transaksi STMS, APT dan ESTM eAuto\" menus.", sources: [MIRO] },
      ],
      cronjobs: [],
      roles: [{ text: "MOT and JPJ Hasil accounts. Accounts jpjdereg and jpjhasil1 exist on staging but have no module docs.", sources: [MIRO, { kind: "azfar", ref: "knowledge/_core/environments.md" }] }],
      afterCompletion: [{ text: "n/a (read only).", sources: [MIRO] }],
      rules: [{ text: "Dereg status other than Approved never shows in the MOT listing.", sources: [MIRO] }],
      scopeToCheck: [{ text: "Only Approved shows; filters and export work.", sources: [MIRO] }],
      tickets: [{ key: "DRG-19", what: "MOT / JPJ Hasil deregistration listing.", state: "legacy" }],
      openQuestions: ["Not known if this old design is still live. Not part of EAINT-9306."],
    },
  ],
};
