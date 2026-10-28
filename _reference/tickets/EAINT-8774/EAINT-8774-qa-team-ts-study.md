# EAINT-8774 — QA Team test script study (2026-10-28)

Scheduled SharePoint Scribe study. Read only; no knowledge/ or code files changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8774 - [eAuto-BackOffice] Update Validation Checking For Name, Postcode, Mailing Address & Email Address.md` (cell text only, captured 28/10/2026, 9:48:50 am). All 75 lines read. Formatting, colours and images are not in the copy.
2. **Ticket folders:** `_reference/tickets/EAINT-8774/` and `_reference/tickets/Studying/EAINT-8774/` — **no files existed** before this study.
3. **lib/ticketStudies.ts:** no EAINT-8774 entry.
4. **knowledge/ (grep EAINT-8774):**
   1. `knowledge/flow-bo-shell.md` line 101 (§3.1 item 3) — covers rows 4-11 only.
   2. `knowledge/business-rules-from-test-scenarios.md` line 649 (§10 item 1) and line 1033 (Contradiction 2).
   3. `knowledge/cr-test-scenario-catalogue.md` lines 225, 435 (catalogue #083).
   4. `knowledge/production-regression-scope.md` line 1052, table §11.3 "2025-10-13 to 2026-04-01": "| EAINT-8774 | 20251013 | BO validation | Yes |".
   5. `_reference/tickets/EAINT-8644/EAINT-8644-qa-team-ts-study.md` line 211 (Name special-character note).
5. **Not read:** Jira ticket, SRD and the bug tickets EAINT-9016 / EAINT-9019 (unattended run, no Atlassian access used).

## 1. Header

1. **Ticket:** EAINT-8774 — "[eAuto-BackOffice] Update Validation Checking For Name, Postcode, Mailing Address & Email Address" (Sheet1 R1).
2. **Portals:** **BackOffice** (main), plus **UCD** and **AATF** portals for the Confirmation of Registration check.
3. **Workbook:** "EAINT-8774 - [eAuto-BackOffice] Update Validation Checking For Name, Postcode, Mailing Address & Email Address.xlsx", library "eAuto - CR Test Scenarios", modified 24/10/2025, 11:03:05 am.
4. **Sheets:** one — **Sheet1**. Functional block R3-R61; "REGRESSION" block R64-R72.
5. **Scenario count:** **64** = 58 functional + 6 regression. Matches the catalogue count "64" (`cr-test-scenario-catalogue.md` line 225).
6. **Results:** **64 Pass, 0 Fail** as recorded. Several Pass rows carry remarks that describe a defect (see §6).
7. **Testers (QA column):** four QA engineers — Azfar (R4-R20, R38-R49, R67-R69), Teck Yung (R21-R37, R70-R72), Nadhirah (R50-R61). The catalogue lists only "Amirul Azfar" as owner.
8. **Dates in the sheet:** only retest dates — "Retested 13/10/2025" (R36, R39), "Retest: 13/10/25" (R53-R55). 13/10/2025 matches the production date "20251013".

## 2. What the ticket changed, as the TS shows it

1. **New or tightened validation** on four field types in BackOffice account forms: **Postcode**, **Mailing Address**, **Name**, **Email Address**.
2. **Four BO forms** are in scope:
   1. Edit company account (ids `ECA_*`) — sections Company Details, Director/Owner Details, e-Invoice PIC Details.
   2. Create New Company Account (ids `CNCA_*`) — same three sections.
   3. Edit AATF/PBT account (ids `BO_AATF_D_*`, `BO_AATF_DOD_*`) — sections AATF/PBT Details, Director/Owner Details.
   4. Create New AATF/PBT Account (ids `BO_AATF_CN_*`) — same two sections.
3. **e-Invoice PIC Name and Email** stay **not mandatory**, but get the same character and length rules (R13-R17).
4. **Downstream checks:** the updated values must show on the BO listing page, the BO "Export CSV", and the portal "Confirmation Of Registration" form and PDF (R18-R20, R35-R37, R47-R49, R59-R61).

## 3. Scenarios

### 3.1 Edit company account — Azfar (R4-R17)

Affected Screen label reads "Manage AATF/PBT Accounts > Edit AATF/PBT Account" on every row, but ids are `ECA_*` and sections include e-Invoice PIC Details. See §6 item 1.

1. **ECA_CD_P_TS1** (R4) — Postcode blank, then 4 digits. Expect "Postcode is required." and "Postcode must be 5 digits only."
2. **ECA_CD_P_TS2** (R5) — Postcode 5 and 6 digits. Expect "the BO user should not be able to enter additional characters."
3. **ECA_CD_MA_TS3** (R6) — Mailing Address blank, then under 300. Expect "Mailing address is required."; under 300 saves.
4. **ECA_CD_MA_TS4** (R7) — Mailing Address exactly 300 and 301. Expect 300 saves; extra character blocked. Remark "Retest".
5. **ECA_DOD_N_TS5** (R8) — Director/Owner Name blank, then under 100, three input methods. Expect "Director / Owner Name is required."; auto-capitalise. Remark "Cant enter space for name".
6. **ECA_DOD_N_TS6** (R9) — Director/Owner Name 100 and 101. Expect extra character blocked. Remark "Can input more than 100 char".
7. **ECA_DOD_EA_TS7** (R10) — Director/Owner Email blank, then under 100. Expect "Director / Owner Email Address is required."; lowercase.
8. **ECA_DOD_EA_TS8** (R11) — Director/Owner Email 100 and 101. Expect extra character blocked.
9. **ECA_DOD_EA_TS9** (R12) — invalid email "john.doeexample.com". Expect "Invalid email format for Director/Owner’s email."
10. **ECA_IPD_N_TS10** (R13) — e-Invoice PIC Name blank, then under 100. Expect blank "allows the update to be completed successfully."
11. **ECA_IPD_N_TS11** (R14) — e-Invoice PIC Name 100 and 101. Expect extra character blocked.
12. **ECA_IPD_EA_TS12** (R15) — e-Invoice PIC Email blank, then under 100. Expect blank saves; lowercase.
13. **ECA_IPD_EA_TS13** (R16) — e-Invoice PIC Email 100 and 101. Expect extra character blocked.
14. **ECA_IPD_EA_TS14** (R17) — invalid e-Invoice PIC email. Expect "Invalid email format for e-Invoice PIC’s email."

### 3.2 Existing company account, downstream — Azfar (R18-R20)

1. **MCA_LP_ECV_TS1** (R18) — Manage Company Account listing shows updated email address, e-Invoice PIC Name, e-Invoice PIC Email.
2. **MCA_LP_ECV_TS2** (R19) — "Export CSV" downloads, opens, and holds updated Name, Postcode, Mailing Address, Email Address.
3. **UCD_SCOR_TS1** (R20) — UCD Settings > Confirmation of Registration form and printed PDF show updated Postcode, Address, Contact Person, Email Address.

### 3.3 Create New Company Account — Teck Yung (R21-R34)

1. **CNCA_CD_P_TS1 / TS2** (R21-R22) — Postcode 4 digits → "Postcode must be 5 digits only."; 6th digit blocked.
2. **CNCA_CD_MA_TS3 / TS4** (R23-R24) — Mailing Address under 300, exactly 300, 301 blocked.
3. **CNCA_DOD_N_TS5 / TS6** (R25-R26) — Director/Owner Name under 100, 100, 101 blocked. R25 remark "It can accept more 100 characters."
4. **CNCA_DOD_EA_TS7 / TS8 / TS9** (R27-R29) — Director/Owner Email under 100, 100, 101 blocked, invalid format. R28 remark "The '@' special character can still be entered."
5. **CNCA_IPD_N_TS10 / TS11** (R30-R31) — e-Invoice PIC Name under 100, 100, 101 blocked. R31 remark "The users can type more than 100 characters and also can be updated successfully. Retested 13/10/2025".
6. **CNCA_IPD_EA_TS12 / TS13 / TS14** (R32-R34) — e-Invoice PIC Email under 100, 100, 101 blocked, invalid format. R34 remark links bug **EAINT-9019** (wrong error wording).
7. **No "remove and Update" step** on create rows — mandatory-blank messages are not tested on create.

### 3.4 New company account, downstream — Teck Yung (R35-R37)

1. **MCA_LP_ECV_TS3** (R35) — listing shows all 22 listed columns for the new company.
2. **MCA_LP_ECV_TS4** (R36) — "Export CV" [sic] downloads and holds the updated fields.
3. **UCD_SCOR_TS2** (R37) — new UCD account's Confirmation of Registration form and PDF match BO.

### 3.5 Edit AATF/PBT account — Azfar (R38-R46)

1. **BO_AATF_D_P_TS1 / TS2** (R38-R39) — Postcode rules, same messages as R4-R5.
2. **BO_AATF_D_MA_TS3 / TS4** (R40-R41) — Mailing Address rules, same as R6-R7.
3. **BO_AATF_DOD_N_TS5 / TS6** (R42-R43) — Director/Owner Name rules. Both remarks "Cant put space" + bug **EAINT-9016**.
4. **BO_AATF_DOD_EA_TS7 / TS8 / TS9** (R44-R46) — Director/Owner Email rules and invalid format.
5. **No e-Invoice PIC section** on AATF/PBT rows.

### 3.6 Existing AATF/PBT account, downstream — Azfar (R47-R49)

1. **BO_AATF_LP_TS1** (R47) — Manage AATF/PBT Account listing shows updated email address.
2. **BO_AATF_LP_TS2** (R48) — Export CSV holds updated Name, Postcode, Mailing Address, Email Address.
3. **AATF_SCOR_TS1** (R49) — AATF portal Confirmation of Registration form and PDF match BO.

### 3.7 Create New AATF/PBT Account — Nadhirah (R50-R58)

1. **BO_AATF_CN_D_P_TS1 / TS2** (R50-R51) — Postcode rules.
2. **BO_AATF_CN_D_MA_TS3 / TS4** (R52-R53) — Mailing Address rules. R53 "Retest: 13/10/25".
3. **BO_AATF_CN_DOD_N_TS5 / TS6** (R54-R55) — Director/Owner Name rules. Both "Retest: 13/10/25".
4. **BO_AATF_CN_DOD_EA_TS7 / TS8 / TS9** (R56-R58) — Director/Owner Email rules and invalid format.

### 3.8 New AATF/PBT account, downstream — Nadhirah (R59-R61)

1. **BO_AATF_LP_TS3** (R59) — listing shows all fields. Step text lists no fields.
2. **BO_AATF_LP_TS4** (R60) — Export CSV holds the updated fields.
3. **AATF_SCOR_TS1** (R61) — **duplicate id** of R49; new AATF account Confirmation of Registration.

### 3.9 Regression (R64-R72)

1. **Reg_BO_MCA_TS1** (R67) — edit ALL company fields; details page and BO "Confirmation of Registraion" [sic] PDF reflect them.
2. **Reg_BO_MCA_TS2** (R68) — listing row and Export CSV reflect all changes.
3. **Reg_UCD_MCA_TS3** (R69) — UCD Confirmation of Registration form and PDF complete and correct.
4. **Reg_BO_MAPA_TS1** (R70) — same as R67 for AATF/PBT.
5. **Reg_BO_MAPA_TS2** (R71) — same as R68 for AATF/PBT.
6. **Reg_AATF_MAPA_TS2** (R72) — AATF Confirmation of Registration. No `Reg_AATF_MAPA_TS1` exists.

## 4. Business rules and system behaviour

1. **Postcode required (edit):** "Postcode is required." (Sheet1 R4, R38).
2. **Postcode format:** "The field should allow numbers only." and "Minimum and maximum length: 5 characters." (Sheet1 R4, R5).
3. **Postcode short:** "Postcode must be 5 digits only." (Sheet1 R4, R21, R38, R50).
4. **Postcode long is blocked at typing:** "the BO user should not be able to enter additional characters." (Sheet1 R5, R22, R39, R51).
5. **Mailing Address required (edit):** "Mailing address is required." (Sheet1 R6, R40).
6. **Mailing Address characters:** "The field should allow alphanumeric and special characters only." (Sheet1 R6).
7. **Mailing Address length:** "Maximum length: 300 characters." (Sheet1 R7); over 300 "the field does not allow any additional characters to be entered." (Sheet1 R7).
8. **Director/Owner Name required (edit):** "Director / Owner Name is required." (Sheet1 R8, R42).
9. **Name characters (Director/Owner and e-Invoice PIC):** "The field should allow alphanumeric and the following special characters only: i. Apostrophe (') ii. Slash (/) iii. Dot (.) iv. Comma (,) v. Colon (:) vi. Dash (-) vii. Ampersat (@)" (Sheet1 R8, R13).
10. **Name case:** "The system should auto-capitalize all letters." (Sheet1 R8).
11. **Name length:** "Maximum length: 100 characters." (Sheet1 R9, R14).
12. **Three input methods** must each be tested: "Keyboard Typing", "Copy and paste in text field (CTRL C + CTRL V)", "Copy and paste in text field (Right-click mouse method)" (Sheet1 R8-R11, R13-R16).
13. **Director/Owner Email required (edit):** "Director / Owner Email Address is required." (Sheet1 R10, R44).
14. **Email prefix characters:** "The field should allow alphabets (a–z), numbers (0–9), and the following special characters in the prefix part (before “@”): i. Dot (.) ii. Underscore (_) iii. Hyphen (-)" (Sheet1 R10).
15. **Email case:** "The system should auto-convert all letters to lowercase." (Sheet1 R10).
16. **Email length:** "Maximum length: 100 characters." (Sheet1 R11).
17. **Director/Owner invalid email:** "Invalid email format for Director/Owner’s email." (Sheet1 R12, R29, R46, R58).
18. **e-Invoice PIC invalid email:** expected "Invalid email format for e-Invoice PIC’s email." (Sheet1 R17, R34). Seen on create: "the error popup shows "Invalid email format for e-Invoice Email Address."" (Sheet1 R34 Remark, bug EAINT-9019). Shown as a **popup** [unconfirmed whether all validation messages are popups].
19. **e-Invoice PIC Name and Email optional:** "Ensure that when the user removes the Name and clicks Update, the system allows the update to be completed successfully." (Sheet1 R13); same for Email (R15).
20. **Contact Person on Confirmation of Registration** is checked against the BO update (Sheet1 R20) [unconfirmed: Contact Person = Director/Owner Name].
21. **BO details page has a Confirmation of Registration action:** "click Confirmation of Registraion in details page" → "the PDF file is successfully downloaded" (Sheet1 R67, R70).
22. **Manage Company Account listing columns** (Sheet1 R35): "Company Name", "Company ROC", "New Company ROC", "Company ID", "Contact No", "Email Address", "Company Type", "RHB Status", "Limited Features For UCD to UCD", "eLKM", "RHB DD Number", "Group", "Company Account Status", "Registration Date", "Verified Date", "Activation Date", "Business Type", "SST Number", "e-Invoice PIC Name", "e-Invoice PIC Contact No", "e-Invoice PIC Email". ("New Company ROC" is listed twice in the cell.)

### 4.1 Against existing knowledge

1. `flow-bo-shell.md` §3.1 item 3 and `business-rules-from-test-scenarios.md` §10 item 1 cite **rows 4-11 only**. They miss: e-Invoice PIC rules (R13-R17), invalid-email messages (R12, R17), the create forms (R21-R34, R50-R58), the AATF/PBT forms (R38-R58), and the "over max is blocked at typing" rule.
2. Both files label the rules "Company account field validation". The sheet's Affected Screen for rows 4-17 reads "Manage AATF/PBT Accounts > Edit AATF/PBT Account". The rule set applies to **both** company and AATF/PBT accounts (R4-R17 vs R38-R46), so the knowledge label is narrow, not wrong.
3. **Contradiction 2** (`business-rules-from-test-scenarios.md` line 1030) still stands: this TS limits Director/Owner Name to ' / . , : - @ (R8). Nothing here tests UCD Decision Maker Name.
4. **Remarks contradict two rules already in knowledge** (max 100 for Name; prefix-only specials in Email). See §6 items 2-4.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. Deployment date "20251013" from `production-regression-scope.md` line 1052 [unconfirmed which staging env was used].
2. **Existing company used:** "Company Name: NJ AUTO HUB (M) SDN. BHD. ' < >" (Sheet1 R18-R20).
3. **Existing AATF/PBT used:** "Company Name: NJ DEREG AUTO (M) AUTOCORE 123 & CAR (M) SDN. BHD. ' < >" (Sheet1 R47-R49).
4. **Postcode samples:** "7545", "75450", "754509" (Sheet1 R4-R5).
5. **Mailing Address under 300:** "No. 128, Jalan Bunga Raya 5, Taman Seri Damai 1/1, …" (Sheet1 R6). **Exactly 300:** "No. 123-A /9-1, Jalan Setia Alam 3/5, …" (Sheet1 R7).
6. **Name under 100:** "John-Doe, Jr.: Head/Manager @ABC.Co-International's Office, Bldg-5 Unit/12. Floor-3" (Sheet1 R8).
7. **Name exactly 100:** two versions differ — "Unit-45/BB,R R&D-Dept." (R9, R43) and "Unit-45/B, R&D-Dept." (R14, R26, R31, R55) [unconfirmed which is exactly 100].
8. **Email under 100:** "john_doe-1990.profile.test-user_example.name-qa.team01@samplemail-domain123.com" (Sheet1 R10). **Exactly 100:** "JOHN_DOE-1990.PROFILE.TEST-USER_EXAMPLE.NAME-QA.TEAM1.LONG-PREFIX.CASE-STUDY.VALIDATION@MAILTEST.COM" (Sheet1 R11). R33 has a stray leading "j" ("jJOHN_DOE-…").
9. **Invalid email:** "john.doeexample.com" (Sheet1 R12).
10. **Over-limit method:** "add ONE extra alphabet" (Sheet1 R7, R9, R11).
11. **Accounts:** an existing UCD account, a newly registered UCD account, and AATF accounts. **No credentials** in the sheet.

## 6. Gaps and risks for regression

1. **Affected Screen labels look swapped** [unconfirmed]: rows `ECA_*` (R4-R17) say "Manage AATF/PBT Accounts > Edit AATF/PBT Account" but test company sections; rows `BO_AATF_D_*` (R38-R46) say "Manage  AATF/PBT Account > Edit Company Account". Confirm the real screen before reusing either block.
2. **Name max 100 not enforced** per remarks marked Pass: "Can input more than 100 char" (R9), "It can accept more 100 characters." (R25), "The users can type more than 100 characters and also can be updated successfully. Retested 13/10/2025" (R31). A regression should check the 101st character on every Name field, all three input methods.
3. **Space in Name blocked:** "Cant enter space for name" (R8); "Cant put space" + EAINT-9016 (R42, R43). The allowed-character list in R8 does not name space, so the spec itself is unclear [unconfirmed whether space is allowed after the fix].
4. **"@" accepted beyond one** in Director/Owner Email on create: "The '@' special character can still be entered." (R28). Check a second "@" is rejected.
5. **e-Invoice PIC error wording** bug EAINT-9019 (R34). Check the message reads "Invalid email format for e-Invoice PIC’s email."
6. **Pass recorded over known defects.** The Test Result column does not show the bug state. Treat rows R8, R9, R25, R28, R31, R34, R42, R43 as **needing a check**, not proven.
7. **Not tested:**
   1. Leading/trailing spaces and Chinese characters (covered for Decision Maker in EAINT-8644, not here).
   2. Disallowed characters (e.g. "#", "&", "<") on Name — only allowed ones are typed.
   3. Mailing Address disallowed characters; the rule says "special characters" without a list.
   4. Mandatory-blank messages on the two create forms.
   5. Email domain part rules (only the prefix is specified).
   6. UCD-side self-edit of these fields, if any [unconfirmed it exists].
8. **Duplicate id** "AATF_SCOR_TS1" (R49, R61) and missing "Reg_AATF_MAPA_TS1" (R72) — evidence files may collide.
9. **Typos in steps:** "Export CV" (R36), "Confirmation of Registraion" (R67, R70), "registred" (R35-R37, R59-R61).

## Knowledge candidates

1. **Validation applies to four BO forms**, not just company edit: edit/create company account and edit/create AATF/PBT account. Source: Sheet1 R4-R58 (ids ECA_, CNCA_, BO_AATF_D_, BO_AATF_CN_). Target: `flow-bo-shell.md` §3.1 item 3.
2. **Over-limit input is blocked at typing**, not by a message: "the field does not allow any additional characters to be entered." (Sheet1 R7, R9, R11); Postcode "the BO user should not be able to enter additional characters." (Sheet1 R5).
3. **Invalid email messages:** "Invalid email format for Director/Owner’s email." (Sheet1 R12); "Invalid email format for e-Invoice PIC’s email." (Sheet1 R17).
4. **e-Invoice PIC Name/Email optional** but follow the Name/Email rules (Sheet1 R13-R16).
5. **Three input methods** (typing, Ctrl C + Ctrl V, right-click paste) are the team's practice for length/character checks (Sheet1 R8 note: "Ensure to test ALL three input methods to verify that the field behavior .").
6. **Open defects at deploy, per remarks:** EAINT-9016 "Cant put space" (Sheet1 R42-R43); EAINT-9019 wrong e-Invoice email message (Sheet1 R34); Name over 100 accepted (Sheet1 R9, R25, R31). Status after 13/10/2025 [unconfirmed]. Target: traps or `business-rules-from-test-scenarios.md` §10.
7. **BO details page has a Confirmation of Registration PDF action** (Sheet1 R67, R70); UCD and AATF portals have Settings > Confirmation of Registration with Print to PDF (Sheet1 R20, R49).
8. **Manage Company Account listing column set** as listed in Sheet1 R35 (§4 item 22). Target: a future `flow-bo-company-accounts.md` [unconfirmed against live HTML; no capture saved].
9. **Catalogue correction:** `cr-test-scenario-catalogue.md` line 225 owner "Amirul Azfar" — sheet shows three testers (Azfar, Teck Yung, Nadhirah) (Sheet1 QA column).
