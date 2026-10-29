# EAINT-4328 — QA Team test script study (2026-10-27)

## 1. Header

1. **Ticket:** EAINT-4328.
2. **Module / portal:** eSTM. Portals: **UCD**, **BackOffice (BO)**, **Service Portal**. eSIM used for setup (STMS Enquiry response code).
3. **Workbook:** "EAINT-4328 - [eAuto-eSTM] Remove Dari & Hingga column in first page of Slip Pengesahan and Hak Milik.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 26/06/2026, 3:46:56 pm.
4. **Sheets:** "Test Scenario", "Slip Pengesahan".
5. **Scenarios:** 24 unique ids.
   1. "Test Scenario": 17 rows (R2–R18), ids 4328_TS01–4328_TS16. 4328_TS01 is on two rows (R2, R3).
   2. "Slip Pengesahan": 8 rows (R2–R9), ids SP_4328_TS01–SP_4328_TS08.
6. **Results:** all 25 rows **Pass**. No Fail, no blank result.
7. **Tester:** QA column says "Aliah" on every row. No run dates written in the sheet. Only date is the SharePoint modified date (26/06/2026).
8. **Deployment:** production 20260630, per "| EAINT-4328 | 20260630 | eSTM Slip Pengesahan Dari/Hingga | Yes |" (knowledge/production-regression-scope.md:938).

## 2. What the ticket changed, as the TS shows it

1. **Butir-butir Hak Milik document:** the **eBAYARAN JPJ** table drops the **Dari** and **Hingga** columns for new transactions. New column order: "1 Bil ⏎ 2 Kod Terimaan ⏎ 3 Kod Terimaan JPJ ⏎ 4 No. Rujukan ⏎ 5 Keterangan ⏎ 6 Amaun(RM)" (Test Scenario, R3).
2. **Existing transactions** keep the old 8-column table with Dari and Hingga (Test Scenario, R9, R11, R13, R15, R17, R18).
3. **Slip Pengesahan:** content does not change. Every Slip row says "The Slip Pengesahan details will remain as is." (Test Scenario R4; Slip Pengesahan R2–R9).
4. **Title vs TS:** the title says "Remove Dari & Hingga column in first page of Slip Pengesahan and Hak Milik", but no row checks a Dari/Hingga removal on the Slip Pengesahan. The Slip rows only check "remain as is" and the eLKM table. [unconfirmed] Scope was narrowed to Hak Milik only; see the open comment in §4.

## 3. Scenarios

### a. New eSTM transaction — BO and UCD (sheet "Test Scenario")

1. **4328_TS01 (R2)** — BO Details Page after triggering Hak Milik. Expected: "Ensure the Print & Butir-butir Hak Milik button is available & clickable".
2. **4328_TS01 (R3)** — BO, click Butir-butir Hak Milik. Expected: 6-column eBAYARAN JPJ table; "The columns named "Dari" & "Hingga" is removed".
3. **4328_TS02 (R4)** — BO, click Print. Expected: Slip Pengesahan "will remain as is"; TEMPOH SAH LESEN KENDERAAN MOTOR table shown only with eLKM.
4. **4328_TS03 (R5)** — UCD Details Page, click Butir-butir Hak Milik. Expected: buttons clickable; 6 columns; Dari & Hingga removed.
5. **4328_TS04 (R6)** — UCD, click Slip Pengesahan. Expected: as TS02.

### b. New eSTM transaction — Service Portal

1. **4328_TS05 (R7)** — Ownership Claim Listing → View. Expected: "System will display the Butir-butir Hak Milik document"; 6 columns; Dari & Hingga removed.
2. **4328_TS06 (R8)** — Ownership Claim Enquiry → Search. Expected: same as TS05.

### c. Existing eSTM, Hak Milik not yet triggered

1. **4328_TS07 (R9)** — BO: trigger Hak Milik now, then download. Expected: 8 columns incl. "5 Dari ⏎ 6 Hingga"; "The columns named "Dari" & "Hingga" remained unchanged".
2. **4328_TS08 (R10)** — BO, click Print. Expected: Slip "will remain as is"; eLKM table rule.
3. **4328_TS09 (R11)** — UCD, same transaction. Expected: 8 columns; Dari & Hingga "remained unchanged".
4. **4328_TS10 (R12)** — UCD, click Slip Pengesahan. Description cell is **blank**. Expected: Slip "will remain as is"; eLKM table rule.

### d. Existing eSTM, Hak Milik already triggered

1. **4328_TS11 (R13)** — BO, download Hak Milik. Expected: 8 columns; Dari & Hingga "remained unchanged".
2. **4328_TS12 (R14)** — BO, click Print. Expected: Slip "will remain as is"; eLKM table rule.
3. **4328_TS13 (R15)** — UCD, download Hak Milik. Expected: 8 columns; unchanged.
4. **4328_TS14 (R16)** — UCD, click Slip Pengesahan. Expected: Slip "will remain as is"; eLKM table rule.

### e. Existing eSTM — Service Portal

1. **4328_TS15 (R17)** — Ownership Claim Listing, "eSTM transaction that is before the deployment date" → View. Expected: "Ensure the Butir-butir Hak Milik is displayed"; 8 columns; unchanged.
2. **4328_TS16 (R18)** — Ownership Claim Enquiry → Search. Expected: same as TS15.

### f. Slip Pengesahan — new transactions (sheet "Slip Pengesahan")

1. **SP_4328_TS01 (R2)** — UCD, new eSTM with eLKM, click Slip Pengesahan. Expected: "If eSTM transaction includes eLKM transaction, display the TEMPOH SAH LESEN KENDERAAN MOTOR table."
2. **SP_4328_TS02 (R3)** — BO, same case, click Print. Expected: same as SP_TS01.
3. **SP_4328_TS03 (R4)** — UCD, new eSTM "DON'T purchase eLKM". Expected: "If the eSTM transaction does not include eLKM transaction, the TEMPOH SAH LESEN KENDERAAN MOTOR table will not be displayed."
4. **SP_4328_TS04 (R5)** — BO, same case, click Print. Expected: same as SP_TS03.

### g. Slip Pengesahan — existing transactions by created date (BO)

1. **SP_4328_TS05 (R6)** — created "BEFORE NOV 2025". Expected: "Ensure that the Slip Pengesahan follows the old format and includes the eBAYARAN JPJ page. ⏎ The columns Dari & Hingga in the eBAYARAN JPJ will remain unchanged".
2. **SP_4328_TS06 (R7)** — created "BETWEEN NOV 2025 - FEB 2026". Expected: "Ensure that the Slip Pengesahan follows the old format and but DOES NOT include the eBAYARAN JPJ page."
3. **SP_4328_TS07 (R8)** — created "AFTER MARCH 2026", eLKM purchased. Expected: TEMPOH SAH table shown.
4. **SP_4328_TS08 (R9)** — created "AFTER MARCH 2026", eLKM not purchased. Expected: TEMPOH SAH table not shown.

## 4. Business rules and system behaviour

1. **New Hak Milik column set.** "In the table section of eBAYARAN JPJ, ensure the correct columns are displayed following the sequence: ⏎ 1 Bil ⏎ 2 Kod Terimaan ⏎ 3 Kod Terimaan JPJ ⏎ 4 No. Rujukan ⏎ 5 Keterangan ⏎ 6 Amaun(RM) ⏎ ⏎ The columns named "Dari" & "Hingga" is removed" (Test Scenario, R3).
2. **Old column set kept for existing transactions.** "1 Bil ⏎ 2 Kod Terimaan ⏎ 3 Kod Terimaan JPJ ⏎ 4 No. Rujukan ⏎ 5 Dari ⏎ 6 Hingga ⏎ 7 Keterangan ⏎ 8 Amaun(RM) ⏎ ⏎ The columns named "Dari" & "Hingga" remained unchanged" (Test Scenario, R9, R11, R13, R15, R17, R18).
3. **Old layout holds even when Hak Milik is triggered after deploy.** Group "Existing eSTM transaction ⏎ Have not trigger Hak Milik" (Test Scenario, R9) triggers the document now ("4. Trigger the Hak Milik.") and still expects Dari & Hingga. [unconfirmed] The layout is decided by the **transaction's** age, not the date the document is generated.
4. **eLKM controls a Slip table.** "If eSTM transaction includes eLKM transaction, display the TEMPOH SAH LESEN KENDERAAN MOTOR table." / "If the eSTM transaction does not include eLKM transaction, the TEMPOH SAH LESEN KENDERAAN MOTOR table will not be displayed." (Test Scenario, R4; Slip Pengesahan, R2, R4).
5. **Slip Pengesahan has three date-based formats.**
   1. "Created date is BEFORE NOV 2025" → "follows the old format and includes the eBAYARAN JPJ page" (Slip Pengesahan, R6).
   2. "Created date is BETWEEN NOV 2025 - FEB 2026" → "follows the old format and but DOES NOT include the eBAYARAN JPJ page" (Slip Pengesahan, R7).
   3. "Created date is AFTER MARCH 2026" → eLKM-driven TEMPOH SAH table (Slip Pengesahan, R8, R9).
6. **Button names differ by portal.** BO Details Page: "Ensure the Print & Butir-butir Hak Milik button is available & clickable" (Test Scenario, R2). UCD: "Ensure the Slip Pengesahan & Butir-butir Hak Milik button is available & clickable" (Test Scenario, R5). BO "Print" downloads the Slip Pengesahan (Test Scenario, R4).
7. **BO can trigger Hak Milik from the listing.** "5. Navigate to eSTM Transaction Listing. Trigger the Hak Milik in the listing" (Test Scenario, R2).
8. **Service Portal shows Hak Milik in two places:** "Ownership Claim Listing" with "View hyperlink in the action column" (R7) and "Ownership Claim Enquiry" with "Search button" (R8). Both display the document rather than download it: "System will display the Butir-butir Hak Milik document." (Test Scenario, R7, R8).
9. **Open scope question, no answer in the sheet.** Comment cell on R2: "* confirm with BA if this changes only applies to eSTM & Hak Milik only" (Test Scenario, R2, column after Test Result).

## 5. Test data, environments, setup

1. **Environment:** none named in the sheet. Catalogue records "none named" (knowledge/cr-test-scenario-catalogue.md:164).
2. **Credentials:** none in the sheet. Logins named by role only: "Login as UCD", "Login as BackOffice", "Login as Service Portal".
3. **eSIM setup for a new transaction:** "* Ensure Vehicle No does NOT have 4K error in STMS Enquiry in e-sim ⏎ 3. After completing transaction, change response code in STMS Enquiry (e-sim) to 4K." (Test Scenario, R2). Code 4K makes the Hak Milik cronjob buy the document from JPJ (knowledge/esim.md:590).
4. **eLKM purchase toggle:** "Create new eSTM transaction & purchase eLKM" (Slip Pengesahan, R2) vs "Create new eSTM transaction & DON'T purchase eLKM" (Slip Pengesahan, R4).
5. **Existing data by date band:** BO listing searched "From & TO date to before NOV 2025", "between NOV 2025 to FEB 2026", "AFTER MARCH 2026" (Slip Pengesahan, R6–R9). These are wider than one month; the house rule caps date filters at one month per search.
6. **Existing data by Hak Milik state:** "Identify existing transaction where Hak Milik have not been triggered before" (R9) and "where Hak Milik has been triggered before" (R13).

## 6. Gaps and risks for regression

1. **March 2026 boundary is not covered.** Bands stop at "FEB 2026" and restart "AFTER MARCH 2026" (Slip Pengesahan, R7, R8). A transaction created in March 2026 has no row. [unconfirmed] Whether "AFTER MARCH" includes March.
2. **No exact cut-off date for the Hak Milik change.** Only "before the deployment date" (Test Scenario, R17). Prod deploy was 20260630 (production-regression-scope.md:938). No row tests a transaction on the deploy day.
3. **No Dari/Hingga check on the Slip Pengesahan "first page"**, despite the ticket title. Only "remain as is".
4. **Service Portal for existing, not-yet-triggered transactions** is not checked (TS15/TS16 use any pre-deploy transaction).
5. **Hak Milik = E path** (bought inside the eSTM flow) is not covered. All new-transaction rows use the 4K cronjob path (= J). See knowledge/flow-estm.md:727-729.
6. **Pass shown with no evidence or date** in the text copy. Screenshots, if any, are not kept in the text copy.
7. **Sheet hygiene:** 4328_TS01 is used twice (R2, R3); 4328_TS10 has a blank description (R12); step numbers skip "4" in SP_4328_TS05 and SP_4328_TS06 (R6, R7); step numbers in 4328_TS02, TS08, TS10, TS12, TS14 continue from the row above, so those rows are not standalone.
8. **BA scope comment (R2) has no recorded answer.** Other JPJ modules that print a Butir-butir Hak Milik were not checked by this TS.

## 7. Comparison with existing knowledge

1. **knowledge/flow-estm.md:711-714** says "documents triggered before the change keep Dari and Hingga". The TS goes further: existing transactions triggered **after** the change (Test Scenario, R9, R11) also keep them. The note should say "existing transactions", not "documents triggered before the change". [unconfirmed] until checked on screen.
2. **knowledge/flow-estm.md:716-720** and **business-rules-from-test-scenarios.md:199-203** cite Slip rows "2-7" / "2, 4". Matches this read. The "AFTER MARCH 2026" band (R8, R9) is not mentioned there.
3. **knowledge/cr-test-scenario-catalogue.md:164** says "Test Scenario:16; Slip Pengesahan:8 | 24". Matches unique id count; the Test Scenario sheet has 17 data rows because TS01 spans two.
4. **knowledge/production-regression-scope.md:398** — prod check: "existing eSTM from three date bands, "ensure remain unchanged"". Matches the Slip sheet bands.
5. No conflict found with knowledge/flow-stms.md (STMS, not eSTM).

## Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-4328 - [eAuto-eSTM] Remove Dari & Hingga column in first page of Slip Pengesahan and Hak Milik.md` — text copy dated 27/10/2026, 8:45:23 pm. Cell text only; formatting and images not kept.
2. `knowledge/flow-estm.md` (lines 695-734), `knowledge/business-rules-from-test-scenarios.md` (grep), `knowledge/cr-test-scenario-catalogue.md:164, 386`, `knowledge/production-regression-scope.md:390-409, 938`, `knowledge/esim.md:590`.
3. `_reference/tickets/EAINT-4328/` — did not exist before this study.
4. `_reference/tickets/Studying/EAINT-4328/` — does not exist.
5. `lib/ticketStudies.ts` — no entry for EAINT-4328.
6. **Not read:** the original .xlsx, the Jira ticket and the SRD (not available to this run).

## Knowledge candidates

1. **flow-estm.md — widen the Hak Milik rule.** Existing eSTM transactions keep Dari & Hingga even when Hak Milik is first triggered after the change. Source: "Existing eSTM transaction ⏎ Have not trigger Hak Milik" + "4. Trigger the Hak Milik." + "The columns named "Dari" & "Hingga" remained unchanged" `[from SharePoint TS EAINT-4328, sheet Test Scenario, row 9]`. Tag [unconfirmed] on the "transaction age decides" reading.
2. **flow-estm.md — third Slip band.** "Created date is AFTER MARCH 2026" → eLKM-driven TEMPOH SAH LESEN KENDERAAN MOTOR table `[from SharePoint TS EAINT-4328, sheet Slip Pengesahan, rows 8-9]`. March 2026 itself is untested.
3. **flow-estm.md — BO vs UCD button names.** BO: "Print & Butir-butir Hak Milik"; UCD: "Slip Pengesahan & Butir-butir Hak Milik" `[from SharePoint TS EAINT-4328, sheet Test Scenario, rows 2, 5]`.
4. **flow-estm.md / eauto-service-hub or Service Portal file — two Service Portal entry points** for Hak Milik: "Ownership Claim Listing" (View hyperlink in action column) and "Ownership Claim Enquiry" (Search button); both display, not download `[from SharePoint TS EAINT-4328, sheet Test Scenario, rows 7-8]`.
5. **flow-estm.md — BO manual trigger.** "Navigate to eSTM Transaction Listing. Trigger the Hak Milik in the listing" `[from SharePoint TS EAINT-4328, sheet Test Scenario, row 2]`.
6. **Open question to log:** "confirm with BA if this changes only applies to eSTM & Hak Milik only" — no answer recorded `[from SharePoint TS EAINT-4328, sheet Test Scenario, row 2 comment]`.
