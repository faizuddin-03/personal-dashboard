# EAINT-8686 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of a QA colleague's test script. Nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8686 & 8687 - [eAuto - JomCheck] Upgrade to Latest JomCheck API and Fix Dup Submissions.md` (text copy dated "28/10/2026, 9:59:25 am"). Cell text only. **Formatting, colours, comments and images were not kept**, so none could be read.
2. **knowledge/cr-test-scenario-catalogue.md** row 079 (lines 191, 431).
3. **knowledge/business-rules-from-test-scenarios.md** §5 item 9 (lines 339–342).
4. **knowledge/flow-jomcheck.md** §1–§5a (lines 1–215), §9g (lines 1582–1590), item 9 (lines 1682–1689).
5. **knowledge/esim.md** JomCheck Report entity (lines 407–419).
6. **knowledge/production-regression-scope.md** §11 precedent rows (lines 1053, 1073).
7. **knowledge/README.md** index rows for flow-jomcheck, esim, flow-company-profile-einvoice.
8. **Not found:** `_reference/tickets/EAINT-8686/` held no files before this study. `_reference/tickets/Studying/EAINT-8686/` does not exist. `lib/ticketStudies.ts` has no entry for EAINT-8686 or EAINT-8687.
9. **Not read:** Jira ticket, SRD and Teams. This run had no access, and none were in the repo.

## 1. Header

1. **Tickets:** EAINT-8686 (JomCheck API upgrade) and EAINT-8687 (fix duplicate submissions). One workbook, one sheet.
2. **Module / portal:** eAuto **JomCheck**, UCD purchase flow ("Get JomCheck Report", "Purchase JomCheck page", "JomCheck Transaction Listing"), plus **BackOffice** (UCD TIN edit), **MyInvois Portal** (LHDN) and **eSim** (simulator).
3. **Workbook:** "EAINT-8686 & 8687 - [eAuto - JomCheck] Upgrade to Latest JomCheck API and Fix Dup Submissions.xlsx". SharePoint library "eAuto - CR Test Scenarios", modified 29/09/2025, 11:30:36 am.
4. **Sheets:** "Sheet1" only.
5. **Scenario count:**
   1. **EAINT-8686:** 7 TS ids (8686_E2E_TS1–TS7), 10 rows. TS3 spans R4–R5; TS6 spans R8–R10.
   2. **EAINT-8687:** 3 TS ids (8687_E2E_TS1–TS3). TS1 and TS2 share rows with 8686 TS1 and TS2 (R2, R3). TS3 spans R12–R14.
   3. **Total:** 8 distinct scenarios, 13 data rows. Matches the catalogue's "8".
6. **Result counts:** two result column pairs, "QA | Test Result" and "QA | Test Result (26/9/2025)" (R1).
   1. **First column (Charmain):** PASS on R2, R3, R12, R13, R14 (8686/8687 TS1, TS2, 8687_E2E_TS3). Blank on the rest.
   2. **Second column, "26/9/2025" (Nick):** PASS on R2–R11 (all 8686 rows). Blank on R12–R14.
   3. **No FAIL anywhere.** Every row has at least one PASS.
7. **Testers and dates:** two QA testers named in the sheet. Only one date written: "Test Result (26/9/2025)" (R1). The catalogue lists "Nicholas Lim | 2025-09-29" (cr-test-scenario-catalogue.md line 191); 2025-09-29 is the SharePoint modified date.
8. **Production dates:** EAINT-8687 "20250826 | JomCheck duplicate submit | No" and EAINT-8686 "20251013 | JomCheck API 1.4 | No" (production-regression-scope.md lines 1073, 1053). "No" = "unable to test" in production (same file, line 831).

## 2. What the ticket changed, as the TS shows it

1. **EAINT-8686 — newer JomCheck API.** The upgraded API returns new report fields that eAuto must store. R2 expected C: "Ensure on backend new values are captured successfully ⏎ - totalLostActual ⏎ - totalLostBER ⏎ - windscreenHistory ⏎ - totalLossHistory ⏎ - floodHistory ⏎ - latestMileage ⏎ - oriLatestMileage ⏎ - latestMileageDate ⏎ - accidentCount ⏎ - maxSeverity ⏎ - multipleVin". The API version is "JomCheck API 1.4" per production-regression-scope.md line 1053 (not in the sheet).
2. **EAINT-8687 — no duplicate submission.** A page refresh during a slow RESUBMIT, then a second RESUBMIT, must not send the report request twice. R3 expected C: "Ensure on backend no duplication of submission in logs".
3. **No new screen elements.** The UI checks are the existing [e-Invoice] / [Report] buttons and MyInvois listing. A popup for the refresh case was asked about and refused (R3 Remarks, see section 4 item 9).

## 3. Scenarios

### A. Happy flow and duplicate submission (8686 + 8687)

1. **8686_E2E_TS1 / 8687_E2E_TS1** (R2) — valid TIN, search, pay → "Transaction Status = Approved, e-Invoice Status = OK". Expected: [e-Invoice] & [Report] shown, both download; in MyInvois and "details matches e-Invoice PDF"; 11 new fields captured on backend. Charmain PASS, Nick PASS.
2. **8686_E2E_TS2 / 8687_E2E_TS2** (R3) — eSim Result = Failed, pay → Tx Failed "Failed to retrieve report"; set delay + Result Success; RESUBMIT, refresh during loading, RESUBMIT again → Approved / OK. Expected: both buttons, in MyInvois, "no duplication of submission in logs". Charmain PASS, Nick PASS.

### B. Payment, TIN and submission negatives (8686)

3. **8686_E2E_TS3** (R4–R5) — "Failed Payment > Retry > Payment OK". RHB response code "IF" → Payment Failed, Tx Failed, e-Invoice "-": no buttons, not in MyInvois, "No data, including new values are returned yet (not captured)". Then code "OK", click **Retry** → Approved / OK: both buttons, in MyInvois, new fields captured. Nick PASS.
4. **8686_E2E_TS4** (R6) — **Invalid TIN** → Approved, e-Invoice Status Failed. Expected: "[e-Invoice] button hidden and [Report] button displayed", "transaction NOT displayed in MyInvois Portal", new fields captured. Nick PASS.
5. **8686_E2E_TS5** (R7) — **Blank TIN** → same as TS4. Nick PASS.
6. **8686_E2E_TS6** (R8–R10) — "Submission Failed". eSim Result Failed → Payment OK, Tx Failed: no buttons. RESUBMIT while still Failed → stays Failed. eSim Success, RESUBMIT → "Tx Status = OK" (sic), both buttons, in MyInvois, new fields captured. Nick PASS.
7. **8686_E2E_TS7** (R11) — "Resubmit Existing Transaction". A Failed / Payment OK transaction **created before the API update deployed**, Resubmit from JomCheck Transaction Listing → Approved / OK: both buttons, in MyInvois, new fields captured. Nick PASS.

### C. Duplicate submission after failures (8687)

8. **8687_E2E_TS3** (R12–R14) — same first two steps as 8686_E2E_TS6, then delay + Success, RESUBMIT, refresh during loading, RESUBMIT again → Approved / OK: both buttons, in MyInvois. Charmain PASS. **No backend "no duplication" check written in the expected result** of R14.

## 4. Business rules and system behaviour the TS reveals

1. **Documents on success.** "Ensure [e-Invoice] & [Report] buttons displayed on details page, and the following generated and able to download and open successfully: ⏎ - e-Invoice (JomCheck) ⏎ - JomCheck Report" (Sheet1 R2, Expected A).
2. **Invalid or blank TIN → report yes, e-Invoice no.** "Proceed with Payment, Transaction Status = Approved, e-Invoice Status = Failed" (Sheet1 R6, R7, step 3) and "Ensure [e-Invoice] button hidden and [Report] button displayed on details page" (R6, R7, Expected A). Not sent to MyInvois: "Ensure the transaction NOT displayed in MyInvois Portal" (R6, R7, Expected B).
3. **Failed payment → no documents.** "Ensure [e-Invoice] & [Report] buttons NOT displayed on details page and no document available for download" (Sheet1 R4, Expected A).
4. **Failed payment remark (RHB code IF).** "Remarks = "Wang di dalam akaun RHB anda TIDAK MENCUKUPI. ﻿你的RHB银行余额不足. "" (Sheet1 R4, step 5). Status set: "Payment = Failed ⏎ - Tx Status = Failed ⏎ - e-Invoice Status = -" (same cell).
5. **Failed report retrieval.** "Payment = OK ⏎ - Tx Status = Failed ⏎ - e-Invoice Status = - ⏎ - Remarks = "Failed to retrieve report"" (Sheet1 R8, step 5).
6. **No report data stored until success.** "No data, including new values are returned yet (not captured)" (Sheet1 R4, R8, R9, Expected C).
7. **Two different recovery buttons.** Failed payment uses **Retry**: "On purchase page, click Retry" (Sheet1 R5, step 7). Failed retrieval (payment OK) uses **RESUBMIT**: "On Purchase JomCheck page, click RESUBMIT" (Sheet1 R9, step 6).
8. **RESUBMIT can fail again and stay Failed.** "click RESUBMIT but submission remain failed" → "Tx Status = Failed" (Sheet1 R9, steps 6–7).
9. **Refresh during resubmit — no popup.** "For 8687 - to check if any additional popup to show if user refresh page / any other handling to include ⏎  ⏎ Ans from mj: As long as UCD refresh and resubmit there is no duplicate submission and report return successfully, ok to remain current screen. No need to add any popup" (Sheet1 R3, Remarks). The answer is from a team member initialled "mj"; role not stated.
10. **Duplicate check is backend only.** "QA: To add in expected to check with dev for request to ensure no duplication in log" (Sheet1 R3, Remarks). QA cannot see it on screen; dev checks logs by Transaction ID ("Provide Transaction ID to dev to check on backend", R2 step 5).
11. **Old failed transactions can be resubmitted after the upgrade.** "Search for transaction created before JomCheck API update deployed, where Tx Status = Failed, Payment = OK, Action = Resubmit" (Sheet1 R11, step 3) → "Transaction Status = Approved, e-Invoice Status = OK" (step 5).
12. **MyInvois check.** "Navigate to MyInvois Portal and verify listing under Documents tab" (Sheet1 R2, step 4) and "details matches e-Invoice PDF" (R2, Expected B).
13. **Possible typo.** R10 step 10 says "Tx Status = OK" and "e-Invoice Status =" (blank). Every other success row says "Approved" / "OK" [unconfirmed: likely a typo for Approved / OK].

## 5. Test data, environments, accounts and setup

1. **Environment:** not named in the sheet. Staging assumed [unconfirmed]. The eSim and RHB simulator steps mean a staging environment.
2. **Setup in BO:** "Update UCD TIN Number to a Valid TIN value in BO" (R2 step 1); invalid (R6) and blank (R7) variants.
3. **eSim settings used:**
   1. "Set in simulator JomCheck submission where Result = Failed" (R3 step 3). Matches the eSim **JomCheck Report** field `Result` (Success/Failed) (esim.md line 416).
   2. "Set a delay for JomCheck submission and change Result to Success" (R3 step 6). Matches `Delay Milliseconds` on the same entity. Delay value not written.
   3. "Set in simulator RHB Transfer Resp response code = IF" (R4 step 3), later "= OK" (R5 step 6).
4. **Vehicle numbers and Transaction IDs (Remarks column):**
   1. TS1: "VDD9139", "6dd0784a-8d23-4768-9e3c-fc87756dc0d6" (R2).
   2. TS2: "WB837KA", "3a45d554-e71c-4a83-a9a7-6ca96bc3dbd1" (R3).
   3. TS3: "WB726AV", "c343978b-e864-4bcd-bc98-9693aa7f5966" (R4–R5).
   4. TS4: "WB5032L", "6c868d51-c52f-427b-a6ab-9131d465f2b9" (R6).
   5. TS5: "WWB8645", "ef83207f-e2d0-4678-b91d-499203110228" (R7).
   6. TS6: "WB623YU", "a75fc7e4-a8cb-4c88-aa0f-74dd1d54c757" (R8–R10).
   7. TS7 and 8687_E2E_TS3: no data recorded.
5. **Accounts:** no logins, URLs or TIN values in the sheet. **No credentials present.**
6. **Extra rows:** "R19 | Q & A (done)" and "R21 | To add RESUBMIT part for this TS to check submission & all data is captured ⏎ > added". Which TS R21 refers to is not stated [unconfirmed: likely 8686_E2E_TS6, which has RESUBMIT steps R9–R10].

## 6. Gaps and risks a regression should still cover

1. **Not tested in production.** Both tickets are "No" (unable to test) in the production precedent table (production-regression-scope.md lines 1053, 1073).
2. **New fields checked by dev only.** The 11 fields are "captured on backend"; no row checks they show correctly on the **JomCheck Report PDF** or BO listing.
3. **8687_E2E_TS3 has no duplicate check.** R14 expected stops at MyInvois; the "no duplication of submission in logs" line from R3 is missing.
4. **Double-click / two tabs not tested.** Only "refresh then RESUBMIT again" is covered. Fast double-click on RESUBMIT or Pay Now, or two open tabs, is not.
5. **No e-Invoice duplicate check in MyInvois.** The sheet says "verify transactions created" (R3 step 11), but not that exactly one document exists per transaction [unconfirmed whether that was meant].
6. **TIN fixed after Approved.** TS4/TS5 leave e-Invoice Failed. No row tests what happens if the TIN is corrected later.
7. **Chassis-number search not covered.** Every row uses "search valid Vehicle Number".
8. **BO side not covered.** No row checks BO JomCheck Transaction details or BO Resubmit.
9. **UCD RESUBMIT was later removed.** See section 7 item 1. These UCD RESUBMIT steps cannot be repeated as written today.

## 7. Where this TS differs from knowledge/

1. **UCD Resubmit superseded by EAINT-9203.** This TS has UCD clicking RESUBMIT on the Purchase JomCheck page (R3, R9, R10, R14) and on the Transaction Listing (R11). knowledge/flow-jomcheck.md line 200 (from EAINT-9203): "'Resubmit' action is NOT showing for UCD but remain showing for BO user". Resubmit now lives in BO only (flow-jomcheck.md §9g, line 1586). Not a contradiction in time; the 8686/8687 steps are **out of date** for today's UCD.
2. **Invalid TIN rule agrees.** flow-jomcheck.md line 1683: "A JomCheck bought by a UCD whose company has an invalid TIN gets the Invoice only — no e-Invoice is generated". Matches R6. This TS adds that **blank TIN behaves the same** (R7), which knowledge does not state.
3. **business-rules §5 item 9 row citation slightly off.** It says "failed payment: neither, not in MyInvois `[… rows 2, 4, 6]`" and "No duplicate e-Invoice on duplicate submission `[… row 3]`". Row 3 says "no duplication of submission in logs", not "no duplicate e-Invoice". The rule is about the report request in backend logs.
4. **Catalogue tester.** Catalogue line 191 names one tester. The sheet has two QA columns with two different testers (R1).
5. **New field names match eSim.** The 11 backend fields (R2) line up with the eSim JomCheck Report fields "Total Lost Actual/Total Lost BER, Windscreen History/Flood History/Total Loss History, Latest Mileage/Latest Mileage Date, Accident Count, Max Severity, Multiple VIN" (esim.md lines 416–419). "oriLatestMileage" has no eSim field listed [unconfirmed].
6. **flow-jomcheck.md lineage table (§4) starts at EAINT-10089.** EAINT-8686 (API 1.4) and EAINT-8687 are not listed as predecessors.

## Knowledge candidates

1. **Add EAINT-8686 / 8687 to the lineage table** in knowledge/flow-jomcheck.md §4: "EAINT-8686 | UCD | JomCheck API 1.4 upgrade; 11 new report fields stored" and "EAINT-8687 | UCD | fix duplicate submission on refresh + RESUBMIT". Source: Sheet1 R2, R3; production-regression-scope.md lines 1053, 1073.
2. **Blank TIN = invalid TIN.** Report yes, e-Invoice Status Failed, [e-Invoice] hidden, not in MyInvois. Source: Sheet1 R7, Expected A and B.
3. **Failed payment vs failed retrieval.** Payment Failed (RHB code IF) → **Retry**; Payment OK + Tx Failed "Failed to retrieve report" → **RESUBMIT**. No report data stored until success. Source: Sheet1 R4, R5, R8, R9.
4. **RHB "IF" remark text** for the eSim RHB Transfer response: "Wang di dalam akaun RHB anda TIDAK MENCUKUPI. ﻿你的RHB银行余额不足. ". Source: Sheet1 R4, step 5. Fits knowledge/esim.md or eauto-payments.md.
5. **No popup on refresh during resubmit — by design.** Quote Sheet1 R3 Remarks "Ans from mj: … No need to add any popup".
6. **Duplicate-submission check = dev log check by Transaction ID.** Source: Sheet1 R3 Remarks and R2 step 5.
7. **11 backend field names** from the API 1.4 upgrade: totalLostActual, totalLostBER, windscreenHistory, totalLossHistory, floodHistory, latestMileage, oriLatestMileage, latestMileageDate, accidentCount, maxSeverity, multipleVin. Source: Sheet1 R2, Expected C.
8. **Fix wording** in business-rules-from-test-scenarios.md §5 item 9: "No duplicate e-Invoice" → "no duplicate submission in backend logs". Source: Sheet1 R3, Expected C.
9. **Mark the UCD RESUBMIT steps as superseded by EAINT-9203** wherever 8686/8687 is cited. Source: flow-jomcheck.md line 200; Sheet1 R3, R9–R11, R14.
