# EAINT-3210 — QA Team test script study (2026-10-27)

## 1. Header

1. **Ticket:** EAINT-3210.
2. **Module / portal:** STMS (Sistem Tukar Milik Sementara). Data made in the **UCD portal**, export checked in **BackOffice (BO) › STMS Transaction Listing**.
3. **Workbook:** "EAINT-3210 - [eAuto-BO] STMS Transaction Add extra 2 columns in CSV file.xlsx" — SharePoint library "eAuto - CR Test Scenarios", modified 26/06/2026, 12:24:07 pm.
4. **Sheets:** "Test Scenario" (10 data rows, R2–R11) and "Sheet2" (column reference list).
5. **Scenarios:** **5** (3210_TS01 to 3210_TS05). Each is split over 2 rows (UCD part, BO part).
6. **Results:** all 10 rows "Pass". 0 Fail.
7. **Tester:** QA column "Aliah" on every row (a QA engineer on the team).
8. **Dates in the sheet:** none written. Only date seen is the example file name "STMS_202606220939" (22/06/2026 09:39) [unconfirmed: likely the test date].

### Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-3210 - [eAuto-BO] STMS Transaction Add extra 2 columns in CSV file.md` — text copy, cell text only. Formatting, colours and images are not kept.
2. `_reference/tickets/EAINT-3210/` — **did not exist** before this study.
3. `_reference/tickets/Studying/EAINT-3210/` — **does not exist**.
4. `lib/ticketStudies.ts` — **no entry** for EAINT-3210.
5. `knowledge/` grep "3210" — hits in `flow-stms.md` (lines 84, 129, 321, 332, 336), `business-rules-from-test-scenarios.md` (line 149–152), `cr-test-scenario-catalogue.md` (lines 149, 384), `production-regression-scope.md` (line 939).
6. **Not read:** the Jira ticket and its SRD (no copy in the repo; this run is offline from Jira).

## 2. What the ticket changed, as the TS shows it

1. **Two new columns** in the BO STMS export, placed after "TH Payment Date" (col 14) and before "Vehicle":
   1. Col 15 "Last 3 Months Total Ownership Transfer - newly added column" (Test Scenario, R2).
   2. Col 16 "Latest Ownership Transfer Date - newly added column" (Test Scenario, R2).
2. Values come from the **Transfer History (TH)** purchase on the STMS transaction.
3. Export grows from **32 to 34 columns** ("#" counted). Sheet2 R3 holds the old header row without the two columns; Sheet2 R5–R38 holds the new 1–34 list.
4. **Name mismatch:** ticket title says "CSV file"; every expected result says "Excel file". [unconfirmed which format the button gives]

## 3. Scenarios

Every row also checks: file name "STMS_YYYYMMDDHHmm" and the 34-column order.

### A. New transactions (UCD creates, BO exports)

1. **3210_TS01** — TH bought, vehicle **has** ownership transfers. Expected: col 15 "Value displayed under this column should reflect the real result ⏎ e.g: 2 Transfer(s)"; col 16 "e.g: 12 Feb 2026 02:12 pm" (R2–R3). Pass.
2. **3210_TS02** — TH bought, **no transfer** since registration. Expected: col 15 "Value displayed is "No transfer found since registration""; col 16 "Value displayed is "None"" (R4–R5). Pass.
3. **3210_TS03** — "Transfer History JPJ Status = Failed". Expected: col 15 and col 16 both "Value displayed is "None"" (R6–R7). Pass.
4. **3210_TS04** — "No Transfer History purchase" ("DO NOT purchase Transfer History"). Expected: col 15 and col 16 both "None" (R8–R9). Pass.

### B. Old data

5. **3210_TS05** — "Existing transactions" (made before deploy). Expected: col 15 and 16 "Value displayed is as in Details page of the transaction" (R10–R11). Pass.

## 4. Business rules and system behaviour

1. **File name:** "Ensure the file name follows the format: ⏎ STMS_YYYYMMDDHHmm ⏎ e.g: STMS_202606220939" (Test Scenario, R2; same on every row).
2. **Count format:** "e.g: 2 Transfer(s)" (Test Scenario, R2, col 15).
3. **Date format:** "e.g: 12 Feb 2026 02:12 pm" (Test Scenario, R2, col 16).
4. **No transfer:** col 15 "No transfer found since registration", col 16 "None" (Test Scenario, R4).
5. **TH JPJ failed:** both columns "None" (Test Scenario, R6). Note: col 15 is "None" here, **not** "No transfer found since registration".
6. **No TH bought:** both columns "None" (Test Scenario, R8).
7. **Old transactions:** "Value displayed is as in Details page of the transaction" (Test Scenario, R10). So the export reads the same data the Transaction Details page shows [unconfirmed].
8. **Column order 1–34** (Test Scenario, R2; Sheet2 R5–R38): "#", "Company Name", "State", "Company ROC", "Payment ID (eauto)", "Payment ID (JPJ)", "RHB ID (eauto)", "RHB ID (JPJ)", "Payment Date", "TH Payment ID (eauto)", "TH Payment ID (JPJ)", "TH RHB ID (eauto)", "TH RHB ID (JPJ)", "TH Payment Date", "Last 3 Months Total Ownership Transfer", "Latest Ownership Transfer Date", "Vehicle", "Submission Date", "Vehicle Type", "Transaction No", "Seller ID", "Created At", "Cancelled Date", "Cancelled By", "Method", "JPJ Enquiry", "Payment", "JPJ Transfer", "Tx Status", "LHDN Response Status", "TH Payment", "TH JPJ", "TH LHDN Response Status", "Remarks".
9. **Name "Last 3 Months"** vs example "2 Transfer(s)": the sheet never states whether the count is limited to 3 months or covers all history. [unconfirmed]

## 5. Test data, environments, accounts, setup

1. **Accounts:** "Login as UCD" and "Login as BO" (R2, R3). No usernames written. **No credentials present.**
2. **Environment:** not written in the sheet. [unconfirmed: staging]
3. **Data:** new STMS transactions created per scenario; TS03 needs a TH purchase "with failed JPJ Status" (R6) — the sheet does not say how it was forced (eSIM code or other). TS05 uses existing transactions; no transaction numbers listed.
4. **No vehicle numbers, ROCs or transaction numbers** recorded.

## 6. Gaps and risks for regression

1. **Copy-paste in UCD rows:** UCD-side rows (R2, R4, R6, R8) expect "System will initiate the download of Excel file" after purchasing TH. That is a BO export result, not a UCD step result. Regression should treat the BO rows as the real check.
2. **Duplicate rows:** R10 and R11 (TS05) are identical. R7 (TS03) has an empty Description.
3. **No values checked against a source:** TS01 says "should reflect the real result" but names no source (TH PDF / Details page) to compare.
4. **"Last 3 Months" boundary not tested:** no case with a transfer older than 3 months, or exactly at 3 months.
5. **Not covered:** TH payment Failed (as opposed to TH JPJ Failed), cancelled transactions, interstate STMS, UCD to UCD transactions in the same export, an empty search result export, and large exports.
6. **UCD-side export** (if UCD STMS listing has one) not checked.
7. **Later changes:** `knowledge/flow-stms.md` line 84 says "With LKM Refund the export grows to 41 columns" — any regression must use the current column list, not this TS's 34.

### Against existing knowledge

1. `knowledge/flow-stms.md` line 84 says "'None' when no TH". This **matches** TS04 but is **incomplete**: TS02 shows TH bought + no transfer gives "No transfer found since registration" in col 15, and TS03 shows TH JPJ Failed also gives "None".
2. `knowledge/flow-stms.md` line 332 ("Check export with TH bought, no ownership transfer, TH JPJ Failed and no TH") matches TS01–TS04; it omits TS05 (existing transactions).
3. `knowledge/business-rules-from-test-scenarios.md` item 4 (lines 149–152) **matches** this TS.
4. `knowledge/cr-test-scenario-catalogue.md` line 149 records "Test Scenario:5" — correct for scenario count (10 rows).

## Knowledge candidates

1. **flow-stms.md, line 84** — refine the value rule: TH bought + transfers → count "e.g: 2 Transfer(s)" and date "e.g: 12 Feb 2026 02:12 pm"; TH bought + none → "No transfer found since registration" / "None"; TH JPJ Failed → "None" / "None"; no TH → "None" / "None". Source: SharePoint TS EAINT-3210, sheet Test Scenario, rows 2, 4, 6, 8.
2. **flow-stms.md** — old transactions export the same values as their Transaction Details page: "Value displayed is as in Details page of the transaction". Source: sheet Test Scenario, row 10.
3. **flow-stms.md** — the two new columns sit at positions 15–16, between "TH Payment Date" and "Vehicle". Source: sheet Test Scenario, row 2; Sheet2 rows 19–20.
4. **Open lead** [unconfirmed]: export button gives Excel or CSV — TS says "Excel file", title says "CSV file". Verify on staging.
5. **Open lead** [unconfirmed]: whether "Last 3 Months Total Ownership Transfer" counts only the last 3 months. Needs the SRD.
