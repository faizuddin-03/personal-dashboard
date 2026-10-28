# STMS (temporary ownership transfer) (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/stms.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- STMS moves a vehicle from its owner (seller) to a dealer (UCD) for a temporary period. The dealer does it in the UCD portal in 6 steps and pays by RHB. After 6 months an unsold vehicle moves to APT. The module also has bulk screens, company-seller SSM checks, BO support actions and Transfer History.
- Portals: UCD Portal, Back Office, JPJ (external), RHB (payment)
- Related modules: stms-addons, apt, ssm, payments-fees, ucd-to-ucd, platform

## Glossary
- STMS: Sistem Tukar Milik Sementara. The Wholesale glossary says 'Surat'. The repo uses 'Sistem' until the BA answers. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Name] [jira: EAINT-12403 SRD v1.1 §1.4]
- UCD: Used Car Dealer. The buyer in an STMS. [azfar: eauto-qa-azfar:knowledge/_core/stms.md]
- Perakuan: The consent text the seller and the UCD must tick at Step 1 and Step 3. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 1] [jira: EAINT-9204 2026-01]
- TH (Transfer History): A paid add-on bought at Step 4. It shows past ownership transfers of the vehicle. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 4]
- Slip Pengesahan: The confirmation slip on Transaction Details. It holds the company copy, seller copy and both Perakuan. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents]
- JPJ Check / JPJ Enquiry: The vehicle check sent to JPJ at Step 4. A second enquiry runs around payment. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 4]
- Usage code: A code recorded against the vehicle. It picks the price row. Example: AA = Motosikal, AH = e-hailing. [azfar: eauto-qa-azfar:knowledge/_core/usage-codes.md]
- Bypass Purchase SSM: A user-level BO setting. The user uploads all documents and does not buy an SSM document. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [jira: EAINT-8802 2026-01]

## Flow: STMS single transaction (6 steps)
- A dealer takes in a vehicle from an individual (MyKad or MyPR) or a company. Steps: Seller, Seller & Vehicle details, UCD authentication, JPJ check, Payment, Transfer.
- Portals: UCD Portal, JPJ (external), RHB (payment)

### Entry points and steps
- Entry point "Create a new transaction": UCD Home › STMS › CREATE NEW TRANSACTION [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Entry points] [askeauto: 07-ask-eauto.md Q3 §1.1 (prod/master 0e21bef3) 2026-10-23]
  - The normal way in. The user picks the seller category first.
  1. Choose the seller category | where: UCD Portal › STMS › Create New Transaction | Tiles: MALAYSIAN (MyKad), MyPR, Company. A confirm dialog asks Yes. The record starts as status New. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Categories] [askeauto: 07-ask-eauto.md Q3 §2.1 (prod/master 0e21bef3) 2026-10-23]
     - If Seller is a foreigner -> Not offered. Screen says 'Warga asing mesti tukar milik di kaunter JPJ'.
     - If Seller is an Association -> Removed. JPJ no longer accepts it (EAINT-8649).
  2. Step 1 - Seller Authentication ('Seller (Owner)') | where: UCD Portal › STMS › Step 1 | Key in vehicle number and tick seller consent. Perakuan 'PERAKUAN STMS / TH - PENJUAL' shows first. The thumbprint part stays hidden until the Perakuan is ticked. Once ticked it cannot be unticked. Then read MyKad and verify thumbprint. Next stays hidden until the thumbprint passes. | affects: Platform: MyKad / thumbprint reader [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 1] [jira: EAINT-9204 2026-01]
     - If Chrome, Edge or Firefox 37+ -> Uses the WebSocket reader (ws://localhost:7878).
     - If Firefox 36.0.4 -> Still uses the Java applet.
     - If WebSocket fails to open -> Message 'Update Required - Dermalog Biometric Device'. No version is compared.
     - If Cancel -> Back to the Create STMS Transaction category page.
  3. Step 2 - Seller & Vehicle Details | where: UCD Portal › STMS › Step 2 | Individual: seller mobile, email, engine/chassis no, Make > Model, Year. Company: Type of Business (mandatory) and document uploads (up to 5MB each). | affects: SSM: documents depend on SSM settings [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 2] [jira: EAINT-4332 2024] [jira: EAINT-5147] [jira: EAINT-4942 2024-11]
     - If Mobile or email belongs to the main user or any sub user of the same UCD company (active or inactive) -> Blocked.
     - If Same mobile or email used more than 3 times in the last 30 days on Approved Individual transactions in the UCD's company -> Blocked.
     - If Same vehicle + owner already recorded -> Blocked: 'Transaksi yang sama untuk kenderaan dan pemilik ini telah direkod sebelum ini...'.
     - If Company seller changes Type of Business -> Uploaded documents are cleared.
  4. Step 3 - UCD Authentication ('Buyer (Dealer)') | where: UCD Portal › STMS › Step 3 | The logged-in UCD gives its own thumbprint ('Please use login user'). A JPJ receipt email field shows. Perakuan 'PERAKUAN STMS / TH - UCD BERDAFTAR': the JPJ fee receipt goes to the main-user email (editable) with a copy to receipt@eauto.my. The text says STMS ends after 6 months and then transfers permanently to the UCD via APT. | affects: APT [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 3] [jira: EAINT-9204 2026-01]
     - If Transaction thumbprinted before the Perakuan deploy and resumed after it -> The Slip Pengesahan keeps the Perakuan version it was thumbprinted with.
  5. Step 4 - Submission (JPJ Checking) ('JPJ Check') | where: UCD Portal › STMS › Step 4 | Tick agree, then Submit to JPJ. Result shows Valid As At, Blacklisted, Hak Milik Dituntut, Condition Code, JPJ Enquiry Status, Response Code. Pending status is set as soon as the enquiry call starts. | affects: JPJ XML Log (STMS); Transfer History purchase; SSM purchase (company) [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 4] [askeauto: 07-ask-eauto.md Q3 §2.4 (prod/master 0e21bef3) 2026-10-23]
     - If JPJ check OK -> Buttons: Make Payment (STMS) and Save & Continue Later.
     - If JPJ check fails -> [Resubmit] shows instead of payment.
     - If JPJ returns usage code AH -> Usage code AH shows on Step 4 and Transaction Details, even on a failed enquiry. Hidden otherwise (EAINT-11057).
     - If Company seller -> SSM check or Purchase SSM happens here. See the SSM module.
  6. Step 5 - Payment | where: UCD Portal › STMS › Step 5 | Payment Summary: JPJ Fee + eAuto Fee + Service Tax 8% = Total. Car today: 10.00 + 25.00 + 2.00 = RM37.00 (since 02.10.2026). Button [STMS Payment]. A 2nd JPJ enquiry runs around payment. Pays through RHB (simulated by eSim on staging). | affects: RHB payment; BO RHB Payment Transaction; STMS Add-ons (LKM Refund, Insurance Cancellation) [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 5] [jira: EAINT-12403 2026-10]
     - If RHB returns anything other than OK -> A dialog shows and the user stays on Step 5. [Retry (STMS Payment)] is offered.
     - If RHB error RE (Invalid Tx Ref No) -> A countdown banner shows with the hotline [hotline number omitted].
     - If Retry, company has an active RHB account, same day -> Old stored amount is re-sent.
     - If Retry, company has an active RHB account, next day or later -> RHB rejects the old reference ('RHB ERROR-RE'). Cannot be paid until BO Reset Payment.
     - If Company has no RHB account or RHB is inactive -> Screen shows the current price. FPX or account balance charge it. An RHB attempt is refused 'Payment in progress.'
     - If Add-on ticked (LKM Refund, or Insurance Cancellation for Individual) -> Opens its own pop-up. See STMS Add-ons.
  7. Step 6 - Submission (JPJ Transfer) ('Transfer') | where: UCD Portal › STMS › Step 6 (stms/transaction/jpj-sub.do?id=) | Shows 'JPJ Transfer Status: OK - SUCCESSFUL' with the submission date and time. Done opens STMS Transaction Details. On success the status becomes Approved. On rejection or timeout it becomes Failed. | affects: STMS Transaction Listing (UCD + BO); e-Invoice (LHDN); Elasticsearch listing index [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 6] [askeauto: 07-ask-eauto.md Q3 §2.6 (prod/master 0e21bef3) 2026-10-23]
     - If JPJ final submission fails -> Status Failed. Resubmit from the listing, or the hourly STMS JPJ submission job retries (see cronjobs).
  - [unconfirmed] Firefox-only 'Browser Reminder' popup is FUTURE (EAINT-12253, S34.X-20261028) at the last step. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#FUTURE]
- Entry point "Resubmit a saved or failed transaction": UCD › STMS › STMS TRANSACTION LISTING › Resubmit [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Entry points]
  - Continues a transaction that was saved with Save & Continue Later, or that failed.
  1. Open the STMS Transaction Listing and click Resubmit | where: UCD Portal › STMS › STMS Transaction Listing | A Failed row offers View and Resubmit. A saved row continues from where it stopped. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Entry points] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
     - If JPJ Check failed -> Back to Step 4 [Resubmit] to run the JPJ enquiry again.
     - If Payment failed -> Step 5 [Retry (STMS Payment)].
     - If Company SSM bought within 7 days -> Goes to Step 5.
     - If Company SSM bought more than 7 days ago -> Back to Step 4 to buy SSM again.
- Entry point "Interstate buyer accepts (To Accept)": UCD (buyer) › STMS › STMS TRANSACTION LISTING › To Accept [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked]
  - A UCD to UCD Interstate transaction shows in the buyer's STMS listing. To Accept goes straight to Step 3.
  1. Click To Accept on an 'Interstate New' row | where: UCD Portal › STMS › STMS Transaction Listing | Remarks read 'TO THUMB IN BY <created + 48 h>'. No dialog. Lands on Step 3 Buyer Authentication. The rest follows the single transaction steps. See the UCD to UCD module. | affects: UCD to UCD [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked]
- Entry point "Mobile app STMS": UCD mobile app › STMS (/mb/ucd/stms/*) [askeauto: 07-ask-eauto.md Q3 §1.5 (prod/master 0e21bef3) 2026-10-23]
  - The app mirrors the web steps: permission check, seller and buyer MyKad, JPJ enquiry, payment.
  1. Run STMS from the app | where: UCD mobile app › STMS | Prod code has app equivalents under /mb/ucd/stms/*. The Android home tile price for STMS and UCD to UCD changes RM25 to RM35 (EAINT-12550, Code Review). | affects: Mobile app tile prices [askeauto: 07-ask-eauto.md Q3 §1.5 (prod/master 0e21bef3) 2026-10-23] [jira: EAINT-12550 2026-10]
- Entry point "Homepage STMS cancellation reminder popup (dormant)": UCD Home › popup dialog-stms-cancellation-reminder.jsp [askeauto: 07-ask-eauto.md Q3 §1.6 (prod/master 0e21bef3) 2026-10-23] [askeauto: 07-ask-eauto.md Q2 (gap worth testing) (prod/master 0e21bef3) 2026-10-23]
  - Prod code has a popup that nags dealers to resubmit or pay Pending or Failed STMS before a cut-off. The dates are hard-coded to a 2024 campaign.
  1. Popup built but not wired into the popup queue | where: UCD Home | Ask eAuto says the popup is not wired into the queue that opens popups, so it is effectively dormant. [askeauto: 07-ask-eauto.md Q3 §1.6 (prod/master 0e21bef3) 2026-10-23]

### Cross-module effects (what it affects)
- STMS Transaction Listing (UCD) and BO > STMS Transaction (view/stms/enquiry). [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- JPJ: 2 enquiries plus the final submission. JPJ's reply carries the 6-month expiry date (e.g. 2027-03-25 for a transfer on 25-09-2026). Seen in BO > JPJ XML Log (STMS). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Rules still unsettled]
- Invoice and e-Invoice. e-Invoice button shows when LHDN Response Status = OK. Document code EA-IV-MMYY-XXXXXXX. Line reads 'Sistem Tukar Milik Sementara ("STMS") service charge'. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents] [jira: EAINT-2450 2025-06]
- JPJ Official Receipt PDF arrives by email and shows as a button on Transaction Details (hidden until received). File name ABC1234_STMS_JPJReceipt_yyyyMMddHHmm. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents] [jira: EAINT-9204 2026-01]
- Slip Pengesahan: company copy, seller copy, Perakuan Penjual, Perakuan Pembeli. For STMS approved after 9204 the eAuto e-payment JPJ receipt is no longer inside it. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents]
- After 6 months the vehicle moves to APT. [azfar: eauto-qa-azfar:knowledge/_core/apt.md] [askeauto: 07-ask-eauto.md Q3 §5.4 (prod/master 0e21bef3) 2026-10-23]
- Transaction is indexed into Elasticsearch (feeds listing and search pages). e-Invoice event goes to eauto-einvoice. [askeauto: 07-ask-eauto.md Q3 §5.1-5.2 (prod/master 0e21bef3) 2026-10-23]
- BO STMS CSV export STMS_YYYYMMDDHHmm, 34 columns, includes 'Last 3 Months Total Ownership Transfer' and 'Latest Ownership Transfer Date' ('None' when no TH). With LKM Refund the export grows to 41 columns. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Reports] [ts: EAINT-3210 TS01] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
- JPJ receipt number column 'NO. RESIT JPJ' in JPJ Reports and 'NO. RESIT' in JPJ Hasil. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Reports] [jira: EAINT-9642 2026-05]
- [unconfirmed] No customer email, SMS or WhatsApp was found on the STMS completion path. Only the e-Invoice event and an internal dashboard push. [askeauto: 07-ask-eauto.md Q3 §5.5 (prod/master 0e21bef3) 2026-10-23]
- [unconfirmed] Event STMS_APPROVED is not sent for UCD to UCD (UTU / IUTU) after EAINT-12324. For plain STMS it is not known. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [jira: EAINT-12324 2026-10]

### Cronjobs
- StmsJpjSubmissionJob (also called stmsJpjSubmissionTrigger) | Hourly, roughly 9am to 11pm (dev-reference scheduler config; prod file withheld) | Batch JPJ submission for STMS. For Pending (patched) transactions it resends the second enquiry and the submission. [askeauto: 07-ask-eauto.md Q3 §3.1 (prod/master 0e21bef3) 2026-10-23] [azfar: eauto-qa-azfar:01b-azfar-extra.md Flow: Resubmit JPJ Final Submission (BO) and payment reset]
- [unconfirmed] JpjExpiryNotificationJob | Daily, about 5am (dev-reference) | Sends JPJ expiry notices. It is the mechanism that turns an aging STMS into an APT transaction. [askeauto: 07-ask-eauto.md Q3 §3.3 (prod/master 0e21bef3) 2026-10-23]
- [unconfirmed] e-Invoice resubmission for invalid or blank TIN | Unknown | Resubmits the e-Invoice to LHDN once the TIN is fixed in BO. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents] [ts: EAINT-8550]
- APT resubmit / auto-pay (downstream) | Daily 8:00pm in production | Not STMS. STMS has no auto-pay. See the APT module. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Resubmit cronjob (EAINT-8668)]

### Roles
- UCD portal only (CompanyType = UCD), landing on /view/ucd/home. [askeauto: 07-ask-eauto.md Q3 §4.1 (prod/master 0e21bef3) 2026-10-23]
- Needs the company flag sistemTukarMilikSementara AND the staff member's matching permission. [askeauto: 07-ask-eauto.md Q3 §4.2 (prod/master 0e21bef3) 2026-10-23]
- UCD main user and sub users (Module Permission in UCD Settings > User Accounts). A 'Valuation Advisor' has no payment rights. [azfar: eauto-qa-azfar:knowledge/_core/roles-and-accounts.md]
- BO company flag 'Transaction Restriction = Yes' blocks create, resubmit, bulk JPJ enquiry and bulk payment. Popup: 'You are currently restricted from performing transactions. Please contact eAuto at [hotline number omitted].' [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [ts: EAINT-9044 STMS_TS1]
- No Insurance, Credit/Bank, JPJ, AATF, Service Portal or public path to STMS was found. [askeauto: 07-ask-eauto.md Q3 §4.5 (prod/master 0e21bef3) 2026-10-23]

### Where the transaction goes
- Approved row in UCD STMS Transaction Listing and BO STMS Transaction, with Invoice, e-Invoice, JPJ Official Receipt and Slip Pengesahan on Transaction Details. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 6] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents]
- Payment settles through RHB Direct Debit or FPX. Reconciliation reports track it against the bank. [askeauto: 07-ask-eauto.md Q3 §5.3 (prod/master 0e21bef3) 2026-10-23]
- After 6 months the vehicle moves to APT. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Rules still unsettled] [askeauto: 07-ask-eauto.md Q3 §5.4 (prod/master 0e21bef3) 2026-10-23]

### Rules
- Seller categories: Individual MyKad, Individual MyPR, Company. Foreigner is not offered. Association was removed (EAINT-8649, Done 13.08.2025). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Categories] [jira: EAINT-8649 2025-08]
- Fee comes from the rate card (transfercost): one row per type x usage code x region x CAR/BIKE. CAR or BIKE comes from the JPJ body type. The payment is priced when it is made, with no date logic. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#How a charge is made up]
- Car fee: JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00 (since 02.10.2026). Before that RM20 + 8%, Step 5 RM31.60. Before 31.03.2026 RM15. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 5] [jira: EAINT-12403 2026-10] [jira: EAINT-10175 2026-03]
- AA (Motosikal, body MSL) fee does not move with Car price CRs: JPJ 1.00 + eAuto 5.00 + 0.40 = RM6.40. Bike rows on AB-AE stay at RM26.20. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Rows that price differently (rate card, live 20.09.2026)] [mine: 02b business-rules §1.2]
- STMS has no auto-pay. A reset STMS waits for the UCD. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 5] [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes]
- Statuses: New, Pending, Approved, Failed, Cancelled, InterStateNew, InterStateExpired, InterStateCancelled. Draft, Expired, PendingApproval, InterStateDraft and CommitedJPJApproved exist in the enum but are not confirmed for STMS. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Statuses] [askeauto: 07-ask-eauto.md Q3 §7 (prod/master 0e21bef3) 2026-10-23]
- Pending is set the moment a JPJ enquiry starts. Failed is set when the JPJ call times out or errors. Approved only when Step 6 succeeds. [askeauto: 07-ask-eauto.md Q3 §7 (prod/master 0e21bef3) 2026-10-23]
- Payment OK + Tx Failed is not covered by price CRs: not reset, not picked up by the cronjob. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Decided, not open]
- Type of Business shows on Step 4, 5, 6 and Details. '-' for transactions created before it existed. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents] [jira: EAINT-4942 2024-11]
- Usage code AH shows on Step 4 and Transaction Details only when JPJ returns AH. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 4] [jira: EAINT-11057 2026-06]
  - Conflict: other version: AH shows on Step 4, Step 6 and Transaction Details. [ts: EAINT-11057 11057_STMS_TS1] [mine: 02b business-rules §1.2] (TS title and Faizuddin's note list Step 6 as well. Azfar's repo lists Step 4 and Details.)
- The MyBioID installer v2 check (EAINT-9944) never went live (Closed 28.08.2026). Do not test it. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 1] [jira: EAINT-9944 2026-08]

### QA scope to check
- Run each seller category: MyKad, MyPR, Company. Foreigner and Association must not be offered. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Categories] [ts: EAINT-9044 STMS_TS1-TS10]
- Check Step 2 blocks: mobile/email of main or sub user, 3 uses in 30 days, duplicate vehicle + owner. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 2]
- Check the JPJ enquiry failure path: Resubmit shows instead of payment. Check usage code AH shows on a failed enquiry. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 4] [ts: EAINT-11057 11057_STMS_TS4-TS5]
- Check Step 5 amounts for Car, Commercial Car and Bike, and before/after a price push. Check Home tile and module page prices. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Every surface a price reaches] [ts: EAINT-12403]
- Check failed payment: RHB IF, UCD actions View | Resubmit, BO actions View | Cancel | Reset, BO Reset leaves Payment '-' and Tx Pending. [ts: EAINT-12403 12403_STMS_PAY1] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- Check negative reset: JPJ Enquiry Failed (4K Hak Milik Dituntut) has BO actions View | Cancel only. Approved has no Reset. [ts: EAINT-12403 12403_STMS_NEG1-NEG2]
- Check invoice, e-Invoice, Slip Pengesahan, JPJ Official Receipt button and reports after approval. Old transactions keep the old amount. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Every surface a price reaches] [ts: EAINT-12403]
- Check the BO STMS Transaction Listing and its CSV export (column order, file name). [ts: EAINT-3210 TS01-TS05]
- Check Firefox 36 (Java applet) and Chrome (WebSocket) on Steps 1 and 3. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 1] [jira: EAINT-7229 2025-12]
- Check that Transaction Restriction = Yes shows the Notice popup on create, resubmit and both bulk screens. [ts: EAINT-9044 STMS_TS1-TS10]
- Check the UCD user guide links on the STMS landing page (STMS for MyKad/MyPR, STMS for Company). [ts: EAINT-11835 STMS_11835_TS01-TS04]
- Run a Wholesale STMS price check when a fee changes (Wholesale shows RM27.00). [mine: 02b business-rules §1.2] [ts: EAINT-12403 12403_STMS_R2]

### Ticket history
- EAINT-12403 (2026-10): STMS (incl. UCD to UCD) and APT eAuto fee RM20 to RM25 for Car and Commercial Car. Live S34.2-20261001. [latest]
- EAINT-10175 (2026-03): STMS Car eAuto fee RM15 to RM20. Bike unchanged. [legacy, superseded by EAINT-12403]
- EAINT-12289 (2026-09): APT fee RM15 to RM20 (reset rules reused by 12403). [legacy, superseded by EAINT-12403]
- EAINT-9204 (2026-01): Perakuan at Step 1 and Step 3. JPJ Official Receipt button. [latest]
- EAINT-10108 (2026-10): the word "pemohon" added to the email line of 4 Perakuan: Step 1 Perakuan Penjual (Individual and Company, item iii) and Step 3 Perakuan UCD Berdaftar (Individual and Company, "section Pulangan Balik Hasil Lesen Kenderaan Motor (LKM), item i"). New Step 1 Individual text: "Saya juga bersetuju Butir-Butir Bayaran Balik LKM akan dihantar ke alamat emel pemohon <Insert emel pemohon> dan sesalinan akan dihantar kepada emel lkmrefund@eauto.my jika saya memilih (√) di petak Permohonan Pulangan Balik Hasil LKM;". Why: "to ensure only the customer's email address is entered for LKM Refund applications, so the customer receives refund notifications and updates directly, and UCD does not use their own email address." No SRD; wording came from Ops documents. Fix version S34.16-20261027. [from ticket EAINT-10108, Jira description rows 3 and 5]
  - Only "pemohon" is required; other text differences between Jira and screen were waived by the BA: "can ignore them, just ensure to add the "pemohon" word will do" [from Teams EAINT-10108, 2026-10-21 14:19, Yi Link Lim]
  - Whether the consent / Slip Pengesahan PDF also carries "pemohon" is not recorded; the dev's question "cover the consent pdf , right?" had no captured reply. [unconfirmed]
  - Ops naming rule for the Perakuan source files: "file name without "(Syarikat)" = Individual; file name with "(Syarikat)" = Company." [from ticket EAINT-10108, Jira description row 6]
- EAINT-8802 (2026-01): Bypass Purchase SSM BO page. Per-user STMS/eSTM tick. [latest]
- EAINT-5155 (2025-01): Company seller: SSM check at Step 4. [latest]
- EAINT-4942 (2024-11): Type of Business and 3 documents for Company sellers. [latest]
- EAINT-2450 (2025-06): e-Invoice for STMS. [latest]
- EAINT-7229 (2025-12): WebSocket reader for Chrome, Edge and Firefox 37+. Firefox 36 keeps the applet. [latest]
- EAINT-8649 (2025-08): Association removed from company options. [latest]
- EAINT-11057 (2026-06): Show usage code AH on Step 4 and Details. [latest]
- EAINT-9642 (2026-05): NO. RESIT JPJ column in BO reports. [latest]
- EAINT-12253 (2026-10): FUTURE: Firefox-only Browser Reminder popup at the last step. Testing In 1st Env (Jira, read 2026-10-26), QA 36/36 PASS on staging/uat1, fix version S34.17-20261028. See knowledge/flow-platform.md for SRD-vs-build conflicts. [source: _reference/tickets/Studying/EAINT-12253/EAINT-12253-study.md §1 #2, #7] [latest]
- EAINT-12332: FUTURE: MyKad WebSocket reconnect button before 'Update Required'. To Do.
- EAINT-12254: FUTURE: JPJ error 3S shows 'Pending Additional Verification'. On Hold.
- EAINT-9944 (2026-08): MyBioID installer v2 check. Closed, never deployed. [legacy]

### Open questions
- Is the 6-month rule enforced by eAuto or only by JPJ notices? Perakuan says 6 months. Azfar found no 6-month check in eAuto. Ask eAuto says JpjExpiryNotificationJob creates APT.
- Does a bulk payer ever see the Firefox Browser Reminder? In Firefox 36 it did not show on any bulk screen (EAINT-12253 Q5, open with BA).
- Which BA name is right: 'Sistem' or 'Surat' Tukar Milik Sementara?
- Is the 'Update Required' text on Step 1 ever a real version check? Code reading says no.

## Flow: Bulk Payment Submission and Bulk JPJ Enquiry
- A dealer pays or re-checks many STMS in one go. Bulk Payment pays STMS whose JPJ check is OK. Bulk JPJ Enquiry re-runs the check for STMS whose enquiry failed.
- Portals: UCD Portal, Back Office (blackout windows)

### Entry points and steps
- Entry point "Bulk Payment Submission": UCD › STMS › BULK PAYMENT SUBMISSION (view/ucd/stms/bulk-payment/list.do) [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026] [askeauto: 07-ask-eauto.md Q3 §1.4 (prod/master 0e21bef3) 2026-10-23]
  - Page is empty until a search is run.
  1. Search the list | where: UCD › STMS › Bulk Payment Submission | Page shows 'Please apply search to show the record.' Filters: Vehicle No, Transaction No, Date Created (pickers only), Status Pending or Failed. Search loads the list by AJAX. It lists the company's STMS with JPJ Check OK and no payment, including ones saved at Step 4. 20 rows per page, newest first, 'Total records: N', select-all, Export Excel. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]
  2. Tick rows and press Perform Bulk Payment Submission | where: UCD › STMS › Bulk Payment Submission | Ticking shows 'N of M records selected.' The button first checks the transaction restriction. Then the dialog 'Confirm Bulk Payment Submission' asks Yes or No. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]
     - If Company is restricted -> 'Transactions are temporarily disabled until you update Company Profile...'.
     - If A bulk submission is already running -> 'A Bulk Submission is currently in progress, please resubmit in 5 minutes.'
     - If Ongoing payment on a transaction -> 'There are ongoing payment transaction(s)'.
  3. Each STMS is paid and transferred | where: Background run | A progress dialog polls every 5 seconds, then '1 / 1 Bulk Payment Submission is completed.' [OK] updates the rows in place. There is no Step 5 or Step 6 and no amount on the bulk screens. Each STMS gets a fresh JPJ enquiry, its own RHB payment and the JPJ final submission. Rows go Pending to OK / OK / OK / Approved in about 16 seconds. Items run one at a time with half-second pacing. SSM is re-checked per company transaction. | affects: SSM (StmsBulkPaymentSsmValidationHandler); RHB payment; e-Invoice [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026] [askeauto: 07-ask-eauto.md Q3 §2 (prod/master 0e21bef3) 2026-10-23] [jira: EAINT-12054 2026-08]
     - If SSM check fails at run time -> Item is marked SkippedSsm.
     - If Transaction already Approved, Cancelled or InterStateCancelled -> Skipped. A 'Payment Sent' dialog lists skipped transactions.
     - If JPJ or RHB times out -> 'JPJ system timeout, please try again.' or 'RHB timeout, please try again later.'
- Entry point "Bulk STMS JPJ Enquiry": UCD › STMS › BULK JPJ ENQUIRY (view/ucd/stms/bulk-enquiry/list.do) [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026] [askeauto: 07-ask-eauto.md Q3 §1.3 (prod/master 0e21bef3) 2026-10-23]
  - Same search filters as bulk payment, without the status filter.
  1. Search, tick and run the enquiry | where: UCD › STMS › Bulk JPJ Enquiry | Lists STMS whose JPJ enquiry failed. Columns: Valid As At eHAK, JPJ Enquiry Status, Response Code. Each row has a tick box. The walk on 22.10.2026 did not run it (nothing ticked). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]
     - If JPJ call times out or errors and the last enquiry was not already Passed or Approved -> Status becomes Failed.
- Entry point "BO bulk blackout window": BO › Bulk Submission Control (/view/bulk-submission-control/*) [askeauto: 07-ask-eauto.md Q3 §1.8 (prod/master 0e21bef3) 2026-10-23]
  - Staff define windows that block both bulk screens for everyone.
  1. Staff set a blackout window | where: Back Office › Bulk Submission Control | Not a way to start a transaction. While a window is active, Bulk JPJ Enquiry and Bulk Payment are blocked. [askeauto: 07-ask-eauto.md Q3 §1.8 (prod/master 0e21bef3) 2026-10-23]

### Cross-module effects (what it affects)
- Each bulk-paid STMS keeps its own RHB reference and its own invoice. Example: eAuto line RM25.00 + 8% = RM27.00. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]
- Paid rows leave the Bulk Payment list. F5 empties the page again. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]
- Bulk Payment blocks Approved, Cancelled and Interstate Cancelled transactions. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses] [jira: EAINT-12054 2026-08]

### Roles
- Bulk JPJ Enquiry needs the company flag and the user flag bulkJpjEnquirySubmission (BulkJpjEnquirySubmissionFilter). [askeauto: 07-ask-eauto.md Q3 §4.3 (prod/master 0e21bef3) 2026-10-23]
- Bulk Payment needs the company flag and the user flag bulkPaymentSubmission (BulkPaymentSubmissionFilter). [askeauto: 07-ask-eauto.md Q3 §4.4 (prod/master 0e21bef3) 2026-10-23]

### Where the transaction goes
- Rows update in place on the bulk page, then show Approved in the STMS Transaction Listing. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]

### Rules
- Bulk item statuses: Submitted, Processed, Skipped (already final), SkippedSsm (bulk payment only). [askeauto: 07-ask-eauto.md Q3 §7 (prod/master 0e21bef3) 2026-10-23]
- Browser Reminder (EAINT-12253) did not show on any bulk screen in Firefox 36. It shows on Step 6 of a bulk-paid STMS only when opened by address. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]

### QA scope to check
- Check the empty page, each search filter, and 'Total records'. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]
- Check a restricted company is blocked with the right message. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026] [ts: EAINT-9044]
- Check bulk payment with a company seller: SSM check per transaction, and a skipped one in the 'Payment Sent' dialog. [jira: EAINT-12054 2026-08]
- Check each paid STMS has its own invoice and RHB reference, and the amount matches a single STMS. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Bulk screens — observed 22.10.2026]
- Check UCD to UCD bulk (Standard and Interstate) separately. It has not been walked. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Gaps — nobody has written these down]

### Ticket history
- EAINT-12054 (2026-08): Bulk payment SSM check, SRD v1.2, Done 21.08.2026. [latest]
- EAINT-12253 (2026-10): FUTURE: Browser Reminder popup. Does not reach bulk payers (Q5 open). [latest]

### Open questions
- The production scheduler file is withheld, so the bulk run schedule and blackout behaviour were read from the dev-reference config.

## Flow: Company seller: documents and SSM check
- When the seller is a company, Step 2 asks for documents and Step 4 may force an SSM purchase. Two BO settings decide which. The full SSM journey is in the SSM module.
- Portals: UCD Portal, Back Office

### Entry points and steps
- Entry point "Company seller on Step 2 and Step 4": UCD › STMS › Create New Transaction › Company [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
  1. Step 1: company details and representative | where: UCD › STMS › Step 1 (Company) | Key in vehicle no, Company Name, Company Reg No (consent stays disabled until both are valid), email, then the representative's MyKad. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
     - If A UCD user's own IC is used as the company representative -> Refused: '... tidak dibenarkan menjadi wakil penjual syarikat ...'.
     - If Reg No like QA597435 -> Rejected as invalid. 540323-T style and the 12-digit new BRN are accepted.
  2. Step 2: documents by Type of Business and SSM setting | where: UCD › STMS › Step 2 | Sdn Bhd or Bhd: SSM Company Profile + Board Resolution + Staff Employment Pass & MyKad. Sole Proprietorship or Partnership: SSM Business Profile + Authorisation Letter + Staff Employment Pass. Uploads up to 5MB. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [jira: EAINT-4942 2024-11]
     - If Company SSM Permission ticked and user Bypass not ticked -> Board Resolution or Authorisation Letter only. Purchase SSM is compulsory at Step 4 unless an Approved SSM within 7 days exists.
     - If Company SSM Permission ticked and user Bypass ticked -> All 3 documents (SSM profile bought within 7 days, pdf). No SSM purchase.
     - If Company SSM Permission not ticked -> All 3 documents. No SSM purchase.
     - If SSM permission changes mid-flow -> Popup 'Upload Seller Company Information' with [Update Document]. Make Payment is greyed until updated.
  3. Step 4: Purchase SSM or Make Payment | where: UCD › STMS › Step 4 | Make Payment shows only when JPJ succeeded, SSM was bought and the director matched on IC number. See the SSM module for the purchase pop-ups. | affects: SSM [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM] [jira: EAINT-5155 2025-01]
     - If Both STMS and ESTM Company Category boxes are ticked on the company before the transaction starts -> Purchase SSM is offered at Step 4 (Azfar, 21.10.2026). With only the STMS box ticked it was not offered on 29.09.2026.
     - If SSM document Company Name does not match Step 1 -> Transaction Cancelled with 'Create Again' (EAINT-10119).
     - If Business Registration Number does not match -> Stays Pending. Save & Continue Later only. The SSM fee is already paid.

### Cross-module effects (what it affects)
- BO SSM Transaction listing, SSM XML Log, SSM Document / SSM Invoice / SSM e-Invoice on Transaction Details. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents]
- Company document upload and SSM purchase apply to STMS Company only, not UCD to UCD. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [jira: EAINT-4942]

### Roles
- BO company box 'STMS - Company Category' (ssmPermission) and user box 'Bypass Purchase SSM' decide the path. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]

### Where the transaction goes
- Back to normal STMS Step 4, then 5, then 6. [azfar: eauto-qa-azfar:01-azfar-repo.md Flow: STMS Company seller - SSM Permission / Purchase SSM at Step 4]

### Rules
- Type of Business only matters when testing Pre-Application and Application. For STMS and eSTM any company behaves the same unless the CR is about business types (QA, 2026-09-25). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- [unconfirmed] LLP appears as a third Type of Business in 12054 v1.2 and workbook 9247. No requirement ticket adds it to STMS. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]

### QA scope to check
- Run the permission matrix: company tick x user bypass tick x business type. [ts: EAINT-8802 E2E_STMS_TS1-TS6] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]
- Check Name mismatch (Cancelled + Create Again) and BRN mismatch (Pending). [jira: EAINT-10119 2026-10]
- Check resubmit within and after 7 days of the SSM purchase. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Company category and SSM]

### Ticket history
- EAINT-8802 (2026-01): Bypass Purchase SSM BO page. Newer model. [latest]
- EAINT-8526 (2025-07): SSM hybrid model (company + user level). [legacy, superseded by EAINT-8802]
- EAINT-5155 (2025-01): SSM check of the seller representative at Step 4. [latest]
- EAINT-10119 (2026-10): Company Name / BRN mismatch handling. Live S34.2-20261001. [latest]
- EAINT-12054 (2026-08): Bulk payment SSM check. [latest]
- EAINT-12121 (2026-10): FUTURE: SSM repurchase without the 7-day block. Code Review. Fix version S35.X-20261102 (release 2026-11-02), read from Jira 2026-10-26; earlier S34.X-20261028 here is superseded. No deployment date or test env set. Test together with EAINT-12230. [source: _reference/tickets/Studying/EAINT-12121/EAINT-12121-study.md Header #4: "S35.X-20261102 🌞/🌚" (release date 2026-11-02)] [source: Teams eAuto QAs, Amirul Azfar (QA), 2026-10-20 14:14: "Hi Charmain for this two tickets , the testing estimation for both ticket is ( 7 + 2) days. I dont think can deploy on 28th Oct Morning"] [latest]
- EAINT-12230 (2026-10): FUTURE: duplicate SSM purchase validation (Bug). Code Review. Fix version S35.X-20261102, read from Jira 2026-10-26. 28 Oct not feasible per QA (same Teams message as 12121). Miro: "- Test together with EAINT-12121". [source: _reference/tickets/Studying/EAINT-12230/EAINT-12230-study.md Header #4, #10] [latest]

### Open questions
- Which document pairing is current: EAINT-8526 (Main UCD STMS uses Board Resolution, Sub UCD eSTM uses Authorisation Letter) or EAINT-8802 (reverse)?
- The 5155 SRD says Purchase SSM is compulsory at Step 4 when SSM Permission is ticked. The 29.09 walk saw Make Payment straight away. Azfar later found both STMS and ESTM boxes are needed. Confirm with Dev or BA.

## Flow: Back Office support actions on STMS
- BO staff reset a failed payment, cancel, edit fields, reset JPJ status or resume a transaction.
- Portals: Back Office

### Entry points and steps
- Entry point "Reset Payment": BO › STMS Transaction (view/stms/enquiry) › [Reset] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [jira: EAINT-8826]
  1. Click Reset on a row with RHB Payment = Failed | where: BO › STMS Transaction | Browser confirm: 'Sure to reset payment for <vehicle>?'. After OK: Payment '-', Tx Pending, Remarks cleared, Reset link gone. The UCD can pay again. | affects: BO Reset Payment Report; UCD STMS listing (View, Resubmit) [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [ts: EAINT-8826 8826_TS1-TS8] [ts: EAINT-8766 8766_TS6]
     - If JPJ enquiry OK or Failed, Individual or Company -> Reset works as long as RHB Payment = Failed.
- Entry point "Support Tools: Cancel, edit, Reset JPJ Status, Resume": BO › Support Tools › STMS Transaction [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [jira: EAINT-8766] [jira: EAINT-11294]
  1. Edit or cancel a transaction | where: BO › Support Tools › STMS Transaction | Editable: Engine No, Chassis No, Make, Model, Year. MyKad No on an Approved individual transaction. Company Name and ROC on an Approved company transaction. Cancel remark: 'CANCELLED BY <BO account> on dd-mm-yyyy hh:mm'. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [mine: 02b business-rules §1.2] [ts: EAINT-8766 8766_TS7-TS12]
     - If A Failed JPJ-transfer transaction is edited and [Reset JPJ Status] is clicked -> JPJ Transfer and Tx Status become Pending.
     - If Interstate Cancelled -> BO can [Update] and [Resume] it back to Pending (workbook 8766).
- Entry point "Company-level STMS settings": BO › Manage Company Accounts › Edit Company Account [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice]
  1. Set restriction, SSM or block flags | where: BO › Manage Company Accounts | Transaction Restriction Yes/No, Block STMS Category (Foreigner, Company, Limited Features for UCD to UCD), SSM Permission, Bypass Purchase SSM. | affects: UCD to UCD; SSM [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [jira: EAINT-8688] [jira: EAINT-11756]

### Cross-module effects (what it affects)
- Reset leaves the transaction in Payment '-' / Tx Pending, which is the APT cronjob's second pickup state. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]
- BO Reset Payment Report: filter by Vehicle No, not date. Reset rows carry the reset date as Payment Date. [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]

### Roles
- Reset button: named BO users (EAINT-8826). Editing STMS fields needs role Admin. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [ts: EAINT-8766 / EAINT-8826]
- Menu access: Support Tools STMS, Bulk STMS Cancellation, Resubmit JPJ Final Submission (STMS) and Manual APT Trigger go to SuperAdmin + Hub Admin. JPJ Reports is SuperAdmin only. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [ts: EAINT-10038]
- Bypass Purchase SSM page: Settings (Hub Admin); named users only. It has Export Excel and an audit log (max 1 month range). [azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice] [jira: EAINT-9842 2026-06]

### Where the transaction goes
- Pending in the UCD listing with View and Resubmit. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]

### Rules
- Never use the bulk admin link /ajax/admin/scheduler/reset-payment.do?transactionType=STMS|APT. It resets every pending or failed transaction, leaves bank records and writes no audit row. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]
- Order matters: update the rate first, reset after. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#When a price changes — failed payments and the reset]
- Reset takes Payment = Failed only. Scope differs per CR (12289: all Failed incl. Motosikal; 12403: Failed/Failed on the UCD portal only, Pending and Wholesale excluded). [azfar: eauto-qa-azfar:knowledge/_core/apt.md#Payment reset (BackOffice Reset Payment)]

### QA scope to check
- Check each BO account x action x transaction state, and the UCD-side effect and remark text. [ts: EAINT-8766 / EAINT-8826]
- Check the menu is hidden for roles without access. [ts: EAINT-10038]

### Ticket history
- EAINT-8826: Reset Payment button for named BO users. [latest]
- EAINT-8766: Cancel and edit permission for named BO users. [latest]
- EAINT-11294: Support Tools access for more users. [latest]
- EAINT-8688 (2025-08): Data patch: untick Block STMS Category (Company, Limited Features) for 24 companies. [latest]
- EAINT-8683 (2025-08): Data patch: enable SSM Permission for 24 companies. [latest]
- EAINT-9842 (2026-06): Dedicated audit log for Bypass Purchase SSM. [latest]

## Flow: Transfer History (TH) add-on
- At Step 4 the dealer can buy a Transfer History report for the vehicle.
- Portals: UCD Portal, Back Office

### Entry points and steps
- Entry point "Purchase Now at Step 4": UCD › STMS › Step 4 › Purchase Now [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 4] [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026]
  1. Buy the Transfer History | where: UCD › STMS › Step 4 | A pop-up says 'Additional Fee of RM20.80'. On the TH invoice page only the eAuto part shows: 10.00 + 0.80 = RM10.80. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026]

### Cross-module effects (what it affects)
- BO STMS CSV: TH Payment, TH JPJ, TH LHDN columns and the two ownership-transfer columns. Hidden TH Receipt for TH approved after EAINT-9204. [ts: EAINT-3210] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents]
- [unconfirmed] UCD to UCD has no Transfer History (workbook 7584, predates 9204). [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Fee and documents]

### Where the transaction goes
- [unconfirmed] TH shows on Transaction Details and in payment reports. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Documents] [ts: EAINT-3090]

### Rules
- TH price: JPJ 10.00 + eAuto 10.00 + SST 0.80 = RM20.80 (seen on staging preprod1, 12.10.2026). [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026]
- Older workbooks record only the eAuto part (10.00 + 0.80). [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Current prices — live on 20.10.2026] [mine: 02b business-rules §1.2]

### QA scope to check
- Check export with TH bought, no ownership transfer, TH JPJ Failed and no TH. [ts: EAINT-3210 TS01-TS05]
- Check the payment breakdown report lists TH. [ts: EAINT-3090]

### Ticket history
- EAINT-3210 (2026-06): Two extra columns in the BO STMS CSV. [latest]
- EAINT-3090 (2026-05): Payment Breakdown Report: BMK, TH, eLKM, eVOC. [latest]

## Additions from Charmain's QA repo — STMS Bulk Payment SSM check, EAINT-12054 (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1, last commit 2026-10-13). **Status: a colleague's notes and draft ledger (UCD-STMS-BULK-PAYMENT, 40 entries, none with a case), not verified live by us.** (doc) = SRD states it; (obs)/(dim) = her observation or reasoning. Tag: `[charmain-repo: <path>:<line>]`.

### SRD versions (copied to `_reference/tickets/EAINT-12054/`)
- v0.1 23.07.2026 initial draft; v1.0 24.07.2026 baseline ("REQ-005 as Invalid SSM Docs Popup"); v1.1 27.07.2026 REQ-005 popup message and listing; v1.2 03.08.2026 "reuse existing status-check error message to also cover the SSM scenario". Author Chee Mei Jia. CCB-866, EAUTO-990. [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt] [charmain-repo: docs/modules/ucd/stms-bulk-payment/README.md:44-47]
- Her scenario pack (outside her repo): xlsx, 167 scenarios; QA rulings 2026-08-15 to 08-18. [charmain-repo: docs/modules/ucd/stms-bulk-payment/README.md:48]

### SRD rules, verbatim (v1.2)
- Goal: "Prevent STMS bulk payments from proceeding when the required SSM documents have not been purchased, ensuring SSM compliance before payment." [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:120]
- Assumption 3: "SSM bypass permission is an existing, configurable user-level permission." [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:141]
- Out of scope: "Single (non-bulk) STMS payment flow"; changes to the SSM purchase flow; "Seller Categories other than Company". [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:155-166]
- Documents (§2.2.4): "A user with SSM bypass purchase must upload all 3 documents; a user without SSM bypass purchase only needs to upload the Board Resolution / Authorisation Letter." [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:238]
  - Sdn Bhd / Bhd: with bypass = SSM Company Profile, Company Board Resolution, Staff Employment Pass & MyKad; without = Company Board Resolution.
  - Sole Proprietorship or Partnership: with = SSM Business Profile, Authorisation Letter, Staff Employment Pass & MyKad; without = Authorisation Letter.
  - LLP: with = LLP Profile, Authorization Letter, Staff Employment Pass & MyKad; without = Authorization Letter. [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:246-268]
- REQ-001: "On bulk payment submission, the system checks the user's SSM bypass permission before processing STMS transactions with Seller Category = Company." [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:278-283]
- REQ-003 (without bypass), "in sequence": "1. Check whether the Board Resolution / Authorisation Letter ... is uploaded. 2. If uploaded, check whether the SSM documents are still valid. 3. If the SSM documents are still valid, the transaction proceeds; otherwise, the transaction is blocked." [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:298-304]
- REQ-004: "Transactions meeting all SSM requirements are processed within the bulk payment; non-qualifying transactions are not processed." [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:315-320]
- REQ-005 sample popup: "Listed Transactions cannot be submitted:" / "SSM documents are missing or no longer valid — resubmit from the STMS Transaction Listing:" / "Transactions can no longer be submitted:". Acceptance: "Each group lists the affected STMS transaction numbers. Only qualifying transactions are submitted. Actual status is not shown for group (b)." Existing status check blocks "Approved, Cancelled, or Interstate Cancelled". [charmain-repo: docs/source-material/ucd-stms-bulk-payment-srd-v1.2.txt:322-337]

### Build behaviour she recorded (colleague notes)
- D1: the build counts held-back transactions through the run (N / N) and shows the popup **at the end**, not on submit. "Dev accepted this pending SRD v1.3, but Jira holds no v1.3." [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:351]
- D2: the build's SSM-group wording is shorter than the v1.2 sample. D3: the build shows the status group **before** the SSM group (SRD sample is SSM first). [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:352-353]
- D4: dev added a "not paid because of SSM" result value that no SRD describes. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:362]
- Without bypass and **no SSM ever bought**, all three documents uploaded: the build pays (QA ruling 2026-08-18), against SRD §2.1.2's stated aim. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:349]
- Fail SSM check and status check both: pack expects the status group only (QA ruling 2026-08-18). [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:350]
- A held-back transaction stays Pending with Payment "-", stays on the bulk listing, keeps its documents; BO shows the same Pending. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:193-195]
- An expired SSM held back was proved live on staging 2026-08-15. SSM valid **seven days** (day 7 pays, day 8 held back); not in any SRD version. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:157-158,297-299]
- Company-level STMS permission **off** = every user of that company treated as having bypass; on = user setting decides. The "Bypass Purchase SSM" gate only decides whether the company can be enrolled in the bypass module. Not in the SRD. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:284-288]
- eSTM bypass has no effect on STMS bulk payment, and the reverse. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:289-290]
- SSM service down, slow or odd code: an error is shown; no bypass = held back, bypass = paid (answered for the pack 2026-08-17, not in any document). [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:293-296,356]
- Seller documents are held on the seller company: one upload counts for every transaction of that seller. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:317-319]
- Bulk listing: only transactions awaiting payment; select-all; **no more than 50** can be submitted; Export Excel holds every searched row, not only ticked ones; after a run a held-back one stays in the file and a paid one is gone. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:306-309,320-326]
- Bulk JPJ Enquiry keeps its own popup title and wording; nothing of the SSM group shows there. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:310-312]
- BO STMS listing Export CSV and BO SSM listing Export download only after a native confirm "Sure to export?" is accepted; the pack's first capture recorded "nothing" because it never saw the dialog. [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:384-388]

### Test data (her blockers)
- Not measured which dealer account has SSM bypass on or off (`ucdSsm` persona unknown). Ageing or failing an SSM needs the eSim levers and an "expire tool". [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:410-413]

### Conflicts
- Conflict: who holds bypass. This file §Glossary: "Bypass Purchase SSM: A user-level BO setting." `[azfar: eauto-qa-azfar:knowledge/_core/stms.md#BackOffice]` and SRD assumption 3 "user-level permission" vs Charmain (obs): "Given a dealer company with the STMS permission switched off, then each of its users is treated as having bypass, whatever their own setting." [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:284-286]
- Conflict (SRD vs build): popup on submit vs at end of run (D1); SSM group order and wording (D2, D3); no SSM bought but documents uploaded = paid (Q1).

### Open questions she raised
- What does "still valid" mean in REQ-003: not expired only, documents valid, or also not pending / rejected / failed verification? [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:363]
- Is "Staff Employment Pass & MyKad" one document or two? [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:372]
- Seven days: calendar days or 168 hours; does buying again restart it? [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:357]
- A batch interrupted part way: does the rest continue server-side? [charmain-repo: test-scenarios/ucd-stms-bulk-payment/ucd-stms-bulk-payment.md:358]

### Her test titles not covered above (added 2026-10-27)
- From her intake inventory of `by-ticket/eaint-12054-stms-bulk-payment` (4 functional specs, 103 titles). **A colleague's test titles, not verified live by us.** Already covered above and skipped: the 50-row cap ("boundary: the UI must refuse more than ${BULK_MAX}"), Bulk JPJ Enquiry wording and titles. Full list: `cr-ledger.md` § "Update 2026-10-27 from Charmain repo" → EAINT-12054.
- "matrix batch: every seller state x every business type" [charmain-repo: intake/reports/charmain-12054.json:2168]
- "a blocked transaction pays after its SSM documents are purchased" [charmain-repo: intake/reports/charmain-12054.json:2217]
- "block-proof: invalid-SSM txn is blocked and listed in the popup" [charmain-repo: intake/reports/charmain-12054.json:2363]
- "all-blocked batch: progress completes and nothing is paid"; "clean batch: no popup at all and every transaction pays" [charmain-repo: intake/reports/charmain-12054.json:2264-2265]
- "boundary: a full batch of ${BULK_MAX} — popup must size to the list" [charmain-repo: intake/reports/charmain-12054.json:2267]
- "a permission change mid-session takes effect without re-login" [charmain-repo: intake/reports/charmain-12054.json:2317]
- BO setup paths: "force purchase path (company STMS ON, bypass OFF)"; "bypass path (company STMS OFF, gate ON) — restore" [charmain-repo: intake/reports/charmain-12054.json:639-640]. Same model as the Conflict above (company STMS off = bypass).
- Trap: her Playwright projects `A_BYPASS` / `B_NO_BYPASS` / `C_COMPANY_OFF` "do not exist here, so the specs would skip and report green". [charmain-repo: intake/reports/charmain-decisions.md:24]
