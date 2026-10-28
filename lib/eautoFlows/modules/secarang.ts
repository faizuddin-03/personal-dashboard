import type { Module, Source, Step } from "../types";

// Secarang car insurance (public B2C site) + Fiuu payments + MacroKiosk/WhatsApp.
// Faizuddin is "deep" here (insurance, EAINT-12107): his knowledge/ facts are shown.

// ---- Source shorthands -------------------------------------------------------
const FSI: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md" };
const FSI_1: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §1" };
const FSI_2: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §2 entry points", date: "2026-10-19" };
const FSI_4: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §4 DOM handles", date: "2026-10-19" };
const FSI_5: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §5 decision points", date: "2026-10-20" };
const FSI_6: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §6 preconditions" };
const FSI_7_15: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §7 item 15", date: "2026-10-19" };
const FSI_7_16: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §7 item 16", date: "2026-10-20" };
const FSI_7_17: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §7 item 17", date: "2026-10-20" };
const FSI_7_18: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §7 item 18", date: "2026-10-20" };
const FSI_7_19: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §7 item 19", date: "2026-10-20" };
const FSI_8: Source = { kind: "mine", ref: "knowledge/flow-secarang-insurance.md §8 not covered" };
const ASK_S: Source = { kind: "askeauto", ref: "prod code — Secarang car insurance answer (secarang-frontend 80a8786, secarang-eauto-integration 1a5e67e, eauto-cron 3f19842, eauto-notification f15e461, eauto 0e21bef3)", date: "2026-10-23" };
const EP: Source = { kind: "mine", ref: "knowledge/eauto-payments.md §12107", date: "2026-09-11" };
const EP_FPX: Source = { kind: "mine", ref: "knowledge/eauto-payments.md §FPX status codes" };
const CIBO_MD: Source = { kind: "mine", ref: "knowledge/cibo.md §Secarang rules that surface in CIBO" };
const CIBO_BA: Source = { kind: "mine", ref: "knowledge/cibo.md §BA requirement update — 12107 + 12327", date: "2026-10-20" };
const EI: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Before testing — data rules", date: "2026-08-12" };
const EI_NOTIF: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Insurance notifications" };
const FZT: Source = { kind: "mine", ref: "knowledge/flow-zurich-takaful.md §6" };
const NOTIF: Source = { kind: "mine", ref: "knowledge/mailtrap.md + business-rules §6.5 (02b Notifications)" };
const TEAMS_11759: Source = { kind: "teams", ref: "EAINT-11759 chat, Batrisyia", date: "2026-09-14" };
const TEAMS_12107: Source = { kind: "teams", ref: "EAINT-12107 CR chat, Yi Link Lim", date: "2026-10-20" };
const TEAMS_GW: Source = { kind: "teams", ref: "eAuto QAs chat, Charmain via KJ", date: "2026-09-11" };
const J_12107: Source = { kind: "jira", ref: "EAINT-12107", date: "2026-10-20" };
const J_12107_C: Source = { kind: "jira", ref: "EAINT-12107 comments (dev)", date: "2026-09-09" };
const J_8669: Source = { kind: "jira", ref: "EAINT-8669 (+ QA-Issue children)", date: "2026-06-30" };
const J_12218: Source = { kind: "jira", ref: "EAINT-12218", date: "2026-10-05" };
const J_12217: Source = { kind: "jira", ref: "EAINT-12217", date: "2026-10-05" };
const J_12168: Source = { kind: "jira", ref: "EAINT-12168" };
const J_12443: Source = { kind: "jira", ref: "EAINT-12443" };
const J_10444: Source = { kind: "jira", ref: "EAINT-10444", date: "2026-10-23" };
const J_12342: Source = { kind: "jira", ref: "EAINT-12342", date: "2026-10-05" };
const J_12171: Source = { kind: "jira", ref: "EAINT-12171", date: "2026-09-11" };
const MIRO_MKW: Source = { kind: "miro", ref: "uXjVNi7Nu44= (Macro Kiosk - Workflow)" };
const MIRO_MK: Source = { kind: "miro", ref: "uXjVJ5lCjy4= (eAuto - Macrokiosk)" };
const TS_12107: Source = { kind: "ts", ref: "EAINT-12107 12107_TS01-TS10" };
const TS_8331: Source = { kind: "ts", ref: "SC_EAINT-8331/8334/7199 SEC_RECEIPT_TS1-TS7" };
const TS_8786: Source = { kind: "ts", ref: "SC_EAINT-8786 8786_SEC_TS1-TS8" };
const TS_9024: Source = { kind: "ts", ref: "SC_EAINT-9024 TS1-TS2" };
const TS_9062: Source = { kind: "ts", ref: "SC_EAINT-9062 TS1-TS5" };
const TS_8536: Source = { kind: "ts", ref: "EAINT-8536 WA_FAILCN_TS1-TS7" };

// ---- Shared purchase steps ---------------------------------------------------
const stepGate: Step = {
  title: "Pass the staging site gate",
  where: "staging.secarang.com/ia/car-insurance (or /preprod/car-insurance)",
  detail: "Staging only: one password field, no username. Same password on /ia and /preprod. The gate can show again on the Fiuu popup and the success page. Production has no gate and no login.",
  sources: [FSI_2, FSI_4],
};
const stepHome: Step = {
  title: "Type the vehicle and owner on the home form",
  where: "Secarang › Car insurance › Get Quotation",
  detail: "Choose Car, owner type Private (IC) or Company (SSM). Type Vehicle Plate No., Owner IC / Company SSM, Postal Code. Click Get Quotation.",
  sources: [FSI_4, FZT],
  branches: [
    { when: "Plate or ID not found (fake data on /preprod)", then: "'Sorry, we're unable to retrieve your vehicle information.'" },
    { when: "No insurer can quote", then: "'Ops, there is no instant quotation available from our insurers for your car at the moment.'" },
  ],
};
const stepDetails: Step = {
  title: "Confirm vehicle details (not always shown)",
  where: "'Are these your vehicle details?' page",
  detail: "Tick the declaration boxes, pick a variant if a dropdown shows, click Get quotation (it starts disabled while details validate).",
  sources: [FSI_4, FSI_5],
};
const stepCards: Step = {
  title: "Pick an insurer and click Buy",
  where: "All Quotations (insurance cards)",
  detail: "Cards per insurer (e.g. Zurich, Lonpac, Tokio Marine, Allianz). Optional: coverage type, sum insured, change postcode via Edit. Click Buy.",
  sources: [FSI_4, FSI_5],
  branches: [
    { when: "Postcode / variant / sum insured changed", then: "Quotes refresh; insurer order rules still apply." },
  ],
};
const stepAddons: Step = {
  title: "Choose add-ons",
  where: "Add-ons page › ADD / REMOVE › Continue",
  detail: "Zurich pre-ticks 'All Drivers'. A reminder popup may show after add-ons.",
  sources: [FSI_4, FSI_5],
};
const stepConfirm: Step = {
  title: "Fill confirmation details and click Confirm and Pay",
  where: "Confirmation page › Confirm and Pay",
  detail: "Full Name, Email, Mobile (field keeps +60; type without the leading 0), Address 1-3. Optional discount code → Apply. Takaful PDS links shown here too.",
  sources: [FSI_4, TS_8786],
};
const stepMethod: Step = {
  title: "Choose a payment method",
  where: "Select Payment Method (formcontrolname=paymentType)",
  detail: "Tiles on /ia (2026-10-19): Credit or Debit Card | FPX Online banking | SPayLater (ShopeePay logo) | PayLater by Grab (GrabPay logo). The Fiuu gateway opens in a popup window.",
  sources: [FSI_7_15, TS_12107],
};
const stepSuccess: Step = {
  title: "See the success page",
  where: "Main window › 'Thank you for your purchase!'",
  detail: "Receipt No, Purchase Date, Payment Method. 'Receipt' downloads the PDF. Success WhatsApp and email go to the customer.",
  affects: ["CIBO Transaction Management / Payment Management / Payment Report", "Customer WhatsApp + email receipt"],
  sources: [FSI_4, NOTIF],
  branches: [
    { when: "Payment failed", then: "Back on Select Payment Method with 'Unsuccessful payment You may try again.' No receipt; choose another channel." },
    { when: "Customer cancels at the gateway", then: "Popup closes; main window stays on the payment page with the same vehicle and premium." },
  ],
};
const quoteSteps: Step[] = [stepGate, stepHome, stepDetails, stepCards, stepAddons, stepConfirm, stepMethod];

export const secarang: Module = {
  id: "secarang",
  name: "Secarang car insurance (public site)",
  short: "Secarang",
  portals: ["Secarang public site", "Fiuu gateway", "BoldPay (MacroKiosk renewals)", "WhatsApp", "CIBO"],
  summary:
    "Secarang is the public (B2C) insurance site. Anyone types a plate, IC or SSM and postcode, picks an insurer, pays through the Fiuu gateway and gets a receipt. There is no login and no Secarang listing; every transaction is checked in CIBO. Renewals come back through a WhatsApp reminder (MacroKiosk) and pay through BoldPay.",
  related: ["cibo", "insurance"],
  glossary: [
    { term: "Fiuu", meaning: "Payment gateway for Secarang purchases: card, FPX, ShopeePay, GrabPay. Opens in a popup window. Prod code (checked for onboarding payments and eauto core): no transaction cap, maximum-amount check or limit field exists in the Fiuu settings; any cap is enforced on Fiuu's side.", sources: [FSI_1, EP, { kind: "askeauto", ref: "prod code prod/master (2026-10-22) — UCD registration fee and Fiuu cap answer", date: "2026-10-23" }] },
    { term: "BoldPay", meaning: "Payment gateway used by MacroKiosk renewal transactions, not by the normal Secarang site.", sources: [CIBO_MD, J_8669] },
    { term: "SPayLater / PayLater by Grab", meaning: "Buy-now-pay-later tiles. The actual payment is ShopeePay / GrabPay; the instalment plan lives inside Shopee / Grab.", sources: [FSI_7_15, FSI_5] },
    { term: "MacroKiosk (MK / MKWA)", meaning: "WhatsApp messaging provider that sends renewal reminders with Pay Now / Pay Later links. CIBO platform tag 'Secarang-MK'.", sources: [MIRO_MK, J_8669] },
    { term: "Site gate", meaning: "Staging-only password page in front of Secarang. Not a user login.", sources: [FSI_2] },
    { term: "EW", meaning: "Marker inside the Payment Reference ID of a Fiuu e-wallet payment (new data from 2026-09-11).", sources: [EP] },
  ],
  flows: [
    // =========================================================================
    {
      id: "car-insurance-purchase",
      name: "Car insurance purchase (quote → add-ons → confirm → pay)",
      summary:
        "Public customer buys car insurance on Secarang. Steps: gate (staging), home form, vehicle details, quotation cards, add-ons, confirmation, payment method, Fiuu popup, success or failed page.",
      portals: ["Secarang public site", "Fiuu gateway"],
      triggers: [
        {
          id: "car-insurance-page",
          name: "Direct: car insurance page",
          entry: "secarang.com › Car insurance (staging: /ia/car-insurance or /preprod/car-insurance)",
          summary: "The only page any automation opens by URL; every later screen is reached by clicking.",
          sources: [FSI_2, FSI_4],
          steps: [...quoteSteps, { ...stepMethod, title: "Pay in the Fiuu popup (see flow: Fiuu payment channels)", detail: "Card, FPX, GrabPay or ShopeePay. The popup closes itself and the main window moves on.", sources: [FSI_2, FSI_7_15] }, stepSuccess],
        },
        {
          id: "continue-link",
          name: "Emailed quotation-continuation link",
          entry: "Email link → /car-insurance/confirm-car-details/link/:transId (confirm-details-link.component.ts)",
          summary: "A customer who left a quote gets a link by email (sent by the quotation reminder job) and continues from the vehicle-confirmation step.",
          sources: [ASK_S],
          steps: [
            {
              title: "Open the link and confirm the car details",
              where: "Secarang › car-insurance › confirm-car-details › link variant",
              detail: "Then the normal route continues: choose-your-insurance, compare-insurance, choose-addons, confirm-payment, payment-methods.",
              sources: [ASK_S],
            },
          ],
        },
        {
          id: "corporate-site-link",
          name: "eAuto corporate site Motor Insurance page",
          entry: "eauto-corporate-site › our-services › Motor Insurance page › login / launch button",
          summary: "A static page with a button into the insurance flow. The target link was not resolved in the code answer.",
          sources: [ASK_S],
          steps: [
            {
              title: "Click the button on the Motor Insurance page",
              where: "eauto-corporate-site › our-services › Motor Insurance",
              detail: "Leads into the insurance flow. Where the button lands was not resolved in the code answer.",
              sources: [ASK_S],
            },
          ],
        },
        {
          id: "motorcycle-tab",
          name: "Motorcycle tab",
          entry: "secarang.com › Motorcycle insurance (/motorcycle-insurance)",
          summary: "Only the QA checker drives this page (quote availability). Per Zurich SRD v1.2 either tab accepts a car or motorcycle plate.",
          sources: [FSI_2, FZT],
          steps: [
            { ...stepHome, where: "Secarang › Motorcycle insurance › Get Quotation" },
            stepCards,
          ],
        },
      ],
      affects: [
        { text: "Every Secarang transaction lands in CIBO (Transaction Management, Payment Management, Payment Report) with UCD columns shown as '-'.", sources: [FSI_1, CIBO_MD] },
        { text: "Success page and receipt PDF are the only Secarang post-purchase surfaces; Secarang has no listing of its own.", sources: [FSI_1], unconfirmed: true },
        { text: "Customer WhatsApp + email receipt; e-Policy email.", sources: [TS_8331, NOTIF] },
        { text: "secarang-eauto-integration mirrors the transaction, RHB payment and eSTM link records (InsuranceTransaction, RhbPayment, EstmTransaction) so eAuto BackOffice Insurance Account pages (payment and commission reports) and the CIBO screens can show them. No e-Invoice, JPJ submission or SMS step was found in this flow. The quote and purchase engine (Insurance API, /v1/quote, /v1/sub/confirm-purchase) is not in the Secarang repos given to the code reader.", sources: [ASK_S] },
      ],
      cronjobs: [
        { name: "Secarang JPJ Status", schedule: "every 1 min, 08:00-23:00 daily", does: "Polls JPJ status for Secarang insurance transactions.", sources: [J_12171] },
        { name: "InsuranceQuotationReminderJob (eauto-cron)", schedule: "Config key cron.time.insurancequotationreminder; enabled flag cron.task.insurancequotationreminder.enabled = true. The eAuto-side answer gives default 0 0 7-23 * * *; its own test shows every 5 minutes (0 0/5 * * * *).", does: "Sends the quotation reminder email with the continuation link.", sources: [ASK_S], unconfirmed: true },
        { name: "InsuranceDownloadECertificateJob / InsuranceDryRunDownloadECertificateJob (eauto-cron)", schedule: "Config key cron.time.insurancedownloadecert (value hidden)", does: "Downloads the e-certificate / cover note once the insurer confirms the policy.", sources: [ASK_S], unconfirmed: true },
        { name: "MonthlyCommissionJob / MonthlyCommissionStatusReportJob (eauto-cron)", schedule: "Config keys cron.time.monthlycommission and cron.time.monthlycommissionstatusreport (values hidden)", does: "Builds the monthly commission figures shown in BackOffice reports.", sources: [ASK_S], unconfirmed: true },
        { name: "ReconciliationJob / ReconciliationSnapshotStagingJob (eauto-cron)", schedule: "Not stated in the answer", does: "Reconciles the RHB bank statement file against insurance payments (a dedicated INSURANCE mount profile exists).", sources: [ASK_S], unconfirmed: true },
        { name: "Secarang Cover Note", schedule: "every 1 min, 08:00-23:00 daily", does: "Submits / re-checks the cover note after payment.", sources: [J_12171] },
      ],
      roles: [
        { text: "Public customer, no login. Staging adds a site password only.", sources: [FSI_1, FSI_2], alt: [{ text: "The public site is open to guests for quoting. Login (JWT from /v1/a/authenticate, AuthService) is only needed for a my-account / purchase-history area, not to get a quote.", sources: [ASK_S], note: "prod code says" }] },
        { text: "CIBO users view the record afterwards.", sources: [FSI_1] },
      ],
      afterCompletion: [
        { text: "CIBO rows (Paid / Failed). Receipt PDF from the success page and from CIBO Transaction Details.", sources: [FSI_6, TS_8331] },
      ],
      rules: [
        { text: "Secarang shares insurers with eAuto; all insurers share one gateway, so one insurer is enough for a payment-channel test.", sources: [FSI_1, TEAMS_GW] },
        { text: "Secarang tests need real IC and SSM numbers (eAuto uses fake IDs in real format). /ia quotes made-up plates; /preprod refuses them.", sources: [EI, FSI_7_15] },
        { text: "No insurer on Secarang supports company vehicles (TS02 changed to a private car, 2026-10-20).", sources: [FSI] },
        { text: "Discount and Total Amount show on receipt and email only for codes MF / EAUTO / ER; WhatsApp hides them for all codes.", sources: [TS_8331, CIBO_MD] },
        { text: "Lonpac can be bought if the policy expired within 14 days or is within 60 days of expiry; blocked outside that.", sources: [TS_9062, CIBO_MD] },
        { text: "Only Lonpac blocks Labuan postcodes.", sources: [FZT] },
        { text: "Q4 campaign order: Lonpac first, then Tokio Marine; only the top insurer if one is unavailable.", sources: [TS_9024] },
        { text: "Success = same confirmation and policy outcome as existing channels; failed = back to payment page to choose another channel; cancelled = back with the quotation kept.", sources: [FSI_5] },
        { text: "Every sandbox payment still creates a CIBO record; there is no 'stop before payment' switch.", sources: [FSI_6] },
        { text: "Route order in the code: confirm-car-details → choose-your-insurance → compare-insurance → choose-addons → confirm-payment → payment-methods → payment-landing (Razer Merchant Services / Fiuu RMS widget, FPX or hosted card) → payment-redirect → payment-check → payment-success.", sources: [ASK_S] },
        { text: "Statuses (InsuranceStatus, stored as a number): 0 DRAFT 'Quotation'; 1 PENDING 'Pending Payment'; 2 SUCCESS 'Insurance Created'; 3 FAILED 'Failed'; 4 APPROVAL 'Pending Approval' (referred risk); 5 EXPIRED 'Quotation Expired'; 6 NEW 'New'. DRAFT → PENDING when the customer proceeds to pay; PENDING → SUCCESS / FAILED by the FPX / Fiuu callback; DRAFT / PENDING → EXPIRED when the quote ages out; some cases go DRAFT / PENDING → APPROVAL after the insurer risk-referral check.", sources: [ASK_S] },
      ],
      scopeToCheck: [
        { text: "Each payment channel end to end: success, failed, cancelled.", sources: [FSI, TS_12107] },
        { text: "Receipt PDF, email and WhatsApp content per discount-code family.", sources: [TS_8331] },
        { text: "CIBO row for every Secarang payment test (Payment Mode text, Payment Ref ID).", sources: [FSI, CIBO_BA] },
        { text: "Insurer order after variant / postcode / sum insured change and Back.", sources: [TS_9024] },
        { text: "Takaful PDS links on Plan Details, Confirmation and e-Policy email.", sources: [TS_8786] },
        { text: "Not covered: company (SSM) purchase, motorcycle purchase, TPFT, renewal, refund, e-cover note.", sources: [FSI_8] },
      ],
      tickets: [
        { key: "EAINT-12107", date: "2026-10", what: "SPayLater and PayLater by Grab via Fiuu (SRD v1.2 2026-10-20).", state: "latest" },
        { key: "EAINT-8608", date: "2026-05", what: "Zurich Takaful on Secarang (Testing In 1st Env).", state: "latest" },
        { key: "EAINT-12175", date: "2026-10", what: "Lonpac insurer name standardisation (Secarang half live 2026-08-11).", state: "latest" },
        { key: "EAINT-8331", date: "2025-07", what: "Receipt / email / WhatsApp Discount line (with 8334, 7199).", state: "latest" },
        { key: "EAINT-8786", what: "Takaful PDS update on Secarang.", state: "latest" },
        { key: "EAINT-9024", date: "2025-10", what: "Q4 campaign insurer order (Lonpac first).", state: "latest" },
        { key: "EAINT-9062", what: "Lonpac renewal window (14 days expired / 60 days before).", state: "latest" },
      ],
      openQuestions: [
        "Page URLs after /car-insurance never recorded.",
        "Does Secarang show TPFT at all?",
        "The quote, pricing and purchase engine (Insurance API) is not in the repos the code reader saw. Which repo holds it?",
      ],
    },
    // =========================================================================
    {
      id: "fiuu-payment",
      name: "Fiuu payment channels (card, FPX, GrabPay, ShopeePay)",
      summary:
        "The payment step of a Secarang purchase. Each tile opens a Fiuu popup; on staging a sandbox simulator lets QA choose Success or Failed.",
      portals: ["Secarang public site", "Fiuu sandbox", "CIBO"],
      triggers: [
        {
          id: "fpx",
          name: "FPX Online banking",
          entry: "Select Payment Method › FPX Online banking › bank logo",
          sources: [FSI_7_15, FSI_4],
          steps: [
            ...quoteSteps,
            {
              title: "Pick a bank",
              where: "FPX bank grid (desktop grid)",
              detail: "Click the bank logo. The Fiuu FPX simulator opens in a popup.",
              sources: [FSI_4],
            },
            {
              title: "Log in to the simulator and approve",
              where: "Fiuu FPX simulator popup",
              detail: "Log in with the simulator account (not the site password) → Request TAC → set status (select#status_code, 00 = approved) → Enter TAC → Pay now. The popup closes itself.",
              sources: [FSI_7_15, EP_FPX],
              branches: [{ when: "Status other than 00 (51 insufficient, 80 buyer cancel, …)", then: "Payment fails; customer returns to the payment page." }],
            },
            stepSuccess,
          ],
          affects: [{ text: "CIBO Payment Mode should read 'Fiuu | Online Banking – FPX-Bank Name' (SRD 12327 v1.1); live showed bare 'Fiuu' → QA-Issue EAINT-12566.", sources: [CIBO_BA] }],
        },
        {
          id: "card",
          name: "Credit or Debit Card",
          entry: "Select Payment Method › Credit or Debit Card",
          sources: [FSI_7_19],
          steps: [
            ...quoteSteps,
            {
              title: "Enter the test card",
              where: "Fiuu card form popup › Pay MYR x",
              detail: "Use the Fiuu sandbox VISA / Master test card listed in the knowledge file. It opens '3D Secure Authentication'; type the sandbox OTP → PAY.",
              sources: [FSI_7_19],
              branches: [{ when: "Generic 4111… test card", then: "Refused: 'P10: Sorry, Your Credit Card Number or CVV or expiration date is not valid'." }],
            },
            stepSuccess,
          ],
        },
        {
          id: "paylater-by-grab",
          name: "PayLater by Grab (GrabPay)",
          entry: "Select Payment Method › PayLater by Grab tile",
          sources: [FSI_7_15, TS_12107],
          steps: [
            ...quoteSteps,
            {
              title: "Approve in the GrabPay sandbox",
              where: "Fiuu GrabPay sandbox popup › status Success / Failed › Pay",
              detail: "Sandbox replaces the real Grab app approval. CIBO shows Payment Channel 'Fiuu eWallet GrabPay' (accepted).",
              sources: [FSI_7_15, TS_12107],
            },
            stepSuccess,
          ],
          affects: [{ text: "CIBO Payment Mode: 'Fiuu | eWallet – GrabPay – Full Amount – Single Payment' or '… – BNPL – Installment'.", sources: [CIBO_BA] }],
        },
        {
          id: "spaylater",
          name: "SPayLater (ShopeePay)",
          entry: "Select Payment Method › SPayLater tile",
          sources: [FSI_7_17, TS_12107],
          steps: [
            ...quoteSteps,
            {
              title: "Pay through the QR simulator",
              where: "Fiuu popup (QR) › bank-simulator.fiuu.com/shopeepay/spsimulator › Success / Failed › PROCEED TO PAY",
              detail: "The popup shows a QR; its link opens the 'Payment Simulator'. Automation decodes the QR. Sandbox replaces the real Shopee app.",
              sources: [FSI_7_17],
              branches: [{ when: "Cancel the transaction → 'Are you sure?' OK", then: "Popup closes; main window stays on 'How would you like to pay?' with the same premium." }],
            },
            stepSuccess,
          ],
          affects: [{ text: "CIBO shows ShopeePay Full Amount and SPayLater both as 'Fiuu | eWallet – ShopeePay'; the 'ShopeePay - SPayLater' filter was dropped.", sources: [CIBO_BA, TEAMS_12107] }],
        },
      ],
      affects: [
        { text: "CIBO Payment Management 'Fiuu - eWallet' filter group (GrabPay, GrabPay - PayLater by Grab, ShopeePay), Transaction Details payment history, Payment Report.", sources: [CIBO_BA, J_12107_C] },
        { text: "E-wallet Payment Reference ID contains 'EW' (new data only); card and FPX must not.", sources: [EP, CIBO_BA] },
      ],
      cronjobs: [],
      roles: [{ text: "Public customer; Secarang and eAuto onboarding use different Fiuu merchant accounts.", sources: [EP] }],
      afterCompletion: [{ text: "CIBO Transaction Management, Payment Management and Payment Report rows with the Payment Mode string.", sources: [CIBO_BA] }],
      rules: [
        { text: "No amount limit on the e-wallet rails; BNPL tenure is not stored by Secarang.", sources: [FSI_5] },
        { text: "Real-device legs (ShopeePay app, Grab app approval) cannot be tested in the sandbox.", sources: [FSI_5] },
        { text: "Any payment method can be disabled by data patching; dev patched rows to prove the CIBO display of ShopeePay / SPayLater / PayLater.", sources: [J_12107_C, CIBO_BA] },
        {
          text: "ShopeePay and GrabPay both worked live on /ia (2026-10-19/20).",
          sources: [FSI_7_17, FSI_7_15],
          alt: [{ text: "ShopeePay simulator in the Fiuu sandbox does not work; PayLater option cannot be selected.", sources: [J_12107], note: "Shane, Jira 2026-09-07 — superseded for /ia by the 2026-10-20 live run" }],
        },
        { text: "No 'Full Amount' choice on Secarang's payment page (differs from SRD v1.1 REQ-001/002 wording).", sources: [FSI_7_15] },
      ],
      scopeToCheck: [
        { text: "Success, failed and cancelled per e-wallet; card and FPX regression.", sources: [TS_12107, EP] },
        { text: "CIBO filter tick behaviour, export of filtered rows, Payment Mode string on all four surfaces, EW in reference.", sources: [CIBO_BA] },
      ],
      tickets: [
        { key: "EAINT-12107", date: "2026-10", what: "Enable SPAY Later and PayLater by Grab on Secarang (Fiuu).", state: "latest" },
        { key: "EAINT-12327", date: "2026-10", what: "CIBO Payment Mode format (tested with 12107).", state: "latest" },
        { key: "EAINT-12566", date: "2026-10", what: "QA-Issue: Fiuu FPX shows bare 'Fiuu' in CIBO.", state: "latest" },
      ],
      openQuestions: [
        "Fiuu grabpay_indicator values (GPWALLET / POSTPAID / INSTALMENT_4) come from Teams only.",
      ],
    },
    // =========================================================================
    {
      id: "renewal-whatsapp",
      name: "Renewal reminder via WhatsApp (MacroKiosk) → Pay Now / Pay Later",
      summary:
        "A cron finds policies near expiry (from Secarang and eAuto insurance purchases), gets a renewal quote and sends a WhatsApp with Pay Now / Pay Later. Payment goes through BoldPay. Policy and receipt come back by WhatsApp and email.",
      portals: ["WhatsApp (MacroKiosk)", "Secarang", "BoldPay", "CIBO"],
      triggers: [
        {
          id: "renewal-cron",
          name: "Cron at 30 / 14 / 7 days before expiry",
          entry: "Backend renewal cron → 'Renew Insurance' WhatsApp",
          sources: [J_12218, MIRO_MK, MIRO_MKW, J_8669],
          steps: [
            {
              title: "Cron picks the policy",
              where: "Backend cron",
              detail: "Sources: eSTM with insurance, eSTM without insurance, Secarang (9 templates = 3 sources x 3 reminder points). Set A 7 days at 9:00 AM, Set B 14 days at 12:00 PM, Set C 30 days at 9:00 PM.",
              sources: [J_12218],
              branches: [
                { when: "Payment already OK or Failed at the 30-day run", then: "Not picked at 14 / 7 days." },
                { when: "Recipient opted out", then: "Skipped." },
              ],
            },
            {
              title: "Get a renewal quote",
              where: "Insurer API (same insurer first)",
              detail: "Same insurer with same / default add-ons; if not on Secarang or down, the next insurer in sequence (e.g. Allianz / RHB → Lonpac / TMIM).",
              sources: [MIRO_MKW, MIRO_MK],
              branches: [{ when: "No quote / all APIs down / vehicle mismatch / all refer-risk", then: "No WhatsApp sent." }],
            },
            {
              title: "Send the WhatsApp",
              where: "MacroKiosk WhatsApp",
              detail: "Message with the quotation image and Pay Now / Pay Later buttons. Payment link expires 24 hours after sending. Text ends 'Reply OPT-OUT to stop updates.' (refinement).",
              sources: [MIRO_MKW, J_10444],
            },
          ],
        },
        {
          id: "pay-now",
          name: "Pay Now button in the WhatsApp",
          entry: "WhatsApp › Pay Now → Secarang identity check → Confirmation → BoldPay",
          sources: [MIRO_MKW, MIRO_MK],
          steps: [
            {
              title: "Verify identity",
              where: "Secarang › Identity Verification popup",
              detail: "Individual: last 6 digits of IC. Company: last 6 of old BRN, or first / last 6 of new BRN.",
              sources: [MIRO_MK, MIRO_MKW],
              branches: [{ when: "Link older than 24 hours", then: "Quotation Comparison page with 'Payment Link Expired' popup; choose an insurer and continue." }],
            },
            {
              title: "Confirm and pay",
              where: "Details Confirmation › Confirm and Pay → BoldPay",
              detail: "On success status 'Insurance created'; MacroKiosk sends payment status to Secarang.",
              sources: [MIRO_MKW, MIRO_MK],
              branches: [{ when: "Payment failed", then: "User stays on the BoldPay page." }],
            },
            {
              title: "Receive policy messages",
              where: "WhatsApp + email",
              detail: "'Payment Successful with Policy' if the policy is ready; else 'Payment Successful without Policy' then 'Policy Only' when the cover note / JPJ crons succeed.",
              sources: [MIRO_MK, MIRO_MKW],
              branches: [{ when: "JPJ status ends Failed", then: "No further MacroKiosk message." }],
            },
          ],
        },
        {
          id: "pay-later",
          name: "Pay Later / Revise Now",
          entry: "WhatsApp › Pay Later (Revise Now) → identity check → Quotation Comparison",
          sources: [MIRO_MKW],
          steps: [
            {
              title: "Revise the quote",
              where: "Secarang › Quotation Comparison → Add-On → Details Confirmation",
              detail: "After identity check the user can change insurer and add-ons, then pay as in Pay Now.",
              sources: [MIRO_MKW],
              branches: [{ when: "GetQuo API down", then: "Changes not saved; user stays on the same page." }],
            },
          ],
        },
        {
          id: "opt-out",
          name: "Opt-Out",
          entry: "WhatsApp › Opt-Out button (or free-text reply)",
          sources: [J_12217, J_12443],
          steps: [
            {
              title: "Tap Opt-Out",
              where: "WhatsApp message",
              detail: "Opt-out is stored; later runs skip that number (Meta requirement).",
              sources: [J_12217],
            },
            {
              title: "Free-text opt-outs (To Do)",
              where: "CIBO › Macrokiosk - Opt Out Listing (planned)",
              detail: "INS PO team uploads the Boldpass report and ticks numbers to mark them opted out. Until then opt-outs are patched manually.",
              sources: [J_12443],
            },
          ],
        },
      ],
      affects: [
        { text: "CIBO: platform tag 'Secarang-MK', Payment Management eWallet filter, Referred Risk Log, Macrokiosk Template Management.", sources: [J_8669, J_12218] },
        { text: "BoldPay Payment Mode strings in CIBO: 'BoldPay | eWallet – TouchNGo', 'BoldPay | Online Banking – FPX-Bank Name', 'BoldPay | Credit/Debit Card – MBBMGATE_MS'.", sources: [CIBO_BA] },
      ],
      cronjobs: [
        { name: "MK renewal reminder", schedule: "9:00 AM Set A (7 d), 12:00 PM Set B (14 d), 9:00 PM Set C (30 d)", does: "Sends one template set per run.", sources: [J_12218] },
        { name: "Cover note / JPJ status retry", schedule: "Secarang every 1 min, 08:00-23:00", does: "Retries after payment; on success sends 'Policy Only'.", sources: [J_12171, MIRO_MK] },
        { name: "EstmRenewalSnapshotJob (eauto-cron)", schedule: "30 / 14 / 7-day road-tax renewal reminder windows (cron value not stated)", does: "Related to, but not only about, insurance. The only renewal-window job the code reader found.", sources: [ASK_S], unconfirmed: true },
      ],
      roles: [
        { text: "Vehicle owner (individual or company) via WhatsApp; data comes from Secarang and eAuto insurance purchases.", sources: [MIRO_MK, MIRO_MKW] },
        { text: "INS PO team manages opt-out listing (planned).", sources: [J_12443] },
      ],
      afterCompletion: [
        { text: "Secarang transaction 'Insurance created'; policy / cover note by WhatsApp and email; CIBO row as Secarang-MK.", sources: [MIRO_MK, J_8669] },
      ],
      rules: [
        { text: "Payment link expires 24 hours after the message.", sources: [MIRO_MKW] },
        { text: "The renewal WhatsApp is sent through MacroKiosk (CIBO platform tag Secarang-MK).", sources: [MIRO_MK, J_8669], alt: [{ text: "No match for 'macrokiosk' in eauto, eauto-notification, secarang-frontend, secarang-backend, secarang-eauto-integration or cibo-frontend. WhatsApp in eauto-notification goes through MessageBird (MessageBirdWhatsAppService) and is used for other message types; no WhatsApp step tied to purchase completion was confirmed.", sources: [ASK_S], note: "prod code says" }] },
        { text: "Next cron picks the policy again if the user did nothing or clicked Pay Now without paying.", sources: [MIRO_MK] },
        { text: "Template content was revised to remove promotional words after Meta paused it.", sources: [J_12168] },
        {
          text: "Run times fixed per set: 9:00 / 12:00 / 21:00.",
          sources: [J_12218],
          alt: [{ text: "Cron sends up to 3 WhatsApp per day at 30 / 14 / 7 day triggers.", sources: [J_8669], note: "EAINT-8669 / 11722 — refined by EAINT-12218" }],
        },
      ],
      scopeToCheck: [
        { text: "Pickup at 30 / 14 / 7 days; no pickup after payment; opt-out skip; no message when no quote.", sources: [MIRO_MK, J_12218] },
        { text: "Pay Now, expired link, Pay Later revise, identity check for individual and company.", sources: [MIRO_MK] },
        { text: "Message variant with / without policy; sender numbers.", sources: [MIRO_MK] },
      ],
      tickets: [
        { key: "EAINT-12218", date: "2026-10", what: "9 templates, run times per set.", state: "latest" },
        { key: "EAINT-8669", date: "2026-06", what: "MacroKiosk Pay Now / Pay Later / success messaging (prod 2026-06-30).", state: "legacy", supersededBy: "EAINT-12218" },
        { key: "EAINT-9064", date: "2026-06", what: "Success message for Secarang-created transactions.", state: "latest" },
        { key: "EAINT-12217", date: "2026-10", what: "Opt-Out button.", state: "latest" },
        { key: "EAINT-12168", date: "2026-08", what: "Template wording revised after Meta pause.", state: "latest" },
        { key: "EAINT-12443", date: "2026-10", what: "CIBO Macrokiosk Opt Out Listing (To Do).", state: "latest" },
        { key: "EAINT-12527", date: "2026-10", what: "Template by insured ethnicity (To Do).", state: "latest" },
        { key: "EAINT-10444", date: "2026-10", what: "eSTM renewal templates get Secarang 'Get a Quote' banner (refinement).", state: "latest" },
        { key: "EAINT-12077", what: "Remove Undelivered leads from reminders (To Do).", state: "latest" },
      ],
      openQuestions: [
        "Miro tables (Transaction Cronjob, Pay Now behaviour, error handling) not read.",
        "Where is the MacroKiosk / BoldPay renewal code? The prod code reader found neither name in the eight repos it could read.",
      ],
    },
    // =========================================================================
    {
      id: "post-purchase-messages",
      name: "Post-purchase messages and alerts",
      summary: "Who gets WhatsApp / email after a Secarang payment, and the internal alerts when the cover note or JPJ fails.",
      portals: ["WhatsApp (MessageBird / MacroKiosk)", "Email"],
      triggers: [
        {
          id: "payment-success",
          name: "Payment success",
          entry: "Secarang success page (any channel)",
          sources: [EI_NOTIF, TEAMS_11759],
          steps: [
            {
              title: "Customer receives receipt messages",
              where: "Customer WhatsApp + email",
              detail: "Payment success goes to the user only. Receipt PDF; Discount line rules per code.",
              sources: [EI_NOTIF, TEAMS_11759, TS_8331],
            },
          ],
        },
        {
          id: "cover-note-or-jpj-fail",
          name: "Cover note failed / JPJ rejected",
          entry: "Paid transaction; cover note or JPJ fails (staging prefix VB / VF)",
          sources: [TS_8536, TEAMS_11759, J_12342],
          steps: [
            {
              title: "Internal alert",
              where: "Internal WhatsApp",
              detail: "Cover note failed and JPJ rejected go to one internal recipient only (after EAINT-11759 / 12342).",
              sources: [TEAMS_11759, J_12342, TS_8536],
            },
          ],
        },
      ],
      affects: [{ text: "Secarang support MessageBird number retained (EAINT-11759).", sources: [TEAMS_11759] }],
      cronjobs: [],
      roles: [],
      afterCompletion: [],
      rules: [
        { text: "Email part of the MacroKiosk 'Payment Successful' message removed; eAuto insurance WhatsApp needs a separate ticket.", sources: [NOTIF, TEAMS_11759] },
      ],
      scopeToCheck: [{ text: "Recipient list per message type; Secarang vs eAuto origin.", sources: [J_12342, TS_8536] }],
      tickets: [
        { key: "EAINT-11759", date: "2026-10", what: "Retain Secarang support MessageBird; recipients per message.", state: "latest" },
        { key: "EAINT-12342", date: "2026-10", what: "Alert recipients per SRD 9117.", state: "latest" },
        { key: "EAINT-8536", what: "WhatsApp alert for failed cover note (Secarang and eAuto).", state: "latest" },
      ],
    },
    // =========================================================================
    {
      id: "plate-checker",
      name: "Secarang plate / SSM checker (QA tool)",
      summary: "Dashboard tool that checks many plates for quote availability. Buys nothing.",
      portals: ["QA dashboard", "Secarang public site"],
      triggers: [
        {
          id: "excel-drop",
          name: "Excel drop on the dashboard",
          entry: "Dashboard /eauto/secarang-plate-checker (API app/api/secarang/check)",
          sources: [FSI_7_16],
          steps: [
            {
              title: "Upload the vehicle list",
              where: "Dashboard › Secarang plate checker",
              detail: "Excel with columns 'Vehicle' and 'Company ROC' (header within the first 10 rows). Every row is checked as a company car.",
              sources: [FSI_7_16],
            },
            {
              title: "Checker runs each row",
              where: "Secarang home form → details → quotation (20 tabs at once)",
              detail: "Reports Proceed (cards) or the error shown. About 20 rows in 2 minutes. Re-checks a row up to 3 times on the 'Kindly confirm your navigation' popup.",
              sources: [FSI_7_16],
            },
          ],
        },
      ],
      affects: [{ text: "Nothing in Secarang or CIBO; output file only.", sources: [FSI_7_16] }],
      cronjobs: [],
      roles: [{ text: "QA only.", sources: [FSI_7_16] }],
      afterCompletion: [{ text: "Results written to output-results.xlsx.", sources: [FSI_6] }],
      rules: [],
      scopeToCheck: [],
      tickets: [],
    },
  ],
};
