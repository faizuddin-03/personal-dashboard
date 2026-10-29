# EAINT-6762 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy:** `_reference/sharepoint/qa-team-ts/EAINT-6762 - 🟣[eAuto-Backoffice] Company Account Listing - Audit Log Issue.md` (export dated "28/10/2026, 12:56:02 am"; cell text only, no formatting or images). Row numbers below (R#) come from this file.
2. **Second text copy:** `_reference/inbox/eauto-flows-run/ts-text/EAINT-6762_-_eAuto-Backoffice_Company_Account_Listing_-_Audit_Log_Issue.xlsx.txt` — same content; used to read the long rows the first copy wraps.
3. **Workbook itself** (`_reference/sharepoint/eauto-cr-test-scenarios/EAINT-6762 - ...xlsx`): not opened; colours, dropdowns and images not checked.
4. **Ticket folders:** `_reference/tickets/EAINT-6762/` and `_reference/tickets/Studying/EAINT-6762/` held nothing before this study.
5. **`lib/ticketStudies.ts`:** no entry for EAINT-6762.
6. **knowledge/:** `cr-test-scenario-catalogue.md` (rows 222, 404), `business-rules-from-test-scenarios.md` (§ 6, lines 670-676), `flow-bo-shell.md` (lines 95-100), `flow-ssm.md` (line 131), `flow-ucd-to-ucd.md` (lines 127, 160), `production-regression-scope.md` (line 982), `script-inventory-team.md` (lines 54, 260), `flow-ucd-company-listing.md` (lines 175-181).
7. **Not read:** Jira ticket, SRD and Teams (this is an unattended run; no connectors used).

## 1. Header

1. **Ticket:** EAINT-6762 — "🟣[eAuto-Backoffice] Company Account Listing - Audit Log Issue" (both sheets, R2).
2. **Portal / module:** eAuto **Backoffice (BO)** — Company Account Listing, company account details and its **audit log**.
3. **Workbook:** "EAINT-6762 - 🟣[eAuto-Backoffice] Company Account Listing - Audit Log Issue.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 19/04/2026, 9:35:20 pm.
4. **Sheets (2):**
   1. "Company Account Audit Log" — 30 scenarios (CAL_6762_TS1 to CAL_6762_TS30), plus an unscored "Below here P2 if have time" field list (R45-R88).
   2. "Concurrent Update or Create" — 4 scenarios (CON_TS1 to CON_TS4).
5. **Total scenarios:** **34**. The catalogue (`cr-test-scenario-catalogue.md` row 222) records 35 (31 + 4); the sheet holds 30 numbered rows on sheet 1 [unconfirmed: catalogue likely counted a header row].
6. **Results:**
   1. Sheet 1: **26 PASS**, **4 N/A** (TS14, TS16, TS18, TS20 — all "Deprioritized"), 0 FAIL.
   2. Sheet 2: **4 PASS**.
   3. Overall: **30 PASS, 4 N/A, 0 FAIL**.
7. **Testers (QA column):** two QA engineers — "Nick" (non-restart rows) and "Charmain" (server-restart rows and all concurrency rows).
8. **Dates:** none written in the sheet. Remarks example values use "(16/4)" and "(17/4)" (R33), so testing ran around **16-17 April 2026** [unconfirmed]. Production deploy listed as "20260421" (`production-regression-scope.md` line 982).
9. **Environment:** "Test environment: staging/uat3" (both sheets, R4).

## 2. What the ticket changed, as the TS shows it

1. **Bug being fixed:** company audit logs were recording one company's changes under other companies. Objective: "To ensure company audit logs correctly capture permission changes for each company" (both sheets, R5).
2. **Expected fix:** "1. Ensure updates/changes made in Company A are not incorrectly logged under Company B & C 2. System should accurately track and display changes for each company in the audit log" (sheet "Company Account Audit Log", R8, Expected Result).
3. **Test method:** a BO superadmin changes the same field on three companies (A, B, C) with different values: "BO Superadmin User update the respective field / permission in the company accounts" (sheet 1, R8, Test Steps).
4. **Server restart and concurrency** are tested on purpose, which points to a **shared in-memory "old value"** across companies as the root cause [unconfirmed — no SRD or dev note read].
5. **Audit log format** shown by the TS: "[Field] Old: X New: Y" for every field covered.

## 3. Scenarios

### A. Sheet "Company Account Audit Log" — per-field audit entries (Company A / B / C)

Normal change (QA Nick):

1. **CAL_6762_TS1** (R10) — STMS SSM permission on → "[SSM Permission] Old: Unticked New: Ticked". PASS.
2. **CAL_6762_TS2** (R11) — STMS SSM permission off → "[SSM Permission] Old: Ticked New: Unticked". PASS.
3. **CAL_6762_TS4** (R13) — eSTM SSM permission on → "[ESTM SSM Permission] Old: Unticked New: Ticked". PASS.
4. **CAL_6762_TS5** (R14) — eSTM SSM permission off → "[ESTM SSM Permission] Old: Ticked New: Unticked". PASS.
5. **CAL_6762_TS7** (R16) — Bypass Purchase SSM on → "[Bypass Purchase SSM Permission] Old: Unticked New: Ticked". PASS.
6. **CAL_6762_TS8** (R17) — Bypass Purchase SSM off → "[Bypass Purchase SSM Permission] Old: Ticked New: Unticked". PASS.
7. **CAL_6762_TS10** (R19) — eLKM permission on → "[eLKM Permission] Old: Unticked New: Ticked". PASS.
8. **CAL_6762_TS11** (R20) — eLKM permission off → "[eLKM Permission] Old: Ticked New: Unticked". PASS.
9. **CAL_6762_TS13** (R22) — eLKM Max. Authorized User 2→10 / 5→3 / 7→20 → "[eLKM Permission - Max. Authorized User] Old: 2 New: 10" (etc.). PASS.
10. **CAL_6762_TS15** (R24) — eSTM 1-layer Max. Authorized User 10→0 / 5→25 / 20→10 → "[ESTM Permission - Max. Authorized User] Old: 10 New: 0" (etc.). PASS.
11. **CAL_6762_TS17** (R26) — Company Name change → "[Company Name] Old: AUTO SDN BHD New: AUTOCAR SDN. BHD." (etc.). PASS.
12. **CAL_6762_TS19** (R28) — TIN Number change, incl. to/from blank → "[TIN Number] Old: PT2684166103 New:" and "[TIN Number] Old: New: C25701253020". PASS.
13. **CAL_6762_TS21** (R30) — Transaction Restriction on → "[Transaction Restriction] Old: Unticked New: Ticked". PASS.
14. **CAL_6762_TS22** (R31) — Transaction Restriction off → "[Transaction Restriction] Old: Ticked New: Unticked". PASS.
15. **CAL_6762_TS24** (R33) — Remarks change, append / clear / fill → "[Remarks] Old: (16/4) Remarks TEST New:" (etc.). PASS.
16. **CAL_6762_TS26** (R35) — RHB Account checkbox on → "[RHB Account Active] Old: Unticked New: Ticked". PASS.
17. **CAL_6762_TS27** (R36) — RHB Account checkbox off → "[RHB Account Active] Old: Ticked New: Unticked". PASS.
18. **CAL_6762_TS29** (R38) — RHB Account Number text change → "[RHB Account Number] Old: 123456789 New: 987654321" (etc.). PASS.

After server restart (QA Charmain):

19. **CAL_6762_TS3** (R12) — STMS SSM → "[SSM Permission] Old: Unticked New: Ticked" for A, B, C. PASS.
20. **CAL_6762_TS6** (R15) — eSTM SSM → "[ESTM SSM Permission] Old: Unticked New: Ticked". PASS.
21. **CAL_6762_TS9** (R18) — Bypass Purchase SSM → "[Bypass Purchase SSM Permission] Old: Unticked New: Ticked". PASS.
22. **CAL_6762_TS12** (R21) — eLKM → "[eLKM Permission] Old: Unticked New: Ticked". PASS.
23. **CAL_6762_TS14** (R23) — eLKM Max. Authorized User; Company A "Null → 10" → "No audit log will be recorded". **N/A**, "Deprioritized".
24. **CAL_6762_TS16** (R25) — eSTM Max. Authorized User; Company A "Null → 15" → "No audit log will be recorded". **N/A**, "Deprioritized". Scenario text omits "after server restart" but data matches the restart pattern [unconfirmed: copy slip].
25. **CAL_6762_TS18** (R27) — Company Name; Company A "Null → UC COMPANY AUTO" → "No audit log will be recorded". **N/A**, "Deprioritized".
26. **CAL_6762_TS20** (R29) — TIN Number; Company A "Null → IG21214632070" → "No audit log will be recorded". **N/A**, "Deprioritized".
27. **CAL_6762_TS23** (R32) — Transaction Restriction → "[Transaction Restriction] Old: Ticked New: Unticked" (A). PASS.
28. **CAL_6762_TS25** (R34) — Remarks; "Null → Remarks ABC" → "[Remarks] Old: New: Remarks ABC". PASS.
29. **CAL_6762_TS28** (R37) — RHB Account checkbox → "[RHB Account Active] Old: Unticked New: Ticked". PASS.
30. **CAL_6762_TS30** (R39) — RHB Account Number; "Null → 21214632070" → "[RHB Account Number] Old: New: 21214632070". PASS.

### B. Sheet "Concurrent Update or Create" (all P1, QA Charmain)

1. **CON_TS1** (R8) — Create UCD Company A with all fields and all permissions, at the same time as B → "Audit log shows 1 "Create New Company" entry with correct data (no data from Company B present)". PASS.
2. **CON_TS2** (R9) — Create UCD Company B, mandatory fields only, permissions off, at the same time as A → expected text repeats CON_TS1's ("Company A created successfully …") [unconfirmed: copy slip; should read Company B]. PASS.
3. **CON_TS3** (R10) — Update UCD Company C, all fields and permissions, at the same time as D → "Audit log shows "Update Company Information" entry with correct data (no data from Company D present)". PASS.
4. **CON_TS4** (R11) — Update UCD Company D, mandatory fields/permissions only, at the same time as C → "Audit log shows "Update Company Information" entry with correct data (no data from Company C present)". PASS.

### C. Not scored

1. **P2 field list** (sheet 1, R45-R88): "Below here P2 if have time" followed by "Fields:" and 41 field labels (Company Type, Company Reg. No., addresses, attachments, "Block STMS Category:", "UCD Company: Allowed To Accept Interstate Transaction From:", Main User, Directors, Decision Maker, Transaction Payment Details). No TS ids, steps or results.

## 4. Business rules and system behaviour the TS reveals

1. **One company, one log.** "Ensure updates/changes made in Company A are not incorrectly logged under Company B & C" (sheet 1, R8).
2. **Entry format** is a bracketed label, then "Old:" and "New:" — e.g. "[SSM Permission] ⏎ Old: Unticked ⏎ New: Ticked" (sheet 1, R10; "⏎" = line break in the cell).
3. **Audit labels differ from the BO field names:**
   1. "Purchase SSM Document > STMS - Company Category" logs as "[SSM Permission]" (R10).
   2. "Purchase SSM Document > ESTM - Company Category" logs as "[ESTM SSM Permission]" (R13).
   3. "Purchase SSM Document > Bypass Purchase SSM - User Category" logs as "[Bypass Purchase SSM Permission]" (R16).
   4. "eSTM Perm - 1 layer Permission Max. Authorized User" logs as "[ESTM Permission - Max. Authorized User]" (R24).
   5. "RHB Account Number (checkbox)" logs as "[RHB Account Active]" (R35); the textbox logs as "[RHB Account Number]" (R38).
4. **Checkboxes log as "Ticked" / "Unticked"**, numbers and text log the raw value (R10, R22, R26).
5. **Blank values log as empty**, not "Null" or "-": "[TIN Number] Old: PT2684166103 New:" and "[TIN Number] Old: New: C25701253020" (sheet 1, R28).
6. **eSTM Max. Authorized User accepts 0:** "10 → 0" logs "[ESTM Permission - Max. Authorized User] Old: 10 New: 0" (sheet 1, R24).
7. **Remarks keep earlier lines when appended:** "Old: (16/4) Remarks ONE New: (16/4) Remarks ONE (17/4) Remarks TWO" (sheet 1, R33).
8. **After a server restart, a never-set checkbox logs as "Unticked":** step "Null → Tick", expected "[SSM Permission] Old: Unticked New: Ticked" (sheet 1, R12; same for R15, R18, R21, R37).
9. **After a server restart, a never-set number/name/TIN does not log:** "No audit log will be recorded" (sheet 1, R23, R25, R27, R29, Company A). Marked "Deprioritized ⏎ As discussed with Brandon, this is P3 scenario and not related to the issue." (same rows, Remarks). Remarks and RHB Account Number from blank **do** log (R34, R39).
10. **Audit entry names:** "Create New Company" for creation, "Update Company Information" for updates (sheet "Concurrent Update or Create", R8, R10).
11. **Concurrency check:** created company must appear "in company account listing" and the "Details page shows all fields and all permissions correctly" (sheet 2, R8).
12. **BO field labels** on the company account page (sheet 1, R46-R88), e.g. "Block STMS Category:", "UCD Company: Allowed To Accept Interstate Transaction From:", "Transaction Payment Details > Pay on Behalf", "Transaction Payment Details > Group Type".

## 5. Test data, environments, accounts, setup

1. **Environment:** "staging/uat3" (both sheets, R4).
2. **BO accounts** in column "Backoffice User Role" (actually usernames): "mfizni" (TS1-TS12), "eautosoyeng" (TS13-TS20), "jasons" (TS21-TS30). **No passwords in the sheet.**
3. **Role:** "BO Superadmin User" (sheet 1, R8).
4. **Test companies (sheet 1):**
   1. "Nick's companies for reference if need: - AUTOCAR SDN. BHD. - 123 MOTOR ENTERPRISE (M) - A & B USED CAR CO. - AUTOCORE PE123 & CAR (M) SDN. BHD. ' < >" (R10, Remarks).
   2. "Charmain's companies for reference if need: - COMPANY A (CHARMAIN 6762) - COMPANY B (CHARMAIN 6762) - CHARRRRRR CHICKCOLI SDN BHD123321" (R12, Remarks).
5. **Sample values:** TINs such as "D0883202904", "SG06162795100", "C25701253020" (R28); RHB numbers "123456789", "1000234567" (R38). All test data.
6. **Server restart:** rows TS3, TS6, TS9, TS12, TS14, TS16, TS18, TS20, TS23, TS25, TS28, TS30 need a restart of the BO server before the change. How the restart was done is not written.
7. **Concurrency runs:** "Test executed using automation script - by running concurrent create new and update company account actions with more than 2 testers." (sheet 2, R8-R11, Remarks). Likely the colleague's `backoffice-audit` two-browser harness (`script-inventory-team.md` line 260) [unconfirmed].

## 6. Gaps or risks a regression should still cover

1. **P2 fields never tested:** 41 fields at R46-R88 have no result — addresses, attachments, Main User, Directors, Decision Maker, "Block STMS Category", "Allowed To Accept Interstate Transaction From", Pay on Behalf, Group Type. Their audit entries and labels are unverified.
2. **Restart gap left open:** first change after a restart for Max. Authorized User, Company Name and TIN logs nothing (R23, R25, R27, R29). Accepted as P3, so a real change can go unlogged. Regression should confirm it is still the known behaviour, not a wider loss.
3. **Concurrency only in pairs:** CON_TS1-TS4 race two companies; no race on the **same** company, no create-vs-update race.
4. **Multi-field edits:** each TS changes one field. One save with several fields changed (one entry or many?) is untested, except inside CON_TS3.
5. **Other audit sources:** CSV export also writes an audit log (`business-rules-from-test-scenarios.md` line 666); not covered here.
6. **Sheet slips to note when reusing:** CON_TS2 expected text names "Company A" (sheet 2, R9); CAL_6762_TS16 lacks "after server restart" (R25); CAL_6762_TS23 Company B expected misses a "]" — "[Transaction Restriction Old: Unticked" (R32).
7. **Non-superadmin roles:** only "BO Superadmin User" tested; whether lower BO roles create correct entries is not covered.

## Contradictions / corrections to knowledge/

1. `flow-bo-shell.md` lines 95-100 and `business-rules-from-test-scenarios.md` lines 670-674 cite "rows 10-30". Scenario rows actually run **R10-R39** in the current text copy.
2. Same two places list the labels but miss **"[Remarks]"**, **"[RHB Account Active]"** and **"[RHB Account Number]"** (R33-R39).
3. `cr-test-scenario-catalogue.md` row 222 gives "Company Account Audit Log:31" and total 35; the sheet has **30** scenarios, total **34**.
4. No knowledge file records the **restart behaviour** (§ 4 items 8-9) or the **blank-value format** (§ 4 item 5).

## Knowledge candidates

1. **Extra audit labels** for `flow-bo-shell.md` § 2: "[Remarks]", "[RHB Account Active]" (checkbox), "[RHB Account Number]" (textbox). Source: SharePoint TS #052 EAINT-6762, sheet "Company Account Audit Log", R33-R39.
2. **Field label ≠ audit label map** (§ 4 item 3), e.g. "Purchase SSM Document > STMS - Company Category" → "[SSM Permission]". Source: same sheet, R10, R13, R16, R24, R35, R38.
3. **Blank values log empty:** "[TIN Number] Old: PT2684166103 New:". Source: same sheet, R28.
4. **Restart behaviour:** never-set checkbox logs "Old: Unticked"; never-set number/name/TIN logs nothing — "No audit log will be recorded", accepted as P3 ("As discussed with Brandon, this is P3 scenario and not related to the issue."). Source: same sheet, R12, R23, R25, R27, R29.
5. **Row-range fix:** change "rows 10-30" to "rows 10-39" in `flow-bo-shell.md` line 100 and `business-rules-from-test-scenarios.md` line 674. Source: text copy dated 28/10/2026.
6. **Catalogue count fix:** `cr-test-scenario-catalogue.md` row 222 — 30 + 4 = 34; results 30 PASS, 4 N/A. Source: both sheets.
7. **Concurrency TS was automated** with "more than 2 testers" (sheet "Concurrent Update or Create", R8-R11 Remarks) — candidate for `script-inventory-team.md` row 5 (`backoffice-audit`) as a link to EAINT-6762 [unconfirmed link].
