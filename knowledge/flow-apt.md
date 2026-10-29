# APT (Automatic Permanent Transfer) (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/apt.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- APT lets a dealer view and pay for vehicles that have been held under STMS for 6 months or more. The dealer never starts an APT. It is created from JPJ notices 5.5 and 6.0, or by a BO manual trigger. The dealer then pays at Step 5 and JPJ makes the transfer permanent.
- Portals: UCD Portal, Back Office, JPJ (notices 5.5 and 6.0), RHB (payment), Cronjob
- Related modules: stms, ucd-to-ucd, payments-fees, estm, wholesale, backoffice

## Glossary
- APT: Automatic Permanent Transfer. Moves a vehicle from STMS (temporary) to permanent ownership of the dealer. [azfar: eauto-qa-azfar:knowledge/_core/apt.md] [jira: EAINT-12403 SRD v1.1 §1.4 #2]
- JPJ Notice 5.5: The expiry notice. It creates the APT with status New. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT]
- JPJ Notice 6.0: The permanent transfer notice. It moves the APT to Pending and makes it payable. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT]
- VEL000392E: The eSim vehicle prefix / JPJ code used to make an eSTM create an APT and to make the cronjob retry. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [ts: EAINT-8668 8668_APT_TS1]
- Reset Payment: A BO action that clears a failed payment so the dealer can pay again at the current price. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]

## Flow: How an APT is created
- The dealer never starts an APT. JPJ notices, a BO manual trigger, an eSTM, or a Wholesale booking fee create it.
- Portals: Back Office, JPJ (external), System

### Entry points and steps
- Entry point "JPJ notices 5.5 then 6.0": System: JPJ expiry notice handler [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#APT — mapped] [askeauto: 07-ask-eauto.md Q3 §3.3 (prod/master 0e21bef3) 2026-10-23]
  - eAuto matches each notice line to an existing STMS of the same vehicle and dealer company.
  1. Notice 5.5 creates the APT | where: System (JpjExpiryNotificationJob, daily about 5am) | The APT is created with status New and a reference starting APT. Prod code says this job also turns an aging STMS into an APT. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [askeauto: 07-ask-eauto.md Q3 §3.3 (prod/master 0e21bef3) 2026-10-23]
  2. Notice 6.0 makes it payable | where: System | Status moves to Pending. The pay link shows only when the 6.0 notice date is present and the transaction is not Cancelled or Expired. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#APT — mapped]
- Entry point "BO Manual APT Trigger": BO › Support Tools › Manual APT Trigger (view/stms/manual-trigger-apt) [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#Making one appear without waiting] [ts: EAINT-12289 12289_E2E1] [ts: EAINT-8668 8668_APT_TS1]
  - Used by QA and support to make an APT appear without waiting for JPJ.
  1. Search the company and vehicle | where: BO › Support Tools › Manual APT Trigger | Search by company ROC and vehicle. Pick the Expiry Date (read-only date picker). [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#Making one appear without waiting]
     - If No expiry date picked -> 'Please key in expiry date before proceed trigger JPJ APT 5.5'.
  2. Trigger 5.5, then 6.0 | where: BO › Manual APT Trigger | Each button is one-shot. 5.5 creates the APT at New. 6.0 moves it to Pending. The trigger writes a support audit-log entry. | affects: APT listing (UCD); Support audit log [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#Making one appear without waiting] [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT]
- Entry point "Trigger by endpoint": POST /ajax/estm/transaction/triggerAPT.do (vehicleRegNo + ucdCompanyId) [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#Making one appear without waiting]
  - Does both notices in one call. Test use.
  1. Call the endpoint | where: Back end | Sends vehicleRegNo and ucdCompanyId. Does notice 5.5 and 6.0. [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#Making one appear without waiting]
- Entry point "STMS approved, eSTM with VEL000392E, Wholesale booking fee": Other flows [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [ts: EAINT-12289 12289_E2E3, 12289_R2]
  1. An approved STMS is the normal route | where: UCD › STMS | After JPJ sends the notices, the STMS vehicle becomes an APT. | affects: STMS [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT]
  2. eSTM with code VEL000392E | where: UCD › eSTM | Needs a completed STMS on the same vehicle first. The vehicle then shows in the APT Transaction Listing. | affects: eSTM [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [ts: EAINT-12289 12289_E2E3]
  3. Wholesale booking fee | where: Wholesale | Wholesale counts as STMS for APT. The seller booking fee includes the APT value (eSim STMS response code 4Z). | affects: Wholesale [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [ts: EAINT-12289 12289_R2]
- Entry point "APT 6.0 auto-trigger": System: when the transaction reaches 6 months [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [jira: EAINT-12403 SRD §1.4 #7] [mine: 02b business-rules §1.2 item 8]
  - Same job as the resubmit cronjob, not a separate one.
  1. System performs the APT at 6 months | where: Cronjob | An APT created after STMS approval is submitted by the cronjob with no UCD action. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT] [mine: 02b business-rules §1.2 item 8] [ts: EAINT-12289 12289_R3]

### Cross-module effects (what it affects)
- APT listing (UCD) and BO APT Transaction Enquiry. Columns: Expiry Date 5.5, Expiry Date 6.0, Payment, JPJ Transfer, Tx Status, e-Invoice Status, Remarks. [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#APT — mapped]
- BO JPJ XML Log (APT). [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md]

### Cronjobs
- [unconfirmed] JpjExpiryNotificationJob | Daily, about 5am (dev-reference config; prod file withheld) | Sends JPJ expiry notices. Turns an aging STMS into an APT. [askeauto: 07-ask-eauto.md Q3 §3.3 (prod/master 0e21bef3) 2026-10-23]

### Roles
- BO Manual APT Trigger menu: SuperAdmin and Hub Admin. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [ts: EAINT-10038]

### Where the transaction goes
- An APT row at status New (5.5) or Pending (6.0) in the dealer's APT listing. The dealer pays from there. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT]

### Rules
- All routes in are priced the same, at the configuration in force when payment runs. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#How a vehicle reaches APT]
- The 6-month rule is JPJ's. Azfar's code reading found no 6-month check in eAuto. The Perakuan text says 6 months. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Rules still unsettled]
  - Conflict: other version: After roughly 6 months of temporary ownership an APT is auto-created by the expiry notification job. [askeauto: 07-ask-eauto.md Q3 §5.4 (prod/master 0e21bef3) 2026-10-23] [askeauto: 07-ask-eauto.md Q3 §3.3 (prod/master 0e21bef3) 2026-10-23] (prod code says)

### QA scope to check
- Create an APT each way: STMS then manual trigger 5.5 and 6.0, eSTM with VEL000392E, Wholesale booking fee, 6.0 auto by cronjob. [ts: EAINT-12289 12289_E2E1, E2E3, R2, R3]
- Check the Manual APT Trigger menu is visible only to SuperAdmin and Hub Admin. [ts: EAINT-10038]

### Ticket history
- EAINT-12289 (2026-09): APT fee RM15 to RM20. Entry points tested. [legacy, superseded by EAINT-12403]
- EAINT-12403 (2026-10): APT fee RM20 to RM25 and reset Failed/Failed. [latest]
- EAINT-8668 (2025-08): Cronjob resubmits failed APT payments. [latest]

### Open questions
- Timing of JPJ notices 5.5 and 6.0 is JPJ's decision. No eAuto document defines it.
- Ask eAuto Q5 (APT from JPJ notices) has not arrived yet. A later pass should add the prod code view.

## Flow: Dealer pays an APT (Step 5 and Step 6)
- The dealer opens the APT listing, searches, clicks Resubmit and pays at Step 5. JPJ transfer follows as a batch.
- Portals: UCD Portal, RHB (payment), JPJ (external)

### Entry points and steps
- Entry point "APT tile on UCD Home": UCD Home › APT tile (view/ucd/apt/enquiry/) › Search Now › row Resubmit [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#The journey is two steps] [azfar: eauto-qa-azfar:knowledge/_core/apt.md]
  - There is no create button. The list is empty until searched.
  1. Open the APT listing and search | where: UCD › APT | Tile shows 'RM125' (JPJ 100 + eAuto 25, before 8% tax). The list is empty until Search Now. Preconditions: same company (and same branch if branch-restricted), active RHB account, and the 6.0 date present. [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#Preconditions before a dealer can pay one] [jira: EAINT-12403 2026-10]
     - If Company has no active RHB account -> 'No RHB account' popup.
     - If User is a Valuation Advisor -> View only.
     - If BO Transaction Restriction = Yes -> Restriction popup on APT Resubmit.
  2. Step 5 - Payment | where: UCD › APT › Resubmit › Step 5 (apt/transaction/payment.do) | The wizard opens at Step 5. It shows vehicle, STMS submission date, both expiry dates, dealer company and Payment Summary: JPJ Fee + eAuto Fee + Service Tax 8% = Total. Car Semenanjung RM127.00. Sabah or Sarawak RM67.00. Click Next, then Yes on the payment confirmation. | affects: RHB payment; BO APT Transaction Enquiry [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Steps that matter for testing] [jira: EAINT-12403 2026-10]
     - If Payment succeeds -> Dialog 'Payment request sent'. [OK] goes to the APT listing, not Step 6.
     - If Payment Failed -> Row shows Resubmit. Step 5 shows 'Payment Status: Failed' with only [Retry], then 'Sure to retry?' Cancel / Make Payment. A same-day retry re-sends the same RHB reference (one debit).
  3. Step 6 - Submission (JPJ Transfer) | where: UCD › APT › jpj-sub.do?id= | Shows JPJ Transfer Status (e.g. OK - SUCCESSFUL) and the submission date and time. No price. The normal flow does not reach it. Reloading (F5) the paid APT's payment page opens it. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Steps that matter for testing]
     - If JPJ batch has not run yet -> JPJ Transfer reads Pending until the batch runs.
  4. View an Approved APT | where: UCD › APT › View (apt/enquiry/view.do?id=) | An Approved row offers only [View]. Transaction Details shows Invoice, e-Invoice, Slip Pengesahan, JPJ Transfer (Final Submission) and Payment History. A Failed row offers [Resubmit]. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Steps that matter for testing]
  - [unconfirmed] FUTURE: Firefox Browser Reminder popup on APT Step 6 (jpj-sub.do) only, on every load. Not on Step 5, not on the listing, not on Details. 'Once per transaction' was dropped by the BA on 21.10.2026. EAINT-12253, S34.X-20261028. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#FUTURE — not live yet (20.10.2026)]

### Cross-module effects (what it affects)
- APT listing columns: Payment, JPJ Transfer, Tx Status, e-Invoice Status. BO APT enquiry. Reports: BO eAuto STMS, APT and eSTM Transaction Listing; reconciliation summary; BO APT Transaction Enquiry Export CSV. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Every surface a price reaches]
- Invoice, e-Invoice, Slip Pengesahan, LHDN response keep the stored paid amount. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Every surface a price reaches] [ts: EAINT-12289 12289_INV1]
- Home APT tile price is hard-coded (home.jsp). It must be checked after each price change. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Every surface a price reaches]
- Wholesale seller booking fee follows the APT fee. [mine: 02b business-rules §1.2]

### Cronjobs
- [unconfirmed] AptJpjSubmissionJob | Twice a day, about 8:30am and 5:50pm (dev-reference config; prod file withheld) | Batch APT submission to JPJ. The downstream successor of STMS. [askeauto: 07-ask-eauto.md Q3 §3.2 (prod/master 0e21bef3) 2026-10-23]

### Roles
- Same company, plus the same branch if the user is branch-restricted. 'Valuation Advisor' users can only View. [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#Preconditions before a dealer can pay one]
- No MyKad step. Identity was captured in the STMS. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Steps that matter for testing] [azfar: eauto-qa-azfar:01-azfar-repo.md Module APT]

### Where the transaction goes
- APT listing shows Approved. BO APT enquiry shows it. JPJ transfer is a batch, so JPJ Transfer reads Pending until the batch runs. [azfar: eauto-qa-azfar:knowledge/portals/ucd/portal.md#The journey is two steps]

### Rules
- Statuses seen: New, Pending, Committed, Approved, Failed, Cancelled. [azfar: eauto-qa-azfar:01-azfar-repo.md Module APT]
- JPJ Fee follows the UCD company's mailing-address State in BO > Manage Company Accounts: Semenanjung RM100, Sabah or Sarawak RM40. It is read at payment time, not stored when the APT is created. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Region — the UCD company's address]
- Four exception rows break the region rule. APT IA Sabah and IA Sarawak: JPJ 100.00, total RM127.00. APT BF Semenanjung and BJ Semenanjung: JPJ 40.00, total RM67.00. Test against the row, not the rule. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Rows that price differently (rate card, live 20.09.2026)]
  - Conflict: other version: Faizuddin's note: 'JPJ follows usage code not only region'. Commercial car Semenanjung BF: JPJ 40 + 25 + 2 = 67. RHB split debit eAuto 27 + JPJ 40. [mine: 02b business-rules §1.1] (Same fact from a different angle.)
- Usage code DK exists for Semenanjung only. A DK vehicle in Sabah or Sarawak fails the APT price lookup. [azfar: eauto-qa-azfar:knowledge/_core/usage-codes.md]
- The seller's MyKad address and the eSTM declarationArea do not change the JPJ Fee region. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Region — the UCD company's address]
- APT Car today: eAuto RM25 + 8% RM2 = RM27, with JPJ RM100 = RM127.00. History: RM15 to RM20 (12289) to RM25 (12403). [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026] [mine: 02b business-rules §1.1]
- AA (Motosikal) APT rows do not move with Car price CRs: JPJ 3.00 (Sabah CAR 40.00, Sarawak CAR 5.00) + eAuto 5.00 + 0.40. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Rows that price differently (rate card, live 20.09.2026)]
- [unconfirmed] Prod code (code reading, unverified): the DP re-check is switched off for APT, so a failure is hard. [azfar: eauto-qa-azfar:01-azfar-repo.md Module APT]

### QA scope to check
- Check usage code x region x entry point. Created before the deploy vs after. [ts: EAINT-12289] [ts: EAINT-12403]
- Check Step 5 fee lines and total for Semenanjung and Sabah or Sarawak. [ts: EAINT-12289 12289_E2E1] [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Region — the UCD company's address]
- Check APT Step 6 and the UCD and BO detail pages show no price. [ts: EAINT-12289 12289_DSP2]
- Check the Home APT tile, invoice, e-Invoice, Slip Pengesahan and LHDN response. Old transactions keep the old fee. [ts: EAINT-12289 12289_DSP1, INV1]
- Check reports show both fee versions when old and new transactions mix. [ts: EAINT-12289 12289_RPT1]
- Check the company's mailing-address State in BO before any region test, and restore it afterwards. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Region — the UCD company's address]
- Check Wholesale booking fee. [ts: EAINT-12289 12289_R2]
- Check the Transaction Restriction popup on APT Resubmit. [ts: EAINT-9044 APT_TS1]

### Ticket history
- EAINT-12403 (2026-10): APT Car fee RM25. Live S34.2-20261001. [latest]
- EAINT-12289 (2026-09): APT Car fee RM20, production 17.09.2026 night. [legacy, superseded by EAINT-12403]
- EAINT-12253 (2026-10): FUTURE: Browser Reminder on APT Step 6. [latest]
- EAINT-9044: Transaction Restriction on APT Resubmit. [latest]

### Open questions
- Does the normal flow reach Step 6? 'Payment request sent' > OK goes to the listing. Q23 is open with the BA (EAINT-12253).
- The showroom address was not tested as a source of the JPJ region.

## Flow: Resubmit / auto-pay cronjob and auto-reset on error RE
- A job pays failed or pending APT without the dealer. A separate rule resets the payment when RHB answers RE.
- Portals: Cronjob, UCD Portal, Back Office, RHB

### Entry points and steps
- Entry point "Nightly resubmit job (EAINT-8668)": System: AptPaymentJob, daily 8:00pm in production [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Resubmit cronjob (EAINT-8668)] [askeauto: 07-ask-eauto.md Q3 §3.4 (prod/master 0e21bef3) 2026-10-23] [mine: 02b business-rules §2 item 6; TS #077]
  - Also the same job as the APT 6.0 auto-trigger.
  1. Pick up APT transactions | where: System | Picks up Payment = Failed and Tx = Failed, or Payment = '-' and Tx = Pending. Only yesterday and earlier. Needs RHB Active, Company Activated and eSTM code VEL000392E. Does not pick up Payment = OK and Tx = Failed. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Resubmit cronjob (EAINT-8668)] [ts: EAINT-8668 TS1-TS13]
  2. Pay at run-time price | where: System | Resubmits the payment and the final submission. On success Payment = OK and Tx = Approved. [e-Invoice] and [Slip Pengesahan] become available. The row appears in BO RHB Payment Transaction. A Pending transaction picked up after a price change is charged the new price. | affects: BO RHB Payment Transaction; e-Invoice [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Resubmit cronjob (EAINT-8668)] [ts: EAINT-8668 TS1]
- Entry point "Auto reset on RHB error RE (EAINT-11855)": UCD › APT › Resubmit › Step 5 › Next › Yes, when RHB answers RE [jira: EAINT-11855 2026-08] [ts: EAINT-11855 11855_TS1] [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]
  - The system resets the payment itself. Before this, IT reset it by hand.
  1. System detects RE and resets | where: UCD › APT › Step 5 | RE is shown as 'RE - Invalid RefNo/Amount/Date'. A fund enquiry on RE hits DE (Original Trans Date over 1 day). Next day and later, the system makes a new payment at the new price by itself. [jira: EAINT-11855 2026-08] [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]
     - If Company has an active RHB account, next day or later -> RHB rejects the reference. System auto-resets and makes a new payment at the new price.
     - If No RHB account or RHB inactive -> Screen shows the new price but the bank record is not cleared. Screen and actual debit can disagree (found in EAINT-12289).

### Cross-module effects (what it affects)
- A reset leaves a transaction at Payment '-' / Tx Pending, which is the cronjob's second pickup state. So the next run can pay the whole reset population at the new price (EAINT-12289 CRN3). [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]
- Warn Ops and RHB with the count before a run, because the 8pm auto-pay charges all reset APT in one batch. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]

### Cronjobs
- APT resubmit / auto-pay (EAINT-8668) | Daily 8:00pm in production. Staging every 10 minutes. Test interval is set by Dev on request. Auto-pay was left off on QA staging in EAINT-12289. | Picks Payment = Failed and Tx = Failed, or Payment '-' and Tx = Pending. Prices at run time. Does not pick Payment OK and Tx Failed. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Resubmit cronjob (EAINT-8668)] [mine: 02b business-rules §2 item 6; TS #077] [askeauto: 07-ask-eauto.md Q3 §3.4 (prod/master 0e21bef3) 2026-10-23]

### Roles
- BO CSE team gets a Reset button in the APT Action column (permission via EAINT-11854). [jira: EAINT-11855 2026-08]

### Where the transaction goes
- Payment OK, Tx Approved. e-Invoice and Slip Pengesahan downloadable. Row in BO RHB Payment Transaction. [ts: EAINT-8668 TS1]

### Rules
- Dev agreed each usage code does not need its own flow. The fee changes through one configuration update. Spread codes across scenarios. [azfar: eauto-qa-azfar:knowledge/_core/usage-codes.md#Testing habit]
- Payment OK with Tx Failed is not covered by price CRs: not reset and not picked up. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Decided, not open]

### QA scope to check
- Run the criteria matrix: Payment Failed / OK / '-', Tx Failed / Pending, RHB Active / Inactive, Company Activated / Inactivated, VEL000392E vs other codes. [ts: EAINT-8668 TS1-TS13]
- Check the two-day case: fails on day 1, cronjob pays on day 2. [ts: EAINT-8668]
- Check the cronjob picks up reset transactions at the new fee. [ts: EAINT-12289 12289_CRN1-CRN3]
- Check auto reset on RE: payment reset, retry allowed. [ts: EAINT-11855 11855_TS1]

### Ticket history
- EAINT-8668 (2025-08): New cronjob to resubmit failed APT payments. [latest]
- EAINT-11855 (2026-08): Auto reset payment on RHB error RE. Done. [latest]
- EAINT-11854: Reset button permission for CSE.

### Open questions
- Production schedule is documented as 8:00pm. The prod scheduler file is withheld, so Ask eAuto could only confirm the dev-reference value.

## Flow: BO Reset Payment and price-change reset
- After a price change IT or BO resets Failed APT payments so they are paid at the new price.
- Portals: Back Office, UCD Portal

### Entry points and steps
- Entry point "BO > APT Transaction Enquiry > Reset": BO › APT Transaction Enquiry › Action column › Reset (next to View and Cancel) [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)] [ts: EAINT-12289 12289_PAY4]
  1. Reset a Failed APT | where: BO › APT Transaction Enquiry | Returns Payment to '-' and Tx to Pending, available for payment again. AA transactions are reset but not repriced. Done by IT or Dev per transaction after the rate update is live. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)] [jira: EAINT-12403 REQ005]
     - If Payment = Failed only -> Reset allowed. Dev's reset on preprod1 moved 52 STMS and 4 APT, nothing else.
     - If Payment OK with Tx Failed -> Not reset.
  2. UCD pays again | where: UCD › APT › Resubmit › Step 5 › Retry | Step 5 shows the current price. A Failed APT keeps its amount until reset. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]

### Cross-module effects (what it affects)
- BO Reset Payment Report: filter by Vehicle No, not date. Reset rows carry the reset date as Payment Date. A date range that includes the reset day stayed on 'Working…' for 7+ minutes. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]

### Roles
- IT or Dev reset per transaction. BO CSE has a Reset button (EAINT-11855). [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)] [jira: EAINT-11855 2026-08]

### Where the transaction goes
- Transaction waits at Payment '-' / Tx Pending for the UCD or the nightly job. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]

### Rules
- Scope differs per CR. 12289: all Failed, any vehicle type incl. Motosikal. 12403: Failed/Failed on the UCD portal only. Pending and Wholesale excluded. Read the SRD every time. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]
  - Conflict: other version: Fee reset scope differs per CR. It is not a defect. [mine: 02b business-rules §1.2] (Faizuddin's wording of the same rule.)
- Never use the bulk admin link /ajax/admin/scheduler/reset-payment.do. It leaves bank records and writes no audit row. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]
- Rate update first, reset after. A transaction reset before the new rate is live can be paid again at the old fee. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]
- Create test data BEFORE Dev pushes a new price. It cannot be reproduced afterwards. [mine: TS #042 EAINT-12403 row 8]

### QA scope to check
- Check positive reset (Failed becomes '-' / Pending) and negative cases (Approved has no Reset). [ts: EAINT-12403 12403_STMS_PAY1, NEG1, NEG2]
- Check the completeness: count unpaid transactions still at the old amount during the deployment and again 24-48 hours later. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]
- Check the Reset Payment Report by vehicle number. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]

### Ticket history
- EAINT-12403 (2026-10): Reset Failed/Failed after fee RM25. [latest]
- EAINT-12289 (2026-09): Reset all Failed after fee RM20. [legacy, superseded by EAINT-12403]
- EAINT-8826: Reset Payment permission. [latest]


## Additions from Charmain's QA repo (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (commit 0ab45d1, 2026-10-13). Status: a colleague's draft ledger, not verified live.

- Her only APT case is a production read-only smoke (APTUCDSF_TS1, P1): sign in as a dealer, dismiss the dashboard dialogs, open APT, search with no filters; expect Search Now and Reset Filter buttons and a full set of column headings. Wrong outcomes: a dialog still open so the menu click never lands; the APT button missing (permission or deployment defect); an unsubmitted search that looks like an empty result. `[charmain-repo: test-scenarios/ucd-apt/ucd-apt.md:48-53]` `[charmain-repo: test-scenarios/ucd-apt/ucd-apt.assertions.yaml:80-118]`
- Production blocks must be read-only: no form submit, payment or record change. `[charmain-repo: test-scenarios/ucd-apt/ucd-apt.md:12-16]`
