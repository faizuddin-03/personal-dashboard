# EAINT-8169 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy**: `_reference/sharepoint/qa-team-ts/EAINT-8169 - [eAuto - UCD] To update latest content for Company or Business Profile Update Message.md` (captured "28/10/2026, 10:17:54 am"). Cell text only; formatting and images (test evidence screenshots) are not in the copy.
2. **Ticket folders**: `_reference/tickets/EAINT-8169/` and `_reference/tickets/Studying/EAINT-8169/` held no files before this study.
3. **lib/ticketStudies.ts**: no entry for EAINT-8169.
4. **knowledge/**: `flow-company-profile-einvoice.md` (lines 37, 38, 51, 69, 76), `cr-test-scenario-catalogue.md` (lines 119, 411), `flow-ucd-shell.md` (popup chain, `#dialog-einvoice`), `README.md`.
5. **Not read**: the Jira ticket itself and any SRD. Not part of this scheduled run.

## 1. Header

1. **Ticket**: EAINT-8169. Sheet R1 title: "[eAuto-UCD] To update latest content for Company/Business Profile Update Message".
2. **Module / portal**: **UCD portal**, Company/Business Profile Update (Pre e-Invoice) flow.
3. **Workbook**: "EAINT-8169 - [eAuto - UCD] To update latest content for Company or Business Profile Update Message.xlsx", library "eAuto - CR Test Scenarios", modified 23/07/2025, 9:07:32 am.
4. **Sheets**: 2. "Staging-eauto" and "Production".
5. **Scenarios**: **3 per sheet, 6 rows total** (TS1–TS3 on each sheet, same wording).
6. **Results**: **6 Pass, 0 Fail**. Staging-eauto R8–R10 "Pass"; Production R8–R10 "Pass".
7. **Tester**: sheet R4 "QA: | May Chin" (both sheets).
   a. Conflict: `knowledge/cr-test-scenario-catalogue.md` line 119 lists "Charmain Ea Chiang" for this workbook. [unconfirmed] That is likely the SharePoint last-modified-by, not the tester.
8. **Dates**: no test date in the sheet. Only the SharePoint modified date (23/07/2025).

## 2. What the ticket changed, as the TS shows it

1. **Text change only** on three places in the UCD portal. Each row lists "Update Message From:" and "Update Message To:".
2. **Deadline moved**: "before 31 May 2025" → "before 20 June 2025" (all three places).
3. **Suspension warning added**: "Failure to comply, may result on your account with eAuto be suspended." added to the popup (TS1) and Pre e-Invoice Step 1 (TS3). Not added to the homepage button text (TS2).
4. No behaviour, field or flow change is tested.

## 3. Scenarios

### A. Homepage

1. **TS1** — Homepage > Company/Business Profile Update popup. Expected: new popup text ending "...before 20 June 2025, to ensure seamless transition for our e-Invoicing purposes. Failure to comply, may result on your account with eAuto be suspended." (Staging-eauto R8, Production R8). Pass both.
2. **TS2** — Homepage > [Company/Business Profile] button. Expected: "Main user, update your ⏎ company/business profile ⏎ before 20 June 2025" (Staging-eauto R9, Production R9). Pass both.

### B. Pre e-Invoice

1. **TS3** — Pre e-Invoice Step 1. Expected: new text ending "Kindly complete your company/business profile update before 20 June 2025 to enable a smooth STMS/eSTM transactions thereafter. Failure to comply, may result on your account with eAuto be suspended." (Staging-eauto R10, Production R10). Sub UCD column: "Sub UCD unable to access Pre e-Invoice Step 1". Pass both.

## 4. Business rules and system behaviour

1. **Phase 3 date**: "eAuto Sdn Bhd falls under phase 3 of the implementation timeline, which begins on 1 July 2025." (Staging-eauto R8, TS1).
2. **e-Invoicing start**: "Inland Revenue Board has begun its implementation on e-Invoicing in stages effective 1 August 2024, which is based on each company's annual turnover." (Staging-eauto R8, TS1).
3. **Main user only**: "Registered UCD's main user is required to cooperate and comply by updating MAY PRE EINVOICE 1 company/business profile before 20 June 2025" (Staging-eauto R8, TS1).
   a. **"MAY PRE EINVOICE 1"** is in the company-name position. [unconfirmed] The popup inserts the logged-in UCD company name; "MAY PRE EINVOICE 1" is the test company.
4. **Sub UCD blocked from Step 1**: "Sub UCD unable to access Pre e-Invoice Step 1" (Staging-eauto R10 and Production R10, Sub UCD column). Matches `flow-company-profile-einvoice.md` line 49.
5. **Button text targets main user**: "Main user, update your ⏎ company/business profile ⏎ before 20 June 2025" (Staging-eauto R9, TS2).
6. **Consequence stated to dealers**: "Failure to comply, may result on your account with eAuto be suspended." (Staging-eauto R8 and R10). Ties to the later restriction jobs listed in knowledge (EAINT-11558 and rounds 11212, 10948, 10510).
7. **Step 1 purpose wording**: "Kindly complete your company/business profile update before 20 June 2025 to enable a smooth STMS/eSTM transactions thereafter." (Staging-eauto R10, TS3).
8. **Source text has a double space**: "before 31 May  2025" in the "From" text of TS3 (Staging-eauto R10). Only in the old text; the new text reads "before 20 June 2025".

## 5. Test data, environments, accounts

1. **Environments**: Staging-eauto R3 "Test Env: | staging/eauto"; Production R3 "Test Env: | PRODUCTION".
2. **Staging accounts** (Staging-eauto R7 headers): "Main UCD - Sdn Bhd or Bhd (Firefox v36)" and "Sub UCD - Sole Proprietorship or Partnership (Chrome)".
3. **Production accounts** (Production R7 headers): "Main UCD - LLP (Firefox v36)" and "Sub UCD - LLP (Chrome)".
4. **Browsers**: main UCD on **Firefox v36**, sub UCD on **Chrome**.
5. **Test company**: "MAY PRE EINVOICE 1" (appears in the TS1 text).
6. **Credentials**: none in the sheet.
7. **Evidence**: "Test Evidence" columns exist (R6). Cells are empty in the text copy. [unconfirmed] Screenshots were likely images, which the copy drops.

## 6. Gaps or risks for regression

1. **Dates are fixed in the text.** 20 June 2025 has passed. [unconfirmed] Later tickets may have changed or removed this message again; check current live text before using this TS wording as an expected result.
2. **Popup title not tested against knowledge.** `flow-company-profile-einvoice.md` line 35–36 names the popup "Company/Business Profile Update – UPDATE REQUIRED" and quotes "Failure to comply may result on your account with eAuto be suspended" (no comma). This TS shows title "Company/Business Profile Update" and the comma "Failure to comply, may". [unconfirmed] One of them is out of date; recheck on staging.
3. **Sub UCD homepage not checked.** TS1 and TS2 sub UCD cells are empty. Whether a sub user sees the popup or button is not recorded.
4. **Popup closes/after-update not tested.** No row checks the popup stops showing once the profile is done, or its place in the popup chain.
5. **Mobile not covered.** Only web, two browsers.
6. **Type of Business coverage partial.** Staging: Sdn Bhd/Bhd main, Sole Prop/Partnership sub. Production: LLP only. ROB/TLN main users not covered for the message text.

## Knowledge candidates

1. **Fix role note** in `flow-company-profile-einvoice.md` line 51. It says "Main UCD in the TS is Sdn Bhd/Bhd; Sub UCD is Sole Proprietorship/Partnership (EAINT-8169 sheet)". That is the Staging sheet only; Production used "Main UCD - LLP (Firefox v36)" and "Sub UCD - LLP (Chrome)" (Production R7). [ts: EAINT-8169 Production R7]
2. **Ticket history date** in `flow-company-profile-einvoice.md` line 76 says "EAINT-8169 (2025-05)". Workbook modified 23/07/2025; the old deadline in the text was 31 May 2025. Add the workbook date. [ts: EAINT-8169 SharePoint metadata]
3. **Popup wording conflict**: add a "Conflict:" line under the popup entry point (line 36). TS text: "Failure to comply, may result on your account with eAuto be suspended." (Staging-eauto R8). [ts: EAINT-8169 TS1]
4. **e-Invoicing phase fact**: "eAuto Sdn Bhd falls under phase 3 of the implementation timeline, which begins on 1 July 2025." (Staging-eauto R8). Fits the Glossary or Purpose of `flow-company-profile-einvoice.md`. [ts: EAINT-8169 TS1]
5. **Homepage button text** (third entry point): "Main user, update your ⏎ company/business profile ⏎ before 20 June 2025" (Staging-eauto R9). [ts: EAINT-8169 TS2]
6. **Tester field**: `cr-test-scenario-catalogue.md` line 119 names "Charmain Ea Chiang"; sheet R4 says "QA: | May Chin". Add a note that the catalogue column is the file modifier, if that is how it was built. [ts: EAINT-8169 Staging-eauto R4]
7. **Test company** "MAY PRE EINVOICE 1" used for profile-update message checks. [ts: EAINT-8169 TS1] [unconfirmed which environment it lives in; it appears in both sheets' text]
