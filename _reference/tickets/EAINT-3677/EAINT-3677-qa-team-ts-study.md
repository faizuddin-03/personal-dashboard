# EAINT-3677 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy (read in full):** `_reference/sharepoint/qa-team-ts/EAINT-3677 - [eAuto-BackOffice] JPJ Enquiry (New) eSTM to update based on eLKM.md` — one sheet, rows R1–R13. Cell text only; formatting and images not kept.
2. **Original workbook (not opened, text copy used instead):** `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-3677 - [eAuto-BackOffice] JPJ Enquiry (New) eSTM to update based on eLKM.xlsx`.
3. **Ticket folders:** `_reference/tickets/EAINT-3677/` and `_reference/tickets/Studying/EAINT-3677/` held no files before this study. No SRD, no Jira export, no HTML capture.
4. **lib/ticketStudies.ts:** no entry for EAINT-3677.
5. **knowledge/ (grep EAINT-3677):**
   1. `knowledge/cr-test-scenario-catalogue.md` row 046 (line 163) and Appendix A (line 385).
   2. `knowledge/business-rules-from-test-scenarios.md` §3 item 2 (lines 191-194).
   3. `knowledge/flow-estm.md` lines 732-735.
   4. `knowledge/flow-bo-shell.md` §3.7 lines 209-210 (menu entry only).
6. **Not read:** Jira ticket and SRD (not available locally; this run is offline and unattended).

## 1. Header

1. **Ticket:** EAINT-3677.
2. **Module / portal:** **BackOffice (BO)** › Support Tools › **JPJ Enquiry (New)** › eSTM tab.
3. **Workbook:** "EAINT-3677 - [eAuto-BackOffice] JPJ Enquiry (New) eSTM to update based on eLKM.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 01/07/2026, 11:09:33 am.
4. **Sheets:** one — "Sheet1".
5. **Columns:** "TS No. | Description | Test Scenario & Steps | Expected Result | QA | Test Result (P/F)" (Sheet1, R1).
6. **Scenarios:** **12 data rows** (R2–R13) under **7 distinct TS ids** (3677_TS01–TS07). The catalogue counts 9 (`cr-test-scenario-catalogue.md` line 163) [unconfirmed which counting rule it used].
7. **Result counts:** **none recorded.** The "QA" and "Test Result (P/F)" columns are empty on every row.
8. **Tester / dates in the sheet:** none written. SharePoint "Modified By" is a QA engineer per the catalogue (line 163, "Editor / Modified" = SharePoint metadata, not the author).

## 2. What the ticket changed, as the TS shows it

1. **Three new dropdowns** on BO JPJ Enquiry (New) › eSTM, after Vehicle No + GET: "1. LKM ⏎ 2. LKM Period ⏎ 3. eVOC" (Sheet1, R2).
2. **Dependent dropdowns:** LKM Period options depend on LKM, and LKM options depend on LKM Period (Sheet1, R6–R9).
3. **Request XML** sent on Search gains **three trailing fields:** LKM Indicator ~ LKM Duration ~ eVOC Indicator (Sheet1, R10–R13).
4. **Purpose** [unconfirmed, from title only]: let BO run a manual eSTM JPJ Enquiry that matches what the UCD eSTM flow sends when eLKM (road-tax renewal) and eVOC are included.

## 3. Scenarios

### A. New dropdown behaviour

1. **3677_TS01 (R2)** — Login BO › Support Tools › JPJ Enquiry (New) › eSTM › Vehicle No › GET. Expected: "Ensure the new fields are available as follows: ⏎ 1. LKM ⏎ 2. LKM Period ⏎ 3. eVOC".
2. **3677_TS01 (R3)** — Click LKM. Expected: "Dropdown will have two options as follows: ⏎ 1. Yes ⏎ 2. No".
3. **3677_TS01 (R4)** — Click LKM Period. Expected: "Dropdown will have the options as follows: ⏎ 1. 0 ⏎ 2. 6 ⏎ 3. 12".
4. **3677_TS01 (R5)** — Click eVOC. Expected: "Dropdown will have two options as follows: ⏎ 1. Yes ⏎ 2. No".
5. **3677_TS02 (R6)** — LKM = Yes, open LKM Period. Expected: "1. 6 ⏎ 2. 12".
6. **3677_TS03 (R7)** — LKM = No, open LKM Period. Expected: "1. 0".
7. **3677_TS04 (R8)** — LKM Period = 0, open LKM. **Expected result blank.**
8. **3677_TS05 (R9)** — LKM Period = 6 or 12, open LKM. **Expected result blank.**

### B. Request XML

1. **3677_TS04 (R10)** — LKM No, Period 0, eVOC No, Search. Expected: "LKM Indicator = N ⏎ LKM Duration = 0 ⏎ eVOC Indicator = N", sample ending "~N~0~N".
2. **3677_TS05 (R11)** — LKM Yes, Period 6, eVOC Yes. Expected: "LKM Indicator = Y ⏎ LKM Duration = 6 ⏎ eVOC Indicator = Y", sample ending "~Y~6~Y".
3. **3677_TS06 (R12)** — LKM Yes, Period 12, eVOC No. Expected: "LKM Indicator = Y ⏎ LKM Duration = 12 ⏎ eVOC Indicator = N", sample ending "~Y~12~N".
4. **3677_TS07 (R13)** — LKM No, Period 0, eVOC Yes. Expected: "LKM Indicator = N ⏎ LKM Duration = 0 ⏎ eVOC Indicator = Y", sample ending "~N~0~Y".

## 4. Business rules and system behaviour

1. **Entry path:** "Navigate to Support Tools > JPJ Enquiry (New) > eSTM" (Sheet1, R2). New fields appear only after "Click GET button" (Sheet1, R2).
2. **LKM values:** "Yes" / "No" (Sheet1, R3). **eVOC values:** "Yes" / "No" (Sheet1, R5).
3. **LKM Period values (unfiltered):** "0", "6", "12" (Sheet1, R4).
4. **LKM = Yes → Period 6 or 12:** "Dropdown will have the options as follows: ⏎ 1. 6 ⏎ 2. 12" (Sheet1, R6).
5. **LKM = No → Period 0 only:** "Dropdown will have the options as follows: ⏎ 1. 0" (Sheet1, R7).
6. **Reverse filter (Period → LKM)** is tested but its rule is not written (Sheet1, R8–R9 have no expected result). Likely Period 0 → LKM "No", Period 6/12 → LKM "Yes" [unconfirmed].
7. **Request XML is tilde-separated;** the new fields are the last three positions. Full sample: "1110050~2012300007-A~6~000606101712~1~MRV0138~SK9287629DH29876~ENH82763~1~10~Y~6~Y" (Sheet1, R11).
8. **Indicator codes:** Yes → "Y", No → "N"; Duration is the period number as-is ("0", "6", "12") (Sheet1, R10–R13).
9. **eVOC is independent of LKM:** "LKM Indicator = N ⏎ LKM Duration = 0 ⏎ eVOC Indicator = Y" is a valid request (Sheet1, R13).
10. **Where to see the XML:** the TS says "Observe the request XML" (Sheet1, R10) but does not name the screen. Probably the result area of JPJ Enquiry (New) or BO JPJ XML Log [unconfirmed].

## 5. Test data, environments, accounts, setup

1. **Account:** "Login as BO" (Sheet1, R2) — no user named. **No credentials present.**
2. **Vehicle No:** "Enter Vehicle No" (Sheet1, R2) — no value given.
3. **Sample XML values** (R10–R13) are examples only, e.g. vehicle "MRV0138", chassis "SK9287629DH29876", engine "ENH82763" [unconfirmed that these are the field meanings].
4. **Environment:** not stated in the sheet.

## 6. Gaps or risks a regression should still cover

1. **R8 and R9 have no expected result** — the Period → LKM filter is untested in writing.
2. **Duplicate TS ids:** 3677_TS04 and 3677_TS05 each appear twice (R8/R10 and R9/R11) for different checks. Evidence named by TS id will clash.
3. **No result recorded** — the sheet gives no proof the CR was tested on this sheet.
4. **Missing combination:** LKM Yes + Period 6 + eVOC No, and LKM Yes + Period 12 + eVOC Yes are not covered (only 4 of 6 valid combinations).
5. **No negative cases:** search with LKM blank, Period blank, or eVOC blank; GET with an invalid vehicle.
6. **No response check:** the TS checks only the request XML, not the JPJ response or how BO displays it.
7. **No link to the UCD eSTM flow:** does the UCD eSTM + eLKM + eVOC request produce the same tail? Not tested here.
8. **Default values** of the three dropdowns after GET are not stated.
9. **Reset behaviour:** whether switching LKM from Yes to No resets an already-picked Period 6/12 to 0 is not covered.
10. **Old JPJ Enquiry (non-"New")** at `/view/system/manual-jpj-enquiry/` is not mentioned; unknown if it was changed too.

## 7. Comparison with knowledge/

1. **Matches:** `flow-estm.md` lines 732-735 and `business-rules-from-test-scenarios.md` §3 item 2 already hold the core rules (fields, 6/12 vs 0, "~Y~6~Y"). No contradiction.
2. **Gap in knowledge:** `flow-bo-shell.md` line 210 lists "JPJ Enquiry (New) | `/<env>/view/system/new-manual-jpj-enquiry/` | no flow doc yet". This study adds the eSTM tab steps but no DOM.
3. **Count mismatch:** catalogue row 046 says 9 scenarios; the sheet has 12 data rows / 7 unique ids.
4. **Consistent with eLKM periods:** `business-rules-from-test-scenarios.md` §3 item 1 (EAINT-8534) also uses 6 or 12 months renewal.

## Knowledge candidates

1. **flow-bo-shell.md §3.7 / a future flow-bo-jpj-enquiry.md:** BO JPJ Enquiry (New) has an **eSTM** tab; steps "Enter Vehicle No", "Click GET button", then LKM / LKM Period / eVOC, then "Click Search button" `[from SharePoint TS #046 EAINT-3677, sheet Sheet1, rows 2, 10]`.
2. **business-rules-from-test-scenarios.md §3 item 2:** eVOC is independent of LKM — "LKM Indicator = N ⏎ LKM Duration = 0 ⏎ eVOC Indicator = Y" `[from SharePoint TS #046 EAINT-3677, sheet Sheet1, row 13]`.
3. **business-rules-from-test-scenarios.md §3 item 2:** unfiltered LKM Period options are "0", "6", "12" `[from SharePoint TS #046 EAINT-3677, sheet Sheet1, row 4]`.
4. **cr-test-scenario-catalogue.md row 046:** correct the count — 12 data rows, 7 unique TS ids, duplicate ids TS04/TS05, R8–R9 expected results blank, no results recorded `[from SharePoint TS #046 EAINT-3677, sheet Sheet1, rows 2-13]`.
5. **Lead to verify [unconfirmed]:** Period → LKM reverse filter (0 → No; 6/12 → Yes) — check live on staging BO before writing it as fact.
