# EAINT-6475 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Study only — nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-6475 - To allow searching for vehicles by chassis number to purchase the JomCheck report.md` (copy taken 28/10/2026, 1:16:46 am). Cell text only; formatting, colours and images are not in the copy.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-6475/EAINT-6475-jira.md` (27/10/2026).
3. **Knowledge:** `knowledge/flow-jomcheck.md` §5a item 1, §11e, §11f; `knowledge/business-rules-from-test-scenarios.md` §5 items 3–4; `knowledge/cr-test-scenario-catalogue.md` (#050, man-days line); `knowledge/production-regression-scope.md` (EAINT-6475 rows); `knowledge/README.md`.
4. **lib/ticketStudies.ts:** no EAINT-6475 entry.
5. **Not read:** the SRD files (.docx / .pdf, v0.1–v1.3) attached in Jira. Only their file names are known. No SRD quote appears in this study.

## 1. Header

1. **Ticket:** EAINT-6475 — "🔴[eAuto-UCD] JomCheck: To allow searching for vehicles by chassis number to purchase the JomCheck report" `[Jira capture, item 1]`.
2. **Status / release:** "Done"; fix version "S27.6-20260318🌞 (2026-03-18)" `[Jira capture, items 2, 4]`.
3. **Module / portal:** JomCheck — **UCD** (Get JomCheck Reports, Transaction Listing / Details, Invoice) and **BO** (JomCheck Transaction Listing, CSV export, SST Payment Report (JomCheck)).
4. **Workbook:** "EAINT-6475 - To allow searching for vehicles by chassis number to purchase the JomCheck report.xlsx", library "eAuto - CR Test Scenarios", modified 17/03/2026, 5:49:55 pm. Catalogue #050 in `knowledge/cr-test-scenario-catalogue.md`.
5. **Sheets (5):** Regression TS, Functional TS, E2E TS, SnF Functionality (Chassis No), Sheet1.
6. **Scenario counts and results:**

| Sheet | TS ids | Rows | Pass | Not run | In-sheet counter |
|---|---|---|---|---|---|
| Regression TS | 6 (6475_REG_TS01–TS06) | 11 | 11 | 0 | "5/6" (R1) |
| Functional TS | 15 rows, ids JC_6475_TS1–TS14 (**TS11 used twice**) | 15 | 14 | 1 (deprioritised) | "12/14" (R2) |
| E2E TS | 9 (6475_E2E_TS01–TS09) | 23 | 23 | 0 | "2/9" (R1, R29) |
| SnF Functionality (Chassis No) | 12 (JOMUCDSF_TS1–4, JOMBOSF_TS1–8) | 45 | 45 | 0 | "12/12" (R1, R53) |
| Sheet1 | 5 ids **9786_E2E_TS1–TS5** (belong to EAINT-9786) | 6 | 0 | 2 marked "Not Started", rest blank | — |

7. **Total for this ticket:** 42 scenarios (6 + 15 + 9 + 12); 41 Pass, 1 deprioritised. The in-sheet counters "5/6" and "2/9" do not match the Pass column — **stale counters** [unconfirmed].
8. **Testers (QA column):** Teck Yung, Azfar, Nick, Maisarah. Regression TS01 also credits "Azfar(Jomcheck API)" `[Regression TS, R5]`.
9. **Dates in the sheet:** only one — "2026-01-09" in a trailing cell of `[E2E TS, R5]`. Jira QA sub-task batch "EAINT-10104 ------ Issues raised - 13 March 2026 ------" `[Jira capture, item 9]`.
10. **Effort:** "[QA] Est Man-day (cf 10081): 2" `[Jira capture, item 7]`.

## 2. What the ticket changed, as the TS shows it

1. **Two search modes** on Get JomCheck Reports: "Two radio buttons Vehicle Number and Chassis Number are displayed." `[Functional TS, R7]`.
2. **New chassis input rules:** auto-uppercase, special characters removed except `* / -`, non-ASCII removed `[Functional TS, R19–R21]`.
3. **Chassis-bought transactions** carry the chassis in every surface (listing, details, BO export, invoice, JomCheck Report, SST report) with the vehicle side shown as "-" / "NOT AVAILABLE" `[E2E TS, R7]`.
4. **RHB ID / invoice Ref No** for chassis purchases uses the first 8 alphanumeric characters of the chassis `[E2E TS, R7]`.
5. **New Chassis Number search filter** on UCD and BO JomCheck Transaction Listing, and on BO SST Payment Report (JomCheck) `[SnF Functionality, R6–R12, R22–R29, R38–R45]`.
6. **Vehicle-number flow unchanged** — re-tested as regression, now asserting Chassis No "-" `[Regression TS, R7]`.
7. **Price not changed by this ticket.** The TS expects "RM18.00 + 8% Service Tax" throughout. Jira comment, Lim Yi Link, 2026-03-11: "As confirmed with Ops team, this ticket will not include the RM2 increment." The RM20 change moved to EAINT-10089 `[Jira capture, Comments]`.

## 3. Scenarios

### 3a. Regression TS (vehicle-number path)

1. **6475_REG_TS01** (Main UCD) — E2E happy flow by vehicle number → "Report is retrieved successfully. You can download the report now or access it later through the JomCheck report listing."; Chassis No "-" in listing/export/SST report, "NOT AVAILABLE" in JomCheck Report `[R5–R7]`.
2. **6475_REG_TS02** (Sub UCD) — JomCheck API down at Submit → "Jomcheck API is temporarily unavailable now, please try again in 10 minutes."; Tx "Failed"; "[Pay Now] button is NOT SHOWING" `[R8]`.
3. **6475_REG_TS03** (Main UCD) — payment OK, Tx Failed → "Failed to retrieve report"; "Ensure both Vehicle & Chassis Number are NOT editable."; "Ensure the Resubmit button is NOT displayed." Before deployment on staging/eauto, after on staging/sit2 `[R9–R10]`.
4. **6475_REG_TS04** (Sub UCD) — RHB payment Failed → [Retry] → Approved; same document checks as TS01 `[R11–R13]`.
5. **6475_REG_TS05** (Main + Sub UCD) — same company, same / different vehicle number at the same time → "Verify 2 Jomcheck transactions will be created with Tx status = Approved" `[R14]`.
6. **6475_REG_TS06** (2 Sub UCDs) — simultaneous [Submit] and [Pay Now], different vehicle numbers → 2 Approved transactions `[R15]`.

### 3b. Functional TS — UI

1. **JC_6475_TS1** — UI components; default radio = Vehicle Number; Results text "Enter either vehicle number or chassis number to retrieve JomCheck Report." `[R7]`.
2. **JC_6475_TS2** — field states per radio; chassis reminder text; "Only ONE radio button can be selected at a time." `[R8]`.
3. **JC_6475_TS3** — vehicle filled, switch to chassis → "Vehicle Number field is auto-cleared" `[R9]`.
4. **JC_6475_TS4** — chassis filled, switch to vehicle → "Chassis Number field is auto-cleared" `[R10]`.
5. **JC_6475_TS5** — Submit empty on Vehicle → "This field is required" under Vehicle Number `[R11]`.
6. **JC_6475_TS6** — Submit empty on Chassis → "This field is required" under Chassis Number `[R12]`.
7. **JC_6475_TS7** — vehicle typed, chassis set via F12 console → "Verify Vehicle Number value auto-cleared" `[R13]`.
8. **JC_6475_TS8** — chassis typed, vehicle set via F12 console → "Verify Chassis Number value auto-cleared" `[R14]`.

### 3c. Functional TS — chassis input (each by typing, Ctrl+C/V, right-click copy, Ctrl+X/V, right-click cut)

1. **JC_6475_TS9** — alphabets only ("Testingvehicle") → submitted without errors `[R16]`.
2. **JC_6475_TS10** — numbers only ("12345") → submitted without errors `[R17]`.
3. **JC_6475_TS11** — alphanumeric ("Testingvehicle12345") → submitted without errors `[R18]`.
4. **JC_6475_TS12** — special characters → "System auto removes special characters (except for * / -)"; Remark "Ask about the spacing part" `[R19]`.
5. **JC_6475_TS13** — Chinese characters ("ABC123王", "XYZ#测试") → "System auto-removes or trims invalid characters (e.g., Chinese characters)" `[R20]`.
6. **JC_6475_TS14** — lowercase ("abc123xyz") → "System auto-converts lowercase letters to uppercase before processing (e.g., "ABC123XYZ" )" `[R21]`.
7. **JC_6475_TS11 (second use)** — over 30 characters → "System blocks further input after 30 characters"; **not run**, Remark "Deprioritised as no limit set for Chassis Number" `[R22]`.

### 3d. E2E TS (chassis path)

1. **6475_E2E_TS01** (Main UCD) — chassis happy flow → "Chassis Number found. Pay now (RM18.00 + 8% Service Tax) to purchase the report"; Vehicle No "-" across surfaces `[R5–R7]`.
2. **6475_E2E_TS02** (Sub UCD) — chassis not found → "Chassis not found. Try again with another chassis", Tx Pending → [Try Again] with a valid chassis → Approved `[R8–R11]`.
3. **6475_E2E_TS03** (Main UCD) — chassis not found → [Try Again] with a **vehicle** number → Approved; vehicle-style documents `[R12–R15]`.
4. **6475_E2E_TS04** (Sub UCD) — vehicle not found ("Vehicle not found. Try again with another vehicle") → [Try Again] with a chassis → Approved `[R16–R19]`.
5. **6475_E2E_TS05** (Main UCD) — dev takes JomCheck API down after Submit, before [Pay Now] → "Jomcheck API is temporarily unavailable now, please try again in 10 minutes."; "Failed to retrieve report."; status "FAILED" `[R20]`.
6. **6475_E2E_TS06** (Sub UCD) — payment OK, Tx Failed by chassis → Resubmit not shown; fields not editable; chassis shown, vehicle "-" `[R21–R22]`.
7. **6475_E2E_TS07** (Main UCD) — RHB payment Failed → [Retry] → Approved, by chassis `[R23–R25]`.
8. **6475_E2E_TS08** (Main + Sub UCD) — same company, same chassis at the same time → 2 Approved `[R26]`.
9. **6475_E2E_TS09** (2 Sub UCDs) — simultaneous payment, different chassis numbers, Chrome + Firefox → 2 Approved `[R27]`.

### 3e. SnF Functionality (Chassis No)

1. **JOMUCDSF_TS1** (UCD listing, regression) — default [Search Now] → "Display all records" `[R5]`.
2. **JOMUCDSF_TS2** (UCD listing, Chassis Number) — empty / full / partial / `* - /` match; other special, Chinese, not found → "No record found. Try again" `[R6–R12]`.
3. **JOMUCDSF_TS3** (UCD listing) — chassis + vehicle together → "No record found. Try again" `[R13]`.
4. **JOMUCDSF_TS4** (UCD listing, Vehicle No., regression) — empty / full / partial match; special, Chinese, not found → "No record found. Try again." `[R14–R19]`.
5. **JOMBOSF_TS1** (BO listing) — default [Search Now] → "System will prompt 'Please select From Date and To Date.'" `[R21]`.
6. **JOMBOSF_TS2** (BO listing, Chassis Number) — empty / full / partial / `* - /` match; others → "Displays "0 record(s) in total" `[R22–R28]`.
7. **JOMBOSF_TS3** (BO listing) — chassis + vehicle together → "0 record(s) in total" `[R29]`.
8. **JOMBOSF_TS4** (BO listing, Vehicle No., regression) — empty, invalid, full, partial, special, Chinese `[R30–R35]`.
9. **JOMBOSF_TS5** (BO SST Payment Report (JomCheck)) — default [Generate] → "SST Payment Report will be shown for current date" `[R37]`.
10. **JOMBOSF_TS6** (SST report, Chassis Number) — empty → all; full → match; **partial and `* - /` → "No result found! Please refine your search criteria and generate report again."** `[R38–R44]`.
11. **JOMBOSF_TS7** (SST report) — Created Date + Chassis Number + Payment Mode + Payment To → "Display record matching search filter" `[R45]`.
12. **JOMBOSF_TS8** (SST report, Vehicle No., regression) — full → match; **partial → "No result found! …"** `[R46–R51]`.

### 3f. Sheet1 (not this ticket)

1. **9786_E2E_TS1–TS5** — System Maintenance popup by chassis number. Belongs to EAINT-9786. TS1 Remark: "Deprioritise since Chassis Number field doesnt have enquiry in Submit button" `[Sheet1, R3]`. All "Not Started" or blank.

## 4. Business rules and system behaviour

1. **Default mode:** "Vehicle Number radio button is selected by default." `[Functional TS, R7]`.
2. **Chassis reminder:** "Please enter valid Chassis Number to purchase the JomCheck Report. Payments are strictly non-refundable if the report cannot be generated due to an invalid Chassis Number." `[Functional TS, R8]`.
3. **Mutual exclusion:** switching radio clears the other field, even when that field was filled through the console `[Functional TS, R9–R10, R13–R14]`.
4. **Chassis cleaning:** keeps `* / -`; removes other specials and Chinese; uppercases `[Functional TS, R19–R21]`. **Spaces unresolved** — Remark "Ask about the spacing part" `[Functional TS, R19]`.
5. **No length limit:** "Deprioritised as no limit set for Chassis Number" `[Functional TS, R22]`.
6. **Found / not-found texts:** "Chassis Number found. Pay now (RM18.00 + 8% Service Tax) to purchase the report" `[E2E TS, R5]`; "Chassis not found. Try again with another chassis, Tx status = Pending" `[E2E TS, R8]`; "Vehicle not found. Try again with another vehicle, Tx status = Pending" `[E2E TS, R16]`.
7. **Not-found leaves Tx Pending**, and [Try Again] can switch mode (chassis → vehicle, vehicle → chassis) `[E2E TS, R12–R13, R16–R17]`.
8. **Payment popup (verbatim, EN):** "Are you sure you want to proceed with this payment? Please ensure that there is sufficient fund in your RHB account." Buttons "[No] [Yes] [X]" `[E2E TS, R6]`.
9. **RHB ID / Ref No for chassis:** "With ONLY the first 8 alphanumeric characters displayed"; "Example, if UCD input Chassis Number = ABCD-E12 4UYB, then RHB ID will display = JOM241021000012-ABCDE124" `[E2E TS, R7]`.
10. **Invoice by chassis:** "Vehicle Number field is NOT Displayed" `[E2E TS, R7]`.
11. **Empty-side display:** listings, BO export, SST report show "-"; the JomCheck Report PDF shows "NOT AVAILABLE" (chassis-bought: "NOT AVAILABLE” TBC") `[E2E TS, R7]`. Remark: "The vehicle column part showing blank or "-" will need to confirm with BA ⏎ ⏎ Update: Confirmed to remain "-"" `[E2E TS, R7]`.
12. **Failed retrieve:** "Both Vehicle & Chassis Number are NOT editable" and "The Resubmit button is NOT displayed." `[E2E TS, R22]`.
13. **Listing search is one-sided:** "Note: If search using chassis number system will not return any record with vehicle number (Vehicle No column = blank )" `[SnF Functionality, R6]`; chassis + vehicle together returns nothing `[SnF Functionality, R13, R29]`.
14. **Partial match differs by page:** UCD and BO JomCheck Transaction Listing — "Displays records matching the partial chassis number" `[SnF, R8, R24]`; BO SST Payment Report — partial gives "No result found! Please refine your search criteria and generate report again." `[SnF, R40, R49]`.
15. **No-result texts differ by page:** UCD "No record found. Try again" `[SnF, R10]`; BO listing "0 record(s) in total" `[SnF, R26]`; SST report "No result found! Please refine your search criteria and generate report again." `[SnF, R40]`.
16. **SST report + Chinese:** Remark "Will show error(Existing)" `[SnF, R43, R51]` — a pre-existing error, not raised under this ticket.
17. **Concurrency:** same company, same number, two users → "2 Jomcheck transactions will be created with Tx status = Approved" `[E2E TS, R26]`.

## 5. Test data, environments, accounts

1. **Environment:** "Test environment: staging/sit2" `[Functional TS, R2]`. Regression TS03 before deployment on "staging/eauto", after on "staging/sit2" `[Regression TS, R9–R10]`.
2. **Accounts:** Main UCD, Sub UCD, two Sub UCDs of the same company; BO user. **No credentials in the sheet.**
3. **Vehicle numbers used:** "TESTINGVEHICLE0019999" `[Regression TS, R7]`; "TY889045" `[Regression TS, R13]`.
4. **Simulator:** chassis E2E ran on eSIM — "E2E with esim OK, however pending on fixes to display vehicle number for selected areas if purchase report via chassis no." `[E2E TS, R5]`.
5. **API switching:** "JomCheck Report might need to check again after switching back to JomCheck API" `[Regression TS, R7, R13]`; "Ideally to test with JomCheck API as required to get the matching vehicle no <> chassis no" `[E2E TS, R5]`.
6. **Dev help needed:** API down — "Ask dev to bring down JomCheck API" `[E2E TS, R20]`; failed-retrieve chassis — "to check with dev which chassis no can trigger this scenario" `[E2E TS, R21]`.
7. **Browsers:** "Perform on Chrome Incognito for different browser" `[Regression TS, R14]`; "Perform on Chrome and Firefox for different browser" `[E2E TS, R27]`.

## 6. Gaps and risks for regression

1. **30-character limit never tested** `[Functional TS, R22]`. Already flagged in `flow-jomcheck.md` §11f.
2. **Spaces in chassis never settled** — "Ask about the spacing part" `[Functional TS, R19]`. The RHB ID example drops the space `[E2E TS, R7]`, but whether the stored chassis keeps it is unknown [unconfirmed].
3. **Vehicle ↔ chassis matching only seen on eSIM.** Real JomCheck API run is noted as "Ideally" `[E2E TS, R5]`, not recorded as done [unconfirmed].
4. **JomCheck Report "NOT AVAILABLE" is "TBC"** for chassis purchases `[E2E TS, R7]`. No row closes it.
5. **API down at Submit by chassis not tested.** Regression TS02 covers vehicle only `[Regression TS, R8]`; E2E TS05 takes the API down after Submit `[E2E TS, R20]`. Sheet1 says chassis Submit has no enquiry `[Sheet1, R3]` [unconfirmed].
6. **Resubmit on BO not checked** here; only UCD hiding is asserted `[E2E TS, R22]`. EAINT-9203 later set BO to keep it (`flow-jomcheck.md` §5a item 3).
7. **Price is RM18 in this TS**; production now uses RM20 (EAINT-10089). Any reuse of these rows must update the price text.
8. **Known regressions (Jira sub-tasks)** worth re-running: "EAINT-10100 … RHB ID under Payment Details in Transaction Details Page is displaying incorrectly"; "EAINT-10101 … Vehicle Number field in Invoice and e-Invoice is blank for transactions created from Chassis Number"; "EAINT-10105 … JomCheck report filename to follow vehicle number"; "EAINT-10106 … Chassis No Field Missing in Transaction Listing CSV Export"; "EAINT-10121 … Chassis Number field remains greyed out after clicking back in Browser after JomCheck Purchase"; "EAINT-10122 … Vehicle Number overtakes Chassis Number when switching radio buttons before clicking on Submit button" `[Jira capture, item 9]`.
9. **e-Invoice not covered** in the sheet, though EAINT-10101 names it `[Jira capture, item 9]`.
10. **Duplicate id JC_6475_TS11** `[Functional TS, R18, R22]` — evidence filenames could collide.
11. **Jira sub-task ranges do not match sheet ids** — e.g. "EAINT-7124 [QA] [Regression TS] JC_6475_TS22-TS27" vs sheet "6475_REG_TS01–06" `[Jira capture, item 9]`. The sheet was renumbered after the sub-tasks [unconfirmed].

## 7. Knowledge vs this TS

1. **`flow-jomcheck.md` §5a item 1.2 and `business-rules-from-test-scenarios.md` §5 item 3.2** say "Chassis keeps * / - and spaces". The sheet only states "(except for * / -)" and leaves spaces as an open question `[Functional TS, R19]`. **Spaces claim is not supported** by this TS.
2. **Same two files cite "rows 19-22"** for the 30-character rule as a rule. R22 was deprioritised. `flow-jomcheck.md` §11f already corrects this; `business-rules-from-test-scenarios.md` §5 item 3.2 does not.
3. **EAINT-8638 BO JomCheck Report Listing** is exact-match (§5a item 2.3). This TS shows the **BO JomCheck Transaction Listing** accepts partial chassis/vehicle `[SnF, R24, R33]`. Different pages; no contradiction, but easy to conflate.
4. **Remaining items** in §5a item 1 match the sheet rows cited.

## Knowledge candidates

1. **Chassis RHB ID rule:** "With ONLY the first 8 alphanumeric characters displayed"; "Example, if UCD input Chassis Number = ABCD-E12 4UYB, then RHB ID will display = JOM241021000012-ABCDE124" `[SharePoint TS #050 EAINT-6475, sheet E2E TS, R7]`. Target: `flow-jomcheck.md`.
2. **Chassis reminder text** under the field (verbatim in §4 item 2) `[Functional TS, R8]`. Target: `flow-jomcheck.md` §5a.
3. **Results default text:** "Enter either vehicle number or chassis number to retrieve JomCheck Report." `[Functional TS, R7]`.
4. **Empty-side display:** "-" in listings/export/SST report, "NOT AVAILABLE" in the JomCheck Report; BA confirmed "-" `[E2E TS, R7 Remark]`.
5. **Partial match by page:** UCD/BO Transaction Listing partial = match; BO SST Payment Report (JomCheck) partial = "No result found! Please refine your search criteria and generate report again." `[SnF Functionality, R8, R24, R40, R49]`.
6. **No-result text by page** (§4 item 15) `[SnF Functionality, R10, R26, R40]`.
7. **BO listing default search** prompts "Please select From Date and To Date." `[SnF Functionality, R21]`.
8. **Correction:** drop "and spaces" from the chassis-keeps rule in `flow-jomcheck.md` §5a item 1.2 and `business-rules-from-test-scenarios.md` §5 item 3.2, or tag it [unconfirmed]; source Remark "Ask about the spacing part" `[Functional TS, R19]`.
9. **Correction:** mark the 30-character rule in `business-rules-from-test-scenarios.md` §5 item 3.2 as not tested, matching `flow-jomcheck.md` §11f `[Functional TS, R22]`.
10. **Price scope:** EAINT-6475 shipped at RM18; "this ticket will not include the RM2 increment" `[Jira comment, Lim Yi Link, 2026-03-11]`.
11. **Chassis Submit and maintenance enquiry:** "Deprioritise since Chassis Number field doesnt have enquiry in Submit button" `[Sheet1 (EAINT-9786 rows), R3]` — conflicts with E2E wording "Click [Submit] to trigger Jomcheck Pre-Search API, Chassis Number = Valid" `[E2E TS, R5]`. Needs a live check [unconfirmed].
