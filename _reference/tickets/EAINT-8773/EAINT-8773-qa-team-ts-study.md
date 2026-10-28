# EAINT-8773 — QA Team test script study (2026-10-28)

Scheduled SharePoint Scribe study. Read-only summary of another QA engineer's TS. Nothing in `knowledge/`, `lib/` or `app/` was changed.

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8773 - [eAuto-AATF & BackOffice] Add Showroom Address and Decision Maker Details in AATFPBT Account Listing.md` (captured 28/10/2026, 9:44:53 am). Cell text only — **colours, formatting, images and evidence are not kept**.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-8773/EAINT-8773-jira.md` (27/10/2026).
3. **Knowledge:** `knowledge/business-rules-from-test-scenarios.md` (§ "Decision Maker and Showroom fields", §13, Contradictions #2), `knowledge/cr-test-scenario-catalogue.md` rows 281, 285, 434, `knowledge/flow-bo-shell.md` line 79, `knowledge/flow-edereg.md` items 4-6 near line 5552, `knowledge/production-regression-scope.md` line 1036.
4. **lib/ticketStudies.ts:** no EAINT-8773 entry.
5. **Not read:** the SRD (V1.1 PDF, 2025-11-04) — not in the repo. No `_reference/tickets/EAINT-8773/` folder existed before this file.

## 1. Header

1. **Ticket:** EAINT-8773 — "🔴[eAuto-AATF & BackOffice] [AATF/PBT Account Listing] To Add Showroom Address and Decision Maker Details" `[Jira capture, Summary]`.
2. **Status:** "Done". **Fix versions:** "S23.3-20251112 (2025-11-12), S23.6-20251124🌚 (2025-11-24)". Deployed: "This ticket has been deployed on 24 November 2025 (Monday)." `[Jira capture, comment by BA, 2025-11-26]`
3. **Module / portal:** **BackOffice** "Manage AATF/PBT Accounts > Edit / Create Company Account" and **AATF portal** "Settings > Confirmation of Registration" `[sheet 8773, column "Affected Screen"]`.
4. **Workbook:** "EAINT-8773 - [eAuto-AATF & BackOffice] Add Showroom Address and Decision Maker Details in AATFPBT Account Listing.xlsx", library "eAuto - CR Test Scenarios", modified 04/11/2025, 10:07:44 am.
5. **Sheets:** two.
   1. **8773** — 154 scenarios: `8773_ECA_TS01`–`TS142` (BO Edit TS01–TS71, BO Create TS72–TS142) and `8773_COR_TS1`–`TS12` (Confirmation of Registration).
   2. **8742** — 21 scenarios: `8742_ECA_TS01`–`TS21`, on "Manage Company Accounts > Edit Company Account" (UCD company, not AATF/PBT).
6. **Total:** **175 scenarios. Result: 175 Pass, 0 Fail.** Every row's "Test Result" cell reads "Pass".
7. **Tester:** QA column reads "Azfar" on every row. Jira QA field: the same QA engineer `[Jira capture, line 3]`.
8. **Dates in sheet:** none. "Test environment:" (R3) and "Test objective:" (R5) are **blank**.
9. **TS id format:** not two-digit for COR (`8773_COR_TS1`, not `TS01`).

## 2. What the ticket changed, as the TS shows it

1. **New optional section "Decision Maker Details"** on BO Manage AATF/PBT Accounts Create and Edit: Name, Contact Number, Email Address, plus a checkbox that copies from Director details `[sheet 8773, R8-R44, R79-R115]`.
2. **New optional section "Showroom Address"** on the same screens: Address, Postcode, State, City, District, plus a checkbox that copies from Mailing Address `[sheet 8773, R45-R78, R116-R149]`.
3. **Confirmation of Registration** (BO PDF download, AATF screen, AATF Print PDF) now shows Showroom Address next to Business Address `[sheet 8773, R150-R161]`.
4. **Sheet 8742** tests Decision Maker Name and Email on **BO Manage Company Accounts > Edit** — the UCD-side form. Which ticket "8742" is, is not stated in the sheet or Jira links. `[unconfirmed]`
5. The ticket title says "Account Listing", but **no scenario tests the listing, its columns, filters or export**. Those sit in linked ticket EAINT-8781 `[Jira capture, Links]`.

## 3. Scenarios, grouped

Edit (TS01–TS71) and Create (TS72–TS142) are the same set, offset by 71. Listed once with both ids.

### 3a. Decision Maker — Name (TS01–TS10 / TS72–TS81)

1. **TS01 / TS72** — empty Name → "System should allow to Update Company Account".
2. **TS02 / TS73** — letters "Apollo Kasim" → auto-uppercase, "APOLLO KASIM". (TS73 expects "MUHAMMAD ABU" — copy error, see §6.)
3. **TS03 / TS74** — digits only → "System should display "1232344234"".
4. **TS04 / TS75** — alphanumeric → "MUHAMMAD123 ABU456".
5. **TS05 / TS76** — front/middle/back spaces → front and back trimmed, middle kept.
6. **TS06 / TS77** — Chinese → "System should not allow to insert Chinese Characters".
7. **TS07 / TS78** — acceptable special characters → only ' / . , : - @ allowed. (TS78 expects "@MUHAMMAD# ABU&" — conflicts, see §4.)
8. **TS08 / TS79** — "!#$*?" → "System should not allow to insert unacceptable Special Characters".
9. **TS09 / TS80** — exactly 100 chars → saves with no error.
10. **TS10 / TS81** — over 100 → "the BO user should not be able to enter additional characters".

### 3b. Decision Maker — Contact Number (TS11–TS21 / TS82–TS92)

1. **TS11 / TS82** — empty → "System should allow to update without "Contact Number"".
2. **TS12 / TS83** — "0123456789" → shown as entered.
3. **TS13 / TS84** — letters → auto-removed, shows "".
4. **TS14 / TS85** — "012Abc6789" → "0126789".
5. **TS15 / TS86** — spaces anywhere → all removed, "0123456789".
6. **TS16 / TS87** — Chinese → auto-removed, "".
7. **TS17 / TS88** — "+60(12)-345*6789" → "60123456789".
8. **TS18 / TS89** — 8 digits → error "Decision maker’s contact number must be between 9 to 11 digits.".
9. **TS19 / TS90** — 9 digits → saves.
10. **TS20 / TS91** — 11 digits → saves.
11. **TS21 / TS92** — 12 digits → cannot type the 12th.

### 3c. Decision Maker — Email Address (TS22–TS32 / TS93–TS103)

1. **TS22 / TS93** — empty → update completes.
2. **TS23 / TS94** — "Test-ing_123@test.com" → lower-cased, "test-ing_123@test.com".
3. **TS24 / TS95** — letters only → shown as entered.
4. **TS25 / TS96** — "123@456.789" → shown as entered; TS25 also expects "Invalid email  format for Decision Maker’s email." (TS96 does not).
5. **TS26 / TS97** — spaces anywhere → all removed.
6. **TS27 / TS98** — Chinese → removed, "Email should show "@.com"".
7. **TS28 / TS99** — "user#em!ail@exa~mp(le.com" → unacceptable characters blocked.
8. **TS29 / TS100** — "user_email-123@email.com" → allowed.
9. **TS30 / TS101** — "mftesting@gmail", "mftesting.com", "mftesting-gmail.com" → "Invalid email  format for Decision Maker’s email.".
10. **TS31 / TS102** — 100 chars → accepted, no more allowed.
11. **TS32 / TS103** — 101 chars → "System should NOT allow to enter the 101st character".

### 3d. Decision Maker — copy-from-Director checkbox (TS33–TS37 / TS104–TS108)

1. **TS33 / TS104** — tick → Name, Contact Number, Email copied from Director.
2. **TS34 / TS105** — tick then untick → the three fields cleared.
3. **TS35 / TS106** — manual entry → values saved.
4. **TS36 / TS107** — manual entry then tick → overwritten by Director details.
5. **TS37 / TS108** — tick then edit a field → field stays editable, checkbox unticks.

### 3e. Showroom — Address (TS38–TS46 / TS109–TS117)

1. **TS38 / TS109** — empty → update allowed.
2. **TS39 / TS110**, **TS40 / TS111** — mixed case / letters → uppercased.
3. **TS41 / TS112** — digits and punctuation → shown as entered.
4. **TS42 / TS113** — front/back spaces → trimmed, uppercased.
5. **TS43 / TS114** — Chinese → removed; commas left behind on Edit (see §4).
6. **TS44 / TS115** — "#25-A, 8th Floor, @TheVertical, …" → "All Special Characters allowed".
7. **TS45 / TS116** — 300 chars → "System should allow input".
8. **TS46 / TS117** — 301 chars → "System should only show max 300 characters".

### 3f. Showroom — Postcode (TS47–TS56 / TS118–TS127)

1. **TS47 / TS118** — empty → update allowed.
2. **TS48 / TS119** — "A1B2C" → "Postcode should show "12"".
3. **TS49 / TS120** — letters → blocked.
4. **TS50 / TS121** — "12345" → shown as entered.
5. **TS51 / TS122** — " 6 8  7 5 3 " → "Postcode should show "68"".
6. **TS52 / TS123** — "都对额23" → "23".
7. **TS53 / TS124** — "#782#@" → "782".
8. **TS54 / TS125** — 4 digits → error "Showroom postcode must be 5 digits only.".
9. **TS55 / TS126** — 5 digits → allowed.
10. **TS56 / TS127** — 6 digits → "System should NOT allow to enter the 6th character".

### 3g. Showroom — State, City, District (TS57–TS66 / TS128–TS137)

1. **TS57 / TS128**, **TS59 / TS130**, **TS63 / TS134** — empty State / City / District → update allowed.
2. **TS58 / TS129** — State list matches "BO > Manage Company Account > Update Company Account > State field".
3. **TS60 / TS131** — State Selangor → only Selangor cities ("e.g. Shah Alam, Klang").
4. **TS61 / TS132** — change State → "Verify City resets to default state".
5. **TS62 / TS133** — no State → City has only "“ --Please Select-- ”".
6. **TS64 / TS135**, **TS65 / TS136**, **TS66 / TS137** — same three checks for District ("e.g. Klang, Gombak").

### 3h. Showroom — copy-from-Mailing-Address checkbox (TS67–TS71 / TS138–TS142)

1. **TS67 / TS138** — tick → Address, Postcode, State, City, District copied from Mailing Address.
2. **TS68 / TS139** — tick then untick → all five cleared.
3. **TS69 / TS140** — manual entry → values saved.
4. **TS70 / TS141** — manual entry then tick → overwritten by Mailing Address.
5. **TS71 / TS142** — tick then edit → field stays editable, checkbox unticks.

### 3i. Confirmation of Registration (COR_TS1–TS12)

1. **COR_TS1** (BO PDF, existing company, all filled) → "3-column table (Field Name / Business / Showroom)".
2. **COR_TS2** (BO PDF, only City + State) → 3 columns kept; empty fields "remain blank (not hidden)".
3. **COR_TS3** (BO PDF, all empty) → "Entire Showroom Address column hidden if all fields are empty."
4. **COR_TS4** (AATF screen, all filled) → section "Showroom Address Details" shown between “State” and “Contact Person”.
5. **COR_TS5** (AATF screen, City + State only) → empty fields blank, not hidden.
6. **COR_TS6** (AATF screen, all empty) → "“Showroom Address Details” section is not displayed when all fields are empty."
7. **COR_TS7 / TS8 / TS9** (AATF Print PDF) → same three cases as TS1–TS3, header "Field Name / Business Address / Showroom Address".
8. **COR_TS10 / TS11 / TS12** (new company) → BO PDF, AATF screen, AATF Print PDF with all fields; values "must match BackOffice data".

### 3j. Sheet 8742 — UCD Manage Company Accounts > Edit (8742_ECA_TS01–TS21)

1. **TS01–TS10** — Decision Maker Name, word for word the same as 8773 TS01–TS10.
2. **TS11–TS21** — Decision Maker Email, the same as 8773 TS22–TS32.
3. **No Contact Number, checkbox or Showroom rows** on this sheet.

## 4. Business rules and system behaviour the TS reveals

1. **Both new sections are optional.** Section label "Decision Maker Details ⏎ (Optional)" and "Showroom Address ⏎ (Optional)" `[sheet 8773, column "Affected Field", R8, R45]`.
2. **Name allowed characters:** "The field should allow alphanumeric and the following special characters only: ⏎ ⏎ i. Apostrophe (') ⏎ ii. Slash (/) ⏎ iii. Dot (.) ⏎ iv. Comma (,) ⏎ v. Colon (:) ⏎ vi. Dash (-) ⏎ vii. Ampersat (@)" `[sheet 8773, R14, Expected Result]`.
3. **Conflict inside the same sheet:** Create TS78 expects "System should display "@MUHAMMAD# ABU&"" `[sheet 8773, R85]` — # and & kept — while TS79 says "!#$*?" is blocked `[sheet 8773, R86]`. Both marked "Pass". The 100-char example also contains "R&D" `[sheet 8773, R16]`. Which is true on the live form is unknown. `[unconfirmed]`
4. **Name casing and spaces:** "System will auto-convert to CAPITAL letters"; "System should auto-remove Spaces at Front and Back ⏎ - Spaces in the middle of the Name is acceptable" `[sheet 8773, R12]`.
5. **Name max length:** "Ensure when attempt to input exceeds 100 characters, the BO user should not be able to enter additional characters." `[sheet 8773, R17]`
6. **Contact Number is digits only, 9 to 11.** Non-digits and all spaces are stripped: "+60(12)-345*6789" → "Contact No should show "60123456789"" `[sheet 8773, R24]`. Under 9: "Decision maker’s contact number must be between 9 to 11 digits."" `[sheet 8773, R25]`. Over 11: cannot type `[sheet 8773, R28]`.
7. **Contact error wording was a QA-Issue.** Sub-task EAINT-9091: "Update validation message for Decision Maker’s contact number (should use “digits” instead of “characters”)" `[Jira capture, Sub-tasks]`.
8. **Email is lower-cased:** "System should auto-convert CAPITAL letters to small letters" `[sheet 8773, R30]`.
9. **Email prefix rule:** "The field should allow alphabets (a–z), numbers (0–9), and the following special characters in the prefix part (before “@”): ⏎ i. Dot (.) ⏎ ii. Underscore (_) ⏎ iii. Hyphen (-)" `[sheet 8773, R31]`.
10. **Email format error:** "Invalid email  format for Decision Maker’s email." (two spaces after "email" in the sheet) `[sheet 8773, R37]`. Max 100, the 101st cannot be typed `[sheet 8773, R39]`.
11. **Email with Chinese is stripped, not rejected:** "Email should show "@.com"" `[sheet 8773, R34]`. No error stated for that leftover.
12. **Director checkbox:** "When checkbox ticked, Decision Maker Details fields - Name, Contact Number & Email Address should copy from Director details" `[sheet 8773, R40]`; "Checkbox will be unticked whenever user edit the prepopulated fields" `[sheet 8773, R44]`.
13. **Showroom Address:** uppercased, trimmed, "All Special Characters allowed" `[sheet 8773, R51]`, max 300 `[sheet 8773, R53]`. Chinese is removed but surrounding commas stay: "TAMAN TUN DR ISMAIL,,, 60000" (Edit) `[sheet 8773, R50]` vs "TAMAN TUN DR ISMAIL, 60000" (Create) `[sheet 8773, R121]`.
14. **Showroom Postcode:** digits only, exactly 5; error "Showroom postcode must be 5 digits only." `[sheet 8773, R61]`.
15. **Postcode length cap counts raw keystrokes.** "A1B2C" → "12" `[R55]` and " 6 8  7 5 3 " → "68" `[R58]` suggest the 5-character limit applies before stripping. `[unconfirmed]` (inferred from expected values only)
16. **Postcode validation was a QA-Issue.** EAINT-9100: "Postcode & Showroom Postcode allows chinese character & special character for Create new and Edit Existing Account" `[Jira capture, Sub-tasks]`. This also touched the existing (mailing) Postcode.
17. **State list source:** "Verify all available States from BO > Manage Company Account > Update Company Account > State field are listed in the dropdown list" `[sheet 8773, R65]`.
18. **City and District depend on State:** "Verify only cities from Selangor (e.g. Shah Alam, Klang) are shown" `[R67]`; "Verify City resets to default state" on State change `[R68]`; with no State, only "“ --Please Select-- ”" `[R69]`.
19. **Mailing Address checkbox** copies "Address, Postcode, State, City & District" `[sheet 8773, R74]`.
20. **COR partial vs empty:** partial → "Other fields (Address, Postcode) remain blank (not hidden)" `[R151]`; all empty → "Entire Showroom Address column hidden if all fields are empty." `[R152]`.
21. **COR column label was a QA-Issue.** EAINT-9130: "Confirmation of Registration PDF – “Address” column should be “Business Address”" `[Jira capture, Sub-tasks]`.
22. **COR placement:** "Verify the Showroom Address section displays between “State” and “Contact Person”" `[sheet 8773, R153]`.
23. **District in COR is unclear.** R153 expects "all 5 fields … (Address, City, Postcode, State, District)", but its steps list four (no District), and the PDF row list in R156 has no District row. `[unconfirmed]`
24. **QA-Issues raised in total:** five sub-tasks (EAINT-9090, 9091, 9095, 9100, 9130) `[Jira capture, Sub-tasks]`. EAINT-9090: "Decision Maker Name allows unacceptable special characters"; EAINT-9095: "Decision Maker Email Address allows space & unacceptable special characters".

### Against existing knowledge

1. `knowledge/business-rules-from-test-scenarios.md` Contradictions #2 says AATF/PBT Name allows only ' / . , : - @. **This sheet's own TS78 (R85) breaks that rule**, the same way the UCD sheet EAINT-8644 does. The contradiction exists inside EAINT-8773 too.
2. Same file §13 item 3 ("Contact and Email optional", rows 14-18) is correct but thin. Rows 14-18 cover Name only; Contact is R18-R28 and Email R29-R39.
3. `knowledge/flow-bo-shell.md` line 79 lists "Manage AATF/PBT Account | `/<env>/view/account/dereg/aatf` | no flow doc yet". This TS is the most complete field-level source for that page's Create/Edit form.
4. `knowledge/flow-edereg.md` item 5 (from EAINT-8781): AATF/PBT Listing Export CSV "Should NOT show any Decision Maker Details". Not tested here; no conflict.
5. `knowledge/cr-test-scenario-catalogue.md` row 281 names a different person as tester than the sheet's QA column. The catalogue value may be the file author. `[unconfirmed]`

## 5. Test data, environments, accounts, setup

1. **Environment:** not written ("Test environment:" blank, R3). Fix version dates point to staging testing before 24 Nov 2025 `[unconfirmed]`.
2. **Accounts:** none named. **No credentials present** in the sheet.
3. **Companies:** "Existing Company" (COR_TS1–TS9) and "New Company" (COR_TS10–TS12). No company names or IDs given.
4. **Input method rule:** every free-text row repeats "Keyboard Typing ⏎ - Copy and paste in text field (CTRL C + CTRL V) ⏎ - Copy and paste in text field (Right-click mouse method)" — three input routes per check.
5. **Sample values** worth reusing: Name 100-char "Michael-John's, Sr.: Director/Lead @Global-Tech.Co, Unit-45/BB,R R&D-Dept. Bldg-3 Floor-2, West-Zone" `[R16]`; Address 300-char sample `[R52]`; State "Selangor" with City "Shah Alam"/"Klang", District "Klang"/"Gombak" `[R67, R71]`.
6. **Prerequisite data:** a Director record (for the Decision Maker checkbox) and a Mailing Address (for the Showroom checkbox) must already be on the account.

## 6. Gaps or risks a regression should still cover

1. **Name # and & conflict.** Retest Create and Edit with "@Muhammad# abu&" and with the 100-char "R&D" sample. Two "Pass" results contradict each other (R85 vs R86).
2. **Listing and export not covered**, despite the title. Pair with the EAINT-8781 TS for the AATF/PBT Account Listing columns, filters and Export CSV.
3. **District in Confirmation of Registration.** Confirm whether District appears on the AATF screen and both PDFs (R153 vs R156).
4. **Save round-trip.** No row reopens the account after Update to confirm stored values (uppercase, trimmed, stripped). Only the on-screen value is checked.
5. **Partial Showroom address on save.** No row saves, e.g., Postcode without State, or City without Address. Unknown whether the form blocks it.
6. **Leftover junk after stripping.** Email "@.com" `[R34]` and Address ",,," `[R50]` — no row checks whether these save or raise an error.
7. **TS25 vs TS96.** Numeric email "123@456.789" expects an error on Edit only. Check Create gives the same.
8. **Mailing Postcode** was changed by EAINT-9100 but has no row of its own here.
9. **Sheet 8742 has no Contact Number rows** for the UCD form. Check whether the UCD form has that field and its rule.
10. **Account type split.** No row separates AATF and PBT account types. Relevant to EAINT-12348 (PBT as eDereg users) `[knowledge/flow-edereg.md, item 4]`.
11. **Copy errors in the sheet** (treat expected text with care):
    1. TS73 (R80) input "Apollo Kasim", expected "MUHAMMAD ABU".
    2. TS29 / TS100 (R36, R107) "should allow user to enter unacceptable special character" — row is about acceptable ones.
    3. TS30 / TS101 (R37, R108) mention "the Director/Owner Details section" but quote the Decision Maker error.
    4. TS59, TS63, TS130, TS134 (City/District) say "EMPTY Showroom State field".
    5. TS66 / TS137 (District) say "no city options".
    6. TS69 / TS140 (Showroom checkbox) say "Manually fill in Decision Maker details fields".
    7. TS70 / TS141 list "Address, City, Postcode & State" — District missing, unlike TS67.
    8. TS71 / TS142 say "prepopulated based on Showroom Address details" — should be Mailing Address.
12. **Automation note:** the paste routes (Ctrl+V, right-click) must be done like a person — real clipboard paste, no value injection.

## Knowledge candidates

1. **BO Manage AATF/PBT Account form — Decision Maker Details (Optional):** Name (uppercase, trim ends, max 100, ' / . , : - @), Contact Number (digits only, 9-11, error "Decision maker’s contact number must be between 9 to 11 digits."), Email (lower-case, prefix a–z 0–9 . _ -, max 100, error "Invalid email  format for Decision Maker’s email."), checkbox copies from Director and unticks on edit. Target: new `knowledge/flow-aatf-pbt-account.md` or `flow-bo-shell.md` row 79. `[from SharePoint TS EAINT-8773, sheet 8773, R8-R44]`
2. **BO Manage AATF/PBT Account form — Showroom Address (Optional):** Address (uppercase, all special characters, max 300), Postcode (5 digits, error "Showroom postcode must be 5 digits only."), State list same as Manage Company Account, City and District filtered by State and reset on State change, checkbox copies from Mailing Address. `[from SharePoint TS EAINT-8773, sheet 8773, R45-R78]`
3. **Confirmation of Registration showroom rule (AATF + BO PDF):** partial = blank cells kept; all empty = Showroom column/section hidden; placed between “State” and “Contact Person”; column header "Business Address" after EAINT-9130. `[from SharePoint TS EAINT-8773, sheet 8773, R150-R161; Jira EAINT-8773 sub-task EAINT-9130]`
4. **Update Contradictions #2** in `knowledge/business-rules-from-test-scenarios.md`: EAINT-8773 itself is split — TS79 blocks "!#$*?" but TS78 expects "@MUHAMMAD# ABU&". `[from SharePoint TS EAINT-8773, sheet 8773, R85, R86]`
5. **Fix row reference** in `knowledge/business-rules-from-test-scenarios.md` §13 item 3: Contact rows are R18-R28 and Email rows R29-R39, not rows 14-18. `[from SharePoint TS EAINT-8773, sheet 8773]`
6. **Known QA-Issues for this form** (check before raising duplicates): EAINT-9090, 9091, 9095, 9100, 9130. `[from Jira EAINT-8773, Sub-tasks, captured 2026-10-27]`
7. **Postcode length cap may count raw keystrokes before stripping** ("A1B2C" → "12"). `[from SharePoint TS EAINT-8773, sheet 8773, R55, R58]` `[unconfirmed]`
