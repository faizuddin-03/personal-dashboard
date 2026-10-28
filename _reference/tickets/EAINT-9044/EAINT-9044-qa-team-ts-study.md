# EAINT-9044 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of another team's TS. Nothing in `knowledge/` or `lib/` was changed.

## Sources read

1. **Text copy** `_reference/sharepoint/qa-team-ts/EAINT-9044 - To add Transaction Restriction setting in Manage Company Accounts page.md` (header: "text copy (27/10/2026, 6:47:34 pm)", "Cell text only, row by row; formatting and images are not kept."). Read in full, all 9 sheets, rows R1 to R21 of the last sheet.
2. **Workbook** `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-9044 - To add Transaction Restriction setting in Manage Company Accounts page.xlsx` — not opened; the text copy was used. Cell colours, images and screenshots are therefore **not read**.
3. `_reference/tickets/EAINT-9044/` and `_reference/tickets/Studying/EAINT-9044/` — **do not exist** (no SRD, no notes).
4. `lib/ticketStudies.ts` — **no entry** for EAINT-9044.
5. `knowledge/` grep for EAINT-9044: `flow-bo-shell.md`, `business-rules-from-test-scenarios.md`, `flow-ucd-shell.md`, `flow-stms.md`, `flow-apt.md`, `flow-bmk.md`, `flow-ucd-to-ucd.md`, `flow-ucd-company-listing.md`, `cr-test-scenario-catalogue.md`, `production-regression-scope.md`.
6. **Not read:** Jira ticket, SRD, linked issues EAINT-10219 and EAINT-10272 (no connector run in this unattended job).

## 1. Header

1. **Ticket:** EAINT-9044 — "To add Transaction Restriction setting in Manage Company Accounts page".
2. **Portals:** **BackOffice** (Manage Company Accounts: create, update, listing) and **UCD** (STMS, eSTM, APT, UCD to UCD, BMK, Insurance, JomCheck).
3. **Workbook:** "EAINT-9044 - To add Transaction Restriction setting in Manage Company Accounts page.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 14/10/2026, 12:57:44 am.
4. **Sheets (9):** "E2E Scenarios - STMS", "E2E Scenarios - eSTM", "E2E Scenarios - APT", "E2E Scenarios - UCD to UCD", "E2E Scenarios - BMK", "E2E Scenarios - Insurance", "E2E Scenarios - JomCheck", "(FT) BO Update Company Account", "(SnF) BO Manage Company Account".
5. **Scenarios: 118** — STMS 18, eSTM 15, APT 4, UCD to UCD 19, BMK 8, Insurance 12, JomCheck 6, (FT) 9 + permission 9, (SnF) 9 + permission 9. Matches `knowledge/cr-test-scenario-catalogue.md` row 089.
6. **Results:** **116 PASS, 0 FAIL, 2 N/A** (9044_CU_PERM_TS9, 9044_MCA_PERM_TS9 — both "Any Probation not specified"). Only the STMS sheet has a "Test Result" header; the other sheets have a blank header in that column, but the cells still hold PASS / N/A.
7. **Testers in the QA column:** Teck Yung (most rows), Azfar, Maisarah, Nick. The catalogue lists the file author as "Hui Xin Lee", 2026-10-13 `[knowledge/cr-test-scenario-catalogue.md row 089]`.
8. **Dates:** **none written** in the sheet cells.
9. **Deployment:** "| EAINT-9044 | 20260408 | Transaction Restriction setting | Yes |" `[knowledge/production-regression-scope.md line 990]`. Follow-ups deployed 20260415: "EAINT-10510 | 20260415 | BO transaction restriction patch" and "EAINT-10515 | 20260415 | BO restriction view by role" `[same file, lines 987-988]` — link to 9044 [unconfirmed].
10. **Linked issues in Remarks:** **EAINT-10219** (popup UI issue), **EAINT-10272** (permission rows).

## 2. What the ticket changed, as the TS shows it

1. **New BO setting** on Create New and Update Company Account: "Transaction Restriction: ⏎ ◎ Yes ⏎ ◉ No (default)", shown "below Block STMS Category section" `[(FT) BO Update Company Account, R3, R7]`.
2. **New listing filter** on Manage Company Accounts: dropdown "at right side of Business Type dropdown", options "All (default) ⏎ - Yes ⏎ - No" `[(SnF), R3, R4]`.
3. **New listing column** "Transaction Restriction" "positioned between 'Limited Features for UCD to UCD' and 'eLKM' columns" `[(SnF), R11]`; CSV export follows the filter `[(SnF), R5-R10]`.
4. **UCD block:** when Yes, the UCD gets a **Notice popup** on entry points (create, resubmit, recover, accept, bulk actions, free quote, JomCheck purchase). Steps inside an already started transaction mostly carry on.
5. **Permission:** six named BO users can change the setting; other HubAdmin / Admin "can see but unable to access" it `[(FT), R13-R20]`.
6. **Existing companies** default to No after deploy `[(FT), R11]`.

## 3. Scenarios

### A. STMS (sheet "E2E Scenarios - STMS") — popup wording "performing"

1. **9044_STMS_TS1** (R2) — CREATE NEW TRANSACTION → Notice popup "You are currently restricted from performing transactions. ⏎ Please contact eAuto at 03-27798899." Remark: "Pop up is displayed but UI issue is till found: ⏎ https://mfservices.atlassian.net/browse/EAINT-10219".
2. **9044_STMS_TS2** (R3) — close popup, click again → popup again. Same EAINT-10219 remark.
3. **9044_STMS_TS3** (R4, MyKad) — Listing Resubmit, "Tx Status = Pending" → popup. Remark: "Redirect to Homepage".
4. **9044_STMS_TS4** (R5, MyPR) — Resubmit, "JPJ Check = Failed, Tx Status = Failed" → popup.
5. **9044_STMS_TS5** (R6, Company) — Resubmit, "Payment = Failed, Tx Status = Failed" → popup.
6. **9044_STMS_TS7 / TS8** (R7, R8) — BULK JPJ ENQUIRY, tick one / more than one → popup.
7. **9044_STMS_TS9 / TS10** (R9, R10) — BULK PAYMENT SUBMISSION, tick one / more than one → popup.
8. **9044_STMS_TS6** (R11, Company) — restriction set after step 4, click Purchase SSM → "Can proceed with normal flow".
9. **9044_STMS_TS11** (R12) — step 4 Resubmit after JPJ Enquiry Failed → normal flow.
10. **9044_STMS_TS12 / TS13** (R13, R14) — Transfer History banner "Purchase Now" at step 4 / step 5 → normal flow.
11. **9044_STMS_TS14–TS17** (R15–R18) — Next from step 1→2, 2→3, 3→4, "Make Payment (STMS)" 4→5 → normal flow.
12. **9044_STMS_TS18** (R19) — step 5 "STMS Payment" → normal flow.

### B. eSTM (sheet "E2E Scenarios - eSTM") — popup wording "creating"

1. **9044_eSTM_TS1 / TS2** (R2, R3) — CREATE eSERAHAN TRANSACTION, and again after close → popup.
2. **9044_eSTM_TS3–TS5** (R4–R6; MyKad, MyPR, Company) — Listing Resubmit on Pending / JPJ Check Failed / Payment Failed → popup.
3. **9044_eSTM_TS6** (R7) — "Tick Show Draft Trx Only", "Click Recover on any transactions where Tx Status = Draft" → popup.
4. **9044_eSTM_TS7** (R8) — Final Submission failed with REV000001E, Reset from **Transaction Details page** → popup. Remark: "Should block".
5. **9044_eSTM_TS8** (R9) — same failure, Reset from **eSTM Step 6 page** → "Continue with normal flow". Remark: "Normal flow".
6. **9044_eSTM_TS9** (R10, Company) — step 4 Purchase SSM → normal flow.
7. **9044_eSTM_TS10** (R11) — step 4 Resubmit after JPJ Enquiry Failed → normal flow.
8. **9044_eSTM_TS11–TS15** (R12–R16) — Next / Make Payment through steps 1→5 → normal flow.

### C. APT (sheet "E2E Scenarios - APT")

1. **9044_APT_TS1** (R2, MyKad) — STMS Approved, BO "Manual APT Trigger" 5.5 & 6.0, restriction Yes, APT Resubmit on Pending → popup.
2. **9044_APT_TS2** (R3) — close and Resubmit again → popup.
3. **9044_APT_TS3** (R4, Company) — Resubmit first, then restriction Yes, click Next → expected "Ensure the following popup displayed", but Remark "SHOULD NOT BLOCK". PASS. **Conflict, see §4.7.**
4. **9044_APT_TS4** (R5) — Resubmit on "Payment = Failed, Tx Status = Failed" → popup.

### D. UCD to UCD (sheet "E2E Scenarios - UCD to UCD") — popup wording "creating"

1. **9044_UTU_TS1 / TS2** (R2, R3) — STANDARD, and again → popup.
2. **9044_UTU_TS3 / TS4** (R4, R5) — INTERSTATE > CREATE NEW INTERSTATE TRANSACTION, and again → popup.
3. **9044_UTU_TS5–TS7** (R6–R8) — STMS listing Resubmit on Pending / JPJ Check Failed / Payment Failed → popup.
4. **9044_UTU_TS8** (R9) — accepting UCD restricted, "Click To Accept on any available transactions" → popup.
5. **9044_UTU_TS9 / TS10** (R10, R11) — interstate, before accepting, Next 1→2, 2→3 → normal flow.
6. **9044_UTU_TS11** (R12) — after accepting (auto redirect to Step 3), restriction Yes, "Complete thumbprint and click Next" → **popup**.
7. **9044_UTU_TS12** (R13) — after accepting, at step 4, "Make Payment (STMS)" → normal flow.
8. **9044_UTU_TS13** (R14) — after accepting, step 5 "STMS Payment" → normal flow.
9. **9044_UTU_TS14** (R15) — Standard, step 4 Resubmit after JPJ Failed → normal flow.
10. **9044_UTU_TS15–TS19** (R16–R20) — Standard, Next 1→5 and step 5 Payment → normal flow.

### E. BMK (sheet "E2E Scenarios - BMK")

1. **9044_BMK_TS1 / TS2** (R2, R3) — PURCHASE BMK, and again → popup.
2. **9044_BMK_TS3** (R4, MyKad) — BMK LISTING Resubmit on "Payment = Failed, Tx Status = Failed" → popup.
3. **9044_BMK_TS4–TS8** (R5–R9) — steps 1→5 and step 5 → "Ensure the following popup is NOT displayed".

### F. Insurance (sheet "E2E Scenarios - Insurance")

1. **9044_INS_TS1 / TS2** (R2, R3) — GET A FREE QUOTE, and again → popup.
2. **9044_INS_TS3** (R4) — Insurance Transaction Listing > View > Insurance Banner "GET FREE QUOTE FOR <vehicle no.>" → popup.
3. **9044_INS_TS4** (R5) — Resubmit "where Status = Pending Payment" → popup.
4. **9044_INS_TS5** (R6) — Resubmit "where Payment = Failed, Status = Failed" → popup.
5. **9044_INS_TS6–TS10** (R7–R11) — select insurance, Make Payment, PAY NOW, "< Back" on step 2 and step 3 → "Ensure the following popup NOT displayed and able to continue with flow normally".
6. **9044_INS_TS11** (R12) — VEL000069E, step 1 Insurance, "Skip, Return to eSerahan" → popup NOT displayed. Remark: "As clicking on Skip, Return to eSerahan on Insurance Step 1 consider as in flow, will still redirect to eSTM Step 5".
7. **9044_INS_TS12** (R13) — VEL000069E, insurance paid, step 4 "Continue with eSerahan" → popup NOT displayed.

### G. JomCheck (sheet "E2E Scenarios - JomCheck") — all block

1. **9044_JC_TS1 / TS2** (R2, R3) — PURCHASE JOMCHECK REPORT, and again → popup.
2. **9044_JC_TS3** (R4) — after Submit, restriction Yes, "Click Pay Now" → popup.
3. **9044_JC_TS4** (R5) — Pay Now failed, then "click Retry" → popup.
4. **9044_JC_TS5** (R6) — number entered, restriction Yes, "click Submit" → popup.
5. **9044_JC_TS6** (R7) — "Vehicle / Chassis not found", then "click Try Again" → popup.

### H. BO Create / Update Company (sheet "(FT) BO Update Company Account")

1. **9044_FT_TS1 / TS5** (R3, R7) — field shown below Block STMS Category on Create / Update, default No.
2. **9044_FT_TS2 / TS6** (R4, R8) — "Ensure only able to select one option at a time".
3. **9044_FT_TS3 / TS7** (R5, R9) — No → "Ensure able to initiate any module transaction creation".
4. **9044_FT_TS4 / TS8** (R6, R10) — Yes → "Ensure unable to create any transaction from any modules".
5. **9044_FT_TS9** (R11) — post deployment, existing companies → "Ensure default selection for Transaction Restriction is option No".
6. **9044_CU_PERM_TS1–TS6** (R13–R18) — BO users jasons, kmcheah, nikmuhamad, mfared, eautosoyeng, mfizni → "Ensure able to see and apply changes".
7. **9044_CU_PERM_TS7 / TS8** (R19, R20) — "Any other HubAdmin not specified" / "Any other Admin not specified" → "Ensure can see but unable to access". Remark: EAINT-10272.
8. **9044_CU_PERM_TS9** (R21) — "Any Probation not specified" → N/A.

### I. BO Manage Company Accounts listing (sheet "(SnF) BO Manage Company Account")

1. **9044_SnF_TS1** (R3) — dropdown right of Business Type. Remark: "Dropdown is displayed, but it is not in the correct position, pending BA and UI to change the postion in figma."
2. **9044_SnF_TS2** (R4) — options All (default), Yes, No.
3. **9044_SnF_TS3–TS5** (R5–R7) — All / Yes / No alone; "* Ensure exported CSV also displayed correctly".
4. **9044_SnF_TS6–TS8** (R8–R10) — combined with other filters → "Ensure result displayed based on selected criterias".
5. **9044_SnF_TS9** (R11) — column between 'Limited Features for UCD to UCD' and 'eLKM'.
6. **9044_MCA_PERM_TS1–TS8** (R13–R20) — all six named users plus "Any other HubAdmin" and "Any other Admin" → "Ensure able to see, expand and make selection on Transaction Restriction dropdown" and see the column.
7. **9044_MCA_PERM_TS9** (R21) — Probation → N/A.

## 4. Business rules and system behaviour

1. **Popup text, two wordings.** STMS sheet: "Title: Notice ⏎ Content: ⏎ You are currently restricted from performing transactions. ⏎ Please contact eAuto at 03-27798899." `[E2E Scenarios - STMS, R2-R10]`. All other sheets: "You are currently restricted from creating transactions. ⏎ Please contact eAuto at 03-27798899." `[E2E Scenarios - eSTM, R2]`. Even UCD to UCD rows that resubmit from the **same STMS listing** say "creating" `[E2E Scenarios - UCD to UCD, R6-R8]`. Which wording the system really shows on STMS is [unconfirmed].
2. **Entry points block; in-flow steps do not.** Blocked: create buttons, listing Resubmit / Recover, bulk JPJ enquiry, bulk payment, To Accept, Get Free Quote, Insurance banner. Not blocked: Next between steps, Make Payment, Purchase SSM, Purchase TH, step 4 Resubmit — "Can proceed with normal flow" `[E2E Scenarios - STMS, R11-R19]`.
3. **Reset depends on where it is clicked.** Reset on Transaction Details page blocks ("Should block") `[E2E Scenarios - eSTM, R8]`; Reset on eSTM Step 6 page continues ("Normal flow") `[E2E Scenarios - eSTM, R9]`.
4. **Interstate accept: exception to rule 2.** After To Accept (auto redirect to Step 3), "Complete thumbprint and click Next" shows the popup `[E2E Scenarios - UCD to UCD, R12]`, yet "Make Payment (STMS)" at step 4 continues `[R13]` and step 5 payment continues `[R14]`.
5. **JomCheck blocks every action**, also mid-flow: "Click Pay Now", "click Retry", "click Submit", "click Try Again" all show the popup `[E2E Scenarios - JomCheck, R4-R7]`.
6. **Insurance "Skip, Return to eSerahan" counts as in-flow:** "As clicking on Skip, Return to eSerahan on Insurance Step 1 consider as in flow, will still redirect to eSTM Step 5" `[E2E Scenarios - Insurance, R12 Remarks]`.
7. **APT step 5 Next: conflict.** Expected "Ensure the following popup displayed" but Remarks "SHOULD NOT BLOCK", result PASS `[E2E Scenarios - APT, R4]`. Real behaviour [unconfirmed]; by rule 2 it should not block [unconfirmed].
8. **STMS listing Resubmit on Pending** — Remark "Redirect to Homepage" `[E2E Scenarios - STMS, R4]`. Whether the popup close sends the user home is [unconfirmed].
9. **Restriction applies to main and sub UCD:** "Login as main / sub UCD" `[(FT) BO Update Company Account, R5, R6]`.
10. **Edit right is limited to six named BO users** `[(FT), R13-R18]`; others "can see but unable to access" `[(FT), R19-R20]`. The **listing filter and column are open** to all HubAdmin / Admin `[(SnF), R19-R20]`.
11. **Bulk actions block for one or many rows:** "Tick one transaction" and "Tick more than one transaction" `[E2E Scenarios - STMS, R7-R10]`.
12. **Seller categories run:** MyKad, MyPR, Company, "Any" (Category column). No Foreigner or Association rows.

## 5. Test data, environments, accounts, setup

1. **Environment:** **not written** in the sheet. Staging assumed [unconfirmed].
2. **BO accounts by username:** jasons, kmcheah, nikmuhamad, mfared, eautosoyeng, mfizni `[(FT) R13-R18; (SnF) R13-R18]`. **No passwords** in the text copy.
3. **BO setup tools used:** Manage Company Accounts (toggle Yes/No mid-test); "Manual APT Trigger" with "trigger 5.5 & 6.0" `[E2E Scenarios - APT, R2]`.
4. **Data states needed:** STMS / eSTM / BMK / Insurance rows at Pending, JPJ Check Failed, Payment Failed; eSTM Draft; eSTM Final Submission failed "due to REV000001E"; JPJ error "VEL000069E"; an interstate UCD to UCD waiting for To Accept (two companies); JomCheck "Vehicle / Chassis not found".
5. **Pre/post deploy capture:** "Select a few UCD companies & capture screens for Create & Update Company page before deployment" `[(FT), R11]`.

## 6. Gaps and risks for regression

1. **Popup wording on STMS** ("performing" vs "creating") not settled — check live text.
2. **APT step 5 Next** expected vs remark conflict — confirm and fix the expected result.
3. **Restriction set to No again** (unblock) is only covered on Create/Update generally `[(FT), R9]`; no E2E row turns Yes → No and retries a blocked entry point.
4. **Audit log** entry "[Transaction Restriction]" (EAINT-6762 format, `knowledge/flow-bo-shell.md` line 99) is **not tested** in this TS.
5. **Other modules not covered:** eLKM, eVOC, Transfer History standalone purchase, SSM standalone purchase, eDereg / AATF, Service Hub, Shopping Cart, Device Purchase. Whether they block is [unconfirmed].
6. **Probation role** never run (both N/A).
7. **Branch / sub-user** coverage: only "main / sub UCD" mentioned in FT rows; E2E rows do not state which user.
8. **Open UI issues:** EAINT-10219 (popup UI) and filter position "pending BA and UI" `[(SnF), R3]`; current state unknown.
9. **Follow-ups** EAINT-10510 and EAINT-10515 (20260415) may have changed this behaviour [unconfirmed]; their TS should be read with this one.

## Notes against existing knowledge

1. `business-rules-from-test-scenarios.md` §7.2 lists STMS wording as "row 2" only; the TS uses "performing" on **all STMS rows R2-R10**, and "creating" on UCD to UCD STMS-listing rows.
2. `business-rules-from-test-scenarios.md` §7.3 says in-flow steps "carry on normally". The TS has **exceptions**: eSTM Reset from Details page `[eSTM R8]`, interstate Next after accept `[UCD to UCD R12]`, JomCheck mid-flow actions `[JomCheck R4-R7]`.
3. `flow-stms.md` line 99 lists blocked actions as "create, resubmit, bulk JPJ enquiry and bulk payment" — agrees with this TS.
4. `flow-ucd-company-listing.md` items 1-2 (captured header has "Limited Features For UCD to UCD", "Transaction Restriction", "eLKM") — **agrees** with `[(SnF), R11]`.
5. `flow-bo-shell.md` item 1.3 — agrees; does not yet say the listing filter is open to all HubAdmin / Admin.

## Knowledge candidates

1. **Popup wording split** — STMS sheet "restricted from performing transactions" `[E2E Scenarios - STMS, R2-R10]` vs other modules "restricted from creating transactions" `[E2E Scenarios - eSTM, R2]`. Target: `knowledge/business-rules-from-test-scenarios.md` §7.2, tagged [unconfirmed] until seen live.
2. **Reset location rule** — Details-page Reset blocks ("Should block") `[E2E Scenarios - eSTM, R8]`; Step 6 Reset does not ("Normal flow") `[R9]`. Target: `knowledge/flow-estm.md`.
3. **Interstate accept exception** — Next after To Accept shows popup `[E2E Scenarios - UCD to UCD, R12]`; To Accept itself blocks `[R9]`. Target: `knowledge/flow-ucd-to-ucd.md`.
4. **JomCheck blocks mid-flow** — Pay Now, Retry, Submit, Try Again all show popup `[E2E Scenarios - JomCheck, R4-R7]`. Target: `knowledge/flow-jomcheck.md`.
5. **Insurance in-flow actions not blocked**, incl. "Skip, Return to eSerahan" `[E2E Scenarios - Insurance, R7-R13]`; banner Get Free Quote and listing Resubmit block `[R4-R6]`. Target: `knowledge/eauto-insurance.md`.
6. **Edit vs view permission** — six named BO users edit `[(FT), R13-R18]`; other HubAdmin / Admin "can see but unable to access" `[(FT), R19-R20]`; listing filter/column open to all `[(SnF), R19-R20]`. Target: `knowledge/flow-bo-shell.md` item 1.3.
7. **APT step 5 conflict** — "Ensure the following popup displayed" vs Remark "SHOULD NOT BLOCK" `[E2E Scenarios - APT, R4]`. Target: `knowledge/flow-apt.md` as an open question.
8. **Bulk screens block one or many rows** `[E2E Scenarios - STMS, R7-R10]`. Target: `knowledge/flow-stms.md`.
