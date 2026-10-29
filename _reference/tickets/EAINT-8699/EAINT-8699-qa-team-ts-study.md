# EAINT-8699 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read only. Nothing in
`knowledge/`, `lib/` or `app/` was changed. Durable facts are listed under
"Knowledge candidates" at the end.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8699 - eAuto Services Portal - To update user interface by enhancing its design & to include the display of eSTM, eLKM & eVOC.md` (copy dated "28/10/2026, 9:19:46 am"). Read in full, all 15 sheets.
2. **Not available:** the copy says "Cell text only, row by row; formatting and images are not kept." Cell colours are lost, so the **grey-out rows** in Overall Progress (see §4.1) cannot be identified.
3. **Ticket folders:** `_reference/tickets/EAINT-8699/` and `_reference/tickets/Studying/EAINT-8699/` held no files before this study.
4. **lib/ticketStudies.ts:** no entry for EAINT-8699.
5. **knowledge/ (grep 8699):** `business-rules-from-test-scenarios.md` §3 items 6-7, `flow-estm.md` "Hak Milik cronjob" paragraph, `esim.md` item 3, `production-regression-scope.md` R47 note + ledger row, `cr-test-scenario-catalogue.md` row 080. Also checked `flow-service-portal-shell.md`, `flow-bo-shell.md`, `README.md`.
6. **No SRD, Jira ticket or Teams thread** was read (not in scope for an unattended run).

## 1. Header

1. **Ticket:** EAINT-8699 — "eAuto Services Portal - To update user interface by enhancing its design & to include the display of eSTM, eLKM & eVOC".
2. **Portals touched:** **Service Portal** (bank/credit company) Ownership Claim Listing, Details and Enquiry; **BackOffice** eSTM Transaction Listing/Details and Manage Bank/Credit Company Accounts; **UCD** eSTM Transaction Details; **e-Simulator** (eSIM).
3. **Workbook:** "EAINT-8699 - eAuto Services Portal - To update user interface by enhancing its design & to include the display of eSTM, eLKM & eVOC.xlsx", library "eAuto - CR Test Scenarios", modified 19/01/2026, 3:28:49 pm.
4. **Sheets (15):** Overall Progress, E2E Flow, Cronjob 8699, Cronjob 8699 TS, eSTM E2E Flow, BO eSTM Hyperlink, 8523 Existing Cronjob, 8699 New Cronjob, Existing Transaction, Ownership Claim Enquiry (Reg), Bank Credit Company, Func. Test (Listing page), Func. Test (Details page), Permission Access TS, E2E Flow (2).
5. **Two test rounds** are tracked on Overall Progress:
   1. "BEFORE 12th November Deployment" (R2): 83 counted, **80 Pass, 3 N/A, 0 Fail** (R10).
   2. "AFTER 13th November Discussion (Latest)" (R14): 87 counted, **69 Pass, 18 N/A, 0 Fail** (R24).
6. **Round 1 breakdown** (Overall Progress R5-R9): E2E Flow 13 Pass; Cronjob 8699 TS 6 Pass; Func. Test (Listing page) 34 Pass + 3 N/A; Func. Test (Details page) 11 Pass; Permission Access TS 16 Pass.
7. **Round 2 breakdown** (Overall Progress R17-R23): eSTM E2E Flow 7 Pass; BO eSTM Hyperlink 6 Pass + 4 N/A; 8523 Existing Cronjob 9 + 1; 8699 New Cronjob 16 + 3; Existing Transaction 16 + 2; Ownership Claim Enquiry (Reg) 8 + 8; Bank Credit Company 7 Pass.
8. **Not counted on Overall Progress:** sheet "Cronjob 8699" (7 rows, ids `9062_CJ_TS1-7`, all "Not Started") and sheet "E2E Flow (2)" (14 rows: 9 Pass, 5 N/A).
9. **Pass counts are typed numbers**, not COUNTIF formulas (e.g. R5 Pass cell "13"; the other status cells are formulas). The totals may not track the sheets live [unconfirmed].
10. **Testers (QA column):** Azfar, Nick, Teck Yung, Charmain. Some rows say "Deprioritise" instead of a tester.
11. **Dates written in the sheet:** "per Jason’s 13/11/2025 meeting" (Overall Progress R17); "Before 8699 Deployment (06/11/2025)" (Existing Transaction R20); "Retested on 10/11/2025" (Func. Test (Listing page) R25, R68); "Retested 11/11/2025" (Permission Access TS R16); run-time tests on 17-20/11/2025 (8699 New Cronjob R36-R41).
12. **Deployment date conflict:** sheet says "BEFORE 12th November Deployment"; `knowledge/production-regression-scope.md` ledger lists EAINT-8699 at "20251124". The 12 Nov date was likely moved after the 13/11 meeting [unconfirmed].

## 2. What the ticket changed, as the TS shows it

1. **Service Portal Ownership Claim Listing** now lists approved **eSTM transactions that have Butir-butir Hak Milik (BBHM)**, with eLKM, eVOC and a **Hak Milik = E / J** source flag.
2. **New listing features:** search/filter fields, **[Download files (n)]** ZIP per selected rows, **Excel export**, **[Reset]**, and an **export audit trail log**.
3. **New Details page** on the Service Portal, compared field by field to the eSTM details page, with a **[Print]** button for the BBHM PDF.
4. **Credit Company column and search field** visible only to named accounts.
5. **New cronjob "8699"** that retries the BBHM purchase for approved eSTM **with or without** FIS Revenue Code. It sits beside the existing **EAINT-8523** cronjob, which only covers transactions **with** FIS Revenue Code.
6. **Bank/Credit Company permissions** decide which companies' transactions a Service Portal account can see ("Permission To View" + "Full enquiry permission").
7. **Ownership Claim Enquiry** was regression-tested, marked "(TBC) - Pending KJ's confirmation" (Overall Progress R41).

## 3. Scenarios

### 3.1 Round 1 — "E2E Flow" (Hak Milik = J then E)

1. **8699_E2E_TS1-6** — Individual/Company eSTM with eLKM/eVOC combinations, STMS Enquiry 00 then 4K, BBHM made by cronjob 8523 or by clicking [Hak Milik]. Expected: "Transaction is displayed with Hak Milik = J", ZIP and Print work. All Pass.
2. **8699_E2E_TS7** — eSTM + eLKM + eVOC, [Hak Milik] click fails. Expected: "eSTM transaction with Status = Approved and without Butir-butir Hak Milik is NOT listed in the listing". Pass.
3. **8699_E2E_TS9-14** — STMS Enquiry 4K at creation, FIS Amount 0/20/50. Expected "Hak Milik = E". All Pass.
4. **No TS8** in this sheet.

### 3.2 Round 1 — "E2E Flow (2)" (alternate version, not counted)

1. **8699_E2E_TS1-8** — same flows, but here 4K at creation gives "Hak Milik = E" and the cronjob/click path also gives "Hak Milik = E". TS1-8 Pass.
2. **8699_E2E_TS9-14** — "Leave FIS Revenue Code blank" + 4K. Expected "Hak Milik = J". TS9 Pass, TS10-14 N/A.
3. **Labels are swapped** versus the "E2E Flow" sheet. See §6.

### 3.3 Round 1 — "Cronjob 8699 TS"

1. **8699_CJ_TS1** — FIS code 2354071, response 00, click [Hak Milik] → "Upload failed. Please retry."; switch to 4K, cronjob makes BBHM → "Hak Milik = J". Pass.
2. **8699_CJ_TS2** — 4K + FIS amount 20 at creation → BBHM at once, "Hak Milik = E"; link stays hidden across 3 PM and 4 PM runs. Pass.
3. **8699_CJ_TS3** — 4A, FIS code blank → link expected, later 4K → "Hak Milik = J" and "Should NOT display "TUNT.H/MILIK SELAIN MSL e-STM" item under 'Keterangan'". Pass, with remark that Step 8 is invalid (§4.3).
4. **8699_CJ_TS4** — Company, cronjob next day 10 AM picks up → "Hak Milik = J". Pass.
5. **8699_CJ_TS5** — existing transaction "within < 7 days", 4K → picked up at 11 AM. Pass.
6. **8699_CJ_TS6** — "Request dev to patch 8 days before today's date" → link "will remain displayed". Pass.

### 3.4 Round 1 — "Cronjob 8699" (ids 9062_CJ_TS1-7)

1. Seven cronjob BBHM scenarios across eSTM-only, +eLKM, +eVOC. All "Not Started", no tester. The id prefix "9062" suggests a copy from another ticket's sheet [unconfirmed].

### 3.5 Round 2 — "eSTM E2E Flow"

1. **eSTME2E_TS1-3** — FIS code 2354071, amount 0/20/50, STMS Enquiry 4K. Expected: BBHM button shown, hyperlink HIDDEN, listed with "Hak Milik = E", Excel + ZIP correct. Pass.
2. **eSTME2E_TS4-6** — same FIS, STMS Enquiry 4A / 1R / 00. Expected: BBHM HIDDEN, "Show Hak Milik Hyperlink", "Transaction should NOT listed in the listing". Pass.
3. **eSTME2E_TS7** — FIS code blank, 4C. Expected: BBHM HIDDEN, hyperlink HIDDEN, not listed. Pass.

### 3.6 Round 2 — "BO eSTM Hyperlink"

1. **BOHMH_TS1-3, TS10** — N/A: "already covered in eSTME2E_TS1 to TS3" / "eSTME2E_TS7".
2. **BOHMH_TS4-6** — created with 4Z/00/1R, then 4K, click hyperlink → BBHM shown, listed "Hak Milik = E". Pass.
3. **BOHMH_TS7-9** — click hyperlink while still not 4K → BBHM HIDDEN, hyperlink still shown, not listed. Pass.

### 3.7 Round 2 — "8523 Existing Cronjob"

1. **8523CJ_TS1-3** — BBHM already bought (4K at creation) → "Ensure cronjob DOES NOT pickup the transaction" and "The transaction appears only once in the listing." TS1-2 Pass, TS3 Deprioritise/N/A.
2. **8523CJ_TS4-6** — not 4K at creation, 4K before cron → picked up, "Hak Milik = E". Pass, dev logs confirmed.
3. **8523CJ_TS7-9** — cron picks up but response not 4K → not listed. Pass, dev logs confirmed.
4. **8523CJ_TS10** — no FIS code → "Ensure cronjob DOES NOT pickup the transaction." Pass.

### 3.8 Round 2 — "8699 New Cronjob"

1. **8699CJ_TS1-3** — BBHM already bought → cronjob does not pick up; appears once. TS1, TS3 Pass; TS2 N/A.
2. **8699CJ_TS4-6** — with FIS code, cron hits 4K → "Hak Milik = E". Pass.
3. **8699CJ_TS7-9** — with FIS code, cron not 4K → not listed, hyperlink shown. Pass.
4. **8699CJ_TS10** — **without** FIS code, cron hits 4K → BBHM button "HIDDEN" in UCD/BO, but listed with "Hak Milik = J". Pass.
5. **8699CJ_TS11-13** — without FIS code, cron not 4K → not listed. TS12 Pass; TS11, TS13 N/A.
6. **8699CJ_RT_TS1-3** — run-time window tests (first / middle / last cronjob over 3 days, 17-20/11/2025). All Pass.

### 3.9 Round 2 — "Existing Transaction"

1. **EXeSTM_TS1** — approved Feb 2022 with BBHM → listed but "BLANK No Siri Tuntutan and Hak Milik". Pass.
2. **EXeSTM_TS2-7** — approved Jan 2023 to Nov 2025 with BBHM → listed, "Hak Milik = E". Pass.
3. **EXeSTM_TS8** — July 2023, no FIS code, no BBHM → not listed. Pass.
4. **EX_BOHMH_TS1-2** — pre-deployment transaction, hyperlink click with 4K / 00. Pass. **TS3** N/A.
5. **EX_8523CJ_TS1-2** — 7 days and 1 day old, cron 8523 → 4K listed "E" / not 4K not listed. Pass. **TS3** Deprioritise/N/A.
6. **EX_8699CJ_TS1-4** — 17 h / 24 h / 24 h / 8 h old, cron 8699 → E listed / not listed / "Hak Milik = J" listed / not listed. Pass.

### 3.10 Round 2 — "Ownership Claim Enquiry (Reg)"

1. **OCEnq_EX_TS1-8** and **OCEnq_NEW_TS1-8** — BBHM yes/no × FIS code yes/no × STMS Enquiry 4K / not 4K. Expected on enquiry: 4K → "Show BBHM with correct details" + [Print]; not 4K → "Show "RECORD NOT FOUND" and ensure user unable to download and view BBHM". 8 Pass, 8 Deprioritise/N/A.

### 3.11 Round 2 — "Bank Credit Company"

1. **8699_BCCOMP_TS1** — setup: 6 eSTM transactions, one per credit company in eSimulator LOAN. No expected result written. Pass.
2. **TS2-3** — 3 companies in "Permission To View", "Full enquiry permission" NOT ticked → "listing page only displays existing and new transactions listings of that respective credit company ONLY". Pass.
3. **TS4-5** — attempt with no companies → "UNABLE to leave "Permission To View" section Empty." Pass.
4. **TS6-7** — "Full enquiry permission" ticked → "displays all listings of that respective credit company as well as listings from other credit companies". Pass.

### 3.12 Round 1 — "Func. Test (Listing page)"

1. **8699_SNF_TS1-25** — input rules for Vehicle No., Credit Company, Buyer's ID, Buyer's Name, No Siri Tuntutan (§4.6). TS6-8 (Credit Company textbox) N/A; rest Pass.
2. **8699_SNF_TS26-34** — search results per field, date range, eLKM / eVOC / Hak Milik dropdowns. Pass.
3. **8699_SNF_TS35** — multi-filter + export. Pass after retest.
4. **8699_SNF_TS36** — [Reset] "Clears all filters". Pass.
5. **8699_SNF_TS37** — export audit trail log. Pass.

### 3.13 Round 1 — "Func. Test (Details page)"

1. **9062_FUNC_TS1-2** — Contact No 9 and 11 digits display as updated. Pass.
2. **9062_FUNC_TS3-5** — Email with allowed special characters, 100 chars OK, 101 chars "Unable to update". Pass.
3. **9062_FUNC_TS6-7** — eLKM 6 / 12 months shown as entered. Pass.
4. **9062_FUNC_TS8-9** — FIS shown as entered; over RM999 "with thousand comma separator ⏎ e.g: RM1,567.00". Pass.
5. **9062_FUNC_TS10-11** — eVOC Yes / No. Pass.

### 3.14 Round 1 — "Permission Access TS"

1. **8699_PERM_TS1-16** — accounts kmcheah, jasons, mfizni see the Credit Company column, search field and export column; hongkee does not. All four can open the details page. All Pass.

## 4. Business rules and system behaviour

### 4.1 Scope decisions

1. **Grey-out rule:** "(Grey out) | = These scenarios won’t occur in production, per Jason’s 13/11/2025 meeting. QA will exclude them from testing." (Overall Progress R17). Which matrix rows are grey is not readable from the text copy.
2. **Existing data scope:** "1. Transaction created from 1st Jan 2023 onwards" and "2. Transaction with JPJ Approved 72 hours before the deployment" "(Pickup by 8699 cronjob)" (Overall Progress R44-R46).
3. **Unexplained note:** "*m&m transaction type" (Overall Progress R47). Meaning not stated.

### 4.2 The two cronjobs

1. **8523:** "- Picks up transactions WITH FIS Revenue Code and FIS Amount that DO NOT have BBHM (E/J)" and "- Runs hourly from 8:30AM - 11:30PM daily and only covers trx with JPJ approved within 8 days" (8523 Existing Cronjob R3-R4).
2. **8699:** "- Picks up all eSTM transactions with Approved status (WITH / WITHOUT FIS Revenue Code) that DO NOT have BBHM (E/J)" and "- Runs every 3 hours from 9:00AM - 9:00PM daily and only covers trx with JPJ Approved within 72 hours" (8699 New Cronjob R3-R4).
3. **Older schedule note conflicts:** "Note: Cronjob run between 9.00AM to 11.00PM" (Cronjob 8699 TS R6). Round 1 checks were at 10 AM, 11 AM, 3 PM, 4 PM. The round 2 logic (every 3 hours) is labelled "(Latest)".
4. **15 runs in the window:** "20/11/2025 - 9PM Cronjob (15th CJ - Last)" (8699 New Cronjob R37). 5 runs a day × 3 days fits "every 3 hours from 9:00AM - 9:00PM" [inferred].
5. **A cronjob retry sends a new STMS Enquiry:** "Ensure cronjob pickup the transaction and send another STMS Enquiry. (Please request screenshot of backend log from dev)" (8699 New Cronjob R14).
6. **Once BBHM exists, no pickup:** "Ensure cronjob DOES NOT pickup the transaction." (8523 Existing Cronjob R11; 8699 New Cronjob R11).
7. **Remark conflicting with 72 h:** "18/11/25 - 9pm - CJ do not pick up as more than 24 hours passed" (8699 New Cronjob R41, Remarks).

### 4.3 BO [Hak Milik] hyperlink

1. **Shown only with FIS Revenue Code:** "Step 8 invalid as Hak Milik hyperlink only display when created eSTM with FIS Revenue Code" (Cronjob 8699 TS R10, Remarks).
2. **Without FIS code:** "Ensure Hak Milik Hyperlink is HIDDEN" (eSTM E2E Flow R17).
3. **Hidden once BBHM exists:** "[Hak Milik] hyperlink is hidden after cronjob 8699 run" (Cronjob 8699 R3).
4. **Click failure message:** "Popup message displayed "Upload failed. Please retry."" (Cronjob 8699 TS R5). Elsewhere it is written "Update failed. Please retry." (E2E Flow R9). Exact wording is not settled.

### 4.4 Hak Milik E / J flag and listing rule

1. **Filter meaning:** "E | Display records for UCD that purchased Butir-butir Hak Milik from eAuto" and "J | Display records for UCD that purchased Butir-butir Hak Milik from JPJ" (Func. Test (Listing page) R66-R67).
2. **Latest round:** with FIS Revenue Code the result is "Hak Milik = E" whether BBHM came at creation, by hyperlink or by cronjob (eSTM E2E Flow R5; BO eSTM Hyperlink R8; 8523 Existing Cronjob R14; 8699 New Cronjob R14).
3. **Without FIS Revenue Code** a cronjob 4K gives "Hak Milik = J" (8699 New Cronjob R26; Existing Transaction R40).
4. **J rows hide the BBHM button in UCD/BO:** "Ensure [Butir-butir Hak Milik] button is HIDDEN" but "Transaction should listed in the listing" with "Hak Milik = J" (8699 New Cronjob R26).
5. **No BBHM, no listing:** "Transaction should NOT listed in the listing ⏎ - Ensure the transaction is NOT showing in the exported Excel file and downloaded ZIP file." (eSTM E2E Flow R8).
6. **Pre-2023 data:** "Details showing correctly (BLANK No Siri Tuntutan and Hak Milik)" for February 2022 (Existing Transaction R6).
7. **STMS Enquiry 4K** is the response that yields BBHM, both at creation and on retry. Other codes used (00, 1R, 4A, 4C, 4Z) give no BBHM (eSTM E2E Flow R5-R10) [inferred from the pattern].

### 4.5 Files

1. **ZIP:** "ZIP file is downloaded automatically when click [Download files (n)] with file name eauto_service_portal.zip" and "separated into folders with folder name {VehicleNo}_{BuyerID}" (E2E Flow R3).
2. **Excel:** "export the listing as an EXCEL file (eauto_service_portal-yymmddhhmm.xlsx)" (eSTM E2E Flow R5).
3. **Audit log:** "The log should capture the User ID and the date & time of the activity" every export (Func. Test (Listing page) R74).

### 4.6 Listing search fields

1. **Vehicle No.:** special and non-ASCII removed, "Vehicle No should show "NH12abc999"" (R4). Front/back spaces trimmed, "NHD 2106" (R5). Max 255 (R6-R7).
2. **Buyer's ID:** "System should auto remove Special Characters EXCEPT hypen ( - )" (R14). Trim, max 255.
3. **Buyer's Name:** special characters allowed, non-ASCII removed (R18-R19). Trim, max 255.
4. **No Siri Tuntutan:** "System should auto remove Alphabet ⏎ - System should only allow Numeric and Special Characters" (R23). Remark: "For keyboard typing, spaces are not removed for front and back, even clicking on Search Now ⏎  ⏎ Retested on 10/11/2025" (R25).
5. **Exact match only:** partial Vehicle No, Buyer's Name and No Siri Tuntutan give "Displays "0 record(s) in total"" (R34, R53, R57).
6. **Date range:** empty → "Display popup message “Please select eSTM Approved Date From and eSTM Approved Date To”" (R38); "Unable to select date range more than 1 month" (R43); "Displays "Please select To Date."" / "Displays "Please select From Date."" (R45-R46).
7. **eLKM / eVOC dropdowns:** options "All", "Yes", "-" (R59-R64).
8. **Credit Company** is a dropdown for search: "Credit Company ⏎ (Can only be accessed by jasons, kmcheah & mfizni) | Dropdown" (R36).

### 4.7 Details page and Enquiry

1. **No eLKM:** "Display (eLKM Details): ⏎      - Created At: - ⏎      - Duration:  -" (E2E Flow R5).
2. **FIS format:** "RM1,567.00" (Func. Test (Details page) R11).
3. **Email limit:** "Unable to update Email with 101 characters" (Func. Test (Details page) R7).
4. **Enquiry search keys:** "(with Vehicle No & Owner's Id)" or "(with Vehicle No & Owner's Id + ⏎      Engine & Chassis No)" (Ownership Claim Enquiry (Reg) R5-R6).
5. **Enquiry fail:** "Show "RECORD NOT FOUND" and ensure user unable to download and view BBHM" (Ownership Claim Enquiry (Reg) R6).

### 4.8 Permissions

1. **BO page:** "Go to BO > Manage Bank/Credit Company Accounts" then "Under the "Permission To View" section select 3 bank/credit companies" (Bank Credit Company R4).
2. **Empty not allowed:** "BackOffice will prompt error message "Please select at least one bank/credit company."" (Bank Credit Company R6, Remarks).
3. **Credit Company column/search/export:** visible for kmcheah, jasons, mfizni; "Unable to view 'Credit Company' column" for hongkee (Permission Access TS R3-R6, R16).

### 4.9 Duplicates

1. "Generate by CRON will create duplicate records" (E2E Flow (2) R9, Remarks).
2. "There are duplicate vehicle numbers for the same transactions for the same timestamp ⏎  ⏎ Retested on 10/11/2025" (Permission Access TS R21, Remarks).
3. Round 2 checks this: "The transaction appears only once in the listing." (8523 Existing Cronjob R11).

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. Staging assumed [unconfirmed].
2. **e-Simulator "STMS Enquiry Respond":** prefix response codes **00, 4K, 4A, 4C, 4Z, 1R**.
3. **e-Simulator "eSTM Enquiry Respond":** **FIS Revenue Code 2354071** or blank; **FIS Amount 0.00 / 20.00 / 50.00**.
4. **Dev help needed:** "can ask dev's help to patch the jpj approve date & time" (Existing Transaction R38); backend log screenshots for every cronjob pickup.
5. **Service Portal accounts:** kmcheah, jasons, mfizni (Credit Company visible), hongkee (not visible). Credit company accounts AEON CREDIT SERVICE (M) SDN BHD and GFS TECHNOLOGY SDN BHD.
6. **eSimulator LOAN companies:** "AEON CREDIT SERVICE (M) SDN BHD", "ELK-Desa Capital Sdn Bhd", "GFS TECHNOLOGY SDN BHD", "MALAYAN BANKING BERHAD", "MAYBANK INVESTMENT BANK BERHAD", "MBSB BANK BERHAD" (Bank Credit Company R3).
7. **Recorded transactions:** reference numbers E5N1937407 to E5N1937467 and older E22995968, E311305785, E391553341, E461846569, E4D1923428, E371497278; vehicle numbers such as WWE8361, NHD8723, TY44455.
8. **Credentials:** none present in the text copy.

## 6. Gaps and risks for regression

1. **E / J meaning conflicts across sheets.** "E2E Flow" R3 gives "Hak Milik = J" for an eSTM with FIS code 2354071 fixed by cronjob 8523. "E2E Flow (2)" and all round 2 sheets give "E" for the same case. Round 2 is labelled "(Latest)". Regression should follow round 2 and confirm on staging.
2. **`knowledge/` is out of date on this point.** `flow-estm.md` and `business-rules-from-test-scenarios.md` §3 item 6 say J means "bought from JPJ by the cronjob" and E means "bought in the eSTM flow". Round 2 shows a cronjob can give E (8523 Existing Cronjob R14) and J depends on **no FIS Revenue Code** (8699 New Cronjob R26).
3. **`knowledge/esim.md` item 3** says 4K is set "to make the Hak Milik cronjob buy the document from JPJ". Round 2 shows 4K also gives BBHM at creation, with no cronjob (eSTM E2E Flow R5).
4. **Cronjob window conflict:** 72 hours (8699 New Cronjob R4) versus remark "more than 24 hours passed" (R41). The 72-hour boundary was not tested exactly.
5. **8523 8-day window** was not tested at the boundary in round 2.
6. **18 N/A in round 2**, 8 of them Ownership Claim Enquiry rows marked "Deprioritise". Enquiry for BBHM without FIS code (OCEnq_EX_TS5-6) was never run.
7. **"Cronjob 8699" sheet** (9062_CJ_TS1-7) is all "Not Started".
8. **J rows hide the BBHM button in UCD/BO** while the Service Portal shows it. This is easy to call a bug by mistake; confirm it is intended.
9. **Duplicate records** from the cronjob were seen twice. Round 2 "appears only once" passed, but keep it in regression.
10. **Three bug tickets raised:** EAINT-9159 ("Internal Server Error Displayed when moving to next or other pages", R38), EAINT-9160 ("0 records displayed when using partial Buyer's ID", R49), EAINT-9150 ("Cannot Export File as it will return server error", R68). Status of 9159 and 9160 is not recorded.
11. **No Siri Tuntutan trim** failed for keyboard typing before retest (R25). Recheck.
12. **Sheet errors to ignore when reusing rows:** SNF_TS6 expected result is "k"; SNF_TS22 expects "12abc" from "12将ありกำகள卡999"; SNF_TS29 says "Partial Credit Company" under Buyer's ID; SNF_TS30 says "Buyer's ID Not Found" under Buyer's Name; SNF_TS8 says "Vehicle No should show" for Credit Company; BCCOMP_TS1 has no expected result.
13. **Night deployment:** "Unable to check for 8699 post deployment at night as last hour to run is 11pm" (`production-regression-scope.md`, Deployment Checklist 20251124 R47). Post-deployment cronjob checks need the next day.
14. **Company vs Individual** coverage is uneven (e.g. 8699CJ_TS10 only Individual for HM = J).
15. **Audit log** is dev-checked only; no UI evidence.

## Knowledge candidates

1. **Correct the E / J rule** in `knowledge/flow-estm.md` (Hak Milik cronjob paragraph) and `business-rules-from-test-scenarios.md` §3 item 6. Proposed: "Hak Milik = E when the eSTM has FIS Revenue Code (BBHM bought at creation, by BO hyperlink or by cronjob); Hak Milik = J when there is no FIS Revenue Code and cronjob 8699 gets 4K." Source: `[from SharePoint TS #080 EAINT-8699, sheet 8699 New Cronjob, rows 14, 26; sheet 8523 Existing Cronjob, row 14; sheet Func. Test (Listing page), rows 66-67]`.
2. **Two cronjob rules** (8523: with FIS code, hourly 8:30AM-11:30PM, 8 days; 8699: with/without FIS code, every 3 hours 9AM-9PM, 72 hours, verbatim in §4.2). Source: `[from SharePoint TS #080 EAINT-8699, sheet 8523 Existing Cronjob R3-R4; sheet 8699 New Cronjob R3-R4]`. Fits `flow-estm.md`.
3. **BO [Hak Milik] hyperlink only for eSTM with FIS Revenue Code.** Source: `[from SharePoint TS #080 EAINT-8699, sheet Cronjob 8699 TS, row 10 remark; sheet eSTM E2E Flow, row 17]`.
4. **Update `esim.md` item 3:** STMS Enquiry 4K yields BBHM at creation too, not only on cronjob retry; FIS Revenue Code 2354071 and amounts 0/20/50 are set in "eSTM Enquiry Respond". Source: `[from SharePoint TS #080 EAINT-8699, sheet eSTM E2E Flow, rows 5-10]`.
5. **New flow file** `knowledge/flow-service-portal-ownership-claim.md` (`flow-service-portal-shell.md` lists Ownership Claim Listing and Enquiry as "no flow doc yet"): listing rule (approved eSTM with BBHM, from 1 Jan 2023), search field rules (§4.6), ZIP/Excel names, Details page, Enquiry "RECORD NOT FOUND". Source: sheets Func. Test (Listing page), Func. Test (Details page), Ownership Claim Enquiry (Reg), Overall Progress R44.
6. **Manage Bank/Credit Company Accounts** (`flow-bo-shell.md` says "no flow doc yet"): "Permission To View" list, "Full enquiry permission" checkbox, error "Please select at least one bank/credit company." Source: `[from SharePoint TS #080 EAINT-8699, sheet Bank Credit Company, rows 4-9]`.
7. **Credit Company column/search/export** visible only to set accounts (kmcheah, jasons, mfizni in this sheet). Source: `[from SharePoint TS #080 EAINT-8699, sheet Permission Access TS, rows 3-16]`. Whether this is an account flag or hard-coded is [unconfirmed].
8. **Quirk:** cronjob BBHM generation produced duplicate listing rows during testing. Source: `[from SharePoint TS #080 EAINT-8699, sheet E2E Flow (2), row 9 remark; sheet Permission Access TS, row 21 remark]`. Fits `quirks.md`.
9. **Quirk:** BO hyperlink failure text is written two ways ("Upload failed. Please retry." / "Update failed. Please retry."). Source: `[sheet Cronjob 8699 TS, row 5; sheet E2E Flow, row 9]`. Capture the live text before asserting it.
