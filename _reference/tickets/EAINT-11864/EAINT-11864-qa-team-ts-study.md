# EAINT-11864 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study; no
knowledge/ or code file was changed.

## Sources read

1. **SharePoint TS text copy:** `_reference/sharepoint/qa-team-ts/EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase.md` (text copy dated "27/10/2026, 7:03:07 pm"; cell text only, no formatting).
2. **Jira capture:** `_reference/tickets/Studying/EAINT-11864/EAINT-11864-jira.md` (27/10/2026).
3. **Knowledge:** `knowledge/flow-quotation-reminder.md`, `knowledge/eauto-insurance.md` § EAINT-11864 / § Quotation reminder email, grep of `knowledge/` for `11864`.
4. **lib/ticketStudies.ts:** no entry for EAINT-11864; it appears only in `related` of another study (line 403).
5. **Not read:** the local workbook `_reference/tickets/EAINT-11864/EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase (2).xlsx` (binary, no text copy). Its content is known only through `knowledge/flow-quotation-reminder.md` line 19: "one sheet, 12 cases `11864_TS01`–`11864_TS12`, read 2026-10-15".
6. **Not read:** SRD v1.1 (.docx/.pdf, Jira attachments only, not in the repo) and the Figma design.

## 1. Header

1. **Ticket:** EAINT-11864 — "[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase". Jira status **Done**, fix version "S32.8-20260820🌞 (2026-08-20)".
2. **Portal / module:** Jira "Affected Portal | UCD Portal", "Affected Module | UCD". Insurance quotation + hourly cronjob + email (Mailtrap on staging).
3. **Workbook:** "EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase.xlsx", library "eAuto - CR Test Scenarios", modified 19/08/2026, 5:33:59 pm.
4. **Sheets:** `11864` (13 scenarios + notes block) and `Regression` (4 scenarios + the same notes block copied).
5. **Scenarios:** **17** — `11864_TS01`–`11864_TS13` and `11864_RG_TS01`–`11864_RG_TS04`.
6. **Results:** **17 Pass, 0 Fail** (column "Status (Pass/Fail)").
7. **Tester:** column "QA" = "Faiz" on every row — this is Faizuddin's own script, not another engineer's.
8. **Dates:** none written in the sheet. Jira: ETA for Testing 2026-08-17, Exp. Deploy Date 2026-08-20.
9. **Version gap:** the SharePoint copy has **TS13 and the Regression sheet**, which the local 12-case workbook (per knowledge) does not.

## 2. What the ticket changed, as the TS shows it

1. **New reminder email** to the UCD when a quotation is generated but not bought. Jira Request: "System to automatically send an email to the UCD (Sub UCD or Main UCD) when UCD checked quotation but didn't proceed with Insurance purchase."
2. **Sent by a cronjob**, picked up on the next run. Sheet `11864` R19: "Will run every hour 7am-11pm"; col F: "3:59 -> 4.00 pickup ⏎ 00:00 -> 07:00 pickup".
3. **Email carries a "Complete Purchase Now" button** that reopens the quotation at insurance step 1 (TS08–TS12).
4. **Precondition is an approved eSTM** for the vehicle (TS01/TS04/TS07 precondition "An approved eSTM transaction must be created").
5. **Only quotations created after go-live** are emailed (TS13).
6. **DB change at deploy:** R27: "Dev will need to add new column during deployment - Dev estimate 30 minutes to deploy this ticket - Monday night will add column, can deploy ticket a bit later (morning deployment)".

## 3. Scenarios

### A. Reminder trigger and timing (sheet `11864`)

1. **11864_TS01** (R2) — Get Free Quote · Lonpac · Main UCD · stop step 1 · click "Show My Result" 1 minute before the hour. Expected: email in Mailtrap; correct Main/Sub recipient; "Email format must be based on Figma"; "Sender is imonitor@eauto.my"; "if transaction is on 10:59am, email must be sent on 11:00am".
2. **11864_TS02** (R3) — eSTM entry (eLKM unticked at step 5) · Chubb · Sub UCD · stop step 2 · payment "on the hour". Expected: same checks; "if transaction is on 9:00am, email must be sent on 10:00am".
3. **11864_TS03** (R4) — Banner entry (eSTM details page) · Takaful · Main UCD · stop step 3 · two cron runs. Expected: one email; "After second cronjob runs, no email should be sent again".

### B. No-email cases

1. **11864_TS04** (R5) — Get Free Quote · Tokio Marine · Sub UCD · stop step 3, then buy through the Insurance Transaction Listing before the cron. Expected: "No email is sent after cronjob runs".
2. **11864_TS05** (R6) — Get Free Quote · Chubb · Sub UCD · no approved eSTM. Expected: "User can proceed up to step 2 only" and "No email is sent after cron job runs".
3. **11864_TS06** (R7) — 69E entry (error code VEL000069E) · Tokio Marine · Main UCD · stop step 3. Expected: "No email is sent after cronjob runs".
4. **11864_TS13** (R14) — Get Free Quote · Multiple Insurance · Main UCD · quotations at steps 1, 2, 3 made before go-live. Expected: "No email is sent for the quotations that are generated before the go live time". Remarks "HX077 ⏎ HX078 ⏎ HX079".

### C. Dead window

1. **11864_TS07** (R8) — Get Free Quote · Lonpac · Main UCD · stop step 3 · outside cron hours. Expected: "Email will not be sent outside of the cronjob running hours (7:00AM - 11:00PM)" and "Email will be received on the earliest 7:00AM Cronjob".

### D. "Complete Purchase Now" button

1. **11864_TS08** (R9) — Lonpac · Main UCD · browser already logged in. Expected: "New page opens up the insurance transaction step 1"; purchase completes; cross-check UCD, BO and CIBO. Remarks "HX071".
2. **11864_TS09** (R10) — Tokio Marine · Main UCD · incognito, not logged in. Expected: "New page opens up the login page"; purchase completes; cross-check. Remarks "HX072 ⏎  ⏎ Link redirects to prod environment - Existing behaviour".
3. **11864_TS10** (R11) — Chubb · "Sub UCD in same company". Expected: step 1 opens; purchase completes; cross-check. Remarks "HX073 ⏎  ⏎ HX076".
4. **11864_TS11** (R12) — Takaful · Main UCD from a different company, already logged in. Expected: "The system redirects to the homepage"; "The UCD from different company will not have the quotation in their insurance transaction listing". Remarks "HX074".
5. **11864_TS12** (R13) — Tokio Marine · Main UCD from a different company, fresh browser. Expected: "The system redirects to the login page", "After logging in, system redirects to homepage", quotation not in their listing. Remarks "HX075 ⏎  ⏎ Link redirects to prod environment  - Existing behaviour".

### E. Regression (sheet `Regression`)

1. **11864_RG_TS01** (R2) — Get Free Quote · Lonpac. Expected: "Expected behaviour is similar to the current insurance behaviour"; "Data reflected correctly in BO and CIBO" (Insurance Transaction Listing, Insurance Payment Transaction, CIBO). Remarks "HX080".
2. **11864_RG_TS02** (R3) — eSTM · Tokio Marine. Same expected. "HX081".
3. **11864_RG_TS03** (R4) — Banner · Chubb. Same expected. "HX082".
4. **11864_RG_TS04** (R5) — trigger "96E" · Takaful. Same expected. "HX083". "96E" is probably a typo for 69E `[unconfirmed]`.

## 4. Business rules and system behaviour the TS reveals

1. **Pickup is the next cron run.** Sheet `11864` R2 expected 5: "Ensure the email is sent on the next hour (if transaction is on 10:59am, email must be sent on 11:00am)". R3 expected 5: "(if transaction is on 9:00am, email must be sent on 10:00am)" — a transaction exactly on the hour is **not** caught by that same hour's run.
2. **Cron hours.** R8 expected 1: "Email will not be sent outside of the cronjob running hours (7:00AM - 11:00PM)"; R8 precondition: "Testing must be made outside of cronjob running hours (eg: 11:01PM - 6:59AM)".
3. **Once only.** R4 expected 5: "After second cronjob runs, no email should be sent again".
4. **Sender.** R2–R4 expected 4: "Sender is imonitor@eauto.my". The SharePoint copy spells it correctly.
5. **Email content.** R2 expected 3: "Email format must be based on Figma ⏎ a. Vehicle Number must follow insurance quotation ⏎ b. Discount amount must follow insurance quotation".
6. **No approved eSTM → step 2 only, no email.** R6 expected: "User can proceed up to step 2 only ⏎ 2. No email is sent after cron job runs".
7. **69E entry gets no email.** R7 expected: "No email is sent after cronjob runs". R17 note: "69E, test to make sure it doesnt trigger the email notification".
8. **Pre-go-live quotations are ignored.** R14 expected: "No email is sent for the quotations that are generated before the go live time". Likely tied to the new DB column in R27 `[unconfirmed]`.
9. **Link reaches step 1 when logged in; login page when not.** R9 and R10 expected 1.
10. **Cross-company access blocked.** R12 expected: "The system redirects to the homepage"; the quotation is absent from the other company's listing.
11. **Email link points to production on staging.** R10 and R13 Remarks: "Link redirects to prod environment - Existing behaviour". Accepted as existing behaviour, not raised as a bug.
12. **Same-company Sub UCD can complete via the link.** R11 scenario: "User = Sub UCD in same company". The steps say "As a Main UCD, click "Complete Purchase Now" button", so who actually clicks is unclear `[unconfirmed]`.
13. **Forwarded link.** R20: "Forward email link (will check same UCD who get the quotaiton or not)"; col F "confirmed in Teams".
14. **BO must not land on the UCD main page.** R29: "Backoffice SHOULD NOT go to the main page"; R24: "Test Backoffice access". No scenario covers it.

## 5. Test data, environments, accounts, setup

1. **Accounts:** Main UCD, Sub UCD (same company), Main UCD from a different company. No usernames or passwords in the sheet.
2. **Insurers:** Lonpac, Chubb, Takaful, Tokio Marine, "Multiple Insurance" (TS13). Notes R15–R18 col G/I give the mix-and-match grid: Lonpac/eSTM, Tokio Marine/Banner, Chubb/Get Free Quote, Takaful/69E.
3. **Entry points:** Get Free Quote, eSTM (eLKM unticked), Banner on eSTM details, 69E (VEL000069E via eSim), email button.
4. **Vehicle numbers in Remarks:** HX071–HX083 `[unconfirmed]` that these are vehicle numbers; they match the HX056 style in `knowledge/flow-quotation-reminder.md` § 5g.
5. **Mailtrap** is the inbox for every email check.
6. **Environment:** not stated in the sheet. Knowledge records uat1 for this ticket (`knowledge/environments-history.md:64`).
7. **Second browser / incognito** needed for TS09 and TS12.
8. **Senior-QA note:** R21: "Check with senior QA if email need to test with insurance API or not, need to check cover note also - Can mainly check with eSim".

## 6. Gaps or risks a regression should still cover

1. **Backoffice link access** (R24, R29) has no scenario and no result.
2. **Email link opens production** from staging (TS09/TS12 remarks). A regression on staging cannot click through end to end on a fresh browser.
3. **Exactly 23:00** boundary is not tested; TS07 uses the window after 23:01.
4. **Recipient for a Sub-UCD quotation** is only "ensure the correct user received the email"; no case states which user is correct.
5. **Draft-status quotations** (Teams: Draft also gets the email, `knowledge/teams-decisions-by-ticket.md:339`) have no explicit case.
6. **Expired quotation + link** — no case clicks the button after the 24-hour expiry.
7. **Content checked by eye only.** No row asserts subject wording or the link URL.
8. **Sub-tasks raised** during testing (Jira): "EAINT-12199 [eAuto - Insurance] Mailtrap not receiving email after cronjob runs" and "EAINT-12213 [eAuto - Insurance] Email is generated for insurance that does not have eSTM". Regression should recheck TS05 because of 12213.

## Contradictions with knowledge/

1. **Case count.** `knowledge/flow-quotation-reminder.md:19` says "12 cases `11864_TS01`–`11864_TS12`". SharePoint has **13 + 4 regression**.
2. **Insurers per case.** flow § 7 says TS02 "Tokio Marine", TS03 "Chubb", TS04 "Takaful". SharePoint: TS02 **Chubb** (R3), TS03 **Takaful** (R4), TS04 **Tokio Marine** (R5). The flow § 12.5 note that the dashboard labels "do not match the team sheet" is therefore reversed: the dashboard (TS03 Takaful, TS04 Tokio Marine) **matches** SharePoint.
3. **TS04 stop step.** flow § 7 quotes "Stop at Insurance Page Step 1"; SharePoint R5 step 4: "Stop at Insurance Page Step 3". The automation's step-3 stop is no longer a deviation.
4. **Sender typo.** flow § 2 and eauto-insurance.md say the script writes "imonitor@auto.my". SharePoint R2–R4 write "imonitor@eauto.my".
5. **TS10 wording.** flow § 2/§ 11 quote "click 'Complete Purchase Now' button that is received by Main UCD". SharePoint R11 step 1: "As a Main UCD, click "Complete Purchase Now" button".
6. **TS09/TS12 prod redirect** is not recorded anywhere in knowledge.

## Knowledge candidates

1. **TS13 rule — pre-go-live quotations get no email.** Source: SharePoint TS sheet `11864` R14, "No email is sent for the quotations that are generated before the go live time". Target: `knowledge/flow-quotation-reminder.md` § 2.
2. **On-the-hour transaction emails at the next hour.** Source: sheet `11864` R3 expected 5, "(if transaction is on 9:00am, email must be sent on 10:00am)". Target: flow-quotation-reminder § 2 Scheduler row.
3. **Email link opens production from staging — existing behaviour.** Source: sheet `11864` R10 and R13 Remarks, "Link redirects to prod environment - Existing behaviour". Target: flow-quotation-reminder § 3 entry 5 / § 11.
4. **Correct the case table** (insurers TS02/TS03/TS04, TS04 step 3, 13 cases + Regression sheet, sender spelling). Source: SharePoint TS rows R3–R5, R2–R4 expected 4. Target: flow-quotation-reminder § 7, § 12.5; eauto-insurance.md § Quotation reminder email.
5. **Regression set for this ticket** = 4 entry points × 4 insurers, check BO Insurance Transaction Listing, Insurance Payment Transaction and CIBO. Source: sheet `Regression` R2–R5. Target: `knowledge/production-regression-scope.md` or flow-quotation-reminder.
6. **Sub-tasks raised during testing:** EAINT-12199 (Mailtrap not receiving email after cron) and EAINT-12213 (email generated for insurance without eSTM). Source: Jira capture, field "Sub-tasks". Target: `knowledge/cr-ledger.md` § EAINT-11864.
7. **SharePoint copy is newer than the local workbook.** Source: this study (SharePoint modified 19/08/2026; local copy read as 12 cases). Target: flow-quotation-reminder line 17–19 — point to the SharePoint text copy.
