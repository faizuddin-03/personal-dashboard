# EAINT-8683 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of a QA colleague's test script. Nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8683 & 8688 - [eAuto - Backoffice] To Enable SSM Permission (STMS & eSTM), Untick CheckBox & Add Remarks.md` (text copy dated "28/10/2026, 12:54:22 am"). Cell text only. **Formatting, colours, comments and images were not kept**, so none could be read.
2. **knowledge/cr-test-scenario-catalogue.md** row 078 (lines 174, 430).
3. **knowledge/flow-ssm.md** (whole file) and **knowledge/flow-stms.md** lines 270–310.
4. **knowledge/README.md** (index rows for flow-stms, flow-ssm, flow-ucd-company-listing).
5. **Not found:** `_reference/tickets/EAINT-8683/` held no files before this study. `_reference/tickets/Studying/EAINT-8683/` does not exist. `lib/ticketStudies.ts` has no entry for EAINT-8683 or EAINT-8688.
6. **Not read:** Jira ticket, SRD and Teams. This run had no access, and none were in the repo.

## 1. Header

1. **Tickets:** EAINT-8683 and EAINT-8688 (one workbook, one sheet each).
2. **Module / portal:** eAuto **BackOffice**, Manage Company Accounts (company-level settings). Type: **data patch** by eAuto Ops, not a code change [unconfirmed: from the scenario wording "selected for patching by eAuto Ops"].
3. **Workbook:** "EAINT-8683 & 8688 - [eAuto - Backoffice] To Enable SSM Permission (STMS & eSTM), Untick CheckBox & Add Remarks.xlsx". SharePoint library "eAuto - CR Test Scenarios", modified 23/04/2026, 6:03:49 pm.
4. **Sheets:** "EAINT-8683", "EAINT-8688".
5. **Scenario count:**
   1. **EAINT-8683:** 24 TS ids (8683_TS1–TS24), **25 data rows**. 8683_TS22 has two rows (two ROCs for one company).
   2. **EAINT-8688:** 9 TS ids (8688_TS1–TS9), **10 data rows**. 8688_TS7 has two rows (two ROCs for one company).
   3. **Total:** 33 TS ids, 35 rows. Matches the catalogue's "33".
6. **Result counts:**
   1. **EAINT-8683, Staging /preprod1:** 25 of 25 rows PASS.
   2. **EAINT-8683, Production:** 8 rows PASS (TS1, TS5, TS7, TS16, TS19, TS21, TS22 ×2). The other 17 rows have **no Production result**. No FAIL anywhere.
   3. **EAINT-8688:** 10 of 10 rows PASS on Staging /preprod1 and 10 of 10 PASS on Production.
7. **Tester and dates:** none written in the sheet. The catalogue lists "Amirul Azfar | 2026-04-23" (knowledge/cr-test-scenario-catalogue.md line 174). The 2026-04-23 date matches the SharePoint modified date, not a test date [unconfirmed]. The remark text in the sheet carries the date "15/08/2025".

## 2. What the ticket changed, as the TS shows it

1. **EAINT-8683:** a chosen list of UCD companies has **SSM Permission switched on for both STMS and eSTM**. Sheet "EAINT-8683" R3: "To ensure UCD Company that is selected for patching by eAuto Ops is updated to enable SSM Permission (STMS & eSTM)".
2. **EAINT-8688:** for a chosen list of UCD companies, the **Block STMS Category** boxes **'Company'** and **'Limited Features'** are unticked, and a **remark** is added to the company record. Sheet "EAINT-8688" R1: "EAINT-8688 - [eAuto-BackOffice] To Untick Checkbox Block STMS Category & Add Remarks".
3. **The remark wording depends on the "before" state** of the two boxes (see section 4).
4. **Why** (from the remark text): "Ket Ming request enable STMS & eSTM integration with SSM." (sheet "EAINT-8688" R3). The person named is the requester; role not stated in the sheet.

## 3. Scenarios

### A. EAINT-8683 — enable SSM Permission (STMS & eSTM)

Every row expects the company to be "updated to enable SSM Permission (STMS & eSTM)" (sheet "EAINT-8683" R3). Columns: TS No. | UCD Company Name | UCD Old Company ROC | Staging - /preprod1 | Production.

1. **8683_TS1** — MIN CHEONG USE CAR, MP0005717-H — Staging PASS, Prod PASS.
2. **8683_TS2** — LY EASY PURCHASE, TR0156930-U — Staging PASS.
3. **8683_TS3** — JF FIRST AUTOMOBILE SDN. BHD., 715644-U — Staging PASS.
4. **8683_TS4** — EL PUBLIC MOTOR SDN. BHD., 1134255-A — Staging PASS.
5. **8683_TS5** — YONG CHAI MOTOR, 51464 — Staging PASS, Prod PASS.
6. **8683_TS6** — TED FAH MOTOR TRADING COMPANY, 18490 — Staging PASS.
7. **8683_TS7** — CK MOTORS, MRI/2013/209 — Staging PASS, Prod PASS.
8. **8683_TS8** — LONGCHAMP AUTOMOBILE, LD/2017/3489 — Staging PASS.
9. **8683_TS9** — KEE MOTOR, F870083 — Staging PASS.
10. **8683_TS10** — CITY USED CAR DEALER, F946196 — Staging PASS.
11. **8683_TS11** — MOTOR JAYA, R30610/00 — Staging PASS.
12. **8683_TS12** — L & L MOTOR, R11530/2008 — Staging PASS.
13. **8683_TS13** — VUN HIN MOTOR, 2387/14 — Staging PASS.
14. **8683_TS14** — LUNG MOTOR, 107/09 — Staging PASS.
15. **8683_TS15** — ARENA MEWAH GROUP, G135006 — Staging PASS.
16. **8683_TS16** — PACIFIC AUTO COMPANY, SA2007483 — Staging PASS, Prod PASS.
17. **8683_TS17** — YEW LEONG MOTOR COMPANY, 57540/Q — Staging PASS.
18. **8683_TS18** — GUAN HO COMPANY, 935/Q — Staging PASS.
19. **8683_TS19** — IRAMANIS MOTOR, 0000084039T — Staging PASS, Prod PASS.
20. **8683_TS20** — RICCO AUTOMOBILE, 0000156348T — Staging PASS.
21. **8683_TS21** — MUSBAR MAJU AUTO, 201403131982 — Staging PASS, Prod PASS.
22. **8683_TS22** — EXCEL ONE CAR AUTOMART, two rows: NS0193082-D and 003390981-P — both Staging PASS, Prod PASS.
23. **8683_TS23** — BINTANG JAYA AUTO, NS0027017-P — Staging PASS.
24. **8683_TS24** — JAS AUTO TRADING, 002653092-K — Staging PASS.

### B. EAINT-8688 — untick Block STMS Category + add remark

Columns: TS No. | Company | Old ROC | Staging Before (Company, Limited Features) | Staging Expected | Prod Before (Company, Limited Features) | Prod Expected | Staging result | Prod result. The "Expected" cell holds a number that points to case 1, 2 or 3 in R3.

1. **8688_TS1** — LY EASY PURCHASE, TR0156930-U — Staging Ticked/Ticked → 1; Prod Ticked/Ticked → 1 — PASS / PASS.
2. **8688_TS2** — TED FAH MOTOR TRADING COMPANY, 18490 — Staging Unticked/Unticked → 2; Prod Unticked/Unticked → 2 — PASS / PASS.
3. **8688_TS3** — LONGCHAMP AUTOMOBILE, LD/2017/3489 — Unticked/Unticked → 2 on both — PASS / PASS.
4. **8688_TS4** — NINE FIVE ENTERPRISE, SA0359788-H — Ticked/Ticked → 1 on both — PASS / PASS.
5. **8688_TS5** — RICCO AUTOMOBILE, 0000156348T — Staging Ticked/Ticked → 1; **Prod Unticked/Unticked → 2** — PASS / PASS.
6. **8688_TS6** — MUSBAR MAJU AUTO, 201403131982 — Unticked/Unticked → 2 on both — PASS / PASS.
7. **8688_TS7** — EXCEL ONE CAR AUTOMART, two rows:
   1. NS0193082-D — Staging Unticked/Unticked → 2; **Prod Ticked/Unticked → 3** — PASS / PASS.
   2. 003390981-P — Ticked/Ticked → 1 on both — PASS / PASS.
8. **8688_TS8** — BINTANG JAYA AUTO, NS0027017-P — Ticked/Ticked → 1 on both — PASS / PASS.
9. **8688_TS9** — GT CAR DEALER SDN. BHD., 1049821-D — Ticked/Unticked → 3 on both — PASS / PASS.

## 4. Business rules and system behaviour the TS reveals

1. **Patch scope is a named list.** Only companies "selected for patching by eAuto Ops" are touched (sheet "EAINT-8683" R3; sheet "EAINT-8688" R3).
2. **SSM Permission is set for STMS and eSTM together.** Sheet "EAINT-8683" R3: "enable SSM Permission (STMS & eSTM)". This fits flow-ssm.md's two company boxes 'STMS - Company Category' and 'ESTM - Company Category' [unconfirmed: the sheet does not name the boxes].
3. **Block STMS Category has the boxes 'Company' and 'Limited Features'.** Sheet "EAINT-8688" R3 refers to "Checkbox 'Company' and 'Limited Features' in Block STMS Category".
4. **Case 1 — both ticked before.** Sheet "EAINT-8688" R3: "1. If Before: Both Company & Limited Features Ticked ⏎ To ensure UCD Company that is selected for patching by eAuto Ops is updated to untick Checkbox 'Company' and 'Limited Features' in Block STMS Category  & Add Remarks  "15/08/2025 hh:mmam (Jason) - Ket Ming request enable STMS & eSTM integration with SSM. Untick checkbox for category Company and Limited Features for UCD to UCD.""
5. **Case 2 — both unticked before.** Sheet "EAINT-8688" R3: "2. If Before: Both Company & Limited Features Unticked ⏎ To ensure UCD Company that is selected for patching by eAuto Ops remain unticked for Checkbox 'Company' and 'Limited Features' in Block STMS Category  & Add Remarks  "15/08/2025 hh:mmam (Jason) - Ket Ming request enable STMS & eSTM integration with SSM.""
   1. **A remark is still added** even when no box changes.
6. **Case 3 — Company ticked, Limited Features unticked.** Sheet "EAINT-8688" R3: "3. If Before: Company Ticked & Limited Features Unticked ⏎ To ensure UCD Company that is selected for patching by eAuto Ops is updated to untick Checkbox 'Company' and remain unticked for 'Limited Features' in Block STMS Category  & Add Remarks  "15/08/2025 hh:mmam (Jason) - Ket Ming request enable STMS & eSTM integration with SSM. Untick checkbox for category Company.""
7. **Case 4 — not tested.** Sheet "EAINT-8688" R3: "4. If Before: Company Unticked & Limited Features Ticked - Currently there's no UCD with this condition in both Staging & Prod".
8. **Remark format.** "15/08/2025 hh:mmam (Jason) - …" (sheet "EAINT-8688" R3). Pattern: date, time with am/pm, BO user in brackets, then the reason [unconfirmed: "hh:mmam" is a placeholder, so the real time format is not shown].
9. **"Limited Features" is tied to UCD to UCD.** Case 1 remark: "Untick checkbox for category Company and Limited Features for UCD to UCD." (sheet "EAINT-8688" R3).
10. **Staging and production data differ.** The same company can start in a different state on each environment. Example: RICCO AUTOMOBILE, Staging "Ticked | Ticked | 1", Prod "Unticked | Unticked | 2" (sheet "EAINT-8688" R11).
11. **One company can hold more than one Old ROC.** EXCEL ONE CAR AUTOMART appears with "NS0193082-D" and "003390981-P" (sheet "EAINT-8683" R28–R29; sheet "EAINT-8688" R13–R14). Each ROC is a separate company account with its own settings [unconfirmed: inferred from the two different "before" states in "EAINT-8688" R13–R14].
12. **Old ROC formats vary widely.** Examples: "MP0005717-H", "51464", "MRI/2013/209", "R30610/00", "0000084039T", "201403131982" (sheet "EAINT-8683" R7, R11, R13, R17, R25, R27).

## 5. Test data, environments, accounts and setup

1. **Environments:** "Staging - /preprod1" and "Production" (sheet "EAINT-8683" R6; sheet "EAINT-8688" R6). Note: from 2026-10-21 staging is the /eauto instance; /preprod1 was the instance at the time of this test [unconfirmed: from memory note on staging instances].
2. **Data:** real UCD company names and Old Company ROC numbers, listed in section 3. EAINT-8683 lists 25 company accounts. EAINT-8688 lists 10.
3. **Overlap between the two lists:** LY EASY PURCHASE, TED FAH MOTOR TRADING COMPANY, LONGCHAMP AUTOMOBILE, RICCO AUTOMOBILE, MUSBAR MAJU AUTO, EXCEL ONE CAR AUTOMART (both ROCs), BINTANG JAYA AUTO appear on both sheets.
4. **Only on the EAINT-8688 sheet:** NINE FIVE ENTERPRISE (SA0359788-H) and GT CAR DEALER SDN. BHD. (1049821-D). Neither is on the EAINT-8683 list.
5. **Accounts:** no logins or URLs in the sheet. **No credentials present.**
6. **Setup:** read the Block STMS Category boxes on each company **before** the patch and record them, then check after. The sheet records the "before" state per environment.

## 6. Gaps and risks a regression should still cover

1. **17 of 25 EAINT-8683 rows have no Production result.** Either production was checked on a sample only, or the cells were left blank [unconfirmed]. A regression should confirm SSM Permission is on in production for all listed companies.
2. **No functional check.** The TS checks settings only. It does not run an STMS or eSTM company transaction to show [Purchase SSM] is now offered at Step 4, or that UCD to UCD with a Company seller is no longer blocked.
3. **Box names not stated.** The sheet says "SSM Permission (STMS & eSTM)" but not whether both 'STMS - Company Category' and 'ESTM - Company Category' were checked separately.
4. **Remark not checked word for word in the result.** Results are PASS only; the actual saved remark text and time are not recorded.
5. **Case 4 never tested** (Company Unticked, Limited Features Ticked). A future patch on such a company has no tested remark wording.
6. **'Foreigner' box not mentioned.** flow-stms.md lists Block STMS Category as "Foreigner, Company, Limited Features for UCD to UCD". The TS does not say whether 'Foreigner' was left unchanged.
7. **Audit log not checked.** flow-ssm.md says "Company Account audit log and remarks (see EAINT-6762) after data patches. [ts: EAINT-8688]", but this sheet only covers the remark, not an audit log row.
8. **Later model change.** EAINT-8802 (2026-01) added user-level Bypass Purchase SSM. A company patched to SSM Permission ON now forces purchase unless the user has bypass (flow-ssm.md, Rules, matrix). These companies' users may behave differently from August 2025.
9. **Non-patched companies.** No negative row checks that a company outside the list was left unchanged.

## 7. Where this TS differs from knowledge/

1. **Company count for EAINT-8688 is wrong in knowledge.** knowledge/flow-ssm.md line 160: "EAINT-8688 (2025-08): Untick Block STMS Category for 24 companies." and knowledge/flow-stms.md line 308: "EAINT-8688 (2025-08): Data patch: untick Block STMS Category (Company, Limited Features) for 24 companies." The sheet "EAINT-8688" has **9 TS ids / 10 company rows**, not 24.
2. **EAINT-8683 count is close but not exact.** knowledge/flow-ssm.md lines 105 and 159 say "24 companies". The sheet has 24 TS ids but **25 company accounts** (EXCEL ONE CAR AUTOMART has two ROCs).
3. **Catalogue row count.** knowledge/cr-test-scenario-catalogue.md line 174 says "EAINT-8683:24; EAINT-8688:9 | 33". This matches TS ids, not data rows (25 + 10 = 35).
4. **Catalogue says "no business rule".** Line 174: "Company-by-company patch list; no business rule". The EAINT-8688 sheet does carry rules: the three before-state cases and their remark wording (section 4, items 4–7).
5. **SSM Permission vs UCD to UCD.** knowledge/flow-ssm.md line 145: "SSM Permission applies to STMS and eSTM company transactions only, not UCD to UCD." The paired patch (8688) unticks "Limited Features for UCD to UCD" under the same request. Not a contradiction, but the two settings were changed together for one reason.
6. **Both boxes needed.** knowledge/flow-ssm.md line 144 says both STMS and ESTM company boxes must be ticked for [Purchase SSM] at STMS Step 4. EAINT-8683 enabling "(STMS & eSTM)" together fits this.

## Knowledge candidates

1. **Fix the EAINT-8688 count** in knowledge/flow-ssm.md line 160 and knowledge/flow-stms.md line 308: "24 companies" → 9 TS / 10 company accounts. Source: sheet "EAINT-8688" R7–R16.
2. **Note EAINT-8683 = 24 TS / 25 company accounts** in knowledge/flow-ssm.md lines 105 and 159. Source: sheet "EAINT-8683" R7–R31 (R28–R29 both "8683_TS22").
3. **Add the remark rule** to flow-ssm.md or flow-stms.md (BO Manage Company Accounts): remark wording depends on the before-state of 'Company' and 'Limited Features'; a remark is added even when nothing changes. Quote sheet "EAINT-8688" R3 cases 1–4 verbatim.
4. **Add the remark format** "dd/mm/yyyy hh:mmam (<BO user>) - <reason>" as [unconfirmed], source sheet "EAINT-8688" R3.
5. **Correct the catalogue note** "no business rule" for row 078. Source: sheet "EAINT-8688" R3.
6. **Data trap:** one UCD company name can map to more than one company account (different Old ROCs) with different settings, and staging and production settings for the same company can differ. Source: sheet "EAINT-8688" R11, R13–R14.
7. **Production coverage note** for EAINT-8683: only 8 of 25 rows have a Production result. Source: sheet "EAINT-8683" R7–R31, Production column.
