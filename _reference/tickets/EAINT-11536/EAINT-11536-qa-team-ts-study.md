# EAINT-11536 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study of another QA engineer's TS. Nothing here was checked against the live system.

## Sources read

1. **TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-11536-🔴[eAuto-Pre-Application and Application] To Add Two Columns for Pre-Application Listing and Application Listing.md` (captured 27/10/2026, 8:41:04 pm). Cell text only; colours, comments and images not kept.
2. **Jira capture:** `_reference/tickets/Studying/EAINT-11536/EAINT-11536-jira.md` (27/10/2026, 5:29:10 pm).
3. **Jira capture of the second sheet's ticket:** `_reference/tickets/Studying/EAINT-11829/EAINT-11829-jira.md`.
4. **Knowledge:** `knowledge/flow-ucd-onboarding.md` (rules 5-6, lines 405-415; BO URLs lines 249-251), `knowledge/business-rules-from-test-scenarios.md` (lines 798-806), `knowledge/cr-test-scenario-catalogue.md` (rows 014, 018), `knowledge/eauto-portals.md` (line 342-343), `knowledge/production-regression-scope.md` (line 933).
5. **Not read:** the SRD. Jira lists "SRD_EAINT-11536_..._v1.0_20260525.docx" and ".pdf" (Lim Yi Link, 2026-05-25), but no copy exists in the repo. Column order, date format and TAT rules below come from the TS only.
6. **lib/ticketStudies.ts:** no EAINT-11536 entry (grep returned nothing).

## 1. Header

1. **Ticket:** EAINT-11536 — "🔴[eAuto-Pre-Application and Application] To Add Two Columns for Pre-Application Listing and Application Listing". Task, Status **Done**, Fix version "S30.9-20260630 🌚 (2026-06-30)" (Jira capture, item 4).
2. **Module / portal:** **BackOffice** — "UCD Pre-Application Listing" and "UCD Application Listing" (sheet EAINT-11536, column Page). Jira: "Affected Module | Pre-Application and Application Listing" (Description row 2).
3. **Workbook:** "EAINT-11536-🔴[eAuto-Pre-Application and Application] To Add Two Columns for Pre-Application Listing and Application Listing.xlsx", library "eAuto - CR Test Scenarios", modified 30/06/2026, 11:44:56 am. Catalogue id **#014**.
4. **Sheets:** 2.
   1. **EAINT-11536** — 10 scenarios (115366_TS01 to TS10), 40 step rows.
   2. **EAINT-11829** — a different ticket (application expiry cronjob bug) kept in the same workbook: 15 scenarios (11829_TS01 to TS15) + 7 natural-case scenarios (NAT11829_TS01 to TS07) = **22 scenarios**.
5. **Results:** **all rows PASS** on both sheets (40/40 on EAINT-11536; 22/22 on EAINT-11829). No Fail, no blank result.
6. **Testers (QA column):** sheet EAINT-11536 — "Azfar" (TS01-03, TS05, TS09-10) and "Aliah" (TS04, TS06-08). Sheet EAINT-11829 — "AZFAR"/"Azfar" on every row. Jira QA field: "Muhammad Amirul Azfar Bin Kamarulazam".
7. **Dates in the sheet:** no test dates. Only date written: "Natural Case - Need to wait until ((30/06/2026) 12 a.m.)" (sheet EAINT-11829, row 24). Jira: "ETA for Testing (cf 10057): 2026-06-26", "Exp. Deploy Date (cf 10087): 2026-06-30".
8. **Note on TS ids:** sheet EAINT-11536 numbers scenarios "115366_TS01" ... "115366_TS10" — an extra "6" versus the ticket key 11536. Treat as a typo [unconfirmed].

## 2. What the ticket changed (as the TS shows it)

1. **Two new columns** on both BO listings and their Excel export: **Approved Date** and **Turn Around Time (Days)** (sheet EAINT-11536, row 3).
2. **Formula** from Jira: "Turn Around Time (Days) – TAT = Approval Date - Submission Date  (If system displays "0", it means it is approved on same day as submission date)" (Jira Description, Request row 3).
3. **Old behaviour:** "The current listing does not display the Approved Date and Turn Around Time (Days) columns" (Jira Description, row 4).
4. **Pre-Application Listing placement:** "Column should be place between Pre-Application Status and Turn Around Time (Days)" (sheet EAINT-11536, row 4).
5. **Application Listing placement:** "Column should be placed between Application Submission Date and Application Expiry Date" (sheet EAINT-11536, row 20).
6. **Export:** "Ensure an Excel file with the two new columns (Approved Date & Turn Around Time (Days)) is downloaded" (sheet EAINT-11536, row 6, and every Export step).
7. **Second sheet (EAINT-11829):** the expiry cronjob must not expire Approved applications whose "Hardcopy & Acc Created" = Registered. Jira 11829: "The cronjob should exclude applications where Hardcopy & Acc Created = "Registered" from the auto-expiry logic." (EAINT-11829 Description, Expected Behaviour).

## 3. Scenarios

### Sheet EAINT-11536 — Section A, New Transactions

Each scenario has 4 checks: record listed with both new columns → Approved Date → TAT → Export.

1. **115366_TS01** — Pre-App Listing, Sdn Bhd / Bhd, status **New**. Approved Date and TAT both "Should display '-'." (rows 3-6).
2. **115366_TS02** — Pre-App Listing, Sole Proprietorship / Partnership, **Rejected** by Superadmin. "Should display '-' as Pre-Application was rejected, not approved" (rows 7-10).
3. **115366_TS03** — Pre-App Listing, LLP, **Approved same day**. Approved Date in "DD MMM YYYY HH:MM AM/PM (e.g. 3 Dec 2025 1:02 PM)"; TAT "Should display '0' as Approval Date = Submission Date (same day approval)" (rows 11-14).
4. **115366_TS04** — Pre-App Listing, Business Trading (Sabah), **Approved after 5 days**. TAT "Should display '5' (TAT = Approval Date - Submission Date = 5 days)" (rows 15-18).
5. **115366_TS05** — Application Listing, Business Trading (Sarawak), Application **New**. Both columns "Should display '-' as Application has not been approved yet" (rows 19-22).
6. **115366_TS06** — Application Listing, Sdn Bhd / Bhd, Application **Rejected**. Both "Should display '-' as Application was rejected, not approved" (rows 23-26).
7. **115366_TS07** — Application Listing, Sole Proprietorship / Partnership, **Approved same day**. TAT "Should display '0'" (rows 27-30).
8. **115366_TS08** — Application Listing, Sdn Bhd / Bhd, **Approved after 80 days**. TAT "Should display '80' (TAT = Approval Date - Submission Date = 80 days)" (rows 31-34).

### Sheet EAINT-11536 — Section B, Existing Transactions

9. **115366_TS09** — existing (pre-deployment) record, Approved same day. Approved Date shows the date; TAT "Should display '0'" (rows 38-41).
10. **115366_TS10** — existing record approved after deployment. TAT "Should display the TAT (Days) = Approval Date - Submission Date (number of days since the pre-deployment submission)" (rows 42-45).

### Sheet EAINT-11829 — Section A, will be expired by cronjob after 90 days

11. **11829_TS01 to TS08** — statuses New, Draft, Pending, Re-evaluate, and Approved with Hardcopy & Acc Created "-", "Pending UCD", "Pending UCD - Incomplete Docs", "Pending Assignee". Expected: "Cronjob updates Application Status to "Expired" after 90 days" + "Expired email notification received" + "OB link → Application Link Expired popup displayed → Redirect to Application Link Expired page" (rows 3-10).
12. **11829_TS09** — already **Expired**. "Application is already Expired cronjob makes no further change" + "NO additional email notification sent" (row 11).

### Sheet EAINT-11829 — Section B, will NOT be expired (exceptions)

13. **11829_TS10** — **Rejected**. "After 90 days Application Status will remain as Rejected" + "Application Link redirect to Application Payment Success page" (row 13).
14. **11829_TS11** — **Approved + Registered**. "After 90 days Application Status will remain as Approved" + "Will NOT received OB form link expired email notification" (row 14).

### Sheet EAINT-11829 — Section C, existing applications

15. **11829_TS12, TS13** — Pending; Approved + Pending UCD → Expired (rows 16-17).
16. **11829_TS14** — Approved + "Registred" (typo in sheet) → stays Approved (row 18).
17. **11829_TS15** — Rejected → stays Rejected (row 19).

### Sheet EAINT-11829 — Natural case (no status patch, real cron run)

18. **NAT11829_TS01 to TS05** — Approved (-, Pending UCD, Pending UCD - Incomplete Docs, Pending Assignee) and Pending → Expired (rows 25-29).
19. **NAT11829_TS06** — Approved + Registered → stays Approved (row 30).
20. **NAT11829_TS07** — Rejected → stays Rejected (row 31).

## 4. Business rules and system behaviour

1. **Not approved = dash.** New and Rejected records show "-" in both columns, in the listing and in the export (sheet EAINT-11536, rows 4-6, 8-10, 20-22, 24-26).
2. **Date format:** "Should display the Approval Date in format: DD MMM YYYY HH:MM AM/PM (e.g. 3 Dec 2025 1:02 PM)" (sheet EAINT-11536, row 12). Same text rows 16, 28, 32, 39, 43.
3. **Same-day = 0:** "Should display '0' as Approval Date = Submission Date (same day approval)" (sheet EAINT-11536, row 13).
4. **TAT is whole days** [unconfirmed]: the TS only shows integers ('0', '5', '80'). Whether it counts calendar dates or 24-hour blocks is not stated.
5. **Application TAT start point:** for the Application Listing the approval is "Superadmin Approved the OB form on the same day as Submission Date" (sheet EAINT-11536, row 27). The submission date is the OB form submission, not the Pre-Application one [unconfirmed].
6. **Backfill:** existing pre-deployment approved records also show the Approved Date and TAT (sheet EAINT-11536, rows 39-40). So the values come from stored data, not only new events [unconfirmed].
7. **Expiry cronjob — what expires:** New, Draft, Pending, Re-evaluate, and Approved where Hardcopy & Acc Created is "-", "Pending UCD", "Pending UCD - Incomplete Docs" or "Pending Assignee" (sheet EAINT-11829, rows 3-10).
8. **Expiry cronjob — what does not:** Rejected and Approved + "Registered" (sheet EAINT-11829, rows 13-14). Already Expired: "NO additional email notification sent" (row 11).
9. **Expired link behaviour:** "OB link → Application Link Expired popup displayed → Redirect to Application Link Expired page" (sheet EAINT-11829, row 3).
10. **Not-expired link behaviour:** "Application Link redirect to Application Payment Success page" — for both Rejected (row 13) and Approved + Registered (row 14). The Rejected case landing on "Payment Success" looks odd; accepted as PASS by the tester [unconfirmed whether intended].
11. **80-day approval stays inside the 90-day expiry window** (sheet EAINT-11536, row 31) — consistent with the 90-day cron in sheet EAINT-11829.

## 5. Test data, environments, setup

1. **Environment:** not written in either sheet. Jira 11829 says "Environment: Production" for the bug report only. Test environment [unconfirmed — likely staging/UAT].
2. **Accounts:** "Superadmin" for approve/reject; "Ops" submits OB form for Superadmin approval (sheet EAINT-11536, row 23). No logins or passwords in the sheet — **no credentials present**.
3. **Dev patching:** TS04 "ask dev to patch the Submission Date" (row 15). TS08 80-day gap — method not written [unconfirmed, likely also patched]. All 11829 rows except the natural case "Ask dev to patch Application Status" and "Ask dev to patch Submission Date to 90 days before today".
4. **Cronjob:** "Wait for / trigger cronjob run" (sheet EAINT-11829, row 3).
5. **Records named in sheet EAINT-11536:**
   1. TS04 Pre-Application No "P260629/00666" (row 15).
   2. TS08 Application No "NA66001069" (row 31).
   3. TS09 Trx No "NA66001047" (row 38).
   4. TS10 Trx No "P260425/00623" and example "P260616/00636" (rows 42, 42 step 1).
6. **Records named in sheet EAINT-11829:** P260626/00644, P260626/00645, P260626/00646 / NA66001054, P260626/00647 / NA66001055, NA66001049 to NA66001052, NA66001056 to NA66001059, NA63001016, NA64001045, NA65001046, NA66001062 to NA66001068.
7. **Business types:** all five covered on sheet EAINT-11536 — Sdn Bhd / Bhd, Sole Proprietorship / Partnership, LLP, Business Trading (Sabah), Business Trading (Sarawak).

## 6. Gaps and risks for regression

1. **TS09 / TS10 page mismatch.** TS09 Page = "UCD Application Listing" but steps open "UCD Pre-Application Listing" and use Trx "NA66001047" (an Application number format) (rows 38-39). TS10 Page = "UCD Pre-Application Listing" but steps open "UCD Application Listing" with Trx "P260425/00623" (a Pre-Application format) and a different example "P260616/00636" (row 42). Which listing each existing-record case really covered is unclear.
2. **Existing records only in Approved state.** No existing New, Rejected or Pending record was checked for the "-" display after deployment.
3. **TAT boundary not tested.** No case for submit late night, approve after midnight (1 calendar day, under 24 hours). Rule 4 above is unconfirmed.
4. **Re-evaluate / KIV / Revise / Expired** statuses on the listing columns not covered. An Expired or re-activated application's Approved Date/TAT is unknown.
5. **Re-approval** (reject then re-submit then approve) not covered — which date wins is unknown.
6. **Search filters / sorting** on the new columns not tested; only search by number.
7. **Export only checked for one record** per scenario; a bulk export with mixed statuses was not tested.
8. **Pre-Application vs Application approval dates** are separate per listing; no scenario checks that approving the Application does not change the Pre-Application row (or the reverse).
9. **Rows R35-R36 and R20-R23 (11829 sheet) are absent** in the text copy — likely blank rows, not lost scenarios [unconfirmed].
10. **11829 step numbering:** natural cases skip step 3 ("2. Ask dev ... ⏎ 4. Wait for", rows 25-29), and NAT rows still say "Ask dev to patch Submission Date", so "natural" here means no status patch only [unconfirmed].

## 7. Fit with existing knowledge

1. `knowledge/flow-ucd-onboarding.md` rule 6 (line 412) and `business-rules-from-test-scenarios.md` line 798 already hold the date format, TAT formula and "-" rule. **No contradiction.**
2. Both say "(sheet rows 4-20 cover the columns)"; in the text copy the scenarios run rows 3-45. Minor citation drift, not a fact conflict.
3. **Missing from flow-ucd-onboarding rule 6:** the Application Listing placement ("between Application Submission Date and Application Expiry Date", row 20) and the Pre-App placement (row 4). The catalogue row 014 has it; the flow file does not.
4. Rule 5 (expiry cronjob) matches this sheet. It lists only Rejected and Approved + Registered as exceptions; the sheet also confirms **Draft and Re-evaluate do expire** (rows 4, 6) — not yet in knowledge.
5. Catalogue row 014 names only "Amirul Azfar"; the sheet shows a second tester on TS04, TS06-08.
6. Catalogue row 014 gives "EAINT-11829:24"; the text copy holds 22 scenarios (15 + 7 natural).

## Knowledge candidates

1. **Listing column placement (EAINT-11536)** → add to `knowledge/flow-ucd-onboarding.md` rule 6: Pre-App "Column should be place between Pre-Application Status and Turn Around Time (Days)" (sheet EAINT-11536, row 4); Application "Column should be placed between Application Submission Date and Application Expiry Date" (sheet EAINT-11536, row 20). Source: SharePoint TS #014.
2. **Both columns are in the Excel export** of both listings: "Ensure an Excel file with the two new columns (Approved Date & Turn Around Time (Days)) is downloaded" (sheet EAINT-11536, row 6). Source: SharePoint TS #014.
3. **Pre-deployment approved records show values** (backfill) — sheet EAINT-11536, rows 39-40. Tag [from SharePoint TS #014], behaviour mechanism [unconfirmed].
4. **Expiry cronjob status list** → extend rule 5: New, Draft, Pending, Re-evaluate, and Approved with Hardcopy & Acc Created "-" / "Pending UCD" / "Pending UCD - Incomplete Docs" / "Pending Assignee" are expired (sheet EAINT-11829, rows 3-10).
5. **Hardcopy & Acc Created values seen:** "Pending UCD", "Pending UCD - Incomplete Docs", "Pending Assignee", "Registered" (sheet EAINT-11829, rows 8-10, 14).
6. **Application status values seen:** New, Draft, Pending, Re-evaluate, Approved, Expired, Rejected (sheet EAINT-11829, column Application Status).
7. **Catalogue corrections** (`knowledge/cr-test-scenario-catalogue.md` row 014): second tester on TS04, TS06-08; 11829 sheet holds 22 scenarios, not 24.
8. **Open question for the team** (do not add as fact): does a Rejected application's OB link really open "Application Payment Success page" (sheet EAINT-11829, row 13)?
