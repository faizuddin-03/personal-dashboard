import type { Module, Source } from "../types";

// Source shorthands (every Fact / Step / Cronjob needs sources).
const FE: Source = { kind: "mine", ref: "knowledge/flow-estm.md" };
const FE_BYPASS: Source = { kind: "mine", ref: "knowledge/flow-estm.md §The bypass", date: "2026-08-13" };
const FE_EMU: Source = { kind: "mine", ref: "knowledge/flow-estm.md §MyKad-emulator route", date: "2026-10-19" };
const FE_STEP5: Source = { kind: "mine", ref: "knowledge/flow-estm.md §Step 5", date: "2026-08-17" };
const FE_LIST: Source = { kind: "mine", ref: "knowledge/flow-estm.md §eSTM listing and details", date: "2026-08-14" };
const FE_69E: Source = { kind: "mine", ref: "knowledge/flow-estm.md §eSTM -> insurance handoff", date: "2026-08-18" };
const MEM_69E: Source = { kind: "mine", ref: "memory estm-69e-redirect-after-full-completion", date: "2026-08-18" };
const AZ_PORTAL: Source = { kind: "azfar", ref: "knowledge/portals/ucd/portal.md" };
const AZ_FLOW: Source = { kind: "azfar", ref: "automation/src/flows/estm.flow.ts" };
const AZ_ESTM: Source = { kind: "azfar", ref: "knowledge/_core/estm.md" };
const ASK_Q6: Source = { kind: "askeauto", ref: "Q6 eSTM / eSerahan (prod code)", date: "2026-10-23" };
const ASK_HM: Source = { kind: "askeauto", ref: "prod code 0e21bef3 — Transfer History and Hak Milik answer (EstmHakMilikTriggerJob, EstmHakmilikSubmissionJob, JpjHakMilikHandlerBean)", date: "2026-10-23" };
const ASK_INS: Source = { kind: "askeauto", ref: "prod code 0e21bef3 — eAuto motor insurance purchase answer (estm-addon.jsp, payment.jsp, InsuranceTransactionController process-quote)", date: "2026-10-23" };
const TS_8534: Source = { kind: "ts", ref: "EAINT-8534 TS #064" };
const TS_8523: Source = { kind: "ts", ref: "EAINT-8523 TS #062" };
const TS_4328: Source = { kind: "ts", ref: "EAINT-4328 TS01-TS03" };
const TS_3677: Source = { kind: "ts", ref: "EAINT-3677 TS01" };
const TS_8699: Source = { kind: "ts", ref: "EAINT-8699 TS #080" };
const MIRO_ZURICH: Source = { kind: "miro", ref: "uXjVGih1g4s=" };
const DECISION_69E: Source = { kind: "mine", ref: "Faizuddin decision in chat", date: "2026-10-23" };

export const estm: Module = {
  id: "estm",
  name: "eSTM / eSerahan (with eLKM and eVOC)",
  short: "eSTM",
  portals: ["UCD portal", "Back Office", "Service Portal (read only)", "JPJ", "RHB"],
  summary:
    "eSTM (eSerahan) is the final ownership transfer from a used-car dealer (UCD) to the end buyer. It has 6 steps. The buyer proves identity first with MyKad and thumbprint, then the dealer does the same. The dealer can also buy eLKM (road tax) and eVOC (ownership certificate) in the same payment. If the vehicle has no valid insurance, the user is sent to the insurance flow.",
  related: ["insurance", "stms", "ssm", "payments-fees", "platform"],
  glossary: [
    { term: "eSTM / eSerahan", meaning: "Ownership transfer from a UCD to the end buyer (final step after STMS). Mirror of STMS, but the buyer is checked first.", sources: [FE, AZ_PORTAL] },
    { term: "eLKM", meaning: "Road tax renewal add-on sold in the eSTM payment step (6 or 12 months). Not the same as LKM Refund.", sources: [FE_STEP5, AZ_PORTAL] },
    { term: "eVOC", meaning: "Ownership certificate request sold in eSTM. The certificate is emailed to the eVOC email typed in Step 1. Has no working home tile; only reachable inside an eSTM transaction.", sources: [FE, ASK_Q6] },
    { term: "Hak Milik (Butir-butir Hak Milik)", meaning: "Ownership title document. Flag J = bought from JPJ by cronjob. Flag E = bought in the eSTM flow.", sources: [TS_8523, TS_8699] },
    { term: "Hak Milik purchase method (eAuto / JPJ Counter)", meaning: "Code tag on a Hak Milik record: 'eAuto' if the original transfer was processed in eAuto, 'JPJ Counter' if processed at the JPJ counter (HakMilikPurchaseMethod). Not the same wording as flag E / J above.", sources: [ASK_HM] },
    { term: "Slip Pengesahan", meaning: "Confirmation slip for an approved transaction. Shows the road tax validity table only if eLKM was bought.", sources: [TS_4328] },
    { term: "69E (VEL000069E)", meaning: "JPJ answer for eSTM meaning no valid insurance on the vehicle. It sends the user to the insurance flow.", sources: [FE_69E, AZ_PORTAL] },
    { term: "eSIM", meaning: "Internal test simulator that answers for JPJ and RHB on staging. Used to set the vehicle response code (for example 69E).", sources: [FE_69E] },
    { term: "FIS (eHakMilik fee)", meaning: "Fee line on the eSTM payment summary.", sources: [FE, AZ_ESTM] },
  ],
  flows: [
    // ------------------------------------------------------------------
    {
      id: "create-estm",
      name: "Create an eSTM transaction (6 steps)",
      summary:
        "A UCD user creates and pays an eSTM for a Malaysian (MyKad), MyPR or company buyer. Steps: 1 Buyer, 2 Vehicle, 3 Seller (Dealer), 4 JPJ Check, 5 Payment, 6 Transfer. Most testing is done for the MyKad and MyPR buyer.",
      portals: ["UCD portal", "JPJ", "RHB"],
      triggers: [
        {
          id: "ucd-tile",
          name: "UCD home tile eSERAHAN",
          entry: "UCD Portal › Home › eSERAHAN tile › CREATE eSERAHAN TRANSACTION",
          summary: "The normal way in. The first time a user opens it, a T&C gate (eClassified) shows.",
          sources: [FE, AZ_PORTAL],
          steps: [
            {
              title: "Log in and open the eSTM home page",
              where: "UCD Portal › Login › Home › eSERAHAN tile (id ESTM)",
              detail: "Lands on the eSTM home page. Buttons: CREATE eSERAHAN TRANSACTION (#create-tx), eSERAHAN PERMISSION (#one-layer-permission), eLKM PERMISSION (#lkmPermission). An announcement modal can cover the tiles, close it first.",
              sources: [FE, AZ_PORTAL],
            },
            {
              title: "Choose the buyer identity",
              where: "eSTM home › CREATE eSERAHAN TRANSACTION › category tiles",
              detail: "Tiles: MALAYSIAN (MyKad), MyPR - PEMASTAUTIN TETAP, SYARIKAT (company). Confirm with Yes. Company is tested by hand only.",
              branches: [
                { when: "Account has no RHB Islamic current account", then: "Blocked by the RHB activation dialog (#check-rhb-activation-dialog)." },
              ],
              sources: [FE, AZ_PORTAL],
            },
            {
              title: "Step 1 Buyer (Customer): buyer authentication",
              where: "eSTM › Step 1 Buyer",
              detail: "Type vehicle no (#vehicleRegNo) and the eVOC email, tick the buyer consent (#buyer-consent), then read the buyer MyKad and thumbprint. Order matters: vehicle no and email first, then consent, then insert card. Status is New.",
              affects: ["Platform › MyKad / thumbprint reader"],
              sources: [FE_EMU, AZ_PORTAL, ASK_Q6],
            },
            {
              title: "Step 2 Vehicle: buyer and vehicle details",
              where: "eSTM › Step 2 Vehicle",
              detail: "Buyer email (#buyerEmail) must be different from the eVOC email. Also contact no, mailing address (3 lines), postcode, state, district, engine no and chassis no. Click Next (#to-continue) then Yes.",
              branches: [
                { when: "Buyer email equals eVOC email", then: "Error \"Please enter Buyer's Email Address.\"" },
                { when: "Same email or mobile used more than 3 times in the last 30 days", then: "Threshold error." },
              ],
              sources: [FE, AZ_FLOW],
            },
            {
              title: "Step 3 Seller (Dealer): seller authentication",
              where: "eSTM › Step 3 Seller (Dealer)",
              detail: "The logged-in dealer reads own MyKad and thumbprint, then ticks UCD consent (#ucd-consent). If the company uses 2-layer permission, the creator's submission goes to PendingApproval until an approver approves it.",
              sources: [FE, ASK_Q6],
            },
            {
              title: "Step 4 JPJ Check",
              where: "eSTM › Step 4 JPJ Check",
              detail: "Dialog \"Submit to JPJ for checking?\" then Yes. The same URL shows the JPJ result (Response Code SUCCESS) and a read-only Payment Summary (JPJ Fee, eHakMilik Fee (FIS), eSerahan Fee, Service Tax, Total). Agree, click Make Payment (#to-payment), then Yes on \"Sure to continue?\".",
              branches: [
                { when: "JPJ answers VEL000069E", then: "User is sent to the insurance flow (see flow: eSTM to insurance hand-off)." },
                { when: "Same vehicle and owner already recorded", then: "Message \"Transaksi yang sama untuk kenderaan dan pemilik ini telah direkod sebelum ini.\"" },
                { when: "JPJ enquiry fails", then: "Status Failed." },
              ],
              sources: [FE, ASK_Q6],
            },
            {
              title: "Step 5 Payment (with eLKM and eVOC add-ons)",
              where: "eSTM › Step 5 Payment",
              detail: "eLKM (#lkm-addson-checkbox) and eVOC (#evoc-addson-checkbox) are both ticked by default. Pick eLKM period 6 or 12 months. Click #to-payment, then \"Sure to proceed with payment?\" then \"Sure to make this payment now?\" (OK). Do not click Save & Continue Later, it parks a draft. Shows \"Payment is in process. Please do not refresh or close the browser.\" Status becomes Pending when paid.",
              affects: ["RHB direct debit", "eLKM", "eVOC"],
              branches: [
                { when: "eLKM ticked with no period", then: "Next is blocked: \"Please select LKM renewal period\"." },
                { when: "RHB payment fails", then: "Dialog shows, no page change. Retry from the listing." },
              ],
              sources: [FE_STEP5, AZ_PORTAL, ASK_Q6],
            },
            {
              title: "Step 6 Transfer: JPJ submit and commit",
              where: "eSTM › Step 6 Transfer",
              detail: "Shows JPJ Transfer Status and eLKM dates. Click Done to open the eSTM details page. In the background the JPJ submit (phase 1) and commit (phase 2) move status Pending → Committed → Approved.",
              sources: [FE, AZ_FLOW, ASK_Q6],
            },
          ],
        },
        {
          id: "estm-bypass",
          name: "Staging test bypass URL (not product behaviour)",
          entry: "/<env>/zzz/<slot>/<env>/view/ucd/estm/transaction",
          summary: "QA-only shortcut on staging. Slot 1-30 is tied to one IC. It skips the reader. Replaced for EAINT-12412 by the MyKad emulator route.",
          sources: [FE_BYPASS],
          steps: [
            {
              title: "Open the bypass URL",
              where: "Browser address bar (staging only)",
              detail: "Goes straight to the eSTM transaction page for the IC bound to the slot. Then follow Steps 1-6 as normal.",
              sources: [FE_BYPASS],
            },
          ],
        },
        {
          id: "estm-emulator",
          name: "Normal URL with the MyKad emulator (EAINT-12412 TS12)",
          entry: "UCD Portal › eSERAHAN, with the MyKad Reader Emulator at http://localhost:7878",
          summary: "Latest QA route (2026-10-19). Uses the normal portal and a local emulator that acts as the card reader.",
          sources: [FE_EMU],
          steps: [
            {
              title: "Insert the card at each authentication screen",
              where: "Emulator panel › Connect › Insert Card",
              detail: "Done before Step 1 (buyer) and before Step 3 (seller), because the card ejects itself. Buyer example is a different person from the seller.",
              affects: ["Platform › MyKad / thumbprint reader"],
              sources: [FE_EMU],
            },
          ],
        },
        {
          id: "estm-resume-draft",
          name: "Resume a saved draft from the listing",
          entry: "eSTM Transaction Listing › filter #isDraft",
          summary: "Draft resume was never automated.",
          sources: [FE],
          steps: [
            {
              title: "Open the draft from the listing and continue",
              where: "eSERAHAN TRANSACTION LISTING (/view/ucd/estm/enquiry/main.do)",
              detail: "Not confirmed. The Save & Continue Later button on Step 5 creates the draft.",
              sources: [FE],
            },
          ],
        },
      ],
      affects: [
        { text: "eSTM Transaction Listing and eSTM details page (UCD) get the new transaction.", sources: [FE_LIST, ASK_Q6] },
        { text: "Back Office eSTM Transaction listing, support pages and JPJ Resubmission (eSTM) tool.", sources: [ASK_Q6] },
        { text: "Service Portal listing: only Approved eSTM with Butir-butir Hak Milik appears.", sources: [{ kind: "mine", ref: "knowledge/business-rules-from-test-scenarios.md §3 item 6" }, TS_8699] },
        { text: "JPJ gets Transfer Final Submission, plus eVOC and eLKM Final Submission.", sources: [FE, ASK_Q6] },
        { text: "Invoice and e-Invoice: eSTM service charge RM35.00 + 2.80 SST = 37.80. eLKM service charge 2.75 + 0.22 = 2.97. e-Invoice classification 022.", sources: [{ kind: "mine", ref: "knowledge/flow-jomcheck.md §9h item 14", date: "2026-09-28" }] },
        { text: "Reports: UCD Payment Report, Payment Breakdown Report (BMK, TH, eLKM, eVOC), Audit Trail Log (events Create Transaction, JPJ Check, Make payment, JPJ Transfer, JPJ Commit).", sources: [ASK_Q6, { kind: "jira", ref: "EAINT-3090" }] },
        { text: "Emails: eVOC certificate email goes to the eVOC email. Buyer gets a completion email and WhatsApp on successful submission.", sources: [FE, ASK_Q6] },
        { text: "Other systems that read eSTM: eauto-elasticgateway (search index), eauto-einvoice (tax invoice), eauto-notification (email/WhatsApp), eauto-simulator on non-prod.", sources: [ASK_Q6] },
        { text: "Insurance flow can start after eSTM (see flow: eSTM to insurance hand-off).", sources: [FE_69E, AZ_PORTAL] },
      ],
      cronjobs: [
        { name: "EstmJpjSubmissionJob", schedule: "About hourly, 8am-10pm (dev-edition config; prod timing not confirmed)", does: "Batch submits and commits paid eSTM to JPJ. Also drives the linked eLKM and eVOC JPJ submissions.", sources: [ASK_Q6], unconfirmed: true },
        { name: "HirePurchaseExpiredJob", schedule: "About every minute, 9am-11pm (dev-edition config)", does: "Expires hire-purchase linkage records tied to eSTM transactions.", sources: [ASK_Q6], unconfirmed: true },
        { name: "EstmPatchCommitJob / EstmCancelCommitJob", schedule: "No active trigger", does: "Support-tool style jobs that patch or reset-and-cancel stuck commit transactions when run by hand.", sources: [ASK_Q6], unconfirmed: true },
        { name: "eSTM cancelled-transaction housekeeping (eauto-cron)", schedule: "On by default; run time is a hidden setting", does: "Auto-cancels stale eSTM transactions.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list (eauto-cron service)", date: "2026-10-23" }] },
        { name: "JPJ eSTM registration job (old in-app scheduler)", schedule: "Intended nightly; commented out in the readable (non-production) copy", does: "Old job that sends eSTM registration to JPJ. Prod state not confirmed.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list, old in-app scheduler (non-production reference copy; prod file withheld)", date: "2026-10-23" }], unconfirmed: true },
        { name: "LHDN e-Invoice status update", schedule: "Not known", does: "LHDN status can read Failed right after payment and turn OK later. e-Invoice is only for customers with a valid TIN and only for the current calendar month.", sources: [FE_EMU] , unconfirmed: true },
      ],
      roles: [
        { text: "UCD Main user and Sub user can create eSTM. Only the UCD portal is used; no public access.", sources: [FE, ASK_Q6] },
        { text: "Layer 1 eSTM permission (company on/off) is set by eAuto Admin in Back Office. Layer 2 permission is given by the UCD Main user, max 10 people per company.", sources: [ASK_Q6] },
        { text: "eLKM has its own permission, max 10 people. Sub user is capped at RM2,000 per LKM payment.", sources: [ASK_Q6, TS_8534] },
        { text: "Optional approver user approves transactions left in PendingApproval.", sources: [ASK_Q6] },
        { text: "Credit / hire-purchase companies can view linked eSTM read only through a separate IP-whitelisted portal.", sources: [ASK_Q6] },
        { text: "Mobile app eSTM code is commented out in prod, so the app is not an entry point. Jira shows the Android app is being aligned to web eSTM (Perakuan, JPJ Official Receipt).", sources: [ASK_Q6, { kind: "jira", ref: "EAINT-12551" }, { kind: "jira", ref: "EAINT-12568" }] },
      ],
      afterCompletion: [
        { text: "eSTM Transaction Listing (/view/ucd/estm/enquiry/main.do), ID like E631940085. Details page has Payment Details per service: eSTM, eLKM (LK...), eVOC (EV...).", sources: [FE_LIST] },
        { text: "Sent to JPJ as the ownership transfer record (2 phases: submit, then commit). Paid by RHB direct debit.", sources: [ASK_Q6] },
        { text: "If JPJ said 69E or eLKM was not bought, the user goes to the insurance plan page (see insurance hand-off flow).", sources: [FE_69E, AZ_PORTAL] },
      ],
      rules: [
        {
          text: "Statuses of the main transaction: New → (PendingApproval) → Pending (paid) → Committed → Approved. Failed can happen at enquiry, payment, submit or commit. Cancelled is set by admin JPJ cancellation.",
          sources: [ASK_Q6],
          alt: [{ text: "Listing status values seen on the portal: New / Pending / CommitedJPJApproved / Approved / Failed / Cancelled.", sources: [FE_LIST], note: "Faizuddin's captured listing wording; prod code names differ slightly." }],
        },
        { text: "eLKM and eVOC each have their own Payment Status and JPJ Status (OK / Pending / Failed / -). They move on their own timeline.", sources: [ASK_Q6] },
        { text: "Buyer email must differ from the eVOC email. Each email and mobile number can be used max 3 times in the last 30 days.", sources: [FE] },
        { text: "Buyer name is cut to 15 characters in the listing. Listing times are 24-hour; the details page uses 12-hour with am/pm.", sources: [FE_LIST] },
        { text: "Dialog texts: #insError \"We're unable to retrieve an insurance quotation for this transaction. Kindly reach out to +6018-2884889 or insurance@eauto.my for assistance.\" #insDoneBuy \"This transaction cannot be processed. Insurance must be purchased through our platform for this vehicle.\"", sources: [FE] },
        { text: "Company eSTM (SYARIKAT), interstate / UCD-to-UCD transfer and draft resume are not automated (manual).", sources: [FE] },
        { text: "Staging: the eSIM vehicle prefix (first 2 letters) decides the JPJ and RHB answer. A prefix with no eSTM row gets \"eHakMilik Fee (FIS) : NOT FOUND\".", sources: [AZ_ESTM, { kind: "azfar", ref: "automation/README.md#The two prefix maps" }] },
      ],
      scopeToCheck: [
        { text: "Run all 6 steps including both payment dialogs for MyKad and MyPR buyers.", sources: [FE] },
        { text: "Tick and untick eLKM and eVOC. Check the fee from the addon-fee.get response, not only the total.", sources: [FE_STEP5] },
        { text: "eLKM cap for Sub user (RM2,000.00 ok, RM2,000.01 blocked) versus Main user (no cap).", sources: [TS_8534] },
        { text: "Buyer email vs eVOC email rule and the 3-uses-in-30-days rule.", sources: [FE] },
        { text: "Failed payment and RHB RE retry from the listing.", sources: [FE_LIST] },
        { text: "Check UCD listing (21 columns incl. eLKM and eVOC statuses), details page e-Invoice sections, BO listing, Service Portal listing.", sources: [FE_LIST] },
        { text: "Check invoice, e-Invoice, Slip Pengesahan and Hak Milik documents after a fee or wording change.", sources: [TS_4328] },
        { text: "Check UCD Payment Report, Payment Breakdown Report and CIBO / reconciliation if amounts change.", sources: [{ kind: "ts", ref: "EAINT-3090 TS1-TS3" }] },
        { text: "Check the insurance hand-off after any change to Step 4 or Step 5.", sources: [FE_69E] },
        { text: "Check the Android app still matches web when Perakuan or receipt wording changes.", sources: [{ kind: "jira", ref: "EAINT-12551" }] },
      ],
      tickets: [
        { key: "EAINT-12412", date: "2026-10", what: "JomCheck invoice split; TS12 buys an eSTM through the MyKad emulator. e-Invoice baseline is 1 line (35.00 / 2.75).", state: "latest" },
        { key: "EAINT-12253", date: "2026-10", what: "Browser Reminder (Firefox to Chrome) at the last step of eSTM. Testing in 1st env.", state: "latest" },
        { key: "EAINT-12551", date: "2026-10", what: "Android: align Perakuan with SRD v1.1 and add JPJ Official Receipt download to eSTM.", state: "latest" },
        { key: "EAINT-9204", date: "2025-11", what: "JPJ Official Receipt for STMS, TH, eSTM, APT, BMK, eDereg Pre-Checking. Done 2026-10-20.", state: "latest" },
        { key: "EAINT-12255", date: "2026-09", what: "Controlled online exception flow for classic and premium registration numbers (eSTM remark VEL000684E). On Hold.", state: "latest" },
        { key: "EAINT-12035", date: "2026-07", what: "Backlog: eSTM reference number generation hardened (unique). To Do.", state: "latest" },
        { key: "EAINT-12216", date: "2026-08", what: "Engine no and chassis no max length 60 characters from 2026-10-01 (old eSTM limits 22 and 30).", state: "latest" },
        { key: "EAINT-8622", date: "2025-07", what: "Old BRN to New BRN in JPJ enquiry and final submission. Done 2026-10-21.", state: "latest" },
        { key: "EAINT-9233", date: "2026-01", what: "eLKM and other permissions ticked by default for new and edited companies.", state: "latest" },
        { key: "EAINT-8802", date: "2026-01", what: "Bypass Purchase SSM for STMS and eSTM.", state: "latest" },
        { key: "EAINT-7229", date: "2025-12", what: "Chrome WebSocket replaces Java applet on thumbprint pages (Step 1 Buyer, Step 3 Seller).", state: "latest" },
        { key: "EAINT-8534", date: "2025-07", what: "Max eLKM amount for Sub user raised from RM500 to RM2,000.", state: "latest" },
        { key: "EAINT-9727", date: "2026-01", what: "eSTM FI flow: reset payment handling. Code Review.", state: "latest" },
        { key: "EAINT-9208", date: "2025-11", what: "FI eSTM flow via tagging at eAuto Service Portal.", state: "latest" },
      ],
      openQuestions: [
        "eLKM default renewal period (6 or 12 months) depends on the branch. Not confirmed.",
        "The manual setup behind the 2026-08-17 green run (UCD patching) was never written down.",
        "Markup of #to-buy-insurance has never been seen. Not known if it shows on Step 4.",
        "BO eSTM views are not documented. Cancelled and Pending paths were never driven.",
        "Prod cron times are not confirmed. Only dev-edition schedule was readable.",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "estm-insurance-handoff",
      name: "eSTM to insurance hand-off (69E and other entries)",
      summary:
        "After or during eSTM the user can be moved into the eAuto motor insurance flow. The strongest case is the 69E answer from JPJ (no valid insurance). Other ways in are the details-page banner and the eLKM-unticked end of the flow.",
      portals: ["UCD portal", "JPJ (via eSIM on staging)"],
      triggers: [
        {
          id: "69e-redirect",
          name: "69E redirect (JPJ says no valid insurance)",
          entry: "eSTM Step 4 (JPJ result VEL000069E) → insurance plan page",
          summary: "On staging this is forced by setting the vehicle's response code to VEL000069E in eSIM.",
          sources: [FE_69E, MEM_69E, AZ_PORTAL],
          steps: [
            {
              title: "Set the eSIM response code to VEL000069E",
              where: "eSIM › estm-enquiry-resp entity (vehicle prefix)",
              detail: "Do it right after the JPJ result shows on Step 4 and before clicking Make Payment (#to-payment).",
              sources: [FE_69E, AZ_PORTAL],
            },
            {
              title: "Complete the normal eSTM flow",
              where: "eSTM › Make Payment › Payment › Done",
              detail: "Make Payment, \"Sure to continue?\", untick eLKM, submit, Done. Nothing else changes in the flow for the 69E case.",
              sources: [FE_69E, MEM_69E],
            },
            {
              title: "User lands on insurance Step 1 (plan page)",
              where: "Insurance › Step 1 All Quotations (body#insurancePlan)",
              detail: "Page text: \"The vehicle is eligible for road tax renewal, but no valid motor insurance found. The system has redirected you to purchase insurance. You may skip and return back to eSerahan.\" Button Skip, Return to eSerahan (#estmBackBtn). Only insurers the simulator quotes are shown. After buying, Continue with eSerahan (#estmLkmDoneBtn) returns to eSTM.",
              affects: ["Insurance › Quotes, Optional Coverage, Payment, Confirm"],
              branches: [
                { when: "User clicks Skip, Return to eSerahan", then: "Back to eSTM. 69E is not a hard force." },
                { when: "Insurance bought", then: "Continue with eSerahan returns to eSTM; transaction details page shows." },
              ],
              sources: [FE_69E, AZ_PORTAL, MIRO_ZURICH],
            },
          ],
          affects: [
            { text: "For a 69E-triggered flow, no quotation-reminder email is sent.", sources: [{ kind: "ts", ref: "EAINT-11864 TS06" }] },
          ],
        },
        {
          id: "elkm-unticked",
          name: "eLKM unticked: insurance after payment",
          entry: "eSTM Step 5 with eLKM unticked → Done",
          summary: "If eLKM is not bought, the paid eSTM is followed by the insurance plan page. With eLKM ticked the flow stays in eSerahan and ends at Step 6.",
          sources: [AZ_PORTAL, { kind: "ts", ref: "EAINT-11864 TS02, TS03" }],
          steps: [
            {
              title: "Untick eLKM, pay and finish the eSTM",
              where: "eSTM › Step 5 Payment",
              detail: "Unticking eLKM only recalculates the fee. A dialog \"Sure to make this payment now?\" (OK) appears because the amount changed. The redirect comes after the flow completes, not on the untick.",
              sources: [FE_69E, MEM_69E],
            },
            {
              title: "Open insurance plan page",
              where: "Insurance › plan/view.do?...isDirectEstmFirstTime=true",
              detail: "User stops at Step 2 or 3 in the reminder tests.",
              affects: ["Insurance › quotation reminder email"],
              sources: [AZ_PORTAL, { kind: "ts", ref: "EAINT-11864 TS02, TS03" }],
            },
          ],
        },
        {
          id: "details-banner",
          name: "Insurance banner on the eSTM details page",
          entry: "eSTM Transaction Details (Approved) › banner GET FREE QUOTE FOR {vehicle no}",
          sources: [{ kind: "miro", ref: "uXjVGih1g4s=" }, { kind: "ts", ref: "EAINT-8467 INSSEQ_GFQ_IB_TS1" }],
          steps: [
            {
              title: "Click the banner",
              where: "eSTM Transaction Details page › Insurance banner",
              detail: "Starts insurance Step 1 for the same vehicle. For an Approved eSTM only the top two insurer options are shown (Non-FI flow).",
              affects: ["Insurance"],
              sources: [{ kind: "miro", ref: "uXjVGih1g4s=" }],
            },
          ],
        },
        {
          id: "after-estm-completion",
          name: "Auto redirect after eSTM completes",
          entry: "eSTM Step 6 Approved → Insurance Step 1",
          sources: [{ kind: "ts", ref: "UCD_9214_TAKINS_TS1" }, { kind: "ts", ref: "11977_TS1" }],
          steps: [
            {
              title: "Finish the eSTM and land on Insurance Step 1",
              where: "eSTM Step 6 › Insurance Step 1 All Quotations",
              detail: "Insurer order depends on vehicle type, hire purchase record and region. Payment OK gives Status Insurance Created.",
              affects: ["Insurance"],
              sources: [{ kind: "ts", ref: "UCD_9214_TAKINS_TS1" }, { kind: "ts", ref: "11977_TS1, TS4" }],
            },
          ],
        },
      ],
      affects: [
        { text: "Insurance Transaction Listing and details (UCD and BO); eSTM details page gets the Insurance Receipt.", sources: [{ kind: "ts", ref: "INS_RECEIPT_TS1" }] },
        { text: "Quotation reminder cronjob email to UCD for quotations that are not purchased.", sources: [{ kind: "jira", ref: "EAINT-11864" }] },
      ],
      cronjobs: [],
      roles: [
        { text: "UCD company needs Insurance Permission = Yes and quotation Available for the redirect.", sources: [{ kind: "ts", ref: "UCD_9214_TAKINS_TS6" }] },
        { text: "Insurance purchase is a prerequisite to buying eLKM.", sources: [ASK_Q6, { kind: "mine", ref: "knowledge/flow-quotation-reminder.md" }] },
      ],
      afterCompletion: [
        { text: "Insurance Transaction Listing (status Insurance Created). Through eSTM, the user returns to the eSTM flow or eSTM details page.", sources: [{ kind: "miro", ref: "uXjVGih1g4s=" }] },
      ],
      rules: [
        {
          text: "69E diverts at Step 4 to Step 5 when Make Payment is pressed. The payment screen is never reached. Switching the code back to GLB000000I on the insurance page lets the flow continue (Continue with eSerahan → eSTM Step 6). The user can skip back to eSerahan. Miro and TS also describe it as the Step 4 to 5 JPJ enquiry failing with 69E.",
          sources: [AZ_PORTAL, { kind: "azfar", ref: "automation/src/flows/insurance.flow.ts" }, MIRO_ZURICH, DECISION_69E],
          alt: [
            {
              text: "69E is set before Make Payment, but the user is moved to insurance only after the normal eSTM Step 5 completes (payment submitted, Done). The user can skip back to eSerahan.",
              sources: [FE_69E, MEM_69E],
              note: "Faizuddin's earlier wording — same behaviour, less detail (confirmed 2026-10-23)",
            },
            {
              text: "The prod code puts the 69E action on the eSTM add-on screen and the payment screen: when the road-tax (LKM) JPJ enquiry returns VEL000069E, Get Insurance Quote calls process-quote.do and redirects into the quote flow. It does not describe a redirect only after eSTM Done.",
              sources: [ASK_INS],
              note: "prod code says",
            },
          ],
        },
        { text: "The 69E branch is a client-side check on estmResponseCode (doEstmAddonEnq calls getInsuranceQuote). Insurance uses its own transaction id, not the eSTM id.", sources: [FE_69E] },
        { text: "FI flow (69E path) shows all insurers. Non-FI flow with Approved eSTM shows only the top two.", sources: [{ kind: "miro", ref: "uXjVGih1g4s=" }] },
        { text: "Insurance free quote reaches Payment and Confirm only for the eSTM's own paid vehicle with the same buyer IC.", sources: [AZ_PORTAL] },
      ],
      scopeToCheck: [
        { text: "Every entry: 69E, eLKM unticked, details banner, after-completion redirect.", sources: [FE_69E] },
        { text: "Skip, Return to eSerahan and Continue with eSerahan both work.", sources: [FE_69E] },
        { text: "Insurer order per vehicle type and hire purchase record.", sources: [{ kind: "ts", ref: "10044_INS_TS01" }] },
        { text: "No reminder email for a 69E flow or for eSTM Failed.", sources: [{ kind: "ts", ref: "EAINT-11864 rules" }] },
        { text: "Insurance Listing (UCD, BO) shows the new insurance; receipt downloads from eSTM details.", sources: [{ kind: "ts", ref: "INS_RECEIPT_TS1" }] },
      ],
      tickets: [
        { key: "EAINT-11864", date: "2026-08", what: "Quotation reminder email. Automation paused 2026-08-13 pending team decisions.", state: "latest" },
        { key: "EAINT-8467", what: "Control quotation sequence on Get Quote page (GFQ, 69E, banner, after-eSTM entries).", state: "legacy", supersededBy: "EAINT-11977" },
        { key: "EAINT-11977", date: "2026-07", what: "Control sequence changed to amend date July 2026 and hide Tokio Marine (car).", state: "latest" },
        { key: "EAINT-8606", date: "2026-10", what: "Zurich Takaful added as new insurer; Miro flow shows 69E path.", state: "latest" },
      ],
      openQuestions: [
        "Is the insurance divert intended product behaviour or a side effect of the eVOC / eLKM upsell? (Azfar open question Q10.)",
        "What does VEL000069E mean to the end user? (Azfar open question Q7.)",
        "Real-API behaviour for 69E in production is not known; only simulator behaviour was tested.",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "estm-addons",
      name: "eLKM and eVOC add-ons at Step 5",
      summary: "Both add-ons are ticked by default in Step 5. They have their own price, rules and JPJ status.",
      portals: ["UCD portal", "Back Office"],
      triggers: [
        {
          id: "step5-addons",
          name: "Step 5 Payment page",
          entry: "eSTM › Step 5 Payment › eLKM and eVOC tick boxes",
          sources: [FE_STEP5, TS_8534],
          steps: [
            {
              title: "Choose eLKM period and eVOC",
              where: "eSTM › Step 5 › #lkm-addson-checkbox, #evoc-addson-checkbox",
              detail: "eLKM: 6 or 12 months. eVOC: price RM10 plus tax. Total changes when ticked or unticked.",
              affects: ["Payment amount", "BO eSTM listing export", "RHB Payment Transaction"],
              sources: [FE_STEP5, TS_8534],
            },
            {
              title: "Sub user cap check",
              where: "eSTM › Step 5 › Next",
              detail: "Sub UCD: RM2,000.00 is allowed. At RM2,000.01 eLKM is struck through and removed. Main UCD has no cap.",
              branches: [{ when: "Sub UCD over RM2,000", then: "\"Maximum LKM Amount RM2,000.00 per transaction, unable to proceed.\"" }],
              sources: [TS_8534],
            },
          ],
        },
      ],
      affects: [
        { text: "BO JPJ Enquiry (New) for eSTM shows LKM Yes/No, LKM Period (6 or 12 when Yes, 0 when No) and eVOC. Request XML ends like ~Y~6~Y.", sources: [TS_3677, { kind: "mine", ref: "knowledge/business-rules-from-test-scenarios.md §3 item 2" }] },
        { text: "BO eLKM Permission listing and log; eSTM user permission log.", sources: [{ kind: "azfar", ref: "knowledge/portals/backoffice/portal.md" }] },
        { text: "Kod Hasil on reconciliation: eLKM H0171105; eSTM H0272423.", sources: [{ kind: "azfar", ref: "cr/EAINT-10168/LEDGER.md" }] },
      ],
      cronjobs: [],
      roles: [
        { text: "eLKM permission tile eLKM PERMISSION (#lkmPermission) manages eLKM users, max 10.", sources: [FE, ASK_Q6] },
      ],
      afterCompletion: [
        { text: "eLKM and eVOC JPJ submissions run in the same batch job as the eSTM, each with own OK / Pending / Failed tracking.", sources: [ASK_Q6] },
        { text: "eVOC email goes to the eVOC email typed in Step 1.", sources: [FE] },
      ],
      rules: [
        {
          text: "eLKM costs about RM200 + RM2.75 processing in the staging tests. eVOC is RM10 + tax. Both cost real money in the tests.",
          sources: [FE_STEP5, { kind: "mine", ref: "knowledge/flow-quotation-reminder.md" }],
          alt: [{ text: "eLKM road tax renewal RM60 for 12 months. Total RM261.57 with both add-ons on, RM187.80 off (2026-09-17 walk).", sources: [AZ_PORTAL], note: "Azfar's figures from a different vehicle and date. Price depends on vehicle." }],
        },
        { text: "Use the addon-fee.get response for the fee check, not the page total.", sources: [FE_STEP5] },
        { text: "Fee change affects the \"Sure to make this payment now?\" dialog (#fis-amount-different-dialog, button OK).", sources: [FE_69E] },
      ],
      scopeToCheck: [
        { text: "Boundary values RM2,000.00 and RM2,000.01 for Sub and Main user.", sources: [TS_8534] },
        { text: "6 and 12 month periods; amount in RHB Payment, details page and BO listing export CSV.", sources: [TS_8534] },
        { text: "BO JPJ Enquiry (New) fields after an eSTM with and without eLKM and eVOC.", sources: [TS_3677] },
        { text: "Payment Breakdown Report rows for eLKM and eVOC.", sources: [{ kind: "ts", ref: "EAINT-3090 TS1-TS3" }] },
      ],
      tickets: [
        { key: "EAINT-8534", date: "2025-07", what: "Sub UCD eLKM max raised from RM500 to RM2,000.", state: "latest" },
        { key: "EAINT-3677", date: "2024-08", what: "BO JPJ Enquiry (New): eSTM updated for eLKM. Code Review.", state: "latest" },
        { key: "EAINT-3090", date: "2024-08", what: "Payment Breakdown Reports for BMK, TH, eLKM, eVOC.", state: "latest" },
        { key: "EAINT-4331", date: "2024-09", what: "BO BMK, HTM and eLKM listing payment filter fine-tuning. Requirement ready for review.", state: "latest" },
      ],
      openQuestions: ["Which price is right for eLKM when the sources differ (RM200 vs RM60 for 12 months)? It may depend on the vehicle."],
    },
    // ------------------------------------------------------------------
    {
      id: "estm-documents-hakmilik",
      name: "After payment: documents, Hak Milik and BO views",
      summary: "Documents made by an eSTM and the cronjob that retries a failed Butir-butir Hak Milik.",
      portals: ["UCD portal", "Back Office", "Service Portal"],
      triggers: [
        {
          id: "details-page",
          name: "eSTM details page (UCD)",
          entry: "UCD › eSERAHAN TRANSACTION LISTING › eSTM details page",
          sources: [FE_LIST, TS_4328],
          steps: [
            {
              title: "Open details and download documents",
              where: "eSTM Transaction Details",
              detail: "Invoice, JPJ Official Receipt, Slip Pengesahan, Butir-butir Hak Milik, e-Invoice (eSTM, eLKM, eVOC sections).",
              sources: [FE_LIST, TS_4328],
            },
          ],
        },
        {
          id: "bo-hakmilik",
          name: "BO eSTM listing: Hak Milik link",
          entry: "BO › eSTM Transaction Listing › Action › Hak Milik",
          sources: [TS_8523],
          steps: [
            {
              title: "Click Hak Milik when generation failed",
              where: "BO › eSTM Transaction Listing › Action",
              detail: "Shows \"Upload failed. Please retry.\" The cronjob later generates it and the link disappears.",
              sources: [TS_8523],
            },
          ],
        },
        {
          id: "ucd-hakmilik-tab",
          name: "UCD eSTM view: Butir-Butir Hak Milik tab",
          entry: "UCD › eSTM Transaction view › tab Butir-Butir Hak Milik",
          summary: "No user click starts Hak Milik. Two scheduled jobs create it after the eSTM is Approved. The dealer who ran the eSTM can view it here.",
          sources: [ASK_HM],
          steps: [
            {
              title: "Open the Hak Milik tab of an Approved eSTM",
              where: "UCD › eSTM Transaction view › Butir-Butir Hak Milik",
              detail: "Shows the record only after a job has saved it (claim flag, existing loan / hire-purchase lien, purchase method eAuto or JPJ Counter).",
              sources: [ASK_HM],
            },
          ],
        },
        {
          id: "credit-portal-hakmilik",
          name: "Credit / hire-purchase portal: Hak Milik link",
          entry: "Credit / Hire-Purchase company portal › eSTM search results › Hak Milik link (ServicePortalController)",
          summary: "Separate IP-restricted login, apart from UCD and BO. Read only.",
          sources: [ASK_HM],
          steps: [
            {
              title: "Open the Hak Milik detail page",
              where: "Credit portal › eSTM search results › Hak Milik",
              detail: "Shows claim status, existing loan and financier name, and the linked JPJ payment.",
              sources: [ASK_HM],
            },
          ],
        },
        {
          id: "bo-jpj-enquiry-new",
          name: "BO support: JPJ Enquiry (New) for eSTM",
          entry: "BO › Support Tools › JPJ Enquiry (New) › eSTM › Vehicle No › GET",
          sources: [TS_3677],
          steps: [
            {
              title: "Enter vehicle no and click GET",
              where: "BO › Support Tools › JPJ Enquiry (New)",
              detail: "New fields LKM, LKM Period and eVOC show.",
              sources: [TS_3677],
            },
          ],
        },
      ],
      affects: [
        { text: "Service Portal Ownership Claim listing shows Hak Milik flag J or E.", sources: [TS_8699] },
        { text: "Butir-butir Hak Milik new columns: Bil, Kod Terimaan, Kod Terimaan JPJ, No. Rujukan, Keterangan, Amaun(RM). Dari and Hingga were removed.", sources: [TS_4328] },
        { text: "Hak Milik is read by the Insurance module (a hire-purchase lien changes quote limits), by the Credit / Hire-Purchase portal and by the eSTM search index (eauto-elasticgateway) used by the UCD and credit-portal listings.", sources: [ASK_HM] },
        { text: "Old documents keep the old format: before Nov 2025 with an eBAYARAN JPJ page; Nov 2025 to Feb 2026 old format without it.", sources: [FE] },
      ],
      cronjobs: [
        { name: "Hak Milik generation", schedule: "Hourly (tester checked at :30 past the hour)", does: "Generates the Butir-butir Hak Milik for transactions where it failed. With eSIM STMS Enquiry code 4K the cronjob buys the document from JPJ (flag J).", sources: [TS_8523] },
        { name: "EstmHakmilikSubmissionJob", schedule: "Every 30 minutes, 8am-11pm (dev-edition config; prod timing not confirmed)", does: "Finds Approved eSTM transactions from the last 7 days that have no Hak Milik record and sends the JPJ reverse enquiry with the buyer's identity. Catch-up / retry pass: if JPJ does not answer OK, nothing is saved and it retries on the next run while the transaction is inside the window.", sources: [ASK_HM, ASK_Q6], unconfirmed: true },
        { name: "EstmHakMilikTriggerJob", schedule: "Every 3 hours, 9am-9pm (dev-edition config; prod timing not confirmed)", does: "Scans Approved eSTM transactions from the last 3 days that have no Hak Milik record and tries to create one.", sources: [ASK_HM, ASK_Q6], unconfirmed: true },
      ],
      roles: [
        { text: "BO users with eSTM listing access trigger Hak Milik. Some BO admin pages are limited by hardcoded user lists.", sources: [ASK_Q6] },
        { text: "No portal role starts the job-driven Hak Milik. It is viewed by the dealer who ran the eSTM (UCD) and by users of the Credit / Hire-Purchase portal, which has its own IP-restricted login.", sources: [ASK_HM] },
      ],
      afterCompletion: [
        { text: "Documents are on the UCD and BO details pages. Service Portal lists only Approved eSTM with Hak Milik.", sources: [TS_8699] },
        { text: "A saved Hak Milik shows on the Credit portal detail page and is added to the eSTM search index. No email, SMS or WhatsApp is sent when Hak Milik completes.", sources: [ASK_HM] },
      ],
      rules: [
        { text: "Slip Pengesahan shows the TEMPOH SAH LESEN KENDERAAN MOTOR table only if eLKM was included.", sources: [TS_4328] },
        { text: "Flag J = bought from JPJ by cronjob. Flag E = bought in the eSTM flow.", sources: [TS_8699] },
        { text: "Hak Milik has no status lifecycle. A record either exists or not. A job creates it only after the eSTM is Approved, using a JPJ reverse enquiry with the buyer's identity, and saves it only when JPJ answers with its success code.", sources: [ASK_HM] },
        { text: "Test setup for Hak Milik: the vehicle must not have 4K in STMS Enquiry in eSIM when the eSTM is created; set 4K after completion, then trigger.", sources: [TS_4328] },
      ],
      scopeToCheck: [
        { text: "New and old documents show their own format.", sources: [TS_4328] },
        { text: "Hak Milik link appears when generation failed and disappears after the cronjob.", sources: [TS_8523] },
        { text: "Service Portal flag J versus E.", sources: [TS_8699] },
        { text: "Test with eLKM and eVOC bought and not bought.", sources: [TS_8523] },
      ],
      tickets: [
        { key: "EAINT-4328", what: "Remove Dari and Hingga columns in Slip Pengesahan and Hak Milik (new eBAYARAN JPJ columns).", state: "latest" },
        { key: "EAINT-8523", what: "Cronjob to generate Butir-butir Hak Milik.", state: "latest" },
        { key: "EAINT-8699", what: "Service Portal Hak Milik flag J / E.", state: "latest" },
        { key: "EAINT-10102", date: "2026-03", what: "Production patch of an eSTM transaction (Tx Status P...).", state: "latest" },
      ],
      openQuestions: ["The Hak Milik cron schedule in production is not confirmed (TS says hourly; dev config says Submission job every 30 min 8am-11pm and Trigger job every 3 hours 9am-9pm).", "Flag J / E (TS wording) versus purchase method eAuto / JPJ Counter (prod code): same thing or different?"],
    },
    // ------------------------------------------------------------------
    {
      id: "estm-listing-retry",
      name: "eSTM listing and failed-payment retry",
      summary: "How a user finds an eSTM and retries a failed RHB payment.",
      portals: ["UCD portal", "Back Office"],
      triggers: [
        {
          id: "listing",
          name: "eSTM Transaction Listing",
          entry: "UCD › eSERAHAN › eSERAHAN TRANSACTION LISTING (not on the dashboard)",
          sources: [FE_LIST, { kind: "azfar", ref: "handover/team-repo-run-report.md" }],
          steps: [
            {
              title: "Search the listing",
              where: "UCD › /view/ucd/estm/enquiry/main.do",
              detail: "21 columns, filters incl. #isDraft. A failed payment row shows a.to-retry (reSubmitPayment).",
              sources: [FE_LIST],
            },
            {
              title: "Retry a failed payment",
              where: "Listing › Action › Resubmit",
              detail: "RHB remark \"RE - Sila TUNGGU 6 minit kemudian klik 'Resubmit'. Sistem RHB sedang diproses.\" means wait 6 minutes. It is not a defect.",
              branches: [{ when: "RHB code RE", then: "Wait 6 minutes, then Resubmit." }],
              sources: [FE_LIST],
            },
          ],
        },
      ],
      affects: [{ text: "BO JPJ Resubmission (eSTM) tool is used by staff for stuck transactions.", sources: [ASK_Q6] }],
      cronjobs: [],
      roles: [{ text: "UCD users with eSTM permission see own company transactions.", sources: [FE_LIST] }],
      afterCompletion: [{ text: "A retried payment that succeeds continues to Step 6 and Approved.", sources: [FE_LIST, ASK_Q6] }],
      rules: [
        { text: "Staging RHB codes via eSIM: OK success, IF insufficient funds, RE 6-minute wait, ER API down (about 12-minute cooldown). Only OK completes a transfer.", sources: [{ kind: "mine", ref: "knowledge/flow-edereg.md §5.3", date: "2026-09-14" }, { kind: "azfar", ref: "knowledge/portals/ucd/portal.md#RHB payment codes" }] },
      ],
      scopeToCheck: [
        { text: "Failed payment shows the right remark and a working retry.", sources: [FE_LIST] },
        { text: "Buyer name cut at 15 characters; 24-hour listing time.", sources: [FE_LIST] },
      ],
      tickets: [{ key: "EAINT-9727", date: "2026-01", what: "eSTM FI flow: reset payment handling. Code Review.", state: "latest" }],
      openQuestions: [],
    },
  ],
};
