# EAINT-9605 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-9605 - STMS-Add New Usage Code & Body Type.md` (exported 28/10/2026, 9:26:47 am; cell text only, "formatting and images are not kept").
2. **Not read:** the `.xlsx` itself, the Jira ticket and any SRD. No `_reference/tickets/EAINT-9605/` or `_reference/tickets/Studying/EAINT-9605/` folder existed before this study.
3. **Knowledge checked:** `knowledge/cr-test-scenario-catalogue.md` (row 104), `knowledge/business-rules-from-test-scenarios.md` §1.3, `knowledge/flow-payments-fees.md` (ticket history), `knowledge/esim.md` (usage code / body type values), `knowledge/flow-apt.md`, `knowledge/environments-history.md`. `lib/ticketStudies.ts` has no EAINT-9605 entry.
4. **Gap in the copy:** rows R1–R2 and R6–R12 are empty. R3 holds only the label "REFERENCE FEE", so the fee reference block was likely an image or formatted table that the export dropped [unconfirmed].

## 1. Header

1. **Ticket:** EAINT-9605.
2. **Module / portal:** UCD Portal — STMS, UCD to UCD, eSTM, APT; Back Office (Manual APT Trigger); eSIM for setup.
3. **Workbook:** "EAINT-9605 - STMS-Add New Usage Code & Body Type.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 07/01/2026, 12:22:46 pm.
4. **Sheets:** one — "EAINT-9605".
5. **Scenarios:** 8 (UCBT_TS1 – UCBT_TS8).
6. **Results:** 8 PASS, 0 FAIL, 0 blank (column "Test Result", R15–R22).
7. **Tester:** one QA engineer, named in the "QA" column on every row.
8. **Dates:** none written in the sheet. Only the SharePoint modified date (07/01/2026) is known.
9. **Environment:** "Testing Environment: staging/sit2" (R4).
10. **Browsers:** "Browser: Firefox V36 / Chrome (WebSocket)" (R5).

## 2. What the ticket changed, as the TS shows it

1. Two **new eSIM / JPJ values** are added and must flow through every UCD payment path:
   1. **Usage Code AD + Body Type SUV** → Vehicle Type **CAR** (R15, R18, R20, R22).
   2. **Usage Code BF + Body Type LCS** → Vehicle Type **COMM_CAR** (R16, R17, R19, R21).
2. The TS checks only that payment completes and the **eAuto fee** shown matches the car rate. It does not check new labels, dropdowns or BO setup screens.
3. The column header calls the setup "Stimulate in e-SIM" for both Usage Code and Body Type (R13), so the new values are injected through eSIM, not chosen by the user.

## 3. Scenarios

### 3a. STMS (UCD)

1. **UCBT_TS1** — Individual - MyKad, Chrome, AD/SUV/CAR. "E2E Flow: STMS + TH", buys TH (Transfer History) at Step 4. Expected: "UCD allows to proceed with payment and complete to purchase successfully." and "Ensure the car fee display as RM 15.00". PASS.

### 3b. UCD to UCD

1. **UCBT_TS2** — Firefox V36, BF/LCS/COMM_CAR. "E2E Flow: UCD to UCD - Standard (Single)". Expected: payment completes; "Ensure the car fee display as RM 15.00". PASS.
2. **UCBT_TS3** — Chrome, BF/LCS/COMM_CAR. "E2E Flow: UCD to UCD - Intersate (Bulk)". Expected: payment completes; "Ensure the car fee display as RM 15.00". PASS.

### 3c. eSTM

1. **UCBT_TS4** — Individual - MyKad, Firefox V36, AD/SUV/CAR. "E2E Flow: eSTM + eLKM + eVOC", buys eLKM at Step 5. Expected: payment completes; "Ensure the car fee display as RM 35.00". PASS.
2. **UCBT_TS5** — Company, Chrome, BF/LCS/COMM_CAR. "E2E Flow: eSTM + eVOC", "Purchase eVOC ONLY in Step 5". Expected: payment completes; "Ensure the car fee display as RM 35.00". PASS.

### 3d. APT

1. **UCBT_TS6** — Individual - MyKad, Firefox V36, AD/SUV/CAR. "Trigger APT Payment - For Individual" via BO Manual APT Trigger 6.0, then pay on UCD APT Transaction Listing. Expected: payment completes; "Ensure the car fee display as RM 15.00". PASS.
2. **UCBT_TS7** — Company, Firefox V36, BF/LCS/COMM_CAR. "Trigger APT Payment - For Company", same path. Expected: same, RM 15.00. PASS.
3. **UCBT_TS8** — Individual - MyPR, Chrome, AD/SUV/CAR. "Trigger APT Cronjob - Individual": BO trigger 6.0, Dev triggers the 6.0 web service, cronjob picks it up. Expected: same, RM 15.00. PASS.

## 4. Business rules and system behaviour

1. **Fee does not change for the new codes.** New CAR and COMM_CAR codes take the normal car fee:
   1. STMS / UCD to UCD: "Ensure the car fee display as RM 15.00" (sheet EAINT-9605, R15, R16, R17).
   2. eSTM: "Ensure the car fee display as RM 35.00" (sheet EAINT-9605, R18, R19).
   3. APT: "Ensure the car fee display as RM 15.00" (sheet EAINT-9605, R20, R21, R22).
2. **COMM_CAR is charged the same as CAR** at that date — BF/LCS rows expect the same "car fee" as AD/SUV rows (R16 vs R15; R19 vs R18; R21 vs R20).
3. **Usage code → vehicle type mapping** as written in the sheet: AD + SUV → "CAR"; BF + LCS → "COMM_CAR" (sheet EAINT-9605, R14 header "Usage Code | Body Type | Vehicle Type", rows R15–R22).
4. **APT needs an approved STMS first:** "Ensure already have STMS approved transaction for Individual" (R20, R22) and "… for Company" (R21).
5. **APT manual path:** "Backoffice > Manual APT Trigger: Trigger manually APT 6.0  from Backoffice" then "UCD > APT Transaction Listing: Proceed with APT transaction on UCD" (R20 steps 3–4).
6. **APT cronjob path needs Dev:** "Share the following details with the Dev: ⏎ - Vehicle number ⏎ - UCD company ID ⏎ - Expiry date for APT 6.0" then "After Dev already manual trigger the web service for 6.0" (R22 steps 4–5).
7. **Cron frequency on sit2:** "(Currently the cronjob run in sit2 for every 10 mins)" (R22 step 6).

### Where this ticket differs from knowledge/

1. **Fees are historic.** `knowledge/flow-payments-fees.md` already marks EAINT-9605 "[legacy, superseded by EAINT-12403]". Current car fee is RM25 for STMS and APT (`business-rules-from-test-scenarios.md` §1.1). The RM15 APT value matches the pre-EAINT-12289 baseline in §1.3.
2. **New eSIM values missing from knowledge.** `knowledge/esim.md` lists Body Type "`MKR`, `MSL`, `VAN`, `MUV`, `PIC`, `13N`". **SUV** and **LCS** are not in that list. AD and BF are listed.
3. **APT trigger order.** `knowledge/flow-apt.md` says "Trigger 5.5, then 6.0" and "6.0 moves it to Pending". This TS only writes "Trigger manually APT 6.0" (R20–R22). Whether 5.5 was pressed first is not written [unconfirmed].
4. **Cron frequency agrees** with staging "Every 10 minutes" recorded from EAINT-8668 (`business-rules-from-test-scenarios.md` line 157).
5. **sit2 use.** `environments-history.md` notes sit2 was later reserved for wholesale (2026-08-20). In Jan 2026 it was used for this STMS CR.

## 5. Test data, environments, accounts, setup

1. **Environment:** staging/sit2 (R4).
2. **Browsers:** Chrome and Firefox V36, split across rows (R15–R22).
3. **eSIM setup per row:** Usage Code AD + Body Type SUV, or Usage Code BF + Body Type LCS (step 1 of every scenario).
4. **Customer categories:** Individual - MyKad, Individual - MyPR, Company. UCD to UCD rows leave Category blank.
5. **Add-ons:** TH at STMS Step 4; eLKM and/or eVOC at eSTM Step 5.
6. **BO:** Manual APT Trigger screen.
7. **Dev dependency:** web service trigger for APT 6.0 (R22).
8. **Credentials:** none in the sheet. No vehicle numbers or IDs recorded.

## 6. Gaps and risks for regression

1. **Only the eAuto fee was checked.** No JPJ fee, 8% service tax, total payable, invoice or e-Invoice line was asserted.
2. **Fee values are out of date.** Any re-run must use current EAINT-12403 values (RM25 STMS/APT car), not RM15.
3. **No display check** of the usage code or body type on Step 4/6, Transaction Details, BO details or exports.
4. **Not every path × code pair covered.** For example: STMS with BF/LCS; UCD to UCD with AD/SUV; eSTM bike; Interstate Single; Standard Bulk; Company STMS; MyPR outside APT.
5. **Commercial car APT JPJ fee by region** (BF follows usage code, not only region, per EAINT-12403 row 48) was not tested here.
6. **No negative case** — an unmapped usage code / body type combination is not tested.
7. **Wholesale STMS / APT** with the new codes is not covered.
8. **Evidence not visible** in the text copy; no run dates per scenario.

## Knowledge candidates

1. **eSIM body types SUV and LCS exist** (added by EAINT-9605). Add to the Body Type list in `knowledge/esim.md`. Source: sheet EAINT-9605, R15 ("AD | SUV | CAR") and R16 ("BF | LCS | COMM_CAR").
2. **Mapping AD + SUV → CAR, BF + LCS → COMM_CAR.** Candidate for `knowledge/esim.md` or `knowledge/flow-payments-fees.md`. Source: sheet EAINT-9605, R14 header and R15–R22.
3. **COMM_CAR charged the same eAuto fee as CAR** (Jan 2026: STMS/APT RM15, eSTM RM35). Candidate for `business-rules-from-test-scenarios.md` §1.3 fee history. Source: sheet EAINT-9605, R16, R19, R21.
4. **APT fee RM15 on 07/01/2026** — confirms the pre-EAINT-12289 APT baseline. Source: sheet EAINT-9605, R20–R22, "Ensure the car fee display as RM 15.00".
5. **APT cronjob test needs Dev to trigger the 6.0 web service**, given vehicle number, UCD company ID and expiry date. Candidate for `knowledge/flow-apt.md` Cronjobs. Source: sheet EAINT-9605, R22 steps 4–5.
6. **sit2 APT cronjob ran every 10 minutes** in Jan 2026. Candidate for `knowledge/environments-history.md`. Source: sheet EAINT-9605, R22 step 6, "(Currently the cronjob run in sit2 for every 10 mins)".
