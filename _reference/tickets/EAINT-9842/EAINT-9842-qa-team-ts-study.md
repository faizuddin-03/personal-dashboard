# EAINT-9842 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-9842 - [eAuto - BackOffice] To Add Audit Log for Bypass Purchase SSM (STMS & eSTM).md` (cell text only, created 27/10/2026, 9:01:12 pm). Formatting, colours and images are not in the copy.
2. **Ticket folders:** `_reference/tickets/EAINT-9842/` and `_reference/tickets/Studying/EAINT-9842/` held no files before this study.
3. **`lib/ticketStudies.ts`:** no entry for EAINT-9842.
4. **knowledge/** (grep `9842`): `flow-ssm.md`, `flow-stms.md`, `flow-bo-shell.md`, `business-rules-from-test-scenarios.md`, `cr-test-scenario-catalogue.md`, `production-regression-scope.md`.
5. **Not read:** the Jira ticket and the SRD. This run is unattended and has no Jira access. Nothing below comes from them.

## 1. Header

1. **Ticket:** EAINT-9842.
2. **Module / portal:** Back Office (BO), Settings (Hub Admin) › Bypass Purchase SSM (STMS & eSTM) Audit Log. URL `/<env>/view/bypass-purchase-ssm/audit-log.do` per `knowledge/flow-bo-shell.md:263`.
3. **Workbook:** "EAINT-9842 - [eAuto - BackOffice] To Add Audit Log for Bypass Purchase SSM (STMS & eSTM).xlsx". SharePoint library "eAuto - CR Test Scenarios", modified 28/05/2026, 5:37:56 pm.
4. **Sheets:** Search & Filter, Functionality, Permission.
5. **Scenarios:** **23 TS ids** across 33 step rows.
   1. Search & Filter: 12 ids (R2–R14; id `9842_SnF_TS12` is used on two rows, R13 and R14).
   2. Functionality: 4 ids (R2–R17, multi-step).
   3. Permission: 7 ids (R2–R8).
6. **Results:** every row is **"Pass"**. 23 / 23 Pass, 0 Fail.
7. **Tester:** QA column reads "Aliah" on every row (QA engineer).
8. **Dates:** none written in the sheet. Sample date text points to testing around March 2026: "Example: 2026-03-16 16:23:51.0" (Functionality R9) and "Selected Log Date From = 16 February 2026" (Search & Filter R4). Production deploy 20260603 per `knowledge/production-regression-scope.md:952`.

## 2. What the ticket changed, as the TS shows it

1. **New BO page:** "Bypass Purchase SSM (STMS & eSTM) Audit Log" under "Settings (Hub Admin)" (Functionality R2).
2. **What is logged:** ticking the **STMS** and **eSTM** checkboxes in the Permission column on the existing Bypass Purchase SSM (STMS & eSTM) Edit page creates an audit entry (Functionality R7–R9).
3. **Search panel:** Log Date From, Log Date To (date pickers), UCD Company Name (text), Search button, Reset hyperlink (Search & Filter sheet).
4. **Listing columns:** "1. # ⏎ 2. Date ⏎ 3. UCD Company Name ⏎ 4. UCD User Full Name ⏎ 5. By ⏎ 6. Description" (Search & Filter R10).
5. **Access:** limited to four named BO users; hidden for others (Permission sheet).

## 3. Scenarios

### 3.1 Search & Filter

1. **9842_SnF_TS01** — default dates. Expected: "Log Date From will be default to blank ⏎ Log Date To will be default to blank".
2. **9842_SnF_TS02** — From = 2 weeks back. Expected: "Log Date To will default to current date." and "Dates beyond the current date will be disabled and cannot be selected."
3. **9842_SnF_TS03** — From = 2 months back. Expected: "Log Date To will default to a maximum period of 30 days after Log Date From".
4. **9842_SnF_TS04** — type a normal company name. Expected: "Able to enter UCD Company Name".
5. **9842_SnF_TS05** — paste a normal company name (Ctrl+V and right-click). Expected: "Able to enter UCD Company Name".
6. **9842_SnF_TS06** — type special characters. Expected: "Able to fill in special Character in the UCD Company Name".
7. **9842_SnF_TS07** — paste special characters. Expected: "Able to fill in special characters in the UCD Company Name".
8. **9842_SnF_TS08** — Search with all blank. Expected: pop-up "Please select Log Date From and Log Date To".
9. **9842_SnF_TS09** — Search by date only. Expected: list "based on the searched date range", six columns.
10. **9842_SnF_TS10** — Search by company name only, dates blank. Expected: list "based on search UCD Company Name", six columns.
11. **9842_SnF_TS11** — Search by date + company name. Expected: list "based on the searched date range and the UCD Company Name".
12. **9842_SnF_TS12** (R13) — Search before Reset. Expected: list "based on selected filters".
13. **9842_SnF_TS12** (R14) — click Reset. Expected: "Reset the search & filter function to its default behaviour, blank." and "The listing will remain as displayed."

### 3.2 Functionality

1. **9842_Fx_TS01** — no bypass change today, search today. Expected: "No Records Found".
2. **9842_Fx_TS02** — tick STMS + eSTM for a user, then search today. Expected: Date format "YYYY-MM-DD HH:MM:SS.0", entries "on the current date & the changes made", sorted "from latest date time to the oldest date time".
3. **9842_Fx_TS03** — no change today, search 2 weeks. Expected: "The Date column will include dates in the 2 weeks range selected.", newest first.
4. **9842_Fx_TS04** — two BO users (jasons, mfared) make changes concurrently. Expected: "Ensure that both records are saved and displayed in the audit log listing."

### 3.3 Permission

1. **9842_PS_TS01** — jasons. Expected: sees menu, can search, listing shows.
2. **9842_PS_TS02** — mfared. Same expected result.
3. **9842_PS_TS03** — nikmuhamad. Same expected result.
4. **9842_PS_TS04** — mfizni. Same expected result.
5. **9842_PS_TS05** — "Any other HubAdmin not specified". Expected: "Bypass Purchase SSM (STMS & eSTM) Audit Log will be hidden for not authorized user".
6. **9842_PS_TS06** — "Any other Admin not specified". Same hidden result.
7. **9842_PS_TS07** — "Any Probation not specified". Same hidden result.

## 4. Business rules and system behaviour

1. **Dates start blank.** "Log Date From will be default to blank ⏎ Log Date To will be default to blank" (Search & Filter R2).
2. **To auto-fills.** "Log Date To will default to current date." (Search & Filter R3) when From is within the last 30 days.
3. **Max 30 days.** "Log Date To will default to a maximum period of 30 days after Log Date From ⏎ ⏎ e.g: Selected Log Date From = 16 February 2026, the default Log Date To = 18 March 2026" (Search & Filter R4).
4. **No future dates.** "Dates beyond the current date will be disabled and cannot be selected." (Search & Filter R3).
5. **Dates mandatory.** "Ensure the pop-up shows as "Please select Log Date From and Log Date To"" and "* This is due to Log Date From & Log Date To being mandatory fields" (Search & Filter R9).
6. **Contradiction — company-only search.** Search & Filter R11 (9842_SnF_TS10) says "Remain Log Date From & Log Date To as blank ⏎ Fill in UCD Company Name" and expects a listing, marked "Pass". This conflicts with rule 5. [unconfirmed] which is the live behaviour: the mandatory check may fire only when all fields are blank.
7. **Special characters accepted** in UCD Company Name: "DURA AUTO SDN BHD &, <, >  159, '!@#$%^&()(_+{}/\][:" (Search & Filter R7).
8. **Reset keeps the list.** "Reset the search & filter function to its default behaviour, blank. ⏎ ⏎ The listing will remain as displayed." (Search & Filter R14).
9. **Empty result text.** "No Records Found" (Functionality R4).
10. **Date format.** "Format: YYYY-MM-DD HH:MM:SS.0 ⏎ Example: 2026-03-16 16:23:51.0" (Functionality R9).
11. **Sort order newest first.** "Ensure that the result is displayed from latest date time to the oldest date time." (Functionality R9).
12. **Concurrent edits both logged.** "Ensure that both records are saved and displayed in the audit log listing." (Functionality R17).
13. **Bypass page listing columns:** "1. # ⏎ 2. UCD Company Name ⏎ 3. UCD Company ROC ⏎ 4. Action" (Functionality R5).
14. **Bypass Edit page columns:** "1. # ⏎ 2. UCD User Full Name ⏎ 3. Login ID ⏎ 4. MyKad No ⏎ 5. Branch ⏎ 6. Mobile No ⏎ 7. Email Address ⏎ 8. User Status ⏎ 9. Permission" (Functionality R6).
15. **Permission column holds two boxes:** "In the Permission column, tick right on the STMS checkbox ⏎ Tick right on the eSTM checkbox" (Functionality R7). No Save button step is written. [unconfirmed] whether ticking saves at once.
16. **Whitelist.** Allowed users: jasons, mfared, nikmuhamad, mfizni (Permission R2–R5). Others hidden: "Any other HubAdmin not specified", "Any other Admin not specified", "Any Probation not specified" (Permission R6–R8).

### 4.1 Fit with knowledge/

1. **Matches** `knowledge/flow-ssm.md:124` (mandatory dates, max 30 days, six columns) and `flow-ssm.md:134` (four named users, hidden from others).
2. **Matches** `knowledge/business-rules-from-test-scenarios.md:245-250`.
3. **Not yet in knowledge:** rule 6 contradiction, no-future-dates, newest-first sort, "No Records Found", Reset keeps the list, concurrent edit logging, the Bypass page and Edit page column lists.
4. **Wording gap:** `knowledge/flow-stms.md:290` says "max 1 month range"; the TS says "maximum period of 30 days". Same intent; 30 days is the sheet wording.
5. **Count gap:** `knowledge/cr-test-scenario-catalogue.md:177` gives "Search & Filter:12". The sheet has 12 ids on 13 rows (TS12 used twice).
6. **No flow doc:** `knowledge/flow-bo-shell.md:263` lists the audit-log page as "no flow doc yet".

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. [unconfirmed] staging.
2. **BO accounts:** jasons, mfared, nikmuhamad, mfizni (Login ID column, Permission sheet). **No passwords** in the sheet.
3. **Unauthorised roles:** other HubAdmin, other Admin, Probation users (unnamed).
4. **Company data:** "EAST HUAT AUTO SDN BHD" (search sample); "DURA AUTO SDN BHD &, <, >  159, '!@#$%^&()(_+{}/\][:" (special-character sample, input only).
5. **Setup precondition:** "Ensure NO Bypass Purchase SSM has been done on current date" (Functionality R2, R10).
6. **Concurrent setup:** "Login to Back Office concurrently as jasons & mfared" (Functionality R13).

## 6. Gaps and risks for regression

1. **Untick not tested.** Only ticking STMS/eSTM is covered. Unticking, and ticking one box only, are not.
2. **Description content not checked.** No row states what the "Description" or "By" cell should say.
3. **Rule 6 conflict.** Company-only search with blank dates passed, against the mandatory-date pop-up. Retest to settle which is true.
4. **30-day limit edge.** Only the auto-fill is tested. Manually picking a To date more than 30 days after From is not tested.
5. **From after To** (reversed range) not tested.
6. **Company name match type** (partial vs exact, case) not tested.
7. **Special-character search** only checks input, not that the search returns results.
8. **Pagination / large result sets** not tested.
9. **Export Excel** on the Bypass page (`flow-ssm.md:123`) not covered in this TS.
10. **Whitelist is hard-coded** [unconfirmed, per `flow-bo-shell.md:495`]. Check on deploy night that the four users still have access in production.
11. **Downstream effect** of the tick on UCD Step 2 / Step 4 is not re-checked here; that belongs to EAINT-8802.

## Knowledge candidates

1. **flow-ssm.md, Bypass audit log:** "Dates beyond the current date will be disabled and cannot be selected." — [from SharePoint TS EAINT-9842, sheet Search & Filter, row 3].
2. **flow-ssm.md:** result order "from latest date time to the oldest date time"; Date format "YYYY-MM-DD HH:MM:SS.0"; empty text "No Records Found" — [from SharePoint TS EAINT-9842, sheet Functionality, rows 4 and 9].
3. **flow-ssm.md:** Reset: "Reset the search & filter function to its default behaviour, blank. ⏎ ⏎ The listing will remain as displayed." — [from SharePoint TS EAINT-9842, sheet Search & Filter, row 14].
4. **flow-ssm.md:** concurrent BO edits: "Ensure that both records are saved and displayed in the audit log listing." — [from SharePoint TS EAINT-9842, sheet Functionality, row 17].
5. **flow-ssm.md, Bypass page DOM:** listing columns "# / UCD Company Name / UCD Company ROC / Action"; Edit page columns "# / UCD User Full Name / Login ID / MyKad No / Branch / Mobile No / Email Address / User Status / Permission" — [from SharePoint TS EAINT-9842, sheet Functionality, rows 5 and 6].
6. **flow-ssm.md Open questions:** mandatory dates (Search & Filter R9) vs company-only search with blank dates passing (Search & Filter R11). Tag [unconfirmed].
7. **cr-test-scenario-catalogue.md:177:** note Search & Filter has 13 rows, 12 ids (`9842_SnF_TS12` duplicated).
8. **flow-bo-shell.md:263:** link the audit-log page to `flow-ssm.md` "SSM permissions and Bypass Purchase SSM (BO settings)" instead of "no flow doc yet".
