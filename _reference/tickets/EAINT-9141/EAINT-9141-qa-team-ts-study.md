# EAINT-9141 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9141 - ⚪[eAuto][Insurance][Web] Update UI for Chubb MY CAR – Standard Plan to Plus Plan (OUTDATED).md` (cell text only; colours, images and dropdowns not kept).
2. **Jira capture:** `_reference/tickets/Studying/EAINT-9141/EAINT-9141-jira.md` (captured 27/10/2026).
3. **Knowledge:** `knowledge/business-rules-from-test-scenarios.md` §6.3 item 4–5, `knowledge/cr-test-scenario-catalogue.md` row 092, `knowledge/eauto-payments.md:151`, `knowledge/flow-payments-fees.md:70`, `knowledge/flow-insurance-purchase.md` (Step 2, Step 3, status vocabulary, expiry), `knowledge/production-regression-scope.md:1008`.
4. **lib/ticketStudies.ts:** no EAINT-9141 entry; mentioned only as related to EAINT-8767 (line 398, 403).
5. **Not read:** the SRD (`SRD_EAINT-9141_Web_UI_Update_Chubb_V1.4_20260205.docx/.pdf`), the Chubb PDFs and the Figma links. None are in the repo; listed in the Jira capture only.

## 1. Header

1. **Ticket:** EAINT-9141 — "⚪[eAuto][Insurance][Web] Update UI for Chubb MY CAR – Standard Plan to Plus Plan" (Jira summary). Status **Done**.
2. **Deployed:** Jira comment, reporter, 2026-03-12: "This ticket has been deployed to production on 11.03.2026 (Wednesday)." Fix version "S27.4-20260311🌚 (2026-03-11)".
3. **Module / portal:** **UCD Insurance** (quotation steps 1–4, Insurance Homepage, Insurance Transaction Listing), plus **BO** listing/details checks. Jira also names CIBO and Service Portal (see §6).
4. **Workbook:** "EAINT-9141 - ⚪[eAuto][Insurance][Web] Update UI for Chubb MY CAR – Standard Plan to Plus Plan (OUTDATED).xlsx", library "eAuto - CR Test Scenarios", modified 27/02/2026, 5:38:42 pm. Marked **(OUTDATED)** in its own file name.
5. **Sheets (5):** "Overall Progress", "Sheet1", "E2E Flow (TY)", "UI Change (Insurance Quotation)", "UI Change (Insurance Homepage)".
6. **Scenario count:**
   1. **E2E Flow (TY):** 7 ids (9141_E2E_TS1–TS7), 14 rows.
   2. **UI Change (Insurance Quotation):** 7 ids (9141_VD_TS1–TS7), 9 rows.
   3. **UI Change (Insurance Homepage):** 3 ids (9141_INSH_TS01, TS02, TS12).
   4. **Sheet1:** one empty row "TS1".
   5. **Overall Progress** totals "23" (Overall Progress R7) = 14 + 9 rows. **Homepage sheet is not counted.**
7. **Results:** every scenario row reads **"Not Started"**. No Pass or Fail recorded.
8. **Tester / dates:** no tester or test date written in cells. Sheet name "E2E Flow (TY)" carries initials [unconfirmed: matches one of the two QA engineers in the Jira QA field]. Test environment cell is blank ("Test environment:", Sheet1 R3).

## 2. What the ticket changed, as the TS shows it

1. **Chubb product rename:** "The Motor Product name is changed from COMPREHENSIVE to PRIVATE CAR (ENHANCED)" (UI Change (Insurance Quotation) R6).
2. **New plan / add-on:** "Insurance Plan is updated to MY Car Plus (Pro)" and "MY Car Plus (Pro) additional pricing (RM100.00) is reflected under the Quotation Summary" (E2E Flow (TY) R5).
3. **New Chubb logo** on Step 1 card, Insurance Homepage Contact Info and its popup (UI Change (Insurance Quotation) R6; UI Change (Insurance Homepage) R3–R4).
4. **Step 1 card:** "Market Value : RM XXXX (ISM-ABI recommended)" and a note tooltip ( i ) with Eligibility and under/over-insurance wording (UI Change (Insurance Quotation) R6).
5. **Step 1 [+More Info] popup** sections: "Towing", "Drivers cover", "Road assistance", "Additional highlights", "More information" (R6).
6. **Step 2 plan block and quotation wording**, new disclaimers, commission line (R10–R11).
7. **Step 3 quotation wording** and a long BNM-style disclaimer plus "+more" text (R14–R15). Jira V1.4 row: "To add BNM requirements from Chubb feedback" [unconfirmed: link between the two].
8. **Step 4 confirm page wording** for success and failure (R18, R20–R21).
9. **Old open transactions** to show "Quotation Expired" after deployment (E2E Flow (TY) R12, R14, R16, R18).

## 3. Scenarios

### 3a. E2E Flow (TY) — new transactions

1. **9141_E2E_TS1** (R5–R6, Individual) — eSTM+eVOC → Chubb → tick all optional coverage → Step 3 → back to Step 2 → payment fails, then resubmit from listing. Expected: "All previously selected optional coverages must remain Checked."; after Failed "The insurance transaction is NOT displayed in Insurance Trx Listing in UCD & BO."; after resubmission "UI reflects updated Chubb plan name MY Car Plus (Pro)."

### 3b. E2E Flow (TY) — existing transactions (before CR → after CR)

1. **9141_E2E_TS2** (R8–R9, Individual) — Insurance Created before CR. Expected: status "will remain the same after CR deployment"; downloadables "present and downloadable".
2. **9141_E2E_TS3** (R10–R11, Individual) — Quotation Expired before CR (wait 24 hours). Expected: stays "Quotation Expired"; downloadables "must NOT be present and downloadable."
3. **9141_E2E_TS4** (R12–R13, Individual) — Failed before CR; after CR verify "Quotation Expired", then new purchase via **JPJ Enquiry = Failed due to VEL000069E** path to Insurance Created.
4. **9141_E2E_TS5** (R14–R15, **Company**) — Pending Payment before CR; after CR verify "Quotation Expired", then new eSTM+eVOC purchase to Insurance Created.
5. **9141_E2E_TS6** (R16–R17, Individual) — status patched to "Quotation" by developer; after CR verify "Quotation Expired", then **Get A Free Quote** with same VN and IC to Insurance Created.
6. **9141_E2E_TS7** (R18–R19, **Company**) — status patched to "Pending Approval"; after CR verify "Quotation Expired", then Get A Free Quote; R19 step 11 ends at "Insurance Trx Status = Approved".

### 3c. UI Change (Insurance Quotation)

1. **9141_VD_TS1** (R6) — Step 1 via eSTM+eVOC: logo, product name, Market Value, tooltip, popup sections, More Information links. Expected includes "Ensure the Personal Data Protection Notice is available in English and Bahasa Malaysia (BM)."
2. **9141_VD_TS2** (R7) — same checks via Get A Free Quote.
3. **9141_VD_TS3** (R10–R11) — Step 2 plan block, All Drivers default, Make Payment popup, quotation wording.
4. **9141_VD_TS4** (R14–R15) — Step 3 quotation wording, discount lines, disclaimer, "+more" text. R14 and R15 are identical.
5. **9141_VD_TS5** (R18) — Step 4 success wording: "Thank you! Your payment has been successfully made."
6. **9141_VD_TS6** (R20) — Step 4 payment failed via eSTM: one button "Try Again", link "Go to Insurance Transaction Listing", no Refund & Cancellation.
7. **9141_VD_TS7** (R21) — Step 4 payment failed via Get A Free Quote: link "Skip, Return to eSerahan" that "redirects the user back to eSTM Transaction details page."

### 3d. UI Change (Insurance Homepage)

1. **9141_INSH_TS01** (R3) — "Chubb Logo is updated to the latest version."
2. **9141_INSH_TS02** (R4) — Chubb Contact Info popup: new logo; "Brochure Hyperlink is displaying the new Brochure for My Car Plus plan."
3. **9141_INSH_TS12** (R6) — "Takaful pop up is displayed and all details are displayed correctly." (regression check of the other insurer popup).

## 4. Business rules and system behaviour

1. **Add-on price:** "MY Car Plus (Pro): RM100.00" (UI Change (Insurance Quotation) R11).
2. **Step 2 plan block:** "Company: Chubb Insurance Malaysia Berhad (197001000564)", "Excess: RM 0.00" (R10).
3. **All Drivers default:** "All Drivers option, is pre-selected by default AND CAN BE UNTICKED" (R10).
4. **All Drivers popup on Make Payment:** "Please be advised that if a customer does not wish to include All Drivers in their policy, it is essential to untick the All Drivers." with "Buttons: [X] [Cancel] [Proceed]" (R10). Matches the `#alldriver-tick` advisory already in `knowledge/flow-insurance-purchase.md:430`.
5. **Commission:** "Commission (10%) > 10% from Gross Premium" (R11).
6. **Step 3 discount lines:** "10% Gross Premium Discount:" and "Total Nett Premium After Discount:" (R14). "+more" text: "The 10% gross premium discount is provided by the agent, Bintang Prospek." (R14). Matches `#platformDiscountLabel` in `flow-insurance-purchase.md:490-491`.
7. **Agent disclaimer:** "This product is underwritten by Chubb Insurance Malaysia Berhad and Bintang Prospek is the authorized agent of Chubb Insurance Malaysia Berhad" (R11).
8. **Market Value source:** Remarks, R6: "Market Value will be deprived from the ISM data response. Market Value should be reflected at the time of the GET_VEH_DETAILS(VIX) API under MARKETVALUE field."
9. **Optional coverage persistence:** "The MY Car Plus (Pro) RM100.00 charge must remain visible and not revert/reset." (E2E Flow (TY) R5).
10. **Failed rows hidden:** after payment Failed, "The insurance transaction is NOT displayed in Insurance Trx Listing in UCD & BO." (E2E Flow (TY) R5). This conflicts with R12: "The insurance transaction is displayed in Insurance Trx Listing in UCD & BO with Payment Status = Failed, Trx Status = Failed." [unconfirmed: which is correct].
11. **Old statuses expire on deployment:** "Ensure that the insurance transaction before CR deployment with the status below, will all display "Quotation Expired" status after CR deployment. - Pending Payment - Failed - Quotation - Quotation Expired - Pending Approval" (E2E Flow (TY) R12, R14, R16, R18). Insurance Created stays: "will remain the same after CR deployment" (R8).
12. **24-hour expiry:** "Wait for 24 hours > Payment = " - " > Insurance Trx Status = Quotation Expired" (E2E Flow (TY) R10). Matches `flow-insurance-purchase.md:549-554`.
13. **Downloadables by status:** present for Insurance Created (R9); "must NOT be present and downloadable" for Quotation Expired, Failed, Pending Payment, Quotation, Pending Approval (R11, R12, R14, R16, R18).
14. **Quotation / Pending Approval cannot be reached by UI:** "Ask Developer to patch the trx status to "Quotation"" (R16) and "to "Pending Approval"" (R18). Supports the `[unconfirmed]` DRAFT note in `flow-insurance-purchase.md:530-537`.
15. **Payment-failed page, two entry points differ:** eSTM path link "Go to Insurance Transaction Listing" (UI Change (Insurance Quotation) R20); Get A Free Quote path link "Skip, Return to eSerahan" (R21). Both: "ONLY one button is displayed on the page: - Try Again" and "Ensure Refund & Cancellation section is  NOT display".
16. **RHB maintenance error:** "Error Code: NP - Sistem Pembayaran RHB dibawah penyelengaraan antara 10.30mlm - 8.30pg. Sila buat bayaran bermula 8.30 esok pagi." (R20, R21). Already in `knowledge/eauto-payments.md:151`.
17. **Success page wording:** "Your insurance will be created shortly. A copy of the e-certificate will be sent to your registered email by the insurance provider." (R18).
18. **Chubb contact number in tooltip:** "please contact Chubb's customer service at (1800- 88-3226)" (R6).

## 5. Test data, environments, accounts, setup

1. **Environment:** not stated ("Test environment:" blank, Sheet1 R3).
2. **Accounts / credentials:** none in the sheet.
3. **Data:** "Ensure that a valid VN is available and eligible for generating Chubb insurance quotations." (UI Change (Insurance Quotation) R6). Get A Free Quote rows reuse "the same VN and IC No for the failed insurance transaction before deployment of CR changes" (E2E Flow (TY) R17).
4. **Category mix:** Individual (TS1, TS2, TS3, TS4, TS6) and Company (TS5, TS7).
5. **Setup needing developer help:** status patches to "Quotation" and "Pending Approval" (R16, R18).
6. **Setup needing time:** 24-hour wait for Quotation Expired (R10).
7. **Before/after deployment pairs:** "Note: Remember to screenshot the transactions failed before the CR deployment" (R8, R10, R12, R14, R16, R18).
8. **Reference material:** "Can refer to EAINT-9141 > Materials (PDF)" (UI Change (Insurance Homepage) R3–R4).

## 6. Gaps and risks for regression

1. **CIBO and Service Portal not covered.** Jira V1.2: "To add changes in CIBO and Service Portal". Bug sub-tasks EAINT-10034 "[eAuto - Service Portal] UI issues found in Insurance tab" and EAINT-10036 "[CIBO] UI issues found in Insurance Transaction Listing Details page" show those portals changed. No TS row tests them.
2. **BO Insurance Quote Enquiry not covered.** Sub-task EAINT-10032 "[eAuto - BO] UI issues found in Insurance Quote Enquiry for Chubb Quotation".
3. **eSTM transaction details not covered.** Sub-task EAINT-9452 "UI in the Backoffice and eSTM transaction details still display with old Insurance Plan".
4. **All Drivers untick not asserted on the quotation panel.** Sub-task EAINT-10077 "All Drivers row not hide when unticked". TS only checks it "CAN BE UNTICKED".
5. **Commission value** had a bug (EAINT-10076 "Commission value display incorrectly"); TS gives no formula beyond "10% from Gross Premium".
6. **Workbook is OUTDATED and never executed** — all rows "Not Started". Final SRD V1.4 (2026-02-05) wording may differ from the TS. [unconfirmed]
7. **Copy-paste errors in the TS:**
   1. "Takaful Plan: My Car Plus (Pro)" and precondition "eligible for generating Takaful insurance quotations" on Chubb rows (R10–R21).
   2. VD_TS6 / VD_TS7 steps say "After sucessful make payment" but expect the Payment Failed page (R20–R21).
   3. TS3 step: "make payment > Payment = OK > Insurance Trx Status = Pending Payment" (E2E Flow (TY) R10).
   4. "Gross Premium:" listed twice (R11, R14).
   5. Sheet1 objective "To verify the availability of 'Resubmit' action in UCD & BO based on each statuses" (Sheet1 R5) belongs to another ticket.
   6. Old pre-CR transactions (TS2–TS7 after-CR rows) expect "UI reflects updated Chubb plan name MY Car Plus (Pro)" — doubtful for a policy bought before the change. [unconfirmed]
8. **Failed-row visibility conflict** (§4 item 10) — a regression should confirm whether Failed rows show in the listing.
9. **Takaful quotation flow** — only the Takaful popup on the homepage is checked; no check that Takaful Step 2–4 wording was untouched.
10. **Brochure/PDS links** go to external chubb.com URLs (Jira Materials (URL)); they can change without an eAuto release.

## Contradictions / additions to existing knowledge

1. `knowledge/flow-insurance-purchase.md:425-426` gives plan example "Private Car Secure - Comprehensive" for the Step 2 plan block. For Chubb after 11.03.2026 the TS expects "PRIVATE CAR (ENHANCED)" / "My Car Plus (Pro)". [unconfirmed: the example may be another insurer's card].
2. `knowledge/flow-insurance-purchase.md:500-503` says Step 4 "Not captured yet". This TS gives the expected Step 4 wording (§4 items 15–17), not the DOM.
3. `knowledge/flow-insurance-purchase.md:571-572` points to EAINT-9141 for the "which statuses expire" rule. The rule there is a one-off deployment behaviour on old rows, not the ongoing 24-hour cron. [unconfirmed]
4. `lib/ticketStudies.ts:398` already quotes this: "EAINT-9141 TS said Failed and Pending Approval also become Quotation Expired." Consistent with §4 item 11.

## Knowledge candidates

1. **Payment-failed page link depends on entry point.** eSTM path: "Go to Insurance Transaction Listing"; Get A Free Quote path: "Skip, Return to eSerahan" → eSTM Transaction details page. Source: SharePoint TS EAINT-9141, sheet UI Change (Insurance Quotation), R20 and R21. Target: `knowledge/flow-insurance-purchase.md` Step 4. Note: TS is OUTDATED and unexecuted.
2. **Step 4 success wording.** "Thank you! Your payment has been successfully made." and "Your insurance will be created shortly. A copy of the e-certificate will be sent to your registered email by the insurance provider." Source: sheet UI Change (Insurance Quotation), R18. Target: `flow-insurance-purchase.md` Step 4.
3. **Chubb Market Value source.** "Market Value should be reflected at the time of the GET_VEH_DETAILS(VIX) API under MARKETVALUE field." Source: sheet UI Change (Insurance Quotation), R6 Remarks. Target: `knowledge/eauto-insurance.md`.
4. **Chubb Step 2 identity lines.** "Company: Chubb Insurance Malaysia Berhad (197001000564)", "Excess: RM 0.00", commission "10% from Gross Premium", agent "Bintang Prospek". Source: same sheet, R10–R11. Target: `eauto-insurance.md`.
5. **Quotation and Pending Approval need a dev patch on staging.** "Ask Developer to patch the trx status to "Quotation"" / "to "Pending Approval"". Source: sheet E2E Flow (TY), R16 and R18. Target: `flow-insurance-purchase.md` status vocabulary (supports the DRAFT `[unconfirmed]` note).
6. **Downloadables only on Insurance Created.** Source: sheet E2E Flow (TY), R9 vs R11, R12, R14, R16, R18. Target: `flow-insurance-purchase.md` Steps 5–6.
7. **CR scope beyond UCD.** EAINT-9141 also changed CIBO, Service Portal, BO Quote Enquiry and eSTM details (Jira description V1.2 row; sub-tasks EAINT-9452, 10032, 10034, 10036). Target: `knowledge/production-regression-scope.md` row for EAINT-9141.
8. **Failed-row listing visibility conflict.** E2E Flow (TY) R5 "NOT displayed" vs R12 "displayed ... Trx Status = Failed". Add as an open lead, `[unconfirmed]`, to `flow-insurance-purchase.md`.
