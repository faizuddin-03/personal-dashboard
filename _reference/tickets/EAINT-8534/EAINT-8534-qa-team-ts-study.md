# EAINT-8534 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy**: `_reference/sharepoint/qa-team-ts/EAINT-8534 - [eAuto - eLKM] To Update Maximum eLKM Amount For Sub User from RM500 to RM2,000.md` (export 28/10/2026, 10:18:50 am). Cell text only — formatting, colours and images not available.
2. **Ticket folders**: `_reference/tickets/EAINT-8534/` and `_reference/tickets/Studying/EAINT-8534/` — **neither existed** before this study. No SRD, no Jira export, no notes read.
3. **lib/ticketStudies.ts**: no entry for EAINT-8534.
4. **knowledge/** (grep `EAINT-8534`): `business-rules-from-test-scenarios.md` §3 item 1, `cr-test-scenario-catalogue.md` rows 064 / 070 / 416, `flow-estm.md` "Step 5 add-ons — eLKM and eVOC" and "TS06: where the e-simulator call goes", `flow-zurich-takaful.md` line 420, `production-regression-scope.md` line 1081.
5. **Not read**: the Jira ticket, the SRD, and linked issue **EAINT-8563** (no local copy; this run has no Jira access).

## 1. Header

1. **Ticket**: EAINT-8534 — "[eAuto-eLKM] To Update Maximum eLKM Amount For Sub User from RM500 to RM2,000" (WEB R1, APP R1).
2. **Module / portal**: UCD portal **eSTM** (Create eSTM, individual and company), **eLKM** add-on at Step 5. Checks also reach **BackOffice eSTM Transaction Listing Export CSV** and **RHB Payment Transaction (eAuto Plus)**.
3. **Workbook**: "EAINT-8534 - [eAuto - eLKM] To Update Maximum eLKM Amount For Sub User from RM500 to RM2,000.xlsx", library "eAuto - CR Test Scenarios", modified 23/07/2025, 9:07:21 am.
4. **Sheets**: `WEB` and `APP`.
5. **Scenarios**: **18** — WEB 9 (`8534WEB_TS1`–`TS9`), APP 9 (`8534APP_TS1`–`TS9`).
6. **Results**: **18 PASS, 0 FAIL**. WEB TS2, TS3, TS5, TS8 passed with a remark (accepted current behaviour + existing issue EAINT-8563).
7. **Testers** (QA column): WEB — "Nick"; APP — "Charmain". No test dates in the sheet.
8. **Deployment**: 2025-07-31, per `knowledge/production-regression-scope.md` line 1081 ("| EAINT-8534 | 20250731 | eLKM sub-user limit | No |").

## 2. What the ticket changed (as the TS shows it)

1. **Sub UCD eLKM cap raised** from **RM500** to **RM2,000** per transaction (ticket title, WEB R1).
2. Test objective, verbatim: "To ensure Sub UCD can only proceed with LKM amount = RM2000 or below, and cannot purchase eLKM if the LKM amount is above RM2000." (WEB R5, APP R5).
3. **Above the cap**: Step 5 shows an error, strikes through the eLKM road-tax amount, removes eLKM, and the eSTM goes on **without** eLKM (WEB R9 Expected Result).
4. **Main UCD** is not capped — kept as a regression check (WEB R13).

## 3. Scenarios

WEB and APP hold the **same 9 scenarios** with the same steps. APP expected results say "UCD eSTM Transaction Details Page" where WEB says "eSTM Transaction Details Page".

### A. Sub UCD — 12 months

1. **TS1** (P1) — eSim LKM Amount = **2000**, 12 Months → "NO error message showing, user able to proceed with eLKM until Step 6 Tx Status = Approved" (WEB R8). **PASS** both sheets.
2. **TS2** (P1) — eSim LKM Amount = **2000.01**, 12 Months → error "Maximum LKM Amount RM2,000.00 per transaction, unable to proceed.", strikethrough, "System will auto remove eLKM amount and proceed without eLKM" (WEB R9). **PASS** both; WEB has remark (see §4 item 4).

### B. Sub UCD — switch 12 → 6 months

1. **TS3** (P1) — eSim LKM Amount = **2000.01**; pick 12 Months (error), then 6 Months → "When select 6 Months, NO error message showing, user able to proceed with eLKM until Step 6 Tx Status = Approved" (WEB R10). **PASS** both; WEB has remark.

### C. Sub UCD — 6 months

1. **TS4** (P1) — eSim LKM Amount = **4000**, 6 Months → no error, eLKM proceeds to Approved (WEB R11). **PASS** both.
2. **TS5** (P1) — eSim LKM Amount = **4000.02**, 6 Months → same error, strikethrough and auto-remove as TS2 (WEB R12). **PASS** both; WEB has remark.

### D. 69E insurance path (Sub UCD)

1. **TS7** (P2) — eSim LKM Amount = **2000**; "Proceed until Step 5, hit 69e and complete insurance", back to Step 5, 12 Months → no error, Approved (WEB R14). **PASS** both.
2. **TS8** (P1) — same with **2000.01** → error, strikethrough, eLKM removed (WEB R15). **PASS** both; WEB has remark.

### E. Regression

1. **TS6** (P2) — "[Regression] MAIN UCD - New Transaction", LKM Amount **2000.01**, 12 Months → "NO error message showing, user able to proceed with eLKM until Step 6 Tx Status = Approved" (WEB R13). **PASS** both.
2. **TS9** (P3) — "[Regression] eSTM Company Transaction", "UCD with eVOC Permission", "E2E Happy Flow, until Step 6 Tx Status = Approved"; checks Details page, BO CSV, RHB Payment (WEB R16). **PASS** both.

## 4. Business rules and system behaviour

1. **Error text**: "Maximum LKM Amount RM2,000.00 per transaction, unable to proceed." (WEB R9, R10, R12, R15; APP same rows).
2. **Boundary**: "LKM Amount = 2000.00" allowed (WEB R8); "LKM Amount = 2000.01" blocked (WEB R9). The cap is **inclusive** of RM2,000.00.
3. **Cap is per chosen period**: eSim LKM Amount **4000** passes at 6 Months (WEB R11), **4000.02** fails at 6 Months (WEB R12), and **2000.01** fails at 12 Months but passes at 6 Months (WEB R10). [unconfirmed] The eSim "LKM Amount" is the **12-month** figure, and the 6-month charge is half of it — this is how the sheet's numbers line up; no sheet row says it.
4. **Web does not auto-remove on landing at Step 5**. Remark on WEB R9, R10, R12, R15: "As checked & discussed with BA, remain current behavior for web where on landing of step 5, system do not auto remove eLKM & strikethrough amount (this behavior will only show when attempt to change the duration [6 / 12 months])". Same remark: "Raised as existing issue: https://mfservices.atlassian.net/browse/EAINT-8563".
5. **APP sheet has no such remark** (APP R9, R10, R12, R15). [unconfirmed] The app may remove eLKM on landing, unlike web.
6. **Over-cap is not a hard stop for eSTM**: "System will auto remove eLKM amount and proceed without eLKM" (WEB R9) and Steps "3. System allow to proceed" (WEB R9). Only eLKM is dropped.
7. **Where eLKM data must show (or not)**: "eSTM Transaction Details Page, BackOffice eSTM Transaction Listing Export CSV and RHB Payment Transaction (eAuto Plus)" (WEB R8). Over cap: "NO eLKM related details" in the same three places (WEB R9).
8. **Pre-requisite permission**: "Login Sub UCD with eLKM Permission" (WEB R8). Company regression needs "UCD with eVOC Permission" (WEB R16).
9. **69E insurance path then back to Step 5**: "1. Proceed until Step 5, hit 69e and complete insurance ⏎ 2. Back to Step 5, select LKM Renewal Period, 12 Months" (WEB R14). See §6 item 5 — this conflicts with the current flow doc.

## 5. Test data, environments, accounts, setup

1. **Environments**: WEB — "Test environment: staging/preprod1" (WEB R3); APP — "Test environment: staging/sit1 (eAuto App v1.0.0-build-53)" (APP R3).
2. **eSim LKM Amount values**: 2000, 2000.01, 4000, 4000.02 (Pre-Requisite column, WEB R8–R15).
3. **eSim response VEL000069E** for TS7 / TS8 (WEB R14–R15).
4. **Accounts**: Sub UCD with eLKM Permission; Main UCD; UCD with eVOC Permission. No usernames or passwords in the sheet — **no credentials present**.
5. **Transaction type**: "Create Individual Trnx" (TS1–TS8), "Create New Company Trnx" (TS9).

## 6. Gaps and risks for regression

1. **No Sub UCD company transaction** with an over-cap amount. TS9 is company but Main/eVOC happy path only.
2. **No 6-month boundary at exactly 2000 on the 6-month charge** other than eSim 4000; no 12 → 6 → 12 round-trip back to error.
3. **Web landing behaviour is a known defect, not tested as fixed**: over-cap eLKM is not removed on Step 5 landing until the period is changed (WEB R9 remark, EAINT-8563). A regression should confirm what happens if a Sub UCD lands on Step 5 over cap and pays **without** touching the period. [unconfirmed] whether EAINT-8563 was ever fixed.
4. **TS6 pre-requisite mismatch**: Pre-Requisite says "Login Sub UCD with eLKM Permission" but the scenario is "Main UCD - Create Individual Trnx" (WEB R13). Treat the Main UCD wording as intended [unconfirmed].
5. **69E path conflict with knowledge**: TS7/TS8 say hit 69E at Step 5, complete insurance, then return to Step 5 (WEB R14). `knowledge/flow-estm.md` (§ "TS06: where the e-simulator call goes") says the insurance redirect follows full payment completion: "the redirect into insurance follows once that finishes, not on the eLKM toggle itself." [unconfirmed] whether the 2025 flow differed, or the sheet wording is loose.
6. **No Sub UCD eLKM limit check in BO permissions** (e.g. whether the cap is configurable per company). Not covered.
7. **No check of the error message in other languages** or on the app's exact wording beyond the same text.
8. **Production regression**: `production-regression-scope.md` line 1081 marks it "No" (not in the deployment checklist regression).

## Knowledge candidates

1. **Web Step 5 landing does not remove over-cap eLKM** — "As checked & discussed with BA, remain current behavior for web where on landing of step 5, system do not auto remove eLKM & strikethrough amount (this behavior will only show when attempt to change the duration [6 / 12 months])" (sheet WEB, R9 Remarks). Linked: EAINT-8563. Target: `knowledge/flow-estm.md` "Step 5 add-ons" and `business-rules-from-test-scenarios.md` §3 item 1. **This qualifies the current knowledge line** "At RM2,000.01 the eLKM road-tax amount is struck through and removed" — on web that happens only after changing the period.
2. **Over-cap still completes eSTM** — "System will auto remove eLKM amount and proceed without eLKM" (sheet WEB, R9 Expected Result). Already in knowledge; confirmed.
3. **Where eLKM must appear** — "eSTM Transaction Details Page, BackOffice eSTM Transaction Listing Export CSV and RHB Payment Transaction (eAuto Plus)" (sheet WEB, R8 Expected Result). Useful as the eLKM data-check checklist in `flow-estm.md`.
4. **eSim LKM Amount vs period** — 4000 passes and 4000.02 fails at 6 Months (sheet WEB, R11–R12). [unconfirmed] eSim LKM Amount is the 12-month figure, 6 months is half. Target: `knowledge/esim.md` LKM Amount field.
5. **Old cap was RM500** — ticket title "from RM500 to RM2,000" (sheet WEB, R1). Target: history note in `flow-estm.md`.
6. **Catalogue correction** — `cr-test-scenario-catalogue.md` row 064 names one tester; the sheet records "Nick" on WEB and "Charmain" on APP (QA column, WEB R8–R16, APP R8–R16).
7. **69E-then-back-to-Step-5 wording** (sheet WEB, R14) conflicts with `flow-estm.md` § "TS06" — flag for Faizuddin to confirm; do not change the flow doc on this sheet alone.
