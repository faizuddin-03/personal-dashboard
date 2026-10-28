# EAINT-9786 — QA Team test script study (2026-10-28)

## Sources read

1. **Text copy of the workbook:** `_reference/sharepoint/qa-team-ts/EAINT-9786 - [eAuto-JomCheck] To Update Handling API Based on ezAuto Technical Spec 1.6 - 1.1.md` (generated 28/10/2026, 1:15:35 am). It holds cell text only. Formatting, colours and images are not kept, so they were not checked.
2. **Ticket folders:** `_reference/tickets/EAINT-9786/` held no files before this study. `_reference/tickets/Studying/EAINT-9786/` does not exist.
3. **lib/ticketStudies.ts:** no entry for EAINT-9786.
4. **knowledge/ (grep "9786"):** hits in `flow-jomcheck.md` §5a item 4, `business-rules-from-test-scenarios.md` §5 item 8, `cr-test-scenario-catalogue.md` row 112, and `production-regression-scope.md` §11.
5. **Not read:** the Jira ticket, its SRD, and the ezAuto Technical Spec 1.6. None are in the repo. This run is unattended, with no Jira access used.

## 1. Header

1. **Ticket:** EAINT-9786.
2. **Module / portal:** JomCheck. UCD portal (purchase + UCD JomCheck Transaction Listing) and BO (BO JomCheck Transaction Listing).
3. **Workbook:** "EAINT-9786 - [eAuto-JomCheck] To Update Handling API Based on ezAuto Technical Spec 1.6 - 1.1.xlsx". Library "eAuto - CR Test Scenarios", modified 19/03/2026, 9:26:29 am.
4. **Sheets:** one, "Sheet1".
5. **Columns (R1):** "TS No. | Trigger Point | Test Objective | Test Step | Expected Result | Test Result | Test Result | Remarks". The first "Test Result" column holds the tester name. The second holds the result. Remarks are empty in every row.
6. **Scenarios:** 3 (R3–R5). R2 is not in the text copy (blank row) [unconfirmed].
7. **Results:** **3 PASS, 0 FAIL.**
8. **Tester:** "Teck Yung" (all three rows). The catalogue lists "Chin Teck Yung" `[knowledge/cr-test-scenario-catalogue.md, row 112]`.
9. **Dates:** none written in the sheet. Only the file modified date (19/03/2026) is known.
10. **Production deployment:** "| EAINT-9786 | 20260302 | JomCheck API spec 1.6 | Part |" `[knowledge/production-regression-scope.md §11]`. "Part" = "existing data or part of the TS" `[same file, §11 legend]`.
11. **Date mismatch:** the workbook was last modified 19/03/2026, after the 02/03/2026 prod date. It was likely tidied after deployment [unconfirmed].

## 2. What the ticket changed, as the TS shows it

1. **API handling updated to ezAuto Technical Spec 1.6** (from the workbook title). The TS does not test the API directly. It tests only what the UCD user and BO see.
2. **Report layout:** the downloaded JomCheck report is "the latest version" with two fields that must hold values: "Avg Market Value" and "Approx. New Car Price" `[Sheet1, R3]`.
3. **New maintenance handling:** when JomCheck is under maintenance, UCD shows a "System Maintenance" popup and the transaction stays **Pending** with no Transaction No and no payment `[Sheet1, R4–R5]`.
4. **Two trigger points** for the maintenance popup: the **Submit** button and the payment popup **Yes** button `[Sheet1, R4–R5, column Trigger Point]`.

## 3. Scenarios

### A. Report layout

1. **9786_E2E_TS1** `[R3]` — Purchase a report (Submit → Pay Now → Yes) and download it. Expected: "Ensure, the JomCheck layout is the latest version with fields below having values: - Avg Market Value - Approx. New Car Price". **PASS.**

### B. System maintenance popup

1. **9786_E2E_TS2** `[R4]` — Trigger Point "Submit Button". Steps stop at "4. Click on Submit button". Expected: maintenance popup on UCD; UCD and BO listings show Transaction No "-", Payment "-", Tx Status "Pending", maintenance text in Remarks. **PASS.**
2. **9786_E2E_TS3** `[R5]` — Trigger Point "Payment Popup > Yes button". Steps go on to "5. Click on Pay Now button" and "6. Click on Yes option". Expected: identical to TS2, word for word. **PASS.**

## 4. Business rules and system behaviour the TS reveals

1. **Maintenance popup text** `[Sheet1, R4 and R5, Expected Result]`: "Content: Unable to retrieve JomCheck results due to system maintenance. Please try again later." and "Button: [X] [OK]".
2. **UCD JomCheck Transaction Listing after maintenance** `[Sheet1, R4 and R5]`: "Transaction No =  \"-\"", "Payment = \"-\"", "Tx Status = \"Pending\"", "e-Invoice Status = \"-\"", and "Remarks Column, error message: \"Unable to retrieve JomCheck results due to system maintenance. Please try again later.\" is displayed."
3. **BO JomCheck Transaction Listing after maintenance** `[Sheet1, R4 and R5]`: "Transaction No =  \"-\"", "Method = \"-\"", "Payment = \"-\"", "Tx Status = \"Pending\"", "LHDN Response Status = \"-\"", plus the same Remarks message.
4. **Column names differ by portal.** UCD has "e-Invoice Status"; BO has "LHDN Response Status" and an extra "Method" column `[Sheet1, R4]`.
5. **Maintenance at the Yes button gives the same result as at Submit.** TS3 expects Payment "-" and Tx "Pending" even after Pay Now + Yes `[Sheet1, R5]`. So no payment is recorded when maintenance hits at the payment step [unconfirmed — the TS does not say whether money was charged or the popup came before the payment call].
6. **Maintenance ≠ API down.** A different CR sets API down to "Jomcheck API is temporarily unavailable now, please try again in 10 minutes." → **Tx Failed** `[knowledge/flow-jomcheck.md §5a item 1.4, from EAINT-6475 Regression TS row 8]`. EAINT-9786 maintenance → **Tx Pending**. These are two separate paths with different messages and statuses.
7. **Report fields** `[Sheet1, R3]`: "- Avg Market Value" and "- Approx. New Car Price", listed as two separate fields that must have values.

### Where this differs from current knowledge

1. **Report fields quoted as one string.** `flow-jomcheck.md` §5a item 4 and `business-rules-from-test-scenarios.md` §5 item 8 write "Avg Market Value - Approx. New Car Price". The sheet lists them as **two separate fields** `[Sheet1, R3]`. The knowledge quote is not verbatim.
2. **Row citation incomplete.** Knowledge cites "rows 3-4" / "row 4" for maintenance. Maintenance covers **R4 and R5**. R5 (the Yes-button trigger) is not mentioned anywhere in knowledge.
3. **Missing fields in knowledge.** Knowledge lists only Transaction No, Payment and Tx Status. The sheet also expects e-Invoice Status "-" (UCD), Method "-" and LHDN Response Status "-" (BO), the Remarks message, and the "[X] [OK]" buttons.
4. **Catalogue count matches:** 3 scenarios `[cr-test-scenario-catalogue.md, row 112]`.

## 5. Test data, environments, accounts, setup

1. **Vehicle:** "Input valid vehicle number" only. No vehicle number is written `[Sheet1, R3–R5]`.
2. **Environment:** not stated in the sheet.
3. **Accounts:** a UCD login and a BO login are implied (both listings checked). None written. **No credentials present.**
4. **Maintenance setup:** not described. The TS does not say how maintenance was simulated (ezAuto stub, eSIM code, config flag) [unconfirmed].
5. **Navigation:** "Go to Jomcheck Report Module" → "Go to Purchase Jomcheck Report" `[Sheet1, R3, steps 1–2]`.

## 6. Gaps or risks a regression should still cover

1. **How to trigger maintenance** is not recorded. A regression cannot reproduce TS2/TS3 without it.
2. **Retry after maintenance:** no TS checks what happens to the Pending transaction when maintenance ends (Resubmit, a new purchase, or a cron reset). `flow-jomcheck.md` §5a item 3 says Pending shows no Resubmit (EAINT-9203).
3. **Payment state at TS3:** no check that the user was not charged, or that no e-Invoice was raised, beyond "-" in the listings.
4. **Report values:** TS1 only checks the two fields "having values". No check of correctness against ezAuto data, number format, or other fields in spec 1.6.
5. **Chassis search** path under maintenance is not covered. Only vehicle number is used.
6. **Service Portal** JomCheck (EAINT-10937, deployed later) is not covered by this TS. Whether it shows the same maintenance popup is unknown [unconfirmed].
7. **Popup [X] vs [OK]:** both buttons are listed, but no step checks what each does.
8. **Other spec 1.6 error codes:** only maintenance is tested. Other ezAuto responses changed by spec 1.6 (if any) are not visible in this TS.

## Knowledge candidates

1. **flow-jomcheck.md §5a item 4 and business-rules-from-test-scenarios.md §5 item 8 — correct the report-field quote.** Replace "Avg Market Value - Approx. New Car Price" with two fields: "Avg Market Value" and "Approx. New Car Price" `[from SharePoint TS #112 EAINT-9786, sheet Sheet1, R3]`.
2. **Same two entries — add the second trigger point.** Maintenance popup also fires at "Payment Popup > Yes button", with the same Pending / "-" result `[from SharePoint TS #112 EAINT-9786, sheet Sheet1, R5]`. Fix the row cite to R4–R5.
3. **Same two entries — add the full listing expectations.** UCD: "e-Invoice Status = \"-\"". BO: "Method = \"-\"", "LHDN Response Status = \"-\"". Both: Remarks column shows the maintenance message. Popup buttons "[X] [OK]" `[from SharePoint TS #112 EAINT-9786, sheet Sheet1, R4]`.
4. **flow-jomcheck.md §5a — note the maintenance vs API-down split.** Maintenance (EAINT-9786) → Tx "Pending"; API down (EAINT-6475) → Tx "Failed", with different messages `[from SharePoint TS #112 EAINT-9786, Sheet1 R4; and SharePoint TS #050 EAINT-6475, sheet Regression TS, row 8]`.
5. **flow-jomcheck.md — listing column names by portal.** UCD JomCheck Transaction Listing has "e-Invoice Status"; BO JomCheck Transaction Listing has "Method" and "LHDN Response Status" `[from SharePoint TS #112 EAINT-9786, sheet Sheet1, R4]`. Verify against live HTML before using as selectors [unconfirmed].
