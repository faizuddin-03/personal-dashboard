# EAINT-12130 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy** of the workbook: `_reference/sharepoint/qa-team-ts/EAINT-12130 - [eAuto-UCD & AATF] Contact Us - To Hide eAuto Bank Account Information from Contact Us Page.md` (header: "text copy (27/10/2026, 8:12:17 pm)", "Cell text only, row by row; formatting and images are not kept."). Read through Grep; the Read tool failed on this path (square brackets in the file name).
2. **Older text extract** of the same workbook: `_reference/inbox/eauto-flows-run/ts-text/EAINT-12130_-_eAuto-UCD_&_AATF_Contact_Us_-_To_Hide_eAuto_Bank_Account_Information_from_Co.txt`. Same 4 rows, same wording.
3. **Teams chat**: `_reference/teams/EAINT-12130-12022-STMS-Insurance-Cancellation.md` (7 messages, captured 2026-10-16).
4. **knowledge/**: `cr-test-scenario-catalogue.md` (rows 132, 370), `business-rules-from-test-scenarios.md` §16, `teams-decisions-by-ticket.md` (EAINT-12130), `releases.md` (row 31), `cr-ledger.md` (item 13), `flow-company-profile-einvoice.md` (ticket history), `flow-ucd-shell.md` (header bar, footer), `production-regression-scope.md` (EAINT-8571).
5. **Not read**: the original `.xlsx` (`_reference/sharepoint/eauto-cr-test-scenarios/...`) — formatting, colours and any images are not in the text copy. **No SRD**, no Jira ticket body, no Contact Us HTML capture exist in the repo.
6. **Empty**: `_reference/tickets/EAINT-12130/` (only this file), `_reference/tickets/Studying/EAINT-12130/` (does not exist). `lib/ticketStudies.ts` has no EAINT-12130 entry.

## 1. Header

1. **Ticket**: EAINT-12130.
2. **Module / portal**: Contact Us page on **UCD** (Main and Sub UCD) and **AATF**.
3. **Workbook**: "EAINT-12130 - [eAuto-UCD & AATF] Contact Us - To Hide eAuto Bank Account Information from Contact Us Page.xlsx", library "eAuto - CR Test Scenarios", modified 06/08/2026, 9:59:16 am.
4. **Sheets**: 1 — "Test Scenario".
5. **Scenarios**: 4 (12130_TS01 to 12130_TS04).
6. **Results**: column "Test Result (P/F)" is **empty on all 4 rows** in the text copy. No Pass/Fail recorded in the sheet.
7. **Tester**: QA column "Aliah" on all rows (Sheet "Test Scenario", R2-R5). Catalogue lists editor "Aliah Maisarah Binti Mohamadiah" (`cr-test-scenario-catalogue.md` row 132).
8. **Dates**: none written in the sheet. Teams shows staging sign-off and prod patch on 2026-08-06 (see §5).

## 2. What the ticket changed (as the TS shows it)

1. The **eAuto bank account number** is removed from the **Contact Us** page for UCD and AATF users. Every row expects: "Ensure the Bank Account No is not displayed" (Sheet "Test Scenario", R2-R5).
2. The TS checks only the absence of the bank account number. It does not say what else on the page changed or stayed.

## 3. Scenarios

**A. UCD**

1. **12130_TS01** — Chrome, Main UCD: "1. Login as UCD ⏎ 2. Navigate to Contact Us page" → "Ensure the Bank Account No is not displayed" (R2).
2. **12130_TS02** — Firefox, Sub UCD: "1. Login as UCD ⏎ 2. Navigate to Contact Us page" → "Ensure the Bank Account No is not displayed" (R3).

**B. AATF**

1. **12130_TS03** — Chrome, AATF: "1. Login as AATF ⏎ 2. Navigate to Contact Us page" → "Ensure the Bank Account No is not displayed" (R4).
2. **12130_TS04** — Firefox, AATF: "1. Login as AATF ⏎ 2. Navigate to Contact Us page" → "Ensure the Bank Account No is not displayed" (R5).

## 4. Business rules and system behaviour

1. **Bank account hidden**: "Ensure the Bank Account No is not displayed" (Sheet "Test Scenario", R2, R3, R4, R5).
2. **Same rule for Main UCD, Sub UCD and AATF**: User column "Main UCD" (R2), "Sub UCD" (R3), "AATF" (R4, R5).
3. **Two browsers in scope**: "Chrome" (R2, R4) and "Firefox" (R3, R5). [unconfirmed] Firefox still in scope on 2026-08-06, before the Firefox-to-Chrome notices of EAINT-12180 / EAINT-12253.
4. **Contact Us entry points known from knowledge/** (not from this TS): UCD header "`#contact-link` | CONTACT US | inline → `/<env>/view/ucd/contact`" and footer "`window.open('/<env>/public/contact-us.jsp' …)`" (`flow-ucd-shell.md` lines 198, 225). The TS says only "Navigate to Contact Us page" — it does not say which entry point was used.

## 5. Test data, environments, accounts, setup

1. **Environment**: none named in the sheet (`cr-test-scenario-catalogue.md` row 132: "none named").
2. **Accounts**: one Main UCD, one Sub UCD, one AATF login. No logins in the sheet; **no credentials present**.
3. **Setup**: none. No test data needed.
4. **Teams timeline** (`_reference/teams/EAINT-12130-12022-STMS-Insurance-Cancellation.md`):
   1. 2026-08-06 10:55, QA lead quoted: "QA has completed the testing and verified good for EAINT-12130, please let us know once you've gotten greenlight from requestor before we proceed to patch in Production ya".
   2. 2026-08-06 10:57, project lead: "Okkiess dah got greenlight from Ops that we can proceed to patch in prod around 2.30PM ya."
   3. 2026-08-06 14:26, developer: "done patched to prod".
   4. 2026-08-06 14:49, QA: "QA has completed the production regression testing and all verified good."
5. **Chat origin**: the group was first opened for "EAINT-12022 [eAuto-UCD] STMS - Insurance Cancellation (MyKad & MyPR)" and renamed for EAINT-12130 on 2026-08-06 (same file, lines 1, 5-6). The chat name is not a link between the two changes. [unconfirmed] that the tickets are related in scope.

## 6. Gaps and risks for regression

1. **Pass/Fail not recorded** in the sheet. The only proof of passing is the Teams message of 2026-08-06 (§5 item 4.1).
2. **TS02 wording mismatch**: User column says "Sub UCD" but the step says "Login as UCD" (R3). Minor; a regression should log in as a Sub UCD explicitly.
3. **Entry point not named**: UCD has a header CONTACT US page (`/view/ucd/contact`) and a footer popup (`/public/contact-us.jsp`). [unconfirmed] whether both pages were checked. A regression should check **both**, plus the public footer link on BO and Service Portal (`flow-bo-shell.md` line 302, `flow-service-portal-shell.md` line 77) and the login page if it has a Contact Us link.
4. **Rest of the page not checked**: no row confirms the other Contact Us content still shows — hotline "03-27798899", hours, address (`business-rules-from-test-scenarios.md` §16 item 1) and the eAuto TIN added by EAINT-8571 ("eAuto TIN on Contact Us", `production-regression-scope.md` line 1086).
5. **Other places showing the bank account**: not covered — e.g. invoices, payment instructions, emails, user guides. [unconfirmed] whether the eAuto bank account appears anywhere else.
6. **No negative/positive pair**: no SRD in repo, so the exact field label removed ("Bank Account No") and whether the bank name/holder name were also removed cannot be confirmed.
7. **No HTML capture** of the Contact Us page exists in `_reference/html/`. Selectors for an automated check would need a fresh capture.

## 7. Knowledge already recorded vs this TS

1. `business-rules-from-test-scenarios.md` §16 item 5 already holds "Contact Us no longer shows the eAuto bank account number" — **matches** this TS.
2. `cr-test-scenario-catalogue.md` row 132 matches (4 rows, editor, date, no environment).
3. `flow-company-profile-einvoice.md` line 152 lists EAINT-12130 under the e-Invoice flow ticket history. [unconfirmed] fit — the TS shows only a Contact Us page change, nothing on e-Invoice.
4. `cr-ledger.md` item 13 reads "EAINT-12130 — (group first opened as EAINT-12022)" — no summary of the change.
5. No contradiction with `flow-ucd-shell.md`; that file does not describe the Contact Us page content.

## Knowledge candidates

1. **cr-ledger.md item 13**: add summary "Contact Us page (UCD Main/Sub, AATF) no longer shows the eAuto Bank Account No; patched to prod 2026-08-06". Source: Sheet "Test Scenario" R2-R5 "Ensure the Bank Account No is not displayed"; Teams 2026-08-06 14:26 "done patched to prod".
2. **business-rules-from-test-scenarios.md §16 item 5**: widen the source to rows 2-5 and add scope "Main UCD, Sub UCD, AATF; Chrome and Firefox". Source: Sheet "Test Scenario" R2-R5, User and Browser columns.
3. **flow-ucd-shell.md**: note that the CONTACT US page (`/<env>/view/ucd/contact`) must not show the eAuto bank account number since EAINT-12130. Source: Sheet "Test Scenario" R2.
4. **flow-company-profile-einvoice.md line 152**: review whether EAINT-12130 belongs in that ticket history; the TS shows no e-Invoice change. Source: this study §7 item 3. [unconfirmed]
5. **HTML capture needed**: save UCD `/view/ucd/contact`, public `/public/contact-us.jsp` and AATF Contact Us pages to `_reference/html/` next time they are opened, to back the rule with a verified page.
