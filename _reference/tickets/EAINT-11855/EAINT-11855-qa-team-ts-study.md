# EAINT-11855 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy (main source):** `_reference/sharepoint/qa-team-ts/EAINT-11855 - [eAuto-BackOffice] APT - Auto Reset Payment on RHB Payment Error (RE).md` (made 27/10/2026, 8:37:01 pm). Cell text only, no formatting.
2. **Second text copy (cross-check):** `_reference/inbox/eauto-flows-run/ts-text/EAINT-11855_-_eAuto-BackOffice_APT_-_Auto_Reset_Payment_on_RHB_Payment_Error_RE_.xlsx.txt`. Same content, same cut-off.
3. **Workbook itself** (`_reference/sharepoint/eauto-cr-test-scenarios/EAINT-11855 - … (RE).xlsx`): **not opened**. This run has no tool to read .xlsx directly. Cell colours, dropdowns and any hidden text are not checked.
4. **Ticket folders:** `_reference/tickets/EAINT-11855/` held no files before this study. `_reference/tickets/Studying/EAINT-11855/` does not exist. No SRD found locally.
5. **lib/ticketStudies.ts:** no EAINT-11855 entry.
6. **knowledge/:** `flow-apt.md`, `flow-payments-fees.md`, `flow-wholesale.md`, `releases.md`, `cr-test-scenario-catalogue.md`, `business-rules-from-test-scenarios.md`, `README.md`.

## 1. Header

1. **Ticket:** EAINT-11855.
2. **Module / portal:** APT (Automatic Permanent Transfer). Title says **BackOffice**; the test steps run in the **UCD Portal**, with a BO step in setup.
3. **Workbook:** "EAINT-11855 - [eAuto-BackOffice] APT - Auto Reset Payment on RHB Payment Error (RE).xlsx", library "eAuto - CR Test Scenarios", modified 07/07/2026, 8:37:45 am.
4. **Sheets:** 2 — "Sheet1" (test script), "Sheet2" (short logic note).
5. **Scenarios:** **1** (11855_TS1).
6. **Results:** none recorded. The "QA" and "Result" columns are empty.
7. **Tester / dates:** none written in the sheet. The catalogue lists the SharePoint "Modified By" editor as a QA engineer, 2026-07-07 (`knowledge/cr-test-scenario-catalogue.md` row 020). That is the last editor, not proof of who tested.
8. **Release:** S32.1-20260803, 2026-08-03 morning (`knowledge/releases.md` line 30).

## 2. What the ticket changed, as the TS shows it

1. **Before:** an APT payment that failed with RHB error **RE** had to be reset by hand [from knowledge/flow-apt.md line 151, jira tag — not in the TS].
2. **After (TS view):** the system finds RE and **resets the payment on its own**. Sheet2 states it as:
   1. "APT Failed Payment due to RE" — Sheet2, R1.
   2. "System will detect RE > define the error" — Sheet2, R2.
   3. "Then, system will auto reset payment for that transaction" — Sheet2, R3.
3. **Trigger in the TS:** a **UCD manual Resubmit** at Step 5. The cronjob path (EAINT-8668) is **not** in this TS.

## 3. Scenarios

### A. Auto reset on RE

1. **11855_TS1** — Test Objective: "System to auto reset payment when APT hit Payment = RE" (Sheet1, R3).
   1. Steps: "1. Go to UCD > APT Transaction Listing, click [Resubmit]" / "2. Step 5: Click [Next] and [Yes] on payment confirmation popup" / "3." (Sheet1, R3, Test Scenario).
   2. **Step 3 is blank** — the cell ends at "3." in both text copies.
   3. **Expected Result: empty.** No pass condition is written.

## 4. Business rules and system behaviour the TS reveals

1. **RE leads to "Failed" payment first:** "APT Failed Payment due to RE" — Sheet2, R1.
2. **Detection then reset:** "System will detect RE > define the error" — Sheet2, R2; "Then, system will auto reset payment for that transaction" — Sheet2, R3.
3. **Reset scope is per transaction:** "for that transaction" — Sheet2, R3. No batch reset is mentioned.
4. **APT needs an approved, paid STMS first:** "Create STMS until Transaction Status = Approved and RHB Payment = OK" — Sheet1, R3, Pre-Requisite.
5. **APT can be triggered by hand in BO:** "Go to BO, manually trigger APT of the Approved STMS" — Sheet1, R3, Pre-Requisite. The BO page name for this trigger is not given.
6. **Payment confirmation popup at Step 5:** "Step 5: Click [Next] and [Yes] on payment confirmation popup" — Sheet1, R3.
7. **What the TS does NOT say:**
   1. How RE is produced on staging (RHB staging setting, stub, or a stale reference) — not written.
   2. The state after reset (Payment "-" / Tx Pending?) — not written. knowledge/flow-payments-fees.md line 90 gives that state for the **manual BO Reset**; for the auto reset it is [unconfirmed].
   3. The RE message text — not in the TS. knowledge/flow-apt.md line 152 gives "RE - Invalid RefNo/Amount/Date" from Jira, not from this TS.

## 5. Test data, environments, accounts, setup

1. **Data:** one STMS driven to "Transaction Status = Approved and RHB Payment = OK", then its APT triggered in BO (Sheet1, R3).
2. **Portals:** UCD Portal ("UCD > APT Transaction Listing") and BO.
3. **Environment:** not named in the sheet.
4. **Accounts / credentials:** none in the sheet.
5. **RE condition:** no setup written for forcing RHB to answer RE. A tester cannot repeat the test from the sheet alone.

## 6. Gaps or risks a regression should still cover

1. **No expected result.** The TS gives no pass condition. Regression should check, after RE: Payment status, Tx status, remarks, and that the row can be resubmitted.
2. **Step 3 missing.** The TS stops after the payment popup. The check of the reset is not written.
3. **How to force RE** on staging is not recorded. Needs the dev's method before any rerun or automation.
4. **Cronjob path not tested.** knowledge/flow-payments-fees.md line 92 says "UCD or cronjob resubmits". Only the UCD path is in this TS. Check RE during the 8pm / staging auto-pay job (EAINT-8668).
5. **Retry after reset.** Check the dealer can pay again and is charged the **current** price (flow-apt.md line 152: new payment at the new price) — [unconfirmed] by this TS.
6. **Non-RE errors must not auto reset.** No negative case for other RHB codes (e.g. DE, which flow-apt.md line 152 links to fund enquiry on RE). Risk: wrong codes reset.
7. **RHB account inactive / none.** flow-apt.md line 154 notes screen price and bank record can disagree (from EAINT-12289). Not covered here.
8. **Payment OK + Tx Failed** must stay untouched (flow-apt.md line 171). Not covered here.
9. **BO side not tested.** Title says BackOffice, yet no BO listing or Reset Payment Report check is in the TS. Check the auto-reset row in BO APT Transaction Enquiry and BO Reset Payment Report.
10. **No result recorded.** The SharePoint sheet shows no Pass/Fail, so there is no TS evidence that the release passed.

## 7. Where knowledge/ differs from this TS

1. **flow-apt.md line 177:** "Check auto reset on RE: payment reset, retry allowed. [ts: EAINT-11855 11855_TS1]". The TS does **not** say "retry allowed"; its Expected Result is empty. The "retry allowed" part is not backed by the TS.
2. **flow-apt.md line 150:** tags the entry point "[ts: EAINT-11855 11855_TS1]" — matches the TS steps (UCD › APT › Resubmit › Step 5 › Next › Yes).
3. **flow-wholesale.md line 281:** "EAINT-11855: APT auto reset on RHB RE (pass 1). [legacy, superseded by EAINT-12378]". EAINT-12378 is the **Wholesale Logistics Full Payment** RE case (flow-wholesale.md line 199). This TS is APT only. "Superseded" looks wrong; 12378 extends RE handling to another flow [unconfirmed].
4. **flow-apt.md line 164:** "BO CSE team gets a Reset button in the APT Action column (permission via EAINT-11854). [jira: EAINT-11855 2026-08]". This TS has no Reset-button scenario. Coverage of that button is not in this workbook.

## Knowledge candidates

1. **APT can be triggered by hand from BO** for an approved STMS — "Go to BO, manually trigger APT of the Approved STMS" `[from SharePoint TS EAINT-11855, sheet Sheet1, row 3, Pre-Requisite]`. Target: knowledge/flow-apt.md (test setup). BO page name still unknown.
2. **APT test precondition** — "Create STMS until Transaction Status = Approved and RHB Payment = OK" `[from SharePoint TS EAINT-11855, sheet Sheet1, row 3, Pre-Requisite]`. Target: knowledge/flow-apt.md.
3. **Correct flow-apt.md line 177:** drop "retry allowed" or re-tag it, since 11855_TS1 has an empty Expected Result `[from SharePoint TS EAINT-11855, sheet Sheet1, row 3, Expected Result]`.
4. **Review flow-wholesale.md line 281** "superseded by EAINT-12378": 12378 covers Wholesale Logistics Full Payment, not APT `[from knowledge/flow-wholesale.md line 199]` — [unconfirmed] until Jira is checked.
5. **TS coverage note:** 11855 TS covers only the UCD manual Resubmit path, one scenario, no result recorded `[from SharePoint TS EAINT-11855, sheet Sheet1, row 3]`. Target: knowledge/flow-apt.md "QA scope to check".
