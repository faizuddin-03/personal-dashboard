import type { Module, Source, Step } from "../types";

// eAuto Motor Insurance (UCD). Faizuddin is "deep" here (09-taxonomy.md):
// his knowledge/ facts are the shown text; Azfar / Miro versions that differ go in alt.

// ---- Source shorthands -------------------------------------------------------
const FIP: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md" };
const FIP_ENTRY: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Entry points", date: "2026-08-19" };
const FIP_MAIN: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Insurance main page", date: "2026-08-14" };
const FIP_BANNER: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Banner entry", date: "2026-08-19" };
const FIP_FORM: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Get Free Quote form", date: "2026-08-14" };
const FIP_S1: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Step 1", date: "2026-08-14" };
const FIP_S2: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Step 2", date: "2026-08-14" };
const FIP_S3: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Step 3", date: "2026-08-14" };
const FIP_PAY: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Paying is a click", date: "2026-08-18" };
const FIP_RESUME: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Resuming an unpaid quotation", date: "2026-08-18" };
const FIP_LIST: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Listing filters and the status vocabulary", date: "2026-08-18" };
const FIP_EXPIRE: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Quotations expire after ~24 hours" };
const FIP_PRICE: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Pricing rules" };
const FIP_XPAGE: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Cross-page verification" };
const FIP_NOTCOV: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §What is NOT covered" };
const FIP_TRAPS: Source = { kind: "mine", ref: "knowledge/flow-insurance-purchase.md §Traps" };
const EI: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md" };
const EI_STEP3: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §The quotation is generated at STEP 3", date: "2026-08-17" };
const EI_ESTM: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §An eSTM is required to PURCHASE", date: "2026-08-14" };
const EI_SEQ: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Quote sequence" };
const EI_TPFT: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Car — when TPFT appears" };
const EI_HAK: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Car — Hak Milik gate" };
const EI_RANGE: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Sum-insured price range" };
const EI_CRON: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Insurance cron jobs and simulating failures" };
const EI_NOTIF: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Insurance notifications" };
const EI_DISC: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §Quotation reminder email — Discount, not Commission", date: "2026-08-13" };
const EI_NOUPD: Source = { kind: "mine", ref: "knowledge/eauto-insurance.md §The insurance transaction has no update action", date: "2026-08-13" };
const FQR: Source = { kind: "mine", ref: "knowledge/flow-quotation-reminder.md" };
const FQR_RULE: Source = { kind: "mine", ref: "knowledge/flow-quotation-reminder.md §2 business rule", date: "2026-08-13" };
const FQR_ENTRY: Source = { kind: "mine", ref: "knowledge/flow-quotation-reminder.md §3 entry points", date: "2026-08-19" };
const FQR_LINK: Source = { kind: "mine", ref: "knowledge/flow-quotation-reminder.md §11 email-link cases" };
const FQR_STATUS: Source = { kind: "mine", ref: "knowledge/flow-quotation-reminder.md §12 status", date: "2026-08-13" };
const FE_69E: Source = { kind: "mine", ref: "knowledge/flow-estm.md §TS06 where the e-simulator call goes", date: "2026-08-18" };
const FE_HAND: Source = { kind: "mine", ref: "knowledge/flow-estm.md §eSTM -> insurance handoff", date: "2026-08-13" };
const MEM_69E: Source = { kind: "mine", ref: "memory estm-69e-redirect-after-full-completion", date: "2026-08-18" };
const DECISION_69E: Source = { kind: "mine", ref: "Faizuddin decision in chat", date: "2026-10-23" };
const MEM_STEP3: Source = { kind: "mine", ref: "memory insurance-listing-needs-step-3 / insurance-step3-row-is-pending-not-draft", date: "2026-08-18" };
const HTML_69E: Source = { kind: "mine", ref: "_reference/html/eauto/insurance-step1-after-69e-redirect.html", date: "2026-08-18" };
const FEIE: Source = { kind: "mine", ref: "knowledge/flow-eauto-insurance-enquiry.md" };
const FZT: Source = { kind: "mine", ref: "knowledge/flow-zurich-takaful.md" };
const FZT_4A: Source = { kind: "mine", ref: "knowledge/flow-zurich-takaful.md §4a", date: "2026-10-22" };
const FZT_4B: Source = { kind: "mine", ref: "knowledge/flow-zurich-takaful.md §4b", date: "2026-10-22" };
const FZT_5: Source = { kind: "mine", ref: "knowledge/flow-zurich-takaful.md §5", date: "2026-10-22" };
const BR7: Source = { kind: "mine", ref: "knowledge/business-rules-from-test-scenarios.md §7 popups" };
const MAILTRAP: Source = { kind: "mine", ref: "knowledge/mailtrap.md" };
const AZ_UCD: Source = { kind: "azfar", ref: "knowledge/portals/ucd/portal.md#Insurance" };
const AZ_ESTM_END: Source = { kind: "azfar", ref: "knowledge/portals/ucd/portal.md#eSerahan — where the flow ends" };
const AZ_FLOW: Source = { kind: "azfar", ref: "automation/src/flows/insurance.flow.ts" };
const AZ_BO: Source = { kind: "azfar", ref: "knowledge/portals/backoffice/portal.md#The 11 menu groups" };
const AZ_ENV: Source = { kind: "azfar", ref: "knowledge/_core/environments.md#Real API or eSim" };
const AZ_EXPIRE: Source = { kind: "azfar", ref: "knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires" };
const AZ_12253: Source = { kind: "azfar", ref: "cr/EAINT-12253 (knowledge/portals/ucd/portal.md)" };
const ASK_Q6: Source = { kind: "askeauto", ref: "Q6 eSTM / eSerahan (prod code 0e21bef3)", date: "2026-10-23" };
const ASK_Q2: Source = { kind: "askeauto", ref: "Q2 UCD login, homepage and popups (prod code)", date: "2026-10-23" };
const ASK_TRIG: Source = { kind: "askeauto", ref: "prod code prod/master (2026-10-22 core and cron, 2026-10-09 notifications) — trigger points into eAuto motor insurance answer", date: "2026-10-23" };
const ASK_INS: Source = { kind: "askeauto", ref: "prod code 0e21bef3 (eauto) + eauto-cron prod/master — eAuto motor insurance purchase answer", date: "2026-10-23" };
const MIRO_Z: Source = { kind: "miro", ref: "uXjVGih1g4s= (eAuto & Secarang - Zurich)" };
const J_11864: Source = { kind: "jira", ref: "EAINT-11864", date: "2026-07-22" };
const J_12199: Source = { kind: "jira", ref: "EAINT-12199 / EAINT-12213 (11864 QA-Issues)" };
const J_12171: Source = { kind: "jira", ref: "EAINT-12171", date: "2026-09-11" };
const TEAMS_12171: Source = { kind: "teams", ref: "EAINT-12171 chat, Charmain Ea Chiang", date: "2026-09-02" };
const TEAMS_CRON_OFF: Source = { kind: "teams", ref: "eAuto & Secarang Main Group, Goh Kai Jiaeh", date: "2026-08-01" };
const J_12342: Source = { kind: "jira", ref: "EAINT-12342", date: "2026-10-05" };
const J_11878: Source = { kind: "jira", ref: "EAINT-11878", date: "2026-08-07" };
const J_12424: Source = { kind: "jira", ref: "EAINT-12424" };
const J_12148: Source = { kind: "jira", ref: "EAINT-12148" };
const J_12253: Source = { kind: "jira", ref: "EAINT-12253", date: "2026-10-21" };
const TS_11864: Source = { kind: "ts", ref: "EAINT-11864 11864_TS01-TS13" };
const TS_11864_LINK: Source = { kind: "ts", ref: "EAINT-11864 11864_TS08-TS12" };
const TS_9214: Source = { kind: "ts", ref: "EAINT-9214 UCD_9214_TAKINS_TS1-TS7" };
const TS_10044: Source = { kind: "ts", ref: "EAINT-10044 10044_INS_TS01-TS19" };
const TS_10435: Source = { kind: "ts", ref: "EAINT-10435 10435_INS_TS1-TS5" };
const TS_6673: Source = { kind: "ts", ref: "EAINT-6673 INS_RECEIPT_TS1-TS5" };
const TS_8467: Source = { kind: "ts", ref: "EAINT-8467 INSSEQ_GFQ_*" };
const TS_8595: Source = { kind: "ts", ref: "EAINT-8595 8595_TS1-TS15" };
const TS_9023: Source = { kind: "ts", ref: "EAINT-9023 9023_EAUTO_TS1-TS8" };
const TS_9564: Source = { kind: "ts", ref: "EAINT-9564 EAINT9564_TS1-TS11" };
const TS_9713: Source = { kind: "ts", ref: "EAINT-9713 TKF_TS1-TS7, GFQ_TS1-TS12" };
const TS_11977: Source = { kind: "ts", ref: "EAINT-11977 11977_TS1-TS7" };
const TS_9141: Source = { kind: "ts", ref: "EAINT-9141 9141_E2E_TS1-TS7" };
const TS_9611: Source = { kind: "ts", ref: "EAINT-9611 9611_PRICE_E2E_TS1, DATE_E2E_TS1" };
const TS_9617: Source = { kind: "ts", ref: "EAINT-9617 TS1.1-TS1.5" };
const TS_9641: Source = { kind: "ts", ref: "EAINT-9641 9641_E2E_TS1-TS4" };
const TS_9215: Source = { kind: "ts", ref: "EAINT-9215 9215_INS_TS01-13" };
const TS_8786: Source = { kind: "ts", ref: "EAINT-8786 UCD sheet" };
const TS_11540: Source = { kind: "ts", ref: "EAINT-11540 11540_TS_01-13" };
const TS_9044: Source = { kind: "ts", ref: "EAINT-9044 INS_TS1-TS3" };
const TS_9615: Source = { kind: "ts", ref: "EAINT-9615 9610_TS01-TS04" };
const TS_9103: Source = { kind: "ts", ref: "EAINT-9103 9103_E2E_TS01+" };
const TS_10082: Source = { kind: "ts", ref: "EAINT-10082 10082_TS1-TS13" };
const TS_11867: Source = { kind: "ts", ref: "EAINT-11867 11867_TS01-TS14" };
const TS_8536: Source = { kind: "ts", ref: "EAINT-8536 WA_FAILCN_TS1-TS7" };
const TS_8564: Source = { kind: "ts", ref: "EAINT-8564 8564_TS1-TS8 / EAINT-8637 TS1-TS4" };
const TS_11784: Source = { kind: "ts", ref: "EAINT-11784 11784_TS01-TS17 / EAINT-11925 TS1-TS15" };
const TS_9559: Source = { kind: "ts", ref: "EAINT-9559 / 9564 popup display" };
const TS_8534: Source = { kind: "ts", ref: "EAINT-8534 8534WEB_TS7-TS8" };

// ---- Shared purchase steps (Step 1 onward) -------------------------------------
const stepQuotes: Step = {
  title: "Pick an insurer on Step 1 (Quotes)",
  where: "UCD › Insurance › Step 1 Quotes (/view/ucd/insurance/plan/view.do)",
  detail:
    "Vehicle summary at the top (Transfer NCD, postcode, Apply Changes). One card per insurer the API (eSIM on staging) quoted. Change the sum insured from the card dropdown if needed (the cards re-load). Click SELECT on a card. Bottom of page shows 'Quotation retrieved on' time and a disclaimer.",
  affects: ["BO Insurance Quote Enquiry Listing (quote logged)"],
  sources: [FIP_S1, TS_8467, AZ_FLOW],
  branches: [
    { when: "Transmission / variant not set", then: "SELECT is blocked: 'Please select transmission and variant (series) and click Apply Changes'." },
    { when: "A TPFT card is chosen", then: "TPFT consent dialog shows first; confirm to go on." },
    { when: "No card shows", then: "No insurer quoted this vehicle. Try another vehicle number." },
    { when: "Postcode / variant changed and Apply Changes clicked", then: "Quotes refresh; insurer order stays the same." },
  ],
};
const stepCoverage: Step = {
  title: "Add optional coverage on Step 2",
  where: "UCD › Insurance › Step 2 Optional Coverage (/ajax/ucd/insurance/plan/select.do?transactionId=…)",
  detail:
    "Tick optional coverage (Windscreen, Special Perils, Legal Liability to Passengers, Negligent Acts, SRCC etc.; list differs per insurer) and the MPA tab. The quotation panel shows Basic Premium, NCD, Gross Premium, Service Tax, Stamp Duty, Total Premium. Click Make Payment (#confirm-plan). Nothing is saved yet.",
  sources: [FIP_S2, AZ_UCD],
  branches: [
    { when: "No approved eSTM exists for this vehicle and IC", then: "Step 2 shows only '< Back'. The quote cannot be bought (quote only)." },
  ],
};
const stepPayment: Step = {
  title: "Fill payment details on Step 3",
  where: "UCD › Insurance › Step 3 Payment (payment.do)",
  detail:
    "Reference No is shown (e.g. B68004339). Type Mobile, Email, Address 1-3. Hire Purchase Loan is optional and any bank works the same. The transaction row is first saved HERE, status PENDING 'Pending Payment'. Browser Back is blocked; use the page's Back button.",
  affects: ["UCD Insurance Transaction Listing (row appears as Pending Payment)", "Quotation reminder email (if left unpaid)"],
  sources: [FIP_S3, EI_STEP3, MEM_STEP3],
  branches: [
    { when: "User leaves without paying", then: "Row stays Pending Payment and can be resumed with Resubmit. After 24 hours it becomes Quotation Expired." },
    { when: "Chubb, Company category", then: "TIN No is mandatory ('This field is required'); cannot pay without it." },
  ],
};
const stepPayNow: Step = {
  title: "Click Pay Now",
  where: "Step 3 › Pay Now (a#to-pay > button.payBtn)",
  detail:
    "Payment is a simple click: RHB direct debit with a confirmation popup ('Please ensure that there is sufficient fund in your RHB account.'). No gateway, no bank login, no TAC, no QR. The real insurer API can take about 40 seconds.",
  affects: ["RHB direct debit"],
  sources: [FIP_PAY, FZT_4B, MIRO_Z],
  branches: [
    { when: "Insurer price changed since the quote", then: "Popup 'Price has changed. Click OK to reload and view the updated pricing'. OK reloads with the new price." },
    { when: "RHB payment fails (eSIM RHB code IF on staging)", then: "Step 4 shows 'Error Code - {rhb_error_code} - {rhb_error_description}' with [Try Again] (back to Step 3) or [Save & Continue Later] (to the listing)." },
    { when: "Payment never reaches Step 4 within ~75 s", then: "NCD / underwriting referral loop for that vehicle. Try another vehicle number." },
  ],
};
const stepConfirm: Step = {
  title: "See the result on Step 4 (Confirm)",
  where: "UCD › Insurance › Step 4 Confirm (complete.do)",
  detail:
    "'Thank you! Your payment has been successfully made. Your insurance is now created.' with E-certificate No, Payment Date and Amount. Status becomes SUCCESS 'Insurance Created'. Done opens the insurance details page (from an eSTM entry it goes back to the eSTM details page).",
  affects: ["UCD + BO Insurance Transaction Listing", "CIBO Transaction Management", "Service Portal Insurance tab", "e-Certificate / Receipt PDF"],
  sources: [FIP_NOTCOV, FZT_4B, MIRO_Z, AZ_FLOW],
  branches: [
    { when: "Firefox below 37 (EAINT-12253, testing)", then: "Browser Reminder popup shows on Step 4 after a successful payment (from an eSTM chain, only here)." },
  ],
};
stepConfirm.sources.push(J_12253, AZ_12253);
const stepRecord: Step = {
  title: "Check the record",
  where: "UCD › Insurance › Transaction Listing (/view/ucd/insurance/enquiry) › View",
  detail:
    "Click Search first (nothing shows before it). Row shows Insurance Created and the E-Certificate No. Details page shows policy, insured, vehicle, cover and total. Status and JPJ column can take a few refreshes on staging.",
  affects: ["BO Insurance Transaction Listing + CSV", "CIBO", "Service Portal Insurance tab"],
  sources: [FIP_LIST, FIP_XPAGE],
};
const fromStep1: Step[] = [stepQuotes, stepCoverage, stepPayment, stepPayNow, stepConfirm, stepRecord];

export const insurance: Module = {
  id: "insurance",
  name: "eAuto Motor Insurance (UCD)",
  short: "Insurance",
  portals: ["UCD portal", "BackOffice", "Insurance Dashboard", "Service Portal", "CIBO"],
  summary:
    "A used-car dealer (UCD) gets motor insurance quotes from several insurers and buys one for a vehicle. There are six ways in: Get a Free Quote from the Insurance tile, the redirect after an eSTM, the banner on an eSTM details page, the 69E redirect, Resubmit from the listing, and the reminder email link. Quoting needs only a vehicle number and IC; buying needs an approved eSTM. A bought policy shows in UCD, BO, CIBO and the Service Portal.",
  related: ["estm", "secarang", "cibo", "ucd-portal"],
  glossary: [
    { term: "Get a Free Quote", meaning: "Tile on the Insurance main page. Opens a form for vehicle number and IC / company number, then the insurer cards.", sources: [FIP_MAIN, AZ_UCD] },
    { term: "69E (VEL000069E)", meaning: "eSTM JPJ answer: the vehicle can renew road tax but has no valid motor insurance. The system redirects the user to buy insurance.", sources: [HTML_69E, FQR_ENTRY] },
    { term: "FI flow / Non-FI flow", meaning: "FI = the 69E path with an active Hire Purchase record (all insurers, HP loan, no 10% discount). Non-FI = normal eSTM path (top two insurers, 10% discount).", sources: [FZT_4A, MIRO_Z] },
    { term: "Control sequence (top 2)", meaning: "Fixed insurer order; the quote page shows only the top 2 available insurers. Order changes with campaigns; take it from the newest CR.", sources: [EI_SEQ, TS_8467, TS_9713] },
    { term: "TPFT", meaning: "Third Party, Fire and Theft cover. Shown only in some cases (vehicle age, no comprehensive quote, low sum insured).", sources: [EI_TPFT] },
    { term: "Hak Milik gate", meaning: "From an eSTM with isHakMilik = true, the TPFT card is hidden. Reason not recorded.", sources: [EI_HAK, FIP_BANNER] },
    { term: "Pending Payment", meaning: "Status of a quote that reached Step 3 but was not paid. Can be resumed with Resubmit.", sources: [FIP_RESUME, MEM_STEP3] },
    { term: "Quotation Expired", meaning: "A quote is valid 24 hours to the minute, then flips to this status with 'EXPIRED on dd/mm/yyyy hh:mm' in Remarks.", sources: [FIP_EXPIRE] },
    { term: "e-Certificate", meaning: "Policy / cover note number from the insurer, shown on Step 4, listing and details.", sources: [FIP_LIST] },
    { term: "Pemaju Eksklusif / Bintang Prospek", meaning: "The two agencies that issue eAuto insurance (Issued By on the receipt). Pemaju is the Zurich and Lonpac distributor.", sources: [TS_6673, FZT, TS_10435] },
    { term: "eSIM", meaning: "Staging simulator that returns insurer quotes, JPJ codes and RHB results by vehicle-number prefix.", sources: [AZ_ENV, EI] },
  ],
  flows: [
    // =========================================================================
    {
      id: "purchase",
      name: "Insurance purchase (quote → optional coverage → payment → confirm)",
      summary:
        "The main UCD journey. Pick an insurer on Step 1, add coverage on Step 2, fill details on Step 3, pay on Step 3, see the result on Step 4. Six trigger points lead into it; they differ in what they skip and which insurers show.",
      portals: ["UCD portal"],
      triggers: [
        {
          id: "get-free-quote",
          name: "Direct: Insurance tile → Get a Free Quote",
          entry: "UCD › Home › Insurance tile (#insurance) › Get a Free Quote (#freeQuote)",
          summary: "Standalone quote. Anyone with insurance access can quote; buying needs an approved eSTM for the same vehicle and IC.",
          sources: [FIP_ENTRY, FIP_MAIN, AZ_UCD, MIRO_Z],
          steps: [
            {
              title: "Open the Insurance module",
              where: "UCD › Home › Insurance tile (#insurance) → 'Motor Insurance or Takaful' page",
              detail: "Tiles: Insurance or Takaful Transaction Listing, Get a Free Quote, Report, Update Insurance or Takaful Permission, Endorsement (pilot, not always shown). Campaign popups may show here too; close them first.",
              sources: [FIP_MAIN, AZ_UCD, TS_9215],
              branches: [
                { when: "Company has no Insurance permission", then: "Module hidden from Home and top panel; direct URL gives access denied." },
                { when: "Non-director clicks Update Permission", then: "'You are not allowed to use the module.'" },
              ],
            },
            {
              title: "Click Get a Free Quote",
              where: "Insurance main › #freeQuote → /view/ucd/insurance/quote/quote.do",
              detail: "The tile runs a transaction-restriction check before opening the form. Go through the tile, not the URL.",
              sources: [FIP_MAIN, TS_9044],
              branches: [
                { when: "BO set Transaction Restriction = Yes on the company", then: "Notice popup: restricted from creating transactions, contact eAuto at 03-27798899." },
              ],
            },
            {
              title: "Fill the quote form and click Show My Result",
              where: "Get Free Quote form (form#tx-form) › Show My Result (#to-show-result)",
              detail: "Vehicle Category Individual (default) or Company. Vehicle Number. IC Number (12 digits) or Company Reg. No. All fields mandatory. Start Over clears the form.",
              sources: [FIP_FORM, TS_11540, MIRO_Z],
              branches: [
                { when: "IC empty / under 12 digits / bad date", then: "'This field is required' / 'IC number should be made up of 12 numerical characters' / 'Invalid IC Number'." },
                { when: "Vehicle cannot be resolved", then: "'Unable to retrieve your vehicle information'." },
              ],
            },
            ...fromStep1,
          ],
          affects: [
            { text: "Purchase leg only works when an approved eSTM exists for the same vehicle and the same buyer IC.", sources: [EI_ESTM, FIP], alt: [{ text: "Free quote only goes past Step 2 when an eSTM exists for the same buyer name + IC, is that eSTM's own vehicle, AND is paid. An eSTM saved only to Step 4 is not enough.", sources: [AZ_UCD], note: "Azfar, 20-21.10.2026 — stricter wording, same rule" }] },
          ],
        },
        {
          id: "estm-direct",
          name: "Direct after eSTM (eLKM unticked)",
          entry: "UCD › eSERAHAN › create eSTM › Step 5 Payment (eLKM unticked) › Done → Insurance Step 1",
          summary: "Finishing an eSTM without eLKM sends the user straight to the insurer cards in the same session. No quote form.",
          sources: [FIP_ENTRY, FQR_ENTRY, AZ_ESTM_END, MIRO_Z, TS_9214],
          steps: [
            {
              title: "Create the eSTM to Step 5",
              where: "UCD › eSERAHAN › Create (see eSTM module)",
              detail: "Buyer MyKad, vehicle, dealer MyKad, JPJ check, Make Payment. Each run needs a fresh vehicle number.",
              affects: ["eSTM module"],
              sources: [FIP_BANNER, FE_HAND],
            },
            {
              title: "Untick eLKM and submit the payment",
              where: "eSTM Step 5 Payment › eLKM checkbox › Make Payment",
              detail: "Unticking eLKM only re-calculates the fee. Then confirm 'Sure to make this payment now?' (OK) and the other popups, and finish to Done. The eSTM becomes Approved.",
              sources: [FE_HAND, MEM_69E, FQR_ENTRY],
              branches: [
                { when: "eLKM stays ticked", then: "No redirect. Flow ends on eSTM Step 6 (estm-sub.do)." },
              ],
            },
            {
              title: "Land on Insurance Step 1",
              where: "/view/ucd/insurance/plan/view.do?transactionId=…&isDirectEstmFirstTime=true&isFirstTime=true",
              detail: "The redirect fires after the eSTM fully finishes, never on the eLKM toggle. Insurance uses its own transaction id. Only the top two insurers by the control sequence show; 10% Gross Premium discount applies (Non-FI).",
              sources: [FQR_ENTRY, AZ_ESTM_END, MIRO_Z, FZT_4A],
            },
            ...fromStep1,
          ],
          affects: [
            { text: "Insurance is a prerequisite to buying eLKM; on success eSTM may redirect into insurance 'if applicable'.", sources: [ASK_Q6] },
          ],
        },
        {
          id: "estm-banner",
          name: "Banner on eSTM details page (GET FREE QUOTE FOR <plate>)",
          entry: "UCD › eSERAHAN › Transaction Listing › approved row › details › GET FREE QUOTE FOR <plate>",
          summary: "Buy insurance later for an approved eSTM. Lands on Step 1 and skips the quote form. Not the campaign banner on Home.",
          sources: [FIP_BANNER, FQR_ENTRY, TS_6673, MIRO_Z],
          steps: [
            {
              title: "Open the eSTM details page",
              where: "UCD › eSERAHAN › Transaction Listing (/view/ucd/estm/enquiry/main.do) › Search › row › View (view.do?id=<uuid>)",
              detail: "Type the vehicle number and click Search (#to-search); nothing shows before it. The details URL uses ?id=, not ?transactionId=.",
              sources: [FIP_BANNER],
            },
            {
              title: "Click the buy-insurance banner",
              where: "eSTM details › GET FREE QUOTE FOR <plate> (#to-buy-insurance) → dialog #buy-insurance-dialog › YES (#toProceed)",
              detail: "Calls processQuoteFromEstm.do with the eSTM transaction id. The quote is built server-side from the eSTM's vehicle and owner.",
              sources: [FIP_BANNER, FE_HAND],
            },
            {
              title: "Land on Insurance Step 1",
              where: "Insurance Step 1 (body#insurancePlan)",
              detail: "No form. A missing TPFT card can be the Hak Milik gate, not a defect.",
              sources: [FIP_BANNER, EI_HAK],
            },
            ...fromStep1,
          ],
        },
        {
          id: "nav-and-shortcut",
          name: "UCD top navigation INSURANCE link and home shortcut",
          entry: "UCD › top navigation INSURANCE link (x-header.jsp), or home dashboard button to-buy-insurance (home.jsp)",
          summary: "Two more ways in found in the prod code. The top link shows only if the user has inventory-management or insurance permission. The home shortcut opens the quote page directly.",
          sources: [ASK_INS],
          steps: [
            {
              title: "Open Insurance from the top link or the shortcut",
              where: "UCD › INSURANCE link → /view/ucd/insurance (landing); home button to-buy-insurance → /view/ucd/insurance/quote/view.do",
              detail: "The landing page's Get a Free Quote button goes to /view/ucd/insurance/quote/quote.do after a transaction-restriction check (main.jsp). The first-time Insurance Commercial Agreement popup must be accepted by a director first.",
              sources: [ASK_INS],
            },
          ],
        },
        {
          id: "69e-redirect",
          name: "69E redirect (JPJ: no valid insurance)",
          entry: "eSTM JPJ enquiry answers VEL000069E → Insurance Step 1 with 'Skip, Return to eSerahan'",
          summary: "The system sends the user to buy insurance because the vehicle has no valid motor insurance. Not a hard force: the user may skip back to eSerahan.",
          sources: [FIP_ENTRY, FE_69E, MEM_69E, HTML_69E, FZT_4A],
          steps: [
            {
              title: "Make the eSTM JPJ enquiry return 69E",
              where: "eSTM Step 4 JPJ Check (staging: eSIM › eSTM Enquiry Response Code = VEL000069E for the vehicle prefix)",
              detail: "On staging set the code right after the JPJ result lands on Step 4, before clicking Make Payment. FI flow also needs an Active Hire Purchase record (create it in the Service Portal).",
              sources: [FE_69E, MEM_69E, FZT_4A, MIRO_Z],
            },
            {
              title: "Finish the eSTM payment as normal",
              where: "eSTM Step 5 Payment › untick eLKM › submit › Done",
              detail: "Nothing differs from a normal eSTM. The redirect comes after the payment step fully finishes.",
              sources: [FE_69E, MEM_69E],
            },
            {
              title: "Land on Insurance Step 1 with the 69E message",
              where: "Insurance Step 1 › div.action-row › 'Skip, Return to eSerahan' (#estmBackBtn)",
              detail: "Text: 'The vehicle is eligible for road tax renewal, but no valid motor insurance found. The system has redirected you to purchase insurance. You may skip and return back to eSerahan.' Only insurers that quoted show. FI flow: HP Loan, no 10% discount; Chubb TIN not shown.",
              sources: [HTML_69E, FQR_ENTRY, FZT_4A, TS_9641],
              branches: [
                { when: "User clicks Skip, Return to eSerahan", then: "Goes back to the eSTM without buying." },
                { when: "Insurance bought and eSIM switched back to GLB000000I", then: "'Continue with eSerahan' (#estmLkmDoneBtn) returns to the eSTM to finish (Azfar: Step 6; Miro: Step 5 for eLKM)." },
              ],
            },
            ...fromStep1,
          ],
          affects: [
            {
              text: "eSTM is diverted at Step 4 → 5 when Make Payment is pressed; the payment screen is never reached (URL …&showBuyerNames=true&estmTransactionId=…). Not triggered by the eLKM untick.",
              sources: [AZ_ESTM_END, AZ_FLOW, DECISION_69E],
              alt: [
                { text: "Redirect fires after the eSTM payment step fully completes (payment submitted, Done), not on the eLKM untick.", sources: [MEM_69E, FE_69E], note: "Faizuddin's earlier wording — same behaviour, less detail (confirmed 2026-10-23)" },
                { text: "eSTM Step 4 → 5 JPJ enquiry fails with 69E → Insurance Step 1; after purchase [Continue with eSerahan] → eSTM Step 5.", sources: [MIRO_Z, TS_8534], note: "Zurich board / EAINT-8534 TS (return to Step 5 for eLKM)" },
                { text: "When the road-tax (LKM) JPJ enquiry returns VEL000069E on the eSTM add-on screen or payment screen, a Get Insurance Quote action calls /api/ucd/insurance/quote/process-quote.do. That opens an insurance transaction tagged as coming from the LKM error and redirects into the quote flow. The code points to the add-on / payment screens (estm-addon.jsp, payment.jsp, EstmPaymentController), not to the end of the eSTM. The code answer does not state whether this happens before or after the payment click.", sources: [ASK_INS, ASK_Q6], note: "prod code says" },
                { text: "Prod code, second check: when the eSTM JPJ check returns the \"no valid insurance record\" code (69E, constant ESTM_LKM_RESPONSE_NO_INSURANCE), both the eSTM add-on screen and the eSTM payment screen fire the get-a-quote call (getInsuranceQuote). If it succeeds, the dealer is redirected into the insurance quote screen for a new insurance case linked to the vehicle. If it fails, the dealer is sent back to the payment screen, in some cases with an extra flag that hides the LKM option. Still does not say whether this is before or after the payment click.", sources: [ASK_TRIG], note: "prod code says" },
              ],
            },
            { text: "No quotation reminder email is sent for a quote that started from 69E.", sources: [TS_11864, FQR_RULE] },
          ],
        },
        {
          id: "resubmit",
          name: "Resubmit from the Insurance Transaction Listing",
          entry: "UCD › Insurance › Transaction Listing › Pending Payment row › Resubmit (a.to-payment)",
          summary: "Resume an unpaid quote. Goes straight to Step 3.",
          sources: [FIP_RESUME, FZT_4A, TS_6673, AZ_UCD],
          steps: [
            {
              title: "Find the unpaid row",
              where: "UCD › Insurance › Transaction Listing (/view/ucd/insurance/enquiry) › Search",
              detail: "Filter Status = Pending Payment. The row can take a moment to commit after Step 3; search again if missing.",
              sources: [FIP_RESUME, FIP_LIST],
            },
            {
              title: "Click Resubmit",
              where: "Action column › Resubmit (a.to-payment[data=<uuid>])",
              detail: "Opens Step 3 Payment directly.",
              sources: [FIP_RESUME],
              branches: [
                { when: "Transaction Restriction = Yes", then: "Resubmit is blocked by the restriction popup." },
                { when: "Quote older than 24 hours", then: "Row is Quotation Expired, not resumable." },
              ],
            },
            stepPayNow,
            stepConfirm,
            stepRecord,
          ],
        },
        {
          id: "reminder-email-link",
          name: "Quotation reminder email → Complete Purchase Now",
          entry: "Email from imonitor@eauto.my › 'Complete Purchase Now' button",
          summary: "The hourly reminder email links back to the quote. Not automated; no capture of the email exists.",
          sources: [FQR_LINK, TS_11864_LINK, J_11864],
          steps: [
            {
              title: "Receive the reminder email",
              where: "UCD's registered email (staging: Mailtrap)",
              detail: "Sent by the hourly cron for a quote left unpaid (see flow: Quotation reminder email). Shows Vehicle Number and Discount Amount.",
              sources: [FQR_RULE, EI_DISC],
            },
            {
              title: "Click Complete Purchase Now",
              where: "Email › Complete Purchase Now",
              detail: "Logged in: a new page opens insurance Step 1. Not logged in: login page first, then Step 1.",
              sources: [FQR_LINK, TS_11864_LINK],
              branches: [
                { when: "Logged in as a UCD of another company", then: "Redirected to the homepage; quote not in their listing." },
                { when: "Sub UCD of the same company clicks the Main UCD's email", then: "Step 1 opens; purchase completes." },
                { when: "BackOffice user", then: "Should not go to the main page (named in the team sheet, never written up)." },
                { when: "On staging", then: "Link points to the prod environment (existing behaviour)." },
              ],
            },
            ...fromStep1,
          ],
        },
      ],
      affects: [
        { text: "UCD Insurance Transaction Listing + Details; BO Insurance Transaction Listing + Details + CSV; CIBO Transaction Management; Service Portal Insurance tab; e-Certificate and Receipt PDF; JPJ column; reminder email if left unpaid.", sources: [FIP_XPAGE, FQR] },
        { text: "BO Insurance menu pages: Permission Listing, User Permission Log, Endorsement, Transaction Listing, Payment Transaction, Upload e-Certificate, Quote Enquiry, Refer Risk Log, Payment OTP Log.", sources: [AZ_BO, MIRO_Z] },
        { text: "BO Reconciliation (Insurance type), e-Invoice listing, UCD Payment Report.", sources: [AZ_BO] },
        { text: "Reads the linked eSTM transaction (buyer identity, usage code, approval state) to decide eligibility, and special-cases transactions under an active hire-purchase record. A hire-purchase lien found by the eSTM Hak Milik check also changes quote limits.", sources: [ASK_INS, { kind: "askeauto", ref: "prod code 0e21bef3 — Transfer History and Hak Milik answer", date: "2026-10-23" }] },
        { text: "UCD listing 'Insurance or Takaful Transaction Listing' and the insurance reports: CP58, monthly, payment report.", sources: [ASK_INS] },
        { text: "eSTM Transaction Details shows an Insurance Receipt button after an eSTM-route purchase.", sources: [TS_6673] },
        { text: "Service Portal Ownership Claim Listing tags the insurance to the same eSTM row (one row per vehicle); ZIP export includes insurance docs.", sources: [TS_9103] },
      ],
      cronjobs: [
        { name: "eAuto Cover Note", schedule: "every 5 min, 08:00-23:00 daily", does: "Submits / re-checks the cover note with the insurer after payment.", sources: [J_12171, TEAMS_12171, EI_CRON] },
        { name: "eAuto JPJ Status", schedule: "every 1 min, 08:00-23:00 daily", does: "Polls JPJ status for insurance transactions (fills the JPJ column).", sources: [J_12171, TEAMS_12171, EI_CRON] },
        { name: "Insurance JPJ enquiry / resubmit cover note / resubmit refer-case", schedule: "OFF on staging branches", does: "Ask dev to switch them on per branch before testing post-payment status.", sources: [TEAMS_CRON_OFF, EI_CRON] },
        { name: "InsuranceQuotationExpiredJob (quotation expiry)", schedule: "Prod schedule is in a withheld config file. Observed: 24 hours after creation, to the minute.", does: "Sets status EXPIRED on quotations whose createdAt is more than 1 day old (InsuranceQuotationExpiredHandlerBean).", sources: [ASK_INS, FIP_EXPIRE, TS_9141], unconfirmed: true },
        { name: "InsuranceDownloadECertificateJob / InsuranceEnquiryJpjStatusJob / InsuranceResubmitCoverNoteJob / InsuranceResubmitReferredCaseJob / InsuranceDeleteExpiredQuoteImageJob", schedule: "Disabled in the dev scheduler; prod schedule withheld", does: "Documented insurance jobs: download e-certificate, enquire JPJ status, resubmit cover note, resubmit referred case, delete expired quote images. Live cron expressions not confirmed.", sources: [ASK_INS], unconfirmed: true },
      ],
      roles: [
        { text: "Main UCD, or Sub UCD with Insurance permission. Company needs the Insurance module permission (BO › Manage Company); default ticked for companies since EAINT-9233.", sources: [FZT_4B, MIRO_Z, AZ_UCD] },
        { text: "Insurance Commercial Agreement must be accepted by a director (Update Permission → tick terms → I Accept).", sources: [FIP_MAIN] },
        { text: "Code gate: the company's insurance permission flag AND the logged-in user's own insurance permission. Not available to AATF, Service Portal or public users for this journey.", sources: [ASK_INS] },
        { text: "The insurance back office (fulfilment, endorsement, admin) is a separate login under Bintang Prospek branding with 4 roles: Dashboard, Account, Operation, Admin. It is not reachable from UCD roles.", sources: [ASK_INS] },
        { text: "Only two actor events: create and pay. 'Last updated by' = the payer (Sub UCD may create, Main UCD pay).", sources: [EI_NOUPD] },
        { text: "East Coast UCDs (HQ or branch in Pahang, Terengganu, Kelantan) get their own insurer sequence.", sources: [EI_SEQ, TS_9564, FZT] },
      ],
      afterCompletion: [
        { text: "UCD listing status 'Insurance Created' with E-Certificate No; BO listing; CIBO listing and details; Service Portal Insurance tab.", sources: [FIP_XPAGE] },
        { text: "From an eSTM entry, Done returns to the eSTM details page; 'Save & Continue Later' on failure goes to the eSTM listing.", sources: [MIRO_Z] },
        { text: "Policy copy is emailed by the insurer to the entered email, not to Mailtrap.", sources: [MIRO_Z, MAILTRAP] },
        { text: "On success an e-certificate is produced and a Takaful e-certificate email is queued through RabbitMQ to the notification service. No JPJ submission is part of this flow itself.", sources: [ASK_INS] },
        { text: "e-Invoice: the code shows a RabbitMQ trigger for insurance cancellation (INSURANCE_CANCELLATION) but no equally clear trigger for the original purchase. Not confirmed either way.", sources: [ASK_INS], unconfirmed: true },
        { text: "A failed transaction is not shown in the listing.", sources: [TS_9141], unconfirmed: true },
      ],
      rules: [
        { text: "Insurance can be reached by five trigger points in prod code: direct tile or top INSURANCE tab (works; no insurance permission sends the user back to the homepage with an access error), Get Free Quote button (works), 69E redirect after eSTM (works), quotation reminder email link (works; built by the eauto-cron reminder job, sent by the notification service), and an insurance banner popup (exists in code but is not wired up, see Popups and banners).", sources: [ASK_TRIG] },
        { text: "Home dashboard button to-buy-insurance opens the quote page directly (/view/ucd/insurance/quote/view.do).", sources: [ASK_INS],
          alt: [{ text: "Prod code, second check: the home page has a leftover click-handler for a \"buy insurance\" button, but no visible button on the page matches it. Not something a user can click today (unfinished or removed feature).", sources: [ASK_TRIG], note: "prod code says" }] },
        { text: "The landing page has two links, \"Free Quote\" and \"Get Free Quote\", that do the same thing: go to the quote-creation screen after a transaction-restriction check. Prod code gives an example of the check as blocking a dealer who has too many open quotes in progress.", sources: [ASK_TRIG], unconfirmed: true },
        { text: "Quoting needs only vehicle no + IC. Purchasing needs an approved eSTM for that vehicle and IC.", sources: [EI_ESTM, FIP] },
        { text: "Statuses (InsuranceStatus): NEW 'New' → DRAFT 'Quotation' (Save & Continue Later) → PENDING 'Pending Payment' (plan confirmed) or APPROVAL 'Pending Approval' (referred case) → SUCCESS 'Insurance Created' (paid, e-certificate issued) or FAILED 'Failed'. EXPIRED 'Quotation Expired' is set by the expiry job on unpurchased NEW / DRAFT / PENDING quotes past the age cut-off.", sources: [ASK_INS] },
        { text: "insurance-banner-modal.jsp exists but no page uses it (dead code). The only live insurance popup on the UCD home is a generic promo image (insEastCoast.jsp), not a quote entry point.", sources: [ASK_INS] },
        { text: "Nothing is saved before Step 3. Stopping at Step 1 or 2 leaves no listing row at any status.", sources: [EI_STEP3, MEM_STEP3] },
        { text: "Step-3 row is PENDING 'Pending Payment', not DRAFT 'Quotation'. No path to DRAFT has been seen.", sources: [FIP_LIST, MEM_STEP3] },
        { text: "Listing statuses: DRAFT Quotation, PENDING Pending Payment, SUCCESS Insurance Created, FAILED Failed, APPROVAL Pending Approval, EXPIRED Quotation Expired. Company filter: RHB, Takaful, Chubb, Lonpac, TokioMarine.", sources: [FIP_LIST] },
        { text: "Quote valid 24 hours to the minute, then 'Quotation Expired' with 'EXPIRED on dd/mm/yyyy hh:mm'.", sources: [FIP_EXPIRE] },
        { text: "A purchase consumes the vehicle number; a fresh one is needed per run.", sources: [FIP] },
        {
          text: "Pricing: Gross = Contribution after NCD + add-ons; Service Tax 8% of Gross; Total = Gross + Tax + Stamp Duty (RM10); Total Nett = Total - 10% of Gross (Non-FI only); Step 4 amount = Step 3 Total Nett.",
          sources: [FIP_PRICE],
          alt: [{ text: "Service Tax = Gross Contribution x 6%.", sources: [MIRO_Z, FZT_4B], note: "Zurich board wording" }],
        },
        { text: "Quote sequence: only the top 2 available insurers show; Takaful Comprehensive + TPFT count as one insurer; BO Quote Enquiry shows all insurers. Order changes every few months — take it from the newest CR.", sources: [EI_SEQ, TS_9713, TS_9214] },
        { text: "Latest sequence (EAINT-11977, Jul 2026): Tokio Marine (car) always hidden; Tokio Marine bike allowed (usage AA, body MSL); East Coast HQ with only Takaful: Takaful Comp then TPFT; X-Star HP + 69E: Chubb, Takaful Comp, Takaful TPFT, Lonpac.", sources: [TS_11977] },
        { text: "Zurich sequence planned (not yet deployed): Chubb → Zurich Comp → Zurich TPFT → STM Comp → STM TPFT → Lonpac → Tokio Marine; East Coast Zurich first.", sources: [FZT, MIRO_Z], unconfirmed: true },
        { text: "Company category quotes Chubb and Takaful only. Islamic hire purchase triggers the Islamic sequence.", sources: [EI_SEQ, TS_8595] },
        { text: "TPFT shows: vehicle > 20 years; or ≤ 20 years when all comprehensive quotes failed; or ≤ 20 years with comprehensive OK and sum insured ≤ RM20,000 (new transaction only). Hidden from an eSTM with isHakMilik = true.", sources: [EI_TPFT, EI_HAK, TS_11977] },
        { text: "Car products: Comprehensive (max 5,000cc, up to 30 years, SI RM10,000-1,000,000) and TPFT (max 3,100cc ICE/Hybrid). TPO declined. Motorcycle: Comprehensive only, All Riders pre-ticked.", sources: [EI] },
        { text: "Sum insured (Chubb): not below 90% and not above 140% of recommended (170% with X-Star HP ≤ 15 years); recommended < RM10,000 → no Chubb quote; RM80,000 cap on Get Free Quote for non-X-Star HP. Lonpac: ceiling 150%, minimum rounded up to nearest 1,000.", sources: [EI_RANGE, TS_10044, TS_10435] },
        { text: "Price and policy start re-fetched before payment; Period of Insurance starts on the payment date.", sources: [TS_9611] },
        { text: "Chubb TIN No: mandatory for company after eSTM approval, optional on Get Free Quote, not shown on the 69E path.", sources: [EI, TS_9641] },
        { text: "Hire Purchase Loan is optional; the bank chosen has no downstream effect. Details show 'Hire Purchase: (User Submission)' and '(Returned by JPJ)'.", sources: [FIP_S3, TS_9617] },
        { text: "Receipt (EAINT-6673): new transactions have [Receipt] → Receipt_<VehicleNo>.pdf, receipt no OR-{MMYY}-{0001}; old ones keep [Insurance Invoice].", sources: [TS_6673, EI] },
        { text: "Campaign banner on UCD Home is NOT an entry point; it is a marketing overlay that blocks clicks.", sources: [FIP_ENTRY, FQR_ENTRY] },
        { text: "Staging insurance runs on eSIM (simulated premiums); real API vs eSIM is switched per instance by dev only.", sources: [AZ_ENV] },
        { text: "Insurance Pending Payment rows survive overnight on staging.", sources: [AZ_EXPIRE] },
        { text: "Planned: Chubb Address Line 1 under 3 characters gets 'NO.' in front (sent to Chubb only).", sources: [J_12424], unconfirmed: true },
        { text: "Today a duplicate-record error from JPJ / insurer (Chubb VEL000199E, Lonpac DUPLICATE DATA SENT) is refunded by hand; automation of popup, email and remark is To Do.", sources: [J_12148] },
      ],
      scopeToCheck: [
        { text: "Each trigger point: Get a Free Quote (with and without approved eSTM), eSTM direct, eSTM banner, 69E, Resubmit, email link.", sources: [FIP_XPAGE, TS_8467, TS_9023] },
        { text: "Same sum insured and premium on Step 4, UCD listing, BO listing, BO CSV, CIBO listing and Service Portal Insurance tab.", sources: [FIP_XPAGE, TS_10044] },
        { text: "Insurer order per availability mix x Individual/Company x East/West Coast x X-Star / Islamic HP; order stays after Back and postcode change.", sources: [TS_8595, TS_9564, TS_9713, TS_11977] },
        { text: "Per insurer: Chubb, Takaful Comp/TPFT, Lonpac, Tokio Marine (car/bike), Zurich when live.", sources: [TS_9141, TS_6673] },
        { text: "Main UCD vs Sub UCD; new vs pre-CR (existing) transactions; every listing status.", sources: [TS_9141, TS_10044] },
        { text: "Step 3 leaves a Pending Payment row; Resubmit works; price-changed popup; 1-day-later payment date.", sources: [FIP_RESUME, TS_9611] },
        { text: "Receipt / e-Cert on UCD, BO, eSTM details; CIBO details.", sources: [TS_6673] },
        { text: "Transaction Restriction blocks Get a Free Quote and Resubmit.", sources: [TS_9044] },
        { text: "Not covered by any automation: renewal, cancel, refund, failed-payment paths, Step 4 / details HTML.", sources: [FIP_NOTCOV] },
      ],
      tickets: [
        { key: "EAINT-11977", date: "2026-07", what: "Control sequence amended July 2026; Tokio Marine (car) hidden.", state: "latest" },
        { key: "EAINT-12020", date: "2026-08", what: "Usage code AA enabled for motorcycle (Tokio Marine).", state: "latest" },
        { key: "EAINT-9713", date: "2026-01", what: "Free-quote top insurers; Takaful Comp + TPFT counted as one.", state: "legacy", supersededBy: "EAINT-11977" },
        { key: "EAINT-9564", date: "2026-01", what: "East Coast sequence V1 (top 4 / top 2 counts).", state: "legacy", supersededBy: "EAINT-9713" },
        { key: "EAINT-9214", what: "Takaful Comprehensive/TPFT unhidden, new priority order.", state: "legacy", supersededBy: "EAINT-9713" },
        { key: "EAINT-9023", date: "2025-10", what: "Lonpac Q4 campaign sequence.", state: "legacy", supersededBy: "EAINT-9214" },
        { key: "EAINT-8595", date: "2025-08", what: "Sequence by Islamic hire purchase.", state: "legacy", supersededBy: "EAINT-9023" },
        { key: "EAINT-8467", what: "Base control sequence, top 2, timestamp and disclaimer.", state: "legacy", supersededBy: "EAINT-8595" },
        { key: "EAINT-10044", what: "Chubb sum-insured range broadened (140% / 170% X-Star).", state: "latest" },
        { key: "EAINT-10435", what: "Lonpac sum-insured range (Pemaju Eksklusif).", state: "latest" },
        { key: "EAINT-9611", date: "2026-02", what: "Price and policy date re-fetched before payment.", state: "latest" },
        { key: "EAINT-9617", date: "2026-02", what: "Hire purchase list (Tokio Marine credit companies).", state: "latest" },
        { key: "EAINT-9641", what: "Chubb TIN No (e-Cover API V1.7).", state: "latest" },
        { key: "EAINT-9215", what: "Takaful wording, PDS and Certificate Wording links.", state: "latest" },
        { key: "EAINT-8786", what: "Latest Takaful PDS (EN/BM).", state: "latest" },
        { key: "EAINT-9141", what: "Chubb plan 'MY Car Plus (Pro)' (file OUTDATED).", state: "legacy" },
        { key: "EAINT-6673", date: "2025-04", what: "Insurance Invoice → Official Receipt.", state: "latest" },
        { key: "EAINT-11540", what: "Get a Free Quote IC 12-digit validation.", state: "latest" },
        { key: "EAINT-9044", what: "Transaction Restriction blocks Get a Free Quote and Resubmit.", state: "latest" },
        { key: "EAINT-12253", date: "2026-10", what: "Firefox Browser Reminder at Insurance Step 4 (Testing In 1st Env).", state: "latest" },
        { key: "EAINT-12424", date: "2026-10", what: "Chubb Address Line 1 under 3 chars gets 'NO.' prefix (gathering).", state: "latest" },
        { key: "EAINT-12148", date: "2026-10", what: "Duplicate-record JPJ/insurer errors: popup, email, auto remark (To Do).", state: "latest" },
        { key: "EAINT-12097", what: "Chubb UBO capture + CTOS/B360 (To Do).", state: "latest" },
        { key: "EAINT-12175", date: "2026-10", what: "Insurer name corrected to Lonpac Insurance Bhd + SDPA link (Done 2026-10-05).", state: "latest" },
        { key: "EAINT-12022", date: "2026-10", what: "Insurance Cancellation add-on on STMS Step 5 (separate product, see stms-addons).", state: "latest" },
      ],
      openQuestions: [
        "Is the insurance banner popup meant to be revived? Prod code shows it is not wired up (showInsuranceBanner is read but unused).",
        "Can a DRAFT 'Quotation' row ever be produced? Only PENDING has been seen. Prod code says Save & Continue Later on the quote form sets DRAFT (InsuranceTransactionController).",
        "Does the insurance purchase itself send an e-Invoice? Only the cancellation trigger was found in code.",
        "Why is TPFT hidden behind the Hak Milik gate?",
        "Step 4 and the details page HTML are not captured.",
        "Real-API behaviour on staging is unknown; most runs use eSIM.",
      ],
    },
    // =========================================================================
    {
      id: "quotation-reminder",
      name: "Quotation reminder email (EAINT-11864)",
      summary:
        "When a UCD gets a quote but does not buy, an hourly cron emails that UCD a reminder with a 'Complete Purchase Now' button. Only for vehicles with an approved eSTM. Sent once per quote.",
      portals: ["UCD portal", "Email (Mailtrap on staging)"],
      triggers: [
        {
          id: "quote-left-unpaid",
          name: "Quote left unpaid (any entry except 69E)",
          entry: "Get a Free Quote / eSTM direct / eSTM banner → stop at Step 1, 2 or 3 → next hourly cron run",
          summary: "A backend drop-off detector picks up the quote even when no listing row exists (Step 1/2 stops).",
          sources: [FQR_RULE, FQR_ENTRY, TS_11864, J_11864],
          steps: [
            {
              title: "Create an approved eSTM for the vehicle",
              where: "UCD › eSERAHAN (see eSTM module)",
              detail: "Without an approved eSTM no email is sent. The quote must use the eSTM buyer's IC.",
              sources: [FQR_RULE, FIP, J_12199],
              branches: [{ when: "No approved eSTM (or eSTM Failed)", then: "No email after the cron runs." }],
            },
            {
              title: "Generate a quote and stop before paying",
              where: "Insurance › Get a Free Quote / eSTM redirect / eSTM banner → Step 1, 2 or 3",
              detail: "The cron keys on the minute Show My Result was clicked. Only Step 3 leaves a listing row (Pending Payment).",
              sources: [FQR_ENTRY, EI_STEP3],
              branches: [
                { when: "Entry was the 69E redirect", then: "No email (reason not recorded)." },
                { when: "Insurance bought before the next cron run", then: "No email." },
              ],
            },
            {
              title: "Wait for the next hourly run",
              where: "Backend cron (07:00-23:00)",
              detail: "A 10:59 quote is emailed at 11:00. Between 23:00 and 07:00 nothing is sent; the 07:00 run delivers. On staging the team runs it every 10 minutes for testing.",
              sources: [FQR_RULE, TS_11864],
            },
            {
              title: "Check the email",
              where: "Mailtrap inbox (staging) — read in the signed-in Chrome profile",
              detail: "Sender imonitor@eauto.my. To the UCD who made the quote. Body: Vehicle Number, Discount Amount (from the quote), 'Complete Purchase Now' button. Exactly one email per quote.",
              sources: [FQR_RULE, EI_DISC, MAILTRAP],
              branches: [{ when: "A second cron run passes", then: "No second email." }],
            },
          ],
        },
      ],
      affects: [
        { text: "Email to the UCD; link leads back into the purchase flow (Step 1).", sources: [FQR_LINK, TS_11864_LINK] },
        { text: "After a purchase via the link: UCD listing, BO listing and CIBO must agree.", sources: [FQR_LINK] },
      ],
      cronjobs: [
        { name: "Quotation reminder", schedule: "hourly, 07:00-23:00 daily (team test cadence every 10 min)", does: "Emails the UCD for each quote generated without purchase, once per quote, approved eSTM required.", sources: [FQR_RULE, TS_11864] },
        { name: "InsuranceQuotationReminderJob (in eauto-cron, not eauto)", schedule: "Config key cron.time.insurancequotationreminder, default 0 0 7-23 * * * (hourly 7am-11pm); can be overridden by env EAUTO_REMINDER_CRON", does: "Sends the 'Complete Your Insurance Purchase' reminder email once per quotation for quotes in status NEW / PENDING / DRAFT. EAUTO_REMINDER_ENABLED default true, dry-run default false. The email is built and sent by eauto-notification (template insurance_quotation_reminder). A Secarang-side answer says its own test shows every 5 minutes (0 0/5 * * * *). Second prod-code check: the job picks quotes that were started but not completed (new quote generated, plan picked but unpaid, saved for later) that are older than a configurable minimum age and inside a configurable lookback window. For each it works out who to email, builds a link back to that exact quotation on the quote screen and publishes a reminder message. The email is titled \"Complete Your Insurance Purchase\". If the base-URL setting is not configured the job refuses to send live and skips the whole run rather than send a dead link. Default is off in the scheduler service (documented as disabled until setup steps are signed off).", sources: [ASK_INS, ASK_TRIG] },
      ],
      roles: [
        { text: "Main UCD and Sub UCD of the quoting company. If emails differ, the right user must get it; recipient for a Sub-UCD quote is unconfirmed.", sources: [FQR_RULE], unconfirmed: true },
        { text: "UCD of another company following the link is sent to the homepage and does not see the quote.", sources: [FQR_LINK] },
      ],
      afterCompletion: [
        { text: "Email in Mailtrap (staging) / UCD mailbox. Clicking it continues to the insurance purchase.", sources: [FQR_RULE] },
      ],
      rules: [
        {
          text: "Email shows Discount Amount (SRD wording 'Commission' is out of date).",
          sources: [EI_DISC],
          alt: [{ text: "Email includes Vehicle No, Commission Amount and 'Complete Purchase Now' (SRD V1.1 2026-07-22).", sources: [J_11864], note: "SRD never revised per QA team 2026-08-13" }],
        },
        { text: "Sender is imonitor@eauto.my (team script typo imonitor@auto.my).", sources: [FQR_RULE] },
        { text: "No email for quotes created before go-live.", sources: [TS_11864] },
        { text: "Dev adds a new column at deployment (~30 min).", sources: [FQR_RULE] },
      ],
      scopeToCheck: [
        { text: "All entry points x insurer x stop step (1/2/3) x Main/Sub UCD.", sources: [TS_11864] },
        { text: "Dead window: quote at 23:30 arrives at 07:00 (quote still valid, 24-hour expiry).", sources: [FQR_RULE, FIP_EXPIRE] },
        { text: "Second run sends nothing; bought before pickup → no email; no approved eSTM → no email; 69E → no email.", sources: [TS_11864] },
        { text: "Email body vs Figma; link logged in / not logged in / other company / BO user.", sources: [FQR_LINK] },
      ],
      tickets: [
        { key: "EAINT-11864", date: "2026-07", what: "Hourly reminder email for generated quotation without purchase. Automation paused 2026-08-13.", state: "latest" },
        { key: "EAINT-12199", what: "QA-Issue under 11864 (Step-3 quote without payment).", state: "latest" },
        { key: "EAINT-12213", what: "QA-Issue: no email for vehicles without valid eSTM.", state: "latest" },
      ],
      openQuestions: [
        "Why does a 69E-started quote get no email?",
        "Who receives the email when a Sub UCD made the quote?",
        "Can QA trigger the cron on demand? (paused decision)",
        "Email subject and the link's target URL never captured.",
      ],
    },
    // =========================================================================
    {
      id: "listings-enquiry",
      name: "Insurance listings, reports and BO Quote Enquiry",
      summary:
        "Read-only places where insurance transactions and quotes show: UCD listing and report, BO listing and Quote Enquiry, the Insurance Dashboard, the Service Portal insurance tab.",
      portals: ["UCD portal", "BackOffice", "Insurance Dashboard", "Service Portal"],
      triggers: [
        {
          id: "ucd-listing",
          name: "UCD Insurance Transaction Listing",
          entry: "UCD › Insurance › Insurance or Takaful Transaction Listing (/view/ucd/insurance/enquiry)",
          sources: [FEIE, FIP_LIST],
          steps: [
            {
              title: "Filter and search",
              where: "form#search-form › Search (#to-search)",
              detail: "Vehicle No, Transaction No, Date Created From/To (pick in calendar; max one month), Status, Insurance Company. 'Please apply search to show the record' until searched.",
              sources: [FEIE, FIP_LIST],
            },
            {
              title: "Read the row",
              where: "Listing table",
              detail: "Columns: #, Vehicle No, Reference No, Insured Name, Created Date, Insurance Company, Payment Amount, Payment, JPJ, Status, E-Certificate No, Remarks, Action (View / Resubmit).",
              sources: [FEIE],
            },
            {
              title: "Open details",
              where: "Action › View (/view/ucd/insurance/enquiry/view.do?transactionId=<uuid>)",
              detail: "E-Certificate No/Policy No, Submission Status to JPJ, Insurance Company, Plan, insured, vehicle, cover type, Hire Purchase, Sum Covered, Total Nett Contribution. [Receipt] button.",
              sources: [FEIE, TS_6673],
            },
          ],
        },
        {
          id: "bo-listing",
          name: "BO Insurance Transaction Listing",
          entry: "BackOffice › Insurance › Insurance Transaction Listing (/view/insurance/enquiry)",
          sources: [FEIE, AZ_BO],
          steps: [
            {
              title: "Search and export",
              where: "BO listing › Search › Export",
              detail: "Row → Policy Detail view with [Receipt]. Export CSV. Menu wording varies by BO role.",
              sources: [FEIE, TS_6673],
            },
          ],
        },
        {
          id: "bo-quote-enquiry",
          name: "BO Insurance Quote Enquiry (Insurance Checker)",
          entry: "BackOffice › Insurance › Insurance Quote Enquiry (/view/insurance/insurance-quote-enquiry/)",
          summary: "Quote only, no purchase. Shows all insurers, no fixed order.",
          sources: [FEIE, MIRO_Z, TS_9615, TS_9564],
          steps: [
            {
              title: "Enter the vehicle and owner",
              where: "Quote Enquiry › #vehicleRegNo, #buyerRefIdCompanyROC › Show Result (#to-show-result)",
              detail: "Vehicle Category (EV / Motorbike / Car). Postcode for some vehicles. IC with 2+ dashes is stripped; SSM with one dash kept.",
              sources: [FEIE, MIRO_Z],
            },
            {
              title: "Confirm vehicle and get quotes",
              where: "#vehicle-detail › Continue (#to-continue)",
              detail: "One table per insurer: Cover Type, Refer Risk, Refer Risk Code, 'Allow to purchase insurance:', Total Price.",
              sources: [FEIE],
            },
            {
              title: "Review the Quote Enquiries Listing",
              where: "BO › Insurance Quote Enquiries Listing › date From/To › Search › Export Excel",
              detail: "Columns include UCD Company/User, Created Date, Insured ID, Vehicle, Inquiry Source, quote and premium per insurer (RHB, Takaful-CO, Takaful-TF, Chubb, Lonpac, Tokio Marine, Tokio Marine Motorbike), Step 3 selection.",
              sources: [TS_9615],
            },
          ],
        },
        {
          id: "insurance-dashboard",
          name: "Insurance Dashboard (insurance company users)",
          entry: "/motorInsurance/login/ (separate login, not in BO menu)",
          sources: [FEIE],
          steps: [
            {
              title: "Log in as an insurance user",
              where: "Insurance Dashboard › home",
              detail: "Home shows Insurance Company / Agency Performance chart; link to Payment Report (Pemaju).",
              sources: [FEIE],
            },
          ],
          affects: [{ text: "Insurance Dashboard pages come from a chatbot answer, not a live check.", sources: [FEIE], unconfirmed: true }],
        },
        {
          id: "service-portal-tab",
          name: "Service Portal Insurance tab",
          entry: "Service Portal › Hire Purchase Ownership › Ownership Claim Listing › details › Insurance tab",
          sources: [TS_9103, FEIE],
          steps: [
            {
              title: "Open the vehicle's claim details",
              where: "Ownership Claim Listing (search Vehicle Number + Buyer ID) › details › Insurance tab",
              detail: "Date Issued, Insurance Company, Plan, E-Certificate/Policy No, Submission Status to JPJ, Gross Premium, Period, Policy Excess, Vehicle Use, Capacity.",
              sources: [TS_9103],
            },
          ],
        },
        {
          id: "ucd-report",
          name: "UCD Insurance Report",
          entry: "UCD › Insurance › Report (/view/ucd/insurance/insurance-report/report.do)",
          sources: [FEIE, FIP_MAIN],
          steps: [
            {
              title: "Open the report",
              where: "Insurance main › Report tile",
              detail: "Insurance Payment Report, Monthly Handling Fee Report and CP58 are listed as affected pages on the Zurich board. Report shows data within one month of the selected date.",
              sources: [FIP_MAIN, MIRO_Z],
            },
          ],
        },
      ],
      affects: [
        { text: "All these pages read the same insurer-name label; a rename (EAINT-12175) touches BO listing, UCD listing, UCD report, Insurance Dashboard Payment Report (Pemaju), Agency Performance chart. CIBO Payment Report is a different page.", sources: [FEIE] },
      ],
      cronjobs: [],
      roles: [
        { text: "Some BO menu items are Admin/HubAdmin only; a missing item is a permission difference, not a wrong path.", sources: [FEIE] },
        { text: "Insurance Dashboard needs an insurance-user account (about 6 users; admin page hidden at /view/insurance/company-account/user/).", sources: [FEIE] },
      ],
      afterCompletion: [],
      rules: [
        { text: "Date From → To max one month (eAuto default).", sources: [FEIE] },
        { text: "BO Quote Enquiry shows ALL quotations regardless of sequence.", sources: [TS_9214, TS_9564] },
      ],
      scopeToCheck: [
        { text: "After an insurer-name change: every page above plus Insurance Dashboard Payment Report (Pemaju) and Agency Performance chart.", sources: [FEIE] },
        { text: "Listing columns and export match on screen; e-sim and live-API data for Quote Enquiry.", sources: [TS_9615] },
      ],
      tickets: [
        { key: "EAINT-12175", date: "2026-10", what: "Lonpac insurer name standardisation (Secarang half live 2026-08-11).", state: "latest" },
        { key: "EAINT-9615", what: "Quote Enquiries Listing adds Tokio Marine Motorbike columns.", state: "latest" },
        { key: "EAINT-12058", date: "2026-08", what: "UCD Full Name & Login ID columns on transaction listing.", state: "latest" },
        { key: "EAINT-9103", what: "Service Portal Ownership Claim Listing with JomCheck and Insurance tabs.", state: "latest" },
      ],
      openQuestions: [
        "Does the Insurance Dashboard Payment Report (Pemaju) need the same name fix as the other pages?",
        "Lonpac 'Invoice' PDF (chatbot) vs backend 'Receipt' PDF — same document?",
      ],
    },
    // =========================================================================
    {
      id: "zurich-takaful",
      name: "Zurich General Takaful (new insurer, EAINT-8606 / 8608)",
      summary:
        "Zurich General Takaful replaces Syarikat Takaful Malaysia on eAuto and Secarang. Same entry points as the normal purchase; new cards, plan names and Takaful wording. Not deployed yet; tested manually.",
      portals: ["UCD portal", "BackOffice", "Service Portal", "CIBO", "Secarang"],
      triggers: [
        {
          id: "zurich-eauto",
          name: "eAuto: Get a Free Quote / eSTM FI / eSTM non-FI / Resubmit",
          entry: "Same four eAuto entries as the purchase flow; Zurich cards on Step 1",
          sources: [FZT_4A, MIRO_Z],
          steps: [
            {
              title: "Reach Step 1 by any entry",
              where: "Get a Free Quote, eSTM 69E (FI, all insurers), eSTM banner (non-FI, top two), Resubmit (Step 3)",
              detail: "Vehicle details from the insurer API; NCD default 0.0%; Transfer NCD; Change Postcode; Apply Changes.",
              sources: [FZT_4A, FZT_4B, MIRO_Z],
            },
            {
              title: "Select a Zurich card",
              where: "Step 1 › SELECT Zurich Takaful (Comprehensive / TPFT) › More Info",
              detail: "Plan names: Z-Drive Assist Takaful (car), Z-Driver Comprehensive: EV Protect, Z-Rider (Plus) Takaful. Agreed value may return 0 → only Market Value.",
              sources: [FZT, MIRO_Z],
            },
            {
              title: "Optional coverage",
              where: "Step 2",
              detail: "Car: All Drivers (pre-ticked + popup), Legal Liability to Passengers, CART, Special Perils, Negligent Acts, Breakage of Glass. Motorcycle: All Riders (mandatory), Special Perils, Legal Liability to Pillion. Zurich TPFT excludes All Drivers, Breakage of Glass, Special Perils. No MPA.",
              sources: [FZT],
            },
            { ...stepPayment, sources: [FZT_4B, MIRO_Z] },
            stepPayNow,
            stepConfirm,
          ],
        },
        {
          id: "zurich-secarang",
          name: "Secarang: homepage Car / Motorcycle tab",
          entry: "Secarang › Homepage › Car or Motorcycle tab › Private / Company",
          sources: [FZT, MIRO_Z],
          steps: [
            {
              title: "Quote and buy on Secarang",
              where: "Secarang › Plate No, Owner IC/SSM, Postal Code › Get quotation",
              detail: "Car Details → All Quotations (Zurich card) → Add-ons → Confirmation (gender change must re-price) → Payment (Fiuu card or FPX) → Success → WhatsApp + email receipt. Either tab accepts a car or motorcycle plate (SRD v1.2).",
              affects: ["CIBO Transaction Management", "Secarang CRM, Payment Report, Commission Report"],
              sources: [FZT],
            },
          ],
        },
      ],
      affects: [
        { text: "BO: Insurance Transaction Listing + Details, Endorsement, Payment Transaction, Upload e-Certificate, Quote Inquiry, Refer Risk Log, Payment OTP Log. UCD: Insurance Homepage, Transaction Listing, purchase flow, Payment Report, Monthly Handling Fee Report, CP58, eSerahan FI/non-FI. Service Portal: Ownership Claim Listing, HP Record Creation Listing. CIBO: Transaction Management, export, print, details.", sources: [FZT_5, MIRO_Z] },
      ],
      cronjobs: [
        { name: "Zurich cron job TS", schedule: "unknown (board table 'Cron Job' not read)", does: "Listed as 'To add' on the Zurich board.", sources: [MIRO_Z, FZT_5], unconfirmed: true },
      ],
      roles: [{ text: "Main UCD or Sub UCD with Insurance permission; company must have Insurance module (BO › Manage Company).", sources: [FZT_4B, MIRO_Z] }],
      afterCompletion: [{ text: "UCD / BO / CIBO insurance listings and Service Portal; Secarang purchases land in CIBO.", sources: [FZT_5] }],
      rules: [
        { text: "Zurich replaces Syarikat Takaful Malaysia for private car, company car and motorcycle incl. EV; distributor Pemaju Eksklusif Sdn. Bhd. PIAM ID must be MTA-J55282.", sources: [FZT] },
        { text: "Car covers: Comprehensive (V-CO) and TPFT (V-FT). Motorcycle: Comprehensive and Third Party (never 'TPFT').", sources: [FZT] },
        { text: "Takaful wording: Person Covered, Period of Takaful, Sum Covered, Basic Contribution, Contribution.", sources: [FZT] },
        { text: "Agreed after SRD v1.2: rename to 'Zurich General Takaful Malaysia Berhad' + BRN; Secarang terms Premium→Contribution, Sum Insured→Sum Covered, Insured→Participant.", sources: [FZT, { kind: "teams", ref: "DM Charmain Ea Chiang", date: "2026-07-06" }] },
        { text: "Test data: eSIM motorbike usage AA / body MSL; fuel car AB / MKR; EV usage EV / body EV; RHB failure code IF; cover note failed prefix ZA; JPJ pending/rejected prefix ZB.", sources: [FZT] },
      ],
      scopeToCheck: [
        { text: "Board TS: COM_TS1-12, TPFT_TS1-12, EXT_TS1-6 (before/after deployment), Secarang SC_E2E_TS1-28.", sources: [FZT_5] },
        { text: "Hire Purchase record status Active before, B/T after (bug 11661: stays Active).", sources: [FZT_5] },
      ],
      tickets: [
        { key: "EAINT-8606", date: "2026-05", what: "Zurich Takaful on eAuto insurance (Testing In 1st Env; SIT3 deploy 2026-10-07 includes it).", state: "latest" },
        { key: "EAINT-8608", date: "2026-05", what: "Zurich Takaful on Secarang.", state: "latest" },
      ],
      openQuestions: [
        "Miro board's 30 tables (API TS, Refer Risk, Cron Job, Insurance Sequence) not read.",
        "Motorcycle cover: board says 'TP will be removed' vs SRD v1.2 Comp + TP.",
        "SRD v1.3 needed for July requirements; 13/14 May deployment did not happen.",
      ],
    },
    // =========================================================================
    {
      id: "notifications",
      name: "Insurance notifications and post-payment alerts",
      summary:
        "Messages the insurance module sends by itself: failed cover note and JPJ rejected alerts, the referred-risk WhatsApp video, the monthly commission notice.",
      portals: ["WhatsApp (MessageBird)", "Email", "CIBO"],
      triggers: [
        {
          id: "cover-note-failed",
          name: "Cover note fails after payment",
          entry: "Paid insurance transaction › cover note submission FAILED (eSIM prefix VB on staging)",
          sources: [TS_8536, EI_NOTIF],
          steps: [
            {
              title: "Pay for insurance with a failing vehicle prefix",
              where: "Any eAuto or Secarang purchase (staging prefix VB = cover note failed, VF = JPJ rejected)",
              detail: "Cover Note Submission = FAILED after payment. MessageBird must be enabled.",
              sources: [TS_8536],
            },
            {
              title: "Check the WhatsApp alert",
              where: "Internal WhatsApp recipient",
              detail: "'Hi, {insurer_name} Insurance Transaction Failed at Cover Note Submission & Payment Paid …' with vehicle, sum insured, premium, time. eAuto messages prefixed 'Created from eAuto.'",
              sources: [TS_8536, EI_NOTIF],
              branches: [
                { when: "JPJ enquiry rejected or happy flow", then: "No failed-cover-note WhatsApp." },
                { when: "Cover note enquiry rejected (EAINT-11878)", then: "JPJ Rejected WhatsApp also sent." },
              ],
            },
          ],
        },
        {
          id: "referred-risk-video",
          name: "Referred risk → WhatsApp video (monthly cron)",
          entry: "Monthly cron reads CIBO Referred Risk Log records from 01.06.2026",
          sources: [TS_11867, EI_NOTIF],
          steps: [
            {
              title: "Cron re-quotes referred vehicles",
              where: "Backend cron",
              detail: "Asks every insurer except the one that referred the risk. If at least one quotes and the vehicle has no insurance purchase, one WhatsApp video is sent (Car.mp4 / Motor.mp4).",
              sources: [TS_11867, EI_NOTIF],
              branches: [
                { when: "All insurers fail, only the referred insurer quotes, or already bought", then: "No message." },
                { when: "Second cron run", then: "No repeat message." },
              ],
            },
          ],
        },
        {
          id: "monthly-commission",
          name: "Monthly commission notice to UCD Director",
          entry: "Scheduled job, 2nd of every month 10 AM",
          sources: [TS_10082, EI_NOTIF],
          steps: [
            {
              title: "WhatsApp + email to the UCD",
              where: "WhatsApp (eAuto Support) and email insurance.commission@eauto.my",
              detail: "'Hi {UCD Company}, your monthly commission summary for eAuto Insurance is available.' Commission = 10% x Gross Premium.",
              sources: [TS_10082, EI_NOTIF],
              branches: [
                { when: "Commission is 0", then: "Neither sent." },
                { when: "UCD uses an office number", then: "No WhatsApp; email still sent." },
              ],
            },
            {
              title: "Report email on the 3rd",
              where: "Email",
              detail: "Monthly Commission Achievement xlsx sent automatically.",
              sources: [TS_10082],
            },
          ],
        },
      ],
      affects: [{ text: "WhatsApp and email only; referred-risk cron reads CIBO Referred Risk Log.", sources: [TS_11867] }],
      cronjobs: [
        { name: "Monthly commission notice", schedule: "2nd of every month, 10 AM; report on the 3rd", does: "WhatsApp + email per UCD; xlsx report.", sources: [TS_10082, EI_NOTIF] },
        { name: "Referred-risk re-quote", schedule: "monthly", does: "Re-quotes referred-risk records from June 2026 and sends one WhatsApp video.", sources: [TS_11867] },
        { name: "eAuto Cover Note / JPJ Status", schedule: "5 min / 1 min, 08:00-23:00", does: "Drives the cover-note and JPJ alerts.", sources: [J_12171, TEAMS_12171] },
      ],
      roles: [
        { text: "Main Director gets the commission notice (new director after a change).", sources: [TS_10082] },
        { text: "Alert recipients follow SRD EAINT-9117: JPJ Signal Rejected → one internal recipient only; Refer Risk Pending Approval, Over Insured, Duplicate Cover Note → nobody of the two.", sources: [J_12342] },
      ],
      afterCompletion: [],
      rules: [
        { text: "Commission notice not sent when commission is 0.", sources: [TS_10082] },
        { text: "Referred-risk records before 01.06.2026 are never picked.", sources: [TS_11867, EI_NOTIF] },
      ],
      scopeToCheck: [
        { text: "Car vs Motorbike; Main vs Sub UCD; existing vs new records; repeat cron.", sources: [TS_11867] },
        { text: "Alert recipients per notification type after 12342.", sources: [J_12342, J_11878] },
      ],
      tickets: [
        { key: "EAINT-8536", what: "WhatsApp alert for failed cover note (fix in EAINT-9054).", state: "latest" },
        { key: "EAINT-11878", date: "2026-08", what: "JPJ Rejected WhatsApp extended to cover-note rejection.", state: "latest" },
        { key: "EAINT-12342", date: "2026-10", what: "Alert recipients per SRD 9117.", state: "latest" },
        { key: "EAINT-11867", date: "2026-07", what: "WhatsApp insurance video after referred risk.", state: "latest" },
        { key: "EAINT-10082", what: "Monthly commission notice.", state: "latest" },
        { key: "EAINT-12171", date: "2026-09", what: "Insurance cron intervals standardised (supersedes EAINT-3170 timings).", state: "latest" },
        { key: "EAINT-3170", what: "Older cron timings (eAuto 30 min etc.).", state: "legacy", supersededBy: "EAINT-12171" },
      ],
      openQuestions: [
        "Is a notification sent when payment is taken but cover note or JPJ status failed? (asked in 11878, no answer in Jira)",
      ],
    },
    // =========================================================================
    {
      id: "popups-banners",
      name: "Insurance popups and banners (campaigns, webinar, East Coast)",
      summary:
        "Campaign popups and banners shown on the Home page, the Insurance module page and above the Insurance Transaction Listing. Marketing only; they do not start a purchase.",
      portals: ["UCD portal"],
      triggers: [
        {
          id: "login-insurance-page",
          name: "Login → Home → Insurance module → listing",
          entry: "UCD login › Home popup chain › Insurance module page popup › banner above the Insurance Transaction Listing",
          sources: [TS_9559, TS_11784, BR7, ASK_Q2],
          steps: [
            {
              title: "Log in",
              where: "UCD › Home",
              detail: "Login arms session flags (Insurance banner, campaign, East Coast, profile update). Home opens the first popup in a priority list; closing one opens the next.",
              sources: [ASK_Q2],
            },
            {
              title: "Open the Insurance module",
              where: "UCD › Insurance",
              detail: "The campaign popup shows here too, once per login. English first, Chinese after 7 seconds.",
              sources: [TS_9559, BR7],
            },
            {
              title: "Open the Transaction Listing",
              where: "UCD › Insurance › Transaction Listing",
              detail: "Banner above the listing (East Coast banner only for East Coast UCDs).",
              sources: [TS_9559, TS_11784],
            },
          ],
        },
      ],
      affects: [{ text: "Popups block clicks until closed; automation must dismiss them on Home and on the Insurance page.", sources: [FIP_MAIN, FIP_TRAPS] }],
      cronjobs: [],
      roles: [
        { text: "Main UCD and Sub UCD; East Coast popup only if HQ or a branch is East Coast.", sources: [TS_9559] },
        { text: "Without Insurance permission only the Home popup shows; the Insurance module is not accessible.", sources: [TS_8564, TS_9559] },
      ],
      afterCompletion: [],
      rules: [
        { text: "Insurance banner popup: login arms an Insurance banner flag and EAINT-11925 added it.", sources: [BR7, { kind: "jira", ref: "EAINT-11925" }],
          alt: [{ text: "Prod code says the dedicated insurance banner popup file exists and the home popup manager reads the flag showInsuranceBanner, but the flag is never used after it is read and the popup file is not included on any page. In production this banner shows to nobody; it looks like leftover or unfinished work, not a live trigger point.", sources: [ASK_TRIG], note: "prod code says" }] },
        { text: "Popup order is campaign specific; take it from the current campaign ticket.", sources: [BR7] },
        { text: "Shown once per login; not again when returning to Home or Insurance.", sources: [TS_9559, BR7] },
        { text: "Code order: websocket reminder → East Coast → Insurance-cancellation/LKM-refund poster → Merdeka → profile update → e-Invoice reminder → CNY → Raya.", sources: [ASK_Q2] },
      ],
      scopeToCheck: [
        { text: "Chrome vs Firefox; Main vs Sub UCD; HQ/branch East Coast; Insurance permission on/off; Company Profile pending; once per login; 7 s EN/CN; listing banner; end date.", sources: [TS_9559, TS_11784] },
      ],
      tickets: [
        { key: "EAINT-11925", date: "2026-08", what: "Merdeka 2026 popup + Insurance banner.", state: "latest" },
        { key: "EAINT-11784", date: "2026-06", what: "Webinar banner (June 2026).", state: "latest" },
        { key: "EAINT-9559", date: "2026-02", what: "CNY 2026 popup/banner.", state: "latest" },
        { key: "EAINT-9560", date: "2026-03", what: "Hari Raya 2026 popup.", state: "latest" },
        { key: "EAINT-8637", date: "2025-08", what: "TNG Campaign Winner popup removed.", state: "latest" },
        { key: "EAINT-8564", date: "2025-08", what: "TNG Campaign Winner popup added.", state: "legacy", supersededBy: "EAINT-8637" },
      ],
    },
  ],
};
