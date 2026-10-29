# EAINT-3090 — QA Team test script study (2026-10-27)

Written unattended by the SharePoint Scribe. Read only; no knowledge/ or code file was changed.

## Sources read

1. **Workbook text copy (asked for):** `_reference/sharepoint/qa-team-ts/EAINT-3090 - Payment Breakdown Reports BMK, TH, eLKM and eVOC.md` (header "text copy (27/10/2026, 9:09:23 pm)"). The Read tool failed on this path. Short rows were read through Grep; long rows came back as "[Omitted long matching line]".
2. **Same workbook, full text:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-3090_-_Payment_Breakdown_Reports_BMK_TH_eLKM_and_eVOC.xlsx.txt`. All long rows were taken from this file. Every short row that Grep could show matched it. **Row numbers below use the R-numbers of the SharePoint text copy.** Map for the TS sheet: R-number = inbox line − 3.
3. **Azfar repo ledger:** `_reference/codebases/eauto-qa-azfar/cr/EAINT-3090/LEDGER.md` (written 2026-10-01, "Studied as prior art for EAINT-12022, not tested here").
4. **knowledge/:** grep for EAINT-3090 in `cr-test-scenario-catalogue.md`, `business-rules-from-test-scenarios.md`, `flow-bmk.md`, `flow-ssm.md`, `flow-stms.md`, `flow-company-profile-einvoice.md`, `releases.md`, `production-regression-scope.md`.
5. **Not found:** no `_reference/tickets/EAINT-3090/` folder before this study. No `_reference/tickets/Studying/EAINT-3090/`. No EAINT-3090 entry in `lib/ticketStudies.ts`.
6. **Not read:** the SRD and the Jira ticket (not fetched in this unattended run). The Google Sheet linked at Sheet1 R5 is external and was not opened. **Cell colours are not in the text copy.** Sheet1 R3 says "columns in RED will be removed", so the red columns cannot be identified.

## 1. Header

1. **Ticket:** EAINT-3090. Title in `knowledge/releases.md` row 2026-05-06: "EAINT-3090 [eAuto-UCD] Payment Breakdown Reports BMK/TH/eLKM/eVOC".
2. **Portal / module:** UCD, "Report > Payment Breakdown Report" (EAINT-3090 Test Scenarios, R3). The sheet does not name the portal. UCD comes from the ticket title.
3. **Workbook:** "EAINT-3090 - Payment Breakdown Reports BMK, TH, eLKM and eVOC.xlsx". SharePoint library "eAuto - CR Test Scenarios", modified 06/05/2026, 4:03:14 pm.
4. **Sheets:** "EAINT-3090 Test Scenarios" (the scenarios) and "Sheet1" (column matrix per transaction type, plus a price table).
5. **Scenarios:** **14 TS ids** (3090_TS1 to 3090_TS14) over 40 step rows. `knowledge/cr-test-scenario-catalogue.md` line 210 records "16". That count does not match the ids [unconfirmed: the catalogue may count something else].
6. **Results:** **14 / 14 Pass.** Every step row has "Pass" in "Test Result (P/F)". Four Pass rows carry remarks about a defect (see section 6).
7. **Testers ("QA" column):** "Faiz" ran TS1–TS7 and TS12. "Aliah" ran TS8–TS11, TS13 and TS14.
8. **Dates:** no test dates in the sheet. Live date: "S29.1-20260506" (`knowledge/releases.md`). Ledger: "Done, S29.1-20260506 (live 06.05.2026)".

## 2. What the ticket changed, as the TS shows it

1. **BMK, Transfer History (TH), eLKM and eVOC** are added as Transaction Types on the Payment Breakdown Report. The TS also covers SSM and JomCheck (TS1, R3).
2. **Every type downloads as PDF** ("Download" button) **and as Excel** ("Export" button) (TS2, R7–R8).
3. **Fixed report layout:** a company header block, then a table with set columns and totals for JPJ, FIS, eAuto and Service Tax. Columns change by type (Sheet1 R9–R18).
4. **Document code column:** old invoice number before 17/06/2025, "EA-IV-xxxx" from then on (every detail row, e.g. R11).
5. **SSM price change** is reflected: eAuto RM18.40 / ST RM0.24 before 27 April 2026, RM18.00 / RM1.44 from then on (TS14, R55).

## 3. Scenarios

### A. Filters and download

1. **3090_TS1** — Transaction Type options. Expected: "Ensure the following options are displayed: - All - STMS - APT - eSTM - Transfer History - BMK - eLKM - eVOC - SSM - Jom Check" (R3). Pass.
2. **3090_TS2** — date defaults, one-month limit, PDF + Excel. Expected:
   1. "The default value for Payment Date From and Payment Date To is the current date." (R4)
   2. "The date that exceeds 1 month than the Payment Date From field is disabled and unable to be selected" (R5)
   3. "The date that is within 1 month of the Payment Date From field is enabled and can be selected" (R6)
   4. "The browser will download a report in pdf format" (R7, Type All, Download)
   5. "The browser will download a report in excel format" (R8, Export). Pass.

### B. Report details per type (each: download PDF + Excel, then check header, columns, totals, Keterangan, document code)

1. **3090_TS3 — Transfer History** (R10–R12). Totals "JPJ = RM 10.00", "eAuto = RM 10.00", "Service Tax = RM 0.80"; "Keterangan: TH". Pass, with defect remark.
2. **3090_TS4 — BMK** (R14–R16). Totals "JPJ = RM20.00", "eAuto = RM10.00", "Service Tax = RM0.80"; "Keterangan: BMK". Pass, with defect remark.
3. **3090_TS5 — eLKM** (R18–R20). Totals "a. JPJ b. eAuto = RM2.75 c. Service Tax = RM0.22"; "Keterangan: eLKM". Pass.
4. **3090_TS6 — eVOC** (R22–R24). Totals "eAuto = RM 10.00", "Service Tax = RM 0.80" (no JPJ total); "Keterangan: eVOC". Pass.
5. **3090_TS7 — SSM** (R26–R28). Different column list (see section 4.6). Prices before and after 27 April 2026; "Keterangan: SSM". Pass.
6. **3090_TS8 — JomCheck** (R30–R32). Totals "eAuto = RM 18.00", "Service Tax = RM 1.44"; "Keterangan: JomCheck". Pass.
7. **3090_TS9 — eSTM** (R34–R36). Totals "a. JPJ b. FIS c. eAuto - CAR=RM35.00 // BIKE=RM7.00 d. Service Tax - CAR=RM2.80 // BIKE=RM0.56"; "Keterangan: eSTM". Pass.
8. **3090_TS10 — STMS** (R38–R40). Totals "JPJ - CAR=RM10.00 // BIKE=RM1.00", "eAuto - CAR=RM20.00 // BIKE=RM5.00", "Service Tax - CAR=RM1.60 // BIKE=RM0.40"; "Keterangan: STMS". Pass.
9. **3090_TS11 — APT** (R42–R44). Totals "JPJ - CAR=RM100.00 // BIKE=RM3.00", "eAuto - CAR=RM15.00 // BIKE=RM5.00", "Service Tax - CAR=RM1.20 // BIKE=RM0.40"; "Keterangan: APT". Pass.
10. **3090_TS12 — All** (R46–R48). 15 columns, including both SSM-only columns. Totals checked for "a. JPJ b. FIS c. eAuto d. Service Tax" with no amounts given. Pass, with defect remark.

### C. Cut-off dates

1. **3090_TS13 — old document code** (R49 banner "No. Invois/Document Code for Old transaction - Before Cut Off Date (17 June 2025)"; R50–R52). Range "Payment Date From = 1 June 2025", "Payment Date To = 16 June 2025", Type ALL. Expected: same All layout and the two code formats. Pass.
2. **3090_TS14 — SSM price before and after 27 April 2026** (R53 banner; R54–R56). Range "Payment Date From = 23 April 2026", "Payment Date To = 30 April 2026", Type SSM. Expected: the RM18.40/RM0.24 and RM18.00/RM1.44 split. Pass.

## 4. Business rules and system behaviour

1. **Type list:** "- All - STMS - APT - eSTM - Transfer History - BMK - eLKM - eVOC - SSM - Jom Check" (EAINT-3090 Test Scenarios, R3).
2. **Default dates:** "The default value for Payment Date From and Payment Date To is the current date." (R4).
3. **One-month range, enforced by the date picker:** "The date that exceeds 1 month than the Payment Date From field is disabled and unable to be selected" (R5). The Details column says: "Valid Payment Date To: Maximum is 1 month from the selected From Date" (R10 and every download row).
4. **Company header block:** "Company Details: 1. Nama Syarikat 2. No. Daftar Perniagaan 3. Alamat 4. Agensi" (R11 and every detail row).
5. **Standard columns (13):** "1. Bil. 2. Tarikh Invois 3. Tarikh Bayaran 4. No. Rujukan 5. No. Transaksi 6. No. Invois /Document Code 7. No. Kenderaan 8. Keterangan 9. Mod Bayaran 10. JPJ 11. FIS 12. eAuto 13. Service Tax" (R11). The table must "tally with the listing page" (R11).
6. **SSM columns (12):** "5. No. Transaksi SSM 6. No. Transaksi STMS/eSTM 7. No. Invois /Document Code 8. No. Kenderaan 9. Mod Bayaran 10. Keterangan 11. eAuto 12. Service Tax" (R27). SSM has **no JPJ or FIS column**, and **Mod Bayaran comes before Keterangan**.
7. **SSM-only columns:** "applicable to SSM only * column will appear on Transaction Type = SSM" (Sheet1, R8, over "No Transaksi SSM" and "No Transaksi STMS/eSTM"). The **All** report also lists both (R47: "6. No. Transaksi SSM 7. No. Transaksi STMS/eSTM").
8. **Document Code column:** "previously named as No Invois" (Sheet1, R8).
9. **Document code format:** "a. Before 17/06/2025: (old invoice number) b. During and after 17/06/2025: EA-IV-xxxx" (R11 and every detail row).
10. **FIS:** "FIS amount declared in e-sim" (Sheet1, R7) and "applicable to eSTM only" (Sheet1, R8). Sheet1 R11 "ESTM" is the only row with FIS = "true".
11. **Empty amounts:** "column JPJ & FIS with no amount will be displayed as " - "" (Sheet1, R4).
12. **Service tax formula:** "service tax = eauto x 0.08" (Sheet1, R8).
13. **No JPJ amount** for eVOC, SSM and JomCheck: Sheet1 R16, R17, R18 have JPJ = "false" and JPJ amount = "-".
14. **eAuto amount per type, car** (Sheet1, R23–R32): "STMS | 20", "ESTM | 35", "APT | 15", "BMK | 10", "TRANSFER HISTORY | 10", "eLKM | 2.75", "eVOC | 10", "SSM | 18", "JomCheck | 18". The "bike" column (R23) is empty.
15. **JPJ amount per type** (Sheet1, R10–R15): STMS "10", ESTM "declared in e-sim", APT "100", BMK "declared in e-sim", TRANSFER HISTORY "10", eLKM "declared in e-sim".
16. **SSM price cut-off:** "a. Before 27th April 2026: - eAuto = RM 18.40 - Service Tax = RM 0.24 b. During 27th April 2026 and onwards: - eAuto = RM 18.00 - Service Tax = RM 1.44" (R27, R55). The older pair is not 8% of RM18.40 [unconfirmed: probably a different tax basis before the change].
17. **Bike prices** exist only in TS9–TS11, e.g. eSTM "BIKE=RM7.00", Service Tax "BIKE=RM0.56" (R35).

## 5. Test data, environments, accounts, setup

1. **Environments:** "staging/uat3" (new build) and "staging/eauto" (old version), both named in the R11 remark: "Raised issue regarding amount not showing up in staging/uat3. old version (staging/eauto) shows the actual amount." The ledger names "staging/uat3" as the test environment.
2. **Date ranges used:** any range up to one month (TS3–TS12); "1 June 2025" to "16 June 2025" (TS13, R50); "23 April 2026" to "30 April 2026" (TS14, R54).
3. **Data source:** JPJ and FIS amounts for eSTM, BMK and eLKM come from eSIM (Sheet1, R7 and R10–R15).
4. **Reference sheet:** "refer here for JPJ amount & eAuto amount" with a Google Sheets link (Sheet1, R5). Not opened.
5. **Accounts:** none named. **No credentials in the workbook.**

## 6. Gaps and risks for regression

1. **Pass rows that carry an open defect.**
   1. R11–R12 (TS3): "All values for payment is RM0.00. Liasing with dev to confirm the outcome".
   2. R15–R16 (TS4): "Column for JPJ is not showing value Column for eAuto is showing value 1, but the invoice generated shows the amount is 10."
   3. R47–R48 (TS12): "Raised issue regarding amount not showing up in staging/uat3."
   4. No issue key is recorded. Whether these were fixed before the 2026-05-06 release is unknown [unconfirmed]. Regression should **re-check the TH and BMK amounts**.
2. **BMK JPJ conflict:** TS4 expects "JPJ = RM20.00" (R15). Sheet1 R13 says the BMK JPJ amount is "declared in e-sim". Treat the JPJ value as eSIM-driven [unconfirmed].
3. **Stale prices.** The amounts were current at May 2026 and have changed since:
   1. **APT** eAuto RM15 → RM20 from 15.09.2026 (EAINT-12289, per `knowledge/releases.md` row 2026-09-17).
   2. **STMS/APT** service charge increase (EAINT-12403, `releases.md` row 2026-10-01).
   3. **JomCheck** charge split into JomCheck Service Charge and eAuto Service Charge (EAINT-12412). This may change JomCheck rows in this report [unconfirmed].
   4. Take current prices from those tickets, not from TS10, TS11 or TS8.
4. **Red-column rule unreadable:** which columns are removed per type is only in cell colour (Sheet1 R3). Re-open the .xlsx in Excel to confirm.
5. **FIS column scope unclear:** Sheet1 says FIS is "applicable to eSTM only" (R8). Yet the TS3–TS6 and TS8–TS11 column lists all include "11. FIS". Whether non-eSTM reports show FIS as " - " or drop it is not settled [unconfirmed].
6. **TS2 example mismatch:** the step says "select a date 2 months before the current month"; the example says "(Eg. If today is 5th April, choose 5th March)" (R5). A regression run should test both a valid and an over-limit To date explicitly.
7. **Bike data** is not in Sheet1 (R23 "bike" column empty). Bike totals rest only on TS9–TS11 text.
8. **Not covered:** "All" report totals with real amounts (TS12 lists columns with no figures); no-data range; one-day range; the edge where To = From + exactly one month; a company with no transactions; the BO report of the same name (`flow-company-profile-einvoice.md` line 217 says "UCD › Reports and BO › Report", but this TS only shows "Report > Payment Breakdown Report").

## 7. Notes against existing knowledge

1. **Consistent:** `business-rules-from-test-scenarios.md` §9.4 (lines 638–643) quotes the type list, default dates, one-month rule and " - " rule correctly. It cites "[… row 11]" for the header block; R11 is correct.
2. **Count mismatch:** the catalogue line 210 says "16" scenarios; the workbook has **14 ids**, and the ledger says "14 TS".
3. **Name difference:** the TS dropdown option is "Jom Check" (R3). Elsewhere the knowledge says "JomCheck".
4. **Type list order:** `flow-company-profile-einvoice.md` line 218 lists types as "BMK, TH, eLKM, eVOC, SSM, JomCheck, eSTM, STMS, APT, All". The TS order is All, STMS, APT, eSTM, Transfer History, BMK, eLKM, eVOC, SSM, Jom Check (R3).
5. **Column list gap:** `flow-company-profile-einvoice.md` line 218 lists 12 columns and leaves out **"Bil."**, **"No. Transaksi SSM"** and **"No. Transaksi STMS/eSTM"**.
6. **Portal scope:** `flow-company-profile-einvoice.md` line 217 says the report is in UCD and BO. This TS gives one path only. BO is not evidenced here.
7. **flow-stms.md line 325** tags "[unconfirmed] TH shows on Transaction Details and in payment reports". This TS confirms the payment-report half: "Keterangan: TH" (R11).

## Knowledge candidates

1. **Payment Breakdown Report: SSM layout.** No JPJ/FIS; adds "No. Transaksi SSM" and "No. Transaksi STMS/eSTM"; Mod Bayaran before Keterangan. Source: EAINT-3090 Test Scenarios R27; Sheet1 R8, R17. Target: `flow-company-profile-einvoice.md` and `flow-ssm.md`.
2. **Document Code renamed:** "previously named as No Invois" (Sheet1 R8). Code is "EA-IV-xxxx" from 17/06/2025, old invoice number before (R11). Target: `flow-company-profile-einvoice.md`.
3. **Service tax** = "eauto x 0.08" (Sheet1 R8). Target: `flow-company-profile-einvoice.md` or the fees note.
4. **SSM price cut-off 27 April 2026:** "Before 27th April 2026: - eAuto = RM 18.40 - Service Tax = RM 0.24 b. During 27th April 2026 and onwards: - eAuto = RM 18.00 - Service Tax = RM 1.44" (R55). Target: `flow-ssm.md`.
5. **FIS** is "applicable to eSTM only" and "declared in e-sim" (Sheet1 R7–R8). Target: `flow-estm.md`, `esim.md`.
6. **eAuto amounts as of May 2026** (Sheet1 R23–R32), labelled as superseded where EAINT-12289 / 12403 / 12412 changed them. Target: the prices note.
7. **Correct the catalogue count** for #044 from 16 to 14 TS ids (workbook R3–R56; ledger "14 TS"). Target: `cr-test-scenario-catalogue.md` line 210.
8. **Add "Bil.", "No. Transaksi SSM", "No. Transaksi STMS/eSTM"** to the column list in `flow-company-profile-einvoice.md` line 218 (source R47).
9. **Open defect record:** TH/BMK/All amounts showed RM0.00 on "staging/uat3" while "staging/eauto" showed real amounts (R11, R15, R47 remarks). TS marked Pass. Target: `flow-company-profile-einvoice.md` test-notes, tagged [unconfirmed: fix status].
10. **Test environment** for EAINT-3090 was staging/uat3 (R11 remark; ledger). Target: `cr-test-scenario-catalogue.md` already lists "staging, uat3"; no change needed.
