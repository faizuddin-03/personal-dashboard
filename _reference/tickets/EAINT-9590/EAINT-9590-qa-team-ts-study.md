# EAINT-9590 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9590 - [eAuto] Applet New Signing Certificate.md` (exported 28/10/2026, 9:30:43 am). Cell text only; formatting, colours and images not kept.
2. **Ticket folders:** `_reference/tickets/EAINT-9590/` and `_reference/tickets/Studying/EAINT-9590/` — no files existed before this study.
3. **knowledge/:** `flow-platform.md`, `business-rules-from-test-scenarios.md`, `cr-test-scenario-catalogue.md`, `production-regression-scope.md`, `flow-stms.md`.
4. **lib/ticketStudies.ts:** no EAINT-9590 entry.
5. **Not read:** Jira ticket, SRD, Teams. No SRD or attachment exists locally. Unattended run, no MCP access used.

## 1. Header

1. **Ticket:** EAINT-9590 — "[eAuto] Applet New Signing Certificate".
2. **Portals:** **UCD** and **AATF** (User Type column, all scenario sheets). No Back Office scenarios.
3. **Workbook:** "EAINT-9590 - [eAuto] Applet New Signing Certificate.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 31/12/2025, 6:13:55 pm.
4. **Sheets (5):**
   a. High Level Test Scope
   b. Test Scenarios - Java 7 (25 scenarios)
   c. Test Scenarios - Java 8 (25 scenarios)
   d. Test Scenarios - Websocket (3 scenarios)
   e. AATF - Loading Time Issue (timing table, no scenarios)
5. **Scenario count:** **53** (25 + 25 + 3).
6. **Results:** **53 PASS, 0 FAIL**. Remarks column empty on every row.
7. **Testers (QA column):**
   a. Java 7: Nadhirah 19, Azfar 6.
   b. Java 8: Teck Yung 20, Azila 5.
   c. Websocket: Azfar 3.
8. **Dates in sheet:** allocation table "(as of 24.12.2025)" (High Level Test Scope R21); day split "31st Dec" / "2nd Jan" (R35). No per-row execution date.
9. **Go-live (from knowledge, not the sheet):** "EAINT-9590 (2026-01): Applet re-signed. Live S25.2-20260105." `[knowledge/flow-platform.md, Ticket history]`

## 2. What the ticket changed

1. **Certificate only, no logic.** "Note: There's no logic / code changes, mainly to update Applet with new Signing Cert." (High Level Test Scope R3)
2. **Proof of change = thumbprint still works.** Every expected result starts: "Ensure all thumbprint pages are able to detect the Dermalog device and capture thumbprints successfully (following existing behavior)." (Java 7 R2–R26, Java 8 R2–R26, Websocket R2–R4)
3. **Both Java runtimes.** "Each module’s happy flow must be executed on both Java 7 and Java 8." (High Level Test Scope R3)
4. **WebSocket also run.** A separate Websocket sheet on Chrome. Whether the WebSocket reader was also re-signed is not stated in the sheet [unconfirmed].

## 3. Scenarios

Java 7 and Java 8 sheets hold the **same 25 pages**; only Category differs on some rows (see 3d). Browser on both: "Firefox v36.0.4".

### 3a. UCD — full transactions to Approved (TS1–TS5)

Expected (both sheets): thumbprint line plus "Ensure E2E happy flow behaves correctly and displays all details correctly."

1. **TS1** — STMS: "1. Create new Transaction (STMS + TH) ⏎ 2. Proceed through the workflow until Transaction Status = Approved".
2. **TS2** — UCD To UCD (Standard): create, run to Approved.
3. **TS3** — UCD To UCD (Interstate): create, run to Approved.
4. **TS4** — eSTM: Java 7 "(eSTM + eVOC)"; Java 8 "(eSTM + eLKM + eVOC)". Run to Approved.
5. **TS5** — BMK (Butiran Maklumat Kenderaan): create, run to Approved.

### 3b. UCD — thumbprint page checks (TS6–TS19)

Test Scenario on all: "Verify Thumbprint-related page". Expected: thumbprint line only.

1. **TS6** — Pre e-Invoice: Update Company/Business Profile → "Step 3 - MVD License Agreement & Thumbprint Verification".
2. **TS7** — eSerahan Permission → "Director Verification To Add eSerahan User (Main User)".
3. **TS8** — eSerahan Permission → "Director Verification To Remove e-Serahan User (Main User)".
4. **TS9** — eSerahan Permission → "Director Verification To Inactivate e-Serahan User (Main User)".
5. **TS10** — eSerahan Permission → "e-Serahan User Activation Page (Sub User)".
6. **TS11** — eSerahan Permission → "eSerahan L1 User - e-Serahan User Activation Page (L1 User)".
7. **TS12** — eSerahan Permission → "eSerahan Approval User - e-Serahan User Activation Page (L2 User)".
8. **TS13** — Insurance Permission → "Director Verification To Accept Insurance Commercial Agreement (Main User)".
9. **TS14** — Insurance Permission → "Director Verification To Add Insurance User (Main User)".
10. **TS15** — Insurance Permission → "Director Verification To Remove Insurance User (Main User)".
11. **TS16** — Insurance Permission → "Director Verification To Inactivate Insurance User (Main User)".
12. **TS17** — Insurance Permission → "Insurance User Activation Page (Sub User)".
13. **TS18** — Settings: Manage Users → "Add New User Account (Main & Sub User)".
14. **TS19** — Create New UCD Company Account → "First Time Login New UCD (Main User)".

### 3c. AATF (TS20–TS25)

1. **TS20** — DEREG: "Proceed through the workflow until Transaction Status = Approved, COD = No". Expected: thumbprint + E2E line.
2. **TS21** — Upload COD, "Step 1 - AATF": "3. Proceed with COD until Transaction Status = Approved, COD = Yes". Expected: thumbprint + E2E line. Step numbered "3." — it continues TS20 [unconfirmed: same transaction].
3. **TS22** — Settings: Manage Users → "Add New User Account (Main User)". Thumbprint page check.
4. **TS23** — Settings: Manage Users → "Update User Account (Main User)". Thumbprint page check.
5. **TS24** — Create New AATF Company / User Account → "First Time Login New AATF (Main User)".
6. **TS25** — Same module → "First Time Login New AATF (Sub User)".

### 3d. Category split Java 7 vs Java 8

| TS | Java 7 | Java 8 |
|---|---|---|
| TS1 STMS | Individual (MyKad) | Company |
| TS4 eSTM | Company | Individual (MyKad) |
| TS5 BMK | Individual (MyPR) | Company |
| TS20/TS21 DEREG/COD | Individual (MyKad) | Individual (MyPR) |

1. Follows the scope note "Testing ONLY  one category is sufficient ." (High Level Test Scope R3) — each Java version took a different category, so together they cover more owner types.

### 3e. Websocket sheet (Chrome)

1. **WS_TS1** — UCD, STMS, Company, "(STMS + TH)" to Approved. PASS.
2. **WS_TS2** — UCD, eSTM, Individual (MyKad), "(eSTM + eLKM + eVOC)" to Approved. PASS.
3. **WS_TS3** — AATF, DEREG, Individual (MyPR), to "Approved, COD = No". PASS.

## 4. Business rules and system behaviour

1. **Applet browser = Firefox 36.0.4.** "Firefox v36.0.4" (Java 7 and Java 8 sheets, Browser column, every row). Matches `knowledge/flow-platform.md` "Firefox 36.0.4 (Java applet, P1)".
2. **WebSocket browser = Chrome.** "Chrome" (Websocket R2–R4).
3. **Thumbprint device = Dermalog.** "detect the Dermalog device" (every expected result).
4. **Cert-only changes get a reduced scope.** "For each module, execute one happy flow ONLY." (High Level Test Scope R3). Same idea in the deployment checklist: "Scope has already been reduced, as there are no code changes involved." `[knowledge/production-regression-scope.md, 20260105 R41]`
5. **Thumbprint page inventory.** TS6–TS19 (UCD) and TS22–TS25 (AATF) form a list of every non-transaction page that takes a thumbprint (Java 7 R7–R26). Useful as a checklist for any future reader change.
6. **COD flag.** DEREG ends at "Approved, COD = No"; COD upload moves it to "Approved, COD = Yes" (Java 7 R21–R22).
7. **AATF COD Step 1 → Step 2 is slow, not a defect.** "Step 1 COD > Click [Next] > Take quite long time to go to Step 2" (AATF - Loading Time Issue R3). Timings recorded, all marked "No" under "Issue?" (R5–R11):

| Tester's Java | /sit2 | /eauto | Issue? |
|---|---|---|---|
| Java 8 | 23 sec | 26 sec | No |
| Java 8 | 7 sec | 7 sec | No |
| Java 7 | 11 sec | 9 sec | No |
| Java 7 | 30 sec | 24 sec | No |
| Java 7 | 9 sec | 11 sec | No |
| Java 7 | 8 - 9 sec | 4 - 5 sec | No |

8. **Two staging instances.** Timing columns "/sit2" and "/eauto" (R5) — both used in Dec 2025.

## 5. Test data, environments, setup

1. **Environment:** "Testing Enviroment : ⏎        - staging/sit2" (High Level Test Scope R3). Timing sheet also uses "/eauto".
2. **Runtimes:** Java 7 and Java 8 per tester machine (allocation table R22–R32: most testers "Java 7"; two "Java 8").
3. **Hardware:** Dermalog thumbprint reader (expected results).
4. **Accounts:** UCD (Main, Sub, L1, L2, Director roles) and AATF (Main, Sub). No account IDs written.
5. **Credentials:** none present in the sheet.
6. **Team allocation** (High Level Test Scope R35–R47): "31st Dec" / "2nd Jan" split; "Websocket" assigned to one tester; R45–R47 list three testers against "9590".

## 6. Gaps and risks for regression

1. **No negative thumbprint cases** — no device, wrong finger, unplugged reader. Out of scope by design ("happy flow ONLY").
2. **No certificate checks** — Java security prompt, publisher name, expiry date not verified [unconfirmed whether checked informally].
3. **Edge not run.** `flow-platform.md` lists "Edge 139 (WebSocket, P2)"; Websocket sheet uses Chrome only.
4. **WebSocket covers 3 modules only** (STMS, eSTM, DEREG); none of the TS6–TS25 permission/activation pages.
5. **Not in scope:** eDereg (UCD), JomCheck, Pre-App/onboarding thumbprint, eSerahan bulk — not listed [unconfirmed whether they use thumbprint].
6. **Remarks blank** — no evidence links or transaction refs recorded.
7. **Cert expiry risk.** A signing cert has a fixed lifetime; next renewal will need this same matrix [unconfirmed: expiry date not in sheet].
8. **Ticket mapping conflict in knowledge.** `knowledge/production-regression-scope.md` (table row) maps the 20260105 tab to "EAINT-7229 | 20260105 | Web socket signing certificate", while `knowledge/flow-platform.md` says "EAINT-9590 (2026-01): Applet re-signed. Live S25.2-20260105." One of the two is wrong or both tickets shipped together [unconfirmed].

## Knowledge candidates

1. **Thumbprint page inventory (UCD + AATF)** for `knowledge/flow-platform.md` QA scope: list from Java 7 sheet R2–R26 (section 3 above). Source: `[SharePoint TS EAINT-9590, Test Scenarios - Java 7, R2–R26]`.
2. **AATF COD Step 1 → Step 2 delay is known and accepted** (4–30 sec, "Issue? No"). For `knowledge/flow-edereg.md` or the COD flow. Source: `[SharePoint TS EAINT-9590, AATF - Loading Time Issue, R3–R11]`.
3. **COD flag values** "Approved, COD = No" → "Approved, COD = Yes". Source: `[SharePoint TS EAINT-9590, Test Scenarios - Java 7, R21–R22]`.
4. **Applet test matrix = Firefox 36.0.4 × Java 7 and Java 8**; WebSocket = Chrome. Source: `[SharePoint TS EAINT-9590, High Level Test Scope R3; Java 7/Java 8/Websocket Browser columns]`.
5. **Resolve the 20260105 ticket mapping** (EAINT-7229 vs EAINT-9590) between `production-regression-scope.md` and `flow-platform.md`. Needs Jira or the deployment checklist tab header to settle.
6. **Catalogue correction check:** `knowledge/cr-test-scenario-catalogue.md` row 103 lists owner "May Chin Mei Theng"; the sheet itself names May only in the allocation table (R23), not in any QA column. Owner likely = file author [unconfirmed].
