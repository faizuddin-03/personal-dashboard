# EAINT-9233 — QA Team test script study (2026-10-28)

## 1. Header

1. **Ticket:** EAINT-9233 — "[eAuto - BackOffice] - To Set Default Tick Checkbox For Insurance, BMK, TH & eLKM" (workbook title).
2. **Portal / module:** **BackOffice** — "Account Management >  Manage Company Accounts" → **Permission Module** section (sheet EAINT-9233, R6, column Module).
3. **Workbook:** "EAINT-9233 [eAuto - BackOffice] - To Set Default Tick Checkbox For Insurance, BMK, TH & eLKM.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 07/01/2026, 2:53:31 pm.
4. **Sheets:** 1 — "EAINT-9233".
5. **Scenarios:** **2** (TSDTCB_TS1, TSDTCB_TS2).
6. **Results:** **2 PASS, 0 FAIL** (column "Test Result", R6 and R7).
7. **Tester:** column "QA" = "Nadhirah" on both rows. No test dates written in the sheet.
8. **Environment:** "Environment: staging/sit2" (R2).
9. **Deployment:** release 20260114, listed as verified in production regression [from knowledge/production-regression-scope.md §11.3: "| EAINT-9233 | 20260114 | BO default permissions | Yes |"]. Azfar ledger: "Live | Done, S25.6-20260114" [_reference/codebases/eauto-qa-azfar/cr/EAINT-9233/LEDGER.md, table row "Live"].

## 2. What the ticket changed (as the TS shows it)

1. On BO **Create New** company account, six permissions in the **Permission Module** are **pre-ticked** before the user saves (R6, Test Step 5).
2. The defaults **stay ticked after save** (R6, Expected Result item 3).
3. The defaults are **not locked** — a BO user can untick them on an existing company and the untick **persists** after [Update] (R7, Expected Result items 3 and 5).
4. Scope is wider than the title. Title names **Insurance, BMK, TH, eLKM**; the TS also checks **eSTM (1 layer)** and **eVOC** as default-ticked (R6, Test Step 5). [unconfirmed] whether eSTM and eVOC were already default-ticked before this ticket or are new under it — the TS does not say.

## 3. Scenarios

### A. Create company — defaults

1. **TSDTCB_TS1** — create a new company in BO and check the Permission Module defaults before and after save.
   1. Expected: "The company account is created successfully." (R6, Expected item 1)
   2. Expected: "the following permissions are ticked by default before saving" — eSTM (1 layer) 10, Insurance 6, BMK, Transfer History, eLKM 10, eVOC (R6, Expected item 2).
   3. Expected: "After the account is saved successfully, the Permission Module section remains ticked by default" for the same six (R6, Expected item 3).
   4. Result: **PASS**.

### B. Update company — untick and save

1. **TSDTCB_TS2** — open the company created in TS1, confirm defaults, untick all except eSTM, click [Update].
   1. Expected: "The searched company is displayed in the search results." (R7, Expected item 1)
   2. Expected: "System allows the user to untick all permissions checkbox." (R7, Expected item 3)
   3. Expected: "Clicking the [Update] button updates the company permissions successfully without any error." (R7, Expected item 4)
   4. Expected: "After a successful update, the Permission Module section displays checkbox will unticked for:" Insurance 6, BMK, Transfer History, eLKM 10, eVOC (R7, Expected item 5).
   5. Result: **PASS**.

## 4. Business rules and system behaviour

1. **Default-ticked set on create:** "eSTM Permission ( 1 layer Permission) - 10 ⏎ - Insurance Permission - 6 ⏎ - BMK Permission ⏎ - Transfer History Permission ⏎ - eLKM Permission - 10 ⏎ - eVOC Permission" (sheet EAINT-9233, R6, Test Step 5).
2. **Defaults persist on save:** "After the account is saved successfully, the Permission Module section remains ticked by default for the following permissions" (R6, Expected item 3).
3. **Defaults can be removed:** "System allows the user to untick all permissions checkbox." (R7, Expected item 3).
4. **Untick is saved:** "After a successful update, the Permission Module section displays checkbox will unticked for:" (R7, Expected item 5). eSTM is not in that list because TS2 keeps it ticked: "Untick all checkbox permissions except eSTM Permission." (R7, Test Step 6, second "6").
5. **Company-level permissions exist** for TH, eLKM and eVOC, not only for Insurance and BMK (R6, Test Step 5).
6. **Numbers after names** ("- 10", "- 6") [unconfirmed] meaning. Likely the count of sub-permission checkboxes under that group (eSTM 10, Insurance 6, eLKM 10). The sheet does not explain them.
7. **Entry path:** "Click on [Manage Company Accounts] on Account Management section" → "Click [Create New] button" (R6, steps 2-3); for edit: "Search for the company that was created earlier" → "Click on [Company Name] to view the company details" (R7, steps 3-5).

## 5. Test data, environments, accounts, setup

1. **Environment:** "staging/sit2" (R2).
2. **Account:** "Login as Bacckoffice user" (R6/R7, step 1) — no role named. [unconfirmed] which BO role is needed to create or edit companies.
3. **Data:** TS2 depends on TS1 — "Search for the company that was created earlier" (R7, step 3).
4. **Company fields:** "Fill in ALL the mandatory fields" (R6, step 4) — no values recorded.
5. **Credentials:** none in the sheet.

## 6. Gaps or risks a regression should still cover

1. **Downstream effect not tested.** No TS logs in to UCD to check the new company can actually open Insurance, BMK, TH, eLKM, eVOC tiles. Nor that an unticked permission blocks them (see knowledge/flow-bmk.md: "Permission off: BMK tile shows the no-permission dialog.").
2. **Sub-permissions not listed.** "Insurance Permission - 6" and "eLKM Permission - 10" imply child boxes; the TS does not name or check each one.
3. **Existing companies not covered.** No TS checks what companies created **before** the release show (default ticked, or unchanged). [unconfirmed]
4. **Re-tick not covered.** No TS re-ticks after untick and saves.
5. **Business types not covered.** Only one create path tested; no check per business type (UCD vs Bank/Credit Company etc.). EAINT-11175 shows Bank/Credit Company has its own checkbox defaults (knowledge/business-rules-from-test-scenarios.md item 9).
6. **Audit log not covered.** No check that the permission change is logged.
7. **Sheet quality:** TS2 has two steps numbered "6" (R7); TS2 step 8 lists all six permissions including eSTM while the expected result lists five unticked — wording is loose, outcome is clear.

## 7. Contradictions with current knowledge

1. **eVOC missing in knowledge.** knowledge/business-rules-from-test-scenarios.md item 8 and knowledge/cr-test-scenario-catalogue.md row 096 list five defaults; the sheet lists **six** — "eVOC Permission" is also default-ticked (R6, Test Step 5).
2. **"Edited companies" wording is wrong.** knowledge/flow-bmk.md §Roles says: "BMK is ticked by default for new and edited companies (EAINT-9233)." The TS shows defaults apply on **create** only; on edit the user can untick and the untick is kept (R7, Expected items 3 and 5). The Azfar ledger has the same misreading: "A new or edited company has the eSTM (1 layer), Insurance, BMK, Transfer History and eLKM permissions ticked by default." (LEDGER.md, "What I FOUND").
3. **flow-stms-addons.md §Roles** ("A company-level permission for IC is not named (unlike TH and eLKM).") — consistent with this TS.

## Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-9233 [eAuto - BackOffice] - To Set Default Tick Checkbox For Insurance, BMK, TH & eLKM.md` (text copy, 28/10/2026 9:25:40 am; cell text only, no formatting).
2. `_reference/codebases/eauto-qa-azfar/cr/EAINT-9233/LEDGER.md` and `01-intake/raw/INDEX.md`.
3. knowledge/: business-rules-from-test-scenarios.md (item 8), cr-test-scenario-catalogue.md (rows 096), production-regression-scope.md (§11.3), flow-bmk.md, flow-stms-addons.md.
4. Not present: `_reference/tickets/EAINT-9233/` (no prior files), `_reference/tickets/Studying/EAINT-9233/` (does not exist), no entry in lib/ticketStudies.ts.
5. Not read: the SRD and Jira ticket (not available offline in this run); the .xlsx itself (text copy used instead, so colours/formatting are unknown).

## Knowledge candidates

1. **knowledge/business-rules-from-test-scenarios.md item 8** and **knowledge/cr-test-scenario-catalogue.md row 096:** add **eVOC Permission** to the default-ticked list. Source: "- eVOC Permission" [SharePoint TS EAINT-9233, sheet EAINT-9233, R6, Test Step 5].
2. **knowledge/flow-bmk.md §Roles:** change "ticked by default for new and edited companies" to "ticked by default on new companies; a BO user can untick it on edit and the untick is saved". Source: "System allows the user to untick all permissions checkbox." and "After a successful update, the Permission Module section displays checkbox will unticked for:" [sheet EAINT-9233, R7, Expected items 3 and 5].
3. **BO Manage Company Accounts flow** (knowledge/flow-ucd-company-listing.md or flow-bo-shell.md, whichever owns BO company create): add create/edit path and the six default-ticked Permission Module groups. Source: sheet EAINT-9233, R6 steps 2-5, R7 steps 3-5.
