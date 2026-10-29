# EAINT-9894 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9894-[eAuto] V1 Standardise Browser to Google Chrome for DERMALOG Biometric Compatibility.md` (made 28/10/2026, 1:26:45 am). Cell text only. Colours, images and dropdowns were not kept.
2. **Not in this repo:** no `_reference/tickets/EAINT-9894/` files before this study, no `_reference/tickets/Studying/EAINT-9894/` folder, no SRD, no entry in `lib/ticketStudies.ts`. The SRD and the Jira ticket were **not read** in this run.
3. **Knowledge read:** `knowledge/README.md` index, `knowledge/flow-browser-reminder.md`, `knowledge/flow-platform.md` (MyKad reader flow + ticket history), `knowledge/business-rules-from-test-scenarios.md` §7 item 9, `knowledge/cr-test-scenario-catalogue.md` row 116.
4. **Colleague repo (read-only):** `_reference/codebases/eauto-qa-azfar/cr/EAINT-9894/LEDGER.md` and `knowledge/portals/ucd/portal.md` lines 685-687.

## 1. Header

1. **Ticket:** EAINT-9894, "[eAuto] V1 Standardise Browser to Google Chrome for DERMALOG Biometric Compatibility". Sibling V2 = EAINT-9895.
2. **Portals:** **UCD** and **AATF** (column "UCD/AATF").
3. **Workbook:** "EAINT-9894-[eAuto] V1 Standardise Browser to Google Chrome for DERMALOG Biometric Compatibility.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 26/02/2026, 2:51:02 pm.
4. **Sheets (2):**
   1. "EAINT-9894" — **32 scenarios** (R4-R35).
   2. "Production Regression Scope " (trailing space in the name) — **26 scenarios** (R4-R29).
5. **Columns:** "TS No | Browser | UCD/AATF | Screen | Test Scenarios | Expected Result | Test Result | Remarks" (both sheets, R3).
6. **Results:**
   1. Sheet "EAINT-9894": **32 Pass, 0 Fail**. Summary R3 shows Pass "32", TOTAL "32", Completion % "1". The Pass cell is a typed number, not a COUNTIF formula like its neighbours.
   2. Sheet "Production Regression Scope ": **26 Pending**. Summary R3 Pending "26", TOTAL "26". Production regression was never run.
7. **Tester / dates:** not written in either sheet. The catalogue names the workbook author as a QA engineer, dated 2026-02-26 (`knowledge/cr-test-scenario-catalogue.md` row 116). Test environment is not written.
8. **Live status:** **never went live.** The colleague ledger quotes Jira: "As of 14.09.2026, this ticket is no longer relevant. May refer EAUTO-1028 / CCB-933 / EAINT-12253 for the new solution." (`eauto-qa-azfar/cr/EAINT-9894/LEDGER.md` line 5, citing a Jira comment of 14.09.2026). Not checked against Jira in this run [unconfirmed].

## 2. What the ticket changed, as the TS shows it

1. **Firefox users** get a **"websocket popup"** on the Homepage after login, shown as the **first popup** (EAINT-9894 R4, R14).
2. **Firefox users** get a **"websocket text"** on each module dashboard that leads to a thumbprint screen (EAINT-9894 R5-R19).
3. **Chrome users** get **neither** (EAINT-9894 R20-R35).
4. The TS never quotes the popup or text wording. The content is unknown from this workbook.
5. [unconfirmed] The screen list matches the thumbprint page list of EAINT-7229 (`knowledge/flow-platform.md` lines 86, 93). The purpose looks like steering Firefox (Java applet) users towards Chrome (WebSocket reader).

## 3. Scenarios

### 3a. Firefox — UCD (expect shown)

1. **EAINT9894_TS1** (R4) — Homepage after login. Expected: "Websocket popup is displayed correctly as first popup in Homepage screen".
2. **TS2** (R5) — STMS Module Dashboard (Create New Transaction). Expected: "Websocket text is displayed correctly in STMS Module Dashboard (Create New Transaction)".
3. **TS3** (R6) — UCD to UCD Module Dashboard. Expected: text displayed.
4. **TS4** (R7) — eSTM Module Dashboard (Create eSerahan Transaction & eSTM Permission). Expected: text displayed.
5. **TS5** (R8) — BMK Module Dashboard (Purchase BMK). Expected: text displayed.
6. **TS6** (R9) — Insurance Module Dashboard (Update Insurance & Takaful Permission). Expected: text displayed.
7. **TS7** (R10) — Settings (Manage User). Expected: text displayed.
8. **TS8** (R11) — Settings (Manage User > User Account Listing). Expected: text displayed.
9. **TS9** (R12) — Company/Business Profile. Expected: text displayed.
10. **TS10** (R13) — Account Activation. Expected: text displayed. Remark: "Have to create Main User".

### 3b. Firefox — AATF (expect shown)

1. **EAINT9559_TS11** (R14, id typo — see §6) — Homepage after login. Expected: popup "displayed correctly as first popup in Homepage screen".
2. **TS12** (R15) — eDeregistration (Create eDeregistration). Expected: text displayed.
3. **TS13** (R16) — Settings (Manage User). Expected: text displayed.
4. **TS14** (R17) — Settings (Manage User > User Account Listing). Expected: text displayed.
5. **TS15** (R18) — Account Activation. Remark: "Have to create Main User".
6. **TS16** (R19) — Account Activation. Remark: "Have to create Sub User".

### 3c. Chrome — UCD (expect not shown)

1. **TS17** (R20) — Homepage. Expected: "Websocket popup is not displayed correctly as first popup in Homepage screen".
2. **TS18-TS26** (R21-R29) — same nine UCD screens as TS2-TS10. Expected: "Websocket text is not displayed correctly in …". TS26 remark: "Have to create Main User".

### 3d. Chrome — AATF (expect not shown)

1. **TS27** (R30) — Homepage. Popup not displayed.
2. **TS28-TS32** (R31-R35) — same five AATF screens as TS12-TS16. Text not displayed. TS31 remark "Have to create Main User"; TS32 remark "Have to create Sub User".

### 3e. Production Regression Scope sheet

1. Same rows as the main sheet **minus all six Account Activation rows** (main TS10, TS15, TS16, TS26, TS31, TS32). 32 − 6 = 26.
2. Renumbered TS1-TS26. Firefox UCD = TS1-TS9; Firefox AATF = "EAINT9559_TS10" (R13) + TS11-TS13; Chrome UCD = TS14-TS22; Chrome AATF = TS23-TS26.
3. [unconfirmed] Account Activation was dropped because it needs new Main/Sub users, which cannot be made freely on production.

## 4. Business rules and system behaviour the TS reveals

All of this is **never-live behaviour**. Do not expect it on screen today.

1. **Popup order:** "Websocket popup is displayed correctly as first popup in Homepage screen" (sheet EAINT-9894, R4 and R14, Firefox).
2. **Browser split:** Firefox rows expect "displayed"; Chrome rows expect "not displayed" (sheet EAINT-9894, R4-R19 vs R20-R35).
3. **Screens in scope, UCD:** "STMS Module Dashboard (Create New Transaction)", "UCD to UCD Module Dashboard", "eSTM Module Dashboard (Create eSerahan Transaction & eSTM Permission)", "BMK Module Dashboard (Purchase BMK)", "Insurance Module Dashboard (Update Insurance & Takaful Permission)", "Settings (Manage User)", "Settings (Manage User > User Account Listing)", "Company/Business Profile", "Account Activation" (sheet EAINT-9894, column Screen, R5-R13).
4. **Screens in scope, AATF:** "Homepage", "eDeregistration (Create eDeregistration)", "Settings (Manage User)", "Settings (Manage User > User Account Listing)", "Account Activation" (sheet EAINT-9894, R14-R19).
5. **Activation needs fresh users:** "Have to create Main User" (R13, R18, R29, R34) and "Have to create Sub User" (R19, R35). UCD activation was tested for Main User only; AATF for Main and Sub.

## 5. Test data, environments, accounts, setup

1. **Browsers:** "Firefox" and "Chrome" (column Browser). No browser version written.
2. **Environment:** not written.
3. **Accounts:** a UCD login and an AATF login [unconfirmed — implied by the Homepage rows]. Fresh Main User (UCD + AATF) and Sub User (AATF) created for Account Activation (Remarks).
4. **Credentials:** none in the text copy.

## 6. Gaps and risks a regression should still cover

1. **Ticket is dead.** A regression should check that **no** 9894 popup or text shows on these screens in any browser [unconfirmed — only needed if the code was ever merged to staging].
2. **Contradiction in knowledge:** `knowledge/business-rules-from-test-scenarios.md` line 564 says "Chrome websocket popup is the first popup after login", and `knowledge/cr-test-scenario-catalogue.md` row 116 says "Chrome: websocket popup first on Homepage (EAINT-9894!R4)". The TS says the opposite: R4 is **Firefox** ("displayed"), Chrome R20 is "not displayed". Neither knowledge line marks it as never live. `lib/eautoFlows/modules/ucd-portal.ts` line 280 repeats the Chrome wording. The EAINT-9892 study (`_reference/tickets/EAINT-9892/EAINT-9892-qa-team-ts-study.md` §7) already flagged this.
3. **Ambiguous wording:** Chrome rows say "is not displayed correctly". [unconfirmed] The intent is "is not displayed".
4. **ID typos:** "EAINT9559_TS11" (sheet EAINT-9894, R14) and "EAINT9559_TS10" (sheet Production Regression Scope, R13) carry ticket number 9559, not 9894.
5. **Content never checked:** no row quotes the popup or text wording, so a pass only proves "something showed".
6. **Not covered:** Edge; Firefox version (the later EAINT-12253 gate is Firefox < 37, `knowledge/flow-browser-reminder.md` §5); popup close / refresh / re-login behaviour; AATF Upload COD and Create New AATF Company (both thumbprint pages per `knowledge/flow-platform.md` line 93); UCD Sub User activation; eSerahan Permission as its own screen.
7. **Pass count is typed:** "32" in R3 is not a formula, so the summary would not update if a row changed.
8. **Production regression never run:** all 26 rows "Pending".

## 7. Where this fits current knowledge

1. **Agrees with** `knowledge/flow-platform.md` line 136: "EAINT-9894 (2026-02): V1 Standardise browser to Chrome. Closed 2026-09-14, never live. [legacy, superseded by EAINT-12253]".
2. **Agrees with** `knowledge/flow-browser-reminder.md` §11 item 4: "EAINT-9894 / 9895 — older "standardise browser to Chrome", never live, superseded."
3. **Contradicts** business-rules line 564-566 and catalogue row 116 on which browser shows the popup (see §6 item 2).
4. **Prior art for EAINT-12253:** same browser × portal × screen grid, Firefox "shown" vs Chrome "not shown". 12253 moved the message from dashboards to the **last step** and limits it to Firefox < 37.

## Knowledge candidates

1. **Fix `knowledge/business-rules-from-test-scenarios.md` §7 item 9 (line 564-566):** popup and text were for **Firefox**, not Chrome; Chrome rows expect "not displayed"; mark as **never live** (Closed 14.09.2026). Source: sheet EAINT-9894, R4 "Websocket popup is displayed correctly as first popup in Homepage screen" (Browser "Firefox") and R20 "Websocket popup is not displayed correctly as first popup in Homepage screen" (Browser "Chrome").
2. **Fix `knowledge/cr-test-scenario-catalogue.md` row 116** summary "Chrome: websocket popup first on Homepage (EAINT-9894!R4)" → Firefox. Same source as item 1. Also add result counts: "EAINT-9894" sheet 32/32 Pass; "Production Regression Scope " 26 Pending.
3. **Fix `lib/eautoFlows/modules/ucd-portal.ts` line 280** wording (same source). Outside this agent's write scope.
4. **Add to `knowledge/flow-platform.md` ticket history (line 136):** the 9894 screen list — UCD STMS, UCD to UCD, eSTM (Create eSerahan Transaction & eSTM Permission), BMK (Purchase BMK), Insurance (Update Insurance & Takaful Permission), Settings Manage User + User Account Listing, Company/Business Profile, Account Activation; AATF Homepage, eDeregistration, Settings, Account Activation. Source: sheet EAINT-9894, column Screen, R4-R19.
5. **Never-live source:** Jira comment 14.09.2026 "As of 14.09.2026, this ticket is no longer relevant. May refer EAUTO-1028 / CCB-933 / EAINT-12253 for the new solution." [unconfirmed — seen only via `eauto-qa-azfar/cr/EAINT-9894/LEDGER.md` line 5; verify in Jira before promoting].
