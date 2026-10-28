# EAINT-7495 — QA Team test script study (2026-10-27)

Written unattended by the SharePoint Scribe. Read only; no other file was changed.

## Sources read

1. **Text copy (task path)**: `_reference/sharepoint/qa-team-ts/EAINT-7495 - [eAuto-UCD] UCD Payment Report TH, BMK. eLKM, eVOC, SSM, JomCheck.md` (text copy dated "27/10/2026, 9:03:42 pm"). The Read tool could not open it (path with `[ ]`); it was read through Grep. Long rows were cut by the tool, so full row text came from item 2.
2. **Full row text**: `_reference/inbox/eauto-flows-run/ts-text/EAINT-7495_-_eAuto-UCD_UCD_Payment_Report_TH_BMK._eLKM_eVOC_SSM_JomCheck.xlsx.txt`. Every row that both copies show matches. Row numbers below (R1 = header) come from item 1.
3. **Azfar's CR ledger**: `_reference/codebases/eauto-qa-azfar/cr/EAINT-7495/LEDGER.md` (written 2026-10-01, "Studied as prior art for EAINT-12022, not tested here").
4. **knowledge/**: `business-rules-from-test-scenarios.md` §9, `flow-company-profile-einvoice.md` ("Flow: UCD payment reports and downloads"), `production-regression-scope.md` item 10c and the deployment table, `flow-ssm.md` line 65, `cr-test-scenario-catalogue.md` row 054.
5. **Not found**: `_reference/tickets/EAINT-7495/` (did not exist before this file), `_reference/tickets/Studying/EAINT-7495/`, and any EAINT-7495 entry in `lib/ticketStudies.ts`.
6. **Not read**: the SRD and the Jira ticket (no local copy; no network access in this run). The `.xlsx` itself was not opened, so cell colours, comments and images are unknown.

## 1. Header

1. **Ticket**: EAINT-7495 — "[eAuto-UCD] UCD Payment Report TH, BMK. eLKM, eVOC, SSM, JomCheck".
2. **Portal / module**: **UCD portal → Reports → UCD Payment Report**. This comes from steps "2. Navigate to Reports 3. Click on the UCD Payment Report menu" (sheet Filter, R2).
3. **Workbook**: "EAINT-7495 - [eAuto-UCD] UCD Payment Report TH, BMK. eLKM, eVOC, SSM, JomCheck.xlsx". SharePoint library: "eAuto - CR Test Scenarios". Modified 15/05/2026, 5:55:07 pm.
4. **Sheets**: **Filter**, **E2E**, **Progress**, **E2E (2)**.
5. **Scenarios**: **19 TS**. Filter has 7 (7495_F_TS01 to F_TS07, 13 rows). E2E has 12 (7495_TS1 to TS12, 25 rows). E2E (2) has 18 rows with **no TS ids, no QA and no result**.
6. **Results**: **19 Pass, 0 Failed**. Progress sheet: "Total Pass | 19", "Total TS | 19", "Pass Percentage | 1" (R5–R7). Filter: "Pass | 7" (R5). E2E: "Pass | 12" (R14).
7. **Testers** (QA column): **Aliah** for all Filter rows and E2E TS1–TS10. **Faiz** for E2E TS11–TS12 (E2E R22–R26).
8. **Dates**: none written in the sheet. Other sources give these dates:
   1. Deployment "S29.5-20260520 (live 20.05.2026)" (azfar LEDGER, "Live" row).
   2. "EAINT-7495 | 20260520 | UCD Payment Report | Yes" (`production-regression-scope.md` line 956).
9. **Environment**: not written in the sheet. The azfar LEDGER says "Environment | staging" [unconfirmed which staging instance].

## 2. What the ticket changed, as the TS shows it

1. **Six new Transaction Type options** were added to the UCD Payment Report filter. The list is "- All - STMS - APT - eSTM - Transfer History - BMK - eLKM - eVOC - SSM - JomCheck * newly added selection options" (Filter, R8). Going by the ticket title, the new ones are **TH (Transfer History), BMK, eLKM, eVOC, SSM, JomCheck** [unconfirmed: the sheet does not say which options were already there; the marking was likely a colour that the text copy lost].
2. **Add-on purchases appear as their own rows**:
   1. Transfer History and SSM bought inside an STMS transaction get their own rows, typed "Transfer History" and "SSM" (E2E R6, R8).
   2. eLKM and eVOC bought inside an eSTM transaction get their own rows, typed "eLKM" and "eVOC" (E2E R14, R16).
3. **BMK and JomCheck** transactions are now in the report (E2E R18, R20, R22).
4. The **filters, table columns and Export** are tested from scratch on sheet Filter. It is not stated which of them existed before [unconfirmed].

## 3. Scenarios

### A. Filter sheet (7 TS)

1. **7495_F_TS01 Payment Date (R2–R4)**:
   1. Default: "Payment Date range will default to the current date."
   2. Start date 2 weeks back: "Dates beyond the current date will be disabled and cannot be selected."
   3. Start date 2 months back: "Payment Date end range will be limited to a maximum period of 30 days."
2. **7495_F_TS02 Company Name (R5–R6)**: default "All"; the dropdown shows "a list of Company Name available".
3. **7495_F_TS03 Transaction Type (R7–R8)**: default "All". There are 10 options (see section 2, item 1).
4. **7495_F_TS04 Payment Status (R9–R10)**: default "All"; options "All - Pending - Approved - Failed".
5. **7495_F_TS05 Transaction Status (R11–R12)**: default "All"; options "All - Pending - Approved - Failed".
6. **7495_F_TS06 Generate Now (R13)**: a table shows the 16 columns listed in section 4, item 4.
7. **7495_F_TS07 Export (R14)**: an Excel file downloads, named "Payment_Report_{Date Generated}_{Time Generated}", with the same 16 column headers.

### B. E2E sheet (12 TS)

1. **7495_TS1 No transaction today (R2–R3)**: the table shows "‘No record found. Try again.’". Export "will not initiate any download of Excel file as there are no records found."
2. **7495_TS2 STMS with SSM + Transfer History, type STMS (R4–R5)**: the row shows "The Transaction Type column should display "STMS"". The export matches the table.
3. **7495_TS3 same transaction, type Transfer History (R6–R7)**: the row shows "Transfer History". The export matches.
4. **7495_TS4 same transaction, type SSM (R8–R9)**: the row shows "SSM". Engine No, Chassis No, Vehicle Make, Model and Manufacturing Year show " - ". The export matches.
5. **7495_TS5 APT (R10–R11)**: the row shows "APT". The export matches.
6. **7495_TS6 eSTM (MyKad) with eLKM + eVOC, type eSTM (R12–R13)**: the row shows "eSTM". Vehicle Make, Model and Manufacturing Year show "-". The export matches.
7. **7495_TS7 same transaction, type eLKM (R14–R15)**: the row shows "eLKM", with Make, Model and Year "-". The export matches.
8. **7495_TS8 same transaction, type eVOC (R16–R17)**: the row shows "eVOC", with Make, Model and Year "-". The export matches.
9. **7495_TS9 BMK (R18–R19)**: the row shows "BMK". Engine No, Chassis No, Make, Model and Year show "-". The export matches.
10. **7495_TS10 JomCheck by Vehicle No (R20–R21)**: the row shows "JomCheck". The export matches.
11. **7495_TS11 JomCheck by Chassis No (R22–R23)**: the row shows "JomCheck". The export matches. Tester: Faiz.
12. **7495_TS12 Two-week range, all filters "All" (R24–R26)**: the record count is "the total number of STMS + APT + eSTM + Transfer History + BMK + eLKM + eVOC + SSM + JomCheck transaction made within the date range". It must include all three Payment Statuses and all three Transaction Statuses. The export matches. Tester: Faiz.

### C. E2E (2) sheet (18 untracked rows)

1. **R2–R4**: the same as E2E TS1 (no transaction today).
2. **R5–R7**: the same as E2E TS12 (two-week range, all types).
3. **R8–R10**: two-week range, Transaction Type = STMS. "Number of record displayed are the total number of STMS transaction made within the date range."
4. **R11–R13, R14–R16, R17–R19**: STMS with Payment Status = **Pending / Approved / Failed**. Each expects "Number of record displayed are the total number of STMS transaction where Payment Status = …".
5. These rows have no TS id and no result, and are **not counted** on the Progress sheet. They look like a draft or an extra set that was never run [unconfirmed].

## 4. Business rules and system behaviour

1. **Default date**: "Payment Date range will default to the current date." (Filter, R2)
2. **No future dates**: "Dates beyond the current date will be disabled and cannot be selected." (Filter, R3)
3. **30-day maximum**: "Payment Date end range will be limited to a maximum period of 30 days. e.g: Selected Payment Date start range = 16 February 2026, the default end range = 18 March 2026" (Filter, R4). The end date **moves to start + 30 days by itself**; it is not an error message.
4. **Table columns** (Filter, R13; Export headers are the same, R14): "- # - Payment Date - Company Name - Transaction Ref ID - Transaction Type - Vehicle No - Transaction Status - Engine No - Chassis No - Vehicle Make - Model - Manufacturing Year - Payment Status - Payment Method - Payment Amount - Payment ID".
5. **Export file name**: "Payment_Report_{Date Generated}_{Time Generated} e.g: Payment_Report_16042026_10_23_AM" (Filter, R14).
6. **Empty result**: "Table will display ‘No record found. Try again.’" (E2E, R2). Export then downloads nothing (E2E, R3).
7. **Fields that do not apply show a dash, by type**:
   1. **SSM**: "The following column should display " - " as the information is unrelated to the transaction: - Engine No - Chassis No - Vehicle Make - Model - Manufacturing Year" (E2E, R8).
   2. **eSTM / eLKM / eVOC**: "The following column should display "-" as the information is unrelated to the transaction - Vehicle Make - Model - Manufacturing Year" (E2E, R12, R14, R16). Engine No and Chassis No are therefore filled for these types [unconfirmed].
   3. **BMK**: "- Engine No - Chassis No - Vehicle Make - Model - Manufacturing Year" show "-" (E2E, R18).
   4. **Transfer History, APT, STMS, JomCheck**: the TS lists no dash columns (E2E R4, R6, R10, R20, R22) [unconfirmed whether all their columns are filled].
8. **One purchase, many rows**: one STMS transaction with "purchase Transfer History & SSM Document" (E2E, R4) shows up under the STMS, Transfer History and SSM filters (R4, R6, R8). One eSTM transaction "for MyKad, purchase eLKM & eVOC" (E2E, R12) shows up under eSTM, eLKM and eVOC (R12, R14, R16).
9. **"All" means every type and every status**: "3. The records should include Pending + Approved + Failed Payment Status 4. The records should include Pending + Approved + Failed Transaction Status" (E2E, R25).
10. **Account permission**: TS1 needs a "UCD account that has permission to purchase SSM Document" (E2E, R2). SSM purchase is therefore a per-account permission [unconfirmed beyond this line].

## 5. Test data, environments, accounts

1. **Account**: a UCD account ("Login as UCD Account", Filter R2). For SSM it needs "permission to purchase SSM Document" (E2E R2). The sheet gives no login names and **no credentials**.
2. **Data the testers created on the day**:
   1. One STMS for Company with Transfer History and SSM (E2E R4).
   2. One APT (R10).
   3. One eSTM for MyKad with eLKM and eVOC (R12).
   4. One BMK (R18).
   5. One JomCheck by Vehicle No (R20) and one by Chassis No (R22).
3. **Example dates** in the sheet: current date "16 April 2026", start "1 April 2026" (E2E R24). These suggest testing around mid-April 2026 [unconfirmed].
4. **Environment**: not in the sheet. Staging per the azfar LEDGER [unconfirmed instance].
5. **Production check**: "Note: UCD Test will display 0 records as no payment transactions" (Deployment Checklist 20260520 R44, quoted in `production-regression-scope.md` line 436).

## 6. Gaps and risks for regression

1. **Transaction Status filter** is only checked for its options (Filter R12). No E2E row filters by Pending, Approved or Failed Transaction Status.
2. **Payment Status filter**: only the untracked E2E (2) rows filter by it, and only for STMS (R11–R19). Nothing filters it for the six new types.
3. **Company Name filter**: only the default and the list are checked (Filter R5–R6). No row checks a single company, or a sub-user's company scope.
4. **30-day limit** is checked only as the end date moving by itself (Filter R4). Nothing checks trying to type or pick an end date past 30 days.
5. **Values in columns** are only checked as "same as the report table". Payment Method, Payment Amount and Payment ID are never checked against the transaction details page.
6. **No Pending or Failed data** was made for the new types. All E2E transactions were completed "successfully".
7. **TS12 count rule** (sum of 9 types) counts add-on rows separately. A regression should confirm one STMS with SSM + TH counts as **3 rows** [unconfirmed].
8. **Later changes not in this TS**: "LKM Refund rows were added by 104 (bugs 12400 / 12402 Done)" (azfar LEDGER, "Live" row). Regression should include **eLKM refund rows** [unconfirmed: what "104" means is not explained].
9. **Wording inconsistencies in the sheet**:
   1. The button is called "Generate Now" (Filter R13, E2E R2) and "Generate" (E2E R10).
   2. The dash is " - " (R8) and "-" (R12).
   3. F_TS01 repeats its id across 3 rows.
10. **Contradiction check with knowledge/**: no conflicts found.
    1. `business-rules-from-test-scenarios.md` §9 item 1 matches. Its citations "sheet E2E, row 3" and "row 8" are correct.
    2. `flow-company-profile-einvoice.md` line 240 calls the Payment Report limit "max 30 days" and the Breakdown limit "max 1 month". This TS confirms the 30-day wording.

## Knowledge candidates

1. **Dash columns differ by transaction type** (eSTM/eLKM/eVOC: Make, Model, Year only; BMK and SSM: Engine, Chassis, Make, Model, Year). Source: sheet E2E, R8, R12, R14, R16, R18. Target: `business-rules-from-test-scenarios.md` §9 item 1.5, which today lists SSM only.
2. **Empty-table text**: "‘No record found. Try again.’". Source: sheet E2E, R2. Target: same section, and the UCD reports flow in `flow-company-profile-einvoice.md`.
3. **Full 16-column list** for the UCD Payment Report table and export. Source: sheet Filter, R13–R14. Target: `flow-company-profile-einvoice.md` entry point "UCD › Reports › UCD Payment Report".
4. **Add-on purchases are separate report rows** (STMS → Transfer History and SSM rows; eSTM → eLKM and eVOC rows). Source: sheet E2E, R4–R8, R12–R16. Target: `flow-company-profile-einvoice.md` Rules, and `flow-ssm.md` line 65.
5. **30-day limit moves the end date by itself**: "e.g: Selected Payment Date start range = 16 February 2026, the default end range = 18 March 2026". Source: sheet Filter, R4.
6. **Sheet E2E (2) is untracked**: 18 extra rows (Payment Status by STMS) with no ids or results. Source: sheet E2E (2), R2–R19; Progress R2–R7. Target: `cr-test-scenario-catalogue.md` row 054 note.
7. **Testers per TS**: Aliah for Filter and E2E TS1–TS10; Faiz for E2E TS11–TS12. Source: QA column, sheets Filter and E2E. Useful for appraisal and timesheet history [unconfirmed whether worth storing].
