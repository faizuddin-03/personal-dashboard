# EAINT-9715 — QA Team test script study (2026-10-27)

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9715 - [eAuto][AATF] To enhance AATF Payment Reports module by adding new transaction type.md` (captured 27/10/2026, 9:05:25 pm). Cell text only; formatting and images not kept.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-9715/EAINT-9715-jira.md` (27/10/2026, 5:19:03 pm).
3. **Knowledge:** `knowledge/README.md`, `knowledge/flow-edereg.md` §6, `knowledge/business-rules-from-test-scenarios.md` §9, `knowledge/cr-test-scenario-catalogue.md` row 111, `knowledge/production-regression-scope.md` line 957, `knowledge/flow-company-profile-einvoice.md` lines 219, 253.
4. **lib/ticketStudies.ts:** no entry for EAINT-9715.
5. **Not read:** the SRD (`SRD_EAINT-9715_AATF_Report_V1.0_22012026.docx` / `.pdf`) is a Jira attachment only; no local copy exists. The 5 QA-Issue sub-tasks were not opened; only their titles (from the Jira capture) are used.

## 1. Header

1. **Ticket:** EAINT-9715 — "🔴 [eAuto][AATF] To enhance AATF Payment Reports module by adding new transaction type" (Jira Summary).
2. **Portal / module:** **AATF portal › Reports › AATF Payment Report**.
3. **Workbook:** "EAINT-9715 - [eAuto][AATF] To enhance AATF Payment Reports module by adding new transaction type.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 14/05/2026, 12:33:44 pm.
4. **Sheets:** **Filter** (11 rows, 6 TS ids), **E2E** (9 rows, 4 TS ids), **Progress** (counts).
5. **Scenarios:** **10 TS ids** (Filter 6 + E2E 4), spread over 20 step rows.
6. **Results:** **10 Pass, 0 Failed, 0 N/A**. Progress sheet: "Total Pass | 10", "Total TS | 10", "Pass Percentage | 1" (Progress, R5–R7).
7. **Tester:** QA column reads "Aliah" on every row. Jira: "**QA (cf 10041):** Aliah Maisarah" (Jira capture, line 3).
8. **Dates:** none written in the sheet. Jira: "**ETA for Testing (cf 10057):** 2026-05-12", "**Exp. Deploy Date (cf 10087):** 2026-05-20", fix version "S29.5-20260520" (Jira capture, lines 4, 7). Status "Done".
9. **Note:** `knowledge/cr-test-scenario-catalogue.md` row 111 lists the owner as "Muhammad Faizuddin Bin Bidi". That is likely the SharePoint file owner/modifier, not the tester [unconfirmed].

## 2. What the ticket changed, as the TS shows it

1. **New transaction type options** in the Transaction Type filter: "DEREG - Deregistration" and "eDereg Pre- Checking", marked "* newly added selection options" (Filter, R6).
2. **eDereg Pre-Checking Enquiry payments** now appear in the report, with Transaction Type column "eDereg" (E2E, R4).
3. **Deregistration payments** appear with Transaction Type column "DEREG" (E2E, R6).
4. The report also has a **16-column table**, an **Excel export** with a fixed file name, and **date / status filters** (Filter, R2–R12). Whether those existed before this ticket is not stated in the TS [unconfirmed].

## 3. Scenarios

### A. Filter sheet

1. **9715_F_TS1 (R2)** — Payment Date default on page open. Expected: "Payment Date range will default to the current date."
2. **9715_F_TS1 (R3)** — Pick From = 2 weeks back. Expected: "Payment Date To will default to current date. ⏎ Dates beyond the current date will be disabled and cannot be selected."
3. **9715_F_TS1 (R4)** — Pick From = 2 months back. Expected: "Payment Date will be limited to a maximum period of 30 days."
4. **9715_F_TS2 (R5)** — Transaction Type default. Expected: "The default value should set to option "All""
5. **9715_F_TS2 (R6)** — Transaction Type options. Expected: All, "DEREG - Deregistration", "eDereg Pre- Checking".
6. **9715_F_TS3 (R7–R8)** — Payment Status default "All"; options All, Pending, Approved, Failed.
7. **9715_F_TS4 (R9–R10)** — Transaction Status default "All"; options All, Pending, Approved, Failed.
8. **9715_F_TS5 (R11)** — **Generate Now** shows the table with 16 column headers (listed in §4 item 7).
9. **9715_F_TS6 (R12)** — **Export** downloads Excel named "AATF_Payment_Report_{Date Generated}_{Time Generated}", same 16 headers.

### B. E2E sheet

1. **9715_TS1 (R2)** — No transaction today, all defaults, Generate. Expected: headers shown and "Table will display ‘No records found.’"
2. **9715_TS1 (R3)** — Export with no records. Expected: "Export button will not initiate any download of Excel file as there are no records found."
3. **9715_TS2 (R4)** — New eDereg Pre-Checking Enquiry, filter Type = eDereg Pre-Checking. Expected: new row, Type column "eDereg", vehicle fields " - ".
4. **9715_TS2 (R5)** — Export. Expected: file name format, and file "reflects the new eDereg Pre-Checking Enquiry transaction record same as the report table".
5. **9715_TS3 (R6)** — New Deregistration, filter Type = DEREG - Deregistration. Expected: new row, "The Transaction Type column should display "DEREG""
6. **9715_TS3 (R7)** — Export. Expected: file matches the table.
7. **9715_TS4 (R8)** — From = 2 weeks back, To left default. Expected: To = today, future dates disabled.
8. **9715_TS4 (R9)** — All filters "All", Generate. Expected: count = eDereg Pre-Checking + Deregistration in range; all three Payment and Transaction statuses included.
9. **9715_TS4 (R10)** — Export. Expected: file matches the table.

## 4. Business rules and system behaviour

1. **Date default:** "Payment Date range will default to the current date." (Filter, R2).
2. **No future dates:** "Dates beyond the current date will be disabled and cannot be selected." (Filter, R3).
3. **30-day cap, auto-set To:** "Payment Date will be limited to a maximum period of 30 days. ⏎ ⏎ e.g: Selected Payment Date From = 16 February 2026, the default Payment Date To = 18 March 2026" (Filter, R4). Picking a From more than 30 days back moves To to From + 30 days, not to today.
4. **Filter defaults all "All":** Transaction Type, Payment Status, Transaction Status (Filter, R5, R7, R9).
5. **Transaction Type options:** "- All ⏎ - DEREG - Deregistration ⏎ - eDereg Pre- Checking ⏎ * newly added selection options" (Filter, R6). Source spacing "Pre- Checking" kept.
6. **Status options (both):** "- All ⏎ - Pending ⏎ - Approved ⏎ - Failed" (Filter, R8, R10).
7. **Table / export headers:** "# ⏎ - Payment Date ⏎ - Company Name ⏎ - Transaction Ref ID ⏎ - Transaction Type ⏎ - Vehicle No ⏎ - Transaction Status ⏎ - Engine No ⏎ - Chassis No ⏎ - Vehicle Make ⏎ - Model ⏎ - Manufacturing Year ⏎ - Payment Status ⏎ - Payment Method ⏎ - Payment Amount ⏎ - Payment ID" (Filter, R11 and R12).
8. **Export file name:** "AATF_Payment_Report_{Date Generated}_{Time Generated} ⏎ e.g: AATF_Payment_Report_17042026_10_23_AM" (Filter, R12). Date is DDMMYYYY; time is hh_mm_AM/PM.
9. **No records:** "Table will display ‘No records found.’" (E2E, R2); "Export button will not initiate any download of Excel file as there are no records found." (E2E, R3).
10. **Column label differs from filter label:** filter option "eDereg Pre- Checking", but "The Transaction Type column should display "eDereg"" (E2E, R4). Filter "DEREG - Deregistration" → column "DEREG" (E2E, R6).
11. **Pre-check rows have no vehicle data:** "The following column should display " - " as the information is unrelated to the transaction: ⏎ - Vehicle No ⏎ - Engine No ⏎ - Chassis No ⏎ - Vehicle Make ⏎ - Model ⏎ - Manufacturing Year" (E2E, R4).
12. **"All" = both types, all statuses:** "Number of record displayed are the total number of eDereg Pre-Checking Enquiry + Deregistration transaction made within the date range." and "The records should include Pending + Approved + Failed Payment Status" (E2E, R9).
13. **Export = table:** "The payment report downloaded reflects the record same as the report table generated in the system." (E2E, R10).
14. **Defects found during testing** (Jira sub-task titles, Jira capture line 9):
    1. "EAINT-11247 [AATF] - Able to Export Excel File when "No Records Found"" — breaks rule 9.
    2. "EAINT-11249 [AATF] - Payment Report Listing - Incorrect display for Transaction Type column - UI Issue" — rule 10.
    3. "EAINT-11257 [AATF] Export Excel - Payment Status column displays "Paid"" — export used "Paid" instead of the listed statuses.
    4. "EAINT-11334 [AATF] Export Excel - Incorrect value exported"
    5. "EAINT-11384 [AATF] Missing capitalization letter in dropdown"

## 5. Test data, environments, accounts, setup

1. **Account:** "Login as AATF Account" (Filter, R2). No login id named. **No credentials present** in the sheet.
2. **Environment:** not written in the sheet or Jira capture.
3. **Data created by the tester:** one completed **eDereg Pre-Checking Enquiry** (E2E, R4) and one completed **Deregistration** (E2E, R6), both on the current date.
4. **Precondition for TS1:** "Ensure NO transaction has been made on current date" (E2E, R2) — needs an AATF company with no payments today.
5. **Precondition for TS4:** "Ensure there are transaction made within the selected Payment Date range" (E2E, R8), with Pending, Approved and Failed statuses present (E2E, R9).
6. **How to create the data:** see `knowledge/flow-edereg.md` (pre-check gate and Dereg flow).

## 6. Gaps or risks for regression

1. **Filtered status not tested:** no scenario picks Payment Status or Transaction Status = Pending / Approved / Failed and checks the result. Only "All" is run (E2E, R9).
2. **No Pending or Failed data created:** TS2 and TS3 create only successful transactions; TS4 relies on whatever data already exists [unconfirmed].
3. **30-day cap not exercised end to end:** E2E uses a 2-week range only. The From + 30 auto-set (Filter, R4) is not checked against the table.
4. **Export cell values not checked one by one:** expected result says only "same as the report table". EAINT-11257 ("Paid") and EAINT-11334 show the export is where defects hid. Regression should compare Payment Status and every column cell by cell.
5. **Deregistration vehicle columns not checked:** TS3 checks only the Type column "DEREG"; it does not check that Vehicle No, Engine No, Chassis No, Make, Model, Year are filled.
6. **Company Name:** no filter and no check of the Company Name column value.
7. **Payment Method / Amount / ID:** not checked against the payment.
8. **Wording slip:** E2E R9 says "A table of UCD Payment Report will be generated" on an AATF ticket. Likely copy from the UCD report TS (EAINT-7495) [unconfirmed].
9. **Duplicate TS ids:** "9715_F_TS1" covers R2–R4; Progress counts TS ids (6), not rows (11).
10. **Dropdown capitalisation:** EAINT-11384 says a dropdown label lacked a capital. Exact wording of the fixed labels is in the SRD, not read.

## 7. Knowledge differences

1. `knowledge/flow-edereg.md` §6 and `knowledge/business-rules-from-test-scenarios.md` §9 item 2 already hold the type list, 30-day rule and file name. **No contradiction.**
2. **Missing from knowledge:** the column labels "eDereg" / "DEREG", the " - " vehicle columns on pre-check rows, the From + 30 auto-set, the no-records export rule for AATF, the 16 headers, and the 5 QA-Issue sub-tasks.
3. `knowledge/cr-test-scenario-catalogue.md` row 111 names "Muhammad Faizuddin Bin Bidi"; the sheet and Jira name the QA as Aliah [unconfirmed which the catalogue meant].

## Knowledge candidates

1. **AATF Payment Report column labels:** "The Transaction Type column should display "eDereg"" for eDereg Pre-Checking and "The Transaction Type column should display "DEREG"" for Deregistration. `[from SharePoint TS #111 EAINT-9715, sheet E2E, rows 4, 6]` → `knowledge/flow-edereg.md` §6.
2. **Pre-check rows show " - "** in Vehicle No, Engine No, Chassis No, Vehicle Make, Model, Manufacturing Year. `[from SharePoint TS #111 EAINT-9715, sheet E2E, row 4]` → `knowledge/business-rules-from-test-scenarios.md` §9 item 2.
3. **30-day cap sets To = From + 30 days:** "e.g: Selected Payment Date From = 16 February 2026, the default Payment Date To = 18 March 2026". `[from SharePoint TS #111 EAINT-9715, sheet Filter, row 4]` → same file, §9.
4. **No records → no export download** on the AATF report. `[from SharePoint TS #111 EAINT-9715, sheet E2E, row 3]`; regressed once as EAINT-11247 `[from Jira capture EAINT-9715, sub-tasks]`.
5. **16 table / export headers** (list in §4 item 7). `[from SharePoint TS #111 EAINT-9715, sheet Filter, rows 11-12]`.
6. **QA-Issues raised on EAINT-9715:** EAINT-11247, 11249, 11257, 11334, 11384 — export and Transaction Type column were the weak spots. `[from Jira capture EAINT-9715, line 9, fetched 2026-10-27]` → `knowledge/flow-edereg.md` or a traps file.
7. **QA PIC for EAINT-9715 is Aliah Maisarah**, deployed S29.5-20260520. `[from Jira capture EAINT-9715, lines 3-4]` → correct `knowledge/cr-test-scenario-catalogue.md` row 111 tester column if it is meant to be the tester.
