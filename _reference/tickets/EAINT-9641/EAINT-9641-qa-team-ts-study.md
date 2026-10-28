# EAINT-9641 — QA Team test script study (2026-10-28)

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9641-⚪[eAuto-Insurance] To update Chubb API based on latest e-Cover Motor API Specifications V1.7 - Update TIN as Mandatory Field.md` (captured 28/10/2026, 1:08:14 am). Cell text only; formatting and images not kept.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-9641/EAINT-9641-jira.md` (27/10/2026).
3. **Knowledge:** `knowledge/eauto-insurance.md` (lines 230-232, 641-642), `knowledge/cr-test-scenario-catalogue.md` (rows 72, 460), `knowledge/business-rules-from-test-scenarios.md` (lines 436-438), `knowledge/production-regression-scope.md` (line 999), `knowledge/flow-insurance-purchase.md`.
4. **`lib/ticketStudies.ts`:** no EAINT-9641 entry.
5. **Not read:** the SRD (`SRD_EAINT-9641_..._20260114_V1.0.docx` / `.pdf`) and `API_PrivateCar_v1.7.pdf` are listed as Jira attachments but no copy exists in the repo. Figma link not opened.

## 1. Header

1. **Ticket:** EAINT-9641 — "⚪[eAuto-Insurance] To update Chubb API based on latest e-Cover Motor API Specifications V1.7 - Update TIN as Mandatory Field" `[Jira capture, Summary]`.
2. **Jira state:** "Status: Done", "Fix versions: S28.1-20260401🌚 (2026-04-01)", "QA (cf 10041): Teck Yung Chin", "[QA] Est Man-day (cf 10081): 2" `[Jira capture, fields 2, 3, 4, 7]`.
3. **Module / portal:** **UCD Insurance** (quotation steps 1-4), with checks on **BO** and **CIBO** insurance listing and details pages `[Sheet1, R3-R7, Expected Result]`.
4. **Workbook:** "EAINT-9641-⚪[eAuto-Insurance] To update Chubb API based on latest e-Cover Motor API Specifications V1.7 - Update TIN as Mandatory Field.xlsx", library "eAuto - CR Test Scenarios", modified 24/03/2026, 5:22:48 pm.
5. **Sheets:** one — **Sheet1**.
6. **Scenarios:** **4** (9641_E2E_TS1 to TS4), in two sections: "E2E Flow - Happy Flow" `[Sheet1, R2]` and "E2E Flow - Happy Flow (Regression Test)" `[Sheet1, R4]`.
7. **Results:** **4 PASS, 0 FAIL** `[Sheet1, R3, R5, R6, R7, second "Test Result" column]`.
8. **Tester:** "Teck Yung" in the first "Test Result" column on every row `[Sheet1, R3-R7]`. No test dates in the sheet.
9. **Column layout:** "TS No. | Insurer | Trigger Point | Test Objective | Category | Test Step | Expected Result | Test Result | Test Result | Remarks" `[Sheet1, R1]`. The header has two "Test Result" columns; the first holds the tester name, the second the outcome.

## 2. What the ticket changed, as the TS shows it

1. **Chubb quotation gets a TIN NO field that is MANDATORY** when reached after eSTM approval for a Company vehicle: "Ensure TIN NO field is MANDATORY" `[Sheet1, R3, Expected Result 3]`.
2. **Blank TIN blocks payment:** "Users SHOULD not be able to make payment and proceed to Step 4 when TIN NO is not input." `[Sheet1, R3, Expected Result 3]`.
3. **TIN entered is carried to UCD, BO and CIBO Insurance Details pages** `[Sheet1, R3, Expected Result 4]`.
4. **Other insurers are regression only.** Takaful (Comprehensive) keeps TIN optional `[Sheet1, R5]`; Lonpac and the Individual Chubb path do not show TIN `[Sheet1, R6, R7]`.

## 3. Scenarios

### A. E2E Flow - Happy Flow

1. **9641_E2E_TS1** — Chubb, "After eSTM Approval", Company. Checks TIN mandatory on Chubb. Expected: "An error message "This field is required" will be displayed under the TIN NO field." and TIN shown correctly on UCD/BO/CIBO details. **PASS** `[Sheet1, R3]`.

### B. E2E Flow - Happy Flow (Regression Test)

1. **9641_E2E_TS2** — Takaful (Comprehensive), "Get a Free Quote", Company. Checks TIN optional. Expected: "Users SHOULD be able to make payment and proceed to Step 4 even when TIN NO is not input, with no error displayed." **PASS** `[Sheet1, R5]`.
2. **9641_E2E_TS3** — Chubb, "JPJ Enquiry = Failed due to VEL000069E", Individual. Expected: "Ensure TIN NO field is NOT Displayed". **PASS** `[Sheet1, R6]`.
3. **9641_E2E_TS4** — Lonpac, "Insurance Page banner", Individual. Expected: "Ensure TIN NO field is NOT Displayed". **PASS** `[Sheet1, R7]`.

## 4. Business rules and system behaviour

1. **Chubb + Company + after eSTM approval = TIN mandatory.** "Ensure TIN NO field is MANDATORY, where when TIN NO = blank: - An error message "This field is required" will be displayed under the TIN NO field." `[Sheet1, R3, Expected Result 3]`.
2. **Takaful + Company + Get a Free Quote = TIN optional.** "Ensure TIN NO field is OPTIONAL" `[Sheet1, R5, Expected Result 3]`.
3. **Blank TIN shows a dash.** "If TIN NO = Blank in Step 3, the TIN NO SHOULD be displaying "-" in: - UCD Insurance Details Page - BO Insurance Details Page - CIBO Insurance Details Page" `[Sheet1, R5, Expected Result 4]`.
4. **TIN hidden on Individual rows.** "TIN NO field SHOULD NOT be displayed in: - UCD Insurance Details Page - BO Insurance Details Page - CIBO Insurance Details Page" `[Sheet1, R6 and R7, Expected Result 5]`.
5. **What hides TIN is unclear.** R6 (Chubb) and R7 (Lonpac) are both "Individual" `[Sheet1, R6, R7, Category]`, and R1-R5 Company rows show it. The cause is likely **vehicle category (Individual)**, not the VEL000069E trigger or the insurer [unconfirmed]. The SRD was not read to settle this.
6. **TIN is captured in Step 3.** "If TIN NO = Not Blank in Step 3" `[Sheet1, R5, Expected Result 4]`.
7. **Four insurance entry points are used:** "After eSTM Approval" `[R3]`, "Get a Free Quote" `[R5]`, "JPJ Enquiry = Failed due to VEL000069E" `[R6]`, "Insurance Page banner" `[R7]` `[Sheet1, Trigger Point]`.
8. **Get Free Quote reuses eSTM data.** "Enter the same VN and Company Reg. Number used for eSTM Trx" `[Sheet1, R5, Test Step 3]`.
9. **Banner button text.** "Click on [Get Free Quote for {vn}]" `[Sheet1, R7, Test Step 3]`.
10. **JPJ submission can stay Pending on staging.** "Submission Status to JPJ keeps staying at Pending status for long time" `[Sheet1, R5, Remarks]`. Already in `knowledge/eauto-insurance.md:641`.

## 5. Test data, environments, accounts, setup

1. **Vehicle numbers:** "Chrome - PNY4942 ⏎ Firefox - VFJ6731" `[Sheet1, R3, Remarks]`.
2. **Browsers:** Chrome and Firefox on TS1 `[Sheet1, R3, Remarks]`; Chrome on TS2 `[Sheet1, R5, Remarks]`; not stated on TS3/TS4.
3. **Environment:** not written in the sheet. **Credentials:** none present.
4. **Setup:** each case first creates an "eSTM + eVOC Transaction" `[Sheet1, R3, R6, R7, Test Step 1]`. TS3 needs a JPJ enquiry that fails with VEL000069E `[Sheet1, R6, Test Step 1]`.

## 6. Gaps or risks a regression should still cover

1. **Chubb + Company on other entry points** (Get a Free Quote, Insurance Page banner, VEL000069E) — not tested; only "After eSTM Approval" was `[Sheet1, R3]`.
2. **Chubb + Individual after eSTM approval** — not tested, so the Individual-hides-TIN rule is not proven separately from the VEL000069E path.
3. **Other insurers + Company** (Lonpac, Takaful TPFT, others) — TIN behaviour not covered.
4. **TIN format validation** (length, characters, spaces) — not covered; only blank vs filled.
5. **Chubb API payload** — no check that TIN is sent to Chubb per API v1.7; only UI and details pages checked [unconfirmed whether this was checked off-sheet].
6. **Resubmit / pending step-3 row** — no case covers resuming a Chubb quote saved without TIN.
7. **Production regression:** listed as "| EAINT-9641 | 20260401 | Chubb API TIN | Yes |" `[knowledge/production-regression-scope.md:999]`.

## 7. Knowledge vs this TS

1. **`knowledge/eauto-insurance.md:230-232`** says TIN is "not displayed on the VEL000069E path". The sheet also marks that row "Individual" `[Sheet1, R6, Category]`, and Lonpac Individual hides it too `[R7]`. The cause may be category, not path [unconfirmed].
2. **`knowledge/cr-test-scenario-catalogue.md:72`** gives "Sheet1:6 | 6" — that is the row count. The sheet holds **4 scenarios** (R3, R5, R6, R7).
3. **`knowledge/flow-insurance-purchase.md`** has no TIN field, no selector and no Step 3 company-details note. Gap; no live HTML of Step 3 with TIN exists in `_reference/html/`.

## Knowledge candidates

1. **`knowledge/eauto-insurance.md` — TIN dash rule:** "If TIN NO = Blank in Step 3, the TIN NO SHOULD be displaying "-" in: - UCD Insurance Details Page - BO Insurance Details Page - CIBO Insurance Details Page" `[from SharePoint TS EAINT-9641, Sheet1, R5, Expected Result 4]`.
2. **`knowledge/eauto-insurance.md` — refine TIN line 230:** add that R6 and R7 are "Individual" `[Sheet1, R6, R7, Category]`; tag the "VEL000069E path" cause as [unconfirmed] until the SRD is read.
3. **`knowledge/eauto-insurance.md` — Takaful TIN optional:** "Ensure TIN NO field is OPTIONAL" for Takaful (Comprehensive), Company, Get a Free Quote `[Sheet1, R5]`.
4. **`knowledge/flow-insurance-purchase.md` — Step 3 TIN field:** TIN NO entered in Step 3; blank on Chubb gives "This field is required" under the field and blocks Step 4 `[Sheet1, R3, R5]`. Selector unknown — needs a Step 3 HTML capture.
5. **`knowledge/flow-insurance-purchase.md` — banner button text:** "[Get Free Quote for {vn}]" `[Sheet1, R7, Test Step 3]`.
6. **`knowledge/cr-test-scenario-catalogue.md:72` — count fix:** 4 scenarios, not 6 `[Sheet1, R3, R5, R6, R7]`.
7. **SRD to drop in:** `SRD_EAINT-9641_..._20260114_V1.0.pdf` and `API_PrivateCar_v1.7.pdf` `[Jira capture, Attachments]` — needed to confirm which condition hides TIN.
