# EAINT-12412 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-12412 - [eAuto-UCD & BackOffice] JomCheck - Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge.md` (text copy taken 27/10/2026, 7:54:46 pm; cell text only, no formatting or images).
2. **Jira capture:** `_reference/tickets/Studying/EAINT-12412/EAINT-12412-jira.md` (27/10/2026, 7:00:33 pm).
3. **Ticket notes:** `_reference/tickets/EAINT-12412/NOTES.md`.
4. **Ticket study:** `lib/ticketStudies.ts` entry `EAINT-12412` (studied 2026-10-15).
5. **Knowledge:** `knowledge/README.md`, `knowledge/flow-jomcheck.md` §9h, grep of `knowledge/` for "12412" (cr-ledger, test-scripts, flow-company-profile-einvoice, flow-estm).
6. **Not read:** the `.xlsx` itself (text copy used instead, so colours, dropdowns and images are not seen); SRD `.docx` versions (not in the repo); `_reference/tickets/EAINT-12412/12412_TS07 Tally Checker/` PDFs and PNGs (listed only, not opened).

## 1. Header

1. **Ticket:** EAINT-12412, "🔴[eAuto-UCD & BackOffice] JomCheck: Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge" (Jira Summary).
2. **Jira state (27/10/2026):** "**Status:** Done", "**Fix versions:** S34.13-20261021 🌞 (2026-10-21)", "**QA (cf 10041):** Muhammad Faizuddin Bin Bidi", sub-task "EAINT-12554 [eAuto - BO] JomCheck Invoice still shows 1 line after resubmitting an old failed transaction" (Jira capture items 2, 4, 3, 9).
3. **Module / portal:** JomCheck — Invoice and e-Invoice, on **UCD** and **BackOffice**, plus the **LHDN MyInvois** submission. Jira "Affected Portal | UCD & BackOffice", "Affected Module | JomCheck – Invoice & e-Invoice" (Description, General Information rows 1–2).
4. **Workbook:** "EAINT-12412 - [eAuto-UCD & BackOffice] JomCheck - Split Invoice & e-Invoice Charge into JomCheck Service Charge and eAuto Service Charge.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 20/10/2026, 3:26:30 pm.
5. **Sheets:** 1 — "Test Scenarios".
6. **Columns (R2):** "TS No. | Test Objective | Test Steps | Expected Result | QA | Test Result | Remarks".
7. **Scenarios:** **12** (12412_TS01 – 12412_TS12) in **5 sections** (A–E).
8. **Results:** **10 Pass** (TS01–TS08, TS10, TS11), **2 Not Started** (TS09, TS12), **0 Fail**.
9. **Tester:** "Faiz" on every row (column QA). This is **Faizuddin's own workbook**, uploaded to the QA Team library. No test dates written in the sheet.

## 2. What the ticket changed, as the TS shows it

1. **One invoice line becomes two.** New JomCheck transactions show Line 1 "JomCheck report" "RM18.00 + RM1.44 = RM19.44" and Line 2 "JomCheck service charge" "RM2.00 + RM0.16 = RM2.16" (R5, TS02 expected 1–2).
2. **Total does not change:** "Total Payable Amount RM21.60" (R5, TS02 expected 3).
3. **Same split on the e-Invoice and on LHDN MyInvois**, classification "022" on both lines (R9 TS05 expected 3; R12 TS07 expected 1–3).
4. **Old approved transactions keep 1 line:** "1 line "JomCheck service charge" RM20.00 + RM1.60 = RM21.60" (R14, TS08 expected 1).
5. **Finance reports unchanged:** still one row per transaction, RM21.60 (R17, TS10); SST Payment Report still EAUTO 6.00 / ezAUTO Asia 14.00 (R10, TS06).
6. **Jira title is stale.** The title says "JomCheck Service Charge and eAuto Service Charge"; the TS and the re-uploaded SRD use "JomCheck report" and "JomCheck service charge" (NOTES.md "Update 2026-10-15" item 2).

## 3. Scenarios

### A. UCD — JomCheck invoice & e-Invoice

1. **12412_TS01** — new UCD JomCheck shows the fee in 2 lines on invoice and e-Invoice. Expected: **cell holds the test steps, not an expected result** (R4 Expected Result = "1. Login to eAuto as UCD ⏎ 2. Create new JomCheck transaction ⏎ … 7. Click [e-Invoice]"). Result **Pass**.
2. **12412_TS02** — new Wholesale chatbot JomCheck (buyer's UCD downloads). Expected: 2 lines, "Total Payable Amount RM21.60", "e-Invoice -> Same 2 lines and Total Payable Amount as the Invoice" (R5). **Pass**.
3. **12412_TS03** — UCD with **invalid TIN**. Expected: 2 lines, RM21.60, "e-Invoice -> Not generated" (R6). **Pass**.
4. **12412_TS04** — paid, then **Failed** (eSim Report Result = "Failed"). Expected: "Invoice -> 2 lines, "JomCheck report" and "JomCheck service charge", total RM21.60" (R7). **Pass**.

### B. BackOffice — invoice, e-Invoice & SST report

5. **12412_TS05** — BO invoice / e-Invoice of the TS01 transaction. Expected: "Identical line items and totals to the UCD Invoice from TS01", "Classification "022" on both lines" (R9). **Pass**.
6. **12412_TS06** — SST Payment Report (JomCheck), Finance login. Expected: "Amount (RM) 20.00", "Total Service Tax Amount (RM) 1.60", "Total Amount (RM) 21.60", "EAUTO (RM) 6.00", "SST (8%) 0.48", "ezAUTO Asia RM14.00", Grand Total includes the row (R10). **Pass**.

### C. LHDN — MyInvois

7. **12412_TS07** — MyInvois sandbox copy of the TS01 e-Invoice. Expected: "2 line items", "Total payable RM21.60", "Classification "022" on both lines" (R12). **Pass**.

### D. Existing transactions — approval date cut-off

8. **12412_TS08** — transaction approved **before** the push. Expected: 1 line RM21.60 on Invoice and e-Invoice, BO = UCD, "MyInvois -> Same UIN and Submission Date as the existing e-Invoice" (R14). **Pass**.
9. **12412_TS09** — old **Failed** transaction resubmitted from BO (HubAdmin, Jomcheck Transaction Enquiry). Expected: "Tx Status "Approved"", "Action shows [View] only", 2 lines on Invoice and e-Invoice, MyInvois "2 line items, total RM21.60" (R15). **Not Started**, Remarks "Deprio - Ops wont resubmit", extra cell "https://mfservices.atlassian.net/browse/EAINT-12554?… Raised to dev ady" (R15).

### E. Regression — e-Invoice listing & payment documents

10. **12412_TS10** — BO e-Invoice / Consolidated e-Invoice Listing and UCD Payment Breakdown Report. Expected: "1 row, Total Including Tax (RM) 21.60"; "1 row, total RM21.60" (R17). **Pass**.
11. **12412_TS11** — UCD Report > Download Payment Document zip. Expected: Invoice PDF and e-Invoice PDF in the zip, both 2 lines (R18). **Pass**.
12. **12412_TS12** — other products (eSTM, Insurance) keep their layout. Expected: "Invoice and e-Invoice -> Same line items as before this CR was pushed to staging" (R19). **Not Started**.

## 4. Business rules and system behaviour the TS reveals

1. **Split amounts:** "Line 1 "JomCheck report" RM18.00 + RM1.44 = RM19.44" and "Line 2 "JomCheck service charge" RM2.00 + RM0.16 = RM2.16" (Test Scenarios, R5/R6/R15/R18).
2. **Invalid TIN = no e-Invoice:** "e-Invoice -> Not generated" (Test Scenarios, R6, TS03). Invoice still splits.
3. **Paid-then-Failed still issues a split Invoice:** "Go to JomCheck Details page of the transaction with Payment "OK" and Tx Status "Failed"" → "Invoice -> 2 lines" (Test Scenarios, R7, TS04). No e-Invoice expected in the row.
4. **The [e-Invoice] button appears later than [Invoice]:** "Wait until [e-Invoice] is shown" (Test Scenarios, R4/R5/R9/R15).
5. **Cut-off rule:** old transactions are those "approved before this CR was pushed to staging" (R14, TS08). Old **Failed** ones that are resubmitted are expected to get 2 lines (R15, TS09).
6. **Resubmit shows only for Failed; after Approved the row has "Action shows [View] only"** (Test Scenarios, R15, TS09 expected 2).
7. **Old e-Invoices are not resubmitted to LHDN:** "MyInvois -> Same UIN and Submission Date as the existing e-Invoice" (Test Scenarios, R14, TS08).
8. **Revenue split is unchanged** in the SST Payment Report: "EAUTO (RM) 6.00", "SST (8%) 0.48", "ezAUTO Asia RM14.00" (Test Scenarios, R10, TS06). So the invoice (18 + 2) does **not** match the report split (6 + 14) — by design per BA answer Q1 (NOTES.md, dev analysis table).
9. **Finance reports stay per transaction, not per line:** "1 row, Total Including Tax (RM) 21.60" (R17, TS10).
10. **Download Payment Document only for an ended week:** "Click [Download] on the week of the TS01 transaction, after that week has ended" (Test Scenarios, R18, TS11 step 5).
11. **Classification code:** "Classification "022" on both lines" (R9 TS05, R12 TS07).
12. **Ops will not resubmit old failed JomChecks in practice:** "Deprio - Ops wont resubmit" (Test Scenarios, R15, Remarks). The defect found there was raised as EAINT-12554 (R15 extra cell). Per `flow-jomcheck.md` §9h item 7, on resubmit the e-Invoice became 2 lines but the Invoice stayed 1 line.

## 5. Test data, environments, accounts, setup

1. **Logins named:** UCD; UCD with an invalid TIN; Wholesale chatbot "as served dealer" and buyer; BackOffice; BackOffice "as Finance"; BackOffice "as HubAdmin"; MyInvois sandbox. **No credentials in the sheet.**
2. **eSim:** "set Report Result = "Failed" for the vehicle no. prefix" (R7, TS04).
3. **Anchor record:** TS05, TS06, TS07, TS10, TS11 all reuse "the TS01 transaction".
4. **Pre-push data:** TS08 and TS09 need transactions created/approved "before this CR was pushed to staging" (R14, R15).
5. **Environment:** not written in the sheet. Per `flow-jomcheck.md` §9h item 1: "12412 is on `uat1`, not on `/eauto`." `[verified: live run, 2026-10-19]`.
6. **No vehicle numbers, transaction numbers or dates** recorded in the sheet.

## 6. Gaps and risks for regression

1. **TS01 has no expected result.** R4 Expected Result is a copy of the steps. The Pass carries no written check. Fix the cell (copy TS02's expected 1–4).
2. **TS04 objective is stale.** R7 still reads "ends Failed or Cancelled". NOTES.md says the objective was changed to "…that ends Failed…" on 2026-10-19, and `flow-jomcheck.md` §9h item 12 says a JomCheck is never Cancelled. The SharePoint copy (modified 20/10) does not carry that edit.
3. **TS12 not split for Insurance.** R19 step 3 is "Download the Invoice and e-Invoice of each". Insurance has no e-Invoice (`flow-jomcheck.md` §9h item 14). NOTES.md says step 3 was split into eSTM Invoice + e-Invoice and Insurance Invoice / Receipt; the SharePoint copy does not show this.
4. **TS12 Not Started.** Shared invoice builder for eSTM / Insurance not confirmed after deploy. NOTES.md run status: "TS12 eSTM — purchase + Invoice pass, e-Invoice not generated (UCD account TIN not updated)". Production regression should check one eSTM Invoice + e-Invoice.
5. **TS09 / EAINT-12554 open risk.** Old Failed transaction resubmitted → Invoice 1 line, e-Invoice 2 lines (`flow-jomcheck.md` §9h item 7). Deprioritised, not fixed per the sheet. Invoice and e-Invoice for the same transaction can disagree [unconfirmed whether fixed before prod].
6. **Created-before, paid-before, approved-after (Pending at push)** is not a separate row. Only Failed → Resubmit covers it. SRD REQ-001 Example 3 (ticketStudies entry) expects 2 lines.
7. **Cancel Invoice (SST Payment Report reversal row)** on a 2-line invoice is not tested. Reversal amounts vs 2 lines [unconfirmed].
8. **TS02 Wholesale buyer's own e-Invoice split** listed as "open" in NOTES.md (TS v2, "Not added").
9. **Excel export** of Payment Breakdown Report (`#to-export`) not covered; only the PDF row (R17).

## 7. Notes against existing knowledge

1. **`knowledge/cr-ledger.md` line 881 is stale:** "TS / evidence: no workbook in the repo yet". The workbook is in `_reference/tickets/EAINT-12412/` and on SharePoint.
2. **`lib/ticketStudies.ts` EAINT-12412 is stale:** "status: "Ready For Development (2026-10-15; QA field empty, no comments)"" and "fixVersion: "S34.X-20261020/21 TBC"". Jira now: Done, S34.13-20261021, QA = Muhammad Faizuddin Bin Bidi.
3. **`lib/ticketStudies.ts` openItems** still say MyInvois login and Wholesale env are unknown; the sheet shows TS02 and TS07 **Pass**, so both were reachable.
4. **`flow-jomcheck.md` line 108** table row still reads "Ready For Development in Jira on 2026-10-15".
5. TS numbers in the SharePoint copy match the renumbered order in NOTES.md ("TS renumbered ascending — 2026-10-19").

## Knowledge candidates

1. **EAINT-12412 final result:** 10 Pass, 2 Not Started (TS09 deprio, TS12), 0 Fail; Jira Done, fix version S34.13-20261021. Source: SharePoint workbook text copy, Test Scenarios R4–R19; Jira capture 27/10/2026 items 2, 4. Target: `knowledge/cr-ledger.md` EAINT-12412 entry (replace "no workbook in the repo yet").
2. **Ops do not resubmit old failed JomCheck transactions** — "Deprio - Ops wont resubmit" (Test Scenarios, R15, Remarks). Target: `knowledge/flow-jomcheck.md` §9g/§9h, next to the Resubmit notes.
3. **EAINT-12554** is the sub-task for "JomCheck Invoice still shows 1 line after resubmitting an old failed transaction" (Jira capture item 9); still an open risk for prod. Target: `knowledge/flow-jomcheck.md` §9h item 7.
4. **Wholesale chatbot JomCheck and MyInvois sandbox were both usable on the 12412 env** (TS02, TS07 Pass, R5, R12). Target: close the two openItems in `lib/ticketStudies.ts` [unconfirmed which env/login was used — not in the sheet].
5. **SharePoint copy lags the local master** for TS04 objective ("Failed or Cancelled") and TS12 step 3 (no Insurance split). Source: Test Scenarios R7, R19 vs NOTES.md 2026-10-19 updates. Action: re-upload the corrected workbook and fix TS01's empty expected result (R4).
