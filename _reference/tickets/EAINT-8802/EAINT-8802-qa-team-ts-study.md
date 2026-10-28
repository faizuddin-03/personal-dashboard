# EAINT-8802 — QA Team test script study (2026-10-28)

Study of another QA engineer's test script (TS). Read only. Written by the scheduled SharePoint Scribe.

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-8802 - [eAuto-SSM] To Bypass Purchase SSM (STMS & eSTM).md` (copied 28/10/2026, 9:23:08 am). Cell text only, so **colours, images and formula results are not available**.
2. **Formula cells:** the "Not Started", "In Progress" and "Failed" counts on Overall Progress are formulas with no stored value in the text copy. Pass and N/A counts are plain values.
3. **Knowledge checked:** `knowledge/flow-ssm.md`, `knowledge/flow-stms.md`, `knowledge/flow-company-profile-einvoice.md`, `knowledge/business-rules-from-test-scenarios.md`, `knowledge/cr-test-scenario-catalogue.md`, `knowledge/production-regression-scope.md`.
4. **lib/ticketStudies.ts:** no study for EAINT-8802. It appears only in the `related` list of the EAINT-12121 study (line 464).
5. **Not found:** `_reference/tickets/EAINT-8802/` (no files before this study) and `_reference/tickets/Studying/EAINT-8802/`. **No SRD or Jira text was read.**

## 1. Header

1. **Ticket:** EAINT-8802, "[eAuto-SSM] To Bypass Purchase SSM (STMS & eSTM)" (Overall Progress R2–R3).
2. **Portals:** **UCD Portal** (STMS and eSTM company flows, Step 2 to Step 6) and **BackOffice** (Manage Company Accounts; Settings (Hub Admin) › Bypass Purchase SSM (STMS & eSTM)).
3. **Workbook:** "EAINT-8802 - [eAuto-SSM] To Bypass Purchase SSM (STMS & eSTM).xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 13/01/2026, 9:52:23 pm.
4. **Environment written in the sheet:** "Environment: staging/sit2" (Overall Progress R4).
5. **Sheets (8):** Overall Progress, E2E, SSM Permission, Existing Transaction, Search & Filter, Functional, User Permission, E2E Regression.
6. **Scenario count:** **218** total (Overall Progress R14).
7. **Results (Overall Progress R7–R14, Pass | N/A | Count):**
   1. E2E: 8 | 4 | 12
   2. SSM Permission: 26 | 16 | 42
   3. Existing Transaction: 12 | 8 | 20
   4. BackOffice Search and Filter: 62 | 8 | 70
   5. BackOffice Functional Testing: 36 | 8 | 44
   6. BackOffice User Permission: 26 | 0 | 26
   7. E2E Regression: 4 | 0 | 4
   8. **Total: 174 Pass | 44 N/A | 218.** No row in any sheet shows "Fail" in the Result column.
8. **Testers (QA column):** three QA engineers — Azfar, Charmain, Nadhirah. **No test dates are written in the sheet.**
9. **Deployment:** `knowledge/production-regression-scope.md:1024` lists "EAINT-8802 | 20260114 | SSM bypass". The workbook was last modified the night before.

## 2. What the ticket changed, as the TS shows it

1. **New user-level setting "Bypass Purchase SSM".** It sits beside the existing company-level setting ("STMS - Company Category" / "ESTM - Company Category"). E2E R3 heading: "SSM Permission : STMS - Company Category✅ & Bypass Purchase SSM - User Category✅".
2. **Company switch on the company account.** A new checkbox "Bypass Purchase SSM – User Category" in the "Purchase SSM Document" section of Create / Update Company Account. It is "unticked by default" (Functional R6).
3. **New BO page** "BackOffice > Settings (Hub Admin) > Bypass Purchase SSM (STMS & eSTM)" (Search & Filter R1). It lists only companies with the switch ticked. Edit opens a per-user list with "Permission = [ ] STMS / [ ] eSTM" checkboxes (Search & Filter R40).
4. **UCD effect:** a bypassed user does not buy SSM and uploads 3 documents at Step 2 instead of 1. "User can proceed to Step 6 without purchasing SSM" and "SSM related items should NOT appear in any step" (E2E R6).
5. **Mid-flow handling:** when the permission changes after a transaction starts, the system re-checks it at set "trigger points" (SSM Permission R66–R84).
6. **Export and audit log:** Export Excel on the Edit page, with export and tick/untick actions in the audit log (User Permission R25).

## 3. Scenarios

### 3a. E2E sheet (new transactions, STMS and eSTM)

1. **E2E_STMS_TS1** (R6) — Company ✅, Bypass ✅, Main UCD, Sdn Bhd/Bhd. Expected: 3 upload fields, no SSM purchase, "No SSM transaction created". Pass.
2. **E2E_STMS_TS2** (R7) — Company ✅, Bypass ✅, Sub UCD, Sole Prop/Partnership. Same expected, 3 documents. Pass.
3. **E2E_STMS_TS3** (R8) — Company ✅, Bypass ❌, Main UCD, Sole Prop/Partnership. Expected: "only 1 field ... Authorisation Letter", "User MUST purchase SSM to proceed to Step 6". Pass.
4. **E2E_STMS_TS4** (R9) — Company ✅, Bypass ❌, Sub UCD, Sdn Bhd/Bhd. Expected: 1 field "Company Board Resolution", must buy SSM. Pass.
5. **E2E_STMS_TS5** (R14) — Company ❌, Bypass ✅. **N/A** "*Scoped per dev advice".
6. **E2E_STMS_TS6** (R15) — Company ❌, Bypass ❌. **N/A** "*Scoped per dev advice".
7. **E2E_eSTM_TS1** (R24) — Company ✅, Bypass ✅, Main UCD, Sole Prop/Partnership. 3 documents, no SSM. Pass.
8. **E2E_eSTM_TS2** (R25) — Company ✅, Bypass ✅, L1 & Approval user, Sdn Bhd/Bhd. 3 documents, no SSM. Pass.
9. **E2E_eSTM_TS3** (R26) — Company ✅, Bypass ❌, Sub UCD, Sdn Bhd/Bhd. 1 document "Company Board Resolution", must buy SSM. Pass.
10. **E2E_eSTM_TS4** (R27) — Company ✅, Bypass ❌, L1 & Approval, Sole Prop/Partnership. 1 document "Authorisation Letter"; the **Approval** user meets [Purchase SSM] at Step 4. Pass.
11. **E2E_eSTM_TS5 / TS6** (R32–R33) — Company ❌ cases. **N/A** "*Scoped per dev advice".

### 3b. SSM Permission sheet (permission changed mid-transaction)

Columns: Initial (Company, Bypass) → After Update (Company, Bypass), "SSM Purchased Initially".

1. **SSMPERM_STMS_TS1** (R5) — Step 4 [Make Payment (STMS)], bypass granted after SSM bought. Expected: "SSM related items are displayed", "Only 1 document is uploaded: Authorisation Letter". Pass.
2. **SSMPERM_STMS_TS2** (R6) — same trigger, bypass granted before buying. Expected: "show popup message and Buyer Company Information section", "upload the other 2 documents", no SSM items. Pass (Remarks "*").
3. **SSMPERM_STMS_TS3** (R7) — same trigger, bypass **removed** mid-flow. Expected: still no SSM items, 3 documents. Pass.
4. **SSMPERM_STMS_TS4–TS6** (R8–R10) — Step 4 after failed JPJ enquiry, [Resubmit]. Same three outcomes as TS1–TS3. All Pass.
5. **SSMPERM_STMS_TS7, TS9** (R11, R13) — Step 5 [STMS Payment]. Bought → keeps SSM path; bypass removed → keeps 3-document path. Pass.
6. **SSMPERM_STMS_TS10, TS12** (R14, R16) — Step 5 [Retry (STMS Payment)] after failed payment. Same outcomes. Pass.
7. **SSMPERM_STMS_TS13** (R17) — "Dev to patch SSM Transaction to Expired", then bypass granted. Expected: popup, upload the other 2 documents, no SSM items. Pass.
8. **SSMPERM_STMS_TS16** (R20) — SSM approved "but Business Status Failed", then bypass granted. Expected: popup, 3 documents, no SSM items. Pass.
9. **SSMPERM_STMS_TS19** (R23) — "Dev to patch Step 1 IC No" (buyer info not matched), then bypass granted. Expected: popup, 3 documents, no SSM items. Pass.
10. **SSMPERM_STMS_TS8, TS11, TS14, TS15, TS17, TS18, TS20, TS21** — **N/A** "*Invalid TS".
11. **SSMPERM_eSTM_TS1–TS21** (R33–R53) — the same 21-row pattern for eSTM. The buttons are [Make Payment], [Resubmit], [Next], [Retry]. The popup section is "Seller Company Information". 13 Pass, 8 N/A "*Invalid TS".
12. **SSMPERM_eSTM_TS16** (R48) — Pass with remark: "SSM Related items will still displayed in estm transaction details in BO and UCD".

### 3c. Existing Transaction sheet (created before deployment, finished after)

Before steps ran on "staging/eauto"; after steps on "staging/sit2" (R4).

1. **EX_STMS_TS1** (R5) — had permission, bought SSM, failed payment; after: Company ✅ Bypass ❌. Resubmit from listing → "SSM related items are displayed", 1 document. Pass.
2. **EX_STMS_TS2** (R6) — had permission, not bought; after: same. Resubmit → "UCD forced to Purchase SSM". Pass.
3. **EX_STMS_TS3** (R7) — had permission, bought SSM; after: Bypass ✅. Expected: keeps SSM items, 1 document. Pass.
4. **EX_STMS_TS4** (R8) — had permission, not bought; after: Bypass ✅. Expected: Step 5 popup, the other 2 documents uploaded at Step 5, no SSM items. Pass.
5. **EX_STMS_TS7** (R11) — no permission before (3 documents); after: Company ✅ Bypass ❌. Expected: "no SSM related items", 3 documents. Pass.
6. **EX_STMS_TS8** (R12) — no permission before; after: both ✅. Expected: no SSM items, 3 documents. Pass.
7. **EX_STMS_TS5, TS6, TS9, TS10** — company level ❌ after deployment. **N/A** "*Scoped per dev advice".
8. **EX_eSTM_TS1–TS10** (R22–R31) — same pattern for eSTM. 6 Pass, 4 N/A. **EX_eSTM_TS7** (R28) used a transaction with "Final JPJ Submission = Failed (due to eSTM REV000001E)", reset through the details page.

### 3d. Search & Filter sheet (BO Bypass page)

1. **LOGIN_TS1** (R6) — BO login. Pass.
2. **BPSBOSF_TS1** (R7) — default search. Columns "# / UCD Company Name / UCD Company ROC / Action = Edit". Pass.
3. **BPSBOSF_TS2–TS6** (R8–R12) — UCD Company Name: empty, full, partial start, partial middle/end, not found ("No records found."). Pass.
4. **BPSBOSF_TS7–TS8** (R13–R14) — special and Chinese characters. **N/A**, covered by COMP_FUNC_TS7 / TS6.
5. **BPSBOSF_TS9–TS25** (R15–R31) — State dropdown: All State plus each of 16 states. Pass.
6. **BPSBOSF_TS26–TS29** (R32–R35) — combined filters, Edit link, Reset. Pass.
7. **BPSEBOSF_TS1** (R40) — Edit page default. Pass, remark "Display wrong ROC number : https://mfservices.atlassian.net/browse/EAINT-9621".
8. **BPSEBOSF_TS2–TS22** (R41–R61) — UCD User Full Name, Login ID, MyKad No searches. Pass, 6 N/A ("*Covered USER_FUNC_TS…").
9. **BPSEBOSF_TS23–TS29** (R62–R68) — User Status (All / Active / Inactive) and Filter by Permission (STMS / eSTM / STMS & eSTM / No Permission). Pass.
10. **BPSEBOSF_TS30–TS38** (R69–R77) — combined filters and Reset. Pass.
11. **BPSEBOSF_TS39–TS40** (R78–R79) — Export Excel (default search, 1 record). Pass.

### 3e. Functional sheet

1. **COMP_FUNC_TS1–TS2** (R6–R7) — Create Company Account with the switch ticked / unticked. Ticked → company appears on the Bypass page; unticked → "Unable to search for the UCD Company". Pass.
2. **COMP_FUNC_TS3–TS6** (R12–R15) — Update Company Account: tick, leave unticked, ticked→ticked, ticked→unticked. Pass.
3. **BPS_FUNC_TS1–TS10** (R24–R33) — UCD Company Name field input rules. 8 Pass, 2 N/A "*Scoped down as it is according to existing behavior".
4. **BPS_FUNC_TS11–TS20** (R38–R47) — UCD User Full Name field input rules. Pass (N/A count per row not checked beyond TS15 [unconfirmed]).
5. **BPS_FUNC_TS21–TS29** (R48–R56) — Login ID field rules. 7 Pass, 2 N/A. TS24 remark links EAINT-9623.
6. **BPS_FUNC_TS30–TS38** (R57–R65) — MyKad No field rules. 7 Pass, 2 N/A.

### 3f. User Permission sheet

1. **BO_PERM_TS1–TS9** (R5–R13) — Superadmins on Create / Update Company Account: see and tick the checkbox. Pass.
2. **BO_PERM_TS10–TS12** (R14–R16) — Hub Admin and Admin: tick on Create only; Update "User unable tick or untick the checkboxes". Pass.
3. **BO_PERM_TS13** (R17) — Probation: "Probation user unable to create new company account"; Update "User UNABLE to see Bypass Purchase SSM - User Category checkbox". Pass.
4. **BO_PERM_TS14–TS17** (R25–R28) — four named Superadmins open the Bypass page, export, tick/untick, audit log. Pass.
5. **BO_PERM_TS18–TS26** (R29–R37) — all other Superadmins, Hub Admin, Admin and Probation: "User CANNOT see or access module below: Settings (Hub Admin) - Bypass Purchase SSM (STMS & eSTM)". Pass.

### 3g. E2E Regression sheet (Bypass unticked)

1. **E2E_REG_TS1** (R6) — STMS Company ✅. Must buy SSM, 1 document "Authorisation Letter". Pass.
2. **E2E_REG_TS2** (R7) — STMS Company ❌. 3 documents, no SSM; "User cannot see or access the SSM Document module". Pass.
3. **E2E_REG_TS3** (R16) — eSTM Company ✅. Must buy SSM, 1 document "Company Board Resolution". Pass.
4. **E2E_REG_TS4** (R17) — eSTM Company ❌. 3 documents, no SSM, no SSM Document module. Pass.

## 4. Business rules and system behaviour

1. **Bypass beats company permission.** With Company ✅ and Bypass ✅: "User can proceed to Step 6 without purchasing SSM" and "SSM related items should NOT appear in any step" (E2E R6).
2. **The single document follows the company type, not the user role.** Every row agrees:
   1. Sole Prop/Partnership → "Authorisation Letter" (E2E R8 Main UCD; E2E R27 L1 & Approval; E2E Regression R6).
   2. Sdn Bhd/Bhd → "Company Board Resolution" (E2E R9 Sub UCD; E2E R26 Sub UCD; E2E Regression R16).
3. **Three-document sets** (E2E R6, R7):
   1. Sdn Bhd/Bhd: "1. SSM Company Profile 2. Company Board Resolution 3. Staff Employment Pass & MyKad".
   2. Sole Prop/Partnership: "1. SSM Business Profile 2. Authorisation Letter 3. Staff Employment Pass & MyKad".
4. **SSM Document module on the UCD homepage:**
   1. Bypassed user (company ✅): "User can see and access the SSM Document module" and "No SSM transaction created" (E2E R6).
   2. Company ❌, bypass ❌: "User cannot see or access the SSM Document module" (E2E Regression R7, R17).
5. **SSM already bought wins.** If SSM was bought before bypass was granted, the transaction keeps the SSM path: "Ensure SSM related items are displayed - Only 1 document is uploaded" (SSM Permission R5, R8, R11, R14; Existing Transaction R7).
6. **Bypass granted before buying → popup asks for the missing documents.** "show popup message and Buyer Company Information section - Ensure user required to upload the other 2 documents" (SSM Permission R6, STMS). eSTM wording is "Seller Company Information section" (SSM Permission R34).
7. **Removing bypass mid-flow does not force a purchase.** Bypass ✅→❌ keeps "no SSM related items" and 3 documents (SSM Permission R7, R10, R13, R16).
8. **Permission granted to an old no-permission transaction does not force a purchase.** "Before deployment, WITHOUT SSM Permission / After deployment, WITH SSM Permission / No SSM Flow with 3 Doc" (Existing Transaction R11).
9. **Failed SSM states switch to the bypass path.** SSM Expired (R17), Business Status Failed (R20) and Buyer info not matched (R23), after bypass is granted: popup, the other 2 documents, no SSM items.
10. **Leftover SSM items in details.** "SSM Related items will still displayed in estm transaction details in BO and UCD" (SSM Permission R48, Remarks).
11. **Trigger points where the permission is re-checked** (SSM Permission R67–R84, verbatim):
    1. STMS: "Step 4 (After JPJ Enquiry) - [Make Payment (STMS)] button", "Step 4 (Fail JPJ Enquiry) - [Resubmit] button", "Step 5 (Make Payment) - [STMS Payment] button", "Step 5 (Retry Payment) - [Retry (STMS Payment)] button", "Transaction Listing - Step 4 (After JPJ Enquiry) > Save & Continue > “Resubmit” hyperlink", "SSM Expired", "Business Status != Active / Existing", "Buyer info not matched".
    2. eSTM: same list with "[Make Payment]", "[Resubmit]", "[Next]", "[Retry]".
12. **Company switch default.** "Bypass Purchase SSM – User Category checkbox is unticked by default" (Functional R6).
13. **Bypass page lists only switched-on companies.** Unticked → "Unable to search for the UCD Company" and "Unable to edit and manage Bypass Purchase SSM (STMS & eSTM)" (Functional R7, R13, R15).
14. **Who can tick the company switch** (User Permission R5–R17):
    1. Superadmin: Create and Update.
    2. Hub Admin and Admin: "(Only Create New Page)"; Update "User unable tick or untick the checkboxes".
    3. Probation: "Probation user unable to create new company account"; on Update "User UNABLE to see" the checkbox.
15. **Who can open the Bypass page:** only the four Superadmins in User Permission R25–R28 (BO_PERM_TS14–TS17). All others "CANNOT see or access" it, including other Superadmins (R29–R33).
16. **Bypass page columns.** Company list: "# / UCD Company Name / UCD Company ROC / Action = Edit" (Search & Filter R7). User list: "# / UCD User Full Name / Login ID / MyKad No / Branch / Mobile No. / Email Address / User Status / Permission = [ ] STMS / [ ] eSTM" (R40). Page name "{company_name} ({new_roc})" (R40).
17. **Login ID and MyKad No are exact-match searches.** Partial values give "Display “No records found.” and no result table showing." (Search & Filter R50–R51, R57–R58). Company Name and User Full Name accept partial values (R10–R11, R43–R44).
18. **Export filename:** "UCD_User_Bypass_Purchase_SSM_{companyName}_{yyyymmdd}_{hh}_{mm}_AM/PM.xlsx" (Search & Filter R78).
19. **Audit log content** (User Permission R25): export — "1. The user who performed the export, UserID 2. The type of file exported, Manage Bypass SSM Permissions 3. The date and time of the export activity"; permission change — "2. The action performed, tick/untick STMS or eSTM".
20. **Field input rules** (Functional R24, R38, R48, R57):
    1. UCD Company Name: "Acceptable Char: ALL", "Acceptable Special Char: ALL".
    2. UCD User Full Name: alphanumeric plus "apostrophe (') ... forward slash (/) ... dot (.) ... comma (,) ... colon (:) ... hyphen (-) ... ampersat (@)".
    3. Login ID: alphanumeric plus "forward slash (/) ... dot (.) ... hyphen (-) ... ampersat (@) ... ampersand (&) ... underscore (_) ... space".
    4. MyKad No: "Acceptable Char: Numeric".
    5. All: "(Auto remove invalid char)"; search "is NOT case-sensitive".
21. **Known production issue:** Chinese characters "redirect to System Bug page (Existing Prod Issue, EAINT-3284)" (Search & Filter R14).
22. **Defects raised during testing:** EAINT-9621 "Display wrong ROC number" (Search & Filter R40); EAINT-9623 on Login ID spaces (Functional R51).

## 5. Test data, environments, accounts, setup

1. **Environments:** "staging/sit2" (Overall Progress R4). Existing-transaction rows started on "staging/eauto" and finished on "staging/sit2" (Existing Transaction R4).
2. **UCD users:** Main UCD, Sub UCD, eSTM "L1 & Approval" users. No UCD login IDs in the sheet.
3. **BO accounts named (no passwords in the sheet):**
   1. Bypass page access: jasons, mfared, nikmuhamad, mfizni (User Permission R25–R28).
   2. Superadmins without Bypass page access: eautohaffiz, eautokelvin, eautosoyeng, rosalindkhoo "(retired)", onghongkee "(retired)" (R29–R33).
   3. Hub Admin: kmcheah (R14).
4. **Dev help was needed:** "Dev to patch SSM Transaction to Expired" (SSM Permission R17) and "Dev to patch Step 1 IC No" (R23). Audit log proof: "Check with dev to provide screenshot of the audit log" (User Permission R25).
5. **Company states used:** New, Activated, Inactivated (Functional R12–R14).
6. **JPJ states used:** 1st JPJ Enquiry OK / Failed; Payment Failed; eSTM "Final JPJ Submission = Failed (due to eSTM REV000001E)" (Existing Transaction R28).

## 6. Gaps and risks for regression

1. **Company ❌ + Bypass ✅ was never tested.** E2E_STMS_TS5 and E2E_eSTM_TS5 are N/A "*Scoped per dev advice". The rule for this case is unproven.
2. **Company ❌ + Bypass ❌ appears only in the regression sheet.** E2E_STMS_TS6 / E2E_eSTM_TS6 are N/A; E2E_REG_TS2 / TS4 cover it.
3. **No mobile (web vs app) coverage.** Every row is the web flow [unconfirmed whether the app has this flow].
4. **No UCD-to-UCD or individual flows.** All rows are "Company E2E Flow".
5. **Leftover SSM items** in eSTM transaction details after the switch (SSM Permission R48) were passed with a remark, not raised.
6. **Wording conflict:** STMS popup says "Buyer Company Information section" (SSM Permission R6, R9, R17, R20, R23); eSTM says "Seller Company Information section". In STMS the company is the seller, so the STMS wording may be a TS typo [unconfirmed].
7. **TS typos to be aware of when copying rows:**
   1. E2E_REG_TS1 (R6): User "Sub UCD" but step "Login using Main UCD account".
   2. E2E_REG_TS2 (R7): User "Main UCD", type "Sdn Bhd or Bhd", but steps say "Sub UCD" and "Sole Proprietorship or Partnership".
   3. SSMPERM_eSTM_TS7–TS12 (R39–R44): trigger "Step 5", but steps say "In Step 4, click [Next]" / "[Retry]".
   4. SSMPERM_eSTM_TS19 (R51): "Resubmit STMS Transaction" in an eSTM row.
   5. BPSEBOSF_TS28 (R67): "eSTM & eSTM".
8. **Audit log proof came from dev screenshots**, not the UI. EAINT-9842 later added a dedicated audit log page (`knowledge/flow-ssm.md:124`).
9. **Max-length checks were skipped** ("*Scoped down as it is according to existing behavior", Functional R32–R33, R55–R56, R64–R65).

## Contradictions with knowledge/

1. **Document pairing open question** (`knowledge/flow-ssm.md:165`, `knowledge/flow-stms.md:265`, `knowledge/business-rules-from-test-scenarios.md:239-242`). This TS shows the single document follows **company type**, not role (§4 item 2). The "reverse pairing" is likely because EAINT-8526 rows used different company types [unconfirmed — EAINT-8526 TS not re-read].
2. **`knowledge/business-rules-from-test-scenarios.md:238`** says "Company ❌: proceeds without SSM purchase `[rows 14-15]`". Those rows are **N/A, not tested**. The tested source is E2E Regression R7 / R17 (bypass ❌ only).
3. **`knowledge/flow-ssm.md:142`** says "User Bypass ticked, with any company state". Company ❌ + Bypass ✅ was **not tested** (§6 item 1).
4. **`knowledge/flow-ssm.md:126` and `business-rules…:243-244`** name only "[Make Payment] or [Resubmit] at Step 4". The TS lists **eight trigger points** per flow (§4 item 11), and shows that a bought SSM keeps the SSM path.
5. **`knowledge/flow-ssm.md:126`** popup title "Upload Seller Company Information" with "[Update Document]" is not in this TS. The TS only says "popup message and ... Company Information section".
6. **`knowledge/flow-ssm.md:129`** "UCD homepage still shows the SSM Document module" is true only when the company switch is on. With company ❌ the module is hidden (E2E Regression R7).
7. **`knowledge/flow-ssm.md:134`** roles list matches this TS (jasons, mfared, nikmuhamad, mfizni).

## Knowledge candidates

1. **flow-ssm.md › Rules:** "The single Step 2 document follows company type: Sole Proprietorship/Partnership → Authorisation Letter; Sdn Bhd/Bhd → Company Board Resolution, for Main UCD, Sub UCD and eSTM L1." Source: SharePoint TS EAINT-8802, sheet E2E R8, R9, R26, R27; E2E Regression R6, R16. Would close the open question at flow-ssm.md:165.
2. **flow-ssm.md › Rules:** "If SSM was already bought, granting bypass later keeps the SSM path (1 document, SSM items shown)." Source: SSM Permission R5, R8, R11, R14; Existing Transaction R7.
3. **flow-ssm.md › Rules:** "Granting bypass before SSM is bought shows a popup asking for the other 2 documents; removing bypass mid-flow never forces a purchase." Source: SSM Permission R6, R7, R9, R10.
4. **flow-ssm.md › Entry points:** the full trigger-point list (8 STMS, 8 eSTM). Source: SSM Permission R67–R84.
5. **flow-ssm.md › Rules:** "SSM Expired, Business Status not Active/Existing, or Buyer info not matched + bypass granted → bypass path (3 documents, no SSM items)." Source: SSM Permission R17, R20, R23.
6. **flow-ssm.md › Cross-module effects:** "UCD homepage SSM Document module: shown when the company SSM permission is on (bypassed or not); hidden when company ❌ and bypass ❌." Source: E2E R6; E2E Regression R7, R17.
7. **flow-ssm.md › Roles:** "Company switch 'Bypass Purchase SSM – User Category': Superadmin on Create and Update; Hub Admin and Admin on Create only; Probation cannot see it on Update." Source: User Permission R5–R17.
8. **flow-ssm.md / BO:** "Bypass page user search: Login ID and MyKad No are exact match; Company Name and User Full Name accept partial." Source: Search & Filter R43–R44, R50–R51, R57–R58.
9. **flow-ssm.md / BO:** export filename "UCD_User_Bypass_Purchase_SSM_{companyName}_{yyyymmdd}_{hh}_{mm}_AM/PM.xlsx". Source: Search & Filter R78.
10. **flow-ssm.md › Open questions:** "Company ❌ + Bypass ✅ never tested in EAINT-8802 ('*Scoped per dev advice')." Source: E2E R14, R32.
11. **business-rules-from-test-scenarios.md:238:** fix the source — rows 14-15 are N/A; cite E2E Regression R7 / R17 instead.
12. **Defects linked:** EAINT-9621 (wrong ROC on Bypass Edit page), EAINT-9623 (Login ID spaces). Source: Search & Filter R40; Functional R51.
