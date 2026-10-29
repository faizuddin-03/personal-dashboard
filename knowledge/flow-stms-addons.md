# STMS Step 5 add-ons: LKM Refund and Insurance Cancellation (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/stms-addons.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- Two optional add-ons on STMS Step 5. LKM Refund asks JPJ to refund the seller's unused road tax. Insurance Cancellation asks the seller's insurer (through Runnerku) to cancel the policy and refund the balance. Both use pop-ups, document preview and an e-signature. Each has its own fee, status page and listings. Shallow area for Faizuddin: Azfar's repo is the main source.
- Portals: UCD Portal, Back Office, JPJ (external), RHB (payment), Runnerku (insurer API), LHDN MyInvois, AI document check
- Related modules: stms, ucd-to-ucd, payments-fees, backoffice, ucd-portal

## Glossary
- LKM Refund: Refund of the seller's unused road tax (Lesen Kenderaan Motor) through JPJ. Not the same as eLKM, the road tax renewal add-on in eSerahan (RM60 for 12 months). [azfar: eauto-qa-azfar:cr/EAINT-12022/01-research/study.md] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
- PTJ Branch: The JPJ branch that handles the refund. It is derived from the UCD's State and City in Manage Company Account. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- RTR: Prefix of the LKM Refund transaction number: RTR + year digit + month code (Oct = 0, Nov = N, Dec = D) + 7-digit running number. Example RTR620000001. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- JPJK6: JPJ road-tax refund application form. One of the 3 documents previewed and signed at Step 5. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Refund Indicator: Y or N sent in the JPJ final submission. Y only when the add-on was ticked, saved, signed and paid. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [jira: EAINT-12567 2026-10]
- Insurance Cancellation (IC): Cancels the seller's insurance policy through Runnerku. Individual sellers (MyKad and MyPR) only. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- Runnerku: The external insurance-cancellation processor. On staging it is simulated by eSim. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#eSim Runnerku facts]
- AC / WC / CU / RB: JPJ LKM refund status codes. AC = In Progress (New Application), WC = In Progress (Confirmation), CU = Refund Done, RB = Rejected. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

## Flow: LKM Refund: eligibility and request (Step 5)
- At Step 5 the dealer ticks LKM Refund when JPJ says the vehicle has a refund balance of RM5 or more. The dealer fills a pop-up, signs, and pays the refund processing fee together with the STMS fee.
- Portals: UCD Portal, JPJ (external), RHB (payment)

### Entry points and steps
- Entry point "Tick the LKM Refund checkbox at Step 5": UCD › STMS › Step 5 (Payment) › LKM Refund add-on checkbox (#lkm-refund-addon-checkbox) [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons] [jira: EAINT-12567 2026-10]
  - The checkbox shows only when the JPJ enquiry returns a refund balance of RM5 or more (eSim stms-enquiry-resp 'LKM Refund Amount').
  1. Perakuan at Step 1 | where: UCD › STMS › Step 1 | Perakuan 'PERAKUAN STMS / TH / LKM REFUND - PENJUAL'. The text says a refund is possible if the balance is above RM5.00 and details are emailed to lkmrefund@eauto.my. On preprod1 an extra LKM refund email field (#sellerEmail) shows. | affects: STMS Step 1 and Step 3 Perakuan [azfar: eauto-qa-azfar:cr/EAINT-12022/01-research/study.md] [azfar: eauto-qa-azfar:01b-azfar-extra.md]
     - Since EAINT-10108 (S34.16-20261027) the LKM email line reads "alamat emel pemohon" at Step 1 and Step 3, Individual and Company: the email must be the customer's, not the UCD's. [from ticket EAINT-10108, Jira description row 5] See knowledge/flow-stms.md Ticket history.
  2. Add-on card shows the refund balance | where: UCD › STMS › Step 5 | The card sits in an 'Add-on Services' section. A 3-to-6 month processing notice (Malay, then English) shows below the form fields and above the consent tick box, for Individu and Syarikat (EAINT-12411). [jira: EAINT-12567 2026-10] [jira: EAINT-12411 2026-09]
     - If Balance is below RM5 -> The UCD cannot request. The checkbox is not shown.
     - If Company has no LKM Refund permission -> No request. At payment time: popup 'Your account don't have LKM Refund permission' [OK].
  3. Fill the LKM Refund Details pop-up | where: UCD › STMS › Step 5 › pop-up | Step 1 Refund Details: State, PTJ (JPJ Branch), Seller's Name, Bank Name, Bank Account No. Step 2 Verification Documents: Copy of IC and Bank Statement (Individual, MyPR) or Bank Statement only (Company), PDF/PNG/JPG/JPEG up to 5MB, plus a declaration. [Next] runs the AI document check. Real AI has been on since 07.10.2026 and the seller name must equal the full IC name. [jira: EAINT-12567 2026-10] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
     - If State is Wilayah Persekutuan Labuan -> Shown as Sabah.
     - If State is Putrajaya -> Shown as Kuala Lumpur.
     - If File is tiny (about 1 KB) -> HTTP 500 EG0001 'Upload failed.'
  4. Document Preview and e-signature | where: UCD › STMS › Step 5 › LKM Refund Document Preview | See the document flow below. Close without signing unticks the checkbox. After [Proceed], the signature is locked and [Reconfirm LKM Refund Details] shows after Close. | affects: LKM Refund Document, e-Signature and Reset flow [azfar: eauto-qa-azfar:01b-azfar-extra.md]
  5. Pay: one payment for STMS and LKM Refund | where: UCD › STMS › Step 5 › [STMS Payment] › [Yes] | Payment Summary adds the row 'eAuto Processing Fee - LKM Refund'. One example total: RM10 + RM25 + RM50 LKM + RM6 tax = RM91.00. The LKM fee is a non-split RHB UcdToEauto payment with Reference 2 'RTR'. JPJ final submission sends Refund Indicator = Y with the PTJ Branch. | affects: RHB Payment Transaction (BO); JPJ XML Log; Reconciliation listing [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [azfar: eauto-qa-azfar:01b-azfar-extra.md] [jira: EAINT-12407 2026-09]
     - If At payment: refund amount below RM5, state permission unticked, global permission disabled, amount band unticked, or UCD mailing state changed -> Popup 'Your account don't have LKM Refund permission'. Stays on Step 5. Summary refreshed without the LKM fee. Indicator = N. No LKM Refund section in details.
     - If Amount changes within permitted bands (e.g. 30.01 becomes 30.00, 50.01 becomes 50.00) -> The new amount is used. Indicator = Y.
  6. Step 6 shows LKM Refund Details | where: UCD › STMS › Step 6 | Shows LKM Refund amount and PTJ when approved. A red error card shows if the LKM Refund JPJ submission or payment failed. The UCD LKM Refund Status listing shows the new RTR row at once (In Progress). [jira: EAINT-12567 2026-10] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons]
  - Permission matrix, can the user request at Step 5? Individual with LKM permission = yes; without = no. Company: LKM + SSM permission and SSM bought at Step 4 = yes; LKM + SSM permission, SSM already bought within 7 days = yes; LKM + SSM permission with no SSM in 7 days = no; LKM permission without SSM permission = no; no LKM permission = no. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [miro: EAINT-12022 board T12]
- Entry point "Resubmit from the STMS listing after Save & Continue Later": UCD › STMS › STMS Transaction Listing › Resubmit [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T30, T52 TS9-TS15]
  1. Resubmit after a change in amount or permission | where: UCD › STMS › STMS Transaction Listing › Resubmit | JPJ Enquiry OK goes to Step 5 (the checkbox shows if still allowed) or Step 4. Failed enquiry: Tx Failed, remark 'JPJ Enquiry Failed : {error_description}', a new JPJ Enquiry record, and JPJ XML Log shows the new enquiry with [~RefundAmt]. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
     - If Amount or permission changed after the first pass -> Checkbox is hidden at Step 5. Indicator = N, or Y with the new amount if still permitted.
- Entry point "Reconfirm LKM Refund Details link": UCD › STMS › Step 5 › [Reconfirm LKM Refund Details] (#to-lkm-refund) [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons] [azfar: eauto-qa-azfar:01b-azfar-extra.md]
  1. Reopen the pop-up | where: UCD › STMS › Step 5 | Shown after Close once the signature was saved. Reopens the LKM Refund Details. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Entry point "Owner email and WhatsApp (in development, not live)": UCD › STMS › Step 1 and Step 4 (new) [jira: EAINT-12431 2026-10] [jira: EAINT-12329 2026-09]
  - New notifications to the car owner about the refund. Status: In Development or To Do as of 23.10.2026.
  1. Step 1: owner awareness | where: UCD › STMS › Step 1 | UCD enters vehicle no. and owner email. The owner gets an email, then WhatsApp, when a refund is available. Email in EN/BM/CN, WhatsApp in EN/BM. EAINT-12431, Part 1, In Development. [jira: EAINT-12431 2026-10]
     - If the Step 2 contact number is a landline starting with 03 -> known bug EAINT-12652 (found on Production): "the LKM Refund notification email is not sent to the owner, even though the owner's email address is valid." Cause: "A landline cannot receive WhatsApp, and that failure also stops the email from going out." Expected: "The email is sent as long as the email address is valid, whatever contact number was entered. A landline does not get a WhatsApp message, and that does not stop the email. There is no visible change for the UCD on the Step 2 screen." "A mobile number starting with 01 works either way." Jira also states: "QA testing is not required for this ticket (agreed with SA)." [from ticket EAINT-12652, Jira description] Same rule as the EAINT-10082 commission notice ("Office number: no WhatsApp, email still sent", business-rules-from-test-scenarios.md §6.5).
     - The WhatsApp goes to the number keyed in at Step 2: "It will send to the phone number that you keyed in at Step 2 ya" [from Teams EAINT-12431, 2026-10-23 14:25, dev]. The Step 2 contact field accepts a 03 landline. [unconfirmed — implied by EAINT-12652 steps to reproduce, not seen on screen]
     - If the STMS is Company category -> no LKM Refund email and no WhatsApp. EAINT-12600 (QA-Issue, Done) expected, verbatim: "The system should **NOT** send LKM Refund WhatsApp or email messages to the user, as LKM Refund is not offered for Company category transactions." Retest "Tested and verified on staging/uat4 : PASS" (2026-10-26 08:21). [from ticket EAINT-12600, Jira description + comment, read 2026-10-26]
     - Conflict: when it fires. Jira title "when UCD proceeding to Step 3"; Jira request "at Step 1" / "Trigger: Step 1 – UCD enters the owner's email"; the developer "when user finish Step 2 and moves to Step 3" [from Teams EAINT-12431, 2026-10-16 15:06, Lim Xiwei]; EAINT-12600 module "Trigger Step 3 to 4" with steps "Proceed to Step 3 and click [Next] … reaches Step 4". SRD v1.0 (23.10.2026) not read. [source: Studying EAINT-12431 study §10 #1, 2026-10-27]
     - Staging: the LKM Refund WhatsApp is wired to eSIM, not a real phone. [from Teams EAINT-12431, 2026-10-23 18:14, Jin Siang Boo] "I had connected the MessageBird to esim ya on the LKM Refund whatsapp message"
     - Staging trap: Step 2 can refuse a contact number that is on a blocklist; a developer must patch it out. [from Teams EAINT-12431, 2026-10-23 14:39, Charmain Ea Chiang] "i encountered this error at step 2 any dev available to help patch and remove this phone number from the blocklist?" The error text was only in an image. [unconfirmed — wording of the error not captured]
  2. Step 4: refund amount and instructions | where: UCD › STMS › Step 4 | Owner gets email and WhatsApp with the refund amount and how to submit. The UCD gets an email-only reminder to collect and upload the owner's IC and bank statement, within 7 days after STMS approval. EAINT-12329, Part 2, To Do. [jira: EAINT-12329 2026-09]
- Entry point "Move the add-ons from Step 5 to Step 4 (requested, not built)": UCD › STMS › Step 4 [jira: EAINT-11179 2026-05]
  - A client leaves after Step 4 and cannot sign at Step 5. EAINT-11179 asks to move LKM Refund and Insurance Cancellation to Step 4. Status To Do.
  1. Not built | No behaviour yet. [jira: EAINT-11179 2026-05]

### Cross-module effects (what it affects)
- STMS Transaction Listing and Details (UCD + BO): UCD +3 columns, BO +4, BO CSV +7 (41 columns). LKM Refund Transaction No, LKM Refund section (requested date, status, amount, PTJ, bank, documents), Payment Details (LKM Refund). [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- New UCD and BO 'LKM Refund Status' listing. Columns: #, Vehicle, STMS Transaction No, LKM Refund Transaction No, Seller Name, Created At, Application Status, Last Update, Remarks, Refund Remarks, Action. A 'LKM Refund Amount' column is added after Application Status (EAINT-12430). [azfar: eauto-qa-azfar:01b-azfar-extra.md] [jira: EAINT-12430 2026-10]
- BO LKM Refund Attachment Listing (per PTJ Branch), with print. [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- JPJ XML Log, e-Invoice and Invoice (Page 3 LKM Refund), eAuto Plus RHB Payment Transaction and SST Payment Report (LKM included per 104 V1.4). [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
- Reconciliation: LKM Refund type, Kod Hasil '-', not on the Summary tab. In eAuto but not in the bank statement: 'Rekod Transaksi Tiada Di Penyata Bank', Refund Required = No. In bank but not in eAuto: 'Rekod Transaksi Tiada Di Sistem eAuto', Refund Required = Yes. Hidden from JPJ users. [jira: EAINT-12407 2026-09]
- [unconfirmed] Payment Breakdown Report and UCD Payment Report. [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
- Android app parity (EAINT-12567): the app paid without the LKM indicator and cancelled refunds were prepared on web (CCB-485). [jira: EAINT-12567 2026-10]
- Homepage popup and 'What's New' (see the popups flow). [jira: EAINT-12525 2026-10]

### Cronjobs
- [unconfirmed] Manual Payment Processing (existing cronjob) | Unknown | Handles a paid STMS with JPJ pending, and sets the LKM Refund indicator to Y. [jira: EAINT-9971] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
- eauto-cron snapshot for reconciliation | 02:00 snapshot. Compare runs at 10:00 and 12:00. | Stages paid LKM Refund fees (lkmrefundtransaction + plusrhbpayment, UcdToEauto only). The compare includes LKM_REFUND. [jira: EAINT-12407 2026-09]

### Roles
- The account needs LKM Refund permission. Without it: 'Your account don't have LKM Refund permission.' [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons] [jira: EAINT-12567 2026-10]
- Phase 1 (CR group, 24.09.2026): Individual only, PTJ Branch Kuala Lumpur and Selangor only. Company category withdrawn for Phase 1 (EAINT-12417, Done 29.09.2026). [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [jira: EAINT-12417 2026-09]
  - Conflict: other version: Company sellers are covered by the permission matrix (company with LKM + SSM permission can request). [azfar: eauto-qa-azfar:01b-azfar-extra.md] (Board T12 predates the Phase 1 gate. The title says Company, Phase 1 says Individual only.)
- Company also needs Purchase SSM permission for the SSM paths. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- What's New LKM section is shown to all UCD users. [jira: EAINT-12525 2026-10]

### Where the transaction goes
- STMS Tx Status Approved with an LKM Refund section: status 'New Application', amount, PTJ, bank, documents. Transaction goes to the LKM Refund Status listing (UCD + BO). [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons]
- The LKM Refund fee is paid by a non-split RHB UcdToEauto transfer, Reference 2 = RTR, TransType = RoadTaxRefund. EFT No format RR + yy + mm + dd + 6-digit running - vehicle no, e.g. RR260205000001 - ABC1234. [jira: EAINT-12407 2026-09] [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Sent to JPJ: JPJ forms (UCD checklist, JPJK6, Surat Rasmi, Lampiran F3). A vehicle number goes through once only. [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]

### Rules
- Fee bands by refund amount: below RM5 not offered; 5.00-30.00 RM0; 30.01-50 RM5; 50.01-100 RM10; 100.01-500 RM35; above 500 RM50. [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [azfar: eauto-qa-azfar:01b-azfar-extra.md]
  - Conflict: other version: Board table T11 shows an eAuto Processing Fee of 0 in every band. Other TS (T52 TS6-8) show fees 5.00, 10.00 and 35.00 for the 30.01+ bands. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [miro: uXjVJv2Y3G0= (LKM Refund board, EAINT-12022)] (Unresolved in the source. The ledger bands match the T52 rows.)
- [unconfirmed] Service tax 8% is included in the STMS payment breakdown. The calculation on the board: (eAuto STMS Fee x 8%) + eAuto Processing Fee - LKM Refund x 8%. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- The refund takes 3 to 6 months. JPJ asked for the notice. Wording dated 25.09.2026, live 1 Oct. [jira: EAINT-12411 2026-09]
- e-Signature replaces the thumbprint (EAINT-10093, S34.2-20261001). [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [jira: EAINT-10093 2026-03]
- EAINT-12393 restores two letters ('Surat Rasmi Pihak eAuto' and 'Surat Rasmi UCD ke eAuto', Individu and Syarikat variants) removed on 16.03.2026 after JPJ asked to combine them. The combined documents are kept too. The newer ticket wins. [jira: EAINT-12393 2026-09]
- Make Payment and Retry always send the LKM Refund indicator. It is true only when ticked, saved and signed. [jira: EAINT-12567 2026-10]
- UCD to UCD Standard STMS with the indicator ticked is blocked on BO resubmit. Interstate STMS and unticking the box let the resubmit succeed with LKM fields '-'. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### QA scope to check
- Run the permission matrix: Individual and Company, with and without LKM permission, SSM permission and SSM bought within 7 days. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T12]
- Run amount bands and the fee for each band, and a refund below RM5. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T52 LKM_MLR_TS1-TS8]
- Run payment-time re-checks: untick state, disable global permission, untick band, change UCD mailing state. Expect the permission popup and Indicator = N. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Run resubmit from the listing after an amount or permission change. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T52 TS9-TS15]
- Check PTJ Branch derived from State and City, and the Labuan and Putrajaya display mapping. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Check the Perakuan on Step 1 and Step 3 for Individual and Company. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Check Step 5 pop-up in Firefox (Document Preview was blank in Firefox, EAINT-12388, fixed 24.09.2026) and Chrome. [jira: EAINT-12388 2026-09] [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Step 5]
- Check listings: STMS listing and details columns (UCD and BO), CSV export, LKM Refund Status listing, e-Invoice page 3, payment reports. [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Check the Android app against web (indicator, cancelled refunds). [jira: EAINT-12567 2026-10]

### Ticket history
- EAINT-104 (2026-10): LKM Refund add-on. Live S34.2-20261001. Base SRD V1.4 2026-02-24. [latest]
- EAINT-10093 (2026-03): e-Signature replaces thumbprint. JPJ UAT feedback. [latest]
- EAINT-12417 (2026-09): Phase 1 gates (Individual only, KL + Selangor). [latest]
- EAINT-12411 (2026-09): 3-to-6 month processing notice in the Step 5 pop-up. [latest]
- EAINT-12393 (2026-09): Restore two JPJ letters. [latest]
- EAINT-12407 (2026-09): Reconciliation snapshot and RTR reference. [latest]
- EAINT-12430 (2026-10): LKM Refund Amount column in the status listing. Done. [latest]
- EAINT-12431 (2026-10): Owner email and WhatsApp at Step 1. In Development. [latest]
- EAINT-12329 (2026-09): Owner and UCD reminders at Step 4. To Do. [latest]
- EAINT-12567 (2026-10): Android parity. In Development. [latest]
- EAINT-11179 (2026-05): Move add-ons to Step 4. To Do. [latest]
- EAINT-9974: Permission check before payment at Step 5. On Hold.
- EAINT-12388 (2026-09): Blank Document Preview in Firefox. Fixed. [latest]
- EAINT-9973: Status inquiry once after submission.

### Open questions
- Fee band table: T11 shows fee 0 in every band. T52 shows non-zero fees. Which is current?
- 'LKM Refund Payment = Failed' on its own: how is it produced? Unknown.
- Notification templates for 12431 and 12329 'will be shared by Nurul later'. 12329 SRD v0.2 had 5 open questions.
- Ask eAuto Q7 (LKM Refund add-on, prod code) has not arrived yet. A later pass adds it.
- LKM Refund Phase 2 has no Jira key (searched 2026-10-26). Company stays out per Jira EAINT-12417 QA comment (2026-09-29 17:47), verbatim: "The company category is excluded from Phase 1 and stays excluded in Phase 2 (Yi Link Lim, CR group, 24-09-2026: "Company category remains excluded", "deprioritized until further notice")". Yet the Miro "LKM Refund (Phase 2)" card scope lists "Individual" and "Company", plus "LKM Refund Payment = Failed" and "LKM Refund Submission = Failed". Phase 2 scope beyond this is not written anywhere. [source: Studying LKM-Refund-Phase-2 study §3, §5, §10 #2, 2026-10-27]
- EAINT-11179: does Step 5 keep the add-ons, or lose them? The Jira title says "Add entry point for LKM Refund & Insurance Cancellation Add-on from Step 5 to Step 4"; the Jira request and the Miro card say "Move". No SRD yet (Miro column "TBC (pending requirement)"). [source: Studying EAINT-11179 study §1 #1-2, §10 #2, 2026-10-27]
  - Jira reason, verbatim: "Per Carsome feedback, their client leaves once Step 4 is done. UCD is unable to arrange another session to meet client for signature at Step 5, so add-on cannot be completed." [jira: EAINT-11179 description "Why", read 2026-10-26]
  - [unconfirmed] The LKM amount comes from the JPJ enquiry at Step 4. Whether the add-on shows before or after that enquiry is not stated. [source: Studying EAINT-11179 study §10 #3, 2026-10-27]

## Flow: LKM Refund: documents, e-signature and BO reset
- The dealer previews 3 documents, signs once, and the signature is pasted on all three. BO can reset the signature.
- Portals: UCD Portal, Back Office

### Entry points and steps
- Entry point "Document Preview after Next": UCD › STMS › Step 5 › LKM Refund Details › [Next] [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T68 DOCPREV_E-SIGN_TS1-TS9]
  1. Preview 3 documents | where: UCD › STMS › Step 5 › LKM Refund Document Preview | Surat Wakil Urusan Permohonan Pulangan Balik Hasil (PTJ Branch Address blank), Surat Permohonan dari Pemohon Asal (Lampiran F3), JPJK6 Borang Permohonan Bayaran Balik. The viewer is PDF.js and shows 'Loading document...' until #lkm-signature-wrapper loses lkm-signature-disabled. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons]
  2. Sign and Proceed | where: UCD › Step 5 › Document Preview | e-Signature pad with [Clear] and [Proceed]. After Proceed the signature is locked. Message 'e-Signature signed on DD-MM-YYYY hh:mmam/pm.' The signature is pasted on all three documents. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
     - If Close without signing, or Close with a signature not yet Proceeded -> LKM Refund checkbox is unticked.
     - If Close after Proceed -> Checkbox stays ticked. [Reconfirm LKM Refund Details] link shows.
- Entry point "BO Reset Signature": BO › STMS Transaction Listing › Action column › [Reset Signature] [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T75 BO_RES_E-SIGN_TS1] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
  1. Reset the saved signature | where: BO › STMS Transaction Listing | Confirm 'Sure to reset e-Signature for LKM Refund?' [OK]. The saved signature is removed and the UCD can sign again. It also unticks LKM Refund. Not in the SRD. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
     - If Resubmitted from the listing after a failed payment -> Reset not shown (T75 TS2).
     - If After a BO payment Reset -> Allowed (T75 TS3).

### Cross-module effects (what it affects)
- LKM Refund Document download at Step 6 and on STMS Details. The full document is 8 pages: Surat Wakil, Lampiran F3, JPJK6, Copy of IC, Bank Statement, Lain-lain, Borang Permohonan Bayaran Balik (from JPJ), Butir-butir Bayaran Balik LKM (from JPJ). The button shows only when the two JPJ items are available. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Copy of IC and Bank Statement uploads use AI extraction (bank name, IC name). [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Roles
- Reset Signature is visible only to listed BO users (eautojrjaya, eautonurul, jasons, mfared, nikmuhamad, mfizni). BO SuperAdmin, Admin, Probation and other users cannot see it. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Where the transaction goes
- Signed documents are stored with the transaction and downloadable from STMS Details. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Rules
- AI document check at [Next] gives per-file results BANK_STATEMENT and COPY_OF_IC, then SELLER_SIGNATURE after [Proceed]. Real AI since 07.10.2026. Charged per use. [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons] [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]
- Unsigned documents are not accepted. The signature cannot change after it is saved. [azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md] [jira: EAINT-12567 2026-10]

### QA scope to check
- Check Close before sign, Close after Proceed, Clear, and the signed-at message. [ts: EAINT-12022 T68 TS5, TS6, TS8, TS9]
- Check BO Reset Signature with an allowed and a non-allowed BO user. [ts: EAINT-12022 T79 RES_E-SIGN_ROLEPERM_TS1]
- Check the Document Preview in Firefox and Chrome. [jira: EAINT-12388 2026-09]

### Ticket history
- EAINT-10093 (2026-03): e-Signature. [latest]
- EAINT-12388 (2026-09): Blank preview in Firefox, fixed. [latest]
- EAINT-12022 (2026-10): Board T68, T75 cover this flow. [latest]

## Flow: LKM Refund: status inquiry, JPJ failure and BO tools
- After payment, JPJ's refund status is polled. JPJ failures, BO resubmit, e-Invoice retries and BO settings are covered here.
- Portals: UCD Portal, Back Office, JPJ (external), LHDN MyInvois

### Entry points and steps
- Entry point "Refresh Status button": UCD or BO › LKM Refund Status page › [Refresh Status] [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T05]
  1. Ask JPJ for the status | where: UCD › LKM Refund Status | One press locks the row for 5 hours. Status moves AC (In Progress / New Application), then WC (In Progress / Confirmation), then CU (Refund Done) or RB (Rejected with reason). Check the LKM Refund Status page, STMS Details and the JPJ XML Log (LKM Refund). [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#STMS Step 5 add-ons]
     - If Response REV000058E, REV000049E or GLB000179E -> Status stays AC.
     - If CU -> End state. Manual refresh is blocked.
- Entry point "Daily status cronjob": System: LKM status inquiry cronjob [azfar: eauto-qa-azfar:01b-azfar-extra.md] [jira: EAINT-12407]
  1. Cronjob calls JPJ | where: System | Daily 2:30 am (T63) or 02:00 per the research study. Picks NW, AC, WC and RB (depending on reason). CU is never re-inquired. It also runs once after submission (EAINT-9973). [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:cr/EAINT-12022/01-research/study.md]
- Entry point "JPJ final submission fails at Step 6": UCD › STMS › Step 6, after LKM Refund payment OK [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T29, T27]
  1. STMS is resubmitted without LKM Refund | where: UCD › STMS › Step 6 | The system resubmits the STMS with Indicator = N. Tx Status = Approved, LKM Refund JPJ = Failed. Message shows only when the UCD proceeded with LKM Refund and LKM payment was OK: 'Sorry, your LKM Refund request had failed. Your processing fee is charged. Please contact eAuto Support Team at [hotline number omitted]. Kindly proceed to JPJ Counter for your LKM Refund submission.' | affects: STMS Tx Status; LKM Refund JPJ column; JPJ XML Log [azfar: eauto-qa-azfar:01b-azfar-extra.md]
     - If JPJ error 7G (Company) -> 'No request for LKM cancellation has been made'.
     - If 7H, 7I, 7J, 7K, 7M, 7P, 7U, 7V, 7W, 7X, GLB000648E -> Refund record not found, technical errors or PTJ branch/email required.
     - If REF000068E or REF000069E -> Contact JPJ helpdesk. No QA result recorded.
- Entry point "BO Resubmit JPJ Final Submission (STMS)": BO › Resubmit JPJ Final Submission (STMS) [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T10, T13, T34]
  1. Resubmit a failed STMS | where: BO › Resubmit JPJ Final Submission (STMS) | Cronjob stmsJpjSubmissionTrigger (every 1 hour) also resends the second enquiry and submission for Pending (patched) transactions. A failed STMS payment can be reset in the BO listing and retried at Step 5. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
     - If Failed due to the LKM Refund Indicator -> Popup 'Unsuccessful Submitted JPJ Submission {transaction_no} - LKM Refund Transaction Not Found / LKM Refund Payment Not Paid.' Tx stays Failed.
     - If Otherwise -> Popup 'Resubmitted 1 transactions.' and Indicator = N.
- Entry point "BO Manage LKM Refund Amount": BO › Manage LKM Refund Amount (below RM30) page / state-level bands [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T04, T15, T48]
  1. Edit permission and bands | where: BO › Manage LKM Refund Amount | Enable or Disable (default Enable). Tick an amount band (5-30, 30.01-50, 50.01-100, 100.01-500, 500+), then the states, with Select All. [Update] writes an audit log. Unticking one state unticks Select All. | affects: UCD Step 5 checkbox visibility; JPJ Refund Indicator [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Entry point "BO LKM Refund Attachment Listing": BO › LKM Refund Attachment Listing [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T21]
  1. Per PTJ Branch counts and documents | where: BO › LKM Refund Attachment Listing | The 'LKM Refund Transaction' count per PTJ Branch goes up for LKM Refund Status = Requested, not Failed. An incomplete document shows Remarks 'Incomplete Document: {Transaction No.}'. [Retry] checks readiness, then [Download] and [Print] show. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Entry point "e-Invoice retry for invalid or blank TIN": System: LHDN resubmission and consolidated e-Invoice jobs [azfar: eauto-qa-azfar:01b-azfar-extra.md] [ts: EAINT-12022 T09, T37]
  1. BO fixes the TIN, the cronjob resubmits | where: BO › company TIN; System | LHDN Failed (invalid or blank TIN): BO updates the TIN, the cronjob resubmits and the e-Invoice is generated. Consolidated e-Invoice resubmits with the general TIN EI00000000010 and keeps the remarks 'TIN verification failed...' or 'No TIN info has been provided.' | affects: e-Invoice listing; Consolidated e-Invoice listing; MyInvois [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Cross-module effects (what it affects)
- LKM Refund Status listing, STMS Details, JPJ XML Log (LKM Refund). [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Invoice and e-Invoice carry Page 1 Transfer History, Page 2 STMS, Page 3 LKM Refund when a refund is taken. A 'Not charged (FOC RM0.00)' case has no LKM sections. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Consolidated e-Invoice job does not pick transactions from the previous month (patched Dec 2025) or LHDN-OK ones. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Cronjobs
- LKM Refund status inquiry | Daily 2:30 am (T63). Research study says 02:00. | Picks NW, AC, WC, RB (depending on reason) and triggers a JPJ inquiry. CU is never re-inquired. [azfar: eauto-qa-azfar:01b-azfar-extra.md] [azfar: eauto-qa-azfar:cr/EAINT-12022/01-research/study.md]
- stmsJpjSubmissionTrigger | Every 1 hour | Resends SecondEnquiry and Submission for Pending (patched) STMS. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- [unconfirmed] LHDN e-Invoice resubmission | Unknown | Resubmits failed e-Invoices using the BO TIN. Skips if the TIN is blank. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- [unconfirmed] Consolidated e-Invoice job | Auto-run, schedule unknown | Resubmits with the general TIN. Skips previous-month and LHDN-OK transactions. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Roles
- UCD and BO can both click Refresh Status. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Manage LKM Refund Amount: kmcheah, jasons, nikmuhamad, mfizni can view and edit. BO SuperAdmin, Admin, Probation and others view only, with no [Update] button. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- Resubmit JPJ Final Submission: BO user. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Where the transaction goes
- CU or RB are end states. CU is never re-inquired. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- An e-Invoice (LKM Refund) with submission and validation date and response status OK. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### Rules
- Status 'LKM Refund JPJ' column is new in the BO STMS listing, with 'LKM Refund Payment'. [azfar: eauto-qa-azfar:01b-azfar-extra.md]
- JPJ response GLB000000I is normal. [azfar: eauto-qa-azfar:01b-azfar-extra.md]

### QA scope to check
- Check each status AC, WC, CU, RB in the status page, STMS Details and the XML Log. Check the 5-hour lock after Refresh. [ts: EAINT-12022 T05, T63]
- Check JPJ error codes at Step 6 and the 'LKM Refund request had failed' message. [ts: EAINT-12022 T27, T29]
- Check BO resubmit with and without the indicator, and for UCD to UCD Standard vs Interstate. [ts: EAINT-12022 T10]
- Check Manage LKM Refund Amount: Select All logic, audit log, role view. [ts: EAINT-12022 T04, T15]
- Check Attachment Listing counts, incomplete document, Retry, Download and Print. [ts: EAINT-12022 T21]
- Check LHDN retry for invalid and blank TIN, and consolidated e-Invoice. [ts: EAINT-12022 T09, T37]

### Ticket history
- EAINT-104 (2026-10): LKM Refund. [latest]
- EAINT-9973: Status inquiry after submission.
- EAINT-12022 (2026-10): Board for the add-on test scripts. [latest]
- EAINT-10097: Status cronjob and screens.
- EAINT-12389: Status screens.

### Open questions
- T59 note says '04.02.2026 (only manual trigger JPJ enquiry)'. T63 shows the cronjob passing. The schedule is only in T63.
- How to trigger an 'Incomplete Document' on the Attachment Listing is unknown (needs a dev patch). T21 TS3 has no result.
- Schedules for the LHDN and consolidated e-Invoice jobs are not in the extracts.

## Flow: Insurance Cancellation (Runnerku) at Step 5
- Individual sellers (MyKad and MyPR) can ask to cancel their motor insurance when the vehicle is transferred. The add-on shows only when Runnerku says the vehicle is eligible. The IC case is submitted to Runnerku only after the STMS is Approved and the IC fee is paid.
- Portals: UCD Portal, Back Office, Runnerku (external; eSim on staging), AI document check

### Entry points and steps
- Entry point "Tick Insurance Cancellation at Step 5": UCD › STMS › Step 5 › Add-on Services › Insurance Cancellation (below LKM Refund) [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [jira: EAINT-12022 2026-07]
  - Optional and unticked by default. Shows the insurer display name, balance percent and a tooltip.
  1. Ticking creates the IC transaction and the Runnerku case | where: UCD › STMS › Step 5 | The IC transaction (running number) and the Runnerku case are created at once. Runnerku answers REQUEST_DOCUMENT. The first 'Pending Docs' is never shown. UCD and BO show '-' until the STMS is Approved. [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#Insurance Cancellation status flow]
     - If Vehicle is not eligible (eSim runnerku-eligibility-resp matches the first 2 letters of the vehicle no.) -> Add-on is not shown. P&O, RHB Insurance and Progressive are never eligible.
     - If Seller is a company -> Not offered. Individual only.
  2. Fill the pop-up | where: UCD › STMS › Step 5 › Insurance Cancellation pop-up | Seller's Name (read-only), Bank Name (39 banks), Bank Account No (4-30 digits), Copy of IC, Bank Statement (5MB; PDF/PNG/JPG/JPEG), declaration, [Cancel] / [Next]. [Next] runs the AI check (3 messages). The State field was removed in v1.1. Error 'File size exceeded.' [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [jira: EAINT-12022 SRD v1.1 2026-07]
  3. Preview and sign insurer documents | where: UCD › Step 5 › Document Preview | All 19 insurers: Authorisation Letter + Endorsement Form. 6 also an ePayment Slip. Some a KYC Form. The Transfer Slip is NOT signed at Step 5 (BA, 09.10.2026). e-Signature button changes from Close to Proceed after signing. Judged by eye (09.10.2026). [azfar: eauto-qa-azfar:cr/EAINT-12022/STATUS.md] [jira: EAINT-12022 SRD v1.1 2026-07]
  4. Pay | where: UCD › STMS › Step 5 › Payment Summary | Line 'eAuto STMS Fee'. IC processing fee RM38.00 + 8% SST = RM41.04, shown RM0.00 when unticked. IC is its own non-split RHB payment with Reference 2 '.../IC', Payment Ref ID format '0809'. IC coexists with LKM Refund on one Step 5 (user decision 01.10.2026). IC does not replace LKM Refund. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [jira: EAINT-12022 SRD v1.1-v1.2 2026-07]
     - If IC payment fails -> IC Status '-'. Slip Pengesahan pages 1-2 hidden in the IC document. Before EAINT-12549 the fee was charged once right after the STMS payment.
  5. Order of events after payment | where: System | STMS payment, then STMS submission (JPJ), then LKM Refund payment, then LKM Refund submission, then IC payment, then IC submission to Runnerku. IC goes to Runnerku only after the STMS is Approved and the IC payment is OK. | affects: Runnerku; STMS listing; Insurance Cancellation Status page [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#Insurance Cancellation status flow]
- Entry point "Insurance Cancellation Status page": UCD STMS home › Insurance Cancellation Status tile; BO › Insurance Cancellation Status [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [jira: EAINT-12022 child tickets 12494, 12497, 12498, 12512, 12544]
  1. Watch the status change | where: UCD / BO › Insurance Cancellation Status | 7 filters, 11 columns. After STMS Approved: Pending / In Review, then Runnerku PROCESS gives Pending / In Progress, then COMPLETE gives OK / OK. REQUEST_DOCUMENT gives Pending / Pending Docs with [Resubmit]. CANCEL gives Cancelled / Failed (Document Review Failed + IC Status Cancelled). [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#Insurance Cancellation status flow] [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
     - If Only the IC payment fails -> IC Payment Failed. Other IC columns '-'. No [Resubmit] (Azfar decision, over SRD v1.1 §2.2.9 #5 which says Pending Docs).
- Entry point "Resubmit when Runnerku asks for documents": UCD › Insurance Cancellation Status › [Resubmit] (resubmit.do) [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Entry points] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#Insurance Cancellation status flow]
  - Only on this page. Never on the STMS Transaction Listing and not on BO.
  1. Re-sign and resubmit | where: UCD › Insurance Cancellation Status › Resubmit | Redirects to a new page with a pre-populated signature (v1.2). Resubmission was on hold at times. [jira: EAINT-12022 SRD v1.2 2026-10] [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- Entry point "Failed IC payment is retried by the system (EAINT-12549)": System at STMS approval [jira: EAINT-12549 2026-10]
  - Status: Ready for Prod as of 19.10.2026.
  1. Retry task and poller | where: System | A retry-task row (inscancelretrypaymenttask) is created at STMS approval. A cron poller claims due tasks and retries through RHB with the same payment reference. On success the normal payment records and invoice are produced and the case goes to Runnerku. BO shows Resubmit after the auto-retries fail. [jira: EAINT-12549 2026-10]
- Entry point "Enhancements raised 21-22.10.2026 (To Do)": Several (split from the 'Insurance Cancellation Enhancement request' of 22.10.2026) [jira: EAINT-12581 2026-10] [jira: EAINT-12573 2026-10]
  - None built. EAINT-12573 (2026-10-21) overlaps 12581-12584. The newer split tickets supersede the umbrella.
  1. Resubmit button visible for 24 hours only | where: UCD › IC Status | Counted by working day after a payment failure. Once only. Holiday cases handled by Ops manually. EAINT-12581. [jira: EAINT-12581 2026-10]
  2. Email Ops when Runnerku rejects | where: System | Email with Vehicle No, STMS Tx No, IC Tx No, failure reason and date. Ops calls the UCD to reupload. EAINT-12582. [jira: EAINT-12582 2026-10]
  3. Send nothing to Runnerku if IC was unticked before payment | where: System | A production case sent all documents although IC was unticked. EAINT-12583. [jira: EAINT-12583 2026-10]
  4. BO export on the IC listing | where: BO › Insurance Cancellation Status | Export for Ops Manager only. Document checklist tick button copied from LKM Refund. EAINT-12584 and 12573. [jira: EAINT-12584 2026-10]
  5. Reuse uploaded documents between LKM Refund and IC | where: UCD › Step 5 | Prepopulate; the UCD may replace. EAINT-12585. [jira: EAINT-12585 2026-10]
  6. Owner awareness and Ops alert emails | where: System | Owner email or WhatsApp at Step 1 and 2, eligibility notice after the JPJ check, Ops alert on IC payment failure or Runnerku reject. EAINT-12572. [jira: EAINT-12572 2026-10]
  7. BO STMS listing column 'Ins Cancellation Balance %' | where: BO › STMS Transaction, STMS CSV export, BO › Insurance Cancellation Transaction ('Balance %') | Column added before 'Ins Cancellation Payment' by EAINT-12586 (Done, S34.14-20261023). EAINT-12589 (Bug, Done, fix version S34.15-20261026) makes it show the whole percent whenever a balance is on record, at any IC status (incl. Failed / Cancelled) and even before an IC transaction exists. '-' only when there is no balance at all. UCD pages unchanged. [source: Jira EAINT-12589 description, read 2026-10-26: "the balance column shows the balance (whole percent, e.g. \"67%\") whenever one is on record - whatever the Insurance Cancellation status, and even before an Insurance Cancellation transaction exists. It shows \"-\" only when there is no balance at all."] [source: Jira EAINT-12589 description, read 2026-10-26: "Dealer (UCD) pages are not changed and keep their current behaviour."]
     - Corrected 2026-10-26: this line previously said 12589 would "show '-' for Failed, Cancelled or no-transaction cases". That is the old (buggy) behaviour Jira describes, not the fix. [source: Jira EAINT-12589 description, read 2026-10-26: "It is blanked when the Insurance Cancellation case is Failed or Cancelled, and - on the STMS listings and export - also when the vehicle passed the eligibility check but no Insurance Cancellation transaction has been created yet."] [source: _reference/tickets/Studying/EAINT-12589/EAINT-12589-study.md §10 #2]
     - Possible key confusion 12586 vs 12589: the 23.10.2026 deployment notice lists this column title under EAINT-12586, while the 26.10.2026 huddle lists the same title under EAINT-12589. [source: Teams eAuto Secarang Main Group, Yi Link Lim, 2026-10-22 17:34: "3. EAINT-12586 🔴[eAuto-BackOffice] STMS Listing: To Add "Ins Cancellation Balance %" Column Before Ins Cancellation Payment"] [unconfirmed] 12589 is a follow-up fix to 12586, not the same change. [source: _reference/tickets/Studying/EAINT-12589/EAINT-12589-teams-since-2026-10-16.md #3]
     - Open: "whole percent" rounding vs truncation (e.g. 66.7) is not stated in Jira. [unconfirmed]

### Cross-module effects (what it affects)
- STMS listing (UCD + BO): 4 filters, 5 columns, remarks, actions. STMS Details: IC section, Payment Details (IC), e-Invoice. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- New UCD and BO 'Insurance Cancellation Status' module. Documents downloadable as 'Insurance Cancellation Document' from STMS Details. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [azfar: eauto-qa-azfar:cr/EAINT-12022/STATUS.md]
- e-Invoice and Consolidated e-Invoice listing, Type 'Insurance Cancellation'. BO RHB Payment Transaction. Payment Report and Payment Breakdown Report. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [jira: EAINT-12022 children 12494-12544]
- [unconfirmed] Reconciliation Listing type: matched only when IC Status = OK (OQ16). Revenue Report unclear (Q16). [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- The SST Payment Report does not include IC. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- Homepage popup and What's New (see the popups flow). [jira: EAINT-12555 2026-10]

### Cronjobs
- [unconfirmed] IC payment retry poller (name unknown) | Unknown | Claims due inscancelretrypaymenttask rows and retries the RHB payment with the same reference. [jira: EAINT-12549 comment 2026-10-19]

### Roles
- Individual sellers only. A company-level permission for IC is not named (unlike TH and eLKM). [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [azfar: eauto-qa-azfar:cr/EAINT-9233/LEDGER.md]
- BO IC page is open to all users after the patch. On 15.10.2026 deploy night all BO users except 8 hard-coded ones (jasons, eautohaffiz, eautokelvin, eautosoyeng, mfared, nikmuhamad, soxian, mfizni) got access denied (/eauto/home/?err=203). Patched the same night. [azfar: eauto-qa-azfar:knowledge/portals/backoffice/how-we-test.md#Traps] [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- BO export on the IC listing: Ops Manager only (To Do). [jira: EAINT-12584 2026-10]

### Where the transaction goes
- The case goes to Runnerku, the external insurance-cancellation processor. Status comes back by webhook. The signed IC document is downloadable from STMS Details. [azfar: eauto-qa-azfar:cr/EAINT-12022/STATUS.md] [jira: EAINT-12022 SRD v1.1 2026-07]

### Rules
- Runnerku pushes only on a status change. Only REQUEST_DOCUMENT, COMPLETE and CANCEL reach eAuto from eSim. [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#eSim Runnerku facts]
- [unconfirmed] Assumption: only STMS transactions created after the production deploy are in scope. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Entry points]
- AI document check is real since 07.10.2026 and charged per use. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- The transfer slip sent to the insurer is unsigned (BA, 09.10.2026). [azfar: eauto-qa-azfar:cr/EAINT-12022/STATUS.md]
- Column name differs by source: 'Ins Cancellation Transaction No', 'Insurance Cancellation Transaction No' and the build's 'IC Transaction No'. [azfar: eauto-qa-azfar:cr/EAINT-12022/STATUS.md]
- Copy of IC front / back split (EAINT-12580, bug found on Production, fix version S34.16-20261027): the system cuts the Front IC and Back IC out of the one upload and sends them to Runnerku. Cause, verbatim: "The system cuts the front and back out of the upload by looking for card-shaped areas. Watermark text can look like two cards, and nothing checks that the cut-out pieces are really the IC. The IC check reads the full upload, which is a genuine IC, so it passes." [from ticket EAINT-12580, Jira description, Cause]
  1. Expected after the fix, verbatim: "The Front IC shows the full photo side and the Back IC the full back, with nothing cut off. If both sides cannot be found with certainty, the upload is rejected with "Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy." Wrong images are never saved." [from ticket EAINT-12580, Jira description, Expected result]
  2. How to test, verbatim: "a successful upload proves nothing - open the saved Front IC and Back IC and check they show the real card." [from ticket EAINT-12580, Jira description, Reference for QA]
  3. Hard shapes named in the bug, verbatim: "a card photographed on a table and a sideways photocopy are not found at all." Expected result for these is not stated. [from ticket EAINT-12580, Jira description, Additional note]
  4. Known remaining split defect: a MyTentera card with the back above the front splits with the sides swapped. [from ticket EAINT-12580, sub-task EAINT-12647 summary] [unconfirmed — sub-task not read]
  5. The split is not tied to a staging branch: "12580 got no branch, it affects all branch ya" [from Teams eAuto QAs, 2026-10-26 12:25, Amirul Azfar]
  6. No production regression is possible for a change to the split: "cannot do any prod regression as the changes is only on step-5 ai checking for ic" [from Teams eAuto QAs, 2026-10-26 16:38, Amirul Azfar]
  7. The same reject message was already seen on 10.10.2026 under EAINT-12022 (front-only and back-only uploads), so seeing it alone does not prove the 12580 fix. [source: Studying EAINT-12580 related-history, Known traps #5, 2026-10-27] [unconfirmed]
  8. Two different IC messages exist: AI mismatch "Your copy of IC could not be validated. Kindly review the file and reupload a valid version." and the split reject above. Check which one each case must show. [source: Studying EAINT-12580 related-history, Known traps #6, 2026-10-27]
  9. eSim keeps no IC images: "its Runnerku Case pages list the documents by type (front_ic, back_ic, ...) with a review status, never the image. Only Runnerku / Dev can show the two images." Where to view the saved Front IC / Back IC on staging is still open. [source: Studying EAINT-12580 related-history, Known traps #1, citing eauto-qa-azfar rerun-1610-c2.spec.ts:32-34] [unconfirmed]

### QA scope to check
- Check eligibility: eligible and not eligible insurers, Individual vs Company, MyKad vs MyPR. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md] [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#eSim Runnerku facts]
- Check the pop-up fields, 39 banks, account no length, file size and type errors, and the 3 AI messages. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- Check preview and sign for each insurer family: 19 with Authorisation Letter + Endorsement Form, 6 with ePayment Slip, KYC Form cases. [azfar: eauto-qa-azfar:cr/EAINT-12022/STATUS.md]
- Check fee RM38.00 + SST = RM41.04, and RM0.00 when unticked, with and without LKM Refund. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- Check the status paths: PROCESS, COMPLETE, REQUEST_DOCUMENT, CANCEL, payment failure. [azfar: eauto-qa-azfar:knowledge/portals/ucd/how-we-test.md#Insurance Cancellation status flow]
- Check Resubmit only on the IC Status page and not on the STMS listing or BO. [azfar: eauto-qa-azfar:knowledge/_core/stms.md#Entry points]
- Check the listings, e-Invoice type, reconciliation and reports. Check SST Payment Report does not include IC. [azfar: eauto-qa-azfar:cr/EAINT-12022/LEDGER.md]
- Check BO Insurance Cancellation Status access for BO roles. [azfar: eauto-qa-azfar:knowledge/portals/backoffice/how-we-test.md#Traps]

### Ticket history
- EAINT-12022 (2026-10): Insurance Cancellation add-on. Live S34.10-20261014. SRD v1.2 2026-10-13. 352 TS, 319 PASS, 33 deprioritised. [latest]
- EAINT-10165 (2026-03): Legacy prototype. Done. [legacy, superseded by EAINT-12022]
- EAINT-12549 (2026-10): Failed IC fee retry task. Ready for Prod. [latest]
- EAINT-12586 (2026-10): Ins Cancellation Balance % column. Done, S34.14-20261023 (Jira, read 2026-10-26). [latest]
- EAINT-12589 (2026-10): Balance % column shows the percent whenever a balance exists. Done, S34.15-20261026 (Jira, read 2026-10-26). [latest]
- EAINT-12581 (2026-10): Resubmit visible 24 hours. To Do. [latest]
- EAINT-12582 (2026-10): Email Ops on Runnerku reject. To Do. [latest]
- EAINT-12583 (2026-10): Send nothing if IC unticked. To Do. [latest]
- EAINT-12584 (2026-10): BO export, Ops Manager. To Do. [latest]
- EAINT-12585 (2026-10): Reuse documents with LKM Refund. To Do. [latest]
- EAINT-12572 (2026-10): Awareness and alert emails. To Do. [latest]
- EAINT-12573 (2026-10): Umbrella for 12581-12584. [legacy, superseded by EAINT-12581]
- EAINT-11156: Message blast to West Malaysia. To Do.
- EAINT-12580: Watermark case. Referenced, not read.

### Open questions
- Transfer slip sent to the insurer is unsigned (BA, 09.10.2026). Is that final?
- Real Runnerku-only behaviours such as 'In Review' cannot be reproduced on eSim.
- 77 open questions were outstanding at draft time.
- IC payment failed: SRD v1.1 §2.2.9 #5 says Pending Docs and Resubmit. Azfar decided IC Payment Failed with no Resubmit. Which stands?
- Ask eAuto Q8 (Insurance Cancellation, prod code) has not arrived yet. A later pass adds it.

## Flow: Homepage popups and What's New for the add-ons
- Launch posters shown on the UCD homepage after login.
- Portals: UCD Portal

### Entry points and steps
- Entry point "Poster popup after UCD login": UCD Home (after login) [jira: EAINT-12555 2026-10] [jira: EAINT-12438 2026-10] [jira: EAINT-12421 2026-09]
  1. Show the latest poster once per login | where: UCD Home | Latest: EAINT-12555 replaces the LKM Refund popup with the Insurance Cancellation poster (prod 20.10.2026). One time per login. [jira: EAINT-12555 2026-10]
- Entry point "What's New section": UCD Home › What's New [jira: EAINT-12525 2026-10]
  1. 'What's New - LKM Refund' | where: UCD Home › What's New | Heading changes from 'What's New' to 'What's New – LKM Refund'. The BMK video is replaced by the LKM Refund tutorial. Before, only users with insurance permission saw it. Now all UCD users do (clarified 20.10.2026). [jira: EAINT-12525 2026-10]

### Cross-module effects (what it affects)
- UCD Homepage only. [jira: EAINT-12555 2026-10]

### Roles
- All UCD users see the What's New LKM section. [jira: EAINT-12525 2026-10]

### Rules
- Popup shows one time per login. [jira: EAINT-12555 2026-10]

### QA scope to check
- Check the popup appears once per login and again at the next login. [jira: EAINT-12555 2026-10]
- Check What's New heading and video for a user with and without insurance permission. [jira: EAINT-12525 2026-10]

### Ticket history
- EAINT-12555 (2026-10): Insurance Cancellation poster replaces LKM Refund popup. Prod 20.10.2026. [latest]
- EAINT-12438 (2026-10): LKM Refund popup v1.1. Prod 07.10.2026. [legacy, superseded by EAINT-12555]
- EAINT-12421 (2026-09): LKM Refund launching poster. Prod 01.10.2026. [legacy, superseded by EAINT-12438]
- EAINT-12525 (2026-10): What's New - LKM Refund heading and tutorial video. [latest]

## Additions from Charmain's QA repo — LKM Refund, EAINT-104 / 10093 / 10168 / 12055 / 12407 (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1, last commit 2026-10-13). **Status: a colleague's notes and two draft ledgers (UCD-STMS-LKM-REFUND 38 entries, BO-LKM-REFUND 40 entries, none with a case), not verified live by us.** Drafted 2026-10-02 from her EAINT-104 pack (143 `LKM-nn` scenarios, 102 Pass, 41 N/A). (doc) = an SRD states it; (obs)/(dim) = her observation or reasoning. QA rulings 2026-09-22 to 10-02 are QA decisions. Tag: `[charmain-repo: <path>:<line>]`.

### Sources she used (SRDs kept outside her repo for confidentiality)
- SRD EAINT-104 v1.4 (24-02-2026), base for both portals; SRD EAINT-10093 v1.1 (19-03-2026, post-JPJ-UAT changes); SRD EAINT-10168 v1.1 (23-06-2026, reconciliation listing); SRD EAINT-12055 v1.0 (in her repo). EAINT-12407 (LKM Refund in reconciliation) is "a Jira ticket with acceptance criteria, no SRD". [charmain-repo: docs/modules/bo/lkm-refund/README.md:76-83]
- Not in any SRD, used as the build contract by her pack: JPJ change list "Paparan Proses Permohonan Bayaran Balik LKM melalui STMS – Kategori Individu" 2026-09-30 (amended v2 10:36); Ops SENARAI DOKUMEN 2026-09-23 (re-sent 09-29); `LIST OF BANK_20260224.xlsx` (21 banks); JPJ-IDD-STMS (eAuto) V1.5 LKM Refund 2026-04-07. [charmain-repo: docs/modules/ucd/stms-lkm-refund/README.md:47-50]

### UCD side: rules and observed behaviour
- Fee table (SRD v1.4 Table 2.2.1.7.2, exclusive of 8% service tax): 0.00–4.99 not offered; 5.00–30.00 RM0, "offered only while BackOffice allows the RM5 to RM30 band"; 30.01–50.00 RM5; 50.01–100.00 RM10; 100.01–500.00 RM35; 500.01+ RM50. The SRD table is headed "Pending Ops Team to get approval from MOT". [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:41-50,417]
- Her pack proved the four charged bands on 2026-10-01: RM40 → RM5, RM75 → RM10, RM250 → RM35, RM750 → RM50. Service tax = 8% of the eAuto STMS fee + 8% of the processing fee, "never of the JPJ STMS fee". [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:170-176]
- Boundary: box shows at exactly RM5.00, not at RM4.99; proved both readings on one transaction 2026-10-01. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:163-169]
- Perakuan: shown to **every** seller at Step 1 (refund or not) and the dealer at Step 3; thumbprint section hidden until the checkbox is ticked; once ticked it cannot be unticked. The company flow's two Seller and Buyer Perakuan at Step 3 are no longer shown. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:137-147]
- Wording: SRD says "Bayaran Balik LKM"; the build follows JPJ's 30-09-2026 list: "Pulangan Balik Hasil Lesen Kenderaan Motor (LKM)" in titles, "Pulangan Balik Hasil LKM" in points, lower-case "permohonan"; kept on purpose: "Butir-Butir Bayaran Balik LKM", "Hak Milik Dituntut", English screen labels. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:148-155]
- Popup consent names this transaction's vehicle number. Proceed unticked: "Please tick the checkbox to proceed to the next step." [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:156-160]
- Unticked box: processing fee line RM0.00, STMS fee only, Step 6 no LKM amount or PTJ, indicator N, invoice has no LKM page. Fee labels "JPJ STMS Fee" and "eAuto STMS Fee". [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:177-184]
- State list: SRD = 14 states, WP Labuan prefilled as Sabah, WP Putrajaya as WP Kuala Lumpur. Build = Selangor and WP Kuala Lumpur only. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:185-191]
- Company seller: SRD offers it (no Copy of IC, Cop Syarikat stamp instead); build shows no box on a company Step 5 (seen 2026-09-30). Phases are in Teams only: Phase 1 (1 October) individuals of dealers in KL and Selangor; Phase 2 keeps companies and Sabah out; companies "deprioritised until further notice". [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:192-208,407]
- Document check runs on **Proceed**, never on choosing the file; each file judged on its own; front-only or cropped IC refused; soft-focus IC whose number, name and address read is accepted. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:210-218]
- Refusal message: SRD gives three ("Your copy of IC could not be validated…", "Your bank statement could not be validated…", "Your copy of IC and bank statement could not be validated…"); build gives **one generic message naming no file** (QA ruled expected 02-10-2026). [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:267-270,411]
- Field rules: every field required; Bank Account No. digits only, 4–30, "Minimum length is 4."; uploads PDF/PNG/JPG/JPEG up to 5 MB; Seller's Name filled from Step 1, not editable; Cancel closes with nothing saved. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:261-266]
- Bank list: SRD 38 banks; build 21 (client list 24-02-2026), "BANK ISLAM" where the SRD says "BANK ISLAMIC". [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:271-273,408]
- Popup carries the iGFMAS account reminder (Malay then English) and a 3–6 month processing notice (from Ops in Teams 25-09-2026, reworded 30-09-2026; no SRD). [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:274-279,412]
- Preview before signing: PTJ address empty; under each signature place "Tandatangan elektronik akan digunakan pada bahagian ini."; once signed, cannot be signed again from UCD; the note is not on the stored document. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:285-289]
- Surat Wakil Urusan: Tarikh = STMS JPJ approved date DD-MM-YYYY; PTJ address JPJ returned; seller name and IC from Step 1; amount; e-signature; title "VOT T12" not T21. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:224-229,360-364]
- Payment: "the STMS fee is paid first and the refund fee second"; listing shows "OK" under Payment and LKM Refund Payment; indicator Y; details show request "Requested" with date and time; status enquiry runs once right after submission so the Status page has the row at once. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:232-240]
- Refund payment fails at the bank: "Sorry, your LKM Refund request had failed. Your processing fee is NOT charged. Kindly proceed to JPJ Counter for your LKM Refund submission." Transfer still completes, indicator N. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:241-246]
- Paid but JPJ answers 7G, 7H, 7I, 7J or 7K: "Sorry, your LKM Refund request had failed. Your processing fee is charged. Please contact eAuto Support Team at …"; indicator N; code shows under LKM Refund JPJ on the listing. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:292-298]
- No reset payment for STMS at Step 6 or on the details page. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:251-252]
- Retry Payment: a fresh JPJ enquiry first; a failed enquiry sends the dealer back to Step 4 with Resubmit; loading the payment page alone makes no enquiry. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:305-311]
- Resubmit from the listing keeps the box ticked when details were saved; Reconfirm reopens the popup at stage 1 with stored file names; after Reconfirm, Next re-checks stored files without re-choosing them (QA ruled right 28-09 and 02-10-2026). [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:312-322]
- Details header shows the LKM Refund transaction number **only when Approved** (decision 27-02-2026, not in the SRD). No refund payment = "No payment found." [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:325-336]
- e-Invoice: dealer with no TIN or invalid TIN reads LHDN status "Failed"; the e-Invoice button was seen hidden on a Failed transaction. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:337-343,418]
- Refresh Status: one enquiry, then grey with "Please try again to check the LKM Refund Status after dd-mm-yyyy hh:mm.", back after five hours; nightly job switched off (SRD 10093 §2.2.5). [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:344-350]
- Main users and sub-users both get the refund; nothing to grant. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:351-353]
- Statuses: SRD five (LKM Cancelled, New Application, Refund Done, Rejected, Confirmation); build three (In Progress, Refund Done, Rejected; dev 22-09-2026), reason under "Refund Remarks". Listing filters add "Pending" (EAINT-11146). [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:371-378,409]
- A transfer created before the release is never offered the refund, even at RM5+. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:379-382]
- **Trap, live flow, not ticketed:** company documents filled at Step 2 skip the SSM check at Step 4 and reach a payable Step 5 (source LKM-67, A/B run on preprod1 2026-10-01, "not raised and not ticketed"). [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:425-429]
- UCD Payment Breakdown Report and UCD Payment Report: separate tickets EAINT-12400, 12401, 12402, deployed 2026-09-23. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:430-433]
- Test data: a vehicle and owner can transfer only once, so every paying run needs a fresh plate. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:451]

### BO side: rules and observed behaviour
- The refund fee has no JPJ kod hasil: listed like eVOC, Listing tab only, never on the Summary or the JPJ Hasil upload. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:49-52]
- RHB Payment Transaction (eAuto Plus) Transaction Type: exactly All, BMK, Transfer History, eLKM, eVOC, LKM Refund. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:138-143]
- SST Payment Report boxes BMK, TH, eLKM, eVOC, LKM Refund, all ticked by default. SRD renames "EVOC" to "eVOC"; frame of 2026-10-02 still shows "EVOC". [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:144-147,250-252]
- Manage LKM Refund Amount (below RM30): global Enable/Disable, RM5–RM30 band box, state lists. **Global shared state**: agree a window with other testers and put it back. A resubmitted unpaid transaction loses its refund while Disabled; an already-paid one still goes with Y. RM0 refund writes no refund payment row. Band ticked asks for its own state list; saving with no state is refused. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:150-169,453]
- Only SRD-named editors may change the page; others view read-only with no Update button. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:273-277]
- Release-day setup (Ops in Teams 2026-09-24): KL and Selangor only, band off, individuals only. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:278-281]
- No-permission at pay: "Your account don't have LKM Refund permission." Her pack never saw it on screen and recorded **two RHB payments, both OK** on the transaction whose refund was left out (open: was the fee charged?). [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:170-177,401]
- Resubmit JPJ Final Submission (STMS): "LKM Refund Indicator" box, unticked by default; ticked = Y with PTJ branch. A transaction already failing on a duplicate EFT cannot show the indicator. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:180-186]
- Manual Payment Processing (STMS, APT, eSTM) re-sends a Pending submission with Y and the PTJ, even at RM0 fee; confirms through a browser dialog. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:187-191]
- JPJ emails two attachments; they join the bundle before the Slip Pengesahan and bank statement. JPJ will rename "Bayaran" to "Pulangan" (dev 2026-09-29), which may break mailbox retrieval. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:194-199,413]
- Attachment Listing: one row per PTJ branch; Transaction Date required, today and future not pickable; Print for joined, Retry for waiting; Mark As Delivered sets Doc. Status "Delivered". Download was ruled out by BA 2026-01-30 (binding printer); SRD v1.4 still lists it; build Print only. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:200-207,290-293]
- Bundle: refund forms carry the e-signature, no thumbprint; the Slip Pengesahan keeps its thumbprint. From 2026-09-30 the EFT notice page after the Slip Pengesahan is gone (Ops in Teams). Copy of IC watermark "Use" (EAINT-9986). A stored bundle is frozen at submission; the Step 5 preview re-renders from the current template. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:300-321]
- RHB references: SRD Reference 1 = LKM Refund Payment Ref ID (yymmdd + "0808" + 4-digit running) + vehicle no., Reference 2 = that id + "/RTR". Build puts the RR payment id in Reference 1, with a trailing slash (dev confirmed 2026-09-28); reconciliation matches on it. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:237-242,399]
- STMS Transaction filters: LKM Refund Amount = All, RM5 and above, Below RM5, RM0, "-"; LKM Refund Payment / JPJ = OK, Failed, Pending, "-"; LKM Refund LHDN Response Status = All, OK, Failed, "-", N/A. "-" amount = created before release or never enquired. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:253-261]
- RHB Payment Transaction Company Name comes from the RHB account holder, so on staging it never matches the dealer (dev: existing behaviour, 2026-09-22). [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:404]
- Reupload LKM Refund Attachment: SRD §2.2.2.10 "this feature no longer valid, will removed"; page answers Not Found. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:428-429]
- Reconciliation for the fee: listing amount = fee + 8%: RM5.40, RM10.80, RM37.80, RM54.00. Same reference with a different amount: both removed (QA ruled 2026-10-01). Grid lacks Vehicle Number; the export has it. Export writes no audit entry (EAINT-12419 raised and closed same day as not this change's). Compare at 10:00 and 12:00, dev can fire on demand; measured running Saturday and Sunday too. Refund Required Yes e-mail: imonitor@eauto.my → finance@eauto.my "Refund Review Required – [Payment Date]", one per payment date. Manual reconcile covers BMK, HTM, eLKM only (dev 2026-10-01). [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:329-366,412-415]
- Test data: crafted RHB statement on the Synology NAS drop folder plus a dev-fired compare (NAS unreachable evening 2026-10-01); Reset Payment cannot be pressed by any QA account. [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:451-454]

### Conflicts
- Conflict: number of payments. This file step 5: "Pay: one payment for STMS and LKM Refund" `[azfar: eauto-qa-azfar:cr/EAINT-104/LEDGER.md]` vs Charmain: "Two payments are made, the STMS fee first and then the eAuto processing fee for the refund." [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:37-38] (Possibly one Pay click, two RHB payments; unconfirmed.)
- Fee band conflict (this file §Rules, T11 zero vs T52 non-zero): Charmain's pack measured non-zero fees in all four charged bands on 2026-10-01, which supports T52. [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:173-174]
- Tax formula marked `[unconfirmed]` in this file matches the SRD note Charmain quotes (8% of eAuto STMS fee + 8% of processing fee). [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:170-172]
- Conflict (SRD vs build, accepted by QA): Perakuan wording, bank list, five vs three statuses, Download on Attachment Listing, RHB reference shape, one generic refusal message (all above).

### Open questions she raised
- Is the fee table final ("Pending Ops Team to get approval from MOT")? [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:417]
- When do other states and company refunds ship; will a document record the phases? [charmain-repo: test-scenarios/ucd-stms-lkm-refund/ucd-stms-lkm-refund.md:407]
- State permission scope: Table 2.2.2.6.2 item 3 scopes it to below RM30; §2.2.4.1 item 2 extends it to every band (build applies every band). [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:400]
- Should Ops re-generate a frozen bundle after a letter fix? [charmain-repo: test-scenarios/bo-lkm-refund/bo-lkm-refund.md:409]
