# EAINT-8659 — QA Team test script study (2026-10-28)

Study by the SharePoint Scribe (scheduled, unattended). Read only. No knowledge/ or lib/ files changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8659 - [eAuto-eInvoice] To fix the missing document code issue.md` (text copy made 28/10/2026, 10:06:46 am). Cell text only; formatting, colours and images not kept.
2. **Original workbook:** "EAINT-8659 - [eAuto-eInvoice] To fix the missing document code issue.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 13/08/2025, 2:56:04 pm. Not opened directly; the text copy was used.
3. **Miro resource-planning board copy:** `_reference/miro/miro-eauto-qa-resource-planning-full-2026-10-26-part1.md` line 237 and `-part2.md` line 474.
4. **knowledge/:** `business-rules-from-test-scenarios.md` §8 item 3, `cr-test-scenario-catalogue.md` row 076, `flow-company-profile-einvoice.md` (Rules, Ticket history), `flow-bmk.md` lines 46 and 77, `production-regression-scope.md` §11, `README.md`.
5. **lib/:** `lib/eautoFlows/modules/company-profile-einvoice.ts`, `bmk.ts`, `jomcheck.ts` (mirror the knowledge lines). `lib/ticketStudies.ts` has **no entry** for EAINT-8659.
6. **Not available:** `_reference/tickets/EAINT-8659/` did not exist before this study; `_reference/tickets/Studying/EAINT-8659/` does not exist. **No SRD, no Jira ticket text, no Teams messages** were read. Ticket description is therefore known only from the workbook title and Miro card.

## 1. Header

1. **Ticket:** EAINT-8659 — "[eAuto-eInvoice] To fix the missing document code issue" (workbook title).
2. **Module / portal:** e-Invoice across UCD Service Portal modules, **BO** (Finance e-Invoice / Consolidated e-Invoice Listing, Manage Company, Proforma Invoice) and the external **LHDN MyInvois Portal**.
3. **Workbook:** "EAINT-8659 - [eAuto-eInvoice] To fix the missing document code issue.xlsx".
4. **Sheets:** 1 — "Sheet1".
5. **Columns:** "TS No. | Module | Test Objective | Test Steps | Expected Result | QA | Test Result" (Sheet1 R1), plus an **unnamed 8th column** holding Document Codes on some rows.
6. **Scenarios:** **10** (8659_E2E_TS1 – 8659_E2E_TS10, Sheet1 R2–R11). All E2E; no functional sheet.
7. **Results:** **10 PASS, 0 FAIL, 0 not run** (Test Result column, R2–R11).
8. **QA column:** Nick 3 (TS1, TS7, TS9), Charmain 3 (TS2, TS3, TS4), Nabila 4 (TS5, TS6, TS8, TS10).
9. **Dates:** none written in the sheet. Miro card: "To deploy on: 13th Aug Test Env: staging/preprod1 BA: MJ QA: Nick, Charmain, Nabila" (part1 line 237). Miro daily plan: "12th August EAINT-8659 - Nick, Charmain, Nabila" (part2 line 474). Codes "EA-IV-**0825**-…" confirm August 2025 runs.
10. **Prod verification:** `production-regression-scope.md` §11 records "EAINT-8659 | 20250813 | e-Invoice document code | No" — **No = "unable to test"** in prod.

## 2. What the ticket changed, as the TS shows it

1. **Bug fixed:** the **Document Code** (e-Invoice running number) was **skipping numbers** [unconfirmed — inferred from the title "To fix the missing document code issue" and every expected result saying "without any skipping of running number"].
2. **After the fix:** every paid transaction gets the next code in sequence, **whether the LHDN e-Invoice succeeds or fails** (valid, invalid or blank TIN). Failed rows still receive a code (TS2, TS3, TS10 record codes for "LHDN Response = Failed").
3. **No duplicate codes** on resubmission (TS6).
4. **Miro scope (verbatim, part1 line 237):** "Testing Scope: E2E Happy flow & Negative flows (TIN blank / invalid) JomCheck - Duplicate Submission (via simulator) MyInvois Portal - Details, duplication & Document Code check e-Invoice / Consolidated e-Invoice Listing (Finance BO) - Details, duplication & Document Code skip check Regression Testing: eAuto Modules & Proforma E2E".
5. **Miro estimate:** "Base Testing Time: 1 day Buffer (Req Change + Bug Fix + Retest Bug): 0.5 day" (part1 line 237).

## 3. Scenarios

Every scenario also expects: "the column Document Code is displaying values with correct sequence, without any skipping of running number" on the "e-Invoice / Consolidated e-Invoice Listing".

### A. Valid TIN — e-Invoice generated (also checked in MyInvois)

1. **8659_E2E_TS1** — STMS + TH + SSM (Company) happy flow. Expected: "Ensure e-Invoice generated for: - STMS - TH - SSM"; MyInvois codes in sequence "and details matches e-Invoice PDF". PASS. No codes recorded.
2. **8659_E2E_TS4** — APT happy flow (JPJ Notice 5.5 then 6.0, then pay). Expected: "Ensure e-Invoice generated for: - APT". PASS. Codes: "TH: EA-IV-0825-0000260 / STMS: EA-IV-0825-0000261 / APT: EA-IV-0825-0000262".
3. **8659_E2E_TS5** — JomCheck happy flow. Expected: "Ensure e-Invoice generated for: - JomCheck". PASS. Code "EA-IV-0825-0000248".
4. **8659_E2E_TS6** — JomCheck duplicate submission (simulator fail → delay → RESUBMIT → refresh → RESUBMIT). Expected: "Ensure on e-Invoice / Consolidated e-Invoice Listing & MyInvois portal there is only one transaction for the submission done and no duplicated Document Code on listing". PASS. Code "EA-IV-0825-0000251".

### B. Invalid TIN — no e-Invoice, code still in sequence

1. **8659_E2E_TS2** — eSTM + eLKM + eVOC (Individual). Expected: "Ensure NO e-Invoice generated for: - eSTM - eLKM - eVOC". PASS. Codes "eSTM: EA-IV-0825-0000245 / eLKM: EA-IV-0825-0000246 / eVOC: EA-IV-0825-0000247".
2. **8659_E2E_TS7** — Pre e-Invoice SSM (ROB / ROC) on a new company's first profile setup. Expected: "Ensure NO e-Invoice generated for: - SSM (Profile Update)". PASS. No codes recorded.
3. **8659_E2E_TS8** — Proforma Invoice for Others; Finance marks paid, then generates e-Invoice. Expected: "Ensure NO e-Invoice generated for: - Proforma". PASS. Code "EA-IVM-0825-0000008".
4. **8659_E2E_TS10** — BMK. Expected: "Ensure NO e-Invoice generated for: - BMK". PASS. Code "EA-IV-0825-0000256".

### C. Blank TIN — no e-Invoice, code still in sequence

1. **8659_E2E_TS3** — UCD to UCD Interstate (Bulk). Expected: "Ensure NO e-Invoice generated for: - UCD to UCD transactions (STMS)". PASS. Codes "STMS: EA-IV-0825-0000257 / 0000258 / 0000259".
2. **8659_E2E_TS9** — Dereg, including later COD upload. Expected: "Ensure NO e-Invoice generated for: - Deregistration". PASS. No codes recorded.

## 4. Business rules and system behaviour revealed

1. **Failed e-Invoices still consume a Document Code.** TS2 step 4 "LHDN Response = Failed" with codes "eSTM: EA-IV-0825-0000245 ⏎ eLKM: EA-IV-0825-0000246 ⏎ eVOC: EA-IV-0825-0000247" (Sheet1 R3).
2. **One code per transaction type in a bundle.** eSTM, eLKM and eVOC each get their own code (Sheet1 R3); TH, STMS and APT each get one (Sheet1 R5).
3. **Bulk UCD to UCD gives one code per vehicle transaction.** "STMS: EA-IV-0825-0000257 ⏎ STMS: EA-IV-0825-0000258 ⏎ STMS: EA-IV-0825-0000259" (Sheet1 R4).
4. **Proforma uses a separate series.** "EA-IVM-0825-0000008" (Sheet1 R9), versus "EA-IV-0825-…" for all other modules. Its low number (8) suggests its own running counter [unconfirmed].
5. **Code format:** "EA-IV-" + MMYY + "-" + 7 digits, e.g. "EA-IV-0825-0000245" (Sheet1 R3).
6. **Proforma e-Invoice is generated by Finance by hand:** "2. Finance mark as paid, Payment Status = Paid ⏎ 3. Finance generate e-Invoice, e-Invoice Status = Failed" (Sheet1 R9).
7. **APT is auto-created by JPJ notices:** "Manual trigger APT for JPJ Notice 5.5, APT Transaction is auto-created with Transaction Status = New" then "JPJ Notice 6.0, APT Transaction is auto-created with Transaction Status = Pending" (Sheet1 R5, steps 3–4).
8. **JomCheck failed-report state:** "Payment = OK ⏎ - Tx Status = Failed ⏎ - Remarks = \"Failed to retrieve report\"", recovered by "On purchase page, click RESUBMIT" (Sheet1 R7, steps 5–7).
9. **Pre e-Invoice SSM fires on first profile setup:** "Proceed with Agree to Purchase and MVD thumbprint, Transaction Status = Approved, LHDN Response = Failed" (Sheet1 R8, step 4).
10. **Dereg e-Invoice is tied to payment, not COD:** LHDN Response is "Failed" at "COD = No" (step 4), then COD upload follows (Sheet1 R10, steps 4–7).
11. **Blank TIN setup differs by scenario:** TS3 says "Update UCD TIN Number to no value (blank) in BO" (Sheet1 R4), but TS9 says "Request dev to patch UCD TIN Number to no value (blank)" (Sheet1 R10). Whether BO can save a blank TIN is unclear [unconfirmed].
12. **MyInvois check:** codes in sequence "and details matches e-Invoice PDF" (Sheet1 R2, R5, R6).

## 5. Test data, environments, accounts, setup

1. **Environment:** "Test Env: staging/preprod1" (Miro part1 line 237). The sheet itself names no environment.
2. **TIN states set in BO per scenario:** valid (TS1, TS4, TS5, TS6), invalid (TS2, TS7, TS10), blank (TS3, TS9). TS8 sets no TIN step; its objective says "Failed due to Invalid TIN".
3. **New company:** TS7 "Create new Company from BO Manage Company" then "Login as Main UCD of the new company" (Sheet1 R8).
4. **JomCheck simulator:** TS6 "Set in simulator JomCheck submission where Result = Failed" then "Set a delay for JomCheck submission and change Result to Success" (Sheet1 R7).
5. **Dev help:** TS9 needs a dev patch for blank TIN (Sheet1 R10).
6. **Dereg uploads:** "upload Consent & 3 Photos" and "upload Certificate" (Sheet1 R10).
7. **Credentials:** none in the sheet. No vehicle numbers, company names or logins written.

## 6. Gaps and risks a regression should still cover

1. **Codes not recorded** for TS1, TS7, TS9 — sequence for STMS+TH+SSM, Pre e-Invoice SSM and Dereg cannot be re-checked from the sheet.
2. **Visible gaps in recorded codes:** 0000249–0000250 and 0000252–0000255 are not tied to any row. Likely other testers' or other modules' transactions in the shared staging [unconfirmed]; the sheet does not prove "no skipping" across the whole range.
3. **Not covered:** Insurance Cancellation, mobile app transactions, Transfer History alone, eSTM Company, and SSM Company Profile Update for an existing company — all listed as e-Invoice modules in `flow-company-profile-einvoice.md` ("Modules with e-Invoices: STMS, Transfer History, UCD to UCD Interstate, eSTM, eLKM, eVOC, APT, BMK, JomCheck, SSM, Dereg, Insurance Cancellation").
4. **Not covered:** cancelled or failed payment (should a code be issued or not), month rollover (MMYY reset), and concurrent transactions from two users at once — a likely cause of number skips or duplicates [unconfirmed].
5. **Not covered:** the LHDN resubmission cronjob after a TIN fix — does the resubmitted row keep its original code.
6. **Duplicate check covers JomCheck only** (TS6). Other RESUBMIT paths (e.g. STMS, APT failed-resubmit) not tested for duplicate codes.
7. **Not verified in prod:** precedent index marks it "No" ("unable to test").
8. **Sheet inconsistencies:** TS1 module "(Company)" but step 2 "Create STMS Individual Transaction" (Sheet1 R2); TS7 numbers two steps "2." (Sheet1 R8); TS8 has no TIN setup step (Sheet1 R9).

## 7. Relation to existing knowledge

1. **Agrees:** `business-rules-from-test-scenarios.md` §8 item 3 and `flow-company-profile-einvoice.md` Rules ("Document Code runs in sequence with no skipped numbers across all modules, including failed e-Invoices (EAINT-8659)").
2. **Adds to / partly contradicts:** `flow-company-profile-einvoice.md` states "Format EA-IV-MMYY-xxxxxxx". This TS shows **Proforma uses "EA-IVM-"** (Sheet1 R9). The format line does not mention it.
3. **Weak citation:** `flow-bmk.md` line 46 cites "[ts: EAINT-8659]" for "e-Invoice and invoice templates include BMK". The TS only shows BMK with invalid TIN, where "Ensure NO e-Invoice generated for: - BMK" (Sheet1 R11), plus a Document Code. It proves BMK gets a code, not the template contents.
4. **Catalogue row 076** lists module "BackOffice, MyInvois", tester "Nabila Syafiqah Binti Mohd Hanafi", "Sheet1:10", 10 TS — matches this copy.

## Knowledge candidates

1. **Proforma Document Code prefix is "EA-IVM-"**, separate from "EA-IV-" — "EA-IVM-0825-0000008" [from SharePoint TS EAINT-8659, Sheet1 R9]. Target: `flow-company-profile-einvoice.md` Rules format line.
2. **Failed LHDN e-Invoices still receive a Document Code**; one code per transaction type in a bundle and one per vehicle in a bulk UCD to UCD — [from SharePoint TS EAINT-8659, Sheet1 R3, R4, R5]. Target: `business-rules-from-test-scenarios.md` §8.
3. **JomCheck failed-report state:** "Payment = OK ⏎ - Tx Status = Failed ⏎ - Remarks = \"Failed to retrieve report\"", recovered via "RESUBMIT" on the purchase page; a refresh during resubmission must not create a duplicate code — [from SharePoint TS EAINT-8659, Sheet1 R7]. Target: `flow-jomcheck.md`.
4. **APT auto-creation:** JPJ Notice 5.5 → "Transaction Status = New", JPJ Notice 6.0 → "Transaction Status = Pending" — [from SharePoint TS EAINT-8659, Sheet1 R5]. Target: APT flow file, if one exists.
5. **Blank TIN may need a dev patch** — "Request dev to patch UCD TIN Number to no value (blank)" [from SharePoint TS EAINT-8659, Sheet1 R10]; contrasts with R4 "Update … to no value (blank) in BO" [unconfirmed which applies today].
6. **Correct `flow-bmk.md` line 46 citation:** EAINT-8659 shows BMK Document Code sequencing with invalid TIN, not template contents [from SharePoint TS EAINT-8659, Sheet1 R11].
7. **lib/ticketStudies.ts** has no EAINT-8659 entry; add one if the ticket should render at `/jira/studies`.
