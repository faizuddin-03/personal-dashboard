# Payments and Fees: RHB direct debit, failed-payment reset, fee changes (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/payments-fees.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- How eAuto takes money and how its prices are set. Most UCD modules pay with RHB direct debit: a button and a confirm popup, with no gateway page. When a payment fails, Back Office or the system can reset it so the dealer can pay again. When a fee changes, a Dev updates the rate card, then failed payments are reset so they are paid at the new price.
- Portals: UCD portal (pays), Back Office (reset, reports), RHB (bank), JPJ (fee part), Backend jobs
- Related modules: stms, apt, estm, service-hub, jomcheck, dereg, onboarding, backoffice

## Glossary
- RHB direct debit: eAuto’s own payment rail. The dealer clicks pay and confirms. Money comes from the dealer’s RHB account. No bank login and no QR. [mine: knowledge/eauto-payments.md]
- Payment OK / Failed / -: Payment column on a transaction. “-” means no payment yet (state after a reset). [azfar: knowledge/_core/fees-and-pricing.md] [mine: knowledge/business-rules-from-test-scenarios.md]
- Reset (payment): BO action that clears a failed payment: Payment becomes “-”, Tx Status becomes Pending, remarks cleared. The dealer can then pay again. [azfar: knowledge/_core/stms.md]
- RHB codes: OK = success (only code that completes a transfer). IF = insufficient funds. RE = invalid reference. DP = duplicate. GD = enquiry-leg success, NOT transfer success. ED = Ref 2 longer than 30 characters. NP = RHB maintenance. [azfar: knowledge/portals/ucd/portal.md] [mine: knowledge/eauto-payments.md]
- transfercost: The rate card table. Fee depends on type, usage code, region (1/2/3) and CAR/BIKE. Only Dev changes it, by SQL. No BO screen edits it. [azfar: knowledge/_core/fees-and-pricing.md]
- Usage code: JPJ code of the vehicle use. It decides the rate-card row (for example AA Motosikal vs AB–DK cars). [azfar: knowledge/_core/usage-codes.md]

## Flow: RHB direct debit payment (all eAuto-rail modules)
- At the payment step of a module the dealer clicks pay and confirms in popups. eAuto sends the debit to RHB. The result is saved on the transaction as OK or Failed.
- Portals: UCD portal, RHB

### Entry points and steps
- Entry point "Make Payment / Pay Now at the module payment step": UCD › module payment step (STMS Step 5, eSTM, APT Step 5, Service Hub, JomCheck, eDereg) [mine: knowledge/eauto-payments.md] [azfar: knowledge/portals/ucd/portal.md]
  - A button plus confirmation popups. No gateway page, no bank login and no QR (QR is not implemented in eAuto).
  1. Open the payment step | where: Module › Step 5 / payment page | Shows fee lines: JPJ fee, eAuto fee, Service Tax 8%, total. | affects: stms; apt; estm; service-hub; jomcheck; dereg [mine: knowledge/eauto-payments.md] [azfar: knowledge/portals/ucd/portal.md]
  2. Confirm in the popup(s) | Examples: Service Hub #si-pay-btn then .confirm-dialog-btn; eSTM has two dialogs; JomCheck shows a payment popup with an RHB sufficient-funds notice; APT retry asks “Sure to retry?” Cancel / Make Payment. [mine: knowledge/eauto-payments.md]
  3. RHB answers | Payment Details gets a line “[Date time] - RHB (<ref>) - OK/Failed”. | affects: Module listing (Payment column); Back Office enquiry [azfar: knowledge/portals/ucd/portal.md] [mine: knowledge/eauto-payments.md]
     - If OK -> Payment OK. The module goes on (for STMS family: final JPJ submission).
     - If IF -> Failed. Remark “IF - Wang di dalam akaun RHB anda TIDAK MENCUKUPI…”. A dialog shows and the page does not move on.
     - If NP -> Failed. Remark “NP - Sistem Pembayaran RHB dibawah penyelengaraan antara 10.30mlm - 8.30pg.”
     - If RE -> Failed. Next-day retry shows “RHB ERROR-RE” until BO resets (see failed-payment reset flow).
     - If ED -> Failed. Ref 2 is longer than 30 characters.
     - If DP -> Duplicate. The result depends on the enquiry leg.
- Entry point "Service Hub payment": UCD › Service Hub › Software Installation / Biometric Device › Pay [mine: knowledge/eauto-payments.md]
  1. Pay and fail rule | A failed Service Hub payment cancels the transaction (Tx Cancelled). The UCD cannot retry. | affects: service-hub [mine: knowledge/eauto-payments.md] [mine: EAINT-10960 SRD v1.2 2026-08]
- Entry point "Dealer retries a failed APT payment": UCD › APT Transaction Listing › Resubmit › Step 5 [azfar: knowledge/_core/apt.md]
  1. Retry | Step 5 shows “Payment Status: Failed” and only [Retry]. Same-day retry re-sends the same RHB reference (one debit). | affects: apt [azfar: knowledge/_core/apt.md#Payment reset]

### Cross-module effects (what it affects)
- Module listing Payment column and BO enquiry show OK or Failed. [mine: knowledge/eauto-payments.md]
- Reconciliation: the daily RHB reconciliation compares eAuto payments with the uploaded RHB statement. [azfar: cr/EAINT-10168/LEDGER.md]
- Invoices and e-Invoices follow the stored paid amount. [azfar: knowledge/_core/fees-and-pricing.md]

### Cronjobs
- APT resubmit failed APT (EAINT-8668) | Production 8:00 PM daily (once a day); staging every 10 minutes | Re-pays and re-submits Payment = Failed APT transactions that meet all criteria. Payment OK + Tx Failed is not re-paid. Pending and New are not picked up. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: knowledge/_core/fees-and-pricing.md]

### Roles
- UCD users with permission for the module pay. No separate payment role. [mine: knowledge/eauto-payments.md]

### Where the transaction goes
- The transaction goes to the module listing with Payment OK or Failed. On OK, e-Invoice and Slip Pengesahan are available for STMS family. [mine: knowledge/eauto-payments.md] [mine: knowledge/business-rules-from-test-scenarios.md]

### Rules
- STMS-family Ref 1 is “{TransactionNo}-{VehicleNo}”. Ref 2 is “{TransactionNo}/{STMS|JCK|OTH|DPC}”. Description “ETUKARMILIK CR”. Service Hub Ref 1 is SR{YYYYMMDD}{6}-{CompanyID}; Ref 2 is SOFTINSTALL / BIODEV / SOFTINSTALL_BIODEV. [mine: knowledge/eauto-payments.md] [ts: TS #123 RHB 25.06.2026]
- RHB Ref 2 longer than 30 characters returns “ED”. [teams: EAINT-12099 Goh Kai Jiaeh 2026-07-17]
- A failed RHB payment does not navigate. A dialog shows. A test that waits for the next screen times out on a correct refusal. [azfar: automation/README.md#Three traps]
- A failed JPJ enquiry shows Resubmit, not Make Payment. [azfar: automation/README.md#Three traps]
- GD is not a success code for the transfer; only OK is. DP outcome depends on the enquiry leg (a prefix with no enquiry row defaults to confirming). [azfar: knowledge/portals/ucd/portal.md]
- Interstate UCD to UCD with no active RHB account needs a company groupType starting with “A” to proceed. [askeauto: Q4 2026-10-23]
- Payment is made by RHB Direct Debit / FPX for STMS (StmsPaymentController) and must finish before submission. [askeauto: Q3 2026-10-23]
- When the company has no RHB account, a retry uses the new price through FPX or balance. [azfar: knowledge/_core/fees-and-pricing.md]

### QA scope to check
- Check success, IF, RE, ER and NP paths per module (button, popups, remark text). [mine: knowledge/eauto-payments.md]
- Check the Payment Details line, references and the Ref 2 length limit. [mine: knowledge/eauto-payments.md]
- Check the module continues only after OK. [azfar: automation/README.md#Three traps]
- Check Service Hub failure cancels the transaction and cannot be retried. [mine: knowledge/eauto-payments.md]
- Check the RHB maintenance message window. [ts: EAINT-9141 (TS #092)]

### Ticket history
- EAINT-12403 (2026-10): APT RHB IF prefix and fee change [latest]
- EAINT-9141: RHB maintenance message [latest]
- EAINT-8668: APT resubmit cronjob [latest]
- EAINT-10960 (2026-08): Service Hub SRD (failed payment cancels) [latest]

### Open questions
- Ask eAuto Q19 (RHB direct debit and reset, prod code) has not been answered yet.
- Prod behaviour for RHB codes outside the list above is not documented here.

## Flow: Failed-payment reset (BO Reset, auto reset, reset on deploy)
- A failed payment can be reset so the dealer pays again. BO does it per transaction with the Reset button. The system resets APT payments by itself on RHB error RE. For a fee change, IT resets failed payments on deploy night.
- Portals: Back Office, UCD portal, Backend

### Entry points and steps
- Entry point "BO Reset button": Back Office › STMS / APT / eSTM Transaction (enquiry) › Action column › Reset [azfar: knowledge/_core/stms.md] [mine: knowledge/business-rules-from-test-scenarios.md]
  - The button shows for a Failed transaction next to View and Cancel. Permission is EAINT-8826 (eSTM and STMS) and EAINT-11854 (CSE team, APT).
  1. Open the failed transaction | where: BO › STMS Transaction (view/stms/enquiry) or APT Transaction Enquiry | Actions for Failed: View, Cancel, Reset. [azfar: knowledge/_core/stms.md] [mine: knowledge/business-rules-from-test-scenarios.md]
  2. Press Reset | Browser confirm “Sure to reset payment for <vehicle>?”. Payment becomes “-”, Tx Status Pending, remarks cleared, the Reset link disappears. | affects: Module listing; UCD Resubmit [azfar: knowledge/_core/stms.md]
  3. Dealer pays again | The UCD sees the transaction as Pending and resubmits. It is paid at the current price. | affects: rhb-direct-debit [azfar: knowledge/_core/fees-and-pricing.md]
- Entry point "Auto reset of APT payment on RHB error RE (EAINT-11855)": UCD or cronjob resubmits an APT and RHB returns RE [jira: EAINT-11855] [azfar: knowledge/_core/fees-and-pricing.md]
  1. System detects RE and resets | On RE during APT resubmit the system resets the payment by itself. IT used to reset by hand. RE text became “RE – Invalid RefNo/Amount/Date”. A fund enquiry on RE hits DE (Original Trans Date > 1 Day). The next-day APT makes a new payment at the new price. [jira: EAINT-11855]
- Entry point "Reset on deploy night for a fee change": Release night of a price CR (for example 01.10.2026 from 11:30 PM) [azfar: knowledge/_core/fees-and-pricing.md] [jira: EAINT-12403]
  1. IT/Dev resets failed payments per transaction | Order: update the rate card first, then reset. Reset only Payment = Failed (UCD portal only for EAINT-12403; Pending and Wholesale excluded). Use BO Reset Payment per transaction. Never use the bulk admin link. | affects: fee-change [jira: EAINT-12403] [azfar: knowledge/_core/fees-and-pricing.md]
- Entry point "Failed-payment reset by API (staging and prod)": API call as a logged-in admin user [mine: knowledge/eauto-payments.md] [teams: EAINT-12289 2026-09-10]
  1. Reset through API | Used in staging and production for failed-payment reset. In production it runs under an admin user’s account. [mine: knowledge/eauto-payments.md] [teams: EAINT-12289 2026-09-10]

### Cross-module effects (what it affects)
- After a reset the transaction is Payment - / Tx Pending. For APT this is exactly the cronjob pickup state, so a reset APT is auto-paid by the APT job. [azfar: knowledge/_core/fees-and-pricing.md] [azfar: knowledge/_core/apt.md]
- BO Reset Payment Report lists reset rows (filter by Vehicle No). [azfar: knowledge/_core/fees-and-pricing.md]
- Documents of already-approved transactions keep the price they paid. [azfar: knowledge/_core/fees-and-pricing.md] [mine: knowledge/business-rules-from-test-scenarios.md]

### Cronjobs
- APT auto-pay / resubmit job | 20:00 daily (production) | Pays APT transactions in the pickup state (Payment - / Pending). After a reset it charges them at the new fee in one batch. Warn Ops and RHB with the count. [azfar: knowledge/_core/fees-and-pricing.md] [mine: knowledge/business-rules-from-test-scenarios.md]
- Bulk reset admin link /ajax/admin/scheduler/reset-payment.do?transactionType=STMS|APT | Manual only | Resets every pending and failed transaction, leaves bank records, writes no audit row. NEVER use. [azfar: knowledge/_core/fees-and-pricing.md]

### Roles
- BO users with the Reset permission (CSE team for APT). Support Tools actions need named BO users or roles. [jira: EAINT-11855] [jira: EAINT-8826] [azfar: knowledge/_core/stms.md]
- In SRD 12403 REQ005 the reset is done by IT/Dev per transaction. [azfar: knowledge/_core/apt.md]
- In production the API reset uses an admin user’s account; Ops use the BO Reset button for APT. [mine: knowledge/eauto-payments.md] [teams: 2026-06-25]

### Where the transaction goes
- The UCD sees the transaction as Pending and can resubmit. APT goes to the next 20:00 job. [azfar: knowledge/_core/fees-and-pricing.md] [azfar: knowledge/_core/apt.md]

### Rules
- Reset takes only Payment = Failed for EAINT-12403. Pending and Wholesale are excluded. [azfar: knowledge/_core/fees-and-pricing.md] [azfar: cr/EAINT-12403/LEDGER.md]
  - Conflict: other version: EAINT-12289 reset all non-completed transactions. Read each CR’s SRD for the reset scope. [mine: knowledge/business-rules-from-test-scenarios.md] (Faizuddin’s notes: the scope differs per CR, not a defect.)
- Same-day retry with RHB active uses the old fee. A next-day retry shows “RHB ERROR-RE” until BO resets. [azfar: knowledge/_core/fees-and-pricing.md]
- AA (Motosikal) is reset but not repriced. [mine: knowledge/business-rules-from-test-scenarios.md] [ts: EAINT-12403]
- Negative cases: JPJ Enquiry Failed (4K HAK MILIK DITUNTUT) fails without payment and has only View and Cancel (no Reset). Approved transactions have no Reset. [ts: 12403_STMS_PAY2, NEG1, NEG2]
- BO Reset Payment Report: filter by Vehicle No, not date. Reset rows carry the reset day as Payment Date. A date range that includes the reset day hangs 7+ minutes. BO STMS Transaction has no Payment-status filter. [azfar: knowledge/_core/fees-and-pricing.md] [azfar: cr/EAINT-12403/LEDGER.md]
- Test data must be created BEFORE the new price is pushed. It cannot be reproduced after. [ts: TS #042 row 8]

### QA scope to check
- Check Reset shows only for Failed. Check Payment becomes “-” and Tx Pending. [azfar: knowledge/_core/stms.md] [ts: 12403_STMS_PAY1]
- Check repay at the new fee after the reset. [ts: 12289_PAY1] [ts: 12403_STMS_PAY1]
- Check the negative cases (JPJ enquiry failed, Approved). [ts: 12403_STMS_NEG1-NEG2]
- Check APT: reset then the 20:00 / staging 10-minute job pays at the new price. [ts: 12289_CRN1-CRN3]
- Check auto reset on RE (EAINT-11855). [jira: EAINT-11855]
- Check the Reset Payment Report by Vehicle No. [azfar: knowledge/_core/fees-and-pricing.md]

### Ticket history
- EAINT-8826 (2025-09): Reset Payment permission for eSTM and STMS [latest]
- EAINT-11854 (2026-06): Permission for CSE team to use Reset on APT [latest]
- EAINT-11855 (2026-06): Auto reset payment on RHB error RE in APT resubmit (Done 2026-08) [latest]
- EAINT-12289 (2026-09): APT fee RM15 to RM20, reset [legacy, superseded by EAINT-12403]
- EAINT-12403 (2026-10): STMS and APT fee RM20 to RM25; reset Failed [latest]

### Open questions
- RHB’s reply on the RE fix is not in Jira.
- Ask eAuto Q19 on payment reset (prod code) has not been answered yet.

## Flow: Fee / price change (rate card, tiles, invoices, reports)
- A price CR changes the eAuto service fee in the rate card and updates every place that shows or stores the price. The price is applied when the payment is made, not when the transaction was created.
- Portals: UCD portal (shows), Back Office (stores, reports), Wholesale display, Android app

### Entry points and steps
- Entry point "Dev updates the rate card (SQL)": Dev runs an SQL update on transfercost. No BO screen exists. [azfar: knowledge/_core/fees-and-pricing.md]
  1. Rate card updated first | Row = type × usage code × region 1/2/3 × CAR/BIKE. JPJ body type decides CAR or BIKE (AA + MSL = bike). Usage code decides the row. Four APT exception rows exist (IA Sabah/Sarawak, BF/BJ Semenanjung). [azfar: knowledge/_core/fees-and-pricing.md]
  2. Hard-coded labels updated | where: home.jsp:807 STMS, :814 UCD TO UCD, :820 APT; stms/index.jsp:364; stms/interstate/index.jsp:258 | Tile and module-page labels are text in the page. They can disagree with Step 5 if not updated. | affects: ucd-portal › homepage tiles [azfar: knowledge/_core/fees-and-pricing.md]
  3. Failed payments reset | See the failed-payment reset flow. | affects: failed-payment-reset [azfar: knowledge/_core/fees-and-pricing.md] [jira: EAINT-12403]
- Entry point "Dealer pays after the change": Any STMS / UCD to UCD / APT payment step [azfar: knowledge/_core/fees-and-pricing.md]
  1. Price is taken at payment time | No date logic (decided 24.09.2026). Invoices print the stored amount. Already approved transactions keep the amount charged. [azfar: knowledge/_core/fees-and-pricing.md] [ts: 12403 header]
- Entry point "Android app tile price (EAINT-12550)": eAuto app home › STMS and UCD to UCD tiles [jira: EAINT-12550]
  1. Update app tile price RM25 to RM35 | Sub-task in Code Review 2026-10-19. [jira: EAINT-12550]
- Entry point "Wholesale price copies (JomCheck, STMS)": Wholesale chatbot and payment portal [jira: EAINT-12279] [mine: knowledge/business-rules-from-test-scenarios.md]
  1. Follow the eAuto fee | Wholesale STMS shows RM27.00 (eAuto fee incl. SST). JomCheck chatbot and payment portal price went RM18 to RM20 (EAINT-12279, Done 2026-09-15). | affects: wholesale [jira: EAINT-12279]

### Cross-module effects (what it affects)
- Step 5 Payment Summary, tiles, invoices, e-Invoices, Slip Pengesahan, reports, BO enquiries (stored amounts), Wholesale price display, APT 6.0 auto-trigger and cronjob, and any module sharing the configuration. [azfar: knowledge/_core/fees-and-pricing.md]
- Invoice and e-Invoice description: Sistem Tukar Milik Sementara (“STMS”) service charge RM25.00 + SST RM2.00. Reports show both fee versions side by side. [mine: knowledge/business-rules-from-test-scenarios.md]
- Seller booking fee for APT follows the APT fee. Reconciliation totals must tie. [mine: knowledge/business-rules-from-test-scenarios.md]
- Wholesale APT check reuses the saved APT fee if checked today (Malaysia time). If the price changed: “The price has changed. Please check the new total and pay again”. APT is priced from the eAuto TransferCost table. [jira: EAINT-12562]

### Cronjobs
- APT auto-pay (20:00) | 20:00 | Charges reset APT transactions at the new fee in one batch. [azfar: knowledge/_core/fees-and-pricing.md]

### Roles
- Dev updates the rate card and resets. BO users only view stored amounts. IT resets on deploy night. [azfar: knowledge/_core/fees-and-pricing.md] [jira: EAINT-12403]

### Where the transaction goes
- Transactions approved before the change keep the amount charged. [azfar: knowledge/_core/fees-and-pricing.md]

### Rules
- Live prices on 20.10.2026: STMS Car = JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00 (tile “From RM35”). UCD to UCD the same (tile “RM35”). APT Semenanjung Car 100 + 25 + 2 = RM127.00 (tile RM125). APT Sabah/Sarawak 40 + 25 + 2 = RM67.00. [azfar: knowledge/_core/fees-and-pricing.md]
- Other prices: SSM report RM19.44; Transfer History JPJ 10.00 + eAuto 10.00 + 0.80 = RM20.80 (invoice shows eAuto part 10.80 only); JomCheck RM20 + 1.60 = RM21.60; eSerahan tile “From RM135”; BMK RM30 tile (RM30.80 total on staging); eVOC RM10; eLKM RM2.75 + 0.22; eSTM car RM35 + 2.80; Dereg RM35 + 2.80; eDereg Pre-Checking RM5 + 0.40; Pre-Application RM100 + 8 = RM108; eAuto registration RM1,500 (staging); Service Hub SI RM54.00, BDP RM850.00; Insurance Cancellation RM38 + 8% = RM41.04; LKM refund fee bands. [azfar: knowledge/_core/fees-and-pricing.md] [mine: knowledge/business-rules-from-test-scenarios.md]
- Not changed by EAINT-12403: AA CAR RM11.80 (STMS); AA Motosikal JPJ 1 + eAuto 5 + 0.40 = RM6.40; AB–AE BIKE RM26.20. 52 CAR rows changed (27 STMS + 25 APT). eSerahan untouched. [azfar: knowledge/_core/fees-and-pricing.md] [mine: knowledge/business-rules-from-test-scenarios.md]
- Fee history (newest last): STMS Car RM15 → RM20 (EAINT-10175, 2026-03-31) → RM25 (EAINT-12403, effective 02.10.2026, update from 01.10 11:30 PM). APT Car RM15 → RM20 (EAINT-12289, 15–17.09.2026) → RM25 (EAINT-12403). APT tile RM115 → RM120 → RM125. JomCheck RM18 → RM20 (EAINT-10089, 2026-09-14). SSM RM18.64 → RM19.44 (EAINT-10691). [azfar: knowledge/_core/fees-and-pricing.md] [mine: knowledge/business-rules-from-test-scenarios.md] [jira: EAINT-12403]
- Home page tile: STMS from RM30 to RM35 and APT from RM120 to RM125 (EAINT-12403). [jira: EAINT-12403]
- JPJ fee follows the usage code and region. APT region = the UCD company’s mailing-address state at payment time. Check and restore it in BO around region tests. The cronjob takes yesterday and earlier only. [azfar: knowledge/_core/apt.md] [azfar: knowledge/portals/ucd/how-we-test.md#Traps]
- Mock-ups and old workbooks are not expectations (for example EAINT-12289 expected RM121.60 for a BF row that should be RM67.00). [azfar: cr/EAINT-12403/LEDGER.md]

### QA scope to check
- Check every fee line plus 8% tax, the invoice and e-Invoice descriptions, and tile and Step 5 values. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: knowledge/_core/fees-and-pricing.md]
- Check JPJ amounts per region and usage code, and excluded vehicle types (AA and bikes). [mine: knowledge/business-rules-from-test-scenarios.md] [ts: EAINT-12403]
- Check the reset scope, the cronjob resubmission price and old vs new transactions in reports. [ts: 12403_CRN1] [ts: 12289]
- Check Wholesale STMS display, Android tiles, UCD to UCD Standard and Interstate. [jira: EAINT-12550] [ts: 12403_UTU_E2E1-E2E2]
- Check Step 6 and detail pages show no pricing for APT. [ts: 12289_DSP2]
- Check reconciliation and reports tie to both fee versions. [ts: 12403_STMS_RPT1]
- Create test data before the push so old-price cases can be tested. [ts: TS #042 row 8]

### Ticket history
- EAINT-10175 (2026-03): STMS Car RM15 to RM20 [legacy, superseded by EAINT-12403]
- EAINT-10089 (2026-09): JomCheck RM18 to RM20 [latest]
- EAINT-10691: SSM price to RM19.44 [latest]
- EAINT-9605: New usage code and body type (legacy STMS RM15, eSTM RM35) [legacy, superseded by EAINT-12403]
- EAINT-11057: STMS usage code AH visible only when JPJ returns AH [latest]
- EAINT-12289 (2026-09): APT eAuto fee RM15 to RM20, effective 15.09.2026 [legacy, superseded by EAINT-12403]
- EAINT-12403 (2026-10): STMS (incl. UCD to UCD) and APT eAuto fee RM20 to RM25 +8%, Car and Commercial Car, excl. AA; effective 02.10.2026; SRD v1.1 2026-09-25 [latest]
- EAINT-12279 (2026-09): Wholesale chatbot and payment portal JomCheck price RM18 to RM20 [latest]
- EAINT-12550 (2026-10): Android tile price RM25 to RM35 [latest]
- EAINT-12553 (2026-10): Usage code AH [latest]
- EAINT-12562 (2026-10): Wholesale APT check and priced from TransferCost [latest]

### Open questions
- SRD 12403 says AA stays RM10 STMS / RM5 APT. That matches AA CAR rows only. The QA note “RM15 is total incl. JPJ” does not match the rate card (RM15 is the eAuto fee on AB–AE BIKE rows). Still open.
- STMS SSM price: older workbooks show RM15 + 3 + 1.44; the screen shows RM18 + 1.44.
- “production folder 20260331 (Add RM5 STMS & UTU)” is probably the RM15 → RM20 STMS step. Not confirmed.
- Ask eAuto gap question on the production registration fee (onboarding) has not been answered yet.

## Flow: APT automatic payment and resubmit jobs
- APT (Automatic Permanent Transfer) is never started by the dealer. The system makes it and a job pays it. Failed ones are retried by the resubmit job.
- Portals: Back Office (manual trigger, reset), UCD portal (APT listing), JPJ (notices 5.5 and 6.0), RHB

### Entry points and steps
- Entry point "JPJ notice 5.5 then 6.0 after an STMS is approved": JPJ notice → APT transaction created with status New [azfar: knowledge/_core/apt.md] [ts: 12289]
  1. APT is created | On staging BO uses Manual APT Trigger for notice 5.5 then 6.0. The 6.0 auto-create/submit job runs with no payment. Region follows the company address state. [mine: knowledge/business-rules-from-test-scenarios.md] [ts: 12289_E2E1] [azfar: knowledge/_core/apt.md]
  2. Dealer or job pays | UCD APT listing › Resubmit › Step 5. Or the job pays by itself. | affects: rhb-direct-debit [azfar: knowledge/_core/apt.md] [ts: 12289_E2E1]
- Entry point "Resubmit job (EAINT-8668)": Scheduled job [mine: knowledge/business-rules-from-test-scenarios.md] [ts: 12289_CRN1-CRN3]
  1. Resubmits failed APT | Production 8:00 PM daily; staging every 10 minutes. Only Payment = Failed that meets all criteria. On success: Payment OK, Tx Approved, e-Invoice and Slip Pengesahan available. Priced at the new fee. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: knowledge/_core/fees-and-pricing.md]

### Cross-module effects (what it affects)
- APT Transaction Listing (UCD) and APT Transaction Enquiry (BO). [ts: 12289_PAY1]
- Invoice, e-Invoice, Slip Pengesahan, reconciliation, Wholesale booking fee (code 4Z). [ts: 12289_R2]

### Cronjobs
- APT resubmit job (EAINT-8668) | Production 8:00 PM daily; staging every 10 minutes | Resubmits failed APT payments and final submission. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: knowledge/_core/fees-and-pricing.md]
- [unconfirmed] APT 6.0 auto-create / submit job | Not recorded | Creates and submits APT after STMS approval with no payment. [ts: 12289_R3]
- Manual APT trigger (BO Support Tools) | Manual | Triggers APT for JPJ notice 5.5 then 6.0 on staging. [azfar: knowledge/_core/apt.md]

### Roles
- Dealer never starts an APT. BO Hub Admin and Super Admin use Manual APT Trigger. [azfar: knowledge/_core/apt.md] [azfar: knowledge/_core/stms.md]

### Where the transaction goes
- APT Approved. e-Invoice and Slip Pengesahan appear. [mine: knowledge/business-rules-from-test-scenarios.md]

### Rules
- APT statuses: New, Pending, Committed, Approved, Failed, Cancelled. The pay link shows only when the 6.0 notice date is present and the transaction is not Cancelled or Expired. [azfar: knowledge/_core/apt.md]
- APT Step 6 and UCD / BO detail pages show no price. [ts: 12289_DSP1-DSP2]

### QA scope to check
- Check APT created by notice and by manual trigger, then paid by dealer and by job. [ts: 12289_E2E1]
- Check the job picks only Payment = Failed and prices at the new fee. [ts: 12289_CRN1-CRN3]

### Ticket history
- EAINT-8668: APT resubmit cronjob [latest]
- EAINT-12403 (2026-10): APT fee RM25 and reset rules [latest]
- EAINT-12289 (2026-09): APT fee RM20 [legacy, superseded by EAINT-12403]
- EAINT-11855 (2026-06): Auto reset on RE [latest]

### Open questions
- Is the APT resubmit job schedule the same as the 20:00 auto-pay job? Azfar and Faizuddin both say 20:00 / 8 PM, so they likely are one job. Not confirmed.

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/`, folder
`intake/` (commit `0ab45d1`). Test titles are tested expectations, not verified
behaviour. Inventory: `script-inventory-team.md`.

### Tools other QAs built for fee and report checks

1. **Payment Breakdown Report comparison tool** (Charmain,
   `tools/payment-breakdown-report`, 20 files): "It checks a generated payment
   breakdown report rather than testing the product". `[charmain-repo: intake/sources.yaml:173]`
   Parts: `lib/pdf.js` + `_parse-pdf-worker.js` (read the PDF), `lib/xlsx.js`,
   `lib/enquiry.js` + `lib/details.js` (read the portal enquiry / details),
   `lib/compare.js` (732 lines), `lib/vehicleType.js` (294 lines, vehicle-type
   classification), `lib/reporter.js`, `scripts/check-totals.js` /
   `check-all-totals.js`. Runs as a local web app on `127.0.0.1`.
   `[charmain-repo: intake/reports/charmain-payment-breakdown.md:27-46]` `[charmain-repo: intake/reports/charmain-payment-breakdown.json]`
   Its `config.json` "held two credentials and now ships as config.example.json".
   `[charmain-repo: intake/sources.yaml:173]`
   Use: a ready cross-check for fee / price CRs (rate card → invoice → Payment
   Breakdown Report). Status: tools/ candidate, not migrated.
2. **EAINT-12126 LHDN e-Invoice scripts** (Charmain, `by-ticket/eaint-12126-lhdn`):
   `eaint-12126-regression.mjs`, `consolidated-einvoice-check.mjs`,
   `capture-myinvois.mjs`, `probe-seller-identity.mjs`, `probe-wholesale.mjs`.
   They reach LHDN pre-production: `preprod-mytax.hasil.gov.my` and
   `preprod.myinvois.hasil.gov.my`. `[charmain-repo: intake/reports/charmain-lhdn.md:27-52, 233-235]`
   So staging e-Invoices can be checked on the LHDN preprod MyInvois portal;
   `[unconfirmed]` which login she used (`cr-ledger.md` EAINT-12412 notes "MyInvois
   sandbox login unknown").
3. **EAINT-639 JPJ monthly report verifier** (Python, file-based). See `cr-ledger.md`
   § EAINT-639.

### Legacy production suite — payment and invoice pages it covers

All P1 search-and-filter specs in `eautoAutomation-Playwright`. `[charmain-repo: intake/reports/legacy-shared.md:66, 80, 86, 92, 110, 129]`

1. "BO - Settings (Hub Admin) - Manual Payment Processing (STMS,APT,eSTM)".
2. "BO - Settings (Hub Admin) - Generate Batch Invoice (STMS,APT,eSTM)".
3. "BO - RHB Reconciliation Audit Log"; "BO Settings - RHB Payment Transaction";
   "BO eAuto Plus RHB Payment Transaction".
4. "BO - Proforma Invoice / E-Invoice Listing"; "BO - Account Management - Manage
   e-Invoice Setup Company Listing". Relevant to EAINT-12333 (future #19).
5. Staging `SstPaymentReportJomCheck` (14 tests) runs under `boFinanceLogin()` — the
   SST Payment Report needs a Finance BO login.
6. Payment-date filter pattern repeated across APT, BMK, Dereg, STMS, eSTM,
   Insurance listings: "Filter by 'Payment From' & 'Payment To' date", then
   "(1-Month Duration)" and "(If yesterday was a public holiday)" variants. STMS
   adds "TH Payment Status = OK". `[charmain-repo: intake/reports/legacy-shared.json:657]`

### STMS bulk payment (EAINT-12054)

Bulk payment refuses STMS transactions whose SSM document is invalid; the rules
Charmain's specs assert are in `cr-ledger.md` § EAINT-12054. Her
`set-rhb-response` tool patches and restores the RHB transfer response, and
`pay-transaction` pays an existing Pending transaction.
`[charmain-repo: intake/reports/charmain-12054.md:23-100]`
