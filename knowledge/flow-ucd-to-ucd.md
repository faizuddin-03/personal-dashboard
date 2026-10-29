# UCD to UCD (Standard and Interstate) (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/ucd-to-ucd.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- An STMS from one dealer (UCD A, the seller) to another dealer (UCD B, the buyer). It shares the STMS steps, fee and listing. Standard is done by UCD B in one session. Interstate is done by each dealer on their own account, and UCD B has 48 hours to accept and pay. No SRD defines this module end to end.
- Portals: UCD Portal, Back Office, JPJ (external), RHB (payment)
- Related modules: stms, apt, payments-fees, backoffice, platform

## Glossary
- UCD A / Seller (Penjual): The dealer giving up the vehicle. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Parties]
- UCD B / Buyer (Pembeli): The dealer receiving the vehicle. Becomes the STMS holder and pays. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Parties]
- UTU / IUTU: Internal codes: UTU = UCD to UCD, IUTU = Interstate UCD to UCD. Wholesale uses its own WHOLESALE_UTU* codes. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Parties] [jira: EAINT-12324 2026-10]
- Interstate New: Status of an Interstate transaction waiting for UCD B. The 48-hour clock is running. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate flow] [askeauto: 07-ask-eauto.md Q4 §7 (prod/master 0e21bef3) 2026-10-23]

## Flow: Standard (both dealers together)
- UCD B logs in and runs the whole transaction. UCD A's representative gives the Perakuan and thumbprint at Step 1 in the same session. It is a normal STMS tagged as a dealer-to-dealer sale (companyCategory=UTU).
- Portals: UCD Portal, JPJ (external), RHB (payment)

### Entry points and steps
- Entry point "UCD TO UCD tile, STANDARD button": UCD Home › UCD TO UCD tile (view/ucd/stms/interstate/ucd-view.do) › STANDARD [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Observed on staging (2026-09-25)] [askeauto: 07-ask-eauto.md Q4 §1.1-1.2 (prod/master 0e21bef3) 2026-10-23]
  - The tile opens a page with two tiles: STANDARD and INTERSTATE. STANDARD goes straight to Step 1.
  1. Choose STANDARD | where: UCD Home › UCD TO UCD › STANDARD | Page shows price 'RM30* only' (RM35 since 02.10.2026) and user guides. STANDARD cleans the session and goes into the STMS seller-authentication page with companyCategory=UTU. There is no category choice and no Single/Bulk choice yet. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Observed on staging (2026-09-25)] [askeauto: 07-ask-eauto.md Q4 §1.2 (prod/master 0e21bef3) 2026-10-23]
     - If Company has blockUcdToUcd set in BO -> STANDARD is hidden. Only Interstate is offered.
     - If User lacks 'Selling Vehicle Allowed' -> 'Access denied'. Cannot create Standard or Interstate.
  2. Step 1 - Seller (Owner) | where: UCD › UCD to UCD › Step 1 | Perakuan 'PERAKUAN UCD TO UCD - PENJUAL' names the logged-in UCD's representative who read it to the seller. Tick it, then MyKad and thumbprint of the seller company's representative. No vehicle field here. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard flow] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard, as walked (buyer = logged-in UCD)] [jira: EAINT-9204 2026-01]
     - If The thumbprint person is not a registered user of the seller company typed at Step 2 -> 'Invalid Representative Error: <name> bukan wakil <company>.' (ERR=202, SELLER_NO_USERACCOUNT). Step 3 is not reached. Found on screen, in no SRD.
  3. Step 2 - Vehicle and seller company | where: UCD › UCD to UCD › Step 2 | Type the SELLER company's Company Name and Company Reg No. Fill Contact No, Email, Address. Pick Transaction Type: Single or Bulk. Then Vehicle No, Engine, Chassis, Make/Model, Year. Next (#to-continue-company) and confirm. Usage code AH shows here when JPJ returns it. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard, as walked (buyer = logged-in UCD)] [ts: EAINT-11057 11057_UCD_TS1]
     - If Sub user has 'Transfer Vehicle To Other Dealer Allowed' off -> Blocked at Step 2.
     - If Transaction Type = Bulk -> Page offers 'Download sample for bulk transaction template excel file'.
  4. Step 3 - Buyer (Dealer) | where: UCD › UCD to UCD › Step 3 | Perakuan 'PERAKUAN STMS (UCD to UCD) - PEMBELI'. JPJ receipt email, #buyer-consent, then the logged-in UCD's MyKad and thumbprint. The JPJ receipt goes to UCD B's main-user email and receipt@eauto.my. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard, as walked (buyer = logged-in UCD)] [jira: EAINT-9204 2026-01]
  5. Step 4 - JPJ Check | where: UCD › UCD to UCD › Step 4 | Shows seller rep name, seller company name and reg no, vehicle, the UCD's name and MyKad, and buyer company. Agree text: 'I/We hereby agree to be the interim owner...'. Result fields: Valid As At, Blacklisted, Hak Milik Dituntut, Condition Code, JPJ Enquiry Status, Response Code. Buttons: Save & Continue Later, Make Payment. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard, as walked (buyer = logged-in UCD)]
  6. Step 5 - Payment | where: UCD › UCD to UCD › Step 5 | JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00 (since 02.10.2026). Shows 'CUSTOMER SUPPORT : [hotline number omitted]'. Buttons: Save & Continue Later, STMS Payment. UCD B pays. | affects: RHB payment; Payments & Fees [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Fee and documents] [jira: EAINT-12403 2026-10]
     - If RHB payment fails (IF, insufficient funds) -> Tx Failed. UCD sees View | Resubmit. BO sees View | Cancel | Reset.
  7. Step 6 - Transfer | where: UCD › UCD to UCD › Step 6 | 'JPJ Transfer Status: OK - SUCCESSFUL', submission date and time, Done. Approved. Seen for Single on 25.09.2026. | affects: STMS Transaction Listing (buyer); e-Invoice [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard flow]
  - [unconfirmed] FUTURE: Firefox Browser Reminder popup at Step 5 for UCD to UCD Standard (EAINT-12253, S34.X-20261028). [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#FUTURE — not live yet (20.10.2026)]
- Entry point "Resubmit from STMS Transaction Listing": UCD B › STMS › STMS Transaction Listing › Resubmit [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Entry points] [ts: EAINT-9044]
  - A Standard UCD to UCD transaction shows in the buyer's STMS listing, like a plain STMS.
  1. Open the buyer's listing | where: UCD › STMS › STMS Transaction Listing | Seller Name = the seller company. After a BO Reset: Payment '-', Tx Pending, Remarks cleared, View | Resubmit. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]

### Cross-module effects (what it affects)
- Buyer's STMS Transaction Listing: Seller Name = seller company, JPJ Check OK, Payment OK, JPJ Transfer OK, Approved, e-Invoice '-' then OK. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- BO STMS Transaction: Company Name = buyer, Seller ID = seller company ROC, Method RHB. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- Invoice and e-Invoice line reads 'Sistem Tukar Milik Sementara ("STMS") service charge'. The older 'UCD to UCD (STMS)' label was not seen. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Fee and documents]
  - Conflict: other version: Invoice label 'UCD to UCD (STMS)'. [ts: EAINT-11835 / EAINT-7548 workbooks] (Older workbook wording. Azfar saw the STMS wording on preprod1, 28-29.09.2026.)
- [unconfirmed] Slip Pengesahan and e-Invoice. No Transfer History for UCD to UCD. The 7584 list predates 9204 and needs a re-check on screen. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Fee and documents]
- After 6 months the vehicle moves to APT for UCD B. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS]
- [unconfirmed] No STMS_APPROVED event is sent for UCD to UCD (UTU / IUTU). [jira: EAINT-12324 2026-10] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS]
- Company document upload (4942) and SSM purchase (5155) do not apply to UCD to UCD. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [jira: EAINT-4942]

### Roles
- UCD Dealer Portal only. Not Service Portal, not public, not AATF. [askeauto: 07-ask-eauto.md Q4 §4.1 (prod/master 0e21bef3) 2026-10-23]
- User type needs 'Selling Vehicle Allowed' (UserTypePermission.sellingVehicleAllowed). [askeauto: 07-ask-eauto.md Q4 §4.2 (prod/master 0e21bef3) 2026-10-23]
  - Conflict: other version: Sub user flag 'Transfer Vehicle To Other Dealer Allowed' off blocks the seller sub user at Step 2. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [jira: EAINT-11756 2026-06] (Screen label per Azfar. Prod code names the flag sellingVehicleAllowed. Likely the same switch, not confirmed.)
- BO company flag 'Block STMS Category > Limited Features for UCD to UCD' restricts the company. Wholesale's UCD to UCD ignores both blocking flags (EAINT-11756, Done 18.06.2026). [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [jira: EAINT-11756 2026-06]
- BO has no UCD to UCD-only screen. BO staff use the STMS transaction screens, Support Tools, Bulk STMS Cancellation and JPJ resubmission. [askeauto: 07-ask-eauto.md Q4 §4.5 (prod/master 0e21bef3) 2026-10-23]

### Where the transaction goes
- Approved in UCD B's STMS Transaction Listing and in BO STMS Transaction. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- An e-Invoice request is queued through RabbitMQ (EInvoiceRabbitMQProducer, source STMS) to eauto-einvoice. Payment goes through RHB Direct Debit. [askeauto: 07-ask-eauto.md Q4 §5.3-5.4 (prod/master 0e21bef3) 2026-10-23]

### Rules
- UCD B (the buyer) pays. The fee is the STMS fee for Standard and Interstate: JPJ 10.00 + eAuto 25.00 + SST 2.00 = RM37.00. Home tile 'RM35', module page 'RM35 only' (hard-coded). [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Fee and documents] [jira: EAINT-12403 2026-10]
- STMS (UCD to UCD) ends 6 months from the first STMS date, then transfers permanently to UCD B. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [jira: EAINT-9204 2026-01]
- Usage code AH shows on Step 2, Step 4 and Transaction Details when JPJ returns it. Hidden otherwise. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [ts: EAINT-11057 11057_UCD_TS1, TS7, TS8]
- BackOffice screens show stored amounts only. The BO STMS View page shows no amount. The charged amount is in BO > RHB Payment Transaction. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Fee and documents]

### QA scope to check
- Run Standard Single end to end with the seller's representative on a different company. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard, as walked (buyer = logged-in UCD)] [ts: EAINT-12403 12403_UTU_E2E1]
- Check the Invalid Representative error when the thumbprint person is not a user of the seller company. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard, as walked (buyer = logged-in UCD)]
- Check Block STMS Category 'Limited Features for UCD to UCD' and the sub user switch. Check Wholesale UCD to UCD ignores both. [jira: EAINT-11756 2026-06]
- Check fee, tile and module-page price; check invoice and e-Invoice line wording. [azfar: eauto-qa-azfar:knowledge/_core/fees-and-pricing.md#Every surface a price reaches] [ts: EAINT-12403 12403_UTU_E2E1]
- Check AH on Step 2, Step 4, Step 6 and Details, first vs second JPJ enquiry, success vs fail, single vs bulk. [ts: EAINT-11057 11057_UCD_TS1-TS8]
- Check failed payment: RHB IF, BO Reset, then Resubmit. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status] [ts: EAINT-12403 12403_STMS_PAY1]
- Check the UCD to UCD user guides (Standard and Interstate) on the landing page. [ts: EAINT-11835 UCD_11835_TS01]

### Ticket history
- EAINT-12403 (2026-10): Fee RM20 to RM25. Tile RM30 to RM35. Live S34.2-20261001. [latest]
- EAINT-10175 (2026-03): Fee RM15 to RM20. Tile RM30. [legacy, superseded by EAINT-12403]
- EAINT-12324 (2026-10): No STMS_APPROVED event for UTU / IUTU. Live S34.1-20261001. [latest]
- EAINT-11756 (2026-06): Wholesale UCD to UCD ignores the two blocking flags. [latest]
- EAINT-11057 (2026-06): Usage code AH on Step 2, 4 and Details. [latest]
- EAINT-9204 (2026-01): Perakuan for Standard and Interstate seller and buyer. [latest]
- EAINT-12253 (2026-10): FUTURE: Firefox Browser Reminder at Step 5. [latest]
- EAINT-7109: UCD to UCD on the mobile app. Draft. [latest]
- EAINT-171: UI stories (171-176, 225, 226). No SRD.

### Open questions
- Where does Standard end for Bulk? The 11057 workbook said 'Payment request sent' at Step 4 with no Step 6. Single goes to Step 5 and 6 (walked 25.09.2026). Bulk not walked.
- Do SSM rules, Bypass or EAINT-10119 ever apply to UCD to UCD? 4942 says no for documents and SSM. The others are silent.
- Is CUTU ('Company/UCD to UCD', EAINT-12324) treated as UCD to UCD?
- The hotline on UCD to UCD screens is [hotline number omitted]. The STMS landing shows [hotline number omitted]. Possible stale text.

## Flow: Interstate (seller creates, buyer accepts within 48 hours)
- Used when buyer and seller are in different places. UCD A creates and submits. UCD B accepts later on its own account and pays. If UCD B does nothing in 48 hours the transaction expires.
- Portals: UCD Portal (UCD A and UCD B), JPJ (external), RHB (payment)

### Entry points and steps
- Entry point "UCD A creates an Interstate transaction": UCD Home › UCD TO UCD › INTERSTATE › CREATE NEW INTERSTATE TRANSACTION [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate flow] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, seller side as walked (seller = logged-in UCD, UCD A)] [askeauto: 07-ask-eauto.md Q4 §1.3, §2 (prod/master 0e21bef3) 2026-10-23]
  - Pages: interstate-home.do, interstate/view.do (create), interstate/enquiry.do (seller listing). Wizard uses companyCategory=IUTU.
  1. Find the buyer dealer | where: UCD › UCD to UCD › Interstate › Create New Interstate Transaction | 'Please key in buyer (Dealer) company reg no (ROC)'. Search shows the Company Name. Continue and confirm. The INTERSTATE button only works for users with 'Selling Vehicle Allowed'. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, seller side as walked (seller = logged-in UCD, UCD A)] [askeauto: 07-ask-eauto.md Q4 §1.3, §2.1 (prod/master 0e21bef3) 2026-10-23]
     - If Buyer ROC = the seller's own company -> Blocked.
  2. Step 1 - Seller | where: UCD › Interstate › Step 1 | Perakuan 'PERAKUAN UCD TO UCD (INTERSTATE) - PENJUAL (<UCD A name>)' naming the representative and IC. Tick, then UCD A's own MyKad and thumbprint. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate flow] [jira: EAINT-9204 2026-01]
  3. Step 2 - Vehicle and JPJ Enquiry | where: UCD › Interstate › Step 2 | Seller company is pre-filled. Choose Single or Bulk. Key in Vehicle No and click GET. Tick the agree text 'I/We hereby agree to transfer (sell) the vehicle ownership to the new buyer <UCD B>...'. Next. The JPJ enquiry runs here. A review page shows the result and the note 'Only JPJ Check = OK Transaction(s) will be created for buyer thumbprint. Please re-do for Failed transaction(s)'. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, seller side as walked (seller = logged-in UCD, UCD A)] [askeauto: 07-ask-eauto.md Q4 §2.3 (prod/master 0e21bef3) 2026-10-23]
     - If The vehicle is not already held by UCD A -> 'Vehicle record not found'.
     - If JPJ enquiry passes -> Status InterStateNew. interstateExpiryDate = creation time + 2 days.
     - If JPJ enquiry fails -> Status InterStateDraft (prod code). Re-do the transaction.
  4. Result - Interstate Transaction Listing | where: UCD › UCD to UCD › Interstate › Transaction Listing (interstate/enquiry.do) | UCD A lands on its Interstate listing. Tx Status 'Interstate New', Remarks 'PENDING BUYER THUMBPRINT', actions View and Cancel. The transaction is not in UCD A's STMS listing. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
     - If UCD A clicks Cancel while Interstate New or Draft -> Status InterStateCancelled (cancel-interstate.do).
- Entry point "UCD B accepts the Interstate transaction": UCD B › STMS › STMS TRANSACTION LISTING › To Accept [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)] [askeauto: 07-ask-eauto.md Q4 §2.4 (prod/master 0e21bef3) 2026-10-23]
  - UCD B sees the row in its own STMS listing, not in the Interstate listing.
  1. Open the row and click To Accept | where: UCD B › STMS › STMS Transaction Listing | Row shows Seller Name = UCD A, JPJ Check OK, Tx 'Interstate New', Remarks 'TO THUMB IN BY <created + 48 h>', actions View and To Accept. To Accept goes straight to Step 3, no dialog. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)]
  2. Step 3 - Buyer | where: UCD B › Interstate › Step 3 | Perakuan 'PERAKUAN STMS (UCD TO UCD - INTERSTATE) - PEMBELI (<UCD B>)' naming UCD B's representative and IC from the logged-in user's record, the seller company and the seller rep. JPJ receipt email, tick, then the logged-in user's own MyKad and thumbprint. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)] [jira: EAINT-9204 2026-01]
  3. Step 4 - JPJ Enquiry again | where: UCD B › Interstate › Step 4 | The enquiry runs again. Message: 'Please make the payment before <created + 48 h> to effect the transfer, otherwise system will automatically cancel this transaction after this date.' Buttons: Save & Continue Later, Make Payment. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)]
     - If Buyer completes payment -> Status Pending, then Approved or Failed.
  4. Step 5 - Payment | where: UCD B › Interstate › Step 5 | Same Payment Summary as Standard (RM37.00 since 02.10.2026). The 48-hour warning repeats. UCD B pays. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)] [jira: EAINT-12403 2026-10]
  5. Step 6 - Transfer | where: UCD B › Interstate › Step 6 | 'JPJ Transfer Status: OK - SUCCESSFUL'. UCD A's Interstate listing shows Buyer Auth = time of acceptance, Approved, View only. | affects: UCD A Interstate listing; BO STMS Transaction [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)]
- Entry point "BO resumes an Interstate Cancelled transaction": BO › Support Tools › STMS Transaction [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses] [ts: EAINT-8766]
  1. Update and Resume | where: BO › Support Tools › STMS Transaction | BO can [Update] and [Resume] an Interstate Cancelled transaction back to Pending (workbook 8766). [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses]

### Cross-module effects (what it affects)
- Seller's Interstate listing: Buyer Company/ROC, Seller Auth time, Buyer Auth '-', Interstate New, PENDING BUYER THUMBPRINT. After acceptance: Buyer Auth time, Approved, View only. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- The seller's STMS listing never shows the Interstate transaction. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- BO STMS Transaction: Company Name = buyer (UCD B), Seller ID = seller ROC, JPJ Enquiry OK, Payment '-', Interstate New. Approved: Method RHB, OK / OK / OK. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- BO company field 'UCD Company: Allowed To Accept Interstate Transaction From:' limits who can send to a buyer. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS] [ts: EAINT-6762]
- Usage code AH shows at Step 2, where the Interstate JPJ enquiry runs. [ts: EAINT-11057 11057_UCD_TS8]

### Cronjobs
- InterstateExpiredJob (trigger InterstateExpiredTrigger) | Daily. Cron 0 30 2 * * ? (2:30 AM) in the dev-reference scheduler config. Prod file is withheld. | Sweeps transactions whose interstateExpiryDate has passed and are not Approved, Cancelled, InterStateCancelled or mid-payment. Sets them to InterStateExpired. [askeauto: 07-ask-eauto.md Q4 §3.1-3.2 (prod/master 0e21bef3) 2026-10-23] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses]
- On-view expiry check (check-interstate-expiry.do) | Each time a user opens the transaction page | Runs the same expiry logic live, so a transaction can expire without waiting for the nightly job. [askeauto: 07-ask-eauto.md Q4 §3.3 (prod/master 0e21bef3) 2026-10-23]

### Roles
- UCD A needs 'Selling Vehicle Allowed' to start Interstate. UCD B needs normal STMS rights. [askeauto: 07-ask-eauto.md Q4 §4.2 (prod/master 0e21bef3) 2026-10-23]
- If the company has no active RHB account, the company groupType must start with 'A' (isGroupTypeAllowedForInterstateTxn) to proceed. [askeauto: 07-ask-eauto.md Q4 §4.4 (prod/master 0e21bef3) 2026-10-23]
- Each dealer works on its own account. UCD A creates and submits. UCD B accepts. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Two kinds] [jira: EAINT-9204 2026-01]

### Where the transaction goes
- Approved in UCD B's STMS Transaction Listing. UCD A's Interstate listing shows Approved with View only. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- If UCD B does not accept in 48 hours, the status becomes InterStateExpired. [askeauto: 07-ask-eauto.md Q4 §3, §7 (prod/master 0e21bef3) 2026-10-23]
  - Conflict: other version: Azfar's repo does not know whether the 48-hour auto-cancel gives InterStateExpired or InterStateCancelled. Transaction S694494084 was left to find out (deadline 27-09-2026 16:36). [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Gaps — nobody has written these down] (Prod code says InterStateExpired (via the expiry job). Not yet seen on screen.)

### Rules
- UCD B must accept and pay within 48 hours of UCD A creating the transaction. Example: created 16:46, deadline 27-09-2026 16:46. After that the system cancels it. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Two kinds] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)]
- Statuses: InterStateDraft (8, JPJ enquiry failed), InterStateNew (9, JPJ passed, clock running), InterStateExpired (10), InterStateCancelled (11). Then Pending, Approved or Failed once UCD B acts. [askeauto: 07-ask-eauto.md Q4 §7 (prod/master 0e21bef3) 2026-10-23]
  - Conflict: other version: Interstate Cancelled, Interstate Expired, Interstate Failed (tickets 2944, 4026, 12054, 7919, 3224). No SRD defines them. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses] (Azfar lists 'Interstate Failed'. The prod enum has InterStateDraft and no Interstate Failed.)
- Bulk Payment blocks Approved, Cancelled and Interstate Cancelled. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses] [jira: EAINT-12054 2026-08]
- A seller's Cancel could overwrite a buyer-accepted state. Production defect, patched 26.06.2026. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses] [jira: EAINT-11850 2026-06]
- The vehicle must already be held by UCD A. Otherwise 'Vehicle record not found'. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, seller side as walked (seller = logged-in UCD, UCD A)]

### QA scope to check
- Run the full Interstate path with two accounts: UCD A create, UCD B To Accept, pay, Step 6. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate flow] [ts: EAINT-12403 12403_UTU_E2E2]
- Check the Interstate listing, STMS listing and BO listing for every status. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Where the transactions show, by status]
- Check the 48-hour remark and warning wording on the listing, Step 4 and Step 5. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate, buyer side as walked (buyer = logged-in UCD B, S694494087)]
- Check expiry: leave a transaction past the deadline and see its status (job or on-view check). [askeauto: 07-ask-eauto.md Q4 §3 (prod/master 0e21bef3) 2026-10-23]
- Check seller Cancel while Interstate New, and Cancel after the buyer accepted (EAINT-11850). [jira: EAINT-11850 2026-06]
- Check BO Update and Resume of an Interstate Cancelled transaction. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Statuses]
- Check AH at Step 2 for Interstate, single and bulk. [ts: EAINT-11057 11057_UCD_TS8]
- Check 'Allowed To Accept Interstate Transaction From' in BO. [ts: EAINT-6762]

### Ticket history
- EAINT-9204 (2026-01): Interstate Perakuan and 48-hour buyer wording. [latest]
- EAINT-7109: Mobile app SRD v0.1. Defines 'Buyer & Seller in different location'. [latest]
- EAINT-11850 (2026-06): Seller Cancel vs buyer accept defect patched. [latest]
- EAINT-12403 (2026-10): Fee RM25. [latest]
- EAINT-12324 (2026-10): No STMS_APPROVED event for IUTU. [latest]
- EAINT-525: Interstate expiry cronjob (ticket numbers 525, 1196 named by Azfar).
- EAINT-1196: Interstate expiry cronjob.

### Open questions
- Exact lifecycle: when is Expired set vs Cancelled, and what does the job do at 48 hours? No SRD defines it. Prod code says InterStateExpired. Confirm on screen.
- Whether UCD A's submit counts for the Firefox Browser Reminder (EAINT-12253).
- Production cron time for InterstateExpiredJob. Only the dev-reference value (2:30 AM) is known.

## Flow: Bulk (Standard and Interstate)
- Step 2 lets the user pick Single or Bulk. Bulk uses a downloadable Excel template. Not walked by Azfar.
- Portals: UCD Portal

### Entry points and steps
- Entry point "Transaction Type = Bulk at Step 2": UCD › UCD to UCD › Step 2 › Transaction Type: Bulk [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard, as walked (buyer = logged-in UCD)] [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Gaps — nobody has written these down]
  1. Choose Bulk and download the sample | where: UCD › UCD to UCD › Step 2 | The page offers 'Download sample for bulk transaction template excel file'. What happens next was not walked. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Rules that differ from STMS]

### Cross-module effects (what it affects)
- The same Perakuan applies to single and bulk. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Interstate flow] [jira: EAINT-9204]

### Rules
- Usage code AH test covers 4 vehicles in one bulk: Failed-4F + AH, Failed-not-4F + AB, Success-AH, Success-AB. [ts: EAINT-11057 11057_UCD_TS7]

### QA scope to check
- Check bulk AH display on Step 4 and Step 6 for each vehicle outcome. [ts: EAINT-11057 11057_UCD_TS7]
- Check where Standard bulk ends: Step 4 'Payment request sent' or Step 5 and 6. [azfar: eauto-qa-azfar:knowledge/_core/ucd-to-ucd.md#Standard flow]

### Ticket history
- EAINT-11057 (2026-06): AH usage code, bulk case. [latest]

### Open questions
- Bulk (Standard and Interstate) has not been walked. Steps, end state and statuses are unknown.
