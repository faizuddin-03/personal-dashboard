# EAINT-8523 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-8523 - [eAuto-UCD & BackOffice] To have cronjob to generate butir-butir hak milik.md` (text copy dated "28/10/2026, 9:50:37 am"; "Cell text only, row by row; formatting and images are not kept."). Read in full.
2. **Ticket folders:** `_reference/tickets/EAINT-8523/` and `_reference/tickets/Studying/EAINT-8523/` held no files before this study.
3. **lib/ticketStudies.ts:** no entry for EAINT-8523.
4. **knowledge/ (grep EAINT-8523):** `flow-estm.md` line 722-730, `business-rules-from-test-scenarios.md` lines 204-213, `cr-test-scenario-catalogue.md` lines 165 and 414, `production-regression-scope.md` line 1044. Also read `eauto-insurance.md` §"Car — Hak Milik gate (eSTM)" and `business-rules-from-test-scenarios.md` line 866 (EAINT-9103 file name).
5. **Not read:** Jira ticket, SRD, Teams. This is an unattended run with no connector access. Cell colours and images from the xlsx are not in the text copy.

## 1. Header

1. **Ticket:** EAINT-8523 — "[eAuto-UCD & BackOffice] To have cronjob to generate butir-butir hak milik".
2. **Module / portal:** **eSTM** (Butir-butir Hak Milik document); **BackOffice** eSTM Transaction Listing and **UCD + BO** transaction details page.
3. **Workbook:** "EAINT-8523 - [eAuto-UCD & BackOffice] To have cronjob to generate butir-butir hak milik.xlsx", library "eAuto - CR Test Scenarios", modified 17/10/2025, 5:03:39 pm.
4. **Sheets:** one — "Sheet1".
5. **Scenarios:** **6** (TS1-TS6), spread over **17 step rows** (R4-R20).
6. **Results:** **17 of 17 rows PASS**, 0 FAIL ("Test Result (P/F)" column).
7. **Tester:** one QA engineer named in the "QA" column of every row.
8. **Dates:** none written in the sheet. Production deployment recorded as "20251022" `[knowledge/production-regression-scope.md line 1044]`.
9. **Environment:** "Environment: staging/preprod1" `[Sheet1 R1]`.

## 2. What the ticket changed, as the TS shows it

1. **Before [unconfirmed]:** when the Butir-butir Hak Milik document could not be bought at eSTM approval, it stayed missing; the only route was the manual **[Hak Milik]** hyperlink on the BO listing.
2. **After:** a **cronjob** retries generation. When JPJ returns the right code, it "should pick up transaction to generate Butir-butir Hak Milik" and the "[Hak Milik] hyperlink NOT displayed" `[Sheet1 R6]`.
3. **Once generated:** "[Butir-butir Hak Milik] button displayed in UCD & BO" and "Upon click, should download Butir_<vehicle_no.>.pdf" `[Sheet1 R6]`.
4. **Expected-result columns:** "Backoffice Transaction Listing" and "BO & UCD Transaction Details Page" `[Sheet1 R3]`.

## 3. Scenarios

All scenarios drive the eSTM flow with "Proceed to Step 5, select eLKM & eVOC" and "Proceed until Transaction Status = Approved". The **simulator** is "STMS JPJ Enquiry Resp".

### A. Failed at approval, then cronjob succeeds

1. **TS1 (Individual)** — created with Response Code = 00. Expected: "[Hak Milik] hyperlink will display on Action column" and "[Butir-butir Hak Milik] button hidden in UCD & BO" `[R4]`. Clicking [Hak Milik]: "Upload failed. Please retry." `[R5]`. Switch to 4K, wait for cronjob: cronjob generates it, link gone, button shown, PDF downloads `[R6]`. **PASS.**
2. **TS3 (Individual)** — created with Response Code = 4A. Link shown, button hidden `[R10]`; click gives "Upload failed. Please retry." `[R11]`. Stay on 4A: "Check at 11.30 AM cronjob run to ensure [Hak Milik] hyperlink will remain display" `[R12]`. Switch to 4K: "Check at 12.30 PM cronjob should pick up transaction to generate Butir-butir Hak Milik" `[R13]`. **PASS.**
3. **TS4 (Company)** — created with 00 "(Today's date)"; link shown, button hidden, click fails `[R14-R15]`. "Tomorrow change in simulator ... with Response Code = 4K"; "Check at 10.30 AM cronjob run to ensure [Hak Milik] hyperlink will NOT display" and button + PDF shown `[R16]`. **PASS.**
4. **TS5 (Individual)** — "Search existing trasaction created before today's date", switch to 4K. "Check at 11.30AM cronjob should pick up transaction to generate Butir-butir Hak Milik" `[R17]`. **PASS.**

### B. Succeeded at approval, cronjob leaves it alone

1. **TS2 (Company)** — created with Response Code = 4K. "[Hak Milik] hyperlink will NOT display"; button shown, PDF downloads `[R7]`. Stays correct at the 11.30 AM run on 4K `[R8]` and at the 12.30 PM run after switching to 00 `[R9]`. **PASS.**

### C. Too old for the cronjob

1. **TS6 (Individual)** — created with 00; link shown, click fails `[R18-R19]`. "Request dev to patch 9 days before today's date", switch to 4K. "Check at 4.30 PM cronjob run to ensure [Hak Milik] hyperlink will remain display"; "[Butir-butir Hak Milik] button hidden in UCD & BO" `[R20]`. **PASS.**

## 4. Business rules and system behaviour

1. **Only code 4K produces the document.** Codes **00** and **4A** at approval both give the [Hak Milik] link and a hidden button `[Sheet1 R4, R10, R14, R18]`. 4K at approval gives the button directly `[R7]`. Matches knowledge: "Hak Milik = J ... eSIM STMS Enquiry response code 4K" `[knowledge/flow-estm.md line 727-728, from TS #080 EAINT-8699]`.
2. **Manual retry under a failing code fails:** "Popup message displayed "Upload failed. Please retry."" `[Sheet1 R5, R11, R15, R19]`.
3. **Cron window:** "Note: Cronjob run between 8.30AM to 11.30PM" `[Sheet1 R6, R8, R9, R12, R13, R16, R17, R20]`.
4. **Run times observed:** checks at "10.30 AM" `[R16]`, "11.30 AM" `[R8, R12, R17]`, "12.30 PM" `[R9, R13]`, "4.30 PM" `[R20]`. Hourly at :30 is **[unconfirmed]** — the sheet never states the interval.
5. **Cronjob does not touch a generated document.** After success, switching to 00 keeps "[Hak Milik] hyperlink will remain NOT display" `[R9]`.
6. **A failing code keeps the link.** On 4A the link "will remain display" after a run `[R12]`.
7. **Earlier-dated transactions are picked up** — next-day `[R16]` and "created before today's date" `[R17]`.
8. **Age limit:** a transaction patched to "9 days before today's date" is **not** picked up; the link "will remain display" `[R20]`. The exact cut-off (e.g. 7 days) is **[unconfirmed]** — only day 9 was tested.
9. **File name:** "Butir_<vehicle_no.>.pdf" `[R6, R7, R13, R16, R17]`. Matches "Butir_{VehicleNo}.pdf" `[knowledge/business-rules-from-test-scenarios.md line 866, TS #091 EAINT-9103]`.
10. **Where the link lives:** "on Action column" of the BO **eSTM Transaction Listing** `[R4, R5]`. The UCD listing is not covered by the sheet.

## 5. Test data, environments, setup

1. **Environment:** "staging/preprod1" `[R1]`.
2. **Simulator:** eSIM "STMS JPJ Enquiry Resp", set by vehicle-number prefix ("Set the prefix that will be used for eSTM transaciton creation") `[R4]`. Codes used: **00, 4A, 4K**.
3. **Vehicle numbers (Remarks column):**
   1. TS1: "VN = JA ⏎ JAQ1001" `[R4]`
   2. TS2: "VN = JK ⏎ JKS2001" `[R7]`
   3. TS3: "VN = VF ⏎ VFS2001" `[R10]`
   4. TS4: "VN  JR - JRB1001" `[R14]`
   5. TS5: "VN = WB ⏎ WB7281YN" `[R17]`
   6. TS6: "VN= BQ ⏎ BQR5656" `[R18]`
4. **Dev help:** TS6 needs a **dev date patch** ("Request dev to patch 9 days before today's date") `[R20]`.
5. **Timing:** TS4 runs over **two days** ("Tomorrow change in simulator") `[R16]`.
6. **Credentials:** none in the sheet.

## 6. Gaps and risks for regression

1. **Category mismatch:** TS2 and TS4 are "Company" but the step says "Create eSTM Individual Transaction" `[R7, R14]`. Company coverage is **unclear**.
2. **Age boundary untested:** only "9 days" was tested `[R20]`. No check at the exact limit or one day inside it.
3. **Manual [Hak Milik] success path untested:** every click was under a failing code. Clicking the link while the simulator returns 4K was never checked.
4. **UCD side:** the link is only checked on the BO listing. UCD listing behaviour and the UCD download are only implied by "in UCD & BO" `[R6]`.
5. **Outside the window:** no check that the cronjob stays idle before 8.30 AM or after 11.30 PM.
6. **Without eLKM/eVOC:** every scenario selects "eLKM & eVOC". eSTM-only transactions are not covered.
7. **Other failure codes:** only 00 and 4A tested as failures.
8. **Service Portal flag:** the "Hak Milik = J" listing value came later in EAINT-8699. A regression should confirm a cron-generated document shows **J** there.
9. **Insurance link [unconfirmed]:** TPFT is hidden when "the quote comes from the eSTM flow and isHakMilik == true" `[knowledge/eauto-insurance.md line 170]`. Whether a cron-generated document flips `isHakMilik` for later quotes is not tested.
10. **Production:** the simulator is not available in production; regression there must rely on existing data `[unconfirmed]`.
11. **Sheet quirks:** step numbers skip 7 in TS4 ("6.Tomorrow ..." then "8. Wait") `[R16]`; typo "transaciton" in every set-up step.

## 7. Comparison with knowledge/

1. **Agrees:** `flow-estm.md` line 722-726 and `business-rules-from-test-scenarios.md` item 5 record the link, the "Upload failed. Please retry." popup and the cron pickup.
2. **Missing from knowledge:** the 8.30 AM-11.30 PM window, the 9-day age exclusion, 4A as a failure code, the "button hidden until generated" rule, and that the cronjob leaves already-generated documents alone.
3. **Small correction:** `business-rules-from-test-scenarios.md` line 208 says "Runs were checked at :30 past the hour [… rows 8-20]". Correct as an observation, but row 16 is "10.30 AM", row 20 is "4.30 PM" — the interval itself is not stated.
4. **No contradiction** found with `flow-estm.md` or `eauto-insurance.md`.

## Knowledge candidates

1. **Hak Milik cron window.** "Note: Cronjob run between 8.30AM to 11.30PM" `[from SharePoint TS #062 EAINT-8523, Sheet1, R6]`. Target: `knowledge/flow-estm.md` Hak Milik cronjob paragraph.
2. **Codes.** STMS JPJ Enquiry Resp 00 and 4A at approval → "[Hak Milik] hyperlink will display on Action column" and "[Butir-butir Hak Milik] button hidden in UCD & BO"; 4K → button displayed, download "Butir_<vehicle_no.>.pdf" `[from SharePoint TS #062 EAINT-8523, Sheet1, R4, R7, R10]`. Target: `flow-estm.md`, `esim.md`.
3. **Age exclusion.** Transaction patched "9 days before today's date" → link "will remain display" after the cronjob on 4K `[from SharePoint TS #062 EAINT-8523, Sheet1, R20]`. Exact limit [unconfirmed]. Target: `flow-estm.md`.
4. **No regeneration.** After the document exists, switching to 00 keeps "[Hak Milik] hyperlink will remain NOT display" `[from SharePoint TS #062 EAINT-8523, Sheet1, R9]`. Target: `flow-estm.md`.
5. **Earlier-dated pickup.** Transactions "created before today's date" are picked up `[from SharePoint TS #062 EAINT-8523, Sheet1, R17]`. Target: `flow-estm.md`.
