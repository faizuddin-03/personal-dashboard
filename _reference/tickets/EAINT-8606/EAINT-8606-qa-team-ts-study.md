# EAINT-8606 — QA Team test script study (2026-10-28)

> **Read this first.** The workbook is named `EAINT-8606.xlsx`, but it does **not** hold a
> Zurich Takaful script. Every sheet holds the **EAINT-8534 eLKM limit** script. Quote:
> "Ticket(s): EAINT-8534 [eAuto-eLKM] To Update Maximum eLKM Amount For Sub User from RM500 to RM2,000"
> (sheet WEB, R1; sheet APP, R1). This is already known: "EAINT-8606.xlsx holds the
> EAINT-8534 script (`#070, sheet WEB, meta row 1`); the file name and content disagree.
> Known; the team will rename it later. No action." (`knowledge/business-rules-from-test-scenarios.md`
> line 1049-1050, tagged `[from Faizuddin, 2026-10-16]`).
>
> The real EAINT-8606 (Zurich Takaful onboarding, eAuto) is covered by
> `knowledge/flow-zurich-takaful.md`. Nothing in this workbook adds to it.

## Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-8606.md` — text copy of `EAINT-8606.xlsx`
   (library "eAuto - CR Test Scenarios", modified 23/02/2026, 11:47:59 am). Cell text only;
   formatting and images not kept.
2. `_reference/inbox/eauto-flows-run/ts-text/EAINT-8534_-_eAuto_-_eLKM_To_Update_Maximum_eLKM_Amount_For_Sub_User_from_RM500_to_RM2_000.txt`
   — text copy of the properly named EAINT-8534 workbook. **Cell text is identical** to
   `EAINT-8606.xlsx` on both sheets (compared row by row, 2026-10-28).
3. `knowledge/cr-test-scenario-catalogue.md` rows 064 and 070 (lines 166-167, 416, 422).
4. `knowledge/business-rules-from-test-scenarios.md` §3 item 1 (lines 186-190) and §11 item 8 (line 1049).
5. `knowledge/flow-estm.md` lines 199-203 (Sub UCD eLKM cap).
6. `knowledge/flow-zurich-takaful.md` line 420 (points to catalogue row 070).
7. `knowledge/production-regression-scope.md` line 1081 (EAINT-8534 release row).
8. `_reference/tickets/EAINT-8606/` and `_reference/tickets/Studying/EAINT-8606/` — **no files
   found** (this study is the first file in the former).
9. `lib/ticketStudies.ts` — **no match** for "8606" or "8534".
10. Not read: the `.xlsx` itself (only the text copy), Jira EAINT-8534 / EAINT-8563, any SRD.

## 1. Header

1. **File name ticket:** EAINT-8606 (Zurich Takaful onboarding — unrelated to the content).
2. **Content ticket:** EAINT-8534 — "[eAuto-eLKM] To Update Maximum eLKM Amount For Sub User from RM500 to RM2,000" (WEB R1, APP R1).
3. **Module / portal:** eSTM with eLKM add-on, **UCD web** and **eAuto App**; results checked in **BackOffice** and **RHB Payment Transaction (eAuto Plus)**.
4. **Workbook:** `EAINT-8606.xlsx`, library "eAuto - CR Test Scenarios", modified 23/02/2026 11:47:59 am.
5. **Sheets:** 2 — `WEB`, `APP`.
6. **Scenarios:** 18 — WEB 9 (`8534WEB_TS1`–`TS9`), APP 9 (`8534APP_TS1`–`TS9`).
7. **Results:** **18 PASS, 0 FAIL** (Test Result column, every row).
8. **Testers (QA column):** WEB rows R8-R16 = "Nick"; APP rows R8-R16 = "Charmain".
9. **Dates:** none written in the sheet. Release of EAINT-8534 is listed as "20250731" (`knowledge/production-regression-scope.md` line 1081).
10. **Priorities:** WEB and APP each: P1 × 6, P2 × 2, P3 × 1.

## 2. What the ticket changed, as the TS shows it

1. **Sub UCD eLKM cap raised to RM2,000.** Ticket title: "To Update Maximum eLKM Amount For Sub User from RM500 to RM2,000" (WEB R1).
2. **Objective:** "To ensure Sub UCD can only proceed with LKM amount = RM2000 or below, and cannot purchase eLKM if the LKM amount is above RM2000." (WEB R5, APP R5).
3. **Over-cap handling:** Step 5 shows an error, strikes through the eLKM road-tax amount, removes eLKM and lets the transaction continue without it (WEB R9, R12, R15).
4. **Main UCD unchanged** — not capped (WEB R13, regression row).

## 3. Scenarios

WEB and APP sheets carry the same 9 scenarios. Only wording difference: APP expected results say "UCD eSTM Transaction Details Page" where WEB says "eSTM Transaction Details Page".

**A. Sub UCD, 12-month renewal period**

1. **TS1 (P1)** — eSim LKM Amount 2000, 12 Months. Expected: "NO error message showing, user able to proceed with eLKM until Step 6 Tx Status = Approved". PASS.
2. **TS2 (P1)** — eSim LKM Amount 2000.01, 12 Months. Expected: "Maximum LKM Amount RM2,000.00 per transaction, unable to proceed." + strikethrough; "System will auto remove eLKM amount and proceed without eLKM". PASS (WEB with remark, see §4.4).

**B. Sub UCD, period switch**

3. **TS3 (P1)** — eSim 2000.01; pick 12 Months (error), then 6 Months. Expected: "When select 6 Months, NO error message showing, user able to proceed with eLKM until Step 6 Tx Status = Approved". PASS.

**C. Sub UCD, 6-month renewal period**

4. **TS4 (P1)** — eSim LKM Amount 4000, 6 Months. Expected: no error, proceeds with eLKM to Approved. PASS.
5. **TS5 (P1)** — eSim LKM Amount 4000.02, 6 Months. Expected: same error + strikethrough + eLKM auto removed. PASS.

**D. Regression**

6. **TS6 (P2)** — Main UCD, eSim 2000.01, 12 Months. Expected: no error, proceeds with eLKM to Approved. PASS.
7. **TS9 (P3)** — Company transaction, E2E happy flow to "Step 6 Tx Status = Approved". Expected: details page, BO export CSV and RHB Payment Transaction show correctly. PASS.

**E. Sub UCD after VEL000069E insurance**

8. **TS7 (P2)** — eSim 2000; "Proceed until Step 5, hit 69e and complete insurance", back to Step 5, 12 Months. Expected: no error, proceeds with eLKM. PASS.
9. **TS8 (P1)** — eSim 2000.01; same 69E path. Expected: error + strikethrough + eLKM auto removed. PASS.

**Check points in every row:** "eSTM Transaction Details Page, BackOffice eSTM Transaction Listing Export CSV and RHB Payment Transaction (eAuto Plus)" (WEB R8-R15).

## 4. Business rules and system behaviour

1. **Error text:** "Maximum LKM Amount RM2,000.00 per transaction, unable to proceed." (WEB R9, R10, R12, R15; APP same rows).
2. **Boundary:** RM2,000.00 passes (TS1, TS7); RM2,000.01 is blocked (TS2, TS8). Cap is inclusive.
3. **Cap uses the chosen-period amount.** eSim 4000 passes at 6 Months (TS4) and 4000.02 fails at 6 Months (TS5); 2000.01 fails at 12 Months but passes at 6 Months (TS3). [unconfirmed] The eSim "LKM Amount" is the 12-month amount and the 6-month amount is half of it — inferred from the TS4/TS5 values; the sheet does not say so.
4. **Web landing behaviour (known issue).** WEB remark, R9, R10, R12, R15: "As checked & discussed with BA, remain current behavior for web where on landing of step 5, system do not auto remove eLKM & strikethrough amount (this behavior will only show when attempt to change the duration [6 / 12 months])" and "Raised as existing issue: https://mfservices.atlassian.net/browse/EAINT-8563". The APP sheet has **no such remark** on the same rows. [unconfirmed] The app removes eLKM on landing; the web only on period change.
5. **Over-cap result is clean.** "NO eLKM related details in eSTM Transaction Details Page, BackOffice eSTM Transaction Listing Export CSV and RHB Payment Transaction (eAuto Plus)" (WEB R9, R12, R15).
6. **Main UCD not capped:** Main UCD at 2000.01, 12 Months, expected "NO error message showing" (WEB R13).
7. **69E return path keeps the cap** (TS7, TS8 — WEB R14-R15).

## 5. Test data, environments, setup

1. **Environments:** WEB "staging/preprod1" (WEB R3); APP "staging/sit1 (eAuto App v1.0.0-build-53)" (APP R3).
2. **Accounts:** "Login Sub UCD with eLKM Permission" (R8-R12, R14-R15); Main UCD (TS6); "UCD with eVOC Permission" (TS9). No account IDs. **No credentials present.**
3. **Data lever:** eSim LKM Amount = 2000, 2000.01, 4000, 4000.02.
4. **Insurance lever:** VEL000069E ("hit 69e") for TS7/TS8.
5. **Sheet slip:** TS6 pre-requisite says "Login Sub UCD with eLKM Permission" but the scenario is "Main UCD - Create Individual Trnx" (WEB R13, APP R13). The scenario text is the intent. [unconfirmed]

## 6. Gaps and risks for regression

1. **Web landing gap (EAINT-8563).** On web, Step 5 landing with an over-cap amount does not remove eLKM. A regression must test **landing without touching the period**, not only after a period change. Status of EAINT-8563 not checked.
2. **6-month boundary at exactly 4000.01 / 2000.00-equivalent** — only 4000 and 4000.02 tested. [unconfirmed] whether 4000.01 rounds to RM2,000.00 or RM2,000.01 for 6 months.
3. **6 → 12 switch** not tested (only 12 → 6).
4. **Company transaction** checked only on happy flow; no over-cap company case. [unconfirmed] whether company transactions are capped.
5. **Sub UCD without eLKM permission** not covered.
6. **Bulk or resubmitted transactions** not covered.
7. **File naming risk:** anyone searching SharePoint for Zurich EAINT-8606 TS lands on an eLKM script. Zurich TS live in Miro per `knowledge/flow-zurich-takaful.md`.

## Knowledge candidates

1. **Web Step-5 landing does not apply the eLKM cap** — only a 6/12-month change triggers removal and strikethrough; accepted by BA, logged as existing issue EAINT-8563. Quote: "As checked & discussed with BA, remain current behavior for web where on landing of step 5, system do not auto remove eLKM & strikethrough amount (this behavior will only show when attempt to change the duration [6 / 12 months])" (EAINT-8606.xlsx = EAINT-8534 script, sheet WEB, R9). Target: `knowledge/flow-estm.md` "Sub UCD eLKM cap" paragraph and `knowledge/business-rules-from-test-scenarios.md` §3 item 1 — neither mentions it today.
2. **Tester attribution in catalogue is partly wrong.** `knowledge/cr-test-scenario-catalogue.md` rows 064 and 070 name "Charmain Ea Chiang" for WEB and APP. The QA column says "Nick" on every WEB row (sheet WEB, R8-R16) and "Charmain" on APP (sheet APP, R8-R16).
3. **Catalogue row 070 is a byte-for-byte duplicate of row 064** in cell text (compared 2026-10-28). Could be noted in row 070 "Same as row 064" — already stated; add "cell text identical".
4. **Environments per sheet:** WEB "staging/preprod1", APP "staging/sit1 (eAuto App v1.0.0-build-53)" (R3 each sheet). Catalogue lists them merged; per-sheet split is more exact.
5. [unconfirmed] **eSim LKM Amount = 12-month amount; 6-month = half** — inferred from TS4/TS5 (WEB R11-R12). Verify in eSim before adding to `knowledge/esim.md`.
