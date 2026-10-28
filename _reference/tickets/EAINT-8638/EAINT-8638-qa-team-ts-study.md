# EAINT-8638 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study; no other file changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8638 - 🔴[eAuto-BackOffice] To Create JomCheck Report Listing.md` (text copy dated "27/10/2026, 8:55:48 pm"; cell text only, no formatting or images).
2. **Jira capture:** `_reference/tickets/Studying/EAINT-8638/EAINT-8638-jira.md` (captured 27/10/2026, 8:18:24 pm).
3. **Knowledge:** `knowledge/flow-jomcheck.md` (§2, §3 item 2, selectors list, §7j, §7q item 6, §7v, §10d, OQ-15), `knowledge/business-rules-from-test-scenarios.md` item 6, `knowledge/cr-test-scenario-catalogue.md` row 073, `knowledge/environments-history.md`, `knowledge/production-regression-scope.md`.
4. **`lib/ticketStudies.ts`:** no entry for EAINT-8638.
5. **Not read:** the SRD (v0.1 to v1.1, .docx/.pdf) is attached in Jira only; no local copy exists in `_reference/tickets/EAINT-8638/` or `_reference/tickets/Studying/EAINT-8638/`. Nothing below is sourced to the SRD.
6. **Not available:** the original .xlsx (colours, comments, images). Cell formatting cannot be checked.

## 1. Header

1. **Ticket:** EAINT-8638 — "🔴[eAuto-BackOffice] To Create JomCheck Report Listing" (Jira item 5). Type Task, Status **Done** (Jira item 2).
2. **Module / portal:** **BackOffice (BO)** — JomCheck Report Listing, reached via "Settings (Hub Admin)" (sub-task EAINT-10486, Jira item 9; `knowledge/flow-jomcheck.md` selectors list).
3. **Workbook:** "EAINT-8638 - 🔴[eAuto-BackOffice] To Create JomCheck Report Listing.xlsx", library "eAuto - CR Test Scenarios", modified 16/06/2026, 11:59:57 am. Catalogue row **073**.
4. **Sheets (3):** "SnF Fields & Results", "E2E", "Authorized Users".
5. **Scenarios: 48 total.**
   1. SnF Fields & Results: **24** (8638_SnF_TS1–TS24).
   2. E2E: **11** (8638_TS1, TS2.1, TS2.2, TS3.1, TS3.2, TS4, TS5.1, TS5.2, TS6.1, TS6.2, TS7).
   3. Authorized Users: **13** (8638_PS_TS1–TS13).
6. **Results:** **48 Pass, 0 Fail, 0 blank.**
7. **Tester:** "Maisarah" in the QA column of every row; matches Jira QA field (cf 10041) "Maisarah Nuraliyaa Binti Masrom" (Jira item 3).
8. **Dates:** none written in the sheet. Jira: Fix version "S28.4-20260415🌚 (2026-04-15)", ETA for Testing "2026-04-10" (Jira items 4, 7).
9. **Environment:** not written in the sheet.

## 2. What the ticket changed, as the TS shows it

1. A new **BO "JomCheck Report Listing"** page that lists purchased JomCheck reports.
2. **Search by one of two fields:** Vehicle Number or Chassis Number ("Multifilter"); the field not chosen is greyed out (SnF Fields & Results, R5).
3. **Exact-match search**, buttons "Search Now", "Export" (CSV) and "Reset" (SnF Fields & Results, R18–R20, R25–R30).
4. **27 report columns** matching the JomCheck Report (E2E, R5).
5. **Restricted access:** 10 named BO accounts can see it; all other HubAdmin, Admin and Probation users cannot (Authorized Users, R4–R16).
6. **Audit log** of search and export with the BO username (SnF Fields & Results, R31).

## 3. Scenarios

### 3a. Search & Filter Fields (sheet "SnF Fields & Results", R5–R20)

1. **8638_SnF_TS1** — Vehicle/Chassis field toggle. Expected: "Both Vehicle Number and Chassis Number fields are displayed correctly and are selectable. Field not selected will be greyed out" (R5).
2. **8638_SnF_TS2** — Vehicle No typed. Expected: "Able to enter Vehicle Number" e.g. "MND2898" (R6).
3. **8638_SnF_TS3** — Vehicle No pasted (Ctrl+V and right-click). Expected: "Able to enter Vehicle Number" e.g. "NHD2106" (R7).
4. **8638_SnF_TS4** — Vehicle No lowercase. Expected: "Vehicle Number will be auto-capitalized" "MNH8022" (R8).
5. **8638_SnF_TS5** — Vehicle No special + non-ASCII typed. Expected: "Unable to fill in special Character and Chinese / non-ASCII Character" e.g. "MN12ABC999" (R9). Remark: EAINT-10493.
6. **8638_SnF_TS6** — same, pasted. Expected: "Unallowed special characters and Chinese / non-ASCII Character in the Vehicle Number will be automatically removed" (R10). Remark: EAINT-10493.
7. **8638_SnF_TS7** — Chassis typed. Expected: "Able to enter Chassis number" "1FTEF14E3BRA37249" (R11).
8. **8638_SnF_TS8** — Chassis pasted. Expected: "Able to enter Chassis number" (R12).
9. **8638_SnF_TS9** — Chassis lowercase. Expected: "Chassis Number will be auto-capitalized" "1FTEF14E3GRA37249" (R13).
10. **8638_SnF_TS10** — Chassis allowed specials. Expected: "Able to enter Chassis Number and the special characters are retained" "1FTE-F14e/3GRA 372*49" (R14).
11. **8638_SnF_TS11** — Chassis unallowed specials "1FTE~F1<4E]3GRA=372!49". Expected: "Unallowed special characters in the Chassis Number will be automatically removed" "1FTEF14E3GRA37249" (R15).
12. **8638_SnF_TS12** — Chassis special + non-ASCII typed. Expected: "Unable to fill in special Character and Chinese / non-ASCII Character" "1FTE*F14E3GRA372ABC49" (R16).
13. **8638_SnF_TS13** — same, pasted. Expected: "Unallowed special characters nd Chinese / non-ASCII Character in the Vehicle Number will be automatically removed" "1FTE*F14E3GRA372ABC49" (R17).
14. **8638_SnF_TS14** — "Search Now". Expected: "Result is displayed based on filter" (R18).
15. **8638_SnF_TS15** — "Export". Expected: "CSV is downloaded and contained filtered result" (R19).
16. **8638_SnF_TS16** — "Reset". Expected: "Fields and records are cleared" (R20).

### 3b. Search & Filter Results (sheet "SnF Fields & Results", R24–R31)

1. **8638_SnF_TS17** — field left empty. Expected: "Error message will display" (R24). Remark: EAINT-10487.
2. **8638_SnF_TS18** — full Vehicle Number. Expected: "Result will display matched the full Vehicle Number" (R25).
3. **8638_SnF_TS19** — partial Vehicle Number. Expected: "Result will display unmatched or "0 record(s) in total"" (R26). Remark: EAINT-10487.
4. **8638_SnF_TS20** — Vehicle Number not found. Expected: "Displays "0 record(s) in total"" (R27). Remark: EAINT-10509.
5. **8638_SnF_TS21** — full Chassis Number. Expected: "Result will display matching the full Chassis Number" (R28).
6. **8638_SnF_TS22** — partial Chassis Number. Expected: "Result will display unmatched or "0 record(s) in total"" (R29). Remark: EAINT-10487.
7. **8638_SnF_TS23** — Chassis Number not found. Expected: "Displays "0 record(s) in total"" (R30). Remark: EAINT-10509.
8. **8638_SnF_TS24** — Audit Log (Backend), search and export CSV. Expected: "Activity is recorded in backend along with BO account username" (R31).

### 3c. E2E (sheet "E2E", R5–R15)

1. **8638_TS1** — columns check. Expected: "1. Result will display matching the exact Vehicle Number or Chassis Number 2. All columns should same with JomCheck Report" (R5).
2. **8638_TS2.1 / TS2.2** — full Vehicle Number, search + export; New / Existing transaction. Expected: "Exported CSV match the filtered results shown in the listing" (R6–R7).
3. **8638_TS3.1 / TS3.2** — Vehicle Number "that have more than one Date of Loss"; New / Existing. Same expected (R8–R9).
4. **8638_TS4** — non-existing Vehicle Number. Expected: "1. Display "0 record(s) in total" 2. Exported CSV only contained columns and no data" (R10).
5. **8638_TS5.1 / TS5.2** — full Chassis Number; New / Existing. Expected (as written): "Result will display matching the full Vehicle Number" (R11–R12).
6. **8638_TS6.1 / TS6.2** — Chassis Number with more than one Date of Loss; New / Existing (R13–R14).
7. **8638_TS7** — non-existing Chassis Number. Same expected as TS4 (R15).

### 3d. Permission Scenarios (sheet "Authorized Users", R4–R16)

1. **8638_PS_TS1–TS10** — one row per allowed account. Expected: "1. Ensure able to see, make selection and fill in the fields and click "Search" button 2. Ensure able to export CSV and open the downloaded records" (R4–R13).
2. **8638_PS_TS11** — "Any other HubAdmin not specified" (R14).
3. **8638_PS_TS12** — "Any other Admin not specified" (R15).
4. **8638_PS_TS13** — "Any Probation not specified" (R16).
5. Expected for PS_TS11–13: ""JomCheck Report Listing" will be hidden for not authorized user" (R14–R16).

## 4. Business rules and system behaviour

1. **One filter at a time:** "Select Vehicle Number and Chassis Number will be greyed out ⏎ 2. Select chassis Number and Vehicle Number willbe greyed out" (SnF Fields & Results, R5).
2. **Uppercase:** "Vehicle Number will be auto-capitalized" (R8); "Chassis Number will be auto-capitalized" (R13).
3. **Vehicle Number strips all specials and non-ASCII:** input "MN@*12将ありกำகள卡$abc999" → "MN12ABC999" (R9, R10).
4. **Chassis keeps `-`, `/`, space and `*`:** "Able to enter Chassis Number and the special characters are retained ⏎ e.g.: "1FTE-F14e/3GRA 372*49"" (R14). `*` is kept again in R16 "1FTE*F14E3GRA372ABC49".
5. **Chassis strips `~ < ] = ! @ $` and non-ASCII** (R15, R16, R17).
6. **Typing vs paste:** typed invalid characters are blocked ("Unable to fill in", R9, R16); pasted ones are removed ("automatically removed", R10, R17).
7. **Exact match only:** "Partial Vehicle Number | Result will display unmatched or "0 record(s) in total"" (R26); same for Chassis (R29). Sub-task EAINT-10487: "Exact Vehicle Number and Chassis Number required for filtering result" (Jira item 9).
8. **Empty search:** "Left empty | Error message will display" (R24). Message text is not written [unconfirmed].
9. **No match (as the TS states):** "Displays "0 record(s) in total"" (R27, R30) and "Exported CSV only contained columns and no data" (E2E, R10, R15).
10. **Export is CSV** and holds the filtered result (R19; E2E R6–R15).
11. **Report columns (27), in TS order** (E2E, R5): "1. No. 2. Date & time 3 . Vehicle number 4. Chassis number 5. Transaction number 6. Total Loss History (Actual) 7. Total Loss History (BER) 8. Make/ Brand 9. Model 10. Year Make 11. Variant 12. Engine CC 13. Transmission 14. Avg. Market Value 15. Approx. New Car Price 16. Flood History 17. Windscreen Claim 18.Multiple Registration of Car Plate/ Chassis No. 19. Last Mileage Recorded 20. Accident Record 21.Date of Loss 22.Date of Authorized 23. Odometer Reading 24. Type of Claim 25. Total No of Parts Approved for Change 26. State in Malaysia 27. Incidents Severity Scale".
12. **Both New and Existing JomCheck transactions** show in the listing (E2E column "JomCheck Transaction (New/Existing)", R6–R14).
13. **Audit:** "Activity is recorded in backend along with BO account username" (R31). Backend only; no BO page named.
14. **Access is a named allow-list**, everyone else is hidden (Authorized Users, R4–R16).

### Changes or contradictions against knowledge/

1. **No-match message — superseded.** TS expects "0 record(s) in total" (R27, R30; E2E R10, R15). `knowledge/flow-jomcheck.md` §7q item 6 (live run 2026-10-05) records the table row "No records found. Please ensure there are existing JomCheck report purchase records." and `#result-summary` hidden. The R27/R30 remark links EAINT-10509 "To display error message when no records found" (Jira item 9), so the TS wording likely predates that fix [unconfirmed]. `flow-jomcheck.md` §3 item 2.4 already notes this.
2. **Column count — superseded.** TS lists **27** columns; `flow-jomcheck.md` §10d lists **29** (adds "Possible Total Loss" and "Possible BER", from EAINT-12339). Two names also differ: TS "Avg. Market Value" / "Approx. New Car Price" vs §10d "Avg. Market Value / Avg. Retail Price" / "Approx. New Car Price / Recommended Trade Price".
3. **Greyed-out timing.** TS R5 implies greying on selection. `flow-jomcheck.md` §7q item 6: `disabled` is applied "only after clicking search, not while typing" [source: Faizuddin, 2026-10-04].
4. **Export format.** TS says **CSV** (R19, E2E R6–R15). `flow-jomcheck.md` §2 says "JomCheck Report Listing (+ its Excel export)" and §7v item 2 says "The exported Excel is not the audit log". Sub-task EAINT-10506 "Exported CSV is in the wrong format" (Jira item 9). Current format not confirmed by this study [unconfirmed].
5. **Vehicle Number specials.** TS R9/R10 strips every special character. Sub-task EAINT-10493 is titled "Vehicle Number allowed special characters" and is linked in R9/R10 remarks. Which characters (if any) are allowed is not stated in the TS [unconfirmed].
6. **Agrees:** menu location under "Settings (Hub Admin)" (EAINT-10486; `flow-jomcheck.md` selectors list); permission-gated menu (`flow-jomcheck.md` §7j: Faizuddin's BO account lacks the link); audit-log page unknown (`flow-jomcheck.md` OQ-15, §7v).

## 5. Test data, environments, accounts, setup

1. **Environment:** not recorded in the sheet.
2. **Sample inputs:** vehicle "MND2898", "NHD2106", "mnh8022"; chassis "1FTEF14E3BRA37249", "1ftef14e3gra37249" (SnF Fields & Results, R6–R13). Whether these exist in any environment is not stated.
3. **Data needs:** a vehicle/chassis with "more than one Date of Loss" (E2E R8–R9, R13–R14), and both New and Existing JomCheck transactions (E2E R6–R14). How they were created (eSim or real data) is not stated.
4. **Allowed BO accounts (usernames only, Authorized Users R4–R13):** kmcheah, mfizni, eautonurul, eautosoyeng, eautokelvin, nikmuhamad, mfared, eautohaffiz, eautozara, jasons. **No passwords in the sheet.**
5. **Denied groups:** "Any other HubAdmin not specified", "Any other Admin not specified", "Any Probation not specified" (R14–R16).
6. **Backend access** needed for the audit-log check (R31).

## 6. Gaps or risks a regression should still cover

1. **No-match wording:** assert the live "No records found. Please ensure there are existing JomCheck report purchase records." — not the TS "0 record(s) in total".
2. **Header-only export on no match** — not yet checked live (`flow-jomcheck.md` §3 item 2.4).
3. **Pagination hidden at 0 records** — sub-task EAINT-10501 "To remove pagination control when "0 record(s) in total"" has no TS row.
4. **Chassis with special characters actually searchable** — sub-task EAINT-10505 "Unable to search for chassis numbers that contain special character" has no dedicated TS row; R14 only checks input.
5. **Export format and content** — EAINT-10506 "Exported CSV is in the wrong format"; confirm current file type and that columns match the 29-column listing.
6. **Column set now 29** — any regression built from this TS will miss Possible Total Loss / Possible BER.
7. **Empty-search error text** not recorded (R24).
8. **Audit log** — no BO page to check it; still OQ-15.
9. **Allow-list drift** — the 10 accounts are from 2026-04; staff changes may alter it [unconfirmed].
10. **Reset** — R20 does not say whether the greyed-out field is re-enabled.
11. **No date-range filter** on this listing per the TS; full-history searches could be slow on large data [unconfirmed].

### TS wording faults (do not copy)

1. **8638_SnF_TS12 / TS13** are chassis rows but say "Fill in Vehicle No" (R16, R17); TS13 expected also says "in the Vehicle Number".
2. **8638_TS5.x / TS6.x** chassis rows expect "matching the full Vehicle Number" (E2E R11–R14).
3. **8638_TS6.x** step 1 "Select Chassis Number that have more than one Date of Loss" merges two steps (E2E R13–R14).
4. **8638_TS7** step 1 "Select Vehicle Number" but fills a Chassis Number (E2E R15).
5. **PS rows** say "Search" button; SnF rows say "Search Now".

## 7. Related records

1. **Sub-tasks (Jira item 9):** EAINT-10486 (location), EAINT-10487 (exact match), EAINT-10493 (vehicle specials), EAINT-10501 (pagination at 0), EAINT-10505 (chassis specials search), EAINT-10506 (CSV format), EAINT-10509 (no-record message).
2. **Jira description dates mismatch:** version table reads "25.03.2025 (Wed)" … "08.04.2025 (Wed)", while SRD files are dated 2026 (e.g. "V1.1_20260408"). `knowledge/environments-history.md` records the QA Portal looking for a "deployment window of 15 April 2025 for EAINT-8638; fixed 2026-10-13".
3. **Later CR:** EAINT-12339 kept this page's rules — "JomCheck Report Listing filters, validation and restricted user access remain as defined in EAINT-8638." (`flow-jomcheck.md` line 1844).

## Knowledge candidates

1. **Paste vs type behaviour** (not yet in knowledge): typed invalid characters are blocked, pasted ones are removed. Source: "Unable to fill in special Character…" (sheet SnF Fields & Results, R9, R16) vs "…will be automatically removed" (R10, R17). Target: `knowledge/flow-jomcheck.md` §3 item 2.
2. **Allow-list of 10 BO accounts** for the Report Listing (usernames only). Source: sheet Authorized Users, R4–R13. Target: `knowledge/flow-jomcheck.md` §7j (explains why `faizuddinBO1` lacks the menu).
3. **Denied groups:** "Any other HubAdmin not specified", "Any other Admin not specified", "Any Probation not specified" → ""JomCheck Report Listing" will be hidden for not authorized user". Source: sheet Authorized Users, R14–R16.
4. **Original 27-column set** vs current 29 (EAINT-12339 added Possible Total Loss / Possible BER). Source: sheet E2E, R5; `flow-jomcheck.md` §10d. Target: §10d history note.
5. **Export format conflict** — TS says CSV (sheet SnF Fields & Results, R19); knowledge says Excel (`flow-jomcheck.md` §2, §7v). Needs a live check. [unconfirmed]
6. **Sub-tasks with no TS row** — EAINT-10501 (pagination at 0) and EAINT-10505 (chassis-with-specials search). Source: Jira item 9 vs workbook. Target: `knowledge/production-regression-scope.md` row EAINT-8638.
7. **Audit log is backend-only** — "Activity is recorded in backend along with BO account username" (sheet SnF Fields & Results, R31). Supports OQ-15 staying open.
8. **Chassis `*` retained** even in the mixed-input case: "1FTE*F14E3GRA372ABC49" (sheet SnF Fields & Results, R16). Target: `knowledge/business-rules-from-test-scenarios.md` item 6.2 (already lists "- / space *"; add the R16 example).
