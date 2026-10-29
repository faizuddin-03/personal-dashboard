# EAINT-9611 — QA Team test script study (2026-10-27)

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9611-⚪[eAuto-Insurance] To call API and policy inception date and premium updated before payment.md` (text copy dated 27/10/2026, 8:21:00 pm). Cell text only; colours, comments and images are not in the copy.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-9611/EAINT-9611-jira.md` (27/10/2026, 5:26:50 pm).
3. **Knowledge:** `knowledge/eauto-insurance.md` § "Quotation inputs and price re-check", `knowledge/flow-insurance-purchase.md` (step 3, Resubmit, `#pricing-changed-dialog`), `knowledge/esim.md` item 4 (line 570-574), `knowledge/cr-test-scenario-catalogue.md` row 105, `knowledge/business-rules-from-test-scenarios.md` line 439-443, `knowledge/production-regression-scope.md` line 1000.
4. **Not read:** the **SRD** (`SRD_EAINT-9611_..._V1.0_20260106.pdf/.docx`). It is listed as a Jira attachment but no copy exists in the repo. Nothing below comes from the SRD.
5. **`lib/ticketStudies.ts`:** no entry for EAINT-9611.
6. **`_reference/tickets/EAINT-9611/`:** did not exist before this study.

## 1. Header

1. **Ticket:** EAINT-9611 — "⚪[eAuto-Insurance] To call API and policy inception date and premium updated before payment" (Jira Summary).
2. **Jira state:** "Status: Done", "Fix versions: S28.1-20260401🌚 (2026-04-01)", QA field "Teck Yung Chin". Deploy comment by the release coordinator, 2026-04-02: "This ticket has been deployed to production on 1 April 2026 (Wednesday)."
3. **Module / portal:** **eAuto Insurance** (UCD Insurance Quotation steps 1-4), checked across **UCD, BO, CIBO, eAuto Service Portal**.
4. **Workbook:** "EAINT-9611-⚪[eAuto-Insurance] To call API and policy inception date and premium updated before payment.xlsx", library "eAuto - CR Test Scenarios", modified 30/07/2026, 10:52:26 am.
5. **Sheets (2):**
   1. "Gross Premium change TS - eSIM" — **6 scenarios** (9611_PRICE_E2E_TS1-TS6).
   2. "Date Change TS - Insurance API" — **6 scenarios** (9611_DATE_E2E_TS1-TS6).
6. **Total:** **12 scenarios**, written as **43 step rows** with a result.
7. **Results:** **43 PASS, 0 FAIL.** Several PASS rows carry remarks describing things that did not work (see §6).
8. **Testers (column "Test Result", first of two):** Azfar, Teck Yung, Maisarah. No test dates are written in the sheet.
9. **Column layout:** "TS No. | Insurer | Entry Point (Trigger Point on sheet 2) | Test Objective | Category | Test Step | Expected Result | Test Result | Test Result | Remarks". First "Test Result" = tester, second = PASS/FAIL.

## 2. What the ticket changed, as the TS shows it

1. **Premium re-check before payment.** Clicking **[Pay Now]** after the insurer premium changed shows a **Price Update Notification** popup; [OK] reloads the page with the new price.
2. **Premium refresh on Step 3 and on Resubmit.** A premium changed between Step 2 and Step 3, or before a **Resubmit** from the Insurance Trx Listing, shows the new amount.
3. **Policy inception date = payment date.** If the UCD pays on a later day than the quotation, the **Period of Insurance** start moves to the payment date.
4. **Both new and existing transactions.** Each sheet has an "EXISTING TRANSACTIONS" block: quotation created **before deployment**, resumed **after deployment**.

## 3. Scenarios

### A. Sheet "Gross Premium change TS - eSIM" — NEW TRANSACTIONS

Each scenario runs the same 4 checkpoints: (a) price change Step 2 → Step 3 (e.g. RM 2000), (b) quit, change, **Resubmit** (e.g. RM 3000), (c) change before **[Pay Now]** → popup → new price (e.g. RM 4000) → pay → Approved, (d) final price on every page and document.

1. **9611_PRICE_E2E_TS1** — **Chubb**, Individual, entry "JPJ Enquiry = Failed due to VEL000069E". All checkpoints PASS (Azfar). R3-R6.
2. **9611_PRICE_E2E_TS2** — **Takaful (Comprehensive)**, Company, entry "Get a Free Quote (with Approved eSTM)". PASS (Teck Yung R7, Azfar R8-R10). R7-R10.
3. **9611_PRICE_E2E_TS3** — **Tokio Marine (CAR)**, Individual, entry "After eSTM Approval". PASS (Azfar). R11-R14.
4. **9611_PRICE_E2E_TS4** — **Tokio Marine (BIKE)**, Individual, entry "Get a Free Quote (with Approved eSTM)". PASS (Azfar). R15-R18.
5. **9611_PRICE_E2E_TS5** — **Lonpac**, Individual, entry "Insurance Page banner" ("Click on [Get Free Quote for {vn}]"). PASS (Azfar). R19-R22.

### B. Sheet "Gross Premium change TS - eSIM" — EXISTING TRANSACTIONS

6. **9611_PRICE_E2E_TS6** — **Chubb**, Company, "After eSTM Approval". Before deployment: "Proceed until Step 3 > Quit Step page" (R25). After deployment: change premium → Resubmit (RM 2000, R27), back to Step 2 → Step 3 (RM 3000, R28), Pay Now popup (RM 4000, R29), final pages (R30). All PASS (Teck Yung).

### C. Sheet "Date Change TS - Insurance API" — NEW TRANSACTIONS

Each scenario: reach Step 3, wait a day (natural or dev-patched), Resubmit/refresh, check Period of Insurance start = payment date, pay, check all pages and documents.

7. **9611_DATE_E2E_TS1** — **Chubb**, Company, "After eSTM Approval", natural 1-day wait. Expected: "The start date of the Period of Insurance is set to the payment date." PASS (Teck Yung). R3-R5.
8. **9611_DATE_E2E_TS2** — **Takaful (Firefox)**, Individual, "Get a Free Quote", dev patches Created Date. PASS (Teck Yung). R6-R8.
9. **9611_DATE_E2E_TS3** — **Tokio Marine**, Individual, "Get a Free Quote", dev patches Created Date; TS id carries "(Need dev to patch IC to get the quotation)". PASS (Teck Yung R9, Maisarah R10-R11). R9-R11.
10. **9611_DATE_E2E_TS4** — **Lonpac**, Individual, "Insurance Page banner", dev patches date then "refresh the page". PASS (Teck Yung R12, Maisarah R13-R14). R12-R14.
11. **9611_DATE_E2E_TS5** — **Chubb (Firefox)**, Individual, "JPJ Enquiry = Failed due to VEL000069E", objective "UCD make payment on the SAME day". PASS (Teck Yung). R15-R17.

### D. Sheet "Date Change TS - Insurance API" — EXISTING TRANSACTIONS

12. **9611_DATE_E2E_TS6** — **Takaful**, Company, "After eSTM Approval". Before deployment: "Proceed until Step 3 > Wait for 1 day (Natural case) > Use /eauto" (R20). After deployment: "Click Resubmit from Insurance Transaction Listing > Use /uat3" (R22), pay (R23). PASS (Teck Yung R20, Maisarah R22-R23).

## 4. Business rules and system behaviour

1. **Price popup text.** "Ensure Price Update Notification pop up is displayed, with content "Price has changed. Click OK to reload and view the updated pricing" with [OK] button" — sheet "Gross Premium change TS - eSIM", R5 (same in R9, R13, R17, R21, R29).
2. **Popup trigger point.** Steps "8. Before click on [Pay Now] button > Ask Dev to change Premium Amount on eSIM ⏎ 9. Click on [Pay Now] ⏎ 10. Click [OK] on Price Update Notification pop up" — sheet "Gross Premium change TS - eSIM", R5. The re-check fires **on Pay Now**, not on page load.
3. **Popup has one button.** Only "[OK]" is named — same sheet, R5. No Cancel is tested.
4. **Resubmit picks up the new price.** "Ensure the Premium Amount Price and Total Payment Amount are updated based on the Premium Amount changed by Dev (e.g. RM 3000)" — sheet "Gross Premium change TS - eSIM", R4.
5. **Resubmit price refresh was not settled.** Remark: "Pending dev and BA side to confirm whether we want the Resubmit button to trigger and show the price change or not" — sheet "Gross Premium change TS - eSIM", R27 (TS6, existing transaction). Row still marked PASS.
6. **Pages where the final premium must match.** "Ensure the Gross Premium Amount is the latest version and new Total Payment Amount is reflected in the following pages:" then "Insurance Quotation Page Step 4", "UCD Insurance Trx Listing", "BO Insurance Trx Listing > Export CSV", "CIBO Insurance Trx Listing", "eAuto Service Portal > Insurance Tab", "UCD eSTM Transaction Details Page", "UCD Insurance Details Page", "BO Insurance Details Page", "CIBO Insurance Details Page", "Insurance Invoice", "Insurance Downloadables (e.g. E-certificates, Policies)" — sheet "Gross Premium change TS - eSIM", R6.
7. **Inception date rule.** "The start date of the Period of Insurance is set to the payment date." — sheet "Date Change TS - Insurance API", R4.
8. **Worked example of the date rule.** "Quotation Date: 01/02/2026 ⏎ - Payment Date: 02/02/2026 ⏎ - Period of Insurance: 02/02/2026 – 01/02/2027" — sheet "Date Change TS - Insurance API", R4. Policy ends the day before the anniversary of the start.
9. **Date updates after a refresh.** "In Insurance Quotation – Step 3, after refreshing the page, ensure the Period of Insurance is updated correctly." — sheet "Date Change TS - Insurance API", R7 (also R10, R13, R16, R22).
10. **Insurance Invoice not viewable on staging (expected).** "Insurance Invoice cannot be viewed (Expected)" — sheet "Date Change TS - Insurance API", R5 remark.
11. **Downloadables are dummy on staging.** "Downloadables are returning dummy data so cannot be viewed as well." — same sheet, R5 remark; "Insurance Downloadables are dummy data" — R17 remark.
12. **Insurance missing on the eSTM details page.** "Insurance not displaying in eSTM Transaction Details Page." — same sheet, R5 remark; "Insurance is not displaying in eSTM" — R10, R13, R22 remarks.
13. **Service Portal tab depends on JPJ submission.** "Insurance not displayed in Service Portal since Submission status to JPJ keeps remaining in Pending status." — same sheet, R8 remark.
14. **CIBO invoice cannot be opened.** "Unable to to open Invoice in CIBO" — same sheet, R10 and R13 remarks; "Unable to download Invoice in CIBO" — R22 remark.
15. **Tokio Marine quote needs a dev patch.** "9611_DATE_E2E_TS3 ⏎ (Need dev to patch IC to get the quotation)" — sheet "Date Change TS - Insurance API", R9 TS No. cell.
16. **Listing rows appear before payment.** The Step-3 check (before any payment) expects the new price in "UCD Insurance Trx Listing", "BO Insurance Trx Listing > Export CSV", "CIBO Insurance Trx Listing" — sheet "Gross Premium change TS - eSIM", R3. Matches `knowledge/flow-insurance-purchase.md` line 750-754 (quotation is generated at step 3).

## 5. Test data, environments, setup

1. **Premium change is done by dev on eSIM.** "Ask Dev to change Premium Amount on eSIM" — sheet "Gross Premium change TS - eSIM", R4. TS1 R3 and TS6 R27-R28 say "Change Premium Amount on eSIM" without "Ask Dev".
2. **Day wait is simulated.** "Wait for 1 day (Ask dev to patch Created Date to 1 day before today's date)" — sheet "Date Change TS - Insurance API", R6. TS1 and TS6 use "Wait for 1 day (Natural case)" (R3, R20).
3. **Environments.** "Use /eauto" before deployment (R20) and "Use /uat3" after deployment (R22) — sheet "Date Change TS - Insurance API". [unconfirmed] At the time, /eauto held pre-deployment code and /uat3 held the change. This differs from today: staging now runs on the /eauto instance (memory "Staging = /eauto instance (from 2026-10-21)").
4. **Browsers.** "Takaful ⏎ (Firefox)" (R6) and "Chubb ⏎ (Firefox)" (R15), sheet "Date Change TS - Insurance API". Others browser not stated.
5. **Vehicle numbers (sheet "Date Change TS - Insurance API", Remarks):** "Test data = VFR6354" (R3), "VFM7324" (R6), "WQL8309" (R9), "VFQ8618" (R12), "VFU7759" (R15), "VFY8120" (R20). The price sheet records no vehicle numbers.
6. **Entry points used:** eSTM VEL000069E failure redirect, After eSTM Approval redirect, Get a Free Quote (same VN + Company Reg. No. as the eSTM), eSTM details Insurance banner "[Get Free Quote for {vn}]".
7. **Credentials:** none in the sheet.

## 6. Gaps or risks for regression

1. **PASS with open defects.** Rows R5, R8, R10, R13, R22 (date sheet) are PASS while remarks say insurance is missing on the eSTM details page, invoice cannot be opened in CIBO, and downloadables are dummy. **Invoice and downloadables were never truly checked** for the new date or price.
2. **Resubmit behaviour undecided.** R27 (price sheet) remark says dev/BA had not confirmed whether Resubmit should show the price change. No later row records the answer. [unconfirmed] whether production does it.
3. **No negative paths.** Not covered: price **unchanged** → no popup; price **decreased**; closing the popup without [OK]; double Pay Now.
4. **Date sheet scenario errors.**
   1. DATE_TS5 header is "Chubb ⏎ (Firefox)" but step 3 says "Select the Lonpac option" (R15).
   2. DATE_TS5 objective is "SAME day" but R16 says "After dev patch the date, refresh the page" and the expected example still uses a next-day payment date. The same-day case is not clearly separated.
5. **Price sheet scenario error.** PRICE_TS4 entry point is "Get a Free Quote (with Approved eSTM)" but its steps are the eSTM-redirect steps copied from TS3 (R15). Get a Free Quote for **bikes** is likely untested [unconfirmed].
6. **PRICE_TS2 R10 has no test step text** — only the expected result.
7. **Insurers not covered:** RHB, Allianz, Zurich and any insurer added since July 2026 [unconfirmed which are live]. Lonpac X-Star and Tokio Marine bike only in the price sheet.
8. **eSIM only.** The price sheet runs entirely on eSIM. The date sheet is titled "Connecting to Insurance API" but its steps also rely on dev patches. Real insurer API behaviour was not exercised.
9. **Midnight / multi-day edge.** Only 1-day gaps tested. Not covered: quotation several days old, quotation near month or year end, payment across midnight.
10. **Duplicate page in lists.** "eAuto Service Portal > Insurance Tab" appears twice in several expected lists (e.g. price sheet R6, R11). Harmless, but a sign the list was copy-pasted.

## Contradictions / additions to knowledge

1. **Scenario count.** `knowledge/cr-test-scenario-catalogue.md` row 105 says "Gross Premium change TS - eSIM:8; Date Change TS - Insurance API:8 | 16". The sheet holds **6 + 6 = 12** TS ids. The 8 likely counts rows incl. section banners [unconfirmed].
2. **Tester.** Catalogue row 105 names one tester; the sheet records **three** (Azfar, Teck Yung, Maisarah).
3. **Environment.** Catalogue row 105 says "uat3"; the sheet also uses **/eauto** for the before-deployment step (date sheet R20).
4. **Popup trigger.** `knowledge/eauto-insurance.md` line 233 says the popup shows "if the insurer price changed" but not **when**. The TS shows it fires on **[Pay Now]**.
5. **`flow-insurance-purchase.md` line 494** names `#pricing-changed-dialog` / `#pricingChangedMessage` — consistent with this ticket; the verbatim message text is not in that file.

## Knowledge candidates

1. **`knowledge/flow-insurance-purchase.md`, step 3 dialogs:** `#pricing-changed-dialog` text is "Price has changed. Click OK to reload and view the updated pricing", single [OK] button, fires on [Pay Now] after the insurer premium changed; came with EAINT-9611 (prod 1 April 2026). `[from SharePoint TS EAINT-9611, sheet Gross Premium change TS - eSIM, row 5]` Selector link to the dialog id is [unconfirmed] — the TS names the popup, not the DOM.
2. **`knowledge/flow-insurance-purchase.md`, Period of Insurance:** start date = payment date, end = start + 1 year − 1 day; example "Quotation Date: 01/02/2026 … Payment Date: 02/02/2026 … Period of Insurance: 02/02/2026 – 01/02/2027". Updates on Step 3 after a refresh or Resubmit. `[from SharePoint TS EAINT-9611, sheet Date Change TS - Insurance API, rows 4, 7]`
3. **`knowledge/eauto-insurance.md` or a staging-traps file:** on staging, Insurance Invoice "cannot be viewed (Expected)" and downloadables return "dummy data". `[from SharePoint TS EAINT-9611, sheet Date Change TS - Insurance API, row 5 remark]`
4. **`knowledge/eauto-insurance.md`:** insurance does not show on the Service Portal Insurance tab while "Submission status to JPJ keeps remaining in Pending status". `[from SharePoint TS EAINT-9611, sheet Date Change TS - Insurance API, row 8 remark]`
5. **`knowledge/esim.md`, test-data tricks:** dev can patch a quotation's **Created Date** to yesterday to simulate a 1-day wait: "Ask dev to patch Created Date to 1 day before today's date". Tokio Marine quotes may need "dev to patch IC to get the quotation". `[from SharePoint TS EAINT-9611, sheet Date Change TS - Insurance API, rows 6, 9]`
6. **`knowledge/cr-test-scenario-catalogue.md` row 105:** correct counts to 6 + 6 = 12 scenarios, 43 PASS rows; testers Azfar, Teck Yung, Maisarah; environments /eauto (before deployment) and /uat3 (after). `[from SharePoint TS EAINT-9611, both sheets]`
7. **Open question to carry:** whether Resubmit should refresh the premium — "Pending dev and BA side to confirm whether we want the Resubmit button to trigger and show the price change or not". `[from SharePoint TS EAINT-9611, sheet Gross Premium change TS - eSIM, row 27 remark]` Answer not found in any repo source.
