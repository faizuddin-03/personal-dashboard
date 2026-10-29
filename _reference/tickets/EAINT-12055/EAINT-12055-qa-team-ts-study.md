# EAINT-12055 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of another QA engineer's TS. Nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12055 - eAuto-BackOffice Exclude Successful Resubmission Transaction from Reconciliation Listing.md` (captured 27/10/2026, 8:00:24 pm). Cell text only; colours, images and dropdowns are not in the copy.
2. **SRD:** `_reference/tickets/EAINT-12055/EAINT-12055-SRD-v1.0-20260723-text.txt` (text of the v1.0 PDF, 23.07.2026, author Lim Yi Link).
3. **Jira capture:** `_reference/tickets/Studying/EAINT-12055/EAINT-12055-jira.md` (27/10/2026, 5:45:57 pm).
4. **Knowledge:** `knowledge/flow-bo-shell.md` (§"Reconciliation Summary Listing — EAINT-12055 SRD v1.0", §"Additions from the 2026-10-23 flows study"), `knowledge/teams-decisions-by-ticket.md` (§EAINT-12055), `knowledge/business-rules-from-test-scenarios.md` (§11 item 8, line 1045), `knowledge/releases.md`, `knowledge/environments-history.md`, `knowledge/people-and-roles.md`.
5. **`lib/ticketStudies.ts`:** no EAINT-12055 entry (grep returned nothing).
6. **Not read:** the two `.docx` SRDs (v0.1, v1.0) on Jira — not in the repo; the PDF text copy was used instead. The original `.xlsx` was not opened; formula cells show as formulas in the text copy.

## 1. Header

1. **Ticket:** EAINT-12055 — "🔴[eAuto-BackOffice] Exclude Successful Resubmission Transaction from Reconciliation Listing" (Jira Summary). Status "Done"; Fix version "S32.7-20260817 🌚 (2026-08-17)"; "[QA] Est Man-day (cf 10081): 4" (Jira capture, lines 6-11).
2. **Portal / module:** "eAuto Back Office User Portal"; "eAuto Recon Module (Reconciliation Summary Listing)" (SRD §2.2.1, rows 2-3). Page "Reconciliation Summary Listing (Reconciliation Listing tab)" (SRD §2.2.3).
3. **Workbook:** "EAINT-12055 - eAuto-BackOffice Exclude Successful Resubmission Transaction from Reconciliation Listing.xlsx", library "eAuto - CR Test Scenarios", modified 17/08/2026, 2:43:57 pm.
4. **Sheets (6):** Test Progress, New Transaction, Existing Transaction, Special Scenarios (sheet name has a trailing space: "Special Scenarios "), Regression, Ref-Amount.
5. **Scenarios: 52** — "TOTAL | 52" (Test Progress, R9).
6. **Results:** **40 Pass, 12 N/A, 0 Failed**, "Executed" 52 (Test Progress, R9: "TOTAL | 52 | … | 40 | … | 12 | 52").

| Tab | Total | Pass | N/A | Source |
|---|---|---|---|---|
| New Transaction | 24 | 12 | 12 | Test Progress R5 |
| Existing Transaction | 12 | 12 | 0 | Test Progress R6 |
| Regression | 15 | 15 | 0 | Test Progress R7 |
| Special Scenarios | 1 | 1 | 0 | Test Progress R8 |

7. **Tester:** "Azila" in the QA column of every executed row (e.g. New Transaction R4). Jira QA field: "Siti Nur Azila" (Jira capture, line 7).
8. **Dates in the sheet:** test data dated **2026-08-11 to 2026-08-17** — payment 2026-08-12, Recon Run #1 2026-08-13, Run #2 2026-08-14 (New Transaction R4); special scenario recon on "17/8" (Special Scenarios R5).

## 2. What the ticket changed, as the TS shows it

1. **Before:** a payment and its approved transaction on different dates showed as **two lines** (a mismatch pair), each with a different Refund Required. The TS remark: "Confirm both mismatch lines (bank-only 10/8, system-only 11/8) disappear from the listing after Run #2 - fully hidden, not just Refund Required corrected." (New Transaction, R4).
2. **After:** once a failed submission is **resubmitted and Approved** with the same Payment Ref No., the next recon run **removes both lines** from the listing.
3. **Applies to old records:** "Confirms the new exclusion logic applies retroactively to legacy mismatch records already on the listing" (Existing Transaction, R4).
4. **Hide is permanent:** "Trxn does NOT reappear as mismatch — remains permanently hidden" (Special Scenarios, R5).
5. **Genuine mismatches stay:** "Confirms exclusion only fires on a genuine matched pair (same Payment Ref No. approved)." (Regression, R17).

## 3. Scenarios

### 3a. New Transaction — DIFFERENT DATE (same month), 12 rows, all Pass

Scenario text for all 12: "Payment OK and resubmission approved on different dates (same month) → mismatch pair excluded from listing after match." Expected: "Displayed as Mismatch?" ✓ at Run #1, "Both Records Removed?" ✓ at Run #2.

1. **NEW_RECONLS_TS01** — STMS — Pass (R4).
2. **NEW_RECONLS_TS02** — APT — Pass (R5).
3. **NEW_RECONLS_TS03** — eSTM — Pass (R6).
4. **NEW_RECONLS_TS04** — SSM — Pass (R7).
5. **NEW_RECONLS_TS05** — Dereg — Pass, with extra cell "As per checked with dev, unable to resubmit Dereg Final Submission" (R8).
6. **NEW_RECONLS_TS06** — eDereg Pre-Checking — Pass (R9).
7. **NEW_RECONLS_TS07** — BMK — Pass (R10).
8. **NEW_RECONLS_TS08** — TH — Pass (R11).
9. **NEW_RECONLS_TS09** — eLKM — Pass (R12).
10. **NEW_RECONLS_TS10** — eVOC — Pass (R13).
11. **NEW_RECONLS_TS11** — JomCheck — Pass (R14).
12. **NEW_RECONLS_TS12** — Insurance — Pass (R15).

### 3b. New Transaction — CROSS MONTH, 12 rows, all N/A (not executed)

Scenario text for all 12: "Payment OK and resubmission approved in different calendar months (patched dates) → mismatch pair excluded from listing after match." Payment "31-Jul-2026 (patched)", approval "01-Aug-2026 (patched, Approved)". QA column blank, result "N/A".

1. **NEW_RECONLS_TS13 to TS24** — STMS, APT, eSTM, SSM, Dereg, eDereg Pre-Checking, BMK, TH, eLKM, eVOC, JomCheck, Insurance — all N/A (R17-R28). Payment Ref No. left as placeholders "REF-002" to "REF-035".

### 3c. Existing Transaction (pre-deployment), 12 rows, all Pass

Scenario text for all 12: "Transaction paid (OK) BEFORE deployment, resubmitted/approved AFTER deployment → mismatch pair excluded retroactively." Dates D-1 (paid), D (Run #1), D (approved), D+1 (Run #2).

1. **EXT_RECONLS_TS01** — STMS — Pass, extra cell "As per checked with dev, unable to resubmit STMS (Wholesale) Final Submission,  record remain mismatch" (R4).
2. **EXT_RECONLS_TS02** — APT — Pass, extra cell "As per checked with dev, unable to resubmit APT Final Submission, record remain mismatch" (R5).
3. **EXT_RECONLS_TS03** — eSTM — Pass (R6).
4. **EXT_RECONLS_TS04** — SSM — Pass (R7).
5. **EXT_RECONLS_TS05** — Dereg — Pass, extra cell "As per checked with dev, unable to resubmit Dereg Final Submission,  record remain mismatch" (R8).
6. **EXT_RECONLS_TS06** — eDereg Pre-Checking — Pass (R9).
7. **EXT_RECONLS_TS07** — BMK — Pass (R10).
8. **EXT_RECONLS_TS08** — TH — Pass (R11).
9. **EXT_RECONLS_TS09** — eLKM — Pass (R12).
10. **EXT_RECONLS_TS10** — eVOC — Pass (R13).
11. **EXT_RECONLS_TS11** — JomCheck — Pass (R14).
12. **EXT_RECONLS_TS12** — Insurance — Pass; approval "D+1", Run #2 "D+2" (R15).

### 3d. Special Scenarios, 1 row, Pass

1. **SPS_RECONLS_TS01** — "Multiple Recon (Late Approval, Permanent Hide)". Steps: create trxn 12/8 Payment OK + JPJ Final Submission Failed → recon 13/8 → resubmit to Approved → recon 17/8 → "Re-upload RHB bank statement (containing mismatch data)" → "Trigger manual recon on 17/8" → check "Perbezaan/mismatch listing". Expected: "Trxn does NOT reappear as mismatch — remains permanently hidden" (R5).

### 3e. Regression, 15 rows, all Pass

**SAME DAY (eAuto = RHB)** — scenario: "Payment OK and approval on the SAME date → matches immediately, single line, correct Refund Required (no regression)." Expected Run #2 outcome "Non mismatch".

1. **REG_ECONLS_TS01** STMS (R4), **REG_RECONLS_TS02** APT (R5), **REG_ECONLS_TS02** eSTM (R6), **REG_RECONLS_TS03** SSM (R7), **REG_ECONLS_TS03** Dereg (R8), **REG_RECONLS_TS04** eDereg Pre-Checking (R9), **REG_ECONLS_TS04** BMK (R10), **REG_RECONLS_TS05** TH (R11), **REG_ECONLS_TS05** eLKM (R12), **REG_RECONLS_TS06** eVOC (R13), **REG_ECONLS_TS06** JomCheck (R14), **REG_RECONLS_TS07** Insurance (R15) — all Pass.

**SAME DAY (eAuto < RHB)** — expected "Displayed as mismatch".

2. **REG_RECONLS_TS08** — eSTM — "JPJ Final Submission FAILED but RHB Payment completed → mismatch must stay visible, must NOT be removed by the new exclusion logic." — Pass (R17).
3. **REG_RECONLS_TS09** — JomCheck — same scenario — Pass (R18).

**SAME DAY (eAuto > RHB)** — expected "Displayed as mismatch".

4. **REG_RECONLS_TS10** — eSTM — "JPJ Final Submission APPROVED but RHB Payment not received/failed → mismatch must stay visible, must NOT be removed by the new exclusion logic." — Pass (R20).

## 4. Business rules and system behaviour the TS reveals

1. **Match key = Payment Ref No.** "Confirms exclusion only fires on a genuine matched pair (same Payment Ref No. approved)." (Regression, R17). Matches SRD §2.1.1 assumption 1: "A payment and an approved transaction are considered a matched pair when they share the same Payment Ref No."
2. **Full hide, not a Refund Required fix.** "fully hidden, not just Refund Required corrected." (New Transaction, R4).
3. **Retroactive.** "Confirms the new exclusion logic applies retroactively to legacy mismatch records already on the listing, not only to newly created records - per SRD 2.2.4 item 5 (Apply to existing records)." (Existing Transaction, R4).
4. **Permanent hide after statement re-upload + manual recon.** "Trxn does NOT reappear as mismatch — remains permanently hidden" (Special Scenarios, R5). Same as Teams rule "A hidden mismatch stays hidden permanently" (`knowledge/teams-decisions-by-ticket.md` §EAINT-12055 item 3, from Teams 2026-08-14 15:01).
5. **Manual recon exists.** Step "6. Trigger manual recon on 17/8" (Special Scenarios, R5). The listing is also called "Perbezaan/mismatch listing" (same row).
6. **Unmatched payment stays for refund.** "A standalone rejected RHB payment with no approved counterpart must keep appearing so Finance can process the refund." (Regression, R17).
7. **Unmatched approval stays.** "An approved eAuto transaction with no RHB payment counterpart must keep appearing until payment is received or the case is resolved." (Regression, R20).
8. **No resubmission = visible forever.** "no resubmission ever occurs - so the mismatch record must remain visible indefinitely for Finance/Ops follow-up." (Regression, R22 note 2).
9. **Same-day matches never formed a pair.** "same-day matches were never shown as a mismatch pair to begin with, so the exclusion logic is not applicable here." (Regression, R4).
10. **Module scope — 12 types.** "All 12 modules in scope per Transaction Type filter (STMS, APT, eSTM, SSM, Dereg, eDereg Pre-Checking, BMK, TH, eLKM, eVOC, JomCheck, Insurance); Software Installation and Biometric Device Purchase are excluded per screenshot scope." (New Transaction, R30 note 3).
11. **Some Final Submissions cannot be resubmitted.** "As per checked with dev, unable to resubmit Dereg Final Submission" (New Transaction, R8); same for "STMS (Wholesale)" (Existing Transaction, R4), "APT" (R5) and "Dereg" (R8), each with "record remain mismatch".
12. **Kod Hasil per module** (New Transaction R4-R15): STMS, APT, eSTM "H0272423"; eDereg Pre-Checking, BMK, TH "H0272404"; eLKM "H0171105"; SSM, Dereg, eVOC, JomCheck, Insurance "-". Matches `knowledge/flow-bo-shell.md` line 486 and adds **Dereg = "-"**, which that list does not name.
13. **Recon fees (Ref-Amount sheet, R2-R15).** Columns: "Reconciliation (eAuto Fee only)", "Reconciliation Listing (eAuto Fee + Tax 8%)", "Reconciliation Summary (JPJ Fee)". Rows: STMS 20 / 21.6 / 10; APT 15 / 16.2 / 100; eSTM 35 / 37.8 / 300; SSM 18 / 19.44; Dereg 35 / 37.8; eDereg Pre-Checking 5 / 5.4; BMK 10 / 10.80 / 20; TH 10 / 10.8 / 10; eLKM 2.75 / 2.97 / "Price in e-Sim"; eVOC 10 / 10.8; JomCheck 20 / 21.6; Insurance "Quotation" / "Quotation + Tax 8%"; "Wholesale -STMS" 20 / 21.6 / 10. (APT and eSTM are stored as "14.999999999999998" and "34.99999999999999".) Same values already in `knowledge/business-rules-from-test-scenarios.md` lines 722-724 from EAINT-10168; this TS adds the **Wholesale -STMS** row.
14. **Payment Ref No. shapes seen** (Payment Ref No. column, staging data):
    1. STMS / APT / eSTM: "2608120017000015-WEV8890" (New Transaction, R4).
    2. SSM "SSM260812000004-VX8392" (R7); Dereg "DRG260812000002-VAF8489" (R8); eDereg Pre-Checking "DPC260812000003-ZZ1283" (R9); BMK "BK260812000003-LEO9900" (R10); TH "TH260812000005-WEV8890" (R11); eLKM "LK260812000003-EA4858U" (R12); eVOC "EV260812000003-EA4858U" (R13); JomCheck "JOM260812000003-NH5585" (R14); Insurance "TMI202608120001-EA4858U" (R15) and "CHB202608120001-M1567U" (Regression, R15).

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. Notes say "Payment Ref No. values are placeholders - use actual staging references." (New Transaction, R30 note 2). Teams: "The deploy does not affect eAuto, so QA can test on any staging at any time." (`knowledge/teams-decisions-by-ticket.md` §EAINT-12055 item 1). `knowledge/environments-history.md` line 63 lists a uat4 deploy on 2026-08-17 that includes 12055.
2. **eautocron version:** "So meaning QA will proceed to test using current eautocron version ya" (Teams, 2026-08-14 17:58, Azila, via `knowledge/teams-decisions-by-ticket.md`).
3. **Setup:** a transaction with Payment = OK and JPJ Final Submission = Failed; recon run; resubmit until Approved; recon run again (Special Scenarios, R5 steps 1-4).
4. **Cross-month data needs DB patching:** "Payment/approval dates are patched to simulate the month-end boundary (31 Jul -> 1 Aug)" (New Transaction, R17). Never done — rows are N/A.
5. **Bank statement:** RHB statement re-upload used in Special Scenarios R5 step 5.
6. **Credentials:** none in the sheet.

## 6. Gaps and risks a regression should still cover

1. **Cross-month (SRD §2.2.4 item 2) was never executed.** All 12 rows NEW_RECONLS_TS13-TS24 are "N/A" with blank QA (New Transaction, R17-R28). SRD acceptance: "A payment dated 30 July is matched with a transaction approved on 1 August". **Highest regression risk.**
2. **Pass marked while the remark says the scenario could not run.** EXT_RECONLS_TS01 (STMS Wholesale), TS02 (APT), TS05 (Dereg) are "Pass" next to "record remain mismatch" (Existing Transaction, R4, R5, R8); NEW_RECONLS_TS05 (Dereg) is "Pass" next to "unable to resubmit Dereg Final Submission" (New Transaction, R8). [unconfirmed] These modules' exclusion was likely not proven end to end; the 100% pass rate overstates coverage.
3. **Unequal amounts not covered.** SRD assumption 2 says amounts "offset each other"; no row tests the same Ref No. with a different amount. Charmain's pack records that the build removes such a pair anyway (QA ruling 2026-10-01) — see `knowledge/flow-bo-shell.md` line 517.
4. **Follow-up backend fix EAINT-12215 shipped without QA** ("QA is not required for testing for this fixes", Teams 2026-08-20 16:24, via `knowledge/teams-decisions-by-ticket.md`). Behaviour after that fix is not covered by this TS.
5. **Count-mismatch coverage is thin:** only eSTM and JomCheck (Regression, R17, R18, R20). Note 3 says "Count Mismatch modules (JomCheck, Insurance) are illustrative" but no Insurance row exists.
6. **REG_RECONLS_TS08 and TS10 reuse the same Payment Ref Nos.** ("2608120017000009-M14949T ⏎ EV260812000001-M14949T", Regression, R17 and R20) for opposite cases (eAuto < RHB vs eAuto > RHB). [unconfirmed] One of the two may not have been tested with its own data.
7. **Remark dates do not match the row data.** Remark "bank-only 10/8, system-only 11/8" (New Transaction, R4-R15) vs payment "2026-08-12" and approval "13-Aug-2026" on the same rows. Likely copied template text [unconfirmed].
8. **REG_RECONLS_TS10 eSTM shows Kod Hasil "-"** (Regression, R20) while every other eSTM row shows "H0272423". Either a typo or an untested Kod Hasil case [unconfirmed].
9. **Duplicate / mixed TS IDs** in Regression: "REG_ECONLS_TS01..TS06" and "REG_RECONLS_TS02..TS10" overlap (e.g. REG_RECONLS_TS02 APT at R5 and REG_ECONLS_TS02 eSTM at R6). Cite by row, not ID.
10. **Not covered at all:** Summary tab / JPJ Hasil upload side; export of the listing; Insurance-user role view (EAINT-11887); weekend-payment recon; Software Installation and Biometric Device Purchase (excluded by scope note).
11. **Listing filters** (Payment Date range, Transaction Type) are only implied; no row checks a pair split across the filter's date range [unconfirmed whether the listing hides a pair when only one side is in range].

## Knowledge candidates

1. **Dereg Kod Hasil is "-"** on the Reconciliation Listing. Add to the Kod Hasil list in `knowledge/flow-bo-shell.md` (line 486). Source: New Transaction R8 and Regression R8, Kod Hasil column "-" for Dereg. `[from SharePoint TS #029 EAINT-12055, sheet New Transaction, row 8]`
2. **Some Final Submissions cannot be resubmitted:** "As per checked with dev, unable to resubmit STMS (Wholesale) Final Submission,  record remain mismatch"; same for APT and Dereg. For `knowledge/flow-bo-shell.md` or the recon traps. `[from SharePoint TS #029 EAINT-12055, sheet Existing Transaction, rows 4, 5, 8]`
3. **Cross-month matching was never QA-executed** before the 2026-08-17 deploy (12 N/A rows). Worth flagging next to the EAINT-12055 SRD entry in `knowledge/flow-bo-shell.md`. `[from SharePoint TS #029 EAINT-12055, sheet New Transaction, rows 17-28]`
4. **Manual recon trigger + RHB statement re-upload** exist on the recon module and do not bring back a hidden pair. `[from SharePoint TS #029 EAINT-12055, sheet Special Scenarios, row 5]`
5. **Wholesale -STMS recon amounts:** 20 / 21.6 / 10 (same as STMS). Add to the fee table in `knowledge/business-rules-from-test-scenarios.md` near lines 722-724. `[from SharePoint TS #029 EAINT-12055, sheet Ref-Amount, row 15]`
6. **Payment Ref No. prefixes** per module (SSM, DRG, DPC, BK, TH, LK, EV, JOM, TMI/CHB for Insurance; STMS/APT/eSTM numeric `yymmdd0017…-<vehicle>`). Useful for the automation data-search rule. `[from SharePoint TS #029 EAINT-12055, sheet New Transaction, rows 4-15; sheet Regression, row 15]`
7. **Software Installation and Biometric Device Purchase are outside the recon exclusion scope.** `[from SharePoint TS #029 EAINT-12055, sheet New Transaction, row 30 note 3]`
