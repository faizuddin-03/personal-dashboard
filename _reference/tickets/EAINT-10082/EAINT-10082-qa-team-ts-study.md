# EAINT-10082 — QA Team test script study (2026-10-27)

## 1. Header

1. **Ticket:** EAINT-10082 — "⚪[eAuto-Insurance] To Notify UCD Director of Monthly Insurance Commission Earned via WhatsApp and Email" `[sheet EAINT-10082, R2]`.
2. **Module / portal:** eAuto Insurance; notification goes to the **UCD** (WhatsApp + email), plus an **xlsx report** to internal users.
3. **Workbook:** "EAINT-10082 - ⚪[eAuto-Insurance] To Notify UCD Director of Monthly Insurance Commission Earned via WhatsApp and Email.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 28/04/2026, 6:02:39 pm.
4. **Sheets:**
   1. **EAINT-10082** — final TS, **13 scenarios** (10082_TS1–TS13).
   2. **Sheet1** — earlier draft, **14 scenarios**, all "Pending", different numbering and one extra scenario.
   3. **Sheet2** — empty.
5. **Results (sheet EAINT-10082):** **13 Pass, 0 Fail, 0 Pending.** Header R3 shows Pass "13", TOTAL "13", Completion % "1" `[sheet EAINT-10082, R3]`.
6. **Tester:** column QA = "Maisarah" on every row `[sheet EAINT-10082, R4–R16]`.
7. **Dates:** none written in the sheet. Only the file modified date (28/04/2026).
8. **Deployment:** production precedent index lists "| EAINT-10082 | 20260429 | Insurance commission WhatsApp | No |", where **No** = "unable to test" in production `[knowledge/production-regression-scope.md §11, line 972 + legend line 830-832]`.

## 2. What the ticket changed, as the TS shows it

1. **New monthly notification** to the UCD's **Main Director** with the insurance commission earned for the month.
2. Two channels:
   1. **WhatsApp** from "+0182889090 – eAuto Support" `[sheet EAINT-10082, R4 col B]`.
   2. **Email** from "insurance.commission@eauto.my" `[sheet EAINT-10082, R5 col B]`.
3. Sent "every 2nd day of month at 10 AM" `[sheet EAINT-10082, R4 col D, step 1]`.
4. Commission = "10% × Gross Premium" `[sheet EAINT-10082, R4 col D, step 2]`.
5. Message carries a **[Poster]** (image) with the summary `[sheet EAINT-10082, R4–R5 col E]`.
6. Copies go to **authorised users** at "insurance@eauto.my" `[sheet EAINT-10082, R14 col D]`.
7. A **report (xlsx)** is "automatically sent on the 3rd day of every month" `[sheet EAINT-10082, R16 col E]`.

## 3. Scenarios (sheet EAINT-10082)

### A. Happy path — web and mobile view

1. **10082_TS1** (WhatsApp, web view) — "UCD receives a WhatsApp message containing the insurance commission earned for one month, on the 2nd day of every month" + template. **Pass** `[R4]`.
2. **10082_TS2** (Email, web view) — "UCD receives a Email containing the insurance commission earned for one month, on the 2nd day of every month" + template. **Pass** `[R5]`.
3. **10082_TS3** (WhatsApp, mobile view) — same expected as TS1, no template. **Pass** `[R6]`.
4. **10082_TS4** (Email, mobile view) — same expected as TS2, no template. **Pass** `[R7]`.

### B. Main Director changed

5. **10082_TS5** (WhatsApp) — "New Main Director receives a WhatsApp message containing the insurance commission earned for one month, on the 2nd day of every month". **Pass** `[R8]`.
6. **10082_TS6** (Email) — "New Main Director receives a Email containing the insurance commission earned for one month, on the 2nd day of every month". **Pass** `[R9]`.

### C. Not sent

7. **10082_TS7** (WhatsApp, commission "0") — "UCD not receives a WhatsApp message …". **Pass**, remark "No test evidence since "0" commission and won't listed in transaction listing" `[R10]`.
8. **10082_TS8** (Email, commission "0") — "UCD not receives a Email …". **Pass**, same remark `[R11]`.
9. **10082_TS9** (WhatsApp, office number) — "UCD not receives a WhatsApp message …". **Pass**, remark "No test evidence, can refer to Monthly Commission Achievement excel report" `[R12]`.

### D. Office number still gets email

10. **10082_TS10** — "UCD receives a Email containing the insurance commission earned for one month, on the 2nd day of every month even UCD using the office number". **Pass** `[R13]`.

### E. Authorised users (shared inbox)

11. **10082_TS11** — "1. UCD received email ⏎ 2. All authorized users' (insurance@eauto.my) inboxes received email". **Pass**, remark "No test evidence, verified during walkthrough" `[R14]`.
12. **10082_TS12** — UCD reply with all in CC: "3. Authorized users able to view and perform any action on the email sent". **Pass**, remark "No test evidence, verified during walkthrough" `[R15]`.

### F. Monthly report

13. **10082_TS13** — "1. The report is automatically sent on the 3rd day of every month. ⏎ 2. The report is successfully delivered to the intended recipients in xlsx. ⏎ 3. All records in the report are accurate. ⏎ 4. No missing, duplicate, or incorrect data is found." **Pass** `[R16]`.

### G. Draft-only scenario (Sheet1, not in final)

14. **Sheet1 10082_TS13** — "To verify that all authorized users are able to view replies sent by UCD even if they are excluded in CC"; step "Email is still captured and delivered to all authorized users’ inboxes via mail flow rules."; remark "authorized users - BCC". Status "Pending" `[Sheet1, R16]`. **Dropped from the final sheet.**

## 4. Business rules and system behaviour

1. **Schedule:** "eAuto send Whatsapp message to UCD every 2nd day of month at 10 AM" `[sheet EAINT-10082, R4 col D]`; email same "every 2nd day of month at 10 AM" `[R5 col D]`.
2. **Formula:** "calculate amount of comission (10% × Gross Premium)" `[sheet EAINT-10082, R4 col D]`.
3. **WhatsApp template:** "[Poster] Hi {UCD Company}, your monthly commission summary for eAuto Insurance is available. Thank you for your continuous support of eAuto. Please do not hesitate to contact us if you need any assistance or encounter any issues. We are happy to help (This is an automated message.)" `[sheet EAINT-10082, R4 col E]`.
4. **Email template:** "Subject: eAuto – Monthly Commission Achievement", body "Hi {UCD Company} Your monthly commission summary for eAuto Insurance is available. [Poster] … (This is an automated email. No signature is required.)" `[sheet EAINT-10082, R5 col E]`. Poster sits **before** the greeting in WhatsApp, **after** it in email.
5. **Recipient follows the Main Director:** "Verify Whatsapp message sent to New Main Director" `[R8 col D]`; "Verify Email sent to New Main Director" `[R9 col D]`.
6. **Zero commission = nothing sent** (both channels) `[R10–R11]`. Remark: "won't listed in transaction listing" `[R10 col H]` — zero-commission UCDs do not appear in the listing [unconfirmed which listing].
7. **Office number = no WhatsApp, email still sent:** "To verify Email message is sent to UCD even when the UCD using office number" + step "3. Verify no Whatsapp message is sent to UCD" `[R13]`.
8. **Shared inbox:** "Email is automatically delivered to all authorized users’ (insurance@eauto.my) inboxes." `[R14 col D, step 2]`.
9. **UCD replies:** "UCD replies to insurance.commission@eauto.my and includes all parties in CC." `[R15 col D, step 2]`. Reply-without-CC (BCC / mail flow rules) was drafted but not kept `[Sheet1, R16]`.
10. **Report recipient:** "Check if the report is sent automatically via email shamini@eauto.my" `[R16 col D]`. Draft listed "shamini@eauto.my/insurance@eauto.my" and sender "insurance.commission@eauto.my/supportmfeauto@modefair.com" `[Sheet1, R17]` — final narrowed to one recipient.
11. **Report name:** "Monthly Commission Achievement excel report" `[R12 col H]`. It appears to list office-number UCDs too [unconfirmed].
12. **Timing gap:** notification on the **2nd**, report on the **3rd** `[R4, R16]`.

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet.
2. **Sender WhatsApp:** "+0182889090 – eAuto Support" `[R4 col B]`.
3. **Sender email:** "insurance.commission@eauto.my" `[R5 col B]`.
4. **Shared inbox:** "insurance@eauto.my" `[R14 col D]`.
5. **Report recipient:** "shamini@eauto.my" `[R16 col D]`.
6. **Test approach note (draft):** "use real - have to ask about access ⏎ use mailtrap - verify content and who receiver & cc" `[Sheet1, R14 col H]`.
7. **Credentials:** none in the sheet.
8. **Evidence:** TS7, TS8, TS9, TS11, TS12 say "No test evidence" `[R10–R12, R14–R15 col H]`.

## 6. Gaps or risks a regression should still cover

1. **Five of 13 passes have no evidence** (TS7–9, TS11–12). TS11–12 passed on "verified during walkthrough" only.
2. **Production not verified:** precedent index marks it **No** (unable to test).
3. **Reply without CC** (draft TS13, BCC / mail flow rules) never tested.
4. **Formula accuracy** (10% × Gross Premium) has no worked example or data row in the sheet.
5. **10 AM send time** is in steps only; no expected result checks the time.
6. **Copy-paste step** "3. Verify Whatsapp message sent to New Main Director" sits in TS1 and TS3 (not director-change scenarios) [unconfirmed — likely template carry-over].
7. **Month boundaries** not covered: which month's premiums count, cancelled/refunded policies, month with 31st-day sales.
8. **Multiple directors / no director / no email** on the UCD not covered.
9. **Report content** — draft remark "to verify report content" `[Sheet1, R17 col H]`; final has no column list.
10. **Landline rule** is the same as the later bug **EAINT-12652** (landline WhatsApp failure stopped the email in LKM Refund) — re-check this ticket does not have the same fault `[knowledge/flow-stms-addons.md line 52]`.

## 7. Existing knowledge vs this TS

1. `knowledge/eauto-insurance.md` §"Insurance notifications", item 2, and `knowledge/business-rules-from-test-scenarios.md` line 485 already hold: 2nd-day send, WhatsApp text, email subject, new Main Director, zero commission, office number, authorised users, 3rd-day report. **No contradiction.**
2. **Missing from knowledge:** 10 AM time, 10% × Gross Premium formula, sender WhatsApp number and email, report recipient, report name, poster position, dropped BCC scenario.
3. `knowledge/cr-test-scenario-catalogue.md` line 103 counts "EAINT-10082:13; Sheet1:14" — **matches**.
4. No `_reference/tickets/EAINT-10082/` (before this file), no `_reference/tickets/Studying/EAINT-10082/`, no entry in `lib/ticketStudies.ts`.

## Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-10082 - ⚪[eAuto-Insurance] To Notify UCD Director of Monthly Insurance Commission Earned via WhatsApp and Email.md` (text copy, 27/10/2026, 9:13:19 pm; cell text only, no formatting or images).
2. `knowledge/eauto-insurance.md` lines 240–265.
3. `knowledge/production-regression-scope.md` §11 (lines 828–832, 972).
4. `knowledge/cr-test-scenario-catalogue.md` lines 103, 358.
5. `knowledge/flow-stms-addons.md` line 52.
6. `knowledge/business-rules-from-test-scenarios.md` line 485 (grep hit).
7. `lib/ticketStudies.ts` — no EAINT-10082 entry. Ticket folders — none existed.
8. **Not read:** Jira ticket, SRD, Teams, poster images (not in the text copy).

## Knowledge candidates

1. **Send time + formula:** "eAuto send Whatsapp message to UCD every 2nd day of month at 10 AM" and "calculate amount of comission (10% × Gross Premium)" — add to `knowledge/eauto-insurance.md` §Insurance notifications item 2. `[from SharePoint TS EAINT-10082, sheet EAINT-10082, R4 col D]`
2. **Senders:** WhatsApp "+0182889090 – eAuto Support" `[R4 col B]`; email "insurance.commission@eauto.my" `[R5 col B]`.
3. **Report:** named "Monthly Commission Achievement excel report" `[R12 col H]`, sent to "shamini@eauto.my" `[R16 col D]` on the 3rd.
4. **Zero commission:** "won't listed in transaction listing" `[R10 col H]` [unconfirmed which listing].
5. **Not tested:** UCD reply without CC (BCC / mail flow rules) was drafted then dropped `[Sheet1, R16]`; production verification "No" `[production-regression-scope.md line 972]`.
6. **Cross-link:** landline/office-number rule here = same rule as EAINT-12652 (LKM Refund). Add a back-link from `eauto-insurance.md` to `flow-stms-addons.md` line 52.
