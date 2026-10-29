# EAINT-8781 — QA Team test script study (2026-10-28)

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8781-[eAuto-BackOffice] Company Account Listing & AATFPBT Account Listing To add filter and column for Decision Maker Details.md` (captured 28/10/2026, 9:40:20 am). Cell text only; formatting, colours and images are not kept.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-8781/EAINT-8781-jira.md` (captured 27/10/2026).
3. **Knowledge:** `knowledge/cr-test-scenario-catalogue.md` (row 084), `knowledge/business-rules-from-test-scenarios.md` (lines 664-669), `knowledge/flow-edereg.md` (lines 5523-5540), `knowledge/flow-ucd-company-listing.md`, `knowledge/flow-bo-shell.md`, `knowledge/production-regression-scope.md` (line 1035).
4. **Not read:** the SRD attachments (V0.1 .docx, V1.0 .docx, V1.0 .pdf). They are listed in Jira but no local copy exists. No `lib/ticketStudies.ts` entry for EAINT-8781 (grep found none).

## 1. Header

1. **Ticket:** EAINT-8781 — "🔴[eAuto-BackOffice] Company Account Listing & AATF/PBT Account Listing: To add filter and column for Decision Maker Details" (Jira capture, Summary).
2. **Portal / module:** **BackOffice** — "Manage Company Accounts > Company Account Listing" and "Manage AATF/PBT Account > AATF/PBT Account Listing" (sheet 8781, column Page).
3. **Workbook:** "EAINT-8781-[eAuto-BackOffice] Company Account Listing & AATFPBT Account Listing To add filter and column for Decision Maker Details.xlsx", library "eAuto - CR Test Scenarios", modified 24/11/2025, 11:59:02 pm.
4. **Sheets:** `8781` and `8735 ` (trailing space in sheet name).
5. **Scenario count:** **51**.
   1. Sheet 8781, Search & Filter (`8781_SNF_`): **37** rows. Ids **TS11 and TS30 do not exist** (numbering skips them).
   2. Sheet 8781, Column/Listing (`8781_CAL_`): **10** rows.
   3. Sheet 8735 (`8735_CAL_`): **4** rows.
6. **Results:** all 51 = **Pass**. Sheet 8781 records both "Prod Result" and "Test Result" = Pass on every row. Sheet 8735 records "Test Result" only.
7. **Testers (as written in column QA):** "Teck Yung" (R9-R27, R55-R64); "Teck Yung /Azfar (Prod)" (R33-R42); "Teck Yung / Nick (Prod)" (R43-R50). Sheet 8735 has no QA column.
8. **Dates:** "Retested on Prod on 24/11/2025" (sheet 8781, Remarks, R9-R49); "Retested on Prod on 24/11/2025 together with SNF" (R55-R64).
9. **Header blanks:** "Test environment:" (R3) and "Test objective:" (R5) are **empty**.
10. **Jira facts:** Status "Done"; Fix versions "S23.3-20251112 (2025-11-12), S23.6-20251124🌚 (2025-11-24)"; QA field "Muhammad Amirul Azfar Bin Kamarulazam"; comment by the BA, 2025-11-26: "This ticket has been deployed to Production on 24 November 2025 (Monday)."

## 2. What the ticket changed (as the TS shows it)

1. **Three new search filters** on both listings: "1. Decision Maker Name - default blank ⏎ 2. Decision Maker Contact Number- default blank ⏎ 3. Decision Maker Email Address - default blank" (sheet 8781, R10 and R33).
2. **Three new listing columns** on both listings: "Decision Maker Name", "Decision Maker Contact Number", "Decision Maker Email Address" (sheet 8781, R56-R58, R61-R63).
3. **Export CSV:**
   1. Company Account Listing: "Ensure all fields should show correctly" (sheet 8781, R59).
   2. AATF/PBT Account Listing: "Should NOT show any Decision Maker Details" (sheet 8781, R64). See the contradiction in section 4.
4. **Comma handling in CSV** (sheet 8735): "The exported CSV should show the full Decision Maker Name and Decision Maker Contact Number correctly in their own columns, without splitting." (R9, R11).

## 3. Scenarios

### A. Company Account Listing — Search & Filter (sheet 8781, R9-R27)

1. **8781_SNF_TS01** — login. Expected: "Login succesfully to the main dashboard".
2. **TS02** — filters on landing. Expected: three Decision Maker filters, each "default blank".
3. **TS03** — [Search] with no filter. Expected: "Returns all records".
4. **TS04-TS07** — Decision Maker Name: empty → "Returns all records"; full → "Displays records matching the Decision Maker Name"; partial → "System displays all records matching the partially entered Decision Maker Name."; not found → "Display empty list".
5. **TS08-TS10, TS12** — Decision Maker Contact Number: same four cases, same expected wording.
6. **TS13-TS16** — Decision Maker Email Address: same four cases, same expected wording.
7. **TS17** — "Company Name + Decision Maker Name + Decision Make Email Address". Expected: "Displays records matching all selected criteria".
8. **TS18** — Name + Contact No + Email. Same expected.
9. **TS19** — Company Name + Name + Contact No + Email. Same expected.
10. **TS20** — "Apply all Search and Filter". Same expected.

### B. AATF/PBT Account Listing — Search & Filter (sheet 8781, R33-R50)

1. **TS21-TS39** (no TS30) mirror A.2-A.10 on "Manage AATF/PBT Account > AATF/PBT Account Listing". Module column is blank on these rows.
2. **TS39** carries the only issue remark (see section 4, item 5).

### C. Columns and Export (sheet 8781, R55-R64)

1. **8781_CAL_TS01** — Company listing: search a company with Decision Maker data, "eg: azfar1". Expected: "-The system will displays record matching the Company Name".
2. **CAL_TS02-TS04** — Company listing columns Name / Contact Number / Email Address. Expected: column "should be displayed in the listing table" and "The value shown must match the corresponding … maintained in the BackOffice record."
3. **CAL_TS05** — Company "Export CSV". Expected: "Ensure that the CSV can be successfully downloaded and opened without any errors." and "Ensure all fields should show correctly".
4. **CAL_TS06** — AATF/PBT listing search, "eg: azfaraatf". Same expected as CAL_TS01.
5. **CAL_TS07-TS09** — AATF/PBT listing columns. Same expected as CAL_TS02-TS04.
6. **CAL_TS10** — AATF/PBT "Export CSV". Expected: CSV opens without errors and "Should NOT show any Decision Maker Details".

### D. CSV comma handling (sheet 8735, R8-R11)

1. **8735_CAL_TS01** — Company listing: company "contains comma in all name related fields", Export CSV. Expected: CSV downloads and opens.
2. **8735_CAL_TS02** — verify the CSV. Expected: full Name and Contact Number "in their own columns, without splitting."
3. **8735_CAL_TS03-TS04** — same two checks on AATF/PBT Account Listing.

## 4. Business rules and system behaviour

1. **Filters default blank** — "Decision Maker Name - default blank" (sheet 8781, R10, R33).
2. **Partial match** on all three filters — "System displays all records matching the partially entered Decision Maker Name." (sheet 8781, R14; same pattern R18, R22, R37, R41, R45). Jira sub-task EAINT-9131 "Search – Partial search not working for Decision Maker Name, Contact Number & Email Address" shows this failed before the fix.
3. **Combined filters use AND** — "Displays records matching all selected criteria" (sheet 8781, R24-R27, R47-R50).
4. **Not found = empty list** — "Display empty list" (sheet 8781, R15, R19, R23, R38, R42, R46).
5. **Known existing Email Address search quirk (AATF/PBT)** — "Nick: Found existing issue related to 'Email Address' field where some return result, but some don't ⏎ ⏎ As checked with dev, it is an existing query logic and BA (MJ) will want to understand further next week if any changes required" (sheet 8781, R50, Remarks). Already in `knowledge/flow-edereg.md` item 6. Outcome of the BA follow-up is not recorded [unconfirmed].
6. **Listing value = BackOffice record** — "The value shown must match the corresponding Decision Maker Name maintained in the BackOffice record." (sheet 8781, R56).
7. **CONTRADICTION — AATF/PBT CSV and Decision Maker details.**
   1. Sheet 8781, R64 (CAL_TS10): "Should NOT show any Decision Maker Details".
   2. Sheet 8735, R11 (8735_CAL_TS04, AATF/PBT Account Listing): "The exported CSV should show the full Decision Maker Name and Decision Maker Contact Number correctly in their own columns, without splitting."
   3. Both are marked Pass. Either the AATF/PBT CSV changed between the two sheets, or one row is mislabelled [unconfirmed]. The SRD would settle it; it was not read. `knowledge/flow-edereg.md` item 5 records only the R64 version.
8. **Jira QA-Issue sub-tasks** (Jira capture, line 13), revealing defects found during testing:
   1. "EAINT-9089 … Decision Maker Columns - Column width alignment issue"
   2. "EAINT-9109 … Export CSV – All name related fields become misaligned when containing commas" — the reason sheet 8735 exists [unconfirmed].
   3. "EAINT-9131 … Search – Partial search not working …"
   4. "EAINT-9200 … Export CSV shows all records instead of only filtered search results when only search using Decision Maker Name, Decision Maker Contact Number and Decision Maker Email Address"
   5. "EAINT-9241 … Export CSV - Blank space between Label Name and Listing"
9. **Sheet quirks (wording errors in the TS, not system behaviour):**
   1. CAL_TS06 on AATF/PBT says "1. Back Office > Manage Company Accounts" (R60); CAL_TS07-TS09 say "in the Company Account Listing" (R61-R63).
   2. 8735_CAL_TS03 (AATF/PBT) uses "eg: azfar1", the Company example (R10).
   3. Header order differs: R7 "Prod Result | Test Result"; R54 "Test Result | Prod Result".

## 5. Test data, environments, setup

1. **Environment:** not stated — "Test environment:" (R3) is blank. Remarks show a **Production retest** on 24/11/2025; the original test environment is unknown [unconfirmed staging].
2. **Example accounts:** "azfar1" (Company, R55, sheet 8735 R8 and R10) and "azfaraatf" (AATF/PBT, R60). These are company search values, not logins.
3. **Data need:** companies with Decision Maker Name, Contact Number and Email filled; for sheet 8735, a company that "contains comma in all name related fields" (sheet 8735, R8).
4. **Credentials:** none in the sheet.

## 6. Gaps and risks for regression

1. **Export after filter not tested.** No row checks that Export CSV honours the Decision Maker filters, yet EAINT-9200 was raised for exactly that.
2. **AATF/PBT CSV content unclear** (section 4, item 7). Regression must check the live CSV and record what it really holds.
3. **Company CSV column position** not checked here. `knowledge/business-rules-from-test-scenarios.md` line 664 places Decision Maker columns "between 'State' and 'UCD Vehicle Type'" (from EAINT-8644 & 8645 TS).
4. **Column width** (EAINT-9089) and **blank space in CSV** (EAINT-9241) have no TS rows.
5. **Email Address partial search on AATF/PBT** is flaky by design (R50). Use more than one email value and do not treat an empty result as a new defect without checking.
6. **No negative input cases**: special characters, leading/trailing spaces, case sensitivity, long values, contact number with "+60" or dashes.
7. **Records with empty Decision Maker details**: how the column and CSV show blanks is not tested (EAINT-8645 TS says empty = " - " for Company CSV).
8. **Limited-features listing:** `knowledge/flow-bo-shell.md` line 78 lists "Company Account Listing (Limited Features For UCD To UCD)". Whether the new filters/columns appear there is not covered [unconfirmed].
9. **Relevance:** EAINT-12348 (PBT as eDereg users) touches the AATF/PBT Account Listing; these filters are part of that page's regression set (`knowledge/flow-edereg.md` lines 5527-5528).

## Knowledge candidates

1. **`knowledge/flow-ucd-company-listing.md`** — add the three Decision Maker filters (default blank, partial match, AND with other filters) and three Decision Maker columns on Company Account Listing. Source: SharePoint TS EAINT-8781, sheet 8781, R10, R14, R24, R56-R58. The flow file currently has no Decision Maker entry.
2. **`knowledge/flow-edereg.md` item 5** — add a contradiction note: sheet 8735 R11 expects AATF/PBT CSV to show "the full Decision Maker Name and Decision Maker Contact Number correctly in their own columns", against R64 "Should NOT show any Decision Maker Details". Mark live behaviour as to-be-verified.
3. **`knowledge/business-rules-from-test-scenarios.md`** (near line 667) — known defects from testing: EAINT-9200 (export ignored Decision Maker filters), EAINT-9109 (comma split in CSV), EAINT-9131 (partial search), EAINT-9089 (column width), EAINT-9241 (CSV blank space). Source: Jira capture `_reference/tickets/Studying/EAINT-8781/EAINT-8781-jira.md` line 13.
4. **`knowledge/cr-test-scenario-catalogue.md` row 084** — note TS ids 8781_SNF_TS11 and TS30 are absent (count 47 still correct); header R3 "Test environment:" blank; retest on Production 24/11/2025. Source: sheet 8781, R3, R9-R50.
