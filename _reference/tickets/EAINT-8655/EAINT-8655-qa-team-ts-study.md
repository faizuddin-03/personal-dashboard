# EAINT-8655 — QA Team test script study (2026-10-28)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study; nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8655 & 9043 - [eAuto - eDereg Pre-Checking] To issue e-Invoice and Invoice for successfully paid transaction starting from 1 Nov 2025.md` (captured 28/10/2026, 1:31:28 am). Cell text only. **Colours, images and cell comments were not kept**, so they could not be read.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-8655/EAINT-8655-jira.md` (captured 27/10/2026).
3. **Not read:** the SRD `.docx`/`.pdf` attachments and the Figma link listed in the Jira capture. No local copy exists. Nothing from them is used here.
4. **No EAINT-9043 folder** exists under `_reference/tickets/`. EAINT-9043 is known here only from the Jira "Links" line and the workbook title.
5. **Knowledge checked:** `knowledge/README.md`, `knowledge/flow-edereg.md` §5.7, `knowledge/business-rules-from-test-scenarios.md` lines 584-594, `knowledge/esim.md` lines 587-589, `knowledge/flow-company-profile-einvoice.md`, `knowledge/cr-test-scenario-catalogue.md` (#075), `knowledge/production-regression-scope.md` lines 1039-1040.
6. **`lib/ticketStudies.ts`:** no entry for EAINT-8655 or 9043.

## 1. Header

1. **Ticket:** EAINT-8655, together with EAINT-9043. Jira summary: "🔴🟠[eAuto-Dereg]  To issue eInvoice for successfully paid trx starting from 1 Nov 2025" (Jira capture, line 5). Linked: "EAINT-9043 🟠[eAuto-eDereg] To issue invoice for successfully paid trx starting from 1 Nov 2025" (line 12).
2. **Module / portal:** eDereg Pre-Checking on the **AATF** portal, plus **BO** (Back Office), **eautoaccount** (Consolidated e-Invoice listing, GST/SST Payment Report) and the LHDN **MyInvois Portal**.
3. **Workbook:** "EAINT-8655 & 9043 - [eAuto - eDereg Pre-Checking] To issue e-Invoice and Invoice for successfully paid transaction starting from 1 Nov 2025.xlsx". Library "eAuto - CR Test Scenarios". Modified 20/02/2026, 4:01:46 pm. Catalogue entry #075.
4. **Sheets (4):** "E2E Flow", "Functional Testing (e-Invoice)", "Functional Testing (Invoice)", "MyInvois Portal - UIN".
5. **Scenario count: 83 unique TS ids.**
   1. E2E Flow: **33** (8655_TS1–TS33). TS15–TS33 each take two rows (before / after deployment).
   2. Functional Testing (e-Invoice): **17** PDF field checks (8655_FUNC_EINV_TS1–17) + **15** search & filter (8655_SNF_TS1–15).
   3. Functional Testing (Invoice): **13** PDF field checks (8655_FUNC_INV_TS1–13) + **5** search & filter (8655_SNF_TS16–20).
   4. MyInvois Portal - UIN: a lookup of 7 UINs, not scenarios.
6. **Results recorded:** **73 Pass, 0 Fail, 10 N/A.**
   1. E2E: 24 Pass; N/A = TS16, TS18, TS20, TS25, TS26, TS27, TS28, TS29, TS30.
   2. Functional (e-Invoice): 31 Pass; N/A = 8655_SNF_TS14 (row 41).
   3. Functional (Invoice): 18 Pass.
   4. E2E header row R1 also holds "63" and "88.88888888888889". Their meaning is not labelled. [unconfirmed] It may be a pass percentage worked out by a formula.
7. **Tester:** QA column filled only at E2E R3 and Functional (e-Invoice) R3: "Nabila". Jira "QA (cf 10041): Nabila Hanafi" (Jira capture, line 7).
8. **Dates:** none written in the sheet. Jira: "Fix versions: S22.9-20251029 (2025-10-29)"; developer comment 2025-11-06: "Remarks: This ticket has been deployed on 29 October 2025 (Wednesday)."
9. **QA-Issues raised (Jira sub-tasks, line 13):**
   1. "EAINT-9053 [AATF & BO][eDereg Pre-Checking] e-Invoice PDF - Incorrect 'Classification'".
   2. "EAINT-9056 [AATF & BO][eDereg Pre-Checking] Listing page - To display Remarks for when LHDN Status = Failed and JPJ Pre-Checking = Failed".
   3. "EAINT-9061 [AATF & BO][eDereg Pre-Checking][After Deployment, Before Cutoff] Listing & Details page - LHDN Status should be displayed with dash ( - ) for when Trx Status = Pending".

## 2. What the ticket changed, as the TS shows it

1. **e-Invoice + Invoice issued** for a paid eDereg Pre-Checking transaction, from 1 Nov 2025. Both are PDFs downloaded from the Transaction Details page via **[e-Invoice]** and **[Invoice]** buttons.
2. **New status column on listings:** AATF "e-Invoice Status" and BO "LHDN Response Status". Values seen: **OK, Failed, "-", N/A**.
3. **New e-Invoice section on Details page:** "e-Invoice Submission Date", "LHDN Response Status", "e-Invoice Validation Date", and a **Notation message** for no-e-Invoice cases.
4. **Remarks column** shows the LHDN failure reason (Invalid TIN / Blank TIN).
5. **Two cronjobs:** "LHDN Resubmission Cronjob" (E2E R10) and "Consolidated e-Invoice Cronjob" (E2E R15).
6. **Downstream listings:** BO e-Invoice / Consolidated e-Invoice Listing gains Type "eDereg Pre-Checking"; BO GST / SST Payment Report (eautoaccount) lists new paid eDereg Pre-Checking transactions.
7. **Invoice from EAINT-9043:** the Invoice is shown even when the e-Invoice fails (TS2, TS9, TS11, TS13, TS14).
8. **Classification code:** Jira description, Part 3, row 3: "As confirmed with Marie, change classification code to “022“". The TS does not check the code value. QA-Issue EAINT-9053 was about it.

## 3. Scenarios

### 3a. E2E Flow — New Transactions (rows 3-9)

1. **8655_TS1** (R3) — Valid TIN, `GLB000000I`, paid, Approved. Expected: "AATF: e-Invoice Status = OK"; "BO: LHDN Response Status = OK"; both buttons; Notation NOT displayed; listed in Consolidated listing; available in MyInvois. **Pass**.
2. **8655_TS2** (R4) — Invalid TIN, paid, Approved. Expected: both "Failed"; Remarks "TIN verification failed. Kindly provide correct TIN information to eAuto customer service."; "[e-Invoice] button is NOT displayed"; "[Invoice] button is displayed"; Notation displayed; NOT in MyInvois. **Pass**.
3. **8655_TS3** (R5) — Valid TIN, payment Failed, then BO [Cancel] → Cancelled. Expected: status "-"; "AATF: e-Invoice section is NOT displayed"; no buttons; not in Consolidated listing. **Pass**.
4. **8655_TS4** (R6) — not paid (Pending), BO [Cancel] → Cancelled. Same expected as TS3. **Pass**.
5. **8655_TS5** (R7) — Valid TIN, `VEL000100E`, paid, Trx Failed. Expected: **OK** and both buttons. **Pass**.
6. **8655_TS6** (R8) — `ENF000013E`, "Payment = OK", "Trx Status = Failed", then BO [Cancel] → Cancelled. Expected: **OK** and both buttons. **Pass**.
7. **8655_TS7** (R9) — `VEL000102E`, paid, "JPJ Pre-Checking = Failed". Status "-", no e-Invoice section. Then BO "Resubmit JPJ Final Submission (eDereg Pre-Checking)" → Approved → **OK**, both buttons. **Pass**.

### 3b. E2E Flow — LHDN Resubmission Cronjob (rows 11-14)

1. **8655_TS8** (R11) — Valid TIN, already OK. Verify "transaction didn't picked up by cronjob (to get help from dev)". **Pass**.
2. **8655_TS9** (R12) — Blank TIN → Failed; BO update TIN to **Invalid**; cronjob. Expected: stays **Failed**, remark "TIN verification failed. Kindly provide correct TIN information to eAuto customer service.". **Pass**.
3. **8655_TS10** (R13) — Invalid TIN → Failed; BO update TIN to **Valid**; cronjob. Expected: **OK**, both buttons, in MyInvois. **Pass**.
4. **8655_TS11** (R14) — Failed transaction "created from previous month"; BO update to Valid TIN. Expected: "Verify transaction is NOT picked up by cronjob"; stays Failed; Remarks "No TIN info has been provided.". **Pass**.

### 3c. E2E Flow — Consolidated e-Invoice Cronjob (rows 16-18)

1. **8655_TS12** (R16) — previous-month OK transaction; not picked up; details unchanged. **Pass**.
2. **8655_TS13** (R17) — previous-month Blank TIN Failed; cronjob resubmits "with the General TIN EI00000000010". Expected: "LHDN e-Invoice Status = Failed"; "Consolidated e-Invoice Status = OK"; Remarks "No TIN info has been provided". **Pass**.
3. **8655_TS14** (R18) — same for Invalid TIN. Remarks stay "TIN verification failed. …". **Pass**.

### 3d. E2E Flow — Existing transactions, Phase 1 (rows 20-37, heading R19)

All expect **N/A** on both listings, no buttons, "Notation message is displayed", "BO & AATF: e-Invoice section is NOT displayed", not in Consolidated listing or MyInvois.

1. **8655_TS15** (R20-21) — Pending before deploy, [Resubmit] + pay after → Approved, N/A. **Pass**. Txn "PC50000780".
2. **8655_TS16** (R22-23) — same, Invalid TIN. **N/A** (cronjob-expiry remark, see §4.12). Txn "PC50000762".
3. **8655_TS17** (R24-25) — Failed payment before, paid after → Approved, N/A. **Pass**. Txn "PC50000773".
4. **8655_TS18** (R26-27) — same, Blank TIN. **N/A**. Txn "PC50000770".
5. **8655_TS19** (R28-29) — Failed payment before and after. N/A. **Pass**. Txn "PC50000774".
6. **8655_TS20** (R30-31) — Pending before, payment Failed after. **N/A**. Txn "PC50000763".
7. **8655_TS21** (R32) — Approved and paid before deploy. N/A after. **Pass**. Txn "PC50000764".
8. **8655_TS22** (R33) — `VEL000100E` paid + Failed before deploy. N/A. **Pass**. Txn "PC50000765".
9. **8655_TS23** (R34-35) — `VEL000102E` failed before; BO JPJ resubmit "After Deployment (Phase 2)" → Approved, **N/A**. **Pass**. Txn "PC50000775".
10. **8655_TS24** (R36-37) — same, resubmitted "After Deployment (Phase 3)". Expected **N/A**. **Pass**. Txn "PC50000776".

### 3e. E2E Flow — Existing transactions, Phase 2 (rows 39-60, heading R38)

1. **8655_TS25** (R39-40) — Pending in Phase 2, paid in Phase 3, Valid TIN → expected **OK**. **N/A**. Txn "PC50000781".
2. **8655_TS26** (R41-42) — Blank TIN version → expected **Failed**, "No TIN info has been provided". **N/A**. Txn number blank.
3. **8655_TS27** (R43-44) — Failed payment in Phase 2, paid in Phase 3, Valid TIN → expected **OK**. **N/A**. Txn "PC50000782".
4. **8655_TS28** (R45-46) — Invalid TIN version → expected **Failed**. **N/A**. Txn number blank.
5. **8655_TS29** (R47-48) — Failed payment in Phase 2 and Phase 3 → expected "-". **N/A**. Txn "PC50000783".
6. **8655_TS30** (R49-50) — Pending in Phase 2, failed payment in Phase 3 → expected "-". **N/A**. Txn "PC50000784".
7. **8655_TS31** (R51) — Approved + paid in Phase 2 → **N/A** in Phase 3. **Pass**. Txn "PC50000785".
8. **8655_TS32** (R52) — `VEL000100E` paid + Failed in Phase 2 → **N/A**. **Pass**. Txn "PC50000786".
9. **8655_TS33** (R53-54) — `VEL000102E` failed in Phase 2, JPJ resubmit in Phase 3 → **N/A**. **Pass**. Txn "PC50000787".

### 3f. Functional Testing (e-Invoice) — e-Invoice PDF Buyer Details (rows 3-19)

1. **FUNC_EINV_TS1** — Name with special characters → "AUTOCORE 123 & CAR (M) SDN. BHD. ' < > A". **Pass**.
2. **TS2–TS3** — Registration Number: New Company Reg. No. "198501000222"; if blank, old Company Reg. No. "22278989-L". **Pass**.
3. **TS4–TS5** — TIN 10 characters "C887699010" and 13 characters "IG21421035090". **Pass**.
4. **TS6–TS7** — SST Number 15 characters "A11180831029703"; blank → "n/a". **Pass**.
5. **TS8–TS10** — Contact Number 9 and 11 characters; blank PIC contact → Company Details contact. **Pass**.
6. **TS11–TS12** — Email with special characters; blank PIC email → Director / Owner email. **Pass**.
7. **TS13–TS15** — Vehicle Number spacing: "WU 4444", "WUU 1234 D", "PUTRAJAYA 12". **Pass**.
8. **TS16–TS17** — Mailing Address one line and multi-line kept as typed. **Pass**.

### 3g. Search & filter (rows 24-42, Invoice sheet rows 19-23)

1. **SNF_TS1–TS4** (BO eDereg Pre-Checking Listing) — filter by LHDN Response Status OK / Failed / "-" / N/A. **Pass**.
2. **SNF_TS5–TS9** — multi-filter (Created Date or Payment Date + Trx Status + e-Invoice Status) + Export XLSX. Expected: "'LHDN Response Status' column is displayed after 'Trx Status' and before 'Remarks' column". **Pass**.
3. **SNF_TS10–TS13, TS15** (BO e-Invoice / Consolidated e-Invoice Listing) — Type "eDereg Pre-Checking", LHDN e-Invoice Status, Consolidated e-Invoice Status OK, all filters. **Pass**.
4. **SNF_TS14** — "Consolidated e-Invoice Status = Failed". **N/A** (no reason written).
5. **SNF_TS16–TS20** (BO GST / SST Payment Report, eautoaccount) — existing paid transactions not listed; new paid listed; new Failed and Pending not listed; all filters + export. **Pass**.

### 3h. Functional Testing (Invoice) — Invoice PDF (rows 2-14)

1. **FUNC_INV_TS1–TS13** — same field checks as 3f, **minus TIN and SST** (Name, Reg. No., Contact, Email, Vehicle No., Address). All **Pass**.

## 4. Business rules and system behaviour

1. **Invalid TIN remark:** "TIN verification failed. Kindly provide correct TIN information to eAuto customer service." (E2E R4, R12, R18, R45-46).
2. **Blank TIN remark:** "No TIN info has been provided" (E2E R17, R41-42). R14 has a trailing full stop: "No TIN info has been provided.".
3. **Notation message** (when no e-Invoice): "e-Invoices are only available for customers with a valid TIN. ⏎ e-Invoices can only be issued for transactions within the current calendar month." (E2E R4 and others).
4. **Date format:** "e-Invoice Submission Date & e-Invoice Validation Date is displayed with correct format ⏎ dd-mm-yyyy hh:mm/am/pm" (E2E R3). Failed case: "displayed with dash ( - )" (E2E R4).
5. **e-Invoice is about payment, not JPJ result.** Paid but JPJ-failed `VEL000100E` → "AATF : e-Invoice Status = OK" (E2E R7, TS5). Paid then cancelled in BO → OK (E2E R8, TS6).
6. **Exception — final submission failed:** `VEL000102E` paid but "JPJ Pre-Checking = Failed" → "AATF : e-Invoice Status =  - " and "e-Invoice section is NOT displayed" until BO resubmit gives Approved (E2E R9, TS7). [unconfirmed] Why this differs from TS5 is not explained in the sheet.
7. **Not paid / payment failed → "-":** TS3 and TS4 (R5-R6). AATF hides the e-Invoice section; BO shows it with dashes: "BO: e-Invoice Submission Date & e-Invoice Validation Date is displayed with dash ( - )" (R5).
8. **Pre-cutoff transactions → "N/A"**, even when completed after deployment (Phase 1 and Phase 2 rows, R20-R37, R51-R60).
9. **LHDN Resubmission Cronjob, current month only:**
   1. Invalid → Valid TIN → becomes OK (R13, TS10).
   2. Blank → Invalid TIN → stays Failed (R12, TS9).
   3. Previous month: "Verify transaction is NOT picked up by cronjob" (R14, TS11).
   4. Already-OK rows are not picked up (R11, TS8).
10. **Consolidated e-Invoice Cronjob, previous month:** Failed rows are "resubmitted with the General TIN EI00000000010" (R17-R18). The row keeps "LHDN e-Invoice Status = Failed" but shows "Consolidated e-Invoice Status = OK" and "Consolidated e-Invoice Submission Date = dd-mm-yyyy hh:mm am/pm". This happens **even after the TIN was corrected to valid** (R17 step 2: "BO > Update TIN to Valid TIN").
11. **e-Invoice PDF buyer fallbacks:** blank SST → "SST Registration Number should display as:  n/a" (e-Invoice sheet R9). Blank PIC contact → "Contact Number should display value from Company Details > Contact Number *" (R12). Blank PIC email → "Email should display value from Director / Owner Details > Email Address*" (R14). Same fallbacks on the Invoice PDF (Invoice sheet R7, R9).
12. **Pending expiry:** "Cronjob will run on a daily basis and transaction with Pending status today will become Expired on the next day. Hence, this TS is unable to be executed as it is not valid in Production" (E2E R23, R27, R31, R40, R42). This matches the expiry rule already in `knowledge/flow-edereg.md` line 279.
13. **GST / SST Payment Report:** "Existing transactions with Payment = OK are not listed in the listing"; "New transactions with Payment = OK are listed in the listing" (Invoice sheet R19-R20).
14. **TIN for successful e-Invoice:** "Note: To use real valid TIN Number to allow successful generation of eInvoice" (e-Invoice sheet R6-R7).
15. **Pre-deploy listing:** before deployment the columns do not exist: "AATF : e-Invoice Status column is NOT displayed" (E2E R34, R36).

## 5. Test data, environments, accounts, setup

1. **eSIM vehicle numbers:**
   1. `GLB000000I` — approved (R3).
   2. `VEL000100E` — paid, Trx Failed (R7).
   3. `ENF000013E` — "Payment = OK", "Trx Status = Failed", then cancelled by hand in BO (R8).
   4. `VEL000102E` — "JPJ Pre-Checking = Failed" (R9).
2. **Payment failure** used `GLB000000I` (R5, R24). [unconfirmed] The fail is driven by the payment step, not the vehicle code.
3. **General TIN:** "EI00000000010" (R17-R18).
4. **Sample TINs:** "C887699010", "IG21421035090" (e-Invoice sheet R6-R7). They are marked as real valid TINs.
5. **Transaction numbers (phase tests):** PC50000762–PC50000787 (E2E column 8).
6. **MyInvois UINs:** 7 recorded on sheet "MyInvois Portal - UIN" (e.g. TS1 "ZZQBN5EJEEWGXKR7GZ58V98K10").
7. **Environment:** not named in the sheet. The N/A remark says "not valid in Production". [unconfirmed] The phase tests (TS15–TS33) look like they ran on Production across the 29 Oct 2025 deployment.
8. **Phases:** R19 heading "Existing Transactions (Before Deployment & Before Cutoff Date) - Phase 1". R38 heading "Existing Transactions (After Deployment & After Cutoff Date) - Phase 2". "Phase 3" is used from TS24 onward but never defined. [unconfirmed] Likely Phase 1 = before 29 Oct deploy; Phase 2 = 29–31 Oct; Phase 3 = from 1 Nov cutoff. This conflicts with the R38 heading wording.
9. **Accounts / credentials:** none in the sheet.

## 6. Gaps and risks for regression

1. **Phase 2 → Phase 3 not run:** TS25–TS30 are all **N/A**. The "paid after cutoff for an older transaction → e-Invoice issued" rule has no Pass result.
2. **TS24 conflicts with itself:** title says "After Deployment (Phase 3) … LHDN Status = OK" but steps and expected say "N/A" (R36-R37). Marked Pass against N/A. The rule for JPJ resubmit after cutoff is unclear.
3. **TS26 / TS28 conflict:** step 6 says "e-Invoice Submission Date = dd-mm-yyyy hh:mm/am/pm" but expected says "displayed with dash ( - )" (R42, R46).
4. **Notation message unclear for "-" rows:** TS3 says "Notation message is NOT displayed" (R5); TS29/TS30 say "Notation message is displayed" (R47-R50). Same state, different expectation.
5. **TS7 data unclear:** resubmit step uses "(GLB000000I)" for a `VEL000102E` transaction (R9 step 9). [unconfirmed] The eSIM code was likely switched before resubmit.
6. **Cronjob checks rely on dev help:** "to get help from dev" (R11, R16). The cronjob runs on a fixed interval and cannot be triggered by QA.
7. **Consolidated Failed not tested:** SNF_TS14 **N/A** (e-Invoice sheet R41).
8. **Amount accuracy** only says "ensure details and pricing amount are accurate". No amounts are written. Classification "022" is not checked in any row.
9. **Mobile app:** SRD table marks e-Invoice template and issuance "mobile app ✅" (Jira description, Part 2). No TS covers mobile.
10. **Regression must cover:** Valid / Invalid / Blank TIN; paid-but-JPJ-failed (`VEL000100E`); final-submission failed + BO resubmit (`VEL000102E`); cancel-after-paid; both cronjobs; GST/SST report inclusion.

## Knowledge candidates

1. **Correct `knowledge/esim.md` line 588 and `flow-edereg.md` §5.7 item 5:** `ENF000013E` is not "cancelled". The TS shows "Payment = OK ⏎    - Trx Status = Failed", then a BO [Cancel] by hand. Source: E2E Flow, R8 (8655_TS6).
2. **Refine `flow-edereg.md` §5.7 item 3 and `business-rules-from-test-scenarios.md` line 588:** "Cancelled" alone does not give "-". Cancelled **after a successful payment** gives "AATF : e-Invoice Status =  OK". Source: E2E Flow, R8.
3. **Refine §5.7 item 4 (cronjob):** the LHDN Resubmission Cronjob covers current-month rows only. Blank → Invalid stays Failed (R12). Previous month: "Verify transaction is NOT picked up by cronjob" (R14). Source: E2E Flow, R12-R14.
4. **New — Consolidated e-Invoice cronjob:** previous-month Failed rows are "resubmitted with the General TIN EI00000000010"; the row then shows "LHDN e-Invoice Status = Failed" and "Consolidated e-Invoice Status = OK". Source: E2E Flow, R17-R18.
5. **New — Blank TIN remark:** "No TIN info has been provided" (E2E R17, R41). Notation text: "e-Invoices are only available for customers with a valid TIN. ⏎ e-Invoices can only be issued for transactions within the current calendar month." (E2E R4).
6. **New — four status values:** OK / Failed / "-" (new, not paid or final submission failed) / N/A (before cutoff). Source: E2E R3-R9, R20; SNF_TS1–TS4 (e-Invoice sheet R24-R27).
7. **New — paid-but-JPJ-failed gets e-Invoice:** `VEL000100E` paid + Trx Failed → OK and both buttons. Source: E2E R7 (TS5). Contrast `VEL000102E` → "-" until BO resubmit (R9).
8. **New — BO listing export column order:** "'LHDN Response Status' column is displayed after 'Trx Status' and before 'Remarks' column". Source: e-Invoice sheet R28-R32.
9. **New — GST / SST Payment Report** lists only new paid eDereg Pre-Checking transactions. Source: Invoice sheet R19-R22.
10. **New — QA-Issue history** for the module (EAINT-9053 Classification, EAINT-9056 Remarks when JPJ failed, EAINT-9061 dash for Pending). Source: Jira capture line 13. Classification code "022": Jira description Part 3, row 3.
11. **Fix citation in `flow-edereg.md` §5.7:** item 4 cites "rows 12-13" for "picks up the failed rows after the TIN is corrected". Row 12 (TS9) actually stays Failed; only row 13 (TS10) becomes OK.
