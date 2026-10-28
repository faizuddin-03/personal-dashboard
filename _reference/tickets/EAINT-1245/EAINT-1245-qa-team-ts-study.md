# EAINT-1245 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-1245 - [eAuto-BackOffice] JomCheck Transaction Listing - Payment To Finetuning.md` (text copy taken 27/10/2026, 8:06:36 pm; cell text only, no formatting or images).
2. **Knowledge:** `knowledge/flow-jomcheck.md` §5 item 7 and §"BO transaction enquiry"; `knowledge/business-rules-from-test-scenarios.md` row 7; `knowledge/cr-test-scenario-catalogue.md` row 043; `knowledge/production-regression-scope.md` §11.2.
3. **Captured HTML:** `_reference/html/eauto/bo-jomcheck-transaction-enquiry-datepicker.html` (header comment only, for the date inputs).
4. **Not found:** no `_reference/tickets/EAINT-1245/` folder before this study, no `_reference/tickets/Studying/EAINT-1245/`, no entry in `lib/ticketStudies.ts`.
5. **Not read:** Jira ticket and SRD (scheduled run has no Jira access; no SRD on disk).

## 1. Header

1. **Ticket:** EAINT-1245.
2. **Title in sheet:** "EAINT - 1245 - [eAuto-BackOffice] JomCheck Transaction Listing - "Payment To" Finetuning" `[Sheet1, R1]`.
3. **Portal / module:** **BackOffice (BO)**, JomCheck transaction listing under "Transaction Relevant" `[Sheet1, R3, Test Steps]`.
4. **Workbook:** "EAINT-1245 - [eAuto-BackOffice] JomCheck Transaction Listing - Payment To Finetuning.xlsx", library "eAuto - CR Test Scenarios", modified 10/08/2026, 2:13:29 pm.
5. **Sheets:** 1 — "Sheet1".
6. **Columns:** "TS No. | Scenario | Test Steps | Expected Result | QA | Test Result | Remark" `[Sheet1, R2]`.
7. **Scenarios:** **5** (1245_TS1 to 1245_TS5).
8. **Results:** **5 Pass, 0 Fail** `[Sheet1, R3–R7, Test Result]`. Remark column empty on every row.
9. **Tester:** "Maisarah" on every row `[Sheet1, R3–R7, QA]`. No test dates in the sheet.
10. **Last file editor:** a QA team member listed in `knowledge/cr-test-scenario-catalogue.md` row 043 (not the tester).
11. **Production deployment:** 20260630, verified "Yes" `[knowledge/production-regression-scope.md §11.2]`.

## 2. What the ticket changed, as the TS shows it

1. The BO JomCheck transaction listing filter has a **Payment From / Payment To** date pair.
2. **Payment To auto-fills** once Payment From is chosen: today's date, or From + 30 days when From is more than 30 days back `[Sheet1, R3–R5]`.
3. The Payment To picker **blocks future dates** and **blocks dates beyond 30 days** from From `[Sheet1, R6–R7]`.
4. [unconfirmed] Purpose: cap every search at a 30-day window. The TS does not state the reason.

## 3. Scenarios

### A. Payment To auto-select

1. **1245_TS1** — From within 30 days before today → "Payment To field is auto-select to today's date" `[R3]`.
2. **1245_TS2** — From more than 30 days before today → "Payment To field is auto-select to date afetr 30 days" `[R4]` (typo "afetr" is in the sheet).
3. **1245_TS3** — From = today → "Payment To field is auto-select to today's date" `[R5]`.

### B. Payment To limits

1. **1245_TS4** — choose a future date in Payment To → "Unable to select future dates, all future dates are greyed out" `[R6]`.
2. **1245_TS5** — choose a past date in Payment To → "Unable to select date after 30 days, all date after 30 days are greyed out" `[R7]`.

## 4. Business rules and system behaviour

1. **Navigation path:** "1. Login to BO ⏎ 2. Go to Transaction Relevant ⏎ 3. Go to JomCheck transaction" `[Sheet1, R3, Test Steps]`.
2. **Default To = today** when From is within 30 days: "Payment To field is auto-select to today's date" `[Sheet1, R3, R5]`.
3. **Default To = From + 30 days** when From is older: "Payment To field is auto-select to date afetr 30 days" `[Sheet1, R4]`. [unconfirmed] "after 30 days" means 30 days after the chosen From date, not 30 days after today.
4. **No future dates:** "Unable to select future dates, all future dates are greyed out" `[Sheet1, R6]`.
5. **30-day cap:** "Unable to select date after 30 days, all date after 30 days are greyed out" `[Sheet1, R7]`. [unconfirmed] The 30 days count from Payment From.
6. **Disabled, not error:** both limits show as **greyed-out dates** in the picker, not a validation message `[Sheet1, R6–R7]`.
7. **Title mismatch:** TS4 title "To verify only able to ⏎ select today's date" `[R6]` is narrower than its expected result (all past dates still allowed). Treat the Expected Result as the rule.

## 5. Test data, environments, accounts, setup

1. **Environment:** not named in the sheet.
2. **Accounts:** "Login to BO" only; no user ID. No credentials present.
3. **Test data:** none needed; the scenarios only exercise the date picker. No search results are checked.

## 6. Gaps or risks a regression should still cover

1. **Search result:** no scenario runs the search and checks rows fall inside From–To.
2. **Boundary days:** no check of exactly 30 days vs 31 days back, nor month-end / leap-year rollover.
3. **Changing From again:** no check that To re-adjusts when From is changed after To was set.
4. **Manual change of To:** no check that a user can pick an earlier To than the auto-filled one.
5. **Empty From:** no check of what Payment To allows when From is blank. The captured BO enquiry page shows both inputs empty on load: "#fromDate value on load: """ and "#toDate value on load: """ `[_reference/html/eauto/bo-jomcheck-transaction-enquiry-datepicker.html, header comment, lines 12–13]`.
6. **Export:** if the listing has an export, the TS does not check the export respects the same window.
7. **Other listings:** the TS covers BO only; the UCD JomCheck Transaction Listing has the same `#fromDate`/`#toDate` shape `[knowledge/flow-jomcheck.md, "UCD transaction listing"]` but is not tested here. [unconfirmed] whether UCD has the same rule.
8. **Naming:** [unconfirmed] the "JomCheck transaction" page in this TS is the BO **Transaction Enquiry** page (`/view/jomcheck/enquiry/`) described in `knowledge/flow-jomcheck.md`; field labels "Payment From"/"Payment To" are not confirmed against a capture.

## 7. Relation to existing knowledge

1. `knowledge/flow-jomcheck.md` §5 item 7 and `knowledge/business-rules-from-test-scenarios.md` row 7 already hold rows 3, 6–7. **Missing:** the TS2 rule (From older than 30 days → To = From + 30 days) `[Sheet1, R4]`.
2. **30 days vs one month:** the Service Portal JomCheck Report Listing rejects ranges with "Shared Date range must not exceed one month." `[knowledge/flow-jomcheck.md, line ~1326]`. This BO TS says **30 days** and **greys out** dates instead of showing a message. Different control style; not a contradiction, but the two pages enforce the limit differently.
3. The BO date-picker capture (2026-10-01) shows both inputs empty on load. This does not contradict TS1–TS3, which only start after From is chosen.

## Knowledge candidates

1. **BO JomCheck listing — To auto-fills From + 30 days when From is older than 30 days.** Quote: "Payment To field is auto-select to date afetr 30 days". Source: SharePoint TS EAINT-1245, Sheet1, R4. Target: `knowledge/flow-jomcheck.md` §5 item 7 and `knowledge/business-rules-from-test-scenarios.md` row 7 (add R4 to the row list).
2. **BO JomCheck listing limits are greyed dates, not error messages.** Quotes: "all future dates are greyed out" (R6); "all date after 30 days are greyed out" (R7). Source: SharePoint TS EAINT-1245, Sheet1. Target: `knowledge/flow-jomcheck.md` §5 item 7. Useful for automation: assert disabled cells in the datepicker, not a message.
3. **BO JomCheck listing path.** Quote: "Login to BO ⏎ 2. Go to Transaction Relevant ⏎ 3. Go to JomCheck transaction". Source: SharePoint TS EAINT-1245, Sheet1, R3. Target: `knowledge/flow-jomcheck.md` BO section. [unconfirmed] that this is the `/view/jomcheck/enquiry/` page.
4. **Date-limit style differs by portal** [unconfirmed as a general rule]: BO JomCheck = 30 days, greyed dates (EAINT-1245 R6–R7); Service Portal JomCheck Report Listing = "must not exceed one month" message (flow-jomcheck.md). Target: `knowledge/automation-playbook.md` traps, after a live check.
