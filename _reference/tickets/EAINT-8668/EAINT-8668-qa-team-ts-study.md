# EAINT-8668 — QA Team test script study (2026-10-27)

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8668 - [eAuto - BackOffice] To have a new cronjob to resubmit Failed APT transactions.md` (captured 27/10/2026, 7:00:47 pm). Cell text only — **cell colours are not kept**, so the colour legend (criteria fulfilled / not fulfilled) cannot be checked per cell.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-8668/EAINT-8668-jira.md`.
3. **Knowledge:** `knowledge/flow-apt.md`, `knowledge/flow-payments-fees.md`, `knowledge/business-rules-from-test-scenarios.md`, `knowledge/cr-test-scenario-catalogue.md`, `knowledge/flow-stms.md` (grep hits for EAINT-8668).
4. **Not read:** the SRD (`SRD_EAINT-8668_..._20250818_1.0.docx` / `.pdf`). It is listed as a Jira attachment but no copy exists in the repo.
5. **`lib/ticketStudies.ts`:** no entry for EAINT-8668.
6. **`_reference/tickets/EAINT-8668/`:** did not exist before this study.

## 1. Header

1. **Ticket:** EAINT-8668 — "🔴 [eAuto - BackOffice] To have a new cronjob to resubmit Failed APT transactions" (Jira Summary). Status **Done**, Fix version "S20.3-20250826 (2025-08-26)".
2. **Deployed:** "This ticket has been deployed to Production on 26.08.2025 (Tuesday)." (Jira comment, a QA lead, 2025-08-27).
3. **Module / portal:** **APT** (Auto Pay Transaction after STMS) — cronjob in **BackOffice**; checks on **UCD** details page and **BO RHB Payment Transaction** listing.
4. **Workbook:** "EAINT-8668 - [eAuto - BackOffice] To have a new cronjob to resubmit Failed APT transactions.xlsx", library "eAuto - CR Test Scenarios", modified 08/09/2026, 5:08:58 pm.
5. **Sheets:** one — **Scenario Test**.
6. **Scenarios:** **19 TS ids** (8668_APT_TS1 – TS19) on **21 rows** (TS2 and TS10 are split into "First day" / "Second day" rows).
7. **Results:** **21 / 21 rows PASS**, 0 fail (Scenario Test, column "Test Result", R12–R32).
8. **Tester:** "Nick" in column "QA" on every row (R12–R32). Jira QA field: Nicholas Lim. No test dates written in the sheet.
9. **Environment:** "Test environment: staging/" (Scenario Test, R3).

## 2. What the ticket changed (as the TS shows it)

1. **New cronjob** that re-pays and re-submits failed APT transactions: "Test objective: To have a new cronjob to resubmit Failed APT transactions" (Scenario Test, R5).
2. **Schedule:** "Prod: 8.00 PM everyday (only once per day)" (R4); "Staging: Every 10 minutes" (R5).
3. **Pickup rule:** "Cronjob trigger when ALL criteria fulfilled" (R7); "Any criteria NOT fulfilled, will not run cronjob" (R8).
4. **Five criteria columns** (R11): "Payment (for Failed, can be due to any RHB code; M & M)", "Tx Status", "RHB Status", "Company Status", "eSTM Enquiry (Only triggered if satisfy all the 4 statuses on the left)".
5. **On success:** Payment = OK, Tx Status = Approved, [e-Invoice] and [Slip Pengesahan] downloadable, row appears in **BO RHB Payment Transaction** listing (R12).

## 3. Scenarios

Criteria shown as Payment / Tx / RHB / Company / eSTM code.

### A. Picked up — resubmit succeeds

1. **8668_APT_TS1** — Failed / Failed / Active / Activated / VEL000392E; payment set to OK in simulator before cronjob. Expected: "cronjob successfully resubmit APT payment & perform final submission: • Payment = OK • Tx Status = Approved" + [e-Invoice], [Slip Pengesahan] + "displayed in RHB Payment Transaction listing on Backoffice" (R12). PASS.
2. **8668_APT_TS9** — – / Pending / Active / Activated / VEL000392E; no payment made. Expected: same success result as TS1 (R21). PASS.
3. **8668_APT_TS19** — "Regression Happy Flow": manual resubmit "On UCD, resubmit APT from APT Transaction Listing and continue until Tx Status = Approved & e-Invoice Status = OK" (R32). Expected: success result. PASS.

### B. Two-day cases (fail again, then succeed)

1. **8668_APT_TS2 day 1** — Failed / Failed / Active / Activated / VEL000392E; "Remain Payment = Failed in simulator". Expected: "cronjob resubmit APT payment but failed payment: • Payment = Failed • Tx Status = Failed" and buttons hidden (R13). PASS.
2. **8668_APT_TS2 day 2** — "Change Payment = OK in simulator". Expected: success result (R14). PASS.
3. **8668_APT_TS10 day 1** — – / Pending / Active / Activated / VEL000392E; "In simulator, set Payment = Failed & let cronjob run and submit". Expected: "cronjob DO NOT resubmit APT payment & no final submission: • Payment = Failed • Tx Status = Failed" (R22). PASS.
4. **8668_APT_TS10 day 2** — "Change Payment = OK". Expected: success result (R23). PASS.

### C. Not picked up — one criterion fails

1. **8668_APT_TS3** — **OK** / Failed (final submission failed). Expected: "cronjob DO NOT resubmit … • Payment = OK • Tx Status = Failed"; buttons hidden "/ [Invoice] button displayed for transactions before e-Invoice deployment" (R15). PASS.
2. **8668_APT_TS4** — Failed / Failed / **Inactive** RHB. Not resubmitted (R16). PASS.
3. **8668_APT_TS5** — Failed / Failed / Active / **Inactivated** company. Not resubmitted (R17). PASS.
4. **8668_APT_TS6** — Failed / Failed, eSTM **GLB000000I** (no error). Not resubmitted (R18). PASS.
5. **8668_APT_TS7** — Failed / Failed, eSTM **VEL000006E** "(!= VEL000392E)". Not resubmitted (R19). PASS.
6. **8668_APT_TS8** — **OK / OK** (already approved). Expected: "cronjob DO NOT resubmit APT payment & final submission: • Payment = OK • Tx Status = Approved" (R20). PASS.
7. **8668_APT_TS11** — – / Pending / **Inactive** RHB. Expected "Payment = - • Tx Status = Pending" (R24). PASS.
8. **8668_APT_TS12** — – / Pending / Active / **Inactivated**. Stays Pending (R25). PASS.
9. **8668_APT_TS13** — – / Pending, eSTM **GLB000000I**. Stays Pending (R26). PASS.
10. **8668_APT_TS14** — – / Pending, eSTM **VEL000396E**. Stays Pending (R27). PASS.
11. **8668_APT_TS15** — – / **New** (only Notice 5.5 triggered), VEL000392E. Expected "Payment = - • Tx Status = New" (R28). PASS.
12. **8668_APT_TS16** — – / **New**, eSTM **VEL000372E**. Stays New (R29). PASS.
13. **8668_APT_TS17** — Failed / Failed, RHB checkbox **ticked but field blank**. Not resubmitted (R30). PASS.
14. **8668_APT_TS18** — – / Pending, RHB checkbox **ticked but field blank**. Stays Pending (R31). PASS.

## 4. Business rules and system behaviour

1. **Two pickup states, not one.** Payment Failed + Tx Failed (TS1, R12) **and** Payment "–" + Tx Pending (TS9, R21) are both resubmitted when all other criteria hold.
2. **Payment OK + Tx Failed is never re-paid.** "cronjob DO NOT resubmit APT payment & no final submission: • Payment = OK • Tx Status = Failed" (R15).
3. **Tx New is not picked up** (TS15, R28; TS16, R29).
4. **eSTM code must be VEL000392E.** GLB000000I (R18, R26) and other VEL codes (R19, R27, R29) block pickup. Q&A: "No 'none' case as for success is GLB0000000I" (R40, cell 4, a BA).
5. **eSTM enquiry runs last.** "Only triggered if satisfy all the 4 statuses on the left" (R11).
6. **Either RHB or Company failing is enough to block.** "dev: either one fail will do, no need to check both fail" (R40, cell 3).
7. **Any RHB failure code counts.** "Dev: do not check fail payment due to which code" (R40, cell 7); header "for Failed, can be due to any RHB code" (R11).
8. **RHB ticked but blank.** "dev: if account number ticked but no value, current logic will not pick up transaction" (R40, cell 1). Then: "Update: BA requested dev to add handling, error message displayed on listing will be based on error from backend" (R40, cell 1).
9. **No XML log for the cronjob's eSTM enquiry.** "dev mentioned the eSTM enquiry that will be used, will not log in any XML, and this enquiry is also an existing function. currently if hit error for this enquiry, will only show in server log. meaning on XML will not see this enquiry for the cronjob" (R40, cell 2).
10. **Dealer ID** "> dev: not related / no impact" (R40, cell 1).
11. **Staging stands in for next day.** "On staging, subsequent cronjob can be considered as next day's running" (R13, R22).
12. **Pending that fails on day 1 shows as Failed / Failed** (TS10 day 1, R22) and is then picked up on day 2 (R23) — i.e. it moves into the first pickup state.
13. **Old transactions show [Invoice]** instead of [e-Invoice]: "[Invoice] button displayed for transactions before e-Invoice deployment" (R15).
14. **Jira sub-task bugs found in testing** (Jira capture, Sub-tasks): "EAINT-8704 … Old transactions unable to generate e-Invoice"; "EAINT-8708 … e-Invoice submission hit "Submission failed due to unexpected error""; "EAINT-8732 … Cronjob resubmit only 1 transaction when vehicle set to fail again due to RHB error".

## 5. Test data, environment, setup

1. **Environment:** staging (R3). Cronjob every 10 minutes on staging (R5).
2. **Setup path** (R12, steps 1(b)–6): BO **Update Company Account** page — tick **RHB Account Number**, field not blank, Company Status Activated → create **STMS** to Approved → "Manual trigger APT for JPJ Notice 5.5" (Tx = New) → "Manual trigger APT for JPJ Notice 6.0" (Tx = Pending) → set **Vehicle Number prefix** in "simulator ESTM Enquiry Resp" → pay.
3. **Simulator codes used:** VEL000392E (pickup), GLB000000I (no error), VEL000006E, VEL000396E, VEL000372E (other codes).
4. **Payment failure:** set in simulator; TS2 names "Payment = Failed (due to IF)" (R13).
5. **Evidence ids** in Remarks column: transaction UUIDs and e-Invoice numbers, e.g. "dd27b9ab-433a-4dfe-923e-ec72665fbf17 EA-IV-0825-0001272" (R12).
6. **Credentials:** none in the sheet.

## 6. Gaps and risks for regression

1. **Multiple transactions in one run** — not in the TS, yet sub-task EAINT-8732 was a bug "Cronjob resubmit only 1 transaction when vehicle set to fail again due to RHB error". Regression should run **2+ eligible rows** in one cronjob cycle.
2. **"Yesterday and earlier" age rule** — `knowledge/flow-apt.md` says "Only yesterday and earlier"; the TS never tests a same-day transaction. On staging the 10-minute cycle hides this. [unconfirmed]
3. **RHB ticked-but-blank error message** — Q&A says an error is shown on the APT listing (R40, cell 1), but TS17/TS18 (R30–R31) only check status and buttons, not the message.
4. **Payment-failed then ticket/company changes mid-way** — TS4 step 7 unticks RHB after payment (R16); no reverse case (re-activate, then pickup).
5. **Price at run time** — not in this TS; covered later by EAINT-12289 / EAINT-12403.
6. **Production schedule (8 PM, once a day)** cannot be tested on staging; only the logic is.

### Sheet inconsistencies (for whoever reuses it)

1. **TS8 step 6** says "Transaction Status = OK" (R20); the expected result says "Tx Status = Approved".
2. **TS10 day 1** step 5 carries "• Transaction Status = Failed" before any payment step, and day 2 jumps to step "8." with no step 7 (R22–R23).
3. **TS10 day 1 expected** says "cronjob DO NOT resubmit" (R22), yet the setup is a Pending row the cronjob should pick (as in TS9). Likely means the resubmit ran and payment failed. [unconfirmed]
4. **TS16** is labelled Tx = New (R29) but its steps include "Manual trigger APT for JPJ Notice 6.0 … Pending".
5. **TS19** expected starts "cronjob successfully resubmit" (R32) though the steps are a manual UCD resubmit.
6. **TS11 and TS12** share one Remarks id "b45d6e7d-ac14a0e0-3fe07e00-38597800" (R24, R25), not in normal UUID form.

### Contradictions with knowledge/

1. **`knowledge/business-rules-from-test-scenarios.md` §2 item 6** says "Pending and New are not picked up `[… rows 24, 28]`". **Wrong for Pending.** R24 (TS11) is blocked by "Inactive" RHB, not by Pending; TS9 (R21) shows Pending **is** picked up and approved when all criteria hold.
2. **`knowledge/flow-payments-fees.md` line 47** repeats "Pending and New are not picked up" — same error.
3. **`knowledge/cr-test-scenario-catalogue.md` row 077** repeats "Pending / New not picked up (Scenario Test!R24, R28)" and lists the tester as "Amirul Azfar"; the sheet says "Nick" (R12–R32) and Jira QA is Nicholas Lim.
4. **`knowledge/flow-apt.md` lines 148 and 161** match this TS (Failed/Failed or "–"/Pending; OK/Failed not picked).

## Knowledge candidates

1. **Fix the Pending rule** in `knowledge/business-rules-from-test-scenarios.md` §2 item 6, `knowledge/flow-payments-fees.md` line 47 and `knowledge/cr-test-scenario-catalogue.md` row 077: Pending ("–" / Pending) **is** picked up when RHB Active, Company Activated, eSTM VEL000392E. Source: `[from SharePoint TS #077 EAINT-8668, sheet Scenario Test, R21]` "Ensure once hit scheduled time, cronjob successfully resubmit APT payment & perform final submission".
2. **Catalogue tester correction:** QA "Nick" `[Scenario Test, R12–R32]`; Jira QA field Nicholas Lim `[jira capture, field QA cf 10041]`.
3. **Add to `knowledge/flow-apt.md` Rules:** cronjob eSTM enquiry is not in any XML log, only server log `[Scenario Test, R40, cell 2]`.
4. **Add to `knowledge/flow-apt.md` Rules:** either RHB or Company failing blocks pickup; failing RHB code is not checked `[Scenario Test, R40, cells 3 and 7]`.
5. **Add to `knowledge/flow-apt.md` Rules:** RHB Account Number ticked but blank → not picked up; error shown on APT listing from backend `[Scenario Test, R40, cell 1; R30–R31]`.
6. **Add to `knowledge/flow-apt.md` QA scope:** run 2+ eligible transactions in one cycle (EAINT-8732 bug) `[jira capture, Sub-tasks]`.
7. **Add to `knowledge/flow-apt.md` Ticket history:** sub-task bugs EAINT-8704, EAINT-8708, EAINT-8732 `[jira capture, Sub-tasks]`.
8. **Simulator codes** VEL000006E, VEL000396E, VEL000372E as "non-pickup" eSTM codes; GLB000000I = success/no error `[Scenario Test, R18, R19, R27, R29]`.
