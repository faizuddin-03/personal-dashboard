import type { Module, Source } from "../types";

const AZ_PORTAL: Source = { kind: "azfar", ref: "knowledge/portals/ucd/portal.md#BMK, Service Hub" };
const AZ_FLOW: Source = { kind: "azfar", ref: "automation/src/flows/bmk.flow.ts" };
const AZ_BO: Source = { kind: "azfar", ref: "knowledge/portals/backoffice/portal.md" };
const AZ_OPEN: Source = { kind: "azfar", ref: "knowledge/portals/backoffice/open-questions.md" };
const AZ_TEST: Source = { kind: "azfar", ref: "knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires" };
const MINE_FEES: Source = { kind: "mine", ref: "knowledge/business-rules-from-test-scenarios.md (fee history)" };
const MINE_XML: Source = { kind: "mine", ref: "knowledge/jpj-xml-log.md" };
const ASK: Source = { kind: "askeauto", ref: "prod code 0e21bef3 — BMK purchase answer (BmkTransactionExpiredJob, BmkFilter, BmkTransaction)", date: "2026-10-23" };
const MINE_SHELL: Source = { kind: "mine", ref: "knowledge/flow-ucd-shell.md §Other home-page bits" };

export const bmk: Module = {
  id: "bmk",
  name: "BMK purchase",
  short: "BMK",
  portals: ["UCD portal", "Back Office (eAuto Plus Relevant)", "JPJ", "RHB"],
  summary:
    "BMK is a 6-step purchase a UCD makes for a vehicle owner at JPJ. The owner is checked with MyKad and thumbprint (Step 1) and the dealer is checked the same way (Step 3). The user pays about RM30.80 by RHB. BMK means Butiran Maklumat Kenderaan (vehicle information details). It is an official JPJ vehicle-ownership document, sent to the owner's JPJ-registered email.",
  related: ["stms", "payments-fees", "platform", "backoffice"],
  glossary: [
    { term: "BMK", meaning: "Butiran Maklumat Kenderaan (\"vehicle information details\"). An official JPJ vehicle-ownership document bought by a UCD for RM30 and sent to the owner's JPJ-registered email.", sources: [ASK] },
    { term: "BMK (old guess)", meaning: "Long form was not defined. Jira EAINT-12039 title says \"BMK (ownership book)\". Kept as the old guess; replaced by Butiran Maklumat Kenderaan.", sources: [AZ_OPEN, { kind: "jira", ref: "EAINT-12039" }] },
    { term: "HTM", meaning: "JPJ-facing label for Transfer History (code name OTH, also shown as TH): a paid optional JPJ check that shows how many times a vehicle changed hands recently. Appears in the BO listing name \"BMK, HTM dan eLKM Transaction Listing\". The long Malay form is not in the code.", sources: [{ kind: "askeauto", ref: "prod code 0e21bef3 — Transfer History and Hak Milik answer", date: "2026-10-23" }, AZ_OPEN, { kind: "jira", ref: "EAINT-4331" }] },
    { term: "POB", meaning: "Pay On Behalf (also called Payment On Behalf in one internal note). Old split-payment method: the fee is split into two bank debits, dealer to eAuto and dealer to JPJ. Marked discontinued (sunset) in the knowledge notes, but the flag and handling code remain (PaymentMethod.POB, allowPOB, CompanyPOBBalanceReportController). Treat as legacy.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }] },
    { term: "eAuto Plus", meaning: "Product name for a bundle of add-on services on top of the core system: BMK, OTH, LKM, eVOC, JomCheck and others. Seen as the BO menu group eAuto Plus Relevant and in report names such as RHB Payment Transaction (eAuto Plus). Not an acronym. This also answers why BMK sits under eAuto Plus Relevant: BMK is one of the Plus services.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — BMK, HTM, POB, eAuto Plus and PBT answer", date: "2026-10-23" }] },
    { term: "eAuto Plus Relevant", meaning: "Back Office menu group that holds the BMK Transaction page. Why BMK sits there is not known.", sources: [AZ_BO, AZ_OPEN] },
    { term: "eSIM prefix OU / OUP", meaning: "Staging vehicle prefixes used for BMK. They have no BMK row but the enquiry still answers OK. RHB for them is IF, so a paid test needs an OK override (withRhbOk).", sources: [AZ_FLOW] },
  ],
  flows: [
    {
      id: "bmk-purchase",
      name: "Purchase BMK (6 steps)",
      summary:
        "Steps: 1 Owner, 2 Vehicle, 3 Dealer, 4 JPJ Check, 5 Payment, 6 Purchase. A BMK cannot be resumed. There is no Save & Continue Later on any step.",
      portals: ["UCD portal", "JPJ", "RHB"],
      triggers: [
        {
          id: "home-tile",
          name: "UCD home tile BMK",
          entry: "UCD Portal › Home › BMK tile (#bmk, /view/ucd/bmk/view.do, shows RM30) › PURCHASE BMK",
          summary: "The only way in found. Company permission BMK must be on.",
          sources: [AZ_PORTAL, AZ_FLOW],
          steps: [
            {
              title: "Open the BMK module and click PURCHASE BMK",
              where: "UCD Home › BMK tile › #create-tx \"PURCHASE BMK\"",
              detail: "If the company has no BMK permission the home page shows #dialog-bmk-no-permission. A restricted company sees the Transaction Restriction notice.",
              branches: [
                { when: "Company has no BMK permission", then: "Error dialog and the user goes back to home." },
                { when: "Transaction Restriction is Yes (EAINT-9044)", then: "Notice \"You are currently restricted from creating transactions. Please contact eAuto at 03-27798899.\"" },
              ],
              sources: [AZ_PORTAL, MINE_SHELL, { kind: "ts", ref: "EAINT-9044 STMS_TS1, TS2" }],
            },
            {
              title: "Choose the owner category",
              where: "BMK › category tiles",
              detail: "Tiles: MyKad - MALAYSIAN, own company name, MyPR. Then \"Owner Category ID\" Yes / No.",
              sources: [AZ_PORTAL],
            },
            {
              title: "Step 1 Owner: owner consent and authentication",
              where: "BMK › Step 1 Owner (bmk/transaction/auth-owner.do?category=1)",
              detail: "Text \"PERAKUAN BMK - PEMILIK KENDERAAN\". Type vehicle no (#vehicleRegNo), tick owner consent (#owner-consent), then the owner reads MyKad and thumbprint.",
              affects: ["Platform › MyKad / thumbprint reader"],
              sources: [AZ_FLOW, { kind: "mine", ref: "knowledge/business-rules-from-test-scenarios.md §15 item 4" }],
            },
            {
              title: "Step 2 Vehicle",
              where: "BMK › Step 2 Vehicle",
              detail: "Vehicle details are prefilled from JPJ.",
              sources: [AZ_FLOW],
            },
            {
              title: "Step 3 Dealer: dealer authentication",
              where: "BMK › Step 3 Dealer",
              detail: "The logged-in user reads own MyKad and thumbprint.",
              affects: ["Platform › MyKad / thumbprint reader"],
              sources: [AZ_FLOW],
            },
            {
              title: "Step 4 JPJ Check",
              where: "BMK › Step 4 JPJ Check",
              detail: "JPJ enquiry runs (eSIM entity bmk-enquiry-resp on staging). Then Make Payment.",
              sources: [AZ_FLOW],
            },
            {
              title: "Step 5 Payment",
              where: "BMK › Step 5 Payment",
              detail: "\"Click Next to pay.\" Total RM30.80 on staging (2026-10-20). Next, then \"Sure to submit this payment?\" No / Yes. RHB direct debit.",
              affects: ["RHB direct debit"],
              sources: [AZ_FLOW, AZ_PORTAL],
            },
            {
              title: "Step 6 Purchase result",
              where: "BMK › Step 6 (bmk/transaction/jpj-sub.do?id=...)",
              detail: "\"JPJ BMK Purchase Status:\" shows SUCCESSFUL. A BMK email is sent (reaches Mailtrap on staging).",
              sources: [AZ_FLOW, { kind: "mine", ref: "knowledge/mailtrap.md §1a" }],
            },
          ],
        },
        {
          id: "bmk-listing",
          name: "BMK Transaction Listing (view an unpaid BMK)",
          entry: "UCD › BMK › BMK Transaction Listing (/view/ucd/bmk/enquiry/)",
          summary: "The listing is empty until the user searches. The only action found is View for an unpaid Pending BMK.",
          sources: [AZ_PORTAL],
          steps: [
            {
              title: "Search and open a BMK",
              where: "BMK Transaction Listing",
              detail: "View only. Resume is not possible.",
              sources: [AZ_PORTAL],
            },
          ],
        },
      ],
      affects: [
        { text: "Back Office BMK Transaction (eAuto Plus Relevant, /view/bmk/enquiry/main.do) and BO RHB Payment Transaction (eAuto Plus).", sources: [AZ_BO, { kind: "mine", ref: "knowledge/flow-bo-shell.md" }] },
        { text: "BO JPJ XML Log (BMK) at /view/bmk/jpj/log.", sources: [MINE_XML, { kind: "jira", ref: "EAINT-684" }] },
        { text: "BO JPJ Reports: BMK / HTM / eLKM transaction listing.", sources: [AZ_BO, { kind: "jira", ref: "EAINT-4331" }] },
        { text: "UCD Payment Report, Payment Breakdown Report (type BMK) and Download Payment Document. Payments grouped with TH, eLKM, eVOC, SSM, JomCheck.", sources: [{ kind: "ts", ref: "EAINT-3090 TS1-TS3" }, { kind: "ts", ref: "EAINT-7496 F_TS1, F_TS3" }] },
        { text: "Reconciliation: Kod Hasil H0272404 covers BMK, TH and eDereg Pre-Checking.", sources: [{ kind: "azfar", ref: "cr/EAINT-10168/LEDGER.md" }] },
        { text: "JPJ Official Receipt covers BMK (EAINT-9204). JPJ enquiry and final submission send BRN for BMK (EAINT-8622).", sources: [{ kind: "jira", ref: "EAINT-9204" }, { kind: "jira", ref: "EAINT-8622" }] },
        { text: "e-Invoice and invoice templates include BMK.", sources: [{ kind: "ts", ref: "EAINT-8659" }, { kind: "ts", ref: "EAINT-8550 TS1-TS12" }] },
        { text: "Firefox Browser Reminder (EAINT-12253) shows at the last BMK step.", sources: [{ kind: "azfar", ref: "knowledge/portals/ucd/portal.md" }, { kind: "jira", ref: "EAINT-12253" }] },
      ],
      cronjobs: [
        {
          name: "BmkTransactionExpiredJob (unpaid BMK auto-cancel)",
          schedule: "Dev-edition config: 0 20 8,10,12,14,16,18,20,22 * * ? (every 2 hours at :20, 8am-10pm). Prod schedule file is withheld and the job inventory lists it as Disabled.",
          does: "Cancels BMK transactions that are unpaid, or stuck after the JPJ enquiry, for more than 30 minutes. Sets transactionStatus = Cancelled. Seen as \"AUTO CANCELLED BY eAuto on 20-10-2026 20:20\" on a BMK ref.",
          sources: [{ kind: "askeauto", ref: "prod code 0e21bef3 — BmkTransactionExpiredJob / BmkTransactionExpiredHandler", date: "2026-10-23" }, AZ_TEST, AZ_PORTAL],
          unconfirmed: true,
        },
      ],
      roles: [
        { text: "UCD company with the BMK permission. BMK is ticked by default for new and edited companies (EAINT-9233).", sources: [{ kind: "azfar", ref: "cr/EAINT-9233/LEDGER.md" }, { kind: "mine", ref: "knowledge/business-rules-from-test-scenarios.md §10 item 8" }] },
        { text: "Code gate: company flag bmkPermission is on, and the user is the company primary user or has the toAcceptBmk permission. The company BMK flag can only be switched by a hardcoded admin list (AuthorizedUserList).", sources: [ASK] },
        { text: "Back Office staff can only view BMK Transaction. Resubmit JPJ Final Submission - BMK needs the HubAdmin role.", sources: [ASK] },
        { text: "Thumbprint is needed at Step 1 (owner) and Step 3 (dealer).", sources: [{ kind: "azfar", ref: "cr/EAINT-7229/LEDGER.md" }] },
        { text: "Back Office users see BMK under eAuto Plus Relevant. Hub Admin sees the JPJ XML Log (BMK).", sources: [AZ_BO, MINE_XML] },
      ],
      afterCompletion: [
        { text: "BMK Transaction Listing (UCD) and the Step 6 page. Staff see it in BO BMK Transaction.", sources: [AZ_FLOW, AZ_BO] },
        { text: "JPJ gets the BMK purchase. JPJ revenue code 2910001 is shared with eSTM.", sources: [MINE_XML] },
        { text: "There is no separate submit click. Make Payment (make-payment.do) runs the RHB payment, a second JPJ enquiry and the JPJ submission in one handler chain, then goes to the result page and the UCD home page.", sources: [ASK] },
        { text: "A JPJ receipt record is saved with the JPJ receipt number. An e-Invoice event goes to eauto-einvoice. eauto-elasticgateway reads the payment for the BO Plus RHB payment listing. No email, SMS or WhatsApp from eauto-notification was found for BMK.", sources: [ASK] },
      ],
      rules: [
        { text: "A BMK cannot be resumed. There is no Save & Continue Later on any step.", sources: [AZ_FLOW] },
        { text: "Fee on staging: tile RM30. Total RM30.80 on 2026-10-20. Fee history in the CR scripts: BMK JPJ RM20 + eAuto RM10 + 0.80 tax.", sources: [AZ_FLOW, AZ_PORTAL], alt: [{ text: "BMK JPJ RM20 + eAuto RM10 + SST 0.80 (= RM30.80).", sources: [MINE_FEES], note: "Same total; this version gives the split. Azfar did not record the SST breakdown." }] },
        { text: "Staging: eSIM entities bmk-enquiry-resp and bmk-submission-resp answer by vehicle prefix. OU and OUP have no row but the enquiry still answers OK.", sources: [AZ_FLOW] },
        { text: "Production regression stops at Step 4 (first JPJ enquiry only, random plate, JPJ fails on purpose).", sources: [{ kind: "mine", ref: "knowledge/production-regression-scope.md" }] },
        { text: "Unpaid BMK drafts are auto-cancelled overnight on staging. STMS, eSTM, APT, Insurance and JomCheck pending ones survive.", sources: [AZ_TEST], alt: [{ text: "BmkTransactionExpiredJob cancels BMK that is unpaid or stuck after the JPJ enquiry for more than 30 minutes, on a 2-hour cycle (dev config), not only overnight.", sources: [ASK], note: "prod code says" }] },
        { text: "Statuses: transactionStatus New (draft saved) → Pending → Approved (only after payment is Paid and JPJ submission is Approved) or Failed (JPJ submission fails after payment; then a Hub Admin can resubmit). Draft, Cancelled (expiry job or manual) and Expired can also occur. Payment: New/Pending/Created/Submitted → Paid, or Failed/Error/Aborted, ToRefund/Refunded. JPJ (lastJpjEnqStatus, lastJpjSecondEnqStatus, lastJpjSubStatus): New → Pending → Passed/Approved or Failed.", sources: [ASK] },
        { text: "Transaction Restriction popup applies to BMK create actions.", sources: [{ kind: "ts", ref: "EAINT-9044 STMS_TS1, TS2" }] },
      ],
      scopeToCheck: [
        { text: "All 6 steps for MyKad, own company and MyPR owner.", sources: [AZ_FLOW] },
        { text: "Permission off: BMK tile shows the no-permission dialog.", sources: [MINE_SHELL] },
        { text: "Restricted company popup.", sources: [{ kind: "ts", ref: "EAINT-9044" }] },
        { text: "Payment failure (IF) and success; Step 6 status and BMK email.", sources: [AZ_FLOW] },
        { text: "BO BMK Transaction, RHB Payment Transaction and the BMK JPJ XML Log show the new row.", sources: [AZ_BO, MINE_XML] },
        { text: "Payment Breakdown Report, UCD Payment Report and Download Payment Document include BMK.", sources: [{ kind: "ts", ref: "EAINT-3090 TS1-TS3" }] },
        { text: "Invoice, e-Invoice and JPJ Official Receipt for BMK.", sources: [{ kind: "ts", ref: "EAINT-8659" }, { kind: "jira", ref: "EAINT-9204" }] },
        { text: "Reconciliation and the BO BMK / HTM / eLKM listing payment filter.", sources: [{ kind: "jira", ref: "EAINT-4331" }] },
        { text: "Browser Reminder at the final step in Firefox after EAINT-12253 goes live.", sources: [{ kind: "jira", ref: "EAINT-12253" }] },
      ],
      tickets: [
        { key: "EAINT-12253", date: "2026-10", what: "Browser Reminder at last step (BMK Step 6). Testing in 1st env.", state: "latest" },
        { key: "EAINT-9204", date: "2025-11", what: "JPJ Official Receipt covers BMK. Done 2026-10-20. Mobile twin EAINT-12559 To Do.", state: "latest" },
        { key: "EAINT-7229", date: "2025-12", what: "Chrome WebSocket for thumbprint pages (BMK Step 1 and Step 3).", state: "latest" },
        { key: "EAINT-9233", date: "2026-01", what: "BMK permission default ticked.", state: "latest" },
        { key: "EAINT-3090", date: "2024-08", what: "Payment Breakdown Reports: BMK, TH, eLKM and eVOC. Done 2026-05.", state: "latest" },
        { key: "EAINT-1432", what: "Earlier payment report ticket.", state: "legacy", supersededBy: "EAINT-3090" },
        { key: "EAINT-4331", date: "2024-09", what: "BO BMK, HTM and eLKM transaction listing payment filter fine-tuning. Requirement ready for review.", state: "latest" },
        { key: "EAINT-684", date: "2024-03", what: "JPJ XML Log (BMK). Done 2026-07.", state: "latest" },
        { key: "EAINT-4873", date: "2024-10", what: "BMK CSV file: RHB ID (eauto) behaviour. Done.", state: "latest" },
        { key: "EAINT-2684", date: "2024-07", what: "BMK company category cannot show UCD phone number. To Do.", state: "latest" },
        { key: "EAINT-12039", date: "2026-07", what: "Backlog: BMK reference number generation hardened (unique, no duplicates). To Do.", state: "latest" },
        { key: "EAINT-8622", date: "2025-07", what: "BRN sent in JPJ enquiry and final submission (BMK included). Done 2026-10-21.", state: "latest" },
        { key: "EAINT-12525", date: "2026-10", what: "What's New popup: BMK video replaced by the LKM Refund tutorial.", state: "latest" },
      ],
      openQuestions: [
        "Is BmkTransactionExpiredJob enabled in production? Dev config has a schedule but the job inventory says Disabled and the prod scheduler file was withheld.",
        "What does PBT expand to in code? Prod code does not spell it out (only the Malay term Pihak Berkuasa Tempatan fits the context, unconfirmed).",
        "Miro board uXjVI5VpoXA= (BMK SnF) was blocked (no access) and is unread.",
      ],
    },
  ],
};
