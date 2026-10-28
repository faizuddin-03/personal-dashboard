# EAINT-8644 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of another QA engineer's test script. Nothing in `knowledge/`, `lib/` or `app/` was changed. First study 2026-10-27; re-studied 2026-10-28.

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-8644 & 8645 - Add New Fields & Export CSV -  Decision Maker Details & Showroom Address.md` (generated 28/10/2026, 12:52:22 am; the 2026-10-27 study used the copy generated 27/10/2026, 9:19:54 pm). Cell text only — **formatting, colours and images are not kept**. Sheet EAINT-8644 (COR) has two caption rows, "Company that haven't updated Company/Business Profile" (R26) and "Company that have updated Company/Business Profile" (R45), which likely sit above screenshots **[unconfirmed]**; those images were not seen.
2. **Previous study:** this file as written 2026-10-27. The previous text copy was overwritten, so the comparison below is against what that study quoted, not a cell-by-cell diff.
3. **Ticket folders:** `_reference/tickets/EAINT-8644/` holds only this study. `_reference/tickets/Studying/EAINT-8644/` does **not exist**. No SRD, no Jira export, no NOTES file.
4. **`lib/ticketStudies.ts`:** no entry for EAINT-8644 or EAINT-8645.
5. **knowledge/:** `business-rules-from-test-scenarios.md` (lines 658–666, 1030–1032), `cr-test-scenario-catalogue.md` (lines 223, 426), `production-regression-scope.md` (lines 1074–1075), `flow-bo-shell.md` (lines 71, 299), `flow-ucd-shell.md` (line 214), `flow-ucd-onboarding.md` (line 276).
6. **Not read:** Jira ticket, SRD, Teams. No access in this run, so ticket and SRD wording are **not** quoted.

## 1. Header

1. **Ticket:** EAINT-8644 (workbook also covers **EAINT-8645**).
2. **Module / portal:** **BO** Manage Company Accounts → Update Company Account (new fields), BO **Company Account Listing Export CSV**, and the **Company Confirmation of Registration (COR)** page on **UCD and BO** plus its PDF.
3. **Workbook:** "EAINT-8644 & 8645 - Add New Fields & Export CSV -  Decision Maker Details & Showroom Address.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 23/04/2026, 6:12:48 pm.
4. **Sheets (3):**
   1. **EAINT-8644 (FUNC)** — field validation and copy checkboxes, **142** scenarios: 71 for a new company account (`8644_NEW_TS1.1`–`TS10.5`, rows 4–75) and the same 71 for an existing account (`8644_EXS_TS1.1`–`TS10.5`, rows 81–152).
   2. **EAINT-8644 (COR)** — Confirmation of Registration screen and PDF, **10** scenarios (`8644_TS11.1`–`TS11.10`, rows 4–13).
   3. **EAINT-8645** — Export CSV, **5** scenarios (`8645_TS1`–`TS5`, rows 3–7).
5. **Total:** **157** scenarios (matches catalogue row 074).
6. **Results:** **157 PASS, 0 FAIL**. Sheet EAINT-8645, row 11 holds a stray value "93.63057324840764" (= 147/157 as a percentage). It does not match the all-PASS column; meaning **[unconfirmed]** — likely a progress formula left from mid-testing.
7. **Testers (QA column, as written):**
   1. "Nabila" — all NEW rows (FUNC 4–75), EXS TS6.1–TS10.5 (FUNC 128–152), COR TS11.6–11.10, all of EAINT-8645.
   2. "Charmain" — EXS TS1.1–TS5.9 (FUNC 81–127).
   3. "Nick" — COR TS11.1–11.5.
8. **Dates:** none written in the sheets. Production-regression scope lists deploy **20250826** for both tickets `[knowledge/production-regression-scope.md:1074-1075]`.

## Changes since last study (2026-10-28)

1. **Workbook content:** **no change detected.** The SharePoint modified date is the same as in the 2026-10-27 study ("23/04/2026, 6:12:48 pm"). Scenario count (157), ids, testers and results (all PASS) are unchanged. Only the text copy was regenerated.
2. **New / removed scenarios:** none.
3. **Result changes:** none. The stray "93.63057324840764" (EAINT-8645, row 11) is still present.
4. **Errors fixed in this study (were wrong on 2026-10-27):**
   1. **Row numbers for the NEW Decision Maker set.** Old study gave Name rows 9–17, Contact rows 18–28, Email rows 29–40. Correct: Name **4–12**, Contact **13–23**, Email **24–35**.
   2. **"EMPTY field" rows.** Old list "rows 9, 18, 29, 47, 56, 66, 68, 72". Correct: **4, 13, 24, 42, 51, 61, 63, 67**.
   3. **Unacceptable email specials kept.** Old study cited "FUNC row 107" as if NEW. Row 107 is **EXS_TS3.7**; the NEW row 30 does not say the characters stay.
   4. **Testers.** Old study said "Charmain (EXS TS1–TS5)" without saying who ran EXS TS6–TS10. It is **Nabila** (rows 128–152).
5. **Wording differences between NEW and EXS that the old study missed** (added to §3 G):
   1. EXS_TS8.1 (row 140) and EXS_TS9.1 (row 144) correctly say "EMPTY Showroom City field" / "EMPTY Showroom District field". The NEW rows 63 and 67 still say "EMPTY Showroom State field".
   2. EXS_TS9.4 (row 147) says "no district options"; NEW_TS9.4 (row 70) says "no city options".
   3. EXS_TS10.1 / 10.2 (rows 148–149) expect "Showroom Address Details fields" in the CSV; NEW rows 76–77 (TS10.1 / 10.2, sheet rows 71–72) still say "Decision Maker Details fields".
   4. EXS_TS5.5 (row 123) adds "System should auto-remove Space for the front, back space"; NEW_TS5.5 (row 46) only gives the trimmed result.

## 2. What the ticket changed, as the TS shows it

1. **New "Decision Maker Details" block** on the company account: **Name, Contact No, Email Address**, plus a **checkbox** that copies them from the **Director** details (sheet EAINT-8644 (FUNC), rows 4–40).
2. **New "Showroom Address" block** on the company account: **Address, Postcode, State, City, District**, plus a **checkbox** that copies them from the **Mailing Address** (rows 42–75).
3. **COR page and PDF** now show Showroom Address, City, Postcode, State (sheet EAINT-8644 (COR), rows 4–13).
4. **Company Account Listing Export CSV** (EAINT-8645) gains the Decision Maker and Showroom columns, and every export writes an **audit log** (sheet EAINT-8645, rows 3–7).
5. All new fields are **optional** — every "EMPTY" scenario expects "System should allow to Update Company Account" (FUNC rows 4, 13, 24, 42, 51, 61, 63, 67).

## 3. Scenarios, grouped

FUNC rows are quoted for the **NEW** set. The **EXS** set (rows 81–152) repeats them on an existing company; differences are listed in item G.

### A. Decision Maker — Name (`TS1.x`, FUNC rows 4–12)

1. **TS1.1** — empty Name → "System should allow to Update Company Account".
2. **TS1.2** — letters "Muhammad abu" → "System should display "MUHAMMAD ABU"".
3. **TS1.3** — digits "1232344234" → shown as entered.
4. **TS1.4** — alphanumeric → "MUHAMMAD123 ABU456".
5. **TS1.5** — leading/trailing/middle spaces → "System should auto-remove Spaces at Front and Back" and "Spaces in the middle of the Name is acceptable".
6. **TS1.6** — Chinese characters → "System will auto-remove Chinese characters", shows "MUHAMMAD ABU".
7. **TS1.7** — special characters "@Muhammad# abu&" → "System should display "@MUHAMMAD# ABU&"".
8. **TS1.8 / TS1.9** — 100 chars allowed; 101st → "System should NOT allow to enter the 101st character".

### B. Decision Maker — Contact No (`TS2.x`, FUNC rows 13–23)

1. **TS2.1** — empty → update allowed.
2. **TS2.2** — "0123456789" → shown as entered.
3. **TS2.3 / TS2.4** — letters removed; "012Abc6789" → "0126789".
4. **TS2.5** — " 012 345  6789 " → "0123456789".
5. **TS2.6** — Chinese digits removed → "".
6. **TS2.7** — "+60(12)-345*6789" → "60123456789".
7. **TS2.8** — 8 digits → "Decision maker’s contact number must be between 9 to 11 digits."
8. **TS2.9 / TS2.10** — 9 and 11 digits allowed.
9. **TS2.11** — 12th digit → "System should NOT allow to enter the 12th digit".

### C. Decision Maker — Email Address (`TS3.x`, FUNC rows 24–35)

1. **TS3.1** — empty → update allowed.
2. **TS3.2** — "Test-ing_123@test.com" → "System should auto-convert CAPITAL letters to small letters", shows "test-ing_123@test.com".
3. **TS3.3 / TS3.4** — letters-only and "123@456.789" accepted.
4. **TS3.5** — spaces → see rule 4.4 (tester remark disagrees with expected).
5. **TS3.6** — Chinese removed → "@.com".
6. **TS3.7** — "user#em!ail@exa~mp(le.com" → "Invalid email format for Decision Maker’s email."
7. **TS3.8** — "user_email-123@email.com" kept as entered.
8. **TS3.9** — "mftesting@gmail", "mftesting.com", "mftesting-gmail.com" → same invalid-format message.
9. **TS3.10** — 1 character "9" → same message.
10. **TS3.11 / TS3.12** — 100 chars allowed; 101st blocked.

### D. Decision Maker checkbox (`TS4.x`, FUNC rows 36–40)

1. **TS4.1** — tick → fields "should copy from Director details - Name, Contact Number & Email Address"; values in CSV.
2. **TS4.2** — tick then untick → fields "will be cleared"; CSV blank.
3. **TS4.3** — manual fill → saved and in CSV.
4. **TS4.4** — manual fill then tick → "Existing values will be override by Director's Details".
5. **TS4.5** — tick then edit → "Checkbox will be unticked whenever user edit the prepopulated fields".

### E. Showroom Address / Postcode / State / City / District (`TS5.x`–`TS9.x`, FUNC rows 42–70)

1. **TS5.1–5.7** — Address: optional, uppercased, Chinese removed, "All Special Characters allowed".
2. **TS5.8 / TS5.9** — 300 chars allowed; 301st blocked.
3. **TS6.1–6.7** — Postcode: optional, digits only; "A1B2C" → "12"; "#782#@" → "782"; "都对额23" → "23".
4. **TS6.8** — 4 digits → "Showroom postcode must be 5 digits only."
5. **TS6.9 / TS6.10** — 5 allowed; 6th blocked.
6. **TS7.1 / TS7.2** — State optional; list equals "BO > Manage Company Account > Update Company Account > State field".
7. **TS8.2 / TS9.2** — City and District list only the chosen State's options (e.g. "Shah Alam, Klang"; "Klang, Gombak").
8. **TS8.3 / TS9.3** — change State → "Verify City resets to default state" (same for District).
9. **TS8.4 / TS9.4** — no State → only "--Please Select--".

### F. Showroom checkbox (`TS10.x`, FUNC rows 71–75)

1. **TS10.1** — tick → Address, Postcode, State, City & District "will copy from Mailng Address fields"; values in CSV.
2. **TS10.2** — untick → all five cleared; CSV blank.
3. **TS10.3** — manual fill → saved and in CSV.
4. **TS10.4** — manual fill then tick → "Existing values will be override by Mailing Address Details".
5. **TS10.5** — tick then edit → checkbox unticks.

### G. EXS set (existing company) — rows where wording differs from NEW

1. **EXS_TS2.7** (row 96) — input "+60(12)-34 5*6789", expected "601234" (NEW expected "60123456789").
2. **EXS_TS3.4** (row 104) — "123@A.A"; expects both lowercase conversion and "Email should show "123@A.A" as per entered".
3. **EXS_TS3.5** (row 105) — rewritten: front/back spaces removed, middle kept, error "Invalid email format for Decision Maker’s email."
4. **EXS_TS3.7** (row 107) — "Email should show "user#em!ail@exa~mp(le.com"" plus the error (the characters are **not** removed).
5. **EXS_TS3.8** (row 108) — input "user_email-123@em-ail.com", expected "user_email-123@email.com".
6. **EXS_TS5.4** (row 122) — numeric address without commas/dashes "101 15623 151208 12 59200".
7. **EXS_TS5.5** (row 123) — adds "System should auto-remove Space for the front, back space".
8. **EXS_TS8.1 / TS9.1** (rows 140, 144) — "EMPTY Showroom City field" / "EMPTY Showroom District field" (NEW rows 63, 67 say "State").
9. **EXS_TS9.4** (row 147) — "Verify no district options available other than “ --Please Select-- ”".
10. **EXS_TS10.1 / TS10.2** (rows 148–149) — "Showroom Address Details fields should be displayed with values" / "as blank in the exported CSV file".

### H. Confirmation of Registration (sheet EAINT-8644 (COR))

1. **TS11.1 / 11.6** — full Showroom details → shown on UCD and BO COR "below 'State'" and in the PDF Address Table.
2. **TS11.2 / 11.7** — partial details → filled fields shown, others blank.
3. **TS11.3 / 11.8** — edit to empty → "Showroom Address, City, Postcode, and State fields are hidden"; PDF "Only Address will be displayed in the table".
4. **TS11.4 / 11.9** — edit to new values → new values shown.
5. **TS11.5 / 11.10** — company never updated in BO → fields hidden.
6. TS11.1–11.5 use a company that "haven't updated Company/Business Profile"; TS11.6–11.10 one that "have updated Company/Business Profile". Only the PDF position differs (rule 7.2).

### I. Export CSV (sheet EAINT-8645)

1. **8645_TS1** — Decision Maker values in CSV, between 'State' and 'UCD Vehicle Type'.
2. **8645_TS2** — Showroom values in CSV, between 'e-Invoice PIC Email' and 'Director Name'.
3. **8645_TS3** — empty values → shown as " - ".
4. **8645_TS4** — updated values exported.
5. **8645_TS5** — company never updated → " - ".
6. All five: audit log "Request developer to check Audit Log".

## 4. Business rules and system behaviour the TS reveals

1. **Every new field is optional.** "Update Company Account Details with EMPTY Name field" → "- System should allow to Update Company Account" (EAINT-8644 (FUNC), row 4; same for rows 13, 24, 42, 51, 61).
2. **Name:**
   1. "System will auto-convert to CAPITAL letters" (FUNC row 5).
   2. "System should auto-remove Spaces at Front and Back ⏎ - Spaces in the middle of the Name is acceptable" (FUNC row 8).
   3. Special characters allowed: "System should display "@MUHAMMAD# ABU&"" (FUNC row 10).
   4. Max 100: "System should NOT allow to enter the 101st character" (FUNC row 12).
3. **Contact No:**
   1. Digits only; spaces, letters, Chinese and symbols removed (FUNC rows 15–19).
   2. Length message: "Decision maker’s contact number must be between 9 to 11 digits." (FUNC row 20).
   3. Max 11: "System should NOT allow to enter the 12th digit" (FUNC row 23).
4. **Email:**
   1. Lowercased: "System should auto-convert CAPITAL letters to small letters" (FUNC row 25).
   2. Error text: "Invalid email format for Decision Maker’s email." (FUNC rows 30, 32, 33).
   3. Allowed specials: "Acceptable special characters:     . _ -" (FUNC row 30).
   4. Spaces — expected said all removed, but the tester's remark says: "Spaces and Front & Back are removed ⏎ - Spaces at Middle are not removed ⏎ - But will display error message ⏎ - This is same as existing behavior" (FUNC row 28, extra column). EXS row 105 was rewritten to match this.
   5. Unacceptable specials stay in the field and fail on validation: "Email should show "user#em!ail@exa~mp(le.com"" (FUNC row 107, EXS_TS3.7).
   6. Chinese characters are stripped: "Email should show "@.com"" (FUNC row 29).
   7. Max 100 (FUNC row 35).
5. **Showroom Address:** uppercased (row 43), Chinese removed (row 47), "All Special Characters allowed" (row 48), max 300 (row 50).
6. **Showroom Postcode:** digits only, exactly 5: "System should display " Showroom postcode must be 5 digits only."" (FUNC row 58); 6th digit blocked (row 60).
7. **COR display (sheet EAINT-8644 (COR)):**
   1. Screen: "displayed below 'State'" (row 4).
   2. PDF, profile not updated: "displayed in Address Table below 'RHB Islamic Account Bank No'" (row 4). PDF, profile updated: "displayed in Address Table between 'RHB Islamic Account Bank No' and 'e-Invoice PIC'" (row 9).
   3. Empty: "Showroom Address, City, Postcode, and State fields are hidden" and PDF "Only Address will be displayed in the table" (row 6).
   4. Example PDF table (rows 19–23): columns "Address" / "Showroom Address"; rows Address, City, Postcode, State. **District is not on the COR.**
8. **BO City shows "Please Select" after save — accepted.** "On BO, 'City' will display 'Please Select' after updating value, as after page refresh, 'State' is blank as before updating, it was changed to 'Please Select' after selecting 'City' ⏎  ⏎ Checked with BA, no changes required for BO to remain selected 'City'" (COR row 5). Further: "When download COR PDF & export CSV, the value for City will still display the one that we selected before we click [Update] in BO" and "Checked with BA, this is acceptable behavior as the value for City is already saved in DB although it displays as Please Select after updating the company account" (COR row 10).
9. **CSV columns (sheet EAINT-8645):**
   1. "Decision Maker Details - Name, Contact Number & Email are located in between 'State' and 'UCD Vehicle Type' fields in the CSV file" (row 3).
   2. "Showroom Address - Address, Postcode, City & State are located in between 'e-Invoice PIC Email' and 'Director Name' fields in the CSV file" (row 4). **District is not listed.**
   3. Empty: "Decision Maker Details & Showroom Address fields are displayed as " - "" (rows 5, 7).
   4. Audit log: "Audit Log is recorded for when User export Company Account listing - User ID, Company Account Listing, Date & Time of export activity" (rows 3–7). Checked by a developer, not by QA: "**Request developer to check Audit Log".
10. **Checkbox behaviour** (FUNC rows 36–40, 71–75): tick copies (Decision Maker ← Director; Showroom ← Mailing Address), untick clears, tick overrides manual values, editing a copied field unticks the box.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in any sheet. **[unconfirmed]**
2. **Accounts:** "BO Superadmin Account - jasons, rosalindkhoo, mfizni" (COR row 2). Usernames only; **no passwords in the sheet**.
3. **Company types needed:**
   1. "Company/Business that haven't updated Company/Business Profile" (COR rows 4–8).
   2. "Company/Business that have updated Company/Business Profile" (COR rows 9–13).
   3. A UCD company never updated in BO (COR rows 8, 13; EAINT-8645 row 7).
4. **Sample values:** Malaysian addresses (e.g. "No. 15, Jalan Bukit Bintang, 55100 Kuala Lumpur"), Selangor for State/City/District, example PDF data "LOT 78, JALAN MEGAH, SEKSYEN 7 / KAJANG / 43000" vs showroom "NO 61, JALAN MURNI, SEKSYEN 1 / BANDAR BARU BANGI / 43650" (COR rows 20–22).
5. **Input methods:** each text case is run three ways — "Keyboard Typing", "Copy and paste in text field (CTRL C + CTRL V)", "Copy and paste in text field (Right-click mouse method)".
6. **Audit log** needs a developer to read the backend.

## 6. Gaps or risks a regression should still cover

1. **District is captured but never output.** FUNC tests District (rows 67–70), but the COR (rows 4–13, 19–23) and CSV (EAINT-8645 row 4) list only Address, City, Postcode, State. Whether District is saved or shown anywhere is **untested** **[unconfirmed]**.
2. **BO City "Please Select" after save** (COR rows 5, 10). Risk: a later Update without re-picking City may save a blank City over the stored one. Not tested **[unconfirmed]**.
3. **Inconsistent expected values** — results say PASS, so the real behaviour is unclear:
   1. Contact No "+60(12)-34 5*6789" → "601234" (EXS row 96) vs NEW "60123456789" (row 19).
   2. Postcode " 6 8  7 5 3 " → "68" (rows 55, 132), while Contact No strips all spaces (row 17).
   3. "123@A.A" expected both lowercased and shown as entered (row 104).
   4. COR TS11.7 screen vs PDF expected values swap which fields are blank (COR row 10).
4. **Copy-paste errors in the NEW set** (fixed in the EXS set, see §3 G items 8–10): TS8.1/TS9.1 (rows 63, 67) test "EMPTY Showroom State field" under City/District; TS9.4 (row 70) says "no city options"; TS10.1/10.2 (rows 71–72) expect "Decision Maker Details" in CSV. Still wrong in **both** sets: TS10.3 step says "Decision Maker details fields" (rows 73, 150); TS10.5 says prepopulated "based on Showroom Address details" (rows 75, 152; should be Mailing Address **[unconfirmed]**).
5. **Name special characters:** UCD Name accepts any specials (row 10), while later CRs EAINT-8773/8774 allow only ' / . , : - @. Already logged as Contradiction 2 in `business-rules-from-test-scenarios.md`. A regression should check whether the UCD rule was tightened later **[unconfirmed]**.
6. **No UCD-side editing tested.** All updates are made in BO. Whether UCD users can see or edit Decision Maker / Showroom fields on their own profile is not covered.
7. **No CSV special-character test** (commas in address). EAINT-8781 row 9 covers commas in Names only `[business-rules-from-test-scenarios.md:667]`.
8. **No negative permission test** (BO user without Update Company Account rights).
9. **No link to onboarding showroom data.** Pre-Application already collects Showroom Address/Postcode/State/City (`flow-ucd-onboarding.md:276`). Whether onboarded companies get these fields pre-filled in BO is not tested **[unconfirmed]**.

## 7. Checks against existing knowledge

1. `business-rules-from-test-scenarios.md` items 2–4 (lines 658–666) **agree** with this study. They **omit**: District field, the City "Please Select" BA decision, the two PDF positions, the Email/Postcode messages, and the checkbox rules.
2. `business-rules-from-test-scenarios.md:660` cites "sheet EAINT-8644 (FUNC), rows 5-17" for Name and Contact No rules. Name is rows **4–12** and Contact No rows **13–23**; the cited range cuts off Contact No rows 18–23 (incl. the 9–11 digit message, row 20).
3. `flow-bo-shell.md` lists Manage Company Accounts (`/<env>/view/account/company`, line 71) and Company edit (`edit.get?id=<n>`, line 299), but **no flow file lists the Decision Maker or Showroom fields** on that edit page.
4. `flow-ucd-shell.md:214` gives the UCD COR URL `/<env>/view/ucd/settings/confirmation-of-registration/view.do`; it does not mention the Showroom rows.
5. `cr-test-scenario-catalogue.md` row 074 gives the counts 142 / 10 / 5 = 157 — **matches**.
6. **No contradiction** found with flow files. Contradiction 2 (Name specials) remains open.

## Knowledge candidates

1. **BO Update Company Account — Decision Maker block.** Name (uppercase, trim ends, Chinese removed, specials allowed, max 100), Contact No (digits only, 9–11, message "Decision maker’s contact number must be between 9 to 11 digits."), Email (lowercased, max 100, message "Invalid email format for Decision Maker’s email."), all optional; checkbox copies from Director. Source: `[from SharePoint TS #074 EAINT-8644 & 8645, sheet EAINT-8644 (FUNC), rows 4–40]`. Target: `flow-bo-shell.md` or a new company-edit section.
2. **BO Update Company Account — Showroom block.** Address (max 300, uppercase, all specials), Postcode (5 digits, " Showroom postcode must be 5 digits only."), State, City, District (City/District filtered by State, reset on State change); checkbox copies from Mailing Address. Source: `[#074, sheet EAINT-8644 (FUNC), rows 42–75]`.
3. **Checkbox behaviour** (tick copies, untick clears, tick overrides, edit unticks). Source: `[#074, sheet EAINT-8644 (FUNC), rows 36–40, 71–75]`.
4. **BO City shows "Please Select" after Update — BA-accepted, City still saved in DB, COR PDF and CSV show the saved City.** Source: `[#074, sheet EAINT-8644 (COR), rows 5, 10]`. Good trap entry: do not raise as a bug.
5. **COR PDF Showroom position** differs by profile state: below 'RHB Islamic Account Bank No' (profile not updated) vs between 'RHB Islamic Account Bank No' and 'e-Invoice PIC' (profile updated). Source: `[#074, sheet EAINT-8644 (COR), rows 4, 9]`.
6. **District not on COR or CSV** per the TS. Source: `[#074, sheet EAINT-8644 (COR), rows 19–23; sheet EAINT-8645, row 4]`. Tag `[unconfirmed]` until checked live.
7. **Email middle spaces are kept and trigger the invalid-format error** ("same as existing behavior"). Source: `[#074, sheet EAINT-8644 (FUNC), row 28 remark; row 105]`.
8. **Company Account Listing export audit log** records "User ID, Company Account Listing, Date & Time of export activity"; QA checks it via a developer. Source: `[#074, sheet EAINT-8645, rows 3–7]`.
9. **Row-range fix for `business-rules-from-test-scenarios.md:660`:** change "rows 5-17" to Name "rows 4-12" and Contact No "rows 13-23". Source: `[#074, sheet EAINT-8644 (FUNC), rows 4–23]`.
