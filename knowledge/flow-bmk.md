# BMK purchase (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/bmk.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- BMK is a 6-step purchase a UCD makes for a vehicle owner at JPJ. The owner is checked with MyKad and thumbprint (Step 1) and the dealer is checked the same way (Step 3). The user pays about RM30.80 by RHB. The exact long form of BMK is not written in any source. Jira ticket EAINT-12039 calls it "BMK (ownership book)". Nothing in the digests says what the JPJ item is beyond that.
- Portals: UCD portal, Back Office (eAuto Plus Relevant), JPJ, RHB
- Related modules: stms, payments-fees, platform, backoffice

## Glossary
- BMK: Not defined in the Azfar repo (open question "What is BMK?"). Jira EAINT-12039 title says "BMK (ownership book)". Long form is unconfirmed. [azfar: knowledge/portals/backoffice/open-questions.md] [jira: EAINT-12039]
- HTM: Not defined anywhere (unconfirmed). Appears in the BO listing name "BMK, HTM dan eLKM Transaction Listing". [azfar: knowledge/portals/backoffice/open-questions.md] [jira: EAINT-4331]
- eAuto Plus Relevant: Back Office menu group that holds the BMK Transaction page. Why BMK sits there is not known. [azfar: knowledge/portals/backoffice/portal.md] [azfar: knowledge/portals/backoffice/open-questions.md]
- eSIM prefix OU / OUP: Staging vehicle prefixes used for BMK. They have no BMK row but the enquiry still answers OK. RHB for them is IF, so a paid test needs an OK override (withRhbOk). [azfar: automation/src/flows/bmk.flow.ts]

## Flow: Purchase BMK (6 steps)
- Steps: 1 Owner, 2 Vehicle, 3 Dealer, 4 JPJ Check, 5 Payment, 6 Purchase. A BMK cannot be resumed. There is no Save & Continue Later on any step.
- Portals: UCD portal, JPJ, RHB

### Entry points and steps
- Entry point "UCD home tile BMK": UCD Portal › Home › BMK tile (#bmk, /view/ucd/bmk/view.do, shows RM30) › PURCHASE BMK [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub] [azfar: automation/src/flows/bmk.flow.ts]
  - The only way in found. Company permission BMK must be on.
  1. Open the BMK module and click PURCHASE BMK | where: UCD Home › BMK tile › #create-tx "PURCHASE BMK" | If the company has no BMK permission the home page shows #dialog-bmk-no-permission. A restricted company sees the Transaction Restriction notice. [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub] [mine: knowledge/flow-ucd-shell.md §Other home-page bits] [ts: EAINT-9044 STMS_TS1, TS2]
     - If Company has no BMK permission -> Error dialog and the user goes back to home.
     - If Transaction Restriction is Yes (EAINT-9044) -> Notice "You are currently restricted from creating transactions. Please contact eAuto at [hotline number omitted]."
  2. Choose the owner category | where: BMK › category tiles | Tiles: MyKad - MALAYSIAN, own company name, MyPR. Then "Owner Category ID" Yes / No. [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub]
  3. Step 1 Owner: owner consent and authentication | where: BMK › Step 1 Owner (bmk/transaction/auth-owner.do?category=1) | Text "PERAKUAN BMK - PEMILIK KENDERAAN". Type vehicle no (#vehicleRegNo), tick owner consent (#owner-consent), then the owner reads MyKad and thumbprint. | affects: Platform › MyKad / thumbprint reader [azfar: automation/src/flows/bmk.flow.ts] [mine: knowledge/business-rules-from-test-scenarios.md §15 item 4]
  4. Step 2 Vehicle | where: BMK › Step 2 Vehicle | Vehicle details are prefilled from JPJ. [azfar: automation/src/flows/bmk.flow.ts]
  5. Step 3 Dealer: dealer authentication | where: BMK › Step 3 Dealer | The logged-in user reads own MyKad and thumbprint. | affects: Platform › MyKad / thumbprint reader [azfar: automation/src/flows/bmk.flow.ts]
  6. Step 4 JPJ Check | where: BMK › Step 4 JPJ Check | JPJ enquiry runs (eSIM entity bmk-enquiry-resp on staging). Then Make Payment. [azfar: automation/src/flows/bmk.flow.ts]
  7. Step 5 Payment | where: BMK › Step 5 Payment | "Click Next to pay." Total RM30.80 on staging (2026-10-20). Next, then "Sure to submit this payment?" No / Yes. RHB direct debit. | affects: RHB direct debit [azfar: automation/src/flows/bmk.flow.ts] [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub]
  8. Step 6 Purchase result | where: BMK › Step 6 (bmk/transaction/jpj-sub.do?id=...) | "JPJ BMK Purchase Status:" shows SUCCESSFUL. A BMK email is sent (reaches Mailtrap on staging). [azfar: automation/src/flows/bmk.flow.ts] [mine: knowledge/mailtrap.md §1a]
- Entry point "BMK Transaction Listing (view an unpaid BMK)": UCD › BMK › BMK Transaction Listing (/view/ucd/bmk/enquiry/) [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub]
  - The listing is empty until the user searches. The only action found is View for an unpaid Pending BMK.
  1. Search and open a BMK | where: BMK Transaction Listing | View only. Resume is not possible. [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub]

### Cross-module effects (what it affects)
- Back Office BMK Transaction (eAuto Plus Relevant, /view/bmk/enquiry/main.do) and BO RHB Payment Transaction (eAuto Plus). [azfar: knowledge/portals/backoffice/portal.md] [mine: knowledge/flow-bo-shell.md]
- BO JPJ XML Log (BMK) at /view/bmk/jpj/log. [mine: knowledge/jpj-xml-log.md] [jira: EAINT-684]
- BO JPJ Reports: BMK / HTM / eLKM transaction listing. [azfar: knowledge/portals/backoffice/portal.md] [jira: EAINT-4331]
- UCD Payment Report, Payment Breakdown Report (type BMK) and Download Payment Document. Payments grouped with TH, eLKM, eVOC, SSM, JomCheck. [ts: EAINT-3090 TS1-TS3] [ts: EAINT-7496 F_TS1, F_TS3]
- Reconciliation: Kod Hasil H0272404 covers BMK, TH and eDereg Pre-Checking. [azfar: cr/EAINT-10168/LEDGER.md]
- JPJ Official Receipt covers BMK (EAINT-9204). JPJ enquiry and final submission send BRN for BMK (EAINT-8622). [jira: EAINT-9204] [jira: EAINT-8622]
- e-Invoice and invoice templates include BMK. [ts: EAINT-8659] [ts: EAINT-8550 TS1-TS12]
- Firefox Browser Reminder (EAINT-12253) shows at the last BMK step. [azfar: knowledge/portals/ucd/portal.md] [jira: EAINT-12253]

### Cronjobs
- [unconfirmed] Unpaid BMK auto-cancel | Not recorded (one example cancelled at 20:20) | Cancels unpaid BMK drafts. Seen as "AUTO CANCELLED BY eAuto on 20-10-2026 20:20" on a BMK ref. [azfar: knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires] [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub]

### Roles
- UCD company with the BMK permission. BMK is ticked by default for new and edited companies (EAINT-9233). [azfar: cr/EAINT-9233/LEDGER.md] [mine: knowledge/business-rules-from-test-scenarios.md §10 item 8]
- Thumbprint is needed at Step 1 (owner) and Step 3 (dealer). [azfar: cr/EAINT-7229/LEDGER.md]
- Back Office users see BMK under eAuto Plus Relevant. Hub Admin sees the JPJ XML Log (BMK). [azfar: knowledge/portals/backoffice/portal.md] [mine: knowledge/jpj-xml-log.md]

### Where the transaction goes
- BMK Transaction Listing (UCD) and the Step 6 page. Staff see it in BO BMK Transaction. [azfar: automation/src/flows/bmk.flow.ts] [azfar: knowledge/portals/backoffice/portal.md]
- JPJ gets the BMK purchase. JPJ revenue code 2910001 is shared with eSTM. [mine: knowledge/jpj-xml-log.md]

### Rules
- A BMK cannot be resumed. There is no Save & Continue Later on any step. [azfar: automation/src/flows/bmk.flow.ts]
- Fee on staging: tile RM30. Total RM30.80 on 2026-10-20. Fee history in the CR scripts: BMK JPJ RM20 + eAuto RM10 + 0.80 tax. [azfar: automation/src/flows/bmk.flow.ts] [azfar: knowledge/portals/ucd/portal.md#BMK, Service Hub]
  - Conflict: other version: BMK JPJ RM20 + eAuto RM10 + SST 0.80 (= RM30.80). [mine: knowledge/business-rules-from-test-scenarios.md (fee history)] (Same total; this version gives the split. Azfar did not record the SST breakdown.)
- Staging: eSIM entities bmk-enquiry-resp and bmk-submission-resp answer by vehicle prefix. OU and OUP have no row but the enquiry still answers OK. [azfar: automation/src/flows/bmk.flow.ts]
- Production regression stops at Step 4 (first JPJ enquiry only, random plate, JPJ fails on purpose). [mine: knowledge/production-regression-scope.md]
- Unpaid BMK drafts are auto-cancelled overnight on staging. STMS, eSTM, APT, Insurance and JomCheck pending ones survive. [azfar: knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires]
- Transaction Restriction popup applies to BMK create actions. [ts: EAINT-9044 STMS_TS1, TS2]

### QA scope to check
- All 6 steps for MyKad, own company and MyPR owner. [azfar: automation/src/flows/bmk.flow.ts]
- Permission off: BMK tile shows the no-permission dialog. [mine: knowledge/flow-ucd-shell.md §Other home-page bits]
- Restricted company popup. [ts: EAINT-9044]
- Payment failure (IF) and success; Step 6 status and BMK email. [azfar: automation/src/flows/bmk.flow.ts]
- BO BMK Transaction, RHB Payment Transaction and the BMK JPJ XML Log show the new row. [azfar: knowledge/portals/backoffice/portal.md] [mine: knowledge/jpj-xml-log.md]
- Payment Breakdown Report, UCD Payment Report and Download Payment Document include BMK. [ts: EAINT-3090 TS1-TS3]
- Invoice, e-Invoice and JPJ Official Receipt for BMK. [ts: EAINT-8659] [jira: EAINT-9204]
- Reconciliation and the BO BMK / HTM / eLKM listing payment filter. [jira: EAINT-4331]
- Browser Reminder at the final step in Firefox after EAINT-12253 goes live. [jira: EAINT-12253]

### Ticket history
- EAINT-12253 (2026-10): Browser Reminder at last step (BMK Step 6). Testing in 1st env. [latest]
- EAINT-9204 (2025-11): JPJ Official Receipt covers BMK. Done 2026-10-20. Mobile twin EAINT-12559 To Do. [latest]
- EAINT-7229 (2025-12): Chrome WebSocket for thumbprint pages (BMK Step 1 and Step 3). [latest]
- EAINT-9233 (2026-01): BMK permission default ticked. [latest]
- EAINT-3090 (2024-08): Payment Breakdown Reports: BMK, TH, eLKM and eVOC. Done 2026-05. [latest]
- EAINT-1432: Earlier payment report ticket. [legacy, superseded by EAINT-3090]
- EAINT-4331 (2024-09): BO BMK, HTM and eLKM transaction listing payment filter fine-tuning. Requirement ready for review. [latest]
- EAINT-684 (2024-03): JPJ XML Log (BMK). Done 2026-07. [latest]
- EAINT-4873 (2024-10): BMK CSV file: RHB ID (eauto) behaviour. Done. [latest]
- EAINT-2684 (2024-07): BMK company category cannot show UCD phone number. To Do. [latest]
- EAINT-12039 (2026-07): Backlog: BMK reference number generation hardened (unique, no duplicates). To Do. [latest]
- EAINT-8622 (2025-07): BRN sent in JPJ enquiry and final submission (BMK included). Done 2026-10-21. [latest]
- EAINT-12525 (2026-10): What's New popup: BMK video replaced by the LKM Refund tutorial. [latest]

### Open questions
- What does BMK stand for? Only "ownership book" appears in a Jira title.
- Why does BMK sit under eAuto Plus Relevant in Back Office?
- Prod code answer (Ask eAuto Q11) not received yet. This flow is from Azfar's staging walk only; Faizuddin has no deep BMK work.
- Time and schedule of the auto-cancel cron are not recorded.
- Miro board uXjVI5VpoXA= (BMK SnF) was blocked (no access) and is unread.
