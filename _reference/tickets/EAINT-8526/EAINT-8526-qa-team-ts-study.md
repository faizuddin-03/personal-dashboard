# EAINT-8526 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study. Nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8526 & 8532 - SSM Hybrid Model.md` (text copy taken 28/10/2026, 10:20:04 am). Cell text only; formatting, colours and images not kept.
2. **SharePoint original:** "EAINT-8526 & 8532 - SSM Hybrid Model.xlsx", library "eAuto - CR Test Scenarios", modified 11/07/2025, 9:54:40 am. The .xlsx itself was not opened.
3. **Ticket folders:** `_reference/tickets/EAINT-8526/` and `_reference/tickets/Studying/EAINT-8526/` — **neither existed** before this study. No SRD, Jira export or Teams note was available.
4. **`lib/ticketStudies.ts`:** no entry for EAINT-8526 or EAINT-8532.
5. **knowledge/:** `flow-ssm.md`, `flow-stms.md` (lines 257, 265), `business-rules-from-test-scenarios.md` §4.1 (lines 222-244, 1036), `cr-test-scenario-catalogue.md` (rows 063, line 173 and 415), `production-regression-scope.md` (lines 1090-1091).
6. **Not read:** Jira ticket, SRD, Teams. This study rests on the TS alone.

## 1. Header

1. **Tickets:** EAINT-8526 and EAINT-8532 (one combined workbook).
2. **Module / portal:** SSM permission in **UCD Portal STMS and eSTM** (Step 2 uploads, Step 4 [Purchase SSM]); **Back Office** Transaction Details for downloads; BO company-level setting.
3. **Platforms:** Web and Mobile, each with its own QA and result column ("QA ⏎ (🌐Web)", "Test Result (P/F) ⏎ (🌐Web)", "QA ⏎ (📱Mobile)", "Test Result (P/F) ⏎ (📱Mobile)" — sheet CR Test Scenarios, R1).
4. **Pairing [unconfirmed]:** EAINT-8532 is the mobile half. `production-regression-scope.md` line 1091 lists it as "SSM permission, mobile app"; line 1090 lists EAINT-8526 as "SSM permission by user". Both deployed "20250714".
5. **Sheets:** one — "CR Test Scenarios".
6. **Scenarios:** **8** (SSM_HM_TS1 to SSM_HM_TS8), written as **24 rows** (3 expected-result rows per TS: Step 2, Step 3+, Step 4).
7. **Results:** **24/24 Pass on Web, 24/24 Pass on Mobile** (48 Pass, 0 Fail).
8. **Testers (as written):** Web — "Nick" on all rows. Mobile — "Nick" on TS1, TS2, TS7; "Charmain" on TS3-TS6, TS8. The catalogue names the owner "Nicholas Lim" (`cr-test-scenario-catalogue.md` line 173).
9. **Dates:** none written in the sheet. Only the SharePoint modified date (11/07/2025).

## 2. What the ticket changed, as the TS shows it

1. **Two-level SSM permission ("Hybrid Model"):** a **company-level** permission set in Backoffice and a **user-level** permission set in "Backend" (column headers R1: "Company Level SSM Permission ⏎ (Backoffice)", "User Level SSM Permission ⏎ (Backend)").
2. **Purchase SSM needs both levels.** [Purchase SSM] shows at Step 4 only when company = Yes **and** user = Yes (TS7, TS8). With user = No it is hidden, whether company is Yes (TS1-TS4) or No (TS5-TS6).
3. **Step 2 uploads depend on the path.**
   1. No purchase path: **three** mandatory documents.
   2. Purchase path: **one** mandatory document.
4. **User level had no screen.** The "No" cells carry "No ⏎ (Require dev to patch)" (R2-R13). The user flag was set by developers, not through a BO page [unconfirmed: that it was set in the database].
5. **Per-transaction-type company permission:** the scenarios name "company level eSTM SSM Permission" and "company level STMS SSM Permission" separately (e.g. R2, R5).

## 3. Scenarios

Each TS has three expected results: **Step 2** uploads, **Step 3 onwards** BO download, **Step 4** [Purchase SSM]. Step 3 row is the same in every TS: "On step 3 onwards, uploaded files available and downloadable in BO Transaction Details page" (TS7/TS8 say "uploaded file", singular).

**A. Company Yes, User No — no purchase, 3 documents**

1. **SSM_HM_TS1** — Sub UCD, eSTM, Sole Proprietorship or Partnership. Step 2: "SSM Business Profile ⏎ - Authorisation Letter ⏎ - Staff Employment Pass & MyKad". Step 4: "[Purchase SSM] will NOT be displayed". (R2-R4)
2. **SSM_HM_TS2** — Sub UCD, STMS, Sdn Bhd. Step 2: "SSM Company Profile ⏎ - Company Board Resolution ⏎ - Staff Employment Pass & MyKad". Step 4: not displayed. (R5-R7)
3. **SSM_HM_TS3** — Main UCD, eSTM, Sdn Bhd. Step 2: Company Profile set. Step 4: not displayed. (R8-R10)
4. **SSM_HM_TS4** — Main UCD, STMS, Sole Proprietorship or Partnership. Step 2: Business Profile set. Step 4: not displayed. (R11-R13)

**B. Company No, User No — no purchase, 3 documents**

5. **SSM_HM_TS5** — Main UCD, eSTM, Sdn Bhd. Step 2: Company Profile set. Step 4: not displayed. (R14-R16)
6. **SSM_HM_TS6** — Sub UCD, STMS, Sole Proprietorship or Partnership. Step 2: Business Profile set. Step 4: not displayed. (R17-R19)

**C. Company Yes, User Yes — must purchase, 1 document**

7. **SSM_HM_TS7** — Main UCD, STMS, Sdn Bhd. Step 2: "Company Board Resolution". Step 4: "[Purchase SSM] will be displayed and not allowed to proceed to next step without purchasing SSM ⏎  ⏎ After purchasing SSM, able to proceed and complete transaction. ⏎ - SSM e-Invoice & SSM Document generated and downloadable". (R20-R22)
8. **SSM_HM_TS8** — Sub UCD, eSTM, Sole Proprietorship or Partnership. Step 2: "Authorisation Letter". Step 4: same as TS7 but "- SSM Invoice & SSM Document generated and downloadable". (R23-R25)

## 4. Business rules and system behaviour

1. **No user permission = no purchase.** "On Step 4, [Purchase SSM] will NOT be displayed and allowed to proceed to next step without purchasing SSM" — sheet CR Test Scenarios, R4 (same text R7, R10, R13, R16, R19).
2. **Both permissions = forced purchase.** "On Step 4, [Purchase SSM] will be displayed and not allowed to proceed to next step without purchasing SSM" — R22, R25.
3. **Sdn Bhd, no purchase:** "SSM Company Profile ⏎ - Company Board Resolution ⏎ - Staff Employment Pass & MyKad" — R5 (also R8, R14).
4. **Sole Proprietorship or Partnership, no purchase:** "SSM Business Profile ⏎ - Authorisation Letter ⏎ - Staff Employment Pass & MyKad" — R2 (also R11, R17).
5. **Purchase path keeps one document.** Sdn Bhd: "Company Board Resolution" — R20. Sole Proprietorship or Partnership: "Authorisation Letter" — R23.
6. **The single document follows company type, not role [unconfirmed].** Every Sdn Bhd row lists Board Resolution and every Sole Proprietorship/Partnership row lists Authorisation Letter, for both Main and Sub UCD (R2-R23). TS7 and TS8 change role **and** company type together, so the TS cannot separate the two.
7. **BO download of uploads:** "On step 3 onwards, uploaded files available and downloadable in BO Transaction Details page" — R3.
8. **Post-purchase documents:** TS7 says "SSM e-Invoice & SSM Document generated and downloadable" (R22); TS8 says "SSM Invoice & SSM Document generated and downloadable" (R25). The two rows name different invoice documents; which appears where is [unconfirmed].
9. **User-level "No" needed a patch:** "No ⏎ (Require dev to patch)" — R2-R13. The TS5-TS8 cells carry no patch note. This suggests the user flag defaulted to Yes when company permission was on [unconfirmed].

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet.
2. **Accounts:** "Main UCD" and "Sub UCD" roles only. No logins named. **No credentials present.**
3. **Company types used:** "Sdn Bhd"; "Sole Proprietorship or Partnership". No Bhd, LLP or ROB/ROC split.
4. **Setup:** company-level permission per transaction type in Backoffice; user-level permission patched by developers ("Require dev to patch").
5. **Test data (vehicle, SSM numbers, eSim rows):** not recorded.

## 6. Gaps or risks a regression should still cover

1. **Company No + User Yes** is never tested. Under the hybrid model the outcome of that pair is unknown.
2. **Role vs company type** is confounded in TS7/TS8 (see §4 #6). No Main UCD + Sole Proprietorship, or Sub UCD + Sdn Bhd, on the purchase path.
3. **Purchase path for eSTM Sdn Bhd and STMS Sole Proprietorship** is not covered.
4. **No LLP or Bhd** company type. LLP was added later (EAINT-9247, per `flow-ssm.md` line 99).
5. **No permission change mid-flow**, no resubmit, no existing transactions created before deployment.
6. **No BO setting check** (user level had no UI). No audit log.
7. **No eSTM L1 / Approval user** coverage, only Main and Sub UCD.
8. **Invoice naming** differs between R22 and R25 and was not reconciled.
9. **Superseded model.** `flow-ssm.md` lines 157-158 tag 8526/8532 as "[legacy, superseded by EAINT-8802]". A regression today must follow the EAINT-8802 matrix; this TS is history, not a current oracle.

## 7. Relation to existing knowledge

1. **Matches:** `business-rules-from-test-scenarios.md` §4.1 #1-#2 quotes the same rows (R2, R4, R5, R20-R25) correctly.
2. **Changes the framing of an open question.** `flow-ssm.md` line 165 and `flow-stms.md` line 265 ask: "Which document pairing is current? EAINT-8526: Main UCD STMS uses Company Board Resolution, Sub UCD eSTM uses Authorisation Letter. EAINT-8802: the reverse." `business-rules-from-test-scenarios.md` line 1036 calls it "SSM single required document per role." In this TS the document tracks **company type** (Sdn Bhd → Board Resolution; Sole Proprietorship/Partnership → Authorisation Letter), which also matches the 3-document rule in `flow-ssm.md` line 143. The "reverse" in EAINT-8802 rows 8-9 may only reflect different company types in those rows [unconfirmed — EAINT-8802 rows 8-9 company type not checked here].
3. **Corrects a detail.** `flow-ssm.md` line 166 says "The user-level SSM permission under EAINT-8526 needed a dev patch". The sheet puts "(Require dev to patch)" only on the user-level **"No"** cells (R2-R13), not on "Yes" (R20-R25).
4. **Explains the 8802 model shift [unconfirmed].** Hybrid: user flag = **permission to purchase** (both flags → purchase). EAINT-8802 (`flow-ssm.md` line 142): user flag = **bypass** (company ticked + bypass unticked → purchase). The user flag's meaning was inverted.
5. **Supports Charmain's note.** `flow-ssm.md` line 216: company STMS permission off means every user skips purchase. TS5/TS6 show the same under the hybrid model: company No → no [Purchase SSM].

## Knowledge candidates

1. **`flow-ssm.md` Open questions (line 165) + `business-rules-from-test-scenarios.md` line 1036:** re-frame "pairing per role" as "per company type". Source: sheet CR Test Scenarios, R20 "Company Board Resolution" (Main UCD, STMS, "Sdn Bhd") and R23 "Authorisation Letter" (Sub UCD, eSTM, "Sole Proprietorship or Partnership"); R2-R19 show the same company-type split for both roles. Tag [unconfirmed] until EAINT-8802 rows 8-9 company types are checked.
2. **`flow-ssm.md` line 166:** change to "The user-level SSM permission set to No needed a dev patch". Source: R2-R13 "No ⏎ (Require dev to patch)"; R20-R25 "Yes" with no note.
3. **`flow-ssm.md` Glossary "Hybrid model" (line 18):** add the rule "[Purchase SSM] shows only when company = Yes and user = Yes". Source: R4 "[Purchase SSM] will NOT be displayed" (company Yes, user No); R16 same (company No, user No); R22 "[Purchase SSM] will be displayed and not allowed to proceed to next step without purchasing SSM" (both Yes).
4. **`flow-ssm.md` Rules:** hybrid → 8802 inverted the user flag from "allow purchase" to "bypass purchase" [unconfirmed]. Source: this TS R1/R4/R22 vs `flow-ssm.md` line 142.
5. **`cr-test-scenario-catalogue.md` row 063:** column shows "CR Test Scenarios:8 | 8"; add results "24/24 Pass Web, 24/24 Pass Mobile; testers Nick (Web), Nick/Charmain (Mobile)". Source: sheet CR Test Scenarios, R2-R25, columns QA / Test Result (P/F).
6. **Open item:** R22 "SSM e-Invoice & SSM Document" vs R25 "SSM Invoice & SSM Document" — which invoice documents appear after purchase in STMS vs eSTM. [unconfirmed]
