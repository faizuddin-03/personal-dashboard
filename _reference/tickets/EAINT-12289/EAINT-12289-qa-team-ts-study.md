# EAINT-12289 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study; no other file was changed.

## Sources read

1. **Text copy of the workbook**: `_reference/sharepoint/qa-team-ts/EAINT-12289 - [eAuto-UCD & BackOffice] APT Update eAuto Fee from RM15 to RM20 Effective 15.09.2026.md` (text copy dated "27/10/2026, 6:57:11 pm"; "Cell text only, row by row; formatting and images are not kept."). The Read tool could not open this path (square brackets in the name), so it was read in full through a chunked grep dump. Row numbers below ("R14") are the workbook row numbers from that copy.
2. **Formatting not available**: cell colours (the "Fee affected" / "TS No highlighted" legend) are lost in the text copy. Which rows are highlighted as pre-deploy seeds is taken from the second-QA ledger (item 4), not from the sheet.
3. `knowledge/` grep for EAINT-12289: `teams-decisions-by-ticket.md`, `business-rules-from-test-scenarios.md`, `flow-apt.md`, `flow-payments-fees.md`, `flow-stms.md`, `releases.md`, `people-and-roles.md`, `environments-history.md`, `production-regression-scope.md`, `cr-test-scenario-catalogue.md`, `cr-ledger.md`.
4. `_reference/codebases/eauto-qa-azfar/cr/EAINT-12289/LEDGER.md` and `STATUS.md` (another QA's repo, read-only).
5. **Not found**: `_reference/tickets/EAINT-12289/` had no prior files; `_reference/tickets/Studying/EAINT-12289/` does not exist; `lib/ticketStudies.ts` has no EAINT-12289 entry.
6. **Not read**: the SRD (v1.0, 08.09.2026) is not in the repo; the copy `_reference/codebases/eauto-qa-azfar/cr/EAINT-12289/00-input/EAINT-12289_Test_Scenarios_final.xlsx` and `_reference/sharepoint/eauto-cr-test-scenarios/...xlsx` were not opened (binary).

## 1. Header

1. **Ticket**: EAINT-12289. R1: "Ticket(s): https://mfservices.atlassian.net/browse/EAINT-12289".
2. **Module / portal**: APT, on **UCD** and **BackOffice**; also touches eSTM, Wholesale, cronjob EAINT-8668.
3. **Workbook**: "EAINT-12289 - [eAuto-UCD & BackOffice] APT Update eAuto Fee from RM15 to RM20 Effective 15.09.2026.xlsx", library "eAuto - CR Test Scenarios", modified 15/09/2026, 9:33:31 am.
4. **Sheets**: one — "Sheet1".
5. **SRD**: R5 "SRD: v1.0 (08.09.2026) - baselined  /  Source: EAUTO-1054 / CCB-941". R47: "requirement IDs EAINT-12289-REQ001 to REQ012".
6. **Scenarios**: **22 TS IDs** in **28 rows** (6 IDs split into "Before deploy" / "After deploy" rows).
   1. CR: 16 IDs (E2E1-3, DEP1, PAY1-4, CRN1-3, DSP1-2, INV1-2, RPT1).
   2. Regression: 6 IDs (R1-R6).
7. **Results**: **28 of 28 rows PASS**. No Fail, no blank.
8. **Tester**: the "QA" column is **empty on every row**. Teams records the tester as the eAuto QA on uat4: "[from Teams EAINT-12289, 2026-09-17 11:17, Amirul Azfar]" (`knowledge/people-and-roles.md:22`).
9. **Dates in the sheet**: SRD 08.09.2026; R6 "Production deployment per SRD: 17.09.2026 (Thurs) night." No execution dates recorded.

## 2. What the ticket changed (as the TS shows it)

1. **APT eAuto Service Fee for Car: RM15 → RM20.** R4: "Test objective: To update APT eAuto Service Fee from RM15 to RM20 (vehicle type Car, all usage codes except AA)".
2. **Fee reference** (R4, "Fee reference (SRD 2.2.2)"):
   1. "Car (usage codes AB to DK): eAuto RM15.00 -> RM20.00  /  incl. 8% RM16.20 -> RM21.60"
   2. "Total Semenanjung: JPJ RM100.00 + RM21.60 = RM121.60  (was RM116.20)"
   3. "Total Sabah / Sarawak: JPJ RM40.00 + RM21.60 = RM61.60  (was RM56.20)"
   4. "Usage code AA (Motosikal): NOT affected - remains at existing amount"
   5. "Car already charged at an amount other than RM15: NOT affected"
   6. "UCD Home Page APT tile: RM115 -> RM120 (excl. 8%)"
3. **Payment reset** of failed (and, per the sheet, pending) APT transactions so they are repaid at the new fee. Section header R19: "CR Test Scenarios - Failed & Pending Payment Reset".
4. **Unchanged**: JPJ fee, 8% rate, STMS fee, eSerahan fee, old invoices/e-Invoices.

## 3. Scenarios

### 3a. UCD APT Price Change (R13 header)

1. **12289_E2E1** (AB, Car, Semenanjung, STMS + BO Manual Trigger) — Step 5 fee and real debit. Expected (R14): "eAuto Service Fee = RM20.00", "8% charge = RM1.60", "eAuto Service Fee charged = RM21.60", "JPJ Fee = RM100.00", "Total APT amount = RM121.60"; "Ensure the amount actually debited is RM121.60, not only the amount displayed." PASS.
2. **12289_E2E2** (AC, Car, Sabah / Sarawak) — failed payment in eSIM, then OK. Expected (R15): "Total APT amount = RM61.60"; "Ensure the amount debited is RM61.60 once payment succeeds". PASS.
3. **12289_E2E3** (AD, Sabah / Sarawak, eSTM - VEL000392E) — APT reached via eSTM. Expected (R16): "Ensure the vehicle appears in the APT Transaction Listing after hitting VEL000392E." and "Ensure the entry point does not affect the fee - the amount must match 12289_E2E2." PASS.
4. **12289_DEP1** (AB, Semenanjung; R17 before, R18 after) — STMS approved before deploy, APT triggered after. Expected (R18): "Total APT amount = RM121.60", "Amount actually debited = RM121.60". PASS. Remark R17: "APT1000 ⏎ (Ref No: S694493769)".

### 3b. Failed & Pending Payment Reset (R19 header)

1. **12289_PAY1** (AB, Semenanjung; R20/R21) — Failed at RM16.20 before deploy, Dev reset, repaid. Expected (R21): "Payment = -", "Tx Status = Pending", "UCD able to make payment again", "Amount actually debited = RM121.60". PASS.
2. **12289_PAY2** (AB, Sabah / Sarawak; R22/R23) — Pending, unpaid, via eSTM VEL000392E before deploy. Expected (R23): "Ensure the Pending transaction is reset and charged the revised fee", "Total APT amount = RM61.60". PASS.
3. **12289_PAY3** (AA Motosikal; R24/R25) — included in reset, not repriced. Expected (R25): "Ensure the AA transaction IS included in the reset but remains at its existing fee", "eAuto Service Fee unchanged - NOT RM21.60". PASS.
4. **12289_PAY4** (IA Kenderaan Orang Cacat, BO [Reset]) — BO reset button. Expected (R26): "[Reset] available in the Action column alongside [View] and [Cancel] for a Failed transaction"; "After reset: Payment = - and Tx Status = Pending". PASS.

### 3c. Cronjob — Resubmit Failed APT, EAINT-8668 (R27 header)

1. **12289_CRN1** (AI Sekolah Memandu Motokar) — cronjob resubmits a Failed payment. Expected (R28): "Amount actually debited = RM121.60"; "Ensure the next cronjob run does NOT resubmit the same transaction again - only one payment recorded and no second debit."; "Ensure transaction is displayed in RHB Payment Transaction listing on Backoffice." PASS.
2. **12289_CRN2** (BF BRG-Rigid Decon 950-5000KG) — cronjob pays a Pending, never-paid transaction. Expected (R29): "Amount actually debited = RM121.60". PASS.
3. **12289_CRN3** (AB, Sabah / Sarawak; R30/R31) — reset transaction swept by the cronjob. Expected (R31): "Amount actually debited = RM61.60"; "Ensure the region only affects the JPJ Fee". PASS.

### 3d. Display

1. **12289_DSP1** (UCD Home Page) — APT tile. Expected (R32): "APT tile displays RM120 (previously RM115)". PASS.
2. **12289_DSP2** (BJ, Step 6 & details pages) — no price shown. Expected (R33): "Ensure no APT pricing is displayed on any of the three pages". PASS.

### 3e. Invoice, e-Invoice and Reports (R34 header)

1. **12289_INV1** (DK Kereta Sewa Pandu (Kerajaan)) — invoice after deploy. Expected (R35): "Total = RM121.60", "LHDN Response Status = OK". PASS.
2. **12289_INV2** (AB, Sabah / Sarawak; R36/R37) — pre-deploy documents unchanged. Expected (R37): "eAuto Service Fee charged = RM16.20", "Total APT amount = RM56.20", "Identical to the copies saved before the uat4 deploy". PASS.
3. **12289_RPT1** (AA - DK, all) — reports mix old and new fee. Expected (R38): "Transaction approved after the deploy = RM21.60", "Transaction approved before the deploy = RM16.20, unchanged"; "Ensure the reconciliation totals tie to the individual transaction amounts." PASS.

### 3f. Regression (R39 header)

1. **12289_R1** (AA Motosikal, manual trigger) — AA fee unchanged. Expected (R40): "Fee did NOT move to RM20.00". PASS.
2. **12289_R2** (AB, Wholesale) — APT value inside seller booking fee. Expected (R41): "APT amount included = RM121.60", "Payment = Complete", "BO reflects the same APT price as UCD". PASS.
3. **12289_R3** (AB, APT 6.0 auto + cronjob) — no UCD action. Expected (R42): "Cronjob submits the APT until Tx Status = Approved", "Amount actually debited = RM121.60". PASS, Remarks: "As advised by dev can deprio this scenario".
4. **12289_R4** (STMS module) — STMS fee unchanged. Expected (R43): "Fee did NOT move to RM20.00". PASS.
5. **12289_R5** (eSerahan module) — eSerahan fee unchanged. Expected (R44): "Fee did NOT move to RM20.00". PASS.
6. **12289_R6** (AA, APT 6.0 auto + cronjob) — AA not repriced on auto path. Expected (R45): "Amount debited is NOT RM21.60". PASS.

## 4. Business rules and system behaviour

1. **Fee read at APT payment time, not at STMS time.** Sheet1 R18: "The STMS pre-dates the deploy, so this confirms the fee is read at APT payment time and not carried from the STMS transaction."
2. **Region changes only the JPJ fee.** Sheet1 R31: "Ensure the region only affects the JPJ Fee - the eAuto Service Fee charged is RM21.60 the same as the Semenanjung cronjob cases (12289_CRN1 / CRN2)."
3. **Entry point does not change the fee.** Sheet1 R16: "Ensure the entry point does not affect the fee - the amount must match 12289_E2E2."
4. **Reset scope in this CR.** Sheet1 R23: "All transactions except completed ones are reset and use the revised fee. Dev will apply the reset on uat4."
5. **AA is reset but not repriced.** Sheet1 R25: "Per REQ005 no failed payment transaction is excluded from the reset on the basis of its vehicle type, but per REQ008 usage code AA is excluded from the price increase."
6. **Reset state.** Sheet1 R21 / R26: after reset "Payment = -" and "Tx Status = Pending", "UCD able to make payment again".
7. **Reset feeds the cronjob.** Sheet1 R31: "A reset transaction sits at Payment = - and Tx Status = Pending, which matches the second cronjob criterion in EAINT-8668 (Payment = -, Tx Status = Pending). The cronjob therefore sweeps the reset population on its next run and pays automatically at the revised fee, with no UCD action required."
8. **Cronjob criteria (EAINT-8668).** Sheet1 R47: "Cronjob resubmit criteria per EAINT-8668: Payment = Failed & Tx Status = Failed, or Payment = - & Tx Status = Pending, with RHB Status = Active, Company Status = Activated and eSTM Enquiry = VEL000392E."
9. **BO reset location.** Sheet1 R47: "BO reset via APT Transaction Enquiry > Action column > [Reset]."
10. **No double debit from cronjob.** Sheet1 R28: "Ensure the next cronjob run does NOT resubmit the same transaction again - only one payment recorded and no second debit."
11. **APT creation sequence.** Sheet1 R14: "BO > Manual trigger APT for JPJ Notice 5.5, APT Transaction is auto-created with Transaction Status = New" then "Manual trigger APT for JPJ Notice 6.0, APT Transaction is auto-created with Transaction Status = Pending".
12. **Tile is excl. 8%.** Sheet1 R32: "RM120 = JPJ RM100.00 + eAuto Service Fee RM20.00, excluding the 8% charge".
13. **No pricing on Step 6 / details.** Sheet1 R33: "Per SRD 2.1.2 these pages are out of scope because they do not display the APT pricing."
14. **Old documents keep old fee.** Sheet1 R37: "Per REQ011, Invoice and e-Invoice for transactions approved before the deploy remain unchanged."
15. **Wholesale = STMS for APT.** Sheet1 R41: "Wholesale counts as STMS for APT purposes, so the amount must match 12289_E2E1."
16. **Fee applies to APT only.** Sheet1 R43: "Per Assumption 1 the fee change applies to APT transactions only."
17. **JPJ fee and 8% fixed.** Sheet1 R40: "Ensure the JPJ Fee is unchanged on every price verification in this sheet - Semenanjung RM100.00 and Sabah / Sarawak RM40.00 (Assumption 4), and the 8% charge rate itself is still 8% (Assumption 3)."
18. **Seed data before deploy.** Sheet1 R8: "Test data MUST be created BEFORE Dev deploys to uat4 - cannot be reproduced after".

### Where this agrees with or contradicts knowledge/

1. **Contradiction — reset scope.** Sheet1 R23 says "All transactions except completed ones are reset". Teams says Failed/Failed only: "Transaction Status and Payment both Failed" (`knowledge/teams-decisions-by-ticket.md:211`, Teams 2026-09-10 14:16). `knowledge/flow-apt.md:208` says "12289: all Failed". [unconfirmed] PAY2's Pending transaction was already at "Payment = -" / "Tx Status = Pending" before the reset, so its pass does not prove a Pending reset happened; it proves pricing at payment time.
2. **Contradiction — STMS baseline.** Sheet1 R43: "STMS is charged at the same RM15 value being updated for APT". The second-QA ledger corrects this: "By 12289 the STMS Car fee was already **RM20** — EAINT-10175 raised it from RM15 on 31.03.2026." (`_reference/codebases/eauto-qa-azfar/cr/EAINT-12289/LEDGER.md`, "Correction found later"). `knowledge/flow-payments-fees.md:179` agrees with RM20.
3. **Doubt — CRN2 BF expected amount.** Sheet1 R29 expects "Amount actually debited = RM121.60" for BF and records PASS. `knowledge/flow-payments-fees.md:182`: "EAINT-12289 expected RM121.60 for a BF row that should be RM67.00" (source tag "azfar: cr/EAINT-12403/LEDGER.md"). [unconfirmed] which figure the system actually charged.
4. **Agrees**: `knowledge/flow-apt.md:157` (reset feeds the cronjob, CRN3), `flow-apt.md:192` (BO Reset in Action column, PAY4), `business-rules-from-test-scenarios.md` §1.2 items 1-8.
5. **Not in the TS**: `knowledge/flow-apt.md:154` "Screen and actual debit can disagree (found in EAINT-12289)" and `flow-apt.md:161` "Auto-pay was left off on QA staging in EAINT-12289". Neither appears in the sheet; source is the other QA's repo.
6. **Superseded**: all RM20 amounts are now RM25 per EAINT-12403 (`knowledge/flow-apt.md:117`: "APT Car today: eAuto RM25 + 8% RM2 = RM27, with JPJ RM100 = RM127.00").

## 5. Test data, environment, setup

1. **Environment**: R3 "Test environment: uat4/". R6: "Deploy to uat4 to be scheduled by Dev - currently on hold pending test data preparation."
2. **eSIM switches used**: "In eSIM, set Payment = Failed" / "set Payment = OK" (R15, R20, R28); "set Vehicle Number prefix to hit VEL000392E in ESTM Enquiry Resp" (R16, R22, R28); "set STMS response code as 4Z" (R41, Wholesale).
3. **BO tools**: Manual trigger APT for JPJ Notice 5.5 / 6.0; APT Transaction Enquiry (Export CSV, Reset); RHB Payment Transaction listing; reconciliation summary reports.
4. **Usage codes covered**: AA, AB, AC, AD, AI, BF, BJ, DK, IA.
5. **Recorded transactions (Remarks column)**:
   1. DEP1: "APT1000 ⏎ (Ref No: S694493769)"
   2. PAY1: "APT1001 ⏎ (Ref No: A69347760)"
   3. PAY2: "APT1002 ⏎ (Ref No: A69347761)"
   4. PAY3: "JPAPT001 ⏎ (Ref No: A69347763)"
   5. CRN1: "AIPP0001 ⏎ A69347780"
   6. CRN2: "AIPP0002 ⏎ A69347781"
   7. CRN3: "APT1003 ⏎ A69347764"
   8. INV2: "ID - 1010012 ⏎ VN - APT2001 ⏎ (Ref No: A69347769)"
6. **Credentials**: none in the sheet. No logins or company names recorded.
7. **Reset executor**: Dev on uat4 ("Dev will apply the reset on uat4", R21). Prod reset by API under an admin account (`knowledge/teams-decisions-by-ticket.md:212`).

## 6. Gaps and risks for regression

1. **Reset scope not proven for Pending.** No scenario creates a Pending row that the reset itself changes. Reset scope also conflicts with Teams (section 4, item 1).
2. **"Car charged other than RM15" untested.** R4 says "NOT affected", but no TS covers it. Ledger: "REQ002 criterion 3 (Car priced other than RM15) — nobody could confirm such a vehicle exists."
3. **Payment OK / Tx Failed** not covered. Ledger settled 2026-09-25: "not covered, not picked up by the cronjob".
4. **Negative reset cases** absent: no check that Approved rows lack [Reset] (EAINT-12403 added NEG cases).
5. **R3 deprioritised but marked PASS.** R42 Remarks: "As advised by dev can deprio this scenario". [unconfirmed] whether it was actually run.
6. **CRN2 BF amount** disputed (section 4, item 3).
7. **No evidence of tester or dates** in the sheet; QA column blank.
8. **Notifications** showing the fee not checked (ledger open question 3).
9. **RHB inactive companies** not covered for reset or cronjob; `knowledge/flow-apt.md:154` says screen and debit can disagree.
10. **Reset before rate push** ordering risk not tested (`knowledge/flow-apt.md:211`: "Rate update first, reset after.").

## Knowledge candidates

1. **Fee read at APT payment time.** "The STMS pre-dates the deploy, so this confirms the fee is read at APT payment time and not carried from the STMS transaction." `[from SharePoint TS EAINT-12289, Sheet1, row 18]` — for `knowledge/flow-apt.md`. Already partly in `business-rules-from-test-scenarios.md` §1.2 item 1.
2. **Cronjob no-double-debit check.** "Ensure the next cronjob run does NOT resubmit the same transaction again - only one payment recorded and no second debit." `[from SharePoint TS EAINT-12289, Sheet1, row 28]` — for `flow-apt.md` cronjob QA scope.
3. **APT statuses after JPJ notices.** Notice 5.5 → "Transaction Status = New"; notice 6.0 → "Transaction Status = Pending". `[from SharePoint TS EAINT-12289, Sheet1, row 14]` — for `flow-apt.md` BO Manual APT Trigger entry point.
4. **Region affects JPJ fee only.** `[from SharePoint TS EAINT-12289, Sheet1, row 31]` — for `flow-payments-fees.md`.
5. **Pre-deploy APT Sabah / Sarawak total RM56.20; Semenanjung RM116.20.** `[from SharePoint TS EAINT-12289, Sheet1, row 4]` — fee history in `flow-payments-fees.md:179`.
6. **Flag reset-scope conflict.** TS R23 "All transactions except completed ones" vs Teams 2026-09-10 14:16 "Transaction Status and Payment both Failed". Add as a conflict line in `flow-apt.md` §BO Reset Payment.
7. **Flag the STMS baseline error** in TS R43 ("same RM15 value") against EAINT-10175 RM20 — for `business-rules-from-test-scenarios.md` §1.3.
8. **Result summary** for `cr-test-scenario-catalogue.md` #039: 22 TS IDs, 28 rows, all PASS, QA column blank, R3 "As advised by dev can deprio this scenario".
9. **Ticket study entry** for `lib/ticketStudies.ts`: none exists for EAINT-12289.
